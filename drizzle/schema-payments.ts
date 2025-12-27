import { mysqlTable, varchar, int, decimal, timestamp, text, index } from "drizzle-orm/mysql-core";
import { merchants, products } from "./schema";

/**
 * Table transactions - Historique des paiements Mobile Money
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  merchantId: int("merchant_id").notNull().references(() => merchants.id),
  orderId: int("order_id").references(() => marketplaceOrders.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("XOF"),
  provider: varchar("provider", { length: 20 }).notNull(), // orange_money, mtn_momo, wave, moov_money
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending"), // pending, success, failed, refunded
  transactionId: varchar("transaction_id", { length: 255 }),
  reference: varchar("reference", { length: 255 }),
  errorMessage: text("error_message"),
  webhookData: text("webhook_data"), // JSON stringified
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  transactionIdIdx: index("transaction_id_idx").on(table.transactionId),
  merchantIdIdx: index("merchant_id_idx").on(table.merchantId),
  statusIdx: index("status_idx").on(table.status),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
  merchantStatusIdx: index("merchant_status_idx").on(table.merchantId, table.status),
}));

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Table marketplace_orders - Commandes du marché virtuel
 */
export const marketplaceOrders = mysqlTable("marketplace_orders", {
  id: int("id").autoincrement().primaryKey(),
  buyerId: int("buyer_id").notNull().references(() => merchants.id),
  sellerId: int("seller_id").notNull().references(() => merchants.id),
  productId: int("product_id").notNull().references(() => products.id),
  quantity: int("quantity").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending_payment"), // pending_payment, paid, shipped, delivered, cancelled, refunded
  deliveryAddress: text("delivery_address"),
  deliveryPhone: varchar("delivery_phone", { length: 20 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  buyerIdIdx: index("buyer_id_idx").on(table.buyerId),
  sellerIdIdx: index("seller_id_idx").on(table.sellerId),
  statusIdx: index("status_idx").on(table.status),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
  buyerStatusIdx: index("buyer_status_idx").on(table.buyerId, table.status),
}));

export type MarketplaceOrder = typeof marketplaceOrders.$inferSelect;
export type InsertMarketplaceOrder = typeof marketplaceOrders.$inferInsert;
