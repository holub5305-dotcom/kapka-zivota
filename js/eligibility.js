/**
 * Kapka života — ORIENTAČNÍ výpočet nejdřívějšího dalšího odběru.
 *
 * NEJDE o lékařské potvrzení. Skutečnou způsobilost a termín určuje vždy
 * odběrové centrum (transfuzní oddělení / plazmacentrum) a zdravotní stav dárce.
 *
 * Zdroj pravidel (ověřeno 31. 10. 2026, aktuální znění vyhlášky k 1. 7. 2024):
 *   Vyhláška č. 143/2008 Sb., o lidské krvi, Příloha č. 3,
 *   bod 2 „Frekvence odběrů a maximální odebírané množství krve a jejích složek“
 *   https://www.zakonyprolidi.cz/cs/2008-143
 *   - 2.1 bod 2: plná krev → plná krev min. 8 týdnů; v průběhu 12 měsíců
 *                nejvýše 5 standardních odběrů u mužů a 4 u žen.
 *   - 2.3 bod 2: plazma → plná krev min. 48 hodin;
 *                plná krev → plazma min. 4 týdny;
 *                plazma → plazma (přístrojový odběr) min. 14 dní.
 *   - 2.3 bod 1: plazma nejvýše 25 litrů za 12 měsíců (objem aplikace neeviduje,
 *                proto se tento limit NEPOČÍTÁ – jen se o něm informuje).
 * Shrnutí pro dárce: Společnost pro transfuzní lékařství ČLS JEP
 *   https://www.transfuznispolecnost.cz/darci-krve
 * Pracoviště často používají delší intervaly (např. FN u sv. Anny v Brně:
 *   krev→krev ženy 4 měsíce, muži 3 měsíce; plazma→krev 14 dní)
 *   https://www.fnusa.cz/darci-krve/
 */
(function (global) {
  const RULES = {
    bloodToBloodDays: 56, // 8 týdnů
    bloodToPlasmaDays: 28, // 4 týdny
    plasmaToBloodDays: 2, // 48 hodin
    plasmaToPlasmaDays: 14,
    bloodPer12Months: { muz: 5, zena: 4, neuvedeno: 4 } // neuvedeno = konzervativně 4
  };

  const SOURCES = {
    vyhlaska: {
      label: 'vyhláška č. 143/2008 Sb., příloha č. 3',
      url: 'https://www.zakonyprolidi.cz/cs/2008-143'
    },
    stl: {
      label: 'Společnost pro transfuzní lékařství ČLS JEP',
      url: 'https://www.transfuznispolecnost.cz/darci-krve'
    }
  };

  function parseYmd(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').slice(0, 10));
    if (!m) return null;
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function localToday() {
    const n = new Date();
    const pad = (x) => String(x).padStart(2, '0');
    return n.getFullYear() + '-' + pad(n.getMonth() + 1) + '-' + pad(n.getDate());
  }

  function ymd(d) {
    return d.toISOString().slice(0, 10);
  }

  function addDays(d, n) {
    return new Date(d.getTime() + n * 86400000);
  }

  function addMonths(d, n) {
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + n;
    const day = d.getUTCDate();
    const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return new Date(Date.UTC(y, m, Math.min(day, last)));
  }

  function maxDate(list) {
    return list.filter(Boolean).reduce((a, b) => (a && a >= b ? a : b), null);
  }

  function normSex(s) {
    return s === 'muz' || s === 'zena' ? s : 'neuvedeno';
  }

  /**
   * @param {Array<{type:'Krev'|'Plazma', date:'YYYY-MM-DD'}>} donations
   * @param {{sex?: 'muz'|'zena'|'', today?: string}} opts
   */
  function compute(donations, opts) {
    opts = opts || {};
    const sex = normSex(opts.sex);
    const today = parseYmd(opts.today) || parseYmd(localToday());
    const items = (donations || [])
      .map((d) => ({ type: d.type === 'Plazma' ? 'Plazma' : 'Krev', date: parseYmd(d.date) }))
      .filter((d) => d.date)
      .sort((a, b) => b.date - a.date);

    const blood = items.filter((d) => d.type === 'Krev');
    const plasma = items.filter((d) => d.type === 'Plazma');
    const lastBlood = blood[0] ? blood[0].date : null;
    const lastPlasma = plasma[0] ? plasma[0].date : null;

    if (!items.length) {
      return { hasData: false, sex, rules: RULES, sources: SOURCES };
    }

    // —— Plná krev ——
    const limit = RULES.bloodPer12Months[sex];
    const bloodReasons = [];
    const cBB = lastBlood ? addDays(lastBlood, RULES.bloodToBloodDays) : null;
    const cPB = lastPlasma ? addDays(lastPlasma, RULES.plasmaToBloodDays) : null;
    if (cBB) bloodReasons.push({ date: cBB, text: '8 týdnů od posledního odběru krve' });
    if (cPB) bloodReasons.push({ date: cPB, text: '48 hodin od posledního odběru plazmy' });

    // Roční limit: v libovolných 12 měsících nejvýše `limit` odběrů plné krve.
    // Pokud je posledních `limit` odběrů v posledních 12 měsících, další je možný
    // až 12 měsíců po nejstarším z nich.
    let cLimit = null;
    const bloodLast12 = blood.filter((d) => d.date > addMonths(today, -12)).length;
    if (blood.length >= limit) {
      const nth = blood[limit - 1].date;
      cLimit = addMonths(nth, 12);
      bloodReasons.push({
        date: cLimit,
        text: 'limit ' + limit + ' odběrů krve za 12 měsíců' + (sex === 'neuvedeno' ? ' (obecná, konzervativní varianta)' : '')
      });
    }
    const bloodDate = maxDate(bloodReasons.map((r) => r.date));
    const bloodMain = bloodReasons.find((r) => r.date.getTime() === bloodDate.getTime());

    // —— Plazma ——
    const plasmaReasons = [];
    const cPP = lastPlasma ? addDays(lastPlasma, RULES.plasmaToPlasmaDays) : null;
    const cBP = lastBlood ? addDays(lastBlood, RULES.bloodToPlasmaDays) : null;
    if (cPP) plasmaReasons.push({ date: cPP, text: '14 dní od posledního odběru plazmy' });
    if (cBP) plasmaReasons.push({ date: cBP, text: '4 týdny od posledního odběru krve' });
    const plasmaDate = maxDate(plasmaReasons.map((r) => r.date));
    const plasmaMain = plasmaReasons.find((r) => r.date.getTime() === plasmaDate.getTime());

    return {
      hasData: true,
      sex,
      today: ymd(today),
      lastBlood: lastBlood ? ymd(lastBlood) : null,
      lastPlasma: lastPlasma ? ymd(lastPlasma) : null,
      bloodLast12,
      bloodLimit: limit,
      blood: {
        date: ymd(bloodDate),
        reason: bloodMain.text,
        reachedLimit: !!cLimit && cLimit.getTime() === bloodDate.getTime() && (!cBB || cLimit > cBB),
        isNowOrPast: bloodDate <= today,
        daysLeft: Math.max(0, Math.round((bloodDate - today) / 86400000))
      },
      plasma: {
        date: ymd(plasmaDate),
        reason: plasmaMain.text,
        isNowOrPast: plasmaDate <= today,
        daysLeft: Math.max(0, Math.round((plasmaDate - today) / 86400000))
      },
      rules: RULES,
      sources: SOURCES
    };
  }

  global.KapkaEligibility = { compute, RULES, SOURCES, _addMonths: addMonths };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.KapkaEligibility;
})(typeof window !== 'undefined' ? window : globalThis);
