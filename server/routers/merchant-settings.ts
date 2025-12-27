import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import {
  getMerchantSettings,
  updateMerchantSettings,
} from '../db-merchant-settings';

/**
 * Router pour les paramètres personnalisables des marchands
 */
export const merchantSettingsRouter = router({
  /**
   * Récupérer les paramètres d'un marchand
   */
  get: protectedProcedure
    .input(z.object({
      merchantId: z.number(),
    }))
    .query(async ({ input }) => {
      const settings = await getMerchantSettings(input.merchantId);
      return settings;
    }),

  /**
   * Mettre à jour les paramètres
   */
  update: protectedProcedure
    .input(z.object({
      merchantId: z.number(),
      savingsProposalEnabled: z.boolean().optional(),
      savingsProposalThreshold: z.string().optional(),
      savingsProposalPercentage: z.string().optional(),
      groupedOrderNotificationsEnabled: z.boolean().optional(),
      morningBriefingEnabled: z.boolean().optional(),
      morningBriefingTime: z.string().optional(),
      reminderOpeningTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(), // Format HH:MM
      reminderClosingTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(), // Format HH:MM
    }))
    .mutation(async ({ input }) => {
      const { merchantId, ...updates } = input;
      const settings = await updateMerchantSettings(merchantId, updates);
      return settings;
    }),
});
