import { Component, signal } from '@angular/core';
import { TestBed, fakeAsync, tick, type ComponentFixture } from '@angular/core/testing';
import type { IsoDate, IsoTime } from '../../utils';
import { DateRangePickerComponent } from './date-range-picker.component';
import type { DateRange } from './date-range.types';

/** March 2026: starts on a Sunday, and the 4th is a Wednesday. */
const TODAY: IsoDate = '2026-03-04';

@Component({
  standalone: true,
  imports: [DateRangePickerComponent],
  template: `
    <ds-date-range-picker
      label="Billing period"
      [today]="today"
      [withTime]="withTime()"
      [(start)]="start"
      [(end)]="end"
      [(startTime)]="startTime"
      [(endTime)]="endTime"
      (rangeChange)="ranges.push($event)"
      (openChange)="opens.push($event)"
    />
    <button type="button" id="outside">outside</button>
  `,
})
class HostComponent {
  readonly today = TODAY;
  readonly withTime = signal(false);
  start: IsoDate | null = null;
  end: IsoDate | null = null;
  startTime: IsoTime | null = null;
  endTime: IsoTime | null = null;
  ranges: DateRange[] = [];
  opens: boolean[] = [];
}

describe('DateRangePickerComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const trigger = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('ds-date-range-picker > ds-button button');
  const panel = (): HTMLElement | null => fixture.nativeElement.querySelector('.ds-range__panel');
  const grids = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.ds-range__panel [role="grid"]'));
  const monthNames = (): string[] =>
    Array.from(
      fixture.nativeElement.querySelectorAll('.ds-range__panel .ds-calendar__month'),
      (el: Element) => el.textContent!.trim(),
    );
  const day = (iso: IsoDate): HTMLButtonElement | null =>
    fixture.nativeElement.querySelector(`[data-date="${iso}"]`);

  const pointer = (type: string, target: Element) => {
    target.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: 'mouse' }));
    fixture.detectChanges();
  };

  /** What a real browser delivers for a simple press: down, up, then click. */
  const press = (iso: IsoDate) => {
    const button = day(iso)!;
    pointer('pointerdown', button);
    pointer('pointerup', button);
    button.click();
    fixture.detectChanges();
    tick(); // the click-suppression window closes
  };

  const open = () => {
    trigger().click();
    fixture.detectChanges();
    tick(); // placement + focus macrotask
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('is a labelled filter trigger with nothing to say yet', () => {
    // The visible summary plus a hidden prefix: the accessible name reads
    // "Billing period: Choose dates", and ten filters stay distinguishable.
    expect(trigger().textContent).toContain('Billing period:');
    expect(trigger().textContent).toContain('Choose dates');
    expect(trigger().getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(panel()).toBeNull();
  });

  it('opens a named dialog with both months on screen, focus in the first grid', fakeAsync(() => {
    open();

    expect(panel()!.getAttribute('role')).toBe('dialog');
    expect(panel()!.getAttribute('aria-label')).toBe('Billing period');
    expect(trigger().getAttribute('aria-controls')).toBe(panel()!.id);
    expect(grids().length).toBe(2);
    expect(monthNames()).toEqual(['March 2026', 'April 2026']);
    expect(document.activeElement).toBe(day(TODAY));
    expect(host.opens).toEqual([true]);
  }));

  it('selects with two clicks, committing only on the second', fakeAsync(() => {
    open();

    press('2026-03-10');
    // One end is down: the band has a start, the consumer has nothing yet.
    expect(day('2026-03-10')!.classList).toContain('ds-calendar__day--range-start');
    expect(host.start).toBeNull();
    expect(host.ranges).toEqual([]);

    press('2026-03-14');
    expect(host.start).toBe('2026-03-10');
    expect(host.end).toBe('2026-03-14');
    expect(host.ranges.length).toBe(1);
    expect(host.ranges[0]).toEqual(
      jasmine.objectContaining({ start: '2026-03-10', end: '2026-03-14' }),
    );
    // Committed, painted, and still open: times or another look may follow.
    expect(day('2026-03-12')!.classList).toContain('ds-calendar__day--in-range');
    expect(panel()).toBeTruthy();
  }));

  it('selects with one drag: down, across, release', fakeAsync(() => {
    open();

    pointer('pointerdown', day('2026-03-10')!);
    pointer('pointerover', day('2026-03-12')!);
    // The band follows the pointer before anything is committed.
    expect(day('2026-03-11')!.classList).toContain('ds-calendar__day--in-range');
    expect(host.start).toBeNull();

    pointer('pointerover', day('2026-03-14')!);
    pointer('pointerup', day('2026-03-14')!);
    tick();

    expect(host.start).toBe('2026-03-10');
    expect(host.end).toBe('2026-03-14');
    expect(host.ranges.length).toBe(1);
  }));

  it('commits a backwards drag in calendar order', fakeAsync(() => {
    open();

    pointer('pointerdown', day('2026-03-14')!);
    pointer('pointerover', day('2026-03-10')!);
    expect(day('2026-03-12')!.classList).toContain('ds-calendar__day--in-range');

    pointer('pointerup', day('2026-03-10')!);
    tick();

    expect(host.start).toBe('2026-03-10');
    expect(host.end).toBe('2026-03-14');
  }));

  it('drags across the month boundary, because both months are one surface', fakeAsync(() => {
    open();

    pointer('pointerdown', day('2026-03-28')!);
    pointer('pointerover', day('2026-04-03')!);
    expect(day('2026-03-30')!.classList).toContain('ds-calendar__day--in-range');
    expect(day('2026-04-02')!.classList).toContain('ds-calendar__day--in-range');

    pointer('pointerup', day('2026-04-03')!);
    tick();

    expect(host.start).toBe('2026-03-28');
    expect(host.end).toBe('2026-04-03');
  }));

  it('released off the grids, the anchor stays down and the next pick finishes', fakeAsync(() => {
    open();

    pointer('pointerdown', day('2026-03-10')!);
    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    fixture.detectChanges();
    tick();

    expect(host.start).toBeNull();
    press('2026-03-13');
    expect(host.start).toBe('2026-03-10');
    expect(host.end).toBe('2026-03-13');
  }));

  it('keyboard: two Enters on the grid make a range', fakeAsync(() => {
    open();

    // daySelected without any pointer prologue — what Enter delivers.
    day('2026-03-10')!.click();
    fixture.detectChanges();
    expect(day('2026-03-10')!.classList).toContain('ds-calendar__day--range-start');

    day('2026-03-06')!.click();
    fixture.detectChanges();

    // Backwards by keyboard too: still committed in order.
    expect(host.start).toBe('2026-03-06');
    expect(host.end).toBe('2026-03-10');
  }));

  it('Escape abandons the selection in progress before it closes anything', fakeAsync(() => {
    host.start = '2026-03-02';
    host.end = '2026-03-05';
    fixture.detectChanges();

    open();
    press('2026-03-20');
    expect(day('2026-03-20')!.classList).toContain('ds-calendar__day--range-start');

    panel()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    // Still open; the committed range owns the paint again.
    expect(panel()).toBeTruthy();
    expect(day('2026-03-20')!.classList).not.toContain('ds-calendar__day--range-start');
    expect(day('2026-03-02')!.classList).toContain('ds-calendar__day--range-start');
    expect(host.start).toBe('2026-03-02');

    panel()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  }));

  it('closes on an outside click, and on focus leaving', fakeAsync(() => {
    open();
    (fixture.nativeElement.querySelector('#outside') as HTMLElement).click();
    fixture.detectChanges();
    expect(panel()).toBeNull();

    open();
    panel()!.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: fixture.nativeElement.querySelector('#outside'),
      }),
    );
    fixture.detectChanges();
    expect(panel()).toBeNull();
  }));

  it('keeps the two months exactly one apart, whichever header is paged', fakeAsync(() => {
    open();

    const rightCalendar = panel()!.querySelectorAll('ds-calendar')[1];
    rightCalendar
      .querySelector<HTMLButtonElement>('button[aria-label="Previous month"]')!
      .click();
    fixture.detectChanges();

    // Paging the right month back pulls the left one along: never a gap,
    // never the same month twice.
    expect(monthNames()).toEqual(['February 2026', 'March 2026']);

    const leftCalendar = panel()!.querySelectorAll('ds-calendar')[0];
    leftCalendar.querySelector<HTMLButtonElement>('button[aria-label="Next month"]')!.click();
    fixture.detectChanges();

    expect(monthNames()).toEqual(['March 2026', 'April 2026']);
  }));

  it('typed edges commit, swap into order, and page themselves into view', fakeAsync(() => {
    host.start = '2026-03-10';
    host.end = '2026-03-14';
    fixture.detectChanges();
    open();

    const toField = Array.from(
      fixture.nativeElement.querySelectorAll('.ds-range__edge input'),
    )[1] as HTMLInputElement;

    toField.value = '2026-03-02';
    toField.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    toField.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    // An end before the start is a range read backwards, not an error.
    expect(host.start).toBe('2026-03-02');
    expect(host.end).toBe('2026-03-10');
    expect(host.ranges.length).toBe(1);
  }));

  it('asks for time when told to, and the summary carries it', fakeAsync(() => {
    host.withTime.set(true);
    host.start = '2026-03-10';
    host.end = '2026-03-14';
    fixture.detectChanges();
    open();

    const times = Array.from(
      fixture.nativeElement.querySelectorAll('.ds-range__time input'),
    ) as HTMLInputElement[];
    expect(times.length).toBe(2);

    times[0].value = '9:30';
    times[0].dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    times[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(host.startTime).toBe('09:30');
    expect(host.ranges.pop()).toEqual(
      jasmine.objectContaining({ start: '2026-03-10', startTime: '09:30' }),
    );

    tick();
    fixture.detectChanges();
    expect(trigger().textContent).toContain('10 Mar 2026, 09:30');
  }));

  it('clears without closing, and says so', fakeAsync(() => {
    host.start = '2026-03-10';
    host.end = '2026-03-14';
    fixture.detectChanges();
    open();

    const clearButton = Array.from(
      panel()!.querySelectorAll<HTMLButtonElement>('.ds-range__actions button'),
    ).find((b) => b.textContent!.includes('Clear'))!;
    clearButton.click();
    fixture.detectChanges();

    expect(host.start).toBeNull();
    expect(host.end).toBeNull();
    expect(panel()).toBeTruthy();
    expect(host.ranges.pop()).toEqual(
      jasmine.objectContaining({ start: null, end: null }),
    );
  }));

  it('Done closes and hands focus back to the trigger', fakeAsync(() => {
    open();
    const done = Array.from(
      panel()!.querySelectorAll<HTMLButtonElement>('.ds-range__actions button'),
    ).find((b) => b.textContent!.includes('Done'))!;
    done.click();
    fixture.detectChanges();

    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
    expect(host.opens).toEqual([true, false]);
  }));

  it('will not anchor a range on a disabled day', fakeAsync(() => {
    fixture.destroy();

    @Component({
      standalone: true,
      imports: [DateRangePickerComponent],
      template: `
        <ds-date-range-picker label="Stay" [today]="'2026-03-04'" [min]="'2026-03-08'" />
      `,
    })
    class BoundedHost {}

    const bounded = TestBed.createComponent(BoundedHost);
    bounded.detectChanges();
    (bounded.nativeElement.querySelector('ds-button button') as HTMLElement).click();
    bounded.detectChanges();
    tick();
    bounded.detectChanges();

    const early = bounded.nativeElement.querySelector('[data-date="2026-03-05"]') as HTMLElement;
    early.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }));
    bounded.detectChanges();

    expect(
      bounded.nativeElement.querySelector('.ds-calendar__day--range-start'),
    ).toBeNull();
  }));
});
