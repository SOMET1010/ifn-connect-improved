import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { appRouter } from './routers';
import { getDb } from './db';
import { users, merchants, merchantSocialProtection } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Tests d'intégration pour ExpirationAlert
 * Vérifie que les données de protection sociale sont correctement récupérées
 */

describe('ExpirationAlert Integration', () => {
  let testUserId: number;
  let testMerchantId: number;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database unavailable');

    // Créer un utilisateur marchand de test
    const [user] = await db
      .insert(users)
      .values({
        openId: `test-expiration-${Date.now()}`,
        name: 'Test Merchant Expiration',
        email: 'test.expiration@example.com',
        phone: '+2250707070708',
        role: 'merchant',
      })
      .$returningId();
    testUserId = user.id;

    // Créer un marchand de test
    const [merchant] = await db
      .insert(merchants)
      .values({
        userId: testUserId,
        merchantNumber: `MRC-EXP-${Date.now()}`,
        businessName: 'Test Business Expiration',
        businessType: 'Commerce',
        location: 'Abidjan',
      })
      .$returningId();
    testMerchantId = merchant.id;

    // Créer une couverture sociale avec dates d'expiration proches
    const now = new Date();
    const in15Days = new Date();
    in15Days.setDate(in15Days.getDate() + 15);

    const in25Days = new Date();
    in25Days.setDate(in25Days.getDate() + 25);

    await db.insert(merchantSocialProtection).values({
      merchantId: testMerchantId,
      hasCNPS: true,
      cnpsNumber: 'CNPS-EXP-123',
      cnpsStatus: 'active',
      cnpsExpiryDate: in15Days,
      hasCMU: true,
      cmuNumber: 'CMU-EXP-456',
      cmuStatus: 'active',
      cmuExpiryDate: in25Days,
      hasRSTI: false,
    });
  });

  afterEach(async () => {
    const db = await getDb();
    if (!db) return;

    // Nettoyer les données de test
    await db.delete(merchantSocialProtection).where(eq(merchantSocialProtection.merchantId, testMerchantId));
    await db.delete(merchants).where(eq(merchants.id, testMerchantId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it('should retrieve merchant with social protection data via auth.myMerchant', async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, role: 'merchant' },
      req: {} as any,
      res: {} as any,
    });

    const merchant = await caller.auth.myMerchant();

    expect(merchant).toBeDefined();
    expect(merchant?.id).toBe(testMerchantId);
    expect(merchant?.socialProtection).toBeDefined();
    expect(merchant?.socialProtection?.hasCNPS).toBe(true);
    expect(merchant?.socialProtection?.cnpsExpiryDate).toBeDefined();
    expect(merchant?.socialProtection?.hasCMU).toBe(true);
    expect(merchant?.socialProtection?.cmuExpiryDate).toBeDefined();
  });

  it('should detect CNPS expiring in 15 days', async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, role: 'merchant' },
      req: {} as any,
      res: {} as any,
    });

    const merchant = await caller.auth.myMerchant();

    expect(merchant?.socialProtection?.cnpsExpiryDate).toBeDefined();

    const daysUntilExpiry = Math.ceil(
      (new Date(merchant!.socialProtection!.cnpsExpiryDate!).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );

    expect(daysUntilExpiry).toBeGreaterThanOrEqual(14);
    expect(daysUntilExpiry).toBeLessThanOrEqual(16);
  });

  it('should detect CMU expiring in 25 days', async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, role: 'merchant' },
      req: {} as any,
      res: {} as any,
    });

    const merchant = await caller.auth.myMerchant();

    expect(merchant?.socialProtection?.cmuExpiryDate).toBeDefined();

    const daysUntilExpiry = Math.ceil(
      (new Date(merchant!.socialProtection!.cmuExpiryDate!).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );

    expect(daysUntilExpiry).toBeGreaterThanOrEqual(24);
    expect(daysUntilExpiry).toBeLessThanOrEqual(26);
  });

  it('should return null for merchant without social protection', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database unavailable');

    // Créer un marchand sans protection sociale
    const [user2] = await db
      .insert(users)
      .values({
        openId: `test-no-protection-${Date.now()}`,
        name: 'Test No Protection',
        email: 'test.noprotection@example.com',
        role: 'merchant',
      })
      .$returningId();

    const [merchant2] = await db
      .insert(merchants)
      .values({
        userId: user2.id,
        merchantNumber: `MRC-NOPROT-${Date.now()}`,
        businessName: 'Test No Protection',
        businessType: 'Commerce',
        location: 'Abidjan',
      })
      .$returningId();

    const caller = appRouter.createCaller({
      user: { id: user2.id, role: 'merchant' },
      req: {} as any,
      res: {} as any,
    });

    const merchant = await caller.auth.myMerchant();

    expect(merchant).toBeDefined();
    expect(merchant?.socialProtection).toBeNull();

    // Nettoyer
    await db.delete(merchants).where(eq(merchants.id, merchant2.id));
    await db.delete(users).where(eq(users.id, user2.id));
  });

  it('should retrieve expiring protections via socialProtection.getExpiringProtections', async () => {
    const adminCaller = appRouter.createCaller({
      user: { id: 1, role: 'admin' },
      req: {} as any,
      res: {} as any,
    });

    const expiring = await adminCaller.socialProtection.getExpiringProtections({
      daysThreshold: 30,
    });

    expect(expiring).toBeDefined();
    // Notre marchand de test doit être dans la liste
    const found = expiring.find((p) => p.merchantId === testMerchantId);
    expect(found).toBeDefined();
    expect(found?.cnpsExpiryDate).toBeDefined();
    expect(found?.cmuExpiryDate).toBeDefined();
  });
});
