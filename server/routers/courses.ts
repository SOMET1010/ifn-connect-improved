import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { courses, courseProgress } from '../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

export const coursesRouter = router({
  /**
   * Récupérer tous les cours publiés
   */
  getAll: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        level: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Construire les conditions de filtrage
      const conditions = [eq(courses.isPublished, true)];

      if (input?.category) {
        conditions.push(eq(courses.category, input.category));
      }

      if (input?.level) {
        conditions.push(eq(courses.level, input.level));
      }

      return await db
        .select()
        .from(courses)
        .where(and(...conditions))
        .orderBy(desc(courses.createdAt));
    }),

  /**
   * Récupérer un cours par ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, input.id))
        .limit(1);

      if (!course) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Course not found' });
      }

      return course;
    }),

  /**
   * Récupérer la progression de l'utilisateur pour un cours
   */
  getProgress: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const [progress] = await db
        .select()
        .from(courseProgress)
        .where(
          and(
            eq(courseProgress.userId, ctx.user.id),
            eq(courseProgress.courseId, input.courseId)
          )
        )
        .limit(1);

      return progress || null;
    }),

  /**
   * Récupérer toutes les progressions de l'utilisateur
   */
  getMyProgress: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const progressList = await db
      .select({
        id: courseProgress.id,
        courseId: courseProgress.courseId,
        progress: courseProgress.progress,
        completed: courseProgress.completed,
        completedAt: courseProgress.completedAt,
        courseTitle: courses.title,
        courseCategory: courses.category,
        courseDuration: courses.duration,
        courseThumbnail: courses.thumbnailUrl,
      })
      .from(courseProgress)
      .leftJoin(courses, eq(courseProgress.courseId, courses.id))
      .where(eq(courseProgress.userId, ctx.user.id))
      .orderBy(desc(courseProgress.updatedAt));

    return progressList;
  }),

  /**
   * Mettre à jour la progression d'un cours
   */
  updateProgress: protectedProcedure
    .input(
      z.object({
        courseId: z.number(),
        progress: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Vérifier si une progression existe déjà
      const [existing] = await db
        .select()
        .from(courseProgress)
        .where(
          and(
            eq(courseProgress.userId, ctx.user.id),
            eq(courseProgress.courseId, input.courseId)
          )
        )
        .limit(1);

      const completed = input.progress >= 100;
      const completedAt = completed ? new Date() : null;

      if (existing) {
        // Mettre à jour
        await db
          .update(courseProgress)
          .set({
            progress: input.progress,
            completed,
            completedAt: completedAt || existing.completedAt,
          })
          .where(eq(courseProgress.id, existing.id));
      } else {
        // Créer
        await db.insert(courseProgress).values({
          userId: ctx.user.id,
          courseId: input.courseId,
          progress: input.progress,
          completed,
          completedAt,
        });
      }

      return { success: true, completed };
    }),

  /**
   * Marquer un cours comme terminé
   */
  markComplete: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Vérifier si une progression existe déjà
      const [existing] = await db
        .select()
        .from(courseProgress)
        .where(
          and(
            eq(courseProgress.userId, ctx.user.id),
            eq(courseProgress.courseId, input.courseId)
          )
        )
        .limit(1);

      if (existing) {
        // Mettre à jour
        await db
          .update(courseProgress)
          .set({
            progress: 100,
            completed: true,
            completedAt: new Date(),
          })
          .where(eq(courseProgress.id, existing.id));
      } else {
        // Créer
        await db.insert(courseProgress).values({
          userId: ctx.user.id,
          courseId: input.courseId,
          progress: 100,
          completed: true,
          completedAt: new Date(),
        });
      }

      return { success: true };
    }),
});
