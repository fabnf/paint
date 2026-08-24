import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { IconComponent } from '../../icons';
import { SkeletonComponent } from '../../primitives/skeleton';
import { EmptyStateComponent } from '../../molecules/empty-state';
import { uniqueId } from '../../utils';
import { DataTableCellDirective } from './data-table-cell.directive';
import { DataTableActionsDirective } from './data-table-slots';
import type {
  DataTableColumn,
  DataTableEmpty,
  DataTableSort,
  RowKey,
  SortDirection,
} from './data-table.types';

export type DataTableDensity = 'comfortable' | 'compact';

/**
 * DataTable — rows of record, under control.
 *
 * Built on Bootstrap's `.table` (+ `.table-hover`, `.table-sm`,
 * `.table-responsive`) and `.form-check-input` for selection, with the parts a
 * real table needs on top: typed columns, sorting, a sticky header, selection
 * with an indeterminate master checkbox, projected cell templates, a loading
 * skeleton and an empty state.
 *
 * Sorting is internal by default. Pass `[manualSort]="true"` to take over and
 * drive `[sort]` yourself (server-side paging, remote sort).
 *
 * @example
 * ```html
 * <ds-data-table
 *   [columns]="columns"
 *   [rows]="invoices"
 *   [rowKey]="byId"
 *   [selectable]="true"
 *   [(selection)]="selected"
 *   [empty]="{ icon: 'search', title: 'No invoices', description: 'Try another filter.' }"
 * >
 *   <ng-template dsCell="status" let-row>
 *     <ds-text variant="label" tone="success">{{ row.status }}</ds-text>
 *   </ng-template>
 * </ds-data-table>
 * ```
 */
