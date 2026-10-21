const C='lifeplan-v14';
const ASSETS=['./','index.html','yuzu-inbox.js','yuzu-music.js','grok-yuzu.js','orgel.mp3','song.mp3','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png','art/whale.webp','art/owl.webp','art/phoenix.webp','art/dragon.webp','art/crab.webp'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.url.indexOf('grok-yuzu.json')>=0)return;if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
 e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp))}return r}).catch(()=>caches.match(e.request,{ignoreSearch:true})))});
