import { expect, test } from '@playwright/test';

test('discovery filters recover from an empty search', async ({ page }) => {
  await page.goto('/en/home');
  const filters = page.getByRole('group', { name: 'Filter feed' });
  await filters.getByRole('button', { name: 'Bounties', exact: true }).click();
  await expect(filters.getByRole('button', { name: 'Bounties', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByLabel('Search this feed').fill('no-matching-discovery-894571');
  await expect(page.getByRole('heading', { name: 'No matching discoveries yet' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await expect(page.getByLabel('Search this feed')).toHaveValue('');
  await expect(filters.getByRole('button', { name: 'Explore', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('.v1-feed .v1-record-card').first()).toBeVisible();
});

test('guest notifications explain how to continue and open sign in', async ({ page }) => {
  await page.goto('/en/notifications');
  await page.locator('.app-empty-state').getByRole('button').click();
  await expect(page.locator('.auth-dialog')).toBeVisible();
  await page.locator('.auth-dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.locator('.auth-dialog')).toBeHidden();
});

test('reduced motion preserves the landing content without a WebGL canvas', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/vi');
  await expect(page.locator('h1')).toContainText('Vấn đề ở');
  await expect(page.locator('.signal-step')).toHaveCount(7);
  await expect(page.locator('canvas')).toHaveCount(0);
  for (const step of await page.locator('.signal-step').all()) {
    await step.scrollIntoViewIfNeeded();
    await expect(step).toBeVisible();
    await expect(step).toHaveCSS('opacity', '1');
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