@Component({
  selector: 'ds-data-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, IconComponent, SkeletonComponent, EmptyStateComponent],
  template: `
    <div class="ds-table" [class.ds-table--bordered]="bordered()">
      @if (hasToolbar()) {
        <div class="ds-table__toolbar">
          <div class="ds-table__caption">
            @if (caption()) {
              <p class="ds-table__caption-text" [id]="captionId">{{ caption() }}</p>
            }
            @if (selectable() && selection().length) {
              <p class="ds-table__selection-count">{{ selection().length }} selected</p>
            }
          </div>
          <div class="ds-table__actions">
            <ng-content select="[dsTableActions]" />
          </div>
        </div>
      }

      <div
        class="table-responsive ds-table__scroll"
        [class.ds-table__scroll--sticky]="stickyHeader()"
        [style.max-height]="maxHeight() || null"
      >
        <table
          class="table ds-table__table"
          [class.table-hover]="hoverable() && !loading() && rows().length > 0"
          [class.table-sm]="density() === 'compact'"
          [attr.aria-label]="label() || (caption() ? null : 'Data table')"
          [attr.aria-labelledby]="!label() && caption() ? captionId : null"
          [attr.aria-busy]="loading() ? 'true' : null"
        >
          <thead class="ds-table__head">
            <tr>
              @if (selectable()) {
                <th scope="col" class="ds-table__select-cell">
                  <input
                    type="checkbox"
                    class="form-check-input"
                    [checked]="allSelected()"
                    [indeterminate]="someSelected()"
                    [disabled]="loading() || !sortedRows().length"
                    [attr.aria-label]="allSelected() ? 'Deselect all rows' : 'Select all rows'"
                    (change)="toggleAll()"
                  />
                </th>
              }

              @for (column of columns(); track column.key) {
                <th
                  scope="col"
                  class="ds-table__header"
                  [class]="headerClass(column)"
                  [style.width]="column.width || null"
                  [attr.aria-sort]="ariaSort(column)"
                >
                  @if (column.sortable) {
                    <button
                      type="button"
                      class="ds-table__sort"
                      (click)="toggleSort(column.key)"
                      [attr.aria-label]="sortLabel(column)"
                    >
                      <span>{{ column.header || column.headerLabel || column.key }}</span>
                      <span class="ds-table__sort-icon" [class.ds-table__sort-icon--on]="activeSort()?.key === column.key">
                        <ds-icon
                          [name]="
                            activeSort()?.key === column.key && activeSort()?.direction === 'desc'
                              ? 'chevronDown'
                              : 'chevronUp'
                          "
                          size="xs"
                        />
                      </span>
                    </button>
                  } @else if (column.header) {
                    <span>{{ column.header }}</span>
                  } @else {
                    <!-- An actions or checkbox column still needs a name. -->
                    <span class="visually-hidden">{{ column.headerLabel || column.key }}</span>
                  }
                </th>
              }
            </tr>
          </thead>

          <tbody>
            @if (loading()) {
              <!-- Skeleton: same shape as the real thing, so nothing jumps -->
              @for (row of skeletonRows(); track row) {
                <tr class="ds-table__row ds-table__row--skeleton" aria-hidden="true">
                  @if (selectable()) {
                    <td class="ds-table__select-cell">
                      <ds-skeleton variant="rect" width="1rem" height="1rem" radius="sm" />
                    </td>
                  }
                  @for (column of columns(); track column.key; let even = $even) {
                    <td [class]="cellClass(column)">
                      <ds-skeleton class="ds-table__skeleton" [width]="even ? '70%' : '45%'" />
                    </td>
                  }
                </tr>
              }
            } @else {
              @for (row of sortedRows(); track keyOf(row); let index = $index) {
                <!--
                  No aria-selected here: it is not allowed on a row inside a
                  plain table, and the row's checkbox already carries the state.
                  When rows are activatable they are focusable and answer to
                  Enter / Space, so the pointer is not the only way in.
                -->
                <tr
                  class="ds-table__row"
                  [class.ds-table__row--selected]="isSelected(row)"
                  [class.ds-table__row--clickable]="clickable()"
                  [attr.tabindex]="clickable() ? 0 : null"
                  [attr.aria-label]="clickable() ? rowActivateLabel(row) : null"
                  (click)="onRowClick(row, $event)"
                  (keydown)="onRowKeydown(row, $event)"
                >
                  @if (selectable()) {
                    <td class="ds-table__select-cell">
                      <input
                        type="checkbox"
                        class="form-check-input"
                        [checked]="isSelected(row)"
                        [attr.aria-label]="selectRowLabel(row, index)"
                        (click)="$event.stopPropagation()"
                        (change)="toggleRow(row)"
                      />
                    </td>
                  }

                  @for (column of columns(); track column.key) {
                    <td [class]="cellClass(column)">
                      @if (templateFor(column.key); as template) {
                        <ng-container
                          [ngTemplateOutlet]="template"
                          [ngTemplateOutletContext]="{
                            $implicit: row,
                            row: row,
                            value: valueOf(row, column),
                            index: index,
                          }"
                        />
                      } @else {
                        {{ textOf(row, column) }}
                      }
                    </td>
                  }
                </tr>
              }
            }
          </tbody>
        </table>

        @if (!loading() && !sortedRows().length) {
          <!--
            The empty state is the molecule, not a copy of it. The hatched band and
            the live region stay here: they belong to the table, not to the message.
          -->
          <div class="ds-table__empty ds-hatch" role="status">
            <ds-empty-state
              class="ds-table__empty-card"
              [icon]="empty().icon ?? null"
              [title]="empty().title"
              [description]="empty().description ?? ''"
            >
              <div dsEmptyStateActions>
                <ng-content select="[dsTableEmptyAction]" />
              </div>
            </ds-empty-state>
          </div>
        }
      </div>

      <div class="ds-table__footer">
        <ng-content select="[dsTableFooter]" />
      </div>

      <!--
        Sorting and select-all change the table without moving focus, so they are
        narrated here. Loading says so too, since the skeleton is aria-hidden.
      -->
      <span class="visually-hidden" aria-live="polite" aria-atomic="true">{{ announcement() }}</span>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .ds-table {
      display: flex;
      flex-direction: column;
      background: var(--ds-color-surface);
      border: 1px solid var(--ds-color-border);
      border-radius: var(--ds-radius-lg);
      overflow: hidden;
    }

    /* —— Toolbar —— */
    .ds-table__toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ds-space-3);
      flex-wrap: wrap;
      padding: var(--ds-space-3) var(--ds-space-4);
      border-bottom: 1px solid var(--ds-color-border);
    }

    .ds-table__caption {
      display: flex;
      align-items: baseline;
      gap: var(--ds-space-2);
      min-width: 0;
    }

    .ds-table__caption-text {
      margin: 0;
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-semibold);
      color: var(--ds-color-text);
    }

    .ds-table__selection-count {
      margin: 0;
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-semibold);
      color: var(--ds-color-primary);
    }

    .ds-table__actions {
      display: flex;
      align-items: center;
      gap: var(--ds-space-2);
    }

    .ds-table__actions:empty {
      display: none;
    }

    /* —— Table —— */
    .ds-table__scroll {
      position: relative;
    }

    .ds-table__scroll--sticky {
      overflow-y: auto;
    }

    .ds-table__table {
      margin: 0;
      font-size: var(--ds-font-size-sm);
    }

    .ds-table__head th {
      position: relative;
      padding-block: var(--ds-space-2_5);
      background: var(--ds-color-surface-sunken);
      border-bottom: 1px solid var(--ds-color-border);
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-semibold);
      letter-spacing: var(--ds-letter-spacing-wide);
      text-transform: uppercase;
      color: var(--ds-color-text-subtle);
      white-space: nowrap;
      vertical-align: middle;
    }

    .ds-table__scroll--sticky .ds-table__head th {
      position: sticky;
      inset-block-start: 0;
      z-index: 2;
    }

    .ds-table__sort {
      display: inline-flex;
      align-items: center;
      gap: var(--ds-space-1);
      border: 0;
      padding: 0;
      background: none;
      color: inherit;
      font: inherit;
      letter-spacing: inherit;
      text-transform: inherit;
      cursor: pointer;
      border-radius: var(--ds-radius-sm);
    }

    .ds-table__sort:hover {
      color: var(--ds-color-text);
    }

    .ds-table__sort-icon {
      display: inline-flex;
      opacity: 0;
      transition: opacity 120ms ease;
    }

    .ds-table__sort:hover .ds-table__sort-icon {
      opacity: 0.5;
    }

    .ds-table__sort-icon--on {
      opacity: 1;
      color: var(--ds-color-primary);
    }

    .ds-table__row td {
      padding-block: var(--ds-space-3);
      border-bottom: 1px solid var(--ds-color-border);
      color: var(--ds-color-text);
      vertical-align: middle;
    }

    .table-sm .ds-table__row td {
      padding-block: var(--ds-space-1_5);
    }

    .ds-table__row:last-child td {
      border-bottom: 0;
    }

    .ds-table__row--clickable {
      cursor: pointer;
    }

    .ds-table__row--clickable:focus-visible {
      outline: 2px solid var(--ds-color-focus-ring);
      outline-offset: -2px;
    }

    .ds-table__row--selected > td {
      background: var(--ds-color-primary-muted);
    }

    .ds-table__select-cell {
      width: 1px;
      white-space: nowrap;
      padding-inline-end: 0;
    }

    .ds-table--bordered .ds-table__table :is(th, td) + :is(th, td) {
      border-inline-start: 1px solid var(--ds-color-border);
    }

    .ds-table__cell--end {
      text-align: end;
    }

    .ds-table__cell--center {
      text-align: center;
    }

    .ds-table__cell--numeric {
      font-variant-numeric: tabular-nums;
    }

    .ds-table__cell--truncate {
      max-width: 18rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* —— Skeleton ——
       The ghost rows are <ds-skeleton>s: the pulse, the colour and the reduced
       motion rules all belong to the atom now. */
    .ds-table__skeleton {
      padding-block: 0.125rem;
    }

    /* —— Empty —— */
    .ds-table__empty {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--ds-space-12) var(--ds-space-4);
      border-top: 1px solid var(--ds-color-border);
    }

    .ds-table__empty-card {
      max-width: 22rem;
      border-radius: var(--ds-radius-lg);
      background: var(--ds-color-surface);
    }

    .ds-table__footer:not(:empty) {
      padding: var(--ds-space-3) var(--ds-space-4);
      border-top: 1px solid var(--ds-color-border);
      background: var(--ds-color-surface-sunken);
    }

  `,
})
export class DataTableComponent<T extends Record<string, unknown> = Record<string, unknown>> {
  readonly columns = input.required<readonly DataTableColumn<T>[]>();
  readonly rows = input.required<readonly T[]>();

