import { Volume2, VolumeX } from 'lucide-react';
import { useSpeech } from '@/hooks/useSpeech';
import { Button } from '@/components/ui/button';

export default function SpeechToggle() {
  const { isSupported, isEnabled, toggle, speak } = useSpeech();

  if (!isSupported) {
    return null; // Ne rien afficher si l'API n'est pas supportée
  }

  const handleToggle = () => {
    toggle();
    
    // Annonce vocale de confirmation
    if (!isEnabled) {
      setTimeout(() => {
        speak('Annonces vocales activées');
      }, 100);
    }
  };

  return (
    <Button
      variant={isEnabled ? 'default' : 'outline'}
      size="lg"
      onClick={handleToggle}
      className="gap-3"
    >
      {isEnabled ? (
        <>
          <Volume2 className="w-6 h-6" />
          <span>Son activé</span>
        </>
      ) : (
        <>
          <VolumeX className="w-6 h-6" />
          <span>Son désactivé</span>
        </>
      )}
    </Button>
  );
}
