/* Kapka života — service worker
 * v5: soubory v index.html mají ?v=5, aby se po aktualizaci hned načetla nová verze
 * (stará cache je jinak cache-first). Data v localStorage SW nikdy nemaže. */
const CACHE = 'kapka-zivota-shell-v5';
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css?v=5',
  './js/app.js?v=5',
  './js/store.js?v=5',
  './js/router.js?v=5',
  './js/eligibility.js?v=5',
  './js/screens/welcome.js?v=5',
  './js/screens/home.js?v=5',
  './js/screens/diary.js?v=5',
  './js/screens/reminders.js?v=5',
  './js/screens/stations.js?v=5',
  './js/screens/newdonor.js?v=5',
  './js/screens/settings.js?v=5',
  './js/screens/backup.js?v=5',
  './data/stations.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
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
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
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
