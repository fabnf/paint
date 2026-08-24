import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  input,
  output,
} from '@angular/core';
import { IconComponent } from '../../icons';
import { AvatarComponent } from '../../primitives/avatar';
import { EmptyStateComponent } from '../../molecules/empty-state';
import { toneClass } from '../../primitives/tone.types';
import type { DataTableEmpty } from '../data-table/data-table.types';
import { FeedBodyDirective } from './feed-slots';
import { absoluteTime, relativeTime, type FeedItem, type FeedOrientation } from './feed.types';

/** The DataTable's empty-state copy, once more: same screens, same words. */
export type FeedEmpty = DataTableEmpty;

/**
 * Feed — a pile of events, systemised.
 *
 * The activity list and the notification inbox are the same organism wearing
 * different chrome: a rail of moments, each with a node, a sentence, a clock
 * and a read state. This is that organism, once — vertical by default,
 * horizontal for the feeds that earn it (releases, milestones: few items,
 * strong order, names worth reading sideways).
 *
 * **The host owns the items and the detail.** The feed renders, announces and
 * emits: `itemOpen` when a row's title is pressed (the host opens its drawer,
 * navigates, whatever opening means), `markRead` when the unread dot is —
 * flipping the flag is the host's, because the items are. The body under each
 * title is the host's too, via the `[dsFeedBody]` template.
 *
 * Time is shown relative ("2h ago") with the absolute moment in the tooltip
 * and the accessible name, off an injectable clock — a feed that cannot be
 * tested at a fixed moment cannot be tested at all.
 *
 * @example
 * ```html
 * <ds-feed [items]="activity()" (itemOpen)="open($event)" (markRead)="read($event)">
 *   <ng-template dsFeedBody [dsFeedBodyItems]="activity()" let-item>
 *     <blockquote>{{ item.data.quote }}</blockquote>
 *   </ng-template>
 * </ds-feed>
 * ```
 */
