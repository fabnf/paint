import { isCircular, type ChartAdapter, type ChartHandle, type ChartSpec } from './chart.types';

/**
 * The engineless chart: a token-styled plate drawn with plain SVG.
 *
 * Not only a test double. It is what `<ds-chart>` renders for any host that has
 * not configured Highcharts — and therefore what CI, a prototype and the docs
 * site get — so it behaves like a chart where the organism cares: every series
 * is drawn, in the colour the theme resolved, in a shape that belongs to the
 * type; the legend lists the series; the values are in the DOM.
 *
 * It says "Preview chart" out loud, because a mock pretending to be an engine is
 * a lie with axes. And it publishes what it drew — `data-chart-type`,
 * `data-series`, `data-point`, `data-value`, `data-color` — so the suite can
 * assert a type path without screenshot theatre.
 *
 * Below the plate it writes the data as a real `<table>`, visually hidden: the
 * thing every charting library treats as an extra, and the only part a screen
 * reader can actually read.
 */
export function mockChartAdapter(doc: Document = document): ChartAdapter {
  return {
    kind: 'mock',

    create(host: HTMLElement, spec: ChartSpec): ChartHandle {
      const root = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const plate = doc.createElement('div');
      plate.className = 'ds-chart-mock';
      plate.setAttribute('data-chart-mock', '');

      const legend = doc.createElement('ul');
      legend.className = 'ds-chart-mock__legend';

      const table = doc.createElement('table');
      table.className = 'visually-hidden';

      const watermark = doc.createElement('span');
      watermark.className = 'ds-chart-mock__watermark';
      watermark.textContent = 'Preview chart';

      plate.append(root, legend, watermark, table);
      host.replaceChildren(plate);

      const render = (next: ChartSpec) => {
        ensureMockStyles(doc);
        draw(doc, root, next);
        drawLegend(doc, legend, next);
        drawTable(doc, table, next);
        plate.dataset['chartType'] = next.type;
        plate.dataset['seriesCount'] = String(next.series.length);
        plate.style.setProperty('--ds-chart-grid', next.theme.grid);
        watermark.hidden = next.series.length === 0;
      };

      render(spec);

      return {
        update: (next) => render(next),
        destroy: () => host.replaceChildren(),
      };
    },
  };
}

const NS = 'http://www.w3.org/2000/svg';
const WIDTH = 600;
const HEIGHT = 320;
const PAD = 24;

function el(doc: Document, name: string, attrs: Record<string, string | number>): SVGElement {
  const node = doc.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, String(value));
  }
  return node;
}

/** Every y in the spec, for a shared scale — the one thing all ten share. */
function extent(spec: ChartSpec): { min: number; max: number } {
  const values = spec.series.flatMap((series) =>
    series.points.map((point) => point.y).filter((y): y is number => y !== null),
  );
  if (spec.type === 'gauge') {
    return { min: spec.options.min ?? 0, max: spec.options.max ?? 100 };
  }
  if (!values.length) {
    return { min: 0, max: 1 };
  }
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  return { min, max: max === min ? min + 1 : max };
}

