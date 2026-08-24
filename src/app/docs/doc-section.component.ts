import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DS_PRIMITIVES } from '../../design-system';

/**
 * A documentation section with a linkable heading.
 */
@Component({
  selector: 'app-doc-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES],
  template: `
    <section [id]="anchor()" class="doc-section">
      <ds-stack [gap]="6">
        <ds-stack [gap]="2">
          <ds-flex align="center" [gap]="2">
            <ds-text variant="h3" [as]="'h2'">{{ heading() }}</ds-text>
            <a class="doc-section__anchor" [href]="'#' + anchor()" [attr.aria-label]="'Link to ' + heading()">#</a>
          </ds-flex>
          @if (description()) {
            <ds-text tone="muted" class="doc-section__lede">{{ description() }}</ds-text>
          }
        </ds-stack>

        <ng-content />
      </ds-stack>
    </section>
  `,
  styles: `
    :host {
      display: block;
      scroll-margin-top: 6rem;
    }

    .doc-section__anchor {
      color: var(--ds-color-text-subtle);
      text-decoration: none;
      font-family: var(--ds-font-mono);
      opacity: 0;
      transition: opacity 140ms ease;
    }

    .doc-section:hover .doc-section__anchor,
    .doc-section__anchor:focus-visible {
      opacity: 1;
    }

    .doc-section__lede {
      max-width: 60ch;
    }
  `,
})
export class DocSectionComponent {
  readonly heading = input.required<string>();
  readonly description = input<string>('');
  readonly anchor = input.required<string>();
}
