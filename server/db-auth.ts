/**
 * Helpers pour l'authentification multi-niveaux
 */

import { eq, and, gt, desc } from "drizzle-orm";
import { getDb } from "./db";
import { 
  authPins, 
  authSessions, 
  authOtpLogs, 
  authAuditLogs,
  merchants,
  users,
  type AuthPin,
  type AuthSession,
  type AuthOtpLog,
  type InsertAuthPin,
  type InsertAuthSession,
  type InsertAuthOtpLog,
  type InsertAuthAuditLog,
} from "../drizzle/schema";

// ============================================================================
// AUTH PINS
// ============================================================================

export async function findPinByUserId(userId: number): Promise<AuthPin | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(authPins).where(eq(authPins.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createPin(data: InsertAuthPin): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.insert(authPins).values(data);
}

export async function updatePin(userId: number, data: Partial<AuthPin>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.update(authPins).set(data).where(eq(authPins.userId, userId));
}

// ============================================================================
// AUTH SESSIONS
// ============================================================================

export async function findActiveSessionBySessionId(sessionId: string): Promise<(AuthSession & { user: any }) | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select({
      session: authSessions,
      user: users,
    })
    .from(authSessions)
    .innerJoin(users, eq(authSessions.userId, users.id))
    .where(
      and(
        eq(authSessions.sessionId, sessionId),
        eq(authSessions.isActive, true),
        gt(authSessions.expiresAt, new Date())
      )
    )
    .limit(1);
  
  if (result.length === 0) return undefined;
  
  return {
    ...result[0].session,
    user: result[0].user,
  };
}

export async function findRecentSessionByUserId(userId: number, daysAgo: number): Promise<AuthSession | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const cutoffDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  
  const result = await db
    .select()
    .from(authSessions)
    .where(
      and(
        eq(authSessions.userId, userId),
        eq(authSessions.isActive, true),
        gt(authSessions.lastActivity, cutoffDate)
      )
    )
    .orderBy(desc(authSessions.lastActivity))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function createSession(data: InsertAuthSession): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.insert(authSessions).values(data);
}

export async function updateSessionActivity(sessionId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db
    .update(authSessions)
    .set({ lastActivity: new Date() })
    .where(eq(authSessions.sessionId, sessionId));
}

export async function deactivateSession(sessionId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db
    .update(authSessions)
    .set({ isActive: false })
    .where(eq(authSessions.sessionId, sessionId));
}

export async function findSessionBySessionId(sessionId: string): Promise<AuthSession | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(authSessions).where(eq(authSessions.sessionId, sessionId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// AUTH OTP LOGS
// ============================================================================

export async function findRecentOTPByUserId(userId: number, minutesAgo: number): Promise<AuthOtpLog | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const cutoffDate = new Date(Date.now() - minutesAgo * 60 * 1000);
  
  const result = await db
    .select()
    .from(authOtpLogs)
    .where(
      and(
        eq(authOtpLogs.userId, userId),
        gt(authOtpLogs.sentAt, cutoffDate)
      )
    )
    .orderBy(desc(authOtpLogs.sentAt))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function findLatestPendingOTPByUserId(userId: number): Promise<AuthOtpLog | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(authOtpLogs)
    .where(
      and(
        eq(authOtpLogs.userId, userId),
        eq(authOtpLogs.status, 'sent')
      )
    )
    .orderBy(desc(authOtpLogs.sentAt))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function createOTPLog(data: InsertAuthOtpLog): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.insert(authOtpLogs).values(data);
}

export async function updateOTPLog(id: number, data: Partial<AuthOtpLog>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.update(authOtpLogs).set(data).where(eq(authOtpLogs.id, id));
}

// ============================================================================
// AUTH AUDIT LOGS
// ============================================================================

export async function createAuditLog(data: InsertAuthAuditLog): Promise<void> {
  const db = await getDb();
  if (!db) return; // Silent fail for audit logs
  
  try {
    await db.insert(authAuditLogs).values(data);
  } catch (error) {
    console.error('[Auth Audit] Erreur lors de la création du log:', error);
  }
}

// ============================================================================
// MERCHANTS
// ============================================================================

export async function findMerchantByNumber(merchantNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select({
      merchant: merchants,
      user: users,
    })
    .from(merchants)
    .innerJoin(users, eq(merchants.userId, users.id))
    .where(eq(merchants.merchantNumber, merchantNumber))
    .limit(1);
  
  if (result.length === 0) return undefined;
  
  return {
    ...result[0].merchant,
    user: result[0].user,
  };
}

export async function findMerchantByPhone(phone: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select({
      merchant: merchants,
      user: users,
    })
    .from(merchants)
    .innerJoin(users, eq(merchants.userId, users.id))
    .where(eq(users.phone, phone))
    .limit(1);
  
  if (result.length === 0) return undefined;
  
  return {
    ...result[0].merchant,
    user: result[0].user,
  };
}
