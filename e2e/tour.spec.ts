import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, openPage } from './helpers';

const card = (page: Page) => page.getByRole('dialog');
const title = (page: Page) => page.locator('.ds-tour__title');
const position = (page: Page) => page.locator('.ds-tour__position');

/** Current deck: welcome, tokens, button, form-field, chart, inbox, scheduler, brand, done. */
const STEP_COUNT = 9;

/** Each test starts with a visitor who has never refused the tour. */
const freshVisitor = async (page: Page) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
};

const startTour = async (page: Page) => {
  await page.locator('#tour-start').getByRole('button').click();
  await expect(card(page)).toBeVisible();
};

test.describe('ds-tour', () => {
  test.beforeEach(async ({ page }) => {
    await freshVisitor(page);
    await openPage(page, '/components/tour', 'Tour');
  });

  test('is reachable from the sidebar, and clean under axe', async ({ page }) => {
    await expect(
      page
        .getByRole('navigation', { name: 'Design system sections' })
        .getByRole('link', { name: /^Tour\b/ }),
    ).toHaveAttribute('href', '/components/tour');
    await expectNoAxeViolations(page);
  });

  test('opens on the first step, as a modal card over an inert page', async ({ page }) => {
    await startTour(page);

    await expect(card(page)).toHaveAttribute('aria-modal', 'true');
    await expect(title(page)).toHaveText('This is Paint');
    await expect(position(page)).toHaveText(`1 of ${STEP_COUNT}`);
    await expect(page.locator('.ds-tour__layer')).toHaveText('Overview');
    await expect(card(page)).toBeFocused();

    const inert = await page.evaluate(() => !!document.querySelector('.app-sidebar')?.closest('[inert]'));
    expect(inert).toBe(true);
    await expectNoAxeViolations(page, '.ds-tour__card');
  });

  test('next routes to the step’s page and points at the real section', async ({ page }) => {
    await startTour(page);
    await card(page).getByRole('button', { name: 'Next' }).click();

    await expect(page).toHaveURL(/\/foundations$/);
    await expect(title(page)).toHaveText('Colour is a role, not a hex');
    await expect(position(page)).toHaveText(`2 of ${STEP_COUNT}`);

    // The spotlight is cut around the live #color section, not a centred card.
    const spotlight = page.locator('.ds-tour__spotlight');
    await expect(spotlight).not.toHaveClass(/ds-tour__spotlight--centred/);
    const box = await spotlight.boundingBox();
    const target = await page.locator('#color').boundingBox();
    expect(Math.abs(box!.y - (target!.y - 8))).toBeLessThan(4);
  });

  test('walks the layers forward, and back again', async ({ page }) => {
    await startTour(page);
    const next = () => card(page).getByRole('button', { name: 'Next' }).click();

    await next();
    await next();
    await expect(page).toHaveURL(/\/primitives\/button$/);
    await expect(page.locator('.ds-tour__layer')).toHaveText('Primitive');

    await next();
    await expect(page).toHaveURL(/\/components\/form-field$/);
    await expect(page.locator('.ds-tour__layer')).toHaveText('Molecule');

    // Organisms in this tree: chart, inbox, scheduler (list-tree / wizard not applied yet).
    await next();
    await expect(page).toHaveURL(/\/components\/chart$/);
    await expect(title(page)).toHaveText('Engines stay behind seams');
    await expect(page.locator('.ds-tour__layer')).toHaveText('Organism');

    await next();
    await expect(page).toHaveURL(/\/components\/workspace$/);
    await expect(title(page)).toHaveText('The hard parts are not the list');

    await next();
    await expect(title(page)).toHaveText('What is happening, not which day');
    await expect(position(page)).toHaveText(`7 of ${STEP_COUNT}`);

    await card(page).getByRole('button', { name: 'Back' }).click();
    await expect(page).toHaveURL(/\/components\/workspace$/);
    await expect(position(page)).toHaveText(`6 of ${STEP_COUNT}`);
    await expect(title(page)).toHaveText('The hard parts are not the list');
  });

  test('done on the last step ends it, and focus comes back', async ({ page }) => {
    await startTour(page);
    for (let step = 0; step < STEP_COUNT - 1; step++) {
      await card(page).getByRole('button', { name: 'Next' }).click();
      await expect(position(page)).toHaveText(`${step + 2} of ${STEP_COUNT}`);
    }

    await expect(page).toHaveURL(/\/components\/tour$/);
    await expect(title(page)).toHaveText('That is the whole idea');
    await card(page).getByRole('button', { name: 'Done' }).click();

    await expect(card(page)).toHaveCount(0);
    await expect(page.locator('.tour-log')).toContainText('ended → done');
    await expect(page.locator('main#content')).toBeFocused();
    const inert = await page.evaluate(() => !!document.querySelector('.app-sidebar')?.closest('[inert]'));
    expect(inert).toBe(false);
  });

  test('skips from the button and from Escape', async ({ page }) => {
    await startTour(page);
    await card(page).getByRole('button', { name: 'Skip' }).click();
    await expect(card(page)).toHaveCount(0);
    await expect(page.locator('.tour-log')).toContainText('ended → skip');

    await startTour(page);
    await page.keyboard.press('Escape');
    await expect(card(page)).toHaveCount(0);
    await expect(page.locator('.tour-log')).toContainText('ended → escape');
  });

  test('don’t show again keeps it away, until it is forgotten', async ({ page }) => {
    await startTour(page);
    await card(page).getByRole('checkbox', { name: /Don’t show this again/ }).check();
    await card(page).getByRole('button', { name: 'Skip' }).click();
    await expect(page.locator('.tour-log')).toContainText('don’t show again → paint-intro');

    await page.locator('#tour-start').getByRole('button').click();
    await expect(card(page)).toHaveCount(0);
    await expect(page.locator('.tour-log')).toContainText('suppressed');

    await page.reload();
    await page.locator('#tour-start').getByRole('button').click();
    await expect(card(page)).toHaveCount(0);

    await page.getByRole('button', { name: 'Forget “don’t show again”' }).click();
    await startTour(page);
    await expect(title(page)).toHaveText('This is Paint');
    await card(page).getByRole('button', { name: 'Skip' }).click();
  });
});
