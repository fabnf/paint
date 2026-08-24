import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { InputComponent } from '../../primitives/input';
import type { ControlSize } from '../../primitives/forms/form-control.types';
import {
  addMinutes,
  clampTime,
  formatTimeInput,
  isTimeWithin,
  parseTimeInput,
  snapToStep,
  spokenTime,
  type IsoTime,
} from '../../utils';

/**
 * TimeInput — a time you can type, and step with the arrow keys.
 *
 * A building block, like its sibling. There is no dropdown of times, because a
 * list of 96 quarter-hours is not a picker, it is a punishment — and because the
 * organism that wants one can build it out of `<ds-menu>`.
 *
 * **The value is 24-hour**, `HH:mm` (or `HH:mm:ss`). `hour12` changes the
 * display and what the parser accepts back, never what the model holds; a form
 * posting `09:30` cannot care where the user lives.
 *
 * The parser takes what people type: `9` → `09:00`, `930` → `09:30`,
 * `9:30 pm` → `21:30`, `12am` → `00:00`. `ArrowUp` / `ArrowDown` step by `step`
 * minutes, `PageUp` / `PageDown` by an hour, and stepping never leaves
 * `[min, max]`.
 *
 * @example
 * ```html
 * <ds-form-field label="Starts at" hint="24-hour, or 9:30 pm.">
 *   <ds-time-input [(value)]="start" [step]="15" />
 * </ds-form-field>
 *
 * <ds-time-input label="Opens" [hour12]="true" min="06:00" max="23:00" formControlName="opens" />
 * ```
 */
