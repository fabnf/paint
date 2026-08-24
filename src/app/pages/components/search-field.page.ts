import { ChangeDetectionStrategy, Component, OnDestroy, signal } from '@angular/core';
import { DS_COMPONENTS, DS_PRIMITIVES } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

interface Invoice {
  readonly id: string;
  readonly project: string;
  readonly owner: string;
  readonly amount: string;
}

const INVOICES: readonly Invoice[] = [
  { id: '1042', project: 'Mural', owner: 'Ada Lovelace', amount: '$4,200' },
  { id: '1043', project: 'Canvas', owner: 'Grace Hopper', amount: '$18,400' },
  { id: '1044', project: 'Gallery microsite', owner: 'Katherine Johnson', amount: '$2,100' },
  { id: '1045', project: 'Brush iconography', owner: 'Mary Jackson', amount: '$900' },
  { id: '1046', project: 'Pigment study', owner: 'Dorothy Vaughan', amount: '$7,650' },
];

/**
 * SearchField — documentation page.
 */
@Component({
  selector: 'app-search-field-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI],
  templateUrl: './search-field.page.html',
  styleUrl: './components-page.scss',
})
export class SearchFieldPage implements OnDestroy {
  readonly query = signal('');
  readonly searching = signal(false);
  readonly results = signal<readonly Invoice[]>(INVOICES);
  /** Every query the field has actually emitted — the point of the demo. */
  readonly emitted = signal<readonly string[]>([]);

  readonly filter = signal('');

  private timer: ReturnType<typeof setTimeout> | null = null;

  /** A fake backend: 600ms of thinking, then an answer. */
  run(query: string): void {
    this.emitted.update((queries) => [...queries, query || '(empty)'].slice(-6));
    this.stop();
    this.searching.set(true);

    this.timer = setTimeout(() => {
      const needle = query.trim().toLowerCase();
      this.results.set(
        needle
          ? INVOICES.filter((invoice) =>
              [invoice.project, invoice.owner, invoice.id].some((field) =>
                field.toLowerCase().includes(needle),
              ),
            )
          : INVOICES,
      );
      this.searching.set(false);
      this.timer = null;
    }, 600);
  }

  /** The in-memory case: no debounce, no spinner, no backend. */
  readonly filtered = () => {
    const needle = this.filter().trim().toLowerCase();
    return needle
      ? INVOICES.filter((invoice) => invoice.project.toLowerCase().includes(needle))
      : INVOICES;
  };

  private stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  ngOnDestroy(): void {
    this.stop();
  }

  readonly basicSnippet = `<ds-search-field
  label="Search invoices"
  [labelHidden]="true"
  [(value)]="query"
  [loading]="searching()"
  [resultCount]="results().length"
  (search)="run($event)"
/>`;

  readonly debounceSnippet = `<!-- A remote search waits for the typing to stop -->
<ds-search-field [debounce]="300" (search)="fetch($event)" />

<!-- A filter over data already in memory does not -->
<ds-search-field [debounce]="0" [(value)]="filter" />`;

  readonly landmarkSnippet = `<!-- The page's search, once -->
<ds-search-field label="Search the docs" [landmark]="true" />

<!-- A filter on a list: not a landmark -->
<ds-search-field label="Filter projects" />`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'value', type: 'model<string>', default: `''`, description: 'The query. Two-way bindable and form-bound.' },
    { name: 'label', type: 'string', default: `'Search'`, description: 'The field’s name.' },
    { name: 'labelHidden', type: 'boolean', default: 'false', description: 'Keeps the name, loses the visible label.' },
    { name: 'placeholder', type: 'string', default: `'Search…'`, description: 'An example, not a label.' },
    { name: 'debounce', type: 'number', default: '300', description: 'Milliseconds of silence before `search` fires. 0 emits on every keystroke.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'A query is in flight: a decorative spinner inside the field, and “Searching…” once.' },
    { name: 'resultCount', type: 'number | null', default: 'null', description: 'Results for the settled query, announced politely. null says nothing.' },
    { name: 'resultLabel', type: '(count: number) => string', default: '“n results”', description: 'How the count is spoken.' },
    { name: 'loadingLabel', type: 'string', default: `'Searching…'`, description: 'What the status region says while a query is in flight.' },
    { name: 'landmark', type: 'boolean', default: 'false', description: 'Makes this the role="search" landmark for its region. One per region.' },
    { name: 'clearable', type: 'boolean', default: 'true', description: 'The clear affordance, and Escape.' },
    { name: 'hint / error', type: 'string', default: `''`, description: 'Passed through to the input.' },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Control height.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the field. Forms can disable it too.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'search', type: 'OutputEmitterRef<string>', default: '—', description: 'The settled query. Debounced, de-duplicated, and immediate on a clear.' },
    { name: 'submitted', type: 'OutputEmitterRef<string>', default: '—', description: 'Enter. Flushes any pending debounce first.' },
    { name: 'cleared', type: 'OutputEmitterRef<void>', default: '—', description: 'The field was emptied, by the button or by Escape.' },
  ];
}
