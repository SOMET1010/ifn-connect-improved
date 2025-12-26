import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { merchants, sales, users, merchantActivity, merchantSocialProtection, merchantEditHistory } from '../../drizzle/schema';
import { eq, and, gte, sql, desc, count } from 'drizzle-orm';

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
});

