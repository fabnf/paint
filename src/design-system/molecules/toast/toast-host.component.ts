import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { ToastComponent } from './toast.component';
import { ToastService } from './toast.service';
import { TOAST_POLITENESS, toastAnnouncement, type ToastPlacement } from './toast.types';

/**
 * ToastHost — the single place toasts appear, and the only place they speak.
 *
 * Two live regions exist from first render: one polite, one assertive. Toasts
 * themselves carry no live role, which avoids the two classic failures —
 * a `role="alert"` nested in a live region being announced twice, and a live
 * region that is created in the same frame as its content never being announced
 * at all.
 *
 * @example
 * ```html
 * <!-- app.component.html, once, near the end of the document -->
 * <ds-toast-host placement="bottom-end" />
 * ```
 */
@Component({
  selector: 'ds-toast-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ToastComponent],
  host: {
    // A dialog marks everything outside itself inert. The host element is what
    // the sweep actually sees, so the exemption has to live here too — otherwise
    // a toast raised while a modal is open would never be announced.
    'data-ds-inert-exempt': '',
  },
  template: `
    <!--
      Announcers first and always present, so assistive tech has something to
      watch before the first toast ever arrives. They are exempt from the
      dialog's inert sweep, so a toast raised behind a modal is still heard.
    -->
    <div class="ds-toast-host__announcer" data-ds-inert-exempt>
      <span aria-live="polite" aria-atomic="true">{{ politeMessage() }}</span>
      <span aria-live="assertive" aria-atomic="true">{{ assertiveMessage() }}</span>
    </div>

    <div
      class="toast-container ds-toast-host"
      data-ds-inert-exempt
      [class]="'ds-toast-host--' + placement()"
      role="region"
      [attr.aria-label]="label()"
    >
      @for (toast of toasts(); track toast.id) {
        <ds-toast
          [toast]="toast"
          (dismiss)="service.dismiss(toast.id)"
          (pause)="service.pause(toast.id)"
          (resume)="service.resume(toast.id)"
        />
      }
    </div>
  `,
  styles: `
    .ds-toast-host__announcer {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .ds-toast-host {
      position: fixed;
      z-index: 1090;
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-2);
      padding: var(--ds-space-4);
      /* The region spans the edge but only the toasts catch the pointer. */
      pointer-events: none;
    }

    .ds-toast-host--top-start {
      inset-block-start: 0;
      inset-inline-start: 0;
    }

    .ds-toast-host--top-center {
      inset-block-start: 0;
      inset-inline-start: 50%;
      transform: translateX(-50%);
      align-items: center;
    }

    .ds-toast-host--top-end {
      inset-block-start: 0;
      inset-inline-end: 0;
      align-items: flex-end;
    }

    .ds-toast-host--bottom-start {
      inset-block-end: 0;
      inset-inline-start: 0;
      flex-direction: column-reverse;
    }

    .ds-toast-host--bottom-center {
      inset-block-end: 0;
      inset-inline-start: 50%;
      transform: translateX(-50%);
      align-items: center;
      flex-direction: column-reverse;
    }

    .ds-toast-host--bottom-end {
      inset-block-end: 0;
      inset-inline-end: 0;
      align-items: flex-end;
      flex-direction: column-reverse;
    }
  `,
})
export class ToastHostComponent {
  protected readonly service = inject(ToastService);

  /** Corner the stack grows from. */
  readonly placement = input<ToastPlacement>('bottom-end');
  /** Accessible name for the region. */
  readonly label = input<string>('Notifications');

  protected readonly toasts = this.service.toasts;

  protected readonly politeMessage = signal('');
  protected readonly assertiveMessage = signal('');

  private announced = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const toasts = this.service.toasts();
      const latest = toasts.at(-1);

      if (!latest || latest.id <= this.announced) {
        return;
      }

      this.announced = latest.id;
      this.announce(TOAST_POLITENESS[latest.variant], toastAnnouncement(latest));
    });

    inject(DestroyRef).onDestroy(() => {
      if (this.timer) {
        clearTimeout(this.timer);
      }
    });
  }

  /**
   * Clears the region before filling it.
   *
   * Screen readers only announce a *change*: two identical messages in a row
   * (“Saved”, “Saved”) would otherwise be heard once.
   */
  private announce(politeness: 'polite' | 'assertive', message: string): void {
    const target = politeness === 'assertive' ? this.assertiveMessage : this.politeMessage;
    target.set('');

    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => target.set(message), 60);
  }
}
