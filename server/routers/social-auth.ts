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
} from '../db-social-auth';

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
});
