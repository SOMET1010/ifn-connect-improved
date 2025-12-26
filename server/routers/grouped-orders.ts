import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { groupedOrders, groupedOrderParticipants, cooperativeMembers, users, merchants } from '../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Router pour les commandes groupées des coopératives
 */
export const groupedOrdersRouter = router({
  /**
   * Créer une nouvelle commande groupée
   */
  create: protectedProcedure
    .input(
      z.object({
        cooperativeId: z.number(),
        productName: z.string(),
        unitPrice: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Vérifier que l'utilisateur est bien de la coopérative
      const [membership] = await db
        .select()
        .from(cooperativeMembers)
        .where(
          and(
            eq(cooperativeMembers.cooperativeId, input.cooperativeId),
            eq(cooperativeMembers.isActive, true)
          )
        )
        .limit(1);

      if (!membership && ctx.user.role !== 'cooperative' && ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Vous devez être membre de cette coopérative',
        });
      }

      // Créer la commande groupée
      const [order] = await db.insert(groupedOrders).values({
        cooperativeId: input.cooperativeId,
        productName: input.productName,
        totalQuantity: 0,
        unitPrice: input.unitPrice?.toString(),
        totalAmount: '0',
        status: 'draft',
        createdBy: ctx.user.id,
      }).$returningId();

      return { success: true, orderId: order.id };
    }),

  /**
   * Rejoindre une commande groupée
   */
  join: protectedProcedure
    .input(
      z.object({
        groupedOrderId: z.number(),
        merchantId: z.number(),
        quantity: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Vérifier que la commande existe et est en draft
      const [order] = await db
        .select()
        .from(groupedOrders)
        .where(eq(groupedOrders.id, input.groupedOrderId))
        .limit(1);

      if (!order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Commande introuvable' });
      }

      if (order.status !== 'draft') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cette commande n\'est plus ouverte aux participants',
        });
      }

      // Vérifier que le marchand n'a pas déjà rejoint
      const [existing] = await db
        .select()
        .from(groupedOrderParticipants)
        .where(
          and(
            eq(groupedOrderParticipants.groupedOrderId, input.groupedOrderId),
            eq(groupedOrderParticipants.merchantId, input.merchantId)
          )
        )
        .limit(1);

      if (existing) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Vous avez déjà rejoint cette commande',
        });
      }

      // Ajouter le participant
      await db.insert(groupedOrderParticipants).values({
        groupedOrderId: input.groupedOrderId,
        merchantId: input.merchantId,
        quantity: input.quantity,
      });

      // Mettre à jour la quantité totale
      const newTotalQuantity = order.totalQuantity + input.quantity;
      const newTotalAmount = order.unitPrice
        ? (parseFloat(order.unitPrice) * newTotalQuantity).toFixed(2)
        : '0';

      await db
        .update(groupedOrders)
        .set({
          totalQuantity: newTotalQuantity,
          totalAmount: newTotalAmount,
        })
        .where(eq(groupedOrders.id, input.groupedOrderId));

      return { success: true, totalQuantity: newTotalQuantity };
    }),

  /**
   * Confirmer une commande groupée
   */
  confirm: protectedProcedure
    .input(z.object({ groupedOrderId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const [order] = await db
        .select()
        .from(groupedOrders)
        .where(eq(groupedOrders.id, input.groupedOrderId))
        .limit(1);

      if (!order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Commande introuvable' });
      }

      if (order.createdBy !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Seul le créateur peut confirmer cette commande',
        });
      }

      if (order.status !== 'draft') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cette commande a déjà été confirmée',
        });
      }

      await db
        .update(groupedOrders)
        .set({
          status: 'confirmed',
          confirmedAt: new Date(),
        })
        .where(eq(groupedOrders.id, input.groupedOrderId));

      return { success: true };
    }),

  /**
   * Récupérer les commandes groupées d'une coopérative
   */
  getByCooperative: protectedProcedure
    .input(z.object({ cooperativeId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const orders = await db
        .select({
          id: groupedOrders.id,
          productName: groupedOrders.productName,
          totalQuantity: groupedOrders.totalQuantity,
          unitPrice: groupedOrders.unitPrice,
          totalAmount: groupedOrders.totalAmount,
          status: groupedOrders.status,
          createdBy: groupedOrders.createdBy,
          creatorName: users.name,
          createdAt: groupedOrders.createdAt,
          confirmedAt: groupedOrders.confirmedAt,
          deliveredAt: groupedOrders.deliveredAt,
        })
        .from(groupedOrders)
        .leftJoin(users, eq(groupedOrders.createdBy, users.id))
        .where(eq(groupedOrders.cooperativeId, input.cooperativeId))
        .orderBy(desc(groupedOrders.createdAt));

      return orders;
    }),

  /**
   * Récupérer les participants d'une commande groupée
   */
  getParticipants: protectedProcedure
    .input(z.object({ groupedOrderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const participants = await db
        .select({
          id: groupedOrderParticipants.id,
          merchantId: groupedOrderParticipants.merchantId,
          merchantName: users.name,
          businessName: merchants.businessName,
          quantity: groupedOrderParticipants.quantity,
          joinedAt: groupedOrderParticipants.joinedAt,
        })
        .from(groupedOrderParticipants)
        .leftJoin(merchants, eq(groupedOrderParticipants.merchantId, merchants.id))
        .leftJoin(users, eq(merchants.userId, users.id))
        .where(eq(groupedOrderParticipants.groupedOrderId, input.groupedOrderId))
        .orderBy(desc(groupedOrderParticipants.joinedAt));

      return participants;
    }),

  /**
   * Récupérer les détails d'une commande groupée
   */
  getDetails: protectedProcedure
    .input(z.object({ groupedOrderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const [order] = await db
        .select({
          id: groupedOrders.id,
          cooperativeId: groupedOrders.cooperativeId,
          productName: groupedOrders.productName,
          totalQuantity: groupedOrders.totalQuantity,
          unitPrice: groupedOrders.unitPrice,
          totalAmount: groupedOrders.totalAmount,
          status: groupedOrders.status,
          createdBy: groupedOrders.createdBy,
          creatorName: users.name,
          createdAt: groupedOrders.createdAt,
          confirmedAt: groupedOrders.confirmedAt,
          deliveredAt: groupedOrders.deliveredAt,
        })
        .from(groupedOrders)
        .leftJoin(users, eq(groupedOrders.createdBy, users.id))
        .where(eq(groupedOrders.id, input.groupedOrderId))
        .limit(1);

      if (!order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Commande introuvable' });
      }

      return order;
    }),
});
