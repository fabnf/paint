import type { IconName } from '../../icons';
import type { Tone } from '../../primitives/tone.types';

/** A point on the planet. Degrees, WGS84 — the only coordinates anyone has. */
export interface MapCoordinates {
  readonly lat: number;
  readonly lng: number;
}

/** Where the map is looking, and how closely. */
export interface MapCamera {
  readonly center: MapCoordinates;
  /** Web-map zoom: 0 is the whole world, ~18 is a doorstep. */
  readonly zoom: number;
}

/**
 * One pin. `data` carries whatever the host's detail template wants to show —
 * the organism never reads it.
 */
export interface MapMarker<T = unknown> {
  readonly id: string;
  readonly position: MapCoordinates;
  /** The pin's name: its tooltip, its accessible name, the search's target. */
  readonly label: string;
  /** The default detail card's second line. */
  readonly description?: string;
  /** Shown in the default detail card, not on the pin. */
  readonly icon?: IconName;
  /** The pin's paint. Status pins exist; most pins are `primary`. */
  readonly tone?: Tone;
  readonly data?: T;
}

/**
 * The engine seam — the UploadAdapter's bargain, for cartography.
 *
 * The organism owns the markers, the selection, the detail card and the
 * search flow; the adapter owns the tiles. `googleMapsAdapter()` wraps the
 * Google Maps JS API behind the host's key; `mockMapAdapter()` renders a
 * token-styled projection with no network at all — which is what the tests,
 * CI, and any host without a key get. Same organism either way.
 */
export interface MapAdapter {
  /** For chrome decisions ("Preview map" watermark) and tests. */
  readonly kind: string;
  /** Builds a map inside `host`, looking at `camera`. */
  create(host: HTMLElement, camera: MapCamera): Promise<MapHandle>;
}

/** A live map, reduced to what the organism actually asks of one. */
export interface MapHandle {
  /** Move the camera. `animate` pans; otherwise it jumps. */
  setCamera(camera: MapCamera, animate?: boolean): void;
  /** Re-centre without touching the zoom — what selecting a pin does. */
  panTo(position: MapCoordinates): void;
  /** Replace the pins. The selected one wears the accent. */
  setMarkers(
    markers: readonly MapMarker[],
    selectedId: string | null,
    onSelect: (id: string) => void,
  ): void;
  /** Resolve a free-text place, or `null`. The mock has no gazetteer. */
  geocode(query: string): Promise<MapCoordinates | null>;
  destroy(): void;
}

/**
 * A camera that shows every position with room to breathe.
 *
 * Pure and approximate on purpose: both adapters use it for the initial fit,
 * and a unit test should not need tiles to check arithmetic.
 */
export function fitCameraTo(
  positions: readonly MapCoordinates[],
  fallback: MapCamera = { center: { lat: 0, lng: 0 }, zoom: 2 },
): MapCamera {
  if (positions.length === 0) {
    return fallback;
  }

  const lats = positions.map((p) => p.lat);
  const lngs = positions.map((p) => p.lng);
  const center: MapCoordinates = {
    lat: (Math.min(...lats) + Math.max(...lats)) / 2,
    lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
  };

  if (positions.length === 1) {
    return { center, zoom: 12 };
  }

  // Span → zoom: each zoom level halves the visible degrees. Latitude weighs
  // double because the viewport is wider than it is tall, roughly everywhere.
  const span = Math.max(
    Math.max(...lngs) - Math.min(...lngs),
    (Math.max(...lats) - Math.min(...lats)) * 2,
    0.01,
  );
  const zoom = Math.floor(Math.log2(360 / span));
  return { center, zoom: Math.max(1, Math.min(15, zoom)) };
}
