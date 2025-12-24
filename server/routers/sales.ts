import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { 
  createSale, 
  getSalesByMerchant, 
  getTodayStats, 
  getSalesHistory 
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
});
