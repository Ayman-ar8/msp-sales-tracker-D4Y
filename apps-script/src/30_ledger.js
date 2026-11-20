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
