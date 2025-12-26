import cron from 'node-cron';
import { getDb } from '../db';
import { merchants, merchantSocialProtection, users } from '../../drizzle/schema';
import { eq, and, isNotNull, lte, gte, sql } from 'drizzle-orm';
import { sendExpirationAlert } from './email';

/**
 * Cron job quotidien pour envoyer les alertes d'expiration de couverture sociale
 * 
 * Exécution : Tous les jours à 8h00 (heure locale)
 * Seuils d'alerte : 30 jours, 7 jours, 1 jour avant expiration
 * 
 * Logique :
 * - Détecte toutes les couvertures sociales expirant dans 30, 7 ou 1 jour(s)
 * - Envoie un email personnalisé à chaque marchand concerné
 * - Log les envois réussis et échoués pour suivi
 */

interface ExpiringProtection {
  merchantId: number;
  merchantName: string;
  userEmail: string | null;
  protectionType: 'CNPS' | 'CMU' | 'RSTI';
  expiryDate: Date;
  daysRemaining: number;
}

/**
 * Récupérer toutes les couvertures sociales expirant dans X jours
 */
async function getExpiringProtections(daysThreshold: number): Promise<ExpiringProtection[]> {
  const db = await getDb();
  if (!db) {
    console.error('[Cron] Database unavailable');
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(today);
  targetDate.setDate(targetDate.getDate() + daysThreshold);

  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const results = await db
    .select({
      merchantId: merchants.id,
      merchantName: merchants.businessName,
      userEmail: users.email,
      cnpsExpiryDate: merchantSocialProtection.cnpsExpiryDate,
      cmuExpiryDate: merchantSocialProtection.cmuExpiryDate,
      rstiExpiryDate: merchantSocialProtection.rstiExpiryDate,
      hasCNPS: merchantSocialProtection.hasCNPS,
      hasCMU: merchantSocialProtection.hasCMU,
      hasRSTI: merchantSocialProtection.hasRSTI,
    })
    .from(merchants)
    .innerJoin(users, eq(merchants.userId, users.id))
    .innerJoin(merchantSocialProtection, eq(merchants.id, merchantSocialProtection.merchantId))
    .where(
      sql`(
        (${merchantSocialProtection.hasCNPS} = 1 AND ${merchantSocialProtection.cnpsExpiryDate} >= ${targetDate} AND ${merchantSocialProtection.cnpsExpiryDate} < ${nextDay})
        OR
        (${merchantSocialProtection.hasCMU} = 1 AND ${merchantSocialProtection.cmuExpiryDate} >= ${targetDate} AND ${merchantSocialProtection.cmuExpiryDate} < ${nextDay})
        OR
        (${merchantSocialProtection.hasRSTI} = 1 AND ${merchantSocialProtection.rstiExpiryDate} >= ${targetDate} AND ${merchantSocialProtection.rstiExpiryDate} < ${nextDay})
      )`
    );

  const expiring: ExpiringProtection[] = [];

  for (const row of results) {
    // CNPS expirant
    if (row.hasCNPS && row.cnpsExpiryDate) {
      const expiryDate = new Date(row.cnpsExpiryDate);
      if (expiryDate >= targetDate && expiryDate < nextDay) {
        expiring.push({
          merchantId: row.merchantId,
          merchantName: row.merchantName,
          userEmail: row.userEmail,
          protectionType: 'CNPS',
          expiryDate,
          daysRemaining: daysThreshold,
        });
      }
    }

    // CMU expirant
    if (row.hasCMU && row.cmuExpiryDate) {
      const expiryDate = new Date(row.cmuExpiryDate);
      if (expiryDate >= targetDate && expiryDate < nextDay) {
        expiring.push({
          merchantId: row.merchantId,
          merchantName: row.merchantName,
          userEmail: row.userEmail,
          protectionType: 'CMU',
          expiryDate,
          daysRemaining: daysThreshold,
        });
      }
    }

    // RSTI expirant
    if (row.hasRSTI && row.rstiExpiryDate) {
      const expiryDate = new Date(row.rstiExpiryDate);
      if (expiryDate >= targetDate && expiryDate < nextDay) {
        expiring.push({
          merchantId: row.merchantId,
          merchantName: row.merchantName,
          userEmail: row.userEmail,
          protectionType: 'RSTI',
          expiryDate,
          daysRemaining: daysThreshold,
        });
      }
    }
  }

  return expiring;
}

/**
 * Envoyer les alertes d'expiration pour un seuil donné
 */
async function sendAlertsForThreshold(daysThreshold: number): Promise<void> {
  console.log(`[Cron] Checking protections expiring in ${daysThreshold} day(s)...`);

  const expiring = await getExpiringProtections(daysThreshold);

  if (expiring.length === 0) {
    console.log(`[Cron] No protections expiring in ${daysThreshold} day(s)`);
    return;
  }

  console.log(`[Cron] Found ${expiring.length} protection(s) expiring in ${daysThreshold} day(s)`);

  let successCount = 0;
  let failureCount = 0;

  for (const protection of expiring) {
    if (!protection.userEmail) {
      console.warn(`[Cron] Merchant ${protection.merchantName} has no email - skipping`);
      failureCount++;
      continue;
    }

    const success = await sendExpirationAlert({
      to: protection.userEmail,
      merchantName: protection.merchantName,
      protectionType: protection.protectionType,
      expiryDate: protection.expiryDate,
      daysRemaining: protection.daysRemaining,
    });

    if (success) {
      successCount++;
    } else {
      failureCount++;
    }

    // Pause de 100ms entre chaque email pour éviter le rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`[Cron] Alerts sent: ${successCount} success, ${failureCount} failed`);
}

/**
 * Tâche quotidienne : envoyer toutes les alertes d'expiration
 */
async function runDailyExpirationAlerts(): Promise<void> {
  console.log('[Cron] Starting daily expiration alerts job...');

  try {
    // Alertes pour 30 jours
    await sendAlertsForThreshold(30);

    // Alertes pour 7 jours
    await sendAlertsForThreshold(7);

    // Alertes pour 1 jour
    await sendAlertsForThreshold(1);

    console.log('[Cron] Daily expiration alerts job completed');
  } catch (error) {
    console.error('[Cron] Error in daily expiration alerts job:', error);
  }
}

/**
 * Initialiser le cron job
 * Exécution : Tous les jours à 8h00 (heure locale)
 */
export function initExpirationAlertsCron(): void {
  // Cron expression: '0 8 * * *' = Tous les jours à 8h00
  cron.schedule('0 8 * * *', runDailyExpirationAlerts, {
    timezone: 'Africa/Abidjan', // Fuseau horaire de la Côte d'Ivoire (GMT+0)
  });

  console.log('[Cron] Expiration alerts cron job initialized (daily at 8:00 AM Africa/Abidjan)');
}

/**
 * Fonction utilitaire pour tester manuellement l'envoi d'alertes
 * À utiliser uniquement en développement
 */
export async function testExpirationAlerts(): Promise<void> {
  console.log('[Cron] Running test expiration alerts...');
  await runDailyExpirationAlerts();
}
