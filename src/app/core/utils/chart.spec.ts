import { Country } from '../models/country.model';
import { buildBarRows } from './chart';

function make(id: string, population: number | null): Country {
  return {
    id,
    alpha2: null,
    name: id,
    nameEn: id,
    capital: null,
    region: null,
    subregion: null,
    population,
    area: null,
    languages: [],
    borders: [],
    flagUrl: null,
  };
}

describe('buildBarRows', () => {
  it('scales every bar relative to the largest value and marks the first row as the target', () => {
    const rows = buildBarRows([make('A', 50), make('B', 100), make('C', 25)], (c) => c.population);
    expect(rows.map((r) => r.width)).toEqual([50, 100, 25]);
    expect(rows.map((r) => r.isTarget)).toEqual([true, false, false]);
  });

  it('gives missing values no bar and keeps the null so the UI can say "No disponible"', () => {
    const rows = buildBarRows([make('A', null), make('B', 100)], (c) => c.population);
    expect(rows[0]).toMatchObject({ value: null, width: 0 });
    expect(rows[1].width).toBe(100);
  });

  it('keeps tiny values visible with a minimum width', () => {
    const rows = buildBarRows([make('A', 1), make('B', 1_000_000)], (c) => c.population);
    expect(rows[0].width).toBe(2);
  });

  it('draws no bars when no country has the value', () => {
    const rows = buildBarRows([make('A', null), make('B', null)], (c) => c.population);
    expect(rows.map((r) => r.width)).toEqual([0, 0]);
  });
});
