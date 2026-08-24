import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { IconComponent, type IconName } from '../../icons';
import { ButtonComponent, type ButtonSize, type ButtonVariant } from '../../primitives/button';
import { firstEnabledIndex, rovingIndex, uniqueId } from '../../utils';
import {
  isMenuDivider,
  isMenuHeader,
  isMenuItem,
  type MenuEntry,
  type MenuItemOption,
} from './menu.types';

export type MenuAlign = 'start' | 'end';

/**
 * Menu — a button that drops a list of actions.
 *
 * Built on Bootstrap's `.dropdown-menu` / `.dropdown-item` / `.dropdown-header`
 * / `.dropdown-divider`, triggered by Paint's own Button primitive. No Bootstrap
 * JS: open state, the full ARIA menu keyboard pattern (arrows, Home/End, type
 * ahead, Esc, Tab), outside-click dismissal and focus return are all Angular.
 *
 * @example
 * ```html
 * <ds-menu
 *   label="Actions"
 *   [entries]="[
 *     { id: 'rename', label: 'Rename', icon: 'type' },
 *     { id: 'duplicate', label: 'Duplicate', icon: 'copy', shortcut: '⌘D' },
 *     { type: 'divider' },
 *     { id: 'delete', label: 'Delete project', icon: 'close', destructive: true },
 *   ]"
 *   (itemSelect)="run($event)"
 * />
 * ```
 */
