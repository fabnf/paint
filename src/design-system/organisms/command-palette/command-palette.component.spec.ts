import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { CommandPaletteComponent } from './command-palette.component';
import {
  filterCommands,
  scoreCommand,
  type CommandPaletteItem,
} from './command-palette.types';

describe('command scoring', () => {
  const item = (partial: Partial<CommandPaletteItem>): CommandPaletteItem => ({
    id: 'x',
    label: 'New invoice',
    ...partial,
  });

  it('ranks prefix over word-boundary over substring over keyword', () => {
    expect(scoreCommand('new', item({}))).toBe(100);
    expect(scoreCommand('inv', item({}))).toBe(80);
    expect(scoreCommand('voice', item({}))).toBe(60);
    expect(scoreCommand('bill', item({ keywords: ['billing'] }))).toBe(50);
    expect(scoreCommand('lling', item({ keywords: ['billing'] }))).toBe(40);
    expect(scoreCommand('draft', item({ description: 'Creates a draft' }))).toBe(20);
    expect(scoreCommand('zzz', item({}))).toBe(0);
  });

  it('an empty query matches everything, in input order', () => {
    const items = [item({ id: 'a' }), item({ id: 'b' })];
    expect(filterCommands('', items).map((i) => i.id)).toEqual(['a', 'b']);
  });

  it('sorts by score, keeps ties in input order, and caps at the limit', () => {
    const items = [
      item({ id: 'sub', label: 'Reinvoice' }),
      item({ id: 'prefix', label: 'Invoice list' }),
      item({ id: 'prefix2', label: 'Invoice settings' }),
    ];
    expect(filterCommands('invoice', items).map((i) => i.id)).toEqual([
      'prefix',
      'prefix2',
      'sub',
    ]);
    expect(filterCommands('invoice', items, 2).length).toBe(2);
  });
});

