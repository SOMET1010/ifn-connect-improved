import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  createVoiceRecording,
  getVoiceRecording,
  listVoiceRecordings,
  updateVoiceRecording,
  deleteVoiceRecording,
  hardDeleteVoiceRecording,
  getVoiceRecordingsStats,
} from "../db-voice-recordings";
import { VOICE_CONTEXTS } from "../../drizzle/schema";
import { storagePut } from "../storage";

/**
 * Router tRPC pour gérer les enregistrements vocaux natifs
 */
export const voiceRecordingsRouter = router({
  /**
   * Récupérer un enregistrement vocal par contexte et langue
   * Public car utilisé par tous les utilisateurs pour écouter les audios
   */
  get: publicProcedure
    .input(
      z.object({
        contextKey: z.string(),
        language: z.string(),
      })
    )
    .query(async ({ input }) => {
      const recording = await getVoiceRecording(input.contextKey, input.language);
      return recording || null;
    }),

  /**
   * Lister tous les enregistrements vocaux (avec filtres optionnels)
   * Protégé car réservé aux admins
   */
  list: protectedProcedure
    .input(
      z
        .object({
          language: z.string().optional(),
          contextKey: z.string().optional(),
          isActive: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      // Vérifier que l'utilisateur est admin
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seuls les administrateurs peuvent lister les enregistrements vocaux",
        });
      }

      return await listVoiceRecordings(input);
    }),

  /**
   * Créer un nouvel enregistrement vocal
   * Protégé car réservé aux admins
   */
  create: protectedProcedure
    .input(
      z.object({
        contextKey: z.string(),
        language: z.string(),
        title: z.string(),
        description: z.string().optional(),
        audioFile: z.object({
          buffer: z.string(), // Base64 encoded audio file
          mimeType: z.string(),
          fileName: z.string(),
        }),
        speakerName: z.string().optional(),
        speakerNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Vérifier que l'utilisateur est admin
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seuls les administrateurs peuvent créer des enregistrements vocaux",
        });
      }

      try {
        // Décoder le fichier audio depuis base64
        const audioBuffer = Buffer.from(input.audioFile.buffer, "base64");
        const fileSize = audioBuffer.length;

        // Générer une clé S3 unique
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const audioKey = `voice-recordings/${input.language}/${input.contextKey}-${timestamp}-${randomSuffix}.${input.audioFile.fileName.split(".").pop()}`;

        // Upload vers S3
        const { url: audioUrl } = await storagePut(audioKey, audioBuffer, input.audioFile.mimeType);

        // Créer l'enregistrement en base de données
        const recording = await createVoiceRecording({
          contextKey: input.contextKey,
          language: input.language,
          title: input.title,
          description: input.description,
          audioUrl,
          audioKey,
          fileSize,
          mimeType: input.audioFile.mimeType,
          speakerName: input.speakerName,
          speakerNotes: input.speakerNotes,
          uploadedBy: ctx.user.id,
          isActive: true,
        });

        return recording;
      } catch (error) {
        console.error("Erreur lors de la création de l'enregistrement vocal:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'upload du fichier audio",
        });
      }
    }),

  /**
   * Mettre à jour un enregistrement vocal
   * Protégé car réservé aux admins
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        speakerName: z.string().optional(),
        speakerNotes: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Vérifier que l'utilisateur est admin
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seuls les administrateurs peuvent modifier des enregistrements vocaux",
        });
      }

      const { id, ...data } = input;
      const updated = await updateVoiceRecording(id, data);

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Enregistrement vocal introuvable",
        });
      }

      return updated;
    }),

  /**
   * Supprimer un enregistrement vocal (soft delete)
   * Protégé car réservé aux admins
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Vérifier que l'utilisateur est admin
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seuls les administrateurs peuvent supprimer des enregistrements vocaux",
        });
      }

      await deleteVoiceRecording(input.id);
      return { success: true };
    }),

  /**
   * Supprimer définitivement un enregistrement vocal
   * Protégé car réservé aux admins
   */
  hardDelete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Vérifier que l'utilisateur est admin
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seuls les administrateurs peuvent supprimer définitivement des enregistrements vocaux",
        });
      }

      await hardDeleteVoiceRecording(input.id);
      return { success: true };
    }),

  /**
   * Récupérer les statistiques des enregistrements vocaux
   * Protégé car réservé aux admins
   */
  stats: protectedProcedure.query(async ({ ctx }) => {
    // Vérifier que l'utilisateur est admin
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Seuls les administrateurs peuvent voir les statistiques",
      });
    }

    return await getVoiceRecordingsStats();
  }),

  /**
   * Lister tous les contextes disponibles
   * Public car utilisé pour afficher les options dans l'interface
   */
  listContexts: publicProcedure.query(() => {
    return Object.entries(VOICE_CONTEXTS).map(([key, value]) => ({
      key,
      value,
      label: key
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" "),
    }));
  }),
});
