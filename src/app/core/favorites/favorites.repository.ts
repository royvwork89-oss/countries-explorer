export abstract class FavoritesRepository {
  abstract load(): string[];
  abstract save(ids: readonly string[]): void;
}
