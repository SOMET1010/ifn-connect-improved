import { pgTable, serial, varchar, text, timestamp, decimal, boolean, index, uniqueIndex, date, json, integer, pgEnum } from "drizzle-orm/pg-core";

/**
 * Schéma de base de données pour IFN Connect
 * Plateforme d'inclusion financière numérique pour la Côte d'Ivoire
 * PostgreSQL/Supabase
 */

// ============================================================================
// ENUMS
// ============================================================================

export const roleEnum = pgEnum("role", ["admin", "merchant", "agent", "cooperative"]);
export const languageEnum = pgEnum("language", ["fr", "dioula"]);
export const statusEnum = pgEnum("status", ["active", "inactive", "pending", "expired"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "mobile_money", "credit"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "confirmed", "preparing", "in_transit", "delivered", "cancelled"]);
export const notificationTypeEnum = pgEnum("notification_type", ["sms", "email", "push"]);
export const notificationStatusEnum = pgEnum("notification_status", ["pending", "sent", "failed"]);
export const creditTierEnum = pgEnum("credit_tier", ["none", "bronze", "silver", "gold", "platinum"]);
export const savingsTypeEnum = pgEnum("savings_type", ["deposit", "withdrawal"]);
export const eventTypeEnum = pgEnum("event_type", ["religious", "national", "cultural", "commercial"]);
export const priorityEnum = pgEnum("priority", ["high", "medium", "low"]);
export const alertTypeEnum = pgEnum("alert_type", ["7_days", "3_days", "1_day", "today"]);
export const actorTypeEnum = pgEnum("actor_type", ["grossiste", "semi-grossiste", "detaillant"]);
export const actionEnum = pgEnum("action", ["create", "update", "delete", "verify", "bulk_update"]);
export const renewalTypeEnum = pgEnum("renewal_type", ["cnps", "cmu", "rsti"]);
export const renewalStatusEnum = pgEnum("renewal_status", ["pending", "approved", "rejected", "cancelled"]);
export const correctAnswerEnum = pgEnum("correct_answer", ["A", "B", "C", "D"]);
export const challengeStatusEnum = pgEnum("challenge_status", ["pending", "accepted", "completed", "declined"]);
export const groupedOrderStatusEnum = pgEnum("grouped_order_status", ["draft", "pending", "confirmed", "delivered", "cancelled"]);
export const inAppNotificationTypeEnum = pgEnum("in_app_notification_type", [
  "quiz_passed",
  "badge_earned",
  "challenge_received",
  "challenge_won",
  "renewal_reminder",
  "stock_alert",
  "order_status",
  "group_order_created",
  "session_reminder",
  "system"
]);

// ============================================================================
// USERS & AUTHENTICATION
// ============================================================================

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: roleEnum("role").default("merchant").notNull(),
  language: languageEnum("language").default("fr").notNull(),
  pinCode: varchar("pin_code", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  phoneIdx: index("phone_idx").on(table.phone),
  roleIdx: index("role_idx").on(table.role),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// AGENTS
// ============================================================================

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  agentNumber: varchar("agent_number", { length: 50 }).notNull().unique(),
  zone: text("zone"),
  totalEnrollments: integer("total_enrollments").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  agentNumberIdx: index("agent_number_idx").on(table.agentNumber),
}));

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

// ============================================================================
// MERCHANTS
// ============================================================================

export const merchants = pgTable("merchants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  merchantNumber: varchar("merchant_number", { length: 50 }).notNull().unique(),
  businessName: text("business_name").notNull(),
  businessType: varchar("business_type", { length: 100 }),
  location: text("location"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  cnpsNumber: varchar("cnps_number", { length: 50 }),
  cmuNumber: varchar("cmu_number", { length: 50 }),
  cnpsStatus: statusEnum("cnps_status").default("pending"),
  cmuStatus: statusEnum("cmu_status").default("pending"),
  cnpsExpiryDate: timestamp("cnps_expiry_date", { withTimezone: true }),
  cmuExpiryDate: timestamp("cmu_expiry_date", { withTimezone: true }),
  enrolledBy: integer("enrolled_by").references(() => agents.id),
  enrolledAt: timestamp("enrolled_at", { withTimezone: true }),
  isVerified: boolean("is_verified").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  merchantNumberIdx: index("merchant_number_idx").on(table.merchantNumber),
  locationIdx: index("location_idx").on(table.latitude, table.longitude),
  enrolledByIdx: index("enrolled_by_idx").on(table.enrolledBy),
}));

