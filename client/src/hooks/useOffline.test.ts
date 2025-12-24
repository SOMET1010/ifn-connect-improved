import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Mode Hors Ligne - IndexedDB', () => {
  let db: IDBDatabase;

  beforeEach(async () => {
    // Ouvre la base de données
    db = await openDB();
  });

  afterEach(async () => {
    // Nettoie la base de données après chaque test
    if (db) {
      const tx = db.transaction('pending-sales', 'readwrite');
      const store = tx.objectStore('pending-sales');
      await store.clear();
      db.close();
    }
  });

  it('devrait sauvegarder une vente localement', async () => {
    const tx = db.transaction('pending-sales', 'readwrite');
    const store = tx.objectStore('pending-sales');

    const pendingSale = {
      data: {
        merchantId: 1,
        items: [{
          productId: 1,
          quantity: 2,
          unitPrice: 1000,
        }],
        totalAmount: 2000,
        createdAt: new Date().toISOString(),
      },
      timestamp: Date.now(),
    };

    const request = store.add(pendingSale);
    
    await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Vérifie que la vente a été ajoutée
    const countRequest = store.count();
    const count = await new Promise<number>((resolve, reject) => {
      countRequest.onsuccess = () => resolve(countRequest.result);
      countRequest.onerror = () => reject(countRequest.error);
    });

    expect(count).toBe(1);
  });

  it('devrait récupérer toutes les ventes en attente', async () => {
    const tx = db.transaction('pending-sales', 'readwrite');
    const store = tx.objectStore('pending-sales');

    // Ajoute 3 ventes
    const sales = [
      {
        data: {
          merchantId: 1,
          items: [{ productId: 1, quantity: 1, unitPrice: 1000 }],
          totalAmount: 1000,
          createdAt: new Date().toISOString(),
        },
        timestamp: Date.now(),
      },
      {
        data: {
          merchantId: 1,
          items: [{ productId: 2, quantity: 2, unitPrice: 500 }],
          totalAmount: 1000,
          createdAt: new Date().toISOString(),
        },
        timestamp: Date.now(),
      },
      {
        data: {
          merchantId: 1,
          items: [{ productId: 3, quantity: 3, unitPrice: 333 }],
          totalAmount: 999,
          createdAt: new Date().toISOString(),
        },
        timestamp: Date.now(),
      },
    ];

    for (const sale of sales) {
      await new Promise((resolve, reject) => {
        const request = store.add(sale);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    // Récupère toutes les ventes
    const getAllRequest = store.getAll();
    const allSales = await new Promise<any[]>((resolve, reject) => {
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });

    expect(allSales.length).toBe(3);
    expect(allSales[0].data.merchantId).toBe(1);
    expect(allSales[1].data.totalAmount).toBe(1000);
  });

  it('devrait compter les ventes en attente', async () => {
    const tx = db.transaction('pending-sales', 'readwrite');
    const store = tx.objectStore('pending-sales');

    // Ajoute 5 ventes
    for (let i = 0; i < 5; i++) {
      const sale = {
        data: {
          merchantId: 1,
          items: [{ productId: i + 1, quantity: 1, unitPrice: 1000 }],
          totalAmount: 1000,
          createdAt: new Date().toISOString(),
        },
        timestamp: Date.now(),
      };
      
      await new Promise((resolve, reject) => {
        const request = store.add(sale);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    // Compte les ventes
    const countRequest = store.count();
    const count = await new Promise<number>((resolve, reject) => {
      countRequest.onsuccess = () => resolve(countRequest.result);
      countRequest.onerror = () => reject(countRequest.error);
    });

    expect(count).toBe(5);
  });

  it('devrait supprimer une vente après synchronisation', async () => {
    const tx = db.transaction('pending-sales', 'readwrite');
    const store = tx.objectStore('pending-sales');

    // Ajoute une vente
    const sale = {
      data: {
        merchantId: 1,
        items: [{ productId: 1, quantity: 1, unitPrice: 1000 }],
        totalAmount: 1000,
        createdAt: new Date().toISOString(),
      },
      timestamp: Date.now(),
    };

    const addRequest = store.add(sale);
    const saleId = await new Promise<number>((resolve, reject) => {
      addRequest.onsuccess = () => resolve(addRequest.result as number);
      addRequest.onerror = () => reject(addRequest.error);
    });

    // Vérifie qu'elle existe
    let countRequest = store.count();
    let count = await new Promise<number>((resolve, reject) => {
      countRequest.onsuccess = () => resolve(countRequest.result);
      countRequest.onerror = () => reject(countRequest.error);
    });
    expect(count).toBe(1);

    // Supprime la vente
    const deleteTx = db.transaction('pending-sales', 'readwrite');
    const deleteStore = deleteTx.objectStore('pending-sales');
    const deleteRequest = deleteStore.delete(saleId);
    
    await new Promise((resolve, reject) => {
      deleteRequest.onsuccess = () => resolve(deleteRequest.result);
      deleteRequest.onerror = () => reject(deleteRequest.error);
    });

    // Vérifie qu'elle a été supprimée
    const finalTx = db.transaction('pending-sales', 'readonly');
    const finalStore = finalTx.objectStore('pending-sales');
    countRequest = finalStore.count();
    count = await new Promise<number>((resolve, reject) => {
      countRequest.onsuccess = () => resolve(countRequest.result);
      countRequest.onerror = () => reject(countRequest.error);
    });

    expect(count).toBe(0);
  });

  it('devrait gérer plusieurs ventes du même marchand', async () => {
    const tx = db.transaction('pending-sales', 'readwrite');
    const store = tx.objectStore('pending-sales');

    // Ajoute 3 ventes du même marchand
    for (let i = 0; i < 3; i++) {
      const sale = {
        data: {
          merchantId: 1,
          items: [{ productId: i + 1, quantity: 1, unitPrice: 1000 * (i + 1) }],
          totalAmount: 1000 * (i + 1),
          createdAt: new Date().toISOString(),
        },
        timestamp: Date.now() + i,
      };
      
      await new Promise((resolve, reject) => {
        const request = store.add(sale);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    // Récupère toutes les ventes
    const getAllRequest = store.getAll();
    const allSales = await new Promise<any[]>((resolve, reject) => {
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });

    expect(allSales.length).toBe(3);
    expect(allSales.every(s => s.data.merchantId === 1)).toBe(true);
    
    // Vérifie les montants
    const totalAmount = allSales.reduce((sum, s) => sum + s.data.totalAmount, 0);
    expect(totalAmount).toBe(1000 + 2000 + 3000); // 6000
  });
});

// Fonction helper pour ouvrir IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ifn-connect-db-test', 1);
    
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
