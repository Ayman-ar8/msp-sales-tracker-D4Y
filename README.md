# Sales Tracker

A done-for-you sales reporting system for VSL / high-ticket sales teams.
Give this repo to Claude Code and it sets up everything for you:

**Google Forms** (end-of-day reports) → **master Google Sheet** → **dashboard on Vercel**,
with **Meta Ads** spend pulled in every hour.

**New here? Read [SETUP.md](SETUP.md).**

## What you get

- **Closer and setter EOD forms**: one short report per person per day.
- **Master Sheet** you own, with tidy ledger tabs, a team list, settings
  and a change log.
- **Hourly jobs**: reconcile every form response into the Sheet (nothing is
  lost even if a trigger fails), pull Meta spend, fix broken links, back up
  daily (30 days kept).
- **Missing-EOD alerts** at a cutoff time you choose, and a morning summary
  for the founder.
- **Dashboard**: daily / range / monthly views, KPIs vs the previous
  period, funnel, cash by type (upfront, payment plan, deposits), trends,
  closer and setter tables, missing EODs, data-health strip and
  **Sync now**.
- **An assistant you name**, backed by four specialists (data mapper,
  builder, dashboard, ops designer), that confirms its plan before changing
  anything.

## How the numbers work

Every rate is calculated from summed counts for the period, never an
average of daily rates. All formulas live in [`lib/metrics.ts`](lib/metrics.ts)
and every field and metric is defined in [`schema.json`](schema.json).
Tests fail if the two drift apart.

## For developers

```bash
npm install
npm run check        # Apps Script bundle up to date + typecheck + tests
DEMO_MODE=1 DASHBOARD_PASSWORD=test npm run dev   # dashboard with sample data
npm run bundle       # rebuild apps-script/SalesTracker.gs after editing apps-script/src
```

| Path | |
|---|---|
| `schema.json` | Data contract |
| `apps-script/src/` | Google side: forms, ledgers, Meta, alerts, health, API |
| `apps-script/SalesTracker.gs` | Generated single file pasted into Apps Script |
| `app/`, `components/`, `lib/` | Next.js dashboard |
| `tests/` | Metrics, periods, ads, Apps Script logic, contract, install check |
| `CLAUDE.md`, `.claude/` | The assistant, its specialists and the start hook |
| `docs/` | Install playbook, SOP template, EOD guide, Meta token guide, failure checklist |

Environment variables (Vercel): `SHEET_API_URL`, `SHEET_API_KEY`,
`DASHBOARD_PASSWORD`. See `.env.example`.
