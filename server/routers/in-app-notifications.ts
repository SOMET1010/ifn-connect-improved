import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { inAppNotifications } from '../../drizzle/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export const inAppNotificationsRouter = router({
  /**
   * Récupérer les notifications non lues (pour le badge compteur)
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const [result] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(inAppNotifications)
      .where(
        and(
          eq(inAppNotifications.userId, ctx.user.id),
          eq(inAppNotifications.isRead, false)
        )
      );

    return result.count;
  }),

  /**
   * Récupérer les notifications récentes (pour le dropdown)
   */
  getRecent: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const notifications = await db
        .select()
        .from(inAppNotifications)
        .where(eq(inAppNotifications.userId, ctx.user.id))
        .orderBy(desc(inAppNotifications.createdAt))
        .limit(input.limit);

      return notifications;
    }),

  /**
   * Récupérer toutes les notifications avec pagination
   */
  getAll: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(50),
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const offset = (input.page - 1) * input.limit;

      const conditions = [eq(inAppNotifications.userId, ctx.user.id)];

      if (input.unreadOnly) {
        conditions.push(eq(inAppNotifications.isRead, false));
      }

      const notifications = await db
        .select()
        .from(inAppNotifications)
        .where(and(...conditions))
        .orderBy(desc(inAppNotifications.createdAt))
        .limit(input.limit)
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(inAppNotifications)
        .where(and(...conditions));

      return {
        notifications,
        total: count,
        page: input.page,
        totalPages: Math.ceil(count / input.limit),
      };
    }),

  /**
   * Marquer une notification comme lue
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Vérifier que la notification appartient à l'utilisateur
      const [notification] = await db
        .select()
        .from(inAppNotifications)
        .where(eq(inAppNotifications.id, input.notificationId))
        .limit(1);

      if (!notification) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Notification introuvable' });
      }

      if (notification.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Accès refusé' });
      }

      await db
        .update(inAppNotifications)
        .set({ isRead: true })
        .where(eq(inAppNotifications.id, input.notificationId));

      return { success: true };
    }),

  /**
   * Marquer toutes les notifications comme lues
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    await db
      .update(inAppNotifications)
      .set({ isRead: true })
      .where(
        and(
          eq(inAppNotifications.userId, ctx.user.id),
          eq(inAppNotifications.isRead, false)
        )
      );

    return { success: true };
  }),

  /**
   * Supprimer une notification
   */
  delete: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Vérifier que la notification appartient à l'utilisateur
      const [notification] = await db
        .select()
        .from(inAppNotifications)
        .where(eq(inAppNotifications.id, input.notificationId))
        .limit(1);

      if (!notification) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Notification introuvable' });
      }

      if (notification.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Accès refusé' });
      }

      await db
        .delete(inAppNotifications)
        .where(eq(inAppNotifications.id, input.notificationId));

      return { success: true };
    }),

  /**
   * Créer une notification (usage interne)
   */
  create: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        type: z.enum([
          'quiz_passed',
          'badge_earned',
          'challenge_received',
          'challenge_won',
          'renewal_reminder',
          'stock_alert',
          'order_status',
          'system',
        ]),
        title: z.string(),
        message: z.string(),
        actionUrl: z.string().optional(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const [notification] = await db
        .insert(inAppNotifications)
        .values({
          userId: input.userId,
          type: input.type,
          title: input.title,
          message: input.message,
          actionUrl: input.actionUrl,
          metadata: input.metadata,
        })
        .$returningId();

      return { success: true, notificationId: notification.id };
    }),
});

/**
 * Helper pour créer une notification (à utiliser dans d'autres routers)
 */
export async function createNotification(params: {
  userId: number;
  type: 'quiz_passed' | 'badge_earned' | 'challenge_received' | 'challenge_won' | 'renewal_reminder' | 'stock_alert' | 'order_status' | 'system';
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) return;

  await db.insert(inAppNotifications).values({
    userId: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    actionUrl: params.actionUrl,
    metadata: params.metadata,
  });
}
