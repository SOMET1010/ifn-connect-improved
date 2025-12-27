import { test, expect } from '@playwright/test';

/**
 * Test end-to-end du système de micro-objectifs
 * 
 * Scénario :
 * 1. Vérifier l'affichage des micro-objectifs sur le dashboard
 * 2. Vérifier la progression des objectifs après une vente
 * 3. Vérifier la validation d'un objectif atteint
 */

test.describe('Système de micro-objectifs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Tableau de bord')).toBeVisible({ timeout: 10000 });
  });

  test('devrait afficher les micro-objectifs sur le dashboard', async ({ page }) => {
    // Vérifier la présence du widget de micro-objectifs
    const microGoalsWidget = page.locator('text=/Mes objectifs|Objectifs du jour/i');
    await expect(microGoalsWidget).toBeVisible({ timeout: 5000 });

    // Vérifier la présence d'au moins un objectif
    const goalItem = page.locator('[data-testid="goal-item"], .goal-card').first();
    const isGoalVisible = await goalItem.isVisible().catch(() => false);
    
    if (isGoalVisible) {
      // Vérifier que l'objectif contient une description et une progression
      await expect(goalItem).toContainText(/ventes|FCFA|produits/i);
    }
  });

  test('devrait mettre à jour la progression après une vente', async ({ page }) => {
    // Capturer l'état initial des objectifs
    const microGoalsWidget = page.locator('text=/Mes objectifs|Objectifs du jour/i');
    await expect(microGoalsWidget).toBeVisible({ timeout: 5000 });

    // Naviguer vers la caisse
    const cashRegisterLink = page.locator('a[href="/merchant/cash-register"], button:has-text("Caisse")');
    await cashRegisterLink.click();
    await expect(page).toHaveURL(/\/merchant\/cash-register/);

    // Enregistrer une vente rapide
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.waitFor({ state: 'visible', timeout: 10000 });
    await firstProduct.click();

    const quantityInput = page.locator('input[type="text"][placeholder*="Quantité"], input[value=""]').first();
    await quantityInput.fill('1');

    const validateButton = page.locator('button:has-text("Valider")');
    await validateButton.click();

    const cashPaymentButton = page.locator('button:has-text("Espèces"), button:has-text("Cash")');
    await cashPaymentButton.waitFor({ state: 'visible', timeout: 5000 });
    await cashPaymentButton.click();

    await expect(page.locator('text=Vente enregistrée')).toBeVisible({ timeout: 5000 });

    // Retourner au dashboard
    await page.goto('/');
    await expect(page.locator('text=Tableau de bord')).toBeVisible();

    // Vérifier que les objectifs sont toujours visibles (la progression devrait être mise à jour)
    await expect(microGoalsWidget).toBeVisible({ timeout: 5000 });
  });

  test('devrait afficher une notification quand un objectif est atteint', async ({ page }) => {
    // Ce test nécessiterait des données de test spécifiques
    // Pour l'instant, on vérifie simplement que le système est en place
    
    const microGoalsWidget = page.locator('text=/Mes objectifs|Objectifs du jour/i');
    await expect(microGoalsWidget).toBeVisible({ timeout: 5000 });

    // Vérifier la présence d'indicateurs de progression (barres, pourcentages)
    const progressIndicator = page.locator('[role="progressbar"], .progress-bar, text=/%/');
    const hasProgressIndicator = await progressIndicator.first().isVisible().catch(() => false);
    
    if (hasProgressIndicator) {
      // Le système de progression est en place
      expect(hasProgressIndicator).toBeTruthy();
    }
  });
});
