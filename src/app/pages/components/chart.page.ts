import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  ChartComponent,
  DS_COMPONENTS,
  DS_PRIMITIVES,
  ThemeService,
  type ChartOptions,
  type ChartSeries,
  type ChartType,
} from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

interface Range {
  readonly id: '6m' | '12m';
  readonly label: string;
}

/**
 * Chart — documentation page, as a metrics dashboard.
 *
 * Every chart here is the same organism with a different `type`, drawing the
 * same kind of data a product would have. No engine is configured in the
 * showcase, so these are all the mock plate — which is the point: the contract,
 * the chrome, the states and the token colours are identical either way.
 */
@Component({
  selector: 'app-chart-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, ChartComponent, DOC_UI],
  templateUrl: './chart.page.html',
  styleUrl: './components-page.scss',
})
export class ChartPage {
  private readonly theme = inject(ThemeService);

  readonly ranges: readonly Range[] = [
    { id: '6m', label: 'Last 6 months' },
    { id: '12m', label: 'Last 12 months' },
  ];
  readonly range = signal<Range['id']>('12m');

  private readonly allMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  private readonly revenuePro = [42, 46, 51, 49, 58, 64, 69, 72, 76, 81, 88, 94];
  private readonly revenueTeam = [18, 21, 23, 28, 31, 33, 36, 41, 44, 46, 52, 57];
  private readonly revenueFree = [9, 9, 11, 10, 12, 13, 12, 14, 15, 16, 16, 18];
  private readonly signups = [320, 298, 410, 455, 512, 498, 560, 612, 648, 701, 744, 812];
  private readonly churn = [2.1, 2.4, 1.9, 2.2, 1.7, 1.5, 1.6, 1.4, 1.3, 1.5, 1.2, 1.1];

  private readonly months = computed(() =>
    this.range() === '6m' ? this.allMonths.slice(6) : this.allMonths,
  );

  private slice<T>(values: readonly T[]): T[] {
    return this.range() === '6m' ? values.slice(6) : [...values];
  }

  readonly categories = computed(() => this.months());

  // —— The ten, each with data that looks like a product's ——

  readonly revenueSeries = computed<readonly ChartSeries[]>(() => [
    { name: 'Pro', data: this.slice(this.revenuePro) },
    { name: 'Team', data: this.slice(this.revenueTeam) },
    { name: 'Free trials', data: this.slice(this.revenueFree) },
  ]);

  readonly signupSeries = computed<readonly ChartSeries[]>(() => [
    { name: 'Signups', data: this.slice(this.signups), tone: 'accent' },
  ]);

  readonly churnSeries = computed<readonly ChartSeries[]>(() => [
    { name: 'Churn', data: this.slice(this.churn), tone: 'danger' },
  ]);

  readonly regionSeries: readonly ChartSeries[] = [
    {
      name: 'Revenue',
      data: [
        { name: 'Europe', y: 412 },
        { name: 'North America', y: 388 },
        { name: 'Asia Pacific', y: 176 },
        { name: 'Latin America', y: 84 },
      ],
    },
  ];

  readonly planSeries: readonly ChartSeries[] = [
    {
      name: 'Accounts',
      data: [
        { name: 'Pro', y: 1840 },
        { name: 'Team', y: 920 },
        { name: 'Enterprise', y: 260 },
        { name: 'Free', y: 3120 },
      ],
    },
  ];

  readonly channelSeries: readonly ChartSeries[] = [
    { name: 'Organic', data: [820, 760, 690, 610, 540] },
    { name: 'Referral', data: [410, 380, 340, 300, 270] },
  ];

  readonly channelCategories = ['Search', 'Docs', 'Social', 'Email', 'Partners'];

  readonly seatsSeries: readonly ChartSeries[] = [
    {
      name: 'Accounts',
      data: [
        { x: 3, y: 120 }, { x: 5, y: 190 }, { x: 8, y: 240 }, { x: 9, y: 210 },
        { x: 12, y: 330 }, { x: 14, y: 410 }, { x: 18, y: 395 }, { x: 22, y: 520 },
        { x: 26, y: 610 }, { x: 31, y: 580 }, { x: 38, y: 720 }, { x: 44, y: 910 },
      ],
      tone: 'info',
    },
  ];

  readonly uptimeSeries: readonly ChartSeries[] = [
    { name: 'Uptime', data: [{ name: 'Uptime', y: 99.82 }], tone: 'success' },
  ];

  readonly revenueOptions: ChartOptions = { unit: 'k', yTitle: 'Revenue (thousands)' };
  readonly signupOptions: ChartOptions = { yTitle: 'Signups' };
  readonly churnOptions: ChartOptions = { unit: '%', decimals: 1, yTitle: 'Monthly churn' };
  readonly regionOptions: ChartOptions = { unit: 'k' };
  readonly planOptions: ChartOptions = { innerSize: 62 };
  readonly channelOptions: ChartOptions = { yTitle: 'Visits' };
  readonly seatsOptions: ChartOptions = { xTitle: 'Seats', yTitle: 'Monthly spend' };
  readonly uptimeOptions: ChartOptions = { min: 99, max: 100, unit: '%', decimals: 2 };

