/**
 * Router tRPC pour la gestion des remboursements CMU
 */

import { router, protectedProcedure } from '../_core/trpc.ts';
import { z } from 'zod';
import { cmuReimbursements, merchants } from '../../drizzle/schema.ts';
import { getDb } from '../db.ts';
import { eq, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

// Fonction pour générer une référence de remboursement unique
function generateClaimRef() {
  const prefix = 'CMU';
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `${prefix}-${timestamp}-${random}`;
}

export const cmuRouter = router({
  /**
   * Renouveler la CMU
   */
  renewCoverage: protectedProcedure
    .input(
      z.object({
        paymentMethod: z.enum(['mobile_money', 'bank_transfer', 'cash', 'card']),
        phoneNumber: z.string().optional(), // Numéro de téléphone pour Mobile Money
      })
    )
    .mutation(async ({ ctx, input }) => {
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

      // Montant fixe pour le renouvellement CMU : 10 000 FCFA
      const amount = 10000;

      // Simuler le paiement Mobile Money (en production, intégrer avec InTouch API)
      let success = true;
      
      if (input.paymentMethod === 'mobile_money') {
        // Simulation : 90% de succès
        success = Math.random() > 0.1;
      }

      if (!success) {
        return {
          success: false,
          message: 'Le paiement a échoué. Veuillez réessayer.',
        };
      }

      // Mettre à jour la date d'expiration CMU du marchand
      const currentExpiration = merchant[0].cmuExpiryDate || new Date();
      const newExpiration = new Date(currentExpiration);
      
      // Si la date d'expiration est dans le passé, partir d'aujourd'hui
      if (newExpiration < new Date()) {
        newExpiration.setTime(new Date().getTime());
      }
      
      // Ajouter 1 an
      newExpiration.setFullYear(newExpiration.getFullYear() + 1);

      await db
        .update(merchants)
        .set({ cmuExpiryDate: newExpiration })
        .where(eq(merchants.id, merchantId));

      return {
        success: true,
        message: 'Renouvellement effectué avec succès. Votre CMU a été prolongée d\'1 an.',
        newExpiryDate: newExpiration,
      };
    }),

  /**
   * Récupérer l'historique des remboursements CMU du marchand connecté
   */
  getReimbursementHistory: protectedProcedure.query(async ({ ctx }) => {
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

    // Récupérer l'historique des remboursements
    const reimbursements = await db
      .select()
      .from(cmuReimbursements)
      .where(eq(cmuReimbursements.merchantId, merchantId))
      .orderBy(desc(cmuReimbursements.careDate));

    return reimbursements;
  }),

  /**
   * Récupérer le statut CMU du marchand connecté
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

    const cmuNumber = merchant[0].cmuNumber;
    const cmuExpiryDate = merchant[0].cmuExpiryDate;

    // Calculer le nombre de jours restants
    let daysRemaining = null;
    let isExpired = false;
    let isExpiringSoon = false;

    if (cmuExpiryDate) {
      const now = new Date();
      const diffTime = cmuExpiryDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      isExpired = daysRemaining < 0;
      isExpiringSoon = daysRemaining > 0 && daysRemaining <= 60; // 2 mois
    }

    return {
      cmuNumber,
      cmuExpiryDate,
      daysRemaining,
      isExpired,
      isExpiringSoon,
      hasActiveCmu: !!cmuNumber && !isExpired,
    };
  }),
});
