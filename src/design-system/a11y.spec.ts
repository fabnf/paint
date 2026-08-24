import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DS_COMPONENTS } from './index';
import { DS_PRIMITIVES } from './primitives';
import { ToastService } from './molecules/toast';
import { expectNoAxeViolations } from './testing/axe';
import { By } from '@angular/platform-browser';
import { FileUploaderComponent } from './organisms/file-uploader';
import { DataGridComponent } from './organisms/data-grid';
import { DataGridActionsDirective } from './organisms/data-grid/data-grid-slots';
import type {
  BoardColumn,
  CommandPaletteItem,
  FeedItem,
  MapMarker,
  DataTableColumn,
  FilterState,
  MenuEntry,
  RowKey,
  SelectOption,
  UploadAdapter,
  UploadReport,
} from './index';

/**
 * Automated accessibility checks for every interactive component, in each of the
 * states people actually meet: closed and open, empty and full, idle and busy.
 *
 * These run axe-core against the real rendered DOM. They are a floor, not a
 * ceiling — the keyboard, focus and screen-reader behaviour each component
 * promises is asserted in its own spec.
 */

interface Row extends Record<string, unknown> {
  id: number;
  project: string;
  owner: string;
  amount: number;
}

const ROWS: readonly Row[] = [
  { id: 1, project: 'Mural', owner: 'Ada Lovelace', amount: 4200 },
  { id: 2, project: 'Canvas', owner: 'Grace Hopper', amount: 18400 },
];

const OPTIONS: readonly SelectOption[] = [
  { value: 'ada', label: 'Ada Lovelace', icon: 'user', group: 'Engineering' },
  { value: 'grace', label: 'Grace Hopper', description: 'Admiral', group: 'Engineering' },
  { value: 'vacant', label: 'Unassigned', disabled: true },
];

const ENTRIES: readonly MenuEntry[] = [
  { type: 'header', label: 'Project' },
  { id: 'rename', label: 'Rename', icon: 'edit' },
  { id: 'duplicate', label: 'Duplicate', shortcut: '⌘D', keyShortcuts: 'Meta+D' },
  { type: 'divider' },
  { id: 'delete', label: 'Delete', icon: 'trash', destructive: true },
];

