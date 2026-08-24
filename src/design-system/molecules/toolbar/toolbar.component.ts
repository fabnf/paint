import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRender,
  computed,
  inject,
  input,
} from '@angular/core';
import { cx, spaceToken, type SpaceValue } from '../../primitives/primitives.types';

export type ToolbarOrientation = 'horizontal' | 'vertical';

/** Controls the toolbar owns. Anything inside an overlay belongs to the overlay. */
const CONTROL_SELECTOR = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[role="button"]:not([aria-disabled="true"])',
  '[data-toolbar-control]',
]
  .map((selector) => `${selector}:not([data-toolbar-skip])`)
  .join(',');

/** A menu's items are the menu's problem; so are a listbox's options. */
const OVERLAY_SELECTOR = '[role="menu"],[role="listbox"],[role="dialog"],[role="grid"],.dropdown-menu';

/** Typing into these means the arrow keys are not the toolbar's to take. */
const TEXT_ENTRY = 'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]),textarea,[contenteditable="true"]';

/**
 * Toolbar — a cluster of actions that behaves like one control.
 *
 * Eight icon buttons in a row are eight tab stops, and a keyboard user passes
 * through all of them on the way to the content. The ARIA toolbar pattern makes
 * them **one** tab stop: `Tab` enters and leaves, the arrows move inside.
 *
 * It owns the roving `tabindex` of whatever is projected into it, which means it
 * works with `<ds-button>`, a `<ds-menu>` trigger, a `<ds-select>`, a search
 * field, or a plain `<button>` — without any of them knowing. Controls inside an
 * open menu or listbox are that overlay's, not the toolbar's, and a focused text
 * field keeps its own arrow keys.
 *
 * This is an actions cluster, not a filter bar: it does not own the state of the
 * things inside it, and it will not grow a "clear all".
 *
 * @example
 * ```html
 * <ds-toolbar ariaLabel="Document actions">
 *   <ds-button variant="ghost" iconStart="edit" label="Rename" />
 *   <ds-button variant="ghost" iconStart="copy" label="Duplicate" />
 *   <ds-divider orientation="vertical" [spacing]="0" />
 *   <ds-menu label="Export" icon="download" [entries]="entries" />
 * </ds-toolbar>
 * ```
 */
