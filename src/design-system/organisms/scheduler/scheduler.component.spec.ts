import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SchedulerComponent } from './scheduler.component';
import {
  dateOf,
  daysBetween,
  eventsOn,
  minutesOf,
  occursOn,
  placeDay,
  rangeFor,
  stepAnchor,
  timeOf,
  type SchedulerEvent,
  type SchedulerEventEvent,
  type SchedulerRange,
  type SchedulerView,
} from './scheduler.types';

const TODAY = '2026-03-04';

const EVENTS: readonly SchedulerEvent[] = [
  { id: 'standup', title: 'Standup', start: `${TODAY}T09:00`, end: `${TODAY}T09:15`, calendar: 'Team' },
  { id: 'review', title: 'Design review', start: `${TODAY}T09:00`, end: `${TODAY}T10:00`, tone: 'accent', calendar: 'Design' },
  { id: 'onboarding', title: 'Acme onboarding', start: `${TODAY}T09:30`, end: `${TODAY}T11:00`, tone: 'info' },
  { id: 'retro', title: 'Retro', start: `${TODAY}T15:00`, end: `${TODAY}T16:00` },
  { id: 'offsite', title: 'Offsite', start: '2026-03-06', end: '2026-03-07', allDay: true, tone: 'success' },
  { id: 'board', title: 'Board meeting', start: '2026-03-19T14:00', end: '2026-03-19T16:00', tone: 'warning' },
];

describe('the scheduler’s arithmetic', () => {
  it('splits an ISO value into its day and its clock', () => {
    expect(dateOf('2026-03-04T09:30')).toBe('2026-03-04');
    expect(timeOf('2026-03-04T09:30')).toBe('09:30');
    expect(timeOf('2026-03-04')).toBe('');
    expect(minutesOf('2026-03-04T09:30')).toBe(570);
    expect(minutesOf('2026-03-04')).toBe(0);
  });

  it('knows which days an event touches, including multi-day ones', () => {
    expect(occursOn(EVENTS[0], TODAY)).toBeTrue();
    expect(occursOn(EVENTS[0], '2026-03-05')).toBeFalse();
    expect(occursOn(EVENTS[4], '2026-03-06')).toBeTrue();
    expect(occursOn(EVENTS[4], '2026-03-07')).toBeTrue();
    expect(occursOn(EVENTS[4], '2026-03-08')).toBeFalse();
  });

  it('sorts a day: all-day first, then by the clock', () => {
    const day = eventsOn([...EVENTS, { id: 'x', title: 'Holiday', start: TODAY, allDay: true }], TODAY);
    expect(day[0].id).toBe('x');
    // Two events start at 09:00, so the title breaks the tie.
    expect(day.slice(1).map((event) => event.id)).toEqual(['review', 'standup', 'onboarding', 'retro']);
  });

  it('gives each view its own range, and its own step', () => {
    expect(rangeFor('month', TODAY)).toEqual({ view: 'month', start: '2026-03-01', end: '2026-03-31' });
    expect(rangeFor('week', TODAY)).toEqual({ view: 'week', start: '2026-03-02', end: '2026-03-08' });
    expect(rangeFor('day', TODAY)).toEqual({ view: 'day', start: TODAY, end: TODAY });
    expect(rangeFor('agenda', TODAY)).toEqual({ view: 'agenda', start: TODAY, end: '2026-03-17' });

    expect(stepAnchor('month', TODAY, 1)).toBe('2026-04-01');
    expect(stepAnchor('month', TODAY, -1)).toBe('2026-02-01');
    expect(stepAnchor('week', TODAY, 1)).toBe('2026-03-11');
    expect(stepAnchor('day', TODAY, -1)).toBe('2026-03-03');
    expect(stepAnchor('agenda', TODAY, 1)).toBe('2026-03-18');

    expect(daysBetween('2026-03-04', '2026-03-06')).toEqual(['2026-03-04', '2026-03-05', '2026-03-06']);
  });

  describe('overlap packing', () => {
    it('shares the width between events that touch', () => {
      const placed = placeDay(eventsOn(EVENTS, TODAY));
      const byId = new Map(placed.map((one) => [one.event.id, one]));

      // Standup (09:00–09:15), review (09:00–10:00) and onboarding (09:30–11:00)
      // form one group. Two columns are enough: onboarding reuses the one
      // standup has finished with, and nothing is ever drawn on top of
      // anything it overlaps.
      expect(byId.get('standup')!.columns).toBe(2);
      expect(byId.get('standup')!.column).not.toBe(byId.get('review')!.column);
      expect(byId.get('onboarding')!.column).not.toBe(byId.get('review')!.column);
      expect(byId.get('onboarding')!.column).toBe(byId.get('standup')!.column);

      // Retro touches nothing, so it gets the whole width.
      expect(byId.get('retro')!.columns).toBe(1);
      expect(byId.get('retro')!.column).toBe(0);
    });

    it('places by the clock, with a floor on the height', () => {
      const placed = placeDay(eventsOn(EVENTS, TODAY));
      const standup = placed.find((one) => one.event.id === 'standup')!;
      expect(standup.startMinute).toBe(540);
      // A fifteen-minute meeting is still readable.
      expect(standup.duration).toBe(30);
      expect(placed.find((one) => one.event.id === 'retro')!.duration).toBe(60);
    });

    it('leaves all-day events out of the canvas', () => {
      expect(placeDay(eventsOn(EVENTS, '2026-03-06')).length).toBe(0);
    });
  });
});

