import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import {
  cooperatives,
  cooperativeMembers,
  groupedOrders,
  groupedOrderParticipants,
} from '../../drizzle/schema';
import { eq, and, sql } from 'drizzle-orm';
import { generateMonthlyReport, generateProductReport } from '../cooperative-reports';
import { storagePut } from '../storage';

/**
 * Middleware pour vérifier que l'utilisateur est une coopérative
 */
const cooperativeProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'cooperative') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Accès réservé aux coopératives',
    });
  }
  return next({ ctx });
});

export const cooperativeReportsRouter = router({
  /**
   * Générer un rapport mensuel PDF
   */
  generateMonthly: cooperativeProcedure
    .input(z.object({ month: z.string(), year: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Récupérer la coopérative
      const [cooperative] = await db
        .select()
        .from(cooperatives)
        .where(eq(cooperatives.userId, ctx.user.id))
        .limit(1);

      if (!cooperative) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Coopérative introuvable' });
      }

      // Récupérer les KPIs
      const [kpis] = await db
        .select({
          totalOrders: sql<number>`COUNT(*)`,
          totalAmount: sql<number>`SUM(CAST(${groupedOrders.totalAmount} AS DECIMAL(10,2)))`,
        })
        .from(groupedOrders)
        .where(eq(groupedOrders.cooperativeId, cooperative.id));

      const estimatedSavings = (kpis.totalAmount || 0) * 0.15;

      const [participantsResult] = await db
        .select({
          activeParticipants: sql<number>`COUNT(DISTINCT ${groupedOrderParticipants.merchantId})`,
        })
        .from(groupedOrderParticipants)
        .innerJoin(groupedOrders, eq(groupedOrderParticipants.groupedOrderId, groupedOrders.id))
        .where(eq(groupedOrders.cooperativeId, cooperative.id));

      // Récupérer les tendances (12 mois)
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 12);

      const trend = await db
        .select({
          month: sql<string>`DATE_FORMAT(${groupedOrders.createdAt}, '%Y-%m')`,
          orderCount: sql<number>`COUNT(*)`,
          totalAmount: sql<number>`SUM(CAST(${groupedOrders.totalAmount} AS DECIMAL(10,2)))`,
        })
        .from(groupedOrders)
        .where(eq(groupedOrders.cooperativeId, cooperative.id))
        .groupBy(sql`DATE_FORMAT(${groupedOrders.createdAt}, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(${groupedOrders.createdAt}, '%Y-%m')`);

      // Récupérer les top 5 produits
      const topProducts = await db
        .select({
          productName: groupedOrders.productName,
          totalQuantity: sql<number>`SUM(${groupedOrders.totalQuantity})`,
          totalAmount: sql<number>`SUM(CAST(${groupedOrders.totalAmount} AS DECIMAL(10,2)))`,
        })
        .from(groupedOrders)
        .where(eq(groupedOrders.cooperativeId, cooperative.id))
        .groupBy(groupedOrders.productName)
        .orderBy(sql`SUM(${groupedOrders.totalQuantity}) DESC`)
        .limit(5);

      // Générer le PDF
      const pdfBuffer = await generateMonthlyReport({
        cooperativeName: cooperative.cooperativeName,
        month: input.month,
        year: input.year,
        totalRevenue: kpis.totalAmount || 0,
        totalSavings: estimatedSavings,
        totalOrders: kpis.totalOrders || 0,
        activeParticipants: participantsResult.activeParticipants || 0,
        topProducts: topProducts.map(p => ({
          productName: p.productName,
          totalQuantity: p.totalQuantity,
          totalAmount: p.totalAmount,
        })),
        trend: trend.map(t => ({
          month: t.month,
          orderCount: t.orderCount,
          totalAmount: t.totalAmount,
        })),
      });

      // Uploader le PDF vers S3
      const fileName = `rapport-mensuel-${input.year}-${input.month}.pdf`;
      const fileKey = `cooperative-reports/${cooperative.id}/${fileName}`;
      const { url } = await storagePut(fileKey, pdfBuffer, 'application/pdf');

      return { success: true, url, fileName };
    }),

  /**
   * Générer un rapport par produit PDF
   */
  generateProduct: cooperativeProcedure
    .input(z.object({ productName: z.string(), period: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Récupérer la coopérative
      const [cooperative] = await db
        .select()
        .from(cooperatives)
        .where(eq(cooperatives.userId, ctx.user.id))
        .limit(1);

      if (!cooperative) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Coopérative introuvable' });
      }

      // Récupérer les statistiques du produit
      const [productStats] = await db
        .select({
          totalOrders: sql<number>`COUNT(*)`,
          totalQuantity: sql<number>`SUM(${groupedOrders.totalQuantity})`,
          totalAmount: sql<number>`SUM(CAST(${groupedOrders.totalAmount} AS DECIMAL(10,2)))`,
          participantsCount: sql<number>`COUNT(DISTINCT ${groupedOrderParticipants.merchantId})`,
        })
        .from(groupedOrders)
        .leftJoin(groupedOrderParticipants, eq(groupedOrders.id, groupedOrderParticipants.groupedOrderId))
        .where(
          and(
            eq(groupedOrders.cooperativeId, cooperative.id),
            eq(groupedOrders.productName, input.productName)
          )
        );

      const averagePrice = productStats.totalQuantity > 0 
        ? productStats.totalAmount / productStats.totalQuantity 
        : 0;

      // Récupérer les tendances mensuelles du produit
      const trend = await db
        .select({
          month: sql<string>`DATE_FORMAT(${groupedOrders.createdAt}, '%Y-%m')`,
          quantity: sql<number>`SUM(${groupedOrders.totalQuantity})`,
          amount: sql<number>`SUM(CAST(${groupedOrders.totalAmount} AS DECIMAL(10,2)))`,
        })
        .from(groupedOrders)
        .where(
          and(
            eq(groupedOrders.cooperativeId, cooperative.id),
            eq(groupedOrders.productName, input.productName)
          )
        )
        .groupBy(sql`DATE_FORMAT(${groupedOrders.createdAt}, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(${groupedOrders.createdAt}, '%Y-%m')`);

      // Générer le PDF
      const pdfBuffer = await generateProductReport({
        cooperativeName: cooperative.cooperativeName,
        productName: input.productName,
        period: input.period,
        totalOrders: productStats.totalOrders,
        totalQuantity: productStats.totalQuantity,
        totalAmount: productStats.totalAmount,
        averagePrice,
        participantsCount: productStats.participantsCount,
        trend: trend.map(t => ({
          month: t.month,
          quantity: t.quantity,
          amount: t.amount,
        })),
      });

      // Uploader le PDF vers S3
      const fileName = `rapport-produit-${input.productName.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
      const fileKey = `cooperative-reports/${cooperative.id}/${fileName}`;
      const { url } = await storagePut(fileKey, pdfBuffer, 'application/pdf');

      return { success: true, url, fileName };
    }),
});
