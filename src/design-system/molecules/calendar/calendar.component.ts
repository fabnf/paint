import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { ButtonComponent } from '../../primitives/button';
import {
  addDays,
  addMonths,
  dayOfWeek,
  daysInMonth,
  endOfMonth,
  fromIso,
  isSameMonth,
  isWithin,
  localeWeekStart,
  longDateLabel,
  monthGrid,
  monthLabel,
  startOfMonth,
  todayIso,
  toIso,
  uniqueId,
  weekdayNames,
  type DateMatcher,
  type IsoDate,
  type WeekStart,
} from '../../utils';

/**
 * Calendar — a month of days you can walk with the keyboard.
 *
 * A building block, not a date picker: no popover, no input, no range, no "apply"
 * button. It renders one month, tells you which day was chosen, and lets the
 * caller decide what that means. The picker organism will own the rest.
 *
 * **It is a grid, and it behaves like one.** One tab stop for the whole month;
 * arrows walk the days and cross the month boundary; `Home` / `End` jump to the
 * ends of the week; `PageUp` / `PageDown` change the month, with `Shift` the
 * year. Disabled days stay focusable — a grid you can get stuck in is worse than
 * one that lets you read a day you cannot pick.
 *
 * **A date is not an instant.** `value` is `yyyy-mm-dd`. There is no `Date` in
 * the API, so there is no time zone to shift it by a day.
 *
 * @example
 * ```html
 * <ds-calendar [(value)]="date" [min]="today" (daySelected)="close()" />
 *
 * <!-- Controlled month, for a two-up view or a custom header -->
 * <ds-calendar [(value)]="date" [(month)]="month" [showWeekNumbers]="true" />
 *
 * <!-- No weekends -->
 * <ds-calendar [(value)]="date" [dateDisabled]="isWeekend" />
 * ```
 */
