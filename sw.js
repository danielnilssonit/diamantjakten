// Diamantjakten: sparar spelet i webbläsaren så att det fungerar utan internet
const CACHE = 'diamantjakten-c54efd14c9';
const CORE = ['./', './index.html', './kontroll.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './favicon-32.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(async c => {
    await c.addAll(CORE);
    try { await c.add(new Request('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', {mode: 'cors'})); } catch (err) { /* hämtas vid första spelet */ }
  }).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('diamantjakten-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.headers.has('range')) return;   // ljudfiler hämtas i bitar av webbläsaren själv
  if (url.origin === self.location.origin) {
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, {ignoreSearch: true}).then(hit => hit || caches.match('./index.html'))));
    return;
  }
  if (/(^|\.)cdnjs\.cloudflare\.com$|(^|\.)cdn\.jsdelivr\.net$|^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
  }
});
