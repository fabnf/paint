import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DS_PRIMITIVES, IconComponent, TONES, type Tone } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Badge — documentation page.
 */
@Component({
  selector: 'app-badge-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DOC_UI, IconComponent],
  templateUrl: './badge.page.html',
  styleUrl: './primitives-page.scss',
})
export class BadgePage {
  readonly tones = TONES;

  readonly meanings: ReadonlyArray<{ tone: Tone; label: string; when: string }> = [
    { tone: 'neutral', label: 'Draft', when: 'No opinion. A count, a version, a category.' },
    { tone: 'primary', label: 'Active', when: 'The brand is involved: a plan, a selected state.' },
    { tone: 'accent', label: 'New', when: 'Worth a glance. Used sparingly or it stops working.' },
    { tone: 'success', label: 'Shipped', when: 'Something finished, and finished well.' },
    { tone: 'warning', label: 'Expiring', when: 'Still fine. Not fine for much longer.' },
    { tone: 'danger', label: 'Failed', when: 'Broken, blocked, or about to be destroyed.' },
    { tone: 'info', label: 'Beta', when: 'Context the user did not ask for but needs.' },
  ];

  readonly toneSnippet = `<!-- tone is a meaning; the theme decides the colour -->
<ds-badge tone="success">Shipped</ds-badge>
<ds-badge tone="danger" icon="warning">Failed</ds-badge>
<ds-badge tone="info" [dot]="true">Beta</ds-badge>`;

  readonly variantSnippet = `<ds-badge tone="danger" variant="soft">Failed</ds-badge>
<ds-badge tone="danger" variant="solid">Failed</ds-badge>
<ds-badge tone="danger" variant="outline">Failed</ds-badge>`;

  readonly countSnippet = `<!-- "12" is not a label. The glyph is hidden; the words are spoken. -->
<ds-badge tone="accent" [pill]="true" srLabel="12 unread messages">12</ds-badge>`;
  readonly inputs: readonly ApiRow[] = [
    { name: 'tone', type: `'neutral' | 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info'`, default: `'neutral'`, description: 'What the badge means. Resolved to colour by the theme.' },
    { name: 'variant', type: `'soft' | 'solid' | 'outline'`, default: `'soft'`, description: 'How the tone is painted.' },
    { name: 'size', type: `'sm' | 'md'`, default: `'sm'`, description: 'A badge is a label, not a headline.' },
    { name: 'pill', type: 'boolean', default: 'false', description: 'Fully rounded. Counts and statuses; a version reads better squared.' },
    { name: 'icon', type: 'IconName | null', default: 'null', description: 'Leading icon. Decorative — the label carries the meaning.' },
    { name: 'dot', type: 'boolean', default: 'false', description: 'A leading dot, where an icon would be too much.' },
    { name: 'srLabel', type: 'string', default: `''`, description: 'The accessible name when the visible content cannot be one. Hides the badge from assistive tech and speaks this instead.' },
  ];
}
