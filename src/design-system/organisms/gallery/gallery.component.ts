import { DOCUMENT } from '@angular/common';
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
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ButtonComponent } from '../../primitives/button';
import { ImageComponent, type ImageRatio } from '../../primitives/image';
import { LinkComponent } from '../../primitives/link';
import { cx } from '../../primitives/primitives.types';
import { FigureComponent } from '../../molecules/figure';
import { GallerySlideDirective } from './gallery-slots';
import { PageInertService, ScrollLockService, trapTab, uniqueId } from '../../utils';
import type {
  GalleryCloseReason,
  GalleryItem,
  GalleryItemEvent,
  GalleryLayout,
  GalleryThumbSize,
  GalleryViewerMode,
} from './gallery.types';

/**
 * Gallery — thumbnails, a lightbox and a slideshow over one list.
 *
 * The product-page gallery: a set of pictures, a way to see one of them
 * properly, and a way to walk all of them. **One data source** — the host passes
 * `items` once; "clicked a thumb" and "start the slideshow" are the same viewer
 * in two modes, over the same array, so the two can never drift apart.
 *
 * Nothing is re-invented. Thumbnails are `<ds-image>` in the radius and ratio
 * tokens; the big view is a `<ds-figure>` when the item has words about it
 * (caption, credit, a link) and a plain `<ds-image>` when it is only a
 * photograph with an alt; the modal behaviour is `<ds-dialog>`'s, note for note
 * — a focus trap, a reference-counted scroll lock, the rest of the page
 * `inert`, `Escape` to close, and focus back to whatever opened it.
 *
 * **The keyboard, while the viewer is open**
 *
 * | Key | Effect |
 * | --- | --- |
 * | `→` `↓` / `←` `↑` | next / previous picture |
 * | `Home` / `End` | first / last |
 * | `Escape` | close, and focus goes back |
 * | `Tab` | cycles inside the viewer, as in a dialog |
 *
 * **Filtering.** Two ways, and they compose. Either the host filters and passes
 * a shorter `items` — the gallery simply renders what it is given — or
 * `filterable` turns on the gallery's own category control: one button per tag
 * found in the items, `aria-pressed`, with `[(activeTag)]` for the host to read
 * or pre-set. The viewer walks the *filtered* list, because what is on screen is
 * what "next" should mean.
 *
 * @example
 * ```html
 * <ds-gallery
 *   label="Product shots"
 *   [items]="shots"
 *   layout="grid"
 *   thumbSize="md"
 *   ratio="4/3"
 *   [filterable]="true"
 *   [presentable]="true"
 *   (itemOpen)="selected.set($event.item)"
 * />
 * ```
 */
