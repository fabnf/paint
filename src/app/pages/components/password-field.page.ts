import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DS_COMPONENTS, DS_PRIMITIVES, passwordStrength } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * PasswordField — documentation page.
 */
@Component({
  selector: 'app-password-field-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI, ReactiveFormsModule],
  templateUrl: './password-field.page.html',
  styleUrl: './components-page.scss',
})
export class PasswordFieldPage {
  private readonly fb = inject(FormBuilder);

  readonly current = signal('');
  readonly fresh = signal('');

  readonly strength = computed(() => passwordStrength(this.fresh()));

  readonly samples = [
    '1234',
    'hunter2',
    'Tr0ub4dor&3',
    'correct horse battery staple',
  ] as const;

  /** A sign-up form: the realistic case for `purpose="new"`. */
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(12)]],
  });

  readonly submitted = signal(false);

  passwordError(): string {
    const control = this.form.controls.password;
    if (!(control.touched || this.submitted()) || control.valid) {
      return '';
    }
    return control.hasError('required')
      ? 'A password is required.'
      : 'Twelve characters, at least. A passphrase is easiest.';
  }

  emailError(): string {
    const control = this.form.controls.email;
    if (!(control.touched || this.submitted()) || control.valid) {
      return '';
    }
    return control.hasError('required') ? 'An email is required.' : 'That is not an email address.';
  }

  submit(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();
  }

  score(value: string): number {
    return passwordStrength(value).score;
  }

  label(value: string): string {
    return passwordStrength(value).label;
  }

  tone(value: string) {
    return passwordStrength(value).tone;
  }

  readonly basicSnippet = `<ds-form-field label="Password" hint="At least 12 characters.">
  <ds-password-field purpose="new" [showStrength]="true" [(value)]="password" />
</ds-form-field>`;

  readonly toggleSnippet = `<!-- Revealing swaps type="password" for type="text". Nothing else works:
     a custom mask loses selection, IME, autofill and the password manager
     that was about to fill it. -->

<!-- The toggle is a real button: aria-pressed, named, pointing at the input -->
<button type="button" aria-pressed="false" aria-controls="…" aria-label="Show password">`;

  readonly purposeSnippet = `<!-- Sign in: fill the old one -->
<ds-password-field label="Password" purpose="current" />
<!-- autocomplete="current-password" -->

<!-- Sign up, or change: offer to generate a new one -->
<ds-password-field label="New password" purpose="new" [showStrength]="true" />
<!-- autocomplete="new-password" -->`;

  readonly strengthSnippet = `// A hint to the user, not a security control. It cannot know that
// Pa$$w0rd! is the first guess of every cracker in existence, and
// nothing that runs in a browser can.
export function passwordStrength(value: string): PasswordStrength;

// Length dominates on purpose: a long passphrase of lowercase words
// beats a short jumble, and a meter that says otherwise teaches the
// wrong lesson.
passwordStrength('Tr0ub4dor&3');                  // Fair
passwordStrength('correct horse battery staple'); // Strong`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'value', type: 'model<string>', default: `''`, description: 'The password. Two-way bindable and form-bound.' },
    { name: 'purpose', type: `'current' | 'new'`, default: `'current'`, description: 'Sets autocomplete. The difference between filling a password and generating one.' },
    { name: 'autocomplete', type: 'string', default: 'from purpose', description: 'Override entirely — e.g. one-time-code.' },
    { name: 'toggle', type: 'boolean', default: 'true', description: 'The visibility toggle. There is no good reason to turn it off.' },
    { name: 'showLabel / hideLabel', type: 'string', default: `'Show password'`, description: 'The toggle’s accessible name, in both states.' },
    { name: 'showStrength', type: 'boolean', default: 'false', description: 'A strength meter under the field. Only ever for a new password.' },
    { name: 'strengthLabel', type: 'string', default: `'Password strength'`, description: 'The meter’s accessible name.' },
    { name: 'strengthFn', type: '(value: string) => PasswordStrength', default: 'passwordStrength', description: 'Replace the scorer. Yours will also be a hint, not a control.' },
    { name: 'label / hint / error', type: 'string', default: `''`, description: 'Passed to the input. Omit them inside a <ds-form-field>.' },
    { name: 'required / disabled', type: 'boolean', default: 'false', description: 'Passed to the input, and to the toggle.' },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Control height.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'valueInput', type: 'OutputEmitterRef<string>', default: '—', description: 'Emits on every keystroke.' },
    { name: 'visibilityChange', type: 'OutputEmitterRef<boolean>', default: '—', description: 'The password was revealed or hidden.' },
  ];
}
