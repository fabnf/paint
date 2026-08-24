import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  borderClass,
  cx,
  elevationClass,
  radiusClass,
  responsiveClasses,
  surfaceClass,
  type BorderSide,
  type Elevation,
  type Radius,
  type Responsive,
  type SpaceValue,
  type Surface,
} from '../primitives.types';

export type BoxDisplay =
  | 'block'
  | 'inline-block'
  | 'inline'
  | 'flex'
  | 'inline-flex'
  | 'grid'
  | 'none';

/**
 * Box — the most primitive primitive.
 *
 * A styling-only container that exposes Paint's spacing, surface, radius and
 * elevation tokens. Every other layout primitive is a specialised Box.
 * Implemented with Bootstrap's spacing, background, border, radius and shadow
 * utilities, so the rendered output is plain Bootstrap.
 *
 * @example
 * ```html
 * <ds-box background="surface" [border]="true" radius="lg" [padding]="6" elevation="sm">
 *   Card-like surface, zero custom CSS.
 * </ds-box>
 *
 * <!-- Responsive padding: p-4 on mobile, p-8 from md up -->
 * <ds-box [padding]="{ base: 4, md: 8 }">…</ds-box>
 * ```
 */
@Component({
  selector: 'ds-box',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
  },
  template: '<ng-content />',
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
  `,
})
export class BoxComponent {
  /** Padding on all sides (`p-*`). */
  readonly padding = input<Responsive<SpaceValue> | null>(null);
  /** Horizontal padding (`px-*`). */
  readonly paddingX = input<Responsive<SpaceValue> | null>(null);
  /** Vertical padding (`py-*`). */
  readonly paddingY = input<Responsive<SpaceValue> | null>(null);
  readonly paddingTop = input<Responsive<SpaceValue> | null>(null);
  readonly paddingBottom = input<Responsive<SpaceValue> | null>(null);
  /** Inline-start padding (`ps-*`), direction aware. */
  readonly paddingStart = input<Responsive<SpaceValue> | null>(null);
  /** Inline-end padding (`pe-*`), direction aware. */
  readonly paddingEnd = input<Responsive<SpaceValue> | null>(null);

  /** Margin on all sides (`m-*`). */
  readonly margin = input<Responsive<SpaceValue> | null>(null);
  readonly marginX = input<Responsive<SpaceValue> | null>(null);
  readonly marginY = input<Responsive<SpaceValue> | null>(null);
  readonly marginTop = input<Responsive<SpaceValue> | null>(null);
  readonly marginBottom = input<Responsive<SpaceValue> | null>(null);
  readonly marginStart = input<Responsive<SpaceValue> | null>(null);
  readonly marginEnd = input<Responsive<SpaceValue> | null>(null);

  /** Semantic surface role (`bg-*`). */
  readonly background = input<Surface>('transparent');
  /** Token-driven corner radius (`rounded-*`). */
  readonly radius = input<Radius | null>(null);
  /** Shadow token (`shadow-*`). */
  readonly elevation = input<Elevation | null>(null);
  /** `true` for all sides, or a single side. */
  readonly border = input<BorderSide>(false);
  /** Use the stronger border token. */
  readonly borderStrong = input(false);
  /** Display mode (`d-*`), responsive. */
  readonly display = input<Responsive<BoxDisplay> | null>(null);
  /** Stretch to the container's width (`w-100`). */
  readonly fullWidth = input(false);

  protected readonly classes = computed(() =>
    cx(
      responsiveClasses('p', this.padding()),
      responsiveClasses('px', this.paddingX()),
      responsiveClasses('py', this.paddingY()),
      responsiveClasses('pt', this.paddingTop()),
      responsiveClasses('pb', this.paddingBottom()),
      responsiveClasses('ps', this.paddingStart()),
      responsiveClasses('pe', this.paddingEnd()),
      responsiveClasses('m', this.margin()),
      responsiveClasses('mx', this.marginX()),
      responsiveClasses('my', this.marginY()),
      responsiveClasses('mt', this.marginTop()),
      responsiveClasses('mb', this.marginBottom()),
      responsiveClasses('ms', this.marginStart()),
      responsiveClasses('me', this.marginEnd()),
      responsiveClasses('d', this.display()),
      surfaceClass(this.background()),
      radiusClass(this.radius()),
      elevationClass(this.elevation()),
      borderClass(this.border()),
      this.borderStrong() && 'border-strong',
      this.fullWidth() && 'w-100',
    ),
  );
}
