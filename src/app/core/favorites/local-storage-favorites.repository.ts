import { Injectable } from '@angular/core';
import { FavoritesRepository } from './favorites.repository';

export const FAVORITES_STORAGE_KEY = 'countries-explorer:favorites:v1';

@Injectable()
export class LocalStorageFavoritesRepository extends FavoritesRepository {
  override load(): string[] {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (raw === null) {
        return [];
      }
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      const ids = parsed.filter((item): item is string => typeof item === 'string' && item !== '');
      return [...new Set(ids)];
    } catch {
      return [];
    }
  }

  override save(ids: readonly string[]): void {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Almacenamiento no disponible o lleno: los favoritos siguen vivos en memoria durante la sesión.
    }
  }
}
