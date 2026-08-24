import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  DS_COMPONENTS,
  DS_PRIMITIVES,
  ToastService,
  countUnread,
  type CommandPaletteItem,
  type FeedItem,
  type MenuEntry,
  type ShellNavSection,
  type ShellUser,
} from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

const NOW = '2026-03-04T12:00:00Z';

/**
 * AppShell — documentation page.
 */
@Component({
  selector: 'app-shell-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI],
  templateUrl: './app-shell.page.html',
  styleUrl: './components-page.scss',
})
export class AppShellPage {
  private readonly toasts = inject(ToastService);
  readonly now = NOW;

  readonly navSections: readonly ShellNavSection[] = [
    {
      title: 'Main',
      items: [
        { label: 'Dashboard', path: '/', icon: 'home' },
        { label: 'Invoices', path: '/invoices', icon: 'file', badge: '3' },
        { label: 'Projects', path: '/projects', icon: 'box' },
      ],
    },
    {
      title: 'Account',
      items: [
        { label: 'Settings', path: '/settings', icon: 'settings' },
        { label: 'Billing', path: '/billing', icon: 'tag', badge: 'New' },
      ],
    },
  ];

  readonly user: ShellUser = { name: 'Ada Lovelace', email: 'ada@paint.dev' };

  readonly userMenu: readonly MenuEntry[] = [
    { id: 'profile', label: 'Profile', icon: 'user' },
    { type: 'divider' },
    { id: 'logout', label: 'Sign out', icon: 'close' },
  ];

  readonly commands: readonly CommandPaletteItem[] = [
    { id: 'new-invoice', label: 'New invoice', icon: 'plus', group: 'Actions', run: () => this.toasts.success('Invoice created') },
    { id: 'export', label: 'Export ledger', icon: 'download', group: 'Actions', run: () => this.toasts.info('Export started') },
    { id: 'go-settings', label: 'Go to Settings', icon: 'settings', group: 'Navigate', link: '/settings' },
  ];

  readonly notifications = signal<readonly FeedItem[]>([
    { id: 'n1', title: 'Ada mentioned you on Mural', timestamp: '2026-03-04T11:45:00Z', actor: 'Ada Lovelace', unread: true },
    { id: 'n2', title: 'Export finished', timestamp: '2026-03-04T10:05:00Z', icon: 'download', tone: 'success', unread: true },
    { id: 'n3', title: 'Trial ends in 3 days', timestamp: '2026-03-03T08:00:00Z', icon: 'warning', tone: 'warning' },
  ]);

  readonly breadcrumbs = [
    { label: 'Home', link: '/' },
    { label: 'Invoices', link: '/invoices' },
    { label: 'INV-204' },
  ];

  readonly unreadCount = () => countUnread(this.notifications());

  onNotification(item: FeedItem): void {
    this.notifications.update((items) =>
      items.map((n) => (n.id === item.id ? { ...n, unread: false } : n)),
    );
    this.toasts.info('Opened', { description: item.title });
  }

  onMarkRead(item: FeedItem): void {
    this.notifications.update((items) =>
      items.map((n) => (n.id === item.id ? { ...n, unread: false } : n)),
    );
  }

  onUserAction(id: string): void {
    this.toasts.info(id === 'logout' ? 'Signed out' : id);
  }

  readonly shellSnippet = `<ds-app-shell
  appName="Atelier"
  [navSections]="sections"
  [user]="user"
  [userMenu]="userMenuEntries"
  [paletteItems]="commands"
  [notifications]="notifications()"
  [breadcrumbs]="crumbs()"
  (notificationOpen)="onNotification($event)"
  (notificationMarkRead)="onMarkRead($event)"
  (userAction)="onUserAction($event)"
  (paletteRun)="onPaletteRun($event)"
>
  <router-outlet />
</ds-app-shell>`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'appName', type: 'string', default: `''`, description: 'The product name in the top bar. Not a logo.' },
    { name: 'navSections', type: 'ShellNavSection[]', default: '[]', description: 'Sidebar sections: title, caption?, items with label/path/icon/badge?.' },
    { name: 'user', type: 'ShellUser | null', default: 'null', description: 'The signed-in user: name, avatarSrc?, email?. Null hides the user block.' },
    { name: 'userMenu', type: 'MenuEntry[]', default: '[]', description: `The user-menu entries — the Menu molecule's grammar.` },
    { name: 'paletteItems', type: 'CommandPaletteItem[]', default: '[]', description: `Commands/links/entities for ⌘K. Empty disables the palette.` },
    { name: 'paletteHotkey', type: 'boolean', default: 'true', description: `The global ⌘K / Ctrl+K. Off for hosts that own the key.` },
    { name: 'notifications', type: 'FeedItem[]', default: '[]', description: `The bell's items. The feed shows them; markRead/itemOpen report back.` },
    { name: 'showBell', type: 'boolean', default: 'false', description: 'Keep the bell visible even with no notifications (shows "All caught up").' },
    { name: 'breadcrumbs', type: 'BreadcrumbItem[]', default: '[]', description: 'Breadcrumbs above the content. Empty hides them.' },
    { name: 'navLabel / now', type: 'string', default: `'Navigation'`, description: 'Sidebar aria-label; injectable clock for the feed.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'notificationOpen', type: 'OutputEmitterRef<FeedItem>', default: '—', description: 'A notification was pressed (host navigates / marks read).' },
    { name: 'notificationMarkRead', type: 'OutputEmitterRef<FeedItem>', default: '—', description: 'The unread dot was pressed on a notification.' },
    { name: 'userAction', type: 'OutputEmitterRef<string>', default: '—', description: 'A user-menu entry was selected, by id.' },
    { name: 'paletteRun', type: 'OutputEmitterRef<CommandPaletteItem>', default: '—', description: 'A palette command ran / link navigated.' },
  ];
}
