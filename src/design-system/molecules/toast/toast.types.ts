import type { IconName } from '../../icons';

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger' | 'brand';

/** Where the host stacks its toasts. */
export type ToastPlacement =
  | 'top-start'
  | 'top-center'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-center'
  | 'bottom-end';

/** A single action offered inside a toast. One per toast, at most. */
export interface ToastAction {
  label: string;
  /** Runs on click. The toast dismisses itself afterwards. */
  run: () => void;
}

/** What callers pass to `ToastService.show()`. */
export interface ToastOptions {
  /** Headline. Keep it under ~40 characters. */
  title: string;
  /** Optional second line. */
  description?: string;
  variant?: ToastVariant;
  /** Overrides the variant's icon. */
  icon?: IconName;
  /** Auto-dismiss delay in ms. `0` keeps the toast until dismissed. */
  duration?: number;
  /** Offer an undo / retry affordance. */
  action?: ToastAction;
  /** Hide the dismiss button. Only for toasts that always expire. */
  dismissible?: boolean;
}

/** A live toast, as tracked by the service. */
export interface Toast extends ToastOptions {
  id: number;
  variant: ToastVariant;
  duration: number;
  dismissible: boolean;
}

export const TOAST_ICONS: Record<ToastVariant, IconName> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'warning',
  brand: 'sparkle',
};

/**
 * How urgently a variant is announced.
 *
 * Status messages wait for a pause in speech; problems interrupt.
 */
export const TOAST_POLITENESS: Record<ToastVariant, 'polite' | 'assertive'> = {
  info: 'polite',
  success: 'polite',
  brand: 'polite',
  warning: 'assertive',
  danger: 'assertive',
};

/**
 * Spoken prefix per variant — the icon carries this visually, so assistive tech
 * needs it in words.
 */
export const TOAST_ANNOUNCEMENT_PREFIX: Record<ToastVariant, string> = {
  info: '',
  success: 'Success:',
  warning: 'Warning:',
  danger: 'Error:',
  brand: '',
};

/** The sentence a screen reader should hear when a toast appears. */
export function toastAnnouncement(toast: Toast): string {
  const prefix = TOAST_ANNOUNCEMENT_PREFIX[toast.variant];
  return [prefix, toast.title, toast.description].filter(Boolean).join(' ').trim();
}
