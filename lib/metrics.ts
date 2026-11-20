/**
 * Every metric formula lives here and nowhere else.
 *
 * The rule: add up the raw counts for the period first, then divide.
 * A rate is never an average of daily rates. Daily, range, monthly, per-closer
 * and per-setter numbers all go through the same two functions below.
 */
import type { CloserRow, Payload, RefundRow, SetterRow } from './types';
import { resolveAds, type AdDay } from './ads';

export interface Totals {
  spend: number;
  impressions: number;
  clicks: number;
  conversations: number;
  qualified_conversations: number;
  calls_booked: number;
  calls_on_calendar: number;
  shows_new: number;
  shows_followup: number;
  no_shows: number;
  reschedules: number;
  cancelled: number;
  disqualified: number;
  offers: number;
  closes_pif: number;
  closes_pp: number;
  deposits: number;
  contract_value: number;
  cash_upfront: number;
  cash_pp: number;
  cash_deposit: number;
  refunds: number;
  /** Days in the period that have ad data, and days that have team reports. */
  ad_days: number;
  report_days: number;
}

export const ZERO_TOTALS: Totals = {
  spend: 0, impressions: 0, clicks: 0,
  conversations: 0, qualified_conversations: 0, calls_booked: 0,
  calls_on_calendar: 0, shows_new: 0, shows_followup: 0, no_shows: 0, reschedules: 0, cancelled: 0,
  disqualified: 0, offers: 0, closes_pif: 0, closes_pp: 0, deposits: 0,
  contract_value: 0, cash_upfront: 0, cash_pp: 0, cash_deposit: 0, refunds: 0,
  ad_days: 0, report_days: 0
};

const CLOSER_SUMS = [
  'calls_on_calendar', 'shows_new', 'shows_followup', 'no_shows', 'reschedules', 'cancelled',
  'disqualified', 'offers', 'closes_pif', 'closes_pp', 'deposits',
  'contract_value', 'cash_upfront', 'cash_pp', 'cash_deposit'
] as const;
const SETTER_SUMS = ['conversations', 'qualified_conversations', 'calls_booked'] as const;

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : Number(v) || 0);

/**
 * Keep one report per person per date: the latest submission wins
 * (that is how people fix mistakes: they submit again).
 */
export function dedupeLatest<T extends { person_id: string; date: string; submitted_at: string }>(rows: T[]): T[] {
  const best = new Map<string, T>();
  for (const r of rows) {
    const k = `${r.person_id}|${r.date}`;
    const cur = best.get(k);
    if (!cur || (r.submitted_at || '') >= (cur.submitted_at || '')) best.set(k, r);
  }
  return [...best.values()];
}

export interface Inputs {
  closer: CloserRow[];
  setter: SetterRow[];
  ads: AdDay[];
  refunds: RefundRow[];
}

/** Add up raw counts. Rows must already be filtered to the period. */
export function sumTotals(inputs: Inputs): Totals {
  const t: Totals = { ...ZERO_TOTALS };
  const reportDays = new Set<string>();
  for (const r of inputs.closer) {
    for (const k of CLOSER_SUMS) t[k] += num(r[k]);
    reportDays.add(r.date);
  }
  for (const r of inputs.setter) {
    for (const k of SETTER_SUMS) t[k] += num(r[k]);
    reportDays.add(r.date);
  }
  const adDays = new Set<string>();
  for (const a of inputs.ads) {
    t.spend += num(a.spend);
    t.impressions += num(a.impressions);
    t.clicks += num(a.clicks);
    adDays.add(a.date);
  }
  for (const r of inputs.refunds) t.refunds += num(r.amount);
  t.ad_days = adDays.size;
  t.report_days = reportDays.size;
  return t;
}

/** Division that returns null (shown as "—") instead of 0 or Infinity. */
export function safeDiv(a: number, b: number): number | null {
  return b > 0 ? a / b : null;
}

