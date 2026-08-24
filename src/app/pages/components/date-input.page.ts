import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CalendarComponent,
  DS_COMPONENTS,
  DS_PRIMITIVES,
  addDays,
  dayOfWeek,
  todayIso,
  uniqueId,
  type IsoDate,
  type IsoTime,
} from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * DateInput & TimeInput — documentation page.
 */
@Component({
  selector: 'app-date-input-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI, ReactiveFormsModule],
  templateUrl: './date-input.page.html',
  styleUrl: './components-page.scss',
})
export class DateInputPage {
  private readonly fb = inject(FormBuilder);

  readonly today = todayIso();

  readonly date = signal<IsoDate | null>(null);
  readonly british = signal<IsoDate | null>('2026-03-04');
  readonly american = signal<IsoDate | null>('2026-03-04');

  readonly start = signal<IsoTime | null>('09:30');
  readonly end = signal<IsoTime | null>('17:00');
  readonly slot = signal<IsoTime | null>(null);

  /** The assembled demo: a field, a trigger, and a calendar it reveals. */
  readonly assembled = signal<IsoDate | null>(null);
  readonly calendarOpen = signal(false);
  readonly calendarId = uniqueId('app-inline-calendar');
  private readonly calendar = viewChild(CalendarComponent);

  readonly isWeekend = (iso: IsoDate): boolean => [0, 6].includes(dayOfWeek(iso));

  openCalendar(): void {
    // Focus follows the disclosure — the one thing a caller must not forget, and
    // precisely the thing the picker organism will own.
    if (this.calendarOpen()) {
      setTimeout(() => this.calendar()?.focus());
    }
  }

  pick(): void {
    this.calendarOpen.set(false);
  }

  /** A booking form: a date, a start, an end, and a rule between them. */
  readonly form = this.fb.nonNullable.group({
    day: ['' as string, Validators.required],
    from: ['09:00' as string, Validators.required],
    to: ['10:00' as string, Validators.required],
  });

  readonly submitted = signal(false);

  dayMessage(): string {
    const control = this.form.controls.day;
    return (control.touched || this.submitted()) && control.invalid ? 'Pick a day.' : '';
  }

  orderMessage(): string {
    const { from, to } = this.form.getRawValue();
    return from && to && to <= from ? 'The end must be after the start.' : '';
  }

  submit(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();
  }

  readonly min = this.today;
  readonly max = addDays(this.today, 60);

  readonly basicSnippet = `<ds-form-field label="Invoice date" hint="Any format: 4/3/26, 2026-03-04…">
  <ds-date-input [(value)]="date" [min]="today" />
</ds-form-field>

<!-- value is 'yyyy-mm-dd' | null. Commits on blur and on Enter, never on a keystroke. -->`;

  readonly orderSnippet = `<!-- The same day, typed and displayed three ways -->
<ds-date-input order="ymd" [(value)]="date" />            <!-- 2026-03-04 -->
<ds-date-input order="dmy" separator="/" [(value)]="date" /> <!-- 04/03/2026 -->
<ds-date-input order="mdy" separator="/" [(value)]="date" /> <!-- 03/04/2026 -->`;

  readonly parseSnippet = `// The parser is generous about separators and exact about the result.
parseDateInput('4/3/26', 'dmy');   // '2026-03-04'
parseDateInput('20260304');        // '2026-03-04'
parseDateInput('2026.3.4');        // '2026-03-04'
parseDateInput('31/02/2026','dmy') // null — February has 28 days
parseDateInput('tomorrow');        // null — say so, do not guess`;

  readonly triggerSnippet = `<!-- The trigger asks. It does not open anything. -->
<ds-date-input
  [(value)]="date"
  [(open)]="calendarOpen"
  [ariaControls]="calendarId"
  triggerHasPopup=""
  (triggerClick)="focusCalendarSoon()"
/>

@if (calendarOpen()) {
  <div [id]="calendarId">
    <ds-calendar [(value)]="date" (daySelected)="calendarOpen.set(false)" />
  </div>
}`;

