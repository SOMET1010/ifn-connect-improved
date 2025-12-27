/**
 * Cron job pour les rappels intelligents d'ouverture/fermeture de journée
 * 
 * S'exécute deux fois par jour :
 * - 9h00 : Détecte les marchands qui n'ont pas ouvert leur journée
 * - 20h00 : Détecte les marchands qui n'ont pas fermé leur journée
 * 
 * Crée des notifications in-app pour rappeler aux marchands d'effectuer l'action
 */

import { getDb } from '../db';
import { merchants, merchantDailySessions, inAppNotifications } from '../../drizzle/schema';
import { getSessionStatus } from '../db-daily-sessions';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Vérifie les marchands qui n'ont pas ouvert leur journée à 9h
 */
export async function checkMissingOpenings() {
  console.log('[Session Reminders] Checking for missing openings at 9 AM...');

  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Récupérer tous les marchands actifs
    const allMerchants = await db.select({
      id: merchants.id,
      userId: merchants.userId,
      merchantNumber: merchants.merchantNumber,
      businessName: merchants.businessName,
    }).from(merchants);

    console.log(`[Session Reminders] Found ${allMerchants.length} merchants to check`);

    let notificationsCreated = 0;

    // Pour chaque marchand, vérifier s'il a ouvert sa journée aujourd'hui
    for (const merchant of allMerchants) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Chercher une session pour aujourd'hui
      const todaySession = await db.select()
        .from(merchantDailySessions)
        .where(
          and(
            eq(merchantDailySessions.merchantId, merchant.id),
            sql`DATE(${merchantDailySessions.sessionDate}) = DATE(${today})`
          )
        )
        .limit(1);

      // Si pas de session ou session NOT_OPENED, créer une notification
      const sessionStatus = todaySession.length === 0 ? 'NOT_OPENED' : getSessionStatus(todaySession[0]);
      if (sessionStatus === 'NOT_OPENED') {
        // Vérifier qu'on n'a pas déjà créé une notification aujourd'hui
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
            message: `Bonjour ! Il est 9h00 et vous n'avez pas encore ouvert votre journée. Ouvrez-la maintenant pour commencer à enregistrer vos ventes.`,
            actionUrl: '/merchant/dashboard',
            isRead: false,
            createdAt: new Date(),
          });

          notificationsCreated++;
        }
      }
    }

    console.log(`[Session Reminders] Created ${notificationsCreated} opening reminders`);
    return { success: true, notificationsCreated };
  } catch (error) {
    console.error('[Session Reminders] Error checking missing openings:', error);
    return { success: false, error };
  }
}

/**
 * Vérifie les marchands qui n'ont pas fermé leur journée à 20h
 */
export async function checkMissingClosings() {
  console.log('[Session Reminders] Checking for missing closings at 8 PM...');

  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Récupérer tous les marchands actifs
    const allMerchants = await db.select({
      id: merchants.id,
      userId: merchants.userId,
      merchantNumber: merchants.merchantNumber,
      businessName: merchants.businessName,
    }).from(merchants);

    console.log(`[Session Reminders] Found ${allMerchants.length} merchants to check`);

    let notificationsCreated = 0;

    // Pour chaque marchand, vérifier s'il a une session ouverte aujourd'hui
    for (const merchant of allMerchants) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Chercher une session ouverte pour aujourd'hui
      const todaySession = await db.select()
        .from(merchantDailySessions)
        .where(
          and(
            eq(merchantDailySessions.merchantId, merchant.id),
            sql`DATE(${merchantDailySessions.sessionDate}) = DATE(${today})`
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
            message: `Bonsoir ! Il est 20h00 et votre journée est toujours ouverte. Fermez-la maintenant pour faire le bilan de votre journée.`,
            actionUrl: '/merchant/dashboard',
            isRead: false,
            createdAt: new Date(),
          });

          notificationsCreated++;
        }
      }
    }

    console.log(`[Session Reminders] Created ${notificationsCreated} closing reminders`);
    return { success: true, notificationsCreated };
  } catch (error) {
    console.error('[Session Reminders] Error checking missing closings:', error);
    return { success: false, error };
  }
}
