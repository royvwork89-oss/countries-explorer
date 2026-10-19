import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { CountriesDataSource } from './core/data/countries-data-source';
import { StaticCountriesDataSource } from './core/data/static-countries.data-source';
import { FavoritesRepository } from './core/favorites/favorites.repository';
import { LocalStorageFavoritesRepository } from './core/favorites/local-storage-favorites.repository';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    { provide: CountriesDataSource, useClass: StaticCountriesDataSource },
    { provide: FavoritesRepository, useClass: LocalStorageFavoritesRepository }
  ]
};