@Component({
  standalone: true,
  imports: [SchedulerComponent],
  template: `
    <ds-scheduler
      #scheduler
      [events]="events()"
      [(view)]="view"
      [(date)]="date"
      [today]="today"
      [loading]="loading()"
      [views]="['month', 'week', 'day', 'agenda']"
      (rangeChange)="ranges.push($event)"
      (eventOpen)="opened.push($event)"
      (daySelect)="days.push($event)"
    />
  `,
})
class SchedulerHost {
  readonly events = signal<readonly SchedulerEvent[]>(EVENTS);
  view: SchedulerView = 'month';
  date = TODAY;
  readonly today = TODAY;
  readonly loading = signal(false);
  ranges: SchedulerRange[] = [];
  opened: SchedulerEventEvent[] = [];
  days: string[] = [];
}

describe('SchedulerComponent', () => {
  let fixture: ComponentFixture<SchedulerHost>;
  let host: SchedulerHost;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);
  const queryAll = (selector: string): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll(selector));
  const grid = () => query<HTMLElement>('[role="grid"]')!;
  const title = () => query('.ds-scheduler__title')!.textContent!.trim();
  const viewButton = (label: string) =>
    queryAll('.ds-scheduler__views button').find((button) => button.textContent!.trim() === label)!;
  const press = (key: string) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    grid().dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };
  const cursor = () => query<HTMLElement>('.ds-scheduler__day--cursor');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchedulerHost],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(SchedulerHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('opens on the month, with the range named out loud', () => {
    expect(grid().getAttribute('role')).toBe('grid');
    expect(title()).toContain('March');
    expect(query('.ds-scheduler__title')!.getAttribute('role')).toBe('status');
    expect(queryAll('.ds-scheduler__weekday').length).toBe(7);
    expect(queryAll('[role="gridcell"]').length).toBe(42);
  });

  it('draws a day’s events as chips, and names the day with its count', () => {
    const today = queryAll('[role="gridcell"]').find((cell) =>
      cell.classList.contains('ds-scheduler__day--today'),
    )!;
    expect(today.getAttribute('aria-label')).toContain('4 events');
    // Three chips and a "+1 more", rather than a day that grows forever.
    expect(today.querySelectorAll('.ds-scheduler__chip').length).toBe(3);
    expect(today.querySelector('.ds-scheduler__more')!.textContent).toContain('+1');
  });

  it('switches views, and each one shows its own range', () => {
    viewButton('Week').click();
    fixture.detectChanges();
    expect(host.view).toBe('week');
    expect(queryAll('.ds-scheduler__column').length).toBe(7);
    expect(host.ranges.at(-1)).toEqual({ view: 'week', start: '2026-03-02', end: '2026-03-08' });

    viewButton('Day').click();
    fixture.detectChanges();
    expect(queryAll('.ds-scheduler__column').length).toBe(1);

    viewButton('Agenda').click();
    fixture.detectChanges();
    expect(query('.ds-scheduler__agenda')).toBeTruthy();
    // A fortnight of days that actually have something on them.
    expect(queryAll('.ds-scheduler__agenda-day').length).toBe(3);
  });

  it('navigates the range in the view’s own unit, and comes back to today', () => {
    queryAll('.ds-scheduler__range button')[1].click(); // next
    fixture.detectChanges();
    expect(host.date).toBe('2026-04-01');
    expect(title()).toContain('April');
    expect(host.ranges.at(-1)!.start).toBe('2026-04-01');

    queryAll('.ds-scheduler__range button')[0].click(); // previous
    fixture.detectChanges();
    expect(title()).toContain('March');

    viewButton('Week').click();
    fixture.detectChanges();
    queryAll('.ds-scheduler__range button')[1].click();
    fixture.detectChanges();
    expect(host.date).toBe('2026-03-08');

    queryAll('.ds-scheduler__range button')[2].click(); // today
    fixture.detectChanges();
    expect(host.date).toBe(TODAY);
  });

  it('stacks overlapping events side by side in the week', () => {
    viewButton('Week').click();
    fixture.detectChanges();

    const blocks = queryAll('.ds-scheduler__block');
    const widths = blocks.map((block) => block.style.width);
    expect(blocks.length).toBe(4);
    // The overlapping group needs two columns; the lone event keeps the width.
    expect(widths.filter((width) => width === '50%').length).toBe(3);
    expect(widths).toContain('100%');
    const lefts = blocks.map((block) => block.style.left);
    expect(new Set(lefts).size).toBeGreaterThan(1);
  });

  it('opens an event in Paint’s drawer, without choosing its day', () => {
    const chip = query<HTMLButtonElement>('.ds-scheduler__chip')!;
    chip.click();
    fixture.detectChanges();

    expect(host.opened.length).toBe(1);
    expect(host.days.length).toBe(0);
    const drawer = query<HTMLElement>('[role="dialog"]')!;
    expect(drawer.getAttribute('aria-modal')).toBe('true');
    expect(drawer.textContent).toContain(host.opened[0].event.title);
    expect(drawer.textContent).toContain('Calendar');
  });

  it('chooses a day when the day itself is clicked', () => {
    const cell = queryAll('[role="gridcell"]')[10];
    cell.click();
    fixture.detectChanges();
    expect(host.days.length).toBe(1);
    expect(host.date).toBe(host.days[0]);
    expect(cell.getAttribute('aria-selected')).toBe('true');
  });

  describe('the keyboard', () => {
    it('moves a day, a week, and to the ends of the range', () => {
      expect(cursor()!.getAttribute('aria-label')).toContain('4 March');

      expect(press('ArrowRight').defaultPrevented).toBeTrue();
      expect(cursor()!.getAttribute('aria-label')).toContain('5 March');
      press('ArrowDown');
      expect(cursor()!.getAttribute('aria-label')).toContain('12 March');
      press('ArrowUp');
      expect(cursor()!.getAttribute('aria-label')).toContain('5 March');

      press('Home');
      expect(cursor()!.getAttribute('aria-label')).toContain('1 March');
      press('End');
      expect(cursor()!.getAttribute('aria-label')).toContain('31 March');
    });

    it('pages the range when the cursor walks off the end', () => {
      press('End');
      press('ArrowRight');
      expect(host.date).toBe('2026-04-01');
      expect(host.ranges.at(-1)!.start).toBe('2026-04-01');
    });

    it('opens the focused day’s first event with Enter, or chooses the day', () => {
      press('Enter');
      expect(host.opened.length).toBe(1);
      expect(host.opened[0].event.id).toBe('review');
      expect(host.opened[0].date).toBe(TODAY);

      // A day with nothing on it is chosen, not opened.
      press('ArrowRight');
      press('Enter');
      expect(host.opened.length).toBe(1);
      expect(host.days).toEqual(['2026-03-05']);
    });
  });

  it('shows loading, and says when a range has nothing in it', () => {
    host.loading.set(true);
    fixture.detectChanges();
    expect(query('.ds-scheduler__loading')!.getAttribute('aria-label')).toBe('Loading events…');
    expect(query('[role="grid"]')).toBeNull();

    host.loading.set(false);
    host.events.set([]);
    fixture.detectChanges();
    expect(query('.ds-scheduler__none')!.textContent).toContain('Nothing scheduled');

    // The agenda has nothing to draw at all, so it gets the empty state.
    viewButton('Agenda').click();
    fixture.detectChanges();
    expect(query('ds-empty-state')!.textContent).toContain('Nothing scheduled');
  });
});