/**
 * In-memory fakes of the Google Apps Script services the Sales Tracker uses.
 * Just enough behaviour to run setup, form submissions, reconciliation, the
 * Meta pull, alerts, health checks and the API end to end in Node.
 */

type Cell = string | number | boolean | Date;

let idCounter = 0;
const nextId = (p: string) => `${p}${++idCounter}`;

/* ---------------- Sheets ---------------- */

export class FakeRange {
  constructor(private sheet: FakeSheet, private row: number, private col: number, private rows = 1, private cols = 1) {}
  getValues(): Cell[][] {
    const out: Cell[][] = [];
    for (let r = 0; r < this.rows; r++) {
      const line: Cell[] = [];
      for (let c = 0; c < this.cols; c++) line.push(this.sheet.data[this.row - 1 + r]?.[this.col - 1 + c] ?? '');
      out.push(line);
    }
    return out;
  }
  getDisplayValues() { return this.getValues().map((r) => r.map((v) => String(v))); }
  setValues(values: Cell[][]) {
    values.forEach((line, r) => line.forEach((v, c) => this.sheet.set(this.row + r, this.col + c, v)));
    return this;
  }
  setValue(v: Cell) { this.sheet.set(this.row, this.col, v); return this; }
  setNumberFormat() { return this; }
  setFontWeight() { return this; }
  protect() { const p = new FakeProtection('RANGE'); this.sheet.protections.push(p); return p; }
}

class FakeProtection {
  description = '';
  constructor(readonly type: string) {}
  setDescription(d: string) { this.description = d; return this; }
  getDescription() { return this.description; }
  setWarningOnly() { return this; }
}

export class FakeSheet {
  data: Cell[][] = [];
  protections: FakeProtection[] = [];
  formUrl: string | null = null;
  constructor(public name: string) {}
  set(row: number, col: number, v: Cell) {
    while (this.data.length < row) this.data.push([]);
    const line = this.data[row - 1];
    while (line.length < col) line.push('');
    line[col - 1] = v;
  }
  getName() { return this.name; }
  setName(n: string) { this.name = n; return this; }
  getLastRow() {
    for (let i = this.data.length - 1; i >= 0; i--) if (this.data[i].some((v) => v !== '')) return i + 1;
    return 0;
  }
  getLastColumn() {
    let max = 0;
    this.data.forEach((l) => l.forEach((v, i) => { if (v !== '') max = Math.max(max, i + 1); }));
    return max;
  }
  getMaxRows() { return Math.max(1000, this.data.length); }
  getRange(row: number, col: number, rows = 1, cols = 1) {
    if (rows < 1 || cols < 1) throw new Error(`The number of rows/columns in the range must be at least 1 (got ${rows}x${cols})`);
    return new FakeRange(this, row, col, rows, cols);
  }
  getDataRange() { return new FakeRange(this, 1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn())); }
  appendRow(values: Cell[]) { const r = this.getLastRow() + 1; values.forEach((v, c) => this.set(r, c + 1, v)); return this; }
  deleteRow(r: number) { this.data.splice(r - 1, 1); return this; }
  setFrozenRows() { return this; }
  getProtections(type: string) { return this.protections.filter((p) => p.type === type); }
  protect() { const p = new FakeProtection('SHEET'); this.protections.push(p); return p; }
  getFormUrl() { return this.formUrl; }
}

export class FakeSpreadsheet {
  sheets: FakeSheet[] = [];
  timeZone = 'UTC';
  constructor(readonly id = nextId('ss')) {}
  getId() { return this.id; }
  getSheetByName(n: string) { return this.sheets.find((s) => s.name === n) ?? null; }
  insertSheet(n: string) { const s = new FakeSheet(n); this.sheets.push(s); return s; }
  getSheets() { return this.sheets; }
  setSpreadsheetTimeZone(tz: string) { this.timeZone = tz; }
  /** Helper for tests: rows as objects. */
  objects(name: string): Record<string, Cell>[] {
    const s = this.getSheetByName(name);
    if (!s || s.getLastRow() < 2) return [];
    const [header, ...rows] = s.getDataRange().getValues();
    return rows.map((r) => Object.fromEntries(header.map((h, i) => [String(h), r[i]])));
  }
}

