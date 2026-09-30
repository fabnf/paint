import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ThemeService, provideTheme } from '../../theme';
import { ChartComponent } from './chart.component';
import { DS_CHART_ENGINE } from './chart.engine-token';
import { mockChartAdapter } from './mock-chart.adapter';
import { highchartsOptions, type HighchartsLike } from './highcharts.adapter';
import {
  CHART_TYPES,
  hasChartData,
  isCircular,
  type ChartAdapter,
  type ChartHandle,
  type ChartOptions,
  type ChartSeries,
  type ChartSpec,
  type ChartType,
} from './chart.types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const TWO_SERIES: readonly ChartSeries[] = [
  { name: 'Pro', data: [12, 18, 22, 26, 24, 31] },
  { name: 'Team', data: [4, 9, 14, 12, 18, 21] },
];

/** A spy engine: the same seam a host's Highcharts uses, with a notebook. */
function recordingAdapter(): ChartAdapter & { specs: ChartSpec[]; destroys: number } {
  const specs: ChartSpec[] = [];
  const adapter = {
    kind: 'recording',
    specs,
    destroys: 0,
    create(host: HTMLElement, spec: ChartSpec): ChartHandle {
      specs.push(spec);
      host.dataset['engine'] = 'recording';
      return {
        update: (next) => specs.push(next),
        destroy: () => {
          adapter.destroys += 1;
        },
      };
    },
  };
  return adapter;
}

@Component({
  standalone: true,
  imports: [ChartComponent],
  template: `
    <ds-chart
      [type]="type()"
      [categories]="categories()"
      [series]="series()"
      [options]="options()"
      [title]="title()"
      [subtitle]="subtitle()"
      [ariaLabel]="ariaLabel()"
      [loading]="loading()"
      [legend]="legend()"
      [adapter]="adapter()"
      [emptyTitle]="emptyTitle()"
      (rendered)="renders.push($event)"
    />
  `,
})
class HostComponent {
  readonly type = signal<ChartType>('line');
  readonly categories = signal<readonly string[]>(MONTHS);
  readonly series = signal<readonly ChartSeries[]>(TWO_SERIES);
  readonly options = signal<ChartOptions>({});
  readonly title = signal('Revenue by plan');
  readonly subtitle = signal('Last six months');
  readonly ariaLabel = signal('');
  readonly loading = signal(false);
  readonly legend = signal<'auto' | 'bottom' | 'right' | 'none'>('auto');
  readonly adapter = signal<ChartAdapter | null>(null);
  readonly emptyTitle = signal('No data yet');
  renders: { type: ChartType; engine: string; series: number }[] = [];
}

describe('chart contracts', () => {
  it('knows when there is nothing to draw', () => {
    expect(hasChartData(TWO_SERIES)).toBeTrue();
    expect(hasChartData([])).toBeFalse();
    expect(hasChartData([{ name: 'Pro', data: [] }])).toBeFalse();
    // All gaps is not data: an axis of nulls is an empty state.
    expect(hasChartData([{ name: 'Pro', data: [null, null] }])).toBeFalse();
    expect(hasChartData([{ name: 'Pro', data: [{ y: null }] }])).toBeFalse();
    expect(hasChartData([{ name: 'Pro', data: [{ y: 0 }] }])).toBeTrue();
  });

  it('knows which types have no axes', () => {
    const circular: ChartType[] = ['pie', 'donut', 'gauge'];
    const axed: ChartType[] = ['line', 'column', 'bar', 'scatter', 'spline', 'area', 'stacked-column'];
    expect(circular.every((type) => isCircular(type))).toBeTrue();
    expect(axed.some((type) => isCircular(type))).toBeFalse();
  });

  it('ships ten types', () => {
    expect(CHART_TYPES.length).toBe(10);
  });
});

