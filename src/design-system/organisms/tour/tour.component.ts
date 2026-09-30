import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../primitives/button';
import { CheckboxComponent } from '../../primitives/checkbox';
import { PageInertService, ScrollLockService, trapTab, uniqueId } from '../../utils';
import { DS_TOUR_MEMORY, type TourEndReason, type TourStep, type TourStepEvent } from './tour.types';

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** How long to wait for a step's target to appear after a navigation. */
const DEFAULT_TARGET_TIMEOUT = 5_000;
const POLL_INTERVAL = 60;

/**
 * Tour — a guided walkthrough that points at the real UI.
 *
 * The host passes ordered steps; each one names a piece of the *live* page by
 * CSS selector, so the tour teaches the product rather than a mock-up of it. A
 * step whose target lives on another route asks the host to go there (or routes
 * itself) and **waits for the target to exist** before opening — a tour that
 * points at an empty rectangle is worse than no tour.
 *
 * While a step is open the page is treated the way `<ds-dialog>` treats it:
 * everything outside the card is `inert` (so nothing outside can be tabbed to,
 * browsed or found), the body scroll is locked through the same reference-counted
 * service, focus moves to the card and returns to wherever it came from at the
 * end. The rest of the page is dimmed by the spotlight — a hole cut around the
 * target — which is decoration over that, not instead of it.
 *
 * **A tour that crosses routes must live outside the router outlet** — in the
 * app shell, beside the toast host — or the router will destroy it on the first
 * `Next`. A single-page tour can sit wherever it points.
 *
 * `Escape` skips, when the tour allows it. `dontShowAgain` offers the checkbox
 * that stops this `tourId` coming back, remembered by {@link TourMemory}.
 *
 * @example
 * ```html
 * <ds-tour
 *   #tour
 *   tourId="paint-intro"
 *   [steps]="steps"
 *   [dontShowAgain]="true"
 *   (ended)="log($event)"
 * />
 * <ds-button (clicked)="tour.start()">Take the tour</ds-button>
 * ```
 */
