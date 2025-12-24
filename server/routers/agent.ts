import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { users, merchants, actors, markets } from '../../drizzle/schema';
import { storagePut } from '../storage';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';

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
});
