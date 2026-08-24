import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DS_COMPONENTS, DS_PRIMITIVES } from '../../design-system';
import { BrandDirective, ThemeDirective, ThemeService } from '../../design-system/theme';
import { DOC_UI, type ApiRow } from '../docs';

interface GalleryInvoice extends Record<string, unknown> {
  id: string;
  project: string;
  amount: string;
}

/**
 * Brand packs — documentation and gallery.
 */
@Component({
  selector: 'app-brand-packs-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI, ThemeDirective, BrandDirective],
  templateUrl: './brand-packs.page.html',
  styleUrl: './brand-packs.page.scss',
})
export class BrandPacksPage {
  private readonly theme = inject(ThemeService);

  /** Whatever the host registered — the gallery never hard-codes a pack list. */
  readonly packs = this.theme.brands;
  readonly activeBrand = this.theme.brand;

  readonly modes = ['light', 'dark'] as const;

  readonly invoices: readonly GalleryInvoice[] = [
    { id: 'INV-201', project: 'Mural', amount: '$1,200' },
    { id: 'INV-202', project: 'Canvas', amount: '$840' },
    { id: 'INV-203', project: 'Fresco', amount: '$4,100' },
  ];
  readonly invoiceColumns = [
    { key: 'id', header: 'Invoice' },
    { key: 'project', header: 'Project' },
    { key: 'amount', header: 'Amount', align: 'end' as const, numeric: true },
  ];

  setBrand(id: string): void {
    this.theme.setBrand(id);
  }

  readonly registerSnippet = `// app.config.ts — a host registers the packs it offers
provideTheme({
  packs: [paintBrandPack, tidewaterBrandPack, emberBrandPack],
  defaultBrand: 'paint',          // optional; Paint is the default anyway
  brandStorageKey: 'acme-brand',  // persisted alongside the mode
});

// Or bring your own:
const acmePack: BrandPack = {
  id: 'acme',
  name: 'Acme',
  colors: { light: { /* the full SemanticColors set */ }, dark: { /* … */ } },
  radii: { md: '0.25rem' },       // optional overrides: gradients, radii, fonts
};`;

  readonly switchSnippet = `// Anywhere in the host app:
const theme = inject(ThemeService);
theme.setBrand('tidewater');   // remaps every --ds-* (and --bs-*) on the root
theme.setMode('dark');         // mode and brand are independent axes
theme.brand();                 // the active pack, as a signal`;

  readonly scopeSnippet = `<!-- A nested region runs a different pack than the shell. -->
<section dsBrand="tidewater">
  …everything in here is Tidewater; siblings never hear about it…

  <aside [dsTheme]="'dark'" dsBrand="ember">
    …and a nested scope may differ again, in its own mode…
  </aside>
</section>`;

  readonly packApi: readonly ApiRow[] = [
    { name: 'id / name', type: 'string', default: 'required', description: 'Stable id (persisted, data-brand, [dsBrand]) and a human name for switchers.' },
    { name: 'colors', type: 'Record<ThemeMode, SemanticColors>', default: 'required', description: 'The full semantic set for light and for dark. The type refuses partials.' },
    { name: 'gradients', type: 'Partial<Record<GradientToken, string>>', default: 'Paint’s', description: 'Brand paint mixes. Omitted gradients stay Paint’s.' },
    { name: 'radii', type: 'Partial<Record<RadiusToken, string>>', default: 'Paint’s', description: 'Corner language — Tidewater cuts tighter, Ember rounder.' },
    { name: 'fonts', type: `Partial<Record<'sans' | 'display' | 'mono', string>>`, default: 'Paint’s', description: 'Font stacks (no files). The type ramp follows an overridden face.' },
  ];

  readonly serviceApi: readonly ApiRow[] = [
    { name: 'brands', type: 'readonly BrandPack[]', default: '—', description: 'The registered packs, Paint always included.' },
    { name: 'brand() / brandId()', type: 'Signal<BrandPack> / Signal<string>', default: `'paint'`, description: 'The active pack. Components never need it — they read --ds-*.' },
    { name: 'setBrand(id)', type: 'method', default: '—', description: 'Remaps the root variables and persists. Unknown ids warn and change nothing.' },
    { name: '[dsBrand]', type: 'directive', default: `''`, description: 'Scopes a pack to a subtree: vars on that host, inherited by children, invisible to siblings. Combine with [dsTheme] for a local mode.' },
  ];
}
