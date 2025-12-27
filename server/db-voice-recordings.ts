import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import { voiceRecordings, type InsertVoiceRecording, type VoiceRecording } from "../drizzle/schema";

/**
 * Créer un nouvel enregistrement vocal
 */
export async function createVoiceRecording(data: InsertVoiceRecording): Promise<VoiceRecording> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [recording] = await db.insert(voiceRecordings).values(data).$returningId();
  const [created] = await db.select().from(voiceRecordings).where(eq(voiceRecordings.id, recording.id));
  return created;
}

/**
 * Récupérer un enregistrement vocal par contexte et langue
 */
export async function getVoiceRecording(
  contextKey: string,
  language: string
): Promise<VoiceRecording | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const [recording] = await db
    .select()
    .from(voiceRecordings)
    .where(
      and(
        eq(voiceRecordings.contextKey, contextKey),
        eq(voiceRecordings.language, language),
        eq(voiceRecordings.isActive, true)
      )
    )
    .limit(1);
  
  return recording;
}

/**
 * Récupérer tous les enregistrements vocaux (avec filtres optionnels)
 */
export async function listVoiceRecordings(filters?: {
  language?: string;
  contextKey?: string;
  isActive?: boolean;
}): Promise<VoiceRecording[]> {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(voiceRecordings);
  
  const conditions = [];
  if (filters?.language) {
    conditions.push(eq(voiceRecordings.language, filters.language));
  }
  if (filters?.contextKey) {
    conditions.push(eq(voiceRecordings.contextKey, filters.contextKey));
  }
  if (filters?.isActive !== undefined) {
    conditions.push(eq(voiceRecordings.isActive, filters.isActive));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return await query.orderBy(desc(voiceRecordings.createdAt));
}

/**
 * Mettre à jour un enregistrement vocal
 */
export async function updateVoiceRecording(
  id: number,
  data: Partial<InsertVoiceRecording>
): Promise<VoiceRecording | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  await db.update(voiceRecordings).set(data).where(eq(voiceRecordings.id, id));
  const [updated] = await db.select().from(voiceRecordings).where(eq(voiceRecordings.id, id));
  return updated;
}

/**
 * Supprimer un enregistrement vocal (soft delete)
 */
export async function deleteVoiceRecording(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(voiceRecordings).set({ isActive: false }).where(eq(voiceRecordings.id, id));
}

/**
 * Supprimer définitivement un enregistrement vocal
 */
export async function hardDeleteVoiceRecording(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(voiceRecordings).where(eq(voiceRecordings.id, id));
}

/**
 * Récupérer les statistiques des enregistrements vocaux
 */
export async function getVoiceRecordingsStats(): Promise<{
  total: number;
  byLanguage: Record<string, number>;
  byContext: Record<string, number>;
}> {
  const recordings = await listVoiceRecordings({ isActive: true });
  
  const byLanguage: Record<string, number> = {};
  const byContext: Record<string, number> = {};
  
  recordings.forEach((recording) => {
    byLanguage[recording.language] = (byLanguage[recording.language] || 0) + 1;
    byContext[recording.contextKey] = (byContext[recording.contextKey] || 0) + 1;
  });
  
  return {
    total: recordings.length,
    byLanguage,
    byContext,
  };
}
