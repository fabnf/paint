import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DS_PRIMITIVES, IconComponent } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Kbd — documentation page.
 */
@Component({
  selector: 'app-kbd-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DOC_UI, IconComponent],
  templateUrl: './kbd.page.html',
  styleUrl: './primitives-page.scss',
})
export class KbdPage {
  readonly basicSnippet = `<!-- One key: exactly what you typed -->
<ds-kbd>Esc</ds-kbd>

<!-- A combination: one keycap per key, a "+" between them -->
<ds-kbd keys="Ctrl+Enter" />
<ds-kbd keys="⌘⇧P" />`;

  readonly spokenSnippet = `<!-- ⌘K is announced as "Command K", not "place of interest sign K" -->
<ds-kbd keys="⌘K" />

<!-- Projected content has no keys to derive from: say the words yourself -->
<ds-kbd srLabel="Escape">Esc</ds-kbd>

<!-- An array is taken as written, "+" and all -->
<ds-kbd [keys]="['Ctrl', '+']" />`;

  readonly inlineSnippet = `<ds-text>
  Press <ds-kbd size="md">Tab</ds-kbd> to move between fields, and
  <ds-kbd size="md" keys="⇧⇥" /> to move back.
</ds-text>

<!-- In a menu row, a tooltip or a search field, the small size sits beside the text -->
<ds-flex align="center" [gap]="2">
  <ds-text variant="bodySm">Search</ds-text>
  <ds-kbd keys="⌘K" />
</ds-flex>`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'keys', type: 'string | readonly string[] | null', default: 'null', description: 'The key or combination. A string is split on "+"; a modifier glyph glued to a key (⌘K) is two keys. An array is taken as written. Unset to project the content yourself.' },
    { name: 'size', type: `'sm' | 'md'`, default: `'sm'`, description: 'sm sits inside controls, menus and tooltips; md sits in running text.' },
    { name: 'srLabel', type: 'string', default: `''`, description: 'What a screen reader says instead of the visible glyphs. Derived from keys when they contain glyphs Paint knows; required for projected glyphs.' },
  ];
}