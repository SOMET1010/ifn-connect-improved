import { pgTable, serial, varchar, text, timestamp, decimal, boolean, index, integer, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./schema";
import { merchants } from "./schema";

export const challengeCategoryEnum = pgEnum("challenge_category", ["family", "location", "business", "community"]);
export const authDecisionEnum = pgEnum("auth_decision", ["allow", "challenge", "validate"]);

export const socialChallenges = pgTable("social_challenges", {
  id: serial("id").primaryKey(),
  questionFr: text("question_fr").notNull(),
  questionDioula: text("question_dioula"),
  category: challengeCategoryEnum("category").notNull(),
  difficulty: integer("difficulty").default(1).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index("social_challenges_category_idx").on(table.category),
  activeIdx: index("social_challenges_active_idx").on(table.isActive),
}));

export const merchantChallenges = pgTable("merchant_challenges", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  challengeId: integer("challenge_id").notNull().references(() => socialChallenges.id, { onDelete: "cascade" }),
  answerHash: text("answer_hash").notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  merchantIdx: index("merchant_challenges_merchant_idx").on(table.merchantId),
  primaryIdx: index("merchant_challenges_primary_idx").on(table.isPrimary),
}));

export const authAttempts = pgTable("auth_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  phone: varchar("phone", { length: 20 }).notNull(),
  deviceFingerprint: text("device_fingerprint").notNull(),
  trustScore: integer("trust_score").notNull(),
  decision: authDecisionEnum("decision").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  challengePassed: boolean("challenge_passed"),
  challengeId: integer("challenge_id").references(() => socialChallenges.id, { onDelete: "set null" }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  success: boolean("success").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index("auth_attempts_user_idx").on(table.userId),
  phoneIdx: index("auth_attempts_phone_idx").on(table.phone),
  deviceIdx: index("auth_attempts_device_idx").on(table.deviceFingerprint),
  createdIdx: index("auth_attempts_created_idx").on(table.createdAt),
  successIdx: index("auth_attempts_success_idx").on(table.success),
}));

export const merchantDevices = pgTable("merchant_devices", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  deviceFingerprint: text("device_fingerprint").notNull(),
  deviceName: varchar("device_name", { length: 100 }),
  firstSeen: timestamp("first_seen", { withTimezone: true }).defaultNow().notNull(),
  lastSeen: timestamp("last_seen", { withTimezone: true }).defaultNow().notNull(),
  timesUsed: integer("times_used").default(1).notNull(),
  isTrusted: boolean("is_trusted").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  merchantIdx: index("merchant_devices_merchant_idx").on(table.merchantId),
  fingerprintIdx: index("merchant_devices_fingerprint_idx").on(table.deviceFingerprint),
  trustedIdx: index("merchant_devices_trusted_idx").on(table.isTrusted),
}));

export type SocialChallenge = typeof socialChallenges.$inferSelect;
export type InsertSocialChallenge = typeof socialChallenges.$inferInsert;

export type MerchantChallenge = typeof merchantChallenges.$inferSelect;
export type InsertMerchantChallenge = typeof merchantChallenges.$inferInsert;

export type AuthAttempt = typeof authAttempts.$inferSelect;
export type InsertAuthAttempt = typeof authAttempts.$inferInsert;

export type MerchantDevice = typeof merchantDevices.$inferSelect;
export type InsertMerchantDevice = typeof merchantDevices.$inferInsert;
