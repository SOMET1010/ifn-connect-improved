import { mysqlTable, int, date, timestamp, boolean, index } from "drizzle-orm/mysql-core";
import { merchants } from "./schema";

/**
 * Table merchant_daily_logins - Tracking des logins quotidiens pour le briefing matinal
 */
export const merchantDailyLogins = mysqlTable("merchant_daily_logins", {
  id: int("id").autoincrement().primaryKey(),
  merchantId: int("merchantId").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  loginDate: date("loginDate").notNull(), // Date du login (YYYY-MM-DD)
  firstLoginTime: timestamp("firstLoginTime").defaultNow().notNull(),
  briefingShown: boolean("briefingShown").default(false).notNull(),
  briefingSkipped: boolean("briefingSkipped").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  merchantIdx: index("merchant_daily_logins_merchant_idx").on(table.merchantId),
  loginDateIdx: index("merchant_daily_logins_date_idx").on(table.loginDate),
}));

export type MerchantDailyLogin = typeof merchantDailyLogins.$inferSelect;
export type InsertMerchantDailyLogin = typeof merchantDailyLogins.$inferInsert;
