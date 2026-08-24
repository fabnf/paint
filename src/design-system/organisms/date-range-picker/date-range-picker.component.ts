import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CalendarComponent } from '../../molecules/calendar';
import { DateInputComponent } from '../../molecules/date-input';
import { TimeInputComponent } from '../../molecules/time-input';
import { ButtonComponent, type ButtonSize, type ButtonVariant } from '../../primitives/button';
import {
  addMonths,
  isSameMonth,
  longDateLabel,
  startOfMonth,
  todayIso,
  toUtcDate,
  uniqueId,
  type DateMatcher,
  type DateOrder,
  type IsoDate,
  type IsoTime,
  type WeekStart,
} from '../../utils';
import { orderedRange, type DateRange } from './date-range.types';

export type DateRangePickerAlign = 'start' | 'end';

/**
 * DateRangePicker — two months, one sweep of the pointer.
 *
 * The filter-style organism: a trigger that says what the range is, and an
 * anchored `role="dialog"` in which *both ends are always on screen* — two
 * `<ds-calendar>`s side by side, a typed `<ds-date-input>` for each edge, and a
 * `<ds-time-input>` apiece when asked for time.
 *
 * **Selection is a gesture or two clicks, the user's choice.** Press a day and
 * drag across the grids — across the month boundary too — and release on the
 * other end. Or click the start, watch the band follow the pointer, and click
 * the end. The keyboard does the same with two Enters, and the edges are
 * always committed in calendar order, whichever way round they were given.
 *
 * The overlay contract is the Menu's, the focus story the Dialog's reasoning:
 * opening moves focus into the first grid, Escape cancels a selection in
 * progress before it closes anything, closing restores the trigger, an outside
 * click just closes, and Tab is never held.
 *
 * The range never half-exists for the consumer: `start`/`end` (and the times)
 * only move on a commit — a completed drag, a second click, a typed edge.
 *
 * @example
 * ```html
 * <ds-date-range-picker label="Billing period" [(start)]="from" [(end)]="to" />
 *
 * <!-- Filter with time -->
 * <ds-date-range-picker
 *   label="Created"
 *   [withTime]="true"
 *   [(start)]="from" [(end)]="to"
 *   [(startTime)]="fromTime" [(endTime)]="toTime"
 *   (rangeChange)="applyFilter($event)"
 * />
 * ```
 */
