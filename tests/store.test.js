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

const Store = require(path.join(__dirname, '..', 'js', 'store.js'));

memory.clear();
assert.strictEqual(Store.getState().donations.length, 0);

Store.upsertDonation({ type: 'Krev', date: '2026-01-10', place: 'FN Test', note: 'ok' });
Store.upsertDonation({ type: 'Plazma', date: '2026-03-01', place: 'BioLife' });
let stats = Store.donationStats();
assert.strictEqual(stats.total, 2);
assert.strictEqual(stats.blood, 1);
assert.strictEqual(stats.plasma, 1);
assert.strictEqual(stats.last.type, 'Plazma');

const d = Store.listDonations().find((x) => x.type === 'Krev');
Store.upsertDonation({ id: d.id, type: 'Krev', date: '2026-01-11', place: 'FN Upraveno', note: 'edit', createdAt: d.createdAt });
assert.strictEqual(Store.getDonation(d.id).place, 'FN Upraveno');

Store.deleteDonation(d.id);
stats = Store.donationStats();
assert.strictEqual(stats.total, 1);
assert.strictEqual(stats.blood, 0);

Store.upsertReminder({
  title: 'Odběr Brno',
  datetime: '2026-11-01T09:00:00.000Z',
  source: 'Vlastní',
  notifyMode: 'day_before'
});
Store.upsertReminder({
  title: 'Plazma',
  datetime: '2026-11-02T10:00:00.000Z',
  source: 'Ze stanice',
  stationName: 'BioLife',
  notifyMode: 'hours_2'
});
Store.upsertReminder({
  title: 'Vlastní čas',
  datetime: '2026-11-03T12:00:00.000Z',
  notifyMode: 'custom',
  customNotifyAt: '2026-11-03T08:00:00.000Z'
});
const rems = Store.listReminders();
assert.strictEqual(rems.length, 3);
assert.ok(Store.notifyAtFor(rems[0]));
assert.ok(Store.notifyAtFor(rems.find((r) => r.notifyMode === 'hours_2')));
const custom = rems.find((r) => r.notifyMode === 'custom');
assert.strictEqual(Store.notifyAtFor(custom).toISOString(), '2026-11-03T08:00:00.000Z');

const payload = Store.exportPayload();
assert.strictEqual(payload.app, 'kapka-zivota');
assert.strictEqual(payload.data.donations.length, 1);

const extra = Store.parseImport({
  data: {
    donations: [
      { id: 'keep-me', type: 'Krev', date: '2025-01-01' },
      { id: Store.listDonations()[0].id, type: 'Krev', date: '2020-01-01' }
    ],
    reminders: [{ id: 'new-rem', title: 'X', datetime: '2026-12-01T08:00:00.000Z', notifyMode: 'day_before' }]
  }
});
Store.mergeImport(extra);
assert.strictEqual(Store.listDonations().length, 2); // existing + keep-me, duplicate id skipped
assert.ok(Store.listReminders().some((r) => r.id === 'new-rem'));

const beforeReplace = Store.getState().donations.length;
assert.ok(beforeReplace >= 2);
Store.replaceImport(
  Store.parseImport({
    data: {
      donations: [{ id: 'only', type: 'Plazma', date: '2026-05-05' }],
      reminders: []
    }
  })
);
assert.strictEqual(Store.listDonations().length, 1);
assert.strictEqual(Store.listDonations()[0].id, 'only');
assert.strictEqual(Store.listReminders().length, 0);

assert.strictEqual(Store.STORAGE_KEY, 'kapka-zivota-v1');
console.log('store.test.js OK');
