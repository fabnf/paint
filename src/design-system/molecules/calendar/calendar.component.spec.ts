import { Component, signal } from '@angular/core';
import { TestBed, fakeAsync, tick, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CalendarComponent } from './calendar.component';
import type { DateMatcher, IsoDate, WeekStart } from '../../utils';

/** March 2026 starts on a Sunday and has 31 days — a month with a full lead row. */
const TODAY: IsoDate = '2026-03-04';

@Component({
  standalone: true,
  imports: [CalendarComponent],
  template: `
    <ds-calendar
      [today]="today"
      [(value)]="value"
      [(month)]="month"
      [min]="min()"
      [max]="max()"
      [dateDisabled]="dateDisabled()"
      [disabled]="disabled()"
      [weekStart]="weekStart()"
      [showWeekNumbers]="showWeekNumbers()"
      [showAdjacentDays]="showAdjacentDays()"
      [fixedWeeks]="fixedWeeks()"
      [rangeStart]="rangeStart()"
      [rangeEnd]="rangeEnd()"
      (daySelected)="picked.push($event)"
    />
  `,
})
class HostComponent {
  readonly today = TODAY;
  value: IsoDate | null = null;
  month: IsoDate | null = null;
  readonly min = signal<IsoDate | null>(null);
  readonly max = signal<IsoDate | null>(null);
  readonly dateDisabled = signal<DateMatcher | null>(null);
  readonly disabled = signal(false);
  readonly weekStart = signal<WeekStart | null>(1);
  readonly showWeekNumbers = signal(false);
  readonly showAdjacentDays = signal(true);
  readonly fixedWeeks = signal(true);
  readonly rangeStart = signal<IsoDate | null>(null);
  readonly rangeEnd = signal<IsoDate | null>(null);
  picked: IsoDate[] = [];
}

