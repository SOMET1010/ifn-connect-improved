import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDb } from './db';
import { users, merchants, actors, markets } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { agentRouter } from './routers/agent';

/**
 * Tests d'intégration pour le module Agent - Enrôlement complet
 * Teste le workflow complet : capture photo → géolocalisation → validation
 */

describe('Agent Enrollment Integration Tests', () => {
  let testMarketId: number;
  let testMerchantCode: string;
  let testUserId: number;

  // Créer une image de test en base64 (1x1 pixel JPEG)
  const testImageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA//2Q==';

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database unavailable');

    // Créer un marché de test avec un nom unique
    const uniqueMarketName = `Marché Test Agent ${Date.now()}`;
    const [market] = await db
      .insert(markets)
      .values({
        name: uniqueMarketName,
        location: 'Abidjan Test',
        latitude: '5.3600',
        longitude: '-4.0083',
      })
      .$returningId();
    testMarketId = market.id;
  });

  afterEach(async () => {
    const db = await getDb();
    if (!db) return;

    // Nettoyer les données de test dans l'ordre inverse des dépendances
    if (testUserId) {
      await db.delete(actors).where(eq(actors.actorKey, testMerchantCode));
      await db.delete(merchants).where(eq(merchants.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    }
    if (testMarketId) {
      await db.delete(markets).where(eq(markets.id, testMarketId));
    }
  });

  it('should successfully enroll a merchant with all required data', async () => {
    const caller = agentRouter.createCaller({} as any);

    const enrollmentData = {
      fullName: 'Test Merchant Agent',
      phone: '0707070707',
      dateOfBirth: '1990-01-01',
      idPhoto: testImageBase64,
      licensePhoto: testImageBase64,
      latitude: 5.3600,
      longitude: -4.0083,
      marketId: testMarketId,
      hasCNPS: true,
      cnpsNumber: 'CNPS-TEST-123',
      hasCMU: false,
    };

    const result = await caller.enrollMerchant(enrollmentData);

    expect(result.success).toBe(true);
    expect(result.merchantCode).toMatch(/^MRC-\d{5}$/);
    expect(result.message).toContain('Enrôlement réussi');

    testMerchantCode = result.merchantCode;

    // Vérifier que l'utilisateur a été créé
    const db = await getDb();
    if (!db) throw new Error('Database unavailable');

    const createdUser = await db
      .select()
      .from(users)
      .where(eq(users.name, enrollmentData.fullName))
      .limit(1);

    expect(createdUser).toHaveLength(1);
    expect(createdUser[0].phone).toBe(enrollmentData.phone);
    expect(createdUser[0].role).toBe('merchant');
    testUserId = createdUser[0].id;

    // Vérifier que le marchand a été créé
    const createdMerchant = await db
      .select()
      .from(merchants)
      .where(eq(merchants.merchantNumber, result.merchantCode))
      .limit(1);

    expect(createdMerchant).toHaveLength(1);
    expect(createdMerchant[0].businessName).toBe(enrollmentData.fullName);
    expect(createdMerchant[0].cnpsStatus).toBe('active');
    expect(createdMerchant[0].cnpsNumber).toBe(enrollmentData.cnpsNumber);
    expect(createdMerchant[0].cmuStatus).toBe('inactive');

    // Vérifier que l'acteur a été créé (historique)
    const createdActor = await db
      .select()
      .from(actors)
      .where(eq(actors.actorKey, result.merchantCode))
      .limit(1);

    expect(createdActor).toHaveLength(1);
    expect(createdActor[0].fullName).toBe(enrollmentData.fullName);
    expect(createdActor[0].marketId).toBe(testMarketId);
  }, 15000);

  it('should successfully enroll a merchant without CNPS/CMU', async () => {
    const caller = agentRouter.createCaller({} as any);

    const enrollmentData = {
      fullName: 'Test Merchant No Protection',
      phone: '0707070708',
      dateOfBirth: '1985-05-15',
      idPhoto: testImageBase64,
      licensePhoto: testImageBase64,
      latitude: 5.3650,
      longitude: -4.0100,
      marketId: testMarketId,
      hasCNPS: false,
      hasCMU: false,
    };

    const result = await caller.enrollMerchant(enrollmentData);

    expect(result.success).toBe(true);
    expect(result.merchantCode).toMatch(/^MRC-\d{5}$/);

    testMerchantCode = result.merchantCode;

    const db = await getDb();
    if (!db) throw new Error('Database unavailable');

    // Vérifier que le marchand n'a pas de protection sociale
    const createdMerchant = await db
      .select()
      .from(merchants)
      .where(eq(merchants.merchantNumber, result.merchantCode))
      .limit(1);

    expect(createdMerchant).toHaveLength(1);
    expect(createdMerchant[0].cnpsStatus).toBe('inactive');
    expect(createdMerchant[0].cmuStatus).toBe('inactive');
    expect(createdMerchant[0].cnpsNumber).toBeNull();
    expect(createdMerchant[0].cmuNumber).toBeNull();

    // Récupérer l'utilisateur pour le cleanup
    const createdUser = await db
      .select()
      .from(users)
      .where(eq(users.name, enrollmentData.fullName))
      .limit(1);
    testUserId = createdUser[0].id;
  }, 15000);

  it('should generate unique merchant codes for multiple enrollments', async () => {
    const caller = agentRouter.createCaller({} as any);

    const enrollmentData1 = {
      fullName: 'Test Merchant 1',
      phone: '0707070709',
      dateOfBirth: '1992-03-20',
      idPhoto: testImageBase64,
      licensePhoto: testImageBase64,
      latitude: 5.3700,
      longitude: -4.0150,
      marketId: testMarketId,
      hasCNPS: false,
      hasCMU: false,
    };

    const enrollmentData2 = {
      fullName: 'Test Merchant 2',
      phone: '0707070710',
      dateOfBirth: '1988-07-10',
      idPhoto: testImageBase64,
      licensePhoto: testImageBase64,
      latitude: 5.3750,
      longitude: -4.0200,
      marketId: testMarketId,
      hasCNPS: false,
      hasCMU: false,
    };

    const result1 = await caller.enrollMerchant(enrollmentData1);
    const result2 = await caller.enrollMerchant(enrollmentData2);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result1.merchantCode).not.toBe(result2.merchantCode);
    expect(result1.merchantCode).toMatch(/^MRC-\d{5}$/);
    expect(result2.merchantCode).toMatch(/^MRC-\d{5}$/);

    // Nettoyer les deux marchands
    const db = await getDb();
    if (!db) throw new Error('Database unavailable');

    const user1 = await db
      .select()
      .from(users)
      .where(eq(users.name, enrollmentData1.fullName))
      .limit(1);

    const user2 = await db
      .select()
      .from(users)
      .where(eq(users.name, enrollmentData2.fullName))
      .limit(1);

    await db.delete(actors).where(eq(actors.actorKey, result1.merchantCode));
    await db.delete(actors).where(eq(actors.actorKey, result2.merchantCode));
    await db.delete(merchants).where(eq(merchants.userId, user1[0].id));
    await db.delete(merchants).where(eq(merchants.userId, user2[0].id));
    await db.delete(users).where(eq(users.id, user1[0].id));
    await db.delete(users).where(eq(users.id, user2[0].id));
  }, 20000);

  it('should correctly store geolocation data', async () => {
    const caller = agentRouter.createCaller({} as any);

    const latitude = 5.3456;
    const longitude = -4.0789;

    const enrollmentData = {
      fullName: 'Test Merchant GPS',
      phone: '0707070711',
      dateOfBirth: '1995-11-25',
      idPhoto: testImageBase64,
      licensePhoto: testImageBase64,
      latitude,
      longitude,
      marketId: testMarketId,
      hasCNPS: false,
      hasCMU: false,
    };

    const result = await caller.enrollMerchant(enrollmentData);

    expect(result.success).toBe(true);
    testMerchantCode = result.merchantCode;

    const db = await getDb();
    if (!db) throw new Error('Database unavailable');

    const createdMerchant = await db
      .select()
      .from(merchants)
      .where(eq(merchants.merchantNumber, result.merchantCode))
      .limit(1);

    expect(createdMerchant).toHaveLength(1);
    expect(parseFloat(createdMerchant[0].latitude!)).toBeCloseTo(latitude, 4);
    expect(parseFloat(createdMerchant[0].longitude!)).toBeCloseTo(longitude, 4);

    // Récupérer l'utilisateur pour le cleanup
    const createdUser = await db
      .select()
      .from(users)
      .where(eq(users.name, enrollmentData.fullName))
      .limit(1);
    testUserId = createdUser[0].id;
  }, 15000);

  it('should retrieve agent stats after enrollments', async () => {
    const caller = agentRouter.createCaller({} as any);

    // Enrôler un marchand
    const enrollmentData = {
      fullName: 'Test Merchant Stats',
      phone: '0707070712',
      dateOfBirth: '1993-09-05',
      idPhoto: testImageBase64,
      licensePhoto: testImageBase64,
      latitude: 5.3800,
      longitude: -4.0250,
      marketId: testMarketId,
      hasCNPS: true,
      cnpsNumber: 'CNPS-STATS-456',
      hasCMU: true,
      cmuNumber: 'CMU-STATS-789',
    };

    const result = await caller.enrollMerchant(enrollmentData);
    expect(result.success).toBe(true);
    testMerchantCode = result.merchantCode;

    // Récupérer les statistiques
    const stats = await caller.stats();

    expect(stats).toBeDefined();
    expect(stats.totalEnrollments).toBeGreaterThan(0);
    expect(stats.enrollmentsToday).toBeGreaterThanOrEqual(0);
    expect(stats.enrollmentsThisMonth).toBeGreaterThan(0);
    expect(stats.marketsCovered).toBeGreaterThan(0);

    // Récupérer l'utilisateur pour le cleanup
    const db = await getDb();
    if (!db) throw new Error('Database unavailable');
    const createdUser = await db
      .select()
      .from(users)
      .where(eq(users.name, enrollmentData.fullName))
      .limit(1);
    testUserId = createdUser[0].id;
  }, 15000);
});
