import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ButtonComponent } from '../../primitives/button';
import { ImageComponent } from '../../primitives/image';
import { LinkComponent } from '../../primitives/link';
import { GalleryComponent } from '../gallery/gallery.component';
import { GallerySlideDirective } from '../gallery/gallery-slots';
import type { GalleryItem } from '../gallery/gallery.types';
import type {
  InterstitialCloseReason,
  InterstitialItem,
  InterstitialItemEvent,
} from './interstitial.types';

/**
 * Interstitial — the full-page interruption, once per user per item.
 *
 * A content API returns zero or more things the product wants to say to *this*
 * user; `InterstitialService` drops the ones already seen or dismissed; this
 * shows whatever is left. Zero eligible items means nothing renders at all,
 * which is the case that matters most: an interruption nobody needed is the
 * worst component on the page.
 *
 * **It is a gallery underneath.** One eligible item opens alone; several become a
 * deck the user can move through with the arrow keys and the two buttons — and
 * that is `<ds-gallery>`'s viewer, driven through `[thumbnails]="false"` with the
 * slide as a host-owned `[dsGallerySlide]` template. So the modality is the
 * Dialog's, note for note (focus trap, reference-counted scroll lock, the rest of
 * the page `inert`, `Escape` closes, focus returns to whatever was focused), and
 * the position announcement, the keyboard and the dots come for free.
 *
 * **Seen and dismissed are different promises.** Showing an item marks it *seen*,
 * and so does `learn more` — it has been put in front of the user, so it will not
 * be offered again. `Dismiss` is stronger and permanent. Both are reported as
 * outputs; the host (usually via `InterstitialService`) is what remembers them,
 * because the organism must not own the user's history.
 *
 * @example
 * ```html
 * <ds-interstitial
 *   [items]="interstitials.eligible()"
 *   [(open)]="showing"
 *   (seen)="interstitials.markSeen($event.item.id)"
 *   (dismissed)="interstitials.markDismissed($event.item.id)"
 *   (learnMore)="interstitials.markSeen($event.item.id)"
 * />
 * ```
 */
