import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function useDevAccount(page: Page) {
  const response = await page.request.post('http://127.0.0.1:3001/v1/auth/mock');
  expect(response.ok()).toBe(true);
  const payload = (await response.json()) as {
    accessToken: string;
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
    window.sessionStorage.setItem('gimme-idea-dev-access-token', account.accessToken);
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

test('problem cards never present unverified bounty values as funded', async ({ page }) => {
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
  await expect(hiringCard.locator('.bounty-signal.is-funded')).toHaveCount(0);
  await expect(hiringCard.locator('.job-signal')).toHaveAttribute('aria-label', 'Hiring');
  await expect(unfundedCard.locator('h2')).toHaveCSS('color', 'rgb(153, 69, 255)');
  await expect(unfundedCard.locator('.knowledge-post-kind')).toHaveCSS(
    'color',
    'rgb(153, 69, 255)',
  );
});

test('Create chooses a canonical type on Home and opens directly on Ideas', async ({ page }) => {
  await useDevAccount(page);
  await page.goto('/en/home');
  const viewport = page.viewportSize();
  const postButton =
    viewport && viewport.width <= 760
      ? page.locator('.dock-post-button')
      : page.locator('.sidebar-post-button');

  await postButton.click();
  await expect(page.getByText('What do you want to post?')).toHaveCount(0);
  await page.getByRole('button', { name: 'Create Idea' }).filter({ visible: true }).click();
  await expect(page.locator('.post-composer-dialog')).toBeVisible();
  await expect(page.locator('#composer-title')).toHaveText('Create Idea');
  await page.locator('.post-composer-dialog .composer-header button').click();

  await page.goto('/en/ideas');
  await postButton.click();
  await expect(page.locator('.post-composer-dialog')).toBeVisible();
  await expect(page.locator('#composer-title')).toHaveText('Create Idea');
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
  await expect(wallet.getByRole('button', { name: 'Withdraw' })).toBeEnabled();
  await wallet.getByRole('button', { name: 'Withdraw' }).click();
  await expect(wallet.getByRole('heading', { name: 'Withdraw' })).toBeVisible();
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
  await expect(wallet.getByRole('heading', { name: 'Rewards' })).toBeVisible();
  await expect(wallet.locator('.wallet-balance-block')).toContainText('0');
  await expect(wallet.getByRole('button', { name: 'Withdraw' })).toBeEnabled();
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
  await page.locator('.comment-composer').getByRole('button', { name: 'Reply' }).click();
  await expect(page.locator('.comment-node')).toContainText('A nested reply.');
  await expect(page.locator('.comment-node .markdown-text strong')).toContainText('Bold point');
  await expect(page.locator('.comment-node .mention-token')).toContainText('@guest');
  await expect(page.locator('.comment-node img.post-media')).toHaveCount(0);

  const rootComment = page.locator('.comment-node').filter({ hasText: 'A nested reply.' }).first();
  await rootComment.getByRole('button', { name: 'Reply' }).first().click();
  const replyComposerBox = await rootComment.locator('.comment-composer').boundingBox();
  const viewportForReply = page.viewportSize();
  expect(replyComposerBox).not.toBeNull();
  expect(viewportForReply).not.toBeNull();
  expect(replyComposerBox!.y).toBeLessThanOrEqual(viewportForReply!.height + 2);
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
  await expect(page.locator('.comment-node.is-reply')).toHaveCount(2);
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

test('Post composer publishes canonical Idea and Problem records through the API', async ({
  page,
}, testInfo) => {
  await useDevAccount(page);
  const suffix = testInfo.project.name;

  await page.goto('/en/ideas');
  await expect(page.getByRole('heading', { name: 'Ideas', exact: true })).toBeVisible();
  const viewport = page.viewportSize();
  const postButton =
    viewport && viewport.width <= 760
      ? page.locator('.dock-post-button')
      : page.locator('.sidebar-post-button');
  await postButton.click();
  const composer = page.locator('.post-composer-dialog');
  await composer
    .getByLabel('Title', { exact: true })
    .fill(`A server-backed kitchen idea ${suffix}`);
  await composer
    .getByLabel('1-line description')
    .fill('A canonical Idea should persist through the API and remain available after navigation.');
  await composer.getByLabel('Primary Problem').selectOption('restaurant-food-waste');
  await composer
    .getByLabel('Opportunity')
    .fill('Cross-device persistence turns the idea into shared product knowledge.');
  await composer
    .getByLabel('Solution')
    .fill('Persist the structured thesis in PostgreSQL through the authenticated API.');
  await composer.getByRole('button', { name: 'Post', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/ideas\/a-server-backed-kitchen-idea-/);
  await expect(page.locator('main').first()).toContainText('Opportunity');
  await expect(page.locator('main').first()).toContainText('Solution');
  await page.reload();
  await expect(page.locator('main h1').first()).toContainText(
    `A server-backed kitchen idea ${suffix}`,
  );

  await page.goto('/en/problems');
  await expect(page.getByRole('heading', { name: 'Problems', exact: true })).toBeVisible();
  await postButton.click();
  await composer
    .getByLabel('Title', { exact: true })
    .fill(`Operators need visible repair ownership ${suffix}`);
  await composer
    .getByLabel('1-line description')
    .fill('A canonical Problem should persist without inventing funding or hiring state.');
  await composer
    .getByRole('textbox', { name: 'Problem', exact: true })
    .fill('Repair ownership is split across operators and vendors.');
  await composer
    .getByLabel('Who has this problem?')
    .fill('Building operators and tenant support teams.');
  await composer
    .getByLabel('Why does it matter?')
    .fill('Slow accountability turns into churn and repeated support load.');
  await composer.getByRole('button', { name: 'Post', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/problems\/operators-need-visible-repair-ownership-/);
  await expect(page.locator('main')).toContainText('Who has this problem?');
  await expect(page.locator('.bounty-signal.is-funded')).toHaveCount(0);
});

test('sidebar lists Projects and Bounties as first-class destinations', async ({ page }) => {
  await page.goto('/en/home');
  const viewport = page.viewportSize();
  if (viewport && viewport.width <= 760) {
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.locator('.mobile-bottom-dock a[href$="/bounties"]')).toBeVisible();
    await expect(page.locator('.mobile-product-menu a[href$="/projects"]')).toBeVisible();
    await expect(page.locator('.mobile-product-menu a[href$="/saved"]')).toBeVisible();
  } else if (viewport && viewport.width <= 1180) {
    await page.getByRole('button', { name: 'More' }).click();
    await expect(page.locator('#more-navigation a[href$="/bounties"]')).toBeVisible();
    await expect(page.locator('#more-navigation a[href$="/projects"]')).toBeVisible();
    await expect(page.locator('#more-navigation a[href$="/saved"]')).toBeVisible();
  } else {
    await expect(page.locator('.sidebar-nav > a[href$="/bounties"]')).toBeVisible();
    await expect(page.locator('.sidebar-nav > a[href$="/projects"]')).toBeVisible();
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
  await expect(page.locator('.sidebar-nav > a[href$="/projects"]')).toHaveCount(0);
  await expect(page.locator('.sidebar-nav > a[href$="/saved"]')).toHaveCount(0);

  await page.getByRole('button', { name: 'More' }).click();
  await expect(page.locator('#more-navigation a[href$="/bounties"]')).toBeVisible();
  await expect(page.locator('#more-navigation a[href$="/projects"]')).toBeVisible();
  await expect(page.locator('#more-navigation a[href$="/saved"]')).toBeVisible();

  const sidebarBox = await page.locator('.product-sidebar').boundingBox();
  const accountBox = await page.locator('.account-control').boundingBox();
  expect(sidebarBox).not.toBeNull();
  expect(accountBox).not.toBeNull();
  expect(600 - (accountBox!.y + accountBox!.height)).toBeLessThan(24);
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
  await expect(page.locator('.saved-tabs a.is-active').filter({ visible: true })).toHaveText(
    'Bookmarks',
  );
  await expect(page.locator('.knowledge-post-link')).toContainText('Demand Pulse');
  await page.getByRole('link', { name: 'Likes', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/saved\?tab=likes/);
  await expect(page.locator('.saved-tabs a.is-active').filter({ visible: true })).toHaveText(
    'Likes',
  );
  await expect(page.locator('.knowledge-post-link')).toContainText('Demand Pulse');
});

test('canonical detail pages retain their chapter index inside the shell', async ({ page }) => {
  await page.goto('/en/problems/restaurant-food-waste');

  await expect(page.locator('.product-shell')).toBeVisible();
  await expect(page.locator('.page-index').first()).toBeVisible();
  await expect(page.locator('.content-section')).toHaveCount(6);
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
    await expect(page.locator('.signal-step')).toHaveCount(7);
    await expect(page.locator('.signal-step').first()).toBeVisible();
  });
});

test('canonical HTML survives JavaScript being disabled', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL ?? 'http://127.0.0.1:3000'}/en`);
  await expect(page.locator('h1')).toContainText('Find the problem.');
  await expect(page.getByRole('link', { name: 'Explore Problems' })).toBeVisible();
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
