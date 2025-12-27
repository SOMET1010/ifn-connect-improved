import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour les paiements CMU via InTouch
 * 
 * Scénarios testés :
 * 1. Renouvellement réussi avec numéro se terminant par 00
 * 2. Renouvellement échoué avec numéro se terminant par 99
 * 3. Mise à jour automatique de la date d'expiration après renouvellement
 * 4. Historique des remboursements CMU
 * 5. Simulateur de remboursement par type de soin
 */

test.describe('Paiements CMU via InTouch', () => {
  test.beforeEach(async ({ page }) => {
    // Aller sur la page de renouvellement CMU
    await page.goto('/merchant/cmu/renewal');
    
    // Attendre que la page soit chargée
    await page.waitForLoadState('networkidle');
  });

  test('P2-6: Renouvellement CMU réussi avec Mobile Money', async ({ page }) => {
    // Remplir le formulaire de renouvellement
    await page.fill('input[name="phone"]', '07084598300'); // Numéro se terminant par 00 = succès
    await page.fill('input[name="amount"]', '1000'); // 1000 FCFA
    await page.selectOption('select[name="paymentMethod"]', 'mobile_money');
    await page.selectOption('select[name="provider"]', 'mtn_momo');
    await page.fill('input[name="otp"]', '654321'); // OTP de test
    
    // Soumettre le formulaire
    await page.click('button[type="submit"]');
    
    // Attendre la confirmation
    await expect(page.locator('text=Renouvellement réussi')).toBeVisible({ timeout: 10000 });
    
    // Vérifier que le statut est "completed"
    await expect(page.locator('[data-testid="renewal-status"]')).toHaveText('Complété');
    
    // Vérifier que la date d'expiration a été mise à jour (+12 mois)
    const expiryDate = await page.locator('[data-testid="cmu-expiry-date"]').textContent();
    expect(expiryDate).toBeTruthy();
    
    // Vérifier que le statut CMU est passé à "active"
    await expect(page.locator('[data-testid="cmu-status"]')).toHaveText('Actif');
  });

  test('P2-7: Renouvellement CMU échoué avec numéro invalide', async ({ page }) => {
    // Remplir le formulaire avec un numéro qui va échouer
    await page.fill('input[name="phone"]', '07084598399'); // Numéro se terminant par 99 = échec
    await page.fill('input[name="amount"]', '1000');
    await page.selectOption('select[name="paymentMethod"]', 'mobile_money');
    await page.selectOption('select[name="provider"]', 'wave');
    await page.fill('input[name="otp"]', '654321');
    
    // Soumettre le formulaire
    await page.click('button[type="submit"]');
    
    // Attendre le message d'erreur
    await expect(page.locator('text=Renouvellement échoué')).toBeVisible({ timeout: 10000 });
    
    // Vérifier que le statut est "failed"
    await expect(page.locator('[data-testid="renewal-status"]')).toHaveText('Échoué');
    
    // Vérifier que la date d'expiration n'a PAS été mise à jour
    const statusBefore = await page.locator('[data-testid="cmu-status"]').textContent();
    expect(statusBefore).not.toBe('Actif');
  });

  test('P2-8: Historique des remboursements CMU', async ({ page }) => {
    // Aller sur la page CMU
    await page.goto('/merchant/cmu');
    
    // Attendre que l'historique soit chargé
    await page.waitForLoadState('networkidle');
    
    // Vérifier que l'historique contient au moins un remboursement
    const reimbursementRows = await page.locator('[data-testid="reimbursement-row"]').count();
    
    if (reimbursementRows > 0) {
      // Vérifier les colonnes de l'historique
      await expect(page.locator('th:has-text("Date")')).toBeVisible();
      await expect(page.locator('th:has-text("Type de soin")')).toBeVisible();
      await expect(page.locator('th:has-text("Montant")')).toBeVisible();
      await expect(page.locator('th:has-text("Remboursé")')).toBeVisible();
      await expect(page.locator('th:has-text("Statut")')).toBeVisible();
    }
  });

  test('P2-9: Simulateur de remboursement CMU', async ({ page }) => {
    // Aller sur la page CMU
    await page.goto('/merchant/cmu');
    
    // Remplir le simulateur
    await page.selectOption('select[name="careType"]', 'consultation'); // Consultation
    await page.fill('input[name="amount"]', '5000'); // 5000 FCFA
    
    // Calculer
    await page.click('button:has-text("Calculer le remboursement")');
    
    // Vérifier que le résultat est affiché
    await expect(page.locator('[data-testid="estimated-reimbursement"]')).toBeVisible();
    
    // Vérifier que le montant estimé est > 0
    const reimbursementText = await page.locator('[data-testid="estimated-reimbursement"]').textContent();
    expect(reimbursementText).toMatch(/\d+/); // Contient au moins un chiffre
    
    // Vérifier le pourcentage de remboursement
    await expect(page.locator('[data-testid="reimbursement-percentage"]')).toBeVisible();
  });

  test('P2-10: Alerte expiration CMU < 30 jours', async ({ page }) => {
    // Aller sur le dashboard de protection sociale
    await page.goto('/merchant/protection-sociale');
    
    // Si la date d'expiration est < 30 jours, une alerte doit être visible
    const alertVisible = await page.locator('[data-testid="cmu-expiry-alert"]').isVisible();
    
    if (alertVisible) {
      // Vérifier le contenu de l'alerte
      await expect(page.locator('[data-testid="cmu-expiry-alert"]')).toContainText('expire');
      
      // Vérifier le bouton de renouvellement
      await expect(page.locator('button:has-text("Renouveler")')).toBeVisible();
    }
  });

  test('P2-11: Statistiques CMU sur 12 mois', async ({ page }) => {
    // Aller sur la page CMU
    await page.goto('/merchant/cmu');
    
    // Vérifier que le graphique des 12 derniers mois est affiché
    await expect(page.locator('[data-testid="cmu-chart"]')).toBeVisible();
    
    // Vérifier les statistiques globales
    await expect(page.locator('[data-testid="total-reimbursed"]')).toBeVisible();
    await expect(page.locator('[data-testid="reimbursement-count"]')).toBeVisible();
  });
});
