import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
  type AfterViewInit,
} from '@angular/core';
import { IconComponent } from '../../icons';
import { ButtonComponent } from '../../primitives/button';
import { SpinnerComponent } from '../../primitives/spinner';
import { AlertComponent } from '../../molecules/alert';
import { SearchFieldComponent } from '../../molecules/search-field';
import { uniqueId } from '../../utils';
import { googleMapsAdapter, MAPS_CONFIG } from './google-maps.adapter';
import { MapDetailDirective } from './map-detail.directive';
import { mockMapAdapter } from './mock-map.adapter';
import {
  fitCameraTo,
  type MapAdapter,
  type MapCamera,
  type MapCoordinates,
  type MapHandle,
  type MapMarker,
} from './map.types';

/**
 * MapViewer — the map every app wires by hand, wired once.
 *
 * Google Maps JS API behind the host's key (`provideMaps({ apiKey })`),
 * wearing Paint: a quiet token-styled basemap, Paint pins, and — when a pin is
 * selected — a **Paint detail card**, not a raw InfoWindow. The card renders
 * the marker's own fields by default, or whatever the host's `[dsMapDetail]`
 * template makes of `marker.data`.
 *
 * **No key, no problem, no lying.** Without a configured key (tests, CI,
 * prototypes) the organism runs {@link mockMapAdapter}: a token-styled plate
 * with real projected, focusable pins and a visible "Preview map" watermark.
 * Selection, the detail card and search-to-jump behave identically — the
 * engine is a seam ({@link MapAdapter}), the Upload adapter's bargain again.
 *
 * Optional search composes `ds-search-field`: a query first tries the markers
 * themselves (jump + select), then the adapter's geocoder (pan), and says out
 * loud which of the three things happened.
 *
 * @example
 * ```html
 * <ds-map-viewer [markers]="studios" [(selected)]="selectedId" [searchable]="true">
 *   <ng-template dsMapDetail let-marker>
 *     <ds-badge tone="success">{{ marker.data.status }}</ds-badge>
 *     <ds-button size="sm" (clicked)="book(marker)">Book a visit</ds-button>
 *   </ng-template>
 * </ds-map-viewer>
 * ```
 */
