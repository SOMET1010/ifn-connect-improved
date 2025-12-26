/**
 * Row Level Security (RLS) Middleware pour tRPC
 * 
 * Ce middleware implémente la sécurité au niveau application en :
 * 1. Vérifiant que l'utilisateur est authentifié
 * 2. Récupérant le merchantId associé à l'utilisateur
 * 3. Injectant le merchantId dans le contexte pour toutes les procédures
 * 4. Validant que les données accédées appartiennent bien au marchand
 */

import { TRPCError } from '@trpc/server';
import { protectedProcedure } from './trpc';
import { getMerchantByUserId } from '../db-merchant';

/**
 * Middleware qui injecte le merchantId dans le contexte
 * À utiliser pour toutes les procédures qui manipulent des données marchands
 */
export const merchantProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // Récupérer le marchand associé à l'utilisateur connecté
  const merchant = await getMerchantByUserId(ctx.user.id);
  
  if (!merchant) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Aucun marchand associé à cet utilisateur',
    });
  }

  // Injecter le merchantId dans le contexte
  return next({
    ctx: {
      ...ctx,
      merchantId: merchant.id,
      merchant,
    },
  });
});

/**
 * Middleware pour les agents terrain
 */
export const agentProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // Vérifier que l'utilisateur a le rôle agent
  if (ctx.user.role !== 'agent' && ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Accès réservé aux agents terrain',
    });
  }

  return next({ ctx });
});

/**
 * Middleware pour les administrateurs
 */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // Vérifier que l'utilisateur a le rôle admin
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Accès réservé aux administrateurs',
    });
  }

  return next({ ctx });
});

/**
 * Middleware pour les coopératives
 */
export const cooperativeProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // Vérifier que l'utilisateur a le rôle cooperative
  if (ctx.user.role !== 'cooperative' && ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Accès réservé aux coopératives',
    });
  }

  return next({ ctx });
});

/**
 * Helper pour valider qu'une ressource appartient au marchand
 */
export function validateMerchantOwnership(
  resourceMerchantId: number,
  contextMerchantId: number,
  resourceType: string
) {
  if (resourceMerchantId !== contextMerchantId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Vous n'avez pas accès à cette ressource (${resourceType})`,
    });
  }
}

/**
 * Helper pour filtrer les résultats par merchantId
 */
export function filterByMerchant<T extends { merchantId: number }>(
  items: T[],
  merchantId: number
): T[] {
  return items.filter(item => item.merchantId === merchantId);
}
