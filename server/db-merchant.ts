import { getDb } from "./db";
import { merchants, merchantSocialProtection } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Récupérer le marchand lié à un utilisateur avec sa protection sociale
 */
export async function getMerchantByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const results = await db
    .select()
    .from(merchants)
    .leftJoin(merchantSocialProtection, eq(merchants.id, merchantSocialProtection.merchantId))
    .where(eq(merchants.userId, userId))
    .limit(1);

  if (results.length === 0) return null;

  const row = results[0];
  const merchant = {
    ...row.merchants,
    socialProtection: row.merchant_social_protection,
  };
  
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
