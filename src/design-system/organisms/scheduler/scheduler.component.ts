import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { EmptyStateComponent } from '../../molecules/empty-state';
import { BadgeComponent } from '../../primitives/badge';
import { ButtonComponent } from '../../primitives/button';
import { SkeletonComponent } from '../../primitives/skeleton';
import { cx } from '../../primitives/primitives.types';
import { toneClass } from '../../primitives/tone.types';
import {
  addDays,
  longDateLabel,
  monthGrid,
  monthLabel,
  todayIso,
  weekdayNames,
  type IsoDate,
  type WeekStart,
} from '../../utils/date';
import { uniqueId } from '../../utils';
import { DrawerComponent } from '../drawer/drawer.component';
import {
  dateOf,
  daysBetween,
  eventsOn,
  placeDay,
  rangeFor,
  stepAnchor,
  timeOf,
  type SchedulerEvent,
  type SchedulerEventEvent,
  type SchedulerRange,
  type SchedulerView,
} from './scheduler.types';

/**
 * Scheduler — the views a date picker is not.
 *
 * `<ds-date-picker>` answers "which day"; this answers "what is happening". Four
 * views over one array of host-owned events — a month grid, a week with real
 * overlap packing, a single day, and an agenda — with one range navigator above
 * them and Paint's detail below: an event opens in a `<ds-drawer>` (the Dialog's
 * focus trap, `inert` page, `Escape`, focus restore) or in the host's own slot.
 *
 * **Overlaps stay readable.** Timed events are packed into columns by
 * {@link placeDay}: events that touch share the width of the day rather than
 * covering each other, because an event hidden behind another is an event nobody
 * goes to.
 *
 * **Focus and selection.** The grid is one tab stop with an
 * `aria-activedescendant` cursor over *days*: arrows move a day (`↑`/`↓` a week
 * in month view), `Home`/`End` go to the ends of the week, and `Enter` opens the
 * focused day's first event — or reports the day when it has none. The agenda is
 * a plain list of event buttons, because there is nothing to navigate but the
 * events themselves. Selecting a day (`[(date)]`) and opening an event are
 * different things, and both are reported.
 *
 * No calendar API, ever: the host owns the events, and the tests do too.
 *
 * @example
 * ```html
 * <ds-scheduler
 *   [events]="events()"
 *   [(view)]="view"
 *   [(date)]="anchor"
 *   [loading]="loading()"
 *   (rangeChange)="fetch($event)"
 *   (eventOpen)="track($event.event)"
 * />
 * ```
 */
