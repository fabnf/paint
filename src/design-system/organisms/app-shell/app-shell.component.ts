import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent, type IconName } from '../../icons';
import { BadgeComponent } from '../../primitives/badge';
import { ButtonComponent } from '../../primitives/button';
import { BreadcrumbComponent, type BreadcrumbItem } from '../../molecules/breadcrumb';
import { MenuComponent, type MenuEntry } from '../../molecules/menu';
import { PopoverComponent } from '../../molecules/popover';
import { CommandPaletteComponent, type CommandPaletteItem } from '../command-palette';
import { DrawerComponent } from '../drawer';
import { FeedComponent, type FeedItem } from '../feed';
import { countUnread } from '../feed/feed.types';
import { ScrollLockService } from '../../utils';
import type { ShellNavItem, ShellNavSection, ShellUser } from './app-shell.types';

/**
 * AppShell — the top bar, sidebar, mobile drawer, user block, ⌘K, bell, and
 * a main slot for the page, composed once.
 *
 * Desktop: a collapsible sidebar beside the content. Narrow viewports: the
 * sidebar becomes a `ds-drawer`, opened by the hamburger. The host owns
 * navigation items, user-menu entries, palette commands and notification items;
 * the shell lays them out and projects `<ng-content>` into the page area.
 *
 * Keyboard matters everywhere: Tab reaches the skip-link, the hamburger, ⌘K
 * (the palette's own hotkey), the sidebar, the main slot, and back. The
 * sidebar's Escape closes the mobile drawer, and focus returns to the
 * hamburger. The palette and the notification popover close the usual way.
 *
 * @example
 * ```html
 * <ds-app-shell
 *   appName="Atelier"
 *   [navSections]="sections"
 *   [user]="me"
 *   [userMenu]="userMenuEntries"
 *   [paletteItems]="commands"
 *   [notifications]="notifications()"
 *   [breadcrumbs]="crumbs()"
 * >
 *   <router-outlet />
 * </ds-app-shell>
 * ```
 */
