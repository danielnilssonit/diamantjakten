// Diamantjakten: sparar spelet i webbläsaren så att det fungerar utan internet
const CACHE = 'diamantjakten-514098fbcd';
const CORE = ['./', './index.html', './kontroll.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './favicon-32.png'];
// Kartbilderna och 3D-modellerna (hämtas medan man är på startsidan, så att alla kartor fungerar utan internet sedan)
const ASSETS = ["maps/afrika/color.jpg?v=06b7c306","maps/afrika/normal.jpg?v=36b01b9a","maps/afrika/rough.jpg?v=e9876f03","maps/afrika/height.png?v=c831f379","maps/europa/color.jpg?v=13b7b524","maps/europa/normal.jpg?v=a2167b79","maps/europa/rough.jpg?v=cd58b600","maps/europa/height.png?v=16fb9f98","maps/norden/color.jpg?v=db5703cc","maps/norden/normal.jpg?v=4009f044","maps/norden/rough.jpg?v=b06b5aff","maps/norden/height.png?v=7cd17e78","maps/skane/color.jpg?v=074b04fc","maps/skane/normal.jpg?v=cf308b45","maps/skane/rough.jpg?v=5fda79e9","maps/skane/height.png?v=389f490b","maps/sverige/color.jpg?v=55f0d467","maps/sverige/normal.jpg?v=0e472726","maps/sverige/rough.jpg?v=abf32493","maps/sverige/height.png?v=e49be364","maps/varlden/color.jpg?v=855f08b6","maps/varlden/normal.jpg?v=0c09e867","maps/varlden/rough.jpg?v=095df421","maps/varlden/height.png?v=ca974f5e","models.bin?v=943a4304"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(async c => {
    await c.addAll(CORE);
    // Det som redan finns sparat från förra versionen behöver inte hämtas igen
    const old = (await caches.keys()).filter(k => k.startsWith('diamantjakten-') && k !== CACHE);
    for (const u of ASSETS) {
      let hit = null;
      for (const k of old) { hit = await (await caches.open(k)).match(u); if (hit) break; }
      if (hit) await c.put(u, hit); else await c.add(u);
    }
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
  if (url.origin === self.location.origin && /[?&]v=/.test(url.search)) {
    // Filer med version i adressen ändras aldrig: det sparade används direkt
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
    return;
  }
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
