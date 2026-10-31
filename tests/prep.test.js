/* Testy modulu Příprava na odběr (js/prep.js) — samostatný klíč, data deníku se nemění. */
const assert = require('assert');
const mem = {};
global.localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => (mem[k] = String(v)),
  removeItem: (k) => delete mem[k]
};
global.window = {};
require('../js/prep.js');
const P = window.KapkaPrep;

assert.strictEqual(P.PREP_KEY, 'kapka-zivota-prep-v1');
const diary = JSON.stringify({ version: 1, donations: [{ id: 'd1', type: 'Krev', date: '2026-09-01' }], reminders: [] });
mem['kapka-zivota-v1'] = diary;

['Krev', 'Plazma'].forEach((t) => {
  assert.strictEqual(P.CHECKLIST[t].length, 9, t + ': 9 položek');
  const ids = P.CHECKLIST[t].map((i) => i.id);
  assert.strictEqual(new Set(ids).size, ids.length, t + ': unikátní id');
  assert.ok(P.TIPS[t].length >= 4);
  P.TIPS[t].forEach((g) => {
    assert.ok(g.items.length > 0 && g.src.length > 0, t + '/' + g.h + ': položky i zdroje');
    g.src.forEach((k) => assert.ok(P.SOURCES[k] && /^https:\/\//.test(P.SOURCES[k].url), 'zdroj ' + k));
  });
});

assert.deepStrictEqual(P.count('Krev'), { done: 0, total: 9 });
P.toggle('Krev', 'breakfast', true);
P.toggle('Krev', 'id-card', true);
P.toggle('Plazma', 'drink-day', true);
assert.deepStrictEqual(P.count('Krev'), { done: 2, total: 9 });
assert.deepStrictEqual(P.count('Plazma'), { done: 1, total: 9 });
P.toggle('Krev', 'breakfast', false);
assert.deepStrictEqual(P.count('Krev'), { done: 1, total: 9 });
P.reset('Krev');
assert.deepStrictEqual(P.count('Krev'), { done: 0, total: 9 });
assert.deepStrictEqual(P.count('Plazma'), { done: 1, total: 9 }, 'reset jen pro zvolený typ');

// poškozená nebo cizí data se ignorují
mem['kapka-zivota-prep-v1'] = '{nevalidní';
assert.deepStrictEqual(P.count('Krev'), { done: 0, total: 9 });
mem['kapka-zivota-prep-v1'] = JSON.stringify({ checked: { Krev: { breakfast: true, hack: true, rest: 'ano' } } });
assert.deepStrictEqual(P.count('Krev'), { done: 1, total: 9 });

assert.strictEqual(mem['kapka-zivota-v1'], diary, 'kapka-zivota-v1 beze změny');
console.log('prep.test.js OK');
