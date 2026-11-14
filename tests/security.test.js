'use strict';
/* v1.2.8: bezpečnostní testy — import podvržené zálohy (XSS), escapování, kompatibilita záloh, CSP, ochrana proti rámu. */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

const memory = new Map();
global.localStorage = {
  getItem: (k) => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => memory.set(k, String(v)),
  removeItem: (k) => memory.delete(k),
  clear: () => memory.clear()
};
global.window = global;
global.CustomEvent = class CustomEvent {
  constructor(type, init) { this.type = type; this.detail = init && init.detail; }
};
global.dispatchEvent = () => true;

const Safe = require(path.join(root, 'js', 'safe.js'));
const Store = require(path.join(root, 'js', 'store.js'));
let n = 0;
const t = (name, fn) => { fn(); n++; };

const POC = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'poc-malicious-backup.json'), 'utf8'));
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const DANGER = /[<>"'`]/;

/* —— 1. KapkaSafe.esc —— */
t('esc escapes all HTML-special characters', () => {
  const out = Safe.esc(POC.data.donations[0].note);
  assert.ok(!DANGER.test(out), out);
  assert.strictEqual(Safe.esc(`<a href="x" title='y'>\``), '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&#96;');
  assert.strictEqual(Safe.esc(null), '');
  assert.strictEqual(Safe.esc(undefined), '');
  assert.strictEqual(Safe.esc(0), '0');
  assert.strictEqual(Safe.esc('„česká“ diakritika & <b>'), '„česká“ diakritika &amp; &lt;b&gt;');
});

/* —— 2. parseImport s PoC souborem —— */
const parsed = Store.parseImport(POC);
t('PoC: only well-formed records survive', () => {
  assert.strictEqual(parsed.donations.length, 2, 'd1 + d2 (dates valid); {id:{x:1},date:12345} and __proto__ record dropped');
  assert.strictEqual(parsed.reminders.length, 1, 'r1 only; r2 has datetime "x"');
});
t('PoC: every id is regenerated to the safe pattern', () => {
  for (const x of [...parsed.donations, ...parsed.reminders]) {
    assert.ok(ID_RE.test(x.id), x.id);
    assert.ok(!x.id.includes('img'), x.id);
  }
  assert.ok(parsed.donations.every((d) => /^don-/.test(d.id)));
  assert.ok(parsed.reminders.every((r) => /^rem-/.test(r.id)));
});
t('PoC: structural fields carry no markup', () => {
  for (const d of parsed.donations) {
    assert.ok(['Krev', 'Plazma'].includes(d.type));
    assert.match(d.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(!DANGER.test(d.createdAt) && !DANGER.test(d.updatedAt), d.createdAt);
    assert.ok(!Number.isNaN(new Date(d.createdAt).getTime()));
  }
  for (const r of parsed.reminders) {
    assert.ok(!DANGER.test(r.datetime) && !DANGER.test(r.customNotifyAt) && !DANGER.test(r.stationId));
    assert.strictEqual(r.stationId, '');
    assert.strictEqual(r.notifyMode, 'day_before');
    assert.strictEqual(r.source, 'Vlastní');
    assert.strictEqual(r.customNotifyAt, '');
    assert.strictEqual(r.notifiedAt, null);
  }
});
t('PoC: theme / donorSex rejected', () => {
  assert.strictEqual(parsed.theme, undefined);
  assert.strictEqual(parsed.donorSex, undefined);
});
t('PoC: free text is kept as plain text (escaped on render)', () => {
  const place = parsed.donations[0].place;
  assert.ok(place.includes('<img'), 'text stays as typed');
  assert.ok(!DANGER.test(Safe.esc(place)));
});
t('PoC: no prototype pollution', () => {
  assert.strictEqual({}.polluted, undefined);
  assert.strictEqual(Object.prototype.polluted, undefined);
});
t('PoC: merge + replace store only sanitized data; nothing global changes', () => {
  memory.clear();
  Store.upsertDonation({ type: 'Krev', date: '2026-01-10', place: 'FN Test' });
  Store.mergeImport(parsed);
  let st = Store.getState();
  assert.strictEqual(st.donations.length, 3);
  assert.strictEqual(st.reminders.length, 1);
  assert.strictEqual(st.theme, 'system');
  assert.ok([...st.donations, ...st.reminders].every((x) => ID_RE.test(x.id)));
  Store.replaceImport(Store.parseImport(POC));
  st = Store.getState();
  assert.strictEqual(st.donations.length, 2);
  assert.ok(!('__xss' in global));
});

/* —— 3. platná záloha projde beze změny (staré i nové verze) —— */
t('legit backup round-trips unchanged', () => {
  const legit = {
    app: 'kapka-zivota', format: 1, data: {
      version: 1, welcomeDone: true, theme: 'dark', donorSex: 'zena',
      donations: [
        { id: 'don-a1', type: 'Krev', date: '2026-02-12', place: 'FN Motol', note: 'bez potíží', createdAt: '2026-02-12T10:00:00.000Z', updatedAt: '2026-02-12T10:00:00.000Z' },
        { id: 'don-mh3x9k-abc1234', type: 'Plazma', date: '2026-04-20', place: '', note: '„česká“ <b>tag</b>', createdAt: '2026-04-20T09:00:00.000Z', updatedAt: '2026-04-20T09:00:00.000Z' }
      ],
      reminders: [
        { id: 'rem-1', title: 'Odběr krve ÚVN', datetime: '2026-12-03T08:30', source: 'Vlastní', stationId: '', stationName: 'ÚVN Praha', notifyMode: 'day_before', customNotifyAt: '', note: 'nalačno ne', notifiedAt: null, createdAt: '2026-10-01T10:00:00.000Z', updatedAt: '2026-10-01T10:00:00.000Z' },
        { id: 'rem-0', title: 'Starý', datetime: '2026-05-01T06:00:00.000Z', source: 'Ze stanice', stationId: 'uvn-praha', stationName: 'FN Motol', notifyMode: 'custom', customNotifyAt: '2026-05-01T04:00:00.000Z', note: '', notifiedAt: '2026-05-01T04:00:00.000Z', createdAt: '2026-04-01T10:00:00.000Z', updatedAt: '2026-04-01T10:00:00.000Z' }
      ]
    }
  };
  const p = Store.parseImport(legit);
  assert.deepStrictEqual(p.donations, legit.data.donations);
  assert.deepStrictEqual(p.reminders, legit.data.reminders);
  assert.strictEqual(p.theme, 'dark');
  assert.strictEqual(p.donorSex, 'zena');
  assert.strictEqual(p.welcomeDone, true);
  // export → import vlastní zálohy je beze ztráty
  memory.clear();
  Store.replaceImport(p);
  const again = Store.parseImport(JSON.parse(JSON.stringify(Store.exportPayload())));
  assert.deepStrictEqual(again.donations, legit.data.donations);
  assert.deepStrictEqual(again.reminders, legit.data.reminders);
});
t('ids generated by the app itself match the pattern', () => {
  for (let i = 0; i < 200; i++) assert.ok(ID_RE.test(Store.uid('don')) && ID_RE.test(Store.uid('rem')));
});
t('invalid shapes are rejected safely', () => {
  assert.throws(() => Store.parseImport(null));
  assert.throws(() => Store.parseImport([1, 2]));
  const p = Store.parseImport({ donations: [null, 5, 'x', [], { date: '2026-02-30' }, { date: '2026-13-01' }, { date: '2026-03-01', id: 'a'.repeat(65) }], reminders: { length: 3 } });
  assert.strictEqual(p.donations.length, 1);
  assert.ok(ID_RE.test(p.donations[0].id) && p.donations[0].id.length <= 64 && p.donations[0].id !== 'a'.repeat(65));
  assert.strictEqual(p.reminders.length, 0);
  const q = Store.parseImport({ donations: [{ date: '2026-03-01', place: { toString() { return '<x>'; } }, note: 42 }] });
  assert.strictEqual(q.donations[0].place, '');
  assert.strictEqual(q.donations[0].note, '42');
});

/* —— 3b. zálohy ze všech dřívějších verzí (formát 1.0–1.1 bez donorSex, 1.2.x s donorSex) —— */
for (const f of fs.readdirSync(path.join(__dirname, 'fixtures')).filter((x) => /^backup-.*\.json$/.test(x))) {
  t('older valid backup imports unchanged: ' + f, () => {
    const obj = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', f), 'utf8'));
    const p = Store.parseImport(obj);
    const strip = (x) => JSON.parse(JSON.stringify(x));
    assert.deepStrictEqual(strip(p.donations), obj.data.donations, f + ' donations');
    assert.deepStrictEqual(strip(p.reminders), obj.data.reminders, f + ' reminders');
    assert.strictEqual(p.welcomeDone, obj.data.welcomeDone === true);
    assert.strictEqual(p.theme, obj.data.theme);
    assert.strictEqual(p.donorSex, obj.data.donorSex);
    // sloučení podruhé nic nezdvojí (id zůstávají stejná)
    memory.clear();
    Store.mergeImport(p);
    Store.mergeImport(Store.parseImport(obj));
    const st = Store.getState();
    assert.strictEqual(st.donations.length, obj.data.donations.length);
    assert.strictEqual(st.reminders.length, obj.data.reminders.length);
  });
}

/* —— 4. šablony: žádná neescapovaná interpolace id / typu / data —— */
t('screen templates escape record fields', () => {
  const files = ['diary.js', 'reminders.js', 'home.js'].map((f) => [f, fs.readFileSync(path.join(root, 'js', 'screens', f), 'utf8')]);
  for (const [f, src] of files) {
    const raw = src.match(/\$\{\s*(d|r|s|last|nextRem|existing)\.(id|type|date|datetime|place|note|title|stationName|stationId|web|email|phone)\s*\}/g);
    assert.strictEqual(raw, null, f + ': ' + raw);
    assert.ok(!/function escapeHtml\(s\) \{\s*return String/.test(src), f + ' uses KapkaSafe.esc');
  }
  for (const f of ['diary.js', 'reminders.js', 'home.js']) {
    const src = files.find((x) => x[0] === f)[1];
    assert.ok(/if \(Number\.isNaN\(d\.getTime\(\)\)\) return escapeHtml\(iso\);/.test(src), f + ': invalid date escaped');
  }
});

/* —— 5. CSP, ochrana proti rámu —— */
for (const f of ['index.html', 'share/letak.html']) {
  t(f + ': CSP meta, no inline scripts/handlers', () => {
    const html = fs.readFileSync(path.join(root, f), 'utf8');
    const m = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/);
    assert.ok(m, 'CSP meta');
    const csp = m[1];
    for (const d of ["default-src 'self'", "script-src 'self'", "connect-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'none'"]) assert.ok(csp.includes(d), d);
    assert.ok(!/script-src[^;]*'unsafe-(inline|eval)'/.test(csp));
    assert.ok(!csp.includes('frame-ancestors'), 'frame-ancestors is ignored in <meta> and would log a warning');
    assert.ok(html.indexOf('Content-Security-Policy') < html.search(/<(script|link|style)\b/), 'CSP before first resource');
    assert.strictEqual((html.match(/<script(?![^>]*\bsrc=)[^>]*>/g) || []).length, 0, 'no inline <script>');
    assert.ok(!/\son[a-z]+\s*=/i.test(html), 'no inline event handlers');
  });
}
t('frame guard: safe.js loads before the app and app.js refuses to start when framed', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const order = [...html.matchAll(/<script src="([^"?]+)/g)].map((x) => x[1]);
  assert.strictEqual(order[1], 'js/safe.js');
  assert.ok(order.indexOf('js/safe.js') < order.indexOf('js/app.js'));
  const app = fs.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');
  assert.ok(/function init\(\) \{\s*\/\/[^\n]*\n\s*if \(window\.KapkaSafe && KapkaSafe\.framed\) return;/.test(app));
  assert.strictEqual(Safe.framed, false, 'not framed outside a browser');
});
t('no network APIs that could send data', () => {
  const dirs = ['js', 'js/screens'];
  for (const d of dirs) for (const f of fs.readdirSync(path.join(root, d)).filter((x) => x.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(root, d, f), 'utf8');
    assert.ok(!/XMLHttpRequest|sendBeacon|WebSocket|EventSource|importScripts|\beval\(|new Function\(/.test(src), d + '/' + f);
    const fetches = src.match(/fetch\(([^)]*)\)/g) || [];
    fetches.forEach((x) => assert.ok(/data\/stations\.json/.test(x), d + '/' + f + ' ' + x));
  }
});

console.log('security.test.js OK (' + n + ' testů)');
