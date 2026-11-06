/* 출조관제 HMI 모바일 서비스 워커: 앱 화면·게임은 오프라인에서도, 예보는 마지막 받은 값으로
 * 앱 파일을 바꿔 올릴 때는 CACHE 이름의 숫자를 올려야 휴대폰에 새 버전이 받아집니다. */
const CACHE = 'sunsang-mobile-v13';
const SHELL = ['./', './index.html', './app.js', './game.js', './games2.js', './games3.js', './games5.js', './games6.js', './games7.js', './games8.js', './phone.js', './angler.js', './story.js', './today.html', './today-data.js', './places.html', './places-data.js', './places.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css', 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // 예보 API: 네트워크 먼저, 안 되면 마지막 응답
  if (u.hostname.endsWith('open-meteo.com')) {
    e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
    return;
  }
  // 앱 화면·라이브러리: 캐시 먼저
  if (u.origin === location.origin || u.hostname === 'cdnjs.cloudflare.com') {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return r; })));
  }
  // 지도 타일 등은 그대로 네트워크
});
