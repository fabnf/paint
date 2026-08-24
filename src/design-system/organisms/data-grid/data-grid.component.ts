import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  input,
  model,
  output,
  signal,
  untracked,
} from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import type {
  ColDef,
  GetRowIdParams,
  GridApi,
  GridReadyEvent,
  RowClickedEvent,
  RowSelectionOptions,
  Theme,
} from 'ag-grid-community';
import { SpinnerComponent } from '../../primitives/spinner';
import { EmptyStateComponent } from '../../molecules/empty-state';
import { uniqueId } from '../../utils';
import type { RowKey } from '../data-table/data-table.types';
import { DataGridActionsDirective } from './data-grid-slots';
import { paintGridTheme, paintGridThemeCompact, registerPaintGridModules } from './data-grid.theme';
import type { DataGridColumn, DataGridDensity, DataGridEmpty, DataGridOptions } from './data-grid.types';

/**
 * DataGrid — the heavy-duty sibling of `<ds-data-table>`.
 *
 * AG Grid Community, wearing Paint. The table stays the right answer for rows
 * of record — it owns its own markup, semantics and empty/loading story, and
 * it costs nothing. This organism is for the screens the table politely
 * declines: thousands of rows, column resize and reorder, per-column filters,
 * virtualised scrolling — an operations console, not a settings page.
 *
 * **The wrapper is deliberately thin.** Paint adds exactly the chrome that
 * makes the grid feel native — the DataTable's toolbar (caption, "n selected",
 * an actions slot), its empty state and loading overlay, a footer slot, and a
 * token bridge so the grid follows Paint's theme at runtime — and then gets
 * out of the way. Columns are AG `ColDef`s, `(gridReady)` hands out the real
 * `GridApi`, and `[options]` passes anything this façade has no opinion about.
 * No Enterprise modules, no licence key, ever.
 *
 * @example
 * ```html
 * <ds-data-grid
 *   caption="Trades"
 *   [columns]="columns"
 *   [rows]="trades()"
 *   [rowKey]="byId"
 *   [selectable]="true"
 *   [(selection)]="selected"
 *   [quickFilter]="query()"
 *   [empty]="{ icon: 'search', title: 'No trades match' }"
 * >
 *   <ds-flex dsGridActions [gap]="2">
 *     <ds-search-field label="Search trades" [labelHidden]="true" [(value)]="query" />
 *   </ds-flex>
 * </ds-data-grid>
 * ```
 */
