import { useState, useEffect, useCallback, useRef } from 'react';
import { audioManager, SupportedLanguage } from '@/lib/audioManager';

interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

interface UseVoiceRecognitionReturn {
  isListening: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

/**
 * Hook pour la reconnaissance vocale en Dioula et Français
 * Utilise l'API Web Speech Recognition du navigateur
 */
export function useVoiceRecognition(
  language: SupportedLanguage = 'fr',
  continuous: boolean = false
): UseVoiceRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Vérifier le support de l'API
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
    } else {
      setIsSupported(false);
      setError('La reconnaissance vocale n\'est pas supportée par ce navigateur');
    }
  }, []);

  // Configurer la reconnaissance vocale
  useEffect(() => {
    if (!recognitionRef.current) return;

    const recognition = recognitionRef.current;

    // Configuration
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // Langue selon le paramètre
    // Note: Web Speech API ne supporte pas directement les langues locales
    // On utilise fr-FR comme base et on traitera les expressions locales côté serveur
    recognition.lang = language === 'fr' ? 'fr-FR' : 'fr-FR';

    // Événements
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      audioManager.provideFeedback('tap');
      audioManager.playInstruction('listening');
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      let maxConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptPart = result[0].transcript;
        const confidenceValue = result[0].confidence;

        if (result.isFinal) {
          finalTranscript += transcriptPart + ' ';
          maxConfidence = Math.max(maxConfidence, confidenceValue);
        } else {
          interimTranscript += transcriptPart;
        }
      }

      const fullTranscript = (finalTranscript + interimTranscript).trim();
      setTranscript(fullTranscript);
      setConfidence(maxConfidence);

      // Feedback audio pour confirmation
      if (finalTranscript) {
        audioManager.provideFeedback('success');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      let errorMessage = 'Erreur de reconnaissance vocale';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'Aucune parole détectée. Veuillez réessayer.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone non disponible. Vérifiez les permissions.';
          break;
        case 'not-allowed':
          errorMessage = 'Permission microphone refusée. Autorisez l\'accès au microphone.';
          break;
        case 'network':
          errorMessage = 'Erreur réseau. Vérifiez votre connexion.';
          break;
        case 'aborted':
          errorMessage = 'Reconnaissance vocale interrompue.';
          break;
      }

      setError(errorMessage);
      setIsListening(false);
      audioManager.provideFeedback('error');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [language, continuous]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      setError('Reconnaissance vocale non disponible');
      return;
    }

    try {
      setError(null);
      setTranscript('');
      setConfidence(0);
      recognitionRef.current.start();
    } catch (err) {
      console.error('Error starting recognition:', err);
      setError('Impossible de démarrer la reconnaissance vocale');
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    confidence,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}

/**
 * Parser pour les commandes vocales en Dioula et Français
 * Extrait les intentions et entités des transcriptions
 */
export function parseVoiceCommand(transcript: string, language: SupportedLanguage = 'fr') {
  const lowerTranscript = transcript.toLowerCase().trim();

  // Patterns de commandes en français
  const frenchPatterns = {
    sell: /(?:vendre|vends|vendu|vente)\s+(\d+)\s+(?:tas|sac|paquet|kilo|kg)?\s*(?:de|d')?\s*(.+)/i,
    stock: /(?:ajouter|ajout|stock)\s+(\d+)\s+(?:tas|sac|paquet|kilo|kg)?\s*(?:de|d')?\s*(.+)/i,
    checkStock: /(?:combien|stock|reste)\s+(?:de|d')?\s*(.+)/i,
    sendMoney: /(?:envoyer|envoi|transfert)\s+(\d+)\s+(?:francs?|fcfa|f)?\s+(?:à|a)\s+(.+)/i,
    help: /(?:aide|aidez|aider|comment|expliquer)/i,
  };

  // Patterns de commandes en Dioula
  const dioulaPatterns = {
    sell: /(?:vendre|vends)\s+(\d+)\s+(?:tas|sac)?\s*(.+)/i,
    stock: /(?:ajouter|stock)\s+(\d+)\s+(?:tas|sac)?\s*(.+)/i,
    checkStock: /(?:combien|stock)\s+(.+)/i,
    sendMoney: /(?:envoyer\s+wari|wari)\s+(\d+)\s+(?:à|a)\s+(.+)/i,
    help: /(?:aide|dèmè)/i,
  };

  const patterns = language === 'dioula' ? dioulaPatterns : frenchPatterns;

  // Vendre
  let match = lowerTranscript.match(patterns.sell);
  if (match) {
    return {
      intent: 'sell',
      entities: {
        quantity: parseInt(match[1]),
        product: match[2]?.trim() || '',
      },
      confidence: 0.9,
    };
  }

  // Ajouter au stock
  match = lowerTranscript.match(patterns.stock);
  if (match) {
    return {
      intent: 'addStock',
      entities: {
        quantity: parseInt(match[1]),
        product: match[2]?.trim() || '',
      },
      confidence: 0.9,
    };
  }

  // Vérifier le stock
  match = lowerTranscript.match(patterns.checkStock);
  if (match) {
    return {
      intent: 'checkStock',
      entities: {
        product: match[1]?.trim() || '',
      },
      confidence: 0.85,
    };
  }

  // Envoyer de l'argent
  match = lowerTranscript.match(patterns.sendMoney);
  if (match) {
    return {
      intent: 'sendMoney',
      entities: {
        amount: parseInt(match[1]),
        recipient: match[2]?.trim() || '',
      },
      confidence: 0.9,
    };
  }

  // Aide
  if (patterns.help.test(lowerTranscript)) {
    return {
      intent: 'help',
      entities: {},
      confidence: 0.95,
    };
  }

  // Commande non reconnue
  return {
    intent: 'unknown',
    entities: { rawText: transcript },
    confidence: 0.3,
  };
}
