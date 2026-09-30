import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { DS_FIELD } from '../../primitives/forms/field-context';
import { FieldLabelComponent, FieldMessagesComponent } from '../../primitives/forms/field-chrome.component';
import { FormControlBase } from '../../primitives/forms/form-control.base';
import { NumberInputComponent, type NumberInputValue } from '../../primitives/number-input';
import { cx } from '../../primitives/primitives.types';
import { SliderComponent } from '../../primitives/slider';
import type { Tone } from '../../primitives/tone.types';
import { clamp, decimalPlaces, snapToGrid } from '../../utils/number';

/**
 * RangeControl — a slider and a number field, sharing one value.
 *
 * The volume-control pattern: drag for the gesture, type for the digit. One
 * label, one hint, one error, one `min` / `max` / `step` — and one value, which
 * is the whole reason this is a molecule rather than two atoms in a `<ds-flex>`:
 * the two controls can never disagree, because neither owns the number.
 *
 * **The molecule owns the chrome.** The atoms inside it draw no label and no
 * messages of their own; the molecule's `<label for>` points at the slider, and
 * the number field is named by the same text through `aria-labelledby`. To a
 * screen reader that is two controls called "Volume", which is exactly what they
 * are. Inside a `<ds-form-field>` the field's label takes over, and the atoms are
 * shielded from the field so its id lands on the slider only.
 *
 * **Typing is still free.** The number field's own rule — nothing is corrected
 * mid-thought — survives: the model is clamped on every keystroke so the slider
 * and any form see a legal value, but the digits are only rewritten when the
 * field settles (blur, `Enter`, a step).
 *
 * @example
 * ```html
 * <ds-range-control label="Volume" [(value)]="volume" suffix="%" />
 * <ds-range-control label="Opacity" [min]="0" [max]="1" [step]="0.05" formControlName="opacity" />
 * <ds-range-control label="Budget" [max]="5000" [step]="100" prefix="$" hint="In whole hundreds." />
 * ```
 */
@Component({
  selector: 'ds-range-control',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SliderComponent, NumberInputComponent, FieldLabelComponent, FieldMessagesComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RangeControlComponent),
      multi: true,
    },
  ],
  /*
   * The atoms inside must not find a <ds-form-field> above the molecule: both
   * would adopt its id, and two controls cannot share one. The molecule adopts
   * the field itself and hands each atom exactly what it should carry.
   */
  viewProviders: [{ provide: DS_FIELD, useValue: null }],
  template: `
    <div [class]="fieldClasses()">
      @if (label()) {
        <ds-field-label
          [labelId]="labelId()"
          [for]="controlId()"
          [text]="label()"
          [required]="isRequired()"
          [disabled]="isDisabled()"
        />
      }

      <div class="ds-range-control__row" (focusout)="onFocusOut()">
        <ds-slider
          class="ds-range-control__slider"
          [id]="controlId()"
          [name]="name()"
          [ariaLabel]="ariaLabelAttr() || ''"
          [value]="current()"
          [min]="min()"
          [max]="max()"
          [step]="step()"
          [size]="size()"
          [tone]="tone()"
          [valueText]="sliderValueText()"
          [disabled]="isDisabled()"
          [invalid]="isInvalid()"
          [describedBy]="describedByIds() || ''"
          (valueInput)="onSliderInput($event)"
          (changed)="changed.emit(current())"
        />

        <ds-number-input
          #number
          class="ds-range-control__number"
          [style.--ds-range-control-number-auto]="numberWidth()"
          [id]="numberId()"
          [labelledBy]="numberLabelledBy() || ''"
          [ariaLabel]="numberLabelledBy() ? '' : ariaLabelAttr() || ''"
          [value]="numberShown()"
          [min]="min()"
          [max]="max()"
          [step]="step()"
          [size]="size()"
          [prefix]="prefix()"
          [suffix]="suffix()"
          [disabled]="isDisabled()"
          [invalid]="isInvalid()"
          [describedBy]="describedByIds() || ''"
          [decrementLabel]="decrementLabel()"
          [incrementLabel]="incrementLabel()"
          (valueInput)="onNumberInput($event)"
          (changed)="onNumberChanged($event)"
        />
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

    .ds-range-control__row {
      display: flex;
      align-items: center;
      gap: var(--ds-space-3);
    }

    .ds-range-control__slider {
      flex: 1 1 auto;
      min-width: 0;
    }

    /* As wide as its longest value and its two buttons — measured from min,
       max, step and the affixes — unless the host sets a width of its own. */
    .ds-range-control__number {
      flex: 0 0 var(--ds-range-control-number-width, var(--ds-range-control-number-auto));
    }
  `,
})
export class RangeControlComponent extends FormControlBase<number> {
  /** The one value both controls show. */
  readonly value = model(0);
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  /** Static text around the digits — `$`, `%`. Also spoken with the slider's value. */
  readonly prefix = input<string>('');
  readonly suffix = input<string>('');
  /** Colour of the slider's filled track. */
  readonly tone = input<Tone>('primary');
  readonly decrementLabel = input<string>('Decrease');
  readonly incrementLabel = input<string>('Increase');

