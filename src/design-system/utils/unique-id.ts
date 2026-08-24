/**
 * Stable, collision-free ids for ARIA wiring.
 *
 * Components that point `aria-labelledby` / `aria-controls` at their own markup
 * need an id that is unique per instance and identical on every render.
 */

let counter = 0;

export function uniqueId(prefix: string): string {
  return `${prefix}-${++counter}`;
}
