import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IconComponent } from '../../icons';
import { ButtonComponent } from '../../primitives/button';
import { TOAST_ANNOUNCEMENT_PREFIX, TOAST_ICONS, type Toast } from './toast.types';

/**
 * Toast — one announcement.
 *
 * Built on Bootstrap's `.toast` with Paint's Button primitive for the action and
 * the dismissal. Usually rendered by `<ds-toast-host>` rather than by hand; use
 * it directly only to place a toast inside a specific surface.
 *
 * @example
 * ```html
 * <ds-toast [toast]="toast" (dismiss)="toasts.dismiss(toast.id)" />
 * ```
 */
@Component({
  selector: 'ds-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, ButtonComponent],
  host: {
    '(mouseenter)': 'pause.emit()',
    '(mouseleave)': 'resume.emit()',
    '(focusin)': 'pause.emit()',
    '(focusout)': 'resume.emit()',
  },
  template: `
    <!--
      No live role here: the host owns two persistent live regions (see
      ToastHostComponent). A role="alert" nested inside a live region gets
      announced twice by some screen readers, and a live region created at the
      same moment as its content is unreliable in others.
    -->
    <div class="toast show ds-toast" [class]="'ds-toast--' + toast().variant" role="group" [attr.aria-label]="groupLabel()">
      <div class="toast-body ds-toast__body">
        <span class="ds-toast__icon" aria-hidden="true">
          <ds-icon [name]="icon()" size="sm" />
        </span>

        <div class="ds-toast__content">
          <p class="ds-toast__title">{{ toast().title }}</p>
          @if (toast().description) {
            <p class="ds-toast__description">{{ toast().description }}</p>
          }
          @if (toast().action; as action) {
            <ds-button
              class="ds-toast__action"
              variant="link"
              size="sm"
              (clicked)="runAction()"
            >
              {{ action.label }}
            </ds-button>
          }
        </div>

        @if (toast().dismissible) {
          <ds-button
            class="ds-toast__dismiss"
            variant="ghost"
            size="sm"
            iconStart="close"
            label="Dismiss notification"
            (clicked)="dismiss.emit()"
          />
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      pointer-events: auto;
    }

    .ds-toast {
      --ds-toast-accent: var(--ds-color-info);
      position: relative;
      width: min(24rem, calc(100vw - 2rem));
      overflow: hidden;
      border-color: var(--ds-color-border);
      animation: ds-toast-in 220ms cubic-bezier(0.16, 0.84, 0.44, 1);
    }

    /* The variant paints a stripe, not the whole surface: toasts stay readable. */
    .ds-toast::before {
      content: '';
      position: absolute;
      inset-block: 0;
      inset-inline-start: 0;
      width: 3px;
      background: var(--ds-toast-accent);
    }

    .ds-toast--info {
      --ds-toast-accent: var(--ds-color-info);
    }

    .ds-toast--success {
      --ds-toast-accent: var(--ds-color-success);
    }

    .ds-toast--warning {
      --ds-toast-accent: var(--ds-color-warning);
    }

    .ds-toast--danger {
      --ds-toast-accent: var(--ds-color-danger);
    }

    .ds-toast--brand {
      --ds-toast-accent: var(--ds-color-accent);
    }

    .ds-toast__body {
      display: flex;
      align-items: flex-start;
      gap: var(--ds-space-2_5);
      padding-inline-start: var(--ds-space-4);
    }

    .ds-toast__icon {
      display: inline-flex;
      margin-block-start: 0.1rem;
      color: var(--ds-toast-accent);
      flex-shrink: 0;
    }

    .ds-toast__content {
      flex: 1 1 auto;
      min-width: 0;
    }

    .ds-toast__title {
      margin: 0;
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-semibold);
      color: var(--ds-color-text);
    }

    .ds-toast__description {
      margin: 0.125rem 0 0;
      font-size: var(--ds-font-size-sm);
      color: var(--ds-color-text-muted);
    }

    .ds-toast__action {
      margin-block-start: var(--ds-space-1);
      margin-inline-start: calc(var(--ds-space-3) * -1);
    }

    .ds-toast__dismiss {
      flex-shrink: 0;
      margin: -0.25rem -0.375rem 0 0;
    }

    @keyframes ds-toast-in {
      from {
        opacity: 0;
        transform: translateY(0.75rem) scale(0.96);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ds-toast {
        animation: none;
      }
    }
  `,
})
export class ToastComponent {
  readonly toast = input.required<Toast>();

  /** The dismiss button was pressed, or the action ran. */
  readonly dismiss = output<void>();
  /** Pointer or focus entered: hold the countdown. */
  readonly pause = output<void>();
  /** Pointer or focus left: resume the countdown. */
  readonly resume = output<void>();

  protected readonly icon = computed(() => this.toast().icon ?? TOAST_ICONS[this.toast().variant]);

  /** Names the toast when a user navigates to it rather than hearing it. */
  protected readonly groupLabel = computed(() => {
    const prefix = TOAST_ANNOUNCEMENT_PREFIX[this.toast().variant];
    return [prefix, 'notification'].filter(Boolean).join(' ');
  });

  protected runAction(): void {
    this.toast().action?.run();
    this.dismiss.emit();
  }
}
