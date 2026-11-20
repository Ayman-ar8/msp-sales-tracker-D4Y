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
