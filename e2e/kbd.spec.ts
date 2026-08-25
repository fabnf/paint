import { expect, test } from '@playwright/test';
import { openPage } from './helpers';

test.describe('ds-kbd', () => {
  test.beforeEach(async ({ page }) => {
    await openPage(page, '/primitives/kbd', 'Kbd');
  });

  test('renders real keycaps, one per key, joined by a plus', async ({ page }) => {
    const section = page.locator('#keys');
    const single = section.locator('ds-kbd').first().locator('kbd');
    await expect(single).toHaveCount(1);
    await expect(single).toHaveText('Esc');

    const combo = section.locator('ds-kbd').nth(2).locator('kbd.ds-kbd--group');
    await expect(combo).toBeVisible();
    await expect(combo.locator('kbd.ds-kbd__key')).toHaveText(['Ctrl', 'Enter']);
    await expect(combo.locator('.ds-kbd__plus')).toHaveCount(1);
  });

  test('wears the tokens: mono type, a surface, an edge', async ({ page }) => {
    const cap = page.locator('#keys kbd.ds-kbd').first();
    const fontFamily = await cap.evaluate((node) => getComputedStyle(node).fontFamily);
    expect(fontFamily.toLowerCase()).toMatch(/mono/);
    const borderBottom = await cap.evaluate((node) => getComputedStyle(node).borderBottomWidth);
    expect(borderBottom).toBe('2px');
  });

  test('speaks words for glyphs, and leaves words alone', async ({ page }) => {
    const spoken = page.locator('#spoken');
    const command = spoken.locator('ds-kbd').first();
    await expect(command.locator('.visually-hidden')).toHaveText('Command K');
    await expect(command.locator('kbd.ds-kbd--group')).toHaveAttribute('aria-hidden', 'true');
    await expect(command.locator('kbd.ds-kbd__key')).toHaveText(['⌘', 'K']);

    const plain = page.locator('#keys ds-kbd').nth(2);
    await expect(plain.locator('.visually-hidden')).toHaveCount(0);
    await expect(plain.locator('kbd.ds-kbd--group')).not.toHaveAttribute('aria-hidden', /.+/);
  });

  test('is never a tab stop', async ({ page }) => {
    const count = await page.locator('kbd').count();
    expect(count).toBeGreaterThan(10);
    const focusable = await page.locator('kbd').evaluateAll((nodes) =>
      nodes.filter((node) => (node as HTMLElement).tabIndex >= 0 || node.hasAttribute('role')).length,
    );
    expect(focusable).toBe(0);
  });

  test('has two sizes', async ({ page }) => {
    const small = page.locator('#keys kbd.ds-kbd').first();
    const medium = page.locator('#inline kbd.ds-kbd--md').first();
    const [smallSize, mediumSize] = await Promise.all([
      small.evaluate((node) => parseFloat(getComputedStyle(node).fontSize)),
      medium.evaluate((node) => parseFloat(getComputedStyle(node).fontSize)),
    ]);
    expect(mediumSize).toBeGreaterThan(smallSize);
  });
});