/* 출조 관제 우주 프로 모바일 — 출조 지수(Open-Meteo, 키 불필요) · 물때(한국 음력 표) · 해상 지도 · 게임
 * 출조 지수 공식은 PC의 SunsangHelper.Core ScoreEngine과 같습니다(기상특보 감점만 제외: 특보 API는 키가 필요).
 */
'use strict';
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const VERSION = '6.4-mobile';
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
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&hourly=wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation&wind_speed_unit=ms&timezone=Asia%2FSeoul&forecast_days=3`).then(r => r.json()),
    fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${sla}&longitude=${slo}&hourly=wave_height,wave_direction,sea_surface_temperature&timezone=Asia%2FSeoul&forecast_days=3`).then(r => r.json()),
  ]);
  const W = Array.isArray(w) ? w : [w], M = Array.isArray(m) ? m : [m];
  return list.map((r, i) => {
    const hw = W[i].hourly, hm = (M[i] || {}).hourly || {};
    const hours = hw.time.map((t, k) => ({ t: new Date(t), day: t.slice(0, 10), hr: +t.slice(11, 13), wind: hw.wind_speed_10m[k], gust: (hw.wind_gusts_10m || [])[k] ?? null, wdir: (hw.wind_direction_10m || [])[k] ?? null, rain: hw.precipitation[k], wvdir: (hm.wave_direction || [])[k] ?? null,
      wave: (hm.wave_height || [])[k] ?? null, sst: (hm.sea_surface_temperature || [])[k] ?? null }));
    return Object.assign(assess(r, hours), { hours });
  });
}

