import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function useDevAccount(page: Page) {
  const response = await page.request.post('http://127.0.0.1:3001/v1/auth/mock');
  expect(response.ok()).toBe(true);
  const payload = (await response.json()) as {
    user: { id: string; displayName: string; username: string; avatarUrl: null };
    wallet: { address: string; network: 'devnet'; custody: 'development-server' };
  };
  expect(payload.wallet.address).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
  await page.addInitScript((account) => {
    window.localStorage.setItem(
      'gimme-idea-auth-v3',
      JSON.stringify({
        id: `dev:${account.user.id}`,
        displayName: account.user.displayName,
        username: account.user.username,
        avatarUrl: account.user.avatarUrl,
        avatarInitials: 'DB',
        createdAt: '2026-09-03T00:00:00.000Z',
        authProvider: 'dev',
        wallet: {
          kind: 'gimme-embedded',
          status: 'ready',
          network: 'devnet',
          custody: account.wallet.custody,
          address: account.wallet.address,
          smartWalletAddress: null,
          balanceUsdc: '0',
          activities: [],
        },
      }),
    );
  }, payload);
  return payload;
}

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
  await expect(page.locator('main h1').first()).toContainText('Restaurants');
  await page.goto('/en/ideas/demand-pulse-for-kitchens');
  await expect(page.locator('main h1').first()).toContainText('Demand Pulse');
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
  const card = page.locator('.feed-stream > .knowledge-post-link').first();

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
  await expect(page.locator('main h1').first()).toContainText('Demand Pulse');
});

test('problem cards show real bounty and hiring signals only when attached', async ({ page }) => {
  await page.goto('/en/problems');
  const unfundedCard = page
    .locator('.feed-stream > .knowledge-post-link')
    .filter({ hasText: 'Restaurants cannot match daily supply' })
    .first();
  const hiringCard = page
    .locator('.feed-stream > .knowledge-post-link')
    .filter({ hasText: 'Tenants cannot track shared-building repair' })
    .first();

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
  await useDevAccount(page);
  await page.goto('/en/home');
  const viewport = page.viewportSize();
  const postButton =
    viewport && viewport.width <= 760
      ? page.locator('.dock-post-button')
      : page.locator('.sidebar-post-button');

  await postButton.click();
  await expect(page.getByText('What do you want to post?')).toHaveCount(0);
  await page.getByRole('button', { name: 'Post idea' }).filter({ visible: true }).click();
  await expect(page.locator('.post-composer-dialog')).toBeVisible();
  await expect(page.locator('#composer-title')).toHaveText('Post idea');
  await page.locator('.post-composer-dialog .composer-header button').click();

  await page.goto('/en/ideas');
  await postButton.click();
  await expect(page.locator('.post-composer-dialog')).toBeVisible();
  await expect(page.locator('#composer-title')).toHaveText('Post idea');
});

test('signed-out actions open social sign-in and the real Devnet test account works', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/en/ideas');

  await page.getByRole('button', { name: 'Like' }).first().click();
  let dialog = page.locator('.auth-dialog');
  await expect(dialog).toBeVisible();
  expect(await page.evaluate(() => window.localStorage.getItem('gimme-idea-social-v2'))).toBeNull();
  await dialog.getByRole('button', { name: 'Close' }).click();

  for (const action of ['Save', 'Share', 'Quote']) {
    await page.getByRole('button', { name: action }).first().click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Close' }).click();
  }

  await page.locator('.sidebar-post-button').click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Close' }).click();

  await page.evaluate(() => {
    window.localStorage.setItem(
      'gimme-idea-social-v2',
      JSON.stringify({
        bookmarks: [],
        likes: [],
        views: {},
        itemMedia: {},
        knowledgePosts: [],
        comments: [],
        quotes: [
          {
            id: 'auth-gated-thread',
            body: 'A thread used to verify comment authentication.',
            createdAt: new Date().toISOString(),
            actor: { username: 'seed', displayName: 'Seed User', avatarUrl: null },
            target: null,
          },
        ],
      }),
    );
  });
  await page.goto('/en/home/auth-gated-thread');
  await page.getByPlaceholder('Post your reply').click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Close' }).click();

  await page.goto('/en/home');

  const signIn = page.getByRole('button', { name: 'Sign In' });
  await expect(signIn).toHaveCSS('background-color', 'rgb(153, 69, 255)');
  await signIn.click();
  dialog = page.locator('.auth-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Sign in.' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Continue with X' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Continue with Facebook' })).toBeVisible();
  await expect(dialog.getByText(/Passkey/i)).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: /Use test account/ })).toBeVisible();
  await expect(dialog.getByText('Devnet', { exact: true })).toBeVisible();
  await expect(dialog.getByText(/Wallet/, { exact: true })).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(dialog.getByRole('alert')).toContainText('NEXT_PUBLIC_PRIVY_APP_ID');
  await dialog.getByRole('button', { name: /Use test account/ }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Manage account' })).toBeVisible();
});

