import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DS_COMPONENTS, DS_PRIMITIVES } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * ShortcutHint — documentation page.
 */
@Component({
  selector: 'app-shortcut-hint-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI],
  templateUrl: './shortcut-hint.page.html',
  styleUrl: './components-page.scss',
})
export class ShortcutHintPage {
  readonly basicSnippet = `<ds-stack [gap]="0" [divided]="true">
  <ds-shortcut-hint label="Search" keys="⌘K" />
  <ds-shortcut-hint label="New file" keys="⌘N" />
  <ds-shortcut-hint label="Save" description="Also saves drafts." keys="⌘S" />
  <ds-shortcut-hint label="Close" keys="Esc" />
</ds-stack>`;

  readonly settingsSnippet = `<!-- The md size, with icons, for a settings page -->
<ds-shortcut-hint size="md" icon="search" label="Open the command palette" keys="⌘K" [alternatives]="['/']" />
<ds-shortcut-hint size="md" icon="sun" label="Toggle theme" description="Light, dark, or the system's." keys="⌘⇧L" />`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'keys', type: 'string | readonly string[]', default: '—', description: 'The shortcut, as <ds-kbd> takes it: "⌘K", "Ctrl+Enter", [\'Shift\', \'?\'].' },
    { name: 'label', type: 'string', default: `''`, description: 'What the shortcut does. Project content instead for a label with markup.' },
    { name: 'description', type: 'string', default: `''`, description: 'One more line under the label, quieter.' },
    { name: 'alternatives', type: 'readonly (string | readonly string[])[]', default: '[]', description: 'Other shortcuts for the same action, shown as “⌘K or /”. Not for platform detection.' },
    { name: 'orText', type: 'string', default: `'or'`, description: 'The word between alternatives.' },
    { name: 'srLabel', type: 'string', default: `''`, description: 'Spoken name of the main shortcut, when the derived one is wrong.' },
    { name: 'icon', type: 'IconName | null', default: 'null', description: 'Leading icon. Decorative.' },
    { name: 'size', type: `'sm' | 'md'`, default: `'sm'`, description: 'sm for a dense sheet; md for a settings page. The keycap follows.' },
  ];
}