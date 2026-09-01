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

    const shellBox = await page.locator('.product-shell').boundingBox();
    const sidebarBox = await page.locator('.product-sidebar').boundingBox();
    const mainBox = await page.locator('.product-main').boundingBox();
    const railBox = await page.locator('.discovery-rail').boundingBox();
    expect(shellBox).not.toBeNull();
    expect(sidebarBox).not.toBeNull();
    expect(mainBox).not.toBeNull();
    expect(railBox).not.toBeNull();
    expect(sidebarBox!.width / shellBox!.width).toBeCloseTo(0.2, 2);
    expect(mainBox!.width / shellBox!.width).toBeCloseTo(0.55, 2);
    expect(railBox!.width / shellBox!.width).toBeCloseTo(0.25, 2);
  }

  await expect(page.locator('.product-main h1')).toContainText('Home');
});

test('knowledge post cards show creator identity and open the detail route', async ({ page }) => {
  await page.goto('/en/ideas');
  const card = page.locator('.knowledge-post-link').first();

  await expect(card).toContainText('Minh Nguyen');
  await expect(card).toContainText('@minh-nguyen');
  await expect(card.locator('.knowledge-post-kind')).toHaveAttribute('aria-label', 'Idea');
  await expect(card.locator('time')).toHaveAttribute('datetime', /2026-08-21/);
  await expect(card).toContainText('Demand Pulse for independent kitchens');
  await expect(card).toContainText('A calm planning signal');
  await expect(card).not.toContainText('Verified');
  await expect(card).not.toContainText('Open details');
  await expect(card.locator('img')).toHaveCount(0);
  await expect(card.locator('.knowledge-post-actions')).toBeVisible();
  await expect(card.locator('.knowledge-post-more')).toHaveCount(0);
  await expect(card.getByRole('button', { name: 'Quote' })).toBeVisible();
  await expect(card.locator('h2')).toHaveCSS('color', 'rgb(255, 215, 0)');
  await expect(card.locator('.knowledge-post-kind')).toHaveCSS('color', 'rgb(255, 215, 0)');
  await expect(card.locator('.knowledge-post-action.is-like .lucide-lightbulb')).toHaveCount(1);
  await expect(card.locator('.knowledge-post-action.is-like .lucide-heart')).toHaveCount(0);
  expect(
    await card
      .locator('.knowledge-post-action-group')
      .first()
      .locator(':scope > *')
      .evaluateAll((actions) => actions.map((action) => action.className)),
  ).toEqual([
    expect.stringContaining('is-like'),
    expect.stringContaining('is-quote'),
    expect.stringContaining('is-views'),
  ]);

  await card.locator('h2').click();
  await expect(page).toHaveURL(/\/en\/ideas\/demand-pulse-for-kitchens$/);
  await expect(page.locator('h1')).toContainText('Demand Pulse');
});

