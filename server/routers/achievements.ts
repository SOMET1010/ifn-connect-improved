import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { userAchievements, courses } from '../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

export const achievementsRouter = router({
  /**
   * Récupérer tous les badges de l'utilisateur connecté
   */
  getMyBadges: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const badges = await db
      .select({
        id: userAchievements.id,
        badgeName: userAchievements.badgeName,
        badgeIcon: userAchievements.badgeIcon,
        courseId: userAchievements.courseId,
        scoreObtained: userAchievements.scoreObtained,
        earnedAt: userAchievements.earnedAt,
        courseTitle: courses.title,
      })
      .from(userAchievements)
      .leftJoin(courses, eq(userAchievements.courseId, courses.id))
      .where(eq(userAchievements.userId, ctx.user.id))
      .orderBy(desc(userAchievements.earnedAt));

    return badges;
  }),

  /**
   * Récupérer les badges d'un utilisateur spécifique (pour affichage public)
   */
  getUserBadges: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const badges = await db
        .select({
          id: userAchievements.id,
          badgeName: userAchievements.badgeName,
          badgeIcon: userAchievements.badgeIcon,
          courseId: userAchievements.courseId,
          scoreObtained: userAchievements.scoreObtained,
          earnedAt: userAchievements.earnedAt,
          courseTitle: courses.title,
        })
        .from(userAchievements)
        .leftJoin(courses, eq(userAchievements.courseId, courses.id))
        .where(eq(userAchievements.userId, input.userId))
        .orderBy(desc(userAchievements.earnedAt));

      return badges;
    }),

  /**
   * Compter le nombre total de badges de l'utilisateur
   */
  getBadgeCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const badges = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, ctx.user.id));

    return { count: badges.length };
  }),

  /**
   * Récupérer les détails d'un badge pour génération côté client
   */
  getBadgeDetails: protectedProcedure
    .input(z.object({ badgeId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Récupérer le badge
      const [badge] = await db
        .select({
          badgeName: userAchievements.badgeName,
          badgeIcon: userAchievements.badgeIcon,
          scoreObtained: userAchievements.scoreObtained,
          earnedAt: userAchievements.earnedAt,
          courseTitle: courses.title,
        })
        .from(userAchievements)
        .leftJoin(courses, eq(userAchievements.courseId, courses.id))
        .where(eq(userAchievements.id, input.badgeId))
        .limit(1);

      if (!badge) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Badge not found' });
      }

      return {
        badgeName: badge.badgeName,
        badgeIcon: badge.badgeIcon,
        scoreObtained: badge.scoreObtained,
        earnedAt: badge.earnedAt,
        courseTitle: badge.courseTitle,
        userName: ctx.user.name || 'Marchand',
      };
    }),
});
