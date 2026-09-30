import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import {
  DS_COMPONENTS,
  DS_PRIMITIVES,
  GalleryComponent,
  type GalleryItem,
  type GalleryItemEvent,
  type GalleryLayout,
  type GalleryThumbSize,
} from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

interface Shot extends GalleryItem {
  /** The demo's own data, carried through untouched. */
  readonly data: { readonly rating: number; readonly reviews: number };
}

/**
 * Gallery — documentation page.
 */
@Component({
  selector: 'app-gallery-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, GalleryComponent, DOC_UI],
  templateUrl: './gallery.page.html',
  styleUrl: './components-page.scss',
})
export class GalleryPage {
  private readonly wide = 'showcase/wet-paint-wide.svg';
  private readonly square = 'showcase/wet-paint-square.svg';
  private readonly tall = 'showcase/wet-paint-tall.svg';

  readonly shots: readonly Shot[] = [
    {
      id: 'poster-flat',
      src: this.wide,
      alt: 'The Wet Paint poster, flat on paper',
      caption: 'Plate 1 — the poster, flat.',
      credit: 'Photo: Ada Lovelace',
      tags: ['prints'],
      data: { rating: 4.6, reviews: 812 },
    },
    {
      id: 'poster-framed',
      src: this.square,
      alt: 'The poster, framed on a studio wall',
      caption: 'Plate 2 — framed, in the studio.',
      tags: ['prints', 'rooms'],
      data: { rating: 4.3, reviews: 1204 },
    },
    {
      id: 'mug',
      src: this.tall,
      alt: 'The mug, on a windowsill',
      caption: 'Plate 3 — the mug.',
      credit: 'Photo: Grace Hopper',
      href: 'https://angular.dev',
      tags: ['mugs'],
      data: { rating: 3.9, reviews: 96 },
    },
    {
      id: 'tote',
      src: this.wide,
      alt: 'The tote bag, carried',
      tags: ['mugs', 'rooms'],
      data: { rating: 4.1, reviews: 204 },
    },
    {
      id: 'swatch',
      src: this.square,
      alt: 'A swatch card of the three brand mixes',
      caption: 'Plate 5 — the mixes.',
      tags: ['prints'],
      data: { rating: 4.8, reviews: 31 },
    },
    {
      id: 'studio',
      src: this.tall,
      alt: 'The studio, mid-print',
      credit: 'Photo: Katherine Johnson',
      tags: ['rooms'],
      data: { rating: 4.4, reviews: 57 },
    },
  ];

  /** The main demo's knobs. */
  readonly layout = signal<GalleryLayout>('grid');
  readonly thumbSize = signal<GalleryThumbSize>('md');
  readonly layouts: readonly GalleryLayout[] = ['grid', 'strip'];
  readonly sizes: readonly GalleryThumbSize[] = ['sm', 'md', 'lg'];

  /** The item the viewer is on, so the page can say something about it. */
  readonly selected = signal<Shot>(this.shots[0]);
  readonly selectedRating = computed(() => this.selected().data.rating);
  readonly selectedReviews = computed(() => this.selected().data.reviews);

  /** The host-filtering pattern: the gallery renders whatever list it is given. */
  readonly category = signal<string>('all');
  readonly categories = ['all', 'prints', 'mugs', 'rooms'] as const;
  readonly hostFiltered = computed(() =>
    this.category() === 'all'
      ? this.shots
      : this.shots.filter((shot) => (shot.tags ?? []).includes(this.category())),
  );

  private readonly deck = viewChild<GalleryComponent>('deck');

  onSelect(event: GalleryItemEvent): void {
    this.selected.set(event.item as Shot);
  }

  /** The presentation can be started from anywhere — it is one method. */
  startDeck(): void {
    this.deck()?.present();
  }

  readonly basicSnippet = `readonly shots: GalleryItem[] = [
  {
    id: 'poster-flat',
    src: '/shots/poster-flat.jpg',
    alt: 'The Wet Paint poster, flat on paper',
    caption: 'Plate 1 — the poster, flat.',
    credit: 'Photo: Ada Lovelace',
    tags: ['prints'],
  },
  // …
];

// template
<ds-gallery
  label="Product shots"
  [items]="shots"
  [layout]="layout()"
  [thumbSize]="thumbSize()"
  ratio="4/3"
  [filterable]="true"
  [presentable]="true"
  (itemOpen)="selected.set($event.item)"
  (itemChange)="selected.set($event.item)"
/>`;

  readonly hostFilterSnippet = `// The other way to filter: the host passes a shorter list, and the gallery
// renders what it is given — the viewer walks exactly what is on screen.
readonly visible = computed(() =>
  this.category() === 'all'
    ? this.shots
    : this.shots.filter((shot) => shot.tags?.includes(this.category())),
);

// template
<ds-gallery label="Prints" [items]="visible()" layout="strip" thumbSize="sm" ratio="1/1" />`;

