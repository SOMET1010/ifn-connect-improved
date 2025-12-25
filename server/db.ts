import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users,
  merchants, InsertMerchant,
  agents, InsertAgent,
  cooperatives, InsertCooperative,
  products, InsertProduct,
  merchantStock, InsertMerchantStock,
  sales, InsertSale,
  virtualMarketOrders, InsertVirtualMarketOrder,
  cooperativeStock, InsertCooperativeStock,
  enrollmentDocuments, InsertEnrollmentDocument,
  notifications, InsertNotification,
  voiceCommands, InsertVoiceCommand,
  auditLogs, InsertAuditLog,
  systemSettings, InsertSystemSetting
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "phone", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (user.language !== undefined) {
      values.language = user.language;
      updateSet.language = user.language;
    }
    if (user.pinCode !== undefined) {
      values.pinCode = user.pinCode;
      updateSet.pinCode = user.pinCode;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// MERCHANT MANAGEMENT
// ============================================================================

export async function createMerchant(merchant: InsertMerchant) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(merchants).values(merchant);
  return result;
}

export async function getMerchantByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(merchants).where(eq(merchants.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getMerchantByNumber(merchantNumber: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(merchants).where(eq(merchants.merchantNumber, merchantNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllMerchants() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(merchants).orderBy(desc(merchants.createdAt));
}

export async function getMerchantsByAgent(agentId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(merchants).where(eq(merchants.enrolledBy, agentId)).orderBy(desc(merchants.enrolledAt));
}

export async function updateMerchant(id: number, data: Partial<InsertMerchant>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(merchants).set(data).where(eq(merchants.id, id));
}

// ============================================================================
// AGENT MANAGEMENT
// ============================================================================

export async function createAgent(agent: InsertAgent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(agents).values(agent);
}

export async function getAgentByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(agents).where(eq(agents.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllAgents() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(agents).orderBy(desc(agents.createdAt));
}

export async function incrementAgentEnrollments(agentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(agents).set({
    totalEnrollments: sql`${agents.totalEnrollments} + 1`
  }).where(eq(agents.id, agentId));
}

// ============================================================================
// COOPERATIVE MANAGEMENT
// ============================================================================

export async function createCooperative(cooperative: InsertCooperative) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(cooperatives).values(cooperative);
}

export async function getCooperativeByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(cooperatives).where(eq(cooperatives.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllCooperatives() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(cooperatives).orderBy(desc(cooperatives.createdAt));
}

// ============================================================================
// PRODUCT MANAGEMENT
// ============================================================================

export async function createProduct(product: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(products).values(product);
}

export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(products).where(eq(products.isActive, true));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// STOCK MANAGEMENT
// ============================================================================

export async function getMerchantStock(merchantId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      stock: merchantStock,
      product: products
    })
    .from(merchantStock)
    .leftJoin(products, eq(merchantStock.productId, products.id))
    .where(eq(merchantStock.merchantId, merchantId));
}

export async function updateMerchantStock(merchantId: number, productId: number, quantity: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(merchantStock)
    .where(and(
      eq(merchantStock.merchantId, merchantId),
      eq(merchantStock.productId, productId)
    ))
    .limit(1);

  if (existing.length > 0) {
    return await db
      .update(merchantStock)
      .set({ quantity, lastRestocked: new Date() })
      .where(and(
        eq(merchantStock.merchantId, merchantId),
        eq(merchantStock.productId, productId)
      ));
  } else {
    return await db.insert(merchantStock).values({
      merchantId,
      productId,
      quantity,
      lastRestocked: new Date()
    });
  }
}

export async function getLowStockItems(merchantId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      stock: merchantStock,
      product: products
    })
    .from(merchantStock)
    .leftJoin(products, eq(merchantStock.productId, products.id))
    .where(and(
      eq(merchantStock.merchantId, merchantId),
      sql`${merchantStock.quantity} <= ${merchantStock.minThreshold}`
    ));
}

// ============================================================================
// SALES MANAGEMENT
// ============================================================================

export async function createSale(sale: InsertSale) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Reduce stock automatically
  await db.update(merchantStock).set({
    quantity: sql`${merchantStock.quantity} - ${sale.quantity}`
  }).where(and(
    eq(merchantStock.merchantId, sale.merchantId),
    eq(merchantStock.productId, sale.productId)
  ));

  return await db.insert(sales).values(sale);
}

