import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { InputComponent } from '../../primitives/input';
import { SpinnerComponent } from '../../primitives/spinner';
import type { ControlSize } from '../../primitives/forms/form-control.types';
import { uniqueId } from '../../utils';

/**
 * SearchField — a text input that knows it is a search.
 *
 * Three things every product rebuilds around a search box, and gets wrong in the
 * same three ways:
 *
 * 1. **It debounces.** Keystrokes are not queries. `search` fires once the user
 *    stops typing — except when they clear the field, which is answered at once,
 *    because emptying a filter is not a thought in progress.
 * 2. **It says how many results there are.** A list that silently changes under
 *    a screen-reader user is a list that did not change. The count goes into a
 *    polite live region, once per settled query.
 * 3. **Its spinner lives inside the field.** Not beside it, not instead of the
 *    icon, and not announcing itself — the live region already does the talking.
 *
 * Built on `<ds-input type="search">`, so `Escape` clears, the clear button stays
 * out of the tab order, and the browser's own search affordances survive.
 *
 * @example
 * ```html
 * <ds-search-field
 *   label="Search invoices"
 *   [labelHidden]="true"
 *   [(value)]="query"
 *   [loading]="searching()"
 *   [resultCount]="results().length"
 *   (search)="run($event)"
 * />
 * ```
 */
@Component({
  selector: 'ds-search-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InputComponent, SpinnerComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchFieldComponent),
      multi: true,
    },
  ],
  host: {
    // A search landmark is for *the* search of a page or a region. Most search
    // boxes are a filter on a list, and a page of landmarks is a page of noise.
    '[attr.role]': 'landmark() ? "search" : null',
    '(keydown.enter)': 'submit($event)',
    '(focusout)': 'onTouchedCallback()',
  },
  template: `
    <ds-input
      #control
      type="search"
      iconStart="search"
      [label]="labelHidden() ? '' : label()"
      [ariaLabel]="labelHidden() ? label() : ''"
      [placeholder]="placeholder()"
      [value]="value()"
      [size]="size()"
      [hint]="hint()"
      [error]="error()"
      [disabled]="isDisabled()"
      [clearable]="clearable()"
      [clearLabel]="clearLabel()"
      [describedBy]="statusId"
      autocomplete="off"
      (valueInput)="onInput($event)"
    >
      <!--
        The slot itself is static — a projected node inside an @if would never
        match the slot, because projection is decided on the markup, not on the
        render. The condition lives inside it instead.

        Decorative: the status region below says "Searching…" once, rather than
        the spinner announcing itself on every keystroke.
      -->
      <span dsInputTrailing class="ds-search__trailing">
        @if (loading()) {
          <ds-spinner size="sm" tone="inherit" [decorative]="true" />
        }
      </span>
    </ds-input>

    <!--
      One polite region, always present, for the only thing a search has to say:
      how many results the query found. Born empty, so the first answer is heard.
    -->
    <span [id]="statusId" class="visually-hidden" role="status">{{ statusText() }}</span>
  `,
  styles: `
    :host {
      display: block;
    }

    .ds-search__trailing {
      display: inline-flex;
      align-items: center;
      color: var(--ds-color-text-subtle);
    }

    /* An empty slot is still a flex child, and the field's gap would pay for it. */
    .ds-search__trailing:empty {
      display: none;
    }
  `,
})
export class SearchFieldComponent implements ControlValueAccessor {
  private readonly destroyRef = inject(DestroyRef);

  readonly value = model<string>('');
  /** The field's name. Hide it only when a search icon and a placeholder say it for you. */
  readonly label = input<string>('Search');
  readonly labelHidden = input(false);
  readonly placeholder = input<string>('Search…');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly size = input<ControlSize>('md');
  readonly disabled = input(false);
  readonly clearable = input(true);
  readonly clearLabel = input<string>('Clear search');
  /**
   * Milliseconds of silence before `search` fires. `0` emits on every keystroke
   * — for a filter over data already in memory, that is the right answer.
   */
  readonly debounce = input(300);
  /** A query is in flight. Draws a spinner in the field and says so, once. */
  readonly loading = input(false);
  /**
   * Results for the settled query, announced politely. `null` says nothing —
   * use it when the count is meaningless, or when something else announces it.
   */
  readonly resultCount = input<number | null>(null);
  /** How the count is spoken. */
  readonly resultLabel = input<(count: number) => string>((count) =>
    count === 1 ? '1 result' : `${count} results`,
  );
  readonly loadingLabel = input<string>('Searching…');
  /** Makes this the `role="search"` landmark for its region. One per region. */
  readonly landmark = input(false);

  /** The settled query. Debounced, de-duplicated, and immediate on a clear. */
  readonly search = output<string>();
  /** `Enter`. Fires with the current value, having flushed any pending debounce. */
  readonly submitted = output<string>();
  readonly cleared = output<void>();

  protected readonly statusId = uniqueId('ds-search-status');

  /** Set by the forms API. The molecule has one control, so it disables it. */
  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  private readonly control = viewChild.required(InputComponent);

  private timer: ReturnType<typeof setTimeout> | null = null;
  /** The last value `search` was fired with, so a re-typed query is not re-run. */
  private lastEmitted = '';

  constructor() {
    this.destroyRef.onDestroy(() => this.cancel());
  }

  /** "Searching…" while in flight, the count once it settles, nothing before. */
  protected readonly statusText = computed(() => {
    if (this.loading()) {
      return this.loadingLabel();
    }
    const count = this.resultCount();
    return count === null || !this.announce() ? '' : this.resultLabel()(count);
  });

  /** Nothing to announce before the first query has settled. */
  private readonly announce = signal(false);

  /** Focuses the field. */
  focus(): void {
    this.control().focus();
  }

  protected onInput(next: string | number | null): void {
    const value = next === null ? '' : String(next);
    this.value.set(value);
    this.onChangeCallback(value);

    // Clearing is not a thought in progress: answer it now.
    if (!value) {
      this.cancel();
      this.emit('');
      this.cleared.emit();
      return;
    }

    const wait = this.debounce();
    if (wait <= 0) {
      this.emit(value);
      return;
    }

    this.cancel();
    this.timer = setTimeout(() => {
      this.timer = null;
      this.emit(value);
    }, wait);
  }

  /** `Enter` means "now", so the pending debounce is flushed rather than raced. */
  protected submit(event: Event): void {
    event.preventDefault();
    this.cancel();
    this.emit(this.value());
    this.submitted.emit(this.value());
  }

  private emit(value: string): void {
    this.announce.set(true);
    if (value === this.lastEmitted) {
      return;
    }
    this.lastEmitted = value;
    this.search.emit(value);
  }

  private cancel(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  // —— ControlValueAccessor ——

  private onChangeCallback: (value: string) => void = () => {};
  protected onTouchedCallback: () => void = () => {};

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
    this.lastEmitted = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}
