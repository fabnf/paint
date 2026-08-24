import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DS_PRIMITIVES, typeRamp, type TextTone, type TextVariant } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Text — documentation page.
 */
@Component({
  selector: 'app-text-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DOC_UI],
  templateUrl: './text.page.html',
  styleUrl: './primitives-page.scss',
})
export class TextPage {
  readonly variants = (
    Object.keys(typeRamp) as TextVariant[]
  ).map((variant) => ({
    variant,
    element: DEFAULT_ELEMENT[variant],
    bootstrap: BOOTSTRAP_CLASS[variant],
    sample: SAMPLES[variant],
  }));

  readonly tones: ReadonlyArray<{ tone: TextTone; usage: string }> = [
    { tone: 'default', usage: 'Body copy' },
    { tone: 'muted', usage: 'Secondary copy' },
    { tone: 'subtle', usage: 'Metadata, hints' },
    { tone: 'primary', usage: 'Emphasis, links' },
    { tone: 'success', usage: 'Positive status' },
    { tone: 'warning', usage: 'Caution status' },
    { tone: 'danger', usage: 'Error status' },
    { tone: 'info', usage: 'Neutral status' },
  ];

  readonly weights = ['regular', 'medium', 'semibold', 'bold'] as const;

  readonly rampSnippet = `<ds-text variant="display">Paint</ds-text>
<ds-text variant="h1">Page title</ds-text>
<ds-text variant="h2">Section</ds-text>
<ds-text variant="body">Body copy.</ds-text>
<ds-text variant="label">Field label</ds-text>
<ds-text variant="caption">Helper text</ds-text>
<ds-text variant="code">--ds-color-primary</ds-text>`;

  readonly semanticSnippet = `<!-- A heading that is not an <h1> -->
<ds-text variant="h1" as="p">Looks like a title, reads as a paragraph</ds-text>

<!-- An <h2> that is visually small -->
<ds-text variant="label" as="h2">Related projects</ds-text>

<!-- The label style only becomes a <label> when it labels a control -->
<ds-text variant="label" as="label">Workspace name</ds-text>`;

  readonly toneSnippet = `<ds-text tone="muted">Billed monthly</ds-text>
<ds-text tone="success" variant="label">Paid</ds-text>
<ds-text tone="danger" variant="label">Payment failed</ds-text>`;

  readonly truncateSnippet = `<ds-text [truncate]="true">One long line that ends in an ellipsis…</ds-text>
<ds-text [lineClamp]="2">Clamped to exactly two lines…</ds-text>`;

  readonly inlineSnippet = `<ds-text>
  Spacing uses the
  <ds-text variant="code" as="code" [inline]="true">--ds-space-*</ds-text>
  scale.
</ds-text>`;

  readonly longform = `Paint keeps the visual hierarchy and the document outline independent. A heading that looks
    large is not automatically an h1, and a label that looks small can still be the section heading a
    screen reader announces. Pick the variant for the eye, and the element for the structure.`;

  readonly inputs: readonly ApiRow[] = [
    {
      name: 'variant',
      type: `'display' | 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodyLg' | 'bodySm' | 'label' | 'caption' | 'code'`,
      default: `'body'`,
      description: 'Step on the type ramp. Maps to Bootstrap typography classes.',
    },
    {
      name: 'as',
      type: `'h1'…'h6' | 'p' | 'span' | 'div' | 'label' | 'code' | 'small' | 'strong' | null`,
      default: 'null',
      description:
        'Overrides the element the variant would pick — e.g. as="label" to bind the label style to a real control.',
    },
    {
      name: 'tone',
      type: `'default' | 'muted' | 'subtle' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'on-primary'`,
      default: `'default'`,
      description: 'Semantic color role.',
    },
    { name: 'weight', type: `'regular' | 'medium' | 'semibold' | 'bold' | null`, default: 'null', description: 'Overrides the variant’s weight.' },
    { name: 'align', type: `Responsive<'start' | 'center' | 'end'> | null`, default: 'null', description: 'Text alignment, per breakpoint.' },
    { name: 'truncate', type: 'boolean', default: 'false', description: 'Single-line ellipsis.' },
    { name: 'lineClamp', type: 'number | null', default: 'null', description: 'Clamp to N lines. Wins over truncate.' },
    { name: 'inline', type: 'boolean', default: 'false', description: 'Renders inline, for text inside a sentence.' },
    { name: 'uppercase', type: 'boolean', default: 'false', description: 'Uppercase with tracking, for eyebrows.' },
    { name: 'italic', type: 'boolean', default: 'false', description: 'Italicises the text.' },
  ];
}

const DEFAULT_ELEMENT: Record<TextVariant, string> = {
  display: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  body: 'p',
  bodyLg: 'p',
  bodySm: 'p',
  label: 'span',
  caption: 'span',
  code: 'code',
};

const BOOTSTRAP_CLASS: Record<TextVariant, string> = {
  display: '.display-5',
  h1: '.h1',
  h2: '.h2',
  h3: '.h3',
  h4: '.h4',
  body: '—',
  bodyLg: '.lead',
  bodySm: '.small',
  label: '.small .fw-medium',
  caption: '.small',
  code: '.font-monospace .small',
};

const SAMPLES: Record<TextVariant, string> = {
  display: 'Paint',
  h1: 'Page title',
  h2: 'Section heading',
  h3: 'Subsection heading',
  h4: 'Card title',
  body: 'Body copy carries the explanation. It should stay comfortable at 60–75 characters per line.',
  bodyLg: 'Lede copy introduces a page in one confident sentence.',
  bodySm: 'Small copy supports dense UI without shouting.',
  label: 'Field label',
  caption: 'Helper text and metadata',
  code: 'var(--ds-color-primary)',
};
