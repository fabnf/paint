import type { Tone } from '../../primitives/tone.types';

/**
 * The ten chart types Paint ships, on **one** component.
 *
 * A product does not need ten components to draw ten shapes: the host contract
 * is identical for all of them, and only `type` (and, for three of them, one
 * field on {@link ChartOptions}) changes. `stacked-column` is a type rather than
 * a flag because that is how people ask for it.
 */
export const CHART_TYPES = [
  'line',
  'spline',
  'area',
  'column',
  'bar',
  'stacked-column',
  'pie',
  'donut',
  'scatter',
  'gauge',
] as const;

export type ChartType = (typeof CHART_TYPES)[number];

/** One reading. A bare number is the common case; the object is for the rest. */
export interface ChartPoint {
  /** Slice and point name. Falls back to the matching category. */
  readonly name?: string;
  /** For scatter (and any numeric x axis). */
  readonly x?: number;
  /** `null` is a gap — a missing reading, not a zero. */
  readonly y: number | null;
  /** Paints this point only: the slice that matters, the bar that failed. */
  readonly tone?: Tone;
}

/** One line, one set of bars, one ring of slices. */
export interface ChartSeries<T = unknown> {
  readonly id?: string;
  /** Shown in the legend and the tooltip. Every series has a name. */
  readonly name: string;
  readonly data: readonly (number | null | ChartPoint)[];
  /** The series' colour, as a *tone* — never a hex. Unset: the next palette step. */
  readonly tone?: Tone;
  /** Which stack this belongs to, for `stacked-column`. */
  readonly stack?: string;
  readonly meta?: T;
}

/**
 * The handful of extras a type needs, on the one shared object — so a donut is
 * a `type` and an `innerSize`, not a second component family.
 */
export interface ChartOptions {
  /** Donut: the hole, as a percentage of the ring. Default 60. */
  readonly innerSize?: number;
  /** Gauge: the ends of the dial. Default 0–100. */
  readonly min?: number;
  readonly max?: number;
  /** Unit appended to every value, in the tooltip and on the gauge. */
  readonly unit?: string;
  /** Decimal places shown. Default 0. */
  readonly decimals?: number;
  /** Axis titles. Omitted axes are simply unlabelled. */
  readonly xTitle?: string;
  readonly yTitle?: string;
  /** Stacked column: stack the values as percentages instead of totals. */
  readonly stackPercent?: boolean;
}

export type ChartLegend = 'auto' | 'bottom' | 'right' | 'none';

/**
 * What the organism hands the engine: the Paint contract, resolved.
 *
 * Colours are already decided here — real token values read from the live
 * theme — so no adapter ever picks a colour, and no adapter ships a palette.
 */
export interface ChartSpec {
  readonly type: ChartType;
  readonly categories: readonly string[];
  readonly series: readonly ResolvedSeries[];
  readonly options: ChartOptions;
  readonly title: string;
  readonly subtitle: string;
  readonly legend: ChartLegend;
  /** One tooltip for the whole x position, rather than one per series. */
  readonly sharedTooltip: boolean;
  /** The chart's accessible name. */
  readonly ariaLabel: string;
  /** Token values for the chrome: text, muted text, grid lines, surface. */
  readonly theme: ChartThemeColors;
}

export interface ResolvedSeries {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly stack?: string;
  readonly points: readonly ResolvedPoint[];
}

export interface ResolvedPoint {
  readonly name: string;
  readonly x: number;
  readonly y: number | null;
  /** Per-point colour, when the host toned a single point. */
  readonly color?: string;
}

export interface ChartThemeColors {
  readonly text: string;
  readonly muted: string;
  readonly grid: string;
  readonly surface: string;
  readonly font: string;
}

/**
 * The engine seam — the MapAdapter's bargain, for charts.
 *
 * The organism owns the contract, the chrome, the loading and empty states and
 * the colours; the adapter owns the drawing. `highchartsAdapter(Highcharts)`
 * wraps the real engine the host supplies; `mockChartAdapter()` draws a
 * token-styled plate with no engine at all — which is what tests, CI and any
 * host that has not configured Highcharts get. Same organism either way, same
 * data, same colours.
 */
export interface ChartAdapter {
  /** For chrome decisions (the "Preview chart" watermark) and for tests. */
  readonly kind: string;
  create(host: HTMLElement, spec: ChartSpec): ChartHandle;
}

export interface ChartHandle {
  /** New data, new type, new theme — same chart. */
  update(spec: ChartSpec): void;
  /** The host resized. */
  reflow?(): void;
  destroy(): void;
}

/** Is there anything to draw? A series of nothing but gaps is not data. */
export function hasChartData(series: readonly ChartSeries[]): boolean {
  return series.some((one) =>
    one.data.some((point) => (typeof point === 'number' ? true : point !== null && point?.y !== null)),
  );
}

/** Types that draw one series of slices rather than points against axes. */
export function isCircular(type: ChartType): boolean {
  return type === 'pie' || type === 'donut' || type === 'gauge';
}

/** The tones the palette walks, in order, when a series does not name one. */
export const CHART_TONE_ORDER: readonly Tone[] = [
  'primary',
  'accent',
  'info',
  'success',
  'warning',
  'danger',
  'neutral',
];

/**
 * Reads a tone's colour out of the live theme.
 *
 * Charts are the one place a product is most tempted to paste hex codes. This
 * is why they do not have to: the colour comes from the same custom property
 * the rest of the system uses, so a brand pack or a mode switch re-colours
 * every series without anybody forking a palette.
 */
export function toneColor(tone: Tone, root: HTMLElement, fallback = '#6a1bf5'): string {
  const variable = tone === 'neutral' ? '--ds-color-text-muted' : `--ds-color-${tone}`;
  const value = getComputedStyle(root).getPropertyValue(variable).trim();
  return value || fallback;
}

/** The colour for series `index`, honouring an explicit tone. */
export function seriesColor(index: number, root: HTMLElement, tone?: Tone): string {
  const resolved = tone ?? CHART_TONE_ORDER[index % CHART_TONE_ORDER.length];
  return toneColor(resolved, root);
}
