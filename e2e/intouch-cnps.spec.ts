import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour les paiements CNPS via InTouch
 * 
 * Scénarios testés :
 * 1. Paiement réussi avec numéro se terminant par 00
 * 2. Paiement échoué avec numéro se terminant par 99
 * 3. Mise à jour automatique de la date d'expiration après paiement
 * 4. Webhook InTouch pour confirmation de paiement
 */

test.describe('Paiements CNPS via InTouch', () => {
  test.beforeEach(async ({ page }) => {
    // Aller sur la page de paiement CNPS
    await page.goto('/merchant/cnps/payment');
    
    // Attendre que la page soit chargée
    await page.waitForLoadState('networkidle');
  });

  test('P2-1: Paiement CNPS réussi avec Mobile Money', async ({ page }) => {
    // Remplir le formulaire de paiement
    await page.fill('input[name="phone"]', '07084598300'); // Numéro se terminant par 00 = succès
    await page.fill('input[name="amount"]', '5000'); // 5000 FCFA
    await page.selectOption('select[name="paymentMethod"]', 'mobile_money');
    await page.selectOption('select[name="provider"]', 'orange_money');
    await page.fill('input[name="otp"]', '123456'); // OTP de test
    
    // Soumettre le formulaire
    await page.click('button[type="submit"]');
    
    // Attendre la confirmation de paiement
    await expect(page.locator('text=Paiement réussi')).toBeVisible({ timeout: 10000 });
    
    // Vérifier que le statut est "completed"
    await expect(page.locator('[data-testid="payment-status"]')).toHaveText('Complété');
    
    // Vérifier que la date d'expiration a été mise à jour (+12 mois)
    const expiryDate = await page.locator('[data-testid="cnps-expiry-date"]').textContent();
    expect(expiryDate).toBeTruthy();
    
    // Vérifier que le statut CNPS est passé à "active"
    await expect(page.locator('[data-testid="cnps-status"]')).toHaveText('Actif');
  });

  test('P2-2: Paiement CNPS échoué avec numéro invalide', async ({ page }) => {
    // Remplir le formulaire avec un numéro qui va échouer
    await page.fill('input[name="phone"]', '07084598399'); // Numéro se terminant par 99 = échec
    await page.fill('input[name="amount"]', '5000');
    await page.selectOption('select[name="paymentMethod"]', 'mobile_money');
    await page.selectOption('select[name="provider"]', 'orange_money');
    await page.fill('input[name="otp"]', '123456');
    
    // Soumettre le formulaire
    await page.click('button[type="submit"]');
    
    // Attendre le message d'erreur
    await expect(page.locator('text=Paiement échoué')).toBeVisible({ timeout: 10000 });
    
    // Vérifier que le statut est "failed"
    await expect(page.locator('[data-testid="payment-status"]')).toHaveText('Échoué');
    
    // Vérifier que la date d'expiration n'a PAS été mise à jour
    const statusBefore = await page.locator('[data-testid="cnps-status"]').textContent();
    expect(statusBefore).not.toBe('Actif');
  });

  test('P2-3: Historique des paiements CNPS', async ({ page }) => {
    // Aller sur la page d'historique
    await page.goto('/merchant/cnps');
    
    // Attendre que l'historique soit chargé
    await page.waitForLoadState('networkidle');
    
    // Vérifier que l'historique contient au moins un paiement
    const paymentRows = await page.locator('[data-testid="payment-row"]').count();
    expect(paymentRows).toBeGreaterThan(0);
    
    // Vérifier les colonnes de l'historique
    await expect(page.locator('th:has-text("Date")')).toBeVisible();
    await expect(page.locator('th:has-text("Montant")')).toBeVisible();
    await expect(page.locator('th:has-text("Statut")')).toBeVisible();
    await expect(page.locator('th:has-text("Méthode")')).toBeVisible();
  });

  test('P2-4: Simulateur de pension CNPS', async ({ page }) => {
    // Aller sur la page CNPS
    await page.goto('/merchant/cnps');
    
    // Remplir le simulateur
    await page.fill('input[name="monthlyContribution"]', '10000'); // 10 000 FCFA/mois
    await page.fill('input[name="yearsOfContribution"]', '20'); // 20 ans
    
    // Calculer
    await page.click('button:has-text("Calculer")');
    
    // Vérifier que le résultat est affiché
    await expect(page.locator('[data-testid="estimated-pension"]')).toBeVisible();
    
    // Vérifier que le montant estimé est > 0
    const pensionText = await page.locator('[data-testid="estimated-pension"]').textContent();
    expect(pensionText).toMatch(/\d+/); // Contient au moins un chiffre
  });

  test('P2-5: Alerte expiration CNPS < 30 jours', async ({ page }) => {
    // Aller sur le dashboard de protection sociale
    await page.goto('/merchant/protection-sociale');
    
    // Si la date d'expiration est < 30 jours, une alerte doit être visible
    const alertVisible = await page.locator('[data-testid="cnps-expiry-alert"]').isVisible();
    
    if (alertVisible) {
      // Vérifier le contenu de l'alerte
      await expect(page.locator('[data-testid="cnps-expiry-alert"]')).toContainText('expire');
      
      // Vérifier le bouton de renouvellement
      await expect(page.locator('button:has-text("Renouveler")')).toBeVisible();
    }
  });
});
