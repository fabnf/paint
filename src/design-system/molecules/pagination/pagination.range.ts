/** A page number, or the gap where the pages nobody asked for used to be. */
export type PaginationSlot = number | 'start-ellipsis' | 'end-ellipsis';

export interface PaginationRangeOptions {
  /** The current page, 1-based. */
  page: number;
  pageCount: number;
  /** Pages either side of the current one. */
  siblingCount?: number;
  /** Pages pinned at each end. */
  boundaryCount?: number;
}

const range = (start: number, end: number): number[] =>
  Array.from({ length: Math.max(end - start + 1, 0) }, (_, index) => start + index);

/**
 * Which page buttons to draw.
 *
 * The width of the control must not change as the user pages through it: a
 * button that moves out from under the cursor between clicks is a button that
 * gets clicked twice. So the count of slots is constant — `boundaryCount` at each
 * end, `siblingCount` either side of the current page, and a gap where the rest
 * went — and an ellipsis is only drawn where it replaces *more than one* page.
 * Replacing a single page with a "…" would be wider than the page it hid.
 *
 * @example
 * ```ts
 * paginationRange({ page: 1, pageCount: 10 });
 * // [1, 2, 'end-ellipsis', 10]
 * paginationRange({ page: 6, pageCount: 10 });
 * // [1, 'start-ellipsis', 5, 6, 7, 'end-ellipsis', 10]
 * ```
 */
export function paginationRange({
  page,
  pageCount,
  siblingCount = 1,
  boundaryCount = 1,
}: PaginationRangeOptions): PaginationSlot[] {
  if (pageCount <= 0) {
    return [];
  }

  const boundary = Math.max(0, boundaryCount);
  const siblings = Math.max(0, siblingCount);
  const current = Math.min(Math.max(page, 1), pageCount);

  const startPages = range(1, Math.min(boundary, pageCount));
  const endPages = range(Math.max(pageCount - boundary + 1, boundary + 1), pageCount);

  // The window around the current page, pushed off the boundaries so the slot
  // count never changes as it travels.
  const siblingsStart = Math.max(
    Math.min(current - siblings, pageCount - boundary - siblings * 2 - 1),
    boundary + 2,
  );

  const siblingsEnd = Math.min(
    Math.max(current + siblings, boundary + siblings * 2 + 2),
    endPages.length > 0 ? endPages[0] - 2 : pageCount - 1,
  );

  return [
    ...startPages,

    // An ellipsis is only worth it when it hides more than one page.
    ...(siblingsStart > boundary + 2
      ? (['start-ellipsis'] as PaginationSlot[])
      : boundary + 1 < pageCount - boundary
        ? [boundary + 1]
        : []),

    ...range(siblingsStart, siblingsEnd),

    ...(siblingsEnd < pageCount - boundary - 1
      ? (['end-ellipsis'] as PaginationSlot[])
      : pageCount - boundary > boundary
        ? [pageCount - boundary]
        : []),

    ...endPages,
  ];
}

/** `1` for an empty list: there is always a page, it just has nothing on it. */
export function pageCountOf(total: number, pageSize: number): number {
  if (pageSize <= 0) {
    return 1;
  }
  return Math.max(1, Math.ceil(total / pageSize));
}

/** The 1-based range of items on a page, clamped to what exists: `[41, 50]`. */
export function pageBounds(page: number, pageSize: number, total: number): [number, number] {
  if (total <= 0 || pageSize <= 0) {
    return [0, 0];
  }
  const first = (page - 1) * pageSize + 1;
  return [Math.min(first, total), Math.min(page * pageSize, total)];
}
