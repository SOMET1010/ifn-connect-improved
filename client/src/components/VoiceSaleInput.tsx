import { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceSaleInputProps {
  products: Array<{ id: number; name: string }>;
  onVoiceCommand: (productId: number, quantity: number) => void;
  language: string;
}

/**
 * Composant d'enregistrement vocal pour les ventes
 * Supporte Français et Dioula
 */
export function VoiceSaleInput({ products, onVoiceCommand, language }: VoiceSaleInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Vérifier si le navigateur supporte la reconnaissance vocale
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = language === 'fr' ? 'fr-FR' : 'fr-FR'; // Dioula pas supporté, on utilise FR
      
      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        setTranscript(transcript);
        processVoiceCommand(transcript);
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Erreur de reconnaissance vocale:', event.error);
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, [language]);

  const processVoiceCommand = (transcript: string) => {
    // Extraire la quantité (chercher un nombre)
    const quantityMatch = transcript.match(/(\d+)/);
    if (!quantityMatch) {
      speak("Je n'ai pas compris la quantité. Répétez s'il vous plaît.");
      return;
    }
    
    const quantity = parseInt(quantityMatch[1]);
    
    // Chercher le produit mentionné
    const foundProduct = products.find(p => 
      transcript.includes(p.name.toLowerCase())
    );
    
    if (foundProduct) {
      onVoiceCommand(foundProduct.id, quantity);
      speak(`Vente enregistrée : ${quantity} ${foundProduct.name}`);
    } else {
      speak("Je n'ai pas trouvé ce produit. Répétez s'il vous plaît.");
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'fr' ? 'fr-FR' : 'fr-FR';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    if (recognition) {
      setTranscript('');
      recognition.start();
      setIsListening(true);
      speak("Je vous écoute. Dites par exemple : vendre 3 sacs de riz");
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        onClick={isListening ? stopListening : startListening}
        size="lg"
        className={`h-24 w-24 rounded-full ${
          isListening 
            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isListening ? (
          <MicOff className="h-12 w-12" />
        ) : (
          <Mic className="h-12 w-12" />
        )}
      </Button>
      
      {transcript && (
        <div className="text-center p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-600">Vous avez dit :</p>
          <p className="text-lg font-bold">{transcript}</p>
        </div>
      )}
      
      <p className="text-sm text-gray-600 text-center">
        {isListening ? (
          <span className="text-red-500 font-bold">🎤 En écoute...</span>
        ) : (
          "Cliquez sur le micro pour parler"
        )}
      </p>
    </div>
  );
}
