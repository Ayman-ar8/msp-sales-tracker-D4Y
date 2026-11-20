# Install playbook (for the assistant)

Follow these steps in order with the founder. After each step:
update `config.json` (`setup_stage: "in_progress"`, append the step to
`setup_steps_done`, set `next_step`), and check the step's result before
moving on. Never skip a check. Explain every click in plain words; the
founder is not technical.

The founder approves the whole install once, at step 2. Re-confirm only if
something goes off-script.

---

## Step 0 – Check the Google Workspace MCP (required)

List your tools and confirm a Google Workspace MCP is connected with tools
for **Drive**, **Sheets** and **Forms** (names vary by server; look for
create/read/update spreadsheet, read form, list files).

- All three present: continue.
- Any missing: **stop**. Tell the founder which is missing and that setup
  needs a Google Workspace MCP with Drive, Sheets and Forms. Guide them to
  add one in Claude's connector / MCP settings, then start a new session.
  Do not continue without it: you use it to build the Sheet and to verify
  every step.

## Step 1 – Questions (one at a time)

The first-run message already asked for your name. Save it as
`assistant_name` in `config.json`, then ask, one question per message,
each with an example and your suggestion:

1. Business name.
2. Currency (3 letters, e.g. USD, GBP, AED).
3. Timezone (e.g. America/New_York). If they use Meta, it must match the
   ad account's timezone (Ads Manager > Account settings).
4. Founder email (for alerts and the morning summary).
5. Do you use setters? (yes / no)
6. Track Meta ad spend automatically? (yes / no, they can add it later)
7. EOD cutoff time: when should reports be in? Reminders go out at this
   time to anyone who hasn't submitted. No default: they choose.
8. Morning summary time: when should the founder get yesterday's missing
   reports? No default: they choose.
9. The team: for each person, name, email, role (closer / setter / both)
   and working days. They can also add people later from the Sheet menu.
10. Who will see the dashboard? One shared password; changing it signs
    everyone out (used when someone leaves).

Save non-secret answers to `config.json`. Never ask for passwords, keys or
tokens here.

## Step 2 – Confirm the install plan

Send the Rule 2 block for the whole install: Goal = "Your sales tracker is
live: forms, master Sheet, hourly Meta sync and a password-protected
dashboard"; Done when = "a test report shows correctly on your dashboard
and has been removed"; list every assumption (mark guesses); Plan = steps
3–9 below with who does what. Wait for an explicit yes.

## Step 3 – Create the master Sheet (you, via the MCP)

1. Create a Google Sheet named `<Business> – Sales Tracker`.
2. Add a tab **Settings** with columns `key`, `value` and these rows:
   `business_name`, `currency`, `timezone`, `founder_email`, `eod_cutoff`
   (24-hour `HH:MM`), `summary_time` (`HH:MM`), `closers_enabled` (yes),
   `setters_enabled` (yes/no), `ads_enabled` (yes/no).
3. Add a tab **Team** with the header
   `id, name, email, role, status, working_days, start_date, end_date` and
   one row per person: IDs `C-001`, `C-002`… for closers, `S-001`… setters,
   `B-001`… both; status `active`; working days like `Mon,Tue,Wed,Thu,Fri`;
   start date today (`YYYY-MM-DD`).
4. **Check:** read both tabs back and compare with the answers. Save the
   Sheet link as `sheet_url` in `config.json`.

## Step 4 – Install the script (founder clicks)

Tell the founder, step by step:

1. Open the Sheet: `<sheet_url>`.
2. **Extensions > Apps Script**. A new tab opens with a file called
   `Code.gs`.
3. Delete everything in it.
4. Open `apps-script/SalesTracker.gs` from their copy of this repo on
   GitHub, click **Raw**, select all and copy. Paste it into `Code.gs`.
5. Click the save icon.
6. In the toolbar, choose the function **setup**, then click **Run**.
7. Google asks for permission: **Review permissions** > choose their
   account > if they see "Google hasn't verified this app", click
   **Advanced** > **Go to … (unsafe)** > **Allow**. This is their own
   script in their own account; the warning is normal.
8. Wait for the pop-up "Sales Tracker is set up". Reload the Sheet; a
   **Sales Tracker** menu appears.

If Run fails with a Settings error, fix that row with the MCP and run again.
If their Google Workspace admin blocks Apps Script, stop and explain they
need their admin to allow it.

**Check (MCP):** tabs `Closer Ledger`, `Refunds`, `Ads` (if ads on),
`Setter Ledger` (if setters on) and `Change log` exist; Settings now has
`form_..._id`, `form_..._url` and `setup_completed_at`. Read the forms with
the MCP and confirm their questions match `schema.json`, and that the
person dropdowns list the team.

