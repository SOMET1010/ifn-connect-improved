import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, index, uniqueIndex, date, json } from "drizzle-orm/mysql-core";

/**
 * Schéma de base de données pour IFN Connect
 * Plateforme d'inclusion financière numérique pour la Côte d'Ivoire
 */

// ============================================================================
// USERS & AUTHENTICATION
// ============================================================================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "merchant", "agent", "cooperative"]).default("merchant").notNull(),
  language: mysqlEnum("language", ["fr", "dioula"]).default("fr").notNull(),
  pinCode: varchar("pinCode", { length: 255 }), // Hashed PIN for sensitive operations
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  phoneIdx: index("phone_idx").on(table.phone),
  roleIdx: index("role_idx").on(table.role),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// MERCHANTS
// ============================================================================

export const merchants = mysqlTable("merchants", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  merchantNumber: varchar("merchantNumber", { length: 50 }).notNull().unique(), // Unique merchant ID
  businessName: text("businessName").notNull(),
  businessType: varchar("businessType", { length: 100 }),
  location: text("location"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  cnpsNumber: varchar("cnpsNumber", { length: 50 }), // Social security number
  cmuNumber: varchar("cmuNumber", { length: 50 }), // Health insurance number
  cnpsStatus: mysqlEnum("cnpsStatus", ["active", "inactive", "pending"]).default("pending"),
  cmuStatus: mysqlEnum("cmuStatus", ["active", "inactive", "pending"]).default("pending"),
  cnpsExpiryDate: timestamp("cnpsExpiryDate"), // CNPS expiry date
  cmuExpiryDate: timestamp("cmuExpiryDate"), // CMU expiry date
  enrolledBy: int("enrolledBy").references(() => agents.id), // Agent who enrolled this merchant
  enrolledAt: timestamp("enrolledAt"),
  isVerified: boolean("isVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  merchantNumberIdx: index("merchant_number_idx").on(table.merchantNumber),
  locationIdx: index("location_idx").on(table.latitude, table.longitude),
  enrolledByIdx: index("enrolled_by_idx").on(table.enrolledBy),
}));

export type Merchant = typeof merchants.$inferSelect;
export type InsertMerchant = typeof merchants.$inferInsert;

// ============================================================================
// MERCHANT DAILY SESSIONS (Ouverture/Fermeture de journée)
// ============================================================================

export const merchantDailySessions = mysqlTable("merchant_daily_sessions", {
  id: int("id").autoincrement().primaryKey(),
  merchantId: int("merchantId").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  sessionDate: date("sessionDate").notNull(), // Date de la session (YYYY-MM-DD)
  openedAt: timestamp("openedAt"), // Timestamp d'ouverture (NULL si pas encore ouverte)
  closedAt: timestamp("closedAt"), // Timestamp de fermeture (NULL si pas encore fermée)
  openingNotes: text("openingNotes"), // Notes/objectifs saisis à l'ouverture
  closingNotes: text("closingNotes"), // Réflexions/notes saisies à la fermeture
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  uniqueMerchantDate: uniqueIndex("unique_merchant_date").on(table.merchantId, table.sessionDate),
  merchantDateIdx: index("merchant_date_idx").on(table.merchantId, table.sessionDate),
  openedAtIdx: index("opened_at_idx").on(table.openedAt),
  closedAtIdx: index("closed_at_idx").on(table.closedAt),
}));

export type MerchantDailySession = typeof merchantDailySessions.$inferSelect;
export type InsertMerchantDailySession = typeof merchantDailySessions.$inferInsert;

// ============================================================================
// AGENTS
// ============================================================================

export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  agentNumber: varchar("agentNumber", { length: 50 }).notNull().unique(),
  zone: text("zone"), // Geographic zone assigned to agent
  totalEnrollments: int("totalEnrollments").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  agentNumberIdx: index("agent_number_idx").on(table.agentNumber),
}));

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

// ============================================================================
// COOPERATIVES
// ============================================================================

export const cooperatives = mysqlTable("cooperatives", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  cooperativeName: text("cooperativeName").notNull(),
  cooperativeNumber: varchar("cooperativeNumber", { length: 50 }).notNull().unique(),
  location: text("location"),
  totalMembers: int("totalMembers").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  cooperativeNumberIdx: index("cooperative_number_idx").on(table.cooperativeNumber),
}));

export type Cooperative = typeof cooperatives.$inferSelect;
export type InsertCooperative = typeof cooperatives.$inferInsert;

// ============================================================================
// PRODUCTS
// ============================================================================

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  nameDioula: text("nameDioula"), // Product name in Dioula
  category: varchar("category", { length: 100 }),
  unit: varchar("unit", { length: 50 }).notNull(), // kg, tas, sac, etc.
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }),
  imageUrl: text("imageUrl"),
  pictogramUrl: text("pictogramUrl"), // Pictogram for accessibility
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  categoryIdx: index("category_idx").on(table.category),
}));

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ============================================================================
// MERCHANT STOCK
// ============================================================================

