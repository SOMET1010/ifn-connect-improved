/**
 * Initialisation du cron job pour les rappels d'ouverture/fermeture de journée
 * 
 * NOUVEAU SYSTÈME INTELLIGENT :
 * - S'exécute toutes les heures (de 6h à 22h)
 * - Vérifie les paramètres personnalisés de chaque marchand
 * - Envoie les rappels à l'heure configurée par le marchand
 * 
 * Fuseau horaire : GMT+0 (Côte d'Ivoire)
 */

import cron from 'node-cron';
import { checkMissingOpeningsAtTime, checkMissingClosingsAtTime } from './session-reminders';

export function initSessionRemindersCron() {
  console.log('[Session Reminders] Initializing intelligent cron jobs...');

  // Cron job qui s'exécute toutes les heures de 6h à 22h
  // Vérifie les paramètres de chaque marchand et envoie les rappels à l'heure configurée
  cron.schedule('0 6-22 * * *', async () => {
    const currentHour = new Date().getHours();
    const currentTime = `${String(currentHour).padStart(2, '0')}:00`;
    
    console.log(`[Session Reminders] Running intelligent reminders job at ${currentTime}...`);
    
    try {
      // Vérifier les rappels d'ouverture pour les marchands ayant configuré cette heure
      const openingResult = await checkMissingOpeningsAtTime(currentTime);
      if (openingResult.success) {
        console.log(`[Session Reminders] Opening reminders completed. ${openingResult.notificationsCreated} notifications created for ${currentTime}.`);
      } else {
        console.error('[Session Reminders] Opening reminders failed:', openingResult.error);
      }

      // Vérifier les rappels de fermeture pour les marchands ayant configuré cette heure
      const closingResult = await checkMissingClosingsAtTime(currentTime);
      if (closingResult.success) {
        console.log(`[Session Reminders] Closing reminders completed. ${closingResult.notificationsCreated} notifications created for ${currentTime}.`);
      } else {
        console.error('[Session Reminders] Closing reminders failed:', closingResult.error);
      }
    } catch (error) {
      console.error('[Session Reminders] Error in intelligent reminders job:', error);
    }
  }, {
    timezone: 'Africa/Abidjan' // Fuseau horaire de la Côte d'Ivoire (GMT+0)
  });

  console.log('[Session Reminders] Intelligent cron jobs initialized successfully');
  console.log('[Session Reminders] - Runs every hour from 6 AM to 10 PM (Africa/Abidjan)');
  console.log('[Session Reminders] - Checks each merchant\'s personalized reminder times');
}
