/**
 * Fonctions de base de données pour les statistiques d'évolution des sessions
 */

import { getDb } from './db';
import { merchantDailySessions } from '../drizzle/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

/**
 * Récupère les statistiques des 30 derniers jours pour un marchand
 * Retourne : date, heures travaillées, statut
 */
export async function getLast30DaysStats(merchantId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sessions = await db.select({
    date: merchantDailySessions.sessionDate,
    openedAt: merchantDailySessions.openedAt,
    closedAt: merchantDailySessions.closedAt,
  })
    .from(merchantDailySessions)
    .where(
      and(
        eq(merchantDailySessions.merchantId, merchantId),
        sql`${merchantDailySessions.sessionDate} >= ${thirtyDaysAgo}`
      )
    )
    .orderBy(merchantDailySessions.sessionDate);

  // Calculer les heures travaillées pour chaque session
  return sessions.map(session => {
    let hoursWorked = 0;
    if (session.openedAt && session.closedAt) {
      const diff = new Date(session.closedAt).getTime() - new Date(session.openedAt).getTime();
      hoursWorked = diff / (1000 * 60 * 60); // Convertir en heures
    }

    return {
      date: session.date,
      hoursWorked: Math.round(hoursWorked * 10) / 10, // Arrondir à 1 décimale
      openedAt: session.openedAt,
      closedAt: session.closedAt,
    };
  });
}

/**
 * Récupère les statistiques hebdomadaires (moyenne par jour de la semaine)
 */
export async function getWeeklyAverages(merchantId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sessions = await db.select({
    sessionDate: merchantDailySessions.sessionDate,
    openedAt: merchantDailySessions.openedAt,
    closedAt: merchantDailySessions.closedAt,
  })
    .from(merchantDailySessions)
    .where(
      and(
        eq(merchantDailySessions.merchantId, merchantId),
        sql`${merchantDailySessions.sessionDate} >= ${thirtyDaysAgo}`,
        sql`${merchantDailySessions.openedAt} IS NOT NULL`,
        sql`${merchantDailySessions.closedAt} IS NOT NULL`
      )
    );

  // Grouper par jour de la semaine (0 = Dimanche, 6 = Samedi)
  const byDayOfWeek: { [key: number]: number[] } = {};

  sessions.forEach(session => {
    const date = new Date(session.sessionDate);
    const dayOfWeek = date.getDay();

    if (session.openedAt && session.closedAt) {
      const diff = new Date(session.closedAt).getTime() - new Date(session.openedAt).getTime();
      const hoursWorked = diff / (1000 * 60 * 60);

      if (!byDayOfWeek[dayOfWeek]) {
        byDayOfWeek[dayOfWeek] = [];
      }
      byDayOfWeek[dayOfWeek].push(hoursWorked);
    }
  });

  // Calculer les moyennes
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const averages = dayNames.map((name, index) => {
    const hours = byDayOfWeek[index] || [];
    const average = hours.length > 0
      ? hours.reduce((sum, h) => sum + h, 0) / hours.length
      : 0;

    return {
      dayOfWeek: index,
      dayName: name,
      averageHours: Math.round(average * 10) / 10,
      sessionsCount: hours.length,
    };
  });

  return averages;
}

/**
 * Compare la semaine en cours avec la semaine dernière
 */
