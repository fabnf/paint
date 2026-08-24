import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { GridApi } from 'ag-grid-community';
import type { RowKey } from '../data-table/data-table.types';
import { DataGridComponent } from './data-grid.component';
import type { DataGridDensity } from './data-grid.types';
import type { DataGridColumn } from './data-grid.types';

interface Row extends Record<string, unknown> {
  id: string;
  project: string;
  amount: number;
}

const ROWS: readonly Row[] = [
  { id: 'r1', project: 'Mural', amount: 4200 },
  { id: 'r2', project: 'Canvas', amount: 18400 },
  { id: 'r3', project: 'Fresco', amount: 960 },
];

@Component({
  standalone: true,
  imports: [DataGridComponent],
  template: `
    <ds-data-grid
      [caption]="caption()"
      [columns]="columns"
      [rows]="rows()"
      [rowKey]="byId"
      [selectable]="selectable()"
      [(selection)]="selection"
      [quickFilter]="quickFilter()"
      [loading]="loading()"
      [density]="density()"
      height="20rem"
      [empty]="{ icon: 'search', title: 'No rows match', description: 'Widen the filter.' }"
      (rowClick)="clicked.push($event)"
      (gridReady)="api = $event"
    >
      <div dsGridActions><button type="button" id="toolbar-action">Export</button></div>
      <button dsGridEmptyAction type="button" id="empty-action">Load rows</button>
      <span dsGridFooter id="footer-note">3 rows</span>
    </ds-data-grid>
  `,
})
class HostComponent {
  readonly caption = signal('Invoices');
  readonly rows = signal<readonly Row[]>(ROWS);
  readonly selectable = signal(true);
  readonly selection = signal<readonly RowKey[]>([]);
  readonly quickFilter = signal('');
  readonly loading = signal(false);
  readonly density = signal<DataGridDensity>('comfortable');
  readonly columns: readonly DataGridColumn<Row>[] = [
    { field: 'id', headerName: 'Id' },
    { field: 'project', headerName: 'Project' },
    { field: 'amount', headerName: 'Amount', type: 'rightAligned' },
  ];
  readonly byId = (row: Row): RowKey => row.id;
  clicked: Row[] = [];
  api: GridApi<Row> | null = null;
}

