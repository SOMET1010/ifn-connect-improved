import { pgTable, serial, varchar, integer, decimal, timestamp, text, index } from "drizzle-orm/pg-core";
import { merchants, products } from "./schema";

/**
 * Table transactions - Historique des paiements Mobile Money
 */
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id),
  orderId: integer("order_id").references(() => marketplaceOrders.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("XOF"),
  provider: varchar("provider", { length: 20 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  transactionId: varchar("transaction_id", { length: 255 }),
  reference: varchar("reference", { length: 255 }),
  errorMessage: text("error_message"),
  webhookData: text("webhook_data"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
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
export const marketplaceOrders = pgTable("marketplace_orders", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").notNull().references(() => merchants.id),
  sellerId: integer("seller_id").notNull().references(() => merchants.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending_payment"),
  deliveryAddress: text("delivery_address"),
  deliveryPhone: varchar("delivery_phone", { length: 20 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  buyerIdIdx: index("buyer_id_idx").on(table.buyerId),
  sellerIdIdx: index("seller_id_idx").on(table.sellerId),
  statusIdx: index("status_idx").on(table.status),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
  buyerStatusIdx: index("buyer_status_idx").on(table.buyerId, table.status),
}));

export type MarketplaceOrder = typeof marketplaceOrders.$inferSelect;
export type InsertMarketplaceOrder = typeof marketplaceOrders.$inferInsert;
