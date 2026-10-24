(function () {
  function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''));
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  KapkaRouter.register('/home', async function ({ outlet }) {
    const stats = KapkaStore.donationStats();
    const upcoming = KapkaStore.listReminders().filter((r) => new Date(r.datetime) >= new Date(Date.now() - 3600000));
    const next = upcoming[0];

    outlet.innerHTML = `
      <section class="screen" aria-labelledby="home-title">
        <header class="screen-header">
          <h1 id="home-title">Domů</h1>
          <p class="sub">Váš přehled dárcovství</p>
        </header>

        <div class="stats-grid" role="group" aria-label="Statistiky odběrů">
          <div class="stat-card">
            <span class="stat-value">${stats.total}</span>
            <span class="stat-label">Celkem</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${stats.blood}</span>
            <span class="stat-label">Krev</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${stats.plasma}</span>
            <span class="stat-label">Plazma</span>
          </div>
        </div>

        <div class="card">
          <h2 class="card-title">Poslední odběr</h2>
          ${
            stats.last
              ? `<p><strong>${stats.last.type}</strong> · ${fmtDate(stats.last.date)}${
                  stats.last.place ? `<br><span class="muted">${escapeHtml(stats.last.place)}</span>` : ''
                }</p>`
              : `<p class="muted">Zatím nemáte žádný záznam. Přidejte první odběr v deníku.</p>`
          }
          <p class="disclaimer">Aplikace nestanovuje zdravotní způsobilost ani datum dalšího možného odběru. Termíny vždy ověřte u transfuzního pracoviště.</p>
        </div>

        ${
          next
            ? `<div class="card card-accent">
                <h2 class="card-title">Nejbližší připomínka</h2>
                <p><strong>${escapeHtml(next.title)}</strong><br>
                <span class="muted">${fmtDateTime(next.datetime)}</span></p>
                <button type="button" class="btn btn-secondary" data-go="reminders">Otevřít připomínky</button>
              </div>`
            : ''
        }

        <div class="quick-actions">
          <button type="button" class="btn btn-primary" data-go="diary-add">Přidat odběr</button>
          <button type="button" class="btn btn-secondary" data-go="stations">Transfuzní stanice</button>
          <button type="button" class="btn btn-secondary" data-go="reminders">Připomínky</button>
          <button type="button" class="btn btn-ghost" data-go="newdonor">Pro nové dárce</button>
        </div>
      </section>`;

    outlet.querySelectorAll('[data-go]').forEach((btn) => {
      btn.onclick = () => {
        const g = btn.getAttribute('data-go');
        if (g === 'diary-add') KapkaRouter.navigate('/diary/add');
        else if (g === 'stations') KapkaRouter.navigate('/stations');
        else if (g === 'reminders') KapkaRouter.navigate('/reminders');
        else if (g === 'newdonor') KapkaRouter.navigate('/newdonor');
      };
    });
  });

  function fmtDateTime(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('cs-CZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
