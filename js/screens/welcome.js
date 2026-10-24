(function () {
  KapkaRouter.register('/welcome', async function ({ outlet }) {
    outlet.innerHTML = `
      <section class="screen welcome-screen" aria-labelledby="welcome-title">
        <div class="welcome-hero">
          <img src="icons/icon.svg" alt="" width="88" height="88" class="welcome-logo" />
          <h1 id="welcome-title">Kapka života</h1>
          <p class="lead">Váš osobní přehled dárcovství krve a plazmy. Data zůstávají ve Vašem zařízení — bez povinné registrace.</p>
        </div>
        <div class="stack gap-md">
          <button type="button" class="btn btn-primary btn-lg" data-action="donor">Jsem dárce</button>
          <button type="button" class="btn btn-secondary btn-lg" data-action="become">Chci se stát dárcem</button>
          <button type="button" class="btn btn-ghost btn-lg" data-action="more">Chci se dozvědět více</button>
        </div>
        <p class="fineprint">Nejde o oficiální aplikaci nemocnic ani Českého červeného kříže. Zdravotní způsobilost vždy ověřte u transfuzního pracoviště.</p>
      </section>`;

    outlet.querySelector('[data-action="donor"]').onclick = () => {
      KapkaStore.setWelcomeDone(true);
      KapkaRouter.navigate('/home');
    };
    outlet.querySelector('[data-action="become"]').onclick = () => {
      KapkaStore.setWelcomeDone(true);
      KapkaRouter.navigate('/newdonor');
    };
    outlet.querySelector('[data-action="more"]').onclick = () => {
      KapkaStore.setWelcomeDone(true);
      KapkaRouter.navigate('/newdonor');
    };
  });
})();
