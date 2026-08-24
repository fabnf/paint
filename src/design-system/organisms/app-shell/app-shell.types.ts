import type { IconName } from '../../icons';

/** One link in the sidebar. The host's routing, the shell's paint. */
export interface ShellNavItem {
  readonly label: string;
  /** Router path — handed to `[routerLink]`. */
  readonly path: string;
  readonly icon: IconName;
  /** A small loud word: "New", "3", "Beta". */
  readonly badge?: string;
}

/** A group of links, rendered as one section in the sidebar. */
export interface ShellNavSection {
  readonly title: string;
  readonly caption?: string;
  readonly items: readonly ShellNavItem[];
}

/** Who is signed in — the avatar + the user-menu trigger. */
export interface ShellUser {
  readonly name: string;
  /** URL or omitted (the avatar falls back to initials). */
  readonly avatarSrc?: string;
  readonly email?: string;
}
