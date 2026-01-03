/**
 * Audio Manager pour IFN Connect / PNAVIM
 * Support multilingue avec 6 langues locales de Côte d'Ivoire
 * Feedback multi-sensoriel (audio + visuel + tactile)
 * Intégration ElevenLabs pour voix authentiques ivoiriennes
 */

import { elevenLabsVoice, type VoiceContext } from './elevenLabsVoice';
import { selectPersonaForContext } from '../../../shared/voice-personas';

export type SupportedLanguage = 'fr' | 'dioula' | 'baule' | 'bete' | 'senoufo' | 'malinke';

export interface AudioInstruction {
  key: string;
  fr: string;
  dioula?: string;
  baule?: string;
  bete?: string;
  senoufo?: string;
  malinke?: string;
}

// Bibliothèque complète d'instructions audio pour IFN Connect
export const AUDIO_INSTRUCTIONS: Record<string, AudioInstruction> = {
  // Bienvenue et navigation
  welcome: {
    key: 'welcome',
    fr: 'Bienvenue sur IFN Connect. Plateforme d\'inclusion financière numérique.',
    dioula: 'I ni ce IFN Connect. Plateforme wari numérique.',
    baule: 'Akwaba IFN Connect.',
  },
  
  // Actions principales marchands
  sell: {
    key: 'sell',
    fr: 'Vendre. Enregistrer une vente. Touchez pour continuer.',
    dioula: 'Vendre. Enregistrer vente. Touchez.',
    baule: 'Vendre. Touchez.',
  },
  stock: {
    key: 'stock',
    fr: 'Stock. Gérer votre inventaire. Touchez pour continuer.',
    dioula: 'Stock. Gérer inventaire. Touchez.',
    baule: 'Stock. Touchez.',
  },
  money: {
    key: 'money',
    fr: 'Argent. Paiements et transactions. Touchez pour continuer.',
    dioula: 'Wari. Paiements et transactions. Touchez.',
    baule: 'Argent. Touchez.',
  },
  help: {
    key: 'help',
    fr: 'Aide. Assistance et support. Touchez pour continuer.',
    dioula: 'Aide. Support. Touchez.',
    baule: 'Aide. Touchez.',
  },

  // Transactions
  send_money: {
    key: 'send_money',
    fr: 'Envoyer de l\'argent. Touchez pour continuer.',
    dioula: 'Envoyer wari. Touchez.',
    baule: 'Envoyer argent. Touchez.',
  },
  receive_money: {
    key: 'receive_money',
    fr: 'Recevoir de l\'argent. Touchez pour continuer.',
    dioula: 'Recevoir wari. Touchez.',
    baule: 'Recevoir argent. Touchez.',
  },
  save_money: {
    key: 'save_money',
    fr: 'Épargner de l\'argent. Touchez pour continuer.',
    dioula: 'Épargner wari. Touchez.',
    baule: 'Épargner argent. Touchez.',
  },

  // Protection sociale
  cnps: {
    key: 'cnps',
    fr: 'CNPS. Votre retraite. Touchez pour voir votre statut.',
    dioula: 'CNPS. Retraite. Touchez.',
    baule: 'CNPS. Touchez.',
  },
  cmu: {
    key: 'cmu',
    fr: 'CMU. Votre santé. Touchez pour voir votre couverture.',
    dioula: 'CMU. Santé. Touchez.',
    baule: 'CMU. Touchez.',
  },

  // Marché et approvisionnement
  market: {
    key: 'market',
    fr: 'Marché virtuel. Commander des produits. Touchez pour continuer.',
    dioula: 'Marché virtuel. Commander. Touchez.',
    baule: 'Marché. Touchez.',
  },
  order: {
    key: 'order',
    fr: 'Commander. Passer une commande. Touchez pour continuer.',
    dioula: 'Commander. Touchez.',
    baule: 'Commander. Touchez.',
  },

  // Alertes stock
  low_stock: {
    key: 'low_stock',
    fr: 'Attention ! Stock faible. Pensez à vous réapprovisionner.',
    dioula: 'Attention ! Stock faible. Réapprovisionner.',
    baule: 'Attention ! Stock faible.',
  },
  out_of_stock: {
    key: 'out_of_stock',
    fr: 'Alerte ! Produit en rupture de stock.',
    dioula: 'Alerte ! Rupture de stock.',
    baule: 'Alerte ! Rupture.',
  },

  // Feedback système
  success: {
    key: 'success',
    fr: 'Opération réussie !',
    dioula: 'Opération réussie !',
    baule: 'Opération réussie !',
  },
  error: {
    key: 'error',
    fr: 'Erreur. Veuillez réessayer.',
    dioula: 'Erreur. Réessayez.',
    baule: 'Erreur. Réessayez.',
  },
  loading: {
    key: 'loading',
    fr: 'Chargement en cours. Veuillez patienter.',
    dioula: 'Chargement. Patientez.',
    baule: 'Chargement.',
  },
  confirm: {
    key: 'confirm',
    fr: 'Confirmez avec votre code PIN.',
    dioula: 'Confirmez avec code PIN.',
    baule: 'Confirmez code PIN.',
  },

  // Enrôlement agent
  enroll: {
    key: 'enroll',
    fr: 'Enrôler un marchand. Commencer l\'inscription.',
    dioula: 'Enrôler marchand. Commencer.',
    baule: 'Enrôler marchand.',
  },
  take_photo: {
    key: 'take_photo',
    fr: 'Prendre une photo. Touchez pour capturer.',
    dioula: 'Prendre photo. Touchez.',
    baule: 'Photo. Touchez.',
  },
  location: {
    key: 'location',
    fr: 'Géolocalisation. Enregistrer la position.',
    dioula: 'Géolocalisation. Enregistrer.',
    baule: 'Localisation.',
  },

  // Coopérative
  cooperative: {
    key: 'cooperative',
    fr: 'Coopérative. Gestion centralisée.',
    dioula: 'Coopérative. Gestion.',
    baule: 'Coopérative.',
  },
  group_order: {
    key: 'group_order',
    fr: 'Commande groupée. Achats en gros.',
    dioula: 'Commande groupée. Achats gros.',
    baule: 'Commande groupée.',
  },

  // Commandes vocales
  voice_command: {
    key: 'voice_command',
    fr: 'Commande vocale activée. Parlez maintenant.',
    dioula: 'Commande vocale activée. Parlez.',
    baule: 'Commande vocale. Parlez.',
  },
  listening: {
    key: 'listening',
    fr: 'Je vous écoute...',
    dioula: 'Je vous écoute...',
    baule: 'Je vous écoute...',
  },
};

