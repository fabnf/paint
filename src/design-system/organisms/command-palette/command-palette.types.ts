import type { IconName } from '../../icons';

/**
 * One entry in the palette: a command, a link, or an entity — the same row
 * either way. What *kind* of row it is falls out of which fields are set:
 * `run` executes, `link` navigates the router, `href` leaves the app. An
 * entity ("Invoice INV-204") is just a link or command wearing a noun.
 */
export interface CommandPaletteItem {
  readonly id: string;
  readonly label: string;
  readonly icon?: IconName;
  /** Second line: the path, the owner, the consequence. */
  readonly description?: string;
  /** Section header. Items sharing a group render under one label. */
  readonly group?: string;
  /** Terms the filter matches besides the visible words ("bill", "€"). */
  readonly keywords?: readonly string[];
  /** Display-only shortcut hint, e.g. `⌘D`. The palette binds nothing. */
  readonly shortcut?: string;
  /** Router target — the palette navigates, then closes. */
  readonly link?: string | readonly string[];
  /** External URL — opened in a new tab, `noopener`. */
  readonly href?: string;
  /** The command body — called on selection, before the palette closes. */
  readonly run?: () => void;
  readonly disabled?: boolean;
}

/**
 * How well `query` matches an item. `0` is "not at all"; ties keep input
 * order, so a consumer's own ranking survives equal scores.
 *
 * Deliberately not fuzzy: prefix and word-boundary matches are predictable
 * under a flying keyboard, and a palette is used at typing speed. Keywords
 * exist for the synonyms fuzziness would otherwise be excused by.
 */
export function scoreCommand(query: string, item: CommandPaletteItem): number {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return 1;
  }

  const label = item.label.toLowerCase();
  if (label.startsWith(needle)) {
    return 100;
  }
  if (label.includes(` ${needle}`)) {
    return 80;
  }
  if (label.includes(needle)) {
    return 60;
  }

  for (const keyword of item.keywords ?? []) {
    const candidate = keyword.toLowerCase();
    if (candidate.startsWith(needle)) {
      return 50;
    }
    if (candidate.includes(needle)) {
      return 40;
    }
  }

  if (item.group?.toLowerCase().includes(needle)) {
    return 25;
  }
  if (item.description?.toLowerCase().includes(needle)) {
    return 20;
  }

  return 0;
}

/** The matching items, best first, ties in input order, capped at `limit`. */
export function filterCommands(
  query: string,
  items: readonly CommandPaletteItem[],
  limit = 50,
): CommandPaletteItem[] {
  return items
    .map((item, index) => ({ item, index, score: scoreCommand(query, item) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.item);
}
