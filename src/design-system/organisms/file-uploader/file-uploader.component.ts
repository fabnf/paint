import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FileDropzoneComponent,
  FileQueueItemComponent,
  formatFileSize,
  type FileRejection,
} from '../../molecules/file-upload';
import { AlertComponent } from '../../molecules/alert';
import { ButtonComponent } from '../../primitives/button';
import type { UploadAdapter, UploadQueueItem, UploadTask } from './upload-adapter';

/** Why each screening rule refused — the uploader says it in a sentence. */
const REJECTION_WORDS: Record<FileRejection['reason'], (limit: string) => string> = {
  type: () => 'is not an accepted format',
  size: (limit) => `is larger than ${limit}`,
  count: (limit) => `is over the ${limit}-file limit`,
};

/**
 * FileUploader — the multi-file flow, assembled.
 *
 * A `<ds-file-dropzone>` feeding a queue of `<ds-file-queue-item>`s, with the
 * organism owning everything the molecules refused to: the list, the
 * concurrency, cancel-on-remove, retry, and the words when files are turned
 * away. The one thing it still refuses to own is the wire — uploads go through
 * an {@link UploadAdapter}, one function a product writes over its own HTTP
 * (and `simulatedUploadAdapter()` stands in until there is a server).
 *
 * The queue honours the molecules' contracts: a row's remove button cancels a
 * running upload before it removes the row; retry re-runs the same file
 * through the adapter; a failure is announced by the row itself. At most
 * `maxConcurrent` files are on the wire at once — the rest wait as `queued`,
 * visibly.
 *
 * @example
 * ```html
 * <ds-file-uploader
 *   [adapter]="adapter"
 *   accept="image/*,.pdf"
 *   [maxSize]="10 * 1024 * 1024"
 *   hint="Images or PDF, up to 10 MB."
 *   (uploaded)="attach($event)"
 * />
 * ```
 */
@Component({
  selector: 'ds-file-uploader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FileDropzoneComponent, FileQueueItemComponent, AlertComponent, ButtonComponent],
  template: `
    <ds-file-dropzone
      [label]="label()"
      [browseLabel]="browseLabel()"
      [hint]="hint()"
      [accept]="accept()"
      [multiple]="multiple()"
      [maxSize]="maxSize()"
      [maxFiles]="capacityLeft()"
      [disabled]="disabled() || capacityLeft() === 0"
      (filesAdded)="addFiles($event)"
      (filesRejected)="onRejected($event)"
    />

    @if (rejectionNote()) {
      <ds-alert
        class="ds-uploader__rejections"
        tone="warning"
        live="polite"
        [title]="rejectionTitle()"
        [dismissible]="true"
        (dismissed)="rejectionNote.set('')"
      >
        {{ rejectionNote() }}
      </ds-alert>
    }

    @if (items().length > 0) {
      <ul class="ds-uploader__queue">
        @for (item of items(); track item.id) {
          <li>
            <ds-file-queue-item
              [name]="item.file.name"
              [size]="item.file.size"
              [status]="item.status"
              [progress]="item.progress"
              [error]="item.error"
              (remove)="remove(item.id)"
              (retry)="retry(item.id)"
            />
          </li>
        }
      </ul>

      <div class="ds-uploader__footer">
        <span class="ds-uploader__summary">{{ summary() }}</span>

        <span class="ds-uploader__actions">
          @if (!autoUpload() && queuedCount() > 0) {
            <ds-button variant="primary" size="sm" iconStart="upload" (clicked)="uploadAll()">
              {{ uploadLabel() }} ({{ queuedCount() }})
            </ds-button>
          }
          @if (failedCount() > 0) {
            <ds-button variant="secondary" size="sm" iconStart="refresh" (clicked)="retryFailed()">
              {{ retryAllLabel() }}
            </ds-button>
          }
          @if (finishedCount() > 0) {
            <ds-button variant="ghost" size="sm" (clicked)="clearFinished()">
              {{ clearLabel() }}
            </ds-button>
          }
        </span>
      </div>
    }

    <!-- Said once, when the queue settles: the rows already narrate themselves. -->
    <span class="visually-hidden" aria-live="polite">{{ settledAnnouncement() }}</span>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-3);
    }

    .ds-uploader__queue {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-2);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .ds-uploader__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ds-space-3);
      flex-wrap: wrap;
    }

    .ds-uploader__summary {
      font-size: var(--ds-font-size-sm);
      color: var(--ds-color-text-muted);
      font-variant-numeric: tabular-nums;
    }

    .ds-uploader__actions {
      display: inline-flex;
      gap: var(--ds-space-2);
      flex-wrap: wrap;
    }
  `,
})
export class FileUploaderComponent {
  /** The transport. `simulatedUploadAdapter()` until there is a server. */
  readonly adapter = input.required<UploadAdapter>();