@Component({
  selector: 'ds-scheduler',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    BadgeComponent,
    EmptyStateComponent,
    SkeletonComponent,
    DrawerComponent,
    NgTemplateOutlet,
  ],
  template: `
    <div class="ds-scheduler">
      <!-- ——— The navigator: one range control for every view ——— -->
      <div class="ds-scheduler__bar">
        <div class="ds-scheduler__range">
          <ds-button
            variant="ghost"
            size="sm"
            iconStart="chevronLeft"
            [label]="previousLabel()"
            (clicked)="step(-1)"
          />
          <ds-button variant="ghost" size="sm" iconStart="chevronRight" [label]="nextLabel()" (clicked)="step(1)" />
          <ds-button variant="secondary" size="sm" (clicked)="goToday()">{{ todayLabel() }}</ds-button>
          <!-- The one thing every calendar must say: where you are. -->
          <p class="ds-scheduler__title" role="status">{{ rangeLabel() }}</p>
        </div>

        <div class="ds-scheduler__views" role="group" [attr.aria-label]="viewsLabel()">
          @for (option of views(); track option) {
            <ds-button
              size="sm"
              [variant]="view() === option ? 'primary' : 'outline'"
              [ariaPressed]="view() === option"
              (clicked)="setView(option)"
            >
              {{ viewLabel(option) }}
            </ds-button>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="ds-scheduler__loading" role="status" [attr.aria-label]="loadingLabel()">
          @for (row of skeletonRows; track row) {
            <ds-skeleton variant="rect" height="3rem" radius="md" />
          }
        </div>
      } @else if (!rangeEvents().length && view() === 'agenda') {
        <ds-empty-state
          icon="calendar"
          [title]="emptyTitle()"
          [description]="emptyDescription()"
          [live]="true"
        />
      } @else {
        @switch (view()) {
          @case ('month') {
            <div
              class="ds-scheduler__month"
              role="grid"
              [attr.aria-label]="rangeLabel()"
              [attr.aria-activedescendant]="cursorId()"
              tabindex="0"
              (keydown)="onKeydown($event)"
            >
              <div class="ds-scheduler__weekdays" role="row">
                @for (name of weekdays(); track name) {
                  <span class="ds-scheduler__weekday" role="columnheader">{{ name }}</span>
                }
              </div>
              @for (week of weeks(); track week.weekNumber) {
                <div class="ds-scheduler__week" role="row">
                  @for (day of week.days; track day.iso) {
                    <div
                      class="ds-scheduler__day"
                      [class.ds-scheduler__day--outside]="!day.inMonth"
                      [class.ds-scheduler__day--today]="day.iso === today()"
                      [class.ds-scheduler__day--cursor]="day.iso === cursor()"
                      [id]="dayId(day.iso)"
                      role="gridcell"
                      [attr.aria-label]="dayLabel(day.iso)"
                      [attr.aria-selected]="day.iso === date()"
                      (click)="selectDay(day.iso)"
                    >
                      <span class="ds-scheduler__daynum">{{ day.day }}</span>
                      @for (event of eventsFor(day.iso).slice(0, 3); track event.id) {
                        <button
                          type="button"
                          [class]="chipClasses(event)"
                          tabindex="-1"
                          (click)="openEvent($event, event, day.iso)"
                        >
                          @if (!event.allDay) {
                            <span class="ds-scheduler__chip-time">{{ timeOf(event.start) }}</span>
                          }
                          <span class="ds-scheduler__chip-title">{{ event.title }}</span>
                        </button>
                      }
                      @if (eventsFor(day.iso).length > 3) {
                        <span class="ds-scheduler__more">+{{ eventsFor(day.iso).length - 3 }} more</span>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }

          @case ('agenda') {
            <ul class="ds-scheduler__agenda" [attr.aria-label]="rangeLabel()">
              @for (day of daysWithEvents(); track day) {
                <li class="ds-scheduler__agenda-day">
                  <p class="ds-scheduler__agenda-date">{{ dayLabel(day) }}</p>
                  @for (event of eventsFor(day); track event.id) {
                    <button
                      type="button"
                      [class]="rowClasses(event)"
                      (click)="openEvent($event, event, day)"
                    >
                      <span class="ds-scheduler__agenda-time">
                        {{ event.allDay ? allDayLabel() : timeOf(event.start) }}
                      </span>
                      <span class="ds-scheduler__agenda-title">{{ event.title }}</span>
                      @if (event.calendar) {
                        <ds-badge [tone]="event.tone ?? 'primary'" [pill]="true">{{ event.calendar }}</ds-badge>
                      }
                    </button>
                  }
                </li>
              }
            </ul>
          }

          @default {
            <!-- Week and day: the same column grid, one column or seven. -->
            <div
              class="ds-scheduler__timed"
              role="grid"
              [attr.aria-label]="rangeLabel()"
              [attr.aria-activedescendant]="cursorId()"
              tabindex="0"
              (keydown)="onKeydown($event)"
            >
              <div class="ds-scheduler__columns" role="row">
                @for (day of rangeDays(); track day) {
                  <div
                    class="ds-scheduler__column"
                    [class.ds-scheduler__column--today]="day === today()"
                    [class.ds-scheduler__day--cursor]="day === cursor()"
                    [id]="dayId(day)"
                    role="gridcell"
                    [attr.aria-label]="dayLabel(day)"
                    [attr.aria-selected]="day === date()"
                    (click)="selectDay(day)"
                  >
                    <p class="ds-scheduler__column-head">{{ dayHeading(day) }}</p>

                    @for (event of allDayOn(day); track event.id) {
                      <button type="button" [class]="chipClasses(event)" tabindex="-1" (click)="openEvent($event, event, day)">
                        <span class="ds-scheduler__chip-title">{{ event.title }}</span>
                      </button>
                    }

                    <div class="ds-scheduler__canvas">
                      @for (placed of placedOn(day); track placed.event.id) {
                        <button
                          type="button"
                          [class]="blockClasses(placed.event)"
                          tabindex="-1"
                          [style.top.%]="topPercent(placed.startMinute)"
                          [style.height.%]="heightPercent(placed.duration)"
                          [style.left.%]="(placed.column / placed.columns) * 100"
                          [style.width.%]="100 / placed.columns"
                          (click)="openEvent($event, placed.event, day)"
                        >
                          <span class="ds-scheduler__chip-time">{{ timeOf(placed.event.start) }}</span>
                          <span class="ds-scheduler__chip-title">{{ placed.event.title }}</span>
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        }

        @if (!rangeEvents().length && view() !== 'agenda') {
          <p class="ds-scheduler__none" role="status">{{ emptyTitle() }}</p>
        }
      }
    </div>

    <!-- Paint's detail: the Drawer, unless the host wants the slot instead. -->
    @if (detail()) {
      <ds-drawer
        [open]="detailOpen()"
        [title]="openedEvent()?.title ?? detailLabel()"
        [description]="openedEvent() ? eventWhen(openedEvent()!) : ''"
        size="md"
        (closed)="detailOpen.set(false)"
      >
        @if (openedEvent()) {
          <ng-container
            [ngTemplateOutlet]="detailBody"
            [ngTemplateOutletContext]="{ $implicit: openedEvent() }"
          />
        }
      </ds-drawer>
    }

    <ng-template #detailBody let-event>
      <dl class="ds-scheduler__detail">
        <dt>{{ whenLabel() }}</dt>
        <dd>{{ eventWhen(event) }}</dd>
        @if (event.location) {
          <dt>{{ whereLabel() }}</dt>
          <dd>{{ event.location }}</dd>
        }
        @if (event.calendar) {
          <dt>{{ calendarLabel() }}</dt>
          <dd><ds-badge [tone]="event.tone ?? 'primary'" [pill]="true">{{ event.calendar }}</ds-badge></dd>
        }
        @if (event.description) {
          <dt>{{ aboutLabel() }}</dt>
          <dd>{{ event.description }}</dd>
        }
      </dl>
      <ng-content select="[dsSchedulerDetail]" />
    </ng-template>
  `,
  styles: `
    :host {
      display: block;
    }

    .ds-scheduler {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-4);
    }

    .ds-scheduler__bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--ds-space-3);
    }

    .ds-scheduler__range,
    .ds-scheduler__views {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ds-space-2);
    }

    .ds-scheduler__title {
      margin: 0 0 0 var(--ds-space-2);
      font-size: var(--ds-font-size-md);
      font-weight: var(--ds-font-weight-semibold);
      color: var(--ds-color-text);
    }

    .ds-scheduler__month,
    .ds-scheduler__timed {
      border: 1px solid var(--ds-color-border);
      border-radius: var(--ds-radius-lg);
      overflow: hidden;
      background-color: var(--ds-color-surface);
    }

    .ds-scheduler__month:focus,
    .ds-scheduler__timed:focus {
      outline: none;
    }

    .ds-scheduler__month:focus-visible .ds-scheduler__day--cursor,
    .ds-scheduler__timed:focus-visible .ds-scheduler__day--cursor {
      outline: 2px solid var(--ds-color-focus-ring);
      outline-offset: -2px;
    }

    .ds-scheduler__weekdays,
    .ds-scheduler__week {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
    }

    .ds-scheduler__weekday {
      padding: var(--ds-space-2);
      border-block-end: 1px solid var(--ds-color-border);
      background-color: var(--ds-color-surface-sunken);
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-semibold);
      letter-spacing: var(--ds-letter-spacing-wide);
      text-transform: uppercase;
      color: var(--ds-color-text-subtle);
      text-align: center;
    }

    .ds-scheduler__day {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-1);
      min-height: 6rem;
      padding: var(--ds-space-1_5);
      border-block-end: 1px solid var(--ds-color-border);
      border-inline-end: 1px solid var(--ds-color-border);
      cursor: pointer;
    }

    .ds-scheduler__day--outside {
      background-color: var(--ds-color-surface-sunken);
      color: var(--ds-color-text-subtle);
    }

    .ds-scheduler__day--today .ds-scheduler__daynum {
      background-color: var(--ds-color-primary);
      color: var(--ds-color-on-primary);
    }

    .ds-scheduler__daynum {
      align-self: flex-start;
      min-width: 1.5rem;
      padding: 0.0625rem var(--ds-space-1);
      border-radius: var(--ds-radius-full);
      font-size: var(--ds-font-size-xs);
      font-variant-numeric: tabular-nums;
      text-align: center;
    }

    .ds-scheduler__chip,
    .ds-scheduler__block,
    .ds-scheduler__row {
      display: flex;
      align-items: center;
      gap: var(--ds-space-1);
      /* The tone is the edge and the tint; the text keeps the body colour, so a
         12px label is readable on every tone in both themes. */
      border: 1px solid color-mix(in srgb, var(--ds-tone-solid) 45%, transparent);
      border-inline-start: 3px solid var(--ds-tone-solid);
      border-radius: var(--ds-radius-sm);
      background-color: var(--ds-tone-bg);
      color: var(--ds-color-text);
      font-size: var(--ds-font-size-xs);
      text-align: start;
      cursor: pointer;
    }

    .ds-scheduler__chip {
      padding: 0.0625rem var(--ds-space-1);
      overflow: hidden;
    }

    .ds-scheduler__chip-time {
      flex-shrink: 0;
      font-family: var(--ds-font-mono);
      font-variant-numeric: tabular-nums;
      color: var(--ds-color-text-muted);
    }

    .ds-scheduler__chip-title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: var(--ds-font-weight-medium);
    }

    .ds-scheduler__more {
      font-size: var(--ds-font-size-xs);
      color: var(--ds-color-text-subtle);
    }

    .ds-scheduler__columns {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: minmax(0, 1fr);
    }

    .ds-scheduler__column {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-1);
      padding: var(--ds-space-1_5);
      border-inline-end: 1px solid var(--ds-color-border);
      cursor: pointer;
    }

    .ds-scheduler__column--today {
      background-color: var(--ds-color-primary-muted);
    }

    .ds-scheduler__column-head {
      margin: 0;
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-semibold);
      color: var(--ds-color-text-muted);
      text-align: center;
    }

    /* The day, as a day: 24 hours of height, events placed on it. */
    .ds-scheduler__canvas {
      position: relative;
      height: 32rem;
      border-radius: var(--ds-radius-sm);
      /* One line per visible hour, so a block's height reads as a duration. */
      background-image: repeating-linear-gradient(
        to bottom,
        var(--ds-color-border) 0 1px,
        transparent 1px calc(100% / 14)
      );
    }

    .ds-scheduler__block {
      position: absolute;
      flex-direction: column;
      align-items: flex-start;
      gap: 0;
      min-height: 1.75rem;
      padding: 0.125rem var(--ds-space-1);
      line-height: var(--ds-line-height-snug);
      overflow: hidden;
    }

    .ds-scheduler__agenda {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-4);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .ds-scheduler__agenda-day {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-1_5);
    }

    .ds-scheduler__agenda-date {
      margin: 0;
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-semibold);
      letter-spacing: var(--ds-letter-spacing-wide);
      text-transform: uppercase;
      color: var(--ds-color-text-subtle);
    }

    .ds-scheduler__row {
      gap: var(--ds-space-3);
      padding: var(--ds-space-2) var(--ds-space-3);
      font-size: var(--ds-font-size-sm);
    }

    .ds-scheduler__agenda-time {
      flex-shrink: 0;
      width: 3.5rem;
      font-family: var(--ds-font-mono);
      font-variant-numeric: tabular-nums;
    }

    .ds-scheduler__agenda-title {
      flex: 1 1 auto;
      font-weight: var(--ds-font-weight-medium);
    }

    .ds-scheduler__none {
      margin: 0;
      padding: var(--ds-space-3);
      border: 1px dashed var(--ds-color-border);
      border-radius: var(--ds-radius-md);
      font-size: var(--ds-font-size-sm);
      color: var(--ds-color-text-muted);
      text-align: center;
    }

    .ds-scheduler__loading {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-2);
    }

    .ds-scheduler__detail {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: var(--ds-space-2) var(--ds-space-4);
      margin: 0;
      font-size: var(--ds-font-size-sm);
    }

    .ds-scheduler__detail dt {
      font-weight: var(--ds-font-weight-semibold);
      color: var(--ds-color-text-muted);
    }

    .ds-scheduler__detail dd {
      margin: 0;
    }
  `,
})
export class SchedulerComponent<T = unknown> {
  readonly events = input<readonly SchedulerEvent<T>[]>([]);
  /** Which view. Two-way, so a host can put it in the URL. */
  readonly view = model<SchedulerView>('month');
  /** The date the view is anchored on — and the selected day. */
  readonly date = model<IsoDate>(todayIso());
  /** Which views to offer. */
  readonly views = input<readonly SchedulerView[]>(['month', 'week', 'agenda']);
  readonly loading = input(false);
  /** Open an event in Paint's own drawer. `false` leaves it to the host. */
  readonly detail = input(true);
  /**
   * The hours the day canvas shows. A calendar that draws all twenty-four makes
   * a one-hour meeting seven pixels tall, which is a block nobody can read.
   */
  readonly dayStartHour = input(7);
  readonly dayEndHour = input(21);
  readonly weekStart = input<WeekStart>(1);
  readonly locale = input<string>('en-GB');
  /** What "today" is. Injectable, so a test is not a hostage to the clock. */
  readonly today = input<IsoDate>(todayIso());