  readonly timeSnippet = `<ds-time-input [(value)]="start" [step]="15" />

<!-- 9 → 09:00. 930 → 09:30. 9:30 pm → 21:30. 12am → 00:00.
     Arrow keys step by the step; PageUp / PageDown by an hour. -->`;

  readonly hour12Snippet = `<!-- The display is twelve-hour. The value never is. -->
<ds-time-input [hour12]="true" [(value)]="start" />
<!-- shows "9:30 AM", holds "09:30" -->`;

  readonly dateInputs: readonly ApiRow[] = [
    { name: 'value', type: 'model<IsoDate | null>', default: 'null', description: 'The date, yyyy-mm-dd. null when empty or unreadable.' },
    { name: 'order', type: `'ymd' | 'dmy' | 'mdy'`, default: `'ymd'`, description: 'The order of the three numbers, typed and displayed.' },
    { name: 'separator', type: 'string', default: `'-'`, description: 'What the formatter puts between them. The parser accepts any of - / . or none.' },
    { name: 'min / max', type: 'IsoDate | null', default: 'null', description: 'Inclusive. An out-of-range date is still committed, and flagged.' },
    { name: 'trigger', type: 'boolean', default: 'true', description: 'The calendar affordance inside the field.' },
    { name: 'triggerLabel', type: 'string', default: `'Choose date'`, description: 'Its accessible name.' },
    { name: 'triggerHasPopup', type: 'string', default: `'dialog'`, description: 'What it promises to open. Empty for an inline disclosure.' },
    { name: 'ariaControls', type: 'string', default: `''`, description: 'Id of the thing it controls, once something renders one.' },
    { name: 'open', type: 'model<boolean>', default: 'false', description: 'Whether that thing is open. The trigger only reports it.' },
    { name: 'invalidMessage', type: 'string', default: 'from the pattern', description: 'Shown when the text is not a date.' },
    { name: 'rangeMessage', type: 'string', default: `'That date is outside…'`, description: 'Shown when the date is outside min/max.' },
    { name: 'label / hint / error / required / disabled / readOnly / size / name', type: '…', default: '—', description: 'Passed to the input. Omit label, hint and error inside a <ds-form-field>.' },
  ];

  readonly dateOutputs: readonly ApiRow[] = [
    { name: 'changed', type: 'OutputEmitterRef<IsoDate | null>', default: '—', description: 'A committed value: on blur, on Enter, on a clear.' },
    { name: 'triggerClick', type: 'OutputEmitterRef<void>', default: '—', description: 'The user asked for a calendar.' },
  ];

  readonly timeInputs: readonly ApiRow[] = [
    { name: 'value', type: 'model<IsoTime | null>', default: 'null', description: 'The time, 24-hour HH:mm. null when empty or unreadable.' },
    { name: 'hour12', type: 'boolean', default: 'false', description: 'Display and parse a twelve-hour clock. The value stays 24-hour.' },
    { name: 'withSeconds', type: 'boolean', default: 'false', description: 'HH:mm:ss. A field without seconds does not keep them.' },
    { name: 'step', type: 'number', default: '1', description: 'Minutes per arrow-key step. 15 is a meeting; 1 is a stopwatch.' },
    { name: 'min / max', type: 'IsoTime | null', default: 'null', description: 'Inclusive. Stepping respects them; typing reports them.' },
    { name: 'icon', type: `'clock' | null`, default: `'clock'`, description: 'The leading icon.' },
    { name: 'invalidMessage / rangeMessage', type: 'string', default: '—', description: 'As above.' },
    { name: 'label / hint / error / required / disabled / readOnly / size / name', type: '…', default: '—', description: 'Passed to the input.' },
  ];

  readonly timeOutputs: readonly ApiRow[] = [
    { name: 'changed', type: 'OutputEmitterRef<IsoTime | null>', default: '—', description: 'A committed value: on blur, on Enter, and on every step.' },
  ];
}
