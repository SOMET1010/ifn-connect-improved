import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getAttendanceStats, getUnlockedBadges } from "../db-attendance-badges";

export const attendanceBadgesRouter = router({
  /**
   * Récupère les statistiques d'assiduité d'un marchand
   */
  getStats: protectedProcedure
    .input(z.object({ merchantId: z.number() }))
    .query(async ({ input }) => {
      return await getAttendanceStats(input.merchantId);
    }),

  /**
   * Récupère les badges débloqués par un marchand
   */
  getUnlockedBadges: protectedProcedure
    .input(z.object({ merchantId: z.number() }))
    .query(async ({ input }) => {
      return await getUnlockedBadges(input.merchantId);
    }),

  /**
   * Récupère les badges pour le marchand connecté
   */
  getMyBadges: protectedProcedure.query(async ({ ctx }) => {
    // Récupérer le merchantId depuis le contexte utilisateur
    const { getDb } = await import("../db");
    const { merchants } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const merchant = await db
      .select()
      .from(merchants)
      .where(eq(merchants.userId, ctx.user.id))
      .limit(1);

    if (!merchant || merchant.length === 0) {
      throw new Error("Merchant not found");
    }

    return await getUnlockedBadges(merchant[0].id);
  }),
});
