import { Injectable, InjectionToken, computed, inject, signal } from '@angular/core';
import type { Toast, ToastOptions } from './toast.types';

export interface ToastConfig {
  /** Default auto-dismiss delay in ms. `0` disables auto-dismiss. */
  duration?: number;
  /** Most toasts on screen at once; the oldest is dropped first. */
  limit?: number;
}

export const TOAST_CONFIG = new InjectionToken<ToastConfig>('TOAST_CONFIG', {
  providedIn: 'root',
  factory: () => ({}),
});

const DEFAULT_DURATION = 5000;
const DEFAULT_LIMIT = 4;

/**
 * ToastService — the imperative half of the Toast molecule.
 *
 * Toasts are announcements, not layout: they are requested from code and
 * rendered by a single `<ds-toast-host>`. The service owns the queue, the limit
 * and the timers; the host owns the pixels.
 *
 * @example
 * ```ts
 * private readonly toast = inject(ToastService);
 *
 * this.toast.success('Project saved');
 * this.toast.danger('Upload failed', { description: 'Check your connection.' });
 * this.toast.show({
 *   title: 'Label removed',
 *   action: { label: 'Undo', run: () => this.restore() },
 *   duration: 8000,
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly config = inject(TOAST_CONFIG);
  private readonly defaultDuration = this.config.duration ?? DEFAULT_DURATION;
  private readonly limit = this.config.limit ?? DEFAULT_LIMIT;

  private readonly queue = signal<readonly Toast[]>([]);
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private nextId = 0;

  /** Live toasts, oldest first. */
  readonly toasts = this.queue.asReadonly();
  readonly count = computed(() => this.queue().length);

  /** Queues a toast and returns its id, for manual dismissal. */
  show(options: ToastOptions): number {
    const toast: Toast = {
      id: ++this.nextId,
      variant: options.variant ?? 'info',
      duration: options.duration ?? this.defaultDuration,
      dismissible: options.dismissible ?? true,
      ...options,
    };

    this.queue.update((toasts) => {
      const next = [...toasts, toast];
      // Oldest out first, so the newest announcement is never pushed away.
      const overflow = next.length - this.limit;
      if (overflow > 0) {
        next.splice(0, overflow).forEach((dropped) => this.clearTimer(dropped.id));
      }
      return next;
    });

    this.startTimer(toast);
    return toast.id;
  }

  /** `show()` with the success variant. */
  success(title: string, options: Partial<ToastOptions> = {}): number {
    return this.show({ ...options, title, variant: 'success' });
  }

  info(title: string, options: Partial<ToastOptions> = {}): number {
    return this.show({ ...options, title, variant: 'info' });
  }

  warning(title: string, options: Partial<ToastOptions> = {}): number {
    return this.show({ ...options, title, variant: 'warning' });
  }

  danger(title: string, options: Partial<ToastOptions> = {}): number {
    return this.show({ ...options, title, variant: 'danger' });
  }

  dismiss(id: number): void {
    this.clearTimer(id);
    this.queue.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  /** Drops every toast. Useful on route changes. */
  clear(): void {
    this.queue().forEach((toast) => this.clearTimer(toast.id));
    this.queue.set([]);
  }

  /** Stops a toast's countdown — the host calls this on hover / focus. */
  pause(id: number): void {
    this.clearTimer(id);
  }

  /** Restarts a paused toast's countdown. */
  resume(id: number): void {
    const toast = this.queue().find((item) => item.id === id);
    if (toast) {
      this.startTimer(toast);
    }
  }

  private startTimer(toast: Toast): void {
    if (toast.duration <= 0) {
      return;
    }

    this.clearTimer(toast.id);
    this.timers.set(
      toast.id,
      setTimeout(() => this.dismiss(toast.id), toast.duration),
    );
  }

  private clearTimer(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }
}
