import { InjectionToken, makeEnvironmentProviders } from '@angular/core';
import { DS_CHART_ENGINE } from './chart.engine-token';
import { isCircular, type ChartAdapter, type ChartHandle, type ChartSpec, type ChartType } from './chart.types';

/**
 * The real engine, behind the host's own copy of it.
 *
 * **Deep import only.** This file is deliberately *not* re-exported from
 * `organisms/index.ts` or the design-system barrel — the DataGrid rule again:
 *
 * ```ts
 * import { highchartsAdapter, provideCharts } from '…/design-system/organisms/chart/highcharts.adapter';
 * ```
 *
 * Paint does not depend on Highcharts. The host passes its own namespace
 * (`import Highcharts from 'highcharts'`), which keeps the licence, the version,
 * the modules (`highcharts/highcharts-more` for the gauge) and the megabyte in
 * the host's hands — and means the design system's tests, CI and docs never need
 * a licence key, a CDN login or a network. Without a host-supplied engine
 * `<ds-chart>` draws the mock plate, and every other behaviour is identical.
 *
 * **Paint decides the paint.** The spec arrives with its colours already
 * resolved from the live tokens, so this builds options that *use* them and
 * never declares a palette of its own. Everything Highcharts would otherwise
 * style — the credits, the default colours, the font, the grid — is overridden
 * from `spec.theme`.
 */

/** The subset of the Highcharts namespace this adapter uses. */
export interface HighchartsLike {
  chart(host: HTMLElement, options: Record<string, unknown>): HighchartsChartLike;
}

export interface HighchartsChartLike {
  update(options: Record<string, unknown>, redraw?: boolean, oneToOne?: boolean): void;
  reflow?(): void;
  destroy(): void;
}

export interface ChartsConfig {
  /** The host's Highcharts namespace. Absent: the mock plate. */
  readonly highcharts?: HighchartsLike;
}

export const CHARTS_CONFIG = new InjectionToken<ChartsConfig>('CHARTS_CONFIG', {
  factory: () => ({}),
});

/**
 * Hands `<ds-chart>` the engine, once, at the root.
 *
 * @example
 * ```ts
 * import Highcharts from 'highcharts';
 * import 'highcharts/highcharts-more';            // the gauge lives here
 *
 * providers: [provideCharts({ highcharts: Highcharts })];
 * ```
 */
export function provideCharts(config: ChartsConfig) {
  return makeEnvironmentProviders([
    { provide: CHARTS_CONFIG, useValue: config },
    {
      provide: DS_CHART_ENGINE,
      useFactory: () => (config.highcharts ? highchartsAdapter(config.highcharts) : null),
    },
  ]);
}

/** Paint's type names → Highcharts'. The three that are a type *plus* a setting. */
const HIGHCHARTS_TYPE: Record<ChartType, string> = {
  line: 'line',
  spline: 'spline',
  area: 'area',
  column: 'column',
  bar: 'bar',
  'stacked-column': 'column',
  pie: 'pie',
  donut: 'pie',
  scatter: 'scatter',
  gauge: 'solidgauge',
};

/** Builds Highcharts options from a resolved Paint spec. Pure, and tested. */
export function highchartsOptions(spec: ChartSpec): Record<string, unknown> {
  const type = HIGHCHARTS_TYPE[spec.type];
  const circular = isCircular(spec.type);
  const suffix = spec.options.unit ?? '';
  const decimals = spec.options.decimals ?? 0;

  const series = spec.series.map((one) => ({
    type,
    id: one.id,
    name: one.name,
    color: one.color,
    stack: one.stack,
    // A pie takes named slices; everything else takes points in order.
    data: one.points.map((point) =>
      circular || point.color
        ? { name: point.name, y: point.y, x: point.x, color: point.color ?? one.color }
        : point.y,
    ),
    ...(spec.type === 'donut' ? { innerSize: `${spec.options.innerSize ?? 60}%` } : {}),
  }));

  return {
    chart: {
      type,
      backgroundColor: 'transparent',
      style: { fontFamily: spec.theme.font },
      spacing: [8, 8, 8, 8],
    },
    // Paint draws the title and the subtitle: they are the organism's chrome,
    // so the engine must not draw them a second time, in its own typeface.
    title: { text: undefined },
    subtitle: { text: undefined },
    credits: { enabled: false },
    accessibility: { enabled: false, description: spec.ariaLabel },
    colors: spec.series.map((one) => one.color),
    xAxis: {
      categories: circular ? undefined : [...spec.categories],
      title: { text: spec.options.xTitle ?? null },
      lineColor: spec.theme.grid,
      tickColor: spec.theme.grid,
      labels: { style: { color: spec.theme.muted } },
    },
    yAxis: {
      title: { text: spec.options.yTitle ?? null },
      min: spec.options.min,
      max: spec.options.max,
      gridLineColor: spec.theme.grid,
      labels: { style: { color: spec.theme.muted } },
      ...(spec.type === 'gauge'
        ? { stops: [[0.1, spec.series[0]?.color ?? spec.theme.text]], lineWidth: 0, tickAmount: 2 }
        : {}),
    },
    legend: {
      enabled: spec.legend !== 'none',
      align: spec.legend === 'right' ? 'right' : 'center',
      verticalAlign: spec.legend === 'right' ? 'middle' : 'bottom',
      layout: spec.legend === 'right' ? 'vertical' : 'horizontal',
      itemStyle: { color: spec.theme.muted, fontWeight: '500' },
      itemHoverStyle: { color: spec.theme.text },
    },
    tooltip: {
      shared: spec.sharedTooltip && !circular,
      backgroundColor: spec.theme.surface,
      borderColor: spec.theme.grid,
      style: { color: spec.theme.text },
      valueSuffix: suffix,
      valueDecimals: decimals,
    },
    plotOptions: {
      series: {
        animation: false,
        stacking: spec.type === 'stacked-column'
          ? spec.options.stackPercent
            ? 'percent'
            : 'normal'
          : undefined,
        dataLabels: { enabled: false },
      },
      pie: {
        innerSize: spec.type === 'donut' ? `${spec.options.innerSize ?? 60}%` : '0%',
        borderColor: spec.theme.surface,
        showInLegend: true,
      },
    },
    series,
  };
}

/** Wraps a host-supplied Highcharts namespace as a Paint chart engine. */
export function highchartsAdapter(highcharts: HighchartsLike): ChartAdapter {
  return {
    kind: 'highcharts',

    create(host: HTMLElement, spec: ChartSpec): ChartHandle {
      const chart = highcharts.chart(host, highchartsOptions(spec));
      return {
        // `oneToOne` so removing a series removes it, rather than merging.
        update: (next) => chart.update(highchartsOptions(next), true, true),
        reflow: () => chart.reflow?.(),
        destroy: () => chart.destroy(),
      };
    },
  };
}
