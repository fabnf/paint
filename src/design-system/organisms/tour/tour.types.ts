import { InjectionToken } from '@angular/core';

/**
 * One stop on a guided walkthrough.
 *
 * A step points at *real* UI: `target` is a CSS selector resolved against the
 * live document when the step opens, not a copy of the component in a fake
 * page. A step with no target is a plain card in the middle of the screen —
 * the way a tour starts and ends.
 */
export interface TourStep<T = unknown> {
  readonly id: string;
  readonly title: string;
  /** One or two sentences. Say why the thing exists, not what it is called. */
  readonly body: string;
  /** CSS selector for the element to point at. Absent: a centred card. */
  readonly target?: string;
  /**
   * Where the step lives, when it is not on the current page. The tour asks the
   * host to go there (`navigate`) and waits for the target to exist.
   */
  readonly route?: string;
  /** A word for the layer this step is about — "Foundation", "Primitive", … */
  readonly layer?: string;
  /** Which side of the target the card prefers. `auto` picks the roomy one. */
  readonly placement?: TourPlacement;
  /** Whatever the host wants back on the outputs. */
  readonly data?: T;
}

export type TourPlacement = 'auto' | 'top' | 'bottom' | 'start' | 'end' | 'center';

/** Why the tour ended. */
export type TourEndReason = 'done' | 'skip' | 'escape' | 'api';

/** A step, and where it sits in the walkthrough. */
export interface TourStepEvent<T = unknown> {
  readonly step: TourStep<T>;
  readonly index: number;
  readonly count: number;
}

/**
 * Remembers which tours a user has finished or told to stop coming back.
 *
 * Keyed by the tour's `id`, so a product can add a second tour without
 * disturbing the first. `localStorage` by default — good enough for a
 * preference nobody will ask support about.
 */
export interface TourMemory {
  /** Has this tour been marked "don't show again"? */
  isSuppressed(tourId: string): boolean;
  suppress(tourId: string): void;
  /** Was it completed, however it ended? Hosts use it for "resume" logic. */
  isCompleted(tourId: string): boolean;
  complete(tourId: string): void;
  forget(tourId?: string): void;
}

export const DS_TOUR_MEMORY = new InjectionToken<TourMemory>('DS_TOUR_MEMORY');
