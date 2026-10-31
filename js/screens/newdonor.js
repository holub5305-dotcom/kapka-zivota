(function () {
  KapkaRouter.register('/newdonor', async function ({ outlet }) {
    outlet.innerHTML = `
      <section class="screen prose" aria-labelledby="nd-title">
        <header class="screen-header">
          <h1 id="nd-title">Informace pro nové dárce</h1>
          <p class="sub">Orientační přehled — vždy ověřte u konkrétní stanice nebo lékaře</p>
        </header>

        <article class="card">
          <h2>Před odběrem (příprava)</h2>
          <ul class="bullets">
            <li>Dobře se vyspěte a přijďte odpočatí.</li>
            <li>Pijte dostatek nealkoholických tekutin; před odběrem se obvykle doporučuje lehké jídlo.</li>
            <li>Vezměte si doklad totožnosti a kartičku pojištěnce (pokud ji máte).</li>
            <li>Uveďte léky, které užíváte, a aktuální zdravotní potíže personálu.</li>
          </ul>
          <p class="disclaimer">Přesné pokyny se liší podle pracoviště a typu odběru (krev / plazma). Ověřte je na webu nebo telefonicky u stanice, kam jdete.</p>
        </article>

        <article class="card">
          <h2>Průběh návštěvy</h2>
          <ol class="bullets">
            <li>Registrace a vyplnění dotazníku dárce.</li>
            <li>Kontrola zdravotního stavu (např. krevní obraz / hemoglobin — dle pracoviště).</li>
            <li>Samotný odběr a krátký odpočinek s občerstvením.</li>
          </ol>
          <p class="muted">Délka a detaily závisí na typu odběru a provozu stanice.</p>
        </article>

        <article class="card">
          <h2>Podmínky (informativní)</h2>
          <p>Obecně se u dárcovství krve a plazmy posuzuje věk, hmotnost, zdravotní anamnéza, intervaly mezi odběry a další kritéria stanovená pracovištěm a platnými předpisy.</p>
          <p class="disclaimer"><strong>Kapka života nestanovuje, zda jste způsobilí k odběru.</strong> Na obrazovce Domů ukazuje jen orientační nejdřívější termín podle obecných pravidel (vyhláška č. 143/2008 Sb.), nejde o lékařské potvrzení. Rozhodnutí vždy provádí zdravotnický personál na místě. Než si naplánujete návštěvu, ověřte aktuální podmínky u konkrétní stanice.</p>
        </article>

        <article class="card">
          <h2>Časté otázky</h2>
          <details>
            <summary>Bolí to?</summary>
            <p>Vpich je podobný běžnému odběru krve. Personál Vám vše vysvětlí. Pokud se necítíte dobře, ihned to řekněte.</p>
          </details>
          <details>
            <summary>Jak často mohu darovat?</summary>
            <p>Intervaly se liší u krve a plazmy a stanovuje je pracoviště podle předpisů a Vašeho zdravotního stavu. Podle vyhlášky č. 143/2008 Sb. je mezi odběry plné krve nejméně 8 týdnů (nejvýše 5× za 12 měsíců u mužů, 4× u žen), mezi odběry plazmy nejméně 14 dní, po krvi k plazmě 4 týdny a po plazmě ke krvi 48 hodin. Pracoviště často volí delší intervaly — konkrétní termín Vám sdělí odběrové centrum.</p>
          </details>
          <details>
            <summary>Kde najdu stanici?</summary>
            <p>V sekci <button type="button" class="linkish" data-go-stations>Transfuzní stanice</button> máte přehled nemocničních odběrových míst a plazma center v celé ČR. Kontakty ověřujte na oficiálních webech.</p>
          </details>
          <details>
            <summary>Je aplikace oficiální?</summary>
            <p>Ne. Kapka života je samostatná pomůcka pro dárce. Není oficiální aplikací nemocnic, ČČK ani ministerstva.</p>
          </details>
        </article>

        <div class="row gap-sm wrap">
          <button type="button" class="btn btn-primary" data-go-stations>Najít stanici</button>
          <button type="button" class="btn btn-secondary" data-go-home>Zpět domů</button>
        </div>
      </section>`;

    outlet.querySelectorAll('[data-go-stations]').forEach((b) => (b.onclick = () => KapkaRouter.navigate('/stations')));
    outlet.querySelector('[data-go-home]').onclick = () => KapkaRouter.navigate('/home');
  });
})();
