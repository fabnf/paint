import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

/**
 * Makes everything outside a modal unreachable.
 *
 * `aria-modal="true"` is a *hint*: screen readers that don't honour it let users
 * keep arrowing through the page behind a dialog, and browser features (find in
 * page, caret browsing, touch exploration) ignore focus traps entirely. `inert`
 * is the real thing — it removes a subtree from the tab order *and* from the
 * accessibility tree.
 *
 * Because Paint's overlays render in place rather than in a portal, the dialog
 * lives inside the very tree we want to silence. So instead of marking one
 * container, this walks from the dialog up to `<body>` and marks every *sibling*
 * along the way, leaving the dialog's own ancestor chain alive.
 *
 * Reference-counted, so stacked overlays restore correctly.
 */
@Injectable({ providedIn: 'root' })
export class PageInertService {
  private readonly document = inject(DOCUMENT);

  /** Elements this service marked, with whether they were already inert. */
  private readonly marked = new Map<HTMLElement, boolean>();
  private holders = 0;

  /** Silences everything outside `element`. */
  activate(element: HTMLElement): void {
    if (this.holders++ > 0) {
      // A second overlay inside the first: the page is already silenced.
      return;
    }

    const body = this.document.body;
    let node: HTMLElement | null = element;

    while (node && node !== body) {
      const parent: HTMLElement | null = node.parentElement;
      if (!parent) {
        break;
      }

      for (const sibling of Array.from(parent.children)) {
        if (sibling === node || !(sibling instanceof HTMLElement)) {
          continue;
        }
        // Never silence a live region: toasts still have to be announced.
        if (sibling.matches('[aria-live], [data-ds-inert-exempt]')) {
          continue;
        }

        this.marked.set(sibling, sibling.inert);
        sibling.inert = true;
      }

      node = parent;
    }
  }

  /** Restores the page. */
  deactivate(): void {
    if (this.holders === 0) {
      return;
    }
    if (--this.holders > 0) {
      return;
    }

    for (const [element, wasInert] of this.marked) {
      element.inert = wasInert;
    }
    this.marked.clear();
  }
}
