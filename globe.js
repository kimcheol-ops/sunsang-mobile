/* GlobeApp — 🌏 지구·세계 우주 관제도 (three.js r128, PC 계통도 탭 · 휴대폰 앱 · 조황 수첩 공용)
 *  GlobeApp.mount(root, { world: GLOBE_WORLD, places: GLOBE_PLACES, sea: SEA_DATA, trails: SEA_TRAILS, inPC })
 *  관제도 5종
 *   globe   🌏 지구 전체   — 실제 시각의 낮·밤(태양 위치 계산)·구름이 도는 3D 지구, 나라를 누르면 정보, 지역 묶음으로 날아가기
 *   korea   🇰🇷 대한민국   — 입체 지도판 위에 수도·관광지·옛도시·대표 음식·바다·자연이 빛기둥으로
 *   compare 🗺 나라 비교   — 여러 나라를 나란히(같은 크기 / 실제 크기 비교)
 *   under   🌊 바다 속     — 바다별·달별로 사는 층(수면·중층·바닥·암초·갯벌)에 물고기가 헤엄치는 층 개념도(실제 수심·지형 아님)
 *   isles   🏝 국내 섬     — 대한민국 지도판 위 섬(OpenStreetMap)을 바다별로
 *  ▶ 5D 투어: 보이는 장소를 차례로 날아다니며 소개(시간 흐름 + 카메라 이동 + 빛 효과)
 */
