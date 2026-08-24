import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
  type AfterViewInit,
} from '@angular/core';
import { uniqueId } from '../../utils';

export type TooltipPlacement = 'top' | 'bottom' | 'start' | 'end';

/**
 * Tooltip — the name of a thing, on demand.
 *
 * Wrap the control; give the tooltip its words. The bubble opens on hover and on
 * keyboard focus, and follows the WAI-ARIA tooltip pattern plus WCAG 1.4.13:
 * it is *dismissible* (Escape closes it without disturbing anything else),
 * *hoverable* (moving the pointer onto the bubble keeps it open) and
 * *persistent* (it stays until hover or focus leaves).
 *
 * The bubble is always in the DOM and wired to the trigger with
 * `aria-describedby`, so a screen reader hears the text the moment the control
 * is focused — no timers involved.
 *
 * **A tooltip is a description, not a name.** An icon-only button still needs
 * its own label; the tooltip may repeat it, but must never be the only place it
 * lives. And it is text only: anything a user must click, read slowly or copy
 * belongs in a `<ds-popover>`.
 *
 * @example
 * ```html
 * <ds-tooltip text="Copy to clipboard">
 *   <ds-button variant="ghost" iconStart="copy" label="Copy" />
 * </ds-tooltip>
 *
 * <ds-tooltip text="Saved 2 minutes ago" placement="bottom">
 *   <ds-badge tone="success" icon="check">Saved</ds-badge>
 * </ds-tooltip>
 * ```
 */
