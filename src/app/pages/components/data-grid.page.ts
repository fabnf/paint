import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  DS_COMPONENTS,
  DS_PRIMITIVES,
  type RowKey,
} from '../../../design-system';
import {
  DataGridActionsDirective,
  DataGridComponent,
  DataGridEmptyActionDirective,
  DataGridFooterDirective,
  type DataGridColumn,
  type DataGridDensity,
} from '../../../design-system/organisms/data-grid';
import { DOC_UI, type ApiRow } from '../../docs';

interface Trade extends Record<string, unknown> {
  id: string;
  desk: string;
  instrument: string;
  side: 'Buy' | 'Sell';
  quantity: number;
  price: number;
  status: 'Filled' | 'Working' | 'Cancelled';
}

const DESKS = ['Rates', 'Credit', 'FX', 'Equities', 'Commodities'] as const;
const INSTRUMENTS = [
  'BUND 10Y', 'UST 2Y', 'EUR/USD', 'GBP/JPY', 'PAINT 26s', 'MURAL 4.2% 31',
  'CANVAS EQ', 'FRESCO EQ', 'WTI APR', 'XAU SPOT', 'OAT 30Y', 'GILT 5Y',
] as const;
const STATUSES = ['Filled', 'Working', 'Cancelled'] as const;

/** Deterministic rows: the demo must not reshuffle on every reload. */
function makeTrades(count: number): Trade[] {
  let seed = 42;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  return Array.from({ length: count }, (_, index) => {
    const price = 40 + random() * 160;
    return {
      id: `TRD-${String(1001 + index)}`,
      desk: DESKS[Math.floor(random() * DESKS.length)],
      instrument: INSTRUMENTS[Math.floor(random() * INSTRUMENTS.length)],
      side: random() > 0.5 ? ('Buy' as const) : ('Sell' as const),
      quantity: Math.ceil(random() * 200) * 25,
      price: Math.round(price * 100) / 100,
      status: STATUSES[Math.floor(random() * STATUSES.length)],
    };
  });
}

/**
 * DataGrid — documentation page.
 */
@Component({
  selector: 'app-data-grid-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DS_PRIMITIVES,
    DS_COMPONENTS,
    DOC_UI,
    // The grid is an explicit import, never part of DS_COMPONENTS: it carries
    // AG Grid, and only the screens that render one should pay for it.
    DataGridComponent,
    DataGridActionsDirective,
    DataGridFooterDirective,
    DataGridEmptyActionDirective,
  ],
  templateUrl: './data-grid.page.html',
  styleUrl: './components-page.scss',
})
export class DataGridPage {
  readonly trades = signal<readonly Trade[]>(makeTrades(500));
  readonly selected = signal<readonly RowKey[]>([]);
  readonly query = signal('');
  readonly density = signal<DataGridDensity>('comfortable');
  readonly lastClicked = signal('');

  // —— the states demo ——
  readonly stateLoading = signal(false);
  readonly stateRows = signal<readonly Trade[]>([]);

  readonly columns: readonly DataGridColumn<Trade>[] = [
    { field: 'id', headerName: 'Trade', minWidth: 120, filter: true },
    { field: 'desk', headerName: 'Desk', filter: true },
    { field: 'instrument', headerName: 'Instrument', minWidth: 140, filter: true },
    { field: 'side', headerName: 'Side', maxWidth: 110 },
    {
      field: 'quantity',
      headerName: 'Qty',
      type: 'rightAligned',
      maxWidth: 120,
      valueFormatter: (params) => (params.value as number).toLocaleString('en-GB'),
    },
    {
      field: 'price',
      headerName: 'Price',
      type: 'rightAligned',
      maxWidth: 130,
      valueFormatter: (params) => (params.value as number).toFixed(2),
    },
    { field: 'status', headerName: 'Status', filter: true, maxWidth: 140 },
  ];

  readonly byId = (row: Trade): RowKey => row.id;

  readonly filledCount = computed(
    () => this.trades().filter((trade) => trade.status === 'Filled').length,
  );

  onRowClick(row: Trade): void {
    this.lastClicked.set(`${row.id} — ${row.instrument}`);
  }

  toggleDensity(): void {
    this.density.update((density) => (density === 'compact' ? 'comfortable' : 'compact'));
  }

  loadStateRows(): void {
    this.stateLoading.set(true);
    this.stateRows.set([]);
    setTimeout(() => {
      this.stateRows.set(makeTrades(40));
      this.stateLoading.set(false);
    }, 1500);
  }

  clearStateRows(): void {
    this.stateLoading.set(false);
    this.stateRows.set([]);
  }

