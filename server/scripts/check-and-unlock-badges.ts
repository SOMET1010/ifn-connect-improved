import { getDb } from "../db";
import { merchants, sales, badges, merchantBadges, merchantStock } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Vérifie et débloque automatiquement les badges pour tous les marchands
 */
async function checkAndUnlockBadges() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Impossible de se connecter à la base de données");
    process.exit(1);
  }

  console.log("🔄 Vérification et déblocage automatique des badges...\n");

  // Récupérer tous les marchands
  const allMerchants = await db.select().from(merchants).limit(50);
  console.log(`📊 ${allMerchants.length} marchands trouvés\n`);

  // Récupérer tous les badges
  const allBadges = await db.select().from(badges);
  const badgeMap = new Map(allBadges.map(b => [b.code, b]));

  let totalUnlocked = 0;

  for (const merchant of allMerchants) {
    console.log(`\n👤 Marchand: ${merchant.businessName} (${merchant.merchantNumber})`);

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
      await unlockBadge(db, merchant.id, "FIRST_SALE", badgeMap, existingBadgeIds);
    }

    // 2. GOLD_SELLER - 100k FCFA de ventes
    const [totalSales] = await db
      .select({ total: sql<number>`COALESCE(SUM(totalAmount), 0)` })
      .from(sales)
      .where(eq(sales.merchantId, merchant.id));

    if (totalSales && totalSales.total >= 100000) {
      await unlockBadge(db, merchant.id, "GOLD_SELLER", badgeMap, existingBadgeIds);
    }

    // 3. EXPERT_SELLER - 500k FCFA de ventes
    if (totalSales && totalSales.total >= 500000) {
      await unlockBadge(db, merchant.id, "EXPERT_SELLER", badgeMap, existingBadgeIds);
    }

    // 4. MASTER_SELLER - 1M FCFA de ventes
    if (totalSales && totalSales.total >= 1000000) {
      await unlockBadge(db, merchant.id, "MASTER_SELLER", badgeMap, existingBadgeIds);
    }

    // 5. SOCIAL_PROTECTOR - CNPS + CMU actifs
    if (merchant.cnpsStatus === "active" && merchant.cmuStatus === "active") {
      await unlockBadge(db, merchant.id, "SOCIAL_PROTECTOR", badgeMap, existingBadgeIds);
    }

    // 6. STOCK_MANAGER - 10 produits en stock
    const [stockCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(merchantStock)
      .where(eq(merchantStock.merchantId, merchant.id));

    if (stockCount && stockCount.count >= 10) {
      await unlockBadge(db, merchant.id, "STOCK_MANAGER", badgeMap, existingBadgeIds);
    }

    // 7. LEGEND - 5 badges débloqués
    const [currentBadgeCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(merchantBadges)
      .where(eq(merchantBadges.merchantId, merchant.id));

    if (currentBadgeCount && currentBadgeCount.count >= 5) {
      await unlockBadge(db, merchant.id, "LEGEND", badgeMap, existingBadgeIds);
    }
  }

  console.log(`\n\n✅ Vérification terminée !`);
  console.log(`🏆 ${totalUnlocked} nouveaux badges débloqués`);
  
  process.exit(0);
}

async function unlockBadge(
  db: any,
  merchantId: number,
  badgeCode: string,
  badgeMap: Map<string, any>,
  existingBadgeIds: Set<number>
): Promise<void> {
  const badge = badgeMap.get(badgeCode);
  if (!badge) {
    console.log(`  ⚠️  Badge ${badgeCode} introuvable`);
    return;
  }

  if (existingBadgeIds.has(badge.id)) {
    console.log(`  ⏭️  Badge ${badge.name} déjà débloqué`);
    return;
  }

  try {
    await db.insert(merchantBadges).values({
      merchantId,
      badgeId: badge.id,
      isNew: true,
    });
    console.log(`  ✅ Badge débloqué: ${badge.name} (+${badge.points} points)`);
    existingBadgeIds.add(badge.id);
  } catch (error: any) {
    console.log(`  ❌ Erreur: ${error.message}`);
  }
}

checkAndUnlockBadges().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exit(1);
});
