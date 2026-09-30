import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, openPage } from './helpers';

const viewer = (page: Page) => page.getByRole('dialog');
const title = (page: Page) => page.locator('.ds-interstitial__title');
const dismissedRecord = (page: Page) => page.locator('#load .record-dismissed');
const seenRecord = (page: Page) => page.locator('#load .record-seen');

/**
 * Each test starts with a user who has seen nothing — cleared *once*, on the
 * first page, rather than on every navigation: the records surviving a real
 * navigation is exactly what "learn more counts as seen" is about.
 */
const freshUser = async (page: Page) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
};

test.describe('ds-interstitial', () => {
  test.beforeEach(async ({ page }) => {
    await freshUser(page);
    await openPage(page, '/components/interstitial', 'Interstitial');
  });

  test('is reachable from the sidebar, and clean under axe', async ({ page }) => {
    await expect(
      page
        .getByRole('navigation', { name: 'Design system sections' })
        .getByRole('link', { name: /^Interstitial\b/ }),
    ).toHaveAttribute('href', '/components/interstitial');
    await expectNoAxeViolations(page);
  });

  test('renders nothing until something is loaded and eligible', async ({ page }) => {
    await expect(viewer(page)).toHaveCount(0);
    await expect(page.getByText('Nothing loaded yet', { exact: true })).toBeVisible();
  });

  test('loads over HTTP from the WireMock stub and opens the set', async ({ page }) => {
    // The GET really leaves the browser: assert on the response, not a stub double.
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/interstitials') && res.request().method() === 'GET'),
      page.locator('#load').getByRole('button', { name: 'Load' }).click(),
    ]);
    expect(response.status()).toBe(200);
    const payload = await response.json();
    expect(payload.items.length).toBe(3);

    await expect(page.getByText('Loaded from WireMock')).toBeVisible();
    await expect(viewer(page)).toBeVisible();
    await expect(viewer(page)).toHaveAttribute('aria-modal', 'true');
    await expect(title(page)).toHaveText('Wet Paint 0.4 is here');
    await expect(page.locator('.ds-gallery__position')).toContainText('1 of 3');
    await expectNoAxeViolations(page, '.ds-gallery__viewer');
  });

  test('moves through the set with the keyboard, and closes on Escape', async ({ page }) => {
    await page.locator('#load').getByRole('button', { name: 'Load' }).click();
    await expect(viewer(page)).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await expect(title(page)).toHaveText('Your brand, our components');
    await expect(page.locator('.ds-gallery__position')).toContainText('2 of 3');

    await page.keyboard.press('ArrowLeft');
    await expect(title(page)).toHaveText('Wet Paint 0.4 is here');

    await page.keyboard.press('Escape');
    await expect(viewer(page)).toHaveCount(0);
    await expect(page.locator('#load')).toContainText('closed → escape');
  });

  test('a dismissed item never comes back, even after loading again', async ({ page }) => {
    const load = page.locator('#load').getByRole('button', { name: 'Load' });
    await load.click();
    await expect(viewer(page)).toBeVisible();

    // Dismiss the first of three: the deck shrinks and stays open on the next.
    await viewer(page).getByRole('button', { name: 'Not now' }).click();
    await expect(title(page)).toHaveText('Your brand, our components');
    await expect(page.locator('.ds-gallery__position')).toContainText('1 of 2');

    await page.keyboard.press('Escape');
    await expect(dismissedRecord(page)).toContainText('wet-paint-2');

    await load.click();
    await expect(viewer(page)).toBeVisible();
    // The catalogue still has three; this user is down to the ones left.
    await expect(page.getByText(/of 3 eligible/)).toBeVisible();
    await expect(title(page)).not.toHaveText('Wet Paint 0.4 is here');
  });

  test('dismissing the last eligible item ends the interruption', async ({ page }) => {
    await page.locator('#load').getByRole('button', { name: 'Load' }).click();
    await expect(viewer(page)).toBeVisible();

    for (const name of ['Not now', 'Not now', 'Dismiss']) {
      await viewer(page).getByRole('button', { name, exact: true }).click();
    }

    await expect(viewer(page)).toHaveCount(0);
    await expect(page.getByText('Nothing eligible: every item has been seen or dismissed.')).toBeVisible();

    // And nothing opens again, because nothing is eligible.
    await page.locator('#load').getByRole('button', { name: 'Show again' }).click();
    await expect(viewer(page)).toHaveCount(0);
    await expect(page.locator('#load')).toContainText('renders nothing at all');
  });

  test('learn more goes to the page, and counts as seen', async ({ page }) => {
    await page.locator('#load').getByRole('button', { name: 'Load' }).click();
    await expect(viewer(page)).toBeVisible();

    await viewer(page).getByRole('link', { name: /See what shipped/ }).click();

    await expect(page).toHaveURL(/\/components\/gallery$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Gallery' })).toBeVisible();

    // Coming back fresh (not with the back button, which would restore the old
    // page from the cache): the followed item is recorded as seen, and gone.
    await openPage(page, '/components/interstitial', 'Interstitial');
    await page.locator('#load').getByRole('button', { name: 'Load' }).click();
    await expect(seenRecord(page)).toContainText('wet-paint-2');
    await expect(title(page)).not.toHaveText('Wet Paint 0.4 is here');
  });

  test('reports seen and dismissed back to the stub', async ({ page, request }) => {
    await page.locator('#load').getByRole('button', { name: 'Load' }).click();
    await expect(viewer(page)).toBeVisible();
    await viewer(page).getByRole('button', { name: 'Not now' }).click();
    await page.keyboard.press('Escape');

    // WireMock's request journal is the proof the POSTs actually happened.
    const journal = await request.post('http://localhost:8088/__admin/requests/count', {
      data: { method: 'POST', urlPathPattern: '/api/interstitials/wet-paint-2/(seen|dismissed)' },
    });
    expect((await journal.json()).count).toBeGreaterThanOrEqual(2);
  });

  test('forgetting the records makes everything eligible again', async ({ page }) => {
    await page.locator('#load').getByRole('button', { name: 'Load' }).click();
    await viewer(page).getByRole('button', { name: 'Not now' }).click();
    await page.keyboard.press('Escape');

    await page.locator('#load').getByRole('button', { name: 'Forget everything' }).click();
    await page.locator('#load').getByRole('button', { name: 'Load' }).click();
    await expect(title(page)).toHaveText('Wet Paint 0.4 is here');
    await expect(page.locator('.ds-gallery__position')).toContainText('1 of 3');
  });
});