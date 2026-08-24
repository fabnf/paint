import { Component, signal } from '@angular/core';
import { TestBed, fakeAsync, tick, type ComponentFixture } from '@angular/core/testing';
import type { FileRejection } from '../../molecules/file-upload';
import { FileUploaderComponent } from './file-uploader.component';
import {
  simulatedUploadAdapter,
  type UploadAdapter,
  type UploadQueueItem,
  type UploadReport,
} from './upload-adapter';

/** A transport the test drives by hand: no timers, no luck. */
class TestAdapter implements UploadAdapter {
  readonly started: Array<{ file: File; report: UploadReport; cancelled: boolean }> = [];

  upload(file: File, report: UploadReport) {
    const entry = { file, report, cancelled: false };
    this.started.push(entry);
    return { cancel: () => (entry.cancelled = true) };
  }

  /** The transport for `name`, most recent attempt first. */
  for(name: string) {
    return [...this.started].reverse().find((entry) => entry.file.name === name)!;
  }
}

const makeFile = (name: string, size = 10, type = 'text/plain'): File =>
  new File([new Uint8Array(size)], name, { type });

@Component({
  standalone: true,
  imports: [FileUploaderComponent],
  template: `
    <ds-file-uploader
      [adapter]="adapter"
      [maxConcurrent]="maxConcurrent()"
      [autoUpload]="autoUpload()"
      [maxSize]="maxSize()"
      [maxFiles]="maxFiles()"
      hint="Anything small."
      (queueChange)="queues.push($event)"
      (uploaded)="uploadedItems.push($event)"
      (uploadFailed)="failedItems.push($event)"
      (filesRejected)="rejections.push($event)"
    />
  `,
})
class HostComponent {
  readonly adapter = new TestAdapter();
  readonly maxConcurrent = signal(2);
  readonly autoUpload = signal(true);
  readonly maxSize = signal<number | null>(null);
  readonly maxFiles = signal<number | null>(null);
  queues: UploadQueueItem[][] = [];
  uploadedItems: UploadQueueItem[] = [];
  failedItems: UploadQueueItem[] = [];
  rejections: FileRejection[][] = [];
}

