import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import {
  getTodaySession,
  openDaySession,
  closeDaySession,
  reopenDaySession,
  getSessionHistory,
  checkUnclosedYesterday,
  getSessionStatus,
  calculateSessionDuration,
} from './db-daily-sessions';
import { merchants, users, merchantDailySessions } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Daily Sessions Management', () => {
  let testMerchantId: number;
  let testUserId: number;
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database not available');

    // Créer un utilisateur de test
    const userResult = await db
      .insert(users)
      .values({
        openId: `test-daily-session-${Date.now()}`,
        name: 'Test Merchant Daily Session',
        role: 'merchant',
        language: 'fr',
      });

    testUserId = userResult[0].insertId;

    // Créer un marchand de test
    const merchantResult = await db
      .insert(merchants)
      .values({
        userId: testUserId,
        merchantNumber: `TEST-DS-${Date.now()}`,
        businessName: 'Test Business Daily Session',
      });

    testMerchantId = merchantResult[0].insertId;
  });

  afterAll(async () => {
    if (!db) return;
    // Nettoyer les données de test
    await db.delete(merchantDailySessions).where(eq(merchantDailySessions.merchantId, testMerchantId));
    await db.delete(merchants).where(eq(merchants.id, testMerchantId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it('should return null for a non-existent session', async () => {
    const session = await getTodaySession(testMerchantId);
    
    expect(session).toBeNull();
    expect(getSessionStatus(session)).toBe('NOT_OPENED');
  });

  it('should open a day session successfully', async () => {
    const notes = 'Mon objectif: vendre 50 000 FCFA';
    const session = await openDaySession(testMerchantId, notes);
    
    expect(session).toBeDefined();
    expect(session).not.toBeNull();
    expect(session?.merchantId).toBe(testMerchantId);
    expect(getSessionStatus(session!)).toBe('OPENED');
    expect(session?.openedAt).not.toBeNull();
    expect(session?.closedAt).toBeNull();
    expect(session?.openingNotes).toBe(notes);
  });

  it('should get today session after opening', async () => {
    const session = await getTodaySession(testMerchantId);
    
    expect(session).toBeDefined();
    expect(session?.merchantId).toBe(testMerchantId);
    expect(getSessionStatus(session!)).toBe('OPENED');
  });

  it('should update opening notes when opening again', async () => {
    const newNotes = 'Objectif mis à jour: vendre 100 000 FCFA';
    const session = await openDaySession(testMerchantId, newNotes);
    
    expect(session).toBeDefined();
    expect(session?.openingNotes).toBe(newNotes);
    expect(getSessionStatus(session!)).toBe('OPENED');
  });

  it('should close a day session successfully', async () => {
    const notes = 'Les tomates se vendent mieux le matin';
    const session = await closeDaySession(testMerchantId, notes);
    
    expect(session).toBeDefined();
    expect(session).not.toBeNull();
    expect(getSessionStatus(session!)).toBe('CLOSED');
    expect(session?.openedAt).not.toBeNull();
    expect(session?.closedAt).not.toBeNull();
    expect(session?.closingNotes).toBe(notes);
    
    const duration = calculateSessionDuration(session!);
    expect(duration).toBeGreaterThanOrEqual(0);
  });

  it('should reopen a closed session successfully', async () => {
    const session = await reopenDaySession(testMerchantId);
    
    expect(session).toBeDefined();
    expect(session).not.toBeNull();
    expect(getSessionStatus(session!)).toBe('OPENED');
    expect(session?.openedAt).not.toBeNull();
    expect(session?.closedAt).toBeNull();
  });

  it('should retrieve session history', async () => {
    // Fermer la session pour avoir un historique complet
    await closeDaySession(testMerchantId);

    const history = await getSessionHistory(testMerchantId, 10);
    
    expect(history).toBeDefined();
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0]?.merchantId).toBe(testMerchantId);
  });

  it('should check for unclosed yesterday session', async () => {
    const result = await checkUnclosedYesterday(testMerchantId);
    
    // Pas de session hier pour ce test, donc null
    expect(result).toBeNull();
  });

  it('should get the same session when called multiple times on the same day', async () => {
    const session1 = await getTodaySession(testMerchantId);
    const session2 = await getTodaySession(testMerchantId);
    
    expect(session1?.id).toBe(session2?.id);
    expect(session1?.sessionDate).toEqual(session2?.sessionDate);
  });
});
