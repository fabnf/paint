import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { DrawerComponent, type DrawerPosition, type DrawerSize } from './drawer.component';

@Component({
  standalone: true,
  imports: [DrawerComponent],
  template: `
    <button type="button" id="opener" (click)="open.set(true)">Open</button>

    <ds-drawer
      [(open)]="open"
      title="INV-204"
      description="Invoice detail"
      [position]="position()"
      [size]="size()"
      [dismissible]="dismissible()"
      icon="file"
      (closed)="reasons.push($event)"
      (opened)="opens = opens + 1"
    >
      <input id="body-input" [attr.dsDrawerAutofocus]="autofocus() ? '' : null" />
      <div dsDrawerActions>
        <button type="button" id="mark-paid">Mark paid</button>
      </div>
    </ds-drawer>
  `,
})
class HostComponent {
  readonly open = signal(false);
  readonly position = signal<DrawerPosition>('end');
  readonly size = signal<DrawerSize>('md');
  readonly dismissible = signal(true);
  readonly autofocus = signal(false);
  reasons: string[] = [];
  opens = 0;
}

describe('DrawerComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const panel = (): HTMLElement | null => fixture.nativeElement.querySelector('[role="dialog"]');
  const backdrop = (): HTMLElement | null =>
    fixture.nativeElement.querySelector('.modal-backdrop');
  /** The drawer moves focus in a microtask, after the panel exists. */
  const flushMicrotasks = () => new Promise<void>((resolve) => queueMicrotask(() => resolve()));
  const openDrawer = async () => {
    host.open.set(true);
    fixture.detectChanges();
    await flushMicrotasks();
  };
  const keydown = (key: string, init: KeyboardEventInit = {}) => {
    panel()!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Never leave a test page locked or inert for the next spec.
    host.open.set(false);
    fixture.detectChanges();
  });

  it('renders nothing until it is opened', () => {
    expect(panel()).toBeNull();
    expect(backdrop()).toBeNull();
  });

  it('renders Bootstrap offcanvas markup, side-anchored', async () => {
    await openDrawer();

    expect(panel()!.classList).toContain('offcanvas');
    expect(panel()!.classList).toContain('offcanvas-end');
    expect(backdrop()).toBeTruthy();

    host.position.set('start');
    fixture.detectChanges();
    expect(panel()!.classList).toContain('offcanvas-start');
  });

  it('is an ARIA modal labelled by its own title and description', async () => {
    await openDrawer();

    const dialog = panel()!;
    expect(dialog.getAttribute('aria-modal')).toBe('true');

    const titleId = dialog.getAttribute('aria-labelledby')!;
    expect(document.getElementById(titleId)!.textContent).toContain('INV-204');

    const descriptionId = dialog.getAttribute('aria-describedby')!;
    expect(document.getElementById(descriptionId)!.textContent).toContain('Invoice detail');
  });

  it('never leaves the title attribute on the host', async () => {
    await openDrawer();
    expect(
      (fixture.nativeElement.querySelector('ds-drawer') as HTMLElement).getAttribute('title'),
    ).toBeNull();
  });

  it('projects the body and the actions, and emits opened', async () => {
    await openDrawer();

    expect(fixture.nativeElement.querySelector('#body-input')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.ds-drawer__footer #mark-paid')).toBeTruthy();
    expect(host.opens).toBe(1);
  });

  it('maps sizes onto the panel width', async () => {
    await openDrawer();
    expect(panel()!.style.getPropertyValue('--ds-drawer-width')).toBe('26rem');

    host.size.set('lg');
    fixture.detectChanges();
    expect(panel()!.style.getPropertyValue('--ds-drawer-width')).toBe('34rem');
  });

  it('focuses the panel itself, so its name and description are announced', async () => {
    await openDrawer();
    expect(document.activeElement).toBe(panel());
  });

  it('prefers a [dsDrawerAutofocus] target', async () => {
    host.autofocus.set(true);
    fixture.detectChanges();

    await openDrawer();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('#body-input'));
  });

  it('makes the rest of the page inert while it is open', async () => {
    await openDrawer();

    const opener = fixture.nativeElement.querySelector('#opener') as HTMLElement;
    expect(opener.closest('[inert]')).toBeTruthy();
    expect(panel()!.closest('[inert]')).toBeNull();

    host.open.set(false);
    fixture.detectChanges();
    expect(opener.closest('[inert]')).toBeNull();
  });

  it('closes on Escape, reporting the reason', async () => {
    await openDrawer();
    keydown('Escape');

    expect(panel()).toBeNull();
    expect(host.reasons).toEqual(['escape']);
  });

  it('closes on a backdrop click', async () => {
    await openDrawer();
    backdrop()!.click();
    fixture.detectChanges();

    expect(panel()).toBeNull();
    expect(host.reasons).toEqual(['backdrop']);
  });

  it('closes from the dismiss button', async () => {
    await openDrawer();
    (panel()!.querySelector('ds-button button') as HTMLElement).click();
    fixture.detectChanges();

    expect(panel()).toBeNull();
    expect(host.reasons).toEqual(['dismiss']);
  });

  it('restores focus to whatever opened it — the table row, usually', async () => {
    const opener = fixture.nativeElement.querySelector('#opener') as HTMLElement;
    opener.focus();
    opener.click();
    fixture.detectChanges();
    await flushMicrotasks();

    expect(document.activeElement).toBe(panel());

    keydown('Escape');
    expect(document.activeElement).toBe(opener);
  });

  it('refuses to dismiss when dismissible is false', async () => {
    host.dismissible.set(false);
    fixture.detectChanges();
    await openDrawer();

    keydown('Escape');
    expect(panel()).toBeTruthy();

    backdrop()!.click();
    fixture.detectChanges();
    expect(panel()).toBeTruthy();

    // No close button either: nothing in the panel promises a way out it
    // will not honour.
    expect(panel()!.querySelector('.ds-drawer__header ds-button')).toBeNull();
  });

  it('traps Tab inside the panel', async () => {
    await openDrawer();

    const markPaid = fixture.nativeElement.querySelector('#mark-paid') as HTMLElement;
    const dismiss = panel()!.querySelector('ds-button button') as HTMLElement;

    // Shift+Tab from the panel wraps to the last focusable.
    keydown('Tab', { shiftKey: true });
    expect(document.activeElement).toBe(markPaid);

    // Tab from the last wraps back to the first.
    markPaid.focus();
    keydown('Tab');
    expect(document.activeElement).toBe(dismiss);
  });
});
