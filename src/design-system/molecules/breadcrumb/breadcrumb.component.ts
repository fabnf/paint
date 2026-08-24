import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { IconComponent, type IconName } from '../../icons';
import { LinkComponent } from '../../primitives/link';
import { collapseBreadcrumbs, type BreadcrumbItem } from './breadcrumb.types';

/**
 * Breadcrumb — where this page sits, and how to go back up.
 *
 * An ordered list of links inside a named `<nav>`, ending in the page you are on.
 * That last crumb is **not a link**: it goes nowhere, and `aria-current="page"`
 * is what says so. The separators are decoration and are hidden, because a screen
 * reader already knows it is reading a list.
 *
 * A path longer than `maxItems` collapses in the middle into a button that says
 * how many crumbs it is hiding, and expands in place — rather than hiding the
 * path behind a menu that only a pointer can open.
 *
 * @example
 * ```html
 * <ds-breadcrumb [items]="[
 *   { label: 'Home', link: '/' },
 *   { label: 'Projects', link: '/projects' },
 *   { label: 'Mural' },
 * ]" />
 *
 * <ds-breadcrumb [items]="deepPath" [maxItems]="4" separator="/" />
 * ```
 */
@Component({
  selector: 'ds-breadcrumb',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, LinkComponent],
  template: `
    <nav [attr.aria-label]="label()">
      <ol class="ds-breadcrumb">
        @for (slot of slots(); track slot.kind === 'item' ? slot.item.label + slot.index : 'gap'; let last = $last) {
          <li class="ds-breadcrumb__crumb">
            @if (slot.kind === 'ellipsis') {
              <!--
                Never a bare "…": the button says how many crumbs are behind it,
                and expands them in place. A menu would hide the path from anyone
                who reached the page with a keyboard.
              -->
              <button
                type="button"
                class="ds-breadcrumb__expand"
                [attr.aria-label]="hiddenLabel(slot.hidden)"
                aria-expanded="false"
                (click)="expand()"
              >
                <ds-icon name="more" size="xs" />
              </button>
            } @else if (slot.current) {
              <!-- The page you are on. It is not a link, and it says so. -->
              <span class="ds-breadcrumb__current" aria-current="page">
                @if (slot.item.icon) {
                  <ds-icon [name]="slot.item.icon" size="xs" />
                }
                {{ slot.item.label }}
              </span>
            } @else if (slot.item.link || slot.item.href) {
              <ds-link
                class="ds-breadcrumb__link"
                variant="subtle"
                underline="hover"
                [link]="slot.item.link ?? null"
                [href]="slot.item.href ?? null"
                [iconStart]="slot.item.icon ?? null"
                [ariaLabel]="slot.item.ariaLabel ?? ''"
              >
                {{ slot.item.label }}
              </ds-link>
            } @else {
              <!-- A crumb with nowhere to go is text. An anchor without an href
                   is not a link, and pretending otherwise costs a tab stop. -->
              <span class="ds-breadcrumb__text">{{ slot.item.label }}</span>
            }

            @if (!last) {
              <span class="ds-breadcrumb__separator" aria-hidden="true">
                @if (separator()) {
                  {{ separator() }}
                } @else {
                  <ds-icon [name]="separatorIcon()" size="xs" />
                }
              </span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  styles: `
    :host {
      display: block;
    }

    .ds-breadcrumb {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--ds-space-1);
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: var(--ds-font-size-sm);
    }

    .ds-breadcrumb__crumb {
      display: inline-flex;
      align-items: center;
      gap: var(--ds-space-1);
      min-width: 0;
    }

    .ds-breadcrumb__link {
      min-width: 0;
    }

    .ds-breadcrumb__current {
      display: inline-flex;
      align-items: center;
      gap: var(--ds-space-1);
      max-width: 20rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: var(--ds-font-weight-semibold);
      color: var(--ds-color-text);
    }

    .ds-breadcrumb__text {
      color: var(--ds-color-text-muted);
    }

    .ds-breadcrumb__separator {
      display: inline-flex;
      align-items: center;
      color: var(--ds-color-text-subtle);
      user-select: none;
    }

    .ds-breadcrumb__expand {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 1.25rem;
      padding: 0;
      border: 0;
      border-radius: var(--ds-radius-sm);
      background-color: var(--ds-color-surface-sunken);
      color: var(--ds-color-text-muted);
      cursor: pointer;
    }

    .ds-breadcrumb__expand:hover {
      background-color: var(--ds-color-primary-muted);
      color: var(--ds-color-primary);
    }

    .ds-breadcrumb__expand:focus-visible {
      outline: 2px solid var(--ds-color-focus-ring);
      outline-offset: 1px;
    }
  `,
})
export class BreadcrumbComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The path, root first. The last item is the page you are on. */
  readonly items = input.required<readonly BreadcrumbItem[]>();
  /** Names the `<nav>`. A page with two navs needs two names. */
  readonly label = input<string>('Breadcrumb');
  /** Collapse once the path is longer than this. `0` never collapses. */
  readonly maxItems = input(0);
  readonly itemsBeforeCollapse = input(1);
  readonly itemsAfterCollapse = input(2);
  /** `{n}` is replaced with the number of crumbs behind the button. */
  readonly expandLabel = input<string>('Show {n} hidden breadcrumbs');
  /** A character instead of the chevron. */
  readonly separator = input<string>('');
  readonly separatorIcon = input<IconName>('chevronRight');

  /** Expanding is one-way: the user asked to see the path. */
  private readonly expanded = signal(false);

  protected hiddenLabel(hidden: number): string {
    return this.expandLabel().replace('{n}', String(hidden));
  }

  protected readonly slots = computed(() =>
    collapseBreadcrumbs(
      this.items(),
      this.expanded() ? 0 : this.maxItems(),
      this.itemsBeforeCollapse(),
      this.itemsAfterCollapse(),
    ),
  );

  protected expand(): void {
    const index = this.itemsBeforeCollapse();
    this.expanded.set(true);

    // The button the user pressed no longer exists. Land them on the first crumb
    // it was hiding, rather than on the body.
    setTimeout(() => {
      const links = this.host.nativeElement.querySelectorAll<HTMLElement>('.ds-breadcrumb a');
      links[Math.min(index, links.length - 1)]?.focus();
    });
  }
}
