'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Payload } from '@/lib/types';
import { metricsFor, prepare, type MetricKey, type Metrics } from '@/lib/metrics';
import { periodFor, type View } from '@/lib/periods';
import { formatChange, formatValue, type Format } from '@/lib/format';
import { addDays, shortDate } from '@/lib/dates';
import { dailySeries, missingInPeriod, personTable, weeklyRates } from '@/lib/views';
import { LineChart } from './LineChart';

interface TileDef {
  key: MetricKey;
  label: string;
  format: Format;
  lowerIsBetter?: boolean;
  needs?: 'ads' | 'setters';
}

const HEADLINE: TileDef[] = [
  { key: 'spend', label: 'Spend', format: 'money', needs: 'ads' },
  { key: 'calls_booked', label: 'Calls booked', format: 'count' },
  { key: 'show_rate', label: 'Show rate', format: 'percent' },
  { key: 'close_rate', label: 'Close rate', format: 'percent' },
  { key: 'cash_collected', label: 'Cash collected', format: 'money' },
  { key: 'roas_cash', label: 'ROAS (cash)', format: 'multiple', needs: 'ads' }
];

const SECONDARY: TileDef[] = [
  { key: 'ctr', label: 'CTR', format: 'percent', needs: 'ads' },
  { key: 'cpc', label: 'CPC', format: 'money', lowerIsBetter: true, needs: 'ads' },
  { key: 'cost_per_booked_call', label: 'Cost per booked call', format: 'money', lowerIsBetter: true, needs: 'ads' },
  { key: 'cpa', label: 'CPA', format: 'money', lowerIsBetter: true, needs: 'ads' },
  { key: 'dq_rate', label: 'DQ rate', format: 'percent', lowerIsBetter: true },
  { key: 'offer_rate', label: 'Offer rate', format: 'percent' },
  { key: 'aov', label: 'AOV', format: 'money' },
  { key: 'roas_contract', label: 'ROAS (contract)', format: 'multiple', needs: 'ads' }
];

const TONE_COLORS = {
  a: 'var(--series-1)',
  b: 'var(--series-2)',
  c: 'var(--series-3)'
};

