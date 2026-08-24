import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DS_PRIMITIVES, type InputValue } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Input — documentation page.
 */
@Component({
  selector: 'app-input-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DOC_UI, ReactiveFormsModule],
  templateUrl: './input.page.html',
  styleUrl: './primitives-page.scss',
})
export class InputPage {
  readonly email = signal<InputValue>('');
  readonly query = signal<InputValue>('');
  readonly amount = signal<InputValue>(1200);
  readonly seats = signal<InputValue>(3);
  readonly site = signal<InputValue>('');

  /** Validation demo: the message appears once the field has been left. */
  readonly emailControl = new FormControl('', [Validators.required, Validators.email]);

  /** Recomputed on every change-detection pass — fine for a demo field. */
  liveError(): string {
    const control = this.emailControl;
    if (!control.touched || control.valid) {
      return '';
    }
    return control.hasError('required') ? 'An email is required.' : 'That is not an email address.';
  }

  readonly basicSnippet = `<ds-input
  label="Email"
  type="email"
  autocomplete="email"
  hint="We only use it to sign you in."
  [(value)]="email"
/>`;

  readonly typeSnippet = `<!-- type is not a styling knob: it changes the keyboard people get -->
<ds-input label="Website" type="url" inputMode="url" [(value)]="site" />
<ds-input label="Seats" type="number" [min]="1" [max]="99" [(value)]="seats" />

<!-- a number input hands back a number, never "3" -->`;

  readonly affixSnippet = `<ds-input label="Search" type="search" iconStart="search" [clearable]="true" [(value)]="query" />
<ds-input label="Amount" type="number" prefix="$" suffix="/month" [(value)]="amount" />`;

  readonly sizeSnippet = `<ds-input size="sm" label="Small" />
<ds-input size="md" label="Medium" />
<ds-input size="lg" label="Large" />`;

  readonly validationSnippet = `// error text *is* the invalid state: it sets aria-invalid and
// joins aria-describedby, so the message is never orphaned
readonly control = new FormControl('', [Validators.required, Validators.email]);

// template
<ds-input
  label="Email"
  type="email"
  [formControl]="control"
  [error]="control.touched && control.invalid ? 'That is not an email address.' : ''"
/>`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'value', type: 'model<string | number | null>', default: `''`, description: 'The text. A number input reads and writes numbers.' },
    { name: 'type', type: `'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number'`, default: `'text'`, description: 'Kind of text entry. Changes the on-screen keyboard, not the paint.' },
    { name: 'label', type: 'string', default: `''`, description: 'Visible label, rendered as a real <label for>.' },
    { name: 'ariaLabel', type: 'string', default: `''`, description: 'Accessible name when there is no visible label. Ignored when label is set.' },
    { name: 'hint', type: 'string', default: `''`, description: 'Helper text under the field. Wired into aria-describedby.' },
    { name: 'error', type: 'string', default: `''`, description: 'Error text. Implies invalid, announced politely, joins aria-describedby.' },
    { name: 'describedBy', type: 'string', default: `''`, description: 'Id of extra descriptive text elsewhere on the page.' },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Control height, from Paint’s control scale.' },
    { name: 'placeholder', type: 'string', default: `''`, description: 'An example of the format — never a substitute for a label.' },
    { name: 'iconStart / iconEnd', type: 'IconName | null', default: 'null', description: 'Decorative icon inside the field.' },
    { name: 'prefix / suffix', type: 'string', default: `''`, description: 'Static text inside the field, e.g. $ or /month.' },
    { name: 'clearable', type: 'boolean', default: 'false', description: 'Offers a clear affordance, and makes Escape empty the field.' },
    { name: 'clearLabel', type: 'string', default: `'Clear'`, description: 'Accessible name for the clear button.' },
    { name: 'autocomplete', type: 'string', default: `''`, description: 'Autofill hint, e.g. email, new-password, one-time-code.' },
    { name: 'inputMode', type: 'string', default: `''`, description: 'On-screen keyboard hint, e.g. numeric, decimal.' },
    { name: 'maxLength', type: 'number | null', default: 'null', description: 'Hard limit enforced by the browser.' },
    { name: 'min / max / step', type: 'number | string | null', default: 'null', description: 'Constraints for type="number".' },
    { name: 'readOnly', type: 'boolean', default: 'false', description: 'Focusable and copyable, but not editable.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Sets required on the control and marks the label.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Paints the invalid state without a message.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the control. Forms can disable it too.' },
    { name: 'id / name', type: 'string', default: `''`, description: 'Id is generated when omitted; name is what a native submission sends.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'valueInput', type: 'OutputEmitterRef<InputValue>', default: '—', description: 'Emits on every keystroke.' },
    { name: 'changed', type: 'OutputEmitterRef<InputValue>', default: '—', description: 'Emits when the value is committed: blur, Enter, or a clear.' },
    { name: 'valueChange', type: 'OutputEmitterRef<InputValue>', default: '—', description: 'The model output behind [(value)].' },
  ];
}
