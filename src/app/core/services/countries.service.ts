import { Injectable, computed, inject, signal } from '@angular/core';
import { CountriesDataSource } from '../data/countries-data-source';
import { mapCountries } from '../mappers/country.mapper';
import { Country } from '../models/country.model';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

@Injectable({ providedIn: 'root' })
export class CountriesService {
  private readonly dataSource = inject(CountriesDataSource);
  private readonly countriesState = signal<Country[]>([]);
  private readonly statusState = signal<LoadStatus>('idle');

  readonly countries = this.countriesState.asReadonly();
  readonly status = this.statusState.asReadonly();
  readonly byId = computed(
    () => new Map<string, Country>(this.countriesState().map((c) => [c.id, c])),
  );

  load(): void {
    const current = this.statusState();
    if (current === 'loading' || current === 'ready') {
      return;
    }
    this.statusState.set('loading');
    this.dataSource.load().subscribe({
      next: (raws) => {
        this.countriesState.set(mapCountries(raws));
        this.statusState.set('ready');
      },
      error: () => this.statusState.set('error'),
    });
  }
}
