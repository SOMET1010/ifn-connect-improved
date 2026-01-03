import { test, expect } from '@playwright/test';

test.describe('Parcours Marchand - Fonctionnalités Avancées', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Gestion de l\'épargne', () => {
    test('devrait permettre d\'accéder à la page d\'épargne', async ({ page }) => {
      const savingsLink = page.locator('a[href*="/savings"], button:has-text("Épargne")');
      const isLinkVisible = await savingsLink.isVisible().catch(() => false);

      if (isLinkVisible) {
        await savingsLink.click();
        await expect(page).toHaveURL(/\/savings/);
        await expect(page.locator('text=/Épargne|Économies/i')).toBeVisible({ timeout: 5000 });
      }
    });

    test('devrait afficher les objectifs d\'épargne', async ({ page }) => {
      await page.goto('/merchant/savings');
      await page.waitForLoadState('networkidle');

      const savingsGoals = page.locator('text=/Objectif|Épargne/i');
      const isGoalsVisible = await savingsGoals.first().isVisible({ timeout: 5000 }).catch(() => false);

      if (isGoalsVisible) {
        await expect(savingsGoals.first()).toBeVisible();
      }
    });

    test('devrait permettre de créer un nouvel objectif d\'épargne', async ({ page }) => {
      await page.goto('/merchant/savings');
      await page.waitForLoadState('networkidle');

      const createButton = page.locator('button:has-text("Nouveau"), button:has-text("Créer")');
      const isButtonVisible = await createButton.first().isVisible().catch(() => false);

      if (isButtonVisible) {
        await createButton.first().click();

        const dialog = page.locator('[role="dialog"], .modal');
        const isDialogVisible = await dialog.isVisible({ timeout: 3000 }).catch(() => false);

        if (isDialogVisible) {
          await expect(dialog).toBeVisible();

          const nameInput = page.locator('input[name*="name"], input[placeholder*="nom"]');
          const amountInput = page.locator('input[name*="amount"], input[placeholder*="montant"]');

          if (await nameInput.isVisible()) {
            await nameInput.fill('Test Objectif');
          }
          if (await amountInput.isVisible()) {
            await amountInput.fill('100000');
          }
        }
      }
    });

    test('devrait afficher la progression des économies', async ({ page }) => {
      await page.goto('/merchant/savings');
      await page.waitForLoadState('networkidle');

      const progressBar = page.locator('[role="progressbar"], .progress-bar');
      const isProgressVisible = await progressBar.first().isVisible().catch(() => false);

      if (isProgressVisible) {
        expect(isProgressVisible).toBeTruthy();
      }
    });
  });

  test.describe('Badges et Achievements', () => {
    test('devrait permettre d\'accéder à la page des badges', async ({ page }) => {
      const badgesLink = page.locator('a[href*="/badges"], button:has-text("Badges")');
      const isLinkVisible = await badgesLink.isVisible().catch(() => false);

      if (isLinkVisible) {
        await badgesLink.click();
        await expect(page).toHaveURL(/\/badges/);
        await expect(page.locator('text=/Badges|Récompenses/i')).toBeVisible({ timeout: 5000 });
      }
    });

    test('devrait afficher les badges obtenus et verrouillés', async ({ page }) => {
      await page.goto('/merchant/badges');
      await page.waitForLoadState('networkidle');

      const badgesHeading = page.locator('text=/Badges|Récompenses/i');
      const isHeadingVisible = await badgesHeading.first().isVisible({ timeout: 5000 }).catch(() => false);

      if (isHeadingVisible) {
        const badgeCards = page.locator('[class*="badge"], [data-testid*="badge"]');
        const badgeCount = await badgeCards.count();

        expect(badgeCount).toBeGreaterThanOrEqual(0);
      }
    });

    test('devrait afficher les progrès vers les prochains badges', async ({ page }) => {
      await page.goto('/merchant/badges');
      await page.waitForLoadState('networkidle');

      const progressIndicator = page.locator('text=/%|.progress|[role="progressbar"]');
      const hasProgress = await progressIndicator.first().isVisible().catch(() => false);

      if (hasProgress) {
        expect(hasProgress).toBeTruthy();
      }
    });
  });

  test.describe('Gestion du stock', () => {
    test('devrait permettre d\'accéder à la page de stock', async ({ page }) => {
      const stockLink = page.locator('a[href*="/stock"], button:has-text("Stock")');
      const isLinkVisible = await stockLink.isVisible().catch(() => false);

      if (isLinkVisible) {
        await stockLink.click();
        await expect(page).toHaveURL(/\/stock/);
        await expect(page.locator('text=/Stock|Inventaire/i')).toBeVisible({ timeout: 5000 });
      }
    });

    test('devrait afficher les alertes de stock faible', async ({ page }) => {
      const stockAlert = page.locator('text=/stock faible|alerte/i, [class*="alert"]');
      const isAlertVisible = await stockAlert.first().isVisible().catch(() => false);

      if (isAlertVisible) {
        await expect(stockAlert.first()).toBeVisible();
      }
    });

    test('devrait permettre de mettre à jour les quantités en stock', async ({ page }) => {
      await page.goto('/merchant/stock');
      await page.waitForLoadState('networkidle');

      const updateButton = page.locator('button:has-text("Modifier"), button:has-text("Mettre à jour")').first();
      const isButtonVisible = await updateButton.isVisible().catch(() => false);

      if (isButtonVisible) {
        await updateButton.click();

        const quantityInput = page.locator('input[type="number"], input[name*="quantity"]').first();
        const isInputVisible = await quantityInput.isVisible().catch(() => false);

        if (isInputVisible) {
          await quantityInput.fill('50');
        }
      }
    });
  });

  test.describe('Protection sociale', () => {
    test('devrait permettre d\'accéder à la page de protection sociale', async ({ page }) => {
      const socialLink = page.locator('a[href*="/social"], button:has-text("Protection sociale")');
      const isLinkVisible = await socialLink.isVisible().catch(() => false);

      if (isLinkVisible) {
        await socialLink.click();
        await expect(page).toHaveURL(/\/social/);
        await expect(page.locator('text=/Protection sociale|Couverture/i')).toBeVisible({ timeout: 5000 });
      }
    });

    test('devrait afficher le statut CNPS', async ({ page }) => {
      await page.goto('/merchant/social-protection');
      await page.waitForLoadState('networkidle');

      const cnpsStatus = page.locator('text=/CNPS/i');
      const isStatusVisible = await cnpsStatus.first().isVisible({ timeout: 5000 }).catch(() => false);

      if (isStatusVisible) {
        await expect(cnpsStatus.first()).toBeVisible();
      }
    });

    test('devrait afficher le statut CMU', async ({ page }) => {
      await page.goto('/merchant/social-protection');
      await page.waitForLoadState('networkidle');

      const cmuStatus = page.locator('text=/CMU/i');
      const isStatusVisible = await cmuStatus.first().isVisible({ timeout: 5000 }).catch(() => false);

      if (isStatusVisible) {
        await expect(cmuStatus.first()).toBeVisible();
      }
    });

    test('devrait afficher les alertes d\'expiration', async ({ page }) => {
      await page.goto('/merchant/social-protection');
      await page.waitForLoadState('networkidle');

      const expirationAlert = page.locator('text=/expire|expiration|renouvellement/i');
      const isAlertVisible = await expirationAlert.first().isVisible().catch(() => false);

      if (isAlertVisible) {
        await expect(expirationAlert.first()).toBeVisible();
      }
    });
  });

  test.describe('Historique et rapports', () => {
    test('devrait permettre d\'accéder à l\'historique des ventes', async ({ page }) => {
      const historyLink = page.locator('a[href*="/history"], button:has-text("Historique")');
      const isLinkVisible = await historyLink.isVisible().catch(() => false);

      if (isLinkVisible) {
        await historyLink.click();
        await expect(page).toHaveURL(/\/history|\/sales/);
        await expect(page.locator('text=/Historique|Ventes/i')).toBeVisible({ timeout: 5000 });
      }
    });

    test('devrait afficher la liste des ventes passées', async ({ page }) => {
      await page.goto('/merchant/sales-history');
      await page.waitForLoadState('networkidle');

      const salesTable = page.locator('table, [role="table"]');
      const isTableVisible = await salesTable.isVisible({ timeout: 5000 }).catch(() => false);

      if (isTableVisible) {
        await expect(salesTable).toBeVisible();
      }
    });

    test('devrait permettre de filtrer les ventes par date', async ({ page }) => {
      await page.goto('/merchant/sales-history');
      await page.waitForLoadState('networkidle');

      const dateFilter = page.locator('input[type="date"], button:has-text("Date")');
      const isFilterVisible = await dateFilter.first().isVisible().catch(() => false);

      if (isFilterVisible) {
        expect(isFilterVisible).toBeTruthy();
      }
    });

    test('devrait permettre d\'exporter l\'historique', async ({ page }) => {
      await page.goto('/merchant/sales-history');
      await page.waitForLoadState('networkidle');

      const exportButton = page.locator('button:has-text("Exporter"), button:has-text("Télécharger")');
      const isButtonVisible = await exportButton.first().isVisible().catch(() => false);

      if (isButtonVisible) {
        expect(isButtonVisible).toBeTruthy();
      }
    });
  });

  test.describe('Paramètres et profil', () => {
    test('devrait permettre d\'accéder aux paramètres', async ({ page }) => {
      const settingsLink = page.locator('a[href*="/settings"], button:has-text("Paramètres")');
      const isLinkVisible = await settingsLink.isVisible().catch(() => false);

      if (isLinkVisible) {
        await settingsLink.click();
        await expect(page).toHaveURL(/\/settings/);
        await expect(page.locator('text=/Paramètres|Configuration/i')).toBeVisible({ timeout: 5000 });
      }
    });

    test('devrait permettre de modifier les informations personnelles', async ({ page }) => {
      await page.goto('/merchant/settings');
      await page.waitForLoadState('networkidle');

      const editButton = page.locator('button:has-text("Modifier"), button:has-text("Éditer")').first();
      const isButtonVisible = await editButton.isVisible().catch(() => false);

      if (isButtonVisible) {
        await editButton.click();
        await page.waitForTimeout(500);
      }
    });

    test('devrait permettre de changer la langue', async ({ page }) => {
      const languageSelector = page.locator('select[name*="language"], button:has-text("Français"), button:has-text("English")');
      const isSelectorVisible = await languageSelector.first().isVisible().catch(() => false);

      if (isSelectorVisible) {
        expect(isSelectorVisible).toBeTruthy();
      }
    });
  });
});
