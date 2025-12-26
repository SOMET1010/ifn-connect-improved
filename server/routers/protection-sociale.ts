/**
 * Protection Sociale Router
 * 
 * Endpoints unifiés pour gérer CNPS et CMU ensemble
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { merchants, cnpsPayments, cmuReimbursements } from '../../drizzle/schema';
import { eq, desc, and, gte, sql } from 'drizzle-orm';

export const protectionSocialeRouter = router({
  /**
   * Récupérer le statut global de protection sociale du marchand
   * Retourne les informations CNPS et CMU avec alertes d'expiration
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database unavailable');

    // Récupérer les informations du marchand
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.userId, ctx.user.id))
      .limit(1);

    if (!merchant) {
      throw new Error('Merchant not found');
    }

    // Calculer les jours restants avant expiration
    const now = new Date();
    const cnpsDaysRemaining = merchant.cnpsExpiryDate
      ? Math.ceil((merchant.cnpsExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const cmuDaysRemaining = merchant.cmuExpiryDate
      ? Math.ceil((merchant.cmuExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Déterminer le niveau d'alerte
    const getCriticalityLevel = (days: number | null) => {
      if (days === null) return 'none';
      if (days < 0) return 'expired';
      if (days <= 7) return 'critical';
      if (days <= 30) return 'warning';
      return 'good';
    };

    return {
      cnps: {
        number: merchant.cnpsNumber,
        status: merchant.cnpsStatus,
        expiryDate: merchant.cnpsExpiryDate,
        daysRemaining: cnpsDaysRemaining,
        criticalityLevel: getCriticalityLevel(cnpsDaysRemaining),
      },
      cmu: {
        number: merchant.cmuNumber,
        status: merchant.cmuStatus,
        expiryDate: merchant.cmuExpiryDate,
        daysRemaining: cmuDaysRemaining,
        criticalityLevel: getCriticalityLevel(cmuDaysRemaining),
      },
      merchantId: merchant.id,
    };
  }),

  /**
   * Récupérer l'historique consolidé des paiements CNPS et CMU
   */
  getPaymentHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        type: z.enum(['all', 'cnps', 'cmu']).default('all'),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      // Récupérer le merchant
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.userId, ctx.user.id))
        .limit(1);

      if (!merchant) {
        throw new Error('Merchant not found');
      }

      const transactions: Array<{
        id: number;
        type: 'cnps' | 'cmu';
        amount: string;
        date: Date;
        status: string;
        reference: string;
        description: string | null;
      }> = [];

      // Récupérer les paiements CNPS
      if (input.type === 'all' || input.type === 'cnps') {
        const cnpsTransactions = await db
          .select({
            id: cnpsPayments.id,
            amount: cnpsPayments.amount,
            date: cnpsPayments.paymentDate,
            status: cnpsPayments.status,
            reference: cnpsPayments.reference,
            description: cnpsPayments.description,
          })
          .from(cnpsPayments)
          .where(eq(cnpsPayments.merchantId, merchant.id))
          .orderBy(desc(cnpsPayments.paymentDate))
          .limit(input.limit)
          .offset(input.offset);

        transactions.push(
          ...cnpsTransactions.map((t) => ({
            ...t,
            type: 'cnps' as const,
          }))
        );
      }

      // Récupérer les remboursements CMU
      if (input.type === 'all' || input.type === 'cmu') {
        const cmuTransactions = await db
          .select({
            id: cmuReimbursements.id,
            amount: cmuReimbursements.totalAmount,
            date: cmuReimbursements.careDate,
            status: cmuReimbursements.status,
            reference: cmuReimbursements.reference,
            description: cmuReimbursements.description,
          })
          .from(cmuReimbursements)
          .where(eq(cmuReimbursements.merchantId, merchant.id))
          .orderBy(desc(cmuReimbursements.careDate))
          .limit(input.limit)
          .offset(input.offset);

        transactions.push(
          ...cmuTransactions.map((t) => ({
            ...t,
            type: 'cmu' as const,
          }))
        );
      }

      // Trier par date décroissante
      transactions.sort((a, b) => b.date.getTime() - a.date.getTime());

      return {
        transactions: transactions.slice(0, input.limit),
        hasMore: transactions.length > input.limit,
      };
    }),

  /**
   * Récupérer les statistiques pour les graphiques
   */
  getStatistics: protectedProcedure
    .input(
      z.object({
        period: z.enum(['3months', '6months', '1year', 'all']).default('1year'),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      // Récupérer le merchant
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.userId, ctx.user.id))
        .limit(1);

      if (!merchant) {
        throw new Error('Merchant not found');
      }

      // Calculer la date de début selon la période
      const now = new Date();
      const startDate = new Date();
      switch (input.period) {
        case '3months':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case '6months':
          startDate.setMonth(now.getMonth() - 6);
          break;
        case '1year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case 'all':
          startDate.setFullYear(2020, 0, 1); // Début arbitraire
          break;
      }

      // Statistiques CNPS
      const cnpsStats = await db
        .select({
          totalAmount: sql<number>`COALESCE(SUM(CAST(${cnpsPayments.amount} AS DECIMAL(10,2))), 0)`,
          totalCount: sql<number>`COUNT(*)`,
          completedCount: sql<number>`SUM(CASE WHEN ${cnpsPayments.status} = 'completed' THEN 1 ELSE 0 END)`,
        })
        .from(cnpsPayments)
        .where(
          and(
            eq(cnpsPayments.merchantId, merchant.id),
            gte(cnpsPayments.paymentDate, startDate)
          )
        );

      // Statistiques CMU
      const cmuStats = await db
        .select({
          totalAmount: sql<number>`COALESCE(SUM(CAST(${cmuReimbursements.totalAmount} AS DECIMAL(10,2))), 0)`,
          totalCount: sql<number>`COUNT(*)`,
          approvedCount: sql<number>`SUM(CASE WHEN ${cmuReimbursements.status} = 'approved' THEN 1 ELSE 0 END)`,
        })
        .from(cmuReimbursements)
        .where(
          and(
            eq(cmuReimbursements.merchantId, merchant.id),
            gte(cmuReimbursements.careDate, startDate)
          )
        );

      // Paiements par mois (derniers 12 mois)
      const monthlyPayments = await db
        .select({
          month: sql<string>`DATE_FORMAT(${cnpsPayments.paymentDate}, '%Y-%m')`,
          amount: sql<number>`SUM(CAST(${cnpsPayments.amount} AS DECIMAL(10,2)))`,
        })
        .from(cnpsPayments)
        .where(
          and(
            eq(cnpsPayments.merchantId, merchant.id),
            gte(cnpsPayments.paymentDate, new Date(now.getFullYear(), now.getMonth() - 11, 1))
          )
        )
        .groupBy(sql`DATE_FORMAT(${cnpsPayments.paymentDate}, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(${cnpsPayments.paymentDate}, '%Y-%m')`);

      return {
        cnps: {
          totalAmount: cnpsStats[0]?.totalAmount || 0,
          totalTransactions: cnpsStats[0]?.totalCount || 0,
          successRate:
            cnpsStats[0]?.totalCount > 0
              ? ((cnpsStats[0]?.completedCount || 0) / cnpsStats[0].totalCount) * 100
              : 0,
        },
        cmu: {
          totalAmount: cmuStats[0]?.totalAmount || 0,
          totalTransactions: cmuStats[0]?.totalCount || 0,
          approvalRate:
            cmuStats[0]?.totalCount > 0
              ? ((cmuStats[0]?.approvedCount || 0) / cmuStats[0].totalCount) * 100
              : 0,
        },
        monthlyTrend: monthlyPayments.map((m) => ({
          month: m.month,
          amount: m.amount,
        })),
      };
    }),
});