describe('DataGridComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const root = (): HTMLElement => fixture.nativeElement.querySelector('ds-data-grid');
  const query = <E extends HTMLElement>(selector: string): E | null =>
    root().querySelector(selector);
  /** Rows AG says exist (not just the virtualised ones). */
  const rowCount = (): number =>
    Number(query('.ag-root')?.getAttribute('aria-rowcount') ?? 1) - 1;
  /** AG renders on its own schedule; let it. */
  const settle = (ms = 120) => new Promise<void>((resolve) => setTimeout(resolve, ms));
  const detect = async (ms = 120) => {
    fixture.detectChanges();
    await settle(ms);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    await detect(250);
  });

  it('renders AG Grid with the rows, and hands out the real api', () => {
    expect(query('.ag-root-wrapper')).toBeTruthy();
    expect(rowCount()).toBe(3);
    expect(host.api).toBeTruthy();
    expect(host.api!.getDisplayedRowCount()).toBe(3);
  });

  it('speaks the DataTable dialect: caption, toolbar, footer', () => {
    expect(query('.ds-grid__caption-text')!.textContent).toContain('Invoices');
    expect(query('#toolbar-action')).toBeTruthy();
    expect(query('.ds-grid__footer #footer-note')).toBeTruthy();
    expect(query('.ds-grid__viewport')!.getAttribute('aria-label')).toBe('Invoices');
  });

  it('tracks rows by rowKey, the DataTable contract, via AG getRowId', () => {
    expect(host.api!.getRowNode('r2')?.data?.project).toBe('Canvas');
  });

  it('selection flows both ways and stays in RowKey[]', async () => {
    // Outside in: the model lands on the grid's nodes.
    host.selection.set(['r1', 'r3']);
    await detect();

    expect(host.api!.getSelectedRows().map((row) => row.id).sort()).toEqual(['r1', 'r3']);
    expect(query('.ds-grid__selection-count')!.textContent).toContain('2 selected');

    // Inside out: the header master checkbox fills the model.
    const selectAll = query<HTMLInputElement>('.ag-header-select-all input')!;
    selectAll.click();
    await detect();

    expect([...host.selection()].sort()).toEqual(['r1', 'r2', 'r3']);
    expect(query('.ds-grid__selection-count')!.textContent).toContain('3 selected');
  });

  it('quick filter narrows the grid without touching the rows input', async () => {
    host.quickFilter.set('Canvas');
    await detect();

    expect(rowCount()).toBe(1);
    expect(host.rows().length).toBe(3);

    host.quickFilter.set('');
    await detect();
    expect(rowCount()).toBe(3);
  });

  it('clicking a row emits the row, and does not select it', async () => {
    const cell = query<HTMLElement>('.ag-center-cols-container .ag-row .ag-cell')!;
    cell.click();
    await detect();

    expect(host.clicked.length).toBe(1);
    expect(host.selection().length).toBe(0);
  });

  it(`shows Paint's empty state — with its action — instead of AG's overlay`, async () => {
    host.rows.set([]);
    await detect();

    const overlay = query('.ds-grid__overlay')!;
    expect(overlay.querySelector('ds-empty-state')!.textContent).toContain('No rows match');
    expect(overlay.querySelector('#empty-action')).toBeTruthy();
    expect(query('.ag-overlay-no-rows-center')).toBeNull();

    host.rows.set(ROWS);
    await detect();
    expect(query('.ds-grid__overlay')).toBeNull();
  });

  it(`shows Paint's wait while loading, and says so`, async () => {
    host.loading.set(true);
    await detect();

    expect(query('.ds-grid__overlay ds-spinner')).toBeTruthy();
    expect(query('.ds-grid__viewport')!.getAttribute('aria-busy')).toBe('true');

    host.loading.set(false);
    await detect();
    expect(query('.ds-grid__overlay')).toBeNull();
    expect(query('.ds-grid__viewport')!.getAttribute('aria-busy')).toBeNull();
  });

  it('wears Paint: the token bridge resolves to the live theme values', () => {
    const tokens = getComputedStyle(document.documentElement);
    const surface = tokens.getPropertyValue('--ds-color-surface').trim();
    const sunken = tokens.getPropertyValue('--ds-color-surface-sunken').trim();

    // The grid's colours are whatever the --ds-* properties currently hold —
    // var() references resolved at runtime, not colours copied at build time.
    // (The font tokens are injected by provideTheme, which a bare TestBed does
    // not run; the colour tokens come from the stylesheet, so they prove the
    // same mechanism here.)
    expect(rgbOf(getComputedStyle(query('.ag-root-wrapper')!).backgroundColor)).toEqual(
      rgbOf(surface),
    );
    expect(rgbOf(getComputedStyle(query('.ag-header')!).backgroundColor)).toEqual(rgbOf(sunken));
  });

  it('density is one knob: the compact theme takes over the same grid', async () => {
    // The organism's contract is the theme swap: compact re-derives paddings
    // and row heights from a smaller spacing. Karma's harness defeats AG's
    // probe-based pixel measurement (it falls back to its 42px default and
    // warns "initialised before styles have been loaded"), so the pixel
    // consequence — 42px rows becoming 32px — is exercised against the real
    // browser on the docs page. Here we assert the swap itself, both ways.
    expect(getComputedStyle(query('.ag-root-wrapper')!).getPropertyValue('--ag-spacing')).toBe(
      '8px',
    );

    host.density.set('compact');
    await detect(250);

    expect(getComputedStyle(query('.ag-root-wrapper')!).getPropertyValue('--ag-spacing')).toBe(
      '5px',
    );
  });

  it('drops the toolbar when nothing asks for one', async () => {
    @Component({
      standalone: true,
      imports: [DataGridComponent],
      template: `
        <ds-data-grid [columns]="columns" [rows]="rows" height="12rem" label="Quiet grid" />
      `,
    })
    class QuietHost {
      readonly columns: readonly DataGridColumn<Row>[] = [{ field: 'id' }];
      readonly rows = ROWS;
    }

    const quiet = TestBed.createComponent(QuietHost);
    quiet.detectChanges();
    await settle(200);
    quiet.detectChanges();

    expect(quiet.nativeElement.querySelector('.ds-grid__toolbar')).toBeNull();
    expect(
      quiet.nativeElement.querySelector('.ds-grid__viewport').getAttribute('aria-label'),
    ).toBe('Quiet grid');
  });
});

/** Normalises `#fff` / `rgb(…)` to comparable channels via a scratch element. */
function rgbOf(color: string): string {
  const probe = document.createElement('div');
  probe.style.color = color;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved;
}
