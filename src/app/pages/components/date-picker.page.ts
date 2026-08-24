import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DS_COMPONENTS, DS_PRIMITIVES, todayIso, type IsoDate } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * DatePicker — documentation page.
 */
@Component({
  selector: 'app-date-picker-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI],
  templateUrl: './date-picker.page.html',
  styleUrl: './components-page.scss',
})
export class DatePickerPage {
  readonly today = todayIso();

  readonly invoiceDate = signal<IsoDate | null>(null);
  readonly deliveryDate = signal<IsoDate | null>(null);
  readonly bounded = signal<IsoDate | null>(null);

  readonly isWeekend = (iso: IsoDate): boolean => {
    const day = new Date(`${iso}T00:00:00Z`).getUTCDay();
    return day === 0 || day === 6;
  };

  readonly basicSnippet = `<ds-form-field label="Invoice date" hint="Type it, or press ArrowDown.">
  <ds-date-picker [(value)]="date" />
</ds-form-field>

<!-- Reactive forms: it is a ControlValueAccessor, like every Paint control -->
<ds-date-picker formControlName="start" />`;

  readonly rulesSnippet = `<!-- One set of rules, enforced twice: the field flags, the grid refuses. -->
<ds-date-picker
  [(value)]="delivery"
  [min]="today"
  [dateDisabled]="isWeekend"
  hint="Weekdays only, from today."
/>`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'value', type: 'IsoDate | null', default: 'null', description: 'The date, yyyy-mm-dd. Two-way bindable; never a Date.' },
    { name: 'min / max', type: 'IsoDate | null', default: 'null', description: 'Bounds, inclusive. The field flags a typed date outside them; the grid refuses it.' },
    { name: 'dateDisabled', type: 'DateMatcher | null', default: 'null', description: 'Days inside the range that still cannot be picked. One predicate, both views.' },
    { name: 'order / separator', type: `DateOrder / string`, default: `'ymd' / '-'`, description: 'How the three numbers are typed and displayed.' },
    { name: 'label / ariaLabel / hint / error', type: 'string', default: `''`, description: 'Field chrome, forwarded to the ds-date-input. Omit the label inside a ds-form-field.' },
    { name: 'placeholder', type: 'string', default: 'the pattern', description: 'Defaults to what the order expects, e.g. yyyy-mm-dd.' },
    { name: 'required / disabled / readOnly', type: 'boolean', default: 'false', description: 'The usual field states.' },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'The shared control scale.' },
    { name: 'weekStart / locale / showWeekNumbers', type: 'various', default: 'locale’s', description: 'Forwarded to the calendar.' },
    { name: 'today', type: 'IsoDate', default: 'the clock', description: 'Injectable clock, for tests.' },
    { name: 'dialogLabel / triggerLabel', type: 'string', default: `'Choose date'`, description: 'The dialog’s and the trigger’s accessible names.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'changed', type: 'OutputEmitterRef<IsoDate | null>', default: '—', description: 'Every committed change: typed, picked or cleared.' },
    { name: 'openChange', type: 'OutputEmitterRef<boolean>', default: '—', description: 'The calendar dialog opened or closed.' },
  ];

  readonly methods: readonly ApiRow[] = [
    { name: 'openPicker()', type: 'method', default: '—', description: 'Opens the calendar dialog from code.' },
    { name: 'close(restoreFocus?)', type: 'method', default: '—', description: 'Closes it, optionally putting focus back in the field.' },
  ];
}
