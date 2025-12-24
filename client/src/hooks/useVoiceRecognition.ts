import { useState, useEffect, useCallback, useRef } from 'react';

// Déclaration des types pour Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export type VoiceRecognitionState = 'idle' | 'listening' | 'processing' | 'error';

interface UseVoiceRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export function useVoiceRecognition(options: UseVoiceRecognitionOptions = {}) {
  const {
    language = 'fr-FR',
    continuous = false,
    interimResults = true,
    onResult,
    onError,
  } = options;

  const [state, setState] = useState<VoiceRecognitionState>('idle');
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Vérifier si Web Speech API est supporté
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;

      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = language;

      recognition.onstart = () => {
        setState('listening');
      };

      recognition.onend = () => {
        setState('idle');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptPart = result[0].transcript;

          if (result.isFinal) {
            finalTranscript += transcriptPart + ' ';
          } else {
            interimTranscript += transcriptPart;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript.trim());

        if (onResult) {
          onResult(currentTranscript.trim(), !!finalTranscript);
        }

        if (finalTranscript) {
          setState('processing');
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setState('error');
        
        let errorMessage = 'Erreur de reconnaissance vocale';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'Aucune parole détectée. Veuillez réessayer.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone non disponible.';
            break;
          case 'not-allowed':
            errorMessage = 'Permission microphone refusée.';
            break;
          case 'network':
            errorMessage = 'Erreur réseau. Vérifiez votre connexion.';
            break;
        }

        if (onError) {
          onError(errorMessage);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language, continuous, interimResults, onResult, onError]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      if (onError) {
        onError('La reconnaissance vocale n\'est pas supportée par votre navigateur.');
      }
      return;
    }

    if (recognitionRef.current && state === 'idle') {
      setTranscript('');
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
        if (onError) {
          onError('Impossible de démarrer la reconnaissance vocale.');
        }
      }
    }
  }, [isSupported, state, onError]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && state === 'listening') {
      recognitionRef.current.stop();
    }
  }, [state]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setState('idle');
  }, []);

  return {
    isSupported,
    state,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  };
}
