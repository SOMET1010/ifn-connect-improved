import { getDb } from "./db";
import { merchantDailySessions } from "../drizzle/schema";
import { eq, and, gte, lte, count, sql } from "drizzle-orm";

/**
 * Calcule les statistiques d'assiduité pour un marchand
 */
export async function getAttendanceStats(merchantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Jours travaillés dans les 30 derniers jours
  const last30Days = await db
    .select({ count: count() })
    .from(merchantDailySessions)
    .where(
      and(
        eq(merchantDailySessions.merchantId, merchantId),
        gte(merchantDailySessions.sessionDate, thirtyDaysAgo)
      )
    );

  // Jours travaillés dans les 7 derniers jours
  const last7Days = await db
    .select({ count: count() })
    .from(merchantDailySessions)
    .where(
      and(
        eq(merchantDailySessions.merchantId, merchantId),
        gte(merchantDailySessions.sessionDate, sevenDaysAgo)
      )
    );

  // Série actuelle (jours consécutifs)
  const currentStreak = await calculateCurrentStreak(merchantId);

  // Plus longue série
  const longestStreak = await calculateLongestStreak(merchantId);

  // Jours travaillés ce mois-ci
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysThisMonth = await db
    .select({ count: count() })
    .from(merchantDailySessions)
    .where(
      and(
        eq(merchantDailySessions.merchantId, merchantId),
        gte(merchantDailySessions.sessionDate, startOfMonth)
      )
    );

  // Calcul du taux de régularité (ouvertures avant 10h)
  const earlyOpenings = await db
    .select({ count: count() })
    .from(merchantDailySessions)
    .where(
      and(
        eq(merchantDailySessions.merchantId, merchantId),
        gte(merchantDailySessions.sessionDate, thirtyDaysAgo),
        sql`TIME(${merchantDailySessions.openedAt}) < '10:00:00'`
      )
    );

  return {
    last30Days: last30Days[0]?.count || 0,
    last7Days: last7Days[0]?.count || 0,
    currentStreak,
    longestStreak,
    daysThisMonth: daysThisMonth[0]?.count || 0,
    earlyOpenings: earlyOpenings[0]?.count || 0,
  };
}

/**
 * Calcule la série actuelle de jours consécutifs travaillés
 */
async function calculateCurrentStreak(merchantId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const sessions = await db
    .select()
    .from(merchantDailySessions)
    .where(eq(merchantDailySessions.merchantId, merchantId))
    .orderBy(sql`${merchantDailySessions.sessionDate} DESC`)
    .limit(100);

  if (sessions.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sessions.length; i++) {
    const sessionDate = new Date(sessions[i].sessionDate);
    sessionDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    expectedDate.setHours(0, 0, 0, 0);

    if (sessionDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calcule la plus longue série de jours consécutifs travaillés
 */
async function calculateLongestStreak(merchantId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const sessions = await db
    .select()
    .from(merchantDailySessions)
    .where(eq(merchantDailySessions.merchantId, merchantId))
    .orderBy(sql`${merchantDailySessions.sessionDate} ASC`);

  if (sessions.length === 0) return 0;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sessions.length; i++) {
    const prevDate = new Date(sessions[i - 1].sessionDate);
    const currDate = new Date(sessions[i].sessionDate);

    const diffDays = Math.floor(
      (currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

/**
 * Détermine quels badges un marchand a débloqués
 */
export async function getUnlockedBadges(merchantId: number) {
  const stats = await getAttendanceStats(merchantId);

  const badges = {
    streak_7: stats.currentStreak >= 7,
    streak_30: stats.currentStreak >= 30,
    month_20: stats.daysThisMonth >= 20,
    month_30: stats.daysThisMonth >= 30,
    early_bird: stats.earlyOpenings >= 20, // 20 ouvertures avant 10h sur 30 jours
    regular: stats.last30Days >= 25, // 25 jours travaillés sur 30
    champion: stats.longestStreak >= 60, // 60 jours consécutifs
  };

  return {
    badges,
    stats,
  };
}
