#!/usr/bin/env node
/**
 * Script d'audit des données de la base de données
 * Identifie les données mockées ou de test
 * Date: 27 décembre 2024
 */

import { getDb } from '../db.ts';
import { users, merchants, sales, products, merchantStock, groupedOrders, merchantDailySessions, courses, quizzes, quizAttempts, merchantSocialProtection } from '../../drizzle/schema.ts';
import { sql, count, desc, asc } from 'drizzle-orm';
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

const totalUsers = await db.select({ count: count() }).from(users);
const usersWithOpenId = await db.select({ count: count() }).from(users).where(sql`openId IS NOT NULL`);
const usersWithoutOpenId = await db.select({ count: count() }).from(users).where(sql`openId IS NULL`);

const totalMerchants = await db.select({ count: count() }).from(merchants);
const merchantsWithPhone = await db.select({ count: count() }).from(merchants).where(sql`phone IS NOT NULL`);
const merchantsWithoutPhone = await db.select({ count: count() }).from(merchants).where(sql`phone IS NULL`);
const verifiedMerchants = await db.select({ count: count() }).from(merchants).where(sql`verified = 1`);

// Marchands avec noms suspects
const suspiciousMerchants = await db.select({
  merchantNumber: merchants.merchantNumber,
  businessName: merchants.businessName,
  phone: merchants.phone,
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
  total: totalUsers[0].count,
  withOpenId: usersWithOpenId[0].count,
  withoutOpenId: usersWithoutOpenId[0].count
};

report.summary.merchants = {
  total: totalMerchants[0].count,
  withPhone: merchantsWithPhone[0].count,
  withoutPhone: merchantsWithoutPhone[0].count,
  verified: verifiedMerchants[0].count
};

report.suspiciousData.merchants = suspiciousMerchants;

console.log(`  ✓ Total utilisateurs: ${totalUsers[0].count}`);
console.log(`  ✓ Total marchands: ${totalMerchants[0].count}`);
console.log(`  ⚠️  Marchands suspects: ${suspiciousMerchants.length}`);

// ============================================================================
// 2. AUDIT DES VENTES
// ============================================================================

console.log('\n📊 2. Audit des ventes...');

const totalSales = await db.select({ count: count() }).from(sales);
const salesWithTransaction = await db.select({ count: count() }).from(sales).where(sql`transactionId IS NOT NULL`);
const cashSales = await db.select({ count: count() }).from(sales).where(sql`paymentMethod = 'cash'`);
const mobileMoneyS = await db.select({ count: count() }).from(sales).where(sql`paymentMethod = 'mobile_money'`);

// Ventes par période
const salesLast24h = await db.select({ count: count() }).from(sales).where(sql`createdAt >= DATE_SUB(NOW(), INTERVAL 1 DAY)`);
const salesLast7days = await db.select({ count: count() }).from(sales).where(sql`createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)`);
const salesLast30days = await db.select({ count: count() }).from(sales).where(sql`createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)`);

// Ventes avec montants suspects (trop ronds)
const suspiciousSales = await db.select({ count: count() })
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
  total: totalSales[0].count,
  withTransaction: salesWithTransaction[0].count,
  cash: cashSales[0].count,
  mobileMoney: mobileMoneyS[0].count,
  last24h: salesLast24h[0].count,
  last7days: salesLast7days[0].count,
  last30days: salesLast30days[0].count,
  suspiciousRoundAmounts: suspiciousSales[0].count
};

report.suspiciousData.topSales = topSales;

console.log(`  ✓ Total ventes: ${totalSales[0].count}`);
console.log(`  ✓ Ventes dernières 24h: ${salesLast24h[0].count}`);
console.log(`  ⚠️  Ventes avec montants ronds suspects: ${suspiciousSales[0].count}`);

// ============================================================================
// 3. AUDIT DES PRODUITS
// ============================================================================

console.log('\n📊 3. Audit des produits...');