@Component({
  standalone: true,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DataGridComponent, DataGridActionsDirective],
  template: `
    <main>
      <h1>Harness</h1>

      <!-- Buttons, including the states that change their semantics -->
      <ds-flex [gap]="2" [wrap]="'wrap'">
        <ds-button variant="primary">Save changes</ds-button>
        <ds-button variant="accent" iconStart="sparkle">Mix</ds-button>
        <ds-button variant="ghost" iconStart="settings" label="Settings" />
        <ds-button [loading]="true">Saving</ds-button>
        <ds-button [disabled]="true">Unavailable</ds-button>
        <ds-button variant="link" href="https://angular.dev" target="_blank">Angular</ds-button>
      </ds-flex>

      <!-- Display & feedback atoms, in every tone and variant -->
      <ds-flex [gap]="2" [wrap]="'wrap'" align="center">
        @for (tone of tones; track tone) {
          <ds-badge [tone]="tone" variant="soft">{{ tone }}</ds-badge>
          <ds-badge [tone]="tone" variant="solid" icon="check">{{ tone }}</ds-badge>
          <ds-badge [tone]="tone" variant="outline" [dot]="true">{{ tone }}</ds-badge>
        }
        <ds-badge tone="accent" srLabel="12 unread messages">12</ds-badge>
      </ds-flex>

      <ds-flex [gap]="2" [wrap]="'wrap'" align="center">
        <ds-chip>Design system</ds-chip>
        <ds-chip tone="primary" icon="palette" size="md">Brand</ds-chip>
        <ds-chip tone="accent" variant="solid" [removable]="true" removeLabel="Remove Tokens">Tokens</ds-chip>
        <ds-chip [removable]="true" [removeTabbable]="false" removeLabel="Remove Ada">Ada</ds-chip>
        <ds-chip [disabled]="true" [removable]="true" removeLabel="Remove Frozen">Frozen</ds-chip>
      </ds-flex>

      <ds-flex [gap]="3" align="center">
        <ds-avatar name="Ada Lovelace" />
        <ds-avatar name="Grace Hopper" size="lg" status="online" />
        <ds-avatar name="Katherine Johnson" shape="square" size="xs" [decorative]="true" />
        <ds-avatar src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" name="Alan Turing" />
        <ds-avatar icon="palette" />
      </ds-flex>

      <ds-flex [gap]="4" align="center">
        <ds-spinner />
        <ds-spinner size="lg" tone="accent" label="Loading invoices…" />
        <ds-spinner size="xs" [decorative]="true" />
      </ds-flex>

      <ds-progress label="Uploading" [value]="62" [showValue]="true" />
      <ds-progress label="Storage" [value]="18" [max]="20" valueText="18 of 20 GB used" tone="warning" />
      <ds-progress ariaLabel="Syncing" [indeterminate]="true" size="sm" [hideLabel]="true" />

      <ds-skeleton [lines]="3" />
      <ds-skeleton variant="circle" width="2.5rem" animation="wave" />
      <ds-skeleton variant="rect" height="4rem" radius="lg" label="Loading the chart…" />

      <ds-divider />
      <ds-divider label="or" />
      <ds-divider [decorative]="true" variant="dashed" />
      <ds-flex align="center" [gap]="3">
        <ds-text>Draft</ds-text>
        <ds-divider orientation="vertical" [spacing]="0" />
        <ds-text>Edited 2h ago</ds-text>
      </ds-flex>

      <ds-link href="/docs">Read the docs</ds-link>
      <ds-link href="https://angular.dev" target="_blank">Angular</ds-link>
      <ds-link link="/foundations" variant="subtle" iconEnd="arrowRight">Tokens</ds-link>

      <!-- Form-control atoms: labelled, hinted, errored, disabled -->
      <ds-input label="Email" type="email" hint="Work addresses only." [(value)]="email" />
      <ds-input label="Search" type="search" iconStart="search" [clearable]="true" [(value)]="query" />
      <ds-input label="Amount" type="number" prefix="$" [(value)]="amount" />
      <ds-input label="Broken" [error]="'Enter a valid email.'" [required]="true" />
      <ds-input label="Locked" [disabled]="true" value="read only" />
      <ds-textarea label="Notes" hint="Markdown is supported." [maxLength]="280" [showCount]="true" [(value)]="notes" />
      <ds-textarea label="Reason" [error]="'Tell us a little more.'" />
      <ds-checkbox label="Remember me" [(checked)]="remember" />
      <ds-checkbox label="Select all" [indeterminate]="true" hint="Some rows are selected." />
      <ds-checkbox label="Accept" [error]="'You must accept to continue.'" [required]="true" />
      <ds-checkbox label="Unavailable" [disabled]="true" />
      <fieldset>
        <legend>Deploy target</legend>
        <ds-radio name="target" value="staging" label="Staging" [(groupValue)]="target" />
        <ds-radio
          name="target"
          value="prod"
          label="Production"
          hint="Visible to customers immediately."
          [(groupValue)]="target"
        />
        <ds-radio name="target" value="archive" label="Archive" [disabled]="true" [(groupValue)]="target" />
      </fieldset>
      <ds-switch label="Dark mode" [(checked)]="dark" />
      <ds-switch label="Email digests" hint="A summary every Monday." labelPlacement="start" />
      <ds-switch label="Unavailable" [disabled]="true" />

      <!-- Tabs -->
      <ds-tabs label="Harness tabs" [variant]="tabsVariant()">
        <ds-tab label="Overview" icon="home">
          <p>Overview panel</p>
        </ds-tab>
        <ds-tab label="Activity" [badge]="12">
          <p>Activity panel</p>
        </ds-tab>
        <ds-tab label="Archive" [disabled]="true">
          <p>Archive panel</p>
        </ds-tab>
      </ds-tabs>

      <!-- Menu -->
      <ds-menu label="Actions" [entries]="entries" />
      <ds-menu label="Row actions" icon="more" [iconOnly]="true" [caret]="false" [entries]="entries" />

      <!-- Select: single, multiple, searchable, invalid, disabled -->
      <ds-text variant="label" [as]="'label'" [id]="'owner-label'">Owner</ds-text>
      <ds-select [options]="options" [(value)]="owner" labelledBy="owner-label" [clearable]="true" />
      <ds-select
        [options]="options"
        [(value)]="labels"
        [multiple]="true"
        [searchable]="true"
        [clearable]="true"
        label="Labels"
      />
      <ds-select [options]="options" label="Invalid" [invalid]="true" [required]="true" />
      <ds-select [options]="options" label="Disabled" [disabled]="true" />

      <!-- Form molecules: the chrome the atoms no longer each carry -->
      <ds-form-field label="Email" hint="Work addresses only." [required]="true">
        <ds-input type="email" autocomplete="email" />
      </ds-form-field>
      <ds-form-field label="Summary" error="Tell us a little more." [optional]="true">
        <ds-textarea [rows]="2" />
      </ds-form-field>
      <ds-form-field label="Owner" hint="Who signs it off.">
        <ds-select [options]="options" />
      </ds-form-field>
      <ds-form-field label="Colour" hint="Hex values only." [disabled]="true">
        <input dsFieldControl type="text" class="form-control" />
      </ds-form-field>

      <ds-search-field
        label="Search invoices"
        [labelHidden]="true"
        [loading]="searching()"
        [resultCount]="3"
        [landmark]="true"
      />

      <ds-form-field label="Password" hint="At least 12 characters.">
        <ds-password-field purpose="new" [showStrength]="true" value="correct horse battery" />
      </ds-form-field>
      <ds-password-field label="Current password" error="That is not your password." />

      <ds-radio-group
        legend="Deploy target"
        hint="Production is visible to customers immediately."
        error="Pick a target."
        [required]="true"
        [options]="targets"
      />
      <ds-radio-group legend="Size" orientation="horizontal" [options]="sizes" [disabled]="true" />
      <ds-checkbox-group
        legend="Scopes"
        hint="You can change these later."
        [selectAll]="true"
        [options]="scopes"
        [value]="granted"
      />

      <!-- Structure: hierarchy, disclosure, and the way out -->
      <ds-breadcrumb [items]="crumbs" [maxItems]="3" />

      <ds-toolbar ariaLabel="Document actions" [bordered]="true">
        <ds-button variant="ghost" iconStart="edit" label="Rename" />
        <ds-button variant="ghost" iconStart="copy" label="Duplicate" />
        <ds-divider orientation="vertical" [spacing]="0" />
        <ds-menu label="Export" variant="ghost" size="sm" icon="download" [entries]="entries" />
      </ds-toolbar>

      <!-- Light overlays: a description on demand, and an anchored non-modal dialog -->
      <ds-tooltip text="Copy to clipboard">
        <ds-button variant="ghost" iconStart="copy" label="Copy" />
      </ds-tooltip>
      <ds-popover label="Filters" icon="filter" title="Filter invoices" [dismissible]="true">
        <ds-input label="Owner" />
      </ds-popover>

      <!-- Files: a way in, and a row per file in every state -->
      <ds-file-dropzone accept="image/*,.pdf" hint="Images or PDF, up to 10 MB." [maxSize]="10485760" />
      <ds-file-queue-item name="photo.jpg" [size]="18432" />
      <ds-file-queue-item name="slides.pdf" [size]="4400000" status="uploading" [progress]="45" />
      <ds-file-queue-item name="video.mp4" [size]="120000000" status="error" error="File is larger than 10 MB." />
      <ds-file-queue-item name="notes.txt" [size]="900" status="success" />

      <ds-accordion [(expanded)]="openPanels" [multiple]="true" variant="separated" [headingLevel]="2">
        <ds-accordion-item itemId="profile" label="Profile" icon="user" description="Name and avatar">
          <p>Profile panel</p>
        </ds-accordion-item>
        <ds-accordion-item itemId="billing" label="Billing" [badge]="2" badgeLabel="2 issues">
          <p>Billing panel</p>
        </ds-accordion-item>
        <ds-accordion-item itemId="frozen" label="Archived" [disabled]="true">
          <p>Archived panel</p>
        </ds-accordion-item>
      </ds-accordion>

      <ds-accordion-item label="Advanced options" [headingLevel]="2">
        <p>A lone disclosure</p>
      </ds-accordion-item>

      <ds-pagination [(page)]="page" [total]="200" [pageSize]="10" [showSummary]="true" />
      <!-- Two paginations on one page are two landmarks, and two landmarks with
           the same name are indistinguishable. They each get one. -->
      <ds-pagination [page]="3" [pageCount]="12" variant="compact" label="Invoice pages" />

      <ds-empty-state
        icon="search"
        title="No invoices match"
        description="Try another filter."
        [textured]="true"
        [headingLevel]="2"
      >
        <ds-button dsEmptyStateActions variant="secondary" size="sm">Clear filters</ds-button>
      </ds-empty-state>

      @for (tone of tones; track tone) {
        <ds-alert [tone]="tone" [title]="tone + ' alert'" [dismissible]="true">
          A message that belongs in the page.
          <ds-flex dsAlertActions [gap]="2">
            <ds-button size="sm" variant="secondary">Do it</ds-button>
          </ds-flex>
        </ds-alert>
      }
      <ds-alert tone="danger" live="assertive" title="Could not save" variant="outline" />

      <!-- Date entry: a month grid, a typed date, a typed time -->
      <ds-calendar
        today="2026-03-04"
        value="2026-03-12"
        month="2026-03-01"
        min="2026-03-02"
        max="2026-03-27"
        [dateDisabled]="isWeekend"
        [showWeekNumbers]="true"
      />
      <ds-form-field label="Invoice date" hint="Any format: 4/3/26, 2026-03-04…">
        <ds-date-input [ariaControls]="'a11y-calendar'" />
      </ds-form-field>
      <ds-date-input label="Bad date" value="2026-03-04" error="That day is a holiday." />
      <ds-form-field label="Starts at" hint="24-hour, or 9:30 pm.">
        <ds-time-input [step]="15" />
      </ds-form-field>
      <ds-time-input label="Opens" [hour12]="true" value="09:30" min="06:00" max="23:00" />

      <!-- The picker organisms: the date molecules, finally assembled -->
      <ds-form-field label="Due date" hint="Type it, or press ArrowDown.">
        <ds-date-picker today="2026-03-04" value="2026-03-12" min="2026-03-02" />
      </ds-form-field>
      <ds-date-range-picker
        label="Billing period"
        today="2026-03-04"
        start="2026-03-10"
        end="2026-03-14"
        [withTime]="true"
        startTime="09:30"
        endTime="17:00"
      />

      <!-- DataTable: populated, loading and empty -->
      <ds-data-table
        caption="Invoices"
        [columns]="columns"
        [rows]="rows()"
        [rowKey]="rowKey"
        [rowLabel]="rowLabel"
        [selectable]="true"
        [(selection)]="selection"
        [(sort)]="sort"
        [clickable]="true"
        [loading]="loading()"
        [empty]="{ icon: 'search', title: 'No invoices', description: 'Try another filter.' }"
      >
        <ds-flex dsTableActions [gap]="2">
          <ds-menu label="Export" variant="secondary" size="sm" icon="download" [entries]="entries" />
        </ds-flex>
        <ng-template dsCell="owner" [dsCellRows]="rows()" let-row>
          <ds-text variant="bodySm" [as]="'span'">{{ row.owner }}</ds-text>
        </ng-template>
        <ds-button dsTableEmptyAction variant="primary" size="sm" iconStart="plus">New</ds-button>
        <ds-flex dsTableFooter justify="between">
          <ds-text variant="caption">2 of 2</ds-text>
        </ds-flex>
      </ds-data-table>

      <!-- FileUploader: empty at rest; a test drives it into every state -->
      <ds-file-uploader
        [adapter]="manualAdapter"
        accept=".txt,.pdf"
        hint="Text or PDF. This harness has no server."
      />

      <!-- Drawer: the Dialog's machinery, side-anchored -->
      <ds-drawer
        [(open)]="drawerOpen"
        title="INV-204"
        description="Invoice detail"
        icon="file"
      >
        <p>Issued 14 March 2026 by Mural.</p>
        <ds-flex dsDrawerActions [gap]="2" justify="end">
          <ds-button variant="ghost">Close</ds-button>
          <ds-button variant="primary">Mark paid</ds-button>
        </ds-flex>
      </ds-drawer>

      <!-- Board: lanes of cards, one lane honestly empty -->
      <ds-board label="Release board" [columns]="boardColumns" />

      <!-- Feed: a rail of events, read and unread, actor and icon nodes -->
      <ds-feed
        [items]="feedItems"
        label="Project activity"
        now="2026-03-04T12:00:00Z"
        [empty]="{ title: 'All caught up' }"
      />

      <!-- MapViewer: the mock engine (no key in tests), detail card open -->
      <ds-map-viewer
        [markers]="mapMarkers"
        [selected]="'ber'"
        [searchable]="true"
        label="Studios map"
        height="14rem"
      />

      <!-- FilterBar: search, summarising selects, active chips -->
      <ds-filter-bar
        [filters]="filterDefs"
        [(state)]="filterState"
        searchLabel="Search invoices"
        [resultCount]="4"
      />

      <!-- CommandPalette: opened by a test, scanned open -->
      <button type="button" id="palette-opener" (click)="palette.openPalette()">Jump to…</button>
      <ds-command-palette #palette [items]="commands" [hotkey]="false" />

      <!-- DataGrid: AG Grid Community wearing Paint's chrome -->
      <ds-data-grid
        caption="Trades"
        [columns]="gridColumns"
        [rows]="gridRows"
        [selectable]="true"
        height="14rem"
        [empty]="{ icon: 'search', title: 'No trades' }"
      >
        <ds-flex dsGridActions [gap]="2">
          <ds-button variant="ghost" size="sm" iconStart="download" label="Export" />
        </ds-flex>
      </ds-data-grid>

      <!-- Dialog -->
      <ds-dialog
        [(open)]="dialogOpen"
        title="Delete project"
        description="This cannot be undone."
        tone="danger"
        icon="warning"
      >
        <ds-text>Everything in Mural will be removed.</ds-text>
        <ds-flex dsDialogActions [gap]="2" justify="end">
          <ds-button variant="ghost">Cancel</ds-button>
          <ds-button variant="danger" iconStart="trash">Delete</ds-button>
        </ds-flex>
      </ds-dialog>

      <!-- Toast host -->
      <ds-toast-host placement="bottom-end" />
    </main>
  `,
})
class HarnessComponent {
  readonly entries = ENTRIES;
  readonly options = OPTIONS;
  readonly rows = signal<readonly Row[]>(ROWS);
  readonly rowKey = (row: Row): RowKey => row.id;
  readonly rowLabel = (row: Row): string => row.project;
  readonly columns: readonly DataTableColumn<Row>[] = [
    { key: 'project', header: 'Project', sortable: true },
    { key: 'owner', header: 'Owner' },
    {
      key: 'amount',
      header: 'Amount',
      align: 'end',
      numeric: true,
      sortable: true,
      format: (row) => `$${row.amount}`,
    },
    { key: 'actions', header: '', headerLabel: 'Actions', width: '3rem' },
  ];