class AudioManager {
  private currentLanguage: SupportedLanguage = 'fr';
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private isSpeaking: boolean = false;
  private isEnabled: boolean = true;
  private useElevenLabs: boolean = true;
  private elevenLabsConfigured: boolean = false;

  setLanguage(language: SupportedLanguage) {
    this.currentLanguage = language;
    localStorage.setItem('ifn_language', language);
  }

  getLanguage(): SupportedLanguage {
    const stored = localStorage.getItem('ifn_language') as SupportedLanguage;
    return stored || this.currentLanguage;
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    localStorage.setItem('ifn_audio_enabled', enabled ? 'true' : 'false');
  }

  isAudioEnabled(): boolean {
    const stored = localStorage.getItem('ifn_audio_enabled');
    return stored === null ? true : stored === 'true';
  }

  async checkElevenLabsConfiguration(): Promise<void> {
    try {
      const config = await elevenLabsVoice.checkConfiguration();
      this.elevenLabsConfigured = config.isConfigured;

      if (!config.isConfigured) {
        console.warn('[AudioManager] ElevenLabs not configured, falling back to browser TTS');
      }
    } catch (error) {
      console.warn('[AudioManager] Could not check ElevenLabs config:', error);
      this.elevenLabsConfigured = false;
    }
  }