const totalProducts = await db.select({ count: count() }).from(products);
const productsWithImage = await db.select({ count: count() }).from(products).where(sql`imageUrl IS NOT NULL`);

// Produits avec noms suspects
const suspiciousProducts = await db.select({ count: count() })
  .from(products)
  .where(sql`
    LOWER(nameFr) LIKE '%test%' 
    OR LOWER(nameFr) LIKE '%demo%' 
    OR LOWER(nameFr) LIKE '%mock%'
  `);

report.summary.products = {
  total: totalProducts[0].count,
  withImage: productsWithImage[0].count,
  suspicious: suspiciousProducts[0].count
};

console.log(`  ✓ Total produits: ${totalProducts[0].count}`);
console.log(`  ✓ Produits avec image: ${productsWithImage[0].count}`);

// ============================================================================
// 4. AUDIT DU STOCK
// ============================================================================

console.log('\n📊 4. Audit du stock...');

const totalStock = await db.select({ count: count() }).from(merchantStock);
const stockZero = await db.select({ count: count() }).from(merchantStock).where(sql`quantity = 0`);
const stockLow = await db.select({ count: count() }).from(merchantStock).where(sql`quantity < 10`);

report.summary.stock = {
  total: totalStock[0].count,
  zero: stockZero[0].count,
  low: stockLow[0].count
};

console.log(`  ✓ Total entrées stock: ${totalStock[0].count}`);
console.log(`  ✓ Stock bas (< 10): ${stockLow[0].count}`);

// ============================================================================
// 5. AUDIT DES PAIEMENTS CNPS/CMU
// ============================================================================

console.log('\n📊 5. Audit des paiements CNPS/CMU...');

const totalSocialProtection = await db.select({ count: count() }).from(merchantSocialProtection);
const cnpsActive = await db.select({ count: count() }).from(merchantSocialProtection).where(sql`cnpsStatus = 'active'`);
const cmuActive = await db.select({ count: count() }).from(merchantSocialProtection).where(sql`cmuStatus = 'active'`);
const rstiActive = await db.select({ count: count() }).from(merchantSocialProtection).where(sql`rstiStatus = 'active'`);

report.summary.socialProtection = {
  total: totalSocialProtection[0].count,
  cnpsActive: cnpsActive[0].count,
  cmuActive: cmuActive[0].count,
  rstiActive: rstiActive[0].count
};

console.log(`  ✓ Total protection sociale: ${totalSocialProtection[0].count}`);
console.log(`  ✓ CNPS actifs: ${cnpsActive[0].count}`);
console.log(`  ✓ CMU actifs: ${cmuActive[0].count}`);

// ============================================================================
// 6. AUDIT DES COMMANDES GROUPÉES
// ============================================================================

console.log('\n📊 6. Audit des commandes groupées...');

const totalGroupedOrders = await db.select({ count: count() }).from(groupedOrders);
const draftOrders = await db.select({ count: count() }).from(groupedOrders).where(sql`status = 'draft'`);
const confirmedOrders = await db.select({ count: count() }).from(groupedOrders).where(sql`status = 'confirmed'`);
const deliveredOrders = await db.select({ count: count() }).from(groupedOrders).where(sql`status = 'delivered'`);

report.summary.groupedOrders = {
  total: totalGroupedOrders[0].count,
  draft: draftOrders[0].count,
  confirmed: confirmedOrders[0].count,
  delivered: deliveredOrders[0].count
};

console.log(`  ✓ Total commandes groupées: ${totalGroupedOrders[0].count}`);

// ============================================================================
// 7. AUDIT DES SESSIONS QUOTIDIENNES
// ============================================================================

console.log('\n📊 7. Audit des sessions quotidiennes...');

const totalSessions = await db.select({ count: count() }).from(merchantDailySessions);
const openedSessions = await db.select({ count: count() }).from(merchantDailySessions).where(sql`status = 'OPENED'`);
const closedSessions = await db.select({ count: count() }).from(merchantDailySessions).where(sql`status = 'CLOSED'`);

