import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  forwardRef,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { FieldMessagesComponent } from '../forms/field-chrome.component';
import { FormControlBase } from '../forms/form-control.base';
import { cx } from '../primitives.types';

/** Which side of the track the label sits on. */
export type SwitchLabelPlacement = 'start' | 'end';

/**
 * Switch — the immediate-effect toggle atom.
 *
 * A native `<input type="checkbox" role="switch">` on Bootstrap's
 * `.form-switch`. `role="switch"` is the whole difference from a checkbox, and
 * it is a promise about behaviour, not about shape: a switch takes effect the
 * moment it moves. If the change only lands when the user presses *Save*, it is
 * a checkbox — use `ds-checkbox`, and stop lying about when the thing happened.
 *
 * Keyboard: `Space` toggles (the platform's), and `Enter` toggles too, because
 * a switch reads as a button and people press `Enter` on buttons.
 *
 * @example
 * ```html
 * <ds-switch label="Dark mode" [(checked)]="dark" />
 * <ds-switch label="Email digests" hint="A summary every Monday." formControlName="digests" />
 * <ds-switch label="Wi-Fi" labelPlacement="start" [(checked)]="wifi" />
 * ```
 */
@Component({
  selector: 'ds-switch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FieldMessagesComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SwitchComponent),
      multi: true,
    },
  ],
  template: `
    <div [class]="fieldClasses()">
      <div [class]="classes()">
        <!--
          A native checkbox carrying role="switch": the role changes what is
          announced ("on"/"off"), never what the control is. Space, focus,
          forced-colors and form submission stay the platform's job.
        -->
        <input
          #control
          class="form-check-input"
          type="checkbox"
          role="switch"
          [id]="controlId()"
          [attr.name]="name() || null"
          [checked]="checked()"
          [disabled]="isDisabled()"
          [required]="isRequired()"
          [attr.aria-label]="ariaLabelAttr()"
          [attr.aria-describedby]="describedByIds()"
          [attr.aria-invalid]="ariaInvalid()"
          (change)="onChange($event)"
          (keydown.enter)="onEnter($event)"
          (blur)="markTouched()"
        />

        <label class="form-check-label ds-switch__label" [for]="controlId()">
          <span class="ds-check__text">
            {{ label() }}<ng-content />
            @if (isRequired()) {
              <span class="ds-field__required" aria-hidden="true">*</span>
            }
          </span>
        </label>
      </div>

      <ds-field-messages
        class="ds-switch__messages"
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
      --ds-switch-track: var(--ds-control-switch-width-md);
      --ds-switch-height: var(--ds-control-indicator-md);
      --ds-switch-gap: var(--ds-space-2_5);
    }

    .ds-field--sm {
      --ds-switch-track: var(--ds-control-switch-width-sm);
      --ds-switch-height: var(--ds-control-indicator-sm);
    }

    .ds-field--lg {
      --ds-switch-track: var(--ds-control-switch-width-lg);
      --ds-switch-height: var(--ds-control-indicator-lg);
    }

    /* Bootstrap's .form-switch hangs the track in a left padding. Paint lays the
       row out with flex, which is what lets the label move to the other side. */
    .ds-switch.form-switch {
      display: flex;
      align-items: flex-start;
      gap: var(--ds-switch-gap);
      min-height: 0;
      padding-left: 0;
      margin-bottom: 0;
    }

    .ds-switch--start {
      flex-direction: row-reverse;
      justify-content: flex-end;
    }

    .ds-switch--sm {
      font-size: var(--ds-font-size-sm);
    }

    .ds-switch--lg {
      font-size: var(--ds-font-size-lg);
    }

    /* Outranks Bootstrap's .form-switch .form-check-input, which hangs the
       track in a negative margin Paint does not want. */
    .ds-switch .form-check-input {
      float: none;
      flex-shrink: 0;
      width: var(--ds-switch-track);
      height: var(--ds-switch-height);
      margin-top: calc((1em * var(--ds-line-height-normal) - var(--ds-switch-height)) / 2);
      margin-left: 0;
      margin-right: 0;
      cursor: pointer;
    }

    .ds-switch .form-check-input:disabled {
      cursor: not-allowed;
    }

    /* Off is a state, not an absence: the track must be visible against the page. */
    .ds-switch .form-check-input:not(:checked) {
      background-color: var(--ds-color-surface-sunken);
    }

    .ds-switch--invalid .form-check-input {
      border-color: var(--ds-color-danger);
    }

    .ds-switch--disabled .ds-switch__label,
    .ds-switch--disabled .form-check-input {
      cursor: not-allowed;
      color: var(--ds-color-text-subtle);
    }

    .ds-switch__label {
      cursor: pointer;
      line-height: var(--ds-line-height-normal);
    }

    .ds-switch--start .ds-switch__label {
      flex: 1 1 auto;
    }

    .ds-field__required {
      color: var(--ds-color-danger);
      margin-inline-start: 0.15em;
    }

    .ds-switch__messages {
      padding-inline-start: calc(var(--ds-switch-track) + var(--ds-switch-gap));
    }

    .ds-field--start .ds-switch__messages {
      padding-inline-start: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      .form-check-input {
        transition: none;
      }
    }
  `,
})
export class SwitchComponent extends FormControlBase<boolean> {
  /** On / off. Two-way bindable, and kept in sync with forms through CVA. */
  readonly checked = model(false);
  /** Put the label before the track — the settings-row layout. */
  readonly labelPlacement = input<SwitchLabelPlacement>('end');

  /** Emits on user interaction only — never when a form writes the value in. */
  readonly changed = output<boolean>();

  private readonly controlRef = viewChild<ElementRef<HTMLInputElement>>('control');

  protected readonly fieldClasses = computed(() =>
    cx('ds-field', `ds-field--${this.size()}`, `ds-field--${this.labelPlacement()}`),
  );

  protected readonly classes = computed(() =>
    cx(
      'form-check',
      'form-switch',
      'ds-switch',
      `ds-switch--${this.size()}`,
      `ds-switch--${this.labelPlacement()}`,
      this.isInvalid() && 'ds-switch--invalid',
      this.isDisabled() && 'ds-switch--disabled',
    ),
  );

  protected onChange(event: Event): void {
    this.commit((event.target as HTMLInputElement).checked);
  }

  /**
   * `Enter` is not a checkbox key, and a `<form>` would submit instead. A switch
   * looks and reads like a button, so it answers to `Enter` as well as `Space`.
   */
  protected onEnter(event: Event): void {
    if (this.isDisabled()) {
      return;
    }
    event.preventDefault();
    this.commit(!this.checked());
  }

  private commit(next: boolean): void {
    this.checked.set(next);
    this.onChangeCallback(next);
    this.changed.emit(next);
  }

  /** Focuses the control. */
  focus(): void {
    this.controlRef()?.nativeElement.focus();
  }

  writeValue(value: boolean | null): void {
    this.checked.set(!!value);
  }
}
