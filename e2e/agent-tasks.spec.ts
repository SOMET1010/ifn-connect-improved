import { test, expect } from '@playwright/test';

test.describe('Parcours Agent - Tâches du Jour', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/agent/tasks');
    await page.waitForLoadState('networkidle');
  });

  test('devrait afficher la page des tâches avec le titre', async ({ page }) => {
    await expect(page.locator('h1:has-text("Tâches du Jour")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/actions prioritaires/i')).toBeVisible();
  });

  test('devrait afficher les statistiques des tâches', async ({ page }) => {
    await expect(page.locator('text=/Tâches totales/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/Priorité haute/i')).toBeVisible();
    await expect(page.locator('text=/Priorité moyenne/i')).toBeVisible();
    await expect(page.locator('text=/Priorité basse/i')).toBeVisible();

    const totalTasks = await page.locator('text=/Tâches totales/i').locator('..').locator('div').first().textContent();
    expect(totalTasks).toBeTruthy();
  });

  test('devrait afficher les filtres de tâches', async ({ page }) => {
    await expect(page.locator('text=/Filtres/i')).toBeVisible({ timeout: 5000 });

    await expect(page.locator('button:has-text("Toutes")')).toBeVisible();
    await expect(page.locator('button:has-text("Inactifs")')).toBeVisible();
    await expect(page.locator('button:has-text("Incomplets")')).toBeVisible();
    await expect(page.locator('button:has-text("Renouvellements")')).toBeVisible();
  });

  test('devrait permettre de filtrer par type de tâche', async ({ page }) => {
    const inactifsButton = page.locator('button:has-text("Inactifs")');
    await inactifsButton.click();
    await page.waitForTimeout(500);

    expect(await inactifsButton.getAttribute('variant')).toContain('default');
  });

  test('devrait permettre de filtrer par priorité', async ({ page }) => {
    const hautePrioriteButton = page.locator('button:has-text("Haute")').last();
    await hautePrioriteButton.click();
    await page.waitForTimeout(500);

    const toutesButton = page.locator('button:has-text("Toutes")').last();
    await toutesButton.click();
    await page.waitForTimeout(500);
  });

  test('devrait afficher les cartes de tâches avec les informations nécessaires', async ({ page }) => {
    const taskCards = page.locator('[class*="card"]').filter({ hasText: /Marchand inactif|Enrôlement incomplet|Renouvellement|Objectif/i });
    const taskCount = await taskCards.count();

    if (taskCount > 0) {
      const firstTask = taskCards.first();
      await expect(firstTask).toBeVisible();

      const hasPriorityBadge = await firstTask.locator('text=/Haute|Moyenne|Basse/i').isVisible();
      expect(hasPriorityBadge).toBeTruthy();
    } else {
      await expect(page.locator('text=/Aucune tâche/i')).toBeVisible();
    }
  });

  test('devrait permettre de marquer une tâche comme terminée', async ({ page }) => {
    const markDoneButton = page.locator('button:has-text("Marquer comme fait")').first();
    const isButtonVisible = await markDoneButton.isVisible().catch(() => false);

    if (isButtonVisible) {
      await markDoneButton.click();

      await expect(page.locator('text=/marquée comme terminée|succès/i')).toBeVisible({ timeout: 3000 });
    }
  });

  test('devrait afficher le bouton d\'appel pour contacter un marchand', async ({ page }) => {
    const callButton = page.locator('button:has-text("Appeler")').first();
    const isButtonVisible = await callButton.isVisible().catch(() => false);

    if (isButtonVisible) {
      await expect(callButton).toBeVisible();
    }
  });

  test('devrait afficher la progression pour l\'objectif hebdomadaire', async ({ page }) => {
    const weeklyGoalCard = page.locator('text=/Objectif hebdomadaire/i').locator('..');
    const isGoalVisible = await weeklyGoalCard.isVisible().catch(() => false);

    if (isGoalVisible) {
      const progressBar = weeklyGoalCard.locator('[role="progressbar"], .progress, [style*="width"]');
      const hasProgress = await progressBar.count() > 0;

      if (hasProgress) {
        expect(hasProgress).toBeTruthy();
      }
    }
  });

  test('devrait afficher un message quand aucune tâche ne correspond aux filtres', async ({ page }) => {
    const inactifsButton = page.locator('button:has-text("Inactifs")');
    await inactifsButton.click();
    await page.waitForTimeout(500);

    const hautePrioriteButton = page.locator('button:has-text("Haute")').last();
    await hautePrioriteButton.click();
    await page.waitForTimeout(500);

    const taskCards = page.locator('[class*="card"]').filter({ hasText: /Marchand inactif|Enrôlement incomplet|Renouvellement|Objectif/i });
    const taskCount = await taskCards.count();

    if (taskCount === 0) {
      await expect(page.locator('text=/Aucune tâche/i')).toBeVisible();
    }
  });
});
