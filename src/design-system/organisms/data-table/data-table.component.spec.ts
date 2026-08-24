import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DataTableCellDirective } from './data-table-cell.directive';
import {
  DataTableActionsDirective,
  DataTableEmptyActionDirective,
  DataTableFooterDirective,
} from './data-table-slots';
import { DataTableComponent } from './data-table.component';
import type { DataTableColumn, DataTableSort, RowKey } from './data-table.types';

interface Row extends Record<string, unknown> {
  id: number;
  project: string;
  amount: number;
  updated: string;
  updatedAt: number;
}

const ROWS: readonly Row[] = [
  { id: 1, project: 'Canvas', amount: 900, updated: '3 days ago', updatedAt: 72 },
  { id: 2, project: 'Atlas', amount: 18400, updated: 'Yesterday', updatedAt: 26 },
  { id: 3, project: 'Mural', amount: 4200, updated: '2 hours ago', updatedAt: 2 },
];

@Component({
  standalone: true,
  imports: [
    DataTableComponent,
    DataTableCellDirective,
    DataTableActionsDirective,
    DataTableFooterDirective,
    DataTableEmptyActionDirective,
  ],
  template: `
    <ds-data-table
      [columns]="columns"
      [rows]="rows()"
      [rowKey]="rowKey"
      [rowLabel]="rowLabel"
      [clickable]="clickable()"
      [caption]="caption"
      [selectable]="selectable()"
      [(selection)]="selection"
      [(sort)]="sort"
      [manualSort]="manualSort()"
      [loading]="loading()"
      [loadingRows]="3"
      [density]="density()"
      [empty]="{ icon: 'search', title: 'Nothing found', description: 'Try another filter.' }"
      (sortChange)="sorts.push($event)"
      (rowClick)="clicked.push($event)"
    >
      <button type="button" dsTableActions id="toolbar-action">Export</button>

      <ng-template dsCell="project" [dsCellRows]="rows()" let-row let-value="value" let-index="index">
        <span class="custom-cell">{{ index }}:{{ row.project }}:{{ value }}</span>
      </ng-template>

      <span dsTableFooter id="footer">1–3 of 3</span>
      <button type="button" dsTableEmptyAction id="empty-action">New</button>
    </ds-data-table>
  `,
})
class HostComponent {
  readonly rows = signal<readonly Row[]>(ROWS);
  readonly rowKey = (row: Row): RowKey => row.id;
  readonly rowLabel = (row: Row): string => row.project;
  readonly clickable = signal(false);
  caption = 'Invoices';
  readonly selectable = signal(true);
  selection: readonly RowKey[] = [];
  sort: DataTableSort | null = null;
  readonly manualSort = signal(false);
  readonly loading = signal(false);
  readonly density = signal<'comfortable' | 'compact'>('comfortable');
  sorts: Array<DataTableSort | null> = [];
  clicked: Row[] = [];

  readonly columns: readonly DataTableColumn<Row>[] = [
    { key: 'project', header: 'Project', sortable: true },
    { key: 'amount', header: 'Amount', sortable: true, align: 'end', numeric: true, format: (row) => `$${row.amount}` },
    { key: 'updated', header: 'Updated', sortable: true, sortValue: (row) => row.updatedAt, hideBelow: 'md' },
    { key: 'actions', header: '', headerLabel: 'Actions', width: '3rem' },
  ];
}

