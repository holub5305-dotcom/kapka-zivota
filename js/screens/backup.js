(function () {
  function downloadJson(obj, filename) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 400);
  }

  KapkaRouter.register('/backup', async function ({ outlet }) {
    const state = KapkaStore.getState();
    outlet.innerHTML = `
      <section class="screen" aria-labelledby="bk-title">
        <header class="screen-header">
          <button type="button" class="btn btn-ghost btn-sm" data-back>← Více</button>
          <h1 id="bk-title">Export a obnova</h1>
          <p class="sub">Bezpečná záloha deníku a připomínek</p>
        </header>

        <div class="card">
          <h2 class="card-title">Přenos mezi verzemi</h2>
          <p>Data v prohlížeči (Chrome PWA), v aplikaci pro Android a ve Windows aplikaci jsou <strong>oddělená úložiště</strong>. Klíč zůstává <code>kapka-zivota-v1</code>, ale automaticky se mezi sebou nesdílejí.</p>
          <ol class="bullets">
            <li>V původní verzi klepněte na <strong>Stáhnout zálohu</strong> a uložte soubor JSON.</li>
            <li>V nové aplikaci otevřete Více → Export a obnova a soubor načtěte.</li>
            <li>Zvolte <strong>Sloučit</strong> (bezpečnější) nebo <strong>Nahradit</strong> (s dvojím potvrzením).</li>
          </ol>
          <p class="muted">Před větším přenosem si vždy nechte export jako zálohu.</p>
        </div>

        <div class="card">
          <h2 class="card-title">Export</h2>
          <p>Stáhne soubor JSON s ${state.donations.length} odběry a ${state.reminders.length} připomínkami. Soubor uložte na bezpečné místo (např. Disk, e-mail sobě).</p>
          <button type="button" class="btn btn-primary" id="do-export">Stáhnout zálohu</button>
        </div>

        <div class="card">
          <h2 class="card-title">Obnova ze souboru</h2>
          <label class="field"><span>Vyberte soubor .json</span>
            <input type="file" id="import-file" accept="application/json,.json" />
          </label>
          <div id="preview" class="preview" hidden></div>
          <div class="stack gap-sm" id="import-actions" hidden>
            <button type="button" class="btn btn-secondary" id="do-merge">Sloučit (bez duplicit podle id)</button>
            <button type="button" class="btn btn-danger" id="do-replace">Nahradit všechna data…</button>
          </div>
          <p class="error" id="import-err" hidden></p>
          <p class="ok" id="import-ok" hidden></p>
        </div>

        <div class="modal" id="repl-modal" hidden>
          <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="rp-title">
            <h2 id="rp-title">Nahradit všechna data?</h2>
            <p>Současný deník a připomínky budou přepsány obsahem souboru. Tuto akci nelze snadno vrátit.</p>
            <label class="check-row"><input type="checkbox" id="rp1" /> Rozumím, že současná data budou nahrazena</label>
            <label class="check-row"><input type="checkbox" id="rp2" /> Opravdu chci nahradit všechna data</label>
            <div class="row gap-sm">
              <button type="button" class="btn btn-ghost" id="rp-cancel">Zrušit</button>
              <button type="button" class="btn btn-danger" id="rp-go" disabled>Nahradit</button>
            </div>
          </div>
        </div>
      </section>`;

    let parsed = null;
    outlet.querySelector('[data-back]').onclick = () => KapkaRouter.navigate('/settings');
    outlet.querySelector('#do-export').onclick = () => {
      const payload = KapkaStore.exportPayload();
      const stamp = new Date().toISOString().slice(0, 10);
      downloadJson(payload, 'kapka-zivota-zaloha-' + stamp + '.json');
    };

    const preview = outlet.querySelector('#preview');
    const actions = outlet.querySelector('#import-actions');
    const err = outlet.querySelector('#import-err');
    const ok = outlet.querySelector('#import-ok');

    outlet.querySelector('#import-file').onchange = async (e) => {
      err.hidden = true;
      ok.hidden = true;
      parsed = null;
      actions.hidden = true;
      preview.hidden = true;
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const obj = JSON.parse(text);
        parsed = KapkaStore.parseImport(obj);
        const existingDon = new Set(KapkaStore.getState().donations.map((d) => d.id));
        const existingRem = new Set(KapkaStore.getState().reminders.map((r) => r.id));
        const newDon = parsed.donations.filter((d) => !existingDon.has(d.id)).length;
        const newRem = parsed.reminders.filter((r) => !existingRem.has(r.id)).length;
        preview.hidden = false;
        preview.innerHTML = `
          <p><strong>Náhled souboru</strong></p>
          <ul class="bullets">
            <li>Odběry v souboru: ${parsed.donations.length} (nových při sloučení: ${newDon})</li>
            <li>Připomínky v souboru: ${parsed.reminders.length} (nových při sloučení: ${newRem})</li>
          </ul>
          <p class="muted">Sloučení přidá jen záznamy s novým id. Nahrazení přepíše vše.</p>`;
        actions.hidden = false;
      } catch (ex) {
        err.hidden = false;
        err.textContent = ex.message || 'Soubor nelze načíst';
      }
    };

    outlet.querySelector('#do-merge').onclick = () => {
      if (!parsed) return;
      KapkaStore.mergeImport(parsed);
      ok.hidden = false;
      ok.textContent = 'Data byla sloučena.';
      KapkaStore.applyThemeToDocument();
    };

    const modal = outlet.querySelector('#repl-modal');
    const rp1 = outlet.querySelector('#rp1');
    const rp2 = outlet.querySelector('#rp2');
    const rpGo = outlet.querySelector('#rp-go');
    function syncRp() {
      rpGo.disabled = !(rp1.checked && rp2.checked);
    }
    outlet.querySelector('#do-replace').onclick = () => {
      if (!parsed) return;
      rp1.checked = false;
      rp2.checked = false;
      syncRp();
      modal.hidden = false;
    };
    rp1.onchange = syncRp;
    rp2.onchange = syncRp;
    outlet.querySelector('#rp-cancel').onclick = () => {
      modal.hidden = true;
    };
    rpGo.onclick = () => {
      if (!parsed || rpGo.disabled) return;
      KapkaStore.replaceImport(parsed);
      modal.hidden = true;
      ok.hidden = false;
      ok.textContent = 'Data byla nahrazena obsahem souboru.';
      KapkaStore.applyThemeToDocument();
    };
  });
})();
