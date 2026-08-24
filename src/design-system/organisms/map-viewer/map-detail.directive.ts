import { Directive, TemplateRef, input } from '@angular/core';
import type { MapMarker } from './map.types';

/** The template context: the selected marker, as `let-marker`. */
export interface MapDetailContext<T = unknown> {
  $implicit: MapMarker<T>;
}

/**
 * Marks the detail template for {@link MapViewerComponent} — what renders in
 * the Paint detail card when a pin is selected, instead of a raw InfoWindow.
 *
 * Bind `[dsMapDetailMarkers]` to the same array the viewer gets and the
 * template's `let-marker` is fully typed — the DataTable's `dsCellRows`
 * bargain, renamed.
 *
 * @example
 * ```html
 * <ds-map-viewer [markers]="studios" [(selected)]="selectedId">
 *   <ng-template dsMapDetail [dsMapDetailMarkers]="studios" let-marker>
 *     <ds-badge tone="success">{{ marker.data.status }}</ds-badge>
 *     <ds-button size="sm" (clicked)="book(marker)">Book a visit</ds-button>
 *   </ng-template>
 * </ds-map-viewer>
 * ```
 */
@Directive({
  selector: 'ng-template[dsMapDetail]',
  standalone: true,
})
export class MapDetailDirective<T = unknown> {
  /** Inference only: binds `T` so `let-marker` is typed. Never read. */
  readonly dsMapDetailMarkers = input<readonly MapMarker<T>[]>();

  constructor(readonly template: TemplateRef<MapDetailContext<T>>) {}

  static ngTemplateContextGuard<T>(
    _directive: MapDetailDirective<T>,
    context: unknown,
  ): context is MapDetailContext<T> {
    return true;
  }
}
