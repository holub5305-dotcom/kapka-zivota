(function () {
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtDate(iso) {
    const d = new Date(iso + 'T12:00:00');
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('cs-CZ');
  }

  function filterList(filter) {
    let list = KapkaStore.listDonations();
    if (filter === 'Krev' || filter === 'Plazma') list = list.filter((d) => d.type === filter);
    return list;
  }

  /* v1.2.6: úvodní stav prázdného deníku (žádný záznam) */
  const SVG = {
    book: '<path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v17H7.5A2.5 2.5 0 0 0 5 21.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M5 21.5V4.5M9 7h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/>',
    chart: '<path d="M4 20h16M7 16v-5M12 16V7M17 16v-8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    drop: '<path d="M12 2.5c-3.6 4.6-6.5 8.3-6.5 11.8a6.5 6.5 0 0 0 13 0C18.5 10.8 15.6 7.1 12 2.5z" fill="currentColor"/>'
  };
  function svg(name, cls) {
    return `<svg class="${cls || ''}" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">${SVG[name]}</svg>`;
  }

  function emptyStateHtml() {
    return `
      <div class="diary-empty" role="region" aria-labelledby="diary-empty-title">
        <div class="de-intro">
          <span class="de-ico">${svg('drop')}</span>
          <div>
            <h2 id="diary-empty-title" class="de-title">Začněte svůj dárcovský deník</h2>
            <p class="de-lead">Zapisujte si odběry krve a plazmy na jednom místě. Uvidíte přehled své historie, počty odběrů a orientační termín dalšího odběru.</p>
            <div class="de-actions">
              <button type="button" class="btn btn-primary btn-lg" data-add>Přidat první odběr</button>
            </div>
          </div>
        </div>
        <ul class="de-points">
          <li><span class="de-pico">${svg('book')}</span><span><strong>Co se zapisuje</strong>Typ odběru (krev nebo plazma), datum, místo a volitelná poznámka.</span></li>
          <li><span class="de-pico">${svg('lock')}</span><span><strong>Jen ve Vašem zařízení</strong>Záznamy se nikam neodesílají. Zálohu si můžete uložit v části Více.</span></li>
          <li><span class="de-pico">${svg('chart')}</span><span><strong>Přehled na Domů</strong>Počty odběrů a orientační termín dalšího odběru. O odběru vždy rozhoduje lékař centra.</span></li>
        </ul>
      </div>`;
  }

  KapkaRouter.register('/diary', async function ({ outlet, params }) {
    const filter = params.filter || 'Vše';
    const list = filterList(filter);
    const stats = KapkaStore.donationStats();
    const noRecords = stats.total === 0;

    outlet.innerHTML = `
      <section class="screen${noRecords ? ' diary-is-empty' : ''}" aria-labelledby="diary-title">
        <header class="screen-header row-between">
          <div>
            <h1 id="diary-title">Dárcovský deník</h1>
            <p class="sub">${noRecords ? 'Váš osobní přehled odběrů krve a plazmy' : `${stats.total} záznamů · ${stats.blood} krev · ${stats.plasma} plazma`}</p>
          </div>
          ${noRecords ? '' : '<button type="button" class="btn btn-primary" data-add>Přidat</button>'}
        </header>

        ${noRecords ? emptyStateHtml() : `
        <div class="seg" role="tablist" aria-label="Filtr typu odběru">
          ${['Vše', 'Krev', 'Plazma']
            .map(
              (f) =>
                `<button type="button" role="tab" class="seg-btn ${filter === f ? 'is-active' : ''}" data-filter="${f}" aria-selected="${filter === f}">${f}</button>`
            )
            .join('')}
        </div>

        <div class="card-list" id="diary-list">
          ${
            list.length
              ? list
                  .map(
                    (d) => `
            <article class="compact-card" data-id="${d.id}">
              <div class="compact-main">
                <span class="badge badge-${d.type === 'Plazma' ? 'plasma' : 'blood'}">${d.type}</span>
                <strong>${fmtDate(d.date)}</strong>
                ${d.place ? `<span class="muted">${escapeHtml(d.place)}</span>` : ''}
                ${d.note ? `<span class="note-line">${escapeHtml(d.note)}</span>` : ''}
              </div>
              <div class="compact-actions">
                <button type="button" class="btn btn-ghost btn-sm" data-edit="${d.id}">Upravit</button>
                <button type="button" class="btn btn-danger-ghost btn-sm" data-del="${d.id}">Smazat</button>
              </div>
            </article>`
                  )
                  .join('')
              : `<div class="empty"><p>Žádné odběry v tomto filtru.</p><button type="button" class="btn btn-primary" data-add>Přidat odběr</button></div>`
          }
        </div>`}
      </section>

      <div class="modal" id="del-modal" hidden>
        <div class="modal-card" role="dialog" aria-labelledby="del-title" aria-modal="true">
          <h2 id="del-title">Smazat odběr?</h2>
          <p>Tuto akci nelze vrátit zpět. Záznam zmizí z deníku i ze statistik na Domů.</p>
          <label class="check-row"><input type="checkbox" id="del-confirm" /> Ano, chci záznam trvale smazat</label>
          <div class="row gap-sm">
            <button type="button" class="btn btn-ghost" data-cancel>Zrušit</button>
            <button type="button" class="btn btn-danger" id="del-go" disabled>Smazat</button>
          </div>
        </div>
      </div>`;

    outlet.querySelectorAll('[data-filter]').forEach((btn) => {
      btn.onclick = () => KapkaRouter.navigate('/diary', { filter: btn.getAttribute('data-filter') });
    });
    outlet.querySelectorAll('[data-add]').forEach((b) => (b.onclick = () => KapkaRouter.navigate('/diary/add')));
    outlet.querySelectorAll('[data-edit]').forEach((b) => {
      b.onclick = () => KapkaRouter.navigate('/diary/edit/' + b.getAttribute('data-edit'));
    });

    let pendingDel = null;
    const modal = outlet.querySelector('#del-modal');
    const chk = outlet.querySelector('#del-confirm');
    const go = outlet.querySelector('#del-go');
    outlet.querySelectorAll('[data-del]').forEach((b) => {
      b.onclick = () => {
        pendingDel = b.getAttribute('data-del');
        chk.checked = false;
        go.disabled = true;
        modal.hidden = false;
      };
    });
    chk.onchange = () => {
      go.disabled = !chk.checked;
    };
    outlet.querySelector('[data-cancel]').onclick = () => {
      modal.hidden = true;
      pendingDel = null;
    };
    go.onclick = () => {
      if (!pendingDel || !chk.checked) return;
      KapkaStore.deleteDonation(pendingDel);
      modal.hidden = true;
      KapkaRouter.render();
    };
  });

  function formScreen({ outlet, params, existing }) {
    const isEdit = !!existing;
    outlet.innerHTML = `
      <section class="screen" aria-labelledby="form-title">
        <header class="screen-header">
          <button type="button" class="btn btn-ghost btn-sm" data-back>← Zpět</button>
          <h1 id="form-title">${isEdit ? 'Upravit odběr' : 'Přidat odběr'}</h1>
        </header>
        <form class="form stack gap-md" id="don-form" novalidate>
          <fieldset class="fieldset">
            <legend>Typ odběru</legend>
            <label class="radio-row"><input type="radio" name="type" value="Krev" ${!existing || existing.type === 'Krev' ? 'checked' : ''} /> Krev</label>
            <label class="radio-row"><input type="radio" name="type" value="Plazma" ${existing && existing.type === 'Plazma' ? 'checked' : ''} /> Plazma</label>
          </fieldset>
          <label class="field">
            <span>Datum</span>
            <input type="date" name="date" required value="${existing ? existing.date : ''}" />
          </label>
          <label class="field">
            <span>Místo (volitelné)</span>
            <input type="text" name="place" maxlength="120" placeholder="Např. FN Motol" value="${existing ? escapeHtml(existing.place) : ''}" />
          </label>
          <label class="field">
            <span>Poznámka (volitelné)</span>
            <textarea name="note" rows="3" maxlength="500" placeholder="Volitelná poznámka">${existing ? escapeHtml(existing.note) : ''}</textarea>
          </label>
          <p class="disclaimer">Záznam slouží jen jako Váš osobní deník. Neověřuje způsobilost k dalšímu odběru.</p>
          <div class="row gap-sm">
            <button type="button" class="btn btn-ghost" data-back>Zrušit</button>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Uložit' : 'Přidat'}</button>
          </div>
          <p class="error" id="form-err" hidden></p>
        </form>
      </section>`;

    outlet.querySelectorAll('[data-back]').forEach((b) => (b.onclick = () => KapkaRouter.navigate('/diary')));
    outlet.querySelector('#don-form').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const err = outlet.querySelector('#form-err');
      try {
        KapkaStore.upsertDonation({
          id: existing ? existing.id : undefined,
          type: fd.get('type'),
          date: fd.get('date'),
          place: fd.get('place'),
          note: fd.get('note'),
          createdAt: existing ? existing.createdAt : undefined
        });
        KapkaRouter.navigate('/diary');
      } catch (ex) {
        err.hidden = false;
        err.textContent = ex.message || 'Nepodařilo se uložit';
      }
    };
  }

  KapkaRouter.register('/diary/add', async function (ctx) {
    formScreen({ ...ctx, existing: null });
  });

  KapkaRouter.register('/diary/edit/:id', async function (ctx) {
    const existing = KapkaStore.getDonation(ctx.params.id);
    if (!existing) {
      KapkaRouter.navigate('/diary');
      return;
    }
    formScreen({ ...ctx, existing });
  });
})();
