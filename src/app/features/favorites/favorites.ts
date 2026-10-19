import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FavoritesService } from '../../core/favorites/favorites.service';
import { Country } from '../../core/models/country.model';
import { CountriesService } from '../../core/services/countries.service';
import { formatNumber, NOT_AVAILABLE } from '../../core/utils/format';

@Component({
  selector: 'app-favorites',
  imports: [RouterLink],
  templateUrl: './favorites.html',
  styleUrl: './favorites.scss',
})
export class Favorites {
  private readonly countriesService = inject(CountriesService);
  private readonly favoritesService = inject(FavoritesService);

  protected readonly status = this.countriesService.status;
  protected readonly notAvailable = NOT_AVAILABLE;
  protected readonly formatNumber = formatNumber;

  protected readonly countries = computed(() => {
    const byId = this.countriesService.byId();
    return this.favoritesService
      .ids()
      .map((id) => byId.get(id))
      .filter((country): country is Country => country !== undefined);
  });

  constructor() {
    this.countriesService.load();
  }

  protected remove(id: string): void {
    this.favoritesService.toggle(id);
  }

  protected retry(): void {
    this.countriesService.load();
  }
}
