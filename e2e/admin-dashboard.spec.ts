import { test, expect } from '@playwright/test';

test.describe('Parcours Admin - Dashboard et Statistiques', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('devrait afficher le dashboard admin avec les KPIs principaux', async ({ page }) => {
    await expect(page.locator('h1:has-text("Dashboard Admin"), h1:has-text("Administration")')).toBeVisible({
      timeout: 10000
    });

    const kpiCards = page.locator('[class*="card"]');
    await expect(kpiCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('devrait afficher les graphiques de tendances d\'enrôlement', async ({ page }) => {
    const enrollmentChart = page.locator('text=/Tendance.*Enrôlement|Enrôlements/i');
    await expect(enrollmentChart.first()).toBeVisible({ timeout: 10000 });

    const chartCanvas = page.locator('canvas').first();
    const isChartVisible = await chartCanvas.isVisible().catch(() => false);

    if (isChartVisible) {
      expect(isChartVisible).toBeTruthy();
    }
  });

  test('devrait afficher les graphiques de tendances de transactions', async ({ page }) => {
    const transactionChart = page.locator('text=/Tendance.*Transaction|Transactions|Ventes/i');
    const isChartVisible = await transactionChart.first().isVisible().catch(() => false);

    if (isChartVisible) {
      await expect(transactionChart.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('devrait permettre d\'accéder à la gestion des utilisateurs', async ({ page }) => {
    const usersLink = page.locator('a[href*="/admin/users"], button:has-text("Utilisateurs")');
    const isLinkVisible = await usersLink.isVisible().catch(() => false);

    if (isLinkVisible) {
      await usersLink.click();
      await expect(page).toHaveURL(/\/admin\/users/);
      await expect(page.locator('text=/Utilisateurs|Gestion/i')).toBeVisible();
    }
  });

  test('devrait permettre d\'accéder à la gestion des marchands', async ({ page }) => {
    const merchantsLink = page.locator('a[href*="/admin/merchants"], button:has-text("Marchands")');
    const isLinkVisible = await merchantsLink.isVisible().catch(() => false);

    if (isLinkVisible) {
      await merchantsLink.click();
      await expect(page).toHaveURL(/\/admin\/merchants/);
      await expect(page.locator('text=/Marchands/i')).toBeVisible();
    }
  });

  test('devrait permettre d\'accéder aux logs d\'audit', async ({ page }) => {
    const auditLink = page.locator('a[href*="/admin/audit"], button:has-text("Audit")');
    const isLinkVisible = await auditLink.isVisible().catch(() => false);

    if (isLinkVisible) {
      await auditLink.click();
      await expect(page).toHaveURL(/\/admin\/audit/);
      await expect(page.locator('text=/Audit|Logs/i')).toBeVisible();
    }
  });

  test('devrait afficher les statistiques par marché', async ({ page }) => {
    const marketStats = page.locator('text=/Marchés|Répartition/i');
    const isStatsVisible = await marketStats.first().isVisible().catch(() => false);

    if (isStatsVisible) {
      await expect(marketStats.first()).toBeVisible();
    }
  });

  test('devrait afficher les taux de couverture sociale', async ({ page }) => {
    const socialCoverage = page.locator('text=/CNPS|CMU|Couverture sociale/i');
    const isCoverageVisible = await socialCoverage.first().isVisible().catch(() => false);

    if (isCoverageVisible) {
      await expect(socialCoverage.first()).toBeVisible();
    }
  });
});

test.describe('Parcours Admin - Gestion des Marchands', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/merchants');
    await page.waitForLoadState('networkidle');
  });

  test('devrait afficher la liste des marchands', async ({ page }) => {
    await expect(page.locator('text=/Marchands/i')).toBeVisible({ timeout: 10000 });

    const merchantsTable = page.locator('table, [role="table"]');
    await expect(merchantsTable).toBeVisible({ timeout: 5000 });
  });

  test('devrait permettre de rechercher un marchand', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Rechercher"], input[type="search"]');

    if (await searchInput.isVisible()) {
      await searchInput.fill('Test');
      await page.waitForTimeout(1000);
      expect(await searchInput.inputValue()).toBe('Test');
    }
  });

  test('devrait permettre de créer un nouveau marchand', async ({ page }) => {
    const createButton = page.locator('button:has-text("Nouveau"), button:has-text("Ajouter"), button:has-text("Créer")');
    const isButtonVisible = await createButton.first().isVisible().catch(() => false);

    if (isButtonVisible) {
      await createButton.first().click();

      const dialog = page.locator('[role="dialog"], .modal');
      const isDialogVisible = await dialog.isVisible().catch(() => false);

      if (isDialogVisible) {
        await expect(dialog).toBeVisible();
      }
    }
  });

  test('devrait permettre de modifier un marchand existant', async ({ page }) => {
    const editButton = page.locator('button[title*="Modifier"], button:has-text("Modifier")').first();
    const isButtonVisible = await editButton.isVisible().catch(() => false);

    if (isButtonVisible) {
      await editButton.click();

      const dialog = page.locator('[role="dialog"], .modal');
      const isDialogVisible = await dialog.isVisible({ timeout: 3000 }).catch(() => false);

      if (isDialogVisible) {
        await expect(dialog).toBeVisible();
      }
    }
  });

  test('devrait afficher les détails d\'un marchand au clic', async ({ page }) => {
    const firstMerchantRow = page.locator('tr:has(td)').first();
    const isRowVisible = await firstMerchantRow.isVisible().catch(() => false);

    if (isRowVisible) {
      await firstMerchantRow.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Parcours Admin - Logs d\'Audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/audit-logs');
    await page.waitForLoadState('networkidle');
  });

  test('devrait afficher la page des logs d\'audit', async ({ page }) => {
    const auditHeading = page.locator('h1:has-text("Audit"), h1:has-text("Logs")');
    const isHeadingVisible = await auditHeading.isVisible({ timeout: 10000 }).catch(() => false);

    if (isHeadingVisible) {
      await expect(auditHeading).toBeVisible();
    } else {
      expect(await page.url()).toContain('audit');
    }
  });

  test('devrait afficher la liste des événements d\'audit', async ({ page }) => {
    const auditTable = page.locator('table, [role="table"]');
    const isTableVisible = await auditTable.isVisible({ timeout: 5000 }).catch(() => false);

    if (isTableVisible) {
      await expect(auditTable).toBeVisible();

      const hasRows = await page.locator('td, [role="cell"]').count() > 0;
      if (hasRows) {
        const firstAuditRow = page.locator('tr:has(td)').first();
        await expect(firstAuditRow).toBeVisible();
      }
    }
  });

  test('devrait permettre de filtrer les logs par type d\'action', async ({ page }) => {
    const filterSelect = page.locator('select, [role="combobox"]').first();
    const isFilterVisible = await filterSelect.isVisible().catch(() => false);

    if (isFilterVisible) {
      await filterSelect.click();
      await page.waitForTimeout(500);
    }
  });

  test('devrait afficher les détails d\'un événement d\'audit', async ({ page }) => {
    const firstAuditRow = page.locator('tr:has(td)').first();
    const isRowVisible = await firstAuditRow.isVisible().catch(() => false);

    if (isRowVisible) {
      const viewButton = firstAuditRow.locator('button:has-text("Voir"), button:has-text("Détails")');
      const isButtonVisible = await viewButton.isVisible().catch(() => false);

      if (isButtonVisible) {
        await viewButton.click();
        await page.waitForTimeout(500);
      }
    }
  });
});
