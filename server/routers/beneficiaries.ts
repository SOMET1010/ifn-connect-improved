import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import {
  getBeneficiariesByOwnerId,
  addBeneficiary,
  addBeneficiaryByPhone,
  updateBeneficiaryNickname,
  removeBeneficiary,
  isBeneficiary,
} from '../db-beneficiaries';

/**
 * Router pour la gestion des bénéficiaires (contacts favoris)
 * Permet de sauvegarder des contacts pour des transferts rapides
 */
export const beneficiariesRouter = router({
  /**
   * Récupérer la liste des bénéficiaires de l'utilisateur
   */
  list: protectedProcedure
    .query(async ({ ctx }) => {
      const ownerId = ctx.user.id;
      const beneficiaries = await getBeneficiariesByOwnerId(ownerId);
      return beneficiaries;
    }),

  /**
   * Ajouter un bénéficiaire par son ID utilisateur
   */
  add: protectedProcedure
    .input(z.object({
      contactId: z.number().int().positive(),
      nickname: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.user.id;

      if (ownerId === input.contactId) {
        throw new Error("Vous ne pouvez pas vous ajouter vous-même comme bénéficiaire");
      }

      const beneficiary = await addBeneficiary({
        ownerId,
        contactId: input.contactId,
        nickname: input.nickname,
      });

      return beneficiary;
    }),

  /**
   * Ajouter un bénéficiaire par numéro de téléphone
   */
  addByPhone: protectedProcedure
    .input(z.object({
      phone: z.string().min(8),
      nickname: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.user.id;

      const beneficiary = await addBeneficiaryByPhone(
        ownerId,
        input.phone,
        input.nickname
      );

      return beneficiary;
    }),

  /**
   * Ajouter un bénéficiaire à partir d'une transaction
   * Pratique pour sauvegarder un contact après un transfert
   */
  addFromTransaction: protectedProcedure
    .input(z.object({
      contactId: z.number().int().positive(),
      nickname: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.user.id;

      if (ownerId === input.contactId) {
        throw new Error("Vous ne pouvez pas vous ajouter vous-même comme bénéficiaire");
      }

      const alreadyBeneficiary = await isBeneficiary(ownerId, input.contactId);
      if (alreadyBeneficiary) {
        throw new Error("Ce contact est déjà dans vos bénéficiaires");
      }

      const beneficiary = await addBeneficiary({
        ownerId,
        contactId: input.contactId,
        nickname: input.nickname,
      });

      return beneficiary;
    }),

  /**
   * Mettre à jour le surnom d'un bénéficiaire
   */
  updateNickname: protectedProcedure
    .input(z.object({
      beneficiaryId: z.number().int().positive(),
      nickname: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.user.id;

      const beneficiary = await updateBeneficiaryNickname(
        input.beneficiaryId,
        ownerId,
        input.nickname
      );

      return beneficiary;
    }),

  /**
   * Supprimer un bénéficiaire
   */
  remove: protectedProcedure
    .input(z.object({
      beneficiaryId: z.number().int().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.user.id;

      const beneficiary = await removeBeneficiary(
        input.beneficiaryId,
        ownerId
      );

      return beneficiary;
    }),

  /**
   * Vérifier si un utilisateur est déjà un bénéficiaire
   */
  check: protectedProcedure
    .input(z.object({
      contactId: z.number().int().positive(),
    }))
    .query(async ({ ctx, input }) => {
      const ownerId = ctx.user.id;
      const isBenef = await isBeneficiary(ownerId, input.contactId);
      return { isBeneficiary: isBenef };
    }),
});
