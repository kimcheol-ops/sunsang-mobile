/* 🗺 지도 스타일 고르기 — 모든 Leaflet 지도에서 같이 쓰는 공용 모듈
   MapStyle.attach(map)  : 고른 스타일을 깔고 오른쪽 위에 「🗺」 단추(미리보기 목록)를 붙임
   MapStyle.base(map)    : 단추 없이 고른 스타일만 깔기(작은 미리보기 지도용)
   고른 스타일은 이 기기에 기억되고(localStorage mapstyle.v1), 다른 지도에도 같이 적용됩니다.
   모두 키 없이 쓰는 무료 지도(출처 표기 유지). 위성 2종은 NASA가 하루 늦게 올리는 일별 사진. */
(function () {
  'use strict';
  if (!window.L) return;
  const KEY = 'mapstyle.v1';
  const OSMC = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
  const NASA = '<a href="https://earthdata.nasa.gov/gibs">NASA GIBS</a>';
  const GIBS = (layer, date, ext, level) => `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${date}/GoogleMapsCompatible_Level${level}/{z}/{y}/{x}.${ext}`;
  const OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const SAT = {
    true: { layer: 'VIIRS_SNPP_CorrectedReflectance_TrueColor', ext: 'jpg', level: 9, lag: 0 },
    lights: { layer: 'VIIRS_NOAA20_DayNightBand_At_Sensor_Radiance', ext: 'png', level: 8, lag: 0 },
  };
  const STYLES = [
    { id: 'dark', ic: '🌑', name: '관제 어두운', note: '기본 · 밤에 눈이 편함', url: OSM, o: { maxZoom: 19, className: 'msDark', attribution: OSMC } },
    { id: 'osm', ic: '🗺', name: '일반 지도', note: '길·마을 이름이 자세함', url: OSM, o: { maxZoom: 19, attribution: OSMC } },
    { id: 'light', ic: '⬜', name: '밝고 깔끔', note: '회색 바탕 · 표시물이 잘 보임', url: OSM, o: { maxZoom: 19, className: 'msLight', attribution: OSMC } },
    { id: 'night', ic: '🌌', name: '야간 관제', note: '검은 바탕 · 조용한 화면', url: OSM, o: { maxZoom: 19, className: 'msNight', attribution: OSMC } },
    { id: 'hot', ic: '🧭', name: '여행 지도', note: '선명한 색 · 항구·시설 강조', url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', o: { maxZoom: 19, subdomains: 'abc', attribution: `${OSMC} · HOT · OSM France` } },
    { id: 'topo', ic: '⛰', name: '지형·등고선', note: '산·해안 절벽 높낮이', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', o: { maxZoom: 17, subdomains: 'abc', attribution: `${OSMC} · SRTM · OpenTopoMap` } },
    { id: 'relief', ic: '🌊', name: '바다 지형', note: '바다 깊이를 색으로', url: GIBS('BlueMarble_ShadedRelief_Bathymetry', '2004-08-01', 'jpeg', 8), o: { maxNativeZoom: 8, maxZoom: 18, attribution: `${NASA} Blue Marble` } },
    { id: 'gebco', ic: '📏', name: '수심 지도', note: '국제 수심도 · 항해용 아님', wms: true, o: { layers: 'GEBCO_LATEST', format: 'image/png', transparent: false, maxZoom: 18, attribution: '<a href="https://www.gebco.net">GEBCO</a>' } },
    { id: 'true', ic: '🛰', name: '위성 실사', note: '그날 구름·해무까지(일별)', sat: 'true' },
    { id: 'lights', ic: '🔦', name: '밤바다 불빛', note: '집어등·항구 불빛(일별)', sat: 'lights' },
  ];
  const CSS = `
  .msDark { filter: invert(1) hue-rotate(180deg) brightness(.8) contrast(.9) saturate(.6); }
  .msLight { filter: grayscale(1) contrast(.85) brightness(1.08); }
  .msNight { filter: invert(1) grayscale(1) brightness(.62) contrast(1.1); }
  .msBtn { width: 36px; height: 36px; display: grid; place-items: center; font-size: 18px; background: #fff; color: #123; border: 0; border-radius: 6px; cursor: pointer; box-shadow: 0 1px 5px rgba(0,0,0,.35); }
  .msPop { position: absolute; right: 0; top: 42px; width: min(300px, calc(100vw - 40px)); max-height: min(70vh, 460px); overflow-y: auto; background: #17202A; color: #E6EEF0; border: 1px solid #34424E; border-radius: 10px; padding: 8px; box-shadow: 0 6px 22px rgba(0,0,0,.45); display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font: 12px 'Malgun Gothic','Apple SD Gothic Neo',sans-serif; }
  .msPop .msHead { grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: center; font-weight: 700; font-size: 13px; }
  .msPop .msHead button { background: none; border: 0; color: inherit; font-size: 16px; cursor: pointer; min-height: 28px; }
  .msCard { display: grid; gap: 2px; padding: 3px; border-radius: 8px; border: 2px solid transparent; background: #212C37; color: inherit; text-align: left; cursor: pointer; font: inherit; }
  .msCard[aria-pressed="true"] { border-color: #7FD6E8; }
  .msCard .th { position: relative; height: 52px; border-radius: 5px; overflow: hidden; background: #0E1216; }
  .msCard .th img { position: absolute; top: 0; width: 50%; height: 100%; object-fit: cover; } .msCard .th img + img { left: 50%; }
  .msCard .th .ph { display: grid; place-items: center; height: 100%; font-size: 22px; }
  .msCard b { font-size: 11.5px; } .msCard small { font-size: 10px; color: #93A8B0; line-height: 1.3; }
  .msRain { grid-column: 1 / -1; display: grid; gap: 1px; text-align: left; padding: 7px 9px; border-radius: 8px; border: 2px solid transparent; background: #212C37; color: inherit; font: 700 12px inherit; cursor: pointer; } .msRain small { font-weight: 400; font-size: 10px; color: #93A8B0; } .msRain[aria-pressed="true"] { border-color: #6FA8FF; background: #1E3350; }
  .msPop .msFoot { grid-column: 1 / -1; font-size: 10.5px; color: #93A8B0; }
  `;
  function css() { if (document.getElementById('mapstyle-css')) return; const s = document.createElement('style'); s.id = 'mapstyle-css'; s.textContent = CSS; document.head.appendChild(s); }
  const get = () => { try { return localStorage.getItem(KEY) || 'dark'; } catch (e) { return 'dark'; } };
  const put = v => { try { localStorage.setItem(KEY, v); } catch (e) {} };
  const ymd = d => d.toISOString().slice(0, 10);
  const probe = url => new Promise(res => { const im = new Image(); const t = setTimeout(() => res(false), 8000); im.onload = () => { clearTimeout(t); res(true); }; im.onerror = () => { clearTimeout(t); res(false); }; im.src = url; });
  const dates = {};
  async function latest(k) {
    if (dates[k] !== undefined) return dates[k];
    const c = SAT[k];
    for (let i = c.lag; i <= 20; i++) {
      const d = ymd(new Date(Date.now() - i * 86400000)), t = GIBS(c.layer, d, c.ext, c.level);
      if (await probe(t.replace('{z}/{y}/{x}', '5/12/27'))) return (dates[k] = d);
    }
    return (dates[k] = null);
  }
  async function makeLayer(st) {
    if (st.sat) { const d = await latest(st.sat); if (!d) return null; const c = SAT[st.sat]; return L.tileLayer(GIBS(c.layer, d, c.ext, c.level), { maxNativeZoom: c.level, maxZoom: 18, attribution: `${NASA} ${st.name} ${d}` }); }
    return st.wms ? L.tileLayer.wms('https://wms.gebco.net/mapserv?', st.o) : L.tileLayer(st.url, st.o);
  }
  // 미리보기: 한반도 서남해 z7 타일 두 장
  const PREV = [[7, 108, 50], [7, 109, 51]];
  function prevUrl(st, z, x, y) {
    if (st.wms) { const W = 40075016.686, H = 20037508.343, n = Math.pow(2, z); return `https://wms.gebco.net/mapserv?service=WMS&request=GetMap&version=1.1.1&layers=GEBCO_LATEST&styles=&format=image/png&srs=EPSG:3857&width=128&height=128&bbox=${x / n * W - H},${H - (y + 1) / n * W},${(x + 1) / n * W - H},${H - y / n * W}`; }
    const u = st.sat ? GIBS(SAT[st.sat].layer, dates[st.sat], SAT[st.sat].ext, SAT[st.sat].level) : st.url;
    return u.replace('{s}', 'a').replace('{z}', z).replace('{x}', x).replace('{y}', y);
  }
  function thumb(st) {
    if (st.sat && !dates[st.sat]) return `<div class="ph">${st.ic}</div>`;
    return PREV.map(([z, x, y]) => `<img alt="" loading="lazy" src="${prevUrl(st, z, x, y)}"${st.o && st.o.className ? ` class="${st.o.className}"` : ''}>`).join('');
  }

  // 🌧 비구름 겹쳐 보기: NASA GIBS IMERG 30분 강수(키 없음). 위성으로 계산해 몇 시간 늦게 올라오는 자료 — 실시간 레이더 아님
  const RAIN_KEY = 'mapstyle.rain';
  const rainOn = () => { try { return localStorage.getItem(RAIN_KEY) === '1'; } catch (e) { return false; } };
  function rainLayer() { return L.tileLayer(GIBS('IMERG_Precipitation_Rate_30min', 'default', 'png', 6), { maxNativeZoom: 6, maxZoom: 18, opacity: 0.75, zIndex: 350, attribution: `${NASA} IMERG 강수(늦은 자료)` }); }
  function applyRain(map, on) { if (map._msRain) { map.removeLayer(map._msRain); map._msRain = null; } if (on) map._msRain = rainLayer().addTo(map); }
  function setRain(on) { try { localStorage.setItem(RAIN_KEY, on ? '1' : '0'); } catch (e) {} maps.forEach(m => { if (m._container && m._container.isConnected) applyRain(m, on); }); document.querySelectorAll('.msRain').forEach(b => b.setAttribute('aria-pressed', on)); }
  const maps = [];
  async function apply(map, id) {
    const st = STYLES.find(s => s.id === id) || STYLES[0];
    const lyr = await makeLayer(st);
    if (!lyr) return false;
    if (map._msBase) map.removeLayer(map._msBase);
    map._msBase = lyr.addTo(map); lyr.bringToBack(); map._msId = st.id;
    return true;
  }
  async function setAll(id) {
    put(id);
    for (const m of maps.slice()) { if (!m._container || !m._container.isConnected) { maps.splice(maps.indexOf(m), 1); continue; } await apply(m, id); }
    document.querySelectorAll('.msCard').forEach(b => b.setAttribute('aria-pressed', b.dataset.ms === id));
  }
  function base(map) { css(); maps.push(map); if (rainOn()) applyRain(map, true); apply(map, get()).then(ok => { if (!ok) apply(map, 'dark'); }); return map; }
  function attach(map) {
    base(map);
    const Ctl = L.Control.extend({
      options: { position: 'topright' },
      onAdd() {
        const wrap = L.DomUtil.create('div', 'leaflet-control msWrap');
        wrap.style.position = 'relative';
        wrap.innerHTML = `<button type="button" class="msBtn" title="지도 스타일 바꾸기" aria-label="지도 스타일 바꾸기">🗺</button>`;
        L.DomEvent.disableClickPropagation(wrap); L.DomEvent.disableScrollPropagation(wrap);
        let pop = null, lastT = 0;
        const draw = () => { pop.innerHTML = `<div class="msHead">🗺 지도 스타일<button type="button" data-x aria-label="닫기">✕</button></div>` + `<button type="button" class="msRain" data-rain aria-pressed="${rainOn()}">🌧 비구름 겹쳐 보기 <small>NASA 위성 강수 · 몇 시간 늦은 자료(실시간 레이더 아님)</small></button>` + STYLES.map(st => `<button type="button" class="msCard" data-ms="${st.id}" aria-pressed="${st.id === (map._msId || get())}"><div class="th">${thumb(st)}</div><b>${st.ic} ${st.name}</b><small>${st.note}</small></button>`).join('') + `<div class="msFoot">고른 스타일은 이 기기에 기억되고 다른 지도에도 같이 적용돼요. 모두 무료 지도예요.</div>`; };
        wrap.firstChild.onclick = () => {
          const now = Date.now(); if (now - lastT < 450) return; lastT = now; // 터치 화면에서 한 번 눌렀는데 두 번 들어오는 것 막기
          if (pop) { pop.remove(); pop = null; return; }
          pop = document.createElement('div'); pop.className = 'msPop'; pop.style.maxHeight = Math.max(160, map.getSize().y - 52) + 'px'; wrap.appendChild(pop); draw();
          pop.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.hasAttribute('data-x')) { pop.remove(); pop = null; return; } if (b.hasAttribute('data-rain')) { setRain(!rainOn()); return; } if (b.dataset.ms) setAll(b.dataset.ms); };
          Promise.all(Object.keys(SAT).map(latest)).then(() => { if (pop) draw(); });
        };
        return wrap;
      }
    });
    map.addControl(new Ctl());
    return map;
  }
  window.MapStyle = { attach, base, STYLES, set: setAll, get, rain: setRain };
})();
