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

  async function showNotification(title, body, tag, timestamp) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const options = {
          body,
          icon: 'icons/icon-192.png',
          badge: 'icons/icon-192.png',
          tag: tag || 'kapka-reminder'
        };
        if (typeof timestamp === 'number') options.timestamp = timestamp;
        if (reg && reg.showNotification) {
          await reg.showNotification(title, options);
          return;
        }
        new Notification(title, options);
        return;
      } catch (e) {
        /* fall through to banner */
      }
    }
    showInAppBanner(title, body);
  }

  /** v1.2.5: jednotný titulek a text; pozdní doručení (> 2 min) se označí „Opožděné upozornění“. */
  function notifyReminder(r, due) {
    const n = KapkaNotify.build(r, due, Date.now());
    showNotification(n.title, n.body, n.tag, n.timestamp);
    KapkaStore.markReminderNotified(r.id);
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
        if (!r.notifiedAt) notifyReminder(r, due);
        continue;
      }
      const delay = due - now;
      // setTimeout max ~24.8 days; only schedule near-term
      if (delay > 0 && delay < 2147483647) {
        const tid = setTimeout(() => notifyReminder(r, due), delay);
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
  function detectInfo() {
    let isBrave = false;
    try {
      isBrave = !!(navigator.brave && typeof navigator.brave.isBrave === 'function');
    } catch (e) {}
    return KapkaInstall.detect(navigator.userAgent || '', { maxTouchPoints: navigator.maxTouchPoints || 0, isBrave });
  }

  function detectPlatform() {
    const d = detectInfo();
    return { os: d.os, browser: d.browser, inApp: d.inApp, kind: d.kind };
  }

  async function resolveBrowserKind() {
    if (browserKindCache) return browserKindCache;
    const d = detectInfo();
    try {
      if (d.browser === 'brave' && !(await navigator.brave.isBrave())) {
        d.browser = 'chrome';
        d.kind = d.os + '-chrome';
      }
    } catch (e) {}
    browserKindCache = d.kind;
    return browserKindCache;
  }

  let guideKindOverride = null;

  function ensureInstallDialog() {
    let backdrop = document.getElementById('install-dialog-backdrop');
    if (backdrop) return backdrop;
    backdrop = document.createElement('div');
    backdrop.id = 'install-dialog-backdrop';
    backdrop.className = 'install-dialog-backdrop';
    backdrop.hidden = true;
    backdrop.innerHTML = `
      <div class="install-dialog" role="dialog" aria-modal="true" aria-labelledby="install-dialog-title" id="install-dialog">
        <div class="inst-head">
          <h2 id="install-dialog-title">Jak nainstalovat Kapku života</h2>
          <button type="button" class="inst-x" id="install-dialog-x" aria-label="Zavřít návod">×</button>
        </div>
        <p class="inst-free">Zdarma · bez registrace · bez obchodu s aplikacemi</p>
        <button type="button" class="btn btn-primary inst-native" id="install-dialog-native" hidden>Nainstalovat jedním klepnutím</button>
        <div id="install-dialog-body"></div>
        <p class="muted" id="install-dialog-note">Vaše záznamy zůstávají v tomto zařízení. Instalace data nemaže.</p>
        <div class="dialog-actions">
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
    backdrop.querySelector('#install-dialog-x').onclick = () => closeInstallDialog();
    backdrop.querySelector('#install-dialog-body').addEventListener('click', (e) => {
      const t = e.target && e.target.closest ? e.target : null;
      if (!t) return;
      const sw = t.closest('[data-inst-switch]');
      if (sw) {
        const box = backdrop.querySelector('#inst-switch');
        if (box) {
          box.hidden = !box.hidden;
          sw.setAttribute('aria-expanded', box.hidden ? 'false' : 'true');
          if (!box.hidden) {
            const cur = box.querySelector('.is-current') || box.querySelector('[data-inst-kind]');
            if (cur) cur.focus();
          }
        }
        return;
      }
      const k = t.closest('[data-inst-kind]');
      if (k) {
        guideKindOverride = k.getAttribute('data-inst-kind');
        renderInstallBody();
        const g = backdrop.querySelector('[data-inst-name]');
        if (g) {
          g.setAttribute('tabindex', '-1');
          g.focus();
        }
      }
    });
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
        note.textContent = 'Prohlížeč teď nenabízí instalaci jedním klepnutím. Postupujte prosím podle kroků výše.';
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

  let currentKind = 'other';

  function renderInstallBody() {
    const backdrop = ensureInstallDialog();
    const body = backdrop.querySelector('#install-dialog-body');
    const nativeBtn = backdrop.querySelector('#install-dialog-native');
    const info = detectInfo();
    const kind = guideKindOverride || currentKind;
    const bip = !!installDeferred && !kind.startsWith('inapp');
    body.innerHTML = KapkaInstall.renderGuide(kind, { info, bip });
    nativeBtn.hidden = !bip;
    nativeBtn.disabled = false;
  }

  async function openInstallDialog() {
    const backdrop = ensureInstallDialog();
    const nativeBtn = backdrop.querySelector('#install-dialog-native');
    const note = backdrop.querySelector('#install-dialog-note');
    currentKind = await resolveBrowserKind();
    renderInstallBody();
    if (note) note.textContent = 'Vaše záznamy zůstávají v tomto zařízení. Instalace data nemaže.';
    backdrop.hidden = false;
    if (!nativeBtn.hidden) nativeBtn.focus();
    else {
      const title = backdrop.querySelector('#install-dialog-title');
      title.setAttribute('tabindex', '-1');
      title.focus();
    }
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
    document.querySelectorAll('[data-install-panel]').forEach((el) => {
      el.hidden = st === 'standalone';
    });
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
          ? 'Jedním klepnutím ji přidáte na plochu.'
          : plat.browser === 'inapp'
          ? 'Nejdřív stránku otevřete v prohlížeči. Ukážeme Vám jak.'
          : plat.os === 'ios'
          ? 'Přes Sdílet → Přidat na plochu. Ukážeme Vám jak.'
          : 'Ukážeme Vám, jak ji přidat na plochu.';
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
      } else if (t.closest('[data-install-guide]')) {
        e.preventDefault();
        openInstallDialog();
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