export type Merchant = typeof merchants.$inferSelect;
export type InsertMerchant = typeof merchants.$inferInsert;

// ============================================================================
// MERCHANT DAILY SESSIONS
// ============================================================================

export const merchantDailySessions = pgTable("merchant_daily_sessions", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  sessionDate: date("session_date").notNull(),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  openingNotes: text("opening_notes"),
  closingNotes: text("closing_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueMerchantDate: uniqueIndex("unique_merchant_date").on(table.merchantId, table.sessionDate),
  merchantDateIdx: index("merchant_date_idx").on(table.merchantId, table.sessionDate),
  openedAtIdx: index("opened_at_idx").on(table.openedAt),
  closedAtIdx: index("closed_at_idx").on(table.closedAt),
}));

export type MerchantDailySession = typeof merchantDailySessions.$inferSelect;
export type InsertMerchantDailySession = typeof merchantDailySessions.$inferInsert;

// ============================================================================
// COOPERATIVES
// ============================================================================

export const cooperatives = pgTable("cooperatives", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cooperativeName: text("cooperative_name").notNull(),
  cooperativeNumber: varchar("cooperative_number", { length: 50 }).notNull().unique(),
  location: text("location"),
  totalMembers: integer("total_members").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  cooperativeNumberIdx: index("cooperative_number_idx").on(table.cooperativeNumber),
}));

export type Cooperative = typeof cooperatives.$inferSelect;
export type InsertCooperative = typeof cooperatives.$inferInsert;

// ============================================================================
// PRODUCTS
// ============================================================================

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameDioula: text("name_dioula"),
  category: varchar("category", { length: 100 }),
  unit: varchar("unit", { length: 50 }).notNull(),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }),
  imageUrl: text("image_url"),
  pictogramUrl: text("pictogram_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index("category_idx").on(table.category),
}));

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ============================================================================
// MERCHANT STOCK
// ============================================================================

export const merchantStock = pgTable("merchant_stock", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  minThreshold: decimal("min_threshold", { precision: 10, scale: 2 }).default("5"),
  lastRestocked: timestamp("last_restocked", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  merchantProductIdx: index("merchant_product_idx").on(table.merchantId, table.productId),
}));

export type MerchantStock = typeof merchantStock.$inferSelect;
export type InsertMerchantStock = typeof merchantStock.$inferInsert;

// ============================================================================
// SALES
// ============================================================================

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").default("cash").notNull(),
  paymentProvider: varchar("payment_provider", { length: 50 }),
  transactionId: varchar("transaction_id", { length: 100 }),
  isVoiceRecorded: boolean("is_voice_recorded").default(false),
  isSynced: boolean("is_synced").default(false).notNull(),
  saleDate: timestamp("sale_date", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  merchantDateIdx: index("merchant_date_idx").on(table.merchantId, table.saleDate),
  syncIdx: index("sync_idx").on(table.isSynced),
  paymentMethodIdx: index("payment_method_idx").on(table.paymentMethod),
  merchantPaymentIdx: index("merchant_payment_idx").on(table.merchantId, table.paymentMethod),
}));

export type Sale = typeof sales.$inferSelect;
export type InsertSale = typeof sales.$inferInsert;

// ============================================================================
// COOPERATIVE STOCK
// ============================================================================