export const merchantStock = mysqlTable("merchant_stock", {
  id: int("id").autoincrement().primaryKey(),
  merchantId: int("merchantId").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  productId: int("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  minThreshold: decimal("minThreshold", { precision: 10, scale: 2 }).default("5"), // Alert threshold
  lastRestocked: timestamp("lastRestocked"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  merchantProductIdx: index("merchant_product_idx").on(table.merchantId, table.productId),
}));

export type MerchantStock = typeof merchantStock.$inferSelect;
export type InsertMerchantStock = typeof merchantStock.$inferInsert;

// ============================================================================
// SALES
// ============================================================================

export const sales = mysqlTable("sales", {
  id: int("id").autoincrement().primaryKey(),
  merchantId: int("merchantId").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  productId: int("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "mobile_money", "credit"]).default("cash").notNull(),
  paymentProvider: varchar("paymentProvider", { length: 50 }), // InTouch, Orange Money, MTN
  transactionId: varchar("transactionId", { length: 100 }),
  isVoiceRecorded: boolean("isVoiceRecorded").default(false), // Was this sale recorded via voice?
  isSynced: boolean("isSynced").default(false).notNull(), // Offline sync status
  saleDate: timestamp("saleDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  merchantDateIdx: index("merchant_date_idx").on(table.merchantId, table.saleDate),
  syncIdx: index("sync_idx").on(table.isSynced),
}));

export type Sale = typeof sales.$inferSelect;
export type InsertSale = typeof sales.$inferInsert;

// ============================================================================
// COOPERATIVE STOCK
// ============================================================================

export const cooperativeStock = mysqlTable("cooperative_stock", {
  id: int("id").autoincrement().primaryKey(),
  cooperativeId: int("cooperativeId").notNull().references(() => cooperatives.id, { onDelete: "cascade" }),
  productId: int("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  minThreshold: decimal("minThreshold", { precision: 10, scale: 2 }).default("50"),
  lastRestocked: timestamp("lastRestocked"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  cooperativeProductIdx: index("cooperative_product_idx").on(table.cooperativeId, table.productId),
}));

export type CooperativeStock = typeof cooperativeStock.$inferSelect;
export type InsertCooperativeStock = typeof cooperativeStock.$inferInsert;

// ============================================================================
// ORDERS (Merchant orders from Cooperative)
// ============================================================================

export const virtualMarketOrders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  merchantId: int("merchantId").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  cooperativeId: int("cooperativeId").references(() => cooperatives.id),
  productId: int("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "preparing", "in_transit", "delivered", "cancelled"]).default("pending").notNull(),
  orderDate: timestamp("orderDate").defaultNow().notNull(),
  deliveryDate: timestamp("deliveryDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  merchantStatusIdx: index("merchant_status_idx").on(table.merchantId, table.status),
  cooperativeStatusIdx: index("cooperative_status_idx").on(table.cooperativeId, table.status),
}));

export type VirtualMarketOrder = typeof virtualMarketOrders.$inferSelect;
export type InsertVirtualMarketOrder = typeof virtualMarketOrders.$inferInsert;

// ============================================================================
// ENROLLMENT DOCUMENTS
// ============================================================================

export const enrollmentDocuments = mysqlTable("enrollment_documents", {
  id: int("id").autoincrement().primaryKey(),
  merchantId: int("merchantId").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  documentType: varchar("documentType", { length: 100 }).notNull(), // ID card, business license, etc.
  documentUrl: text("documentUrl").notNull(),
  uploadedBy: int("uploadedBy").notNull().references(() => agents.id),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
}, (table) => ({
  merchantIdx: index("merchant_idx").on(table.merchantId),
}));

export type EnrollmentDocument = typeof enrollmentDocuments.$inferSelect;
export type InsertEnrollmentDocument = typeof enrollmentDocuments.$inferInsert;

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["sms", "email", "push"]).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // otp, stock_alert, payment_confirmation, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userStatusIdx: index("user_status_idx").on(table.userId, table.status),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ============================================================================
// VOICE COMMANDS LOG
// ============================================================================

export const voiceCommands = mysqlTable("voice_commands", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  language: mysqlEnum("language", ["fr", "dioula"]).notNull(),
  command: text("command").notNull(), // Original voice command
  transcription: text("transcription").notNull(), // Transcribed text
  action: varchar("action", { length: 100 }), // sell, check_stock, etc.
  isSuccessful: boolean("isSuccessful").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
}));

export type VoiceCommand = typeof voiceCommands.$inferSelect;
export type InsertVoiceCommand = typeof voiceCommands.$inferInsert;

// ============================================================================
// BADGES & GAMIFICATION
// ============================================================================

/**
 * Table des badges disponibles
 */
export const badges = mysqlTable("badges", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  color: varchar("color", { length: 50 }).notNull(),
  requirement: text("requirement").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  points: int("points").notNull().default(10),
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
  isNew: boolean("isNew").default(true).notNull(),
}, (table) => ({
  merchantIdIdx: index("merchant_id_idx").on(table.merchantId),
  badgeIdIdx: index("badge_id_idx").on(table.badgeId),
}));

export type MerchantBadge = typeof merchantBadges.$inferSelect;
export type InsertMerchantBadge = typeof merchantBadges.$inferInsert;

// ============================================================================
// AUDIT LOGS
// ============================================================================

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 100 }).notNull(), // merchants, sales, orders, etc.
  entityId: int("entityId"),
  details: text("details"), // JSON string with additional details
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userActionIdx: index("user_action_idx").on(table.userId, table.action),
  entityIdx: index("entity_idx").on(table.entity, table.entityId),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ============================================================================
// SYSTEM SETTINGS
// ============================================================================

