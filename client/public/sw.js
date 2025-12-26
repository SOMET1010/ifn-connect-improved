// Service Worker pour IFN Connect - Mode Hors Ligne
const CACHE_VERSION = 'ifn-connect-v1';
const CACHE_URLS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installation en cours...');
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log('[SW] Cache ouvert');
      return cache.addAll(CACHE_URLS);
    })
  );
  // Force l'activation immédiate
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation en cours...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_VERSION) {
            console.log('[SW] Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Prend le contrôle immédiatement
  return self.clients.claim();
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Stratégie Network First pour les API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone la réponse pour la mettre en cache
          const responseClone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Si offline, retourne depuis le cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Retourne une réponse par défaut si pas en cache
            return new Response(
              JSON.stringify({ error: 'Offline', offline: true }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          });
        })
    );
    return;
  }

  // Stratégie Cache First pour les assets statiques
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((response) => {
        // Ne cache que les réponses OK
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  console.log('[SW] Synchronisation en cours:', event.tag);
  if (event.tag === 'sync-sales') {
    event.waitUntil(syncPendingSales());
  }
  if (event.tag === 'sync-enrollments') {
    event.waitUntil(syncPendingEnrollments());
  }
});

// Fonction de synchronisation des ventes
async function syncPendingSales() {
  console.log('[SW] Synchronisation des ventes en attente...');
  
  // Ouvre IndexedDB pour récupérer les ventes en attente
  const db = await openDB();
  const tx = db.transaction('pending-sales', 'readonly');
  const store = tx.objectStore('pending-sales');
  const pendingSales = await store.getAll();
  
  console.log('[SW] Ventes en attente:', pendingSales.length);
  
  // Envoie chaque vente au serveur
  for (const sale of pendingSales) {
    try {
      const response = await fetch('/api/trpc/sales.create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sale.data),
      });
      
      if (response.ok) {
        // Supprime la vente de la file d'attente
        const deleteTx = db.transaction('pending-sales', 'readwrite');
        const deleteStore = deleteTx.objectStore('pending-sales');
        await deleteStore.delete(sale.id);
        console.log('[SW] Vente synchronisée:', sale.id);
      }
    } catch (error) {
      console.error('[SW] Erreur synchronisation vente:', error);
    }
  }
}

// Fonction de synchronisation des enrôlements
async function syncPendingEnrollments() {
  console.log('[SW] Synchronisation des enrôlements en attente...');
  
  // Ouvre IndexedDB pour récupérer les enrôlements en attente
  const db = await openDB();
  const tx = db.transaction('pending-enrollments', 'readonly');
  const store = tx.objectStore('pending-enrollments');
  const pendingEnrollments = await store.getAll();
  
  console.log('[SW] Enrôlements en attente:', pendingEnrollments.length);
  
  // Envoie chaque enrôlement au serveur
  for (const enrollment of pendingEnrollments) {
    try {
      const response = await fetch('/api/trpc/agent.enrollMerchant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enrollment.data),
      });
      
      if (response.ok) {
        // Supprime l'enrôlement de la file d'attente
        const deleteTx = db.transaction('pending-enrollments', 'readwrite');
        const deleteStore = deleteTx.objectStore('pending-enrollments');
        await deleteStore.delete(enrollment.id);
        console.log('[SW] Enrôlement synchronisé:', enrollment.id);
      }
    } catch (error) {
      console.error('[SW] Erreur synchronisation enrôlement:', error);
    }
  }
}

// Ouvre IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ifn-connect-db', 2); // Version 2 pour ajouter pending-enrollments
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-sales')) {
        db.createObjectStore('pending-sales', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending-enrollments')) {
        db.createObjectStore('pending-enrollments', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}
