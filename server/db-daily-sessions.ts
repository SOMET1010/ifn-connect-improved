import { getDb } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import { merchantDailySessions } from "../drizzle/schema";

/**
 * Fonctions de gestion des sessions quotidiennes des marchands
 * Système Ouverture/Fermeture de journée
 */

export type SessionStatus = 'NOT_OPENED' | 'OPENED' | 'CLOSED';

export interface DailySessionWithStatus {
  id: number | null;
  merchantId: number;
  sessionDate: Date; // Date object
  openedAt: Date | null;
  closedAt: Date | null;
  status: SessionStatus;
  openingNotes: string | null;
  closingNotes: string | null;
}

/**
 * Obtenir la date du jour (Date object avec heure à 00:00:00)
 */
function getTodayDate(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Calculer le statut d'une session
 */
function calculateStatus(openedAt: Date | null, closedAt: Date | null): SessionStatus {
  if (!openedAt) return 'NOT_OPENED';
  if (closedAt) return 'CLOSED';
  return 'OPENED';
}

/**
 * Récupérer ou créer la session du jour pour un marchand
 */
export async function getTodaySession(merchantId: number): Promise<DailySessionWithStatus> {
  const todayDate = getTodayDate();
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Chercher la session existante
  const existingSession = await db
    .select()
    .from(merchantDailySessions)
    .where(
      and(
        eq(merchantDailySessions.merchantId, merchantId),
        eq(merchantDailySessions.sessionDate, todayDate)
      )
    )
    .limit(1);

  if (existingSession.length > 0) {
    const session = existingSession[0];
    return {
      id: session.id,
      merchantId: session.merchantId,
      sessionDate: session.sessionDate,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      status: calculateStatus(session.openedAt, session.closedAt),
      openingNotes: session.openingNotes,
      closingNotes: session.closingNotes,
    };
  }

  // Créer une nouvelle session si elle n'existe pas
  const [newSession] = await db
    .insert(merchantDailySessions)
    .values({
      merchantId,
      sessionDate: todayDate,
      openedAt: null,
      closedAt: null,
      openingNotes: null,
      closingNotes: null,
    })
    .$returningId();

  return {
    id: newSession.id,
    merchantId,
    sessionDate: todayDate,
    openedAt: null,
    closedAt: null,
    status: 'NOT_OPENED',
    openingNotes: null,
    closingNotes: null,
  };
}

/**
 * Ouvrir la journée d'un marchand
 */
export async function openDaySession(merchantId: number, notes?: string): Promise<DailySessionWithStatus> {
  const session = await getTodaySession(merchantId);

  // Vérifier que la session n'est pas déjà ouverte
  if (session.status === 'OPENED') {
    throw new Error('Votre journée est déjà ouverte');
  }

  // Vérifier que la session n'est pas déjà fermée
  if (session.status === 'CLOSED') {
    throw new Error('Votre journée est déjà fermée. Voulez-vous la rouvrir ?');
  }

  // Ouvrir la session
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const now = new Date();
  await db
    .update(merchantDailySessions)
    .set({
      openedAt: now,
      openingNotes: notes || null,
    })
    .where(eq(merchantDailySessions.id, session.id!));

  return {
    ...session,
    openedAt: now,
    status: 'OPENED',
    openingNotes: notes || null,
  };
}

/**
 * Fermer la journée d'un marchand
 */
export async function closeDaySession(merchantId: number, notes?: string): Promise<DailySessionWithStatus> {
  const session = await getTodaySession(merchantId);

  // Vérifier que la session est ouverte
  if (session.status === 'NOT_OPENED') {
    throw new Error('Vous devez d\'abord ouvrir votre journée');
  }

  // Vérifier que la session n'est pas déjà fermée
  if (session.status === 'CLOSED') {
    throw new Error('Votre journée est déjà fermée');
  }

  // Fermer la session
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const now = new Date();
  await db
    .update(merchantDailySessions)
    .set({
      closedAt: now,
      closingNotes: notes || null,
    })
    .where(eq(merchantDailySessions.id, session.id!));

  return {
    ...session,
    closedAt: now,
    status: 'CLOSED',
    closingNotes: notes || null,
  };
}

/**
 * Rouvrir une journée déjà fermée
 */
export async function reopenDaySession(merchantId: number): Promise<DailySessionWithStatus> {
  const session = await getTodaySession(merchantId);

  // Vérifier que la session est fermée
  if (session.status !== 'CLOSED') {
    throw new Error('Votre journée n\'est pas fermée');
  }

  // Rouvrir la session
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db
    .update(merchantDailySessions)
    .set({
      closedAt: null,
    })
    .where(eq(merchantDailySessions.id, session.id!));

  return {
    ...session,
    closedAt: null,
    status: 'OPENED',
  };
}

/**
 * Récupérer l'historique des sessions d'un marchand
 */
export async function getSessionHistory(merchantId: number, limit: number = 30) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const sessions = await db
    .select()
    .from(merchantDailySessions)
    .where(eq(merchantDailySessions.merchantId, merchantId))
    .orderBy(desc(merchantDailySessions.sessionDate))
    .limit(limit);

  const sessionsWithStatus = sessions.map((session: typeof sessions[0]) => ({
    id: session.id,
    merchantId: session.merchantId,
    sessionDate: typeof session.sessionDate === 'string' ? new Date(session.sessionDate) : session.sessionDate,
    openedAt: session.openedAt,
    closedAt: session.closedAt,
    status: calculateStatus(session.openedAt, session.closedAt),
    openingNotes: session.openingNotes,
    closingNotes: session.closingNotes,
    duration: session.openedAt && session.closedAt
      ? Math.round((session.closedAt.getTime() - session.openedAt.getTime()) / 1000 / 60) // Minutes
      : null,
  }));

  // Calculer les statistiques
  const workedSessions = sessionsWithStatus.filter((s: typeof sessionsWithStatus[0]) => s.status === 'CLOSED' && s.duration);
  const totalDaysWorked = workedSessions.length;
  const averageDuration = totalDaysWorked > 0
    ? Math.round(workedSessions.reduce((sum: number, s: typeof workedSessions[0]) => sum + (s.duration || 0), 0) / totalDaysWorked)
    : 0;
  
  const longestSession = workedSessions.reduce((longest: typeof workedSessions[0] | null, current: typeof workedSessions[0]) => {
    if (!longest || (current.duration || 0) > (longest.duration || 0)) {
      return current;
    }
    return longest;
  }, workedSessions[0] || null);

  return {
    sessions: sessionsWithStatus,
    stats: {
      totalDaysWorked,
      averageDuration, // En minutes
      longestDay: longestSession ? {
        date: longestSession.sessionDate.toISOString().split('T')[0],
        duration: longestSession.duration || 0,
      } : null,
    },
  };
}

/**
 * Vérifier si le marchand a oublié de fermer sa journée hier
 */
export async function checkUnclosedYesterday(merchantId: number): Promise<{
  hasUnclosed: boolean;
  yesterdaySession: DailySessionWithStatus | null;
}> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const [yesterdaySession] = await db
    .select()
    .from(merchantDailySessions)
    .where(
      and(
        eq(merchantDailySessions.merchantId, merchantId),
        eq(merchantDailySessions.sessionDate, yesterday)
      )
    )
    .limit(1);

  if (!yesterdaySession) {
    return { hasUnclosed: false, yesterdaySession: null };
  }

  const status = calculateStatus(yesterdaySession.openedAt, yesterdaySession.closedAt);
  const hasUnclosed = status === 'OPENED'; // Ouverte mais pas fermée

  return {
    hasUnclosed,
    yesterdaySession: hasUnclosed ? {
      id: yesterdaySession.id,
      merchantId: yesterdaySession.merchantId,
      sessionDate: yesterdaySession.sessionDate,
      openedAt: yesterdaySession.openedAt,
      closedAt: yesterdaySession.closedAt,
      status,
      openingNotes: yesterdaySession.openingNotes,
      closingNotes: yesterdaySession.closingNotes,
    } : null,
  };
}