@Component({
  selector: 'ds-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, IconComponent],
  host: {
    class: 'dropdown',
    '(keydown)': 'onKeydown($event)',
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
      [ariaHasPopup]="'menu'"
      [ariaControls]="menuId"
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
        class="dropdown-menu show ds-menu__panel"
        [class.dropdown-menu-end]="align() === 'end'"
        [class.ds-menu__panel--up]="dropUp()"
        [id]="menuId"
        role="menu"
        aria-orientation="vertical"
        [attr.aria-label]="label()"
        [style.min-width.px]="minWidth()"
      >
        <!--
          Sections: a labelled header becomes a role="group" so screen readers
          announce "Project, group" instead of skipping the heading entirely.
        -->
        @for (section of sections(); track section.id) {
          @if (section.separated) {
            <hr class="dropdown-divider" role="separator" />
          }

          <div
            [attr.role]="section.label ? 'group' : 'presentation'"
            [attr.aria-labelledby]="section.label ? section.id : null"
          >
            @if (section.label) {
              <div class="dropdown-header" [id]="section.id" role="presentation">
                {{ section.label }}
              </div>
            }

            @for (entry of section.items; track entry.index) {
              <button
                #itemButton
                type="button"
                class="dropdown-item ds-menu__item"
                role="menuitem"
                [class.active]="entry.index === activeIndex()"
                [class.disabled]="entry.item.disabled"
                [class.ds-menu__item--destructive]="entry.item.destructive"
                [attr.aria-disabled]="entry.item.disabled ? 'true' : null"
                [attr.aria-describedby]="entry.item.description ? descriptionId(entry.index) : null"
                [attr.aria-label]="entry.item.description ? entry.item.label : null"
                [attr.aria-keyshortcuts]="entry.item.keyShortcuts || null"
                [disabled]="entry.item.disabled"
                [tabIndex]="-1"
                (click)="selectItem(entry.item)"
                (mouseenter)="activeIndex.set(entry.index)"
              >
                @if (entry.item.icon) {
                  <ds-icon [name]="entry.item.icon" size="sm" class="ds-menu__icon" />
                } @else if (hasIcons()) {
                  <span class="ds-menu__icon" aria-hidden="true"></span>
                }

                <span class="ds-menu__body">
                  <span class="ds-menu__label">{{ entry.item.label }}</span>
                  @if (entry.item.description) {
                    <span class="ds-menu__description" [id]="descriptionId(entry.index)">
                      {{ entry.item.description }}
                    </span>
                  }
                </span>

                @if (entry.item.shortcut) {
                  <!-- Decorative: the real shortcut is on aria-keyshortcuts -->
                  <kbd class="ds-menu__shortcut" aria-hidden="true">{{ entry.item.shortcut }}</kbd>
                }
              </button>
            }
          </div>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: inline-block;
      position: relative;
    }

    .ds-menu__panel {
      position: absolute;
      inset-block-start: calc(100% + var(--ds-space-1_5));
      inset-inline-start: 0;
      display: block;
      z-index: 1000;
      max-height: min(22rem, 60vh);
      overflow-y: auto;
      animation: ds-menu-in 120ms ease-out;
      transform-origin: top center;
    }

    .ds-menu__panel.dropdown-menu-end {
      inset-inline-start: auto;
      inset-inline-end: 0;
    }

    .ds-menu__panel--up {
      inset-block-start: auto;
      inset-block-end: calc(100% + var(--ds-space-1_5));
      transform-origin: bottom center;
    }

    .ds-menu__item {
      display: flex;
      align-items: flex-start;
      gap: var(--ds-space-2_5);
      border-radius: var(--ds-radius-sm);
      cursor: pointer;
    }

    .ds-menu__item.disabled {
      cursor: not-allowed;
    }

    .ds-menu__icon {
      flex-shrink: 0;
      width: 1rem;
      margin-block-start: 0.1rem;
      color: var(--ds-color-text-subtle);
    }

    .ds-menu__item.active .ds-menu__icon,
    .ds-menu__item:hover .ds-menu__icon {
      color: currentColor;
    }

    .ds-menu__body {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      min-width: 0;
      flex: 1 1 auto;
    }

    .ds-menu__label {
      font-weight: var(--ds-font-weight-medium);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ds-menu__description {
      font-size: var(--ds-font-size-xs);
      color: var(--ds-color-text-subtle);
      white-space: normal;
    }

    .ds-menu__shortcut {
      flex-shrink: 0;
      padding: 0 0.25rem;
      border-radius: var(--ds-radius-sm);
      background: var(--ds-color-surface-sunken);
      color: var(--ds-color-text-subtle);
      font-family: var(--ds-font-mono);
      font-size: var(--ds-font-size-xs);
    }

    .ds-menu__item--destructive {
      color: var(--ds-color-danger);
    }

    .ds-menu__item--destructive.active,
    .ds-menu__item--destructive:hover:not(.disabled) {
      color: var(--ds-color-danger);
      background: var(--ds-color-danger-muted);
    }

    .ds-menu__item--destructive .ds-menu__icon {
      color: currentColor;
    }

    @keyframes ds-menu-in {
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
      .ds-menu__panel {
        animation: none;
      }
    }
  `,
})
export class MenuComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Items, headers and dividers, in render order. */
  readonly entries = input.required<readonly MenuEntry[]>();
  /** Trigger label. Doubles as the menu's accessible name. */
  readonly label = input<string>('Menu');
  /** Trigger icon. */
  readonly icon = input<IconName | null>(null);
  /** Hide the trigger's text and keep `label` as the accessible name. */
  readonly iconOnly = input(false);
  /** Show the trailing chevron on the trigger. */
  readonly caret = input(true);
  readonly variant = input<ButtonVariant>('secondary');
  readonly size = input<ButtonSize>('md');
  readonly disabled = input(false);
  /** Which edge of the trigger the panel lines up with. */
  readonly align = input<MenuAlign>('start');
  /** Minimum panel width in px. */
  readonly minWidth = input<number>(200);

  /** Emits the selected item's `id`. */
  readonly itemSelect = output<string>();
  /** Emits the whole item, for callers that need more than the id. */
  readonly itemSelected = output<MenuItemOption>();
  /** Emits on every open/close. */
  readonly openChange = output<boolean>();

  protected readonly open = signal(false);
  protected readonly activeIndex = signal(-1);
  protected readonly dropUp = signal(false);
  protected readonly menuId = uniqueId('ds-menu');

  private readonly triggerRef = viewChild<ButtonComponent, ElementRef<HTMLElement>>('trigger', {
    read: ElementRef,
  });
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly itemButtons = viewChildren<ElementRef<HTMLButtonElement>>('itemButton');

  /** Type-ahead buffer. */
  private searchBuffer = '';
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  /** Reserve the icon gutter only when at least one item has an icon. */
  protected readonly hasIcons = computed(() =>
    this.entries().some((entry) => isMenuItem(entry) && !!entry.icon),
  );

  /** Indexes into `entries` that are actual items (enabled or not). */
  private readonly itemIndexes = computed(() =>
    this.entries()
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => isMenuItem(entry))
      .map(({ index }) => index),
  );

  /**
   * Groups the flat entry list into sections.
   *
   * A header opens a labelled `role="group"`; a divider starts an unlabelled
   * one. Items keep their index into `entries`, so keyboard navigation and
   * type-ahead still work on the flat list.
   */
  protected readonly sections = computed(() => {
    const sections: Array<{
      id: string;
      label: string | null;
      separated: boolean;
      items: Array<{ index: number; item: MenuItemOption }>;
    }> = [];

    let current: (typeof sections)[number] | null = null;
    const open = (label: string | null, separated: boolean) => {
      current = { id: `${this.menuId}-section-${sections.length}`, label, separated, items: [] };
      sections.push(current);
    };

    this.entries().forEach((entry, index) => {
      if (isMenuHeader(entry)) {
        open(entry.label, sections.length > 0);
        return;
      }
      if (isMenuDivider(entry)) {
        open(null, sections.length > 0);
        return;
      }
      if (!current) {
        open(null, false);
      }
      current!.items.push({ index, item: entry as MenuItemOption });
    });

    // Drop empty sections so a trailing divider never renders a stray rule.
    return sections.filter((section) => section.items.length > 0);
  });

  protected descriptionId(index: number): string {
    return `${this.menuId}-description-${index}`;
  }

  toggle(): void {
    this.open() ? this.close() : this.openMenu();
  }

  openMenu(focusFirst = false): void {
    if (this.disabled() || this.open()) {
      return;
    }

    this.open.set(true);
    this.activeIndex.set(-1);
    this.openChange.emit(true);

    // The panel is created by change detection, which has not run yet — a
    // microtask would fire before the items exist, so ArrowDown would open the
    // menu and then land nowhere. A macrotask runs after the render.
    setTimeout(() => {
      this.updatePlacement();
      if (focusFirst) {
        this.moveActive(1);
      }
    });
  }

  close(restoreFocus = false): void {
    if (!this.open()) {
      return;
    }

    this.open.set(false);
    this.activeIndex.set(-1);
    this.openChange.emit(false);

    if (restoreFocus) {
      this.focusTrigger();
    }
  }

  protected selectItem(item: MenuItemOption): void {
    if (item.disabled) {
      return;
    }

    this.itemSelect.emit(item.id);
    this.itemSelected.emit(item);
    this.close(true);
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.open()) {
      return;
    }
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.open()) {
      // ArrowDown / ArrowUp open the menu *and* move into it, per the ARIA menu
      // button pattern. Enter and Space are left to the trigger button itself.
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.openMenu(true);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.openMenu();
        setTimeout(() => this.moveEdge(-1));
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveActive(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveActive(-1);
        break;
      case 'Home':
        event.preventDefault();
        this.moveEdge(1);
        break;
      case 'End':
        event.preventDefault();
        this.moveEdge(-1);
        break;
      case 'Enter':
      case ' ': {
        const entry = this.entries()[this.activeIndex()];
        if (entry && isMenuItem(entry)) {
          event.preventDefault();
          this.selectItem(entry);
        }
        break;
      }
      case 'Escape':
        event.preventDefault();
        this.close(true);
        break;
      case 'Tab':
        // A menu never holds Tab: close and let focus move on.
        this.close();
        break;
      default:
        if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
          this.typeAhead(event.key);
        }
    }
  }

  /** Moves the active item by `step`, wrapping and skipping disabled rows. */
  private moveActive(step: 1 | -1): void {
    const entries = this.entries();
    const disabled = (index: number) => {
      const entry = entries[index];
      return !isMenuItem(entry) || !!entry.disabled;
    };

    const next = rovingIndex(entries.length, this.activeIndex(), step, disabled);
    this.setActive(next);
  }

  private moveEdge(step: 1 | -1): void {
    const entries = this.entries();
    const disabled = (index: number) => {
      const entry = entries[index];
      return !isMenuItem(entry) || !!entry.disabled;
    };

    this.setActive(firstEnabledIndex(entries.length, disabled, step));
  }

  private setActive(index: number): void {
    if (index === -1) {
      return;
    }

    this.activeIndex.set(index);

    // Focus follows the active row so screen readers announce it.
    const itemPosition = this.itemIndexes().indexOf(index);
    this.itemButtons()[itemPosition]?.nativeElement.focus();
  }

  private typeAhead(key: string): void {
    this.searchBuffer += key.toLowerCase();
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => (this.searchBuffer = ''), 600);

    const entries = this.entries();
    const match = entries.findIndex(
      (entry) =>
        isMenuItem(entry) &&
        !entry.disabled &&
        entry.label.toLowerCase().startsWith(this.searchBuffer),
    );

    if (match !== -1) {
      this.setActive(match);
    }
  }

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
