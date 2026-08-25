import { expect, test } from '@playwright/test';
import { openPage } from './helpers';

test.describe('ds-number-input', () => {
  test.beforeEach(async ({ page }) => {
    await openPage(page, '/primitives/number-input', 'NumberInput');
  });

  const seats = (page: import('@playwright/test').Page) => page.locator('#anatomy ds-number-input');

  test('is a labelled native number input between two named buttons', async ({ page }) => {
    const field = seats(page);
    const input = field.getByRole('spinbutton', { name: 'Seats' });
    await expect(input).toHaveValue('3');
    await expect(input).toHaveAttribute('type', 'number');
    await expect(input).toHaveAttribute('min', '1');
    await expect(input).toHaveAttribute('max', '12');
    await expect(field.getByRole('button', { name: 'Decrease' })).toBeVisible();
    await expect(field.getByRole('button', { name: 'Increase' })).toBeVisible();
  });

  test('steps with the buttons and keeps the caret in the field', async ({ page }) => {
    const field = seats(page);
    const input = field.getByRole('spinbutton', { name: 'Seats' });
    await input.focus();

    await field.getByRole('button', { name: 'Increase' }).click();
    await expect(input).toHaveValue('4');
    await expect(input).toBeFocused();

    await field.getByRole('button', { name: 'Decrease' }).click();
    await field.getByRole('button', { name: 'Decrease' }).click();
    await expect(input).toHaveValue('2');
    await expect(page.locator('#anatomy').getByText('value = 2')).toBeVisible();
  });

  test('steps with the arrow keys, inside the bounds', async ({ page }) => {
    const input = seats(page).getByRole('spinbutton', { name: 'Seats' });
    await input.focus();
    await page.keyboard.press('ArrowUp');
    await expect(input).toHaveValue('4');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(input).toHaveValue('1');
    await expect(seats(page).getByRole('button', { name: 'Decrease' })).toBeDisabled();
  });

  test('lets anything be typed, and clamps when the field is left', async ({ page }) => {
    const input = seats(page).getByRole('spinbutton', { name: 'Seats' });
    await input.fill('40');
    await expect(input).toHaveValue('40');
    await expect(page.locator('#anatomy').getByText('value = 40')).toBeVisible();

    await page.keyboard.press('Tab');
    await expect(input).toHaveValue('12');
    await expect(page.locator('#anatomy').getByText('value = 12')).toBeVisible();
    await expect(seats(page).getByRole('button', { name: 'Increase' })).toBeDisabled();
  });

  test('settles on Enter', async ({ page }) => {
    const input = seats(page).getByRole('spinbutton', { name: 'Seats' });
    await input.fill('0');
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('1');
  });

  test('snaps a typed value onto the step grid', async ({ page }) => {
    const opacity = page.getByRole('spinbutton', { name: 'Opacity' });
    await opacity.fill('17');
    await page.keyboard.press('Tab');
    await expect(opacity).toHaveValue('15');

    const price = page.getByRole('spinbutton', { name: 'Price' });
    await price.fill('3.456');
    await page.keyboard.press('Tab');
    await expect(price).toHaveValue('3.46');
  });

  test('adds decimals without floating-point dust', async ({ page }) => {
    const price = page.getByRole('spinbutton', { name: 'Price' });
    await expect(price).toHaveValue('19.99');
    await price.focus();
    await page.keyboard.press('ArrowUp');
    await expect(price).toHaveValue('20');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(price).toHaveValue('19.98');
  });

  test('keeps the buttons out of the tab order', async ({ page }) => {
    const input = seats(page).getByRole('spinbutton', { name: 'Seats' });
    await input.focus();
    await page.keyboard.press('Tab');
    const tag = await page.evaluate(() => document.activeElement?.className ?? '');
    expect(tag).not.toContain('ds-number__step');
  });

  test('asks for the right keypad', async ({ page }) => {
    await expect(seats(page).getByRole('spinbutton')).toHaveAttribute('inputmode', 'numeric');
    await expect(page.getByRole('spinbutton', { name: 'Price' })).toHaveAttribute('inputmode', 'decimal');
    await expect(page.getByRole('spinbutton', { name: 'Temperature' })).not.toHaveAttribute('inputmode', /.+/);
  });

  test('validates through the form, and resets to empty', async ({ page }) => {
    const forms = page.locator('#forms');
    const guests = forms.getByRole('spinbutton', { name: /Guests/ });
    await expect(guests).toHaveValue('');

    await forms.getByRole('button', { name: 'Validate' }).click();
    await expect(guests).toHaveAttribute('aria-invalid', 'true');
    await expect(forms.getByText('How many?')).toBeVisible();

    await forms.getByRole('button', { name: 'Increase' }).click();
    await expect(guests).toHaveValue('1');
    await expect(forms.getByText('valid · value = 1')).toBeVisible();

    await forms.getByRole('button', { name: 'Reset' }).click();
    await expect(guests).toHaveValue('');
  });
});