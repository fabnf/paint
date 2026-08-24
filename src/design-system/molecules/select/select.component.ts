import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { IconComponent } from '../../icons';
import { DS_FIELD } from '../../primitives/forms/field-context';
import { firstEnabledIndex, rovingIndex, uniqueId } from '../../utils';
import { toSelectRows, type SelectOption, type SelectValue } from './select.types';

export type SelectSize = 'sm' | 'md' | 'lg';

/**
 * Select — one control, single or multiple selection.
 *
 * A combobox built on Bootstrap's `.form-control` (trigger) and
 * `.dropdown-menu` (listbox), with `.form-check-input` checkboxes in multiple
 * mode. No Bootstrap JS: open state, filtering, the ARIA combobox/listbox
 * pattern, keyboard navigation and outside-click dismissal are Angular.
 *
 * Implements `ControlValueAccessor`, so it drops into `ngModel` / reactive forms
 * as-is, and exposes `[(value)]` for template-only use.
 *
 * @example
 * ```html
 * <!-- Single -->
 * <ds-select [options]="owners" [(value)]="owner" placeholder="Assign owner" />
 *
 * <!-- Multiple, searchable, clearable -->
 * <ds-select
 *   [options]="labels"
 *   [(value)]="selected"
 *   [multiple]="true"
 *   [searchable]="true"
 *   [clearable]="true"
 *   placeholder="Add labels"
 * />
 *
 * <!-- Reactive forms -->
 * <ds-select [options]="owners" formControlName="owner" />
 * ```
 */