  /** Emits on every change from either control. */
  readonly valueInput = output<number>();
  /** Emits when a gesture is over: the thumb is released, a key is pressed, the field settles. */
  readonly changed = output<number>();

  /**
   * The field *around* the molecule. `skipSelf`, because the molecule's own
   * `viewProviders` blank the token for the atoms inside, and the base class
   * would otherwise see that blank too.
   */
  protected override readonly field = inject(DS_FIELD, { optional: true, skipSelf: true });

  private readonly number = viewChild.required(NumberInputComponent);

  /**
   * What the number field shows. Deliberately *not* the model: the model is
   * clamped on every keystroke, the digits are not — pushing the clamp straight
   * back would rewrite "1" to "10" under the caret on the way to "12".
   */
  protected readonly numberShown = signal<NumberInputValue>(0);

  /** True between a keystroke in the number field and the moment it settles. */
  private numberEditing = false;

  protected readonly numberId = computed(() => `${this.controlId()}-number`);

  /** The model, on the grid and inside the bounds — what the slider draws. */
  protected readonly current = computed(() =>
    snapToGrid(this.value(), this.step(), this.min(), this.max()),
  );

  /**
   * Own label, or the field's. The slider is named by `<label for>`; the
   * number field by the same element, through `aria-labelledby`.
   */
  protected readonly numberLabelledBy = computed(() => {
    if (this.label()) {
      return this.labelId();
    }
    return this.field?.labelId() ?? null;
  });

  /** "$1,200" rather than "1200", when there is a unit to say. */
  protected readonly sliderValueText = computed(() => {
    const prefix = this.prefix();
    const suffix = this.suffix();
    return prefix || suffix ? `${prefix}${this.current()}${suffix}` : '';
  });

  /**
   * Room for the widest value the field can hold: the digits of `min` and
   * `max`, the decimals of `step`, the affixes, and the two square buttons.
   */
  protected readonly numberWidth = computed(() => {
    const decimals = decimalPlaces(this.step());
    const digits = Math.max(String(this.min()).length, String(this.max()).length);
    const chars = digits + (decimals ? decimals + 1 : 0) + this.prefix().length + this.suffix().length;
    const affixes = (this.prefix() ? 1 : 0) + (this.suffix() ? 1 : 0);
    return `calc(2 * var(--ds-control-height-${this.size()}) + ${chars + 1}ch + ${affixes} * var(--ds-space-4) + var(--ds-space-2))`;
  });

  protected readonly fieldClasses = computed(() =>
    cx('ds-field', 'ds-range-control', `ds-field--${this.size()}`),
  );

  constructor() {
    super();

    // The digits follow the model — from the slider, from a form, from the
    // host — except while the user is the one typing them.
    effect(() => {
      const value = this.current();
      untracked(() => {
        if (!this.numberEditing) {
          this.numberShown.set(value);
        }
      });
    });
  }

  protected onSliderInput(next: number): void {
    this.numberEditing = false;
    this.commit(next);
    this.numberShown.set(next);
  }

  /** A keystroke: the model follows, clamped; the digits stay as typed. */
  protected onNumberInput(next: NumberInputValue): void {
    this.numberEditing = true;
    if (next === null) {
      return;
    }
    this.commit(clamp(next, this.min(), this.max()));
  }

  /** Focus left either control: the form hears it, and the digits are settled. */
  protected onFocusOut(): void {
    this.markTouched();
    if (this.numberEditing) {
      this.numberEditing = false;
      this.showValueInNumber();
    }
  }

  /** The field settled (blur, Enter, a step). Now the digits show the truth. */
  protected onNumberChanged(next: NumberInputValue): void {
    this.numberEditing = false;
    if (next !== null) {
      this.commit(snapToGrid(next, this.step(), this.min(), this.max()));
    }
    this.showValueInNumber();
    this.changed.emit(this.current());
  }

  /**
   * Forces the number field to show the model. The `[value]` binding alone is
   * not enough when the field was emptied, or typed past the bounds: the
   * binding's last value may already equal the model, so nothing would be
   * pushed, and the field would keep showing what the user typed.
   */
  private showValueInNumber(): void {
    const value = this.current();
    this.numberShown.set(value);
    this.number().writeValue(value);
  }

  private commit(next: number): void {
    if (next === this.value()) {
      return;
    }
    this.value.set(next);
    this.onChangeCallback(next);
    this.valueInput.emit(next);
  }

  writeValue(value: number | null): void {
    const next = typeof value === 'number' && Number.isFinite(value) ? value : this.min();
    this.numberEditing = false;
    this.value.set(next);
    this.numberShown.set(next);
  }
}