/* ---------------- Forms ---------------- */

class FakeItem {
  title = '';
  choices: { value: string; nav?: unknown }[] = [];
  required = false;
  constructor(readonly form: FakeForm, readonly id: number, readonly type: string) {}
  getId() { return this.id; }
  getTitle() { return this.title; }
  setTitle(t: string) { this.title = t; return this; }
  setRequired(r: boolean) { this.required = r; return this; }
  setHelpText() { return this; }
  setValidation() { return this; }
  setIncludesYear() { return this; }
  setChoiceValues(v: string[]) { this.choices = v.map((value) => ({ value })); return this; }
  createChoice(value: string, nav?: unknown) { return { value, nav }; }
  setChoices(c: { value: string; nav?: unknown }[]) { this.choices = c; return this; }
  getChoices() { return this.choices.map((c) => ({ getValue: () => c.value })); }
  asListItem() { return this; }
  asMultipleChoiceItem() { return this; }
}

class FakeResponse {
  constructor(readonly id: string, readonly timestamp: Date, readonly answers: { item: FakeItem; value: string }[]) {}
  getId() { return this.id; }
  getTimestamp() { return this.timestamp; }
  getItemResponses() { return this.answers.map((a) => ({ getItem: () => a.item, getResponse: () => a.value })); }
}

export class FakeForm {
  items: FakeItem[] = [];
  responses: FakeResponse[] = [];
  destinationId: string | null = null;
  accepting = true;
  title = '';
  private itemSeq = 1000 + Math.floor(Math.random() * 1000);
  constructor(private env: GoogleEnv, readonly id = nextId('form')) {}
  getId() { return this.id; }
  setTitle(t: string) { this.title = t; return this; }
  setDescription() { return this; }
  setCollectEmail() { return this; }
  setAllowResponseEdits() { return this; }
  setShowLinkToRespondAgain() { return this; }
  setProgressBar() { return this; }
  setConfirmationMessage() { return this; }
  private add(type: string) { const it = new FakeItem(this, this.itemSeq++, type); this.items.push(it); return it; }
  addDateItem() { return this.add('DATE'); }
  addListItem() { return this.add('LIST'); }
  addMultipleChoiceItem() { return this.add('MULTIPLE_CHOICE'); }
  addTextItem() { return this.add('TEXT'); }
  addParagraphTextItem() { return this.add('PARAGRAPH_TEXT'); }
  addPageBreakItem() { return this.add('PAGE_BREAK'); }
  getItemById(id: number) { const it = this.items.find((i) => i.id === id); if (!it) throw new Error('no item ' + id); return it; }
  getPublishedUrl() { return `https://docs.google.com/forms/d/${this.id}/viewform`; }
  getEditUrl() { return `https://docs.google.com/forms/d/${this.id}/edit`; }
  getDestinationType() { return this.destinationId ? 'SPREADSHEET' : null; }
  getDestinationId() { if (!this.destinationId) throw new Error('No destination'); return this.destinationId; }
  setDestination(_type: string, id: string) {
    this.destinationId = id;
    const ss = this.env.spreadsheets.get(id)!;
    const n = ss.sheets.filter((s) => s.name.startsWith('Form Responses')).length + 1;
    const sh = ss.insertSheet(`Form Responses ${n}`);
    sh.formUrl = this.getPublishedUrl();
    sh.appendRow(['Timestamp', ...this.items.filter((i) => i.type !== 'PAGE_BREAK').map((i) => i.title)]);
    return this;
  }
  removeDestination() { this.destinationId = null; return this; }
  getResponses() { return this.responses.slice(); }
  deleteResponse(id: string) { this.responses = this.responses.filter((r) => r.id !== id); return this; }
  isAcceptingResponses() { return this.accepting; }
  setAcceptingResponses(a: boolean) { this.accepting = a; return this; }

