import { pgTable, text, integer, boolean, uuid, jsonb, index, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./schema";

export const voiceRecordings = pgTable("voice_recordings", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminUserId: integer("admin_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  originalText: text("original_text"),
  audioUrl: text("audio_url").notNull(),
  durationSeconds: integer("duration_seconds"),
  fileSizeBytes: integer("file_size_bytes"),
  status: text("status").notNull().default("draft"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  adminUserIdx: index("idx_voice_recordings_admin_user").on(table.adminUserId),
  statusIdx: index("idx_voice_recordings_status").on(table.status),
}));

export const voiceTransformations = pgTable("voice_transformations", {
  id: uuid("id").primaryKey().defaultRandom(),
  recordingId: uuid("recording_id").notNull().references(() => voiceRecordings.id, { onDelete: "cascade" }),
  sourceVoiceId: text("source_voice_id"),
  targetVoiceId: text("target_voice_id").notNull(),
  transformationType: text("transformation_type").notNull().default("speech_to_speech"),
  outputAudioUrl: text("output_audio_url"),
  status: text("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  processingTimeMs: integer("processing_time_ms"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (table) => ({
  recordingIdx: index("idx_voice_transformations_recording").on(table.recordingId),
  statusIdx: index("idx_voice_transformations_status").on(table.status),
}));

export const voicePersonasCustom = pgTable("voice_personas_custom", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  elevenlabsVoiceId: text("elevenlabs_voice_id").notNull().unique(),
  sampleAudioUrl: text("sample_audio_url"),
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  activeIdx: index("idx_voice_personas_active").on(table.isActive),
}));

export type VoiceRecording = typeof voiceRecordings.$inferSelect;
export type NewVoiceRecording = typeof voiceRecordings.$inferInsert;
export type VoiceTransformation = typeof voiceTransformations.$inferSelect;
export type NewVoiceTransformation = typeof voiceTransformations.$inferInsert;
export type VoicePersonaCustom = typeof voicePersonasCustom.$inferSelect;
export type NewVoicePersonaCustom = typeof voicePersonasCustom.$inferInsert;

export const voiceRecordingsRelations = relations(voiceRecordings, ({ one, many }) => ({
  admin: one(users, {
    fields: [voiceRecordings.adminUserId],
    references: [users.id],
  }),
  transformations: many(voiceTransformations),
}));

export const voiceTransformationsRelations = relations(voiceTransformations, ({ one }) => ({
  recording: one(voiceRecordings, {
    fields: [voiceTransformations.recordingId],
    references: [voiceRecordings.id],
  }),
}));

export const voicePersonasCustomRelations = relations(voicePersonasCustom, ({ one }) => ({
  creator: one(users, {
    fields: [voicePersonasCustom.createdBy],
    references: [users.id],
  }),
}));
