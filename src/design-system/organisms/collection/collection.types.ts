/**
 * Minimal collection helper vendored so Inbox typeahead compiles without the
 * full List/Tree organism (not yet applied to this tree).
 */

/**
 * Index of the next item whose label starts with `query`, searching from
 * `from` and wrapping — the same rule Menu already keeps.
 */
export function typeaheadIndex(
  labels: readonly string[],
  query: string,
  from: number,
): number | null {
  const needle = query.toLowerCase();
  if (!needle) {
    return null;
  }
  for (let step = 1; step <= labels.length; step++) {
    const index = (from + step) % labels.length;
    if (labels[index].toLowerCase().startsWith(needle)) {
      return index;
    }
  }
  return labels[from]?.toLowerCase().startsWith(needle) ? from : null;
}