@Component({
  selector: 'ds-interstitial',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    GalleryComponent,
    GallerySlideDirective,
    ButtonComponent,
    ImageComponent,
    LinkComponent,
  ],
  template: `
    <!--
      The viewer exists as soon as there is anything that could be said, so it is
      there to be opened; it renders nothing on the page (no thumbnails), and
      nothing at all while the deck is empty.
    -->
    @if (items().length || slides().length) {
      <ds-gallery
        #deck
        [items]="slides()"
        [label]="label()"
        [thumbnails]="false"
        [presentable]="false"
        [closeLabel]="skipLabel()"
        [previousLabel]="previousLabel()"
        [nextLabel]="nextLabel()"
        (itemOpen)="onShown($event.index)"
        (itemChange)="onShown($event.index)"
        (closed)="onGalleryClosed($event)"
      >
        <ng-template dsGallerySlide [dsGallerySlideItems]="slides()" let-item let-index="index" let-count="count">
          <!--
            The slide is a picture and some words — a figure, not a card: no
            surface of its own, no second title, and the buttons are the
            interruption's, not the picture's.
          -->
          <div class="ds-interstitial__slide">
            @if (itemOf(item); as content) {
              @if (content.imageSrc) {
                <ds-image
                  class="ds-interstitial__image"
                  [src]="content.imageSrc"
                  [alt]="content.imageAlt ?? ''"
                  [decorative]="!content.imageAlt"
                  ratio="16/9"
                  fit="cover"
                  radius="lg"
                  loading="eager"
                />
              }

              <h2 class="ds-interstitial__title">{{ content.title }}</h2>

              @if (content.body) {
                <p class="ds-interstitial__body">{{ content.body }}</p>
              }

              <div class="ds-interstitial__actions">
                @if (content.learnMoreHref || content.learnMoreLink) {
                  <!--
                    A real link, because it goes somewhere — and following it
                    counts as having seen the item, so the wrapper reports it on
                    the way out.
                  -->
                  <span class="ds-interstitial__learn" (click)="onLearnMore(index)">
                    <ds-link
                      [href]="content.learnMoreHref ?? null"
                      [link]="routerLinkOf(content)"
                      iconEnd="arrowRight"
                    >
                      {{ content.learnMoreLabel ?? learnMoreLabel() }}
                    </ds-link>
                  </span>
                }

                <ds-button variant="secondary" (clicked)="dismiss(index)">
                  {{ count > 1 && index < count - 1 ? dismissLabel() : lastDismissLabel() }}
                </ds-button>
              </div>
            }
          </div>
        </ng-template>
      </ds-gallery>
    }
  `,
  styles: `
    :host {
      display: contents;
    }

    .ds-interstitial__slide {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-3);
    }

    .ds-interstitial__image {
      margin-block-end: var(--ds-space-1);
    }

    .ds-interstitial__title {
      margin: 0;
      font-family: var(--ds-font-display);
      font-size: var(--ds-font-size-2xl);
      font-weight: var(--ds-font-weight-bold);
      line-height: var(--ds-line-height-snug);
      color: var(--ds-color-text);
    }

    .ds-interstitial__body {
      margin: 0;
      max-width: 60ch;
      font-size: var(--ds-font-size-md);
      line-height: var(--ds-line-height-relaxed);
      color: var(--ds-color-text-muted);
    }

    .ds-interstitial__actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ds-space-4);
      margin-block-start: var(--ds-space-2);
    }

    /* The link leads; the dismiss sits after it, and neither is a primary wall. */
    .ds-interstitial__actions ds-button {
      margin-inline-start: auto;
    }
  `,
})
export class InterstitialComponent<T = unknown> {
  /** The eligible items — already filtered by what the user has seen. */
  readonly items = input<readonly InterstitialItem<T>[]>([]);
  /** Open it. Nothing renders while it is false, or while there is nothing to say. */
  readonly open = model(false);
  /** Names the viewer. */
  readonly label = input<string>('Announcement');
  readonly learnMoreLabel = input<string>('Learn more');
  /** The dismiss button, with more slides behind it, and on the last one. */
  readonly dismissLabel = input<string>('Not now');
  readonly lastDismissLabel = input<string>('Dismiss');
  readonly skipLabel = input<string>('Close');
  readonly previousLabel = input<string>('Previous announcement');
  readonly nextLabel = input<string>('Next announcement');

  /** An item was put in front of the user. Mark it seen: it does not come back. */
  readonly seen = output<InterstitialItemEvent<T>>();
  /** The user said no to this one. It must never come back. */
  readonly dismissed = output<InterstitialItemEvent<T>>();
  /** The user followed the link. Counts as seen, and closes the interruption. */
  readonly learnMore = output<InterstitialItemEvent<T>>();
  readonly closed = output<InterstitialCloseReason>();

  private readonly deck = viewChild(GalleryComponent);

  /**
   * The deck for this sitting, taken when it opens.
   *
   * Not `items()` directly: the host marks each slide *seen* as it is shown, and
   * seen items leave `eligible()` — so reading the input live would delete the
   * slide the user is looking at. An interruption shows the set it opened with.
   */
  private readonly sitting = signal<readonly InterstitialItem<T>[]>([]);
  /** Ids dismissed in this sitting, so the deck shrinks without waiting for the host. */
  private readonly dropped = signal<readonly string[]>([]);
  /** Ids already reported as seen, so a second visit to a slide is silent. */
  private reported = new Set<string>();
  /** True between `present()` and the viewer closing, so it is opened once. */
  private presented = false;
  /** True while this component is the one closing the deck, so it is not told twice. */
  private closingSelf = false;

