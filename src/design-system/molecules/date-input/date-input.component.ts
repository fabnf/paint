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
import { ButtonComponent } from '../../primitives/button';
import { InputComponent } from '../../primitives/input';
import type { ControlSize } from '../../primitives/forms/form-control.types';
import {
  datePattern,
  formatDateInput,
  isWithin,
  longDateLabel,
  parseDateInput,
  type DateMatcher,
  type DateOrder,
  type IsoDate,
} from '../../utils';

/**
 * DateInput — a date you can type, and a button that asks for a calendar.
 *
 * A building block. It owns the text, the parsing and the affordance; it does
 * **not** own a popover, and it never will — the trigger reports
 * `aria-expanded` and emits, and the picker organism decides what to open. Give
 * it `ariaControls` once that dialog has an id.
 *
 * Typing is the fastest way to enter a date anybody already knows, which is why
 * this exists before the picker rather than inside it. The parser is generous
 * about separators (`4/3/26`, `04.03.2026`, `20260304`) and exact about the
 * result: anything it cannot turn into a real calendar date is an error, not a
 * guess. `31 February` is not a date.
 *
 * **The value is `yyyy-mm-dd`**, never a `Date`. Out-of-range dates are still
 * dates: the value is committed and the field is marked invalid, because the
 * user typed what they typed.
 *
 * @example
 * ```html
 * <ds-form-field label="Invoice date" hint="Any format: 4/3/26, 2026-03-04…">
 *   <ds-date-input [(value)]="date" [min]="today" (triggerClick)="openCalendar()" />
 * </ds-form-field>
 *
 * <ds-date-input label="Start" order="dmy" separator="/" formControlName="start" />
 * ```
 */
