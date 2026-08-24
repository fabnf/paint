import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
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

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl';
export type DialogTone = 'default' | 'danger' | 'brand';

/**
 * Dialog — a modal conversation.
 *
 * Built on Bootstrap's `.modal` / `.modal-dialog` / `.modal-content` /
 * `.modal-backdrop`, with none of Bootstrap's JS. Paint adds the parts a modal
 * actually lives or dies by: a focus trap, focus restore, a reference-counted
 * scroll lock, Escape and backdrop dismissal, and full ARIA wiring.
 *
 * Content goes in the default slot; actions go in the `[dsDialogActions]` slot.
 *
 * @example
 * ```html
 * <ds-dialog
 *   [(open)]="confirmOpen"
 *   title="Delete project"
 *   description="This cannot be undone."
 *   tone="danger"
 *   icon="warning"
 * >
 *   <ds-text>Everything in “Mural” will be removed.</ds-text>
 *
 *   <ds-flex dsDialogActions [gap]="2" justify="end">
 *     <ds-button variant="ghost" (clicked)="confirmOpen.set(false)">Cancel</ds-button>
 *     <ds-button variant="danger" (clicked)="destroy()">Delete</ds-button>
 *   </ds-flex>
 * </ds-dialog>
 * ```
 */
@Component({
  selector: 'ds-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, IconComponent],
  host: {
    // `title` is also a native HTML attribute: left in the DOM it would show a
    // browser tooltip on hover. Paint uses it as the dialog's heading only.
    '[attr.title]': 'null',
  },
  template: `
    @if (open()) {
      <div class="modal-backdrop show ds-dialog__backdrop" (click)="onBackdrop()"></div>

      <div
        #modal
        class="modal d-block ds-dialog__modal"
        tabindex="-1"
        [attr.aria-labelledby]="titleId"
        [attr.aria-describedby]="description() ? descriptionId : null"
        aria-modal="true"
        role="dialog"
        (keydown)="onKeydown($event)"
      >
        <div
          class="modal-dialog modal-dialog-centered ds-dialog__dialog"
          [class.modal-sm]="size() === 'sm'"
          [class.modal-lg]="size() === 'lg'"
          [class.modal-xl]="size() === 'xl'"
          [class.modal-dialog-scrollable]="scrollable()"
        >
          <div #content class="modal-content ds-dialog__content" [class]="'ds-dialog--' + tone()">
            <div class="modal-header ds-dialog__header">
              <div class="ds-dialog__heading">
                @if (icon()) {
                  <span class="ds-dialog__icon" aria-hidden="true">
                    <ds-icon [name]="icon()!" size="md" />
                  </span>
                }
                <div class="ds-dialog__titles">
                  <h2 class="modal-title ds-dialog__title" [id]="titleId">{{ title() }}</h2>
                  @if (description()) {
                    <p class="ds-dialog__description" [id]="descriptionId">{{ description() }}</p>
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

            <div class="modal-body ds-dialog__body">
              <ng-content />
            </div>

            <!-- Footer only exists when the caller projects actions into it. -->
            <div class="modal-footer ds-dialog__footer">
              <ng-content select="[dsDialogActions]" />
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      display: contents;
    }

    .ds-dialog__backdrop {
      /* Paint's overlay token carries its own alpha; grain keeps it from looking
         like a flat sheet of plastic. */
      background-color: var(--ds-color-overlay);
      background-image: var(--ds-texture-grain);
      background-size: 160px 160px;
      background-blend-mode: soft-light;
      opacity: 1;
      animation: ds-dialog-fade 160ms ease-out;
    }

    .ds-dialog__modal {
      overflow-y: auto;
    }

    .ds-dialog__dialog {
      animation: ds-dialog-in 200ms cubic-bezier(0.16, 0.84, 0.44, 1);
    }

    .ds-dialog__modal:focus {
      outline: none;
    }

    .ds-dialog__content {
      border-radius: var(--ds-radius-xl);
      box-shadow: var(--ds-shadow-xl);
      overflow: hidden;
    }

    /* The tone paints a single edge of the sheet — never the whole surface. */
    .ds-dialog__content::before {
      content: '';
      position: absolute;
      inset-block-start: 0;
      inset-inline: 0;
      height: 4px;
      background: var(--ds-gradient-brand);
      opacity: 0;
    }

    .ds-dialog__content.ds-dialog--brand::before,
    .ds-dialog__content.ds-dialog--danger::before {
      opacity: 1;
    }

    .ds-dialog__content.ds-dialog--danger::before {
      background: var(--ds-color-danger);
    }

    /* Bootstrap pushes its dismiss over with a margin-left:auto rule scoped to
       .btn-close. Paint's dismiss is a Button primitive, so the header has to
       distribute the space itself. */
    .ds-dialog__header {
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--ds-space-3);
      border-bottom: 0;
      padding-block-end: var(--ds-space-2);
    }

    .ds-dialog__heading {
      display: flex;
      align-items: flex-start;
      gap: var(--ds-space-3);
      min-width: 0;
      flex: 1 1 auto;
    }

    .ds-dialog__icon {
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

    .ds-dialog--danger .ds-dialog__icon {
      background: var(--ds-color-danger-muted);
      color: var(--ds-color-danger);
    }

    .ds-dialog--brand .ds-dialog__icon {
      background: var(--ds-color-accent-muted);
      color: var(--ds-color-accent);
    }

    .ds-dialog--brand .ds-dialog__title {
      background: var(--ds-gradient-brand);
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
    }

    .ds-dialog__titles {
      min-width: 0;
    }

    .ds-dialog__title {
      font-family: var(--ds-font-display);
      font-size: var(--ds-font-size-xl);
      font-weight: var(--ds-font-weight-bold);
      letter-spacing: var(--ds-letter-spacing-tight);
      line-height: var(--ds-line-height-snug);
      color: var(--ds-color-text);
    }

    .ds-dialog__description {
      margin: var(--ds-space-1) 0 0;
      font-size: var(--ds-font-size-sm);
      color: var(--ds-color-text-muted);
    }

    .ds-dialog__body {
      padding-block: var(--ds-space-2) var(--ds-space-4);
      color: var(--ds-color-text);
    }

    .ds-dialog__footer {
      border-top: 1px solid var(--ds-color-border);
      background: var(--ds-color-surface-sunken);
      padding: var(--ds-space-3) var(--ds-space-5);
      display: block;
    }

    /* No projected actions, no footer chrome. */
    .ds-dialog__footer:empty {
      display: none;
    }

    @keyframes ds-dialog-fade {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes ds-dialog-in {
      from {
        opacity: 0;
        transform: translateY(1rem) scale(0.97);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ds-dialog__backdrop,
      .ds-dialog__dialog {
        animation: none;
      }
    }
  `,
})
export class DialogComponent {
  private readonly document = inject(DOCUMENT);
  private readonly scrollLock = inject(ScrollLockService);
  private readonly pageInert = inject(PageInertService);

