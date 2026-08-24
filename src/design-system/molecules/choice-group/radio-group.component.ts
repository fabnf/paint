import { ChangeDetectionStrategy, Component, computed, forwardRef, input, model, output, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { FieldMessagesComponent } from '../../primitives/forms/field-chrome.component';
import { DS_FIELD } from '../../primitives/forms/field-context';
import { describedBy as joinIds, type ControlSize } from '../../primitives/forms/form-control.types';
import { RadioComponent } from '../../primitives/radio';
import { uniqueId } from '../../utils';
import type { ChoiceOption, ChoiceOrientation, ChoiceValue } from './choice-group.types';

/**
 * RadioGroup — one question, a name for it, and one answer.
 *
 * The atom is already enough to render a radio. It is not enough to render a
 * *group*: a pile of radios with a heading above them is, to a screen reader,
 * three unrelated controls and a paragraph. The group is the thing that has a
 * name, a description and a validity — and the only markup that says so is a
 * `<fieldset>` with a `<legend>`.
 *
 * What this molecule owns:
 *
 * - The `<fieldset role="radiogroup">` and its `<legend>`, named and described.
 * - The shared `name`, which is what hands the arrow keys to the browser.
 * - The value, as `[(value)]` or through `ControlValueAccessor`.
 * - The hint and the error, in the same chrome as every other field.
 *
 * @example
 * ```html
 * <ds-radio-group
 *   legend="Deploy target"
 *   hint="Production is visible to customers immediately."
 *   [options]="targets"
 *   [(value)]="target"
 * />
 *
 * <ds-radio-group legend="Plan" [options]="plans" formControlName="plan" [error]="planError()" />
 * ```
 */
@Component({
  selector: 'ds-radio-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RadioComponent, FieldMessagesComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioGroupComponent),
      multi: true,
    },
    // A group is a field in its own right. Without this, a `<ds-form-field>`
    // further up would hand every radio the same id and the same label.
    { provide: DS_FIELD, useValue: null },
  ],
  template: `
    <fieldset
      class="ds-choice-group"
      role="radiogroup"
      [attr.aria-labelledby]="legend() ? legendId : null"
      [attr.aria-label]="legend() ? null : ariaLabel() || null"
      [attr.aria-describedby]="describedByIds()"
      [attr.aria-required]="required() ? 'true' : null"
      [attr.aria-orientation]="orientation() === 'horizontal' ? 'horizontal' : null"
      [disabled]="isDisabled()"
    >
      @if (legend() && !legendHidden()) {
        <!--
          A <legend> is the only element that names a <fieldset> natively — which
          is why a group cannot reuse the <label for> chrome: there is no single
          control to point at. It wears the same class, so it looks identical.
        -->
        <legend
          [id]="legendId"
          class="form-label ds-field__label ds-choice-group__legend"
          [class.ds-field__label--disabled]="isDisabled()"
        >
          {{ legend() }}
          @if (required()) {
            <span class="ds-field__required" aria-hidden="true">*</span>
          }
        </legend>
      } @else if (legend()) {
        <legend [id]="legendId" class="visually-hidden">{{ legend() }}</legend>
      }

      <!--
        The group's hint sits under its legend, above the options: below them it
        would read as a fourth option's hint. The error stays at the bottom,
        where the eye lands after the answer it is about.
      -->
      @if (hint()) {
        <p class="form-text ds-field__hint ds-choice-group__hint" [id]="hintId">{{ hint() }}</p>
      }

      <!--
        The group's hint sits under its legend, above the options: below them it
        would read as a fourth option's hint. The error stays at the bottom,
        where the eye lands after the answer it is about.
      -->
      @if (hint()) {
        <p class="form-text ds-field__hint ds-choice-group__hint" [id]="hintId">{{ hint() }}</p>
      }

      <div [class]="optionsClasses()">
        @for (option of options(); track option.value) {
          <!--
            invalid goes on the radios, not on the group: aria-invalid belongs
            where the user's focus lands, and the group's aria-describedby
            already carries the reason. Two sources would say it twice.
          -->
          <ds-radio
            [name]="groupName()"
            [value]="option.value"
            [label]="option.label"
            [hint]="option.hint || ''"
            [groupValue]="value()"
            [size]="size()"
            [disabled]="isDisabled() || !!option.disabled"
            [required]="required()"
            [invalid]="isInvalid()"
            (selected)="pick(option.value)"
          />
        }
      </div>

      <ds-field-messages
        class="ds-choice-group__messages"
        [error]="error()"
        [errorId]="errorId"
      />
    </fieldset>
  `,
  styles: `
    :host {
      display: block;
    }

    /* A fieldset brings a border, a margin and a legend with its own opinions. */
    .ds-choice-group {
      min-width: 0;
      margin: 0;
      padding: 0;
      border: 0;
    }

    .ds-choice-group__legend {
      float: none;
      width: auto;
      margin-bottom: var(--ds-space-2);
      padding: 0;
      font-size: inherit;
      line-height: inherit;
    }

    .ds-choice-group__hint {
      margin-block: calc(var(--ds-space-2) * -1) var(--ds-space-3);
    }

    .ds-choice-group__messages:has(p) {
      margin-block-start: var(--ds-space-3);
    }

    .ds-choice-group__hint {
      margin-block: calc(var(--ds-space-2) * -1) var(--ds-space-3);
    }

    .ds-choice-group__messages:has(p) {
      margin-block-start: var(--ds-space-3);
    }

    .ds-choice-group__options {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-3);
    }

    .ds-choice-group__options--horizontal {
      flex-direction: row;
      flex-wrap: wrap;
      gap: var(--ds-space-5);
    }
  `,
})
export class RadioGroupComponent<T extends ChoiceValue = ChoiceValue>
  implements ControlValueAccessor
{
  readonly options = input.required<readonly ChoiceOption<T>[]>();
  /** The selected value. Two-way bindable, and kept in sync with forms through CVA. */
  readonly value = model<T | null>(null);
  /** The question. Rendered as the `<legend>` that names the group. */
  readonly legend = input<string>('');
  /** Keeps the legend as the group's name, off the screen. */
  readonly legendHidden = input(false);
  /** Accessible name when there is no legend at all. */
  readonly ariaLabel = input<string>('');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly required = input(false);
  readonly invalid = input(false);
  readonly disabled = input(false);
  readonly size = input<ControlSize>('md');
  readonly orientation = input<ChoiceOrientation>('vertical');
  /** The shared `name`. Generated when omitted — it is what groups the radios. */
  readonly name = input<string>('');

  /** Emits on user selection only — never when a form writes the value in. */
  readonly changed = output<T>();

  private readonly generatedName = uniqueId('ds-radio-group');
  protected readonly legendId = uniqueId('ds-radio-group-legend');
  protected readonly hintId = uniqueId('ds-radio-group-hint');
  protected readonly errorId = uniqueId('ds-radio-group-error');

  private readonly formDisabled = signal(false);

  protected readonly groupName = computed(() => this.name() || this.generatedName);

  protected readonly isInvalid = computed(() => this.invalid() || !!this.error());

  protected readonly describedByIds = computed(() =>
    joinIds(this.hint() ? this.hintId : null, this.error() ? this.errorId : null),
  );

  protected readonly optionsClasses = computed(() =>
    this.orientation() === 'horizontal'
      ? 'ds-choice-group__options ds-choice-group__options--horizontal'
      : 'ds-choice-group__options',
  );

  /** Disabled by an input or by the forms API. `<fieldset disabled>` does the rest. */
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  protected pick(value: T): void {
    this.value.set(value);
    this.onChangeCallback(value);
    this.onTouchedCallback();
    this.changed.emit(value);
  }

  // —— ControlValueAccessor ——

  private onChangeCallback: (value: T | null) => void = () => {};
  private onTouchedCallback: () => void = () => {};

  writeValue(value: T | null): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: T | null) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}