@Component({
  selector: 'ds-data-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AgGridAngular, SpinnerComponent, EmptyStateComponent],
  template: `
    <div class="ds-grid" [class.ds-grid--bordered]="bordered()">
      @if (hasToolbar()) {
        <div class="ds-grid__toolbar">
          <div class="ds-grid__caption">
            @if (caption()) {
              <p class="ds-grid__caption-text" [id]="captionId">{{ caption() }}</p>
            }
            @if (selectable() && selection().length) {
              <p class="ds-grid__selection-count">{{ selection().length }} selected</p>
            }
          </div>
          <div class="ds-grid__actions">
            <ng-content select="[dsGridActions]" />
          </div>
        </div>
      }

      <div
        class="ds-grid__viewport"
        role="region"
        [attr.aria-label]="label() || caption() || 'Data grid'"
        [attr.aria-busy]="loading() ? 'true' : null"
        [style.height]="height()"
      >
        <ag-grid-angular
          class="ds-grid__ag"
          [theme]="resolvedTheme()"
          [rowData]="rowsForGrid()"
          [columnDefs]="columnsForGrid()"
          [defaultColDef]="resolvedDefaultColDef()"
          [rowSelection]="rowSelectionOptions()"
          [getRowId]="getRowId"
          [quickFilterText]="quickFilter()"
          [suppressNoRowsOverlay]="true"
          [gridOptions]="options()"
          (gridReady)="onGridReady($event)"
          (selectionChanged)="onSelectionChanged()"
          (rowClicked)="onRowClicked($event)"
        />

        <!--
          Paint's overlays, not AG's: the same empty state and the same wait as
          every other organism, painted over the rows but under the header —
          the columns stay readable while there is nothing beneath them.
        -->
        @if (loading()) {
          <div class="ds-grid__overlay">
            <ds-spinner size="lg" [label]="loadingLabel()" />
          </div>
        } @else if (rows().length === 0) {
          <div class="ds-grid__overlay">
            <ds-empty-state
              [icon]="empty().icon ?? null"
              [title]="empty().title"
              [description]="empty().description ?? ''"
              size="sm"
            >
              <span dsEmptyStateActions><ng-content select="[dsGridEmptyAction]" /></span>
            </ds-empty-state>
          </div>
        }
      </div>

      <div class="ds-grid__footer">
        <ng-content select="[dsGridFooter]" />
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    /* The DataTable's chrome, on the heavier engine. */
    .ds-grid {
      background: var(--ds-color-surface);
      border-radius: var(--ds-radius-lg);
    }

    .ds-grid--bordered {
      border: 1px solid var(--ds-color-border);
    }

    .ds-grid__toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ds-space-3);
      flex-wrap: wrap;
      padding: var(--ds-space-3) var(--ds-space-4);
      border-bottom: 1px solid var(--ds-color-border);
    }

    .ds-grid__caption {
      display: flex;
      align-items: baseline;
      gap: var(--ds-space-2);
      min-width: 0;
    }

    .ds-grid__caption-text {
      margin: 0;
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-semibold);
      color: var(--ds-color-text);
    }

    .ds-grid__selection-count {
      margin: 0;
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-semibold);
      color: var(--ds-color-primary);
    }

    .ds-grid__actions {
      display: flex;
      align-items: center;
      gap: var(--ds-space-2);
    }

    .ds-grid__actions:empty {
      display: none;
    }

    .ds-grid__viewport {
      position: relative;
    }

    .ds-grid__ag {
      display: block;
      width: 100%;
      height: 100%;
    }

    /* Toolbar and footer own the outer corners; the grid keeps the rest. */
    .ds-grid:has(.ds-grid__toolbar) .ds-grid__ag {
      --ag-wrapper-border-top-left-radius: 0;
      --ag-wrapper-border-top-right-radius: 0;
    }

    .ds-grid:has(.ds-grid__footer:not(:empty)) .ds-grid__ag {
      --ag-wrapper-border-bottom-left-radius: 0;
      --ag-wrapper-border-bottom-right-radius: 0;
    }

    .ds-grid__overlay {
      position: absolute;
      /* Below the header row, over the empty canvas where rows would be. */
      inset: calc(var(--ds-space-12)) var(--ds-space-px) var(--ds-space-px);
      display: flex;
      align-items: center;
      justify-content: center;
      background: color-mix(in srgb, var(--ds-color-surface) 72%, transparent);
      backdrop-filter: blur(1px);
    }

    .ds-grid__footer:not(:empty) {
      padding: var(--ds-space-3) var(--ds-space-4);
      border-top: 1px solid var(--ds-color-border);
      background: var(--ds-color-surface-sunken);
      border-end-start-radius: var(--ds-radius-lg);
      border-end-end-radius: var(--ds-radius-lg);
    }
  `,
})
export class DataGridComponent<T extends Record<string, unknown> = Record<string, unknown>> {
  /** AG `ColDef`s, not a Paint dialect: the grid's language is the column's. */
  readonly columns = input.required<readonly DataGridColumn<T>[]>();
  readonly rows = input.required<readonly T[]>();
  /**
   * Identity of a row — the DataTable's contract, handed to AG as `getRowId`,
   * which is what keeps selection and row state stable across data refreshes.
   */
  readonly rowKey = input<(row: T) => RowKey>((row) => row['id'] as RowKey);

  /** Accessible name for the grid region. Defaults to the caption. */
  readonly label = input<string>('');
  /** Toolbar caption. Showing it shows the toolbar. */
  readonly caption = input<string>('');
  readonly density = input<DataGridDensity>('comfortable');
  readonly bordered = input(false);
  /** The grid virtualises inside a fixed height; give it one. */
  readonly height = input<string>('28rem');

  /** Shows Paint's wait over the rows. The columns stay readable. */
  readonly loading = input(false);
  readonly loadingLabel = input<string>('Loading rows…');
  /** Copy for the empty state — the DataTable's shape, unchanged. */
  readonly empty = input<DataGridEmpty>({ title: 'Nothing here yet' });

  /** Checkbox multi-selection, with the header master checkbox. */
  readonly selectable = input(false);
  /** Selected row keys. Two-way bindable, and stable across refreshes. */
  readonly selection = model<readonly RowKey[]>([]);

