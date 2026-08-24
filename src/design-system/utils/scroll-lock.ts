import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

/**
 * Reference-counted body scroll lock.
 *
 * Two dialogs (or a dialog over a drawer) must not fight over `overflow`, and
 * the page must not jump when the scrollbar disappears — so the lock counts its
 * holders and compensates for the scrollbar width.
 */
@Injectable({ providedIn: 'root' })
export class ScrollLockService {
  private readonly document = inject(DOCUMENT);
  private holders = 0;
  private previousOverflow = '';
  private previousPaddingRight = '';

  lock(): void {
    if (this.holders++ > 0) {
      return;
    }

    const body = this.document.body;
    const scrollbar = this.document.defaultView
      ? this.document.defaultView.innerWidth - this.document.documentElement.clientWidth
      : 0;

    this.previousOverflow = body.style.overflow;
    this.previousPaddingRight = body.style.paddingRight;

    body.style.overflow = 'hidden';
    if (scrollbar > 0) {
      const current = Number.parseFloat(getComputedStyle(body).paddingRight) || 0;
      body.style.paddingRight = `${current + scrollbar}px`;
    }
  }

  release(): void {
    if (this.holders === 0) {
      return;
    }
    if (--this.holders > 0) {
      return;
    }

    const body = this.document.body;
    body.style.overflow = this.previousOverflow;
    body.style.paddingRight = this.previousPaddingRight;
  }
}
