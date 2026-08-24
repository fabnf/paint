import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent, type IconName } from '../../icons';
import { cx } from '../primitives.types';
import { SpinnerComponent } from '../spinner';

export type ButtonVariant =
  | 'primary'
  | 'accent'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'success'
  | 'danger'
  | 'link';

export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonType = 'button' | 'submit' | 'reset';

/** variant → Bootstrap button class (`.btn-ghost` is Paint's extension, built with Bootstrap's `button-variant` mixin). */
const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  accent: 'btn-accent',
  secondary: 'btn-secondary',
  outline: 'btn-outline-primary',
  ghost: 'btn-ghost',
  success: 'btn-success',
  danger: 'btn-danger',
  link: 'btn-link',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

const ICON_SIZE: Record<ButtonSize, 'xs' | 'sm' | 'md'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

/**
 * Button — the action atom.
 *
 * Wraps Bootstrap's `.btn` component (variants, sizes, `.disabled`) behind
 * Paint's semantic API, adds icon slots, a loading state (drawn by
 * `<ds-spinner>`) and an accessible icon-only mode. Renders a real `<button>`,
 * or an `<a class="btn">` when `href` is set, so semantics follow behaviour.
 *
 * @example
 * ```html
 * <ds-button variant="primary" (clicked)="save()">Save changes</ds-button>
 * <ds-button variant="accent" iconStart="sparkle">Mix a theme</ds-button>
 * <ds-button variant="secondary" iconStart="plus">New file</ds-button>
 * <ds-button variant="danger" [loading]="deleting()">Delete</ds-button>
 * <ds-button variant="ghost" iconStart="settings" label="Settings" />
 * <ds-button variant="link" link="/docs" iconEnd="arrowRight">Read the docs</ds-button>
 * <ds-button variant="link" href="https://angular.dev" target="_blank">Angular</ds-button>
 * ```
 */
