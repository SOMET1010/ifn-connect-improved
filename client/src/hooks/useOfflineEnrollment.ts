import { useState, useEffect } from 'react';

export interface PendingEnrollment {
  id?: number;
  data: {
    fullName: string;
    phone: string;
    dateOfBirth: string;
    idPhoto: string;
    licensePhoto: string;
    latitude: number;
    longitude: number;
    marketId: number;
    hasCNPS: boolean;
    cnpsNumber: string;
    hasCMU: boolean;
    cmuNumber: string;
  };
  timestamp: number;
}

export function useOfflineEnrollment() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingEnrollmentsCount, setPendingEnrollmentsCount] = useState(0);

  useEffect(() => {
    // Enregistre le Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[Agent] Service Worker enregistré:', registration.scope);
        })
        .catch((error) => {
          console.error('[Agent] Erreur enregistrement Service Worker:', error);
        });
    }

    // Écoute les changements de connexion
    const handleOnline = () => {
      console.log('[Agent] Connexion rétablie');
      setIsOnline(true);
      // Déclenche la synchronisation
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          // Background Sync API (si disponible)
          if ('sync' in registration) {
            (registration as any).sync.register('sync-enrollments');
          }
        });
      }
    };

    const handleOffline = () => {
      console.log('[Agent] Connexion perdue');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Vérifie le nombre d'enrôlements en attente
    updatePendingEnrollmentsCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updatePendingEnrollmentsCount = async () => {
    const count = await getPendingEnrollmentsCount();
    setPendingEnrollmentsCount(count);
  };

  const saveEnrollmentOffline = async (enrollment: PendingEnrollment['data']) => {
    const db = await openDB();
    const tx = db.transaction('pending-enrollments', 'readwrite');
    const store = tx.objectStore('pending-enrollments');
    
    const pendingEnrollment: PendingEnrollment = {
      data: enrollment,
      timestamp: Date.now(),
    };
    
    await store.add(pendingEnrollment);
    await updatePendingEnrollmentsCount();
    
    console.log('[Offline] Enrôlement sauvegardé localement');
  };

  const getPendingEnrollments = async (): Promise<PendingEnrollment[]> => {
    const db = await openDB();
    const tx = db.transaction('pending-enrollments', 'readonly');
    const store = tx.objectStore('pending-enrollments');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const getPendingEnrollmentsCount = async (): Promise<number> => {
    const db = await openDB();
    const tx = db.transaction('pending-enrollments', 'readonly');
    const store = tx.objectStore('pending-enrollments');
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const clearPendingEnrollments = async () => {
    const db = await openDB();
    const tx = db.transaction('pending-enrollments', 'readwrite');
    const store = tx.objectStore('pending-enrollments');
    await store.clear();
    await updatePendingEnrollmentsCount();
  };

  const deletePendingEnrollment = async (id: number) => {
    const db = await openDB();
    const tx = db.transaction('pending-enrollments', 'readwrite');
    const store = tx.objectStore('pending-enrollments');
    await store.delete(id);
    await updatePendingEnrollmentsCount();
  };

  return {
    isOnline,
    pendingEnrollmentsCount,
    saveEnrollmentOffline,
    getPendingEnrollments,
    clearPendingEnrollments,
    deletePendingEnrollment,
    updatePendingEnrollmentsCount,
  };
}

// Ouvre IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ifn-connect-db', 2); // Version 2 pour ajouter pending-enrollments
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Object store pour les ventes en attente (déjà existant)
      if (!db.objectStoreNames.contains('pending-sales')) {
        db.createObjectStore('pending-sales', { keyPath: 'id', autoIncrement: true });
      }
      
      // Object store pour les produits (déjà existant)
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
      }
      
      // Nouveau : Object store pour les enrôlements en attente
      if (!db.objectStoreNames.contains('pending-enrollments')) {
        db.createObjectStore('pending-enrollments', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}
