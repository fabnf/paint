import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { googleMapsAdapter, mapsScriptUrl } from './google-maps.adapter';
import { MapDetailDirective } from './map-detail.directive';
import { MapViewerComponent } from './map-viewer.component';
import {
  fitCameraTo,
  type MapAdapter,
  type MapCamera,
  type MapCoordinates,
  type MapMarker,
} from './map.types';

const MARKERS: readonly MapMarker<{ status: string }>[] = [
  { id: 'ber', position: { lat: 52.52, lng: 13.405 }, label: 'Berlin studio', description: 'Mitte', icon: 'palette', data: { status: 'open' } },
  { id: 'lis', position: { lat: 38.72, lng: -9.14 }, label: 'Lisbon studio', tone: 'accent', data: { status: 'open' } },
  { id: 'osl', position: { lat: 59.91, lng: 10.75 }, label: 'Oslo studio', tone: 'success', data: { status: 'closed' } },
];

/** An engine the test drives by hand: no tiles, no DOM, just a ledger. */
class SpyAdapter implements MapAdapter {
  readonly kind = 'spy';
  cameras: Array<{ camera: MapCamera; animate?: boolean }> = [];
  pans: MapCoordinates[] = [];
  geocodeResult: MapCoordinates | null = null;
  geocodeQueries: string[] = [];
  destroyed = false;

  async create(_host: HTMLElement, _camera: MapCamera) {
    return {
      setCamera: (camera: MapCamera, animate?: boolean) => this.cameras.push({ camera, animate }),
      panTo: (position: MapCoordinates) => this.pans.push(position),
      setMarkers: () => undefined,
      geocode: async (query: string) => {
        this.geocodeQueries.push(query);
        return this.geocodeResult;
      },
      destroy: () => (this.destroyed = true),
    };
  }
}

describe('map arithmetic', () => {
  it('fits a camera around the pins', () => {
    const camera = fitCameraTo(MARKERS.map((m) => m.position));
    expect(camera.center.lng).toBeCloseTo((13.405 - 9.14) / 2, 2);
    expect(camera.zoom).toBeGreaterThanOrEqual(3);
    expect(camera.zoom).toBeLessThanOrEqual(5);
  });

  it('one pin gets a close look; none gets the fallback', () => {
    expect(fitCameraTo([{ lat: 1, lng: 2 }])).toEqual({ center: { lat: 1, lng: 2 }, zoom: 12 });
    expect(fitCameraTo([]).zoom).toBe(2);
  });
});

describe('google maps loader plumbing', () => {
  it('builds the loader URL from the host config, key and all', () => {
    const url = mapsScriptUrl({ apiKey: 'HOST-KEY', libraries: ['places'], language: 'de' });
    expect(url).toContain('https://maps.googleapis.com/maps/api/js?');
    expect(url).toContain('key=HOST-KEY');
    expect(url).toContain('libraries=places');
    expect(url).toContain('language=de');
  });

  it('is the engine a configured key selects', () => {
    expect(googleMapsAdapter({ apiKey: 'x' }).kind).toBe('google');
  });
});

