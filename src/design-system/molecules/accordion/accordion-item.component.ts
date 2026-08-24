import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { IconComponent, type IconName } from '../../icons';
import { BadgeComponent } from '../../primitives/badge';
import { cx } from '../../primitives/primitives.types';
import type { Tone } from '../../primitives/tone.types';
import { uniqueId } from '../../utils';
import {
  DS_ACCORDION,
  type AccordionHeadingLevel,
  type AccordionVariant,
} from './accordion.types';

/**
 * AccordionItem — a header that discloses a panel.
 *
 * Inside a `<ds-accordion>` it is one of many, and the accordion decides how many
 * can be open at once. **On its own it is a disclosure**: it owns its `expanded`
 * state, answers to `Enter` and `Space` because the header is a real `<button>`,
 * and needs nothing else.
 *
 * The panel stays in the DOM when it is closed — a settings form that forgets
 * what you typed because you collapsed its section is a bug — but it is
 * `visibility: hidden`, so it is out of the tab order and out of the
 * accessibility tree.
 *
 * Interactive content goes in `[dsAccordionTrailing]`, *outside* the button: a
 * switch inside a button is a control inside a control, and neither can be
 * operated. A `badge` is drawn inside the button, because "3 issues" is part of
 * what the header says.
 *
 * @example
 * ```html
 * <!-- A disclosure -->
 * <ds-accordion-item label="Advanced options">…</ds-accordion-item>
 *
 * <!-- A settings row -->
 * <ds-accordion-item label="Notifications" icon="bell" [badge]="3">
 *   <ds-switch dsAccordionTrailing label="Enabled" [(checked)]="on" />
 *   …
 * </ds-accordion-item>
 * ```
 */
