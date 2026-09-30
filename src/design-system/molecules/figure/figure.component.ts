import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  computed,
  contentChild,
  input,
  output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ImageComponent, type ImageFit, type ImageLoading, type ImageRatio } from '../../primitives/image';
import { LinkComponent } from '../../primitives/link';
import { cx, type Radius } from '../../primitives/primitives.types';
import { uniqueId } from '../../utils';

export type FigureCaptionAlign = 'start' | 'center';

/**
 * Marks projected caption content of a `<ds-figure>` — for a caption that
 * needs markup: a link, emphasis, a citation. Rendered inside the
 * `<figcaption>`, after the `caption` text if both are given.
 *
 * @example
 * ```html
 * <ds-figure [src]="plan" alt="Floor plan, level 2">
 *   <span dsFigureCaption>Level 2, as built. <ds-link [href]="dwg">Download the drawing</ds-link>.</span>
 * </ds-figure>
 * ```
 */
@Directive({
  selector: '[dsFigureCaption]',
  standalone: true,
})
export class FigureCaptionDirective {}

/**
 * Figure — a picture with something to say about it.
 *
 * A real `<figure>` around a `<ds-image>`, with a real `<figcaption>` for the
 * caption and the credit. That is the whole molecule: HTML already has the
 * element for "this picture, and these words belong together", and assistive
 * tech already knows that a figure is named by its caption.
 *
 * It is **a figure, not a card**. No title, no body, no actions, no surface
 * behind it — a picture in an article, a diagram in the docs, a photo with a
 * photographer's name. If it needs a button, it is something else.
 *
 * Two optional links, and they are different links:
 *
 * - `href` / `link` wraps the **picture**: "open the full size", "go to the
 *   gallery". The anchor is named by the picture's alt, so it needs none of its
 *   own.
 * - `creditHref` / `creditLink` makes the **credit** a link: the photographer,
 *   the licence, the source.
 *
 * **Alt and caption are not the same words.** The alt says what the picture
 * shows; the caption says why it is here. A figure whose caption already
 * describes the picture completely may pass `alt=""` — the picture is then
 * decorative and the figure is still named by its caption.
 *
 * @example
 * ```html
 * <ds-figure
 *   src="/plates/wet-paint.jpg"
 *   alt="A violet wash with a magenta bleed and a lime sun"
 *   ratio="16/9"
 *   caption="Plate 3 — the first Wet Paint swatch, mixed on paper."
 *   credit="Photo: Ada Lovelace"
 *   creditHref="https://example.com/ada"
 * />
 *
 * <ds-figure [src]="thumb" alt="Floor plan, level 2" [href]="fullSize" target="_blank">
 *   <span dsFigureCaption>Level 2, as built. <ds-link [href]="dwg">Download the drawing</ds-link>.</span>
 * </ds-figure>
 * ```
 */
