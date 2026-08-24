import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IconComponent, type IconName } from '../../icons';
import { ButtonComponent } from '../../primitives/button';
import { ProgressComponent } from '../../primitives/progress';
import { formatFileSize, type FileQueueStatus } from './file-upload.types';

/**
 * FileQueueItem — one file, and how it is doing.
 *
 * The row a multi-file uploader renders once per file: name, size, a progress
 * bar while uploading, a plain-words error when it fails, and the two verbs that
 * belong to a row — remove, and (after a failure) retry. Every button is named
 * after its file, because "Remove" ten times over is no name at all.
 *
 * Deliberately stateless about the upload itself: the consumer owns the
 * transport and the list. This row only reports `status` and `progress`, and
 * emits `remove` / `retry` without acting on them — the same bargain as
 * `<ds-chip>`: a component that deletes its own DOM node cannot be undone.
 *
 * A failure announces itself (`role="status"`, politely): in a long queue the
 * row that broke is rarely the row on screen.
 *
 * @example
 * ```html
 * <ul class="uploads">
 *   @for (upload of uploads(); track upload.id) {
 *     <li>
 *       <ds-file-queue-item
 *         [name]="upload.file.name"
 *         [size]="upload.file.size"
 *         [status]="upload.status"
 *         [progress]="upload.progress"
 *         [error]="upload.error"
 *         (remove)="cancel(upload)"
 *         (retry)="restart(upload)"
 *       />
 *     </li>
 *   }
 * </ul>
 * ```
 */
