import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { EmptyStateComponent } from '../../molecules/empty-state';
import { SkeletonComponent } from '../../primitives/skeleton';
import { ThemeService } from '../../theme';
import { uniqueId } from '../../utils';
import { DS_CHART_ENGINE } from './chart.engine-token';
import { mockChartAdapter } from './mock-chart.adapter';
import {
  hasChartData,
  isCircular,
  seriesColor,
  type ChartAdapter,
  type ChartHandle,
  type ChartLegend,
  type ChartOptions,
  type ChartPoint,
  type ChartSeries,
  type ChartSpec,
  type ChartThemeColors,
  type ChartType,
  type ResolvedPoint,
} from './chart.types';

/**
 * Chart — ten chart types, one contract, one engine seam.
 *
 * The host passes a `type`, `categories` and `series` — plain numbers and names,
 * no engine types anywhere — and Paint owns everything products keep rebuilding
 * around a charting library:
 *
 * - **Colour.** Series are coloured from the *tokens*, resolved out of the live
 *   theme, so light, dark and every brand pack re-colour the chart without a
 *   styling fork and without a hex in the host's code. A series may name a
 *   `tone`; it may never name a colour.
 * - **The three states.** Loading is a skeleton and `aria-busy`; nothing to draw
 *   is a `<ds-empty-state>` with the host's words, not an empty axis; otherwise
 *   the engine draws.
 * - **Chrome.** The title and subtitle are Paint's type, not the engine's, and
 *   the legend and tooltip behaviour is one decision for the whole system.
 * - **A stable API.** No Highcharts types leak into the host's tree. Changing
 *   engine is changing one provider.
 *
 * The engine is a seam: `provideCharts({ highcharts })` (deep-imported from
 * `organisms/chart/highcharts.adapter`) runs the real thing; without it — in
 * tests, in CI, in a prototype — the organism draws a token-styled preview plate
 * with the same data, the same colours and the same states. Paint itself depends
 * on no charting library.
 *
 * @example
 * ```html
 * <ds-chart
 *   type="stacked-column"
 *   title="Revenue by plan"
 *   [categories]="months"
 *   [series]="[{ name: 'Pro', data: [12, 18, 22] }, { name: 'Team', data: [4, 9, 14] }]"
 *   [options]="{ unit: 'k', yTitle: 'Revenue' }"
 * />
 * ```
 */