  readonly gridSnippet = `<ds-data-grid
  caption="Trades"
  [columns]="columns"      <!-- AG ColDefs, not a Paint dialect -->
  [rows]="trades()"        <!-- 500 rows; the grid virtualises -->
  [rowKey]="byId"
  [selectable]="true"
  [(selection)]="selected"
  [quickFilter]="query()"
  [density]="density()"
  (rowClick)="open($event)"
>
  <ds-flex dsGridActions [gap]="2">
    <ds-search-field label="Search trades" [labelHidden]="true" [(value)]="query" />
    <ds-button variant="ghost" size="sm" (clicked)="toggleDensity()">Density</ds-button>
  </ds-flex>

  <ds-flex dsGridFooter justify="between">
    <ds-text variant="caption">{{ trades().length }} trades</ds-text>
  </ds-flex>
</ds-data-grid>`;

  readonly themeSnippet = `// organisms/data-grid/data-grid.theme.ts — the whole bridge, abridged:
export const paintGridTheme = themeQuartz.withParams({
  accentColor: 'var(--ds-color-primary)',
  backgroundColor: 'var(--ds-color-surface)',
  foregroundColor: 'var(--ds-color-text)',
  borderColor: 'var(--ds-color-border)',
  headerBackgroundColor: 'var(--ds-color-surface-sunken)',
  fontFamily: 'var(--ds-font-sans)',
  wrapperBorderRadius: 'var(--ds-radius-lg)',
  browserColorScheme: 'inherit',
  // …
});

// var() references, not copied colours: flip Paint to dark and the grid
// flips with it. No second theme object, no re-render.`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'columns', type: 'DataGridColumn<T>[] (= AG ColDef<T>)', default: 'required', description: 'AG column definitions, verbatim. The grid’s language is the column’s.' },
    { name: 'rows', type: 'readonly T[]', default: 'required', description: 'Row data. The grid virtualises; bring thousands.' },
    { name: 'rowKey', type: '(row: T) => RowKey', default: 'row.id', description: 'Identity — the DataTable’s contract, handed to AG as getRowId. Keeps selection stable across refreshes.' },
    { name: 'label / caption', type: 'string', default: `''`, description: 'Region name and toolbar caption, exactly as on the DataTable.' },
    { name: 'density', type: `'comfortable' | 'compact'`, default: `'comfortable'`, description: 'One knob, the theme’s spacing: paddings and row heights follow.' },
    { name: 'height', type: 'string', default: `'28rem'`, description: 'The grid virtualises inside a fixed height; give it one.' },
    { name: 'bordered', type: 'boolean', default: 'false', description: 'A border around the whole organism.' },
    { name: 'loading / loadingLabel', type: 'boolean / string', default: 'false', description: 'Paint’s wait, painted over the rows. The columns stay readable.' },
    { name: 'empty', type: 'DataGridEmpty', default: `{ title: 'Nothing here yet' }`, description: 'The DataTable’s empty-state copy, unchanged.' },
    { name: 'selectable', type: 'boolean', default: 'false', description: 'Checkbox multi-selection with the header master checkbox. Clicking a row never selects it.' },
    { name: 'selection', type: 'model<readonly RowKey[]>', default: '[]', description: 'Selected keys, two-way, same shape as the DataTable.' },
    { name: 'quickFilter', type: 'string', default: `''`, description: 'AG’s quick filter, exposed so the toolbar’s search box is one binding away.' },
    { name: 'defaultColDef', type: 'ColDef<T>', default: 'sortable, resizable, flex', description: 'Merged over Paint’s defaults.' },
    { name: 'options', type: 'GridOptions<T>', default: '{}', description: 'The escape hatch: anything this façade has no opinion about.' },
    { name: 'theme', type: 'Theme | null', default: 'the token bridge', description: 'Overrides paintGridTheme for products that build their own.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'rowClick', type: 'OutputEmitterRef<T>', default: '—', description: 'A row was clicked. The grid does not decide what that means.' },
    { name: 'gridReady', type: 'OutputEmitterRef<GridApi<T>>', default: '—', description: 'AG’s real API, for everything the thin wrapper refuses to re-wrap.' },
  ];

  readonly slots: readonly ApiRow[] = [
    { name: '[dsGridActions]', type: 'content', default: '—', description: 'The toolbar. Same showing rules as the DataTable: caption, selection, or this.' },
    { name: '[dsGridFooter]', type: 'content', default: '—', description: 'Totals, pagination, a “load more”.' },
    { name: '[dsGridEmptyAction]', type: 'content', default: '—', description: 'The way out of the empty state.' },
  ];
}
