'use strict';
// Orientační výpočet dalšího odběru — vyhláška č. 143/2008 Sb., příloha č. 3, bod 2
const assert = require('assert');
const path = require('path');
const E = require(path.join(__dirname, '..', 'js', 'eligibility.js'));
const K = (date) => ({ type: 'Krev', date });
const P = (date) => ({ type: 'Plazma', date });
let r;

// 0) bez záznamů
r = E.compute([], { today: '2026-10-31' });
assert.strictEqual(r.hasData, false);

// 1) poslední krev → krev +8 týdnů, plazma +4 týdny
r = E.compute([K('2026-10-01')], { today: '2026-10-31' });
assert.strictEqual(r.blood.date, '2026-11-26');
assert.strictEqual(r.plasma.date, '2026-10-29');
assert.strictEqual(r.plasma.isNowOrPast, true);
assert.strictEqual(r.blood.daysLeft, 26);

// 2) poslední plazma → plazma +14 dní, krev +48 h
r = E.compute([P('2026-10-28')], { today: '2026-10-29' });
assert.strictEqual(r.plasma.date, '2026-11-11');
assert.strictEqual(r.blood.date, '2026-10-30');
assert.match(r.blood.reason, /48 hodin/);

// 3) křížově: krev 1.9., plazma 20.10. → krev max(1.9.+56=27.10., 20.10.+2=22.10.) = 27.10.
//    plazma max(20.10.+14=3.11., 1.9.+28=29.9.) = 3.11.
r = E.compute([K('2026-09-01'), P('2026-10-20')], { today: '2026-10-21' });
assert.strictEqual(r.blood.date, '2026-10-27');
assert.strictEqual(r.plasma.date, '2026-11-03');

// 4) křížově: plazma 1.10., pak krev 3.10. → plazma až 3.10.+28 = 31.10.
r = E.compute([P('2026-10-01'), K('2026-10-03')], { today: '2026-10-10' });
assert.strictEqual(r.plasma.date, '2026-10-31');
assert.match(r.plasma.reason, /4 týdny/);

// 5) roční limit — neuvedeno = konzervativně 4 za 12 měsíců
const four = [K('2026-01-05'), K('2026-03-10'), K('2026-05-15'), K('2026-07-20')];
r = E.compute(four, { today: '2026-08-01' });
assert.strictEqual(r.bloodLimit, 4);
assert.strictEqual(r.bloodLast12, 4);
assert.strictEqual(r.blood.date, '2027-01-05');
assert.strictEqual(r.blood.reachedLimit, true);
// 5b) žena stejně
assert.strictEqual(E.compute(four, { sex: 'zena', today: '2026-08-01' }).blood.date, '2027-01-05');
// 5c) muž: limit 5 → platí jen 8 týdnů
r = E.compute(four, { sex: 'muz', today: '2026-08-01' });
assert.strictEqual(r.bloodLimit, 5);
assert.strictEqual(r.blood.date, '2026-09-14');
assert.strictEqual(r.blood.reachedLimit, false);
// 5d) muž s 5 odběry
r = E.compute(four.concat([K('2026-09-20')]), { sex: 'muz', today: '2026-10-01' });
assert.strictEqual(r.blood.date, '2027-01-05');

// 6) staré odběry mimo 12 měsíců limit neblokují
r = E.compute([K('2024-01-01'), K('2024-03-01'), K('2024-05-01'), K('2024-07-01')], { today: '2026-10-31' });
assert.strictEqual(r.blood.isNowOrPast, true);
assert.strictEqual(r.plasma.isNowOrPast, true);
assert.strictEqual(r.bloodLast12, 0);

// 7) neplatné záznamy se ignorují, neznámé pohlaví = neuvedeno
r = E.compute([{ type: 'Krev', date: '' }, K('2026-10-30')], { sex: 'x', today: '2026-10-31' });
assert.strictEqual(r.sex, 'neuvedeno');
assert.strictEqual(r.blood.date, '2026-12-25');

// 8) addMonths konec měsíce
assert.strictEqual(E._addMonths(new Date(Date.UTC(2024, 1, 29)), 12).toISOString().slice(0, 10), '2025-02-28');

console.log('eligibility tests OK');
