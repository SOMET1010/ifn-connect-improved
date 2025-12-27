import { z } from 'zod';
import { merchantProcedure, protectedProcedure, router } from '../_core/trpc';
import {
  createSavingsGoal,
  getMerchantSavingsGoals,
  getSavingsGoalById,
  addDeposit,
  withdraw,
  getSavingsTransactions,
  getMerchantSavingsTransactions,
  getTotalSavings,
  updateSavingsGoal,
  deleteSavingsGoal,
  getSavingsStats,
} from '../db-savings';

/**
 * Router pour l'Assistant Épargne (Tontine Digitale)
 */
export const savingsRouter = router({
  /**
   * Créer un nouvel objectif d'épargne
   */
  createGoal: merchantProcedure
    .input(z.object({
      merchantId: z.number(),
      name: z.string().min(1),
      targetAmount: z.number().positive(),
      deadline: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await createSavingsGoal({
        merchantId: input.merchantId,
        name: input.name,
        targetAmount: input.targetAmount.toString(),
        deadline: input.deadline,
      });
      return result;
    }),

  /**
   * Récupérer les objectifs d'épargne d'un marchand
   */
  getGoals: merchantProcedure
    .input(z.object({
      merchantId: z.number(),
    }))
    .query(async ({ input }) => {
      const goals = await getMerchantSavingsGoals(input.merchantId);
      return goals;
    }),

  /**
   * Récupérer un objectif spécifique
   */
  getGoalById: protectedProcedure
    .input(z.object({
      goalId: z.number(),
    }))
    .query(async ({ input }) => {
      const goal = await getSavingsGoalById(input.goalId);
      return goal;
    }),

  /**
   * Ajouter un dépôt
   */
  addDeposit: merchantProcedure
    .input(z.object({
      savingsGoalId: z.number(),
      merchantId: z.number(),
      amount: z.number().positive(),
      source: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await addDeposit(input);
      return result;
    }),

  /**
   * Retirer de l'épargne
   */
  withdraw: merchantProcedure
    .input(z.object({
      savingsGoalId: z.number(),
      merchantId: z.number(),
      amount: z.number().positive(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await withdraw(input);
      return result;
    }),

  /**
   * Récupérer les transactions d'une cagnotte
   */
  getTransactions: protectedProcedure
    .input(z.object({
      savingsGoalId: z.number(),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ input }) => {
      const transactions = await getSavingsTransactions(input.savingsGoalId, input.limit);
      return transactions;
    }),

  /**
   * Récupérer toutes les transactions d'un marchand
   */
  getMerchantTransactions: merchantProcedure
    .input(z.object({
      merchantId: z.number(),
      limit: z.number().optional().default(100),
    }))
    .query(async ({ input }) => {
      const transactions = await getMerchantSavingsTransactions(input.merchantId, input.limit);
      return transactions;
    }),

  /**
   * Calculer le total épargné
   */
  getTotalSavings: merchantProcedure
    .input(z.object({
      merchantId: z.number(),
    }))
    .query(async ({ input }) => {
      const total = await getTotalSavings(input.merchantId);
      return total;
    }),

  /**
   * Mettre à jour un objectif
   */
  updateGoal: protectedProcedure
    .input(z.object({
      goalId: z.number(),
      name: z.string().min(1).optional(),
      targetAmount: z.number().positive().optional(),
      deadline: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      const { goalId, ...data } = input;
      const result = await updateSavingsGoal(goalId, {
        ...data,
        targetAmount: data.targetAmount?.toString(),
      });
      return result;
    }),

  /**
   * Supprimer un objectif
   */
  deleteGoal: protectedProcedure
    .input(z.object({
      goalId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const result = await deleteSavingsGoal(input.goalId);
      return result;
    }),

  /**
   * Obtenir les statistiques d'épargne
   */
  getStats: merchantProcedure
    .input(z.object({
      merchantId: z.number(),
    }))
    .query(async ({ input }) => {
      const stats = await getSavingsStats(input.merchantId);
      return stats;
    }),
});
