import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { IconComponent, type IconName } from '../../icons';
import { ButtonComponent } from '../../primitives/button';
import { PageInertService, ScrollLockService, trapTab, uniqueId } from '../../utils';

export type DrawerPosition = 'end' | 'start';
export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl';

/** Panel widths. `xl` is for content that is almost a page; then use a page. */
const DRAWER_WIDTH: Record<DrawerSize, string> = {
  sm: '20rem',
  md: '26rem',
  lg: '34rem',
  xl: '44rem',
};

/**
 * Drawer — a page's margin note.
 *
 * The side-anchored sibling of `<ds-dialog>`, for detail that belongs *next to*
 * a list rather than on top of it: the row the user just clicked, a settings
 * pane, a long form that a centered modal would squash. Built on Bootstrap's
 * `.offcanvas` with none of Bootstrap's JS — the modal machinery is the
 * Dialog's, verbatim: focus trap, focus restore, reference-counted scroll
 * lock, inert page, Escape and backdrop dismissal, full ARIA.
 *
 * Content goes in the default slot; actions in `[dsDrawerActions]`; the element
 * marked `[dsDrawerAutofocus]` takes initial focus instead of the panel.
 *
 * **A drawer is an overlay, and closes like one.** A panel that is part of the
 * layout — always open, resizable, remembered — is not this component; that is
 * a column, and columns are built with `<ds-grid>`.
 *
 * @example
 * ```html
 * <ds-drawer [(open)]="selected" [title]="invoice()?.id ?? ''" description="Invoice detail">
 *   <ds-stack [gap]="4">…</ds-stack>
 *
 *   <ds-flex dsDrawerActions [gap]="2" justify="end">
 *     <ds-button variant="ghost" (clicked)="selected.set(false)">Close</ds-button>
 *     <ds-button variant="primary">Mark paid</ds-button>
 *   </ds-flex>
 * </ds-drawer>
 * ```
 */
@Component({
  selector: 'ds-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, IconComponent],
  host: {
    // `title` is also a native HTML attribute: left in the DOM it would show a
    // browser tooltip on hover. Paint uses it as the drawer's heading only.
    '[attr.title]': 'null',
  },
  template: `
    @if (open()) {
      <div class="modal-backdrop show ds-drawer__backdrop" (click)="onBackdrop()"></div>

      <div
        #panel
        class="offcanvas show ds-drawer__panel"
        [class.offcanvas-end]="position() === 'end'"
        [class.offcanvas-start]="position() === 'start'"
        [class.ds-drawer__panel--start]="position() === 'start'"
        [style.--ds-drawer-width]="width()"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
        [attr.aria-describedby]="description() ? descriptionId : null"
        (keydown)="onKeydown($event)"
      >
        <div class="offcanvas-header ds-drawer__header">
          <div class="ds-drawer__heading">
            @if (icon()) {
              <span class="ds-drawer__icon" aria-hidden="true">
                <ds-icon [name]="icon()!" size="md" />
              </span>
            }
            <div class="ds-drawer__titles">
              <h2 class="offcanvas-title ds-drawer__title" [id]="titleId">{{ title() }}</h2>
              @if (description()) {
                <p class="ds-drawer__description" [id]="descriptionId">{{ description() }}</p>
              }
            </div>
          </div>

          @if (dismissible()) {
            <ds-button
              variant="ghost"
              size="sm"
              iconStart="close"
              [label]="closeLabel()"
              (clicked)="close('dismiss')"
            />
          }
        </div>

        <div class="offcanvas-body ds-drawer__body">
          <ng-content />
        </div>

        <!-- Footer only exists when the caller projects actions into it. -->
        <div class="ds-drawer__footer">
          <ng-content select="[dsDrawerActions]" />
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      display: contents;
    }

    .ds-drawer__backdrop {
      /* The Dialog's ink, grain and all: the page recedes the same way. */
      background-color: var(--ds-color-overlay);
      background-image: var(--ds-texture-grain);
      background-size: 160px 160px;
      background-blend-mode: soft-light;
      opacity: 1;
      animation: ds-drawer-fade 160ms ease-out;
    }

    .ds-drawer__panel {
      --bs-offcanvas-width: min(var(--ds-drawer-width), calc(100vw - var(--ds-space-10)));

      display: flex;
      flex-direction: column;
      background: var(--ds-color-surface);
      color: var(--ds-color-text);
      border: 0;
      box-shadow: var(--ds-shadow-xl);
      visibility: visible;
      animation: ds-drawer-in-end 240ms cubic-bezier(0.16, 0.84, 0.44, 1);
    }

    .ds-drawer__panel--start {
      animation-name: ds-drawer-in-start;
    }

    .ds-drawer__panel:focus {
      outline: none;
    }

    .ds-drawer__header {
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--ds-space-3);
      padding: var(--ds-space-5) var(--ds-space-5) var(--ds-space-3);
    }

    .ds-drawer__heading {
      display: flex;
      align-items: flex-start;
      gap: var(--ds-space-3);
      min-width: 0;
      flex: 1 1 auto;
    }

    .ds-drawer__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      flex-shrink: 0;
      border-radius: var(--ds-radius-md);
      background: var(--ds-color-primary-muted);
      color: var(--ds-color-primary);
    }

    .ds-drawer__titles {
      min-width: 0;
    }

    .ds-drawer__title {
      font-family: var(--ds-font-display);
      font-size: var(--ds-font-size-xl);
      font-weight: var(--ds-font-weight-bold);
      letter-spacing: var(--ds-letter-spacing-tight);
      line-height: var(--ds-line-height-snug);
      color: var(--ds-color-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ds-drawer__description {
      margin: var(--ds-space-1) 0 0;
      font-size: var(--ds-font-size-sm);
      color: var(--ds-color-text-muted);
    }

    .ds-drawer__body {
      padding: var(--ds-space-2) var(--ds-space-5) var(--ds-space-5);
    }

    .ds-drawer__footer {
      border-top: 1px solid var(--ds-color-border);
      background: var(--ds-color-surface-sunken);
      padding: var(--ds-space-3) var(--ds-space-5);
      margin-block-start: auto;
    }

    /* No projected actions, no footer chrome. */
    .ds-drawer__footer:empty {
      display: none;
    }

    @keyframes ds-drawer-fade {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes ds-drawer-in-end {
      from {
        transform: translateX(2rem);
        opacity: 0;
      }
      to {
        transform: none;
        opacity: 1;
      }
    }

    @keyframes ds-drawer-in-start {
      from {
        transform: translateX(-2rem);
        opacity: 0;
      }
      to {
        transform: none;
        opacity: 1;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ds-drawer__backdrop,
      .ds-drawer__panel {
        animation: none;
      }
    }
  `,
})
export class DrawerComponent {
  private readonly document = inject(DOCUMENT);
  private readonly scrollLock = inject(ScrollLockService);
  private readonly pageInert = inject(PageInertService);

