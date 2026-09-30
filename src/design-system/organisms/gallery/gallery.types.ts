import type { ImageRatio } from '../../primitives/image';

/**
 * One picture in a gallery.
 *
 * The host's data, rendered verbatim. `caption` and `credit` are the two words
 * a `<ds-figure>` knows what to do with; `tags` are what makes filtering mean
 * something; `href` / `link` is where the picture *goes* — the source page, the
 * product, the full-resolution file — and is offered in the viewer rather than
 * on the thumbnail, because a thumbnail already does something when it is
 * clicked.
 */
export interface GalleryItem<T = unknown> {
  readonly id: string;
  /** The picture. Used large, and for the thumbnail unless `thumb` is given. */
  readonly src: string;
  /** What the picture shows. The thumbnail's accessible name. */
  readonly alt: string;
  /** Why it is here. Turns the big view into a figure. */
  readonly caption?: string;
  /** Who made it. Also turns the big view into a figure. */
  readonly credit?: string;
  /** A smaller source for the thumbnail, when the host has one. */
  readonly thumb?: string;
  /** Where the picture goes, offered as a link in the viewer. */
  readonly href?: string;
  /** The same, in-app. */
  readonly link?: string | readonly unknown[];
  /** Categories. The gallery's own filter is built from these. */
  readonly tags?: readonly string[];
  /** Whatever the host needs back. */
  readonly data?: T;
}

/**
 * How the thumbnails are laid out.
 *
 * - `grid` — wraps into rows; the page grows downwards.
 * - `strip` — one scrolling row, snapping: a filmstrip under a hero, a set of
 *   product shots beside a price.
 */
export type GalleryLayout = 'grid' | 'strip';

/** Thumbnail scale. Not a new sizing system — three steps, like everything else. */
export type GalleryThumbSize = 'sm' | 'md' | 'lg';

/**
 * What the viewer is for.
 *
 * - `lightbox` — one item, opened because someone clicked it.
 * - `presentation` — the slide deck: the same list, one at a time, with the
 *   position announced as it moves.
 */
export type GalleryViewerMode = 'lightbox' | 'presentation';

/** Why the viewer closed. */
export type GalleryCloseReason = 'escape' | 'backdrop' | 'dismiss' | 'api';

/** An item, and where it sits in the filtered list. */
export interface GalleryItemEvent<T = unknown> {
  readonly item: GalleryItem<T>;
  readonly index: number;
}

/** The thumbnail frame's proportions, re-exported so hosts need one import. */
export type GalleryRatio = ImageRatio;