describe('MapViewerComponent (mock engine — the CI path)', () => {
  @Component({
    standalone: true,
    imports: [MapViewerComponent, MapDetailDirective],
    template: `
      <ds-map-viewer
        [markers]="markers()"
        [(selected)]="selected"
        [searchable]="true"
        label="Studios map"
        (markerSelect)="selections.push($event.id)"
        (placeFound)="found.push($event.query)"
        (searchMissed)="missed.push($event)"
      >
        @if (withTemplate()) {
          <ng-template dsMapDetail let-marker>
            <span id="custom-detail">status: {{ marker.data.status }}</span>
          </ng-template>
        }
      </ds-map-viewer>
    `,
    })
  class HostComponent {
    readonly markers = signal(MARKERS);
    readonly selected = signal<string | null>(null);
    readonly withTemplate = signal(false);
    selections: string[] = [];
    found: string[] = [];
    missed: string[] = [];
  }

  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const settle = async () => {
    // The adapter's create() is a promise; let it land, then re-render.
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  };
  const query = <E extends HTMLElement>(selector: string): E | null =>
    fixture.nativeElement.querySelector(selector);
  const pins = (): HTMLButtonElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.ds-map-mock__pin'));
  const pin = (id: string): HTMLButtonElement =>
    pins().find((p) => p.dataset['markerId'] === id)!;
  const detail = (): HTMLElement | null => query('.ds-map__detail');

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await settle();
  });

  it('runs the mock engine when no key is configured, and says so', () => {
    const viewer = fixture.debugElement.children[0].componentInstance as MapViewerComponent;
    expect(viewer.engineKind).toBe('mock');
    expect(query('[data-map-mock]')).toBeTruthy();
    expect(query('.ds-map-mock__watermark')!.textContent).toContain('Preview map');
    expect(query('.ds-map')!.getAttribute('aria-label')).toBe('Studios map');
  });

  it('projects one named, focusable pin per marker', () => {
    expect(pins().length).toBe(3);
    expect(pin('ber').getAttribute('aria-label')).toBe('Berlin studio');
    expect(pin('lis').dataset['tone']).toBe('accent');
    // Fitted camera: Berlin (east) sits right of Lisbon (west). The browser
    // serialises the offset as calc(50% ± Npx), so read the sign out loud.
    const left = (p: HTMLElement) => {
      const match = p.style.left.match(/calc\(50% ([+-]) ([\d.]+)px\)/)!;
      return (match[1] === '-' ? -1 : 1) * parseFloat(match[2]);
    };
    expect(left(pin('ber'))).toBeGreaterThan(left(pin('lis')));
  });

  it('selecting a pin shows the Paint detail card — no InfoWindow anywhere', async () => {
    pin('ber').click();
    await settle();

    expect(host.selected()).toBe('ber');
    expect(host.selections).toEqual(['ber']);
    expect(pin('ber').dataset['selected']).toBe('');
    expect(pin('ber').getAttribute('aria-pressed')).toBe('true');

    const card = detail()!;
    expect(card.getAttribute('role')).toBe('group');
    expect(card.textContent).toContain('Berlin studio');
    expect(card.textContent).toContain('Mitte');
    // Default body: the coordinates, since no template was given.
    expect(card.querySelector('.ds-map__detail-coords')!.textContent).toContain('52.5200');
    expect(fixture.nativeElement.querySelector('.gm-style-iw')).toBeNull();
  });

  it('renders the host template inside the card, with the marker as context', async () => {
    host.withTemplate.set(true);
    fixture.detectChanges();

    pin('osl').click();
    await settle();

    expect(query('#custom-detail')!.textContent).toContain('status: closed');
    expect(query('.ds-map__detail-coords')).toBeNull();
  });

  it('the card closes from its button, from Escape, and from outside', async () => {
    pin('ber').click();
    await settle();
    (detail()!.querySelector('ds-button button') as HTMLElement).click();
    fixture.detectChanges();
    expect(detail()).toBeNull();
    expect(host.selected()).toBeNull();

    pin('ber').click();
    await settle();
    query('.ds-map')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    fixture.detectChanges();
    expect(detail()).toBeNull();

    // Two-way: the host clearing the model clears the card.
    pin('ber').click();
    await settle();
    host.selected.set(null);
    fixture.detectChanges();
    expect(detail()).toBeNull();
  });

  it('search jumps to a matching marker and selects it', async () => {
    const input = query<HTMLInputElement>('ds-search-field input')!;
    input.value = 'lisbon';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await settle();

    expect(host.selected()).toBe('lis');
    expect(detail()!.textContent).toContain('Lisbon studio');
    expect(query('.ds-map__announce')!.textContent).toContain('Jumped to Lisbon studio.');
    // The mock camera recentred onto Lisbon.
    expect(query('[data-map-mock]')!.dataset['center']).toContain('38.72');
  });

  it('a place nobody knows is said out loud, not swallowed', async () => {
    const input = query<HTMLInputElement>('ds-search-field input')!;
    input.value = 'atlantis';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await settle();
    await settle();

    expect(host.missed).toEqual(['atlantis']);
    expect(query('.ds-map__announce')!.textContent).toContain('No place found for atlantis.');
    expect(host.selected()).toBeNull();
  });
});

describe('MapViewerComponent (custom engine)', () => {
  @Component({
    standalone: true,
    imports: [MapViewerComponent],
    template: `
      <ds-map-viewer
        [markers]="markers"
        [adapter]="adapter"
        [searchable]="true"
        (placeFound)="found.push($event)"
      />
    `,
  })
  class SpyHostComponent {
    readonly markers = MARKERS;
    readonly adapter = new SpyAdapter();
    found: Array<{ query: string; position: MapCoordinates }> = [];
  }

  let fixture: ComponentFixture<SpyHostComponent>;
  let host: SpyHostComponent;

  const settle = async () => {
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SpyHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(SpyHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await settle();
  });

  it('a supplied adapter outranks the configured default', () => {
    const viewer = fixture.debugElement.children[0].componentInstance as MapViewerComponent;
    expect(viewer.engineKind).toBe('spy');
    // Initial camera: fitted to the markers, handed to the engine.
    expect(host.adapter.cameras.length).toBe(1);
    expect(host.adapter.cameras[0].camera.zoom).toBeGreaterThan(1);
  });

  it('a geocoder hit pans the camera and reports the place', async () => {
    host.adapter.geocodeResult = { lat: 48.86, lng: 2.35 };

    const input = fixture.nativeElement.querySelector('ds-search-field input') as HTMLInputElement;
    input.value = 'paris';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await settle();
    await settle();

    expect(host.adapter.geocodeQueries).toEqual(['paris']);
    const jump = host.adapter.cameras[host.adapter.cameras.length - 1];
    expect(jump.camera.center.lat).toBe(48.86);
    expect(jump.animate).toBeTrue();
    expect(host.found[0].query).toBe('paris');
  });

  it('selecting from code pans without touching the zoom', async () => {
    const viewer = fixture.debugElement.children[0].componentInstance as MapViewerComponent;
    viewer.select('osl');
    await settle();

    expect(host.adapter.pans).toEqual([{ lat: 59.91, lng: 10.75 }]);
  });

  it('destroys its engine with itself', () => {
    fixture.destroy();
    expect(host.adapter.destroyed).toBeTrue();
  });
});
