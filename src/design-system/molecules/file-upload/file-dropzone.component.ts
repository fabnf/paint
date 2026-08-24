import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { IconComponent } from '../../icons';
import { uniqueId } from '../../utils';
import { matchesAccept, type FileRejection } from './file-upload.types';

/**
 * FileDropzone — a place to put files.
 *
 * A real `<input type="file">` wearing a target. The input stretches across the
 * whole zone, so a click anywhere opens the picker, the keyboard story is the
 * native one (Tab to it, Enter or Space opens), and a screen reader meets a file
 * input — not a div doing an impression of one.
 *
 * Dragged files never pass through the picker, so the zone applies the same
 * rules itself: `accept`, `maxSize` and `maxFiles` are checked on every path in,
 * and every file comes out exactly once — in `filesAdded` if it passed, in
 * `filesRejected` with the rule it broke if it did not.
 *
 * The dropzone holds no list. What happens to a file after it is accepted —
 * queueing, uploading, retrying — belongs to the consumer, who renders one
 * `<ds-file-queue-item>` per file and owns the transport.
 *
 * @example
 * ```html
 * <ds-file-dropzone
 *   accept="image/*,.pdf"
 *   [maxSize]="10 * 1024 * 1024"
 *   hint="Images or PDF, up to 10 MB."
 *   (filesAdded)="queue($event)"
 *   (filesRejected)="explain($event)"
 * />
 * ```
 */