@Component({
  selector: 'ds-tour',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, CheckboxComponent],
  template: `
    @if (open() && current(); as step) {
      <!--
        One element does the dimming: a transparent box over the target with a
        very large shadow around it. No four-panel overlay to keep in sync, and
        the target stays visible at full contrast.
      -->
      <div
        class="ds-tour__spotlight"
        [class.ds-tour__spotlight--centred]="!spotlight()"
        [style.top.px]="spotlight()?.top"
        [style.left.px]="spotlight()?.left"
        [style.width.px]="spotlight()?.width"
        [style.height.px]="spotlight()?.height"
        aria-hidden="true"
      ></div>

      <div
        #card
        class="ds-tour__card"
        [class]="cardClasses()"
        [style.top.px]="cardTop()"
        [style.left.px]="cardLeft()"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
        [attr.aria-describedby]="bodyId"
        tabindex="-1"
        (keydown)="onKeydown($event)"
      >
        <div class="ds-tour__head">
          @if (step.layer) {
            <span class="ds-tour__layer">{{ step.layer }}</span>
          }
          <!-- Where you are, in words, in a region that was already here. -->
          <span class="ds-tour__position" role="status">{{ positionText() }}</span>
        </div>

        <h2 class="ds-tour__title" [id]="titleId">{{ step.title }}</h2>
        <p class="ds-tour__body" [id]="bodyId">{{ step.body }}</p>

        @if (waiting()) {
          <p class="ds-tour__waiting">{{ waitingLabel() }}</p>
        }

        @if (dontShowAgain()) {
          <ds-checkbox
            class="ds-tour__suppress"
            size="sm"
            [label]="dontShowAgainLabel()"
            [(checked)]="suppress"
          />
        }

        <div class="ds-tour__actions">
          <ds-button variant="ghost" size="sm" (clicked)="skip()">{{ skipLabel() }}</ds-button>

          <div class="ds-tour__move">
            @if (index() > 0) {
              <ds-button variant="secondary" size="sm" iconStart="chevronLeft" (clicked)="back()">
                {{ backLabel() }}
              </ds-button>
            }
            @if (isLast()) {
              <ds-button variant="primary" size="sm" (clicked)="finish()">{{ doneLabel() }}</ds-button>
            } @else {
              <ds-button variant="primary" size="sm" iconEnd="chevronRight" (clicked)="next()">
                {{ nextLabel() }}
              </ds-button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      display: contents;
    }

    /* The hole in the dimming. Pointer-transparent: the card is the control. */
    .ds-tour__spotlight {
      position: fixed;
      z-index: 1055;
      border-radius: var(--ds-radius-lg);
      box-shadow:
        0 0 0 9999px var(--ds-color-overlay),
        0 0 0 3px var(--ds-color-primary);
      pointer-events: none;
      transition:
        top 180ms ease,
        left 180ms ease,
        width 180ms ease,
        height 180ms ease;
    }

    /* No target: the page is simply dimmed, and the card sits in the middle. */
    .ds-tour__spotlight--centred {
      inset: 0;
      width: auto;
      height: auto;
      border-radius: 0;
      box-shadow: none;
      background-color: var(--ds-color-overlay);
    }

    .ds-tour__card {
      position: fixed;
      z-index: 1060;
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-2);
      width: min(24rem, calc(100vw - 2rem));
      padding: var(--ds-space-5);
      border-radius: var(--ds-radius-lg);
      background-color: var(--ds-color-surface-elevated);
      box-shadow: var(--ds-shadow-xl);
      animation: ds-tour-in 160ms ease-out;
    }

    .ds-tour__card--centred {
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .ds-tour__card:focus {
      outline: none;
    }

    .ds-tour__card:focus-visible {
      outline: 2px solid var(--ds-color-focus-ring);
      outline-offset: 3px;
    }

    .ds-tour__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ds-space-3);
    }

    .ds-tour__layer {
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-semibold);
      letter-spacing: var(--ds-letter-spacing-wider);
      text-transform: uppercase;
      color: var(--ds-color-primary);
    }

    .ds-tour__position {
      font-family: var(--ds-font-mono);
      font-size: var(--ds-font-size-xs);
      font-variant-numeric: tabular-nums;
      color: var(--ds-color-text-subtle);
    }

    .ds-tour__title {
      margin: 0;
      font-size: var(--ds-font-size-lg);
      font-weight: var(--ds-font-weight-semibold);
      line-height: var(--ds-line-height-snug);
      color: var(--ds-color-text);
    }

    .ds-tour__body {
      margin: 0;
      font-size: var(--ds-font-size-sm);
      line-height: var(--ds-line-height-relaxed);
      color: var(--ds-color-text-muted);
    }

    .ds-tour__waiting {
      margin: 0;
      font-size: var(--ds-font-size-xs);
      color: var(--ds-color-text-subtle);
    }

    .ds-tour__suppress {
      margin-block-start: var(--ds-space-1);
    }

    .ds-tour__actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ds-space-3);
      margin-block-start: var(--ds-space-2);
    }

    .ds-tour__move {
      display: flex;
      gap: var(--ds-space-2);
    }

    @keyframes ds-tour-in {
      from {
        opacity: 0;
        transform: translateY(0.5rem);
      }
      to {
        opacity: 1;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ds-tour__card {
        animation: none;
      }

      .ds-tour__spotlight {
        transition: none;
      }
    }
  `,
})
export class TourComponent<T = unknown> {
  private readonly document = inject(DOCUMENT);
  private readonly scrollLock = inject(ScrollLockService);
  private readonly pageInert = inject(PageInertService);
  private readonly memory = inject(DS_TOUR_MEMORY, { optional: true });
  private readonly router = inject(Router, { optional: true });

  /** Identity of *this* walkthrough, for "don't show again". */
  readonly tourId = input<string>('ds-tour');
  /** The steps, in order. */
  readonly steps = input<readonly TourStep<T>[]>([]);
  /** Running or not. Two-way bindable; `start()` is the usual way in. */
  readonly open = model(false);
  /** Let `Escape` (and the Skip button) end it. */
  readonly dismissible = input(true);
  /** Offer the checkbox that stops this tour coming back. */
  readonly dontShowAgain = input(false);
  /** Route a step's `route` itself, when a `Router` is available. */
  readonly autoNavigate = input(true);
  /** How long to wait for a target to appear before giving up on pointing at it. */
  readonly targetTimeout = input(DEFAULT_TARGET_TIMEOUT);

  readonly nextLabel = input<string>('Next');
  readonly backLabel = input<string>('Back');
  readonly skipLabel = input<string>('Skip');
  readonly doneLabel = input<string>('Done');
  readonly dontShowAgainLabel = input<string>('Don’t show this again');
  readonly waitingLabel = input<string>('Looking for this step on the page…');

  /** A step opened. */
  readonly stepChange = output<TourStepEvent<T>>();
  /** The last step's Done was pressed. */
  readonly completed = output<void>();
  /** Skipped, or escaped. */
  readonly skipped = output<TourStepEvent<T>>();
  /** However it ended. */
  readonly ended = output<TourEndReason>();
  /** A step needs another route. Always emitted; also acted on when `autoNavigate`. */
  readonly navigate = output<string>();
  /** The user asked not to see this tour again. */
  readonly suppressed = output<string>();