@Component({
  selector: 'ds-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  host: {
    class: 'dropdown',
    '(keydown)': 'onKeydown($event)',
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    <!--
      The field is a plain wrapper, not a control: chips and the clear button are
      real buttons, so they must not live *inside* the combobox. Clicking
      anywhere else in the field opens the listbox.
    -->
    <div
      class="form-control ds-select__field"
      [class.ds-select__field--sm]="size() === 'sm'"
      [class.ds-select__field--lg]="size() === 'lg'"
      [class.ds-select__field--open]="open()"
      [class.ds-select__field--invalid]="isInvalid()"
      [class.ds-select__field--disabled]="isDisabled()"
      (click)="onFieldClick($event)"
    >
      @if (multiple() && selectedOptions().length && !summarizeSelection()) {
        <span class="ds-select__chips">
          @for (option of selectedOptions(); track option.value) {
            <span class="ds-select__chip">
              @if (option.icon) {
                <ds-icon [name]="option.icon" size="xs" />
              }
              <span class="ds-select__chip-label">{{ option.label }}</span>
              <!--
                Tab stays on the field: removal is also on Backspace and in the
                listbox, so these stay out of the tab order while remaining
                clickable and exposed to assistive tech.
              -->
              <button
                type="button"
                class="ds-select__chip-remove"
                tabindex="-1"
                [attr.aria-label]="'Remove ' + option.label"
                [disabled]="isDisabled()"
                (click)="removeChip($event, option)"
              >
                <ds-icon name="close" size="xs" />
              </button>
            </span>
          }
        </span>
      }

      <!-- The combobox itself: focusable, named by its label *and* its value -->
      <button
        #trigger
        type="button"
        class="ds-select__trigger"
        [id]="triggerId()"
        [attr.role]="searchable() ? null : 'combobox'"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="listboxId"
        [attr.aria-haspopup]="'listbox'"
        [attr.aria-activedescendant]="searchable() ? null : activeDescendant()"
        [attr.aria-labelledby]="ariaLabelledBy()"
        [attr.aria-describedby]="describedByIds()"
        [attr.aria-invalid]="isInvalid() ? 'true' : null"
        [attr.aria-required]="isRequired() ? 'true' : null"
        [disabled]="isDisabled()"
        (click)="toggle()"
        (blur)="onTouchedCallback()"
      >
        <span class="ds-select__value" [id]="valueId">
          @if (multiple() && selectedOptions().length && summarizeSelection()) {
            <!-- Summary mode: the count is the visible value; the names stay in the accessible one -->
            <span class="ds-select__single-label">{{ selectionSummaryLabel() }}</span>
            <span class="visually-hidden">: {{ valueSummary() }}</span>
          } @else if (multiple() && selectedOptions().length) {
            <!-- The chips carry the visible value; this keeps it in the name -->
            <span class="visually-hidden">{{ valueSummary() }}</span>
          } @else if (!multiple() && selectedOptions().length) {
            <span class="ds-select__single">
              @if (selectedOptions()[0].icon) {
                <ds-icon [name]="selectedOptions()[0].icon!" size="sm" />
              }
              <span class="ds-select__single-label">{{ selectedOptions()[0].label }}</span>
            </span>
          } @else {
            <span class="ds-select__placeholder">{{ placeholder() }}</span>
          }
        </span>
      </button>

      @if (clearable() && selectedOptions().length && !isDisabled()) {
        <button
          type="button"
          class="ds-select__clear"
          [attr.aria-label]="clearLabel()"
          (click)="clear($event)"
        >
          <ds-icon name="close" size="xs" />
        </button>
      }

      <!-- Decorative: the field's click handler is what actually opens it. -->
      <ds-icon name="chevronDown" size="sm" class="ds-select__caret" />
    </div>

    @if (label()) {
      <!-- Fallback name when the consumer has no visible label to point at -->
      <span [id]="labelId" class="visually-hidden">{{ label() }}</span>
    }

    @if (multiple()) {
      <span [id]="hintId" class="visually-hidden">
        Multiple selection. Press Enter to toggle an option, Backspace to remove the last one.
      </span>
    }

    @if (open()) {
      <div
        #panel
        class="dropdown-menu show ds-select__panel"
        [class.ds-select__panel--up]="dropUp()"
      >
        @if (searchable()) {
          <div class="ds-select__search">
            <ds-icon name="search" size="sm" class="ds-select__search-icon" />
            <input
              #searchInput
              type="text"
              class="form-control form-control-sm ds-select__search-input"
              [placeholder]="searchPlaceholder()"
              [value]="query()"
              autocomplete="off"
              role="combobox"
              aria-autocomplete="list"
              [attr.aria-expanded]="true"
              [attr.aria-controls]="listboxId"
              [attr.aria-activedescendant]="activeDescendant()"
              [attr.aria-describedby]="describedByIds()"
              [attr.aria-label]="searchName()"
              (input)="onSearch($event)"
              (click)="$event.stopPropagation()"
            />
          </div>
        }

        <ul
          class="ds-select__list"
          [id]="listboxId"
          role="listbox"
          [attr.aria-multiselectable]="multiple() ? 'true' : null"
          [attr.aria-label]="label() || placeholder()"
        >
          @for (row of rows(); track row.kind + row.label + ($index || 0)) {
            @if (row.option; as option) {
              <!--
                Focus never enters the listbox: the combobox keeps it and points
                here with aria-activedescendant, so options are plain list items
                with no nested controls.
              -->
              <li
                #optionRow
                class="dropdown-item ds-select__option"
                role="option"
                [id]="optionId(row.optionIndex!)"
                [class.active]="row.optionIndex === activeIndex()"
                [class.ds-select__option--selected]="isSelected(option.value)"
                [class.disabled]="option.disabled"
                [attr.aria-selected]="isSelected(option.value)"
                [attr.aria-disabled]="option.disabled ? 'true' : null"
                (click)="toggleOption(option)"
                (mouseenter)="activeIndex.set(row.optionIndex!)"
              >
                @if (multiple()) {
                  <span
                    class="ds-select__check"
                    [class.ds-select__check--on]="isSelected(option.value)"
                    aria-hidden="true"
                  >
                    @if (isSelected(option.value)) {
                      <ds-icon name="check" size="xs" />
                    }
                  </span>
                } @else if (option.icon) {
                  <ds-icon [name]="option.icon" size="sm" class="ds-select__option-icon" />
                }

                <span class="ds-select__option-body">
                  <span class="ds-select__option-label">{{ option.label }}</span>
                  @if (option.description) {
                    <span class="ds-select__option-description">{{ option.description }}</span>
                  }
                </span>

                @if (!multiple() && isSelected(option.value)) {
                  <ds-icon name="check" size="sm" class="ds-select__option-check" />
                }
              </li>
            } @else {
              <li class="dropdown-header ds-select__group" role="presentation">{{ row.label }}</li>
            }
          }

          @if (!rows().length) {
            <li class="ds-select__empty" role="presentation">{{ emptyText() }}</li>
          }
        </ul>

        @if (multiple() && selectedValues().length) {
          <div class="ds-select__footer">
            <span class="ds-select__count">{{ selectedValues().length }} selected</span>
            <button type="button" class="ds-select__footer-action" (click)="clear($event)">
              Clear all
            </button>
          </div>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      position: relative;
    }

    /* —— Field (wrapper) —— */
    .ds-select__field {
      display: flex;
      align-items: center;
      gap: var(--ds-space-1_5);
      flex-wrap: wrap;
      width: 100%;
      min-height: 2.5rem;
      cursor: pointer;
      transition:
        border-color 140ms ease,
        box-shadow 140ms ease;
    }

    .ds-select__field--sm {
      min-height: 2rem;
      padding-block: var(--ds-space-1);
      font-size: var(--ds-font-size-sm);
    }

    .ds-select__field--lg {
      min-height: 3rem;
      font-size: var(--ds-font-size-lg);
    }

    .ds-select__field--open,
    .ds-select__field:focus-within {
      border-color: var(--ds-color-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--ds-color-focus-ring) 32%, transparent);
    }

    .ds-select__field--invalid {
      border-color: var(--ds-color-danger);
    }

    .ds-select__field--disabled {
      cursor: not-allowed;
      color: var(--ds-color-text-subtle);
      background-color: var(--ds-color-surface-sunken);
    }

    /* —— Trigger (the combobox) —— */
    .ds-select__trigger {
      display: flex;
      align-items: center;
      gap: var(--ds-space-2);
      /* Narrow basis on purpose: with chips in the field, a wide basis would
         push the combobox onto its own line and leave a blank row. */
      flex: 1 1 2rem;
      min-width: 2rem;
      padding: 0;
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      text-align: start;
      cursor: inherit;
    }

    /* The ring belongs to the field, which already reacts to :focus-within. */
    .ds-select__trigger:focus-visible {
      outline: none;
    }

    /*
     * Forced colours (Windows High Contrast) drop box-shadows, which is how the
     * field draws its ring — so the control takes its own outline back.
     */
    @media (forced-colors: active) {
      .ds-select__trigger:focus-visible {
        outline: 2px solid;
        outline-offset: 2px;
      }

      .ds-select__check--on {
        /* The fill is overridden by the system palette; the tick still reads. */
        border-width: 2px;
      }
    }

    .ds-select__value {
      flex: 1 1 auto;
      min-width: 0;
    }

    .ds-select__placeholder {
      color: var(--ds-color-text-subtle);
    }

    .ds-select__single {
      display: inline-flex;
      align-items: center;
      gap: var(--ds-space-2);
      min-width: 0;
    }

    .ds-select__single-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ds-select__chips {
      display: contents;
    }

    .ds-select__chip {
      display: inline-flex;
      align-items: center;
      gap: var(--ds-space-1);
      padding: 0.0625rem var(--ds-space-1) 0.0625rem var(--ds-space-1_5);
      border-radius: var(--ds-radius-full);
      background: var(--ds-color-primary-muted);
      color: var(--ds-color-primary);
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-semibold);
      max-width: 12rem;
    }

    .ds-select__chip-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ds-select__chip-remove,
    .ds-select__clear {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      border: 0;
      background: none;
      color: inherit;
      border-radius: var(--ds-radius-full);
      cursor: pointer;
      opacity: 0.7;
    }

    .ds-select__chip-remove:hover,
    .ds-select__clear:hover {
      opacity: 1;
    }

    .ds-select__clear {
      flex-shrink: 0;
      color: var(--ds-color-text-subtle);
    }

    .ds-select__clear:focus-visible,
    .ds-select__chip-remove:focus-visible {
      outline: 2px solid var(--ds-color-focus-ring);
      outline-offset: 1px;
      opacity: 1;
    }

    .ds-select__caret {
      flex-shrink: 0;
      color: var(--ds-color-text-subtle);
      transition: transform 160ms ease;
    }

    .ds-select__field--open .ds-select__caret {
      transform: rotate(180deg);
    }

    /* —— Panel —— */
    .ds-select__panel {
      position: absolute;
      inset-block-start: calc(100% + var(--ds-space-1_5));
      inset-inline: 0;
      display: flex;
      flex-direction: column;
      z-index: 1000;
      max-height: min(20rem, 60vh);
      padding: var(--ds-space-1_5);
      animation: ds-select-in 120ms ease-out;
    }

    .ds-select__panel--up {
      inset-block-start: auto;
      inset-block-end: calc(100% + var(--ds-space-1_5));
    }

    .ds-select__search {
      position: relative;
      padding: var(--ds-space-1) var(--ds-space-1) var(--ds-space-2);
    }

    .ds-select__search-icon {
      position: absolute;
      inset-block-start: 50%;
      inset-inline-start: var(--ds-space-3);
      translate: 0 -60%;
      color: var(--ds-color-text-subtle);
      pointer-events: none;
    }

    .ds-select__search-input {
      padding-inline-start: var(--ds-space-8);
    }

    .ds-select__list {
      flex: 1 1 auto;
      margin: 0;
      padding: 0;
      list-style: none;
      overflow-y: auto;
    }

    .ds-select__group {
      position: sticky;
      inset-block-start: 0;
      background: var(--ds-color-surface);
      z-index: 1;
    }

    .ds-select__option {
      display: flex;
      align-items: flex-start;
      gap: var(--ds-space-2_5);
      border-radius: var(--ds-radius-sm);
      cursor: pointer;
    }

    .ds-select__option.disabled {
      cursor: not-allowed;
      color: var(--ds-color-text-subtle);
      pointer-events: none;
    }

    .ds-select__option--selected {
      font-weight: var(--ds-font-weight-semibold);
    }

    /* Drawn, not an <input>: a listbox option must not contain a control. */
    .ds-select__check {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.0625rem;
      height: 1.0625rem;
      margin-block-start: 0.15rem;
      flex-shrink: 0;
      border: 1.5px solid var(--ds-color-border-control);
      border-radius: 0.3125rem;
      background: var(--ds-color-surface);
      color: var(--ds-color-on-primary);
    }

    .ds-select__check--on {
      background: var(--ds-color-primary);
      border-color: var(--ds-color-primary);
    }

    .ds-select__option-icon {
      margin-block-start: 0.1rem;
      color: var(--ds-color-text-subtle);
      flex-shrink: 0;
    }

    .ds-select__option-body {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      min-width: 0;
      flex: 1 1 auto;
    }

    .ds-select__option-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ds-select__option-description {
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-regular);
      color: var(--ds-color-text-subtle);
      white-space: normal;
    }

    .ds-select__option-check {
      color: var(--ds-color-primary);
      flex-shrink: 0;
      margin-block-start: 0.1rem;
    }

    .ds-select__empty {
      padding: var(--ds-space-4) var(--ds-space-3);
      text-align: center;
      color: var(--ds-color-text-subtle);
      font-size: var(--ds-font-size-sm);
    }

    .ds-select__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ds-space-2);
      margin-block-start: var(--ds-space-1);
      padding: var(--ds-space-2) var(--ds-space-2) var(--ds-space-1);
      border-top: 1px solid var(--ds-color-border);
      font-size: var(--ds-font-size-xs);
      color: var(--ds-color-text-subtle);
    }

    .ds-select__footer-action {
      border: 0;
      padding: 0;
      background: none;
      color: var(--ds-color-primary);
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-semibold);
      cursor: pointer;
    }

    .ds-select__footer-action:hover {
      text-decoration: underline;
    }

    @keyframes ds-select-in {
      from {
        opacity: 0;
        transform: translateY(-0.25rem);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ds-select__panel,
      .ds-select__caret,
      .ds-select__field {
        animation: none;
        transition: none;
      }
    }
  `,
})
export class SelectComponent implements ControlValueAccessor {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /**
   * The `<ds-form-field>` around the Select, if there is one. The trigger is a
   * `<button>`, which is a labelable element — so a field's `<label for>` names
   * it exactly as it would name an `<input>`.
   */
  private readonly field = inject(DS_FIELD, { optional: true });

  readonly options = input.required<readonly SelectOption[]>();
  /**
   * Selected value(s). A single value when `multiple` is false, an array when it
   * is. Two-way bindable, and kept in sync with forms through CVA.
   */
  readonly value = model<SelectValue | SelectValue[] | null>(null);
  /** Allow more than one option. Chips replace the single label in the trigger. */
  readonly multiple = input(false);
  /** Show the filter field inside the panel. */
  readonly searchable = input(false);
  /** Offer a clear affordance once something is selected. */
  readonly clearable = input(false);
  readonly placeholder = input<string>('Select…');
  readonly searchPlaceholder = input<string>('Filter…');
  /**
   * Accessible name for the filter field.
   *
   * The filter is a control in its own right, so it gets its own name: a
   * placeholder is not a label, and borrowing the field's name would announce
   * the whole selection every time the user types.
   */
  readonly searchLabel = input<string>('');
  /** Shown when the filter matches nothing. */
  readonly emptyText = input<string>('No matches');
  readonly size = input<SelectSize>('md');
  readonly disabled = input(false);
  /**
   * Accessible name, rendered as a visually-hidden label.
   * Prefer `labelledBy` when a visible label already exists on the page.
   */
  readonly label = input<string>('');
  /** Id of a visible label element. Takes precedence over `label`. */
  readonly labelledBy = input<string>('');
  /** Internal alias so the computed name below can read the input. */
  private readonly labelledBy__external = this.labelledBy;
  /** Id of the element describing the field (hint or error text). */
  readonly describedBy = input<string>('');
  /** Accessible name for the clear button. */
  readonly clearLabel = input<string>('Clear selection');
  readonly invalid = input(false);
  readonly required = input(false);
  /** Close the panel after a pick. Defaults to true for single, false for multiple. */
  readonly closeOnSelect = input<boolean | null>(null);
  /**
   * Multiple mode without the inline chips: the trigger shows a count
   * ("Status · 2") and the chips live wherever the caller puts them — a
   * FilterBar's active-chip row, usually. Presentation only; selection,
   * keyboard and ARIA behave exactly as before.
   */
  readonly summarizeSelection = input(false);

  /** Emits whenever the selection changes through user interaction. */
  readonly selectionChange = output<SelectValue | SelectValue[] | null>();
  readonly openChange = output<boolean>();

  protected readonly open = signal(false);
  protected readonly query = signal('');
  protected readonly activeIndex = signal(-1);
  protected readonly dropUp = signal(false);
  private readonly generatedTriggerId = uniqueId('ds-select-trigger');
  /** Inside a field, the field owns the id its label points at. */
  protected readonly triggerId = computed(
    () => this.field?.controlId() || this.generatedTriggerId,
  );
  protected readonly listboxId = uniqueId('ds-select-listbox');
  protected readonly labelId = uniqueId('ds-select-label');
  protected readonly valueId = uniqueId('ds-select-value');
  protected readonly hintId = uniqueId('ds-select-hint');

  /** Set by Angular forms when the control is disabled via the form API. */
  private readonly formDisabled = signal(false);

  /** Disabled by an input, by the form, or by the field — all the same to it. */
  protected readonly isDisabled = computed(
    () => this.disabled() || this.formDisabled() || !!this.field?.disabled(),
  );

  protected readonly isInvalid = computed(() => this.invalid() || !!this.field?.invalid());
  protected readonly isRequired = computed(() => this.required() || !!this.field?.required());

  private readonly triggerRef = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly searchRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly optionRows = viewChildren<ElementRef<HTMLElement>>('optionRow');

  private onChangeCallback: (value: SelectValue | SelectValue[] | null) => void = () => {};
  protected onTouchedCallback: () => void = () => {};

  /** Current selection as an array, whatever the mode. */
  protected readonly selectedValues = computed<SelectValue[]>(() => {
    const value = this.value();
    if (value === null || value === undefined || value === '') {
      return [];
    }
    return Array.isArray(value) ? [...value] : [value];
  });

  protected readonly selectedOptions = computed(() => {
    const selected = this.selectedValues();
    return this.options().filter((option) => selected.includes(option.value));
  });

  /** Options after filtering, in render order. */
  protected readonly filteredOptions = computed(() => {
    const query = this.query().trim().toLowerCase();
    if (!query) {
      return this.options();
    }

    return this.options().filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.description?.toLowerCase().includes(query) ||
        option.group?.toLowerCase().includes(query),
    );
  });

  protected readonly rows = computed(() => toSelectRows(this.filteredOptions()));

  protected readonly activeDescendant = computed(() => {
    const index = this.activeIndex();
    return this.open() && index >= 0 ? this.optionId(index) : null;
  });

  /**
   * The control is named by its label *and* its current value, per the ARIA
   * select-only combobox pattern — otherwise an `aria-label` would hide the
   * selection from screen readers.
   */
  protected readonly ariaLabelledBy = computed(() => {
    const external = this.labelledBy__external() || this.field?.labelId();
    const labelPart = external || (this.label() ? this.labelId : '');
    return [labelPart, this.valueId].filter(Boolean).join(' ') || null;
  });

  /** The field's messages, then the hint, then any consumer description. */
  protected readonly describedByIds = computed(() => {
    const ids = [
      this.field?.describedByIds(),
      this.describedBy(),
      this.multiple() ? this.hintId : '',
    ].filter(Boolean);
    return ids.length ? ids.join(' ') : null;
  });

  protected readonly searchName = computed(
    () => this.searchLabel() || `${this.searchPlaceholder()} ${this.label() || ''}`.trim(),
  );

  /** "Status · 2" — the visible value in summary mode. */
  protected readonly selectionSummaryLabel = computed(
    () => `${this.placeholder()} · ${this.selectedOptions().length}`,
  );

  /** What the trigger announces as its value. */
  protected readonly valueSummary = computed(() => {
    const selected = this.selectedOptions();
    if (!selected.length) {
      return this.placeholder();
    }
    return selected.map((option) => option.label).join(', ');
  });

  protected optionId(index: number): string {
    return `${this.listboxId}-option-${index}`;
  }

  protected isSelected(value: SelectValue): boolean {
    return this.selectedValues().includes(value);
  }

  toggle(): void {
    this.open() ? this.close() : this.openPanel();
  }

  /**
   * The field is a passive wrapper: a click anywhere in its padding should reach
   * the combobox, but a click on a chip's remove button must not.
   */
  protected onFieldClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('button')) {
      return;
    }

    this.triggerRef()?.nativeElement.focus();
    this.toggle();
  }

  openPanel(): void {
    if (this.isDisabled() || this.open()) {
      return;
    }

    this.open.set(true);
    this.query.set('');
    this.openChange.emit(true);

    // Start on the first selected option, or the first enabled one.
    const options = this.filteredOptions();
    const firstSelected = options.findIndex((option) => this.isSelected(option.value));
    this.activeIndex.set(
      firstSelected !== -1
        ? firstSelected
        : firstEnabledIndex(options.length, (index) => !!options[index].disabled),
    );

    // After the render, not just after the current task: the panel (and the
    // search field inside it) does not exist until change detection has run.
    setTimeout(() => {
      this.updatePlacement();
      if (this.searchable()) {
        this.searchRef()?.nativeElement.focus();
      }
      this.scrollActiveIntoView();
    });
  }

  close(restoreFocus = false): void {
    if (!this.open()) {
      return;
    }

    this.open.set(false);
    this.query.set('');
    this.activeIndex.set(-1);
    this.openChange.emit(false);

    if (restoreFocus) {
      this.triggerRef()?.nativeElement.focus();
    }
  }

  protected toggleOption(option: SelectOption): void {
    if (option.disabled) {
      return;
    }

    if (this.multiple()) {
      const selected = this.selectedValues();
      const next = selected.includes(option.value)
        ? selected.filter((value) => value !== option.value)
        : [...selected, option.value];

      this.commit(next);

      if (this.closeOnSelect() === true) {
        this.close(true);
      }
      return;
    }

    this.commit(option.value);

    if (this.closeOnSelect() !== false) {
      this.close(true);
    }
  }

  protected removeChip(event: Event, option: SelectOption): void {
    event.stopPropagation();
    if (this.isDisabled()) {
      return;
    }

    this.commit(this.selectedValues().filter((value) => value !== option.value));
  }

  protected clear(event: Event): void {
    event.stopPropagation();
    this.commit(this.multiple() ? [] : null);
  }

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);

    // Re-anchor the active row: the old index means nothing after filtering.
    const options = this.filteredOptions();
    this.activeIndex.set(firstEnabledIndex(options.length, (index) => !!options[index].disabled));
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
      this.onTouchedCallback();
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.open()) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.openPanel();
      }
      return;
    }

    const options = this.filteredOptions();
    const disabled = (index: number) => !!options[index].disabled;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.setActive(rovingIndex(options.length, this.activeIndex(), 1, disabled));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.setActive(rovingIndex(options.length, this.activeIndex(), -1, disabled));
        break;
      case 'Home':
        event.preventDefault();
        this.setActive(firstEnabledIndex(options.length, disabled, 1));
        break;
      case 'End':
        event.preventDefault();
        this.setActive(firstEnabledIndex(options.length, disabled, -1));
        break;
      case 'Enter': {
        event.preventDefault();
        const option = options[this.activeIndex()];
        if (option) {
          this.toggleOption(option);
        }
        break;
      }
      case 'Escape':
        event.preventDefault();
        this.close(true);
        break;
      case 'Tab':
        this.close();
        break;
      case 'Backspace':
        // Empty filter + multiple: peel the last chip off, like a tag input.
        if (this.multiple() && !this.query() && this.selectedValues().length) {
          const last = this.selectedOptions().at(-1);
          if (last) {
            this.commit(this.selectedValues().filter((value) => value !== last.value));
          }
        }
        break;
      default:
        break;
    }
  }

  private setActive(index: number): void {
    if (index === -1) {
      return;
    }
    this.activeIndex.set(index);
    this.scrollActiveIntoView();
  }

  private scrollActiveIntoView(): void {
    const index = this.activeIndex();
    if (index < 0) {
      return;
    }
    this.optionRows()[index]?.nativeElement.scrollIntoView({ block: 'nearest' });
  }

  /** Single place where a user-driven change leaves the component. */
  private commit(next: SelectValue | SelectValue[] | null): void {
    this.value.set(next);
    this.onChangeCallback(next);
    this.onTouchedCallback();
    this.selectionChange.emit(next);
  }

  private updatePlacement(): void {
    const panel = this.panelRef()?.nativeElement;
    const trigger = this.triggerRef()?.nativeElement;
    if (!panel || !trigger || typeof window === 'undefined') {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const panelHeight = panel.offsetHeight;
    this.dropUp.set(
      window.innerHeight - rect.bottom < panelHeight + 16 && rect.top > panelHeight + 16,
    );
  }

  // —— ControlValueAccessor ——

  writeValue(value: SelectValue | SelectValue[] | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: SelectValue | SelectValue[] | null) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}
