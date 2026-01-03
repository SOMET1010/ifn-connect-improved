import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { elevenlabsService } from '../_core/elevenlabs';
import type { VoicePersona } from '../../shared/voice-personas';
import { selectPersonaForContext } from '../../shared/voice-personas';

const voicePersonaSchema = z.enum(['tantie', 'pro', 'ambianceur']);

const voiceContextSchema = z.enum([
  'onboarding',
  'transaction',
  'security',
  'gamification',
  'help',
  'error',
  'success',
  'information',
]);

export const voiceRouter = router({
  textToSpeech: publicProcedure
    .input(
      z.object({
        text: z.string().min(1).max(5000),
        persona: voicePersonaSchema.optional(),
        context: voiceContextSchema.optional(),
        stability: z.number().min(0).max(1).optional(),
        similarityBoost: z.number().min(0).max(1).optional(),
        style: z.number().min(0).max(1).optional(),
        useSpeakerBoost: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        if (!elevenlabsService.isConfigured()) {
          throw new Error('ElevenLabs service not configured. Please add API keys to environment variables.');
        }

        const persona = input.persona || (input.context ? selectPersonaForContext(input.context) : 'tantie');

        const audioBuffer = await elevenlabsService.textToSpeech({
          persona,
          text: input.text,
          stability: input.stability,
          similarityBoost: input.similarityBoost,
          style: input.style,
          useSpeakerBoost: input.useSpeakerBoost,
        });

        const base64Audio = audioBuffer.toString('base64');

        return {
          success: true,
          audio: base64Audio,
          persona,
          mimeType: 'audio/mpeg',
        };
      } catch (error) {
        console.error('[Voice Router] TTS Error:', error);
        throw new Error(
          error instanceof Error ? error.message : 'Failed to generate speech'
        );
      }
    }),

  speechToSpeech: publicProcedure
    .input(
      z.object({
        audioBase64: z.string(),
        persona: voicePersonaSchema,
      })
    )
    .mutation(async ({ input }) => {
      try {
        if (!elevenlabsService.isConfigured()) {
          throw new Error('ElevenLabs service not configured. Please add API keys to environment variables.');
        }

        const audioBuffer = Buffer.from(input.audioBase64, 'base64');

        const outputBuffer = await elevenlabsService.speechToSpeech({
          persona: input.persona,
          audioFile: audioBuffer,
        });

        const base64Audio = outputBuffer.toString('base64');

        return {
          success: true,
          audio: base64Audio,
          persona: input.persona,
          mimeType: 'audio/mpeg',
        };
      } catch (error) {
        console.error('[Voice Router] STS Error:', error);
        throw new Error(
          error instanceof Error ? error.message : 'Failed to process speech'
        );
      }
    }),

  checkConfiguration: publicProcedure.query(async () => {
    const isConfigured = elevenlabsService.isConfigured();

    return {
      isConfigured,
      message: isConfigured
        ? 'ElevenLabs voice service is ready'
        : 'ElevenLabs service not configured. Add API keys to .env file.',
    };
  }),

  getVoices: publicProcedure.query(async () => {
    try {
      const voices = await elevenlabsService.getVoices();
      return {
        success: true,
        voices,
      };
    } catch (error) {
      console.error('[Voice Router] Get Voices Error:', error);
      throw new Error('Failed to fetch voices');
    }
  }),

  speakMessage: publicProcedure
    .input(
      z.object({
        messageKey: z.string(),
        context: voiceContextSchema,
        replacements: z.record(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        if (!elevenlabsService.isConfigured()) {
          throw new Error('ElevenLabs service not configured');
        }

        const predefinedMessages: Record<string, string> = {
          welcome: 'Bienvenue sur PNAVIM. Votre assistant de gestion pour les marchands.',
          sell_success: 'Vente enregistrée avec succès ! Bravo !',
          low_stock: 'Attention, votre stock est bas. Pensez à vous réapprovisionner.',
          payment_success: 'Paiement reçu avec succès.',
          error_generic: 'Une erreur est survenue. Veuillez réessayer.',
          first_login: 'C\'est votre première connexion. Je vais vous guider pas à pas.',
          transaction_confirm: 'Confirmez votre transaction avec votre code PIN.',
          badge_unlocked: 'Félicitations ! Tu as débloqué un nouveau badge !',
          goal_reached: 'Objectif atteint ! Tu es un champion !',
        };

        let message = predefinedMessages[input.messageKey] || input.messageKey;

        if (input.replacements) {
          Object.entries(input.replacements).forEach(([key, value]) => {
            message = message.replace(`{${key}}`, value);
          });
        }

        const persona = selectPersonaForContext(input.context);

        const audioBuffer = await elevenlabsService.textToSpeech({
          persona,
          text: message,
        });

        const base64Audio = audioBuffer.toString('base64');

        return {
          success: true,
          audio: base64Audio,
          persona,
          message,
          mimeType: 'audio/mpeg',
        };
      } catch (error) {
        console.error('[Voice Router] Speak Message Error:', error);
        throw new Error(
          error instanceof Error ? error.message : 'Failed to speak message'
        );
      }
    }),

  speakAmount: publicProcedure
    .input(
      z.object({
        amount: z.number(),
        context: voiceContextSchema.optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        if (!elevenlabsService.isConfigured()) {
          throw new Error('ElevenLabs service not configured');
        }

        const formattedAmount = new Intl.NumberFormat('fr-FR').format(input.amount);
        const message = `${formattedAmount} francs CFA`;

        const persona = input.context ? selectPersonaForContext(input.context) : 'pro';

        const audioBuffer = await elevenlabsService.textToSpeech({
          persona,
          text: message,
        });

        const base64Audio = audioBuffer.toString('base64');

        return {
          success: true,
          audio: base64Audio,
          persona,
          amount: input.amount,
          formattedAmount,
          mimeType: 'audio/mpeg',
        };
      } catch (error) {
        console.error('[Voice Router] Speak Amount Error:', error);
        throw new Error(
          error instanceof Error ? error.message : 'Failed to speak amount'
        );
      }
    }),
});
