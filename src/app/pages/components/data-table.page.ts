import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  DS_COMPONENTS,
  DS_PRIMITIVES,
  ToastService,
  type DataTableColumn,
  type DataTableDensity,
  type DataTableSort,
  type MenuEntry,
  type RowKey,
} from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

interface Invoice extends Record<string, unknown> {
  id: number;
  project: string;
  owner: string;
  status: 'Paid' | 'Due' | 'Overdue' | 'Draft';
  amount: number;
  updated: string;
  updatedAt: number;
}

const INVOICES: readonly Invoice[] = [
  { id: 1, project: 'Mural — March', owner: 'Ada Lovelace', status: 'Paid', amount: 4200, updated: '2 hours ago', updatedAt: 2 },
  { id: 2, project: 'Canvas rebrand', owner: 'Grace Hopper', status: 'Due', amount: 18400, updated: 'Yesterday', updatedAt: 26 },
  { id: 3, project: 'Pigment audit', owner: 'Alan Turing', status: 'Paid', amount: 900, updated: '3 days ago', updatedAt: 72 },
  { id: 4, project: 'Gallery microsite', owner: 'Katherine Johnson', status: 'Overdue', amount: 12750, updated: 'Last week', updatedAt: 168 },
  { id: 5, project: 'Brush iconography', owner: 'Mary Jackson', status: 'Draft', amount: 3100, updated: '20 minutes ago', updatedAt: 0.3 },
  { id: 6, project: 'Studio lighting', owner: 'Ada Lovelace', status: 'Paid', amount: 7600, updated: '4 days ago', updatedAt: 96 },
];

/**
 * DataTable — documentation page.
 */
@Component({
  selector: 'app-data-table-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI],
  templateUrl: './data-table.page.html',
  styleUrl: './components-page.scss',
})
export class DataTablePage {
  private readonly toasts = inject(ToastService);

  readonly invoices = INVOICES;
  readonly rowKey = (row: Invoice): RowKey => row.id;
  readonly rowLabel = (row: Invoice): string => row.project;

  readonly columns: readonly DataTableColumn<Invoice>[] = [
    { key: 'project', header: 'Project', sortable: true, truncate: true },
    { key: 'owner', header: 'Owner', sortable: true, hideBelow: 'md' },
    { key: 'status', header: 'Status' },
    {
      key: 'updated',
      header: 'Updated',
      sortable: true,
      align: 'end',
      hideBelow: 'lg',
      // Sorting by "2 hours ago" would sort alphabetically — sort by hours.
      sortValue: (row) => row.updatedAt,
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      align: 'end',
      numeric: true,
      format: (row) => `$${row.amount.toLocaleString('en-US')}`,
    },
    { key: 'actions', header: '', width: '3rem', align: 'end' },
  ];

  readonly simpleColumns: readonly DataTableColumn<Invoice>[] = [
    { key: 'project', header: 'Project', sortable: true },
    { key: 'owner', header: 'Owner' },
    {
      key: 'amount',
      header: 'Amount',
      align: 'end',
      numeric: true,
      sortable: true,
      format: (row) => `$${row.amount.toLocaleString('en-US')}`,
    },
  ];

  readonly selection = signal<readonly RowKey[]>([2]);
  readonly sort = signal<DataTableSort | null>({ key: 'amount', direction: 'desc' });
  readonly density = signal<DataTableDensity>('comfortable');
  readonly loading = signal(false);
  readonly query = signal('');

  readonly rowEntries: readonly MenuEntry[] = [
    { id: 'open', label: 'Open invoice', icon: 'externalLink' },
    { id: 'duplicate', label: 'Duplicate', icon: 'copy' },
    { type: 'divider' },
    { id: 'void', label: 'Void invoice', icon: 'trash', destructive: true },
  ];

  readonly filtered = computed(() => {
    const query = this.query().trim().toLowerCase();
    if (!query) {
      return this.invoices;
    }
    return this.invoices.filter(
      (invoice) =>
        invoice.project.toLowerCase().includes(query) || invoice.owner.toLowerCase().includes(query),
    );
  });