describe('ChartComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);
  const queryAll = (selector: string): Element[] =>
    Array.from(fixture.nativeElement.querySelectorAll(selector));
  const plate = () => query<HTMLElement>('[data-chart-mock]');
  const canvas = () => query<HTMLElement>('.ds-chart__canvas')!;
  const chart = () =>
    fixture.debugElement.query((node) => node.name === 'ds-chart').componentInstance as ChartComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideTheme({ defaultMode: 'light', storageKey: false })],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('draws with the mock engine when no engine is configured', () => {
    expect(chart().engineKind).toBe('mock');
    expect(plate()).toBeTruthy();
    expect(plate()!.dataset['chartType']).toBe('line');
    expect(plate()!.dataset['seriesCount']).toBe('2');
    expect(query('.ds-chart-mock__watermark')!.textContent).toContain('Preview chart');
  });

  it('renders Paint’s own title and subtitle, and names the chart', () => {
    expect(query('.ds-chart__title')!.textContent).toContain('Revenue by plan');
    expect(query('.ds-chart__subtitle')!.textContent).toContain('Last six months');
    expect(canvas().getAttribute('role')).toBe('img');
    expect(canvas().getAttribute('aria-label')).toBe('Revenue by plan');
    expect(canvas().getAttribute('aria-describedby')).toBe(query('.ds-chart__subtitle')!.id);

    host.ariaLabel.set('Monthly revenue by plan, in thousands');
    fixture.detectChanges();
    expect(canvas().getAttribute('aria-label')).toBe('Monthly revenue by plan, in thousands');
  });

  it('writes the data as a table, which is the part a screen reader can read', () => {
    const table = query<HTMLTableElement>('[data-chart-mock] table')!;
    expect(table.querySelector('caption')!.textContent).toContain('Revenue by plan');
    // The corner cell names the rows: an empty table header helps nobody.
    expect(Array.from(table.querySelectorAll('thead th')).map((cell) => cell.textContent)).toEqual([
      'Category',
      'Pro',
      'Team',
    ]);
    expect(table.querySelector('tbody th')!.getAttribute('scope')).toBe('row');
    expect(table.querySelectorAll('tbody tr').length).toBe(6);
    expect(table.querySelector('tbody tr th')!.textContent).toBe('Jan');
  });

  it('colours every series from the tokens, never from a palette', () => {
    const colours = queryAll('.ds-chart-mock__series').map((node) =>
      (node as HTMLElement).dataset['color'],
    );
    expect(colours.length).toBe(2);
    expect(colours[0]).not.toBe(colours[1]);
    // The live value of --ds-color-primary, whatever the theme made it.
    const primary = getComputedStyle(fixture.nativeElement.querySelector('ds-chart'))
      .getPropertyValue('--ds-color-primary')
      .trim();
    expect(colours[0]).toBe(primary);
  });

  it('honours a series’ tone, and a single toned point', () => {
    host.series.set([
      { name: 'Failures', data: [3, 5], tone: 'danger' },
      { name: 'Retries', data: [{ y: 9 }, { y: 2, tone: 'warning' }], tone: 'info' },
    ]);
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('ds-chart');
    const styles = getComputedStyle(root);
    const series = queryAll('.ds-chart-mock__series') as HTMLElement[];
    expect(series[0].dataset['color']).toBe(styles.getPropertyValue('--ds-color-danger').trim());
    expect(series[1].dataset['color']).toBe(styles.getPropertyValue('--ds-color-info').trim());

    const toned = series[1].querySelectorAll('[data-point]')[1] as HTMLElement;
    expect(toned.getAttribute('fill')).toBe(styles.getPropertyValue('--ds-color-warning').trim());
  });

  it('re-draws when the theme changes, so the colours come from the new one', () => {
    const adapter = recordingAdapter();
    host.adapter.set(adapter);
    fixture.detectChanges();
    const drawsBefore = adapter.specs.length;
    expect(adapter.specs[0].theme.text).toBeTruthy();

    // The same service every other component re-paints from.
    TestBed.inject(ThemeService).setMode('dark');
    fixture.detectChanges();

    expect(adapter.specs.length).toBeGreaterThan(drawsBefore);
    TestBed.inject(ThemeService).setMode('light');
  });

  it('shows a skeleton and says it is busy while loading', () => {
    host.loading.set(true);
    fixture.detectChanges();

    expect(query('ds-skeleton')).toBeTruthy();
    expect(query('.ds-chart__frame')!.getAttribute('aria-busy')).toBe('true');
    expect(query('.ds-chart__frame')!.dataset['state']).toBe('loading');
    expect(canvas().classList).toContain('ds-chart__canvas--hidden');
    expect(canvas().getAttribute('role')).toBeNull();
  });

  it('shows an empty state — with the host’s words — when there is nothing to draw', () => {
    host.series.set([{ name: 'Pro', data: [null, null] }]);
    host.emptyTitle.set('No revenue in this range');
    fixture.detectChanges();

    expect(query('ds-empty-state')).toBeTruthy();
    expect(query('.ds-empty-state__title')!.textContent).toContain('No revenue in this range');
    expect(query('.ds-chart__frame')!.dataset['state']).toBe('empty');
    expect(canvas().classList).toContain('ds-chart__canvas--hidden');
  });

  it('keeps the engine alive across loads rather than rebuilding it', () => {
    const adapter = recordingAdapter();
    host.adapter.set(adapter);
    fixture.detectChanges();
    expect(adapter.specs.length).toBe(1);

    host.series.set([{ name: 'Pro', data: [1, 2, 3] }]);
    fixture.detectChanges();
    expect(adapter.specs.length).toBe(2);
    expect(adapter.specs[1].series.length).toBe(1);
    expect(adapter.destroys).toBe(0);
  });

  it('reports what it drew', () => {
    expect(host.renders.at(-1)).toEqual({ type: 'line', engine: 'mock', series: 2 });
    host.type.set('area');
    fixture.detectChanges();
    expect(host.renders.at(-1)!.type).toBe('area');
  });

  it('takes a legend placement, and can have none', () => {
    expect(query('.ds-chart-mock__legend')!.hidden).toBeFalse();
    expect(queryAll('[data-legend]').map((node) => node.getAttribute('data-legend'))).toEqual([
      'Pro',
      'Team',
    ]);

    host.legend.set('right');
    fixture.detectChanges();
    expect(query('.ds-chart-mock__legend')!.classList).toContain('ds-chart-mock__legend--right');

    host.legend.set('none');
    fixture.detectChanges();
    expect(query('.ds-chart-mock__legend')!.hidden).toBeTrue();
  });

  it('lets a host supply its own engine through the seam', () => {
    const adapter = recordingAdapter();
    host.adapter.set(adapter);
    fixture.detectChanges();

    expect(chart().engineKind).toBe('recording');
    expect(canvas().dataset['engine']).toBe('recording');
    expect(adapter.specs[0].series.map((series) => series.name)).toEqual(['Pro', 'Team']);
    expect(adapter.specs[0].categories).toEqual(MONTHS);
  });

  describe('the ten types', () => {
    /** Data that makes each type mean something, as a product's would. */
    const dataFor = (type: ChartType): readonly ChartSeries[] => {
      switch (type) {
        case 'pie':
        case 'donut':
          return [{ name: 'Plan', data: [{ name: 'Pro', y: 48 }, { name: 'Team', y: 32 }, { name: 'Free', y: 20 }] }];
        case 'gauge':
          return [{ name: 'Uptime', data: [{ name: 'Uptime', y: 99.2 }] }];
        case 'scatter':
          return [{ name: 'Accounts', data: [{ x: 1, y: 12 }, { x: 4, y: 22 }, { x: 9, y: 31 }] }];
        default:
          return TWO_SERIES;
      }
    };

    const optionsFor = (type: ChartType): ChartOptions => {
      if (type === 'donut') return { innerSize: 55 };
      if (type === 'gauge') return { min: 90, max: 100, unit: '%', decimals: 1 };
      return { unit: 'k' };
    };

    for (const type of CHART_TYPES) {
      it(`draws a ${type}`, () => {
        const adapter = recordingAdapter();
        host.adapter.set(adapter);
        host.type.set(type);
        host.series.set(dataFor(type));
        host.options.set(optionsFor(type));
        fixture.detectChanges();

        const spec = adapter.specs.at(-1)!;
        expect(spec.type).toBe(type);
        expect(spec.series.length).toBeGreaterThan(0);
        expect(spec.series[0].points.length).toBeGreaterThan(0);
        expect(spec.series[0].color).toBeTruthy();
        expect(host.renders.at(-1)!.type).toBe(type);

        // And the engineless plate really draws that type's shape.
        host.adapter.set(null);
        chart().destroy();
        fixture.detectChanges();
        expect(plate()!.dataset['chartType']).toBe(type);
        expect(queryAll('[data-point]').length).toBeGreaterThan(0);
      });
    }

    it('names a pie’s slices and gives each its own colour', () => {
      host.type.set('pie');
      host.series.set(dataFor('pie'));
      fixture.detectChanges();

      const slices = queryAll('.ds-chart-mock__slice') as HTMLElement[];
      expect(slices.map((slice) => slice.dataset['point'])).toEqual(['Pro', 'Team', 'Free']);
      expect(new Set(slices.map((slice) => slice.getAttribute('fill'))).size).toBe(3);
      // The legend names slices, not the one series.
      expect(queryAll('[data-legend]').map((node) => node.getAttribute('data-legend'))).toEqual([
        'Pro',
        'Team',
        'Free',
      ]);
    });

    it('cuts a donut’s hole from the shared options', () => {
      host.type.set('donut');
      host.series.set(dataFor('donut'));
      host.options.set({ innerSize: 55 });
      fixture.detectChanges();

      expect(queryAll('.ds-chart-mock__slice').length).toBe(3);
      // An arc with a hole is a closed ring: two arc commands, not one wedge.
      expect(queryAll('.ds-chart-mock__slice')[0].getAttribute('d')).toContain('A');
      expect(chart().spec().options.innerSize).toBe(55);
    });

    it('scales a gauge between the min and max it was given', () => {
      host.type.set('gauge');
      host.series.set(dataFor('gauge'));
      host.options.set({ min: 90, max: 100, unit: '%', decimals: 1 });
      fixture.detectChanges();

      expect(query('.ds-chart-mock__gauge-track')).toBeTruthy();
      const value = query<HTMLElement>('.ds-chart-mock__gauge-value')!;
      expect(value.dataset['value']).toBe('99.2');
      expect(query('.ds-chart-mock__gauge-label')!.textContent).toBe('99.2%');
    });

    it('stacks a stacked column, and does not stack a column', () => {
      host.type.set('stacked-column');
      fixture.detectChanges();
      const stacked = (queryAll('.ds-chart-mock__bar') as HTMLElement[]).map((bar) =>
        Number(bar.getAttribute('x')),
      );
      // Stacked: two series share one x per category.
      expect(new Set(stacked).size).toBe(6);

      host.type.set('column');
      fixture.detectChanges();
      const grouped = (queryAll('.ds-chart-mock__bar') as HTMLElement[]).map((bar) =>
        Number(bar.getAttribute('x')),
      );
      expect(new Set(grouped).size).toBe(12);
    });

    it('draws gaps as gaps, not as zeroes', () => {
      host.type.set('line');
      host.series.set([{ name: 'Pro', data: [12, null, 22] }]);
      fixture.detectChanges();
      expect(queryAll('[data-point]').length).toBe(2);
    });
  });

  it('throws the engine away when it is destroyed', () => {
    const adapter = recordingAdapter();
    host.adapter.set(adapter);
    fixture.detectChanges();
    fixture.destroy();
    expect(adapter.destroys).toBe(1);
  });
});

