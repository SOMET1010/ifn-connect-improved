import { test, expect } from '@playwright/test';

/**
 * Test end-to-end du parcours complet d'une journée de marchand
 * 
 * Scénario :
 * 1. Connexion
 * 2. Ouverture de journée
 * 3. Enregistrement d'une vente
 * 4. Consultation des statistiques
 * 5. Fermeture de journée
 */

test.describe('Parcours complet journée marchand', () => {
  test.beforeEach(async ({ page }) => {
    // Note: Dans un environnement de test réel, vous devriez avoir un système d'auth de test
    // Pour l'instant, nous supposons que l'utilisateur est déjà connecté via le système Manus OAuth
    await page.goto('/');
  });

  test('devrait permettre d\'ouvrir une journée, enregistrer une vente et fermer la journée', async ({ page }) => {
    // Étape 1: Vérifier que nous sommes sur le dashboard
    await expect(page.locator('text=Tableau de bord')).toBeVisible({ timeout: 10000 });

    // Étape 2: Ouvrir la journée (si le bouton est présent)
    const openDayButton = page.locator('button:has-text("Ouvrir ma journée")');
    const isOpenDayButtonVisible = await openDayButton.isVisible().catch(() => false);
    
    if (isOpenDayButtonVisible) {
      await openDayButton.click();
      await expect(page.locator('text=Journée ouverte')).toBeVisible({ timeout: 5000 });
    }

    // Étape 3: Naviguer vers la caisse
    const cashRegisterLink = page.locator('a[href="/merchant/cash-register"], button:has-text("Caisse")');
    await cashRegisterLink.click();
    
    // Vérifier que nous sommes sur la page de caisse
    await expect(page).toHaveURL(/\/merchant\/cash-register/);
    await expect(page.locator('text=Caisse')).toBeVisible();

    // Étape 4: Sélectionner un produit (le premier disponible)
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.waitFor({ state: 'visible', timeout: 10000 });
    await firstProduct.click();

    // Étape 5: Entrer une quantité
    const quantityInput = page.locator('input[type="text"][placeholder*="Quantité"], input[value=""]').first();
    await quantityInput.fill('2');

    // Étape 6: Valider la vente
    const validateButton = page.locator('button:has-text("Valider")');
    await validateButton.click();

    // Étape 7: Choisir le mode de paiement (Cash)
    const cashPaymentButton = page.locator('button:has-text("Espèces"), button:has-text("Cash")');
    await cashPaymentButton.waitFor({ state: 'visible', timeout: 5000 });
    await cashPaymentButton.click();

    // Étape 8: Vérifier que la vente est enregistrée
    await expect(page.locator('text=Vente enregistrée')).toBeVisible({ timeout: 5000 });

    // Étape 9: Retourner au dashboard
    await page.goto('/');
    await expect(page.locator('text=Tableau de bord')).toBeVisible();

    // Étape 10: Vérifier que les statistiques sont mises à jour
    const todayStats = page.locator('text=/Total du jour|Ventes aujourd\'hui/i');
    await expect(todayStats).toBeVisible();

    // Étape 11: Fermer la journée
    const closeDayButton = page.locator('button:has-text("Fermer ma journée")');
    const isCloseDayButtonVisible = await closeDayButton.isVisible().catch(() => false);
    
    if (isCloseDayButtonVisible) {
      await closeDayButton.click();
      
      // Remplir les notes de fermeture (optionnel)
      const notesTextarea = page.locator('textarea[placeholder*="notes"], textarea[name="closingNotes"]');
      if (await notesTextarea.isVisible().catch(() => false)) {
        await notesTextarea.fill('Test de fermeture automatique');
      }
      
      // Confirmer la fermeture
      const confirmButton = page.locator('button:has-text("Confirmer"), button:has-text("Fermer")').last();
      await confirmButton.click();
      
      // Vérifier que la journée est fermée
      await expect(page.locator('text=Journée fermée')).toBeVisible({ timeout: 5000 });
    }
  });

  test('devrait afficher les graphiques de statistiques sur le dashboard', async ({ page }) => {
    // Vérifier que nous sommes sur le dashboard
    await expect(page.locator('text=Tableau de bord')).toBeVisible({ timeout: 10000 });

    // Vérifier la présence du graphique des ventes 7 jours
    const salesChart = page.locator('text=/Ventes des 7 derniers jours|Graphique/i');
    await expect(salesChart).toBeVisible({ timeout: 5000 });

    // Vérifier la présence du graphique des sessions 30 jours
    const sessionStatsChart = page.locator('text=/Heures travaillées.*30 derniers jours/i');
    await expect(sessionStatsChart).toBeVisible({ timeout: 5000 });

    // Vérifier la présence des comparaisons hebdo/mensuelles
    const weekComparison = page.locator('text=/Cette semaine/i');
    await expect(weekComparison).toBeVisible({ timeout: 5000 });

    const monthComparison = page.locator('text=/Ce mois-ci/i');
    await expect(monthComparison).toBeVisible({ timeout: 5000 });
  });

  test('devrait permettre de consulter l\'historique des sessions', async ({ page }) => {
    // Naviguer vers la page d'historique (si elle existe)
    const historyLink = page.locator('a[href*="history"], a[href*="sessions"]');
    const isHistoryLinkVisible = await historyLink.isVisible().catch(() => false);
    
    if (isHistoryLinkVisible) {
      await historyLink.click();
      
      // Vérifier que nous sommes sur la page d'historique
      await expect(page.locator('text=/Historique|Sessions/i')).toBeVisible({ timeout: 5000 });
      
      // Vérifier la présence de la liste des sessions
      const sessionsList = page.locator('[data-testid="sessions-list"], .session-item');
      await expect(sessionsList.first()).toBeVisible({ timeout: 5000 });
    }
  });
});
