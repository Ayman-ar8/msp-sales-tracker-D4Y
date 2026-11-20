import type { AdRow } from './types';

export interface AdDay {
  date: string;
  platform: string;
  spend: number;
  impressions: number;
  clicks: number;
  source: string;
}

const latest = (rows: AdRow[]) =>
  rows.reduce((a, b) => ((b.synced_at || '') > (a.synced_at || '') ? b : a));

/**
 * One number per date and platform.
 * Meta: a manual entry marked "replace" wins; otherwise the automatic API row;
 * otherwise the latest manual Meta entry. Other platforms: the latest manual entry.
 */
export function resolveAds(rows: AdRow[]): AdDay[] {
  const groups = new Map<string, AdRow[]>();
  for (const r of rows) {
    if (!r.date || !r.platform) continue;
    const k = `${r.date}|${r.platform}`;
    const g = groups.get(k);
    if (g) g.push(r);
    else groups.set(k, [r]);
  }
  const out: AdDay[] = [];
  for (const group of groups.values()) {
    let pick: AdRow;
    if (group[0].platform === 'Meta') {
      const overrides = group.filter((r) => r.source === 'manual' && r.override === 'yes');
      const api = group.filter((r) => r.source === 'api');
      const manual = group.filter((r) => r.source === 'manual');
      pick = overrides.length ? latest(overrides) : api.length ? latest(api) : latest(manual);
    } else {
      pick = latest(group);
    }
    out.push({
      date: pick.date,
      platform: pick.platform,
      spend: Number(pick.spend) || 0,
      impressions: Number(pick.impressions) || 0,
      clicks: Number(pick.clicks) || 0,
      source: pick.source
    });
  }
  return out.sort((a, b) => (a.date === b.date ? a.platform.localeCompare(b.platform) : a.date.localeCompare(b.date)));
}