  owner: string | null = 'ada';
  labels: string[] = ['ada', 'grace'];
  selection: readonly RowKey[] = [1];
  sort: { key: string; direction: 'asc' | 'desc' } | null = { key: 'amount', direction: 'desc' };

  readonly crumbs = [
    { label: 'Home', link: '/', icon: 'home' as const },
    { label: 'Projects', link: '/projects' },
    { label: 'Paint', link: '/projects/paint' },
    { label: 'Design system', link: '/projects/paint/ds' },
    { label: 'Mural' },
  ];

  openPanels: readonly string[] = ['profile'];
  page = 7;

  readonly isWeekend = (iso: string): boolean => {
    const day = new Date(`${iso}T00:00:00Z`).getUTCDay();
    return day === 0 || day === 6;
  };

  readonly targets = [
    { value: 'staging', label: 'Staging' },
    { value: 'prod', label: 'Production', hint: 'Visible to customers immediately.' },
    { value: 'archive', label: 'Archive', disabled: true },
  ];
  readonly sizes = [
    { value: 'sm', label: 'Small' },
    { value: 'md', label: 'Medium' },
  ];
  readonly scopes = [
    { value: 'read', label: 'Read tokens', hint: 'See every token and theme.' },
    { value: 'write', label: 'Write tokens' },
    { value: 'admin', label: 'Manage members', disabled: true },
  ];
  readonly granted = ['read'];
  readonly searching = signal(false);

