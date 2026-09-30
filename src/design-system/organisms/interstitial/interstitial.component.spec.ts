import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { InterstitialComponent } from './interstitial.component';
import { InterstitialService } from './interstitial.service';
import {
  MemoryInterstitialStore,
  StaticInterstitialSource,
  provideInterstitials,
} from './interstitial.source';
import {
  eligibleItems,
  type InterstitialItem,
  type InterstitialItemEvent,
} from './interstitial.types';

const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';

const CATALOGUE: readonly InterstitialItem[] = [
  {
    id: 'release',
    title: 'Wet Paint 0.4 is here',
    body: 'Twenty-four atoms, and nothing you use has moved.',
    imageSrc: PIXEL,
    imageAlt: 'A violet wash',
    learnMoreHref: '/changelog',
    learnMoreLabel: 'See what shipped',
  },
  { id: 'packs', title: 'Your brand, our components', learnMoreLink: '/brand-packs' },
  { id: 'keys', title: 'Every control, from the keyboard', body: 'One place per key.' },
];

describe('eligibleItems', () => {
  it('drops what has been seen and what has been dismissed', () => {
    expect(eligibleItems(CATALOGUE, [], []).length).toBe(3);
    expect(eligibleItems(CATALOGUE, ['release'], []).map((item) => item.id)).toEqual([
      'packs',
      'keys',
    ]);
    expect(eligibleItems(CATALOGUE, [], ['packs']).map((item) => item.id)).toEqual([
      'release',
      'keys',
    ]);
    expect(eligibleItems(CATALOGUE, ['release'], ['packs', 'keys']).length).toBe(0);
  });
});

describe('InterstitialService', () => {
  let source: StaticInterstitialSource;
  let store: MemoryInterstitialStore;
  let service: InterstitialService;

  beforeEach(() => {
    source = new StaticInterstitialSource(CATALOGUE);
    store = new MemoryInterstitialStore();
    TestBed.configureTestingModule({
      providers: [provideInterstitials({ source, store })],
    });
    service = TestBed.inject(InterstitialService);
  });

  it('loads the catalogue and applies the rule', async () => {
    const eligible = await service.load();
    expect(eligible.length).toBe(3);
    expect(service.catalogue().length).toBe(3);
    expect(service.loading()).toBeFalse();
    expect(service.error()).toBe('');
  });

  it('never offers a dismissed item again, across loads', async () => {
    await service.load();
    service.markDismissed('packs');
    expect(service.eligible().map((item) => item.id)).toEqual(['release', 'keys']);
    expect(source.dismissedReports).toEqual(['packs']);

    await service.load();
    expect(service.eligible().map((item) => item.id)).toEqual(['release', 'keys']);
  });

  it('never offers a seen item again, and reports it', async () => {
    await service.load();
    service.markSeen('release');
    await service.load();
    expect(service.eligible().map((item) => item.id)).toEqual(['packs', 'keys']);
    expect(source.seenReports).toEqual(['release']);
  });

  it('publishes the records, and can forget them', async () => {
    await service.load();
    service.markSeen('release');
    service.markDismissed('packs');
    expect(service.records()).toEqual({ seen: ['release'], dismissed: ['packs'] });

    service.reset();
    expect(service.eligible().length).toBe(3);
  });

  it('survives a failing load: no items, an error, and the page carries on', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideInterstitials({
          source: {
            load: () => Promise.reject(new Error('502 from the content API')),
          },
          store: new MemoryInterstitialStore(),
        }),
      ],
    });
    const failing = TestBed.inject(InterstitialService);

    expect(await failing.load()).toEqual([]);
    expect(failing.error()).toContain('502');
    expect(failing.loading()).toBeFalse();
  });
});

@Component({
  standalone: true,
  imports: [InterstitialComponent],
  template: `
    <button type="button" id="trigger" (click)="open.set(true)">Show</button>
    <ds-interstitial
      [items]="items()"
      [(open)]="open"
      (seen)="seen.push($event)"
      (dismissed)="dismissed.push($event)"
      (learnMore)="learned.push($event)"
      (closed)="reasons.push($event)"
    />
  `,
})
class HostComponent {
  readonly items = signal<readonly InterstitialItem[]>(CATALOGUE);
  readonly open = signal(false);
  seen: InterstitialItemEvent[] = [];
  dismissed: InterstitialItemEvent[] = [];
  learned: InterstitialItemEvent[] = [];
  reasons: string[] = [];
}