  protected readonly index = signal(0);
  protected readonly suppress = model(false);
  protected readonly waiting = signal(false);
  protected readonly spotlight = signal<SpotlightRect | null>(null);
  protected readonly cardTop = signal<number | null>(null);
  protected readonly cardLeft = signal<number | null>(null);

  protected readonly titleId = uniqueId('ds-tour-title');
  protected readonly bodyId = uniqueId('ds-tour-body');

  private readonly cardRef = viewChild<ElementRef<HTMLElement>>('card');
  private previouslyFocused: HTMLElement | null = null;
  private locked = false;
  private silenced = false;
  /** Bumped on every step change, so a slow target search knows it is stale. */
  private token = 0;
  private readonly onViewportChange = () => this.position();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.teardown());
  }

  protected readonly current = computed<TourStep<T> | null>(
    () => this.steps()[this.index()] ?? null,
  );

  protected readonly isLast = computed(() => this.index() >= this.steps().length - 1);

  protected readonly positionText = computed(
    () => `${this.index() + 1} of ${this.steps().length}`,
  );

  protected readonly cardClasses = computed(() =>
    this.cardTop() === null ? 'ds-tour__card--centred' : '',
  );

  /** Has the user asked for this tour to stop coming back? */
  isSuppressed(): boolean {
    return this.memory?.isSuppressed(this.tourId()) ?? false;
  }

  /** Clears this tour's "don't show again" — a settings screen, or a demo's reset. */
  forgetSuppression(): void {
    this.memory?.forget(this.tourId());
  }

  /**
   * Starts the walkthrough — unless the user has said not to show it again,
   * in which case nothing happens and `false` comes back.
   */
  start(at = 0): boolean {
    if (this.isSuppressed() || !this.steps().length) {
      return false;
    }
    this.previouslyFocused = this.document.activeElement as HTMLElement | null;
    this.suppress.set(false);
    this.open.set(true);
    void this.goTo(at);
    return true;
  }

  /** Moves to a step: route to it if it lives elsewhere, wait for it, then open it. */
  async goTo(index: number): Promise<void> {
    const steps = this.steps();
    const next = Math.min(Math.max(index, 0), steps.length - 1);
    const step = steps[next];
    if (!step) {
      return;
    }

    this.index.set(next);
    const token = ++this.token;

    if (step.route && this.router && this.autoNavigate()) {
      this.navigate.emit(step.route);
      // Unlock first: a navigation that cannot scroll lands in the wrong place.
      this.releasePage();
      await this.router.navigateByUrl(step.route);
    } else if (step.route) {
      this.navigate.emit(step.route);
    }

    if (token !== this.token) {
      return;
    }

    const target = step.target ? await this.waitForTarget(step.target, token) : null;
    if (token !== this.token || !this.open()) {
      return;
    }

    if (target) {
      target.scrollIntoView({ block: 'center', inline: 'center', behavior: 'auto' });
    }

    this.holdPage();
    this.position(target);
    this.focusCard();
    this.stepChange.emit({ step, index: next, count: steps.length });
  }

  next(): void {
    if (this.isLast()) {
      this.finish();
      return;
    }
    void this.goTo(this.index() + 1);
  }

  back(): void {
    if (this.index() > 0) {
      void this.goTo(this.index() - 1);
    }
  }

  /** The way out that is not finishing. Honours `dismissible`. */
  skip(reason: TourEndReason = 'skip'): void {
    if (!this.dismissible()) {
      return;
    }
    const step = this.current();
    if (step) {
      this.skipped.emit({ step, index: this.index(), count: this.steps().length });
    }
    this.end(reason);
  }

  /** The last step's Done. The tour counts as completed. */
  finish(): void {
    this.memory?.complete(this.tourId());
    this.completed.emit();
    this.end('done');
  }

  /** Ends it from code, without completing it. */
  close(): void {
    this.end('api');
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (!this.dismissible()) {
        return;
      }
      event.preventDefault();
      this.skip('escape');
      return;
    }
    const card = this.cardRef()?.nativeElement;
    if (card) {
      trapTab(card, event);
    }
  }

  private end(reason: TourEndReason): void {
    if (!this.open()) {
      return;
    }
    if (this.suppress() && this.memory) {
      this.memory.suppress(this.tourId());
      this.suppressed.emit(this.tourId());
    }
    this.token++;
    this.open.set(false);
    this.teardown();
    this.ended.emit(reason);
  }

  /** Waits for the target to exist, polling, and gives up after `targetTimeout`. */
  private waitForTarget(selector: string, token: number): Promise<HTMLElement | null> {
    const found = this.document.querySelector<HTMLElement>(selector);
    if (found) {
      return Promise.resolve(found);
    }

    this.waiting.set(true);
    const deadline = Date.now() + this.targetTimeout();
    return new Promise((resolve) => {
      const poll = () => {
        if (token !== this.token || !this.open()) {
          this.waiting.set(false);
          resolve(null);
          return;
        }
        const element = this.document.querySelector<HTMLElement>(selector);
        if (element) {
          this.waiting.set(false);
          resolve(element);
          return;
        }
        if (Date.now() >= deadline) {
          // The step still opens — centred, with its words. A tour that stalls
          // because one selector moved is a tour nobody can get out of.
          this.waiting.set(false);
          resolve(null);
          return;
        }
        setTimeout(poll, POLL_INTERVAL);
      };
      setTimeout(poll, POLL_INTERVAL);
    });
  }

  /** Puts the spotlight on the target and the card beside it. */
  private position(target?: HTMLElement | null): void {
    const element =
      target ?? (this.current()?.target
        ? this.document.querySelector<HTMLElement>(this.current()!.target!)
        : null);

    if (!element) {
      this.spotlight.set(null);
      this.cardTop.set(null);
      this.cardLeft.set(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    const pad = 8;
    this.spotlight.set({
      top: rect.top - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
    });

    const view = this.document.defaultView;
    const viewportHeight = view?.innerHeight ?? 768;
    const viewportWidth = view?.innerWidth ?? 1024;
    const cardHeight = this.cardRef()?.nativeElement.offsetHeight ?? 200;
    const cardWidth = this.cardRef()?.nativeElement.offsetWidth ?? 360;
    const gap = 16;

    const below = rect.bottom + gap;
    const above = rect.top - cardHeight - gap;
    // Below if it fits, above if that fits — and otherwise pinned to the bottom
    // of the viewport, which for a target taller than the screen is the only
    // place that does not cover the thing being pointed at.
    const top =
      below + cardHeight < viewportHeight
        ? below
        : above >= gap
          ? above
          : viewportHeight - cardHeight - gap;
    const left = Math.min(
      Math.max(gap, rect.left),
      Math.max(gap, viewportWidth - cardWidth - gap),
    );

    this.cardTop.set(top);
    this.cardLeft.set(left);
  }

  private focusCard(attempt = 0): void {
    queueMicrotask(() => {
      const card = this.cardRef()?.nativeElement;
      if (!card) {
        // The card renders on the change detection that follows this step's
        // resolution, which may be a turn or two away after a navigation.
        if (attempt < 10 && this.open()) {
          setTimeout(() => this.focusCard(attempt + 1));
        }
        return;
      }
      if (!this.silenced) {
        this.pageInert.activate(card);
        this.silenced = true;
      }
      // The card itself, so its title and body are announced before its buttons.
      card.focus();
      // Measuring needs the card to exist; the first placement guessed its size.
      this.position();
    });
  }

  /** Locks the page and listens for anything that would move the target. */
  private holdPage(): void {
    if (!this.locked) {
      this.scrollLock.lock();
      this.locked = true;
      this.document.defaultView?.addEventListener('resize', this.onViewportChange);
      this.document.defaultView?.addEventListener('scroll', this.onViewportChange, true);
    }
  }

  private releasePage(): void {
    if (this.locked) {
      this.scrollLock.release();
      this.locked = false;
      this.document.defaultView?.removeEventListener('resize', this.onViewportChange);
      this.document.defaultView?.removeEventListener('scroll', this.onViewportChange, true);
    }
  }

  private teardown(): void {
    this.releasePage();
    if (this.silenced) {
      this.pageInert.deactivate();
      this.silenced = false;
    }
    this.spotlight.set(null);
    this.cardTop.set(null);
    this.cardLeft.set(null);
    this.restoreFocus();
  }

  /**
   * Focus goes back where it came from — unless it cannot, which a tour makes
   * ordinary: the button that started it was three routes ago and no longer
   * exists. The main landmark is the next best place to land, and far better
   * than `<body>`, which would send a screen-reader user to the top of the page.
   */
  private restoreFocus(): void {
    const previous = this.previouslyFocused;
    this.previouslyFocused = null;

    if (previous && this.document.contains(previous)) {
      previous.focus?.();
      return;
    }

    const main = this.document.querySelector<HTMLElement>('main[tabindex], main, [role="main"]');
    main?.focus?.();
  }
}
