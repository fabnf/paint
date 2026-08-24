import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IconComponent, type IconName } from '../../icons';
import { cx } from '../primitives.types';
import { toneClass, type Tone, type ToneVariant } from '../tone.types';

export type ChipSize = 'sm' | 'md';

/**
 * Chip — the value atom.
 *
 * A label that stands for a thing the user put there: a tag, a filter, a
 * selected option, a recipient. Unlike a Badge (which the system writes), a chip
 * is the user's, which is why it can be removed.
 *
 * Two shapes, and the difference is a promise:
 *
 * - **Static** (default) — a `<span>`. Not focusable, not clickable.
 * - **Removable** — the chip grows a real `<button>`. One tab stop, named
 *   "Remove <label>", and the chip itself stays a plain span so a screen reader
 *   never meets a button inside a button.
 *
 * @example
 * ```html
 * <ds-chip>Design system</ds-chip>
 * <ds-chip tone="primary" icon="palette">Brand</ds-chip>
 * <ds-chip tone="accent" [removable]="true" (removed)="drop(tag)">{{ tag }}</ds-chip>
 *
 * <!-- Inside a composite widget that owns the keyboard (a combobox, say),
 *      the remove button stays clickable but leaves the tab order -->
 * <ds-chip [removable]="true" [removeTabbable]="false" (removed)="unpick()">Ada</ds-chip>
 * ```
 */
@Component({
  selector: 'ds-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <span [class]="classes()">
      @if (icon()) {
        <ds-icon [name]="icon()!" [size]="iconSize()" class="ds-chip__icon" />
      }

      <!-- Leading slot: an avatar, a colour swatch, a flag. -->
      <ng-content select="[dsChipLeading]" />

      <span class="ds-chip__label"><ng-content /></span>

      @if (removable()) {
        <button
          type="button"
          class="ds-chip__remove"
          [attr.tabindex]="removeTabbable() ? null : -1"
          [attr.aria-label]="removeLabel()"
          [disabled]="disabled()"
          (click)="remove($event)"
        >
          <ds-icon name="close" size="xs" />
        </button>
      }
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      max-width: 100%;
      vertical-align: middle;
    }

    .ds-chip {
      display: inline-flex;
      align-items: center;
      gap: var(--ds-space-1);
      min-width: 0;
      max-width: 100%;
      padding: 0.125rem var(--ds-space-2);
      border: 1px solid transparent;
      border-radius: var(--ds-radius-full);
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-semibold);
      line-height: var(--ds-line-height-snug);
      letter-spacing: var(--ds-letter-spacing-wide);
    }

    .ds-chip--md {
      gap: var(--ds-space-1_5);
      padding: var(--ds-space-1) var(--ds-space-2_5);
      font-size: var(--ds-font-size-sm);
    }

    /* Room for the button, which has its own padding. */
    .ds-chip--removable {
      padding-inline-end: var(--ds-space-1);
    }

    .ds-chip--soft {
      color: var(--ds-tone-fg);
      background-color: var(--ds-tone-bg);
    }

    .ds-chip--solid {
      color: var(--ds-tone-on-solid);
      background-color: var(--ds-tone-solid);
    }

    .ds-chip--outline {
      color: var(--ds-tone-fg);
      background-color: transparent;
      border-color: color-mix(in srgb, var(--ds-tone-border) 45%, transparent);
    }

    /*
     * Disabled is a state, not a dimmer switch: fading the label to 55% takes a
     * readable chip below 4.5:1. The chip drops its tone instead, and says
     * "unavailable" with the muted text role — which the token layer asserts.
     */
    .ds-chip--disabled {
      color: var(--ds-color-text-muted);
      background-color: var(--ds-color-surface-sunken);
      border-color: var(--ds-color-border);
    }

    .ds-chip__icon {
      flex-shrink: 0;
    }

    .ds-chip__label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ds-chip__remove {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      padding: 0.0625rem;
      border: 0;
      border-radius: var(--ds-radius-full);
      background: none;
      color: inherit;
      cursor: pointer;
      opacity: 0.65;
      transition: opacity 120ms ease;
    }

    .ds-chip__remove:hover:not(:disabled) {
      opacity: 1;
      background-color: color-mix(in srgb, currentcolor 14%, transparent);
    }

    .ds-chip__remove:focus-visible {
      outline: 2px solid var(--ds-color-focus-ring);
      outline-offset: 1px;
      opacity: 1;
    }

    .ds-chip__remove:disabled {
      cursor: not-allowed;
    }

    @media (forced-colors: active) {
      .ds-chip {
        border-color: currentcolor;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ds-chip__remove {
        transition: none;
      }
    }
  `,
})
export class ChipComponent {
  readonly tone = input<Tone>('neutral');
  readonly variant = input<ToneVariant>('soft');
  readonly size = input<ChipSize>('sm');
  /** Leading icon. Decorative — the label carries the meaning. */
  readonly icon = input<IconName | null>(null);
  /** Grows a real `<button>` that emits `removed`. */
  readonly removable = input(false);
  /**
   * Accessible name of the remove button. Say what is being removed: a row of
   * chips should not be a row of buttons all called "Remove".
   */
  readonly removeLabel = input<string>('Remove');
  /**
   * Keep the remove button in the tab order. Turn it off only inside a widget
   * that already owns the keyboard and offers another way out — the way a
   * multiple Select removes a chip with `Backspace`.
   */
  readonly removeTabbable = input(true);
  readonly disabled = input(false);

  /** Emits when the remove button is pressed. The chip does not remove itself. */
  readonly removed = output<MouseEvent>();

  protected readonly iconSize = computed(() => (this.size() === 'md' ? 'sm' : 'xs') as 'xs' | 'sm');

  protected readonly classes = computed(() =>
    cx(
      'ds-chip',
      `ds-chip--${this.size()}`,
      `ds-chip--${this.variant()}`,
      toneClass(this.tone()),
      this.removable() && 'ds-chip--removable',
      this.disabled() && 'ds-chip--disabled',
    ),
  );

  /**
   * The chip is the consumer's data, so removal is a request, not a fact: the
   * list that owns the chip decides whether it disappears.
   */
  protected remove(event: MouseEvent): void {
    if (this.disabled()) {
      return;
    }
    event.stopPropagation();
    this.removed.emit(event);
  }
}
