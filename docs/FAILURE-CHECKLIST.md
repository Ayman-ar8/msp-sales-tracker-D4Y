# Failure checklist (data-mapper)

Known ways this system breaks, and how each one is handled. Check every
change against this list. "Test" names the test that guards it.

| Area | What breaks | How it's handled | Guard |
|---|---|---|---|
| Forms | Editing or deleting rows in a form-linked tab corrupts the link | Response tabs are protected (warning); ledgers are separate and written only by script | `protectHeaders_` |
| Forms | Resubmitted report double-counts | Latest report per person per date wins | `tests/metrics.test.ts` |
| Forms | Report sent after midnight lands on the wrong day | Date is a required question with no default | schema `date` field |
| Forms | Future date or impossible numbers | Saved but flagged; founder emailed | `validateRecord` tests |
| Forms | Follow-up calls inflate close rate | Close, DQ, offer, deposit rates divide by new-call shows | metrics tests |
| Forms | Day off counted as missing | "Day off" choice submits immediately and counts as a report | core tests |
| Forms | Deposit counted as a close, then again at balance | Deposit ≠ close; balance logged later as PIF/PP close | EOD guide + schema |
| Delivery | Submit trigger fails (quota, auth) | Hourly reconciliation re-reads every form response and backfills by response ID | core tests |
| Delivery | Form unlinked from the Sheet | Hourly health check re-links and emails the founder | `runHealthCheck_` |
| Delivery | Duplicates from retries | Ledger writes skip known response IDs | `ingestResponse_` |
| Delivery | Test entries come back after deletion | "Remove test entries" deletes from the form too | `removeTestEntries_` |
| Team | Two people with the same name | Dropdown shows "Name (ID)"; ID is parsed | core tests |
| Team | Rename splits history | Ledgers store the permanent ID; names come from Team | core tests |
| Team | Remap onto a date the target already has | Remap stops and offers to move only non-clashing dates | `planRemap` test |
| Team | Leaver can't file last reports | Stays in dropdown 3 days after end date | core tests |
| Team | Leaver still has dashboard access | Deactivate prompts a password rotation | ops play |
| Meta | Hourly pull and Sync now overlap | Script lock; the second run skips | `pullMeta_` |
| Meta | Recent days revised by Meta | Every pull refreshes today + 3 days | `META_LOOKBACK_DAYS` |
| Meta | Timezone or currency mismatch | Connect/Test stops and explains; pull disabled until fixed | `testMeta` |
| Meta | Token revoked / API version retired | Error saved, founder emailed once, dashboard warns | health strip |
| Meta | Manual spend overwritten | Manual rows never touched by the pull; "replace" overrides per date | ads tests |
| Endpoint | API key in URL gets logged | Key sent in POST body; can be rotated from the menu | `doPost` |
| Endpoint | New deployment changes the URL | Docs and rules: only ever "Manage deployments > New version" | CLAUDE.md |
| Endpoint | Sync endpoint reachable without password | Middleware guards every route except login | browser check |
| Endpoint | Triggers' owner loses access, everything stops silently | Dashboard warns when the health check is over 2 hours old | health strip |
| Metrics | Averaging daily rates | All rates from summed counts | metrics tests |
| Metrics | Divide by zero shows 0% | null, shown as "—" | metrics tests |
| Metrics | Month-to-date vs full month looks like a drop | Compared with same days of the previous month | periods tests |
| Metrics | Spend-based metrics on one person | Blanked when filtered to a person | metrics tests |
| Metrics | Setter bookings divided by closer shows | Funnel shows each group separately | dashboard |
| Metrics | Browser timezone changes "today" | All dates come from the Sheet in the business timezone | periods tests |
| Install | Running setup twice duplicates forms | Setup finds existing items by IDs in Settings | `ensureForm_` |
| Install | Workspace admin blocks Apps Script | Playbook stops at step 4 and explains | playbook |
| Contract | Code and schema drift | Contract tests fail the build | `tests/contract.test.ts` |
