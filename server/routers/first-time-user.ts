import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { firstTimeUserProgress } from "../../drizzle/schema-first-time-user";
import { eq, and } from "drizzle-orm";

export const firstTimeUserRouter = router({
  /**
   * Récupérer la progression du tour guidé pour l'utilisateur connecté
   */
  getProgress: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    
    const progress = await db
      .select()
      .from(firstTimeUserProgress)
      .where(eq(firstTimeUserProgress.userId, ctx.user.id))
      .limit(1);

    return progress[0] || null;
  }),

  /**
   * Démarrer le tour guidé
   */
  startTour: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Vérifier si une progression existe déjà
    const existing = await db
      .select()
      .from(firstTimeUserProgress)
      .where(eq(firstTimeUserProgress.userId, ctx.user.id))
      .limit(1);

    if (existing.length > 0) {
      // Réinitialiser la progression existante
      await db
        .update(firstTimeUserProgress)
        .set({
          currentStep: 1,
          completed: false,
          skipped: false,
          startedAt: new Date(),
          completedAt: null,
          lastStepCompletedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(firstTimeUserProgress.userId, ctx.user.id));
    } else {
      // Créer une nouvelle progression
      await db.insert(firstTimeUserProgress).values({
        userId: ctx.user.id,
        currentStep: 1,
        totalSteps: 5,
        completed: false,
        skipped: false,
        startedAt: new Date(),
      });
    }

    return { success: true };
  }),

  /**
   * Compléter une étape du tour
   */
  completeStep: protectedProcedure
    .input(z.object({ step: z.number().min(1).max(5) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const progress = await db
        .select()
        .from(firstTimeUserProgress)
        .where(eq(firstTimeUserProgress.userId, ctx.user.id))
        .limit(1);

      if (progress.length === 0) {
        throw new Error("Aucune progression trouvée");
      }

      const nextStep = input.step + 1;
      const isLastStep = nextStep > 5;

      await db
        .update(firstTimeUserProgress)
        .set({
          currentStep: isLastStep ? 5 : nextStep,
          lastStepCompletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(firstTimeUserProgress.userId, ctx.user.id));

      return { success: true, nextStep: isLastStep ? 5 : nextStep };
    }),

  /**
   * Terminer le tour guidé
   */
  completeTour: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    await db
      .update(firstTimeUserProgress)
      .set({
        completed: true,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(firstTimeUserProgress.userId, ctx.user.id));

    return { success: true };
  }),

  /**
   * Ignorer le tour guidé
   */
  skipTour: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const existing = await db
      .select()
      .from(firstTimeUserProgress)
      .where(eq(firstTimeUserProgress.userId, ctx.user.id))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(firstTimeUserProgress)
        .set({
          skipped: true,
          updatedAt: new Date(),
        })
        .where(eq(firstTimeUserProgress.userId, ctx.user.id));
    } else {
      // Créer une entrée avec skipped = true
      await db.insert(firstTimeUserProgress).values({
        userId: ctx.user.id,
        currentStep: 1,
        totalSteps: 5,
        completed: false,
        skipped: true,
        startedAt: new Date(),
      });
    }

    return { success: true };
  }),
});