@Component({
  selector: 'ds-date-range-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, CalendarComponent, DateInputComponent, TimeInputComponent],
  host: {
    '(keydown)': 'onKeydown($event)',
    '(focusout)': 'onFocusOut($event)',
    '(document:click)': 'onDocumentClick($event)',
    '(document:pointerup)': 'onDocumentPointerUp()',
  },
  template: `
    <ds-button
      #trigger
      [variant]="variant()"
      [size]="size()"
      iconStart="calendar"
      [iconEnd]="caret() ? 'chevronDown' : null"
      [disabled]="disabled()"
      [ariaExpanded]="open()"
      [ariaHasPopup]="'dialog'"
      [ariaControls]="panelId"
      [active]="open()"
      (clicked)="toggle()"
    >
      <!-- The label rides along invisibly, so ten filters are not all "4 Mar – 12 Mar". -->
      <span class="visually-hidden">{{ label() }}: </span>
      <span class="ds-range__summary" [class.ds-range__summary--empty]="!start()">
        {{ summary() }}
      </span>
    </ds-button>

    @if (open()) {
      <div
        #panel
        class="ds-range__panel"
        role="dialog"
        [id]="panelId"
        [class.ds-range__panel--end]="align() === 'end'"
        [class.ds-range__panel--up]="dropUp()"
        [attr.aria-label]="label()"
      >
        <!-- Both edges, typed. The calendars below are the same two values. -->
        <div class="ds-range__fields">
          <div class="ds-range__edge">
            <ds-date-input
              [value]="start()"
              [trigger]="false"
              [label]="fromLabel()"
              size="sm"
              [order]="order()"
              [separator]="separator()"
              [locale]="locale()"
              [min]="min()"
              [max]="max()"
              [dateDisabled]="dateDisabled()"
              (changed)="onTypedStart($event)"
            />
            @if (withTime()) {
              <ds-time-input
                class="ds-range__time"
                [value]="startTime()"
                [ariaLabel]="fromLabel() + ' time'"
                placeholder="hh:mm"
                size="sm"
                [step]="timeStep()"
                [hour12]="hour12()"
                [locale]="locale()"
                (changed)="onTypedTime('start', $event)"
              />
            }
          </div>

          <span class="ds-range__dash" aria-hidden="true">–</span>

          <div class="ds-range__edge">
            <ds-date-input
              [value]="end()"
              [trigger]="false"
              [label]="toLabel()"
              size="sm"
              [order]="order()"
              [separator]="separator()"
              [locale]="locale()"
              [min]="min()"
              [max]="max()"
              [dateDisabled]="dateDisabled()"
              (changed)="onTypedEnd($event)"
            />
            @if (withTime()) {
              <ds-time-input
                class="ds-range__time"
                [value]="endTime()"
                [ariaLabel]="toLabel() + ' time'"
                placeholder="hh:mm"
                size="sm"
                [step]="timeStep()"
                [hour12]="hour12()"
                [locale]="locale()"
                (changed)="onTypedTime('end', $event)"
              />
            }
          </div>
        </div>

        <!--
          The two months. Pointer handling lives on this wrapper, not in the
          calendars: a drag that starts in March may end in April, and the
          molecules never needed to know a drag was happening at all.
        -->
        <div
          class="ds-range__calendars"
          (pointerdown)="onPointerDown($event)"
          (pointerover)="onPointerOver($event)"
          (pointerup)="onPointerUp($event)"
        >
          <ds-calendar
            #startCalendar
            [value]="calendarValue()"
            [month]="leftMonth()"
            [rangeStart]="paintedStart()"
            [rangeEnd]="paintedEnd()"
            [min]="min()"
            [max]="max()"
            [dateDisabled]="dateDisabled()"
            [weekStart]="weekStart()"
            [locale]="locale()"
            [showWeekNumbers]="showWeekNumbers()"
            [showAdjacentDays]="false"
            [today]="today()"
            (monthChange)="onLeftMonth($event)"
            (daySelected)="onDayChosen($event)"
          />
          <ds-calendar
            [value]="calendarValue()"
            [month]="rightMonth()"
            [rangeStart]="paintedStart()"
            [rangeEnd]="paintedEnd()"
            [min]="min()"
            [max]="max()"
            [dateDisabled]="dateDisabled()"
            [weekStart]="weekStart()"
            [locale]="locale()"
            [showWeekNumbers]="showWeekNumbers()"
            [showAdjacentDays]="false"
            [today]="today()"
            (monthChange)="onRightMonth($event)"
            (daySelected)="onDayChosen($event)"
          />
        </div>

        <div class="ds-range__footer">
          <span class="ds-range__hint">{{ gestureHint() }}</span>
          <span class="ds-range__actions">
            @if (clearable()) {
              <ds-button variant="ghost" size="sm" (clicked)="clear()">{{ clearLabel() }}</ds-button>
            }
            <ds-button variant="primary" size="sm" (clicked)="close(true)">
              {{ doneLabel() }}
            </ds-button>
          </span>
        </div>
      </div>
    }

    <!-- The selection, narrated: the band on screen is invisible to a screen reader. -->
    <span class="visually-hidden" aria-live="polite">{{ announcement() }}</span>
  `,
  styles: `
    :host {
      display: inline-block;
      position: relative;
    }

    .ds-range__summary--empty {
      color: var(--ds-color-text-muted);
    }

    .ds-range__panel {
      position: absolute;
      inset-block-start: calc(100% + var(--ds-space-1_5));
      inset-inline-start: 0;
      z-index: 1070;
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-4);
      padding: var(--ds-space-4);
      background: var(--ds-color-surface);
      border: 1px solid var(--ds-color-border);
      border-radius: var(--ds-radius-lg);
      box-shadow: var(--ds-shadow-lg);
      animation: ds-range-in 120ms ease-out;
      transform-origin: top center;
    }

    .ds-range__panel--end {
      inset-inline-start: auto;
      inset-inline-end: 0;
    }

    .ds-range__panel--up {
      inset-block-start: auto;
      inset-block-end: calc(100% + var(--ds-space-1_5));
      transform-origin: bottom center;
    }

    .ds-range__fields {
      display: flex;
      align-items: flex-end;
      gap: var(--ds-space-3);
    }

    .ds-range__edge {
      display: flex;
      align-items: flex-end;
      gap: var(--ds-space-2);
      flex: 1 1 0;
      min-width: 0;
    }

    .ds-range__edge ds-date-input {
      flex: 1 1 auto;
      min-width: 0;
    }

    .ds-range__time {
      flex: 0 0 5.5rem;
    }

    .ds-range__dash {
      padding-block-end: var(--ds-space-2);
      color: var(--ds-color-text-subtle);
    }

    .ds-range__calendars {
      display: flex;
      gap: var(--ds-space-6);
      /* A drag must select days, not text — and on touch, not scroll the page. */
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
    }

    .ds-range__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ds-space-3);
      border-top: 1px solid var(--ds-color-border);
      padding-block-start: var(--ds-space-3);
    }

    .ds-range__hint {
      font-size: var(--ds-font-size-xs);
      color: var(--ds-color-text-subtle);
    }

    .ds-range__actions {
      display: inline-flex;
      gap: var(--ds-space-2);
    }

    @keyframes ds-range-in {
      from {
        opacity: 0;
        transform: translateY(-0.25rem) scale(0.98);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ds-range__panel {
        animation: none;
      }
    }

    @media (max-width: 40rem) {
      .ds-range__calendars {
        flex-direction: column;
      }

      .ds-range__fields {
        flex-wrap: wrap;
      }
    }
  `,
})
export class DateRangePickerComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The committed edges, `yyyy-mm-dd`. Two-way bindable, always in order. */
  readonly start = model<IsoDate | null>(null);
  readonly end = model<IsoDate | null>(null);
  /** The times on the edges, 24-hour `HH:mm`. Only shown when `withTime`. */
  readonly startTime = model<IsoTime | null>(null);
  readonly endTime = model<IsoTime | null>(null);

  /** Ask for a time on each edge. */
  readonly withTime = input(false);
  /** Minutes per arrow-key step in the time fields. */
  readonly timeStep = input(15);
  /** Twelve-hour display in the time fields. The value stays 24-hour. */
  readonly hour12 = input(false);

  // —— shared date vocabulary, passed through to the molecules ——
  readonly order = input<DateOrder>('ymd');
  readonly separator = input<string>('-');
  readonly locale = input<string>('en-GB');
  readonly min = input<IsoDate | null>(null);
  readonly max = input<IsoDate | null>(null);
  readonly dateDisabled = input<DateMatcher | null>(null);
  readonly weekStart = input<WeekStart | null>(null);
  readonly showWeekNumbers = input(false);
  /** Injectable clock: pass it in tests, and the grids agree with the assertions. */
  readonly today = input<IsoDate>(todayIso());

  // —— the trigger and the dialog ——
  /** What the range is *of*. Names the trigger and the dialog. */
  readonly label = input<string>('Date range');
  readonly placeholder = input<string>('Choose dates');
  readonly variant = input<ButtonVariant>('secondary');
  readonly size = input<ButtonSize>('md');
  readonly caret = input(true);
  readonly disabled = input(false);
  /** Which edge of the trigger the panel lines up with. */
  readonly align = input<DateRangePickerAlign>('start');
  readonly clearable = input(true);
  readonly fromLabel = input<string>('From');
  readonly toLabel = input<string>('To');
  readonly clearLabel = input<string>('Clear');
  readonly doneLabel = input<string>('Done');
  readonly gestureHint = input<string>('Drag across days, or pick a start and an end.');

  /** Emits the whole range on every commit: a gesture, a click, a typed edge, a time. */
  readonly rangeChange = output<DateRange>();
  /** Emits on every open/close. */
  readonly openChange = output<boolean>();

  protected readonly open = signal(false);
  protected readonly dropUp = signal(false);
  protected readonly panelId = uniqueId('ds-date-range');

  /** The first day of the left month; the right calendar is always one ahead. */
  protected readonly leftMonth = signal<IsoDate>(startOfMonth(todayIso()));
  protected readonly rightMonth = computed(() => addMonths(this.leftMonth(), 1));

  // —— the selection in progress ——
  /** The first end the user put down. */
  private readonly anchor = signal<IsoDate | null>(null);
  /** The day under the pointer, while one end is down. */
  private readonly hover = signal<IsoDate | null>(null);
  /** Between the first pick and the second. */
  protected readonly selecting = signal(false);

  protected readonly announcement = signal('');

  private readonly triggerRef = viewChild<ButtonComponent, ElementRef<HTMLElement>>('trigger', {
    read: ElementRef,
  });
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly startCalendarRef = viewChild<CalendarComponent>('startCalendar');

  /** A pointer gesture is in flight. Cosmetic: selection state carries the meaning. */
  private dragging = false;
  /**
   * A pointer interaction already handled this day: swallow the `daySelected`
   * the ensuing click would deliver, so it is not read as another pick.
   */
  private suppressNextPick = false;

  /** What the grids paint: the selection in progress, else the committed range. */
  protected readonly paintedStart = computed(() => this.edges()[0]);
  protected readonly paintedEnd = computed(() => this.edges()[1]);

  private readonly edges = computed<[IsoDate | null, IsoDate | null]>(() => {
    const anchor = this.anchor();
    if (this.selecting() && anchor) {
      const hover = this.hover();
      return hover && hover !== anchor ? orderedRange(anchor, hover) : [anchor, null];
    }
    return [this.start(), this.end()];
  });

  /**
   * What the calendars hold as their own single `value`: the anchor while one
   * end is down — so their internal selection never disagrees with the band —
   * and nothing at all once the range owns the paint.
   */
  protected readonly calendarValue = computed(() =>
    this.selecting() ? this.anchor() : null,
  );

  protected readonly summary = computed(() => {
    const start = this.start();
    if (!start) {
      return this.placeholder();
    }

    const end = this.end();
    const from = this.edgeLabel(start, this.startTime());
    return end ? `${from} – ${this.edgeLabel(end, this.endTime())}` : `${from} – …`;
  });

  private lastOpen = false;

  constructor() {
    effect(() => {
      const open = this.open();
      if (open === this.lastOpen) {
        return;
      }
      this.lastOpen = open;
      this.openChange.emit(open);
    });
  }

  toggle(): void {
    this.open() ? this.close() : this.openPicker();
  }

  openPicker(): void {
    if (this.disabled() || this.open()) {
      return;
    }

    // Show the committed range, or the month the user is living in.
    this.leftMonth.set(startOfMonth(this.start() ?? this.today()));
    this.resetSelection();
    this.open.set(true);

    // The panel is created by change detection, which has not run yet — the
    // Menu's macrotask, for the Menu's reason. Focus goes into the first grid.
    setTimeout(() => {
      this.updatePlacement();
      this.startCalendarRef()?.focus();
    });
  }

  close(restoreFocus = false): void {
    if (!this.open()) {
      return;
    }

    this.resetSelection();
    this.open.set(false);

    if (restoreFocus) {
      this.focusTrigger();
    }
  }

  /** Clears the range without closing: the user may be about to pick another. */
  protected clear(): void {
    this.start.set(null);
    this.end.set(null);
    this.startTime.set(null);
    this.endTime.set(null);
    this.resetSelection();
    this.announcement.set('Range cleared.');
    this.emitRange();
  }

  // —— picking: two clicks, two Enters, or one drag ——

  /** Enter, Space, or the click a simple press delivers. */
  protected onDayChosen(iso: IsoDate): void {
    if (this.suppressNextPick) {
      return;
    }
    this.applyPick(iso);
  }

  protected onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 && event.pointerType === 'mouse') {
      return;
    }

    const day = this.dayFromEvent(event);
    if (!day) {
      return;
    }

    // Touch implicitly captures the pointer to the first day, which would
    // starve the rest of the grid of pointerover. Let it roam.
    const target = event.target as Element;
    if (target.hasPointerCapture?.(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }

    this.dragging = true;

    // Putting a pointer down on a day *is* picking an end; the click that may
    // follow on the same day must not be read as picking it twice.
    if (!this.selecting()) {
      this.begin(day);
      this.swallowClick();
    }
  }

  protected onPointerOver(event: PointerEvent): void {
    if (!this.selecting()) {
      return;
    }
    const day = this.dayFromEvent(event);
    if (day) {
      this.hover.set(day);
    }
  }

  protected onPointerUp(event: PointerEvent): void {
    const day = this.dayFromEvent(event);
    this.dragging = false;

    // Released on another day: the drag was the whole selection.
    if (day && this.selecting() && this.anchor() && day !== this.anchor()) {
      this.commit(this.anchor()!, day);
      this.swallowClick();
    }
    // Released where it started: a plain click. `daySelected` handles it.
  }

  protected onDocumentPointerUp(): void {
    // Released off the grids entirely: the anchor stays down, the band keeps
    // following the pointer, and the next pick finishes the range.
    this.dragging = false;
  }

  private applyPick(iso: IsoDate): void {
    if (this.selecting() && this.anchor()) {
      this.commit(this.anchor()!, iso);
    } else {
      this.begin(iso);
    }
  }

  private begin(iso: IsoDate): void {
    this.anchor.set(iso);
    this.hover.set(iso);
    this.selecting.set(true);
    this.announcement.set(
      `Start of range: ${longDateLabel(iso, this.locale())}. Now choose the end.`,
    );
  }

  private commit(a: IsoDate, b: IsoDate): void {
    const [start, end] = orderedRange(a, b);
    this.start.set(start);
    this.end.set(end);
    this.resetSelection();
    this.announcement.set(
      `Range set: ${longDateLabel(start, this.locale())} to ${longDateLabel(end, this.locale())}.`,
    );
    this.emitRange();
  }

  private resetSelection(): void {
    this.anchor.set(null);
    this.hover.set(null);
    this.selecting.set(false);
    this.dragging = false;
  }

  /** The day button under an event, unless it cannot be picked. */
  private dayFromEvent(event: Event): IsoDate | null {
    const day = (event.target as Element).closest<HTMLElement>('[data-date]');
    if (!day || day.getAttribute('aria-disabled') === 'true') {
      return null;
    }
    return day.dataset['date'] ?? null;
  }

  /** Ignore `daySelected` until the click event finishes its synchronous ride. */
  private swallowClick(): void {
    this.suppressNextPick = true;
    setTimeout(() => (this.suppressNextPick = false));
  }

  // —— the typed edges ——

  protected onTypedStart(value: IsoDate | null): void {
    const end = this.end();
    if (value && end && value > end) {
      // Typed past the other edge: the range stays a range.
      this.start.set(end);
      this.end.set(value);
    } else {
      this.start.set(value);
    }

    if (value) {
      this.showMonth(value);
    }
    this.emitRange();
  }

  protected onTypedEnd(value: IsoDate | null): void {
    const start = this.start();
    if (value && start && value < start) {
      this.end.set(start);
      this.start.set(value);
    } else {
      this.end.set(value);
    }

    if (value) {
      this.showMonth(value);
    }
    this.emitRange();
  }

  protected onTypedTime(edge: 'start' | 'end', value: IsoTime | null): void {
    if (edge === 'start') {
      this.startTime.set(value);
    } else {
      this.endTime.set(value);
    }

    // A one-day range that ends before it starts is a typo, not a time machine.
    const startTime = this.startTime();
    const endTime = this.endTime();
    if (this.start() && this.start() === this.end() && startTime && endTime && endTime < startTime) {
      this.startTime.set(endTime);
      this.endTime.set(startTime);
    }

    this.emitRange();
  }

  // —— the two months, kept one apart ——

  protected onLeftMonth(month: IsoDate | null): void {
    if (month) {
      this.leftMonth.set(startOfMonth(month));
    }
  }

  protected onRightMonth(month: IsoDate | null): void {
    if (month) {
      this.leftMonth.set(addMonths(startOfMonth(month), -1));
    }
  }

  /** Pages the pair so `iso` is on screen, preferring not to move at all. */
  private showMonth(iso: IsoDate): void {
    if (isSameMonth(iso, this.leftMonth()) || isSameMonth(iso, this.rightMonth())) {
      return;
    }
    this.leftMonth.set(startOfMonth(iso));
  }

  // —— overlay plumbing: the Menu's contract ——

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !this.open()) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    // First Escape abandons the selection in progress; the second closes.
    if (this.selecting()) {
      this.resetSelection();
      this.announcement.set('Selection cancelled.');
      return;
    }

    this.close(true);
  }

  protected onFocusOut(event: FocusEvent): void {
    if (!this.open()) {
      return;
    }
    const next = event.relatedTarget as Node | null;
    if (next && !this.host.nativeElement.contains(next)) {
      this.close();
    }
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  private updatePlacement(): void {
    const panel = this.panelRef()?.nativeElement;
    const trigger = this.triggerRef()?.nativeElement;
    if (!panel || !trigger || typeof window === 'undefined') {
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const panelHeight = panel.offsetHeight;
    const spaceBelow = window.innerHeight - triggerRect.bottom;

    this.dropUp.set(spaceBelow < panelHeight + 16 && triggerRect.top > panelHeight + 16);
  }

  private focusTrigger(): void {
    this.triggerRef()?.nativeElement.querySelector('button')?.focus();
  }

  private emitRange(): void {
    this.rangeChange.emit({
      start: this.start(),
      end: this.end(),
      startTime: this.startTime(),
      endTime: this.endTime(),
    });
  }

  /** "4 Mar 2026" (+ ", 09:30" with time) — the trigger's shorthand. */
  private edgeLabel(date: IsoDate, time: IsoTime | null): string {
    const formatted = new Intl.DateTimeFormat(this.locale(), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(toUtcDate(date));

    return this.withTime() && time ? `${formatted}, ${time}` : formatted;
  }
}
