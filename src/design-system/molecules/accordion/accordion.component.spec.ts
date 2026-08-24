import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { AccordionComponent } from './accordion.component';
import { AccordionItemComponent } from './accordion-item.component';
import type { AccordionVariant } from './accordion.types';

@Component({
  standalone: true,
  imports: [AccordionComponent, AccordionItemComponent],
  template: `
    <ds-accordion
      [(expanded)]="expanded"
      [multiple]="multiple()"
      [collapsible]="collapsible()"
      [variant]="variant()"
      [headingLevel]="2"
      [disabled]="disabled()"
      (itemToggled)="toggles.push($event)"
    >
      <ds-accordion-item itemId="profile" label="Profile" icon="user">
        <p>Profile panel</p>
      </ds-accordion-item>
      <ds-accordion-item itemId="billing" label="Billing" [badge]="2" badgeLabel="2 issues">
        <p>Billing panel</p>
        <button type="button" id="inside">Pay</button>
      </ds-accordion-item>
      <ds-accordion-item itemId="danger" label="Danger zone" [disabled]="itemDisabled()">
        <p>Danger panel</p>
      </ds-accordion-item>
    </ds-accordion>
  `,
})
class HostComponent {
  expanded: readonly string[] = [];
  readonly multiple = signal(false);
  readonly collapsible = signal(true);
  readonly variant = signal<AccordionVariant>('bordered');
  readonly disabled = signal(false);
  readonly itemDisabled = signal(false);
  toggles: Array<{ id: string; expanded: boolean }> = [];
}

