import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, publicProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { weeklyLeaderboard, users, merchants } from '../../drizzle/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

/**
 * Obtenir le numéro de la semaine et l'année actuels
 */
function getCurrentWeek(): { weekNumber: number; year: number } {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return { weekNumber, year: now.getFullYear() };
}

export const leaderboardRouter = router({
  /**
   * Mettre à jour le classement d'un utilisateur après un quiz
   */
  updateScore: protectedProcedure
    .input(
      z.object({
        score: z.number(),
        region: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const { weekNumber, year } = getCurrentWeek();

      // Récupérer la région du marchand si non fournie
      let region = input.region;
      if (!region) {
        const [merchant] = await db
          .select({ location: merchants.location })
          .from(merchants)
          .where(eq(merchants.userId, ctx.user.id))
          .limit(1);

        region = merchant?.location || 'Abidjan';
      }

      // Vérifier si une entrée existe déjà pour cette semaine
      const [existing] = await db
        .select()
        .from(weeklyLeaderboard)
        .where(
          and(
            eq(weeklyLeaderboard.userId, ctx.user.id),
            eq(weeklyLeaderboard.weekNumber, weekNumber),
            eq(weeklyLeaderboard.year, year)
          )
        )
        .limit(1);

      if (existing) {
        // Mettre à jour
        const newQuizzesCompleted = existing.quizzesCompleted + 1;
        const newTotalPoints = existing.totalPoints + input.score;
        const newAverageScore = Math.round(newTotalPoints / newQuizzesCompleted);

        await db
          .update(weeklyLeaderboard)
          .set({
            totalPoints: newTotalPoints,
            quizzesCompleted: newQuizzesCompleted,
            averageScore: newAverageScore,
          })
          .where(eq(weeklyLeaderboard.id, existing.id));
      } else {
        // Créer
        await db.insert(weeklyLeaderboard).values({
          userId: ctx.user.id,
          weekNumber,
          year,
          region,
          totalPoints: input.score,
          quizzesCompleted: 1,
          averageScore: input.score,
        });
      }

      // Recalculer les rangs pour cette région
      await recalculateRanks(db, region, weekNumber, year);

      return { success: true };
    }),

  /**
   * Récupérer le classement régional de la semaine
   */
  getRegionalRanking: publicProcedure
    .input(
      z.object({
        region: z.string().optional(),
        weekNumber: z.number().optional(),
        year: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const { weekNumber, year } = input.weekNumber && input.year
        ? { weekNumber: input.weekNumber, year: input.year }
        : getCurrentWeek();

      const conditions = [
        eq(weeklyLeaderboard.weekNumber, weekNumber),
        eq(weeklyLeaderboard.year, year),
      ];

      if (input.region) {
        conditions.push(eq(weeklyLeaderboard.region, input.region));
      }

      const ranking = await db
        .select({
          rank: weeklyLeaderboard.rank,
          userId: weeklyLeaderboard.userId,
          userName: users.name,
          region: weeklyLeaderboard.region,
          totalPoints: weeklyLeaderboard.totalPoints,
          quizzesCompleted: weeklyLeaderboard.quizzesCompleted,
          averageScore: weeklyLeaderboard.averageScore,
        })
        .from(weeklyLeaderboard)
        .leftJoin(users, eq(weeklyLeaderboard.userId, users.id))
        .where(and(...conditions))
        .orderBy(weeklyLeaderboard.rank)
        .limit(50); // Top 50

      return ranking;
    }),

  /**
   * Récupérer la position de l'utilisateur connecté
   */
  getMyRank: protectedProcedure
    .input(
      z.object({
        weekNumber: z.number().optional(),
        year: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const { weekNumber, year } = input.weekNumber && input.year
        ? { weekNumber: input.weekNumber, year: input.year }
        : getCurrentWeek();

      const [myRank] = await db
        .select()
        .from(weeklyLeaderboard)
        .where(
          and(
            eq(weeklyLeaderboard.userId, ctx.user.id),
            eq(weeklyLeaderboard.weekNumber, weekNumber),
            eq(weeklyLeaderboard.year, year)
          )
        )
        .limit(1);

      return myRank || null;
    }),

  /**
   * Récupérer les régions disponibles
   */
  getRegions: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const { weekNumber, year } = getCurrentWeek();

    const regions = await db
      .selectDistinct({ region: weeklyLeaderboard.region })
      .from(weeklyLeaderboard)
      .where(
        and(
          eq(weeklyLeaderboard.weekNumber, weekNumber),
          eq(weeklyLeaderboard.year, year)
        )
      );

    return regions.map((r) => r.region).filter(Boolean) as string[];
  }),

  /**
   * Récupérer les statistiques globales
   */
  getGlobalStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const { weekNumber, year } = getCurrentWeek();

    const stats = await db
      .select({
        totalParticipants: sql<number>`COUNT(DISTINCT ${weeklyLeaderboard.userId})`,
        totalQuizzes: sql<number>`SUM(${weeklyLeaderboard.quizzesCompleted})`,
        averageScore: sql<number>`AVG(${weeklyLeaderboard.averageScore})`,
      })
      .from(weeklyLeaderboard)
      .where(
        and(
          eq(weeklyLeaderboard.weekNumber, weekNumber),
          eq(weeklyLeaderboard.year, year)
        )
      );

    return stats[0] || { totalParticipants: 0, totalQuizzes: 0, averageScore: 0 };
  }),
});

/**
 * Recalculer les rangs pour une région donnée
 */
async function recalculateRanks(
  db: any,
  region: string,
  weekNumber: number,
  year: number
): Promise<void> {
  // Récupérer tous les participants de la région triés par points
  const participants = await db
    .select()
    .from(weeklyLeaderboard)
    .where(
      and(
        eq(weeklyLeaderboard.region, region),
        eq(weeklyLeaderboard.weekNumber, weekNumber),
        eq(weeklyLeaderboard.year, year)
      )
    )
    .orderBy(desc(weeklyLeaderboard.totalPoints));

  // Attribuer les rangs
  for (let i = 0; i < participants.length; i++) {
    await db
      .update(weeklyLeaderboard)
      .set({ rank: i + 1 })
      .where(eq(weeklyLeaderboard.id, participants[i].id));
  }
}