  /** What is left to show, as gallery items carrying the content as `data`. */
  protected readonly slides = computed<GalleryItem<InterstitialItem<T>>[]>(() => {
    const dropped = this.dropped();
    return this.sitting()
      .filter((item) => !dropped.includes(item.id))
      .map((item) => ({
        id: item.id,
        src: item.imageSrc ?? '',
        // The slide's name is its *title*: that is what the position line
        // announces ("2 of 3 — Your brand, our components"). The picture's own
        // alt belongs to the picture, and is bound where the picture is.
        alt: item.title,
        data: item,
      }));
  });

  constructor() {
    // Opening is the host's flag; the deck is the thing that actually opens.
    effect(() => {
      const deck = this.deck();
      if (!deck) {
        return;
      }
      if (this.open() && !this.presented) {
        const items = untracked(() => this.items());
        if (!items.length) {
          return;
        }
        this.presented = true;
        this.dropped.set([]);
        this.sitting.set(items);
        // Next microtask: the deck has to *have* the slides before it can show
        // one, and the binding that gives them to it lands with this render.
        queueMicrotask(() => {
          if (this.presented) {
            deck.present();
          }
        });
      }
    });

    /*
     * The host taking the last item away ends the interruption too. Read
     * untracked, and scheduled out of the effect, because an effect that writes
     * a signal it reads is a loop.
     */
    effect(() => {
      const empty = this.open() && !this.slides().length;
      if (empty) {
        queueMicrotask(() => {
          if (this.open() && !this.slides().length) {
            this.finish('done');
          }
        });
      }
    });
  }

  /** The slide template hands back the gallery item; the content is its `data`. */
  protected itemOf(slide: GalleryItem<InterstitialItem<T>>): InterstitialItem<T> | undefined {
    return slide.data;
  }

  protected routerLinkOf(item: InterstitialItem<T>): string | unknown[] | null {
    const link = item.learnMoreLink;
    if (link === undefined || link === null) {
      return null;
    }
    return Array.isArray(link) ? [...link] : (link as string);
  }

  /** A slide is on screen: that is what "seen" means, and it is said once. */
  protected onShown(index: number): void {
    const item = this.at(index);
    if (!item || this.reported.has(item.id)) {
      return;
    }
    this.reported.add(item.id);
    this.seen.emit({ item, index });
  }

  protected dismiss(index: number): void {
    const item = this.at(index);
    if (!item) {
      return;
    }
    this.dismissed.emit({ item, index });
    this.drop(item.id, index);
  }

  protected onLearnMore(index: number): void {
    const item = this.at(index);
    if (!item) {
      return;
    }
    // Following the link counts as seen, and ends the interruption: the user is
    // on their way to the page it pointed at.
    this.learnMore.emit({ item, index });
    this.finish('learn-more');
  }

  /** Closes from code. */
  close(reason: InterstitialCloseReason = 'api'): void {
    this.finish(reason);
  }

  protected onGalleryClosed(reason: 'escape' | 'backdrop' | 'dismiss' | 'api'): void {
    this.presented = false;
    if (this.closingSelf || !this.open()) {
      return;
    }
    this.open.set(false);
    this.closed.emit(reason === 'escape' ? 'escape' : 'done');
  }

  private at(index: number): InterstitialItem<T> | undefined {
    return this.slides()[index]?.data;
  }

  /**
   * Takes a slide out of the deck. When it is the last one the viewer steps
   * back first, so the gallery's index is never left pointing past the end.
   */
  private drop(id: string, index: number): void {
    const count = this.slides().length;
    if (count <= 1) {
      this.dropped.update((ids) => [...ids, id]);
      this.finish('dismiss');
      return;
    }
    if (index === count - 1) {
      this.deck()?.previous();
    }
    this.dropped.update((ids) => [...ids, id]);
  }

  private finish(reason: InterstitialCloseReason): void {
    if (!this.open()) {
      return;
    }
    this.closingSelf = true;
    this.deck()?.close('api');
    this.closingSelf = false;
    this.presented = false;
    this.open.set(false);
    this.closed.emit(reason);
  }
}
