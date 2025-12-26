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

export const salesRouter = router({
  /**
   * Créer une nouvelle vente
   */
  create: protectedProcedure
    .input(z.object({
      merchantId: z.number(),
      productId: z.number(),
      quantity: z.number().positive(),
      unitPrice: z.number().positive(),
      totalAmount: z.number().positive(),
      paymentMethod: z.enum(['cash', 'mobile_money', 'credit']).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Vérifier que l'utilisateur est bien le marchand ou un admin
      if (ctx.user.role !== 'admin') {
        // TODO: Vérifier que ctx.user.id correspond au merchantId
      }
      
      const result = await createSale(input);
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
});
