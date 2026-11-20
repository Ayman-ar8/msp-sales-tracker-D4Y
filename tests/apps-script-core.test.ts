import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import schema from '@/schema.json';

/** Load the pure Apps Script logic into a sandbox, exactly as Google runs it. */
const sandbox: Record<string, any> = { SCHEMA: schema };
vm.createContext(sandbox);
vm.runInContext(readFileSync(join(__dirname, '..', 'apps-script', 'src', '00_core.js'), 'utf8'), sandbox);
const core = sandbox as any;

const person = (o: Record<string, string>) => ({
  id: 'C-001', name: 'Amira', email: 'a@x.com', role: 'closer', status: 'active',
  working_days: 'Mon,Tue,Wed,Thu,Fri', start_date: '', end_date: '', ...o
});

describe('building ledger records from form answers', () => {
  it('reads the person ID from the dropdown label, so renames never split history', () => {
    const rec = core.buildRecord(schema, 'closer_eod', { date: '2026-11-02', person: 'Amira Hassan (C-001)', day_off: 'Worked', closes_pif: '1', contract_value: '6000' }, { responseId: 'r1', submittedAt: 't', source: 'trigger' });
    expect(rec.person_id).toBe('C-001');
    expect(rec.person_name).toBe('Amira Hassan');
    expect(rec.closes_pif).toBe(1);
    expect(rec.contract_value).toBe(6000);
  });

  it('a day-off report zeroes every number', () => {
    const rec = core.buildRecord(schema, 'closer_eod', { date: '2026-11-02', person: 'A (C-001)', day_off: 'Day off', closes_pif: '3' }, { responseId: 'r1', submittedAt: 't', source: 'trigger' });
    expect(rec.day_off).toBe('yes');
    expect(rec.closes_pif).toBe(0);
  });

  it('ledger columns match what the record contains', () => {
    const cols = core.ledgerColumns(schema, 'closer_eod');
    const rec = core.buildRecord(schema, 'closer_eod', { date: '2026-11-02', person: 'A (C-001)', day_off: 'Worked' }, { responseId: 'r1', submittedAt: 't', source: 'trigger' });
    expect(Object.keys(rec).sort()).toEqual([...cols].sort());
  });
});

describe('sanity checks flag impossible reports', () => {
  const base = { date: '2026-11-02', person_id: 'C-001', day_off: 'no', calls_on_calendar: 5, shows_new: 3, shows_followup: 0, no_shows: 1, reschedules: 0, cancelled: 0, disqualified: 0, offers: 2, closes_pif: 1, closes_pp: 0, contract_value: 5000 };
  it('accepts a sensible report', () => {
    expect(core.validateRecord('closer_eod', base, '2026-11-20')).toEqual([]);
  });
  it('flags closes above offers, outcomes above calendar, closes without contract value, future dates', () => {
    const flags = core.validateRecord('closer_eod', { ...base, date: '2026-12-01', calls_on_calendar: 2, closes_pp: 3, contract_value: 0 }, '2026-11-20');
    expect(flags.join(' | ')).toMatch(/future/);
    expect(flags.join(' | ')).toMatch(/more than calls on calendar/);
    expect(flags.join(' | ')).toMatch(/closes are more than offers/);
    expect(flags.join(' | ')).toMatch(/no contract value/);
  });
});

describe('missing EODs', () => {
  // 2026-11-16 is a Monday
  const dates = ['2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17'];
  it('only checks active people on their working days; day-off reports count as submitted', () => {
    const team = [person({}), person({ id: 'C-002', name: 'Dan' })];
    const subs = [{ person_id: 'C-001', date: '2026-11-16' }, { person_id: 'C-002', date: '2026-11-16' }];
    const missing = core.findMissing(team, 'closer', subs, dates);
    expect(missing.map((m: any) => `${m.person_id}@${m.date}`).sort()).toEqual(['C-001@2026-11-17', 'C-002@2026-11-17']);
  });
  it('does not chase people after their last day, or setters on the closer form', () => {
    const team = [person({ status: 'inactive', end_date: '2026-11-16' }), person({ id: 'S-001', role: 'setter' })];
    const missing = core.findMissing(team, 'closer', [], dates);
    expect(missing.map((m: any) => `${m.person_id}@${m.date}`)).toEqual(['C-001@2026-11-16']);
  });
  it('people with role "both" are checked on both forms', () => {
    const team = [person({ id: 'B-001', role: 'both' })];
    expect(core.findMissing(team, 'closer', [], ['2026-11-16'])).toHaveLength(1);
    expect(core.findMissing(team, 'setter', [], ['2026-11-16'])).toHaveLength(1);
  });
  it('counts consecutive missed working days, skipping weekends', () => {
    const p = person({});
    const missing = [{ person_id: 'C-001', date: '2026-11-13' }, { person_id: 'C-001', date: '2026-11-16' }]; // Fri + Mon
    expect(core.consecutiveMisses(p, missing, '2026-11-16', 14)).toBe(2);
  });
});

