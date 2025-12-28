import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { 
  createSale, 
  getSalesByMerchant, 
  getTodayStats, 
  getSalesHistory,
  getLast7DaysSales,
  getTopProducts,
  getTotalBalance,
  getLowStockCount
} from '../db-sales';
import { getMerchantByUserId } from '../db-merchant';

export const salesRouter = router({
  /**
   * Créer une nouvelle vente
   */
  create: protectedProcedure
    .input(z.object({
      productId: z.number(),
      quantity: z.number().positive(),
      unitPrice: z.number().positive(),
      paymentMethod: z.enum(['cash', 'mobile_money', 'credit']).optional(),
      paymentProvider: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Récupérer le merchantId depuis le contexte utilisateur
      const merchant = await getMerchantByUserId(ctx.user.id);
      if (!merchant) {
        throw new Error('Merchant not found');
      }
      
      // Calculer le montant total automatiquement
      const totalAmount = input.quantity * input.unitPrice;
      
      const result = await createSale({
        ...input,
        merchantId: merchant.id,
        totalAmount,
      });
      return result;
    }),

  /**
   * Liste des ventes d'un marchand
   */
  listByMerchant: protectedProcedure
    .input(z.object({
      merchantId: z.number(),
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    }))
    .query(async ({ input }) => {
      const sales = await getSalesByMerchant(
        input.merchantId,
        input.limit,
        input.offset
      );
      return sales;
    }),

  /**
   * Statistiques d'hier pour comparaison
   */
  yesterdayStats: protectedProcedure
    .input(z.object({
      merchantId: z.number(),
    }))
    .query(async ({ input }) => {
      // Calculer hier
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);
      
      const stats = await getSalesHistory({
        merchantId: input.merchantId,
        startDate: yesterday,
        endDate: yesterdayEnd,
      });
      
      const totalAmount = stats.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
      
      return {
        totalAmount,
        totalSales: stats.length,
      };
    }),

  /**
   * Statistiques du jour pour un marchand
   */
  todayStats: protectedProcedure
    .input(z.object({
      merchantId: z.number(),
    }))
    .query(async ({ input }) => {
      const stats = await getTodayStats(input.merchantId);
      return stats;
    }),

  /**
   * Historique des ventes avec filtres
   */
  history: protectedProcedure
    .input(z.object({
      merchantId: z.number(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      productId: z.number().optional(),
      limit: z.number().optional().default(100),
      offset: z.number().optional().default(0),
    }))
    .query(async ({ input }) => {
      const sales = await getSalesHistory(input);
      return sales;
    }),

  /**
   * Ventes des 7 derniers jours (pour graphique)
   */
  last7Days: protectedProcedure
    .input(z.object({
      merchantId: z.number(),
    }))
    .query(async ({ input }) => {
      const data = await getLast7DaysSales(input.merchantId);
      return data;
    }),

  /**
   * Top 5 des produits les plus vendus
   */
  topProducts: protectedProcedure
    .input(z.object({
      merchantId: z.number(),
      limit: z.number().optional().default(5),
    }))
    .query(async ({ input }) => {
      const products = await getTopProducts(input.merchantId, input.limit);
      return products;
    }),

  /**
   * Solde total du marchand
   */
  totalBalance: protectedProcedure
    .input(z.object({
      merchantId: z.number(),
    }))
    .query(async ({ input }) => {
      const balance = await getTotalBalance(input.merchantId);
      return balance;
    }),

  /**
   * Nombre de produits en stock bas
   */
  lowStockCount: protectedProcedure
    .input(z.object({
      merchantId: z.number(),
      threshold: z.number().optional().default(10),
    }))
    .query(async ({ input }) => {
      const count = await getLowStockCount(input.merchantId, input.threshold);
      return count;
    }),

  /**
   * Historique des ventes avec filtres avancés et statistiques
   */
  historyWithFilters: protectedProcedure
    .input(z.object({
      merchantId: z.number(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      productId: z.number().optional(),
      paymentMethod: z.enum(['cash', 'mobile_money', 'credit']).optional(),
      limit: z.number().optional().default(20),
      offset: z.number().optional().default(0),
    }))
    .query(async ({ input }) => {
      const db = await import('../db').then(m => m.getDb());
      if (!db) return { sales: [], total: 0, stats: null };

      const { sales, products } = await import('../../drizzle/schema');
      const { eq, and, gte, lte, desc, count, sum, avg } = await import('drizzle-orm');

      // Construire les conditions de filtrage
      const conditions = [eq(sales.merchantId, input.merchantId)];
      
      if (input.startDate) {
        conditions.push(gte(sales.saleDate, input.startDate));
      }
      
      if (input.endDate) {
        conditions.push(lte(sales.saleDate, input.endDate));
      }
      
      if (input.productId) {
        conditions.push(eq(sales.productId, input.productId));
      }
      
      if (input.paymentMethod) {
        conditions.push(eq(sales.paymentMethod, input.paymentMethod));
      }

      // Récupérer les ventes avec pagination
      const salesData = await db
        .select({
          id: sales.id,
          productId: sales.productId,
          productName: products.name,
          productNameDioula: products.nameDioula,
          quantity: sales.quantity,
          unitPrice: sales.unitPrice,
          totalAmount: sales.totalAmount,
          paymentMethod: sales.paymentMethod,
          paymentProvider: sales.paymentProvider,
          saleDate: sales.saleDate,
        })
        .from(sales)
        .leftJoin(products, eq(sales.productId, products.id))
        .where(and(...conditions))
        .orderBy(desc(sales.saleDate))
        .limit(input.limit)
        .offset(input.offset);

      // Compter le total de ventes
      const totalCount = await db
        .select({ count: count() })
        .from(sales)
        .where(and(...conditions));

      // Calculer les statistiques
      const stats = await db
        .select({
          totalSales: count(),
          totalAmount: sum(sales.totalAmount),
          averageAmount: avg(sales.totalAmount),
        })
        .from(sales)
        .where(and(...conditions));

      return {
        sales: salesData,
        total: totalCount[0]?.count || 0,
        stats: {
          totalSales: Number(stats[0]?.totalSales || 0),
          totalAmount: Number(stats[0]?.totalAmount || 0),
          averageAmount: Number(stats[0]?.averageAmount || 0),
        },
      };
    }),

  /**
   * Comparaison des ventes d'hier vs avant-hier (pour briefing matinal)
   */
  yesterdayComparison: protectedProcedure
    .input(z.object({
      merchantId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await import('../db').then(m => m.getDb());
      if (!db) return null;

      const { sales } = await import('../../drizzle/schema');
      const { eq, and, gte, lt, sum } = await import('drizzle-orm');

      // Calculer les dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const dayBeforeYesterday = new Date(today);
      dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);

      // Ventes d'hier
      const yesterdaySales = await db
        .select({
          total: sum(sales.totalAmount),
          count: sum(sales.quantity),
        })
        .from(sales)
        .where(
          and(
            eq(sales.merchantId, input.merchantId),
            gte(sales.saleDate, yesterday),
            lt(sales.saleDate, today)
          )
        );

      // Ventes d'avant-hier
      const dayBeforeSales = await db
        .select({
          total: sum(sales.totalAmount),
          count: sum(sales.quantity),
        })
        .from(sales)
        .where(
          and(
            eq(sales.merchantId, input.merchantId),
            gte(sales.saleDate, dayBeforeYesterday),
            lt(sales.saleDate, yesterday)
          )
        );

      const yesterdayTotal = Number(yesterdaySales[0]?.total || 0);
      const yesterdayCount = Number(yesterdaySales[0]?.count || 0);
      const dayBeforeTotal = Number(dayBeforeSales[0]?.total || 0);
      const dayBeforeCount = Number(dayBeforeSales[0]?.count || 0);

      // Calculer les variations
      const totalDifference = yesterdayTotal - dayBeforeTotal;
      const totalPercentChange = dayBeforeTotal > 0 
        ? ((totalDifference / dayBeforeTotal) * 100)
        : (yesterdayTotal > 0 ? 100 : 0);

      const countDifference = yesterdayCount - dayBeforeCount;
      const countPercentChange = dayBeforeCount > 0
        ? ((countDifference / dayBeforeCount) * 100)
        : (yesterdayCount > 0 ? 100 : 0);

      return {
        yesterday: {
          total: yesterdayTotal,
          count: yesterdayCount,
          date: yesterday.toISOString().split('T')[0],
        },
        dayBefore: {
          total: dayBeforeTotal,
          count: dayBeforeCount,
          date: dayBeforeYesterday.toISOString().split('T')[0],
        },
        comparison: {
          totalDifference,
          totalPercentChange: Math.round(totalPercentChange * 10) / 10,
          countDifference,
          countPercentChange: Math.round(countPercentChange * 10) / 10,
          trend: totalDifference > 0 ? 'up' : totalDifference < 0 ? 'down' : 'stable',
        },
      };
    }),
});