@Component({
  selector: 'ds-date-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InputComponent, ButtonComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateInputComponent),
      multi: true,
    },
  ],
  host: {
    '(focusout)': 'onFocusOut($event)',
    '(keydown.enter)': 'commit()',
    '(keydown.arrowdown)': 'requestCalendar($event)',
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
    >
      <!--
        The slot is static; the condition lives inside it. The trigger is an
        affordance, not a picker: it says a dialog would open, and emits.
      -->
      <span dsInputTrailing class="ds-date-input__trailing">
        @if (trigger()) {
          <ds-button
            class="ds-date-input__trigger"
            variant="ghost"
            size="sm"
            iconStart="calendar"
            [label]="triggerLabel()"
            [disabled]="isDisabled() || readOnly()"
            [ariaHasPopup]="triggerHasPopup() || null"
            [ariaExpanded]="open()"
            [ariaControls]="ariaControls() || null"
            (clicked)="toggleCalendar()"
          />
        }
      </span>
    </ds-input>

    <!--
      The date, spoken. A field reading "04/03/2026" is ambiguous in exactly the
      way this component's order input exists to resolve.
    -->
    <span class="visually-hidden" aria-live="polite">{{ spokenValue() }}</span>
  `,
  styles: `
    :host {
      display: block;
    }

    .ds-date-input__trailing {
      display: inline-flex;
      align-items: center;
    }

    .ds-date-input__trailing:empty {
      display: none;
    }

    /* Bootstrap's .btn reads its padding from custom properties, so the trigger
       is resized through Bootstrap's own API rather than by reaching inside the
       Button primitive's encapsulation. */
    .ds-date-input__trigger {
      --bs-btn-padding-y: 0.25rem;
      --bs-btn-padding-x: 0.25rem;
      --bs-btn-border-radius: var(--ds-radius-md);

      margin-inline-end: calc(var(--ds-space-1) * -1);
    }
  `,
})
export class DateInputComponent implements ControlValueAccessor {
  /** The date, `yyyy-mm-dd`, or `null` when the field is empty or unparseable. */
  readonly value = model<IsoDate | null>(null);
  /** The order of the three numbers, typed and displayed. */
  readonly order = input<DateOrder>('ymd');
  readonly separator = input<string>('-');
  readonly locale = input<string>('en-GB');
  /** Bounds, inclusive. A date outside them is still committed — and flagged. */
  readonly min = input<IsoDate | null>(null);
  readonly max = input<IsoDate | null>(null);
  /** Days inside the range that still cannot be used. The same predicate the calendar takes. */
  readonly dateDisabled = input<DateMatcher | null>(null);

  /** Visible label. Omit it inside a `<ds-form-field>`, which owns the label. */
  readonly label = input<string>('');
  readonly ariaLabel = input<string>('');
  /** Defaults to the pattern the `order` expects, e.g. `dd/mm/yyyy`. */
  readonly placeholder = input<string>('');
  readonly hint = input<string>('');
  /** The consumer's error. An unreadable or out-of-range date outranks it. */
  readonly error = input<string>('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly readOnly = input(false);
  readonly size = input<ControlSize>('md');
  readonly name = input<string>('');
  readonly icon = input<'calendar' | null>(null);

  readonly invalidMessage = input<string>('');
  readonly rangeMessage = input<string>('That date is outside the allowed range.');
  readonly unavailableMessage = input<string>('That date is not available.');

  /** The calendar affordance. The dialog it promises is the organism's problem. */
  readonly trigger = input(true);
  readonly triggerLabel = input<string>('Choose date');
  /**
   * What the trigger promises to open. `dialog` is the picker organism's answer;
   * an inline disclosure should say nothing at all, and let `aria-expanded` speak.
   */
  readonly triggerHasPopup = input<string>('dialog');
  /** Id of the thing the trigger controls, once something renders one. */
  readonly ariaControls = input<string>('');
  /** Whether that dialog is open. The trigger only reports it. */
  readonly open = model(false);

  /** Emits a committed value: on blur, on `Enter`, and on a clear. */
  readonly changed = output<IsoDate | null>();
  /** The user asked for a calendar. */
  readonly triggerClick = output<void>();

  /** What is in the box. Not the value: `"2026-03-0"` is neither a date nor empty. */
  protected readonly text = signal('');
  protected readonly unreadable = signal(false);

  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  private readonly control = viewChild.required(InputComponent);

  protected readonly pattern = computed(() => datePattern(this.order(), this.separator()));

  protected readonly outOfRange = computed(() => {
    const value = this.value();
    return !!value && !isWithin(value, this.min(), this.max());
  });

  protected readonly unavailable = computed(() => {
    const value = this.value();
    return !!value && !this.outOfRange() && (this.dateDisabled()?.(value) ?? false);
  });

  /** Format first, then range, then availability, and the consumer's complaint last. */
  protected readonly message = computed(() => {
    if (this.unreadable()) {
      return this.invalidMessage() || `Enter a date as ${this.pattern()}.`;
    }
    if (this.outOfRange()) {
      return this.rangeMessage();
    }
    return this.unavailable() ? this.unavailableMessage() : this.error();
  });

  /** "4 March 2026" — said once, when the value settles. */
  protected readonly spokenValue = computed(() => {
    const value = this.value();
    return value ? longDateLabel(value, this.locale()) : '';
  });

  constructor() {
    /*
     * The box follows the value, unless the box already *says* the value: a user
     * typing `2026-03-04` into a `dmy` field must not have it rewritten under
     * the caret the moment it parses.
     */
    effect(() => {
      const value = this.value();
      const typed = untracked(() => parseDateInput(this.text(), this.order()));

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
    // Typing is a fix in progress, not a new mistake.
    this.unreadable.set(false);
  }

  /** Commits on the way out, and on `Enter` — never on every keystroke. */
  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && (event.currentTarget as HTMLElement).contains(next)) {
      // Moving between the box and its own trigger is not leaving the field.
      return;
    }

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

    const parsed = parseDateInput(raw, this.order());

    if (!parsed) {
      // The text stays, so the user can see what they typed and fix it.
      this.unreadable.set(true);
      this.emit(null);
      return;
    }

    this.unreadable.set(false);
    this.text.set(formatDateInput(parsed, this.order(), this.separator()));
    this.emit(parsed);
  }

  protected toggleCalendar(): void {
    this.open.set(!this.open());
    this.triggerClick.emit();
  }

  /** `ArrowDown` is how a date field has asked for a calendar since Windows 95. */
  protected requestCalendar(event: Event): void {
    if (this.isDisabled() || this.readOnly() || !this.trigger() || this.open()) {
      return;
    }
    event.preventDefault();
    this.open.set(true);
    this.triggerClick.emit();
  }

  private emit(value: IsoDate | null): void {
    const changed = value !== this.value();
    this.value.set(value);
    this.onChangeCallback(value);

    if (changed) {
      this.changed.emit(value);
    }
  }

  private syncText(value: IsoDate | null): void {
    this.text.set(value ? formatDateInput(value, this.order(), this.separator()) : '');
    this.unreadable.set(false);
  }

  // —— ControlValueAccessor ——

  private onChangeCallback: (value: IsoDate | null) => void = () => {};
  protected onTouchedCallback: () => void = () => {};

  writeValue(value: IsoDate | null): void {
    // A form that starts at `''` has no date, and neither has this.
    const next = value || null;
    this.value.set(next);
    this.syncText(next);
  }

  registerOnChange(fn: (value: IsoDate | null) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}
