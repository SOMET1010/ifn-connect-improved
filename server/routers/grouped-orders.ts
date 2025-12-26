import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { groupedOrders, groupedOrderParticipants, cooperativeMembers, users, merchants, priceTiers } from '../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { createNotification } from './in-app-notifications';

/**
 * Router pour les commandes groupées des coopératives
 */
export const groupedOrdersRouter = router({
  /**
   * Créer une nouvelle commande groupée
   */
  create: protectedProcedure
    .input(
      z.object({
        cooperativeId: z.number(),
        productName: z.string(),
        unitPrice: z.number().optional(),
        closingDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Vérifier que l'utilisateur est bien de la coopérative
      const [membership] = await db
        .select()
        .from(cooperativeMembers)
        .where(
          and(
            eq(cooperativeMembers.cooperativeId, input.cooperativeId),
            eq(cooperativeMembers.isActive, true)
          )
        )
        .limit(1);

      if (!membership && ctx.user.role !== 'cooperative' && ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Vous devez être membre de cette coopérative',
        });
      }

      // Créer la commande groupée
      const [order] = await db.insert(groupedOrders).values({
        cooperativeId: input.cooperativeId,
        productName: input.productName,
        closingDate: input.closingDate ? new Date(input.closingDate) : null,
        totalQuantity: 0,
        unitPrice: input.unitPrice?.toString(),
        totalAmount: '0',
        status: 'draft',
        createdBy: ctx.user.id,
      }).$returningId();

      // Notifier tous les membres de la coopérative
      const members = await db
        .select({
          userId: merchants.userId,
        })
        .from(cooperativeMembers)
        .leftJoin(merchants, eq(cooperativeMembers.merchantId, merchants.id))
        .where(
          and(
            eq(cooperativeMembers.cooperativeId, input.cooperativeId),
            eq(cooperativeMembers.isActive, true)
          )
        );

      // Créer une notification pour chaque membre
      for (const member of members) {
        if (member.userId && member.userId !== ctx.user.id) {
          await createNotification({
            userId: member.userId,
            type: 'group_order_created',
            title: '🛒 Nouvelle commande groupée',
            message: `Une commande groupée pour "${input.productName}" vient d'être créée. Rejoignez-la pour bénéficier d'un meilleur prix !`,
            actionUrl: `/cooperative/grouped-orders`,
            metadata: {
              groupedOrderId: order.id,
              productName: input.productName,
              cooperativeId: input.cooperativeId,
            },
          });
        }
      }

      return { success: true, orderId: order.id };
    }),

  /**
   * Rejoindre une commande groupée
   */
  join: protectedProcedure
    .input(
      z.object({
        groupedOrderId: z.number(),
        merchantId: z.number(),
        quantity: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Vérifier que la commande existe et est en draft
      const [order] = await db
        .select()
        .from(groupedOrders)
        .where(eq(groupedOrders.id, input.groupedOrderId))
        .limit(1);

      if (!order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Commande introuvable' });
      }

      if (order.status !== 'draft') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cette commande n\'est plus ouverte aux participants',
        });
      }

      // Vérifier si la date limite est dépassée
      if (order.closingDate && new Date(order.closingDate) < new Date()) {
        // Fermer automatiquement la commande
        await db
          .update(groupedOrders)
          .set({ status: 'closed' })
          .where(eq(groupedOrders.id, input.groupedOrderId));

        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'La date limite de participation est dépassée',
        });
      }

      // Vérifier que le marchand n'a pas déjà rejoint
      const [existing] = await db
        .select()
        .from(groupedOrderParticipants)
        .where(
          and(
            eq(groupedOrderParticipants.groupedOrderId, input.groupedOrderId),
            eq(groupedOrderParticipants.merchantId, input.merchantId)
          )
        )
        .limit(1);

      if (existing) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Vous avez déjà rejoint cette commande',
        });
      }

      // Ajouter le participant
      await db.insert(groupedOrderParticipants).values({
        groupedOrderId: input.groupedOrderId,
        merchantId: input.merchantId,
        quantity: input.quantity,
      });

      // Récupérer les paliers de prix pour détecter un changement
      const tiers = await db
        .select()
        .from(priceTiers)
        .where(eq(priceTiers.groupedOrderId, input.groupedOrderId))
        .orderBy(desc(priceTiers.minQuantity));

      // Déterminer le palier actif AVANT la nouvelle quantité
      let oldActiveTier = null;
      for (const tier of tiers) {
        if (order.totalQuantity >= tier.minQuantity) {
          oldActiveTier = tier;
          break;
        }
      }

      // Mettre à jour la quantité totale
      const newTotalQuantity = order.totalQuantity + input.quantity;
      const newTotalAmount = order.unitPrice
        ? (parseFloat(order.unitPrice) * newTotalQuantity).toFixed(2)
        : '0';

      await db
        .update(groupedOrders)
        .set({
          totalQuantity: newTotalQuantity,
          totalAmount: newTotalAmount,
        })
        .where(eq(groupedOrders.id, input.groupedOrderId));

      // Déterminer le palier actif APRÈS la nouvelle quantité
      let newActiveTier = null;
      for (const tier of tiers) {
        if (newTotalQuantity >= tier.minQuantity) {
          newActiveTier = tier;
          break;
        }
      }

      // Si un nouveau palier est atteint, notifier tous les participants
      if (newActiveTier && (!oldActiveTier || newActiveTier.id !== oldActiveTier.id)) {
        // Récupérer tous les participants (sauf celui qui vient de rejoindre)
        const participants = await db
          .select({
            userId: merchants.userId,
          })
          .from(groupedOrderParticipants)
          .leftJoin(merchants, eq(groupedOrderParticipants.merchantId, merchants.id))
          .where(eq(groupedOrderParticipants.groupedOrderId, input.groupedOrderId));

        // Calculer les économies
        const basePrice = order.unitPrice ? parseFloat(order.unitPrice) : 0;
        const newPrice = parseFloat(newActiveTier.pricePerUnit);
        const savingsPercent = basePrice > 0 ? ((basePrice - newPrice) / basePrice * 100).toFixed(1) : '0';
        const savingsAmount = (basePrice - newPrice).toFixed(0);

        // Créer une notification pour chaque participant
        for (const participant of participants) {
          if (participant.userId && participant.userId !== ctx.user.id) {
            await createNotification({
              userId: participant.userId,
              type: 'tier_reached',
              title: '🎉 Nouveau palier atteint !',
              message: `La commande groupée "${order.productName}" a atteint un nouveau palier ! Le prix unitaire passe à ${newPrice.toLocaleString('fr-FR')} FCFA (-${savingsPercent}%). Vous économisez ${savingsAmount} FCFA par unité !`,
              actionUrl: `/cooperative/grouped-orders`,
              metadata: {
                groupedOrderId: input.groupedOrderId,
                productName: order.productName,
                oldPrice: basePrice,
                newPrice,
                savingsPercent,
                savingsAmount,
                minQuantity: newActiveTier.minQuantity,
              },
            });
          }
        }
      }

      return { success: true, totalQuantity: newTotalQuantity, tierReached: !!newActiveTier && (!oldActiveTier || newActiveTier.id !== oldActiveTier.id) };
    }),

  /**
   * Confirmer une commande groupée
   */
  confirm: protectedProcedure
    .input(z.object({ groupedOrderId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const [order] = await db
        .select()
        .from(groupedOrders)
        .where(eq(groupedOrders.id, input.groupedOrderId))
        .limit(1);

      if (!order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Commande introuvable' });
      }

      if (order.createdBy !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Seul le créateur peut confirmer cette commande',
        });
      }

      if (order.status !== 'draft') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cette commande a déjà été confirmée',
        });
      }

      await db
        .update(groupedOrders)
        .set({
          status: 'confirmed',
          confirmedAt: new Date(),
        })
        .where(eq(groupedOrders.id, input.groupedOrderId));

      return { success: true };
    }),

  /**
   * Récupérer les commandes groupées d'une coopérative
   */
  getByCooperative: protectedProcedure
    .input(z.object({ cooperativeId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const orders = await db
        .select({
          id: groupedOrders.id,
          productName: groupedOrders.productName,
          totalQuantity: groupedOrders.totalQuantity,
          unitPrice: groupedOrders.unitPrice,
          totalAmount: groupedOrders.totalAmount,
          status: groupedOrders.status,
          createdBy: groupedOrders.createdBy,
          creatorName: users.name,
          createdAt: groupedOrders.createdAt,
          closingDate: groupedOrders.closingDate,
          confirmedAt: groupedOrders.confirmedAt,
          deliveredAt: groupedOrders.deliveredAt,
        })
        .from(groupedOrders)
        .leftJoin(users, eq(groupedOrders.createdBy, users.id))
        .where(eq(groupedOrders.cooperativeId, input.cooperativeId))
        .orderBy(desc(groupedOrders.createdAt));

      return orders;
    }),

  /**
   * Récupérer les participants d'une commande groupée
   */
  getParticipants: protectedProcedure
    .input(z.object({ groupedOrderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const participants = await db
        .select({
          id: groupedOrderParticipants.id,
          merchantId: groupedOrderParticipants.merchantId,
          merchantName: users.name,
          businessName: merchants.businessName,
          quantity: groupedOrderParticipants.quantity,
          joinedAt: groupedOrderParticipants.joinedAt,
        })
        .from(groupedOrderParticipants)
        .leftJoin(merchants, eq(groupedOrderParticipants.merchantId, merchants.id))
        .leftJoin(users, eq(merchants.userId, users.id))
        .where(eq(groupedOrderParticipants.groupedOrderId, input.groupedOrderId))
        .orderBy(desc(groupedOrderParticipants.joinedAt));

      return participants;
    }),

  /**
   * Récupérer les détails d'une commande groupée
   */
  getDetails: protectedProcedure
    .input(z.object({ groupedOrderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const [order] = await db
        .select({
          id: groupedOrders.id,
          cooperativeId: groupedOrders.cooperativeId,
          productName: groupedOrders.productName,
          totalQuantity: groupedOrders.totalQuantity,
          unitPrice: groupedOrders.unitPrice,
          totalAmount: groupedOrders.totalAmount,
          status: groupedOrders.status,
          createdBy: groupedOrders.createdBy,
          creatorName: users.name,
          createdAt: groupedOrders.createdAt,
          confirmedAt: groupedOrders.confirmedAt,
          deliveredAt: groupedOrders.deliveredAt,
        })
        .from(groupedOrders)
        .leftJoin(users, eq(groupedOrders.createdBy, users.id))
        .where(eq(groupedOrders.id, input.groupedOrderId))
        .limit(1);

      if (!order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Commande introuvable' });
      }

      return order;
    }),

  /**
   * Créer des paliers de prix pour une commande groupée
   */
  createPriceTiers: protectedProcedure
    .input(
      z.object({
        groupedOrderId: z.number(),
        tiers: z.array(
          z.object({
            minQuantity: z.number().positive(),
            discountPercent: z.number().min(0).max(100),
            pricePerUnit: z.number().positive(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Vérifier que la commande existe
      const [order] = await db
        .select()
        .from(groupedOrders)
        .where(eq(groupedOrders.id, input.groupedOrderId))
        .limit(1);

      if (!order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Commande introuvable' });
      }

      // Vérifier que l'utilisateur est le créateur
      if (order.createdBy !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Seul le créateur peut définir les paliers de prix',
        });
      }

      // Supprimer les anciens paliers
      await db.delete(priceTiers).where(eq(priceTiers.groupedOrderId, input.groupedOrderId));

      // Insérer les nouveaux paliers
      if (input.tiers.length > 0) {
        await db.insert(priceTiers).values(
          input.tiers.map((tier) => ({
            groupedOrderId: input.groupedOrderId,
            minQuantity: tier.minQuantity,
            discountPercent: tier.discountPercent.toString(),
            pricePerUnit: tier.pricePerUnit.toString(),
          }))
        );
      }

      return { success: true };
    }),

  /**
   * Récupérer les paliers de prix d'une commande
   */
  getPriceTiers: protectedProcedure
    .input(z.object({ groupedOrderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const tiers = await db
        .select()
        .from(priceTiers)
        .where(eq(priceTiers.groupedOrderId, input.groupedOrderId))
        .orderBy(priceTiers.minQuantity);

      return tiers;
    }),

  /**
   * Calculer le prix actuel basé sur la quantité totale
   */
  getCurrentPrice: protectedProcedure
    .input(z.object({ groupedOrderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Récupérer la commande
      const [order] = await db
        .select()
        .from(groupedOrders)
        .where(eq(groupedOrders.id, input.groupedOrderId))
        .limit(1);

      if (!order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Commande introuvable' });
      }

      // Récupérer les paliers
      const tiers = await db
        .select()
        .from(priceTiers)
        .where(eq(priceTiers.groupedOrderId, input.groupedOrderId))
        .orderBy(desc(priceTiers.minQuantity));

      // Trouver le palier actif (le plus haut palier atteint)
      let activeTier = null;
      let nextTier = null;
      const basePrice = order.unitPrice ? parseFloat(order.unitPrice) : 0;

      for (let i = 0; i < tiers.length; i++) {
        if (order.totalQuantity >= tiers[i].minQuantity) {
          activeTier = tiers[i];
          break;
        }
        nextTier = tiers[i];
      }

      return {
        basePrice,
        currentPrice: activeTier ? parseFloat(activeTier.pricePerUnit) : basePrice,
        activeTier: activeTier ? {
          minQuantity: activeTier.minQuantity,
          discountPercent: parseFloat(activeTier.discountPercent),
          pricePerUnit: parseFloat(activeTier.pricePerUnit),
        } : null,
        nextTier: nextTier ? {
          minQuantity: nextTier.minQuantity,
          discountPercent: parseFloat(nextTier.discountPercent),
          pricePerUnit: parseFloat(nextTier.pricePerUnit),
          quantityNeeded: nextTier.minQuantity - order.totalQuantity,
        } : null,
        totalQuantity: order.totalQuantity,
      };
    }),

  /**
   * Récupérer les économies réalisées par un membre
   */
  getMemberSavings: protectedProcedure
    .input(z.object({ merchantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Récupérer toutes les participations du membre
      const participations = await db
        .select({
          groupedOrderId: groupedOrderParticipants.groupedOrderId,
          quantity: groupedOrderParticipants.quantity,
          productName: groupedOrders.productName,
          unitPrice: groupedOrders.unitPrice,
          totalQuantity: groupedOrders.totalQuantity,
          joinedAt: groupedOrderParticipants.joinedAt,
        })
        .from(groupedOrderParticipants)
        .leftJoin(groupedOrders, eq(groupedOrderParticipants.groupedOrderId, groupedOrders.id))
        .where(eq(groupedOrderParticipants.merchantId, input.merchantId));

      let totalSavings = 0;
      const productSavings: Record<string, number> = {};
      const monthlySavingsMap: Record<string, number> = {};

      // Calculer les économies pour chaque participation
      for (const participation of participations) {
        // Récupérer les paliers de cette commande
        const tiers = await db
          .select()
          .from(priceTiers)
          .where(eq(priceTiers.groupedOrderId, participation.groupedOrderId))
          .orderBy(desc(priceTiers.minQuantity));

        // Trouver le palier actif
        let activeTier = null;
        for (const tier of tiers) {
          if (participation.totalQuantity && participation.totalQuantity >= tier.minQuantity) {
            activeTier = tier;
            break;
          }
        }

        if (activeTier && participation.unitPrice && participation.productName) {
          const basePrice = parseFloat(participation.unitPrice);
          const tierPrice = parseFloat(activeTier.pricePerUnit);
          const savings = (basePrice - tierPrice) * participation.quantity;

          totalSavings += savings;

          // Accumuler par produit
          if (!productSavings[participation.productName]) {
            productSavings[participation.productName] = 0;
          }
          productSavings[participation.productName] += savings;

          // Accumuler par mois
          const month = new Date(participation.joinedAt).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
          });
          if (!monthlySavingsMap[month]) {
            monthlySavingsMap[month] = 0;
          }
          monthlySavingsMap[month] += savings;
        }
      }

      // Transformer en tableaux pour les graphiques
      const topProducts = Object.entries(productSavings)
        .map(([productName, savings]) => ({ productName, savings: Math.round(savings) }))
        .sort((a, b) => b.savings - a.savings)
        .slice(0, 5);

      const monthlySavings = Object.entries(monthlySavingsMap)
        .map(([month, savings]) => ({ month, savings: Math.round(savings) }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

      return {
        totalSavings: Math.round(totalSavings),
        totalOrders: participations.length,
        averageSavings: participations.length > 0 ? Math.round(totalSavings / participations.length) : 0,
        topProducts,
        monthlySavings,
      };
    }),
});
