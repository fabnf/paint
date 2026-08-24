import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  forwardRef,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent, type IconName } from '../../icons';
import { FieldLabelComponent, FieldMessagesComponent } from '../forms/field-chrome.component';
import { FormControlBase } from '../forms/form-control.base';
import { controlIconSize, formControlSizeClass, type InputType } from '../forms/form-control.types';
import { cx } from '../primitives.types';

/** What a text input can hand back. `number` inputs emit numbers, not numeric strings. */
export type InputValue = string | number | null;

/**
 * Input — the text-entry atom.
 *
 * A real `<input class="form-control">` with Paint's label, hint, error and
 * affordance chrome around it. Nothing is re-implemented: selection, IME
 * composition, autofill, spellcheck, password managers, `Escape`-to-revert and
 * the whole text-editing keymap belong to the platform, and a `div` with
 * `contenteditable` gives none of them back.
 *
 * Implements `ControlValueAccessor`, so it drops into `ngModel` / reactive forms
 * as-is, and exposes `[(value)]` for template-only use. Inside a
 * `<ds-form-field>` it adopts the field's id, description, validity and required
 * state, and renders no label or messages of its own.
 *
 * A `[dsInputTrailing]` slot sits inside the field, after the text: it is how
 * `<ds-password-field>` puts a visibility toggle there without the input having
 * to learn about passwords.
 *
 * @example
 * ```html
 * <ds-input label="Email" type="email" [(value)]="email" hint="We only use it to sign you in." />
 * <ds-input label="Search" type="search" iconStart="search" [clearable]="true" [(value)]="query" />
 * <ds-input label="Amount" type="number" prefix="$" [(value)]="amount" />
 * <ds-input label="Name" formControlName="name" [error]="nameError()" />
 * ```
 */
