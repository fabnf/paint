import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DialogComponent, type DialogSize, type DialogTone } from './dialog.component';

@Component({
  standalone: true,
  imports: [DialogComponent],
  template: `
    <button type="button" id="opener" (click)="open.set(true)">Open</button>

    <ds-dialog
      [(open)]="open"
      [title]="title"
      [description]="description"
      [size]="size"
      [tone]="tone"
      [dismissible]="dismissible()"
      [icon]="'warning'"
      (closed)="reasons.push($event)"
      (opened)="opens = opens + 1"
    >
      <input id="body-input" />
      <div dsDialogActions>
        <button type="button" id="confirm">Confirm</button>
      </div>
    </ds-dialog>
  `,
})
class HostComponent {
  readonly open = signal(false);
  title = 'Delete project';
  description = 'This cannot be undone.';
  size: DialogSize = 'md';
  tone: DialogTone = 'danger';
  readonly dismissible = signal(true);
  reasons: string[] = [];
  opens = 0;
}

describe('DialogComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const modal = (): HTMLElement | null => fixture.nativeElement.querySelector('[role="dialog"]');
  const backdrop = (): HTMLElement | null => fixture.nativeElement.querySelector('.modal-backdrop');
  const content = (): HTMLElement => fixture.nativeElement.querySelector('.modal-content');
  const openDialog = async () => {
    host.open.set(true);
    fixture.detectChanges();
    await flushMicrotasks();
  };
  /** The dialog moves focus in a microtask, after the sheet exists. */
  const flushMicrotasks = () => new Promise<void>((resolve) => queueMicrotask(() => resolve()));
  const keydown = (key: string) => {
    modal()!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
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

  afterEach(() => {
    host.open.set(false);
    fixture.detectChanges();
  });

  it('renders nothing until it is opened', () => {
    expect(modal()).toBeNull();
    expect(backdrop()).toBeNull();
  });

  it('renders Bootstrap modal markup when open', async () => {
    await openDialog();

    expect(modal()!.classList).toContain('modal');
    expect(backdrop()!.classList).toContain('modal-backdrop');
    expect(fixture.nativeElement.querySelector('.modal-dialog')).toBeTruthy();
    expect(content()).toBeTruthy();
  });

  it('is an ARIA modal labelled by its own title and description', async () => {
    await openDialog();

    const labelId = modal()!.getAttribute('aria-labelledby')!;
    const descriptionId = modal()!.getAttribute('aria-describedby')!;

    expect(modal()!.getAttribute('aria-modal')).toBe('true');
    expect(document.getElementById(labelId)!.textContent).toContain('Delete project');
    expect(document.getElementById(descriptionId)!.textContent).toContain('This cannot be undone.');
  });

  it('never leaves the title attribute on the host', async () => {
    await openDialog();

    expect(fixture.nativeElement.querySelector('ds-dialog').hasAttribute('title')).toBeFalse();
  });

  it('projects the body and the actions, and emits opened', async () => {
    await openDialog();

    expect(fixture.nativeElement.querySelector('#body-input')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.modal-footer #confirm')).toBeTruthy();
    expect(host.opens).toBe(1);
  });

  it('maps sizes and tones', async () => {
    host.size = 'lg';
    await openDialog();

    expect(fixture.nativeElement.querySelector('.modal-dialog').classList).toContain('modal-lg');
    expect(content().classList).toContain('ds-dialog--danger');
  });

  it('focuses the dialog itself, so its name and description are announced', async () => {
    await openDialog();

    // Not the close button (a trap for anyone who reads first) and not the inner
    // sheet (whose name would be a read-through of every control).
    expect(document.activeElement).toBe(modal());
    expect(modal()!.getAttribute('role')).toBe('dialog');
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('makes the rest of the page inert while it is open', async () => {
    const opener: HTMLElement = fixture.nativeElement.querySelector('#opener');
    await openDialog();

    // The opener is a sibling of the dialog inside the host: it must be silenced,
    // and the sheet itself must not be.
    expect(opener.inert).toBeTrue();
    expect(content().closest('[inert]')).toBeNull();

    host.open.set(false);
    fixture.detectChanges();

    expect(opener.inert).toBeFalse();
  });

  it('leaves live regions audible so toasts still announce', async () => {
    const live = document.createElement('div');
    live.setAttribute('aria-live', 'polite');
    document.body.appendChild(live);

    const exempt = document.createElement('div');
    exempt.setAttribute('data-ds-inert-exempt', '');
    document.body.appendChild(exempt);

    await openDialog();
    expect(live.inert).toBeFalse();
    expect(exempt.inert).toBeFalse();

    host.open.set(false);
    fixture.detectChanges();
    live.remove();
    exempt.remove();
  });

  it('prefers a [dsDialogAutofocus] target', async () => {
    fixture.nativeElement.querySelector('#opener').setAttribute('x', '');
    TestBed.resetTestingModule();

    @Component({
      standalone: true,
      imports: [DialogComponent],
      template: `
        <ds-dialog [(open)]="open" title="Settings">
          <input id="first" />
          <input id="wanted" dsDialogAutofocus />
        </ds-dialog>
      `,
    })
    class AutofocusHost {
      readonly open = signal(true);
    }

    await TestBed.configureTestingModule({ imports: [AutofocusHost] }).compileComponents();
    const autoFixture = TestBed.createComponent(AutofocusHost);
    autoFixture.detectChanges();
    await flushMicrotasks();

    expect(document.activeElement).toBe(autoFixture.nativeElement.querySelector('#wanted'));

    autoFixture.componentInstance.open.set(false);
    autoFixture.detectChanges();
  });

  it('closes on Escape, reporting the reason', async () => {
    await openDialog();
    keydown('Escape');

    expect(host.open()).toBeFalse();
    expect(host.reasons).toEqual(['escape']);
  });

  it('closes on a backdrop click', async () => {
    await openDialog();
    backdrop()!.click();
    fixture.detectChanges();

    expect(host.open()).toBeFalse();
    expect(host.reasons).toEqual(['backdrop']);
  });

  it('closes from the dismiss button', async () => {
    await openDialog();
    (fixture.nativeElement.querySelector('.ds-dialog__header ds-button button') as HTMLElement).click();
    fixture.detectChanges();

    expect(host.open()).toBeFalse();
    expect(host.reasons).toEqual(['dismiss']);
  });

  it('releases the scroll lock and restores focus on close', async () => {
    const opener: HTMLElement = fixture.nativeElement.querySelector('#opener');
    opener.focus();
    opener.click();
    fixture.detectChanges();
    await flushMicrotasks();

    host.open.set(false);
    fixture.detectChanges();

    expect(document.body.style.overflow).toBe('');
    expect(document.activeElement).toBe(opener);
  });

  it('refuses to dismiss when dismissible is false', async () => {
    host.dismissible.set(false);
    await openDialog();

    expect(fixture.nativeElement.querySelector('.ds-dialog__header ds-button')).toBeNull();

    keydown('Escape');
    expect(host.open()).toBeTrue();

    backdrop()!.click();
    fixture.detectChanges();
    expect(host.open()).toBeTrue();
  });

  it('traps Tab inside the sheet', async () => {
    await openDialog();

    const focusable: HTMLElement[] = Array.from(
      modal()!.querySelectorAll('button, input'),
    );
    const last = focusable[focusable.length - 1];
    last.focus();

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    modal()!.dispatchEvent(event);
    fixture.detectChanges();

    expect(event.defaultPrevented).toBeTrue();
    expect(document.activeElement).toBe(focusable[0]);
  });
});
