import { Directive, TemplateRef, input } from '@angular/core';
import type { GalleryItem } from './gallery.types';

/** The slide template's context: the item, plus where it sits in the set. */
export interface GallerySlideContext<T = unknown> {
  $implicit: GalleryItem<T>;
  index: number;
  count: number;
}

/**
 * Marks a host-owned slide, rendered inside the gallery's viewer instead of its
 * own figure.
 *
 * The gallery keeps everything that is hard — the modality, the focus trap, the
 * keyboard, the position announcement, one list for both modes — and the host
 * supplies what is *on* the slide. It is how `<ds-interstitial>` shows a title,
 * a body and its own buttons over the gallery's machinery without the gallery
 * learning what an announcement is.
 *
 * Bind `[dsGallerySlideItems]` to the same array the gallery gets and `let-item`
 * is fully typed — the Feed's and DataTable's bargain again.
 *
 * @example
 * ```html
 * <ds-gallery [items]="slides" [thumbnails]="false">
 *   <ng-template dsGallerySlide [dsGallerySlideItems]="slides" let-item let-index="index">
 *     <h2>{{ item.data.title }}</h2>
 *     <ds-image [src]="item.src" [alt]="item.alt" />
 *   </ng-template>
 * </ds-gallery>
 * ```
 */
@Directive({
  selector: 'ng-template[dsGallerySlide]',
  standalone: true,
})
export class GallerySlideDirective<T = unknown> {
  /** Inference only: binds `T` so `let-item` is typed. Never read. */
  readonly dsGallerySlideItems = input<readonly GalleryItem<T>[]>();

  constructor(readonly template: TemplateRef<GallerySlideContext<T>>) {}

  static ngTemplateContextGuard<T>(
    _directive: GallerySlideDirective<T>,
    context: unknown,
  ): context is GallerySlideContext<T> {
    return true;
  }
}