/**
 * Cron job pour les rappels intelligents d'ouverture/fermeture de journée
 * 
 * NOUVEAU SYSTÈME PERSONNALISÉ :
 * - Chaque marchand configure ses heures de rappel dans ses paramètres
 * - Le cron s'exécute toutes les heures et vérifie les paramètres de chaque marchand
 * - Envoie les rappels uniquement aux marchands ayant configuré l'heure actuelle
 * 
 * Crée des notifications in-app pour rappeler aux marchands d'effectuer l'action
 */

import { getDb } from '../db';
import { merchants, merchantDailySessions, inAppNotifications, merchantSettings } from '../../drizzle/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';

/**
 * Vérifie les marchands qui n'ont pas ouvert leur journée
 * et dont l'heure de rappel d'ouverture correspond à l'heure actuelle
 */
export async function checkMissingOpeningsAtTime(currentTime: string) {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, error: 'Database not available', notificationsCreated: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Récupérer tous les marchands actifs avec leurs paramètres
    const merchantsWithSettings = await db
      .select({
        merchantId: merchants.id,
        userId: merchants.userId,
        businessName: merchants.businessName,
        reminderOpeningTime: merchantSettings.reminderOpeningTime,
      })
      .from(merchants)
      .leftJoin(merchantSettings, eq(merchants.id, merchantSettings.merchantId))
      .where(eq(merchants.isVerified, true));

    let notificationsCreated = 0;

    for (const merchant of merchantsWithSettings) {
      // Vérifier si l'heure de rappel correspond à l'heure actuelle
      const reminderTime = merchant.reminderOpeningTime || '09:00';
      if (!reminderTime.startsWith(currentTime.substring(0, 2))) {
        continue; // Pas l'heure de rappel pour ce marchand
      }

      // Vérifier si la session d'aujourd'hui existe et n'est pas ouverte
      const todaySession = await db
        .select()
        .from(merchantDailySessions)
        .where(
          and(
            eq(merchantDailySessions.merchantId, merchant.merchantId),
            sql`DATE(${merchantDailySessions.sessionDate}) = DATE(${today})`,
            isNull(merchantDailySessions.openedAt)
          )
        )
        .limit(1);

      if (todaySession.length > 0) {
        // Vérifier qu'on n'a pas déjà créé une notification d'ouverture aujourd'hui
        const existingNotification = await db.select()
          .from(inAppNotifications)
          .where(
            and(
              eq(inAppNotifications.userId, merchant.userId),
              eq(inAppNotifications.type, 'session_reminder'),
              sql`DATE(${inAppNotifications.createdAt}) = DATE(${today})`
            )
          )
          .limit(1);

        if (existingNotification.length === 0) {
          // Créer la notification
          await db.insert(inAppNotifications).values({
            userId: merchant.userId,
            type: 'session_reminder',
            title: '🌅 N\'oubliez pas d\'ouvrir votre journée !',
            message: `Bonjour ! Il est ${reminderTime} et vous n'avez pas encore ouvert votre journée. Ouvrez-la maintenant pour commencer à enregistrer vos ventes.`,
            actionUrl: '/merchant/dashboard',
            isRead: false,
            createdAt: new Date(),
          });

          notificationsCreated++;
        }
      }
    }

    console.log(`[Session Reminders] Created ${notificationsCreated} opening reminders at ${currentTime}`);
    return { success: true, notificationsCreated };
  } catch (error) {
    console.error('[Session Reminders] Error checking missing openings:', error);
    return { success: false, error: String(error), notificationsCreated: 0 };
  }
}

/**
 * Vérifie les marchands qui n'ont pas fermé leur journée
 * et dont l'heure de rappel de fermeture correspond à l'heure actuelle
 */
export async function checkMissingClosingsAtTime(currentTime: string) {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, error: 'Database not available', notificationsCreated: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Récupérer tous les marchands actifs avec leurs paramètres
    const merchantsWithSettings = await db
      .select({
        merchantId: merchants.id,
        userId: merchants.userId,
        businessName: merchants.businessName,
        reminderClosingTime: merchantSettings.reminderClosingTime,
      })
      .from(merchants)
      .leftJoin(merchantSettings, eq(merchants.id, merchantSettings.merchantId))
      .where(eq(merchants.isVerified, true));

    let notificationsCreated = 0;

    for (const merchant of merchantsWithSettings) {
      // Vérifier si l'heure de rappel correspond à l'heure actuelle
      const reminderTime = merchant.reminderClosingTime || '20:00';
      if (!reminderTime.startsWith(currentTime.substring(0, 2))) {
        continue; // Pas l'heure de rappel pour ce marchand
      }

      // Vérifier si la session d'aujourd'hui est ouverte mais pas fermée
      const todaySession = await db
        .select()
        .from(merchantDailySessions)
        .where(
          and(
            eq(merchantDailySessions.merchantId, merchant.merchantId),
            sql`DATE(${merchantDailySessions.sessionDate}) = DATE(${today})`,
            isNull(merchantDailySessions.closedAt)
          )
        )
        .limit(1);

      // Si session ouverte, créer une notification de rappel
      if (todaySession.length > 0) {
        // Vérifier qu'on n'a pas déjà créé une notification de fermeture aujourd'hui
        const existingNotification = await db.select()
          .from(inAppNotifications)
          .where(
            and(
              eq(inAppNotifications.userId, merchant.userId),
              eq(inAppNotifications.type, 'session_reminder'),
              sql`DATE(${inAppNotifications.createdAt}) = DATE(${today})`,
              sql`${inAppNotifications.message} LIKE '%fermer%'`
            )
          )
          .limit(1);

        if (existingNotification.length === 0) {
          // Créer la notification
          await db.insert(inAppNotifications).values({
            userId: merchant.userId,
            type: 'session_reminder',
            title: '🌙 N\'oubliez pas de fermer votre journée !',
            message: `Bonsoir ! Il est ${reminderTime} et votre journée est toujours ouverte. Fermez-la maintenant pour faire le bilan de votre journée.`,
            actionUrl: '/merchant/dashboard',
            isRead: false,
            createdAt: new Date(),
          });

          notificationsCreated++;
        }
      }
    }

    console.log(`[Session Reminders] Created ${notificationsCreated} closing reminders at ${currentTime}`);
    return { success: true, notificationsCreated };
  } catch (error) {
    console.error('[Session Reminders] Error checking missing closings:', error);
    return { success: false, error: String(error), notificationsCreated: 0 };
  }
}

/**
 * Fonctions de compatibilité (conservées pour ne pas casser le code existant)
 */
export async function checkMissingOpenings() {
  return await checkMissingOpeningsAtTime('09:00');
}

export async function checkMissingClosings() {
  return await checkMissingClosingsAtTime('20:00');
}
