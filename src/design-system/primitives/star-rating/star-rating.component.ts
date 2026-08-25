import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { iconRegistry } from '../../icons';
import { FieldLabelComponent, FieldMessagesComponent } from '../forms/field-chrome.component';
import { FormControlBase } from '../forms/form-control.base';
import { cx } from '../primitives.types';
import { toneClass, type Tone } from '../tone.types';

/** A rating, or `null` for "not rated". */
export type StarRatingValue = number | null;

interface Star {
  /** 1-based. */
  readonly index: number;
  /** The radio's accessible name: "3 stars", or "3 stars, Good". */
  readonly label: string;
  /** How much of the star is painted: 0, 0.5 or 1. */
  readonly fill: number;
}

/**
 * Snaps a fill fraction to the nearest half — the only fractions a star can
 * show without looking like a rendering bug.
 */
export function halfStarFill(fraction: number): number {
  return Math.round(Math.min(Math.max(fraction, 0), 1) * 2) / 2;
}

/**
 * StarRating — the rating atom.
 *
 * Stars, for reading a rating and for giving one. The two are different
 * controls wearing the same paint:
 *
 * - **Read-only** (`readOnly`) — one `role="img"` named "3.5 of 5 stars". Half
 *   stars are drawn when the value has a half in it; anything finer rounds.
 *   Nothing is focusable; there is nothing to do.
 * - **Editable** — a native radio group, one visually-hidden radio per star,
 *   with the star as its label. Tab lands on the chosen star (or the first),
 *   the arrow keys move and choose, `Space` chooses, and every radio is named
 *   — "3 stars", or "3 stars, Good" when `starLabels` are given. The platform
 *   owns the keyboard; Paint adds one key: `Backspace`/`Delete` clears, when
 *   `clearable`. Clicking the chosen star again clears too.
 *
 * Hovering previews the rating a click would give. Whole stars only when
 * editing: nobody means three and a half.
 *
 * Implements `ControlValueAccessor` and the same field contract as the other
 * form atoms — label, hint, error, disabled — and adopts a `<ds-form-field>`
 * when written inside one.
 *
 * @example
 * ```html
 * <ds-star-rating [value]="3.5" [readOnly]="true" ariaLabel="Average rating" />
 * <ds-star-rating label="Your rating" [(value)]="rating" [clearable]="true" />
 * <ds-star-rating label="Service" [starLabels]="['Terrible', 'Poor', 'OK', 'Good', 'Great']"
 *                 [showValue]="true" formControlName="service" />
 * ```
 */