test('ready development wallet reads real Devnet SOL and USDC balances from RPC', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.route('https://api.devnet.solana.com/', async (route) => {
    const request = route.request();
    const payload = request.postDataJSON() as { id: string; method: string };
    const result =
      payload.method === 'getBalance'
        ? { context: { slot: 1 }, value: 2_500_000_000 }
        : {
            context: { slot: 1 },
            value: [
              {
                account: {
                  data: {
                    parsed: { info: { tokenAmount: { amount: '1500000', decimals: 6 } } },
                  },
                },
              },
            ],
          };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ jsonrpc: '2.0', id: payload.id, result }),
    });
  });
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'gimme-idea-auth-v3',
      JSON.stringify({
        id: 'dev:wallet-test',
        displayName: 'Devnet Builder',
        username: 'devnet-builder',
        avatarUrl: null,
        avatarInitials: 'DB',
        createdAt: '2026-09-03T00:00:00.000Z',
        authProvider: 'dev',
        wallet: {
          kind: 'gimme-embedded',
          status: 'ready',
          network: 'devnet',
          custody: 'development-server',
          address: 'DevnetVaultAddress11111111111111111111111111',
          smartWalletAddress: 'InternalWalletPda1111111111111111111111111',
          balanceUsdc: '0',
          activities: [],
        },
      }),
    );
  });
  await page.goto('/en/home');
  await page.getByRole('button', { name: /Wallet: 0 USDC/ }).click();

  const wallet = page.locator('.wallet-dialog');
  await expect(wallet.getByText('Devnet', { exact: true }).first()).toBeVisible();
  await expect(wallet.locator('.wallet-balance-block')).toContainText('1.5');
  await expect(wallet.locator('.wallet-asset-row').filter({ hasText: 'SOL' })).toContainText(
    '2.5 SOL',
  );
  await expect(
    wallet.getByRole('link', { name: 'View on Solana Explorer' }).first(),
  ).toHaveAttribute('href', /cluster=devnet/);
  await expect(wallet.getByRole('button', { name: 'Withdraw' })).toBeDisabled();
});

test('signed-in account exposes the embedded wallet balance and activity panel', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'gimme-idea-auth-v3',
      JSON.stringify({
        id: 'social:test-user',
        displayName: 'Dana Builder',
        username: 'dana-builder',
        avatarUrl: null,
        avatarInitials: 'DB',
        createdAt: '2026-09-03T00:00:00.000Z',
        authProvider: 'google',
        wallet: {
          kind: 'gimme-embedded',
          status: 'pending',
          network: 'devnet',
          custody: 'privy-embedded',
          address: null,
          smartWalletAddress: null,
          balanceUsdc: '0',
          activities: [],
        },
      }),
    );
  });
  await page.goto('/en/home');

  await page.getByRole('button', { name: 'Manage account' }).click();
  const account = page.locator('#account-popover');
  await expect(account).toBeVisible();
  await expect(account.getByText('VI', { exact: true })).toHaveCount(0);
  await expect(account.getByText(/Connect wallet|Disconnect wallet|Reconnect wallet/)).toHaveCount(
    0,
  );

  await page.getByRole('button', { name: 'Manage account' }).click();
  await page.getByRole('button', { name: /Wallet: 0 USDC/ }).click();
  const wallet = page.locator('.wallet-dialog');
  await expect(wallet).toBeVisible();
  await expect(wallet.getByRole('heading', { name: "Dana Builder's Wallet" })).toBeVisible();
  await expect(wallet.locator('.wallet-balance-block')).toContainText('0');
  await expect(wallet.getByRole('button', { name: 'Withdraw' })).toBeDisabled();
  await expect(wallet.getByText('USDC', { exact: true }).first()).toBeVisible();
  await expect(wallet.getByText('Activity indexing is not connected yet')).toBeVisible();
});

