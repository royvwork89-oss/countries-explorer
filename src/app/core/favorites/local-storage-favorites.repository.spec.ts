import { FAVORITES_STORAGE_KEY, LocalStorageFavoritesRepository } from './local-storage-favorites.repository';

describe('LocalStorageFavoritesRepository', () => {
  let repository: LocalStorageFavoritesRepository;

  beforeEach(() => {
    localStorage.clear();
    repository = new LocalStorageFavoritesRepository();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns an empty list when nothing is stored', () => {
    expect(repository.load()).toEqual([]);
  });

  it('saves and loads the same list', () => {
    repository.save(['MEX', 'ESP']);
    expect(repository.load()).toEqual(['MEX', 'ESP']);
  });

  it('falls back to an empty list when the stored data is corrupt JSON', () => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, '{no es json');
    expect(repository.load()).toEqual([]);
  });

  it('falls back to an empty list when the stored data is not an array', () => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify({ id: 'MEX' }));
    expect(repository.load()).toEqual([]);
  });

  it('drops invalid and duplicated entries', () => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(['MEX', 3, null, '', 'MEX', 'ESP']));
    expect(repository.load()).toEqual(['MEX', 'ESP']);
  });

  it('does not throw when the storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('cuota excedida');
    });
    expect(() => repository.save(['MEX'])).not.toThrow();
  });
});
