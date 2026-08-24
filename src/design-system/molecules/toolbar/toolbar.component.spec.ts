import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ToolbarComponent, type ToolbarOrientation } from './toolbar.component';

@Component({
  standalone: true,
  imports: [ToolbarComponent],
  template: `
    <ds-toolbar
      [ariaLabel]="ariaLabel()"
      [orientation]="orientation()"
      [roving]="roving()"
      [bordered]="bordered()"
    >
      <button type="button" id="bold">Bold</button>
      <button type="button" id="italic">Italic</button>
      @if (withDisabled()) {
        <button type="button" id="strike" disabled>Strike</button>
      }
      <!-- Born with tabindex="-1": it opted out before the toolbar saw it. -->
      <button type="button" id="clear" tabindex="-1">Clear</button>
      <input id="search" type="text" />
      <div role="menu">
        <button type="button" id="in-menu">Inside a menu</button>
      </div>
    </ds-toolbar>
    <button type="button" id="outside">Outside</button>
  `,
})
class HostComponent {
  readonly ariaLabel = signal('Document actions');
  readonly orientation = signal<ToolbarOrientation>('horizontal');
  readonly roving = signal(true);
  readonly bordered = signal(false);
  readonly withDisabled = signal(false);
}

describe('ToolbarComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const byId = <T extends HTMLElement>(id: string) =>
    fixture.nativeElement.querySelector(`#${id}`) as T;
  const toolbar = () => fixture.nativeElement.querySelector('ds-toolbar') as HTMLElement;
  const tabStop = () =>
    Array.from(toolbar().querySelectorAll('[tabindex="0"]') as NodeListOf<HTMLElement>);

  const press = (from: HTMLElement, key: string) => {
    from.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('is a named toolbar', () => {
    expect(toolbar().getAttribute('role')).toBe('toolbar');
    expect(toolbar().getAttribute('aria-label')).toBe('Document actions');
    expect(toolbar().getAttribute('aria-orientation')).toBeNull();

    host.orientation.set('vertical');
    fixture.detectChanges();
    expect(toolbar().getAttribute('aria-orientation')).toBe('vertical');
  });

  it('is one tab stop, whatever is inside it', () => {
    // Eight buttons in a row are eight tab stops. This is one.
    expect(tabStop().length).toBe(1);
    expect(tabStop()[0].id).toBe('bold');
    expect(byId('italic').getAttribute('tabindex')).toBe('-1');
    expect(byId('search').getAttribute('tabindex')).toBe('-1');
  });

  it('leaves alone what was born opting out', () => {
    // A Select's chip-remove button, an Input's clear button: `-1` before we looked.
    expect(byId('clear').getAttribute('tabindex')).toBe('-1');

    byId('bold').focus();
    press(byId('bold'), 'ArrowRight');
    expect(document.activeElement).toBe(byId('italic'));

    press(byId('italic'), 'ArrowRight');
    // Straight past the opted-out button, to the text field.
    expect(document.activeElement).toBe(byId('search'));
  });

  it('moves with the arrows, and wraps', () => {
    byId('bold').focus();

    press(byId('bold'), 'ArrowRight');
    expect(document.activeElement).toBe(byId('italic'));
    expect(byId('italic').getAttribute('tabindex')).toBe('0');
    expect(byId('bold').getAttribute('tabindex')).toBe('-1');

    press(byId('italic'), 'ArrowRight');
    press(byId('search'), 'ArrowRight');
    expect(document.activeElement).toBe(byId('bold'));

    press(byId('bold'), 'ArrowLeft');
    expect(document.activeElement).toBe(byId('search'));
  });

  it('jumps to the ends with Home and End', () => {
    byId('bold').focus();

    press(byId('bold'), 'End');
    expect(document.activeElement).toBe(byId('search'));

    byId('italic').focus();
    press(byId('italic'), 'Home');
    expect(document.activeElement).toBe(byId('bold'));
  });

  it('uses the other arrows when it stands up', () => {
    host.orientation.set('vertical');
    fixture.detectChanges();

    byId('bold').focus();
    press(byId('bold'), 'ArrowDown');
    expect(document.activeElement).toBe(byId('italic'));

    // Left and right mean nothing to a vertical toolbar.
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    byId('italic').dispatchEvent(event);
    expect(event.defaultPrevented).toBeFalse();
  });

  it('hands the arrow keys back to a text field, while the caret can still move', () => {
    const search = byId<HTMLInputElement>('search');
    search.value = 'paint';
    search.focus();
    search.setSelectionRange(2, 2);

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    search.dispatchEvent(event);

    // The caret's arrows are the caret's.
    expect(event.defaultPrevented).toBeFalse();
    expect(document.activeElement).toBe(search);
  });

  it('takes them back once the caret has nowhere left to go', () => {
    const search = byId<HTMLInputElement>('search');
    search.value = 'paint';
    search.focus();

    search.setSelectionRange(5, 5);
    press(search, 'ArrowRight');
    expect(document.activeElement).toBe(byId('bold'));

    search.focus();
    search.setSelectionRange(0, 0);
    press(search, 'ArrowLeft');
    expect(document.activeElement).toBe(byId('italic'));
  });

  it('never takes Home and End from a text field', () => {
    const search = byId<HTMLInputElement>('search');
    search.value = 'paint';
    search.focus();
    search.setSelectionRange(3, 3);

    const event = new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true });
    search.dispatchEvent(event);

    expect(event.defaultPrevented).toBeFalse();
    expect(document.activeElement).toBe(search);
  });

  it('does not manage the controls inside an overlay', () => {
    expect(byId('in-menu').hasAttribute('tabindex')).toBeFalse();

    byId('bold').focus();
    press(byId('bold'), 'End');
    expect(document.activeElement).toBe(byId('search'));
  });

  it('skips a control that cannot be used', () => {
    host.withDisabled.set(true);
    fixture.detectChanges();

    byId('italic').focus();
    press(byId('italic'), 'ArrowRight');
    expect(document.activeElement).toBe(byId('search'));
    expect(byId('strike').hasAttribute('tabindex')).toBeFalse();
  });

  it('follows focus in, so a click and a Tab agree on where the tab stop is', () => {
    byId('italic').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    fixture.detectChanges();

    expect(byId('italic').getAttribute('tabindex')).toBe('0');
    expect(byId('bold').getAttribute('tabindex')).toBe('-1');
  });

  it('can be told to manage nothing at all', () => {
    host.roving.set(false);
    fixture.detectChanges();

    byId('bold').focus();
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    byId('bold').dispatchEvent(event);

    expect(event.defaultPrevented).toBeFalse();
    expect(document.activeElement).toBe(byId('bold'));
  });

  it('wears a box when it floats over content', () => {
    host.bordered.set(true);
    fixture.detectChanges();
    expect(toolbar().classList).toContain('ds-toolbar--bordered');
  });
});
