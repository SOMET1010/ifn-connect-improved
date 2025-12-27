import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { mysqlTable, int, boolean, decimal, varchar, timestamp, index } from "drizzle-orm/mysql-core";
import { merchants } from "../drizzle/schema";

// Redéfinir la table ici pour éviter les problèmes d'import
export const merchantSettings = mysqlTable("merchant_settings", {
  id: int("id").autoincrement().primaryKey(),
  merchantId: int("merchantId").notNull().references(() => merchants.id, { onDelete: "cascade" }).unique(),
  
  // Paramètres de proposition d'épargne automatique
  savingsProposalEnabled: boolean("savingsProposalEnabled").default(true).notNull(),
  savingsProposalThreshold: decimal("savingsProposalThreshold", { precision: 10, scale: 2 }).default("20000").notNull(),
  savingsProposalPercentage: decimal("savingsProposalPercentage", { precision: 5, scale: 2 }).default("2").notNull(),
  
  // Paramètres de notifications
  groupedOrderNotificationsEnabled: boolean("groupedOrderNotificationsEnabled").default(true).notNull(),
  
  // Paramètres de briefing matinal
  morningBriefingEnabled: boolean("morningBriefingEnabled").default(true).notNull(),
  morningBriefingTime: varchar("morningBriefingTime", { length: 5 }).default("08:00"),
  
  // Paramètres de rappels d'ouverture/fermeture de journée
  reminderOpeningTime: varchar("reminderOpeningTime", { length: 5 }).default("09:00"),
  reminderClosingTime: varchar("reminderClosingTime", { length: 5 }).default("20:00"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  merchantIdx: index("merchant_settings_merchant_idx").on(table.merchantId),
}));

type MerchantSettings = typeof merchantSettings.$inferSelect;

/**
 * Récupérer les paramètres d'un marchand (ou créer avec valeurs par défaut)
 */
export async function getMerchantSettings(merchantId: number): Promise<MerchantSettings> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const [settings] = await db
    .select()
    .from(merchantSettings)
    .where(eq(merchantSettings.merchantId, merchantId))
    .limit(1);

  // Si pas de settings, créer avec valeurs par défaut
  if (!settings) {
    return createDefaultSettings(merchantId);
  }

  return settings;
}

/**
 * Créer les paramètres par défaut pour un marchand
 */
export async function createDefaultSettings(merchantId: number): Promise<MerchantSettings> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const [newSettings] = await db
    .insert(merchantSettings)
    .values({
      merchantId,
      savingsProposalEnabled: true,
      savingsProposalThreshold: "20000",
      savingsProposalPercentage: "2",
      groupedOrderNotificationsEnabled: true,
      morningBriefingEnabled: true,
      morningBriefingTime: "08:00",
      reminderOpeningTime: "09:00",
      reminderClosingTime: "20:00",
    })
    .$returningId();

  return getMerchantSettings(merchantId);
}

/**
 * Mettre à jour les paramètres d'un marchand
 */
export async function updateMerchantSettings(
  merchantId: number,
  updates: Partial<{
    savingsProposalEnabled: boolean;
    savingsProposalThreshold: string;
    savingsProposalPercentage: string;
    groupedOrderNotificationsEnabled: boolean;
    morningBriefingEnabled: boolean;
    morningBriefingTime: string;
    reminderOpeningTime: string;
    reminderClosingTime: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db
    .update(merchantSettings)
    .set(updates)
    .where(eq(merchantSettings.merchantId, merchantId));

  return getMerchantSettings(merchantId);
}
