import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import type { DataTableEmpty, RowKey } from '../data-table/data-table.types';

/**
 * A column of the grid **is** an AG Grid `ColDef` — deliberately.
 *
 * The DataTable owns its own column schema because it owns its own rendering.
 * This organism does not: AG Grid renders, and a Paint-shaped wrapper type
 * that re-spelled `field`/`headerName`/`valueFormatter` would be a dialect of
 * a language products already speak, drifting further from it every release.
 * The alias exists so imports read as Paint; the shape stays AG's.
 */
export type DataGridColumn<T = Record<string, unknown>> = ColDef<T>;

/** The grid options escape hatch, typed. */
export type DataGridOptions<T = Record<string, unknown>> = GridOptions<T>;

/** AG's imperative surface, handed out by `(gridReady)` for whoever needs it. */
export type DataGridApi<T = Record<string, unknown>> = GridApi<T>;

/** The DataTable's empty-state copy, unchanged: same screens, same words. */
export type DataGridEmpty = DataTableEmpty;

/** The DataTable's density vocabulary, driving the grid theme's spacing. */
export type DataGridDensity = 'comfortable' | 'compact';

export type { RowKey };