@Component({
  selector: 'ds-gallery',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, ImageComponent, FigureComponent, LinkComponent, NgTemplateOutlet],
  template: `
    <div [class]="classes()">
      @if (filterable() || presentable()) {
        <div class="ds-gallery__toolbar">
          @if (filterable()) {
            <!--
              A category control, not a chip row: each tag is a real toggle
              button reporting aria-pressed, so the state is in the tree and not
              only in the paint.
            -->
            <div class="ds-gallery__filters" [attr.aria-label]="filterLabel()" role="group">
              <ds-button
                size="sm"
                [variant]="activeTag() === null ? 'primary' : 'outline'"
                [ariaPressed]="activeTag() === null"
                (clicked)="setTag(null)"
              >
                {{ allLabel() }}
              </ds-button>
              @for (tag of tags(); track tag) {
                <ds-button
                  size="sm"
                  [variant]="activeTag() === tag ? 'primary' : 'outline'"
                  [ariaPressed]="activeTag() === tag"
                  (clicked)="setTag(tag)"
                >
                  {{ tag }}
                </ds-button>
              }
            </div>
          }

          @if (presentable()) {
            <ds-button
              size="sm"
              variant="secondary"
              iconStart="play"
              [disabled]="!visibleItems().length"
              (clicked)="present()"
            >
              {{ presentLabel() }}
            </ds-button>
          }
        </div>
      }

      @if (!thumbnails()) {
        <!-- Nothing on the page: the host drives the viewer with open() /
             present(), and the gallery is only the viewer. -->
      } @else if (visibleItems().length) {
        <!--
          A list of pictures is a list. Each thumbnail is one real button named
          by the picture's alt — never a clickable div, and never an <img> with a
          click handler.
        -->
        <ul class="ds-gallery__items" [attr.aria-label]="label()">
          @for (item of visibleItems(); track item.id; let index = $index) {
            <li class="ds-gallery__item">
              <button
                type="button"
                class="ds-gallery__thumb"
                [attr.data-index]="index"
                [attr.aria-label]="item.alt"
                [attr.aria-haspopup]="'dialog'"
                (click)="open(index)"
              >
                <ds-image
                  [src]="item.thumb ?? item.src"
                  [alt]="''"
                  [decorative]="true"
                  [ratio]="ratio()"
                  [radius]="radius()"
                  fit="cover"
                />
              </button>

              @if (showCaptions() && item.caption) {
                <!-- The button is already named by the alt; this is for the eye. -->
                <p class="ds-gallery__caption" aria-hidden="true">{{ item.caption }}</p>
              }
            </li>
          }
        </ul>
      } @else {
        <p class="ds-gallery__empty">{{ emptyText() }}</p>
      }
    </div>

    @if (viewerOpen() && activeItem(); as item) {
      <div class="modal-backdrop show ds-gallery__backdrop" (click)="onBackdrop()"></div>

      <div
        #viewer
        class="modal ds-gallery__viewer"
        [class.ds-gallery__viewer--presentation]="mode() === 'presentation'"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="viewerName()"
        (keydown)="onKeydown($event)"
      >
        <div class="ds-gallery__sheet">
          <div class="ds-gallery__head">
            <!--
              Where you are in the set — and a polite live region, so moving is
              heard without leaving the viewer. It is the only thing announced:
              the picture's own name travels with the picture.
            -->
            <p class="ds-gallery__position" role="status">{{ positionText() }}</p>

            <div class="ds-gallery__head-actions">
              @if (mode() === 'lightbox' && presentable() && visibleItems().length > 1) {
                <ds-button
                  variant="ghost"
                  size="sm"
                  iconStart="play"
                  [label]="presentLabel()"
                  (clicked)="present(activeIndex())"
                />
              }
              <ds-button
                variant="ghost"
                size="sm"
                iconStart="close"
                [label]="closeLabel()"
                (clicked)="close('dismiss')"
              />
            </div>
          </div>

          <div class="ds-gallery__stage">
            @if (visibleItems().length > 1) {
              <ds-button
                class="ds-gallery__nav ds-gallery__nav--previous"
                variant="secondary"
                iconStart="chevronLeft"
                [label]="previousLabel()"
                (clicked)="previous()"
              />
            }

            <div class="ds-gallery__picture">
              @if (slideTemplate(); as slide) {
                <!--
                  The host owns what is on the slide; the gallery still owns the
                  modality, the keyboard and the position.
                -->
                <ng-container
                  [ngTemplateOutlet]="slide.template"
                  [ngTemplateOutletContext]="{
                    $implicit: item,
                    index: activeIndex(),
                    count: visibleItems().length,
                  }"
                />
              } @else if (item.caption || item.credit || item.href || item.link) {
                <!--
                  Words about the picture: that is a figure, and <ds-figure>
                  already knows how to say them. Not a card — no surface, no
                  actions, no second title.
                -->
                <ds-figure
                  [src]="item.src"
                  [alt]="item.alt"
                  [caption]="item.caption ?? ''"
                  [credit]="item.credit ?? ''"
                  loading="eager"
                  fit="contain"
                  radius="lg"
                >
                  @if (item.href || item.link) {
                    <span dsFigureCaption>
                      <ds-link [href]="item.href ?? null" [link]="asRouterLink(item)">
                        {{ linkLabel() }}
                      </ds-link>
                    </span>
                  }
                </ds-figure>
              } @else {
                <!-- Only a photograph and its alt: a picture is enough. -->
                <ds-image
                  [src]="item.src"
                  [alt]="item.alt"
                  fit="contain"
                  radius="lg"
                  loading="eager"
                />
              }
            </div>

            @if (visibleItems().length > 1) {
              <ds-button
                class="ds-gallery__nav ds-gallery__nav--next"
                variant="secondary"
                iconStart="chevronRight"
                [label]="nextLabel()"
                (clicked)="next()"
              />
            }
          </div>

          @if (mode() === 'presentation' && visibleItems().length > 1) {
            <!-- Where you are, for the eye. The position above says it in words. -->
            <div class="ds-gallery__dots" aria-hidden="true">
              @for (dot of visibleItems(); track dot.id; let index = $index) {
                <span class="ds-gallery__dot" [class.ds-gallery__dot--active]="index === activeIndex()"></span>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .ds-gallery {
      --ds-gallery-thumb: 12rem;

      display: flex;
      flex-direction: column;
      gap: var(--ds-space-4);
    }

    .ds-gallery--sm {
      --ds-gallery-thumb: 8rem;
    }

    .ds-gallery--lg {
      --ds-gallery-thumb: 16rem;
    }

    .ds-gallery__toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--ds-space-3);
    }

    .ds-gallery__filters {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ds-space-2);
    }

    .ds-gallery__items {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(var(--ds-gallery-thumb), 1fr));
      gap: var(--ds-space-4);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    /* One scrolling row, snapping — a filmstrip, still a gallery. */
    .ds-gallery--strip .ds-gallery__items {
      display: flex;
      grid-template-columns: none;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      padding-block-end: var(--ds-space-2);
    }

    .ds-gallery--strip .ds-gallery__item {
      flex: 0 0 var(--ds-gallery-thumb);
      scroll-snap-align: start;
    }

    .ds-gallery__item {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-1_5);
      min-width: 0;
    }

    .ds-gallery__thumb {
      display: block;
      width: 100%;
      padding: 0;
      border: 0;
      background: none;
      cursor: pointer;
      border-radius: var(--ds-radius-md);
      transition:
        transform 160ms ease,
        box-shadow 160ms ease;
    }

    .ds-gallery__thumb:hover {
      transform: translateY(-2px);
      box-shadow: var(--ds-shadow-md);
    }

    .ds-gallery__thumb:focus-visible {
      outline: 2px solid var(--ds-color-focus-ring);
      outline-offset: 3px;
    }

    .ds-gallery__caption {
      margin: 0;
      font-size: var(--ds-font-size-xs);
      line-height: var(--ds-line-height-snug);
      color: var(--ds-color-text-muted);
    }

    .ds-gallery__empty {
      margin: 0;
      padding: var(--ds-space-6);
      border: 1px dashed var(--ds-color-border);
      border-radius: var(--ds-radius-lg);
      background-image: var(--ds-texture-hatch);
      color: var(--ds-color-text-muted);
      font-size: var(--ds-font-size-sm);
      text-align: center;
    }

    /* —— The viewer: the Dialog's modality, a gallery's furniture —— */
    .ds-gallery__backdrop {
      --bs-backdrop-bg: var(--ds-color-overlay);
      --bs-backdrop-opacity: 1;

      animation: ds-gallery-fade 160ms ease-out;
    }

    /* The sheet is centred in the viewport; Bootstrap's .modal supplies the
       fixed position and the stacking, not the layout. */
    .ds-gallery__viewer {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--ds-space-5) var(--ds-space-4);
      overflow: auto;
    }

    .ds-gallery__viewer:focus {
      outline: none;
    }

    .ds-gallery__sheet {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-3);
      width: 100%;
      max-width: 64rem;
      margin: 0 auto;
      animation: ds-gallery-in 180ms ease-out;
    }

    /* The chrome floats over whatever the backdrop is covering, so it carries
       its own ink: a dark bar, and light type on it, at any page colour. */
    .ds-gallery__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ds-space-3);
      padding: var(--ds-space-1) var(--ds-space-2);
      border-radius: var(--ds-radius-full);
      background-color: color-mix(in srgb, #141221 72%, transparent);
      color: #ffffff;
    }

    .ds-gallery__head-actions {
      display: flex;
      gap: var(--ds-space-1);
    }

    /* The viewer floats on the overlay, so its chrome carries its own ink. */
    .ds-gallery__head ds-button {
      --bs-btn-color: #ffffff;
      --bs-btn-hover-color: #ffffff;
      --bs-btn-hover-bg: color-mix(in srgb, #ffffff 18%, transparent);
    }

    .ds-gallery__position {
      margin: 0;
      padding-inline-start: var(--ds-space-2);
      font-family: var(--ds-font-mono);
      font-size: var(--ds-font-size-xs);
      font-variant-numeric: tabular-nums;
      letter-spacing: var(--ds-letter-spacing-wide);
    }

    /* The two nav buttons ride on the picture's edges, so the sheet is exactly
       as wide as the picture — and the position line above it lines up. */
    .ds-gallery__stage {
      position: relative;
      display: flex;
      align-items: center;
    }

    .ds-gallery__picture {
      flex: 1 1 auto;
      min-width: 0;
      padding: var(--ds-space-4);
      border-radius: var(--ds-radius-xl);
      background-color: var(--ds-color-surface);
      box-shadow: var(--ds-shadow-xl);
    }

    .ds-gallery__picture ds-image,
    .ds-gallery__picture ds-figure {
      max-height: 70vh;
    }

    .ds-gallery__nav {
      position: absolute;
      top: 50%;
      z-index: 1;
      transform: translateY(-50%);
    }

    .ds-gallery__nav--previous {
      inset-inline-start: calc(-1 * var(--ds-space-3));
    }

    .ds-gallery__nav--next {
      inset-inline-end: calc(-1 * var(--ds-space-3));
    }

    .ds-gallery__dots {
      display: flex;
      justify-content: center;
      gap: var(--ds-space-1_5);
    }

    .ds-gallery__dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: var(--ds-radius-full);
      background-color: color-mix(in srgb, #ffffff 45%, transparent);
    }

    .ds-gallery__dot--active {
      background-color: #ffffff;
      transform: scale(1.2);
    }

    @keyframes ds-gallery-fade {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes ds-gallery-in {
      from {
        opacity: 0;
        transform: scale(0.98);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ds-gallery__backdrop,
      .ds-gallery__sheet,
      .ds-gallery__thumb {
        animation: none;
        transition: none;
      }
    }

    @media (max-width: 576px) {
      .ds-gallery__nav--previous {
        inset-inline-start: var(--ds-space-1);
      }

      .ds-gallery__nav--next {
        inset-inline-end: var(--ds-space-1);
      }
    }
  `,
})
export class GalleryComponent<T = unknown> {
  private readonly document = inject(DOCUMENT);
  private readonly scrollLock = inject(ScrollLockService);
  private readonly pageInert = inject(PageInertService);