@Component({
  selector: 'ds-file-dropzone',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div
      class="ds-dropzone"
      [class.ds-dropzone--dragging]="dragging()"
      [class.ds-dropzone--disabled]="disabled()"
      (dragenter)="onDragEnter($event)"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
    >
      <!--
        The input owns the interaction: it covers the zone invisibly, so the
        pointer, the keyboard and assistive tech all talk to the native control.
      -->
      <input
        #fileInput
        type="file"
        class="ds-dropzone__input"
        [accept]="accept() || null"
        [multiple]="multiple()"
        [disabled]="disabled()"
        [attr.aria-labelledby]="labelId"
        [attr.aria-describedby]="hint() ? hintId : null"
        (change)="onPick()"
      />

      <div class="ds-dropzone__content">
        <span class="ds-dropzone__icon" aria-hidden="true">
          <ds-icon name="upload" size="lg" />
        </span>
        <span class="ds-dropzone__label" [id]="labelId">
          {{ label() }}
          <span class="ds-dropzone__browse">{{ browseLabel() }}</span>
        </span>
        @if (hint()) {
          <span class="ds-dropzone__hint" [id]="hintId">{{ hint() }}</span>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .ds-dropzone {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--ds-space-8) var(--ds-space-5);
      border: 2px dashed var(--ds-color-border-strong);
      border-radius: var(--ds-radius-lg);
      background-color: var(--ds-color-surface);
      background-image: var(--ds-texture-hatch);
      transition:
        border-color 120ms ease-out,
        background-color 120ms ease-out;
    }

    .ds-dropzone__input {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
    }

    .ds-dropzone__input:disabled {
      cursor: not-allowed;
    }

    /* The input is invisible, so the zone wears its focus ring. */
    .ds-dropzone:has(.ds-dropzone__input:focus-visible) {
      outline: 2px solid var(--ds-color-focus-ring);
      outline-offset: 2px;
    }

    .ds-dropzone--dragging {
      border-color: var(--ds-color-primary);
      background-color: var(--ds-color-primary-muted);
      background-image: none;
    }

    .ds-dropzone--disabled {
      opacity: 0.6;
    }

    .ds-dropzone__content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: var(--ds-space-1_5);
      /* Events fall through to the input underneath… above, rather. */
      pointer-events: none;
    }

    .ds-dropzone__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 3rem;
      height: 3rem;
      margin-block-end: var(--ds-space-1);
      border-radius: var(--ds-radius-full);
      background: var(--ds-color-primary-muted);
      color: var(--ds-color-primary);
    }

    .ds-dropzone--dragging .ds-dropzone__icon {
      background: var(--ds-color-surface);
    }

    .ds-dropzone__label {
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-medium);
      color: var(--ds-color-text);
    }

    .ds-dropzone__browse {
      color: var(--ds-color-primary);
      text-decoration: underline;
      text-underline-offset: 0.2em;
    }

    .ds-dropzone__hint {
      font-size: var(--ds-font-size-xs);
      color: var(--ds-color-text-muted);
    }

    @media (prefers-reduced-motion: reduce) {
      .ds-dropzone {
        transition: none;
      }
    }

    @media (forced-colors: active) {
      .ds-dropzone--dragging {
        border-style: solid;
      }
    }
  `,
})
export class FileDropzoneComponent {
  /** The invitation. */
  readonly label = input<string>('Drag and drop files here, or');
  /** The linked-looking tail of the invitation — the click is the whole zone. */
  readonly browseLabel = input<string>('browse');
  /** Formats and limits, in words. Wired to the input via aria-describedby. */
  readonly hint = input<string>('');
  /** Native accept grammar: `.csv`, `image/png`, `image/*` — comma-separated. */
  readonly accept = input<string>('');
  readonly multiple = input(true);
  readonly disabled = input(false);
  /** Per-file ceiling in bytes. `null` is no ceiling. */
  readonly maxSize = input<number | null>(null);
  /** Most files per drop. `null` is no limit; `multiple=false` means one. */
  readonly maxFiles = input<number | null>(null);

  /** The files that passed every rule. Emitted only when there are any. */
  readonly filesAdded = output<File[]>();
  /** The files that did not, each with the rule it broke. */
  readonly filesRejected = output<FileRejection[]>();

  protected readonly dragging = signal(false);
  protected readonly labelId = uniqueId('ds-dropzone-label');
  protected readonly hintId = uniqueId('ds-dropzone-hint');

  private readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  /** dragenter/dragleave fire on every child; only the outermost pair counts. */
  private dragDepth = 0;

  protected onDragEnter(event: DragEvent): void {
    event.preventDefault();
    if (this.disabled()) {
      return;
    }
    this.dragDepth++;
    this.dragging.set(true);
  }

  protected onDragOver(event: DragEvent): void {
    // Without this, the browser navigates to the file.
    event.preventDefault();
    if (!this.disabled() && event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    if (this.disabled()) {
      return;
    }
    this.dragDepth = Math.max(0, this.dragDepth - 1);
    if (this.dragDepth === 0) {
      this.dragging.set(false);
    }
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragDepth = 0;
    this.dragging.set(false);

    if (this.disabled()) {
      return;
    }

    this.screen(Array.from(event.dataTransfer?.files ?? []));
  }

  protected onPick(): void {
    const input = this.inputRef().nativeElement;
    this.screen(Array.from(input.files ?? []));
    // Clear the control, so picking the same file again still fires `change`.
    input.value = '';
  }

  /** Applies accept, size and count — in that order — and emits both verdicts. */
  private screen(files: readonly File[]): void {
    if (files.length === 0) {
      return;
    }

    const accepted: File[] = [];
    const rejected: FileRejection[] = [];
    const limit = this.multiple() ? this.maxFiles() : 1;
    const maxSize = this.maxSize();

    for (const file of files) {
      if (!matchesAccept(file, this.accept())) {
        rejected.push({ file, reason: 'type' });
      } else if (maxSize !== null && file.size > maxSize) {
        rejected.push({ file, reason: 'size' });
      } else if (limit !== null && accepted.length >= limit) {
        rejected.push({ file, reason: 'count' });
      } else {
        accepted.push(file);
      }
    }

    if (accepted.length > 0) {
      this.filesAdded.emit(accepted);
    }
    if (rejected.length > 0) {
      this.filesRejected.emit(rejected);
    }
  }
}
