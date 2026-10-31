/* Kapka života — service worker
 * Autor projektu: Vladimír Holub. © 2026 Vladimír Holub. Všechna práva vyhrazena.
 * APP_VERSION musí odpovídat js/version.js a ?v= v index.html (hlídá tests/version.test.js).
 * Soubory mají ?v=<verze>, aby se po aktualizaci hned načetla nová verze
 * (stará cache je jinak cache-first). Data v localStorage SW nikdy nemaže. */
const APP_VERSION = '1.2.0';
const CACHE = 'kapka-zivota-shell-v6-' + APP_VERSION;
const V = '?v=' + APP_VERSION;
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css' + V,
  './js/version.js' + V,
  './js/share.js' + V,
  './js/app.js' + V,
  './js/store.js' + V,
  './js/router.js' + V,
  './js/eligibility.js' + V,
  './js/screens/welcome.js' + V,
  './js/screens/home.js' + V,
  './js/screens/diary.js' + V,
  './js/screens/reminders.js' + V,
  './js/screens/stations.js' + V,
  './js/screens/newdonor.js' + V,
  './js/screens/settings.js' + V,
  './js/screens/backup.js' + V,
  './js/screens/info.js' + V,
  './data/stations.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/icon.svg',
  './share/qr-kapka-zivota.svg',
  './share/qr-kapka-zivota.png',
  './share/letak.html',
  './share/letak-kapka-zivota.pdf'
];

const SCOPE_PATH = new URL('./', self.location).pathname;
function isAppShell(url) {
  return url.pathname === SCOPE_PATH || url.pathname === SCOPE_PATH + 'index.html';
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // cache: 'reload' obejde HTTP cache, aby se do nové verze nedostaly staré soubory
      .then((cache) => cache.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: network-first, fallback to cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            // Jen aplikace samotná se ukládá jako index.html; jiné stránky (např. leták) pod svou adresou.
            const key = isAppShell(url) ? './index.html' : url.origin + url.pathname;
            caches.open(CACHE).then((c) => c.put(key, copy));
          }
          return res;
        })
        .catch(() =>
          isAppShell(url)
            ? caches.match('./index.html')
            : caches
                .match(url.origin + url.pathname, { ignoreSearch: true })
                .then((r) => r || caches.match('./index.html'))
        )
    );
    return;
  }

  // Assets: cache-first, then network
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if ('focus' in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./index.html#/reminders');
    })
  );
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SHOW_NOTIFICATION' && self.registration.showNotification) {
    const title = data.title || 'Kapka života';
    const options = Object.assign(
      {
        body: data.body || '',
        icon: './icons/icon-192.png',
        badge: './icons/icon-192.png',
        tag: data.tag || 'kapka-reminder',
        data: data.payload || {}
      },
      data.options || {}
    );
    event.waitUntil(self.registration.showNotification(title, options));
  }
});
