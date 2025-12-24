import { getDb } from "./db";
import { orders, products } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

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
    .insert(orders)
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
      id: orders.id,
      productId: orders.productId,
      productName: products.name,
      quantity: orders.quantity,
      unitPrice: orders.unitPrice,
      totalAmount: orders.totalAmount,
      status: orders.status,
      orderDate: orders.orderDate,
      deliveryDate: orders.deliveryDate,
    })
    .from(orders)
    .leftJoin(products, eq(orders.productId, products.id))
    .where(eq(orders.merchantId, merchantId))
    .orderBy(desc(orders.orderDate))
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
    .update(orders)
    .set({ status })
    .where(eq(orders.id, orderId));

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
    })
    .from(products)
    .orderBy(products.name);

  return result;
}
