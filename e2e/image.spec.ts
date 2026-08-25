import { expect, test } from '@playwright/test';
import { openPage } from './helpers';

test.describe('ds-image', () => {
  test.beforeEach(async ({ page }) => {
    await openPage(page, '/primitives/image', 'Image');
  });

  test('renders a lazy, named picture that settles once loaded', async ({ page }) => {
    const hero = page.locator('#basic ds-image').first();
    const img = hero.locator('img');
    await expect(img).toHaveAttribute('loading', 'lazy');
    await expect(img).toHaveAttribute('decoding', 'async');
    await expect(img).toHaveAttribute('alt', /Wet Paint/);
    await expect(hero.locator('.ds-image')).not.toHaveClass(/ds-image--loading/);
    expect(await img.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(page.locator('#basic').getByText(/loaded at/)).toBeVisible();
  });

  test('holds its proportions', async ({ page }) => {
    const tiles = page.locator('#ratios ds-image .ds-image');
    const wide = tiles.nth(3); // 16/9
    await expect(wide).toHaveCSS('aspect-ratio', '16 / 9');
    const box = (await wide.boundingBox())!;
    expect(box.width / box.height).toBeCloseTo(16 / 9, 1);

    const square = tiles.nth(0); // 1/1
    const squareBox = (await square.boundingBox())!;
    expect(squareBox.width / squareBox.height).toBeCloseTo(1, 1);
  });

  test('fits and positions by the CSS names', async ({ page }) => {
    const section = page.locator('#fit');
    const first = section.locator('ds-image img').first();
    await expect(first).toHaveCSS('object-fit', 'cover');
    await expect(section.locator('ds-image img').nth(1)).toHaveCSS('object-position', '50% 0%');

    await section.getByRole('button', { name: 'contain' }).click();
    await expect(first).toHaveCSS('object-fit', 'contain');
  });

  test('shows a named fallback for a missing picture, and for a broken one', async ({ page }) => {
    const section = page.locator('#fallback');
    const missing = section.getByRole('img', { name: 'Floor plan' });
    await expect(missing).toBeVisible();
    await expect(missing.locator('.ds-image__fallback-text')).toHaveText('No plan uploaded');
    await expect(missing.locator('img')).toHaveCount(0);

    // The second one points at a file that does not exist: it fails, and falls back.
    const broken = section.getByRole('img', { name: 'Cover of a book that has not been scanned' });
    await expect(broken).toBeVisible();
    await expect(broken.locator('.ds-image__fallback')).toBeVisible();
    await expect(broken.locator('img')).toHaveCount(0);
  });

  test('a new src is a fresh attempt', async ({ page }) => {
    const section = page.locator('#fallback');
    const third = section.locator('ds-image').nth(2);
    await expect(third.locator('img')).toHaveCount(1);

    await section.getByRole('button', { name: 'Break the third one' }).click();
    await expect(third.locator('ds-avatar')).toBeVisible();
    await expect(third.locator('img')).toHaveCount(0);
    await expect(third.getByRole('img', { name: 'Cover of Wet Paint' })).toBeVisible();

    await section.getByRole('button', { name: 'Fix the third one' }).click();
    await expect(third.locator('img')).toHaveCount(1);
    await expect(third.locator('ds-avatar')).toHaveCount(0);
  });

  test('a decorative picture is silent', async ({ page }) => {
    const decorative = page.locator('#alt ds-image').nth(1).locator('img');
    await expect(decorative).toHaveAttribute('alt', '');
    const meaningful = page.locator('#alt ds-image').nth(0).locator('img');
    await expect(meaningful).toHaveAttribute('alt', /Wet Paint/);
  });

  test('rounds its corners from the tokens', async ({ page }) => {
    const swatches = page.locator('#radii ds-image .ds-image');
    await expect(swatches.nth(0)).toHaveCSS('border-radius', '0px');
    const full = await swatches.nth(6).evaluate((node) => getComputedStyle(node).borderRadius);
    expect(parseFloat(full)).toBeGreaterThan(100);
  });
});