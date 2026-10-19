import { Injectable, computed, inject, signal } from '@angular/core';
import { FavoritesRepository } from './favorites.repository';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly repository = inject(FavoritesRepository);
  private readonly idsState = signal<string[]>(this.repository.load());

  readonly ids = this.idsState.asReadonly();
  readonly count = computed(() => this.idsState().length);

  has(id: string): boolean {
    return this.idsState().includes(id);
  }

  toggle(id: string): void {
    const current = this.idsState();
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    this.idsState.set(next);
    this.repository.save(next);
  }
}