export const systemSettings = mysqlTable("system_settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedBy: int("updatedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;


// ============================================================================
// MARKETS & COOPERATIVES (DONNÉES D'ENRÔLEMENT)
// ============================================================================

/**
 * Marchés et Coopératives
 * Données importées depuis markets.csv
 */
export const markets = mysqlTable("markets", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  sourceFile: text("sourceFile"),
  declaredEffectif: int("declaredEffectif"),
  declaredCmu: int("declaredCmu"),
  declaredCnps: int("declaredCnps"),
  declaredRsti: int("declaredRsti"),
  rowsInFile: int("rowsInFile"),
  uniqueIdentifierCodes: int("uniqueIdentifierCodes"),
  // Géolocalisation
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  address: text("address"),
  isGeolocated: boolean("isGeolocated").default(false).notNull(),
  geolocatedAt: timestamp("geolocatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  nameIdx: index("market_name_idx").on(table.name),
}));

export type Market = typeof markets.$inferSelect;
export type InsertMarket = typeof markets.$inferInsert;

/**
 * Acteurs/Bénéficiaires enrôlés
 * Données importées depuis actors.csv
 */
export const actors = mysqlTable("actors", {
  id: int("id").autoincrement().primaryKey(),
  actorKey: varchar("actorKey", { length: 50 }).notNull().unique(), // ex: PACA-001
  marketId: int("marketId").references(() => markets.id, { onDelete: "set null" }),
  marketName: varchar("marketName", { length: 255 }).notNull(),
  rowNo: int("rowNo"),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  identifierCode: varchar("identifierCode", { length: 50 }), // Code carte
  phone: varchar("phone", { length: 20 }),
  sourceFile: text("sourceFile"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  actorKeyIdx: index("actor_key_idx").on(table.actorKey),
  marketNameIdx: index("actor_market_name_idx").on(table.marketName),
  identifierIdx: index("actor_identifier_idx").on(table.identifierCode),
  phoneIdx: index("actor_phone_idx").on(table.phone),
}));

export type Actor = typeof actors.$inferSelect;
export type InsertActor = typeof actors.$inferInsert;

// ============================================================================
// SCORE SUTA - PRÉ-SCORING CRÉDIT
// ============================================================================

/**
 * Scores des marchands pour l'inclusion financière
 * Calculé basé sur : régularité, volume, épargne, utilisation, ancienneté
 */
export const merchantScores = mysqlTable("merchant_scores", {
  id: int("id").autoincrement().primaryKey(),
  merchantId: int("merchantId").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  
  // Score global (0-100)
  totalScore: int("totalScore").notNull().default(0),
  
  // Détail des composantes du score
  regularityScore: int("regularityScore").notNull().default(0), // 30%
  volumeScore: int("volumeScore").notNull().default(0), // 20%
  savingsScore: int("savingsScore").notNull().default(0), // 20%
  usageScore: int("usageScore").notNull().default(0), // 15%
  seniorityScore: int("seniorityScore").notNull().default(0), // 15%
  
  // Métriques utilisées pour le calcul
  consecutiveSalesDays: int("consecutiveSalesDays").notNull().default(0),
  totalSalesAmount: decimal("totalSalesAmount", { precision: 15, scale: 2 }).notNull().default("0"),
  totalSavingsAmount: decimal("totalSavingsAmount", { precision: 15, scale: 2 }).notNull().default("0"),
  appUsageDays: int("appUsageDays").notNull().default(0),
  accountAgeDays: int("accountAgeDays").notNull().default(0),
  
  // Éligibilité crédit
  isEligibleForCredit: boolean("isEligibleForCredit").notNull().default(false),
  maxCreditAmount: decimal("maxCreditAmount", { precision: 15, scale: 2 }).notNull().default("0"),
  creditTier: mysqlEnum("creditTier", ["none", "bronze", "silver", "gold", "platinum"]).default("none").notNull(),
  
  // Historique
  lastCalculatedAt: timestamp("lastCalculatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  merchantIdx: index("merchant_score_idx").on(table.merchantId),
  scoreIdx: index("total_score_idx").on(table.totalScore),
  eligibilityIdx: index("credit_eligibility_idx").on(table.isEligibleForCredit),
}));

export type MerchantScore = typeof merchantScores.$inferSelect;
export type InsertMerchantScore = typeof merchantScores.$inferInsert;

/**
 * Historique des scores pour suivre la progression
 */
export const scoreHistory = mysqlTable("score_history", {
  id: int("id").autoincrement().primaryKey(),
  merchantId: int("merchantId").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  totalScore: int("totalScore").notNull(),
  creditTier: mysqlEnum("creditTier", ["none", "bronze", "silver", "gold", "platinum"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  merchantIdx: index("score_history_merchant_idx").on(table.merchantId),
  dateIdx: index("score_history_date_idx").on(table.createdAt),
}));

export type ScoreHistory = typeof scoreHistory.$inferSelect;
export type InsertScoreHistory = typeof scoreHistory.$inferInsert;

/**
 * Objectifs d'épargne (Tontine Digitale)
 */
export const savingsGoals = mysqlTable("savings_goals", {
  id: int("id").autoincrement().primaryKey(),
  merchantId: int("merchantId").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(), // "Tabaski", "Rentrée", "Stock"
  targetAmount: decimal("targetAmount", { precision: 15, scale: 2 }).notNull(),
  currentAmount: decimal("currentAmount", { precision: 15, scale: 2 }).notNull().default("0"),
  deadline: date("deadline"),
  isCompleted: boolean("isCompleted").notNull().default(false),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  merchantIdx: index("savings_merchant_idx").on(table.merchantId),
  statusIdx: index("savings_status_idx").on(table.isCompleted),
}));

