import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc.js";
import { videoTutorials, userTutorialProgress } from "../drizzle/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db.js";

/**
 * Router pour les tutoriels vidéo
 * Permet aux utilisateurs de consulter les tutoriels et de suivre leur progression
 */
export const tutorialsRouter = router({
  /**
   * Récupérer tous les tutoriels (publics)
   */
  getAll: publicProcedure
    .input(z.object({
      category: z.enum(["caisse", "stock", "marche", "protection_sociale", "general"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      let query = db
        .select()
        .from(videoTutorials)
        .where(eq(videoTutorials.isActive, true))
        .orderBy(videoTutorials.category, videoTutorials.order);

      if (input?.category) {
        query = db!
          .select()
          .from(videoTutorials)
          .where(
            and(
              eq(videoTutorials.isActive, true),
              eq(videoTutorials.category, input.category)
            )
          )
          .orderBy(videoTutorials.order);
      }

      const tutorials = await query;

      // Grouper par catégorie
      const grouped = tutorials.reduce((acc, tutorial) => {
        if (!acc[tutorial.category]) {
          acc[tutorial.category] = [];
        }
        acc[tutorial.category].push(tutorial);
        return acc;
      }, {} as Record<string, typeof tutorials>);

      return grouped;
    }),

  /**
   * Récupérer les tutoriels par catégorie
   */
  getByCategory: publicProcedure
    .input(z.object({
      category: z.enum(["caisse", "stock", "marche", "protection_sociale", "general"]),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      return await db
        .select()
        .from(videoTutorials)
        .where(
          and(
            eq(videoTutorials.isActive, true),
            eq(videoTutorials.category, input.category)
          )
        )
        .orderBy(videoTutorials.order);
    }),

  /**
   * Marquer un tutoriel comme regardé
   */
  markAsWatched: protectedProcedure
    .input(z.object({
      tutorialId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Vérifier si déjà marqué comme regardé
      const [existing] = await db
        .select()
        .from(userTutorialProgress)
        .where(
          and(
            eq(userTutorialProgress.userId, userId),
            eq(userTutorialProgress.tutorialId, input.tutorialId)
          )
        )
        .limit(1);

      if (existing) {
        // Mettre à jour
        await db
          .update(userTutorialProgress)
          .set({
            completed: true,
            watchedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(userTutorialProgress.id, existing.id));
      } else {
        // Créer
        await db.insert(userTutorialProgress).values({
          userId,
          tutorialId: input.tutorialId,
          completed: true,
          watchedAt: new Date(),
        });
      }

      return { success: true };
    }),

  /**
   * Récupérer la progression de l'utilisateur
   */
  getProgress: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const progress = await db
      .select()
      .from(userTutorialProgress)
      .where(eq(userTutorialProgress.userId, userId))
      .orderBy(desc(userTutorialProgress.watchedAt));

    // Compter les tutoriels regardés par catégorie
    const stats = progress.reduce((acc, p) => {
      const tutorial = p.tutorialId;
      if (!acc[tutorial]) {
        acc[tutorial] = 0;
      }
      if (p.completed) {
        acc[tutorial]++;
      }
      return acc;
    }, {} as Record<number, number>);

    return {
      watchedTutorials: progress.filter(p => p.completed).map(p => p.tutorialId),
      totalWatched: progress.filter(p => p.completed).length,
      progress,
    };
  }),

  /**
   * Récupérer un tutoriel spécifique
   */
  getById: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const [tutorial] = await db
        .select()
        .from(videoTutorials)
        .where(eq(videoTutorials.id, input.id))
        .limit(1);

      return tutorial;
    }),
});