  /** AG quick filter, exposed so the toolbar's search box is one binding away. */
  readonly quickFilter = input<string>('');

  /** Merged over Paint's defaults (`sortable`, `resizable`, `flex: 1`). */
  readonly defaultColDef = input<ColDef<T>>({});
  /** The escape hatch: anything this façade has no opinion about. */
  readonly options = input<DataGridOptions<T>>({});
  /** Overrides the token-bridged theme, for products that build their own. */
  readonly theme = input<Theme | null>(null);

  /** A row was clicked. The grid does not decide what that means. */
  readonly rowClick = output<T>();
  /** AG's real `GridApi`, for everything the thin wrapper refuses to re-wrap. */
  readonly gridReady = output<GridApi<T>>();

  protected readonly captionId = uniqueId('ds-grid-caption');

  private readonly api = signal<GridApi<T> | null>(null);
  /** True while this component is the one moving selection: breaks the echo. */
  private syncingSelection = false;

  private readonly projectedActions = contentChild(DataGridActionsDirective);

  protected readonly hasToolbar = computed(
    () => !!this.caption() || !!this.projectedActions() || this.selectable(),
  );

  protected readonly resolvedTheme = computed(
    () => this.theme() ?? (this.density() === 'compact' ? paintGridThemeCompact() : paintGridTheme()),
  );

  /** AG mutates its inputs' types; hand it fresh arrays, keep ours readonly. */
  protected readonly rowsForGrid = computed(() => [...this.rows()]);
  protected readonly columnsForGrid = computed(() => [...this.columns()]);

  protected readonly resolvedDefaultColDef = computed<ColDef<T>>(() => ({
    sortable: true,
    resizable: true,
    flex: 1,
    minWidth: 110,
    ...this.defaultColDef(),
  }));

  protected readonly rowSelectionOptions = computed<RowSelectionOptions<T> | undefined>(() =>
    this.selectable()
      ? {
          mode: 'multiRow',
          checkboxes: true,
          headerCheckbox: true,
          // Clicking a row reads it; the checkbox selects it. Same split as
          // the DataTable, where rowClick and selection never fight.
          enableClickSelection: false,
        }
      : undefined,
  );

  protected readonly getRowId = (params: GetRowIdParams<T>): string =>
    String(this.rowKey()(params.data));

  constructor() {
    registerPaintGridModules();

    // Selection written from outside lands on the grid's nodes.
    effect(() => {
      const keys = this.selection();
      const api = this.api();
      if (!api || untracked(() => this.syncingSelection)) {
        return;
      }
      this.applySelection(api, keys);
    });
  }

  protected onGridReady(event: GridReadyEvent<T>): void {
    this.api.set(event.api);
    this.applySelection(event.api, this.selection());
    this.gridReady.emit(event.api);
  }

  protected onSelectionChanged(): void {
    const api = this.api();
    if (!api) {
      return;
    }

    const keys = api.getSelectedRows().map((row) => this.rowKey()(row));
    if (!sameKeys(keys, this.selection())) {
      this.syncingSelection = true;
      this.selection.set(keys);
      this.syncingSelection = false;
    }
  }

  protected onRowClicked(event: RowClickedEvent<T>): void {
    if (event.data !== undefined) {
      this.rowClick.emit(event.data);
    }
  }

  private applySelection(api: GridApi<T>, keys: readonly RowKey[]): void {
    const wanted = new Set(keys.map(String));
    const select: Parameters<GridApi<T>['setNodesSelected']>[0]['nodes'] = [];
    const deselect: typeof select = [];

    api.forEachNode((node) => {
      const selected = node.id !== undefined && wanted.has(node.id);
      if (selected !== node.isSelected()) {
        (selected ? select : deselect).push(node);
      }
    });

    if (select.length === 0 && deselect.length === 0) {
      return;
    }

    this.syncingSelection = true;
    if (select.length) {
      api.setNodesSelected({ nodes: select, newValue: true });
    }
    if (deselect.length) {
      api.setNodesSelected({ nodes: deselect, newValue: false });
    }
    this.syncingSelection = false;
  }
}

/** Same keys, order ignored: selection is a set that happens to be an array. */
function sameKeys(a: readonly RowKey[], b: readonly RowKey[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const bSet = new Set(b.map(String));
  return a.every((key) => bSet.has(String(key)));
}
