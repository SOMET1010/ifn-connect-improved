import { pgTable, serial, integer, varchar, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { merchants } from "./schema";

/**
 * Table des badges disponibles
 */
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  color: varchar("color", { length: 50 }).notNull(),
  requirement: text("requirement").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  points: integer("points").notNull().default(10),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;

/**
 * Table des badges débloqués par les marchands
 */
export const merchantBadges = pgTable("merchant_badges", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  badgeId: integer("badge_id").notNull().references(() => badges.id, { onDelete: "cascade" }),
  unlockedAt: timestamp("unlocked_at", { withTimezone: true }).defaultNow().notNull(),
  isNew: boolean("is_new").default(true).notNull(),
}, (table) => ({
  merchantIdIdx: index("merchant_id_idx").on(table.merchantId),
  badgeIdIdx: index("badge_id_idx").on(table.badgeId),
}));

export type MerchantBadge = typeof merchantBadges.$inferSelect;
export type InsertMerchantBadge = typeof merchantBadges.$inferInsert;