test('quote composer publishes a Home-only post', async ({ page }) => {
  await useDevAccount(page);
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
  await page
    .getByPlaceholder('Post your reply')
    .fill('A nested reply.\n\n**Bold point**\n    @guest with indent');
  await page.locator('.comment-composer input[type="file"]').setInputFiles({
    name: 'comment-proof.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await page.locator('.comment-composer').getByRole('button', { name: 'Reply' }).click();
  await expect(page.locator('.comment-node')).toContainText('A nested reply.');
  await expect(page.locator('.comment-node .markdown-text strong')).toContainText('Bold point');
  await expect(page.locator('.comment-node .mention-token')).toContainText('@guest');
  await expect(page.locator('.comment-node img.post-media')).toHaveCount(1);

  const rootComment = page.locator('.comment-node').filter({ hasText: 'A nested reply.' }).first();
  await rootComment.getByRole('button', { name: 'Reply' }).first().click();
  const replyComposerBox = await rootComment.locator('.comment-composer').boundingBox();
  const viewportForReply = page.viewportSize();
  expect(replyComposerBox).not.toBeNull();
  expect(viewportForReply).not.toBeNull();
  expect(replyComposerBox!.y).toBeLessThan(viewportForReply!.height);
  await expect(rootComment.getByPlaceholder('Post your reply')).toHaveValue('@devnet-builder ');
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
  await useDevAccount(page);
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
  await composer.getByLabel('Title', { exact: true }).fill('A media-aware kitchen idea');
  await composer
    .getByLabel('1-line description')
    .fill('A post should carry the visual evidence selected at publishing time.');
  await composer.getByLabel('Primary Problem').selectOption('restaurant-food-waste');
  await composer
    .getByLabel('Opportunity')
    .fill('Visual evidence turns the idea into a sharper build thesis.');
  await composer
    .getByLabel('Solution')
    .fill('Capture concept media at publish time and show it everywhere.');
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
  await expect(page).toHaveURL(/\/en\/ideas\/local-/);
  await expect(page.locator('main').first()).toContainText('Opportunity');
  await expect(page.locator('main').first()).toContainText('Solution');
  await expect(page.locator('img.stored-post-media')).toHaveCount(2);
  await page.locator('img.stored-post-media').first().click();
  await expect(page.locator('.media-viewer')).toBeVisible();
  await page.getByRole('button', { name: 'Close media' }).click();

  await page.goto('/en/ideas');
  const ideaCard = page
    .locator('.feed-stream > .knowledge-post-link')
    .filter({ hasText: 'A media-aware kitchen idea' });
  await expect(ideaCard.locator('img.stored-post-media')).toHaveCount(2);
  await expect(ideaCard.locator('video.stored-post-media')).toHaveCount(1);
  await expect(ideaCard.getByLabel('Add photo or video')).toHaveCount(0);

  await page.reload();
  const persistedIdea = page
    .locator('.feed-stream > .knowledge-post-link')
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
  await composer
    .getByLabel('Title', { exact: true })
    .fill('Operators need visible repair ownership');
  await composer
    .getByLabel('1-line description')
    .fill('A posted Problem can include a funded opportunity and a hiring signal.');
  await composer
    .getByRole('textbox', { name: 'Problem', exact: true })
    .fill('Repair ownership is split across operators and vendors.');
  await composer
    .getByLabel('Who has this problem?')
    .fill('Building operators and tenant support teams.');
  await composer
    .getByLabel('Why does it matter?')
    .fill('Slow accountability turns into churn and repeated support load.');
  await composer.getByLabel('Bounty (USDC)').fill('1250');
  await composer.getByLabel('This Problem is also hiring').check();
  await composer.getByRole('button', { name: 'Post', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/problems\/local-/);
  await expect(page.locator('main')).toContainText('Who has this problem?');
  await page.goto('/en/problems');
  const problemCard = page
    .locator('.feed-stream > .knowledge-post-link')
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
  await expect(page.locator('.sidebar-nav')).toHaveCSS('overflow-y', 'hidden');
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
  await useDevAccount(page);
  await page.goto('/en/ideas');
  const card = page.locator('.feed-stream > .knowledge-post-link').first();
  await card.getByRole('button', { name: 'Save' }).click();
  await card.getByRole('button', { name: 'Like' }).click();
  await expect(card.locator('.knowledge-post-action.is-like svg')).toHaveCSS(
    'animation-name',
    'idea-spark',
  );

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
  await expect(page.locator('.page-index').first()).toBeVisible();
  await expect(page.locator('.content-section')).toHaveCount(5);
  await expect(page.locator('#problem .chapter-heading')).toContainText('Problem');
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
  await expect(page.locator('main')).toContainText('Who has this problem?');
  await page.goto(`${baseURL ?? 'http://127.0.0.1:3000'}/en/ideas/demand-pulse-for-kitchens`);
  await expect(page.locator('main')).toContainText('The useful product is not a perfect forecast.');
  await context.close();
});

test('unknown canonical slugs return the not-found experience', async ({ page }) => {
  await page.goto('/en/problems/not-a-real-problem');
  await expect(page.locator('main')).toContainText('This node is not in the network.');
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', /noindex/);
});
