/**
 * Initialisation du cron job pour les rappels d'ouverture/fermeture de journée
 * 
 * S'exécute deux fois par jour :
 * - 9h00 : Rappel d'ouverture pour les marchands qui n'ont pas ouvert leur journée
 * - 20h00 : Rappel de fermeture pour les marchands qui n'ont pas fermé leur journée
 * 
 * Fuseau horaire : GMT+0 (Côte d'Ivoire)
 */

import cron from 'node-cron';
import { checkMissingOpenings, checkMissingClosings } from './session-reminders';

export function initSessionRemindersCron() {
  console.log('[Session Reminders] Initializing cron jobs...');

  // Cron job pour les rappels d'ouverture à 9h00 (GMT+0 = heure de Côte d'Ivoire)
  cron.schedule('0 9 * * *', async () => {
    console.log('[Session Reminders] Running opening reminders job at 9 AM...');
    try {
      const result = await checkMissingOpenings();
      if (result.success) {
        console.log(`[Session Reminders] Opening reminders job completed successfully. ${result.notificationsCreated} notifications created.`);
      } else {
        console.error('[Session Reminders] Opening reminders job failed:', result.error);
      }
    } catch (error) {
      console.error('[Session Reminders] Error in opening reminders job:', error);
    }
  }, {
    timezone: 'Africa/Abidjan' // Fuseau horaire de la Côte d'Ivoire (GMT+0)
  });

  // Cron job pour les rappels de fermeture à 20h00 (GMT+0 = heure de Côte d'Ivoire)
  cron.schedule('0 20 * * *', async () => {
    console.log('[Session Reminders] Running closing reminders job at 8 PM...');
    try {
      const result = await checkMissingClosings();
      if (result.success) {
        console.log(`[Session Reminders] Closing reminders job completed successfully. ${result.notificationsCreated} notifications created.`);
      } else {
        console.error('[Session Reminders] Closing reminders job failed:', result.error);
      }
    } catch (error) {
      console.error('[Session Reminders] Error in closing reminders job:', error);
    }
  }, {
    timezone: 'Africa/Abidjan' // Fuseau horaire de la Côte d'Ivoire (GMT+0)
  });

  console.log('[Session Reminders] Cron jobs initialized successfully');
  console.log('[Session Reminders] - Opening reminders: Every day at 9:00 AM (Africa/Abidjan)');
  console.log('[Session Reminders] - Closing reminders: Every day at 8:00 PM (Africa/Abidjan)');
}
