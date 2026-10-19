import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FavoritesService } from '../../core/favorites/favorites.service';
import { CountriesService } from '../../core/services/countries.service';
import { findSimilar } from '../../core/similarity/similarity';
import { buildBarRows } from '../../core/utils/chart';
import { formatNumber, NOT_AVAILABLE } from '../../core/utils/format';

@Component({
  selector: 'app-country-detail',
  imports: [RouterLink],
  templateUrl: './country-detail.html',
  styleUrl: './country-detail.scss',
})
export class CountryDetail {
  private readonly countriesService = inject(CountriesService);
  private readonly favoritesService = inject(FavoritesService);

  readonly id = input.required<string>();

  protected readonly status = this.countriesService.status;
  protected readonly notAvailable = NOT_AVAILABLE;
  protected readonly formatNumber = formatNumber;

  protected readonly country = computed(
    () => this.countriesService.byId().get(this.id().toUpperCase()) ?? null,
  );

  protected readonly languages = computed(() => {
    const languages = this.country()?.languages ?? [];
    return languages.length > 0 ? languages.map((l) => l.name).join(', ') : NOT_AVAILABLE;
  });

  protected readonly similar = computed(() => {
    const country = this.country();
    return country ? findSimilar(country, this.countriesService.countries()) : [];
  });

  protected readonly isFavorite = computed(() => {
    const country = this.country();
    return country !== null && this.favoritesService.has(country.id);
  });

  protected readonly charts = computed(() => {
    const country = this.country();
    const similar = this.similar();
    if (!country || similar.length === 0) {
      return [];
    }
    const countries = [country, ...similar.map((item) => item.country)];
    return [
      { key: 'population', title: 'Población', unit: undefined, rows: buildBarRows(countries, (c) => c.population) },
      { key: 'area', title: 'Superficie', unit: 'km²', rows: buildBarRows(countries, (c) => c.area) },
    ];
  });

  constructor() {
    this.countriesService.load();
  }

  protected toggleFavorite(): void {
    const country = this.country();
    if (country) {
      this.favoritesService.toggle(country.id);
    }
  }

  protected percent(score: number): number {
    return Math.round(score * 100);
  }

  protected retry(): void {
    this.countriesService.load();
  }
}