  readonly previousLabel = input<string>('Previous range');
  readonly nextLabel = input<string>('Next range');
  readonly todayLabel = input<string>('Today');
  readonly viewsLabel = input<string>('Views');
  readonly loadingLabel = input<string>('Loading events…');
  readonly emptyTitle = input<string>('Nothing scheduled');
  readonly emptyDescription = input<string>('This range has no events.');
  readonly allDayLabel = input<string>('All day');
  readonly detailLabel = input<string>('Event');
  readonly whenLabel = input<string>('When');
  readonly whereLabel = input<string>('Where');
  readonly calendarLabel = input<string>('Calendar');
  readonly aboutLabel = input<string>('About');

  /** The visible range changed — a step, a view switch, a jump to today. */
  readonly rangeChange = output<SchedulerRange>();
  /** An event was opened. */
  readonly eventOpen = output<SchedulerEventEvent<T>>();
  /** A day was chosen (clicked, or `Enter` with nothing on it). */
  readonly daySelect = output<IsoDate>();

  protected readonly skeletonRows = [0, 1, 2, 3];
  private readonly instance = uniqueId('ds-scheduler');

  /** The day the keyboard is resting on. Not the same thing as the selection. */
  protected readonly cursor = signal<IsoDate>(this.date());
  protected readonly openedEvent = signal<SchedulerEvent<T> | null>(null);
  protected readonly detailOpen = signal(false);

