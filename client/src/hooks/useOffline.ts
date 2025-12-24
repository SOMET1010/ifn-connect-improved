import { useState, useEffect } from 'react';

export interface PendingSale {
  id?: number;
  data: {
    merchantId: number;
    items: Array<{
      productId: number;
      quantity: number;
      unitPrice: number;
    }>;
    totalAmount: number;
    createdAt: string;
  };
  timestamp: number;
}

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSalesCount, setPendingSalesCount] = useState(0);

  useEffect(() => {
    // Enregistre le Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[App] Service Worker enregistré:', registration.scope);
        })
        .catch((error) => {
          console.error('[App] Erreur enregistrement Service Worker:', error);
        });
    }

    // Écoute les changements de connexion
    const handleOnline = () => {
      console.log('[App] Connexion rétablie');
      setIsOnline(true);
      // Déclenche la synchronisation
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          // Background Sync API (si disponible)
          if ('sync' in registration) {
            (registration as any).sync.register('sync-sales');
          }
        });
      }
    };

    const handleOffline = () => {
      console.log('[App] Connexion perdue');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Vérifie le nombre de ventes en attente
    updatePendingSalesCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updatePendingSalesCount = async () => {
    const count = await getPendingSalesCount();
    setPendingSalesCount(count);
  };

  const saveSaleOffline = async (sale: PendingSale['data']) => {
    const db = await openDB();
    const tx = db.transaction('pending-sales', 'readwrite');
    const store = tx.objectStore('pending-sales');
    
    const pendingSale: PendingSale = {
      data: sale,
      timestamp: Date.now(),
    };
    
    await store.add(pendingSale);
    await updatePendingSalesCount();
    
    console.log('[Offline] Vente sauvegardée localement');
  };

  const getPendingSales = async (): Promise<PendingSale[]> => {
    const db = await openDB();
    const tx = db.transaction('pending-sales', 'readonly');
    const store = tx.objectStore('pending-sales');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const getPendingSalesCount = async (): Promise<number> => {
    const db = await openDB();
    const tx = db.transaction('pending-sales', 'readonly');
    const store = tx.objectStore('pending-sales');
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const clearPendingSales = async () => {
    const db = await openDB();
    const tx = db.transaction('pending-sales', 'readwrite');
    const store = tx.objectStore('pending-sales');
    await store.clear();
    await updatePendingSalesCount();
  };

  return {
    isOnline,
    pendingSalesCount,
    saveSaleOffline,
    getPendingSales,
    clearPendingSales,
    updatePendingSalesCount,
  };
}

// Ouvre IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ifn-connect-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('pending-sales')) {
        db.createObjectStore('pending-sales', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
      }
    };
  });
}