describe('InterstitialComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);
  const viewer = () => query<HTMLElement>('[role="dialog"]');
  const title = () => query('.ds-interstitial__title')?.textContent?.trim() ?? '';
  const dismissButton = () => query<HTMLButtonElement>('.ds-interstitial__actions button')!;
  const learnLink = () => query<HTMLAnchorElement>('.ds-interstitial__learn a');

  const flush = () => new Promise<void>((resolve) => queueMicrotask(() => resolve()));
  const show = async () => {
    query<HTMLButtonElement>('#trigger')!.focus();
    host.open.set(true);
    fixture.detectChanges();
    await flush();
    fixture.detectChanges();
  };
  const keydown = (key: string) => {
    viewer()!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    host.open.set(false);
    fixture.detectChanges();
  });

  it('renders nothing at all until it is opened', () => {
    expect(viewer()).toBeNull();
    expect(query('ds-gallery')).toBeTruthy();
    expect(query('.ds-gallery__items')).toBeNull();
  });

  it('renders nothing at all when no item is eligible', async () => {
    host.items.set([]);
    await show();
    expect(viewer()).toBeNull();
    expect(query('ds-gallery')).toBeNull();
  });

  it('opens as the Gallery’s modal viewer, with no thumbnails on the page', async () => {
    await show();

    expect(viewer()!.getAttribute('aria-modal')).toBe('true');
    expect(viewer()!.getAttribute('aria-label')).toBe('Announcement — slideshow');
    expect(query('.ds-gallery__items')).toBeNull();
    expect(document.activeElement).toBe(viewer());
    expect(query('#trigger')!.closest('[inert]')).toBeTruthy();
  });

  it('shows the item’s picture, title, body and actions — a figure, not a card', async () => {
    await show();

    expect(title()).toBe('Wet Paint 0.4 is here');
    expect(query('.ds-interstitial__body')!.textContent).toContain('nothing you use has moved');
    expect(query<HTMLImageElement>('.ds-interstitial__image img')!.getAttribute('alt')).toBe(
      'A violet wash',
    );
    expect(learnLink()!.getAttribute('href')).toBe('/changelog');
    expect(learnLink()!.textContent).toContain('See what shipped');
  });

  it('marks the shown item seen, once', async () => {
    await show();
    expect(host.seen.map((event) => event.item.id)).toEqual(['release']);

    keydown('ArrowRight');
    keydown('ArrowLeft');
    expect(host.seen.map((event) => event.item.id)).toEqual(['release', 'packs']);
  });

  describe('several eligible items', () => {
    beforeEach(async () => {
      await show();
    });

    it('moves through the set with the Gallery’s keyboard and counter', () => {
      expect(query('.ds-gallery__position')!.textContent).toContain('1 of 3');
      keydown('ArrowRight');
      expect(title()).toBe('Your brand, our components');
      expect(query('.ds-gallery__position')!.textContent).toContain('2 of 3');
      keydown('End');
      expect(title()).toBe('Every control, from the keyboard');
      expect(fixture.nativeElement.querySelectorAll('.ds-gallery__dot').length).toBe(3);
    });

    it('dismisses one item and stays open on the next', () => {
      dismissButton().click();
      fixture.detectChanges();

      expect(host.dismissed.map((event) => event.item.id)).toEqual(['release']);
      expect(viewer()).toBeTruthy();
      expect(title()).toBe('Your brand, our components');
      expect(fixture.nativeElement.querySelectorAll('.ds-gallery__dot').length).toBe(2);
    });

    it('steps back before dropping the last slide, so the deck never runs past its end', () => {
      keydown('End');
      expect(title()).toBe('Every control, from the keyboard');

      dismissButton().click();
      fixture.detectChanges();
      expect(viewer()).toBeTruthy();
      expect(title()).toBe('Your brand, our components');
    });

    it('closes when the last one is dismissed, and gives focus back', () => {
      dismissButton().click();
      fixture.detectChanges();
      dismissButton().click();
      fixture.detectChanges();
      dismissButton().click();
      fixture.detectChanges();

      expect(host.dismissed.length).toBe(3);
      expect(viewer()).toBeNull();
      expect(host.open()).toBeFalse();
      expect(host.reasons).toEqual(['dismiss']);
      expect(document.activeElement).toBe(query('#trigger'));
    });
  });

  it('one eligible item opens alone, with no position and no dots', async () => {
    host.items.set([CATALOGUE[2]]);
    await show();

    expect(viewer()).toBeTruthy();
    expect(title()).toBe('Every control, from the keyboard');
    expect(query('.ds-gallery__position')!.textContent!.trim()).toBe('');
    expect(fixture.nativeElement.querySelectorAll('.ds-gallery__dot').length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.ds-gallery__nav').length).toBe(0);
  });

  it('treats learn more as seen, and closes on the way out', async () => {
    await show();
    // The click is dispatched on the wrapper rather than the anchor: the anchor
    // really does navigate, and a spec is not the place to leave the page.
    query('.ds-interstitial__learn')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(host.learned.map((event) => event.item.id)).toEqual(['release']);
    expect(host.reasons).toEqual(['learn-more']);
    expect(host.open()).toBeFalse();
    expect(viewer()).toBeNull();
  });

  it('closes on Escape, reporting the reason', async () => {
    await show();
    keydown('Escape');
    expect(viewer()).toBeNull();
    expect(host.open()).toBeFalse();
    expect(host.reasons).toEqual(['escape']);
  });

  it('closes from code', async () => {
    await show();
    const interstitial = fixture.debugElement.children[1].componentInstance as InterstitialComponent;
    interstitial.close();
    fixture.detectChanges();
    expect(viewer()).toBeNull();
    expect(host.reasons).toEqual(['api']);
  });

  it('reports every event once per item, with its index', async () => {
    await show();
    keydown('ArrowRight');
    expect(host.seen.map((event) => event.index)).toEqual([0, 1]);
  });
});
