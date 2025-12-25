import { getDb } from "./db";
import {
  localEvents,
  eventStockRecommendations,
  eventAlerts,
  type InsertLocalEvent,
  type InsertEventStockRecommendation,
  type InsertEventAlert,
} from "../drizzle/schema";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";

/**
 * Créer un événement
 */
export async function createEvent(data: InsertLocalEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [event] = await db.insert(localEvents).values(data);
  return event;
}

/**
 * Récupérer les événements à venir (dans les 60 prochains jours)
 */
export async function getUpcomingEvents(daysAhead: number = 60) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);

  const todayStr = today.toISOString().split("T")[0];
  const futureDateStr = futureDate.toISOString().split("T")[0];

  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(localEvents)
    .orderBy(asc(localEvents.date));
}

/**
 * Récupérer un événement par ID
 */
export async function getEventById(eventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [event] = await db
    .select()
    .from(localEvents)
    .where(eq(localEvents.id, eventId))
    .limit(1);
  return event;
}

/**
 * Ajouter une recommandation de stock pour un événement
 */
export async function addStockRecommendation(
  data: InsertEventStockRecommendation
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [recommendation] = await db
    .insert(eventStockRecommendations)
    .values(data);
  return recommendation;
}

/**
 * Récupérer les recommandations de stock pour un événement
 */
export async function getStockRecommendations(eventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(eventStockRecommendations)
    .where(eq(eventStockRecommendations.eventId, eventId))
    .orderBy(desc(eventStockRecommendations.priority));
}

/**
 * Créer une alerte pour un marchand
 */
export async function createEventAlert(data: InsertEventAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [alert] = await db.insert(eventAlerts).values(data);
  return alert;
}

/**
 * Récupérer les alertes non lues d'un marchand
 */
export async function getUnreadAlerts(merchantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(eventAlerts)
    .where(
      and(
        eq(eventAlerts.merchantId, merchantId),
        eq(eventAlerts.isRead, false)
      )
    )
    .orderBy(desc(eventAlerts.createdAt));
}

/**
 * Marquer une alerte comme lue
 */
export async function markAlertAsRead(alertId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(eventAlerts)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(eventAlerts.id, alertId));
}

/**
 * Générer les alertes automatiques pour un événement
 * (7 jours, 3 jours, 1 jour avant)
 */
export async function generateAlertsForEvent(
  eventId: number,
  merchantId: number
) {
  const event = await getEventById(eventId);
  if (!event) return;

  const eventDate = new Date(event.date);
  const today = new Date();
  const daysUntil = Math.ceil(
    (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  let alertType: "7_days" | "3_days" | "1_day" | "today" | null = null;
  let message = "";

  if (daysUntil === 7) {
    alertType = "7_days";
    message = `${event.name} dans 7 jours ! Prépare ton stock maintenant.`;
  } else if (daysUntil === 3) {
    alertType = "3_days";
    message = `${event.name} dans 3 jours ! Dernière chance pour commander.`;
  } else if (daysUntil === 1) {
    alertType = "1_day";
    message = `${event.name} demain ! Vérifie que tu as tout en stock.`;
  } else if (daysUntil === 0) {
    alertType = "today";
    message = `C'est ${event.name} aujourd'hui ! Bonne vente !`;
  }

  if (alertType) {
    await createEventAlert({
      eventId,
      merchantId,
      alertType,
      message,
    });
  }
}

/**
 * Récupérer tous les événements avec leurs recommandations
 */
export async function getEventsWithRecommendations() {
  const events = await getUpcomingEvents();
  const eventsWithRecs = await Promise.all(
    events.map(async (event: any) => {
      const recommendations = await getStockRecommendations(event.id);
      return { ...event, recommendations };
    })
  );
  return eventsWithRecs;
}
