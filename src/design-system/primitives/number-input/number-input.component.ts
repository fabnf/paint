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
import { IconComponent } from '../../icons';
import { clamp, decimalPlaces, snapToGrid, stepValue } from '../../utils/number';
import { FieldLabelComponent, FieldMessagesComponent } from '../forms/field-chrome.component';
import { FormControlBase } from '../forms/form-control.base';
import { controlIconSize, formControlSizeClass } from '../forms/form-control.types';
import { cx } from '../primitives.types';

/** Empty is `null`, never `NaN` and never `""`. */
export type NumberInputValue = number | null;

/**
 * NumberInput — the quantity atom.
 *
 * A real `<input type="number">` between a − and a + button, in the same field
 * chrome as `<ds-input>`. Typing is the platform's — the caret, selection, IME,
 * the on-screen keypad; Paint owns the arithmetic: a value never leaves
 * `[min, max]`, stepping lands on the `step` grid, and `0.1 + 0.2` is `0.3`.
 *
 * **When the rules apply.** While typing, nothing is corrected — `"1"` on the
 * way to `"12"` is not yet out of range. Stepping (the buttons, `↑`/`↓`) is
 * always on the grid and inside the bounds. Leaving the field (blur, `Enter`)
 * clamps and snaps whatever was typed. A `min` of `1` therefore does not stop
 * anyone typing `0`; it stops them leaving with it.
 *
 * **The buttons are not tab stops.** Keyboard users step with the arrow keys,
 * so the buttons are pointer affordances — one tab stop per field, as with the
 * clear button of `<ds-input>`. They are still real, named buttons.
 *
 * This is not `<ds-input type="number">` with extra paint: that atom hands back
 * whatever parses, this one hands back a value that honours its constraints.
 * Use it for quantities, seats, percentages, prices — anything with a `min`.
 *
 * @example
 * ```html
 * <ds-number-input label="Seats" [min]="1" [max]="12" [(value)]="seats" />
 * <ds-number-input label="Price" [min]="0" [step]="0.01" prefix="$" formControlName="price" />
 * <ds-number-input label="Opacity" [min]="0" [max]="100" [step]="5" suffix="%" [(value)]="opacity" />
 * ```
 */
