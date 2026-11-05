/* 출조관제 HMI 모바일 — 출조 지수(Open-Meteo, 키 불필요) · 물때(한국 음력 표) · 해상 지도 · 게임
 * 출조 지수 공식은 PC의 SunsangHelper.Core ScoreEngine과 같습니다(기상특보 감점만 제외: 특보 API는 키가 필요).
 */
'use strict';
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const VERSION = '3.3-mobile';
const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
             set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };

// ── 전국 연안 시군(PC Catalog와 같은 좌표) ──
const REGIONS = [
  ['인천','인천',37.45,126.60],['인천','강화',37.70,126.45],['인천','옹진',37.25,126.25],['경기','안산',37.25,126.58],['경기','화성',37.19,126.65],['경기','평택',36.97,126.83],
  ['충남','당진',37.00,126.62],['충남','서산',36.95,126.40],['충남','태안',36.75,126.15],['충남','홍성',36.55,126.45],['충남','보령',36.35,126.52],['충남','서천',36.08,126.62],
  ['전북','군산',35.94,126.53],['전북','부안',35.65,126.50],['전북','고창',35.48,126.48],['전남','영광',35.37,126.40],['전남','함평',35.10,126.45],['전남','무안',34.95,126.35],
  ['전남','목포',34.79,126.38],['전남','신안',34.80,126.10],['전남','신안 흑산',34.68,125.43],['전남','해남',34.55,126.55],['전남','진도',34.43,126.25],['전남','완도',34.31,126.75],
  ['전남','강진',34.55,126.78],['전남','장흥',34.55,126.95],['전남','보성',34.73,127.25],['전남','고흥',34.52,127.14],['전남','순천',34.85,127.50],['전남','여수',34.73,127.72],
  ['전남','광양',34.92,127.70],['경남','하동',34.98,127.85],['경남','남해',34.80,127.95],['경남','사천',34.93,128.07],['경남','고성',34.97,128.32],['경남','통영',34.83,128.43],
  ['경남','거제',34.88,128.62],['경남','창원',35.15,128.58],['부산','부산',35.10,129.04],['부산','기장',35.24,129.23],['울산','울산',35.50,129.38],['경북','경주',35.80,129.48],
  ['경북','포항',36.03,129.38],['경북','영덕',36.40,129.40],['경북','울진',36.75,129.45],['경북','울릉',37.48,130.90],['강원','삼척',37.43,129.18],['강원','동해',37.52,129.12],
  ['강원','강릉',37.77,128.95],['강원','양양',38.07,128.65],['강원','속초',38.20,128.60],['강원','고성(강원)',38.38,128.47],['제주','제주시',33.52,126.53],['제주','서귀포',33.24,126.56],['제주','추자도',33.96,126.30],
].map(([p, n, la, lo]) => ({ prov: p, name: n, lat: la, lon: lo, sea: ['인천','경기','충남','전북'].includes(p) || ['영광','함평','무안','목포','신안','신안 흑산'].includes(n) ? '서해' : ['강원','경북','울산'].includes(p) ? '동해' : p === '제주' ? '제주' : '남해' }));
// 파고는 바다 위 지점에서: 해역 방향으로 약 10~15km 바다 쪽
const seaPoint = r => ({ 서해: [r.lat, r.lon - .15], 동해: [r.lat, r.lon + .15], 남해: [r.lat - .12, r.lon], 제주: [r.lat + .1, r.lon] }[r.sea]);
let watched = ls.get('m.watch', ['보령', '군산', '목포', '여수', '통영', '포항', '강릉', '제주시']);