@Component({
  selector: 'ds-tooltip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
    '(focusin)': 'onFocusIn()',
    '(focusout)': 'onFocusOut($event)',
    '(document:keydown.escape)': 'onEscape($event)',
  },
  template: `
    <ng-content />

    <!--
      Always rendered: aria-describedby must resolve whether or not the bubble is
      visible, and a hidden element still yields its text to the accessible
      description. role="tooltip" + visibility does the showing.
    -->
    <div
      #bubble
      class="ds-tooltip__bubble"
      role="tooltip"
      [id]="tooltipId"
      [class.ds-tooltip__bubble--open]="open()"
      [attr.data-placement]="effectivePlacement()"
    >
      {{ text() }}
      <span class="ds-tooltip__arrow" aria-hidden="true"></span>
    </div>
  `,
  styles: `
    :host {
      display: inline-block;
      position: relative;
    }

    .ds-tooltip__bubble {
      position: absolute;
      z-index: 1080;
      max-width: 18rem;
      width: max-content;
      padding: var(--ds-space-1_5) var(--ds-space-2_5);
      border-radius: var(--ds-radius-md);
      background: var(--ds-color-text);
      color: var(--ds-color-surface);
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-medium);
      line-height: var(--ds-line-height-snug);
      box-shadow: var(--ds-shadow-md);
      pointer-events: none;
      visibility: hidden;
      opacity: 0;
      transition:
        opacity 120ms ease-out,
        visibility 0s linear 120ms;
    }

    .ds-tooltip__bubble--open {
      visibility: visible;
      opacity: 1;
      /* Hoverable (WCAG 1.4.13): the pointer may cross onto the bubble. */
      pointer-events: auto;
      transition-delay: 0s;
    }

    .ds-tooltip__arrow {
      position: absolute;
      width: 0.5rem;
      height: 0.5rem;
      background: inherit;
      transform: rotate(45deg);
    }

    /* —— placements —— */

    .ds-tooltip__bubble[data-placement='top'] {
      inset-block-end: calc(100% + var(--ds-space-2));
      inset-inline-start: 50%;
      translate: -50% 0;
    }
    .ds-tooltip__bubble[data-placement='top'] .ds-tooltip__arrow {
      inset-block-end: -0.25rem;
      inset-inline-start: calc(50% - 0.25rem);
    }

    .ds-tooltip__bubble[data-placement='bottom'] {
      inset-block-start: calc(100% + var(--ds-space-2));
      inset-inline-start: 50%;
      translate: -50% 0;
    }
    .ds-tooltip__bubble[data-placement='bottom'] .ds-tooltip__arrow {
      inset-block-start: -0.25rem;
      inset-inline-start: calc(50% - 0.25rem);
    }

    .ds-tooltip__bubble[data-placement='end'] {
      inset-inline-start: calc(100% + var(--ds-space-2));
      inset-block-start: 50%;
      translate: 0 -50%;
    }
    .ds-tooltip__bubble[data-placement='end'] .ds-tooltip__arrow {
      inset-inline-start: -0.25rem;
      inset-block-start: calc(50% - 0.25rem);
    }

    .ds-tooltip__bubble[data-placement='start'] {
      inset-inline-end: calc(100% + var(--ds-space-2));
      inset-block-start: 50%;
      translate: 0 -50%;
    }
    .ds-tooltip__bubble[data-placement='start'] .ds-tooltip__arrow {
      inset-inline-end: -0.25rem;
      inset-block-start: calc(50% - 0.25rem);
    }

    /* RTL flips the inline placements; translate has no logical axis. */
    :host-context([dir='rtl']) .ds-tooltip__bubble[data-placement='top'],
    :host-context([dir='rtl']) .ds-tooltip__bubble[data-placement='bottom'] {
      translate: 50% 0;
    }

    @media (prefers-reduced-motion: reduce) {
      .ds-tooltip__bubble {
        transition: none;
      }
    }

    @media (forced-colors: active) {
      .ds-tooltip__bubble {
        border: 1px solid currentcolor;
      }
    }
  `,
})
export class TooltipComponent implements AfterViewInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The description. Short — it disappears when the pointer moves. */
  readonly text = input.required<string>();
  /** Preferred side. Top and bottom flip when the viewport says no. */
  readonly placement = input<TooltipPlacement>('top');
  /**
   * Hover delay in milliseconds. Keyboard focus ignores it: a user who tabbed
   * here asked, and is not sweeping the pointer across the page.
   */
  readonly openDelay = input(300);
  /** Suppresses the bubble without unwiring the description. */
  readonly disabled = input(false);

  /** Emits on every show/hide, for tests and analytics. */
  readonly openChange = output<boolean>();

  protected readonly open = signal(false);
  protected readonly tooltipId = uniqueId('ds-tooltip');

  /** Where the bubble actually went, after the flip check. */
  protected readonly effectivePlacement = signal<TooltipPlacement>('top');

  private readonly bubbleRef = viewChild.required<ElementRef<HTMLElement>>('bubble');
  private openTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => this.effectivePlacement.set(this.placement()));
    inject(DestroyRef).onDestroy(() => this.clearTimer());
  }

  // The trigger is projected content: once it exists, point its accessible
  // description at the bubble. The attribute goes on the first focusable
  // element — the thing a keyboard user will actually land on.
  ngAfterViewInit(): void {
    this.wireDescription();
  }

  protected onMouseEnter(): void {
    if (this.disabled()) {
      return;
    }
    this.clearTimer();
    this.openTimer = setTimeout(() => this.show(), this.openDelay());
  }

  protected onMouseLeave(): void {
    this.clearTimer();
    this.hide();
  }

  protected onFocusIn(): void {
    if (!this.disabled()) {
      this.show();
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    // Focus moving between elements inside the trigger is not leaving.
    if (!this.host.nativeElement.contains(event.relatedTarget as Node)) {
      this.clearTimer();
      this.hide();
    }
  }

  protected onEscape(event: Event): void {
    if (!this.open()) {
      return;
    }
    // Dismiss the tooltip and nothing else: Escape must not also close the
    // dialog the trigger happens to live in (WCAG 1.4.13, "dismissible").
    event.stopPropagation();
    this.clearTimer();
    this.hide();
  }

  private clearTimer(): void {
    if (this.openTimer !== null) {
      clearTimeout(this.openTimer);
      this.openTimer = null;
    }
  }

  private show(): void {
    if (this.open()) {
      return;
    }
    this.open.set(true);
    this.updatePlacement();
    this.openChange.emit(true);
  }

  private hide(): void {
    if (!this.open()) {
      return;
    }
    this.open.set(false);
    this.openChange.emit(false);
  }

  /** Flips top/bottom when the preferred side would leave the viewport. */
  private updatePlacement(): void {
    const preferred = this.placement();
    this.effectivePlacement.set(preferred);

    if (typeof window === 'undefined' || (preferred !== 'top' && preferred !== 'bottom')) {
      return;
    }

    const hostRect = this.host.nativeElement.getBoundingClientRect();
    const bubbleHeight = this.bubbleRef().nativeElement.offsetHeight + 12;

    if (preferred === 'top' && hostRect.top < bubbleHeight && window.innerHeight - hostRect.bottom > bubbleHeight) {
      this.effectivePlacement.set('bottom');
    } else if (
      preferred === 'bottom' &&
      window.innerHeight - hostRect.bottom < bubbleHeight &&
      hostRect.top > bubbleHeight
    ) {
      this.effectivePlacement.set('top');
    }
  }

  private wireDescription(): void {
    const trigger =
      this.host.nativeElement.querySelector<HTMLElement>(
        'button, a[href], input, select, textarea, [tabindex]',
      ) ?? (this.host.nativeElement.firstElementChild as HTMLElement | null);

    if (!trigger || trigger.id === this.tooltipId) {
      return;
    }

    const existing = trigger.getAttribute('aria-describedby');
    trigger.setAttribute(
      'aria-describedby',
      existing ? `${existing} ${this.tooltipId}` : this.tooltipId,
    );
  }
}
