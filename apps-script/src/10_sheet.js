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