  email = '';
  query = '';
  amount: string | number | null = null;
  notes = '';
  remember = false;
  dark = false;
  target: string | null = 'staging';

  readonly tones = ['neutral', 'primary', 'accent', 'success', 'warning', 'danger', 'info'] as const;

  readonly tabsVariant = signal<'underline' | 'pills' | 'segmented'>('underline');
  readonly loading = signal(false);
  readonly gridColumns = [
    { field: 'id', headerName: 'Trade' },
    { field: 'instrument', headerName: 'Instrument' },
    { field: 'price', headerName: 'Price', type: 'rightAligned' },
  ];
  readonly gridRows = [
    { id: 'TRD-1', instrument: 'BUND 10Y', price: 98.4 },
    { id: 'TRD-2', instrument: 'EUR/USD', price: 1.08 },
  ];

  readonly dialogOpen = signal(false);
  readonly drawerOpen = signal(false);

  readonly boardColumns: BoardColumn[] = [
    {
      id: 'todo',
      label: 'To do',
      tone: 'neutral',
      cards: [
        { id: 'rail', title: 'Tune the rail', badge: 'Design', badgeTone: 'info', assignee: 'Ada Lovelace', tone: 'info' },
      ],
    },
    { id: 'doing', label: 'In progress', tone: 'primary', cards: [{ id: 'docs', title: 'Write the docs' }] },
    { id: 'done', label: 'Done', tone: 'success', cards: [] },
  ];

