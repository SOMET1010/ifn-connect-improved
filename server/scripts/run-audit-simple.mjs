#!/usr/bin/env node
/**
 * Script d'audit simplifié des données de la base de données
 * Identifie les données mockées ou de test
 * Date: 27 décembre 2024
 */

import { getDb } from '../db.ts';
import { users, merchants, sales, products, merchantStock } from '../../drizzle/schema.ts';
import { sql, count, desc } from 'drizzle-orm';
import { writeFileSync } from 'fs';

console.log('🔍 Démarrage de l\'audit des données...\n');

const db = await getDb();
if (!db) {
  console.error('❌ Impossible de se connecter à la base de données');
  process.exit(1);
}

const report = {
  date: new Date().toISOString(),
  summary: {},
  suspiciousData: {},
  recommendations: []
};

// ============================================================================
// 1. AUDIT DES UTILISATEURS ET MARCHANDS
// ============================================================================

console.log('📊 1. Audit des utilisateurs et marchands...');

const [totalUsersResult] = await db.select({ count: count() }).from(users);
const [totalMerchantsResult] = await db.select({ count: count() }).from(merchants);
const [verifiedMerchantsResult] = await db.select({ count: count() }).from(merchants).where(sql`isVerified = 1`);

// Marchands avec noms suspects
const suspiciousMerchants = await db.select({
  merchantNumber: merchants.merchantNumber,
  businessName: merchants.businessName,
  createdAt: merchants.createdAt
})
.from(merchants)
.where(sql`
  LOWER(businessName) LIKE '%test%' 
  OR LOWER(businessName) LIKE '%demo%' 
  OR LOWER(businessName) LIKE '%mock%'
  OR LOWER(businessName) LIKE '%fake%'
`)
.limit(50);

report.summary.users = {
  total: totalUsersResult.count
};

report.summary.merchants = {
  total: totalMerchantsResult.count,
  verified: verifiedMerchantsResult.count,
  suspicious: suspiciousMerchants.length
};

report.suspiciousData.merchants = suspiciousMerchants;

console.log(`  ✓ Total utilisateurs: ${totalUsersResult.count}`);
console.log(`  ✓ Total marchands: ${totalMerchantsResult.count}`);
console.log(`  ✓ Marchands vérifiés: ${verifiedMerchantsResult.count}`);
console.log(`  ⚠️  Marchands suspects: ${suspiciousMerchants.length}`);

// ============================================================================
// 2. AUDIT DES VENTES
// ============================================================================

console.log('\n📊 2. Audit des ventes...');

const [totalSalesResult] = await db.select({ count: count() }).from(sales);
const [cashSalesResult] = await db.select({ count: count() }).from(sales).where(sql`paymentMethod = 'cash'`);
const [mobileMoneyResult] = await db.select({ count: count() }).from(sales).where(sql`paymentMethod = 'mobile_money'`);

// Ventes par période
const [salesLast24hResult] = await db.select({ count: count() }).from(sales).where(sql`createdAt >= DATE_SUB(NOW(), INTERVAL 1 DAY)`);
const [salesLast7daysResult] = await db.select({ count: count() }).from(sales).where(sql`createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)`);
const [salesLast30daysResult] = await db.select({ count: count() }).from(sales).where(sql`createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)`);

// Ventes avec montants suspects (trop ronds)
const [suspiciousSalesResult] = await db.select({ count: count() })
  .from(sales)
  .where(sql`totalAmount IN (1000, 5000, 10000, 50000, 100000, 500000, 1000000)`);

// Top 10 ventes les plus élevées
const topSales = await db.select({
  merchantId: sales.merchantId,
  totalAmount: sales.totalAmount,
  paymentMethod: sales.paymentMethod,
  createdAt: sales.createdAt
})
.from(sales)
.orderBy(desc(sales.totalAmount))
.limit(10);

report.summary.sales = {
  total: totalSalesResult.count,
  cash: cashSalesResult.count,
  mobileMoney: mobileMoneyResult.count,
  last24h: salesLast24hResult.count,
  last7days: salesLast7daysResult.count,
  last30days: salesLast30daysResult.count,
  suspiciousRoundAmounts: suspiciousSalesResult.count
};

report.suspiciousData.topSales = topSales;

console.log(`  ✓ Total ventes: ${totalSalesResult.count}`);
console.log(`  ✓ Ventes dernières 24h: ${salesLast24hResult.count}`);
console.log(`  ✓ Ventes derniers 7 jours: ${salesLast7daysResult.count}`);
console.log(`  ✓ Ventes derniers 30 jours: ${salesLast30daysResult.count}`);
console.log(`  ⚠️  Ventes avec montants ronds suspects: ${suspiciousSalesResult.count}`);

