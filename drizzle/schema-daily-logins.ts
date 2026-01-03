import { pgTable, serial, integer, date, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { merchants } from "./schema";

/**
 * Table merchant_daily_logins - Tracking des logins quotidiens pour le briefing matinal
 */
export const merchantDailyLogins = pgTable("merchant_daily_logins", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  loginDate: date("login_date").notNull(),
  firstLoginTime: timestamp("first_login_time", { withTimezone: true }).defaultNow().notNull(),
  briefingShown: boolean("briefing_shown").default(false).notNull(),
  briefingSkipped: boolean("briefing_skipped").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  merchantIdx: index("merchant_daily_logins_merchant_idx").on(table.merchantId),
  loginDateIdx: index("merchant_daily_logins_date_idx").on(table.loginDate),
}));

export type MerchantDailyLogin = typeof merchantDailyLogins.$inferSelect;
export type InsertMerchantDailyLogin = typeof merchantDailyLogins.$inferInsert;
