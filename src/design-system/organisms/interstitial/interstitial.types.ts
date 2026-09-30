import { InjectionToken } from '@angular/core';

/**
 * One interruption: what the product wants to say to *this* user, once.
 *
 * The shape is deliberately small and transport-agnostic — it is what a content
 * API returns, not what a component renders. `id` is the identity the "seen" and
 * "dismissed" records are keyed on, so it has to be stable across deploys.
 */
export interface InterstitialItem<T = unknown> {
  readonly id: string;
  readonly title: string;
  /** One or two sentences. Plain text: an interruption is not a newsletter. */
  readonly body?: string;
  /** A picture above the words. */
  readonly imageSrc?: string;
  /** What the picture shows. Empty (or absent) makes it decoration. */
  readonly imageAlt?: string;
  /** Where "learn more" goes, out of the app. */
  readonly learnMoreHref?: string;
  /** Where "learn more" goes, in the app. */
  readonly learnMoreLink?: string | readonly unknown[];
  readonly learnMoreLabel?: string;
  /** Whatever the host needs back on the outputs. */
  readonly data?: T;
}

/** Why the interstitial closed. */
export type InterstitialCloseReason = 'dismiss' | 'learn-more' | 'escape' | 'done' | 'api';

/** An item, and why something happened to it. */
export interface InterstitialItemEvent<T = unknown> {
  readonly item: InterstitialItem<T>;
  readonly index: number;
}

/**
 * The content seam.
 *
 * The organism never owns the wire. A host provides a source — in production an
 * HTTP one pointed at its own API, in the showcase and in CI the WireMock stub
 * or the offline double — and the organism only ever asks it three things:
 * what is there, this one was seen, this one was dismissed.
 *
 * `markSeen` / `markDismissed` are optional: a product whose eligibility lives
 * entirely client-side (the local store below) needs neither.
 */
export interface InterstitialSource {
  /** Everything the current user *could* be shown. Eligibility is applied on top. */
  load(): Promise<readonly InterstitialItem[]>;
  /** Report that an item was put in front of the user. */
  markSeen?(id: string): Promise<void>;
  /** Report that the user dismissed it. It must never come back. */
  markDismissed?(id: string): Promise<void>;
}

export const DS_INTERSTITIAL_SOURCE = new InjectionToken<InterstitialSource>(
  'DS_INTERSTITIAL_SOURCE',
);

/** Where "seen" and "dismissed" are remembered between loads. */
export interface InterstitialRecordStore {
  seen(): readonly string[];
  dismissed(): readonly string[];
  markSeen(id: string): void;
  markDismissed(id: string): void;
  clear(): void;
}

export const DS_INTERSTITIAL_STORE = new InjectionToken<InterstitialRecordStore>(
  'DS_INTERSTITIAL_STORE',
);

/**
 * The eligibility rule, in one function, so it can be read and tested without a
 * component or a network: an item is eligible when it has not been seen and has
 * not been dismissed. Dismissal is the stronger of the two and is permanent;
 * "seen" is what a `learn more` also counts as.
 */
export function eligibleItems(
  items: readonly InterstitialItem[],
  seen: readonly string[],
  dismissed: readonly string[],
): readonly InterstitialItem[] {
  const blocked = new Set([...seen, ...dismissed]);
  return items.filter((item) => !blocked.has(item.id));
}
