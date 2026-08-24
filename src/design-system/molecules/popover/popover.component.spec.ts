import { Component, signal } from '@angular/core';
import { TestBed, fakeAsync, tick, type ComponentFixture } from '@angular/core/testing';
import { PopoverComponent } from './popover.component';

@Component({
  standalone: true,
  imports: [PopoverComponent],
  template: `
    <ds-popover
      label="Filters"
      [title]="title()"
      [dismissible]="dismissible()"
      (openChange)="opens.push($event)"
    >
      <label for="first">Status</label>
      <input id="first" type="text" [attr.dsPopoverAutofocus]="autofocus() ? '' : null" />
      <button type="button" id="apply">Apply</button>
    </ds-popover>
    <button type="button" id="outside">outside</button>
  `,
})
class HostComponent {
  readonly title = signal('Filter invoices');
  readonly dismissible = signal(false);
  readonly autofocus = signal(false);
  opens: boolean[] = [];
}

describe('PopoverComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const trigger = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('ds-popover ds-button button');
  const panel = (): HTMLElement | null =>
    fixture.nativeElement.querySelector('.ds-popover__panel');
  const byId = <T extends HTMLElement>(id: string) =>
    fixture.nativeElement.querySelector(`#${id}`) as T;

  const open = () => {
    trigger().click();
    fixture.detectChanges();
    tick(); // the focus/placement macrotask
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a trigger and no panel until opened', () => {
    expect(trigger()).toBeTruthy();
    expect(panel()).toBeNull();
  });

  it('wires up the disclosure ARIA on the trigger', fakeAsync(() => {
    expect(trigger().getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');

    open();
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(trigger().getAttribute('aria-controls')).toBe(panel()!.id);
  }));

  it('is a named, non-modal dialog', fakeAsync(() => {
    open();
    expect(panel()!.getAttribute('role')).toBe('dialog');
    // Named by its title when it has one…
    const titleId = panel()!.getAttribute('aria-labelledby')!;
    expect(document.getElementById(titleId)!.textContent).toContain('Filter invoices');

    // …and no aria-modal, no backdrop, no inert page: the page stays alive.
    expect(panel()!.getAttribute('aria-modal')).toBeNull();
    expect(document.querySelector('.modal-backdrop')).toBeNull();
  }));

  it('falls back to the trigger label for its name', fakeAsync(() => {
    host.title.set('');
    fixture.detectChanges();

    open();
    expect(panel()!.getAttribute('aria-labelledby')).toBeNull();
    expect(panel()!.getAttribute('aria-label')).toBe('Filters');
  }));

  it('moves focus to the panel on open, so its name is announced first', fakeAsync(() => {
    open();
    expect(document.activeElement).toBe(panel());
    expect(host.opens).toEqual([true]);
  }));

  it('lets the content claim initial focus with dsPopoverAutofocus', fakeAsync(() => {
    host.autofocus.set(true);
    fixture.detectChanges();

    open();
    expect(document.activeElement).toBe(byId('first'));
  }));

  it('reaches inside a marked wrapper for the thing that actually focuses', fakeAsync(() => {
    @Component({
      standalone: true,
      imports: [PopoverComponent],
      template: `
        <ds-popover label="Rename">
          <div dsPopoverAutofocus>
            <input id="inner" type="text" aria-label="Project name" />
          </div>
        </ds-popover>
      `,
    })
    class WrapperHost {}

    const wrapped = TestBed.createComponent(WrapperHost);
    wrapped.detectChanges();

    (wrapped.nativeElement.querySelector('ds-button button') as HTMLElement).click();
    wrapped.detectChanges();
    tick();
    wrapped.detectChanges();

    expect(document.activeElement).toBe(wrapped.nativeElement.querySelector('#inner'));
  }));

  it('closes on Escape and returns focus to the trigger', fakeAsync(() => {
    open();
    panel()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
    expect(host.opens).toEqual([true, false]);
  }));

  it('closes on an outside click, without stealing focus back', fakeAsync(() => {
    open();
    byId('outside').click();
    fixture.detectChanges();

    expect(panel()).toBeNull();
  }));

  it('ignores clicks inside the panel', fakeAsync(() => {
    open();
    byId('apply').click();
    fixture.detectChanges();

    expect(panel()).toBeTruthy();
  }));

  it('never holds Tab: focus leaving the popover closes it behind itself', fakeAsync(() => {
    open();
    byId('apply').focus();
    fixture.detectChanges();

    // Tab past the last control: focusout with an outside relatedTarget.
    byId('apply').dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: byId('outside') }),
    );
    fixture.detectChanges();

    expect(panel()).toBeNull();
  }));

  it('does not close while focus moves within itself', fakeAsync(() => {
    open();
    byId('first').focus();
    byId('first').dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: byId('apply') }),
    );
    fixture.detectChanges();

    expect(panel()).toBeTruthy();
  }));

  it('offers a named close button when asked', fakeAsync(() => {
    host.dismissible.set(true);
    fixture.detectChanges();

    open();
    const close = panel()!.querySelector<HTMLButtonElement>('.ds-popover__dismiss button')!;
    expect(close.getAttribute('aria-label')).toBe('Close');

    close.click();
    fixture.detectChanges();
    tick();

    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  }));
});
