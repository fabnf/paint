import type { FileQueueStatus } from '../../molecules/file-upload';

/**
 * The uploader's transport contract.
 *
 * The organism owns the queue — what is uploading, what failed, what the user
 * cancelled. It refuses to own the wire: where the bytes go, with what headers,
 * retried how, is the product's business. An adapter is one function and one
 * handle, so a product can write it in ten lines:
 *
 * ```ts
 * // Over Angular's HttpClient:
 * const httpAdapter = (http: HttpClient): UploadAdapter => ({
 *   upload(file, report) {
 *     const sub = http
 *       .post('/api/files', file, { reportProgress: true, observe: 'events' })
 *       .subscribe({
 *         next: (event) => {
 *           if (event.type === HttpEventType.UploadProgress && event.total) {
 *             report.progress(Math.round((100 * event.loaded) / event.total));
 *           }
 *           if (event.type === HttpEventType.Response) {
 *             report.done();
 *           }
 *         },
 *         error: () => report.fail('The server refused the file.'),
 *       });
 *     return { cancel: () => sub.unsubscribe() };
 *   },
 * });
 * ```
 *
 * Callbacks rather than an Observable, so the design system keeps its record of
 * zero rxjs imports — and so a test can drive an upload by calling three
 * functions instead of scheduling marbles.
 */
export interface UploadAdapter {
  /** Starts one file. Must return synchronously; report everything else. */
  upload(file: File, report: UploadReport): UploadTask;
}

/** How a running upload talks back. Call `done` or `fail` exactly once. */
export interface UploadReport {
  /** 0–100. Optional: a transport with no progress just never calls it. */
  progress(percent: number): void;
  done(): void;
  /** `message` in words a user can act on; the row falls back to plain ones. */
  fail(message?: string): void;
}

/** The handle the organism keeps so "remove" can mean "stop". */
export interface UploadTask {
  cancel(): void;
}

/** One file in the uploader's queue, as reported to the outside. */
export interface UploadQueueItem {
  /** Stable per file across retries. */
  readonly id: number;
  readonly file: File;
  readonly status: FileQueueStatus;
  /** 0–100, meaningful while uploading. */
  readonly progress: number;
  /** The adapter's words, when it failed. */
  readonly error: string;
}

export interface SimulatedUploadOptions {
  /** Milliseconds between progress ticks. */
  tickMs?: number;
  /** Progress per tick, 0–100. */
  increment?: number;
  /**
   * Decide failure per attempt: return the error message, or `null` to let it
   * through. `attempt` starts at 1 and counts retries of the same file, so a
   * demo can fail once and succeed on retry.
   */
  failOn?: (file: File, attempt: number) => string | null;
}

/**
 * The stub transport: ticks to 100 on a timer, fails on request.
 *
 * For showcases, prototypes and tests — anything that needs an uploader before
 * it has a server. Cancellation works the way the real thing must: the timer
 * stops and nothing reports afterwards.
 */
export function simulatedUploadAdapter(options: SimulatedUploadOptions = {}): UploadAdapter {
  const { tickMs = 150, increment = 10, failOn = () => null } = options;
  const attempts = new WeakMap<File, number>();

  return {
    upload(file, report) {
      const attempt = (attempts.get(file) ?? 0) + 1;
      attempts.set(file, attempt);
      const failure = failOn(file, attempt);

      let percent = 0;
      const timer = setInterval(() => {
        percent = Math.min(100, percent + increment);

        // A failure that happens at 0% looks like it never started; let the
        // bar get somewhere before the bad news, the way networks do.
        if (failure !== null && percent >= 60) {
          clearInterval(timer);
          report.fail(failure);
          return;
        }

        if (percent >= 100) {
          clearInterval(timer);
          report.done();
          return;
        }

        report.progress(percent);
      }, tickMs);

      return { cancel: () => clearInterval(timer) };
    },
  };
}
