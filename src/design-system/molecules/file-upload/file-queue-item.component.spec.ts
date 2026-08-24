import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FileQueueItemComponent } from './file-queue-item.component';
import type { FileQueueStatus } from './file-upload.types';

@Component({
  standalone: true,
  imports: [FileQueueItemComponent],
  template: `
    <ds-file-queue-item
      [name]="name()"
      [size]="size()"
      [status]="status()"
      [progress]="progress()"
      [error]="error()"
      [removable]="removable()"
      [retryable]="retryable()"
      (remove)="removes = removes + 1"
      (retry)="retries = retries + 1"
    />
  `,
})
class HostComponent {
  readonly name = signal('quarterly-report.pdf');
  readonly size = signal<number | null>(4.2 * 1024 * 1024);
  readonly status = signal<FileQueueStatus>('queued');
  readonly progress = signal(0);
  readonly error = signal('');
  readonly removable = signal(true);
  readonly retryable = signal(true);
  removes = 0;
  retries = 0;
}

describe('FileQueueItemComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const root = (): HTMLElement => fixture.nativeElement.querySelector('.ds-file-item');
  const text = () => root().textContent ?? '';
  const progressbar = (): HTMLElement | null =>
    fixture.nativeElement.querySelector('[role="progressbar"]');
  const button = (label: string): HTMLButtonElement | null =>
    fixture.nativeElement.querySelector(`button[aria-label="${label}"]`);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows the name, the size in words, and the state', () => {
    expect(text()).toContain('quarterly-report.pdf');
    expect(text()).toContain('4.2 MB');
    expect(text()).toContain('Queued');
    expect(progressbar()).toBeNull();
  });

  it('shows a named progress bar only while uploading', () => {
    host.status.set('uploading');
    host.progress.set(45);
    fixture.detectChanges();

    expect(progressbar()).toBeTruthy();
    expect(progressbar()!.getAttribute('aria-valuenow')).toBe('45');
    expect(progressbar()!.getAttribute('aria-label')).toBe('Uploading quarterly-report.pdf');
    expect(text()).toContain('45%');

    host.status.set('success');
    fixture.detectChanges();
    expect(progressbar()).toBeNull();
    expect(text()).toContain('Uploaded');
  });

  it('says what went wrong, politely out loud', () => {
    host.status.set('error');
    host.error.set('File is larger than 10 MB.');
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('.ds-file-item__error') as HTMLElement;
    expect(error.textContent).toContain('File is larger than 10 MB.');
    // A live region: in a long queue, the row that broke is rarely on screen.
    expect(error.getAttribute('role')).toBe('status');
  });

  it('falls back to plain words when the transport offers none', () => {
    host.status.set('error');
    fixture.detectChanges();

    expect(text()).toContain('Upload failed.');
  });

  it('names its buttons after the file', () => {
    expect(button('Remove quarterly-report.pdf')).toBeTruthy();

    host.status.set('error');
    fixture.detectChanges();
    expect(button('Retry uploading quarterly-report.pdf')).toBeTruthy();
  });

  it('calls remove "cancel" mid-upload, because that is what it does', () => {
    host.status.set('uploading');
    fixture.detectChanges();

    expect(button('Cancel uploading quarterly-report.pdf')).toBeTruthy();
    expect(button('Remove quarterly-report.pdf')).toBeNull();
  });

  it('only offers retry for a failure', () => {
    expect(button('Retry uploading quarterly-report.pdf')).toBeNull();

    host.status.set('error');
    host.retryable.set(false);
    fixture.detectChanges();
    expect(button('Retry uploading quarterly-report.pdf')).toBeNull();
  });

  it('emits, and does not act: the consumer owns the queue', () => {
    host.status.set('error');
    fixture.detectChanges();

    button('Remove quarterly-report.pdf')!.click();
    button('Retry uploading quarterly-report.pdf')!.click();
    fixture.detectChanges();

    expect(host.removes).toBe(1);
    expect(host.retries).toBe(1);
    // Still here. A row that deletes its own DOM node cannot be undone.
    expect(root()).toBeTruthy();
  });

  it('can hide the remove button for a row the user must keep', () => {
    host.removable.set(false);
    fixture.detectChanges();

    expect(button('Remove quarterly-report.pdf')).toBeNull();
  });
});
