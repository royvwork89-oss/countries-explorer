import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { CountriesDataSource } from '../data/countries-data-source';
import { CountryRaw } from '../models/country-raw.model';
import { CountriesService } from './countries.service';

class FakeDataSource extends CountriesDataSource {
  calls = 0;
  private readonly responses: Observable<CountryRaw[]>[];

  constructor(responses: Observable<CountryRaw[]>[]) {
    super();
    this.responses = responses;
  }

  override load(): Observable<CountryRaw[]> {
    this.calls++;
    return this.responses.shift() ?? throwError(() => new Error('sin respuesta'));
  }
}

const mexico: CountryRaw = { alpha3Code: 'MEX', alpha2Code: 'MX', name: 'Mexico' };

function setup(responses: Observable<CountryRaw[]>[]) {
  const source = new FakeDataSource(responses);
  TestBed.configureTestingModule({
    providers: [{ provide: CountriesDataSource, useValue: source }],
  });
  return { service: TestBed.inject(CountriesService), source };
}

describe('CountriesService', () => {
  it('starts idle with no countries', () => {
    const { service } = setup([]);
    expect(service.status()).toBe('idle');
    expect(service.countries()).toEqual([]);
  });

  it('loads and maps countries, skipping invalid records', () => {
    const { service } = setup([of([mexico, { name: 'Sin código' }])]);
    service.load();
    expect(service.status()).toBe('ready');
    expect(service.countries().map((c) => c.id)).toEqual(['MEX']);
    expect(service.byId().get('MEX')?.name).toBe('Mexico');
  });

  it('is ready with an empty list when the source returns no data', () => {
    const { service } = setup([of([])]);
    service.load();
    expect(service.status()).toBe('ready');
    expect(service.countries()).toEqual([]);
  });

  it('reports an error without countries when the source fails', () => {
    const { service } = setup([throwError(() => new Error('red'))]);
    service.load();
    expect(service.status()).toBe('error');
    expect(service.countries()).toEqual([]);
  });

  it('does not reload once ready', () => {
    const { service, source } = setup([of([mexico])]);
    service.load();
    service.load();
    expect(source.calls).toBe(1);
  });

  it('can retry after an error', () => {
    const { service, source } = setup([throwError(() => new Error('red')), of([mexico])]);
    service.load();
    expect(service.status()).toBe('error');
    service.load();
    expect(service.status()).toBe('ready');
    expect(source.calls).toBe(2);
  });
});
