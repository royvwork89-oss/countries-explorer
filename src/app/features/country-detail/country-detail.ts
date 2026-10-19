import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CountriesService } from '../../core/services/countries.service';
import { formatNumber, NOT_AVAILABLE } from '../../core/utils/format';

@Component({
  selector: 'app-country-detail',
  imports: [RouterLink],
  templateUrl: './country-detail.html',
  styleUrl: './country-detail.scss',
})
export class CountryDetail {
  private readonly countriesService = inject(CountriesService);

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

  constructor() {
    this.countriesService.load();
  }

  protected retry(): void {
    this.countriesService.load();
  }
}
