import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  DS_COMPONENTS,
  DS_PRIMITIVES,
  type IsoDate,
  type IsoTime,
} from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

interface Invoice {
  id: string;
  project: string;
  issued: IsoDate;
  amount: string;
}

const INVOICES: readonly Invoice[] = [
  { id: 'INV-201', project: 'Mural', issued: '2026-03-02', amount: '$1,200' },
  { id: 'INV-202', project: 'Canvas', issued: '2026-03-05', amount: '$840' },
  { id: 'INV-203', project: 'Fresco', issued: '2026-03-09', amount: '$4,100' },
  { id: 'INV-204', project: 'Mural', issued: '2026-03-14', amount: '$960' },
  { id: 'INV-205', project: 'Gesso', issued: '2026-03-21', amount: '$2,350' },
  { id: 'INV-206', project: 'Canvas', issued: '2026-04-01', amount: '$715' },
  { id: 'INV-207', project: 'Fresco', issued: '2026-04-08', amount: '$3,020' },
];

/**
 * DateRangePicker — documentation page.
 */
@Component({
  selector: 'app-date-range-picker-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI],
  templateUrl: './date-range-picker.page.html',
  styleUrl: './components-page.scss',
})
export class DateRangePickerPage {
  /** The demo lives in March 2026, where the sample data is. */
  readonly demoToday: IsoDate = '2026-03-04';

  // —— the filter demo ——
  readonly from = signal<IsoDate | null>('2026-03-01');
  readonly to = signal<IsoDate | null>('2026-03-15');
  readonly invoices = INVOICES;

  readonly filtered = computed(() => {
    const from = this.from();
    const to = this.to();
    return INVOICES.filter(
      (invoice) => (!from || invoice.issued >= from) && (!to || invoice.issued <= to),
    );
  });

  // —— the time demo ——
  readonly windowStart = signal<IsoDate | null>(null);
  readonly windowEnd = signal<IsoDate | null>(null);
  readonly windowStartTime = signal<IsoTime | null>(null);
  readonly windowEndTime = signal<IsoTime | null>(null);

  readonly filterSnippet = `<ds-toolbar ariaLabel="Invoice filters" [bordered]="true">
  <ds-date-range-picker
    label="Issued"
    [(start)]="from"
    [(end)]="to"
    (rangeChange)="applyFilter($event)"
  />
</ds-toolbar>

<!-- filtered() is just a computed over start and end — the strings compare as dates -->
readonly filtered = computed(() =>
  invoices.filter((i) => (!from() || i.issued >= from()!) && (!to() || i.issued <= to()!)),
);`;

  readonly timeSnippet = `<ds-date-range-picker
  label="Maintenance window"
  [withTime]="true"
  [timeStep]="30"
  [(start)]="start" [(end)]="end"
  [(startTime)]="startTime" [(endTime)]="endTime"
  (rangeChange)="schedule($event)"
/>`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'start / end', type: 'IsoDate | null', default: 'null', description: 'The committed edges, two-way bindable, always in calendar order.' },
    { name: 'startTime / endTime', type: 'IsoTime | null', default: 'null', description: 'The times on the edges, 24-hour HH:mm. Shown only with withTime.' },
    { name: 'withTime', type: 'boolean', default: 'false', description: 'A ds-time-input on each edge.' },
    { name: 'timeStep / hour12', type: 'number / boolean', default: '15 / false', description: 'Forwarded to the time inputs. The value stays 24-hour.' },
    { name: 'min / max / dateDisabled', type: 'IsoDate / DateMatcher', default: 'null', description: 'One set of rules: the grids refuse, the typed fields flag.' },
    { name: 'order / separator / locale / weekStart / showWeekNumbers', type: 'various', default: 'as the molecules', description: 'The shared date vocabulary, passed through.' },
    { name: 'label', type: 'string', default: `'Date range'`, description: 'What the range is of. Names the trigger and the dialog.' },
    { name: 'placeholder', type: 'string', default: `'Choose dates'`, description: 'The trigger’s words before there is a range.' },
    { name: 'variant / size / caret', type: 'ButtonVariant / ButtonSize / boolean', default: `'secondary' / 'md' / true`, description: 'The trigger, which is a ds-button.' },
    { name: 'align', type: `'start' | 'end'`, default: `'start'`, description: 'Which edge of the trigger the panel lines up with.' },
    { name: 'clearable', type: 'boolean', default: 'true', description: 'The Clear button in the footer.' },
    { name: 'fromLabel / toLabel / clearLabel / doneLabel / gestureHint', type: 'string', default: 'sensible words', description: 'Every string in the panel, replaceable.' },
    { name: 'today', type: 'IsoDate', default: 'the clock', description: 'Injectable clock, for tests.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'rangeChange', type: 'OutputEmitterRef<DateRange>', default: '—', description: 'The whole range, on every commit: a drag, a second click, a typed edge, a time.' },
    { name: 'openChange', type: 'OutputEmitterRef<boolean>', default: '—', description: 'The dialog opened or closed.' },
  ];
}
