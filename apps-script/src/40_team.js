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