  protected readonly timeOf = timeOf;

  protected readonly range = computed(() => rangeFor(this.view(), this.date(), this.weekStart()));

  protected readonly rangeDays = computed(() => {
    const range = this.range();
    return daysBetween(range.start, range.end);
  });

  protected readonly weeks = computed(() => monthGrid(this.date(), this.weekStart()));
  protected readonly weekdays = computed(() => weekdayNames(this.locale(), this.weekStart(), 'short'));

  protected readonly rangeEvents = computed(() => {
    const days = new Set(this.rangeDays());
    return this.events().filter((event) => {
      const start = dateOf(event.start);
      const end = event.end ? dateOf(event.end) : start;
      return [...days].some((day) => day >= start && day <= end);
    });
  });

  protected readonly daysWithEvents = computed(() =>
    this.rangeDays().filter((day) => this.eventsFor(day).length),
  );

  protected readonly rangeLabel = computed(() => {
    const range = this.range();
    switch (this.view()) {
      case 'month':
        return monthLabel(this.date(), this.locale());
      case 'day':
        return longDateLabel(this.date(), this.locale());
      default:
        return `${longDateLabel(range.start, this.locale())} – ${longDateLabel(range.end, this.locale())}`;
    }
  });

  protected readonly cursorId = computed(() => this.dayId(this.cursor()));

