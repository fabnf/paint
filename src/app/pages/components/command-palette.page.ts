import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  DS_COMPONENTS,
  DS_PRIMITIVES,
  ToastService,
  type CommandPaletteItem,
} from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * CommandPalette — documentation page.
 */
@Component({
  selector: 'app-command-palette-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI],
  templateUrl: './command-palette.page.html',
  styleUrl: './components-page.scss',
})
export class CommandPalettePage {
  private readonly toasts = inject(ToastService);

  readonly lastRun = signal('');

  /** Commands, links and entities — one list, three verbs. */
  readonly commands: readonly CommandPaletteItem[] = [
    // Commands: they *do* something, here and now.
    {
      id: 'new-invoice',
      label: 'New invoice',
      icon: 'plus',
      group: 'Actions',
      keywords: ['create', 'bill'],
      shortcut: 'N',
      run: () => this.toasts.success('Invoice created', { description: 'INV-208, draft.' }),
    },
    {
      id: 'export',
      label: 'Export ledger',
      icon: 'download',
      group: 'Actions',
      keywords: ['csv', 'download'],
      run: () => this.toasts.info('Export started', { description: 'You will get a toast when it lands.' }),
    },
    {
      id: 'toggle-theme',
      label: 'Toggle dark mode',
      icon: 'moon',
      group: 'Actions',
      keywords: ['theme', 'light', 'dark'],
      run: () => this.toasts.info('That one is wired in the header', { description: 'A demo command, politely declining.' }),
    },

    // Links: they go somewhere, through the router.
    { id: 'go-buttons', label: 'Go to Button', icon: 'zap', group: 'Navigate', description: '/primitives/button', link: '/primitives/button' },
    { id: 'go-table', label: 'Go to DataTable', icon: 'table', group: 'Navigate', description: '/components/data-table', link: '/components/data-table' },
    { id: 'go-tokens', label: 'Go to Tokens', icon: 'ruler', group: 'Navigate', description: '/foundations', link: '/foundations' },
    { id: 'go-angular', label: 'Angular documentation', icon: 'externalLink', group: 'Navigate', href: 'https://angular.dev' },

    // Entities: nouns wearing links — searchable by their own words.
    { id: 'inv-203', label: 'INV-203 — Fresco', icon: 'file', group: 'Invoices', description: 'Overdue · $4,100', keywords: ['fresco', 'overdue'], link: '/components/data-table' },
    { id: 'inv-204', label: 'INV-204 — Mural', icon: 'file', group: 'Invoices', description: 'Sent · $960', keywords: ['mural'], link: '/components/data-table' },
    { id: 'inv-205', label: 'INV-205 — Gesso', icon: 'file', group: 'Invoices', description: 'Paid · $2,350', keywords: ['gesso'], link: '/components/data-table' },
  ];

  onRun(item: CommandPaletteItem): void {
    this.lastRun.set(item.id);
  }

  readonly basicSnippet = `<!-- Once, in the shell. ⌘K / Ctrl+K opens it from anywhere. -->
<ds-command-palette [items]="commands" (commandRun)="track($event)" />

readonly commands: CommandPaletteItem[] = [
  // a command: it does something
  { id: 'new', label: 'New invoice', icon: 'plus', group: 'Actions',
    keywords: ['create', 'bill'], run: () => this.createInvoice() },
  // a link: it goes somewhere, through the router
  { id: 'settings', label: 'Go to settings', group: 'Navigate', link: '/settings' },
  // an entity: a noun wearing a link
  { id: 'inv-204', label: 'INV-204 — Mural', group: 'Invoices',
    keywords: ['mural'], link: '/invoices/204' },
];`;

  readonly buttonSnippet = `<!-- The hotkey is the fast path; a visible door still exists. -->
<ds-button variant="secondary" iconStart="search" (clicked)="palette.openPalette()">
  Jump to… <kbd>⌘K</kbd>
</ds-button>
<ds-command-palette #palette [items]="commands" />`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'items', type: 'CommandPaletteItem[]', default: 'required', description: 'Commands (run), links (link/href) and entities, mixed. Groups become section headers.' },
    { name: 'open', type: 'model<boolean>', default: 'false', description: 'Two-way visibility. The hotkey and Escape drive it too.' },
    { name: 'hotkey', type: 'boolean', default: 'true', description: '⌘K / Ctrl+K anywhere on the page. Off for hosts that own the key.' },
    { name: 'placeholder / label / emptyText', type: 'string', default: 'sensible words', description: 'The input’s invitation, the dialog’s name, the empty line.' },
    { name: 'limit', type: 'number', default: '50', description: 'Most rows shown at once — a palette is a funnel, not a directory.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'commandRun', type: 'OutputEmitterRef<CommandPaletteItem>', default: '—', description: 'Every selection, links included — for telemetry.' },
  ];

  readonly methods: readonly ApiRow[] = [
    { name: 'openPalette() / close()', type: 'method', default: '—', description: 'The visible door: a “Jump to…” button in a toolbar.' },
    { name: 'scoreCommand(query, item)', type: 'function', default: '—', description: 'The exported matcher: prefix > word boundary > substring > keyword > description.' },
    { name: 'filterCommands(query, items, limit?)', type: 'function', default: '—', description: 'The matching items, best first, ties in input order.' },
  ];
}
