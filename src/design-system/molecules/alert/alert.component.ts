import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IconComponent, type IconName } from '../../icons';
import { ButtonComponent } from '../../primitives/button';
import { cx } from '../../primitives/primitives.types';
import { toneClass, type Tone } from '../../primitives/tone.types';

/** How loudly the alert announces itself — if at all. */
export type AlertLive = 'off' | 'polite' | 'assertive';

/** Each tone's default icon. `danger` borrows the triangle: it is the same warning, louder. */
const TONE_ICON: Record<Tone, IconName> = {
  neutral: 'info',
  primary: 'sparkle',
  accent: 'sparkle',
  success: 'success',
  warning: 'warning',
  danger: 'warning',
  info: 'info',
};

/**
 * Alert — a message that belongs *in* the page.
 *
 * A callout, not a toast. It sits in the layout, it does not stack, it does not
 * expire, and it is read in the order it appears. Use it for the state of the
 * thing it is next to: a form that failed, a plan that is expiring, a feature in
 * beta.
 *
 * **An alert rendered with the page is not an announcement.** `live` is `off` by
 * default, because a screen reader already reads the page. Turn it on only for an
 * alert that *appears* in response to something — and then `polite` unless the
 * user must stop what they are doing.
 *
 * @example
 * ```html
 * <ds-alert tone="warning" title="Your trial ends in 3 days">
 *   Add a payment method to keep your projects.
 *   <ds-flex dsAlertActions [gap]="2">
 *     <ds-button size="sm" variant="secondary">Add payment</ds-button>
 *   </ds-flex>
 * </ds-alert>
 *
 * <!-- Appears after a failed save -->
 * @if (error()) {
 *   <ds-alert tone="danger" live="assertive" title="Could not save" [dismissible]="true"
 *             (dismissed)="error.set(null)">{{ error() }}</ds-alert>
 * }
 * ```
 */
@Component({
  selector: 'ds-alert',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, ButtonComponent],
  host: {
    '[attr.role]': 'role()',
  },
  template: `
    <div [class]="classes()">
      @if (showIcon()) {
        <!-- The icon repeats the tone. The tone repeats the words. Only the words are read. -->
        <span class="ds-alert__icon" aria-hidden="true">
          <ds-icon [name]="resolvedIcon()" size="sm" />
        </span>
      }

      <div class="ds-alert__body">
        @if (title()) {
          <p class="ds-alert__title">{{ title() }}</p>
        }

        <div class="ds-alert__content"><ng-content /></div>

        <div class="ds-alert__actions"><ng-content select="[dsAlertActions]" /></div>
      </div>

      @if (dismissible()) {
        <ds-button
          class="ds-alert__dismiss"
          variant="ghost"
          size="sm"
          iconStart="close"
          [label]="dismissLabel()"
          (clicked)="dismissed.emit()"
        />
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .ds-alert {
      display: flex;
      align-items: flex-start;
      gap: var(--ds-space-3);
      padding: var(--ds-space-3) var(--ds-space-4);
      border: 1px solid transparent;
      border-radius: var(--ds-radius-lg);
      color: var(--ds-color-text);
    }

    .ds-alert--soft {
      background-color: var(--ds-tone-bg);
      border-color: color-mix(in srgb, var(--ds-tone-border) 22%, transparent);
    }

    .ds-alert--outline {
      background-color: var(--ds-color-surface);
      border-color: color-mix(in srgb, var(--ds-tone-border) 40%, transparent);
    }

    /* A rule down the edge: the tone, where the eye enters the block. */
    .ds-alert--accentuated {
      border-inline-start: 3px solid var(--ds-tone-solid);
    }

    .ds-alert__icon {
      display: inline-flex;
      flex-shrink: 0;
      /* Optical alignment with the first line of text, not with the box. */
      margin-block-start: 0.1rem;
      color: var(--ds-tone-fg);
    }

    .ds-alert__body {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-1);
      flex: 1 1 auto;
      min-width: 0;
      font-size: var(--ds-font-size-sm);
      line-height: var(--ds-line-height-normal);
    }

    .ds-alert__title {
      margin: 0;
      font-weight: var(--ds-font-weight-semibold);
      color: var(--ds-tone-fg);
    }

    .ds-alert__content {
      color: var(--ds-color-text-muted);
    }

    .ds-alert__content:empty {
      display: none;
    }

    .ds-alert__actions {
      margin-block-start: var(--ds-space-2);
    }

    .ds-alert__actions:empty {
      display: none;
    }

    .ds-alert__dismiss {
      flex-shrink: 0;
      --bs-btn-padding-y: 0.25rem;
      --bs-btn-padding-x: 0.25rem;
      --bs-btn-border-radius: var(--ds-radius-md);
      margin-inline-end: calc(var(--ds-space-1) * -1);
    }

    @media (forced-colors: active) {
      .ds-alert {
        border-color: currentcolor;
      }
    }
  `,
})
export class AlertComponent {
  /** What the message means. Resolved to colour by the theme, never by the consumer. */
  readonly tone = input<Tone>('info');
  readonly variant = input<'soft' | 'outline'>('soft');
  /** A rule down the leading edge, for an alert that has to be found in a long page. */
  readonly accentuated = input(false);
  readonly title = input<string>('');
  /** Overrides the tone's icon. */
  readonly icon = input<IconName | null>(null);
  readonly showIcon = input(true);
  readonly dismissible = input(false);
  readonly dismissLabel = input<string>('Dismiss');
  /**
   * Whether the alert announces itself when it appears.
   *
   * `off` for an alert that is part of the page — a screen reader reads the page.
   * `polite` for one that appears in response to something. `assertive` only when
   * the user must stop: it interrupts whatever is being read.
   */
  readonly live = input<AlertLive>('off');

  /** The dismiss button was pressed. The alert does not remove itself. */
  readonly dismissed = output<void>();

  protected readonly role = computed(() => {
    switch (this.live()) {
      case 'polite':
        return 'status';
      case 'assertive':
        return 'alert';
      default:
        return null;
    }
  });

  protected readonly resolvedIcon = computed(() => this.icon() ?? TONE_ICON[this.tone()]);

  protected readonly classes = computed(() =>
    cx(
      'ds-alert',
      `ds-alert--${this.variant()}`,
      toneClass(this.tone()),
      this.accentuated() && 'ds-alert--accentuated',
    ),
  );
}