report.summary.sessions = {
  total: totalSessions[0].count,
  opened: openedSessions[0].count,
  closed: closedSessions[0].count
};

console.log(`  ✓ Total sessions: ${totalSessions[0].count}`);
console.log(`  ✓ Sessions ouvertes: ${openedSessions[0].count}`);

// ============================================================================
// 8. AUDIT DES COURS E-LEARNING
// ============================================================================

console.log('\n📊 8. Audit des cours e-learning...');

const totalCourses = await db.select({ count: count() }).from(courses);
const coursesWithVideo = await db.select({ count: count() }).from(courses).where(sql`videoUrl IS NOT NULL`);
const totalQuizzes = await db.select({ count: count() }).from(quizzes);
const totalQuizAttempts = await db.select({ count: count() }).from(quizAttempts);

report.summary.elearning = {
  courses: totalCourses[0].count,
  coursesWithVideo: coursesWithVideo[0].count,
  quizzes: totalQuizzes[0].count,
  quizAttempts: totalQuizAttempts[0].count
};

console.log(`  ✓ Total cours: ${totalCourses[0].count}`);
console.log(`  ✓ Total questions quiz: ${totalQuizzes[0].count}`);

// ============================================================================
// 9. RECOMMANDATIONS
// ============================================================================

console.log('\n📋 Génération des recommandations...');

if (suspiciousMerchants.length > 0) {
  report.recommendations.push({
    priority: 'HIGH',
    category: 'Marchands',
    message: `${suspiciousMerchants.length} marchands ont des noms suspects (test, demo, mock, fake). Vérifier et nettoyer si nécessaire.`
  });
}

if (suspiciousSales[0].count > 0) {
  report.recommendations.push({
    priority: 'MEDIUM',
    category: 'Ventes',
    message: `${suspiciousSales[0].count} ventes ont des montants ronds suspects. Vérifier s'il s'agit de données de test.`
  });
}

// Vérifier les statuts de protection sociale
if (totalSocialProtection[0].count === 0) {
  report.recommendations.push({
    priority: 'MEDIUM',
    category: 'Protection Sociale',
    message: `Aucune donnée de protection sociale trouvée. Vérifier l'intégration.`
  });
}

// Vérifier si les données sont récentes
const recentDataThreshold = 7; // jours
if (salesLast7days[0].count === 0) {
  report.recommendations.push({
    priority: 'HIGH',
    category: 'Ventes',
    message: `Aucune vente dans les ${recentDataThreshold} derniers jours. Les données semblent anciennes ou mockées.`
  });
}

// ============================================================================
// 10. SAUVEGARDE DU RAPPORT
// ============================================================================

console.log('\n💾 Sauvegarde du rapport...');

const reportPath = '/home/ubuntu/ifn-connect-improved/RAPPORT_AUDIT_DONNEES.json';
writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log(`\n✅ Rapport d'audit sauvegardé : ${reportPath}`);

// ============================================================================
// 11. AFFICHAGE DU RÉSUMÉ
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

console.log('\n🛡️ Protection Sociale:');
console.log(`  - Total enregistrements: ${report.summary.socialProtection.total}`);
console.log(`  - CNPS actifs: ${report.summary.socialProtection.cnpsActive}`);
console.log(`  - CMU actifs: ${report.summary.socialProtection.cmuActive}`);

console.log('\n📚 E-Learning:');
console.log(`  - Cours: ${report.summary.elearning.courses}`);
console.log(`  - Tentatives quiz: ${report.summary.elearning.quizAttempts}`);

console.log('\n⚠️  Recommandations:');
report.recommendations.forEach((rec, index) => {
  console.log(`  ${index + 1}. [${rec.priority}] ${rec.category}: ${rec.message}`);
});

console.log('\n' + '='.repeat(60));
console.log('✅ Audit terminé avec succès !');
console.log('='.repeat(60) + '\n');

process.exit(0);
