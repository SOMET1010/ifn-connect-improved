import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { getDb } from './db';
import { sales, products, merchantStock } from '../drizzle/schema';

/**
 * Créer une nouvelle vente
 */
export async function createSale(data: {
  merchantId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod?: 'cash' | 'mobile_money' | 'credit';
  paymentProvider?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Insérer la vente
  await db.insert(sales).values({
    merchantId: data.merchantId,
    productId: data.productId,
    quantity: String(data.quantity),
    unitPrice: String(data.unitPrice),
    totalAmount: String(data.totalAmount),
    paymentMethod: data.paymentMethod || 'cash',
    paymentProvider: data.paymentProvider,
    saleDate: new Date(),
  });

  // Mettre à jour le stock
  await db
    .update(merchantStock)
    .set({
      quantity: sql`${merchantStock.quantity} - ${data.quantity}`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(merchantStock.merchantId, data.merchantId),
        eq(merchantStock.productId, data.productId)
      )
    );

  return { success: true };
}

/**
 * Obtenir les ventes d'un marchand
 */
export async function getSalesByMerchant(
  merchantId: number,
  limit: number = 50,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: sales.id,
      productId: sales.productId,
      productName: products.name,
      quantity: sales.quantity,
      unitPrice: sales.unitPrice,
      totalAmount: sales.totalAmount,
      paymentMethod: sales.paymentMethod,
      saleDate: sales.saleDate,
    })
    .from(sales)
    .leftJoin(products, eq(sales.productId, products.id))
    .where(eq(sales.merchantId, merchantId))
    .orderBy(desc(sales.saleDate))
    .limit(limit)
    .offset(offset);

  return result;
}

/**
 * Obtenir les statistiques du jour pour un marchand
 */
export async function getTodayStats(merchantId: number) {
  const db = await getDb();
  if (!db) return { totalSales: 0, totalAmount: 0, salesCount: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await db
    .select({
      salesCount: sql<number>`COUNT(*)`,
      totalAmount: sql<number>`SUM(${sales.totalAmount})`,
    })
    .from(sales)
    .where(
      and(
        eq(sales.merchantId, merchantId),
        gte(sales.saleDate, today)
      )
    );

  return {
    salesCount: Number(result[0]?.salesCount || 0),
    totalAmount: Number(result[0]?.totalAmount || 0),
  };
}

/**
 * Obtenir l'historique des ventes avec filtres
 */
export async function getSalesHistory(filters: {
  merchantId: number;
  startDate?: Date;
  endDate?: Date;
  productId?: number;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(sales.merchantId, filters.merchantId)];

  if (filters.startDate) {
    conditions.push(gte(sales.saleDate, filters.startDate));
  }

  if (filters.endDate) {
    conditions.push(lte(sales.saleDate, filters.endDate));
  }

  if (filters.productId) {
    conditions.push(eq(sales.productId, filters.productId));
  }

  const result = await db
    .select({
      id: sales.id,
      productId: sales.productId,
      productName: products.name,
      quantity: sales.quantity,
      unitPrice: sales.unitPrice,
      totalAmount: sales.totalAmount,
      paymentMethod: sales.paymentMethod,
      saleDate: sales.saleDate,
    })
    .from(sales)
    .leftJoin(products, eq(sales.productId, products.id))
    .where(and(...conditions))
    .orderBy(desc(sales.saleDate))
    .limit(filters.limit || 100)
    .offset(filters.offset || 0);

  return result;
}


/**
 * Obtenir les ventes des 7 derniers jours pour un marchand (pour graphique)
 */
export async function getLast7DaysSales(merchantId: number) {
  const db = await getDb();
  if (!db) return [];

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const result = await db
    .select({
      date: sql<string>`DATE(${sales.saleDate}) as sale_date`,
      totalAmount: sql<number>`SUM(CAST(${sales.totalAmount} AS DECIMAL(10,2)))`,
      salesCount: sql<number>`COUNT(*)`,
    })
    .from(sales)
    .where(
      and(
        eq(sales.merchantId, merchantId),
        gte(sales.saleDate, sevenDaysAgo)
      )
    )
    .groupBy(sql`sale_date`)
    .orderBy(sql`sale_date`);

  return result.map(row => ({
    date: row.date,
    totalAmount: Number(row.totalAmount || 0),
    salesCount: Number(row.salesCount || 0),
  }));
}

/**
 * Obtenir le top 5 des produits les plus vendus pour un marchand
 */
export async function getTopProducts(merchantId: number, limit: number = 5) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      productId: sales.productId,
      productName: products.name,
      totalQuantity: sql<number>`SUM(${sales.quantity})`,
      totalAmount: sql<number>`SUM(${sales.totalAmount})`,
      salesCount: sql<number>`COUNT(*)`,
    })
    .from(sales)
    .leftJoin(products, eq(sales.productId, products.id))
    .where(eq(sales.merchantId, merchantId))
    .groupBy(sales.productId, products.name)
    .orderBy(desc(sql`SUM(${sales.quantity})`))
    .limit(limit);

  return result.map(row => ({
    productId: row.productId,
    productName: row.productName || 'Produit inconnu',
    totalQuantity: Number(row.totalQuantity || 0),
    totalAmount: Number(row.totalAmount || 0),
    salesCount: Number(row.salesCount || 0),
  }));
}

/**
 * Obtenir le solde total d'un marchand (somme de toutes les ventes)
 */
export async function getTotalBalance(merchantId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({
      totalBalance: sql<number>`SUM(${sales.totalAmount})`,
    })
    .from(sales)
    .where(eq(sales.merchantId, merchantId));

  return Number(result[0]?.totalBalance || 0);
}

/**
 * Obtenir le nombre de produits en stock bas pour un marchand
 */
export async function getLowStockCount(merchantId: number, threshold: number = 10) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(merchantStock)
    .where(
      and(
        eq(merchantStock.merchantId, merchantId),
        sql`${merchantStock.quantity} < ${threshold}`
      )
    );

  return Number(result[0]?.count || 0);
}
