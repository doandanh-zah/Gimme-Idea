import { expect, test, type Browser, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

type DevSession = {
  accessToken: string;
  user: { id: string; displayName: string; username: string; avatarUrl: null };
  wallet: { address: string; network: 'devnet'; custody: 'development-server' };
};

async function useDevAccount(page: Page): Promise<DevSession> {
  const response = await page.request.post('http://127.0.0.1:3001/v1/auth/mock');
  expect(response.ok()).toBe(true);
  const account = (await response.json()) as DevSession;
  await page.addInitScript((session) => {
    window.sessionStorage.setItem('gimme-idea-dev-access-token', session.accessToken);
    window.localStorage.setItem(
      'gimme-idea-auth-v3',
      JSON.stringify({
        id: `dev:${session.user.id}`,
        displayName: session.user.displayName,
        username: session.user.username,
        avatarUrl: null,
        avatarInitials: 'DB',
        createdAt: '2026-09-04T00:00:00.000Z',
        authProvider: 'dev',
        wallet: {
          kind: 'gimme-embedded',
          status: 'ready',
          network: 'devnet',
          custody: session.wallet.custody,
          address: session.wallet.address,
          smartWalletAddress: null,
          balanceUsdc: '0',
          activities: [],
        },
      }),
    );
  }, account);
  return account;
}

async function createCrossDeviceProblem(browser: Browser) {
  const writer = await browser.newContext({ baseURL: 'http://127.0.0.1:3000' });
  const writerPage = await writer.newPage();
  const session = await useDevAccount(writerPage);
  const marker = crypto.randomUUID().slice(0, 8);
  const created = await writer.request.post('http://127.0.0.1:3001/v1/problems', {
    headers: { authorization: `Bearer ${session.accessToken}` },
    data: {
      title: `Cross-device repair evidence ${marker}`,
      summary:
        'A canonical test record shared through PostgreSQL between isolated browser contexts.',
      description:
        'This record proves that shared product state is returned by the API rather than copied through browser storage.',
      affectedGroups: ['Building operators'],
      evidence: ['Isolated browser contexts do not share localStorage'],
      desiredOutcome: 'The second browser can read the same canonical record.',
      constraints: [],
      successMetrics: [],
      visibility: 'public',
    },
  });
  expect(created.status()).toBe(201);
  const problem = (await created.json()) as { id: string; slug: string; title: string };
  const published = await writer.request.post(
    `http://127.0.0.1:3001/v1/problems/${problem.id}/publish`,
    { headers: { authorization: `Bearer ${session.accessToken}` } },
  );
  expect(published.status()).toBe(204);
  return { writer, session, problem };
}

test('V1 navigation exposes the canonical product ontology', async ({ page }) => {
  await page.goto('/en/home');
  const viewport = page.viewportSize();
  if (viewport && viewport.width <= 760) {
    await expect(page.locator('.mobile-bottom-dock a[href="/en/home"]')).toBeVisible();
    await expect(page.locator('.mobile-bottom-dock a[href="/en/problems"]')).toBeVisible();
    await expect(page.locator('.mobile-bottom-dock a[href="/en/bounties"]')).toBeVisible();
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.locator('.mobile-product-menu a[href="/en/ideas"]')).toBeVisible();
    await expect(page.locator('.mobile-product-menu a[href="/en/projects"]')).toBeVisible();
  } else if (viewport && viewport.width <= 1180) {
    await expect(page.locator('.sidebar-nav a[href="/en/home"]')).toBeVisible();
    await expect(page.locator('.sidebar-nav a[href="/en/problems"]')).toBeVisible();
    await expect(page.locator('.sidebar-nav a[href="/en/ideas"]')).toBeVisible();
    await page.getByRole('button', { name: 'More' }).click();
    await expect(page.locator('#more-navigation a[href="/en/projects"]')).toBeVisible();
    await expect(page.locator('#more-navigation a[href="/en/bounties"]')).toBeVisible();
  } else {
    for (const path of ['home', 'problems', 'ideas', 'projects', 'bounties']) {
      await expect(page.locator(`.sidebar-nav a[href="/en/${path}"]`)).toBeVisible();
    }
  }
  await expect(page.locator('a[href="/en/talent"]')).toHaveCount(0);
  await expect(page.locator('a[href="/en/community"]')).toHaveCount(0);
});

