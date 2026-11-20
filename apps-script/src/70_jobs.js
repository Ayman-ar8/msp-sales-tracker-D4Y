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
