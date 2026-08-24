import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { brand, brandAccents, brandGradient } from './brand.tokens';

export type LogoVariant = 'full' | 'mark' | 'wordmark';
export type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

interface LogoMetrics {
  /** Mark edge length. */
  mark: string;
  /** Wordmark size. */
  word: string;
  /** Gap between mark and wordmark. */
  gap: string;
}

const SIZE_MAP: Record<LogoSize, LogoMetrics> = {
  sm: { mark: '1.5rem', word: '1.0625rem', gap: '0.5rem' },
  md: { mark: '2rem', word: '1.375rem', gap: '0.5rem' },
  lg: { mark: '2.75rem', word: '1.875rem', gap: '0.625rem' },
  xl: { mark: '4.25rem', word: '3rem', gap: '0.875rem' },
};

let uid = 0;

/**
 * Logo — Paint's brand signature.
 *
 * The mark *is* the paint: one unbroken brush stroke pulls the `P`, filled with
 * the signature magenta→violet gradient. A magenta dab multiplies where it
 * crosses the stroke — real pigment mixing, not a decal — and a lime drip runs
 * off the bowl. Pure inline SVG: crisp at favicon size, `currentColor` in mono,
 * no asset pipeline.
 *
 * @example
 * ```html
 * <ds-logo />                            <!-- mark + wordmark -->
 * <ds-logo variant="mark" size="sm" />   <!-- app icon / favicon -->
 * <ds-logo size="xl" [tagline]="true" [underline]="true" />
 * <ds-logo [mono]="true" />              <!-- inherits currentColor -->
 * ```
 */
@Component({
  selector: 'ds-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="ds-logo"
      [class.ds-logo--mono]="mono()"
      [style.gap]="metrics().gap"
      role="img"
      [attr.aria-label]="ariaLabel()"
    >
      @if (variant() !== 'wordmark') {
        <svg
          class="ds-logo__mark"
          viewBox="0 0 32 32"
          [style.width]="metrics().mark"
          [style.height]="metrics().mark"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient [attr.id]="gradientId" x1="0.1" y1="0" x2="0.9" y2="1">
              <stop offset="0" [attr.stop-color]="gradient.from" />
              <stop offset="0.52" [attr.stop-color]="gradient.via" />
              <stop offset="1" [attr.stop-color]="gradient.to" />
            </linearGradient>
          </defs>

          <!--
            Run-off: one teardrop — thick at the neck where it leaves the bowl,
            heavy at the bulb. Drawn first so the stroke sits on top of it.
          -->
          @if (!mono()) {
            <path
              class="ds-logo__drip"
              d="M17.2 19c.7 3.4-1 5.6-1 8.9a2.4 2.4 0 0 0 4.8 0c0-3.3-1.7-5.5-1-8.9z"
              [attr.fill]="accents.drip"
            />
          }

          <!--
            One stroke, one letter. Round caps give the brush its soft landing;
            the counter of the bowl is negative space, never a cut-out shape.
          -->
          <path
            class="ds-logo__stroke"
            d="M10.6 28.2V6.4h7.1a6.9 6.9 0 0 1 0 13.8h-7.1"
            fill="none"
            [attr.stroke]="mono() ? 'currentColor' : 'url(#' + gradientId + ')'"
            stroke-width="5.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <!-- Wet dab: multiplies into the stroke where the two overlap -->
          @if (!mono()) {
            <ellipse
              class="ds-logo__dab"
              cx="25.1"
              cy="7"
              rx="4.2"
              ry="2.3"
              [attr.fill]="accents.dab"
              transform="rotate(-24 25.1 7)"
            />
          }
        </svg>
      }

      @if (variant() !== 'mark') {
        <span class="ds-logo__text">
          <span class="ds-logo__word" [style.font-size]="metrics().word">
            {{ name }}
            @if (underline()) {
              <!-- Brushed underline: one pass of the accent, slightly off-level -->
              <svg
                class="ds-logo__underline"
                viewBox="0 0 120 10"
                preserveAspectRatio="none"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M2 7.2c18-4 38-5.4 58-3.4s38 3.8 58 1.2"
                  fill="none"
                  [attr.stroke]="accents.dab"
                  stroke-width="4"
                  stroke-linecap="round"
                />
              </svg>
            }
          </span>
          @if (tagline()) {
            <span class="ds-logo__tagline" [class.ds-logo__tagline--under]="underline()">
              {{ taglineText }}
            </span>
          }
        </span>
      }
    </span>
  `,
  styles: `
    :host {
      display: inline-block;
      line-height: 0;
    }

    .ds-logo {
      display: inline-flex;
      align-items: center;
      color: inherit;
    }

    .ds-logo__mark {
      display: block;
      flex-shrink: 0;
      overflow: visible;
    }

    /* The theme decides how pigment mixes (--ds-blend-pigment): wet paint
       darkens on paper, and lightens on a lit canvas. */
    .ds-logo__dab {
      mix-blend-mode: var(--ds-blend-pigment, multiply);
    }

    .ds-logo__text {
      display: inline-flex;
      flex-direction: column;
      justify-content: center;
      line-height: var(--ds-line-height-none, 1);
    }

    .ds-logo__word {
      position: relative;
      font-family: var(--ds-font-display);
      font-weight: var(--ds-font-weight-black, 900);
      letter-spacing: var(--ds-letter-spacing-tighter, -0.04em);
      line-height: 1;
      color: currentColor;
    }

    .ds-logo__underline {
      position: absolute;
      inset-inline: -0.08em;
      inset-block-end: -0.22em;
      width: calc(100% + 0.16em);
      height: 0.3em;
      overflow: visible;
    }

    .ds-logo__tagline {
      margin-top: 0.4em;
      font-family: var(--ds-font-sans);
      font-size: max(0.5em, var(--ds-font-size-xs, 0.75rem));
      font-weight: var(--ds-font-weight-semibold, 600);
      letter-spacing: var(--ds-letter-spacing-wider, 0.04em);
      text-transform: uppercase;
      color: var(--ds-color-text-subtle);
      white-space: nowrap;
    }

    /* The brushed stroke takes the space under the wordmark, so the descriptor
       steps down to stay clear of it. Declared after the base rule on purpose:
       same specificity, so order decides. */
    .ds-logo__tagline--under {
      margin-top: 0.95em;
    }
  `,
})
export class LogoComponent {
  /** `full` = mark + wordmark, `mark` = the brush stroke, `wordmark` = text only. */
  readonly variant = input<LogoVariant>('full');
  /** Brand-approved sizes. */
  readonly size = input<LogoSize>('md');
  /** Show the "Design System" descriptor under the wordmark. */
  readonly tagline = input(false);
  /** Brush the accent underline beneath the wordmark. Display moments only. */
  readonly underline = input(false);
  /** Single-color lockup that inherits `currentColor`. */
  readonly mono = input(false);
  /** Accessible name override (defaults to "Paint · An atomic design system"). */
  readonly label = input<string>('');

  protected readonly name = brand.name;
  protected readonly taglineText = 'Design System';
  protected readonly gradient = brandGradient;
  protected readonly accents = brandAccents;
  /** SVG ids must be unique per instance: several logos can share a page. */
  protected readonly gradientId = `ds-logo-gradient-${uid++}`;

  protected readonly metrics = computed(() => SIZE_MAP[this.size()]);

  protected readonly ariaLabel = computed(() => this.label() || `${brand.name} · ${brand.tagline}`);
}