test('Home is a privacy-safe mixed feed and does not invent funding', async ({ page }) => {
  await page.goto('/en/home');
  await expect(page.locator('.v1-problem-card').first()).toBeVisible();
  await expect(page.locator('.v1-project-card').first()).toBeVisible();
  await expect(page.locator('.bounty-signal.is-funded')).toHaveCount(0);
  await expect(page.getByRole('main').first()).not.toContainText('Private direction');
});

test('canonical Problem and Quote/Post persist across isolated browsers', async ({ browser }) => {
  const { writer, session, problem } = await createCrossDeviceProblem(browser);
  const postResponse = await writer.request.post('http://127.0.0.1:3001/v1/posts', {
    headers: { authorization: `Bearer ${session.accessToken}` },
    data: {
      entityType: 'problem',
      entityId: problem.id,
      title: `Context for ${problem.title}`,
      body: 'This contextual discussion is stored by the server.',
    },
  });
  expect(postResponse.status()).toBe(201);
  const post = (await postResponse.json()) as { id: string; body: string };

  const reader = await browser.newContext({ baseURL: 'http://127.0.0.1:3000' });
  const readerPage = await reader.newPage();
  await readerPage.goto(`/en/problems/${problem.slug}`);
  await expect(readerPage.locator('main h1').first()).toContainText(problem.title);
  expect(await readerPage.evaluate(() => window.localStorage.length)).toBe(0);
  const home = await reader.request.get('http://127.0.0.1:3001/v1/home');
  expect(home.ok()).toBe(true);
  expect(JSON.stringify(await home.json())).toContain(`Context for ${problem.title}`);
  await readerPage.goto(`/en/home/${post.id}`);
  await expect(readerPage.getByRole('main').first()).toContainText(post.body);
  await Promise.all([writer.close(), reader.close()]);
});

test('public search and direct IDs exclude private submissions', async ({ page }) => {
  await page.goto('/en/search?q=Prep%20Signal%20pilot%20submission');
  await expect(page.getByRole('main').first()).not.toContainText('two-week learning plan');
  await expect(page.getByRole('main').first()).toContainText(
    'Private submissions and restricted content are excluded',
  );
  const direct = await page.request.get(
    'http://127.0.0.1:3001/v1/submissions/62000000-0000-4000-8000-000000000001',
  );
  expect(direct.status()).toBe(401);
  expect(await direct.text()).not.toContain('Prep Signal pilot submission');
});

test('unfunded bounties cannot expose submission or Build participation journeys', async ({
  page,
}) => {
  await useDevAccount(page);
  await page.goto('/en/bounties/reduce-avoidable-prep-waste');
  await expect(page.getByRole('main').first()).toContainText(/awaiting funding/i);
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /submit/i })).toHaveCount(0);
  await expect(page.locator('.bounty-signal.is-funded')).toHaveCount(0);
});

test('V1 pages fit the active responsive viewport without horizontal overflow', async ({
  page,
}) => {
  for (const route of [
    '/en/home',
    '/en/projects',
    '/en/bounties',
    '/en/bounties/reduce-avoidable-prep-waste',
  ]) {
    await page.goto(route);
    const layout = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      offenders: [...document.querySelectorAll<HTMLElement>('body *')]
        .filter(
          (element) =>
            element.getBoundingClientRect().right > document.documentElement.clientWidth + 1,
        )
        .slice(0, 5)
        .map((element) => `${element.tagName}.${element.className}`),
    }));
    expect(layout, `${route}: ${JSON.stringify(layout)}`).toMatchObject({
      scrollWidth: layout.clientWidth,
    });
  }
  const viewport = page.viewportSize();
  if (viewport && viewport.width <= 760) {
    await expect(page.locator('.mobile-bottom-dock')).toBeVisible();
    await expect(page.locator('.dock-post-button')).toBeVisible();
  }
});

test('Bounties surface passes automated accessibility checks', async ({ page }) => {
  await page.goto('/en/bounties');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('technical Devnet diagnostics are separate from product Bounties', async ({ page }) => {
  await page.goto('/en/bounties');
  await expect(page.getByRole('main').first()).not.toContainText('Program ID');
  await page.goto('/devnet-bounty');
  await expect(page.getByRole('main').first()).toContainText('Bounty diagnostics');
});
