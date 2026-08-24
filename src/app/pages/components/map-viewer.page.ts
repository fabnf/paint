import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  DS_COMPONENTS,
  DS_PRIMITIVES,
  MAPS_CONFIG,
  ToastService,
  type MapMarker,
} from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

interface Studio {
  city: string;
  status: 'Open' | 'Opening soon';
  easel: string;
}

/**
 * MapViewer — documentation page.
 */
@Component({
  selector: 'app-map-viewer-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI],
  templateUrl: './map-viewer.page.html',
  styleUrl: './components-page.scss',
})
export class MapViewerPage {
  private readonly toasts = inject(ToastService);

  /** What engine this page is actually running (no key here → the mock). */
  readonly hasKey = !!inject(MAPS_CONFIG).apiKey;

  readonly selected = signal<string | null>(null);
  readonly lastPlace = signal('');

  readonly studios: readonly MapMarker<Studio>[] = [
    { id: 'ber', position: { lat: 52.52, lng: 13.405 }, label: 'Berlin studio', description: 'Torstraße 99, Mitte', icon: 'palette', data: { city: 'Berlin', status: 'Open', easel: '12 easels' } },
    { id: 'lis', position: { lat: 38.722, lng: -9.139 }, label: 'Lisbon studio', description: 'Rua da Prata 14', icon: 'palette', data: { city: 'Lisbon', status: 'Open', easel: '8 easels' } },
    { id: 'osl', position: { lat: 59.913, lng: 10.752 }, label: 'Oslo studio', description: 'Grünerløkka 3', icon: 'palette', tone: 'accent', data: { city: 'Oslo', status: 'Opening soon', easel: '6 easels' } },
    { id: 'mil', position: { lat: 45.464, lng: 9.19 }, label: 'Milan studio', description: 'Via Tortona 31', icon: 'palette', data: { city: 'Milan', status: 'Open', easel: '10 easels' } },
    { id: 'kra', position: { lat: 50.065, lng: 19.945 }, label: 'Kraków studio', description: 'Kazimierz 7', icon: 'palette', tone: 'success', data: { city: 'Kraków', status: 'Open', easel: '9 easels' } },
  ];

  book(marker: MapMarker<Studio>): void {
    this.toasts.success(`Visit booked at ${marker.data!.city}`, {
      description: 'A confirmation lands in your inbox.',
    });
  }

  onPlaceFound(event: { query: string }): void {
    this.lastPlace.set(event.query);
  }

  readonly basicSnippet = `<!-- app.config.ts — the host supplies the key; Paint never ships one -->
provideMaps({ apiKey: environment.mapsKey });

<!-- No key configured? The same organism runs the mock engine — this page is. -->
<ds-map-viewer [markers]="studios" [(selected)]="selectedId" [searchable]="true">
  <ng-template dsMapDetail let-marker>
    <ds-badge [tone]="marker.data.status === 'Open' ? 'success' : 'warning'">
      {{ marker.data.status }}
    </ds-badge>
    <ds-text variant="bodySm" tone="muted">{{ marker.data.easel }}</ds-text>
    <ds-button size="sm" iconStart="calendar" (clicked)="book(marker)">Book a visit</ds-button>
  </ng-template>
</ds-map-viewer>`;

  readonly adapterSnippet = `// The engine is a seam — the UploadAdapter's bargain, for cartography.
export interface MapAdapter {
  readonly kind: string;
  create(host: HTMLElement, camera: MapCamera): Promise<MapHandle>;
}

// googleMapsAdapter(config) — tiles, Paint-styled basemap, Paint SVG pins,
//                              Geocoder-backed search. Loads the script once,
//                              at runtime, only when actually used.
// mockMapAdapter()           — a token-styled plate with projected, focusable
//                              pins and a "Preview map" watermark. What CI,
//                              tests and keyless hosts get. Never pretends.`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'markers', type: 'MapMarker<T>[]', default: 'required', description: 'The pins: id, position, label, description?, icon?, tone?, data? for the detail template.' },
    { name: 'selected', type: 'model<string | null>', default: 'null', description: 'The selected pin’s id. Two-way; selecting pans to it and opens the card.' },
    { name: 'fitToMarkers', type: 'boolean', default: 'true', description: 'Open looking at all the pins. Off, center/zoom take over.' },
    { name: 'center / zoom', type: 'MapCoordinates / number', default: 'null / 4', description: 'The initial camera when not fitting.' },
    { name: 'searchable', type: 'boolean', default: 'false', description: 'A ds-search-field above the map: markers first, the geocoder second.' },
    { name: 'height', type: 'string', default: `'24rem'`, description: 'The viewport. Maps need one.' },
    { name: 'adapter', type: 'MapAdapter | null', default: 'resolved', description: 'The engine. Defaults to Google with a key, the mock plate without; tests pass their own.' },
    { name: 'label / searchLabel / searchPlaceholder / loadingLabel / closeLabel', type: 'string', default: 'sensible words', description: 'Every string, replaceable.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'markerSelect', type: 'OutputEmitterRef<MapMarker>', default: '—', description: 'A pin was selected, by click or by search.' },
    { name: 'placeFound', type: 'OutputEmitterRef<{ query, position }>', default: '—', description: 'The geocoder resolved a query and the camera moved.' },
    { name: 'searchMissed', type: 'OutputEmitterRef<string>', default: '—', description: 'Neither the markers nor the geocoder knew the place.' },
  ];

  readonly slots: readonly ApiRow[] = [
    { name: '[dsMapDetail]', type: 'ng-template', default: 'coordinates', description: 'The detail card’s body, with the marker as let-marker. The header (icon, label, description, close) is the card’s.' },
  ];
}
