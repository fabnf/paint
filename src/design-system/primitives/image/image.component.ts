import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  computed,
  contentChild,
  effect,
  input,
  isDevMode,
  output,
  signal,
} from '@angular/core';
import { IconComponent, type IconName } from '../../icons';
import { cx, radiusClass, type Radius } from '../primitives.types';

/** How the picture fills its frame — CSS `object-fit`, by its own names. */
export type ImageFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';

/**
 * The frame's proportions. The named ratios are the ones product UI actually
 * uses; a number is any other `width / height`. `null` keeps the picture's own.
 */
export type ImageRatio = '1/1' | '4/3' | '3/2' | '16/9' | '21/9' | '3/4' | '2/3' | '9/16' | number;

export type ImageLoading = 'lazy' | 'eager';

/**
 * Marks the custom fallback of a `<ds-image>` — what to show when there is no
 * picture, or the picture failed. Replaces the default icon and text.
 *
 * @example
 * ```html
 * <ds-image [src]="cover()" alt="Cover of Wet Paint">
 *   <ds-avatar dsImageFallback name="Wet Paint" shape="square" />
 * </ds-image>
 * ```
 */
@Directive({
  selector: '[dsImageFallback]',
  standalone: true,
})
export class ImageFallbackDirective {}

/**
 * Image — the picture atom.
 *
 * A real `<img>` in a frame that knows its proportions. The frame reserves its
 * space before the bytes arrive (`aspect-ratio`, so nothing jumps), decides how
 * the picture fills it (`fit`), rounds its corners from the radius tokens, and
 * shows *something* when there is no picture to show — a missing `src` and a
 * failed one look the same, and neither looks like the browser's broken-image
 * glyph.
 *
 * **Every picture says what it is, or says it is decoration.** `alt` is the
 * accessible name; `decorative` is the explicit way to opt out, and it empties
 * the alt *and* hides the fallback. An image with neither is a mistake, and
 * Paint says so in development.
 *
 * Loading is lazy by default — the native attribute, nothing more. Set
 * `loading="eager"` on the hero that is on screen at first paint.
 *
 * @example
 * ```html
 * <ds-image src="/covers/wet-paint.jpg" alt="Cover of Wet Paint" ratio="4/3" />
 * <ds-image [src]="avatarUrl()" alt="" [decorative]="true" ratio="1/1" radius="full" />
 * <ds-image [src]="null" alt="Floor plan" fallbackText="No plan uploaded" ratio="16/9" />
 *
 * <ds-image [src]="cover()" alt="Cover" ratio="1/1" fit="contain">
 *   <ds-avatar dsImageFallback name="Paint" shape="square" />
 * </ds-image>
 * ```
 */
