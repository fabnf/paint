import { expect, test, type Locator, type Page } from '@playwright/test';
import { openPage } from './helpers';

test.describe('ds-star-rating', () => {
  test.beforeEach(async ({ page }) => {
    await openPage(page, '/primitives/star-rating', 'StarRating');
  });

  const yourRating = (page: Page) => page.locator('#editable ds-star-rating');
  const readout = (page: Page) => page.locator('#editable').getByText(/^value = /);
  const fills = (group: Locator) =>
    group.locator('.ds-star-rating__fill').evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLElement).style.width),
    );

  test('editable: a native radio group with a clear name per star', async ({ page }) => {
    const group = yourRating(page).getByRole('radiogroup', { name: 'Your rating' });
    await expect(group).toBeVisible();
    const radios = group.getByRole('radio');
    await expect(radios).toHaveCount(5);
    await expect(radios.nth(0)).toHaveAccessibleName('1 star');
    await expect(radios.nth(2)).toHaveAccessibleName('3 stars');
    await expect(radios.nth(2)).toBeChecked();
    expect(await fills(group)).toEqual(['100%', '100%', '100%', '0%', '0%']);
  });

  test('Tab lands on the chosen star; the arrows move and choose', async ({ page }) => {
    const group = yourRating(page).getByRole('radiogroup', { name: 'Your rating' });
    const radios = group.getByRole('radio');

    // Focus the example's own "Show code" button, just before the group, then Tab into it.
    await page.locator('#editable').getByRole('button', { name: 'Show code' }).focus();
    await page.keyboard.press('Tab');
    await expect(radios.nth(2)).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(radios.nth(3)).toBeChecked();
    await expect(readout(page)).toHaveText('value = 4');

    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(radios.nth(1)).toBeChecked();
    await expect(readout(page)).toHaveText('value = 2');
    expect(await fills(group)).toEqual(['100%', '100%', '0%', '0%', '0%']);

    // One tab stop: Tab leaves the group.
    await page.keyboard.press('Tab');
    await expect(group.getByRole('radio', { checked: true })).not.toBeFocused();
  });

  test('Backspace clears, when clearable', async ({ page }) => {
    const group = yourRating(page).getByRole('radiogroup', { name: 'Your rating' });
    await group.getByRole('radio', { name: '3 stars' }).focus();
    await page.keyboard.press('Backspace');
    await expect(readout(page)).toHaveText('value = null');
    await expect(group.getByRole('radio', { checked: true })).toHaveCount(0);
    expect(await fills(group)).toEqual(['0%', '0%', '0%', '0%', '0%']);
  });

  test('clicking chooses; clicking the chosen star again clears', async ({ page }) => {
    const group = yourRating(page).getByRole('radiogroup', { name: 'Your rating' });
    const stars = group.locator('label.ds-star-rating__star');

    await stars.nth(4).click();
    await expect(readout(page)).toHaveText('value = 5');
    await expect(group.getByRole('radio', { name: '5 stars' })).toBeChecked();

    await stars.nth(4).click();
    await expect(readout(page)).toHaveText('value = null');
  });

  test('hovering previews, paler, and leaving forgets', async ({ page }) => {
    const group = yourRating(page).getByRole('radiogroup', { name: 'Your rating' });
    const stars = group.locator('label.ds-star-rating__star');

    await stars.nth(4).hover();
    await expect(group).toHaveClass(/ds-star-rating__stars--previewing/);
    expect(await fills(group)).toEqual(['100%', '100%', '100%', '100%', '100%']);
    await expect(readout(page)).toHaveText('value = 3');

    await page.mouse.move(0, 0);
    await expect(group).not.toHaveClass(/ds-star-rating__stars--previewing/);
    expect(await fills(group)).toEqual(['100%', '100%', '100%', '0%', '0%']);
  });

  test('words for the stars join the name and show on hover', async ({ page }) => {
    const section = page.locator('#labels');
    const group = section.getByRole('radiogroup', { name: 'Service' });
    await expect(group.getByRole('radio').nth(3)).toHaveAccessibleName('4 stars, Good');

    await group.locator('label.ds-star-rating__star').nth(4).hover();
    await expect(section.locator('.ds-star-rating__value')).toHaveText('Great');
  });

  test('read-only: one image that says the number, with half stars', async ({ page }) => {
    const section = page.locator('#read-only');
    const average = section.getByRole('img', { name: 'Average rating, 3.5 of 5 stars' });
    await expect(average).toBeVisible();
    expect(await fills(average)).toEqual(['100%', '100%', '100%', '50%', '0%']);
    await expect(section.getByRole('radio')).toHaveCount(0);
    await expect(section.getByRole('img', { name: 'Delivery, Not rated' })).toBeVisible();
  });

  test('read-only: a label and a value text make one name', async ({ page }) => {
    const section = page.locator('#read-only');
    const named = section.getByRole('img', { name: /^Average Rated 3\.5 out of 5 by 1,204 people$/ });
    await expect(named).toBeVisible();
    await expect(section.locator('.ds-star-rating__value')).toHaveText('3.5');
  });

  test('validates through the form and resets every star', async ({ page }) => {
    const forms = page.locator('#forms');
    const group = forms.getByRole('radiogroup', { name: /Food/ });
    await expect(group).toHaveAttribute('aria-required', 'true');

    await forms.getByRole('button', { name: 'Validate' }).click();
    await expect(group).toHaveAttribute('aria-invalid', 'true');
    await expect(forms.getByText('Please rate the food.')).toBeVisible();

    await group.locator('label.ds-star-rating__star').nth(3).click();
    await expect(forms.getByText('valid · value = 4')).toBeVisible();
    await expect(group).not.toHaveAttribute('aria-invalid', /.+/);

    await forms.getByRole('button', { name: 'Reset' }).click();
    await expect(group.getByRole('radio', { checked: true })).toHaveCount(0);
  });
});