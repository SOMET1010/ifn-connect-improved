import { getDb } from "./db";
import { virtualMarketOrders, products } from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * Créer une nouvelle commande
 */
export async function createOrder(orderData: {
  merchantId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  deliveryDate?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [order] = await db
    .insert(virtualMarketOrders)
    .values({
      merchantId: orderData.merchantId,
      productId: orderData.productId,
      quantity: orderData.quantity.toString(),
      unitPrice: orderData.unitPrice.toString(),
      totalAmount: orderData.totalAmount.toString(),
      deliveryDate: orderData.deliveryDate,
    })
    .$returningId();

  return order;
}

/**
 * Liste des commandes d'un marchand
 */
export async function getOrdersByMerchant(
  merchantId: number,
  limit: number = 50,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: virtualMarketOrders.id,
      productId: virtualMarketOrders.productId,
      productName: products.name,
      quantity: virtualMarketOrders.quantity,
      unitPrice: virtualMarketOrders.unitPrice,
      totalAmount: virtualMarketOrders.totalAmount,
      status: virtualMarketOrders.status,
      orderDate: virtualMarketOrders.orderDate,
      deliveryDate: virtualMarketOrders.deliveryDate,
    })
    .from(virtualMarketOrders)
    .leftJoin(products, eq(virtualMarketOrders.productId, products.id))
    .where(eq(virtualMarketOrders.merchantId, merchantId))
    .orderBy(desc(virtualMarketOrders.orderDate))
    .limit(limit)
    .offset(offset);

  return result;
}

/**
 * Mettre à jour le statut d'une commande
 */
export async function updateOrderStatus(
  orderId: number,
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled'
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(virtualMarketOrders)
    .set({ status })
    .where(eq(virtualMarketOrders.id, orderId));

  return { success: true };
}

/**
 * Récupérer les produits disponibles au marché
 */
export async function getAvailableProducts() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: products.id,
      name: products.name,
      category: products.category,
      unit: products.unit,
      basePrice: products.basePrice,
      imageUrl: products.imageUrl,
    })
    .from(products)
    .orderBy(products.name);

  return result;
}

/**
 * Statistiques des commandes d'un marchand
 */
export async function getOrderStats(merchantId: number) {
  const db = await getDb();
  if (!db) return { totalSpent: 0, orderCount: 0 };

  const result = await db
    .select({
      totalSpent: sql<string>`COALESCE(SUM(${virtualMarketOrders.totalAmount}), 0)`,
      orderCount: sql<number>`COUNT(*)`,
    })
    .from(virtualMarketOrders)
    .where(eq(virtualMarketOrders.merchantId, merchantId));

  return {
    totalSpent: parseFloat(result[0]?.totalSpent || '0'),
    orderCount: result[0]?.orderCount || 0,
  };
}
