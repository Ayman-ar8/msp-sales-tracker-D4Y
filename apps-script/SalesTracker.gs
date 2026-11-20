/**
 * Sales Tracker – Apps Script (generated file, do not edit by hand).
 * Schema version 1.0.0. Source: apps-script/src/*.js + schema.json
 *
 * Paste this whole file into Extensions > Apps Script (replace everything),
 * save, then choose the function "setup" and click Run.
 */

var SCHEMA = {
  "version": "1.0.0",
  "description": "The data contract. Every form field, ledger column and metric is defined here. Owned by the data-mapper. Change this first, then the code.",
  "forms": {
    "closer_eod": {
      "title": "Closer EOD Report",
      "description": "Fill this in once at the end of every working day. All numbers are for that day only. A deposit is not a close: when a deposit's balance is closed later, log it that day as a paid-in-full or payment-plan close.",
      "compartment": "closers",
      "role": "closer",
      "ledger": "Closer Ledger",
      "responsesTab": "Closer EOD Responses",
      "fields": [
        {
          "key": "date",
          "label": "Date of this report",
          "type": "date",
          "required": true,
          "page": 1
        },
        {
          "key": "person",
          "label": "Closer",
          "type": "person",
          "required": true,
          "page": 1
        },
        {
          "key": "day_off",
          "label": "Did you work today?",
          "type": "dayoff",
          "required": true,
          "page": 1
        },
        {
          "key": "calls_on_calendar",
          "label": "Calls on your calendar today",
          "type": "count",
          "required": true,
          "page": 2
        },
        {
          "key": "shows_new",
          "label": "Shows: new calls",
          "type": "count",
          "required": true,
          "page": 2
        },
        {
          "key": "shows_followup",
          "label": "Shows: follow-up calls",
          "type": "count",
          "required": true,
          "page": 2
        },
        {
          "key": "no_shows",
          "label": "No-shows",
          "type": "count",
          "required": true,
          "page": 2
        },
        {
          "key": "reschedules",
          "label": "Reschedules",
          "type": "count",
          "required": true,
          "page": 2
        },
        {
          "key": "cancelled",
          "label": "Cancelled",
          "type": "count",
          "required": true,
          "page": 2
        },
        {
          "key": "disqualified",
          "label": "Disqualified (showed, not a fit)",
          "type": "count",
          "required": true,
          "page": 2
        },
        {
          "key": "offers",
          "label": "Offers made",
          "type": "count",
          "required": true,
          "page": 2
        },
        {
          "key": "closes_pif",
          "label": "Closes: paid in full",
          "type": "count",
          "required": true,
          "page": 2
        },
        {
          "key": "closes_pp",
          "label": "Closes: payment plan",
          "type": "count",
          "required": true,
          "page": 2
        },
        {
          "key": "deposits",
          "label": "Deposits taken (balance not yet closed)",
          "type": "count",
          "required": true,
          "page": 2
        },
        {
          "key": "contract_value",
          "label": "Contract value closed (paid-in-full + payment-plan closes)",
          "type": "money",
          "required": true,
          "page": 2
        },
        {
          "key": "cash_upfront",
          "label": "Cash collected: upfront (paid in full)",
          "type": "money",
          "required": true,
          "page": 2
        },
        {
          "key": "cash_pp",
          "label": "Cash collected: payment plan (first payments and instalments)",
          "type": "money",
          "required": true,
          "page": 2
        },
        {
          "key": "cash_deposit",
          "label": "Cash collected: deposits",
          "type": "money",
          "required": true,
          "page": 2
        },
        {
          "key": "notes",
          "label": "Notes (optional)",
          "type": "text",
          "required": false,
          "page": 2
        }
      ]
    },
    "setter_eod": {
      "title": "Setter EOD Report",
      "description": "Fill this in once at the end of every working day. All numbers are for that day only.",
      "compartment": "setters",
      "role": "setter",
      "ledger": "Setter Ledger",
      "responsesTab": "Setter EOD Responses",
      "fields": [
        {
          "key": "date",
          "label": "Date of this report",
          "type": "date",
          "required": true,
          "page": 1
        },
        {
          "key": "person",
          "label": "Setter",
          "type": "person",
          "required": true,
          "page": 1
        },
        {
          "key": "day_off",
          "label": "Did you work today?",
          "type": "dayoff",
          "required": true,
          "page": 1
        },
        {
          "key": "conversations",
          "label": "Conversations",
          "type": "count",
          "required": true,
          "page": 2
        },
        {
          "key": "qualified_conversations",
          "label": "Qualified conversations",
          "type": "count",
          "required": true,
          "page": 2
        },
        {
          "key": "calls_booked",
          "label": "Calls booked",
          "type": "count",
          "required": true,
          "page": 2
        },
        {
          "key": "notes",
          "label": "Notes (optional)",
          "type": "text",
          "required": false,
          "page": 2
        }
      ]
    },
    "ad_spend": {
      "title": "Manual Ad Spend",
      "description": "Founder only. Use this for ad spend on platforms other than Meta, or to replace Meta's automatic numbers for a date.",
      "compartment": "ads",
      "role": null,
      "ledger": "Ads",
      "responsesTab": "Ad Spend Responses",
      "fields": [
        {
          "key": "date",
          "label": "Date",
          "type": "date",
          "required": true,
          "page": 1
        },
        {
          "key": "platform",
          "label": "Platform",
          "type": "choice",
          "required": true,
          "page": 1,
          "choices": [
            "Meta",
            "Google",
            "YouTube",
            "TikTok",
            "Other"
          ]
        },
        {
          "key": "spend",
          "label": "Spend",
          "type": "money",
          "required": true,
          "page": 1
        },
        {
          "key": "impressions",
          "label": "Impressions",
          "type": "count",
          "required": true,
          "page": 1
        },
        {
          "key": "clicks",
          "label": "Clicks",
          "type": "count",
          "required": true,
          "page": 1
        },
        {
          "key": "override",
          "label": "Meta only: replace the automatic Meta numbers for this date?",
          "type": "yesno",
          "required": true,
          "page": 1
        }
      ]
    },
    "refund": {
      "title": "Refund or Chargeback",
      "description": "Founder only. Log each refund or chargeback on the day it happened.",
      "compartment": "closers",
      "role": "closer",
      "ledger": "Refunds",
      "responsesTab": "Refund Responses",
      "fields": [
        {
          "key": "date",
          "label": "Date",
          "type": "date",
          "required": true,
          "page": 1
        },
        {
          "key": "person",
          "label": "Closer on the deal",
          "type": "person",
          "required": true,
          "page": 1
        },
        {
          "key": "amount",
          "label": "Amount refunded",
          "type": "money",
          "required": true,
          "page": 1
        },
        {
          "key": "kind",
          "label": "Type",
          "type": "choice",
          "required": true,
          "page": 1,
          "choices": [
            "Refund",
            "Chargeback"
          ]
        },
        {
          "key": "notes",
          "label": "Notes (optional)",
          "type": "text",
          "required": false,
          "page": 1
        }
      ]
    }
  },
  "ledgerMetaColumns": [
    "response_id",
    "submitted_at"
  ],
  "ledgerTailColumns": [
    "flags",
    "source"
  ],
  "adsColumns": [
    "date",
    "platform",
    "spend",
    "impressions",
    "clicks",
    "source",
    "override",
    "response_id",
    "synced_at"
  ],
  "teamColumns": [
    "id",
    "name",
    "email",
    "role",
    "status",
    "working_days",
    "start_date",
    "end_date"
  ],
  "roles": [
    "closer",
    "setter",
    "both"
  ],
  "weekdays": [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun"
  ],
  "metrics": [
    {
      "key": "spend",
      "label": "Spend",
      "kind": "sum",
      "format": "money",
      "inputs": [
        "ads.spend"
      ]
    },
    {
      "key": "ctr",
      "label": "CTR",
      "kind": "rate",
      "format": "percent",
      "inputs": [
        "ads.clicks",
        "ads.impressions"
      ],
      "formula": "Σ clicks ÷ Σ impressions"
    },
    {
      "key": "cpc",
      "label": "CPC",
      "kind": "ratio",
      "format": "money",
      "inputs": [
        "ads.spend",
        "ads.clicks"
      ],
      "formula": "Σ spend ÷ Σ clicks"
    },
    {
      "key": "conversations",
      "label": "Conversations",
      "kind": "sum",
      "format": "count",
      "inputs": [
        "setter_eod.conversations"
      ]
    },
    {
      "key": "calls_booked",
      "label": "Calls booked",
      "kind": "sum",
      "format": "count",
      "inputs": [
        "setter_eod.calls_booked"
      ]
    },
    {
      "key": "booking_rate",
      "label": "Booking rate",
      "kind": "rate",
      "format": "percent",
      "inputs": [
        "setter_eod.calls_booked",
        "setter_eod.conversations"
      ],
      "formula": "Σ calls booked ÷ Σ conversations"
    },
    {
      "key": "cost_per_booked_call",
      "label": "Cost per booked call",
      "kind": "ratio",
      "format": "money",
      "inputs": [
        "ads.spend",
        "setter_eod.calls_booked",
        "closer_eod.calls_on_calendar"
      ],
      "formula": "Σ spend ÷ Σ calls booked (Σ calls on calendar when setters are off)"
    },
    {
      "key": "calls_on_calendar",
      "label": "Calls on calendar",
      "kind": "sum",
      "format": "count",
      "inputs": [
        "closer_eod.calls_on_calendar"
      ]
    },
    {
      "key": "show_rate",
      "label": "Show rate",
      "kind": "rate",
      "format": "percent",
      "inputs": [
        "closer_eod.shows_new",
        "closer_eod.shows_followup",
        "closer_eod.no_shows"
      ],
      "formula": "Σ shows ÷ (Σ shows + Σ no-shows)"
    },
    {
      "key": "dq_rate",
      "label": "DQ rate",
      "kind": "rate",
      "format": "percent",
      "inputs": [
        "closer_eod.disqualified",
        "closer_eod.shows_new"
      ],
      "formula": "Σ DQ ÷ Σ new-call shows"
    },
    {
      "key": "offer_rate",
      "label": "Offer rate",
      "kind": "rate",
      "format": "percent",
      "inputs": [
        "closer_eod.offers",
        "closer_eod.shows_new"
      ],
      "formula": "Σ offers ÷ Σ new-call shows"
    },
    {
      "key": "closes",
      "label": "Closes",
      "kind": "sum",
      "format": "count",
      "inputs": [
        "closer_eod.closes_pif",
        "closer_eod.closes_pp"
      ]
    },
    {
      "key": "close_rate",
      "label": "Close rate",
      "kind": "rate",
      "format": "percent",
      "inputs": [
        "closer_eod.closes_pif",
        "closer_eod.closes_pp",
        "closer_eod.shows_new"
      ],
      "formula": "Σ closes ÷ Σ new-call shows"
    },
    {
      "key": "deposit_rate",
      "label": "Deposit rate",
      "kind": "rate",
      "format": "percent",
      "inputs": [
        "closer_eod.deposits",
        "closer_eod.shows_new"
      ],
      "formula": "Σ deposits ÷ Σ new-call shows"
    },
    {
      "key": "cash_collected",
      "label": "Cash collected",
      "kind": "sum",
      "format": "money",
      "inputs": [
        "closer_eod.cash_upfront",
        "closer_eod.cash_pp",
        "closer_eod.cash_deposit"
      ]
    },
    {
      "key": "refunds",
      "label": "Refunds",
      "kind": "sum",
      "format": "money",
      "inputs": [
        "refund.amount"
      ]
    },
    {
      "key": "net_cash",
      "label": "Net cash",
      "kind": "sum",
      "format": "money",
      "inputs": [
        "closer_eod.cash_upfront",
        "closer_eod.cash_pp",
        "closer_eod.cash_deposit",
        "refund.amount"
      ],
      "formula": "Σ cash collected − Σ refunds"
    },
    {
      "key": "payment_mix_pif",
      "label": "Paid in full share",
      "kind": "rate",
      "format": "percent",
      "inputs": [
        "closer_eod.closes_pif",
        "closer_eod.closes_pp"
      ],
      "formula": "Σ paid-in-full closes ÷ Σ closes"
    },
    {
      "key": "contract_value",
      "label": "Contract value",
      "kind": "sum",
      "format": "money",
      "inputs": [
        "closer_eod.contract_value"
      ]
    },
    {
      "key": "aov",
      "label": "AOV",
      "kind": "ratio",
      "format": "money",
      "inputs": [
        "closer_eod.contract_value",
        "closer_eod.closes_pif",
        "closer_eod.closes_pp"
      ],
      "formula": "Σ contract value ÷ Σ closes"
    },
    {
      "key": "cpa",
      "label": "CPA",
      "kind": "ratio",
      "format": "money",
      "inputs": [
        "ads.spend",
        "closer_eod.closes_pif",
        "closer_eod.closes_pp"
      ],
      "formula": "Σ spend ÷ Σ closes"
    },
    {
      "key": "roas_cash",
      "label": "ROAS (cash)",
      "kind": "ratio",
      "format": "multiple",
      "inputs": [
        "closer_eod.cash_upfront",
        "closer_eod.cash_pp",
        "closer_eod.cash_deposit",
        "ads.spend"
      ],
      "formula": "Σ cash collected in period ÷ Σ spend"
    },
    {
      "key": "roas_contract",
      "label": "ROAS (contract)",
      "kind": "ratio",
      "format": "multiple",
      "inputs": [
        "closer_eod.contract_value",
        "ads.spend"
      ],
      "formula": "Σ contract value ÷ Σ spend"
    }
  ]
};

