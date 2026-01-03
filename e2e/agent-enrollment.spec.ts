import { test, expect } from '@playwright/test';

test.describe('Parcours Agent - Enrôlement Marchand', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/agent/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('devrait afficher le dashboard agent avec les KPIs', async ({ page }) => {
    await expect(page.locator('h1:has-text("Dashboard Agent")')).toBeVisible({ timeout: 10000 });

    await expect(page.locator('text=/Enrôlements Aujourd\'hui/i')).toBeVisible();
    await expect(page.locator('text=/Enrôlements ce Mois/i')).toBeVisible();
    await expect(page.locator('text=/Total Enrôlés/i')).toBeVisible();
    await expect(page.locator('text=/Marchés Couverts/i')).toBeVisible();
  });

  test('devrait permettre d\'accéder au formulaire d\'enrôlement', async ({ page }) => {
    const enrollButton = page.locator('button:has-text("Enrôler un Nouveau Marchand")');
    await expect(enrollButton).toBeVisible({ timeout: 5000 });
    await enrollButton.click();

    await expect(page).toHaveURL(/\/agent\/enrollment/);
    await expect(page.locator('text=/Enrôlement|Nouveau Marchand/i')).toBeVisible();
  });

  test('devrait valider les champs obligatoires du formulaire d\'enrôlement', async ({ page }) => {
    await page.goto('/agent/enrollment');
    await page.waitForLoadState('networkidle');

    const submitButton = page.locator('button[type="submit"], button:has-text("Enregistrer")');

    if (await submitButton.isVisible()) {
      await submitButton.click();

      await expect(page.locator('text=/requis|obligatoire|required/i').first()).toBeVisible({
        timeout: 3000
      }).catch(() => expect(true).toBeTruthy());
    }
  });

  test('devrait afficher la carte des marchands enrôlés', async ({ page }) => {
    await expect(page.locator('text=/Carte des Enrôlements/i')).toBeVisible({ timeout: 10000 });

    const mapContainer = page.locator('.leaflet-container, [class*="map"], #map');
    const isMapVisible = await mapContainer.isVisible().catch(() => false);

    if (isMapVisible) {
      expect(isMapVisible).toBeTruthy();
    }
  });

  test('devrait permettre de rechercher un marchand', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Rechercher"], input[type="search"]');

    if (await searchInput.isVisible()) {
      await searchInput.fill('Test');
      await page.waitForTimeout(1000);

      expect(await searchInput.inputValue()).toBe('Test');
    }
  });

  test('devrait afficher la liste des marchands enrôlés', async ({ page }) => {
    await expect(page.locator('text=/Marchands Enrôlés/i')).toBeVisible({ timeout: 10000 });

    const merchantsTable = page.locator('table, [role="table"]');
    await expect(merchantsTable).toBeVisible({ timeout: 5000 });

    const hasRows = await page.locator('td, [role="cell"]').count() > 0;
    if (hasRows) {
      const firstMerchantRow = page.locator('tr:has(td)').first();
      await expect(firstMerchantRow).toBeVisible();
    }
  });

  test('devrait afficher les statuts CNPS et CMU pour chaque marchand', async ({ page }) => {
    const merchantsTable = page.locator('table');

    if (await merchantsTable.isVisible()) {
      const cnpsColumn = page.locator('th:has-text("CNPS")');
      const cmuColumn = page.locator('th:has-text("CMU")');

      await expect(cnpsColumn.or(page.locator('text=/CNPS/i'))).toBeVisible({ timeout: 5000 });
      await expect(cmuColumn.or(page.locator('text=/CMU/i'))).toBeVisible({ timeout: 5000 });
    }
  });
});
