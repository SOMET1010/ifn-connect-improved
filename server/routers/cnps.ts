/**
 * Router tRPC pour la gestion des paiements CNPS
 */

import { router, protectedProcedure } from '../_core/trpc.ts';
import { z } from 'zod';
import { cnpsPayments, merchants } from '../../drizzle/schema.ts';
import { getDb } from '../db.ts';
import { eq, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

// Fonction pour générer une référence de transaction unique
function generateTransactionRef() {
  const prefix = 'CNPS';
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `${prefix}-${timestamp}-${random}`;
}

export const cnpsRouter = router({
  /**
   * Payer une cotisation CNPS
   */
  payContribution: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(5000).max(15000), // Montant entre 5 000 et 15 000 FCFA
        paymentMethod: z.enum(['mobile_money', 'bank_transfer', 'cash', 'card']),
        phoneNumber: z.string().optional(), // Numéro de téléphone pour Mobile Money
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Récupérer le marchand lié à l'utilisateur
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Base de données non disponible',
        });
      }

      const merchant = await db
        .select()
        .from(merchants)
        .where(eq(merchants.userId, ctx.user.id))
        .limit(1);

      if (!merchant || merchant.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Marchand non trouvé',
        });
      }

      const merchantId = merchant[0].id;

      // Générer une référence de transaction unique
      const reference = generateTransactionRef();

      // Simuler le paiement Mobile Money (en production, intégrer avec InTouch API)
      let status: 'pending' | 'completed' | 'failed' = 'pending';
      
      if (input.paymentMethod === 'mobile_money') {
        // Simulation : 90% de succès
        const success = Math.random() > 0.1;
        status = success ? 'completed' : 'failed';
      } else {
        // Autres méthodes : succès immédiat (pour la démo)
        status = 'completed';
      }

      // Créer l'entrée de paiement CNPS
      await db.insert(cnpsPayments).values({
        merchantId,
        amount: input.amount.toString(),
        paymentMethod: input.paymentMethod,
        status,
        reference,
        paymentDate: new Date(),
        description: `Cotisation CNPS - ${input.amount} FCFA`,
      });

      // Si le paiement est complété, mettre à jour la date d'expiration CNPS du marchand
      if (status === 'completed') {
        const currentExpiration = merchant[0].cnpsExpiryDate || new Date();
        const newExpiration = new Date(currentExpiration);
        
        // Si la date d'expiration est dans le passé, partir d'aujourd'hui
        if (newExpiration < new Date()) {
          newExpiration.setTime(new Date().getTime());
        }
        
        // Ajouter 1 mois
        newExpiration.setMonth(newExpiration.getMonth() + 1);

        await db
          .update(merchants)
          .set({ cnpsExpiryDate: newExpiration })
          .where(eq(merchants.id, merchantId));
      }

      return {
        success: status === 'completed',
        reference,
        status,
        message:
          status === 'completed'
            ? 'Paiement effectué avec succès. Votre CNPS a été prolongée d\'1 mois.'
            : status === 'failed'
            ? 'Le paiement a échoué. Veuillez réessayer.'
            : 'Paiement en cours de traitement...',
      };
    }),

  /**
   * Récupérer l'historique des paiements CNPS du marchand connecté
   */
  getPaymentHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Base de données non disponible',
      });
    }

    // Récupérer le marchand lié à l'utilisateur
    const merchant = await db
      .select()
      .from(merchants)
      .where(eq(merchants.userId, ctx.user.id))
      .limit(1);

    if (!merchant || merchant.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Marchand non trouvé',
      });
    }

    const merchantId = merchant[0].id;

    // Récupérer l'historique des paiements
    const payments = await db
      .select()
      .from(cnpsPayments)
      .where(eq(cnpsPayments.merchantId, merchantId))
      .orderBy(desc(cnpsPayments.paymentDate));

    return payments;
  }),

  /**
   * Récupérer le statut CNPS du marchand connecté
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Base de données non disponible',
      });
    }

    // Récupérer le marchand lié à l'utilisateur
    const merchant = await db
      .select()
      .from(merchants)
      .where(eq(merchants.userId, ctx.user.id))
      .limit(1);

    if (!merchant || merchant.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Marchand non trouvé',
      });
    }

    const cnpsNumber = merchant[0].cnpsNumber;
      const cnpsExpiryDate = merchant[0].cnpsExpiryDate;

    // Calculer le nombre de jours restants
    let daysRemaining = null;
    let isExpired = false;
    let isExpiringSoon = false;

      if (cnpsExpiryDate) {
        const now = new Date();
        const diffTime = cnpsExpiryDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      isExpired = daysRemaining < 0;
      isExpiringSoon = daysRemaining > 0 && daysRemaining <= 30;
    }

      return {
        cnpsNumber,
        cnpsExpiryDate,
      daysRemaining,
      isExpired,
      isExpiringSoon,
      hasActiveCnps: !!cnpsNumber && !isExpired,
    };
  }),
});
