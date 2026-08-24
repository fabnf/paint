import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DS_COMPONENTS, DS_PRIMITIVES, type PaginationVariant, type SelectOption } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

interface Invoice {
  readonly id: number;
  readonly project: string;
  readonly owner: string;
  readonly amount: number;
  readonly status: 'paid' | 'due' | 'overdue';
}

const PROJECTS = [
  'Mural', 'Canvas', 'Gallery microsite', 'Brush iconography', 'Pigment study',
  'Varnish', 'Gesso', 'Palette knife', 'Studio lighting', 'Colour proofs',
  'Frame shop', 'Easel', 'Linseed', 'Turpentine', 'Sable brushes',
];
const OWNERS = ['Ada Lovelace', 'Grace Hopper', 'Katherine Johnson', 'Mary Jackson'];
const STATUSES = ['paid', 'due', 'overdue'] as const;

/** Deterministic, so the page looks the same on every reload. */
const INVOICES: readonly Invoice[] = Array.from({ length: 43 }, (_, index) => ({
  id: 1042 + index,
  project: PROJECTS[index % PROJECTS.length],
  owner: OWNERS[index % OWNERS.length],
  amount: 400 + ((index * 731) % 9600),
  status: STATUSES[index % STATUSES.length],
}));

/**
 * Pagination — documentation page.
 */
@Component({
  selector: 'app-pagination-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI],
  templateUrl: './pagination.page.html',
  styleUrl: './components-page.scss',
})
export class PaginationPage {
  readonly page = signal(1);
  readonly pageSize = signal(5);
  readonly query = signal('');

  readonly pageSizes: readonly SelectOption[] = [
    { value: 5, label: '5 per page' },
    { value: 10, label: '10 per page' },
    { value: 25, label: '25 per page' },
  ];

  readonly filtered = computed(() => {
    const needle = this.query().trim().toLowerCase();
    return needle
      ? INVOICES.filter((invoice) =>
          [invoice.project, invoice.owner, String(invoice.id)].some((field) =>
            field.toLowerCase().includes(needle),
          ),
        )
      : INVOICES;
  });

  readonly rows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  /** A page that no longer exists is not a page. */
  search(query: string): void {
    this.query.set(query);
    this.page.set(1);
  }

  setPageSize(size: string | number | null): void {
    this.pageSize.set(Number(size ?? 5));
    this.page.set(1);
  }

  tone(status: Invoice['status']) {
    return status === 'paid' ? 'success' : status === 'overdue' ? 'danger' : 'warning';
  }

  // —— Standalone demos ——

  readonly simple = signal(1);
  readonly compact = signal(3);
  readonly variant = signal<PaginationVariant>('pages');

  readonly basicSnippet = `<!-- 57 invoices, ten at a time: it counts the pages -->
<ds-pagination [(page)]="page" [total]="57" [pageSize]="10" [showSummary]="true" />

<!-- Pages you already counted -->
<ds-pagination [(page)]="page" [pageCount]="12" (pageChange)="load($event)" />`;

  readonly listSnippet = `// A filter that empties the list also empties the page you were on.
search(query: string) {
  this.query.set(query);
  this.page.set(1);
}

// template
@if (rows().length) {
  …
  <ds-pagination [(page)]="page" [total]="filtered().length" [pageSize]="pageSize()" [showSummary]="true" />
} @else {
  <ds-empty-state icon="search" title="No invoices match" description="Try another filter.">
    <ds-button dsEmptyStateActions size="sm" variant="secondary" (clicked)="search('')">
      Clear the filter
    </ds-button>
  </ds-empty-state>
}`;

  readonly widthSnippet = `// The slot count never changes as the current page travels, so the
// button under the cursor is still the button under the cursor after
// a click. An ellipsis appears only where it hides more than one page.
paginationRange({ page: 1, pageCount: 10 });  // [1, 2, 3, 4, 5, '…', 10]
paginationRange({ page: 6, pageCount: 10 });  // [1, '…', 5, 6, 7, '…', 10]
paginationRange({ page: 1, pageCount: 7 });   // [1, 2, 3, 4, 5, 6, 7]`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'page', type: 'model<number>', default: '1', description: 'The current page, 1-based. Two-way bindable.' },
    { name: 'total', type: 'number', default: '0', description: 'How many items there are. With pageSize, this counts the pages.' },
    { name: 'pageSize', type: 'number', default: '10', description: 'Items per page.' },
    { name: 'pageCount', type: 'number', default: '0', description: 'Pages you counted yourself. Ignored when total is given.' },
    { name: 'siblingCount', type: 'number', default: '1', description: 'Pages either side of the current one.' },
    { name: 'boundaryCount', type: 'number', default: '1', description: 'Pages pinned at each end.' },
    { name: 'variant', type: `'pages' | 'compact'`, default: `'pages'`, description: 'Buttons, or “3 / 12” between two arrows.' },
    { name: 'size', type: `'sm' | 'md'`, default: `'md'`, description: 'Control height.' },
    { name: 'showSummary', type: 'boolean', default: 'false', description: '“1–10 of 57”. Needs total.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Every button at once, while the page loads.' },
    { name: 'label', type: 'string', default: `'Pagination'`, description: 'Names the <nav>. Two on a page are two landmarks, and need two names.' },
    { name: 'previousLabel / nextLabel / pageLabel', type: '…', default: `'Previous page'…`, description: 'The names of the arrows and of each page button.' },
    { name: 'summary / liveLabel', type: '(…) => string', default: '—', description: 'The summary text, and what the live region says after a change.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'pageChange', type: 'OutputEmitterRef<number>', default: '—', description: 'Emits only when the page actually changes, and never for a page that cannot exist.' },
  ];

  readonly rangeRows: readonly ApiRow[] = [
    { name: 'paginationRange({ page, pageCount, siblingCount, boundaryCount })', type: '=> PaginationSlot[]', default: '—', description: 'Which buttons to draw. Constant width; an ellipsis only where it hides more than one page.' },
    { name: 'pageCountOf(total, pageSize)', type: '=> number', default: '—', description: '1 for an empty list: there is always a page, it just has nothing on it.' },
    { name: 'pageBounds(page, pageSize, total)', type: '=> [number, number]', default: '—', description: 'The 1-based range of items on a page, clamped to what exists.' },
  ];
}
