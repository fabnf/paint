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
import { clamp, percentOf, snapToGrid, stepValue } from '../../utils/number';
import { FieldLabelComponent, FieldMessagesComponent } from '../forms/field-chrome.component';
import { FormControlBase } from '../forms/form-control.base';
import { cx } from '../primitives.types';
import { toneClass, type Tone } from '../tone.types';

/**
 * Slider — the range atom.
 *
 * A native `<input type="range">` on Bootstrap's `.form-range`, with Paint's
 * label, value and message chrome around it and a track that shows how much of
 * the range is behind the thumb. Pointer, touch, form submission, forced
 * colours and the platform's own drag model are the browser's; Paint adds the
 * paint, and nails down the keyboard so every browser agrees:
 *
 * | Key | Effect |
 * | --- | --- |
 * | `←` `↓` | one `step` down |
 * | `→` `↑` | one `step` up |
 * | `Page Down` / `Page Up` | ten steps |
 * | `Home` / `End` | `min` / `max` |
 *
 * Use it when the *position* on a range is the point — volume, opacity, a
 * budget — and the exact number is secondary. When people need to type a value,
 * or read it precisely, that is a `<ds-number-input>`; the two make a good pair.
 *
 * `valueText` is what the number *means*, for a screen reader and for the
 * visible value label: `"18 GB"` beats `"18"`.
 *
 * @example
 * ```html
 * <ds-slider label="Volume" [(value)]="volume" [showValue]="true" />
 * <ds-slider label="Opacity" [min]="0" [max]="1" [step]="0.05" [(value)]="opacity" />
 * <ds-slider label="Budget" [max]="5000" [step]="100" [valueText]="'$' + budget()" [showValue]="true"
 *            formControlName="budget" />
 * ```
 */
