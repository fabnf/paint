import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DS_PRIMITIVES, type StarRatingValue } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * StarRating — documentation page.
 */
@Component({
  selector: 'app-star-rating-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DOC_UI, ReactiveFormsModule],
  templateUrl: './star-rating.page.html',
  styleUrl: './primitives-page.scss',
})
export class StarRatingPage {
  readonly rating = signal<StarRatingValue>(3);
  readonly service = signal<StarRatingValue>(null);

  readonly words = ['Terrible', 'Poor', 'OK', 'Good', 'Great'] as const;

  /** A product's average, as a product would hold it: a float and a count. */
  readonly average = signal(3.5);
  readonly reviews = 1204;
  readonly averageText = computed(
    () => `Rated ${this.average()} out of 5 by ${this.reviews.toLocaleString()} people`,
  );

  /** Validation demo: the message appears once the group has been left. */
  readonly control = new FormControl<StarRatingValue>(null, Validators.required);

  /** Recomputed on every change-detection pass — fine for a demo field. */
  liveError(): string {
    return this.control.touched && this.control.invalid ? 'Please rate the food.' : '';
  }

  nudge(delta: number): void {
    this.average.update((value) => Math.round(Math.min(5, Math.max(0, value + delta)) * 10) / 10);
  }

  readonly readOnlySnippet = `<!-- One image, named "3.5 of 5 stars". Half stars when the value has a half in it. -->
<ds-star-rating [value]="3.5" [readOnly]="true" ariaLabel="Average rating" />

<!-- Say what the number means, and show it -->
<ds-star-rating
  label="Average"
  [value]="average()"
  [readOnly]="true"
  [showValue]="true"
  [valueText]="'Rated ' + average() + ' out of 5 by 1,204 people'"
/>`;

  readonly editableSnippet = `<!-- A native radio group: Tab lands on the chosen star, the arrows move and choose -->
<ds-star-rating label="Your rating" [(value)]="rating" [clearable]="true" hint="Click the chosen star again to clear." />`;

  readonly labelsSnippet = `<!-- Each radio is named "4 stars, Good"; the word is the visible value -->
<ds-star-rating
  label="Service"
  [starLabels]="['Terrible', 'Poor', 'OK', 'Good', 'Great']"
  [showValue]="true"
  [(value)]="service"
/>`;

  readonly formSnippet = `readonly control = new FormControl<number | null>(null, Validators.required);

// template
<ds-star-rating
  label="Food"
  [formControl]="control"
  [error]="control.touched && control.invalid ? 'Please rate the food.' : ''"
/>`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'value', type: 'model<number | null>', default: 'null', description: 'The rating. Whole numbers when editing; halves show when reading. null is “not rated”.' },
    { name: 'max', type: 'number', default: '5', description: 'How many stars.' },
    { name: 'readOnly', type: 'boolean', default: 'false', description: 'Reading, not rating: one role="img" that says the number, and nothing to focus.' },
    { name: 'clearable', type: 'boolean', default: 'false', description: 'Clicking the chosen star again — or Backspace / Delete — clears the rating.' },
    { name: 'showValue', type: 'boolean', default: 'false', description: 'Show the number (or the star’s word) next to the stars.' },
    { name: 'starLabels', type: 'readonly string[] | null', default: 'null', description: 'A word per star, first to last. Joins each radio’s name; the visible value when showValue is on.' },
    { name: 'valueText', type: 'string', default: `''`, description: 'What a screen reader hears instead of “3 of 5 stars”.' },
    { name: 'emptyText', type: 'string', default: `'Not rated'`, description: 'What a screen reader hears for no rating at all.' },
    { name: 'tone', type: 'Tone', default: `'primary'`, description: 'Colour of the painted stars. warning for the classic gold.' },
    { name: 'label', type: 'string', default: `''`, description: 'Visible label. Names the group through aria-labelledby — a <label for> can only point at one radio.' },
    { name: 'ariaLabel', type: 'string', default: `''`, description: 'Accessible name when there is no visible label.' },
    { name: 'hint', type: 'string', default: `''`, description: 'Helper text under the stars. Wired into aria-describedby.' },
    { name: 'error', type: 'string', default: `''`, description: 'Error text. Implies invalid, announced politely, joins aria-describedby.' },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Star size, from the control scale.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'aria-required on the group, required on every radio.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Paints the invalid state without a message.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables every radio. Forms can disable it too.' },
    { name: 'id / name', type: 'string', default: `''`, description: 'Id of the group; name shared by the radios. Both generated when omitted.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'changed', type: 'OutputEmitterRef<number | null>', default: '—', description: 'Emits on user interaction only — a choice or a clear — never when a form writes the value in.' },
    { name: 'valueChange', type: 'OutputEmitterRef<number | null>', default: '—', description: 'The model output behind [(value)].' },
  ];
}