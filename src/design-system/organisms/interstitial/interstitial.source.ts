import { Injectable, InjectionToken, inject, makeEnvironmentProviders } from '@angular/core';
import {
  DS_INTERSTITIAL_SOURCE,
  DS_INTERSTITIAL_STORE,
  type InterstitialItem,
  type InterstitialRecordStore,
  type InterstitialSource,
} from './interstitial.types';

/** Where the HTTP source's three endpoints live. */
export const DS_INTERSTITIAL_BASE_URL = new InjectionToken<string>('DS_INTERSTITIAL_BASE_URL', {
  factory: () => '/api/interstitials',
});

/**
 * The HTTP content source — `fetch`, and nothing else.
 *
 * | Call | Request |
 * | --- | --- |
 * | `load()` | `GET {base}` → `{ items: InterstitialItem[] }` (a bare array is accepted too) |
 * | `markSeen(id)` | `POST {base}/{id}/seen` |
 * | `markDismissed(id)` | `POST {base}/{id}/dismissed` |
 *
 * That contract is what the repo's WireMock stub serves (`mock/wiremock/`), so
 * the showcase, the Playwright suite and a real backend all speak the same three
 * calls. No `HttpClient`: the design system has no dependency on
 * `@angular/common/http`, and a content stub is not worth acquiring one.
 *
 * The reports are fire-and-forget by design: an interruption that fails to
 * record a "seen" must still close. The local store is the source of truth the
 * user feels.
 */
@Injectable()
export class HttpInterstitialSource implements InterstitialSource {
  private readonly base = inject(DS_INTERSTITIAL_BASE_URL);

  async load(): Promise<readonly InterstitialItem[]> {
    const response = await fetch(this.base, { headers: { accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`[paint] interstitial load failed: ${response.status}`);
    }
    const payload: unknown = await response.json();
    if (Array.isArray(payload)) {
      return payload as InterstitialItem[];
    }
    const items = (payload as { items?: unknown })?.items;
    return Array.isArray(items) ? (items as InterstitialItem[]) : [];
  }

  markSeen(id: string): Promise<void> {
    return this.report(id, 'seen');
  }

  markDismissed(id: string): Promise<void> {
    return this.report(id, 'dismissed');
  }

  private async report(id: string, what: 'seen' | 'dismissed'): Promise<void> {
    try {
      await fetch(`${this.base}/${encodeURIComponent(id)}/${what}`, { method: 'POST' });
    } catch {
      // Recording is best-effort: the user's experience does not wait for it.
    }
  }
}

/**
 * An offline source over a fixed catalogue — for tests, for a prototype, and for
 * the showcase when the WireMock stub is not running. Records the reports it is
 * sent so a spec can assert them.
 */
export class StaticInterstitialSource implements InterstitialSource {
  readonly seenReports: string[] = [];
  readonly dismissedReports: string[] = [];

  constructor(private readonly catalogue: readonly InterstitialItem[]) {}

  async load(): Promise<readonly InterstitialItem[]> {
    return this.catalogue;
  }

  async markSeen(id: string): Promise<void> {
    this.seenReports.push(id);
  }

  async markDismissed(id: string): Promise<void> {
    this.dismissedReports.push(id);
  }
}

/**
 * The default record store: `localStorage`, under one key, with an in-memory
 * fallback for private windows and server-side rendering.
 *
 * Dismissals are kept forever — "never comes back" is the promise — and "seen"
 * beside them, because an interruption that returns on the next navigation is a
 * bug the user cannot report politely.
 */
export class LocalInterstitialStore implements InterstitialRecordStore {
  private readonly key: string;
  private memory: { seen: string[]; dismissed: string[] } = { seen: [], dismissed: [] };

  constructor(key = 'ds-interstitial') {
    this.key = key;
    this.memory = this.read();
  }

  seen(): readonly string[] {
    return this.memory.seen;
  }

  dismissed(): readonly string[] {
    return this.memory.dismissed;
  }

  markSeen(id: string): void {
    if (!this.memory.seen.includes(id)) {
      this.memory.seen.push(id);
      this.write();
    }
  }

  markDismissed(id: string): void {
    if (!this.memory.dismissed.includes(id)) {
      this.memory.dismissed.push(id);
      this.write();
    }
  }

  clear(): void {
    this.memory = { seen: [], dismissed: [] };
    this.write();
  }

  private read(): { seen: string[]; dismissed: string[] } {
    try {
      const raw = globalThis.localStorage?.getItem(this.key);
      if (!raw) {
        return { seen: [], dismissed: [] };
      }
      const parsed = JSON.parse(raw) as { seen?: string[]; dismissed?: string[] };
      return { seen: parsed.seen ?? [], dismissed: parsed.dismissed ?? [] };
    } catch {
      return { seen: [], dismissed: [] };
    }
  }

  private write(): void {
    try {
      globalThis.localStorage?.setItem(this.key, JSON.stringify(this.memory));
    } catch {
      // No storage: the records live for this page, which is better than nothing.
    }
  }
}

/** A store that forgets everything when the page does. Handy in tests. */
export class MemoryInterstitialStore implements InterstitialRecordStore {
  private readonly seenIds: string[] = [];
  private readonly dismissedIds: string[] = [];

  seen(): readonly string[] {
    return this.seenIds;
  }

  dismissed(): readonly string[] {
    return this.dismissedIds;
  }

  markSeen(id: string): void {
    if (!this.seenIds.includes(id)) {
      this.seenIds.push(id);
    }
  }

  markDismissed(id: string): void {
    if (!this.dismissedIds.includes(id)) {
      this.dismissedIds.push(id);
    }
  }

  clear(): void {
    this.seenIds.length = 0;
    this.dismissedIds.length = 0;
  }
}

export interface InterstitialConfig {
  /** Where the content comes from. Defaults to the HTTP source. */
  readonly source?: InterstitialSource;
  /** Where "seen" and "dismissed" are remembered. Defaults to `localStorage`. */
  readonly store?: InterstitialRecordStore;
  /** Base URL of the three endpoints, when the default HTTP source is used. */
  readonly baseUrl?: string;
  /** `localStorage` key, when the default store is used. */
  readonly storageKey?: string;
}

/**
 * Wires the interstitial seam once, at the application root.
 *
 * @example
 * ```ts
 * providers: [provideInterstitials({ baseUrl: '/api/interstitials' })]
 *
 * // tests, prototypes, CI without the stub:
 * providers: [provideInterstitials({ source: new StaticInterstitialSource(ITEMS) })]
 * ```
 */
export function provideInterstitials(config: InterstitialConfig = {}) {
  return makeEnvironmentProviders([
    { provide: DS_INTERSTITIAL_BASE_URL, useValue: config.baseUrl ?? '/api/interstitials' },
    config.source
      ? { provide: DS_INTERSTITIAL_SOURCE, useValue: config.source }
      : { provide: DS_INTERSTITIAL_SOURCE, useClass: HttpInterstitialSource },
    {
      provide: DS_INTERSTITIAL_STORE,
      useFactory: () => config.store ?? new LocalInterstitialStore(config.storageKey),
    },
  ]);
}
