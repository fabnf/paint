/// <reference types="google.maps" />
import { InjectionToken } from '@angular/core';
import type { MapAdapter, MapCamera, MapCoordinates, MapHandle, MapMarker } from './map.types';

/**
 * Host-supplied Google Maps configuration. Paint ships no key, ever: the key
 * is a billing relationship between the host and Google.
 */
export interface MapsConfig {
  /** The Google Maps JS API key. Absent → the organism runs the mock adapter. */
  apiKey?: string;
  /** Extra libraries, should a host's detail template need them. */
  libraries?: readonly string[];
  /** Map language/region, forwarded to the loader. */
  language?: string;
  region?: string;
}

export const MAPS_CONFIG = new InjectionToken<MapsConfig>('PAINT_MAPS_CONFIG', {
  providedIn: 'root',
  factory: () => ({}),
});

/**
 * Registers the host's Google Maps key.
 *
 * @example
 * ```ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [provideMaps({ apiKey: environment.mapsKey })],
 * };
 * ```
 */
export function provideMaps(config: MapsConfig): { provide: typeof MAPS_CONFIG; useValue: MapsConfig } {
  return { provide: MAPS_CONFIG, useValue: config };
}

/** The loader URL, pure, so a test can check it without a network. */
export function mapsScriptUrl(config: MapsConfig): string {
  const params = new URLSearchParams({ key: config.apiKey ?? '', v: 'weekly', loading: 'async' });
  if (config.libraries?.length) {
    params.set('libraries', config.libraries.join(','));
  }
  if (config.language) {
    params.set('language', config.language);
  }
  if (config.region) {
    params.set('region', config.region);
  }
  return `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
}

let scriptPromise: Promise<typeof google> | null = null;

/** Injects the Maps script once, however many maps a page mounts. */
function loadGoogleMaps(config: MapsConfig, doc: Document): Promise<typeof google> {
  if (typeof google !== 'undefined' && google.maps) {
    return Promise.resolve(google);
  }

  scriptPromise ??= new Promise<typeof google>((resolve, reject) => {
    const script = doc.createElement('script');
    script.src = mapsScriptUrl(config);
    script.async = true;
    script.onload = () => resolve(google);
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('The Google Maps script failed to load.'));
    };
    doc.head.appendChild(script);
  });

  return scriptPromise;
}

/** Reads a `--ds-*` custom property off the live theme, with a fallback. */
function token(name: string, fallback: string): string {
  if (typeof getComputedStyle === 'undefined') {
    return fallback;
  }
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/**
 * Paint over the basemap: quiet desaturated geometry in the theme's neutrals,
 * so the pins and the data are the loudest things on the canvas. Resolved from
 * the live tokens at create time — a brand pack re-paints the map too.
 */
function paintMapStyles(): google.maps.MapTypeStyle[] {
  const surface = token('--ds-color-surface-sunken', '#f8f7fb');
  const text = token('--ds-color-text-subtle', '#6b6285');
  const border = token('--ds-color-border', '#e0dcea');
  const water = token('--ds-color-primary-muted', '#f4f1ff');

  return [
    { elementType: 'geometry', stylers: [{ color: surface }] },
    { elementType: 'labels.text.fill', stylers: [{ color: text }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: surface }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: border }] },
    { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: water }] },
    { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: border }] },
  ];
}

/** A Paint pin as an SVG data URL — `tone` resolved from the live theme. */
function pinIcon(tone: string, selected: boolean): string {
  const fill = token(`--ds-color-${tone}`, '#6a1bf5');
  const ink = token('--ds-color-surface', '#ffffff');
  const scale = selected ? 1.25 : 1;
  const size = Math.round(36 * scale);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
    <path fill="${fill}" stroke="${ink}" stroke-width="1.25"
      d="M12 2a7 7 0 0 0-7 7c0 4.9 5.4 10.8 6.6 12.1a.55.55 0 0 0 .8 0C13.6 19.8 19 13.9 19 9a7 7 0 0 0-7-7z"/>
    <circle fill="${ink}" cx="12" cy="9" r="2.6"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/**
 * The real thing: Google Maps JS API behind the host's key, wearing Paint's
 * basemap styling and Paint pins. Nothing here imports an SDK — the script
 * loads at runtime, once, and only when this adapter is actually used.
 */
export function googleMapsAdapter(config: MapsConfig, doc: Document = document): MapAdapter {
  return {
    kind: 'google',

    async create(host: HTMLElement, camera: MapCamera): Promise<MapHandle> {
      const g = await loadGoogleMaps(config, doc);

      const map = new g.maps.Map(host, {
        center: camera.center,
        zoom: camera.zoom,
        styles: paintMapStyles(),
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: false,
      });

      let pins: google.maps.Marker[] = [];

      return {
        setCamera(next: MapCamera, animate = false): void {
          if (animate) {
            map.panTo(next.center);
          } else {
            map.setCenter(next.center);
          }
          map.setZoom(next.zoom);
        },

        panTo(position: MapCoordinates): void {
          map.panTo(position);
        },

        setMarkers(
          markers: readonly MapMarker[],
          selectedId: string | null,
          onSelect: (id: string) => void,
        ): void {
          pins.forEach((pin) => pin.setMap(null));
          pins = markers.map((marker) => {
            const selected = marker.id === selectedId;
            const pin = new g.maps.Marker({
              map,
              position: marker.position,
              title: marker.label,
              icon: pinIcon(marker.tone ?? 'primary', selected),
              zIndex: selected ? 2 : 1,
            });
            pin.addListener('click', () => onSelect(marker.id));
            return pin;
          });
        },

        async geocode(query: string): Promise<MapCoordinates | null> {
          const geocoder = new g.maps.Geocoder();
          try {
            const { results } = await geocoder.geocode({ address: query });
            const location = results[0]?.geometry.location;
            return location ? { lat: location.lat(), lng: location.lng() } : null;
          } catch {
            return null;
          }
        },

        destroy(): void {
          pins.forEach((pin) => pin.setMap(null));
          pins = [];
          // The Map has no destroy; releasing the element is the convention.
          host.replaceChildren();
        },
      };
    },
  };
}