/* ===== 00_core.js ===== */
/**
 * Pure logic: no Google services in this file, so it can be tested in Node.
 * Everything here works on plain strings, numbers and objects.
 * Dates are ISO strings "YYYY-MM-DD" in the business timezone.
 */

var WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
var DEFAULT_WORKING_DAYS = 'Mon,Tue,Wed,Thu,Fri';
var PERSON_LABEL_RE = /^(.*?)\s*\(([A-Z]+-\d+)\)\s*$/;
var ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function pad2(n) {
  return (n < 10 ? '0' : '') + n;
}

function isIsoDate(s) {
  return typeof s === 'string' && ISO_DATE_RE.test(s);
}

/** Add whole days to an ISO date, calendar-correct, timezone-free. */
function addDays(iso, n) {
  var p = iso.split('-');
  var d = new Date(Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2]) + n));
  return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate());
}

/** 'Mon'..'Sun' for an ISO date. */
function weekdayOf(iso) {
  var p = iso.split('-');
  var js = new Date(Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2]))).getUTCDay(); // 0 = Sun
  return WEEKDAYS[(js + 6) % 7];
}

/** "20:30" -> 1230 minutes. Returns null when invalid. */
function parseTimeOfDay(s) {
  var m = /^\s*(\d{1,2}):(\d{2})\s*$/.exec(String(s || ''));
  if (!m) return null;
  var h = Number(m[1]);
  var min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/**
 * A once-a-day job is due when the local time has passed its time of day
 * and it has not already run for today's date.
 */
function isDailyJobDue(localDate, localMinutes, timeOfDay, lastRunDate) {
  var t = parseTimeOfDay(timeOfDay);
  if (t === null) return false;
  return localMinutes >= t && lastRunDate !== localDate;
}

/** Parse "Name (C-001)" into { id, name }. */
function parsePersonLabel(label) {
  var m = PERSON_LABEL_RE.exec(String(label || '').trim());
  if (!m) return null;
  return { name: m[1].trim(), id: m[2] };
}

function personLabel(person) {
  return person.name + ' (' + person.id + ')';
}

/** Turn form input into a number. Empty -> 0. Garbage -> null. */
function toNumber(v) {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  var s = String(v).replace(/[,\s$£€]/g, '');
  if (s === '') return 0;
  var n = Number(s);
  return isFinite(n) ? n : null;
}

function parseWorkingDays(s) {
  var raw = String(s || '').trim() || DEFAULT_WORKING_DAYS;
  var out = [];
  raw.split(/[,\s]+/).forEach(function (part) {
    var d = part.slice(0, 3);
    d = d.charAt(0).toUpperCase() + d.slice(1).toLowerCase();
    if (WEEKDAYS.indexOf(d) >= 0 && out.indexOf(d) < 0) out.push(d);
  });
  return out;
}

function roleCovers(personRole, formRole) {
  if (!formRole) return true;
  return personRole === formRole || personRole === 'both';
}

/* ------------------------------------------------------------------ */
/* Ledger columns and records                                          */
/* ------------------------------------------------------------------ */

/** The ordered ledger columns for a form, derived from the schema. */
function ledgerColumns(schema, formKey) {
  if (formKey === 'ad_spend') return schema.adsColumns.slice();
  var cols = schema.ledgerMetaColumns.slice();
  schema.forms[formKey].fields.forEach(function (f) {
    if (f.type === 'person') {
      cols.push('person_id', 'person_name');
    } else {
      cols.push(f.key);
    }
  });
  return cols.concat(schema.ledgerTailColumns);
}

/**
 * Build a ledger record from answers keyed by field key.
 * meta = { responseId, submittedAt, source }
 */
function buildRecord(schema, formKey, answers, meta) {
  var form = schema.forms[formKey];
  var rec = {
    response_id: meta.responseId,
    submitted_at: meta.submittedAt,
    flags: '',
    source: meta.source
  };
  var dayOff = false;
  form.fields.forEach(function (f) {
    var raw = answers[f.key];
    if (f.type === 'dayoff') {
      dayOff = String(raw || '').toLowerCase() === 'day off';
      rec[f.key] = dayOff ? 'yes' : 'no';
    } else if (f.type === 'person') {
      var p = parsePersonLabel(raw);
      rec.person_id = p ? p.id : '';
      rec.person_name = p ? p.name : String(raw || '');
    } else if (f.type === 'date') {
      rec[f.key] = String(raw || '');
    } else if (f.type === 'count' || f.type === 'money') {
      rec[f.key] = toNumber(raw);
    } else if (f.type === 'yesno') {
      rec[f.key] = String(raw || '').toLowerCase() === 'yes' ? 'yes' : 'no';
    } else {
      rec[f.key] = raw === undefined || raw === null ? '' : String(raw);
    }
  });
  if (dayOff) {
    form.fields.forEach(function (f) {
      if (f.type === 'count' || f.type === 'money') rec[f.key] = 0;
    });
  }
  return rec;
}

/** Sanity checks. Returns a list of plain-English problems (empty = fine). */
function validateRecord(formKey, rec, todayIso) {
  var flags = [];
  if (!isIsoDate(rec.date)) flags.push('missing or invalid date');
  else if (rec.date > todayIso) flags.push('date is in the future');
  if ('person_id' in rec && !rec.person_id) flags.push('person not recognised');
  Object.keys(rec).forEach(function (k) {
    if (rec[k] === null) flags.push(k + ' is not a number');
    else if (typeof rec[k] === 'number' && rec[k] < 0) flags.push(k + ' is negative');
  });
  if (formKey === 'closer_eod' && rec.day_off !== 'yes') {
    var shows = (rec.shows_new || 0) + (rec.shows_followup || 0);
    var outcomes = shows + (rec.no_shows || 0) + (rec.reschedules || 0) + (rec.cancelled || 0);
    var closes = (rec.closes_pif || 0) + (rec.closes_pp || 0);
    if (outcomes > (rec.calls_on_calendar || 0)) flags.push('shows + no-shows + reschedules + cancelled is more than calls on calendar');
    if ((rec.offers || 0) > shows) flags.push('offers are more than shows');
    if (closes > (rec.offers || 0)) flags.push('closes are more than offers');
    if (closes > 0 && !(rec.contract_value > 0)) flags.push('closes logged with no contract value');
    if ((rec.disqualified || 0) > (rec.shows_new || 0)) flags.push('disqualified is more than new-call shows');
  }
  if (formKey === 'setter_eod' && rec.day_off !== 'yes') {
    if ((rec.qualified_conversations || 0) > (rec.conversations || 0)) flags.push('qualified conversations are more than conversations');
  }
  if (formKey === 'ad_spend') {
    if ((rec.clicks || 0) > (rec.impressions || 0) && rec.impressions > 0) flags.push('clicks are more than impressions');
  }
  return flags;
}

function recordToRow(columns, rec) {
  return columns.map(function (c) {
    var v = rec[c];
    return v === undefined || v === null ? '' : v;
  });
}

function rowToRecord(columns, row) {
  var rec = {};
  columns.forEach(function (c, i) {
    rec[c] = row[i];
  });
  return rec;
}

/* ------------------------------------------------------------------ */
/* Team                                                                 */
/* ------------------------------------------------------------------ */

/** Next permanent ID, e.g. C-007. Prefix by starting role; never reused. */
function nextPersonId(team, role) {
  var prefix = role === 'setter' ? 'S' : role === 'both' ? 'B' : 'C';
  var max = 0;
  team.forEach(function (p) {
    var m = /^[A-Z]+-(\d+)$/.exec(String(p.id || ''));
    if (m && String(p.id).charAt(0) === prefix) max = Math.max(max, Number(m[1]));
  });
  var n = max + 1;
  return prefix + '-' + (n < 10 ? '00' + n : n < 100 ? '0' + n : String(n));
}

/** Was this person on the team on this date? */
function wasActiveOn(person, iso) {
  if (person.start_date && iso < person.start_date) return false;
  if (person.end_date) return iso <= person.end_date;
  return person.status === 'active';
}

function worksOn(person, iso) {
  return parseWorkingDays(person.working_days).indexOf(weekdayOf(iso)) >= 0;
}

/**
 * People who should appear in a form's dropdown today: active people with
 * the right role, plus people who left within the grace period so they can
 * still file their last reports.
 */
function dropdownPeople(team, formRole, todayIso, graceDays) {
  var grace = graceDays === undefined ? 3 : graceDays;
  return team
    .filter(function (p) {
      if (!roleCovers(p.role, formRole)) return false;
      if (p.status === 'active') return true;
      return !!p.end_date && addDays(p.end_date, grace) >= todayIso;
    })
    .sort(function (a, b) {
      return String(a.name).localeCompare(String(b.name));
    });
}

/* ------------------------------------------------------------------ */
/* Missing EODs                                                         */
/* ------------------------------------------------------------------ */

/**
 * Who has not submitted an EOD for each date.
 * submissions = list of { person_id, date } (day-off reports count as submitted).
 * Returns [{ date, person_id, name, email }].
 */
function findMissing(team, formRole, submissions, dates) {
  var seen = {};
  submissions.forEach(function (s) {
    seen[s.person_id + '|' + s.date] = true;
  });
  var out = [];
  dates.forEach(function (d) {
    team.forEach(function (p) {
      if (!roleCovers(p.role, formRole)) return;
      if (!wasActiveOn(p, d) || !worksOn(p, d)) return;
      if (!seen[p.id + '|' + d]) out.push({ date: d, person_id: p.id, name: p.name, email: p.email || '' });
    });
  });
  return out;
}

/**
 * How many of a person's most recent working days, counting back from
 * `fromIso` inclusive, are missing in a row. Stops at the first submitted day.
 */
function consecutiveMisses(person, missing, fromIso, lookbackDays) {
  var missed = {};
  missing.forEach(function (m) {
    if (m.person_id === person.id) missed[m.date] = true;
  });
  var count = 0;
  for (var i = 0; i < (lookbackDays || 14); i++) {
    var d = addDays(fromIso, -i);
    if (!wasActiveOn(person, d) || !worksOn(person, d)) continue;
    if (missed[d]) count++;
    else break;
  }
  return count;
}

/** List of ISO dates from start to end inclusive. */
function dateRange(startIso, endIso) {
  var out = [];
  for (var d = startIso; d <= endIso; d = addDays(d, 1)) out.push(d);
  return out;
}

/* ------------------------------------------------------------------ */
/* Reconciliation, remap, backups, Meta                                 */
/* ------------------------------------------------------------------ */

/** Response IDs that exist in the form but not in the ledger. */
function missingResponseIds(formIds, ledgerIds) {
  var have = {};
  ledgerIds.forEach(function (id) {
    have[String(id)] = true;
  });
  return formIds.filter(function (id) {
    return !have[String(id)];
  });
}

/**
 * Plan a remap of ledger entries from one person to another within a date
 * range. A collision is a date where the target person already has an entry.
 */
function planRemap(records, fromId, toId, startIso, endIso) {
  var targetDates = {};
  records.forEach(function (r) {
    if (r.person_id === toId) targetDates[r.date] = true;
  });
  var moves = [];
  var collisions = [];
  records.forEach(function (r) {
    if (r.person_id !== fromId) return;
    if (r.date < startIso || r.date > endIso) return;
    if (targetDates[r.date]) collisions.push({ response_id: r.response_id, date: r.date });
    else moves.push({ response_id: r.response_id, date: r.date });
  });
  return { moves: moves, collisions: collisions };
}

/** Backup files to delete, keeping the newest `keep`. files = [{ id, created }] */
function backupsToDelete(files, keep) {
  return files
    .slice()
    .sort(function (a, b) {
      return b.created - a.created;
    })
    .slice(keep)
    .map(function (f) {
      return f.id;
    });
}

/** Meta insights API rows -> [{ date, spend, impressions, clicks }] */
function parseMetaInsights(json) {
  return (json && json.data ? json.data : []).map(function (r) {
    return {
      date: r.date_start,
      spend: toNumber(r.spend) || 0,
      impressions: toNumber(r.impressions) || 0,
      clicks: toNumber(r.clicks) || 0
    };
  });
}

/**
 * Upsert plan for automatic Meta rows. Existing API rows for a date are
 * updated in place; new dates are appended. Manual rows are never touched.
 * existing = [{ rowIndex, date, platform, source }]
 */
function planMetaUpsert(existing, metaRows) {
  var byDate = {};
  existing.forEach(function (e) {
    if (e.platform === 'Meta' && e.source === 'api') byDate[e.date] = e.rowIndex;
  });
  var updates = [];
  var inserts = [];
  metaRows.forEach(function (m) {
    if (byDate[m.date] !== undefined) updates.push({ rowIndex: byDate[m.date], row: m });
    else inserts.push(m);
  });
  return { updates: updates, inserts: inserts };
}

/** Constant-time-ish string comparison for the API key. */
function safeEqual(a, b) {
  a = String(a || '');
  b = String(b || '');
  if (a.length !== b.length || a.length === 0) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Minutes between two local timestamps "YYYY-MM-DDTHH:mm:ss" written in the
 * same timezone. Returns null if either is missing.
 */
function minutesBetweenLocal(earlier, later) {
  var toMs = function (s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(String(s || ''));
    if (!m) return null;
    return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
  };
  var a = toMs(earlier);
  var b = toMs(later);
  if (a === null || b === null) return null;
  return Math.round((b - a) / 60000);
}

/* ===== 10_sheet.js ===== */
/**
 * Sheet helpers: settings, tabs, reading and writing rows, change log.
 */

var TAB_TEAM = 'Team';
var TAB_SETTINGS = 'Settings';
var TAB_CHANGELOG = 'Change log';
var CHANGELOG_COLUMNS = ['timestamp', 'action', 'details', 'before_json', 'after_json', 'by', 'undone'];
var TEXT_COLUMNS = ['response_id', 'submitted_at', 'date', 'start_date', 'end_date', 'synced_at', 'timestamp', 'id', 'person_id'];

var REQUIRED_SETTINGS = ['business_name', 'currency', 'timezone', 'founder_email', 'eod_cutoff', 'summary_time'];

var SETTING_DEFAULTS = {
  closers_enabled: 'yes',
  setters_enabled: 'yes',
  ads_enabled: 'yes',
  reminders_enabled: 'yes',
  summary_enabled: 'yes',
  backup_time: '02:00',
  backup_keep: '30',
  meta_api_version: 'v23.0',
  sync_cooldown_minutes: '5'
};

function ss_() {
  var id = PropertiesService.getScriptProperties().getProperty('SS_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActive();
}

/* ---------------- Settings (two columns: key | value) ---------------- */

function getSettings_() {
  var sh = ss_().getSheetByName(TAB_SETTINGS);
  var out = {};
  Object.keys(SETTING_DEFAULTS).forEach(function (k) {
    out[k] = SETTING_DEFAULTS[k];
  });
  if (!sh) return out;
  var values = sh.getDataRange().getDisplayValues();
  for (var i = 1; i < values.length; i++) {
    var k = String(values[i][0]).trim();
    if (k) out[k] = String(values[i][1]).trim();
  }
  return out;
}

function setSettings_(obj) {
  var sh = ensureTab_(TAB_SETTINGS, ['key', 'value']);
  var values = sh.getDataRange().getValues();
  var index = {};
  for (var i = 1; i < values.length; i++) index[String(values[i][0]).trim()] = i + 1;
  Object.keys(obj).forEach(function (k) {
    var v = obj[k] === null || obj[k] === undefined ? '' : String(obj[k]);
    if (index[k]) {
      sh.getRange(index[k], 2).setNumberFormat('@').setValue(v);
    } else {
      sh.appendRow([k, v]);
      var r = sh.getLastRow();
      sh.getRange(r, 2).setNumberFormat('@').setValue(v);
      index[k] = r;
    }
  });
}

function setting_(key) {
  return getSettings_()[key];
}

function enabled_(settings, key) {
  return String(settings[key] || '').toLowerCase() === 'yes';
}

/** Which forms are switched on, from the compartment settings. */
function enabledForms_(settings) {
  var out = [];
  if (enabled_(settings, 'closers_enabled')) out.push('closer_eod', 'refund');
  if (enabled_(settings, 'setters_enabled')) out.push('setter_eod');
  if (enabled_(settings, 'ads_enabled')) out.push('ad_spend');
  return out;
}

/* ---------------- Tabs ---------------- */

function ensureTab_(name, columns) {
  var ss = ss_();
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (columns && columns.length) {
    var current = sh.getLastColumn() > 0 ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0] : [];
    if (current.join('|') !== columns.join('|')) {
      if (sh.getLastRow() > 1 && current.length) {
        // Add any new columns at the end instead of rewriting existing data.
        var missing = columns.filter(function (c) { return current.indexOf(c) < 0; });
        if (missing.length) sh.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
      } else {
        sh.getRange(1, 1, 1, columns.length).setValues([columns]);
      }
    }
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, sh.getLastColumn()).setFontWeight('bold');
    formatTextColumns_(sh);
  }
  return sh;
}

/** Keep dates and IDs as plain text so Sheets never converts them. */
function formatTextColumns_(sh) {
  var header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  header.forEach(function (h, i) {
    if (TEXT_COLUMNS.indexOf(h) >= 0) sh.getRange(2, i + 1, sh.getMaxRows() - 1, 1).setNumberFormat('@');
  });
}

function headerOf_(sh) {
  if (sh.getLastColumn() === 0) return [];
  return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
}

/** Read a tab into objects keyed by header. Dates become ISO strings. */
function readObjects_(name) {
  var sh = ss_().getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  var tz = setting_('timezone') || Session.getScriptTimeZone();
  var values = sh.getDataRange().getValues();
  var header = values[0].map(String);
  var out = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (row.join('') === '') continue;
    var obj = { _row: i + 1 };
    header.forEach(function (h, c) {
      var v = row[c];
      if (v instanceof Date) v = Utilities.formatDate(v, tz, 'yyyy-MM-dd');
      obj[h] = v;
    });
    out.push(obj);
  }
  return out;
}

