import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { type IconName } from '../../icons';
import { ButtonComponent, type ButtonSize, type ButtonVariant } from '../../primitives/button';
import { focusableWithin, uniqueId } from '../../utils';

export type PopoverAlign = 'start' | 'end';

/**
 * Popover — a small, non-modal panel anchored to the button that opened it.
 *
 * The overlay between a `<ds-tooltip>` (text, on hover, never interactive) and a
 * `<ds-dialog>` (modal, page inert, focus trapped). A popover holds real
 * content — a filter form, a legend, a confirm-in-place — but does not take the
 * page hostage.
 *
 * Dismissal follows the Menu: Escape closes and returns focus to the trigger,
 * clicking outside closes, and Tab is never held — tabbing past the last control
 * leaves the panel and closes it, exactly as if it were part of the page.
 * Focus management follows the Dialog: on open, focus moves to
 * `[dsPopoverAutofocus]` if the content marks one, else to the panel itself so
 * its name is announced before its controls are read.
 *
 * @example
 * ```html
 * <ds-popover label="Filters" icon="filter" title="Filter invoices">
 *   <ds-stack [gap]="3">
 *     <ds-select [options]="statuses" label="Status" />
 *     <ds-button size="sm" (clicked)="apply()">Apply</ds-button>
 *   </ds-stack>
 * </ds-popover>
 * ```
 */