describe('team helpers', () => {
  it('IDs are permanent and never reused', () => {
    expect(core.nextPersonId([{ id: 'C-001' }, { id: 'C-007' }, { id: 'S-002' }], 'closer')).toBe('C-008');
    expect(core.nextPersonId([], 'setter')).toBe('S-001');
  });
  it('people who left stay in the dropdown for 3 days to file their last reports', () => {
    const team = [person({ status: 'inactive', end_date: '2026-11-15' })];
    expect(core.dropdownPeople(team, 'closer', '2026-11-18', 3)).toHaveLength(1);
    expect(core.dropdownPeople(team, 'closer', '2026-11-19', 3)).toHaveLength(0);
  });
  it('remap stops on dates the target already has, and moves the rest', () => {
    const records = [
      { response_id: 'a', person_id: 'C-001', date: '2026-11-02' },
      { response_id: 'b', person_id: 'C-001', date: '2026-11-03' },
      { response_id: 'c', person_id: 'C-002', date: '2026-11-03' }
    ];
    const plan = core.planRemap(records, 'C-001', 'C-002', '2026-11-01', '2026-11-30');
    expect(plan.moves.map((m: any) => m.response_id)).toEqual(['a']);
    expect(plan.collisions.map((m: any) => m.response_id)).toEqual(['b']);
  });
});

describe('scheduling and sync', () => {
  it('a daily job runs once, on the first hourly run after its time', () => {
    expect(core.isDailyJobDue('2026-11-20', 19 * 60 + 59, '20:00', '')).toBe(false);
    expect(core.isDailyJobDue('2026-11-20', 20 * 60 + 14, '20:00', '')).toBe(true);
    expect(core.isDailyJobDue('2026-11-20', 21 * 60, '20:00', '2026-11-20')).toBe(false);
  });
  it('reconciliation finds only responses missing from the ledger', () => {
    expect(core.missingResponseIds(['a', 'b', 'c'], ['a', 'c'])).toEqual(['b']);
  });
  it('Meta upsert updates existing API days and never touches manual rows', () => {
    const existing = [
      { rowIndex: 2, date: '2026-11-01', platform: 'Meta', source: 'api' },
      { rowIndex: 3, date: '2026-11-02', platform: 'Meta', source: 'manual' }
    ];
    const plan = core.planMetaUpsert(existing, [{ date: '2026-11-01' }, { date: '2026-11-02' }]);
    expect(plan.updates.map((u: any) => u.rowIndex)).toEqual([2]);
    expect(plan.inserts.map((i: any) => i.date)).toEqual(['2026-11-02']);
  });
  it('keeps the newest 30 backups', () => {
    const files = Array.from({ length: 32 }, (_, i) => ({ id: `f${i}`, created: i }));
    expect(core.backupsToDelete(files, 30)).toEqual(['f1', 'f0']);
  });
  it('detects stale jobs from local timestamps', () => {
    expect(core.minutesBetweenLocal('2026-11-20T08:00:00', '2026-11-20T10:30:00')).toBe(150);
    expect(core.minutesBetweenLocal('', '2026-11-20T10:30:00')).toBeNull();
  });
  it('API key comparison rejects empty and wrong keys', () => {
    expect(core.safeEqual('abc', 'abc')).toBe(true);
    expect(core.safeEqual('', '')).toBe(false);
    expect(core.safeEqual('abc', 'abd')).toBe(false);
  });
});
