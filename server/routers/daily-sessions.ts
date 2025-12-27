import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getMerchantByUserId } from "../db-merchant";
import {
  getTodaySession,
  openDaySession,
  closeDaySession,
  reopenDaySession,
  getSessionHistory,
  checkUnclosedYesterday,
} from "../db-daily-sessions";
import {
  getLast30DaysStats,
  compareWeeks,
  compareMonths,
} from "../db-daily-sessions-stats";

/**
 * Router tRPC pour la gestion des sessions quotidiennes (Ouverture/Fermeture de journée)
 */
export const dailySessionsRouter = router({
  /**
   * Récupérer la session du jour pour le marchand connecté
   */
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const merchant = await getMerchantByUserId(ctx.user.id);
    if (!merchant) {
      throw new Error("Marchand non trouvé");
    }

    const session = await getTodaySession(merchant.id);
    return session;
  }),

  /**
   * Ouvrir la journée du marchand
   */
  open: protectedProcedure
    .input(
      z.object({
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const merchant = await getMerchantByUserId(ctx.user.id);
      if (!merchant) {
        throw new Error("Marchand non trouvé");
      }

      const session = await openDaySession(merchant.id, input.notes);

      return {
        success: true,
        session,
      };
    }),

  /**
   * Fermer la journée du marchand
   */
  close: protectedProcedure
    .input(
      z.object({
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const merchant = await getMerchantByUserId(ctx.user.id);
      if (!merchant) {
        throw new Error("Marchand non trouvé");
      }

      const session = await closeDaySession(merchant.id, input.notes);

      return {
        success: true,
        session,
      };
    }),

  /**
   * Rouvrir une journée déjà fermée
   */
  reopen: protectedProcedure.mutation(async ({ ctx }) => {
    const merchant = await getMerchantByUserId(ctx.user.id);
    if (!merchant) {
      throw new Error("Marchand non trouvé");
    }

    const session = await reopenDaySession(merchant.id);

    return {
      success: true,
      session,
    };
  }),

  /**
   * Récupérer l'historique des sessions
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error("Utilisateur non authentifié");
      }

      const merchant = await getMerchantByUserId(ctx.user.id);
      if (!merchant) {
        throw new Error("Marchand non trouvé");
      }

      const history = await getSessionHistory(merchant.id, input.limit);
      return history;
    }),

  /**
   * Vérifier si le marchand a oublié de fermer sa journée hier
   */
  checkUnclosedYesterday: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return { hasUnclosed: false, yesterdaySession: null };
    }

    const merchant = await getMerchantByUserId(ctx.user.id);
    if (!merchant) {
      return { hasUnclosed: false, yesterdaySession: null };
    }

    const result = await checkUnclosedYesterday(merchant.id);
    return result;
  }),

  /**
   * Récupérer les statistiques des 30 derniers jours
   */
  getLast30DaysStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new Error("Utilisateur non authentifié");
    }

    const merchant = await getMerchantByUserId(ctx.user.id);
    if (!merchant) {
      throw new Error("Marchand non trouvé");
    }

    const stats = await getLast30DaysStats(merchant.id);
    return stats;
  }),

  /**
   * Comparer la semaine en cours avec la semaine dernière
   */
  compareWeeks: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new Error("Utilisateur non authentifié");
    }

    const merchant = await getMerchantByUserId(ctx.user.id);
    if (!merchant) {
      throw new Error("Marchand non trouvé");
    }

    const comparison = await compareWeeks(merchant.id);
    return comparison;
  }),

  /**
   * Comparer le mois en cours avec le mois dernier
   */
  compareMonths: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new Error("Utilisateur non authentifié");
    }

    const merchant = await getMerchantByUserId(ctx.user.id);
    if (!merchant) {
      throw new Error("Marchand non trouvé");
    }

    const comparison = await compareMonths(merchant.id);
    return comparison;
  }),
});
