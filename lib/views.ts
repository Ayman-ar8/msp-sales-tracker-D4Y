import { addDays, dateRange, weekStart } from './dates';
import { computeMetrics, select, sumTotals, type Filter, type MetricContext, type Metrics, type Prepared, type Totals } from './metrics';
import type { MissingEod, Person } from './types';

export interface DayPoint {
  date: string;
  spend: number | null;
  cash: number | null;
}

/**
 * Spend and cash per day, for the trend chart. A day with no data at all
 * (e.g. today, before anyone has reported) is a gap, not a drop to zero.
 */
export function dailySeries(data: Prepared, start: string, end: string): DayPoint[] {
  return dateRange(start, end).map((date) => {
    const t = sumTotals(select(data, { start: date, end: date }));
    return {
      date,
      spend: t.ad_days ? t.spend : null,
      cash: t.report_days ? t.cash_upfront + t.cash_pp + t.cash_deposit : null
    };
  });
}

export interface WeekPoint {
  week: string;
  show_rate: number | null;
  close_rate: number | null;
}

/** Show and close rate per ISO week, each computed from that week's sums. */
export function weeklyRates(data: Prepared, endDate: string, weeks: number, f: Omit<Filter, 'start' | 'end'>, ctx: MetricContext): WeekPoint[] {
  const lastWeek = weekStart(endDate);
  const out: WeekPoint[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = addDays(lastWeek, -7 * i);
    const end = addDays(start, 6) < endDate ? addDays(start, 6) : endDate;
    const m = computeMetrics(sumTotals(select(data, { ...f, start, end })), ctx);
    out.push({ week: start, show_rate: m.show_rate, close_rate: m.close_rate });
  }
  return out;
}

export interface PersonRow {
  person: Person;
  totals: Totals;
  metrics: Metrics;
  inactive: boolean;
}

function coversRole(p: Person, role: 'closer' | 'setter') {
  return p.role === role || p.role === 'both';
}

/**
 * One row per person for the team tables. People who were inactive for the
 * whole period and filed nothing in it are hidden unless showInactive is on.
 */
export function personTable(data: Prepared, team: Person[], role: 'closer' | 'setter', period: { start: string; end: string }, showInactive: boolean, ctx: MetricContext): PersonRow[] {
  return team
    .filter((p) => coversRole(p, role))
    .map((p) => {
      const f: Filter = role === 'closer' ? { ...period, closerId: p.id } : { ...period, setterId: p.id };
      const inputs = select(data, f);
      const own = role === 'closer'
        ? { closer: inputs.closer, setter: [], ads: [], refunds: inputs.refunds }
        : { closer: [], setter: inputs.setter, ads: [], refunds: [] };
      const totals = sumTotals(own);
      const hasData = role === 'closer' ? inputs.closer.length > 0 : inputs.setter.length > 0;
      const activeInPeriod = p.status === 'active' || (!!p.end_date && p.end_date >= period.start);
      return { person: p, totals, metrics: computeMetrics(totals, ctx), inactive: !activeInPeriod, hasData };
    })
    .filter((r) => showInactive || !r.inactive || r.hasData)
    .map(({ hasData: _hasData, ...r }) => r)
    .sort((a, b) => a.person.name.localeCompare(b.person.name));
}

/** Missing reports inside the period, optionally for one person. */
export function missingInPeriod(missing: MissingEod[], period: { start: string; end: string }, personId?: string): MissingEod[] {
  return missing
    .filter((m) => m.date >= period.start && m.date <= period.end && (!personId || m.person_id === personId))
    .sort((a, b) => (a.date === b.date ? a.name.localeCompare(b.name) : b.date.localeCompare(a.date)));
}