function draw(doc: Document, root: SVGElement, spec: ChartSpec): void {
  root.setAttribute('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);
  root.setAttribute('role', 'presentation');
  root.setAttribute('class', 'ds-chart-mock__plot');
  root.replaceChildren();

  if (!spec.series.length) {
    return;
  }

  if (isCircular(spec.type)) {
    drawCircular(doc, root, spec);
    return;
  }

  const { min, max } = extent(spec);
  const plotWidth = WIDTH - PAD * 2;
  const plotHeight = HEIGHT - PAD * 2;
  const scaleY = (y: number) => PAD + plotHeight - ((y - min) / (max - min)) * plotHeight;
  const count = Math.max(...spec.series.map((series) => series.points.length), 1);
  const slot = plotWidth / count;

  /* Scatter has a real x axis of its own; everything else is slotted by index. */
  const xs = spec.series.flatMap((series) => series.points.map((point) => point.x));
  const xMin = Math.min(...xs, 0);
  const xMax = Math.max(...xs, xMin + 1);
  const scaleX = (x: number) => PAD + ((x - xMin) / (xMax - xMin)) * plotWidth;

  // Two grid lines, so the plate reads as a chart rather than as a drawing.
  for (const fraction of [0, 0.5, 1]) {
    const y = PAD + plotHeight * fraction;
    root.append(
      el(doc, 'line', {
        x1: PAD,
        x2: WIDTH - PAD,
        y1: y,
        y2: y,
        stroke: spec.theme.grid,
        'stroke-width': 1,
        class: 'ds-chart-mock__grid',
      }),
    );
  }

  const stacked = spec.type === 'stacked-column';
  const stackTotals = new Array(count).fill(0);

  spec.series.forEach((series, seriesIndex) => {
    const group = el(doc, 'g', {
      class: 'ds-chart-mock__series',
      'data-series': series.name,
      'data-color': series.color,
    });

    const points = series.points.map((point, index) => ({
      point,
      cx: PAD + slot * index + slot / 2,
      cy: point.y === null ? null : scaleY(point.y),
    }));

    if (spec.type === 'line' || spec.type === 'spline' || spec.type === 'area') {
      const path = points
        .filter((entry) => entry.cy !== null)
        .map((entry, index) => `${index === 0 ? 'M' : 'L'}${entry.cx.toFixed(1)} ${entry.cy!.toFixed(1)}`)
        .join(' ');
      if (spec.type === 'area') {
        group.append(
          el(doc, 'path', {
            d: `${path} L${(WIDTH - PAD).toFixed(1)} ${PAD + plotHeight} L${PAD} ${PAD + plotHeight} Z`,
            fill: series.color,
            'fill-opacity': 0.18,
            stroke: 'none',
          }),
        );
      }
      group.append(
        el(doc, 'path', {
          d: path,
          fill: 'none',
          stroke: series.color,
          'stroke-width': 2,
          'stroke-linejoin': spec.type === 'spline' ? 'round' : 'miter',
          class: 'ds-chart-mock__line',
        }),
      );
    }

    points.forEach(({ point, cx, cy }, index) => {
      if (cy === null) {
        return;
      }
      const shared: Record<string, string | number> = {
        'data-point': point.name,
        'data-value': String(point.y),
        fill: point.color ?? series.color,
      };

      if (spec.type === 'column' || spec.type === 'bar' || stacked) {
        const barWidth = stacked ? slot * 0.6 : (slot * 0.7) / spec.series.length;
        const height = Math.max(1, PAD + plotHeight - cy);
        if (spec.type === 'bar') {
          // A bar chart is a column chart lying down; the plate says so too.
          const rowHeight = (plotHeight / count) * 0.7;
          const rowSlot = plotHeight / count;
          const y = PAD + rowSlot * index + (rowSlot - rowHeight) / 2;
          const length = ((point.y! - min) / (max - min)) * plotWidth;
          group.append(
            el(doc, 'rect', {
              ...shared,
              x: PAD,
              y: y + (rowHeight / spec.series.length) * seriesIndex,
              width: Math.max(1, length),
              height: rowHeight / spec.series.length,
              class: 'ds-chart-mock__bar',
            }),
          );
          return;
        }
        const base = stacked ? PAD + plotHeight - stackTotals[index] : PAD + plotHeight;
        const top = stacked ? base - height : cy;
        if (stacked) {
          stackTotals[index] += height;
        }
        group.append(
          el(doc, 'rect', {
            ...shared,
            x: stacked
              ? PAD + slot * index + (slot - barWidth) / 2
              : PAD + slot * index + (slot - barWidth * spec.series.length) / 2 + barWidth * seriesIndex,
            y: top,
            width: barWidth,
            height,
            class: 'ds-chart-mock__bar',
          }),
        );
        return;
      }

      group.append(
        el(doc, 'circle', {
          ...shared,
          cx: spec.type === 'scatter' ? scaleX(point.x) : cx,
          cy,
          r: spec.type === 'scatter' ? 5 : 3,
          class: 'ds-chart-mock__point',
        }),
      );
    });

    root.append(group);
  });
}

/** Pie, donut and gauge: one ring, drawn with arcs. */
function drawCircular(doc: Document, root: SVGElement, spec: ChartSpec): void {
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;
  const radius = Math.min(WIDTH, HEIGHT) / 2 - PAD;
  const inner = spec.type === 'donut' ? (radius * (spec.options.innerSize ?? 60)) / 100 : 0;
  const series = spec.series[0];
  if (!series) {
    return;
  }

  const group = el(doc, 'g', {
    class: 'ds-chart-mock__series',
    'data-series': series.name,
    'data-color': series.color,
  });

  if (spec.type === 'gauge') {
    const { min, max } = extent(spec);
    const value = series.points[0]?.y ?? min;
    const fraction = Math.min(Math.max((value - min) / (max - min), 0), 1);
    group.append(
      arc(doc, cx, cy, radius, radius * 0.72, 0, 1, spec.theme.grid, {
        class: 'ds-chart-mock__gauge-track',
      }),
      arc(doc, cx, cy, radius, radius * 0.72, 0, fraction, series.color, {
        class: 'ds-chart-mock__gauge-value',
        'data-point': series.points[0]?.name ?? series.name,
        'data-value': String(value),
      }),
    );
    const label = el(doc, 'text', {
      x: cx,
      y: cy + 6,
      'text-anchor': 'middle',
      fill: spec.theme.text,
      'font-family': spec.theme.font,
      'font-size': 28,
      class: 'ds-chart-mock__gauge-label',
    });
    label.textContent = `${format(value, spec)}`;
    group.append(label);
    root.append(group);
    return;
  }

  const total = series.points.reduce((sum, point) => sum + (point.y ?? 0), 0) || 1;
  let offset = 0;
  for (const point of series.points) {
    const fraction = (point.y ?? 0) / total;
    group.append(
      arc(doc, cx, cy, radius, inner, offset, offset + fraction, point.color ?? series.color, {
        'data-point': point.name,
        'data-value': String(point.y),
        class: 'ds-chart-mock__slice',
      }),
    );
    offset += fraction;
  }
  root.append(group);
}

/** One ring segment, from `from` to `to` as fractions of the circle. */
function arc(
  doc: Document,
  cx: number,
  cy: number,
  radius: number,
  inner: number,
  from: number,
  to: number,
  color: string,
  attrs: Record<string, string | number> = {},
): SVGElement {
  const start = from * Math.PI * 2 - Math.PI / 2;
  const end = to * Math.PI * 2 - Math.PI / 2;
  const large = to - from > 0.5 ? 1 : 0;
  const point = (angle: number, r: number) => `${(cx + Math.cos(angle) * r).toFixed(2)} ${(cy + Math.sin(angle) * r).toFixed(2)}`;
  const outerPath = `M${point(start, radius)} A${radius} ${radius} 0 ${large} 1 ${point(end, radius)}`;
  const d = inner
    ? `${outerPath} L${point(end, inner)} A${inner} ${inner} 0 ${large} 0 ${point(start, inner)} Z`
    : `${outerPath} L${cx} ${cy} Z`;
  return el(doc, 'path', { ...attrs, d, fill: color });
}

function drawLegend(doc: Document, legend: HTMLElement, spec: ChartSpec): void {
  legend.hidden = spec.legend === 'none' || !spec.series.length;
  legend.className = `ds-chart-mock__legend ds-chart-mock__legend--${spec.legend}`;
  // Circular charts name their slices; everything else names its series.
  const entries = isCircular(spec.type) && spec.type !== 'gauge'
    ? (spec.series[0]?.points ?? []).map((point) => ({
        name: point.name,
        color: point.color ?? spec.series[0].color,
      }))
    : spec.series.map((series) => ({ name: series.name, color: series.color }));

  legend.replaceChildren(
    ...entries.map((entry) => {
      const item = doc.createElement('li');
      item.className = 'ds-chart-mock__legend-item';
      item.dataset['legend'] = entry.name;
      const swatch = doc.createElement('span');
      swatch.className = 'ds-chart-mock__swatch';
      swatch.style.backgroundColor = entry.color;
      const text = doc.createElement('span');
      text.textContent = entry.name;
      item.append(swatch, text);
      return item;
    }),
  );
}

/** The data, as a table. The part a screen reader can actually read. */
function drawTable(doc: Document, table: HTMLElement, spec: ChartSpec): void {
  const caption = doc.createElement('caption');
  caption.textContent = spec.ariaLabel || spec.title;

  const head = doc.createElement('tr');
  // The corner cell names the rows: an empty table header is a header nobody
  // can use, and a chart's rows are its categories.
  head.append(cell(doc, 'th', spec.options.xTitle || (isCircular(spec.type) ? 'Slice' : 'Category')));
  for (const series of spec.series) {
    head.append(cell(doc, 'th', series.name));
  }

  const names = spec.series[0]?.points.map((point) => point.name) ?? [];
  const rows = names.map((name, index) => {
    const row = doc.createElement('tr');
    const header = cell(doc, 'th', name);
    header.setAttribute('scope', 'row');
    row.append(header);
    for (const series of spec.series) {
      const point = series.points[index];
      row.append(cell(doc, 'td', point && point.y !== null ? format(point.y, spec) : '—'));
    }
    return row;
  });

  const thead = doc.createElement('thead');
  thead.append(head);
  const tbody = doc.createElement('tbody');
  tbody.append(...rows);
  table.replaceChildren(caption, thead, tbody);
}

function cell(doc: Document, tag: 'th' | 'td', text: string): HTMLElement {
  const node = doc.createElement(tag);
  node.textContent = text;
  if (tag === 'th') {
    node.setAttribute('scope', 'col');
  }
  return node;
}

function format(value: number, spec: ChartSpec): string {
  return `${value.toFixed(spec.options.decimals ?? 0)}${spec.options.unit ?? ''}`;
}

/** One stylesheet for the plate, added once. */
function ensureMockStyles(doc: Document): void {
  if (doc.getElementById('ds-chart-mock-styles')) {
    return;
  }
  const style = doc.createElement('style');
  style.id = 'ds-chart-mock-styles';
  style.textContent = `
    .ds-chart-mock {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-3);
      width: 100%;
      height: 100%;
    }
    .ds-chart-mock__plot {
      width: 100%;
      flex: 1 1 auto;
      min-height: 0;
      overflow: visible;
    }
    .ds-chart-mock__grid { opacity: 0.6; }
    .ds-chart-mock__legend {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ds-space-2) var(--ds-space-4);
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: var(--ds-font-size-xs);
      color: var(--ds-color-text-muted);
    }
    .ds-chart-mock__legend--right { flex-direction: column; }
    .ds-chart-mock__legend-item { display: inline-flex; align-items: center; gap: var(--ds-space-1_5); }
    .ds-chart-mock__swatch {
      width: 0.625rem;
      height: 0.625rem;
      border-radius: var(--ds-radius-sm);
    }
    .ds-chart-mock__watermark {
      position: absolute;
      inset-block-start: 0;
      inset-inline-end: 0;
      padding: 0.125rem var(--ds-space-2);
      border-radius: var(--ds-radius-full);
      background-color: var(--ds-color-surface-sunken);
      color: var(--ds-color-text-subtle);
      font-size: var(--ds-font-size-xs);
      letter-spacing: var(--ds-letter-spacing-wide);
    }
  `;
  doc.head.append(style);
}
