import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DS_COMPONENTS, DS_PRIMITIVES } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * RatingSummary — documentation page.
 */
@Component({
  selector: 'app-rating-summary-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI],
  templateUrl: './rating-summary.page.html',
  styleUrl: './components-page.scss',
})
export class RatingSummaryPage {
  /** A product, as a product would hold it: a float and a count. */
  readonly average = signal(4.3);
  readonly reviews = signal(1204);

  readonly spoken = computed(
    () => `${this.average().toFixed(1)} out of 5 stars, ${this.reviews().toLocaleString()} reviews`,
  );

  nudge(delta: number): void {
    this.average.update((value) => Math.round(Math.min(5, Math.max(0, value + delta)) * 10) / 10);
    this.reviews.update((value) => value + 1);
  }

  readonly basicSnippet = `<!-- Said once: "4.3 out of 5 stars, 1,204 reviews" -->
<ds-rating-summary [value]="4.3" [count]="1204" />`;

  readonly linkSnippet = `<!-- The count is a real link, so it is left out of the sentence and speaks for itself -->
<ds-rating-summary [value]="4.3" [count]="1204" reviewsHref="#reviews" />`;

  readonly variantsSnippet = `<ds-rating-summary [value]="4.3" [count]="1204" size="lg" tone="warning" />
<ds-rating-summary [value]="4.3" [count]="1204" [showScore]="false" size="sm" />
<ds-rating-summary [value]="4.3" [precision]="2" />
<ds-rating-summary [value]="null" [count]="0" emptyText="No reviews yet" />`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'value', type: 'number | null', default: 'null', description: 'The average. null for “nobody has said yet”.' },
    { name: 'max', type: 'number', default: '5', description: 'How many stars.' },
    { name: 'count', type: 'number | null', default: 'null', description: 'How many people said so. null leaves it out.' },
    { name: 'precision', type: 'number', default: '1', description: 'Decimal places of the visible (and spoken) score.' },
    { name: 'showScore', type: 'boolean', default: 'true', description: 'Hide the number and keep the stars.' },
    { name: 'countLabel', type: '(count: number) => string', default: '“n reviews”', description: 'How the count is written and spoken.' },
    { name: 'emptyText', type: 'string', default: `'No reviews yet'`, description: 'What to say when there is no rating.' },
    { name: 'valueText', type: 'string', default: `''`, description: 'Replaces the spoken sentence entirely.' },
    { name: 'reviewsHref / reviewsLink / reviewsTarget', type: 'string | null', default: 'null', description: 'Makes the count a link to the reviews. Reachable, so spoken on its own.' },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Star and type scale.' },
    { name: 'tone', type: 'Tone', default: `'primary'`, description: 'Colour of the painted stars.' },
  ];
}