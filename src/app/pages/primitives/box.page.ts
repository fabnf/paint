import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  DS_PRIMITIVES,
  SPACE_TOKENS,
  spacingScale,
  type Elevation,
  type Radius,
  type SpaceValue,
  type Surface,
} from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Box — documentation page.
 */
@Component({
  selector: 'app-box-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DOC_UI],
  templateUrl: './box.page.html',
  styleUrl: './primitives-page.scss',
})
export class BoxPage {
  readonly surfaces: ReadonlyArray<{ surface: Surface; usage: string }> = [
    { surface: 'transparent', usage: 'Inherits what is behind it' },
    { surface: 'canvas', usage: 'The page background' },
    { surface: 'surface', usage: 'Cards and panels' },
    { surface: 'surface-sunken', usage: 'Wells, code, table heads' },
    { surface: 'primary', usage: 'Brand emphasis' },
    { surface: 'primary-muted', usage: 'Quiet brand tint' },
    { surface: 'accent', usage: 'The loud brand role' },
    { surface: 'accent-muted', usage: 'Quiet accent tint' },
    { surface: 'success-muted', usage: 'Positive callouts' },
    { surface: 'warning-muted', usage: 'Caution callouts' },
    { surface: 'danger-muted', usage: 'Destructive callouts' },
    { surface: 'info-muted', usage: 'Informational callouts' },
  ];

  /** The paint mixes carry their own text color: a gradient has no semantic role. */
  readonly mixes: ReadonlyArray<{ surface: Surface; usage: string }> = [
    { surface: 'brand', usage: 'The signature mix' },
    { surface: 'wash', usage: 'Cooler second' },
    { surface: 'energy', usage: 'Once per screen' },
  ];

  readonly radii: readonly Radius[] = ['none', 'sm', 'md', 'lg', 'xl', '2xl', 'full', 'blob'];
  readonly elevations: readonly Elevation[] = ['none', 'sm', 'md', 'lg', 'xl', 'glow'];

  /** Live padding playground. */
  readonly padding = signal<SpaceValue>(6);
  /** Whole steps up to 12 keep the playground readable. */
  readonly paddingTokens = SPACE_TOKENS.filter((token) => Number.isInteger(token) && token <= 12);

  paddingRem(token: SpaceValue): string {
    return spacingScale[token as keyof typeof spacingScale] ?? '';
  }

  setPadding(token: SpaceValue): void {
    this.padding.set(token);
  }

  readonly surfaceSnippet = `<ds-box background="surface" [border]="true" radius="lg" [padding]="6">
  Card surface
</ds-box>

<ds-box background="primary-muted" radius="lg" [padding]="6">
  Quiet brand tint
</ds-box>

<!-- Brand mixes bring their own text color -->
<ds-box background="brand" radius="2xl" [padding]="8" class="ds-grain">
  Wet paint
</ds-box>`;

  readonly spacingSnippet = `<!-- Single token -->
<ds-box [padding]="6">…</ds-box>

<!-- Per axis -->
<ds-box [paddingX]="6" [paddingY]="4">…</ds-box>

<!-- Per side, direction aware -->
<ds-box [paddingStart]="4" [paddingEnd]="2" [marginBottom]="8">…</ds-box>

<!-- Responsive: p-4 on mobile, p-10 from md up -->
<ds-box [padding]="{ base: 4, md: 10 }">…</ds-box>`;

  readonly compositionSnippet = `<!-- Box supplies the surface, Stack the rhythm, Text the type -->
<ds-box background="surface" [border]="true" radius="lg" elevation="sm" [padding]="6">
  <ds-stack [gap]="3">
    <ds-text variant="h4">Storage</ds-text>
    <ds-text tone="muted">48.2 GB of 100 GB used</ds-text>
  </ds-stack>
</ds-box>`;

  readonly displaySnippet = `<!-- Hidden below md, grid from md up -->
<ds-box [display]="{ base: 'none', md: 'grid' }">…</ds-box>`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'padding', type: 'Responsive<SpaceValue> | null', default: 'null', description: 'Padding on all sides (p-*).' },
    { name: 'paddingX / paddingY', type: 'Responsive<SpaceValue> | null', default: 'null', description: 'Horizontal / vertical padding (px-*, py-*).' },
    {
      name: 'paddingTop / paddingBottom / paddingStart / paddingEnd',
      type: 'Responsive<SpaceValue> | null',
      default: 'null',
      description: 'Per-side padding. Start / end follow writing direction.',
    },
    { name: 'margin', type: 'Responsive<SpaceValue> | null', default: 'null', description: 'Margin on all sides (m-*).' },
    { name: 'marginX / marginY', type: 'Responsive<SpaceValue> | null', default: 'null', description: 'Horizontal / vertical margin.' },
    {
      name: 'marginTop / marginBottom / marginStart / marginEnd',
      type: 'Responsive<SpaceValue> | null',
      default: 'null',
      description: 'Per-side margin.',
    },
    {
      name: 'background',
      type: `'transparent' | 'canvas' | 'surface' | 'surface-elevated' | 'surface-sunken' | 'primary' | 'accent' | '*-muted' | 'brand' | 'wash' | 'energy'`,
      default: `'transparent'`,
      description: 'Semantic surface role, or a brand paint mix (bg-*).',
    },
    {
      name: 'radius',
      type: `'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'blob' | null`,
      default: 'null',
      description: 'Corner radius token (rounded-*). `blob` is decorative only.',
    },
    {
      name: 'elevation',
      type: `'none' | 'sm' | 'md' | 'lg' | 'xl' | 'glow' | null`,
      default: 'null',
      description: 'Shadow token (shadow-*). `glow` is brand emphasis.',
    },
    { name: 'border', type: `boolean | 'top' | 'bottom' | 'start' | 'end'`, default: 'false', description: 'All sides, or a single side (border-*).' },
    { name: 'borderStrong', type: 'boolean', default: 'false', description: 'Uses the stronger border token.' },
    {
      name: 'display',
      type: `Responsive<'block' | 'inline-block' | 'inline' | 'flex' | 'inline-flex' | 'grid' | 'none'> | null`,
      default: 'null',
      description: 'Display mode (d-*), per breakpoint.',
    },
    { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Stretches to the container width (w-100).' },
  ];
}
