import { formatNumber, NOT_AVAILABLE } from './format';

describe('formatNumber', () => {
  it('shows a fallback text for missing values', () => {
    expect(formatNumber(null)).toBe(NOT_AVAILABLE);
    expect(formatNumber(null, 'km²')).toBe(NOT_AVAILABLE);
  });

  it('formats numbers with thousands separators and an optional unit', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber(1500, 'km²')).toBe('1,500 km²');
  });
});
