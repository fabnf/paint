import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, openPage } from './helpers';

const viewer = (page: Page) => page.getByRole('dialog');
const thumbs = (page: Page) => page.locator('#anatomy .ds-gallery__thumb');

test.describe('ds-gallery', () => {
  test.beforeEach(async ({ page }) => {
    await openPage(page, '/components/gallery', 'Gallery');
  });

  test('is reachable from the sidebar and clean under axe', async ({ page }) => {
    await expect(
      page
        .getByRole('navigation', { name: 'Design system sections' })
        .getByRole('link', { name: /^Gallery\b/ }),
    ).toHaveAttribute('href', '/components/gallery');
    await expectNoAxeViolations(page);
  });

  test('thumbnails come in two layouts and three sizes', async ({ page }) => {
    const gallery = page.locator('#anatomy ds-gallery > div').first();
    await expect(gallery).toHaveClass(/ds-gallery--grid/);
    await expect(thumbs(page)).toHaveCount(6);

    await page.locator('#anatomy').getByRole('button', { name: 'strip', exact: true }).click();
    await expect(gallery).toHaveClass(/ds-gallery--strip/);

    await page.locator('#anatomy').getByRole('button', { name: 'lg', exact: true }).click();
    await expect(gallery).toHaveClass(/ds-gallery--lg/);
  });

  test('opens a thumbnail, moves, and closes back to where it started', async ({ page }) => {
    const second = thumbs(page).nth(1);
    await second.click();

    await expect(viewer(page)).toBeVisible();
    await expect(viewer(page)).toHaveAttribute('aria-modal', 'true');
    await expect(page.locator('.ds-gallery__position')).toHaveText(/^2 of 6 — The poster, framed on a studio wall$/);
    await expect(viewer(page).locator('figcaption')).toContainText('Plate 2');

    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.ds-gallery__position')).toHaveText(/^3 of 6 — The mug, on a windowsill$/);
    await page.keyboard.press('End');
    await expect(page.locator('.ds-gallery__position')).toHaveText(/^6 of 6/);
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.ds-gallery__position')).toHaveText(/^1 of 6/);

    await page.getByRole('button', { name: 'Next picture' }).click();
    await expect(page.locator('.ds-gallery__position')).toHaveText(/^2 of 6/);

    await page.keyboard.press('Escape');
    await expect(viewer(page)).toHaveCount(0);
    await expect(second).toBeFocused();
  });

  test('the page follows the viewer: the rating is the selected item’s', async ({ page }) => {
    const summary = page.locator('#anatomy ds-rating-summary .visually-hidden');
    await thumbs(page).nth(0).click();
    await expect(summary).toHaveText('4.6 out of 5 stars, 812 reviews');
    await page.keyboard.press('ArrowRight');
    await expect(summary).toHaveText('4.3 out of 5 stars, 1,204 reviews');
    await page.keyboard.press('Escape');
  });

  test('the gallery’s own filter narrows the thumbnails and the viewer', async ({ page }) => {
    const section = page.locator('#anatomy');
    await section.getByRole('group', { name: 'Filter by tag' }).getByRole('button', { name: 'mugs' }).click();
    await expect(thumbs(page)).toHaveCount(2);

    await thumbs(page).nth(0).click();
    await expect(page.locator('.ds-gallery__position')).toHaveText(/^1 of 2 — The mug, on a windowsill$/);
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.ds-gallery__position')).toHaveText(/^2 of 2 — The tote bag, carried$/);
    await page.keyboard.press('Escape');
  });

  test('a host-filtered list is the list the viewer walks', async ({ page }) => {
    const section = page.locator('#filter');
    await section.getByRole('button', { name: 'prints', exact: true }).click();
    await expect(section).toContainText('3 of 6 pictures');
    await section.locator('.ds-gallery__thumb').nth(0).click();
    await expect(page.locator('.ds-gallery__position')).toHaveText(/ of 3 /);
    await page.keyboard.press('Escape');
  });

  test('starts the slideshow from the host’s button, with dots and the keyboard', async ({ page }) => {
    const play = page.locator('#presentation').getByRole('button', { name: 'Play the deck' });
    await play.click();

    await expect(viewer(page)).toHaveClass(/ds-gallery__viewer--presentation/);
    await expect(viewer(page)).toHaveAttribute('aria-label', 'Product shots — slideshow');
    await expect(page.locator('.ds-gallery__dot')).toHaveCount(6);
    await expect(page.locator('.ds-gallery__position')).toHaveText(/^1 of 6/);

    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.ds-gallery__position')).toHaveText(/^2 of 6/);
    await expect(page.locator('.ds-gallery__dot').nth(1)).toHaveClass(/ds-gallery__dot--active/);

    await expectNoAxeViolations(page, '.ds-gallery__viewer');

    await page.keyboard.press('Escape');
    await expect(viewer(page)).toHaveCount(0);
    await expect(play).toBeFocused();
  });

  test('starts the slideshow from the lightbox, on the picture already open', async ({ page }) => {
    await thumbs(page).nth(2).click();
    await viewer(page).getByRole('button', { name: 'Start slideshow' }).click();
    await expect(viewer(page)).toHaveClass(/ds-gallery__viewer--presentation/);
    await expect(page.locator('.ds-gallery__position')).toHaveText(/^3 of 6 — The mug, on a windowsill$/);
    await page.keyboard.press('Escape');
  });

  test('the rest of the page is inert while the viewer is open', async ({ page }) => {
    await thumbs(page).nth(0).click();
    const inert = await page.evaluate(() => {
      const nav = document.querySelector('.app-sidebar');
      return !!nav?.closest('[inert]');
    });
    expect(inert).toBe(true);
    await page.keyboard.press('Escape');
  });

  test('shows the viewer shortcuts as hint rows', async ({ page }) => {
    const rows = page.locator('#keyboard ds-shortcut-hint');
    await expect(rows).toHaveCount(5);
    await expect(rows.first().locator('.ds-shortcut-hint__label')).toHaveText('Next picture');
    await expect(rows.nth(3).locator('ds-kbd')).toContainText('Esc');
  });
});