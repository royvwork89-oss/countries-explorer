import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CountryRaw } from '../models/country-raw.model';
import { CountriesDataSource } from './countries-data-source';

@Injectable()
export class StaticCountriesDataSource extends CountriesDataSource {
  private readonly http = inject(HttpClient);

  override load(): Observable<CountryRaw[]> {
    return this.http.get<CountryRaw[]>('data/countries.json');
  }
}