(function () {
  'use strict';
  const CSS = `
  .glb { --g-bg:#05070D; --g-panel:#111722; --g-line:#2A3445; --g-fg:#E6EAEE; --g-muted:#9AA5B1; --g-acc:#7FD6E8; color: var(--g-fg); display: grid; gap: 8px; font-size: 13.5px; line-height: 1.5; }
  .glb * { box-sizing: border-box; }
  .glb .row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  .glb .chip { border: 1px solid var(--g-line); background: var(--g-panel); color: var(--g-muted); border-radius: 16px; padding: 5px 12px; font: 700 13px inherit; cursor: pointer; }
  .glb .chip[aria-pressed="true"] { background: #2B3F86; border-color: #5A6FE0; color: #fff; }
  .glb .chip.sm { padding: 3px 9px; font-size: 12px; }
  .glb .main { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 8px; }
  .glb .stage { position: relative; height: clamp(380px, 68vh, 780px); border-radius: 12px; overflow: hidden; background: #000; border: 1px solid var(--g-line); }
  .glb .stage canvas { display: block; width: 100%; height: 100%; touch-action: none; cursor: grab; }
  .glb .labels { position: absolute; inset: 0; pointer-events: none; overflow: hidden; font: 700 11.5px 'Malgun Gothic', sans-serif; }
  .glb .lb { position: absolute; transform: translate(-50%, -100%); white-space: nowrap; padding: 1px 6px; border-radius: 6px; background: rgba(4,8,16,.72); border: 1px solid rgba(255,255,255,.18); color: #EAF2FF; }
  .glb .lb.big { font-size: 13px; padding: 2px 8px; background: rgba(30,40,90,.8); border-color: #7A8CFF; }
  .glb .lb.sel { background: #FFD27A; color: #1A1406; border-color: #FFE7A8; z-index: 2; }
  .glb .hint { position: absolute; left: 10px; bottom: 8px; font-size: 11.5px; color: #B9C4D6; background: rgba(0,0,0,.5); border-radius: 6px; padding: 2px 8px; pointer-events: none; }
  .glb .badge { position: absolute; right: 10px; top: 8px; font-size: 12px; color: #FFE7A8; background: rgba(0,0,0,.55); border-radius: 6px; padding: 2px 8px; pointer-events: none; }
  .glb .side { display: grid; gap: 8px; align-content: start; max-height: clamp(380px, 68vh, 780px); overflow: auto; }
  .glb .card { background: var(--g-panel); border: 1px solid var(--g-line); border-radius: 10px; padding: 10px 12px; display: grid; gap: 6px; }
  .glb .card h3 { margin: 0; font-size: 15px; }
  .glb select.chip { max-width: 100%; background: var(--g-panel); color: inherit; font-family: inherit; }
  .glb .muted { color: var(--g-muted); } .glb .small { font-size: 12px; }
  .glb .btn { display: inline-flex; align-items: center; gap: 4px; min-height: 30px; border-radius: 6px; border: 1px solid var(--g-line); background: #1E2738; color: var(--g-fg); font: 600 12.5px inherit; padding: 0 10px; cursor: pointer; text-decoration: none; }
  .glb .btn.pri { background: #2B5F86; border-color: #3A79A8; }
  .glb .li { display: grid; grid-template-columns: 22px 1fr auto; gap: 6px; align-items: center; padding: 3px 6px; border-radius: 6px; cursor: pointer; font-size: 12.5px; border: 0; background: none; color: inherit; text-align: left; width: 100%; font-family: inherit; }
  .glb .li:hover, .glb .li.on { background: #1F2A44; }
  .glb select { background: #0B111B; color: var(--g-fg); border: 1px solid var(--g-line); border-radius: 6px; padding: 4px 8px; font: inherit; }
  @media (max-width: 820px) { .glb .main { grid-template-columns: 1fr; } .glb .stage { height: 58vh; min-height: 340px; } .glb .side { max-height: none; } }`;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const DEG = Math.PI / 180, R = 20;
  const MODES = [['globe', '🌏 지구 전체'], ['korea', '🇰🇷 대한민국'], ['compare', '🗺 나라 비교'], ['under', '🌊 바다 속'], ['isles', '🏝 국내 섬']];
  const SEA_COL = { 서해: '#4FC0D0', 남해: '#7AD7A0', 동해: '#7A9CFF', 제주: '#FFB86B' };
  const CONT_COL = { Asia: '#6E8B5A', Europe: '#7D9068', Africa: '#A3895A', 'North America': '#6C8F60', 'South America': '#5E8A55', Oceania: '#9C8B5E', Antarctica: '#DCE6EE' };
  const PILLAR_H = { cap: 1, sight: .75, old: .75, food: .55, sea: .65, nature: .7, legend: .9 };

  function sunLL(d) { // 태양 바로 아래 지점(위도·경도) — NOAA 근사식
    const y0 = Date.UTC(d.getUTCFullYear(), 0, 1), n = (d - y0) / 864e5, g = 2 * Math.PI / 365 * (n + (d.getUTCHours() - 12) / 24);
    const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    const eqt = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    const m = d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60; let lon = -(m + eqt - 720) / 4; lon = ((lon + 540) % 360) - 180;
    return [decl / DEG, lon];
  }
  function inRing(x, y, r, q) { let ins = false; for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) { const xi = r[i] * q, yi = r[i + 1] * q, xj = r[j] * q, yj = r[j + 1] * q; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) ins = !ins; } return ins; }
  function seaOf(lat, lon) {
    if (lat < 34.05 && lon > 126.0 && lon < 127.0) return '제주';
    if (lon > 129.25 || (lat > 35.6 && lon > 128.9)) return '동해';
    if ((lon < 126.75 && lat > 34.35) || (lat > 35.2 && lon < 127.0)) return '서해';
    return '남해';
  }
  const mapLink = (name, lat, lon, kr) => kr ? `https://map.kakao.com/link/map/${encodeURIComponent(name)},${lat},${lon}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=&center=${lat},${lon}`;
  const searchLink = (q, kr) => kr ? 'https://map.kakao.com/?q=' + encodeURIComponent(q) : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);

  function mount(root, opt) {
    const THREE = window.THREE;
    if (!document.getElementById('glb-css')) { const s = document.createElement('style'); s.id = 'glb-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.classList.add('glb');
    if (!THREE) { root.innerHTML = '<div class="card">3D 엔진(three.js)을 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.</div>'; return { destroy() {} }; }
    const W = opt.world || { countries: [], detail: {}, capitals: [], islands: [] }, P = opt.places, SD = opt.sea;
    const st = Object.assign({ mode: 'globe', cats: Object.keys(P.CAT), group: 'all', cmp: ['KOR', 'JPN', 'ITA'], real: false, sea: '남해', month: new Date().getMonth() + 1, iSea: '' }, lsGet('glb.ui', {}));
    if (!st.v56) { if (!st.cats.includes('legend')) st.cats = st.cats.concat('legend'); st.v56 = 1; } // v5.6: 옛이야기 분류 처음엔 켜 둠
    st.cats = st.cats.filter(k => P.CAT[k]); if (!st.cats.length) st.cats = Object.keys(P.CAT);
    const save = () => lsSet('glb.ui', { mode: st.mode, cats: st.cats, group: st.group, cmp: st.cmp, real: st.real, sea: st.sea, month: st.month, iSea: st.iSea, v56: 1 });
    const LG = window.LEGENDS, LA = window.LegendApp; if (LA) LA.css();
    const net = opt.net !== false, sstCache = {};
    const byA3 = {}; W.countries.forEach(c => byA3[c.a3] = c);
    const nameOf = a3 => (byA3[a3] && byA3[a3].ko) || a3;

    root.innerHTML = `<div class="row" role="tablist" aria-label="관제도 종류">${MODES.map(([k, l]) => `<button class="chip" role="tab" data-mode="${k}" aria-pressed="${st.mode === k}">${l}</button>`).join('')}</div>
      <div class="row" id="g-sub"></div>
      <div class="main"><div class="stage" id="g-stage"><div class="labels" id="g-lab"></div><div class="hint">끌기: 돌리기 · 휠/두 손가락: 확대 · 누르기: 선택 · 두 번 누르기: 처음 자리</div><div class="badge" id="g-badge"></div></div>
        <div class="side"><div class="card" id="g-card"></div><div class="card" id="g-list"></div></div></div>`;
    const stage = root.querySelector('#g-stage'), labEl = root.querySelector('#g-lab'), card = root.querySelector('#g-card'), listEl = root.querySelector('#g-list'), badge = root.querySelector('#g-badge');
    root.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { st.mode = b.dataset.mode; root.querySelectorAll('[data-mode]').forEach(x => x.setAttribute('aria-pressed', x === b)); tourStop(); build(); });
    if (opt.inPC) root.addEventListener('click', e => { const a = e.target.closest('a[href^="https://"]'); if (a) { e.preventDefault(); try { const wv = (window.chrome && window.chrome.webview) || (window.parent.chrome && window.parent.chrome.webview); wv.postMessage({ type: 'open', url: a.href }); } catch (x) {} } });

    // ── 3D 기본 ──
    const ren = new THREE.WebGLRenderer({ antialias: true }); ren.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); stage.insertBefore(ren.domElement, labEl);
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(45, 1, 0.1, 3000);
    const resize = () => { const w = stage.clientWidth || 600, h = stage.clientHeight || 400; ren.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    const ro = new ResizeObserver(resize); ro.observe(stage); resize();
    const amb = new THREE.AmbientLight('#8090B0', 0.5), sunL = new THREE.DirectionalLight('#FFF4DC', 1.1); scene.add(amb, sunL);
    const starTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.3, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
    const stars = (() => { const n = 2600, p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const v = new THREE.Vector3(Math.random() - .5, Math.random() - .5, Math.random() - .5).normalize().multiplyScalar(700 + Math.random() * 600); p.set([v.x, v.y, v.z], i * 3); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); return new THREE.Points(g, new THREE.PointsMaterial({ color: '#fff', size: 2.2, map: starTex, transparent: true, depthWrite: false })); })();
    const emojiTex = {}; function emo(ch) { if (emojiTex[ch]) return emojiTex[ch]; const c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d'); g.font = '72px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 48, 54); return (emojiTex[ch] = new THREE.CanvasTexture(c)); }
    const sprite = (ch, s) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: emo(ch), transparent: true, depthWrite: false })); m.scale.set(s, s, 1); return m; };
    const glowS = (col, s, op) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, color: col, transparent: true, opacity: op == null ? .9 : op, depthWrite: false, blending: THREE.AdditiveBlending })); m.scale.set(s, s, 1); return m; };

    let world = null, picks = [], labels = [], anims = [], camS = null, home = null, fly = null, sel = null, hoverObj = null, t = 0, raf = 0, alive = true, items = [];
    const ray = new THREE.Raycaster(); ray.camera = cam; const mouse = new THREE.Vector2();
    function clearWorld() {
      if (world) { scene.remove(world); world.remove(stars); world.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(m => { if (m.map && !Object.values(emojiTex).includes(m.map) && m.map !== starTex) m.map.dispose(); m.dispose(); }); }); }
      world = new THREE.Group(); scene.add(world); picks = []; anims = []; items = []; sel = null; labEl.innerHTML = ''; labels = []; scene.fog = null;
    }
    function label(text, pos, cls, obj) { const d = document.createElement('div'); d.className = 'lb ' + (cls || ''); d.textContent = text; labEl.appendChild(d); const L = { d, pos, obj, cls: cls || '' }; labels.push(L); return L; }

    // ── 카메라: globe는 위도·경도·거리, 나머지는 회전·기울기·거리 ──
    function camApply() {
      if (camS.kind === 'globe') { const p = ll2v(camS.lat, camS.lon, camS.dist); cam.position.copy(p); cam.up.set(0, 1, 0); cam.lookAt(0, 0, 0); }
      else { const c = camS.target; cam.position.set(c.x + Math.sin(camS.yaw) * Math.cos(camS.pitch) * camS.dist, c.y + Math.sin(camS.pitch) * camS.dist, c.z + Math.cos(camS.yaw) * Math.cos(camS.pitch) * camS.dist); cam.lookAt(c); }
    }
    function ll2v(lat, lon, r) { const ph = (90 - lat) * DEG, th = (lon + 180) * DEG; return new THREE.Vector3(-r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)); }
    function v2ll(v) { const r = v.length(), lat = 90 - Math.acos(v.y / r) / DEG; let lon = Math.atan2(v.z, -v.x) / DEG - 180; if (lon < -180) lon += 360; return [lat, lon]; }
    function flyTo(to, ms) { fly = { from: Object.assign({}, camS, { target: camS.target && camS.target.clone() }), to, t0: performance.now(), ms: ms || 1300 }; }
    // 끌기·확대
    const ptrs = new Map(); let drag = null, pinch = 0, moved = 0;
    const cv = ren.domElement;
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); drag = [e.clientX, e.clientY]; moved = 0; fly = null; tourStop(); if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
    cv.addEventListener('pointermove', e => {
      const r = cv.getBoundingClientRect(); mouse.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
      if (!ptrs.has(e.pointerId)) { hoverCheck(); return; }
      ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) zoom(pinch / d); pinch = d; moved += 10; return; }
      const dx = e.clientX - drag[0], dy = e.clientY - drag[1]; drag = [e.clientX, e.clientY]; moved += Math.abs(dx) + Math.abs(dy);
      if (camS.kind === 'globe') { const k = camS.dist / 600; camS.lon -= dx * k * 6; camS.lat = Math.max(-85, Math.min(85, camS.lat + dy * k * 6)); }
      else { camS.yaw -= dx * 0.006; camS.pitch = Math.max(0.12, Math.min(1.45, camS.pitch + dy * 0.005)); }
    });
    const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = 0; if (moved < 6 && e.type === 'pointerup') pick(); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY > 0 ? 1.1 : 0.9); }, { passive: false });
    cv.addEventListener('dblclick', () => { if (home) flyTo(Object.assign({}, home, { target: home.target && home.target.clone() })); });
    function zoom(f) { camS.dist = Math.max(camS.min, Math.min(camS.max, camS.dist * f)); }
    function hoverCheck() { ray.setFromCamera(mouse, cam); const h = ray.intersectObjects(picks, true)[0]; const o = h ? findPick(h.object) : null; if (o !== hoverObj) { hoverObj = o; cv.style.cursor = o ? 'pointer' : 'grab'; } }
    const findPick = o => { while (o && !o.userData.pick) o = o.parent; return o; };
    function pick() {
      ray.setFromCamera(mouse, cam); const h = ray.intersectObjects(picks, true)[0];
      if (h) { const o = findPick(h.object); if (o) { choose(o.userData.pick, true); return; } }
      if (st.mode === 'globe' && world.userData.earth) { const g = ray.intersectObject(world.userData.earth)[0]; if (g) { const [la, lo] = v2ll(g.point); const c = W.countries.find(c => c.r.some(r => inRing(lo, la, r, W.q))); if (c) chooseCountry(c); } }
    }

    // ── 공통: 장소 목록·카드 ──
    function choose(it, byClick) {
      sel = it; const kr = it.a3 === 'KOR' || it.kind === 'isle';
      labels.forEach(L => L.d.classList.toggle('sel', L.obj === it));
      if (it.kind === 'place' && it.cat === 'legend') {
        const l = LG && LG.L.find(x => x.id === it.lid);
        card.innerHTML = LA && l ? `<div class="lg" style="display:grid;gap:6px">${LA.cardHTML(l)}<div class="small muted">🧜 「섬 · 바다 속 → 📜 옛이야기 원정」에서 조각을 모아 「물결이 세계 여행」 연재를 열어 보세요.</div></div>` : `<h3>📜 ${esc(it.name)}</h3><div>${esc(it.desc)}</div>`;
        if (LA) LA.bindCard(card);
      } else if (it.kind === 'place') {
        const cat = P.CAT[it.cat];
        card.innerHTML = `<h3>${cat[0]} ${esc(it.name)}</h3><div class="small muted">${esc((P.C[it.a3] || {}).flag || '')} ${esc(nameOf(it.a3))} · ${esc(cat[1])}</div><div>${esc(it.desc)}</div>
          <div class="row">${it.cat === 'food' ? `<a class="btn pri" href="${esc(searchLink(it.name + (kr ? ' 맛집' : ' restaurant'), kr))}" target="_blank" rel="noopener">🍽 지도에서 이 음식 맛집 찾기</a>` : ''}<a class="btn" href="${esc(mapLink(it.name, it.lat, it.lon, kr))}" target="_blank" rel="noopener">🗺 지도에서 보기</a></div>
          ${it.cat === 'food' ? '<div class="small muted">특정 가게를 추천하지 않아요. 지도 앱의 최신 정보·후기로 골라 주세요.</div>' : ''}`;
      } else if (it.kind === 'isle') {
        const lgs = LA ? LA.forIsle(it.name) : [];
        card.innerHTML = `<h3>🏝 ${esc(it.name)}</h3><div class="small muted">${esc(it.gun ? it.gun + ' · ' : '')}${esc(it.sea)} · 위도 ${it.lat.toFixed(3)}, 경도 ${it.lon.toFixed(3)}</div>${it.desc ? `<div>${esc(it.desc)}</div>` : ''}${it.trail ? '<div>🥾 「섬 · 바다 속」 탭의 섬길 미리 걷기·원정에 이 섬 길 자료가 있어요.</div>' : ''}
          ${lgs.length ? `<div class="lg" style="display:grid;gap:6px;border-top:1px solid #2A3550;padding-top:6px"><b>📜 이 섬의 옛이야기</b>${lgs.map(l => LA.cardHTML(l, { note: false })).join('')}</div>` : ''}
          <div class="row"><a class="btn pri" href="${esc(mapLink(it.name, it.lat, it.lon, true))}" target="_blank" rel="noopener">🗺 카카오맵</a><a class="btn" href="https://island.theksa.co.kr" target="_blank" rel="noopener">⛴ 여객선 시간표</a>${it.wd ? `<a class="btn" href="https://www.wikidata.org/wiki/${esc(it.wd)}" target="_blank" rel="noopener">📖 위키데이터</a>` : ''}</div>
          <div class="small muted">섬 위치 © OpenStreetMap 기여자 · 손으로 정리한 섬은 대략 위치</div>`;
        if (LA) LA.bindCard(card);
      } else if (it.kind === 'fish') {
        const s = it.s; card.innerHTML = `<h3>${esc(s.emo)} ${esc(s.name)}</h3><div class="small muted">${esc(SD.LAYER[s.layer] || s.layer)} · 수심 ${esc(s.depth)} · ${s.months.join('·')}월</div><div><b>잡는 법</b> ${esc(s.how)}</div><div><b>맛</b> ${esc(s.cook)}</div>${s.caution ? `<div class="small" style="color:#F5C46B">⚠ ${esc(s.caution)}</div>` : ''}${s.ban ? `<div class="small" style="color:#FF8A8D">금어기 ${esc(s.ban)}</div>` : ''}${s.size ? `<div class="small">금지 체장 ${esc(s.size)}</div>` : ''}<div class="small muted">금어기·체장은 바뀔 수 있어요 — 해양수산부 공지를 확인하세요.</div>`;
      }
      listEl.querySelectorAll('[data-i]').forEach(b => b.classList.toggle('on', items[+b.dataset.i] === it));
      if (byClick !== false && it.pos) focus(it);
    }
    function focus(it) {
      if (camS.kind === 'globe') flyTo({ kind: 'globe', lat: it.lat, lon: it.lon, dist: Math.min(camS.dist, 48), min: camS.min, max: camS.max });
      else flyTo({ kind: 'orbit', target: it.pos.clone(), yaw: camS.yaw, pitch: Math.max(0.5, camS.pitch), dist: Math.min(camS.dist, camS.focus || 30), min: camS.min, max: camS.max });
    }
    function listOut(title, extra) {
      listEl.innerHTML = `<div class="row" style="justify-content:space-between"><b>${esc(title)} <span class="muted small">${items.length}곳</span></b><button class="btn pri" id="g-tour">${tour ? '■ 투어 멈춤' : '▶ 5D 투어'}</button></div>${extra || ''}
        <div>${items.slice(0, 400).map((it, i) => `<button class="li" data-i="${i}"><span>${esc(it.ic)}</span><span>${esc(it.name)}</span><span class="muted small">${esc(it.sub || '')}</span></button>`).join('')}</div>`;
      listEl.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { tourStop(); choose(items[+b.dataset.i]); });
      listEl.querySelector('#g-tour').onclick = () => tour ? tourStop() : tourStart();
    }
    let tour = null;
    function tourStart() { if (!items.length) return; let i = Math.max(0, items.indexOf(sel)); const step = () => { choose(items[i % items.length]); i++; }; step(); tour = setInterval(step, 4800); const b = listEl.querySelector('#g-tour'); if (b) b.textContent = '■ 투어 멈춤'; }
    function tourStop() { if (tour) { clearInterval(tour); tour = null; const b = listEl.querySelector('#g-tour'); if (b) b.textContent = '▶ 5D 투어'; } }
    function catChips() {
      return Object.entries(P.CAT).map(([k, v]) => `<button class="chip sm" data-cat="${k}" aria-pressed="${st.cats.includes(k)}">${v[0]} ${v[1]}</button>`).join('');
    }
    function bindCats(rebuild) { root.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { const k = b.dataset.cat; st.cats = st.cats.includes(k) ? st.cats.filter(x => x !== k) : st.cats.concat(k); if (!st.cats.length) st.cats = [k]; save(); rebuild(); }); }
    const placesOf = a3 => ((P.C[a3] || {}).p || []).filter(p => st.cats.includes(p[0])).map(p => ({ kind: 'place', a3, cat: p[0], name: p[1], lat: p[2], lon: p[3], desc: p[4], ic: P.CAT[p[0]][0], sub: P.CAT[p[0]][1] }))
      .concat(LG && st.cats.includes('legend') ? LG.L.filter(l => l.a3 === a3).map(l => ({ kind: 'place', a3, cat: 'legend', lid: l.id, name: l.t.split(' — ')[0], lat: l.lat, lon: l.lon, desc: l.s, ic: '📜', sub: '옛이야기' })) : []);

    /* ═════ 🌏 지구 전체 ═════ */
    function texWorld(selA3, featured) {
      const w = 2048, h = 1024, c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
      const oc = g.createLinearGradient(0, 0, 0, h); oc.addColorStop(0, '#0B2A4A'); oc.addColorStop(.5, '#0F4470'); oc.addColorStop(1, '#0B2A4A'); g.fillStyle = oc; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(140,190,255,.10)'; g.lineWidth = 1; for (let lo = -180; lo <= 180; lo += 30) { const x = (lo + 180) / 360 * w; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let la = -60; la <= 60; la += 30) { const y = (90 - la) / 180 * h; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      const X = lo => (lo + 180) / 360 * w, Y = la => (90 - la) / 180 * h;
      W.countries.forEach(co => co.r.forEach(r => {
        let mn = 1e9, mx = -1e9; for (let i = 0; i < r.length; i += 2) { mn = Math.min(mn, r[i]); mx = Math.max(mx, r[i]); }
        const cross = (mx - mn) * W.q > 300, shifts = cross ? [360, -360] : [0];
        shifts.forEach(sh => { g.beginPath(); for (let i = 0; i < r.length; i += 2) { let lo = r[i] * W.q; if (cross && ((sh > 0 && lo < 0) || (sh < 0 && lo > 0))) lo += sh; const x = X(lo), y = Y(r[i + 1] * W.q); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath();
          g.fillStyle = co.a3 === selA3 ? '#D9B04E' : featured.includes(co.a3) ? shade(CONT_COL[co.ct] || '#7A8A66', 18) : (CONT_COL[co.ct] || '#7A8A66'); g.fill();
          g.strokeStyle = co.a3 === selA3 ? '#FFF3C4' : 'rgba(230,240,255,.35)'; g.lineWidth = co.a3 === selA3 ? 2.5 : 0.8; g.stroke(); });
      }));
      return new THREE.CanvasTexture(c);
    }
    function shade(hex, amt) { const n = parseInt(hex.slice(1), 16); const f = v => Math.max(0, Math.min(255, v + amt)); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; }
    function texNight() {
      const w = 2048, h = 1024, c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      const dot = (la, lo, r, a) => { const x = (lo + 180) / 360 * w, y = (90 - la) / 180 * h, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(255,214,140,${a})`); gr.addColorStop(1, 'rgba(255,180,90,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
      W.capitals.forEach(cp => dot(cp[1], cp[2], 3 + Math.log10(Math.max(1e4, cp[4])) * 2.2, .9));
      Object.values(P.C).forEach(co => co.p.forEach(p => dot(p[2], p[3], 4, .6)));
      // 도시 불빛 느낌의 흩뿌림(수도 둘레)
      W.capitals.forEach(cp => { const n = Math.min(30, Math.round(Math.log10(Math.max(1e4, cp[4])) * 4)); for (let i = 0; i < n; i++) dot(cp[1] + (Math.random() - .5) * 4, cp[2] + (Math.random() - .5) * 5, 1.6, .5); });
      return new THREE.CanvasTexture(c);
    }
    function texCloud() {
      const w = 1024, h = 512, c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = true;
      [8, 16, 32, 64, 128].forEach((s, k) => { const t = document.createElement('canvas'); t.width = s * 2; t.height = s; const tg = t.getContext('2d'), im = tg.createImageData(s * 2, s); for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } tg.putImageData(im, 0, 0); g.globalAlpha = 0.5 / (k + 1) + .08; g.drawImage(t, 0, 0, w, h); });
      const im = g.getImageData(0, 0, w, h), d = im.data; for (let i = 0; i < d.length; i += 4) { const v = d[i] / 255, lat = Math.abs((Math.floor(i / 4 / w) / h) - .5) * 2, a = Math.max(0, (v - 0.47) * 3.2) * (lat > .92 ? .3 : 1); d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.min(255, a * 255); }
      g.putImageData(im, 0, 0); return new THREE.CanvasTexture(c);
    }
    function buildGlobe() {
      scene.background = new THREE.Color('#02040A'); world.add(stars);
      const grp = P.GROUPS.find(x => x[0] === st.group) || P.GROUPS[0], featured = Object.keys(P.C), show = grp[2] || featured;
      const day = texWorld(null, featured), night = texNight();
      const mat = new THREE.ShaderMaterial({ uniforms: { day: { value: day }, night: { value: night }, sun: { value: new THREE.Vector3(1, 0, 0) } },
        vertexShader: 'varying vec2 vUv; varying vec3 vN; void main(){ vUv=uv; vN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader: 'uniform sampler2D day; uniform sampler2D night; uniform vec3 sun; varying vec2 vUv; varying vec3 vN; void main(){ float d=dot(normalize(vN),normalize(sun)); vec3 dc=texture2D(day,vUv).rgb; vec3 nc=texture2D(night,vUv).rgb; float m=smoothstep(-0.2,0.25,d); vec3 c=mix(dc*0.26+nc*1.2, dc*(0.32+0.85*max(d,0.0)), m); gl_FragColor=vec4(c,1.0); }' });
      const earth = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), mat); world.add(earth); world.userData.earth = earth;
      const clouds = new THREE.Mesh(new THREE.SphereGeometry(R * 1.012, 64, 48), new THREE.MeshLambertMaterial({ map: texCloud(), transparent: true, opacity: .55, depthWrite: false })); world.add(clouds);
      const atm = new THREE.Mesh(new THREE.SphereGeometry(R * 1.13, 64, 48), new THREE.ShaderMaterial({ side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
        vertexShader: 'varying vec3 vN; void main(){ vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader: 'varying vec3 vN; void main(){ float i=pow(0.72-dot(vN,vec3(0,0,1.0)),3.0); gl_FragColor=vec4(0.35,0.65,1.0,1.0)*i; }' })); world.add(atm);
      const updSun = () => { const [la, lo] = sunLL(new Date()), v = ll2v(la, lo, 1); mat.uniforms.sun.value.copy(v); sunL.position.copy(v.clone().multiplyScalar(100)); return [la, lo]; };
      updSun(); let lastSun = 0; anims.push(dt => { clouds.rotation.y += dt * 0.012; if (t - lastSun > 30) { lastSun = t; updSun(); } });
      // 수도(작은 점)
      const cp = new Float32Array(W.capitals.length * 3); W.capitals.forEach((c, i) => { const v = ll2v(c[1], c[2], R * 1.004); cp.set([v.x, v.y, v.z], i * 3); });
      const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.BufferAttribute(cp, 3)); world.add(new THREE.Points(cg, new THREE.PointsMaterial({ color: '#FFE7A8', size: .9, map: starTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
      // 장소 빛기둥
      items = []; show.forEach(a3 => items.push(...placesOf(a3)));
      items.forEach(it => {
        const col = new THREE.Color(P.CAT[it.cat][2]), h = R * (0.04 + PILLAR_H[it.cat] * 0.07), base = ll2v(it.lat, it.lon, R), dir = base.clone().normalize();
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, h, 6), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .75, blending: THREE.AdditiveBlending, depthWrite: false }));
        beam.position.copy(base.clone().add(dir.clone().multiplyScalar(h / 2))); beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        const g = new THREE.Group(); g.add(beam); const top = sprite(it.ic, 1.1); top.position.copy(base.clone().add(dir.clone().multiplyScalar(h + .5))); g.add(top); const gl = glowS(col, 1.4, .8); gl.position.copy(base.clone().add(dir.clone().multiplyScalar(.1))); g.add(gl);
        g.userData.pick = it; it.pos = top.position.clone(); world.add(g); picks.push(g);
        anims.push(() => { gl.material.opacity = .45 + .4 * Math.sin(t * 3 + it.lat); });
        if (it.cat === 'cap') label(`${(P.C[it.a3] || {}).flag || ''} ${it.name}`, it.pos, 'big', it); else label(it.name, it.pos, '', it);
      });
      camS = { kind: 'globe', lat: 30, lon: grp[2] ? centerLon(show) : 127, dist: grp[2] ? 52 : 62, min: 24, max: 140 }; home = Object.assign({}, camS);
      if (grp[2]) { const c = centerOf(show); camS.lat = c[0]; camS.lon = c[1]; home = Object.assign({}, camS); }
      root.querySelector('#g-sub').innerHTML = P.GROUPS.map(([k, l]) => `<button class="chip sm" data-grp="${k}" aria-pressed="${st.group === k}">${l}</button>`).join('') + '<span style="width:10px"></span>' + catChips();
      root.querySelectorAll('[data-grp]').forEach(b => b.onclick = () => { st.group = b.dataset.grp; save(); build(); }); bindCats(build);
      const [sla, slo] = sunLL(new Date());
      badge.textContent = `☀ 지금 태양 바로 아래: 위도 ${sla.toFixed(1)}°, 경도 ${slo.toFixed(1)}° — 밤인 곳엔 도시 불빛`;
      card.innerHTML = `<h3>🌏 지구 전체 관제도</h3><div class="small">지금 이 순간의 <b>낮과 밤</b>을 태양 위치로 계산해 보여 줘요. 나라를 누르면 정보가, 빛기둥을 누르면 명소가 나와요.</div><div class="small muted">나라 모양·수도: Natural Earth(퍼블릭 도메인)</div>`;
      listOut(grp[1] + ' 명소');
    }
    function centerOf(a3s) { let la = 0, lo = 0, n = 0; a3s.forEach(a => (P.C[a] || { p: [] }).p.forEach(p => { la += p[2]; lo += p[3]; n++; })); return n ? [la / n, lo / n] : [30, 127]; }
    function centerLon(a3s) { return centerOf(a3s)[1]; }
    function chooseCountry(co) {
      tourStop();
      const cap = W.capitals.find(c => c[3] === co.a3), f = P.C[co.a3];
      world.userData.earth.material.uniforms.day.value.dispose(); world.userData.earth.material.uniforms.day.value = texWorld(co.a3, Object.keys(P.C));
      card.innerHTML = `<h3>${esc(f ? f.flag : '🏳')} ${esc(co.ko)}</h3><div class="small muted">${esc(co.en)} · ${esc(co.ct)}</div>
        <div>🏛 수도 <b>${esc(f ? f.cap : cap ? cap[0] : '자료 없음')}</b>${cap && f ? ` <span class="muted small">(${esc(cap[0])})</span>` : ''}</div><div>👥 인구 약 ${(co.pop / 1e4).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}만 명 <span class="muted small">(Natural Earth 추정치)</span></div>
        ${f ? `<div class="small">명소 ${f.p.length}곳이 있어요.</div><div class="row"><button class="btn pri" data-cmp-add>🗺 나라 비교에 넣기</button>${co.a3 === 'KOR' ? '<button class="btn" data-go-kr>🇰🇷 대한민국 관제도</button>' : ''}</div>` : '<div class="small muted">이 나라의 명소 자료는 아직 없어요.</div>'}`;
      const b = card.querySelector('[data-cmp-add]'); if (b) b.onclick = () => { if (!st.cmp.includes(co.a3)) st.cmp = st.cmp.concat(co.a3).slice(-5); save(); st.mode = 'compare'; root.querySelectorAll('[data-mode]').forEach(x => x.setAttribute('aria-pressed', x.dataset.mode === 'compare')); build(); };
      const k = card.querySelector('[data-go-kr]'); if (k) k.onclick = () => { st.mode = 'korea'; root.querySelectorAll('[data-mode]').forEach(x => x.setAttribute('aria-pressed', x.dataset.mode === 'korea')); build(); };
      flyTo({ kind: 'globe', lat: co.ly, lon: co.lx, dist: Math.min(camS.dist, 54), min: camS.min, max: camS.max });
    }

    /* ═════ 입체 지도판(나라) ═════ */
    function ringsOf(a3) {
      const d = W.detail && W.detail[a3], src = d ? d.r : (byA3[a3] || { r: [] }).r, q = d ? d.q : W.q;
      let rings = src.map(r => { const o = []; for (let i = 0; i < r.length; i += 2) o.push([r[i] * q, r[i + 1] * q]); for (let i = 1; i < o.length; i++) { while (o[i][0] - o[i - 1][0] > 180) o[i][0] -= 360; while (o[i][0] - o[i - 1][0] < -180) o[i][0] += 360; } return o; });
      if (!rings.length) return [];
      const main = rings.reduce((a, b) => b.length > a.length ? b : a), mc = main.reduce((s, p) => [s[0] + p[0] / main.length, s[1] + p[1] / main.length], [0, 0]);
      const lim = { USA: 70, CAN: 60, IDN: 40, CHN: 30, JPN: 25, AUS: 25, PHL: 20 }[a3] || 15;
      rings = rings.map(r => { const c = r.reduce((s, p) => s + p[0] / r.length, 0), sh = c - mc[0] > 180 ? -360 : c - mc[0] < -180 ? 360 : 0; return sh ? r.map(p => [p[0] + sh, p[1]]) : r; })
        .filter(r => { const c = r.reduce((s, p) => [s[0] + p[0] / r.length, s[1] + p[1] / r.length], [0, 0]); return Math.hypot(c[0] - mc[0], c[1] - mc[1]) < lim; });
      return rings;
    }
    function board(a3, size, kmScale, col) {
      const rings = ringsOf(a3); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; rings.forEach(r => r.forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }));
      const lc = (x0 + x1) / 2, la = (y0 + y1) / 2, kx = Math.cos(la * DEG) * 111.32, ky = 110.57, wkm = (x1 - x0) * kx, hkm = (y1 - y0) * ky;
      const s = kmScale || size / Math.max(wkm, hkm, 1), depth = Math.max(.35, size * 0.03);
      const P2 = (lon, lat) => { let l = lon; while (l - lc > 180) l -= 360; while (l - lc < -180) l += 360; return [(l - lc) * kx * s, (lat - la) * ky * s]; };
      const g = new THREE.Group();
      const top = new THREE.MeshStandardMaterial({ color: col || '#3E7A5E', roughness: .55, metalness: .15, emissive: col || '#3E7A5E', emissiveIntensity: .18 }), side = new THREE.MeshStandardMaterial({ color: '#16324A', roughness: .4, metalness: .4, emissive: '#1E5A8A', emissiveIntensity: .35 });
      rings.forEach(r => {
        const pts = r.map(p => { const q = P2(p[0], p[1]); return new THREE.Vector2(q[0], q[1]); });
        let area = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) area += (pts[j].x + pts[i].x) * (pts[j].y - pts[i].y); if (Math.abs(area) < 1e-4) return;
        try { const geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth, bevelEnabled: false, curveSegments: 1 }); const m = new THREE.Mesh(geo, [top, side]); m.rotation.x = -Math.PI / 2; g.add(m); } catch (e) {}
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map(v => new THREE.Vector3(v.x, depth + .02, -v.y)).concat([new THREE.Vector3(pts[0].x, depth + .02, -pts[0].y)])), new THREE.LineBasicMaterial({ color: '#9FE8FF', transparent: true, opacity: .8 }));
        g.add(line);
      });
      const project = (lat, lon) => { const q = P2(lon, lat); return new THREE.Vector3(q[0], depth, -q[1]); };
      return { g, project, w: wkm * s, h: hkm * s, depth, wkm, hkm };
    }
    function holoFloor(size, y) {
      const grid = new THREE.GridHelper(size, Math.round(size / 2), '#2B6A9A', '#123048'); grid.position.y = y; grid.material.transparent = true; grid.material.opacity = .45; world.add(grid);
      const scan = new THREE.Mesh(new THREE.RingGeometry(1, 1.6, 64), new THREE.MeshBasicMaterial({ color: '#4FD8FF', transparent: true, opacity: .5, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })); scan.rotation.x = -Math.PI / 2; scan.position.y = y + .02; world.add(scan);
      anims.push(() => { const k = (t * 0.25) % 1; scan.scale.setScalar(1 + k * size * 0.45); scan.material.opacity = .5 * (1 - k); });
    }
    function pillars(list, B, unit) {
      list.forEach(it => {
        const col = new THREE.Color(P.CAT[it.cat] ? P.CAT[it.cat][2] : it.col), base = B.project(it.lat, it.lon), h = unit * (PILLAR_H[it.cat] || .6);
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(unit * .035, unit * .035, h, 8), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false }));
        beam.position.copy(base).add(new THREE.Vector3(0, h / 2, 0));
        const g = new THREE.Group(); g.add(beam); const sp = sprite(it.ic, unit * .32); sp.position.copy(base).add(new THREE.Vector3(0, h + unit * .16, 0)); g.add(sp);
        const ring = new THREE.Mesh(new THREE.RingGeometry(unit * .06, unit * .1, 24), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide, transparent: true, opacity: .8, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.copy(base).add(new THREE.Vector3(0, .03, 0)); g.add(ring);
        g.position.copy(B.g.position); g.userData.pick = it; it.pos = sp.position.clone().add(B.g.position); world.add(g); picks.push(g);
        const ph = Math.random() * 6; anims.push(() => { const k = 1 + .25 * Math.sin(t * 2.5 + ph); ring.scale.setScalar(k); beam.material.opacity = .45 + .3 * Math.sin(t * 2 + ph); });
        label(it.cat === 'cap' ? '🏛 ' + it.name : it.name, it.pos, it.cat === 'cap' ? 'big' : '', it);
      });
    }
    function lights() { sunL.position.set(30, 60, 40); amb.intensity = .65; }

    /* ═════ 🇰🇷 대한민국 ═════ */
    function buildKorea() {
      scene.background = new THREE.Color('#03060E'); world.add(stars); lights();
      const B = board('KOR', 40, 0, '#3F7F62'); world.add(B.g); holoFloor(70, -0.05);
      items = placesOf('KOR'); pillars(items, B, 7);
      [['서해', 37.0, 124.9], ['남해', 33.9, 127.9], ['동해', 37.4, 130.3]].forEach(([n, la, lo]) => label('🌊 ' + n, B.project(la, lo), '', null));
      camS = { kind: 'orbit', target: new THREE.Vector3(0, 0, 0), yaw: .25, pitch: .85, dist: 50, min: 12, max: 140, focus: 22 }; home = Object.assign({}, camS, { target: camS.target.clone() });
      root.querySelector('#g-sub').innerHTML = catChips(); bindCats(build);
      badge.textContent = '🇰🇷 입체 지도판 · 빛기둥 높이 = 분류';
      card.innerHTML = `<h3>🇰🇷 대한민국 관제도</h3><div class="small">수도·관광지·옛도시·대표 음식·바다·자연을 빛기둥으로 보여 줘요. 위 단추로 분류를 골라 보세요. 음식은 특정 가게가 아닌 <b>그 고장 대표 음식</b>이고, 누르면 지도에서 맛집을 찾을 수 있어요.</div><div class="small muted">지도 모양: Natural Earth</div>`;
      listOut('대한민국');
    }

    /* ═════ 🗺 나라 비교 ═════ */
    // 나라 비교 표: 항목마다 막대로(휴대폰 폭에서도 읽히게 나라는 줄로)
    function cmpTable(a3s, grpOf) {
      const I = a => (P.INFO && P.INFO[a]) || null, kr = I('KOR');
      const rows = [
        ['📐 넓이', a => I(a) ? I(a)[0] : null, v => v >= 100 ? Math.round(v).toLocaleString() + '만㎢' : v + '만㎢', a => I(a) && kr ? `한국의 ${(I(a)[0] / kr[0]).toFixed(I(a)[0] / kr[0] < 10 ? 1 : 0)}배` : ''],
        ['👥 인구', a => byA3[a] ? byA3[a].pop / 1e4 : null, v => Math.round(v).toLocaleString() + '만 명', () => ''],
        ['🏖 해안선', a => I(a) ? I(a)[1] : null, v => v ? v.toLocaleString() + 'km' : '바다 없음', a => I(a) && kr && I(a)[1] ? `한국의 ${(I(a)[1] / kr[1]).toFixed(1)}배` : ''],
      ];
      const bars = rows.map(([lab, get, fmt, rel]) => { const vals = a3s.map(get), mx = Math.max(...vals.map(v => v || 0)) || 1;
        return `<div><b class="small">${lab}</b>${a3s.map((a, i) => `<div style="display:grid;grid-template-columns:76px 1fr;gap:6px;align-items:center;font-size:12px"><span>${P.C[a].flag} ${esc(nameOf(a))}</span><span style="display:flex;gap:6px;align-items:center;min-width:0"><i style="display:block;height:8px;border-radius:4px;background:#7FD6E8;width:${vals[i] == null ? 0 : Math.max(2, Math.round(vals[i] / mx * 100))}%;max-width:60%"></i><span style="white-space:nowrap">${vals[i] == null ? '자료 없음' : esc(fmt(vals[i]))} <span class="muted">${esc(rel(a))}</span></span></span></div>`).join('')}</div>`; }).join('');
      const tz = a => { const t = I(a); if (!t) return '자료 없음'; const d = t[2] - 9; return d === 0 ? '한국과 같음' : `한국보다 ${Math.abs(d)}시간 ${d < 0 ? '늦음' : '빠름'}`; };
      const tbl = `<table style="border-collapse:collapse;width:100%;font-size:12px">${[['🏛 수도', a => P.C[a].cap], ['🌏 지역', a => grpOf(a).replace(/^\S+\s/, '')], ['🕐 시차', tz], ['🌊 바다', a => I(a) ? I(a)[4] : ''], ['🐟 대표 생선', a => I(a) ? I(a)[3] : ''], ['🌡 지금 바다 수온', a => I(a) && I(a)[5] ? (net ? '받는 중…' : '인터넷 연결 때 표시') : '—'], ['📍 명소', a => P.C[a].p.length + '곳' + (LG ? ` · 📜 ${LG.L.filter(l => l.a3 === a).length}편` : '')]]
        .map(([lab, f]) => `<tr><th style="text-align:left;padding:3px 4px;border-bottom:1px solid #2A3550;white-space:nowrap;vertical-align:top">${lab}</th><td style="padding:3px 4px;border-bottom:1px solid #2A3550">${a3s.map(a => `<div>${P.C[a].flag} ${lab.includes('수온') ? `<span data-sst="${a}">${esc(f(a))}</span>` : esc(f(a))}</div>`).join('')}</td></tr>`).join('')}</table>`;
      return `<div style="display:grid;gap:8px">${bars}${tbl}</div>`;
    }
    function buildCompare() {
      scene.background = new THREE.Color('#04050C'); world.add(stars); lights();
      const pool = Object.keys(P.C), sel3 = st.cmp.filter(a => pool.includes(a)); if (!sel3.length) sel3.push('KOR');
      const SIZE = 30; let kmScale = 0;
      if (st.real) { const ext = sel3.map(a => { const B = board(a, SIZE); B.g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); return Math.max(B.wkm, B.hkm); }); kmScale = SIZE * 1.6 / Math.max(...ext); }
      const boards = sel3.map(a => board(a, SIZE, kmScale, null)); let x = 0; const gap = 6;
      const total = boards.reduce((s, B) => s + Math.max(B.w, 4), 0) + gap * (boards.length - 1);
      items = [];
      boards.forEach((B, i) => {
        const w = Math.max(B.w, 4); B.g.position.set(-total / 2 + x + w / 2, 0, 0); x += w + gap; world.add(B.g);
        const its = placesOf(sel3[i]); items.push(...its); pillars(its, B, st.real ? Math.max(2.5, Math.min(6, Math.max(B.w, B.h) * .18)) : 5);
        label(`${P.C[sel3[i]].flag} ${nameOf(sel3[i])}${st.real ? ` · ${Math.round(B.wkm).toLocaleString()}km` : ''}`, new THREE.Vector3(B.g.position.x, B.depth + 8, -Math.max(B.h, 4) / 2 - 2), 'big', null);
      });
      holoFloor(Math.max(60, total + 20), -0.05);
      camS = { kind: 'orbit', target: new THREE.Vector3(0, 0, 0), yaw: 0, pitch: .9, dist: Math.max(50, total * 1.35), min: 10, max: 400, focus: 22 }; home = Object.assign({}, camS, { target: camS.target.clone() });
      const grpOf = a => (P.GROUPS.find(g => g[2] && g[2].includes(a)) || ['', '기타'])[1];
      root.querySelector('#g-sub').innerHTML = sel3.map(a => `<button class="chip sm" data-cc="${a}" aria-pressed="true" title="빼기">${P.C[a].flag} ${esc(nameOf(a))} ✕</button>`).join('')
        + `<select class="chip sm" id="g-cadd" aria-label="비교할 나라 더하기"><option value="">＋ 나라 더하기 (${pool.length}개 중 최대 5)</option>${P.GROUPS.filter(g => g[2]).map(g => `<optgroup label="${esc(g[1])}">${g[2].filter(a => pool.includes(a) && !sel3.includes(a)).map(a => `<option value="${a}">${P.C[a].flag} ${esc(nameOf(a))}</option>`).join('')}</optgroup>`).join('')}</select>`
        + `<button class="chip sm" data-real aria-pressed="${st.real}">📏 실제 크기 비교</button><span style="width:10px"></span>` + catChips();
      root.querySelectorAll('[data-cc]').forEach(b => b.onclick = () => { const a = b.dataset.cc; st.cmp = sel3.filter(x => x !== a); if (!st.cmp.length) st.cmp = ['KOR']; save(); build(); });
      root.querySelector('#g-cadd').onchange = e => { const a = e.target.value; if (!a) return; st.cmp = sel3.concat(a).slice(-5); save(); build(); };
      root.querySelector('[data-real]').onclick = () => { st.real = !st.real; save(); build(); }; bindCats(build);
      badge.textContent = st.real ? '📏 실제 크기 비율(같은 축척)' : '같은 크기로 맞춰 나란히';
      card.innerHTML = `<h3>🗺 나라 비교 관제도</h3><div class="small">나라를 최대 5곳까지 골라 나란히 봐요. <b>📏 실제 크기 비교</b>를 켜면 같은 축척으로 놓여 나라 크기 차이가 한눈에 보여요.</div>${cmpTable(sel3, grpOf)}<div class="small muted">지도 모양: Natural Earth · 넓이·해안선은 CIA World Factbook 대략값 · 인구는 Natural Earth 추정치 · 시차는 서머타임 제외 · 수온: Open-Meteo</div>`;
      if (net) sel3.forEach(a => { const inf = P.INFO && P.INFO[a]; if (!inf || !inf[5]) return; const put = v => { const c = card.querySelector(`[data-sst="${a}"]`); if (c) c.textContent = v; };
        if (sstCache[a]) { put(sstCache[a]); return; }
        fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${inf[5][0]}&longitude=${inf[5][1]}&current=sea_surface_temperature`).then(r => r.json()).then(j => { const v = j && j.current && j.current.sea_surface_temperature; sstCache[a] = v == null ? '자료 없음' : v.toFixed(1) + '℃'; put(sstCache[a]); }).catch(() => put('못 받음')); });
      listOut(sel3.map(nameOf).join(' · '));
    }

    /* ═════ 🌊 바다 속 ═════ */
    function buildUnder() {
      const seaKey = { 서해: '서', 남해: '남', 동해: '동', 제주: '제' }[st.sea], cl = (SD.CLARITY || {})[st.sea] || [3, 8];
      const BG = { 서해: '#0B3A3A', 남해: '#08324A', 동해: '#06244F', 제주: '#06385A' }[st.sea];
      scene.background = new THREE.Color(BG); scene.fog = new THREE.FogExp2(BG, 0.022 / Math.sqrt((cl[0] + cl[1]) / 2));
      amb.intensity = .8; sunL.position.set(10, 80, 20);
      const Wd = 60, Dp = 30, H = 36;
      // 수면(물결)
      const sg = new THREE.PlaneGeometry(Wd, Dp, 40, 20); sg.rotateX(-Math.PI / 2);
      const surf = new THREE.Mesh(sg, new THREE.MeshPhongMaterial({ color: '#7FD6E8', transparent: true, opacity: .35, side: THREE.DoubleSide, shininess: 90, depthWrite: false })); world.add(surf);
      const base = sg.attributes.position.array.slice();
      anims.push(() => { const a = sg.attributes.position.array; for (let i = 0; i < a.length; i += 3) a[i + 1] = Math.sin(base[i] * .3 + t * 1.6) * .35 + Math.cos(base[i + 2] * .4 + t * 1.2) * .25; sg.attributes.position.needsUpdate = true; });
      // 층(개념도)
      const LY = { sur: [-1.5, -8, '수면층'], mid: [-10, -20, '중층'], bot: [-24, -33, '바닥층'], rock: [-18, -33, '암초'], flat: [-1.5, -6, '갯벌·얕은 곳'] };
      [['sur', '#5FD0F0'], ['mid', '#3F8FD0'], ['bot', '#2A5A9A']].forEach(([k, c]) => { const y = (LY[k][0] + LY[k][1]) / 2, m = new THREE.Mesh(new THREE.BoxGeometry(Wd * .7, LY[k][0] - LY[k][1], Dp * .9), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .05, depthWrite: false })); m.position.set(-Wd * .05, y, 0); world.add(m); label(LY[k][2], new THREE.Vector3(-Wd / 2 + 3, LY[k][0] - 1, Dp / 2), '', null); });
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(Wd, Dp), new THREE.MeshLambertMaterial({ color: '#8A7A5A' })); floor.rotation.x = -Math.PI / 2; floor.position.y = -H; world.add(floor);
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(12, 1.2, Dp), new THREE.MeshLambertMaterial({ color: '#6E5E44' })); shelf.position.set(-Wd / 2 + 6, -6.5, 0); world.add(shelf); label('갯벌·얕은 곳', new THREE.Vector3(-Wd / 2 + 6, -5, Dp / 2), '', null);
      for (let i = 0; i < 7; i++) { const h = 6 + Math.random() * 14, r = new THREE.Mesh(new THREE.DodecahedronGeometry(2 + Math.random() * 2.5, 0), new THREE.MeshLambertMaterial({ color: '#5A5560' })); r.scale.y = h / 4; r.position.set(16 + Math.random() * 12, -H + h / 2, -Dp / 2 + 3 + Math.random() * (Dp - 6)); world.add(r); }
      label('암초', new THREE.Vector3(22, -14, Dp / 2), '', null);
      for (let i = 0; i < 18; i++) { const pts = [], x = 12 + Math.random() * 18, z = -Dp / 2 + Math.random() * Dp, hh = 8 + Math.random() * 12; for (let k = 0; k <= 12; k++) pts.push(new THREE.Vector3(x, -H + k / 12 * hh, z)); const kg = new THREE.BufferGeometry().setFromPoints(pts), kelp = new THREE.Line(kg, new THREE.LineBasicMaterial({ color: '#3FA060' })); world.add(kelp); const ph = Math.random() * 6; anims.push(() => { const a = kg.attributes.position.array; for (let k = 0; k <= 12; k++) a[k * 3] = x + Math.sin(t * 1.3 + ph + k * .35) * k * .08; kg.attributes.position.needsUpdate = true; }); }
      for (let i = 0; i < 5; i++) { const r = new THREE.Mesh(new THREE.PlaneGeometry(3, H), new THREE.MeshBasicMaterial({ color: '#BFF0FF', transparent: true, opacity: .06, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })); r.position.set(-20 + i * 9, -H / 2, -4 + Math.random() * 8); r.rotation.z = .25; world.add(r); const ph = Math.random() * 6; anims.push(() => { r.material.opacity = .04 + .04 * Math.sin(t + ph); }); }
      const bn = 160, bp = new Float32Array(bn * 3); for (let i = 0; i < bn; i++) bp.set([(Math.random() - .5) * Wd, -Math.random() * H, (Math.random() - .5) * Dp], i * 3);
      const bgeo = new THREE.BufferGeometry(); bgeo.setAttribute('position', new THREE.BufferAttribute(bp, 3)); world.add(new THREE.Points(bgeo, new THREE.PointsMaterial({ color: '#E6FBFF', size: .5, map: starTex, transparent: true, opacity: .7, depthWrite: false })));
      anims.push(dt => { const a = bgeo.attributes.position.array; for (let i = 1; i < a.length; i += 3) { a[i] += dt * 2.2; if (a[i] > 0) a[i] = -H; } bgeo.attributes.position.needsUpdate = true; });
      // 이 바다·이 달의 생물
      const list = (SD.species || []).filter(s => s.seas.includes(seaKey) && s.months.includes(+st.month));
      items = list.map(s => ({ kind: 'fish', s, name: s.name, ic: s.emo, sub: SD.LAYER[s.layer] || s.layer }));
      items.forEach((it, idx) => {
        const L = LY[it.s.layer] || LY.mid, n = it.s.kind === 'fish' ? 4 : 2, x0 = it.s.layer === 'rock' ? 14 : it.s.layer === 'flat' ? -Wd / 2 + 1 : -Wd / 2 + 4, x1 = it.s.layer === 'rock' ? Wd / 2 - 2 : it.s.layer === 'flat' ? -Wd / 2 + 11 : Wd / 2 - 18;
        const g = new THREE.Group(); g.userData.pick = it; world.add(g); picks.push(g);
        const fishes = []; for (let k = 0; k < n; k++) { const sp = sprite(it.ic, 2.3 - k * .3); sp.position.set(x0 + Math.random() * (x1 - x0), L[1] + Math.random() * (L[0] - L[1]), (Math.random() - .5) * Dp * .8); g.add(sp); fishes.push({ sp, v: new THREE.Vector3((Math.random() - .5) * 3, 0, (Math.random() - .5) * 2), ph: Math.random() * 6 }); }
        it.pos = fishes[0].sp.position; label(it.name, it.pos, '', it);
        const moving = it.s.kind === 'fish' || it.s.kind === 'squid';
        anims.push(dt => fishes.forEach(f => { if (!moving) return; const p = f.sp.position; p.addScaledVector(f.v, dt); p.y += Math.sin(t * 1.5 + f.ph) * dt * .4;
          if (p.x < x0 || p.x > x1) f.v.x *= -1; if (Math.abs(p.z) > Dp * .42) f.v.z *= -1; p.y = Math.max(L[1], Math.min(L[0], p.y)); f.sp.material.rotation = f.v.x > 0 ? 0 : 0; }));
      });
      camS = { kind: 'orbit', target: new THREE.Vector3(0, -H / 2, 0), yaw: .35, pitch: .28, dist: 64, min: 15, max: 140, focus: 26 }; home = Object.assign({}, camS, { target: camS.target.clone() });
      root.querySelector('#g-sub').innerHTML = ['서해', '남해', '동해', '제주'].map(s => `<button class="chip sm" data-sea="${s}" aria-pressed="${st.sea === s}">${s}</button>`).join('') + `<label class="small muted">달 <select id="g-month">${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}" ${+st.month === i + 1 ? 'selected' : ''}>${i + 1}월</option>`).join('')}</select></label>`;
      root.querySelectorAll('[data-sea]').forEach(b => b.onclick = () => { st.sea = b.dataset.sea; save(); build(); });
      root.querySelector('#g-month').onchange = e => { st.month = +e.target.value; save(); build(); };
      badge.textContent = `${st.sea} 물 맑기 약 ${cl[0]}~${cl[1]}m · ${st.month}월 ${items.length}종`;
      card.innerHTML = `<h3>🌊 ${esc(st.sea)} 바다 속 관제도</h3><div class="small">${st.month}월에 ${esc(st.sea)}에서 볼 수 있는 생물이 <b>사는 층</b>(수면·중층·바닥·암초·갯벌)에서 헤엄쳐요. 생물을 누르면 잡는 법·주의·금어기가 나와요.</div><div class="small" style="color:#F5C46B">층을 나눠 보여 주는 개념도예요. 실제 수심·바닥 지형이 아닙니다(실제 수심은 공공데이터포털 키 연결 후).</div>`;
      listOut(`${st.sea} · ${st.month}월 생물`);
    }

    /* ═════ 🏝 국내 섬 ═════ */
    function buildIsles() {
      scene.background = new THREE.Color('#02060E'); world.add(stars); lights();
      const B = board('KOR', 52, 0, '#2E5A48'); world.add(B.g); holoFloor(90, -0.05);
      // 손으로 정리한 섬(대표 30 + 더한 섬) + OpenStreetMap 섬(받았으면) — 가까운 같은 이름은 하나로
      const hand = P.ISLAND_FALLBACK.map(x => ({ name: x[0], lat: x[1], lon: x[2], gun: (P.ISLE_INFO && P.ISLE_INFO[x[0]] || [])[0], desc: (P.ISLE_INFO && P.ISLE_INFO[x[0]] || [])[1] }))
        .concat((P.ISLE_MORE || []).map(x => ({ name: x[0], lat: x[1], lon: x[2], gun: x[3], desc: x[4] })));
      const osm = (W.islands || []).map(x => ({ name: x[0], lat: x[1], lon: x[2], wd: x[3] }));
      const src = hand.slice(); osm.forEach(o => { const h = src.find(x => x.name.replace(/\(.*\)/, '').split('·')[0] === o.name && Math.abs(x.lat - o.lat) < .2 && Math.abs(x.lon - o.lon) < .2); if (h) { h.wd = o.wd; } else src.push(o); });
      const trailNames = ((opt.trails && opt.trails.islands) || []).filter(x => x.routes && x.routes.length).map(x => x.name);
      const famous = new Set(P.ISLAND_FALLBACK.map(x => x[0]));
      items = src.filter(x => x.lat > 33 && x.lat < 38.7 && x.lon > 124.5 && x.lon < 132).map(x => { const sea = seaOf(x.lat, x.lon), lg = LA ? LA.forIsle(x.name).length : 0; return { kind: 'isle', name: x.name, lat: x.lat, lon: x.lon, wd: x.wd, gun: x.gun, desc: x.desc, sea, ic: lg ? '📜' : '🏝', sub: (x.gun || sea) + (lg ? ' · 옛이야기' : ''), trail: trailNames.includes(x.name), famous: famous.has(x.name), lg }; })
        .filter(x => !st.iSea || x.sea === st.iSea).sort((a, b) => (b.famous - a.famous) || (b.lg - a.lg) || (b.trail - a.trail) || a.name.localeCompare(b.name, 'ko'));
      const geo = new THREE.SphereGeometry(.32, 10, 8);
      items.forEach(it => {
        const col = SEA_COL[it.sea], p = B.project(it.lat, it.lon), g = new THREE.Group();
        const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col })); m.position.copy(p).add(new THREE.Vector3(0, .5, 0)); g.add(m);
        const gl = glowS(col, it.famous ? 3 : 1.6, it.famous ? .9 : .6); gl.position.copy(m.position); g.add(gl);
        if (it.famous || it.trail) { const beam = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 3, 6), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false })); beam.position.copy(p).add(new THREE.Vector3(0, 2, 0)); g.add(beam); }
        g.userData.pick = it; it.pos = m.position.clone().add(new THREE.Vector3(0, it.famous ? 3.4 : .8, 0)); world.add(g); picks.push(g);
        if (it.famous || it.trail || it.lg) label((it.lg ? '📜 ' : '') + it.name + (it.trail ? ' 🥾' : ''), it.pos, '', it);
        const ph = Math.random() * 6; anims.push(() => { gl.material.opacity = (it.famous ? .6 : .35) + .3 * Math.sin(t * 2 + ph); });
      });
      camS = { kind: 'orbit', target: new THREE.Vector3(0, 0, 4), yaw: .15, pitch: 1.0, dist: 70, min: 10, max: 160, focus: 18 }; home = Object.assign({}, camS, { target: camS.target.clone() });
      const cnt = s => items.length && !st.iSea ? items.filter(x => x.sea === s).length : '';
      root.querySelector('#g-sub').innerHTML = `<button class="chip sm" data-is="" aria-pressed="${!st.iSea}">전체</button>` + ['서해', '남해', '동해', '제주'].map(s => `<button class="chip sm" data-is="${s}" aria-pressed="${st.iSea === s}"><span style="color:${SEA_COL[s]}">●</span> ${s} ${cnt(s)}</button>`).join('');
      root.querySelectorAll('[data-is]').forEach(b => b.onclick = () => { st.iSea = b.dataset.is; save(); build(); });
      badge.textContent = `섬 ${items.length}곳` + ((W.islands && W.islands.length) ? ' · OpenStreetMap 포함' : ' · 손으로 정리');
      card.innerHTML = `<h3>🏝 국내 섬 관제도</h3><div class="small">바다별 색으로 섬을 보여 줘요. 이름표가 붙은 곳은 대표 섬, 🥾는 섬길 자료, 📜는 옛이야기가 있는 섬이에요. 점을 누르면 섬 소개·지도·배편 링크와 옛이야기가 나와요.</div><div class="small muted">섬 위치 © OpenStreetMap 기여자(ODbL) · 바다 구분은 위치로 나눈 대략값</div>`;
      listOut(st.iSea ? st.iSea + ' 섬' : '국내 섬');
    }

    function build() {
      save(); clearWorld(); hoverObj = null;
      ({ globe: buildGlobe, korea: buildKorea, compare: buildCompare, under: buildUnder, isles: buildIsles })[st.mode]();
      camApply();
    }

    // ── 그리기 반복 ──
    const tmp = new THREE.Vector3(), camDir = new THREE.Vector3();
    let last = performance.now();
    function loop(now) {
      if (!alive) return; raf = requestAnimationFrame(loop);
      if (!root.isConnected) { destroy(); return; }
      if (document.hidden) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
      if (fly) { const k = Math.min(1, (now - fly.t0) / fly.ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, a = fly.from, b = fly.to;
        if (b.kind === 'globe') { let dl = b.lon - a.lon; while (dl > 180) dl -= 360; while (dl < -180) dl += 360; camS.lat = a.lat + (b.lat - a.lat) * e; camS.lon = a.lon + dl * e; camS.dist = a.dist + (b.dist - a.dist) * e; }
        else { camS.target.lerpVectors(a.target, b.target, e); camS.yaw = a.yaw + (b.yaw - a.yaw) * e; camS.pitch = a.pitch + (b.pitch - a.pitch) * e; camS.dist = a.dist + (b.dist - a.dist) * e; }
        if (k >= 1) fly = null; }
      else if (camS && camS.kind === 'globe' && !ptrs.size && !sel && !tour) camS.lon += dt * 1.5; // 천천히 자전
      anims.forEach(f => f(dt)); camApply();
      ren.render(scene, cam);
      // 이름표
      const w = stage.clientWidth, h = stage.clientHeight; cam.getWorldDirection(camDir); const many = labels.length > 45, near = camS.kind === 'globe' ? camS.dist < 40 : camS.dist < 45;
      labels.forEach(L => {
        tmp.copy(L.pos); let vis = true;
        if (camS.kind === 'globe') { const n = tmp.clone().normalize(), toCam = cam.position.clone().sub(tmp).normalize(); vis = n.dot(toCam) > 0.15; }
        if (vis && many && !near && L.cls !== 'big' && L.obj !== sel && L.obj !== (hoverObj && hoverObj.userData.pick)) vis = false;
        tmp.project(cam); if (tmp.z > 1 || Math.abs(tmp.x) > 1.1 || Math.abs(tmp.y) > 1.1) vis = false;
        if (!vis) { if (L.d.style.display !== 'none') L.d.style.display = 'none'; return; }
        L.d.style.display = ''; L.d.style.left = ((tmp.x + 1) / 2 * w) + 'px'; L.d.style.top = ((1 - tmp.y) / 2 * h - 4) + 'px';
      });
    }
    function destroy() { alive = false; cancelAnimationFrame(raf); tourStop(); ro.disconnect(); try { clearWorld(); ren.dispose(); } catch (e) {} }
    build(); raf = requestAnimationFrame(loop);
    return { destroy, open(mode) { st.mode = mode; root.querySelectorAll('[data-mode]').forEach(x => x.setAttribute('aria-pressed', x.dataset.mode === mode)); build(); } };
  }
  window.GlobeApp = { mount };
})();
