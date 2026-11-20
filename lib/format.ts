export type Format = 'money' | 'percent' | 'count' | 'multiple';

export function formatValue(v: number | null, format: Format, currency: string): string {
  if (v === null || !Number.isFinite(v)) return '—';
  switch (format) {
    case 'money':
      return new Intl.NumberFormat('en', {
        style: 'currency',
        currency: currency || 'USD',
        maximumFractionDigits: Math.abs(v) >= 1000 ? 0 : 2
      }).format(v);
    case 'percent':
      return `${(v * 100).toFixed(1)}%`;
    case 'multiple':
      return `${v.toFixed(2)}×`;
    default:
      return new Intl.NumberFormat('en').format(Math.round(v));
  }
}

/** Change vs the previous period, as text plus whether it is good news. */
export function formatChange(cur: number | null, prev: number | null, format: Format, lowerIsBetter = false): { text: string; tone: 'up' | 'down' | 'flat' } {
  if (cur === null || prev === null) return { text: 'no comparison', tone: 'flat' };
  if (format === 'percent') {
    const pts = (cur - prev) * 100;
    if (Math.abs(pts) < 0.05) return { text: 'no change', tone: 'flat' };
    const good = lowerIsBetter ? pts < 0 : pts > 0;
    return { text: `${pts > 0 ? '+' : ''}${pts.toFixed(1)} pts`, tone: good ? 'up' : 'down' };
  }
  if (prev === 0) return { text: cur === 0 ? 'no change' : 'new', tone: 'flat' };
  const pct = ((cur - prev) / Math.abs(prev)) * 100;
  if (Math.abs(pct) < 0.5) return { text: 'no change', tone: 'flat' };
  const good = lowerIsBetter ? pct < 0 : pct > 0;
  return { text: `${pct > 0 ? '+' : ''}${pct.toFixed(0)}%`, tone: good ? 'up' : 'down' };
}