// ── 출조 지수(PC ScoreEngine과 같은 공식) ──
const score = (wind, wave, rain) => Math.round(Math.max(0, 100 - Math.max(0, wind - 3) * 6 - Math.max(0, wave - .5) * 25 - (rain >= 3 ? 10 : rain >= 0 ? 5 : 0)));
const grade = s => s >= 75 ? '양호' : s >= 50 ? '보통' : '주의';
function assess(r, hours) {
  // 04~16시 예보가 6시간 이상 남은 첫 날
  const now = new Date(), days = {};
  hours.forEach(h => { if (h.t > now && h.hr >= 4 && h.hr <= 16) (days[h.day] = days[h.day] || []).push(h); });
  const day = Object.keys(days).sort().find(d => days[d].length >= 6);
  if (!day) return { r, s: null, g: '미확인' };
  const win = hours.filter(h => h.day === day && h.hr >= 4 && h.hr <= 16);
  const wind = Math.max(...win.map(h => h.wind ?? 0)), wave = Math.max(...win.map(h => h.wave ?? 0));
  const wet = win.filter(h => (h.rain ?? 0) >= 1), rain = wet.length ? Math.max(...wet.map(h => h.rain)) : -1;
  let best = null, run = null;   // 풍속 5 이하 + 파고 1 미만 가장 긴 연속 구간
  win.forEach(h => { const ok = (h.wind ?? 99) <= 5 && (h.wave ?? 9) < 1;
    if (ok) run = run ? [run[0], h] : [h, h]; else run = null;
    if (run && (!best || run[1].hr - run[0].hr > best[1].hr - best[0].hr)) best = run.slice(); });
  const s = score(wind, wave, rain);
  return { r, s, g: grade(s), day, wind, wave, rain, win, best: best ? `${String(best[0].hr).padStart(2, '0')}:00–${String(best[1].hr).padStart(2, '0')}:59` : '조건 충족 없음' };
}
async function fetchAll(list) {
  const la = list.map(r => r.lat.toFixed(3)).join(','), lo = list.map(r => r.lon.toFixed(3)).join(',');
  const sp = list.map(seaPoint), sla = sp.map(p => p[0].toFixed(3)).join(','), slo = sp.map(p => p[1].toFixed(3)).join(',');
  const [w, m] = await Promise.all([
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&hourly=wind_speed_10m,precipitation&wind_speed_unit=ms&timezone=Asia%2FSeoul&forecast_days=3`).then(r => r.json()),
    fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${sla}&longitude=${slo}&hourly=wave_height,sea_surface_temperature&timezone=Asia%2FSeoul&forecast_days=3`).then(r => r.json()),
  ]);
  const W = Array.isArray(w) ? w : [w], M = Array.isArray(m) ? m : [m];
  return list.map((r, i) => {
    const hw = W[i].hourly, hm = (M[i] || {}).hourly || {};
    const hours = hw.time.map((t, k) => ({ t: new Date(t), day: t.slice(0, 10), hr: +t.slice(11, 13), wind: hw.wind_speed_10m[k], rain: hw.precipitation[k],
      wave: (hm.wave_height || [])[k] ?? null, sst: (hm.sea_surface_temperature || [])[k] ?? null }));
    return Object.assign(assess(r, hours), { hours });
  });
}

