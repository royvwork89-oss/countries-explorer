import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CountriesService } from '../../core/services/countries.service';
import { formatNumber, NOT_AVAILABLE } from '../../core/utils/format';
import { normalizeText } from '../../core/utils/text';

@Component({
  selector: 'app-country-list',
  imports: [RouterLink],
  templateUrl: './country-list.html',
  styleUrl: './country-list.scss',
})
export class CountryList {
  private readonly countriesService = inject(CountriesService);

  protected readonly status = this.countriesService.status;
  protected readonly query = signal('');
  protected readonly notAvailable = NOT_AVAILABLE;
  protected readonly formatNumber = formatNumber;

  private readonly sorted = computed(() =>
    [...this.countriesService.countries()].sort((a, b) => a.name.localeCompare(b.name, 'es')),
  );

  protected readonly total = computed(() => this.sorted().length);

  protected readonly results = computed(() => {
    const term = normalizeText(this.query());
    if (!term) {
      return this.sorted();
    }
    return this.sorted().filter(
      (country) =>
        normalizeText(country.name).includes(term) ||
        normalizeText(country.nameEn).includes(term) ||
        (country.capital !== null && normalizeText(country.capital).includes(term)),
    );
  });

  constructor() {
    this.countriesService.load();
  }

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected retry(): void {
    this.countriesService.load();
  }
}
