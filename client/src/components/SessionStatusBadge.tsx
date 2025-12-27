import { trpc } from '@/lib/trpc';
import { Badge } from '@/components/ui/badge';
import { Sunrise, Moon, Clock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Badge de statut de la session quotidienne
 * Affiche si la journée est ouverte, fermée, ou pas encore ouverte
 * Permet d'ouvrir/fermer/rouvrir la journée via un menu dropdown
 */
export function SessionStatusBadge() {
  const { data, isLoading } = trpc.dailySessions.getToday.useQuery();
  const session = data?.session;
  const status = data?.status || 'NOT_OPENED';
  const utils = trpc.useUtils();

  const handleOpenDay = () => {
    // Rediriger vers la page de briefing matinal
    window.location.href = '/merchant/morning-briefing';
  };

  const handleCloseDay = () => {
    // Rediriger vers la page de bilan de journée
    window.location.href = '/merchant/evening-summary';
  };

  const handleReopenDay = async () => {
    try {
      await utils.client.dailySessions.reopen.mutate();
      await utils.dailySessions.getToday.invalidate();
    } catch (error) {
      console.error('Erreur lors de la réouverture:', error);
    }
  };

  if (isLoading || !session) {
    return (
      <Badge variant="outline" className="gap-2">
        <Clock className="h-4 w-4" />
        <span>Chargement...</span>
      </Badge>
    );
  }

  const { openedAt } = session;

  // Calculer la durée d'ouverture si la journée est ouverte
  const duration = openedAt
    ? Math.floor((Date.now() - new Date(openedAt).getTime()) / 1000 / 60 / 60) // Heures
    : 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="focus:outline-none">
          {status === 'NOT_OPENED' && (
            <Badge variant="secondary" className="gap-2 cursor-pointer hover:bg-secondary/80">
              <Moon className="h-4 w-4" />
              <span>Journée fermée</span>
            </Badge>
          )}
          {status === 'OPENED' && (
            <Badge variant="default" className="gap-2 cursor-pointer bg-green-600 hover:bg-green-700">
              <Sunrise className="h-4 w-4" />
              <span>Journée ouverte</span>
            </Badge>
          )}
          {status === 'CLOSED' && (
            <Badge variant="secondary" className="gap-2 cursor-pointer hover:bg-secondary/80">
              <Moon className="h-4 w-4" />
              <span>Journée fermée</span>
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {status === 'NOT_OPENED' && (
          <DropdownMenuItem onClick={handleOpenDay} className="cursor-pointer">
            <Sunrise className="mr-2 h-4 w-4" />
            <span>Ouvrir ma journée</span>
          </DropdownMenuItem>
        )}
        {status === 'OPENED' && (
          <>
            <DropdownMenuItem disabled className="text-muted-foreground">
              <Clock className="mr-2 h-4 w-4" />
              <span>Durée : {duration}h</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCloseDay} className="cursor-pointer">
              <Moon className="mr-2 h-4 w-4" />
              <span>Fermer ma journée</span>
            </DropdownMenuItem>
          </>
        )}
        {status === 'CLOSED' && (
          <DropdownMenuItem onClick={handleReopenDay} className="cursor-pointer">
            <Sunrise className="mr-2 h-4 w-4" />
            <span>Rouvrir ma journée</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
