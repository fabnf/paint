import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GalleryComponent } from './gallery.component';
import type { GalleryItem, GalleryItemEvent, GalleryLayout, GalleryThumbSize } from './gallery.types';

const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';

const ITEMS: readonly GalleryItem[] = [
  { id: 'a', src: `${PIXEL}#a`, alt: 'The poster, flat', caption: 'Plate 1', credit: 'Photo: Ada', tags: ['prints'] },
  { id: 'b', src: `${PIXEL}#b`, alt: 'The poster, framed', tags: ['prints', 'rooms'] },
  { id: 'c', src: `${PIXEL}#c`, alt: 'The mug', caption: 'Plate 3', href: 'https://example.com/mug', tags: ['mugs'] },
  { id: 'd', src: `${PIXEL}#d`, alt: 'The tote', thumb: `${PIXEL}#d-thumb`, tags: ['mugs'] },
];

@Component({
  standalone: true,
  imports: [GalleryComponent],
  template: `
    <button type="button" id="outside">Outside</button>
    <ds-gallery
      [items]="items()"
      [label]="label()"
      [layout]="layout()"
      [thumbSize]="thumbSize()"
      [showCaptions]="showCaptions()"
      [filterable]="filterable()"
      [presentable]="presentable()"
      [(activeTag)]="tag"
      (itemOpen)="opens.push($event)"
      (itemChange)="changes.push($event)"
      (presentationStart)="presentations.push($event)"
      (closed)="reasons.push($event)"
    />
  `,
})
class HostComponent {
  readonly items = signal<readonly GalleryItem[]>(ITEMS);
  readonly label = signal('Product shots');
  readonly layout = signal<GalleryLayout>('grid');
  readonly thumbSize = signal<GalleryThumbSize>('md');
  readonly showCaptions = signal(false);
  readonly filterable = signal(false);
  readonly presentable = signal(false);
  tag: string | null = null;
  opens: GalleryItemEvent[] = [];
  changes: GalleryItemEvent[] = [];
  presentations: GalleryItemEvent[] = [];
  reasons: string[] = [];
}