@Component({
  selector: 'ds-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, NgTemplateOutlet, RouterLink, SpinnerComponent],
  template: `
    @if (link()) {
      <a
        [class]="classes()"
        [routerLink]="disabled() || loading() ? null : link()"
        [attr.aria-disabled]="disabled() || loading() ? 'true' : null"
        [attr.aria-label]="label() || null"
        [attr.aria-busy]="loading() ? 'true' : null"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </a>
    } @else if (href()) {
      <a
        [class]="classes()"
        [attr.href]="disabled() || loading() ? null : href()"
        [attr.target]="target() || null"
        [attr.rel]="target() === '_blank' ? 'noreferrer noopener' : null"
        [attr.role]="disabled() ? 'link' : null"
        [attr.aria-disabled]="disabled() || loading() ? 'true' : null"
        [attr.aria-label]="label() || null"
        [attr.aria-busy]="loading() ? 'true' : null"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </a>
    } @else {
      <button
        [class]="classes()"
        [attr.type]="type()"
        [disabled]="disabled()"
        [attr.aria-disabled]="loading() ? 'true' : null"
        [attr.aria-label]="label() || null"
        [attr.aria-busy]="loading() ? 'true' : null"
        [attr.aria-expanded]="ariaExpanded() === null ? null : ariaExpanded()"
        [attr.aria-controls]="ariaControls() || null"
        [attr.aria-pressed]="ariaPressed() === null ? null : ariaPressed()"
        [attr.aria-haspopup]="ariaHasPopup() || null"
        (click)="onClick($event)"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </button>
    }

    <ng-template #content>
      @if (loading()) {
        <!-- The button already reports aria-busy; the spinner stays quiet. -->
        <ds-spinner [size]="spinnerSize()" tone="inherit" [decorative]="true" />
      } @else if (iconStart()) {
        <ds-icon [name]="iconStart()!" [size]="iconSize()" />
      }

      @if (!iconOnly()) {
        <span class="ds-button__label"><ng-content /></span>
      }

      @if (iconEnd() && !loading()) {
        <ds-icon [name]="iconEnd()!" [size]="iconSize()" />
      }
    </ng-template>
  `,
  styles: `
    :host {
      display: inline-block;
      max-width: 100%;
    }

    :host([fullwidth='true']) {
      display: block;
    }

    /* Square control: mirror the vertical padding on the inline axis so the
       icon sits in the middle of a box that matches the control height. */
    .btn--icon-only {
      padding-inline: var(--bs-btn-padding-y);
    }

    .ds-button__label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* A loading button keeps focus, so it must still *look* unavailable. */
    .btn[aria-disabled='true'] {
      pointer-events: none;
    }
  `,
  host: {
    '[attr.fullwidth]': 'fullWidth() ? "true" : null',
  },
})
export class ButtonComponent {
  /** Semantic intent of the action. */
  readonly variant = input<ButtonVariant>('primary');
  /** Control height, from Paint's control scale. */
  readonly size = input<ButtonSize>('md');
  /** Native button type. Ignored when `href` is set. */
  readonly type = input<ButtonType>('button');
  /** Renders an `<a class="btn">` instead of a `<button>`. Use for external or cross-document links. */
  readonly href = input<string | null>(null);
  /**
   * In-app destination. Renders an `<a class="btn">` driven by Angular's router.
   *
   * Named `link`, not `routerLink`, on purpose: Angular's `RouterLink` directive
   * matches on the *attribute*, so an input called `routerLink` would also apply
   * the directive to this component's host element — giving the control a second,
   * roleless tab stop and a duplicate navigation handler.
   */
  readonly link = input<string | unknown[] | null>(null);
  /** Anchor target, e.g. `_blank`. */
  readonly target = input<string | null>(null);
  readonly disabled = input(false);
  /**
   * Swaps the leading icon for a spinner and blocks interaction.
   *
   * Unlike `disabled`, the control keeps its place in the tab order: it reports
   * `aria-disabled` + `aria-busy` rather than going `disabled`, so focus is not
   * lost while the user waits.
   */
  readonly loading = input(false);
  /** Icon before the label. */
  readonly iconStart = input<IconName | null>(null);
  /** Icon after the label. */
  readonly iconEnd = input<IconName | null>(null);
  /** Accessible name. Required when there is no visible label. */
  readonly label = input<string>('');
  /** Fill the available width. */
  readonly fullWidth = input(false);
  /** Fully rounded control. */
  readonly pill = input(false);
  /** Reflects a pressed/selected state (`.active`). */
  readonly active = input(false);
  /** Forwards `aria-expanded` to the native control (disclosure triggers). */
  readonly ariaExpanded = input<boolean | null>(null);
  /** Forwards `aria-controls` to the native control. */
  readonly ariaControls = input<string | null>(null);
  /** Forwards `aria-pressed` to the native control (toggle buttons). */
  readonly ariaPressed = input<boolean | null>(null);
  /** Forwards `aria-haspopup` to the native control (menu / listbox triggers). */
  readonly ariaHasPopup = input<string | null>(null);

  /** Emits on click. Disabled and loading buttons never emit. */
  readonly clicked = output<MouseEvent>();

  /** True when there is an icon and an explicit `label` but no visible text. */
  protected readonly iconOnly = computed(
    () => !!this.label() && (!!this.iconStart() || !!this.iconEnd()),
  );

  protected readonly iconSize = computed(() => ICON_SIZE[this.size()]);

  /** The spinner replaces the leading icon, so it is exactly its size. */
  protected readonly spinnerSize = computed(() => ICON_SIZE[this.size()]);

  protected readonly classes = computed(() =>
    cx(
      'btn',
      VARIANT_CLASS[this.variant()],
      SIZE_CLASS[this.size()],
      this.pill() && 'rounded-full',
      this.fullWidth() && 'w-100',
      this.active() && 'active',
      this.iconOnly() && 'btn--icon-only',
      // `.disabled` keeps anchors visually consistent with disabled buttons,
      // and gives a loading <button> the same dimmed look without taking it
      // out of the tab order.
      (this.disabled() || this.loading()) && 'disabled',
    ),
  );

  /**
   * A loading button stays focusable.
   *
   * Flipping `disabled` mid-interaction would yank focus to the body — the user
   * loses their place precisely when they are waiting for feedback. So loading
   * is expressed with `aria-disabled` + `aria-busy`, and the click is swallowed
   * here instead.
   */
  protected onClick(event: MouseEvent): void {
    if (this.loading() || this.disabled()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.clicked.emit(event);
  }
}