describe('DataTableComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const headers = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('th'));
  const rows = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('tbody tr:not(.ds-table__row--skeleton)'));
  const cellText = (rowIndex: number, cellIndex: number): string =>
    rows()[rowIndex].querySelectorAll('td')[cellIndex].textContent!.trim();
  const checkboxes = (): HTMLInputElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('tbody .form-check-input'));
  const masterCheckbox = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('thead .form-check-input');
  const sortButton = (index: number): HTMLButtonElement =>
    headers()[index].querySelector('.ds-table__sort')!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders Bootstrap table markup', () => {
    const table = fixture.nativeElement.querySelector('table');

    expect(table.classList).toContain('table');
    expect(fixture.nativeElement.querySelector('.table-responsive')).toBeTruthy();
    expect(rows().length).toBe(3);
  });

  it('renders a header per column, plus the selection column', () => {
    // 4 columns + the checkbox column
    expect(headers().length).toBe(5);
    expect(headers()[1].textContent).toContain('Project');
  });

  it('names a column whose header is intentionally blank', () => {
    const actions = headers()[4];

    expect(actions.textContent!.trim()).toBe('Actions');
    expect(actions.querySelector('.visually-hidden')).toBeTruthy();
  });

  it('names the table from its caption', () => {
    const table = fixture.nativeElement.querySelector('table');
    const labelledBy = table.getAttribute('aria-labelledby');

    expect(document.getElementById(labelledBy)!.textContent).toContain('Invoices');
    // aria-rowcount belongs to grids, not to a plain table.
    expect(table.hasAttribute('aria-rowcount')).toBeFalse();
  });

  it('keeps row-level ARIA legal: no aria-selected on a table row', () => {
    checkboxes()[0].click();
    fixture.detectChanges();

    expect(rows()[0].hasAttribute('aria-selected')).toBeFalse();
    expect(checkboxes()[0].checked).toBeTrue();
  });

  it('names the selection checkbox after the row, not its index', () => {
    expect(checkboxes()[0].getAttribute('aria-label')).toBe('Select Canvas');
  });

  it('makes activatable rows focusable and answer to Enter and Space', () => {
    host.clickable.set(true);
    fixture.detectChanges();

    const row = rows()[0];
    expect(row.getAttribute('tabindex')).toBe('0');

    row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    expect(host.clicked.length).toBe(1);

    row.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.detectChanges();
    expect(host.clicked.length).toBe(2);
  });

  it('leaves rows out of the tab order when they are not activatable', () => {
    expect(rows()[0].hasAttribute('tabindex')).toBeFalse();
  });

  it('announces a sort change', () => {
    const live = (): string =>
      fixture.nativeElement.querySelector('[aria-live="polite"]').textContent.trim();

    sortButton(1).click();
    fixture.detectChanges();
    expect(live()).toBe('Sorted by Project, ascending');

    sortButton(1).click();
    fixture.detectChanges();
    expect(live()).toBe('Sorted by Project, descending');

    sortButton(1).click();
    fixture.detectChanges();
    expect(live()).toBe('Sorting cleared on Project');
  });

  it('announces select-all and clearing', () => {
    const live = (): string =>
      fixture.nativeElement.querySelector('[aria-live="polite"]').textContent.trim();

    masterCheckbox().click();
    fixture.detectChanges();
    expect(live()).toBe('3 rows selected');

    masterCheckbox().click();
    fixture.detectChanges();
    expect(live()).toBe('Selection cleared');
  });

  it('marks itself busy and says so while loading', () => {
    host.loading.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('table').getAttribute('aria-busy')).toBe('true');
    expect(fixture.nativeElement.querySelector('[aria-live="polite"]').textContent).toContain(
      'Loading rows',
    );
  });

  it('announces the empty state', () => {
    host.rows.set([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ds-table__empty').getAttribute('role')).toBe('status');
    expect(fixture.nativeElement.querySelector('[aria-live="polite"]').textContent).toContain(
      'Nothing found',
    );
  });

  it('formats cells and keeps raw values out of the DOM', () => {
    expect(cellText(0, 2)).toBe('$900');
  });

  it('renders a projected cell template with row, value and index', () => {
    expect(fixture.nativeElement.querySelectorAll('.custom-cell').length).toBe(3);
    expect(cellText(0, 1)).toBe('0:Canvas:Canvas');
  });

  it('projects toolbar, footer and caption', () => {
    expect(fixture.nativeElement.querySelector('#toolbar-action')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#footer')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.ds-table__caption-text').textContent).toContain(
      'Invoices',
    );
  });

  it('applies alignment, numeric and responsive column classes', () => {
    const amountCell = rows()[0].querySelectorAll('td')[2];
    const updatedCell = rows()[0].querySelectorAll('td')[3];

    expect(amountCell.classList).toContain('ds-table__cell--end');
    expect(amountCell.classList).toContain('ds-table__cell--numeric');
    expect(updatedCell.classList).toContain('d-none');
    expect(updatedCell.classList).toContain('d-md-table-cell');
  });

  it('maps density onto .table-sm', () => {
    host.density.set('compact');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('table').classList).toContain('table-sm');
  });

  // —— sorting ——

  it('cycles a sortable header asc → desc → none', () => {
    sortButton(1).click();
    fixture.detectChanges();
    expect(host.sort).toEqual({ key: 'project', direction: 'asc' });
    expect(cellText(0, 1)).toContain('Atlas');

    sortButton(1).click();
    fixture.detectChanges();
    expect(host.sort).toEqual({ key: 'project', direction: 'desc' });
    expect(cellText(0, 1)).toContain('Mural');

    sortButton(1).click();
    fixture.detectChanges();
    expect(host.sort).toBeNull();
    expect(cellText(0, 1)).toContain('Canvas');
    expect(host.sorts.length).toBe(3);
  });

  it('sorts numbers numerically', () => {
    sortButton(2).click();
    fixture.detectChanges();

    expect(rows().map((row) => row.querySelectorAll('td')[2].textContent!.trim())).toEqual([
      '$900',
      '$4200',
      '$18400',
    ]);
  });

  it('sorts by sortValue when the cell text is not comparable', () => {
    sortButton(3).click();
    fixture.detectChanges();

    // 2 hours → yesterday → 3 days, not alphabetical.
    expect(rows().map((row) => row.querySelectorAll('td')[3].textContent!.trim())).toEqual([
      '2 hours ago',
      'Yesterday',
      '3 days ago',
    ]);
  });

  it('publishes aria-sort on the sorted column only', () => {
    sortButton(1).click();
    fixture.detectChanges();

    expect(headers()[1].getAttribute('aria-sort')).toBe('ascending');
    expect(headers()[2].getAttribute('aria-sort')).toBe('none');
  });

  it('never reorders the input array', () => {
    const original = [...host.rows()];
    sortButton(1).click();
    fixture.detectChanges();

    expect(host.rows()).toEqual(original);
  });

  it('leaves row order alone when sorting is manual, but still emits', () => {
    host.manualSort.set(true);
    fixture.detectChanges();

    sortButton(1).click();
    fixture.detectChanges();

    expect(host.sorts).toEqual([{ key: 'project', direction: 'asc' }]);
    expect(cellText(0, 1)).toContain('Canvas');
  });

  // —— selection ——

  it('selects and deselects a row by key', () => {
    checkboxes()[0].click();
    fixture.detectChanges();
    expect(host.selection).toEqual([1]);

    checkboxes()[0].click();
    fixture.detectChanges();
    expect(host.selection).toEqual([]);
  });

  it('selects every rendered row from the master checkbox, and clears it', () => {
    masterCheckbox().click();
    fixture.detectChanges();
    expect(host.selection).toEqual([1, 2, 3]);
    expect(masterCheckbox().checked).toBeTrue();

    masterCheckbox().click();
    fixture.detectChanges();
    expect(host.selection).toEqual([]);
  });

  it('goes indeterminate on a partial selection', () => {
    checkboxes()[0].click();
    fixture.detectChanges();

    expect(masterCheckbox().indeterminate).toBeTrue();
    expect(masterCheckbox().checked).toBeFalse();
  });

  it('keeps the selection across a sort', () => {
    checkboxes()[0].click();
    fixture.detectChanges();

    sortButton(1).click();
    fixture.detectChanges();

    expect(host.selection).toEqual([1]);
    expect(fixture.nativeElement.querySelectorAll('.ds-table__row--selected').length).toBe(1);
  });

  it('hides the selection column when selectable is off', () => {
    host.selectable.set(false);
    fixture.detectChanges();

    expect(headers().length).toBe(4);
    expect(checkboxes().length).toBe(0);
  });

  it('emits rowClick without toggling selection', () => {
    rows()[1].click();
    fixture.detectChanges();

    expect(host.clicked.length).toBe(1);
    expect(host.clicked[0].project).toBe('Atlas');
    expect(host.selection).toEqual([]);
  });

  it('does not treat a click on a control inside the row as a row click', () => {
    checkboxes()[0].click();
    fixture.detectChanges();

    expect(host.selection).toEqual([1]);
    expect(host.clicked.length).toBe(0);
  });

  // —— states ——

  it('swaps rows for a skeleton while loading', () => {
    host.loading.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.ds-table__row--skeleton').length).toBe(3);
    expect(rows().length).toBe(0);
    expect(fixture.nativeElement.querySelector('.ds-table__empty')).toBeNull();
  });

  it('renders the empty state, with its projected action', () => {
    host.rows.set([]);
    fixture.detectChanges();

    const empty = fixture.nativeElement.querySelector('.ds-table__empty');
    expect(empty.textContent).toContain('Nothing found');
    expect(empty.textContent).toContain('Try another filter.');
    expect(fixture.nativeElement.querySelector('#empty-action')).toBeTruthy();
  });

  it('disables the master checkbox when there is nothing to select', () => {
    host.rows.set([]);
    fixture.detectChanges();

    expect(masterCheckbox().disabled).toBeTrue();
  });
});