## Step 5 – Turn on the dashboard connection (founder clicks)

1. In Apps Script: **Deploy > New deployment**.
2. Click the gear next to "Select type" > **Web app**.
3. Description: `Dashboard API`. Execute as: **Me**. Who has access:
   **Anyone**. (Anyone can reach the address, but it returns nothing
   without the secret key.)
4. **Deploy**, authorise if asked.
5. Back in the Sheet: **Sales Tracker > Show dashboard connection
   details**. Keep this pop-up for step 7. They must copy these values
   straight into Vercel, never into the chat.

Remind them: never click "New deployment" again. Future updates use
**Deploy > Manage deployments > Edit > Version: New version > Deploy**, so
the address never changes.

## Step 6 – Meta (founder only, optional, can be skipped)

Only if `ads_enabled` is yes.

1. Founder follows `docs/meta-token.md` to create a System User token with
   ads_read and finds their ad account ID.
2. In the Sheet: **Sales Tracker > Connect Meta (founder only)**, paste the
   token, then the ad account ID. Never in the chat.
3. A pop-up shows yesterday's spend. Ask the founder to compare it with
   Ads Manager for the same day.
4. If it says the currency or timezone doesn't match: either correct the
   Settings tab (if Settings was wrong) and run **Test Meta connection**,
   or skip Meta for now (manual Ad Spend form still works).

**Check (MCP):** Ads tab has Meta rows with `source = api`; Settings
`meta_status` is `ok`.

## Step 7 – Dashboard on Vercel (founder clicks)

1. Go to vercel.com, sign up / log in with GitHub.
2. **Add New… > Project**, import their copy of this repo. Framework is
   detected automatically (Next.js). Don't change build settings.
3. Open **Environment Variables** and add three:
   - `SHEET_API_URL`: from the Sheet pop-up.
   - `SHEET_API_KEY`: from the Sheet pop-up.
   - `DASHBOARD_PASSWORD`: a password they choose for the team.
4. **Deploy**. When done, open the site and sign in.
5. Ask them for the site address (not the password) and save it as
   `dashboard_url` in `config.json`.

If the page says it can't load data, it names the cause; follow its
instructions (usually a missing variable or a web app not set to "Anyone").
After changing a variable: Vercel > Deployments > … > **Redeploy**.

## Step 8 – End-to-end test (data-mapper runs it)

Ask the founder to open the **Closer EOD** form (Sales Tracker > Show form
links) and submit, for **today**, picking any closer:

| Question | Answer |
|---|---|
| Did you work today? | Worked |
| Calls on calendar | 5 |
| Shows: new calls | 3 |
| Shows: follow-up calls | 1 |
| No-shows | 1 |
| Reschedules / Cancelled / Disqualified | 0 / 0 / 0 |
| Offers made | 2 |
| Closes: paid in full / payment plan | 1 / 1 |
| Deposits taken | 0 |
| Contract value closed | 12000 |
| Cash: upfront / payment plan / deposits | 6000 / 1500 / 0 |
| Notes | TEST |

**Check (MCP):** within a minute the `Closer Ledger` has the row with
exactly these numbers and an empty `flags` column.

On the dashboard: Daily view, today, filtered to that closer. Expected:
Show rate **80.0%** (4 of 5), Close rate **66.7%** (2 of 3 new shows),
Cash collected **7,500**, AOV **6,000**, Payment mix **50% paid in full**.
Ask the founder to confirm each.

Then **Sales Tracker > Remove test entries (Notes = TEST)**, and check the
row is gone from the ledger (MCP) and from the dashboard.

Any mismatch: stop and send it to the data-mapper before going on.

## Step 9 – Handover

1. Write `MY-SOP.md` from `docs/SOP-TEMPLATE.md`, filling every
   `{{placeholder}}` with real values (links from the Settings tab:
   `form_closer_eod_url`, `form_setter_eod_url`, `form_refund_url`,
   `form_ad_spend_url`; `sheet_url`, `dashboard_url`). No secrets.
2. Set `setup_stage` to `complete` in `config.json`; add the install to
   `DECISIONS.md`.
3. Tell the founder the three things to do now: send each closer and
   setter their form link plus `docs/EOD-GUIDE.md`; share the dashboard
   address and password with whoever should see it; bookmark the Sheet.
4. Offer to commit `config.json`, `MY-SOP.md` and `DECISIONS.md` to their
   repo so the next session (on any device) knows the setup.