describe('GalleryComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);
  const queryAll = <T extends HTMLElement>(selector: string): T[] =>
    Array.from(fixture.nativeElement.querySelectorAll(selector));

  const gallery = () => fixture.debugElement.children[1].componentInstance as GalleryComponent;
  const thumbs = () => queryAll<HTMLButtonElement>('.ds-gallery__thumb');
  const viewer = () => query<HTMLElement>('[role="dialog"]');
  const position = () => query('.ds-gallery__position')!.textContent!.trim();

  const flush = () => new Promise<void>((resolve) => queueMicrotask(() => resolve()));

  const openThumb = async (index: number) => {
    thumbs()[index].focus();
    thumbs()[index].click();
    fixture.detectChanges();
    await flush();
    fixture.detectChanges();
  };

  const keydown = (key: string) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    viewer()!.dispatchEvent(event);
    fixture.detectChanges();
    return event;
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
    gallery().close();
    fixture.detectChanges();
  });

  describe('thumbnails', () => {
    it('is a list of real buttons, each named by its picture', () => {
      expect(query('ul')!.getAttribute('aria-label')).toBe('Product shots');
      expect(thumbs().length).toBe(4);
      expect(thumbs().map((thumb) => thumb.getAttribute('aria-label'))).toEqual([
        'The poster, flat',
        'The poster, framed',
        'The mug',
        'The tote',
      ]);
      // The picture inside is decoration: the button already carries the name.
      expect(query('.ds-gallery__thumb img')!.getAttribute('alt')).toBe('');
      expect(thumbs()[0].getAttribute('aria-haspopup')).toBe('dialog');
    });

    it('prefers a thumb source when the host gives one', () => {
      const images = queryAll<HTMLImageElement>('.ds-gallery__thumb img');
      expect(images[3].getAttribute('src')).toContain('#d-thumb');
      expect(images[0].getAttribute('src')).toContain('#a');
    });

    it('has two layouts and three thumbnail sizes', () => {
      expect(query('.ds-gallery')!.classList).toContain('ds-gallery--grid');
      expect(query('.ds-gallery')!.classList).toContain('ds-gallery--md');

      host.layout.set('strip');
      host.thumbSize.set('lg');
      fixture.detectChanges();
      expect(query('.ds-gallery')!.classList).toContain('ds-gallery--strip');
      expect(query('.ds-gallery')!.classList).toContain('ds-gallery--lg');
    });

    it('shows captions under the thumbnails only when asked, and silently', () => {
      expect(query('.ds-gallery__caption')).toBeNull();
      host.showCaptions.set(true);
      fixture.detectChanges();
      const captions = queryAll('.ds-gallery__caption');
      expect(captions.length).toBe(2);
      expect(captions.every((caption) => caption.getAttribute('aria-hidden') === 'true')).toBeTrue();
    });

    it('says so when a filter leaves nothing', () => {
      host.items.set([]);
      fixture.detectChanges();
      expect(thumbs().length).toBe(0);
      expect(query('.ds-gallery__empty')!.textContent).toContain('No pictures match');
    });
  });

  describe('filtering', () => {
    beforeEach(() => {
      host.filterable.set(true);
      fixture.detectChanges();
    });

    it('builds one toggle per tag, in the order they appear', () => {
      const buttons = queryAll<HTMLButtonElement>('.ds-gallery__filters button');
      expect(buttons.map((button) => button.textContent!.trim())).toEqual([
        'All',
        'prints',
        'rooms',
        'mugs',
      ]);
      expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    });

    it('filters the thumbnails, and reports the tag', () => {
      queryAll<HTMLButtonElement>('.ds-gallery__filters button')[1].click();
      fixture.detectChanges();

      expect(host.tag).toBe('prints');
      expect(thumbs().length).toBe(2);
      expect(queryAll('.ds-gallery__filters button')[1].getAttribute('aria-pressed')).toBe('true');

      queryAll<HTMLButtonElement>('.ds-gallery__filters button')[0].click();
      fixture.detectChanges();
      expect(host.tag).toBeNull();
      expect(thumbs().length).toBe(4);
    });

    it('walks the filtered list in the viewer, not the whole one', async () => {
      queryAll<HTMLButtonElement>('.ds-gallery__filters button')[3].click();
      fixture.detectChanges();

      await openThumb(0);
      expect(position()).toBe('1 of 2 — The mug');
      keydown('ArrowRight');
      expect(position()).toBe('2 of 2 — The tote');
    });

    it('takes a pre-set tag from the host', () => {
      host.tag = 'rooms';
      fixture.detectChanges();
      expect(thumbs().length).toBe(1);
    });
  });

  describe('the lightbox', () => {
    it('opens nothing until a thumbnail is clicked', () => {
      expect(viewer()).toBeNull();
      expect(query('.modal-backdrop')).toBeNull();
    });

    it('opens on the clicked item, as a modal dialog named by the gallery', async () => {
      await openThumb(2);

      expect(viewer()!.getAttribute('aria-modal')).toBe('true');
      expect(viewer()!.getAttribute('aria-label')).toBe('Product shots');
      expect(position()).toBe('3 of 4 — The mug');
      expect(host.opens.length).toBe(1);
      expect(host.opens[0].item.id).toBe('c');
      expect(host.opens[0].index).toBe(2);
    });

    it('moves focus into the viewer, and back to the thumbnail on close', async () => {
      await openThumb(1);
      expect(document.activeElement).toBe(viewer());

      keydown('Escape');
      expect(viewer()).toBeNull();
      expect(document.activeElement).toBe(thumbs()[1]);
      expect(host.reasons).toEqual(['escape']);
    });

    it('makes the rest of the page inert while it is open', async () => {
      await openThumb(0);
      const outside = query('#outside')!;
      expect(outside.closest('[inert]')).toBeTruthy();

      gallery().close();
      fixture.detectChanges();
      expect(query('#outside')!.closest('[inert]')).toBeNull();
    });

    it('closes from the backdrop and from the close button, reporting the reason', async () => {
      await openThumb(0);
      query<HTMLElement>('.modal-backdrop')!.click();
      fixture.detectChanges();
      expect(viewer()).toBeNull();
      expect(host.reasons).toEqual(['backdrop']);

      await openThumb(0);
      query<HTMLButtonElement>('.ds-gallery__head-actions button')!.click();
      fixture.detectChanges();
      expect(host.reasons).toEqual(['backdrop', 'dismiss']);
    });

    it('traps Tab inside the viewer, wrapping at both edges', async () => {
      await openThumb(0);
      const focusable = Array.from(
        viewer()!.querySelectorAll<HTMLElement>('button, a[href]'),
      );
      expect(focusable.length).toBeGreaterThan(1);

      focusable[focusable.length - 1].focus();
      expect(keydown('Tab').defaultPrevented).toBeTrue();
      expect(document.activeElement).toBe(focusable[0]);

      const back = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
      viewer()!.dispatchEvent(back);
      fixture.detectChanges();
      expect(back.defaultPrevented).toBeTrue();
      expect(document.activeElement).toBe(focusable[focusable.length - 1]);
    });

    it('shows a figure when the item has words, and a plain picture when it does not', async () => {
      await openThumb(0);
      expect(query('ds-figure figcaption')!.textContent).toContain('Plate 1');
      expect(query('ds-figure figcaption')!.textContent).toContain('Photo: Ada');
      // A figure, not a card: no heading, no actions beside the picture.
      expect(query('.ds-gallery__picture h2, .ds-gallery__picture h3')).toBeNull();

      keydown('ArrowRight');
      expect(query('ds-figure')).toBeNull();
      expect(query('.ds-gallery__picture ds-image img')!.getAttribute('alt')).toBe(
        'The poster, framed',
      );
    });

    it('offers the item’s link inside the viewer', async () => {
      await openThumb(2);
      const anchor = query<HTMLAnchorElement>('.ds-gallery__picture a')!;
      expect(anchor.getAttribute('href')).toBe('https://example.com/mug');
    });
  });

  describe('moving through the set', () => {
    beforeEach(async () => {
      await openThumb(0);
    });

    it('moves with the arrow keys, reporting each move', () => {
      keydown('ArrowRight');
      expect(position()).toBe('2 of 4 — The poster, framed');
      keydown('ArrowDown');
      expect(position()).toBe('3 of 4 — The mug');
      keydown('ArrowLeft');
      keydown('ArrowUp');
      expect(position()).toBe('1 of 4 — The poster, flat');
      expect(host.changes.map((change) => change.index)).toEqual([1, 2, 1, 0]);
    });

    it('jumps to the ends with Home and End', () => {
      keydown('End');
      expect(position()).toBe('4 of 4 — The tote');
      keydown('Home');
      expect(position()).toBe('1 of 4 — The poster, flat');
    });

    it('wraps, because a deck is a loop', () => {
      keydown('ArrowLeft');
      expect(position()).toBe('4 of 4 — The tote');
      keydown('ArrowRight');
      expect(position()).toBe('1 of 4 — The poster, flat');
    });

    it('moves from the two nav buttons', () => {
      query<HTMLButtonElement>('.ds-gallery__nav--next button')!.click();
      fixture.detectChanges();
      expect(position()).toBe('2 of 4 — The poster, framed');

      query<HTMLButtonElement>('.ds-gallery__nav--previous button')!.click();
      fixture.detectChanges();
      expect(position()).toBe('1 of 4 — The poster, flat');
    });

    it('announces the position politely, in words', () => {
      expect(query('.ds-gallery__position')!.getAttribute('role')).toBe('status');
    });
  });

  describe('presentation', () => {
    beforeEach(() => {
      host.presentable.set(true);
      fixture.detectChanges();
    });

    it('starts from the toolbar, over the same list', async () => {
      query<HTMLButtonElement>('.ds-gallery__toolbar ds-button:last-of-type button')!.click();
      fixture.detectChanges();
      await flush();
      fixture.detectChanges();

      expect(viewer()!.classList).toContain('ds-gallery__viewer--presentation');
      expect(viewer()!.getAttribute('aria-label')).toBe('Product shots — slideshow');
      expect(position()).toBe('1 of 4 — The poster, flat');
      expect(host.presentations.length).toBe(1);
      expect(host.presentations[0].index).toBe(0);
      expect(queryAll('.ds-gallery__dot').length).toBe(4);
      expect(query('.ds-gallery__dot')!.classList).toContain('ds-gallery__dot--active');
    });

    it('keeps the keyboard, and returns focus to the button that started it', async () => {
      const start = query<HTMLButtonElement>('.ds-gallery__toolbar ds-button:last-of-type button')!;
      start.focus();
      start.click();
      fixture.detectChanges();
      await flush();
      fixture.detectChanges();

      keydown('ArrowRight');
      expect(position()).toBe('2 of 4 — The poster, framed');
      expect(query('.ds-gallery__dot--active')).toBe(queryAll('.ds-gallery__dot')[1]);

      keydown('Escape');
      expect(document.activeElement).toBe(start);
    });

    it('can be started on the item already open in the lightbox', async () => {
      await openThumb(2);
      expect(viewer()!.classList).not.toContain('ds-gallery__viewer--presentation');

      // The first head action is "start the slideshow", the second is close.
      queryAll<HTMLButtonElement>('.ds-gallery__head-actions button')[0].click();
      fixture.detectChanges();

      expect(viewer()!.classList).toContain('ds-gallery__viewer--presentation');
      expect(position()).toBe('3 of 4 — The mug');
      expect(host.presentations[0].index).toBe(2);
    });

    it('has nothing to present when the filter leaves nothing', () => {
      host.items.set([]);
      fixture.detectChanges();
      gallery().present();
      fixture.detectChanges();
      expect(viewer()).toBeNull();
    });
  });

  describe('the public API', () => {
    it('opens, moves and closes from code', async () => {
      gallery().open(1);
      fixture.detectChanges();
      await flush();
      fixture.detectChanges();
      expect(position()).toBe('2 of 4 — The poster, framed');

      gallery().next();
      fixture.detectChanges();
      expect(position()).toBe('3 of 4 — The mug');

      gallery().previous();
      fixture.detectChanges();
      expect(position()).toBe('2 of 4 — The poster, framed');

      gallery().close();
      fixture.detectChanges();
      expect(viewer()).toBeNull();
      expect(host.reasons).toEqual(['api']);
    });

    it('clamps an index it is given', async () => {
      gallery().open(99);
      fixture.detectChanges();
      await flush();
      fixture.detectChanges();
      expect(position()).toBe('4 of 4 — The tote');
    });

    it('publishes the visible list, and focuses a thumbnail on request', () => {
      expect(gallery().visibleItems().length).toBe(4);
      gallery().focusThumb(2);
      expect(document.activeElement).toBe(thumbs()[2]);
    });
  });
});