@Component({
  selector: 'ds-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  template: `
    <div class="ds-calendar">
      <div class="ds-calendar__header">
        <ds-button
          variant="ghost"
          size="sm"
          iconStart="chevronLeft"
          [label]="previousMonthLabel()"
          [disabled]="disabled() || !canGoBack()"
          (clicked)="goToMonth(-1)"
        />

        <!--
          The month's name is the grid's accessible name *and* a polite live
          region: paging the month is a change a screen-reader user asked for and
          must hear, without having to leave the grid to find out what happened.
        -->
        <div class="ds-calendar__month" [id]="labelId" aria-live="polite">
          {{ monthName() }}
        </div>

        <ds-button
          variant="ghost"
          size="sm"
          iconStart="chevronRight"
          [label]="nextMonthLabel()"
          [disabled]="disabled() || !canGoForward()"
          (clicked)="goToMonth(1)"
        />
      </div>

      <table
        class="ds-calendar__grid"
        role="grid"
        [attr.aria-labelledby]="labelId"
        [attr.aria-disabled]="disabled() ? 'true' : null"
        (keydown)="onKeydown($event)"
      >
        <thead>
          <tr>
            @if (showWeekNumbers()) {
              <th scope="col" class="ds-calendar__week-head">
                <span aria-hidden="true">#</span>
                <span class="visually-hidden">{{ weekNumberLabel() }}</span>
              </th>
            }
            @for (weekday of weekdays(); track weekday.long) {
              <!-- The short name is for the eye; the long one is what is spoken. -->
              <th scope="col" class="ds-calendar__weekday" [attr.abbr]="weekday.long">
                <span aria-hidden="true">{{ weekday.short }}</span>
                <span class="visually-hidden">{{ weekday.long }}</span>
              </th>
            }
          </tr>
        </thead>

        <tbody>
          @for (week of weeks(); track week.days[0].iso) {
            <tr>
              @if (showWeekNumbers()) {
                <th scope="row" class="ds-calendar__week">{{ week.weekNumber }}</th>
              }

              @for (cell of week.days; track cell.iso) {
                @if (cell.inMonth || showAdjacentDays()) {
                  <td role="gridcell" [attr.aria-selected]="isSelected(cell.iso)">
                    <!--
                      A button, so Enter and Space work without being re-invented,
                      and aria-disabled rather than disabled, so arrow keys can
                      still read a day they cannot pick.
                    -->
                    <button
                      type="button"
                      class="ds-calendar__day"
                      [class.ds-calendar__day--outside]="!cell.inMonth"
                      [class.ds-calendar__day--today]="cell.iso === today()"
                      [class.ds-calendar__day--selected]="cell.iso === value()"
                      [class.ds-calendar__day--range-start]="cell.iso === rangeStart()"
                      [class.ds-calendar__day--range-end]="cell.iso === rangeEnd()"
                      [class.ds-calendar__day--in-range]="isInRange(cell.iso)"
                      [class.ds-calendar__day--disabled]="isDisabled(cell.iso)"
                      [attr.data-date]="cell.iso"
                      [attr.tabindex]="cell.iso === focusedDate() ? 0 : -1"
                      [attr.aria-label]="dayLabel(cell.iso)"
                      [attr.aria-disabled]="isDisabled(cell.iso) ? 'true' : null"
                      [attr.aria-current]="cell.iso === today() ? 'date' : null"
                      (click)="select(cell.iso)"
                      (focus)="focused.set(cell.iso)"
                    >
                      {{ cell.day }}
                    </button>
                  </td>
                } @else {
                  <td role="gridcell" class="ds-calendar__empty"></td>
                }
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    :host {
      display: inline-block;
    }

    .ds-calendar {
      --ds-calendar-day: 2.25rem;

      display: flex;
      flex-direction: column;
      gap: var(--ds-space-2);
      color: var(--ds-color-text);
    }

    .ds-calendar__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ds-space-2);
    }

    .ds-calendar__month {
      flex: 1 1 auto;
      text-align: center;
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-semibold);
      letter-spacing: var(--ds-letter-spacing-wide);
    }

    .ds-calendar__grid {
      border-collapse: collapse;
      table-layout: fixed;
    }

    .ds-calendar__weekday,
    .ds-calendar__week-head {
      width: var(--ds-calendar-day);
      padding-block-end: var(--ds-space-1);
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-semibold);
      color: var(--ds-color-text-subtle);
      text-align: center;
    }

    .ds-calendar__week,
    .ds-calendar__week-head {
      padding-inline-end: var(--ds-space-2);
      font-variant-numeric: tabular-nums;
      font-weight: var(--ds-font-weight-regular);
      color: var(--ds-color-text-subtle);
      font-size: var(--ds-font-size-xs);
      text-align: end;
    }

    /* A cell with no day still holds the row open. */
    .ds-calendar__empty {
      width: var(--ds-calendar-day);
      height: var(--ds-calendar-day);
    }

    .ds-calendar__day {
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--ds-calendar-day);
      height: var(--ds-calendar-day);
      padding: 0;
      border: 1px solid transparent;
      border-radius: var(--ds-radius-md);
      background: none;
      color: inherit;
      font: inherit;
      font-size: var(--ds-font-size-sm);
      font-variant-numeric: tabular-nums;
      cursor: pointer;
      transition:
        background-color 120ms ease,
        color 120ms ease;
    }

    .ds-calendar__day:hover:not(.ds-calendar__day--disabled) {
      background-color: var(--ds-color-surface-sunken);
    }

    .ds-calendar__day:focus-visible {
      outline: 2px solid var(--ds-color-focus-ring);
      outline-offset: -1px;
    }

    .ds-calendar__day--outside {
      color: var(--ds-color-text-subtle);
    }

    /* Today is a ring; the selection is a fill. They can be the same day. */
    .ds-calendar__day--today {
      border-color: var(--ds-color-border-control);
      font-weight: var(--ds-font-weight-semibold);
    }

    .ds-calendar__day--selected,
    .ds-calendar__day--selected:hover {
      background-color: var(--ds-color-primary);
      border-color: var(--ds-color-primary);
      color: var(--ds-color-on-primary);
      font-weight: var(--ds-font-weight-semibold);
    }

    /*
     * The range paint: edges filled like a selection, the days between tinted
     * and squared so they read as one band. Presentation only — what a range
     * *means* is the organism's business.
     */
    .ds-calendar__day--in-range,
    .ds-calendar__day--in-range:hover:not(.ds-calendar__day--disabled) {
      background-color: var(--ds-color-primary-muted);
      border-radius: 0;
    }

    .ds-calendar__day--range-start,
    .ds-calendar__day--range-start:hover,
    .ds-calendar__day--range-end,
    .ds-calendar__day--range-end:hover {
      background-color: var(--ds-color-primary);
      border-color: var(--ds-color-primary);
      color: var(--ds-color-on-primary);
      font-weight: var(--ds-font-weight-semibold);
    }

    /* An edge keeps its outer corners; a one-day range keeps all four. */
    .ds-calendar__day--range-start {
      border-start-end-radius: 0;
      border-end-end-radius: 0;
    }

    .ds-calendar__day--range-end {
      border-start-start-radius: 0;
      border-end-start-radius: 0;
    }

    .ds-calendar__day--range-start.ds-calendar__day--range-end {
      border-radius: var(--ds-radius-md);
    }

    .ds-calendar__day--disabled {
      color: var(--ds-color-text-subtle);
      cursor: not-allowed;
      text-decoration: line-through;
      text-decoration-thickness: 1px;
      opacity: 0.65;
    }

    .ds-calendar__day--disabled.ds-calendar__day--selected {
      opacity: 1;
    }

    @media (forced-colors: active) {
      .ds-calendar__day--in-range {
        outline: 1px dotted Highlight;
        outline-offset: -3px;
      }

      .ds-calendar__day--selected,
      .ds-calendar__day--range-start,
      .ds-calendar__day--range-end {
        border-color: Highlight;
        outline: 2px solid Highlight;
        outline-offset: -3px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ds-calendar__day {
        transition: none;
      }
    }
  `,
})
export class CalendarComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The selected day, `yyyy-mm-dd`. Two-way bindable. */
  readonly value = model<IsoDate | null>(null);
  /**
   * The month on screen, as any day inside it. Bind it for a controlled header,
   * a two-up view, or to page the calendar from outside.
   */
  readonly month = model<IsoDate | null>(null);
  /** Earliest and latest selectable day, inclusive. */
  readonly min = input<IsoDate | null>(null);
  readonly max = input<IsoDate | null>(null);
  /** Days inside the range that still cannot be picked — weekends, holidays, a booked room. */
  readonly dateDisabled = input<DateMatcher | null>(null);
  readonly disabled = input(false);
  /** `undefined` asks the locale. `0` is Sunday. */
  readonly weekStart = input<WeekStart | null>(null);
  readonly locale = input<string>('en-GB');
  /** The ISO-8601 week number, in a leading column. */
  readonly showWeekNumbers = input(false);
  /** The leading and trailing days of the adjacent months. Picking one pages the calendar. */
  readonly showAdjacentDays = input(true);
  /** Always six rows, so the page below the calendar does not move as it pages. */
  readonly fixedWeeks = input(true);
  /** Injectable clock: the one thing a calendar cannot be tested without. */
  readonly today = input<IsoDate>(todayIso());

  /**
   * Paints a range onto the grid — edges filled, the days between tinted.
   * Presentation only: the calendar still selects one day at a time, and what
   * a range means (committed, previewed, dragged) is the caller's business.
   * Pass the edges in order; a lone `rangeStart` paints a single edge.
   */
  readonly rangeStart = input<IsoDate | null>(null);
  readonly rangeEnd = input<IsoDate | null>(null);

  readonly previousMonthLabel = input<string>('Previous month');
  readonly nextMonthLabel = input<string>('Next month');
  readonly weekNumberLabel = input<string>('Week');

  /** Emits the day the user picked. Never fires for a disabled day. */
  readonly daySelected = output<IsoDate>();

  protected readonly labelId = uniqueId('ds-calendar-label');

  /** The day the grid's single tab stop sits on. */
  protected readonly focused = signal<IsoDate | null>(null);

  /** Month on screen: the bound one, else the value's, else today's. */
  protected readonly displayMonth = computed(() =>
    startOfMonth(this.month() ?? this.value() ?? this.today()),
  );

  protected readonly resolvedWeekStart = computed<WeekStart>(
    () => this.weekStart() ?? localeWeekStart(this.locale()),
  );

  protected readonly weeks = computed(() =>
    monthGrid(this.displayMonth(), this.resolvedWeekStart(), this.fixedWeeks()),
  );

  protected readonly weekdays = computed(() => {
    const short = weekdayNames(this.locale(), this.resolvedWeekStart(), 'short');
    const long = weekdayNames(this.locale(), this.resolvedWeekStart(), 'long');
    return short.map((name, index) => ({ short: name, long: long[index] }));
  });

  protected readonly monthName = computed(() => monthLabel(this.displayMonth(), this.locale()));

  /**
   * The roving tab stop: the selection, else today, else the first of the month —
   * and never a day that is not on screen.
   */
  protected readonly focusedDate = computed(() => {
    const month = this.displayMonth();
    const candidate = this.focused() ?? this.value() ?? this.today();
    return this.inGrid(candidate) ? candidate : this.sameDayIn(month, candidate);
  });

  protected readonly canGoBack = computed(() => {
    const min = this.min();
    return !min || min < startOfMonth(this.displayMonth());
  });

  protected readonly canGoForward = computed(() => {
    const max = this.max();
    return !max || max > endOfMonth(this.displayMonth());
  });

  protected dayLabel(iso: IsoDate): string {
    return longDateLabel(iso, this.locale());
  }

  /** Strictly between the painted edges. The edges carry their own classes. */
  protected isInRange(iso: IsoDate): boolean {
    const start = this.rangeStart();
    const end = this.rangeEnd();
    return !!start && !!end && iso > start && iso < end;
  }

  /** What aria-selected reports: the value, or any day of the painted range. */
  protected isSelected(iso: IsoDate): boolean {
    if (iso === this.value() || iso === this.rangeStart() || iso === this.rangeEnd()) {
      return true;
    }
    return this.isInRange(iso);
  }

  protected isDisabled(iso: IsoDate): boolean {
    if (this.disabled() || !isWithin(iso, this.min(), this.max())) {
      return true;
    }
    return this.dateDisabled()?.(iso) ?? false;
  }

  /** Moves focus to the day the grid is resting on. For the overlay that opens it. */
  focus(): void {
    this.focusDay(this.focusedDate());
  }

  protected select(iso: IsoDate): void {
    if (this.isDisabled(iso)) {
      return;
    }

    // Read the month before the value moves it: an unbound `month` follows the
    // value, and the comparison below would then always say "same month".
    const shown = this.displayMonth();

    this.value.set(iso);
    this.focused.set(iso);

    // Picking a trailing day of the next month pages the calendar to it, so the
    // selection the user just made is still on screen.
    if (!isSameMonth(iso, shown)) {
      this.month.set(startOfMonth(iso));
    }

    this.daySelected.emit(iso);
  }

  protected goToMonth(delta: number): void {
    const next = addMonths(this.displayMonth(), delta);
    this.month.set(next);
    this.focused.set(this.sameDayIn(next, this.focusedDate()));
  }

  /**
   * The ARIA grid pattern, on a calendar.
   *
   * Arrows cross the month boundary rather than stopping at it, which is what
   * makes a month grid navigable at all — the 1st is a Wednesday and the user
   * wants the Monday before it.
   */
  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }

    const current = this.focusedDate();
    let next: IsoDate | null = null;

    switch (event.key) {
      case 'ArrowLeft':
        next = addDays(current, -1);
        break;
      case 'ArrowRight':
        next = addDays(current, 1);
        break;
      case 'ArrowUp':
        next = addDays(current, -7);
        break;
      case 'ArrowDown':
        next = addDays(current, 7);
        break;
      case 'Home':
        next = addDays(current, -this.indexInWeek(current));
        break;
      case 'End':
        next = addDays(current, 6 - this.indexInWeek(current));
        break;
      case 'PageUp':
        next = addMonths(current, event.shiftKey ? -12 : -1);
        break;
      case 'PageDown':
        next = addMonths(current, event.shiftKey ? 12 : 1);
        break;
      default:
        return;
    }

    event.preventDefault();
    this.moveFocusTo(next);
  }

  private moveFocusTo(iso: IsoDate): void {
    this.focused.set(iso);

    if (!isSameMonth(iso, this.displayMonth())) {
      this.month.set(startOfMonth(iso));
    }

    // The button may not exist until the new month has rendered.
    setTimeout(() => this.focusDay(iso));
  }

  private focusDay(iso: IsoDate): void {
    this.host.nativeElement
      .querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)
      ?.focus();
  }

  /** Is this day one of the cells actually on screen? */
  private inGrid(iso: IsoDate): boolean {
    if (isSameMonth(iso, this.displayMonth())) {
      return true;
    }
    return (
      this.showAdjacentDays() &&
      this.weeks().some((week) => week.days.some((day) => day.iso === iso))
    );
  }

  /** The same day number in another month, clamped to its length. */
  private sameDayIn(month: IsoDate, source: IsoDate): IsoDate {
    const target = fromIso(month)!;
    const day = fromIso(source)!.day;
    return toIso({
      year: target.year,
      month: target.month,
      day: Math.min(day, daysInMonth(target.year, target.month)),
    });
  }

  /** 0–6, counted from the week's first day — not from Sunday. */
  private indexInWeek(iso: IsoDate): number {
    return (dayOfWeek(iso) - this.resolvedWeekStart() + 7) % 7;
  }
}
