import type { MapAdapter, MapCamera, MapCoordinates, MapHandle, MapMarker } from './map.types';

/**
 * The keyless map: a token-styled plate with real, projected, *focusable*
 * pins — no tiles, no network, no Google.
 *
 * This is not only a test double. It is what the organism renders for any
 * host that has not configured an API key (and therefore what CI gets), so it
 * behaves like a map where the organism cares: pins sit where their
 * coordinates say, selection restyles them, the camera pans and zooms. It
 * draws a graticule instead of streets and says "Preview map" out loud,
 * because a mock that pretends to be cartography is a lie with a legend.
 *
 * Pins are `<button>`s: on this adapter, every marker is keyboard-reachable
 * and named — which also makes the organism's behaviour fully testable.
 */
export function mockMapAdapter(doc: Document = document): MapAdapter {
  return {
    kind: 'mock',

    async create(host: HTMLElement, camera: MapCamera): Promise<MapHandle> {
      ensureMockStyles(doc);

      const plate = doc.createElement('div');
      plate.className = 'ds-map-mock';
      plate.setAttribute('data-map-mock', '');

      const pinLayer = doc.createElement('div');
      pinLayer.className = 'ds-map-mock__pins';

      const watermark = doc.createElement('span');
      watermark.className = 'ds-map-mock__watermark';
      watermark.textContent = 'Preview map — no API key';

      plate.append(pinLayer, watermark);
      host.replaceChildren(plate);

      let current: MapCamera = camera;
      let lastMarkers: readonly MapMarker[] = [];
      let lastSelected: string | null = null;
      let lastOnSelect: (id: string) => void = () => undefined;

      /** Equirectangular-ish: good enough for a plate with no tiles. */
      const project = (position: MapCoordinates) => {
        const pixelsPerDegree = (Math.pow(2, current.zoom) * 256) / 360;
        const x = (position.lng - current.center.lng) * pixelsPerDegree;
        const y = -(position.lat - current.center.lat) * pixelsPerDegree * 1.4;
        return { x, y };
      };

      const render = () => {
        plate.dataset['zoom'] = String(current.zoom);
        plate.dataset['center'] = `${current.center.lat.toFixed(4)},${current.center.lng.toFixed(4)}`;

        pinLayer.replaceChildren(
          ...lastMarkers.map((marker) => {
            const { x, y } = project(marker.position);
            const selected = marker.id === lastSelected;

            const pin = doc.createElement('button');
            pin.type = 'button';
            pin.className = 'ds-map-mock__pin';
            pin.dataset['markerId'] = marker.id;
            pin.dataset['tone'] = marker.tone ?? 'primary';
            if (selected) {
              pin.dataset['selected'] = '';
            }
            pin.setAttribute('aria-label', marker.label);
            pin.setAttribute('aria-pressed', selected ? 'true' : 'false');
            pin.title = marker.label;
            pin.style.left = `calc(50% + ${x}px)`;
            pin.style.top = `calc(50% + ${y}px)`;
            pin.addEventListener('click', () => lastOnSelect(marker.id));
            return pin;
          }),
        );
      };

      return {
        setCamera(next: MapCamera): void {
          current = next;
          render();
        },

        panTo(position: MapCoordinates): void {
          current = { ...current, center: position };
          render();
        },

        setMarkers(markers, selectedId, onSelect): void {
          lastMarkers = markers;
          lastSelected = selectedId;
          lastOnSelect = onSelect;
          render();
        },

        // No tiles, no gazetteer: the organism's marker-label search still
        // works above this, which is all a preview map owes anyone.
        async geocode(): Promise<MapCoordinates | null> {
          return null;
        },

        destroy(): void {
          host.replaceChildren();
        },
      };
    },
  };
}

/**
 * The mock's stylesheet, injected once. The adapter builds its DOM outside
 * Angular's view (the way AG Grid does), so scoped component styles cannot
 * reach it — it carries its own, written entirely in Paint tokens.
 */
function ensureMockStyles(doc: Document): void {
  if (doc.getElementById('ds-map-mock-styles')) {
    return;
  }

  const style = doc.createElement('style');
  style.id = 'ds-map-mock-styles';
  style.textContent = `
    .ds-map-mock {
      position: absolute;
      inset: 0;
      overflow: hidden;
      background-color: var(--ds-color-surface-sunken);
      /* A graticule, not streets: a mock that fakes cartography is a lie. */
      background-image:
        linear-gradient(var(--ds-color-border) 1px, transparent 1px),
        linear-gradient(90deg, var(--ds-color-border) 1px, transparent 1px);
      background-size: 48px 48px;
      background-position: center;
    }

    .ds-map-mock__pins {
      position: absolute;
      inset: 0;
    }

    .ds-map-mock__pin {
      position: absolute;
      width: 1.25rem;
      height: 1.25rem;
      margin: -0.625rem 0 0 -0.625rem;
      padding: 0;
      border: 2px solid var(--ds-color-surface);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      background: var(--ds-tone, var(--ds-color-primary));
      box-shadow: var(--ds-shadow-sm);
      cursor: pointer;
      transition: width 120ms ease, height 120ms ease, margin 120ms ease;
    }

    .ds-map-mock__pin[data-tone='accent'] { --ds-tone: var(--ds-color-accent); }
    .ds-map-mock__pin[data-tone='success'] { --ds-tone: var(--ds-color-success); }
    .ds-map-mock__pin[data-tone='warning'] { --ds-tone: var(--ds-color-warning); }
    .ds-map-mock__pin[data-tone='danger'] { --ds-tone: var(--ds-color-danger); }
    .ds-map-mock__pin[data-tone='info'] { --ds-tone: var(--ds-color-info); }
    .ds-map-mock__pin[data-tone='neutral'] { --ds-tone: var(--ds-color-text-muted); }

    .ds-map-mock__pin[data-selected] {
      width: 1.65rem;
      height: 1.65rem;
      margin: -0.825rem 0 0 -0.825rem;
      z-index: 2;
      box-shadow: var(--ds-shadow-md);
    }

    .ds-map-mock__pin:focus-visible {
      outline: 2px solid var(--ds-color-focus-ring);
      outline-offset: 2px;
    }

    .ds-map-mock__watermark {
      position: absolute;
      inset-block-end: var(--ds-space-2);
      inset-inline-end: var(--ds-space-2_5);
      padding: 0.1rem 0.5rem;
      border-radius: var(--ds-radius-sm);
      background: color-mix(in srgb, var(--ds-color-surface) 80%, transparent);
      border: 1px solid var(--ds-color-border);
      color: var(--ds-color-text-subtle);
      font-size: var(--ds-font-size-xs);
      pointer-events: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .ds-map-mock__pin {
        transition: none;
      }
    }
  `;
  doc.head.appendChild(style);
}
