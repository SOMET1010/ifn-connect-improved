import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from './useLanguage';

export interface SpeechOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export function useSpeech() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const queueRef = useRef<Array<{ text: string; options?: SpeechOptions }>>([]);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Vérifie si l'API est disponible
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      console.log('[Speech] Web Speech API disponible');
    } else {
      console.warn('[Speech] Web Speech API non disponible');
    }

    // Récupère les préférences depuis localStorage
    const savedEnabled = localStorage.getItem('speech-enabled');
    if (savedEnabled !== null) {
      setIsEnabled(savedEnabled === 'true');
    }

    return () => {
      // Nettoie en cas de démontage
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string, options?: SpeechOptions) => {
    if (!isSupported || !isEnabled) {
      console.log('[Speech] Désactivé ou non supporté');
      return;
    }

    // Ajoute à la file d'attente
    queueRef.current.push({ text, options });

    // Si pas en train de parler, commence
    if (!isSpeaking) {
      processQueue();
    }
  }, [isSupported, isEnabled, isSpeaking]);

  const processQueue = useCallback(() => {
    if (queueRef.current.length === 0) {
      setIsSpeaking(false);
      return;
    }

    const { text, options } = queueRef.current.shift()!;
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    currentUtteranceRef.current = utterance;

    // Configure les options
    utterance.lang = options?.lang || 'fr-FR';
    utterance.rate = options?.rate || 1.0;
    utterance.pitch = options?.pitch || 1.0;
    utterance.volume = options?.volume || 1.0;

    utterance.onend = () => {
      console.log('[Speech] Terminé:', text);
      currentUtteranceRef.current = null;
      // Traite le prochain message dans la file
      setTimeout(() => processQueue(), 100);
    };

    utterance.onerror = (event) => {
      console.error('[Speech] Erreur:', event.error);
      currentUtteranceRef.current = null;
      setIsSpeaking(false);
      // Continue avec le prochain message
      setTimeout(() => processQueue(), 100);
    };

    console.log('[Speech] Annonce:', text);
    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      queueRef.current = [];
      currentUtteranceRef.current = null;
      setIsSpeaking(false);
      console.log('[Speech] Arrêté');
    }
  }, []);

  const toggle = useCallback(() => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    localStorage.setItem('speech-enabled', String(newEnabled));
    console.log('[Speech] Activé:', newEnabled);
    
    if (!newEnabled) {
      stop();
    }
  }, [isEnabled, stop]);

  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    localStorage.setItem('speech-enabled', String(enabled));
    console.log('[Speech] Activé:', enabled);
    
    if (!enabled) {
      stop();
    }
  }, [stop]);

  // Hook de langue pour les traductions
  const { getSaleMessage, t } = useLanguage();

  // Fonctions utilitaires pour annoncer des montants
  const speakAmount = useCallback((amount: number, options?: SpeechOptions) => {
    const formattedAmount = new Intl.NumberFormat('fr-FR').format(amount);
    speak(`${formattedAmount} ${t('francsCFA')}`, options);
  }, [speak, t]);

  const speakSaleSuccess = useCallback((amount: number, options?: SpeechOptions) => {
    const message = getSaleMessage(amount);
    speak(message, options);
  }, [speak, getSaleMessage]);

  const speakError = useCallback((message: string, options?: SpeechOptions) => {
    speak(`${t('error')}. ${message}`, options);
  }, [speak, t]);

  const speakAlert = useCallback((message: string, options?: SpeechOptions) => {
    speak(`${t('attention')}. ${message}`, options);
  }, [speak, t]);

  return {
    isSupported,
    isSpeaking,
    isEnabled,
    speak,
    stop,
    toggle,
    setEnabled,
    speakAmount,
    speakSaleSuccess,
    speakError,
    speakAlert,
  };
}