export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type InsertSavingsGoal = typeof savingsGoals.$inferInsert;

/**
 * Transactions d'épargne
 */
export const savingsTransactions = mysqlTable("savings_transactions", {
  id: int("id").autoincrement().primaryKey(),
  savingsGoalId: int("savingsGoalId").notNull().references(() => savingsGoals.id, { onDelete: "cascade" }),
  merchantId: int("merchantId").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  type: mysqlEnum("type", ["deposit", "withdrawal"]).notNull(),
  source: varchar("source", { length: 50 }), // "manual", "auto_after_sale", "mobile_money"
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  goalIdx: index("savings_tx_goal_idx").on(table.savingsGoalId),
  merchantIdx: index("savings_tx_merchant_idx").on(table.merchantId),
  dateIdx: index("savings_tx_date_idx").on(table.createdAt),
}));

export type SavingsTransaction = typeof savingsTransactions.$inferSelect;
export type InsertSavingsTransaction = typeof savingsTransactions.$inferInsert;

/**
 * Événements locaux (Ramadan, Tabaski, Noël, Rentrée)
 */
export const localEvents = mysqlTable("local_events", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // "Ramadan", "Tabaski"
  type: mysqlEnum("type", ["religious", "national", "cultural", "commercial"]).notNull(),
  date: date("date").notNull(),
  endDate: date("endDate"), // Pour Ramadan (30 jours)
  description: text("description"),
  isRecurring: boolean("isRecurring").notNull().default(false), // Répété chaque année
  iconEmoji: varchar("iconEmoji", { length: 10 }), // "🌙", "🐑", "🎄"
  color: varchar("color", { length: 20 }), // "green", "purple", "red"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  dateIdx: index("events_date_idx").on(table.date),
  typeIdx: index("events_type_idx").on(table.type),
}));

export type LocalEvent = typeof localEvents.$inferSelect;
export type InsertLocalEvent = typeof localEvents.$inferInsert;

/**
 * Recommandations de stock par événement
 */
export const eventStockRecommendations = mysqlTable("event_stock_recommendations", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull().references(() => localEvents.id, { onDelete: "cascade" }),
  productName: varchar("productName", { length: 100 }).notNull(), // "Sucre", "Riz", "Mouton"
  category: varchar("category", { length: 50 }), // "Alimentaire", "Scolaire"
  priority: mysqlEnum("priority", ["high", "medium", "low"]).notNull().default("medium"),
  estimatedDemandIncrease: int("estimatedDemandIncrease"), // Pourcentage d'augmentation (ex: 150%)
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  eventIdx: index("stock_rec_event_idx").on(table.eventId),
  priorityIdx: index("stock_rec_priority_idx").on(table.priority),
}));

export type EventStockRecommendation = typeof eventStockRecommendations.$inferSelect;
export type InsertEventStockRecommendation = typeof eventStockRecommendations.$inferInsert;

/**
 * Alertes événements pour les marchands
 */
export const eventAlerts = mysqlTable("event_alerts", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull().references(() => localEvents.id, { onDelete: "cascade" }),
  merchantId: int("merchantId").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  alertType: mysqlEnum("alertType", ["7_days", "3_days", "1_day", "today"]).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").notNull().default(false),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  eventIdx: index("alerts_event_idx").on(table.eventId),
  merchantIdx: index("alerts_merchant_idx").on(table.merchantId),
  readIdx: index("alerts_read_idx").on(table.isRead),
}));

export type EventAlert = typeof eventAlerts.$inferSelect;
export type InsertEventAlert = typeof eventAlerts.$inferInsert;

// ============================================================================
// MERCHANT ACTIVITY (Activité commerciale)
// ============================================================================

export const merchantActivity = mysqlTable("merchant_activity", {
  id: int("id").autoincrement().primaryKey(),
  merchantId: int("merchantId").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  actorType: mysqlEnum("actorType", ["grossiste", "semi-grossiste", "detaillant"]),
  products: text("products"), // JSON array of products: ["riz", "igname", "mais"]
  numberOfStores: int("numberOfStores").default(0),
  tableNumber: varchar("tableNumber", { length: 20 }),
  boxNumber: varchar("boxNumber", { length: 20 }),
  sector: varchar("sector", { length: 100 }), // Secteur commercial
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  merchantIdx: index("merchant_activity_merchant_idx").on(table.merchantId),
}));

export type MerchantActivity = typeof merchantActivity.$inferSelect;
export type InsertMerchantActivity = typeof merchantActivity.$inferInsert;

// ============================================================================
// MERCHANT SOCIAL PROTECTION (Protection sociale détaillée)
// ============================================================================

