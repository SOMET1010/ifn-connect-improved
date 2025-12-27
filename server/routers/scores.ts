import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { calculateMerchantScore, getMerchantScore, getScoreHistory } from '../db-scores';

/**
 * Router pour le Score SUTA (pré-scoring crédit)
 */
export const scoresRouter = router({
  /**
   * Récupérer le score actuel d'un marchand
   */
  getScore: protectedProcedure
    .input(z.object({
      merchantId: z.number(),
    }))
    .query(async ({ input }) => {
      const score = await getMerchantScore(input.merchantId);
      return score;
    }),

  /**
   * Calculer/recalculer le score d'un marchand
   */
  calculateScore: protectedProcedure
    .input(z.object({
      merchantId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const score = await calculateMerchantScore(input.merchantId);
      return score;
    }),

  /**
   * Récupérer l'historique des scores
   */
  getHistory: protectedProcedure
    .input(z.object({
      merchantId: z.number(),
      limit: z.number().optional().default(30),
    }))
    .query(async ({ input }) => {
      const history = await getScoreHistory(input.merchantId, input.limit);
      return history;
    }),
});
