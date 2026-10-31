(function () {
  const timers = new Map();

  function showInAppBanner(title, body) {
    let bar = document.getElementById('kapka-banner');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'kapka-banner';
      bar.className = 'app-banner';
      bar.setAttribute('role', 'status');
      document.body.appendChild(bar);
    }
    bar.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(body)}</span><button type="button" class="banner-close" aria-label="Zavřít">×</button>`;
    bar.hidden = false;
    bar.querySelector('.banner-close').onclick = () => {
      bar.hidden = true;
    };
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function showNotification(title, body, tag) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            body,
            icon: 'icons/icon-192.png',
            badge: 'icons/icon-192.png',
            tag: tag || 'kapka-reminder'
          });
          return;
        }
        new Notification(title, { body, tag: tag || 'kapka-reminder' });
        return;
      } catch (e) {
        /* fall through to banner */
      }
    }
    showInAppBanner(title, body);
  }

  function clearTimers() {
    for (const t of timers.values()) clearTimeout(t);
    timers.clear();
  }

  function scheduleReminderChecks() {
    clearTimers();
    const now = Date.now();
    const list = KapkaStore.listReminders();
    for (const r of list) {
      const at = KapkaStore.notifyAtFor(r);
      if (!at) continue;
      const due = at.getTime();
      const eventTime = new Date(r.datetime).getTime();
      // Already past notify window but event still upcoming → banner once per open if not marked
      if (due <= now && eventTime > now - 3600000) {
        if (!r.notifiedAt) {
          showNotification('Kapka života', r.title + ' — ' + new Date(r.datetime).toLocaleString('cs-CZ'), r.id);
          KapkaStore.markReminderNotified(r.id);
        }
        continue;
      }
      const delay = due - now;
      // setTimeout max ~24.8 days; only schedule near-term
      if (delay > 0 && delay < 2147483647) {
        const tid = setTimeout(() => {
          showNotification('Kapka života', r.title + ' — ' + new Date(r.datetime).toLocaleString('cs-CZ'), r.id);
          KapkaStore.markReminderNotified(r.id);
        }, delay);
        timers.set(r.id, tid);
      }
    }
  }

  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('./sw.js').catch((e) => {
      console.warn('SW registrace selhala', e);
    });
  }

  function isStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      window.navigator.standalone === true
    );
  }

  let installDeferred = null;
  let installedThisSession = false;
  let browserKindCache = null;

  /** Rozpoznání platformy jen pro výběr návodu (nic se neukládá ani neodesílá). */
  function detectPlatform() {
    const ua = navigator.userAgent || '';
    const isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    if (isIOS) {
      let browser = 'safari';
      if (/CriOS/i.test(ua)) browser = 'chrome';
      else if (/FxiOS/i.test(ua)) browser = 'firefox';
      else if (/EdgiOS/i.test(ua)) browser = 'edge';
      else if (/FBAN|FBAV|Instagram|GSA\/|Line\/|Messenger|WhatsApp/i.test(ua) || !/Safari\//i.test(ua)) browser = 'other';
      return { os: 'ios', browser };
    }
    if (/Android/i.test(ua)) {
      let browser = 'chrome';
      if (/SamsungBrowser/i.test(ua)) browser = 'samsung';
      else if (/Firefox\//i.test(ua)) browser = 'firefox';
      else if (/EdgA\//i.test(ua)) browser = 'edge';
      else if (/OPR\//i.test(ua)) browser = 'other';
      return { os: 'android', browser };
    }
    let browser = 'other';
    if (/Edg\//i.test(ua)) browser = 'edge';
    else if (/Firefox\//i.test(ua)) browser = 'firefox';
    else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'safari';
    else if (/Chrome\//i.test(ua)) browser = 'chrome';
    return { os: 'desktop', browser };
  }

  async function resolveBrowserKind() {
    if (browserKindCache) return browserKindCache;
    const p = detectPlatform();
    try {
      if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
        if (await navigator.brave.isBrave()) p.browser = 'brave';
      }
    } catch (e) {}
    browserKindCache = p.os + '-' + p.browser;
    return browserKindCache;
  }

  const GUIDES = {
    'ios-safari': `<p><strong>iPhone / iPad – Safari</strong></p>
      <ol>
        <li>Klepněte na tlačítko <strong>Sdílet</strong> (čtvereček se šipkou nahoru) na liště Safari.</li>
        <li>V nabídce sjeďte níž a zvolte <strong>Přidat na plochu</strong>.</li>
        <li>Pokud se zobrazí volba <em>Otevřít jako webovou aplikaci</em>, nechte ji zapnutou.</li>
        <li>Klepněte na <strong>Přidat</strong>. Ikona Kapka života bude na ploše.</li>
      </ol>
      <p class="muted">Na iPhonu a iPadu má aplikace přidaná na plochu vlastní úložiště. Záznamy z prohlížeče do ní přenesete přes Více → Export a obnova.</p>`,
    'ios-other': `<p><strong>iPhone / iPad – jiný prohlížeč než Safari</strong></p>
      <ol>
        <li>Nejspolehlivější je otevřít Kapku života v <strong>Safari</strong>: <button type="button" class="linkish" data-copy-link>zkopírujte odkaz</button>, otevřete Safari a vložte ho do adresního řádku.</li>
        <li>V Safari klepněte na <strong>Sdílet</strong> → <strong>Přidat na plochu</strong> → <strong>Přidat</strong>.</li>
      </ol>
      <p class="muted">V novějších verzích iOS (od 16.4) nabízejí některé prohlížeče, např. Chrome nebo Edge, položku <em>Přidat na plochu</em> také ve své nabídce Sdílet. Pokud ji vidíte, můžete ji použít.</p>`,
    'android-chrome': `<p><strong>Android – Chrome</strong></p>
      <ol>
        <li>Klepněte na menu <strong>⋮</strong> vpravo nahoře.</li>
        <li>Zvolte <strong>Nainstalovat aplikaci</strong> nebo <strong>Přidat na plochu</strong>.</li>
        <li>Potvrďte. Ikona Kapka života se objeví na ploše a otevře se bez adresního řádku.</li>
      </ol>`,
    'android-brave': `<p><strong>Android – Brave</strong></p>
      <ol>
        <li>Klepněte na menu <strong>⋮</strong>.</li>
        <li>Zvolte <strong>Nainstalovat aplikaci</strong> nebo <strong>Přidat na domovskou obrazovku</strong>.</li>
        <li>Potvrďte přidání.</li>
      </ol>`,
    'android-samsung': `<p><strong>Android – Samsung Internet</strong></p>
      <ol>
        <li>Klepněte na menu <strong>≡</strong> (obvykle dole).</li>
        <li>Zvolte <strong>Přidat stránku do</strong> → <strong>Domovská obrazovka</strong> (název položky se může podle verze lišit).</li>
        <li>Potvrďte přidání.</li>
      </ol>`,
    'android-firefox': `<p><strong>Android – Firefox</strong></p>
      <ol>
        <li>Klepněte na menu <strong>⋮</strong>.</li>
        <li>Zvolte <strong>Přidat na plochu</strong> nebo <strong>Instalovat</strong> (podle verze).</li>
        <li>Potvrďte přidání. Pro nejlepší výsledek doporučujeme Chrome.</li>
      </ol>`,
    'android-edge': `<p><strong>Android – Microsoft Edge</strong></p>
      <ol>
        <li>Klepněte na menu <strong>…</strong> dole.</li>
        <li>Zvolte <strong>Přidat do telefonu</strong> / <strong>Nainstalovat aplikaci</strong>.</li>
      </ol>`,
    'desktop-brave': `<p><strong>Brave (počítač)</strong></p>
      <ol>
        <li>V adresním řádku klikněte na ikonu instalace (monitor se šipkou), pokud ji Brave ukazuje.</li>
        <li>Nebo menu Brave (☰) → <em>Uložit a sdílet</em> / <em>Další nástroje</em> → <em>Nainstalovat Kapka života…</em> nebo <em>Vytvořit zkratku…</em> se zaškrtnutým <em>Otevřít jako okno</em>.</li>
      </ol>`,
    'desktop-chrome': `<p><strong>Google Chrome (počítač)</strong></p>
      <ol>
        <li>V adresním řádku klikněte na ikonu instalace.</li>
        <li>Nebo menu ⋮ → <em>Uložit a sdílet</em> / <em>Nainstalovat Kapka života…</em>.</li>
      </ol>`,
    'desktop-edge': `<p><strong>Microsoft Edge</strong></p>
      <ol>
        <li>Ikona aplikace v adresním řádku, nebo ⋯ → <em>Aplikace</em> → <em>Nainstalovat tento web jako aplikaci</em>.</li>
      </ol>`,
    'desktop-firefox': `<p><strong>Firefox (počítač)</strong> obvykle neinstaluje webové aplikace. Použijte Chrome, Edge nebo Brave, nebo si stránku uložte do záložek.</p>`,
    'desktop-safari': `<p><strong>Safari na Macu</strong>: Soubor → <em>Přidat do Docku</em> (macOS Sonoma a novější), nebo použijte Chrome/Edge.</p>`,
    other: `<p>Váš prohlížeč nemusí podporovat přímou instalaci. Na telefonu hledejte v menu prohlížeče položku <em>Přidat na plochu</em>. Nejspolehlivější jsou Chrome (Android) a Safari (iPhone).</p>`
  };

  function installGuideHtml(kind) {
    let key = GUIDES[kind] ? kind : null;
    if (!key) {
      if (kind.startsWith('ios-')) key = 'ios-other';
      else if (kind.startsWith('android-')) key = 'android-chrome';
      else key = 'other';
    }
    const extrasKeys = ['android-chrome', 'ios-safari', 'android-samsung', 'desktop-chrome', 'desktop-brave'].filter((k) => k !== key);
    return (
      `<div data-guide="${key}">${GUIDES[key]}</div>` +
      '<details class="install-more"><summary>Návod pro jiná zařízení</summary>' +
      extrasKeys.map((k) => GUIDES[k]).join('') +
      '</details>'
    );
  }

  function ensureInstallDialog() {
    let backdrop = document.getElementById('install-dialog-backdrop');
    if (backdrop) return backdrop;
    backdrop = document.createElement('div');
    backdrop.id = 'install-dialog-backdrop';
    backdrop.className = 'install-dialog-backdrop';
    backdrop.hidden = true;
    backdrop.innerHTML = `
      <div class="install-dialog" role="dialog" aria-modal="true" aria-labelledby="install-dialog-title" id="install-dialog">
        <h2 id="install-dialog-title">Jak nainstalovat Kapku života</h2>
        <p class="muted">Instalace je zdarma, bez registrace a bez obchodu s aplikacemi.</p>
        <div id="install-dialog-body"></div>
        <p class="muted" id="install-dialog-note">Vaše deníková data zůstávají v tomto zařízení. Instalace data nemaže.</p>
        <div class="dialog-actions">
          <button type="button" class="btn btn-primary" id="install-dialog-native" hidden>Nainstalovat teď</button>
          <button type="button" class="btn btn-secondary" id="install-dialog-close">Zavřít</button>
        </div>
      </div>`;
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeInstallDialog();
    });
    backdrop.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeInstallDialog();
    });
    backdrop.querySelector('#install-dialog-close').onclick = () => closeInstallDialog();
    backdrop.querySelector('#install-dialog-native').onclick = () => {
      tryNativeInstall();
    };
    return backdrop;
  }

  function closeInstallDialog() {
    const backdrop = document.getElementById('install-dialog-backdrop');
    if (backdrop) backdrop.hidden = true;
  }

  async function tryNativeInstall() {
    if (!installDeferred) {
      await openInstallDialog();
      const note = document.getElementById('install-dialog-note');
      if (note) {
        note.textContent = 'Prohlížeč teď nenabízí přímé instalační okno. Postupujte prosím podle návodu výše.';
      }
      return false;
    }
    const evt = installDeferred;
    try {
      await evt.prompt();
      const choice = await evt.userChoice;
      installDeferred = null;
      refreshInstallUI();
      if (choice && choice.outcome === 'accepted') {
        installedThisSession = true;
        closeInstallDialog();
        refreshInstallUI();
        return true;
      }
      await openInstallDialog();
      return false;
    } catch (e) {
      installDeferred = null;
      refreshInstallUI();
      await openInstallDialog();
      const note = document.getElementById('install-dialog-note');
      if (note) note.textContent = 'Systémové okno se nepodařilo otevřít. Použijte návod výše — data v deníku zůstávají.';
      return false;
    }
  }

  async function openInstallDialog() {
    const backdrop = ensureInstallDialog();
    const body = backdrop.querySelector('#install-dialog-body');
    const nativeBtn = backdrop.querySelector('#install-dialog-native');
    const note = backdrop.querySelector('#install-dialog-note');
    const kind = await resolveBrowserKind();
    body.innerHTML = installGuideHtml(kind);
    if (note) note.textContent = 'Vaše deníková data zůstávají v tomto zařízení. Instalace data nemaže.';
    if (installDeferred) {
      nativeBtn.hidden = false;
      nativeBtn.disabled = false;
    } else {
      nativeBtn.hidden = true;
    }
    backdrop.hidden = false;
    if (!nativeBtn.hidden) nativeBtn.focus();
    else backdrop.querySelector('#install-dialog-close').focus();
  }

  /** Hlavní akce tlačítka „Nainstalovat zdarma“. */
  async function startInstall() {
    if (isStandalone() || installedThisSession) {
      if (window.KapkaShare) KapkaShare.toast('Kapka života je už nainstalovaná.');
      return 'installed';
    }
    if (installDeferred) return (await tryNativeInstall()) ? 'accepted' : 'dismissed';
    await openInstallDialog();
    return 'guide';
  }

  function installState() {
    if (isStandalone()) return 'standalone';
    if (installedThisSession) return 'installed';
    if (installDeferred) return 'prompt';
    return 'guide';
  }

  function refreshInstallUI() {
    const st = installState();
    const installed = st === 'standalone' || st === 'installed';
    const btn = document.getElementById('install-btn');
    if (btn) {
      btn.hidden = installed;
      btn.disabled = false;
      btn.textContent = st === 'prompt' ? 'Nainstalovat zdarma' : 'Jak nainstalovat';
    }
    const plat = detectPlatform();
    document.querySelectorAll('[data-install-btn]').forEach((el) => {
      el.hidden = installed;
    });
    document.querySelectorAll('[data-install-status]').forEach((el) => {
      el.hidden = !installed;
      el.textContent =
        st === 'standalone'
          ? 'Aplikace je nainstalovaná a běží v samostatném okně.'
          : 'Aplikace je nainstalovaná. Najdete ji na ploše nebo mezi aplikacemi.';
    });
    document.querySelectorAll('[data-install-hint]').forEach((el) => {
      el.hidden = installed;
      el.textContent =
        st === 'prompt'
          ? 'Jedním klepnutím přidáte Kapku života na plochu jako aplikaci.'
          : plat.os === 'ios'
          ? 'Na iPhonu a iPadu přes Sdílet → Přidat na plochu. Ukážeme Vám jak.'
          : 'Ukážeme Vám, jak Kapku života přidat na plochu.';
    });
    document.documentElement.setAttribute('data-install-state', st);
  }

  // zpětná kompatibilita (starší volání)
  const updateInstallButton = refreshInstallUI;

  function wireInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      installDeferred = e;
      refreshInstallUI();
    });

    window.addEventListener('appinstalled', () => {
      installDeferred = null;
      installedThisSession = true;
      closeInstallDialog();
      refreshInstallUI();
    });

    try {
      window.matchMedia('(display-mode: standalone)').addEventListener('change', refreshInstallUI);
    } catch (e) {}

    document.addEventListener('click', (e) => {
      const t = e.target && e.target.closest ? e.target : null;
      if (!t) return;
      if (t.closest('#install-btn') || t.closest('[data-install-btn]')) {
        e.preventDefault();
        startInstall();
      } else if (t.closest('[data-share-app]')) {
        e.preventDefault();
        if (window.KapkaShare) KapkaShare.shareApp();
      } else if (t.closest('[data-copy-link]')) {
        e.preventDefault();
        if (window.KapkaShare) KapkaShare.copyLink();
      }
    });

    resolveBrowserKind().then(() => refreshInstallUI());
    refreshInstallUI();
    setTimeout(refreshInstallUI, 2500);
  }

  /** Jemné oznámení po aktualizaci. Používá vlastní klíč, data deníku nemění. */
  function announceUpdate() {
    const V = window.KapkaVersion && KapkaVersion.APP_VERSION;
    if (!V) return;
    const KEY = 'kapka-zivota-app-version';
    try {
      const seen = localStorage.getItem(KEY);
      const hasData = !!localStorage.getItem('kapka-zivota-v1');
      if (seen !== V) {
        if (hasData) {
          showInAppBanner('Aplikace byla aktualizována', 'Kapka života je nyní ve verzi ' + V + '. Vaše záznamy zůstávají beze změny.');
        }
        localStorage.setItem(KEY, V);
      }
    } catch (e) {}
  }

  function init() {
    KapkaStore.applyThemeToDocument();
    registerSW();
    wireInstall();
    announceUpdate();
    const outlet = document.getElementById('app');
    KapkaRouter.start(outlet);
    scheduleReminderChecks();
    window.addEventListener('kapka:store', () => scheduleReminderChecks());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') scheduleReminderChecks();
    });

    // Prefill reminder form from query (station name)
    const orig = KapkaRouter.render;
    // handled in reminders form via hash params if we extend — stations navigate with params
  }

  window.KapkaApp = {
    scheduleReminderChecks,
    showNotification,
    showInAppBanner,
    openInstallDialog,
    tryNativeInstall,
    startInstall,
    installState,
    refreshInstallUI,
    detectPlatform,
    isStandalone
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