@Component({
  selector: 'ds-popover',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  host: {
    '(keydown)': 'onKeydown($event)',
    '(focusout)': 'onFocusOut($event)',
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    <ds-button
      #trigger
      [variant]="variant()"
      [size]="size()"
      [iconStart]="icon()"
      [iconEnd]="caret() ? 'chevronDown' : null"
      [label]="iconOnly() ? label() : ''"
      [disabled]="disabled()"
      [ariaExpanded]="open()"
      [ariaHasPopup]="'dialog'"
      [ariaControls]="panelId"
      [active]="open()"
      (clicked)="toggle()"
    >
      @if (!iconOnly()) {
        {{ label() }}
      }
    </ds-button>

    @if (open()) {
      <div
        #panel
        class="ds-popover__panel"
        role="dialog"
        tabindex="-1"
        [id]="panelId"
        [class.ds-popover__panel--end]="align() === 'end'"
        [class.ds-popover__panel--up]="dropUp()"
        [attr.aria-labelledby]="title() ? titleId : null"
        [attr.aria-label]="title() ? null : label()"
        [style.width.px]="width()"
      >
        @if (title() || dismissible()) {
          <div class="ds-popover__header">
            @if (title()) {
              <h2 class="ds-popover__title" [id]="titleId">{{ title() }}</h2>
            }
            @if (dismissible()) {
              <ds-button
                class="ds-popover__dismiss"
                variant="ghost"
                size="sm"
                iconStart="close"
                [label]="closeLabel()"
                (clicked)="close(true)"
              />
            }
          </div>
        }

        <div class="ds-popover__body">
          <ng-content />
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      display: inline-block;
      position: relative;
    }

    .ds-popover__panel {
      position: absolute;
      inset-block-start: calc(100% + var(--ds-space-2));
      inset-inline-start: 0;
      z-index: 1070;
      background: var(--ds-color-surface);
      border: 1px solid var(--ds-color-border);
      border-radius: var(--ds-radius-lg);
      box-shadow: var(--ds-shadow-lg);
      padding: var(--ds-space-4);
      animation: ds-popover-in 120ms ease-out;
      transform-origin: top center;
    }

    .ds-popover__panel:focus {
      outline: none;
    }

    .ds-popover__panel--end {
      inset-inline-start: auto;
      inset-inline-end: 0;
    }

    .ds-popover__panel--up {
      inset-block-start: auto;
      inset-block-end: calc(100% + var(--ds-space-2));
      transform-origin: bottom center;
    }

    .ds-popover__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--ds-space-3);
      margin-block-end: var(--ds-space-2);
    }

    .ds-popover__title {
      margin: 0;
      font-family: var(--ds-font-display);
      font-size: var(--ds-font-size-md);
      font-weight: var(--ds-font-weight-semibold);
      letter-spacing: var(--ds-letter-spacing-tight);
      color: var(--ds-color-text);
    }

    .ds-popover__dismiss {
      flex-shrink: 0;
      margin-block-start: calc(var(--ds-space-1) * -1);
      margin-inline-end: calc(var(--ds-space-1) * -1);
    }

    .ds-popover__body {
      font-size: var(--ds-font-size-sm);
      color: var(--ds-color-text);
    }

    @keyframes ds-popover-in {
      from {
        opacity: 0;
        transform: translateY(-0.25rem) scale(0.98);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ds-popover__panel {
        animation: none;
      }
    }
  `,
})
export class PopoverComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Trigger label. Doubles as the panel's accessible name when there is no title. */
  readonly label = input<string>('Open');
  /** Heading rendered inside the panel, and its accessible name. */
  readonly title = input<string>('');
  /** Trigger icon. */
  readonly icon = input<IconName | null>(null);
  /** Icon-only trigger: `label` becomes the accessible name. */
  readonly iconOnly = input(false);
  /** Show the chevron on the trigger. */
  readonly caret = input(false);
  readonly variant = input<ButtonVariant>('secondary');
  readonly size = input<ButtonSize>('md');
  readonly disabled = input(false);
  /** Which edge of the trigger the panel lines up with. */
  readonly align = input<PopoverAlign>('start');
  /** Panel width in px. */
  readonly width = input<number>(320);
  /** A named close button in the header. Escape and outside clicks always work. */
  readonly dismissible = input(false);
  readonly closeLabel = input<string>('Close');

  /** Emits on every open/close. */
  readonly openChange = output<boolean>();

  protected readonly open = signal(false);
  protected readonly dropUp = signal(false);
  protected readonly panelId = uniqueId('ds-popover');
  protected readonly titleId = uniqueId('ds-popover-title');

  private readonly triggerRef = viewChild<ButtonComponent, ElementRef<HTMLElement>>('trigger', {
    read: ElementRef,
  });
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');

  toggle(): void {
    this.open() ? this.close() : this.openPopover();
  }

  openPopover(): void {
    if (this.disabled() || this.open()) {
      return;
    }

    this.open.set(true);
    this.openChange.emit(true);

    // The panel is created by change detection, which has not run yet — same
    // macrotask dance as the Menu, for the same reason.
    setTimeout(() => {
      this.updatePlacement();
      this.focusInitial();
    });
  }

  close(restoreFocus = false): void {
    if (!this.open()) {
      return;
    }

    this.open.set(false);
    this.openChange.emit(false);

    if (restoreFocus) {
      this.focusTrigger();
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.open() && event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close(true);
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    // Non-modal means Tab is never held: when focus genuinely leaves the host —
    // trigger and panel both — the popover closes behind it, exactly like a
    // Menu. Focus bouncing between trigger and panel is not leaving.
    if (!this.open()) {
      return;
    }
    const next = event.relatedTarget as Node | null;
    if (next && !this.host.nativeElement.contains(next)) {
      this.close();
    }
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.open()) {
      return;
    }
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  /**
   * `[dsPopoverAutofocus]` wins; otherwise the panel itself takes focus so its
   * name is announced before its controls are read — the Dialog's reasoning.
   */
  private focusInitial(): void {
    const panel = this.panelRef()?.nativeElement;
    if (!panel) {
      return;
    }

    const marked = panel.querySelector<HTMLElement>('[dsPopoverAutofocus]');
    if (!marked) {
      panel.focus();
      return;
    }

    // The mark may sit on a native control, or on a Paint component whose
    // focusable element is inside it — take whichever actually focuses.
    const target = marked.matches('button, a[href], input, select, textarea, [tabindex]')
      ? marked
      : (focusableWithin(marked)[0] ?? marked);
    target.focus();
  }

  /** Flip above the trigger when the space below runs out — the Menu's check. */
  private updatePlacement(): void {
    const panel = this.panelRef()?.nativeElement;
    const trigger = this.triggerRef()?.nativeElement;
    if (!panel || !trigger || typeof window === 'undefined') {
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const panelHeight = panel.offsetHeight;
    const spaceBelow = window.innerHeight - triggerRect.bottom;

    this.dropUp.set(spaceBelow < panelHeight + 16 && triggerRect.top > panelHeight + 16);
  }

  private focusTrigger(): void {
    this.triggerRef()?.nativeElement.querySelector('button')?.focus();
  }
}
