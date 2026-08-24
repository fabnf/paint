import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { DS_PRIMITIVES, uniqueId } from '../../design-system';
import { DocCodeComponent } from './doc-code.component';

/**
 * A live example: rendered preview on top, toggleable source underneath.
 */
@Component({
  selector: 'app-doc-example',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DocCodeComponent],
  template: `
    <ds-box background="surface" [border]="true" radius="lg" class="doc-example">
      @if (title() || code()) {
        <ds-flex
          class="doc-example__head"
          justify="between"
          align="center"
          [gap]="3"
          [wrap]="'wrap'"
        >
          <ds-stack [gap]="1">
            @if (title()) {
              <ds-text variant="label">{{ title() }}</ds-text>
            }
            @if (description()) {
              <ds-text variant="caption">{{ description() }}</ds-text>
            }
          </ds-stack>

          @if (code()) {
            <ds-button
              variant="ghost"
              size="sm"
              iconStart="code"
              [ariaExpanded]="showCode()"
              [ariaControls]="codeId"
              (clicked)="showCode.set(!showCode())"
            >
              {{ showCode() ? 'Hide code' : 'Show code' }}
            </ds-button>
          }
        </ds-flex>
      }

      <div class="doc-example__preview" [class.doc-example__preview--plain]="plain()">
        <ng-content />
      </div>

      @if (code() && showCode()) {
        <div class="doc-example__code" [id]="codeId">
          <app-doc-code [code]="code()" [language]="language()" />
        </div>
      }
    </ds-box>
  `,
  styles: `
    :host {
      display: block;
    }

    .doc-example__head {
      padding: var(--ds-space-3) var(--ds-space-4);
      border-bottom: 1px solid var(--ds-color-border);
    }

    .doc-example__preview {
      padding: var(--ds-space-6);
      background:
        radial-gradient(circle at 1px 1px, var(--ds-color-border) 1px, transparent 0) 0 0 / 12px 12px;
      border-radius: 0 0 var(--ds-radius-lg) var(--ds-radius-lg);
    }

    .doc-example__preview--plain {
      background: none;
    }

    .doc-example__code {
      padding: var(--ds-space-4);
      border-top: 1px solid var(--ds-color-border);
    }

    .doc-example__code + .doc-example__preview,
    .doc-example__preview:has(+ .doc-example__code) {
      border-radius: 0;
    }
  `,
})
export class DocExampleComponent {
  readonly title = input<string>('');
  readonly description = input<string>('');
  /** Source shown by the "Show code" toggle. */
  readonly code = input<string>('');
  readonly language = input<string>('html');
  /** Drop the dotted canvas behind the preview. */
  readonly plain = input(false);

  protected readonly showCode = signal(false);
  protected readonly codeId = uniqueId('app-doc-example-code');
}
