# {{BUSINESS}} – Sales Tracker SOP

Your assistant: **{{ASSISTANT_NAME}}**. Open Claude Code in this repo and ask
in plain English for anything below. It will show you its plan first.

## Your links

| What | Link |
|---|---|
| Dashboard | {{DASHBOARD_URL}} |
| Master Sheet (founder only) | {{SHEET_URL}} |
| Closer EOD form | {{CLOSER_FORM_URL}} |
| Setter EOD form | {{SETTER_FORM_URL}} |
| Refund or chargeback form (founder) | {{REFUND_FORM_URL}} |
| Manual ad spend form (founder) | {{AD_FORM_URL}} |

## Every day

- Closers and setters submit **one EOD report** by **{{EOD_CUTOFF}}**.
  Anyone missing gets an email reminder at that time.
- You get a summary at **{{SUMMARY_TIME}}** of who missed yesterday, and
  anyone who has missed 2 or more working days in a row. No email means
  everyone reported.
- Meta spend updates every hour. **Sync now** on the dashboard pulls it
  immediately (once every 5 minutes).

## How to fill in your EOD (share with the team)

See `docs/EOD-GUIDE.md`. The rules that matter most:

- One report per day. Made a mistake? Submit again for the same date: the
  latest one counts.
- Day off? Choose "Day off" so you aren't chased.
- **A deposit is not a close.** When a deposit's balance is closed later,
  log it that day as a paid-in-full or payment-plan close. The deposit cash
  you logged earlier stays under deposits, so nothing is counted twice.
- Payment-plan cash includes instalments you collected today.

## Team changes (Sheet > Sales Tracker menu)

| Need | Menu item |
|---|---|
| New closer or setter | Add person, then send them their form link |
| Someone left | Deactivate person (their last day). Then change the dashboard password if they had it (below) |
| Name changed | Rename person (history stays with them) |
| Wrong name picked on reports | Remap entries to another person |
| Made a mistake in the menu | Undo last change |

## Change the dashboard password

Vercel > your project > Settings > Environment Variables >
`DASHBOARD_PASSWORD` > edit > save, then Deployments > … > Redeploy.
Everyone is signed out and needs the new password.

## Refunds and other ad spend

- Refund or chargeback: use the refund form on the day it happens. The
  dashboard shows net cash.
- Spend on Google, YouTube, TikTok etc.: use the manual ad spend form. It
  adds to Meta. To correct a Meta day, choose Meta and "replace".

## If something looks wrong

- The dashboard's top strip turns yellow and says what's wrong.
- You get an email when something breaks or was repaired automatically.
- Ask {{ASSISTANT_NAME}}: "check my data".

## Never

- Never edit the "… Responses" tabs in the Sheet; they're linked to the
  forms. Fix a report by resubmitting it.
- Never click "New deployment" in Apps Script again; use Manage
  deployments > Edit > New version.
- Never paste the Meta token, API key or dashboard password into a chat.