// ── 관제 탭 ──
let results = ls.get('m.cache', null);
const fixHours = R => { if (R) R.list.forEach(x => (x.hours || []).forEach(h => h.t = new Date(`${h.day}T${String(h.hr).padStart(2, '0')}:00:00`))); return R; };
fixHours(results);   // 저장된 캐시의 시각 문자열을 Date로
function renderHmi() {
  if (!results) return;
  const rs = results.list.slice().sort((a, b) => (b.s ?? -1) - (a.s ?? -1)), best = rs[0];
  $('updated').textContent = `업데이트 ${new Date(results.at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}${results.offline ? ' · 오프라인' : ''}`;
  if (best && best.s != null) {
    $('bestScore').className = 'score ' + best.g; $('bestScore').innerHTML = `${best.s}<small>${best.g}</small>`;
    $('bestName').textContent = best.r.name; $('bestInfo').textContent = `풍속 ${best.wind.toFixed(1)}m/s · 파고 ${best.wave.toFixed(1)}m · 최적 ${best.best}`;
    $('dayText').textContent = `판정 날짜 ${best.day} (04~16시 예보) · Open-Meteo 모델`;
  }
  renderHazard();
  $('regions').innerHTML = rs.map((x, i) => `<div class="rrow" data-i="${results.list.indexOf(x)}"><div><b>${esc(x.r.name)}</b><small>${esc(x.r.prov)} · ${x.s == null ? '예보 없음' : `풍속 ${x.wind.toFixed(1)} · 파고 ${x.wave.toFixed(1)}${curSst(x) != null ? ` · 수온 ${curSst(x).toFixed(1)}℃` : ''}${x.rain >= 0 ? ' · 비' : ''}`}</small></div>
    <span class="small ${x.g}">${hzIcon(x)}${x.s == null ? '' : x.best === '조건 충족 없음' ? '—' : x.best.slice(0, 5)}</span><span class="pill ${x.g}">${x.s ?? '—'}</span></div>`).join('');
  document.querySelectorAll('#regions .rrow').forEach(el => el.onclick = () => showDetail(results.list[+el.dataset.i]));
  drawPins();
  if ($('solBox') && !$('solBox').closest('[data-view]').hidden) renderSolunar();
}
function showDetail(x) {
  const d = $('detail'); d.hidden = false;
  const hrs = (x.hours || []).filter(h => h.day === x.day && h.hr >= 4 && h.hr <= 16);
  const sst = hrs.find(h => h.sst != null);
  d.innerHTML = `<h2>${esc(x.r.name)} <small>${esc(x.r.prov)} · ${esc(x.r.sea)} · ${x.day || ''}</small></h2>
    <dl><dt>출조 지수</dt><dd class="${x.g}"><b>${x.s ?? '—'} ${x.g}</b></dd><dt>최대 풍속</dt><dd>${x.wind != null ? x.wind.toFixed(1) + ' m/s' : '—'}</dd>
    <dt>최대 파고</dt><dd>${x.wave != null ? x.wave.toFixed(1) + ' m' : '—'}</dd><dt>비</dt><dd>${x.rain >= 0 ? `있음 (최대 ${x.rain}mm/h)` : '없음'}</dd>
    <dt>수온</dt><dd>${sst ? `${sst.sst.toFixed(1)} ℃ · ${K.tempAdvice(sst.sst).label}<br><small>잘 무는 어종: ${K.tempAdvice(sst.sst).best.join(' · ') || '—'}</small>` : '—'}</dd><dt>최적 시간</dt><dd>${esc(x.best || '—')}</dd><dt>물때</dt><dd>${esc(mulText(x.r.sea === '서해' ? 7 : 8))}</dd></dl>
    <div class="hours">${hrs.map(h => `<div class="${(h.wind ?? 99) <= 5 && (h.wave ?? 9) < 1 ? 'good' : ''}"><b>${h.hr}시</b><br>${(h.wind ?? 0).toFixed(0)}m/s<br>${h.wave != null ? h.wave.toFixed(1) + 'm' : '—'}</div>`).join('')}</div>
    <div class="small muted">초록 칸 = 풍속 5m/s 이하·파고 1m 미만. 출항 여부는 선장·해경 통제를 따르세요.</div>${detailExtra(x)}`;
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
  // 제철(월)·금어기(기간) — AnglerKit.seasons: 금어기 중 → 곧 금어기(30일 안) → 제철 순
  const SS = window.AnglerKit ? AnglerKit.seasons(d) : [];
  $('season').innerHTML = SS.map(o => `<span class="chip" style="cursor:default;${o.cls === 'bad' ? 'color:var(--bad);border-color:var(--bad)' : o.cls === 'warn' ? 'color:var(--warn);border-color:var(--warn)' : ''}" title="${esc(o.note || '')}">${esc(o.text)}</span>`).join('') || '<span class="small muted">이번 달 제철 정보가 없습니다</span>';
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
  pins = L.layerGroup().addTo(map); spotLayer = L.layerGroup().addTo(map); ovs.wind = L.layerGroup();
  document.querySelectorAll('[data-ov]').forEach(b => b.onclick = () => { const k = b.dataset.ov, on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', on); on ? ovs[k].addTo(map) : map.removeLayer(ovs[k]); if (k === 'wind' && on) drawWind(); });
  map.on('click', async e => {
    const { lat, lng } = e.latlng, pop = L.popup().setLatLng(e.latlng).setContent('해양 정보 받는 중…').openOn(map);
    try { const m = await fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}&current=wave_height,sea_surface_temperature&timezone=Asia%2FSeoul`).then(r => r.json());
      const c = m.current || {}; pop.setContent((c.wave_height == null ? '육지이거나 자료 없음' : `파고 <b>${c.wave_height.toFixed(1)}m</b> · 수온 <b>${(c.sea_surface_temperature ?? 0).toFixed(1)}℃</b>`) + spotBtn(lat, lng)); }
    catch (x) { pop.setContent('정보를 받지 못했습니다' + spotBtn(lat, lng)); }
  });
  drawPins(); drawSpots();
}
function drawPins() {
  if (!pins || !results) return;
  pins.clearLayers();
  const col = { 양호: '#5ED39C', 보통: '#F5C46B', 주의: '#FF8A8D', 미확인: '#8FA6AD' };
  results.list.forEach(x => L.circleMarker([x.r.lat, x.r.lon], { radius: 10, color: '#0B1A1F', weight: 2, fillColor: col[x.g], fillOpacity: 1 })
    .bindTooltip(`${x.r.name} ${x.s ?? ''}`, { permanent: true, direction: 'right', className: '' }).on('click', () => { go('hmi'); showDetail(x); }).addTo(pins));
  if (map.hasLayer(ovs.wind)) drawWind();
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
    ...(window.Space ? Space.extra(r => { addCoins(r.coins); hub.record(r); }, { store }) : []),   // 은하 낚시 원정대 10편
    ...(window.SeaHome ? SeaHome.extra(r => { addCoins(r.coins); hub.record(r); }, { store }) : []),   // 아라의 바다 고향 10경
    ...(window.SeaGames ? SeaGames.extra(r => { addCoins(r.coins); hub.record(r); }) : []),   // 🤿 바다 속 탐험
    ...(window.TrendGames ? TrendGames.extra(r => { addCoins(r.coins); hub.record(r); }) : []),   // 요즘 유행 장르 5종
  ];
  hub = GameHub.mount($('hubBox'), { entries, store, wallet, start: 'story', onBonus: n => addCoins(n),
    onUnlock: key => { const w = wallet.get(); return wallet.set({ owned: AnglerDress.unlock(w.owned, key) }); } });
}

// ── 더보기 ──
function renderMore() {
  $('watch').innerHTML = REGIONS.map(r => `<button class="chip" data-w="${esc(r.name)}" aria-pressed="${watched.includes(r.name)}">${esc(r.name)}</button>`).join('');
  document.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { const n = b.dataset.w;
    watched = watched.includes(n) ? watched.filter(x => x !== n) : watched.concat(n); ls.set('m.watch', watched); b.setAttribute('aria-pressed', watched.includes(n)); results = null; });
  $('about').innerHTML = `출조 관제 우주 프로 모바일 ${VERSION}<br>예보: Open-Meteo(풍속·강수·파고·수온) · 지도: OpenStreetMap, OpenSeaMap, GEBCO, NASA GIBS<br>물때: 한국 음력 표(PC 프로그램과 같은 표) · 게임 기록은 이 기기에만 저장`;
}

// ════ 낚시 앱 비교 분석에서 가져온 현장 도구 (AnglerKit, 키 불필요) ════
const K = window.AnglerKit;
const hm = t => K.hm(t instanceof Date ? t : t ? new Date(t) : null);
const todayIso = () => iso(new Date());
const nearestRegion = (lat, lon) => REGIONS.slice().sort((a, b) => K.distance({ lat, lon }, a).km - K.distance({ lat, lon }, b).km)[0];
const regionResult = name => results && results.list.find(x => x.r.name === name);
const mulMethodOf = r => r && r.sea === '서해' ? 7 : 8;

// ① 위험 알림 — 감시 지역 24시간 안 풍속·돌풍·파고
const HZCOL = ['var(--ok)', 'var(--warn)', '#FFA35C', 'var(--bad)'];
function hzOf(x) { return x && x.hours && x.hours.length ? K.hazards(x.hours, new Date(), 24) : { lv: 0, runs: [] }; }
function hzIcon(x) { const h = hzOf(x); return h.lv >= 2 ? `<span title="${esc(h.label)}" style="color:${HZCOL[h.lv]}">⚠ </span>` : ''; }
function renderHazard() {
  const el = $('hazard'); if (!el || !results) return;
  const all = results.list.map(x => ({ x, h: hzOf(x) })).filter(o => o.h.lv >= 1).sort((a, b) => b.h.lv - a.h.lv);
  if (!all.length) { el.innerHTML = `<span style="color:var(--ok)">✅ 24시간 안 감시 지역에 강풍·높은 파도 예보가 없습니다</span>`; return; }
  const top = all[0];
  el.innerHTML = `<b style="color:${HZCOL[top.h.lv]}">${top.h.lv >= 3 ? '⛔' : '⚠'} ${esc(top.h.label)} · ${esc(top.x.r.name)}</b> ${esc(top.h.why)} (${iso(top.h.worst.t) === todayIso() ? "오늘" : "내일"} ${hm(top.h.worst.t)} 무렵)` +
    (all.length > 1 ? `<br><span class="muted">그 밖에 ${all.slice(1, 5).map(o => `${esc(o.x.r.name)}(${o.h.label})`).join(', ')}</span>` : '') +
    `<br><span class="muted">기준: 주의 풍속 7·파고 1.5 / 경고 10·2 / 위험 14·3 (풍랑주의보 수준). 공식 특보는 기상청에서 확인하세요.</span>`;
}

// ② 지역 상세에 솔루나·입질 지수·위험 구간
function detailExtra(x) {
  if (!x.day || !x.hours) return '';
  const d = new Date(x.day + 'T12:00:00'), sol = K.solunar(d, x.r.lat, x.r.lon), ld = lunarDay(d);
  const sp = ls.get('m.sp', '우럭'), tl = K.biteTimeline(x.hours.filter(h => h.day === x.day), sol, ld ? strength(ld) : null, sp);
  const hz = hzOf(x), w = x.hours.find(h => h.day === x.day && h.hr === 8) || {};
  return `<h2 style="margin-top:6px">🌙 솔루나 · 입질 지수 <small>${esc(sp)} · ${x.day}</small></h2>
    <div class="small">${sol.moon.icon} ${sol.moon.name} · 하루 등급 ${'★'.repeat(sol.rating)}${'☆'.repeat(4 - sol.rating)} · 일출 ${hm(sol.sunrise)} 일몰 ${hm(sol.sunset)}<br>
    ${sol.periods.map(p => `<span class="chip" style="cursor:default;padding:3px 8px;${p.kind === 'major' ? 'border-color:var(--sea)' : ''}">${p.kind === 'major' ? '메이저' : '마이너'} ${hm(p.from)}–${hm(p.to)}</span>`).join(' ')}</div>
    ${biteBars(tl)}
    <div class="small">바람 ${K.dirName(w.wdir)}풍${w.gust != null ? ` · 돌풍 ${w.gust.toFixed(0)}m/s` : ''}${w.wvdir != null ? ` · 파도 ${K.dirName(w.wvdir)}쪽에서` : ''} (08시) ${hz.runs.length ? `<br>⚠ ${hz.runs.map(r => `${r.label} ${hm(r.from)}~${hm(r.to)} ${esc(r.why)}`).join(' / ')}` : ''}</div>`;
}
function biteBars(tl) {
  const top = tl.slice().sort((a, b) => b.v - a.v).slice(0, 3).sort((a, b) => a.hr - b.hr);
  return `<div class="bite">${tl.map(t => `<i title="${t.hr}시 ${t.v}" style="height:${Math.max(4, t.v)}%;background:${t.v >= 70 ? 'var(--ok)' : t.v >= 45 ? 'var(--sea)' : 'var(--line)'}${t.dark ? ';opacity:.75' : ''}"></i>`).join('')}</div>
    <div class="biteAx"><span>0시</span><span>6</span><span>12</span><span>18</span><span>23시</span></div>
    <div class="small">추천 시간 <b>${top.map(t => `${t.hr}시(${t.v})`).join(' · ')}</b> — 솔루나·물살·해 뜰/질 녘·어종 습성·바람·파고를 합친 <b>추정</b> 지수입니다.</div>`;
}

// ③ 물때 탭: 솔루나 피딩 타임 + 어종별 시간대 입질 지수
const SPECIES = ['우럭', '광어', '참돔', '쭈꾸미', '갑오징어', '갈치', '문어', '낙지', '한치', '무늬오징어', '감성돔', '농어', '볼락', '방어'];
function renderSolunar() {
  if (!$('solBox')) return;
  const focus = ls.get('m.focus', watched[0]), r = REGIONS.find(x => x.name === focus) || REGIONS.find(x => x.name === watched[0]) || REGIONS[0];
  const sp = ls.get('m.sp', '우럭'), dayOff = ls.get('m.solDay', 0);
  const d = new Date(); d.setDate(d.getDate() + dayOff); d.setHours(12, 0, 0, 0);
  $('solRegion').innerHTML = watched.map(n => `<option ${n === r.name ? 'selected' : ''}>${esc(n)}</option>`).join('');
  $('solSp').innerHTML = SPECIES.map(s => `<option ${s === sp ? 'selected' : ''}>${s}</option>`).join('');
  document.querySelectorAll('[data-solday]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.solday === dayOff));
  const sol = K.solunar(d, r.lat, r.lon), ld = lunarDay(d), x = regionResult(r.name), day = iso(d);
  const hours = x && x.hours ? x.hours.filter(h => h.day === day) : [];
  const base = hours.length === 24 ? hours : Array.from({ length: 24 }, (_, h) => hours.find(o => o.hr === h) || { t: new Date(`${day}T${String(h).padStart(2, '0')}:00:00`), hr: h, wind: null, wave: null });
  const tl = K.biteTimeline(base, sol, ld ? strength(ld) : null, sp);
  const now = new Date(), cur = dayOff === 0 && sol.periods.find(p => now >= p.from && now <= p.to), next = dayOff === 0 && sol.periods.find(p => p.from > now);
  $('solBox').innerHTML = `<div class="hero"><div class="score" style="color:var(--warn);font-size:30px">${sol.moon.icon}<small>${'★'.repeat(sol.rating)}</small></div>
    <div><b>${esc(r.name)} · ${d.getMonth() + 1}/${d.getDate()}</b> ${sol.moon.name} (밝기 ${Math.round(sol.moon.fraction * 100)}%)<br>
    <span class="small">일출 ${hm(sol.sunrise)} · 일몰 ${hm(sol.sunset)} · 월출 ${hm(sol.moonrise)} · 월몰 ${hm(sol.moonset)}</span><br>
    <span class="small" style="color:var(--ok)">${cur ? `지금 ${cur.kind === 'major' ? '메이저' : '마이너'} 피딩 타임(~${hm(cur.to)})` : next ? `다음 피딩 타임 ${hm(next.from)} (${next.label})` : ''}</span></div></div>
    <div class="rgrid">${sol.periods.map(p => `<div class="rrow" style="cursor:default"><div><b>${p.kind === 'major' ? '🔥 메이저' : '✨ 마이너'}</b><small>${p.label}${sol.overlap && p.kind === 'major' && [sol.sunrise, sol.sunset].some(t => t && Math.abs(p.center - t) < 5.4e6) ? ' · 해 뜰/질 녘과 겹침 ★' : ''}</small></div><span></span><span class="pill">${hm(p.from)}–${hm(p.to)}</span></div>`).join('')}</div>
    <h2 style="margin-top:4px">시간대별 입질 지수 <small>${esc(sp)}${hours.length ? '' : ' · 예보 없음(날씨 제외)'}</small></h2>${biteBars(tl)}`;
  mission('tide');
}
$('solRegion') && ($('solRegion').onchange = e => { ls.set('m.focus', e.target.value); renderSolunar(); });
$('solSp') && ($('solSp').onchange = e => { ls.set('m.sp', e.target.value); renderSolunar(); });
document.querySelectorAll('[data-solday]').forEach(b => b.onclick = () => { ls.set('m.solDay', +b.dataset.solday); renderSolunar(); });

// ④ 지도: 바람·파도 방향 화살표, 내 포인트, 현재 위치 거리
let spotLayer = null, myPos = null, myMarker = null;
// 화살표는 바람(파도)이 '불어가는' 쪽을 가리킵니다(기상 방향 deg는 불어오는 쪽이라 +180°)
const arrowSvg = (deg, col) => `<svg width="26" height="26" viewBox="-13 -13 26 26" style="transform:rotate(${(deg + 180) % 360}deg)" aria-hidden="true"><path d="M0-11 L6 2 L1.5 0 L1.5 11 L-1.5 11 L-1.5 0 L-6 2 Z" fill="${col}" stroke="#06151A" stroke-width="1.2"/></svg>`;
const arrowIcon = (h, col) => L.divIcon({ className: '', iconSize: [76, 30], iconAnchor: [13, 15],
  html: `<div style="display:flex;align-items:center;gap:2px;font:700 11px/1.15 sans-serif;color:#E3EEF0;text-shadow:0 0 3px #000">${arrowSvg(h.wdir, col)}<span>${h.wind.toFixed(0)}m/s${h.wave != null ? `<br><span style="color:#9FE3EE">${h.wave.toFixed(1)}m</span>` : ''}</span></div>` });
function drawWind() {
  if (!map || !results) return; ovs.wind.clearLayers();
  const now = new Date();
  results.list.forEach(x => { const h = (x.hours || []).find(o => o.day === iso(now) && o.hr === now.getHours()); if (!h || h.wdir == null) return;
    const lv = K.hazardLevel(h), p = seaPoint(x.r);
    L.marker(p, { icon: arrowIcon(h, HZCOL[lv]), interactive: false }).addTo(ovs.wind); });   // 바다 쪽 지점에(지역 라벨과 겹치지 않게)
}
const spots = () => ls.get('m.spots', []);
function spotBtn(lat, lon) { return `<br><button class="btn" style="min-height:34px;margin-top:6px;font-size:13px" data-savespot="${lat.toFixed(5)},${lon.toFixed(5)}">📍 내 포인트로 저장</button>`; }
function saveSpot(lat, lon, name) {
  name = name || prompt('포인트 이름 (예: 녹도 남쪽 여밭)', `${nearestRegion(lat, lon).name} 포인트 ${spots().length + 1}`);
  if (!name) return;
  ls.set('m.spots', spots().concat({ id: Date.now(), name: name.slice(0, 40), lat: +lat, lon: +lon, at: new Date().toISOString() }));
  drawSpots(); renderSpots(); mission('spot'); map && map.closePopup();
}
document.addEventListener('click', e => { const b = e.target.closest('[data-savespot]'); if (b) { const [la, lo] = b.dataset.savespot.split(','); saveSpot(+la, +lo); } });
function drawSpots() {
  if (!spotLayer) return; spotLayer.clearLayers();
  spots().forEach(s => L.marker([s.lat, s.lon], { icon: L.divIcon({ className: '', html: '<div style="font-size:22px;line-height:22px">📍</div>', iconSize: [22, 22], iconAnchor: [11, 22] }) })
    .bindPopup(`<b>${esc(s.name)}</b><br>${s.lat.toFixed(4)}, ${s.lon.toFixed(4)}${myPos ? `<br>내 위치에서 ${(() => { const d = K.distance(myPos, s); return `${d.km.toFixed(1)}km (${d.nm.toFixed(1)}해리) ${d.dir}쪽`; })()}` : ''}`).addTo(spotLayer));
}
function renderSpots() {
  const el = $('spotList'); if (!el) return;
  const list = spots().map(s => ({ s, d: myPos ? K.distance(myPos, s) : null })).sort((a, b) => a.d && b.d ? a.d.km - b.d.km : 0);
  el.innerHTML = list.length ? list.map(({ s, d }) => `<div class="rrow" data-spot="${s.id}"><div><b>📍 ${esc(s.name)}</b><small>${s.lat.toFixed(4)}, ${s.lon.toFixed(4)} · ${s.at.slice(0, 10)}</small></div>
      <span class="small">${d ? `${d.km.toFixed(1)}km ${d.dir}` : ''}</span><button class="chip" data-delspot="${s.id}" aria-label="삭제">✕</button></div>`).join('')
    : '<div class="small muted">지도를 눌러 나온 창에서 「📍 내 포인트로 저장」을 누르거나, 「내 위치」로 지금 자리를 저장하세요. 이 기기에만 저장됩니다(비공개).</div>';
  el.querySelectorAll('[data-spot]').forEach(r => r.onclick = e => { if (e.target.closest('[data-delspot]')) return; const s = spots().find(o => o.id === +r.dataset.spot); if (s && map) map.setView([s.lat, s.lon], 12); });
  el.querySelectorAll('[data-delspot]').forEach(b => b.onclick = () => { if (confirm('이 포인트를 지울까요?')) { ls.set('m.spots', spots().filter(o => o.id !== +b.dataset.delspot)); drawSpots(); renderSpots(); } });
}
function locateMe(save) {
  if (!navigator.geolocation) { $('mapInfo').textContent = '이 브라우저는 위치를 지원하지 않습니다'; return; }
  $('mapInfo').textContent = '위치 확인 중… (권한을 허용해 주세요)';
  navigator.geolocation.getCurrentPosition(p => {
    myPos = { lat: p.coords.latitude, lon: p.coords.longitude };
    const r = nearestRegion(myPos.lat, myPos.lon), d = K.distance(myPos, r);
    $('mapInfo').textContent = `내 위치 ±${Math.round(p.coords.accuracy)}m · 가까운 지역 ${r.name} ${d.km.toFixed(1)}km`;
    if (map) { if (myMarker) map.removeLayer(myMarker); myMarker = L.circleMarker([myPos.lat, myPos.lon], { radius: 8, color: '#fff', weight: 3, fillColor: '#3D8BFF', fillOpacity: 1 }).bindTooltip('내 위치').addTo(map); map.setView([myPos.lat, myPos.lon], 11); }
    drawSpots(); renderSpots();
    if (save) saveSpot(myPos.lat, myPos.lon);
  }, err => { $('mapInfo').textContent = `위치를 받지 못했습니다 (${err.code === 1 ? '권한 거부' : '신호 없음'})`; }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
}
$('locBtn') && ($('locBtn').onclick = () => locateMe(false));
$('locSaveBtn') && ($('locSaveBtn').onclick = () => locateMe(true));

// ⑥ 바다 수온(내 위치) · 낚시 중 자동 위치 기록 · 사진 위치(EXIF GPS)
function curSst(x) { if (!x || !x.hours) return null; const n = new Date(), h = x.hours.find(o => o.day === iso(n) && o.hr === n.getHours() && o.sst != null) || x.hours.find(o => o.sst != null); return h ? h.sst : null; }
function sstHtml(v, sp) {
  const a = K.tempAdvice(v.t), rng = K.WATER[sp];
  const fit = rng ? (v.t < rng[0] ? `조금 차가워요(잘 무는 수온 ${rng[0]}~${rng[1]}℃)` : v.t > rng[1] ? `조금 높아요(잘 무는 수온 ${rng[0]}~${rng[1]}℃)` : `잘 맞아요(${rng[0]}~${rng[1]}℃)`) : '';
  return `<div class="hero" style="margin:6px 0"><div class="score" style="color:${a.color}">${v.t.toFixed(1)}<small>℃</small></div>
    <div><b style="color:${a.color}">${a.label}</b>${v.min != null ? ` · 이틀 사이 ${v.min.toFixed(1)}~${v.max.toFixed(1)}℃` : ''}
    <div class="small">${v.km ? `육지라 ${v.km}km 떨어진 바다 지점 값입니다` : '바로 이 자리의 값입니다'} · ${v.lat.toFixed(4)}, ${v.lon.toFixed(4)}</div>
    ${sp ? `<div class="small">${esc(sp)}: ${fit || '수온 자료 없음'}</div>` : ''}</div></div>
    <div class="small">이 수온에 잘 무는 어종: <b>${a.best.length ? a.best.map(esc).join(' · ') : '— (찬물·더운물 시기라 활성도 낮음)'}</b></div>
    <div class="small muted">Open-Meteo 해양 모델(위성 관측 기반 예측)의 표층 수온입니다. 바닥 수온·물때에 따라 실제와 다를 수 있어요. ${v.time ? `기준 ${String(v.time).replace('T', ' ')}` : ''}</div>`;
}
async function checkMySst() {
  const box = $('sstBox'); if (!navigator.geolocation) { box.textContent = '이 브라우저는 위치를 지원하지 않습니다'; return; }
  box.textContent = '위치 확인 중… (권한을 허용해 주세요)';
  navigator.geolocation.getCurrentPosition(async p => {
    myPos = { lat: p.coords.latitude, lon: p.coords.longitude }; box.textContent = '수온 받는 중…';
    try { const v = await K.seaTemp(myPos.lat, myPos.lon);
      if (!v) { box.textContent = '주변 20km 안에서 바다 수온 자료를 찾지 못했습니다. 바다 가까이에서 다시 눌러 주세요.'; return; }
      ls.set('m.sstMine', Object.assign({ at: Date.now() }, v)); box.innerHTML = sstHtml(v, $('sstSp').value); box.classList.remove('muted');
    } catch (e) { box.textContent = '수온을 받지 못했습니다(인터넷 연결 확인)'; }
  }, err => { box.textContent = `위치를 받지 못했습니다 (${err.code === 1 ? '권한 거부' : '신호 없음'})`; }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
}
if ($('sstSp')) {
  $('sstSp').innerHTML = Object.keys(K.WATER).map(s => `<option>${s}</option>`).join(''); $('sstSp').value = K.WATER[ls.get('m.sp', '')] ? ls.get('m.sp') : '쭈꾸미';
  $('sstBtn').onclick = checkMySst;
  const last = ls.get('m.sstMine', null); if (last && Date.now() - last.at < 6 * 3600000) { $('sstBox').innerHTML = sstHtml(last, $('sstSp').value) + `<div class="small muted">(${new Date(last.at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}에 확인한 값)</div>`; $('sstBox').classList.remove('muted'); }
  $('sstSp').onchange = () => { const v = ls.get('m.sstMine', null); if (v) $('sstBox').innerHTML = sstHtml(v, $('sstSp').value); };
}

// 낚시 중 자동 위치 기록(화면을 켠 동안) — 간격마다 또는 50m 이상 움직이면 한 점
const track = () => ls.get('m.track', []);
const trk = { watch: null, wake: null, last: 0, cur: null, line: null };
async function holdScreen() { try { if ('wakeLock' in navigator && !trk.wake && document.visibilityState === 'visible') { trk.wake = await navigator.wakeLock.request('screen'); trk.wake.addEventListener('release', () => trk.wake = null); } } catch (e) {} }
document.addEventListener('visibilitychange', () => { if (trk.watch != null && document.visibilityState === 'visible') holdScreen(); });
function trkPoint(p, force) {
  const pt = { lat: +p.coords.latitude.toFixed(6), lon: +p.coords.longitude.toFixed(6), acc: Math.round(p.coords.accuracy), spd: p.coords.speed != null ? +(p.coords.speed * 1.944).toFixed(1) : null, t: new Date().toISOString() };
  trk.cur = pt; myPos = { lat: pt.lat, lon: pt.lon };
  const all = track(), prev = all[all.length - 1], every = (+$('trkEvery').value || 3) * 60000;
  if (force || !prev || Date.now() - trk.last >= every || K.distance(prev, pt).km >= .05) {
    if (pt.acc > 200 && prev && !force) return renderTrack();   // 너무 부정확한 점은 건너뜀
    trk.last = Date.now(); ls.set('m.track', all.concat(pt).slice(-3000));
  }
  renderTrack();
}
function startTrack() {
  if (!navigator.geolocation) { $('trkBox').textContent = '이 브라우저는 위치를 지원하지 않습니다'; return; }
  trk.last = 0; $('trkBox').textContent = '위치 신호 찾는 중…';
  trk.watch = navigator.geolocation.watchPosition(p => trkPoint(p, trk.last === 0), err => { $('trkBox').textContent = `위치를 받지 못했습니다 (${err.code === 1 ? '권한 거부 — 브라우저 설정에서 위치를 허용해 주세요' : '신호 없음'})`; },
    { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 });
  holdScreen(); ls.set('m.trkOn', true); $('trkBtn').textContent = '⏸ 기록 멈춤'; $('trkBtn').setAttribute('aria-pressed', 'true');
}
function stopTrack() {
  if (trk.watch != null) navigator.geolocation.clearWatch(trk.watch); trk.watch = null;
  if (trk.wake) { trk.wake.release().catch(() => {}); trk.wake = null; }
  ls.set('m.trkOn', false); $('trkBtn').textContent = '▶ 기록 시작'; $('trkBtn').setAttribute('aria-pressed', 'false'); renderTrack();
}
function renderTrack() {
  const all = track(), box = $('trkBox'); if (!box) return;
  let km = 0; for (let i = 1; i < all.length; i++) km += K.distance(all[i - 1], all[i]).km;
  const last = all[all.length - 1], on = trk.watch != null;
  box.innerHTML = all.length ? `${on ? '<b style="color:var(--ok)">● 기록 중</b>' : '멈춤'} · 점 <b>${all.length}</b>개 · 이동 ${km.toFixed(1)}km${trk.cur && trk.cur.spd != null && on ? ` · 속도 ${trk.cur.spd}노트` : ''}
    <br>마지막 ${new Date(last.t).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · <b>${last.lat.toFixed(5)}, ${last.lon.toFixed(5)}</b> (±${last.acc}m) <button class="chip" data-savespot="${last.lat},${last.lon}">📍 포인트로</button> <button class="chip" id="trkSst">🌡 이 자리 수온</button>`
    : (on ? '위치 신호 찾는 중…' : '아직 기록이 없습니다. 배에 오르면 「▶ 기록 시작」을 누르세요.');
  const b = $('trkSst'); if (b) b.onclick = async () => { b.textContent = '받는 중…'; const v = await K.seaTemp(last.lat, last.lon).catch(() => null); b.textContent = v ? `🌡 ${v.t.toFixed(1)}℃ ${K.tempAdvice(v.t).label}` : '수온 자료 없음'; };
  if (map) { if (trk.line) map.removeLayer(trk.line); trk.line = null; if (all.length > 1) trk.line = L.polyline(all.map(p => [p.lat, p.lon]), { color: '#FFD166', weight: 3, opacity: .9, dashArray: '6 4' }).bindTooltip('내 이동 기록').addTo(map); }
}
if ($('trkBtn')) {
  $('trkBtn').onclick = () => trk.watch != null ? stopTrack() : startTrack();
  $('trkClear').onclick = () => { if (confirm('자동 위치 기록을 모두 지울까요? (저장한 포인트·조과 기록은 그대로)')) { ls.set('m.track', []); renderTrack(); } };
  $('trkGpx').onclick = () => { const all = track(); if (!all.length) return alert('기록이 없습니다');
    const gpx = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="SunsangHelper" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>낚시 이동 기록 ${iso(new Date(all[0].t))}</name><trkseg>\n${all.map(p => `<trkpt lat="${p.lat}" lon="${p.lon}"><time>${p.t}</time></trkpt>`).join('\n')}\n</trkseg></trk></gpx>`;
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([gpx], { type: 'application/gpx+xml' })); a.download = `fishing-track-${iso(new Date(all[0].t))}.gpx`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  renderTrack(); if (ls.get('m.trkOn', false)) startTrack();   // 앱을 다시 열면 이어서 기록
}

// 사진 속 GPS(EXIF) 읽기 — 휴대폰 카메라가 위치를 넣어 둔 경우
function exifGps(buf) {
  try { const v = new DataView(buf); if (v.getUint16(0) !== 0xFFD8) return null; let o = 2;
    while (o < v.byteLength - 10) { const m = v.getUint16(o), len = v.getUint16(o + 2);
      if (m === 0xFFE1 && v.getUint32(o + 4) === 0x45786966) { const t = o + 10, le = v.getUint16(t) === 0x4949, u16 = p => v.getUint16(p, le), u32 = p => v.getUint32(p, le);
        const ifd = t + u32(t + 4); let gps = 0; for (let i = 0; i < u16(ifd); i++) { const e = ifd + 2 + i * 12; if (u16(e) === 0x8825) gps = t + u32(e + 8); }
        if (!gps) return null; const g = {};
        for (let i = 0; i < u16(gps); i++) { const e = gps + 2 + i * 12, tag = u16(e), type = u16(e + 2);
          if (type === 2) g[tag] = String.fromCharCode(v.getUint8(e + 8)); else if (type === 5) { const p = t + u32(e + 8); g[tag] = [0, 1, 2].map(k => u32(p + k * 8) / (u32(p + k * 8 + 4) || 1)); } }
        const dms = a => a ? a[0] + a[1] / 60 + a[2] / 3600 : NaN; let lat = dms(g[2]), lon = dms(g[4]);
        if (!isFinite(lat) || !isFinite(lon) || (!lat && !lon)) return null; if (g[1] === 'S') lat = -lat; if (g[3] === 'W') lon = -lon; return { lat: +lat.toFixed(6), lon: +lon.toFixed(6), src: '사진 GPS' }; }
      if ((m & 0xFF00) !== 0xFF00) break; o += 2 + len; } } catch (e) {}
  return null;
}
let logPos = null;
function logPosNow() {   // 사진 GPS > 자동 기록 최근 점(10분 안) > 지금 위치
  if (logPos) return Promise.resolve(logPos);
  const t = track().slice(-1)[0]; if (t && Date.now() - new Date(t.t) < 600000) return Promise.resolve({ lat: t.lat, lon: t.lon, src: '자동 기록' });
  return new Promise(res => navigator.geolocation ? navigator.geolocation.getCurrentPosition(p => res({ lat: +p.coords.latitude.toFixed(6), lon: +p.coords.longitude.toFixed(6), src: '지금 위치' }), () => res(null), { enableHighAccuracy: true, timeout: 8000, maximumAge: 120000 }) : res(null));
}

// ⑤ 조과 일지(로그북): 기록 순간의 날씨·물때·솔루나를 자동 첨부, 금지체장 확인, 통계, CSV
const logs = () => ls.get('m.logs', []);
let logPhoto = null;
function logForm() {
  const f = $('logForm'); if (f.dataset.ready) return; f.dataset.ready = 1;
  $('lgSp').innerHTML = K.LEGAL.map(r => r.sp).concat(SPECIES).filter((v, i, a) => a.indexOf(v) === i).map(s => `<option>${s}</option>`).join('');
  $('lgSp').value = ls.get('m.sp', '우럭');
  $('lgRegion').innerHTML = REGIONS.map(r => `<option ${r.name === (ls.get('m.focus', watched[0])) ? 'selected' : ''}>${esc(r.name)}</option>`).join('');
  const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); $('lgAt').value = now.toISOString().slice(0, 16);
  const chk = () => { const c = K.legalCheck($('lgSp').value, $('lgSp').value === '문어' ? $('lgWt').value : $('lgLen').value, new Date($('lgAt').value || Date.now()));
    $('lgLegal').innerHTML = `<span style="color:${c.ok ? 'var(--ok)' : 'var(--bad)'}">${esc(c.msg)}</span>`; };
  ['lgSp', 'lgLen', 'lgWt', 'lgAt'].forEach(id => $(id).addEventListener('input', chk)); chk();
  $('lgPhoto').onchange = e => { const file = e.target.files[0]; if (!file) return; logPos = null; file.slice(0, 131072).arrayBuffer().then(b => { logPos = exifGps(b); $('lgPos').innerHTML = logPos ? `📍 사진 GPS: <b>${logPos.lat.toFixed(5)}, ${logPos.lon.toFixed(5)}</b> (사진 찍은 자리)` : '📍 사진에 위치 정보가 없어 저장할 때 지금 위치(또는 자동 기록의 마지막 위치)를 붙입니다.'; }).catch(() => {}); const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const k = Math.min(1, 640 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = img.width * k; c.height = img.height * k;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); logPhoto = c.toDataURL('image/jpeg', .7); URL.revokeObjectURL(url);
      $('lgPrev').innerHTML = `<img src="${logPhoto}" alt="조과 사진 미리보기" style="max-width:120px;border-radius:10px">`; }; img.src = url; };
  $('lgSave').onclick = saveLog;
}
async function saveLog() {
  $('lgMsg').textContent = '위치 확인 중…'; const pos = await logPosNow();
  const at = $('lgAt').value ? new Date($('lgAt').value) : new Date(), sp = $('lgSp').value, r = REGIONS.find(x => x.name === $('lgRegion').value) || REGIONS[0];
  const x = regionResult(r.name), h = x && x.hours ? x.hours.find(o => o.day === iso(at) && o.hr === at.getHours()) : null;
  const sol = K.solunar(at, r.lat, r.lon), ld = lunarDay(at), inPeriod = sol.periods.find(p => at >= p.from && at <= p.to);
  const legal = K.legalCheck(sp, sp === '문어' ? $('lgWt').value : $('lgLen').value, at);
  const e = { id: Date.now(), at: $('lgAt').value || at.toISOString().slice(0, 16), sp, len: +$('lgLen').value || null, wt: +$('lgWt').value || null, count: Math.max(1, +$('lgCount').value || 1),
    bait: $('lgBait').value.trim().slice(0, 30), method: $('lgMethod').value, region: r.name, memo: $('lgMemo').value.trim().slice(0, 200), released: !legal.ok || $('lgRel').checked,
    mul: ld ? `${mul(ld, mulMethodOf(r))} (물살 ${strength(ld)}%)` : '', moon: sol.moon.name, sol: inPeriod ? `${inPeriod.kind === 'major' ? '메이저' : '마이너'}(${inPeriod.label})` : '피딩 타임 밖',
    wx: h ? { wind: h.wind, gust: h.gust, wave: h.wave, sst: h.sst, wdir: K.dirName(h.wdir) } : null, photo: logPhoto, pos };
  const all = logs().concat(e);
  try { ls.set('m.logs', all); if (!localStorage.getItem('m.logs') || JSON.parse(localStorage.getItem('m.logs')).length !== all.length) throw 0; }
  catch (err) { e.photo = null; ls.set('m.logs', logs().concat(e)); alert('저장 공간이 부족해 사진 없이 저장했습니다. 오래된 사진 기록을 지우면 다시 사진을 넣을 수 있습니다.'); }
  if (pos && (!e.wx || e.wx.sst == null)) K.seaTemp(pos.lat, pos.lon).then(v => { if (!v) return; const all2 = logs(), o = all2.find(z => z.id === e.id); if (!o) return; o.wx = Object.assign(o.wx || {}, { sst: v.t }); ls.set('m.logs', all2); renderLog(); }).catch(() => {});
  logPos = null; $('lgPos').textContent = '📍 위치: 사진에 GPS 정보가 있으면 그 자리, 없으면 지금 위치(또는 자동 기록의 마지막 위치)를 붙입니다.';
  logPhoto = null; $('lgPrev').innerHTML = ''; $('lgPhoto').value = ''; $('lgLen').value = ''; $('lgWt').value = ''; $('lgMemo').value = ''; $('lgRel').checked = false;
  ls.set('m.sp', sp); mission('log'); renderLog();
  $('lgMsg').textContent = `저장했습니다 · ${pos ? `📍${pos.lat.toFixed(4)},${pos.lon.toFixed(4)}(${pos.src}) · ` : ''}${e.mul || ''} · ${e.sol}${e.wx ? ` · 풍속 ${e.wx.wind.toFixed(0)}m/s 파고 ${e.wx.wave != null ? e.wx.wave.toFixed(1) : '—'}m` : ' · (그 시각 예보 없음)'}`;
}
function renderLog() {
  logForm(); renderMission();
  const L_ = logs().slice().sort((a, b) => b.at.localeCompare(a.at)), st = K.logStats(L_);
  const bars = (arr, unit = '마리') => arr.slice(0, 6).map(o => `<div class="rrow" style="cursor:default;padding:6px 10px"><div><b>${esc(o.k)}</b></div><span class="small">${o.max ? `최대 ${o.max}cm` : ''}</span><span class="pill">${o.n}${unit}</span></div>`).join('') || '<div class="small muted">기록이 쌓이면 보입니다</div>';
  $('logStats').innerHTML = `<div class="small">총 <b>${st.total}</b>마리 · 출조 <b>${st.trips}</b>일${st.best ? ` · 최대어 <b>${esc(st.best.sp)} ${st.best.len}cm</b> (${st.best.at.slice(0, 10)})` : ''}</div>
    <div class="statGrid"><div><div class="small muted">어종별</div>${bars(st.species)}</div><div><div class="small muted">미끼·채비별</div>${bars(st.bait)}</div>
    <div><div class="small muted">물때별</div>${bars(st.mul)}</div><div><div class="small muted">시간대별</div>${bars(st.hour)}</div></div>`;
  $('logList').innerHTML = L_.length ? L_.slice(0, 50).map(e => `<div class="logItem">${e.photo ? `<img src="${e.photo}" alt="${esc(e.sp)} 사진">` : '<div class="noimg">🐟</div>'}
      <div><b>${esc(e.sp)}${e.len ? ` ${e.len}cm` : ''}${e.wt ? ` ${e.wt}g` : ''}${e.count > 1 ? ` ×${e.count}` : ''}</b>${e.released ? ' <span class="small" style="color:var(--sea)">방생</span>' : ''}
      <div class="small muted">${e.at.replace('T', ' ')} · ${esc(e.region)} · ${esc(e.method || '')} ${esc(e.bait || '')}</div>
      <div class="small">${esc(e.mul)} · ${esc(e.moon)} · ${esc(e.sol)}${e.wx ? ` · ${e.wx.wdir || ''}풍 ${(+e.wx.wind).toFixed(0)}m/s · 파고 ${e.wx.wave != null ? (+e.wx.wave).toFixed(1) : '—'}m${e.wx.sst != null ? ` · 수온 ${(+e.wx.sst).toFixed(1)}℃` : ''}` : ''}</div>
      ${e.pos ? `<div class="small">📍 ${(+e.pos.lat).toFixed(5)}, ${(+e.pos.lon).toFixed(5)} <span class="muted">(${esc(e.pos.src || '')})</span> <button class="chip" data-savespot="${e.pos.lat},${e.pos.lon}">포인트로</button></div>` : ''}
      ${e.memo ? `<div class="small">${esc(e.memo)}</div>` : ''}</div><button class="chip" data-dellog="${e.id}" aria-label="삭제">✕</button></div>`).join('')
    : '<div class="small muted">첫 조과를 기록해 보세요. 그 시각의 바람·파고·수온·물때·솔루나가 자동으로 붙습니다.</div>';
  $('logList').querySelectorAll('[data-dellog]').forEach(b => b.onclick = () => { if (confirm('이 기록을 지울까요?')) { ls.set('m.logs', logs().filter(o => o.id !== +b.dataset.dellog)); renderLog(); } });
}
$('lgCsv') && ($('lgCsv').onclick = () => {
  const cols = ['at', 'sp', 'len', 'wt', 'count', 'released', 'region', 'method', 'bait', 'mul', 'moon', 'sol', 'wind', 'wave', 'sst', 'lat', 'lon', 'memo'];
  const rows = logs().map(e => cols.map(c => { const v = ['wind', 'wave', 'sst'].includes(c) ? (e.wx || {})[c] : ['lat', 'lon'].includes(c) ? (e.pos || {})[c] : e[c]; return `"${String(v ?? '').replace(/"/g, '""')}"`; }).join(','));
  const blob = new Blob(['﻿' + [cols.join(',')].concat(rows).join('\r\n')], { type: 'text/csv' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `조과일지_${todayIso()}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
});
$('lgLegalAll') && ($('lgLegalAll').innerHTML = K.LEGAL.filter(r => r.min || r.closed).map(r => `<span class="chip" style="cursor:default">${r.sp} ${r.min ? `${r.min}${r.unit || 'cm'}` : ''}${r.closed ? ` · 금어기 ${Math.floor(r.closed[0] / 100)}/${r.closed[0] % 100}~${Math.floor(r.closed[1] / 100)}/${r.closed[1] % 100}` : ''}</span>`).join(''));

// ⑥ 오늘의 미션(앱들의 '포인트 충전소'처럼) — 게임 코인으로 보상
const MISSIONS = [{ k: 'tide', ic: '🌙', t: '솔루나 피딩 타임 확인', c: 10 }, { k: 'log', ic: '📒', t: '조과 1건 기록(방생도 OK)', c: 20 }, { k: 'spot', ic: '📍', t: '내 포인트 1곳 저장', c: 10 }];
function mission(k) {
  const m = ls.get('m.mission', {}); if (m.day !== todayIso()) { m.day = todayIso(); m.done = {}; }
  if (m.done[k]) return; m.done[k] = true; ls.set('m.mission', m);
  const ms = MISSIONS.find(o => o.k === k); addCoins(ms.c);
  if (Object.keys(m.done).length === MISSIONS.length && !m.bonus) { m.bonus = true; ls.set('m.mission', m); addCoins(30); }
  renderMission();
}
function renderMission() {
  const el = $('missions'); if (!el) return; const m = ls.get('m.mission', {}), done = m.day === todayIso() ? m.done || {} : {};
  el.innerHTML = MISSIONS.map(o => `<div class="rrow" style="cursor:default"><div><b>${o.ic} ${o.t}</b></div><span class="small">🪙 ${o.c}</span><span class="pill" style="color:${done[o.k] ? 'var(--ok)' : 'var(--muted)'}">${done[o.k] ? '완료' : '—'}</span></div>`).join('') +
    `<div class="small muted">셋 다 하면 보너스 🪙 30 · 코인은 게임 탭(낚시점·코디)에서 씁니다 · 지금 🪙 ${wallet.get().coins ?? 50}</div>`;
}

// ── 화면 전환 ──
function go(v) {
  document.querySelectorAll('[data-view]').forEach(s => s.hidden = s.dataset.view !== v);
  document.querySelectorAll('nav.tabbar button').forEach(b => b.setAttribute('aria-current', b.dataset.go === v ? 'page' : 'false'));
  if (v === 'map') { initMap(); renderSpots(); renderTrack(); setTimeout(() => map && map.invalidateSize(), 50); }
  if (v === 'game') initGames();
  if (v === 'more') renderMore();
  if (v === 'log') renderLog();
  if (v === 'tide') renderSolunar();
  if (v === 'hmi' && !results) refresh();
  if (v === 'hmi') ensureFun();
  // 오늘의 바다 소식 · 낚시점·선상: PC와 같은 화면(today.html · places.html)을 처음 열 때만 불러옴
  if (v === 'news' || v === 'places' || v === 'sea' || v === 'globe' || v === 'seamap') { const f = $(v + 'Frame'); if (!f.src) f.src = v === 'news' ? 'today.html' : v === 'sea' ? 'sea.html' : v === 'globe' ? 'globe.html' : v === 'seamap' ? 'seamap.html' : 'places.html'; }
  if (v !== 'news' && v !== 'places' && v !== 'sea' && v !== 'globe' && v !== 'seamap') ls.set('m.tab', v);
  scrollTo(0, 0);
}
document.querySelector('nav.tabbar').onclick = e => { const b = e.target.closest('button[data-go]'); if (b) go(b.dataset.go); };
document.addEventListener('click', e => { const b = e.target.closest('[data-goto]'); if (b) { e.preventDefault(); go(b.dataset.goto); } });

// ── 설치(PWA) ──
let deferred = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('installCard').style.display = 'grid'; });
$('installBtn').onclick = async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $('installCard').style.display = 'none'; };
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

renderHmi(); renderTide();
if (!results || Date.now() - results.at > 30 * 60000) refresh();
setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 30 * 60000);   // 30분마다(공개 API 예의상)
const TABS = ['hmi', 'tide', 'map', 'log', 'game', 'more', 'news', 'places', 'sea', 'globe', 'seamap'];
{ const h = location.hash.slice(1); go(TABS.includes(h) ? h : ls.get('m.tab', 'hmi')); }
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (TABS.includes(h)) go(h); });   // 앱 바로가기(#game 등)

// ── 🎡 오늘의 바다 놀이터(관제 화면 하단): 입질 예보·제철 달력·공개 조황·쇼츠·운세·만화·우주 웹툰 (fun.js, PC·조황 수첩과 같은 화면) ──
var funApi = null;   // var: go()가 이 줄보다 먼저 불릴 수 있음
function ensureFun() {
  if (funApi || !window.FunBoard || !$('funRoot')) return;
  funApi = FunBoard.mount($('funRoot'), { sea: window.SEA_DATA, today: window.TODAY_DATA, story: window.Story, net: true, open: k => go(k === 'comic' ? 'sea' : 'game') });
}
ensureFun();
