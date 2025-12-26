import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { users, merchants, actors, markets } from '../../drizzle/schema';
import { storagePut } from '../storage';
import { randomBytes } from 'crypto';
import { eq, sql } from 'drizzle-orm';
import { listMerchants, getAgentStats, getMerchantsByMarket } from '../db-agent';

/**
 * Générer un code marchand unique au format MRC-XXXXX
 */
async function generateMerchantCode(): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  let code: string;
  let exists = true;

  // Générer un code unique
  while (exists) {
    const randomNumber = Math.floor(10000 + Math.random() * 90000); // 5 chiffres
    code = `MRC-${randomNumber}`;

    // Vérifier si le code existe déjà
    const existing = await db
      .select()
      .from(merchants)
      .where(eq(merchants.merchantNumber, code))
      .limit(1);

    exists = existing.length > 0;
  }

  return code!;
}

/**
 * Upload une photo en base64 vers S3
 */
async function uploadPhotoToS3(base64Data: string, filename: string): Promise<string> {
  // Extraire les données de l'image (enlever le préfixe data:image/jpeg;base64,)
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Format de données invalide');
  }

  const imageBuffer = Buffer.from(matches[2], 'base64');
  const mimeType = matches[1];

  // Générer un nom de fichier unique
  const randomSuffix = randomBytes(8).toString('hex');
  const fileKey = `enrollment/${filename}-${randomSuffix}.jpg`;

  // Upload vers S3
  const { url } = await storagePut(fileKey, imageBuffer, mimeType);

  return url;
}