export const cooperativeStock = pgTable("cooperative_stock", {
  id: serial("id").primaryKey(),
  cooperativeId: integer("cooperative_id").notNull().references(() => cooperatives.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  minThreshold: decimal("min_threshold", { precision: 10, scale: 2 }).default("50"),
  lastRestocked: timestamp("last_restocked", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  cooperativeProductIdx: index("cooperative_product_idx").on(table.cooperativeId, table.productId),
}));

export type CooperativeStock = typeof cooperativeStock.$inferSelect;
export type InsertCooperativeStock = typeof cooperativeStock.$inferInsert;

// ============================================================================
// ORDERS
// ============================================================================

export const virtualMarketOrders = pgTable("orders", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  cooperativeId: integer("cooperative_id").references(() => cooperatives.id),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum("status").default("pending").notNull(),
  orderDate: timestamp("order_date", { withTimezone: true }).defaultNow().notNull(),
  deliveryDate: timestamp("delivery_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  merchantStatusIdx: index("merchant_status_idx").on(table.merchantId, table.status),
  cooperativeStatusIdx: index("cooperative_status_idx").on(table.cooperativeId, table.status),
}));

export type VirtualMarketOrder = typeof virtualMarketOrders.$inferSelect;
export type InsertVirtualMarketOrder = typeof virtualMarketOrders.$inferInsert;

// ============================================================================
// ENROLLMENT DOCUMENTS
// ============================================================================

export const enrollmentDocuments = pgTable("enrollment_documents", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  documentType: varchar("document_type", { length: 100 }).notNull(),
  documentUrl: text("document_url").notNull(),
  uploadedBy: integer("uploaded_by").notNull().references(() => agents.id),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  merchantIdx: index("merchant_idx").on(table.merchantId),
}));

export type EnrollmentDocument = typeof enrollmentDocuments.$inferSelect;
export type InsertEnrollmentDocument = typeof enrollmentDocuments.$inferInsert;

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  status: notificationStatusEnum("status").default("pending").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userStatusIdx: index("user_status_idx").on(table.userId, table.status),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ============================================================================
// VOICE COMMANDS LOG
// ============================================================================

export const voiceCommands = pgTable("voice_commands", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  language: languageEnum("language").notNull(),
  command: text("command").notNull(),
  transcription: text("transcription").notNull(),
  action: varchar("action", { length: 100 }),
  isSuccessful: boolean("is_successful").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
}));

export type VoiceCommand = typeof voiceCommands.$inferSelect;
export type InsertVoiceCommand = typeof voiceCommands.$inferInsert;

// ============================================================================
// BADGES & GAMIFICATION
// ============================================================================

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

// ============================================================================
// AUDIT LOGS
// ============================================================================

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 100 }).notNull(),
  entityId: integer("entity_id"),
  details: text("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userActionIdx: index("user_action_idx").on(table.userId, table.action),
  entityIdx: index("entity_idx").on(table.entity, table.entityId),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ============================================================================
// SYSTEM SETTINGS
// ============================================================================

export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;

// ============================================================================
// MARKETS & ACTORS
// ============================================================================

export const markets = pgTable("markets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  sourceFile: text("source_file"),
  declaredEffectif: integer("declared_effectif"),
  declaredCmu: integer("declared_cmu"),
  declaredCnps: integer("declared_cnps"),
  declaredRsti: integer("declared_rsti"),
  rowsInFile: integer("rows_in_file"),
  uniqueIdentifierCodes: integer("unique_identifier_codes"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  address: text("address"),
  isGeolocated: boolean("is_geolocated").default(false).notNull(),
  geolocatedAt: timestamp("geolocated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index("market_name_idx").on(table.name),
}));

export type Market = typeof markets.$inferSelect;
export type InsertMarket = typeof markets.$inferInsert;

export const actors = pgTable("actors", {
  id: serial("id").primaryKey(),
  actorKey: varchar("actor_key", { length: 50 }).notNull().unique(),
  marketId: integer("market_id").references(() => markets.id, { onDelete: "set null" }),
  marketName: varchar("market_name", { length: 255 }).notNull(),
  rowNo: integer("row_no"),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  identifierCode: varchar("identifier_code", { length: 50 }),
  phone: varchar("phone", { length: 20 }),
  sourceFile: text("source_file"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  actorKeyIdx: index("actor_key_idx").on(table.actorKey),
  marketNameIdx: index("actor_market_name_idx").on(table.marketName),
  identifierIdx: index("actor_identifier_idx").on(table.identifierCode),
  phoneIdx: index("actor_phone_idx").on(table.phone),
}));

export type Actor = typeof actors.$inferSelect;
export type InsertActor = typeof actors.$inferInsert;

// ============================================================================
// SCORE SUTA
// ============================================================================

export const merchantScores = pgTable("merchant_scores", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  totalScore: integer("total_score").notNull().default(0),
  regularityScore: integer("regularity_score").notNull().default(0),
  volumeScore: integer("volume_score").notNull().default(0),
  savingsScore: integer("savings_score").notNull().default(0),
  usageScore: integer("usage_score").notNull().default(0),
  seniorityScore: integer("seniority_score").notNull().default(0),
  consecutiveSalesDays: integer("consecutive_sales_days").notNull().default(0),
  totalSalesAmount: decimal("total_sales_amount", { precision: 15, scale: 2 }).notNull().default("0"),
  totalSavingsAmount: decimal("total_savings_amount", { precision: 15, scale: 2 }).notNull().default("0"),
  appUsageDays: integer("app_usage_days").notNull().default(0),
  accountAgeDays: integer("account_age_days").notNull().default(0),
  isEligibleForCredit: boolean("is_eligible_for_credit").notNull().default(false),
  maxCreditAmount: decimal("max_credit_amount", { precision: 15, scale: 2 }).notNull().default("0"),
  creditTier: creditTierEnum("credit_tier").default("none").notNull(),
  lastCalculatedAt: timestamp("last_calculated_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  merchantIdx: index("merchant_score_idx").on(table.merchantId),
  scoreIdx: index("total_score_idx").on(table.totalScore),
  eligibilityIdx: index("credit_eligibility_idx").on(table.isEligibleForCredit),
}));

