import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { ButtonComponent } from '../../design-system';

/**
 * Code block with copy-to-clipboard. Documentation chrome, not a Paint primitive.
 */
@Component({
  selector: 'app-doc-code',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  template: `
    <div class="doc-code">
      @if (language()) {
        <span class="doc-code__lang">{{ language() }}</span>
      }
      <!--
        The block scrolls horizontally, so it is focusable — a keyboard user has
        no other way to reach the overflow. Deliberately *not* a landmark: a page
        with several samples would end up with a pile of identically named
        regions.
      -->
      <pre
        class="doc-code__pre"
        tabindex="0"
        [attr.aria-label]="(language() || 'code') + ' sample'"
      ><code>{{ code().trim() }}</code></pre>
      <div class="doc-code__actions">
        <ds-button
          variant="ghost"
          size="sm"
          [iconStart]="copied() ? 'check' : 'copy'"
          [label]="copied() ? 'Copied' : 'Copy code'"
          (clicked)="copy()"
        />
        <!-- A changed icon is invisible to a screen reader; this is not. -->
        <span class="visually-hidden" role="status">{{ status() }}</span>
      </div>
    </div>
  `,
  styles: `
    .doc-code {
      position: relative;
      background: var(--ds-color-surface-elevated);
      border: 1px solid var(--ds-color-border);
      border-radius: var(--ds-radius-md);
    }

    .doc-code__pre:focus-visible {
      outline: 2px solid var(--ds-color-focus-ring);
      outline-offset: 2px;
    }

    .doc-code__pre {
      margin: 0;
      padding: var(--ds-space-4);
      padding-inline-end: var(--ds-space-12);
      overflow-x: auto;
      font-family: var(--ds-font-mono);
      font-size: var(--ds-font-size-sm);
      line-height: var(--ds-line-height-relaxed);
      color: var(--ds-color-text);
      tab-size: 2;
    }

    .doc-code__lang {
      position: absolute;
      inset-block-start: var(--ds-space-2);
      inset-inline-start: var(--ds-space-4);
      font-family: var(--ds-font-mono);
      font-size: var(--ds-font-size-xs);
      color: var(--ds-color-text-subtle);
      text-transform: uppercase;
      letter-spacing: var(--ds-letter-spacing-wider);
    }

    .doc-code__lang + .doc-code__pre {
      padding-block-start: var(--ds-space-8);
    }

    .doc-code__actions {
      position: absolute;
      inset-block-start: var(--ds-space-2);
      inset-inline-end: var(--ds-space-2);
    }
  `,
})
export class DocCodeComponent {
  readonly code = input.required<string>();
  readonly language = input<string>('html');

  protected readonly copied = signal(false);
  protected readonly status = signal('');

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard?.writeText(this.code().trim());
      this.copied.set(true);
      this.status.set('Copied to clipboard');
      setTimeout(() => {
        this.copied.set(false);
        this.status.set('');
      }, 1600);
    } catch {
      this.status.set('Copying is unavailable in this browser');
    }
  }
}
