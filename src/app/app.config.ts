import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

// Deep import: the barrel would bring the whole component layer with it.
import { builtInBrandPacks, provideTheme } from '../design-system/theme';
// Deep import, as with the theme: the showcase's shell must not pull the barrel.
import { provideInterstitials } from '../design-system/organisms/interstitial';
import { provideTour } from '../design-system/organisms/tour';
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
    // The interstitial content seam: the dev server proxies /api to the repo's
    // WireMock stub (`npm run mock:api`). No stub, no crash — the page says so.
    provideInterstitials({ baseUrl: '/api/interstitials', storageKey: 'paint-showcase-interstitials' }),
    // The tour's memory: which walkthroughs this visitor has finished or refused.
    provideTour({ storageKey: 'paint-showcase-tours' }),
    provideTheme({
      defaultMode: 'system',
      followSystem: true,
      // The docs site demonstrates multi-brand: all three built-in packs.
      packs: builtInBrandPacks,
    }),
  ],
};
