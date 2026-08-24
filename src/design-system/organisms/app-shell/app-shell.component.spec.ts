import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { MenuEntry } from '../../molecules/menu';
import type { CommandPaletteItem } from '../command-palette';
import type { FeedItem } from '../feed';
import { AppShellComponent } from './app-shell.component';
import type { ShellNavSection, ShellUser } from './app-shell.types';

const SECTIONS: readonly ShellNavSection[] = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', path: '/', icon: 'home' },
      { label: 'Invoices', path: '/invoices', icon: 'file', badge: '3' },
    ],
  },
  {
    title: 'Settings',
    items: [{ label: 'Workspace', path: '/settings', icon: 'settings' }],
  },
];

const USER: ShellUser = { name: 'Ada Lovelace', email: 'ada@paint.dev' };

const COMMANDS: CommandPaletteItem[] = [
  { id: 'new', label: 'New invoice', group: 'Actions', run: () => undefined },
  { id: 'go-settings', label: 'Settings', group: 'Navigate', link: '/settings' },
];

const NOTIFICATIONS: FeedItem[] = [
  { id: 'n1', title: 'Export finished', timestamp: '2026-03-04T10:00:00Z', unread: true },
  { id: 'n2', title: 'Trial ends soon', timestamp: '2026-03-03T08:00:00Z', icon: 'warning' },
];

const CRUMBS = [
  { label: 'Home', link: '/' },
  { label: 'Invoices', link: '/invoices' },
  { label: 'INV-204' },
];

@Component({
  standalone: true,
  imports: [AppShellComponent],
  template: `
    <ds-app-shell
      appName="Atelier"
      [navSections]="navSections"
      [user]="user"
      [userMenu]="userMenu"
      [paletteItems]="commands"
      [notifications]="notifications()"
      [showBell]="true"
      [breadcrumbs]="breadcrumbs"
      now="2026-03-04T12:00:00Z"
    >
      <p id="page-content">Hello, page.</p>
    </ds-app-shell>
  `,
})
class HostComponent {
  readonly navSections = SECTIONS;
  readonly user = USER;
  readonly userMenu: readonly MenuEntry[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'logout', label: 'Sign out' },
  ];
  readonly commands = COMMANDS;
  readonly notifications = signal<readonly FeedItem[]>(NOTIFICATIONS);
  readonly breadcrumbs = CRUMBS;
}

describe('AppShellComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <E extends HTMLElement>(selector: string): E | null =>
    fixture.nativeElement.querySelector(selector);
  const flushMicrotasks = () => new Promise<void>((resolve) => queueMicrotask(() => resolve()));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('renders the topbar with the app name, and projects content into main', () => {
    expect(query('.ds-shell__app-name')!.textContent).toContain('Atelier');
    expect(query('#page-content')!.textContent).toContain('Hello, page.');
    expect(query('#ds-shell-content')!.tagName).toBe('MAIN');
  });

  it('skip link points at the main content', () => {
    const skip = query('.ds-shell__skip') as HTMLAnchorElement;
    expect(skip.getAttribute('href')).toBe('#ds-shell-content');
  });

  it('renders the desktop sidebar with section titles, links, badges, and a collapse toggle', () => {
    const sidebar = query('.ds-shell__sidebar')!;
    expect(sidebar.textContent).toContain('Main');
    expect(sidebar.textContent).toContain('Settings');
    expect(sidebar.querySelectorAll('.ds-shell__nav-link').length).toBe(3);
    expect(sidebar.querySelector('ds-badge')!.textContent).toContain('3');

    // Collapse
    const toggle = sidebar.querySelector('.ds-shell__collapse-toggle button') as HTMLElement;
    expect(toggle.getAttribute('aria-label')).toBe('Collapse sidebar');
    toggle.click();
    fixture.detectChanges();
    expect(sidebar.classList).toContain('ds-shell__sidebar--collapsed');
    expect(toggle.getAttribute('aria-label')).toBe('Expand sidebar');
    // Labels hidden when collapsed
    expect(sidebar.querySelector('.ds-shell__nav-label')).toBeNull();
  });

  it('the hamburger opens and closes the mobile nav drawer', async () => {
    const hamburger = query('.ds-shell__hamburger button') as HTMLElement;
    expect(hamburger).toBeTruthy();

    hamburger.click();
    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();

    const drawer = query('.ds-drawer__panel')!;
    expect(drawer).toBeTruthy();
    expect(drawer.textContent).toContain('Invoices');

    drawer.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(query('.ds-drawer__panel')).toBeNull();
  });

  it('renders breadcrumbs above the content', () => {
    const bc = query('ds-breadcrumb')!;
    expect(bc.textContent).toContain('INV-204');
  });

  it('renders the bell with the unread count, and a feed inside the popover', () => {
    const badge = query('.ds-shell__bell-badge')!;
    expect(badge.textContent).toContain('1');

    // Open the bell popover
    (query('.ds-shell__bell ds-popover ds-button button') as HTMLElement).click();
    fixture.detectChanges();

    const feed = query('.ds-popover__panel ds-feed')!;
    expect(feed.textContent).toContain('Export finished');
    expect(feed.querySelector('.ds-feed__unread')).toBeTruthy();
  });

  it('renders the user menu with entries', () => {
    const menuTrigger = query('.ds-shell__topbar-end ds-menu ds-button button') as HTMLElement;
    expect(menuTrigger).toBeTruthy();
    expect(menuTrigger.textContent).toContain('Ada Lovelace');

    menuTrigger.click();
    fixture.detectChanges();

    const items = Array.from(
      fixture.nativeElement.querySelectorAll('[role="menuitem"]'),
    ) as HTMLElement[];
    expect(items.map((i) => i.textContent!.trim())).toEqual(['Profile', 'Sign out']);
  });

  it('the palette trigger opens the command palette, and ⌘K reaches it too', () => {
    const btn = query('.ds-shell__palette-trigger button') as HTMLElement;
    expect(btn.textContent).toContain('Jump to');

    btn.click();
    fixture.detectChanges();
    expect(query('.ds-palette')).toBeTruthy();
    query('.ds-palette__panel')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    fixture.detectChanges();
    expect(query('.ds-palette')).toBeNull();

    // ⌘K works from the document level
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(query('.ds-palette')).toBeTruthy();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(query('.ds-palette')).toBeNull();
  });

  it('an empty notification list shows the empty state', () => {
    host.notifications.set([]);
    fixture.detectChanges();

    (query('.ds-shell__bell ds-popover ds-button button') as HTMLElement).click();
    fixture.detectChanges();

    expect(query('.ds-popover__panel ds-empty-state')!.textContent).toContain('All caught up');
    expect(query('.ds-shell__bell-badge')).toBeNull();
  });
});
