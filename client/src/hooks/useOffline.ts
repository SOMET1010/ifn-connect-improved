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

export interface TrustToken {
  merchantId: number;
  deviceFingerprint: string;
  score: number;
  issuedAt: number;
  expiresAt: number;
  allowedActions: string[];
  sessionId: string;
  signature: string;
}

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSalesCount, setPendingSalesCount] = useState(0);
  const [hasValidToken, setHasValidToken] = useState(false);

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

    // Vérifie la validité du token au chargement
    checkTokenValidity();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkTokenValidity = async () => {
    const token = await getTrustToken();
    if (token) {
      const isValid = Date.now() < token.expiresAt;
      setHasValidToken(isValid);
    }
  };

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

  const saveTrustToken = async (token: TrustToken): Promise<void> => {
    const db = await openDB();
    const tx = db.transaction('auth-tokens', 'readwrite');
    const store = tx.objectStore('auth-tokens');

    await new Promise<void>((resolve, reject) => {
      const request = store.put({ ...token, id: token.merchantId });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    setHasValidToken(true);
    console.log('[Offline] Trust token saved for merchant', token.merchantId);
  };

  const getTrustToken = async (): Promise<TrustToken | null> => {
    try {
      const db = await openDB();
      const tx = db.transaction('auth-tokens', 'readonly');
      const store = tx.objectStore('auth-tokens');

      return new Promise<TrustToken | null>((resolve) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const tokens = request.result as TrustToken[];
          if (tokens.length > 0) {
            const latestToken = tokens[0];
            if (Date.now() < latestToken.expiresAt) {
              resolve(latestToken);
            } else {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        };
        request.onerror = () => resolve(null);
      });
    } catch (error) {
      console.error('[Offline] Error retrieving trust token:', error);
      return null;
    }
  };

  const clearTrustToken = async (): Promise<void> => {
    try {
      const db = await openDB();
      const tx = db.transaction('auth-tokens', 'readwrite');
      const store = tx.objectStore('auth-tokens');

      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      setHasValidToken(false);
      console.log('[Offline] Trust token cleared');
    } catch (error) {
      console.error('[Offline] Error clearing trust token:', error);
    }
  };

  const getTokenTimeRemaining = async (): Promise<number | null> => {
    const token = await getTrustToken();
    if (!token) return null;

    const remaining = token.expiresAt - Date.now();
    return remaining > 0 ? remaining : null;
  };

  return {
    isOnline,
    pendingSalesCount,
    hasValidToken,
    saveSaleOffline,
    getPendingSales,
    clearPendingSales,
    updatePendingSalesCount,
    saveTrustToken,
    getTrustToken,
    clearTrustToken,
    getTokenTimeRemaining,
  };
}

// Ouvre IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ifn-connect-db', 2);

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

      if (!db.objectStoreNames.contains('auth-tokens')) {
        db.createObjectStore('auth-tokens', { keyPath: 'merchantId' });
      }
    };
  });
}