  /** Row identity. Defaults to `row.id`. */
  readonly rowKey = input<(row: T) => RowKey>((row) => row['id'] as RowKey);

  /**
   * Human name for a row, used by the selection checkbox and by activatable
   * rows. Without it a screen reader hears "Select row 4" — true, but useless.
   */
  readonly rowLabel = input<((row: T) => string) | null>(null);

  /** Accessible name for the table. Defaults to the caption. */
  readonly label = input<string>('');

  /** Title shown in the toolbar. */
  readonly caption = input<string>('');
  readonly density = input<DataTableDensity>('comfortable');
  readonly hoverable = input(true);
  /** Vertical rules between cells. */
  readonly bordered = input(false);
  /** Pins the header while the body scrolls. Needs `maxHeight`. */
  readonly stickyHeader = input(false);
  /** Any CSS length. Turns the body into a scroll area. */
  readonly maxHeight = input<string>('');
  /** Swaps rows for a skeleton of the same shape. */
  readonly loading = input(false);
  /** Number of skeleton rows while loading. */
  readonly loadingRows = input(5);
  /** Shown when there are no rows. */
  readonly empty = input<DataTableEmpty>({ title: 'Nothing here yet' });

  /** Adds the checkbox column and the master toggle. */
  readonly selectable = input(false);
  /** Selected row keys. Two-way bindable. */
  readonly selection = model<readonly RowKey[]>([]);