  // —— screening, forwarded to the dropzone ——
  readonly accept = input<string>('');
  readonly multiple = input(true);
  /** Per-file ceiling in bytes. */
  readonly maxSize = input<number | null>(null);
  /** Most files the whole queue may hold, finished ones included. */
  readonly maxFiles = input<number | null>(null);
  readonly disabled = input(false);

  // —— flow ——
  /** Files on the wire at once. The rest wait as `queued`, visibly. */
  readonly maxConcurrent = input(3);
  /** Start the moment a file passes screening. `false` waits for Upload all. */
  readonly autoUpload = input(true);

  // —— words ——
  readonly label = input<string>('Drag and drop files here, or');
  readonly browseLabel = input<string>('browse');
  readonly hint = input<string>('');
  readonly uploadLabel = input<string>('Upload all');
  readonly retryAllLabel = input<string>('Retry failed');
  readonly clearLabel = input<string>('Clear finished');
  readonly rejectionTitle = input<string>('Some files were not added');

  /** The whole queue, on every change. The array and its items are snapshots. */
  readonly queueChange = output<UploadQueueItem[]>();
  /** One file made it. */
  readonly uploaded = output<UploadQueueItem>();
  /** One file did not. Retry may still rescue it. */
  readonly uploadFailed = output<UploadQueueItem>();
  /** The dropzone's verdicts, re-emitted for consumers that log or toast them. */
  readonly filesRejected = output<FileRejection[]>();

  protected readonly items = signal<readonly UploadQueueItem[]>([]);
  protected readonly rejectionNote = signal('');
  protected readonly settledAnnouncement = signal('');

  /** Running transports, so removing a row can stop one mid-flight. */
  private readonly tasks = new Map<number, UploadTask>();
  /** Files approved to start: all adds when autoUpload, else Upload all / retry. */
  private readonly approved = new Set<number>();
  private nextId = 1;

  protected readonly queuedCount = computed(
    () => this.items().filter((item) => item.status === 'queued').length,
  );
  protected readonly uploadingCount = computed(
    () => this.items().filter((item) => item.status === 'uploading').length,
  );
  protected readonly finishedCount = computed(
    () => this.items().filter((item) => item.status === 'success').length,
  );
  protected readonly failedCount = computed(
    () => this.items().filter((item) => item.status === 'error').length,
  );

  /** How many more files the queue can take. `null` caps nothing. */
  protected readonly capacityLeft = computed(() => {
    const cap = this.maxFiles();
    return cap === null ? null : Math.max(0, cap - this.items().length);
  });

  /** "1 uploading · 2 waiting · 3 uploaded · 1 failed" — only the parts that exist. */
  protected readonly summary = computed(() => {
    const parts: string[] = [];
    if (this.uploadingCount() > 0) {
      parts.push(`${this.uploadingCount()} uploading`);
    }
    if (this.queuedCount() > 0) {
      parts.push(`${this.queuedCount()} waiting`);
    }
    if (this.finishedCount() > 0) {
      parts.push(`${this.finishedCount()} uploaded`);
    }
    if (this.failedCount() > 0) {
      parts.push(`${this.failedCount()} failed`);
    }
    return parts.join(' · ');
  });

  constructor() {
    // An uploader destroyed mid-flight must not leave transports running.
    inject(DestroyRef).onDestroy(() => {
      this.tasks.forEach((task) => task.cancel());
      this.tasks.clear();
    });
  }

  /** Queues files as if they were dropped. For programmatic adds and tests. */
  addFiles(files: readonly File[]): void {
    if (files.length === 0) {
      return;
    }

    const added = files.map<UploadQueueItem>((file) => ({
      id: this.nextId++,
      file,
      status: 'queued',
      progress: 0,
      error: '',
    }));

    if (this.autoUpload()) {
      added.forEach((item) => this.approved.add(item.id));
    }

    this.items.update((items) => [...items, ...added]);
    this.settledAnnouncement.set('');
    this.emitQueue();
    this.pump();
  }

