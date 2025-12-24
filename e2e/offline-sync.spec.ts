import { test, expect } from '@playwright/test';

test.describe('Mode Hors Ligne - Synchronisation', () => {
  test.beforeEach(async ({ page, context }) => {
    // Activer le service worker
    await context.grantPermissions(['notifications']);
    await page.goto('/');
  });

  test('P0-3.1 : Vente offline puis synchronisation automatique', async ({ page, context }) => {
    // 1. Se connecter en tant que marchand
    await page.goto('/');
    // TODO: Ajouter l'authentification quand disponible
    
    // 2. Aller à la caisse
    await page.click('text=Caisse');
    await expect(page).toHaveURL(/.*cash-register/);
    
    // 3. Passer en mode offline
    await context.setOffline(true);
    
    // 4. Vérifier que l'indicateur offline est affiché
    await expect(page.locator('text=Hors ligne')).toBeVisible({ timeout: 5000 });
    
    // 5. Faire une vente
    const productCard = page.locator('[data-testid="product-card"]').first();
    await productCard.click();
    
    // Entrer un montant
    await page.click('button:has-text("5")');
    await page.click('button:has-text("0")');
    await page.click('button:has-text("0")');
    await page.click('button:has-text("0")');
    
    // Valider la vente
    await page.click('button:has-text("Valider")');
    
    // 6. Vérifier que la vente est sauvegardée localement
    await expect(page.locator('text=Vente enregistrée')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=sera synchronisée')).toBeVisible();
    
    // 7. Vérifier le compteur de ventes en attente
    await expect(page.locator('text=1 vente en attente')).toBeVisible();
    
    // 8. Repasser en mode online
    await context.setOffline(false);
    
    // 9. Attendre la synchronisation automatique (max 10 secondes)
    await expect(page.locator('text=Synchronisation')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=0 vente en attente')).toBeVisible({ timeout: 10000 });
    
    // 10. Vérifier que la vente est bien dans l'historique
    await page.click('text=Historique');
    await expect(page.locator('text=5000')).toBeVisible();
  });

  test('P0-3.2 : Vérification intégrité des données après sync', async ({ page, context }) => {
    // 1. Se connecter et aller à la caisse
    await page.goto('/merchant/cash-register-simple');
    
    // 2. Passer offline et faire 3 ventes
    await context.setOffline(true);
    
    const sales = [
      { amount: '2000', product: 'Produit A' },
      { amount: '3500', product: 'Produit B' },
      { amount: '1000', product: 'Produit C' },
    ];
    
    for (const sale of sales) {
      // Sélectionner produit
      await page.click(`text=${sale.product}`);
      
      // Entrer montant
      for (const digit of sale.amount) {
        await page.click(`button:has-text("${digit}")`);
      }
      
      // Valider
      await page.click('button:has-text("Valider")');
      await page.waitForTimeout(1000);
    }
    
    // 3. Vérifier que 3 ventes sont en attente
    await expect(page.locator('text=3 ventes en attente')).toBeVisible();
    
    // 4. Repasser online et attendre sync
    await context.setOffline(false);
    await expect(page.locator('text=0 vente en attente')).toBeVisible({ timeout: 15000 });
    
    // 5. Vérifier l'intégrité : toutes les ventes doivent être dans l'historique
    await page.click('text=Historique');
    await expect(page.locator('text=2000')).toBeVisible();
    await expect(page.locator('text=3500')).toBeVisible();
    await expect(page.locator('text=1000')).toBeVisible();
    
    // 6. Vérifier le total des ventes du jour
    const totalText = await page.locator('[data-testid="total-sales-today"]').textContent();
    expect(totalText).toContain('6500'); // 2000 + 3500 + 1000
  });

  test('P0-3.3 : Gestion des conflits de synchronisation', async ({ page, context }) => {
    // 1. Se connecter
    await page.goto('/merchant/cash-register-simple');
    
    // 2. Faire une vente online
    await page.click('text=Produit A');
    await page.click('button:has-text("1")');
    await page.click('button:has-text("0")');
    await page.click('button:has-text("0")');
    await page.click('button:has-text("0")');
    await page.click('button:has-text("Valider")');
    
    // 3. Passer offline
    await context.setOffline(true);
    
    // 4. Faire une vente offline
    await page.click('text=Produit B');
    await page.click('button:has-text("2")');
    await page.click('button:has-text("0")');
    await page.click('button:has-text("0")');
    await page.click('button:has-text("0")');
    await page.click('button:has-text("Valider")');
    
    // 5. Repasser online
    await context.setOffline(false);
    
    // 6. Vérifier que la synchronisation réussit sans erreur
    await expect(page.locator('text=Erreur')).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=0 vente en attente')).toBeVisible({ timeout: 15000 });
    
    // 7. Vérifier que les deux ventes sont présentes
    await page.click('text=Historique');
    await expect(page.locator('text=1000')).toBeVisible();
    await expect(page.locator('text=2000')).toBeVisible();
  });

  test('P0-3.4 : Persistance des ventes offline après refresh', async ({ page, context }) => {
    // 1. Se connecter et aller à la caisse
    await page.goto('/merchant/cash-register-simple');
    
    // 2. Passer offline
    await context.setOffline(true);
    
    // 3. Faire une vente
    await page.click('text=Produit A');
    await page.click('button:has-text("5")');
    await page.click('button:has-text("0")');
    await page.click('button:has-text("0")');
    await page.click('button:has-text("0")');
    await page.click('button:has-text("Valider")');
    
    // 4. Vérifier que la vente est en attente
    await expect(page.locator('text=1 vente en attente')).toBeVisible();
    
    // 5. Rafraîchir la page (toujours offline)
    await page.reload();
    
    // 6. Vérifier que la vente est toujours en attente
    await expect(page.locator('text=1 vente en attente')).toBeVisible();
    
    // 7. Repasser online et vérifier la sync
    await context.setOffline(false);
    await expect(page.locator('text=0 vente en attente')).toBeVisible({ timeout: 15000 });
  });
});