export const merchantSocialProtection = mysqlTable("merchant_social_protection", {
  id: int("id").autoincrement().primaryKey(),
  merchantId: int("merchantId").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  
  // CMU (Couverture Maladie Universelle)
  hasCMU: boolean("hasCMU").default(false).notNull(),
  cmuNumber: varchar("cmuNumber", { length: 50 }),
  cmuStatus: mysqlEnum("cmuStatus", ["active", "inactive", "pending", "expired"]).default("pending"),
  cmuStartDate: timestamp("cmuStartDate"),
  cmuExpiryDate: timestamp("cmuExpiryDate"),
  
  // CNPS (Caisse Nationale de Prévoyance Sociale)
  hasCNPS: boolean("hasCNPS").default(false).notNull(),
  cnpsNumber: varchar("cnpsNumber", { length: 50 }),
  cnpsStatus: mysqlEnum("cnpsStatus", ["active", "inactive", "pending", "expired"]).default("pending"),
  cnpsStartDate: timestamp("cnpsStartDate"),
  cnpsExpiryDate: timestamp("cnpsExpiryDate"),
  
  // RSTI (Régime Social des Travailleurs Indépendants)
  hasRSTI: boolean("hasRSTI").default(false).notNull(),
  rstiNumber: varchar("rstiNumber", { length: 50 }),
  rstiStatus: mysqlEnum("rstiStatus", ["active", "inactive", "pending", "expired"]).default("pending"),
  rstiStartDate: timestamp("rstiStartDate"),
  rstiExpiryDate: timestamp("rstiExpiryDate"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  merchantIdx: index("merchant_social_protection_merchant_idx").on(table.merchantId),
  cmuStatusIdx: index("merchant_social_protection_cmu_status_idx").on(table.cmuStatus),
  cnpsStatusIdx: index("merchant_social_protection_cnps_status_idx").on(table.cnpsStatus),
}));

export type MerchantSocialProtection = typeof merchantSocialProtection.$inferSelect;
export type InsertMerchantSocialProtection = typeof merchantSocialProtection.$inferInsert;

// ============================================================================
// MERCHANT EDIT HISTORY (Historique des modifications)
// ============================================================================

export const merchantEditHistory = mysqlTable("merchant_edit_history", {
  id: int("id").autoincrement().primaryKey(),
  merchantId: int("merchantId").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  editedBy: int("editedBy").notNull().references(() => users.id),
  fieldName: varchar("fieldName", { length: 100 }).notNull(), // Nom du champ modifié
  oldValue: text("oldValue"), // Ancienne valeur (JSON si complexe)
  newValue: text("newValue"), // Nouvelle valeur (JSON si complexe)
  action: mysqlEnum("action", ["create", "update", "delete", "verify", "bulk_update"]).notNull(),
  comment: text("comment"), // Commentaire optionnel
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  merchantIdx: index("merchant_edit_history_merchant_idx").on(table.merchantId),
  editedByIdx: index("merchant_edit_history_edited_by_idx").on(table.editedBy),
  createdAtIdx: index("merchant_edit_history_created_at_idx").on(table.createdAt),
}));

export type MerchantEditHistory = typeof merchantEditHistory.$inferSelect;
export type InsertMerchantEditHistory = typeof merchantEditHistory.$inferInsert;

// ============================================================================
// SOCIAL PROTECTION RENEWALS (Demandes de renouvellement CNPS/CMU)
// ============================================================================

export const socialProtectionRenewals = mysqlTable("social_protection_renewals", {
  id: int("id").autoincrement().primaryKey(),
  merchantId: int("merchantId").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["cnps", "cmu", "rsti"]).notNull(), // Type de couverture à renouveler
  currentExpiryDate: timestamp("currentExpiryDate"), // Date d'expiration actuelle
  requestedExpiryDate: timestamp("requestedExpiryDate").notNull(), // Nouvelle date d'expiration demandée
  status: mysqlEnum("status", ["pending", "approved", "rejected", "cancelled"]).default("pending").notNull(),
  proofDocumentUrl: text("proofDocumentUrl"), // URL du justificatif (S3)
  proofDocumentKey: varchar("proofDocumentKey", { length: 255 }), // Clé S3 du justificatif
  merchantNotes: text("merchantNotes"), // Notes du marchand (raison de la demande)
  adminNotes: text("adminNotes"), // Notes de l'admin (raison approbation/rejet)
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"), // Date de traitement de la demande
  reviewedBy: int("reviewedBy").references(() => users.id), // Admin qui a traité la demande
  approvedAt: timestamp("approvedAt"), // Date d'approbation
  rejectedAt: timestamp("rejectedAt"), // Date de rejet
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
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

export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(), // gestion_stock, paiements_mobiles, protection_sociale, marketing
  duration: int("duration").notNull(), // Durée en minutes
  videoUrl: text("videoUrl"), // URL de la vidéo (YouTube, Vimeo, ou S3)
  thumbnailUrl: text("thumbnailUrl"), // URL de l'image de couverture
  level: varchar("level", { length: 50 }).notNull().default("beginner"), // beginner, intermediate, advanced
  isPublished: boolean("isPublished").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  categoryIdx: index("courses_category_idx").on(table.category),
  levelIdx: index("courses_level_idx").on(table.level),
  publishedIdx: index("courses_published_idx").on(table.isPublished),
}));

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

export const courseProgress = mysqlTable("course_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: int("courseId").notNull().references(() => courses.id, { onDelete: "cascade" }),
  progress: int("progress").notNull().default(0), // Pourcentage de progression (0-100)
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("course_progress_user_idx").on(table.userId),
  courseIdx: index("course_progress_course_idx").on(table.courseId),
  completedIdx: index("course_progress_completed_idx").on(table.completed),
  uniqueUserCourse: index("course_progress_unique_user_course").on(table.userId, table.courseId),
}));

export type CourseProgress = typeof courseProgress.$inferSelect;
export type InsertCourseProgress = typeof courseProgress.$inferInsert;

