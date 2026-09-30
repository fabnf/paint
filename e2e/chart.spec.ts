import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, openPage } from './helpers';

/** The ten, and the card each one lives in on the dashboard. */
const TYPES = [
  'stacked-column',
  'area',
  'line',
  'spline',
  'column',
  'bar',
  'pie',
  'donut',
  'scatter',
  'gauge',
] as const;

const plate = (page: Page, type: string) => page.locator(`#chart-${type} [data-chart-mock]`);

test.describe('ds-chart', () => {
  test.beforeEach(async ({ page }) => {
    await openPage(page, '/components/chart', 'Chart');
  });

  test('is reachable from the sidebar, and clean under axe', async ({ page }) => {
    await expect(
      page
        .getByRole('navigation', { name: 'Design system sections' })
        .getByRole('link', { name: /^Chart\b/ }),
    ).toHaveAttribute('href', '/components/chart');
    await expectNoAxeViolations(page);
  });

  for (const type of TYPES) {
    test(`draws a visible ${type} with real data`, async ({ page }) => {
      const chart = plate(page, type);
      await expect(chart).toBeVisible();
      await expect(chart).toHaveAttribute('data-chart-type', type);

      // Something was actually drawn, with values in the DOM.
      const points = chart.locator('[data-point]');
      expect(await points.count()).toBeGreaterThan(0);
      const value = await points.first().getAttribute('data-value');
      expect(Number(value)).not.toBeNaN();

      // And it is an image with a name, over a table a screen reader can read.
      const canvas = page.locator(`#chart-${type} .ds-chart__canvas`);
      await expect(canvas).toHaveAttribute('role', 'img');
      expect((await canvas.getAttribute('aria-label'))!.length).toBeGreaterThan(2);
      await expect(chart.locator('table caption')).not.toBeEmpty();
    });
  }

  test('colours the series from the tokens, and re-colours with the theme', async ({ page }) => {
    const series = plate(page, 'stacked-column').locator('.ds-chart-mock__series');
    await expect(series).toHaveCount(3);

    const light = await series.first().getAttribute('data-color');
    const token = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--ds-color-primary').trim(),
    );
    expect(light).toBe(token);

    await page.locator('#dashboard-controls').getByRole('button', { name: 'Dark' }).click();
    await expect
      .poll(async () => series.first().getAttribute('data-color'))
      .not.toBe(light);

    // The new colour is the new theme's token, not a second palette.
    const dark = await series.first().getAttribute('data-color');
    const darkToken = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--ds-color-primary').trim(),
    );
    expect(dark).toBe(darkToken);
    await page.locator('#dashboard-controls').getByRole('button', { name: 'Light' }).click();
  });

  test('the range buttons change the data every chart draws', async ({ page }) => {
    const points = plate(page, 'line').locator('[data-point]');
    await expect(points).toHaveCount(12);

    await page.locator('#dashboard-controls').getByRole('button', { name: 'Last 6 months' }).click();
    await expect(points).toHaveCount(6);
    await expect(plate(page, 'area').locator('[data-point]')).toHaveCount(6);
  });

  test('the same component draws every type from one switcher', async ({ page }) => {
    const chart = plate(page, 'switchable');
    await expect(chart).toHaveAttribute('data-chart-type', 'line');
    await expect(page.locator('#chart-switchable .ds-chart__subtitle')).toHaveText('Drawn as a line');

    for (const type of ['area', 'bar', 'stacked-column', 'scatter'] as const) {
      await page.locator('#type-switcher').getByRole('button', { name: type, exact: true }).click();
      await expect(chart).toHaveAttribute('data-chart-type', type);
      await expect(page.locator('#chart-switchable .ds-chart__subtitle')).toHaveText(`Drawn as a ${type}`);
      expect(await chart.locator('[data-point]').count()).toBeGreaterThan(0);
    }
  });

  test('names its slices in the legend, and its series everywhere else', async ({ page }) => {
    const donut = plate(page, 'donut');
    await expect(donut.locator('[data-legend]')).toHaveText(['Pro', 'Team', 'Enterprise', 'Free']);
    await expect(donut.locator('.ds-chart-mock__slice')).toHaveCount(4);

    await expect(plate(page, 'stacked-column').locator('[data-legend]')).toHaveText([
      'Pro',
      'Team',
      'Free trials',
    ]);
    // legend="none" really means none.
    await expect(plate(page, 'bar').locator('.ds-chart-mock__legend')).toBeHidden();
  });

  test('shows loading, then the chart', async ({ page }) => {
    const frame = page.locator('#chart-loading .ds-chart__frame');
    await expect(frame).toHaveAttribute('data-state', 'loading');
    await expect(frame).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('#chart-loading ds-skeleton')).toBeVisible();

    await page.locator('#loading-toggle').getByRole('button').click();
    await expect(frame).toHaveAttribute('data-state', 'ready');
    await expect(frame).not.toHaveAttribute('aria-busy', 'true');
    expect(await plate(page, 'loading').locator('[data-point]').count()).toBeGreaterThan(0);
  });

  test('says so, in the host’s words, when there is nothing to draw', async ({ page }) => {
    const frame = page.locator('#chart-empty .ds-chart__frame');
    await expect(frame).toHaveAttribute('data-state', 'empty');
    await expect(page.locator('#chart-empty ds-empty-state')).toContainText('No revenue in this region');
    await expect(page.locator('#chart-empty .ds-chart__canvas')).not.toHaveAttribute('role', 'img');
  });

  test('the gauge reads its value from the options it was given', async ({ page }) => {
    const gauge = plate(page, 'gauge');
    await expect(gauge.locator('.ds-chart-mock__gauge-label')).toHaveText('99.82%');
    await expect(gauge.locator('.ds-chart-mock__gauge-value')).toHaveAttribute('data-value', '99.82');
  });
});