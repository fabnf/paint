import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  cx,
  responsiveClasses,
  spaceToken,
  type AlignItems,
  type JustifyContent,
  type Responsive,
  type SpaceValue,
} from '../primitives.types';

export type StackOrientation = 'vertical' | 'horizontal';

/**
 * Stack — rhythm in one axis.
 *
 * Built on Bootstrap's `.vstack` / `.hstack` helpers plus `gap-*` utilities,
 * so spacing between siblings comes from Paint's space scale instead of
 * margins on children ("the stack owns the gap").
 *
 * @example
 * ```html
 * <ds-stack [gap]="4">
 *   <ds-text variant="h3">Settings</ds-text>
 *   <ds-text tone="muted">Manage your workspace.</ds-text>
 * </ds-stack>
 *
 * <ds-stack orientation="horizontal" [gap]="2" align="center">
 *   <ds-button variant="primary">Save</ds-button>
 *   <ds-button variant="ghost">Cancel</ds-button>
 * </ds-stack>
 *
 * <!-- Separated rows -->
 * <ds-stack [gap]="4" [divided]="true">…</ds-stack>
 * ```
 */
@Component({
  selector: 'ds-stack',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[style.--ds-stack-divider-offset]': 'dividerOffset()',
    // `align` is a legacy HTML presentational attribute: when written as a
    // static attribute (align="center") browsers apply it as a text-align
    // hint that inherits into all children. Paint uses `align` for flex
    // alignment, so strip the attribute from the DOM and keep only the class.
    '[attr.align]': 'null',
  },
  template: '<ng-content />',
  styles: `
    :host {
      min-width: 0;
    }

    /* Bootstrap's .vstack grows by default; Paint only opts in explicitly. */
    :host(.vstack:not(.ds-stack--grow)) {
      flex: 0 1 auto;
    }

    /* Both helpers hard-code align-self: stretch, which silently overrides
       the alignment of whatever lays the Stack out. Paint restores the CSS
       default so a parent Flex/Grid stays in charge. */
    :host(.vstack),
    :host(.hstack) {
      align-self: auto;
    }
  `,
})
export class StackComponent {
  /** Stacking axis: `vertical` → `.vstack`, `horizontal` → `.hstack`. */
  readonly orientation = input<StackOrientation>('vertical');
  /** Space token between children (`gap-*`), responsive. */
  readonly gap = input<Responsive<SpaceValue>>(4);
  /** Cross axis alignment (`align-items-*`). */
  readonly align = input<Responsive<AlignItems> | null>(null);
  /** Main axis distribution (`justify-content-*`). */
  readonly justify = input<Responsive<JustifyContent> | null>(null);
  /** Allow horizontal stacks to wrap. */
  readonly wrap = input(false);
  /** Draw a hairline separator between children. */
  readonly divided = input(false);
  /** Opt into `.vstack`'s flex-grow behaviour. */
  readonly grow = input(false);

  protected readonly classes = computed(() => {
    const vertical = this.orientation() === 'vertical';

    return cx(
      vertical ? 'vstack flex-column' : 'hstack flex-row',
      responsiveClasses('gap', this.gap()),
      responsiveClasses('align-items', this.align()),
      responsiveClasses('justify-content', this.justify()),
      this.wrap() && 'flex-wrap',
      this.divided() && 'ds-stack--divided',
      this.grow() && 'ds-stack--grow',
    );
  });

  /** Keeps content off the divider by mirroring the gap as padding. */
  protected readonly dividerOffset = computed(() => {
    if (!this.divided()) {
      return null;
    }
    const gap = this.gap();
    const base = typeof gap === 'object' ? (gap.base ?? 4) : gap;
    return `var(--ds-space-${spaceToken(base)})`;
  });
}