export type MerchantScore = typeof merchantScores.$inferSelect;
export type InsertMerchantScore = typeof merchantScores.$inferInsert;

export const scoreHistory = pgTable("score_history", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  totalScore: integer("total_score").notNull(),
  creditTier: creditTierEnum("credit_tier").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  merchantIdx: index("score_history_merchant_idx").on(table.merchantId),
  dateIdx: index("score_history_date_idx").on(table.createdAt),
}));

export type ScoreHistory = typeof scoreHistory.$inferSelect;
export type InsertScoreHistory = typeof scoreHistory.$inferInsert;

// ============================================================================
// SAVINGS
// ============================================================================

export const savingsGoals = pgTable("savings_goals", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  targetAmount: decimal("target_amount", { precision: 15, scale: 2 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 15, scale: 2 }).notNull().default("0"),
  deadline: date("deadline"),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  merchantIdx: index("savings_merchant_idx").on(table.merchantId),
  statusIdx: index("savings_status_idx").on(table.isCompleted),
}));

export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type InsertSavingsGoal = typeof savingsGoals.$inferInsert;

export const savingsTransactions = pgTable("savings_transactions", {
  id: serial("id").primaryKey(),
  savingsGoalId: integer("savings_goal_id").notNull().references(() => savingsGoals.id, { onDelete: "cascade" }),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  type: savingsTypeEnum("type").notNull(),
  source: varchar("source", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  goalIdx: index("savings_tx_goal_idx").on(table.savingsGoalId),
  merchantIdx: index("savings_tx_merchant_idx").on(table.merchantId),
  dateIdx: index("savings_tx_date_idx").on(table.createdAt),
}));

export type SavingsTransaction = typeof savingsTransactions.$inferSelect;
export type InsertSavingsTransaction = typeof savingsTransactions.$inferInsert;

// ============================================================================
// EVENTS
// ============================================================================

export const localEvents = pgTable("local_events", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  type: eventTypeEnum("type").notNull(),
  date: date("date").notNull(),
  endDate: date("end_date"),
  description: text("description"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  iconEmoji: varchar("icon_emoji", { length: 10 }),
  color: varchar("color", { length: 20 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  dateIdx: index("events_date_idx").on(table.date),
  typeIdx: index("events_type_idx").on(table.type),
}));

export type LocalEvent = typeof localEvents.$inferSelect;
export type InsertLocalEvent = typeof localEvents.$inferInsert;

export const eventStockRecommendations = pgTable("event_stock_recommendations", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => localEvents.id, { onDelete: "cascade" }),
  productName: varchar("product_name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }),
  priority: priorityEnum("priority").notNull().default("medium"),
  estimatedDemandIncrease: integer("estimated_demand_increase"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  eventIdx: index("stock_rec_event_idx").on(table.eventId),
  priorityIdx: index("stock_rec_priority_idx").on(table.priority),
}));

