import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DS_PRIMITIVES, type IconName } from '../../design-system';

/** Where a page sits in the atomic hierarchy. */
export type AtomicLayer = 'Foundation' | 'Primitive' | 'Molecule' | 'Organism' | 'Brand' | 'Overview';

/**
 * Page header: atomic layer, title, lede, and what the page is built on.
 */
@Component({
  selector: 'app-doc-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES],
  template: `
    <ds-stack [gap]="4" class="header">
      <!-- The docs site is a consumer of the system: these are <ds-badge>s, not
           three one-off spans that happen to look like badges. -->
      <ds-flex align="center" [gap]="2" [wrap]="'wrap'">
        <ds-badge tone="primary" [icon]="icon()">{{ layer() }}</ds-badge>
        @if (builtOn()) {
          <ds-badge tone="neutral" variant="outline">Built on {{ builtOn() }}</ds-badge>
        }
        @if (status()) {
          <ds-badge tone="success">{{ status() }}</ds-badge>
        }
      </ds-flex>

      <ds-stack [gap]="3">
        <ds-text variant="h1">{{ title() }}</ds-text>
        @if (lede()) {
          <ds-text variant="bodyLg" tone="muted" class="header__lede">{{ lede() }}</ds-text>
        }
      </ds-stack>

      <ng-content />
    </ds-stack>
  `,
  styles: `
    :host {
      display: block;
    }

    .header__lede {
      max-width: 62ch;
    }
  `,
})
export class DocPageHeaderComponent {
  readonly layer = input<AtomicLayer>('Primitive');
  readonly icon = input<IconName>('layers');
  readonly title = input.required<string>();
  readonly lede = input<string>('');
  /** The Bootstrap surface this page's component is composed from. */
  readonly builtOn = input<string>('');
  /** Maturity flag, e.g. "Stable". */
  readonly status = input<string>('');
}
