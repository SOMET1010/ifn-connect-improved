import { trpc } from './trpc';
import type { VoicePersona } from '../../../shared/voice-personas';
import { selectPersonaForContext } from '../../../shared/voice-personas';

export type VoiceContext =
  | 'onboarding'
  | 'transaction'
  | 'security'
  | 'gamification'
  | 'help'
  | 'error'
  | 'success'
  | 'information';

export interface SpeakOptions {
  text: string;
  persona?: VoicePersona;
  context?: VoiceContext;
}

export interface SpeakMessageOptions {
  messageKey: string;
  context: VoiceContext;
  replacements?: Record<string, string>;
}

export interface SpeakAmountOptions {
  amount: number;
  context?: VoiceContext;
}

class ElevenLabsVoiceService {
  private audioCache = new Map<string, string>();
  private currentAudio: HTMLAudioElement | null = null;
  private isPlaying = false;
  private isEnabled = true;

  constructor() {
    const saved = localStorage.getItem('pnavim-voice-enabled');
    this.isEnabled = saved !== 'false';
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    localStorage.setItem('pnavim-voice-enabled', enabled ? 'true' : 'false');
    if (!enabled) {
      this.stop();
    }
  }

  getEnabled(): boolean {
    return this.isEnabled;
  }

  toggleEnabled(): boolean {
    this.setEnabled(!this.isEnabled);
    return this.isEnabled;
  }

  private async playAudioFromBase64(base64Audio: string): Promise<void> {
    if (!this.isEnabled) return;

    return new Promise((resolve, reject) => {
      try {
        this.stop();

        const audioBlob = this.base64ToBlob(base64Audio, 'audio/mpeg');
        const audioUrl = URL.createObjectURL(audioBlob);

        const audio = new Audio(audioUrl);
        this.currentAudio = audio;
        this.isPlaying = true;

        audio.onended = () => {
          this.isPlaying = false;
          this.currentAudio = null;
          URL.revokeObjectURL(audioUrl);
          resolve();
        };

        audio.onerror = (error) => {
          this.isPlaying = false;
          this.currentAudio = null;
          URL.revokeObjectURL(audioUrl);
          reject(error);
        };

        audio.play().catch((error) => {
          this.isPlaying = false;
          this.currentAudio = null;
          URL.revokeObjectURL(audioUrl);
          reject(error);
        });
      } catch (error) {
        this.isPlaying = false;
        this.currentAudio = null;
        reject(error);
      }
    });
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  async speak(options: SpeakOptions): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const cacheKey = `${options.text}-${options.persona || options.context || 'default'}`;

      if (this.audioCache.has(cacheKey)) {
        const cachedAudio = this.audioCache.get(cacheKey)!;
        await this.playAudioFromBase64(cachedAudio);
        return;
      }

      const result = await trpc.voice.textToSpeech.mutate({
        text: options.text,
        persona: options.persona,
        context: options.context,
      });

      if (result.success && result.audio) {
        this.audioCache.set(cacheKey, result.audio);
        await this.playAudioFromBase64(result.audio);
      }
    } catch (error) {
      console.error('[ElevenLabs Voice] Speak error:', error);
      throw error;
    }
  }

  async speakMessage(options: SpeakMessageOptions): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const cacheKey = `msg-${options.messageKey}-${options.context}`;

      if (this.audioCache.has(cacheKey)) {
        const cachedAudio = this.audioCache.get(cacheKey)!;
        await this.playAudioFromBase64(cachedAudio);
        return;
      }

      const result = await trpc.voice.speakMessage.mutate({
        messageKey: options.messageKey,
        context: options.context,
        replacements: options.replacements,
      });

      if (result.success && result.audio) {
        this.audioCache.set(cacheKey, result.audio);
        await this.playAudioFromBase64(result.audio);
      }
    } catch (error) {
      console.error('[ElevenLabs Voice] Speak message error:', error);
      throw error;
    }
  }

  async speakAmount(options: SpeakAmountOptions): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const cacheKey = `amount-${options.amount}-${options.context || 'default'}`;

      if (this.audioCache.has(cacheKey)) {
        const cachedAudio = this.audioCache.get(cacheKey)!;
        await this.playAudioFromBase64(cachedAudio);
        return;
      }

      const result = await trpc.voice.speakAmount.mutate({
        amount: options.amount,
        context: options.context,
      });

      if (result.success && result.audio) {
        this.audioCache.set(cacheKey, result.audio);
        await this.playAudioFromBase64(result.audio);
      }
    } catch (error) {
      console.error('[ElevenLabs Voice] Speak amount error:', error);
      throw error;
    }
  }

  async speechToSpeech(audioBlob: Blob, persona: VoicePersona): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );

      const result = await trpc.voice.speechToSpeech.mutate({
        audioBase64: base64Audio,
        persona,
      });

      if (result.success && result.audio) {
        await this.playAudioFromBase64(result.audio);
      }
    } catch (error) {
      console.error('[ElevenLabs Voice] Speech-to-Speech error:', error);
      throw error;
    }
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isPlaying = false;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  clearCache(): void {
    this.audioCache.clear();
  }

  async checkConfiguration(): Promise<{ isConfigured: boolean; message: string }> {
    try {
      const result = await trpc.voice.checkConfiguration.query();
      return result;
    } catch (error) {
      console.error('[ElevenLabs Voice] Configuration check error:', error);
      return {
        isConfigured: false,
        message: 'Failed to check configuration',
      };
    }
  }
}

export const elevenLabsVoice = new ElevenLabsVoiceService();