/**
 * Questions de quiz pour les cours
 */
export const quizzes = mysqlTable("quizzes", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull().references(() => courses.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  optionA: varchar("optionA", { length: 255 }).notNull(),
  optionB: varchar("optionB", { length: 255 }).notNull(),
  optionC: varchar("optionC", { length: 255 }).notNull(),
  optionD: varchar("optionD", { length: 255 }),
  correctAnswer: mysqlEnum("correctAnswer", ["A", "B", "C", "D"]).notNull(),
  explanation: text("explanation"), // Explication de la bonne réponse
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  courseIdx: index("quizzes_course_idx").on(table.courseId),
}));

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = typeof quizzes.$inferInsert;

/**
 * Tentatives de quiz par les utilisateurs
 */
export const quizAttempts = mysqlTable("quiz_attempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: int("courseId").notNull().references(() => courses.id, { onDelete: "cascade" }),
  score: int("score").notNull(), // Pourcentage (0-100)
  totalQuestions: int("totalQuestions").notNull(),
  correctAnswers: int("correctAnswers").notNull(),
  passed: boolean("passed").notNull(), // true si score >= 70%
  answers: text("answers"), // JSON des réponses de l'utilisateur
  completedAt: timestamp("completedAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("quiz_attempts_user_idx").on(table.userId),
  courseIdx: index("quiz_attempts_course_idx").on(table.courseId),
  passedIdx: index("quiz_attempts_passed_idx").on(table.passed),
}));

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = typeof quizAttempts.$inferInsert;

// ============================================================================
// GAMIFICATION E-LEARNING
// ============================================================================

/**
 * Badges sociaux obtenus par les utilisateurs
 */
export const userAchievements = mysqlTable("user_achievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  badgeName: varchar("badgeName", { length: 100 }).notNull(), // "Expert Marketing", "Pro CNPS", "Maître Stock"
  badgeIcon: varchar("badgeIcon", { length: 10 }), // Emoji du badge: "🏆", "💼", "📦"
  courseId: int("courseId").references(() => courses.id, { onDelete: "set null" }), // Cours associé (optionnel)
  scoreObtained: int("scoreObtained").notNull(), // Score du quiz (0-100)
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_achievements_user_idx").on(table.userId),
  badgeIdx: index("user_achievements_badge_idx").on(table.badgeName),
}));

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;

/**
 * Défis entre marchands
 */
export const challenges = mysqlTable("challenges", {
  id: int("id").autoincrement().primaryKey(),
  challengerId: int("challengerId").notNull().references(() => users.id, { onDelete: "cascade" }), // Qui lance le défi
  challengedId: int("challengedId").notNull().references(() => users.id, { onDelete: "cascade" }), // Qui est défié
  courseId: int("courseId").notNull().references(() => courses.id, { onDelete: "cascade" }),
  challengerScore: int("challengerScore"), // Score du lanceur
  challengedScore: int("challengedScore"), // Score du défié
  status: mysqlEnum("status", ["pending", "accepted", "completed", "declined"]).default("pending").notNull(),
  winnerId: int("winnerId").references(() => users.id), // Gagnant du défi
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  challengerIdx: index("challenges_challenger_idx").on(table.challengerId),
  challengedIdx: index("challenges_challenged_idx").on(table.challengedId),
  statusIdx: index("challenges_status_idx").on(table.status),
}));

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = typeof challenges.$inferInsert;

/**
 * Classement hebdomadaire régional
 */
export const weeklyLeaderboard = mysqlTable("weekly_leaderboard", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  weekNumber: int("weekNumber").notNull(), // Numéro de la semaine (1-52)
  year: int("year").notNull(), // Année
  region: varchar("region", { length: 100 }), // "Abidjan Nord", "Cocody", "Yopougon"
  totalPoints: int("totalPoints").notNull().default(0), // Points cumulés
  quizzesCompleted: int("quizzesCompleted").notNull().default(0), // Nombre de quiz terminés
  averageScore: int("averageScore").notNull().default(0), // Score moyen (0-100)
  rank: int("rank"), // Classement dans la région (1, 2, 3...)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("weekly_leaderboard_user_idx").on(table.userId),
  weekIdx: index("weekly_leaderboard_week_idx").on(table.weekNumber, table.year),
  regionIdx: index("weekly_leaderboard_region_idx").on(table.region),
  rankIdx: index("weekly_leaderboard_rank_idx").on(table.rank),
}));

export type WeeklyLeaderboard = typeof weeklyLeaderboard.$inferSelect;
export type InsertWeeklyLeaderboard = typeof weeklyLeaderboard.$inferInsert;

// ============================================================================
// IN-APP NOTIFICATIONS
// ============================================================================

export const inAppNotifications = mysqlTable("in_app_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", [
    "quiz_passed",
    "badge_earned",
    "challenge_received",
    "challenge_won",
    "renewal_reminder",
    "stock_alert",
    "order_status",
    "group_order_created",
    "session_reminder",
    "system",
  ]).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  actionUrl: text("actionUrl"), // URL to navigate when clicked
  metadata: json("metadata"), // Additional data (e.g., badgeId, challengeId)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userReadIdx: index("user_read_idx").on(table.userId, table.isRead),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type InAppNotification = typeof inAppNotifications.$inferSelect;
export type InsertInAppNotification = typeof inAppNotifications.$inferInsert;