@Component({
  selector: 'ds-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'toolbar',
    '[class]': 'classes()',
    '[attr.aria-label]': 'ariaLabelledBy() ? null : ariaLabel() || null',
    '[attr.aria-labelledby]': 'ariaLabelledBy() || null',
    '[attr.aria-orientation]': 'orientation() === "vertical" ? "vertical" : null',
    '[style.gap]': 'gapValue()',
    '(keydown)': 'onKeydown($event)',
    '(focusin)': 'onFocusIn($event)',
  },
  template: `<ng-content />`,
  styles: `
    :host {
      display: flex;
      align-items: center;
      flex-wrap: nowrap;
    }

    :host(.ds-toolbar--wrap) {
      flex-wrap: wrap;
      row-gap: var(--ds-space-2);
    }

    :host(.ds-toolbar--vertical) {
      flex-direction: column;
      align-items: stretch;
    }

    :host(.ds-toolbar--bordered) {
      padding: var(--ds-space-2);
      border: 1px solid var(--ds-color-border);
      border-radius: var(--ds-radius-lg);
      background-color: var(--ds-color-surface);
    }
  `,
})
export class ToolbarComponent implements AfterViewInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Names the toolbar. A page with two of them needs two names. */
  readonly ariaLabel = input<string>('');
  /** Id of a visible heading that names it. Takes precedence over `ariaLabel`. */
  readonly ariaLabelledBy = input<string>('');
  readonly orientation = input<ToolbarOrientation>('horizontal');
  readonly gap = input<SpaceValue>(1);
  readonly wrap = input(false);
  /** A box around the cluster, for a toolbar that floats over content. */
  readonly bordered = input(false);
  /**
   * Manage the roving `tabindex`.
   *
   * Off when the toolbar is a row of links in running text, or when something
   * else already owns the keyboard inside it.
   */
  readonly roving = input(true);

  /** The control that currently holds the toolbar's single tab stop. */
  private active: HTMLElement | null = null;

  /** Controls we have already looked at, and the ones that asked to be left alone. */
  private readonly seen = new WeakSet<HTMLElement>();
  private readonly optedOut = new WeakSet<HTMLElement>();

  constructor() {
    // The controls are projected and can come and go — a button becomes disabled,
    // a chip is removed, a menu renders an item. Re-point the tab stop after every
    // render: it is a `querySelectorAll` over a handful of nodes, and it touches
    // nothing that is already correct.
    afterRender(() => this.syncTabStops());
  }

  ngAfterViewInit(): void {
    this.syncTabStops();
  }

  protected readonly gapValue = computed(() => `var(--ds-space-${spaceToken(this.gap())})`);

  protected readonly classes = computed(() =>
    cx(
      'ds-toolbar',
      `ds-toolbar--${this.orientation()}`,
      this.wrap() && 'ds-toolbar--wrap',
      this.bordered() && 'ds-toolbar--bordered',
    ),
  );

  /**
   * Is the caret already at the edge the user is pressing towards?
   *
   * A multi-line field keeps its arrows: "the end of the line" is not "the end of
   * the field", and guessing which one the user meant is how toolbars lose text.
   */
  private caretWouldLeave(field: HTMLElement, step: number | 'first' | 'last'): boolean {
    if (typeof step !== 'number' || field.tagName === 'TEXTAREA' || field.isContentEditable) {
      return false;
    }

    const input = field as HTMLInputElement;
    let start: number | null = null;
    let end: number | null = null;

    try {
      start = input.selectionStart;
      end = input.selectionEnd;
    } catch {
      // `selectionStart` throws on a `number` input in some browsers.
      return false;
    }

    if (start === null || end === null || start !== end) {
      return false;
    }

    return step > 0 ? start === input.value.length : start === 0;
  }

  /**
   * The controls the toolbar is responsible for, in DOM order.
   *
   * A control that was *born* with `tabindex="-1"` opted out before the toolbar
   * ever saw it — a Select's chip-remove buttons, an Input's clear button — and
   * it keeps that choice. The toolbar's own `-1`s are written after this runs.
   */
  private controls(): HTMLElement[] {
    if (!this.roving()) {
      return [];
    }

    const found = Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>(CONTROL_SELECTOR),
    ).filter((element) => !element.closest(OVERLAY_SELECTOR));

    for (const element of found) {
      if (!this.seen.has(element)) {
        this.seen.add(element);
        if (element.getAttribute('tabindex') === '-1') {
          this.optedOut.add(element);
        }
      }
    }

    return found.filter((element) => !this.optedOut.has(element));
  }

  /** Exactly one control is reachable with `Tab`; the rest answer to the arrows. */
  private syncTabStops(): void {
    const controls = this.controls();
    if (controls.length === 0) {
      return;
    }

    if (!this.active || !controls.includes(this.active)) {
      this.active = controls[0];
    }

    for (const control of controls) {
      const wanted = control === this.active ? '0' : '-1';
      if (control.getAttribute('tabindex') !== wanted) {
        control.setAttribute('tabindex', wanted);
      }
    }
  }

  /** Focus arrived — by Tab, or by a click. Whatever it landed on owns the tab stop. */
  protected onFocusIn(event: FocusEvent): void {
    const controls = this.controls();
    const target = (event.target as HTMLElement)?.closest<HTMLElement>(CONTROL_SELECTOR);

    if (target && controls.includes(target)) {
      this.active = target;
      this.syncTabStops();
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;

    if (!this.roving() || target?.closest(OVERLAY_SELECTOR)) {
      return;
    }

    const vertical = this.orientation() === 'vertical';
    const next = vertical ? 'ArrowDown' : 'ArrowRight';
    const previous = vertical ? 'ArrowUp' : 'ArrowLeft';

    let step: number | 'first' | 'last';
    switch (event.key) {
      case next:
        step = 1;
        break;
      case previous:
        step = -1;
        break;
      case 'Home':
        step = 'first';
        break;
      case 'End':
        step = 'last';
        break;
      default:
        return;
    }

    // Inside a text field the arrows are the caret's — until the caret has
    // nowhere left to go, which is when the user meant the toolbar. `Home` and
    // `End` are always the caret's: that is what they are for.
    const field = target?.closest<HTMLElement>(TEXT_ENTRY);
    if (field && !this.caretWouldLeave(field, step)) {
      return;
    }

    const controls = this.controls();
    if (controls.length === 0) {
      return;
    }

    event.preventDefault();

    const current = this.active ? controls.indexOf(this.active) : 0;
    const index =
      step === 'first'
        ? 0
        : step === 'last'
          ? controls.length - 1
          : // Wrapping is what makes a toolbar feel like one control rather than a row.
            (current + step + controls.length) % controls.length;

    this.active = controls[index];
    this.syncTabStops();
    this.active.focus();
  }
}
