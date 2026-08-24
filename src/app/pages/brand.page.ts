import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  DS_PRIMITIVES,
  IconComponent,
  LogoComponent,
  blendModes,
  brand,
  brandAccents,
  brandGradient,
  gradients,
  type LogoSize,
  type LogoVariant,
} from '../../design-system';
import { DOC_UI, type ApiRow } from '../docs';

/**
 * Brand — Paint's identity, and the rules for using it.
 */
@Component({
  selector: 'app-brand',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DOC_UI, LogoComponent, IconComponent],
  templateUrl: './brand.page.html',
  styleUrl: './brand.page.scss',
})
export class BrandPage {
  readonly brand = brand;
  readonly gradient = brandGradient;
  readonly blend = blendModes;

  readonly mixes = [
    {
      name: 'brand',
      css: gradients.brand,
      usage: 'The signature. Logo, hero surfaces, the active tab’s stroke.',
      token: '--ds-gradient-brand',
    },
    {
      name: 'wash',
      css: gradients.wash,
      usage: 'Cooler second. Illustrations and secondary brand surfaces.',
      token: '--ds-gradient-wash',
    },
    {
      name: 'energy',
      css: gradients.energy,
      usage: 'The loud one. Once per screen, at most, and never under text.',
      token: '--ds-gradient-energy',
    },
  ];

  readonly anatomy = [
    {
      icon: 'zap' as const,
      title: 'One stroke',
      body: 'The P is a single brush path with round caps — not a letter sitting in a box. The counter of the bowl is negative space, so the mark reads at 16px.',
    },
    {
      icon: 'palette' as const,
      title: 'A wet dab',
      body: 'The magenta dab multiplies where it crosses the stroke. Real pigment mixing, resolved by a token, not a flat decal.',
    },
    {
      icon: 'sparkle' as const,
      title: 'A lime drip',
      body: 'Paint that has not dried runs. The drip is the detail that earns a smile — and the only lime on the screen.',
    },
  ];

  readonly lockups: ReadonlyArray<{ variant: LogoVariant; label: string; usage: string }> = [
    { variant: 'full', label: 'Full lockup', usage: 'Default. Headers, docs, marketing.' },
    { variant: 'mark', label: 'Mark', usage: 'Favicons, avatars, tight spaces, footers.' },
    { variant: 'wordmark', label: 'Wordmark', usage: 'When a mark already appears nearby.' },
  ];

  readonly sizes: ReadonlyArray<{ size: LogoSize; label: string }> = [
    { size: 'sm', label: '24px mark' },
    { size: 'md', label: '32px mark' },
    { size: 'lg', label: '44px mark' },
    { size: 'xl', label: '68px mark' },
  ];

  readonly accents = [
    {
      name: 'dab',
      value: brandAccents.dab,
      role: 'Magenta smear — multiplies into the mark where they meet',
    },
    { name: 'drip', value: brandAccents.drip, role: 'Lime run-off — the detail that earns a smile' },
    { name: 'wash', value: brandAccents.wash, role: 'Sky wash — illustrations and empty states' },
  ];

  readonly voice = [
    {
      title: 'Plain, then precise',
      do: 'Stack owns the gap between its children.',
      dont: 'Leverage our best-in-class spacing orchestration layer.',
    },
    {
      title: 'Name the token',
      do: 'Padding 6 (1.5rem) from the space scale.',
      dont: 'A bit more padding, around 25-ish pixels.',
    },
    {
      title: 'Say what it is built on',
      do: 'Dialog wraps Bootstrap .modal and traps focus itself.',
      dont: 'Dialog is fully custom and magic.',
    },
  ];

  readonly rules = {
    do: [
      'Keep the mark on its own gradient, on ink, or in mono on a brand surface.',
      'Give the lockup clear space equal to the height of the bowl.',
      'Let the dab and the drip be the only decoration in a lockup.',
      'Call it "Paint" — sentence case, always.',
    ],
    dont: [
      'Re-colour the stroke, rotate the mark, or straighten the drip.',
      'Re-set the wordmark in another typeface.',
      'Put the colour mark on a saturated background — use mono.',
      'Write "PAINT", "paint" or "Paint DS".',
    ],
  };

  readonly logoApi: readonly ApiRow[] = [
    {
      name: 'variant',
      type: `'full' | 'mark' | 'wordmark'`,
      default: `'full'`,
      description: 'Which part of the lockup to render.',
    },
    {
      name: 'size',
      type: `'sm' | 'md' | 'lg' | 'xl'`,
      default: `'md'`,
      description: 'Brand-approved sizes. Mark and wordmark scale together.',
    },
    { name: 'tagline', type: 'boolean', default: 'false', description: 'Shows the "Design System" descriptor under the wordmark.' },
    {
      name: 'underline',
      type: 'boolean',
      default: 'false',
      description: 'Brushes the accent stroke under the wordmark. Display moments only.',
    },
    { name: 'mono', type: 'boolean', default: 'false', description: 'Single-colour lockup that inherits currentColor.' },
    {
      name: 'label',
      type: 'string',
      default: `'Paint · An atomic design system'`,
      description: 'Accessible name for the lockup.',
    },
  ];

  readonly logoSnippet = `<ds-logo />
<ds-logo variant="mark" size="sm" />
<ds-logo size="xl" [tagline]="true" [underline]="true" />
<ds-logo [mono]="true" />`;

  readonly brandTokenSnippet = `import { brand, brandGradient, brandAccents, blendModes } from './design-system';

brand.name;          // 'Paint'
brand.headline;      // '${brand.headline}'
brand.releaseName;   // '${brand.releaseName}'
brandGradient.css;   // magenta → violet → ink
brandAccents.drip;   // '${brandAccents.drip}'
blendModes.light;    // 'multiply'  — wet paint darkens on paper
blendModes.dark;     // 'screen'    — pigment lightens on a lit canvas`;

  readonly textureSnippet = `<!-- Grain belongs on brand surfaces, never on text -->
<div class="bg-brand ds-grain rounded-2xl p-8">…</div>

<!-- Highlighter swipe behind inline text -->
<ds-text variant="display">Paint it. <span class="ds-marker">Ship it.</span></ds-text>`;
}
