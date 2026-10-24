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

  function wireInstall() {
    let deferred = null;
    const btn = document.getElementById('install-btn');
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferred = e;
      if (btn) btn.hidden = false;
    });
    if (btn) {
      btn.addEventListener('click', async () => {
        if (!deferred) return;
        deferred.prompt();
        await deferred.userChoice;
        deferred = null;
        btn.hidden = true;
      });
    }
    window.addEventListener('appinstalled', () => {
      if (btn) btn.hidden = true;
    });
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
    showInAppBanner
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
