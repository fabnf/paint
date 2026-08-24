import { ChangeDetectionStrategy, Component, computed, forwardRef, input, model, output } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { FieldMessagesComponent } from '../forms/field-chrome.component';
import { FormControlBase } from '../forms/form-control.base';
import { cx } from '../primitives.types';

/**
 * Checkbox — the independent-choice atom.
 *
 * A real `<input type="checkbox" class="form-check-input">` with Paint's label,
 * hint and error chrome. The indicator is the browser's: `Space` toggles it,
 * `Tab` reaches it, Windows High Contrast paints it, and `indeterminate` is
 * announced as `mixed` without a line of ARIA.
 *
 * The label is the control's click target, not a caption beside it.
 *
 * @example
 * ```html
 * <ds-checkbox label="Remember me" [(checked)]="remember" />
 * <ds-checkbox label="Ship it" hint="Deploys to production." formControlName="ship" />
 *
 * <!-- Tri-state parent of a checkbox list -->
 * <ds-checkbox
 *   label="Select all"
 *   [checked]="allChecked()"
 *   [indeterminate]="someChecked()"
 *   (checkedChange)="toggleAll($event)"
 * />
 * ```
 */
@Component({
  selector: 'ds-checkbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FieldMessagesComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    },
  ],
  template: `
    <div [class]="fieldClasses()">
      <div [class]="classes()">
        <input
          #control
          class="form-check-input"
          type="checkbox"
          [id]="controlId()"
          [attr.name]="name() || null"
          [checked]="checked()"
          [indeterminate]="indeterminate()"
          [disabled]="isDisabled()"
          [required]="isRequired()"
          [attr.value]="checkValue()"
          [attr.aria-label]="ariaLabelAttr()"
          [attr.aria-describedby]="describedByIds()"
          [attr.aria-invalid]="ariaInvalid()"
          (change)="onChange($event)"
          (blur)="markTouched()"
        />

        <label class="form-check-label ds-check__label" [for]="controlId()">
          <span class="ds-check__text">
            {{ label() }}<ng-content />
            @if (isRequired()) {
              <span class="ds-field__required" aria-hidden="true">*</span>
            }
          </span>
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

    /* One source for the indicator size, so the control and the messages that
       hang under its label agree on where the text column starts. */
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
      /* Bootstrap's .form-check floats the input into a left padding; Paint
         lays the row out with flex so a two-line label stays aligned. */
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
      /* Centre the box on the first line of the label, at any type size. */
      margin-top: calc((1em * var(--ds-line-height-normal) - var(--ds-check-indicator)) / 2);
      margin-left: 0;
      cursor: pointer;
    }

    .ds-check .form-check-input:disabled {
      cursor: not-allowed;
    }

    .ds-check--invalid .form-check-input:not(:checked):not(:indeterminate) {
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

    .ds-field__required {
      color: var(--ds-color-danger);
      margin-inline-start: 0.15em;
    }

    /* Messages line up under the label, not under the box. */
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
export class CheckboxComponent extends FormControlBase<boolean> {
  /** Checked state. Two-way bindable, and kept in sync with forms through CVA. */
  readonly checked = model(false);
  /**
   * Neither checked nor unchecked — the state of a "select all" box over a
   * partial selection. Native, so it is announced as `mixed`.
   */
  readonly indeterminate = model(false);
  /** `value` of the native control, for native form submission. */
  readonly checkValue = input<string | null>(null, { alias: 'value' });

  /** Emits on user interaction only — never when a form writes the value in. */
  readonly changed = output<boolean>();

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
   * Clicking a mixed checkbox resolves it — to checked, because the user's
   * intent in a "select all" box is to select all.
   */
  protected onChange(event: Event): void {
    const next = (event.target as HTMLInputElement).checked;

    this.indeterminate.set(false);
    this.checked.set(next);
    this.onChangeCallback(next);
    this.changed.emit(next);
  }

  writeValue(value: boolean | null): void {
    this.checked.set(!!value);
  }
}
