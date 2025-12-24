import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useVoiceRecognition, parseVoiceCommand } from '@/hooks/useVoiceRecognition';
import { audioManager, SupportedLanguage } from '@/lib/audioManager';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VoiceCommandButtonProps {
  language?: SupportedLanguage;
  onCommand: (intent: string, entities: any) => void;
  continuous?: boolean;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

/**
 * Bouton de commande vocale avec reconnaissance et parsing
 * Support Dioula et Français
 */
export default function VoiceCommandButton({
  language = 'fr',
  onCommand,
  continuous = false,
  size = 'default',
  variant = 'default',
  className,
}: VoiceCommandButtonProps) {
  const {
    isListening,
    transcript,
    confidence,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition(language, continuous);

  // Traiter le transcript quand il change
  useEffect(() => {
    if (transcript && !isListening && confidence > 0.5) {
      const command = parseVoiceCommand(transcript, language);
      
      if (command.intent !== 'unknown' && command.confidence > 0.7) {
        // Commande reconnue
        audioManager.provideFeedback('success');
        onCommand(command.intent, command.entities);
        
        // Annoncer la commande
        audioManager.speak(`Commande reconnue: ${command.intent}`);
        
        // Toast de confirmation
        toast.success('Commande vocale reconnue', {
          description: transcript,
        });
      } else {
        // Commande non reconnue
        audioManager.provideFeedback('error');
        toast.error('Commande non reconnue', {
          description: 'Veuillez réessayer ou reformuler votre demande',
        });
      }

      // Réinitialiser après traitement
      setTimeout(() => {
        resetTranscript();
      }, 2000);
    }
  }, [transcript, isListening, confidence, language, onCommand, resetTranscript]);

  // Afficher les erreurs
  useEffect(() => {
    if (error) {
      toast.error('Erreur de reconnaissance vocale', {
        description: error,
      });
    }
  }, [error]);

  const handleClick = () => {
    if (!isSupported) {
      toast.error('Reconnaissance vocale non disponible', {
        description: 'Votre navigateur ne supporte pas la reconnaissance vocale',
      });
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const sizeClasses = {
    sm: 'h-8 w-8',
    default: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const iconSizes = {
    sm: 16,
    default: 20,
    lg: 24,
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant={variant}
        size="icon"
        className={cn(
          sizeClasses[size],
          'rounded-full transition-all',
          isListening && 'bg-destructive text-destructive-foreground animate-pulse-soft',
          !isSupported && 'opacity-50 cursor-not-allowed',
          className
        )}
        onClick={handleClick}
        disabled={!isSupported}
        aria-label={isListening ? 'Arrêter l\'écoute' : 'Commande vocale'}
        title={isListening ? 'Arrêter' : 'Parler'}
      >
        {isListening ? (
          <Mic size={iconSizes[size]} className="animate-pulse" />
        ) : !isSupported ? (
          <MicOff size={iconSizes[size]} />
        ) : (
          <Mic size={iconSizes[size]} />
        )}
      </Button>

      {/* Indicateur de transcription en cours */}
      {isListening && (
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg shadow-lg">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">
              Je vous écoute...
            </span>
          </div>
        </div>
      )}

      {/* Affichage du transcript */}
      {transcript && !isListening && (
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-64">
          <div className="px-3 py-2 bg-card border border-border rounded-lg shadow-lg">
            <p className="text-xs text-foreground line-clamp-2">
              {transcript}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {Math.round(confidence * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
