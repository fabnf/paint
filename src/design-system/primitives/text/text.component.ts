import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { cx, type Responsive, responsiveClasses } from '../primitives.types';

/** Named steps of Paint's type ramp (`tokens/typography.tokens.ts`). */
export type TextVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'body'
  | 'bodyLg'
  | 'bodySm'
  | 'label'
  | 'caption'
  | 'code';

export type TextElement =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'p'
  | 'span'
  | 'div'
  | 'label'
  | 'code'
  | 'small'
  | 'strong';

export type TextTone =
  | 'default'
  | 'muted'
  | 'subtle'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'on-primary';

export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';
export type TextAlign = 'start' | 'center' | 'end';

/** variant → Bootstrap typography classes. */
const VARIANT_CLASS: Record<TextVariant, string> = {
  display: 'display-5',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  body: '',
  bodyLg: 'lead',
  bodySm: 'small',
  label: 'small fw-medium',
  caption: 'small',
  code: 'font-monospace small',
};

/**
 * variant → default semantic element. Override with `as`.
 *
 * `label` is a *type style*, not a promise of a form label: it defaults to a
 * `<span>` so it never claims a control it is not bound to. Pass
 * `as="label"` when it really labels an input.
 */
const VARIANT_ELEMENT: Record<TextVariant, TextElement> = {
  display: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  body: 'p',
  bodyLg: 'p',
  bodySm: 'p',
  label: 'span',
  caption: 'span',
  code: 'code',
};

const TONE_CLASS: Record<TextTone, string> = {
  default: '',
  muted: 'text-body-secondary',
  subtle: 'text-subtle',
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
  'on-primary': 'text-on-primary',
};

const WEIGHT_CLASS: Record<TextWeight, string> = {
  regular: 'fw-normal',
  medium: 'fw-medium',
  semibold: 'fw-semibold',
  bold: 'fw-bold',
};

/**
 * Text — every string on screen, typed.
 *
 * Maps Paint's type ramp and text tones onto Bootstrap's typography classes
 * (`.h1`–`.h4`, `.display-5`, `.lead`, `.small`, `.fw-*`, `.text-*`) and picks
 * a sensible semantic element per variant, so visual hierarchy never forces
 * the wrong markup.
 *
 * @example
 * ```html
 * <ds-text variant="h2">Foundations</ds-text>
 *
 * <!-- Looks like a heading, stays a paragraph -->
 * <ds-text variant="h3" as="p">Visually big, semantically calm</ds-text>
 *
 * <ds-text tone="muted" [truncate]="true">Long single-line description…</ds-text>
 * <ds-text variant="code">--ds-color-primary</ds-text>
 * ```
 */
@Component({
  selector: 'ds-text',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  template: `
    @switch (element()) {
      @case ('h1') {
        <h1 [class]="classes()"><ng-container [ngTemplateOutlet]="content" /></h1>
      }
      @case ('h2') {
        <h2 [class]="classes()"><ng-container [ngTemplateOutlet]="content" /></h2>
      }
      @case ('h3') {
        <h3 [class]="classes()"><ng-container [ngTemplateOutlet]="content" /></h3>
      }
      @case ('h4') {
        <h4 [class]="classes()"><ng-container [ngTemplateOutlet]="content" /></h4>
      }
      @case ('h5') {
        <h5 [class]="classes()"><ng-container [ngTemplateOutlet]="content" /></h5>
      }
      @case ('h6') {
        <h6 [class]="classes()"><ng-container [ngTemplateOutlet]="content" /></h6>
      }
      @case ('span') {
        <span [class]="classes()"><ng-container [ngTemplateOutlet]="content" /></span>
      }
      @case ('div') {
        <div [class]="classes()"><ng-container [ngTemplateOutlet]="content" /></div>
      }
      @case ('label') {
        <label [class]="classes()"><ng-container [ngTemplateOutlet]="content" /></label>
      }
      @case ('code') {
        <code [class]="classes()"><ng-container [ngTemplateOutlet]="content" /></code>
      }
      @case ('small') {
        <small [class]="classes()"><ng-container [ngTemplateOutlet]="content" /></small>
      }
      @case ('strong') {
        <strong [class]="classes()"><ng-container [ngTemplateOutlet]="content" /></strong>
      }
      @default {
        <p [class]="classes()"><ng-container [ngTemplateOutlet]="content" /></p>
      }
    }

    <!--
      A component may only declare one <ng-content> per slot: duplicating it
      across the branches above would leave every branch but the first empty.
      Declaring it once here and stamping it with ngTemplateOutlet keeps the
      projected nodes intact whichever element wins.
    -->
    <ng-template #content><ng-content /></ng-template>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    :host([inline='true']) {
      display: inline;
    }

    /* Paint's ramp details Bootstrap has no class for. */
    .ds-text--display-font {
      font-family: var(--ds-font-display);
      letter-spacing: var(--ds-letter-spacing-tight);
    }

    .ds-text--display {
      letter-spacing: var(--ds-letter-spacing-tighter);
      line-height: var(--ds-line-height-tight);
    }

    .ds-text--label {
      letter-spacing: var(--ds-letter-spacing-wide);
    }

    .ds-text--caption {
      letter-spacing: var(--ds-letter-spacing-wide);
      color: var(--ds-color-text-muted);
    }

    .ds-text--clamp {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: var(--ds-text-clamp, 2);
      line-clamp: var(--ds-text-clamp, 2);
      overflow: hidden;
    }
  `,
  host: {
    '[attr.inline]': 'inline() ? "true" : null',
    '[style.--ds-text-clamp]': 'lineClamp()',
    // `align` is a legacy presentational attribute that browsers turn into an
    // inherited text-align hint — Paint applies alignment as a class instead.
    '[attr.align]': 'null',
  },
})
export class TextComponent {
  /** Step on Paint's type ramp. */
  readonly variant = input<TextVariant>('body');
  /** Override the rendered element without changing the look. */
  readonly as = input<TextElement | null>(null);
  /** Semantic color role. */
  readonly tone = input<TextTone>('default');
  /** Overrides the variant's weight. */
  readonly weight = input<TextWeight | null>(null);
  /** Text alignment (`text-*`), responsive. */
  readonly align = input<Responsive<TextAlign> | null>(null);
  /** Truncate a single line with an ellipsis (`text-truncate`). */
  readonly truncate = input(false);
  /** Clamp to N lines. Wins over `truncate`. */
  readonly lineClamp = input<number | null>(null);
  /** Render inline, for text inside a sentence. */
  readonly inline = input(false);
  /** Uppercase with tracking, for eyebrows and table headers. */
  readonly uppercase = input(false);
  /** Italicise. */
  readonly italic = input(false);

  protected readonly element = computed<TextElement>(() => this.as() ?? VARIANT_ELEMENT[this.variant()]);

  protected readonly classes = computed(() => {
    const variant = this.variant();
    const usesDisplayFont = variant === 'display' || variant === 'h1' || variant === 'h2';

    return cx(
      VARIANT_CLASS[variant],
      usesDisplayFont && 'ds-text--display-font',
      variant === 'display' && 'ds-text--display',
      variant === 'label' && 'ds-text--label',
      variant === 'caption' && 'ds-text--caption',
      TONE_CLASS[this.tone()],
      this.weight() ? WEIGHT_CLASS[this.weight()!] : '',
      responsiveClasses('text', this.align()),
      this.lineClamp() ? 'ds-text--clamp' : this.truncate() && 'text-truncate',
      this.uppercase() && 'text-uppercase',
      this.italic() && 'fst-italic',
      'mb-0',
    );
  });
}