test('problem cards show real bounty and hiring signals only when attached', async ({ page }) => {
  await page.goto('/en/problems');
  const unfundedCard = page
    .locator('.knowledge-post-link')
    .filter({ hasText: 'Restaurants cannot match daily supply' });
  const hiringCard = page
    .locator('.knowledge-post-link')
    .filter({ hasText: 'Tenants cannot track shared-building repair' });

  await expect(unfundedCard).not.toContainText('$250');
  await expect(unfundedCard.locator('.bounty-signal')).toHaveCount(0);
  await expect(unfundedCard.locator('.job-signal')).toHaveCount(0);
  await expect(hiringCard).toContainText('Alex Chen');
  await expect(hiringCard).toContainText('@alex-chen');
  await expect(hiringCard.locator('.bounty-signal.is-funded')).toContainText('$1,000');
  await expect(hiringCard.locator('.job-signal')).toHaveAttribute('aria-label', 'Hiring');
  await expect(unfundedCard.locator('h2')).toHaveCSS('color', 'rgb(153, 69, 255)');
  await expect(unfundedCard.locator('.knowledge-post-kind')).toHaveCSS(
    'color',
    'rgb(153, 69, 255)',
  );
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

test('quote composer publishes a Home-only post', async ({ page }) => {
  await page.goto('/en/ideas');
  await page.getByRole('button', { name: 'Quote' }).click();
  await expect(page.locator('.quote-dialog')).toBeVisible();
  await page.getByLabel("What's your take?").fill('This is the smallest useful test.');
  await page.locator('.quote-dialog').getByRole('button', { name: 'Post' }).click();
  await expect(page).toHaveURL(/\/en\/home\/[0-9a-f-]+$/i);
  await expect(page.locator('.quote-body')).toContainText('This is the smallest useful test.');
  await expect(page.locator('.quoted-embed')).toContainText('Demand Pulse');
  await expect(page.locator('.quoted-embed.is-embed .knowledge-post-avatar')).toBeVisible();
  expect(
    await page
      .locator('.quote-post .knowledge-post-action-group')
      .first()
      .locator(':scope > *')
      .evaluateAll((actions) => actions.map((action) => action.className)),
  ).toEqual([
    expect.stringContaining('is-comment'),
    expect.stringContaining('is-quote'),
    expect.stringContaining('is-views'),
    expect.stringContaining('is-like'),
  ]);

  await page.locator('.quoted-embed').click();
  await expect(page).toHaveURL(/\/en\/ideas\/demand-pulse-for-kitchens$/);

  await page.goto('/en/home');
  await page.locator('.quote-body').click();
  await expect(page).toHaveURL(/\/en\/home\/[0-9a-f-]+$/i);
  await page.getByPlaceholder('Post your reply').fill('A nested reply.');
  await page.locator('.comment-composer').getByRole('button', { name: 'Reply' }).click();
  await expect(page.locator('.comment-node')).toContainText('A nested reply.');

  const rootComment = page.locator('.comment-node').filter({ hasText: 'A nested reply.' }).first();
  await rootComment.getByRole('button', { name: 'Reply' }).first().click();
  await rootComment.getByPlaceholder('Post your reply').fill('A reply to the reply.');
  await rootComment.locator('.comment-composer').getByRole('button', { name: 'Reply' }).click();
  const firstReply = page
    .locator('.comment-node.is-reply')
    .filter({ hasText: 'A reply to the reply.' });
  await expect(firstReply).toBeVisible();

  await firstReply.getByRole('button', { name: 'Reply' }).click();
  await firstReply.getByPlaceholder('Post your reply').fill('A third-level reply.');
  await firstReply.locator('.comment-composer').getByRole('button', { name: 'Reply' }).click();
  const replyBoxes = await page.locator('.comment-node.is-reply').evaluateAll((nodes) =>
    nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return { left: rect.left, right: rect.right };
    }),
  );
  expect(replyBoxes).toHaveLength(2);
  expect(
    Math.max(...replyBoxes.map((box) => box.left)) - Math.min(...replyBoxes.map((box) => box.left)),
  ).toBeLessThan(2);
  const mainBox = await page.locator('.product-main').boundingBox();
  expect(mainBox).not.toBeNull();
  expect(Math.max(...replyBoxes.map((box) => box.right))).toBeLessThanOrEqual(
    mainBox!.x + mainBox!.width + 1,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);

  await rootComment.getByRole('button', { name: 'Quote comment' }).first().click();
  await page.getByLabel("What's your take?").fill('Turning this comment into a new post.');
  await page.locator('.quote-dialog').getByRole('button', { name: 'Post' }).click();
  await expect(page).toHaveURL(/\/en\/home\/[0-9a-f-]+$/i);
  await expect(page.locator('.quoted-comment')).toContainText('A nested reply.');
});

