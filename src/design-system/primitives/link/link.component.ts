import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent, type IconName } from '../../icons';
import { cx } from '../primitives.types';

export type LinkVariant = 'primary' | 'subtle' | 'inherit';
export type LinkUnderline = 'always' | 'hover' | 'none';

/**
 * Link — the navigation atom.
 *
 * A real `<a href>`, so middle-click, ⌘-click, "copy link address" and the
 * browser's own status bar all work. A link goes somewhere; a `<ds-button>` does
 * something. If it opens a dialog it is a button wearing a link's clothes — use
 * `<ds-button variant="link">`.
 *
 * @example
 * ```html
 * <ds-link link="/foundations">Design tokens</ds-link>
 * <ds-link href="https://angular.dev" [external]="true">Angular</ds-link>
 * <ds-link variant="subtle" underline="hover" iconEnd="arrowRight">Read the docs</ds-link>
 * <ds-link variant="inherit" href="#anatomy">inside a paragraph</ds-link>
 * ```
 */
@Component({
  selector: 'ds-link',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, NgTemplateOutlet, RouterLink],
  template: `
    @if (link()) {
      <!--
        Named link, not routerLink: Angular's RouterLink directive matches on
        the attribute, so an input of that name would also apply the directive to
        this component's host and give the link a second, roleless tab stop.
      -->
      <a [class]="classes()" [routerLink]="link()" [attr.aria-label]="ariaLabel() || null">
        <ng-container [ngTemplateOutlet]="content" />
      </a>
    } @else {
      <a
        [class]="classes()"
        [attr.href]="href()"
        [attr.target]="resolvedTarget()"
        [attr.rel]="rel()"
        [attr.aria-label]="ariaLabel() || null"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </a>
    }

    <ng-template #content>
      @if (iconStart()) {
        <ds-icon [name]="iconStart()!" size="sm" class="ds-link__icon" />
      }

      <span class="ds-link__label"><ng-content /></span>

      @if (iconEnd()) {
        <ds-icon [name]="iconEnd()!" size="sm" class="ds-link__icon" />
      }

      @if (isExternal()) {
        <!-- The glyph is decoration; the warning is the words. -->
        <ds-icon name="externalLink" size="xs" class="ds-link__icon ds-link__external" />
        @if (newTab()) {
          <span class="visually-hidden">{{ newTabLabel() }}</span>
        }
      }
    </ng-template>
  `,
  styles: `
    :host {
      display: inline;
    }

    a {
      display: inline;
      align-items: center;
      gap: var(--ds-space-1);
      border-radius: var(--ds-radius-sm);
      color: var(--ds-link-color);
      text-decoration-color: color-mix(in srgb, currentcolor 40%, transparent);
      text-underline-offset: 0.16em;
      text-decoration-thickness: max(1px, 0.06em);
      transition: color 120ms ease;
    }

    /* Icons turn the link into a flex row, which an inline link must not be. */
    a:has(.ds-link__icon) {
      display: inline-flex;
    }

    a:hover {
      color: var(--ds-link-hover-color);
      text-decoration-color: currentcolor;
    }

    a:focus-visible {
      outline: 2px solid var(--ds-color-focus-ring);
      outline-offset: 2px;
      text-decoration: none;
    }

    .ds-link--primary {
      --ds-link-color: var(--ds-color-primary);
      --ds-link-hover-color: var(--ds-color-primary-hover);
      font-weight: var(--ds-font-weight-medium);
    }

    .ds-link--subtle {
      --ds-link-color: var(--ds-color-text-muted);
      --ds-link-hover-color: var(--ds-color-primary);
      font-weight: var(--ds-font-weight-medium);
    }

    /* In running text the link is the text, just marked. */
    .ds-link--inherit {
      --ds-link-color: currentcolor;
      --ds-link-hover-color: var(--ds-color-primary);
    }

    .ds-link--underline-always {
      text-decoration-line: underline;
    }

    .ds-link--underline-hover {
      text-decoration-line: none;
    }

    /*
     * An underline on hover only is a link nobody can see. It is allowed where
     * the link is unmistakable from context — a nav item, a card title — and
     * :focus-visible brings it back for the keyboard.
     */
    .ds-link--underline-hover:hover,
    .ds-link--underline-hover:focus-visible {
      text-decoration-line: underline;
    }

    .ds-link--underline-none {
      text-decoration-line: none;
    }

    .ds-link__icon {
      flex-shrink: 0;
    }

    .ds-link__external {
      /* Lift the arrow to the cap height of the text it follows. */
      margin-block-start: -0.15em;
      opacity: 0.7;
    }

    @media (prefers-reduced-motion: reduce) {
      a {
        transition: none;
      }
    }
  `,
})
export class LinkComponent {
  /** Cross-document or external destination. Renders a plain `<a href>`. */
  readonly href = input<string | null>(null);
  /** In-app destination, driven by Angular's router. */
  readonly link = input<string | unknown[] | null>(null);
  /** Anchor target. `_blank` implies `external`. */
  readonly target = input<string | null>(null);
  /** Tone. `inherit` is for links inside running text. */
  readonly variant = input<LinkVariant>('primary');
  /** When the underline appears. `always` unless the link is unmistakable. */
  readonly underline = input<LinkUnderline>('always');
  readonly iconStart = input<IconName | null>(null);
  readonly iconEnd = input<IconName | null>(null);
  /**
   * Marks the destination as leaving the site: adds the arrow glyph, and the
   * words a screen reader needs when it also opens a new tab.
   *
   * Defaults to true for a `target="_blank"` link — the warning is not optional.
   */
  readonly external = input<boolean | null>(null);
  /** What a new tab is called out loud. */
  readonly newTabLabel = input<string>('(opens in a new tab)');
  /** Accessible name, when the visible text is not one ("click here", an icon). */
  readonly ariaLabel = input<string>('');

  protected readonly newTab = computed(() => this.target() === '_blank');

  protected readonly isExternal = computed(() => this.external() ?? this.newTab());

  protected readonly resolvedTarget = computed(() => this.target() || null);

  /**
   * `target="_blank"` without `rel` hands the new page a reference to this one.
   * It is a security default, not a preference.
   */
  protected readonly rel = computed(() => (this.newTab() ? 'noreferrer noopener' : null));

  protected readonly classes = computed(() =>
    cx('ds-link', `ds-link--${this.variant()}`, `ds-link--underline-${this.underline()}`),
  );
}
