import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { ChipComponent } from '../../primitives/chip';
import { ButtonComponent } from '../../primitives/button';
import { SearchFieldComponent } from '../../molecules/search-field';
import { SelectComponent, type SelectValue } from '../../molecules/select';
import {
  countActiveFilters,
  EMPTY_FILTER_STATE,
  sameFilterState,
  type ActiveFilterChip,
  type FilterDefinition,
  type FilterState,
} from './filter-bar.types';

/**
 * FilterBar — the top of every list page, systemised.
 *
 * A `ds-search-field`, one summarising `ds-select` per filter, an active-chip
 * row that says what is narrowing the list (and removes it in place), and
 * Clear. Composed, not invented: the options grammar is the Select's, the
 * chips are `ds-chip`, the search is the molecule with the debounce and the
 * live result count already built in.
 *
 * **Live by default.** Every keystroke and every tick emits the whole
 * {@link FilterState} — plain, serialisable data. `applyMode` flips the
 * contract for expensive queries: edits collect in a draft, the chips keep
 * showing what is *applied*, and nothing reaches the consumer until Apply.
 *
 * The bar owns no results. Pass `resultCount` back in and the search field's
 * live region announces it — the loop a list page always hand-wires.
 *
 * @example
 * ```html
 * <ds-filter-bar
 *   [filters]="filters"
 *   [(state)]="state"
 *   [resultCount]="filtered().length"
 *   searchLabel="Search invoices"
 * />
 * ```
 */
@Component({
  selector: 'ds-filter-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SearchFieldComponent, SelectComponent, ChipComponent, ButtonComponent],
  template: `
    <div class="ds-filter-bar" role="group" [attr.aria-label]="label()">
      <div class="ds-filter-bar__row">
        @if (showSearch()) {
          <ds-search-field
            class="ds-filter-bar__search"
            [label]="searchLabel()"
            [labelHidden]="true"
            [placeholder]="searchPlaceholder()"
            [value]="draft().search"
            [debounce]="searchDebounce()"
            [loading]="loading()"
            [resultCount]="applyMode() ? null : resultCount()"
            [disabled]="disabled()"
            (valueChange)="onSearch($event)"
          />
        }

        @for (filter of filters(); track filter.id) {
          <ds-select
            class="ds-filter-bar__filter"
            [options]="filter.options"
            [multiple]="filter.multiple !== false"
            [searchable]="filter.searchable ?? false"
            [summarizeSelection]="true"
            [placeholder]="filter.label"
            [label]="filter.label + ' filter'"
            [value]="selectValue(filter)"
            size="sm"
            [disabled]="disabled()"
            (selectionChange)="onFilterChange(filter, $event)"
          />
        }

        <span class="ds-filter-bar__actions">
          <ng-content select="[dsFilterBarActions]" />

          @if (applyMode()) {
            <ds-button
              variant="primary"
              size="sm"
              [disabled]="disabled() || !isDirty()"
              (clicked)="apply()"
            >
              {{ applyLabel() }}
            </ds-button>
          }
          @if (activeChips().length > 0 || draft().search) {
            <ds-button variant="ghost" size="sm" [disabled]="disabled()" (clicked)="clear()">
              {{ clearLabel() }}
            </ds-button>
          }
        </span>
      </div>

      <!-- What is narrowing the list, in words, each removable where it stands. -->
      @if (activeChips().length > 0) {
        <div class="ds-filter-bar__chips" role="list" [attr.aria-label]="chipsLabel()">
          @for (chip of activeChips(); track chip.filterId + ':' + chip.value) {
            <span role="listitem">
              <ds-chip
                tone="primary"
                [icon]="chip.icon ?? null"
                [removable]="true"
                [disabled]="disabled()"
                [removeLabel]="'Remove filter ' + chip.filterLabel + ': ' + chip.valueLabel"
                (removed)="removeChip(chip)"
              >
                <span class="ds-filter-bar__chip-family">{{ chip.filterLabel }}:</span>
                {{ chip.valueLabel }}
              </ds-chip>
            </span>
          }
        </div>
      }

      <!-- Apply mode batches the changes; the announcement batches with them. -->
      <span class="visually-hidden" aria-live="polite">{{ announcement() }}</span>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .ds-filter-bar {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-2_5);
    }

    .ds-filter-bar__row {
      display: flex;
      align-items: center;
      gap: var(--ds-space-2);
      flex-wrap: wrap;
    }

    .ds-filter-bar__search {
      flex: 1 1 14rem;
      min-width: 12rem;
      max-width: 26rem;
    }

    .ds-filter-bar__filter {
      flex: 0 1 auto;
      min-width: 9rem;
    }

    .ds-filter-bar__actions {
      display: inline-flex;
      align-items: center;
      gap: var(--ds-space-2);
      margin-inline-start: auto;
    }

    .ds-filter-bar__chips {
      display: flex;
      align-items: center;
      gap: var(--ds-space-2);
      flex-wrap: wrap;
    }

    /* The family reads quieter by weight alone: opacity would sink the
       primary-on-tint pair below AA, and axe rightly said so. */
    .ds-filter-bar__chip-family {
      font-weight: var(--ds-font-weight-regular);
    }
  `,
})
export class FilterBarComponent {
  /** The filters, in render order. Options speak the Select's grammar. */
  readonly filters = input.required<readonly FilterDefinition[]>();

