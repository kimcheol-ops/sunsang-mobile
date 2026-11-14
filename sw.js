/* 출조 관제 우주 프로 모바일 서비스 워커: 앱 화면·게임은 오프라인에서도, 예보는 마지막 받은 값으로
 * 앱 파일을 바꿔 올릴 때는 CACHE 이름의 숫자를 올려야 휴대폰에 새 버전이 받아집니다. */
const CACHE = 'sunsang-mobile-v36';
const SHELL = ['./', './index.html', './app.js', './game.js', './games2.js', './games3.js', './games5.js', './games6.js', './games7.js', './games8.js', './games9.js', './phone.js', './angler.js', './story.js', './today.html', './today-data.js', './places.html', './places-data.js', './places.js', './sea.html', './sea.js', './sea-data.js', './sea-trails.js', './sea-depth.js', './games10.js', './walk.js', './art.js', './studio.js', './globe.html', './globe.js', './globe-data.js', './globe-world.js', './fun.js', './legends.js', './legend.js', './seamap.html', './seamap-plus.js', './seamap-photos.js', './public-data.js', './public-parking.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css', 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'];
// 설치: 브라우저 HTTP 캐시를 건너뛰고(cache: 'reload') 서버의 최신 파일로 채움 — 업데이트 뒤 옛 화면이 남지 않게
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: u.startsWith('http') ? 'default' : 'reload' })))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
const put = (req, r) => { if (r && r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return r; };
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // 예보 API: 네트워크 먼저, 안 되면 마지막 응답
  if (u.hostname.endsWith('open-meteo.com')) { e.respondWith(fetch(e.request).then(r => put(e.request, r)).catch(() => caches.match(e.request))); return; }
  // 화면(html): 인터넷이 되면 항상 최신, 안 되면 저장본
  if (u.origin === location.origin && (e.request.mode === 'navigate' || e.request.destination === 'document' || u.pathname.endsWith('.html'))) {
    e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => put(e.request, r)).catch(() => caches.match(e.request, { ignoreSearch: true }).then(h => h || caches.match('./index.html'))));
    return;
  }
  // 스크립트·라이브러리·아이콘: 저장본 먼저(설치 때 최신으로 채움)
  if (u.origin === location.origin || u.hostname === 'cdnjs.cloudflare.com') {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => put(e.request, r))));
  }
  // 지도 타일 등은 그대로 네트워크
});