export type EventStockRecommendation = typeof eventStockRecommendations.$inferSelect;
export type InsertEventStockRecommendation = typeof eventStockRecommendations.$inferInsert;

export const eventAlerts = pgTable("event_alerts", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => localEvents.id, { onDelete: "cascade" }),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  alertType: alertTypeEnum("alert_type").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  eventIdx: index("alerts_event_idx").on(table.eventId),
  merchantIdx: index("alerts_merchant_idx").on(table.merchantId),
  readIdx: index("alerts_read_idx").on(table.isRead),
}));

export type EventAlert = typeof eventAlerts.$inferSelect;
export type InsertEventAlert = typeof eventAlerts.$inferInsert;

// ============================================================================
// MERCHANT ACTIVITY & SOCIAL PROTECTION
// ============================================================================

export const merchantActivity = pgTable("merchant_activity", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  actorType: actorTypeEnum("actor_type"),
  products: text("products"),
  numberOfStores: integer("number_of_stores").default(0),
  tableNumber: varchar("table_number", { length: 20 }),
  boxNumber: varchar("box_number", { length: 20 }),
  sector: varchar("sector", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  merchantIdx: index("merchant_activity_merchant_idx").on(table.merchantId),
}));

export type MerchantActivity = typeof merchantActivity.$inferSelect;
export type InsertMerchantActivity = typeof merchantActivity.$inferInsert;

export const merchantSocialProtection = pgTable("merchant_social_protection", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  hasCMU: boolean("has_cmu").default(false).notNull(),
  cmuNumber: varchar("cmu_number", { length: 50 }),
  cmuStatus: statusEnum("cmu_status").default("pending"),
  cmuStartDate: timestamp("cmu_start_date", { withTimezone: true }),
  cmuExpiryDate: timestamp("cmu_expiry_date", { withTimezone: true }),
  hasCNPS: boolean("has_cnps").default(false).notNull(),
  cnpsNumber: varchar("cnps_number", { length: 50 }),
  cnpsStatus: statusEnum("cnps_status").default("pending"),
  cnpsStartDate: timestamp("cnps_start_date", { withTimezone: true }),
  cnpsExpiryDate: timestamp("cnps_expiry_date", { withTimezone: true }),
  hasRSTI: boolean("has_rsti").default(false).notNull(),
  rstiNumber: varchar("rsti_number", { length: 50 }),
  rstiStatus: statusEnum("rsti_status").default("pending"),
  rstiStartDate: timestamp("rsti_start_date", { withTimezone: true }),
  rstiExpiryDate: timestamp("rsti_expiry_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  merchantIdx: index("merchant_social_protection_merchant_idx").on(table.merchantId),
  cmuStatusIdx: index("merchant_social_protection_cmu_status_idx").on(table.cmuStatus),
  cnpsStatusIdx: index("merchant_social_protection_cnps_status_idx").on(table.cnpsStatus),
}));

export type MerchantSocialProtection = typeof merchantSocialProtection.$inferSelect;
export type InsertMerchantSocialProtection = typeof merchantSocialProtection.$inferInsert;

export const merchantEditHistory = pgTable("merchant_edit_history", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  editedBy: integer("edited_by").notNull().references(() => users.id),
  fieldName: varchar("field_name", { length: 100 }).notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  action: actionEnum("action").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  merchantIdx: index("merchant_edit_history_merchant_idx").on(table.merchantId),
  editedByIdx: index("merchant_edit_history_edited_by_idx").on(table.editedBy),
  createdAtIdx: index("merchant_edit_history_created_at_idx").on(table.createdAt),
}));

export type MerchantEditHistory = typeof merchantEditHistory.$inferSelect;
export type InsertMerchantEditHistory = typeof merchantEditHistory.$inferInsert;