  readonly selectedTotal = computed(() =>
    this.invoices
      .filter((invoice) => this.selection().includes(invoice.id))
      .reduce((total, invoice) => total + invoice.amount, 0),
  );

  readonly basicSnippet = `readonly columns: DataTableColumn<Invoice>[] = [
  { key: 'project', header: 'Project', sortable: true, truncate: true },
  { key: 'owner', header: 'Owner', sortable: true, hideBelow: 'md' },
  { key: 'status', header: 'Status' },
  {
    key: 'updated',
    header: 'Updated',
    sortable: true,
    align: 'end',
    sortValue: (row) => row.updatedAt,   // "2 hours ago" is not sortable text
  },
  {
    key: 'amount',
    header: 'Amount',
    align: 'end',
    numeric: true,
    sortable: true,
    format: (row) => \`$\${row.amount.toLocaleString()}\`,
  },
];`;

  readonly templateSnippet = `<ds-data-table
  caption="Invoices"
  [columns]="columns"
  [rows]="rows"
  [rowKey]="byId"
  [selectable]="true"
  [(selection)]="selection"
  [(sort)]="sort"
  (rowClick)="open($event)"
>
  <!-- Toolbar -->
  <ds-flex dsTableActions [gap]="2">
    <ds-menu label="Export" variant="secondary" size="sm" icon="download" [entries]="exportEntries" />
  </ds-flex>

  <!-- Any column can render anything Paint can draw -->
  <ng-template dsCell="status" [dsCellRows]="rows" let-row>
    <span class="badge">{{ row.status }}</span>
  </ng-template>

  <!-- Footer: pagination, totals, load more -->
  <ds-flex dsTableFooter justify="between">…</ds-flex>
</ds-data-table>`;

  readonly selectionSnippet = `<!-- selection is a model of row keys, not of rows -->
readonly selection = signal<readonly RowKey[]>([]);

<ds-data-table [selectable]="true" [(selection)]="selection" [rowKey]="byId" … />`;

  readonly sortSnippet = `<!-- Internal sorting (default): asc → desc → none -->
<ds-data-table [columns]="columns" [rows]="rows" [(sort)]="sort" />

<!-- Server-side: Paint emits, you fetch -->
<ds-data-table
  [columns]="columns"
  [rows]="page()"
  [manualSort]="true"
  [sort]="sort()"
  (sortChange)="fetch($event)"
/>`;

  readonly tableApi: readonly ApiRow[] = [
    { name: 'columns', type: 'readonly DataTableColumn<T>[]', default: '—', description: 'Required. Keys, headers, alignment, sorting, formatting.' },
    { name: 'rows', type: 'readonly T[]', default: '—', description: 'Required. Paint never mutates or reorders this array.' },
    { name: 'rowKey', type: '(row: T) => RowKey', default: 'row => row.id', description: 'Row identity, used for tracking and selection.' },
    {
      name: 'rowLabel',
      type: '(row: T) => string | null',
      default: 'null',
      description: 'Human name for a row. Names the selection checkbox — “Select Mural”, not “Select row 4”.',
    },
    { name: 'caption', type: 'string', default: `''`, description: 'Title in the toolbar, and the table’s accessible name.' },
    { name: 'label', type: 'string', default: `''`, description: 'Accessible name for the table when there is no visible caption.' },
    { name: 'density', type: `'comfortable' | 'compact'`, default: `'comfortable'`, description: 'Row height. Compact maps to .table-sm.' },
    { name: 'hoverable', type: 'boolean', default: 'true', description: 'Row hover highlight (.table-hover).' },
    { name: 'bordered', type: 'boolean', default: 'false', description: 'Vertical rules between cells.' },
    { name: 'stickyHeader', type: 'boolean', default: 'false', description: 'Pins the header. Needs maxHeight.' },
    { name: 'maxHeight', type: 'string', default: `''`, description: 'Any CSS length. Turns the body into a scroll area.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Swaps rows for a skeleton of the same shape.' },
    { name: 'loadingRows', type: 'number', default: '5', description: 'Skeleton row count.' },
    { name: 'empty', type: 'DataTableEmpty', default: `{ title: 'Nothing here yet' }`, description: 'Icon, title and description for the empty state.' },
    { name: 'selectable', type: 'boolean', default: 'false', description: 'Adds the checkbox column and the master toggle.' },
    { name: 'selection', type: 'model<readonly RowKey[]>', default: '[]', description: 'Selected row keys. Two-way bindable.' },
    { name: 'sort', type: 'model<DataTableSort | null>', default: 'null', description: 'Active sort. Two-way bindable.' },
    { name: 'manualSort', type: 'boolean', default: 'false', description: 'Paint stops sorting and only emits sortChange.' },
    { name: 'clickable', type: 'boolean', default: 'false', description: 'Rows look interactive. Pair with (rowClick).' },
  ];