  /** Initial / controlled sort. */
  readonly sort = model<DataTableSort | null>(null);
  /** Take over sorting: Paint emits `sortChange` and renders `rows` untouched. */
  readonly manualSort = input(false);

  /** Emits on every sort change, internal or not. */
  readonly sortChange = output<DataTableSort | null>();
  /** Rows look and behave like they can be opened. Pair with `(rowClick)`. */
  readonly clickable = input(false);

  /** Emits when a row is clicked. */
  readonly rowClick = output<T>();

  protected readonly captionId = uniqueId('ds-table-caption');

  /**
   * What the table's live region says.
   *
   * Two sources, and state wins over history: while the table is loading or
   * empty that is the only useful thing to hear; otherwise the region carries
   * the last thing the user did (sorted, selected all).
   */
  private readonly actionMessage = signal('');
  private readonly cellTemplates = contentChildren(DataTableCellDirective);
  private readonly projectedActions = contentChild(DataTableActionsDirective);

  /** The toolbar earns its space when there is something to put in it. */
  protected readonly hasToolbar = computed(
    () => !!this.caption() || !!this.projectedActions() || this.selectable(),
  );

  /** Loading and empty are states, not events: they are derived, not pushed. */
  private readonly statusMessage = computed(() => {
    if (this.loading()) {
      // The skeleton is aria-hidden, so without this the wait is silent.
      return 'Loading rows…';
    }
    return this.sortedRows().length === 0 ? this.empty().title : '';
  });

  protected readonly announcement = computed(() => this.statusMessage() || this.actionMessage());

  protected readonly activeSort = computed(() => this.sort());
  protected readonly clickableRows = computed(() => this.clickable());

  protected readonly skeletonRows = computed(() =>
    Array.from({ length: this.loadingRows() }, (_, index) => index),
  );

  /** Rows in render order: untouched when sorting is manual. */
  protected readonly sortedRows = computed(() => {
    const rows = this.rows();
    const sort = this.sort();

    if (!sort || this.manualSort()) {
      return rows;
    }

    const column = this.columns().find((candidate) => candidate.key === sort.key);
    if (!column) {
      return rows;
    }

    const direction = sort.direction === 'asc' ? 1 : -1;
    const sortValue = (row: T): string | number => {
      if (column.sortValue) {
        return column.sortValue(row);
      }
      const raw = row[column.key];
      if (typeof raw === 'number' || typeof raw === 'string') {
        return raw;
      }
      return String(raw ?? '');
    };

    // Copy first: inputs are not ours to reorder.
    return [...rows].sort((a, b) => {
      const left = sortValue(a);
      const right = sortValue(b);

      if (typeof left === 'number' && typeof right === 'number') {
        return (left - right) * direction;
      }

      return (
        String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' }) *
        direction
      );
    });
  });

  protected readonly allSelected = computed(() => {
    const rows = this.sortedRows();
    return rows.length > 0 && rows.every((row) => this.isSelected(row));
  });

  protected readonly someSelected = computed(() => {
    const rows = this.sortedRows();
    const selected = rows.filter((row) => this.isSelected(row)).length;
    return selected > 0 && selected < rows.length;
  });

  protected keyOf(row: T): RowKey {
    return this.rowKey()(row);
  }

