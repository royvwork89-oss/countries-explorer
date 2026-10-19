import { CountryRaw } from '../models/country-raw.model';
import { mapCountries, mapCountry } from './country.mapper';

const complete: CountryRaw = {
  alpha2Code: 'MX',
  alpha3Code: 'MEX',
  name: 'Mexico',
  capital: 'Mexico City',
  region: 'Americas',
  subregion: 'Central America',
  population: 122273473,
  area: 1964375,
  languages: [{ iso639_1: 'es', iso639_2: 'spa', name: 'Spanish', nativeName: 'Español' }],
  translations: { es: 'México' },
  borders: ['BLZ', 'GTM', 'USA'],
};

describe('mapCountry', () => {
  it('maps a complete record', () => {
    expect(mapCountry(complete)).toEqual({
      id: 'MEX',
      alpha2: 'MX',
      name: 'México',
      nameEn: 'Mexico',
      capital: 'Mexico City',
      region: 'Americas',
      subregion: 'Central America',
      population: 122273473,
      area: 1964375,
      languages: [{ code: 'spa', name: 'Spanish' }],
      borders: ['BLZ', 'GTM', 'USA'],
      flagUrl: 'https://flags.restcountries.com/v5/w320/mx.png',
    });
  });

  it('falls back to the English name when there is no Spanish translation', () => {
    const country = mapCountry({ ...complete, translations: {} });
    expect(country?.name).toBe('Mexico');
  });

  it('turns empty strings into null', () => {
    const country = mapCountry({ ...complete, capital: '', region: '  ', subregion: '' });
    expect(country?.capital).toBeNull();
    expect(country?.region).toBeNull();
    expect(country?.subregion).toBeNull();
  });

  it('treats population 0 and missing area as null', () => {
    const country = mapCountry({ ...complete, population: 0, area: null });
    expect(country?.population).toBeNull();
    expect(country?.area).toBeNull();
  });

  it('discards languages without an ISO 639-2 code or name', () => {
    const country = mapCountry({
      ...complete,
      languages: [{ iso639_2: 'spa', name: 'Spanish' }, { name: 'Unknown' }, { iso639_2: 'xxx' }],
    });
    expect(country?.languages).toEqual([{ code: 'spa', name: 'Spanish' }]);
  });

  it('returns empty lists when languages and borders are missing', () => {
    const country = mapCountry({ ...complete, languages: undefined, borders: null });
    expect(country?.languages).toEqual([]);
    expect(country?.borders).toEqual([]);
  });

  it('has no flag when alpha2 is missing', () => {
    const country = mapCountry({ ...complete, alpha2Code: '' });
    expect(country?.alpha2).toBeNull();
    expect(country?.flagUrl).toBeNull();
  });

  it('returns null when the identifier or the name is missing', () => {
    expect(mapCountry({ ...complete, alpha3Code: '' })).toBeNull();
    expect(mapCountry({ ...complete, name: undefined })).toBeNull();
  });
});

describe('mapCountries', () => {
  it('skips invalid records and keeps the valid ones', () => {
    const result = mapCountries([complete, { name: 'Sin código' }, { ...complete, alpha3Code: 'USA' }]);
    expect(result.map((c) => c.id)).toEqual(['MEX', 'USA']);
  });
});
