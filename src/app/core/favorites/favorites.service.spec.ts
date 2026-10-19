import { TestBed } from '@angular/core/testing';
import { FavoritesRepository } from './favorites.repository';
import { FavoritesService } from './favorites.service';

class FakeRepository extends FavoritesRepository {
  saved: string[][] = [];
  private readonly initial: string[];

  constructor(initial: string[]) {
    super();
    this.initial = initial;
  }

  override load(): string[] {
    return this.initial;
  }

  override save(ids: readonly string[]): void {
    this.saved.push([...ids]);
  }
}

function setup(initial: string[] = []) {
  const repository = new FakeRepository(initial);
  TestBed.configureTestingModule({
    providers: [{ provide: FavoritesRepository, useValue: repository }],
  });
  return { service: TestBed.inject(FavoritesService), repository };
}

describe('FavoritesService', () => {
  it('starts with the favorites stored in the repository', () => {
    const { service } = setup(['MEX']);
    expect(service.ids()).toEqual(['MEX']);
    expect(service.has('MEX')).toBe(true);
    expect(service.count()).toBe(1);
  });

  it('adds a country the first time and removes it the second time', () => {
    const { service } = setup();
    service.toggle('ESP');
    expect(service.has('ESP')).toBe(true);
    service.toggle('ESP');
    expect(service.has('ESP')).toBe(false);
    expect(service.count()).toBe(0);
  });

  it('persists every change through the repository', () => {
    const { service, repository } = setup();
    service.toggle('MEX');
    service.toggle('ESP');
    service.toggle('MEX');
    expect(repository.saved).toEqual([['MEX'], ['MEX', 'ESP'], ['ESP']]);
  });

  it('never stores duplicates', () => {
    const { service } = setup();
    service.toggle('MEX');
    service.toggle('MEX');
    service.toggle('MEX');
    expect(service.ids()).toEqual(['MEX']);
  });
});