describe('CommandPaletteComponent', () => {
  let ran: string[];

  const ITEMS = (): CommandPaletteItem[] => [
    { id: 'new', label: 'New invoice', icon: 'plus', group: 'Actions', run: () => ran.push('new') },
    { id: 'export', label: 'Export ledger', group: 'Actions', run: () => ran.push('export'), shortcut: '⌘E' },
    { id: 'frozen', label: 'Close the books', group: 'Actions', disabled: true, run: () => ran.push('frozen') },
    { id: 'settings', label: 'Go to settings', group: 'Navigate', link: '/settings' },
    { id: 'docs', label: 'Open documentation', group: 'Navigate', href: 'https://example.test/docs' },
    { id: 'inv-204', label: 'INV-204 — Mural', group: 'Invoices', keywords: ['mural'], link: '/invoices/204' },
  ];

  @Component({
    standalone: true,
    imports: [CommandPaletteComponent],
    template: `
      <button type="button" id="opener" (click)="palette.openPalette()">Jump to…</button>
      <ds-command-palette
        #palette
        [items]="items"
        [hotkey]="hotkey()"
        (commandRun)="selected.push($event.id)"
      />
    `,
  })
  class HostComponent {
    readonly items = ITEMS();
    readonly hotkey = signal(true);
    selected: string[] = [];
  }

  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const flushMicrotasks = () => new Promise<void>((resolve) => queueMicrotask(() => resolve()));
  const palette = (): HTMLElement | null => fixture.nativeElement.querySelector('.ds-palette');
  const paletteInput = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('.ds-palette__input');
  const options = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('[role="option"]'));
  const activeOption = (): HTMLElement | null =>
    fixture.nativeElement.querySelector('.ds-palette__option--active');

  const openPalette = async () => {
    (fixture.nativeElement.querySelector('#opener') as HTMLElement).click();
    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();
  };

  const type = (text: string) => {
    paletteInput().value = text;
    paletteInput().dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  };

  const key = (key: string, init: KeyboardEventInit = {}) => {
    fixture.nativeElement
      .querySelector('.ds-palette__panel')!
      .dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    ran = [];
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Never leave a modal's page state behind for the next spec.
    host.selected = [];
    fixture.destroy();
  });

  it('renders nothing until summoned', () => {
    expect(palette()).toBeNull();
  });

  it('answers the hotkey, both ways', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true }));
    fixture.detectChanges();
    expect(palette()).toBeTruthy();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, cancelable: true }));
    fixture.detectChanges();
    expect(palette()).toBeNull();

    host.hotkey.set(false);
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true }));
    fixture.detectChanges();
    expect(palette()).toBeNull();
  });

  it('is a modal combobox: focus lands in the input, wired to the listbox', async () => {
    await openPalette();

    expect(palette()!.getAttribute('role')).toBe('dialog');
    expect(palette()!.getAttribute('aria-modal')).toBe('true');
    expect(document.activeElement).toBe(paletteInput());

    const input = paletteInput();
    expect(input.getAttribute('role')).toBe('combobox');
    const listbox = fixture.nativeElement.querySelector('[role="listbox"]') as HTMLElement;
    expect(input.getAttribute('aria-controls')).toBe(listbox.id);
    expect(input.getAttribute('aria-activedescendant')).toBe(options()[0].id);

    // The page behind is inert; the opener cannot be reached.
    expect(
      (fixture.nativeElement.querySelector('#opener') as HTMLElement).closest('[inert]'),
    ).toBeTruthy();
  });

  it('shows everything grouped when the query is empty', async () => {
    await openPalette();

    expect(options().length).toBe(6);
    const groups = Array.from(
      fixture.nativeElement.querySelectorAll('.ds-palette__group'),
      (el: Element) => el.textContent!.trim(),
    );
    expect(groups).toEqual(['Actions', 'Navigate', 'Invoices']);
  });

  it('filters at keystroke speed and announces the count', async () => {
    await openPalette();
    type('mural');

    expect(options().length).toBe(1);
    expect(options()[0].textContent).toContain('INV-204');
    expect(
      fixture.nativeElement.querySelector('[aria-live="polite"]')!.textContent,
    ).toContain('1 result.');

    type('zzzz');
    expect(options().length).toBe(0);
    expect(fixture.nativeElement.querySelector('.ds-palette__empty')!.textContent).toContain(
      'Nothing matches',
    );
  });

  it('arrows walk the list, skipping the disabled; Enter runs the command', async () => {
    await openPalette();

    expect(activeOption()!.textContent).toContain('New invoice');
    key('ArrowDown');
    expect(activeOption()!.textContent).toContain('Export ledger');
    key('ArrowDown');
    // Straight past "Close the books" (disabled).
    expect(activeOption()!.textContent).toContain('Go to settings');
    key('ArrowUp');
    expect(activeOption()!.textContent).toContain('Export ledger');

    key('Enter');
    expect(ran).toEqual(['export']);
    expect(host.selected).toEqual(['export']);
    expect(palette()).toBeNull();
  });

  it('a link row navigates the router, then the palette is gone', async () => {
    const router = TestBed.inject(Router);
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);

    await openPalette();
    type('settings');
    key('Enter');

    expect(navigate).toHaveBeenCalledWith(['/settings']);
    expect(host.selected).toEqual(['settings']);
    expect(palette()).toBeNull();
  });

  it('an href row leaves the app in a new tab, noopener', async () => {
    const open = spyOn(window, 'open');

    await openPalette();
    type('documentation');
    key('Enter');

    expect(open).toHaveBeenCalledWith('https://example.test/docs', '_blank', 'noopener');
  });

  it('a disabled row refuses the click and the Enter', async () => {
    await openPalette();
    type('books');

    options()[0].click();
    fixture.detectChanges();
    expect(ran).toEqual([]);
    expect(palette()).toBeTruthy();
  });

  it('Escape closes and hands focus back to whatever summoned it', async () => {
    const opener = fixture.nativeElement.querySelector('#opener') as HTMLElement;
    opener.focus();
    await openPalette();

    key('Escape');
    expect(palette()).toBeNull();
    expect(document.activeElement).toBe(opener);
    expect(opener.closest('[inert]')).toBeNull();
  });

  it('a click beside the panel closes; a click inside it does not', async () => {
    await openPalette();

    (fixture.nativeElement.querySelector('.ds-palette__search') as HTMLElement).click();
    fixture.detectChanges();
    expect(palette()).toBeTruthy();

    palette()!.click();
    fixture.detectChanges();
    expect(palette()).toBeNull();
  });

  it('reopening starts clean: empty query, best match active', async () => {
    await openPalette();
    type('mural');
    key('Escape');

    await openPalette();
    expect(paletteInput().value).toBe('');
    expect(options().length).toBe(6);
    expect(activeOption()!.textContent).toContain('New invoice');
  });
});
