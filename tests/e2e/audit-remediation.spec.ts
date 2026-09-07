import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const locale of ['en', 'vi']) {
  test(`${locale} legal documents are readable and have confirmed contact links`, async ({
    page,
  }) => {
    for (const document of ['terms', 'privacy']) {
      const response = await page.goto(`/${locale}/${document}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('main a[href="mailto:doanzah2710@gmail.com"]')).toHaveCount(1);
      await expect(page.locator('main a[href="https://t.me/doandanh_zah"]')).toHaveCount(1);
      await expect(page.locator('#legal-draft-title')).toContainText(
        locale === 'vi' ? 'Bản dự thảo' : 'Draft',
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const result = await new AxeBuilder({ page }).include('main').analyze();
      expect(result.violations).toEqual([]);
    }
  });
}

test('reading privacy from sign-in preserves the originating dialog', async ({ page }) => {
  await page.goto('/en/notifications');
  await page.locator('.app-empty-state').getByRole('button', { name: 'Sign in' }).click();
  const dialog = page.locator('dialog.auth-dialog[open]');
  await expect(dialog).toBeVisible();
  const [document] = await Promise.all([
    page.waitForEvent('popup'),
    dialog.getByRole('link', { name: 'Privacy Policy (opens in a new tab)', exact: true }).click(),
  ]);
  await expect(document).toHaveURL(/\/en\/privacy$/);
  await expect(document.getByRole('heading', { level: 1 })).toHaveText('Privacy Policy');
  await document.close();
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog.auth-dialog[open]')).toHaveCount(0);
  await expect(
    page.locator('.app-empty-state').getByRole('button', { name: 'Sign in' }),
  ).toBeFocused();
});

test('search resolves a natural phrase and preserves it when switching language', async ({
  page,
}) => {
  await page.goto('/en/search?q=food%20waste');
  await expect(
    page.getByRole('link', { name: /problem Restaurants cannot match daily supply/ }),
  ).toBeVisible();
  // The mobile language switch is in the menu; the desktop switch is in the top bar.
  const language = page.getByRole('link', { name: 'VI', exact: true });
  if (!(await language.isVisible()))
    await page
      .locator('.mobile-product-header')
      .getByRole('button', { name: 'Menu', exact: true })
      .click();
  await page.getByRole('link', { name: 'VI', exact: true }).click();
  await expect(page).toHaveURL(/\/vi\/search\?q=food(?:\+|%20)waste/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
});