@Component({
  selector: 'ds-feed',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, IconComponent, AvatarComponent, EmptyStateComponent],
  template: `
    @if (items().length === 0) {
      <ds-empty-state
        [icon]="empty().icon ?? null"
        [title]="empty().title"
        [description]="empty().description ?? ''"
        size="sm"
      >
        <span dsEmptyStateActions><ng-content select="[dsFeedEmptyAction]" /></span>
      </ds-empty-state>
    } @else {
      <ol
        class="ds-feed"
        [class.ds-feed--horizontal]="orientation() === 'horizontal'"
        [attr.aria-label]="label()"
      >
        @for (item of items(); track item.id) {
          <li class="ds-feed__entry" [class.ds-feed__entry--unread]="item.unread">
            <!-- The node: who or what, on the rail. Decoration — the title speaks. -->
            <span class="ds-feed__node" aria-hidden="true">
              @if (item.actor) {
                <ds-avatar [name]="item.actor" size="sm" [decorative]="true" />
              } @else {
                <span class="ds-feed__dot {{ toneClassOf(item) }}" [class.ds-feed__dot--icon]="!!item.icon">
                  @if (item.icon) {
                    <ds-icon [name]="item.icon" size="sm" />
                  }
                </span>
              }
            </span>

            <div class="ds-feed__content">
              <div class="ds-feed__head">
                <!-- The title is the way in: a real button, named by itself. -->
                <button type="button" class="ds-feed__title" (click)="itemOpen.emit(item)">
                  {{ item.title }}
                  @if (item.unread) {
                    <span class="visually-hidden">(unread)</span>
                  }
                </button>

                <span class="ds-feed__meta">
                  <time
                    class="ds-feed__time"
                    [attr.datetime]="item.timestamp"
                    [title]="absolute(item)"
                    [attr.aria-label]="absolute(item)"
                  >
                    {{ relative(item) }}
                  </time>

                  @if (item.unread) {
                    <button
                      type="button"
                      class="ds-feed__unread"
                      [attr.aria-label]="markReadLabel() + ': ' + item.title"
                      [title]="markReadLabel()"
                      (click)="markRead.emit(item)"
                    ></button>
                  }
                </span>
              </div>

              @if (item.description) {
                <p class="ds-feed__description">{{ item.description }}</p>
              }

              @if (bodyTemplate(); as body) {
                <div class="ds-feed__body">
                  <ng-container
                    [ngTemplateOutlet]="body.template"
                    [ngTemplateOutletContext]="{ $implicit: item }"
                  />
                </div>
              }
            </div>
          </li>
        }
      </ol>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .ds-feed {
      display: flex;
      flex-direction: column;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .ds-feed__entry {
      position: relative;
      display: flex;
      gap: var(--ds-space-3);
      padding-block: var(--ds-space-3);
    }

    /* The rail: drawn per entry so it starts and stops with the list. */
    .ds-feed__entry::before {
      content: '';
      position: absolute;
      inset-block: 0;
      /* Centred on the 2rem node column. */
      inset-inline-start: calc(1rem - 1px);
      width: 2px;
      background: var(--ds-color-border);
    }

    .ds-feed__entry:first-child::before {
      inset-block-start: var(--ds-space-3);
    }

    .ds-feed__entry:last-child::before {
      inset-block-end: auto;
      height: var(--ds-space-3);
    }

    .ds-feed__entry:only-child::before {
      display: none;
    }

    .ds-feed__node {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      width: 2rem;
      flex-shrink: 0;
    }

    .ds-feed__dot {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 0.75rem;
      height: 0.75rem;
      margin-block-start: 0.3rem;
      border-radius: var(--ds-radius-full);
      background: var(--ds-tone-solid, var(--ds-color-border-strong));
      /* A ring of page, so the rail passes behind, not through. */
      box-shadow: 0 0 0 3px var(--ds-color-surface);
    }

    .ds-feed__dot--icon {
      width: 2rem;
      height: 2rem;
      margin-block-start: 0;
      background: var(--ds-tone-bg, var(--ds-color-surface-sunken));
      color: var(--ds-tone-fg, var(--ds-color-text-muted));
    }

    .ds-feed__content {
      flex: 1 1 auto;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-1);
    }

    .ds-feed__head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--ds-space-3);
    }

    .ds-feed__title {
      padding: 0;
      border: 0;
      background: none;
      text-align: start;
      font: inherit;
      font-size: var(--ds-font-size-sm);
      color: var(--ds-color-text);
      cursor: pointer;
      border-radius: var(--ds-radius-sm);
    }

    .ds-feed__title:hover {
      color: var(--ds-color-primary);
    }

    .ds-feed__entry--unread .ds-feed__title {
      font-weight: var(--ds-font-weight-semibold);
    }

    .ds-feed__meta {
      display: inline-flex;
      align-items: center;
      gap: var(--ds-space-2);
      flex-shrink: 0;
    }

    .ds-feed__time {
      font-size: var(--ds-font-size-xs);
      color: var(--ds-color-text-subtle);
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }

    /* The unread dot is also the mark-read button: GitHub taught everyone. */
    .ds-feed__unread {
      width: 0.625rem;
      height: 0.625rem;
      padding: 0;
      border: 0;
      border-radius: var(--ds-radius-full);
      background: var(--ds-color-primary);
      cursor: pointer;
    }

    .ds-feed__unread:hover {
      background: var(--ds-color-primary-hover);
    }

    .ds-feed__description {
      margin: 0;
      font-size: var(--ds-font-size-sm);
      color: var(--ds-color-text-muted);
    }

    .ds-feed__body {
      margin-block-start: var(--ds-space-1);
    }

    /* —— horizontal: a row of milestones, scrollable when it must be —— */

    .ds-feed--horizontal {
      flex-direction: row;
      overflow-x: auto;
      padding-block-end: var(--ds-space-2);
    }

    .ds-feed--horizontal .ds-feed__entry {
      flex-direction: column;
      flex: 1 0 11rem;
      gap: var(--ds-space-2);
      padding-block: 0;
      padding-inline-end: var(--ds-space-4);
    }

    /* The rail turns: a horizontal connector through the nodes. */
    .ds-feed--horizontal .ds-feed__entry::before {
      inset-inline: 1rem 0;
      inset-block-start: calc(1rem - 1px);
      width: auto;
      height: 2px;
    }

    .ds-feed--horizontal .ds-feed__entry:first-child::before {
      inset-block-start: calc(1rem - 1px);
    }

    .ds-feed--horizontal .ds-feed__entry:last-child::before {
      display: none;
    }

    .ds-feed--horizontal .ds-feed__node {
      align-items: center;
      height: 2rem;
    }

    .ds-feed--horizontal .ds-feed__dot {
      margin-block-start: 0;
    }

    .ds-feed--horizontal .ds-feed__head {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--ds-space-0_5);
    }

    @media (forced-colors: active) {
      .ds-feed__unread {
        border: 3px solid Highlight;
      }
    }
  `,
})
export class FeedComponent<T = unknown> {
  /** The events, newest first by convention. The host owns them. */
  readonly items = input.required<readonly FeedItem<T>[]>();
  /** Vertical is the feed; horizontal is for the few that earn it. */
  readonly orientation = input<FeedOrientation>('vertical');
  /** The list's accessible name. */
  readonly label = input<string>('Activity feed');
  /** Copy for the empty state — the DataTable's shape, once more. */
  readonly empty = input<FeedEmpty>({ title: 'Nothing yet' });
  readonly markReadLabel = input<string>('Mark as read');
  readonly locale = input<string>('en-GB');
  /**
   * The clock, injectable: pass a fixed ISO instant and "2h ago" is
   * deterministic — in tests, and in screenshots that must not rot.
   */
  readonly now = input<string | null>(null);

  /** A title was pressed. What opening means is the host's business. */
  readonly itemOpen = output<FeedItem<T>>();
  /** The unread dot was pressed. The host flips the flag; the items are its. */
  readonly markRead = output<FeedItem<T>>();

  protected readonly bodyTemplate = contentChild(FeedBodyDirective<T>);

  private readonly clock = computed(() => {
    const now = this.now();
    return now ? new Date(now) : new Date();
  });

  protected relative(item: FeedItem<T>): string {
    return relativeTime(item.timestamp, this.clock(), this.locale());
  }

  protected absolute(item: FeedItem<T>): string {
    return absoluteTime(item.timestamp, this.locale());
  }

  protected toneClassOf(item: FeedItem<T>): string {
    return item.tone ? toneClass(item.tone) : '';
  }
}
