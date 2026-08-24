import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DS_PRIMITIVES } from '../../design-system';

export interface ApiRow {
  /** Input / output name. */
  name: string;
  /** TypeScript type, written as authored. */
  type: string;
  /** Default value, or `—` for required inputs. */
  default?: string;
  description: string;
}

/**
 * API reference table for a primitive's inputs and outputs.
 */
@Component({
  selector: 'app-doc-api-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES],
  template: `
    <ds-box background="surface" [border]="true" radius="lg" class="api">
      <div class="api__scroll">
        <table class="table align-middle mb-0" [attr.aria-label]="label() || nameHeading() + 's'">
          <thead>
            <tr>
              <th scope="col">{{ nameHeading() }}</th>
              <th scope="col">Type</th>
              <th scope="col">Default</th>
              <th scope="col">Description</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.name) {
              <tr>
                <td>
                  <ds-text variant="code" tone="primary" [as]="'code'">{{ row.name }}</ds-text>
                </td>
                <td class="api__type">
                  <ds-text variant="code" tone="muted" [as]="'code'">{{ row.type }}</ds-text>
                </td>
                <td>
                  <ds-text variant="code" tone="subtle" [as]="'code'">{{ row.default || '—' }}</ds-text>
                </td>
                <td>
                  <ds-text variant="bodySm" [as]="'span'">{{ row.description }}</ds-text>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </ds-box>
  `,
  styles: `
    :host {
      display: block;
    }

    .api__scroll {
      overflow-x: auto;
      border-radius: var(--ds-radius-lg);
    }

    table {
      min-width: 44rem;
    }

    thead th {
      font-family: var(--ds-font-sans);
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-semibold);
      letter-spacing: var(--ds-letter-spacing-wider);
      text-transform: uppercase;
      color: var(--ds-color-text-subtle);
      background: var(--ds-color-surface-elevated);
      white-space: nowrap;
    }

    .api__type {
      max-width: 18rem;
    }
  `,
})
export class DocApiTableComponent {
  readonly rows = input.required<readonly ApiRow[]>();
  /** Column label — e.g. "Input", "Output", "Token". */
  readonly nameHeading = input<string>('Input');
  /** Accessible name for the table. Defaults to the plural of `nameHeading`. */
  readonly label = input<string>('');
}
