import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  DS_COMPONENTS,
  DS_PRIMITIVES,
  type DataTableColumn,
  type DrawerPosition,
  type DrawerSize,
  type RowKey,
} from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

interface Invoice extends Record<string, unknown> {
  id: string;
  project: string;
  owner: string;
  issued: string;
  amount: string;
  status: 'Paid' | 'Sent' | 'Overdue';
}

const INVOICES: readonly Invoice[] = [
  { id: 'INV-201', project: 'Mural', owner: 'Ada Lovelace', issued: '2026-03-02', amount: '$1,200', status: 'Paid' },
  { id: 'INV-202', project: 'Canvas', owner: 'Grace Hopper', issued: '2026-03-05', amount: '$840', status: 'Sent' },
  { id: 'INV-203', project: 'Fresco', owner: 'Katherine Johnson', issued: '2026-03-09', amount: '$4,100', status: 'Overdue' },
  { id: 'INV-204', project: 'Mural', owner: 'Ada Lovelace', issued: '2026-03-14', amount: '$960', status: 'Sent' },
];

/**
 * Drawer — documentation page.
 */
@Component({
  selector: 'app-drawer-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI],
  templateUrl: './drawer.page.html',
  styleUrl: './components-page.scss',
})
export class DrawerPage {
  // —— the detail drawer, opened from a table row ——
  readonly invoices = signal<readonly Invoice[]>(INVOICES);
  readonly selected = signal<Invoice | null>(null);
  readonly detailOpen = signal(false);

  readonly columns: readonly DataTableColumn<Invoice>[] = [
    { key: 'id', header: 'Invoice' },
    { key: 'project', header: 'Project' },
    { key: 'issued', header: 'Issued' },
    { key: 'amount', header: 'Amount', align: 'end', numeric: true },
    { key: 'status', header: 'Status' },
  ];
  readonly rowKey = (row: Invoice): RowKey => row.id;
  readonly rowLabel = (row: Invoice): string => row.id;

  openDetail(row: Invoice): void {
    this.selected.set(row);
    this.detailOpen.set(true);
  }

  markPaid(): void {
    const current = this.selected();
    if (!current) {
      return;
    }
    this.invoices.update((rows) =>
      rows.map((row) => (row.id === current.id ? { ...row, status: 'Paid' as const } : row)),
    );
    this.detailOpen.set(false);
  }

  statusTone(status: Invoice['status']): 'success' | 'warning' | 'danger' {
    return status === 'Paid' ? 'success' : status === 'Sent' ? 'warning' : 'danger';
  }

  // —— positions and sizes ——
  readonly variantOpen = signal(false);
  readonly position = signal<DrawerPosition>('end');
  readonly size = signal<DrawerSize>('md');

  openVariant(position: DrawerPosition, size: DrawerSize): void {
    this.position.set(position);
    this.size.set(size);
    this.variantOpen.set(true);
  }

  // —— the form drawer ——
  readonly formOpen = signal(false);
  readonly savedName = signal('Mural');
  readonly draftName = signal('Mural');

  saveForm(): void {
    this.savedName.set(this.draftName());
    this.formOpen.set(false);
  }

  readonly detailSnippet = `<ds-data-table … [clickable]="true" (rowClick)="openDetail($event)" />

<ds-drawer [(open)]="detailOpen" [title]="selected()?.id ?? ''" description="Invoice detail" icon="file">
  <ds-stack [gap]="4">…the row, in full…</ds-stack>

  <ds-flex dsDrawerActions [gap]="2" justify="end">
    <ds-button variant="ghost" (clicked)="detailOpen.set(false)">Close</ds-button>
    <ds-button variant="primary" (clicked)="markPaid()">Mark paid</ds-button>
  </ds-flex>
</ds-drawer>

<!-- Closing puts focus back on the row that opened it. The Dialog's bargain. -->`;

  readonly formSnippet = `<ds-drawer [(open)]="formOpen" title="Rename project" size="sm">
  <!-- A drawer that exists to be typed into says so: -->
  <ds-input label="Project name" dsDrawerAutofocus [(value)]="draft" />

  <ds-flex dsDrawerActions [gap]="2" justify="end">
    <ds-button variant="ghost" (clicked)="formOpen.set(false)">Cancel</ds-button>
    <ds-button variant="primary" (clicked)="save()">Save</ds-button>
  </ds-flex>
</ds-drawer>`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'open', type: 'model<boolean>', default: 'false', description: 'Visibility. Two-way bindable.' },
    { name: 'title', type: 'string', default: 'required', description: 'A drawer without a title cannot be announced.' },
    { name: 'description', type: 'string', default: `''`, description: 'Supporting line under the title, wired to aria-describedby.' },
    { name: 'position', type: `'end' | 'start'`, default: `'end'`, description: 'Which edge it slides from. end is where detail panes live.' },
    { name: 'size', type: `'sm' | 'md' | 'lg' | 'xl'`, default: `'md'`, description: '20 / 26 / 34 / 44rem, never wider than the viewport leaves.' },
    { name: 'icon', type: 'IconName | null', default: 'null', description: 'A tile beside the title.' },
    { name: 'dismissible', type: 'boolean', default: 'true', description: 'Escape, the backdrop and the close button. Off, and none of them are offered.' },
    { name: 'closeLabel', type: 'string', default: `'Close panel'`, description: 'The close button’s accessible name.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'closed', type: `OutputEmitterRef<'dismiss' | 'escape' | 'backdrop' | 'api'>`, default: '—', description: 'How it was closed.' },
    { name: 'opened', type: 'OutputEmitterRef<void>', default: '—', description: 'Open, and focus has moved inside.' },
  ];

  readonly slots: readonly ApiRow[] = [
    { name: '(default)', type: 'content', default: '—', description: 'The body.' },
    { name: '[dsDrawerActions]', type: 'content', default: '—', description: 'The footer. Exists only when something is projected into it.' },
    { name: '[dsDrawerAutofocus]', type: 'attribute', default: '—', description: 'Takes initial focus instead of the panel.' },
  ];
}