@Component({
  selector: 'ds-accordion-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, BadgeComponent, NgTemplateOutlet],
  host: {
    '[class]': 'hostClasses()',
  },
  template: `
    <div class="ds-accordion__header">
      @switch (level()) {
        @case (2) {
          <h2 class="ds-accordion__heading"><ng-container [ngTemplateOutlet]="trigger" /></h2>
        }
        @case (3) {
          <h3 class="ds-accordion__heading"><ng-container [ngTemplateOutlet]="trigger" /></h3>
        }
        @case (4) {
          <h4 class="ds-accordion__heading"><ng-container [ngTemplateOutlet]="trigger" /></h4>
        }
        @case (5) {
          <h5 class="ds-accordion__heading"><ng-container [ngTemplateOutlet]="trigger" /></h5>
        }
        @case (6) {
          <h6 class="ds-accordion__heading"><ng-container [ngTemplateOutlet]="trigger" /></h6>
        }
        @default {
          <!-- An accordion header is a heading. Which level is the page's business. -->
          <h3 class="ds-accordion__heading"><ng-container [ngTemplateOutlet]="trigger" /></h3>
        }
      }

      <!-- Outside the button, because a control inside a control is neither. -->
      <div class="ds-accordion__trailing">
        <ng-content select="[dsAccordionTrailing]" />
      </div>
    </div>

    <div
      class="ds-accordion__panel"
      [class.ds-accordion__panel--open]="isExpanded()"
      [id]="panelId()"
      role="region"
      [attr.aria-labelledby]="triggerId()"
    >
      <!--
        Kept in the DOM so a half-filled form survives a collapse, and
        visibility: hidden so it is out of the tab order and the a11y tree while
        it is closed.
      -->
      <div class="ds-accordion__content">
        <div class="ds-accordion__body">
          <ng-content />
        </div>
      </div>
    </div>

    <ng-template #trigger>
      <button
        #triggerButton
        type="button"
        class="ds-accordion__trigger"
        [id]="triggerId()"
        [attr.aria-expanded]="isExpanded()"
        [attr.aria-controls]="panelId()"
        [attr.aria-disabled]="isDisabled() ? 'true' : null"
        (click)="toggle()"
        (keydown)="onKeydown($event)"
      >
        @if (iconPosition() === 'start') {
          <ds-icon class="ds-accordion__chevron" name="chevronDown" size="sm" />
        }

        @if (icon()) {
          <ds-icon class="ds-accordion__icon" [name]="icon()!" size="sm" />
        }

        <span class="ds-accordion__label">
          {{ label() }}
          @if (description()) {
            <span class="ds-accordion__description">{{ description() }}</span>
          }
        </span>

        @if (badge() !== null) {
          <!-- Inside the button: "3 issues" is part of what the header says. -->
          <ds-badge class="ds-accordion__badge" [tone]="badgeTone()" [srLabel]="badgeLabel()">
            {{ badge() }}
          </ds-badge>
        }

        @if (iconPosition() === 'end') {
          <ds-icon class="ds-accordion__chevron" name="chevronDown" size="sm" />
        }
      </button>
    </ng-template>
  `,
  styles: `
    :host {
      display: block;
    }

    /*
     * The item draws its own chrome, keyed by the variant the accordion tells it
     * about — so the accordion never reaches into a child it does not own, and a
     * lone disclosure gets no box at all.
     */
    :host(.ds-accordion-item--bordered),
    :host(.ds-accordion-item--separated) {
      padding-inline: var(--ds-space-4);
    }

    :host(.ds-accordion-item--bordered):not(:first-child),
    :host(.ds-accordion-item--flush):not(:first-child) {
      border-top: 1px solid var(--ds-color-border);
    }

    :host(.ds-accordion-item--separated) {
      border: 1px solid var(--ds-color-border);
      border-radius: var(--ds-radius-lg);
      background-color: var(--ds-color-surface);
    }

    :host(.ds-accordion-item--separated.ds-accordion-item--expanded) {
      border-color: var(--ds-color-border-strong);
    }

    .ds-accordion__header {
      display: flex;
      align-items: center;
      gap: var(--ds-space-2);
    }

    .ds-accordion__heading {
      flex: 1 1 auto;
      min-width: 0;
      margin: 0;
      font: inherit;
    }

    .ds-accordion__trigger {
      display: flex;
      align-items: center;
      gap: var(--ds-space-3);
      width: 100%;
      padding: var(--ds-space-3) var(--ds-space-1);
      border: 0;
      border-radius: var(--ds-radius-md);
      background: none;
      color: var(--ds-color-text);
      font: inherit;
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-semibold);
      text-align: start;
      cursor: pointer;
    }

    .ds-accordion__trigger:hover:not([aria-disabled='true']) {
      color: var(--ds-color-primary);
    }

    .ds-accordion__trigger:focus-visible {
      outline: 2px solid var(--ds-color-focus-ring);
      outline-offset: -2px;
    }

    /*
     * aria-disabled, not disabled: a disabled button is not focusable, and a
     * heading the arrow keys cannot reach is a heading a screen-reader user
     * cannot read. The click is swallowed instead (ARIA authoring practices).
     */
    .ds-accordion__trigger[aria-disabled='true'] {
      color: var(--ds-color-text-subtle);
      cursor: not-allowed;
    }

    .ds-accordion__label {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      flex: 1 1 auto;
      min-width: 0;
    }

    .ds-accordion__description {
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-regular);
      color: var(--ds-color-text-muted);
    }

    .ds-accordion__icon {
      flex-shrink: 0;
      color: var(--ds-color-text-subtle);
    }

    .ds-accordion__badge,
    .ds-accordion__trailing {
      flex-shrink: 0;
    }

    .ds-accordion__trailing:empty {
      display: none;
    }

    .ds-accordion__chevron {
      flex-shrink: 0;
      color: var(--ds-color-text-subtle);
      transition: transform 160ms ease;
    }

    :host(.ds-accordion-item--expanded) .ds-accordion__chevron {
      transform: rotate(180deg);
    }

    /*
     * The panel animates from 0fr to 1fr, which is the only way to transition to
     * "as tall as the content" without measuring it in JavaScript.
     */
    .ds-accordion__panel {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 180ms ease;
    }

    .ds-accordion__panel--open {
      grid-template-rows: 1fr;
    }

    .ds-accordion__content {
      overflow: hidden;
      /* Out of the tab order and the accessibility tree while it is closed. */
      visibility: hidden;
      transition: visibility 0s 180ms;
    }

    .ds-accordion__panel--open .ds-accordion__content {
      visibility: visible;
      transition-delay: 0s;
    }

    .ds-accordion__body {
      padding: 0 var(--ds-space-1) var(--ds-space-4);
      font-size: var(--ds-font-size-sm);
      color: var(--ds-color-text-muted);
    }

    @media (prefers-reduced-motion: reduce) {
      .ds-accordion__panel,
      .ds-accordion__chevron,
      .ds-accordion__content {
        transition: none;
      }
    }
  `,
})
export class AccordionItemComponent {
  /** The accordion around this item, if there is one. Alone, it is a disclosure. */
  private readonly accordion = inject(DS_ACCORDION, { optional: true });