export type MetricKey =
  | 'spend' | 'ctr' | 'cpc'
  | 'conversations' | 'calls_booked' | 'booking_rate' | 'cost_per_booked_call'
  | 'calls_on_calendar' | 'show_rate' | 'dq_rate' | 'offer_rate' | 'closes' | 'close_rate' | 'deposit_rate'
  | 'cash_collected' | 'refunds' | 'net_cash' | 'payment_mix_pif' | 'contract_value' | 'aov' | 'cpa'
  | 'roas_cash' | 'roas_contract';

export type Metrics = Record<MetricKey, number | null>;

export interface MetricContext {
  settersEnabled: boolean;
}

/** Turn totals into every metric on the dashboard. */
export function computeMetrics(t: Totals, ctx: MetricContext): Metrics {
  const shows = t.shows_new + t.shows_followup;
  const closes = t.closes_pif + t.closes_pp;
  const cash = t.cash_upfront + t.cash_pp + t.cash_deposit;
  const booked = ctx.settersEnabled ? t.calls_booked : t.calls_on_calendar;
  return {
    spend: t.spend,
    ctr: safeDiv(t.clicks, t.impressions),
    cpc: safeDiv(t.spend, t.clicks),
    conversations: t.conversations,
    calls_booked: booked,
    booking_rate: safeDiv(t.calls_booked, t.conversations),
    cost_per_booked_call: safeDiv(t.spend, booked),
    calls_on_calendar: t.calls_on_calendar,
    show_rate: safeDiv(shows, shows + t.no_shows),
    dq_rate: safeDiv(t.disqualified, t.shows_new),
    offer_rate: safeDiv(t.offers, t.shows_new),
    closes,
    close_rate: safeDiv(closes, t.shows_new),
    deposit_rate: safeDiv(t.deposits, t.shows_new),
    cash_collected: cash,
    refunds: t.refunds,
    net_cash: cash - t.refunds,
    payment_mix_pif: safeDiv(t.closes_pif, closes),
    contract_value: t.contract_value,
    aov: safeDiv(t.contract_value, closes),
    cpa: safeDiv(t.spend, closes),
    roas_cash: safeDiv(cash, t.spend),
    roas_contract: safeDiv(t.contract_value, t.spend)
  };
}

/** Metrics that use ad spend: not meaningful when the view is filtered to one person. */
export const SPEND_METRICS: MetricKey[] = ['spend', 'ctr', 'cpc', 'cost_per_booked_call', 'cpa', 'roas_cash', 'roas_contract'];

/* ------------------------------------------------------------------ */
/* Selecting rows                                                      */
/* ------------------------------------------------------------------ */

export interface Filter {
  start: string;
  end: string;
  closerId?: string;
  setterId?: string;
}

export interface Prepared {
  closer: CloserRow[];
  setter: SetterRow[];
  ads: AdDay[];
  refunds: RefundRow[];
}

/** Deduplicate once, up front. */
export function prepare(p: Payload): Prepared {
  return {
    closer: dedupeLatest(p.closer),
    setter: dedupeLatest(p.setter),
    ads: resolveAds(p.ads),
    refunds: p.refunds
  };
}

const inRange = (d: string, f: Filter) => d >= f.start && d <= f.end;

export function select(data: Prepared, f: Filter): Inputs {
  return {
    closer: data.closer.filter((r) => inRange(r.date, f) && (!f.closerId || r.person_id === f.closerId)),
    setter: data.setter.filter((r) => inRange(r.date, f) && (!f.setterId || r.person_id === f.setterId)),
    ads: f.closerId || f.setterId ? [] : data.ads.filter((a) => inRange(a.date, f)),
    refunds: data.refunds.filter((r) => inRange(r.date, f) && (!f.closerId || r.person_id === f.closerId))
  };
}

export function metricsFor(data: Prepared, f: Filter, ctx: MetricContext): { totals: Totals; metrics: Metrics } {
  const totals = sumTotals(select(data, f));
  const metrics = computeMetrics(totals, ctx);
  if (f.closerId || f.setterId) for (const k of SPEND_METRICS) metrics[k] = null;
  return { totals, metrics };
}