export async function getMerchantSales(merchantId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(sales.merchantId, merchantId)];
  
  if (startDate && endDate) {
    conditions.push(gte(sales.saleDate, startDate));
    conditions.push(lte(sales.saleDate, endDate));
  }

  return await db
    .select({
      sale: sales,
      product: products
    })
    .from(sales)
    .leftJoin(products, eq(sales.productId, products.id))
    .where(and(...conditions))
    .orderBy(desc(sales.saleDate));
}

export async function getMerchantSalesStats(merchantId: number, date: Date) {
  const db = await getDb();
  if (!db) return { totalSales: 0, totalAmount: "0" };

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await db
    .select({
      totalSales: sql<number>`COUNT(*)`,
      totalAmount: sql<string>`SUM(${sales.totalAmount})`
    })
    .from(sales)
    .where(and(
      eq(sales.merchantId, merchantId),
      gte(sales.saleDate, startOfDay),
      lte(sales.saleDate, endOfDay)
    ));

  return result[0] || { totalSales: 0, totalAmount: "0" };
}

export async function getUnsyncedSales(merchantId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(sales)
    .where(and(
      eq(sales.merchantId, merchantId),
      eq(sales.isSynced, false)
    ))
    .orderBy(desc(sales.saleDate));
}

export async function markSalesAsSynced(saleIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(sales)
    .set({ isSynced: true })
    .where(sql`${sales.id} IN (${sql.join(saleIds.map(id => sql`${id}`), sql`, `)})`);
}

// ============================================================================
// ORDER MANAGEMENT
// ============================================================================

export async function createOrder(order: InsertVirtualMarketOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(virtualMarketOrders).values(order);
}

export async function getMerchantOrders(merchantId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      order: virtualMarketOrders,
      product: products
    })
    .from(virtualMarketOrders)
    .leftJoin(products, eq(virtualMarketOrders.productId, products.id))
    .where(eq(virtualMarketOrders.merchantId, merchantId))
    .orderBy(desc(virtualMarketOrders.orderDate));
}

export async function getCooperativeOrders(cooperativeId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      order: virtualMarketOrders,
      product: products,
      merchant: merchants
    })
    .from(virtualMarketOrders)
    .leftJoin(products, eq(virtualMarketOrders.productId, products.id))
    .leftJoin(merchants, eq(virtualMarketOrders.merchantId, merchants.id))
    .where(eq(virtualMarketOrders.cooperativeId, cooperativeId))
    .orderBy(desc(virtualMarketOrders.orderDate));
}

export async function updateOrderStatus(orderId: number, status: "pending" | "confirmed" | "delivered" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(virtualMarketOrders).set({ status }).where(eq(virtualMarketOrders.id, orderId));
}

// ============================================================================
// NOTIFICATION MANAGEMENT
// ============================================================================

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(notifications).values(notification);
}

export async function getPendingNotifications() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.status, "pending"))
    .orderBy(notifications.createdAt);
}

export async function markNotificationAsSent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(notifications)
    .set({ status: "sent", sentAt: new Date() })
    .where(eq(notifications.id, id));
}

// ============================================================================
// VOICE COMMAND LOGGING
// ============================================================================

export async function logVoiceCommand(command: InsertVoiceCommand) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(voiceCommands).values(command);
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

export async function logAudit(audit: InsertAuditLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(auditLogs).values(audit);
}

export async function getAuditLogs(userId?: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  if (userId) {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  return await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}