// ============================================================================
// 3. AUDIT DES PRODUITS
// ============================================================================

console.log('\n📊 3. Audit des produits...');

const [totalProductsResult] = await db.select({ count: count() }).from(products);
const [productsWithImageResult] = await db.select({ count: count() }).from(products).where(sql`imageUrl IS NOT NULL`);

// Produits avec noms suspects
const [suspiciousProductsResult] = await db.select({ count: count() })
  .from(products)
  .where(sql`
    LOWER(name) LIKE '%test%' 
    OR LOWER(name) LIKE '%demo%' 
    OR LOWER(name) LIKE '%mock%'
  `);

report.summary.products = {
  total: totalProductsResult.count,
  withImage: productsWithImageResult.count,
  suspicious: suspiciousProductsResult.count
};

console.log(`  ✓ Total produits: ${totalProductsResult.count}`);
console.log(`  ✓ Produits avec image: ${productsWithImageResult.count}`);
console.log(`  ⚠️  Produits suspects: ${suspiciousProductsResult.count}`);

// ============================================================================
// 4. AUDIT DU STOCK
// ============================================================================

console.log('\n📊 4. Audit du stock...');

const [totalStockResult] = await db.select({ count: count() }).from(merchantStock);
const [stockZeroResult] = await db.select({ count: count() }).from(merchantStock).where(sql`quantity = 0`);
const [stockLowResult] = await db.select({ count: count() }).from(merchantStock).where(sql`quantity < 10`);

report.summary.stock = {
  total: totalStockResult.count,
  zero: stockZeroResult.count,
  low: stockLowResult.count
};

console.log(`  ✓ Total entrées stock: ${totalStockResult.count}`);
console.log(`  ✓ Stock à zéro: ${stockZeroResult.count}`);
console.log(`  ✓ Stock bas (< 10): ${stockLowResult.count}`);

// ============================================================================
// 5. RECOMMANDATIONS
// ============================================================================

console.log('\n📋 Génération des recommandations...');

if (suspiciousMerchants.length > 0) {
  report.recommendations.push({
    priority: 'HIGH',
    category: 'Marchands',
    message: `${suspiciousMerchants.length} marchands ont des noms suspects (test, demo, mock, fake). Vérifier et nettoyer si nécessaire.`,
    action: 'DELETE_SUSPICIOUS_MERCHANTS'
  });
}

if (suspiciousSalesResult.count > 0) {
  report.recommendations.push({
    priority: 'MEDIUM',
    category: 'Ventes',
    message: `${suspiciousSalesResult.count} ventes ont des montants ronds suspects. Vérifier s'il s'agit de données de test.`,
    action: 'REVIEW_ROUND_AMOUNT_SALES'
  });
}

// Vérifier si les données sont récentes
const recentDataThreshold = 7; // jours
if (salesLast7daysResult.count === 0) {
  report.recommendations.push({
    priority: 'HIGH',
    category: 'Ventes',
    message: `Aucune vente dans les ${recentDataThreshold} derniers jours. Les données semblent anciennes ou mockées.`,
    action: 'VERIFY_DATA_FRESHNESS'
  });
} else {
  report.recommendations.push({
    priority: 'LOW',
    category: 'Ventes',
    message: `Les données de ventes sont récentes (${salesLast7daysResult.count} ventes dans les 7 derniers jours). ✅`,
    action: 'NONE'
  });
}

if (suspiciousProductsResult.count > 0) {
  report.recommendations.push({
    priority: 'MEDIUM',
    category: 'Produits',
    message: `${suspiciousProductsResult.count} produits ont des noms suspects. Vérifier et nettoyer.`,
    action: 'DELETE_SUSPICIOUS_PRODUCTS'
  });
}

// Vérifier si les produits sont tous des seeds
if (totalProductsResult.count === 34) {
  report.recommendations.push({
    priority: 'INFO',
    category: 'Produits',
    message: `Exactement 34 produits trouvés. Il s'agit probablement des produits de seed initiaux. ✅`,
    action: 'NONE'
  });
}

// ============================================================================
// 6. SAUVEGARDE DU RAPPORT
// ============================================================================

console.log('\n💾 Sauvegarde du rapport...');

const reportPath = '/home/ubuntu/ifn-connect-improved/RAPPORT_AUDIT_DONNEES.json';
writeFileSync(reportPath, JSON.stringify(report, null, 2));