export const socialProtectionRenewals = pgTable("social_protection_renewals", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  type: renewalTypeEnum("type").notNull(),
  currentExpiryDate: timestamp("current_expiry_date", { withTimezone: true }),
  requestedExpiryDate: timestamp("requested_expiry_date", { withTimezone: true }).notNull(),
  status: renewalStatusEnum("status").default("pending").notNull(),
  proofDocumentUrl: text("proof_document_url"),
  proofDocumentKey: varchar("proof_document_key", { length: 255 }),
  merchantNotes: text("merchant_notes"),
  adminNotes: text("admin_notes"),
  requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  rejectedAt: timestamp("rejected_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  merchantIdx: index("social_protection_renewals_merchant_idx").on(table.merchantId),
  statusIdx: index("social_protection_renewals_status_idx").on(table.status),
  typeIdx: index("social_protection_renewals_type_idx").on(table.type),
  requestedAtIdx: index("social_protection_renewals_requested_at_idx").on(table.requestedAt),
}));

export type SocialProtectionRenewal = typeof socialProtectionRenewals.$inferSelect;
export type InsertSocialProtectionRenewal = typeof socialProtectionRenewals.$inferInsert;

// ============================================================================
// E-LEARNING
// ============================================================================

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  duration: integer("duration").notNull(),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  level: varchar("level", { length: 50 }).notNull().default("beginner"),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index("courses_category_idx").on(table.category),
  levelIdx: index("courses_level_idx").on(table.level),
  publishedIdx: index("courses_published_idx").on(table.isPublished),
}));

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

export const courseProgress = pgTable("course_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  progress: integer("progress").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index("course_progress_user_idx").on(table.userId),
  courseIdx: index("course_progress_course_idx").on(table.courseId),
  completedIdx: index("course_progress_completed_idx").on(table.completed),
  uniqueUserCourse: index("course_progress_unique_user_course").on(table.userId, table.courseId),
}));

export type CourseProgress = typeof courseProgress.$inferSelect;
export type InsertCourseProgress = typeof courseProgress.$inferInsert;

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  optionA: varchar("option_a", { length: 255 }).notNull(),
  optionB: varchar("option_b", { length: 255 }).notNull(),
  optionC: varchar("option_c", { length: 255 }).notNull(),
  optionD: varchar("option_d", { length: 255 }),
  correctAnswer: correctAnswerEnum("correct_answer").notNull(),
  explanation: text("explanation"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  courseIdx: index("quizzes_course_idx").on(table.courseId),
}));

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = typeof quizzes.$inferInsert;

export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  passed: boolean("passed").notNull(),
  answers: text("answers"),
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index("quiz_attempts_user_idx").on(table.userId),
  courseIdx: index("quiz_attempts_course_idx").on(table.courseId),
  passedIdx: index("quiz_attempts_passed_idx").on(table.passed),
}));

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = typeof quizAttempts.$inferInsert;

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  badgeName: varchar("badge_name", { length: 100 }).notNull(),
  badgeIcon: varchar("badge_icon", { length: 10 }),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "set null" }),
  scoreObtained: integer("score_obtained").notNull(),
  earnedAt: timestamp("earned_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_achievements_user_idx").on(table.userId),
  badgeIdx: index("user_achievements_badge_idx").on(table.badgeName),
}));

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;

export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  challengerId: integer("challenger_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  challengedId: integer("challenged_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  challengerScore: integer("challenger_score"),
  challengedScore: integer("challenged_score"),
  status: challengeStatusEnum("status").default("pending").notNull(),
  winnerId: integer("winner_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (table) => ({
  challengerIdx: index("challenges_challenger_idx").on(table.challengerId),
  challengedIdx: index("challenges_challenged_idx").on(table.challengedId),
  statusIdx: index("challenges_status_idx").on(table.status),
}));

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = typeof challenges.$inferInsert;