// ── 관제 탭 ──
let results = ls.get('m.cache', null);
function renderHmi() {
  if (!results) return;
  const rs = results.list.slice().sort((a, b) => (b.s ?? -1) - (a.s ?? -1)), best = rs[0];
  $('updated').textContent = `업데이트 ${new Date(results.at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}${results.offline ? ' · 오프라인' : ''}`;
  if (best && best.s != null) {
    $('bestScore').className = 'score ' + best.g; $('bestScore').innerHTML = `${best.s}<small>${best.g}</small>`;
    $('bestName').textContent = best.r.name; $('bestInfo').textContent = `풍속 ${best.wind.toFixed(1)}m/s · 파고 ${best.wave.toFixed(1)}m · 최적 ${best.best}`;
    $('dayText').textContent = `판정 날짜 ${best.day} (04~16시 예보) · Open-Meteo 모델`;
  }
  $('regions').innerHTML = rs.map((x, i) => `<div class="rrow" data-i="${results.list.indexOf(x)}"><div><b>${esc(x.r.name)}</b><small>${esc(x.r.prov)} · ${x.s == null ? '예보 없음' : `풍속 ${x.wind.toFixed(1)} · 파고 ${x.wave.toFixed(1)}${x.rain >= 0 ? ' · 비' : ''}`}</small></div>
    <span class="small ${x.g}">${x.s == null ? '' : x.best === '조건 충족 없음' ? '—' : x.best.slice(0, 5)}</span><span class="pill ${x.g}">${x.s ?? '—'}</span></div>`).join('');
  document.querySelectorAll('.rrow').forEach(el => el.onclick = () => showDetail(results.list[+el.dataset.i]));
  drawPins();
}
function showDetail(x) {
  const d = $('detail'); d.hidden = false;
  const hrs = (x.hours || []).filter(h => h.day === x.day && h.hr >= 4 && h.hr <= 16);
  const sst = hrs.find(h => h.sst != null);
  d.innerHTML = `<h2>${esc(x.r.name)} <small>${esc(x.r.prov)} · ${esc(x.r.sea)} · ${x.day || ''}</small></h2>
    <dl><dt>출조 지수</dt><dd class="${x.g}"><b>${x.s ?? '—'} ${x.g}</b></dd><dt>최대 풍속</dt><dd>${x.wind != null ? x.wind.toFixed(1) + ' m/s' : '—'}</dd>
    <dt>최대 파고</dt><dd>${x.wave != null ? x.wave.toFixed(1) + ' m' : '—'}</dd><dt>비</dt><dd>${x.rain >= 0 ? `있음 (최대 ${x.rain}mm/h)` : '없음'}</dd>
    <dt>수온</dt><dd>${sst ? sst.sst.toFixed(1) + ' ℃' : '—'}</dd><dt>최적 시간</dt><dd>${esc(x.best || '—')}</dd><dt>물때</dt><dd>${esc(mulText(x.r.sea === '서해' ? 7 : 8))}</dd></dl>
    <div class="hours">${hrs.map(h => `<div class="${(h.wind ?? 99) <= 5 && (h.wave ?? 9) < 1 ? 'good' : ''}"><b>${h.hr}시</b><br>${(h.wind ?? 0).toFixed(0)}m/s<br>${h.wave != null ? h.wave.toFixed(1) + 'm' : '—'}</div>`).join('')}</div>
    <div class="small muted">초록 칸 = 풍속 5m/s 이하·파고 1m 미만. 출항 여부는 선장·해경 통제를 따르세요.</div>`;
  d.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
async function refresh() {
  const list = REGIONS.filter(r => watched.includes(r.name));
  if (!list.length) return;
  $('updated').textContent = '예보 받는 중…';
  try {
    const out = await fetchAll(list);
    results = { at: Date.now(), list: out.map(x => ({ r: x.r, s: x.s, g: x.g, day: x.day, wind: x.wind, wave: x.wave, rain: x.rain, best: x.best, hours: x.hours.map(h => ({ ...h, t: undefined })) })) };
    results.list.forEach(x => x.hours.forEach(h => h.t = new Date(`${h.day}T${String(h.hr).padStart(2, '0')}:00:00`)));
    ls.set('m.cache', results);
  } catch (e) {
    if (results) results.offline = true; else { $('regions').innerHTML = '<div class="muted">예보를 받지 못했습니다. 인터넷 연결을 확인하세요.</div>'; $('updated').textContent = '오프라인'; return; }
  }
  renderHmi();
}

// ── 물때(한국 음력 표 2025-12 ~ 2028) ──
const LUNAR = ['2025-12-20','2026-01-19','2026-02-17','2026-03-19','2026-04-17','2026-05-17','2026-06-15','2026-07-14','2026-08-13','2026-09-11','2026-10-11','2026-11-09','2026-12-09',
  '2027-01-08','2027-02-07','2027-03-08','2027-04-07','2027-05-06','2027-06-05','2027-07-04','2027-08-02','2027-09-01','2027-09-30','2027-10-29','2027-11-28','2027-12-28',
  '2028-01-27','2028-02-25','2028-03-26','2028-04-25','2028-05-24','2028-06-23','2028-07-22','2028-08-20','2028-09-19','2028-10-18','2028-11-16','2028-12-16'];
const dnum = s => Math.round(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 86400000);
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function lunarDay(d) { const n = dnum(iso(d)); let st = null; for (const s of LUNAR) if (dnum(s) <= n) st = s; return st && n - dnum(st) < 31 ? n - dnum(st) + 1 : null; }
function mul(ld, method) { const f = method === 7 ? 10 : 9, i = (((ld - f) % 15) + 15) % 15 + 1; return i === 14 ? '조금' : i === 15 ? '무시' : i + '물'; }
const strength = ld => Math.round(30 + 70 * (.5 + .5 * Math.cos(2 * Math.PI * (ld - 17.5) / 14.765294)));
let method = ls.get('m.mul', 7);
function mulText(m, d = new Date()) { const ld = lunarDay(d); return ld ? `${mul(ld, m)} (음력 ${ld}일 · 물살 ${strength(ld)}%)` : '표 범위 밖'; }
function renderTide() {
  const d = new Date(), ld = lunarDay(d);
  $('tideDate').textContent = `${d.getMonth() + 1}월 ${d.getDate()}일`;
  if (ld) { const s = strength(ld); $('mulBig').innerHTML = `${mul(ld, method)}<small>${method === 7 ? '서해 7물때' : '남해 8물때'}</small>`;
    $('lunarText').textContent = `음력 ${ld}일 · ${s >= 85 ? '사리 무렵 — 물살이 셉니다' : s <= 40 ? '조금 무렵 — 물살이 약해 쭈꾸미·갑오징어에 좋습니다' : '중간 물때'}`;
    $('strength').style.width = s + '%'; $('strengthText').textContent = `${s}% (추정)`; }
  $('m7').setAttribute('aria-pressed', method === 7); $('m8').setAttribute('aria-pressed', method === 8);
  $('week').innerHTML = Array.from({ length: 7 }, (_, k) => { const x = new Date(); x.setDate(x.getDate() + k); const l = lunarDay(x);
    return `<div class="rrow" style="cursor:default"><div><b>${x.getMonth() + 1}/${x.getDate()} (${'일월화수목금토'[x.getDay()]})</b><small>음력 ${l ?? '-'}일</small></div><span class="small">${l ? strength(l) + '%' : ''}</span><span class="pill">${l ? mul(l, method) : '-'}</span></div>`; }).join('');
  const m = d.getMonth() + 1, SEASON = { '쭈꾸미': [9,10,11], '갑오징어': [4,5,9,10,11], '우럭': [3,4,5,6,9,10,11,12], '광어': [4,5,9,10,11], '참돔': [5,6,9,10,11], '갈치': [7,8,9,10,11], '문어': [7,8,9,10,11], '무늬오징어': [9,10,11,12], '한치': [6,7,8] };
  const CLOSED = { '쭈꾸미': [511, 831], '문어': [516, 630] }, md = m * 100 + d.getDate();
  $('season').innerHTML = Object.keys(SEASON).map(s => CLOSED[s] && md >= CLOSED[s][0] && md <= CLOSED[s][1] ? `<span class="chip" style="color:var(--bad)">🚫 ${s} 금어기</span>` : SEASON[s].includes(m) ? `<span class="chip">🔥 ${s} 제철</span>` : '').join('');
}
$('m7').onclick = () => { method = 7; ls.set('m.mul', 7); renderTide(); };
$('m8').onclick = () => { method = 8; ls.set('m.mul', 8); renderTide(); };

// ── 지도 ──
let map = null, pins = null; const ovs = {};
function initMap() {
  if (map || !window.L) return;
  map = L.map('map', { zoomControl: true }).setView([35.9, 127.8], 6);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, className: 'darkTiles', attribution: '© OpenStreetMap' }).addTo(map);
  ovs.seamark = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', { maxZoom: 18, attribution: 'OpenSeaMap' }).addTo(map);
  ovs.depth = L.tileLayer.wms('https://wms.gebco.net/mapserv?', { layers: 'GEBCO_LATEST', format: 'image/png', transparent: true, opacity: .45, attribution: 'GEBCO' });
  const d = new Date(Date.now() - 20 * 86400000);   // MUR 합성 수온은 며칠 늦게 올라와 20일 전 날짜를 씀
  ovs.sst = L.tileLayer(`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GHRSST_L4_MUR_Sea_Surface_Temperature/default/${iso(d)}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png`, { maxNativeZoom: 7, maxZoom: 12, opacity: .7, attribution: `NASA GIBS 수온 ${iso(d)}` });
  pins = L.layerGroup().addTo(map);
  document.querySelectorAll('[data-ov]').forEach(b => b.onclick = () => { const k = b.dataset.ov, on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', on); on ? ovs[k].addTo(map) : map.removeLayer(ovs[k]); });
  map.on('click', async e => {
    const { lat, lng } = e.latlng, pop = L.popup().setLatLng(e.latlng).setContent('해양 정보 받는 중…').openOn(map);
    try { const m = await fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}&current=wave_height,sea_surface_temperature&timezone=Asia%2FSeoul`).then(r => r.json());
      const c = m.current || {}; pop.setContent(c.wave_height == null ? '육지이거나 자료 없음' : `파고 <b>${c.wave_height.toFixed(1)}m</b> · 수온 <b>${(c.sea_surface_temperature ?? 0).toFixed(1)}℃</b>`); }
    catch (x) { pop.setContent('정보를 받지 못했습니다'); }
  });
  drawPins();
}
function drawPins() {
  if (!pins || !results) return;
  pins.clearLayers();
  const col = { 양호: '#5ED39C', 보통: '#F5C46B', 주의: '#FF8A8D', 미확인: '#8FA6AD' };
  results.list.forEach(x => L.circleMarker([x.r.lat, x.r.lon], { radius: 10, color: '#0B1A1F', weight: 2, fillColor: col[x.g], fillOpacity: 1 })
    .bindTooltip(`${x.r.name} ${x.s ?? ''}`, { permanent: true, direction: 'right', className: '' }).on('click', () => { go('hmi'); showDetail(x); }).addTo(pins));
}

// ── 게임(스토리 + 10종, 기록·코인은 이 기기에 저장) ──
let hub = null;
const wallet = { get: () => ls.get('m.wallet', {}), set: s => { ls.set('m.wallet', Object.assign(ls.get('m.wallet', {}), s)); $('coins').textContent = ls.get('m.wallet', {}).coins ?? 50; return Promise.resolve(true); } };
function addCoins(n) { const w = wallet.get(); w.coins = (w.coins ?? 50) + n; return wallet.set(w); }
function initGames() {
  if (hub || !window.GameHub) return;
  $('coins').textContent = wallet.get().coins ?? 50;
  const store = { get: () => ls.get('m.progress', {}), set: p => { ls.set('m.progress', p); return Promise.resolve(); } };
  const entries = [
    { id: 'fish', ic: '🎣', name: '한 수 더!', desc: '90초 선상낚시 · 금어기·금지체장은 방생', mount: el => {
      el.innerHTML = '<div id="gameBox"></div><div class="small" id="gameRes" style="margin-top:8px"></div>';
      return FishingGame.mount($('gameBox'), { today: new Date(), onEnd: r => { addCoins(Math.max(0, Math.floor(r.score / 10)));
        $('gameRes').textContent = `${r.score}점 · 잡은 고기 ${r.catches} · 방생 ${r.released}`;
        hub.record({ game: 'fish', score: r.score, released: r.released, catches: r.log.map(l => ({ sp: l.sp, len: l.len })) }); } }); } },
    { id: 'dress', ic: '👕', name: '낚시꾼 코디', desc: '오늘 조건에 맞는 출조 복장', mount: el => AnglerDress.mount(el, { today: new Date(), wallet, onScore: r => hub.record({ game: 'dress', score: r.score }) }) },
    { id: 'rig', ic: '🧩', name: '채비 맞추기', desc: '60초 어종별 채비 퀴즈', mount: el => RigMatch.mount(el, { onEnd: r => { addCoins(r.coins); hub.record({ game: 'rig', score: r.score }); } }) },
    ...GameHub.extra(r => { addCoins(r.coins); hub.record(r); }, () => ({ outfit: wallet.get().outfit })),
    ...(window.MoreGames ? MoreGames.extra(r => { addCoins(r.coins); hub.record(r); }) : []),   // 인기 장르 신작 5종
    ...(window.Games3D ? Games3D.extra(r => { addCoins(r.coins); hub.record(r); }, { store, wallet }) : []),   // 친환경 3D 5종 + 낚시점
  ];
  hub = GameHub.mount($('hubBox'), { entries, store, wallet, start: 'story', onBonus: n => addCoins(n),
    onUnlock: key => { const w = wallet.get(); return wallet.set({ owned: AnglerDress.unlock(w.owned, key) }); } });
}

// ── 더보기 ──
function renderMore() {
  $('watch').innerHTML = REGIONS.map(r => `<button class="chip" data-w="${esc(r.name)}" aria-pressed="${watched.includes(r.name)}">${esc(r.name)}</button>`).join('');
  document.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { const n = b.dataset.w;
    watched = watched.includes(n) ? watched.filter(x => x !== n) : watched.concat(n); ls.set('m.watch', watched); b.setAttribute('aria-pressed', watched.includes(n)); results = null; });
  $('about').innerHTML = `출조관제 HMI 모바일 ${VERSION}<br>예보: Open-Meteo(풍속·강수·파고·수온) · 지도: OpenStreetMap, OpenSeaMap, GEBCO, NASA GIBS<br>물때: 한국 음력 표(PC 프로그램과 같은 표) · 게임 기록은 이 기기에만 저장`;
}

// ── 화면 전환 ──
function go(v) {
  document.querySelectorAll('[data-view]').forEach(s => s.hidden = s.dataset.view !== v);
  document.querySelectorAll('nav.tabbar button').forEach(b => b.setAttribute('aria-current', b.dataset.go === v ? 'page' : 'false'));
  if (v === 'map') { initMap(); setTimeout(() => map && map.invalidateSize(), 50); }
  if (v === 'game') initGames();
  if (v === 'more') renderMore();
  if (v === 'hmi' && !results) refresh();
  ls.set('m.tab', v); scrollTo(0, 0);
}
document.querySelector('nav.tabbar').onclick = e => { const b = e.target.closest('button[data-go]'); if (b) go(b.dataset.go); };

// ── 설치(PWA) ──
let deferred = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('installCard').style.display = 'grid'; });
$('installBtn').onclick = async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $('installCard').style.display = 'none'; };
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

renderHmi(); renderTide();
if (!results || Date.now() - results.at > 30 * 60000) refresh();
setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 30 * 60000);   // 30분마다(공개 API 예의상)
const TABS = ['hmi', 'tide', 'map', 'game', 'more'];
{ const h = location.hash.slice(1); go(TABS.includes(h) ? h : ls.get('m.tab', 'hmi')); }
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (TABS.includes(h)) go(h); });   // 앱 바로가기(#game 등)
