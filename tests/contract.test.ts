/**
 * The data contract. These tests fail the build if code and schema.json drift
 * apart: a metric with no formula, a formula reading a field that doesn't
 * exist, a dashboard type missing a ledger column, or a stale Apps Script bundle.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import schema from '@/schema.json';
import { computeMetrics, ZERO_TOTALS } from '@/lib/metrics';
import { demoPayload } from '@/lib/demo';
import { bundle } from '../scripts/bundle-apps-script.mjs';

const sandbox: Record<string, any> = {};
vm.createContext(sandbox);
vm.runInContext(readFileSync(join(__dirname, '..', 'apps-script', 'src', '00_core.js'), 'utf8'), sandbox);

describe('schema.json is the single source of truth', () => {
  it('every metric in the schema has exactly one formula in lib/metrics.ts, and vice versa', () => {
    const computed = Object.keys(computeMetrics({ ...ZERO_TOTALS }, { settersEnabled: true })).sort();
    const declared = schema.metrics.map((m) => m.key).sort();
    expect(computed).toEqual(declared);
  });

  it('every metric input names a real field', () => {
    for (const m of schema.metrics) {
      for (const input of m.inputs) {
        const [source, field] = input.split('.');
        if (source === 'ads') {
          expect(schema.adsColumns, `${m.key} -> ${input}`).toContain(field);
        } else {
          const form = (schema.forms as Record<string, { fields: { key: string }[] }>)[source];
          expect(form, `${m.key} -> ${input}`).toBeDefined();
          expect(form.fields.map((f) => f.key), `${m.key} -> ${input}`).toContain(field);
        }
      }
    }
  });

  it('field keys are unique within each form and every form has a date', () => {
    for (const [key, form] of Object.entries(schema.forms)) {
      const keys = form.fields.map((f) => f.key);
      expect(new Set(keys).size, key).toBe(keys.length);
      expect(keys, key).toContain('date');
    }
  });

  it('the dashboard row types carry every ledger column (checked via the demo data)', () => {
    const demo = demoPayload('2026-11-20');
    const cols = (k: string) => [...sandbox.ledgerColumns(schema, k)].sort();
    expect(Object.keys(demo.closer[0]).sort()).toEqual(cols('closer_eod'));
    expect(Object.keys(demo.setter[0]).sort()).toEqual(cols('setter_eod'));
    expect(Object.keys(demo.ads[0]).sort()).toEqual([...schema.adsColumns].sort());
    expect(Object.keys(demo.team[0]).sort()).toEqual([...schema.teamColumns].sort());
  });

  it('apps-script/SalesTracker.gs is rebuilt from the current sources', () => {
    const current = readFileSync(join(__dirname, '..', 'apps-script', 'SalesTracker.gs'), 'utf8');
    expect(current === bundle(), 'Run: npm run bundle').toBe(true);
  });
});
