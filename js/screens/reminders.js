(function () {
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtDateTime(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('cs-CZ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function notifyLabel(r) {
    if (r.notifyMode === 'hours_2') return '2 hodiny předem';
    if (r.notifyMode === 'custom' && r.customNotifyAt) return 'Vlastní: ' + fmtDateTime(r.customNotifyAt);
    return 'Den předem';
  }

  function toLocalInputValue(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return (
      d.getFullYear() +
      '-' +
      pad(d.getMonth() + 1) +
      '-' +
      pad(d.getDate()) +
      'T' +
      pad(d.getHours()) +
      ':' +
      pad(d.getMinutes())
    );
  }

  function buildIcs(reminder) {
    const start = new Date(reminder.datetime);
    if (Number.isNaN(start.getTime())) throw new Error('Neplatné datum');
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const stamp = new Date();
    function icsDate(d) {
      return (
        d.getUTCFullYear() +
        String(d.getUTCMonth() + 1).padStart(2, '0') +
        String(d.getUTCDate()).padStart(2, '0') +
        'T' +
        String(d.getUTCHours()).padStart(2, '0') +
        String(d.getUTCMinutes()).padStart(2, '0') +
        String(d.getUTCSeconds()).padStart(2, '0') +
        'Z'
      );
    }
    let alarmTrigger = '-P1D';
    if (reminder.notifyMode === 'hours_2') alarmTrigger = '-PT2H';
    else if (reminder.notifyMode === 'custom' && reminder.customNotifyAt) {
      const c = new Date(reminder.customNotifyAt);
      if (!Number.isNaN(c.getTime())) {
        const diffMin = Math.round((start - c) / 60000);
        if (diffMin > 0) alarmTrigger = '-PT' + diffMin + 'M';
      }
    }
    const uid = reminder.id + '@kapka-zivota';
    const summary = (reminder.title || 'Připomínka odběru').replace(/[,;\\]/g, ' ');
    const desc = [
      reminder.stationName ? 'Stanice: ' + reminder.stationName : '',
      reminder.note || '',
      'Zdroj: ' + (reminder.source || 'Vlastní'),
      'Exportováno z aplikace Kapka života'
    ]
      .filter(Boolean)
      .join('\\n')
      .replace(/[,;]/g, ' ');

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Kapka zivota//CS',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:' + uid,
      'DTSTAMP:' + icsDate(stamp),
      'DTSTART:' + icsDate(start),
      'DTEND:' + icsDate(end),
      'SUMMARY:' + summary,
      'DESCRIPTION:' + desc,
      'BEGIN:VALARM',
      'TRIGGER:' + alarmTrigger,
      'ACTION:DISPLAY',
      'DESCRIPTION:' + summary,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }

  function downloadIcs(reminder) {
    const ics = buildIcs(reminder);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'kapka-' + (reminder.id || 'termin') + '.ics';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  }

  async function requestNotifyPermission() {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    try {
      return await Notification.requestPermission();
    } catch (e) {
      return 'denied';
    }
  }

  KapkaRouter.register('/reminders', async function ({ outlet }) {
    const list = KapkaStore.listReminders();

    outlet.innerHTML = `
      <section class="screen" aria-labelledby="rem-title">
        <header class="screen-header row-between">
          <div>
            <h1 id="rem-title">Kalendář a připomínky</h1>
            <p class="sub">Termíny, které zadáte Vy nebo ze stanice</p>
          </div>
          <button type="button" class="btn btn-primary" data-add>Přidat</button>
        </header>

        <p class="notif-hint" id="notif-hint" role="status" hidden></p>

        <div class="card-list">
          ${
            list.length
              ? list
                  .map(
                    (r) => `
            <article class="compact-card">
              <div class="compact-main">
                <span class="badge">${escapeHtml(r.source)}</span>
                <strong>${escapeHtml(r.title)}</strong>
                <span>${fmtDateTime(r.datetime)}</span>
                ${r.stationName ? `<span class="muted">${escapeHtml(r.stationName)}</span>` : ''}
                <span class="muted">Upozornění: ${escapeHtml(notifyLabel(r))}</span>
                ${r.note ? `<span class="note-line">${escapeHtml(r.note)}</span>` : ''}
              </div>
              <div class="compact-actions wrap">
                <button type="button" class="btn btn-ghost btn-sm" data-ics="${r.id}">Export .ics</button>
                <button type="button" class="btn btn-ghost btn-sm" data-edit="${r.id}">Upravit</button>
                <button type="button" class="btn btn-danger-ghost btn-sm" data-del="${r.id}">Smazat</button>
              </div>
            </article>`
                  )
                  .join('')
              : `<div class="empty"><p>Zatím nemáte žádnou připomínku.</p><button type="button" class="btn btn-primary" data-add>Přidat termín</button></div>`
          }
        </div>
        <p class="disclaimer">Aplikace nestanovuje způsobilost ani automatické datum dalšího odběru. Termíny vycházejí z Vašeho zadání nebo z informací pracoviště.</p>
      </section>

      <div class="modal" id="del-modal" hidden>
        <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="rd-title">
          <h2 id="rd-title">Smazat připomínku?</h2>
          <label class="check-row"><input type="checkbox" id="del-confirm" /> Ano, chci připomínku smazat</label>
          <div class="row gap-sm">
            <button type="button" class="btn btn-ghost" data-cancel>Zrušit</button>
            <button type="button" class="btn btn-danger" id="del-go" disabled>Smazat</button>
          </div>
        </div>
      </div>`;

    // Krátké nenápadné upozornění jen tehdy, když oznámení nejsou povolená.
    const hint = outlet.querySelector('#notif-hint');
    function renderNotifHint() {
      if (!hint) return;
      if (!('Notification' in window)) {
        hint.hidden = false;
        hint.textContent = 'Upozornění se zobrazí při otevření aplikace. Termín si můžete uložit i do kalendáře (.ics).';
        return;
      }
      const perm = Notification.permission;
      if (perm === 'granted') {
        hint.hidden = true;
        hint.textContent = '';
        return;
      }
      hint.hidden = false;
      if (perm === 'denied') {
        hint.textContent = 'Oznámení jsou zablokovaná. Povolit je můžete v nastavení prohlížeče nebo aplikace.';
        return;
      }
      hint.innerHTML = '<span>Oznámení nejsou povolená.</span> <button type="button" class="btn btn-ghost btn-xs" id="notif-allow">Povolit</button>';
      hint.querySelector('#notif-allow').onclick = async () => {
        const p = await requestNotifyPermission();
        if (p === 'granted') KapkaApp.scheduleReminderChecks();
        renderNotifHint();
      };
    }
    renderNotifHint();
    try {
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'notifications' }).then((st) => {
          st.onchange = () => {
            if (document.body.contains(hint)) renderNotifHint();
          };
        }).catch(() => {});
      }
    } catch (e) {}

    outlet.querySelectorAll('[data-add]').forEach((b) => (b.onclick = () => KapkaRouter.navigate('/reminders/add')));
    outlet.querySelectorAll('[data-edit]').forEach((b) => {
      b.onclick = () => KapkaRouter.navigate('/reminders/edit/' + b.getAttribute('data-edit'));
    });
    outlet.querySelectorAll('[data-ics]').forEach((b) => {
      b.onclick = () => {
        const r = KapkaStore.getReminder(b.getAttribute('data-ics'));
        if (r) downloadIcs(r);
      };
    });

    let pending = null;
    const modal = outlet.querySelector('#del-modal');
    const chk = outlet.querySelector('#del-confirm');
    const go = outlet.querySelector('#del-go');
    outlet.querySelectorAll('[data-del]').forEach((b) => {
      b.onclick = () => {
        pending = b.getAttribute('data-del');
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
    };
    go.onclick = () => {
      if (!pending || !chk.checked) return;
      KapkaStore.deleteReminder(pending);
      KapkaRouter.render();
    };
  });

  function formScreen(ctx, existing) {
    const { outlet } = ctx;
    const isEdit = !!(existing && existing.id);
    outlet.innerHTML = `
      <section class="screen" aria-labelledby="rf-title">
        <header class="screen-header">
          <button type="button" class="btn btn-ghost btn-sm" data-back>← Zpět</button>
          <h1 id="rf-title">${isEdit ? 'Upravit připomínku' : 'Přidat připomínku'}</h1>
        </header>
        <form class="form stack gap-md" id="rem-form">
          <label class="field"><span>Název</span>
            <input type="text" name="title" maxlength="120" required value="${existing ? escapeHtml(existing.title) : 'Odběr'}" />
          </label>
          <label class="field"><span>Datum a čas</span>
            <input type="datetime-local" name="datetime" required value="${existing ? toLocalInputValue(existing.datetime) : ''}" />
          </label>
          <fieldset class="fieldset">
            <legend>Zdroj termínu</legend>
            <label class="radio-row"><input type="radio" name="source" value="Vlastní" ${!existing || existing.source === 'Vlastní' ? 'checked' : ''} /> Vlastní</label>
            <label class="radio-row"><input type="radio" name="source" value="Ze stanice" ${existing && existing.source === 'Ze stanice' ? 'checked' : ''} /> Ze stanice</label>
          </fieldset>
          <label class="field"><span>Název stanice (volitelné)</span>
            <input type="text" name="stationName" maxlength="160" value="${existing ? escapeHtml(existing.stationName || '') : ''}" placeholder="Např. FN Brno" />
          </label>
          <fieldset class="fieldset">
            <legend>Čas upozornění</legend>
            <label class="radio-row"><input type="radio" name="notifyMode" value="day_before" ${!existing || existing.notifyMode === 'day_before' ? 'checked' : ''} /> Den předem</label>
            <label class="radio-row"><input type="radio" name="notifyMode" value="hours_2" ${existing && existing.notifyMode === 'hours_2' ? 'checked' : ''} /> 2 hodiny předem</label>
            <label class="radio-row"><input type="radio" name="notifyMode" value="custom" ${existing && existing.notifyMode === 'custom' ? 'checked' : ''} /> Vlastní čas</label>
          </fieldset>
          <label class="field" id="custom-wrap" ${existing && existing.notifyMode === 'custom' ? '' : 'hidden'}>
            <span>Vlastní čas upozornění</span>
            <input type="datetime-local" name="customNotifyAt" value="${existing && existing.customNotifyAt ? toLocalInputValue(existing.customNotifyAt) : ''}" />
          </label>
          <label class="field"><span>Poznámka</span>
            <textarea name="note" rows="2" maxlength="400">${existing ? escapeHtml(existing.note || '') : ''}</textarea>
          </label>
          <div class="row gap-sm">
            <button type="button" class="btn btn-ghost" data-back>Zrušit</button>
            <button type="submit" class="btn btn-primary">Uložit</button>
          </div>
          <p class="error" id="form-err" hidden></p>
        </form>
      </section>`;

    const form = outlet.querySelector('#rem-form');
    const customWrap = outlet.querySelector('#custom-wrap');
    form.querySelectorAll('[name="notifyMode"]').forEach((r) => {
      r.onchange = () => {
        customWrap.hidden = form.notifyMode.value !== 'custom';
      };
    });
    outlet.querySelectorAll('[data-back]').forEach((b) => (b.onclick = () => KapkaRouter.navigate('/reminders')));
    form.onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const err = outlet.querySelector('#form-err');
      try {
        const datetime = fd.get('datetime');
        const iso = datetime ? new Date(datetime).toISOString() : '';
        const mode = fd.get('notifyMode');
        let customNotifyAt = '';
        if (mode === 'custom') {
          const c = fd.get('customNotifyAt');
          if (!c) throw new Error('Zadejte vlastní čas upozornění');
          customNotifyAt = new Date(c).toISOString();
        }
        KapkaStore.upsertReminder({
          id: existing && existing.id ? existing.id : undefined,
          title: fd.get('title'),
          datetime: iso,
          source: fd.get('source'),
          stationName: fd.get('stationName'),
          notifyMode: mode,
          customNotifyAt,
          note: fd.get('note'),
          createdAt: existing && existing.id ? existing.createdAt : undefined
        });
        await requestNotifyPermission();
        if (window.KapkaApp) KapkaApp.scheduleReminderChecks();
        KapkaRouter.navigate('/reminders');
      } catch (ex) {
        err.hidden = false;
        err.textContent = ex.message || 'Nepodařilo se uložit';
      }
    };
  }

  KapkaRouter.register('/reminders/add', (ctx) => {
    const seed = {
      title: 'Odběr',
      datetime: '',
      source: ctx.params.source === 'Ze stanice' ? 'Ze stanice' : 'Vlastní',
      stationName: ctx.params.stationName || '',
      notifyMode: 'day_before',
      customNotifyAt: '',
      note: ''
    };
    // use seed as non-persisted existing-like object without id
    formScreen(ctx, seed.id ? seed : Object.assign({ id: null }, seed));
  });
  KapkaRouter.register('/reminders/edit/:id', (ctx) => {
    const existing = KapkaStore.getReminder(ctx.params.id);
    if (!existing) return KapkaRouter.navigate('/reminders');
    formScreen(ctx, existing);
  });

  // helpers for app.js / tests
  window.KapkaReminders = { buildIcs, downloadIcs, requestNotifyPermission, notifyLabel };
})();
