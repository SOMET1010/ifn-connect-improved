import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import ExcelJS from 'exceljs';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { merchants, sales, users, merchantActivity, merchantSocialProtection, merchantEditHistory, auditLogs } from '../../drizzle/schema';
import { eq, and, gte, sql, desc, count, like, or } from 'drizzle-orm';

/**
 * Middleware pour vérifier que l'utilisateur est admin
 */
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Accès réservé aux administrateurs',
    });
  }
  return next({ ctx });
});

export const adminRouter = router({
  /**
   * Obtenir les statistiques globales pour le dashboard DGE/ANSUT
   */
  getStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    // 1. Nombre total de marchands enrôlés
    const totalMerchantsResult = await db
      .select({ count: count() })
      .from(merchants);
    const totalMerchants = totalMerchantsResult[0]?.count || 0;

    // 2. Volume total des transactions (FCFA)
    const totalVolumeResult = await db
      .select({ total: sql<number>`SUM(${sales.totalAmount})` })
      .from(sales);
    const totalVolume = totalVolumeResult[0]?.total || 0;

    // 3. Taux de couverture sociale (% avec CNPS + CMU actifs)
    const coveredMerchantsResult = await db
      .select({ count: count() })
      .from(merchants)
      .where(
        and(
          eq(merchants.cnpsStatus, 'active'),
          eq(merchants.cmuStatus, 'active')
        )
      );
    const coveredMerchants = coveredMerchantsResult[0]?.count || 0;
    const coverageRate = totalMerchants > 0 ? (coveredMerchants / totalMerchants) * 100 : 0;

    // 4. Taux d'adoption (% marchands actifs dans les 30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeMerchantsResult = await db
      .selectDistinct({ merchantId: sales.merchantId })
      .from(sales)
      .where(gte(sales.createdAt, thirtyDaysAgo));
    
    const activeMerchants = activeMerchantsResult.length;
    const adoptionRate = totalMerchants > 0 ? (activeMerchants / totalMerchants) * 100 : 0;

    // 5. Nombre de transactions
    const totalTransactionsResult = await db
      .select({ count: count() })
      .from(sales);
    const totalTransactions = totalTransactionsResult[0]?.count || 0;

    return {
      totalMerchants,
      totalVolume,
      coverageRate: Math.round(coverageRate * 10) / 10, // 1 décimale
      adoptionRate: Math.round(adoptionRate * 10) / 10,
      totalTransactions,
      coveredMerchants,
      activeMerchants,
    };
  }),

  /**
   * Obtenir les marchands avec alertes (CNPS/CMU expirant < 30 jours)
   */
  getMerchantsWithAlerts: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const merchantsWithAlerts = await db
      .select({
        id: merchants.id,
        merchantNumber: merchants.merchantNumber,
        businessName: merchants.businessName,
        location: merchants.location,
        cnpsStatus: merchants.cnpsStatus,
        cmuStatus: merchants.cmuStatus,
        cnpsExpiryDate: merchants.cnpsExpiryDate,
        cmuExpiryDate: merchants.cmuExpiryDate,
      })
      .from(merchants)
      .where(
        sql`(${merchants.cnpsExpiryDate} IS NOT NULL AND ${merchants.cnpsExpiryDate} <= ${thirtyDaysFromNow.toISOString()})
         OR (${merchants.cmuExpiryDate} IS NOT NULL AND ${merchants.cmuExpiryDate} <= ${thirtyDaysFromNow.toISOString()})`
      )
      .orderBy(merchants.cnpsExpiryDate);

    return merchantsWithAlerts.map((m: any) => {
      const now = new Date();
      let cnpsDaysLeft = null;
      let cmuDaysLeft = null;

      if (m.cnpsExpiryDate) {
        const expiry = new Date(m.cnpsExpiryDate);
        cnpsDaysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }

      if (m.cmuExpiryDate) {
        const expiry = new Date(m.cmuExpiryDate);
        cmuDaysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        ...m,
        cnpsDaysLeft,
        cmuDaysLeft,
      };
    });
  }),

  /**
   * Obtenir les marchands inactifs (> 30 jours sans vente)
   */
  getInactiveMerchants: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Obtenir tous les marchands
    const allMerchants = await db
      .select({
        id: merchants.id,
        merchantNumber: merchants.merchantNumber,
        businessName: merchants.businessName,
        location: merchants.location,
        createdAt: merchants.createdAt,
      })
      .from(merchants);

    // Obtenir les marchands actifs (avec ventes dans les 30 derniers jours)
    const activeMerchantIds = await db
      .selectDistinct({ merchantId: sales.merchantId })
      .from(sales)
      .where(gte(sales.createdAt, thirtyDaysAgo));

    const activeMerchantIdSet = new Set(activeMerchantIds.map((m: { merchantId: number }) => m.merchantId));

    // Filtrer les marchands inactifs
    const inactiveMerchants = allMerchants.filter((m: { id: number }) => !activeMerchantIdSet.has(m.id));

    // Obtenir la dernière vente pour chaque marchand inactif
    const inactiveMerchantsWithLastSale = await Promise.all(
      inactiveMerchants.map(async (m: any) => {
        const lastSaleResult = await db
          .select({ createdAt: sales.createdAt })
          .from(sales)
          .where(eq(sales.merchantId, m.id))
          .orderBy(desc(sales.createdAt))
          .limit(1);

        const lastSaleDate = lastSaleResult[0]?.createdAt || m.createdAt;
        const daysSinceLastSale = Math.floor(
          (Date.now() - new Date(lastSaleDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          ...m,
          lastSaleDate,
          daysSinceLastSale,
        };
      })
    );

    return inactiveMerchantsWithLastSale.sort((a: any, b: any) => b.daysSinceLastSale - a.daysSinceLastSale);
  }),

  /**
   * Obtenir la tendance des enrôlements (par mois, 12 derniers mois)
   */
  getEnrollmentTrend: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const enrollments = await db
      .select({
        month: sql<string>`DATE_FORMAT(${merchants.createdAt}, '%Y-%m')`,
        count: count(),
      })
      .from(merchants)
      .where(gte(merchants.createdAt, twelveMonthsAgo))
      .groupBy(sql`DATE_FORMAT(${merchants.createdAt}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${merchants.createdAt}, '%Y-%m')`);

    return enrollments;
  }),

  /**
   * Obtenir la tendance des transactions (par mois, 12 derniers mois)
   */
  getTransactionTrend: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const transactions = await db
      .select({
        month: sql<string>`DATE_FORMAT(${sales.createdAt}, '%Y-%m')`,
        count: count(),
        volume: sql<number>`SUM(${sales.totalAmount})`,
      })
      .from(sales)
      .where(gte(sales.createdAt, twelveMonthsAgo))
      .groupBy(sql`DATE_FORMAT(${sales.createdAt}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${sales.createdAt}, '%Y-%m')`);

    return transactions;
  }),

  /**
   * Obtenir la répartition géographique par marché
   */
  getMarketDistribution: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const distribution = await db
      .select({
        market: merchants.location,
        count: count(),
      })
      .from(merchants)
      .groupBy(merchants.location)
      .orderBy(desc(count()));

    return distribution;
  }),

  /**
   * Lister tous les marchands avec filtres et pagination
   */
  listMerchants: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(50),
      search: z.string().optional(),
      cooperative: z.string().optional(),
      hasPhone: z.boolean().optional(),
      isVerified: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const { page, limit, search, cooperative, hasPhone, isVerified } = input;
      const offset = (page - 1) * limit;

      // Construire les conditions de filtrage
      const conditions = [];

      if (search) {
        conditions.push(
          sql`(
            ${merchants.businessName} LIKE ${`%${search}%`} OR
            ${merchants.merchantNumber} LIKE ${`%${search}%`} OR
            ${users.phone} LIKE ${`%${search}%`}
          )`
        );
      }

      if (cooperative) {
        conditions.push(eq(merchants.location, cooperative));
      }

      if (hasPhone !== undefined) {
        if (hasPhone) {
          conditions.push(sql`${users.phone} IS NOT NULL AND ${users.phone} != ''`);
        } else {
          conditions.push(sql`${users.phone} IS NULL OR ${users.phone} = ''`);
        }
      }

      if (isVerified !== undefined) {
        conditions.push(eq(merchants.isVerified, isVerified));
      }

      // Compter le total
      const totalResult = await db
        .select({ count: count() })
        .from(merchants)
        .leftJoin(users, eq(merchants.userId, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const total = totalResult[0]?.count || 0;

      // Récupérer les marchands
      const merchantsList = await db
        .select({
          id: merchants.id,
          merchantNumber: merchants.merchantNumber,
          businessName: merchants.businessName,
          businessType: merchants.businessType,
          location: merchants.location,
          isVerified: merchants.isVerified,
          cnpsStatus: merchants.cnpsStatus,
          cmuStatus: merchants.cmuStatus,
          createdAt: merchants.createdAt,
          userId: users.id,
          userName: users.name,
          userPhone: users.phone,
          userEmail: users.email,
        })
        .from(merchants)
        .leftJoin(users, eq(merchants.userId, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(merchants.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        merchants: merchantsList,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  /**
   * Obtenir les statistiques pour la page admin marchands
   */
  getMerchantsStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    // Total marchands
    const totalResult = await db.select({ count: count() }).from(merchants);
    const total = totalResult[0]?.count || 0;

    // Marchands avec téléphone
    const withPhoneResult = await db
      .select({ count: count() })
      .from(merchants)
      .leftJoin(users, eq(merchants.userId, users.id))
      .where(sql`${users.phone} IS NOT NULL AND ${users.phone} != ''`);
    const withPhone = withPhoneResult[0]?.count || 0;

    // Marchands vérifiés
    const verifiedResult = await db
      .select({ count: count() })
      .from(merchants)
      .where(eq(merchants.isVerified, true));
    const verified = verifiedResult[0]?.count || 0;

    // Coopératives uniques
    const cooperativesResult = await db
      .selectDistinct({ location: merchants.location })
      .from(merchants)
      .where(sql`${merchants.location} IS NOT NULL`);
    const cooperatives = cooperativesResult.length;

    return {
      total,
      withPhone,
      verified,
      cooperatives,
    };
  }),

  /**
   * Obtenir les détails complets d'un marchand pour édition
   */
  getMerchantDetails: adminProcedure
    .input(z.object({ merchantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Récupérer le marchand avec l'utilisateur
      const merchantResult = await db
        .select({
          id: merchants.id,
          merchantNumber: merchants.merchantNumber,
          businessName: merchants.businessName,
          businessType: merchants.businessType,
          location: merchants.location,
          isVerified: merchants.isVerified,
          userId: users.id,
          userPhone: users.phone,
          userEmail: users.email,
        })
        .from(merchants)
        .leftJoin(users, eq(merchants.userId, users.id))
        .where(eq(merchants.id, input.merchantId))
        .limit(1);

      if (!merchantResult[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Marchand non trouvé' });
      }

      const merchant = merchantResult[0];

      // Récupérer l'activité commerciale
      const activityResult = await db
        .select()
        .from(merchantActivity)
        .where(eq(merchantActivity.merchantId, input.merchantId))
        .limit(1);

      // Récupérer la protection sociale
      const socialProtectionResult = await db
        .select()
        .from(merchantSocialProtection)
        .where(eq(merchantSocialProtection.merchantId, input.merchantId))
        .limit(1);

      return {
        ...merchant,
        activity: activityResult[0] || null,
        socialProtection: socialProtectionResult[0] || null,
      };
    }),

  /**
   * Mettre à jour un marchand (informations générales, activité, protection sociale)
   */
  updateMerchant: adminProcedure
    .input(z.object({
      merchantId: z.number(),
      general: z.object({
        businessName: z.string(),
        businessType: z.string().nullable(),
        location: z.string().nullable(),
        phone: z.string().nullable(),
        isVerified: z.boolean(),
      }),
      activity: z.object({
        actorType: z.enum(['grossiste', 'semi-grossiste', 'detaillant']).nullable(),
        products: z.string().nullable(),
        numberOfStores: z.number(),
        tableNumber: z.string().nullable(),
        boxNumber: z.string().nullable(),
        sector: z.string().nullable(),
      }),
      socialProtection: z.object({
        hasCMU: z.boolean(),
        cmuNumber: z.string().nullable(),
        cmuStatus: z.enum(['active', 'inactive', 'pending', 'expired']),
        cmuExpiryDate: z.string().nullable(),
        hasCNPS: z.boolean(),
        cnpsNumber: z.string().nullable(),
        cnpsStatus: z.enum(['active', 'inactive', 'pending', 'expired']),
        cnpsExpiryDate: z.string().nullable(),
        hasRSTI: z.boolean(),
        rstiNumber: z.string().nullable(),
        rstiStatus: z.enum(['active', 'inactive', 'pending', 'expired']),
        rstiExpiryDate: z.string().nullable(),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Récupérer le marchand actuel pour l'historique
      const currentMerchant = await db
        .select()
        .from(merchants)
        .where(eq(merchants.id, input.merchantId))
        .limit(1);

      if (!currentMerchant[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Marchand non trouvé' });
      }

      // Mettre à jour les informations générales du marchand
      await db
        .update(merchants)
        .set({
          businessName: input.general.businessName,
          businessType: input.general.businessType,
          location: input.general.location,
          isVerified: input.general.isVerified,
          updatedAt: new Date(),
        })
        .where(eq(merchants.id, input.merchantId));

      // Mettre à jour le téléphone de l'utilisateur
      if (input.general.phone) {
        await db
          .update(users)
          .set({ phone: input.general.phone })
          .where(eq(users.id, currentMerchant[0].userId));
      }

      // Mettre à jour ou créer l'activité commerciale
      const existingActivity = await db
        .select()
        .from(merchantActivity)
        .where(eq(merchantActivity.merchantId, input.merchantId))
        .limit(1);

      if (existingActivity[0]) {
        await db
          .update(merchantActivity)
          .set({
            actorType: input.activity.actorType,
            products: input.activity.products,
            numberOfStores: input.activity.numberOfStores,
            tableNumber: input.activity.tableNumber,
            boxNumber: input.activity.boxNumber,
            sector: input.activity.sector,
            updatedAt: new Date(),
          })
          .where(eq(merchantActivity.merchantId, input.merchantId));
      } else {
        await db.insert(merchantActivity).values({
          merchantId: input.merchantId,
          actorType: input.activity.actorType,
          products: input.activity.products,
          numberOfStores: input.activity.numberOfStores,
          tableNumber: input.activity.tableNumber,
          boxNumber: input.activity.boxNumber,
          sector: input.activity.sector,
        });
      }

      // Mettre à jour ou créer la protection sociale
      const existingSocialProtection = await db
        .select()
        .from(merchantSocialProtection)
        .where(eq(merchantSocialProtection.merchantId, input.merchantId))
        .limit(1);

      if (existingSocialProtection[0]) {
        await db
          .update(merchantSocialProtection)
          .set({
            hasCMU: input.socialProtection.hasCMU,
            cmuNumber: input.socialProtection.cmuNumber,
            cmuStatus: input.socialProtection.cmuStatus,
            cmuExpiryDate: input.socialProtection.cmuExpiryDate ? new Date(input.socialProtection.cmuExpiryDate) : null,
            hasCNPS: input.socialProtection.hasCNPS,
            cnpsNumber: input.socialProtection.cnpsNumber,
            cnpsStatus: input.socialProtection.cnpsStatus,
            cnpsExpiryDate: input.socialProtection.cnpsExpiryDate ? new Date(input.socialProtection.cnpsExpiryDate) : null,
            hasRSTI: input.socialProtection.hasRSTI,
            rstiNumber: input.socialProtection.rstiNumber,
            rstiStatus: input.socialProtection.rstiStatus,
            rstiExpiryDate: input.socialProtection.rstiExpiryDate ? new Date(input.socialProtection.rstiExpiryDate) : null,
            updatedAt: new Date(),
          })
          .where(eq(merchantSocialProtection.merchantId, input.merchantId));
      } else {
        await db.insert(merchantSocialProtection).values({
          merchantId: input.merchantId,
          hasCMU: input.socialProtection.hasCMU,
          cmuNumber: input.socialProtection.cmuNumber,
          cmuStatus: input.socialProtection.cmuStatus,
          cmuExpiryDate: input.socialProtection.cmuExpiryDate ? new Date(input.socialProtection.cmuExpiryDate) : null,
          hasCNPS: input.socialProtection.hasCNPS,
          cnpsNumber: input.socialProtection.cnpsNumber,
          cnpsStatus: input.socialProtection.cnpsStatus,
          cnpsExpiryDate: input.socialProtection.cnpsExpiryDate ? new Date(input.socialProtection.cnpsExpiryDate) : null,
          hasRSTI: input.socialProtection.hasRSTI,
          rstiNumber: input.socialProtection.rstiNumber,
          rstiStatus: input.socialProtection.rstiStatus,
          rstiExpiryDate: input.socialProtection.rstiExpiryDate ? new Date(input.socialProtection.rstiExpiryDate) : null,
        });
      }

      // Enregistrer l'historique de modification
      await db.insert(merchantEditHistory).values({
        merchantId: input.merchantId,
        editedBy: ctx.user.id,
        fieldName: 'general_update',
        oldValue: JSON.stringify(currentMerchant[0]),
        newValue: JSON.stringify(input),
        action: 'update',
        comment: 'Mise à jour via interface admin',
      });

      return { success: true };
    }),

  /**
   * Vérifier plusieurs marchands en masse
   */
  bulkVerify: adminProcedure
    .input(z.object({
      merchantIds: z.array(z.number()),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Mettre à jour tous les marchands sélectionnés
      for (const merchantId of input.merchantIds) {
        await db
          .update(merchants)
          .set({ isVerified: true, updatedAt: new Date() })
          .where(eq(merchants.id, merchantId));

        // Enregistrer l'historique
        await db.insert(merchantEditHistory).values({
          merchantId,
          editedBy: ctx.user.id,
          fieldName: 'isVerified',
          oldValue: 'false',
          newValue: 'true',
          action: 'bulk_update',
          comment: `Vérification en masse (${input.merchantIds.length} marchands)`,
        });
      }

      return { success: true, count: input.merchantIds.length };
    }),

  /**
   * Envoyer un SMS à plusieurs marchands en masse
   */
  bulkSendSMS: adminProcedure
    .input(z.object({
      merchantIds: z.array(z.number()),
      message: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Récupérer les numéros de téléphone des marchands
      const merchantsWithPhone = await db
        .select({
          merchantId: merchants.id,
          phone: users.phone,
          name: merchants.businessName,
        })
        .from(merchants)
        .leftJoin(users, eq(merchants.userId, users.id))
        .where(sql`${merchants.id} IN (${sql.join(input.merchantIds.map(id => sql`${id}`), sql`, `)})`)
        .execute();

      // Filtrer ceux qui ont un téléphone
      const validPhones = merchantsWithPhone.filter(m => m.phone && m.phone.length === 10);

      // TODO: Intégrer avec un service SMS réel (Twilio, Vonage, etc.)
      // Pour l'instant, on simule l'envoi
      console.log(`[SMS] Envoi à ${validPhones.length} marchands:`, input.message);
      
      // Simuler un délai d'envoi
      await new Promise(resolve => setTimeout(resolve, 500));

      return { 
        success: true, 
        sent: validPhones.length,
        total: input.merchantIds.length,
        message: `SMS envoyé à ${validPhones.length}/${input.merchantIds.length} marchands`,
      };
    }),

  /**
   * Créer un nouveau marchand (CREATE)
   */
  createMerchant: adminProcedure
    .input(z.object({
      name: z.string().min(1, 'Le nom est obligatoire'),
      cooperative: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional().or(z.literal('')),
      category: z.enum(['A', 'B', 'C']).optional(),
      isVerified: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Générer un merchantNumber unique
      const prefix = input.cooperative || 'PNAVIM';
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const merchantNumber = `${prefix}-${timestamp}-${random}`;

      // Créer un utilisateur associé
      const openId = `merchant-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      
      await db
        .insert(users)
        .values({
          openId,
          name: input.name,
          role: 'merchant',
        });
      
      // Récupérer l'utilisateur créé
      const [newUser] = await db
        .select()
        .from(users)
        .where(eq(users.openId, openId))
        .limit(1);

      // Créer le marchand
      await db
        .insert(merchants)
        .values({
          userId: newUser.id,
          merchantNumber,
          businessName: input.name,
          isVerified: input.isVerified,
        });

      // Récupérer le marchand créé
      const [newMerchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.merchantNumber, merchantNumber))
        .limit(1);

      return newMerchant;
    }),

  /**
   * Supprimer un marchand (DELETE individuel)
   */
  deleteMerchant: adminProcedure
    .input(z.object({
      merchantId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Récupérer le marchand pour obtenir userId
      const merchant = await db
        .select()
        .from(merchants)
        .where(eq(merchants.id, input.merchantId))
        .limit(1);

      if (!merchant.length) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Marchand introuvable' });
      }

      const userId = merchant[0].userId;

      // Supprimer les données associées (cascade)
      await db.delete(merchantActivity).where(eq(merchantActivity.merchantId, input.merchantId));
      await db.delete(merchantSocialProtection).where(eq(merchantSocialProtection.merchantId, input.merchantId));
      await db.delete(merchantEditHistory).where(eq(merchantEditHistory.merchantId, input.merchantId));
      await db.delete(sales).where(eq(sales.merchantId, input.merchantId));

      // Supprimer le marchand
      await db.delete(merchants).where(eq(merchants.id, input.merchantId));

      // Supprimer l'utilisateur associé
      if (userId) {
        await db.delete(users).where(eq(users.id, userId));
      }

      return { success: true, message: 'Marchand supprimé avec succès' };
    }),

  /**
   * Supprimer plusieurs marchands en masse (DELETE en masse)
   */
  bulkDeleteMerchants: adminProcedure
    .input(z.object({
      merchantIds: z.array(z.number()).min(1, 'Au moins un marchand doit être sélectionné'),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Récupérer les userIds associés
      const merchantsData = await db
        .select({ userId: merchants.userId })
        .from(merchants)
        .where(sql`${merchants.id} IN (${sql.join(input.merchantIds.map(id => sql`${id}`), sql`, `)})`)
        .execute();

      const userIds = merchantsData.map(m => m.userId).filter(Boolean);

      // Supprimer les données associées pour tous les marchands
      await db.delete(merchantActivity).where(sql`${merchantActivity.merchantId} IN (${sql.join(input.merchantIds.map(id => sql`${id}`), sql`, `)})`);
      await db.delete(merchantSocialProtection).where(sql`${merchantSocialProtection.merchantId} IN (${sql.join(input.merchantIds.map(id => sql`${id}`), sql`, `)})`);
      await db.delete(merchantEditHistory).where(sql`${merchantEditHistory.merchantId} IN (${sql.join(input.merchantIds.map(id => sql`${id}`), sql`, `)})`);
      await db.delete(sales).where(sql`${sales.merchantId} IN (${sql.join(input.merchantIds.map(id => sql`${id}`), sql`, `)})`);

      // Supprimer les marchands
      await db.delete(merchants).where(sql`${merchants.id} IN (${sql.join(input.merchantIds.map(id => sql`${id}`), sql`, `)})`);

      // Supprimer les utilisateurs associés
      if (userIds.length > 0) {
        await db.delete(users).where(sql`${users.id} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`);
      }

      return { 
        success: true, 
        deleted: input.merchantIds.length,
        message: `${input.merchantIds.length} marchand(s) supprimé(s) avec succès`,
      };
    }),

  /**
   * Exporter la liste des marchands en Excel
   */
  exportMerchantsExcel: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    // Récupérer tous les marchands
    const allMerchants = await db
      .select({
        merchantNumber: merchants.merchantNumber,
        businessName: merchants.businessName,
        businessType: merchants.businessType,
        location: merchants.location,
        cnpsStatus: merchants.cnpsStatus,
        cnpsExpiryDate: merchants.cnpsExpiryDate,
        cmuStatus: merchants.cmuStatus,
        cmuExpiryDate: merchants.cmuExpiryDate,
        isVerified: merchants.isVerified,
        createdAt: merchants.createdAt,
      })
      .from(merchants)
      .orderBy(merchants.createdAt);

    // Créer le workbook Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Marchands');

    // Définir les colonnes
    worksheet.columns = [
      { header: 'Code Marchand', key: 'merchantNumber', width: 15 },
      { header: 'Nom Commerce', key: 'businessName', width: 30 },
      { header: 'Type', key: 'businessType', width: 20 },
      { header: 'Localisation', key: 'location', width: 25 },
      { header: 'CNPS', key: 'cnpsStatus', width: 12 },
      { header: 'CNPS Expiration', key: 'cnpsExpiryDate', width: 18 },
      { header: 'CMU', key: 'cmuStatus', width: 12 },
      { header: 'CMU Expiration', key: 'cmuExpiryDate', width: 18 },
      { header: 'Vérifié', key: 'isVerified', width: 12 },
      { header: 'Date Enrôlement', key: 'createdAt', width: 18 },
    ];

    // Styliser l'en-tête
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Ajouter les données
    allMerchants.forEach(merchant => {
      worksheet.addRow({
        merchantNumber: merchant.merchantNumber,
        businessName: merchant.businessName,
        businessType: merchant.businessType || 'N/A',
        location: merchant.location || 'N/A',
        cnpsStatus: merchant.cnpsStatus || 'N/A',
        cnpsExpiryDate: merchant.cnpsExpiryDate ? new Date(merchant.cnpsExpiryDate).toLocaleDateString() : 'N/A',
        cmuStatus: merchant.cmuStatus || 'N/A',
        cmuExpiryDate: merchant.cmuExpiryDate ? new Date(merchant.cmuExpiryDate).toLocaleDateString() : 'N/A',
        isVerified: merchant.isVerified ? 'Oui' : 'Non',
        createdAt: new Date(merchant.createdAt).toLocaleDateString(),
      });
    });

    // Générer le buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return {
      filename: `marchands_${new Date().toISOString().split('T')[0]}.xlsx`,
      data: base64,
      count: allMerchants.length,
    };
  }),

  /**
   * Exporter les transactions en Excel
   */
  exportTransactionsExcel: adminProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Construire la requête avec filtres de date
      let query = db
        .select({
          id: sales.id,
          merchantNumber: merchants.merchantNumber,
          businessName: merchants.businessName,
          totalAmount: sales.totalAmount,
          paymentMethod: sales.paymentMethod,
          createdAt: sales.createdAt,
        })
        .from(sales)
        .innerJoin(merchants, eq(sales.merchantId, merchants.id))
        .orderBy(sales.createdAt);

      // Appliquer les filtres de date si fournis
      if (input.startDate) {
        query = query.where(sql`${sales.createdAt} >= ${input.startDate}`) as any;
      }
      if (input.endDate) {
        query = query.where(sql`${sales.createdAt} <= ${input.endDate}`) as any;
      }

      const transactions = await query;

      // Créer le workbook Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Transactions');

      // Définir les colonnes
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10, style: { numFmt: '@' } },
        { header: 'Code Marchand', key: 'merchantNumber', width: 15 },
        { header: 'Nom Commerce', key: 'businessName', width: 30 },
        { header: 'Montant (FCFA)', key: 'totalAmount', width: 18 },
        { header: 'Méthode Paiement', key: 'paymentMethod', width: 20 },
        { header: 'Date', key: 'createdAt', width: 18 },
      ];

      // Styliser l'en-tête
      worksheet.getRow(1).font = { bold: true, size: 12 };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF70AD47' },
      };
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      // Ajouter les données
      let totalVolume: any = 0;
      transactions.forEach(transaction => {
        totalVolume += Number(transaction.totalAmount);
        worksheet.addRow({
          id: transaction.id,
          merchantNumber: transaction.merchantNumber,
          businessName: transaction.businessName,
          totalAmount: transaction.totalAmount,
          paymentMethod: transaction.paymentMethod || 'N/A',
          createdAt: new Date(transaction.createdAt).toLocaleDateString(),
        });
      });

      // Ajouter une ligne de total
      const totalRow = worksheet.addRow({
        id: '',
        merchantNumber: '',
        businessName: 'TOTAL',
        totalAmount: totalVolume,
        paymentMethod: '',
        createdAt: '',
      });
      totalRow.font = { bold: true };
      totalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2EFDA' },
      };

      // Générer le buffer
      const buffer = await workbook.xlsx.writeBuffer();
      const base64 = Buffer.from(buffer).toString('base64');

      return {
        filename: `transactions_${new Date().toISOString().split('T')[0]}.xlsx`,
        data: base64,
        count: transactions.length,
        totalVolume,
      };
    }),

  /**
   * Exporter les statistiques globales en Excel
   */
  exportStatsExcel: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    // Récupérer les statistiques
    const stats = await db
      .select({
        totalMerchants: count(),
      })
      .from(merchants);

    const [salesStats] = await db
      .select({
        totalTransactions: count(),
        totalVolume: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)`,
      })
      .from(sales);

    const [coverageStats] = await db
      .select({
        coveredMerchants: sql<number>`COUNT(CASE WHEN ${merchants.cnpsStatus} = 'active' OR ${merchants.cmuStatus} = 'active' THEN 1 END)`,
      })
      .from(merchants);

    // Créer le workbook Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Statistiques');

    // Titre
    worksheet.mergeCells('A1:B1');
    worksheet.getCell('A1').value = 'STATISTIQUES GLOBALES - IFN CONNECT';
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    worksheet.getCell('A1').font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 16 };
    worksheet.getRow(1).height = 30;

    // Espacement
    worksheet.addRow([]);

    // Statistiques
    worksheet.addRow(['Indicateur', 'Valeur']);
    worksheet.getRow(3).font = { bold: true };
    worksheet.getRow(3).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' },
    };

    worksheet.addRow(['Nombre total de marchands', stats[0].totalMerchants]);
    worksheet.addRow(['Nombre total de transactions', salesStats.totalTransactions]);
    worksheet.addRow(['Volume total (FCFA)', Number(salesStats.totalVolume)]);
    worksheet.addRow(['Marchands couverts (CNPS/CMU)', coverageStats.coveredMerchants]);
    worksheet.addRow(['Taux de couverture (%)', ((coverageStats.coveredMerchants / stats[0].totalMerchants) * 100).toFixed(1)]);

    // Largeur des colonnes
    worksheet.getColumn(1).width = 35;
    worksheet.getColumn(2).width = 25;

    // Générer le buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return {
      filename: `statistiques_${new Date().toISOString().split('T')[0]}.xlsx`,
      data: base64,
    };
  }),

  /**
   * Récupérer les logs d'audit avec pagination et filtres
   */
  getAuditLogs: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
        action: z.string().optional(),
        entity: z.string().optional(),
        userId: z.number().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const offset = (input.page - 1) * input.limit;

      // Construire les conditions de filtrage
      const conditions = [];
      if (input.action) {
        conditions.push(eq(auditLogs.action, input.action));
      }
      if (input.entity) {
        conditions.push(eq(auditLogs.entity, input.entity));
      }
      if (input.userId) {
        conditions.push(eq(auditLogs.userId, input.userId));
      }
      if (input.search) {
        conditions.push(
          or(
            like(auditLogs.action, `%${input.search}%`),
            like(auditLogs.entity, `%${input.search}%`),
            like(auditLogs.details, `%${input.search}%`)
          )
        );
      }

      // Requête avec jointure sur users pour récupérer le nom
      let query = db
        .select({
          id: auditLogs.id,
          userId: auditLogs.userId,
          userName: users.name,
          action: auditLogs.action,
          entity: auditLogs.entity,
          entityId: auditLogs.entityId,
          details: auditLogs.details,
          ipAddress: auditLogs.ipAddress,
          userAgent: auditLogs.userAgent,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .orderBy(desc(auditLogs.createdAt))
        .limit(input.limit)
        .offset(offset);

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const logs = await query;

      // Compter le total
      const [{ total }] = await db
        .select({ total: count() })
        .from(auditLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        logs,
        total,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
      };
    }),
});

