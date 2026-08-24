import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ToastHostComponent } from './toast-host.component';
import { ToastComponent } from './toast.component';
import { ToastService } from './toast.service';
import type { Toast } from './toast.types';

const BASE: Toast = {
  id: 1,
  title: 'Project saved',
  variant: 'success',
  duration: 0,
  dismissible: true,
};

@Component({
  standalone: true,
  imports: [ToastComponent],
  template: `
    <ds-toast
      [toast]="toast()"
      (dismiss)="dismissed = dismissed + 1"
      (pause)="paused = paused + 1"
      (resume)="resumed = resumed + 1"
    />
  `,
})
class HostComponent {
  readonly toast = signal<Toast>(BASE);
  dismissed = 0;
  paused = 0;
  resumed = 0;
}

describe('ToastComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const root = (): HTMLElement => fixture.nativeElement.querySelector('.ds-toast');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders Bootstrap toast markup as a named group, not a nested live region', () => {
    expect(root().classList).toContain('toast');
    expect(root().classList).toContain('show');
    // The host owns the live regions; a nested role="alert" double-announces.
    expect(root().getAttribute('role')).toBe('group');
    expect(root().getAttribute('aria-label')).toContain('notification');
    expect(root().hasAttribute('aria-live')).toBeFalse();
    expect(fixture.nativeElement.querySelector('.toast-body')).toBeTruthy();
  });

  it('paints the variant and picks its icon', () => {
    expect(root().classList).toContain('ds-toast--success');
    expect(fixture.nativeElement.querySelector('ds-icon')).toBeTruthy();
  });

  it('renders the title and the optional description', () => {
    expect(fixture.nativeElement.querySelector('.ds-toast__title').textContent).toContain(
      'Project saved',
    );
    expect(fixture.nativeElement.querySelector('.ds-toast__description')).toBeNull();

    host.toast.set({ ...BASE, description: 'Mural — March is up to date.' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ds-toast__description').textContent).toContain(
      'Mural — March',
    );
  });

  it('emits dismiss from the close button', () => {
    (fixture.nativeElement.querySelector('.ds-toast__dismiss button') as HTMLElement).click();
    expect(host.dismissed).toBe(1);
  });

  it('hides the close button when the toast is not dismissible', () => {
    host.toast.set({ ...BASE, dismissible: false });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ds-toast__dismiss')).toBeNull();
  });

  it('runs the action, then dismisses itself', () => {
    let ran = 0;
    host.toast.set({ ...BASE, action: { label: 'Undo', run: () => ran++ } });
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.ds-toast__action button') as HTMLElement).click();

    expect(ran).toBe(1);
    expect(host.dismissed).toBe(1);
  });

  it('pauses on pointer and focus, resumes when they leave', () => {
    const toast: HTMLElement = fixture.nativeElement.querySelector('ds-toast');

    toast.dispatchEvent(new MouseEvent('mouseenter'));
    expect(host.paused).toBe(1);

    toast.dispatchEvent(new MouseEvent('mouseleave'));
    expect(host.resumed).toBe(1);

    toast.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(host.paused).toBe(2);
  });
});

@Component({
  standalone: true,
  imports: [ToastHostComponent],
  template: `<ds-toast-host placement="top-center" />`,
})
class HostRegionComponent {}

describe('ToastHostComponent', () => {
  let fixture: ComponentFixture<HostRegionComponent>;
  let toasts: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostRegionComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(HostRegionComponent);
    toasts = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('renders a named region plus both live regions, before any toast exists', () => {
    const region: HTMLElement = fixture.nativeElement.querySelector('.toast-container');

    expect(region.classList).toContain('ds-toast-host--top-center');
    expect(region.getAttribute('role')).toBe('region');
    expect(region.getAttribute('aria-label')).toBe('Notifications');
    // The region itself is not live: the announcers are.
    expect(region.hasAttribute('aria-live')).toBeFalse();

    expect(fixture.nativeElement.querySelector('[aria-live="polite"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[aria-live="assertive"]')).toBeTruthy();
  });

  it('announces a status toast politely', async () => {
    toasts.success('Project saved', { description: 'Mural is up to date.', duration: 0 });
    fixture.detectChanges();

    await new Promise((resolve) => setTimeout(resolve, 120));
    fixture.detectChanges();

    const polite: HTMLElement = fixture.nativeElement.querySelector('[aria-live="polite"]');
    expect(polite.textContent).toContain('Success: Project saved Mural is up to date.');
    expect(fixture.nativeElement.querySelector('[aria-live="assertive"]').textContent!.trim()).toBe('');
  });

  it('interrupts for a problem', async () => {
    toasts.danger('Upload failed', { duration: 0 });
    fixture.detectChanges();

    await new Promise((resolve) => setTimeout(resolve, 120));
    fixture.detectChanges();

    const assertive: HTMLElement = fixture.nativeElement.querySelector('[aria-live="assertive"]');
    expect(assertive.textContent).toContain('Error: Upload failed');
  });

  it('clears the region first, so an identical message is announced again', async () => {
    const polite = (): HTMLElement => fixture.nativeElement.querySelector('[aria-live="polite"]');

    toasts.info('Saved', { duration: 0 });
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 120));
    fixture.detectChanges();
    expect(polite().textContent).toContain('Saved');

    toasts.info('Saved', { duration: 0 });
    fixture.detectChanges();
    // Emptied immediately…
    expect(polite().textContent!.trim()).toBe('');

    await new Promise((resolve) => setTimeout(resolve, 120));
    fixture.detectChanges();
    // …then refilled, which is what triggers the second announcement.
    expect(polite().textContent).toContain('Saved');
  });

  it('renders whatever the service queues, and drops what it dismisses', () => {
    const id = toasts.show({ title: 'One', duration: 0 });
    toasts.show({ title: 'Two', duration: 0 });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('ds-toast').length).toBe(2);

    toasts.dismiss(id);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('ds-toast').length).toBe(1);
  });

  it('dismisses through the toast’s own button', () => {
    toasts.show({ title: 'One', duration: 0 });
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.ds-toast__dismiss button') as HTMLElement).click();
    fixture.detectChanges();

    expect(toasts.count()).toBe(0);
  });
});
