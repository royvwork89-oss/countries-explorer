import { Observable } from 'rxjs';
import { CountryRaw } from '../models/country-raw.model';

export abstract class CountriesDataSource {
  abstract load(): Observable<CountryRaw[]>;
}
