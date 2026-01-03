import { z } from "zod";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { voiceRecordings, voiceTransformations, voicePersonasCustom } from "../../drizzle/schema-voice-production";
import { eq, desc, and } from "drizzle-orm";
import { getSignedUploadUrl, getSignedDownloadUrl } from "../storage";
import { elevenlabsService } from "../_core/elevenlabs";
import type { VoicePersona } from "../../shared/voice-personas";
import { ENV } from "../_core/env";

const getPersonaFromVoiceId = (voiceId: string): VoicePersona => {
  if (voiceId === ENV.elevenlabsTantieVoiceId) return "tantie";
  if (voiceId === ENV.elevenlabsProVoiceId) return "pro";
  if (voiceId === ENV.elevenlabsAmbianceurVoiceId) return "ambianceur";
  return "tantie";
};

export const voiceProductionRouter = router({
  uploadRecording: adminProcedure
    .input(z.object({
      fileName: z.string(),
      fileType: z.string(),
      originalText: z.string().optional(),
      durationSeconds: z.number().optional(),
      fileSizeBytes: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const userId = ctx.user!.id;
      const key = `voice-recordings/${userId}/${Date.now()}-${input.fileName}`;

      const uploadUrl = await getSignedUploadUrl(key, input.fileType);

      const [recording] = await db.insert(voiceRecordings).values({
        adminUserId: userId,
        originalText: input.originalText,
        audioUrl: key,
        durationSeconds: input.durationSeconds,
        fileSizeBytes: input.fileSizeBytes,
        status: "draft",
      }).returning();

      return {
        uploadUrl,
        recording,
      };
    }),

  listRecordings: adminProcedure
    .input(z.object({
      status: z.enum(["draft", "processing", "completed", "failed"]).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [];

      if (input?.status) {
        conditions.push(eq(voiceRecordings.status, input.status));
      }

      const recordings = await db.query.voiceRecordings.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: [desc(voiceRecordings.createdAt)],
        with: {
          transformations: true,
        },
      });

      const recordingsWithUrls = await Promise.all(
        recordings.map(async (recording) => {
          const audioUrl = await getSignedDownloadUrl(recording.audioUrl);
          return {
            ...recording,
            audioUrl,
          };
        })
      );

      return recordingsWithUrls;
    }),

  getRecording: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const recording = await db.query.voiceRecordings.findFirst({
        where: eq(voiceRecordings.id, input.id),
      });

      if (!recording) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recording not found",
        });
      }

      const audioUrl = await getSignedDownloadUrl(recording.audioUrl);

      return {
        ...recording,
        audioUrl,
      };
    }),

  updateRecording: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
      originalText: z.string().optional(),
      status: z.enum(["draft", "processing", "completed", "failed"]).optional(),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { id, ...updates } = input;

      const [updated] = await db
        .update(voiceRecordings)
        .set(updates)
        .where(eq(voiceRecordings.id, id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recording not found",
        });
      }

      return updated;
    }),

  deleteRecording: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .delete(voiceRecordings)
        .where(eq(voiceRecordings.id, input.id));

      return { success: true };
    }),

  transformVoice: adminProcedure
    .input(z.object({
      recordingId: z.string().uuid(),
      targetVoiceId: z.string(),
      transformationType: z.enum(["speech_to_speech", "text_to_speech"]).default("speech_to_speech"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const recording = await db.query.voiceRecordings.findFirst({
        where: eq(voiceRecordings.id, input.recordingId),
      });

      if (!recording) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recording not found",
        });
      }

      const [transformation] = await db.insert(voiceTransformations).values({
        recordingId: input.recordingId,
        targetVoiceId: input.targetVoiceId,
        transformationType: input.transformationType,
        status: "pending",
      }).returning();

      (async () => {
        try {
          const db = await getDb();
          if (!db) return;

          const startTime = Date.now();

          await db
            .update(voiceTransformations)
            .set({ status: "processing" })
            .where(eq(voiceTransformations.id, transformation.id));

          let outputAudioBuffer: Buffer;
          const targetPersona = getPersonaFromVoiceId(input.targetVoiceId);

          if (input.transformationType === "speech_to_speech") {
            const audioUrl = await getSignedDownloadUrl(recording.audioUrl);
            const audioResponse = await fetch(audioUrl);
            const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());

            outputAudioBuffer = await elevenlabsService.speechToSpeech({
              persona: targetPersona,
              audioFile: audioBuffer,
            });
          } else {
            if (!recording.originalText) {
              throw new Error("Original text required for text-to-speech transformation");
            }

            outputAudioBuffer = await elevenlabsService.textToSpeech({
              persona: targetPersona,
              text: recording.originalText,
            });
          }

          const outputKey = `voice-transformations/${transformation.id}/${Date.now()}-output.mp3`;
          const uploadUrl = await getSignedUploadUrl(outputKey, "audio/mpeg");

          await fetch(uploadUrl, {
            method: "PUT",
            body: outputAudioBuffer,
            headers: {
              "Content-Type": "audio/mpeg",
            },
          });

          const processingTime = Date.now() - startTime;

          await db
            .update(voiceTransformations)
            .set({
              status: "completed",
              outputAudioUrl: outputKey,
              processingTimeMs: processingTime,
              completedAt: new Date(),
            })
            .where(eq(voiceTransformations.id, transformation.id));
        } catch (error) {
          const db = await getDb();
          if (!db) return;

          await db
            .update(voiceTransformations)
            .set({
              status: "failed",
              errorMessage: error instanceof Error ? error.message : "Unknown error",
            })
            .where(eq(voiceTransformations.id, transformation.id));
        }
      })();

      return transformation;
    }),

  getTransformation: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const transformation = await db.query.voiceTransformations.findFirst({
        where: eq(voiceTransformations.id, input.id),
      });

      if (!transformation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Transformation not found",
        });
      }

      let outputAudioUrl = null;
      if (transformation.outputAudioUrl) {
        outputAudioUrl = await getSignedDownloadUrl(transformation.outputAudioUrl);
      }

      return {
        ...transformation,
        outputAudioUrl,
      };
    }),

  listTransformations: adminProcedure
    .input(z.object({
      recordingId: z.string().uuid().optional(),
      status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [];

      if (input?.recordingId) {
        conditions.push(eq(voiceTransformations.recordingId, input.recordingId));
      }

      if (input?.status) {
        conditions.push(eq(voiceTransformations.status, input.status));
      }

      const transformations = await db.query.voiceTransformations.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: [desc(voiceTransformations.createdAt)],
      });

      const transformationsWithUrls = await Promise.all(
        transformations.map(async (transformation) => {
          let outputAudioUrl = null;
          if (transformation.outputAudioUrl) {
            outputAudioUrl = await getSignedDownloadUrl(transformation.outputAudioUrl);
          }
          return {
            ...transformation,
            outputAudioUrl,
          };
        })
      );

      return transformationsWithUrls;
    }),

  createCustomPersona: adminProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      elevenlabsVoiceId: z.string(),
      sampleAudioUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const userId = ctx.user!.id;

      const [persona] = await db.insert(voicePersonasCustom).values({
        ...input,
        createdBy: userId,
      }).returning();

      return persona;
    }),

  listCustomPersonas: adminProcedure
    .input(z.object({
      isActive: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [];

      if (input?.isActive !== undefined) {
        conditions.push(eq(voicePersonasCustom.isActive, input.isActive));
      }

      const personas = await db.query.voicePersonasCustom.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: [desc(voicePersonasCustom.createdAt)],
      });

      return personas;
    }),

  updateCustomPersona: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
      sampleAudioUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { id, ...updates } = input;

      const [updated] = await db
        .update(voicePersonasCustom)
        .set(updates)
        .where(eq(voicePersonasCustom.id, id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Custom persona not found",
        });
      }

      return updated;
    }),

  deleteCustomPersona: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .delete(voicePersonasCustom)
        .where(eq(voicePersonasCustom.id, input.id));

      return { success: true };
    }),
});
