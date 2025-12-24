import { eq, like, and, isNotNull, sql } from "drizzle-orm";
import { getDb } from "./db";
import { markets, actors, type Market, type Actor, type InsertMarket, type InsertActor } from "../drizzle/schema";

/**
 * Helpers pour la gestion des marchés et acteurs
 */

// ============================================================================
// MARKETS
// ============================================================================

export async function getAllMarkets() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(markets).orderBy(markets.name);
}

export async function getMarketById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(markets).where(eq(markets.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getMarketByName(name: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(markets).where(eq(markets.name, name)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getGeolocatedMarkets() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(markets)
    .where(
      and(
        eq(markets.isGeolocated, true),
        isNotNull(markets.latitude),
        isNotNull(markets.longitude)
      )
    )
    .orderBy(markets.name);
}

export async function updateMarketGeolocation(
  id: number,
  latitude: number,
  longitude: number,
  address?: string
) {
  const db = await getDb();
  if (!db) return false;
  
  try {
    await db
      .update(markets)
      .set({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        address: address || null,
        isGeolocated: true,
        geolocatedAt: new Date(),
      })
      .where(eq(markets.id, id));
    
    return true;
  } catch (error) {
    console.error("Error updating market geolocation:", error);
    return false;
  }
}

export async function getMarketStats(marketId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const market = await getMarketById(marketId);
  if (!market) return null;
  
  const actorCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(actors)
    .where(eq(actors.marketId, marketId));
  
  return {
    ...market,
    actualActorCount: actorCount[0]?.count || 0,
  };
}

// ============================================================================
// ACTORS
// ============================================================================

export async function getAllActors(limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(actors)
    .orderBy(actors.fullName)
    .limit(limit)
    .offset(offset);
}

export async function getActorById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(actors).where(eq(actors.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getActorByKey(actorKey: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(actors).where(eq(actors.actorKey, actorKey)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getActorsByMarket(marketId: number, limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(actors)
    .where(eq(actors.marketId, marketId))
    .orderBy(actors.fullName)
    .limit(limit)
    .offset(offset);
}

export async function searchActorsByIdentifier(identifierCode: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(actors)
    .where(like(actors.identifierCode, `%${identifierCode}%`))
    .orderBy(actors.fullName)
    .limit(50);
}

export async function searchActorsByPhone(phone: string) {
  const db = await getDb();
  if (!db) return [];
  
  // Normaliser le numéro (enlever espaces, tirets, etc.)
  const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  return await db
    .select()
    .from(actors)
    .where(like(actors.phone, `%${normalizedPhone}%`))
    .orderBy(actors.fullName)
    .limit(50);
}

export async function searchActorsByName(name: string, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(actors)
    .where(like(actors.fullName, `%${name}%`))
    .orderBy(actors.fullName)
    .limit(limit);
}

export async function getActorCountByMarket(marketId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(actors)
    .where(eq(actors.marketId, marketId));
  
  return result[0]?.count || 0;
}

export async function updateActor(id: number, data: Partial<InsertActor>) {
  const db = await getDb();
  if (!db) return false;
  
  try {
    await db
      .update(actors)
      .set(data)
      .where(eq(actors.id, id));
    
    return true;
  } catch (error) {
    console.error("Error updating actor:", error);
    return false;
  }
}

// ============================================================================
// STATISTICS
// ============================================================================

export async function getGlobalStats() {
  const db = await getDb();
  if (!db) return null;
  
  const [marketCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(markets);
  
  const [actorCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(actors);
  
  const [geolocatedCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(markets)
    .where(eq(markets.isGeolocated, true));
  
  return {
    totalMarkets: marketCount?.count || 0,
    totalActors: actorCount?.count || 0,
    geolocatedMarkets: geolocatedCount?.count || 0,
  };
}

export async function getMarketWithActors(marketId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const market = await getMarketById(marketId);
  if (!market) return null;
  
  const actorsList = await getActorsByMarket(marketId, 1000);
  
  return {
    ...market,
    actors: actorsList,
    actorCount: actorsList.length,
  };
}
