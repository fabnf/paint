import type { IconName } from '../../icons';

/** A selectable row in a {@link MenuComponent}. */
export interface MenuItemOption {
  /** Returned by `(itemSelect)`. */
  id: string;
  label: string;
  icon?: IconName;
  /** Second line, for items that need a hint. */
  description?: string;
  /** Right-aligned hint, e.g. `⌘K`. Display only — Menu binds no shortcuts. */
  shortcut?: string;
  /**
   * Machine-readable form of `shortcut` for `aria-keyshortcuts`,
   * e.g. `'Meta+D'`. The visual hint is hidden from assistive tech, because
   * "⌘D" does not read as a key combination.
   */
  keyShortcuts?: string;
  disabled?: boolean;
  /** Paints the item in the danger role. Destructive actions only. */
  destructive?: boolean;
}

/** A labelled section break. */
export interface MenuHeader {
  type: 'header';
  label: string;
}

/** A hairline between groups. */
export interface MenuDivider {
  type: 'divider';
}

export type MenuEntry = MenuItemOption | MenuHeader | MenuDivider;

export function isMenuItem(entry: MenuEntry): entry is MenuItemOption {
  return !('type' in entry);
}

export function isMenuHeader(entry: MenuEntry): entry is MenuHeader {
  return 'type' in entry && entry.type === 'header';
}

export function isMenuDivider(entry: MenuEntry): entry is MenuDivider {
  return 'type' in entry && entry.type === 'divider';
}
