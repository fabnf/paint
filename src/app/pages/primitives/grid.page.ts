import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DS_PRIMITIVES, type SpaceValue } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Grid — documentation page.
 */
@Component({
  selector: 'app-grid-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DOC_UI],
  templateUrl: './grid.page.html',
  styleUrl: './primitives-page.scss',
})
export class GridPage {
  readonly cols = signal(3);
  readonly gap = signal<SpaceValue>(4);

  readonly colOptions = [1, 2, 3, 4, 6] as const;
  readonly gapOptions: readonly SpaceValue[] = [0, 1, 2, 3, 4, 6, 8];
  readonly cells = [1, 2, 3, 4, 5, 6];

  readonly playgroundCode = computed(
    () => `<ds-grid [cols]="${this.cols()}" [gap]="${this.gap()}">
  <div>one</div>
  <div>two</div>
  <div>three</div>
</ds-grid>`,
  );

  readonly colsSnippet = `<!-- Equal tracks that reflow by breakpoint -->
<ds-grid [cols]="{ base: 1, sm: 2, lg: 4 }" [gap]="4">
  <ds-box background="surface" [border]="true" [padding]="4">A</ds-box>
  <ds-box background="surface" [border]="true" [padding]="4">B</ds-box>
  <ds-box background="surface" [border]="true" [padding]="4">C</ds-box>
  <ds-box background="surface" [border]="true" [padding]="4">D</ds-box>
</ds-grid>`;

  readonly spanSnippet = `<!-- Explicit spans on the 12-column grid -->
<ds-grid [gap]="4">
  <ds-grid-item [span]="{ base: 12, md: 8 }">Main</ds-grid-item>
  <ds-grid-item [span]="{ base: 12, md: 4 }">Aside</ds-grid-item>
</ds-grid>`;

  readonly offsetSnippet = `<ds-grid [gap]="3">
  <ds-grid-item [span]="6" [offset]="3">Centred by offset</ds-grid-item>
</ds-grid>`;

  readonly gutterSnippet = `<!-- Independent horizontal and vertical gutters -->
<ds-grid [cols]="3" [columnGap]="6" [rowGap]="10">…</ds-grid>`;

  readonly layoutSnippet = `<ds-grid [gap]="6">
  <ds-grid-item [span]="{ base: 12, lg: 8 }">
    <ds-stack [gap]="4">…content…</ds-stack>
  </ds-grid-item>
  <ds-grid-item [span]="{ base: 12, lg: 4 }">
    <ds-box background="surface" [border]="true" radius="lg" [padding]="5">…aside…</ds-box>
  </ds-grid-item>
</ds-grid>`;

  readonly gridInputs: readonly ApiRow[] = [
    {
      name: 'cols',
      type: `Responsive<number | 'auto'> | null`,
      default: 'null',
      description: 'Equal-width tracks per row (row-cols-*). Omit when using explicit spans.',
    },
    { name: 'gap', type: 'Responsive<SpaceValue>', default: '4', description: 'Gutter between cells (g-*).' },
    { name: 'columnGap', type: 'Responsive<SpaceValue> | null', default: 'null', description: 'Horizontal gutter only (gx-*).' },
    { name: 'rowGap', type: 'Responsive<SpaceValue> | null', default: 'null', description: 'Vertical gutter only (gy-*).' },
    { name: 'align', type: 'Responsive<AlignItems> | null', default: 'null', description: 'Cross axis alignment of cells.' },
    { name: 'justify', type: 'Responsive<JustifyContent> | null', default: 'null', description: 'Distribution of cells along the row.' },
  ];

  readonly itemInputs: readonly ApiRow[] = [
    {
      name: 'span',
      type: `Responsive<number | 'auto'> | null`,
      default: 'null',
      description: 'Columns to span out of 12 (col-*). Defaults to an equal share.',
    },
    { name: 'offset', type: 'Responsive<number> | null', default: 'null', description: 'Columns to offset by (offset-*).' },
    { name: 'order', type: `Responsive<number | 'first' | 'last'> | null`, default: 'null', description: 'Visual order (order-*).' },
  ];

  setCols(value: number): void {
    this.cols.set(value);
  }

  setGap(value: SpaceValue): void {
    this.gap.set(value);
  }
}
