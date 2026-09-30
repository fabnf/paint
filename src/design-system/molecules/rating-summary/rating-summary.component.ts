import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LinkComponent } from '../../primitives/link';
import { cx } from '../../primitives/primitives.types';
import { StarRatingComponent } from '../../primitives/star-rating';
import type { Tone } from '../../primitives/tone.types';
import type { ControlSize } from '../../primitives/forms/form-control.types';

export type RatingSummarySize = ControlSize;

/**
 * RatingSummary — the review header: stars, the score, how many said so.
 *
 * Three facts that mean one thing — "4.3 out of 5, from 1,204 reviews" — so a
 * screen reader hears **one** thing. The stars, the number and the count are
 * drawn for the eye and hidden from assistive tech; one visually-hidden sentence
 * says all of it, once. Without that, a rating header is a `role="img"`
 * announcing "4.3 of 5 stars", then a "4.3", then a "1,204 reviews": the same
 * fact three times, in pieces.
 *
 * It is read-only by definition: a summary is what other people said. To ask for
 * a rating, use `<ds-star-rating>` on its own.
 *
 * The review count may be a link — to the reviews themselves. A link has to be
 * reachable, so it cannot hide inside the one sentence; it is then left out of
 * the sentence and speaks for itself: "4.3 out of 5 stars" … "1,204 reviews,
 * link". Two things, because two things is what they are.
 *
 * @example
 * ```html
 * <ds-rating-summary [value]="4.3" [count]="1204" />
 * <ds-rating-summary [value]="4.3" [count]="1204" reviewsHref="#reviews" size="lg" tone="warning" />
 * <ds-rating-summary [value]="null" [count]="0" emptyText="No reviews yet" />
 * ```
 */
@Component({
  selector: 'ds-rating-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StarRatingComponent, LinkComponent],
  template: `
    <div [class]="classes()">
      <!-- The one sentence. Born with the component, so it is read in place. -->
      <span class="visually-hidden">{{ spoken() }}</span>

      <!-- Paint, for the eye. Everything in here is said above. -->
      <span class="ds-rating-summary__visual" aria-hidden="true">
        <ds-star-rating
          class="ds-rating-summary__stars"
          [value]="value()"
          [max]="max()"
          [readOnly]="true"
          [size]="size()"
          [tone]="tone()"
        />
        @if (hasValue()) {
          @if (showScore()) {
            <span class="ds-rating-summary__score">{{ scoreText() }}</span>
          }
          @if (count() !== null && !countIsLink()) {
            <span class="ds-rating-summary__count">{{ countText() }}</span>
          }
        } @else {
          <span class="ds-rating-summary__count">{{ emptyText() }}</span>
        }
      </span>

      @if (countIsLink()) {
        <!-- Reachable, so outside the sentence and the hidden paint. -->
        <ds-link
          class="ds-rating-summary__count ds-rating-summary__count--link"
          variant="subtle"
          [href]="reviewsHref()"
          [link]="reviewsLink()"
          [target]="reviewsTarget()"
        >
          {{ countText() }}
        </ds-link>
      }
    </div>
  `,
  styles: `
    :host {
      display: inline-block;
      vertical-align: middle;
    }

    .ds-rating-summary {
      display: inline-flex;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--ds-space-2);
      font-size: var(--ds-font-size-sm);
      line-height: var(--ds-line-height-snug);
    }

    .ds-rating-summary--lg {
      gap: var(--ds-space-3);
      font-size: var(--ds-font-size-md);
    }

    .ds-rating-summary--sm {
      gap: var(--ds-space-1_5);
      font-size: var(--ds-font-size-xs);
    }

    .ds-rating-summary__visual {
      display: inline-flex;
      align-items: center;
      gap: inherit;
    }

    .ds-rating-summary__score {
      font-weight: var(--ds-font-weight-semibold);
      font-variant-numeric: tabular-nums;
      color: var(--ds-color-text);
    }

    .ds-rating-summary--lg .ds-rating-summary__score {
      font-size: var(--ds-font-size-lg);
    }

    .ds-rating-summary__count {
      color: var(--ds-color-text-muted);
    }

    /* The atom's field rhythm is for forms; here it is one thing in a row. */
    .ds-rating-summary__stars {
      display: inline-flex;
    }
  `,
})
export class RatingSummaryComponent {
  /** The average. `null` for "nobody has said yet". */
  readonly value = input<number | null>(null);
  readonly max = input(5);
  /** How many people said so. `null` leaves it out. */
  readonly count = input<number | null>(null);
  /** Decimal places of the visible score. */
  readonly precision = input(1);
  /** Hide the number and keep the stars — when the number is shown elsewhere. */
  readonly showScore = input(true);
  /** How the count is written and spoken. */
  readonly countLabel = input<(count: number) => string>((count) =>
    count === 1 ? '1 review' : `${count.toLocaleString()} reviews`,
  );
  /** What to say when there is no rating. */
  readonly emptyText = input<string>('No reviews yet');
  /** Replaces the spoken sentence entirely. */
  readonly valueText = input<string>('');
  /** Makes the count a link to the reviews. Reachable, so spoken on its own. */
  readonly reviewsHref = input<string | null>(null);
  readonly reviewsLink = input<string | unknown[] | null>(null);
  readonly reviewsTarget = input<string | null>(null);
  readonly size = input<RatingSummarySize>('md');
  readonly tone = input<Tone>('primary');

  protected readonly hasValue = computed(() => {
    const value = this.value();
    return value !== null && Number.isFinite(value);
  });

  protected readonly scoreText = computed(() =>
    this.hasValue() ? this.value()!.toFixed(this.precision()) : '',
  );

  protected readonly countText = computed(() => {
    const count = this.count();
    return count === null ? '' : this.countLabel()(count);
  });

  protected readonly countIsLink = computed(
    () => this.count() !== null && (!!this.reviewsHref() || !!this.reviewsLink()),
  );

  /** "4.3 out of 5 stars, 1,204 reviews" — or the words for nothing. */
  protected readonly spoken = computed(() => {
    if (this.valueText()) {
      return this.valueText();
    }
    if (!this.hasValue()) {
      return this.emptyText();
    }
    const base = `${this.scoreText()} out of ${this.max()} stars`;
    return this.count() !== null && !this.countIsLink() ? `${base}, ${this.countText()}` : base;
  });

  protected readonly classes = computed(() =>
    cx('ds-rating-summary', `ds-rating-summary--${this.size()}`),
  );
}
