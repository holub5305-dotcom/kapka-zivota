/* Testy tvorby .ics (Uložit do kalendáře): escapování, zalomení, CRLF, vlastní upozornění, časová pásma. */
const path = require('path');
const assert = require('assert');
const I = require(path.join(__dirname, '..', 'js/ics.js'));
const NOW = new Date('2026-10-31T13:20:00Z');

// escapování TEXT
assert.strictEqual(I.escapeText('a\\b;c,d\ne\r\nf'), 'a\\\\b\\;c\\,d\\ne\\nf');
assert.strictEqual(I.escapeText('Odběr: krev'), 'Odběr: krev', 'dvojtečka se neescapuje');

// zalomení po 75 oktetech, UTF-8 bezpečně
const long = 'DESCRIPTION:' + 'ž'.repeat(100) + '😀'.repeat(20);
const folded = I.foldLine(long);
const parts = folded.split('\r\n');
assert.ok(parts.length > 1);
parts.forEach((p, i) => {
  assert.ok(Buffer.byteLength(p, 'utf8') <= 75, 'řádek ' + i + ' má ' + Buffer.byteLength(p, 'utf8'));
  if (i > 0) assert.strictEqual(p[0], ' ');
});
assert.strictEqual(parts.map((p, i) => (i ? p.slice(1) : p)).join(''), long, 'po rozvinutí stejný text');
assert.ok(!folded.includes('\uFFFD'));
assert.strictEqual(I.foldLine('KRÁTKÝ'), 'KRÁTKÝ');

// délky upozornění
assert.strictEqual(I.beforeDuration(0), 'PT0M');
assert.strictEqual(I.beforeDuration(45), '-PT45M');
assert.strictEqual(I.beforeDuration(120), '-PT2H');
assert.strictEqual(I.beforeDuration(1440), '-P1D');
assert.strictEqual(I.beforeDuration(1440 * 2 + 75), '-P2DT1H15M');

const base = { id: 'rem-abc123', title: 'Odběr', datetime: '2026-11-05T13:09:00.000Z', source: 'Vlastní', stationName: 'FN Brno', note: '' };
function trig(r) {
  const m = I.build(r, NOW).ics.match(/TRIGGER:([^\r\n]+)/);
  return m ? m[1] : null;
}
assert.strictEqual(trig(Object.assign({}, base, { notifyMode: 'day_before' })), '-P1D');
assert.strictEqual(trig(Object.assign({}, base, { notifyMode: 'hours_2' })), '-PT2H');
// vlastní čas před začátkem → přesná doba
assert.strictEqual(trig(Object.assign({}, base, { notifyMode: 'custom', customNotifyAt: '2026-11-05T12:39:00.000Z' })), '-PT30M');
assert.strictEqual(trig(Object.assign({}, base, { notifyMode: 'custom', customNotifyAt: '2026-11-03T08:00:00.000Z' })), '-P2DT5H9M');
// vlastní čas = začátek
assert.strictEqual(trig(Object.assign({}, base, { notifyMode: 'custom', customNotifyAt: base.datetime })), 'PT0M');
// vlastní čas po začátku → žádné tiché „den předem“, ale bez upozornění + informace pro UI
const after = I.build(Object.assign({}, base, { notifyMode: 'custom', customNotifyAt: '2026-11-05T15:00:00.000Z' }), NOW);
assert.strictEqual(after.alarm.ok, false);
assert.strictEqual(after.alarm.reason, 'after_start');
assert.ok(!after.ics.includes('BEGIN:VALARM'));
assert.ok(!after.ics.includes('-P1D'));
const bad = I.build(Object.assign({}, base, { notifyMode: 'custom', customNotifyAt: '' }), NOW);
assert.strictEqual(bad.alarm.ok, false);

// časové pásmo: letní/zimní čas Praha → správné UTC
const summer = I.build(Object.assign({}, base, { datetime: new Date('2026-07-01T08:00:00+02:00').toISOString(), notifyMode: 'day_before' }), NOW).ics;
assert.ok(summer.includes('DTSTART:20260701T060000Z'));
assert.ok(summer.includes('DTEND:20260701T070000Z'));
const winter = I.build(Object.assign({}, base, { datetime: new Date('2026-12-01T08:00:00+01:00').toISOString(), notifyMode: 'day_before' }), NOW).ics;
assert.ok(winter.includes('DTSTART:20261201T070000Z'));
// přechod na zimní čas (25. 10. 2026): 03:00 SEČ = 02:00 UTC
const dst = I.build(Object.assign({}, base, { datetime: '2026-10-25T03:00:00+01:00', notifyMode: 'day_before' }), NOW).ics;
assert.ok(dst.includes('DTSTART:20261025T020000Z'));

// celkový formát
const full = I.build(Object.assign({}, base, { title: 'Krev, plazma; test \\ x', note: 'Řádek 1\nŘádek 2', notifyMode: 'hours_2' }), NOW).ics;
assert.ok(full.endsWith('\r\n'));
assert.ok(!/[^\r]\n/.test(full), 'jen CRLF');
full.split('\r\n').forEach((l) => assert.ok(Buffer.byteLength(l, 'utf8') <= 75));
assert.ok(full.includes('SUMMARY:Krev\\, plazma\\; test \\\\ x'));
assert.ok(full.includes('UID:rem-abc123@kapka-zivota'));
assert.ok(full.includes('DTSTAMP:20261031T132000Z'));
assert.ok(/BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:/.test(full));
assert.ok(full.includes('Řádek 1\\nŘádek 2'));
assert.throws(() => I.build(Object.assign({}, base, { datetime: 'xx' }), NOW));

console.log('ics.test.js OK');
