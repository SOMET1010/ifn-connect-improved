import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Sunrise } from 'lucide-react';
import { useLocation } from 'wouter';

/**
 * Bouton géant "Ouvrir ma journée" affiché sur le dashboard
 * Uniquement visible si la journée n'est pas encore ouverte
 */
export function OpenDayButton() {
  const [, setLocation] = useLocation();
  const { data: session, isLoading } = trpc.dailySessions.getCurrent.useQuery();

  if (isLoading || !session) {
    return null;
  }

  // N'afficher le bouton que si la journée n'est pas ouverte
  if (session.status !== 'NOT_OPENED') {
    return null;
  }

  const handleClick = () => {
    setLocation('/merchant/morning-briefing');
  };

  return (
    <div className="w-full flex justify-center py-8">
      <Button
        onClick={handleClick}
        size="lg"
        className="h-32 w-full max-w-2xl text-4xl font-bold bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500 hover:from-orange-600 hover:via-yellow-600 hover:to-orange-600 text-white shadow-2xl transform transition-all hover:scale-105"
      >
        <Sunrise className="mr-4 h-16 w-16" />
        Ouvrir ma journée
      </Button>
    </div>
  );
}
