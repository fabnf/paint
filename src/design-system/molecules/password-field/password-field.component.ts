import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { ButtonComponent } from '../../primitives/button';
import { InputComponent } from '../../primitives/input';
import { ProgressComponent } from '../../primitives/progress';
import type { ControlSize } from '../../primitives/forms/form-control.types';
import { passwordStrength, type PasswordStrength } from './password-strength';

/** What the browser should fill. A new password and a current one are not the same field. */
export type PasswordPurpose = 'current' | 'new';

/**
 * PasswordField — an input, a visibility toggle, and optionally a strength meter.
 *
 * The atom stays dumb. `<ds-input>` does not know what a password is; it knows
 * that something may need to sit inside the field after the text, and offers a
 * slot. This molecule knows the rest:
 *
 * - The toggle is a **real button with `aria-pressed`**, not a checkbox and not a
 *   tabindex on an icon. It never leaves the tab order, and flipping it does not
 *   move focus or lose the caret.
 * - Revealing swaps `type="password"` for `type="text"`, which is the only thing
 *   that works: a custom mask loses selection, IME, autofill and the password
 *   manager that was about to fill it.
 * - `autocomplete` is a decision, not a default. A sign-in field is
 *   `current-password`; a sign-up field is `new-password`, which is what tells a
 *   password manager to *offer to generate one*.
 * - The strength meter is a `<ds-progress>` — not a live region. It must not
 *   narrate every keystroke.
 *
 * @example
 * ```html
 * <ds-form-field label="Password" hint="At least 12 characters.">
 *   <ds-password-field purpose="new" [showStrength]="true" [(value)]="password" />
 * </ds-form-field>
 *
 * <ds-password-field label="Password" purpose="current" formControlName="password" />
 * ```
 */
@Component({
  selector: 'ds-password-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InputComponent, ButtonComponent, ProgressComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PasswordFieldComponent),
      multi: true,
    },
  ],
  host: {
    '(focusout)': 'onTouchedCallback()',
  },
  template: `
    <ds-input
      #control
      [type]="visible() ? 'text' : 'password'"
      [label]="label()"
      [ariaLabel]="ariaLabel()"
      [placeholder]="placeholder()"
      [value]="value()"
      [size]="size()"
      [hint]="hint()"
      [error]="error()"
      [required]="required()"
      [disabled]="isDisabled()"
      [autocomplete]="autocompleteAttr()"
      [maxLength]="maxLength()"
      [spellcheck]="false"
      (valueInput)="onInput($event)"
    >
      <!--
        The slot is static; the condition lives inside it. A node inside an @if
        never reaches a named slot, because projection is decided on the markup.
      -->
      <span dsInputTrailing class="ds-password__trailing">
        @if (toggle()) {
          <ds-button
            class="ds-password__toggle"
            variant="ghost"
            size="sm"
            [iconStart]="visible() ? 'eyeOff' : 'eye'"
            [label]="visible() ? hideLabel() : showLabel()"
            [ariaPressed]="visible()"
            [ariaControls]="controlId()"
            [disabled]="isDisabled()"
            (clicked)="toggleVisibility()"
          />
        }
      </span>
    </ds-input>

    @if (showStrength()) {
      <div class="ds-password__strength">
        <!--
          A progressbar, not a live region: the meter is there to be glanced at,
          and a screen reader that narrated "Weak. Fair. Good." on every keystroke
          would be unusable. aria-valuetext carries the word, for when it is read.
        -->
        <ds-progress
          size="sm"
          [value]="strength().score"
          [max]="4"
          [tone]="strength().tone"
          [hideLabel]="true"
          [ariaLabel]="strengthLabel()"
          [valueText]="strength().label"
        />
        <span class="ds-password__strength-text" aria-hidden="true">{{ strength().label }}</span>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .ds-password__trailing {
      display: inline-flex;
      align-items: center;
    }

    .ds-password__trailing:empty {
      display: none;
    }

    /*
     * Bootstrap's .btn reads its padding from custom properties, so the toggle is
     * resized through Bootstrap's own API rather than by reaching inside the
     * Button primitive's encapsulation.
     */
    .ds-password__toggle {
      --bs-btn-padding-y: 0.25rem;
      --bs-btn-padding-x: 0.25rem;
      --bs-btn-border-radius: var(--ds-radius-full);

      margin-inline-end: calc(var(--ds-space-1) * -1);
    }

    .ds-password__strength {
      display: flex;
      align-items: center;
      gap: var(--ds-space-3);
      margin-block-start: var(--ds-space-2);
    }

    .ds-password__strength ds-progress {
      flex: 1 1 auto;
    }

    .ds-password__strength-text {
      flex: 0 0 auto;
      min-width: 3.5rem;
      text-align: end;
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-semibold);
      color: var(--ds-color-text-muted);
    }
  `,
})
export class PasswordFieldComponent implements ControlValueAccessor {
  readonly value = model<string>('');
  /** Visible label. Omit it inside a `<ds-form-field>`, which owns the label. */
  readonly label = input<string>('');
  readonly ariaLabel = input<string>('');
  readonly placeholder = input<string>('');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly size = input<ControlSize>('md');
  readonly disabled = input(false);
  readonly required = input(false);
  readonly maxLength = input<number | null>(null);
  /**
   * `current` for sign-in, `new` for sign-up and for changing a password.
   *
   * It is the difference between a password manager filling the old one and
   * offering to generate a new one.
   */
  readonly purpose = input<PasswordPurpose>('current');
  /** Override the `autocomplete` attribute entirely — e.g. `one-time-code`. */
  readonly autocomplete = input<string>('');
  /** The visibility toggle. There is no good reason to turn it off. */
  readonly toggle = input(true);
  readonly showLabel = input<string>('Show password');
  readonly hideLabel = input<string>('Hide password');
  /** A strength meter under the field. Only ever for a *new* password. */
  readonly showStrength = input(false);
  readonly strengthLabel = input<string>('Password strength');
  /** Replace the scorer. The default is a hint, not a security control. */
  readonly strengthFn = input<(value: string) => PasswordStrength>(passwordStrength);

  /** Emits on every keystroke. */
  readonly valueInput = output<string>();
  /** Emits when the password is revealed or hidden. */
  readonly visibilityChange = output<boolean>();

  /** Revealed. Resets to hidden for nobody: the user asked, and only they can un-ask. */
  protected readonly visible = signal(false);

  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  private readonly control = viewChild.required(InputComponent);

  /** The id of the input the toggle controls — the field's, when inside one. */
  protected readonly controlId = computed(() => this.control().controlId());

  protected readonly autocompleteAttr = computed(
    () => this.autocomplete() || (this.purpose() === 'new' ? 'new-password' : 'current-password'),
  );

  protected readonly strength = computed(() => this.strengthFn()(this.value()));

  /** Focuses the field. */
  focus(): void {
    this.control().focus();
  }

  protected toggleVisibility(): void {
    this.visible.set(!this.visible());
    this.visibilityChange.emit(this.visible());
    // The caret stays where it was; only the mask changes. Focus is already on
    // the toggle, and moving it into the field would undo the user's tab.
  }

  protected onInput(next: string | number | null): void {
    const value = next === null ? '' : String(next);
    this.value.set(value);
    this.onChangeCallback(value);
    this.valueInput.emit(value);
  }

  // —— ControlValueAccessor ——

  private onChangeCallback: (value: string) => void = () => {};
  protected onTouchedCallback: () => void = () => {};

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}
