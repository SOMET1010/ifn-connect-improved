import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { users, merchants, sales, products, merchantStock } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { getSalesByMerchant, getTodayStats, getLast7DaysSales, getTopProducts, getTotalBalance } from './db-sales';
import { getMerchantStock, getLowStock } from './db-products';

/**
 * Tests de performance pour les requêtes critiques
 * Vérifie que les requêtes restent rapides même avec beaucoup de données
 */

describe('Performance Tests', () => {
  let testUserId: number;
  let testMerchantId: number;
  let testProductIds: number[] = [];
  const PERFORMANCE_THRESHOLD_MS = 1000; // 1 seconde max

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database unavailable');

    // Créer un utilisateur et un marchand de test
    const [user] = await db
      .insert(users)
      .values({
        openId: `perf-test-${Date.now()}`,
        name: 'Performance Test Merchant',
        phone: '+2250707070799',
        role: 'merchant',
      })
      .$returningId();
    testUserId = user.id;

    const [merchant] = await db
      .insert(merchants)
      .values({
        userId: testUserId,
        merchantNumber: `MRC-PERF-${Date.now()}`,
        businessName: 'Performance Test Business',
        businessType: 'Commerce',
        location: 'Abidjan',
      })
      .$returningId();
    testMerchantId = merchant.id;

    // Créer 10 produits de test
    for (let i = 1; i <= 10; i++) {
      const [product] = await db
        .insert(products)
        .values({
          name: `Produit Test Perf ${i}`,
          category: 'Test',
          unit: 'pièce',
          basePrice: '1000.00',
        })
        .$returningId();
      testProductIds.push(product.id);

      // Créer du stock pour chaque produit
      await db.insert(merchantStock).values({
        merchantId: testMerchantId,
        productId: product.id,
        quantity: 100,
      });
    }

    // Créer 100 ventes de test pour simuler une charge réaliste
    const salesData = [];
    for (let i = 0; i < 100; i++) {
      const productId = testProductIds[i % testProductIds.length];
      salesData.push({
        merchantId: testMerchantId,
        productId,
        quantity: Math.floor(Math.random() * 5) + 1,
        unitPrice: '1000.00',
        totalAmount: '5000.00',
        paymentMethod: i % 2 === 0 ? 'cash' : 'mobile_money',
        transactionId: `TXN-PERF-${i}`,
      });
    }

    // Insérer les ventes par lots de 20 pour éviter les timeouts
    for (let i = 0; i < salesData.length; i += 20) {
      const batch = salesData.slice(i, i + 20);
      await db.insert(sales).values(batch);
    }

    console.log(`✅ Données de test créées : ${salesData.length} ventes, ${testProductIds.length} produits`);
  }, 60000); // Timeout de 60 secondes pour la préparation

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Nettoyer les données de test
    await db.delete(sales).where(eq(sales.merchantId, testMerchantId));
    await db.delete(merchantStock).where(eq(merchantStock.merchantId, testMerchantId));
    
    for (const productId of testProductIds) {
      await db.delete(products).where(eq(products.id, productId));
    }
    
    await db.delete(merchants).where(eq(merchants.id, testMerchantId));
    await db.delete(users).where(eq(users.id, testUserId));

    console.log('✅ Données de test nettoyées');
  }, 30000);

  it('should load merchant dashboard stats quickly (< 1s)', async () => {
    const startTime = Date.now();

    const todayStats = await getTodayStats(testMerchantId);
    const last7Days = await getLast7DaysSales(testMerchantId);
    const topProducts = await getTopProducts(testMerchantId);

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`⏱️  Dashboard stats loaded in ${duration}ms`);

    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    expect(todayStats).toBeDefined();
    expect(last7Days).toBeDefined();
    expect(topProducts).toBeDefined();
  }, 10000);

  it('should load sales history with pagination quickly (< 1s)', async () => {
    const startTime = Date.now();

    const salesHistory = await getSalesByMerchant(testMerchantId, 20, 0);

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`⏱️  Sales history loaded in ${duration}ms`);

    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    expect(salesHistory).toBeDefined();
    expect(Array.isArray(salesHistory)).toBe(true);
    expect(salesHistory.length).toBeGreaterThan(0);
    expect(salesHistory.length).toBeLessThanOrEqual(20);
  }, 10000);

  it('should load merchant stock quickly (< 1s)', async () => {
    const startTime = Date.now();

    const stockList = await getMerchantStock(testMerchantId);

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`⏱️  Stock list loaded in ${duration}ms`);

    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    expect(stockList).toBeDefined();
    expect(stockList.length).toBe(testProductIds.length);
  }, 10000);

  it('should create a sale quickly (< 500ms)', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database unavailable');

    const startTime = Date.now();

    const [newSale] = await db
      .insert(sales)
      .values({
        merchantId: testMerchantId,
        productId: testProductIds[0],
        quantity: 2,
        unitPrice: '1000.00',
        totalAmount: '2000.00',
        paymentMethod: 'cash',
      })
      .$returningId();

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`⏱️  Sale created in ${duration}ms`);

    expect(duration).toBeLessThan(500); // Création de vente doit être très rapide
    expect(newSale).toBeDefined();
    expect(newSale.id).toBeDefined();

    // Nettoyer la vente créée
    await db.delete(sales).where(eq(sales.id, newSale.id));
  }, 10000);

  it('should update stock quickly (< 500ms)', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database unavailable');

    const startTime = Date.now();

    await db
      .update(merchantStock)
      .set({ quantity: 150 })
      .where(
        eq(merchantStock.merchantId, testMerchantId) &&
        eq(merchantStock.productId, testProductIds[0])
      );

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`⏱️  Stock updated in ${duration}ms`);

    expect(duration).toBeLessThan(500); // Mise à jour de stock doit être très rapide
  }, 10000);

  it('should handle multiple concurrent reads efficiently', async () => {
    const startTime = Date.now();

    // Simuler 5 requêtes concurrentes
    const promises = [
      getTodayStats(testMerchantId),
      getLast7DaysSales(testMerchantId),
      getTopProducts(testMerchantId),
      getSalesByMerchant(testMerchantId, 20, 0),
      getTotalBalance(testMerchantId),
    ];

    await Promise.all(promises);

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`⏱️  5 concurrent reads completed in ${duration}ms`);

    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS * 2); // 2 secondes max pour 5 requêtes concurrentes
  }, 15000);

  it('should load low stock alerts quickly (< 500ms)', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database unavailable');

    // Créer un produit avec stock bas
    const [lowStockProduct] = await db
      .insert(products)
      .values({
        name: 'Produit Stock Bas Perf',
        category: 'Test',
        unit: 'pièce',
        basePrice: '1000.00',
      })
      .$returningId();

    await db.insert(merchantStock).values({
      merchantId: testMerchantId,
      productId: lowStockProduct.id,
      quantity: '5', // Stock bas
      minThreshold: '10', // Seuil supérieur pour déclencher l'alerte
    });

    const startTime = Date.now();

    const lowStockItems = await getLowStock(testMerchantId);

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`⏱️  Low stock alerts loaded in ${duration}ms`);

    expect(duration).toBeLessThan(500);
    expect(lowStockItems).toBeDefined();
    expect(lowStockItems.length).toBeGreaterThan(0);

    // Nettoyer
    await db.delete(merchantStock).where(eq(merchantStock.productId, lowStockProduct.id));
    await db.delete(products).where(eq(products.id, lowStockProduct.id));
  }, 10000);
});