test('Post composer publishes Idea and Problem cards with media and opportunity signals', async ({
  page,
}) => {
  const pixel = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  );

  await page.goto('/en/ideas');
  await expect(page.getByRole('heading', { name: 'Ideas', exact: true })).toBeVisible();
  const viewport = page.viewportSize();
  const postButton =
    viewport && viewport.width <= 760
      ? page.locator('.dock-post-button')
      : page.locator('.sidebar-post-button');
  await postButton.click();
  const composer = page.locator('.post-composer-dialog');
  await composer.getByLabel('Title').fill('A media-aware kitchen idea');
  await composer
    .getByLabel('Description')
    .fill('A post should carry the visual evidence selected at publishing time.');
  await composer.getByLabel('Primary Problem').selectOption('restaurant-food-waste');
  await composer.locator('input[type="file"]').setInputFiles([
    { name: 'concept-a.png', mimeType: 'image/png', buffer: pixel },
    { name: 'concept-b.png', mimeType: 'image/png', buffer: pixel },
    {
      name: 'walkthrough.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from([0, 0, 0, 16, 102, 116, 121, 112]),
    },
  ]);
  await expect(composer.locator('.composer-media-list li')).toHaveCount(3);
  await composer.getByRole('button', { name: 'Post', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/ideas#post-/);
  const ideaCard = page
    .locator('.knowledge-post-link')
    .filter({ hasText: 'A media-aware kitchen idea' });
  await expect(ideaCard.locator('img.stored-post-media')).toHaveCount(2);
  await expect(ideaCard.locator('video.stored-post-media')).toHaveCount(1);
  await expect(ideaCard.getByLabel('Add photo or video')).toHaveCount(0);

  await page.reload();
  const persistedIdea = page
    .locator('.knowledge-post-link')
    .filter({ hasText: 'A media-aware kitchen idea' });
  await expect(persistedIdea.locator('img.stored-post-media')).toHaveCount(2);
  await expect(persistedIdea.locator('video.stored-post-media')).toHaveCount(1);

  await persistedIdea.getByRole('button', { name: 'Quote' }).click();
  await page.getByLabel("What's your take?").fill('The complete card belongs in this discussion.');
  await page.locator('.quote-dialog').getByRole('button', { name: 'Post' }).click();
  const quotedIdea = page.locator('.quoted-embed.is-embed').filter({
    hasText: 'A media-aware kitchen idea',
  });
  await expect(quotedIdea.locator('.knowledge-post-avatar')).toBeVisible();
  await expect(quotedIdea.locator('img.stored-post-media')).toHaveCount(2);
  await expect(quotedIdea.locator('video.stored-post-media')).toHaveCount(1);

  await page.goto('/en/problems');
  await expect(page.getByRole('heading', { name: 'Problems', exact: true })).toBeVisible();
  await postButton.click();
  await composer.getByLabel('Title').fill('Operators need visible repair ownership');
  await composer
    .getByLabel('Description')
    .fill('A posted Problem can include a funded opportunity and a hiring signal.');
  await composer.getByLabel('Bounty (USDC)').fill('1250');
  await composer.getByLabel('This Problem is also hiring').check();
  await composer.getByRole('button', { name: 'Post', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/problems#post-/);
  const problemCard = page
    .locator('.knowledge-post-link')
    .filter({ hasText: 'Operators need visible repair ownership' });
  await expect(problemCard.locator('.bounty-signal')).toContainText('$1,250');
  await expect(problemCard.locator('.job-signal')).toHaveAttribute('aria-label', 'Hiring');
});

test('sidebar lists Bounties and Talent under Problems', async ({ page }) => {
  await page.goto('/en/home');
  const viewport = page.viewportSize();
  if (viewport && viewport.width <= 760) {
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.locator('.mobile-product-menu a[href$="/bounties"]')).toBeVisible();
    await expect(page.locator('.mobile-product-menu a[href$="/talent"]')).toBeVisible();
    await expect(page.locator('.mobile-product-menu a[href$="/saved"]')).toBeVisible();
  } else if (viewport && viewport.width <= 1180) {
    await page.getByRole('button', { name: 'More' }).click();
    await expect(page.locator('#more-navigation a[href$="/bounties"]')).toBeVisible();
    await expect(page.locator('#more-navigation a[href$="/talent"]')).toBeVisible();
    await expect(page.locator('#more-navigation a[href$="/saved"]')).toBeVisible();
  } else {
    await expect(page.locator('.sidebar-nav > a[href$="/bounties"]')).toBeVisible();
    await expect(page.locator('.sidebar-nav > a[href$="/talent"]')).toBeVisible();
    await page.locator('.product-sidebar a[href$="/bounties"]').click();
    await expect(page.getByRole('heading', { name: 'Bounties', exact: true })).toBeVisible();
  }
});

test('compact sidebar keeps overflow links in More and account pinned', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 600 });
  await page.goto('/en/home');
  await expect(page.locator('.product-sidebar')).toBeVisible();
  await expect(page.locator('.sidebar-nav > a[href$="/bounties"]')).toHaveCount(0);
  await expect(page.locator('.sidebar-nav > a[href$="/talent"]')).toHaveCount(0);
  await expect(page.locator('.sidebar-nav > a[href$="/saved"]')).toHaveCount(0);

  await page.getByRole('button', { name: 'More' }).click();
  await expect(page.locator('#more-navigation a[href$="/bounties"]')).toBeVisible();
  await expect(page.locator('#more-navigation a[href$="/talent"]')).toBeVisible();
  await expect(page.locator('#more-navigation a[href$="/saved"]')).toBeVisible();

  const sidebarBox = await page.locator('.product-sidebar').boundingBox();
  const accountBox = await page.locator('.account-control').boundingBox();
  expect(sidebarBox).not.toBeNull();
  expect(accountBox).not.toBeNull();
  expect(sidebarBox!.y + sidebarBox!.height - (accountBox!.y + accountBox!.height)).toBeLessThan(
    24,
  );
});

test('Saved keeps Bookmarks and Likes in URL-addressable tabs', async ({ page }) => {
  await page.goto('/en/ideas');
  const card = page.locator('.knowledge-post-link').first();
  await card.getByRole('button', { name: 'Save' }).click();
  await card.getByRole('button', { name: 'Like' }).click();

  await page.goto('/en/saved');
  await expect(page.locator('.saved-tabs a.is-active')).toHaveText('Bookmarks');
  await expect(page.locator('.knowledge-post-link')).toContainText('Demand Pulse');
  await page.getByRole('link', { name: 'Likes', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/saved\?tab=likes/);
  await expect(page.locator('.saved-tabs a.is-active')).toHaveText('Likes');
  await expect(page.locator('.knowledge-post-link')).toContainText('Demand Pulse');
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