@Component({
  selector: 'ds-map-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    IconComponent,
    ButtonComponent,
    SpinnerComponent,
    AlertComponent,
    SearchFieldComponent,
  ],
  template: `
    <div class="ds-map" role="region" [attr.aria-label]="label()" (keydown.escape)="closeDetail()">
      @if (searchable()) {
        <ds-search-field
          class="ds-map__search"
          [label]="searchLabel()"
          [labelHidden]="true"
          [placeholder]="searchPlaceholder()"
          [debounce]="0"
          [loading]="searching()"
          (submitted)="onSearch($event)"
        />
      }

      <div class="ds-map__viewport" [style.height]="height()">
        <div #canvas class="ds-map__canvas"></div>

        @if (status() === 'loading') {
          <div class="ds-map__overlay">
            <ds-spinner size="lg" [label]="loadingLabel()" />
          </div>
        } @else if (status() === 'error') {
          <div class="ds-map__overlay">
            <ds-alert tone="danger" live="polite" title="The map could not load">
              {{ error() }}
            </ds-alert>
          </div>
        }

        <!-- The Paint detail card. Not an InfoWindow; never will be. -->
        @if (selectedMarker(); as marker) {
          <div class="ds-map__detail" role="group" [attr.aria-labelledby]="detailTitleId">
            <div class="ds-map__detail-header">
              @if (marker.icon) {
                <span class="ds-map__detail-icon" aria-hidden="true">
                  <ds-icon [name]="marker.icon" size="sm" />
                </span>
              }
              <div class="ds-map__detail-titles">
                <p class="ds-map__detail-title" [id]="detailTitleId">{{ marker.label }}</p>
                @if (marker.description) {
                  <p class="ds-map__detail-description">{{ marker.description }}</p>
                }
              </div>
              <ds-button
                class="ds-map__detail-close"
                variant="ghost"
                size="sm"
                iconStart="close"
                [label]="closeLabel()"
                (clicked)="closeDetail()"
              />
            </div>

            @if (detailTemplate(); as detail) {
              <div class="ds-map__detail-body">
                <ng-container
                  [ngTemplateOutlet]="detail.template"
                  [ngTemplateOutletContext]="{ $implicit: marker }"
                />
              </div>
            } @else {
              <p class="ds-map__detail-coords">
                {{ marker.position.lat.toFixed(4) }}, {{ marker.position.lng.toFixed(4) }}
              </p>
            }
          </div>
        }
      </div>

      <!-- Which of the three things the search did, for ears. -->
      <span class="visually-hidden ds-map__announce" aria-live="polite">{{ announcement() }}</span>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .ds-map {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-2_5);
    }

    .ds-map__search {
      max-width: 22rem;
    }

    .ds-map__viewport {
      position: relative;
      border: 1px solid var(--ds-color-border);
      border-radius: var(--ds-radius-lg);
      overflow: hidden;
      background: var(--ds-color-surface-sunken);
    }

    .ds-map__canvas {
      position: absolute;
      inset: 0;
    }

    .ds-map__overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--ds-space-4);
      background: color-mix(in srgb, var(--ds-color-surface) 72%, transparent);
    }

    .ds-map__detail {
      position: absolute;
      inset-block-end: var(--ds-space-3);
      inset-inline-start: var(--ds-space-3);
      width: min(20rem, calc(100% - var(--ds-space-6)));
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-2);
      padding: var(--ds-space-3) var(--ds-space-3_5);
      background: var(--ds-color-surface);
      border: 1px solid var(--ds-color-border);
      border-radius: var(--ds-radius-lg);
      box-shadow: var(--ds-shadow-lg);
      animation: ds-map-detail-in 140ms ease-out;
    }

    .ds-map__detail-header {
      display: flex;
      align-items: flex-start;
      gap: var(--ds-space-2_5);
    }

    .ds-map__detail-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.9rem;
      height: 1.9rem;
      flex-shrink: 0;
      border-radius: var(--ds-radius-md);
      background: var(--ds-color-primary-muted);
      color: var(--ds-color-primary);
    }

    .ds-map__detail-titles {
      flex: 1 1 auto;
      min-width: 0;
    }

    .ds-map__detail-title {
      margin: 0;
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-semibold);
      color: var(--ds-color-text);
    }

    .ds-map__detail-description {
      margin: 0.1rem 0 0;
      font-size: var(--ds-font-size-xs);
      color: var(--ds-color-text-muted);
    }

    .ds-map__detail-close {
      flex-shrink: 0;
      margin: calc(var(--ds-space-1) * -1) calc(var(--ds-space-1) * -1) 0 0;
    }

    .ds-map__detail-body {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-2);
      align-items: flex-start;
    }

    .ds-map__detail-coords {
      margin: 0;
      font-family: var(--ds-font-mono);
      font-size: var(--ds-font-size-xs);
      color: var(--ds-color-text-subtle);
    }

    @keyframes ds-map-detail-in {
      from {
        opacity: 0;
        transform: translateY(0.35rem);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ds-map__detail {
        animation: none;
      }
    }
  `,
})
export class MapViewerComponent implements AfterViewInit {
  private readonly mapsConfig = inject(MAPS_CONFIG);
  private readonly document = inject(DOCUMENT);

  /** The pins. Changing the array re-pins the map; ids keep selection stable. */
  readonly markers = input.required<readonly MapMarker[]>();
  /** The selected marker's id. Two-way bindable. */
  readonly selected = model<string | null>(null);

  /** Initial camera, used when `fitToMarkers` is off or there are no pins. */
  readonly center = input<MapCoordinates | null>(null);
  readonly zoom = input(4);
  /** Open looking at all the pins, which is what a map of pins is for. */
  readonly fitToMarkers = input(true);

  /** The `ds-search-field` above the map: markers first, then the geocoder. */
  readonly searchable = input(false);
  readonly height = input<string>('24rem');
  readonly label = input<string>('Map');
  readonly searchLabel = input<string>('Search places');
  readonly searchPlaceholder = input<string>('Search places…');
  readonly loadingLabel = input<string>('Loading map…');
  readonly closeLabel = input<string>('Close detail');

