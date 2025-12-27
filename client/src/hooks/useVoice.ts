import { useState, useCallback, useEffect } from 'react';

/**
 * Hook pour la synthèse vocale améliorée
 * 
 * Utilise Google TTS avec voix française africaine
 * et parle plus lentement pour une meilleure compréhension
 */

export interface VoiceOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export function useVoice() {
  const [isEnabled, setIsEnabled] = useState(() => {
    // Récupérer la préférence depuis localStorage
    const saved = localStorage.getItem('ifn-voice-enabled');
    return saved !== 'false'; // Activé par défaut
  });

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  // Vérifier la disponibilité de la synthèse vocale
  useEffect(() => {
    setIsAvailable('speechSynthesis' in window);
  }, []);

  // Sauvegarder la préférence
  useEffect(() => {
    localStorage.setItem('ifn-voice-enabled', isEnabled ? 'true' : 'false');
  }, [isEnabled]);

  /**
   * Parler un texte avec la voix améliorée
   */
  const speak = useCallback((text: string, options: VoiceOptions = {}) => {
    if (!isEnabled || !isAvailable || !text) return;

    // Annuler toute parole en cours
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configuration pour voix française africaine
    utterance.lang = options.language || 'fr-FR';
    utterance.rate = options.rate || 0.7; // Parler lentement
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;

    // Essayer de sélectionner une voix française de qualité
    const voices = window.speechSynthesis.getVoices();
    const frenchVoice = voices.find(voice => 
      voice.lang.startsWith('fr') && 
      (voice.name.includes('Google') || voice.name.includes('Enhanced'))
    ) || voices.find(voice => voice.lang.startsWith('fr'));

    if (frenchVoice) {
      utterance.voice = frenchVoice;
    }

    // Gestion des événements
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isEnabled, isAvailable]);

  /**
   * Arrêter la parole en cours
   */
  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  /**
   * Activer/désactiver la voix
   */
  const toggle = useCallback(() => {
    setIsEnabled(prev => !prev);
    if (isSpeaking) {
      stop();
    }
  }, [isSpeaking, stop]);

  return {
    speak,
    stop,
    toggle,
    isEnabled,
    isSpeaking,
    isAvailable
  };
}

/**
 * Messages prédéfinis en Dioula avec traductions françaises
 */
export const VOICE_MESSAGES = {
  // Messages de navigation
  welcome: {
    dioula: 'I ni ce. I ka VENDRE digi walasa ka daminɛ.',
    french: 'Bienvenue. Touchez VENDRE pour commencer.',
  },
  sell: {
    dioula: 'Feereli kɛ',
    french: 'Faire une vente',
  },
  stock: {
    dioula: 'N ka stock lajɛ',
    french: 'Voir mon stock',
  },
  money: {
    dioula: 'N ka wari lajɛ',
    french: 'Voir mon argent',
  },
  help: {
    dioula: 'Dɛmɛ sɔrɔ',
    french: 'Obtenir de l\'aide',
  },

  // Messages d'alerte
  lowStock: {
    dioula: 'I ka stock banna. I ka wari dɔ fara a kan.',
    french: 'Votre stock est bas. Ajoutez des produits.',
  },

  // Messages de confirmation
  saleSuccess: {
    dioula: 'Feereli kɛra kosɔbɛ. A ni ce!',
    french: 'Vente enregistrée avec succès. Bravo!',
  },
  
  // Messages d'erreur
  error: {
    dioula: 'Fili dɔ bɛ yen. I ka segin ka a lajɛ.',
    french: 'Il y a un problème. Réessayez.',
  },
} as const;

export type VoiceMessageId = keyof typeof VOICE_MESSAGES;

/**
 * Hook pour parler les messages prédéfinis
 */
export function useVoiceMessage() {
  const { speak, ...rest } = useVoice();

  const speakMessage = useCallback((messageId: VoiceMessageId, useDioula = false) => {
    const message = VOICE_MESSAGES[messageId];
    if (!message) return;

    // Pour l'instant, utiliser le français (le Dioula nécessite des enregistrements réels)
    // TODO: Remplacer par des fichiers audio MP3 en Dioula quand disponibles
    const text = useDioula ? message.dioula : message.french;
    speak(text);
  }, [speak]);

  return {
    speakMessage,
    speak,
    ...rest
  };
}
