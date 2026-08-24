import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  DS_COMPONENTS,
  DS_PRIMITIVES,
  EMPTY_FILTER_STATE,
  countActiveFilters,
  type FilterDefinition,
  type FilterState,
} from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

interface Invoice {
  id: string;
  project: string;
  owner: string;
  status: 'paid' | 'sent' | 'overdue';
  amount: string;
}

const INVOICES: readonly Invoice[] = [
  { id: 'INV-201', project: 'Mural', owner: 'ada', status: 'paid', amount: '$1,200' },
  { id: 'INV-202', project: 'Canvas', owner: 'grace', status: 'sent', amount: '$840' },
  { id: 'INV-203', project: 'Fresco', owner: 'katherine', status: 'overdue', amount: '$4,100' },
  { id: 'INV-204', project: 'Mural', owner: 'ada', status: 'sent', amount: '$960' },
  { id: 'INV-205', project: 'Gesso', owner: 'grace', status: 'paid', amount: '$2,350' },
  { id: 'INV-206', project: 'Canvas', owner: 'katherine', status: 'overdue', amount: '$715' },
  { id: 'INV-207', project: 'Fresco', owner: 'ada', status: 'paid', amount: '$3,020' },
];

const OWNER_NAMES: Record<string, string> = {
  ada: 'Ada Lovelace',
  grace: 'Grace Hopper',
  katherine: 'Katherine Johnson',
};

/**
 * FilterBar — documentation page.
 */
@Component({
  selector: 'app-filter-bar-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI],
  templateUrl: './filter-bar.page.html',
  styleUrl: './components-page.scss',
})
export class FilterBarPage {
  readonly filters: readonly FilterDefinition[] = [
    {
      id: 'status',
      label: 'Status',
      icon: 'tag',
      options: [
        { value: 'paid', label: 'Paid' },
        { value: 'sent', label: 'Sent' },
        { value: 'overdue', label: 'Overdue' },
      ],
    },
    {
      id: 'owner',
      label: 'Owner',
      icon: 'user',
      searchable: true,
      options: Object.entries(OWNER_NAMES).map(([value, label]) => ({ value, label })),
    },
  ];

  readonly invoices = INVOICES;
  readonly ownerNames = OWNER_NAMES;

  // —— the live demo ——
  readonly state = signal<FilterState>(EMPTY_FILTER_STATE);

  readonly filtered = computed(() => this.applyState(this.state()));

  // —— the apply-mode demo ——
  readonly appliedState = signal<FilterState>(EMPTY_FILTER_STATE);
  readonly applying = signal(false);
  readonly appliedResults = signal<readonly Invoice[]>(INVOICES);

  onApply(state: FilterState): void {
    // Pretend the server is involved: applyMode exists for exactly this.
    this.applying.set(true);
    setTimeout(() => {
      this.appliedResults.set(this.applyState(state));
      this.applying.set(false);
    }, 600);
  }

  activeCount(state: FilterState): number {
    return countActiveFilters(state);
  }

  private applyState(state: FilterState): Invoice[] {
    const search = state.search.trim().toLowerCase();
    const statuses = state.values['status'] ?? [];
    const owners = state.values['owner'] ?? [];

    return INVOICES.filter(
      (invoice) =>
        (!search ||
          invoice.id.toLowerCase().includes(search) ||
          invoice.project.toLowerCase().includes(search)) &&
        (statuses.length === 0 || statuses.includes(invoice.status)) &&
        (owners.length === 0 || owners.includes(invoice.owner)),
    );
  }

  readonly liveSnippet = `<ds-filter-bar
  [filters]="filters"
  [(state)]="state"
  [resultCount]="filtered().length"
  searchLabel="Search invoices"
/>

// FilterState is plain, serialisable data: { search, values: { status: ['paid'], … } }
readonly filtered = computed(() => applyState(invoices, this.state()));`;

  readonly applySnippet = `<!-- Expensive query? Edits collect in a draft; nothing emits until Apply. -->
<ds-filter-bar
  [filters]="filters"
  [(state)]="applied"
  [applyMode]="true"
  [loading]="querying()"
  (stateChange)="runQuery($event)"
/>`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'filters', type: 'FilterDefinition[]', default: 'required', description: 'One entry per filter: id, label, SelectOptions, multiple?, searchable?, icon?.' },
    { name: 'state', type: 'model<FilterState>', default: 'EMPTY_FILTER_STATE', description: 'Search text + selected values, two-way, serialisable. Moves on commits only.' },
    { name: 'applyMode', type: 'boolean', default: 'false', description: 'Collect edits in a draft; emit only on Apply. Chips keep showing what is applied.' },
    { name: 'showSearch', type: 'boolean', default: 'true', description: 'The search field. Off for a bar that is all filters.' },
    { name: 'resultCount', type: 'number | null', default: 'null', description: 'Fed back from the consumer’s list; the search live region announces it.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'The consumer’s query is in flight — shown in the search field.' },
    { name: 'searchDebounce', type: 'number', default: '300', description: 'The search field’s debounce, forwarded.' },
    { name: 'label / searchLabel / searchPlaceholder / applyLabel / clearLabel / chipsLabel', type: 'string', default: 'sensible words', description: 'Every string, replaceable.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'The whole bar.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'stateChange', type: 'OutputEmitterRef<FilterState>', default: '—', description: 'Every committed state: each edit live, or each Apply. Never draft keystrokes.' },
    { name: 'cleared', type: 'OutputEmitterRef<void>', default: '—', description: 'The Clear button. The state has already been emptied and emitted.' },
  ];

  readonly slots: readonly ApiRow[] = [
    { name: '[dsFilterBarActions]', type: 'content', default: '—', description: 'Trailing controls that are not filters: a view toggle, an export menu.' },
  ];
}
