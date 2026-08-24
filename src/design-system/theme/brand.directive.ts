import { Directive, ElementRef, effect, inject, input } from '@angular/core';
import { themeToBootstrapVariables } from './bootstrap.bridge';
import type { BrandPack } from './brand-packs';
import { ThemeDirective } from './theme.directive';
import { ThemeService } from './theme.service';
import {
  brandOverrideVariables,
  resolveThemeDefinition,
  semanticColorVariables,
} from './theme.types';

/**
 * Scopes a brand pack to a subtree.
 *
 * The sibling of `[dsTheme]`: where that forces light or dark on a region,
 * this forces a *brand*. The pack's custom properties are written onto the
 * host element itself — children follow by inheritance, the way they already
 * follow the root, and siblings never hear about it. Nothing inside the
 * subtree is restyled: components keep reading `--ds-*`, oblivious.
 *
 * The scope covers what a brand owns — the semantic colours (and their
 * Bootstrap `--bs-*` derivations, so `.btn`/`.form-control` chrome inside the
 * region follows too), plus the pack's gradient / radius / font overrides.
 * Spacing, type scale and elevation stay whatever the surrounding theme says:
 * brands differ in voice, not in physics.
 *
 * Mode comes from the surrounding `[dsTheme]` on the same host when present,
 * else from the global service — so a dark region stays dark in any brand:
 *
 * @example
 * ```html
 * <!-- An embedded partner panel, in the partner's colours -->
 * <section dsBrand="tidewater">…</section>
 *
 * <!-- A dark marketing strip, in the warm brand -->
 * <section [dsTheme]="'dark'" dsBrand="ember">…</section>
 * ```
 */
@Directive({
  selector: '[dsBrand]',
  standalone: true,
  host: {
    '[attr.data-brand]': 'activePackId()',
  },
})
export class BrandDirective {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly theme = inject(ThemeService);
  /** A `[dsTheme]` on the same host wins the mode argument for this region. */
  private readonly localTheme = inject(ThemeDirective, { optional: true, self: true });

  /** Pack id. Empty string follows the global brand (and clears the scope). */
  readonly dsBrand = input<string>('');

  /** What the host attribute reports: the scoped pack, or nothing. */
  protected activePackId(): string | null {
    return this.resolvePack()?.id ?? null;
  }

  /** The properties this directive wrote last, so a change removes its own. */
  private applied: string[] = [];

  constructor() {
    effect(() => {
      const pack = this.resolvePack();
      // Read the mode *inside* the effect: the scope re-paints when the global
      // (or same-host [dsTheme]) mode flips, because a brand is two palettes.
      const mode = this.localTheme?.resolvedMode() ?? this.theme.mode();

      const element = this.host.nativeElement;
      for (const property of this.applied) {
        element.style.removeProperty(property);
      }
      this.applied = [];

      if (!pack) {
        return;
      }

      const definition = resolveThemeDefinition(pack, mode);
      const vars = {
        ...semanticColorVariables(definition.colors),
        ...brandOverrideVariables(pack),
        ...themeToBootstrapVariables(definition),
      };

      for (const [property, value] of Object.entries(vars)) {
        element.style.setProperty(property, value);
      }
      this.applied = Object.keys(vars);
    });
  }

  private resolvePack(): BrandPack | null {
    const id = this.dsBrand();
    if (!id) {
      return null;
    }

    const pack = this.theme.brands.find((candidate) => candidate.id === id);
    if (!pack) {
      console.warn(
        `[paint] Unknown brand pack "${id}" on [dsBrand]. ` +
          `Registered: ${this.theme.brands.map((candidate) => candidate.id).join(', ')}`,
      );
      return null;
    }
    return pack;
  }
}
