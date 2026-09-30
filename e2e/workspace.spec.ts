import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, openPage } from './helpers';

const mail = (page: Page) => page.locator('#mail');
const threads = (page: Page) => mail(page).getByRole('option');
const calendar = (page: Page) => page.locator('#calendar');

const toCalendar = async (page: Page) => {
  await page.locator('#modes').getByRole('button', { name: 'Calendar' }).click();
  await expect(calendar(page)).toBeVisible();
};

test.describe('ds-inbox and ds-scheduler', () => {
  test.beforeEach(async ({ page }) => {
    await openPage(page, '/components/workspace', 'Inbox & Scheduler');
  });

  test('is reachable from the sidebar, and clean under axe', async ({ page }) => {
    await expect(
      page
        .getByRole('navigation', { name: 'Design system sections' })
        .getByRole('link', { name: /^Inbox & Scheduler\b/ }),
    ).toHaveAttribute('href', '/components/workspace');
    await expectNoAxeViolations(page);
  });

  test('mail: a queue with unread threads and nothing open yet', async ({ page }) => {
    const list = mail(page).getByRole('listbox', { name: 'Support queue' });
    await expect(list).toBeVisible();
    await expect(threads(page)).toHaveCount(5);
    await expect(mail(page).getByText('Nothing selected')).toBeVisible();
    await expect(page.locator('#workspace-status')).toContainText('2 unread');
    await expect(threads(page).nth(4)).toHaveAttribute('aria-disabled', 'true');
  });

  test('mail: the keyboard skims and Enter opens', async ({ page }) => {
    const list = mail(page).getByRole('listbox');
    await list.focus();
    await page.keyboard.press('ArrowDown');
    // Arrowing does not open: the reading pane is still empty.
    await expect(mail(page).getByText('Nothing selected')).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(threads(page).nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(mail(page).locator('.ds-inbox__title')).toHaveText('Onboarding questions from Acme');
    await expect(mail(page).locator('.ds-inbox__message')).toHaveCount(2);

    // Typeahead moves the cursor by subject.
    await page.keyboard.press('l');
    await expect(mail(page).locator('.ds-inbox__thread--active')).toContainText('Latency spike');
  });

  test('mail: opening, replying and marking read go through the host', async ({ page }) => {
    await threads(page).first().click();
    await expect(mail(page).locator('.ds-inbox__title')).toHaveText('Invoice 4471 is overdue');

    await mail(page).getByRole('button', { name: 'Mark read' }).click();
    await expect(page.locator('#workspace-status')).toContainText('1 unread');

    await mail(page).getByRole('textbox', { name: 'Reply' }).fill('Card retried — it went through.');
    await mail(page).getByRole('button', { name: 'Send' }).click();

    await expect(page.locator('.ds-toast__title')).toHaveText('Reply sent');
    await expect(mail(page).locator('.ds-inbox__message').last()).toContainText('Card retried');
    await expect(mail(page).getByRole('textbox', { name: 'Reply' })).toHaveValue('');
  });

  test('mail: narrow puts the detail in a drawer, Escape closes it', async ({ page }) => {
    await page.getByRole('switch', { name: 'Narrow (drawer)' }).click();
    await threads(page).first().click();

    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('aria-modal', 'true');
    await expect(drawer).toContainText('Invoice 4471');

    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);
    await expect(mail(page).getByRole('listbox')).toBeFocused();
  });

  test('mail: loading, then empty', async ({ page }) => {
    await page.locator('#mail-load').getByRole('button').click();
    await expect(mail(page).locator('[role="status"]')).toBeVisible();
    await expect(threads(page)).toHaveCount(5);

    await page.locator('#mail-empty').getByRole('button').click();
    await expect(mail(page).getByText('The queue is clear')).toBeVisible();
    await expect(mail(page).getByRole('listbox')).toHaveCount(0);
  });

  test('calendar: the month grid, with overlapping days', async ({ page }) => {
    await toCalendar(page);
    await expect(calendar(page).locator('.ds-scheduler__title')).toContainText('March');
    await expect(calendar(page).getByRole('gridcell')).toHaveCount(42);
    const today = calendar(page).locator('.ds-scheduler__day--today');
    await expect(today).toContainText('Standup');
    await expect(today.locator('.ds-scheduler__more')).toBeVisible();
  });

  test('calendar: views change, and each shows its own range', async ({ page }) => {
    await toCalendar(page);
    await calendar(page).getByRole('button', { name: 'Week', exact: true }).click();
    await expect(calendar(page).locator('.ds-scheduler__column')).toHaveCount(7);
    // Overlapping meetings share the width rather than hiding each other.
    const blocks = calendar(page).locator('.ds-scheduler__block');
    expect(await blocks.count()).toBeGreaterThan(3);
    const widths = await blocks.evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLElement).style.width),
    );
    expect(widths.filter((width) => width !== '100%').length).toBeGreaterThan(1);

    await calendar(page).getByRole('button', { name: 'Agenda', exact: true }).click();
    await expect(calendar(page).locator('.ds-scheduler__agenda-day').first()).toBeVisible();
    await expect(page.locator('#workspace-status')).toContainText('agenda view');

    await calendar(page).getByRole('button', { name: 'Day', exact: true }).click();
    await expect(calendar(page).locator('.ds-scheduler__column')).toHaveCount(1);
  });

  test('calendar: the range navigates, and comes back to today', async ({ page }) => {
    await toCalendar(page);
    await calendar(page).getByRole('button', { name: 'Next range' }).click();
    await expect(calendar(page).locator('.ds-scheduler__title')).toContainText('April');
    await calendar(page).getByRole('button', { name: 'Previous range' }).click();
    await expect(calendar(page).locator('.ds-scheduler__title')).toContainText('March');

    await calendar(page).getByRole('button', { name: 'Today' }).click();
    await expect(calendar(page).locator('.ds-scheduler__day--today')).toBeVisible();
  });

  test('calendar: an event opens in the drawer, and the keyboard opens one too', async ({ page }) => {
    await toCalendar(page);
    await calendar(page).locator('.ds-scheduler__chip').first().click();

    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('When');
    await expect(page.locator('#workspace-last')).not.toHaveText('—');
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);

    // The grid's day cursor: arrows move, Enter opens the day's first event.
    await calendar(page).getByRole('grid').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('calendar: loading, and a range with nothing in it', async ({ page }) => {
    await toCalendar(page);
    await page.locator('#cal-load').getByRole('button').click();
    await expect(calendar(page).locator('.ds-scheduler__loading')).toBeVisible();
    await expect(calendar(page).getByRole('grid')).toBeVisible();

    await page.locator('#cal-empty').getByRole('button').click();
    await expect(calendar(page).locator('.ds-scheduler__none')).toContainText('Nothing scheduled');

    await calendar(page).getByRole('button', { name: 'Agenda', exact: true }).click();
    await expect(calendar(page).locator('ds-empty-state')).toContainText('Nothing scheduled');
  });
});