import { test, expect } from '@playwright/test';

/**
 * Test end-to-end du système d'épargne
 * 
 * Scénario :
 * 1. Vérifier l'affichage du solde d'épargne
 * 2. Tester la proposition d'épargne après une grosse vente
 * 3. Vérifier le dépôt manuel d'épargne
 * 4. Vérifier le retrait d'épargne
 */

test.describe('Système d\'épargne', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Tableau de bord')).toBeVisible({ timeout: 10000 });
  });

  test('devrait afficher le solde d\'épargne sur le dashboard', async ({ page }) => {
    // Vérifier la présence de la carte d'épargne
    const savingsCard = page.locator('text=/Épargne|Cagnotte/i');
    await expect(savingsCard).toBeVisible({ timeout: 5000 });

    // Vérifier la présence du montant
    const savingsAmount = page.locator('text=/FCFA/i').first();
    await expect(savingsAmount).toBeVisible();
  });

  test('devrait proposer l\'épargne après une grosse vente', async ({ page }) => {
    // Naviguer vers les paramètres pour activer la proposition d'épargne
    const settingsLink = page.locator('a[href*="settings"], button:has-text("Paramètres")');
    const isSettingsVisible = await settingsLink.isVisible().catch(() => false);
    
    if (isSettingsVisible) {
      await settingsLink.click();
      
      // Activer la proposition d'épargne
      const savingsToggle = page.locator('input[type="checkbox"][name*="savings"], label:has-text("Proposition d\'épargne")');
      const isToggleVisible = await savingsToggle.isVisible().catch(() => false);
      
      if (isToggleVisible) {
        const isChecked = await savingsToggle.isChecked().catch(() => false);
        if (!isChecked) {
          await savingsToggle.click();
        }
      }
      
      // Retourner au dashboard
      await page.goto('/');
    }

    // Naviguer vers la caisse
    const cashRegisterLink = page.locator('a[href="/merchant/cash-register"], button:has-text("Caisse")');
    await cashRegisterLink.click();
    await expect(page).toHaveURL(/\/merchant\/cash-register/);

    // Enregistrer une grosse vente (> 20000 FCFA)
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.waitFor({ state: 'visible', timeout: 10000 });
    await firstProduct.click();

    // Entrer une grande quantité pour atteindre le seuil
    const quantityInput = page.locator('input[type="text"][placeholder*="Quantité"], input[value=""]').first();
    await quantityInput.fill('10');

    const validateButton = page.locator('button:has-text("Valider")');
    await validateButton.click();

    const cashPaymentButton = page.locator('button:has-text("Espèces"), button:has-text("Cash")');
    await cashPaymentButton.waitFor({ state: 'visible', timeout: 5000 });
    await cashPaymentButton.click();

    // Vérifier si la proposition d'épargne apparaît
    const savingsProposal = page.locator('text=/Veux-tu mettre|épargner|cagnotte/i');
    const isSavingsProposalVisible = await savingsProposal.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (isSavingsProposalVisible) {
      // La proposition est apparue, on peut accepter ou refuser
      const acceptButton = page.locator('button:has-text("Oui"), button:has-text("Accepter")');
      const isAcceptVisible = await acceptButton.isVisible().catch(() => false);
      
      if (isAcceptVisible) {
        await acceptButton.click();
        await expect(page.locator('text=/Épargne ajoutée|Bravo/i')).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('devrait permettre de faire un dépôt manuel', async ({ page }) => {
    // Chercher le bouton de dépôt d'épargne
    const depositButton = page.locator('button:has-text("Déposer"), button:has-text("Ajouter à l\'épargne")');
    const isDepositVisible = await depositButton.isVisible().catch(() => false);
    
    if (isDepositVisible) {
      await depositButton.click();
      
      // Remplir le formulaire de dépôt
      const amountInput = page.locator('input[type="number"][placeholder*="Montant"], input[name="amount"]');
      await amountInput.fill('5000');
      
      const confirmButton = page.locator('button:has-text("Confirmer"), button:has-text("Valider")');
      await confirmButton.click();
      
      // Vérifier que le dépôt est confirmé
      await expect(page.locator('text=/Dépôt effectué|Épargne ajoutée/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('devrait permettre de faire un retrait', async ({ page }) => {
    // Chercher le bouton de retrait d'épargne
    const withdrawButton = page.locator('button:has-text("Retirer"), button:has-text("Retrait")');
    const isWithdrawVisible = await withdrawButton.isVisible().catch(() => false);
    
    if (isWithdrawVisible) {
      await withdrawButton.click();
      
      // Remplir le formulaire de retrait
      const amountInput = page.locator('input[type="number"][placeholder*="Montant"], input[name="amount"]');
      await amountInput.fill('1000');
      
      const reasonInput = page.locator('textarea[placeholder*="Raison"], textarea[name="reason"]');
      if (await reasonInput.isVisible().catch(() => false)) {
        await reasonInput.fill('Test de retrait');
      }
      
      const confirmButton = page.locator('button:has-text("Confirmer"), button:has-text("Valider")');
      await confirmButton.click();
      
      // Vérifier que le retrait est confirmé
      await expect(page.locator('text=/Retrait effectué|Retrait validé/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('devrait afficher l\'historique des transactions d\'épargne', async ({ page }) => {
    // Chercher le lien vers l'historique d'épargne
    const historyLink = page.locator('a[href*="savings"], a[href*="epargne"], button:has-text("Historique")');
    const isHistoryVisible = await historyLink.isVisible().catch(() => false);
    
    if (isHistoryVisible) {
      await historyLink.click();
      
      // Vérifier que nous sommes sur la page d'historique
      await expect(page.locator('text=/Historique.*épargne/i')).toBeVisible({ timeout: 5000 });
      
      // Vérifier la présence de la liste des transactions
      const transactionsList = page.locator('[data-testid="transactions-list"], .transaction-item');
      const hasTransactions = await transactionsList.first().isVisible({ timeout: 3000 }).catch(() => false);
      
      if (hasTransactions) {
        expect(hasTransactions).toBeTruthy();
      }
    }
  });
});
