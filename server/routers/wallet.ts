import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import {
  createWallet,
  getWalletByUserId,
  getWalletBalance,
  transferMoney,
  createPaymentRequest,
  acceptPaymentRequest,
  cancelPaymentRequest,
  getWalletTransactionHistory,
  getWalletStats,
  findUserByPhone,
} from '../db-wallet';

/**
 * Router pour le Wallet Digital (Portefeuille P2P)
 * Gère les transferts d'argent, demandes de paiement et solde
 */
export const walletRouter = router({
  /**
   * Obtenir le solde du wallet de l'utilisateur connecté
   */
  getBalance: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.userId;
      const balance = await getWalletBalance(userId);
      return { balance };
    }),

  /**
   * Obtenir les détails complets du wallet
   */
  getWallet: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.userId;
      const wallet = await getWalletByUserId(userId);
      return wallet;
    }),

  /**
   * Transférer de l'argent à un autre utilisateur
   */
  sendMoney: protectedProcedure
    .input(z.object({
      toUserId: z.number().int().positive(),
      amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
      description: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const fromUserId = ctx.session.userId;

      if (fromUserId === input.toUserId) {
        throw new Error("Vous ne pouvez pas vous envoyer de l'argent à vous-même");
      }

      const transaction = await transferMoney({
        fromUserId,
        toUserId: input.toUserId,
        amount: input.amount,
        description: input.description,
        notes: input.notes,
      });

      return transaction;
    }),

  /**
   * Transférer de l'argent par numéro de téléphone
   */
  sendMoneyByPhone: protectedProcedure
    .input(z.object({
      phone: z.string().min(8),
      amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
      description: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const fromUserId = ctx.session.userId;

      const recipient = await findUserByPhone(input.phone);
      if (!recipient) {
        throw new Error("Aucun utilisateur trouvé avec ce numéro de téléphone");
      }

      if (fromUserId === recipient.id) {
        throw new Error("Vous ne pouvez pas vous envoyer de l'argent à vous-même");
      }

      const transaction = await transferMoney({
        fromUserId,
        toUserId: recipient.id,
        amount: input.amount,
        description: input.description || `Transfert vers ${recipient.name || recipient.phone}`,
        notes: input.notes,
      });

      return {
        transaction,
        recipient: {
          id: recipient.id,
          name: recipient.name,
          phone: recipient.phone,
        },
      };
    }),

  /**
   * Créer une demande de paiement
   */
  requestMoney: protectedProcedure
    .input(z.object({
      fromUserId: z.number().int().positive(),
      amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
      description: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const toUserId = ctx.session.userId;

      if (toUserId === input.fromUserId) {
        throw new Error("Vous ne pouvez pas vous demander de l'argent à vous-même");
      }

      const transaction = await createPaymentRequest({
        fromUserId: input.fromUserId,
        toUserId,
        amount: input.amount,
        description: input.description,
        notes: input.notes,
      });

      return transaction;
    }),

  /**
   * Accepter une demande de paiement
   */
  acceptPaymentRequest: protectedProcedure
    .input(z.object({
      transactionId: z.number().int().positive(),
    }))
    .mutation(async ({ input }) => {
      const transaction = await acceptPaymentRequest(input.transactionId);
      return transaction;
    }),

  /**
   * Annuler une demande de paiement
   */
  cancelPaymentRequest: protectedProcedure
    .input(z.object({
      transactionId: z.number().int().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.userId;
      const transaction = await cancelPaymentRequest(input.transactionId, userId);
      return transaction;
    }),

  /**
   * Obtenir l'historique des transactions
   */
  getHistory: protectedProcedure
    .input(z.object({
      limit: z.number().int().positive().optional().default(50),
      offset: z.number().int().nonnegative().optional().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.userId;
      const transactions = await getWalletTransactionHistory(
        userId,
        input.limit,
        input.offset
      );
      return transactions;
    }),

  /**
   * Obtenir les statistiques du wallet
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.userId;
      const stats = await getWalletStats(userId);
      return stats;
    }),

  /**
   * Rechercher un utilisateur par téléphone (pour transfert)
   */
  findUserByPhone: protectedProcedure
    .input(z.object({
      phone: z.string().min(8),
    }))
    .query(async ({ input }) => {
      const user = await findUserByPhone(input.phone);
      return user;
    }),

  /**
   * Créer un wallet pour l'utilisateur connecté (si n'existe pas)
   */
  createWallet: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.session.userId;

      const existing = await getWalletByUserId(userId);
      if (existing) {
        return existing;
      }

      const wallet = await createWallet({
        userId,
        balance: "0",
        currency: "XOF",
        isActive: true,
      });

      return wallet;
    }),
});