  // —— The type switcher, to prove the ten are one component ——
  readonly switchableTypes: readonly ChartType[] = [
    'line', 'spline', 'area', 'column', 'bar', 'stacked-column', 'scatter',
  ];
  readonly switchType = signal<ChartType>('line');

  // —— Loading and empty, on demand ——
  readonly loading = signal(true);
  readonly emptySeries: readonly ChartSeries[] = [{ name: 'Revenue', data: [] }];

  toggleLoading(): void {
    this.loading.update((value) => !value);
  }

  readonly dark = this.theme.isDark;

  toggleTheme(): void {
    this.theme.setMode(this.dark() ? 'light' : 'dark');
  }

  readonly basicSnippet = `<ds-chart
  type="stacked-column"
  title="Revenue by plan"
  subtitle="Monthly recurring revenue, in thousands"
  [categories]="months()"
  [series]="[
    { name: 'Pro', data: pro },
    { name: 'Team', data: team },
    { name: 'Free trials', data: free },
  ]"
  [options]="{ unit: 'k', yTitle: 'Revenue (thousands)' }"
/>`;

  readonly engineSnippet = `// app.config.ts — the engine is the host's, and so is the licence
import Highcharts from 'highcharts';
import 'highcharts/highcharts-more';  // the gauge lives here
import { provideCharts } from '…/design-system/organisms/chart/highcharts.adapter';

providers: [provideCharts({ highcharts: Highcharts })];

// Without it — in tests, in CI, in this showcase — <ds-chart> draws the mock
// plate: same contract, same chrome, same token colours, no network.`;

  readonly toneSnippet = `<!-- A series names a tone, never a colour -->
<ds-chart type="line" [series]="[{ name: 'Churn', data: churn, tone: 'danger' }]" />`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'type', type: 'ChartType', default: `'line'`, description: 'One of the ten: line, spline, area, column, bar, stacked-column, pie, donut, scatter, gauge.' },
    { name: 'categories', type: 'readonly string[]', default: '[]', description: 'The x axis — or the fallback slice names for the circular types.' },
    { name: 'series', type: 'readonly ChartSeries<T>[]', default: '[]', description: 'Named series of numbers, nulls (gaps) or points. No engine types.' },
    { name: 'options', type: 'ChartOptions', default: '{}', description: 'The shared extras: innerSize, min / max, unit, decimals, axis titles, stackPercent.' },
    { name: 'title / subtitle', type: 'string', default: `''`, description: 'Paint’s own chrome, in Paint’s type — the engine never draws them.' },
    { name: 'ariaLabel', type: 'string', default: `''`, description: 'The chart’s accessible name. Falls back to the title.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Skeleton, and aria-busy. The engine keeps its place underneath.' },
    { name: 'emptyTitle / emptyDescription / emptyIcon', type: 'string', default: '…', description: 'The words for “nothing to draw”. A chart with no data is not an empty axis.' },
    { name: 'legend', type: `'auto' | 'bottom' | 'right' | 'none'`, default: `'auto'`, description: 'One legend decision for the whole system.' },
    { name: 'sharedTooltip', type: 'boolean', default: 'true', description: 'One tooltip per x position. Ignored by the circular types.' },
    { name: 'height', type: 'string', default: `'18rem'`, description: 'The plot’s height, as a CSS length.' },
    { name: 'adapter', type: 'ChartAdapter | null', default: 'null', description: 'An engine for this chart only. Otherwise the configured one, otherwise the mock.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'rendered', type: 'OutputEmitterRef<{ type; engine; series }>', default: '—', description: 'The engine drew, and what drew it.' },
  ];

  readonly seamRows: readonly ApiRow[] = [
    { name: 'provideCharts({ highcharts })', type: 'EnvironmentProviders', default: '—', description: 'Deep import from organisms/chart/highcharts.adapter. The host owns the engine, the licence and the megabyte.' },
    { name: 'highchartsAdapter(ns)', type: 'ChartAdapter', default: '—', description: 'Wraps a Highcharts namespace. Builds options from the resolved Paint spec.' },
    { name: 'highchartsOptions(spec)', type: 'pure function', default: '—', description: 'The mapping itself — directly tested, without an engine.' },
    { name: 'mockChartAdapter()', type: 'ChartAdapter', default: 'fallback', description: 'The token-styled preview plate: real SVG, real colours, a real data table, no network.' },
    { name: 'ChartSpec', type: 'interface', default: '—', description: 'What an adapter receives: the contract with every colour already resolved from the tokens.' },
  ];
}