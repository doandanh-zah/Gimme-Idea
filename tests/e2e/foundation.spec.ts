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

test('product shell adapts across desktop, tablet and mobile', async ({ page }) => {
  await page.goto('/en/home');
  const viewport = page.viewportSize();

  if (viewport && viewport.width <= 760) {
    await expect(page.locator('.mobile-product-header')).toBeVisible();
    await expect(page.locator('.mobile-bottom-dock')).toBeVisible();
    await expect(page.locator('.product-sidebar')).toBeHidden();
  } else if (viewport && viewport.width <= 1180) {
    await expect(page.locator('.product-sidebar')).toBeVisible();
    await expect(page.locator('.discovery-rail')).toBeHidden();
  } else {
    await expect(page.locator('.product-sidebar')).toBeVisible();
    await expect(page.locator('.discovery-rail')).toBeVisible();
    await expect(page.locator('.product-shell')).toHaveCSS('max-width', '1440px');
  }

  await expect(page.locator('.product-main h1')).toContainText('Home');
});

test('Post chooses a type on Home and opens directly on Ideas', async ({ page }) => {
  await page.goto('/en/home');
  const viewport = page.viewportSize();
  const postButton =
    viewport && viewport.width <= 760
      ? page.locator('.dock-post-button')
      : page.locator('.sidebar-post-button');

  await postButton.click();
  await page.getByRole('button', { name: 'Post idea' }).filter({ visible: true }).click();
  await expect(page.locator('.composer-dialog')).toBeVisible();
  await expect(page.locator('#composer-title')).toHaveText('Post idea');
  await page.locator('.composer-header button').click();

  await page.goto('/en/ideas');
  await postButton.click();
  await expect(page.locator('.composer-dialog')).toBeVisible();
  await expect(page.locator('#composer-title')).toHaveText('Post idea');
});

test('Saved keeps Bookmarks and Likes in URL-addressable tabs', async ({ page }) => {
  await page.goto('/en/saved');
  await expect(page.locator('.saved-tabs a.is-active')).toHaveText('Bookmarks');
  await page.getByRole('link', { name: 'Likes', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/saved\?tab=likes/);
  await expect(page.locator('.saved-tabs a.is-active')).toHaveText('Likes');
});

test('canonical detail pages retain their chapter index inside the shell', async ({ page }) => {
  await page.goto('/en/problems/restaurant-food-waste');

  await expect(page.locator('.product-shell')).toBeVisible();
  await expect(page.locator('.page-index')).toBeVisible();
  await expect(page.locator('.content-section')).toHaveCount(4);
  await expect(page.locator('#overview .chapter-heading')).toContainText('Overview');
});

test('landing remains outside the product shell', async ({ page }) => {
  await page.goto('/en');
  await expect(page.locator('.landing-header')).toBeVisible();
  await expect(page.locator('.product-shell')).toHaveCount(0);
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