@Component({
  selector: 'ds-figure',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ImageComponent, LinkComponent, NgTemplateOutlet, RouterLink],
  template: `
    <figure [class]="classes()" [attr.aria-labelledby]="hasCaption() ? captionId : null">
      @if (href() || link()) {
        <!--
          A link around a picture is named by the picture's alt. That is the
          one thing an <a> around an <img> does well, so nothing is added. A
          plain anchor, not <ds-link>: that atom is inline text, and this is a
          block you can focus.
        -->
        @if (link()) {
          <a class="ds-figure__link" [routerLink]="link()">
            <ng-container [ngTemplateOutlet]="picture" />
          </a>
        } @else {
          <a
            class="ds-figure__link"
            [attr.href]="href()"
            [attr.target]="target() || null"
            [attr.rel]="target() === '_blank' ? 'noreferrer noopener' : null"
          >
            <ng-container [ngTemplateOutlet]="picture" />
          </a>
        }
      } @else {
        <ng-container [ngTemplateOutlet]="picture" />
      }

      <!--
        Always rendered when there is anything to say, even a credit alone: the
        credit is part of what the figure says about itself.
      -->
      @if (hasCaption()) {
        <figcaption class="ds-figure__caption" [id]="captionId">
          @if (caption()) {
            <span class="ds-figure__text">{{ caption() }}</span>
          }
          <ng-content select="[dsFigureCaption]" />
          @if (credit()) {
            <span class="ds-figure__credit">
              @if (creditHref() || creditLink()) {
                <ds-link variant="subtle" [href]="creditHref()" [link]="creditLink()" [target]="creditTarget()">
                  {{ credit() }}
                </ds-link>
              } @else {
                {{ credit() }}
              }
            </span>
          }
        </figcaption>
      }
    </figure>

    <ng-template #picture>
      <ds-image
        [src]="src()"
        [alt]="alt()"
        [decorative]="!alt()"
        [ratio]="ratio()"
        [fit]="fit()"
        [position]="position()"
        [radius]="radius()"
        [loading]="loading()"
        [fallbackText]="fallbackText()"
        (loaded)="loaded.emit()"
        (failed)="failed.emit()"
      />
    </ng-template>
  `,
  styles: `
    :host {
      display: block;
    }

    /* Bootstrap's reboot gives <figure> a bottom margin; the host owns spacing. */
    .ds-figure {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-2);
      margin: 0;
    }

    .ds-figure__link {
      display: block;
      border-radius: var(--ds-radius-md);
    }

    .ds-figure__link:focus-visible {
      outline: 2px solid var(--ds-color-focus-ring);
      outline-offset: 3px;
    }

    .ds-figure__caption {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: var(--ds-space-1) var(--ds-space-3);
      font-size: var(--ds-font-size-sm);
      line-height: var(--ds-line-height-normal);
      color: var(--ds-color-text-muted);
    }

    .ds-figure--center .ds-figure__caption {
      justify-content: center;
      text-align: center;
    }

    /* The credit is the quietest line on the page: small caps of the caption. */
    .ds-figure__credit {
      margin-inline-start: auto;
      font-size: var(--ds-font-size-xs);
      color: var(--ds-color-text-subtle);
      white-space: nowrap;
    }

    .ds-figure--center .ds-figure__credit {
      margin-inline-start: 0;
    }
  `,
})
export class FigureComponent {
  /** The picture. `null` shows the image atom's fallback. */
  readonly src = input<string | null>(null);
  /**
   * What the picture shows. Empty makes the picture decorative — only when the
   * caption already says everything the picture does.
   */
  readonly alt = input<string>('');
  readonly ratio = input<ImageRatio | null>(null);
  readonly fit = input<ImageFit>('cover');
  readonly position = input<string>('');
  readonly radius = input<Radius>('md');
  readonly loading = input<ImageLoading>('lazy');
  readonly fallbackText = input<string>('');
  /** Why the picture is here. Project content instead for a caption with markup. */
  readonly caption = input<string>('');
  /** Who made it, where it came from: "Photo: Ada Lovelace", "© 2026 Paint". */
  readonly credit = input<string>('');
  /** Makes the credit a link — to the photographer, the licence, the source. */
  readonly creditHref = input<string | null>(null);
  readonly creditLink = input<string | unknown[] | null>(null);
  readonly creditTarget = input<string | null>(null);
  /** Wraps the picture in a link: the full size, the gallery, the source page. */
  readonly href = input<string | null>(null);
  readonly link = input<string | unknown[] | null>(null);
  readonly target = input<string | null>(null);
  readonly captionAlign = input<FigureCaptionAlign>('start');
  readonly loaded = output<void>();
  readonly failed = output<void>();

  private readonly generatedId = uniqueId('ds-figure');
  protected readonly projectedCaption = contentChild(FigureCaptionDirective);

  protected readonly captionId = `${this.generatedId}-caption`;

  protected readonly hasCaption = computed(
    () => !!this.caption() || !!this.credit() || !!this.projectedCaption(),
  );

  protected readonly classes = computed(() =>
    cx('ds-figure', `ds-figure--${this.captionAlign()}`),
  );
}
