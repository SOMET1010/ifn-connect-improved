import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from './db';
import { merchants, sales } from '../drizzle/schema';
import { eq, count, desc } from 'drizzle-orm';
import { getSalesByMerchant, getTodayStats, getLast7DaysSales, getTopProducts } from './db-sales';
import { getMerchantStock } from './db-products';

/**
 * Tests de charge pour valider les performances avec 1000+ ventes
 * Ces tests utilisent les données générées par le script generate-load-test-data.mjs
 */

describe('Load Tests (1000+ sales)', () => {
  let testMerchantId: number;
  let testMerchantNumber: string;
  let totalSalesCount: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database unavailable');

    // Trouver le marchand avec le plus de ventes (celui créé par le script de load test)
    const merchantsWithSales = await db
      .select({
        merchantId: sales.merchantId,
        salesCount: count(sales.id),
      })
      .from(sales)
      .groupBy(sales.merchantId)
      .orderBy(desc(count(sales.id)))
      .limit(1);

    if (!merchantsWithSales.length || merchantsWithSales[0].salesCount < 100) {
      throw new Error(
        'Aucun marchand avec suffisamment de ventes trouvé. ' +
        'Exécutez d\'abord le script: npx tsx server/scripts/generate-load-test-data.mjs'
      );
    }

    testMerchantId = merchantsWithSales[0].merchantId;
    totalSalesCount = merchantsWithSales[0].salesCount;

    // Récupérer les informations du marchand
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.id, testMerchantId))
      .limit(1);

    testMerchantNumber = merchant.merchantNumber;

    console.log(`\n📊 Tests de charge avec:`);
    console.log(`   - Marchand: ${merchant.businessName} (${testMerchantNumber})`);
    console.log(`   - Nombre de ventes: ${totalSalesCount}`);
    console.log('');
  }, 30000);

  it('should load dashboard with 1000+ sales in < 2s', async () => {
    const startTime = Date.now();

    const [stats, last7Days, topProducts] = await Promise.all([
      getTodayStats(testMerchantId),
      getLast7DaysSales(testMerchantId),
      getTopProducts(testMerchantId),
    ]);

    const duration = Date.now() - startTime;

    console.log(`⏱️  Dashboard loaded in ${duration}ms`);
    console.log(`   - Today stats: ${stats.salesCount} ventes, ${stats.totalAmount} FCFA`);
    console.log(`   - Last 7 days: ${last7Days.length} jours de données`);
    console.log(`   - Top products: ${topProducts.length} produits`);

    expect(duration).toBeLessThan(2000); // < 2s
    expect(stats).toBeDefined();
    expect(last7Days).toBeDefined();
    expect(topProducts).toBeDefined();
  }, 15000);

  it('should paginate sales history efficiently (page 1)', async () => {
    const startTime = Date.now();

    const page1 = await getSalesByMerchant(testMerchantId, 50, 0);

    const duration = Date.now() - startTime;

    console.log(`⏱️  Page 1 loaded in ${duration}ms (${page1.length} ventes)`);

    expect(duration).toBeLessThan(1000); // < 1s
    expect(page1).toBeDefined();
    expect(page1.length).toBe(50);
  }, 10000);

  it('should paginate sales history efficiently (page 10)', async () => {
    const startTime = Date.now();

    const page10 = await getSalesByMerchant(testMerchantId, 50, 450); // Page 10 = offset 450

    const duration = Date.now() - startTime;

    console.log(`⏱️  Page 10 loaded in ${duration}ms (${page10.length} ventes)`);

    expect(duration).toBeLessThan(1000); // < 1s
    expect(page10).toBeDefined();
    expect(page10.length).toBe(50);
  }, 10000);

  it('should paginate sales history efficiently (last page)', async () => {
    const startTime = Date.now();

    // Dernière page (offset = totalSalesCount - 50)
    const lastPageOffset = Math.max(0, totalSalesCount - 50);
    const lastPage = await getSalesByMerchant(testMerchantId, 50, lastPageOffset);

    const duration = Date.now() - startTime;

    console.log(`⏱️  Last page loaded in ${duration}ms (${lastPage.length} ventes)`);

    expect(duration).toBeLessThan(1000); // < 1s
    expect(lastPage).toBeDefined();
    expect(lastPage.length).toBeGreaterThan(0);
    expect(lastPage.length).toBeLessThanOrEqual(50);
  }, 10000);

  it('should handle concurrent dashboard requests (10 users)', async () => {
    const startTime = Date.now();

    // Simuler 10 utilisateurs chargeant le dashboard en même temps
    const promises = Array(10)
      .fill(null)
      .map(() => getTodayStats(testMerchantId));

    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;

    console.log(`⏱️  10 concurrent requests completed in ${duration}ms`);

    expect(duration).toBeLessThan(5000); // < 5s pour 10 requêtes
    expect(results).toHaveLength(10);
    results.forEach((result) => {
      expect(result).toBeDefined();
      expect(result.salesCount).toBeGreaterThanOrEqual(0);
    });
  }, 20000);

  it('should handle concurrent page loads (5 different pages)', async () => {
    const startTime = Date.now();

    // Charger 5 pages différentes en parallèle
    const promises = [
      getSalesByMerchant(testMerchantId, 50, 0), // Page 1
      getSalesByMerchant(testMerchantId, 50, 50), // Page 2
      getSalesByMerchant(testMerchantId, 50, 100), // Page 3
      getSalesByMerchant(testMerchantId, 50, 200), // Page 5
      getSalesByMerchant(testMerchantId, 50, 450), // Page 10
    ];

    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;

    console.log(`⏱️  5 concurrent page loads completed in ${duration}ms`);

    expect(duration).toBeLessThan(3000); // < 3s pour 5 pages
    expect(results).toHaveLength(5);
    results.forEach((page) => {
      expect(page).toBeDefined();
      expect(page.length).toBe(50);
    });
  }, 15000);

  it('should load stock list efficiently even with many sales', async () => {
    const startTime = Date.now();

    const stockList = await getMerchantStock(testMerchantId);

    const duration = Date.now() - startTime;

    console.log(`⏱️  Stock list loaded in ${duration}ms (${stockList.length} produits)`);

    expect(duration).toBeLessThan(1000); // < 1s
    expect(stockList).toBeDefined();
    expect(Array.isArray(stockList)).toBe(true);
  }, 10000);

  it('should load last 7 days sales efficiently', async () => {
    const startTime = Date.now();

    const last7Days = await getLast7DaysSales(testMerchantId);

    const duration = Date.now() - startTime;

    console.log(`⏱️  Last 7 days sales loaded in ${duration}ms (${last7Days.length} jours)`);

    expect(duration).toBeLessThan(1000); // < 1s
    expect(last7Days).toBeDefined();
    expect(Array.isArray(last7Days)).toBe(true);
    expect(last7Days.length).toBeGreaterThan(0);
    expect(last7Days.length).toBeLessThanOrEqual(8); // Peut retourner jusqu'à 8 jours (aujourd'hui + 7 jours précédents)
  }, 10000);

  it('should load top products efficiently', async () => {
    const startTime = Date.now();

    const topProducts = await getTopProducts(testMerchantId);

    const duration = Date.now() - startTime;

    console.log(`⏱️  Top products loaded in ${duration}ms (${topProducts.length} produits)`);

    expect(duration).toBeLessThan(1000); // < 1s
    expect(topProducts).toBeDefined();
    expect(Array.isArray(topProducts)).toBe(true);
    expect(topProducts.length).toBeGreaterThan(0);
    expect(topProducts.length).toBeLessThanOrEqual(5);
  }, 10000);

  it('should handle full dashboard load with all widgets', async () => {
    const startTime = Date.now();

    // Charger toutes les données du dashboard en parallèle (comme le ferait l'interface)
    const [stats, last7Days, topProducts, stockList, recentSales] = await Promise.all([
      getTodayStats(testMerchantId),
      getLast7DaysSales(testMerchantId),
      getTopProducts(testMerchantId),
      getMerchantStock(testMerchantId),
      getSalesByMerchant(testMerchantId, 10, 0), // 10 ventes récentes
    ]);

    const duration = Date.now() - startTime;

    console.log(`⏱️  Full dashboard loaded in ${duration}ms`);
    console.log(`   - Today: ${stats.salesCount} ventes, ${stats.totalAmount} FCFA`);
    console.log(`   - Last 7 days: ${last7Days.length} jours`);
    console.log(`   - Top products: ${topProducts.length} produits`);
    console.log(`   - Stock: ${stockList.length} produits`);
    console.log(`   - Recent sales: ${recentSales.length} ventes`);

    expect(duration).toBeLessThan(2000); // < 2s pour tout le dashboard
    expect(stats).toBeDefined();
    expect(last7Days).toBeDefined();
    expect(topProducts).toBeDefined();
    expect(stockList).toBeDefined();
    expect(recentSales).toBeDefined();
  }, 15000);
});
