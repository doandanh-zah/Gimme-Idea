import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const locale of ['en', 'vi']) {
  test(`${locale} landing exposes SSR content and keyboard navigation`, async ({ page }) => {
    await page.goto(`/${locale}`);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('main')).toContainText(
      locale === 'en' ? 'Find the problem.' : 'Tìm đúng vấn đề.',
    );
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

test('problem and idea pages render API data without Three.js', async ({ page }) => {
  const threeRequests: string[] = [];
  page.on('request', (request) => {
    if (/three|react-three/i.test(request.url())) threeRequests.push(request.url());
  });
  await page.goto('/en/problems/restaurant-food-waste');
  await expect(page.locator('h1')).toContainText('Restaurants');
  await page.goto('/en/ideas/demand-pulse-for-kitchens');
  await expect(page.locator('h1')).toContainText('Demand Pulse');
  expect(threeRequests).toEqual([]);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('keeps the complete landing narrative visible', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('.signal-step')).toHaveCount(6);
    await expect(page.locator('.signal-step').first()).toBeVisible();
  });
});

test('canonical HTML survives JavaScript being disabled', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL ?? 'http://127.0.0.1:3000'}/en`);
  await expect(page.locator('h1')).toContainText('Find the problem.');
  await expect(page.getByRole('link', { name: 'Explore a problem' })).toBeVisible();
  await page.goto(`${baseURL ?? 'http://127.0.0.1:3000'}/en/problems/restaurant-food-waste`);
  await expect(page.locator('main')).toContainText('Problem frame');
  await page.goto(`${baseURL ?? 'http://127.0.0.1:3000'}/en/ideas/demand-pulse-for-kitchens`);
  await expect(page.locator('main')).toContainText('The useful product is not a perfect forecast.');
  await context.close();
});

test('unknown canonical slugs return the not-found experience', async ({ page }) => {
  await page.goto('/en/problems/not-a-real-problem');
  await expect(page.locator('main')).toContainText('This node is not in the network.');
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', /noindex/);
});
