'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'data', 'stations.json');
const stations = JSON.parse(fs.readFileSync(file, 'utf8'));

assert.strictEqual(stations.length, 108, 'expected 108 stations');
const kraje = new Set(stations.map((s) => s.kraj));
assert.ok(kraje.size >= 14, 'expected >= 14 kraje, got ' + kraje.size);

const kinds = new Set(stations.map((s) => s.kind));
assert.ok(kinds.has('Nemocniční'));
assert.ok(kinds.has('Plazma centrum'));

const required = ['id', 'name', 'city', 'address', 'kraj', 'phone', 'kind', 'types', 'booking', 'source'];
for (const s of stations) {
  for (const k of required) {
    assert.ok(s[k] !== undefined && s[k] !== null && String(s[k]).length > 0 || k === 'types', 'missing ' + k + ' on ' + s.id);
  }
  assert.ok(Array.isArray(s.types) && s.types.length > 0, 'types on ' + s.id);
  assert.ok(s.phone, 'phone on ' + s.id);
}

const praha = stations.filter((s) => s.kraj === 'Hlavní město Praha');
assert.ok(praha.length >= 1);

const plasma = stations.filter((s) => s.types.includes('Plazma') && s.kind === 'Plazma centrum');
assert.ok(plasma.length >= 1);

const emptyWeb = stations.filter((s) => !s.web);
assert.ok(emptyWeb.length > 0, 'some hospital sites may have empty web — UI must mark unverified');

console.log('stations.test.js OK', {
  count: stations.length,
  kraje: kraje.size,
  nemocnicni: stations.filter((s) => s.kind === 'Nemocniční').length,
  plazma: stations.filter((s) => s.kind === 'Plazma centrum').length,
  emptyWeb: emptyWeb.length
});