  readonly presentSnippet = `<!-- One viewer, two doors. The slideshow is the same list. -->
<ds-gallery #deck label="Product shots" [items]="shots" [presentable]="true" />

<ds-button iconStart="play" (clicked)="deck.present()">Play the deck</ds-button>`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'items', type: 'readonly GalleryItem<T>[]', default: '[]', description: 'The one data source: thumbnails, lightbox and slideshow all read it.' },
    { name: 'label', type: 'string', default: `'Gallery'`, description: 'What this set of pictures is. Names the thumbnail list and the viewer.' },
    { name: 'layout', type: `'grid' | 'strip'`, default: `'grid'`, description: 'Wrapping grid, or one snapping, scrolling row.' },
    { name: 'thumbSize', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Thumbnail scale. The grid fills with as many as fit.' },
    { name: 'ratio', type: 'ImageRatio | null', default: `'4/3'`, description: 'Thumbnail proportions, from <ds-image>’s ratios.' },
    { name: 'radius', type: `'sm' | 'md' | 'lg' | 'xl'`, default: `'md'`, description: 'Thumbnail corner radius, from the tokens.' },
    { name: 'showCaptions', type: 'boolean', default: 'false', description: 'Show each item’s caption under its thumbnail (aria-hidden: the button is already named).' },
    { name: 'filterable', type: 'boolean', default: 'false', description: 'Turn on the gallery’s own category control, built from the items’ tags.' },
    { name: 'activeTag', type: 'model<string | null>', default: 'null', description: 'The chosen tag, or null for all. Two-way bindable, and pre-settable.' },
    { name: 'presentable', type: 'boolean', default: 'false', description: 'Offer a “start the slideshow” button — in the toolbar, and in the lightbox.' },
    { name: 'allLabel / filterLabel / presentLabel', type: 'string', default: `'All' / 'Filter by tag' / 'Start slideshow'`, description: 'Words of the toolbar.' },
    { name: 'closeLabel / previousLabel / nextLabel / linkLabel', type: 'string', default: `'Close' / …`, description: 'Accessible names inside the viewer.' },
    { name: 'emptyText', type: 'string', default: `'No pictures match this filter.'`, description: 'Shown when the list is empty.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'itemOpen', type: 'OutputEmitterRef<GalleryItemEvent<T>>', default: '—', description: 'The viewer opened on an item — clicked, or the deck started.' },
    { name: 'itemChange', type: 'OutputEmitterRef<GalleryItemEvent<T>>', default: '—', description: 'The viewer moved to another item.' },
    { name: 'presentationStart', type: 'OutputEmitterRef<GalleryItemEvent<T>>', default: '—', description: 'The slideshow started, on this item.' },
    { name: 'closed', type: `OutputEmitterRef<'escape' | 'backdrop' | 'dismiss' | 'api'>`, default: '—', description: 'How the viewer was closed.' },
    { name: 'activeTagChange', type: 'OutputEmitterRef<string | null>', default: '—', description: 'The model output behind [(activeTag)].' },
  ];

  readonly methods: readonly ApiRow[] = [
    { name: 'open(index, mode?)', type: '(index: number, mode?) => void', default: '—', description: 'Opens the viewer on an item of the visible list. Clamps the index.' },
    { name: 'present(index?)', type: '(index?: number) => void', default: '—', description: 'Starts the slideshow over the same list.' },
    { name: 'next() / previous()', type: '() => void', default: '—', description: 'Moves, wrapping at the ends.' },
    { name: 'close(reason?)', type: '(reason?) => void', default: '—', description: 'Closes the viewer and restores focus.' },
    { name: 'visibleItems()', type: 'Signal<readonly GalleryItem<T>[]>', default: '—', description: 'What is on screen after filtering — and what “next” means.' },
    { name: 'focusThumb(index)', type: '(index: number) => void', default: '—', description: 'Focuses a thumbnail, for a host restoring a position.' },
  ];

  readonly itemRows: readonly ApiRow[] = [
    { name: 'id', type: 'string', default: '—', description: 'Stable identity, used as the track key.' },
    { name: 'src', type: 'string', default: '—', description: 'The picture. Used large, and as the thumbnail unless thumb is given.' },
    { name: 'alt', type: 'string', default: '—', description: 'What the picture shows. The thumbnail button’s accessible name.' },
    { name: 'thumb', type: 'string?', default: '—', description: 'A smaller source for the thumbnail.' },
    { name: 'caption / credit', type: 'string?', default: '—', description: 'Words about the picture. Either one makes the big view a <ds-figure>.' },
    { name: 'href / link', type: 'string? / string | unknown[]?', default: '—', description: 'Where the picture goes. Offered as a link inside the viewer.' },
    { name: 'tags', type: 'readonly string[]?', default: '—', description: 'Categories. The gallery’s own filter is built from these.' },
    { name: 'data', type: 'T?', default: '—', description: 'Whatever the host needs back on itemOpen / itemChange.' },
  ];
}