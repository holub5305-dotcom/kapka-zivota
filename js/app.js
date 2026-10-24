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
      window.navigator.standalone === true
    );
  }

  function detectBrowserHint() {
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    if (/Android/i.test(ua)) return 'android';
    if (/Edg\//i.test(ua)) return 'edge';
    if (/Brave/i.test(ua) || (navigator.brave && typeof navigator.brave.isBrave === 'function')) return 'brave';
    if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return 'chrome';
    if (/Firefox\//i.test(ua)) return 'firefox';
    if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return 'safari';
    return 'other';
  }

  function installGuideHtml(kind) {
    const blocks = {
      brave: `<p><strong>Brave (počítač)</strong> často neotevírá systémové okno z tlačítka. Postup:</p>
        <ol>
          <li>V adresním řádku klikněte na ikonu instalace (monitor se šipkou), pokud ji Brave nabízí.</li>
          <li>Nebo otevřete menu Brave (☰) → <em>Záložky a další</em> / <em>Další nástroje</em> → <em>Vytvořit zkratku…</em> nebo <em>Nainstalovat Kapka života…</em>.</li>
          <li>Zaškrtněte „Otevřít jako okno“ (pokud je k dispozici) a potvrďte.</li>
        </ol>`,
      chrome: `<p><strong>Google Chrome (počítač)</strong></p>
        <ol>
          <li>V adresním řádku klikněte na ikonu instalace.</li>
          <li>Nebo menu ⋮ → <em>Nainstalovat Kapka života…</em> / <em>Uložit a sdílet</em> → instalace.</li>
        </ol>`,
      edge: `<p><strong>Microsoft Edge</strong></p>
        <ol>
          <li>V adresním řádku ikona aplikace, nebo menu ⋯ → <em>Aplikace</em> → <em>Nainstalovat tento web jako aplikaci</em>.</li>
        </ol>`,
      android: `<p><strong>Android / tablet (Chrome nebo Brave)</strong></p>
        <ol>
          <li>Otevřete tuto stránku v Chrome (nebo Brave).</li>
          <li>Menu ⋮ → <em>Nainstalovat aplikaci</em> nebo <em>Přidat na plochu</em> / <em>Přidat na Domovskou obrazovku</em>.</li>
          <li>Potvrďte instalaci. Ikona Kapka se objeví mezi aplikacemi.</li>
        </ol>`,
      ios: `<p><strong>iPhone / iPad (Safari)</strong></p>
        <ol>
          <li>Otevřete odkaz v Safari (ne v Chrome).</li>
          <li>Tlačítko Sdílet → <em>Přidat na plochu</em> → Přidat.</li>
        </ol>`,
      firefox: `<p><strong>Firefox</strong> na počítači obvykle neinstaluje PWA jedním kliknutím. Použijte Chrome, Edge nebo Brave, nebo na Androidu <em>Přidat na Domovskou obrazovku</em>.</p>`,
      safari: `<p><strong>Safari na Macu</strong>: Soubor → <em>Přidat na Dock</em> (novější macOS), nebo použijte Chrome/Edge pro instalaci jako aplikace.</p>`,
      other: `<p>Váš prohlížeč nemusí podporovat přímou instalaci. Zkuste Chrome, Edge nebo Brave, případně na telefonu „Přidat na plochu“.</p>`
    };
    const primary = blocks[kind] || blocks.other;
    const extras = [];
    if (kind !== 'android') extras.push(blocks.android);
    if (kind !== 'brave') extras.push(blocks.brave);
    if (kind !== 'chrome') extras.push(blocks.chrome);
    return primary + '<details class="install-more"><summary>Další prohlížeče</summary>' + extras.join('') + '</details>';
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
        <div id="install-dialog-body"></div>
        <p class="muted">Vaše deníková data zůstávají v tomto prohlížeči. Instalace je jen zkratka na plochu — data se nemaží.</p>
        <div class="dialog-actions">
          <button type="button" class="btn btn-primary" id="install-dialog-native" hidden>Nainstalovat teď</button>
          <button type="button" class="btn btn-secondary" id="install-dialog-close">Zavřít</button>
        </div>
      </div>`;
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeInstallDialog();
    });
    backdrop.querySelector('#install-dialog-close').onclick = () => closeInstallDialog();
    return backdrop;
  }

  function closeInstallDialog() {
    const backdrop = document.getElementById('install-dialog-backdrop');
    if (backdrop) backdrop.hidden = true;
  }

  function openInstallDialog(opts) {
    const backdrop = ensureInstallDialog();
    const body = backdrop.querySelector('#install-dialog-body');
    const nativeBtn = backdrop.querySelector('#install-dialog-native');
    body.innerHTML = installGuideHtml(detectBrowserHint());
    const canNative = !!(opts && opts.deferred);
    nativeBtn.hidden = !canNative;
    nativeBtn.onclick = async () => {
      if (!opts || !opts.deferred) return;
      try {
        opts.deferred.prompt();
        await opts.deferred.userChoice;
      } catch (e) {
        /* show guide already visible */
      }
      closeInstallDialog();
    };
    backdrop.hidden = false;
    nativeBtn.hidden ? backdrop.querySelector('#install-dialog-close').focus() : nativeBtn.focus();
  }

  async function maybeBrave() {
    try {
      if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
        return !!(await navigator.brave.isBrave());
      }
    } catch (e) {}
    return false;
  }

  function wireInstall() {
    let deferred = null;
    const btn = document.getElementById('install-btn');

    function updateInstallButton() {
      if (!btn) return;
      if (isStandalone()) {
        btn.hidden = true;
        return;
      }
      btn.hidden = false;
      btn.textContent = deferred ? 'Nainstalovat' : 'Jak nainstalovat';
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferred = e;
      updateInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      deferred = null;
      if (btn) btn.hidden = true;
      closeInstallDialog();
    });

    if (btn) {
      btn.addEventListener('click', async () => {
        if (isStandalone()) {
          btn.hidden = true;
          return;
        }
        if (deferred) {
          try {
            deferred.prompt();
            const choice = await deferred.userChoice;
            deferred = null;
            updateInstallButton();
            if (choice && choice.outcome === 'dismissed') {
              openInstallDialog({ deferred: null });
            }
            return;
          } catch (e) {
            deferred = null;
          }
        }
        openInstallDialog({ deferred: null });
      });
    }

    maybeBrave().then((isBrave) => {
      if (isBrave) updateInstallButton();
    });
    updateInstallButton();
    // BIP often arrives shortly after SW is ready
    setTimeout(updateInstallButton, 2500);
  }

  function init() {
    KapkaStore.applyThemeToDocument();
    registerSW();
    wireInstall();
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
    openInstallDialog: () => openInstallDialog({ deferred: null }),
    isStandalone
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
