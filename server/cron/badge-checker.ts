import cron from 'node-cron';
import { getDb } from '../db';
import { merchants, sales, badges, merchantBadges, merchantStock } from '../../drizzle/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Cron job pour vérifier et débloquer automatiquement les badges
 * Exécuté tous les jours à minuit (fuseau GMT+0 - Côte d'Ivoire)
 */

let isRunning = false;

/**
 * Fonction principale de vérification des badges
 */
async function checkAndUnlockBadges() {
  if (isRunning) {
    console.log('[Badge Checker] ⏭️  Vérification déjà en cours, skip');
    return;
  }

  isRunning = true;
  const startTime = Date.now();

  try {
    const db = await getDb();
    if (!db) {
      console.error('[Badge Checker] ❌ Base de données indisponible');
      return;
    }

    console.log('[Badge Checker] 🔄 Début de la vérification automatique des badges');

    // Récupérer tous les marchands actifs
    const allMerchants = await db.select().from(merchants);
    console.log(`[Badge Checker] 📊 ${allMerchants.length} marchands à vérifier`);

    // Récupérer tous les badges
    const allBadges = await db.select().from(badges);
    const badgeMap = new Map(allBadges.map(b => [b.code, b]));

    let totalUnlocked = 0;
    let merchantsProcessed = 0;

    for (const merchant of allMerchants) {
      merchantsProcessed++;

      // Récupérer les badges déjà débloqués
      const existingBadges = await db
        .select()
        .from(merchantBadges)
        .where(eq(merchantBadges.merchantId, merchant.id));
      
      const existingBadgeIds = new Set(existingBadges.map(mb => mb.badgeId));

      // 1. FIRST_SALE - Première vente
      const [salesCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(sales)
        .where(eq(sales.merchantId, merchant.id));

      if (salesCount && salesCount.count > 0) {
        const unlocked = await unlockBadge(db, merchant.id, 'FIRST_SALE', badgeMap, existingBadgeIds);
        if (unlocked) totalUnlocked++;
      }

      // 2. GOLD_SELLER - 100k FCFA de ventes
      const [totalSales] = await db
        .select({ total: sql<number>`COALESCE(SUM(total_amount), 0)` })
        .from(sales)
        .where(eq(sales.merchantId, merchant.id));

      if (totalSales && totalSales.total >= 100000) {
        const unlocked = await unlockBadge(db, merchant.id, 'GOLD_SELLER', badgeMap, existingBadgeIds);
        if (unlocked) totalUnlocked++;
      }

      // 3. EXPERT_SELLER - 500k FCFA de ventes
      if (totalSales && totalSales.total >= 500000) {
        const unlocked = await unlockBadge(db, merchant.id, 'EXPERT_SELLER', badgeMap, existingBadgeIds);
        if (unlocked) totalUnlocked++;
      }

      // 4. MASTER_SELLER - 1M FCFA de ventes
      if (totalSales && totalSales.total >= 1000000) {
        const unlocked = await unlockBadge(db, merchant.id, 'MASTER_SELLER', badgeMap, existingBadgeIds);
        if (unlocked) totalUnlocked++;
      }

      // 5. SOCIAL_PROTECTOR - CNPS + CMU actifs
      if (merchant.cnpsStatus === 'active' && merchant.cmuStatus === 'active') {
        const unlocked = await unlockBadge(db, merchant.id, 'SOCIAL_PROTECTOR', badgeMap, existingBadgeIds);
        if (unlocked) totalUnlocked++;
      }

      // 6. STOCK_MANAGER - 10 produits en stock
      const [stockCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(merchantStock)
        .where(eq(merchantStock.merchantId, merchant.id));

      if (stockCount && stockCount.count >= 10) {
        const unlocked = await unlockBadge(db, merchant.id, 'STOCK_MANAGER', badgeMap, existingBadgeIds);
        if (unlocked) totalUnlocked++;
      }

      // 7. ACTIVE_TRADER - 50 ventes
      if (salesCount && salesCount.count >= 50) {
        const unlocked = await unlockBadge(db, merchant.id, 'ACTIVE_TRADER', badgeMap, existingBadgeIds);
        if (unlocked) totalUnlocked++;
      }

      // 8. DIGITAL_PIONEER - Utilise la plateforme depuis 30 jours
      const accountAge = Math.floor((Date.now() - merchant.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      if (accountAge >= 30) {
        const unlocked = await unlockBadge(db, merchant.id, 'DIGITAL_PIONEER', badgeMap, existingBadgeIds);
        if (unlocked) totalUnlocked++;
      }

      // 9. LEGEND - 5 badges débloqués
      const [currentBadgeCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(merchantBadges)
        .where(eq(merchantBadges.merchantId, merchant.id));

      if (currentBadgeCount && currentBadgeCount.count >= 5) {
        const unlocked = await unlockBadge(db, merchant.id, 'LEGEND', badgeMap, existingBadgeIds);
        if (unlocked) totalUnlocked++;
      }

      // Log de progression tous les 100 marchands
      if (merchantsProcessed % 100 === 0) {
        console.log(`[Badge Checker] 📈 Progression: ${merchantsProcessed}/${allMerchants.length} marchands traités`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Badge Checker] ✅ Vérification terminée en ${duration}s`);
    console.log(`[Badge Checker] 🏆 ${totalUnlocked} nouveaux badges débloqués`);
    console.log(`[Badge Checker] 📊 ${merchantsProcessed} marchands traités`);

  } catch (error: any) {
    console.error('[Badge Checker] ❌ Erreur:', error.message);
  } finally {
    isRunning = false;
  }
}

/**
 * Débloque un badge pour un marchand si les conditions sont remplies
 */
async function unlockBadge(
  db: any,
  merchantId: number,
  badgeCode: string,
  badgeMap: Map<string, any>,
  existingBadgeIds: Set<number>
): Promise<boolean> {
  const badge = badgeMap.get(badgeCode);
  if (!badge) {
    return false;
  }

  if (existingBadgeIds.has(badge.id)) {
    return false;
  }

  try {
    await db.insert(merchantBadges).values({
      merchantId,
      badgeId: badge.id,
      isNew: true,
    });
    console.log(`[Badge Checker] 🎖️  Badge débloqué: ${badge.name} pour marchand #${merchantId}`);
    existingBadgeIds.add(badge.id);
    return true;
  } catch (error: any) {
    console.error(`[Badge Checker] ❌ Erreur déblocage badge ${badgeCode}:`, error.message);
    return false;
  }
}

/**
 * Initialiser le cron job
 * Exécution tous les jours à minuit (00:00) en GMT+0
 */
export function initBadgeChecker() {
  // Cron expression: "0 0 * * *" = tous les jours à minuit
  // Format: seconde minute heure jour mois jour-de-semaine
  const cronExpression = '0 0 * * *';

  cron.schedule(cronExpression, () => {
    console.log('[Badge Checker] ⏰ Déclenchement du cron job (minuit GMT+0)');
    checkAndUnlockBadges();
  }, {
    timezone: 'GMT' // Fuseau horaire de la Côte d'Ivoire
  });

  console.log('[Badge Checker] ✅ Cron job initialisé (exécution quotidienne à minuit GMT+0)');
  
  // Exécuter immédiatement au démarrage pour tester (optionnel)
  // checkAndUnlockBadges();
}

/**
 * Fonction pour exécuter manuellement la vérification
 * Utile pour les tests ou l'exécution manuelle
 */
export async function runBadgeCheckNow() {
  console.log('[Badge Checker] 🚀 Exécution manuelle déclenchée');
  await checkAndUnlockBadges();
}