  /**
   * The whole filter state — search text and selected values — as one
   * two-way-bindable, serialisable object. In `applyMode` it only moves on
   * Apply (and Clear); live mode moves it on every edit.
   */
  readonly state = model<FilterState>(EMPTY_FILTER_STATE);

  /** Collect edits in a draft and emit only on Apply. For expensive queries. */
  readonly applyMode = input(false);
  readonly showSearch = input(true);
  readonly disabled = input(false);
  /** Results in the consumer's list, fed back for the search live region. */
  readonly resultCount = input<number | null>(null);
  /** The consumer's query is in flight. */
  readonly loading = input(false);
  readonly searchDebounce = input(300);

  readonly label = input<string>('Filters');
  readonly searchLabel = input<string>('Search');
  readonly searchPlaceholder = input<string>('Search…');
  readonly applyLabel = input<string>('Apply');
  readonly clearLabel = input<string>('Clear');
  readonly chipsLabel = input<string>('Active filters');

  /*
   * `state` is a model: `(stateChange)` exists for free and fires only on
   * commits — each edit live, or each Apply — never on draft keystrokes.
   */

  /** The Clear button. The state has already been emptied and emitted. */
  readonly cleared = output<void>();

  /** Edits in progress. Identical to `state` outside applyMode. */
  private readonly draftState = signal<FilterState | null>(null);
  protected readonly draft = computed(() => this.draftState() ?? this.state());

  protected readonly announcement = signal('');

  protected readonly isDirty = computed(
    () => !sameFilterState(this.draft(), this.state()),
  );

  /**
   * The chip row always reflects the *committed* state: in applyMode a chip
   * is a promise the bar has kept, not one it is about to make.
   */
  protected readonly activeChips = computed<ActiveFilterChip[]>(() => {
    const committed = this.state();
    return this.filters().flatMap((filter) =>
      (committed.values[filter.id] ?? []).map((value) => ({
        filterId: filter.id,
        filterLabel: filter.label,
        value,
        valueLabel:
          filter.options.find((option) => String(option.value) === value)?.label ?? value,
        icon: filter.icon,
      })),
    );
  });

  /** The Select's value shape for one filter, out of the draft. */
  protected selectValue(filter: FilterDefinition): SelectValue | SelectValue[] | null {
    const values = this.draft().values[filter.id] ?? [];
    if (filter.multiple === false) {
      return values[0] ?? null;
    }
    return [...values];
  }

  protected onSearch(search: string): void {
    this.edit({ ...this.draft(), search });
  }

  protected onFilterChange(
    filter: FilterDefinition,
    selection: SelectValue | SelectValue[] | null,
  ): void {
    const values =
      selection === null ? [] : (Array.isArray(selection) ? selection : [selection]).map(String);

    const draft = this.draft();
    this.edit({ ...draft, values: { ...draft.values, [filter.id]: values } });
  }

  /** A chip removes one committed value — immediately, in both modes. */
  protected removeChip(chip: ActiveFilterChip): void {
    const committed = this.state();
    const next: FilterState = {
      ...committed,
      values: {
        ...committed.values,
        [chip.filterId]: (committed.values[chip.filterId] ?? []).filter(
          (value) => value !== chip.value,
        ),
      },
    };

    this.commit(next);
    // The draft follows: a removed chip must not resurrect on the next Apply.
    this.draftState.set(null);
    this.announcement.set(`Removed filter ${chip.filterLabel}: ${chip.valueLabel}.`);
  }

  /** Commits the draft. The Apply button, as a method. */
  apply(): void {
    if (!this.isDirty()) {
      return;
    }
    const draft = this.draft();
    this.commit(draft);
    this.draftState.set(null);
    this.announcement.set(
      `Filters applied: ${countActiveFilters(draft)} active${draft.search ? ', plus a search' : ''}.`,
    );
  }

  /** Empties search and every filter, commits, and says so. */
  clear(): void {
    this.draftState.set(null);
    this.commit(EMPTY_FILTER_STATE);
    this.cleared.emit();
    this.announcement.set('Filters cleared.');
  }

  private edit(next: FilterState): void {
    if (this.applyMode()) {
      this.draftState.set(next);
      return;
    }
    this.commit(next);
  }

  private commit(next: FilterState): void {
    if (sameFilterState(next, this.state())) {
      return;
    }
    this.state.set(next);
  }
}
