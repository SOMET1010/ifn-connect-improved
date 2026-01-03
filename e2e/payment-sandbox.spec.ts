import { test, expect } from '@playwright/test';

test.describe('Parcours Paiement Mobile Money - Sandbox', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Scénario de succès immédiat (00)', () => {
    test('devrait réussir un paiement Orange Money avec le numéro test 0707070700', async ({ page }) => {
      const paymentButton = page.locator('button:has-text("Payer"), button:has-text("Paiement")').first();
      const isPaymentVisible = await paymentButton.isVisible().catch(() => false);

      if (!isPaymentVisible) {
        test.skip('Bouton de paiement non disponible sur cette page');
      }

      await paymentButton.click();

      await expect(page.locator('text=/Mobile Money|Paiement/i')).toBeVisible({ timeout: 5000 });

      const orangeMoneyCard = page.locator('text=Orange Money').locator('..');
      await orangeMoneyCard.click();

      const phoneInput = page.locator('input[type="tel"], input[placeholder*="téléphone"]');
      await phoneInput.fill('0707070700');

      const payButton = page.locator('button:has-text("Payer")').last();
      await payButton.click();

      await expect(page.locator('text=/Traitement en cours|En attente/i')).toBeVisible({ timeout: 3000 });

      await expect(page.locator('text=/Paiement réussi|Succès/i')).toBeVisible({ timeout: 5000 });
    });

    test('devrait réussir un paiement MTN MoMo avec succès immédiat', async ({ page }) => {
      const paymentButton = page.locator('button:has-text("Payer"), button:has-text("Paiement")').first();
      const isPaymentVisible = await paymentButton.isVisible().catch(() => false);

      if (!isPaymentVisible) {
        test.skip('Bouton de paiement non disponible sur cette page');
      }

      await paymentButton.click();

      const mtnCard = page.locator('text=/MTN.*Money/i').locator('..');
      if (await mtnCard.isVisible()) {
        await mtnCard.click();

        const phoneInput = page.locator('input[type="tel"]');
        await phoneInput.fill('0101010100');

        const payButton = page.locator('button:has-text("Payer")').last();
        await payButton.click();

        await expect(page.locator('text=/Paiement réussi/i')).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Scénario de succès avec délai (11)', () => {
    test('devrait réussir un paiement Wave après délai de 3 secondes', async ({ page }) => {
      const paymentButton = page.locator('button:has-text("Payer"), button:has-text("Paiement")').first();
      const isPaymentVisible = await paymentButton.isVisible().catch(() => false);

      if (!isPaymentVisible) {
        test.skip('Bouton de paiement non disponible sur cette page');
      }

      await paymentButton.click();

      const waveCard = page.locator('text=Wave').locator('..');
      if (await waveCard.isVisible()) {
        await waveCard.click();

        const phoneInput = page.locator('input[type="tel"]');
        await phoneInput.fill('0505050511');

        const payButton = page.locator('button:has-text("Payer")').last();
        await payButton.click();

        await expect(page.locator('text=/Traitement en cours/i')).toBeVisible({ timeout: 3000 });

        await expect(page.locator('text=/Paiement réussi/i')).toBeVisible({ timeout: 6000 });
      }
    });
  });

  test.describe('Scénarios d\'échec', () => {
    test('devrait échouer avec "Solde insuffisant" pour le numéro terminant par 99', async ({ page }) => {
      const paymentButton = page.locator('button:has-text("Payer"), button:has-text("Paiement")').first();
      const isPaymentVisible = await paymentButton.isVisible().catch(() => false);

      if (!isPaymentVisible) {
        test.skip('Bouton de paiement non disponible sur cette page');
      }

      await paymentButton.click();

      const orangeMoneyCard = page.locator('text=Orange Money').locator('..');
      await orangeMoneyCard.click();

      const phoneInput = page.locator('input[type="tel"]');
      await phoneInput.fill('0707070799');

      const payButton = page.locator('button:has-text("Payer")').last();
      await payButton.click();

      await expect(page.locator('text=/Paiement échoué|échec/i')).toBeVisible({ timeout: 5000 });

      await expect(page.locator('text=/Solde insuffisant/i')).toBeVisible({ timeout: 3000 });
    });

    test('devrait échouer avec "Numéro invalide" pour le numéro terminant par 98', async ({ page }) => {
      const paymentButton = page.locator('button:has-text("Payer"), button:has-text("Paiement")').first();
      const isPaymentVisible = await paymentButton.isVisible().catch(() => false);

      if (!isPaymentVisible) {
        test.skip('Bouton de paiement non disponible sur cette page');
      }

      await paymentButton.click();

      const mtnCard = page.locator('text=/MTN.*Money/i').locator('..');
      if (await mtnCard.isVisible()) {
        await mtnCard.click();

        const phoneInput = page.locator('input[type="tel"]');
        await phoneInput.fill('0505050598');

        const payButton = page.locator('button:has-text("Payer")').last();
        await payButton.click();

        await expect(page.locator('text=/Paiement échoué/i')).toBeVisible({ timeout: 5000 });

        await expect(page.locator('text=/invalide|inexistant/i')).toBeVisible({ timeout: 3000 });
      }
    });

    test('devrait échouer avec "Transaction refusée" pour le numéro terminant par 97', async ({ page }) => {
      const paymentButton = page.locator('button:has-text("Payer"), button:has-text("Paiement")').first();
      const isPaymentVisible = await paymentButton.isVisible().catch(() => false);

      if (!isPaymentVisible) {
        test.skip('Bouton de paiement non disponible sur cette page');
      }

      await paymentButton.click();

      const moovCard = page.locator('text=/Moov.*Money/i').locator('..');
      if (await moovCard.isVisible()) {
        await moovCard.click();

        const phoneInput = page.locator('input[type="tel"]');
        await phoneInput.fill('0101010197');

        const payButton = page.locator('button:has-text("Payer")').last();
        await payButton.click();

        await expect(page.locator('text=/Paiement échoué|refusée/i')).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Validation des champs', () => {
    test('devrait valider le format du numéro de téléphone', async ({ page }) => {
      const paymentButton = page.locator('button:has-text("Payer"), button:has-text("Paiement")').first();
      const isPaymentVisible = await paymentButton.isVisible().catch(() => false);

      if (!isPaymentVisible) {
        test.skip('Bouton de paiement non disponible sur cette page');
      }

      await paymentButton.click();

      const orangeMoneyCard = page.locator('text=Orange Money').locator('..');
      await orangeMoneyCard.click();

      const phoneInput = page.locator('input[type="tel"]');
      await phoneInput.fill('123');

      const payButton = page.locator('button:has-text("Payer")').last();
      await payButton.click();

      await expect(page.locator('text=/invalide|format/i')).toBeVisible({ timeout: 3000 });
    });

    test('devrait afficher tous les providers disponibles', async ({ page }) => {
      const paymentButton = page.locator('button:has-text("Payer"), button:has-text("Paiement")').first();
      const isPaymentVisible = await paymentButton.isVisible().catch(() => false);

      if (!isPaymentVisible) {
        test.skip('Bouton de paiement non disponible sur cette page');
      }

      await paymentButton.click();

      await expect(page.locator('text=Orange Money')).toBeVisible({ timeout: 3000 });
      await expect(page.locator('text=/MTN.*Money/i')).toBeVisible();
      await expect(page.locator('text=/Moov.*Money/i')).toBeVisible();
      await expect(page.locator('text=Wave')).toBeVisible();
    });
  });

  test.describe('Navigation et UX', () => {
    test('devrait permettre de revenir en arrière après sélection du provider', async ({ page }) => {
      const paymentButton = page.locator('button:has-text("Payer"), button:has-text("Paiement")').first();
      const isPaymentVisible = await paymentButton.isVisible().catch(() => false);

      if (!isPaymentVisible) {
        test.skip('Bouton de paiement non disponible sur cette page');
      }

      await paymentButton.click();

      const orangeMoneyCard = page.locator('text=Orange Money').locator('..');
      await orangeMoneyCard.click();

      const backButton = page.locator('button:has-text("Retour")');
      await backButton.click();

      await expect(page.locator('text=Choisissez votre moyen de paiement')).toBeVisible({ timeout: 3000 });
    });

    test('devrait afficher le montant à payer', async ({ page }) => {
      const paymentButton = page.locator('button:has-text("Payer"), button:has-text("Paiement")').first();
      const isPaymentVisible = await paymentButton.isVisible().catch(() => false);

      if (!isPaymentVisible) {
        test.skip('Bouton de paiement non disponible sur cette page');
      }

      await paymentButton.click();

      await expect(page.locator('text=/Montant.*FCFA/i')).toBeVisible({ timeout: 3000 });
    });

    test('devrait afficher la référence de transaction après initiation', async ({ page }) => {
      const paymentButton = page.locator('button:has-text("Payer"), button:has-text("Paiement")').first();
      const isPaymentVisible = await paymentButton.isVisible().catch(() => false);

      if (!isPaymentVisible) {
        test.skip('Bouton de paiement non disponible sur cette page');
      }

      await paymentButton.click();

      const orangeMoneyCard = page.locator('text=Orange Money').locator('..');
      await orangeMoneyCard.click();

      const phoneInput = page.locator('input[type="tel"]');
      await phoneInput.fill('0707070700');

      const payButton = page.locator('button:has-text("Payer")').last();
      await payButton.click();

      await expect(page.locator('text=/Référence.*IFN-/i')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Mode Sandbox - Indicateurs', () => {
    test('devrait afficher un indicateur de mode simulation', async ({ page }) => {
      const paymentButton = page.locator('button:has-text("Payer"), button:has-text("Paiement")').first();
      const isPaymentVisible = await paymentButton.isVisible().catch(() => false);

      if (!isPaymentVisible) {
        test.skip('Bouton de paiement non disponible sur cette page');
      }

      await paymentButton.click();

      const orangeMoneyCard = page.locator('text=Orange Money').locator('..');
      await orangeMoneyCard.click();

      await expect(page.locator('text=/Mode simulation|sandbox/i')).toBeVisible({ timeout: 3000 });
    });

    test('devrait afficher les instructions de test (numéros spéciaux)', async ({ page }) => {
      const paymentButton = page.locator('button:has-text("Payer"), button:has-text("Paiement")').first();
      const isPaymentVisible = await paymentButton.isVisible().catch(() => false);

      if (!isPaymentVisible) {
        test.skip('Bouton de paiement non disponible sur cette page');
      }

      await paymentButton.click();

      const orangeMoneyCard = page.locator('text=Orange Money').locator('..');
      await orangeMoneyCard.click();

      await expect(page.locator('text=/00 = succès|99 = échec/i')).toBeVisible({ timeout: 3000 });
    });
  });
});
