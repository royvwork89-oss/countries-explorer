import { translateLanguage, translateRegion, translateSubregion } from './labels';

describe('labels', () => {
  it('translates known regions and subregions', () => {
    expect(translateRegion('Americas')).toBe('América');
    expect(translateSubregion('South America')).toBe('América del Sur');
  });

  it('keeps null and unknown values as they are', () => {
    expect(translateRegion(null)).toBeNull();
    expect(translateSubregion(null)).toBeNull();
    expect(translateRegion('Atlantis')).toBe('Atlantis');
  });

  it('translates languages by ISO code and falls back to the original name', () => {
    expect(translateLanguage('spa', 'Spanish')).toBe('Español');
    expect(translateLanguage('xyz', 'Klingon')).toBe('Klingon');
  });
});
