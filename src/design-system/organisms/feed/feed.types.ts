import type { IconName } from '../../icons';
import type { Tone } from '../../primitives/tone.types';

/**
 * One event in a feed — an activity row, a notification, a release note.
 * The same shape either way: what happened, when, whether it has been seen.
 *
 * The host owns the items. The feed never mutates one: marking read is an
 * *output*, and the host flips the flag in its own data — the chip's bargain,
 * the alert's bargain, the queue row's bargain, again.
 */
export interface FeedItem<T = unknown> {
  readonly id: string;
  /** What happened, in a sentence: "Ada commented on Mural". */
  readonly title: string;
  /** The quieter second line: an excerpt, a consequence, a version. */
  readonly description?: string;
  /** When, as an ISO datetime. Shown relative, spoken absolute. */
  readonly timestamp: string;
  /** The node's glyph. Omitted, the feed draws a plain dot. */
  readonly icon?: IconName;
  /** Who did it — rendered as a `ds-avatar` instead of the icon tile. */
  readonly actor?: string;
  /** What kind of event: the node's tint. Most events are `neutral`. */
  readonly tone?: Tone;
  /** Not seen yet. Drives the dot, the weight, and the mark-read affordance. */
  readonly unread?: boolean;
  /** Whatever the host's body template or detail view needs. */
  readonly data?: T;
}

/** How a feed is laid: a rail of moments, or a row of milestones. */
export type FeedOrientation = 'vertical' | 'horizontal';

/** The unread total — the bell's badge, in one call. */
export function countUnread(items: readonly FeedItem[]): number {
  return items.reduce((total, item) => total + (item.unread ? 1 : 0), 0);
}

/**
 * "just now", "5m ago", "2h ago", "3d ago" — then it is a date.
 *
 * Relative time is a courtesy with a shelf life: past a week, "9d ago" makes
 * the reader do arithmetic a date would have spared them. Pure, with an
 * injectable clock, because a feed that cannot be tested at a fixed moment
 * cannot be tested at all.
 */
export function relativeTime(iso: string, now: Date = new Date(), locale = 'en-GB'): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) {
    return iso;
  }

  const seconds = Math.round((now.getTime() - then.getTime()) / 1000);
  if (seconds < 60) {
    return 'just now';
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(
    then,
  );
}

/** The absolute moment, for the tooltip and the screen reader. */
export function absoluteTime(iso: string, locale = 'en-GB'): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(then);
}