@Component({
  selector: 'ds-star-rating',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, FieldLabelComponent, FieldMessagesComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => StarRatingComponent),
      multi: true,
    },
  ],
  template: `
    <div [class]="fieldClasses()">
      @if (label()) {
        <!-- Names the group through aria-labelledby: a <label for> can only
             point at one radio, and the rating is all of them. -->
        <ds-field-label
          [labelId]="labelId()"
          [text]="label()"
          [required]="isRequired()"
          [disabled]="isDisabled()"
        />
      }

      <div class="ds-star-rating__row">
        @if (readOnly()) {
          <div
            [class]="starsClasses()"
            role="img"
            [id]="controlId()"
            [attr.aria-labelledby]="readOnlyLabelledBy()"
            [attr.aria-label]="readOnlyLabelledBy() ? null : readOnlyName()"
            [attr.aria-describedby]="describedByIds()"
          >
            @for (star of stars(); track star.index) {
              <span class="ds-star-rating__star" aria-hidden="true">
                <ng-container *ngTemplateOutlet="glyph; context: { fill: star.fill }" />
              </span>
            }
          </div>
          @if (readOnlyLabelledBy()) {
            <!-- Outside the image, so aria-labelledby can reach it. -->
            <span class="visually-hidden" [id]="valueId()">{{ spokenValue() }}</span>
          }
        } @else {
          <div
            [class]="starsClasses()"
            role="radiogroup"
            [id]="controlId()"
            [attr.aria-labelledby]="groupLabelledBy()"
            [attr.aria-label]="groupLabelledBy() ? null : ariaLabelAttr()"
            [attr.aria-describedby]="describedByIds()"
            [attr.aria-invalid]="ariaInvalid()"
            [attr.aria-required]="isRequired() ? 'true' : null"
            (mouseleave)="hovered.set(null)"
            (keydown)="onKeydown($event)"
          >
            @for (star of stars(); track star.index) {
              <!--
                A real radio, off screen. Its label is the star, so a click on
                the star is a click on the radio; the focus ring is drawn on the
                star when the radio has keyboard focus.
              -->
              <input
                type="radio"
                class="ds-star-rating__input visually-hidden"
                [id]="starId(star.index)"
                [name]="groupName()"
                [value]="star.index"
                [checked]="checkedIndex() === star.index"
                [disabled]="isDisabled()"
                [required]="isRequired()"
                [attr.aria-label]="star.label"
                (change)="select(star.index)"
                (click)="onStarClick(star.index)"
                (blur)="markTouched()"
              />
              <label
                class="ds-star-rating__star"
                [for]="starId(star.index)"
                (mouseenter)="preview(star.index)"
              >
                <ng-container *ngTemplateOutlet="glyph; context: { fill: star.fill }" />
              </label>
            }
          </div>
        }

        @if (showValue()) {
          <!-- The image / group already says it; the visible text is for eyes. -->
          <span class="ds-star-rating__value" aria-hidden="true">{{ visibleValue() }}</span>
        }
      </div>

      <ds-field-messages
        [class.ds-field__messages--spaced]="hasMessage()"
        [hint]="hint()"
        [hintId]="hintId()"
        [error]="error()"
        [errorId]="errorId()"
      />
    </div>

    <!--
      One star: the empty shape, and the painted shape on top of it clipped to
      the fill. The clip is a width, so a half star is exactly half — and on the
      leading side in either writing direction.
    -->
    <ng-template #glyph let-fill="fill">
      <svg class="ds-star-rating__glyph ds-star-rating__glyph--empty" [attr.viewBox]="viewBox" focusable="false">
        <path [attr.d]="path" />
      </svg>
      <span class="ds-star-rating__fill" [style.width.%]="fill * 100">
        <svg class="ds-star-rating__glyph ds-star-rating__glyph--full" [attr.viewBox]="viewBox" focusable="false">
          <path [attr.d]="path" />
        </svg>
      </span>
    </ng-template>
  `,
  styles: `
    :host {
      display: block;
    }

    .ds-field {
      --ds-star-size: 1.25rem;
      --ds-star-gap: var(--ds-space-0_5);
    }

    .ds-field--sm {
      --ds-star-size: 1rem;
    }

    .ds-field--lg {
      --ds-star-size: 1.75rem;
      --ds-star-gap: var(--ds-space-1);
    }

    .ds-star-rating__row {
      display: flex;
      align-items: center;
      gap: var(--ds-space-2);
    }

    .ds-star-rating__stars {
      display: inline-flex;
      align-items: center;
      gap: var(--ds-star-gap);
      /* Room for the focus ring, which would otherwise be clipped by a row. */
      padding: 2px;
      margin: -2px;
      border-radius: var(--ds-radius-sm);
    }

    .ds-star-rating__star {
      position: relative;
      display: inline-block;
      width: var(--ds-star-size);
      height: var(--ds-star-size);
      margin: 0;
      line-height: 0;
      border-radius: var(--ds-radius-sm);
    }

    .ds-star-rating__stars--editable .ds-star-rating__star {
      cursor: pointer;
    }

    .ds-star-rating__stars--disabled .ds-star-rating__star {
      cursor: not-allowed;
      opacity: 0.55;
    }

    .ds-star-rating__glyph {
      display: block;
      width: var(--ds-star-size);
      height: var(--ds-star-size);
    }

    .ds-star-rating__glyph--empty {
      fill: var(--ds-color-border-strong);
    }

    .ds-star-rating__glyph--full {
      fill: var(--ds-tone-solid);
    }

    .ds-star-rating__fill {
      position: absolute;
      inset-block: 0;
      inset-inline-start: 0;
      overflow: hidden;
      transition: width 120ms ease;
    }

    /* A hovered preview is a question, not an answer: paler than the real thing. */
    .ds-star-rating__stars--previewing .ds-star-rating__glyph--full {
      fill: color-mix(in srgb, var(--ds-tone-solid) 70%, var(--ds-color-surface));
    }

    .ds-star-rating__input:focus-visible + .ds-star-rating__star {
      outline: 2px solid var(--ds-color-focus-ring);
      outline-offset: 1px;
    }

    .ds-star-rating__stars--invalid .ds-star-rating__glyph--empty {
      fill: color-mix(in srgb, var(--ds-color-danger) 35%, var(--ds-color-surface));
    }

    .ds-star-rating__value {
      font-size: var(--ds-font-size-sm);
      font-variant-numeric: tabular-nums;
      color: var(--ds-color-text-muted);
    }

    @media (forced-colors: active) {
      .ds-star-rating__glyph--empty {
        fill: Canvas;
        stroke: CanvasText;
        stroke-width: 1.5;
      }

      .ds-star-rating__glyph--full {
        fill: Highlight;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ds-star-rating__fill {
        transition: none;
      }
    }
  `,
})
export class StarRatingComponent extends FormControlBase<StarRatingValue> {
  /** The rating. Whole numbers when editing; halves show when reading. */
  readonly value = model<StarRatingValue>(null);
  /** How many stars. Five, unless the product has a reason. */
  readonly max = input(5);
  /** Reading, not rating: a `role="img"` that says the number, and nothing to focus. */
  readonly readOnly = input(false);
  /** Clicking the chosen star again — or `Backspace` — clears the rating. */
  readonly clearable = input(false);
  /** Show the number (or the star's word) next to the stars. */
  readonly showValue = input(false);
  /**
   * A word per star, first to last: `['Terrible', 'Poor', 'OK', 'Good', 'Great']`.
   * Joins each radio's name, and is the visible value when `showValue` is on.
   */
  readonly starLabels = input<readonly string[] | null>(null);
  /** What a screen reader hears instead of "3 of 5 stars". */
  readonly valueText = input<string>('');
  /** What a screen reader hears for no rating at all. */
  readonly emptyText = input<string>('Not rated');
  /** Colour of the painted stars. */
  readonly tone = input<Tone>('primary');

