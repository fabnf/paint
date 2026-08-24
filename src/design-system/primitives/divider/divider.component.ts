import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { cx, spaceToken, type SpaceValue } from '../primitives.types';

export type DividerOrientation = 'horizontal' | 'vertical';
export type DividerVariant = 'solid' | 'dashed';
export type DividerLabelPosition = 'start' | 'center' | 'end';

/**
 * Divider — the separation atom.
 *
 * A rule between two things, with an optional label in it. Horizontal or
 * vertical, and `role="separator"` either way — unless it is decoration, in
 * which case it says nothing at all.
 *
 * Do not use it to space things out: that is what `<ds-stack>`'s gap is for. A
 * divider means *these are different kinds of thing*. (`<ds-stack [divided]>`
 * already draws one between every child — reach for this when the rule is a
 * one-off, or when it needs a word in it.)
 *
 * @example
 * ```html
 * <ds-divider />
 * <ds-divider label="or" />
 * <ds-divider label="Archived" labelPosition="start" variant="dashed" />
 *
 * <ds-flex align="center" [gap]="3">
 *   <span>Draft</span>
 *   <ds-divider orientation="vertical" [spacing]="0" />
 *   <span>Edited 2h ago</span>
 * </ds-flex>
 * ```
 */
@Component({
  selector: 'ds-divider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (labelled()) {
      <!--
        A separator's children are presentational: assistive tech will not read
        them. So the visible word is hidden, and the same word becomes the
        element's accessible name. One announcement, not two.
      -->
      <span class="ds-divider__line" aria-hidden="true"></span>
      <span class="ds-divider__label" aria-hidden="true">{{ label() }}</span>
      <span class="ds-divider__line" aria-hidden="true"></span>
    }
  `,
  styles: `
    :host {
      display: block;
      border: 0;
      color: var(--ds-color-border);
    }

    :host([aria-orientation='vertical']) {
      display: inline-block;
      align-self: stretch;
      min-height: 1em;
    }

    /* The rule itself: a border, so currentColor and forced colours both work. */
    :host(:not(.ds-divider--labelled)) {
      border-block-start: var(--ds-divider-weight) var(--ds-divider-style) currentcolor;
    }

    :host([aria-orientation='vertical']:not(.ds-divider--labelled)) {
      border-block-start: 0;
      border-inline-start: var(--ds-divider-weight) var(--ds-divider-style) currentcolor;
    }

    :host(.ds-divider--strong) {
      color: var(--ds-color-border-strong);
    }

    /* —— Labelled —— */
    :host(.ds-divider--labelled) {
      display: flex;
      align-items: center;
      gap: var(--ds-space-3);
    }

    .ds-divider__line {
      flex: 1 1 auto;
      border-block-start: var(--ds-divider-weight) var(--ds-divider-style) currentcolor;
    }

    /* start / end pin the label by starving one of the two lines. */
    :host(.ds-divider--label-start) .ds-divider__line:first-child,
    :host(.ds-divider--label-end) .ds-divider__line:last-child {
      flex: 0 0 var(--ds-space-4);
    }

    .ds-divider__label {
      flex: 0 0 auto;
      color: var(--ds-color-text-subtle);
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-semibold);
      letter-spacing: var(--ds-letter-spacing-wider);
      text-transform: uppercase;
      white-space: nowrap;
    }

    @media (forced-colors: active) {
      :host {
        color: CanvasText;
      }
    }
  `,
  host: {
    '[class]': 'classes()',
    '[attr.role]': 'decorative() ? "none" : "separator"',
    '[attr.aria-hidden]': 'decorative() ? "true" : null',
    '[attr.aria-orientation]': 'orientation() === "vertical" ? "vertical" : null',
    '[attr.aria-label]': '!decorative() && labelled() ? label() : null',
    '[style.--ds-divider-weight]': 'weight()',
    '[style.--ds-divider-style]': 'variant()',
    '[style.margin-block]': 'blockMargin()',
    '[style.margin-inline]': 'inlineMargin()',
  },
})
export class DividerComponent {
  readonly orientation = input<DividerOrientation>('horizontal');
  readonly variant = input<DividerVariant>('solid');
  /** A word in the middle of the rule — "or", "Archived", "Today". */
  readonly label = input<string>('');
  readonly labelPosition = input<DividerLabelPosition>('center');
  /** Margin on the axis the divider cuts across, in space tokens. */
  readonly spacing = input<SpaceValue>(4);
  /** A heavier rule, for the edge of a region rather than between two rows. */
  readonly strong = input(false);
  /** Line thickness. A divider is a hairline; this is here for the 2px case. */
  readonly weight = input<string>('1px');
  /**
   * Pure decoration, with nothing on either side that a separator would
   * separate. Removes the role, so a screen reader does not count rules.
   */
  readonly decorative = input(false);

  /** A word only fits in a horizontal rule; a vertical one is 1px wide. */
  protected readonly labelled = computed(
    () => !!this.label() && this.orientation() === 'horizontal',
  );

  protected readonly classes = computed(() =>
    cx(
      'ds-divider',
      `ds-divider--${this.orientation()}`,
      this.labelled() && 'ds-divider--labelled',
      this.labelled() && `ds-divider--label-${this.labelPosition()}`,
      this.strong() && 'ds-divider--strong',
    ),
  );

  /** A horizontal rule breathes above and below; a vertical one, left and right. */
  protected readonly blockMargin = computed(() =>
    this.orientation() === 'horizontal' ? this.space() : null,
  );

  protected readonly inlineMargin = computed(() =>
    this.orientation() === 'vertical' ? this.space() : null,
  );

  private space(): string {
    return `var(--ds-space-${spaceToken(this.spacing())})`;
  }
}
