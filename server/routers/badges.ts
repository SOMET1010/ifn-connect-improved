import { z } from "zod";
import { merchantProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { badges, merchantBadges } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const badgesRouter = router({
  /**
   * Liste tous les badges disponibles
   */
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const allBadges = await db
      .select()
      .from(badges)
      .orderBy(badges.category, badges.points);

    return allBadges;
  }),

  /**
   * Récupère les badges débloqués par un marchand
   */
  myBadges: merchantProcedure
    .input(z.object({ merchantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const myBadges = await db
        .select()
        .from(merchantBadges)
        .where(eq(merchantBadges.merchantId, input.merchantId))
        .orderBy(merchantBadges.unlockedAt);

      return myBadges;
    }),

  /**
   * Débloquer un badge pour un marchand
   */
  unlock: merchantProcedure
    .input(z.object({
      merchantId: z.number(),
      badgeCode: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Trouver le badge par son code
      const [badge] = await db
        .select()
        .from(badges)
        .where(eq(badges.code, input.badgeCode))
        .limit(1);

      if (!badge) {
        throw new Error(`Badge ${input.badgeCode} not found`);
      }

      // Vérifier si le badge est déjà débloqué
      const [existing] = await db
        .select()
        .from(merchantBadges)
        .where(and(
          eq(merchantBadges.merchantId, input.merchantId),
          eq(merchantBadges.badgeId, badge.id)
        ))
        .limit(1);

      if (existing) {
        return { success: false, message: "Badge already unlocked" };
      }

      // Débloquer le badge
      await db.insert(merchantBadges).values({
        merchantId: input.merchantId,
        badgeId: badge.id,
        isNew: true,
      });

      return {
        success: true,
        badge,
        message: `Badge ${badge.name} débloqué !`,
      };
    }),

  /**
   * Marquer un badge comme vu (pour retirer l'animation "nouveau")
   */
  markAsSeen: merchantProcedure
    .input(z.object({
      merchantId: z.number(),
      badgeId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      await db
        .update(merchantBadges)
        .set({ isNew: false })
        .where(and(
          eq(merchantBadges.merchantId, input.merchantId),
          eq(merchantBadges.badgeId, input.badgeId)
        ));

      return { success: true };
    }),
});
