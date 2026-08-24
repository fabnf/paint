import type { IconName } from '../../icons';

/** One step on the path to here. */
export interface BreadcrumbItem {
  label: string;
  /** In-app destination, driven by the router. */
  link?: string | unknown[];
  /** Cross-document destination. */
  href?: string;
  icon?: IconName;
  /**
   * The accessible name, when the label is an icon or an abbreviation.
   * A breadcrumb of icons is a breadcrumb nobody can read out loud.
   */
  ariaLabel?: string;
}

/** A rendered crumb, or the button that stands for the ones left out. */
export type BreadcrumbSlot =
  | { kind: 'item'; item: BreadcrumbItem; index: number; current: boolean }
  | { kind: 'ellipsis'; hidden: number };

/**
 * Chooses which crumbs to show.
 *
 * A path of nine folders does not fit, and the two that matter are the first and
 * the last. Everything between them collapses into one button that says how many
 * it is hiding — never into a silent "…".
 */
export function collapseBreadcrumbs(
  items: readonly BreadcrumbItem[],
  maxItems: number,
  itemsBeforeCollapse: number,
  itemsAfterCollapse: number,
): BreadcrumbSlot[] {
  const last = items.length - 1;
  const all = (): BreadcrumbSlot[] =>
    items.map((item, index) => ({ kind: 'item', item, index, current: index === last }));

  if (maxItems <= 0 || items.length <= maxItems) {
    return all();
  }

  const before = Math.max(0, itemsBeforeCollapse);
  const after = Math.max(1, itemsAfterCollapse);

  // Collapsing has to save at least two crumbs, or the button is the crowd.
  if (before + after >= items.length - 1) {
    return all();
  }

  const head: BreadcrumbSlot[] = items
    .slice(0, before)
    .map((item, index) => ({ kind: 'item', item, index, current: false }));

  const tail: BreadcrumbSlot[] = items
    .slice(items.length - after)
    .map((item, offset) => {
      const index = items.length - after + offset;
      return { kind: 'item', item, index, current: index === last };
    });

  return [...head, { kind: 'ellipsis', hidden: items.length - before - after }, ...tail];
}
