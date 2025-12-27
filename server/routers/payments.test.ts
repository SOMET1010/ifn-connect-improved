import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { appRouter } from '../routers';
import { getDb } from '../db';
import { users, merchants, marketplaceOrders, transactions } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import type { TrpcContext } from '../_core/context';

/**
 * Tests unitaires pour le router payments - Mode Simulation
 * Teste le flux de paiement Mobile Money en mode simulation
 */

describe('Payments Router - Mobile Money (Simulation)', () => {
  let testUserId: number;
  let testMerchantId: number;
  let testOrderId: number;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Créer un utilisateur de test
    const [user] = await db
      .insert(users)
      .values({
        openId: `test-payments-${Date.now()}`,
        name: 'Test Merchant Payments',
        role: 'merchant',
      })
      .$returningId();

    testUserId = user.id;

    // Créer un marchand de test
    const [merchant] = await db
      .insert(merchants)
      .values({
        userId: testUserId,
        merchantNumber: `MRC-TEST-PAY-${Date.now()}`,
        businessName: 'Test Business Payments',
      })
      .$returningId();

    testMerchantId = merchant.id;

    // Créer une commande de test avec le bon buyerId (merchantId)
    const [order] = await db
      .insert(marketplaceOrders)
      .values({
        buyerId: testMerchantId, // Utiliser merchantId car c'est la foreign key
        sellerId: testMerchantId,
        productId: 1,
        quantity: 10,
        totalAmount: '5000',
        status: 'pending_payment',
      })
      .$returningId();

    testOrderId = order.id;

    // Créer le caller avec le contexte utilisateur
    const ctx: TrpcContext = {
      user: {
        id: testUserId,
        openId: `test-${testUserId}`,
        name: 'Test Merchant',
        email: null,
        loginMethod: 'manus',
        role: 'merchant',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {
        protocol: 'https',
        headers: {},
        db: Promise.resolve(db),
      } as any,
      res: {} as any,
    };

    caller = appRouter.createCaller(ctx);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Nettoyer les données de test (ordre important pour les contraintes FK)
    await db.delete(transactions).where(eq(transactions.merchantId, testMerchantId));
    await db.delete(marketplaceOrders).where(eq(marketplaceOrders.buyerId, testMerchantId));
    await db.delete(marketplaceOrders).where(eq(marketplaceOrders.sellerId, testMerchantId));
    await db.delete(merchants).where(eq(merchants.id, testMerchantId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it('devrait initier un paiement Orange Money avec succès (simulation)', async () => {
    const result = await caller.payments.initiatePayment({
      orderId: testOrderId,
      provider: 'orange_money',
      phoneNumber: '+2250707070700', // Numéro valide se terminant par 00 = succès
    });

    expect(result).toBeDefined();
    expect(result.transactionId).toBeDefined();
    expect(result.reference).toMatch(/^IFN-/);
    expect(result.status).toBe('pending');
    expect(result.simulation).toBe(true);
    expect(result.message).toContain('simulé');
  });

  it('devrait initier un paiement MTN Mobile Money avec succès (simulation)', async () => {
    const result = await caller.payments.initiatePayment({
      orderId: testOrderId,
      provider: 'mtn_momo',
      phoneNumber: '+2250707070700',
    });

    expect(result).toBeDefined();
    expect(result.transactionId).toBeDefined();
    expect(result.reference).toMatch(/^IFN-/);
    expect(result.status).toBe('pending');
    expect(result.simulation).toBe(true);
  });

  it('devrait vérifier le statut d\'un paiement', async () => {
    const payment = await caller.payments.initiatePayment({
      orderId: testOrderId,
      provider: 'wave',
      phoneNumber: '+2250707070700',
    });

    // Vérifier immédiatement (status = pending)
    const statusPending = await caller.payments.checkPaymentStatus({
      transactionId: payment.transactionId,
    });

    expect(statusPending).toBeDefined();
    expect(statusPending.transactionId).toBe(payment.transactionId);
    expect(['pending', 'success']).toContain(statusPending.status);

    // Attendre que la simulation se termine (2 secondes)
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Vérifier à nouveau (devrait être success)
    const statusFinal = await caller.payments.checkPaymentStatus({
      transactionId: payment.transactionId,
    });

    expect(statusFinal.status).toBe('success');
  });

  it('devrait récupérer l\'historique des transactions', async () => {
    const history = await caller.payments.getTransactionHistory({
      limit: 10,
    });

    expect(history).toBeDefined();
    expect(Array.isArray(history)).toBe(true);
    // Au moins les 3 transactions créées dans les tests précédents
    expect(history.length).toBeGreaterThanOrEqual(3);
    expect(history[0]).toHaveProperty('reference');
    expect(history[0]).toHaveProperty('provider');
    expect(history[0]).toHaveProperty('status');
  });

  it('devrait rejeter un numéro de téléphone invalide', async () => {
    try {
      await caller.payments.initiatePayment({
        orderId: testOrderId,
        provider: 'orange_money',
        phoneNumber: '123', // Numéro invalide
      });
      expect.fail('Devrait avoir rejeté le numéro invalide');
    } catch (error: any) {
      expect(error.message).toContain('invalid');
    }
  });

  it('devrait rembourser une transaction réussie (simulation)', async () => {
    // Créer une nouvelle commande pour ce test
    const db = await getDb();
    if (!db) throw new Error('Database unavailable');

    const [newOrder] = await db
      .insert(marketplaceOrders)
      .values({
        buyerId: testMerchantId,
        sellerId: testMerchantId,
        productId: 1,
        quantity: 10,
        totalAmount: '5000.00',
        status: 'pending_payment',
      })
      .$returningId();

    // Créer une transaction réussie
    const payment = await caller.payments.initiatePayment({
      orderId: newOrder.id,
      provider: 'orange_money',
      phoneNumber: '+2250707070700',
    });

    // Attendre que la simulation se termine
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Vérifier que le paiement est réussi
    const statusBefore = await caller.payments.checkPaymentStatus({
      transactionId: payment.transactionId,
    });
    expect(statusBefore.status).toBe('success');

    // Rembourser
    const refund = await caller.payments.refundPayment({
      transactionId: payment.transactionId,
      reason: 'Test de remboursement',
    });

    expect(refund).toBeDefined();
    expect(refund.success).toBe(true);

    // Vérifier le statut après remboursement
    const statusAfter = await caller.payments.checkPaymentStatus({
      transactionId: payment.transactionId,
    });

    expect(statusAfter.status).toBe('refunded');
  });
});
