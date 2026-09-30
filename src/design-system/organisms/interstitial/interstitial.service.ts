import { Injectable, inject, signal } from '@angular/core';
import {
  DS_INTERSTITIAL_SOURCE,
  DS_INTERSTITIAL_STORE,
  eligibleItems,
  type InterstitialItem,
} from './interstitial.types';

/**
 * InterstitialService — what is there to say, and what has already been said.
 *
 * The load is one call; the rule on top of it is the whole point: an item the
 * user has seen, or has dismissed, is never offered again. The component shows
 * whatever this says is eligible, and reports back here when something is seen
 * or dismissed — so the rule lives in one place and a spec can read it without
 * rendering anything.
 *
 * @example
 * ```ts
 * private readonly interstitials = inject(InterstitialService);
 *
 * async ngOnInit() {
 *   await this.interstitials.load();   // eligible() is now the set to show
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class InterstitialService {
  private readonly source = inject(DS_INTERSTITIAL_SOURCE);
  private readonly store = inject(DS_INTERSTITIAL_STORE);

  /** Everything the last load returned, before the rule is applied. */
  readonly catalogue = signal<readonly InterstitialItem[]>([]);
  /** What the user has not seen and has not dismissed. */
  readonly eligible = signal<readonly InterstitialItem[]>([]);
  readonly loading = signal(false);
  /** The last load failed. The page carries on: an interruption is not the page. */
  readonly error = signal<string>('');

  /** Loads the catalogue and applies the rule. Returns what is eligible. */
  async load(): Promise<readonly InterstitialItem[]> {
    this.loading.set(true);
    this.error.set('');
    try {
      const items = await this.source.load();
      this.catalogue.set(items);
      this.recompute();
      return this.eligible();
    } catch (cause) {
      this.error.set(cause instanceof Error ? cause.message : String(cause));
      this.catalogue.set([]);
      this.eligible.set([]);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Uses a catalogue the host already has, and applies the rule to it — for a
   * prototype, a test, or a fallback when the content API is unreachable.
   */
  useCatalogue(items: readonly InterstitialItem[]): readonly InterstitialItem[] {
    this.catalogue.set(items);
    this.recompute();
    return this.eligible();
  }

  /** It was put in front of the user. It does not come back. */
  markSeen(id: string): void {
    this.store.markSeen(id);
    void this.source.markSeen?.(id);
    this.recompute();
  }

  /** The user said no. It never comes back. */
  markDismissed(id: string): void {
    this.store.markDismissed(id);
    void this.source.markDismissed?.(id);
    this.recompute();
  }

  /** Ids the user has seen, and ids they have dismissed — for a host that shows them. */
  readonly records = () => ({
    seen: this.store.seen(),
    dismissed: this.store.dismissed(),
  });

  /** Forgets every record. For a demo's "reset", and for nothing in production. */
  reset(): void {
    this.store.clear();
    this.recompute();
  }

  private recompute(): void {
    this.eligible.set(
      eligibleItems(this.catalogue(), this.store.seen(), this.store.dismissed()),
    );
  }
}
