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
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { IconComponent } from '../../icons';
import { PageInertService, ScrollLockService, trapTab, uniqueId } from '../../utils';
import { filterCommands, type CommandPaletteItem } from './command-palette.types';

/**
 * CommandPalette — the "jump to" box.
 *
 * A modal combobox over everything a product can do: commands, links,
 * entities, mixed in one list. `⌘K` / `Ctrl+K` opens it anywhere; typing
 * filters at keystroke speed (prefix and word-boundary matching — predictable,
 * not fuzzy); `Enter` runs the row. A `run` is called, a `link` is navigated,
 * an `href` leaves the app in a new tab — the palette closes behind all three.
 *
 * The modal machinery is the Dialog's (scroll lock, inert page, Escape,
 * backdrop, focus restore), the ARIA is the Select's combobox/listbox pattern,
 * and the rows speak the Menu's visual language. Composed, not re-invented.
 *
 * @example
 * ```html
 * <ds-command-palette [items]="commands" (commandRun)="track($event)" />
 *
 * <!-- or open it from a button as well as the hotkey -->
 * <ds-button (clicked)="palette.openPalette()">Jump to…</ds-button>
 * <ds-command-palette #palette [items]="commands" />
 * ```
 */
@Component({
  selector: 'ds-command-palette',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: {
    '(document:keydown)': 'onDocumentKeydown($event)',
  },
  template: `
    @if (open()) {
      <!-- Visual only: the page-inert walk silences siblings, backdrop included,
           so the click-to-dismiss lives on the dialog wrapper below. -->
      <div class="modal-backdrop show ds-palette__backdrop"></div>

      <div
        class="ds-palette"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="label()"
        (click)="onOverlayClick($event)"
      >
        <div #panel class="ds-palette__panel" (keydown)="onKeydown($event)">
          <div class="ds-palette__search">
            <ds-icon name="search" size="sm" class="ds-palette__search-icon" />
            <input
              #queryInput
              type="text"
              class="ds-palette__input"
              role="combobox"
              autocomplete="off"
              spellcheck="false"
              [placeholder]="placeholder()"
              [attr.aria-label]="label()"
              aria-expanded="true"
              [attr.aria-controls]="listboxId"
              [attr.aria-activedescendant]="activeDescendant()"
              [value]="query()"
              (input)="onQuery($event)"
            />
            <kbd class="ds-palette__esc" aria-hidden="true">esc</kbd>
          </div>

          <div class="ds-palette__list" #list role="listbox" [id]="listboxId" [attr.aria-label]="label()">
            @for (section of sections(); track section.label ?? '∅') {
              @if (section.label) {
                <div class="ds-palette__group" role="presentation">{{ section.label }}</div>
              }

              @for (entry of section.entries; track entry.item.id) {
                <div
                  class="ds-palette__option"
                  role="option"
                  [id]="optionId(entry.index)"
                  [class.ds-palette__option--active]="entry.index === activeIndex()"
                  [class.ds-palette__option--disabled]="entry.item.disabled"
                  [attr.aria-selected]="entry.index === activeIndex()"
                  [attr.aria-disabled]="entry.item.disabled ? 'true' : null"
                  (click)="select(entry.item)"
                  (mousemove)="activeIndex.set(entry.index)"
                >
                  @if (entry.item.icon) {
                    <ds-icon [name]="entry.item.icon" size="sm" class="ds-palette__icon" />
                  } @else {
                    <span class="ds-palette__icon" aria-hidden="true"></span>
                  }

                  <span class="ds-palette__body">
                    <span class="ds-palette__label">{{ entry.item.label }}</span>
                    @if (entry.item.description) {
                      <span class="ds-palette__description">{{ entry.item.description }}</span>
                    }
                  </span>

                  @if (entry.item.shortcut) {
                    <kbd class="ds-palette__shortcut" aria-hidden="true">{{ entry.item.shortcut }}</kbd>
                  } @else if (entry.item.href) {
                    <ds-icon name="externalLink" size="xs" class="ds-palette__hint-icon" />
                  }
                </div>
              }
            }

            @if (results().length === 0) {
              <div class="ds-palette__empty">{{ emptyText() }} <em>“{{ query() }}”</em></div>
            }
          </div>

          <div class="ds-palette__footer" aria-hidden="true">
            <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
            <span><kbd>↵</kbd> select</span>
            <span><kbd>esc</kbd> close</span>
          </div>
        </div>

        <!-- The count, for ears: the list repaints silently otherwise. -->
        <span class="visually-hidden" aria-live="polite">{{ countAnnouncement() }}</span>
      </div>
    }
  `,
  styles: `
    :host {
      display: contents;
    }

    .ds-palette__backdrop {
      background-color: var(--ds-color-overlay);
      background-image: var(--ds-texture-grain);
      background-size: 160px 160px;
      background-blend-mode: soft-light;
      opacity: 1;
      animation: ds-palette-fade 120ms ease-out;
    }

    .ds-palette {
      position: fixed;
      inset: 0;
      z-index: 1060;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 15vh var(--ds-space-4) var(--ds-space-4);
    }

    .ds-palette__panel {
      width: min(40rem, 100%);
      display: flex;
      flex-direction: column;
      background: var(--ds-color-surface);
      border: 1px solid var(--ds-color-border);
      border-radius: var(--ds-radius-xl);
      box-shadow: var(--ds-shadow-xl);
      overflow: hidden;
      animation: ds-palette-in 160ms cubic-bezier(0.16, 0.84, 0.44, 1);
    }

    .ds-palette__search {
      display: flex;
      align-items: center;
      gap: var(--ds-space-2_5);
      padding: var(--ds-space-3) var(--ds-space-4);
      border-bottom: 1px solid var(--ds-color-border);
    }

    .ds-palette__search-icon {
      color: var(--ds-color-text-subtle);
      flex-shrink: 0;
    }

    .ds-palette__input {
      flex: 1 1 auto;
      min-width: 0;
      border: 0;
      outline: none;
      background: none;
      color: var(--ds-color-text);
      font-size: var(--ds-font-size-md);
      font-family: inherit;
    }

    .ds-palette__input::placeholder {
      color: var(--ds-color-text-subtle);
    }

    .ds-palette__esc,
    .ds-palette__shortcut,
    .ds-palette__footer kbd {
      flex-shrink: 0;
      padding: 0.1rem 0.3rem;
      border-radius: var(--ds-radius-sm);
      background: var(--ds-color-surface-sunken);
      border: 1px solid var(--ds-color-border);
      color: var(--ds-color-text-subtle);
      font-family: var(--ds-font-mono);
      font-size: var(--ds-font-size-xs);
    }

    .ds-palette__list {
      max-height: min(22rem, 50vh);
      overflow-y: auto;
      padding: var(--ds-space-2);
    }

    .ds-palette__group {
      padding: var(--ds-space-2) var(--ds-space-2_5) var(--ds-space-1);
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-semibold);
      letter-spacing: var(--ds-letter-spacing-wider);
      text-transform: uppercase;
      color: var(--ds-color-text-subtle);
    }

    .ds-palette__option {
      display: flex;
      align-items: flex-start;
      gap: var(--ds-space-2_5);
      padding: var(--ds-space-2) var(--ds-space-2_5);
      border-radius: var(--ds-radius-md);
      cursor: pointer;
    }

    .ds-palette__option--active {
      background: var(--ds-color-primary-muted);
    }

    .ds-palette__option--disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .ds-palette__icon {
      width: 1rem;
      flex-shrink: 0;
      margin-block-start: 0.15rem;
      color: var(--ds-color-text-subtle);
    }

    .ds-palette__option--active .ds-palette__icon {
      color: var(--ds-color-primary);
    }

    .ds-palette__body {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      min-width: 0;
      flex: 1 1 auto;
    }

    .ds-palette__label {
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-medium);
      color: var(--ds-color-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ds-palette__description {
      font-size: var(--ds-font-size-xs);
      color: var(--ds-color-text-subtle);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ds-palette__hint-icon {
      color: var(--ds-color-text-subtle);
      margin-block-start: 0.2rem;
    }

    .ds-palette__empty {
      padding: var(--ds-space-6) var(--ds-space-4);
      text-align: center;
      font-size: var(--ds-font-size-sm);
      color: var(--ds-color-text-muted);
    }

    .ds-palette__footer {
      display: flex;
      gap: var(--ds-space-4);
      padding: var(--ds-space-2) var(--ds-space-4);
      border-top: 1px solid var(--ds-color-border);
      background: var(--ds-color-surface-sunken);
      font-size: var(--ds-font-size-xs);
      color: var(--ds-color-text-subtle);
    }

    .ds-palette__footer span {
      display: inline-flex;
      align-items: center;
      gap: var(--ds-space-1);
    }

    @keyframes ds-palette-fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes ds-palette-in {
      from {
        opacity: 0;
        transform: translateY(-0.5rem) scale(0.98);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ds-palette__backdrop,
      .ds-palette__panel {
        animation: none;
      }
    }
  `,
})
export class CommandPaletteComponent {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router, { optional: true });
  private readonly scrollLock = inject(ScrollLockService);
  private readonly pageInert = inject(PageInertService);

  /** Everything the palette can reach: commands, links, entities, mixed. */
  readonly items = input.required<readonly CommandPaletteItem[]>();
  /** Visibility. Two-way bindable; the hotkey and Escape drive it too. */
  readonly open = model(false);

  /** `⌘K` / `Ctrl+K`, anywhere on the page. Off for hosts that own the key. */
  readonly hotkey = input(true);
  readonly placeholder = input<string>('Type a command or search…');
  readonly label = input<string>('Command palette');
  readonly emptyText = input<string>('Nothing matches');
  /** Most rows shown at once — a palette is a funnel, not a directory. */
  readonly limit = input(50);

  /** Every selection, links included — for telemetry and tests. */
  readonly commandRun = output<CommandPaletteItem>();

  protected readonly query = signal('');
  protected readonly activeIndex = signal(0);
  protected readonly listboxId = uniqueId('ds-palette-listbox');

  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('queryInput');
  private readonly listRef = viewChild<ElementRef<HTMLElement>>('list');

  private previouslyFocused: HTMLElement | null = null;
  private locked = false;
  private silenced = false;

  protected readonly results = computed(() =>
    filterCommands(this.query(), this.items(), this.limit()),
  );

  /** Results regrouped for render; indexes stay flat for the keyboard. */
  protected readonly sections = computed(() => {
    const sections: Array<{
      label: string | null;
      entries: Array<{ index: number; item: CommandPaletteItem }>;
    }> = [];

    this.results().forEach((item, index) => {
      const label = item.group ?? null;
      const last = sections[sections.length - 1];
      if (last && last.label === label) {
        last.entries.push({ index, item });
      } else {
        sections.push({ label, entries: [{ index, item }] });
      }
    });

    return sections;
  });

  protected readonly activeDescendant = computed(() => {
    const results = this.results();
    return results.length ? this.optionId(this.activeIndex()) : null;
  });

  protected readonly countAnnouncement = computed(() => {
    const count = this.results().length;
    if (!this.query()) {
      return '';
    }
    return count === 0 ? 'No results.' : `${count} result${count === 1 ? '' : 's'}.`;
  });

  constructor() {
    // The Dialog's choreography: lock, silence, focus in — undo on the way out.
    effect(() => {
      if (this.open()) {
        this.onOpened();
      } else {
        this.onClosed();
      }
    });

    inject(DestroyRef).onDestroy(() => this.releasePage());
  }

  /** Opens from code — a "Jump to…" button, usually. */
  openPalette(): void {
    this.open.set(true);
  }

  close(): void {
    this.open.set(false);
  }

  /** A click beside the panel closes; a click inside it is the panel's. */
  protected onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  protected optionId(index: number): string {
    return `${this.listboxId}-option-${index}`;
  }

  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.hotkey()) {
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.open.update((open) => !open);
    }
  }

  protected onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    // A new query is a new list: the cursor returns to the best match.
    this.activeIndex.set(this.firstEnabled());
  }

  protected onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        this.close();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.move(-1);
        break;
      case 'Home':
        event.preventDefault();
        this.setActive(this.firstEnabled());
        break;
      case 'End':
        event.preventDefault();
        this.setActive(this.lastEnabled());
        break;
      case 'Enter': {
        event.preventDefault();
        const item = this.results()[this.activeIndex()];
        if (item) {
          this.select(item);
        }
        break;
      }
      case 'Tab': {
        // Modal: Tab cycles the panel (which is, in practice, the input).
        const panel = this.panelRef()?.nativeElement;
        if (panel) {
          trapTab(panel, event);
        }
        break;
      }
    }
  }

  protected select(item: CommandPaletteItem): void {
    if (item.disabled) {
      return;
    }

    // Close first: focus restores before a link moves the page away.
    this.close();
    this.commandRun.emit(item);

    item.run?.();

    if (item.link && this.router) {
      void this.router.navigate(Array.isArray(item.link) ? item.link : [item.link]);
    } else if (item.href) {
      window.open(item.href, '_blank', 'noopener');
    }
  }

  private move(step: 1 | -1): void {
    const results = this.results();
    if (!results.length) {
      return;
    }

    let index = this.activeIndex();
    for (let i = 0; i < results.length; i++) {
      index = (index + step + results.length) % results.length;
      if (!results[index].disabled) {
        this.setActive(index);
        return;
      }
    }
  }

  private firstEnabled(): number {
    return Math.max(0, this.results().findIndex((item) => !item.disabled));
  }

  private lastEnabled(): number {
    const results = this.results();
    for (let index = results.length - 1; index >= 0; index--) {
      if (!results[index].disabled) {
        return index;
      }
    }
    return 0;
  }

  private setActive(index: number): void {
    this.activeIndex.set(index);
    // Keep the active row on screen; focus never leaves the input.
    setTimeout(() => {
      this.listRef()
        ?.nativeElement.querySelector(`#${CSS.escape(this.optionId(index))}`)
        ?.scrollIntoView({ block: 'nearest' });
    });
  }

  private onOpened(): void {
    this.previouslyFocused = this.document.activeElement as HTMLElement | null;
    this.query.set('');
    this.activeIndex.set(0);

    if (!this.locked) {
      this.scrollLock.lock();
      this.locked = true;
    }

    queueMicrotask(() => {
      const panel = this.panelRef()?.nativeElement;
      if (!panel) {
        return;
      }
      if (!this.silenced) {
        this.pageInert.activate(panel);
        this.silenced = true;
      }
      this.inputRef()?.nativeElement.focus();
      this.activeIndex.set(this.firstEnabled());
    });
  }

  private onClosed(): void {
    this.releasePage();
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
