(function () {
  let STATIONS = null;

  async function loadStations() {
    if (STATIONS) return STATIONS;
    const res = await fetch('data/stations.json', { cache: 'force-cache' });
    if (!res.ok) throw new Error('Nepodařilo se načíst seznam stanic');
    STATIONS = await res.json();
    return STATIONS;
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function telHref(phone) {
    return 'tel:' + String(phone || '').replace(/\s+/g, '');
  }

  KapkaRouter.register('/stations', async function ({ outlet, params }) {
    let stations;
    try {
      stations = await loadStations();
    } catch (e) {
      outlet.innerHTML = `<section class="screen"><p class="error">${escapeHtml(e.message)}</p></section>`;
      return;
    }

    const q = (params.q || '').trim().toLowerCase();
    const kraj = params.kraj || '';
    const city = params.city || '';
    const typ = params.typ || '';
    const kind = params.kind || '';

    const kraje = [...new Set(stations.map((s) => s.kraj))].sort((a, b) => a.localeCompare(b, 'cs'));
    let cities = [...new Set(stations.filter((s) => !kraj || s.kraj === kraj).map((s) => s.city))].sort((a, b) =>
      a.localeCompare(b, 'cs')
    );

    const filtered = stations.filter((s) => {
      if (kraj && s.kraj !== kraj) return false;
      if (city && s.city !== city) return false;
      if (kind && s.kind !== kind) return false;
      if (typ && !(s.types || []).includes(typ)) return false;
      if (q) {
        const hay = [s.name, s.organization, s.city, s.address, s.kraj, (s.types || []).join(' '), s.kind]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    outlet.innerHTML = `
      <section class="screen" aria-labelledby="st-title">
        <header class="screen-header">
          <h1 id="st-title">Transfuzní stanice</h1>
          <p class="sub">${stations.length} pracovišť v ČR · zobrazeno ${filtered.length}</p>
        </header>

        <form class="filters stack gap-sm" id="st-filters">
          <label class="field"><span>Hledat</span>
            <input type="search" name="q" value="${escapeHtml(params.q || '')}" placeholder="Název, město, adresa…" />
          </label>
          <div class="grid-2">
            <label class="field"><span>Kraj</span>
              <select name="kraj">
                <option value="">Všechny kraje</option>
                ${kraje.map((k) => `<option value="${escapeHtml(k)}" ${k === kraj ? 'selected' : ''}>${escapeHtml(k)}</option>`).join('')}
              </select>
            </label>
            <label class="field"><span>Město</span>
              <select name="city">
                <option value="">Všechna města</option>
                ${cities.map((c) => `<option value="${escapeHtml(c)}" ${c === city ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}
              </select>
            </label>
            <label class="field"><span>Typ odběru</span>
              <select name="typ">
                <option value="">Krev i plazma</option>
                <option value="Krev" ${typ === 'Krev' ? 'selected' : ''}>Krev</option>
                <option value="Plazma" ${typ === 'Plazma' ? 'selected' : ''}>Plazma</option>
              </select>
            </label>
            <label class="field"><span>Druh místa</span>
              <select name="kind">
                <option value="">Všechna</option>
                <option value="Nemocniční" ${kind === 'Nemocniční' ? 'selected' : ''}>Nemocniční</option>
                <option value="Plazma centrum" ${kind === 'Plazma centrum' ? 'selected' : ''}>Plazma centrum</option>
              </select>
            </label>
          </div>
          <div class="row gap-sm">
            <button type="submit" class="btn btn-primary">Filtrovat</button>
            <button type="button" class="btn btn-ghost" id="st-reset">Vymazat filtry</button>
          </div>
        </form>

        <div class="card-list" id="st-list">
          ${
            filtered.length
              ? filtered
                  .map((s) => {
                    const hasWeb = !!(s.web && String(s.web).trim());
                    const types = (s.types || []).join(', ');
                    return `
              <article class="station-card">
                <div class="station-head">
                  <h2>${escapeHtml(s.name)}</h2>
                  <div class="badge-row">
                    <span class="badge">${escapeHtml(s.kind)}</span>
                    <span class="badge badge-${types.includes('Plazma') && !types.includes('Krev') ? 'plasma' : 'blood'}">${escapeHtml(types)}</span>
                  </div>
                </div>
                <p class="muted">${escapeHtml(s.organization || '')}</p>
                <p><strong>${escapeHtml(s.city)}</strong> · ${escapeHtml(s.kraj)}<br>${escapeHtml(s.address)}</p>
                <p class="contacts">
                  ${s.phone ? `<a class="link" href="${telHref(s.phone)}">${escapeHtml(s.phone)}</a>` : ''}
                  ${s.email ? `<a class="link" href="mailto:${escapeHtml(s.email)}">${escapeHtml(s.email)}</a>` : ''}
                </p>
                <p>
                  ${
                    hasWeb
                      ? `<a class="link" href="${escapeHtml(s.web)}" target="_blank" rel="noopener noreferrer">Oficiální web</a>`
                      : `<span class="unverified">Web ověřte na stránkách pracoviště <em>(neověřeno v datech aplikace)</em></span>`
                  }
                </p>
                <p><strong>Objednání:</strong> ${escapeHtml(s.booking || 'Kontaktujte pracoviště')}</p>
                <p class="source-line">Zdroj: ${escapeHtml(s.source || '—')}</p>
                <div class="row gap-sm wrap">
                  ${s.phone ? `<a class="btn btn-secondary btn-sm" href="${telHref(s.phone)}">Zavolat</a>` : ''}
                  ${s.email ? `<a class="btn btn-ghost btn-sm" href="mailto:${escapeHtml(s.email)}">E-mail</a>` : ''}
                  <button type="button" class="btn btn-primary btn-sm" data-remind="${escapeHtml(s.id)}" data-name="${escapeHtml(s.name)}">Připomenout termín</button>
                </div>
              </article>`;
                  })
                  .join('')
              : `<div class="empty"><p>Žádné pracoviště neodpovídá filtrům.</p></div>`
          }
        </div>
        <p class="disclaimer">Kontakty vycházejí z oficiálních zdrojů (zejm. STL a weby provozovatelů). Údaje se mohou měnit — před návštěvou vždy ověřte na stránkách pracoviště.</p>
      </section>`;

    const form = outlet.querySelector('#st-filters');
    form.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const next = {};
      for (const [k, v] of fd.entries()) {
        if (String(v).trim()) next[k] = String(v).trim();
      }
      // if kraj changed, drop city mismatch handled by navigate
      KapkaRouter.navigate('/stations', next);
    };
    form.kraj.onchange = () => {
      // clear city when kraj changes
      form.city.value = '';
    };
    outlet.querySelector('#st-reset').onclick = () => KapkaRouter.navigate('/stations');
    outlet.querySelectorAll('[data-remind]').forEach((btn) => {
      btn.onclick = () => {
        KapkaRouter.navigate('/reminders/add', {
          source: 'Ze stanice',
          stationName: btn.getAttribute('data-name') || ''
        });
      };
    });
  });

  window.KapkaStations = { loadStations };
})();
