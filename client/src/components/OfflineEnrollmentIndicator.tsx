import { Wifi, WifiOff, CloudOff } from 'lucide-react';
import { useOfflineEnrollment } from '@/hooks/useOfflineEnrollment';

export function OfflineEnrollmentIndicator() {
  const { isOnline, pendingEnrollmentsCount } = useOfflineEnrollment();

  // Masquer si en ligne et aucun enrôlement en attente
  if (isOnline && pendingEnrollmentsCount === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Hors ligne */}
      {!isOnline && (
        <div className="bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl animate-pulse">
          <div className="flex items-center gap-3">
            <WifiOff className="h-6 w-6" />
            <div>
              <p className="font-bold text-xl">Mode Hors Ligne</p>
              <p className="text-sm">Les enrôlements seront synchronisés automatiquement</p>
            </div>
          </div>
        </div>
      )}

      {/* En ligne mais avec enrôlements en attente */}
      {isOnline && pendingEnrollmentsCount > 0 && (
        <div className="bg-yellow-500 text-white px-6 py-4 rounded-xl shadow-2xl">
          <div className="flex items-center gap-3">
            <CloudOff className="h-6 w-6" />
            <div>
              <p className="font-bold text-xl">Synchronisation en cours...</p>
              <p className="text-sm">
                {pendingEnrollmentsCount} enrôlement{pendingEnrollmentsCount > 1 ? 's' : ''} en attente
              </p>
            </div>
          </div>
        </div>
      )}

      {/* En ligne après synchronisation (affichage temporaire) */}
      {isOnline && pendingEnrollmentsCount === 0 && (
        <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl">
          <div className="flex items-center gap-3">
            <Wifi className="h-6 w-6" />
            <div>
              <p className="font-bold text-xl">Synchronisé</p>
              <p className="text-sm">Tous les enrôlements ont été envoyés</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
