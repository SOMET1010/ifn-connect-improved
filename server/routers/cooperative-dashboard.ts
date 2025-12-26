import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import {
  cooperatives,
  cooperativeMembers,
  merchants,
  users,
  merchantStock,
  products,
  sales,
} from '../../drizzle/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

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

export const cooperativeDashboardRouter = router({
  /**
   * Récupérer les informations de la coopérative
   */
  getCooperativeInfo: cooperativeProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const [cooperative] = await db
      .select()
      .from(cooperatives)
      .where(eq(cooperatives.userId, ctx.user.id))
      .limit(1);

    if (!cooperative) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Coopérative introuvable' });
    }

    return cooperative;
  }),

  /**
   * Récupérer la liste des membres de la coopérative
   */
  getMembers: cooperativeProcedure.query(async ({ ctx }) => {
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

    // Récupérer les membres
    const members = await db
      .select({
        id: cooperativeMembers.id,
        merchantId: merchants.id,
        merchantNumber: merchants.merchantNumber,
        businessName: merchants.businessName,
        businessType: merchants.businessType,
        location: merchants.location,
        userName: users.name,
        userPhone: users.phone,
        joinedAt: cooperativeMembers.joinedAt,
        isActive: cooperativeMembers.isActive,
      })
      .from(cooperativeMembers)
      .innerJoin(merchants, eq(cooperativeMembers.merchantId, merchants.id))
      .innerJoin(users, eq(merchants.userId, users.id))
      .where(
        and(
          eq(cooperativeMembers.cooperativeId, cooperative.id),
          eq(cooperativeMembers.isActive, true)
        )
      )
      .orderBy(desc(cooperativeMembers.joinedAt));

    return members;
  }),

  /**
   * Consolider les besoins en stock des membres
   */
  getConsolidatedNeeds: cooperativeProcedure.query(async ({ ctx }) => {
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

    // Récupérer les IDs des marchands membres
    const memberIds = await db
      .select({ merchantId: cooperativeMembers.merchantId })
      .from(cooperativeMembers)
      .where(
        and(
          eq(cooperativeMembers.cooperativeId, cooperative.id),
          eq(cooperativeMembers.isActive, true)
        )
      );

    if (memberIds.length === 0) {
      return [];
    }

    const merchantIdsList = memberIds.map((m) => m.merchantId);

    // Consolider les stocks par produit
    const consolidatedStock = await db
      .select({
        productId: products.id,
        productName: products.name,
        productCategory: products.category,
        productUnit: products.unit,
        totalQuantity: sql<number>`SUM(${merchantStock.quantity})`,
        merchantCount: sql<number>`COUNT(DISTINCT ${merchantStock.merchantId})`,
        avgQuantity: sql<number>`AVG(${merchantStock.quantity})`,
      })
      .from(merchantStock)
      .innerJoin(products, eq(merchantStock.productId, products.id))
      .where(sql`${merchantStock.merchantId} IN (${sql.join(merchantIdsList, sql`, `)})`)
      .groupBy(products.id, products.name, products.category, products.unit)
      .orderBy(desc(sql`SUM(${merchantStock.quantity})`));

    return consolidatedStock;
  }),

  /**
   * Récupérer les statistiques agrégées de la coopérative
   */
  getAggregatedStats: cooperativeProcedure.query(async ({ ctx }) => {
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

    // Récupérer les IDs des marchands membres
    const memberIds = await db
      .select({ merchantId: cooperativeMembers.merchantId })
      .from(cooperativeMembers)
      .where(
        and(
          eq(cooperativeMembers.cooperativeId, cooperative.id),
          eq(cooperativeMembers.isActive, true)
        )
      );

    if (memberIds.length === 0) {
      return {
        totalMembers: 0,
        totalRevenue: 0,
        totalStock: 0,
        totalSales: 0,
      };
    }

    const merchantIdsList = memberIds.map((m) => m.merchantId);

    // Calculer le CA total
    const [revenueResult] = await db
      .select({
        totalRevenue: sql<number>`SUM(${sales.totalAmount})`,
        totalSales: sql<number>`COUNT(*)`,
      })
      .from(sales)
      .where(sql`${sales.merchantId} IN (${sql.join(merchantIdsList, sql`, `)})`);

    // Calculer la quantité totale du stock
    const [stockResult] = await db
      .select({
        totalStock: sql<number>`SUM(${merchantStock.quantity})`,
      })
      .from(merchantStock)
      .where(sql`${merchantStock.merchantId} IN (${sql.join(merchantIdsList, sql`, `)})`);

    return {
      totalMembers: memberIds.length,
      totalRevenue: revenueResult.totalRevenue || 0,
      totalStockQuantity: stockResult.totalStock || 0,
      totalSales: revenueResult.totalSales || 0,
    };
  }),

  /**
   * Ajouter un marchand à la coopérative
   */
  addMember: cooperativeProcedure
    .input(z.object({ merchantId: z.number() }))
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

      // Vérifier que le marchand existe
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.id, input.merchantId))
        .limit(1);

      if (!merchant) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Marchand introuvable' });
      }

      // Vérifier que le marchand n'est pas déjà membre
      const [existingMember] = await db
        .select()
        .from(cooperativeMembers)
        .where(
          and(
            eq(cooperativeMembers.cooperativeId, cooperative.id),
            eq(cooperativeMembers.merchantId, input.merchantId)
          )
        )
        .limit(1);

      if (existingMember) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Ce marchand est déjà membre' });
      }

      // Ajouter le membre
      await db.insert(cooperativeMembers).values({
        cooperativeId: cooperative.id,
        merchantId: input.merchantId,
      });

      // Mettre à jour le compteur de membres
      await db
        .update(cooperatives)
        .set({ totalMembers: cooperative.totalMembers + 1 })
        .where(eq(cooperatives.id, cooperative.id));

      return { success: true };
    }),
});