  private readonly triggerRef = viewChild<ElementRef<HTMLButtonElement>>('triggerButton');

  /** Identity inside the accordion. Generated when omitted. */
  readonly itemId = input<string>(uniqueId('ds-accordion-item'));
  readonly label = input.required<string>();
  /** A second line under the label, inside the button. */
  readonly description = input<string>('');
  readonly icon = input<IconName | null>(null);
  /** A count, drawn inside the button. `srLabel` it with `badgeLabel`. */
  readonly badge = input<string | number | null>(null);
  readonly badgeTone = input<Tone>('neutral');
  /** The badge's accessible name: "3" is a glyph, "3 issues" is a fact. */
  readonly badgeLabel = input<string>('');
  readonly disabled = input(false);
  /** Ignored inside a `<ds-accordion>`, which sets the level for all of its items. */
  readonly headingLevel = input<AccordionHeadingLevel>(3);
  /** Ignored inside a `<ds-accordion>`. A lone disclosure wears no box. */
  readonly variant = input<AccordionVariant>('flush');

  /** Standalone only: inside an accordion, the accordion owns this. */
  readonly expanded = model(false);

  /** Emits on every open and close, however it happened. */
  readonly toggled = output<boolean>();

  /** Ids are derived from `itemId`, which the consumer may bind — so, computed. */
  protected readonly triggerId = computed(() => `${this.itemId()}-trigger`);
  protected readonly panelId = computed(() => `${this.itemId()}-panel`);

  protected readonly iconPosition = computed(() => this.accordion?.iconPosition() ?? 'end');
  protected readonly level = computed(() => this.accordion?.headingLevel() ?? this.headingLevel());
  protected readonly isDisabled = computed(
    () => this.disabled() || !!this.accordion?.disabled(),
  );

  protected readonly isExpanded = computed(() =>
    this.accordion ? this.accordion.isExpanded(this.itemId()) : this.expanded(),
  );

  protected readonly hostClasses = computed(() =>
    cx(
      'ds-accordion-item',
      `ds-accordion-item--${this.accordion?.variant() ?? this.variant()}`,
      this.isExpanded() && 'ds-accordion-item--expanded',
      this.isDisabled() && 'ds-accordion-item--disabled',
    ),
  );

  /** Moves focus to this item's header. The accordion uses it for the arrow keys. */
  focusHeader(): void {
    this.triggerRef()?.nativeElement.focus();
  }

  /** The id this item answers to. */
  get id(): string {
    return this.itemId();
  }

  protected toggle(): void {
    if (this.isDisabled()) {
      return;
    }

    if (this.accordion) {
      this.accordion.toggle(this.itemId());
    } else {
      this.expanded.set(!this.expanded());
    }

    this.toggled.emit(this.isExpanded());
  }

  /**
   * Enter and Space are the button's. Everything else is the accordion's, and
   * only when there is one: a lone disclosure has no siblings to walk to.
   */
  protected onKeydown(event: KeyboardEvent): void {
    if (!this.accordion) {
      return;
    }

    const moves = {
      ArrowDown: 'next',
      ArrowUp: 'previous',
      Home: 'first',
      End: 'last',
    } as const;

    const move = moves[event.key as keyof typeof moves];
    if (!move) {
      return;
    }

    event.preventDefault();
    this.accordion.focusSibling(this.itemId(), move);
  }

}
