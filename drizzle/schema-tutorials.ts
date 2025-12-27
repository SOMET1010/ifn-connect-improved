import { mysqlTable, int, varchar, text, timestamp, boolean, index } from "drizzle-orm/mysql-core";
import { users } from "./schema";

/**
 * Tutoriels vidéo pour l'apprentissage des fonctionnalités
 * Vidéos courtes (30 secondes) avec des vendeuses réelles du marché
 */
export const videoTutorials = mysqlTable("video_tutorials", {
  id: int("id").autoincrement().primaryKey(),
  title: text("title").notNull(), // Titre en français
  titleDioula: text("titleDioula"), // Titre en Dioula
  description: text("description").notNull(), // Description en français
  descriptionDioula: text("descriptionDioula"), // Description en Dioula
  videoUrl: text("videoUrl").notNull(), // URL YouTube ou Vimeo
  thumbnailUrl: text("thumbnailUrl"), // URL de la miniature
  duration: int("duration").notNull(), // Durée en secondes
  category: varchar("category", { length: 50 }).notNull(), // caisse, stock, marche, protection_sociale, general
  order: int("order").default(0).notNull(), // Ordre d'affichage dans la catégorie
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  categoryIdx: index("category_idx").on(table.category),
  orderIdx: index("order_idx").on(table.order),
}));

export type VideoTutorial = typeof videoTutorials.$inferSelect;
export type InsertVideoTutorial = typeof videoTutorials.$inferInsert;

/**
 * Progression des utilisateurs dans les tutoriels
 */
export const userTutorialProgress = mysqlTable("user_tutorial_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  tutorialId: int("tutorialId").notNull().references(() => videoTutorials.id, { onDelete: "cascade" }),
  completed: boolean("completed").default(false).notNull(),
  watchedAt: timestamp("watchedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userTutorialIdx: index("user_tutorial_idx").on(table.userId, table.tutorialId),
  completedIdx: index("completed_idx").on(table.completed),
}));

export type UserTutorialProgress = typeof userTutorialProgress.$inferSelect;
export type InsertUserTutorialProgress = typeof userTutorialProgress.$inferInsert;
