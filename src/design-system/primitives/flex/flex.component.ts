import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  cx,
  responsiveClasses,
  type AlignItems,
  type FlexDirection,
  type FlexWrap,
  type JustifyContent,
  type Responsive,
  type SpaceValue,
} from '../primitives.types';

/**
 * Flex — one-dimensional layout with explicit control of both axes.
 *
 * Thin, typed contract over Bootstrap's flex utilities (`d-flex`,
 * `flex-row`, `justify-content-*`, `align-items-*`, `gap-*`), with Paint space
 * tokens for the gap. Reach for {@link StackComponent} when you only need a
 * stack with a gap; use Flex when alignment matters.
 *
 * @example
 * ```html
 * <ds-flex justify="between" align="center" [gap]="4">
 *   <ds-text variant="h4">Title</ds-text>
 *   <ds-button variant="primary">Action</ds-button>
 * </ds-flex>
 *
 * <!-- Stacks on mobile, row from md up -->
 * <ds-flex [direction]="{ base: 'column', md: 'row' }" [gap]="3">…</ds-flex>
 * ```
 */
@Component({
  selector: 'ds-flex',
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
  styles: `
    :host {
      min-width: 0;
    }
  `,
})
export class FlexComponent {
  /** Main axis direction (`flex-*`), responsive. */
  readonly direction = input<Responsive<FlexDirection>>('row');
  /** Main axis distribution (`justify-content-*`), responsive. */
  readonly justify = input<Responsive<JustifyContent> | null>(null);
  /** Cross axis alignment (`align-items-*`), responsive. */
  readonly align = input<Responsive<AlignItems> | null>(null);
  /** Wrapping behaviour (`flex-*`), responsive. */
  readonly wrap = input<Responsive<FlexWrap> | null>(null);
  /** Gap between children (`gap-*`), responsive. */
  readonly gap = input<Responsive<SpaceValue> | null>(null);
  /** Row-only gap (`row-gap-*`). */
  readonly rowGap = input<Responsive<SpaceValue> | null>(null);
  /** Column-only gap (`column-gap-*`). */
  readonly columnGap = input<Responsive<SpaceValue> | null>(null);
  /** Render as `inline-flex`. */
  readonly inline = input(false);
  /** Let children grow to fill the container (`flex-fill`). */
  readonly fill = input(false);

  protected readonly classes = computed(() =>
    cx(
      this.inline() ? 'd-inline-flex' : 'd-flex',
      responsiveClasses('flex', this.direction()),
      responsiveClasses('justify-content', this.justify()),
      responsiveClasses('align-items', this.align()),
      responsiveClasses('flex', this.wrap()),
      responsiveClasses('gap', this.gap()),
      responsiveClasses('row-gap', this.rowGap()),
      responsiveClasses('column-gap', this.columnGap()),
      this.fill() && 'flex-fill',
    ),
  );
}
