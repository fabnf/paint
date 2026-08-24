import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  type AbstractControl,
} from '@angular/forms';
import { DS_COMPONENTS, DS_PRIMITIVES, ToastService, type SelectOption } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * FormField — documentation page.
 */
@Component({
  selector: 'app-form-field-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI, ReactiveFormsModule],
  templateUrl: './form-field.page.html',
  styleUrl: './components-page.scss',
})
export class FormFieldPage {
  private readonly toasts = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly email = signal('');
  readonly notes = signal('');
  readonly colour = signal('#6a1bf5');

  readonly owners: readonly SelectOption[] = [
    { value: 'ada', label: 'Ada Lovelace', icon: 'user' },
    { value: 'grace', label: 'Grace Hopper', icon: 'user' },
    { value: 'katherine', label: 'Katherine Johnson', icon: 'user' },
  ];

  readonly countries: readonly SelectOption[] = [
    { value: 'gb', label: 'United Kingdom' },
    { value: 'de', label: 'Germany' },
    { value: 'jp', label: 'Japan' },
  ];

  // —— The realistic form ——

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    company: [''],
    country: ['' as string, Validators.required],
    vat: ['', Validators.pattern(/^[A-Z]{2}[A-Z0-9]{6,12}$/)],
    notes: [''],
  });

  readonly submitted = signal(false);
  readonly saved = signal(false);

  /** A message only once the user has had a go: touched, or they pressed Save. */
  error(name: keyof typeof this.form.controls, messages: Record<string, string>): string {
    const control: AbstractControl = this.form.controls[name];
    if (!(control.touched || this.submitted()) || control.valid) {
      return '';
    }
    const key = Object.keys(control.errors ?? {})[0];
    return messages[key] ?? 'Check this field.';
  }

  nameError = () => this.error('name', { required: 'We need something to call you.' });
  emailError = () =>
    this.error('email', { required: 'An email is required.', email: 'That is not an email address.' });
  countryError = () => this.error('country', { required: 'Pick a country.' });
  vatError = () => this.error('vat', { pattern: 'Two letters, then 6–12 digits.' });

  save(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.toasts.danger('Check the form', { description: 'Some fields still need attention.' });
      return;
    }

    this.saved.set(true);
    this.toasts.success('Billing details saved');
  }

  reset(): void {
    this.form.reset();
    this.submitted.set(false);
    this.saved.set(false);
  }

  // —— Snippets ——

  readonly anatomySnippet = `<ds-form-field label="Email" hint="We only use it to sign you in." [error]="emailError()">
  <ds-input type="email" autocomplete="email" [(value)]="email" />
</ds-form-field>

<!-- The control renders no label and no messages of its own. It adopts the
     field's id, description, validity and required state — through DI. -->`;

  readonly wiringSnippet = `// What the field publishes, and the control asks for
export interface FieldContext {
  controlId: Signal<string>;        // the id <label for> points at
  labelId: Signal<string | null>;   // for controls named by aria-labelledby
  describedByIds: Signal<string | null>;
  invalid: Signal<boolean>;
  required: Signal<boolean>;
  disabled: Signal<boolean>;
}

// FormControlBase, in the atom layer:
protected readonly field = inject(DS_FIELD, { optional: true });`;

  readonly selectSnippet = `<!-- A Select's trigger is a <button>, which is a labelable element -->
<ds-form-field label="Owner" [required]="true">
  <ds-select [options]="owners" [(value)]="owner" />
</ds-form-field>`;

  readonly nativeSnippet = `<!-- Anything else takes one attribute -->
<ds-form-field label="Brand colour" hint="The id, the description and the required state are wired for you.">
  <input dsFieldControl type="color" class="form-control colour-input" [value]="colour()" />
</ds-form-field>`;

  readonly layoutSnippet = `<!-- Fields are blocks. The layout is a Grid, like everything else. -->
<ds-grid [gap]="5">
  <ds-grid-item [span]="{ base: 12, md: 6 }">
    <ds-form-field label="Full name" [required]="true" [error]="nameError()">
      <ds-input formControlName="name" autocomplete="name" />
    </ds-form-field>
  </ds-grid-item>

  <ds-grid-item [span]="{ base: 12, md: 6 }">
    <ds-form-field label="Email" [required]="true" [error]="emailError()">
      <ds-input type="email" formControlName="email" autocomplete="email" />
    </ds-form-field>
  </ds-grid-item>

  <ds-grid-item [span]="12">
    <ds-form-field label="Notes" [optional]="true" hint="Anything the finance team should know.">
      <ds-textarea formControlName="notes" resize="auto" [rows]="3" />
    </ds-form-field>
  </ds-grid-item>
</ds-grid>`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'label', type: 'string', default: `''`, description: 'Visible label, rendered as a real <label for> pointing at the control.' },
    { name: 'labelHidden', type: 'boolean', default: 'false', description: 'Keeps the label as the control’s name, off the screen.' },
    { name: 'hint', type: 'string', default: `''`, description: 'Helper text under the control. Joins aria-describedby.' },
    { name: 'error', type: 'string', default: `''`, description: 'Error text. Implies invalid, announced politely, joins aria-describedby.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Marks the label, and requires the control.' },
    { name: 'optional', type: 'boolean', default: 'false', description: 'Says “Optional” in words. Ignored when required.' },
    { name: 'optionalText', type: 'string', default: `'Optional'`, description: 'What the word is, in your language.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Paints the control invalid without a message.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the control inside.' },
    { name: 'id', type: 'string', default: 'generated', description: 'The control’s id. The field owns it — never pass one to the control.' },
  ];

  readonly contextRows: readonly ApiRow[] = [
    { name: 'controlId', type: 'Signal<string>', default: '—', description: 'The id the label points at. The control adopts it.' },
    { name: 'labelId', type: 'Signal<string | null>', default: '—', description: 'Id of the label element, for controls named by aria-labelledby (Select).' },
    { name: 'describedByIds', type: 'Signal<string | null>', default: '—', description: 'Hint and error ids, in reading order.' },
    { name: 'invalid', type: 'Signal<boolean>', default: '—', description: 'Set by `invalid`, or implied by `error`.' },
    { name: 'required', type: 'Signal<boolean>', default: '—', description: 'Set by `required`.' },
    { name: 'disabled', type: 'Signal<boolean>', default: '—', description: 'Set by `disabled`.' },
  ];
}