  /** The pictures. The one data source: thumbnails, lightbox and slideshow all read it. */
  readonly items = input<readonly GalleryItem<T>[]>([]);
  /** What this set of pictures is. Names the list of thumbnails. */
  readonly label = input<string>('Gallery');
  readonly layout = input<GalleryLayout>('grid');
  readonly thumbSize = input<GalleryThumbSize>('md');
  /** Thumbnail proportions, from `<ds-image>`'s ratios. */
  readonly ratio = input<ImageRatio | null>('4/3');
  readonly radius = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  /**
   * Render the thumbnails. `false` leaves only the viewer, for a host that
   * drives it itself — `<ds-interstitial>` opens a deck with nothing on the page.
   */
  readonly thumbnails = input(true);
  /** Show each item's caption under its thumbnail. */
  readonly showCaptions = input(false);
  /** Turn on the gallery's own category control, built from the items' tags. */
  readonly filterable = input(false);
  /** The chosen tag, or `null` for all of them. Two-way bindable. */
  readonly activeTag = model<string | null>(null);
  /** Offer a "start the slideshow" button — in the toolbar, and in the lightbox. */
  readonly presentable = input(false);

  readonly allLabel = input<string>('All');
  readonly filterLabel = input<string>('Filter by tag');
  readonly presentLabel = input<string>('Start slideshow');
  readonly closeLabel = input<string>('Close');
  readonly previousLabel = input<string>('Previous picture');
  readonly nextLabel = input<string>('Next picture');
  readonly linkLabel = input<string>('Open the source');
  readonly emptyText = input<string>('No pictures match this filter.');

