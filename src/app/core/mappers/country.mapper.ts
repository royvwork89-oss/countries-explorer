import { translateLanguage, translateRegion, translateSubregion } from '../i18n/labels';
import { Country, Language } from '../models/country.model';
import { CountryRaw, CountryRawLanguage } from '../models/country-raw.model';

export const FLAG_BASE_URL = 'https://flags.restcountries.com/v5/w320';

function cleanText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanPositiveNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function mapLanguages(raw: CountryRawLanguage[] | null | undefined): Language[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const result: Language[] = [];
  for (const item of raw) {
    const code = cleanText(item?.iso639_2);
    const name = cleanText(item?.name);
    if (code && name) {
      result.push({ code, name: translateLanguage(code, name) });
    }
  }
  return result;
}

function mapBorders(raw: string[] | null | undefined): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((code): code is string => typeof code === 'string' && code.length > 0);
}

export function mapCountry(raw: CountryRaw): Country | null {
  const id = cleanText(raw?.alpha3Code);
  const nameEn = cleanText(raw?.name);
  if (!id || !nameEn) {
    return null;
  }

  const alpha2 = cleanText(raw.alpha2Code)?.toUpperCase() ?? null;
  const nameEs = cleanText(raw.translations?.['es']);

  return {
    id: id.toUpperCase(),
    alpha2,
    name: nameEs ?? nameEn,
    nameEn,
    capital: cleanText(raw.capital),
    region: translateRegion(cleanText(raw.region)),
    subregion: translateSubregion(cleanText(raw.subregion)),
    population: cleanPositiveNumber(raw.population),
    area: cleanPositiveNumber(raw.area),
    languages: mapLanguages(raw.languages),
    borders: mapBorders(raw.borders),
    flagUrl: alpha2 ? `${FLAG_BASE_URL}/${alpha2.toLowerCase()}.png` : null,
  };
}

export function mapCountries(raws: CountryRaw[]): Country[] {
  const result: Country[] = [];
  for (const raw of raws) {
    const country = mapCountry(raw);
    if (country) {
      result.push(country);
    }
  }
  return result;
}
