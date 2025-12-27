import { z } from 'zod';
import { merchantProcedure, protectedProcedure, router } from '../_core/trpc';
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
  create: merchantProcedure
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
  listByMerchant: merchantProcedure
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
      status: z.enum(['pending', 'confirmed', 'preparing', 'in_transit', 'delivered', 'cancelled']),
    }))
    .mutation(async ({ input }) => {
      const result = await updateOrderStatus(input.orderId, input.status);
      return result;
    }),

  /**
   * Statistiques des commandes d'un marchand
   */
  stats: merchantProcedure
    .input(z.object({
      merchantId: z.number(),
    }))
    .query(async ({ input }) => {
      const stats = await getOrderStats(input.merchantId);
      return stats;
    }),

  /**
   * Récupérer les détails d'une commande avec timeline
   */
  getDetails: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const db = await (await import('../db')).getDb();
      if (!db) throw new Error('Database connection failed');

      const { virtualMarketOrders, products, merchants, cooperatives } = await import('../../drizzle/schema');
      const { eq } = await import('drizzle-orm');

      const [order] = await db
        .select({
          id: virtualMarketOrders.id,
          quantity: virtualMarketOrders.quantity,
          unitPrice: virtualMarketOrders.unitPrice,
          totalAmount: virtualMarketOrders.totalAmount,
          status: virtualMarketOrders.status,
          orderDate: virtualMarketOrders.orderDate,
          deliveryDate: virtualMarketOrders.deliveryDate,
          createdAt: virtualMarketOrders.createdAt,
          updatedAt: virtualMarketOrders.updatedAt,
          productName: products.name,
          productUnit: products.unit,
          merchantName: merchants.businessName,
          cooperativeName: cooperatives.cooperativeName,
        })
        .from(virtualMarketOrders)
        .leftJoin(products, eq(virtualMarketOrders.productId, products.id))
        .leftJoin(merchants, eq(virtualMarketOrders.merchantId, merchants.id))
        .leftJoin(cooperatives, eq(virtualMarketOrders.cooperativeId, cooperatives.id))
        .where(eq(virtualMarketOrders.id, input.orderId))
        .limit(1);

      if (!order) {
        throw new Error('Commande introuvable');
      }

      return order;
    }),
});
