import { mysqlTable, int, varchar, text, timestamp, boolean, index } from "drizzle-orm/mysql-core";
import { merchants } from "./schema";

/**
 * Table des badges disponibles
 */
export const badges = mysqlTable("badges", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(), // Code unique du badge (ex: FIRST_SALE)
  name: varchar("name", { length: 100 }).notNull(), // Nom du badge
  description: text("description").notNull(), // Description du badge
  icon: varchar("icon", { length: 50 }).notNull(), // Emoji ou nom d'icône
  color: varchar("color", { length: 50 }).notNull(), // Couleur du badge (ex: orange, gold, purple)
  requirement: text("requirement").notNull(), // Condition de déblocage (texte descriptif)
  category: varchar("category", { length: 50 }).notNull(), // Catégorie (sales, stock, social, learning, community)
  points: int("points").notNull().default(10), // Points gagnés en débloquant
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;

/**
 * Table des badges débloqués par les marchands
 */
export const merchantBadges = mysqlTable("merchant_badges", {
  id: int("id").autoincrement().primaryKey(),
  merchantId: int("merchantId").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  badgeId: int("badgeId").notNull().references(() => badges.id, { onDelete: "cascade" }),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
  isNew: boolean("isNew").default(true).notNull(), // Pour afficher l'animation de nouveau badge
}, (table) => ({
  merchantIdIdx: index("merchant_id_idx").on(table.merchantId),
  badgeIdIdx: index("badge_id_idx").on(table.badgeId),
}));

export type MerchantBadge = typeof merchantBadges.$inferSelect;
export type InsertMerchantBadge = typeof merchantBadges.$inferInsert;
