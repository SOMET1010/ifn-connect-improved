import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../_core/trpc';
import {
  createWallet,
  getWalletByUserId,
  transferMoney,
  getWalletTransactionHistory,
  getWalletStats,
  findUserByPhone,
} from '../db-wallet';
import { getDb } from '../db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export const walletRouter = router({
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    let wallet = await getWalletByUserId(ctx.user.id);
    if (!wallet) {
      wallet = await createWallet({
        userId: ctx.user.id,
        balance: '0',
        currency: 'XOF',
        isActive: true,
      });
    }

    return wallet;
  }),

  getTransactions: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().positive().optional().default(20),
        offset: z.number().int().nonnegative().optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const transactions = await getWalletTransactionHistory(
        ctx.user.id,
        input.limit,
        input.offset
      );

      return transactions;
    }),

  transfer: protectedProcedure
    .input(
      z.object({
        recipientPhone: z.string().min(8),
        amount: z.number().positive(),
        description: z.string().optional(),
        pin: z.string().min(4),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id));

      if (!user || !user.pinCode || user.pinCode !== input.pin) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Code PIN incorrect',
        });
      }

      const recipient = await findUserByPhone(input.recipientPhone);
      if (!recipient) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Utilisateur non trouvé avec ce numéro',
        });
      }

      if (ctx.user.id === recipient.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Vous ne pouvez pas vous envoyer de l\'argent à vous-même',
        });
      }

      const transaction = await transferMoney({
        fromUserId: ctx.user.id,
        toUserId: recipient.id,
        amount: input.amount.toString(),
        description: input.description || `Transfert vers ${recipient.name || recipient.phone}`,
      });

      console.log(`[Wallet] Notification: Transfert de ${input.amount} XOF vers ${recipient.name || recipient.phone}`);

      return transaction;
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const stats = await getWalletStats(ctx.user.id);
    return stats;
  }),
});
