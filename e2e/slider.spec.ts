import { expect, test } from '@playwright/test';
import { openPage } from './helpers';

test.describe('ds-slider', () => {
  test.beforeEach(async ({ page }) => {
    await openPage(page, '/primitives/slider', 'Slider');
  });

  test('is a labelled native range that paints its fill', async ({ page }) => {
    const volume = page.getByRole('slider', { name: 'Volume' }).first();
    await expect(volume).toHaveValue('40');
    await expect(volume).toHaveAttribute('type', 'range');
    await expect(volume).toHaveClass(/form-range/);
    await expect(volume).toHaveCSS('--ds-slider-fill', '40%');
  });

  test('steps with the arrows, jumps with Home and End, pages with the Page keys', async ({ page }) => {
    const volume = page.getByRole('slider', { name: 'Volume' }).first();
    const readout = page.locator('#basic').getByText(/^value = /);

    await volume.focus();
    await page.keyboard.press('End');
    await expect(volume).toHaveValue('100');
    await expect(readout).toHaveText('value = 100');

    await page.keyboard.press('Home');
    await expect(volume).toHaveValue('0');
    await expect(readout).toHaveText('value = 0');

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowUp');
    await expect(volume).toHaveValue('2');

    await page.keyboard.press('PageUp');
    await expect(volume).toHaveValue('12');

    await page.keyboard.press('PageDown');
    await page.keyboard.press('ArrowLeft');
    await expect(volume).toHaveValue('1');
    await expect(volume).toHaveCSS('--ds-slider-fill', '1%');
  });

  test('stops at the ends', async ({ page }) => {
    const volume = page.getByRole('slider', { name: 'Volume' }).first();
    await volume.focus();
    await page.keyboard.press('End');
    await page.keyboard.press('ArrowRight');
    await expect(volume).toHaveValue('100');
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowLeft');
    await expect(volume).toHaveValue('0');
  });

  test('moves to where the pointer lands', async ({ page }) => {
    const volume = page.getByRole('slider', { name: 'Volume' }).first();
    const box = (await volume.boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.75, box.y + box.height / 2);
    const value = Number(await volume.inputValue());
    expect(value).toBeGreaterThan(65);
    expect(value).toBeLessThan(85);
  });

  test('says what the number means, in both places', async ({ page }) => {
    const opacity = page.getByRole('slider', { name: 'Opacity' });
    await expect(opacity).toHaveAttribute('aria-valuetext', '60%');
    await expect(page.locator('#steps .ds-slider__value').first()).toHaveText('60%');

    await opacity.focus();
    await page.keyboard.press('ArrowRight');
    await expect(opacity).toHaveValue('0.65');
    await expect(opacity).toHaveAttribute('aria-valuetext', '65%');
  });

  test('shares a model with the number input beside it', async ({ page }) => {
    const pair = page.locator('#pair');
    const slider = pair.getByRole('slider', { name: 'Quality' });
    const digits = pair.getByRole('spinbutton', { name: 'Quality' });
    await expect(digits).toHaveValue('72');

    await slider.focus();
    await page.keyboard.press('End');
    await expect(digits).toHaveValue('100');

    await digits.fill('33');
    await expect(slider).toHaveValue('33');
  });

  test('follows the form: set, reset, disable', async ({ page }) => {
    const forms = page.locator('#forms');
    const brightness = forms.getByRole('slider', { name: 'Brightness' });
    await expect(brightness).toHaveValue('25');

    await forms.getByRole('button', { name: 'Set 80' }).click();
    await expect(brightness).toHaveValue('80');

    await forms.getByRole('button', { name: 'Reset' }).click();
    await expect(brightness).toHaveValue('0');
    await expect(forms.getByText('value = null')).toBeVisible();

    await forms.getByRole('button', { name: 'Disable' }).click();
    await expect(brightness).toBeDisabled();
  });

  test('reports an error as the invalid state', async ({ page }) => {
    const invalid = page.getByRole('slider', { name: 'Invalid' });
    await expect(invalid).toHaveAttribute('aria-invalid', 'true');
    const described = await invalid.getAttribute('aria-describedby');
    expect(described).toBeTruthy();
    await expect(page.locator(`#${described}`)).toContainText('Too loud for the room.');
  });
});