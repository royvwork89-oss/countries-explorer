import { normalizeText } from './text';

describe('normalizeText', () => {
  it('removes accents, case and surrounding spaces', () => {
    expect(normalizeText('  México ')).toBe('mexico');
    expect(normalizeText('ÅLAND')).toBe('aland');
  });

  it('returns an empty string for blank input', () => {
    expect(normalizeText('   ')).toBe('');
  });
});
