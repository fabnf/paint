import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { IconComponent, type IconName } from '../../icons';
import { cx } from '../../primitives/primitives.types';
import { toneClass, type Tone } from '../../primitives/tone.types';

export type EmptyStateSize = 'sm' | 'md' | 'lg';
/** `0` renders a `<p>`: a title is not always a heading. */
export type HeadingLevel = 0 | 2 | 3 | 4 | 5 | 6;

const ICON_SIZE: Record<EmptyStateSize, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
};

/**
 * EmptyState — nothing here, and what to do about it.
 *
 * Three empties wear the same clothes and mean different things, so say which:
 *
 * - **Nothing yet.** The feature works; the user has not used it. Offer the first
 *   action — this is the only empty state that is really an invitation.
 * - **Nothing found.** A filter or a search excluded everything. Offer to clear
 *   it, and never offer "create your first…" for a list that has fifty rows
 *   behind a query.
 * - **Nothing allowed.** Permissions, or an error. Say what happened.
 *
 * Not a live region by default: an empty state that is on the page when it loads
 * has nothing to announce. Set `live` for one that *replaces* content.
 *
 * @example
 * ```html
 * <ds-empty-state icon="search" title="No invoices match" description="Try another filter.">
 *   <ds-button dsEmptyStateActions variant="secondary" size="sm">Clear filters</ds-button>
 * </ds-empty-state>
 *
 * <ds-empty-state size="lg" title="No projects yet" [textured]="true" [headingLevel]="2">
 *   <img dsEmptyStateMedia src="/empty.svg" alt="" />
 *   <ds-button dsEmptyStateActions iconStart="plus">New project</ds-button>
 * </ds-empty-state>
 * ```
 */
@Component({
  selector: 'ds-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, NgTemplateOutlet],
  host: {
    '[attr.role]': 'live() ? "status" : null',
  },
  template: `
    <div [class]="classes()">
      @if (icon()) {
        <!-- Decoration: the title says the same thing, in words. -->
        <span class="ds-empty-state__icon" aria-hidden="true">
          <ds-icon [name]="icon()!" [size]="iconSize()" />
        </span>
      }

      <!-- An illustration, if an icon is not enough. Give it an empty alt. -->
      <div class="ds-empty-state__media"><ng-content select="[dsEmptyStateMedia]" /></div>

      @switch (headingLevel()) {
        @case (2) {
          <h2 class="ds-empty-state__title"><ng-container [ngTemplateOutlet]="heading" /></h2>
        }
        @case (3) {
          <h3 class="ds-empty-state__title"><ng-container [ngTemplateOutlet]="heading" /></h3>
        }
        @case (4) {
          <h4 class="ds-empty-state__title"><ng-container [ngTemplateOutlet]="heading" /></h4>
        }
        @case (5) {
          <h5 class="ds-empty-state__title"><ng-container [ngTemplateOutlet]="heading" /></h5>
        }
        @case (6) {
          <h6 class="ds-empty-state__title"><ng-container [ngTemplateOutlet]="heading" /></h6>
        }
        @default {
          <p class="ds-empty-state__title"><ng-container [ngTemplateOutlet]="heading" /></p>
        }
      }

      @if (description()) {
        <p class="ds-empty-state__description">{{ description() }}</p>
      }

      <div class="ds-empty-state__content"><ng-content /></div>
      <div class="ds-empty-state__actions"><ng-content select="[dsEmptyStateActions]" /></div>
    </div>

    <ng-template #heading>{{ title() }}</ng-template>
  `,
  styles: `
    :host {
      display: block;
    }

    .ds-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: var(--ds-space-2);
      padding: var(--ds-space-8) var(--ds-space-5);
      border-radius: var(--ds-radius-lg);
    }

    .ds-empty-state--start {
      align-items: flex-start;
      text-align: start;
    }

    .ds-empty-state--sm {
      gap: var(--ds-space-1);
      padding: var(--ds-space-5) var(--ds-space-4);
    }

    .ds-empty-state--lg {
      padding: var(--ds-space-12) var(--ds-space-6);
    }

    /* Hatched paper: an empty table is a sheet nobody has drawn on yet. */
    .ds-empty-state--textured {
      background-image: var(--ds-texture-hatch);
      border: 1px dashed var(--ds-color-border);
    }

    .ds-empty-state__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 3rem;
      height: 3rem;
      margin-block-end: var(--ds-space-2);
      border-radius: var(--ds-radius-full);
      background-color: var(--ds-tone-bg);
      color: var(--ds-tone-fg);
    }

    .ds-empty-state--sm .ds-empty-state__icon {
      width: 2.25rem;
      height: 2.25rem;
      margin-block-end: var(--ds-space-1);
    }

    .ds-empty-state--lg .ds-empty-state__icon {
      width: 4rem;
      height: 4rem;
    }

    .ds-empty-state__media:empty {
      display: none;
    }

    .ds-empty-state__title {
      margin: 0;
      font-family: var(--ds-font-sans);
      font-size: var(--ds-font-size-md);
      font-weight: var(--ds-font-weight-semibold);
      line-height: var(--ds-line-height-snug);
      color: var(--ds-color-text);
    }

    .ds-empty-state--lg .ds-empty-state__title {
      font-size: var(--ds-font-size-xl);
    }

    .ds-empty-state--sm .ds-empty-state__title {
      font-size: var(--ds-font-size-sm);
    }

    .ds-empty-state__description {
      margin: 0;
      max-width: 44ch;
      font-size: var(--ds-font-size-sm);
      line-height: var(--ds-line-height-normal);
      color: var(--ds-color-text-muted);
    }

    .ds-empty-state__content:empty,
    .ds-empty-state__actions:empty {
      display: none;
    }

    .ds-empty-state__actions {
      margin-block-start: var(--ds-space-4);
    }

    .ds-empty-state--sm .ds-empty-state__actions {
      margin-block-start: var(--ds-space-3);
    }
  `,
})
export class EmptyStateComponent {
  /** What is not here. Say the noun: "No invoices", not "Nothing to show". */
  readonly title = input.required<string>();
  /** Why, and what to do. One sentence. */
  readonly description = input<string>('');
  readonly icon = input<IconName | null>(null);
  /** Tints the icon's disc. The rest of the block stays neutral. */
  readonly tone = input<Tone>('primary');
  readonly size = input<EmptyStateSize>('md');
  readonly align = input<'center' | 'start'>('center');
  /** Hatched paper and a dashed edge, for an empty state that fills a panel. */
  readonly textured = input(false);
  /**
   * Render the title as a real heading at this level.
   *
   * `0` — the default — renders a `<p>`: a card's empty state is not a section of
   * the document, and an `<h2>` in the middle of a table would lie about the
   * outline.
   */
  readonly headingLevel = input<HeadingLevel>(0);
  /** Announce the empty state politely. Only for one that *replaces* content. */
  readonly live = input(false);

  protected readonly iconSize = computed(() => ICON_SIZE[this.size()]);

  protected readonly classes = computed(() =>
    cx(
      'ds-empty-state',
      `ds-empty-state--${this.size()}`,
      `ds-empty-state--${this.align()}`,
      toneClass(this.tone()),
      this.textured() && 'ds-empty-state--textured',
    ),
  );
}