  /** Starts everything still waiting. The Upload all button, as a method. */
  uploadAll(): void {
    for (const item of this.items()) {
      if (item.status === 'queued') {
        this.approved.add(item.id);
      }
    }
    this.pump();
  }

  /** Re-queues one failure and starts it as soon as a slot frees. */
  retry(id: number): void {
    const item = this.items().find((candidate) => candidate.id === id);
    if (!item || item.status !== 'error') {
      return;
    }

    this.patch(id, { status: 'queued', progress: 0, error: '' });
    this.approved.add(id);
    this.emitQueue();
    this.pump();
  }

  /** Every failure, back in the queue. */
  retryFailed(): void {
    for (const item of this.items()) {
      if (item.status === 'error') {
        this.patch(item.id, { status: 'queued', progress: 0, error: '' });
        this.approved.add(item.id);
      }
    }
    this.emitQueue();
    this.pump();
  }

  /** Removes a row — and stops its transport first, if it is on the wire. */
  remove(id: number): void {
    this.tasks.get(id)?.cancel();
    this.tasks.delete(id);
    this.approved.delete(id);
    this.items.update((items) => items.filter((item) => item.id !== id));
    this.emitQueue();
    this.pump();
  }

  /** Drops the successes, keeps everything still pending or broken. */
  clearFinished(): void {
    this.items.update((items) => items.filter((item) => item.status !== 'success'));
    this.emitQueue();
  }

  protected onRejected(rejections: FileRejection[]): void {
    const sizeLimit = this.maxSize() !== null ? formatFileSize(this.maxSize()!) : '';
    const countLimit = String(this.maxFiles() ?? '');

    this.rejectionNote.set(
      rejections
        .map(({ file, reason }) => {
          const limit = reason === 'size' ? sizeLimit : countLimit;
          return `${file.name} ${REJECTION_WORDS[reason](limit)}.`;
        })
        .join(' '),
    );
    this.filesRejected.emit(rejections);
  }

  /** Starts approved, queued items until the concurrency budget is spent. */
  private pump(): void {
    while (this.uploadingCount() < this.maxConcurrent()) {
      const next = this.items().find(
        (item) => item.status === 'queued' && this.approved.has(item.id),
      );
      if (!next) {
        break;
      }
      this.start(next);
    }
    this.maybeAnnounceSettled();
  }

  private start(item: UploadQueueItem): void {
    const id = item.id;
    this.approved.delete(id);
    this.patch(id, { status: 'uploading', progress: 0 });
    this.emitQueue();

    // A transport may report late, after a cancel or a second verdict. The
    // guard makes the organism's bookkeeping immune to a chatty adapter.
    const live = () => this.items().find((candidate) => candidate.id === id);

    const task = this.adapter().upload(item.file, {
      progress: (percent) => {
        if (live()?.status === 'uploading') {
          this.patch(id, { progress: Math.max(0, Math.min(100, percent)) });
        }
      },
      done: () => {
        if (live()?.status !== 'uploading') {
          return;
        }
        this.tasks.delete(id);
        this.patch(id, { status: 'success', progress: 100 });
        this.emitQueue();
        this.uploaded.emit(live()!);
        this.pump();
      },
      fail: (message) => {
        if (live()?.status !== 'uploading') {
          return;
        }
        this.tasks.delete(id);
        this.patch(id, { status: 'error', error: message ?? '' });
        this.emitQueue();
        this.uploadFailed.emit(live()!);
        this.pump();
      },
    });

    // A synchronous adapter may have settled the file before returning: only
    // keep the handle while there is still something to cancel.
    if (live()?.status === 'uploading') {
      this.tasks.set(id, task);
    }
  }

  /** Once, when nothing is moving any more — the rows narrated the journey. */
  private maybeAnnounceSettled(): void {
    const items = this.items();
    if (items.length === 0 || this.queuedCount() > 0 || this.uploadingCount() > 0) {
      return;
    }
    // In a manual-upload queue, files at rest are not a finished batch.
    if (items.every((item) => item.status === 'queued')) {
      return;
    }

    const done = this.finishedCount();
    const failed = this.failedCount();
    this.settledAnnouncement.set(
      failed > 0
        ? `Uploads finished: ${done} uploaded, ${failed} failed.`
        : `All ${done} file${done === 1 ? '' : 's'} uploaded.`,
    );
  }

  private patch(id: number, changes: Partial<UploadQueueItem>): void {
    this.items.update((items) =>
      items.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  }

  private emitQueue(): void {
    this.queueChange.emit([...this.items()]);
  }
}
