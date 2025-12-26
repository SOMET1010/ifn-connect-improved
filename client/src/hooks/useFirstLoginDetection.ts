import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';

/**
 * Hook pour détecter le premier login du jour et rediriger vers le briefing matinal
 * Utilisé dans le DashboardLayout pour tous les marchands
 */
export function useFirstLoginDetection() {
  const [location, setLocation] = useLocation();
  const [hasChecked, setHasChecked] = useState(false);

  // Vérifier le premier login du jour
  const { data: loginCheck, isLoading } = trpc.auth.checkFirstLoginToday.useQuery(undefined, {
    enabled: !hasChecked,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    // Ne rien faire si on est déjà sur la page de briefing
    if (location === '/merchant/morning-briefing') {
      setHasChecked(true);
      return;
    }

    // Si c'est le premier login et qu'on doit afficher le briefing
    if (loginCheck?.shouldShowBriefing && !hasChecked) {
      setHasChecked(true);
      
      // Rediriger vers le briefing matinal
      setLocation('/merchant/morning-briefing');
    } else if (loginCheck && !loginCheck.shouldShowBriefing) {
      setHasChecked(true);
    }
  }, [loginCheck, hasChecked, setLocation, location]);

  return {
    isChecking: isLoading,
    shouldShowBriefing: loginCheck?.shouldShowBriefing || false,
    isFirstLogin: loginCheck?.isFirstLogin || false,
  };
}
