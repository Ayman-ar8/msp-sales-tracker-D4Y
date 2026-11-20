/**
 * Made-up sample data for previewing the dashboard before the Sheet is
 * connected. Only used when DEMO_MODE=1. Clearly labelled as demo on screen.
 */
import { addDays, dateRange } from './dates';
import type { AdRow, CloserRow, MissingEod, Payload, Person, RefundRow, SetterRow } from './types';

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function demoPayload(today: string): Payload {
  const r = rng(42);
  const pick = (lo: number, hi: number) => Math.floor(lo + r() * (hi - lo + 1));
  const start = addDays(today, -74);

  const team: Person[] = [
    { id: 'C-001', name: 'Amira Hassan', email: 'amira@example.com', role: 'closer', status: 'active', working_days: 'Mon,Tue,Wed,Thu,Fri', start_date: start, end_date: '' },
    { id: 'C-002', name: 'Daniel Okafor', email: 'daniel@example.com', role: 'closer', status: 'active', working_days: 'Mon,Tue,Wed,Thu,Fri', start_date: start, end_date: '' },
    { id: 'C-003', name: 'Sara Lindqvist', email: 'sara@example.com', role: 'closer', status: 'inactive', working_days: 'Mon,Tue,Wed,Thu,Fri', start_date: start, end_date: addDays(today, -40) },
    { id: 'B-001', name: 'Yusuf Rahman', email: 'yusuf@example.com', role: 'both', status: 'active', working_days: 'Mon,Tue,Wed,Thu,Fri,Sat', start_date: start, end_date: '' },
    { id: 'S-001', name: 'Priya Nair', email: 'priya@example.com', role: 'setter', status: 'active', working_days: 'Mon,Tue,Wed,Thu,Fri', start_date: start, end_date: '' },
    { id: 'S-002', name: 'Tom Becker', email: 'tom@example.com', role: 'setter', status: 'active', working_days: 'Mon,Tue,Wed,Thu,Fri', start_date: start, end_date: '' }
  ];

  const works = (p: Person, d: string) => {
    const [y, m, dd] = d.split('-').map(Number);
    const wd = WEEKDAYS[new Date(Date.UTC(y, m - 1, dd)).getUTCDay()];
    const active = d >= p.start_date && (p.end_date ? d <= p.end_date : p.status === 'active');
    return active && p.working_days.split(',').includes(wd);
  };

  const closer: CloserRow[] = [];
  const setter: SetterRow[] = [];
  const ads: AdRow[] = [];
  const refunds: RefundRow[] = [];
  const missing: MissingEod[] = [];
  let n = 0;
  const yesterday = addDays(today, -1);

  for (const d of dateRange(start, yesterday)) {
    const spend = pick(900, 1600);
    const impressions = spend * pick(40, 60);
    ads.push({ date: d, platform: 'Meta', spend, impressions, clicks: Math.round(impressions * (0.009 + r() * 0.006)), source: 'api', override: 'no', response_id: '', synced_at: `${d}T23:00:00` });
    if (r() < 0.25) ads.push({ date: d, platform: 'Google', spend: pick(80, 220), impressions: pick(3000, 6000), clicks: pick(40, 90), source: 'manual', override: 'no', response_id: `ad-${n++}`, synced_at: `${d}T20:00:00` });

    for (const p of team) {
      if (!works(p, d)) continue;
      const skip = r() < 0.04;
      if (skip) {
        if (d >= addDays(today, -34)) missing.push({ date: d, person_id: p.id, name: p.name, email: p.email, form: p.role === 'setter' ? 'setter' : 'closer' });
        continue;
      }
      const base = { response_id: `r-${n++}`, submitted_at: `${d}T19:${String(pick(10, 59))}:00`, date: d, person_id: p.id, person_name: p.name, flags: '', source: 'trigger', day_off: 'no', notes: '' };
      if (p.role === 'closer' || p.role === 'both') {
        const cal = pick(5, 9);
        const showsNew = Math.max(0, cal - pick(1, 3) - pick(0, 2));
        const noShows = Math.max(0, cal - showsNew - pick(0, 1));
        const followups = pick(0, 2);
        const dq = Math.min(showsNew, pick(0, 1));
        const offers = Math.max(0, showsNew - dq - pick(0, 1));
        const pif = r() < 0.3 ? 1 : 0;
        const pp = Math.min(Math.max(0, offers - pif), pick(0, 2));
        const deposits = r() < 0.2 ? 1 : 0;
        const contract = pif * 6000 + pp * 7200;
        closer.push({
          ...base, calls_on_calendar: cal, shows_new: showsNew, shows_followup: followups, no_shows: noShows,
          reschedules: Math.max(0, cal - showsNew - noShows), cancelled: 0, disqualified: dq, offers,
          closes_pif: pif, closes_pp: pp, deposits, contract_value: contract,
          cash_upfront: pif * 6000, cash_pp: pp * 1800 + pick(0, 3) * 600, cash_deposit: deposits * 500
        });
        if (r() < 0.02) refunds.push({ ...base, response_id: `rf-${n++}`, amount: 1800, kind: 'Refund', notes: '' });
      }
      if (p.role === 'setter' || p.role === 'both') {
        const conv = pick(18, 35);
        const qualified = Math.round(conv * (0.35 + r() * 0.2));
        setter.push({ ...base, response_id: `s-${n++}`, conversations: conv, qualified_conversations: qualified, calls_booked: Math.round(qualified * (0.4 + r() * 0.2)) });
      }
    }
  }

  return {
    schema_version: '1.0.0',
    generated_at: `${today}T09:00:00`,
    today,
    settings: { business_name: 'Demo Co', currency: 'USD', timezone: 'America/New_York', closers_enabled: true, setters_enabled: true, ads_enabled: true },
    health: {
      status: 'ok', issues: [], last_health_check: `${today}T08:12:00`, minutes_since_health_check: 48, minutes_since_meta_sync: 48,
      last_reconcile: `${today}T08:12:00`, rows_backfilled_last: 0, rows_backfilled_total: 3,
      meta_status: 'ok', meta_last_sync: `${today}T08:12:00`, meta_last_error: '',
      last_response: { closer: `${yesterday}T19:58:00`, setter: `${yesterday}T19:41:00` }
    },
    team, closer, setter, ads, refunds, missing
  };
}