// ============================================================================
// COOPERATIVE MEMBERS
// ============================================================================

export const cooperativeMembers = mysqlTable("cooperative_members", {
  id: int("id").autoincrement().primaryKey(),
  cooperativeId: int("cooperativeId").notNull().references(() => cooperatives.id, { onDelete: "cascade" }),
  merchantId: int("merchantId").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  isActive: boolean("isActive").default(true).notNull(),
}, (table) => ({
  cooperativeMerchantIdx: index("cooperative_merchant_idx").on(table.cooperativeId, table.merchantId),
}));

export type CooperativeMember = typeof cooperativeMembers.$inferSelect;
export type InsertCooperativeMember = typeof cooperativeMembers.$inferInsert;

// ============================================================================
// GROUPED ORDERS (Commandes groupées des coopératives)
// ============================================================================

export const groupedOrders = mysqlTable("grouped_orders", {
  id: int("id").autoincrement().primaryKey(),
  cooperativeId: int("cooperativeId").notNull().references(() => cooperatives.id, { onDelete: "cascade" }),
  productName: varchar("productName", { length: 255 }).notNull(),
  totalQuantity: int("totalQuantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }),
  status: mysqlEnum("status", ["draft", "pending", "confirmed", "delivered", "cancelled"]).notNull().default("draft"),
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  confirmedAt: timestamp("confirmedAt"),
  deliveredAt: timestamp("deliveredAt"),
}, (table) => ({
  cooperativeStatusIdx: index("cooperative_status_idx").on(table.cooperativeId, table.status),
}));

export type GroupedOrder = typeof groupedOrders.$inferSelect;
export type InsertGroupedOrder = typeof groupedOrders.$inferInsert;

export const groupedOrderParticipants = mysqlTable("grouped_order_participants", {
  id: int("id").autoincrement().primaryKey(),
  groupedOrderId: int("groupedOrderId").notNull().references(() => groupedOrders.id, { onDelete: "cascade" }),
  merchantId: int("merchantId").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  quantity: int("quantity").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
}, (table) => ({
  groupedOrderMerchantIdx: index("grouped_order_merchant_idx").on(table.groupedOrderId, table.merchantId),
}));

export type GroupedOrderParticipant = typeof groupedOrderParticipants.$inferSelect;
export type InsertGroupedOrderParticipant = typeof groupedOrderParticipants.$inferInsert;

// ============================================================================
// MERCHANT SETTINGS (Paramètres personnalisables)
// ============================================================================

export const merchantSettings = mysqlTable("merchant_settings", {
  id: int("id").autoincrement().primaryKey(),
  merchantId: int("merchantId").notNull().references(() => merchants.id, { onDelete: "cascade" }).unique(),
  
  // Paramètres de proposition d'épargne automatique
  savingsProposalEnabled: boolean("savingsProposalEnabled").default(true).notNull(),
  savingsProposalThreshold: decimal("savingsProposalThreshold", { precision: 10, scale: 2 }).default("20000").notNull(), // Montant minimum de vente
  savingsProposalPercentage: decimal("savingsProposalPercentage", { precision: 5, scale: 2 }).default("2").notNull(), // Pourcentage suggéré
  
  // Paramètres de notifications
  groupedOrderNotificationsEnabled: boolean("groupedOrderNotificationsEnabled").default(true).notNull(),
  
  // Paramètres de briefing matinal
  morningBriefingEnabled: boolean("morningBriefingEnabled").default(true).notNull(),
  morningBriefingTime: varchar("morningBriefingTime", { length: 5 }).default("08:00"), // Format HH:MM
  
  // Paramètres de rappels d'ouverture/fermeture de journée
  reminderOpeningTime: varchar("reminderOpeningTime", { length: 5 }).default("09:00"), // Format HH:MM
  reminderClosingTime: varchar("reminderClosingTime", { length: 5 }).default("20:00"), // Format HH:MM
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  merchantIdx: index("merchant_settings_merchant_idx").on(table.merchantId),
}));

export type MerchantSettings = typeof merchantSettings.$inferSelect;
export type InsertMerchantSettings = typeof merchantSettings.$inferInsert;

// Export payments tables
export { transactions, marketplaceOrders } from "./schema-payments";

// Export daily logins table
export { merchantDailyLogins } from "./schema-daily-logins";
// Export tutorials tables
export { videoTutorials, userTutorialProgress } from "./schema-tutorials";
// Export first time user table
export { firstTimeUserProgress } from "./schema-first-time-user";

// ============================================================================
// VOICE RECORDINGS (Enregistrements Vocaux Natifs)
// ============================================================================

/**
 * Table pour stocker les enregistrements vocaux natifs
 * Permet de remplacer la synthèse vocale automatique par des traductions authentiques
 */