@Component({
  selector: 'ds-app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterLinkActive,
    IconComponent,
    BadgeComponent,
    ButtonComponent,
    BreadcrumbComponent,
    MenuComponent,
    PopoverComponent,
    CommandPaletteComponent,
    DrawerComponent,
    FeedComponent,
  ],
  template: `
    <a class="visually-hidden-focusable ds-shell__skip" href="#ds-shell-content">
      Skip to content
    </a>

    <!-- ═══ Top bar ═══ -->
    <header class="ds-shell__topbar">
      <div class="ds-shell__topbar-start">
        <!-- Hamburger: desktop collapses the sidebar; narrow opens the drawer -->
        <ds-button
          class="ds-shell__hamburger"
          variant="ghost"
          size="sm"
          iconStart="menu"
          label="Toggle navigation"
          [ariaExpanded]="mobileOpen()"
          ariaControls="ds-shell-sidebar"
          (clicked)="toggleMobileNav()"
        />

        <span class="ds-shell__app-name">{{ appName() }}</span>
      </div>

      <div class="ds-shell__topbar-end">
        <!-- ⌘K hint: a quiet button that opens the palette the hotkey already serves -->
        @if (paletteItems().length) {
          <ds-button
            class="ds-shell__palette-trigger d-none d-md-inline-flex"
            variant="ghost"
            size="sm"
            iconStart="search"
            (clicked)="openPalette()"
          >
            Jump to…
          </ds-button>
        }

        <!-- Notifications bell: badge + popover inbox -->
        @if (notifications().length || showBell()) {
          <span class="ds-shell__bell">
            <ds-popover
              icon="bell"
              [iconOnly]="true"
              label="Notifications"
              variant="ghost"
              size="sm"
              align="end"
              [width]="360"
            >
              <ds-feed
                [items]="notifications()"
                [now]="now()"
                label="Notifications"
                [empty]="{ icon: 'bell', title: 'All caught up' }"
                (itemOpen)="notificationOpen.emit($event)"
                (markRead)="notificationMarkRead.emit($event)"
              />
            </ds-popover>
            @if (unreadCount() > 0) {
              <ds-badge
                class="ds-shell__bell-badge"
                tone="accent"
                variant="solid"
                size="sm"
                [srLabel]="unreadCount() + ' unread'"
              >
                {{ unreadCount() }}
              </ds-badge>
            }
          </span>
        }

        <!-- User block: avatar + menu -->
        @if (user()) {
          <ds-menu
            [label]="user()!.name"
            variant="ghost"
            size="sm"
            align="end"
            [entries]="userMenu()"
            (itemSelect)="userAction.emit($event)"
          >
            <!-- The trigger renders the avatar inside the menu button's content.
                 Menu shows content when iconOnly is false and label is ''. -->
          </ds-menu>
        }
      </div>
    </header>

    <!-- ═══ Desktop sidebar ═══ -->
    <div class="ds-shell__body">
      <aside
        id="ds-shell-sidebar"
        class="ds-shell__sidebar d-none d-lg-flex"
        [class.ds-shell__sidebar--collapsed]="collapsed()"
      >
        <nav class="ds-shell__nav" [attr.aria-label]="navLabel()">
          @for (section of navSections(); track section.title) {
            <div class="ds-shell__nav-section">
              @if (!collapsed()) {
                <p class="ds-shell__nav-title">{{ section.title }}</p>
              }
              <ul class="ds-shell__nav-list">
                @for (item of section.items; track item.path) {
                  <li>
                    <a
                      class="ds-shell__nav-link"
                      [routerLink]="item.path"
                      routerLinkActive="ds-shell__nav-link--active"
                      ariaCurrentWhenActive="page"
                      [routerLinkActiveOptions]="{ exact: item.path === '/' }"
                      [title]="collapsed() ? item.label : ''"
                    >
                      <ds-icon [name]="item.icon" size="sm" />
                      @if (!collapsed()) {
                        <span class="ds-shell__nav-label">{{ item.label }}</span>
                        @if (item.badge) {
                          <ds-badge tone="accent" variant="solid" [pill]="true" size="sm">
                            {{ item.badge }}
                          </ds-badge>
                        }
                      }
                    </a>
                  </li>
                }
              </ul>
            </div>
          }
        </nav>

        <ds-button
          class="ds-shell__collapse-toggle"
          variant="ghost"
          size="sm"
          [iconStart]="collapsed() ? 'chevronRight' : 'chevronLeft'"
          [label]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
          (clicked)="toggleCollapsed()"
        />
      </aside>

      <!-- ═══ Mobile sidebar as a Drawer ═══ -->
      <ds-drawer
        [(open)]="mobileOpen"
        title="Navigation"
        position="start"
        size="sm"
      >
        <nav [attr.aria-label]="navLabel()">
          @for (section of navSections(); track section.title) {
            <div class="ds-shell__nav-section">
              <p class="ds-shell__nav-title">{{ section.title }}</p>
              @if (section.caption) {
                <p class="ds-shell__nav-caption">{{ section.caption }}</p>
              }
              <ul class="ds-shell__nav-list">
                @for (item of section.items; track item.path) {
                  <li>
                    <a
                      class="ds-shell__nav-link"
                      [routerLink]="item.path"
                      routerLinkActive="ds-shell__nav-link--active"
                      ariaCurrentWhenActive="page"
                      [routerLinkActiveOptions]="{ exact: item.path === '/' }"
                      (click)="mobileOpen.set(false)"
                    >
                      <ds-icon [name]="item.icon" size="sm" />
                      <span class="ds-shell__nav-label">{{ item.label }}</span>
                      @if (item.badge) {
                        <ds-badge tone="accent" variant="solid" [pill]="true" size="sm">
                          {{ item.badge }}
                        </ds-badge>
                      }
                    </a>
                  </li>
                }
              </ul>
            </div>
          }
        </nav>
      </ds-drawer>

      <!-- ═══ Main content ═══ -->
      <main id="ds-shell-content" class="ds-shell__main" tabindex="-1">
        @if (breadcrumbs().length) {
          <ds-breadcrumb class="ds-shell__breadcrumbs" [items]="breadcrumbs()" />
        }

        <ng-content />
      </main>
    </div>

    <!-- ═══ Command palette (modal, ⌘K) ═══ -->
    @if (paletteItems().length) {
      <ds-command-palette
        #palette
        [items]="paletteItems()"
        [hotkey]="paletteHotkey()"
        (commandRun)="paletteRun.emit($event)"
      />
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    /* —— Skip link —— */
    .ds-shell__skip {
      position: absolute;
      z-index: 1100;
      margin: var(--ds-space-2);
      padding: var(--ds-space-2) var(--ds-space-3);
      border-radius: var(--ds-radius-md);
      background: var(--ds-color-primary);
      color: var(--ds-color-on-primary);
    }

    /* —— Top bar —— */
    .ds-shell__topbar {
      position: sticky;
      inset-block-start: 0;
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ds-space-3);
      padding: 0 var(--ds-space-4);
      min-height: 3.5rem;
      background: color-mix(in srgb, var(--ds-color-surface) 88%, transparent);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--ds-color-border);
    }

    .ds-shell__topbar-start,
    .ds-shell__topbar-end {
      display: flex;
      align-items: center;
      gap: var(--ds-space-2);
    }

    .ds-shell__app-name {
      font-size: var(--ds-font-size-md);
      font-weight: var(--ds-font-weight-bold);
      color: var(--ds-color-text);
      letter-spacing: var(--ds-letter-spacing-tight);
    }

    .ds-shell__palette-trigger {
      color: var(--ds-color-text-muted) !important;
    }

    .ds-shell__bell {
      position: relative;
      display: inline-block;
    }

    .ds-shell__bell-badge {
      position: absolute;
      inset-block-start: -0.35rem;
      inset-inline-end: -0.35rem;
      pointer-events: none;
    }

    /* The hamburger stays visible on mobile, hidden on wide. On desktop it
       collapses/expands the sidebar instead. */
    @media (min-width: 992px) {
      .ds-shell__hamburger {
        display: none;
      }
    }

    /* —— Body: sidebar + main —— */
    .ds-shell__body {
      display: flex;
      flex: 1 1 auto;
    }

    .ds-shell__sidebar {
      position: sticky;
      inset-block-start: 3.5rem;
      flex: 0 0 15rem;
      height: calc(100vh - 3.5rem);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-6);
      padding: var(--ds-space-5) var(--ds-space-3);
      border-inline-end: 1px solid var(--ds-color-border);
      background: var(--ds-color-surface);
      transition: flex-basis 200ms ease;
    }

    .ds-shell__sidebar--collapsed {
      flex-basis: 3.5rem;
      padding: var(--ds-space-5) var(--ds-space-1_5);
    }

    .ds-shell__collapse-toggle {
      margin-block-start: auto;
      align-self: flex-end;
    }

    /* —— Nav sections (shared desktop + drawer) —— */
    .ds-shell__nav {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-5);
    }

    .ds-shell__nav-section {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-1);
    }

    .ds-shell__nav-title {
      margin: 0 0 var(--ds-space-1);
      padding-inline: var(--ds-space-2);
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-semibold);
      letter-spacing: var(--ds-letter-spacing-wider);
      text-transform: uppercase;
      color: var(--ds-color-text-subtle);
    }

    .ds-shell__nav-caption {
      margin: 0 0 var(--ds-space-1);
      padding-inline: var(--ds-space-2);
      font-size: var(--ds-font-size-xs);
      color: var(--ds-color-text-subtle);
    }

    .ds-shell__nav-list {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-0_5);
    }

    .ds-shell__nav-link {
      display: flex;
      align-items: center;
      gap: var(--ds-space-2);
      padding: var(--ds-space-1_5) var(--ds-space-2);
      border-radius: var(--ds-radius-md);
      font-size: var(--ds-font-size-sm);
      color: var(--ds-color-text-muted);
      text-decoration: none;
      transition: background-color 120ms ease;
    }

    .ds-shell__nav-link:hover {
      background: var(--ds-color-surface-sunken);
      color: var(--ds-color-text);
    }

    .ds-shell__nav-link--active {
      background: var(--ds-color-primary-muted);
      color: var(--ds-color-primary);
      font-weight: var(--ds-font-weight-medium);
    }

    .ds-shell__nav-label {
      flex: 1 1 auto;
      min-width: 0;
    }

    /* —— Main —— */
    .ds-shell__main {
      flex: 1 1 auto;
      min-width: 0;
      padding: var(--ds-space-6) var(--ds-space-5);
    }

    .ds-shell__main:focus {
      outline: none;
    }

    .ds-shell__breadcrumbs {
      margin-block-end: var(--ds-space-4);
    }

    @media (prefers-reduced-motion: reduce) {
      .ds-shell__sidebar {
        transition: none;
      }
    }
  `,
})
export class AppShellComponent {
  /** The product name, in the top bar. Not a logo — that is the host's. */
  readonly appName = input<string>('');
  /** Sidebar navigation. Each section renders a titled group of links. */
  readonly navSections = input<readonly ShellNavSection[]>([]);
  readonly navLabel = input<string>('Navigation');
  /** The signed-in user — avatar + trigger for the user menu. */
  readonly user = input<ShellUser | null>(null);
  /** User-menu entries — the Menu molecule's grammar. */
  readonly userMenu = input<readonly MenuEntry[]>([]);
  /** Commands, links and entities for the ⌘K palette. Empty → no palette. */
  readonly paletteItems = input<readonly CommandPaletteItem[]>([]);
  /** The palette's global hotkey. Hosts that own ⌘K can turn it off. */
  readonly paletteHotkey = input(true);
  /** Notification items for the bell. */
  readonly notifications = input<readonly FeedItem[]>([]);
  /** The bell even when there are zero notifications (shows "All caught up"). */
  readonly showBell = input(false);
  /** Breadcrumbs above the main slot. Empty → none. */
  readonly breadcrumbs = input<readonly BreadcrumbItem[]>([]);
  /** Injectable clock for the feed's relative time. */
  readonly now = input<string | null>(null);

  readonly notificationOpen = output<FeedItem>();
  readonly notificationMarkRead = output<FeedItem>();
  readonly userAction = output<string>();
  readonly paletteRun = output<CommandPaletteItem>();

  /** Mobile nav drawer state. */
  readonly mobileOpen = signal(false);
  /** Desktop sidebar collapsed to icons. */
  readonly collapsed = signal(false);

  protected readonly unreadCount = computed(() => countUnread(this.notifications()));

  private readonly paletteRef = viewChild(CommandPaletteComponent);

  protected toggleMobileNav(): void {
    this.mobileOpen.update((open) => !open);
  }

  protected toggleCollapsed(): void {
    this.collapsed.update((c) => !c);
  }

  protected openPalette(): void {
    this.paletteRef()?.openPalette();
  }
}