  readonly feedItems: FeedItem[] = [
    {
      id: 'comment',
      title: 'Ada commented on Mural',
      description: 'Left a note on the header spacing.',
      timestamp: '2026-03-04T11:30:00Z',
      actor: 'Ada Lovelace',
      unread: true,
    },
    {
      id: 'deploy',
      title: 'Canvas deployed to production',
      timestamp: '2026-03-04T09:00:00Z',
      icon: 'zap',
      tone: 'success',
    },
  ];

  readonly mapMarkers: MapMarker[] = [
    { id: 'ber', position: { lat: 52.52, lng: 13.4 }, label: 'Berlin studio', description: 'Mitte', icon: 'palette' },
    { id: 'lis', position: { lat: 38.72, lng: -9.14 }, label: 'Lisbon studio', tone: 'accent' },
  ];

  readonly filterDefs = [
    {
      id: 'status',
      label: 'Status',
      options: [
        { value: 'paid', label: 'Paid' },
        { value: 'sent', label: 'Sent' },
      ],
    },
  ];
  readonly filterState = signal<FilterState>({ search: '', values: { status: ['paid'] } });

  readonly commands: CommandPaletteItem[] = [
    { id: 'new', label: 'New invoice', icon: 'plus', group: 'Actions', run: () => undefined },
    { id: 'export', label: 'Export ledger', group: 'Actions', shortcut: '⌘E', run: () => undefined },
    { id: 'settings', label: 'Go to settings', group: 'Navigate', link: '/settings' },
  ];