export function Dashboard({ data, demo = false }: { data: Payload; demo?: boolean }) {
  const s = data.settings;
  const today = data.today;
  const ctx = { settersEnabled: s.setters_enabled };
  const money = (v: number | null) => formatValue(v, 'money', s.currency);

  const [view, setView] = useState<View>('monthly');
  const [date, setDate] = useState(addDays(today, -1));
  const [start, setStart] = useState(addDays(today, -7));
  const [end, setEnd] = useState(addDays(today, -1));
  const [month, setMonth] = useState(today.slice(0, 7));
  const [closerId, setCloserId] = useState('');
  const [setterId, setSetterId] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const prepared = useMemo(() => prepare(data), [data]);
  const period = periodFor(view, { date, start, end, month }, today);
  const filter = { closerId: closerId || undefined, setterId: setterId || undefined };
  const cur = metricsFor(prepared, { start: period.start, end: period.end, ...filter }, ctx);
  const prev = metricsFor(prepared, { start: period.prevStart, end: period.prevEnd, ...filter }, ctx);
  const personFiltered = !!(closerId || setterId);

  const show = (t: TileDef) => (t.needs === 'ads' ? s.ads_enabled : t.needs === 'setters' ? s.setters_enabled : true);

  const closers = data.team.filter((p) => p.role === 'closer' || p.role === 'both');
  const setters = data.team.filter((p) => p.role === 'setter' || p.role === 'both');

  // Trends: at least 14 days of daily points; 8 weeks of weekly rates.
  const trendStart = view === 'daily' || period.start > addDays(period.end, -13) ? addDays(period.end, -13) : period.start;
  const days = useMemo(() => dailySeries(prepared, trendStart, period.end), [prepared, trendStart, period.end]);
  const weeks = useMemo(() => weeklyRates(prepared, period.end, 8, filter, ctx), [prepared, period.end, closerId, setterId, s.setters_enabled]);

  const closerRows = personTable(prepared, data.team, 'closer', period, showInactive, ctx);
  const setterRows = personTable(prepared, data.team, 'setter', period, showInactive, ctx);
  const missing = missingInPeriod(data.missing, period, closerId || setterId || undefined);

  return (
    <main className="page">
      {demo && <p className="demo-banner">Demo data: made-up numbers to preview the layout. Connect your Sheet to see real numbers.</p>}

      <header className="topbar">
        <div>
          <h1>{s.business_name || 'Sales'} dashboard</h1>
          <p className="muted">{period.label} · compared with {period.prevLabel}</p>
        </div>
        <div className="controls">
          <div className="segmented" role="tablist" aria-label="View">
            {(['daily', 'range', 'monthly'] as View[]).map((v) => (
              <button key={v} role="tab" aria-selected={view === v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>
                {v === 'daily' ? 'Daily' : v === 'range' ? 'Range' : 'Monthly'}
              </button>
            ))}
          </div>
          {view === 'daily' && <input type="date" aria-label="Date" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} />}
          {view === 'range' && (
            <>
              <input type="date" aria-label="Start date" value={start} max={end} onChange={(e) => e.target.value && setStart(e.target.value)} />
              <input type="date" aria-label="End date" value={end} min={start} max={today} onChange={(e) => e.target.value && setEnd(e.target.value)} />
            </>
          )}
          {view === 'monthly' && <input type="month" aria-label="Month" value={month} max={today.slice(0, 7)} onChange={(e) => e.target.value && setMonth(e.target.value)} />}
          {s.closers_enabled && (
            <select aria-label="Closer" value={closerId} onChange={(e) => { setCloserId(e.target.value); setSetterId(''); }}>
              <option value="">All closers</option>
              {closers.map((p) => <option key={p.id} value={p.id}>{p.name}{p.status !== 'active' ? ' (inactive)' : ''}</option>)}
            </select>
          )}
          {s.setters_enabled && (
            <select aria-label="Setter" value={setterId} onChange={(e) => { setSetterId(e.target.value); setCloserId(''); }}>
              <option value="">All setters</option>
              {setters.map((p) => <option key={p.id} value={p.id}>{p.name}{p.status !== 'active' ? ' (inactive)' : ''}</option>)}
            </select>
          )}
        </div>
      </header>

      <HealthStrip data={data} demo={demo} />

      {personFiltered && <p className="note">Filtered to one person: ad spend isn&rsquo;t split by person, so spend-based numbers show &ldquo;—&rdquo;.</p>}

      <section className="tiles headline" aria-label="Headline numbers">
        {HEADLINE.filter(show).map((t) => <Tile key={t.key} def={t} cur={cur.metrics} prev={prev.metrics} currency={s.currency} big />)}
      </section>
      <section className="tiles secondary" aria-label="More numbers">
        {SECONDARY.filter(show).map((t) => <Tile key={t.key} def={t} cur={cur.metrics} prev={prev.metrics} currency={s.currency} />)}
      </section>

      <div className="grid-2">
        <section className="panel">
          <h2>Funnel</h2>
          {s.setters_enabled && (
            <FunnelGroup
              title="Setting"
              steps={[
                { label: 'Conversations', value: cur.totals.conversations },
                { label: 'Qualified', value: cur.totals.qualified_conversations },
                { label: 'Calls booked', value: cur.totals.calls_booked }
              ]}
            />
          )}
          <FunnelGroup
            title="Closing"
            steps={[
              { label: 'Shows (new calls)', value: cur.totals.shows_new },
              { label: 'Offers', value: cur.totals.offers },
              { label: 'Closes', value: cur.totals.closes_pif + cur.totals.closes_pp }
            ]}
          />
          <p className="muted small">
            No-shows {formatValue(cur.totals.no_shows, 'count', s.currency)} · Follow-up shows {formatValue(cur.totals.shows_followup, 'count', s.currency)} · Disqualified {formatValue(cur.totals.disqualified, 'count', s.currency)} · Deposits {formatValue(cur.totals.deposits, 'count', s.currency)}
          </p>
          <p className="muted small">Setting counts by booking date; closing counts by call date, so the two groups aren&rsquo;t divided into each other.</p>
        </section>

        <section className="panel">
          <h2>Cash by type</h2>
          <CashBars totals={cur.totals} currency={s.currency} />
          <dl className="facts">
            <div><dt>Payment mix</dt><dd>{formatValue(cur.metrics.payment_mix_pif, 'percent', s.currency)} paid in full · {cur.metrics.payment_mix_pif === null ? '—' : formatValue(1 - cur.metrics.payment_mix_pif, 'percent', s.currency)} payment plan</dd></div>
            <div><dt>Contract value closed</dt><dd>{money(cur.totals.contract_value)}</dd></div>
            <div><dt>Refunds</dt><dd>{money(cur.totals.refunds)}</dd></div>
            <div><dt>Net cash</dt><dd>{money(cur.metrics.net_cash)}</dd></div>
          </dl>
          <p className="muted small">Cash = all cash collected in the period, including instalments on earlier deals.</p>
        </section>
      </div>

      <div className="grid-2">
        <section className="panel">
          <h2>Spend vs cash, by day</h2>
          <Legend items={[...(s.ads_enabled && !personFiltered ? [{ name: 'Spend', color: TONE_COLORS.b }] : []), { name: 'Cash', color: TONE_COLORS.a }]} />
          <LineChart
            ariaLabel="Spend and cash by day"
            labels={days.map((d) => shortDate(d.date))}
            series={[
              ...(s.ads_enabled && !personFiltered ? [{ name: 'Spend', color: TONE_COLORS.b, values: days.map((d) => d.spend) }] : []),
              { name: 'Cash', color: TONE_COLORS.a, values: days.map((d) => d.cash) }
            ]}
            format={(v) => formatValue(v, 'money', s.currency)}
          />
        </section>
        <section className="panel">
          <h2>Show and close rate, by week</h2>
          <Legend items={[{ name: 'Show rate', color: TONE_COLORS.a }, { name: 'Close rate', color: TONE_COLORS.b }]} />
          <LineChart
            ariaLabel="Show rate and close rate by week"
            labels={weeks.map((w) => `wk ${shortDate(w.week)}`)}
            series={[
              { name: 'Show rate', color: TONE_COLORS.a, values: weeks.map((w) => w.show_rate) },
              { name: 'Close rate', color: TONE_COLORS.b, values: weeks.map((w) => w.close_rate) }
            ]}
            format={(v) => formatValue(v, 'percent', s.currency)}
          />
        </section>
      </div>

      {s.closers_enabled && (
        <section className="panel">
          <div className="panel-head">
            <h2>Closers</h2>
            <label className="toggle"><input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /> Show inactive people</label>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Closer</th><th>Calls</th><th>Show %</th><th>Close %</th><th>Closes</th><th>Cash</th><th>Contract</th><th>AOV</th></tr>
              </thead>
              <tbody>
                {closerRows.map((r) => (
                  <tr key={r.person.id} className={r.inactive ? 'inactive' : ''}>
                    <td>{r.person.name}{r.inactive && <span className="tag">inactive</span>}</td>
                    <td>{formatValue(r.totals.calls_on_calendar, 'count', s.currency)}</td>
                    <td>{formatValue(r.metrics.show_rate, 'percent', s.currency)}</td>
                    <td>{formatValue(r.metrics.close_rate, 'percent', s.currency)}</td>
                    <td>{formatValue(r.metrics.closes, 'count', s.currency)}</td>
                    <td>{money(r.metrics.cash_collected)}</td>
                    <td>{money(r.metrics.contract_value)}</td>
                    <td>{money(r.metrics.aov)}</td>
                  </tr>
                ))}
                {!closerRows.length && <tr><td colSpan={8} className="muted">No closers yet. Add them from the Sheet: Sales Tracker &gt; Add person.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="grid-2">
        {s.setters_enabled && (
          <section className="panel">
            <h2>Setters</h2>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Setter</th><th>Conversations</th><th>Booked</th><th>Booking %</th></tr></thead>
                <tbody>
                  {setterRows.map((r) => (
                    <tr key={r.person.id} className={r.inactive ? 'inactive' : ''}>
                      <td>{r.person.name}{r.inactive && <span className="tag">inactive</span>}</td>
                      <td>{formatValue(r.totals.conversations, 'count', s.currency)}</td>
                      <td>{formatValue(r.totals.calls_booked, 'count', s.currency)}</td>
                      <td>{formatValue(r.metrics.booking_rate, 'percent', s.currency)}</td>
                    </tr>
                  ))}
                  {!setterRows.length && <tr><td colSpan={4} className="muted">No setters yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        )}
        <section className="panel">
          <h2>Missing EODs</h2>
          <p className="muted small">Working days with no report, in this period. Late reports clear automatically.</p>
          {missing.length ? (
            <ul className="missing">
              {missing.slice(0, 30).map((m) => (
                <li key={`${m.person_id}-${m.date}-${m.form}`}><span>{m.name}</span><span className="muted">{shortDate(m.date)} · {m.form}</span></li>
              ))}
              {missing.length > 30 && <li className="muted">and {missing.length - 30} more</li>}
            </ul>
          ) : (
            <p className="ok-text">Everyone has reported.</p>
          )}
        </section>
      </div>

      <footer className="footer">
        <span className="muted">Data as of {data.generated_at.replace('T', ' ')} ({s.timezone}) · schema {data.schema_version}</span>
        {!demo && <form method="post" action="/api/logout"><button className="link">Sign out</button></form>}
      </footer>
    </main>
  );
}

function Tile({ def, cur, prev, currency, big = false }: { def: TileDef; cur: Metrics; prev: Metrics; currency: string; big?: boolean }) {
  const v = cur[def.key];
  const p = prev[def.key];
  const ch = formatChange(v, p, def.format, def.lowerIsBetter);
  return (
    <div className={`tile ${big ? 'big' : ''}`}>
      <span className="tile-label">{def.label}</span>
      <span className="tile-value">{formatValue(v, def.format, currency)}</span>
      {big ? <span className={`tile-change ${ch.tone}`}>{ch.text}</span> : null}
    </div>
  );
}

function FunnelGroup({ title, steps }: { title: string; steps: { label: string; value: number }[] }) {
  const max = Math.max(...steps.map((s) => s.value), 1);
  return (
    <div className="funnel">
      <h3>{title}</h3>
      {steps.map((st, i) => {
        const prev = i > 0 ? steps[i - 1].value : null;
        const rate = prev ? st.value / prev : null;
        return (
          <div key={st.label} className="funnel-row">
            <span className="funnel-label">{st.label}</span>
            <span className="funnel-bar"><span style={{ width: `${(st.value / max) * 100}%` }} /></span>
            <span className="funnel-value">
              {new Intl.NumberFormat('en').format(st.value)}
              {rate !== null && <span className="muted"> · {(rate * 100).toFixed(0)}%</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function CashBars({ totals, currency }: { totals: { cash_upfront: number; cash_pp: number; cash_deposit: number }; currency: string }) {
  const parts = [
    { name: 'Upfront', value: totals.cash_upfront, color: 'var(--series-1)' },
    { name: 'Payment plan', value: totals.cash_pp, color: 'var(--series-2)' },
    { name: 'Deposits', value: totals.cash_deposit, color: 'var(--series-3)' }
  ];
  const total = parts.reduce((a, p) => a + p.value, 0);
  return (
    <div className="cash">
      <div className="cash-bar" role="img" aria-label="Cash collected by type">
        {total > 0 && parts.map((p) => <span key={p.name} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />)}
      </div>
      <ul className="cash-legend">
        {parts.map((p) => (
          <li key={p.name}>
            <span className="swatch" style={{ background: p.color }} />
            <span>{p.name}</span>
            <strong>{formatValue(p.value, 'money', currency)}</strong>
            <span className="muted">{total > 0 ? `${((p.value / total) * 100).toFixed(0)}%` : '—'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Legend({ items }: { items: { name: string; color: string }[] }) {
  return (
    <ul className="legend">
      {items.map((i) => <li key={i.name}><span className="swatch line" style={{ background: i.color }} />{i.name}</li>)}
    </ul>
  );
}

function HealthStrip({ data, demo }: { data: Payload; demo: boolean }) {
  const h = data.health;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState('');

  const warnings: string[] = [];
  if (h.minutes_since_health_check !== null && h.minutes_since_health_check > 120) {
    warnings.push(`Automatic jobs haven't run for ${Math.round(h.minutes_since_health_check / 60)} hours. The Sheet owner may have lost access. Ask your assistant to "check my data".`);
  }
  if (data.settings.ads_enabled && h.meta_status === 'error') warnings.push(`Meta sync is failing: ${h.meta_last_error}`);
  if (data.settings.ads_enabled && h.meta_status === 'mismatch') warnings.push(`Meta isn't used yet: ${h.meta_last_error}`);
  if (data.settings.ads_enabled && h.meta_status === 'ok' && h.minutes_since_meta_sync !== null && h.minutes_since_meta_sync > 180) {
    warnings.push('Meta numbers are more than 3 hours old.');
  }
  h.issues.filter((i) => !i.startsWith('Repaired')).forEach((i) => warnings.push(i));

  async function sync() {
    setMsg('Syncing…');
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const body = await res.json();
      if (body.status === 'cooldown') setMsg(`Synced recently. Try again in ${Math.ceil(body.retry_after_seconds / 60)} min.`);
      else if (body.ok) setMsg('Meta synced.');
      else setMsg(`Not synced: ${body.message || body.status}`);
      startTransition(() => router.refresh());
    } catch {
      setMsg('Sync failed. Check your connection.');
    }
  }

  const last = (s?: string) => (s ? s.replace('T', ' ').slice(0, 16) : 'none yet');

  return (
    <section className={`health ${warnings.length ? 'warn' : ''}`} aria-label="Data health">
      <div className="health-row">
        <span className={`dot ${warnings.length ? 'dot-warn' : 'dot-ok'}`} aria-hidden />
        <span>
          {data.settings.closers_enabled && <>Last closer EOD {last(h.last_response.closer)} · </>}
          {data.settings.setters_enabled && <>Last setter EOD {last(h.last_response.setter)} · </>}
          Reconciled {last(h.last_reconcile)} · {h.rows_backfilled_total} rows backfilled
        </span>
        {data.settings.ads_enabled && (
          <span className="health-sync">
            <span className="muted">Meta synced {last(h.meta_last_sync)}</span>
            <button onClick={sync} disabled={pending || demo} title={demo ? 'Not available in demo' : 'Pull the latest Meta numbers now'}>
              {pending ? 'Refreshing…' : 'Sync now'}
            </button>
          </span>
        )}
      </div>
      {msg && <p className="small">{msg}</p>}
      {warnings.length > 0 && <ul className="warnings">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>}
    </section>
  );
}
