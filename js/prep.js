/* Kapka života — Příprava na odběr (karta na Domů)
 * Autor projektu: Vladimír Holub. © 2026 Vladimír Holub. Všechna práva vyhrazena.
 * Doporučení vycházejí z veřejných pokynů českých transfuzních pracovišť a plazmacenter (viz SOURCES).
 * Odškrtnutí se ukládá samostatně pod klíčem kapka-zivota-prep-v1 (NE do kapka-zivota-v1). */
(function () {
  const PREP_KEY = 'kapka-zivota-prep-v1';

  const SOURCES = {
    stl: { label: 'Společnost pro transfuzní lékařství ČLS JEP – Dárci krve', url: 'https://www.transfuznispolecnost.cz/darci-krve' },
    cck: { label: 'Český červený kříž – Postup při odběru krve', url: 'https://www.cervenykriz.eu/postup-pri-odberu-krve' },
    vfn: { label: 'VFN Praha – Informace pro dárce krve', url: 'https://www.vfn.cz/pacienti/kliniky-ustavy/fakultni-transfuzni-oddeleni/informace-pro-darce-krve/' },
    fnusa: { label: 'FN u sv. Anny v Brně – Dárci krve a plazmy', url: 'https://www.fnusa.cz/darci-krve/' },
    fnplzen: { label: 'FN Plzeň, Transfuzní oddělení – Cesta dárce', url: 'https://to.fnplzen.cz/cs/node/1640' },
    fnkv: { label: 'FN Královské Vinohrady – Příprava na odběr', url: 'https://www.fnkv.cz/priprava-na-odber.php' },
    fnhk: { label: 'FN Hradec Králové – Informace pro dárce plazmy (PDF)', url: 'https://www.fnhk.cz/content/files/download/2444/darcovstvi-krevni-plazmy-01072024.pdf' },
    stlp: { label: 'STL ČLS JEP – Poučení dárce krve (PDF)', url: 'https://www.transfuznispolecnost.cz/media/document/0ae6f4203ef5162c808a6b6538449f35.pdf' },
    vfnp: { label: 'VFN Praha – Poučení dárce krve (PDF)', url: 'https://www.vfn.cz/wp-content/uploads/2024/08/FTO-pouceni-darce-krve-cz-v7.pdf' },
    fno: { label: 'FN Ostrava – Příklady jídelníčku před odběrem (PDF)', url: 'https://www.fno.cz/documents/krevni-centrum/jidelnicek-darce.pdf' },
    cara: { label: 'CARA PLASMA – Stravovací režim pro dárce plazmy', url: 'https://www.caraplasma.cz/stravovaci-rezim-pro-darce-krevni-plazmy' },
    europlasma: { label: 'Europlasma – Co jíst a nejíst před odběrem plazmy', url: 'https://www.europlasma.cz/vse-o-odberu/co-jist-pred-odberem.html' }
  };

  /* Doporučení – jen to, co uvádějí zdroje. Kde se centra liší, odkazujeme na pokyny centra. */
  const TIPS = {
    Krev: [
      {
        h: 'Den předem',
        items: [
          'Pijte více než obvykle – centra uvádějí obvykle 2–3 litry nealkoholických tekutin.',
          'Večer jezte lehce a netučně, alkohol vynechte. Jak dlouho předem, se v centrech liší (obvykle 12–24 hodin) – informujte se ve svém centru.',
          'Vyhněte se velké fyzické námaze (např. sportovnímu výkonu) a dobře se vyspěte – mdloby jsou častější u unavených a hladových dárců.'
        ],
        src: ['stl', 'cck', 'fnusa', 'fnkv', 'fnplzen', 'fno', 'vfnp']
      },
      {
        h: 'V den odběru',
        items: [
          'Nechoďte nalačno – ráno si dejte lehkou netučnou snídani (např. rohlík, džem, med, ovoce), bez tučných a mléčných výrobků.',
          'Před odběrem vypijte alespoň 0,5 litru tekutin (voda, minerálka, čaj, džus); pouze černý čaj nebo káva nestačí.',
          'Před odběrem nekuřte – centra uvádějí nejméně 2 až 12 hodin, informujte se ve svém centru.',
          'Samotný odběr trvá asi 5–12 minut, celá návštěva přibližně 1–1,5 hodiny.'
        ],
        src: ['stl', 'vfn', 'fnusa', 'fnkv', 'fnplzen']
      },
      {
        h: 'S sebou',
        items: [
          'Průkaz totožnosti s fotografií (občanský průkaz, pas…).',
          'Průkaz pojištěnce (doklad o zdravotním pojištění platném v ČR).',
          'Legitimaci dárce krve, pokud ji máte.',
          'Zprávu od lékaře, pokud se léčíte v odborné ambulanci nebo jste byli nedávno v nemocnici.'
        ],
        src: ['stl', 'vfn', 'fnusa', 'fnplzen']
      },
      {
        h: 'Zdravotní stav a léky',
        items: [
          'V dotazníku pravdivě uveďte užívané léky, nemoci a další okolnosti. Při nemoci, zranění, oparu nebo užívání antibiotik se odběr obvykle odkládá – o odběru vždy rozhoduje lékař centra.',
          'Pokud krátce po odběru onemocníte infekcí, informujte odběrové centrum.'
        ],
        src: ['cck', 'fnusa', 'vfnp']
      },
      {
        h: 'Po odběru',
        items: [
          'Chvíli si odpočiňte, vstávejte z křesla pomalu, napijte se a občerstvěte.',
          'Místo vpichu řádně stlačte, aby nevznikla modřina.',
          'Pijte dostatek tekutin. Několik hodin po odběru (FN Plzeň uvádí 12 hodin) se vyhněte náročné činnosti – sportu, zvedání těžkých věcí nebo řízení.',
          'Pokud se necítíte dobře, hned to řekněte personálu.'
        ],
        src: ['cck', 'stlp', 'vfnp', 'fnplzen']
      }
    ],
    Plazma: [
      {
        h: 'Den předem',
        items: [
          'Výrazně navyšte pitný režim – nemocnice i plazmacentra uvádějí 2–3 litry tekutin (voda, minerálka, ovocné čaje, džusy). Kávu, černý čaj a energetické nápoje plazmacentra nedoporučují a do příjmu tekutin je nepočítají.',
          'Jezte lehce a netučně: vhodné je libové maso (kuře, krůta), netučná ryba, rýže, těstoviny, brambory, ovoce a zelenina. Nevhodné jsou tučné a smažené pokrmy, uzeniny, sýry, celá vejce a majonéza.',
          'Alkohol vynechte. Jak dlouho předem, se v centrech liší – informujte se ve svém centru.',
          'Dobře se vyspěte – mdloby jsou častější u unavených a hladových dárců.'
        ],
        src: ['fnusa', 'fnhk', 'cara', 'europlasma', 'vfnp']
      },
      {
        h: 'V den odběru',
        items: [
          'Nechoďte nalačno – lehce a netučně se najezte (Europlasma doporučuje asi 1–1,5 hodiny před odběrem).',
          'Pokračujte ve zvýšeném pitném režimu i v den odběru.',
          'Před odběrem nekuřte.',
          'Odběr na přístroji (separátoru) trvá obvykle asi 30–60 minut, celá návštěva déle než u krve.'
        ],
        src: ['fnhk', 'cara', 'europlasma', 'stl', 'fnusa']
      },
      {
        h: 'S sebou',
        items: [
          'Průkaz totožnosti s fotografií, průkaz pojištěnce a legitimaci dárce, pokud ji máte.',
          'Zprávu od lékaře, pokud se léčíte v odborné ambulanci.',
          'Podmínky pro první odběr plazmy se liší (nemocnice obvykle chtějí nejdříve odběr plné krve) – informujte se ve svém centru.'
        ],
        src: ['fnusa', 'fnhk', 'vfn']
      },
      {
        h: 'Zdravotní stav a léky',
        items: [
          'V dotazníku pravdivě uveďte léky, nemoci a další okolnosti – o odběru rozhoduje lékař centra.',
          'Pokud během odběru ucítíte mravenčení rtů nebo prstů či trnutí jazyka, ihned to řekněte personálu.'
        ],
        src: ['stlp', 'vfnp', 'fnusa']
      },
      {
        h: 'Po odběru',
        items: [
          'Doplňte tekutiny a bílkoviny (např. libové maso, ryby, rostlinné bílkoviny).',
          'V den odběru se fyzicky šetřete; místo vpichu nechte krátce kryté (FN Hradec Králové uvádí 12 hodin).',
          'Bezprostředně po odběru se vyhněte alkoholu.'
        ],
        src: ['cara', 'europlasma', 'fnhk']
      }
    ]
  };

  /* Odškrtávací seznam před odběrem (podle typu) */
  const CHECKLIST = {
    Krev: [
      { id: 'drink-day', t: 'Den předem jsem pil/a dostatek tekutin' },
      { id: 'light-dinner', t: 'Večer jsem jedl/a lehce a netučně, bez alkoholu' },
      { id: 'rest', t: 'Jsem odpočatý/á, bez velké námahy předchozí den' },
      { id: 'breakfast', t: 'Ráno jsem lehce a netučně posnídal/a' },
      { id: 'drink-morning', t: 'Před odběrem jsem vypil/a alespoň 0,5 l' },
      { id: 'no-smoke', t: 'Před odběrem nekouřím' },
      { id: 'id-card', t: 'Mám průkaz totožnosti s fotografií' },
      { id: 'insurance', t: 'Mám průkaz pojištěnce (a legitimaci dárce, pokud ji mám)' },
      { id: 'meds', t: 'Vím, jaké léky užívám a co uvést v dotazníku' }
    ],
    Plazma: [
      { id: 'drink-day', t: 'Den předem jsem vypil/a 2–3 l tekutin' },
      { id: 'light-food', t: 'Den předem jsem jedl/a netučně, bez alkoholu' },
      { id: 'rest', t: 'Jsem odpočatý/á a vyspalý/á' },
      { id: 'meal', t: 'Před odběrem jsem se lehce najedl/a' },
      { id: 'drink-morning', t: 'I dnes piji více tekutin' },
      { id: 'no-smoke', t: 'Před odběrem nekouřím' },
      { id: 'id-card', t: 'Mám průkaz totožnosti s fotografií' },
      { id: 'insurance', t: 'Mám průkaz pojištěnce (a legitimaci dárce, pokud ji mám)' },
      { id: 'meds', t: 'Vím, jaké léky užívám a co uvést v dotazníku' }
    ]
  };

  function emptyState() {
    return { version: 1, checked: { Krev: {}, Plazma: {} }, updatedAt: null };
  }

  function load() {
    try {
      const raw = localStorage.getItem(PREP_KEY);
      if (!raw) return emptyState();
      const s = JSON.parse(raw);
      const out = emptyState();
      ['Krev', 'Plazma'].forEach((k) => {
        const c = s && s.checked && s.checked[k];
        if (c && typeof c === 'object') {
          CHECKLIST[k].forEach((it) => {
            if (c[it.id] === true) out.checked[k][it.id] = true;
          });
        }
      });
      out.updatedAt = (s && s.updatedAt) || null;
      return out;
    } catch (e) {
      return emptyState();
    }
  }

  function save(s) {
    try {
      s.updatedAt = new Date().toISOString();
      localStorage.setItem(PREP_KEY, JSON.stringify(s));
    } catch (e) {
      /* úložiště nedostupné – stav zůstane jen v paměti */
    }
  }

  function count(type, s) {
    const st = s || load();
    const total = CHECKLIST[type].length;
    const done = CHECKLIST[type].filter((it) => st.checked[type][it.id]).length;
    return { done, total };
  }

  function reset(type) {
    const s = load();
    s.checked[type] = {};
    save(s);
  }

  function toggle(type, id, on) {
    const s = load();
    if (on) s.checked[type][id] = true;
    else delete s.checked[type][id];
    save(s);
    return s;
  }

  window.KapkaPrep = { PREP_KEY, SOURCES, TIPS, CHECKLIST, load, save, count, reset, toggle };
})();