  /** A transport the tests drive by hand. */
  readonly uploadReports = new Map<string, UploadReport>();
  readonly manualAdapter: UploadAdapter = {
    upload: (file, report) => {
      this.uploadReports.set(file.name, report);
      return { cancel: () => undefined };
    },
  };
}

describe('accessibility (axe-core)', () => {
  /*
   * Axe over a page this size is honest work: every organism, every state.
   * Jasmine's 5s default is tuned for unit assertions, not full-tree scans on
   * a loaded CI box — give the suite room, and give it back afterwards.
   */
  let defaultTimeout: number;
  beforeAll(() => {
    defaultTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
  });
  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = defaultTimeout;
  });

  let fixture: ComponentFixture<HarnessComponent>;
  let host: HarnessComponent;

  const settle = (ms = 20) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  /**
   * Long enough for the entry animations to finish.
   *
   * Scanning mid-fade measures a half-transparent element, and axe would report
   * a contrast failure that no user ever sees.
   */
  const settleAnimations = () => settle(320);

  /**
   * The harness's axe target. AG Grid's internals are excluded — not because
   * they get a pass, but because Karma's harness defeats AG's style
   * measurement ("initialised before styles have been loaded") and it renders
   * a degenerate grid that axe rightly flags. The real DOM is scanned in the
   * browser, where it reports zero violations; Paint's own grid chrome
   * (toolbar, overlays, footer) stays in scope here.
   */
  const scan = (root: Element | null = fixture.nativeElement) =>
    expectNoAxeViolations({ include: [root as Element], exclude: ['.ag-root-wrapper'] });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HarnessComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HarnessComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await settle();
  });

  afterEach(() => {
    host.dialogOpen.set(false);
    fixture.detectChanges();
  });

  it('has no violations at rest', async () => {
    await scan();
  });

  it('has no violations across the structure molecules', async () => {
    // A toolbar with one tab stop, an accordion of real headings, a collapsed
    // breadcrumb, a pagination with a gap, and an alert in every tone.
    expect(fixture.nativeElement.querySelector('[role="toolbar"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('h2.ds-accordion__heading').length).toBe(4);
    expect(fixture.nativeElement.querySelector('.ds-breadcrumb__expand')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('ds-alert').length).toBe(8);

    await scan(fixture.nativeElement.querySelector('main'));
  });

  it('has no violations with an expanded accordion panel', async () => {
    const trigger = fixture.nativeElement.querySelectorAll('.ds-accordion__trigger')[1] as HTMLElement;
    trigger.click();
    fixture.detectChanges();
    await settle();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    await scan(fixture.nativeElement.querySelector('main'));
  });

  it('has no violations across the date-entry molecules', async () => {
    const grid = fixture.nativeElement.querySelector('[role="grid"]');
    expect(grid).toBeTruthy();
    expect(grid.querySelectorAll('[role="gridcell"]').length).toBe(42);
    expect(fixture.nativeElement.querySelector('[aria-haspopup="dialog"]')).toBeTruthy();

    await scan(fixture.nativeElement.querySelector('main'));
  });

  it('has no violations across the form molecules', async () => {
    // A field that labels a Select's button, a field that labels a native input,
    // a password toggle, a search landmark, and two groups in a fieldset.
    expect(fixture.nativeElement.querySelectorAll('ds-form-field').length).toBe(8);
    expect(fixture.nativeElement.querySelectorAll('fieldset legend').length).toBe(4);

    await scan(fixture.nativeElement.querySelector('main'));
  });

  it('has no violations with a search in flight', async () => {
    host.searching.set(true);
    fixture.detectChanges();
    await settle();

    await scan(fixture.nativeElement.querySelector('main'));
    host.searching.set(false);
  });

  it('has no violations with a revealed password', async () => {
    const toggle = fixture.nativeElement.querySelector(
      '.ds-password__toggle button',
    ) as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    await settle();

    expect(fixture.nativeElement.querySelector('.ds-password__toggle button').getAttribute('aria-pressed')).toBe('true');
    await scan(fixture.nativeElement.querySelector('main'));
    toggle.click();
    fixture.detectChanges();
  });

  it('has no violations across the display & feedback atoms, in every tone', async () => {
    // Solid badges on every tone, a named progress bar, a silent skeleton, a
    // separator with a word in it, and a link that opens a new tab.
    expect(fixture.nativeElement.querySelectorAll('ds-badge').length).toBe(23);
    expect(fixture.nativeElement.querySelector('[role="progressbar"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[role="separator"]')).toBeTruthy();

    await scan(fixture.nativeElement.querySelector('main'));
  });

  it('has no violations across the form-control atoms, in every state', async () => {
    // Labelled, described, invalid, indeterminate, disabled and grouped — the
    // states where a control usually loses its name or its semantics.
    // Five standalone inputs, plus the eleven the form, date, picker, filter
    // and map molecules and organisms wrap.
    expect(fixture.nativeElement.querySelectorAll('ds-input').length).toBe(16);
    expect(fixture.nativeElement.querySelector('fieldset legend')).toBeTruthy();

    await scan(fixture.nativeElement.querySelector('main'));
  });

  it('has no violations across the overlay and file molecules, at rest', async () => {
    // A bubble that is in the DOM even while hidden, a real file input under
    // the dropzone, and a queue row in each of its four states.
    expect(fixture.nativeElement.querySelector('[role="tooltip"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.ds-dropzone__input[type="file"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('ds-file-queue-item').length).toBe(4);

    await scan(fixture.nativeElement.querySelector('main'));
  });

  it('has no violations with the tooltip showing', async () => {
    const trigger = fixture.nativeElement.querySelector('ds-tooltip button') as HTMLElement;
    trigger.focus();
    trigger.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    fixture.detectChanges();
    await settleAnimations();

    expect(
      fixture.nativeElement.querySelector('.ds-tooltip__bubble--open'),
    ).toBeTruthy();
    expect(trigger.getAttribute('aria-describedby')).toBe(
      fixture.nativeElement.querySelector('[role="tooltip"]').id,
    );
    await scan(fixture.nativeElement.querySelector('main'));
  });

  it('has no violations with an open popover', async () => {
    (fixture.nativeElement.querySelector('ds-popover ds-button button') as HTMLElement).click();
    fixture.detectChanges();
    await settleAnimations();

    const panel = fixture.nativeElement.querySelector('.ds-popover__panel') as HTMLElement;
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.getAttribute('aria-modal')).toBeNull();
    await scan(fixture.nativeElement.querySelector('main'));
  });

  it('has no violations with the date picker open', async () => {
    (
      fixture.nativeElement.querySelector(
        'ds-date-picker .ds-date-input__trigger button',
      ) as HTMLElement
    ).click();
    fixture.detectChanges();
    await settleAnimations();

    const panel = fixture.nativeElement.querySelector('.ds-date-picker__panel') as HTMLElement;
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.querySelector('[role="grid"]')).toBeTruthy();
    await scan(fixture.nativeElement.querySelector('main'));

    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
  });

  it('has no violations with the range picker open, mid-selection', async () => {
    (
      fixture.nativeElement.querySelector('ds-date-range-picker ds-button button') as HTMLElement
    ).click();
    fixture.detectChanges();
    await settleAnimations();

    const panel = fixture.nativeElement.querySelector('.ds-range__panel') as HTMLElement;
    expect(panel.querySelectorAll('[role="grid"]').length).toBe(2);

    // One end down: the band is painted and narrated while axe looks. The day
    // buttons cross-fade their fill, so wait out the transition too.
    (panel.querySelector('[data-date="2026-03-20"]') as HTMLElement).click();
    fixture.detectChanges();
    await settleAnimations();

    await scan(fixture.nativeElement.querySelector('main'));

    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
  });

  it('has no violations with an open menu', async () => {
    (fixture.nativeElement.querySelector('ds-menu ds-button button') as HTMLElement).click();
    fixture.detectChanges();
    await settleAnimations();

    expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeTruthy();
    await scan();
  });

  it('has no violations with an open single select', async () => {
    (fixture.nativeElement.querySelectorAll('.ds-select__trigger')[0] as HTMLElement).click();
    fixture.detectChanges();
    await settleAnimations();

    expect(fixture.nativeElement.querySelector('[role="listbox"]')).toBeTruthy();
    await scan();
  });

  it('has no violations with an open multiple + searchable select', async () => {
    (fixture.nativeElement.querySelectorAll('.ds-select__trigger')[1] as HTMLElement).click();
    fixture.detectChanges();
    await settleAnimations();

    expect(fixture.nativeElement.querySelector('.ds-select__search-input')).toBeTruthy();
    await scan();
  });

  it('has no violations with an open dialog', async () => {
    host.dialogOpen.set(true);
    fixture.detectChanges();
    await settleAnimations();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();
    await scan();
  });

  it('has no violations with a board card grabbed mid-journey', async () => {
    const card = fixture.nativeElement.querySelector('[data-card-id="rail"]') as HTMLElement;
    expect(card.getAttribute('role')).toBe('button');
    expect(card.getAttribute('aria-describedby')).toBeTruthy();

    card.focus();
    card.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(card.getAttribute('aria-pressed')).toBe('true');

    await expectNoAxeViolations(fixture.nativeElement.querySelector('main'));

    card.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
  });

  it('has no violations across the feed, unread dot and all', async () => {
    const feed = fixture.nativeElement.querySelector('ds-feed') as HTMLElement;
    expect(feed.querySelectorAll('.ds-feed__entry').length).toBe(2);
    expect(feed.querySelector('.ds-feed__unread')).toBeTruthy();
    expect(feed.querySelector('time')!.textContent!.trim()).toBe('30m ago');

    await scan(fixture.nativeElement.querySelector('main'));
  });

  it(`has no violations with the map's pins and an open detail card`, async () => {
    await settle(); // the mock engine mounts in a promise
    fixture.detectChanges(); // …and the pins land in an effect

    const map = fixture.nativeElement.querySelector('ds-map-viewer') as HTMLElement;
    expect(map.querySelector('.ds-map-mock__watermark')).toBeTruthy();
    expect(map.querySelectorAll('.ds-map-mock__pin').length).toBe(2);
    // A Paint card, not an InfoWindow:
    expect(map.querySelector('.ds-map__detail')!.textContent).toContain('Berlin studio');
    expect(map.querySelector('.gm-style-iw')).toBeNull();

    await scan(fixture.nativeElement.querySelector('main'));
  });

  it('has no violations with the filter bar carrying an active chip', async () => {
    const bar = fixture.nativeElement.querySelector('ds-filter-bar') as HTMLElement;
    expect(bar.querySelector('.ds-filter-bar__chips ds-chip')).toBeTruthy();
    expect(bar.querySelector('ds-select .ds-select__single-label')!.textContent).toContain(
      'Status · 1',
    );

    await scan(fixture.nativeElement.querySelector('main'));
  });

  it('has no violations with the command palette open over the page', async () => {
    (fixture.nativeElement.querySelector('#palette-opener') as HTMLElement).click();
    fixture.detectChanges();
    await settleAnimations();

    const palette = fixture.nativeElement.querySelector('.ds-palette') as HTMLElement;
    expect(palette.getAttribute('aria-modal')).toBe('true');
    expect(document.activeElement).toBe(palette.querySelector('.ds-palette__input'));

    await scan(fixture.nativeElement);

    palette
      .querySelector('.ds-palette__panel')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
  });

  it('has no violations with an open drawer', async () => {
    host.drawerOpen.set(true);
    fixture.detectChanges();
    await settleAnimations();

    const panel = fixture.nativeElement.querySelector('.ds-drawer__panel') as HTMLElement;
    expect(panel.getAttribute('aria-modal')).toBe('true');
    await scan();

    host.drawerOpen.set(false);
    fixture.detectChanges();
  });

  it('has no violations with the uploader in every state at once', async () => {
    const uploader: FileUploaderComponent = fixture.debugElement.query(
      By.directive(FileUploaderComponent),
    ).componentInstance;

    uploader.addFiles([
      new File([new Uint8Array(900)], 'notes.txt', { type: 'text/plain' }),
      new File([new Uint8Array(4096)], 'report.pdf', { type: 'application/pdf' }),
      new File([new Uint8Array(2048)], 'draft.txt', { type: 'text/plain' }),
    ]);
    fixture.detectChanges();

    // One at 45%, one failed, one done: progress bar, alert row and summary
    // all on screen while axe looks.
    host.uploadReports.get('notes.txt')!.progress(45);
    host.uploadReports.get('report.pdf')!.fail('The server refused the file.');
    host.uploadReports.get('draft.txt')!.done();
    fixture.detectChanges();
    await settleAnimations();

    expect(fixture.nativeElement.querySelector('.ds-uploader__summary')!.textContent).toContain(
      'failed',
    );
    await scan(fixture.nativeElement.querySelector('main'));
  });

  it('has no violations with toasts on screen', async () => {
    const toasts = TestBed.inject(ToastService);
    toasts.success('Project saved', { description: 'Mural is up to date.', duration: 0 });
    toasts.danger('Upload failed', {
      duration: 0,
      action: { label: 'Retry', run: () => undefined },
    });
    fixture.detectChanges();
    await settle();

    await settleAnimations();

    expect(fixture.nativeElement.querySelectorAll('ds-toast').length).toBe(2);
    await scan();
    toasts.clear();
  });

  it('has no violations while the table is loading', async () => {
    host.loading.set(true);
    fixture.detectChanges();
    await settle();

    await scan();
  });

  it('has no violations when the table is empty', async () => {
    host.rows.set([]);
    fixture.detectChanges();
    await settle();

    expect(fixture.nativeElement.querySelector('.ds-table__empty')).toBeTruthy();
    await scan();
  });

  for (const variant of ['underline', 'pills', 'segmented'] as const) {
    it(`has no violations with ${variant} tabs`, async () => {
      host.tabsVariant.set(variant);
      fixture.detectChanges();
      await settle();

      await scan();
    });
  }
});
