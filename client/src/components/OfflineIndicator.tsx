import { Wifi, WifiOff, CloudOff } from 'lucide-react';
import { useOffline } from '@/hooks/useOffline';

export default function OfflineIndicator() {
  const { isOnline, pendingSalesCount } = useOffline();

  if (isOnline && pendingSalesCount === 0) {
    return null; // Ne rien afficher si tout va bien
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      {!isOnline && (
        <div className="bg-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-pulse">
          <WifiOff className="w-8 h-8" />
          <div>
            <div className="font-bold text-xl">Mode Hors Ligne</div>
            <div className="text-sm">Les ventes seront synchronisées automatiquement</div>
          </div>
        </div>
      )}

      {isOnline && pendingSalesCount > 0 && (
        <div className="bg-yellow-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
          <CloudOff className="w-8 h-8" />
          <div>
            <div className="font-bold text-xl">Synchronisation en cours...</div>
            <div className="text-sm">{pendingSalesCount} vente(s) en attente</div>
          </div>
        </div>
      )}

      {isOnline && pendingSalesCount === 0 && (
        <div className="bg-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
          <Wifi className="w-8 h-8" />
          <div>
            <div className="font-bold text-xl">En ligne</div>
            <div className="text-sm">Toutes les ventes sont synchronisées</div>
          </div>
        </div>
      )}
    </div>
  );
}