export const weeklyLeaderboard = pgTable("weekly_leaderboard", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  weekNumber: integer("week_number").notNull(),
  year: integer("year").notNull(),
  region: varchar("region", { length: 100 }),
  totalPoints: integer("total_points").notNull().default(0),
  quizzesCompleted: integer("quizzes_completed").notNull().default(0),
  averageScore: integer("average_score").notNull().default(0),
  rank: integer("rank"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index("weekly_leaderboard_user_idx").on(table.userId),
  weekIdx: index("weekly_leaderboard_week_idx").on(table.weekNumber, table.year),
  regionIdx: index("weekly_leaderboard_region_idx").on(table.region),
  rankIdx: index("weekly_leaderboard_rank_idx").on(table.rank),
}));

export type WeeklyLeaderboard = typeof weeklyLeaderboard.$inferSelect;
export type InsertWeeklyLeaderboard = typeof weeklyLeaderboard.$inferInsert;

export const inAppNotifications = pgTable("in_app_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: inAppNotificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  actionUrl: text("action_url"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userReadIdx: index("user_read_idx").on(table.userId, table.isRead),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type InAppNotification = typeof inAppNotifications.$inferSelect;
export type InsertInAppNotification = typeof inAppNotifications.$inferInsert;

export const cooperativeMembers = pgTable("cooperative_members", {
  id: serial("id").primaryKey(),
  cooperativeId: integer("cooperative_id").notNull().references(() => cooperatives.id, { onDelete: "cascade" }),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
}, (table) => ({
  cooperativeMerchantIdx: index("cooperative_merchant_idx").on(table.cooperativeId, table.merchantId),
}));

export type CooperativeMember = typeof cooperativeMembers.$inferSelect;
export type InsertCooperativeMember = typeof cooperativeMembers.$inferInsert;

export const groupedOrders = pgTable("grouped_orders", {
  id: serial("id").primaryKey(),
  cooperativeId: integer("cooperative_id").notNull().references(() => cooperatives.id, { onDelete: "cascade" }),
  productName: varchar("product_name", { length: 255 }).notNull(),
  totalQuantity: integer("total_quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  status: groupedOrderStatusEnum("status").notNull().default("draft"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
}, (table) => ({
  cooperativeStatusIdx: index("cooperative_status_idx").on(table.cooperativeId, table.status),
}));

export type GroupedOrder = typeof groupedOrders.$inferSelect;
export type InsertGroupedOrder = typeof groupedOrders.$inferInsert;

export const groupedOrderParticipants = pgTable("grouped_order_participants", {
  id: serial("id").primaryKey(),
  groupedOrderId: integer("grouped_order_id").notNull().references(() => groupedOrders.id, { onDelete: "cascade" }),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  groupedOrderMerchantIdx: index("grouped_order_merchant_idx").on(table.groupedOrderId, table.merchantId),
}));

export type GroupedOrderParticipant = typeof groupedOrderParticipants.$inferSelect;
export type InsertGroupedOrderParticipant = typeof groupedOrderParticipants.$inferInsert;

export const merchantSettings = pgTable("merchant_settings", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }).unique(),
  savingsProposalEnabled: boolean("savings_proposal_enabled").default(true).notNull(),
  savingsProposalThreshold: decimal("savings_proposal_threshold", { precision: 10, scale: 2 }).default("20000").notNull(),
  savingsProposalPercentage: decimal("savings_proposal_percentage", { precision: 5, scale: 2 }).default("2").notNull(),
  groupedOrderNotificationsEnabled: boolean("grouped_order_notifications_enabled").default(true).notNull(),
  morningBriefingEnabled: boolean("morning_briefing_enabled").default(true).notNull(),
  morningBriefingTime: varchar("morning_briefing_time", { length: 5 }).default("08:00"),
  reminderOpeningTime: varchar("reminder_opening_time", { length: 5 }).default("09:00"),
  reminderClosingTime: varchar("reminder_closing_time", { length: 5 }).default("20:00"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  merchantIdx: index("merchant_settings_merchant_idx").on(table.merchantId),
}));

export type MerchantSettings = typeof merchantSettings.$inferSelect;
export type InsertMerchantSettings = typeof merchantSettings.$inferInsert;

export { transactions, marketplaceOrders } from "./schema-payments";
export { merchantDailyLogins } from "./schema-daily-logins";
