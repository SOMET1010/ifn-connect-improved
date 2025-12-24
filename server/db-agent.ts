import { getDb } from './db';
import { merchants, users, markets, actors } from '../drizzle/schema';
import { eq, desc, like, and, sql, count } from 'drizzle-orm';

/**
 * Récupérer la liste des marchands enrôlés avec pagination
 */
export async function listMerchants(options: {
  page?: number;
  limit?: number;
  search?: string;
  marketId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const { page = 1, limit = 20, search, marketId } = options;
  const offset = (page - 1) * limit;

  // Construire les conditions de filtrage
  const conditions = [];
  
  if (search) {
    conditions.push(
      sql`(${users.name} LIKE ${`%${search}%`} OR ${merchants.merchantNumber} LIKE ${`%${search}%`})`
    );
  }

  if (marketId) {
    conditions.push(eq(actors.marketId, marketId));
  }

  // Requête principale avec jointures
  const query = db
    .select({
      id: merchants.id,
      merchantNumber: merchants.merchantNumber,
      businessName: merchants.businessName,
      userName: users.name,
      phone: users.phone,
      marketName: actors.marketName,
      cnpsStatus: merchants.cnpsStatus,
      cmuStatus: merchants.cmuStatus,
      enrolledAt: merchants.enrolledAt,
      latitude: merchants.latitude,
      longitude: merchants.longitude,
    })
    .from(merchants)
    .innerJoin(users, eq(merchants.userId, users.id))
    .leftJoin(actors, eq(actors.actorKey, merchants.merchantNumber))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(merchants.enrolledAt))
    .limit(limit)
    .offset(offset);

  const results = await query;

  // Compter le total pour la pagination
  const totalQuery = await db
    .select({ count: count() })
    .from(merchants)
    .innerJoin(users, eq(merchants.userId, users.id))
    .leftJoin(actors, eq(actors.actorKey, merchants.merchantNumber))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const total = totalQuery[0]?.count || 0;

  return {
    merchants: results,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Récupérer les statistiques de l'agent
 */
export async function getAgentStats() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Enrôlements du jour
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const enrollmentsToday = await db
    .select({ count: count() })
    .from(merchants)
    .where(sql`DATE(${merchants.enrolledAt}) = CURDATE()`);

  // Enrôlements du mois
  const enrollmentsThisMonth = await db
    .select({ count: count() })
    .from(merchants)
    .where(sql`MONTH(${merchants.enrolledAt}) = MONTH(CURDATE()) AND YEAR(${merchants.enrolledAt}) = YEAR(CURDATE())`);

  // Total des enrôlements
  const totalEnrollments = await db
    .select({ count: count() })
    .from(merchants);

  // Nombre de marchés couverts
  const marketsCovered = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${actors.marketId})` })
    .from(actors)
    .where(sql`${actors.actorKey} LIKE 'MRC-%'`);

  return {
    enrollmentsToday: enrollmentsToday[0]?.count || 0,
    enrollmentsThisMonth: enrollmentsThisMonth[0]?.count || 0,
    totalEnrollments: totalEnrollments[0]?.count || 0,
    marketsCovered: marketsCovered[0]?.count || 0,
  };
}

/**
 * Récupérer les marchands groupés par marché (pour la carte)
 */
export async function getMerchantsByMarket() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const results = await db
    .select({
      marketId: actors.marketId,
      marketName: actors.marketName,
      merchantNumber: merchants.merchantNumber,
      businessName: merchants.businessName,
      userName: users.name,
      phone: users.phone,
      latitude: merchants.latitude,
      longitude: merchants.longitude,
      enrolledAt: merchants.enrolledAt,
    })
    .from(merchants)
    .innerJoin(users, eq(merchants.userId, users.id))
    .leftJoin(actors, eq(actors.actorKey, merchants.merchantNumber))
    .where(
      and(
        sql`${merchants.latitude} IS NOT NULL`,
        sql`${merchants.longitude} IS NOT NULL`
      )
    )
    .orderBy(desc(merchants.enrolledAt));

  // Grouper par marché
  const byMarket: Record<string, typeof results> = {};
  
  for (const merchant of results) {
    const marketKey = merchant.marketName || 'Inconnu';
    if (!byMarket[marketKey]) {
      byMarket[marketKey] = [];
    }
    byMarket[marketKey].push(merchant);
  }

  return byMarket;
}
