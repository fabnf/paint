import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { CalendarComponent } from '../../molecules/calendar';
import { DateInputComponent } from '../../molecules/date-input';
import type { ControlSize } from '../../primitives/forms/form-control.types';
import {
  todayIso,
  uniqueId,
  type DateMatcher,
  type DateOrder,
  type IsoDate,
  type WeekStart,
} from '../../utils';

/**
 * DatePicker — the organism the date molecules were waiting for.
 *
 * A `<ds-date-input>` and a `<ds-calendar>`, finally introduced to each other.
 * The molecules deliberately stopped short of this: the input's trigger *only
 * asks*, and the calendar renders a month and no more. This organism owns
 * everything they refused to — the anchored `role="dialog"`, moving focus into
 * the grid when it opens, returning it to the field when a day is picked, and
 * the Menu's dismissal contract: Escape restores focus, an outside click just
 * closes, and Tab is never held.
 *
 * Typing stays first-class: the popover is an alternative, not the entry. The
 * field parses what people type (`4/3/26`, `2026-03-04`), `ArrowDown` asks for
 * the calendar the way date fields always have, and the grid opens on the typed
 * day. **The value is `yyyy-mm-dd`**, never a `Date`.
 *
 * Implements `ControlValueAccessor`, so it drops into `ngModel` / reactive
 * forms as-is, and sits inside a `<ds-form-field>` like any other control.
 *
 * @example
 * ```html
 * <ds-form-field label="Invoice date" hint="Type it, or press ArrowDown.">
 *   <ds-date-picker [(value)]="date" [min]="today" />
 * </ds-form-field>
 *
 * <ds-date-picker label="Start" [dateDisabled]="isWeekend" formControlName="start" />
 * ```
 */
