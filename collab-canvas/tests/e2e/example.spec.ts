import { test, expect } from '@playwright/test';

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/');

  // Check if the page loads
  await expect(page).toHaveTitle(/CollabCanvas/);

  // Check if Nuxt welcome component is visible
  await expect(page.locator('text=Welcome to Nuxt')).toBeVisible();
});