  constructor() {
    // The cursor follows the range: paging to March must not leave it in February.
    effect(() => {
      const range = this.range();
      const cursor = this.cursor();
      if (cursor < range.start || cursor > range.end) {
        this.cursor.set(this.date());
      }
    });
  }

  protected dayId(iso: IsoDate): string {
    return `${this.instance}-day-${iso}`;
  }

  protected dayLabel(iso: IsoDate): string {
    const count = this.eventsFor(iso).length;
    const day = longDateLabel(iso, this.locale());
    return count ? `${day}, ${count} ${count === 1 ? 'event' : 'events'}` : day;
  }

  protected dayHeading(iso: IsoDate): string {
    return longDateLabel(iso, this.locale()).replace(/,?\s*\d{4}$/, '');
  }

  protected eventsFor(iso: IsoDate): SchedulerEvent<T>[] {
    return eventsOn(this.events(), iso);
  }

  protected allDayOn(iso: IsoDate): SchedulerEvent<T>[] {
    return this.eventsFor(iso).filter((event) => event.allDay);
  }

  protected placedOn(iso: IsoDate) {
    return placeDay(this.eventsFor(iso));
  }

  /** Where a minute sits on the visible day, as a percentage. */
  protected topPercent(startMinute: number): number {
    const from = this.dayStartHour() * 60;
    const window = Math.max(60, this.dayEndHour() * 60 - from);
    return Math.min(Math.max(((startMinute - from) / window) * 100, 0), 98);
  }

