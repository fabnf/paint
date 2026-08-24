import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconComponent, type IconName } from '../../icons';
import { cx } from '../primitives.types';
import { toneClass, type Tone, type ToneVariant } from '../tone.types';

export type BadgeSize = 'sm' | 'md';

/**
 * Badge — the status-label atom.
 *
 * A short, non-interactive label: a status, a count, a version. Built on
 * Bootstrap's `.badge` and painted from Paint's tone properties, so the same
 * `tone="danger"` is the same red here, in a Chip and in a Progress bar.
 *
 * A badge is **not** a button and never a tab stop. If it can be clicked or
 * dismissed, it is a `<ds-chip>`; if it triggers something, it is a
 * `<ds-button>`.
 *
 * @example
 * ```html
 * <ds-badge tone="success">Shipped</ds-badge>
 * <ds-badge tone="danger" variant="solid" icon="warning">Failed</ds-badge>
 * <ds-badge tone="info" [dot]="true">Syncing</ds-badge>
 * <ds-badge tone="neutral" variant="outline" [pill]="true">v0.3.1</ds-badge>
 *
 * <!-- A bare number needs words: the glyph is hidden, the name is spoken -->
 * <ds-badge tone="accent" srLabel="12 unread messages">12</ds-badge>
 * ```
 */
@Component({
  selector: 'ds-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    @if (srLabel()) {
      <!--
        "12" is not a label. When the visible content is a glyph or a count, the
        badge says the words once, invisibly, and hides the decoration it sits on.
      -->
      <span class="visually-hidden">{{ srLabel() }}</span>
    }

    <span [class]="classes()" [attr.aria-hidden]="srLabel() ? 'true' : null">
      @if (dot()) {
        <span class="ds-badge__dot"></span>
      }
      @if (icon()) {
        <ds-icon [name]="icon()!" size="xs" />
      }
      <ng-content />
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      max-width: 100%;
      vertical-align: middle;
    }

    .ds-badge {
      min-width: 0;
      line-height: var(--ds-line-height-snug);
      /* A label is a label, not a headline. */
      font-size: var(--ds-font-size-xs);
      border: 1px solid transparent;
    }

    .ds-badge--md {
      font-size: var(--ds-font-size-sm);
      padding: 0.1875rem var(--ds-space-2);
    }

    .ds-badge--soft {
      color: var(--ds-tone-fg);
      background-color: var(--ds-tone-bg);
    }

    .ds-badge--solid {
      color: var(--ds-tone-on-solid);
      background-color: var(--ds-tone-solid);
    }

    .ds-badge--outline {
      color: var(--ds-tone-fg);
      background-color: transparent;
      border-color: color-mix(in srgb, var(--ds-tone-border) 45%, transparent);
    }

    /* The dot carries no meaning of its own — the text beside it does. */
    .ds-badge__dot {
      flex-shrink: 0;
      width: 0.375rem;
      height: 0.375rem;
      border-radius: var(--ds-radius-full);
      background-color: currentcolor;
    }

    /* Forced colours drop background-color: keep the edge so the badge survives. */
    @media (forced-colors: active) {
      .ds-badge {
        border-color: currentcolor;
      }
    }
  `,
})
export class BadgeComponent {
  /** Semantic meaning. Resolved to colour by the theme, never by the consumer. */
  readonly tone = input<Tone>('neutral');
  /** How the tone is painted. `soft` by default — solid badges are for the one that matters. */
  readonly variant = input<ToneVariant>('soft');
  readonly size = input<BadgeSize>('sm');
  /** Fully rounded. Counts and statuses; a version string reads better squared. */
  readonly pill = input(false);
  /** Leading icon. Decorative — the label carries the meaning. */
  readonly icon = input<IconName | null>(null);
  /** A leading dot, for live statuses where an icon would be too much. */
  readonly dot = input(false);
  /**
   * The accessible name, when the visible content cannot be one — a count, a
   * glyph, an abbreviation. The visible badge is hidden from assistive tech and
   * this is announced instead.
   */
  readonly srLabel = input<string>('');

  protected readonly classes = computed(() =>
    cx(
      'badge',
      'ds-badge',
      `ds-badge--${this.size()}`,
      `ds-badge--${this.variant()}`,
      toneClass(this.tone()),
      this.pill() ? 'rounded-full' : 'rounded-sm',
    ),
  );
}