  /** Visibility. Two-way bindable. */
  readonly open = model<boolean>(false);

  /** Required: a drawer without a title cannot be announced. */
  readonly title = input.required<string>();
  /** Optional supporting line under the title. */
  readonly description = input<string>('');
  /** Which edge it slides from. `end` is where detail panes live. */
  readonly position = input<DrawerPosition>('end');
  readonly size = input<DrawerSize>('md');
  readonly icon = input<IconName | null>(null);
  /** Allow Escape, the backdrop and the close button to dismiss. */
  readonly dismissible = input(true);
  readonly closeLabel = input<string>('Close panel');

  /** Emits how the drawer was closed. */
  readonly closed = output<'dismiss' | 'escape' | 'backdrop' | 'api'>();
  /** Emits once the drawer is open and focus has moved inside. */
  readonly opened = output<void>();

  protected readonly titleId = uniqueId('ds-drawer-title');
  protected readonly descriptionId = uniqueId('ds-drawer-description');

  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');
  private previouslyFocused: HTMLElement | null = null;

  protected width(): string {
    return DRAWER_WIDTH[this.size()];
  }

  constructor() {
    // Lock scroll, silence the page, move focus in — and undo it all on the
    // way out. The Dialog's choreography, note for note.
    effect(() => {
      if (this.open()) {
        this.onOpened();
      } else {
        this.onClosed();
      }
    });

    // A drawer destroyed while open must not leave the page locked or silenced.
    inject(DestroyRef).onDestroy(() => this.releasePage());
  }

  private locked = false;
  private silenced = false;

  /** Closes the drawer from code. */
  close(reason: 'dismiss' | 'escape' | 'backdrop' | 'api' = 'api'): void {
    if (!this.open()) {
      return;
    }
    this.open.set(false);
    this.closed.emit(reason);
  }

  protected onBackdrop(): void {
    if (this.dismissible()) {
      this.close('backdrop');
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.dismissible()) {
      event.preventDefault();
      this.close('escape');
      return;
    }

    const panel = this.panelRef()?.nativeElement;
    if (panel) {
      trapTab(panel, event);
    }
  }

  private onOpened(): void {
    this.previouslyFocused = this.document.activeElement as HTMLElement | null;

    if (!this.locked) {
      this.scrollLock.lock();
      this.locked = true;
    }

    // Wait for the panel to exist, then move focus inside it. The default
    // target is the panel itself, so the announcement is its name and
    // description — not a read-through of every control. `[dsDrawerAutofocus]`
    // overrides it.
    queueMicrotask(() => {
      const panel = this.panelRef()?.nativeElement;
      if (!panel) {
        return;
      }

      if (!this.silenced) {
        this.pageInert.activate(panel);
        this.silenced = true;
      }

      const autofocus = panel.querySelector<HTMLElement>('[dsDrawerAutofocus]');
      (autofocus ?? panel).focus();
      this.opened.emit();
    });
  }

  private onClosed(): void {
    this.releasePage();

    // Return focus to whatever opened the drawer — the table row, usually.
    this.previouslyFocused?.focus?.();
    this.previouslyFocused = null;
  }

  private releasePage(): void {
    if (this.locked) {
      this.scrollLock.release();
      this.locked = false;
    }
    if (this.silenced) {
      this.pageInert.deactivate();
      this.silenced = false;
    }
  }
}
