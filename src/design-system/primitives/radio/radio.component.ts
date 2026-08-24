import { ChangeDetectionStrategy, Component, computed, forwardRef, input, model, output } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { FieldMessagesComponent } from '../forms/field-chrome.component';
import { FormControlBase } from '../forms/form-control.base';
import { cx } from '../primitives.types';

/** What a radio can stand for. Ids, not indexes — a list can be reordered. */
export type RadioValue = string | number | boolean;

/**
 * Radio — the one-of-many atom.
 *
 * A real `<input type="radio" class="form-check-input">`. Radios that share a
 * `name` are a group in the browser's eyes, which is where the entire keyboard
 * pattern comes from for free: the group is **one** tab stop, arrows move and
 * select within it, and only the selected radio is tabbable. Re-implementing
 * that with a roving tabindex would, at best, arrive at the same place.
 *
 * A group needs a name of its own. Wrap it in a `<fieldset>` with a `<legend>`,
 * or in an element with `role="radiogroup"` and a label — a pile of radios is
 * not a question.
 *
 * Binding: every radio in a group binds the **same** `groupValue`, whether that
 * comes from `[(groupValue)]` or from one `formControlName` on each radio.
 *
 * @example
 * ```html
 * <fieldset>
 *   <legend>Deploy target</legend>
 *   <ds-radio name="target" value="staging" label="Staging" [(groupValue)]="target" />
 *   <ds-radio name="target" value="prod" label="Production" [(groupValue)]="target"
 *             hint="Visible to customers immediately." />
 * </fieldset>
 * ```
 */
@Component({
  selector: 'ds-radio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FieldMessagesComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioComponent),
      multi: true,
    },
  ],
  template: `
    <div [class]="fieldClasses()">
      <div [class]="classes()">
        <input
          #control
          class="form-check-input"
          type="radio"
          [id]="controlId()"
          [attr.name]="name() || null"
          [attr.value]="value()"
          [checked]="checked()"
          [disabled]="isDisabled()"
          [required]="isRequired()"
          [attr.aria-label]="ariaLabelAttr()"
          [attr.aria-describedby]="describedByIds()"
          [attr.aria-invalid]="ariaInvalid()"
          (change)="select()"
          (blur)="markTouched()"
        />

        <label class="form-check-label ds-check__label" [for]="controlId()">
          <span class="ds-check__text">{{ label() }}<ng-content /></span>
        </label>
      </div>

      <ds-field-messages
        class="ds-check__messages"
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

    .ds-field {
      --ds-check-indicator: var(--ds-control-indicator-md);
      --ds-check-gap: var(--ds-space-2);
    }

    .ds-field--sm {
      --ds-check-indicator: var(--ds-control-indicator-sm);
    }

    .ds-field--lg {
      --ds-check-indicator: var(--ds-control-indicator-lg);
    }

    .ds-check.form-check {
      display: flex;
      align-items: flex-start;
      gap: var(--ds-check-gap);
      min-height: 0;
      padding-left: 0;
      margin-bottom: 0;
    }

    .ds-check--sm {
      font-size: var(--ds-font-size-sm);
    }

    .ds-check--lg {
      font-size: var(--ds-font-size-lg);
    }

    /* Outranks Bootstrap's .form-check .form-check-input, which floats the box
       into a left padding; the flex row keeps a wrapping label aligned instead. */
    .ds-check .form-check-input {
      float: none;
      width: var(--ds-check-indicator);
      height: var(--ds-check-indicator);
      margin-top: calc((1em * var(--ds-line-height-normal) - var(--ds-check-indicator)) / 2);
      margin-left: 0;
      cursor: pointer;
    }

    .ds-check .form-check-input:disabled {
      cursor: not-allowed;
    }

    .ds-check--invalid .form-check-input:not(:checked) {
      border-color: var(--ds-color-danger);
    }

    .ds-check__label {
      cursor: pointer;
      line-height: var(--ds-line-height-normal);
    }

    .ds-check--disabled .ds-check__label,
    .ds-check--disabled .form-check-input {
      cursor: not-allowed;
      color: var(--ds-color-text-subtle);
    }

    .ds-check__messages {
      padding-inline-start: calc(var(--ds-check-indicator) + var(--ds-check-gap));
    }

    @media (prefers-reduced-motion: reduce) {
      .form-check-input {
        transition: none;
      }
    }
  `,
})
export class RadioComponent extends FormControlBase<RadioValue | null> {
  /** What this radio stands for. Reported when it is the one selected. */
  readonly value = input.required<RadioValue>();
  /**
   * The value selected across the group — shared by every radio that shares a
   * `name`. Two-way bindable, and written by the forms API.
   */
  readonly groupValue = model<RadioValue | null>(null);

  /** Emits this radio's value when the user selects it. */
  readonly selected = output<RadioValue>();

  protected readonly checked = computed(() => this.groupValue() === this.value());

  protected readonly fieldClasses = computed(() => cx('ds-field', `ds-field--${this.size()}`));

  protected readonly classes = computed(() =>
    cx(
      'form-check',
      'ds-check',
      `ds-check--${this.size()}`,
      this.isInvalid() && 'ds-check--invalid',
      this.isDisabled() && 'ds-check--disabled',
    ),
  );

  /**
   * A radio never unselects itself — the browser fires `change` only on the one
   * becoming selected, so there is nothing to toggle, only to report.
   */
  protected select(): void {
    const value = this.value();
    this.groupValue.set(value);
    this.onChangeCallback(value);
    this.markTouched();
    this.selected.emit(value);
  }

  writeValue(value: RadioValue | null): void {
    this.groupValue.set(value ?? null);
  }
}