  /** The viewer opened on an item — because it was clicked, or the deck started. */
  readonly itemOpen = output<GalleryItemEvent<T>>();
  /** The viewer moved to another item. */
  readonly itemChange = output<GalleryItemEvent<T>>();
  /** The slideshow started, on this item. */
  readonly presentationStart = output<GalleryItemEvent<T>>();
  readonly closed = output<GalleryCloseReason>();

  protected readonly slideTemplate = contentChild(GallerySlideDirective<T>);

  protected readonly viewerOpen = signal(false);
  protected readonly mode = signal<GalleryViewerMode>('lightbox');
  protected readonly activeIndex = signal(0);

  private readonly viewerRef = viewChild<ElementRef<HTMLElement>>('viewer');
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private previouslyFocused: HTMLElement | null = null;
  private locked = false;
  private silenced = false;

  protected readonly viewerId = uniqueId('ds-gallery-viewer');

  constructor() {
    /*
     * Opening is a *render* event, not a click event: the viewer's element does
     * not exist until the view has been refreshed. As in `<ds-dialog>`, an
     * effect watches the flag, so locking, silencing and moving focus happen
     * once the sheet is really there — whoever opened it, and however.
     */
    effect(() => {
      if (this.viewerOpen()) {
        this.enterViewer();
      } else {
        this.exitViewer();
      }
    });

    // A viewer destroyed while open — the host removed the last item, the route
    // changed — must not leave the page locked, silenced, or without its focus.
    inject(DestroyRef).onDestroy(() => this.exitViewer());
  }

