import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import {
  getTodaySession,
  openDaySession,
  closeDaySession,
  reopenDaySession,
  getSessionHistory,
  checkUnclosedYesterday,
} from './db-daily-sessions';
import { merchants, users } from '../drizzle/schema';

describe('Daily Sessions Management', () => {
  let testMerchantId: number;
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database not available');

    // Créer un utilisateur de test
    const [testUser] = await db
      .insert(users)
      .values({
        openId: `test-daily-session-${Date.now()}`,
        name: 'Test Merchant Daily Session',
        role: 'merchant',
        language: 'fr',
      })
      .$returningId();

    // Créer un marchand de test
    const [testMerchant] = await db
      .insert(merchants)
      .values({
        userId: testUser.id,
        merchantNumber: `TEST-DS-${Date.now()}`,
        businessName: 'Test Business Daily Session',
      })
      .$returningId();

    testMerchantId = testMerchant.id;
  });

  afterAll(async () => {
    if (!db) return;
    // Nettoyer les données de test
    await db.delete(merchants).where({ id: testMerchantId });
  });

  it('should create a new session with NOT_OPENED status', async () => {
    const session = await getTodaySession(testMerchantId);
    
    expect(session).toBeDefined();
    expect(session.merchantId).toBe(testMerchantId);
    expect(session.status).toBe('NOT_OPENED');
    expect(session.openedAt).toBeNull();
    expect(session.closedAt).toBeNull();
  });

  it('should open a day session successfully', async () => {
    const notes = 'Mon objectif: vendre 50 000 FCFA';
    const session = await openDaySession(testMerchantId, notes);
    
    expect(session).toBeDefined();
    expect(session.status).toBe('OPENED');
    expect(session.openedAt).not.toBeNull();
    expect(session.closedAt).toBeNull();
    expect(session.openingNotes).toBe(notes);
  });

  it('should throw error when trying to open an already opened session', async () => {
    await expect(openDaySession(testMerchantId)).rejects.toThrow('Votre journée est déjà ouverte');
  });

  it('should close a day session successfully', async () => {
    const notes = 'Les tomates se vendent mieux le matin';
    const session = await closeDaySession(testMerchantId, notes);
    
    expect(session).toBeDefined();
    expect(session.status).toBe('CLOSED');
    expect(session.openedAt).not.toBeNull();
    expect(session.closedAt).not.toBeNull();
    expect(session.closingNotes).toBe(notes);
  });

  it('should throw error when trying to close an already closed session', async () => {
    await expect(closeDaySession(testMerchantId)).rejects.toThrow('Votre journée est déjà fermée');
  });

  it('should reopen a closed session successfully', async () => {
    const session = await reopenDaySession(testMerchantId);
    
    expect(session).toBeDefined();
    expect(session.status).toBe('OPENED');
    expect(session.openedAt).not.toBeNull();
    expect(session.closedAt).toBeNull();
  });

  it('should retrieve session history', async () => {
    // Fermer la session pour avoir un historique complet
    await closeDaySession(testMerchantId);

    const history = await getSessionHistory(testMerchantId, 10);
    
    expect(history).toBeDefined();
    expect(history.sessions).toBeInstanceOf(Array);
    expect(history.sessions.length).toBeGreaterThan(0);
    expect(history.stats).toBeDefined();
    expect(history.stats.totalDaysWorked).toBeGreaterThanOrEqual(0);
    expect(history.stats.averageDuration).toBeGreaterThanOrEqual(0);
  });

  it('should check for unclosed yesterday session', async () => {
    const result = await checkUnclosedYesterday(testMerchantId);
    
    expect(result).toBeDefined();
    expect(result.hasUnclosed).toBe(false); // Pas de session hier pour ce test
  });

  it('should get the same session when called multiple times on the same day', async () => {
    const session1 = await getTodaySession(testMerchantId);
    const session2 = await getTodaySession(testMerchantId);
    
    expect(session1.id).toBe(session2.id);
    expect(session1.sessionDate).toEqual(session2.sessionDate);
  });
});
