import { Directive, TemplateRef, input } from '@angular/core';
import type { FeedItem } from './feed.types';

/** The body template's context: the item, as `let-item`. */
export interface FeedBodyContext<T = unknown> {
  $implicit: FeedItem<T>;
}

/**
 * Marks the host-owned body rendered inside each entry of a
 * {@link FeedComponent} — a quoted comment, a diff stat, a release note.
 * The feed owns the rail, the node, the title and the clock; the body is the
 * host's. Bind `[dsFeedBodyItems]` to the same array the feed gets and
 * `let-item` is fully typed — the DataTable's `dsCellRows` bargain again.
 *
 * @example
 * ```html
 * <ds-feed [items]="activity">
 *   <ng-template dsFeedBody [dsFeedBodyItems]="activity" let-item>
 *     <blockquote>{{ item.data.quote }}</blockquote>
 *   </ng-template>
 * </ds-feed>
 * ```
 */
@Directive({
  selector: 'ng-template[dsFeedBody]',
  standalone: true,
})
export class FeedBodyDirective<T = unknown> {
  /** Inference only: binds `T` so `let-item` is typed. Never read. */
  readonly dsFeedBodyItems = input<readonly FeedItem<T>[]>();

  constructor(readonly template: TemplateRef<FeedBodyContext<T>>) {}

  static ngTemplateContextGuard<T>(
    _directive: FeedBodyDirective<T>,
    context: unknown,
  ): context is FeedBodyContext<T> {
    return true;
  }
}

/** Marks the action inside the feed's empty state. */
@Directive({
  selector: '[dsFeedEmptyAction]',
  standalone: true,
})
export class FeedEmptyActionDirective {}
