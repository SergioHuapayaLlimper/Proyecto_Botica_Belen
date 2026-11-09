import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsPe from '@angular/common/locales/es-PE';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { interceptorAuth } from './core/interceptores';

registerLocaleData(localeEsPe);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
      // Transición suave entre páginas, pero no al cambiar filtros o la búsqueda (misma ruta, otros ?parámetros).
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: ({ transition, from, to }) => {
          const ruta = (s: typeof from) => s.pathFromRoot.map((r) => r.url.map((u) => u.path).join('/')).join('/');
          if (ruta(from) === ruta(to)) transition.skipTransition();
        },
      }),
    ),
    provideHttpClient(withFetch(), withInterceptors([interceptorAuth])),
    { provide: LOCALE_ID, useValue: 'es-PE' },
  ],
};
