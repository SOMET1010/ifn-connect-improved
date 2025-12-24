import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { merchants, sales, users } from '../../drizzle/schema';
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
});
