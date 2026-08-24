import { Directive, inject, input } from '@angular/core';
import { ThemeService } from './theme.service';
import type { ThemeMode } from './theme.types';

/**
 * Host directive that mirrors the active theme onto an element,
 * or forces a local mode via `[dsTheme]`.
 *
 * @example
 * ```html
 * <div dsTheme>…</div>
 * <div [dsTheme]="'dark'">…</div>
 * ```
 */
@Directive({
  selector: '[dsTheme]',
  standalone: true,
  host: {
    '[attr.data-theme]': 'resolvedMode()',
    // Scopes Bootstrap's color mode to the same subtree.
    '[attr.data-bs-theme]': 'resolvedMode()',
  },
})
export class ThemeDirective {
  private readonly theme = inject(ThemeService);

  /** Optional override. When empty, follows the global theme service. */
  readonly dsTheme = input<ThemeMode | ''>('');

  resolvedMode(): ThemeMode {
    const override = this.dsTheme();
    return override === 'light' || override === 'dark' ? override : this.theme.mode();
  }
}