  readonly tableOutputs: readonly ApiRow[] = [
    { name: 'sortChange', type: 'OutputEmitterRef<DataTableSort | null>', default: '—', description: 'Emits on every sort change.' },
    { name: 'rowClick', type: 'OutputEmitterRef<T>', default: '—', description: 'Emits the clicked row.' },
  ];

  readonly columnApi: readonly ApiRow[] = [
    { name: 'key', type: 'string', default: '—', description: 'Property name, and the key [dsCell] matches on.' },
    { name: 'header', type: 'string', default: '—', description: 'Column label. Empty string for an actions column.' },
    { name: 'align', type: `'start' | 'center' | 'end'`, default: `'start'`, description: 'Cell and header alignment.' },
    { name: 'width', type: 'string', default: '—', description: 'Any CSS width.' },
    { name: 'sortable', type: 'boolean', default: 'false', description: 'Enables the header’s sort control.' },
    { name: 'format', type: '(row: T) => string', default: '—', description: 'Renders the cell as text.' },
    { name: 'sortValue', type: '(row: T) => string | number', default: '—', description: 'Sort key when the raw value is not comparable.' },
    { name: 'truncate', type: 'boolean', default: 'false', description: 'One line with an ellipsis.' },
    { name: 'numeric', type: 'boolean', default: 'false', description: 'Tabular figures, so digits line up.' },
    { name: 'hideBelow', type: `'sm' | 'md' | 'lg' | 'xl'`, default: '—', description: 'Hides the column below that breakpoint.' },
    {
      name: 'headerLabel',
      type: 'string',
      default: '—',
      description: 'Name for a column with a blank header (actions, avatars) — rendered visually hidden.',
    },
  ];

  readonly slots: readonly ApiRow[] = [
    { name: '[dsCell]="key"', type: 'ng-template', default: '—', description: 'Renders a column. Context: row, value, index.' },
    { name: '[dsCellRows]', type: 'input', default: '—', description: 'Bind your rows on the template to type `let-row`.' },
    { name: '[dsTableActions]', type: 'content', default: '—', description: 'Toolbar content, beside the caption.' },
    { name: '[dsTableFooter]', type: 'content', default: '—', description: 'Footer content: pagination, totals.' },
    { name: '[dsTableEmptyAction]', type: 'content', default: '—', description: 'Action inside the empty state.' },
  ];

  onRowAction(id: string, invoice: Invoice): void {
    this.toasts.info(`${id} → ${invoice.project}`, { duration: 2500 });
  }

  open(invoice: Invoice): void {
    this.toasts.info(`Opening ${invoice.project}`, { duration: 2000 });
  }

  toggleLoading(): void {
    this.loading.set(true);
    setTimeout(() => this.loading.set(false), 2200);
  }

  clearSelection(): void {
    this.selection.set([]);
  }

  setQuery(value: string): void {
    this.query.set(value);
  }
}
