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
