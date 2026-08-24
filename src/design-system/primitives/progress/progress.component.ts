import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { uniqueId } from '../../utils';
import { cx } from '../primitives.types';
import { toneClass, type Tone } from '../tone.types';

export type ProgressSize = 'sm' | 'md' | 'lg';

/**
 * Progress — the determinate-wait atom.
 *
 * Bootstrap's `.progress` / `.progress-bar`, driven by a value and named out
 * loud. Use it the moment the wait has a length; a `<ds-spinner>` is for when it
 * does not, and a `<ds-skeleton>` for when the shape of the answer is known.
 *
 * `indeterminate` keeps the bar and drops the number: the work is real, its end
 * is not yet known. The ARIA is different too — no `aria-valuenow`, which is
 * what tells a screen reader "in progress, amount unknown".
 *
 * @example
 * ```html
 * <ds-progress label="Uploading" [value]="62" [showValue]="true" />
 * <ds-progress label="Storage" [value]="18" [max]="20" valueText="18 of 20 GB used" tone="warning" />
 * <ds-progress label="Syncing" [indeterminate]="true" size="sm" />
 * ```
 */
@Component({
  selector: 'ds-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (label() && !hideLabel()) {
      <div class="ds-progress__header">
        <span class="ds-progress__label" [id]="labelId">{{ label() }}</span>
        @if (showValue() && !indeterminate()) {
          <span class="ds-progress__value">{{ valueLabel() }}</span>
        }
      </div>
    }

    <div
      [class]="trackClasses()"
      role="progressbar"
      [attr.aria-valuenow]="indeterminate() ? null : clamped()"
      [attr.aria-valuemin]="indeterminate() ? null : 0"
      [attr.aria-valuemax]="indeterminate() ? null : max()"
      [attr.aria-valuetext]="indeterminate() ? null : valueText() || null"
      [attr.aria-labelledby]="labelledByAttr()"
      [attr.aria-label]="ariaLabelAttr()"
      [attr.aria-describedby]="describedBy() || null"
    >
      <div
        class="progress-bar ds-progress__bar"
        [style.width.%]="indeterminate() ? null : percent()"
      ></div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .ds-progress__header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--ds-space-3);
      margin-block-end: var(--ds-space-1_5);
    }

    .ds-progress__label {
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-semibold);
      color: var(--ds-color-text);
    }

    .ds-progress__value {
      font-family: var(--ds-font-mono);
      font-size: var(--ds-font-size-xs);
      font-variant-numeric: tabular-nums;
      color: var(--ds-color-text-muted);
    }

    .ds-progress__track {
      --bs-progress-bar-bg: var(--ds-tone-solid);
      height: var(--ds-progress-height);
    }

    .ds-progress__track--sm {
      --ds-progress-height: 0.25rem;
    }

    .ds-progress__track--md {
      --ds-progress-height: 0.5rem;
    }

    .ds-progress__track--lg {
      --ds-progress-height: 0.75rem;
    }

    /*
     * Indeterminate: a short bar that crosses the track. It is not a value, and
     * it must never look like one — so it is 35% wide and never rests.
     */
    .ds-progress__track--indeterminate .ds-progress__bar {
      width: 35%;
      border-radius: var(--ds-radius-full);
      animation: ds-progress-slide calc(var(--ds-motion-pulse) * 1.1) ease-in-out infinite;
    }

    /* The bar is 35% of the track, so 286% of *its own* width is one full pass. */
    @keyframes ds-progress-slide {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(286%);
      }
    }

    /* A known-length wait animates its width; an unknown one slides. */
    .ds-progress__bar {
      transition: width 400ms ease;
    }

    @media (prefers-reduced-motion: reduce) {
      .ds-progress__bar {
        transition: none;
      }

      /* The bar still has to say "something is happening". */
      .ds-progress__track--indeterminate .ds-progress__bar {
        animation: ds-progress-fade 2s ease-in-out infinite;
        transform: none;
        width: 100%;
      }

      @keyframes ds-progress-fade {
        0%,
        100% {
          opacity: 0.35;
        }
        50% {
          opacity: 1;
        }
      }
    }

    @media (forced-colors: active) {
      .ds-progress__bar {
        background-color: Highlight;
      }
    }
  `,
})
export class ProgressComponent {
  /** How far along, between 0 and `max`. */
  readonly value = input(0);
  readonly max = input(100);
  /** The work is real; its end is not yet known. Drops `aria-valuenow`. */
  readonly indeterminate = input(false);
  /** Visible label above the bar. Also becomes the bar's accessible name. */
  readonly label = input<string>('');
  /** Accessible name when there is no visible label. */
  readonly ariaLabel = input<string>('');
  /** Id of a label elsewhere on the page. Takes precedence over `label`. */
  readonly labelledBy = input<string>('');
  readonly describedBy = input<string>('');
  /** Keep the name, lose the header row. */
  readonly hideLabel = input(false);
  /** Show the percentage (or `valueText`) next to the label. */
  readonly showValue = input(false);
  /**
   * What the number means, for a screen reader: `"18 of 20 GB used"` beats
   * `"90"`. Displayed instead of the percentage when `showValue` is on.
   */
  readonly valueText = input<string>('');
  readonly tone = input<Tone>('primary');
  readonly size = input<ProgressSize>('md');

  protected readonly labelId = uniqueId('ds-progress-label');

  /** A bar cannot be 120% full, and a negative bar is a bug upstream. */
  protected readonly clamped = computed(() =>
    Math.min(Math.max(this.value(), 0), Math.max(this.max(), 0)),
  );

  protected readonly percent = computed(() => {
    const max = this.max();
    return max > 0 ? (this.clamped() / max) * 100 : 0;
  });

  protected readonly valueLabel = computed(
    () => this.valueText() || `${Math.round(this.percent())}%`,
  );

  /** Named by its own visible label when it has one, by the consumer otherwise. */
  protected readonly labelledByAttr = computed(() => {
    const external = this.labelledBy();
    if (external) {
      return external;
    }
    return this.label() && !this.hideLabel() ? this.labelId : null;
  });

  protected readonly ariaLabelAttr = computed(() => {
    if (this.labelledByAttr()) {
      return null;
    }
    return this.ariaLabel() || this.label() || null;
  });

  protected readonly trackClasses = computed(() =>
    cx(
      'progress',
      'ds-progress__track',
      `ds-progress__track--${this.size()}`,
      toneClass(this.tone()),
      this.indeterminate() && 'ds-progress__track--indeterminate',
    ),
  );
}
