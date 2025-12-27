import { mysqlTable, int, varchar, text, timestamp, boolean } from 'drizzle-orm/mysql-core';

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
});

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

/**
 * Langues supportées
 */
export const SUPPORTED_LANGUAGES = {
  FR: 'fr',
  DIOULA: 'dioula',
  BAULE: 'baule',
  BETE: 'bete',
  SENOUFO: 'senoufo',
  MALINKE: 'malinke',
} as const;

export type VoiceContext = typeof VOICE_CONTEXTS[keyof typeof VOICE_CONTEXTS];
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[keyof typeof SUPPORTED_LANGUAGES];