@Component({
  selector: 'ds-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyStateComponent, SkeletonComponent],
  template: `
    <figure class="ds-chart" [style.--ds-chart-height]="height()">
      @if (title() || subtitle()) {
        <figcaption class="ds-chart__head">
          @if (title()) {
            <p class="ds-chart__title" [id]="titleId">{{ title() }}</p>
          }
          @if (subtitle()) {
            <p class="ds-chart__subtitle" [id]="subtitleId">{{ subtitle() }}</p>
          }
        </figcaption>
      }

      <div
        class="ds-chart__frame"
        [attr.aria-busy]="loading() ? 'true' : null"
        [attr.data-state]="state()"
      >
        @if (loading()) {
          <!-- The shape of what is coming, and one thing said out loud. -->
          <ds-skeleton
            class="ds-chart__skeleton"
            variant="rect"
            height="100%"
            radius="md"
            [label]="loadingLabel()"
          />
        } @else if (!hasData()) {
          <ds-empty-state
            [icon]="emptyIcon()"
            [title]="emptyTitle()"
            [description]="emptyDescription()"
            [live]="true"
          >
            <ng-content select="[dsChartEmptyAction]" />
          </ds-empty-state>
        }

        <!--
          The engine's element is always in the DOM — never inside the @if.
          A canvas that is created and destroyed as data arrives is an engine
          that re-initialises on every load, which is how charts get slow.
        -->
        <div
          #canvas
          class="ds-chart__canvas"
          [class.ds-chart__canvas--hidden]="state() !== 'ready'"
          [attr.role]="state() === 'ready' ? 'img' : null"
          [attr.aria-label]="state() === 'ready' ? accessibleName() : null"
          [attr.aria-describedby]="subtitle() ? subtitleId : null"
        ></div>
      </div>
    </figure>
  `,
  styles: `
    :host {
      display: block;
    }

    .ds-chart {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-3);
      margin: 0;
    }

    .ds-chart__head {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-1);
    }

    .ds-chart__title {
      margin: 0;
      font-size: var(--ds-font-size-md);
      font-weight: var(--ds-font-weight-semibold);
      line-height: var(--ds-line-height-snug);
      color: var(--ds-color-text);
    }

    .ds-chart__subtitle {
      margin: 0;
      font-size: var(--ds-font-size-sm);
      color: var(--ds-color-text-muted);
    }

    .ds-chart__frame {
      position: relative;
      min-height: var(--ds-chart-height, 18rem);
    }

    .ds-chart__skeleton {
      display: block;
      height: var(--ds-chart-height, 18rem);
    }

    .ds-chart__canvas {
      height: var(--ds-chart-height, 18rem);
    }

    /* Kept in the DOM, out of the way: the engine stays alive between loads. */
    .ds-chart__canvas--hidden {
      position: absolute;
      inset: 0;
      visibility: hidden;
      pointer-events: none;
    }
  `,
})
export class ChartComponent<T = unknown> {
  private readonly document = inject(DOCUMENT);
  private readonly theme = inject(ThemeService, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /**
   * A host-configured engine, if `provideCharts()` was called. Asked for by
   * token, so this component never imports the module that builds one — the
   * DataGrid rule: nothing pulls a megabyte in by accident.
   */
  private readonly configuredEngine = inject(DS_CHART_ENGINE, { optional: true });

  /** Which of the ten. Changing it re-draws the same data in the new shape. */
  readonly type = input<ChartType>('line');
  /** The x axis, for everything that has one; the slice names, for those that do not. */
  readonly categories = input<readonly string[]>([]);
  readonly series = input<readonly ChartSeries<T>[]>([]);
  /** The small extras: donut hole, gauge ends, unit, axis titles. */
  readonly options = input<ChartOptions>({});

  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  /** Accessible name. Falls back to the title. A chart without either is a mystery. */
  readonly ariaLabel = input<string>('');

  readonly loading = input(false);
  readonly loadingLabel = input<string>('Loading chart…');
  readonly emptyTitle = input<string>('No data yet');
  readonly emptyDescription = input<string>('There is nothing to chart for this selection.');
  readonly emptyIcon = input<'ruler' | 'search' | 'grid' | 'info'>('ruler');

  readonly legend = input<ChartLegend>('auto');
  /** One tooltip for the whole x position. Ignored by the circular types. */
  readonly sharedTooltip = input(true);
  readonly height = input<string>('18rem');

  /** The engine. Defaults to Highcharts when provided, the mock plate otherwise. */
  readonly adapter = input<ChartAdapter | null>(null);

  /** The engine drew. Carries what it is, for a host that reports on it. */
  readonly rendered = output<{ type: ChartType; engine: string; series: number }>();

  protected readonly titleId = uniqueId('ds-chart-title');
  protected readonly subtitleId = uniqueId('ds-chart-subtitle');

  private readonly canvasRef = viewChild.required<ElementRef<HTMLElement>>('canvas');
  private handle: ChartHandle | null = null;
  /** The adapter the live handle came from, so swapping engines rebuilds it. */
  private activeAdapter: ChartAdapter | null = null;
  /** What is actually drawing — `'mock'` or `'highcharts'`. Reported to tests. */
  engineKind = '';

  protected readonly hasData = computed(() => hasChartData(this.series()));

  protected readonly state = computed<'loading' | 'empty' | 'ready'>(() =>
    this.loading() ? 'loading' : this.hasData() ? 'ready' : 'empty',
  );

  protected readonly accessibleName = computed(
    () => this.ariaLabel() || this.title() || 'Chart',
  );

  /**
   * The spec the engine gets: the host's data, with every colour resolved from
   * the tokens *now* — which is what makes a theme switch a re-draw rather than
   * a restyle.
   */
  readonly spec = computed<ChartSpec>(() => {
    // Read the theme so a mode or brand change recomputes the colours.
    this.theme?.mode();
    this.theme?.brand();

    const root = this.host.nativeElement;
    const categories = [...this.categories()];
    const circular = isCircular(this.type());

    const series = this.series().map((one, index) => ({
      id: one.id ?? `series-${index}`,
      name: one.name,
      color: seriesColor(index, root, one.tone),
      stack: one.stack,
      points: one.data.map((point, pointIndex) =>
        this.resolvePoint(point, pointIndex, categories, root, circular, index),
      ),
    }));

    return {
      type: this.type(),
      categories,
      series,
      options: this.options(),
      title: this.title(),
      subtitle: this.subtitle(),
      legend: this.legend(),
      sharedTooltip: this.sharedTooltip(),
      ariaLabel: this.accessibleName(),
      theme: this.themeColors(root),
    };
  });

  constructor() {
    // One effect: create the engine when there is something to draw, keep it
    // fed, and let it go when the component does.
    effect(() => {
      const spec = this.spec();
      const ready = this.state() === 'ready';
      const canvas = this.canvasRef().nativeElement;

      if (!ready) {
        return;
      }

      const adapter = this.resolveAdapter();
      if (!this.handle || adapter !== this.activeAdapter) {
        // A new engine is a new chart; the same engine keeps its own.
        this.destroy();
        this.activeAdapter = adapter;
        this.engineKind = adapter.kind;
        this.handle = adapter.create(canvas, spec);
      } else {
        this.handle.update(spec);
      }

      this.rendered.emit({
        type: spec.type,
        engine: this.engineKind,
        series: spec.series.length,
      });
    });

    inject(DestroyRef).onDestroy(() => this.destroy());
  }

  /** Tells the engine the box changed — for a host that resizes its own layout. */
  reflow(): void {
    this.handle?.reflow?.();
  }

  /** Throws the engine away. The next draw builds a new one. */
  destroy(): void {
    this.handle?.destroy();
    this.handle = null;
    this.activeAdapter = null;
  }

  private resolveAdapter(): ChartAdapter {
    const provided = this.adapter();
    if (provided) {
      return provided;
    }
    return this.configuredEngine ?? mockChartAdapter(this.document);
  }

  private themeColors(root: HTMLElement): ChartThemeColors {
    const styles = getComputedStyle(root);
    const read = (variable: string, fallback: string) =>
      styles.getPropertyValue(variable).trim() || fallback;
    return {
      text: read('--ds-color-text', '#141221'),
      muted: read('--ds-color-text-muted', '#5b5375'),
      grid: read('--ds-color-border', '#e0dcea'),
      surface: read('--ds-color-surface-elevated', '#ffffff'),
      font: read('--ds-font-sans', 'system-ui, sans-serif'),
    };
  }

  private resolvePoint(
    point: number | null | ChartPoint,
    index: number,
    categories: readonly string[],
    root: HTMLElement,
    circular: boolean,
    seriesIndex: number,
  ): ResolvedPoint {
    const fallbackName = categories[index] ?? `${index + 1}`;
    if (point === null || typeof point === 'number') {
      return {
        name: fallbackName,
        x: index,
        y: point,
        // A pie's slices are the palette; a line's points are its series' colour.
        color: circular ? seriesColor(index, root) : undefined,
      };
    }
    return {
      name: point.name ?? fallbackName,
      x: point.x ?? index,
      y: point.y,
      color: point.tone
        ? seriesColor(seriesIndex, root, point.tone)
        : circular
          ? seriesColor(index, root)
          : undefined,
    };
  }
}
