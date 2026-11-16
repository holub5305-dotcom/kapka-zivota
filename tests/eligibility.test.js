'use strict';
// Orientační výpočet dalšího odběru — v1.2.10: plná krev podle doporučení STL_03 v11 (2024),
// plazma podle vyhlášky č. 143/2008 Sb., příloha č. 3, bod 2 (beze změny)
const assert = require('assert');
const path = require('path');
const E = require(path.join(__dirname, '..', 'js', 'eligibility.js'));
const K = (date) => ({ type: 'Krev', date });
const P = (date) => ({ type: 'Plazma', date });
let r;

// pravidla
assert.strictEqual(E.RULES.bloodToBloodDays, 70);
assert.strictEqual(E.RULES.bloodToPlasmaDays, 28);
assert.strictEqual(E.RULES.plasmaToBloodDays, 2);
assert.strictEqual(E.RULES.plasmaToPlasmaDays, 14);
assert.deepStrictEqual(E.RULES.bloodPer12Months, { muz: 4, zena: 3, neuvedeno: 3 });

// 0) bez záznamů
r = E.compute([], { today: '2026-10-31' });
assert.strictEqual(r.hasData, false);

// 1) poslední krev → krev +10 týdnů (doporučený odstup), plazma +4 týdny
r = E.compute([K('2026-10-01')], { today: '2026-10-31' });
assert.strictEqual(r.blood.date, '2026-12-10');
assert.match(r.blood.reason, /doporučený odstup 10 týdnů/);
assert.strictEqual(r.plasma.date, '2026-10-29');
assert.strictEqual(r.plasma.isNowOrPast, true);
assert.strictEqual(r.blood.daysLeft, 40);

// 1b) hranice 69 / 70 / 71 dní
for (const sex of ['muz', 'zena', '']) {
  assert.strictEqual(E.compute([K('2026-03-01')], { sex, today: '2026-05-09' }).blood.isNowOrPast, false);
  assert.strictEqual(E.compute([K('2026-03-01')], { sex, today: '2026-05-09' }).blood.daysLeft, 1);
  assert.strictEqual(E.compute([K('2026-03-01')], { sex, today: '2026-05-10' }).blood.isNowOrPast, true);
  assert.strictEqual(E.compute([K('2026-03-01')], { sex, today: '2026-05-11' }).blood.isNowOrPast, true);
}

// 2) poslední plazma → plazma +14 dní, krev +48 h (beze změny)
r = E.compute([P('2026-10-28')], { today: '2026-10-29' });
assert.strictEqual(r.plasma.date, '2026-11-11');
assert.strictEqual(r.blood.date, '2026-10-30');
assert.match(r.blood.reason, /48 hodin/);

// 3) křížově: krev 1.9., plazma 20.10. → krev max(1.9.+70=10.11., 20.10.+2=22.10.) = 10.11.
//    plazma max(20.10.+14=3.11., 1.9.+28=29.9.) = 3.11.
r = E.compute([K('2026-09-01'), P('2026-10-20')], { today: '2026-10-21' });
assert.strictEqual(r.blood.date, '2026-11-10');
assert.strictEqual(r.plasma.date, '2026-11-03');

// 4) křížově: plazma 1.10., pak krev 3.10. → plazma až 3.10.+28 = 31.10. (beze změny)
r = E.compute([P('2026-10-01'), K('2026-10-03')], { today: '2026-10-10' });
assert.strictEqual(r.plasma.date, '2026-10-31');
assert.match(r.plasma.reason, /4 týdny/);
// 4b) krev → plazma 28 dní, plazma → krev 2 dny
assert.strictEqual(E.compute([K('2026-03-01')], { today: '2026-03-02' }).plasma.date, '2026-03-29');
r = E.compute([P('2026-03-01')], { today: '2026-03-02' });
assert.strictEqual(r.blood.date, '2026-03-03');
assert.strictEqual(r.plasma.date, '2026-03-15');

