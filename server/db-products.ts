import { eq, and, sql, lt } from 'drizzle-orm';
import { getDb } from './db';
import { products, merchantStock } from '../drizzle/schema';

/**
 * Obtenir les produits d'un marchand avec leur stock
 */
export async function getProductsByMerchant(merchantId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: products.id,
      name: products.name,
      nameDioula: products.nameDioula,
      category: products.category,
      unit: products.unit,
      basePrice: products.basePrice,
      imageUrl: products.imageUrl,
      pictogramUrl: products.pictogramUrl,
      isActive: products.isActive,
      stockQuantity: merchantStock.quantity,
      minThreshold: merchantStock.minThreshold,
      lastRestocked: merchantStock.lastRestocked,
    })
    .from(products)
    .leftJoin(
      merchantStock,
      and(
        eq(merchantStock.productId, products.id),
        eq(merchantStock.merchantId, merchantId)
      )
    )
    .where(eq(products.isActive, true));

  return result;
}

/**
 * Créer un nouveau produit
 */
export async function createProduct(data: {
  name: string;
  nameDioula?: string;
  category?: string;
  unit: string;
  basePrice?: number;
  imageUrl?: string;
  pictogramUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.insert(products).values({
    name: data.name,
    nameDioula: data.nameDioula,
    category: data.category,
    unit: data.unit,
    basePrice: data.basePrice ? String(data.basePrice) : undefined,
    imageUrl: data.imageUrl,
    pictogramUrl: data.pictogramUrl,
    isActive: true,
  });

  return { success: true };
}

/**
 * Mettre à jour un produit
 */
export async function updateProduct(
  id: number,
  data: Partial<{
    name: string;
    nameDioula: string;
    category: string;
    unit: string;
    basePrice: number;
    imageUrl: string;
    pictogramUrl: string;
    isActive: boolean;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const updateData: any = { ...data };
  if (data.basePrice !== undefined) {
    updateData.basePrice = String(data.basePrice);
  }

  await db
    .update(products)
    .set(updateData)
    .where(eq(products.id, id));

  return { success: true };
}

/**
 * Supprimer un produit (soft delete)
 */
export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db
    .update(products)
    .set({ isActive: false })
    .where(eq(products.id, id));

  return { success: true };
}

/**
 * Obtenir le stock d'un marchand
 */
export async function getMerchantStock(merchantId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: merchantStock.id,
      productId: merchantStock.productId,
      productName: products.name,
      productNameDioula: products.nameDioula,
      unit: products.unit,
      quantity: merchantStock.quantity,
      minThreshold: merchantStock.minThreshold,
      lastRestocked: merchantStock.lastRestocked,
      isLowStock: sql<boolean>`${merchantStock.quantity} < ${merchantStock.minThreshold}`,
    })
    .from(merchantStock)
    .leftJoin(products, eq(merchantStock.productId, products.id))
    .where(eq(merchantStock.merchantId, merchantId));

  return result;
}

/**
 * Mettre à jour le stock
 */
export async function updateStock(data: {
  merchantId: number;
  productId: number;
  quantity: number;
  minThreshold?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Vérifier si l'entrée existe
  const existing = await db
    .select()
    .from(merchantStock)
    .where(
      and(
        eq(merchantStock.merchantId, data.merchantId),
        eq(merchantStock.productId, data.productId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Mettre à jour
    const updateData: any = {
      quantity: String(data.quantity),
      lastRestocked: new Date(),
      updatedAt: new Date(),
    };

    if (data.minThreshold !== undefined) {
      updateData.minThreshold = String(data.minThreshold);
    }

    await db
      .update(merchantStock)
      .set(updateData)
      .where(
        and(
          eq(merchantStock.merchantId, data.merchantId),
          eq(merchantStock.productId, data.productId)
        )
      );
  } else {
    // Créer
    await db.insert(merchantStock).values({
      merchantId: data.merchantId,
      productId: data.productId,
      quantity: String(data.quantity),
      minThreshold: data.minThreshold ? String(data.minThreshold) : "5",
      lastRestocked: new Date(),
    });
  }

  return { success: true };
}

/**
 * Obtenir les produits en stock bas
 */
export async function getLowStock(merchantId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: merchantStock.id,
      productId: merchantStock.productId,
      productName: products.name,
      productNameDioula: products.nameDioula,
      unit: products.unit,
      quantity: merchantStock.quantity,
      minThreshold: merchantStock.minThreshold,
      lastRestocked: merchantStock.lastRestocked,
    })
    .from(merchantStock)
    .leftJoin(products, eq(merchantStock.productId, products.id))
    .where(
      and(
        eq(merchantStock.merchantId, merchantId),
        sql`${merchantStock.quantity} < ${merchantStock.minThreshold}`
      )
    );

  return result;
}