@Component({
  selector: 'ds-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, FieldLabelComponent, FieldMessagesComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="ds-field">
      @if (label()) {
        <ds-field-label
          [for]="controlId()"
          [text]="label()"
          [required]="isRequired()"
          [disabled]="isDisabled()"
        />
      }

      <!--
        The wrapper is decoration, not a control: it draws the border and the
        focus ring so the icons can sit inside the field without the <input>
        having to stop being an <input>.
      -->
      <div [class]="wrapperClasses()">
        @if (iconStart()) {
          <ds-icon [name]="iconStart()!" [size]="iconSize()" class="ds-input__icon" />
        } @else if (prefix()) {
          <span class="ds-input__affix" aria-hidden="true">{{ prefix() }}</span>
        }

        <input
          #control
          class="ds-input__control"
          [id]="controlId()"
          [attr.name]="name() || null"
          [type]="type()"
          [disabled]="isDisabled()"
          [readOnly]="readOnly()"
          [required]="isRequired()"
          [attr.placeholder]="placeholder() || null"
          [attr.autocomplete]="autocomplete() || null"
          [attr.inputmode]="inputMode() || null"
          [attr.maxlength]="maxLength()"
          [attr.min]="min()"
          [attr.max]="max()"
          [attr.step]="step()"
          [attr.spellcheck]="spellcheck()"
          [attr.aria-label]="ariaLabelAttr()"
          [attr.aria-describedby]="describedByIds()"
          [attr.aria-invalid]="ariaInvalid()"
          (input)="onInput($event)"
          (change)="changed.emit(currentValue())"
          (blur)="onBlur()"
          (keydown.escape)="onEscape($event)"
        />

        @if (showClear()) {
          <!-- Not a tab stop: Escape clears from the keyboard, so this is an
               extra affordance for pointers rather than a second control. -->
          <button
            type="button"
            class="ds-input__clear"
            tabindex="-1"
            [attr.aria-label]="clearLabel()"
            (click)="clear()"
          >
            <ds-icon name="close" size="xs" />
          </button>
        }

        @if (iconEnd()) {
          <ds-icon [name]="iconEnd()!" [size]="iconSize()" class="ds-input__icon" />
        } @else if (suffix()) {
          <span class="ds-input__affix" aria-hidden="true">{{ suffix() }}</span>
        }

        <!--
          Trailing slot. The input stays dumb: it does not know what a password
          is, or what a search is doing. It only knows that something may need to
          sit inside the field, after the text — so the molecules that *do* know
          (PasswordField's visibility toggle, SearchField's spinner) project it.
        -->
        <ng-content select="[dsInputTrailing]" />
      </div>

      <ds-field-messages
        [class.ds-field__messages--spaced]="hasMessage()"
        [hint]="hint()"
        [hintId]="hintId()"
        [error]="error()"
        [errorId]="errorId()"
      />
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .ds-input__wrap {
      display: flex;
      align-items: center;
      gap: var(--ds-space-2);
      cursor: text;
    }

    .ds-input__wrap:focus-within {
      border-color: var(--ds-color-primary);
      box-shadow: var(--ds-control-focus-ring);
    }

    .ds-input__wrap--invalid {
      border-color: var(--ds-color-danger);
    }

    .ds-input__wrap--invalid:focus-within {
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--ds-color-danger) 28%, transparent);
    }

    .ds-input__wrap--disabled {
      cursor: not-allowed;
      background-color: var(--ds-color-surface-sunken);
      border-color: var(--ds-color-border);
    }

    /* The border, background and ring live on the wrapper — the control keeps
       the typography, the sizing and every platform behaviour. */
    .ds-input__control {
      flex: 1 1 auto;
      min-width: 0;
      padding: 0;
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      outline: none;
    }

    .ds-input__control::placeholder {
      color: var(--ds-color-text-subtle);
    }

    .ds-input__control:disabled {
      color: var(--ds-color-text-subtle);
      -webkit-text-fill-color: var(--ds-color-text-subtle);
      cursor: not-allowed;
    }

    /* Chrome paints autofill with its own background; repaint the whole field. */
    .ds-input__control:-webkit-autofill {
      -webkit-text-fill-color: var(--ds-color-text);
      transition: background-color 100000s;
    }

    .ds-input__control[type='number'] {
      appearance: textfield;
    }

    .ds-input__icon,
    .ds-input__affix {
      flex-shrink: 0;
      color: var(--ds-color-text-subtle);
    }

    .ds-input__affix {
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-medium);
    }

    .ds-input__clear {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      padding: 0;
      border: 0;
      border-radius: var(--ds-radius-full);
      background: none;
      color: var(--ds-color-text-subtle);
      cursor: pointer;
      opacity: 0.7;
    }

    .ds-input__clear:hover {
      opacity: 1;
    }

    @media (forced-colors: active) {
      .ds-input__wrap:focus-within {
        outline: 2px solid;
        outline-offset: 1px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ds-input__wrap {
        transition: none;
      }
    }
  `,
})
export class InputComponent extends FormControlBase<InputValue> {
  /** Text value. A `number` input reads and writes numbers; everything else, strings. */
  readonly value = model<InputValue>('');
  /** Kind of text entry. Not a styling knob — it changes the keyboard people get. */
  readonly type = input<InputType>('text');
  readonly placeholder = input<string>('');
  /**
   * Autofill hint, e.g. `email`, `new-password`, `one-time-code`.
   * Browsers fill forms whether or not you asked; this makes them fill correctly.
   */
  readonly autocomplete = input<string>('');
  /** On-screen keyboard hint, e.g. `numeric`, `decimal`. */
  readonly inputMode = input<string>('');
  readonly readOnly = input(false);
  readonly spellcheck = input<boolean | null>(null);
  readonly maxLength = input<number | null>(null);
  /** `number` constraints. Ignored by the other types. */
  readonly min = input<number | string | null>(null);
  readonly max = input<number | string | null>(null);
  readonly step = input<number | string | null>(null);
  /** Icon inside the field, before the text. */
  readonly iconStart = input<IconName | null>(null);
  /** Icon inside the field, after the text. */
  readonly iconEnd = input<IconName | null>(null);
  /** Static text before the value, e.g. `$`. Decorative — give the field a real label. */
  readonly prefix = input<string>('');
  /** Static text after the value, e.g. `/month`. */
  readonly suffix = input<string>('');
  /** Offers a clear affordance, and makes `Escape` empty the field. */
  readonly clearable = input(false);
  readonly clearLabel = input<string>('Clear');

  /** Emits on every keystroke, with the typed value. */
  readonly valueInput = output<InputValue>();
  /** Emits when the value is committed (blur, Enter, or a clear). */
  readonly changed = output<InputValue>();

  private readonly controlRef = viewChild<ElementRef<HTMLInputElement>>('control');

  protected readonly iconSize = computed(() => controlIconSize(this.size()));

  /** The DOM only speaks strings, so the model is projected onto one. */
  protected readonly displayValue = computed(() => {
    const value = this.value();
    return value === null || value === undefined ? '' : String(value);
  });

  constructor() {
    super();

    /*
     * The value is pushed to the DOM here rather than with `[value]`, because a
     * `number` field is mid-thought for most of the time the user is typing in
     * it: `"01"` parses to `1`, and re-binding `1` would delete a character from
     * under the caret. (The element itself reports `""` for the entries it
     * cannot parse at all — `"-"`, `"1e"` — so those never reach the model.)
     * The element is therefore corrected only when it has drifted from the model
     * for real, which is exactly the programmatic case: `writeValue`, `reset()`,
     * or `[(value)]` written from outside.
     */
    effect(() => {
      const next = this.displayValue();
      const element = this.controlRef()?.nativeElement;
      if (element && !this.inSync(element.value)) {
        element.value = next;
      }
    });
  }

  /** Is what the user can see already the value the model holds? */
  private inSync(domValue: string): boolean {
    if (this.type() !== 'number') {
      return domValue === this.displayValue();
    }
    if (domValue === '') {
      return this.value() === null;
    }
    const parsed = Number(domValue);
    // An unparseable entry is an unfinished one ("-", "1e"). Leave it alone.
    return Number.isNaN(parsed) ? true : parsed === this.value();
  }

  protected readonly showClear = computed(
    () => this.clearable() && !!this.displayValue() && !this.isDisabled() && !this.readOnly(),
  );

  protected readonly wrapperClasses = computed(() =>
    cx(
      'form-control',
      formControlSizeClass(this.size()),
      'ds-input__wrap',
      this.isInvalid() && 'ds-input__wrap--invalid',
      this.isDisabled() && 'ds-input__wrap--disabled',
    ),
  );

  /** Focuses the control — for the rare case a parent must place the caret. */
  focus(): void {
    this.controlRef()?.nativeElement.focus();
  }

  protected currentValue(): InputValue {
    return this.value();
  }

  protected onInput(event: Event): void {
    this.commit((event.target as HTMLInputElement).value);
    this.valueInput.emit(this.value());
  }

  protected onBlur(): void {
    this.markTouched();
  }

  /**
   * `Escape` clears a clearable field — the pointer-only alternative is a
   * button that, being a tab stop, would otherwise sit between the field and
   * whatever comes next.
   */
  protected onEscape(event: Event): void {
    if (!this.showClear()) {
      return;
    }
    event.stopPropagation();
    this.clear();
  }

  protected clear(): void {
    this.commit('');
    const element = this.controlRef()?.nativeElement;
    if (element) {
      element.value = '';
      element.focus();
    }
    this.valueInput.emit(this.value());
    this.changed.emit(this.value());
  }

  /** A `number` field that holds `"12"` would fail a `min` validator on a string. */
  private commit(raw: string): void {
    if (this.type() !== 'number') {
      this.value.set(raw);
      this.onChangeCallback(raw);
      return;
    }

    const next = raw === '' ? null : Number(raw);
    if (next !== null && Number.isNaN(next)) {
      // Half-typed number ("-", "1e"): there is no value to report yet.
      return;
    }

    this.value.set(next);
    this.onChangeCallback(next);
  }

  writeValue(value: InputValue): void {
    this.value.set(value ?? '');
  }
}
