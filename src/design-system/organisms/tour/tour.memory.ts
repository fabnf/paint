import { makeEnvironmentProviders } from '@angular/core';
import { DS_TOUR_MEMORY, type TourMemory } from './tour.types';

interface TourRecord {
  suppressed: string[];
  completed: string[];
}

/** `localStorage`, under one key, with an in-memory fallback. */
export class LocalTourMemory implements TourMemory {
  private record: TourRecord;

  constructor(private readonly key = 'ds-tour') {
    this.record = this.read();
  }

  isSuppressed(tourId: string): boolean {
    return this.record.suppressed.includes(tourId);
  }

  suppress(tourId: string): void {
    this.add('suppressed', tourId);
  }

  isCompleted(tourId: string): boolean {
    return this.record.completed.includes(tourId);
  }

  complete(tourId: string): void {
    this.add('completed', tourId);
  }

  forget(tourId?: string): void {
    if (!tourId) {
      this.record = { suppressed: [], completed: [] };
    } else {
      this.record = {
        suppressed: this.record.suppressed.filter((id) => id !== tourId),
        completed: this.record.completed.filter((id) => id !== tourId),
      };
    }
    this.write();
  }

  private add(bucket: keyof TourRecord, tourId: string): void {
    if (!this.record[bucket].includes(tourId)) {
      this.record[bucket] = [...this.record[bucket], tourId];
      this.write();
    }
  }

  private read(): TourRecord {
    try {
      const raw = globalThis.localStorage?.getItem(this.key);
      const parsed = raw ? (JSON.parse(raw) as Partial<TourRecord>) : {};
      return { suppressed: parsed.suppressed ?? [], completed: parsed.completed ?? [] };
    } catch {
      return { suppressed: [], completed: [] };
    }
  }

  private write(): void {
    try {
      globalThis.localStorage?.setItem(this.key, JSON.stringify(this.record));
    } catch {
      // No storage: the preference lasts for this page, which beats nothing.
    }
  }
}

/** The same, forgotten with the page. What the unit suite uses. */
export class MemoryTourMemory implements TourMemory {
  private readonly suppressed = new Set<string>();
  private readonly completed = new Set<string>();

  isSuppressed(tourId: string): boolean {
    return this.suppressed.has(tourId);
  }

  suppress(tourId: string): void {
    this.suppressed.add(tourId);
  }

  isCompleted(tourId: string): boolean {
    return this.completed.has(tourId);
  }

  complete(tourId: string): void {
    this.completed.add(tourId);
  }

  forget(tourId?: string): void {
    if (!tourId) {
      this.suppressed.clear();
      this.completed.clear();
      return;
    }
    this.suppressed.delete(tourId);
    this.completed.delete(tourId);
  }
}

/**
 * Wires the tour's memory once, at the root.
 *
 * @example
 * ```ts
 * providers: [provideTour({ storageKey: 'acme-tours' })];
 * providers: [provideTour({ memory: new MemoryTourMemory() })];   // tests
 * ```
 */
export function provideTour(config: { memory?: TourMemory; storageKey?: string } = {}) {
  return makeEnvironmentProviders([
    {
      provide: DS_TOUR_MEMORY,
      useFactory: () => config.memory ?? new LocalTourMemory(config.storageKey),
    },
  ]);
}