  setUseElevenLabs(use: boolean) {
    this.useElevenLabs = use;
    localStorage.setItem('pnavim_use_elevenlabs', use ? 'true' : 'false');
  }

  getUseElevenLabs(): boolean {
    return this.useElevenLabs && this.elevenLabsConfigured;
  }

  private mapInstructionToContext(key: string): VoiceContext {
    const contextMap: Record<string, VoiceContext> = {
      welcome: 'onboarding',
      sell: 'transaction',
      stock: 'information',
      money: 'transaction',
      help: 'help',
      send_money: 'transaction',
      receive_money: 'transaction',
      save_money: 'transaction',
      cnps: 'information',
      cmu: 'information',
      market: 'information',
      order: 'transaction',
      low_stock: 'error',
      out_of_stock: 'error',
      success: 'success',
      error: 'error',
      loading: 'information',
      confirm: 'security',
      enroll: 'onboarding',
      take_photo: 'information',
      location: 'information',
      cooperative: 'information',
      group_order: 'transaction',
      voice_command: 'help',
      listening: 'information',
    };

    return contextMap[key] || 'information';
  }

  /**
   * Jouer une instruction audio
   * Utilise ElevenLabs (voix clonées) en priorité, puis browser TTS en fallback
   */
  async playInstruction(key: string): Promise<void> {
    if (!this.isEnabled || !this.isAudioEnabled()) return;

    const instruction = AUDIO_INSTRUCTIONS[key];
    if (!instruction) {
      console.warn(`Audio instruction not found: ${key}`);
      return;
    }

    const text = instruction[this.currentLanguage] || instruction.fr;
    const context = this.mapInstructionToContext(key);

    if (this.useElevenLabs && this.elevenLabsConfigured) {
      try {
        this.isSpeaking = true;
        await elevenLabsVoice.speak({ text, context });
        this.isSpeaking = false;
        return;
      } catch (error) {
        console.warn('[AudioManager] ElevenLabs failed, falling back to browser TTS:', error);
      }
    }

    if ('speechSynthesis' in window) {
      return new Promise((resolve) => {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.currentLanguage === 'fr' ? 'fr-FR' : 'fr-FR';
        utterance.rate = 0.85;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onend = () => {
          this.isSpeaking = false;
          resolve();
        };

        utterance.onerror = (error) => {
          console.warn('Speech synthesis error:', error);
          this.isSpeaking = false;
          resolve();
        };

        this.isSpeaking = true;
        window.speechSynthesis.speak(utterance);
      });
    }
  }

