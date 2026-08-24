import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  DS_COMPONENTS,
  DS_PRIMITIVES,
  addDays,
  addMonths,
  dayOfWeek,
  longDateLabel,
  startOfMonth,
  todayIso,
  type IsoDate,
} from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Calendar — documentation page.
 */
@Component({
  selector: 'app-calendar-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI],
  templateUrl: './calendar.page.html',
  styleUrl: './components-page.scss',
})
export class CalendarPage {
  readonly today = todayIso();

  readonly date = signal<IsoDate | null>(null);
  readonly bounded = signal<IsoDate | null>(null);
  readonly workday = signal<IsoDate | null>(null);
  readonly weekly = signal<IsoDate | null>(null);

  /** Two months, one selection: the calendar is a month, not a picker. */
  readonly leftMonth = signal<IsoDate>(startOfMonth(this.today));
  readonly rightMonth = computed(() => addMonths(startOfMonth(this.leftMonth()), 1));
  readonly twoUp = signal<IsoDate | null>(null);

  readonly min = this.today;
  readonly max = addDays(this.today, 45);

  /** A matcher is a predicate, not a list: a year of holidays is not an array. */
  readonly isWeekend = (iso: IsoDate): boolean => {
    const day = dayOfWeek(iso);
    return day === 0 || day === 6;
  };

  readonly spoken = computed(() => {
    const value = this.date();
    return value ? longDateLabel(value, 'en-GB') : 'nothing yet';
  });

  readonly basicSnippet = `<ds-calendar [(value)]="date" (daySelected)="close()" />

<!-- value is 'yyyy-mm-dd'. There is no Date in the API, and therefore
     no time zone to move it by a day. -->`;

  readonly boundsSnippet = `<!-- Inclusive. The arrows stop where nothing can be picked. -->
<ds-calendar [(value)]="date" [min]="today" [max]="in45Days" />

<!-- Days inside the range that are still unavailable -->
<ds-calendar [(value)]="date" [dateDisabled]="isWeekend" />

isWeekend = (iso: IsoDate) => [0, 6].includes(dayOfWeek(iso));`;

  readonly keyboardSnippet = `// The grid is one tab stop. Everything else is the arrows.
//
// ← →          the day before / after, across the month boundary
// ↑ ↓          the same weekday, a week earlier / later
// Home End     the ends of the focused week
// PageUp/Down  the month; with Shift, the year
// Enter Space  pick the focused day — it is a <button>`;

  readonly twoUpSnippet = `<!-- One value, two months. The calendar renders a month; the caller
     decides how many of them there are. -->
<ds-flex [gap]="6">
  <ds-calendar [(value)]="range" [(month)]="left" />
  <ds-calendar [(value)]="range" [month]="right()" />
</ds-flex>`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'value', type: 'model<IsoDate | null>', default: 'null', description: 'The selected day, yyyy-mm-dd. Two-way bindable.' },
    { name: 'month', type: 'model<IsoDate | null>', default: 'null', description: 'The month on screen, as any day inside it. Bind it for a controlled header or a two-up view.' },
    { name: 'min / max', type: 'IsoDate | null', default: 'null', description: 'The selectable range, inclusive.' },
    { name: 'dateDisabled', type: '(date: IsoDate) => boolean', default: 'null', description: 'Days inside the range that still cannot be picked. Called once per rendered cell.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'The whole grid. The keyboard stops too.' },
    { name: 'weekStart', type: '0–6 | null', default: 'null', description: 'null asks the locale. 0 is Sunday.' },
    { name: 'locale', type: 'string', default: `'en-GB'`, description: 'Month, weekday and day names, through Intl.' },
    { name: 'showWeekNumbers', type: 'boolean', default: 'false', description: 'The ISO-8601 week number, as a row header.' },
    { name: 'showAdjacentDays', type: 'boolean', default: 'true', description: 'The leading and trailing days of the adjacent months. Picking one pages the calendar.' },
    { name: 'fixedWeeks', type: 'boolean', default: 'true', description: 'Always six rows, so the page below does not move as you page.' },
    { name: 'today', type: 'IsoDate', default: 'todayIso()', description: 'Injectable clock. The one thing a calendar cannot be tested without.' },
    { name: 'rangeStart / rangeEnd', type: 'IsoDate | null', default: 'null', description: 'Paints a range — edges filled, the days between tinted. Presentation only: what a range means is the picker organism’s business.' },
    { name: 'previousMonthLabel / nextMonthLabel / weekNumberLabel', type: 'string', default: `'Previous month'…`, description: 'The names of the arrows and of the week column.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'daySelected', type: 'OutputEmitterRef<IsoDate>', default: '—', description: 'The user picked a day. Never fires for a disabled one.' },
    { name: 'valueChange / monthChange', type: 'OutputEmitterRef<…>', default: '—', description: 'The model outputs behind [(value)] and [(month)].' },
  ];

  readonly utilRows: readonly ApiRow[] = [
    { name: 'todayIso(now?)', type: '(now?: Date) => IsoDate', default: '—', description: 'Today, from the *local* clock. Pass a Date in tests.' },
    { name: 'addDays / addMonths', type: '(iso, n) => IsoDate', default: '—', description: 'addMonths clamps: 31 January + 1 month is 28 February, not 3 March.' },
    { name: 'monthGrid(month, weekStart, fixedWeeks)', type: '=> CalendarWeek[]', default: '—', description: 'The weeks of a month, padded with the adjacent days. What the component renders.' },
    { name: 'isoWeekNumber(iso)', type: '=> number', default: '—', description: 'Week 1 is the one with the first Thursday. Nobody should write this twice.' },
    { name: 'parseDateInput(text, order)', type: '=> IsoDate | null', default: '—', description: 'What a human types. null rather than a guess.' },
    { name: 'isWithin / clampIso / compareIso', type: '…', default: '—', description: 'Bounds and order. Lexicographic order *is* chronological order, for ISO dates.' },
  ];
}