  /** Emits on user interaction only — never when a form writes the value in. */
  readonly changed = output<StarRatingValue>();

  protected readonly viewBox = iconRegistry.star.viewBox;
  protected readonly path = iconRegistry.star.paths[0];

  /** The star under the pointer, while there is one. */
  protected readonly hovered = signal<number | null>(null);

  protected readonly valueId = computed(() => `${this.controlId()}-value`);
  protected readonly groupName = computed(() => this.name() || this.controlId());

  protected starId(index: number): string {
    return `${this.controlId()}-star-${index}`;
  }

  /** Which radio is on. A form may write `3.7`; the group can only show `4`. */
  protected readonly checkedIndex = computed(() => {
    const value = this.value();
    if (value === null || !Number.isFinite(value)) {
      return null;
    }
    const rounded = Math.round(value);
    return rounded >= 1 && rounded <= this.max() ? rounded : null;
  });

  /** What the stars show: the preview while hovering, the value otherwise. */
  protected readonly shown = computed<number | null>(() => {
    const hovered = this.hovered();
    if (hovered !== null) {
      return hovered;
    }
    return this.readOnly() ? this.value() : this.checkedIndex();
  });

  protected readonly stars = computed<Star[]>(() => {
    const count = Math.max(0, Math.floor(this.max()));
    const shown = this.shown() ?? 0;
    const labels = this.starLabels();
    return Array.from({ length: count }, (_, i) => {
      const index = i + 1;
      const word = labels?.[i];
      const plural = `${index} ${index === 1 ? 'star' : 'stars'}`;
      return {
        index,
        label: word ? `${plural}, ${word}` : plural,
        fill: this.readOnly() ? halfStarFill(shown - i) : shown >= index ? 1 : 0,
      };
    });
  });

  /** "3.5 of 5 stars" — or the consumer's words, or the words for nothing. */
  protected readonly spokenValue = computed(() => {
    if (this.valueText()) {
      return this.valueText();
    }
    const value = this.readOnly() ? this.value() : this.checkedIndex();
    if (value === null || !Number.isFinite(value)) {
      return this.emptyText();
    }
    const labels = this.starLabels();
    const word = Number.isInteger(value) ? labels?.[value - 1] : undefined;
    const base = `${value} of ${this.max()} stars`;
    return word ? `${base}, ${word}` : base;
  });

  protected readonly visibleValue = computed(() => {
    const shown = this.shown();
    if (shown === null) {
      return '';
    }
    const word = this.starLabels()?.[Math.round(shown) - 1];
    return word ?? String(shown);
  });

  /** Own label, or the field's — a radio group has no `<label for>` to lean on. */
  protected readonly groupLabelledBy = computed(() => {
    if (this.label()) {
      return this.labelId();
    }
    return this.field?.labelId() ?? null;
  });

  /** The image is named by the label *and* the value: "Average rating 3.5 of 5 stars". */
  protected readonly readOnlyLabelledBy = computed(() => {
    const label = this.groupLabelledBy();
    return label ? `${label} ${this.valueId()}` : null;
  });

  protected readonly readOnlyName = computed(() => {
    const name = this.ariaLabel();
    return name ? `${name}, ${this.spokenValue()}` : this.spokenValue();
  });

  protected readonly fieldClasses = computed(() => cx('ds-field', `ds-field--${this.size()}`));

  protected readonly starsClasses = computed(() =>
    cx(
      'ds-star-rating__stars',
      toneClass(this.tone()),
      this.readOnly() ? 'ds-star-rating__stars--readonly' : 'ds-star-rating__stars--editable',
      this.isDisabled() && 'ds-star-rating__stars--disabled',
      this.isInvalid() && 'ds-star-rating__stars--invalid',
      this.hovered() !== null && 'ds-star-rating__stars--previewing',
    ),
  );

  protected preview(index: number): void {
    if (!this.isDisabled()) {
      this.hovered.set(index);
    }
  }

  protected select(index: number): void {
    if (this.isDisabled()) {
      return;
    }
    this.commit(index);
  }

  /** A click on the star that is already chosen takes the rating back. */
  protected onStarClick(index: number): void {
    if (this.clearable() && !this.isDisabled() && this.checkedIndex() === index) {
      this.commit(null);
    }
  }

  /**
   * The arrows, Space and Tab are the radio group's own. Paint adds the one
   * thing a radio group cannot do natively: un-choosing.
   */
  protected onKeydown(event: KeyboardEvent): void {
    if (!this.clearable() || this.isDisabled()) {
      return;
    }
    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      if (this.checkedIndex() !== null) {
        this.commit(null);
      }
    }
  }

  private commit(next: StarRatingValue): void {
    this.hovered.set(null);
    this.value.set(next);
    this.onChangeCallback(next);
    this.changed.emit(next);
  }

  writeValue(value: StarRatingValue | undefined): void {
    this.value.set(typeof value === 'number' && Number.isFinite(value) ? value : null);
  }
}
