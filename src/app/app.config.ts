import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

// Deep import: the barrel would bring the whole component layer with it.
import { builtInBrandPacks, provideTheme } from '../design-system/theme';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      // Docs pages link to their own sections: honour the fragment, and start
      // every new page at the top.
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
    ),
    provideTheme({
      defaultMode: 'system',
      followSystem: true,
      // The docs site demonstrates multi-brand: all three built-in packs.
      packs: builtInBrandPacks,
    }),
  ],
};