@Component({
  selector: 'ds-date-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DateInputComponent, CalendarComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
  ],
  host: {
    '(keydown)': 'onKeydown($event)',
    '(focusout)': 'onFocusOut($event)',
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    <ds-date-input
      #field
      [(value)]="value"
      [(open)]="open"
      [ariaControls]="panelId"
      [order]="order()"
      [separator]="separator()"
      [locale]="locale()"
      [min]="min()"
      [max]="max()"
      [dateDisabled]="dateDisabled()"
      [label]="label()"
      [ariaLabel]="ariaLabel()"
      [placeholder]="placeholder()"
      [hint]="hint()"
      [error]="error()"
      [required]="required()"
      [disabled]="isDisabled()"
      [readOnly]="readOnly()"
      [size]="size()"
      [name]="name()"
      [triggerLabel]="triggerLabel()"
      (changed)="onTyped($event)"
    />

    @if (open()) {
      <div
        #panel
        class="ds-date-picker__panel"
        role="dialog"
        [id]="panelId"
        [class.ds-date-picker__panel--up]="dropUp()"
        [attr.aria-label]="dialogLabel()"
      >
        <ds-calendar
          #calendar
          [(value)]="value"
          [min]="min()"
          [max]="max()"
          [dateDisabled]="dateDisabled()"
          [weekStart]="weekStart()"
          [locale]="locale()"
          [showWeekNumbers]="showWeekNumbers()"
          [today]="today()"
          (daySelected)="onPicked($event)"
        />
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      position: relative;
    }

    .ds-date-picker__panel {
      position: absolute;
      inset-block-start: calc(100% + var(--ds-space-1_5));
      inset-inline-start: 0;
      z-index: 1070;
      padding: var(--ds-space-3);
      background: var(--ds-color-surface);
      border: 1px solid var(--ds-color-border);
      border-radius: var(--ds-radius-lg);
      box-shadow: var(--ds-shadow-lg);
      animation: ds-date-picker-in 120ms ease-out;
      transform-origin: top center;
    }

    .ds-date-picker__panel--up {
      inset-block-start: auto;
      inset-block-end: calc(100% + var(--ds-space-1_5));
      transform-origin: bottom center;
    }

    @keyframes ds-date-picker-in {
      from {
        opacity: 0;
        transform: translateY(-0.25rem) scale(0.98);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ds-date-picker__panel {
        animation: none;
      }
    }
  `,
})
export class DatePickerComponent implements ControlValueAccessor {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The date, `yyyy-mm-dd`, or `null`. Two-way bindable. */
  readonly value = model<IsoDate | null>(null);

  // —— passed through to the date input ——
  readonly order = input<DateOrder>('ymd');
  readonly separator = input<string>('-');
  readonly locale = input<string>('en-GB');
  /** Bounds, inclusive. Shared by the field's validation and the grid. */
  readonly min = input<IsoDate | null>(null);
  readonly max = input<IsoDate | null>(null);
  /** Days inside the range that still cannot be picked. One predicate, both views. */
  readonly dateDisabled = input<DateMatcher | null>(null);
  /** Visible label. Omit it inside a `<ds-form-field>`, which owns the label. */
  readonly label = input<string>('');
  readonly ariaLabel = input<string>('');
  readonly placeholder = input<string>('');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly readOnly = input(false);
  readonly size = input<ControlSize>('md');
  readonly name = input<string>('');
  readonly triggerLabel = input<string>('Choose date');

  // —— passed through to the calendar ——
  readonly weekStart = input<WeekStart | null>(null);
  readonly showWeekNumbers = input(false);
  /** Injectable clock: pass it in tests, and the grid agrees with the assertions. */
  readonly today = input<IsoDate>(todayIso());

  /** The dialog's accessible name. */
  readonly dialogLabel = input<string>('Choose date');

  /** Emits every committed change: typed, picked or cleared. */
  readonly changed = output<IsoDate | null>();
  /** Emits on every open/close of the calendar dialog. */
  readonly openChange = output<boolean>();

  /** Whether the calendar dialog is open. Shared with the field's aria-expanded. */
  protected readonly open = signal(false);
  protected readonly dropUp = signal(false);
  protected readonly panelId = uniqueId('ds-date-picker');

  private readonly fieldRef = viewChild.required(DateInputComponent);
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly calendarRef = viewChild(CalendarComponent);

  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  private lastOpen = false;

  constructor() {
    // The field's trigger and ArrowDown both flip `open` — the organism answers
    // by placing the panel and moving focus into the grid, after it exists.
    effect(() => {
      const open = this.open();
      if (open === this.lastOpen) {
        return;
      }
      this.lastOpen = open;
      this.openChange.emit(open);

      if (open) {
        setTimeout(() => {
          this.updatePlacement();
          this.calendarRef()?.focus();
        });
      }
    });
  }

  /** Opens the calendar dialog from code. */
  openPicker(): void {
    if (!this.isDisabled() && !this.readOnly()) {
      this.open.set(true);
    }
  }

  /** Closes the calendar dialog from code. */
  close(restoreFocus = false): void {
    if (!this.open()) {
      return;
    }
    this.open.set(false);
    if (restoreFocus) {
      this.fieldRef().focus();
    }
  }

  protected onPicked(iso: IsoDate): void {
    // Picking is committing: close, and put focus back where typing happens.
    this.close(true);
    this.propagate(iso);
  }

  protected onTyped(value: IsoDate | null): void {
    this.propagate(value);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.open()) {
      event.preventDefault();
      event.stopPropagation();
      this.close(true);
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && this.host.nativeElement.contains(next)) {
      return;
    }

    // Tab is never held: focus leaving closes the dialog behind itself.
    if (this.open()) {
      this.open.set(false);
    }
    this.onTouchedCallback();
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  /** Flip above the field when the space below runs out — the Menu's check. */
  private updatePlacement(): void {
    const panel = this.panelRef()?.nativeElement;
    if (!panel || typeof window === 'undefined') {
      return;
    }

    const hostRect = this.host.nativeElement.getBoundingClientRect();
    const panelHeight = panel.offsetHeight;
    const spaceBelow = window.innerHeight - hostRect.bottom;

    this.dropUp.set(spaceBelow < panelHeight + 16 && hostRect.top > panelHeight + 16);
  }

  private propagate(value: IsoDate | null): void {
    this.onChangeCallback(value);
    this.changed.emit(value);
  }

  // —— ControlValueAccessor ——

  private onChangeCallback: (value: IsoDate | null) => void = () => {};
  private onTouchedCallback: () => void = () => {};

  writeValue(value: IsoDate | null): void {
    this.value.set(value || null);
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
