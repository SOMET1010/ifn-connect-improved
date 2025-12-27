import { mysqlTable, int, varchar, boolean, timestamp, text, index } from "drizzle-orm/mysql-core";
import { users } from "./schema";

/**
 * Progression du mode "Première utilisation"
 * Suivi du parcours guidé pour les nouveaux utilisateurs
 */
export const firstTimeUserProgress = mysqlTable("first_time_user_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  currentStep: int("currentStep").default(1).notNull(), // Étape actuelle (1-5)
  totalSteps: int("totalSteps").default(5).notNull(), // Nombre total d'étapes
  completed: boolean("completed").default(false).notNull(), // Tour terminé
  skipped: boolean("skipped").default(false).notNull(), // Tour ignoré par l'utilisateur
  startedAt: timestamp("startedAt").defaultNow().notNull(), // Date de début
  completedAt: timestamp("completedAt"), // Date de fin
  lastStepCompletedAt: timestamp("lastStepCompletedAt"), // Dernière étape complétée
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  completedIdx: index("completed_idx").on(table.completed),
}));

export type FirstTimeUserProgress = typeof firstTimeUserProgress.$inferSelect;
export type InsertFirstTimeUserProgress = typeof firstTimeUserProgress.$inferInsert;