@Component({
  selector: 'ds-time-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InputComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimeInputComponent),
      multi: true,
    },
  ],
  host: {
    '(focusout)': 'onFocusOut()',
    '(keydown.enter)': 'commit()',
    '(keydown.arrowup)': 'stepBy($event, 1)',
    '(keydown.arrowdown)': 'stepBy($event, -1)',
    '(keydown.pageup)': 'stepBy($event, 60, true)',
    '(keydown.pagedown)': 'stepBy($event, -60, true)',
  },
  template: `
    <ds-input
      #control
      type="text"
      inputMode="numeric"
      autocomplete="off"
      [label]="label()"
      [ariaLabel]="ariaLabel()"
      [placeholder]="placeholder() || pattern()"
      [value]="text()"
      [size]="size()"
      [hint]="hint()"
      [error]="message()"
      [required]="required()"
      [disabled]="isDisabled()"
      [readOnly]="readOnly()"
      [name]="name()"
      [iconStart]="icon()"
      (valueInput)="onInput($event)"
    />

    <!-- The time, spoken in the reader's own clock once it settles. -->
    <span class="visually-hidden" aria-live="polite">{{ spokenValue() }}</span>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class TimeInputComponent implements ControlValueAccessor {
  /** The time, 24-hour `HH:mm`, or `null` when the field is empty or unreadable. */
  readonly value = model<IsoTime | null>(null);
  /** Display and parse a twelve-hour clock. The value stays 24-hour. */
  readonly hour12 = input(false);
  readonly withSeconds = input(false);
  /** Minutes per arrow-key step. `15` is a meeting; `1` is a stopwatch. */
  readonly step = input(1);
  /** Bounds, inclusive. Stepping respects them; typing reports them. */
  readonly min = input<IsoTime | null>(null);
  readonly max = input<IsoTime | null>(null);
  readonly locale = input<string>('en-GB');

  readonly label = input<string>('');
  readonly ariaLabel = input<string>('');
  readonly placeholder = input<string>('');
  readonly hint = input<string>('');
  /** The consumer's error. An unreadable or out-of-range time outranks it. */
  readonly error = input<string>('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly readOnly = input(false);
  readonly size = input<ControlSize>('md');
  readonly name = input<string>('');
  readonly icon = input<'clock' | null>('clock');

  readonly invalidMessage = input<string>('');
  readonly rangeMessage = input<string>('That time is outside the allowed range.');

  /** Emits a committed value: on blur, on `Enter`, and on every step. */
  readonly changed = output<IsoTime | null>();

  protected readonly text = signal('');
  protected readonly unreadable = signal(false);

  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  private readonly control = viewChild.required(InputComponent);

  protected readonly pattern = computed(() => {
    const base = this.hour12() ? 'h:mm' : 'hh:mm';
    const withSeconds = this.withSeconds() ? `${base}:ss` : base;
    return this.hour12() ? `${withSeconds} am` : withSeconds;
  });

  protected readonly outOfRange = computed(() => {
    const value = this.value();
    return !!value && !isTimeWithin(value, this.min(), this.max());
  });

  protected readonly message = computed(() => {
    if (this.unreadable()) {
      return this.invalidMessage() || `Enter a time as ${this.pattern()}.`;
    }
    return this.outOfRange() ? this.rangeMessage() : this.error();
  });

  protected readonly spokenValue = computed(() => {
    const value = this.value();
    return value ? spokenTime(value, this.locale(), this.withSeconds()) : '';
  });

  constructor() {
    // The box follows the value, unless the box already says the value.
    effect(() => {
      const value = this.value();
      const typed = untracked(() => parseTimeInput(this.text(), this.withSeconds()));

      if (typed !== value) {
        this.syncText(value);
      }
    });
  }

  /** Focuses the text box. */
  focus(): void {
    this.control().focus();
  }

  protected onInput(next: string | number | null): void {
    this.text.set(next === null ? '' : String(next));
    this.unreadable.set(false);
  }

  protected onFocusOut(): void {
    this.commit();
    this.onTouchedCallback();
  }

  protected commit(): void {
    const raw = this.text().trim();

    if (!raw) {
      this.unreadable.set(false);
      this.emit(null);
      return;
    }

    const parsed = parseTimeInput(raw, this.withSeconds());

    if (!parsed) {
      this.unreadable.set(true);
      this.emit(null);
      return;
    }

    this.unreadable.set(false);
    this.text.set(this.format(parsed));
    this.emit(parsed);
  }

  /**
   * `ArrowUp` on an empty field starts at the earliest time it is allowed to
   * offer — there is nothing to step from, and 00:00 is rarely the answer when a
   * `min` exists.
   */
  protected stepBy(event: Event, minutes: number, whole = false): void {
    if (this.isDisabled() || this.readOnly()) {
      return;
    }

    event.preventDefault();

    const current = this.value() ?? parseTimeInput(this.text(), this.withSeconds());
    const delta = whole ? minutes : minutes * Math.max(1, this.step());

    const next = current
      ? addMinutes(current, delta, this.withSeconds())
      : snapToStep(this.min() ?? '00:00', this.step(), this.withSeconds());

    // Stepping is a nudge, not an escape: it stays inside the bounds.
    const clamped = clampTime(next, this.min(), this.max());

    this.unreadable.set(false);
    this.text.set(this.format(clamped));
    this.emit(clamped);
  }

  private format(time: IsoTime): string {
    return formatTimeInput(time, this.hour12(), this.withSeconds());
  }

  private emit(value: IsoTime | null): void {
    const changed = value !== this.value();
    this.value.set(value);
    this.onChangeCallback(value);

    if (changed) {
      this.changed.emit(value);
    }
  }

  private syncText(value: IsoTime | null): void {
    this.text.set(value ? this.format(value) : '');
    this.unreadable.set(false);
  }

  // —— ControlValueAccessor ——

  private onChangeCallback: (value: IsoTime | null) => void = () => {};
  protected onTouchedCallback: () => void = () => {};

  writeValue(value: IsoTime | null): void {
    const next = value || null;
    this.value.set(next);
    this.syncText(next);
  }

  registerOnChange(fn: (value: IsoTime | null) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}
