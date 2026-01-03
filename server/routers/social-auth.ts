import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, router } from '../_core/trpc';
import { TrustScoreEngine } from '../lib/trust-score-engine';
import {
  findUserByPhone,
  getMerchantByUserId,
  getMerchantDevice,
  createOrUpdateMerchantDevice,
  getPrimaryChallengeForMerchant,
  verifyChallenge,
  logAuthAttempt,
  getRecentAuthAttempts,
  trustDevice,
  getActiveChallengesByCategory,
  createMerchantChallenge,
  createUserWithPhone,
  verifyPinCode,
  incrementPinFailedAttempts,
  resetPinFailedAttempts,
  isAccountLocked,
  updatePinCode,
  markPhoneAsVerified,
} from '../db-social-auth';
import { sendVerificationCode, sendPinResetCode } from '../_core/sms';

export const socialAuthRouter = router({
  initiateLogin: publicProcedure
    .input(
      z.object({
        phone: z.string().min(8),
        deviceFingerprint: z.string(),
        deviceName: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await findUserByPhone(input.phone);

      if (!user) {
        await logAuthAttempt({
          userId: null,
          phone: input.phone,
          deviceFingerprint: input.deviceFingerprint,
          trustScore: 0,
          decision: 'validate',
          latitude: input.latitude?.toString(),
          longitude: input.longitude?.toString(),
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          success: false,
        });

        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ce numéro n\'est pas enregistré. Contacte ton agent terrain pour t\'inscrire.',
        });
      }

      const merchant = await getMerchantByUserId(user.id);
      if (!merchant) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Compte marchand non trouvé.',
        });
      }

      const device = await getMerchantDevice(merchant.id, input.deviceFingerprint);

      const recentAttempts = await getRecentAuthAttempts(input.phone, 24);
      const consecutiveFailures = recentAttempts.filter((a) => !a.success).length;

      const now = new Date();
      const trustScoreResult = TrustScoreEngine.calculate({
        device: {
          fingerprint: input.deviceFingerprint,
          isKnown: device !== null,
          timesSeenBefore: device?.timesUsed || 0,
        },
        location: {
          currentLatitude: input.latitude,
          currentLongitude: input.longitude,
        },
        time: {
          currentHour: now.getHours(),
          currentDayOfWeek: now.getDay(),
          isUsualTime: true,
        },
        history: {
          totalSuccessfulLogins: recentAttempts.filter((a) => a.success).length,
          incidentsLast30Days: 0,
          consecutiveFailures,
          accountAgeDays: Math.floor((now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
        },
      });

      await createOrUpdateMerchantDevice(
        merchant.id,
        input.deviceFingerprint,
        input.deviceName
      );

      if (trustScoreResult.decision === 'allow') {
        await logAuthAttempt({
          userId: user.id,
          phone: input.phone,
          deviceFingerprint: input.deviceFingerprint,
          trustScore: trustScoreResult.totalScore,
          decision: 'allow',
          latitude: input.latitude?.toString(),
          longitude: input.longitude?.toString(),
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          success: true,
        });

        if (device && device.timesUsed >= 5 && !device.isTrusted) {
          await trustDevice(merchant.id, input.deviceFingerprint);
        }

        return {
          status: 'APPROVED',
          trustScore: trustScoreResult.totalScore,
          decision: 'allow',
          sessionToken: `temp-${user.id}-${Date.now()}`,
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
          },
          merchant: {
            id: merchant.id,
            businessName: merchant.businessName,
          },
          message: `Bonne arrivée ${user.name}. Qu'est-ce qu'on fait aujourd'hui ?`,
        };
      }

      if (trustScoreResult.decision === 'challenge') {
        const challenge = await getPrimaryChallengeForMerchant(merchant.id);

        if (!challenge) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Aucune question de sécurité configurée. Contacte ton agent terrain.',
          });
        }

        await logAuthAttempt({
          userId: user.id,
          phone: input.phone,
          deviceFingerprint: input.deviceFingerprint,
          trustScore: trustScoreResult.totalScore,
          decision: 'challenge',
          challengeId: challenge.challengeId,
          latitude: input.latitude?.toString(),
          longitude: input.longitude?.toString(),
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          success: false,
        });

        return {
          status: 'CHALLENGE_REQUIRED',
          trustScore: trustScoreResult.totalScore,
          decision: 'challenge',
          challenge: {
            id: challenge.id,
            questionFr: challenge.questionFr,
            questionDioula: challenge.questionDioula,
            category: challenge.category,
          },
          message: 'Je te reconnais pas bien aujourd\'hui. Pour continuer, réponds à cette question:',
          riskFlags: trustScoreResult.riskFlags,
        };
      }

      await logAuthAttempt({
        userId: user.id,
        phone: input.phone,
        deviceFingerprint: input.deviceFingerprint,
        trustScore: trustScoreResult.totalScore,
        decision: 'validate',
        latitude: input.latitude?.toString(),
        longitude: input.longitude?.toString(),
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        success: false,
      });

      return {
        status: 'FALLBACK_AGENT',
        trustScore: trustScoreResult.totalScore,
        decision: 'validate',
        message: 'Je ne te reconnais pas bien aujourd\'hui. On va appeler un agent pour t\'aider, ne quitte pas.',
        riskFlags: trustScoreResult.riskFlags,
      };
    }),

  answerChallenge: publicProcedure
    .input(
      z.object({
        phone: z.string().min(8),
        challengeId: z.number(),
        answer: z.string().min(1),
        deviceFingerprint: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await findUserByPhone(input.phone);
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Utilisateur non trouvé.',
        });
      }

      const isCorrect = await verifyChallenge(input.challengeId, input.answer);

      if (!isCorrect) {
        await logAuthAttempt({
          userId: user.id,
          phone: input.phone,
          deviceFingerprint: input.deviceFingerprint,
          trustScore: 0,
          decision: 'validate',
          challengeId: input.challengeId,
          challengePassed: false,
          success: false,
        });

        return {
          success: false,
          message: 'La réponse n\'est pas correcte. On va appeler un agent pour t\'aider.',
          status: 'FALLBACK_AGENT',
        };
      }

      await logAuthAttempt({
        userId: user.id,
        phone: input.phone,
        deviceFingerprint: input.deviceFingerprint,
        trustScore: 100,
        decision: 'allow',
        challengeId: input.challengeId,
        challengePassed: true,
        success: true,
      });

      const merchant = await getMerchantByUserId(user.id);

      return {
        success: true,
        status: 'APPROVED',
        sessionToken: `temp-${user.id}-${Date.now()}`,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
        },
        merchant: merchant ? {
          id: merchant.id,
          businessName: merchant.businessName,
        } : null,
        message: `C'est bon ${user.name}! Bienvenue.`,
      };
    }),

  setupChallenge: publicProcedure
    .input(
      z.object({
        phone: z.string().min(8),
        category: z.enum(['family', 'location', 'business', 'community']),
        challengeId: z.number(),
        answer: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const user = await findUserByPhone(input.phone);
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Utilisateur non trouvé.',
        });
      }

      const merchant = await getMerchantByUserId(user.id);
      if (!merchant) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Compte marchand non trouvé.',
        });
      }

      const challenge = await createMerchantChallenge({
        merchantId: merchant.id,
        challengeId: input.challengeId,
        answer: input.answer,
        isPrimary: true,
      });

      return {
        success: true,
        message: 'Ta question de sécurité a été configurée avec succès!',
        challenge,
      };
    }),

  getChallengesByCategory: publicProcedure
    .input(z.object({
      category: z.enum(['family', 'location', 'business', 'community']),
    }))
    .query(async ({ input }) => {
      const challenges = await getActiveChallengesByCategory(input.category);
      return challenges;
    }),

  registerWithPhone: publicProcedure
    .input(
      z.object({
        phone: z.string().regex(/^(\+225)?[0-9]{10}$/, 'Numéro de téléphone invalide'),
        name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
        pinCode: z.string().regex(/^[0-9]{4}$/, 'Le code PIN doit contenir exactement 4 chiffres'),
      })
    )
    .mutation(async ({ input }) => {
      const normalizedPhone = input.phone.startsWith('+225') ? input.phone : `+225${input.phone}`;

      const existingUser = await findUserByPhone(normalizedPhone);
      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Ce numéro de téléphone est déjà enregistré.',
        });
      }

      const user = await createUserWithPhone({
        phone: normalizedPhone,
        name: input.name,
        pinCode: input.pinCode,
      });

      const { code, success } = await sendVerificationCode(normalizedPhone);

      if (!success) {
        console.warn('Failed to send SMS verification code');
      }

      return {
        success: true,
        userId: user.id,
        phone: normalizedPhone,
        message: 'Ton compte a été créé! Vérifie ton téléphone pour le code de confirmation.',
        verificationCode: process.env.NODE_ENV !== 'production' ? code : undefined,
      };
    }),

  sendVerificationCode: publicProcedure
    .input(
      z.object({
        phone: z.string().regex(/^(\+225)?[0-9]{10}$/, 'Numéro de téléphone invalide'),
      })
    )
    .mutation(async ({ input }) => {
      const normalizedPhone = input.phone.startsWith('+225') ? input.phone : `+225${input.phone}`;

      const user = await findUserByPhone(normalizedPhone);
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Aucun compte associé à ce numéro.',
        });
      }

      const { code, success } = await sendVerificationCode(normalizedPhone);

      if (!success) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Impossible d\'envoyer le code. Réessaie plus tard.',
        });
      }

      return {
        success: true,
        message: 'Code de vérification envoyé par SMS.',
        verificationCode: process.env.NODE_ENV !== 'production' ? code : undefined,
      };
    }),

  verifyPhone: publicProcedure
    .input(
      z.object({
        phone: z.string(),
        code: z.string().length(6),
      })
    )
    .mutation(async ({ input }) => {
      const normalizedPhone = input.phone.startsWith('+225') ? input.phone : `+225${input.phone}`;

      const user = await findUserByPhone(normalizedPhone);
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Utilisateur non trouvé.',
        });
      }

      const updatedUser = await markPhoneAsVerified(user.id);

      return {
        success: true,
        message: 'Ton numéro a été vérifié avec succès!',
        user: {
          id: updatedUser.id,
          phone: updatedUser.phone,
          name: updatedUser.name,
        },
      };
    }),

  loginWithPin: publicProcedure
    .input(
      z.object({
        phone: z.string().regex(/^(\+225)?[0-9]{10}$/, 'Numéro de téléphone invalide'),
        pinCode: z.string().regex(/^[0-9]{4}$/, 'Le code PIN doit contenir exactement 4 chiffres'),
        deviceFingerprint: z.string(),
        deviceName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const normalizedPhone = input.phone.startsWith('+225') ? input.phone : `+225${input.phone}`;

      const user = await findUserByPhone(normalizedPhone);
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Aucun compte associé à ce numéro.',
        });
      }

      if (!user.phoneVerified) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Ton numéro n\'est pas encore vérifié. Vérifie ton SMS.',
        });
      }

      const locked = await isAccountLocked(user.id);
      if (locked) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Ton compte est bloqué suite à trop de tentatives. Réessaie dans 15 minutes.',
        });
      }

      const isValidPin = await verifyPinCode(user.id, input.pinCode);

      if (!isValidPin) {
        const result = await incrementPinFailedAttempts(user.id);

        if (result.locked) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Code PIN incorrect. Ton compte est maintenant bloqué pour 15 minutes.',
          });
        }

        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: `Code PIN incorrect. Il te reste ${3 - (result.attempts || 0)} tentative(s).`,
        });
      }

      await resetPinFailedAttempts(user.id);

      const merchant = await getMerchantByUserId(user.id);
      if (merchant) {
        await createOrUpdateMerchantDevice(
          merchant.id,
          input.deviceFingerprint,
          input.deviceName
        );
      }

      await logAuthAttempt({
        userId: user.id,
        phone: normalizedPhone,
        deviceFingerprint: input.deviceFingerprint,
        trustScore: 100,
        decision: 'allow',
        success: true,
      });

      return {
        success: true,
        status: 'APPROVED',
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
        merchant: merchant ? {
          id: merchant.id,
          businessName: merchant.businessName,
        } : null,
        message: `Bonne arrivée ${user.name}! On fait quoi aujourd'hui ?`,
      };
    }),

  requestPinReset: publicProcedure
    .input(
      z.object({
        phone: z.string().regex(/^(\+225)?[0-9]{10}$/, 'Numéro de téléphone invalide'),
      })
    )
    .mutation(async ({ input }) => {
      const normalizedPhone = input.phone.startsWith('+225') ? input.phone : `+225${input.phone}`;

      const user = await findUserByPhone(normalizedPhone);
      if (!user) {
        return {
          success: true,
          message: 'Si ce numéro est enregistré, tu recevras un code de réinitialisation.',
        };
      }

      const { code, success } = await sendPinResetCode(normalizedPhone);

      if (!success) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Impossible d\'envoyer le code. Réessaie plus tard.',
        });
      }

      return {
        success: true,
        message: 'Code de réinitialisation envoyé par SMS.',
        verificationCode: process.env.NODE_ENV !== 'production' ? code : undefined,
      };
    }),

  resetPin: publicProcedure
    .input(
      z.object({
        phone: z.string().regex(/^(\+225)?[0-9]{10}$/, 'Numéro de téléphone invalide'),
        verificationCode: z.string().length(6),
        newPinCode: z.string().regex(/^[0-9]{4}$/, 'Le code PIN doit contenir exactement 4 chiffres'),
      })
    )
    .mutation(async ({ input }) => {
      const normalizedPhone = input.phone.startsWith('+225') ? input.phone : `+225${input.phone}`;

      const user = await findUserByPhone(normalizedPhone);
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Utilisateur non trouvé.',
        });
      }

      await updatePinCode(user.id, input.newPinCode);

      return {
        success: true,
        message: 'Ton code PIN a été réinitialisé avec succès!',
      };
    }),
});
