import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MenuComponent } from './menu.component';
import type { MenuEntry, MenuItemOption } from './menu.types';

@Component({
  standalone: true,
  imports: [MenuComponent],
  template: `
    <ds-menu
      label="Actions"
      [entries]="entries"
      [align]="align"
      (itemSelect)="selected.push($event)"
      (itemSelected)="items.push($event)"
      (openChange)="opens.push($event)"
    />
    <button type="button" id="outside">outside</button>
  `,
})
class HostComponent {
  entries: readonly MenuEntry[] = [
    { type: 'header', label: 'Project' },
    { id: 'rename', label: 'Rename', icon: 'edit' },
    { id: 'duplicate', label: 'Duplicate', shortcut: '⌘D', keyShortcuts: 'Meta+D' },
    { id: 'export', label: 'Export', disabled: true, description: 'CSV or JSON' },
    { type: 'divider' },
    { id: 'delete', label: 'Delete', destructive: true },
  ];
  align: 'start' | 'end' = 'start';
  selected: string[] = [];
  items: MenuItemOption[] = [];
  opens: boolean[] = [];
}

describe('MenuComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const trigger = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('ds-button button');
  const panel = (): HTMLElement | null => fixture.nativeElement.querySelector('[role="menu"]');
  const items = (): HTMLButtonElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('[role="menuitem"]'));
  const openMenu = () => {
    trigger().click();
    fixture.detectChanges();
  };
  const keydown = (key: string) => {
    panel()!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a trigger and no panel until opened', () => {
    expect(trigger()).toBeTruthy();
    expect(panel()).toBeNull();
  });

  it('opens and closes on the trigger, and reports it', () => {
    openMenu();
    expect(panel()).toBeTruthy();
    expect(host.opens).toEqual([true]);

    openMenu();
    expect(panel()).toBeNull();
    expect(host.opens).toEqual([true, false]);
  });

  it('wires up the disclosure ARIA on the trigger', () => {
    expect(trigger().getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');

    openMenu();
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(trigger().getAttribute('aria-controls')).toBe(panel()!.id);
  });

  it('renders items, headers and dividers on Bootstrap dropdown markup', () => {
    openMenu();

    expect(panel()!.classList).toContain('dropdown-menu');
    expect(items().length).toBe(4);
    expect(items()[0].classList).toContain('dropdown-item');
    expect(panel()!.querySelectorAll('.dropdown-header').length).toBe(1);
    expect(panel()!.querySelectorAll('.dropdown-divider').length).toBe(1);
  });

  it('exposes a labelled header as a group, so the heading is announced', () => {
    openMenu();

    const group = panel()!.querySelector('[role="group"]')!;
    const labelId = group.getAttribute('aria-labelledby')!;

    expect(document.getElementById(labelId)!.textContent!.trim()).toBe('Project');
    expect(group.querySelectorAll('[role="menuitem"]').length).toBe(3);
  });

  it('declares the menu orientation', () => {
    openMenu();
    expect(panel()!.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('hides the visual shortcut and exposes the real key combination', () => {
    openMenu();

    const duplicate = items()[1];
    expect(duplicate.getAttribute('aria-keyshortcuts')).toBe('Meta+D');
    expect(duplicate.querySelector('kbd')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('describes an item by its hint instead of folding it into the name', () => {
    openMenu();

    const describedBy = items()[2].getAttribute('aria-describedby')!;
    expect(document.getElementById(describedBy)!.textContent!.trim()).toBe('CSV or JSON');
  });

  it('marks a disabled item with aria-disabled as well as disabled', () => {
    openMenu();
    expect(items()[2].getAttribute('aria-disabled')).toBe('true');
  });

  it('marks disabled and destructive items', () => {
    openMenu();

    expect(items()[2].disabled).toBeTrue();
    expect(items()[3].classList).toContain('ds-menu__item--destructive');
  });

  it('emits the id and the item, then closes and restores focus', () => {
    openMenu();
    items()[0].click();
    fixture.detectChanges();

    expect(host.selected).toEqual(['rename']);
    expect(host.items[0].label).toBe('Rename');
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('never emits for a disabled item', () => {
    openMenu();
    items()[2].click();
    fixture.detectChanges();

    expect(host.selected).toEqual([]);
    expect(panel()).toBeTruthy();
  });

  it('moves the active item with arrows, skipping headers, dividers and disabled rows', () => {
    openMenu();

    keydown('ArrowDown');
    expect(items()[0].classList).toContain('active');

    keydown('ArrowDown');
    expect(items()[1].classList).toContain('active');

    // Export is disabled → Delete is next.
    keydown('ArrowDown');
    expect(items()[3].classList).toContain('active');

    // Wraps back to the first item.
    keydown('ArrowDown');
    expect(items()[0].classList).toContain('active');
  });

  it('selects the active item with Enter', () => {
    openMenu();
    keydown('ArrowDown');
    keydown('Enter');

    expect(host.selected).toEqual(['rename']);
  });

  it('jumps with Home and End', () => {
    openMenu();

    keydown('End');
    expect(items()[3].classList).toContain('active');

    keydown('Home');
    expect(items()[0].classList).toContain('active');
  });

  it('supports type-ahead', () => {
    openMenu();
    keydown('d');

    expect(items()[1].classList).toContain('active');
  });

  it('closes on Escape and returns focus', () => {
    openMenu();
    keydown('Escape');

    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('closes on Tab without trapping focus', () => {
    openMenu();
    keydown('Tab');

    expect(panel()).toBeNull();
  });

  it('closes when a click lands outside', () => {
    openMenu();

    fixture.nativeElement.querySelector('#outside').click();
    fixture.detectChanges();

    expect(panel()).toBeNull();
  });

  it('stays open for clicks inside the panel', () => {
    openMenu();

    panel()!.click();
    fixture.detectChanges();

    expect(panel()).toBeTruthy();
  });

  it('aligns the panel with the end edge on request', () => {
    host.align = 'end';
    fixture.detectChanges();
    openMenu();

    expect(panel()!.classList).toContain('dropdown-menu-end');
  });
});
