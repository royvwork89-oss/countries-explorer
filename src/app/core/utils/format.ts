export const NOT_AVAILABLE = 'No disponible';

export function formatNumber(value: number | null, unit?: string): string {
  if (value === null) {
    return NOT_AVAILABLE;
  }
  const text = value.toLocaleString('es-MX');
  return unit ? `${text} ${unit}` : text;
}
