import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Navegador de países',
    loadComponent: () => import('./features/country-list/country-list').then((m) => m.CountryList),
  },
  {
    path: 'countries/:id',
    title: 'Detalle del país',
    loadComponent: () =>
      import('./features/country-detail/country-detail').then((m) => m.CountryDetail),
  },
  {
    path: 'favorites',
    title: 'Favoritos',
    loadComponent: () => import('./features/favorites/favorites').then((m) => m.Favorites),
  },
  { path: '**', redirectTo: '' },
];
