import { Country } from '../models/country.model';
import { findSimilar, SimilarCountry, TraitKey } from './similarity';

function make(id: string, overrides: Partial<Country> = {}): Country {
  return {
    id,
    alpha2: null,
    name: id,
    nameEn: id,
    capital: null,
    region: 'Americas',
    subregion: 'Central America',
    population: 1_000_000,
    area: 100_000,
    languages: [{ code: 'spa', name: 'Spanish' }],
    borders: [],
    flagUrl: null,
    ...overrides,
  };
}

function scoreOf(result: SimilarCountry, trait: TraitKey): number | undefined {
  return result.traits.find((t) => t.trait === trait)?.score;
}

describe('findSimilar', () => {
  it('never includes the target country', () => {
    const target = make('AAA');
    const result = findSimilar(target, [target, make('BBB')]);
    expect(result.map((r) => r.country.id)).toEqual(['BBB']);
  });

  it('returns an empty list when there is nothing to compare', () => {
    const target = make('AAA');
    expect(findSimilar(target, [target])).toEqual([]);
  });

  it('ranks a close country above a distant one', () => {
    const target = make('AAA');
    const near = make('NEAR', { population: 1_100_000 });
    const far = make('FAR', {
      region: 'Asia',
      subregion: 'Eastern Asia',
      population: 900_000_000,
      area: 9_000_000,
      languages: [{ code: 'zho', name: 'Chinese' }],
    });
    const result = findSimilar(target, [target, far, near]);
    expect(result.map((r) => r.country.id)).toEqual(['NEAR', 'FAR']);
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });

  it('returns at most 3 results by default and honors a custom limit', () => {
    const target = make('AAA');
    const others = ['B', 'C', 'D', 'E', 'F'].map((id) => make(id));
    expect(findSimilar(target, [target, ...others])).toHaveLength(3);
    expect(findSimilar(target, [target, ...others], 2)).toHaveLength(2);
    expect(findSimilar(target, [target, ...others], 0)).toEqual([]);
  });

  it('scores identical populations as 1 and the extremes of the range as 0', () => {
    const target = make('AAA', { population: 10 });
    const same = make('SAME', { population: 10 });
    const huge = make('HUGE', { population: 1_000_000 });
    const result = findSimilar(target, [target, same, huge]);
    expect(scoreOf(result.find((r) => r.country.id === 'SAME')!, 'population')).toBe(1);
    expect(scoreOf(result.find((r) => r.country.id === 'HUGE')!, 'population')).toBe(0);
  });

  it('computes the language score as the Jaccard index of ISO codes', () => {
    const target = make('AAA', {
      languages: [
        { code: 'spa', name: 'Spanish' },
        { code: 'eng', name: 'English' },
      ],
    });
    const other = make('BBB', { languages: [{ code: 'spa', name: 'Spanish' }] });
    const [result] = findSimilar(target, [target, other]);
    expect(scoreOf(result, 'languages')).toBe(0.5);
  });

  it('skips a missing trait and redistributes its weight among the rest', () => {
    const target = make('AAA');
    const other = make('BBB', { population: null });
    const [result] = findSimilar(target, [target, other]);
    expect(result.traits.map((t) => t.trait)).not.toContain('population');
    expect(result.score).toBeCloseTo(1, 10);
  });

  it('does not consider countries with fewer than 2 comparable traits', () => {
    const target = make('AAA');
    const sparse = make('SPARSE', { region: null, subregion: null, languages: [], area: null });
    const ok = make('OK');
    const result = findSimilar(target, [target, sparse, ok]);
    expect(result.map((r) => r.country.id)).toEqual(['OK']);
  });

  it('breaks ties alphabetically by name so the result is deterministic', () => {
    const target = make('AAA');
    const zeta = make('ZZZ', { name: 'Zeta' });
    const alfa = make('YYY', { name: 'Alfa' });
    const result = findSimilar(target, [target, zeta, alfa]);
    expect(result.map((r) => r.country.name)).toEqual(['Alfa', 'Zeta']);
  });

  it('is pure: same input gives same output and the input is not reordered', () => {
    const target = make('AAA');
    const list = [target, make('CCC', { population: 5_000_000 }), make('BBB')];
    const ids = list.map((c) => c.id);
    const first = findSimilar(target, list);
    const second = findSimilar(target, list);
    expect(second).toEqual(first);
    expect(list.map((c) => c.id)).toEqual(ids);
  });

  it('explains the match with a readable reason in Spanish', () => {
    const target = make('AAA');
    const other = make('BBB');
    const [result] = findSimilar(target, [target, other]);
    expect(result.reasons).toContain('Misma subregión: Central America');
    expect(result.reasons).toContain('Idiomas en común: Spanish');
    expect(result.reasons.length).toBeLessThanOrEqual(3);
  });

  it('falls back to the region when only the region matches', () => {
    const target = make('AAA');
    const other = make('BBB', {
      subregion: 'South America',
      languages: [{ code: 'por', name: 'Portuguese' }],
      population: 200_000_000,
      area: 8_000_000,
    });
    const [result] = findSimilar(target, [target, other]);
    expect(result.reasons).toEqual(['Misma región: Americas']);
  });

  it('gives a generic reason when nothing stands out', () => {
    const target = make('AAA');
    const other = make('BBB', {
      region: 'Asia',
      subregion: 'Eastern Asia',
      languages: [{ code: 'zho', name: 'Chinese' }],
      population: 900_000_000,
      area: 9_000_000,
    });
    const [result] = findSimilar(target, [target, other]);
    expect(result.reasons).toEqual(['Coincidencias parciales en los datos disponibles']);
  });
});
