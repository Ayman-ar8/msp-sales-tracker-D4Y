import { describe, expect, it } from 'vitest';
import { resolveAds } from '@/lib/ads';
import type { AdRow } from '@/lib/types';

const row = (o: Partial<AdRow>): AdRow => ({
  date: '2026-11-02', platform: 'Meta', spend: 0, impressions: 0, clicks: 0,
  source: 'api', override: 'no', response_id: '', synced_at: '2026-11-02T10:00:00', ...o
});

describe('ad spend: one number per date and platform', () => {
  it('uses the automatic Meta row over a plain manual Meta entry', () => {
    const out = resolveAds([row({ spend: 1000 }), row({ source: 'manual', spend: 900, synced_at: '2026-11-02T12:00:00' })]);
    expect(out).toHaveLength(1);
    expect(out[0].spend).toBe(1000);
  });

  it('a manual Meta entry marked "replace" wins over the API', () => {
    const out = resolveAds([row({ spend: 1000 }), row({ source: 'manual', override: 'yes', spend: 950 })]);
    expect(out[0].spend).toBe(950);
  });

  it('manual Meta is used when there is no API row (backup)', () => {
    expect(resolveAds([row({ source: 'manual', spend: 700 })])[0].spend).toBe(700);
  });

  it('other platforms add to Meta instead of replacing it', () => {
    const out = resolveAds([row({ spend: 1000 }), row({ platform: 'Google', source: 'manual', spend: 200 })]);
    expect(out.reduce((a, r) => a + r.spend, 0)).toBe(1200);
  });

  it('the latest manual entry for a platform and date wins', () => {
    const out = resolveAds([
      row({ platform: 'Google', source: 'manual', spend: 200, synced_at: '2026-11-02T09:00:00' }),
      row({ platform: 'Google', source: 'manual', spend: 250, synced_at: '2026-11-02T18:00:00' })
    ]);
    expect(out[0].spend).toBe(250);
  });
});
