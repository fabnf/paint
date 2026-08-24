import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DS_COMPONENTS, DS_PRIMITIVES } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * EmptyState — documentation page.
 */
@Component({
  selector: 'app-empty-state-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI],
  templateUrl: './empty-state.page.html',
  styleUrl: './components-page.scss',
})
export class EmptyStatePage {
  readonly kind = signal<'first-run' | 'no-results' | 'no-access'>('first-run');

  readonly kinds = [
    { value: 'first-run', label: 'Nothing yet' },
    { value: 'no-results', label: 'Nothing found' },
    { value: 'no-access', label: 'Nothing allowed' },
  ];

  readonly threeEmptiesSnippet = `<!-- Nothing yet: the only empty state that is an invitation -->
<ds-empty-state icon="plus" title="No projects yet" description="Start one, and it appears here.">
  <ds-button dsEmptyStateActions iconStart="plus">New project</ds-button>
</ds-empty-state>

<!-- Nothing found: fifty rows are behind that query. Never offer "create your first…" -->
<ds-empty-state icon="search" title="No invoices match" description="Try another filter." [live]="true">
  <ds-button dsEmptyStateActions variant="secondary" (clicked)="clear()">Clear filters</ds-button>
</ds-empty-state>

<!-- Nothing allowed: say what happened -->
<ds-empty-state icon="warning" tone="warning" title="You cannot see this project"
                description="Ask an owner for access." />`;

  readonly tableSnippet = `<!-- DataTable draws this one for you, from its empty input -->
<ds-data-table [rows]="[]" [empty]="{ icon: 'search', title: 'No invoices', description: 'Try another filter.' }">
  <ds-button dsTableEmptyAction variant="primary" size="sm" iconStart="plus">New invoice</ds-button>
</ds-data-table>`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'title', type: 'string', default: '—', description: 'Required. Say the noun: “No invoices”, not “Nothing to show”.' },
    { name: 'description', type: 'string', default: `''`, description: 'Why, and what to do. One sentence.' },
    { name: 'icon', type: 'IconName | null', default: 'null', description: 'A glyph on a tinted disc. Decorative — the title says the same thing.' },
    { name: 'tone', type: 'Tone', default: `'primary'`, description: 'Tints the icon’s disc. The rest of the block stays neutral.' },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'sm fits inside a card; lg fills a page.' },
    { name: 'align', type: `'center' | 'start'`, default: `'center'`, description: 'Centred, or ranged left with the content around it.' },
    { name: 'textured', type: 'boolean', default: 'false', description: 'Hatched paper and a dashed edge, for an empty state that fills a panel.' },
    { name: 'headingLevel', type: '0 | 2 | 3 | 4 | 5 | 6', default: '0', description: '0 renders a <p>: an <h2> in the middle of a table lies about the outline.' },
    { name: 'live', type: 'boolean', default: 'false', description: 'Announce it politely. Only for an empty state that *replaces* content.' },
  ];

  readonly slots: readonly ApiRow[] = [
    { name: '[dsEmptyStateActions]', type: 'content', default: '—', description: 'The way out. One primary action, at most one secondary.' },
    { name: '[dsEmptyStateMedia]', type: 'content', default: '—', description: 'An illustration instead of an icon. Give it an empty alt.' },
    { name: '(default)', type: 'content', default: '—', description: 'Anything between the description and the actions.' },
  ];
}
