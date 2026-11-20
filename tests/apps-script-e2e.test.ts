/**
 * Runs the real generated apps-script/SalesTracker.gs against in-memory fakes
 * of Google's services: setup, form submissions, reconciliation, team menu,
 * Meta, alerts, health repair, test-entry removal and the dashboard API.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { GoogleEnv, type FakeForm } from './fakes/google';
import { computeMetrics, prepare, metricsFor } from '@/lib/metrics';

const BUNDLE = readFileSync(join(__dirname, '..', 'apps-script', 'SalesTracker.gs'), 'utf8');
const TZ = 'America/New_York';

function boot() {
  const env = new GoogleEnv();
  const sandbox: Record<string, any> = { ...env.globals(), Date, console };
  vm.createContext(sandbox);
  vm.runInContext(BUNDLE, sandbox);
  env.context = sandbox;

  // What the assistant writes through the Workspace MCP before setup runs.
  const settings = env.active.insertSheet('Settings');
  [
    ['key', 'value'], ['business_name', 'Acme'], ['currency', 'USD'], ['timezone', TZ],
    ['founder_email', 'founder@example.com'], ['eod_cutoff', '16:00'], ['summary_time', '09:00'],
    ['closers_enabled', 'yes'], ['setters_enabled', 'yes'], ['ads_enabled', 'yes']
  ].forEach((r) => settings.appendRow(r));
  const team = env.active.insertSheet('Team');
  [
    ['id', 'name', 'email', 'role', 'status', 'working_days', 'start_date', 'end_date'],
    ['C-001', 'Amira Hassan', 'amira@example.com', 'closer', 'active', 'Mon,Tue,Wed,Thu,Fri', '2026-11-01', ''],
    ['C-002', 'Dan Okafor', 'dan@example.com', 'closer', 'active', 'Mon,Tue,Wed,Thu,Fri', '2026-11-01', ''],
    ['S-001', 'Priya Nair', 'priya@example.com', 'setter', 'active', 'Mon,Tue,Wed,Thu,Fri', '2026-11-01', '']
  ].forEach((r) => team.appendRow(r));
  return { env, gs: sandbox };
}

const setting = (env: GoogleEnv, key: string) => env.active.objects('Settings').find((r) => r.key === key)?.value;
const formOf = (env: GoogleEnv, key: string) => env.forms.get(String(setting(env, `form_${key}_id`)))!;

const closerAnswers = (person: string, date: string, notes = '') => ({
  'Date of this report': date, Closer: person, 'Did you work today?': 'Worked',
  'Calls on your calendar today': '5', 'Shows: new calls': '3', 'Shows: follow-up calls': '1', 'No-shows': '1',
  Reschedules: '0', Cancelled: '0', 'Disqualified (showed, not a fit)': '0', 'Offers made': '2',
  'Closes: paid in full': '1', 'Closes: payment plan': '1', 'Deposits taken (balance not yet closed)': '0',
  'Contract value closed (paid-in-full + payment-plan closes)': '12000',
  'Cash collected: upfront (paid in full)': '6000',
  'Cash collected: payment plan (first payments and instalments)': '1500',
  'Cash collected: deposits': '0', 'Notes (optional)': notes
});

describe('Apps Script end to end (fake Google)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-18T21:30:00Z')); // Wed 16:30 in New York
  });
  afterEach(() => vi.useRealTimers());

  it('setup builds forms, ledgers, triggers and is safe to run twice', () => {
    const { env, gs } = boot();
    gs.setup();
    for (const tab of ['Closer Ledger', 'Setter Ledger', 'Refunds', 'Ads', 'Change log', 'Closer EOD Responses', 'Setter EOD Responses']) {
      expect(env.active.getSheetByName(tab), tab).not.toBeNull();
    }
    expect(env.forms.size).toBe(4);
    expect(env.triggers.filter((t) => t.kind === 'hourly')).toHaveLength(1);
    expect(env.triggers.filter((t) => t.kind === 'formSubmit')).toHaveLength(4);
    expect(env.props.get('API_KEY')).toMatch(/.{20,}/);

    const closerForm = formOf(env, 'closer_eod');
    const dropdown = closerForm.items.find((i) => i.title === 'Closer')!;
    expect(dropdown.getChoices().map((c) => c.getValue())).toEqual(['Amira Hassan (C-001)', 'Dan Okafor (C-002)']);
    const dayOff = closerForm.items.find((i) => i.title === 'Did you work today?')!;
    expect(dayOff.choices.find((c) => c.value === 'Day off')!.nav).toBe('SUBMIT');

    gs.setup();
    expect(env.forms.size).toBe(4);
    expect(env.triggers).toHaveLength(5);
  });

  it('a submitted report lands in the ledger with the exact numbers', () => {
    const { env, gs } = boot();
    gs.setup();
    formOf(env, 'closer_eod').submit(closerAnswers('Amira Hassan (C-001)', '2026-11-18'));
    const rows = env.active.objects('Closer Ledger');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ person_id: 'C-001', date: '2026-11-18', shows_new: 3, closes_pp: 1, cash_pp: 1500, flags: '', source: 'trigger' });
  });

  it('reconciliation backfills responses the trigger missed, without duplicates', () => {
    const { env, gs } = boot();
    gs.setup();
    const form = formOf(env, 'closer_eod');
    form.submit(closerAnswers('Amira Hassan (C-001)', '2026-11-17'), { fireTriggers: false });
    form.submit(closerAnswers('Dan Okafor (C-002)', '2026-11-17'));
    expect(env.active.objects('Closer Ledger')).toHaveLength(1);
    // Google can deliver the same submit event twice: still one row.
    gs.handleFormSubmit({ source: form, response: form.responses[1] });
    expect(env.active.objects('Closer Ledger')).toHaveLength(1);
    gs.hourlyJob();
    gs.hourlyJob();
    const rows = env.active.objects('Closer Ledger');
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.person_id === 'C-001')!.source).toBe('reconcile');
    expect(Number(setting(env, 'rows_backfilled_total'))).toBe(1);
  });

  it('impossible numbers are saved but flagged, and the founder is emailed', () => {
    const { env, gs } = boot();
    gs.setup();
    formOf(env, 'closer_eod').submit({ ...closerAnswers('Amira Hassan (C-001)', '2026-11-18'), 'Offers made': '0' });
    expect(String(env.active.objects('Closer Ledger')[0].flags)).toMatch(/closes are more than offers/);
    expect(env.mail.some((m) => m.to === 'founder@example.com' && /needs a look/.test(m.subject))).toBe(true);
  });

  it('the API rejects a wrong key and serves data the dashboard can use', () => {
    const { env, gs } = boot();
    gs.setup();
    formOf(env, 'closer_eod').submit(closerAnswers('Amira Hassan (C-001)', '2026-11-18'));
    const bad = JSON.parse(gs.doPost({ postData: { contents: JSON.stringify({ key: 'nope', action: 'data' }) } }).getContent());
    expect(bad).toEqual({ ok: false, error: 'unauthorised' });
    const res = JSON.parse(gs.doPost({ postData: { contents: JSON.stringify({ key: env.props.get('API_KEY'), action: 'data' }) } }).getContent());
    expect(res.ok).toBe(true);
    expect(res.data.today).toBe('2026-11-18');
    const m = metricsFor(prepare(res.data), { start: '2026-11-18', end: '2026-11-18' }, { settersEnabled: true }).metrics;
    expect(m.show_rate).toBeCloseTo(0.8);
    expect(m.cash_collected).toBe(7500);
    expect(computeMetrics).toBeTypeOf('function');
  });

  it('Meta pull writes one row per day, updates on re-pull, and Sync now has a cooldown', () => {
    const { env, gs } = boot();
    gs.setup();
    env.props.set('META_TOKEN', 'secret');
    env.props.set('META_AD_ACCOUNT_ID', '123');
    let spend = 100;
    env.fetchHandler = (url) => {
      if (url.includes('/insights')) {
        return { code: 200, body: { data: ['2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18'].map((d) => ({ date_start: d, spend: String(spend), impressions: '1000', clicks: '10' })) } };
      }
      return { code: 200, body: { name: 'Acme Ads', currency: 'USD', timezone_name: TZ } };
    };
    gs.setSettings_({ meta_status: 'ok' });
    expect(gs.pullMeta_(false).status).toBe('ok');
    spend = 150;
    gs.pullMeta_(false);
    const ads = env.active.objects('Ads').filter((r) => r.source === 'api');
    expect(ads).toHaveLength(4);
    expect(ads.every((r) => Number(r.spend) === 150)).toBe(true);

    const call = () => JSON.parse(gs.doPost({ postData: { contents: JSON.stringify({ key: env.props.get('API_KEY'), action: 'sync' }) } }).getContent());
    expect(call().status).toBe('ok');
    expect(call().status).toBe('cooldown');
  });

  it('Meta currency/timezone mismatch blocks the pull and explains why', () => {
    const { env, gs } = boot();
    gs.setup();
    env.props.set('META_TOKEN', 'secret');
    env.props.set('META_AD_ACCOUNT_ID', '123');
    env.fetchHandler = () => ({ code: 200, body: { name: 'Acme Ads', currency: 'GBP', timezone_name: 'Europe/London' } });
    const r = gs.testMeta();
    expect(r.reason).toBe('mismatch');
    expect(setting(env, 'meta_status')).toBe('mismatch');
    expect(gs.pullMeta_(false).status).toBe('mismatch');
  });

  it('reminders go once at the cutoff to people with no report; day off counts as reported', () => {
    const { env, gs } = boot();
    gs.setup();
    formOf(env, 'closer_eod').submit(closerAnswers('Amira Hassan (C-001)', '2026-11-18'));
    formOf(env, 'setter_eod').submit({ 'Date of this report': '2026-11-18', Setter: 'Priya Nair (S-001)', 'Did you work today?': 'Day off' });
    gs.hourlyJob();
    gs.hourlyJob();
    const reminders = env.mail.filter((m) => /isn't in yet/.test(m.subject));
    expect(reminders.map((m) => m.to)).toEqual(['dan@example.com']);
  });

  it('the morning summary lists yesterday\'s missing reports and streaks', () => {
    const { env, gs } = boot();
    gs.setup();
    vi.setSystemTime(new Date('2026-11-19T14:30:00Z')); // Thu 09:30 in New York
    gs.hourlyJob();
    const summary = env.mail.find((m) => /Missing EODs for 2026-11-18/.test(m.subject));
    expect(summary).toBeDefined();
    expect(summary!.body).toMatch(/Amira Hassan/);
    expect(summary!.body).toMatch(/in a row/);
  });

  it('health check re-links a form that lost its Sheet and re-creates missing triggers', () => {
    const { env, gs } = boot();
    gs.setup();
    const form = formOf(env, 'closer_eod') as FakeForm & { removeDestination(): void };
    form.removeDestination();
    env.triggers = env.triggers.filter((t) => t.kind !== 'hourly');
    const issues = gs.runHealthCheck_([]);
    expect(issues).toEqual([]);
    expect(form.destinationId).toBe(env.active.id);
    expect(env.triggers.filter((t) => t.kind === 'hourly')).toHaveLength(1);
    expect(env.mail.some((m) => /Fixed automatically/.test(m.subject))).toBe(true);
  });

  it('test entries are removed from the form too, so reconciliation never brings them back', () => {
    const { env, gs } = boot();
    gs.setup();
    formOf(env, 'closer_eod').submit(closerAnswers('Amira Hassan (C-001)', '2026-11-18', 'TEST'));
    formOf(env, 'closer_eod').submit(closerAnswers('Dan Okafor (C-002)', '2026-11-18'));
    expect(gs.removeTestEntries_()).toBe(1);
    gs.hourlyJob();
    const rows = env.active.objects('Closer Ledger');
    expect(rows.map((r) => r.person_id)).toEqual(['C-002']);
  });

  it('team menu: add, rename, remap and undo keep history attached to IDs', () => {
    const { env, gs } = boot();
    gs.setup();
    env.promptQueue.push('Sara Lind', 'sara@example.com', 'closer', '', '');
    gs.menuAddPerson();
    expect(env.active.objects('Team').map((p) => p.id)).toContain('C-003');
    expect(formOf(env, 'closer_eod').items.find((i) => i.title === 'Closer')!.getChoices().map((c) => c.getValue())).toContain('Sara Lind (C-003)');

    // Two reports filed under the wrong closer; one date clashes.
    formOf(env, 'closer_eod').submit(closerAnswers('Amira Hassan (C-001)', '2026-11-16'));
    formOf(env, 'closer_eod').submit(closerAnswers('Amira Hassan (C-001)', '2026-11-17'));
    formOf(env, 'closer_eod').submit(closerAnswers('Sara Lind (C-003)', '2026-11-17'));
    env.promptQueue.push('closer', 'C-001', 'C-003', '2026-11-16', '2026-11-17', 'yes');
    gs.menuRemapEntries();
    const byDate = (d: string) => env.active.objects('Closer Ledger').filter((r) => r.date === d).map((r) => r.person_id).sort();
    expect(byDate('2026-11-16')).toEqual(['C-003']);
    expect(byDate('2026-11-17')).toEqual(['C-001', 'C-003']);

    env.promptQueue.push('yes');
    gs.menuUndoLastChange();
    expect(byDate('2026-11-16')).toEqual(['C-001']);

    env.promptQueue.push('C-003', 'Sara Lindqvist');
    gs.menuRenamePerson();
    expect(env.active.objects('Team').find((p) => p.id === 'C-003')!.name).toBe('Sara Lindqvist');
  });
});