describe('ChartComponent with a configured engine', () => {
  /** A fake Highcharts namespace: the host's engine, without the engine. */
  function fakeHighcharts() {
    const builds: Record<string, unknown>[] = [];
    const updates: Record<string, unknown>[] = [];
    const namespace: HighchartsLike = {
      chart(_host, options) {
        builds.push(options);
        return {
          update: (next) => updates.push(next),
          reflow: () => undefined,
          destroy: () => undefined,
        };
      },
    };
    return { namespace, builds, updates };
  }

  @Component({
    standalone: true,
    imports: [ChartComponent],
    template: `<ds-chart type="column" title="Revenue" [categories]="months" [series]="series" />`,
  })
  class EngineHost {
    readonly months = MONTHS;
    readonly series = TWO_SERIES;
  }

  it('uses the engine the host provided, through the token', async () => {
    const { namespace, builds } = fakeHighcharts();
    const { highchartsAdapter } = await import('./highcharts.adapter');

    await TestBed.configureTestingModule({
      imports: [EngineHost],
      providers: [
        provideTheme({ defaultMode: 'light', storageKey: false }),
        { provide: DS_CHART_ENGINE, useValue: highchartsAdapter(namespace) },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(EngineHost);
    fixture.detectChanges();

    const chart = fixture.debugElement.query((node) => node.name === 'ds-chart')
      .componentInstance as ChartComponent;
    expect(chart.engineKind).toBe('highcharts');
    expect(builds.length).toBe(1);
    expect((builds[0]['chart'] as { type: string }).type).toBe('column');
  });
});

describe('highchartsOptions', () => {
  const spec = (over: Partial<ChartSpec> = {}): ChartSpec => ({
    type: 'line',
    categories: MONTHS,
    series: [
      {
        id: 'pro',
        name: 'Pro',
        color: '#6a1bf5',
        points: MONTHS.map((name, x) => ({ name, x, y: x * 2 })),
      },
    ],
    options: {},
    title: 'Revenue',
    subtitle: 'Six months',
    legend: 'auto',
    sharedTooltip: true,
    ariaLabel: 'Revenue',
    theme: {
      text: '#141221',
      muted: '#5b5375',
      grid: '#e0dcea',
      surface: '#ffffff',
      font: 'DM Sans',
    },
    ...over,
  });

  it('never lets the engine draw Paint’s chrome, or pick Paint’s colours', () => {
    const options = highchartsOptions(spec());
    expect((options['title'] as { text?: string }).text).toBeUndefined();
    expect((options['subtitle'] as { text?: string }).text).toBeUndefined();
    expect((options['credits'] as { enabled: boolean }).enabled).toBeFalse();
    expect(options['colors']).toEqual(['#6a1bf5']);
    expect((options['chart'] as { style: { fontFamily: string } }).style.fontFamily).toBe('DM Sans');
  });

  it('maps every Paint type onto an engine type', () => {
    const types = CHART_TYPES.map((type) => {
      const options = highchartsOptions(spec({ type }));
      return (options['chart'] as { type: string }).type;
    });
    expect(types).toEqual([
      'line',
      'spline',
      'area',
      'column',
      'bar',
      'column',
      'pie',
      'pie',
      'scatter',
      'solidgauge',
    ]);
  });

  it('turns the shared extras into the engine’s settings', () => {
    const stacked = highchartsOptions(spec({ type: 'stacked-column' }));
    expect(
      ((stacked['plotOptions'] as Record<string, { stacking?: string }>)['series']).stacking,
    ).toBe('normal');

    const percent = highchartsOptions(
      spec({ type: 'stacked-column', options: { stackPercent: true } }),
    );
    expect(
      ((percent['plotOptions'] as Record<string, { stacking?: string }>)['series']).stacking,
    ).toBe('percent');

    const donut = highchartsOptions(spec({ type: 'donut', options: { innerSize: 70 } }));
    expect(((donut['plotOptions'] as Record<string, { innerSize: string }>)['pie']).innerSize).toBe('70%');

    const gauge = highchartsOptions(spec({ type: 'gauge', options: { min: 90, max: 100 } }));
    expect((gauge['yAxis'] as { min?: number; max?: number }).min).toBe(90);
    expect((gauge['yAxis'] as { min?: number; max?: number }).max).toBe(100);
  });

  it('keeps the tooltip and legend decisions the system’s', () => {
    const options = highchartsOptions(spec({ legend: 'right', sharedTooltip: true }));
    expect((options['legend'] as { layout: string }).layout).toBe('vertical');
    expect((options['tooltip'] as { shared: boolean }).shared).toBeTrue();

    // A pie has one x position: a shared tooltip there is nonsense.
    const pie = highchartsOptions(spec({ type: 'pie', sharedTooltip: true }));
    expect((pie['tooltip'] as { shared: boolean }).shared).toBeFalse();

    const none = highchartsOptions(spec({ legend: 'none' }));
    expect((none['legend'] as { enabled: boolean }).enabled).toBeFalse();
  });
});

describe('mockChartAdapter', () => {
  it('draws nothing, and no watermark, for no series', () => {
    const host = document.createElement('div');
    document.body.append(host);
    const handle = mockChartAdapter(document).create(host, {
      type: 'line',
      categories: [],
      series: [],
      options: {},
      title: '',
      subtitle: '',
      legend: 'auto',
      sharedTooltip: true,
      ariaLabel: 'Empty',
      theme: { text: '#000', muted: '#555', grid: '#ddd', surface: '#fff', font: 'sans-serif' },
    });

    expect(host.querySelectorAll('.ds-chart-mock__series').length).toBe(0);
    expect(host.querySelector<HTMLElement>('.ds-chart-mock__watermark')!.hidden).toBeTrue();

    handle.destroy();
    expect(host.children.length).toBe(0);
    host.remove();
  });
});
