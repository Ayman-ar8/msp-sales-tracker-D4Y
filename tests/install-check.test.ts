/**
 * The end-to-end test in docs/INSTALL-PLAYBOOK.md step 8 promises the founder
 * exact numbers. This test proves the code produces them, from the form
 * answers through the Apps Script record builder to the dashboard metrics.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import schema from '@/schema.json';
import { computeMetrics, sumTotals } from '@/lib/metrics';

const sandbox: Record<string, any> = {};
vm.createContext(sandbox);
vm.runInContext(readFileSync(join(__dirname, '..', 'apps-script', 'src', '00_core.js'), 'utf8'), sandbox);

describe('install playbook step 8', () => {
  const answers = {
    date: '2026-11-20', person: 'Test Closer (C-001)', day_off: 'Worked',
    calls_on_calendar: '5', shows_new: '3', shows_followup: '1', no_shows: '1',
    reschedules: '0', cancelled: '0', disqualified: '0', offers: '2',
    closes_pif: '1', closes_pp: '1', deposits: '0', contract_value: '12000',
    cash_upfront: '6000', cash_pp: '1500', cash_deposit: '0', notes: 'TEST'
  };
  const rec = sandbox.buildRecord(schema, 'closer_eod', answers, { responseId: 'r', submittedAt: '2026-11-20T10:00:00', source: 'trigger' });

  it('produces a clean ledger row (no flags)', () => {
    expect(sandbox.validateRecord('closer_eod', rec, '2026-11-20')).toEqual([]);
  });

  it('shows the numbers the playbook tells the founder to expect', () => {
    const m = computeMetrics(sumTotals({ closer: [rec], setter: [], ads: [], refunds: [] }), { settersEnabled: true });
    expect(m.show_rate).toBeCloseTo(0.8);
    expect(m.close_rate).toBeCloseTo(2 / 3);
    expect(m.cash_collected).toBe(7500);
    expect(m.aov).toBe(6000);
    expect(m.payment_mix_pif).toBeCloseTo(0.5);
  });
});
