import { Directive, computed, inject, input, signal } from '@angular/core';
import type { ControlValueAccessor } from '@angular/forms';
import { uniqueId } from '../../utils';
import { DS_FIELD } from './field-context';
import { describedBy as joinIds, type ControlSize } from './form-control.types';

/**
 * The plumbing every Paint form atom shares.
 *
 * Five controls, one contract:
 *
 * - **Identity.** One generated id, and the hint / error ids derived from it.
 *   Consumers may pass their own `id`; nothing downstream has to care.
 * - **Labelling.** A visible `<label for>` whenever `label` is set, an
 *   `aria-label` when it is not, and `aria-describedby` assembled from the hint,
 *   the error and whatever the consumer added — in reading order.
 * - **Validity.** `error` text *is* the invalid state: a control that shows a
 *   message and does not set `aria-invalid` lies to screen readers. `invalid`
 *   stays available for the "red, no message" case.
 * - **Disabled.** An input *or* the forms API can disable the control, and the
 *   control cannot tell the difference.
 * - **Value.** Left to the subclass, because `value` (text) and `checked`
 *   (boolean) are not the same idea, and a boolean `[(value)]` reads like a lie.
 *
 * Every one of those five can also come from a `<ds-form-field>` above the
 * control ({@link DS_FIELD}). The control does not know what a field *is*; it
 * asks, optionally, whether one is there, and folds what it says into its own
 * state. Standing alone, it behaves exactly as before.
 *
 * Subclasses implement `writeValue`; everything else is inherited. Extending
 * this from application code is supported — it is how you get a control that a
 * Paint form treats as one of its own.
 */
@Directive()
export abstract class FormControlBase<T> implements ControlValueAccessor {
  /**
   * The `<ds-form-field>` this control is written inside, if any.
   *
   * Element injectors follow the template, so a control nested in a field's tags
   * finds it here — and a control standing on its own finds `null`.
   */
  protected readonly field = inject(DS_FIELD, { optional: true });

  /** Stable fallback id. Generated once per instance, never per render. */
  private readonly generatedId = uniqueId('ds-control');

  /** Id of the native control. Generated when omitted. */
  readonly id = input<string>('');
  /** `name` of the native control — what a native form submission sends. */
  readonly name = input<string>('');
  /**
   * Visible label, rendered as a real `<label for>`.
   *
   * Prefer this to `ariaLabel`: a visible label is a bigger click target, it
   * survives translation, and it is the only name a sighted user with a
   * cognitive disability can check against.
   */
  readonly label = input<string>('');
  /** Accessible name when there is no visible label. Ignored when `label` is set. */
  readonly ariaLabel = input<string>('');
  /** Helper text under the control. Wired into `aria-describedby`. */
  readonly hint = input<string>('');
  /**
   * Error text under the control. Implies `invalid`, is announced politely when
   * it appears, and joins `aria-describedby`.
   */
  readonly error = input<string>('');
  /** Id of extra descriptive text elsewhere on the page. */
  readonly describedBy = input<string>('');
  /** Control height, from Paint's control scale. */
  readonly size = input<ControlSize>('md');
  readonly disabled = input(false);
  /** Sets `required` on the native control and marks the label. */
  readonly required = input(false);
  /** Paints the invalid state without a message. `error` sets it implicitly. */
  readonly invalid = input(false);

  /** Set by the forms API through `setDisabledState`. */
  private readonly formDisabled = signal(false);
  /** True once the control has been blurred — mirrors `ng-touched`. */
  protected readonly touched = signal(false);

  /**
   * Inside a field, the field owns the id: its `<label for>` has to point at
   * this control, and only one of the two can win. Pass `id` to the field.
   *
   * Public, because a parent sometimes has to point at the control it wraps —
   * `<ds-password-field>`'s toggle says `aria-controls` with it.
   */
  readonly controlId = computed(
    () => this.field?.controlId() || this.id() || this.generatedId,
  );
  protected readonly labelId = computed(() => `${this.controlId()}-label`);
  protected readonly hintId = computed(() => `${this.controlId()}-hint`);
  protected readonly errorId = computed(() => `${this.controlId()}-error`);

  /** Disabled by input, by the form, or by the field around it. */
  protected readonly isDisabled = computed(
    () => this.disabled() || this.formDisabled() || !!this.field?.disabled(),
  );

  /** Required by input, or by the field whose label draws the asterisk. */
  protected readonly isRequired = computed(() => this.required() || !!this.field?.required());

  /** A message is a claim of invalidity; `aria-invalid` must agree with it. */
  protected readonly isInvalid = computed(
    () => this.invalid() || !!this.error() || !!this.field?.invalid(),
  );

  /** `aria-invalid`, or `null` so the attribute is absent when valid. */
  protected readonly ariaInvalid = computed(() => (this.isInvalid() ? 'true' : null));

  /** Only name the control by `ariaLabel` when no visible label will exist. */
  protected readonly ariaLabelAttr = computed(() =>
    this.label() ? null : this.ariaLabel() || null,
  );

  /** Is there anything under the control at all? Drives the field's rhythm. */
  protected readonly hasMessage = computed(() => !!this.hint() || !!this.error());

  /** Own hint, own error, the field's messages, then the consumer's description. */
  protected readonly describedByIds = computed(() =>
    joinIds(
      this.hint() ? this.hintId() : null,
      this.error() ? this.errorId() : null,
      this.field?.describedByIds(),
      this.describedBy(),
    ),
  );

  protected onChangeCallback: (value: T) => void = () => {};
  protected onTouchedCallback: () => void = () => {};

  /** Call on blur: marks the control touched, once, for the forms API. */
  protected markTouched(): void {
    this.touched.set(true);
    this.onTouchedCallback();
  }

  // —— ControlValueAccessor ——

  abstract writeValue(value: T): void;

  registerOnChange(fn: (value: T) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}
