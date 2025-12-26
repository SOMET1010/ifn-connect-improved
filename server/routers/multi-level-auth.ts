/**
 * Router d'authentification multi-niveaux
 * Flux : MRC → OTP (première fois) → PIN (connexions suivantes)
 */

import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import bcrypt from "bcrypt";
import { generateOTP, sendOTPSMS, formatPhoneNumber } from "../_core/brevo-sms";
import { randomUUID } from "crypto";
import * as dbAuth from "../db-auth";

const SALT_ROUNDS = 10;
const OTP_EXPIRY_MINUTES = 5;
const SESSION_EXPIRY_DAYS = 7;
const MAX_OTP_ATTEMPTS = 3;
const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCK_DURATION_MINUTES = 30;

/**
 * Helper : Créer un log d'audit
 */
async function createAuditLog(data: {
  userId?: number;
  action: string;
  merchantNumber?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
  success: boolean;
}) {
  await dbAuth.createAuditLog({
    userId: data.userId ?? null,
    action: data.action as any,
    merchantNumber: data.merchantNumber ?? null,
    ipAddress: data.ipAddress ?? null,
    userAgent: data.userAgent ?? null,
    details: data.details ?? null,
    success: data.success,
  });
}

/**
 * Helper : Créer une session
 */
async function createSession(userId: number, deviceInfo?: string, ipAddress?: string) {
  const sessionId = randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  await dbAuth.createSession({
    sessionId,
    userId,
    deviceInfo: deviceInfo ?? null,
    ipAddress: ipAddress ?? null,
    lastActivity: new Date(),
    expiresAt,
    isActive: true,
  });

  await createAuditLog({
    userId,
    action: 'session_created',
    ipAddress,
    userAgent: deviceInfo,
    success: true,
  });

  return sessionId;
}