  /** Test helper: submit answers keyed by question title. Fires submit triggers unless told not to. */
  submit(answersByTitle: Record<string, string>, opts: { fireTriggers?: boolean; at?: Date } = {}) {
    const answers = Object.entries(answersByTitle).map(([title, value]) => {
      const item = this.items.find((i) => i.title === title);
      if (!item) throw new Error(`No question titled "${title}"`);
      return { item, value };
    });
    const resp = new FakeResponse(nextId('resp'), opts.at ?? new Date(), answers);
    this.responses.push(resp);
    if (this.destinationId) {
      const sh = this.env.spreadsheets.get(this.destinationId)!.getSheets().find((s) => s.formUrl === this.getPublishedUrl());
      sh?.appendRow([resp.timestamp, ...answers.map((a) => a.value)]);
    }
    if (opts.fireTriggers !== false) {
      for (const t of this.env.triggers.filter((t) => t.sourceId === this.id && t.kind === 'formSubmit')) {
        this.env.call(t.handler, { source: this, response: resp });
      }
    }
    return resp;
  }
}

/* ---------------- Everything else ---------------- */

interface Trigger { id: string; handler: string; kind: 'hourly' | 'formSubmit'; sourceId: string | null }

class FakeFolder {
  files: { id: string; name: string; created: number; trashed: boolean }[] = [];
  constructor(readonly id = nextId('folder'), readonly name = '') {}
  getId() { return this.id; }
  getFiles() {
    const list = this.files.filter((f) => !f.trashed);
    let i = 0;
    return {
      hasNext: () => i < list.length,
      next: () => { const f = list[i++]; return { getId: () => f.id, getDateCreated: () => new Date(f.created) }; }
    };
  }
}

export class GoogleEnv {
  spreadsheets = new Map<string, FakeSpreadsheet>();
  forms = new Map<string, FakeForm>();
  folders = new Map<string, FakeFolder>();
  triggers: Trigger[] = [];
  props = new Map<string, string>();
  cache = new Map<string, string>();
  mail: { to: string; subject: string; body: string }[] = [];
  uiLog: string[] = [];
  promptQueue: string[] = [];
  fetchHandler: (url: string) => { code: number; body: unknown } = () => ({ code: 404, body: {} });
  webAppUrl = 'https://script.google.com/macros/s/fake/exec';
  context: Record<string, any> = {};
  active: FakeSpreadsheet;

  constructor() {
    this.active = new FakeSpreadsheet();
    this.spreadsheets.set(this.active.id, this.active);
  }

  call(fn: string, arg?: unknown) {
    const f = this.context[fn];
    if (typeof f !== 'function') throw new Error(`No function ${fn}`);
    return f(arg);
  }

