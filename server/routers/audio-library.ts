import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { audioLibrary, AUDIO_CATEGORIES } from '../../drizzle/schema';
import { eq, inArray } from 'drizzle-orm';

/**
 * Router pour la bibliothèque audio multilingue
 * Permet d'accéder aux audios en Dioula pour l'interface 100% vocale
 */
export const audioLibraryRouter = router({
  /**
   * Récupérer un audio par sa clé
   */
  getByKey: publicProcedure
    .input(z.object({
      key: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const [audio] = await db
        .select()
        .from(audioLibrary)
        .where(eq(audioLibrary.key, input.key))
        .limit(1);
      
      return audio || null;
    }),

  /**
   * Récupérer plusieurs audios par leurs clés
   */
  getByKeys: publicProcedure
    .input(z.object({
      keys: z.array(z.string()),
    }))
    .query(async ({ input }) => {
      if (input.keys.length === 0) return [];
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const audios = await db
        .select()
        .from(audioLibrary)
        .where(inArray(audioLibrary.key, input.keys));
      
      return audios;
    }),

  /**
   * Récupérer tous les audios d'une catégorie
   */
  getByCategory: publicProcedure
    .input(z.object({
      category: z.enum([
        AUDIO_CATEGORIES.WELCOME,
        AUDIO_CATEGORIES.BUTTONS,
        AUDIO_CATEGORIES.ALERTS,
        AUDIO_CATEGORIES.INSTRUCTIONS,
        AUDIO_CATEGORIES.CONFIRMATIONS,
        AUDIO_CATEGORIES.ERRORS,
        AUDIO_CATEGORIES.SUCCESS,
        AUDIO_CATEGORIES.NAVIGATION,
      ]),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const audios = await db
        .select()
        .from(audioLibrary)
        .where(eq(audioLibrary.category, input.category));
      
      return audios;
    }),

  /**
   * Récupérer tous les audios
   */
  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const audios = await db
      .select()
      .from(audioLibrary);
    
    return audios;
  }),

  /**
   * Récupérer les statistiques de la bibliothèque
   */
  getStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const allAudios = await db
      .select()
      .from(audioLibrary);
    
    const totalAudios = allAudios.length;
    const totalDuration = allAudios.reduce((sum, audio) => sum + (audio.audioDuration || 0), 0);
    const withAudio = allAudios.filter(a => a.audioUrl).length;
    const withTranslation = allAudios.filter(a => a.textDioula).length;
    
    const byCategory = allAudios.reduce((acc, audio) => {
      acc[audio.category] = (acc[audio.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalAudios,
      totalDuration,
      withAudio,
      withTranslation,
      byCategory,
      completionRate: totalAudios > 0 ? Math.round((withAudio / totalAudios) * 100) : 0,
    };
  }),
});