describe('FileUploaderComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let uploader: FileUploaderComponent;

  const rows = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('ds-file-queue-item'));
  const row = (name: string): HTMLElement =>
    rows().find((r) => r.textContent!.includes(name))!;
  const statusOf = (name: string): string =>
    row(name).querySelector('.ds-file-item__status')!.textContent!.trim();
  const summary = (): string =>
    fixture.nativeElement.querySelector('.ds-uploader__summary')?.textContent?.trim() ?? '';
  const footerButton = (text: string): HTMLButtonElement | null =>
    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.ds-uploader__actions button'),
    ).find((b): b is HTMLButtonElement => !!b.textContent?.includes(text)) ?? null;
  const add = (...names: string[]) => {
    uploader.addFiles(names.map((name) => makeFile(name)));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    uploader = fixture.debugElement.children[0].componentInstance;
  });

  it('starts empty: a dropzone, no queue, no footer', () => {
    expect(fixture.nativeElement.querySelector('ds-file-dropzone')).toBeTruthy();
    expect(rows().length).toBe(0);
    expect(summary()).toBe('');
  });

  it('uploads what the dropzone lets through, up to maxConcurrent at a time', () => {
    add('a.txt', 'b.txt', 'c.txt');

    // Two on the wire, one visibly waiting.
    expect(host.adapter.started.length).toBe(2);
    expect(statusOf('a.txt')).toBe('0%');
    expect(statusOf('b.txt')).toBe('0%');
    expect(statusOf('c.txt')).toBe('Queued');
    expect(summary()).toBe('2 uploading · 1 waiting');
  });

  it('reports progress on the row the adapter is talking about', () => {
    add('a.txt');
    host.adapter.for('a.txt').report.progress(45);
    fixture.detectChanges();

    expect(statusOf('a.txt')).toBe('45%');
    expect(row('a.txt').querySelector('[role="progressbar"]')!.getAttribute('aria-valuenow')).toBe(
      '45',
    );
  });

  it('a finished file frees its slot for the next in line', () => {
    add('a.txt', 'b.txt', 'c.txt');
    host.adapter.for('a.txt').report.done();
    fixture.detectChanges();

    expect(statusOf('a.txt')).toBe('Uploaded');
    expect(host.adapter.started.length).toBe(3);
    expect(statusOf('c.txt')).toBe('0%');
    expect(host.uploadedItems.map((item) => item.file.name)).toEqual(['a.txt']);
  });

  it('a failure shows the adapter words and offers retry', () => {
    add('a.txt');
    host.adapter.for('a.txt').report.fail('The server refused the file.');
    fixture.detectChanges();

    expect(statusOf('a.txt')).toBe('Failed');
    expect(row('a.txt').textContent).toContain('The server refused the file.');
    expect(host.failedItems.map((item) => item.file.name)).toEqual(['a.txt']);

    // Retry runs the same File through the adapter again.
    (row('a.txt').querySelector('button[aria-label^="Retry"]') as HTMLElement).click();
    fixture.detectChanges();

    expect(host.adapter.started.length).toBe(2);
    expect(host.adapter.started[1].file).toBe(host.adapter.started[0].file);
    expect(statusOf('a.txt')).toBe('0%');
  });

  it('a chatty adapter cannot resurrect a settled file', () => {
    add('a.txt');
    const transport = host.adapter.for('a.txt');
    transport.report.done();
    transport.report.fail('too late');
    transport.report.progress(12);
    fixture.detectChanges();

    expect(statusOf('a.txt')).toBe('Uploaded');
    expect(host.failedItems.length).toBe(0);
  });

  it('removing a row mid-upload cancels its transport first', () => {
    add('a.txt', 'b.txt', 'c.txt');

    (row('a.txt').querySelector('button[aria-label^="Cancel"]') as HTMLElement).click();
    fixture.detectChanges();

    expect(host.adapter.for('a.txt').cancelled).toBeTrue();
    expect(rows().length).toBe(2);
    // The freed slot goes to the one that was waiting.
    expect(statusOf('c.txt')).toBe('0%');
  });

  it('waits for Upload all when autoUpload is off', () => {
    host.autoUpload.set(false);
    fixture.detectChanges();

    add('a.txt', 'b.txt');
    expect(host.adapter.started.length).toBe(0);
    expect(summary()).toBe('2 waiting');

    const button = footerButton('Upload all')!;
    expect(button.textContent).toContain('(2)');
    button.click();
    fixture.detectChanges();

    expect(host.adapter.started.length).toBe(2);
  });

  it('Retry failed re-queues every failure; Clear finished keeps them', () => {
    add('a.txt', 'b.txt');
    host.adapter.for('a.txt').report.done();
    host.adapter.for('b.txt').report.fail();
    fixture.detectChanges();

    expect(summary()).toBe('1 uploaded · 1 failed');

    footerButton('Clear finished')!.click();
    fixture.detectChanges();
    expect(rows().length).toBe(1);
    expect(statusOf('b.txt')).toBe('Failed');

    footerButton('Retry failed')!.click();
    fixture.detectChanges();
    expect(statusOf('b.txt')).toBe('0%');
  });

  it('turns rejections into sentences, with the limits filled in', () => {
    host.maxSize.set(1024);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      '.ds-dropzone__input',
    ) as HTMLInputElement;
    const transfer = new DataTransfer();
    transfer.items.add(makeFile('huge.bin', 4096));
    input.files = transfer.files;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('ds-alert') as HTMLElement;
    expect(alert.textContent).toContain('huge.bin is larger than 1 KB.');
    expect(host.rejections[0][0].reason).toBe('size');
    expect(rows().length).toBe(0);
  });

  it('caps the whole queue with maxFiles and closes the door at capacity', () => {
    host.maxFiles.set(2);
    fixture.detectChanges();

    add('a.txt', 'b.txt');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      '.ds-dropzone__input',
    ) as HTMLInputElement;
    expect(input.disabled).toBeTrue();
  });

  it('announces once when the queue settles, and not before', () => {
    add('a.txt', 'b.txt');
    const liveRegion = () =>
      (fixture.nativeElement.querySelector('[aria-live="polite"].visually-hidden') as HTMLElement)
        .textContent!.trim();

    host.adapter.for('a.txt').report.done();
    fixture.detectChanges();
    expect(liveRegion()).toBe('');

    host.adapter.for('b.txt').report.fail();
    fixture.detectChanges();
    expect(liveRegion()).toBe('Uploads finished: 1 uploaded, 1 failed.');
  });

  it('reports the queue to the outside on every change', () => {
    add('a.txt');
    host.adapter.for('a.txt').report.done();
    fixture.detectChanges();

    const last = host.queues[host.queues.length - 1];
    expect(last.length).toBe(1);
    expect(last[0].status).toBe('success');
  });

  it('cancels every running transport when destroyed mid-flight', () => {
    add('a.txt', 'b.txt');
    fixture.destroy();

    expect(host.adapter.started.every((entry) => entry.cancelled)).toBeTrue();
  });
});

describe('simulatedUploadAdapter', () => {
  it('ticks to done on a timer', fakeAsync(() => {
    const adapter = simulatedUploadAdapter({ tickMs: 10, increment: 50 });
    const events: string[] = [];

    adapter.upload(makeFile('a.txt'), {
      progress: (p) => events.push(`p${p}`),
      done: () => events.push('done'),
      fail: () => events.push('fail'),
    });

    tick(30);
    expect(events).toEqual(['p50', 'done']);
  }));

  it('fails when asked, and counts attempts so a retry can succeed', fakeAsync(() => {
    const adapter = simulatedUploadAdapter({
      tickMs: 10,
      increment: 50,
      failOn: (_file, attempt) => (attempt === 1 ? 'First try never works.' : null),
    });
    const file = makeFile('a.txt');
    const events: string[] = [];
    const report = {
      progress: (p: number) => events.push(`p${p}`),
      done: () => events.push('done'),
      fail: (m?: string) => events.push(`fail:${m}`),
    };

    adapter.upload(file, report);
    tick(30);
    expect(events).toEqual(['p50', 'fail:First try never works.']);

    adapter.upload(file, report);
    tick(30);
    expect(events.slice(2)).toEqual(['p50', 'done']);
  }));

  it('cancel stops the clock: nothing reports afterwards', fakeAsync(() => {
    const adapter = simulatedUploadAdapter({ tickMs: 10, increment: 50 });
    const events: string[] = [];

    const task = adapter.upload(makeFile('a.txt'), {
      progress: (p) => events.push(`p${p}`),
      done: () => events.push('done'),
      fail: () => events.push('fail'),
    });

    tick(10);
    task.cancel();
    tick(100);
    expect(events).toEqual(['p50']);
  }));
});
