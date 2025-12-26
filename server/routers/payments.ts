import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { transactions, marketplaceOrders, merchants, products } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Router tRPC pour les paiements Mobile Money (Chipdeals)
 * 
 * Documentation Chipdeals : https://chipdeals.me/docs
 * 
 * Fonctionnalités :
 * - Initier un paiement (Orange Money, MTN MoMo, Wave, Moov Money)
 * - Vérifier le statut d'un paiement
 * - Webhook de confirmation
 * - Rembourser un paiement
 * - Historique des transactions
 * 
 * MODE SIMULATION :
 * Par défaut, le mode simulation est activé (SIMULATION_MODE=true)
 * - Numéro se terminant par 00 → SUCCESS immédiat
 * - Numéro se terminant par 99 → FAILED (solde insuffisant)
 * - Numéro se terminant par 98 → FAILED (numéro invalide)
 * - Autres numéros → SUCCESS après 2 secondes
 * 
 * Pour activer les vraies transactions :
 * - Définir SIMULATION_MODE=false dans .env
 * - Configurer CHIPDEALS_API_KEY dans .env
 */

const SIMULATION_MODE = process.env.SIMULATION_MODE !== "false";

export const paymentsRouter = router({
  /**
   * Initier un paiement Mobile Money
   * 
   * @param orderId - ID de la commande du marché virtuel
   * @param provider - Provider de paiement (orange_money, mtn_momo, wave, moov_money)
   * @param phoneNumber - Numéro de téléphone du payeur
   * @returns Transaction créée avec référence de paiement
   */
  initiatePayment: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      provider: z.enum(["orange_money", "mtn_momo", "wave", "moov_money"]),
      phoneNumber: z.string().regex(/^\+?225\d{10}$/, "Numéro de téléphone ivoirien invalide"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // 1. Vérifier que la commande existe et appartient au marchand
      const [order] = await db
        .select()
        .from(marketplaceOrders)
        .where(eq(marketplaceOrders.id, input.orderId))
        .limit(1);

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Commande introuvable",
        });
      }

      if (order.buyerId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cette commande ne vous appartient pas",
        });
      }

      if (order.status !== "pending_payment") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cette commande a déjà été payée ou annulée",
        });
      }

      // 2. Créer la transaction en base de données
      const reference = `IFN-${Date.now()}-${order.id}`;
      
      const [transaction] = await db
        .insert(transactions)
        .values({
          merchantId: ctx.user.id!,
          orderId: order.id,
          amount: order.totalAmount.toString(),
          currency: "XOF",
          provider: input.provider,
          phoneNumber: input.phoneNumber,
          status: "pending",
          reference,
        })
        .$returningId();

      // 3. MODE SIMULATION ou appel API Chipdeals
      if (SIMULATION_MODE) {
        console.log(`[SIMULATION] Paiement initié: ${reference}`);
        
        // Simuler un délai de traitement (2 secondes)
        setTimeout(async () => {
          const lastTwoDigits = input.phoneNumber.slice(-2);
          let simulatedStatus: "success" | "failed" = "success";
          let errorMessage: string | null = null;

          if (lastTwoDigits === "99") {
            simulatedStatus = "failed";
            errorMessage = "Solde insuffisant (simulation)";
          } else if (lastTwoDigits === "98") {
            simulatedStatus = "failed";
            errorMessage = "Numéro invalide ou inactif (simulation)";
          }

          // Mettre à jour le statut après simulation
          const dbUpdate = await getDb();
          if (dbUpdate) {
            await dbUpdate
              .update(transactions)
              .set({
                status: simulatedStatus,
                transactionId: `SIM-${Date.now()}`,
                errorMessage,
                webhookData: JSON.stringify({
                  simulation: true,
                  timestamp: new Date().toISOString(),
                }),
              })
              .where(eq(transactions.id, transaction.id));

            // Si succès, mettre à jour la commande
            if (simulatedStatus === "success") {
              await dbUpdate
                .update(marketplaceOrders)
                .set({ status: "paid" })
                .where(eq(marketplaceOrders.id, order.id));
            }
          }
        }, 2000);

        return {
          transactionId: transaction.id,
          reference,
          status: "pending",
          message: "Paiement simulé initié. Vérifiez le statut dans 2 secondes.",
          simulation: true,
        };
      }

      // Mode production avec vraie API Chipdeals
      if (!process.env.CHIPDEALS_API_KEY) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Clé API Chipdeals non configurée. Contactez l'administrateur.",
        });
      }

      const chipdealsResponse = await fetch("https://api.chipdeals.me/v1/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.CHIPDEALS_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: order.totalAmount,
          currency: "XOF",
          provider: input.provider,
          phone: input.phoneNumber,
          reference,
          callback_url: `${process.env.APP_URL}/api/trpc/payments.paymentWebhook`,
        }),
      });

      const chipdealsData = await chipdealsResponse.json();

      await db
        .update(transactions)
        .set({
          transactionId: chipdealsData.transaction_id,
          webhookData: JSON.stringify(chipdealsData),
        })
        .where(eq(transactions.id, transaction.id));

      return {
        transactionId: transaction.id,
        reference,
        status: "pending",
        message: "Paiement initié. Veuillez confirmer sur votre téléphone.",
      };
    }),

  /**
   * Vérifier le statut d'un paiement
   * 
   * @param transactionId - ID de la transaction
   * @returns Statut actuel de la transaction
   */
  checkPaymentStatus: protectedProcedure
    .input(z.object({
      transactionId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [transaction] = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.id, input.transactionId),
            eq(transactions.merchantId, ctx.user.id!)
          )
        )
        .limit(1);

      if (!transaction) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Transaction introuvable",
        });
      }

      // TODO: Interroger l'API Chipdeals pour le statut en temps réel
      // const chipdealsResponse = await fetch(`https://api.chipdeals.me/v1/payments/${transaction.transactionId}`, {
      //   headers: {
      //     "Authorization": `Bearer ${process.env.CHIPDEALS_API_KEY}`,
      //   },
      // });
      //
      // const chipdealsData = await chipdealsResponse.json();
      //
      // if (chipdealsData.status !== transaction.status) {
      //   await db
      //     .update(transactions)
      //     .set({
      //       status: chipdealsData.status,
      //       webhookData: JSON.stringify(chipdealsData),
      //     })
      //     .where(eq(transactions.id, transaction.id));
      // }

      return {
        transactionId: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        provider: transaction.provider,
        createdAt: transaction.createdAt,
      };
    }),

  /**
   * Webhook de confirmation de paiement (appelé par Chipdeals)
   * 
   * @param reference - Référence de la transaction
   * @param status - Statut du paiement (success, failed)
   * @param transactionId - ID de la transaction Chipdeals
   * @returns Confirmation de réception
   */
  paymentWebhook: publicProcedure
    .input(z.object({
      reference: z.string(),
      status: z.enum(["success", "failed"]),
      transaction_id: z.string(),
      signature: z.string().optional(), // Signature pour vérifier l'authenticité
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // 1. TODO: Vérifier la signature du webhook
      // const isValid = verifyChipdealsSignature(input.signature, input);
      // if (!isValid) {
      //   throw new TRPCError({
      //     code: "UNAUTHORIZED",
      //     message: "Signature invalide",
      //   });
      // }

      // 2. Trouver la transaction par référence
      const [transaction] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.reference, input.reference))
        .limit(1);

      if (!transaction) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Transaction introuvable",
        });
      }

      // 3. Mettre à jour le statut de la transaction
      await db
        .update(transactions)
        .set({
          status: input.status,
          transactionId: input.transaction_id,
          webhookData: JSON.stringify(input),
        })
        .where(eq(transactions.id, transaction.id));

      // 4. Si le paiement est réussi, mettre à jour la commande
      if (input.status === "success" && transaction.orderId) {
        await db
          .update(marketplaceOrders)
          .set({
            status: "paid",
          })
          .where(eq(marketplaceOrders.id, transaction.orderId));

        // TODO: Notifier le vendeur
        // await notifyMerchant(order.sellerId, "Nouvelle commande payée !");
      }

      return {
        success: true,
        message: "Webhook traité avec succès",
      };
    }),

  /**
   * Rembourser un paiement
   * 
   * @param transactionId - ID de la transaction à rembourser
   * @returns Confirmation du remboursement
   */
  refundPayment: protectedProcedure
    .input(z.object({
      transactionId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // 1. Vérifier que la transaction existe et appartient au marchand
      const [transaction] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, input.transactionId))
        .limit(1);

      if (!transaction) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Transaction introuvable",
        });
      }

      // Seul le vendeur peut rembourser
      if (transaction.orderId) {
        const [order] = await db
          .select()
          .from(marketplaceOrders)
          .where(eq(marketplaceOrders.id, transaction.orderId))
          .limit(1);

        if (order && order.sellerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Vous n'êtes pas autorisé à rembourser cette transaction",
          });
        }
      }

      if (transaction.status !== "success") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Seules les transactions réussies peuvent être remboursées",
        });
      }

      // 2. TODO: Appeler l'API Chipdeals pour le remboursement
      // const chipdealsResponse = await fetch(`https://api.chipdeals.me/v1/refunds`, {
      //   method: "POST",
      //   headers: {
      //     "Authorization": `Bearer ${process.env.CHIPDEALS_API_KEY}`,
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     transaction_id: transaction.transactionId,
      //     reason: input.reason,
      //   }),
      // });
      //
      // const chipdealsData = await chipdealsResponse.json();

      // 3. Mettre à jour le statut de la transaction
      await db
        .update(transactions)
        .set({
          status: "refunded",
          errorMessage: input.reason,
        })
        .where(eq(transactions.id, transaction.id));

      // 4. Mettre à jour le statut de la commande
      if (transaction.orderId) {
        await db
          .update(marketplaceOrders)
          .set({
            status: "refunded",
          })
          .where(eq(marketplaceOrders.id, transaction.orderId));
      }

      return {
        success: true,
        message: "Remboursement initié avec succès",
      };
    }),

  /**
   * Historique des transactions du marchand
   * 
   * @param limit - Nombre de transactions à retourner (défaut: 50)
   * @returns Liste des transactions
   */
  getTransactionHistory: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const transactionsList = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          currency: transactions.currency,
          provider: transactions.provider,
          phoneNumber: transactions.phoneNumber,
          status: transactions.status,
          reference: transactions.reference,
          createdAt: transactions.createdAt,
          orderId: transactions.orderId,
        })
        .from(transactions)
        .where(eq(transactions.merchantId, ctx.user.id!))
        .orderBy(desc(transactions.createdAt))
        .limit(input.limit);

      return transactionsList;
    }),
});
