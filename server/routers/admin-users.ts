import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { users, merchants } from '../../drizzle/schema';
import { eq, like, or, sql, desc, and } from 'drizzle-orm';
import { logAudit, getClientIp, getUserAgent } from '../audit';

/**
 * Middleware pour vérifier que l'utilisateur est admin
 */
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Accès réservé aux administrateurs',
    });
  }
  return next({ ctx });
});

export const adminUsersRouter = router({
  /**
   * Récupérer la liste des utilisateurs avec pagination et filtres
   */
  getUsers: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(50),
        role: z.enum(['admin', 'merchant', 'agent', 'cooperative']).optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const offset = (input.page - 1) * input.limit;

      // Construire les conditions de filtrage
      const conditions = [];

      if (input.role) {
        conditions.push(eq(users.role, input.role));
      }

      if (input.search) {
        conditions.push(
          or(
            like(users.name, `%${input.search}%`),
            like(users.email, `%${input.search}%`),
            like(users.phone, `%${input.search}%`)
          )!
        );
      }

      // Récupérer les utilisateurs
      const usersList = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          role: users.role,
          language: users.language,
          isActive: users.isActive,
          createdAt: users.createdAt,
          lastSignedIn: users.lastSignedIn,
          merchantNumber: merchants.merchantNumber,
          businessName: merchants.businessName,
          location: merchants.location,
        })
        .from(users)
        .leftJoin(merchants, eq(users.id, merchants.userId))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(users.createdAt))
        .limit(input.limit)
        .offset(offset);

      // Compter le total
      const [{ count }] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(users)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        users: usersList,
        total: count,
        page: input.page,
        totalPages: Math.ceil(count / input.limit),
      };
    }),

  /**
   * Récupérer les statistiques par rôle
   */
  getRoleStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const stats = await db
      .select({
        role: users.role,
        count: sql<number>`COUNT(*)`,
      })
      .from(users)
      .groupBy(users.role);

    return stats.reduce((acc, stat) => {
      acc[stat.role] = stat.count;
      return acc;
    }, {} as Record<string, number>);
  }),

  /**
   * Mettre à jour le rôle d'un utilisateur
   */
  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(['admin', 'merchant', 'agent', 'cooperative']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Vérifier que l'utilisateur existe
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Utilisateur introuvable' });
      }

      // Empêcher un admin de se retirer lui-même le rôle admin
      if (user.id === ctx.user.id && user.role === 'admin' && input.role !== 'admin') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Vous ne pouvez pas retirer votre propre rôle admin',
        });
      }

      // Mettre à jour le rôle
      await db
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId));

      // Logger l'action
      await logAudit({
        userId: ctx.user.id,
        action: 'update',
        entityType: 'users',
        entityId: input.userId,
        changes: {
          before: { role: user.role },
          after: { role: input.role },
        },
        ipAddress: getClientIp(ctx.req),
        userAgent: getUserAgent(ctx.req),
      });

      return { success: true };
    }),

  /**
   * Activer/Désactiver un utilisateur
   */
  toggleUserStatus: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Vérifier que l'utilisateur existe
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Utilisateur introuvable' });
      }

      // Empêcher un admin de se désactiver lui-même
      if (user.id === ctx.user.id && !input.isActive) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Vous ne pouvez pas désactiver votre propre compte',
        });
      }

      // Mettre à jour le statut
      await db
        .update(users)
        .set({ isActive: input.isActive })
        .where(eq(users.id, input.userId));

      // Logger l'action
      await logAudit({
        userId: ctx.user.id,
        action: 'update',
        entityType: 'users',
        entityId: input.userId,
        changes: {
          before: { isActive: user.isActive },
          after: { isActive: input.isActive },
        },
        ipAddress: getClientIp(ctx.req),
        userAgent: getUserAgent(ctx.req),
      });

      return { success: true };
    }),

  /**
   * Récupérer les détails d'un utilisateur
   */
  getUserDetails: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const [user] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          role: users.role,
          language: users.language,
          isActive: users.isActive,
          createdAt: users.createdAt,
          lastSignedIn: users.lastSignedIn,
          merchantNumber: merchants.merchantNumber,
          businessName: merchants.businessName,
          businessType: merchants.businessType,
          location: merchants.location,
          cnpsNumber: merchants.cnpsNumber,
          cmuNumber: merchants.cmuNumber,
          cnpsStatus: merchants.cnpsStatus,
          cmuStatus: merchants.cmuStatus,
        })
        .from(users)
        .leftJoin(merchants, eq(users.id, merchants.userId))
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Utilisateur introuvable' });
      }

      return user;
    }),
});