  protected heightPercent(duration: number): number {
    const window = Math.max(60, this.dayEndHour() * 60 - this.dayStartHour() * 60);
    return Math.min((duration / window) * 100, 100);
  }

  protected eventWhen(event: SchedulerEvent<T>): string {
    const day = longDateLabel(dateOf(event.start), this.locale());
    if (event.allDay) {
      return `${day} · ${this.allDayLabel()}`;
    }
    const end = event.end ? timeOf(event.end) : '';
    return `${day} · ${timeOf(event.start)}${end ? `–${end}` : ''}`;
  }

  protected chipClasses(event: SchedulerEvent<T>): string {
    return cx('ds-scheduler__chip', toneClass(event.tone ?? 'primary'));
  }

  protected blockClasses(event: SchedulerEvent<T>): string {
    return cx('ds-scheduler__block', toneClass(event.tone ?? 'primary'));
  }

  protected rowClasses(event: SchedulerEvent<T>): string {
    return cx('ds-scheduler__row', toneClass(event.tone ?? 'primary'));
  }

  protected viewLabel(view: SchedulerView): string {
    return view.charAt(0).toUpperCase() + view.slice(1);
  }

  /** One step of the view's own unit. */
  step(direction: 1 | -1): void {
    this.date.set(stepAnchor(this.view(), this.date(), direction));
    this.announceRange();
  }

  goToday(): void {
    this.date.set(this.today());
    this.cursor.set(this.today());
    this.announceRange();
  }

  setView(view: SchedulerView): void {
    if (view === this.view()) {
      return;
    }
    this.view.set(view);
    this.announceRange();
  }

  protected selectDay(iso: IsoDate): void {
    this.cursor.set(iso);
    this.date.set(iso);
    this.daySelect.emit(iso);
  }

  protected openEvent(domEvent: Event, event: SchedulerEvent<T>, date: IsoDate | null): void {
    // Opening an event is not choosing its day.
    domEvent.stopPropagation();
    this.openedEvent.set(event);
    if (this.detail()) {
      this.detailOpen.set(true);
    }
    this.eventOpen.emit({ event, date });
  }

  protected onKeydown(event: KeyboardEvent): void {
    const month = this.view() === 'month';
    const move = (days: number) => {
      event.preventDefault();
      const next = addDays(this.cursor(), days);
      this.cursor.set(next);
      // Walking off the edge of the range pages it, as a calendar should.
      const range = this.range();
      if (next < range.start || next > range.end) {
        this.date.set(next);
        this.announceRange();
      }
    };

    switch (event.key) {
      case 'ArrowRight':
        move(1);
        return;
      case 'ArrowLeft':
        move(-1);
        return;
      case 'ArrowDown':
        move(month ? 7 : 1);
        return;
      case 'ArrowUp':
        move(month ? -7 : -1);
        return;
      case 'Home':
        event.preventDefault();
        this.cursor.set(this.rangeDays()[0]);
        return;
      case 'End':
        event.preventDefault();
        this.cursor.set(this.rangeDays()[this.rangeDays().length - 1]);
        return;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const day = this.cursor();
        const first = this.eventsFor(day)[0];
        if (first) {
          this.openedEvent.set(first);
          if (this.detail()) {
            this.detailOpen.set(true);
          }
          this.eventOpen.emit({ event: first, date: day });
        } else {
          this.selectDay(day);
        }
        return;
      }
      default:
        return;
    }
  }

  private announceRange(): void {
    this.rangeChange.emit(this.range());
  }
}
