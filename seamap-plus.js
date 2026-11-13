/* 🗺 해상 지도 더하기 (v5.7) — SeaMapPlus.attach(map, box, opt)
 *  · 📍 포인트: OpenStreetMap(Overpass) — 방파제·갯바위·낚시 자리 / 항구·선착장 / 화장실 / 주차(무료·유료) / 낚시점 / 위험·금지(낚시 금지 표시·제한 구역·항로·암초)
 *  · 🐟 어종별 추정 포인트: 바닥 모양(바위·모래·갯벌)과 어종이 사는 층·수심·제철로 '있을 만한 곳'을 그림 — 실제 조과 아님
 *  · 📷 현장 사진: 위키미디어 공용(자유 라이선스, 저작자·라이선스 표시) · 한국관광공사 공공 사진(seamap-photos.js, 키 있을 때 만듦) · 내 사진(이 기기 IndexedDB에만)
 *  · 🌊 바다 속: 공개 수심 지형 타일(AWS Terrain Tiles — 바다는 GEBCO·ETOPO1 기반)로 수심 색·등고선 / 단면도(어종 층) / 3D 바다 속
 *  개인정보: 위치를 추적하지 않음. 내 사진은 이 기기에만 저장.
 */
window.SeaMapPlus = (function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const TERR = (z, x, y) => `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;
  const TERR_ATTR = '수심·지형: <a href="https://registry.opendata.aws/terrain-tiles/">AWS Terrain Tiles</a> (바다: GEBCO·ETOPO1)';
  const OVP = ['https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
  const BANDS = [[0, 5, '#BFE9F2'], [5, 10, '#8FD6E8'], [10, 20, '#5CC0DC'], [20, 30, '#3AA3CC'], [30, 50, '#2A82B8'], [50, 100, '#1F63A0'], [100, 200, '#184A86'], [200, 99999, '#10306A']];
  const KINDS = {
    fish: ['🎣', '방파제·갯바위·낚시 자리'], port: ['⛴', '항구·선착장·출항지'], wc: ['🚻', '화장실'], park: ['🅿', '주차장'], shop: ['🏪', '낚시점'], danger: ['⛔', '위험·금지 구역']
  };
  const tiles = new Map();
  function tile(z, x, y) {
    const k = z + '/' + x + '/' + y; if (tiles.has(k)) return tiles.get(k);
    const p = new Promise(res => { const im = new Image(); im.crossOrigin = 'anonymous';
      im.onload = () => { try { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, 256, 256).data, e = new Float32Array(65536); for (let i = 0; i < 65536; i++) e[i] = d[i * 4] * 256 + d[i * 4 + 1] + d[i * 4 + 2] / 256 - 32768; res(e); } catch (x) { res(null); } };
      im.onerror = () => res(null); im.src = TERR(z, x, y); });
    tiles.set(k, p); if (tiles.size > 240) tiles.delete(tiles.keys().next().value); return p;
  }
  const lon2x = (lon, z) => (lon + 180) / 360 * 2 ** z;
  const lat2y = (lat, z) => { const r = lat * Math.PI / 180; return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * 2 ** z; };
  // 바다 수심은 z10까지만 들어 있음(그 위는 0) → 수심 읽기는 z10 이하로
  async function elevAt(lat, lon, z) { z = Math.min(10, z || 10); const fx = lon2x(lon, z), fy = lat2y(lat, z), x = Math.floor(fx), y = Math.floor(fy); const t = await tile(z, x, y); if (!t) return null; return t[Math.min(255, Math.floor((fy - y) * 256)) * 256 + Math.min(255, Math.floor((fx - x) * 256))]; }
  function hav(a, b) { const R = 6371000, p = Math.PI / 180, dl = (b[0] - a[0]) * p, dn = (b[1] - a[1]) * p; const h = Math.sin(dl / 2) ** 2 + Math.cos(a[0] * p) * Math.cos(b[0] * p) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }
  const range = s => { const m = String(s || '').match(/(\d+)\s*-\s*(\d+)/); return m ? [+m[1], +m[2]] : [0, 30]; };

  function attach(map, box, opt) {
    opt = opt || {};
    const L = window.L, SD = opt.sea || window.SEA_DATA, month = new Date().getMonth() + 1;
    const SPEC = SD ? SD.species.filter(s => s.kind !== 'etc') : [];
    const st = { kinds: { fish: true, port: true, danger: true }, pois: [], loading: false, cache: {}, sp: '', photos: { commons: false, kto: false, mine: true }, place: null, profile: null, depthOn: false };
    try { Object.assign(st.kinds, JSON.parse(localStorage.getItem('smp.kinds') || 'null') || {}); } catch (e) {}
    const G = { poi: L.layerGroup().addTo(map), est: L.layerGroup().addTo(map), commons: L.layerGroup(), kto: L.layerGroup(), mine: L.layerGroup().addTo(map), prof: L.layerGroup().addTo(map) };
    const kakao = (n, la, lo) => `https://map.kakao.com/link/map/${encodeURIComponent(n || '여기')},${la},${lo}`;
    const inSeason = SPEC.filter(s => s.months.includes(month)), other = SPEC.filter(s => !s.months.includes(month));

    box.innerHTML = `
      <h2>📍 낚시 포인트·편의시설 <span class="muted small">OpenStreetMap</span></h2>
      ${Object.keys(KINDS).map(k => `<label class="row"><input type="checkbox" data-k="${k}" ${st.kinds[k] ? 'checked' : ''}><span>${KINDS[k][0]} ${KINDS[k][1]}${k === 'park' ? '<small>무료·유료 표시는 지도에 적힌 곳만</small>' : k === 'danger' ? '<small>낚시 금지 표시·제한 구역·항로·암초 (지도에 적힌 곳만 — 현장 안내판이 우선)</small>' : ''}</span></label>`).join('')}
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><button id="smpLoad" class="primary">이 화면 포인트 불러오기</button><span class="small muted" id="smpStat">조금 확대(시·군 크기)하면 자동으로 불러와요.</span></div>
      <h2>🐟 어종별 추정 포인트</h2>
      <div style="display:flex;gap:6px;align-items:center">어종 <select id="smpSp" style="flex:1;min-width:0"><option value="">고르지 않음</option><optgroup label="지금 제철">${inSeason.map(s => `<option value="${s.id}">${esc(s.emo + ' ' + s.name)}</option>`).join('')}</optgroup><optgroup label="다른 달">${other.map(s => `<option value="${s.id}">${esc(s.emo + ' ' + s.name)}</option>`).join('')}</optgroup></select></div>
      <div class="small muted" id="smpSpInfo">어종을 고르면 바닥 모양(바위·모래·갯벌)과 사는 수심이 맞는 곳을 점선 원으로 보여 줘요. <b>실제 조과가 아닌 추정</b>이에요.</div>
      <h2>📷 현장 사진</h2>
      <label class="row"><input type="checkbox" data-ph="commons"><span>위키미디어 공용 사진<small>누구나 쓸 수 있게 공개된 사진 — 찍은 사람·라이선스를 함께 표시</small></span></label>
      <label class="row"><input type="checkbox" data-ph="kto"><span>한국관광공사 공공 사진<small id="smpKtoInfo"></small></span></label>
      <label class="row"><input type="checkbox" data-ph="mine" checked><span>내가 찍은 사진<small>이 기기에만 저장 — 어디에도 올리지 않아요</small></span></label>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><button id="smpAddPh">📷 내 사진 지도에 놓기</button><input type="file" id="smpFile" accept="image/*" hidden></div>
      <div class="small muted" id="smpPhInfo"></div>
      <h2>🌊 바다 속 지도</h2>
      <label class="row"><input type="checkbox" id="smpDepth"><span>수심 색·등고선<small>공개 수심 자료(약 450m 간격, 바다: GEBCO·ETOPO1) — 항해용 아님</small></span></label>
      <div class="legend" id="smpBands">${BANDS.map(b => `<span><i style="background:${b[2]}"></i>${b[1] > 9999 ? b[0] + 'm+' : b[0] + '–' + b[1] + 'm'}</span>`).join('')}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><button id="smpProf">📏 단면도 그리기</button><button id="smpCube" class="primary">🧊 3D 바다 속 보기</button></div>
      <div class="small muted" id="smpProfInfo">단면도: 버튼을 누르고 지도에서 두 곳을 차례로 누르면 바닷속 단면과 층별 어종이 나와요.</div>`;
    const $ = s => box.querySelector(s);
    const ktoN = (window.SEAMAP_PHOTOS && window.SEAMAP_PHOTOS.list || []).length;
    $('#smpKtoInfo').textContent = ktoN ? `공공누리 사진 ${ktoN}장 (출처: 한국관광공사)` : '공공데이터포털 TourAPI 키(무료)가 있어야 채워져요 — 키를 저장하면 매일 작업이 사진을 받아요';

    /* ── 📍 OSM 포인트 ── */
    function classify(t) {
      if (t.fishing === 'no' || t['seamark:type'] === 'restricted_area' || t['seamark:type'] === 'fairway' || t['seamark:type'] === 'precautionary_area' || t.natural === 'reef' || t['seamark:type'] === 'anchorage')
        return ['danger', t.fishing === 'no' ? '⛔ 낚시 금지 표시' : t.natural === 'reef' ? '⚠ 암초' : t['seamark:type'] === 'fairway' ? '🚢 항로' : t['seamark:type'] === 'anchorage' ? '⚓ 정박지' : t['seamark:type'] === 'precautionary_area' ? '⚠ 주의 구역' : '⛔ 제한 구역'];
      if (t.leisure === 'fishing') return ['fish', '🎣 낚시 자리'];
      if (/^(breakwater|groyne)$/.test(t.man_made || '')) return ['fish', '🧱 방파제'];
      if (t.man_made === 'pier') return ['fish', '🪵 잔교·부두'];
      if (t.amenity === 'ferry_terminal') return ['port', '⛴ 여객선 터미널'];
      if (t.leisure === 'marina' || t.leisure === 'slipway' || t.harbour || t.landuse === 'harbour') return ['port', t.leisure === 'slipway' ? '🚤 배 내리는 곳' : '⚓ 항구·마리나'];
      if (t.amenity === 'toilets') return ['wc', '🚻 화장실'];
      if (t.amenity === 'parking') return ['park', t.fee === 'no' ? '🅿 무료 주차' : t.fee === 'yes' ? '🅿 유료 주차' : '🅿 주차(요금 정보 없음)'];
      if (/^(fishing|outdoor)$/.test(t.shop || '')) return ['shop', '🏪 낚시점'];
      if (t.natural === 'beach' || t.wetland === 'tidalflat' || t.natural === 'bare_rock' || t.natural === 'cliff') return ['_hab', ''];
      return null;
    }
    function habitat(t) { if (t.natural === 'beach') return t.surface && /rock|stone|pebble|gravel/.test(t.surface) ? 'rock' : 'sand'; if (t.wetland === 'tidalflat') return 'flat'; if (t.natural === 'bare_rock' || t.natural === 'cliff' || t.natural === 'reef') return 'rock'; if (/breakwater|groyne/.test(t.man_made || '')) return 'rock'; if (t.man_made === 'pier' || t.leisure === 'fishing') return 'pier'; return ''; }
    async function loadPois(force) {
      if (st.loading) return; const z = map.getZoom(), stat = $('#smpStat');
      if (z < 11) { stat.textContent = '조금 더 확대하면(시·군 크기) 불러와요.'; if (force) stat.textContent = '너무 넓어요 — 조금 더 확대해 주세요.'; return; }
      const b = map.getBounds(), q = v => Math.round(v * 20) / 20, key = [q(b.getSouth()), q(b.getWest()), q(b.getNorth()), q(b.getEast())].join(',');
      if (st.cache[key]) { st.pois = st.cache[key]; drawPois(); return; }
      const bb = `(${b.getSouth().toFixed(4)},${b.getWest().toFixed(4)},${b.getNorth().toFixed(4)},${b.getEast().toFixed(4)})`;
      const qry = `[out:json][timeout:25];(nwr["man_made"~"^(breakwater|pier|groyne)$"]${bb};nwr["leisure"~"^(fishing|marina|slipway)$"]${bb};nwr["amenity"="ferry_terminal"]${bb};nwr["harbour"]${bb};nwr["landuse"="harbour"]${bb};node["amenity"="toilets"]${bb};nwr["amenity"="parking"]${bb};nwr["shop"~"^(fishing|outdoor)$"]${bb};nwr["fishing"="no"]${bb};nwr["seamark:type"~"^(restricted_area|fairway|anchorage|precautionary_area)$"]${bb};nwr["natural"~"^(beach|reef|bare_rock|cliff)$"]${bb};nwr["wetland"="tidalflat"]${bb};);out center 2500;`;
      st.loading = true; stat.textContent = '포인트 받는 중…';
      let j = null;
      for (const u of OVP) { try { const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 28000); const r = await fetch(u, { method: 'POST', body: 'data=' + encodeURIComponent(qry), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: ctl.signal }); clearTimeout(tm); if (r.ok) { j = await r.json(); break; } } catch (e) {} }
      st.loading = false;
      if (!j) { drawPois(); stat.textContent = '지도 자료 서버가 바빠요(공공데이터 주차장만 표시).';  stat.textContent += ' 잠시 뒤 「이 화면 포인트 불러오기」를 다시 눌러 주세요.'; return; }
      st.pois = (j.elements || []).map(e => { const t = e.tags || {}, c = classify(t), la = e.lat != null ? e.lat : e.center && e.center.lat, lo = e.lon != null ? e.lon : e.center && e.center.lon; return c && la != null ? { k: c[0], lab: c[1], name: t['name:ko'] || t.name || '', t, lat: la, lon: lo, hab: habitat(t), id: e.type + e.id } : null; }).filter(Boolean);
      st.cache[key] = st.pois; drawPois();
    }
    function poiPopup(p) {
      const t = p.t, extra = [t.opening_hours && '🕐 ' + t.opening_hours, t.fee && (t.fee === 'no' ? '요금 없음' : t.fee === 'yes' ? '요금 있음' : '요금 ' + t.fee), t.capacity && '주차 ' + t.capacity + '대', t.access === 'no' && '⛔ 출입 금지 표시', t.access === 'private' && '🔒 사유지', t.operator && '운영 ' + t.operator, t['seamark:restricted_area:category'] && '구역 ' + t['seamark:restricted_area:category']].filter(Boolean);
      return `<b>${esc(p.lab)}</b> ${esc(p.name)}<div class="muted small">${extra.map(esc).join(' · ') || '추가 정보 없음'}</div><div class="small" data-dep="${p.lat},${p.lon}">수심 확인 중…</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px"><a href="${kakao(p.name || p.lab, p.lat, p.lon)}" target="_blank" rel="noopener">카카오맵</a><a href="https://www.openstreetmap.org/${p.id.replace(/^(node|way|relation)/, '$1/')}" target="_blank" rel="noopener">OSM 원본</a></div>
        <div class="muted small">© OpenStreetMap 기여자 · 현장 안내판·통제가 우선이에요</div>`;
    }
    function drawPois() {
      G.poi.clearLayers(); const shown = st.pois.filter(p => p.k !== '_hab' && st.kinds[p.k]);
      shown.slice(0, 900).forEach(p => L.marker([p.lat, p.lon], { icon: L.divIcon({ className: 'smpIc', html: `<span>${p.lab.split(' ')[0]}</span>`, iconSize: [22, 22] }), title: p.name || p.lab }).bindPopup(() => poiPopup(p), { maxWidth: 260 }).addTo(G.poi));
      // 공공데이터 주차장(전국주차장정보표준데이터 — 공영·민영, 요금): 지도 화면 안만
      let pubN = 0; const PD = window.PUBLIC_PARKING;
      if (st.kinds.park && PD && PD.parking && map.getZoom() >= 11) { const bb = map.getBounds();
        PD.parking.filter(p => bb.contains([p[1], p[2]])).slice(0, 400).forEach(p => { pubN++; const free = /무료/.test(p[4]);
          L.marker([p[1], p[2]], { icon: L.divIcon({ className: 'smpIc', html: `<span style="border-color:${free ? '#6FD3A4' : '#F5C46B'}">🅿</span>`, iconSize: [22, 22] }), title: p[0] })
            .bindPopup(`<b>🅿 ${esc(p[0])}</b> <span class="muted small">${esc(p[3])}</span><div class="small"><b style="color:${free ? '#6FD3A4' : '#F5C46B'}">${esc(p[4] || '요금 정보 없음')}</b>${p[6] && p[6] !== '0' ? ` · 기본 ${esc(p[5])}분 ${Number(p[6]).toLocaleString()}원` : ''}${p[7] ? ` · ${esc(p[7])}대` : ''}</div><div class="muted small">${esc(p[8])}${p[10] ? ' · ' + esc(p[10]) : ''}${p[9] ? ' · ☎ ' + esc(p[9]) : ''}</div><div class="small" data-dep="${p[1]},${p[2]}"></div><a href="${kakao(p[0], p[1], p[2])}" target="_blank" rel="noopener">카카오맵</a><div class="muted small">출처: 전국주차장정보표준데이터(공공데이터포털) · ${esc(PD.updated)}</div>`, { maxWidth: 260 }).addTo(G.poi); }); }
      const cnt = k => st.pois.filter(p => p.k === k).length + (k === 'park' ? pubN : 0);
      $('#smpStat').textContent = st.pois.length ? `이 화면: ${Object.keys(KINDS).map(k => KINDS[k][0] + cnt(k)).join(' ')}` : '이 화면에는 지도에 적힌 포인트가 없어요.';
      drawEst();
    }
    map.on('popupopen', e => { const el = e.popup.getElement && e.popup.getElement(); const d = el && el.querySelector('[data-dep]'); if (!d) return; const [la, lo] = d.dataset.dep.split(',').map(Number);
      elevAt(la, lo).then(v => { d.textContent = v == null ? '수심 자료 없음' : v > 0.5 ? `육지·해안 (높이 약 ${Math.round(v)}m)` : `주변 수심 약 ${Math.max(0, Math.round(-v))}m (공개 수심 자료 — 실제와 다를 수 있음)`; }); });
    box.querySelectorAll('[data-k]').forEach(cb => cb.onchange = () => { st.kinds[cb.dataset.k] = cb.checked; try { localStorage.setItem('smp.kinds', JSON.stringify(st.kinds)); } catch (e) {} drawPois(); });
    $('#smpLoad').onclick = () => loadPois(true);
    let mvT = 0; map.on('moveend', () => { clearTimeout(mvT); mvT = setTimeout(() => { if (Object.values(st.kinds).some(Boolean) || st.sp) loadPois(false); if (st.photos.commons) loadCommons(); }, 900); });

    /* ── 🐟 어종 추정 ── */
    function spInfo(s) { const [a, b] = range(s.depth), lay = SD.LAYER[s.layer] || [s.layer, '']; return `${s.emo} <b>${esc(s.name)}</b> — ${esc(lay[0])}(${esc(lay[1])}) · 수심 ${a}~${b}m · ${s.months.join('·')}월 ${s.months.includes(month) ? '<b style="color:#6FD3A4">지금 제철</b>' : '(지금은 제철 아님)'}<br>잡는 법: ${esc(s.how)}${s.ban ? `<br><span style="color:#FF8A8D">금어기 ${esc(s.ban)}</span>` : ''}${s.size ? ` · 금지 체장 ${esc(s.size)}` : ''}`; }
    function fits(s, hab) { const L0 = s.layer; if (L0 === 'rock') return hab === 'rock' || hab === 'pier'; if (L0 === 'bot') return hab === 'sand' || hab === 'pier'; if (L0 === 'flat') return hab === 'flat' || hab === 'sand'; return hab === 'pier' || hab === 'rock'; }
    function drawEst() {
      G.est.clearLayers(); const s = SPEC.find(x => x.id === st.sp); if (!s) return;
      const cand = st.pois.filter(p => p.hab && fits(s, p.hab)); const seen = [];
      cand.forEach(p => { if (seen.some(q => hav([q.lat, q.lon], [p.lat, p.lon]) < 250)) return; seen.push(p); });
      seen.slice(0, 160).forEach(p => L.circleMarker([p.lat, p.lon], { radius: 13, color: '#F5C46B', weight: 2, dashArray: '4 4', fillColor: '#F5C46B', fillOpacity: .12 })
        .bindTooltip(`${s.emo} ${s.name} 추정`, { direction: 'top' }).bindPopup(`<b>${s.emo} ${esc(s.name)} — 있을 만한 곳(추정)</b><div class="small">이유: ${{ rock: '바위·방파제 주변', pier: '잔교·낚시 자리(물 깊이가 있는 곳)', sand: '모래 바닥', flat: '갯벌' }[p.hab]} ${esc(p.name)}</div><div class="small">${spInfo(s)}</div><div class="muted small">바닥 모양과 어종 습성으로 그린 추정이에요. 실제 조과·포인트 정보가 아니에요.</div>`).addTo(G.est));
      $('#smpSpInfo').innerHTML = spInfo(s) + `<div class="muted">${map.getZoom() < 11 ? '조금 확대하면 이 화면의 추정 포인트가 나와요.' : `이 화면 추정 포인트 ${seen.length}곳 (점선 원)`}${st.depthOn ? ' · 수심 지도에서 이 어종 수심대를 밝게 보여 줘요.' : ''}</div>`;
    }
    $('#smpSp').onchange = e => { st.sp = e.target.value; drawEst(); if (depthLayer) depthLayer.redraw(); if (st.sp && !st.pois.length) loadPois(false); };

    /* ── 📷 사진 ── */
    const strip = h => { const d = document.createElement('div'); d.innerHTML = String(h || ''); return (d.textContent || '').trim().slice(0, 60); };
    let cmT = 0;
    async function loadCommons() {
      const c = map.getCenter(), b = map.getBounds(), rad = Math.min(10000, Math.max(1000, Math.round(hav([b.getSouth(), b.getWest()], [b.getNorth(), b.getEast()]) / 2)));
      if (map.getZoom() < 9) { $('#smpPhInfo').textContent = '사진은 조금 확대하면 나와요.'; return; }
      const my = ++cmT; $('#smpPhInfo').textContent = '사진 찾는 중…';
      try {
        const j = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=geosearch&ggscoord=${c.lat.toFixed(4)}|${c.lng.toFixed(4)}&ggsradius=${rad}&ggsnamespace=6&ggslimit=40&prop=imageinfo|coordinates&iiprop=url|extmetadata&iiurlwidth=320&format=json&origin=*`).then(r => r.json());
        if (my !== cmT) return; G.commons.clearLayers();
        const ps = Object.values((j.query || {}).pages || {}).filter(p => p.coordinates && p.imageinfo);
        ps.forEach(p => { const ii = p.imageinfo[0], m = ii.extmetadata || {}, lic = (m.LicenseShortName || {}).value || '', who = strip((m.Artist || {}).value) || '저작자 표시 참고', ttl = p.title.replace(/^File:/, '').replace(/\.[a-z]+$/i, '');
          L.marker([p.coordinates[0].lat, p.coordinates[0].lon], { icon: L.divIcon({ className: 'smpIc ph', html: '<span>📷</span>', iconSize: [22, 22] }) })
            .bindPopup(`<img src="${esc(ii.thumburl)}" alt="${esc(ttl)}" style="width:240px;max-width:100%;border-radius:6px;display:block"><div class="small">${esc(ttl)}</div><div class="muted small">📷 ${esc(who)} · ${esc(lic)} · 위키미디어 공용</div><a href="${esc(ii.descriptionurl)}" target="_blank" rel="noopener">원본·저작자·라이선스 보기</a>`, { maxWidth: 260 }).addTo(G.commons); });
        $('#smpPhInfo').textContent = ps.length ? `위키미디어 공용 사진 ${ps.length}장 (사진마다 찍은 사람·라이선스 표시)` : '이 근처에는 공개 사진이 아직 없어요.';
      } catch (e) { $('#smpPhInfo').textContent = '사진을 받지 못했어요 (인터넷 연결 확인).'; }
    }
    function drawKto() {
      G.kto.clearLayers(); const P = window.SEAMAP_PHOTOS; if (!P || !P.list) return;
      P.list.forEach(p => L.marker([p.lat, p.lon], { icon: L.divIcon({ className: 'smpIc ph', html: '<span>🏞</span>', iconSize: [22, 22] }) })
        .bindPopup(`<img src="${esc(p.img)}" alt="${esc(p.t)}" style="width:240px;max-width:100%;border-radius:6px;display:block"><div class="small"><b>${esc(p.t)}</b> ${esc(p.addr || '')}</div><div class="muted small">출처: 한국관광공사 ${esc(p.lic || '공공누리')}</div>`, { maxWidth: 260 }).addTo(G.kto));
    }
    box.querySelectorAll('[data-ph]').forEach(cb => cb.onchange = () => { const k = cb.dataset.ph; st.photos[k] = cb.checked; const g = G[k];
      if (cb.checked) { g.addTo(map); if (k === 'commons') loadCommons(); if (k === 'kto') { drawKto(); if (!ktoN) $('#smpPhInfo').textContent = '관광공사 사진은 아직 없어요 — TourAPI 키가 필요해요.'; } } else map.removeLayer(g); });
    // 내 사진: IndexedDB 'sea-photo'
    const idb = () => new Promise((res, rej) => { const r = indexedDB.open('sea-photo', 1); r.onupgradeneeded = () => r.result.createObjectStore('p', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    async function idbAll() { try { const db = await idb(); return await new Promise(res => { const q = db.transaction('p').objectStore('p').getAll(); q.onsuccess = () => res(q.result || []); q.onerror = () => res([]); }); } catch (e) { return []; } }
    async function idbPut(v) { const db = await idb(); return new Promise((res, rej) => { const tx = db.transaction('p', 'readwrite'); tx.objectStore('p').put(v); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); }
    async function idbDel(id) { const db = await idb(); return new Promise(res => { const tx = db.transaction('p', 'readwrite'); tx.objectStore('p').delete(id); tx.oncomplete = res; }); }
    async function drawMine() {
      G.mine.clearLayers(); const all = await idbAll();
      all.forEach(p => { const mk = L.marker([p.lat, p.lon], { icon: L.divIcon({ className: 'smpIc me', html: '<span>🖼</span>', iconSize: [24, 24] }) })
        .bindPopup(`<img src="${p.data}" alt="내 사진" style="width:240px;max-width:100%;border-radius:6px;display:block"><div class="small">${esc(p.memo || '')} <span class="muted">${esc(p.date)}</span></div><button data-delph="${esc(p.id)}">이 사진 지우기</button><div class="muted small">이 기기에만 있어요</div>`, { maxWidth: 260 }).addTo(G.mine);
        mk.on('popupopen', ev => { const b = ev.popup.getElement().querySelector('[data-delph]'); if (b) b.onclick = async () => { await idbDel(p.id); map.closePopup(); drawMine(); }; }); });
      if (all.length) $('#smpPhInfo').textContent = `내 사진 ${all.length}장 (이 기기에만)`;
    }
    function shrink(file) { return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, 900 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .8)); }; im.onerror = rej; im.src = fr.result; }; fr.onerror = rej; fr.readAsDataURL(file); }); }
    $('#smpAddPh').onclick = () => $('#smpFile').click();
    $('#smpFile').onchange = async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; try { st.place = await shrink(f); $('#smpPhInfo').innerHTML = '📍 <b>지도에서 사진을 놓을 곳을 누르세요.</b> (취소: Esc)'; map.getContainer().style.cursor = 'crosshair'; } catch (x) { $('#smpPhInfo').textContent = '사진을 읽지 못했어요.'; } };
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { st.place = null; st.profile = null; map.getContainer().style.cursor = ''; } });

    /* ── 🌊 수심 색·등고선 ── */
    let depthLayer = null;
    const bandOf = v => { const d = -v; for (let i = 0; i < BANDS.length; i++) if (d < BANDS[i][1]) return i; return BANDS.length - 1; };
    const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const BRGB = BANDS.map(b => rgb(b[2]));
    function mkDepth() {
      const DL = L.GridLayer.extend({ createTile(c, done) {
        const cv = document.createElement('canvas'); cv.width = cv.height = 256;
        tile(c.z, c.x, c.y).then(e => { if (!e) { done(null, cv); return; } const g = cv.getContext('2d'), im = g.createImageData(256, 256), d = im.data, s = SPEC.find(x => x.id === st.sp), rr = s ? range(s.depth) : null;
          for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) { const i = y * 256 + x, v = e[i]; if (v > 0) continue; const b = bandOf(v), col = BRGB[b], o = i * 4;
            const edge = (x < 255 && e[i + 1] <= 0 && bandOf(e[i + 1]) !== b) || (y < 255 && e[i + 256] <= 0 && bandOf(e[i + 256]) !== b);
            let a = 150; if (rr) { const dd = -v; a = dd >= rr[0] && dd <= rr[1] ? 210 : 45; }
            if (edge) { d[o] = 235; d[o + 1] = 245; d[o + 2] = 255; d[o + 3] = 230; } else { d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = a; } }
          g.putImageData(im, 0, 0); done(null, cv); });
        return cv; } });
      return new DL({ maxNativeZoom: 10, maxZoom: 18, minZoom: 4, opacity: .85, attribution: TERR_ATTR });
    }
    $('#smpDepth').onchange = e => { st.depthOn = e.target.checked; if (e.target.checked) { depthLayer = depthLayer || mkDepth(); depthLayer.addTo(map); } else if (depthLayer) map.removeLayer(depthLayer); drawEst(); };

    /* ── 📏 단면도 ── */
    let profPts = [];
    $('#smpProf').onclick = () => { st.profile = true; profPts = []; G.prof.clearLayers(); map.getContainer().style.cursor = 'crosshair'; $('#smpProfInfo').innerHTML = '📏 <b>지도에서 시작점을 누르세요.</b> (취소: Esc)'; };
    async function drawProfile(a, b) {
      const N = 140, pts = [], km = hav(a, b) / 1000; for (let i = 0; i <= N; i++) pts.push([a[0] + (b[0] - a[0]) * i / N, a[1] + (b[1] - a[1]) * i / N]);
      const z = km > 60 ? 9 : 10, ev = await Promise.all(pts.map(p => elevAt(p[0], p[1], z)));
      if (ev.every(v => v == null)) { $('#smpProfInfo').textContent = '수심 자료를 받지 못했어요 (인터넷 연결 확인).'; return; }
      const dep = ev.map(v => v == null ? 0 : v), maxD = Math.max(5, ...dep.map(v => -v)), top = Math.max(0, ...dep) > 0 ? Math.min(40, Math.max(...dep)) : 0;
      const W = 620, H = 230, pad = 26, sy = v => pad + (top - v) / (top + maxD) * (H - pad * 1.6), sx = i => pad + i / N * (W - pad * 1.4);
      const bed = dep.map((v, i) => `${sx(i).toFixed(1)},${sy(Math.max(v, -maxD)).toFixed(1)}`).join(' ');
      const sea = SPEC.filter(s => s.months.includes(month)).concat(SPEC.filter(s => !s.months.includes(month))), placed = []; const icons = [];
      for (const s of sea) { if (icons.length >= 9) break; const [r0, r1] = range(s.depth);
        const idx = dep.map((v, i) => [i, -v]).filter(([i, d]) => d >= Math.max(r0, 1) && d <= r1 && !placed.some(p => Math.abs(p - i) < 9)); if (!idx.length) continue;
        const [i, d] = idx[Math.floor(idx.length / 2)]; placed.push(i);
        const yd = s.layer === 'sur' ? Math.min(3, d * .2) : s.layer === 'mid' ? d * .5 : d - Math.min(2, d * .08);
        icons.push({ s, x: sx(i), y: sy(-yd) }); }
      const ticks = [0, .25, .5, .75, 1].map(f => `<text x="${(pad + f * (W - pad * 1.4)).toFixed(0)}" y="${H - 4}" fill="#9AA5B1" font-size="10" text-anchor="middle">${(km * f).toFixed(km < 10 ? 1 : 0)}km</text>`).join('');
      const dT = [0, maxD / 2, maxD].map(d => `<text x="2" y="${sy(-d).toFixed(0) + 3}" fill="#9AA5B1" font-size="10">${Math.round(d)}m</text><line x1="${pad}" x2="${W - pad * .4}" y1="${sy(-d)}" y2="${sy(-d)}" stroke="#2C3E55" stroke-dasharray="3 4"/>`).join('');
      showPanel(`<div style="display:flex;justify-content:space-between;align-items:center;gap:6px"><b>📏 바닷속 단면 (${km.toFixed(1)}km · 가장 깊은 곳 약 ${Math.round(maxD)}m)</b><button data-close>닫기</button></div>
        <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block" role="img" aria-label="바닷속 단면도"><defs><linearGradient id="smpW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5CC0DC" stop-opacity=".55"/><stop offset="1" stop-color="#0B2350" stop-opacity=".95"/></linearGradient></defs>
          <rect x="${pad}" y="${sy(0)}" width="${W - pad * 1.4}" height="${H - pad * .6 - sy(0)}" fill="url(#smpW)"/>${dT}
          <polygon points="${sx(0)},${H - pad * .6} ${bed} ${sx(N)},${H - pad * .6}" fill="#6B5232" stroke="#C9A36B" stroke-width="1.5"/>
          ${icons.map(o => `<g><text x="${o.x}" y="${o.y}" font-size="17" text-anchor="middle" dominant-baseline="middle">${o.s.emo}</text><text x="${o.x}" y="${o.y + 14}" font-size="9.5" fill="#fff" text-anchor="middle">${esc(o.s.name)}</text></g>`).join('')}${ticks}</svg>
        <div class="small muted">층: 표층 0~5m · 중층 물 가운데 · 바닥·암초 ㅡ 어종은 사는 수심·층으로 그린 그림이에요(실제 위치 아님). 수심은 공개 자료(약 450m 간격)라 실제와 다를 수 있어요. ${TERR_ATTR}</div>`);
    }

    /* ── 🧊 3D 바다 속 ── */
    let panel = null;
    function showPanel(html, tall) {
      if (!panel) { panel = document.createElement('div'); panel.id = 'smpPanel'; map.getContainer().parentNode.appendChild(panel); }
      panel.className = tall ? 'tall' : ''; panel.innerHTML = html; panel.hidden = false;
      const c = panel.querySelector('[data-close]'); if (c) c.onclick = () => { panel.hidden = true; panel.innerHTML = ''; if (cube) { cube.stop(); cube = null; } G.prof.clearLayers(); };
    }
    let cube = null;
    function loadThree() { return window.THREE ? Promise.resolve() : new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
    $('#smpCube').onclick = async () => {
      showPanel(`<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap"><b>🧊 3D 바다 속 — 지금 지도 화면</b><span style="display:flex;gap:6px;align-items:center"><label class="small">높이 과장 <input type="range" id="smpEx" min="1" max="30" value="8" style="width:90px;vertical-align:middle"></label><button data-close>닫기</button></span></div>
        <div id="smpCv" style="position:relative;height:calc(100% - 64px);min-height:240px;border-radius:8px;overflow:hidden;background:#04101E"><div class="muted" style="padding:12px">수심 자료로 바닷속을 만드는 중…</div></div>
        <div class="small muted">끌기: 돌리기 · 휠/두 손가락: 확대 — 높이를 과장했고, 바다 깊이는 3배 더 과장해 바닥 굴곡이 잘 보이게 했어요. ${TERR_ATTR} · 항해용 아님</div>`, true);
      try { await loadThree(); } catch (e) { panel.querySelector('#smpCv').innerHTML = '<div style="padding:12px">3D 엔진을 불러오지 못했어요 (인터넷 연결 확인).</div>'; return; }
      const b = map.getBounds(); let z = Math.min(10, Math.max(5, map.getZoom())); let x0, x1, y0, y1;
      for (;;) { x0 = Math.floor(lon2x(b.getWest(), z)); x1 = Math.floor(lon2x(b.getEast(), z)); y0 = Math.floor(lat2y(b.getNorth(), z)); y1 = Math.floor(lat2y(b.getSouth(), z)); if ((x1 - x0 + 1) * (y1 - y0 + 1) <= 16 || z <= 5) break; z--; }
      const arr = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) arr.push(tile(z, x, y).then(e => ({ x, y, e })));
      const got = await Promise.all(arr); if (!panel || panel.hidden) return;
      const fx0 = lon2x(b.getWest(), z), fx1 = lon2x(b.getEast(), z), fy0 = lat2y(b.getNorth(), z), fy1 = lat2y(b.getSouth(), z);
      const GW = 180, GH = Math.max(60, Math.min(220, Math.round(GW * (fy1 - fy0) / (fx1 - fx0)))), H = new Float32Array((GW + 1) * (GH + 1));
      const look = (fx, fy) => { const tx = Math.floor(fx), ty = Math.floor(fy), t = got.find(o => o.x === tx && o.y === ty); if (!t || !t.e) return 0; return t.e[Math.min(255, Math.floor((fy - ty) * 256)) * 256 + Math.min(255, Math.floor((fx - tx) * 256))]; };
      let mn = 0, mx = 0; for (let j = 0; j <= GH; j++) for (let i = 0; i <= GW; i++) { const v = look(fx0 + (fx1 - fx0) * i / GW, fy0 + (fy1 - fy0) * j / GH); H[j * (GW + 1) + i] = v; mn = Math.min(mn, v); mx = Math.max(mx, v); }
      const wm = hav([b.getSouth(), b.getWest()], [b.getSouth(), b.getEast()]);
      cube = build3D(panel.querySelector('#smpCv'), H, GW, GH, wm, mn, mx, () => +panel.querySelector('#smpEx').value);
      panel.querySelector('#smpEx').oninput = () => cube && cube.setEx();
    };
    function build3D(el, Hs, GW, GH, wm, mn, mx, exF) {
      const T = window.THREE; el.innerHTML = ''; const ren = new T.WebGLRenderer({ antialias: true }); ren.setPixelRatio(Math.min(2, devicePixelRatio || 1)); el.appendChild(ren.domElement);
      const sc = new T.Scene(); sc.background = new T.Color('#04101E'); sc.fog = new T.FogExp2('#04101E', .004);
      const cam = new T.PerspectiveCamera(45, 1, .1, 2000); sc.add(new T.AmbientLight('#8098C0', .7)); const sun = new T.DirectionalLight('#FFF2D8', .9); sun.position.set(60, 120, 40); sc.add(sun);
      const SW = 100, SH = SW * GH / GW, geo = new T.PlaneGeometry(SW, SH, GW, GH); geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color();
      for (let i = 0; i < pos.count; i++) { const v = Hs[i]; if (v > 0) c.setHSL(.28 - Math.min(1, v / 600) * .2, .45, .32 + Math.min(1, v / 800) * .25); else { const d = Math.min(1, -v / Math.max(30, -mn)); c.setHSL(.53 + d * .07, .7, .62 - d * .45); } col.set([c.r, c.g, c.b], i * 3); }
      geo.setAttribute('color', new T.BufferAttribute(col, 3));
      const mesh = new T.Mesh(geo, new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide })); sc.add(mesh);
      const water = new T.Mesh(new T.PlaneGeometry(SW, SH), new T.MeshBasicMaterial({ color: '#3FA9D8', transparent: true, opacity: .22, depthWrite: false })); water.rotation.x = -Math.PI / 2; sc.add(water);
      const grid = new T.GridHelper(SW, 10, '#1E4A70', '#12304D'); grid.position.y = -0.02; sc.add(grid);
      function setEx() { const k = exF() * SW / wm; for (let i = 0; i < pos.count; i++) pos.setY(i, Hs[i] * k * (Hs[i] < 0 ? 3 : 1)); pos.needsUpdate = true; geo.computeVertexNormals(); grid.position.y = mn * k * 3 - .05; }
      setEx();
      let yaw = .6, pit = .75, dist = 140, drag = null, raf = 0, alive = true;
      const place = () => { cam.position.set(Math.sin(yaw) * Math.cos(pit) * dist, Math.sin(pit) * dist, Math.cos(yaw) * Math.cos(pit) * dist); cam.lookAt(0, 0, 0); };
      const rs = () => { const w = el.clientWidth || 600, h = el.clientHeight || 300; ren.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
      const ro = new ResizeObserver(rs); ro.observe(el); rs();
      const cv = ren.domElement; cv.style.touchAction = 'none'; const ptr = new Map(); let pinch = 0;
      cv.onpointerdown = e => { cv.setPointerCapture(e.pointerId); ptr.set(e.pointerId, [e.clientX, e.clientY]); drag = [e.clientX, e.clientY]; };
      cv.onpointermove = e => { if (!ptr.has(e.pointerId)) return; ptr.set(e.pointerId, [e.clientX, e.clientY]);
        if (ptr.size === 2) { const [a, b] = [...ptr.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) dist = Math.max(30, Math.min(400, dist * pinch / d)); pinch = d; return; }
        if (drag) { yaw -= (e.clientX - drag[0]) * .008; pit = Math.max(.12, Math.min(1.45, pit + (e.clientY - drag[1]) * .006)); drag = [e.clientX, e.clientY]; } };
      cv.onpointerup = cv.onpointercancel = e => { ptr.delete(e.pointerId); if (ptr.size < 2) pinch = 0; if (!ptr.size) drag = null; };
      cv.onwheel = e => { e.preventDefault(); dist = Math.max(30, Math.min(400, dist * (e.deltaY > 0 ? 1.1 : .9))); };
      const loop = () => { if (!alive) return; place(); ren.render(sc, cam); raf = requestAnimationFrame(loop); }; loop();
      return { setEx, stop() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); geo.dispose(); ren.dispose(); } };
    }

    /* ── 지도 누르기 가로채기(사진 놓기·단면도) ── */
    async function onClick(e) {
      const ll = [e.latlng.lat, e.latlng.lng];
      if (st.place) { const data = st.place; st.place = null; map.getContainer().style.cursor = ''; const memo = (prompt('사진 메모 (선택, 40자)') || '').slice(0, 40);
        const d = new Date(), id = 'p' + d.getTime(); try { await idbPut({ id, lat: ll[0], lon: ll[1], memo, date: d.toISOString().slice(0, 10), data }); $('#smpPhInfo').textContent = '사진을 놓았어요 (이 기기에만 저장).'; } catch (x) { $('#smpPhInfo').textContent = '저장 공간이 부족해 사진을 저장하지 못했어요.'; }
        if (!st.photos.mine) { st.photos.mine = true; box.querySelector('[data-ph=mine]').checked = true; G.mine.addTo(map); } drawMine(); return true; }
      if (st.profile) { profPts.push(ll); L.circleMarker(ll, { radius: 5, color: '#fff', fillColor: '#F5C46B', fillOpacity: 1 }).addTo(G.prof);
        if (profPts.length === 1) { $('#smpProfInfo').innerHTML = '📏 <b>이제 끝점을 누르세요.</b>'; return true; }
        L.polyline(profPts, { color: '#F5C46B', weight: 3, dashArray: '6 6' }).addTo(G.prof); st.profile = null; map.getContainer().style.cursor = '';
        $('#smpProfInfo').textContent = '단면도를 그리는 중…'; await drawProfile(profPts[0], profPts[1]); $('#smpProfInfo').textContent = '다른 곳을 보려면 「📏 단면도 그리기」를 다시 누르세요.'; return true; }
      return false;
    }
    if (st.kinds && Object.values(st.kinds).some(Boolean)) setTimeout(() => loadPois(false), 1200);
    drawMine();
    return { onClick: e => (st.place || st.profile) ? (onClick(e), true) : false, depthAt: (la, lo) => elevAt(la, lo) };
  }
  return { attach, elevAt };
})();