  /**
   * Arrêter la lecture audio en cours
   */
  stopAudio() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
  }

  /**
   * Vérifier si une lecture est en cours
   */
  isSpeakingNow(): boolean {
    return this.isSpeaking;
  }

  /**
   * Jouer un son de feedback
   * Différents sons selon le type de feedback
   */
  playFeedbackSound(type: 'success' | 'error' | 'attention' | 'tap') {
    if (!this.isEnabled || !this.isAudioEnabled()) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      switch (type) {
        case 'success':
          oscillator.frequency.value = 800; // Note haute
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.stop(audioContext.currentTime + 0.3);
          break;
        case 'error':
          oscillator.frequency.value = 200; // Note basse
          oscillator.type = 'sawtooth';
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          oscillator.stop(audioContext.currentTime + 0.5);
          break;
        case 'attention':
          oscillator.frequency.value = 500; // Note moyenne
          oscillator.type = 'square';
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          oscillator.stop(audioContext.currentTime + 0.2);
          break;
        case 'tap':
          oscillator.frequency.value = 600;
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          oscillator.stop(audioContext.currentTime + 0.1);
          break;
      }

      oscillator.start(audioContext.currentTime);
    } catch (error) {
      console.warn('Audio feedback error:', error);
    }
  }

  /**
   * Vibration tactile
   * Patterns différents selon le contexte
   */
  vibrate(pattern: number | number[] = 100) {
    if (!this.isEnabled) return;
    
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.warn('Vibration error:', error);
      }
    }
  }

  /**
   * Feedback complet (audio + tactile)
   * Utilisé pour toutes les interactions importantes
   */
  provideFeedback(type: 'success' | 'error' | 'attention' | 'tap') {
    this.playFeedbackSound(type);
    
    // Patterns de vibration différents selon le type
    switch (type) {
      case 'success':
        this.vibrate([100, 50, 100]); // Double vibration
        break;
      case 'error':
        this.vibrate([200, 100, 200, 100, 200]); // Triple vibration longue
        break;
      case 'attention':
        this.vibrate(100); // Simple vibration
        break;
      case 'tap':
        this.vibrate(50); // Vibration courte
        break;
    }
  }

  /**
   * Lire un texte personnalisé
   * Utilise ElevenLabs (voix clonées) en priorité, puis browser TTS en fallback
   */
  async speak(text: string, context: VoiceContext = 'information'): Promise<void> {
    if (!this.isEnabled || !this.isAudioEnabled()) return;

    if (this.useElevenLabs && this.elevenLabsConfigured) {
      try {
        this.isSpeaking = true;
        await elevenLabsVoice.speak({ text, context });
        this.isSpeaking = false;
        return;
      } catch (error) {
        console.warn('[AudioManager] ElevenLabs failed, falling back to browser TTS:', error);
      }
    }

    if ('speechSynthesis' in window) {
      return new Promise((resolve) => {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.currentLanguage === 'fr' ? 'fr-FR' : 'fr-FR';
        utterance.rate = 0.85;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onend = () => {
          this.isSpeaking = false;
          resolve();
        };

        utterance.onerror = () => {
          this.isSpeaking = false;
          resolve();
        };

        this.isSpeaking = true;
        window.speechSynthesis.speak(utterance);
      });
    }
  }

  async speakAmount(amount: number, context: VoiceContext = 'transaction'): Promise<void> {
    if (!this.isEnabled || !this.isAudioEnabled()) return;

    if (this.useElevenLabs && this.elevenLabsConfigured) {
      try {
        this.isSpeaking = true;
        await elevenLabsVoice.speakAmount({ amount, context });
        this.isSpeaking = false;
        return;
      } catch (error) {
        console.warn('[AudioManager] ElevenLabs failed for amount, falling back:', error);
      }
    }

    const formattedAmount = new Intl.NumberFormat('fr-FR').format(amount);
    const text = `${formattedAmount} francs CFA`;
    await this.speak(text, context);
  }

  async speakMessage(messageKey: string, context: VoiceContext, replacements?: Record<string, string>): Promise<void> {
    if (!this.isEnabled || !this.isAudioEnabled()) return;

    if (this.useElevenLabs && this.elevenLabsConfigured) {
      try {
        this.isSpeaking = true;
        await elevenLabsVoice.speakMessage({ messageKey, context, replacements });
        this.isSpeaking = false;
        return;
      } catch (error) {
        console.warn('[AudioManager] ElevenLabs failed for message, falling back:', error);
      }
    }

    const instruction = AUDIO_INSTRUCTIONS[messageKey];
    if (instruction) {
      await this.speak(instruction.fr, context);
    }
  }
}

export const audioManager = new AudioManager();

if (typeof window !== 'undefined') {
  const savedLanguage = localStorage.getItem('ifn_language') as SupportedLanguage;
  if (savedLanguage) {
    audioManager.setLanguage(savedLanguage);
  }

  const savedUseElevenLabs = localStorage.getItem('pnavim_use_elevenlabs');
  if (savedUseElevenLabs !== null) {
    audioManager.setUseElevenLabs(savedUseElevenLabs === 'true');
  }

  audioManager.checkElevenLabsConfiguration().catch(console.error);
}
