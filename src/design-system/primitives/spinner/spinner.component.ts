import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { cx } from '../primitives.types';
import { toneClass, type Tone } from '../tone.types';

/** A spinner inside something already coloured — a filled button — takes its ink. */
export type SpinnerTone = Tone | 'inherit';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

const SIZE_REM: Record<SpinnerSize, string> = {
  xs: '0.75rem',
  sm: '1rem',
  md: '1.5rem',
  lg: '2.5rem',
};

/**
 * Spinner — the indeterminate-wait atom.
 *
 * Bootstrap's `.spinner-border`, painted from a tone and named out loud. Use it
 * when the wait has no length: as soon as you can say "4 of 10", use
 * `<ds-progress>`; if the shape of what is coming is known, use
 * `<ds-skeleton>`, which tells the user *what* is loading, not just *that*.
 *
 * By default it is a live region (`role="status"`) with a visually hidden name,
 * so a screen reader hears "Loading…" when it appears. Inside a control that is
 * already saying so — a `<ds-button [loading]="true">` sets `aria-busy` — pass
 * `decorative` and stay quiet.
 *
 * @example
 * ```html
 * <ds-spinner />
 * <ds-spinner size="lg" tone="primary" label="Loading invoices…" />
 * <ds-spinner size="xs" tone="inherit" [decorative]="true" />
 * ```
 */
@Component({
  selector: 'ds-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      [class]="classes()"
      [style.width]="dimension()"
      [style.height]="dimension()"
      [attr.role]="decorative() ? null : 'status'"
      [attr.aria-hidden]="decorative() ? 'true' : null"
    >
      @if (!decorative()) {
        <span class="visually-hidden">{{ label() }}</span>
      }
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      vertical-align: middle;
      line-height: 0;
    }

    .ds-spinner {
      /* No tone class means no --ds-tone-fg, and colour inherits. */
      color: var(--ds-tone-fg, currentcolor);
      /* Bootstrap scales the border with the font; Paint scales it with the
         spinner, so a 40px spinner is not drawn with a 2px hairline. */
      border-width: max(0.09em, 1.5px);
      /* The track: the ring people see it spin against. */
      border-color: color-mix(in srgb, currentcolor 22%, transparent);
      border-right-color: currentcolor;
    }

    /*
     * Reduced motion: a spinner that cannot spin must still say something, so it
     * pulses instead of disappearing. The live region carries the rest.
     */
    @media (prefers-reduced-motion: reduce) {
      .ds-spinner {
        animation: ds-spinner-fade 1.6s ease-in-out infinite;
      }

      @keyframes ds-spinner-fade {
        0%,
        100% {
          opacity: 0.35;
        }
        50% {
          opacity: 1;
        }
      }
    }
  `,
})
export class SpinnerComponent {
  readonly size = input<SpinnerSize>('md');
  /** `inherit` takes the surrounding `currentColor` — a spinner in a filled button. */
  readonly tone = input<SpinnerTone>('primary');
  /** What is being waited for. Announced once, politely, when the spinner appears. */
  readonly label = input<string>('Loading…');
  /** Silences the spinner: no role, no name. For controls that already say they are busy. */
  readonly decorative = input(false);

  protected readonly dimension = computed(() => SIZE_REM[this.size()]);

  protected readonly classes = computed(() => {
    const tone = this.tone();
    return cx('spinner-border', 'ds-spinner', tone !== 'inherit' && toneClass(tone));
  });
}
