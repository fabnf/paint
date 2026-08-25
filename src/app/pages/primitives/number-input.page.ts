import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DS_PRIMITIVES, type NumberInputValue } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * NumberInput — documentation page.
 */
@Component({
  selector: 'app-number-input-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DOC_UI, ReactiveFormsModule],
  templateUrl: './number-input.page.html',
  styleUrl: './primitives-page.scss',
})
export class NumberInputPage {
  readonly seats = signal<NumberInputValue>(3);
  readonly price = signal<NumberInputValue>(19.99);
  readonly opacity = signal<NumberInputValue>(60);
  readonly temperature = signal<NumberInputValue>(-4);

  /** A line item: the quantity drives the total. */
  readonly quantity = signal<NumberInputValue>(2);
  readonly unitPrice = 24;
  readonly total = computed(() => ((this.quantity() ?? 0) * this.unitPrice).toFixed(2));

  /** Validation demo: the message appears once the field has been left. */
  readonly control = new FormControl<NumberInputValue>(null, [Validators.required, Validators.min(1)]);

  /** Recomputed on every change-detection pass — fine for a demo field. */
  liveError(): string {
    if (!this.control.touched || this.control.valid) {
      return '';
    }
    return this.control.hasError('required') ? 'How many?' : 'At least one.';
  }

  readonly basicSnippet = `<ds-number-input label="Seats" [min]="1" [max]="12" [(value)]="seats" hint="Up to twelve." />`;

  readonly rulesSnippet = `<!-- Typing is free; stepping and leaving honour the rules -->
<ds-number-input label="Opacity" [min]="0" [max]="100" [step]="5" suffix="%" [(value)]="opacity" />

<!-- Decimal steps round to their own precision: 19.99 + 0.01 is 20, not 20.000000000000004 -->
<ds-number-input label="Price" [min]="0" [step]="0.01" prefix="$" [(value)]="price" />

<!-- A field that can go negative keeps the platform keyboard — the numeric keypads have no minus -->
<ds-number-input label="Temperature" [min]="-30" [max]="45" suffix="°C" [(value)]="temperature" />`;

  readonly lineSnippet = `<ds-number-input
  ariaLabel="Quantity"
  size="sm"
  [min]="1"
  [max]="99"
  [(value)]="quantity"
  decrementLabel="One fewer"
  incrementLabel="One more"
/>`;

  readonly formSnippet = `readonly control = new FormControl<number | null>(null, [Validators.required, Validators.min(1)]);

// template
<ds-number-input
  label="Guests"
  [min]="1"
  [formControl]="control"
  [error]="control.touched && control.invalid ? 'At least one.' : ''"
/>`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'value', type: 'model<number | null>', default: 'null', description: 'The number, or null for an empty field. Never NaN, never a string.' },
    { name: 'min / max', type: 'number | null', default: 'null', description: 'The bounds. min also anchors the step grid, as in HTML.' },
    { name: 'step', type: 'number', default: '1', description: 'Distance between two values. Decimal steps round to their own precision.' },
    { name: 'placeholder', type: 'string', default: `''`, description: 'An example of the format — never a substitute for a label.' },
    { name: 'prefix / suffix', type: 'string', default: `''`, description: 'Static text inside the field, e.g. $ or %. Decorative.' },
    { name: 'inputMode', type: 'string', default: `''`, description: 'Keypad hint. Derived when unset: numeric or decimal for a field that cannot go negative.' },
    { name: 'decrementLabel / incrementLabel', type: 'string', default: `'Decrease' / 'Increase'`, description: 'Accessible names of the two buttons. Add the field’s name when several share a screen.' },
    { name: 'label', type: 'string', default: `''`, description: 'Visible label, rendered as a real <label for>.' },
    { name: 'ariaLabel', type: 'string', default: `''`, description: 'Accessible name when there is no visible label.' },
    { name: 'hint', type: 'string', default: `''`, description: 'Helper text under the field. Wired into aria-describedby.' },
    { name: 'error', type: 'string', default: `''`, description: 'Error text. Implies invalid, announced politely, joins aria-describedby.' },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Control height, from Paint’s control scale.' },
    { name: 'readOnly', type: 'boolean', default: 'false', description: 'Focusable and copyable, but not editable. The buttons disable.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Sets required on the control and marks the label.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Paints the invalid state without a message.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the control and both buttons. Forms can disable it too.' },
    { name: 'id / name', type: 'string', default: `''`, description: 'Id is generated when omitted; name is what a native submission sends.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'valueInput', type: 'OutputEmitterRef<number | null>', default: '—', description: 'Emits on every change: each keystroke that produces a number (or empties the field), each step.' },
    { name: 'changed', type: 'OutputEmitterRef<number | null>', default: '—', description: 'Emits when the value is committed: a step, Enter, or leaving the field with a change.' },
    { name: 'valueChange', type: 'OutputEmitterRef<number | null>', default: '—', description: 'The model output behind [(value)].' },
  ];

  readonly methods: readonly ApiRow[] = [
    { name: 'stepBy(direction)', type: '(direction: 1 | -1) => void', default: '—', description: 'One step up or down, on the grid and inside the bounds — what the buttons call.' },
    { name: 'focus()', type: '() => void', default: '—', description: 'Focuses the control.' },
  ];
}