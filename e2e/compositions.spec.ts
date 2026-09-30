import { expect, test } from '@playwright/test';
import { expectNoAxeViolations, openPage } from './helpers';

/**
 * The four small compositions: reachable from the sidebar, clean under axe as
 * rendered, and — for the one that is a control — behaving as one value.
 */
const MOLECULES = [
  { label: 'RangeControl', path: '/components/range-control' },
  { label: 'Figure', path: '/components/figure' },
  { label: 'RatingSummary', path: '/components/rating-summary' },
  { label: 'ShortcutHint', path: '/components/shortcut-hint' },
];

test.describe('compositions', () => {
  for (const molecule of MOLECULES) {
    test(`routes to ${molecule.label} from the sidebar`, async ({ page }) => {
      await page.goto('/');
      await page
        .getByRole('navigation', { name: 'Design system sections' })
        .getByRole('link', { name: new RegExp(`^${molecule.label}\\b`) })
        .click();
      await expect(page).toHaveURL(new RegExp(`${molecule.path}$`));
      await expect(page).toHaveTitle(`${molecule.label} · Paint`);
      await expect(page.getByRole('heading', { level: 1, name: molecule.label })).toBeVisible();
      await expect(page.locator('#api')).toBeVisible();
    });

    test(`${molecule.label} page has no axe violations`, async ({ page }) => {
      await page.goto(molecule.path);
      await expect(page.getByRole('heading', { level: 1, name: molecule.label })).toBeVisible();
      await expectNoAxeViolations(page);
    });
  }
});

test.describe('ds-range-control', () => {
  test.beforeEach(async ({ page }) => {
    await openPage(page, '/components/range-control', 'RangeControl');
  });

  test('one label names both controls', async ({ page }) => {
    const section = page.locator('#basic');
    await expect(section.getByRole('slider', { name: 'Volume' })).toHaveValue('40');
    await expect(section.getByRole('spinbutton', { name: 'Volume' })).toHaveValue('40');
    await expect(section.locator('ds-range-control label')).toHaveCount(1);
  });

  test('the slider moves the digits, the digits move the slider', async ({ page }) => {
    const section = page.locator('#basic');
    const slider = section.getByRole('slider', { name: 'Volume' });
    const digits = section.getByRole('spinbutton', { name: 'Volume' });

    await slider.focus();
    await page.keyboard.press('End');
    await expect(digits).toHaveValue('100');
    await expect(section.getByText('value = 100')).toBeVisible();

    await digits.fill('25');
    await expect(slider).toHaveValue('25');
    await expect(section.getByText('value = 25')).toBeVisible();
  });

  test('clamps on every keystroke, rewrites only on settle', async ({ page }) => {
    const section = page.locator('#rules');
    const slider = section.getByRole('slider', { name: 'Budget' });
    const digits = section.getByRole('spinbutton', { name: 'Budget' });

    await digits.fill('9999');
    await expect(digits).toHaveValue('9999');
    await expect(slider).toHaveValue('5000');
    await expect(section.getByText(/budget = 5000/)).toBeVisible();

    await page.keyboard.press('Tab');
    await expect(digits).toHaveValue('5000');
  });

  test('is one control to a form, and adopts a field around it', async ({ page }) => {
    const forms = page.locator('#forms');
    const slider = forms.getByRole('slider', { name: 'Brightness' });
    const digits = forms.getByRole('spinbutton', { name: 'Brightness' });
    await expect(slider).toHaveValue('25');
    await expect(forms.locator('label')).toHaveCount(1);

    await forms.getByRole('button', { name: 'Set 80' }).click();
    await expect(slider).toHaveValue('80');
    await expect(digits).toHaveValue('80');

    await forms.getByRole('button', { name: 'Disable' }).click();
    await expect(slider).toBeDisabled();
    await expect(digits).toBeDisabled();
  });
});

test.describe('ds-figure', () => {
  test('is a figure named by its caption, with the credit as a link', async ({ page }) => {
    await openPage(page, '/components/figure', 'Figure');
    const figure = page.locator('#basic figure');
    await expect(figure).toHaveAccessibleName(/Plate 3 — the first Wet Paint swatch/);
    await expect(figure.locator('img')).toHaveAttribute('alt', /violet wash/);
    await expect(figure.getByRole('link', { name: /Photo: Ada Lovelace/ })).toHaveAttribute(
      'href',
      'https://example.com/ada',
    );
    await expect(figure.locator('h1, h2, h3, button')).toHaveCount(0);
  });

  test('wraps the picture in a link named by the alt', async ({ page }) => {
    await openPage(page, '/components/figure', 'Figure');
    const link = page.locator('#link').getByRole('link', { name: 'Floor plan, level 2' });
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noreferrer noopener');
  });
});

test.describe('ds-rating-summary', () => {
  test('is heard as one sentence', async ({ page }) => {
    await openPage(page, '/components/rating-summary', 'RatingSummary');
    const summary = page.locator('#basic ds-rating-summary');
    await expect(summary.locator('.visually-hidden')).toHaveText('4.3 out of 5 stars, 1,204 reviews');
    await expect(summary.locator('[aria-hidden="true"].ds-rating-summary__visual')).toBeVisible();
    await expect(summary.getByRole('link')).toHaveCount(0);

    const linked = page.locator('#link ds-rating-summary');
    await expect(linked.locator('.visually-hidden')).toHaveText('4.3 out of 5 stars');
    await expect(linked.getByRole('link', { name: '1,204 reviews' })).toBeVisible();
  });
});

test.describe('ds-shortcut-hint', () => {
  test('reads label then keys, and is never a tab stop', async ({ page }) => {
    await openPage(page, '/components/shortcut-hint', 'ShortcutHint');
    const sheet = page.locator('#basic');
    const rows = sheet.locator('ds-shortcut-hint');
    await expect(rows).toHaveCount(6);
    await expect(rows.first().locator('.ds-shortcut-hint__label')).toHaveText('Search');
    await expect(rows.first().locator('ds-kbd .visually-hidden')).toHaveText('Command K');

    const focusable = await sheet
      .locator('ds-shortcut-hint *')
      .evaluateAll((nodes) => nodes.filter((node) => (node as HTMLElement).tabIndex >= 0).length);
    expect(focusable).toBe(0);
  });
});