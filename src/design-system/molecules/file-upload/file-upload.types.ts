/**
 * The shared vocabulary of the file molecules.
 *
 * The dropzone collects and screens files; the queue item reports on one. The
 * screening rules (`matchesAccept`, `formatFileSize`) are pure and exported on
 * their own, because "which files count" is a decision an organism will want to
 * re-apply — and a unit test should not need a DataTransfer to check it.
 */

/** Why the dropzone turned a file away. */
export type FileRejectionReason = 'type' | 'size' | 'count';

/** A refused file, and the rule it broke. */
export interface FileRejection {
  readonly file: File;
  readonly reason: FileRejectionReason;
}

/** What the dropzone hands back: the files that passed, and the ones that did not. */
export interface FileDropPayload {
  readonly accepted: readonly File[];
  readonly rejected: readonly FileRejection[];
}

/** Where a queued file is in its life. */
export type FileQueueStatus = 'queued' | 'uploading' | 'success' | 'error';

/**
 * Whether `file` satisfies an `accept` expression — the same grammar as the
 * native attribute: a comma-separated list of extensions (`.csv`), exact MIME
 * types (`image/png`) and wildcard MIME types (`image/*`).
 *
 * An empty expression accepts everything, exactly as the attribute does. This
 * exists because the attribute only guards the *picker*: a dragged file never
 * saw the picker, so the dropzone has to apply the same rule itself.
 */
export function matchesAccept(file: File, accept: string): boolean {
  const rules = accept
    .split(',')
    .map((rule) => rule.trim().toLowerCase())
    .filter((rule) => rule.length > 0);

  if (rules.length === 0) {
    return true;
  }

  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  return rules.some((rule) => {
    if (rule.startsWith('.')) {
      return name.endsWith(rule);
    }
    if (rule.endsWith('/*')) {
      return type.startsWith(rule.slice(0, -1));
    }
    return type === rule;
  });
}

/**
 * Bytes, for humans: `0 B`, `18 KB`, `4.2 MB`, `1.5 GB`.
 *
 * Binary units (1024), one decimal under ten of a unit and none above — the
 * precision a person scanning an upload list actually uses.
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }

  const rounded = unit === 0 ? value : value < 10 ? Math.round(value * 10) / 10 : Math.round(value);
  return `${rounded} ${units[unit]}`;
}
