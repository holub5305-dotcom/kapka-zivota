(function () {
  KapkaRouter.register('/settings', async function ({ outlet }) {
    const state = KapkaStore.getState();
    outlet.innerHTML = `
      <section class="screen" aria-labelledby="set-title">
        <header class="screen-header">
          <h1 id="set-title">Nastavení</h1>
        </header>

        <div class="card">
          <h2 class="card-title">Vzhled</h2>
          <fieldset class="fieldset">
            <legend>Režim zobrazení</legend>
            <label class="radio-row"><input type="radio" name="theme" value="system" ${state.theme === 'system' ? 'checked' : ''} /> Podle systému</label>
            <label class="radio-row"><input type="radio" name="theme" value="light" ${state.theme === 'light' ? 'checked' : ''} /> Světlý</label>
            <label class="radio-row"><input type="radio" name="theme" value="dark" ${state.theme === 'dark' ? 'checked' : ''} /> Tmavý</label>
          </fieldset>
          <p class="muted">Volba se uloží jen ve Vašem prohlížeči. Systémový režim respektuje preferenci zařízení.</p>
        </div>

        <div class="card stack gap-sm">
          <h2 class="card-title">Data a soukromí</h2>
          <p>Všechny Vaše záznamy (deník, připomínky) zůstávají v tomto zařízení (localStorage). Aplikace neodesílá data na server a nevyžaduje registraci.</p>
          <button type="button" class="btn btn-secondary" data-go="backup">Export a obnova dat</button>
          <button type="button" class="btn btn-ghost" data-go="reminders">Připomínky a oznámení</button>
          <button type="button" class="btn btn-ghost" data-go="newdonor">Informace pro nové dárce</button>
        </div>

        <div class="card">
          <h2 class="card-title">O aplikaci</h2>
          <p><strong>Kapka života</strong> — osobní pomůcka pro dárce krve a plazmy.</p>
          <ul class="bullets">
            <li>Zdarma, bez povinné registrace</li>
            <li>Čeština, data lokálně ve Vašem zařízení</li>
            <li>Nejde o oficiální aplikaci nemocnic ani Českého červeného kříže</li>
            <li>Nestanovuje zdravotní způsobilost ani automatické termíny odběru</li>
          </ul>
          <p class="muted">Verze úložiště: kapka-zivota-v1</p>
        </div>

        <div class="card">
          <h2 class="card-title">Úvodní obrazovka</h2>
          <p>Znovu zobrazit uvítání (Vaše data zůstanou).</p>
          <button type="button" class="btn btn-ghost" id="reset-welcome">Zobrazit uvítání</button>
        </div>
      </section>`;

    outlet.querySelectorAll('[name="theme"]').forEach((r) => {
      r.onchange = () => {
        KapkaStore.setTheme(r.value);
        KapkaStore.applyThemeToDocument(r.value);
      };
    });
    outlet.querySelectorAll('[data-go]').forEach((b) => {
      b.onclick = () => KapkaRouter.navigate('/' + b.getAttribute('data-go'));
    });
    outlet.querySelector('#reset-welcome').onclick = () => {
      KapkaStore.setWelcomeDone(false);
      KapkaRouter.navigate('/welcome');
    };
  });
})();
