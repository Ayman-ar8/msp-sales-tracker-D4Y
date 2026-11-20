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
