import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { translateText, translateLongText } from "../lafricamobile-translation";
import { synthesizeText, translateAndSynthesize, TTSOptions } from "../lafricamobile-tts";
import { hasCredentials } from "../lafricamobile-auth";

/**
 * Router tRPC pour les services Lafricamobile
 * Traduction et synthèse vocale en langues africaines
 */
export const lafricamobileRouter = router({
  /**
   * Vérifier si les credentials Lafricamobile sont configurés
   */
  hasCredentials: publicProcedure.query(() => {
    return hasCredentials();
  }),

  /**
   * Traduire un texte du français vers une langue africaine
   * Public car utilisé par tous les utilisateurs
   */
  translate: publicProcedure
    .input(
      z.object({
        text: z.string().max(512, "Le texte ne peut pas dépasser 512 caractères"),
        toLang: z.string().default("dioula"),
      })
    )
    .mutation(async ({ input }) => {
      if (!hasCredentials()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Les credentials Lafricamobile ne sont pas configurés",
        });
      }

      try {
        const result = await translateText(input.text, input.toLang);
        return {
          originalText: result.text,
          translatedText: result.translated_text,
          language: result.to_lang,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erreur de traduction: ${error.message}`,
        });
      }
    }),

  /**
   * Traduire un texte long (> 512 caractères)
   * Découpe automatiquement le texte en morceaux
   */
  translateLong: publicProcedure
    .input(
      z.object({
        text: z.string(),
        toLang: z.string().default("dioula"),
      })
    )
    .mutation(async ({ input }) => {
      if (!hasCredentials()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Les credentials Lafricamobile ne sont pas configurés",
        });
      }

      try {
        const translatedText = await translateLongText(input.text, input.toLang);
        return {
          originalText: input.text,
          translatedText,
          language: input.toLang,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erreur de traduction: ${error.message}`,
        });
      }
    }),

  /**
   * Synthétiser un texte en audio
   * Public car utilisé par tous les utilisateurs
   */
  synthesize: publicProcedure
    .input(
      z.object({
        text: z.string(),
        toLang: z.string().default("dioula"),
        pitch: z.number().min(-1).max(1).default(0.0).optional(),
        speed: z.number().min(0.5).max(2.0).default(1.0).optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (!hasCredentials()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Les credentials Lafricamobile ne sont pas configurés",
        });
      }

      try {
        const options: TTSOptions = {
          pitch: input.pitch,
          speed: input.speed,
        };

        const result = await synthesizeText(input.text, input.toLang, options);
        return {
          text: result.text,
          language: result.to_lang,
          audioUrl: result.path_audio,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erreur de synthèse vocale: ${error.message}`,
        });
      }
    }),

  /**
   * Traduire ET synthétiser en une seule opération
   * Public car utilisé par tous les utilisateurs
   */
  translateAndSynthesize: publicProcedure
    .input(
      z.object({
        textFr: z.string(),
        toLang: z.string().default("dioula"),
        pitch: z.number().min(-1).max(1).default(0.0).optional(),
        speed: z.number().min(0.5).max(2.0).default(1.0).optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (!hasCredentials()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Les credentials Lafricamobile ne sont pas configurés",
        });
      }

      try {
        const options: TTSOptions = {
          pitch: input.pitch,
          speed: input.speed,
        };

        const result = await translateAndSynthesize(input.textFr, input.toLang, options);
        return {
          originalText: input.textFr,
          translatedText: result.translatedText,
          audioUrl: result.audioUrl,
          language: input.toLang,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erreur de traduction et synthèse: ${error.message}`,
        });
      }
    }),

  /**
   * Lister les langues supportées
   */
  supportedLanguages: publicProcedure.query(() => {
    return [
      { code: "dioula", name: "Dioula", flag: "🇨🇮" },
      { code: "bambara", name: "Bambara", flag: "🇲🇱" },
      { code: "wolof", name: "Wolof", flag: "🇸🇳" },
      { code: "lingala", name: "Lingala", flag: "🇨🇩" },
      { code: "fulfulde", name: "Fulfulde", flag: "🌍" },
      { code: "haoussa", name: "Haoussa", flag: "🇳🇪" },
    ];
  }),
});