describe('CalendarComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);

  const grid = () => query<HTMLTableElement>('[role="grid"]')!;
  const day = (iso: IsoDate) => query<HTMLButtonElement>(`[data-date="${iso}"]`);
  const days = () =>
    Array.from(fixture.nativeElement.querySelectorAll('[data-date]') as NodeListOf<HTMLElement>);
  const tabStop = () => days().find((button) => button.getAttribute('tabindex') === '0');

  const press = (key: string, options: KeyboardEventInit = {}) => {
    grid().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...options }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('structure', () => {
    it('is a grid, named by the month it is showing', () => {
      const label = query('.ds-calendar__month')!;
      expect(grid().getAttribute('role')).toBe('grid');
      expect(grid().getAttribute('aria-labelledby')).toBe(label.id);
      expect(label.textContent!.trim()).toBe('March 2026');
    });

    it('announces the month politely when it changes', () => {
      // The grid's name is also a live region: paging is a change the user asked for.
      expect(query('.ds-calendar__month')!.getAttribute('aria-live')).toBe('polite');
    });

    it('names every weekday in full, and abbreviates it for the eye', () => {
      const headers = Array.from(
        fixture.nativeElement.querySelectorAll('thead th') as NodeListOf<HTMLElement>,
      );

      expect(headers.length).toBe(7);
      expect(headers[0].getAttribute('scope')).toBe('col');
      expect(headers[0].getAttribute('abbr')).toBe('Monday');
      expect(headers[0].querySelector('[aria-hidden="true"]')!.textContent).toBe('Mon');
      expect(headers[0].querySelector('.visually-hidden')!.textContent).toBe('Monday');
    });

    it('starts the week where it is told to', () => {
      host.weekStart.set(0);
      fixture.detectChanges();

      const first = fixture.nativeElement.querySelector('thead th') as HTMLElement;
      expect(first.getAttribute('abbr')).toBe('Sunday');
    });

    it('pads the month with the adjacent months’ days', () => {
      // March 2026 starts on a Sunday; with a Monday week start the row leads with February.
      expect(day('2026-02-23')).toBeTruthy();
      expect(day('2026-02-23')!.classList).toContain('ds-calendar__day--outside');
      expect(day('2026-03-01')!.classList).not.toContain('ds-calendar__day--outside');
    });

    it('can hide the adjacent days without collapsing the row', () => {
      host.showAdjacentDays.set(false);
      fixture.detectChanges();

      expect(day('2026-02-23')).toBeNull();
      expect(query('.ds-calendar__empty')).toBeTruthy();
      expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(6);
    });

    it('is six rows tall, so the page below it does not move', () => {
      host.month = '2026-02-01';
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(6);

      host.fixedWeeks.set(false);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(5);
    });

    it('offers the ISO week number as a row header', () => {
      host.showWeekNumbers.set(true);
      fixture.detectChanges();

      const weeks = Array.from(
        fixture.nativeElement.querySelectorAll('tbody th') as NodeListOf<HTMLElement>,
      );
      expect(weeks[0].getAttribute('scope')).toBe('row');
      expect(weeks[0].textContent!.trim()).toBe('9');
      expect(query('.ds-calendar__week-head .visually-hidden')!.textContent).toBe('Week');
    });

    it('marks today, and names every day in full', () => {
      expect(day(TODAY)!.getAttribute('aria-current')).toBe('date');
      expect(day(TODAY)!.classList).toContain('ds-calendar__day--today');
      expect(day(TODAY)!.getAttribute('aria-label')).toBe('4 March 2026');
      expect(day('2026-03-05')!.getAttribute('aria-current')).toBeNull();
    });
  });

  describe('selection', () => {
    it('selects a day, and says so on the cell', () => {
      day('2026-03-10')!.click();
      fixture.detectChanges();

      expect(host.value).toBe('2026-03-10');
      expect(host.picked).toEqual(['2026-03-10']);
      expect(day('2026-03-10')!.closest('td')!.getAttribute('aria-selected')).toBe('true');
      expect(day('2026-03-11')!.closest('td')!.getAttribute('aria-selected')).toBe('false');
    });

    it('opens on the month of the value, then of today', () => {
      expect(query('.ds-calendar__month')!.textContent!.trim()).toBe('March 2026');

      host.value = '2026-07-14';
      fixture.detectChanges();
      expect(query('.ds-calendar__month')!.textContent!.trim()).toBe('July 2026');
    });

    it('pages to the month of an adjacent day that was picked', () => {
      day('2026-04-01')!.click();
      fixture.detectChanges();

      expect(host.value).toBe('2026-04-01');
      expect(host.month).toBe('2026-04-01');
      expect(query('.ds-calendar__month')!.textContent!.trim()).toBe('April 2026');
    });

    it('never selects a disabled day', () => {
      host.min.set('2026-03-10');
      fixture.detectChanges();

      day('2026-03-09')!.click();
      fixture.detectChanges();

      expect(host.value).toBeNull();
      expect(host.picked).toEqual([]);
    });
  });

  describe('disabled days', () => {
    it('respects min and max, inclusively', () => {
      host.min.set('2026-03-10');
      host.max.set('2026-03-20');
      fixture.detectChanges();

      expect(day('2026-03-09')!.getAttribute('aria-disabled')).toBe('true');
      expect(day('2026-03-10')!.getAttribute('aria-disabled')).toBeNull();
      expect(day('2026-03-20')!.getAttribute('aria-disabled')).toBeNull();
      expect(day('2026-03-21')!.getAttribute('aria-disabled')).toBe('true');
    });

    it('takes a matcher for the days inside the range that are still unavailable', () => {
      host.dateDisabled.set((iso) => iso === '2026-03-17');
      fixture.detectChanges();

      expect(day('2026-03-17')!.getAttribute('aria-disabled')).toBe('true');
      expect(day('2026-03-16')!.getAttribute('aria-disabled')).toBeNull();
    });

    it('keeps disabled days focusable — a grid you get stuck in is worse', () => {
      host.min.set('2026-03-10');
      fixture.detectChanges();

      // `disabled` would take them out of the tab order *and* out of reach of the
      // arrow keys, leaving the user unable to read the days they cannot pick.
      expect(day('2026-03-09')!.disabled).toBeFalse();
      expect(day('2026-03-09')!.getAttribute('aria-disabled')).toBe('true');
    });

    it('disables the whole grid', () => {
      host.disabled.set(true);
      fixture.detectChanges();

      expect(grid().getAttribute('aria-disabled')).toBe('true');
      expect(day('2026-03-10')!.getAttribute('aria-disabled')).toBe('true');

      day('2026-03-10')!.click();
      expect(host.value).toBeNull();
    });
  });

  describe('month navigation', () => {
    const header = () => query('.ds-calendar__month')!.textContent!.trim();
    const buttons = () =>
      Array.from(fixture.nativeElement.querySelectorAll('ds-button button') as NodeListOf<HTMLButtonElement>);

    it('pages back and forward', () => {
      buttons()[0].click();
      fixture.detectChanges();
      expect(header()).toBe('February 2026');

      buttons()[1].click();
      buttons()[1].click();
      fixture.detectChanges();
      expect(header()).toBe('April 2026');
      // The month is stored as the first of it — "any day inside" means this one.
      expect(host.month).toBe('2026-04-01');
    });

    it('names the arrows', () => {
      expect(buttons()[0].getAttribute('aria-label')).toBe('Previous month');
      expect(buttons()[1].getAttribute('aria-label')).toBe('Next month');
    });

    it('stops at the months where nothing can be picked', () => {
      host.min.set('2026-03-01');
      host.max.set('2026-03-31');
      fixture.detectChanges();

      expect(buttons()[0].disabled).toBeTrue();
      expect(buttons()[1].disabled).toBeTrue();
    });

    it('keeps the day of the month when it can', () => {
      host.month = '2026-01-31';
      host.value = '2026-01-31';
      fixture.detectChanges();

      buttons()[1].click();
      fixture.detectChanges();

      // 31 February does not exist; the focus lands on the 28th, not on 3 March.
      expect(header()).toBe('February 2026');
      expect(tabStop()!.dataset['date']).toBe('2026-02-28');
    });
  });

  describe('the keyboard grid', () => {
    it('is one tab stop, resting on today', () => {
      const focusable = days().filter((button) => button.getAttribute('tabindex') === '0');
      expect(focusable.length).toBe(1);
      expect(focusable[0].dataset['date']).toBe(TODAY);
    });

    it('rests on the selection when there is one', () => {
      host.value = '2026-03-19';
      fixture.detectChanges();
      expect(tabStop()!.dataset['date']).toBe('2026-03-19');
    });

    it('walks the days with the arrows', fakeAsync(() => {
      press('ArrowRight');
      expect(tabStop()!.dataset['date']).toBe('2026-03-05');

      press('ArrowLeft');
      press('ArrowLeft');
      expect(tabStop()!.dataset['date']).toBe('2026-03-03');

      press('ArrowDown');
      expect(tabStop()!.dataset['date']).toBe('2026-03-10');

      press('ArrowUp');
      press('ArrowUp');
      expect(tabStop()!.dataset['date']).toBe('2026-02-24');
      tick();
    }));

    it('crosses the month boundary rather than stopping at it', fakeAsync(() => {
      host.month = '2026-03-01';
      host.value = '2026-03-01';
      fixture.detectChanges();

      press('ArrowLeft');
      tick();

      expect(query('.ds-calendar__month')!.textContent!.trim()).toBe('February 2026');
      expect(tabStop()!.dataset['date']).toBe('2026-02-28');
      // The selection did not move: navigating is not choosing.
      expect(host.value).toBe('2026-03-01');
    }));

    it('moves focus with the tab stop, once the new month has rendered', fakeAsync(() => {
      day(TODAY)!.focus();
      press('ArrowDown');
      tick();

      expect(document.activeElement).toBe(day('2026-03-11'));
    }));

    it('jumps to the ends of the week with Home and End', fakeAsync(() => {
      press('Home');
      // Wednesday the 4th; the week starts on Monday the 2nd.
      expect(tabStop()!.dataset['date']).toBe('2026-03-02');

      press('End');
      expect(tabStop()!.dataset['date']).toBe('2026-03-08');
      tick();
    }));

    it('counts the week from the week start, not from Sunday', fakeAsync(() => {
      host.weekStart.set(0);
      fixture.detectChanges();

      press('Home');
      expect(tabStop()!.dataset['date']).toBe('2026-03-01');
      tick();
    }));

    it('pages the month with PageUp and PageDown', fakeAsync(() => {
      press('PageDown');
      tick();
      expect(query('.ds-calendar__month')!.textContent!.trim()).toBe('April 2026');
      expect(tabStop()!.dataset['date']).toBe('2026-04-04');

      press('PageUp');
      tick();
      expect(query('.ds-calendar__month')!.textContent!.trim()).toBe('March 2026');
    }));

    it('pages the year with Shift', fakeAsync(() => {
      press('PageDown', { shiftKey: true });
      tick();
      expect(query('.ds-calendar__month')!.textContent!.trim()).toBe('March 2027');

      press('PageUp', { shiftKey: true });
      press('PageUp', { shiftKey: true });
      tick();
      expect(query('.ds-calendar__month')!.textContent!.trim()).toBe('March 2025');
    }));

    it('walks onto days it will not let you pick', fakeAsync(() => {
      host.min.set('2026-03-04');
      fixture.detectChanges();

      press('ArrowLeft');
      tick();

      expect(tabStop()!.dataset['date']).toBe('2026-03-03');
      expect(day('2026-03-03')!.getAttribute('aria-disabled')).toBe('true');
      expect(host.value).toBeNull();
    }));

    it('leaves Enter and Space to the button', () => {
      // No preventDefault, no re-implemented activation: it is a <button>.
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      grid().dispatchEvent(event);
      expect(event.defaultPrevented).toBeFalse();
    });

    it('ignores the keyboard when disabled', fakeAsync(() => {
      host.disabled.set(true);
      fixture.detectChanges();

      press('ArrowRight');
      tick();
      expect(tabStop()!.dataset['date']).toBe(TODAY);
    }));
  });

  describe('range paint', () => {
    // Presentation only: the organism owns what a range means. The calendar
    // just tints the band and keeps selecting one day at a time.
    beforeEach(() => {
      host.rangeStart.set('2026-03-04');
      host.rangeEnd.set('2026-03-08');
      fixture.detectChanges();
    });

    it('fills the edges and tints the days between', () => {
      expect(day('2026-03-04')!.classList).toContain('ds-calendar__day--range-start');
      expect(day('2026-03-08')!.classList).toContain('ds-calendar__day--range-end');
      expect(day('2026-03-06')!.classList).toContain('ds-calendar__day--in-range');

      // The edges are edges, not in-between days; the outside is nothing.
      expect(day('2026-03-04')!.classList).not.toContain('ds-calendar__day--in-range');
      expect(day('2026-03-03')!.classList.toString()).not.toContain('range');
      expect(day('2026-03-09')!.classList.toString()).not.toContain('range');
    });

    it('reports the whole band as selected to assistive tech', () => {
      const cell = (iso: IsoDate) => day(iso)!.closest('td')!;
      expect(cell('2026-03-04').getAttribute('aria-selected')).toBe('true');
      expect(cell('2026-03-06').getAttribute('aria-selected')).toBe('true');
      expect(cell('2026-03-08').getAttribute('aria-selected')).toBe('true');
      expect(cell('2026-03-09').getAttribute('aria-selected')).toBe('false');
    });

    it('paints a lone start as a single edge while the end is still being chosen', () => {
      host.rangeEnd.set(null);
      fixture.detectChanges();

      expect(day('2026-03-04')!.classList).toContain('ds-calendar__day--range-start');
      expect(day('2026-03-06')!.classList).not.toContain('ds-calendar__day--in-range');
    });
  });
});
