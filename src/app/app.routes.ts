import { Routes } from '@angular/router';
import { CountryDetail } from './features/country-detail/country-detail';
import { CountryList } from './features/country-list/country-list';

export const routes: Routes = [
  { path: '', component: CountryList, title: 'Navegador de países' },
  { path: 'countries/:id', component: CountryDetail, title: 'Detalle del país' },
  { path: '**', redirectTo: '' },
];
