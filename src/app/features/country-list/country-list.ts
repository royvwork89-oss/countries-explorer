import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CountriesService } from '../../core/services/countries.service';
import { formatNumber, NOT_AVAILABLE } from '../../core/utils/format';
import { normalizeText } from '../../core/utils/text';

const PAGE_SIZE = 48;

@Component({
  selector: 'app-country-list',
  imports: [RouterLink],
  templateUrl: './country-list.html',
  styleUrl: './country-list.scss',
})
export class CountryList {
  private readonly countriesService = inject(CountriesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly status = this.countriesService.status;
  protected readonly query = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  protected readonly notAvailable = NOT_AVAILABLE;
  protected readonly formatNumber = formatNumber;

  private readonly sorted = computed(() =>
    [...this.countriesService.countries()].sort((a, b) => a.name.localeCompare(b.name, 'es')),
  );

  protected readonly total = computed(() => this.sorted().length);
  private readonly visibleCount = signal(PAGE_SIZE);

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

  protected readonly visible = computed(() => this.results().slice(0, this.visibleCount()));
  protected readonly remaining = computed(() => this.results().length - this.visible().length);

  constructor() {
    this.countriesService.load();
  }

  protected onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
    this.visibleCount.set(PAGE_SIZE);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: value.trim() ? value : null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected showMore(): void {
    this.visibleCount.update((count) => count + PAGE_SIZE);
  }

  protected retry(): void {
    this.countriesService.load();
  }
}
