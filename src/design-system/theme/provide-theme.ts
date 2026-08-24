import { EnvironmentProviders, inject, makeEnvironmentProviders, provideEnvironmentInitializer } from '@angular/core';
import { THEME_CONFIG, ThemeService, type ThemeConfig } from './theme.service';

/**
 * Registers the design-system theme provider and applies tokens on bootstrap.
 *
 * @example
 * ```ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [provideTheme({ defaultMode: 'system', followSystem: true })],
 * };
 * ```
 */
export function provideTheme(config: ThemeConfig = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: THEME_CONFIG, useValue: config },
    provideEnvironmentInitializer(() => {
      inject(ThemeService);
    }),
  ]);
}
