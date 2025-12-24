import { Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';
import { audioManager } from '@/lib/audioManager';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AudioButtonProps {
  instructionKey: string;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  showLabel?: boolean;
}

/**
 * Bouton audio pour lire une instruction vocale
 * Fournit un feedback visuel et tactile lors de la lecture
 */
export default function AudioButton({
  instructionKey,
  size = 'default',
  variant = 'outline',
  className,
  showLabel = false,
}: AudioButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher la propagation du clic

    if (isPlaying) {
      audioManager.stopAudio();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    audioManager.provideFeedback('tap');
    
    try {
      await audioManager.playInstruction(instructionKey);
    } catch (error) {
      console.error('Audio playback error:', error);
    } finally {
      setIsPlaying(false);
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
    <Button
      type="button"
      variant={variant}
      size="icon"
      className={cn(
        sizeClasses[size],
        'rounded-full transition-all',
        isPlaying && 'animate-pulse-soft bg-primary text-primary-foreground',
        className
      )}
      onClick={handleClick}
      aria-label={isPlaying ? 'Arrêter la lecture' : 'Écouter l\'instruction'}
      title={isPlaying ? 'Arrêter' : 'Écouter'}
    >
      {isPlaying ? (
        <VolumeX size={iconSizes[size]} />
      ) : (
        <Volume2 size={iconSizes[size]} />
      )}
      {showLabel && (
        <span className="ml-2 text-sm">
          {isPlaying ? 'Lecture...' : 'Écouter'}
        </span>
      )}
    </Button>
  );
}
