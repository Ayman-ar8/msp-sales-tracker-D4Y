import { describe, expect, it } from 'vitest';
import { computeMetrics, dedupeLatest, metricsFor, prepare, safeDiv, sumTotals, ZERO_TOTALS } from '@/lib/metrics';
import type { CloserRow, Payload } from '@/lib/types';

const closerRow = (over: Partial<CloserRow>): CloserRow => ({
  response_id: Math.random().toString(36), submitted_at: '2026-11-02T19:00:00', date: '2026-11-02',
  person_id: 'C-001', person_name: 'A', flags: '', source: 'trigger', day_off: 'no',
  calls_on_calendar: 0, shows_new: 0, shows_followup: 0, no_shows: 0, reschedules: 0, cancelled: 0,
  disqualified: 0, offers: 0, closes_pif: 0, closes_pp: 0, deposits: 0, contract_value: 0,
  cash_upfront: 0, cash_pp: 0, cash_deposit: 0, notes: '', ...over
});

const ctx = { settersEnabled: true };

describe('rates are computed from summed counts, never averaged', () => {
  it('the spec example: 1 of 2 and 18 of 20 is 19 of 22 (86%), not 70%', () => {
    const rows = [
      closerRow({ date: '2026-11-02', shows_new: 1, no_shows: 1 }),
      closerRow({ date: '2026-11-03', shows_new: 18, no_shows: 2 })
    ];
    const m = computeMetrics(sumTotals({ closer: rows, setter: [], ads: [], refunds: [] }), ctx);
    expect(m.show_rate).toBeCloseTo(19 / 22, 10);
    expect(m.show_rate).not.toBeCloseTo(0.7, 2);
  });

  it('follow-up shows count toward show rate but close rate uses new-call shows', () => {
    const t = sumTotals({ closer: [closerRow({ shows_new: 4, shows_followup: 2, no_shows: 2, offers: 3, closes_pif: 1, closes_pp: 1, contract_value: 12000 })], setter: [], ads: [], refunds: [] });
    const m = computeMetrics(t, ctx);
    expect(m.show_rate).toBeCloseTo(6 / 8);
    expect(m.close_rate).toBeCloseTo(2 / 4);
    expect(m.aov).toBe(6000);
    expect(m.payment_mix_pif).toBeCloseTo(0.5);
  });

  it('cash is the sum of upfront, payment plan and deposit cash; net cash subtracts refunds', () => {
    const t = sumTotals({
      closer: [closerRow({ cash_upfront: 6000, cash_pp: 1800, cash_deposit: 500 })],
      setter: [], ads: [],
      refunds: [{ response_id: 'x', submitted_at: '', date: '2026-11-02', person_id: 'C-001', person_name: 'A', flags: '', source: '', amount: 300, kind: 'Refund', notes: '' }]
    });
    const m = computeMetrics(t, ctx);
    expect(m.cash_collected).toBe(8300);
    expect(m.net_cash).toBe(8000);
  });

  it('dividing by zero gives null (shown as a dash), never 0 or Infinity', () => {
    const m = computeMetrics({ ...ZERO_TOTALS }, ctx);
    expect(m.show_rate).toBeNull();
    expect(m.cpa).toBeNull();
    expect(m.roas_cash).toBeNull();
    expect(safeDiv(5, 0)).toBeNull();
  });

  it('cost per booked call uses calls on calendar when setters are off', () => {
    const t = { ...ZERO_TOTALS, spend: 1000, calls_booked: 0, calls_on_calendar: 10 };
    expect(computeMetrics(t, { settersEnabled: false }).cost_per_booked_call).toBe(100);
    expect(computeMetrics(t, { settersEnabled: true }).cost_per_booked_call).toBeNull();
  });
});

describe('one report per person per date', () => {
  it('keeps the latest submission so resubmitting fixes a mistake', () => {
    const rows = dedupeLatest([
      closerRow({ response_id: 'old', submitted_at: '2026-11-02T18:00:00', closes_pif: 5 }),
      closerRow({ response_id: 'new', submitted_at: '2026-11-02T21:00:00', closes_pif: 1 }),
      closerRow({ response_id: 'other-day', date: '2026-11-03' })
    ]);
    expect(rows.map((r) => r.response_id).sort()).toEqual(['new', 'other-day']);
  });
});

describe('filtering to one person', () => {
  it('blanks spend-based metrics because spend is not split by person', () => {
    const payload = {
      closer: [closerRow({ closes_pif: 1, contract_value: 5000, cash_upfront: 5000 })],
      setter: [], refunds: [],
      ads: [{ date: '2026-11-02', platform: 'Meta', spend: 1000, impressions: 50000, clicks: 500, source: 'api', override: 'no', response_id: '', synced_at: '' }]
    } as unknown as Payload;
    const data = prepare(payload);
    const all = metricsFor(data, { start: '2026-11-01', end: '2026-11-30' }, ctx).metrics;
    const one = metricsFor(data, { start: '2026-11-01', end: '2026-11-30', closerId: 'C-001' }, ctx).metrics;
    expect(all.roas_cash).toBe(5);
    expect(one.roas_cash).toBeNull();
    expect(one.cash_collected).toBe(5000);
  });
});