  /** Visibility. Two-way bindable. */
  readonly open = model<boolean>(false);

  /** Required: a dialog without a title cannot be announced. */
  readonly title = input.required<string>();
  /** Optional supporting line under the title. */
  readonly description = input<string>('');
  readonly size = input<DialogSize>('md');
  /** `danger` and `brand` ink the top edge and the icon. */
  readonly tone = input<DialogTone>('default');
  readonly icon = input<IconName | null>(null);
  /** Allow Escape, the backdrop and the close button to dismiss. */
  readonly dismissible = input(true);
  /** Let a long body scroll inside the sheet instead of the page. */
  readonly scrollable = input(false);
  readonly closeLabel = input<string>('Close dialog');

  /** Emits how the dialog was closed. */
  readonly closed = output<'dismiss' | 'escape' | 'backdrop' | 'api'>();
  /** Emits once the dialog is open and focus has moved inside. */
  readonly opened = output<void>();

  protected readonly titleId = uniqueId('ds-dialog-title');
  protected readonly descriptionId = uniqueId('ds-dialog-description');

  private readonly modalRef = viewChild<ElementRef<HTMLElement>>('modal');
  private readonly contentRef = viewChild<ElementRef<HTMLElement>>('content');
  private previouslyFocused: HTMLElement | null = null;

  constructor() {
    // Lock scroll, move focus in, and put it back on the way out.
    effect(() => {
      if (this.open()) {
        this.onOpened();
      } else {
        this.onClosed();
      }
    });

    // A dialog destroyed while open must not leave the page locked or silenced.
    inject(DestroyRef).onDestroy(() => this.releasePage());
  }

  private locked = false;
  private silenced = false;

  /** Closes the dialog from code. */
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

    const modal = this.modalRef()?.nativeElement;
    if (modal) {
      trapTab(modal, event);
    }
  }

  private onOpened(): void {
    this.previouslyFocused = this.document.activeElement as HTMLElement | null;

    if (!this.locked) {
      this.scrollLock.lock();
      this.locked = true;
    }

    // Wait for the sheet to exist, then move focus inside it. The default target
    // is the dialog element itself — so the announcement is the dialog's name and
    // description, not a read-through of every control, and not "Close button",
    // which would be a trap for anyone who reads before they act.
    // `[dsDialogAutofocus]` overrides it.
    queueMicrotask(() => {
      const modal = this.modalRef()?.nativeElement;
      const content = this.contentRef()?.nativeElement;
      if (!modal || !content) {
        return;
      }

      // Everything outside the dialog goes inert: the focus trap handles Tab,
      // inert handles screen-reader browsing, find-in-page and touch.
      if (!this.silenced) {
        this.pageInert.activate(modal);
        this.silenced = true;
      }

      const autofocus = content.querySelector<HTMLElement>('[dsDialogAutofocus]');
      (autofocus ?? modal).focus();
      this.opened.emit();
    });
  }

  private onClosed(): void {
    this.releasePage();

    // Return focus to whatever opened the dialog.
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
