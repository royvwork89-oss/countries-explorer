import { Country } from '../models/country.model';
import { formatNumber } from '../utils/format';

export type TraitKey = 'population' | 'area' | 'region' | 'subregion' | 'languages';

export interface TraitScore {
  trait: TraitKey;
  score: number;
  weight: number;
}

export interface SimilarCountry {
  country: Country;
  score: number;
  traits: TraitScore[];
  reasons: string[];
}

export const TRAIT_WEIGHTS: Readonly<Record<TraitKey, number>> = {
  population: 0.25,
  area: 0.15,
  region: 0.1,
  subregion: 0.2,
  languages: 0.3,
};

export const MIN_COMPARABLE_TRAITS = 2;
export const DEFAULT_LIMIT = 3;
const STRONG_NUMERIC_MATCH = 0.9;
const MAX_REASONS = 3;
const TIE_EPSILON = 1e-9;
const NO_REASON_TEXT = 'Coincidencias parciales en los datos disponibles';

interface LogRange {
  min: number;
  max: number;
}

interface Ranges {
  population: LogRange | null;
  area: LogRange | null;
}

function buildLogRange(values: readonly (number | null)[]): LogRange | null {
  let min = Infinity;
  let max = -Infinity;
  for (const value of values) {
    if (value === null || value <= 0) {
      continue;
    }
    const log = Math.log10(value);
    min = Math.min(min, log);
    max = Math.max(max, log);
  }
  return Number.isFinite(min) && Number.isFinite(max) ? { min, max } : null;
}

function buildRanges(countries: readonly Country[]): Ranges {
  return {
    population: buildLogRange(countries.map((c) => c.population)),
    area: buildLogRange(countries.map((c) => c.area)),
  };
}

function numericScore(a: number, b: number, range: LogRange | null): number {
  if (!range || range.max === range.min) {
    return 1;
  }
  const distance = Math.abs(Math.log10(a) - Math.log10(b));
  return Math.max(0, 1 - distance / (range.max - range.min));
}

function jaccard(a: readonly string[], b: readonly string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  let shared = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      shared++;
    }
  }
  const union = setA.size + setB.size - shared;
  return union === 0 ? 0 : shared / union;
}

function compareTraits(a: Country, b: Country, ranges: Ranges): TraitScore[] {
  const traits: TraitScore[] = [];

  if (a.population !== null && b.population !== null) {
    traits.push({
      trait: 'population',
      score: numericScore(a.population, b.population, ranges.population),
      weight: TRAIT_WEIGHTS.population,
    });
  }
  if (a.area !== null && b.area !== null) {
    traits.push({
      trait: 'area',
      score: numericScore(a.area, b.area, ranges.area),
      weight: TRAIT_WEIGHTS.area,
    });
  }
  if (a.region !== null && b.region !== null) {
    traits.push({
      trait: 'region',
      score: a.region === b.region ? 1 : 0,
      weight: TRAIT_WEIGHTS.region,
    });
  }
  if (a.subregion !== null && b.subregion !== null) {
    traits.push({
      trait: 'subregion',
      score: a.subregion === b.subregion ? 1 : 0,
      weight: TRAIT_WEIGHTS.subregion,
    });
  }
  if (a.languages.length > 0 && b.languages.length > 0) {
    traits.push({
      trait: 'languages',
      score: jaccard(
        a.languages.map((l) => l.code),
        b.languages.map((l) => l.code),
      ),
      weight: TRAIT_WEIGHTS.languages,
    });
  }

  return traits;
}

function combineScore(traits: readonly TraitScore[]): number {
  let weighted = 0;
  let totalWeight = 0;
  for (const trait of traits) {
    weighted += trait.score * trait.weight;
    totalWeight += trait.weight;
  }
  return totalWeight === 0 ? 0 : weighted / totalWeight;
}

function explain(target: Country, other: Country, traits: readonly TraitScore[]): string[] {
  const scores = new Map<TraitKey, number>(traits.map((t) => [t.trait, t.score]));
  const reasons: string[] = [];

  if (scores.get('subregion') === 1 && target.subregion) {
    reasons.push(`Misma subregión: ${target.subregion}`);
  } else if (scores.get('region') === 1 && target.region) {
    reasons.push(`Misma región: ${target.region}`);
  }

  if ((scores.get('languages') ?? 0) > 0) {
    const shared = target.languages
      .filter((language) => other.languages.some((o) => o.code === language.code))
      .map((language) => language.name);
    reasons.push(`Idiomas en común: ${shared.join(', ')}`);
  }

  if ((scores.get('population') ?? 0) >= STRONG_NUMERIC_MATCH) {
    reasons.push(
      `Población parecida: ${formatNumber(target.population)} y ${formatNumber(other.population)}`,
    );
  }

  if ((scores.get('area') ?? 0) >= STRONG_NUMERIC_MATCH) {
    reasons.push(
      `Superficie parecida: ${formatNumber(target.area, 'km²')} y ${formatNumber(other.area, 'km²')}`,
    );
  }

  return reasons.length > 0 ? reasons.slice(0, MAX_REASONS) : [NO_REASON_TEXT];
}

function compareCandidates(
  a: { country: Country; score: number },
  b: { country: Country; score: number },
): number {
  const difference = b.score - a.score;
  if (Math.abs(difference) > TIE_EPSILON) {
    return difference;
  }
  return (
    a.country.name.localeCompare(b.country.name, 'es') || a.country.id.localeCompare(b.country.id)
  );
}

export function findSimilar(
  target: Country,
  countries: readonly Country[],
  limit: number = DEFAULT_LIMIT,
): SimilarCountry[] {
  const ranges = buildRanges(countries);
  const candidates: { country: Country; score: number; traits: TraitScore[] }[] = [];

  for (const other of countries) {
    if (other.id === target.id) {
      continue;
    }
    const traits = compareTraits(target, other, ranges);
    if (traits.length < MIN_COMPARABLE_TRAITS) {
      continue;
    }
    candidates.push({ country: other, score: combineScore(traits), traits });
  }

  return candidates
    .sort(compareCandidates)
    .slice(0, Math.max(0, limit))
    .map((candidate) => ({
      ...candidate,
      reasons: explain(target, candidate.country, candidate.traits),
    }));
}
