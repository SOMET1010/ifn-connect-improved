import { pgTable, serial, varchar, integer, decimal, timestamp, text, index, boolean, pgEnum } from "drizzle-orm/pg-core";
import { users, merchants } from "./schema";

export const walletTransactionTypeEnum = pgEnum("wallet_transaction_type", ["transfer_sent", "transfer_received", "payment_request_sent", "payment_request_received", "deposit", "withdrawal"]);
export const walletTransactionStatusEnum = pgEnum("wallet_transaction_status", ["pending", "completed", "failed", "cancelled"]);

/**
 * Table wallets - Portefeuille digital pour chaque marchand
 */
export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  merchantId: integer("merchant_id").references(() => merchants.id, { onDelete: "cascade" }),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0").notNull(),
  currency: varchar("currency", { length: 3 }).default("XOF").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("wallet_user_id_idx").on(table.userId),
  merchantIdIdx: index("wallet_merchant_id_idx").on(table.merchantId),
}));

export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = typeof wallets.$inferInsert;

/**
 * Table wallet_transactions - Historique des transferts P2P et paiements
 */
export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  fromWalletId: integer("from_wallet_id").references(() => wallets.id, { onDelete: "set null" }),
  toWalletId: integer("to_wallet_id").references(() => wallets.id, { onDelete: "set null" }),
  fromUserId: integer("from_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  toUserId: integer("to_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("XOF").notNull(),
  type: walletTransactionTypeEnum("type").notNull(),
  status: walletTransactionStatusEnum("status").default("pending").notNull(),
  reference: varchar("reference", { length: 50 }).notNull().unique(),
  description: text("description"),
  notes: text("notes"),
  metadata: text("metadata"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  fromWalletIdIdx: index("wt_from_wallet_id_idx").on(table.fromWalletId),
  toWalletIdIdx: index("wt_to_wallet_id_idx").on(table.toWalletId),
  fromUserIdIdx: index("wt_from_user_id_idx").on(table.fromUserId),
  toUserIdIdx: index("wt_to_user_id_idx").on(table.toUserId),
  statusIdx: index("wt_status_idx").on(table.status),
  referenceIdx: index("wt_reference_idx").on(table.reference),
  createdAtIdx: index("wt_created_at_idx").on(table.createdAt),
  typeStatusIdx: index("wt_type_status_idx").on(table.type, table.status),
}));

export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = typeof walletTransactions.$inferInsert;

/**
 * Table beneficiaries - Contacts favoris pour transferts rapides
 */
export const beneficiaries = pgTable("beneficiaries", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contactId: integer("contact_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  nickname: varchar("nickname", { length: 100 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ownerIdIdx: index("beneficiary_owner_id_idx").on(table.ownerId),
  contactIdIdx: index("beneficiary_contact_id_idx").on(table.contactId),
  ownerContactIdx: index("beneficiary_owner_contact_idx").on(table.ownerId, table.contactId),
}));

export type Beneficiary = typeof beneficiaries.$inferSelect;
export type InsertBeneficiary = typeof beneficiaries.$inferInsert;