function appendObjects_(name, columns, objs) {
  if (!objs.length) return;
  var sh = ss_().getSheetByName(name);
  var header = headerOf_(sh);
  var cols = header.length ? header : columns;
  var rows = objs.map(function (o) { return recordToRow(cols, o); });
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, cols.length).setValues(rows);
}

function updateObject_(name, rowIndex, changes) {
  var sh = ss_().getSheetByName(name);
  var header = headerOf_(sh);
  Object.keys(changes).forEach(function (k) {
    var c = header.indexOf(k);
    if (c >= 0) sh.getRange(rowIndex, c + 1).setValue(changes[k]);
  });
}

/** A column's values (no header), as strings. */
function columnValues_(name, column) {
  var sh = ss_().getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  var c = headerOf_(sh).indexOf(column);
  if (c < 0) return [];
  return sh.getRange(2, c + 1, sh.getLastRow() - 1, 1).getValues().map(function (r) { return String(r[0]); });
}

/* ---------------- Team ---------------- */

function readTeam_() {
  return readObjects_(TAB_TEAM).map(function (p) {
    return {
      _row: p._row,
      id: String(p.id || '').trim(),
      name: String(p.name || '').trim(),
      email: String(p.email || '').trim(),
      role: String(p.role || '').trim().toLowerCase(),
      status: String(p.status || 'active').trim().toLowerCase(),
      working_days: String(p.working_days || DEFAULT_WORKING_DAYS),
      start_date: String(p.start_date || ''),
      end_date: String(p.end_date || '')
    };
  }).filter(function (p) { return p.id; });
}

