/**
 * Focus helpers shared by the overlay components (Dialog, Menu, Select).
 *
 * Small on purpose: Paint needs a trap and a roving index, not a focus manager.
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',');

/** Tabbable elements inside `container`, in DOM order, skipping hidden ones. */
export function focusableWithin(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null || el.getClientRects().length > 0,
  );
}

/**
 * Keeps Tab / Shift+Tab inside `container` by wrapping at the edges.
 * Returns `true` when the event was handled.
 */
export function trapTab(container: HTMLElement, event: KeyboardEvent): boolean {
  if (event.key !== 'Tab') {
    return false;
  }

  const focusable = focusableWithin(container);
  if (focusable.length === 0) {
    // Nothing to focus: hold focus on the container itself.
    event.preventDefault();
    container.focus();
    return true;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
    return true;
  }

  if (event.shiftKey && (active === first || active === container)) {
    event.preventDefault();
    last.focus();
    return true;
  }

  return false;
}

/**
 * Next index that is not disabled, wrapping around the list.
 *
 * @param length   number of items
 * @param from     current index (`-1` when nothing is active)
 * @param step     `1` for next, `-1` for previous
 * @param disabled predicate marking skippable items
 */
export function rovingIndex(
  length: number,
  from: number,
  step: number,
  disabled: (index: number) => boolean,
): number {
  if (length === 0) {
    return -1;
  }

  let index = from;
  for (let i = 0; i < length; i++) {
    index = (index + step + length) % length;
    if (!disabled(index)) {
      return index;
    }
  }

  return -1;
}

/** First index that is not disabled, scanning from `start` in `step` direction. */
export function firstEnabledIndex(
  length: number,
  disabled: (index: number) => boolean,
  step: 1 | -1 = 1,
): number {
  const start = step === 1 ? 0 : length - 1;
  for (let i = 0, index = start; i < length; i++, index += step) {
    if (!disabled(index)) {
      return index;
    }
  }
  return -1;
}
