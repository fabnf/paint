import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  forwardRef,
  input,
  model,
  output,
} from '@angular/core';
import { cx } from '../../primitives/primitives.types';
import { AccordionItemComponent } from './accordion-item.component';
import {
  DS_ACCORDION,
  type AccordionContext,
  type AccordionHeadingLevel,
  type AccordionIconPosition,
  type AccordionVariant,
} from './accordion.types';

/**
 * Accordion — a set of disclosures that know about each other.
 *
 * One open at a time, or as many as you like. The items are `<ds-accordion-item>`s
 * and do not import this component; they ask, through DI, whether an accordion is
 * there. One on its own is a disclosure, and that is not a different component.
 *
 * The expansion state is a list of ids, not indexes — a panel that opens because
 * the list above it was re-sorted is a bug that takes a fortnight to find.
 *
 * Keyboard, per the ARIA authoring practices: `Enter` and `Space` on a header
 * (the button's own), `↑` `↓` between headers, `Home` and `End` to the ends. Tab
 * reaches each header, because a header is not a tab stop you can skip past —
 * it is where the content is.
 *
 * @example
 * ```html
 * <ds-accordion [(expanded)]="open" variant="separated">
 *   <ds-accordion-item itemId="profile" label="Profile" icon="user">…</ds-accordion-item>
 *   <ds-accordion-item itemId="billing" label="Billing" [badge]="2" badgeLabel="2 issues">…</ds-accordion-item>
 * </ds-accordion>
 *
 * <!-- Several at once -->
 * <ds-accordion [multiple]="true" [expanded]="['profile', 'billing']">…</ds-accordion>
 * ```
 */
@Component({
  selector: 'ds-accordion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: DS_ACCORDION,
      useExisting: forwardRef(() => AccordionComponent),
    },
  ],
  host: {
    '[class]': 'classes()',
  },
  template: `<ng-content />`,
  styles: `
    :host {
      display: block;
    }

    /* One box; the items draw the hairlines between themselves. */
    :host(.ds-accordion--bordered) {
      border: 1px solid var(--ds-color-border);
      border-radius: var(--ds-radius-lg);
      background-color: var(--ds-color-surface);
      overflow: hidden;
    }

    /* A card per item. */
    :host(.ds-accordion--separated) {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-3);
    }
  `,
})
export class AccordionComponent implements AccordionContext {
  /** Several panels open at once. The default is one, like a filing cabinet. */
  readonly multiple = input(false);
  /**
   * In single mode, can the open panel be closed by clicking its header?
   *
   * `false` when the accordion is the page's only content and closing everything
   * would leave a blank screen.
   */
  readonly collapsible = input(true);
  /** The open items, by id. Two-way bindable. */
  readonly expanded = model<readonly string[]>([]);
  readonly variant = input<AccordionVariant>('bordered');
  readonly iconPosition = input<AccordionIconPosition>('end');
  /** The level of the real heading each header is wrapped in. */
  readonly headingLevel = input<AccordionHeadingLevel>(3);
  readonly disabled = input(false);

  /** Emits the id that was opened or closed, and whether it is now open. */
  readonly itemToggled = output<{ id: string; expanded: boolean }>();

  private readonly items = contentChildren(AccordionItemComponent);

  protected readonly classes = computed(() =>
    cx('ds-accordion', `ds-accordion--${this.variant()}`),
  );

  isExpanded(id: string): boolean {
    return this.expanded().includes(id);
  }

  toggle(id: string): void {
    const open = this.isExpanded(id);

    if (open && !this.multiple() && !this.collapsible()) {
      return;
    }

    const next = open
      ? this.expanded().filter((item) => item !== id)
      : this.multiple()
        ? [...this.expanded(), id]
        : [id];

    this.expanded.set(next);
    this.itemToggled.emit({ id, expanded: !open });
  }

  /** Arrow keys walk the *headers*, skipping nothing: a disabled header is still a heading. */
  focusSibling(id: string, move: 'next' | 'previous' | 'first' | 'last'): void {
    const items = this.items();
    if (items.length === 0) {
      return;
    }

    const current = items.findIndex((item) => item.id === id);
    const last = items.length - 1;

    const index =
      move === 'first'
        ? 0
        : move === 'last'
          ? last
          : move === 'next'
            ? (current + 1) % items.length
            : (current - 1 + items.length) % items.length;

    items[index].focusHeader();
  }
}
