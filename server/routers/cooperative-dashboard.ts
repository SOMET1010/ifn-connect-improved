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
  groupedOrders,
  groupedOrderParticipants,
  groupOrderPayments,
} from '../../drizzle/schema';
import { eq, and, sql, desc, gte, lte, between } from 'drizzle-orm';

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
   * 🆕 KPIs avancés des commandes groupées
   */
  getGroupedOrdersKPIs: cooperativeProcedure.query(async ({ ctx }) => {
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

    // Statistiques globales des commandes groupées
    const [stats] = await db
      .select({
        totalOrders: sql<number>`COUNT(*)`,
        draftOrders: sql<number>`SUM(CASE WHEN ${groupedOrders.status} = 'draft' THEN 1 ELSE 0 END)`,
        confirmedOrders: sql<number>`SUM(CASE WHEN ${groupedOrders.status} = 'confirmed' THEN 1 ELSE 0 END)`,
        preparingOrders: sql<number>`SUM(CASE WHEN ${groupedOrders.status} = 'preparing' THEN 1 ELSE 0 END)`,
        inTransitOrders: sql<number>`SUM(CASE WHEN ${groupedOrders.status} = 'in_transit' THEN 1 ELSE 0 END)`,
        deliveredOrders: sql<number>`SUM(CASE WHEN ${groupedOrders.status} = 'delivered' THEN 1 ELSE 0 END)`,
        totalAmount: sql<number>`SUM(CAST(${groupedOrders.totalAmount} AS DECIMAL(10,2)))`,
        totalQuantity: sql<number>`SUM(${groupedOrders.totalQuantity})`,
      })
      .from(groupedOrders)
      .where(eq(groupedOrders.cooperativeId, cooperative.id));

    // Calculer les économies réalisées (différence entre prix unitaire initial et prix avec palier)
    // Pour simplifier, on calcule 15% d'économie moyenne sur les commandes livrées
    const deliveredAmount = stats.totalAmount || 0;
    const estimatedSavings = deliveredAmount * 0.15;

    // Compter les participants actifs (membres ayant participé à au moins une commande)
    const [participantsResult] = await db
      .select({
        activeParticipants: sql<number>`COUNT(DISTINCT ${groupedOrderParticipants.merchantId})`,
      })
      .from(groupedOrderParticipants)
      .innerJoin(groupedOrders, eq(groupedOrderParticipants.groupedOrderId, groupedOrders.id))
      .where(eq(groupedOrders.cooperativeId, cooperative.id));

    return {
      totalOrders: stats.totalOrders || 0,
      draftOrders: stats.draftOrders || 0,
      confirmedOrders: stats.confirmedOrders || 0,
      preparingOrders: stats.preparingOrders || 0,
      inTransitOrders: stats.inTransitOrders || 0,
      deliveredOrders: stats.deliveredOrders || 0,
      totalAmount: stats.totalAmount || 0,
      totalQuantity: stats.totalQuantity || 0,
      estimatedSavings,
      activeParticipants: participantsResult.activeParticipants || 0,
    };
  }),

  /**
   * 🆕 Évolution des commandes groupées sur 12 mois
   */
  getGroupedOrdersTrend: cooperativeProcedure
    .input(z.object({ months: z.number().default(12) }))
    .query(async ({ ctx, input }) => {
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

      // Calculer la date de début (X mois en arrière)
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - input.months);

      // Récupérer les commandes groupées par mois
      const trend = await db
        .select({
          month: sql<string>`DATE_FORMAT(${groupedOrders.createdAt}, '%Y-%m')`,
          orderCount: sql<number>`COUNT(*)`,
          totalAmount: sql<number>`SUM(CAST(${groupedOrders.totalAmount} AS DECIMAL(10,2)))`,
          totalQuantity: sql<number>`SUM(${groupedOrders.totalQuantity})`,
        })
        .from(groupedOrders)
        .where(
          and(
            eq(groupedOrders.cooperativeId, cooperative.id),
            gte(groupedOrders.createdAt, startDate)
          )
        )
        .groupBy(sql`DATE_FORMAT(${groupedOrders.createdAt}, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(${groupedOrders.createdAt}, '%Y-%m')`);

      return trend;
    }),

  /**
   * 🆕 Top produits commandés
   */
  getTopProducts: cooperativeProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
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

      // Top produits par volume total commandé
      const topProducts = await db
        .select({
          productName: groupedOrders.productName,
          orderCount: sql<number>`COUNT(*)`,
          totalQuantity: sql<number>`SUM(${groupedOrders.totalQuantity})`,
          totalAmount: sql<number>`SUM(CAST(${groupedOrders.totalAmount} AS DECIMAL(10,2)))`,
        })
        .from(groupedOrders)
        .where(eq(groupedOrders.cooperativeId, cooperative.id))
        .groupBy(groupedOrders.productName)
        .orderBy(desc(sql`SUM(${groupedOrders.totalQuantity})`))
        .limit(input.limit);

      return topProducts;
    }),

  /**
   * 🆕 Alertes de stock bas (produits avec stock critique chez plusieurs membres)
   */
  getStockAlerts: cooperativeProcedure.query(async ({ ctx }) => {
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

    // Produits en stock bas (< minThreshold) chez au moins 30% des membres
    const threshold = Math.ceil(merchantIdsList.length * 0.3);

    const alerts = await db
      .select({
        productId: products.id,
        productName: products.name,
        productCategory: products.category,
        productUnit: products.unit,
        merchantsAffected: sql<number>`COUNT(DISTINCT ${merchantStock.merchantId})`,
        avgQuantity: sql<number>`AVG(${merchantStock.quantity})`,
        minQuantity: sql<number>`MIN(${merchantStock.quantity})`,
      })
      .from(merchantStock)
      .innerJoin(products, eq(merchantStock.productId, products.id))
      .where(
        and(
          sql`${merchantStock.merchantId} IN (${sql.join(merchantIdsList, sql`, `)})`,
          sql`${merchantStock.quantity} < ${merchantStock.minThreshold}`
        )
      )
      .groupBy(products.id, products.name, products.category, products.unit)
      .having(sql`COUNT(DISTINCT ${merchantStock.merchantId}) >= ${threshold}`)
      .orderBy(desc(sql`COUNT(DISTINCT ${merchantStock.merchantId})`));

    return alerts;
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
