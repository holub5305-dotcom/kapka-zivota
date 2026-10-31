/**
 * Kapka života — informační obrazovky v sekci Více:
 *   /settings/about  … O aplikaci (autorství, verze, upozornění)
 *   /settings/guide  … Jak Kapka života funguje (pro nové uživatele)
 *   /settings/share  … Sdílení, QR kód a leták
 * Autor projektu: Vladimír Holub. © 2026 Vladimír Holub. Všechna práva vyhrazena.
 */
(function () {
  const V = (window.KapkaVersion && KapkaVersion.APP_VERSION) || '';
  const URL_PUBLIC = (window.KapkaVersion && KapkaVersion.PUBLIC_URL) || 'https://holub5305-dotcom.github.io/kapka-zivota/';

  function header(id, title, sub) {
    return `
        <header class="screen-header">
          <button type="button" class="btn btn-ghost btn-sm" data-nav-to="/settings">← Více</button>
          <h1 id="${id}">${title}</h1>
          ${sub ? `<p class="sub">${sub}</p>` : ''}
        </header>`;
  }

  function wireNav(outlet) {
    outlet.querySelectorAll('[data-nav-to]').forEach((b) => {
      b.onclick = () => KapkaRouter.navigate(b.getAttribute('data-nav-to'));
    });
  }

  const DISCLAIMER = 'Aplikace není oficiální zdravotnickou službou a nenahrazuje doporučení odběrového centra ani lékaře.';
  const SHARE_RULE = 'Nemocnice, organizace i dárci mohou aplikaci zdarma doporučovat a sdílet. Bez svolení autora ji však nesmějí vydávat za svůj vlastní projekt.';

  KapkaRouter.register('/settings/about', async function ({ outlet }) {
    outlet.innerHTML = `
      <section class="screen info-screen" aria-labelledby="about-title">
        ${header('about-title', 'O aplikaci', '')}
        <div class="card about-card">
          <img src="icons/icon.svg" alt="" width="64" height="64" class="about-logo" />
          <p class="about-name"><strong>Kapka života</strong></p>
          <p>Bezplatná česká aplikace pro dárce krve a plazmy.</p>
          <p>Autor projektu: Vladimír Holub</p>
          <p>© 2026 Vladimír Holub. Všechna práva vyhrazena.</p>
          <dl class="about-meta">
            <dt>Verze</dt><dd id="about-version">${V}</dd>
            <dt>Oficiální adresa</dt><dd><a href="${URL_PUBLIC}" rel="noopener" id="about-url">${URL_PUBLIC}</a></dd>
          </dl>
        </div>

        <div class="card">
          <p class="about-disclaimer">${DISCLAIMER}</p>
          <p>${SHARE_RULE}</p>
        </div>

        <div class="card stack gap-sm">
          <h2 class="card-title">Soukromí</h2>
          <p>Zdarma, bez reklam, bez plateb a bez povinné registrace. Aplikace neobsahuje sledování ani analytiku. Vaše záznamy zůstávají jen ve Vašem zařízení (úložiště <code>kapka-zivota-v1</code>) a nikam se neodesílají.</p>
          <p>Nejde o oficiální aplikaci nemocnic, transfuzních služeb ani Českého červeného kříže. Termíny v aplikaci jsou jen orientační podle obecných pravidel.</p>
          <button type="button" class="btn btn-secondary" data-share-app>Sdílet Kapku života</button>
          <button type="button" class="btn btn-ghost" data-nav-to="/settings/share">QR kód a leták</button>
          <button type="button" class="btn btn-ghost" data-nav-to="/settings/guide">Jak Kapka života funguje</button>
        </div>

        <details class="card license-details">
          <summary class="card-title">Licence a použité zdroje</summary>
          <p>Kód, texty a grafika aplikace: © 2026 Vladimír Holub, všechna práva vyhrazena. Aplikaci smíte zdarma používat a sdílet odkaz, QR kód i leták. Kopírování kódu, úpravy nebo vydávání za vlastní projekt bez písemného souhlasu autora nejsou dovoleny.</p>
          <ul class="bullets">
            <li>Aplikace nepoužívá žádné externí knihovny, webová písma ani služby třetích stran; písmo je systémové.</li>
            <li>Ikony v aplikaci jsou vytvořené pro tento projekt.</li>
            <li>Přehled odběrových míst vychází z veřejně dostupných údajů (mapa pracovišť Společnosti pro transfuzní lékařství ČLS JEP a weby plazmacenter caraplasma.cz, biolifeplazma.cz, unicaplasma.cz). Kontakty si vždy ověřte u pracoviště.</li>
            <li>Orientační intervaly vychází z vyhlášky č. 143/2008 Sb., příloha č. 3.</li>
            <li>QR kód byl vygenerován nástrojem segno (licence BSD-3-Clause). „QR Code“ je ochranná známka společnosti DENSO WAVE INCORPORATED.</li>
          </ul>
        </details>
      </section>`;
    wireNav(outlet);
  });

  KapkaRouter.register('/settings/guide', async function ({ outlet }) {
    outlet.innerHTML = `
      <section class="screen info-screen" aria-labelledby="guide-title">
        ${header('guide-title', 'Jak Kapka života funguje', 'Krátký průvodce pro nové uživatele')}

        <div class="card">
          <h2 class="card-title">Co aplikace umí</h2>
          <ul class="bullets">
            <li><strong>Deník odběrů</strong> – zapisujete si odběry krve a plazmy, místo i poznámku.</li>
            <li><strong>Orientační další termín</strong> – podle obecných pravidel (vyhláška č. 143/2008 Sb.). Skutečný termín vždy určuje odběrové centrum.</li>
            <li><strong>Připomínky</strong> – termíny odběrů a upozornění v zařízení.</li>
            <li><strong>Odběrová místa</strong> – přehled transfuzních oddělení a plazmacenter v ČR s kontakty.</li>
            <li><strong>Informace pro nové dárce</strong> – jak se dárcem stát a jak se připravit.</li>
            <li><strong>Funguje i offline</strong> – po prvním otevření i bez připojení.</li>
          </ul>
        </div>

        <div class="card">
          <h2 class="card-title">Zdarma a bez registrace</h2>
          <ul class="bullets">
            <li>Aplikace je zcela zdarma, bez reklam a bez plateb.</li>
            <li>Nevyžaduje povinnou registraci ani přihlášení.</li>
            <li>Neobsahuje žádné sledování ani analytiku.</li>
          </ul>
        </div>

        <div class="card stack gap-sm">
          <h2 class="card-title">Instalace na plochu</h2>
          <p><strong>Android (Chrome):</strong> klepněte na „Nainstalovat aplikaci“ (tlačítko v Kapce života nebo v menu ⋮ prohlížeče) a potvrďte.</p>
          <p><strong>iPhone a iPad (Safari):</strong> klepněte na Sdílet (čtvereček se šipkou) → „Přidat na plochu“ → „Přidat“.</p>
          <p class="muted">Aplikace se nestahuje z obchodu – instaluje se přímo z oficiální adresy a aktualizuje se sama.</p>
          <p class="ok-note" data-install-status hidden>Aplikace je nainstalovaná.</p>
          <button type="button" class="btn btn-primary" data-install-btn>Nainstalovat aplikaci</button>
        </div>

        <div class="card stack gap-sm">
          <h2 class="card-title">Vaše data</h2>
          <p>Všechny záznamy zůstávají <strong>jen ve Vašem zařízení</strong>. Aplikace je nikam neodesílá a autor k nim nemá přístup.</p>
          <p>Smazáním dat prohlížeče nebo odinstalováním se záznamy mohou ztratit. Proto si občas stáhněte <strong>zálohu</strong> (soubor JSON). Ze zálohy je obnovíte i v novém telefonu nebo tabletu.</p>
          <button type="button" class="btn btn-secondary" data-nav-to="/backup">Záloha a obnova dat</button>
        </div>

        <div class="card stack gap-sm">
          <h2 class="card-title">Doporučte ji dalším dárcům</h2>
          <p>Sdílí se jen odkaz na aplikaci, nikdy Vaše záznamy.</p>
          <button type="button" class="btn btn-secondary" data-share-app>Sdílet Kapku života</button>
          <button type="button" class="btn btn-ghost" data-nav-to="/settings/share">QR kód a leták</button>
        </div>

        <p class="fineprint">${DISCLAIMER}</p>
      </section>`;
    wireNav(outlet);
  });

  KapkaRouter.register('/settings/share', async function ({ outlet }) {
    outlet.innerHTML = `
      <section class="screen info-screen" aria-labelledby="share-title">
        ${header('share-title', 'Sdílení, QR kód a leták', 'Doporučte Kapku života dalším dárcům')}

        <div class="card stack gap-sm">
          <h2 class="card-title">Sdílet odkaz</h2>
          <p>Oficiální adresa aplikace:</p>
          <p class="share-url"><code id="share-url">${URL_PUBLIC}</code></p>
          <button type="button" class="btn btn-primary" data-share-app>Sdílet Kapku života</button>
          <button type="button" class="btn btn-secondary" data-copy-link>Zkopírovat odkaz</button>
          <p class="muted">Sdílí se pouze tato veřejná adresa a krátký popis. Vaše záznamy, připomínky ani nastavení se nikdy nesdílejí.</p>
        </div>

        <div class="card qr-card">
          <h2 class="card-title">QR kód a leták</h2>
          <div class="qr-layout">
            <figure class="qr-figure">
              <img src="share/qr-kapka-zivota.svg" width="240" height="240" alt="QR kód s odkazem na ${URL_PUBLIC}" id="qr-img" />
              <figcaption>Naskenujte fotoaparátem telefonu</figcaption>
            </figure>
            <div class="stack gap-sm qr-actions">
              <a class="btn btn-secondary" href="share/qr-kapka-zivota.png" download="kapka-zivota-qr.png" id="dl-qr-png">Stáhnout QR kód (PNG)</a>
              <a class="btn btn-ghost" href="share/qr-kapka-zivota.svg" download="kapka-zivota-qr.svg" id="dl-qr-svg">Stáhnout QR kód (SVG, pro tisk)</a>
              <a class="btn btn-primary" href="share/letak.html" target="_blank" rel="noopener" id="open-letak">Otevřít leták k tisku</a>
              <a class="btn btn-ghost" href="share/letak-kapka-zivota.pdf" download="kapka-zivota-letak.pdf" id="dl-letak-pdf">Stáhnout leták (PDF, A4)</a>
            </div>
          </div>
          <p class="muted">QR kód vede vždy na oficiální adresu a nemění se. Můžete ho použít na plakáty, letáky nebo nástěnky.</p>
        </div>

        <div class="card">
          <h2 class="card-title">Pro nemocnice, organizace a dárce</h2>
          <p>${SHARE_RULE}</p>
          <p class="muted">${DISCLAIMER}</p>
        </div>
      </section>`;
    wireNav(outlet);
  });
})();