export const voiceRecordings = mysqlTable('voice_recordings', {
  id: int('id').primaryKey().autoincrement(),
  
  // Identification de l'enregistrement
  contextKey: varchar('context_key', { length: 100 }).notNull(), // Ex: "tour_step_1", "morning_briefing", "stock_alert"
  language: varchar('language', { length: 10 }).notNull(), // Ex: "fr", "dioula", "baule", "bete", "senoufo", "malinke"
  
  // Métadonnées de l'enregistrement
  title: varchar('title', { length: 255 }).notNull(), // Titre descriptif
  description: text('description'), // Description optionnelle
  
  // Fichier audio
  audioUrl: text('audio_url').notNull(), // URL S3 du fichier audio
  audioKey: varchar('audio_key', { length: 255 }).notNull(), // Clé S3 pour gestion
  duration: int('duration'), // Durée en secondes
  fileSize: int('file_size'), // Taille du fichier en octets
  mimeType: varchar('mime_type', { length: 50 }).default('audio/mpeg'), // Type MIME (audio/mpeg, audio/ogg, etc.)
  
  // Métadonnées du locuteur
  speakerName: varchar('speaker_name', { length: 255 }), // Nom du locuteur/traducteur
  speakerNotes: text('speaker_notes'), // Notes sur la prononciation, contexte, etc.
  
  // Gestion
  isActive: boolean('is_active').default(true).notNull(), // Actif ou désactivé
  uploadedBy: int('uploaded_by'), // ID de l'utilisateur qui a uploadé
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  contextLanguageIdx: index('context_language_idx').on(table.contextKey, table.language),
  languageIdx: index('language_idx').on(table.language),
  isActiveIdx: index('is_active_idx').on(table.isActive),
}));

export type VoiceRecording = typeof voiceRecordings.$inferSelect;
export type InsertVoiceRecording = typeof voiceRecordings.$inferInsert;

/**
 * Contextes d'utilisation prédéfinis
 */
export const VOICE_CONTEXTS = {
  // Tour guidé (5 étapes)
  TOUR_STEP_1: 'tour_step_1', // Ouvrir/Fermer ma journée
  TOUR_STEP_2: 'tour_step_2', // Enregistrer une vente
  TOUR_STEP_3: 'tour_step_3', // Utiliser les commandes vocales
  TOUR_STEP_4: 'tour_step_4', // Commander des produits
  TOUR_STEP_5: 'tour_step_5', // Vérifier ma protection sociale
  
  // Briefing matinal
  MORNING_BRIEFING_INTRO: 'morning_briefing_intro',
  MORNING_BRIEFING_SALES_UP: 'morning_briefing_sales_up',
  MORNING_BRIEFING_SALES_DOWN: 'morning_briefing_sales_down',
  MORNING_BRIEFING_SALES_STABLE: 'morning_briefing_sales_stable',
  
  // Bilan de journée
  DAILY_REPORT_INTRO: 'daily_report_intro',
  DAILY_REPORT_GOOD_DAY: 'daily_report_good_day',
  DAILY_REPORT_BAD_DAY: 'daily_report_bad_day',
  DAILY_REPORT_SCORE_ELIGIBLE: 'daily_report_score_eligible',
  DAILY_REPORT_SCORE_NOT_ELIGIBLE: 'daily_report_score_not_eligible',
  
  // Alertes de stock
  STOCK_ALERT_LOW: 'stock_alert_low',
  STOCK_ALERT_CRITICAL: 'stock_alert_critical',
  STOCK_ALERT_OUT: 'stock_alert_out',
  
  // Alertes de protection sociale
  CNPS_EXPIRING_SOON: 'cnps_expiring_soon',
  CMU_EXPIRING_SOON: 'cmu_expiring_soon',
  RSTI_EXPIRING_SOON: 'rsti_expiring_soon',
  
  // Confirmations
  SALE_RECORDED: 'sale_recorded',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  
  // Messages génériques
  WELCOME: 'welcome',
  GOODBYE: 'goodbye',
  ERROR: 'error',
  SUCCESS: 'success',
} as const;

export type VoiceContext = typeof VOICE_CONTEXTS[keyof typeof VOICE_CONTEXTS];


// ============================================================================
// AUDIO LIBRARY - Bibliothèque d'audios en Dioula pour interface 100% vocale
// ============================================================================

export const audioLibrary = mysqlTable('audio_library', {
  id: int('id').primaryKey().autoincrement(),
  
  // Identification
  key: varchar('key', { length: 255 }).notNull().unique(),
  category: varchar('category', { length: 100 }).notNull(), // welcome, buttons, alerts, instructions, confirmations
  
  // Textes
  textFr: text('text_fr').notNull(),
  textDioula: text('text_dioula'),
  
  // Audio
  audioUrl: varchar('audio_url', { length: 500 }), // URL S3 du fichier audio
  audioDuration: int('audio_duration'), // Durée en secondes
  
  // Métadonnées
  context: text('context'), // Contexte d'utilisation pour aider la génération
  priority: int('priority').default(0), // Priorité de lecture (0 = normal, 1 = important, 2 = critique)
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  keyIdx: index('key_idx').on(table.key),
  categoryIdx: index('category_idx').on(table.category),
}));

export type AudioLibrary = typeof audioLibrary.$inferSelect;
export type InsertAudioLibrary = typeof audioLibrary.$inferInsert;

/**
 * Catégories d'audios
 */
export const AUDIO_CATEGORIES = {
  WELCOME: 'welcome',           // Messages de bienvenue
  BUTTONS: 'buttons',           // Labels de boutons
  ALERTS: 'alerts',             // Alertes et avertissements
  INSTRUCTIONS: 'instructions', // Instructions d'utilisation
  CONFIRMATIONS: 'confirmations', // Messages de confirmation
  ERRORS: 'errors',             // Messages d'erreur
  SUCCESS: 'success',           // Messages de succès
  NAVIGATION: 'navigation',     // Aide à la navigation
} as const;

export type AudioCategory = typeof AUDIO_CATEGORIES[keyof typeof AUDIO_CATEGORIES];