export const multiLevelAuthRouter = router({
  /**
   * Login simplifié : Téléphone + PIN directement
   * Pas d'OTP, pas d'email, adapté aux marchands sans culture numérique
   */
  loginWithPhone: publicProcedure
    .input(z.object({
      phone: z.string().min(9).max(15),
      pinCode: z.string().length(4),
      deviceInfo: z.string().optional(),
      ipAddress: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { phone, pinCode, deviceInfo, ipAddress } = input;

      // Formater le numéro de téléphone
      const formattedPhone = formatPhoneNumber(phone);

      // Rechercher le marchand par téléphone
      const merchant = await dbAuth.findMerchantByPhone(formattedPhone);

      if (!merchant) {
        await createAuditLog({
          action: 'login_failed',
          ipAddress,
          userAgent: deviceInfo,
          details: `Téléphone introuvable: ${formattedPhone}`,
          success: false,
        });

        throw new Error('Numéro de téléphone introuvable. Contactez un agent pour vous enrôler.');
      }

      const user = merchant.user;

      // Vérifier si l'utilisateur a un PIN
      const pinRecord = await dbAuth.findPinByUserId(user.id);

      if (!pinRecord) {
        await createAuditLog({
          userId: user.id,
          action: 'login_failed',
          ipAddress,
          userAgent: deviceInfo,
          details: 'Aucun PIN défini',
          success: false,
        });

        throw new Error('Aucun code PIN défini. Contactez un agent.');
      }

      // Vérifier le verrouillage
      if (pinRecord.lockedUntil && new Date() < new Date(pinRecord.lockedUntil)) {
        const remainingMinutes = Math.ceil(
          (new Date(pinRecord.lockedUntil).getTime() - Date.now()) / (60 * 1000)
        );

        await createAuditLog({
          userId: user.id,
          action: 'login_failed',
          ipAddress,
          details: 'Compte verrouillé',
          success: false,
        });

        throw new Error(`Compte verrouillé. Réessayez dans ${remainingMinutes} minutes.`);
      }

      // Vérifier le PIN
      const isValid = await bcrypt.compare(pinCode, pinRecord.pinHash);

      if (!isValid) {
        const newFailedAttempts = pinRecord.failedAttempts + 1;

        // Verrouiller après 5 tentatives
        if (newFailedAttempts >= MAX_PIN_ATTEMPTS) {
          const lockedUntil = new Date();
          lockedUntil.setMinutes(lockedUntil.getMinutes() + PIN_LOCK_DURATION_MINUTES);

          await dbAuth.updatePin(user.id, { 
            failedAttempts: newFailedAttempts,
            lockedUntil,
          });

          await createAuditLog({
            userId: user.id,
            action: 'login_failed',
            ipAddress,
            details: `Compte verrouillé pour ${PIN_LOCK_DURATION_MINUTES} minutes`,
            success: false,
          });

          throw new Error(`Trop de tentatives échouées. Compte verrouillé pour ${PIN_LOCK_DURATION_MINUTES} minutes.`);
        }

        await dbAuth.updatePin(user.id, { failedAttempts: newFailedAttempts });

        await createAuditLog({
          userId: user.id,
          action: 'login_failed',
          ipAddress,
          details: `Tentative ${newFailedAttempts}/${MAX_PIN_ATTEMPTS}`,
          success: false,
        });

        throw new Error(`Code PIN incorrect. ${MAX_PIN_ATTEMPTS - newFailedAttempts} tentatives restantes.`);
      }

      // PIN valide : réinitialiser les tentatives
      await dbAuth.updatePin(user.id, { 
        failedAttempts: 0,
        lockedUntil: null,
      });

      await createAuditLog({
        userId: user.id,
        action: 'login_success',
        ipAddress,
        userAgent: deviceInfo,
        details: 'Connexion réussie via téléphone + PIN',
        success: true,
      });

      // Si PIN temporaire, demander de le changer
      if (pinRecord.mustChange) {
        return {
          success: true,
          userId: user.id,
          userName: user.name,
          requiresPINChange: true,
          message: 'Veuillez changer votre code PIN temporaire.',
        };
      }

      // Créer une session
      const sessionId = await createSession(user.id, deviceInfo, ipAddress);

      return {
        success: true,
        sessionId,
        userId: user.id,
        userName: user.name,
        merchantId: merchant.id,
        message: 'Connexion réussie',
      };
    }),

  /**
   * Étape 2a : Envoyer un OTP par SMS
   */
  sendOTP: publicProcedure
    .input(z.object({
      userId: z.number(),
      phone: z.string(),
      ipAddress: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { userId, phone, ipAddress } = input;

      // Vérifier si un OTP récent existe déjà (< 1 minute)
      const recentOTP = await dbAuth.findRecentOTPByUserId(userId, 1);

      if (recentOTP) {
        throw new Error('Un OTP a déjà été envoyé récemment. Veuillez patienter 1 minute.');
      }

      // Générer et envoyer l'OTP
      const otpCode = generateOTP();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

      const smsSent = await sendOTPSMS(phone, otpCode);

      if (!smsSent) {
        await createAuditLog({
          userId,
          action: 'otp_sent',
          ipAddress,
          details: 'Échec envoi SMS',
          success: false,
        });

        throw new Error('Erreur lors de l\'envoi du SMS. Veuillez réessayer.');
      }

      // Enregistrer l'OTP dans la base de données
      await dbAuth.createOTPLog({
        userId,
        phone,
        otpCode,
        status: 'sent',
        sentAt: new Date(),
        expiresAt,
        ipAddress: ipAddress ?? null,
        failedAttempts: 0,
      });

      await createAuditLog({
        userId,
        action: 'otp_sent',
        ipAddress,
        details: `OTP envoyé au ${phone}`,
        success: true,
      });

      return {
        success: true,
        expiresAt,
        message: `Un code de vérification a été envoyé au ${phone}`,
      };
    }),

  /**
   * Étape 2b : Vérifier l'OTP
   */
  verifyOTP: publicProcedure
    .input(z.object({
      userId: z.number(),
      otpCode: z.string().length(6),
      deviceInfo: z.string().optional(),
      ipAddress: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { userId, otpCode, deviceInfo, ipAddress } = input;

      // Rechercher l'OTP le plus récent
      const otpRecord = await dbAuth.findLatestPendingOTPByUserId(userId);

      if (!otpRecord) {
        await createAuditLog({
          userId,
          action: 'otp_verified',
          ipAddress,
          details: 'Aucun OTP en attente',
          success: false,
        });

        throw new Error('Aucun code de vérification en attente');
      }

      // Vérifier l'expiration
      if (new Date() > new Date(otpRecord.expiresAt)) {
        await dbAuth.updateOTPLog(otpRecord.id, { status: 'expired' });

        await createAuditLog({
          userId,
          action: 'otp_verified',
          ipAddress,
          details: 'OTP expiré',
          success: false,
        });

        throw new Error('Le code de vérification a expiré. Veuillez en demander un nouveau.');
      }

      // Vérifier le nombre de tentatives
      if (otpRecord.failedAttempts >= MAX_OTP_ATTEMPTS) {
        await dbAuth.updateOTPLog(otpRecord.id, { status: 'failed' });

        await createAuditLog({
          userId,
          action: 'otp_verified',
          ipAddress,
          details: 'Trop de tentatives échouées',
          success: false,
        });

        throw new Error('Trop de tentatives échouées. Veuillez demander un nouveau code.');
      }

      // Vérifier le code
      if (otpRecord.otpCode !== otpCode) {
        await dbAuth.updateOTPLog(otpRecord.id, { 
          failedAttempts: otpRecord.failedAttempts + 1 
        });

        await createAuditLog({
          userId,
          action: 'otp_failed',
          ipAddress,
          details: 'Code incorrect',
          success: false,
        });

        throw new Error('Code de vérification incorrect');
      }

      // OTP valide : marquer comme vérifié
      await dbAuth.updateOTPLog(otpRecord.id, { 
        status: 'verified',
        verifiedAt: new Date(),
      });

      await createAuditLog({
        userId,
        action: 'otp_verified',
        ipAddress,
        details: 'OTP vérifié avec succès',
        success: true,
      });

      // Vérifier si l'utilisateur a un PIN
      const pinRecord = await dbAuth.findPinByUserId(userId);

      // Si pas de PIN, créer une session directement
      if (!pinRecord) {
        const sessionId = await createSession(userId, deviceInfo, ipAddress);

        await createAuditLog({
          userId,
          action: 'login_success',
          ipAddress,
          userAgent: deviceInfo,
          details: 'Connexion réussie via OTP (pas de PIN)',
          success: true,
        });

        return {
          success: true,
          sessionId,
          requiresPINSetup: true,
          message: 'Connexion réussie. Veuillez définir votre code PIN.',
        };
      }

      // Si PIN temporaire, demander de le changer
      if (pinRecord.mustChange) {
        return {
          success: true,
          requiresPINChange: true,
          message: 'Veuillez changer votre code PIN temporaire.',
        };
      }

      // Sinon, créer une session
      const sessionId = await createSession(userId, deviceInfo, ipAddress);

      await createAuditLog({
        userId,
        action: 'login_success',
        ipAddress,
        userAgent: deviceInfo,
        details: 'Connexion réussie via OTP',
        success: true,
      });

      return {
        success: true,
        sessionId,
        message: 'Connexion réussie',
      };
    }),

  /**
   * Étape 2c : Vérifier le PIN
   */
  verifyPIN: publicProcedure
    .input(z.object({
      userId: z.number(),
      pinCode: z.string().length(4),
      deviceInfo: z.string().optional(),
      ipAddress: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { userId, pinCode, deviceInfo, ipAddress } = input;

      // Rechercher le PIN
      const pinRecord = await dbAuth.findPinByUserId(userId);

      if (!pinRecord) {
        await createAuditLog({
          userId,
          action: 'pin_failed',
          ipAddress,
          details: 'Aucun PIN défini',
          success: false,
        });

        throw new Error('Aucun code PIN défini. Veuillez utiliser l\'OTP.');
      }

      // Vérifier le verrouillage
      if (pinRecord.lockedUntil && new Date() < new Date(pinRecord.lockedUntil)) {
        const remainingMinutes = Math.ceil(
          (new Date(pinRecord.lockedUntil).getTime() - Date.now()) / (60 * 1000)
        );

        await createAuditLog({
          userId,
          action: 'pin_failed',
          ipAddress,
          details: 'Compte verrouillé',
          success: false,
        });

        throw new Error(`Compte verrouillé. Réessayez dans ${remainingMinutes} minutes.`);
      }

      // Vérifier le PIN
      const isValid = await bcrypt.compare(pinCode, pinRecord.pinHash);

      if (!isValid) {
        const newFailedAttempts = pinRecord.failedAttempts + 1;

        // Verrouiller après 5 tentatives
        if (newFailedAttempts >= MAX_PIN_ATTEMPTS) {
          const lockedUntil = new Date();
          lockedUntil.setMinutes(lockedUntil.getMinutes() + PIN_LOCK_DURATION_MINUTES);

          await dbAuth.updatePin(userId, { 
            failedAttempts: newFailedAttempts,
            lockedUntil,
          });

          await createAuditLog({
            userId,
            action: 'pin_failed',
            ipAddress,
            details: `Compte verrouillé pour ${PIN_LOCK_DURATION_MINUTES} minutes`,
            success: false,
          });

          throw new Error(`Trop de tentatives échouées. Compte verrouillé pour ${PIN_LOCK_DURATION_MINUTES} minutes.`);
        }

        await dbAuth.updatePin(userId, { failedAttempts: newFailedAttempts });

        await createAuditLog({
          userId,
          action: 'pin_failed',
          ipAddress,
          details: `Tentative ${newFailedAttempts}/${MAX_PIN_ATTEMPTS}`,
          success: false,
        });

        throw new Error(`Code PIN incorrect. ${MAX_PIN_ATTEMPTS - newFailedAttempts} tentatives restantes.`);
      }

      // PIN valide : réinitialiser les tentatives
      await dbAuth.updatePin(userId, { 
        failedAttempts: 0,
        lockedUntil: null,
      });

      await createAuditLog({
        userId,
        action: 'pin_verified',
        ipAddress,
        details: 'PIN vérifié avec succès',
        success: true,
      });

      // Si PIN temporaire, demander de le changer
      if (pinRecord.mustChange) {
        return {
          success: true,
          requiresPINChange: true,
          message: 'Veuillez changer votre code PIN temporaire.',
        };
      }

      // Créer une session
      const sessionId = await createSession(userId, deviceInfo, ipAddress);

      await createAuditLog({
        userId,
        action: 'login_success',
        ipAddress,
        userAgent: deviceInfo,
        details: 'Connexion réussie via PIN',
        success: true,
      });

      return {
        success: true,
        sessionId,
        message: 'Connexion réussie',
      };
    }),

  /**
   * Changer le PIN (obligatoire si temporaire)
   */
  changePIN: protectedProcedure
    .input(z.object({
      oldPinCode: z.string().length(4).optional(),
      newPinCode: z.string().length(4),
      confirmPinCode: z.string().length(4),
    }))
    .mutation(async ({ ctx, input }) => {
      const { oldPinCode, newPinCode, confirmPinCode } = input;
      const userId = ctx.user.id;

      if (newPinCode !== confirmPinCode) {
        throw new Error('Les codes PIN ne correspondent pas');
      }

      // Rechercher le PIN actuel
      const pinRecord = await dbAuth.findPinByUserId(userId);

      // Si PIN existe et n'est pas temporaire, vérifier l'ancien PIN
      if (pinRecord && !pinRecord.isTemporary && oldPinCode) {
        const isValid = await bcrypt.compare(oldPinCode, pinRecord.pinHash);
        if (!isValid) {
          throw new Error('Ancien code PIN incorrect');
        }
      }

      // Hasher le nouveau PIN
      const pinHash = await bcrypt.hash(newPinCode, SALT_ROUNDS);

      if (pinRecord) {
        // Mettre à jour le PIN existant
        await dbAuth.updatePin(userId, {
          pinHash,
          isTemporary: false,
          mustChange: false,
          failedAttempts: 0,
          lockedUntil: null,
        });
      } else {
        // Créer un nouveau PIN
        await dbAuth.createPin({
          userId,
          pinHash,
          isTemporary: false,
          mustChange: false,
          failedAttempts: 0,
        });
      }

      await createAuditLog({
        userId,
        action: 'pin_changed',
        details: 'PIN changé avec succès',
        success: true,
      });

      return {
        success: true,
        message: 'Code PIN changé avec succès',
      };
    }),

  /**
   * Vérifier la validité de la session
   */
  checkSession: publicProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .query(async ({ input }) => {
      const { sessionId } = input;

      const session = await dbAuth.findActiveSessionBySessionId(sessionId);

      if (!session) {
        return {
          valid: false,
          message: 'Session expirée ou invalide',
        };
      }

      // Mettre à jour lastActivity
      await dbAuth.updateSessionActivity(sessionId);

      return {
        valid: true,
        user: session.user,
      };
    }),

  /**
   * Déconnexion
   */
  logout: publicProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { sessionId } = input;

      const session = await dbAuth.findSessionBySessionId(sessionId);

      if (session) {
        await dbAuth.deactivateSession(sessionId);

        await createAuditLog({
          userId: session.userId,
          action: 'logout',
          details: 'Déconnexion réussie',
          success: true,
        });
      }

      return {
        success: true,
        message: 'Déconnexion réussie',
      };
    }),
});
