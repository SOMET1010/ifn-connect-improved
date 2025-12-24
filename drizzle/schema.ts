import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, index } from "drizzle-orm/mysql-core";

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

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  merchantId: int("merchantId").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  cooperativeId: int("cooperativeId").references(() => cooperatives.id),
  productId: int("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "delivered", "cancelled"]).default("pending").notNull(),
  orderDate: timestamp("orderDate").defaultNow().notNull(),
  deliveryDate: timestamp("deliveryDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  merchantStatusIdx: index("merchant_status_idx").on(table.merchantId, table.status),
  cooperativeStatusIdx: index("cooperative_status_idx").on(table.cooperativeId, table.status),
}));

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

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
