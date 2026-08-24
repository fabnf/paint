import type { IconName } from '../../icons';

export type DataTableAlign = 'start' | 'center' | 'end';

/** Identity of a row. Rows are tracked and selected by this. */
export type RowKey = string | number;

/** One column of a {@link DataTableComponent}. */
export interface DataTableColumn<T = Record<string, unknown>> {
  /** Property name, and the key a `[dsCell]` template is matched on. */
  key: string;
  /** Column label. */
  header: string;
  /** Horizontal alignment of the cell and its header. Numbers want `end`. */
  align?: DataTableAlign;
  /** Any CSS width: `'12rem'`, `'25%'`, `'min-content'`. */
  width?: string;
  /** Enables the header's sort control. */
  sortable?: boolean;
  /** Renders the cell as text. Defaults to `String(row[key])`. */
  format?: (row: T) => string;
  /** Sort key, when the raw value is not comparable (dates, money, enums). */
  sortValue?: (row: T) => string | number;
  /** Keeps long values on one line with an ellipsis. */
  truncate?: boolean;
  /** Numbers line up when they share the same glyph width. */
  numeric?: boolean;
  /** Hides the column below this breakpoint. */
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Accessible name for a column whose `header` is intentionally blank
   * (an actions column, a checkbox column). Rendered visually hidden, because
   * a column with no header is a column screen-reader users cannot place.
   */
  headerLabel?: string;
}

export type SortDirection = 'asc' | 'desc';

export interface DataTableSort {
  /** Column key being sorted. */
  key: string;
  direction: SortDirection;
}

/** Emitted by `(rowAction)`. */
export interface DataTableRowEvent<T> {
  row: T;
  key: RowKey;
}

/** Copy for the empty state. */
export interface DataTableEmpty {
  icon?: IconName;
  title: string;
  description?: string;
}
