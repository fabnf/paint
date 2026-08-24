import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { DS_COMPONENTS, DS_PRIMITIVES, type FileQueueStatus } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * FileQueueItem — documentation page.
 */
@Component({
  selector: 'app-file-queue-item-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI],
  templateUrl: './file-queue-item.page.html',
  styleUrl: './components-page.scss',
})
export class FileQueueItemPage {
  private readonly destroyRef = inject(DestroyRef);
  private timer: ReturnType<typeof setInterval> | null = null;

  /** The retry demo: fails the first time, succeeds once retried. */
  readonly demoStatus = signal<FileQueueStatus>('queued');
  readonly demoProgress = signal(0);
  readonly demoError = signal('');
  readonly demoRemoved = signal(false);
  private attempts = 0;

  constructor() {
    this.destroyRef.onDestroy(() => this.stop());
  }

  start(): void {
    this.attempts++;
    this.demoRemoved.set(false);
    this.demoError.set('');
    this.demoProgress.set(0);
    this.demoStatus.set('uploading');
    this.stop();

    const failsThisTime = this.attempts % 2 === 1;
    this.timer = setInterval(() => {
      const progress = Math.min(100, this.demoProgress() + 9);
      if (failsThisTime && progress > 55) {
        this.demoStatus.set('error');
        this.demoError.set('The connection dropped at 55%.');
        this.stop();
      } else if (progress >= 100) {
        this.demoStatus.set('success');
        this.demoProgress.set(100);
        this.stop();
      } else {
        this.demoProgress.set(progress);
      }
    }, 180);
  }

  removeDemo(): void {
    this.stop();
    this.demoRemoved.set(true);
  }

  resetDemo(): void {
    this.stop();
    this.attempts = 0;
    this.demoRemoved.set(false);
    this.demoError.set('');
    this.demoProgress.set(0);
    this.demoStatus.set('queued');
  }

  private stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  readonly statesSnippet = `<ds-file-queue-item name="photo.jpg" [size]="18432" />
<ds-file-queue-item name="slides.pdf" [size]="4404019" status="uploading" [progress]="45" />
<ds-file-queue-item name="notes.txt" [size]="912" status="success" />
<ds-file-queue-item
  name="video.mp4"
  [size]="125829120"
  status="error"
  error="File is larger than 10 MB."
/>`;

  readonly wiringSnippet = `// The row reports and emits; the consumer owns the queue and the transport.
<ds-file-queue-item
  [name]="upload.file.name"
  [size]="upload.file.size"
  [status]="upload.status"
  [progress]="upload.progress"
  [error]="upload.error"
  (remove)="cancel(upload)"
  (retry)="restart(upload)"
/>`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'name', type: 'string', default: 'required', description: 'The file’s name. Shown, truncated from the end, and used to name every button in the row.' },
    { name: 'size', type: 'number | null', default: 'null', description: 'Size in bytes, formatted for humans (4.2 MB). null shows nothing.' },
    { name: 'status', type: `'queued' | 'uploading' | 'success' | 'error'`, default: `'queued'`, description: 'Where the file is in its life.' },
    { name: 'progress', type: 'number', default: '0', description: '0–100, read while uploading. Drives a named ds-progress.' },
    { name: 'error', type: 'string', default: `''`, description: 'What went wrong, in words a user can act on. Falls back to “Upload failed.”' },
    { name: 'removable', type: 'boolean', default: 'true', description: 'The remove button. Mid-upload its name becomes “Cancel uploading …”.' },
    { name: 'retryable', type: 'boolean', default: 'true', description: 'The retry button, shown only in the error state.' },
    { name: 'removeLabel / retryLabel', type: 'string', default: `'' (names the file)`, description: 'Override the buttons’ accessible names.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'remove', type: 'OutputEmitterRef<void>', default: '—', description: 'Remove (or cancel) was pressed. The row does not remove itself.' },
    { name: 'retry', type: 'OutputEmitterRef<void>', default: '—', description: 'Retry was pressed. The row does not restart anything.' },
  ];
}
