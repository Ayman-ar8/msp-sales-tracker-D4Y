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
