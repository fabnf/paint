import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { IconComponent } from '../../icons';
import { cx } from '../../primitives/primitives.types';
import { pageBounds, pageCountOf, paginationRange } from './pagination.range';

export type PaginationVariant = 'pages' | 'compact';
export type PaginationSize = 'sm' | 'md';

/**
 * Pagination — which page of the list you are on, and how to get to another.
 *
 * Buttons, not links, because nothing here changes the URL: the list above it
 * changes, and `pageChange` is how you hear about it. Give the pages real links
 * and they should be `<ds-link>`s in your own markup, with real `href`s that work
 * on middle-click.
 *
 * The number of slots never changes as the current page travels, so the button
 * under the cursor is still the button under the cursor after a click. An
 * ellipsis appears only where it hides more than one page.
 *
 * @example
 * ```html
 * <!-- 57 invoices, ten at a time -->
 * <ds-pagination [(page)]="page" [total]="57" [pageSize]="10" [showSummary]="true" />
 *
 * <!-- Pages you already counted -->
 * <ds-pagination [(page)]="page" [pageCount]="12" (pageChange)="load($event)" />
 *
 * <!-- Narrow -->
 * <ds-pagination [(page)]="page" [pageCount]="12" variant="compact" />
 * ```
 */
@Component({
  selector: 'ds-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <nav [attr.aria-label]="label()" [class]="classes()">
      @if (showSummary()) {
        <p class="ds-pagination__summary">{{ summaryText() }}</p>
      }

      <ul class="pagination ds-pagination__list">
        <li class="page-item" [class.disabled]="!canGoBack()">
          <button
            type="button"
            class="page-link ds-pagination__step"
            [disabled]="!canGoBack()"
            [attr.aria-label]="previousLabel()"
            (click)="go(page() - 1)"
          >
            <ds-icon name="chevronLeft" size="sm" />
          </button>
        </li>

        @if (variant() === 'compact') {
          <!-- No slots to draw: the number *is* the control. -->
          <li class="ds-pagination__current">{{ compactText() }}</li>
        } @else {
          @for (slot of slots(); track $index) {
            @if (slot === 'start-ellipsis' || slot === 'end-ellipsis') {
              <li class="page-item disabled ds-pagination__gap">
                <!-- Decoration. The pages it hides are reachable from the ones beside it. -->
                <span class="page-link" aria-hidden="true">…</span>
              </li>
            } @else {
              <li class="page-item" [class.active]="slot === page()">
                <button
                  type="button"
                  class="page-link"
                  [attr.aria-label]="pageAriaLabel(slot)"
                  [attr.aria-current]="slot === page() ? 'page' : null"
                  [disabled]="disabled()"
                  (click)="go(slot)"
                >
                  {{ slot }}
                </button>
              </li>
            }
          }
        }

        <li class="page-item" [class.disabled]="!canGoForward()">
          <button
            type="button"
            class="page-link ds-pagination__step"
            [disabled]="!canGoForward()"
            [attr.aria-label]="nextLabel()"
            (click)="go(page() + 1)"
          >
            <ds-icon name="chevronRight" size="sm" />
          </button>
        </li>
      </ul>

      <!--
        The list above changed, and focus did not move. Born with the page it is
        already on, so the first *change* is the first thing it says.
      -->
      <span class="visually-hidden" role="status">{{ liveText() }}</span>
    </nav>
  `,
  styles: `
    :host {
      display: block;
    }

    .ds-pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: var(--ds-space-3);
    }

    .ds-pagination__summary {
      margin: 0;
      font-size: var(--ds-font-size-sm);
      color: var(--ds-color-text-muted);
      font-variant-numeric: tabular-nums;
    }

    .ds-pagination__list {
      margin: 0;
    }

    .ds-pagination--sm .page-link {
      min-width: 2rem;
      font-size: var(--ds-font-size-sm);
      --bs-pagination-padding-x: 0.5rem;
      --bs-pagination-padding-y: 0.25rem;
    }

    .ds-pagination__step {
      color: var(--ds-color-text);
    }

    /* The gap is not a button: it must not look like one that is broken. */
    .ds-pagination__gap .page-link {
      min-width: 1.5rem;
      padding-inline: var(--ds-space-1);
      color: var(--ds-color-text-subtle);
      pointer-events: none;
    }

    .ds-pagination__current {
      display: inline-flex;
      align-items: center;
      padding-inline: var(--ds-space-3);
      font-size: var(--ds-font-size-sm);
      color: var(--ds-color-text-muted);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
  `,
})
export class PaginationComponent {
  /** The current page, 1-based. Two-way bindable. */
  readonly page = model(1);
  /** How many pages there are. Ignored when `total` is given. */
  readonly pageCount = input(0);
  /** How many items there are. With `pageSize`, this counts the pages for you. */
  readonly total = input(0);
  readonly pageSize = input(10);
  /** Pages either side of the current one. */
  readonly siblingCount = input(1);
  /** Pages pinned at each end. */
  readonly boundaryCount = input(1);
  readonly variant = input<PaginationVariant>('pages');
  readonly size = input<PaginationSize>('md');
  readonly disabled = input(false);
  /** "1–10 of 57". Needs `total`. */
  readonly showSummary = input(false);

  readonly label = input<string>('Pagination');
  readonly previousLabel = input<string>('Previous page');
  readonly nextLabel = input<string>('Next page');
  readonly pageLabel = input<(page: number) => string>((page) => `Page ${page}`);
  /** The summary, when you count in something other than items. */
  readonly summary = input<(first: number, last: number, total: number) => string>(
    (first, last, total) => (total ? `${first}–${last} of ${total}` : 'Nothing to show'),
  );
  /** What the live region says after a page change. */
  readonly liveLabel = input<(page: number, pageCount: number) => string>(
    (page, pageCount) => `Page ${page} of ${pageCount}`,
  );

  /** Emits only when the page actually changes, and never for a page that cannot exist. */
  readonly pageChange = output<number>();

  protected readonly resolvedCount = computed(() =>
    this.total() > 0 ? pageCountOf(this.total(), this.pageSize()) : Math.max(1, this.pageCount()),
  );

  protected readonly slots = computed(() =>
    paginationRange({
      page: this.page(),
      pageCount: this.resolvedCount(),
      siblingCount: this.siblingCount(),
      boundaryCount: this.boundaryCount(),
    }),
  );

  protected readonly canGoBack = computed(() => !this.disabled() && this.page() > 1);
  protected readonly canGoForward = computed(
    () => !this.disabled() && this.page() < this.resolvedCount(),
  );

  protected readonly summaryText = computed(() => {
    const [first, last] = pageBounds(this.page(), this.pageSize(), this.total());
    return this.summary()(first, last, this.total());
  });

  protected readonly compactText = computed(
    () => `${this.page()} / ${this.resolvedCount()}`,
  );

  protected readonly liveText = computed(() => this.liveLabel()(this.page(), this.resolvedCount()));

  protected pageAriaLabel(page: number): string {
    return this.pageLabel()(page);
  }

  protected readonly classes = computed(() =>
    cx('ds-pagination', `ds-pagination--${this.size()}`),
  );

  protected go(page: number): void {
    const next = Math.min(Math.max(page, 1), this.resolvedCount());

    if (this.disabled() || next === this.page()) {
      return;
    }

    this.page.set(next);
    this.pageChange.emit(next);
  }
}
