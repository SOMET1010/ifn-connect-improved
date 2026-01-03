import { ENV } from './env';
import type { VoicePersona } from '../../shared/voice-personas';
import { applyPhoneticRules } from '../../shared/voice-personas';

export interface ElevenLabsConfig {
  apiKey: string;
  voiceIds: {
    tantie: string;
    pro: string;
    ambianceur: string;
  };
}

export interface TTSOptions {
  persona: VoicePersona;
  text: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export interface STSOptions {
  persona: VoicePersona;
  audioFile: Buffer;
  modelId?: string;
}

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

class ElevenLabsService {
  private config: ElevenLabsConfig;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor() {
    this.config = {
      apiKey: ENV.elevenlabsApiKey,
      voiceIds: {
        tantie: ENV.elevenlabsTantieVoiceId,
        pro: ENV.elevenlabsProVoiceId,
        ambianceur: ENV.elevenlabsAmbianceurVoiceId,
      },
    };
  }

  private getVoiceId(persona: VoicePersona): string {
    return this.config.voiceIds[persona];
  }

  private getVoiceSettings(persona: VoicePersona): VoiceSettings {
    switch (persona) {
      case 'tantie':
        return {
          stability: 0.75,
          similarity_boost: 0.85,
          style: 0.3,
          use_speaker_boost: true,
        };
      case 'pro':
        return {
          stability: 0.85,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        };
      case 'ambianceur':
        return {
          stability: 0.65,
          similarity_boost: 0.80,
          style: 0.5,
          use_speaker_boost: true,
        };
    }
  }

  async textToSpeech(options: TTSOptions): Promise<Buffer> {
    if (!this.config.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const voiceId = this.getVoiceId(options.persona);
    if (!voiceId) {
      throw new Error(`Voice ID not configured for persona: ${options.persona}`);
    }

    const processedText = applyPhoneticRules(options.text);

    const voiceSettings = this.getVoiceSettings(options.persona);

    const payload = {
      text: processedText,
      model_id: options.modelId || 'eleven_multilingual_v2',
      voice_settings: {
        stability: options.stability ?? voiceSettings.stability,
        similarity_boost: options.similarityBoost ?? voiceSettings.similarity_boost,
        style: options.style ?? voiceSettings.style,
        use_speaker_boost: options.useSpeakerBoost ?? voiceSettings.use_speaker_boost,
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.config.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs TTS failed: ${response.status} ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('[ElevenLabs] TTS Error:', error);
      throw error;
    }
  }

  async speechToSpeech(options: STSOptions): Promise<Buffer> {
    if (!this.config.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const voiceId = this.getVoiceId(options.persona);
    if (!voiceId) {
      throw new Error(`Voice ID not configured for persona: ${options.persona}`);
    }

    const voiceSettings = this.getVoiceSettings(options.persona);

    const formData = new FormData();
    formData.append('audio', new Blob([options.audioFile], { type: 'audio/mpeg' }));
    formData.append('model_id', options.modelId || 'eleven_multilingual_sts_v2');
    formData.append('voice_settings', JSON.stringify(voiceSettings));

    try {
      const response = await fetch(`${this.baseUrl}/speech-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': this.config.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs STS failed: ${response.status} ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('[ElevenLabs] STS Error:', error);
      throw error;
    }
  }

  async streamTextToSpeech(options: TTSOptions): Promise<ReadableStream> {
    if (!this.config.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const voiceId = this.getVoiceId(options.persona);
    if (!voiceId) {
      throw new Error(`Voice ID not configured for persona: ${options.persona}`);
    }

    const processedText = applyPhoneticRules(options.text);
    const voiceSettings = this.getVoiceSettings(options.persona);

    const payload = {
      text: processedText,
      model_id: options.modelId || 'eleven_multilingual_v2',
      voice_settings: {
        stability: options.stability ?? voiceSettings.stability,
        similarity_boost: options.similarityBoost ?? voiceSettings.similarity_boost,
        style: options.style ?? voiceSettings.style,
        use_speaker_boost: options.useSpeakerBoost ?? voiceSettings.use_speaker_boost,
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}/stream`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.config.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs TTS Stream failed: ${response.status} ${errorText}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      return response.body;
    } catch (error) {
      console.error('[ElevenLabs] TTS Stream Error:', error);
      throw error;
    }
  }

  async getVoices(): Promise<any> {
    if (!this.config.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.config.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[ElevenLabs] Get Voices Error:', error);
      throw error;
    }
  }

  isConfigured(): boolean {
    return !!(
      this.config.apiKey &&
      this.config.voiceIds.tantie &&
      this.config.voiceIds.pro &&
      this.config.voiceIds.ambianceur
    );
  }
}

export const elevenlabsService = new ElevenLabsService();