export const agentRouter = router({
  /**
   * Liste des marchands enrôlés avec pagination
   */
  listMerchants: publicProcedure
    .input(
      z.object({
        page: z.number().optional(),
        limit: z.number().optional(),
        search: z.string().optional(),
        marketId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await listMerchants(input);
    }),

  /**
   * Statistiques de l'agent
   */
  stats: publicProcedure.query(async () => {
    return await getAgentStats();
  }),

  /**
   * Marchands groupés par marché (pour la carte)
   */
  merchantsByMarket: publicProcedure.query(async () => {
    return await getMerchantsByMarket();
  }),

  /**
   * Enrôler un nouveau marchand
   */
  enrollMerchant: publicProcedure
    .input(
      z.object({
        // Informations personnelles
        fullName: z.string().min(1),
        phone: z.string().length(10),
        dateOfBirth: z.string(),

        // Photos (base64)
        idPhoto: z.string(),
        licensePhoto: z.string(),

        // Localisation
        latitude: z.number(),
        longitude: z.number(),
        marketId: z.number(),

        // Couverture sociale (optionnel)
        hasCNPS: z.boolean(),
        cnpsNumber: z.string().optional(),
        hasCMU: z.boolean(),
        cmuNumber: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      try {
        // 1. Générer le code marchand unique
        const merchantCode = await generateMerchantCode();

        // 2. Upload des photos vers S3
        const idPhotoUrl = await uploadPhotoToS3(input.idPhoto, `${merchantCode}-id`);
        const licensePhotoUrl = await uploadPhotoToS3(input.licensePhoto, `${merchantCode}-license`);

        // 3. Créer l'utilisateur
        const [newUser] = await db
          .insert(users)
          .values({
            openId: `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: input.fullName,
            phone: input.phone,
            role: 'merchant',
          })
          .$returningId();

        // 4. Créer le marchand
        await db.insert(merchants).values({
          userId: newUser.id,
          merchantNumber: merchantCode,
          businessName: input.fullName, // Utiliser le nom comme nom d'entreprise par défaut
          latitude: input.latitude.toString(),
          longitude: input.longitude.toString(),
          cnpsStatus: input.hasCNPS ? 'active' : 'inactive',
          cnpsNumber: input.cnpsNumber || null,
          cmuStatus: input.hasCMU ? 'active' : 'inactive',
          cmuNumber: input.cmuNumber || null,
          enrolledAt: new Date(),
        });

        // 5. Récupérer le nom du marché
        const market = await db
          .select()
          .from(markets)
          .where(eq(markets.id, input.marketId))
          .limit(1);

        // 6. Créer l'acteur (pour historique)
        await db.insert(actors).values({
          actorKey: merchantCode,
          marketId: input.marketId,
          marketName: market[0]?.name || 'Marché inconnu',
          fullName: input.fullName,
          phone: input.phone,
          identifierCode: input.cnpsNumber || input.cmuNumber || null,
          sourceFile: 'enrollment-wizard',
        });

        return {
          success: true,
          merchantCode,
          message: `Enrôlement réussi ! Code marchand: ${merchantCode}`,
        };
      } catch (error) {
        console.error('Erreur lors de l\'enrôlement:', error);
        throw new Error('Erreur lors de l\'enrôlement du marchand');
      }
    }),

  /**
   * Récupérer les tâches du jour pour un agent
   * - Marchands inactifs (> 7 jours sans vente)
   * - Enrôlements incomplets (photos/GPS manquants)
   * - Renouvellements CNPS/CMU à suivre
   * - Objectifs hebdomadaires
   */
  getTasks: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const tasks: any[] = [];

    // 1. Marchands inactifs (> 7 jours sans vente)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const inactiveMerchants: any = await db.execute(sql`
      SELECT 
        m.id,
        m.merchant_number as merchantNumber,
        m.business_name as businessName,
        m.phone,
        m.location,
        MAX(s.created_at) as lastSaleDate,
        DATEDIFF(NOW(), MAX(s.created_at)) as daysSinceLastSale
      FROM merchants m
      LEFT JOIN sales s ON m.id = s.merchant_id
      GROUP BY m.id
      HAVING lastSaleDate IS NULL OR lastSaleDate < ${sevenDaysAgo.toISOString()}
      ORDER BY lastSaleDate ASC
      LIMIT 20
    `);

    (inactiveMerchants.rows || inactiveMerchants || []).forEach((merchant: any) => {
      tasks.push({
        id: `inactive-${merchant.id}`,
        type: 'inactive_merchant',
        priority: 'high',
        title: `Marchand inactif : ${merchant.businessName}`,
        description: merchant.lastSaleDate 
          ? `Aucune vente depuis ${merchant.daysSinceLastSale} jours`
          : 'Aucune vente enregistrée',
        merchantId: merchant.id,
        merchantNumber: merchant.merchantNumber,
        location: merchant.location,
        createdAt: new Date(),
      });
    });

    // 2. Enrôlements incomplets (GPS manquant)
    const incompleteMerchants = await db
      .select({
        id: merchants.id,
        merchantNumber: merchants.merchantNumber,
        businessName: merchants.businessName,
        location: merchants.location,
        latitude: merchants.latitude,
        longitude: merchants.longitude,
      })
      .from(merchants)
      .where(
        sql`${merchants.latitude} IS NULL 
            OR ${merchants.longitude} IS NULL`
      )
      .limit(10);

    incompleteMerchants.forEach(merchant => {
      tasks.push({
        id: `incomplete-${merchant.id}`,
        type: 'incomplete_enrollment',
        priority: 'medium',
        title: `Enrôlement incomplet : ${merchant.businessName}`,
        description: `Élément manquant : Géolocalisation`,
        merchantId: merchant.id,
        merchantNumber: merchant.merchantNumber,
        location: merchant.location,
        createdAt: new Date(),
      });
    });

    // 3. Renouvellements CNPS/CMU à suivre (expirant dans les 30 prochains jours)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringCoverage = await db
      .select({
        id: merchants.id,
        merchantNumber: merchants.merchantNumber,
        businessName: merchants.businessName,
        location: merchants.location,
        cnpsExpiryDate: merchants.cnpsExpiryDate,
        cmuExpiryDate: merchants.cmuExpiryDate,
        cnpsStatus: merchants.cnpsStatus,
        cmuStatus: merchants.cmuStatus,
      })
      .from(merchants)
      .where(
        sql`(
          (${merchants.cnpsExpiryDate} IS NOT NULL AND ${merchants.cnpsExpiryDate} <= ${thirtyDaysFromNow.toISOString()} AND ${merchants.cnpsStatus} = 'active')
          OR
          (${merchants.cmuExpiryDate} IS NOT NULL AND ${merchants.cmuExpiryDate} <= ${thirtyDaysFromNow.toISOString()} AND ${merchants.cmuStatus} = 'active')
        )`
      )
      .limit(15);

    expiringCoverage.forEach(merchant => {
      const expiring = [];
      if (merchant.cnpsExpiryDate && new Date(merchant.cnpsExpiryDate) <= thirtyDaysFromNow) {
        const daysUntil = Math.ceil((new Date(merchant.cnpsExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        expiring.push(`CNPS (dans ${daysUntil} jours)`);
      }
      if (merchant.cmuExpiryDate && new Date(merchant.cmuExpiryDate) <= thirtyDaysFromNow) {
        const daysUntil = Math.ceil((new Date(merchant.cmuExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        expiring.push(`CMU (dans ${daysUntil} jours)`);
      }

      tasks.push({
        id: `expiring-${merchant.id}`,
        type: 'expiring_coverage',
        priority: 'high',
        title: `Renouvellement à suivre : ${merchant.businessName}`,
        description: `Expiration proche : ${expiring.join(', ')}`,
        merchantId: merchant.id,
        merchantNumber: merchant.merchantNumber,
        location: merchant.location,
        createdAt: new Date(),
      });
    });

    // 4. Objectifs hebdomadaires
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [weeklyEnrollments]: any = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM merchants
      WHERE created_at >= ${startOfWeek.toISOString()}
    `);

    const enrollmentsThisWeek = Number((weeklyEnrollments.rows?.[0] || weeklyEnrollments[0])?.count || 0);
    const weeklyGoal = 10; // Objectif : 10 enrôlements par semaine

    tasks.push({
      id: 'weekly-goal',
      type: 'weekly_goal',
      priority: 'low',
      title: 'Objectif hebdomadaire',
      description: `${enrollmentsThisWeek} / ${weeklyGoal} enrôlements cette semaine`,
      progress: Math.min(100, Math.round((enrollmentsThisWeek / weeklyGoal) * 100)),
      createdAt: new Date(),
    });

    // Trier les tâches par priorité (high > medium > low)
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    tasks.sort((a, b) => priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]);

    return tasks;
  }),
});
