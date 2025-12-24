import { getDb } from "./db";
import { merchants } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Récupérer le marchand lié à un utilisateur
 */
export async function getMerchantByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.userId, userId))
    .limit(1);
  
  return merchant || null;
}

/**
 * Récupérer un marchand par son ID
 */
export async function getMerchantById(merchantId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, merchantId))
    .limit(1);
  
  return merchant || null;
}
