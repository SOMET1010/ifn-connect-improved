import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import {
  merchants,
  merchantSocialProtection,
  cnpsPayments,
  cmuReimbursements,
} from '../../drizzle/schema';
import { eq, and, sql, desc, gte } from 'drizzle-orm';

/**
 * Middleware pour vérifier que l'utilisateur est un marchand
 */
const merchantProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'merchant') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Accès réservé aux marchands',
    });
  }

  const db = await getDb();
  if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

  // Récupérer le marchand
  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.userId, ctx.user.id))
    .limit(1);

  if (!merchant) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Marchand introuvable' });
  }

  return next({ ctx: { ...ctx, merchant } });
});

export const merchantSocialRouter = router({
  /**
   * Récupérer les informations CNPS du marchand
   */
  getCnpsInfo: merchantProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    // Récupérer les informations de protection sociale
    const [socialProtection] = await db
      .select()
      .from(merchantSocialProtection)
      .where(eq(merchantSocialProtection.merchantId, ctx.merchant.id))
      .limit(1);

    if (!socialProtection) {
      return {
        hasCNPS: false,
        cnpsNumber: null,
        cnpsStatus: 'pending',
        cnpsExpiryDate: null,
        balance: 0,
      };
    }

    // Calculer le solde total des cotisations
    const [balanceResult] = await db
      .select({
        totalPaid: sql<number>`COALESCE(SUM(CAST(${cnpsPayments.amount} AS DECIMAL(10,2))), 0)`,
      })
      .from(cnpsPayments)
      .where(
        and(
          eq(cnpsPayments.merchantId, ctx.merchant.id),
          eq(cnpsPayments.status, 'completed')
        )
      );

    return {
      hasCNPS: socialProtection.hasCNPS,
      cnpsNumber: socialProtection.cnpsNumber,
      cnpsStatus: socialProtection.cnpsStatus,
      cnpsStartDate: socialProtection.cnpsStartDate,
      cnpsExpiryDate: socialProtection.cnpsExpiryDate,
      balance: balanceResult.totalPaid || 0,
    };
  }),

  /**
   * Récupérer l'historique des paiements CNPS
   */
  getCnpsPayments: merchantProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const payments = await db
        .select()
        .from(cnpsPayments)
        .where(eq(cnpsPayments.merchantId, ctx.merchant.id))
        .orderBy(desc(cnpsPayments.paymentDate))
        .limit(input.limit);

      return payments;
    }),

  /**
   * Récupérer l'évolution des cotisations CNPS (12 mois)
   */
  getCnpsTrend: merchantProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);

    const trend = await db
      .select({
        month: sql<string>`DATE_FORMAT(${cnpsPayments.paymentDate}, '%Y-%m')`,
        totalAmount: sql<number>`SUM(CAST(${cnpsPayments.amount} AS DECIMAL(10,2)))`,
        paymentCount: sql<number>`COUNT(*)`,
      })
      .from(cnpsPayments)
      .where(
        and(
          eq(cnpsPayments.merchantId, ctx.merchant.id),
          eq(cnpsPayments.status, 'completed'),
          gte(cnpsPayments.paymentDate, startDate)
        )
      )
      .groupBy(sql`DATE_FORMAT(${cnpsPayments.paymentDate}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${cnpsPayments.paymentDate}, '%Y-%m')`);

    return trend;
  }),

  /**
   * Simulateur de pension CNPS
   */
  simulatePension: merchantProcedure
    .input(
      z.object({
        age: z.number().min(18).max(100),
        yearsContributed: z.number().min(0).max(50),
        averageSalary: z.number().min(0),
      })
    )
    .query(async ({ input }) => {
      // Formule simplifiée de calcul de pension CNPS
      // Taux de remplacement : 2% par année de cotisation
      // Maximum : 80% du salaire moyen
      const replacementRate = Math.min(input.yearsContributed * 0.02, 0.8);
      const monthlyPension = input.averageSalary * replacementRate;

      // Âge minimum de départ à la retraite : 60 ans
      const retirementAge = 60;
      const yearsUntilRetirement = Math.max(0, retirementAge - input.age);

      // Estimation du total des cotisations nécessaires
      // Taux de cotisation : 16% du salaire (employeur + employé)
      const contributionRate = 0.16;
      const monthlyContribution = input.averageSalary * contributionRate;
      const totalContributionsNeeded = monthlyContribution * 12 * yearsUntilRetirement;

      return {
        monthlyPension: Math.round(monthlyPension),
        replacementRate: Math.round(replacementRate * 100),
        yearsUntilRetirement,
        monthlyContribution: Math.round(monthlyContribution),
        totalContributionsNeeded: Math.round(totalContributionsNeeded),
        eligibleForRetirement: input.age >= retirementAge && input.yearsContributed >= 15,
      };
    }),

  /**
   * Récupérer les informations CMU du marchand
   */
  getCmuInfo: merchantProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    // Récupérer les informations de protection sociale
    const [socialProtection] = await db
      .select()
      .from(merchantSocialProtection)
      .where(eq(merchantSocialProtection.merchantId, ctx.merchant.id))
      .limit(1);

    if (!socialProtection) {
      return {
        hasCMU: false,
        cmuNumber: null,
        cmuStatus: 'pending',
        cmuExpiryDate: null,
        totalReimbursed: 0,
      };
    }

    // Calculer le total des remboursements
    const [reimbursementResult] = await db
      .select({
        totalReimbursed: sql<number>`COALESCE(SUM(CAST(${cmuReimbursements.reimbursedAmount} AS DECIMAL(10,2))), 0)`,
      })
      .from(cmuReimbursements)
      .where(
        and(
          eq(cmuReimbursements.merchantId, ctx.merchant.id),
          eq(cmuReimbursements.status, 'paid')
        )
      );

    return {
      hasCMU: socialProtection.hasCMU,
      cmuNumber: socialProtection.cmuNumber,
      cmuStatus: socialProtection.cmuStatus,
      cmuStartDate: socialProtection.cmuStartDate,
      cmuExpiryDate: socialProtection.cmuExpiryDate,
      totalReimbursed: reimbursementResult.totalReimbursed || 0,
    };
  }),

  /**
   * Récupérer l'historique des remboursements CMU
   */
  getCmuReimbursements: merchantProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const reimbursements = await db
        .select()
        .from(cmuReimbursements)
        .where(eq(cmuReimbursements.merchantId, ctx.merchant.id))
        .orderBy(desc(cmuReimbursements.careDate))
        .limit(input.limit);

      return reimbursements;
    }),

  /**
   * Récupérer l'évolution des remboursements CMU (12 mois)
   */
  getCmuTrend: merchantProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);

    const trend = await db
      .select({
        month: sql<string>`DATE_FORMAT(${cmuReimbursements.careDate}, '%Y-%m')`,
        totalReimbursed: sql<number>`SUM(CAST(${cmuReimbursements.reimbursedAmount} AS DECIMAL(10,2)))`,
        reimbursementCount: sql<number>`COUNT(*)`,
      })
      .from(cmuReimbursements)
      .where(
        and(
          eq(cmuReimbursements.merchantId, ctx.merchant.id),
          eq(cmuReimbursements.status, 'paid'),
          gte(cmuReimbursements.careDate, startDate)
        )
      )
      .groupBy(sql`DATE_FORMAT(${cmuReimbursements.careDate}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${cmuReimbursements.careDate}, '%Y-%m')`);

    return trend;
  }),

  /**
   * Simulateur de remboursements CMU
   */
  simulateReimbursement: merchantProcedure
    .input(
      z.object({
        careType: z.enum([
          'consultation',
          'hospitalization',
          'medication',
          'surgery',
          'dental',
          'optical',
          'maternity',
          'emergency',
          'other',
        ]),
        totalAmount: z.number().min(0),
      })
    )
    .query(async ({ input }) => {
      // Taux de remboursement CMU par type de soin (simplifié)
      const reimbursementRates: Record<string, number> = {
        consultation: 0.8, // 80%
        hospitalization: 0.9, // 90%
        medication: 0.7, // 70%
        surgery: 0.95, // 95%
        dental: 0.6, // 60%
        optical: 0.5, // 50%
        maternity: 1.0, // 100%
        emergency: 1.0, // 100%
        other: 0.5, // 50%
      };

      const rate = reimbursementRates[input.careType] || 0.5;
      const reimbursedAmount = input.totalAmount * rate;
      const remainingAmount = input.totalAmount - reimbursedAmount;

      return {
        totalAmount: input.totalAmount,
        reimbursedAmount: Math.round(reimbursedAmount),
        remainingAmount: Math.round(remainingAmount),
        reimbursementRate: Math.round(rate * 100),
        careType: input.careType,
      };
    }),
});
