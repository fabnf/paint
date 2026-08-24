import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DS_COMPONENTS, DS_PRIMITIVES, ToastService, type MenuEntry } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Toolbar — documentation page.
 */
@Component({
  selector: 'app-toolbar-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI],
  templateUrl: './toolbar.page.html',
  styleUrl: './components-page.scss',
})
export class ToolbarPage {
  private readonly toasts = inject(ToastService);

  readonly bold = signal(false);
  readonly italic = signal(false);
  readonly query = signal('');

  readonly exports: readonly MenuEntry[] = [
    { id: 'csv', label: 'Export as CSV', icon: 'download' },
    { id: 'json', label: 'Export as JSON', icon: 'code' },
    { type: 'divider' },
    { id: 'print', label: 'Print', icon: 'window', shortcut: '⌘P', keyShortcuts: 'Meta+P' },
  ];

  run(action: string): void {
    this.toasts.info(action);
  }

  readonly basicSnippet = `<ds-toolbar ariaLabel="Document actions">
  <ds-button variant="ghost" iconStart="edit" label="Rename" />
  <ds-button variant="ghost" iconStart="copy" label="Duplicate" />
  <ds-divider orientation="vertical" [spacing]="0" />
  <ds-menu label="Export" icon="download" [entries]="exports" />
</ds-toolbar>

<!-- Eight buttons in a row are eight tab stops. This is one. -->`;

  readonly keyboardSnippet = `// Tab          enters the toolbar, and leaves it
// ← →          the previous / next control, wrapping
// Home End     the first / last control
//
// In a text field the arrows are the caret's — until the caret is at
// the edge it is being pressed towards, which is when the user meant
// the toolbar. Home and End are always the caret's.`;

  readonly mixedSnippet = `<!-- It manages whatever is projected, without any of it knowing -->
<ds-toolbar ariaLabel="Invoice list" [bordered]="true">
  <ds-search-field [labelHidden]="true" label="Filter" size="sm" />
  <ds-select [options]="pageSizes" size="sm" label="Rows per page" />
  <ds-divider orientation="vertical" [spacing]="0" />
  <ds-button variant="ghost" size="sm" iconStart="download" label="Export" />
</ds-toolbar>`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'ariaLabel', type: 'string', default: `''`, description: 'Names the toolbar. A page with two of them needs two names.' },
    { name: 'ariaLabelledBy', type: 'string', default: `''`, description: 'Id of a visible heading that names it. Takes precedence.' },
    { name: 'orientation', type: `'horizontal' | 'vertical'`, default: `'horizontal'`, description: 'Which arrows move focus, and which way it lays out.' },
    { name: 'gap', type: 'SpaceValue', default: '1', description: 'Space between the controls, in space tokens.' },
    { name: 'wrap', type: 'boolean', default: 'false', description: 'Let the cluster wrap onto a second line.' },
    { name: 'bordered', type: 'boolean', default: 'false', description: 'A box around the cluster, for a toolbar that floats over content.' },
    { name: 'roving', type: 'boolean', default: 'true', description: 'Manage the roving tabindex. Off when something else already owns the keyboard inside it.' },
  ];
}
