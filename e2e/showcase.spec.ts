import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './helpers';

/**
 * The five new atoms are reachable: a nav entry each, a route each, a page
 * each — and the overview lists them.
 */
const ATOMS = [
  { label: 'Slider', path: '/primitives/slider' },
  { label: 'NumberInput', path: '/primitives/number-input' },
  { label: 'StarRating', path: '/primitives/star-rating' },
  { label: 'Kbd', path: '/primitives/kbd' },
  { label: 'Image', path: '/primitives/image' },
];

test.describe('showcase', () => {
  test('lists the new atoms in the sidebar and on the overview', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Design system sections' });
    for (const atom of ATOMS) {
      await expect(nav.getByRole('link', { name: new RegExp(`^${atom.label}\\b`) })).toHaveAttribute(
        'href',
        atom.path,
      );
    }

    const primitives = page.locator('#primitives');
    for (const atom of ATOMS) {
      await expect(primitives.locator(`a[href="${atom.path}"]`)).toBeVisible();
    }
  });

  for (const atom of ATOMS) {
    test(`routes to ${atom.label} from the sidebar`, async ({ page }) => {
      await page.goto('/');
      await page
        .getByRole('navigation', { name: 'Design system sections' })
        .getByRole('link', { name: new RegExp(`^${atom.label}\\b`) })
        .click();
      await expect(page).toHaveURL(new RegExp(`${atom.path}$`));
      await expect(page).toHaveTitle(`${atom.label} · Paint`);
      await expect(page.getByRole('heading', { level: 1, name: atom.label })).toBeVisible();
      await expect(page.locator('#api')).toBeVisible();
    });

    test(`${atom.label} page has no axe violations`, async ({ page }) => {
      await page.goto(atom.path);
      await expect(page.getByRole('heading', { level: 1, name: atom.label })).toBeVisible();
      await expectNoAxeViolations(page);
    });
  }
});