@Component({
  selector: 'ds-slider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FieldLabelComponent, FieldMessagesComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SliderComponent),
      multi: true,
    },
  ],
  template: `
    <div [class]="fieldClasses()">
      @if (label() || showValue()) {
        <div class="ds-slider__header">
          @if (label()) {
            <ds-field-label
              [for]="controlId()"
              [text]="label()"
              [required]="isRequired()"
              [disabled]="isDisabled()"
            />
          }
          @if (showValue()) {
            <!-- The control already announces its value (aria-valuenow /
                 aria-valuetext); the visible number is for eyes only. -->
            <span class="ds-slider__value" aria-hidden="true">{{ displayValue() }}</span>
          }
        </div>
      }

      <input
        #control
        type="range"
        [class]="controlClasses()"
        [id]="controlId()"
        [attr.name]="name() || null"
        [min]="min()"
        [max]="max()"
        [step]="step()"
        [value]="current()"
        [disabled]="isDisabled()"
        [style.--ds-slider-fill]="percent() + '%'"
        [attr.aria-label]="ariaLabelAttr()"
        [attr.aria-describedby]="describedByIds()"
        [attr.aria-invalid]="ariaInvalid()"
        [attr.aria-valuetext]="valueText() || null"
        (input)="onInput($event)"
        (change)="changed.emit(current())"
        (keydown)="onKeydown($event)"
        (blur)="markTouched()"
      />

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

    .ds-field {
      --ds-slider-track: 0.375rem;
      --ds-slider-thumb: var(--ds-control-indicator-md);
    }

    .ds-field--sm {
      --ds-slider-track: 0.25rem;
      --ds-slider-thumb: var(--ds-control-indicator-sm);
    }

    .ds-field--lg {
      --ds-slider-track: 0.5rem;
      --ds-slider-thumb: var(--ds-control-indicator-lg);
    }

    .ds-slider__header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--ds-space-3);
    }

    /* The label's own bottom margin keeps the rhythm; the header only adds the value. */
    .ds-slider__header ds-field-label {
      flex: 1 1 auto;
      min-width: 0;
    }

    .ds-slider__value {
      margin-bottom: var(--ds-space-1_5);
      font-family: var(--ds-font-mono);
      font-size: var(--ds-font-size-xs);
      font-variant-numeric: tabular-nums;
      color: var(--ds-color-text-muted);
    }

    /* —— The control ——
       Bootstrap's .form-range resets the native input and sizes it around the
       thumb. Paint repaints the two pseudo-elements from its tokens: the track
       is a gradient that switches from the tone to the border colour at the
       thumb's position, which is the whole "how much is behind me" story. */
    .ds-slider__control {
      --ds-slider-fill: 0%;

      height: calc(var(--ds-slider-thumb) + 6px);
      cursor: pointer;
    }

    .ds-slider__control:disabled {
      cursor: not-allowed;
    }

    .ds-slider__control::-webkit-slider-runnable-track {
      height: var(--ds-slider-track);
      border-radius: var(--ds-radius-full);
      background-color: var(--ds-color-border);
      background-image: linear-gradient(
        to right,
        var(--ds-tone-solid) var(--ds-slider-fill),
        transparent var(--ds-slider-fill)
      );
    }

    .ds-slider__control::-moz-range-track {
      height: var(--ds-slider-track);
      border-radius: var(--ds-radius-full);
      background-color: var(--ds-color-border);
    }

    .ds-slider__control::-moz-range-progress {
      height: var(--ds-slider-track);
      border-radius: var(--ds-radius-full);
      background-color: var(--ds-tone-solid);
    }

    :host-context([dir='rtl']) .ds-slider__control::-webkit-slider-runnable-track {
      background-image: linear-gradient(
        to left,
        var(--ds-tone-solid) var(--ds-slider-fill),
        transparent var(--ds-slider-fill)
      );
    }

    .ds-slider__control::-webkit-slider-thumb {
      width: var(--ds-slider-thumb);
      height: var(--ds-slider-thumb);
      margin-top: calc((var(--ds-slider-track) - var(--ds-slider-thumb)) / 2);
      border: 2px solid var(--ds-tone-solid);
      border-radius: var(--ds-radius-full);
      background-color: var(--ds-color-surface);
      background-image: none;
      box-shadow: var(--ds-shadow-sm);
      transition: box-shadow 120ms ease;
    }

    .ds-slider__control::-moz-range-thumb {
      width: var(--ds-slider-thumb);
      height: var(--ds-slider-thumb);
      border: 2px solid var(--ds-tone-solid);
      border-radius: var(--ds-radius-full);
      background-color: var(--ds-color-surface);
      background-image: none;
      box-shadow: var(--ds-shadow-sm);
      transition: box-shadow 120ms ease;
    }

    .ds-slider__control:active::-webkit-slider-thumb {
      background-color: var(--ds-tone-bg);
    }

    .ds-slider__control:active::-moz-range-thumb {
      background-color: var(--ds-tone-bg);
    }

    /* Bootstrap draws a focus ring on :focus; Paint's is the shared control
       ring, and only for the keyboard — a pointer already knows where it is. */
    .ds-slider__control:focus::-webkit-slider-thumb {
      box-shadow: var(--ds-shadow-sm);
    }

    .ds-slider__control:focus::-moz-range-thumb {
      box-shadow: var(--ds-shadow-sm);
    }

    .ds-slider__control:focus-visible::-webkit-slider-thumb {
      box-shadow: var(--ds-control-focus-ring);
    }

    .ds-slider__control:focus-visible::-moz-range-thumb {
      box-shadow: var(--ds-control-focus-ring);
    }

    .ds-slider__control--invalid::-webkit-slider-thumb {
      border-color: var(--ds-color-danger);
    }

    .ds-slider__control--invalid::-moz-range-thumb {
      border-color: var(--ds-color-danger);
    }

    .ds-slider__control:disabled::-webkit-slider-runnable-track {
      background-image: linear-gradient(
        to right,
        var(--ds-color-border-strong) var(--ds-slider-fill),
        transparent var(--ds-slider-fill)
      );
    }

    .ds-slider__control:disabled::-moz-range-progress {
      background-color: var(--ds-color-border-strong);
    }

    .ds-slider__control:disabled::-webkit-slider-thumb {
      border-color: var(--ds-color-border-strong);
      background-color: var(--ds-color-surface-sunken);
      box-shadow: none;
    }

    .ds-slider__control:disabled::-moz-range-thumb {
      border-color: var(--ds-color-border-strong);
      background-color: var(--ds-color-surface-sunken);
      box-shadow: none;
    }

    @media (forced-colors: active) {
      .ds-slider__control::-webkit-slider-runnable-track {
        background-image: none;
        border: 1px solid CanvasText;
      }

      .ds-slider__control::-webkit-slider-thumb {
        border-color: CanvasText;
        background-color: Canvas;
      }

      .ds-slider__control:focus-visible {
        outline: 2px solid;
        outline-offset: 2px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ds-slider__control::-webkit-slider-thumb,
      .ds-slider__control::-moz-range-thumb {
        transition: none;
      }
    }
  `,
})
export class SliderComponent extends FormControlBase<number> {
  /** The position on the range. Always a number, always inside `[min, max]`. */
  readonly value = model(0);
  readonly min = input(0);
  readonly max = input(100);
  /** Distance between two positions. Values written in are snapped to it. */
  readonly step = input(1);
  /** Show the value (or `valueText`) next to the label. */
  readonly showValue = input(false);
  /**
   * What the number means: `"18 GB"`, `"45%"`, `"3 of 10"`. Becomes
   * `aria-valuetext`, and the visible value when `showValue` is on.
   */
  readonly valueText = input<string>('');
  /** The colour of the filled track and the thumb's ring. */
  readonly tone = input<Tone>('primary');

