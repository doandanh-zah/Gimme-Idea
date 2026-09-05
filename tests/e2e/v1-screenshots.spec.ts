import { test, type Page } from '@playwright/test';
import path from 'node:path';

const output = path.resolve(process.cwd(), 'docs/frontend-v1-screenshots');

async function capture(page: Page, name: string) {
  await page.waitForLoadState('networkidle');
  await page.screenshot({
    path: path.join(output, `${name}.png`),
    fullPage: true,
    animations: 'disabled',
  });
}

async function openAndCapture(page: Page, route: string, name: string) {
  await page.goto(route);
  await capture(page, name);
}

test('capture the Phase 1 Zahlook visual review set', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280');

  const publicContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    baseURL: 'http://127.0.0.1:3000',
  });
  const publicPage = await publicContext.newPage();
  await openAndCapture(publicPage, '/en', '01-landing-1280');
  await openAndCapture(publicPage, '/en/home', '02-home-mixed-feed-1280');
  await openAndCapture(
    publicPage,
    '/en/problems/tenant-repair-visibility',
    '03-problem-without-bounty-1280',
  );
  await openAndCapture(
    publicPage,
    '/en/problems/restaurant-food-waste',
    '04-problem-with-idea-bounty-1280',
  );
  await openAndCapture(publicPage, '/en/projects/prep-signal-pilot', '05-public-project-1280');
  await openAndCapture(publicPage, '/en/ideas/demand-pulse-for-kitchens', '06-public-idea-1280');
  await openAndCapture(
    publicPage,
    '/en/bounties/reduce-avoidable-prep-waste',
    '07-idea-bounty-1280',
  );
  await openAndCapture(
    publicPage,
    '/en/bounties/reduce-avoidable-prep-waste/submit',
    '08-private-submission-gate-1280',
  );
  await openAndCapture(publicPage, '/en/search?q=food', '09-public-search-1280');
  await openAndCapture(publicPage, '/devnet-bounty', '10-devnet-diagnostics-1280');
  await openAndCapture(publicPage, '/en/profile', '11-profile-1280');
  await publicContext.close();

  const mobileContext = await browser.newContext({
    viewport: { width: 360, height: 800 },
    baseURL: 'http://127.0.0.1:3000',
  });
  const mobilePage = await mobileContext.newPage();
  await openAndCapture(mobilePage, '/en/home', '17-mobile-home-360');
  await openAndCapture(
    mobilePage,
    '/en/bounties/reduce-avoidable-prep-waste',
    '18-mobile-idea-bounty-360',
  );
  await mobileContext.close();
});