  formatDate(date: Date, tz: string, pattern: string) {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
        .formatToParts(date).map((x) => [x.type, x.value])
    );
    return pattern
      .replace("'T'", 'T')
      .replace('yyyy', p.year).replace('MM', p.month).replace('dd', p.day)
      .replace('HH', p.hour).replace('mm', p.minute).replace('ss', p.second);
  }

  /** The globals Apps Script code expects. */
  globals(): Record<string, unknown> {
    const env = this;
    const ui = {
      ButtonSet: { OK: 'OK', OK_CANCEL: 'OK_CANCEL', YES_NO: 'YES_NO' },
      Button: { OK: 'OK', YES: 'YES', NO: 'NO', CANCEL: 'CANCEL' },
      alert: (...a: unknown[]) => { env.uiLog.push(a.map(String).join(' | ')); return a[2] === 'YES_NO' ? (env.promptQueue.shift() === 'no' ? 'NO' : 'YES') : 'OK'; },
      prompt: (title: string) => {
        const text = env.promptQueue.shift();
        env.uiLog.push('prompt: ' + title);
        return { getSelectedButton: () => (text === undefined ? 'CANCEL' : 'OK'), getResponseText: () => text ?? '' };
      },
      createMenu: () => { const m = { addItem: () => m, addSeparator: () => m, addToUi: () => undefined }; return m; }
    };
    const triggerBuilder = (handler: string) => {
      const t: Trigger = { id: nextId('trig'), handler, kind: 'hourly', sourceId: null };
      const create = () => { env.triggers.push(t); return t; };
      return {
        timeBased: () => ({ everyHours: () => ({ create }) }),
        forForm: (form: FakeForm) => ({ onFormSubmit: () => ({ create: () => { t.kind = 'formSubmit'; t.sourceId = form.id; return create(); } }) })
      };
    };
    return {
      SpreadsheetApp: {
        getActive: () => env.active,
        openById: (id: string) => { const s = env.spreadsheets.get(id); if (!s) throw new Error('no ss'); return s; },
        getUi: () => ui,
        flush: () => undefined,
        ProtectionType: { RANGE: 'RANGE', SHEET: 'SHEET' }
      },
      FormApp: {
        create: (title: string) => { const f = new FakeForm(env); f.title = title; env.forms.set(f.id, f); return f; },
        openById: (id: string) => { const f = env.forms.get(id); if (!f) throw new Error('no form'); return f; },
        createTextValidation: () => { const b = { requireTextMatchesPattern: () => b, setHelpText: () => b, build: () => ({}) }; return b; },
        DestinationType: { SPREADSHEET: 'SPREADSHEET' },
        PageNavigationType: { SUBMIT: 'SUBMIT', CONTINUE: 'CONTINUE' }
      },
      ScriptApp: {
        newTrigger: triggerBuilder,
        getProjectTriggers: () => env.triggers.map((t) => ({ getHandlerFunction: () => t.handler, getTriggerSourceId: () => t.sourceId, _id: t.id })),
        deleteTrigger: (t: { _id: string }) => { env.triggers = env.triggers.filter((x) => x.id !== t._id); },
        getService: () => ({ getUrl: () => env.webAppUrl })
      },
      PropertiesService: {
        getScriptProperties: () => ({
          getProperty: (k: string) => env.props.get(k) ?? null,
          setProperty: (k: string, v: string) => { env.props.set(k, v); },
          deleteProperty: (k: string) => { env.props.delete(k); }
        })
      },
      LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => undefined }) },
      CacheService: {
        getScriptCache: () => ({
          get: (k: string) => env.cache.get(k) ?? null,
          getAll: (keys: string[]) => Object.fromEntries(keys.filter((k) => env.cache.has(k)).map((k) => [k, env.cache.get(k)])),
          putAll: (o: Record<string, string>) => { Object.entries(o).forEach(([k, v]) => env.cache.set(k, v)); },
          remove: (k: string) => { env.cache.delete(k); }
        })
      },
      DriveApp: {
        getFileById: (id: string) => ({
          getId: () => id,
          getParents: () => ({ next: () => ({ id: 'root' }) }),
          moveTo: () => undefined,
          makeCopy: (name: string, folder: FakeFolder) => { folder.files.push({ id: nextId('file'), name, created: Date.now() + folder.files.length, trashed: false }); },
          setTrashed: () => { env.folders.forEach((f) => f.files.forEach((x) => { if (x.id === id) x.trashed = true; })); }
        }),
        createFolder: (name: string) => { const f = new FakeFolder(undefined, name); env.folders.set(f.id, f); return f; },
        getFolderById: (id: string) => { const f = env.folders.get(id); if (!f) throw new Error('no folder'); return f; }
      },
      MailApp: { sendEmail: (m: { to: string; subject: string; body: string }) => { env.mail.push(m); } },
      Session: { getScriptTimeZone: () => 'UTC', getActiveUser: () => ({ getEmail: () => 'founder@example.com' }) },
      Utilities: {
        formatDate: (d: Date, tz: string, p: string) => env.formatDate(d, tz, p),
        getUuid: () => `${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`,
        sleep: () => undefined
      },
      UrlFetchApp: {
        fetch: (url: string) => { const r = env.fetchHandler(url); return { getResponseCode: () => r.code, getContentText: () => JSON.stringify(r.body) }; }
      },
      ContentService: {
        createTextOutput: (t: string) => ({ setMimeType: () => ({ getContent: () => t }) }),
        MimeType: { JSON: 'JSON', TEXT: 'TEXT' }
      }
    };
  }
}