/* ---------------- Change log ---------------- */

function logChange_(action, details, before, after) {
  ensureTab_(TAB_CHANGELOG, CHANGELOG_COLUMNS);
  var by = '';
  try { by = Session.getActiveUser().getEmail(); } catch (e) { by = ''; }
  appendObjects_(TAB_CHANGELOG, CHANGELOG_COLUMNS, [{
    timestamp: nowIso_(),
    action: action,
    details: details,
    before_json: before ? JSON.stringify(before) : '',
    after_json: after ? JSON.stringify(after) : '',
    by: by,
    undone: 'no'
  }]);
}

/* ---------------- Time in the business timezone ---------------- */

function tz_() {
  return setting_('timezone') || Session.getScriptTimeZone();
}

function todayIso_() {
  return Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd');
}

function nowIso_() {
  return Utilities.formatDate(new Date(), tz_(), "yyyy-MM-dd'T'HH:mm:ss");
}

function localMinutes_() {
  var hm = Utilities.formatDate(new Date(), tz_(), 'HH:mm').split(':');
  return Number(hm[0]) * 60 + Number(hm[1]);
}

/* ---------------- Notifications ---------------- */

function notifyFounder_(subject, body) {
  var to = setting_('founder_email');
  if (!to) return;
  MailApp.sendEmail({ to: to, subject: '[Sales Tracker] ' + subject, body: body });
}

function ui_() {
  try { return SpreadsheetApp.getUi(); } catch (e) { return null; }
}

/* ===== 20_setup.js ===== */
/**
 * setup(): builds everything. Safe to run again at any time: it finds what
 * already exists (by IDs stored in Settings) and only adds what is missing.
 */

var HANDLER_SUBMIT = 'handleFormSubmit';
var HANDLER_HOURLY = 'hourlyJob';

function setup() {
  var ss = SpreadsheetApp.getActive();
  PropertiesService.getScriptProperties().setProperty('SS_ID', ss.getId());

  var settings = getSettings_();
  var missing = REQUIRED_SETTINGS.filter(function (k) { return !settings[k]; });
  if (missing.length) {
    throw new Error('Settings tab is missing: ' + missing.join(', ') +
      '. Ask your assistant to fill in the Settings tab, then run setup again.');
  }
  ['eod_cutoff', 'summary_time'].forEach(function (k) {
    if (parseTimeOfDay(settings[k]) === null) throw new Error('Settings "' + k + '" must look like 20:00 (24-hour). It is "' + settings[k] + '".');
  });

  ss.setSpreadsheetTimeZone(settings.timezone);
  setSettings_(fillDefaults_(settings));

  ensureTab_(TAB_TEAM, SCHEMA.teamColumns);
  ensureTab_(TAB_CHANGELOG, CHANGELOG_COLUMNS);

  var forms = enabledForms_(getSettings_());
  forms.forEach(function (key) {
    ensureTab_(SCHEMA.forms[key].ledger, ledgerColumns(SCHEMA, key));
    ensureForm_(key);
  });

  ensureTriggers_();
  ensureApiKey_();
  ensureBackupFolder_();
  protectHeaders_();
  refreshDropdowns_();
  var backfilled = reconcileAll_();

  setSettings_({ schema_version: SCHEMA.version, setup_completed_at: nowIso_() });
  logChange_('setup', 'Setup ran. Forms: ' + forms.join(', ') + '. Backfilled ' + backfilled + ' responses.');

  var ui = ui_();
  if (ui) {
    ui.alert('Sales Tracker is set up',
      'Forms, tabs and automatic jobs are ready.\n\n' +
      'Next: Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone), ' +
      'then use Sales Tracker > Show dashboard connection details.\n\n' +
      'Your assistant will guide you through it.',
      ui.ButtonSet.OK);
  }
}

function fillDefaults_(settings) {
  var out = {};
  Object.keys(SETTING_DEFAULTS).forEach(function (k) {
    if (!settings[k]) out[k] = SETTING_DEFAULTS[k];
  });
  return out;
}

/* ---------------- Forms ---------------- */

function formSettingKey_(key, what) {
  return 'form_' + key + '_' + what;
}

function openForm_(key) {
  var id = setting_(formSettingKey_(key, 'id'));
  if (!id) return null;
  try { return FormApp.openById(id); } catch (e) { return null; }
}

function ensureForm_(key) {
  var form = openForm_(key);
  if (form) {
    ensureDestination_(key, form);
    return form;
  }
  var def = SCHEMA.forms[key];
  var business = setting_('business_name');
  form = FormApp.create(business + ' – ' + def.title);
  form.setTitle(business + ' – ' + def.title)
    .setDescription(def.description)
    .setCollectEmail(false)
    .setAllowResponseEdits(false)
    .setShowLinkToRespondAgain(false)
    .setProgressBar(def.fields.some(function (f) { return f.page === 2; }))
    .setConfirmationMessage('Thanks, your report is in. If you made a mistake, submit again for the same date: the latest one counts.');

  var itemMap = {};
  var pageBreakAdded = false;
  var page2 = null;
  def.fields.forEach(function (f) {
    if (f.page === 2 && !pageBreakAdded) {
      page2 = form.addPageBreakItem().setTitle('Your numbers for the day');
      pageBreakAdded = true;
    }
    var item = addFieldItem_(form, f, page2);
    itemMap[item.getId()] = f.key;
  });
  // The day-off question jumps straight to submit, so it is created before
  // page 2 exists; wire its navigation now that page 2 does.
  def.fields.forEach(function (f) {
    if (f.type !== 'dayoff') return;
    var itemId = Object.keys(itemMap).filter(function (id) { return itemMap[id] === f.key; })[0];
    var mc = form.getItemById(Number(itemId)).asMultipleChoiceItem();
    mc.setChoices([
      page2 ? mc.createChoice('Worked', page2) : mc.createChoice('Worked'),
      mc.createChoice('Day off', FormApp.PageNavigationType.SUBMIT)
    ]);
  });

  var settings = {};
  settings[formSettingKey_(key, 'id')] = form.getId();
  settings[formSettingKey_(key, 'url')] = form.getPublishedUrl();
  settings[formSettingKey_(key, 'items')] = JSON.stringify(itemMap);
  setSettings_(settings);

  ensureDestination_(key, form);
  try {
    DriveApp.getFileById(form.getId()).moveTo(DriveApp.getFileById(ss_().getId()).getParents().next());
  } catch (e) { /* stays in My Drive root; harmless */ }
  logChange_('form_created', def.title + ' created', null, { id: form.getId() });
  return form;
}

var COUNT_PATTERN = '^\\d+$';
var MONEY_PATTERN = '^\\d+(\\.\\d{1,2})?$';

function addFieldItem_(form, f) {
  var item;
  if (f.type === 'date') {
    item = form.addDateItem().setIncludesYear(true);
  } else if (f.type === 'person') {
    item = form.addListItem().setChoiceValues(['(the founder will add names here)']);
  } else if (f.type === 'dayoff') {
    item = form.addMultipleChoiceItem().setChoiceValues(['Worked', 'Day off']);
  } else if (f.type === 'count') {
    item = form.addTextItem()
      .setHelpText('Whole number, 0 or more. Put 0 if none.')
      .setValidation(FormApp.createTextValidation().requireTextMatchesPattern(COUNT_PATTERN)
        .setHelpText('Please enter a whole number, like 0 or 12.').build());
  } else if (f.type === 'money') {
    item = form.addTextItem()
      .setHelpText('Numbers only, no currency sign or commas. Put 0 if none.')
      .setValidation(FormApp.createTextValidation().requireTextMatchesPattern(MONEY_PATTERN)
        .setHelpText('Please enter an amount like 1500 or 1500.50').build());
  } else if (f.type === 'choice') {
    item = form.addMultipleChoiceItem().setChoiceValues(f.choices);
  } else if (f.type === 'yesno') {
    item = form.addMultipleChoiceItem().setChoiceValues(['No', 'Yes']);
  } else {
    item = form.addParagraphTextItem();
  }
  item.setTitle(f.label);
  if (item.setRequired) item.setRequired(!!f.required);
  return item;
}

/** Make sure the form sends responses to this Sheet, and name its tab. */
function ensureDestination_(key, form) {
  var ss = ss_();
  var linked = false;
  try {
    linked = form.getDestinationType() === FormApp.DestinationType.SPREADSHEET && form.getDestinationId() === ss.getId();
  } catch (e) { linked = false; }
  if (!linked) {
    form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
    SpreadsheetApp.flush();
  }
  var wanted = SCHEMA.forms[key].responsesTab;
  ss.getSheets().forEach(function (sh) {
    var formUrl = sh.getFormUrl();
    if (formUrl && formUrl.indexOf(form.getId()) >= 0 && sh.getName() !== wanted) {
      if (!ss.getSheetByName(wanted)) sh.setName(wanted);
    }
  });
  return !linked;
}

/* ---------------- Triggers ---------------- */

function ensureTriggers_() {
  var existing = ScriptApp.getProjectTriggers();
  var haveHourly = false;
  var haveSubmit = {};
  existing.forEach(function (t) {
    var fn = t.getHandlerFunction();
    if (fn === HANDLER_HOURLY) {
      if (haveHourly) ScriptApp.deleteTrigger(t); else haveHourly = true;
    } else if (fn === HANDLER_SUBMIT) {
      var src = t.getTriggerSourceId();
      if (haveSubmit[src]) ScriptApp.deleteTrigger(t); else haveSubmit[src] = true;
    }
  });
  var created = 0;
  if (!haveHourly) {
    ScriptApp.newTrigger(HANDLER_HOURLY).timeBased().everyHours(1).create();
    created++;
  }
  enabledForms_(getSettings_()).forEach(function (key) {
    var form = openForm_(key);
    if (form && !haveSubmit[form.getId()]) {
      ScriptApp.newTrigger(HANDLER_SUBMIT).forForm(form).onFormSubmit().create();
      created++;
    }
  });
  return created;
}

/* ---------------- API key, backups, protections ---------------- */

function ensureApiKey_() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('API_KEY')) {
    props.setProperty('API_KEY', Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''));
  }
}

function ensureBackupFolder_() {
  var id = setting_('backup_folder_id');
  if (id) {
    try { DriveApp.getFolderById(id); return; } catch (e) { /* recreate */ }
  }
  var folder = DriveApp.createFolder(setting_('business_name') + ' – Sales Tracker Backups');
  setSettings_({ backup_folder_id: folder.getId() });
}