  /** Every tag in the items, in the order they first appear. */
  protected readonly tags = computed(() => {
    const seen: string[] = [];
    for (const item of this.items()) {
      for (const tag of item.tags ?? []) {
        if (!seen.includes(tag)) {
          seen.push(tag);
        }
      }
    }
    return seen;
  });

  /**
   * What is on screen — and therefore what "next" means. The host's own
   * pre-filtering and the gallery's tag control compose: this is the second
   * applied to the first.
   */
  readonly visibleItems = computed(() => {
    const tag = this.activeTag();
    if (!tag) {
      return this.items();
    }
    return this.items().filter((item) => (item.tags ?? []).includes(tag));
  });

  protected readonly activeItem = computed<GalleryItem<T> | null>(
    () => this.visibleItems()[this.activeIndex()] ?? null,
  );

  protected readonly positionText = computed(() => {
    const item = this.activeItem();
    const count = this.visibleItems().length;
    if (!item) {
      return '';
    }
    // "1 of 1" is noise: a set of one has no position to report.
    return count < 2 ? '' : `${this.activeIndex() + 1} of ${count} — ${item.alt}`;
  });

  protected readonly viewerName = computed(() =>
    this.mode() === 'presentation' ? `${this.label()} — slideshow` : this.label(),
  );

  protected readonly classes = computed(() =>
    cx('ds-gallery', `ds-gallery--${this.layout()}`, `ds-gallery--${this.thumbSize()}`),
  );