@Component({
  selector: 'ds-image',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <span
      [class]="classes()"
      [style.aspect-ratio]="ratioStyle()"
      [attr.role]="showFallback() && !decorative() ? 'img' : null"
      [attr.aria-label]="showFallback() && !decorative() ? fallbackName() : null"
      [attr.aria-hidden]="showFallback() && decorative() ? 'true' : null"
    >
      @if (showImage()) {
        <!--
          The alt is the name, or empty for decoration — never absent, because an
          <img> with no alt at all is announced by its file name.
        -->
        <img
          class="ds-image__img"
          [src]="src()"
          [attr.srcset]="srcset() || null"
          [attr.sizes]="sizes() || null"
          [attr.alt]="decorative() ? '' : alt()"
          [attr.loading]="loading()"
          decoding="async"
          [style.object-fit]="fit()"
          [style.object-position]="position() || null"
          (load)="onLoad()"
          (error)="onError()"
        />
      } @else {
        <!--
          The frame carries the name (role="img"); what is inside it is paint.
          The custom fallback replaces the default icon and text, not the role.
        -->
        <span class="ds-image__fallback" aria-hidden="true">
          <ng-content select="[dsImageFallback]" />
          @if (!customFallback()) {
            <ds-icon [name]="fallbackIcon()" size="lg" class="ds-image__fallback-icon" />
            @if (fallbackText()) {
              <span class="ds-image__fallback-text">{{ fallbackText() }}</span>
            }
          }
        </span>
      }
    </span>
  `,
  styles: `
    :host {
      display: block;
      max-width: 100%;
    }

    /* The frame owns the shape. The picture is clipped to it, the fallback
       fills it, and aspect-ratio holds the space either way. */
    .ds-image {
      position: relative;
      display: block;
      width: 100%;
      overflow: hidden;
      background-color: var(--ds-color-surface-sunken);
    }

    .ds-image__img {
      display: block;
      width: 100%;
      height: 100%;
      transition: opacity 220ms ease;
    }

    /* Until the bytes land, the frame is a quiet block the colour of a
       skeleton — the same grey, so a page of loading things agrees with itself. */
    .ds-image--loading {
      background-color: var(--ds-skeleton-color);
    }

    .ds-image--loading .ds-image__img {
      opacity: 0;
    }

    .ds-image__fallback {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--ds-space-2);
      padding: var(--ds-space-3);
      color: var(--ds-color-text-subtle);
      background-color: var(--ds-color-surface-sunken);
      background-image: var(--ds-texture-hatch);
      text-align: center;
    }

    /* Without a ratio the frame has no height of its own; the fallback gives it one. */
    .ds-image--fallback:not(.ds-image--ratio) .ds-image__fallback {
      position: static;
      min-height: 6rem;
    }

    .ds-image__fallback-text {
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-medium);
      line-height: var(--ds-line-height-snug);
    }

    @media (prefers-reduced-motion: reduce) {
      .ds-image__img {
        transition: none;
      }
    }

    @media (forced-colors: active) {
      .ds-image {
        border: 1px solid CanvasText;
      }
    }
  `,
})
export class ImageComponent {
  /** The picture. `null` or empty shows the fallback at once, with no request. */
  readonly src = input<string | null>(null);
  /** Responsive candidates and the sizes they are for — passed straight through. */
  readonly srcset = input<string>('');
  readonly sizes = input<string>('');
  /**
   * What the picture shows, for someone who cannot see it. Required unless the
   * image is `decorative`; Paint warns in development when it is neither.
   */
  readonly alt = input<string>('');
  /**
   * The picture repeats what the text beside it already says, or is texture.
   * Empties the alt and hides the fallback from assistive tech.
   */
  readonly decorative = input(false);
  /** The frame's proportions. `null` lets the picture decide. */
  readonly ratio = input<ImageRatio | null>(null);
  /** How the picture fills the frame. `cover` crops; `contain` letterboxes. */
  readonly fit = input<ImageFit>('cover');
  /** Which part survives a crop — CSS `object-position`, e.g. `top`, `50% 20%`. */
  readonly position = input<string>('');
  /** Corner radius, from the tokens. */
  readonly radius = input<Radius>('md');
  /** `lazy` by default. `eager` for the picture that is on screen at first paint. */
  readonly loading = input<ImageLoading>('lazy');
  /** Icon of the default fallback. */
  readonly fallbackIcon = input<IconName>('image');
  /** Words under the icon, e.g. "No cover yet". Becomes the name when `alt` is empty. */
  readonly fallbackText = input<string>('');

  /** The picture arrived. */
  readonly loaded = output<void>();
  /** The picture did not. The fallback is already showing. */
  readonly failed = output<void>();

  protected readonly customFallback = contentChild(ImageFallbackDirective);

  /**
   * Outcomes are remembered *per source*, so a new `src` is a fresh attempt
   * without anything having to be reset: the moment the input changes, the
   * old result simply stops matching.
   */
  private readonly loadedSrc = signal<string | null>(null);
  private readonly failedSrc = signal<string | null>(null);

  protected readonly hasSrc = computed(() => !!this.src());
  protected readonly isFailed = computed(() => this.hasSrc() && this.failedSrc() === this.src());
  protected readonly isLoaded = computed(() => this.hasSrc() && this.loadedSrc() === this.src());

  protected readonly showImage = computed(() => this.hasSrc() && !this.isFailed());
  protected readonly showFallback = computed(() => !this.showImage());

  protected readonly fallbackName = computed(() => this.alt() || this.fallbackText() || null);

  protected readonly ratioStyle = computed(() => {
    const ratio = this.ratio();
    if (ratio === null) {
      return null;
    }
    return typeof ratio === 'number' ? String(ratio) : ratio.replace('/', ' / ');
  });

  protected readonly classes = computed(() =>
    cx(
      'ds-image',
      `ds-image--${this.fit()}`,
      radiusClass(this.radius()),
      this.ratio() !== null && 'ds-image--ratio',
      this.showImage() && !this.isLoaded() && 'ds-image--loading',
      this.showFallback() && 'ds-image--fallback',
    ),
  );

  constructor() {
    // A picture with no name and no declaration of decoration is a mistake;
    // say so where the developer is looking.
    effect(() => {
      if (isDevMode() && this.hasSrc() && !this.alt() && !this.decorative()) {
        console.warn(
          `[paint] <ds-image src="${this.src()}"> has no alt. ` +
            'Give it one, or set [decorative]="true" if it repeats the text beside it.',
        );
      }
    });
  }

  protected onLoad(): void {
    this.loadedSrc.set(this.src());
    this.loaded.emit();
  }

  protected onError(): void {
    this.failedSrc.set(this.src());
    this.failed.emit();
  }
}