// 5) roční limit (12 kalendářních měsíců)
const four = [K('2026-01-05'), K('2026-03-10'), K('2026-05-15'), K('2026-07-20')];
// 5a) neuvedeno = opatrně 3
r = E.compute(four, { today: '2026-08-01' });
assert.strictEqual(r.sex, 'neuvedeno');
assert.strictEqual(r.bloodLimit, 3);
assert.strictEqual(r.bloodLast12, 4);
assert.strictEqual(r.blood.date, '2027-03-10'); // 12 měsíců po 3. nejnovějším (10. 3.)
assert.strictEqual(r.blood.reachedLimit, true);
assert.match(r.blood.reason, /opatrný výpočet/);
// 5b) žena: 3
r = E.compute(four, { sex: 'zena', today: '2026-08-01' });
assert.strictEqual(r.bloodLimit, 3);
assert.strictEqual(r.blood.date, '2027-03-10'); // 12 měsíců po 3. nejnovějším (10. 3.)
// 5c) muž: 4 odběry → limit dosažen
r = E.compute(four, { sex: 'muz', today: '2026-08-01' });
assert.strictEqual(r.bloodLimit, 4);
assert.strictEqual(r.blood.date, '2027-01-05');
assert.strictEqual(r.blood.reachedLimit, true);
// 5d) muž: 3 odběry → limit nedosažen, platí 10 týdnů
r = E.compute(four.slice(1), { sex: 'muz', today: '2026-08-01' });
assert.strictEqual(r.blood.date, '2026-09-28');
assert.strictEqual(r.blood.reachedLimit, false);
// 5e) žena: hranice 12 měsíců (den před / v den / den po)
const w3 = [K('2026-01-10'), K('2026-04-01'), K('2026-07-01')];
r = E.compute(w3, { sex: 'zena', today: '2027-01-09' });
assert.strictEqual(r.blood.date, '2027-01-10');
assert.strictEqual(r.blood.isNowOrPast, false);
assert.strictEqual(r.blood.daysLeft, 1);
assert.strictEqual(r.bloodLast12, 3);
r = E.compute(w3, { sex: 'zena', today: '2027-01-10' });
assert.strictEqual(r.blood.isNowOrPast, true);
assert.strictEqual(r.bloodLast12, 2);
assert.strictEqual(E.compute(w3, { sex: 'zena', today: '2027-01-11' }).blood.isNowOrPast, true);
// 5f) muž: hranice 12 měsíců u 4 odběrů
const m4 = [K('2026-01-10'), K('2026-04-01'), K('2026-07-01'), K('2026-10-01')];
assert.strictEqual(E.compute(m4, { sex: 'muz', today: '2027-01-09' }).blood.isNowOrPast, false);
assert.strictEqual(E.compute(m4, { sex: 'muz', today: '2027-01-10' }).blood.isNowOrPast, true);
// 5g) muž se 3 odběry v 12 měsících: limit 4 neblokuje
assert.strictEqual(E.compute(w3, { sex: 'muz', today: '2026-08-01' }).blood.date, '2026-09-09');
// 5h) přestupný rok: 12 měsíců od 29. 2. 2028 = 28. 2. 2029
const leap = [K('2028-02-29'), K('2028-05-15'), K('2028-08-01')];
assert.strictEqual(E.compute(leap, { sex: 'zena', today: '2028-09-01' }).blood.date, '2029-02-28');

// 6) staré odběry mimo 12 měsíců limit neblokují
r = E.compute([K('2024-01-01'), K('2024-03-01'), K('2024-05-01'), K('2024-07-01')], { today: '2026-10-31' });
assert.strictEqual(r.blood.isNowOrPast, true);
assert.strictEqual(r.plasma.isNowOrPast, true);
assert.strictEqual(r.bloodLast12, 0);

// 7) neplatné záznamy se ignorují, neznámé pohlaví = neuvedeno
r = E.compute([{ type: 'Krev', date: '' }, K('2026-10-30')], { sex: 'x', today: '2026-10-31' });
assert.strictEqual(r.sex, 'neuvedeno');
assert.strictEqual(r.blood.date, '2027-01-08');

// 8) addMonths konec měsíce
assert.strictEqual(E._addMonths(new Date(Date.UTC(2024, 1, 29)), 12).toISOString().slice(0, 10), '2025-02-28');

// 9) zdroje
assert.ok(/STL_03, verze 11/.test(E.SOURCES.stl03.label));

console.log('eligibility tests OK');