  /** `ds-link` takes a router link or an href, never both. */
  protected asRouterLink(item: GalleryItem<T>): string | unknown[] | null {
    const link = item.link;
    if (link === undefined || link === null) {
      return null;
    }
    return Array.isArray(link) ? [...link] : (link as string);
  }

  protected setTag(tag: string | null): void {
    this.activeTag.set(tag);
    // The filtered list is a different list: the viewer starts again at its top.
    this.activeIndex.set(0);
  }

  // —— The viewer ——

  /** Opens the lightbox on the item at `index` of the visible list. */
  open(index: number, mode: GalleryViewerMode = 'lightbox'): void {
    const items = this.visibleItems();
    if (!items.length) {
      return;
    }
    const next = Math.min(Math.max(index, 0), items.length - 1);
    this.activeIndex.set(next);
    this.mode.set(mode);

    this.viewerOpen.set(true);
    this.itemOpen.emit({ item: items[next], index: next });
  }

  /** Starts the slideshow — the same viewer, over the same list. */
  present(index = 0): void {
    const items = this.visibleItems();
    if (!items.length) {
      return;
    }
    this.open(index, 'presentation');
    const at = this.activeIndex();
    this.presentationStart.emit({ item: items[at], index: at });
  }

  /** Closes the viewer, and gives focus back to whatever opened it. */
  close(reason: GalleryCloseReason = 'api'): void {
    if (!this.viewerOpen()) {
      return;
    }
    this.viewerOpen.set(false);
    this.closed.emit(reason);
  }

  /** The next picture, wrapping at the end — a deck is a loop. */
  next(): void {
    this.moveTo(this.activeIndex() + 1);
  }

  previous(): void {
    this.moveTo(this.activeIndex() - 1);
  }

  private moveTo(index: number): void {
    const items = this.visibleItems();
    if (items.length < 2) {
      return;
    }
    const count = items.length;
    const next = ((index % count) + count) % count;
    if (next === this.activeIndex()) {
      return;
    }
    this.activeIndex.set(next);
    this.itemChange.emit({ item: items[next], index: next });
  }

  protected onBackdrop(): void {
    this.close('backdrop');
  }

  protected onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.close('escape');
        return;
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        this.next();
        return;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        this.previous();
        return;
      case 'Home':
        event.preventDefault();
        this.moveTo(0);
        return;
      case 'End':
        event.preventDefault();
        this.moveTo(this.visibleItems().length - 1);
        return;
      default: {
        const viewer = this.viewerRef()?.nativeElement;
        if (viewer) {
          trapTab(viewer, event);
        }
      }
    }
  }

  /** The Dialog's opening sequence: remember, lock, silence, focus. */
  private enterViewer(): void {
    if (!this.previouslyFocused) {
      this.previouslyFocused = this.document.activeElement as HTMLElement | null;
    }

    if (!this.locked) {
      this.scrollLock.lock();
      this.locked = true;
    }

    queueMicrotask(() => {
      const viewer = this.viewerRef()?.nativeElement;
      if (!viewer) {
        return;
      }
      if (!this.silenced) {
        this.pageInert.activate(viewer);
        this.silenced = true;
      }
      // The viewer itself, so its name is announced before its buttons are read.
      viewer.focus();
    });
  }

  /**
   * And the closing one: release the page, and give the focus back. Idempotent,
   * because it can arrive twice — once from the flag, once from a destroy that
   * beat the effect to it.
   */
  private exitViewer(): void {
    this.releasePage();
    this.previouslyFocused?.focus?.();
    this.previouslyFocused = null;
  }

  private releasePage(): void {
    if (this.locked) {
      this.scrollLock.release();
      this.locked = false;
    }
    if (this.silenced) {
      this.pageInert.deactivate();
      this.silenced = false;
    }
  }

  /** Focuses the thumbnail at `index` — for a host restoring a position. */
  focusThumb(index: number): void {
    const thumb = this.hostRef.nativeElement.querySelectorAll<HTMLElement>('.ds-gallery__thumb')[index];
    thumb?.focus();
  }
}
