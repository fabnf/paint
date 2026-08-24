import type { IconName } from '../../icons';
import type { SelectOption } from '../../molecules/select';

/**
 * One filter on the bar — a named set of `SelectOption`s, because the options
 * grammar (value, label, icon, description, group, disabled) is the Select's,
 * and the FilterBar renders each filter *as* a Select.
 */
export interface FilterDefinition {
  /** Stable key: the field in {@link FilterState}, and the chip's family. */
  readonly id: string;
  /** "Status", "Owner" — the trigger's resting label and the chips' prefix. */
  readonly label: string;
  readonly options: readonly SelectOption[];
  /** Most filters take several values; `false` makes this one single-choice. */
  readonly multiple?: boolean;
  /** A searchable listbox, for the filter with forty owners in it. */
  readonly searchable?: boolean;
  readonly icon?: IconName;
}

/**
 * What is filtered: filter id → selected values, plus the search text.
 *
 * Plain data — serialisable straight into a query string, which is where a
 * filter state usually wants to live.
 */
export interface FilterState {
  readonly search: string;
  readonly values: Readonly<Record<string, readonly string[]>>;
}

/** The state every bar starts from, and returns to on Clear. */
export const EMPTY_FILTER_STATE: FilterState = { search: '', values: {} };

/** One active selection, flattened for the chip row. */
export interface ActiveFilterChip {
  readonly filterId: string;
  readonly filterLabel: string;
  readonly value: string;
  readonly valueLabel: string;
  readonly icon?: IconName;
}

/** How many individual selections a state holds (the badge on Apply/Clear). */
export function countActiveFilters(state: FilterState): number {
  return Object.values(state.values).reduce((total, values) => total + values.length, 0);
}

/** Value-equality for states, so live consumers can skip no-op emissions. */
export function sameFilterState(a: FilterState, b: FilterState): boolean {
  if (a.search !== b.search) {
    return false;
  }

  const keys = new Set([...Object.keys(a.values), ...Object.keys(b.values)]);
  for (const key of keys) {
    const left = a.values[key] ?? [];
    const right = b.values[key] ?? [];
    if (left.length !== right.length || left.some((value, index) => value !== right[index])) {
      return false;
    }
  }
  return true;
}