  /** Emits on every movement — each drag step, each key press. */
  readonly valueInput = output<number>();
  /** Emits when a movement is over: the pointer is released, or a key was pressed. */
  readonly changed = output<number>();

  private readonly controlRef = viewChild<ElementRef<HTMLInputElement>>('control');

  /** The model, snapped to the grid — so a written `57` on a `step=5` track shows `55`. */
  protected readonly current = computed(() =>
    snapToGrid(this.value(), this.step(), this.min(), this.max()),
  );

  protected readonly percent = computed(() => percentOf(this.current(), this.min(), this.max()));

  protected readonly displayValue = computed(() => this.valueText() || String(this.current()));

  protected readonly fieldClasses = computed(() => cx('ds-field', `ds-field--${this.size()}`));

  protected readonly controlClasses = computed(() =>
    cx(
      'form-range',
      'ds-slider__control',
      toneClass(this.tone()),
      this.isInvalid() && 'ds-slider__control--invalid',
    ),
  );

  /** Focuses the control. */
  focus(): void {
    this.controlRef()?.nativeElement.focus();
  }

  protected onInput(event: Event): void {
    this.commit(Number((event.target as HTMLInputElement).value));
  }

  /**
   * The keyboard is handled here rather than left to the platform, because the
   * platform does not agree with itself: Home/End and Page keys work in some
   * browsers and not others. The arrows are re-stated so all six keys come
   * from one place and can be asserted.
   */
  protected onKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) {
      return;
    }

    const min = this.min();
    const max = this.max();
    const step = this.step() > 0 ? this.step() : 1;
    const current = this.current();
    let next: number;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = stepValue(current, 1, step, min, max);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = stepValue(current, -1, step, min, max);
        break;
      case 'PageUp':
        next = snapToGrid(current + step * 10, step, min, max);
        break;
      case 'PageDown':
        next = snapToGrid(current - step * 10, step, min, max);
        break;
      case 'Home':
        next = min;
        break;
      case 'End':
        next = max;
        break;
      default:
        return;
    }

    event.preventDefault();
    if (next !== current) {
      this.commit(next);
    }
    // A key press is a whole gesture: it starts and ends in one go.
    this.changed.emit(this.current());
  }

  private commit(next: number): void {
    const value = clamp(next, this.min(), this.max());
    this.value.set(value);
    this.onChangeCallback(value);
    this.valueInput.emit(value);
  }

  writeValue(value: number | null): void {
    this.value.set(typeof value === 'number' && Number.isFinite(value) ? value : this.min());
  }
}