@Component({
  selector: 'ds-file-queue-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, ButtonComponent, ProgressComponent],
  template: `
    <div
      class="ds-file-item"
      [class.ds-file-item--error]="status() === 'error'"
      [class.ds-file-item--success]="status() === 'success'"
    >
      <!-- Decoration: the status text says the same thing, in words. -->
      <span class="ds-file-item__icon" aria-hidden="true">
        <ds-icon [name]="statusIcon()" size="md" />
      </span>

      <div class="ds-file-item__body">
        <div class="ds-file-item__row">
          <span class="ds-file-item__name" [title]="name()">{{ name() }}</span>
          <span class="ds-file-item__meta">
            @if (sizeLabel()) {
              <span>{{ sizeLabel() }}</span>
            }
            <span
              class="ds-file-item__status"
              [class.ds-file-item__status--success]="status() === 'success'"
            >
              {{ statusLabel() }}
            </span>
          </span>
        </div>

        @if (status() === 'uploading') {
          <ds-progress
            size="sm"
            [value]="progress()"
            [ariaLabel]="'Uploading ' + name()"
            [hideLabel]="true"
          />
        }

        @if (status() === 'error') {
          <!-- Announced politely when it appears: the broken row is rarely on screen. -->
          <p class="ds-file-item__error" role="status">{{ errorLabel() }}</p>
        }
      </div>

      <div class="ds-file-item__actions">
        @if (status() === 'error' && retryable()) {
          <ds-button
            variant="ghost"
            size="sm"
            iconStart="refresh"
            [label]="retryLabel() || 'Retry uploading ' + name()"
            (clicked)="retry.emit()"
          />
        }
        @if (removable()) {
          <ds-button
            variant="ghost"
            size="sm"
            iconStart="close"
            [label]="removeLabel() || removeVerb() + ' ' + name()"
            (clicked)="remove.emit()"
          />
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .ds-file-item {
      display: flex;
      align-items: flex-start;
      gap: var(--ds-space-3);
      padding: var(--ds-space-3) var(--ds-space-3_5);
      border: 1px solid var(--ds-color-border);
      border-radius: var(--ds-radius-lg);
      background: var(--ds-color-surface);
    }

    .ds-file-item--error {
      border-color: color-mix(in srgb, var(--ds-color-danger) 45%, transparent);
      background: color-mix(in srgb, var(--ds-color-danger-muted) 40%, var(--ds-color-surface));
    }

    .ds-file-item__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      flex-shrink: 0;
      border-radius: var(--ds-radius-md);
      background: var(--ds-color-surface-sunken);
      color: var(--ds-color-text-subtle);
    }

    .ds-file-item--success .ds-file-item__icon {
      background: var(--ds-color-success-muted);
      color: var(--ds-color-success);
    }

    .ds-file-item--error .ds-file-item__icon {
      background: var(--ds-color-danger-muted);
      color: var(--ds-color-danger);
    }

    .ds-file-item__body {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-1_5);
      flex: 1 1 auto;
      min-width: 0;
      /* Optical alignment with the icon block. */
      padding-block-start: var(--ds-space-0_5);
    }

    .ds-file-item__row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--ds-space-3);
      min-width: 0;
    }

    .ds-file-item__name {
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-medium);
      color: var(--ds-color-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }

    .ds-file-item__meta {
      display: inline-flex;
      align-items: baseline;
      gap: var(--ds-space-2);
      flex-shrink: 0;
      font-size: var(--ds-font-size-xs);
      font-variant-numeric: tabular-nums;
      color: var(--ds-color-text-muted);
    }

    .ds-file-item__status--success {
      color: var(--ds-color-success);
      font-weight: var(--ds-font-weight-medium);
    }

    .ds-file-item__error {
      margin: 0;
      font-size: var(--ds-font-size-xs);
      color: var(--ds-color-danger);
    }

    .ds-file-item__actions {
      display: flex;
      align-items: center;
      gap: var(--ds-space-1);
      flex-shrink: 0;
      /* Pull the ghost buttons into the padding, like the Alert's dismiss. */
      margin-block-start: calc(var(--ds-space-1) * -1);
      margin-inline-end: calc(var(--ds-space-1) * -1);
    }

    @media (forced-colors: active) {
      .ds-file-item {
        border-color: currentcolor;
      }
    }
  `,
})
export class FileQueueItemComponent {
  /** The file's name, shown and used to name every button in the row. */
  readonly name = input.required<string>();
  /** Size in bytes. Formatted for humans; `null` shows nothing. */
  readonly size = input<number | null>(null);
  readonly status = input<FileQueueStatus>('queued');
  /** 0–100, read while `status` is `uploading`. */
  readonly progress = input(0);
  /** What went wrong, in words a user can act on. */
  readonly error = input<string>('');
  /** The remove / cancel button. On by default: a queue the user cannot edit is a trap. */
  readonly removable = input(true);
  /** The retry button, shown only in the error state. */
  readonly retryable = input(true);
  /** Overrides the remove button's accessible name (default names the file). */
  readonly removeLabel = input<string>('');
  /** Overrides the retry button's accessible name (default names the file). */
  readonly retryLabel = input<string>('');

  /** The remove (or, mid-upload, cancel) button was pressed. The row does not remove itself. */
  readonly remove = output<void>();
  /** The retry button was pressed. The row does not restart anything. */
  readonly retry = output<void>();

  protected readonly sizeLabel = computed(() => {
    const size = this.size();
    return size === null ? '' : formatFileSize(size);
  });

  protected readonly statusIcon = computed<IconName>(() => {
    switch (this.status()) {
      case 'success':
        return 'success';
      case 'error':
        return 'warning';
      default:
        return 'file';
    }
  });

  protected readonly statusLabel = computed(() => {
    switch (this.status()) {
      case 'queued':
        return 'Queued';
      case 'uploading':
        return `${Math.min(100, Math.max(0, Math.round(this.progress())))}%`;
      case 'success':
        return 'Uploaded';
      case 'error':
        return 'Failed';
    }
  });

  protected readonly errorLabel = computed(() => this.error() || 'Upload failed.');

  /** Mid-upload, the same button means "stop", and should say so. */
  protected readonly removeVerb = computed(() =>
    this.status() === 'uploading' ? 'Cancel uploading' : 'Remove',
  );
}
