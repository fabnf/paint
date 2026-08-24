import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { getIcon, type IconName } from './icon.registry';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<IconSize, string> = {
  xs: '0.75rem',
  sm: '1rem',
  md: '1.25rem',
  lg: '1.5rem',
  xl: '2rem',
};

/**
 * Atomic icon component. Renders registered SVG icons with token-driven sizing.
 *
 * @example
 * ```html
 * <ds-icon name="check" />
 * <ds-icon name="sun" size="lg" />
 * ```
 */
@Component({
  selector: 'ds-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (icon(); as icon) {
      <svg
        class="ds-icon"
        [attr.viewBox]="icon.viewBox"
        [attr.aria-hidden]="label() ? null : 'true'"
        [attr.role]="label() ? 'img' : null"
        [attr.aria-label]="label() || null"
        [style.width]="dimension()"
        [style.height]="dimension()"
        [class.ds-icon--stroke]="icon.stroke"
        [class.ds-icon--fill]="!icon.stroke"
      >
        @for (d of icon.paths; track d) {
          <path [attr.d]="d" />
        }
      </svg>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
      color: inherit;
      flex-shrink: 0;
    }

    .ds-icon {
      display: block;
    }

    .ds-icon--stroke {
      fill: none;
      stroke: currentColor;
      stroke-width: 1.75;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .ds-icon--fill {
      fill: currentColor;
      stroke: none;
    }
  `,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input<IconSize | string>('md');
  readonly label = input<string>('');

  readonly icon = computed(() => getIcon(this.name()));

  readonly dimension = computed(() => {
    const size = this.size();
    return SIZE_MAP[size as IconSize] ?? size;
  });
}
