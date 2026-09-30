import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DS_COMPONENTS, DS_PRIMITIVES } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Figure — documentation page.
 */
@Component({
  selector: 'app-figure-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI],
  templateUrl: './figure.page.html',
  styleUrl: './components-page.scss',
})
export class FigurePage {
  readonly wide = 'showcase/wet-paint-wide.svg';
  readonly square = 'showcase/wet-paint-square.svg';
  readonly tall = 'showcase/wet-paint-tall.svg';

  readonly basicSnippet = `<ds-figure
  src="/plates/wet-paint.jpg"
  alt="A violet wash with a magenta bleed and a lime sun"
  ratio="16/9"
  caption="Plate 3 — the first Wet Paint swatch, mixed on paper."
  credit="Photo: Ada Lovelace"
  creditHref="https://example.com/ada"
/>`;

  readonly linkSnippet = `<!-- The picture is the link, named by its alt. The credit is a second, different link. -->
<ds-figure
  [src]="thumb"
  alt="Floor plan, level 2"
  ratio="4/3"
  href="/plans/level-2.pdf"
  target="_blank"
  caption="Level 2, as built."
  credit="© 2026 Paint Architects"
  creditHref="/about"
/>`;

  readonly richSnippet = `<!-- A caption with markup goes in the slot; the figure is still named by it -->
<ds-figure [src]="plan" alt="Floor plan, level 2" ratio="3/2">
  <span dsFigureCaption>
    Level 2, as built. <ds-link href="/plans/level-2.dwg">Download the drawing</ds-link>.
  </span>
</ds-figure>`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'src', type: 'string | null', default: 'null', description: 'The picture. null shows the image atom’s fallback.' },
    { name: 'alt', type: 'string', default: `''`, description: 'What the picture shows. Empty makes it decorative — only when the caption already says everything.' },
    { name: 'caption', type: 'string', default: `''`, description: 'Why the picture is here. Use the [dsFigureCaption] slot for markup.' },
    { name: 'credit', type: 'string', default: `''`, description: 'Who made it: “Photo: Ada Lovelace”, “© 2026 Paint”.' },
    { name: 'creditHref / creditLink / creditTarget', type: 'string | null', default: 'null', description: 'Makes the credit a link.' },
    { name: 'href / link / target', type: 'string | null', default: 'null', description: 'Wraps the picture in a link, named by the alt.' },
    { name: 'ratio', type: 'ImageRatio | null', default: 'null', description: 'The frame’s proportions, as on <ds-image>.' },
    { name: 'fit / position', type: `ImageFit / string`, default: `'cover' / ''`, description: 'How the picture fills the frame, and which part survives a crop.' },
    { name: 'radius', type: 'Radius', default: `'md'`, description: 'Corner radius, from the tokens.' },
    { name: 'loading', type: `'lazy' | 'eager'`, default: `'lazy'`, description: 'The native attribute.' },
    { name: 'fallbackText', type: 'string', default: `''`, description: 'Words in the fallback when there is no picture.' },
    { name: 'captionAlign', type: `'start' | 'center'`, default: `'start'`, description: 'Caption alignment under the picture.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'loaded', type: 'OutputEmitterRef<void>', default: '—', description: 'The picture arrived.' },
    { name: 'failed', type: 'OutputEmitterRef<void>', default: '—', description: 'The picture did not; the fallback is showing.' },
  ];

  readonly slots: readonly ApiRow[] = [
    { name: '[dsFigureCaption]', type: 'directive', default: '—', description: 'Projected caption content with markup. Rendered after the caption text.' },
  ];
}