const reportMdPath = '/home/ubuntu/ifn-connect-improved/RAPPORT_AUDIT_DONNEES.md';
const markdown = `# 📊 Rapport d'Audit des Données

**Date:** ${new Date(report.date).toLocaleString('fr-FR')}

## 📈 Résumé

### 👥 Utilisateurs et Marchands
- **Total utilisateurs:** ${report.summary.users.total}
- **Total marchands:** ${report.summary.merchants.total}
- **Marchands vérifiés:** ${report.summary.merchants.verified}
- **Marchands suspects:** ${report.summary.merchants.suspicious}

### 💰 Ventes
- **Total ventes:** ${report.summary.sales.total}
- **Ventes en espèces:** ${report.summary.sales.cash}
- **Ventes mobile money:** ${report.summary.sales.mobileMoney}
- **Ventes dernières 24h:** ${report.summary.sales.last24h}
- **Ventes derniers 7 jours:** ${report.summary.sales.last7days}
- **Ventes derniers 30 jours:** ${report.summary.sales.last30days}
- **Ventes avec montants ronds suspects:** ${report.summary.sales.suspiciousRoundAmounts}

### 📦 Produits et Stock
- **Total produits:** ${report.summary.products.total}
- **Produits avec image:** ${report.summary.products.withImage}
- **Produits suspects:** ${report.summary.products.suspicious}
- **Total entrées stock:** ${report.summary.stock.total}
- **Stock à zéro:** ${report.summary.stock.zero}
- **Stock bas (< 10):** ${report.summary.stock.low}

## ⚠️ Données Suspectes

### Marchands avec noms suspects
${suspiciousMerchants.length > 0 ? suspiciousMerchants.map(m => `- **${m.merchantNumber}** - ${m.businessName} (créé le ${new Date(m.createdAt).toLocaleDateString('fr-FR')})`).join('\n') : '_Aucun marchand suspect trouvé_'}

### Top 10 des ventes les plus élevées
${topSales.map((s, i) => `${i + 1}. **${s.totalAmount} FCFA** - Marchand #${s.merchantId} - ${s.paymentMethod} (${new Date(s.createdAt).toLocaleDateString('fr-FR')})`).join('\n')}

## 📋 Recommandations

${report.recommendations.map((rec, i) => `### ${i + 1}. [${rec.priority}] ${rec.category}

${rec.message}

**Action suggérée:** \`${rec.action}\`
`).join('\n')}

## ✅ Conclusion

${report.recommendations.filter(r => r.priority === 'HIGH').length > 0 
  ? '⚠️ **Des actions prioritaires sont nécessaires.** Veuillez traiter les recommandations de priorité HIGH en premier.'
  : '✅ **Aucune action urgente requise.** Les données semblent cohérentes.'}

---

*Rapport généré automatiquement par le script d'audit*
`;

writeFileSync(reportMdPath, markdown);

console.log(`\n✅ Rapport d'audit sauvegardé :`);
console.log(`   - JSON: ${reportPath}`);
console.log(`   - Markdown: ${reportMdPath}`);

// ============================================================================
// 7. AFFICHAGE DU RÉSUMÉ
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('📊 RÉSUMÉ DE L\'AUDIT DES DONNÉES');
console.log('='.repeat(60));

console.log('\n👥 Utilisateurs et Marchands:');
console.log(`  - Total utilisateurs: ${report.summary.users.total}`);
console.log(`  - Total marchands: ${report.summary.merchants.total}`);
console.log(`  - Marchands vérifiés: ${report.summary.merchants.verified}`);

console.log('\n💰 Ventes:');
console.log(`  - Total ventes: ${report.summary.sales.total}`);
console.log(`  - Ventes dernières 24h: ${report.summary.sales.last24h}`);
console.log(`  - Ventes derniers 7 jours: ${report.summary.sales.last7days}`);

console.log('\n📦 Produits et Stock:');
console.log(`  - Total produits: ${report.summary.products.total}`);
console.log(`  - Total entrées stock: ${report.summary.stock.total}`);

console.log('\n⚠️  Recommandations:');
report.recommendations.forEach((rec, index) => {
  const icon = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : rec.priority === 'LOW' ? '🟢' : 'ℹ️';
  console.log(`  ${icon} ${index + 1}. [${rec.priority}] ${rec.category}: ${rec.message}`);
});

console.log('\n' + '='.repeat(60));
console.log('✅ Audit terminé avec succès !');
console.log('='.repeat(60) + '\n');

process.exit(0);
