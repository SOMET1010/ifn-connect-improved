import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { 
  createOrder,
  getOrdersByMerchant,
  updateOrderStatus,
  getAvailableProducts,
  getOrderStats
} from '../db-orders';

export const ordersRouter = router({
  /**
   * Liste des produits disponibles au marché
   */
  availableProducts: protectedProcedure
    .query(async () => {
      const products = await getAvailableProducts();
      return products;
    }),

  /**
   * Créer une nouvelle commande
   */
  create: protectedProcedure
    .input(z.object({
      merchantId: z.number(),
      productId: z.number(),
      quantity: z.number().positive(),
      unitPrice: z.number().positive(),
      totalAmount: z.number().positive(),
      deliveryDate: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      const order = await createOrder(input);
      return order;
    }),

  /**
   * Liste des commandes d'un marchand
   */
  listByMerchant: protectedProcedure
    .input(z.object({
      merchantId: z.number(),
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    }))
    .query(async ({ input }) => {
      const orders = await getOrdersByMerchant(
        input.merchantId,
        input.limit,
        input.offset
      );
      return orders;
    }),

  /**
   * Mettre à jour le statut d'une commande
   */
  updateStatus: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      status: z.enum(['pending', 'confirmed', 'delivered', 'cancelled']),
    }))
    .mutation(async ({ input }) => {
      const result = await updateOrderStatus(input.orderId, input.status);
      return result;
    }),

  /**
   * Statistiques des commandes d'un marchand
   */
  stats: protectedProcedure
    .input(z.object({
      merchantId: z.number(),
    }))
    .query(async ({ input }) => {
      const stats = await getOrderStats(input.merchantId);
      return stats;
    }),
});