  /** Name of a row, falling back to its position. */
  protected describeRow(row: T, index: number): string {
    const label = this.rowLabel();
    return label ? label(row) : `row ${index + 1}`;
  }

  protected selectRowLabel(row: T, index: number): string {
    return `Select ${this.describeRow(row, index)}`;
  }

  protected rowActivateLabel(row: T): string {
    const label = this.rowLabel();
    return label ? label(row) : '';
  }

  protected isSelected(row: T): boolean {
    return this.selection().includes(this.keyOf(row));
  }

  protected valueOf(row: T, column: DataTableColumn<T>): unknown {
    return row[column.key];
  }

  protected textOf(row: T, column: DataTableColumn<T>): string {
    if (column.format) {
      return column.format(row);
    }
    const value = row[column.key];
    return value === null || value === undefined ? '' : String(value);
  }

  protected templateFor(key: string) {
    return this.cellTemplates().find((cell) => cell.dsCell() === key)?.template ?? null;
  }

  protected headerClass(column: DataTableColumn<T>): string {
    return this.cellClass(column);
  }

  protected cellClass(column: DataTableColumn<T>): string {
    const classes: string[] = [];
    if (column.align === 'end') {
      classes.push('ds-table__cell--end');
    }
    if (column.align === 'center') {
      classes.push('ds-table__cell--center');
    }
    if (column.numeric) {
      classes.push('ds-table__cell--numeric');
    }
    if (column.truncate) {
      classes.push('ds-table__cell--truncate');
    }
    if (column.hideBelow) {
      classes.push(`d-none`, `d-${column.hideBelow}-table-cell`);
    }
    return classes.join(' ');
  }

  protected ariaSort(column: DataTableColumn<T>): 'ascending' | 'descending' | 'none' | null {
    if (!column.sortable) {
      return null;
    }
    const sort = this.sort();
    if (sort?.key !== column.key) {
      return 'none';
    }
    return sort.direction === 'asc' ? 'ascending' : 'descending';
  }

  protected sortLabel(column: DataTableColumn<T>): string {
    const sort = this.sort();
    if (sort?.key !== column.key) {
      return `Sort by ${column.header}`;
    }
    return sort.direction === 'asc'
      ? `Sort by ${column.header}, descending`
      : `Clear sort on ${column.header}`;
  }

  /** asc → desc → none, so a sort is always reversible. */
  protected toggleSort(key: string): void {
    const current = this.sort();
    let next: DataTableSort | null;

    if (current?.key !== key) {
      next = { key, direction: 'asc' };
    } else if (current.direction === 'asc') {
      next = { key, direction: 'desc' as SortDirection };
    } else {
      next = null;
    }

    this.sort.set(next);
    this.sortChange.emit(next);

    const column = this.columns().find((candidate) => candidate.key === key);
    const name = column?.header || column?.headerLabel || key;
    this.actionMessage.set(
      next
        ? `Sorted by ${name}, ${next.direction === 'asc' ? 'ascending' : 'descending'}`
        : `Sorting cleared on ${name}`,
    );
  }

  protected toggleRow(row: T): void {
    const key = this.keyOf(row);
    const selection = this.selection();

    this.selection.set(
      selection.includes(key) ? selection.filter((value) => value !== key) : [...selection, key],
    );
  }

  /** Selects every row currently rendered, or clears them all. */
  protected toggleAll(): void {
    if (this.allSelected()) {
      this.selection.set([]);
      this.actionMessage.set('Selection cleared');
      return;
    }

    const keys = this.sortedRows().map((row) => this.keyOf(row));
    this.selection.set(keys);
    this.actionMessage.set(`${keys.length} rows selected`);
  }

  /** Enter / Space activate a row, the way a button would. */
  protected onRowKeydown(row: T, event: KeyboardEvent): void {
    if (!this.clickable() || (event.key !== 'Enter' && event.key !== ' ')) {
      return;
    }

    const target = event.target as HTMLElement | null;
    // Let controls inside the row keep their own keys.
    if (target?.closest('button, a, input, select, textarea')) {
      return;
    }

    event.preventDefault();
    this.rowClick.emit(row);
  }

  protected onRowClick(row: T, event: MouseEvent): void {
    // A click on a control inside the row belongs to that control — a row menu
    // or a checkbox must never also count as "open this row".
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, a, input, select, textarea, label, [role="menu"]')) {
      return;
    }

    this.rowClick.emit(row);
  }
}
