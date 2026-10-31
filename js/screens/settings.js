(function () {
  KapkaRouter.register('/settings', async function ({ outlet }) {
    const state = KapkaStore.getState();
    outlet.innerHTML = `
      <section class="screen" aria-labelledby="set-title">
        <header class="screen-header">
          <h1 id="set-title">Více</h1>
          <p class="sub">Instalace, sdílení, nastavení a informace o aplikaci</p>
        </header>

        <div class="card stack gap-sm share-card" id="install-card">
          <h2 class="card-title">Instalace a sdílení</h2>
          <p data-install-hint>Ukážeme Vám, jak Kapku života přidat na plochu.</p>
          <p class="ok-note" data-install-status hidden>Aplikace je nainstalovaná.</p>
          <button type="button" class="btn btn-primary" id="settings-install" data-install-btn>Nainstalovat aplikaci</button>
          <button type="button" class="btn btn-secondary" data-share-app>Sdílet Kapku života</button>
          <button type="button" class="btn btn-ghost" data-copy-link>Zkopírovat odkaz</button>
          <button type="button" class="btn btn-ghost" data-go="settings/share">QR kód a leták</button>
          <p class="muted">Sdílí se jen veřejná adresa aplikace, nikdy Vaše záznamy.</p>
        </div>

        <div class="card stack gap-sm">
          <h2 class="card-title">Informace</h2>
          <button type="button" class="btn btn-secondary" data-go="settings/guide">Jak Kapka života funguje</button>
          <button type="button" class="btn btn-secondary" data-go="settings/about">O aplikaci</button>
          <p class="muted">Autor projektu: Vladimír Holub · verze ${(window.KapkaVersion && KapkaVersion.APP_VERSION) || ''}</p>
        </div>

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

        <div class="card">
          <h2 class="card-title">Orientační termíny (nepovinné)</h2>
          <fieldset class="fieldset">
            <legend>Roční limit odběrů plné krve podle vyhlášky č. 143/2008 Sb.</legend>
            <label class="radio-row"><input type="radio" name="donorSex" value="" ${!state.donorSex ? 'checked' : ''} /> Neuvádět (obecně 4× za 12 měsíců)</label>
            <label class="radio-row"><input type="radio" name="donorSex" value="zena" ${state.donorSex === 'zena' ? 'checked' : ''} /> Žena (nejvýše 4× za 12 měsíců)</label>
            <label class="radio-row"><input type="radio" name="donorSex" value="muz" ${state.donorSex === 'muz' ? 'checked' : ''} /> Muž (nejvýše 5× za 12 měsíců)</label>
          </fieldset>
          <p class="muted">Údaj je nepovinný, zůstává jen ve Vašem zařízení a slouží pouze k orientačnímu výpočtu na Domů. Skutečný termín určuje odběrové centrum.</p>
        </div>

        <div class="card stack gap-sm">
          <h2 class="card-title">Data a soukromí</h2>
          <p>Všechny Vaše záznamy (deník, připomínky) zůstávají v tomto zařízení (localStorage, klíč kapka-zivota-v1). Aplikace neodesílá data na server a nevyžaduje registraci.</p>
          <p class="muted">Webová PWA, Android APK a Windows aplikace mají každé vlastní úložiště — přenos jen přes Export / obnovu.</p>
          <button type="button" class="btn btn-secondary" data-go="backup">Export a obnova dat</button>
          <button type="button" class="btn btn-ghost" data-go="reminders">Připomínky a oznámení</button>
          <button type="button" class="btn btn-ghost" data-go="newdonor">Informace pro nové dárce</button>
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
    outlet.querySelectorAll('[name="donorSex"]').forEach((r) => {
      r.onchange = () => KapkaStore.setDonorSex(r.value);
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