describe('AccordionComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);
  const triggers = () =>
    Array.from(
      fixture.nativeElement.querySelectorAll('.ds-accordion__trigger') as NodeListOf<HTMLButtonElement>,
    );
  const panels = () =>
    Array.from(
      fixture.nativeElement.querySelectorAll('.ds-accordion__panel') as NodeListOf<HTMLElement>,
    );

  const press = (index: number, key: string) => {
    triggers()[index].dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('wraps every header button in a real heading', () => {
    const headings = fixture.nativeElement.querySelectorAll('h2.ds-accordion__heading');
    expect(headings.length).toBe(3);
    expect(headings[0].querySelector('button')).toBeTruthy();
  });

  it('wires aria-expanded, aria-controls and the region back to its header', () => {
    const trigger = triggers()[0];
    const panel = panels()[0];

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('role')).toBe('region');
    expect(panel.getAttribute('aria-labelledby')).toBe(trigger.id);
  });

  it('opens a panel, and closes it again', () => {
    triggers()[0].click();
    fixture.detectChanges();

    expect(host.expanded).toEqual(['profile']);
    expect(triggers()[0].getAttribute('aria-expanded')).toBe('true');
    expect(panels()[0].classList).toContain('ds-accordion__panel--open');
    expect(host.toggles).toEqual([{ id: 'profile', expanded: true }]);

    triggers()[0].click();
    fixture.detectChanges();
    expect(host.expanded).toEqual([]);
  });

  it('keeps one open at a time, by default', () => {
    triggers()[0].click();
    triggers()[1].click();
    fixture.detectChanges();

    expect(host.expanded).toEqual(['billing']);
    expect(triggers()[0].getAttribute('aria-expanded')).toBe('false');
  });

  it('opens as many as it is told to', () => {
    host.multiple.set(true);
    fixture.detectChanges();

    triggers()[0].click();
    triggers()[1].click();
    fixture.detectChanges();

    expect(host.expanded).toEqual(['profile', 'billing']);
  });

  it('refuses to close the last open panel when it must not be empty', () => {
    host.collapsible.set(false);
    fixture.detectChanges();

    triggers()[0].click();
    fixture.detectChanges();
    expect(host.expanded).toEqual(['profile']);

    triggers()[0].click();
    fixture.detectChanges();
    expect(host.expanded).toEqual(['profile']);
  });

  it('tracks items by id, not by index', () => {
    host.expanded = ['billing'];
    fixture.detectChanges();

    // Re-ordering the list must not move the open panel.
    expect(triggers()[1].getAttribute('aria-expanded')).toBe('true');
    expect(triggers()[0].getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps a closed panel in the DOM, and out of the accessibility tree', () => {
    const content = query('.ds-accordion__content')!;
    expect(content.textContent).toContain('Profile panel');
    // A settings form that forgets what you typed when you collapse it is a bug.
    expect(getComputedStyle(content).visibility).toBe('hidden');

    triggers()[0].click();
    fixture.detectChanges();
    expect(getComputedStyle(query('.ds-accordion__content')!).visibility).toBe('visible');
  });

  it('draws a badge inside the button, and names it', () => {
    const badge = triggers()[1].querySelector('ds-badge')!;
    expect(badge.textContent).toContain('2');
    expect(badge.querySelector('.visually-hidden')!.textContent!.trim()).toBe('2 issues');
  });

  it('disables one item, and all of them — without taking them out of reach', () => {
    host.itemDisabled.set(true);
    fixture.detectChanges();

    // `aria-disabled`, not `disabled`: a heading the arrows cannot reach is a
    // heading a screen-reader user cannot read.
    expect(triggers()[2].getAttribute('aria-disabled')).toBe('true');
    expect(triggers()[2].disabled).toBeFalse();
    expect(triggers()[0].getAttribute('aria-disabled')).toBeNull();

    triggers()[2].click();
    fixture.detectChanges();
    expect(host.expanded).toEqual([]);

    host.disabled.set(true);
    fixture.detectChanges();
    expect(triggers().every((trigger) => trigger.getAttribute('aria-disabled') === 'true')).toBeTrue();
  });

  describe('keyboard', () => {
    it('walks the headers with the arrows, wrapping at the ends', () => {
      triggers()[0].focus();
      press(0, 'ArrowDown');
      expect(document.activeElement).toBe(triggers()[1]);

      press(1, 'ArrowDown');
      press(2, 'ArrowDown');
      expect(document.activeElement).toBe(triggers()[0]);

      press(0, 'ArrowUp');
      expect(document.activeElement).toBe(triggers()[2]);
    });

    it('jumps to the first and last header', () => {
      triggers()[1].focus();
      press(1, 'End');
      expect(document.activeElement).toBe(triggers()[2]);

      press(2, 'Home');
      expect(document.activeElement).toBe(triggers()[0]);
    });

    it('walks onto a disabled header — it is still a heading', () => {
      host.itemDisabled.set(true);
      fixture.detectChanges();

      press(1, 'ArrowDown');
      expect(document.activeElement).toBe(triggers()[2]);
    });

    it('leaves Enter and Space to the button', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      triggers()[0].dispatchEvent(event);
      expect(event.defaultPrevented).toBeFalse();
    });
  });
});

describe('AccordionItemComponent on its own', () => {
  @Component({
    standalone: true,
    imports: [AccordionItemComponent],
    template: `
      <ds-accordion-item label="Advanced options" [(expanded)]="open" (toggled)="toggles.push($event)">
        <p>Panel</p>
      </ds-accordion-item>
    `,
  })
  class DisclosureHost {
    open = false;
    toggles: boolean[] = [];
  }

  let fixture: ComponentFixture<DisclosureHost>;
  let host: DisclosureHost;
  const trigger = () => fixture.nativeElement.querySelector('.ds-accordion__trigger') as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DisclosureHost] }).compileComponents();
    fixture = TestBed.createComponent(DisclosureHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('is a disclosure: it owns its own state', () => {
    expect(trigger().getAttribute('aria-expanded')).toBe('false');

    trigger().click();
    fixture.detectChanges();

    expect(host.open).toBeTrue();
    expect(host.toggles).toEqual([true]);
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
  });

  it('wears no box, and has no siblings to walk to', () => {
    const item = fixture.nativeElement.querySelector('ds-accordion-item') as HTMLElement;
    expect(item.classList).toContain('ds-accordion-item--flush');

    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
    trigger().dispatchEvent(event);
    expect(event.defaultPrevented).toBeFalse();
  });

  it('follows an expanded bound from outside', () => {
    host.open = true;
    fixture.detectChanges();
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
  });
});
