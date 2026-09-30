import type { Tone } from '../../primitives/tone.types';

/** One message in a thread. The host's data, rendered as written. */
export interface InboxMessage {
  readonly id: string;
  readonly author: string;
  readonly body: string;
  /** ISO, or anything `Date` accepts. Shown as the host's `formatTime` says. */
  readonly sentAt: string;
}

/**
 * One conversation.
 *
 * A thread is *not* a {@link CollectionItem}: it has participants, a preview, a
 * time and an unread flag, and a list row has none of those. Sharing the density
 * tokens, the empty state and the Drawer is worth it; pretending a conversation
 * is a tree node is not.
 */
export interface InboxThread<T = unknown> {
  readonly id: string;
  readonly subject: string;
  /** Names. Drawn as avatars, and spoken as the thread's company. */
  readonly participants: readonly string[];
  /** The first line of the latest message. */
  readonly preview: string;
  /** When the latest message arrived. */
  readonly time: string;
  readonly unread?: boolean;
  /** Short words: "Billing", "Escalated". */
  readonly labels?: readonly string[];
  readonly labelTone?: Tone;
  /** How many messages are in it. */
  readonly count?: number;
  /** Visible, reachable by the arrows, not openable. */
  readonly disabled?: boolean;
  /** The conversation itself, when the host has it. */
  readonly messages?: readonly InboxMessage[];
  readonly data?: T;
}

/** A thread, and where it sat in the list. */
export interface InboxThreadEvent<T = unknown> {
  readonly thread: InboxThread<T>;
  readonly index: number;
}

/** What the host is asked to send. The organism never owns a transport. */
export interface InboxReply<T = unknown> {
  readonly thread: InboxThread<T>;
  readonly body: string;
}

/** Read state the host is asked to change. */
export interface InboxReadChange<T = unknown> {
  readonly threadIds: readonly string[];
  readonly read: boolean;
  readonly threads: readonly InboxThread<T>[];
}