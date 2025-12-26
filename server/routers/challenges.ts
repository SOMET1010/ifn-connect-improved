import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { challenges, users, courses, quizAttempts } from '../../drizzle/schema';
import { eq, and, or, desc } from 'drizzle-orm';

export const challengesRouter = router({
  /**
   * Lancer un défi à un autre marchand
   */
  create: protectedProcedure
    .input(
      z.object({
        challengedId: z.number(),
        courseId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Vérifier que le lanceur a déjà passé le quiz
      const [challengerAttempt] = await db
        .select()
        .from(quizAttempts)
        .where(
          and(
            eq(quizAttempts.userId, ctx.user.id),
            eq(quizAttempts.courseId, input.courseId),
            eq(quizAttempts.passed, true)
          )
        )
        .orderBy(desc(quizAttempts.completedAt))
        .limit(1);

      if (!challengerAttempt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Vous devez d\'abord réussir ce quiz avant de lancer un défi',
        });
      }

      // Créer le défi
      const [challenge] = await db.insert(challenges).values({
        challengerId: ctx.user.id,
        challengedId: input.challengedId,
        courseId: input.courseId,
        challengerScore: challengerAttempt.score,
        status: 'pending',
      }).$returningId();

      return { success: true, challengeId: challenge.id };
    }),

  /**
   * Accepter un défi
   */
  accept: protectedProcedure
    .input(z.object({ challengeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Vérifier que le défi existe et est pour l'utilisateur
      const [challenge] = await db
        .select()
        .from(challenges)
        .where(eq(challenges.id, input.challengeId))
        .limit(1);

      if (!challenge) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Défi introuvable' });
      }

      if (challenge.challengedId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Ce défi n\'est pas pour vous' });
      }

      if (challenge.status !== 'pending') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Ce défi a déjà été traité' });
      }

      // Accepter le défi
      await db
        .update(challenges)
        .set({ status: 'accepted' })
        .where(eq(challenges.id, input.challengeId));

      return { success: true, courseId: challenge.courseId };
    }),

  /**
   * Décliner un défi
   */
  decline: protectedProcedure
    .input(z.object({ challengeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const [challenge] = await db
        .select()
        .from(challenges)
        .where(eq(challenges.id, input.challengeId))
        .limit(1);

      if (!challenge) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Défi introuvable' });
      }

      if (challenge.challengedId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Ce défi n\'est pas pour vous' });
      }

      await db
        .update(challenges)
        .set({ status: 'declined' })
        .where(eq(challenges.id, input.challengeId));

      return { success: true };
    }),

  /**
   * Compléter un défi (appelé automatiquement après quiz)
   */
  complete: protectedProcedure
    .input(
      z.object({
        challengeId: z.number(),
        score: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const [challenge] = await db
        .select()
        .from(challenges)
        .where(eq(challenges.id, input.challengeId))
        .limit(1);

      if (!challenge) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Défi introuvable' });
      }

      if (challenge.challengedId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Ce défi n\'est pas pour vous' });
      }

      // Déterminer le gagnant
      const winnerId =
        input.score > (challenge.challengerScore || 0)
          ? ctx.user.id
          : challenge.challengerId;

      // Mettre à jour le défi
      await db
        .update(challenges)
        .set({
          challengedScore: input.score,
          status: 'completed',
          winnerId,
          completedAt: new Date(),
        })
        .where(eq(challenges.id, input.challengeId));

      return { success: true, winnerId, challengerScore: challenge.challengerScore };
    }),

  /**
   * Récupérer les défis reçus (en attente)
   */
  getReceived: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const receivedChallenges = await db
      .select({
        id: challenges.id,
        challengerId: challenges.challengerId,
        challengerName: users.name,
        courseId: challenges.courseId,
        courseTitle: courses.title,
        challengerScore: challenges.challengerScore,
        status: challenges.status,
        createdAt: challenges.createdAt,
      })
      .from(challenges)
      .leftJoin(users, eq(challenges.challengerId, users.id))
      .leftJoin(courses, eq(challenges.courseId, courses.id))
      .where(
        and(
          eq(challenges.challengedId, ctx.user.id),
          eq(challenges.status, 'pending')
        )
      )
      .orderBy(desc(challenges.createdAt));

    return receivedChallenges;
  }),

  /**
   * Récupérer les défis lancés
   */
  getSent: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const sentChallenges = await db
      .select({
        id: challenges.id,
        challengedId: challenges.challengedId,
        challengedName: users.name,
        courseId: challenges.courseId,
        courseTitle: courses.title,
        challengerScore: challenges.challengerScore,
        challengedScore: challenges.challengedScore,
        status: challenges.status,
        winnerId: challenges.winnerId,
        createdAt: challenges.createdAt,
        completedAt: challenges.completedAt,
      })
      .from(challenges)
      .leftJoin(users, eq(challenges.challengedId, users.id))
      .leftJoin(courses, eq(challenges.courseId, courses.id))
      .where(eq(challenges.challengerId, ctx.user.id))
      .orderBy(desc(challenges.createdAt));

    return sentChallenges;
  }),

  /**
   * Récupérer l'historique complet des défis
   */
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const history = await db
      .select({
        id: challenges.id,
        challengerId: challenges.challengerId,
        challengedId: challenges.challengedId,
        courseId: challenges.courseId,
        courseTitle: courses.title,
        challengerScore: challenges.challengerScore,
        challengedScore: challenges.challengedScore,
        status: challenges.status,
        winnerId: challenges.winnerId,
        createdAt: challenges.createdAt,
        completedAt: challenges.completedAt,
      })
      .from(challenges)
      .leftJoin(courses, eq(challenges.courseId, courses.id))
      .where(
        or(
          eq(challenges.challengerId, ctx.user.id),
          eq(challenges.challengedId, ctx.user.id)
        )
      )
      .orderBy(desc(challenges.createdAt));

    return history;
  }),

  /**
   * Récupérer les statistiques de défis
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const allChallenges = await db
      .select()
      .from(challenges)
      .where(
        or(
          eq(challenges.challengerId, ctx.user.id),
          eq(challenges.challengedId, ctx.user.id)
        )
      );

    const won = allChallenges.filter((c) => c.winnerId === ctx.user.id).length;
    const lost = allChallenges.filter(
      (c) => c.status === 'completed' && c.winnerId !== ctx.user.id
    ).length;
    const pending = allChallenges.filter((c) => c.status === 'pending').length;

    return {
      total: allChallenges.length,
      won,
      lost,
      pending,
      winRate: allChallenges.length > 0 ? Math.round((won / (won + lost)) * 100) : 0,
    };
  }),
});
