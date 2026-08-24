import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  DS_COMPONENTS,
  DS_PRIMITIVES,
  simulatedUploadAdapter,
  type UploadQueueItem,
} from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * FileUploader — documentation page.
 */
@Component({
  selector: 'app-file-uploader-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI],
  templateUrl: './file-uploader.page.html',
  styleUrl: './components-page.scss',
})
export class FileUploaderPage {
  /** Counts first attempts, so every third file can fail its first try. */
  private nth = 0;

  /**
   * The stub transport: ~1.5s per file, and every third file's *first* attempt
   * fails — so the error state and the retry path demonstrate themselves.
   */
  readonly adapter = simulatedUploadAdapter({
    failOn: (_file, attempt) => {
      if (attempt > 1) {
        return null; // retries always make it: the point is the journey
      }
      return this.nth++ % 3 === 2 ? 'The connection dropped mid-transfer.' : null;
    },
  });

  /** A slower, politer one for the manual-upload demo. */
  readonly manualAdapter = simulatedUploadAdapter({ tickMs: 120, increment: 8 });
  readonly strictAdapter = simulatedUploadAdapter();

  readonly lastUploaded = signal('');

  onUploaded(item: UploadQueueItem): void {
    this.lastUploaded.set(item.file.name);
  }

  readonly flowSnippet = `<ds-file-uploader
  [adapter]="adapter"
  hint="Anything under 10 MB. Every third file fails its first attempt — retry it."
  (uploaded)="attach($event)"
  (uploadFailed)="log($event)"
/>

// The transport is one function a product writes over its own HTTP —
// until then, the stub that ships with Paint:
readonly adapter = simulatedUploadAdapter({
  failOn: (file, attempt) => (attempt === 1 && unlucky(file) ? 'The connection dropped.' : null),
});`;

  readonly adapterSnippet = `// The real thing, over Angular's HttpClient — an adapter is ~10 lines:
const httpAdapter = (http: HttpClient): UploadAdapter => ({
  upload(file, report) {
    const sub = http
      .post('/api/files', file, { reportProgress: true, observe: 'events' })
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            report.progress(Math.round((100 * event.loaded) / event.total));
          }
          if (event.type === HttpEventType.Response) {
            report.done();
          }
        },
        error: () => report.fail('The server refused the file.'),
      });
    // Cancel is unsubscribe — which is how HttpClient aborts the request.
    return { cancel: () => sub.unsubscribe() };
  },
});`;

  readonly manualSnippet = `<!-- Nothing moves until the user says so: queue first, one button uploads. -->
<ds-file-uploader [adapter]="adapter" [autoUpload]="false" [maxConcurrent]="2" />`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'adapter', type: 'UploadAdapter', default: 'required', description: 'The transport. One function over the product’s HTTP; simulatedUploadAdapter() until then.' },
    { name: 'accept / multiple / maxSize', type: 'string / boolean / number | null', default: `'' / true / null`, description: 'Screening, forwarded to the dropzone and applied to drops too.' },
    { name: 'maxFiles', type: 'number | null', default: 'null', description: 'Most files the whole queue may hold. At capacity, the dropzone closes.' },
    { name: 'maxConcurrent', type: 'number', default: '3', description: 'Files on the wire at once. The rest wait as “queued”, visibly.' },
    { name: 'autoUpload', type: 'boolean', default: 'true', description: 'Start the moment a file passes screening, or wait for Upload all.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Closes the dropzone. Running uploads keep running.' },
    { name: 'label / browseLabel / hint', type: 'string', default: 'the dropzone’s', description: 'The invitation, forwarded.' },
    { name: 'uploadLabel / retryAllLabel / clearLabel / rejectionTitle', type: 'string', default: 'sensible words', description: 'Every string in the footer and the rejection alert.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'queueChange', type: 'OutputEmitterRef<UploadQueueItem[]>', default: '—', description: 'The whole queue, on every change. Items are snapshots.' },
    { name: 'uploaded', type: 'OutputEmitterRef<UploadQueueItem>', default: '—', description: 'One file made it.' },
    { name: 'uploadFailed', type: 'OutputEmitterRef<UploadQueueItem>', default: '—', description: 'One file did not. Retry may still rescue it.' },
    { name: 'filesRejected', type: 'OutputEmitterRef<FileRejection[]>', default: '—', description: 'The dropzone’s verdicts, re-emitted.' },
  ];

  readonly methods: readonly ApiRow[] = [
    { name: 'addFiles(files)', type: 'method', default: '—', description: 'Queues files as if they were dropped. For programmatic adds and tests.' },
    { name: 'uploadAll() / retry(id) / retryFailed()', type: 'method', default: '—', description: 'The footer buttons, as methods.' },
    { name: 'remove(id)', type: 'method', default: '—', description: 'Cancels the transport first if the file is on the wire, then drops the row.' },
    { name: 'clearFinished()', type: 'method', default: '—', description: 'Drops the successes, keeps everything pending or broken.' },
  ];

  readonly adapterApi: readonly ApiRow[] = [
    { name: 'upload(file, report)', type: '(File, UploadReport) => UploadTask', default: '—', description: 'Start one file. Return synchronously; report everything else.' },
    { name: 'report.progress(percent)', type: '(number) => void', default: '—', description: '0–100. A transport with no progress just never calls it.' },
    { name: 'report.done() / report.fail(message?)', type: '() => void', default: '—', description: 'Exactly one of these, exactly once. The message should be words a user can act on.' },
    { name: 'task.cancel()', type: '() => void', default: '—', description: 'Stop the wire. Called when a row is removed mid-upload, and on destroy.' },
  ];
}
