import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getTodaySession,
  openDaySession,
  closeDaySession,
  reopenDaySession,
  getSessionHistory,
  checkUnclosedYesterday,
  getSessionStatus,
  calculateSessionDuration,
} from "../db-daily-sessions";
import { getMerchantByUserId } from "../db";
import { TRPCError } from "@trpc/server";

export const dailySessionsRouter = router({
  /**
   * Récupérer la session du jour
   */
  getToday: protectedProcedure.query(async ({ ctx }) => {
    const merchant = await getMerchantByUserId(ctx.user.id);
    if (!merchant) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Marchand non trouvé",
      });
    }

    const session = await getTodaySession(merchant.id);
    const status = getSessionStatus(session);

    return {
      session,
      status,
      duration: session ? calculateSessionDuration(session) : null,
    };
  }),

  /**
   * Ouvrir la journée
   */
  open: protectedProcedure
    .input(
      z.object({
        openingNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const merchant = await getMerchantByUserId(ctx.user.id);
      if (!merchant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Marchand non trouvé",
        });
      }

      // Vérifier si une session d'hier n'a pas été fermée
      const unclosedYesterday = await checkUnclosedYesterday(merchant.id);

      const session = await openDaySession(merchant.id, input.openingNotes);

      return {
        session,
        unclosedYesterday,
        status: getSessionStatus(session),
      };
    }),

  /**
   * Fermer la journée
   */
  close: protectedProcedure
    .input(
      z.object({
        closingNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const merchant = await getMerchantByUserId(ctx.user.id);
      if (!merchant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Marchand non trouvé",
        });
      }

      const session = await closeDaySession(merchant.id, input.closingNotes);

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Aucune session ouverte aujourd'hui",
        });
      }

      return {
        session,
        status: getSessionStatus(session),
        duration: calculateSessionDuration(session),
      };
    }),

  /**
   * Rouvrir la journée (si fermée par erreur)
   */
  reopen: protectedProcedure.mutation(async ({ ctx }) => {
    const merchant = await getMerchantByUserId(ctx.user.id);
    if (!merchant) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Marchand non trouvé",
      });
    }

    const session = await reopenDaySession(merchant.id);

    if (!session) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Aucune session à rouvrir",
      });
    }

    return {
      session,
      status: getSessionStatus(session),
    };
  }),

  /**
   * Historique des sessions
   */
  history: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const merchant = await getMerchantByUserId(ctx.user.id);
      if (!merchant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Marchand non trouvé",
        });
      }

      const sessions = await getSessionHistory(merchant.id, input.limit);

      return sessions.map((session) => ({
        ...session,
        status: getSessionStatus(session),
        duration: calculateSessionDuration(session),
      }));
    }),

  /**
   * Vérifier les sessions non fermées
   */
  checkUnclosed: protectedProcedure.query(async ({ ctx }) => {
    const merchant = await getMerchantByUserId(ctx.user.id);
    if (!merchant) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Marchand non trouvé",
      });
    }

    const unclosedYesterday = await checkUnclosedYesterday(merchant.id);

    return {
      hasUnclosed: !!unclosedYesterday,
      session: unclosedYesterday,
    };
  }),
});