function protectHeaders_() {
  var ss = ss_();
  var names = [TAB_TEAM, TAB_SETTINGS, TAB_CHANGELOG];
  enabledForms_(getSettings_()).forEach(function (k) {
    names.push(SCHEMA.forms[k].ledger, SCHEMA.forms[k].responsesTab);
  });
  names.forEach(function (n) {
    var sh = ss.getSheetByName(n);
    if (!sh || sh.getLastColumn() === 0) return;
    var already = sh.getProtections(SpreadsheetApp.ProtectionType.RANGE).some(function (p) {
      return p.getDescription() === 'Sales Tracker header';
    });
    if (already) return;
    sh.getRange(1, 1, 1, sh.getLastColumn()).protect()
      .setDescription('Sales Tracker header')
      .setWarningOnly(true);
  });
  // Response tabs must never be edited: they are linked to the forms.
  enabledForms_(getSettings_()).forEach(function (k) {
    var sh = ss.getSheetByName(SCHEMA.forms[k].responsesTab);
    if (!sh) return;
    var already = sh.getProtections(SpreadsheetApp.ProtectionType.SHEET).length > 0;
    if (!already) sh.protect().setDescription('Linked to a form: do not edit').setWarningOnly(true);
  });
}

/* ---------------- Menu ---------------- */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Sales Tracker')
    .addItem('Add person', 'menuAddPerson')
    .addItem('Deactivate person', 'menuDeactivatePerson')
    .addItem('Reactivate person', 'menuReactivatePerson')
    .addItem('Rename person', 'menuRenamePerson')
    .addItem('Change role', 'menuChangeRole')
    .addItem('Change working days', 'menuChangeWorkingDays')
    .addItem('Remap entries to another person', 'menuRemapEntries')
    .addItem('Undo last change', 'menuUndoLastChange')
    .addSeparator()
    .addItem('Connect Meta (founder only)', 'menuConnectMeta')
    .addItem('Test Meta connection', 'testMeta')
    .addItem('Sync Meta now', 'menuSyncMetaNow')
    .addSeparator()
    .addItem('Check data health now', 'menuCheckHealth')
    .addItem('Remove test entries (Notes = TEST)', 'menuRemoveTestEntries')
    .addItem('Show form links', 'menuShowFormLinks')
    .addItem('Show dashboard connection details', 'menuShowConnection')
    .addItem('Rotate dashboard API key', 'menuRotateApiKey')
    .addItem('Run setup again', 'setup')
    .addToUi();
}

function menuShowFormLinks() {
  var lines = enabledForms_(getSettings_()).map(function (k) {
    return SCHEMA.forms[k].title + ':\n' + (setting_(formSettingKey_(k, 'url')) || '(not built yet)');
  });
  SpreadsheetApp.getUi().alert('Form links', lines.join('\n\n'), SpreadsheetApp.getUi().ButtonSet.OK);
}

function menuShowConnection() {
  var url = '';
  try { url = ScriptApp.getService().getUrl() || ''; } catch (e) { url = ''; }
  var key = PropertiesService.getScriptProperties().getProperty('API_KEY');
  var msg = url
    ? 'Add these two values in Vercel > Settings > Environment Variables:\n\n' +
      'SHEET_API_URL\n' + url + '\n\nSHEET_API_KEY\n' + key +
      '\n\nKeep the key private. Use "Rotate dashboard API key" if it ever leaks.'
    : 'The web app is not deployed yet.\n\nDeploy > New deployment > Web app\nExecute as: Me\nWho has access: Anyone\n\nThen open this again.';
  SpreadsheetApp.getUi().alert('Dashboard connection', msg, SpreadsheetApp.getUi().ButtonSet.OK);
}

function menuRotateApiKey() {
  var ui = SpreadsheetApp.getUi();
  var ok = ui.alert('Rotate API key?', 'The dashboard will stop loading until you paste the new key into Vercel (SHEET_API_KEY) and redeploy. Continue?', ui.ButtonSet.YES_NO);
  if (ok !== ui.Button.YES) return;
  PropertiesService.getScriptProperties().deleteProperty('API_KEY');
  ensureApiKey_();
  logChange_('api_key_rotated', 'Dashboard API key rotated');
  menuShowConnection();
}

/* ===== 30_ledger.js ===== */
/**
 * Getting responses into the ledgers.
 * Path 2 (submit trigger) and path 3 (hourly reconciliation) both call
 * ingestResponse_, which skips any response ID already in the ledger, so
 * running either any number of times never creates duplicates.
 */

function handleFormSubmit(e) {
  var formId = e && e.source && e.source.getId ? e.source.getId() : null;
  var key = formKeyById_(formId);
  if (!key) return;
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return; // the hourly reconciliation will pick it up
  try {
    ingestResponse_(key, e.response, 'trigger', null);
    sendPendingFlags_();
    clearApiCache_();
  } finally {
    lock.releaseLock();
  }
}

function formKeyById_(formId) {
  if (!formId) return null;
  var settings = getSettings_();
  var keys = Object.keys(SCHEMA.forms);
  for (var i = 0; i < keys.length; i++) {
    if (settings[formSettingKey_(keys[i], 'id')] === formId) return keys[i];
  }
  return null;
}

/** Answers keyed by field key, read by item ID (titles can change safely). */
function answersFromResponse_(key, response) {
  var itemMap = JSON.parse(setting_(formSettingKey_(key, 'items')) || '{}');
  var byTitle = {};
  SCHEMA.forms[key].fields.forEach(function (f) { byTitle[f.label] = f.key; });
  var answers = {};
  response.getItemResponses().forEach(function (ir) {
    var item = ir.getItem();
    var field = itemMap[String(item.getId())] || byTitle[item.getTitle()];
    if (field) answers[field] = ir.getResponse();
  });
  return answers;
}

/**
 * Write one form response to its ledger. `knownIds` is an optional set of
 * response IDs already in the ledger (saves re-reading it in a loop).
 * Returns true when a row was written.
 */
function ingestResponse_(key, response, source, knownIds) {
  var def = SCHEMA.forms[key];
  var id = response.getId();
  var ids = knownIds || toSet_(columnValues_(def.ledger, 'response_id'));
  if (ids[id]) return false;

  var tz = tz_();
  var rec = buildRecord(SCHEMA, key, answersFromResponse_(key, response), {
    responseId: id,
    submittedAt: Utilities.formatDate(response.getTimestamp(), tz, "yyyy-MM-dd'T'HH:mm:ss"),
    source: source
  });

  if (key === 'ad_spend') {
    rec.source = 'manual';
    rec.synced_at = rec.submitted_at;
  }

  var flags = validateRecord(key, rec, todayIso_());
  if ('flags' in rec) rec.flags = flags.join('; ');

  appendObjects_(def.ledger, ledgerColumns(SCHEMA, key), [rec]);
  ids[id] = true;
  if (flags.length && key !== 'ad_spend') {
    flagForFounder_(def.title, rec, flags);
  }
  return true;
}

function toSet_(list) {
  var s = {};
  list.forEach(function (v) { s[String(v)] = true; });
  return s;
}

/** Batch flagged rows into one email per run instead of one per row. */
var PENDING_FLAGS_ = [];

function flagForFounder_(title, rec, flags) {
  PENDING_FLAGS_.push(title + ' – ' + (rec.person_name || '') + ' – ' + rec.date + ':\n  ' + flags.join('\n  '));
}

function sendPendingFlags_() {
  if (!PENDING_FLAGS_.length) return;
  notifyFounder_('Report needs a look',
    'These reports were saved, but something looks off. Check them with the person:\n\n' +
    PENDING_FLAGS_.join('\n\n') +
    '\n\nTo fix: the person submits the form again for the same date. The latest report counts.');
  PENDING_FLAGS_ = [];
}

/* ---------------- Path 3: hourly reconciliation ---------------- */

/** Compare every response stored in each form with its ledger; add any missing. */
function reconcileAll_() {
  var total = 0;
  enabledForms_(getSettings_()).forEach(function (key) {
    var form = openForm_(key);
    if (!form) return;
    var ledger = SCHEMA.forms[key].ledger;
    var known = toSet_(columnValues_(ledger, 'response_id'));
    var responses = form.getResponses();
    var missingIds = toSet_(missingResponseIds(responses.map(function (r) { return r.getId(); }), Object.keys(known)));
    responses.forEach(function (r) {
      if (missingIds[r.getId()] && ingestResponse_(key, r, 'reconcile', known)) total++;
    });
  });
  sendPendingFlags_();
  var prev = Number(setting_('rows_backfilled_total') || 0);
  setSettings_({
    last_reconcile: nowIso_(),
    rows_backfilled_last: total,
    rows_backfilled_total: prev + total
  });
  return total;
}

/* ---------------- Test entries (used by the install check) ---------------- */

/**
 * Deletes every report whose Notes are exactly "TEST", from both the form
 * (so reconciliation can't bring it back) and the ledger.
 */
function removeTestEntries_() {
  var removed = 0;
  ['closer_eod', 'setter_eod', 'refund'].forEach(function (key) {
    if (enabledForms_(getSettings_()).indexOf(key) < 0) return;
    var form = openForm_(key);
    var ledger = SCHEMA.forms[key].ledger;
    var testIds = {};
    readObjects_(ledger).forEach(function (r) {
      if (String(r.notes).trim() === 'TEST') testIds[r.response_id] = r._row;
    });
    if (form) {
      form.getResponses().forEach(function (resp) {
        var answers = answersFromResponse_(key, resp);
        if (String(answers.notes || '').trim() === 'TEST') {
          form.deleteResponse(resp.getId());
          if (!testIds[resp.getId()]) testIds[resp.getId()] = 0;
        }
      });
    }
    var rows = Object.keys(testIds).map(function (id) { return testIds[id]; }).filter(Boolean).sort(function (a, b) { return b - a; });
    var sh = ss_().getSheetByName(ledger);
    rows.forEach(function (row) { sh.deleteRow(row); removed++; });
  });
  if (removed) logChange_('test_entries_removed', removed + ' test entries removed');
  clearApiCache_();
  return removed;
}

function menuRemoveTestEntries() {
  var n = removeTestEntries_();
  say_('Test entries removed', n + ' test report(s) removed from the forms and ledgers.');
}

/* ===== 40_team.js ===== */
/**
 * Team changes from the "Sales Tracker" menu. Every change is written to the
 * Change log with a before/after copy so "Undo last change" can reverse it.
 * People keep a permanent ID; names can change without splitting history.
 */

var PERSON_LEDGERS = ['closer_eod', 'setter_eod', 'refund'];

