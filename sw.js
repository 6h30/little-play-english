// Cache everything up front so the site also works without internet
const CACHE = 'little-talk-v4';
const FILES = ['./', 'index.html', 'style.css', 'core.js', 'data.js', 'engine.js', 'activities.js', 'shell.js', 'manifest.webmanifest', 'icon.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(FILES);
    try { // the pictures listed in img/index.json (skipped quietly if absent)
      const r = await fetch('img/index.json'), m = await r.clone().json();
      await c.put('img/index.json', r);
      await Promise.all([...new Set(Object.values(m))].map(f => c.add('img/' + f).catch(() => { })));
    } catch (_) { }
    try { // the recorded voice lines listed in voice/index.json (skipped quietly if absent)
      const r = await fetch('voice/index.json'), m = await r.clone().json();
      await c.put('voice/index.json', r);
      await Promise.all([...new Set(Object.values(m))].map(f => c.add('voice/' + f + '.mp3').catch(() => { })));
    } catch (_) { }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