export async function compareWeeks(merchantId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const today = new Date();
  const startOfThisWeek = new Date(today);
  startOfThisWeek.setDate(today.getDate() - today.getDay()); // Dimanche de cette semaine
  startOfThisWeek.setHours(0, 0, 0, 0);

  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  // Semaine en cours
  const thisWeekSessions = await db.select({
    openedAt: merchantDailySessions.openedAt,
    closedAt: merchantDailySessions.closedAt,
  })
    .from(merchantDailySessions)
    .where(
      and(
        eq(merchantDailySessions.merchantId, merchantId),
        sql`${merchantDailySessions.sessionDate} >= ${startOfThisWeek}`,
        sql`${merchantDailySessions.openedAt} IS NOT NULL`,
        sql`${merchantDailySessions.closedAt} IS NOT NULL`
      )
    );

  // Semaine dernière
  const lastWeekSessions = await db.select({
    openedAt: merchantDailySessions.openedAt,
    closedAt: merchantDailySessions.closedAt,
  })
    .from(merchantDailySessions)
    .where(
      and(
        eq(merchantDailySessions.merchantId, merchantId),
        sql`${merchantDailySessions.sessionDate} >= ${startOfLastWeek}`,
        sql`${merchantDailySessions.sessionDate} < ${startOfThisWeek}`,
        sql`${merchantDailySessions.openedAt} IS NOT NULL`,
        sql`${merchantDailySessions.closedAt} IS NOT NULL`
      )
    );

  // Calculer les totaux
  const calculateTotal = (sessions: any[]) => {
    return sessions.reduce((total, session) => {
      if (session.openedAt && session.closedAt) {
        const diff = new Date(session.closedAt).getTime() - new Date(session.openedAt).getTime();
        return total + (diff / (1000 * 60 * 60));
      }
      return total;
    }, 0);
  };

  const thisWeekTotal = calculateTotal(thisWeekSessions);
  const lastWeekTotal = calculateTotal(lastWeekSessions);

  return {
    thisWeek: {
      totalHours: Math.round(thisWeekTotal * 10) / 10,
      daysWorked: thisWeekSessions.length,
    },
    lastWeek: {
      totalHours: Math.round(lastWeekTotal * 10) / 10,
      daysWorked: lastWeekSessions.length,
    },
    difference: {
      hours: Math.round((thisWeekTotal - lastWeekTotal) * 10) / 10,
      percentage: lastWeekTotal > 0
        ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100)
        : 0,
    },
  };
}

/**
 * Compare le mois en cours avec le mois dernier
 */
export async function compareMonths(merchantId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const today = new Date();
  const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

  // Mois en cours
  const thisMonthSessions = await db.select({
    openedAt: merchantDailySessions.openedAt,
    closedAt: merchantDailySessions.closedAt,
  })
    .from(merchantDailySessions)
    .where(
      and(
        eq(merchantDailySessions.merchantId, merchantId),
        sql`${merchantDailySessions.sessionDate} >= ${startOfThisMonth}`,
        sql`${merchantDailySessions.openedAt} IS NOT NULL`,
        sql`${merchantDailySessions.closedAt} IS NOT NULL`
      )
    );

  // Mois dernier
  const lastMonthSessions = await db.select({
    openedAt: merchantDailySessions.openedAt,
    closedAt: merchantDailySessions.closedAt,
  })
    .from(merchantDailySessions)
    .where(
      and(
        eq(merchantDailySessions.merchantId, merchantId),
        sql`${merchantDailySessions.sessionDate} >= ${startOfLastMonth}`,
        sql`${merchantDailySessions.sessionDate} <= ${endOfLastMonth}`,
        sql`${merchantDailySessions.openedAt} IS NOT NULL`,
        sql`${merchantDailySessions.closedAt} IS NOT NULL`
      )
    );

  // Calculer les totaux
  const calculateTotal = (sessions: any[]) => {
    return sessions.reduce((total, session) => {
      if (session.openedAt && session.closedAt) {
        const diff = new Date(session.closedAt).getTime() - new Date(session.openedAt).getTime();
        return total + (diff / (1000 * 60 * 60));
      }
      return total;
    }, 0);
  };

  const thisMonthTotal = calculateTotal(thisMonthSessions);
  const lastMonthTotal = calculateTotal(lastMonthSessions);

  return {
    thisMonth: {
      totalHours: Math.round(thisMonthTotal * 10) / 10,
      daysWorked: thisMonthSessions.length,
    },
    lastMonth: {
      totalHours: Math.round(lastMonthTotal * 10) / 10,
      daysWorked: lastMonthSessions.length,
    },
    difference: {
      hours: Math.round((thisMonthTotal - lastMonthTotal) * 10) / 10,
      percentage: lastMonthTotal > 0
        ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
        : 0,
    },
  };
}
