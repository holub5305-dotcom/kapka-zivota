/* v1.2.5: text oznámení, označení opožděných oznámení a znovu-upozornění po změně času. */
'use strict';
const assert = require('assert');
const path = require('path');

const memory = new Map();
global.localStorage = {
  getItem: (k) => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => memory.set(k, String(v)),
  removeItem: (k) => memory.delete(k),
  clear: () => memory.clear()
};
global.window = global;
global.CustomEvent = class CustomEvent {
  constructor(type, init) {
    this.type = type;
    this.detail = init && init.detail;
  }
};
global.dispatchEvent = () => true;

const N = require(path.join(__dirname, '..', 'js/notify.js'));
require(path.join(__dirname, '..', 'js/store.js'));
const Store = global.KapkaStore;

// —— formát (místní čas; 5. 11. 2026 je čtvrtek) ——
const ev = new Date(2026, 10, 5, 14, 0);
const now = new Date(2026, 10, 4, 14, 0);
assert.strictEqual(N.TITLE, 'Kapka života – připomínka');
assert.ok(N.TITLE.includes('\u2013'), 'pomlčka je en dash');
assert.strictEqual(N.formatWhen(ev, now), 'čt 5. 11. v 14:00');
assert.strictEqual(N.formatWhen(new Date(2026, 10, 5, 9, 5), now), 'čt 5. 11. v 9:05');
assert.strictEqual(N.formatWhen(new Date(2027, 0, 4, 8, 0), now), 'po 4. 1. 2027 v 8:00');
assert.strictEqual(N.formatWhen('nesmysl', now), '');
assert.strictEqual(N.formatPlanned(new Date(2026, 10, 4, 13, 30), now), 'v 13:30');
assert.strictEqual(N.formatPlanned(new Date(2026, 10, 3, 13, 30), now), '3. 11. v 13:30');

// —— práh opoždění ——
const due = now.getTime();
assert.strictEqual(N.LATE_THRESHOLD_MS, 120000);
assert.strictEqual(N.isLate(due, due), false);
assert.strictEqual(N.isLate(due, due + 120000), false, 'přesně 2 min ještě není pozdě');
assert.strictEqual(N.isLate(due, due + 120001), true);
assert.strictEqual(N.isLate(due, due - 5000), false);

// —— sestavení oznámení ——
const r = { id: 'rem-abc', title: 'Odběr', datetime: ev.toISOString() };
const ok = N.build(r, due, due + 30000);
assert.deepStrictEqual(ok, { title: 'Kapka života – připomínka', body: 'Odběr · čt 5. 11. v 14:00', tag: 'kapka-rem-rem-abc', timestamp: ev.getTime(), late: false });
const late = N.build(r, new Date(2026, 10, 4, 13, 30).getTime(), due);
assert.strictEqual(late.late, true);
assert.strictEqual(late.body, 'Opožděné upozornění: Odběr · čt 5. 11. v 14:00 (mělo přijít v 13:30)');
assert.ok(late.body.startsWith(N.LATE_PREFIX));
const lateOtherDay = N.build(r, new Date(2026, 10, 3, 14, 0).getTime(), due);
assert.strictEqual(lateOtherDay.body, 'Opožděné upozornění: Odběr · čt 5. 11. v 14:00 (mělo přijít 3. 11. v 14:00)');
assert.strictEqual(N.build({ id: 'x', title: '  ', datetime: ev.toISOString() }, due, due).body, 'Připomínka odběru · čt 5. 11. v 14:00');

// —— změna času upozornění ——
const base = { id: 'rem-1', title: 'Odběr', datetime: '2026-11-05T13:00:00.000Z', notifyMode: 'day_before', customNotifyAt: '', note: '' };
const ch = (o) => Store.notifyTimeChanged(base, Object.assign({}, base, o));
assert.strictEqual(ch({}), false);
assert.strictEqual(ch({ title: 'Jiný název', note: 'poznámka', stationName: 'FN Brno' }), false);
assert.strictEqual(ch({ datetime: '2026-11-05T13:00:00Z' }), false, 'stejný okamžik v jiném zápisu');
assert.strictEqual(ch({ datetime: '2026-11-05T14:00:00.000Z' }), true);
assert.strictEqual(ch({ notifyMode: 'hours_2' }), true);
assert.strictEqual(ch({ notifyMode: 'custom', customNotifyAt: '2026-11-05T12:00:00.000Z' }), true);
assert.strictEqual(ch({ notifyMode: 'custom', customNotifyAt: '2026-11-04T13:00:00.000Z' }), false, 'vlastní čas = stejný okamžik jako den předem');
const cbase = Object.assign({}, base, { notifyMode: 'custom', customNotifyAt: '2026-11-05T12:00:00.000Z' });
assert.strictEqual(Store.notifyTimeChanged(cbase, Object.assign({}, cbase, { customNotifyAt: '2026-11-05T12:30:00.000Z' })), true);
assert.strictEqual(Store.notifyTimeChanged(cbase, Object.assign({}, cbase, { datetime: '2026-11-06T13:00:00.000Z' })), true, 'jiný termín při stejném vlastním čase');

// —— upsertReminder: notifiedAt ——
Store.upsertReminder(base);
Store.markReminderNotified('rem-1');
const stamp = Store.getReminder('rem-1').notifiedAt;
assert.ok(stamp);
Store.upsertReminder(Object.assign({}, base, { title: 'Odběr plazmy', note: 'vzít průkaz' }));
assert.strictEqual(Store.getReminder('rem-1').notifiedAt, stamp, 'úprava názvu/poznámky: bez nového upozornění');
assert.strictEqual(Store.getReminder('rem-1').title, 'Odběr plazmy');
Store.upsertReminder(Object.assign({}, base, { title: 'Odběr plazmy', datetime: '2026-11-06T13:00:00.000Z' }));
assert.strictEqual(Store.getReminder('rem-1').notifiedAt, null, 'změna termínu: znovu upozornit');
Store.markReminderNotified('rem-1');
Store.upsertReminder(Object.assign({}, base, { datetime: '2026-11-06T13:00:00.000Z', notifyMode: 'hours_2' }));
assert.strictEqual(Store.getReminder('rem-1').notifiedAt, null, 'změna režimu upozornění: znovu upozornit');
// ostatní připomínky beze změny
Store.upsertReminder(Object.assign({}, base, { id: 'rem-2' }));
Store.markReminderNotified('rem-2');
const before2 = JSON.stringify(Store.getReminder('rem-2'));
Store.upsertReminder(Object.assign({}, base, { datetime: '2026-12-01T10:00:00.000Z' }));
assert.strictEqual(JSON.stringify(Store.getReminder('rem-2')), before2, 'jiná připomínka se nemění');

console.log('notify.test.js OK');
