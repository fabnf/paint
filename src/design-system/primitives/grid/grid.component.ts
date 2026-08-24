import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  cx,
  responsiveClasses,
  type AlignItems,
  type JustifyContent,
  type Responsive,
  type SpaceValue,
} from '../primitives.types';

/**
 * Grid — two-dimensional layout on Bootstrap's 12-column grid.
 *
 * Renders Bootstrap's `.row` with `row-cols-*` for equal-width tracks and
 * `g-*` gutters resolved from Paint space tokens. Pair with
 * {@link GridItemComponent} when a child needs to span a specific number of
 * columns.
 *
 * @example
 * ```html
 * <!-- Equal tracks, responsive -->
 * <ds-grid [cols]="{ base: 1, sm: 2, lg: 4 }" [gap]="4">
 *   <ds-box background="surface" [border]="true" [padding]="4">A</ds-box>
 *   <ds-box background="surface" [border]="true" [padding]="4">B</ds-box>
 * </ds-grid>
 *
 * <!-- Explicit spans on the 12-column grid -->
 * <ds-grid [gap]="4">
 *   <ds-grid-item [span]="{ base: 12, md: 8 }">Main</ds-grid-item>
 *   <ds-grid-item [span]="{ base: 12, md: 4 }">Aside</ds-grid-item>
 * </ds-grid>
 * ```
 */
@Component({
  selector: 'ds-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    // `align` is a legacy HTML presentational attribute: when written as a
    // static attribute (align="center") browsers apply it as a text-align
    // hint that inherits into all children. Paint uses `align` for flex
    // alignment, so strip the attribute from the DOM and keep only the class.
    '[attr.align]': 'null',
  },
  template: '<ng-content />',
})
export class GridComponent {
  /** Equal-width columns per row (`row-cols-*`), 1–6 or `auto`. Omit when using explicit spans. */
  readonly cols = input<Responsive<number | 'auto'> | null>(null);
  /** Gutter between cells (`g-*`), responsive. */
  readonly gap = input<Responsive<SpaceValue>>(4);
  /** Horizontal gutter only (`gx-*`). */
  readonly columnGap = input<Responsive<SpaceValue> | null>(null);
  /** Vertical gutter only (`gy-*`). */
  readonly rowGap = input<Responsive<SpaceValue> | null>(null);
  /** Cross axis alignment of cells (`align-items-*`). */
  readonly align = input<Responsive<AlignItems> | null>(null);
  /** Distribution of cells along the row (`justify-content-*`). */
  readonly justify = input<Responsive<JustifyContent> | null>(null);

  protected readonly classes = computed(() =>
    cx(
      'row',
      responsiveClasses('row-cols', this.cols()),
      this.columnGap() === null && this.rowGap() === null ? responsiveClasses('g', this.gap()) : [],
      responsiveClasses('gx', this.columnGap()),
      responsiveClasses('gy', this.rowGap()),
      responsiveClasses('align-items', this.align()),
      responsiveClasses('justify-content', this.justify()),
    ),
  );
}

/**
 * GridItem — a cell in a {@link GridComponent}.
 *
 * Compiles to Bootstrap's `.col` / `.col-{breakpoint}-{span}` classes.
 *
 * @example
 * ```html
 * <ds-grid-item [span]="6" [offset]="{ md: 3 }">Half width</ds-grid-item>
 * ```
 */
@Component({
  selector: 'ds-grid-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
  },
  template: '<ng-content />',
  styles: `
    :host {
      min-width: 0;
    }
  `,
})
export class GridItemComponent {
  /** Columns to span out of 12 (`col-*`), or `auto` to size to content. */
  readonly span = input<Responsive<number | 'auto'> | null>(null);
  /** Columns to offset by (`offset-*`). */
  readonly offset = input<Responsive<number> | null>(null);
  /** Visual order (`order-*`). */
  readonly order = input<Responsive<number | 'first' | 'last'> | null>(null);

  protected readonly classes = computed(() => {
    const span = this.span();

    return cx(
      span === null ? 'col' : responsiveClasses('col', span),
      responsiveClasses('offset', this.offset()),
      responsiveClasses('order', this.order()),
    );
  });
}
