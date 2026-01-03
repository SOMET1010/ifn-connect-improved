import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { auditLogs, users } from '../../drizzle/schema';
import { eq, and, desc, gte, lte, like, or, sql } from 'drizzle-orm';

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Accès réservé aux administrateurs',
    });
  }
  return next({ ctx });
});

export const auditLogsRouter = router({
  getLogs: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(50),
        userId: z.number().optional(),
        action: z.string().optional(),
        entity: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const offset = (input.page - 1) * input.limit;
      const conditions = [];

      if (input.userId) {
        conditions.push(eq(auditLogs.userId, input.userId));
      }

      if (input.action) {
        conditions.push(eq(auditLogs.action, input.action));
      }

      if (input.entity) {
        conditions.push(eq(auditLogs.entity, input.entity));
      }

      if (input.startDate) {
        conditions.push(gte(auditLogs.createdAt, new Date(input.startDate)));
      }

      if (input.endDate) {
        conditions.push(lte(auditLogs.createdAt, new Date(input.endDate)));
      }

      if (input.search) {
        conditions.push(
          or(
            like(auditLogs.details, `%${input.search}%`),
            like(auditLogs.ipAddress, `%${input.search}%`)
          )!
        );
      }

      const logs = await db
        .select({
          id: auditLogs.id,
          userId: auditLogs.userId,
          userName: users.name,
          userEmail: users.email,
          action: auditLogs.action,
          entity: auditLogs.entity,
          entityId: auditLogs.entityId,
          details: auditLogs.details,
          ipAddress: auditLogs.ipAddress,
          userAgent: auditLogs.userAgent,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(auditLogs.createdAt))
        .limit(input.limit)
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(auditLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        logs,
        total: count,
        page: input.page,
        totalPages: Math.ceil(count / input.limit),
      };
    }),

  getStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const actionStats = await db
      .select({
        action: auditLogs.action,
        count: sql<number>`COUNT(*)`,
      })
      .from(auditLogs)
      .groupBy(auditLogs.action);

    const entityStats = await db
      .select({
        entity: auditLogs.entity,
        count: sql<number>`COUNT(*)`,
      })
      .from(auditLogs)
      .groupBy(auditLogs.entity);

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [{ recentCount }] = await db
      .select({ recentCount: sql<number>`COUNT(*)` })
      .from(auditLogs)
      .where(gte(auditLogs.createdAt, last24h));

    return {
      byAction: actionStats.reduce((acc, stat) => {
        acc[stat.action] = stat.count;
        return acc;
      }, {} as Record<string, number>),
      byEntity: entityStats.reduce((acc, stat) => {
        acc[stat.entity] = stat.count;
        return acc;
      }, {} as Record<string, number>),
      last24h: recentCount,
    };
  }),

  getDistinctActions: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const actions = await db
      .selectDistinct({ action: auditLogs.action })
      .from(auditLogs)
      .orderBy(auditLogs.action);

    return actions.map((a) => a.action);
  }),

  getDistinctEntities: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const entities = await db
      .selectDistinct({ entity: auditLogs.entity })
      .from(auditLogs)
      .orderBy(auditLogs.entity);

    return entities.map((e) => e.entity);
  }),
});
