import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { cx, type Radius } from '../primitives.types';

export type SkeletonVariant = 'text' | 'circle' | 'rect';
export type SkeletonAnimation = 'pulse' | 'wave' | 'none';

/**
 * Skeleton — the "what is coming" atom.
 *
 * A grey ghost in the shape of the content that is loading. It beats a spinner
 * for anything with a known layout, because it says *what* is arriving and stops
 * the page jumping when it does — the skeleton must therefore be the size of the
 * real thing, not a polite approximation of it.
 *
 * Silent by default: `aria-hidden`, because a dozen announcing rectangles is
 * noise. Say it once, on the region that owns them — `aria-busy="true"` plus a
 * live region, or a single `<ds-skeleton label="Loading invoices…">`.
 *
 * Built on Bootstrap's `.placeholder`, re-pointed at Paint's skeleton token so
 * it is not tied to whatever `currentColor` happens to be.
 *
 * @example
 * ```html
 * <ds-skeleton [lines]="3" />
 * <ds-skeleton variant="circle" width="2.5rem" />
 * <ds-skeleton variant="rect" height="8rem" radius="lg" animation="wave" />
 *
 * <div [attr.aria-busy]="loading()">
 *   <ds-skeleton label="Loading invoices…" [lines]="4" />
 * </div>
 * ```
 */
@Component({
  selector: 'ds-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (label()) {
      <span class="visually-hidden">{{ label() }}</span>
    }

    @for (line of lineList(); track $index; let last = $last) {
      <span
        [class]="lineClasses()"
        [style.width]="last && lines() > 1 ? lastLineWidth() : width()"
        [style.height]="height()"
        [style.border-radius]="radiusValue()"
        aria-hidden="true"
      ></span>
    }
  `,
  styles: `
    :host {
      display: block;
      /* The ghost is the size of what is coming; the caller sizes the host. */
      max-width: 100%;
    }

    :host(.ds-skeleton--inline) {
      display: inline-flex;
      vertical-align: middle;
    }

    .ds-skeleton__line {
      display: block;
      min-height: 0;
    }

    .ds-skeleton__line + .ds-skeleton__line {
      margin-block-start: var(--ds-space-2);
    }

    .ds-skeleton__line--text {
      /* A line of body text, so four of them are four lines tall. */
      height: 0.75em;
      margin-block: 0.2em;
      border-radius: var(--ds-radius-full);
    }

    .ds-skeleton__line--circle {
      aspect-ratio: 1;
      border-radius: var(--ds-radius-full);
    }

    /*
     * A skeleton that pulses is a skeleton that moves. Reduced motion keeps the
     * shape — which is the information — and drops the animation
     * (styles/bootstrap.scss turns off .placeholder-glow / .placeholder-wave).
     */
    @media (forced-colors: active) {
      .ds-skeleton__line {
        outline: 1px solid CanvasText;
      }
    }
  `,
  host: {
    '[class]': 'hostClasses()',
    '[attr.role]': 'label() ? "status" : null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
  },
})
export class SkeletonComponent {
  /** `text` is a line of type; `circle` an avatar; `rect` a card, image or chart. */
  readonly variant = input<SkeletonVariant>('text');
  /** How many lines. Only meaningful for `text`; the last one is short, like prose. */
  readonly lines = input(1);
  /** CSS length. Defaults to the full width of the host. */
  readonly width = input<string>('100%');
  /** CSS length. `text` takes its height from the type ramp. */
  readonly height = input<string | null>(null);
  /** Width of the last line of a multi-line text skeleton. */
  readonly lastLineWidth = input<string>('60%');
  /** Radius token. `text` and `circle` ignore it — they are already round. */
  readonly radius = input<Radius | null>(null);
  readonly animation = input<SkeletonAnimation>('pulse');
  /** Sit in a line of text rather than own a block. */
  readonly inline = input(false);
  /**
   * Makes this skeleton the one that speaks: `role="status"` with a hidden name.
   * Use it once per loading region, never once per line.
   */
  readonly label = input<string>('');

  /** `@for` needs something to iterate; the index is the only thing that matters. */
  protected readonly lineList = computed(() =>
    Array.from({ length: Math.max(1, this.lines()) }, (_, index) => index),
  );

  protected readonly radiusValue = computed(() => {
    const radius = this.radius();
    if (radius) {
      return `var(--ds-radius-${radius})`;
    }
    return this.variant() === 'rect' ? 'var(--ds-radius-md)' : null;
  });

  /** Bootstrap drives both animations from the *parent* of a `.placeholder`. */
  protected readonly hostClasses = computed(() =>
    cx(
      'ds-skeleton',
      this.inline() && 'ds-skeleton--inline',
      this.animation() === 'pulse' && 'placeholder-glow',
      this.animation() === 'wave' && 'placeholder-wave',
    ),
  );

  protected readonly lineClasses = computed(() =>
    cx('placeholder', 'ds-skeleton__line', `ds-skeleton__line--${this.variant()}`),
  );
}
