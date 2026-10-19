import { readFileSync } from 'node:fs';

const countries = JSON.parse(readFileSync('public/data/countries.json', 'utf8'));

const checks = {
  sinCapital: (c) => !c.capital,
  sinRegion: (c) => !c.region,
  sinSubregion: (c) => !c.subregion,
  sinIdiomas: (c) => !Array.isArray(c.languages) || c.languages.length === 0,
  poblacionCero: (c) => !c.population,
  sinArea: (c) => c.area == null || c.area <= 0,
  sinNombreEs: (c) => !c.translations?.es,
  sinAlpha2: (c) => !c.alpha2Code,
};

console.log(`Total: ${countries.length}`);
for (const [label, test] of Object.entries(checks)) {
  const hits = countries.filter(test).map((c) => c.alpha3Code);
  console.log(`${label}: ${hits.length}${hits.length ? ` -> ${hits.join(', ')}` : ''}`);
}