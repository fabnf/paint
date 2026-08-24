import { ChangeDetectionStrategy, Component, computed, forwardRef, input, model, output, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { CheckboxComponent } from '../../primitives/checkbox';
import { FieldMessagesComponent } from '../../primitives/forms/field-chrome.component';
import { DS_FIELD } from '../../primitives/forms/field-context';
import { describedBy as joinIds, type ControlSize } from '../../primitives/forms/form-control.types';
import { uniqueId } from '../../utils';
import type { ChoiceOption, ChoiceOrientation, ChoiceValue } from './choice-group.types';

/**
 * CheckboxGroup — one question, a name for it, and any number of answers.
 *
 * Unlike a radio group, a set of checkboxes is *not* an ARIA widget: there is no
 * `role="checkboxgroup"`, because the browser has nothing special to do with it.
 * What it needs is a `<fieldset>` and a `<legend>`, so the question is attached
 * to the answers — and an array, so the consumer is not left reducing five
 * booleans by hand.
 *
 * The "select all" master is a checkbox in the `mixed` state, which is native,
 * and which is the only reason the Checkbox atom has `indeterminate`.
 *
 * @example
 * ```html
 * <ds-checkbox-group
 *   legend="Scopes"
 *   hint="You can change these later."
 *   [options]="scopes"
 *   [selectAll]="true"
 *   [(value)]="granted"
 * />
 * ```
 */
@Component({
  selector: 'ds-checkbox-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CheckboxComponent, FieldMessagesComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxGroupComponent),
      multi: true,
    },
    // A group is a field in its own right. Without this, a `<ds-form-field>`
    // further up would hand every checkbox the same id and the same label.
    { provide: DS_FIELD, useValue: null },
  ],
  template: `
    <fieldset
      class="ds-choice-group"
      [attr.aria-describedby]="describedByIds()"
      [attr.aria-label]="legend() ? null : ariaLabel() || null"
      [disabled]="isDisabled()"
    >
      @if (legend() && !legendHidden()) {
        <legend
          class="form-label ds-field__label ds-choice-group__legend"
          [class.ds-field__label--disabled]="isDisabled()"
        >
          {{ legend() }}
          @if (required()) {
            <span class="ds-field__required" aria-hidden="true">*</span>
          }
        </legend>
      } @else if (legend()) {
        <legend class="visually-hidden">{{ legend() }}</legend>
      }

      <!--
        The group's hint sits under its legend, above the options: below them it
        would read as a fifth option's hint. The error stays at the bottom,
        where the eye lands after the answer it is about.
      -->
      @if (hint()) {
        <p class="form-text ds-field__hint ds-choice-group__hint" [id]="hintId">{{ hint() }}</p>
      }

      <!--
        The group's hint sits under its legend, above the options: below them it
        would read as a fifth option's hint. The error stays at the bottom,
        where the eye lands after the answer it is about.
      -->
      @if (hint()) {
        <p class="form-text ds-field__hint ds-choice-group__hint" [id]="hintId">{{ hint() }}</p>
      }

      @if (selectAll()) {
        <!--
          Mixed is a real state of a real checkbox, announced as "mixed". The
          master is not a third control: it is the same question, asked of all of
          them at once.
        -->
        <ds-checkbox
          class="ds-choice-group__master"
          [label]="selectAllLabel()"
          [checked]="allSelected()"
          [indeterminate]="someSelected()"
          [size]="size()"
          [disabled]="isDisabled()"
          (changed)="toggleAll($event)"
        />
      }

      <div [class]="optionsClasses()">
        @for (option of options(); track option.value) {
          <ds-checkbox
            [label]="option.label"
            [hint]="option.hint || ''"
            [checked]="isSelected(option.value)"
            [size]="size()"
            [disabled]="isDisabled() || !!option.disabled"
            [invalid]="isInvalid()"
            (changed)="toggle(option.value, $event)"
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

    /* The master asks the same question of every option, so it sits above them
       and the options indent under it. */
    .ds-choice-group__master {
      margin-block-end: var(--ds-space-3);
    }

    .ds-choice-group__master + .ds-choice-group__options {
      padding-inline-start: var(--ds-space-6);
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
export class CheckboxGroupComponent<T extends ChoiceValue = ChoiceValue>
  implements ControlValueAccessor
{
  readonly options = input.required<readonly ChoiceOption<T>[]>();
  /** The selected values, in the options' own order. Two-way bindable and form-bound. */
  readonly value = model<readonly T[]>([]);
  readonly legend = input<string>('');
  readonly legendHidden = input(false);
  readonly ariaLabel = input<string>('');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly required = input(false);
  readonly invalid = input(false);
  readonly disabled = input(false);
  readonly size = input<ControlSize>('md');
  readonly orientation = input<ChoiceOrientation>('vertical');
  /** A tri-state master checkbox above the options. */
  readonly selectAll = input(false);
  readonly selectAllLabel = input<string>('Select all');

  /** Emits on user interaction only — never when a form writes the value in. */
  readonly changed = output<readonly T[]>();

  protected readonly hintId = uniqueId('ds-checkbox-group-hint');
  protected readonly errorId = uniqueId('ds-checkbox-group-error');

  private readonly formDisabled = signal(false);

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly isInvalid = computed(() => this.invalid() || !!this.error());
  protected readonly describedByIds = computed(() =>
    joinIds(this.hint() ? this.hintId : null, this.error() ? this.errorId : null),
  );

  protected readonly optionsClasses = computed(() =>
    this.orientation() === 'horizontal'
      ? 'ds-choice-group__options ds-choice-group__options--horizontal'
      : 'ds-choice-group__options',
  );

  /** Only the options a user could actually tick count towards "all". */
  private readonly selectable = computed(() =>
    this.options().filter((option) => !option.disabled),
  );

  protected readonly allSelected = computed(
    () =>
      this.selectable().length > 0 &&
      this.selectable().every((option) => this.value().includes(option.value)),
  );

  protected readonly someSelected = computed(
    () =>
      !this.allSelected() &&
      this.selectable().some((option) => this.value().includes(option.value)),
  );

  protected isSelected(value: T): boolean {
    return this.value().includes(value);
  }

  protected toggle(value: T, checked: boolean): void {
    const next = checked
      ? // Keep the options' order, not the clicking order: a value array that
        // reshuffles itself is a diff nobody can read.
        this.options()
          .filter((option) => option.value === value || this.isSelected(option.value))
          .map((option) => option.value)
      : this.value().filter((selected) => selected !== value);

    this.commit(next);
  }

  /**
   * A mixed master resolves to all: "select all" is what the user came for.
   *
   * A disabled option the consumer pre-selected stays selected either way — the
   * user cannot untick it by hand, so the master must not do it for them.
   */
  protected toggleAll(checked: boolean): void {
    const next = this.options()
      .filter((option) =>
        checked ? !option.disabled || this.isSelected(option.value) : option.disabled && this.isSelected(option.value),
      )
      .map((option) => option.value);

    this.commit(next);
  }

  private commit(next: readonly T[]): void {
    this.value.set(next);
    this.onChangeCallback(next);
    this.onTouchedCallback();
    this.changed.emit(next);
  }

  // —— ControlValueAccessor ——

  private onChangeCallback: (value: readonly T[]) => void = () => {};
  private onTouchedCallback: () => void = () => {};

  writeValue(value: readonly T[] | null): void {
    this.value.set(value ?? []);
  }

  registerOnChange(fn: (value: readonly T[]) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}