function promptText_(title, message, allowEmpty) {
  var ui = SpreadsheetApp.getUi();
  var res = ui.prompt(title, message, ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return null;
  var text = res.getResponseText().trim();
  if (!text && !allowEmpty) {
    ui.alert('Nothing entered, so nothing changed.');
    return null;
  }
  return text;
}

function say_(title, message) {
  var ui = SpreadsheetApp.getUi();
  ui.alert(title, message, ui.ButtonSet.OK);
}

/** Find a person by ID ("C-001"), dropdown label or exact name. */
function findPerson_(team, input) {
  var s = String(input || '').trim();
  var label = parsePersonLabel(s);
  var id = label ? label.id : s.toUpperCase();
  var byId = team.filter(function (p) { return p.id === id; });
  if (byId.length) return byId[0];
  var byName = team.filter(function (p) { return p.name.toLowerCase() === s.toLowerCase(); });
  return byName.length === 1 ? byName[0] : null;
}

function askPerson_(title) {
  var team = readTeam_();
  var list = team.map(function (p) { return personLabel(p) + ' – ' + p.role + ', ' + p.status; }).join('\n');
  var input = promptText_(title, 'Type the person\'s ID (e.g. C-001) or full name.\n\n' + list);
  if (input === null) return null;
  var p = findPerson_(team, input);
  if (!p) say_('Not found', 'No one matches "' + input + '". If two people share a name, use the ID.');
  return p;
}

function askDate_(title, message, defaultIso) {
  var input = promptText_(title, message + '\n\nFormat YYYY-MM-DD. Leave blank for ' + defaultIso + '.', true);
  if (input === null) return null;
  var d = input || defaultIso;
  if (!isIsoDate(d)) {
    say_('Date not understood', '"' + input + '" is not a date like ' + defaultIso + '. Nothing changed.');
    return null;
  }
  return d;
}

function askRole_(current) {
  var input = promptText_('Role', 'closer, setter or both' + (current ? ' (now: ' + current + ')' : ''));
  if (input === null) return null;
  var role = input.toLowerCase();
  if (SCHEMA.roles.indexOf(role) < 0) {
    say_('Role not understood', 'Use closer, setter or both. Nothing changed.');
    return null;
  }
  return role;
}

function askWorkingDays_(current) {
  var input = promptText_('Working days', 'Which days do they work? e.g. Mon,Tue,Wed,Thu,Fri' +
    (current ? '\n\nNow: ' + current : '') + '\n\nLeave blank for Mon–Fri.', true);
  if (input === null) return null;
  var days = parseWorkingDays(input);
  if (!days.length) {
    say_('Days not understood', 'Use day names like Mon,Tue,Wed. Nothing changed.');
    return null;
  }
  return days.join(',');
}

function personRow_(p) {
  return {
    id: p.id, name: p.name, email: p.email, role: p.role, status: p.status,
    working_days: p.working_days, start_date: p.start_date, end_date: p.end_date
  };
}

function savePerson_(before, after, action, details) {
  updateObject_(TAB_TEAM, before._row, personRow_(after));
  logChange_(action, details, personRow_(before), personRow_(after));
  refreshDropdowns_();
  clearApiCache_();
}

/* ---------------- Menu actions ---------------- */

function menuAddPerson() {
  var team = readTeam_();
  var name = promptText_('Add person', 'Full name');
  if (name === null) return;
  var email = promptText_('Add person', 'Email (for EOD reminders)');
  if (email === null) return;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return say_('Email not valid', 'Nothing changed.');
  var role = askRole_();
  if (role === null) return;
  var days = askWorkingDays_();
  if (days === null) return;
  var start = askDate_('Start date', 'First day they report for', todayIso_());
  if (start === null) return;

  var person = {
    id: nextPersonId(team, role), name: name, email: email, role: role, status: 'active',
    working_days: days, start_date: start, end_date: ''
  };
  appendObjects_(TAB_TEAM, SCHEMA.teamColumns, [person]);
  logChange_('person_added', personLabel(person) + ' added as ' + role, null, person);
  refreshDropdowns_();
  clearApiCache_();
  say_('Added', personLabel(person) + ' is now in the ' + role + ' form dropdown.\n\nSend them their form link (Sales Tracker > Show form links).');
}

function menuDeactivatePerson() {
  var p = askPerson_('Deactivate person');
  if (!p) return;
  if (p.status !== 'active') return say_('Already inactive', personLabel(p) + ' is already inactive.');
  var end = askDate_('Last working day', 'Their last day on the team', todayIso_());
  if (end === null) return;
  var after = Object.assign({}, p, { status: 'inactive', end_date: end });
  savePerson_(p, after, 'person_deactivated', personLabel(p) + ' deactivated, last day ' + end);
  say_('Deactivated', personLabel(p) + ' leaves the dropdowns 3 days after ' + end + ' so they can file their last reports. Their history stays.\n\n' +
    'If they knew the dashboard password, change it now: Vercel > your project > Settings > Environment Variables > DASHBOARD_PASSWORD, then Redeploy.');
}

function menuReactivatePerson() {
  var p = askPerson_('Reactivate person');
  if (!p) return;
  if (p.status === 'active') return say_('Already active', personLabel(p) + ' is already active.');
  var after = Object.assign({}, p, { status: 'active', end_date: '' });
  savePerson_(p, after, 'person_reactivated', personLabel(p) + ' reactivated');
  say_('Reactivated', personLabel(p) + ' is back in the dropdowns with the same ID.');
}

function menuRenamePerson() {
  var p = askPerson_('Rename person');
  if (!p) return;
  var name = promptText_('Rename', 'New name for ' + personLabel(p));
  if (name === null) return;
  var after = Object.assign({}, p, { name: name });
  savePerson_(p, after, 'person_renamed', p.name + ' renamed to ' + name + ' (' + p.id + ')');
  say_('Renamed', 'Now ' + personLabel(after) + '. Past numbers follow them because the ID is unchanged.');
}

function menuChangeRole() {
  var p = askPerson_('Change role');
  if (!p) return;
  var role = askRole_(p.role);
  if (role === null || role === p.role) return;
  var after = Object.assign({}, p, { role: role });
  savePerson_(p, after, 'person_role_changed', personLabel(p) + ' role ' + p.role + ' to ' + role);
  say_('Role changed', personLabel(p) + ' is now ' + role + '. Dropdowns updated.');
}

function menuChangeWorkingDays() {
  var p = askPerson_('Change working days');
  if (!p) return;
  var days = askWorkingDays_(p.working_days);
  if (days === null) return;
  var after = Object.assign({}, p, { working_days: days });
  savePerson_(p, after, 'person_days_changed', personLabel(p) + ' working days ' + p.working_days + ' to ' + days);
  say_('Working days changed', personLabel(p) + ' now works ' + days + '.');
}

function menuRemapEntries() {
  var ui = SpreadsheetApp.getUi();
  var which = promptText_('Remap entries', 'Which reports? Type closer, setter or refund.');
  if (which === null) return;
  var key = { closer: 'closer_eod', setter: 'setter_eod', refund: 'refund' }[which.toLowerCase()];
  if (!key) return say_('Not understood', 'Type closer, setter or refund. Nothing changed.');
  var from = askPerson_('Move entries FROM');
  if (!from) return;
  var to = askPerson_('Move entries TO');
  if (!to) return;
  if (from.id === to.id) return say_('Same person', 'Nothing changed.');
  var start = askDate_('From date', 'First date to move', todayIso_());
  if (start === null) return;
  var end = askDate_('To date', 'Last date to move', start);
  if (end === null) return;

  var ledger = SCHEMA.forms[key].ledger;
  var records = readObjects_(ledger);
  var plan = planRemap(records, from.id, to.id, start, end);
  if (!plan.moves.length && !plan.collisions.length) return say_('Nothing to move', personLabel(from) + ' has no ' + which + ' entries from ' + start + ' to ' + end + '.');

  var moves = plan.moves;
  if (plan.collisions.length) {
    var dates = plan.collisions.map(function (c) { return c.date; }).join(', ');
    var answer = ui.alert('Some dates clash',
      personLabel(to) + ' already has entries on: ' + dates + '.\n\n' +
      'YES: move only the other ' + plan.moves.length + ' entries and leave the clashing ones with ' + personLabel(from) + '.\n' +
      'NO: cancel, nothing changes.', ui.ButtonSet.YES_NO);
    if (answer !== ui.Button.YES) return;
  }
  if (!moves.length) return say_('Nothing moved', 'Every entry in that range clashed.');

  var byId = {};
  records.forEach(function (r) { byId[r.response_id] = r; });
  var before = moves.map(function (m) {
    var r = byId[m.response_id];
    return { ledger: ledger, response_id: m.response_id, _row: r._row, person_id: r.person_id, person_name: r.person_name };
  });
  before.forEach(function (b) {
    updateObject_(ledger, b._row, { person_id: to.id, person_name: to.name });
  });
  logChange_('entries_remapped', moves.length + ' ' + which + ' entries moved from ' + personLabel(from) + ' to ' + personLabel(to) + ' (' + start + ' to ' + end + ')',
    before, { person_id: to.id, person_name: to.name });
  clearApiCache_();
  say_('Moved', moves.length + ' entries now belong to ' + personLabel(to) + '. Use "Undo last change" to reverse.');
}

function menuUndoLastChange() {
  var ui = SpreadsheetApp.getUi();
  var log = readObjects_(TAB_CHANGELOG);
  var undoable = ['person_added', 'person_deactivated', 'person_reactivated', 'person_renamed', 'person_role_changed', 'person_days_changed', 'entries_remapped'];
  var last = null;
  for (var i = log.length - 1; i >= 0; i--) {
    if (log[i].undone === 'no' && undoable.indexOf(log[i].action) >= 0) { last = log[i]; break; }
  }
  if (!last) return say_('Nothing to undo', 'No team change or remap to undo.');
  var ok = ui.alert('Undo this?', last.timestamp + '\n' + last.details, ui.ButtonSet.YES_NO);
  if (ok !== ui.Button.YES) return;

  var before = last.before_json ? JSON.parse(last.before_json) : null;
  var after = last.after_json ? JSON.parse(last.after_json) : null;
  var team = readTeam_();

  if (last.action === 'person_added') {
    var used = PERSON_LEDGERS.some(function (k) {
      return readObjects_(SCHEMA.forms[k].ledger).some(function (r) { return r.person_id === after.id; });
    });
    if (used) return say_('Can\'t undo', after.name + ' already has reports. Deactivate them instead.');
    var p = team.filter(function (x) { return x.id === after.id; })[0];
    if (p) ss_().getSheetByName(TAB_TEAM).deleteRow(p._row);
  } else if (last.action === 'entries_remapped') {
    before.forEach(function (b) {
      var rows = readObjects_(b.ledger).filter(function (r) { return r.response_id === b.response_id; });
      if (rows.length) updateObject_(b.ledger, rows[0]._row, { person_id: b.person_id, person_name: b.person_name });
    });
  } else {
    var current = team.filter(function (x) { return x.id === before.id; })[0];
    if (!current) return say_('Can\'t undo', 'That person is no longer in the Team tab.');
    updateObject_(TAB_TEAM, current._row, before);
  }
  updateObject_(TAB_CHANGELOG, last._row, { undone: 'yes' });
  logChange_('undo', 'Undid: ' + last.details);
  refreshDropdowns_();
  clearApiCache_();
  say_('Undone', last.details);
}

/* ---------------- Dropdowns ---------------- */

/** Rebuild every person dropdown from the Team tab. */
function refreshDropdowns_() {
  var team = readTeam_();
  var today = todayIso_();
  enabledForms_(getSettings_()).forEach(function (key) {
    var def = SCHEMA.forms[key];
    var personField = def.fields.filter(function (f) { return f.type === 'person'; })[0];
    if (!personField) return;
    var form = openForm_(key);
    if (!form) return;
    var itemMap = JSON.parse(setting_(formSettingKey_(key, 'items')) || '{}');
    var itemId = Object.keys(itemMap).filter(function (id) { return itemMap[id] === personField.key; })[0];
    if (!itemId) return;
    var labels = dropdownPeople(team, def.role, today, 3).map(personLabel);
    if (!labels.length) labels = ['(the founder will add names here)'];
    var item = form.getItemById(Number(itemId)).asListItem();
    var current = item.getChoices().map(function (c) { return c.getValue(); });
    if (current.join('|') !== labels.join('|')) item.setChoiceValues(labels);
  });
}

/* ===== 50_meta.js ===== */
/**
 * Meta Ads: account-level spend, impressions and clicks per day.
 * The token lives only in Script Properties (META_TOKEN). It is typed by the
 * founder into a prompt inside the Sheet, never into a chat or a file.
 */

var META_LOOKBACK_DAYS = 3; // Meta revises recent days, so re-pull today + 3 days back

function menuConnectMeta() {
  var ui = SpreadsheetApp.getUi();
  ui.alert('Connect Meta',
    'You need a Meta System User token with ads_read permission and your ad account ID.\n' +
    'docs/meta-token.md in the repo shows where to find both.\n\n' +
    'Only paste the token into the next box, never into a chat or email.', ui.ButtonSet.OK);
  var token = promptText_('Connect Meta (1 of 2)', 'Paste the System User token');
  if (token === null) return;
  var account = promptText_('Connect Meta (2 of 2)', 'Ad account ID (numbers only, with or without "act_")');
  if (account === null) return;
  account = account.replace(/^act_/i, '').replace(/\D/g, '');
  if (!account) return say_('Ad account ID not valid', 'Nothing changed.');
  var props = PropertiesService.getScriptProperties();
  props.setProperty('META_TOKEN', token);
  props.setProperty('META_AD_ACCOUNT_ID', account);
  logChange_('meta_connected', 'Meta connected to ad account ' + account);
  testMeta();
}

function metaConfig_() {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('META_TOKEN');
  var account = props.getProperty('META_AD_ACCOUNT_ID');
  if (!token || !account) return null;
  return { token: token, account: account, version: setting_('meta_api_version') || SETTING_DEFAULTS.meta_api_version };
}

function metaGet_(cfg, path, params) {
  var query = Object.keys(params).map(function (k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
  }).join('&');
  var url = 'https://graph.facebook.com/' + cfg.version + '/' + path + '?' + query + '&access_token=' + encodeURIComponent(cfg.token);
  return metaFetch_(url);
}

function metaFetch_(url) {
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  var body = {};
  try { body = JSON.parse(res.getContentText()); } catch (e) { body = {}; }
  if (res.getResponseCode() !== 200 || body.error) {
    var msg = body.error ? body.error.message : 'HTTP ' + res.getResponseCode();
    throw new Error('Meta: ' + msg);
  }
  return body;
}

/** Checks the token, and that the ad account's currency and timezone match Settings. */
function testMeta() {
  var ui = ui_();
  var cfg = metaConfig_();
  if (!cfg) {
    if (ui) ui.alert('Meta is not connected yet. Use Sales Tracker > Connect Meta.');
    return { ok: false, reason: 'not_connected' };
  }
  try {
    var acct = metaGet_(cfg, 'act_' + cfg.account, { fields: 'name,currency,timezone_name' });
    var s = getSettings_();
    var problems = [];
    if (String(acct.currency).toUpperCase() !== String(s.currency).toUpperCase()) {
      problems.push('Ad account currency is ' + acct.currency + ' but Settings currency is ' + s.currency + '. ROAS would be wrong.');
    }
    if (acct.timezone_name !== s.timezone) {
      problems.push('Ad account timezone is ' + acct.timezone_name + ' but Settings timezone is ' + s.timezone + '. Spend would land on the wrong days.');
    }
    if (problems.length) {
      setSettings_({ meta_status: 'mismatch', meta_last_error: problems.join(' ') });
      if (ui) ui.alert('Meta connected, but not used yet', problems.join('\n\n') + '\n\nAsk your assistant how to fix this.', ui.ButtonSet.OK);
      return { ok: false, reason: 'mismatch', problems: problems };
    }
    setSettings_({ meta_status: 'ok', meta_account_name: acct.name });
    var result = pullMeta_(true);
    var yesterday = addDays(todayIso_(), -1);
    var row = readObjects_('Ads').filter(function (r) { return r.platform === 'Meta' && r.source === 'api' && r.date === yesterday; })[0];
    var spend = row ? row.spend : 0;
    if (ui) ui.alert('Meta connected', 'Account: ' + acct.name + '\nYesterday (' + yesterday + ') spend: ' + spend + ' ' + s.currency +
      '\n\nCheck this matches Ads Manager. Meta now syncs every hour.', ui.ButtonSet.OK);
    return { ok: true, result: result };
  } catch (e) {
    setSettings_({ meta_status: 'error', meta_last_error: String(e.message || e) });
    if (ui) ui.alert('Meta connection failed', String(e.message || e), ui.ButtonSet.OK);
    return { ok: false, reason: 'error', message: String(e.message || e) };
  }
}

/**
 * Pull the last few days of Meta numbers into the Ads tab.
 * Locked so the hourly job and "Sync now" can never write at the same time.
 * Returns { status: 'ok'|'busy'|'not_connected'|'mismatch'|'error', rows }.
 */
function pullMeta_(force) {
  var cfg = metaConfig_();
  if (!cfg) return { status: 'not_connected', rows: 0 };
  if (!force && setting_('meta_status') === 'mismatch') return { status: 'mismatch', rows: 0 };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { status: 'busy', rows: 0 };
  try {
    var today = todayIso_();
    var since = addDays(today, -META_LOOKBACK_DAYS);
    var body = metaGet_(cfg, 'act_' + cfg.account + '/insights', {
      fields: 'spend,impressions,clicks',
      level: 'account',
      time_increment: 1,
      time_range: JSON.stringify({ since: since, until: today })
    });
    var rows = parseMetaInsights(body);
    while (body.paging && body.paging.next) {
      body = metaFetch_(body.paging.next);
      rows = rows.concat(parseMetaInsights(body));
    }
    writeMetaRows_(rows);
    setSettings_({ meta_last_sync: nowIso_(), meta_last_error: '', meta_status: 'ok' });
    clearApiCache_();
    return { status: 'ok', rows: rows.length };
  } catch (e) {
    var msg = String(e.message || e);
    var prev = setting_('meta_last_error');
    setSettings_({ meta_last_error: msg, meta_status: 'error' });
    if (prev !== msg) notifyFounder_('Meta sync failed', 'The hourly Meta pull failed:\n\n' + msg +
      '\n\nThe dashboard keeps the last good numbers and shows a warning. If the token was revoked, use Sales Tracker > Connect Meta.');
    return { status: 'error', rows: 0, message: msg };
  } finally {
    lock.releaseLock();
  }
}

function writeMetaRows_(rows) {
  if (!rows.length) return;
  var existing = readObjects_('Ads').map(function (r) {
    return { rowIndex: r._row, date: r.date, platform: r.platform, source: r.source };
  });
  var plan = planMetaUpsert(existing, rows);
  var now = nowIso_();
  plan.updates.forEach(function (u) {
    updateObject_('Ads', u.rowIndex, { spend: u.row.spend, impressions: u.row.impressions, clicks: u.row.clicks, synced_at: now });
  });
  appendObjects_('Ads', SCHEMA.adsColumns, plan.inserts.map(function (m) {
    return { date: m.date, platform: 'Meta', spend: m.spend, impressions: m.impressions, clicks: m.clicks, source: 'api', override: 'no', response_id: '', synced_at: now };
  }));
}

function menuSyncMetaNow() {
  var r = pullMeta_(false);
  say_('Meta sync', r.status === 'ok' ? 'Synced ' + r.rows + ' days.' : 'Not synced: ' + r.status + (r.message ? '\n' + r.message : ''));
}

/* ===== 60_api.js ===== */
/**
 * The private endpoint the dashboard reads. Deployed as a web app.
 * Apps Script web apps can't read request headers, so the API key travels in
 * the POST body (never in the URL, where it would be logged).
 *
 * POST { key, action: 'data' | 'sync' }
 */

var CACHE_KEY = 'api_payload_v1';
var CACHE_SECONDS = 300;
var CACHE_CHUNK = 90000; // CacheService values must stay under 100 KB

function doGet() {
  return ContentService.createTextOutput('Sales Tracker API is running. Use POST.').setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  var body = {};
  try { body = JSON.parse(e && e.postData ? e.postData.contents : '{}'); } catch (err) { body = {}; }
  var key = PropertiesService.getScriptProperties().getProperty('API_KEY');
  if (!safeEqual(body.key, key)) return json_({ ok: false, error: 'unauthorised' });

  try {
    if (body.action === 'sync') return json_(syncNow_());
    return json_({ ok: true, data: cachedPayload_() });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** "Sync now" from the dashboard: same pull as the hourly job, with a cooldown. */
function syncNow_() {
  var s = getSettings_();
  if (!enabled_(s, 'ads_enabled')) return { ok: true, status: 'ads_off' };
  var cooldown = Number(s.sync_cooldown_minutes || 5) * 60 * 1000;
  var last = Number(s.last_manual_sync_ms || 0);
  var now = Date.now();
  if (now - last < cooldown) {
    return { ok: true, status: 'cooldown', retry_after_seconds: Math.ceil((cooldown - (now - last)) / 1000) };
  }
  setSettings_({ last_manual_sync_ms: now });
  var r = pullMeta_(false);
  clearApiCache_();
  return { ok: r.status === 'ok', status: r.status, rows: r.rows, message: r.message || '' };
}

/* ---------------- Payload ---------------- */

function cachedPayload_() {
  var cache = CacheService.getScriptCache();
  var meta = cache.get(CACHE_KEY + ':n');
  if (meta) {
    var n = Number(meta);
    var keys = [];
    for (var i = 0; i < n; i++) keys.push(CACHE_KEY + ':' + i);
    var parts = cache.getAll(keys);
    if (Object.keys(parts).length === n) {
      return JSON.parse(keys.map(function (k) { return parts[k]; }).join(''));
    }
  }
  var payload = buildPayload_();
  var text = JSON.stringify(payload);
  var chunks = {};
  var count = Math.ceil(text.length / CACHE_CHUNK);
  for (var c = 0; c < count; c++) chunks[CACHE_KEY + ':' + c] = text.slice(c * CACHE_CHUNK, (c + 1) * CACHE_CHUNK);
  chunks[CACHE_KEY + ':n'] = String(count);
  try { cache.putAll(chunks, CACHE_SECONDS); } catch (err) { /* too big to cache: serve uncached */ }
  return payload;
}

function clearApiCache_() {
  CacheService.getScriptCache().remove(CACHE_KEY + ':n');
}

function numberRows_(rows, numericKeys) {
  return rows.map(function (r) {
    var o = {};
    Object.keys(r).forEach(function (k) {
      if (k === '_row') return;
      o[k] = numericKeys.indexOf(k) >= 0 ? (toNumber(r[k]) || 0) : (r[k] === null || r[k] === undefined ? '' : String(r[k]));
    });
    return o;
  });
}

function numericKeysOf_(formKey) {
  return SCHEMA.forms[formKey].fields
    .filter(function (f) { return f.type === 'count' || f.type === 'money'; })
    .map(function (f) { return f.key; });
}

function buildPayload_() {
  var s = getSettings_();
  var forms = enabledForms_(s);
  var team = readTeam_().map(personRow_);
  var ledger = function (key) {
    return forms.indexOf(key) >= 0 ? numberRows_(readObjects_(SCHEMA.forms[key].ledger), numericKeysOf_(key)) : [];
  };
  var closer = ledger('closer_eod');
  var setter = ledger('setter_eod');
  var today = todayIso_();
  var dates = dateRange(addDays(today, -34), addDays(today, -1));
  var missing = [];
  if (forms.indexOf('closer_eod') >= 0) {
    missing = missing.concat(findMissing(team, 'closer', closer, dates).map(function (m) { m.form = 'closer'; return m; }));
  }
  if (forms.indexOf('setter_eod') >= 0) {
    missing = missing.concat(findMissing(team, 'setter', setter, dates).map(function (m) { m.form = 'setter'; return m; }));
  }

  var now = nowIso_();
  return {
    schema_version: SCHEMA.version,
    generated_at: now,
    today: today,
    settings: {
      business_name: s.business_name,
      currency: s.currency,
      timezone: s.timezone,
      closers_enabled: enabled_(s, 'closers_enabled'),
      setters_enabled: enabled_(s, 'setters_enabled'),
      ads_enabled: enabled_(s, 'ads_enabled')
    },
    health: {
      status: s.health_status || 'unknown',
      issues: s.health_issues ? JSON.parse(s.health_issues) : [],
      last_health_check: s.last_health_check || '',
      minutes_since_health_check: minutesBetweenLocal(s.last_health_check, now),
      minutes_since_meta_sync: minutesBetweenLocal(s.meta_last_sync, now),
      last_reconcile: s.last_reconcile || '',
      rows_backfilled_last: Number(s.rows_backfilled_last || 0),
      rows_backfilled_total: Number(s.rows_backfilled_total || 0),
      meta_status: s.meta_status || 'not_connected',
      meta_last_sync: s.meta_last_sync || '',
      meta_last_error: s.meta_last_error || '',
      last_response: lastResponses_(forms, closer, setter)
    },
    team: team,
    closer: closer,
    setter: setter,
    ads: forms.indexOf('ad_spend') >= 0 ? numberRows_(readObjects_('Ads'), ['spend', 'impressions', 'clicks']) : [],
    refunds: ledger('refund'),
    missing: missing
  };
}

function lastResponses_(forms, closer, setter) {
  var latest = function (rows) {
    return rows.reduce(function (m, r) { return r.submitted_at > m ? r.submitted_at : m; }, '');
  };
  var out = {};
  if (forms.indexOf('closer_eod') >= 0) out.closer = latest(closer);
  if (forms.indexOf('setter_eod') >= 0) out.setter = latest(setter);
  return out;
}

/* ===== 70_jobs.js ===== */
/**
 * hourlyJob runs every hour. Each step is independent: one failing step
 * never stops the others, and every failure is reported by the health check.
 *
 * Daily jobs (reminders, founder summary, backup) run from here too: they fire
 * on the first hourly run after their time in the business timezone, so they
 * always follow the business timezone, even across daylight-saving changes.
 */

function hourlyJob() {
  var errors = [];
  var step = function (name, fn) {
    try { fn(); } catch (e) { errors.push(name + ': ' + String(e.message || e)); }
  };
  var s = getSettings_();

  step('reconcile', function () { reconcileAll_(); });
  if (enabled_(s, 'ads_enabled')) {
    step('meta', function () {
      var r = pullMeta_(false);
      if (r.status === 'busy') { /* the other run is already doing it */ }
    });
  }
  step('dropdowns', function () { refreshDropdowns_(); });
  step('reminders', function () { runRemindersIfDue_(); });
  step('summary', function () { runSummaryIfDue_(); });
  step('backup', function () { runBackupIfDue_(); });
  step('health', function () { runHealthCheck_(errors); });
  clearApiCache_();
}

/* ---------------- Missing EOD reminders (to each person) ---------------- */

function runRemindersIfDue_() {
  var s = getSettings_();
  if (!enabled_(s, 'reminders_enabled')) return;
  var today = todayIso_();
  if (!isDailyJobDue(today, localMinutes_(), s.eod_cutoff, s.last_reminder_date)) return;

  var team = readTeam_();
  var missing = missingFor_(team, [today]);
  missing.forEach(function (m) {
    if (!m.email) return;
    var link = setting_(formSettingKey_(m.form === 'closer' ? 'closer_eod' : 'setter_eod', 'url'));
    MailApp.sendEmail({
      to: m.email,
      subject: 'Your EOD report for ' + m.date + ' isn\'t in yet',
      body: 'Hi ' + m.name.split(' ')[0] + ',\n\nYour ' + m.form + ' EOD report for ' + m.date + ' hasn\'t come in yet.\n\n' +
        'Fill it in here: ' + link + '\n\nIf you had the day off, pick "Day off" in the form.\n\nThanks!'
    });
  });
  setSettings_({ last_reminder_date: today, last_reminder_count: missing.length });
}

/* ---------------- Founder summary (next morning) ---------------- */

function runSummaryIfDue_() {
  var s = getSettings_();
  if (!enabled_(s, 'summary_enabled')) return;
  var today = todayIso_();
  if (!isDailyJobDue(today, localMinutes_(), s.summary_time, s.last_summary_date)) return;

  var team = readTeam_();
  var yesterday = addDays(today, -1);
  var lookback = dateRange(addDays(yesterday, -13), yesterday);
  var missing = missingFor_(team, lookback);
  var missedYesterday = missing.filter(function (m) { return m.date === yesterday; });
  var streaks = [];
  team.forEach(function (p) {
    var mine = missing.filter(function (m) { return m.person_id === p.id; });
    var n = consecutiveMisses(p, mine, yesterday, 14);
    if (n >= 2) streaks.push(personLabel(p) + ': ' + n + ' working days in a row');
  });

  setSettings_({ last_summary_date: today });
  if (!missedYesterday.length && !streaks.length) return; // nothing to report, no email

  var lines = [];
  if (missedYesterday.length) {
    lines.push('Missing EOD reports for ' + yesterday + ':');
    missedYesterday.forEach(function (m) { lines.push('  • ' + m.name + ' (' + m.person_id + '), ' + m.form); });
  }
  if (streaks.length) {
    lines.push('', 'Missed 2 or more working days in a row:');
    streaks.forEach(function (x) { lines.push('  • ' + x); });
  }
  lines.push('', 'Late reports clear these automatically. Day off? They can submit "Day off" for that date.');
  notifyFounder_('Missing EODs for ' + yesterday, lines.join('\n'));
}

/** Missing reports across the enabled EOD forms for the given dates. */
function missingFor_(team, dates) {
  var forms = enabledForms_(getSettings_());
  var out = [];
  if (forms.indexOf('closer_eod') >= 0) {
    out = out.concat(findMissing(team, 'closer', readObjects_(SCHEMA.forms.closer_eod.ledger), dates)
      .map(function (m) { m.form = 'closer'; return m; }));
  }
  if (forms.indexOf('setter_eod') >= 0) {
    out = out.concat(findMissing(team, 'setter', readObjects_(SCHEMA.forms.setter_eod.ledger), dates)
      .map(function (m) { m.form = 'setter'; return m; }));
  }
  return out;
}

/* ---------------- Daily backup ---------------- */

function runBackupIfDue_() {
  var s = getSettings_();
  var today = todayIso_();
  if (!isDailyJobDue(today, localMinutes_(), s.backup_time, s.last_backup_date)) return;
  ensureBackupFolder_();
  var folder = DriveApp.getFolderById(setting_('backup_folder_id'));
  DriveApp.getFileById(ss_().getId()).makeCopy(s.business_name + ' Sales Tracker backup ' + today, folder);
  var files = [];
  var it = folder.getFiles();
  while (it.hasNext()) {
    var f = it.next();
    files.push({ id: f.getId(), created: f.getDateCreated().getTime() });
  }
  backupsToDelete(files, Number(s.backup_keep || 30)).forEach(function (id) {
    DriveApp.getFileById(id).setTrashed(true);
  });
  setSettings_({ last_backup_date: today });
}

/* ---------------- Health check ---------------- */

function menuCheckHealth() {
  var issues = runHealthCheck_([]);
  say_('Data health', issues.length ? issues.join('\n\n') : 'All good: forms are linked, triggers are in place and data is flowing.');
}

/**
 * Checks everything that can silently break, repairs what it can, and emails
 * the founder once per new problem. Returns the list of open issues.
 */
function runHealthCheck_(jobErrors) {
  var s = getSettings_();
  var issues = [];
  var repaired = [];

  enabledForms_(s).forEach(function (key) {
    var title = SCHEMA.forms[key].title;
    var form = openForm_(key);
    if (!form) { issues.push(title + ': form can\'t be opened. Run setup again.'); return; }
    try {
      if (ensureDestination_(key, form)) repaired.push(title + ' was re-linked to the Sheet');
    } catch (e) { issues.push(title + ': could not check the Sheet link (' + e.message + ')'); }
    if (!form.isAcceptingResponses()) {
      form.setAcceptingResponses(true);
      repaired.push(title + ' was not accepting responses; switched back on');
    }
  });

  var created = ensureTriggers_();
  if (created) repaired.push(created + ' missing automatic trigger(s) recreated');

  if (enabled_(s, 'ads_enabled') && s.meta_status === 'error') issues.push('Meta sync is failing: ' + s.meta_last_error);
  if (enabled_(s, 'ads_enabled') && s.meta_status === 'mismatch') issues.push('Meta is connected but its currency or timezone does not match Settings: ' + s.meta_last_error);

  (jobErrors || []).forEach(function (e) { issues.push('Hourly job step failed: ' + e); });

  var status = issues.length ? 'issues' : 'ok';
  setSettings_({
    last_health_check: nowIso_(),
    health_status: status,
    health_issues: JSON.stringify(issues.concat(repaired.map(function (r) { return 'Repaired: ' + r; })))
  });

  var fingerprint = issues.concat(repaired).join('|');
  var today = todayIso_();
  if (fingerprint && (fingerprint !== s.health_last_emailed || s.health_last_emailed_date !== today)) {
    notifyFounder_(issues.length ? 'Something needs attention' : 'Fixed automatically',
      (issues.length ? 'Open issues:\n  • ' + issues.join('\n  • ') + '\n\n' : '') +
      (repaired.length ? 'Repaired automatically:\n  • ' + repaired.join('\n  • ') + '\n\n' : '') +
      'Ask your assistant to "check my data" for help.');
    setSettings_({ health_last_emailed: fingerprint, health_last_emailed_date: today });
  }
  return issues;
}
