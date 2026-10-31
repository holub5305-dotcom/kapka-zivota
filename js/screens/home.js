(function () {
  /* —— Inline SVG ikony (bez externích zdrojů, fungují offline) —— */
  const ICONS = {
    drop: '<path d="M12 2.7c-.3 0-.6.2-.8.4C9.5 5.3 5 11 5 14.6A7 7 0 0 0 19 14.6C19 11 14.5 5.3 12.8 3.1a1 1 0 0 0-.8-.4Z"/>',
    dropOutline: '<path d="M12 3.2C10.3 5.4 6 11 6 14.6a6 6 0 0 0 12 0C18 11 13.7 5.4 12 3.2Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 15.2a3 3 0 0 0 3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    plus: '<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    book: '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5v-15Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19M9 7.5h6M9 11h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    pin: '<path d="M12 21s-6.5-5.7-6.5-11a6.5 6.5 0 0 1 13 0c0 5.3-6.5 11-6.5 11Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.4" fill="none" stroke="currentColor" stroke-width="2"/>',
    bell: '<path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2h-15l1.5-2Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M10 20.5a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 10h17M8 3v4M16 3v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    info: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v5.5M12 7.6v.3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    prep: '<rect x="5" y="4" width="14" height="17" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 4.2V3.5A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5v.7" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m8.7 12.6 2.2 2.2 4.4-4.6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    share: '<path d="M12 3v12M8 7l4-4 4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 11H5v10h14V11h-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    chevron: '<path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
  };

  function icon(name, cls) {
    return `<svg class="ico ${cls || ''}" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" fill="currentColor">${ICONS[name]}</svg>`;
  }

  function typeIcon(type) {
    return type === 'Plazma' ? icon('dropOutline', 'ico-plasma') : icon('drop', 'ico-blood');
  }

  function parseLocal(iso) {
    return new Date(String(iso).slice(0, 10) + 'T12:00:00');
  }

  function fmtDate(iso, opts) {
    if (!iso) return '—';
    const d = parseLocal(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('cs-CZ', opts || { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function fmtDateTime(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function todayYmd() {
    const n = new Date();
    const p = (x) => String(x).padStart(2, '0');
    return n.getFullYear() + '-' + p(n.getMonth() + 1) + '-' + p(n.getDate());
  }

  function daysBetween(fromYmd, toYmd) {
    return Math.round((parseLocal(toYmd) - parseLocal(fromYmd)) / 86400000);
  }

  function plural(n, one, few, many) {
    if (n === 1) return one;
    if (n >= 2 && n <= 4) return few;
    return many;
  }

  function relativePast(days) {
    if (days < 0) return 'plánováno za ' + -days + ' ' + plural(-days, 'den', 'dny', 'dní');
    if (days === 0) return 'dnes';
    if (days === 1) return 'včera';
    return 'před ' + days + ' ' + plural(days, 'dnem', 'dny', 'dny');
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function motivation(total, thisYear) {
    if (total === 0) return 'Až budete připraveni, první odběr zapíšete jedním klepnutím. Deník Vám pomůže mít přehled.';
    if (thisYear > 0 && total === 1) return 'Děkujeme za Váš první zaznamenaný odběr. Darování krve a plazmy je dobrovolná a cenná pomoc.';
    if (thisYear > 0) return 'Děkujeme, že darujete pravidelně. Nezapomeňte po odběru na odpočinek a dostatek tekutin.';
    return 'Děkujeme za Vaše dosavadní odběry. Až budete chtít, termín si domluvte s odběrovým centrem.';
  }

  function nextRow(kind, info) {
    const isPlasma = kind === 'Plazma';
    const label = isPlasma ? 'Plazma' : 'Krev';
    const when = info.isNowOrPast
      ? '<span class="h-next-date">Už nyní</span><span class="h-next-sub">orientačně podle pravidel</span>'
      : `<span class="h-next-date">${fmtDate(info.date)}</span><span class="h-next-sub">nejdříve, za ${info.daysLeft} ${plural(info.daysLeft, 'den', 'dny', 'dní')}</span>`;
    return `
      <li class="h-next-row ${isPlasma ? 'is-plasma' : 'is-blood'}">
        <span class="h-type-ico">${typeIcon(kind)}</span>
        <div class="h-next-main">
          <span class="h-next-label">${label}</span>
          <span class="h-next-reason">${info.isNowOrPast ? 'obecné minimální intervaly už uplynuly' : 'rozhoduje: ' + escapeHtml(info.reason)}</span>
        </div>
        <div class="h-next-when">${when}</div>
      </li>`;
  }

  /* —— Příprava na odběr: rozbalovací karta s doporučeními a odškrtávacím seznamem —— */
  let prepType = null; // volba Krev/Plazma v rámci relace (výchozí podle posledního záznamu)
  let prepOpen = false;

  function prepTypeWord(t) {
    return t === 'Plazma' ? 'plazma' : 'krev';
  }

  function setupPrep(outlet, defaultType) {
    const P = window.KapkaPrep;
    const btn = outlet.querySelector('#h-prep-toggle');
    const panel = outlet.querySelector('#h-prep-panel');
    const sub = outlet.querySelector('#h-prep-sub');
    const fill = outlet.querySelector('#h-prep-bar-fill');
    if (!btn || !panel) return;
    if (!prepType) prepType = defaultType;

    function updateSummary() {
      const c = P.count(prepType);
      sub.textContent = c.done + ' z ' + c.total + ' připraveno · ' + prepTypeWord(prepType);
      fill.style.width = Math.round((c.done / c.total) * 100) + '%';
      const prog = panel.querySelector('[data-prep-progress]');
      if (prog) prog.textContent = c.done === c.total ? 'Vše připraveno – děkujeme!' : c.done + ' z ' + c.total + ' připraveno';
    }

    function renderPanel() {
      const st = P.load();
      const list = P.CHECKLIST[prepType];
      const tips = P.TIPS[prepType];
      const usedSrc = [];
      tips.forEach((g) => g.src.forEach((k) => usedSrc.indexOf(k) === -1 && usedSrc.push(k)));
      panel.innerHTML = `
        <div class="h-seg" role="group" aria-label="Typ odběru">
          ${['Krev', 'Plazma']
            .map(
              (t) => `<button type="button" class="h-seg-btn ${t === 'Plazma' ? 'is-plasma' : 'is-blood'}" data-prep-type="${t}" aria-pressed="${t === prepType}">${t}</button>`
            )
            .join('')}
        </div>
        <div class="h-prep-grid">
          <section class="h-prep-check" aria-labelledby="h-prep-check-t">
            <h3 id="h-prep-check-t" class="h-prep-sec">Před odběrem si odškrtněte</h3>
            <p class="h-prep-progress" data-prep-progress aria-live="polite"></p>
            <ul class="h-checklist">
              ${list
                .map(
                  (it) => `
                <li><label class="h-check">
                  <input type="checkbox" data-prep-id="${it.id}" ${st.checked[prepType][it.id] ? 'checked' : ''} />
                  <span class="h-check-box" aria-hidden="true"></span>
                  <span class="h-check-t">${escapeHtml(it.t)}</span>
                </label></li>`
                )
                .join('')}
            </ul>
            <button type="button" class="btn btn-ghost btn-sm h-prep-reset" data-prep-reset>Začít znovu</button>
            <p class="h-prep-hint">Odškrtnutí zůstává jen v tomto zařízení, mimo Váš deník.</p>
          </section>
          <section class="h-prep-tips" aria-labelledby="h-prep-tips-t">
            <h3 id="h-prep-tips-t" class="h-prep-sec">Doporučení – ${prepType === 'Plazma' ? 'odběr plazmy' : 'odběr krve'}</h3>
            ${tips
              .map(
                (g) => `
              <div class="h-tip">
                <h4>${escapeHtml(g.h)}</h4>
                <ul>${g.items.map((i) => '<li>' + escapeHtml(i) + '</li>').join('')}</ul>
              </div>`
              )
              .join('')}
          </section>
        </div>
        <p class="h-prep-note">Rozhodují vždy pokyny Vašeho odběrového centra. Doporučení jsou obecná a nenahrazují radu lékaře.</p>
        <div class="h-prep-src">
          <p class="h-prep-src-t">Zdroje</p>
          <ul>${usedSrc
            .map((k) => `<li><a href="${P.SOURCES[k].url}" target="_blank" rel="noopener">${escapeHtml(P.SOURCES[k].label)}</a></li>`)
            .join('')}</ul>
        </div>`;

      panel.querySelectorAll('[data-prep-type]').forEach((b) => {
        b.onclick = () => {
          const t = b.getAttribute('data-prep-type');
          if (t === prepType) return;
          prepType = t;
          renderPanel();
          const nb = panel.querySelector(`[data-prep-type="${t}"]`);
          if (nb) nb.focus();
        };
      });
      panel.querySelectorAll('[data-prep-id]').forEach((cb) => {
        cb.onchange = () => {
          P.toggle(prepType, cb.getAttribute('data-prep-id'), cb.checked);
          updateSummary();
        };
      });
      panel.querySelector('[data-prep-reset]').onclick = () => {
        P.reset(prepType);
        panel.querySelectorAll('[data-prep-id]').forEach((cb) => (cb.checked = false));
        updateSummary();
        const prog = panel.querySelector('[data-prep-progress]');
        if (prog) prog.textContent = 'Seznam je připraven znovu – 0 z ' + P.CHECKLIST[prepType].length;
      };
      updateSummary();
    }

    function setOpen(open) {
      prepOpen = open;
      btn.setAttribute('aria-expanded', String(open));
      outlet.querySelector('#h-prep').classList.toggle('is-open', open);
      panel.hidden = !open;
      if (open) renderPanel();
    }

    btn.onclick = () => setOpen(!prepOpen);
    updateSummary();
    setOpen(prepOpen);
  }

  KapkaRouter.register('/home', async function ({ outlet }) {
    const state = KapkaStore.getState();
    const stats = KapkaStore.donationStats();
    const today = todayYmd();
    const year = today.slice(0, 4);
    const list = KapkaStore.listDonations();
    const thisYear = list.filter((d) => String(d.date).slice(0, 4) === year);
    const yBlood = thisYear.filter((d) => d.type === 'Krev').length;
    const yPlasma = thisYear.filter((d) => d.type === 'Plazma').length;
    const last = stats.last;
    const elig = window.KapkaEligibility
      ? KapkaEligibility.compute(list, { sex: state.donorSex, today })
      : { hasData: false };
    const src = window.KapkaEligibility ? KapkaEligibility.SOURCES : null;

    const upcoming = KapkaStore.listReminders().filter((r) => new Date(r.datetime) >= new Date(Date.now() - 3600000));
    const nextRem = upcoming[0];

    const gd = new Date().toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' });
    const greetingDate = gd.charAt(0).toUpperCase() + gd.slice(1);

    const lastCard = last
      ? `
        <article class="h-card h-last ${last.type === 'Plazma' ? 'is-plasma' : 'is-blood'}" aria-labelledby="h-last-title">
          <header class="h-card-head">
            <h2 id="h-last-title" class="h-card-title">Poslední odběr</h2>
            <span class="badge badge-${last.type === 'Plazma' ? 'plasma' : 'blood'}">${last.type === 'Plazma' ? 'Plazma' : 'Plná krev'}</span>
          </header>
          <div class="h-last-body">
            <span class="h-type-ico h-type-ico-lg">${typeIcon(last.type)}</span>
            <div>
              <p class="h-big">${fmtDate(last.date)}</p>
              <p class="h-meta">${relativePast(daysBetween(last.date, today))}${last.place ? ' · ' + escapeHtml(last.place) : ''}</p>
            </div>
          </div>
          <button type="button" class="h-link" data-go="diary">Zobrazit historii ${icon('chevron', 'ico-sm')}</button>
        </article>`
      : `
        <article class="h-card h-last h-empty" aria-labelledby="h-last-title">
          <header class="h-card-head">
            <h2 id="h-last-title" class="h-card-title">Poslední odběr</h2>
          </header>
          <div class="h-last-body">
            <span class="h-type-ico h-type-ico-lg">${icon('heart', 'ico-blood')}</span>
            <div>
              <p class="h-big h-big-sm">Zatím tu nic není</p>
              <p class="h-meta">Zapište svůj první odběr krve nebo plazmy. Data zůstávají jen ve Vašem zařízení.</p>
            </div>
          </div>
          <button type="button" class="btn btn-primary h-cta" data-go="diary-add">${icon('plus', 'ico-sm')} Přidat první odběr</button>
        </article>`;

    // Stručné, nenápadné upozornění pod orientačním termínem (nahrazuje dřívější velký výstražný panel)
    const srcLinks = src
      ? ` (<a href="${src.vyhlaska.url}" target="_blank" rel="noopener">vyhláška č. 143/2008 Sb.</a>; <a href="${src.stl.url}" target="_blank" rel="noopener">shrnutí STL ČLS JEP</a>)`
      : '';
    const note = `<p class="h-note">Orientačně podle obecných pravidel${srcLinks}, nejde o lékařské potvrzení. Způsobilost určuje odběrové centrum.</p>`;

    let nextBody;
    if (elig.hasData) {
      const sexNote =
        elig.sex === 'neuvedeno'
          ? `Roční limit krve počítáme obecně (konzervativně) jako ${elig.bloodLimit}× za 12 měsíců. <button type="button" class="linkish" data-go="settings">Upřesnit v Nastavení</button> (nepovinné).`
          : `Roční limit krve: ${elig.bloodLimit}× za 12 měsíců (${elig.sex === 'muz' ? 'muži' : 'ženy'}).`;
      nextBody = `
        <ul class="h-next-list">
          ${nextRow('Krev', elig.blood)}
          ${nextRow('Plazma', elig.plasma)}
        </ul>
        ${note}
        <p class="h-meta">Krev za posledních 12 měsíců: <strong>${elig.bloodLast12} z ${elig.bloodLimit}</strong>. ${sexNote}</p>
        <p class="h-meta">Limit plazmy 25 litrů za 12 měsíců aplikace nepočítá (neeviduje objem).</p>
        <button type="button" class="btn btn-secondary h-cta" data-go="reminder-add">${icon('bell', 'ico-sm')} Naplánovat připomínku</button>`;
    } else {
      nextBody = `
        <p class="h-meta">Termín Vám sdělí odběrové centrum. Po prvním záznamu zde uvidíte orientační nejdřívější termín pro krev i plazmu.</p>
        ${note}`;
    }

    const nextCard = `
      <article class="h-card h-next" aria-labelledby="h-next-title">
        <header class="h-card-head">
          <h2 id="h-next-title" class="h-card-title">${icon('calendar', 'ico-sm ico-muted')} Další možný odběr</h2>
          <span class="h-chip">Orientačně</span>
        </header>
        ${nextBody}
      </article>`;

    const prepCard = window.KapkaPrep
      ? `
      <article class="h-card h-prep" id="h-prep">
        <h2 class="h-prep-h">
          <button type="button" class="h-prep-toggle" id="h-prep-toggle" aria-expanded="false" aria-controls="h-prep-panel">
            <span class="h-prep-ico">${icon('prep')}</span>
            <span class="h-prep-text">
              <span class="h-prep-t">Příprava na odběr</span>
              <span class="h-prep-s" id="h-prep-sub"></span>
            </span>
            <span class="h-prep-chev">${icon('chevron', 'ico-sm')}</span>
          </button>
        </h2>
        <div class="h-prep-bar" aria-hidden="true"><span id="h-prep-bar-fill"></span></div>
        <div class="h-prep-panel" id="h-prep-panel" role="region" aria-labelledby="h-prep-toggle" hidden></div>
      </article>`
      : '';

    const actions = [
      { go: 'diary-add', ic: 'plus', t: 'Přidat odběr', s: 'Nový záznam', primary: true },
      { go: 'diary', ic: 'book', t: 'Otevřít deník', s: 'Historie odběrů' },
      { go: 'stations', ic: 'pin', t: 'Najít centrum', s: 'Odběrová místa v ČR' },
      { go: 'reminders', ic: 'bell', t: 'Připomínky', s: nextRem ? 'Nejbližší: ' + fmtDate(nextRem.datetime, { day: 'numeric', month: 'numeric' }) : 'Termíny a kalendář' }
    ];

    const actionsHtml = `
      <nav class="h-actions" aria-label="Rychlé akce">
        ${actions
          .map(
            (a) => `
          <button type="button" class="h-action ${a.primary ? 'is-primary' : ''}" data-go="${a.go}">
            <span class="h-action-ico">${icon(a.ic)}</span>
            <span class="h-action-text"><span class="h-action-t">${a.t}</span><span class="h-action-s">${escapeHtml(a.s)}</span></span>
          </button>`
          )
          .join('')}
      </nav>`;

    const statsCard = `
      <article class="h-card h-stats" aria-labelledby="h-stats-title">
        <header class="h-card-head">
          <h2 id="h-stats-title" class="h-card-title">${icon('heart', 'ico-sm ico-muted')} Váš přehled</h2>
        </header>
        <div class="h-stat-grid" role="group" aria-label="Statistiky odběrů">
          <div class="h-stat is-total"><span class="h-stat-v">${stats.total}</span><span class="h-stat-l">celkem</span></div>
          <div class="h-stat is-blood"><span class="h-stat-v">${stats.blood}</span><span class="h-stat-l">krev</span></div>
          <div class="h-stat is-plasma"><span class="h-stat-v">${stats.plasma}</span><span class="h-stat-l">plazma</span></div>
        </div>
        <p class="h-meta h-year">Letos (${year}): <strong>${thisYear.length}</strong> ${plural(thisYear.length, 'odběr', 'odběry', 'odběrů')} · krev ${yBlood} · plazma ${yPlasma}</p>
        <p class="h-motto">${motivation(stats.total, thisYear.length)}</p>
      </article>`;

    const reminderCard = nextRem
      ? `
        <article class="h-card h-rem" aria-labelledby="h-rem-title">
          <header class="h-card-head">
            <h2 id="h-rem-title" class="h-card-title">${icon('bell', 'ico-sm ico-muted')} Nejbližší připomínka</h2>
          </header>
          <p class="h-rem-title">${escapeHtml(nextRem.title)}</p>
          <p class="h-meta">${fmtDateTime(nextRem.datetime)}${nextRem.stationName ? ' · ' + escapeHtml(nextRem.stationName) : ''}</p>
          <button type="button" class="h-link" data-go="reminders">Otevřít připomínky ${icon('chevron', 'ico-sm')}</button>
        </article>`
      : '';

    const installHidden = !!(window.KapkaApp && KapkaApp.isStandalone && KapkaApp.isStandalone());
    outlet.innerHTML = `
      <section class="screen home" aria-labelledby="home-title">
        <header class="h-hero">
          <div>
            <p class="h-hero-date">${escapeHtml(greetingDate)}</p>
            <h1 id="home-title">Dobrý den</h1>
            <p class="h-hero-sub">Váš přehled dárcovství krve a plazmy</p>
          </div>
          <span class="h-hero-drop" aria-hidden="true">${icon('drop')}</span>
        </header>

        <div class="h-install" role="region" aria-label="Instalace" data-install-panel ${installHidden ? 'hidden' : ''}>
          <div class="h-install-main">
            <span class="h-install-ico" aria-hidden="true">${icon('drop')}</span>
            <div class="h-install-text">
              <p class="h-install-t">Kapka života na Vaší ploše</p>
              <p class="h-install-s" data-install-hint>Ukážeme Vám, jak ji přidat na plochu.</p>
              <p class="h-install-s is-ok" data-install-status hidden>Aplikace je nainstalovaná.</p>
            </div>
          </div>
          <div class="h-install-btns">
            <button type="button" class="btn btn-primary h-install-btn" data-install-btn>Nainstalovat zdarma</button>
            <button type="button" class="btn btn-secondary h-install-share" data-share-app aria-label="Sdílet Kapku života">${icon('share')}<span>Sdílet</span></button>
          </div>
          <button type="button" class="linkish h-install-guide" data-install-guide>Návod krok za krokem</button>
        </div>

        ${actionsHtml}

        <div class="h-grid">
          <div class="h-col">
            ${lastCard}
            ${statsCard}
            ${reminderCard}
          </div>
          <div class="h-col">
            ${nextCard}
          </div>
          ${prepCard}
        </div>

        <p class="h-foot">
          <button type="button" class="linkish" data-go="guide">Jak Kapka života funguje</button>
          · <button type="button" class="linkish" data-go="newdonor">Informace pro nové dárce</button>
          · <button type="button" class="linkish" data-go="share">QR kód a leták</button>
          · <button type="button" class="linkish" data-go="about">O aplikaci</button>
          <br />Zdarma, bez reklam a bez registrace. Data zůstávají ve Vašem zařízení.
        </p>
      </section>`;

    const routes = {
      'diary-add': '/diary/add',
      diary: '/diary',
      stations: '/stations',
      reminders: '/reminders',
      'reminder-add': '/reminders/add',
      newdonor: '/newdonor',
      settings: '/settings',
      guide: '/settings/guide',
      share: '/settings/share',
      about: '/settings/about'
    };
    if (window.KapkaPrep) setupPrep(outlet, last && last.type === 'Plazma' ? 'Plazma' : 'Krev');

    outlet.querySelectorAll('[data-go]').forEach((btn) => {
      btn.onclick = () => {
        const r = routes[btn.getAttribute('data-go')];
        if (r) KapkaRouter.navigate(r);
      };
    });
  });
})();
