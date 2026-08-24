import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import {
  DS_COMPONENTS,
  DS_PRIMITIVES,
  formatFileSize,
  type FileQueueStatus,
  type FileRejection,
} from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

interface DemoUpload {
  id: number;
  name: string;
  size: number;
  status: FileQueueStatus;
  progress: number;
  error: string;
}

/** Why each rule refused, in words a user can act on. */
const REJECTION_WORDS: Record<FileRejection['reason'], string> = {
  type: 'is not an accepted format',
  size: 'is larger than 5 MB',
  count: 'is over the 3-file limit',
};

/**
 * FileDropzone — documentation page.
 */
@Component({
  selector: 'app-file-dropzone-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI],
  templateUrl: './file-dropzone.page.html',
  styleUrl: './components-page.scss',
})
export class FileDropzonePage {
  private readonly destroyRef = inject(DestroyRef);
  private nextId = 1;
  private readonly timers = new Set<ReturnType<typeof setInterval>>();

  readonly uploads = signal<readonly DemoUpload[]>([]);
  readonly rejectionNote = signal('');

  readonly formatFileSize = formatFileSize;

  constructor() {
    this.destroyRef.onDestroy(() => this.timers.forEach((timer) => clearInterval(timer)));
  }

  /** Queue the accepted files and pretend to upload them. */
  onFilesAdded(files: File[]): void {
    for (const file of files) {
      const upload: DemoUpload = {
        id: this.nextId++,
        name: file.name,
        size: file.size,
        status: 'queued',
        progress: 0,
        error: '',
      };
      this.uploads.update((list) => [...list, upload]);
      this.simulate(upload.id);
    }
  }

  onFilesRejected(rejections: FileRejection[]): void {
    this.rejectionNote.set(
      rejections
        .map(({ file, reason }) => `${file.name} ${REJECTION_WORDS[reason]}.`)
        .join(' '),
    );
  }

  remove(id: number): void {
    this.uploads.update((list) => list.filter((upload) => upload.id !== id));
  }

  retry(id: number): void {
    this.patch(id, { status: 'queued', progress: 0, error: '' });
    this.simulate(id);
  }

  /** A fake transport: ~2s of progress, and every third upload fails. */
  private simulate(id: number): void {
    const willFail = id % 3 === 0;

    setTimeout(() => this.patch(id, { status: 'uploading' }), 300);

    const timer = setInterval(() => {
      const upload = this.uploads().find((u) => u.id === id);
      if (!upload || upload.status !== 'uploading') {
        return;
      }

      const progress = Math.min(100, upload.progress + 6 + Math.random() * 8);
      if (willFail && progress > 60) {
        this.patch(id, { status: 'error', error: 'The connection dropped at 60%.' });
        clearInterval(timer);
        this.timers.delete(timer);
      } else if (progress >= 100) {
        this.patch(id, { status: 'success', progress: 100 });
        clearInterval(timer);
        this.timers.delete(timer);
      } else {
        this.patch(id, { progress });
      }
    }, 150);

    this.timers.add(timer);
  }

  private patch(id: number, changes: Partial<DemoUpload>): void {
    this.uploads.update((list) =>
      list.map((upload) => (upload.id === id ? { ...upload, ...changes } : upload)),
    );
  }

  readonly basicSnippet = `<ds-file-dropzone
  accept="image/*,.pdf"
  [maxSize]="5 * 1024 * 1024"
  [maxFiles]="3"
  hint="Images or PDF, up to 5 MB, three at a time."
  (filesAdded)="queue($event)"
  (filesRejected)="explain($event)"
/>

@for (upload of uploads(); track upload.id) {
  <ds-file-queue-item
    [name]="upload.name"
    [size]="upload.size"
    [status]="upload.status"
    [progress]="upload.progress"
    [error]="upload.error"
    (remove)="remove(upload.id)"
    (retry)="retry(upload.id)"
  />
}`;

  readonly rulesSnippet = `// Every file comes out exactly once: accepted, or rejected with its rule.
onFilesRejected(rejections: FileRejection[]): void {
  // reason: 'type' | 'size' | 'count'
  this.note.set(rejections.map(r => \`\${r.file.name} — \${r.reason}\`).join(', '));
}`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'label', type: 'string', default: `'Drag and drop files here, or'`, description: 'The invitation.' },
    { name: 'browseLabel', type: 'string', default: `'browse'`, description: 'The linked-looking tail — the click target is the whole zone.' },
    { name: 'hint', type: 'string', default: `''`, description: 'Formats and limits, in words. Wired to the input via aria-describedby.' },
    { name: 'accept', type: 'string', default: `''`, description: 'Native accept grammar: .csv, image/png, image/* — comma-separated. Applied to drops too.' },
    { name: 'multiple', type: 'boolean', default: 'true', description: 'More than one file per pick or drop.' },
    { name: 'maxSize', type: 'number | null', default: 'null', description: 'Per-file ceiling in bytes.' },
    { name: 'maxFiles', type: 'number | null', default: 'null', description: 'Most files per drop. multiple=false means one, regardless.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the input and ignores drags.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'filesAdded', type: 'OutputEmitterRef<File[]>', default: '—', description: 'The files that passed every rule. Emitted only when there are any.' },
    { name: 'filesRejected', type: 'OutputEmitterRef<FileRejection[]>', default: '—', description: 'The files that did not, each with the rule it broke: type, size or count.' },
  ];
}