@Component({
  selector: 'ds-number-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, FieldLabelComponent, FieldMessagesComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumberInputComponent),
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

      <div [class]="wrapperClasses()">
        <!--
          tabindex="-1": the arrow keys already step, so a second and third tab
          stop per field would be noise. mousedown is swallowed so a click keeps
          the caret in the field — the button acts, the input stays the control.
        -->
        <button
          type="button"
          class="ds-number__step ds-number__step--down"
          tabindex="-1"
          [attr.aria-label]="decrementLabel()"
          [disabled]="!canDecrement()"
          (mousedown)="$event.preventDefault()"
          (click)="stepBy(-1)"
        >
          <ds-icon name="minus" [size]="iconSize()" />
        </button>

        @if (prefix()) {
          <span class="ds-number__affix" aria-hidden="true">{{ prefix() }}</span>
        }

        <input
          #control
          type="number"
          class="ds-number__control"
          [id]="controlId()"
          [attr.name]="name() || null"
          [attr.min]="min()"
          [attr.max]="max()"
          [attr.step]="stepAttr()"
          [disabled]="isDisabled()"
          [readOnly]="readOnly()"
          [required]="isRequired()"
          [attr.placeholder]="placeholder() || null"
          [attr.inputmode]="inputModeAttr()"
          autocomplete="off"
          [attr.aria-label]="ariaLabelAttr()"
          [attr.aria-describedby]="describedByIds()"
          [attr.aria-invalid]="ariaInvalid()"
          (input)="onInput($event)"
          (keydown)="onKeydown($event)"
          (focus)="onFocus()"
          (blur)="onBlur()"
        />

        @if (suffix()) {
          <span class="ds-number__affix" aria-hidden="true">{{ suffix() }}</span>
        }

        <button
          type="button"
          class="ds-number__step ds-number__step--up"
          tabindex="-1"
          [attr.aria-label]="incrementLabel()"
          [disabled]="!canIncrement()"
          (mousedown)="$event.preventDefault()"
          (click)="stepBy(1)"
        >
          <ds-icon name="plus" [size]="iconSize()" />
        </button>
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

    /* The same wrapper as <ds-input>: .form-control draws the border, the
       background and the ring; the flex row puts the buttons at the ends. The
       padding moves from the wrapper to the text so the buttons can reach the
       edges. */
    .ds-number__wrap {
      --ds-number-height: var(--ds-control-height-md);

      display: flex;
      align-items: stretch;
      padding: 0;
      overflow: hidden;
      cursor: text;
    }

    .ds-number__wrap.form-control-sm {
      --ds-number-height: var(--ds-control-height-sm);
    }

    .ds-number__wrap.form-control-lg {
      --ds-number-height: var(--ds-control-height-lg);
    }

    .ds-number__wrap:focus-within {
      border-color: var(--ds-color-primary);
      box-shadow: var(--ds-control-focus-ring);
    }

    .ds-number__wrap--invalid {
      border-color: var(--ds-color-danger);
    }

    .ds-number__wrap--invalid:focus-within {
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--ds-color-danger) 28%, transparent);
    }

    .ds-number__wrap--disabled {
      cursor: not-allowed;
      background-color: var(--ds-color-surface-sunken);
      border-color: var(--ds-color-border);
    }

    .ds-number__control {
      flex: 1 1 auto;
      min-width: 0;
      width: 4ch;
      padding: 0 var(--ds-space-1);
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      font-variant-numeric: tabular-nums;
      text-align: center;
      outline: none;
      /* The native spinners are replaced by the buttons. */
      appearance: textfield;
    }

    .ds-number__control::-webkit-outer-spin-button,
    .ds-number__control::-webkit-inner-spin-button {
      appearance: none;
      margin: 0;
    }

    .ds-number__control::placeholder {
      color: var(--ds-color-text-subtle);
    }

    .ds-number__control:disabled {
      color: var(--ds-color-text-subtle);
      -webkit-text-fill-color: var(--ds-color-text-subtle);
      cursor: not-allowed;
    }

    .ds-number__affix {
      display: inline-flex;
      align-items: center;
      flex-shrink: 0;
      color: var(--ds-color-text-subtle);
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-medium);
    }

    /* A square the height of the control, divided from the text by a hairline. */
    .ds-number__step {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: calc(var(--ds-number-height) - 2px);
      padding: 0;
      border: 0;
      background: var(--ds-color-surface-sunken);
      color: var(--ds-color-text-muted);
      cursor: pointer;
      transition: background-color 120ms ease;
    }

    .ds-number__step--down {
      border-inline-end: 1px solid var(--ds-color-border);
    }

    .ds-number__step--up {
      border-inline-start: 1px solid var(--ds-color-border);
    }

    .ds-number__step:hover:not(:disabled) {
      background-color: var(--ds-color-primary-muted);
      color: var(--ds-color-primary);
    }

    .ds-number__step:active:not(:disabled) {
      background-color: color-mix(in srgb, var(--ds-color-primary) 18%, var(--ds-color-surface));
    }

    .ds-number__step:disabled {
      color: var(--ds-color-text-subtle);
      opacity: 0.5;
      cursor: not-allowed;
    }

    .ds-number__step:focus-visible {
      outline: 2px solid var(--ds-color-focus-ring);
      outline-offset: -2px;
    }

    @media (forced-colors: active) {
      .ds-number__wrap:focus-within {
        outline: 2px solid;
        outline-offset: 1px;
      }

      .ds-number__step {
        border: 1px solid ButtonText;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ds-number__step {
        transition: none;
      }
    }
  `,
})
export class NumberInputComponent extends FormControlBase<NumberInputValue> {
  /** The number, or `null` for an empty field. */
  readonly value = model<NumberInputValue>(null);
  /** Lower bound. Also the anchor of the step grid, as in HTML. */
  readonly min = input<number | null>(null);
  readonly max = input<number | null>(null);
  /** Distance between two values. Decimal steps round to their own precision. */
  readonly step = input(1);
  readonly placeholder = input<string>('');
  readonly readOnly = input(false);
  /** Static text before the number, e.g. `$`. Decorative — give the field a real label. */
  readonly prefix = input<string>('');
  /** Static text after the number, e.g. `%`, `kg`. */
  readonly suffix = input<string>('');
  /**
   * On-screen keypad hint. Derived when unset: `numeric` or `decimal` for a
   * field that cannot go negative, the platform's default when it can — the
   * numeric keypads have no minus sign.
   */
  readonly inputMode = input<string>('');
  /** Accessible names of the two buttons. Add the field's name when several share a screen. */
  readonly decrementLabel = input<string>('Decrease');
  readonly incrementLabel = input<string>('Increase');

  /** Emits on every keystroke that produces a number (or empties the field). */
  readonly valueInput = output<NumberInputValue>();
  /** Emits when the value is committed: a step, `Enter`, or leaving the field with a change. */
  readonly changed = output<NumberInputValue>();

  private readonly controlRef = viewChild<ElementRef<HTMLInputElement>>('control');

  /** What the field held when it was entered, so blur can tell a visit from a change. */
  private valueAtFocus: NumberInputValue = null;

  protected readonly iconSize = computed(() => controlIconSize(this.size()));

  protected readonly stepAttr = computed(() => (this.step() > 0 ? this.step() : 'any'));

  protected readonly inputModeAttr = computed(() => {
    if (this.inputMode()) {
      return this.inputMode();
    }
    const min = this.min();
    if (min === null || min < 0) {
      return null;
    }
    return decimalPlaces(this.step()) > 0 ? 'decimal' : 'numeric';
  });

  protected readonly canStep = computed(() => !this.isDisabled() && !this.readOnly());

  protected readonly canDecrement = computed(() => {
    const value = this.value();
    const min = this.min();
    return this.canStep() && (value === null || min === null || value > min);
  });

  protected readonly canIncrement = computed(() => {
    const value = this.value();
    const max = this.max();
    return this.canStep() && (value === null || max === null || value < max);
  });

  protected readonly displayValue = computed(() => {
    const value = this.value();
    return value === null ? '' : String(value);
  });

  protected readonly wrapperClasses = computed(() =>
    cx(
      'form-control',
      formControlSizeClass(this.size()),
      'ds-number__wrap',
      this.isInvalid() && 'ds-number__wrap--invalid',
      this.isDisabled() && 'ds-number__wrap--disabled',
    ),
  );

  constructor() {
    super();

    /*
     * As in <ds-input type="number">: the element is only corrected when it has
     * drifted from the model for real. Re-binding `1` over a typed `"01"` would
     * delete a character from under the caret.
     */
    effect(() => {
      const next = this.displayValue();
      const element = this.controlRef()?.nativeElement;
      if (element && !this.inSync(element.value)) {
        element.value = next;
      }
    });
  }

  private inSync(domValue: string): boolean {
    if (domValue === '') {
      return this.value() === null;
    }
    const parsed = Number(domValue);
    // An unparseable entry is an unfinished one ("-", "1e"). Leave it alone.
    return Number.isNaN(parsed) ? true : parsed === this.value();
  }

  /** Focuses the control. */
  focus(): void {
    this.controlRef()?.nativeElement.focus();
  }

  /**
   * One step up or down, on the grid and inside the bounds. From an empty
   * field, either direction lands on zero — or the nearest allowed value.
   */
  stepBy(direction: 1 | -1): void {
    if (!this.canStep()) {
      return;
    }
    const value = this.value();
    const next =
      value === null
        ? snapToGrid(clamp(0, this.min(), this.max()), this.step(), this.min(), this.max())
        : stepValue(value, direction, this.step(), this.min(), this.max());

    this.commit(next, true);
    this.changed.emit(this.value());
  }

  protected onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    if (raw === '') {
      this.commit(null);
      return;
    }
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) {
      // Half-typed number ("-", "1e"): there is no value to report yet.
      return;
    }
    this.commit(parsed);
  }

  protected onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.stepBy(1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.stepBy(-1);
        break;
      case 'Enter':
        // Not prevented: a form may submit. The value is settled first.
        this.settle();
        this.changed.emit(this.value());
        break;
      default:
        return;
    }
  }

  protected onFocus(): void {
    this.valueAtFocus = this.value();
  }

  protected onBlur(): void {
    this.settle();
    this.markTouched();
    if (this.value() !== this.valueAtFocus) {
      this.changed.emit(this.value());
    }
  }

  /** Clamps and snaps whatever was typed, and shows the result. */
  private settle(): void {
    const value = this.value();
    if (value === null) {
      // A half-typed entry the element could not parse is dropped with the focus.
      const element = this.controlRef()?.nativeElement;
      if (element && element.value !== '') {
        element.value = '';
      }
      return;
    }
    const settled = snapToGrid(value, this.step(), this.min(), this.max());
    this.commit(settled, true);
  }

  /**
   * Writes the value, and optionally forces the element to show it — stepping
   * and settling must be visible even when the parsed DOM value already agrees
   * with the model (`"01"` → `1` after blur).
   */
  private commit(next: NumberInputValue, show = false): void {
    this.value.set(next);
    this.onChangeCallback(next);
    this.valueInput.emit(next);
    if (show) {
      const element = this.controlRef()?.nativeElement;
      if (element) {
        element.value = next === null ? '' : String(next);
      }
    }
  }

  writeValue(value: NumberInputValue | string): void {
    if (value === null || value === undefined || value === '') {
      this.value.set(null);
      return;
    }
    const parsed = Number(value);
    this.value.set(Number.isNaN(parsed) ? null : parsed);
  }
}
