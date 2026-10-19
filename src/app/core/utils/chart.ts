import { Country } from '../models/country.model';

export interface BarRow {
  id: string;
  name: string;
  value: number | null;
  width: number;
  isTarget: boolean;
}

const MIN_VISIBLE_WIDTH = 2;

export function buildBarRows(
  countries: readonly Country[],
  pick: (country: Country) => number | null,
): BarRow[] {
  const values = countries.map(pick);
  const max = Math.max(0, ...values.filter((value): value is number => value !== null));

  return countries.map((country, index) => {
    const value = values[index];
    const width =
      value === null || max === 0 ? 0 : Math.max(MIN_VISIBLE_WIDTH, (value / max) * 100);
    return { id: country.id, name: country.name, value, width, isTarget: index === 0 };
  });
}
