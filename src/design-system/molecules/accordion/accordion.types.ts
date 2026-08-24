import { InjectionToken, type Signal } from '@angular/core';

/** Where the chevron sits relative to the label. */
export type AccordionIconPosition = 'start' | 'end';

/**
 * How the items are separated.
 *
 * - `bordered` — one box, hairlines between the items.
 * - `separated` — a card per item, with space between them.
 * - `flush` — rules only, for a list that is already inside a panel.
 */
export type AccordionVariant = 'bordered' | 'separated' | 'flush';

/**
 * The level of the real heading each header is wrapped in.
 *
 * Per the ARIA authoring practices, an accordion header *is* a heading. Which
 * level depends on what is above it, and only the page knows that.
 */
export type AccordionHeadingLevel = 2 | 3 | 4 | 5 | 6;

/**
 * The contract between an accordion and the items inside it.
 *
 * An item does not import the accordion: it asks, optionally, whether one is
 * there. Alone, it is a disclosure and owns its own `expanded` state — which is
 * the whole difference between the two patterns.
 */
export interface AccordionContext {
  readonly multiple: Signal<boolean>;
  readonly iconPosition: Signal<AccordionIconPosition>;
  readonly headingLevel: Signal<AccordionHeadingLevel>;
  readonly variant: Signal<AccordionVariant>;
  readonly disabled: Signal<boolean>;

  isExpanded(id: string): boolean;
  toggle(id: string): void;
  /** Moves focus to another item's header. `delta` of `0` means first, `-0` last. */
  focusSibling(id: string, move: 'next' | 'previous' | 'first' | 'last'): void;
}

/** Present only inside a `<ds-accordion>`. Always inject it `{ optional: true }`. */
export const DS_ACCORDION = new InjectionToken<AccordionContext>('DS_ACCORDION');
