import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, X } from 'lucide-react';

interface VoiceInputCardProps {
  show: boolean;
  transcript: string;
  isListening: boolean;
  onStop: () => void;
}

export default function VoiceInputCard({
  show,
  transcript,
  isListening,
  onStop,
}: VoiceInputCardProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 space-y-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <Mic className={`w-10 h-10 text-red-600 ${isListening ? 'animate-pulse' : ''}`} />
          </div>
          <h3 className="text-xl font-bold mb-2">Commande vocale</h3>
          <p className="text-sm text-muted-foreground">
            Dictez votre vente...
          </p>
        </div>

        <div className="bg-gray-100 rounded-lg p-4 min-h-[100px]">
          <p className="text-lg text-center">
            {transcript || 'En attente...'}
          </p>
        </div>

        <Button
          onClick={onStop}
          variant="destructive"
          className="w-full"
        >
          <X className="w-5 h-5 mr-2" />
          Arrêter
        </Button>
      </Card>
    </div>
  );
}