  /**
   * The engine. Defaults to Google when `provideMaps` configured a key, and
   * to the mock plate when it did not — tests pass their own.
   */
  readonly adapter = input<MapAdapter | null>(null);

  /** A pin was selected, by click or by search. */
  readonly markerSelect = output<MapMarker>();
  /** The geocoder resolved a free-text query and the camera moved. */
  readonly placeFound = output<{ query: string; position: MapCoordinates }>();
  /** Neither the markers nor the geocoder knew the place. */
  readonly searchMissed = output<string>();

  protected readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly error = signal('');
  protected readonly searching = signal(false);
  protected readonly announcement = signal('');
  protected readonly detailTitleId = uniqueId('ds-map-detail');

  protected readonly detailTemplate = contentChild(MapDetailDirective);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLElement>>('canvas');

  private readonly handle = signal<MapHandle | null>(null);
  /** What the engine actually runs — resolved once, reported to tests. */
  engineKind = '';

  protected readonly selectedMarker = computed(
    () => this.markers().find((marker) => marker.id === this.selected()) ?? null,
  );

  constructor() {
    // Pins and selection land on the engine whenever either changes.
    effect(() => {
      const handle = this.handle();
      if (handle) {
        handle.setMarkers(this.markers(), this.selected(), (id) => this.selectById(id));
      }
    });

    inject(DestroyRef).onDestroy(() => this.handle()?.destroy());
  }

  ngAfterViewInit(): void {
    const adapter = this.resolveAdapter();
    this.engineKind = adapter.kind;

    const camera = this.initialCamera();
    adapter
      .create(this.canvasRef().nativeElement, camera)
      .then((handle) => {
        this.handle.set(handle);
        handle.setCamera(camera);
        this.status.set('ready');
      })
      .catch((cause: unknown) => {
        this.error.set(cause instanceof Error ? cause.message : 'Unknown map error.');
        this.status.set('error');
      });
  }

  /** Selects (and pans to) a marker from code — a list beside the map, say. */
  select(id: string): void {
    this.selectById(id);
  }

  protected closeDetail(): void {
    this.selected.set(null);
  }

  /** Markers first, the geocoder second, honesty third. */
  protected async onSearch(query: string): Promise<void> {
    const needle = query.trim().toLowerCase();
    const handle = this.handle();
    if (!needle || !handle) {
      return;
    }

    const marker = this.markers().find((candidate) =>
      candidate.label.toLowerCase().includes(needle),
    );
    if (marker) {
      this.selectById(marker.id);
      this.announcement.set(`Jumped to ${marker.label}.`);
      return;
    }

    this.searching.set(true);
    try {
      const position = await handle.geocode(query);
      if (position) {
        handle.setCamera({ center: position, zoom: 12 }, true);
        this.placeFound.emit({ query, position });
        this.announcement.set(`Moved the map to ${query}.`);
      } else {
        this.searchMissed.emit(query);
        this.announcement.set(`No place found for ${query}.`);
      }
    } finally {
      this.searching.set(false);
    }
  }

  private selectById(id: string): void {
    const marker = this.markers().find((candidate) => candidate.id === id);
    if (!marker) {
      return;
    }

    this.selected.set(id);
    this.markerSelect.emit(marker);
    this.handle()?.panTo(marker.position);
  }

  private resolveAdapter(): MapAdapter {
    const custom = this.adapter();
    if (custom) {
      return custom;
    }
    return this.mapsConfig.apiKey
      ? googleMapsAdapter(this.mapsConfig, this.document)
      : mockMapAdapter(this.document);
  }

  private initialCamera(): MapCamera {
    const markers = this.markers();
    if (this.fitToMarkers() && markers.length > 0) {
      return fitCameraTo(markers.map((marker) => marker.position));
    }
    return {
      center: this.center() ?? { lat: 0, lng: 0 },
      zoom: this.zoom(),
    };
  }
}
