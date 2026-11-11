/* SeaApp — 「섬 · 바다 속」 화면 (PC 탭 · 휴대폰 앱 · 바다 조황 수첩 공용)
 *  SeaApp.mount(root, { data: SEA_DATA, trails: SEA_TRAILS, depth: SEA_DEPTH, places: PLACES_DATA, net: true, inPC })
 *  탭: 섬길 미리 걷기 · 바다 속 미리보기 · 바다 생물 도감 · 갯벌·조개잡이 · 섬 여행 코스 · 인어 바다지기 만화
 *  net=false(조황 수첩처럼 외부 접속이 막힌 곳)면 수온·물높이 예보를 부르지 않음
 *  도감 도장은 이 기기 localStorage 'sea.dex' — 바다 속 탐험 게임(games10.js)도 같은 곳에 찍음
 */
(function () {
  'use strict';
  const CSS = `
  .sea { --s-bg:#15191E; --s-panel:#1E242B; --s-well:#11151A; --s-line:#343C45; --s-fg:#E6EAEE; --s-muted:#9AA5B1; --s-dim:#6E7A86; --s-acc:#7FD6E8; --s-ok:#6FD3A4; --s-warn:#F5C46B; --s-bad:#FF8A8D; --s-sel:#1F6C80;
    color: var(--s-fg); display: grid; gap: 10px; font-size: 13.5px; line-height: 1.55; }
  .sea * { box-sizing: border-box; }
  .sea .tabs, .sea .bar { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  .sea .tab { border: 1px solid var(--s-line); background: var(--s-panel); color: var(--s-muted); border-radius: 8px; padding: 7px 12px; font-weight: 700; font-size: 13.5px; font-family: inherit; cursor: pointer; }
  .sea .tab[aria-selected="true"] { background: var(--s-sel); border-color: var(--s-sel); color: #fff; }
  .sea .box { background: var(--s-panel); border: 1px solid var(--s-line); border-radius: 10px; padding: 10px 12px; display: grid; gap: 8px; }
  .sea .btn { display: inline-flex; align-items: center; gap: 4px; min-height: 32px; border-radius: 6px; border: 1px solid var(--s-line); background: #2A3139; color: var(--s-fg); font-weight: 600; font-size: 13px; font-family: inherit; padding: 0 12px; cursor: pointer; text-decoration: none; }
  .sea .btn.primary { background: var(--s-sel); border-color: var(--s-sel); color: #fff; }
  .sea .btn[aria-pressed="true"] { border-color: var(--s-acc); color: var(--s-acc); }
  .sea select, .sea input { background: var(--s-well); color: var(--s-fg); border: 1px solid var(--s-line); border-radius: 6px; padding: 6px 9px; font: inherit; min-height: 34px; min-width: 0; }
  .sea input[type=range] { padding: 0; min-height: 24px; accent-color: var(--s-acc); }
  .sea .muted { color: var(--s-muted); } .sea .dim { color: var(--s-dim); } .sea .small { font-size: 12px; } .sea .warn { color: var(--s-warn); } .sea .bad { color: var(--s-bad); } .sea .ok { color: var(--s-ok); }
  .sea canvas { width: 100%; display: block; border-radius: 8px; background: #0C1A22; touch-action: none; }
  .sea .grid2 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 340px); gap: 10px; align-items: start; }
  .sea .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 8px; }
  .sea .card { background: var(--s-panel); border: 1px solid var(--s-line); border-radius: 10px; padding: 9px 11px; text-align: left; color: inherit; font: inherit; cursor: pointer; display: grid; gap: 3px; }
  .sea .card:hover, .sea .card:focus-visible { border-color: var(--s-acc); outline: none; }
  .sea .card.got { box-shadow: inset 3px 0 0 var(--s-ok); }
  .sea .chip { border: 1px solid var(--s-line); background: var(--s-well); color: var(--s-muted); border-radius: 999px; padding: 1px 8px; font-size: 11.5px; display: inline-block; }
  .sea .chip.w { border-color: var(--s-warn); color: var(--s-warn); }
  .sea .stat { display: flex; gap: 14px; flex-wrap: wrap; } .sea .stat b { font-size: 18px; display: block; }
  .sea .notice { border-left: 3px solid var(--s-acc); padding: 6px 10px; background: var(--s-well); border-radius: 6px; }
  .sea .notice.w { border-color: var(--s-warn); }
  .sea .say { min-height: 42px; font-size: 14px; }
  .sea .comic { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .sea .comic figure { margin: 0; background: #0C1A22; border: 2px solid #2A3B47; border-radius: 8px; overflow: hidden; }
  .sea .comic figcaption { padding: 6px 8px; font-size: 13px; background: #F4F1E8; color: #1D232A; min-height: 52px; }
  .sea table { border-collapse: collapse; width: 100%; } .sea td, .sea th { border-bottom: 1px solid var(--s-line); padding: 4px 6px; text-align: left; font-size: 12.5px; }
  @media (max-width: 760px) { .sea .grid2 { grid-template-columns: 1fr; } }
  @media (max-width: 420px) { .sea .comic { grid-template-columns: 1fr; } }`;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  function hav(a, b) { const R = 6371000, p = Math.PI / 180, dl = (b[0] - a[0]) * p, dn = (b[1] - a[1]) * p;
    const h = Math.sin(dl / 2) ** 2 + Math.cos(a[0] * p) * Math.cos(b[0] * p) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }
  const POI = { view: ['🔭', '전망대'], wc: ['🚻', '화장실'], ferry: ['⛴', '선착장'], fish: ['🎣', '낚시 자리'], beach: ['🏖', '해변'], peak: ['⛰', '봉우리'], light: ['🗼', '등대'], camp: ['⛺', '야영장'], info: ['ℹ', '안내'] };
  // 섬 목록(자료를 아직 못 받은 섬도 이름·배편은 보여 줌)
  const ISLES = [['geumo', '금오도', '여수'], ['cheongsan', '청산도', '완도'], ['yokji', '욕지도', '통영'], ['somaemul', '소매물도', '통영'], ['bijin', '비진도', '통영'], ['oeyeon', '외연도', '보령'], ['geomun', '거문도', '여수'], ['udo', '우도', '제주'], ['gapa', '가파도', '서귀포'], ['deokjeok', '덕적도', '인천 옹진'], ['ulleung', '울릉도', '울릉']];

  function mount(root, opts) {
    const D = opts.data, T = (opts.trails && opts.trails.islands) || [], DEP = (opts.depth && opts.depth.lines) || [], P = opts.places || { regions: {} };
    const net = opts.net !== false;
    if (!document.getElementById('sea-css')) { const st = document.createElement('style'); st.id = 'sea-css'; st.textContent = CSS; document.head.appendChild(st); }
    root.classList.add('sea');
    const TABS = [['trail', '🏝 섬길 미리 걷기'], ['under', '🌊 바다 속 미리보기'], ['dex', '🐚 바다 생물 도감'], ['mud', '🦀 갯벌·조개잡이'], ['course', '⛴ 섬 여행 코스'], ['comic', '🧜 바다지기 만화']];
    const st = Object.assign({ tab: 'trail', isle: (T[0] && T[0].id) || 'geumo', route: 0, under: '통영', kind: '', sea: '', season: true, q: '', comic: 0 }, lsGet('sea.ui', {}));
    let stop = () => {};
    const link = (url, label) => `<a class="btn" href="${esc(url)}" target="_blank" rel="noopener">${label}</a>`;
    const kakao = (q) => 'https://map.kakao.com/?q=' + encodeURIComponent(q);
    const month = new Date().getMonth() + 1;
    const dex = () => lsGet('sea.dex', {});

    function render() {
      stop(); stop = () => {};
      lsSet('sea.ui', { tab: st.tab, isle: st.isle, route: st.route, under: st.under, kind: st.kind, sea: st.sea, season: st.season, comic: st.comic });
      root.innerHTML = `<div class="tabs" role="tablist">${TABS.map(([k, l]) => `<button class="tab" role="tab" data-tab="${k}" aria-selected="${st.tab === k}">${l}</button>`).join('')}</div><div id="sea-body"></div>`;
      root.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { st.tab = b.dataset.tab; render(); });
      const body = root.querySelector('#sea-body');
      ({ trail: trailView, under: underView, dex: dexView, mud: mudView, course: courseView, comic: comicView })[st.tab](body);
    }
    function go(tab, patch) { Object.assign(st, patch || {}); st.tab = tab; render(); root.scrollIntoView({ block: 'start' }); }

    /* ───────── 🏝 섬길 미리 걷기 ───────── */
    function trailView(el) {
      const isle = T.find(x => x.id === st.isle), meta = ISLES.find(x => x[0] === st.isle) || ISLES[0];
      const routes = isle ? isle.routes : [];
      if (st.route >= routes.length) st.route = 0;
      const r = routes[st.route];
      const course = D.COURSE.find(c => c.island === st.isle);
      el.innerHTML = `<div class="box"><div class="bar">
          <select id="sea-isle" aria-label="섬 고르기">${ISLES.map(([id, n, g]) => `<option value="${id}" ${id === st.isle ? 'selected' : ''}>${n} (${g})${T.find(x => x.id === id && x.routes.length) ? '' : ' · 길 자료 준비 중'}</option>`).join('')}</select>
          ${routes.length > 1 ? `<select id="sea-route" aria-label="코스 고르기">${routes.map((x, i) => `<option value="${i}" ${i === st.route ? 'selected' : ''}>${esc(x.name)} · ${x.km}km</option>`).join('')}</select>` : ''}
        </div>
        ${isle ? `<div class="small muted">⛴ 가는 배: ${esc(isle.ferry)} · ${link(D.FERRY[1], '여객선 시간표(공식)')}</div>` : ''}</div>
        ${r ? `<div class="grid2"><div class="box">
            <canvas id="sea-map" height="360" aria-label="섬길 지도"></canvas>
            <canvas id="sea-ele" height="110" aria-label="오르막 그래프"></canvas>
            <div class="bar"><button class="btn primary" id="sea-play">▶ 미리 걷기</button>
              <label class="small muted">빠르기 <select id="sea-spd"><option value="1">보통</option><option value="3" selected>빠르게</option><option value="8">아주 빠르게</option></select></label>
              <input type="range" id="sea-pos" min="0" max="1000" value="0" aria-label="걸은 위치" style="flex:1 1 140px"></div>
            <div class="say" id="sea-say" aria-live="polite">▶ 를 누르면 점이 길을 따라 걸으며 지나는 곳을 알려 줍니다.</div>
            <div class="small dim">길·장소 © OpenStreetMap 기여자(ODbL) · 고도 Open-Meteo · 자료 ${esc((opts.trails || {}).updated || '')}</div></div>
          <div class="box" id="sea-info"></div></div>`
        : `<div class="box"><div class="notice w">「${esc(meta[1])}」 길 자료를 아직 받지 못했습니다(OpenStreetMap 공용 서버가 바빠 매일 아침 다시 받습니다).</div>
            <div class="bar">${link(kakao(meta[1] + ' 둘레길'), '🗺 카카오맵에서 보기')}${link(D.FERRY[1], '⛴ 여객선 시간표(공식)')}</div></div>`}
        ${course ? `<div class="box"><b>⛴ 이 섬 1박 코스: ${esc(course.name)}</b><div class="bar"><button class="btn" data-go-course>코스 보기</button><button class="btn" data-go-under="${esc(course.region)}">🌊 이 바다 속 보기</button></div></div>` : ''}`;
      el.querySelector('#sea-isle').onchange = e => { st.isle = e.target.value; st.route = 0; render(); };
      if (el.querySelector('#sea-route')) el.querySelector('#sea-route').onchange = e => { st.route = +e.target.value; render(); };
      el.querySelectorAll('[data-go-course]').forEach(b => b.onclick = () => go('course'));
      el.querySelectorAll('[data-go-under]').forEach(b => b.onclick = () => go('under', { under: b.dataset.goUnder }));
      if (!r) return;
      // 거리 누적·오르막
      // 고도(90m 격자)는 들쭉날쭉해 앞뒤 7점 평균으로 다듬음
      const pts = r.pts.map((p, i, a) => { let s = 0, n = 0; for (let k = Math.max(0, i - 3); k <= Math.min(a.length - 1, i + 3); k++) { s += a[k][2]; n++; } return [p[0], p[1], s / n]; }), cum = [0]; let up = 0, top = -1e9, low = 1e9;
      for (let i = 1; i < pts.length; i++) { cum.push(cum[i - 1] + hav(pts[i - 1], pts[i])); const d = pts[i][2] - pts[i - 1][2]; if (d > 0) up += d; }
      pts.forEach(p => { top = Math.max(top, p[2]); low = Math.min(low, p[2]); });
      const total = cum[cum.length - 1], mins = Math.round(total / 1000 / 3.5 * 60 + up / 100 * 10);
      const near = isle.pois.map(p => { let bi = 0, bd = 1e9; for (let i = 0; i < pts.length; i++) { const d = hav(pts[i], [p[2], p[3]]); if (d < bd) { bd = d; bi = i; } } return { k: p[0], n: p[1], lat: p[2], lon: p[3], at: cum[bi], d: bd }; }).filter(p => p.d < 250).sort((a, b) => a.at - b.at);
      const info = el.querySelector('#sea-info');
      info.innerHTML = `<b>${esc(r.name)}</b>${r.from || r.to ? `<div class="small muted">${esc(r.from)} → ${esc(r.to)}</div>` : ''}
        <div class="stat"><div><b>${(total / 1000).toFixed(1)}km</b><span class="small muted">거리</span></div><div><b>${Math.round(up)}m</b><span class="small muted">오르막 합</span></div><div><b>${Math.floor(mins / 60) ? Math.floor(mins / 60) + '시간 ' : ''}${mins % 60}분</b><span class="small muted">예상(쉬는 시간 빼고)</span></div><div><b>${Math.round(top)}m</b><span class="small muted">가장 높은 곳</span></div></div>
        <div class="small">${up > 300 ? '<span class="warn">⛰ 오르막이 많은 길 — 등산화·물 넉넉히</span>' : up > 120 ? '오르내림이 조금 있는 길 — 운동화면 충분' : '평탄한 편 — 아이·어르신도 무난'}</div>
        <div><b class="small">길에서 만나는 곳</b>${near.length ? `<table>${near.slice(0, 14).map(p => `<tr><td>${POI[p.k][0]} ${esc(p.n || POI[p.k][1])}</td><td class="dim">${(p.at / 1000).toFixed(1)}km 지점</td></tr>`).join('')}</table>` : '<div class="small dim">OSM에 표시된 곳이 아직 적습니다.</div>'}</div>
        <div class="bar">${link(`https://map.kakao.com/link/map/${encodeURIComponent(r.name + ' 출발')},${pts[0][0]},${pts[0][1]}`, '📍 출발점 카카오맵')}${link(`https://map.kakao.com/link/to/${encodeURIComponent(r.name + ' 출발')},${pts[0][0]},${pts[0][1]}`, '🚗 출발점 길찾기')}</div>`;
      // 그리기
      const cv = el.querySelector('#sea-map'), ev = el.querySelector('#sea-ele');
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const fit = c => { const w = c.clientWidth || 600, h = +c.getAttribute('height'); c.width = w * dpr; c.height = h * dpr; c.style.height = h + 'px'; const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); return [g, w, h]; };
      let la0 = 1e9, la1 = -1e9, lo0 = 1e9, lo1 = -1e9;
      pts.forEach(p => { la0 = Math.min(la0, p[0]); la1 = Math.max(la1, p[0]); lo0 = Math.min(lo0, p[1]); lo1 = Math.max(lo1, p[1]); });
      near.forEach(p => { la0 = Math.min(la0, p.lat); la1 = Math.max(la1, p.lat); lo0 = Math.min(lo0, p.lon); lo1 = Math.max(lo1, p.lon); });
      const kx = Math.cos((la0 + la1) / 2 * Math.PI / 180);
      let pos = 0, prev = 0, playing = false, last = 0, raf = 0, said = -1;
      const sayEl = el.querySelector('#sea-say'), posEl = el.querySelector('#sea-pos'), playEl = el.querySelector('#sea-play');
      function at(dist) { let i = 1; while (i < cum.length - 1 && cum[i] < dist) i++; const a = pts[i - 1], b = pts[i], f = cum[i] === cum[i - 1] ? 0 : (dist - cum[i - 1]) / (cum[i] - cum[i - 1]); return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, i]; }
      function draw() {
        const [g, w, h] = fit(cv), pad = 22, sx = (w - pad * 2) / Math.max(1e-6, (lo1 - lo0) * kx), sy = (h - pad * 2) / Math.max(1e-6, la1 - la0), s = Math.min(sx, sy);
        const ox = (w - (lo1 - lo0) * kx * s) / 2, oy = (h - (la1 - la0) * s) / 2;
        const X = lo => ox + (lo - lo0) * kx * s, Y = la => h - oy - (la - la0) * s;
        const sea = g.createLinearGradient(0, 0, 0, h); sea.addColorStop(0, '#0E2F3D'); sea.addColorStop(1, '#0A2230'); g.fillStyle = sea; g.fillRect(0, 0, w, h);
        // 길 주변을 섬(땅)처럼 굵게 칠해 윤곽 느낌
        g.lineJoin = g.lineCap = 'round'; g.strokeStyle = '#2C4A34'; g.lineWidth = 34; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(X(p[1]), Y(p[0])) : g.moveTo(X(p[1]), Y(p[0]))); g.stroke();
        g.strokeStyle = '#3B6346'; g.lineWidth = 18; g.stroke();
        // 고도에 따라 색 바뀌는 길
        for (let i = 1; i < pts.length; i++) { const t = (pts[i][2] - low) / Math.max(1, top - low); g.strokeStyle = `hsl(${50 - t * 50},90%,${62 - t * 10}%)`; g.lineWidth = 3.2; g.beginPath(); g.moveTo(X(pts[i - 1][1]), Y(pts[i - 1][0])); g.lineTo(X(pts[i][1]), Y(pts[i][0])); g.stroke(); }
        const cur = at(pos);
        g.strokeStyle = '#FFFFFF'; g.lineWidth = 4; g.beginPath(); for (let i = 0; i < cur[3]; i++) i ? g.lineTo(X(pts[i][1]), Y(pts[i][0])) : g.moveTo(X(pts[i][1]), Y(pts[i][0])); g.lineTo(X(cur[1]), Y(cur[0])); g.stroke();
        g.font = '16px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        near.forEach(p => g.fillText(POI[p.k][0], X(p.lon), Y(p.lat)));
        g.fillStyle = '#7FD6E8'; g.beginPath(); g.arc(X(pts[0][1]), Y(pts[0][0]), 5, 0, 7); g.fill();
        g.fillStyle = '#FF7A4A'; g.beginPath(); g.arc(X(pts[pts.length - 1][1]), Y(pts[pts.length - 1][0]), 5, 0, 7); g.fill();
        g.font = '22px sans-serif'; g.fillText('🚶', X(cur[1]), Y(cur[0]) - 12);
        g.fillStyle = '#9AA5B1'; g.font = '11px sans-serif'; g.textAlign = 'left'; g.fillText('● 출발  ● 도착   ↑ 북쪽', 8, h - 9);
        // 오르막 그래프
        const [e, ew, eh] = fit(ev); e.fillStyle = '#0C1A22'; e.fillRect(0, 0, ew, eh);
        const EX = d => 8 + d / total * (ew - 16), EY = z => eh - 18 - (z - low) / Math.max(1, top - low) * (eh - 34);
        e.beginPath(); e.moveTo(EX(0), eh - 18); pts.forEach((p, i) => e.lineTo(EX(cum[i]), EY(p[2]))); e.lineTo(EX(total), eh - 18); e.closePath();
        const gr = e.createLinearGradient(0, 0, 0, eh); gr.addColorStop(0, 'rgba(245,196,107,.75)'); gr.addColorStop(1, 'rgba(111,211,164,.25)'); e.fillStyle = gr; e.fill();
        e.strokeStyle = '#fff'; e.beginPath(); e.moveTo(EX(pos), 4); e.lineTo(EX(pos), eh - 18); e.stroke();
        e.fillStyle = '#E6EAEE'; e.font = '11px sans-serif'; e.textAlign = 'left'; e.fillText(`${Math.round(cur[2])}m · ${(pos / 1000).toFixed(2)}km`, Math.min(EX(pos) + 4, ew - 90), 12);
        e.fillStyle = '#6E7A86'; e.fillText(`높이 ${Math.round(low)}~${Math.round(top)}m`, 8, eh - 4);
        posEl.value = Math.round(pos / total * 1000);
        // 지나는 곳 안내
        const hit = near.findIndex(p => (p.at > prev - 1 && p.at <= pos + 1) || Math.abs(p.at - pos) < 60); prev = pos;
        if (hit >= 0 && hit !== said) { said = hit; const p = near[hit]; sayEl.textContent = `${POI[p.k][0]} ${p.n || POI[p.k][1]} 지나는 중 — 출발에서 ${(p.at / 1000).toFixed(1)}km`; try { navigator.vibrate && playing && navigator.vibrate(30); } catch (x) {} }
        if (pos >= total && playing) { playing = false; playEl.textContent = '↺ 처음부터'; sayEl.textContent = `🏁 도착! ${(total / 1000).toFixed(1)}km, 실제로는 약 ${Math.floor(mins / 60) ? Math.floor(mins / 60) + '시간 ' : ''}${mins % 60}분 걸려요.`; }
      }
      function tick(t) { if (!playing) return; const dt = Math.min(.1, (t - last) / 1000); last = t; pos = Math.min(total, pos + dt * 60 * (+el.querySelector('#sea-spd').value) * (total / 6000 + 1)); draw(); raf = requestAnimationFrame(tick); }
      playEl.onclick = () => { if (pos >= total) { pos = 0; said = -1; } playing = !playing; playEl.textContent = playing ? '⏸ 멈춤' : '▶ 미리 걷기'; if (playing) { last = performance.now(); raf = requestAnimationFrame(tick); } };
      posEl.oninput = () => { pos = posEl.value / 1000 * total; prev = pos; draw(); };
      const ro = () => draw(); window.addEventListener('resize', ro);
      stop = () => { playing = false; cancelAnimationFrame(raf); window.removeEventListener('resize', ro); };
      draw();
    }

    /* ───────── 🌊 바다 속 미리보기 ───────── */
    function seaOf(name) { const R = P.regions[name]; if (R) return R[1]; const isl = { 금오도: '남해', 청산도: '남해', 욕지도: '남해', 소매물도: '남해', 비진도: '남해', 외연도: '서해', 거문도: '남해', 우도: '제주', 가파도: '제주', 덕적도: '서해', 울릉도: '동해' }; return isl[name] || '남해'; }
    function underView(el) {
      const names = Object.keys(P.regions).concat(ISLES.map(x => x[1]));
      const line = DEP.find(x => x.name === st.under);
      const sea = seaOf(st.under), sk = { 서해: '서', 남해: '남', 동해: '동', 제주: '제' }[sea] || '남';
      const live = D.species.filter(s => s.seas.includes(sk) && s.months.includes(month) && s.kind !== 'etc' || (s.seas.includes(sk) && s.kind === 'etc' && s.months.includes(month) && s.layer !== 'flat'));
      const cl = D.CLARITY[sea] || [3, 8];
      el.innerHTML = `<div class="box"><div class="bar"><select id="sea-under" aria-label="바다 고르기">${names.map(n => `<option ${n === st.under ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
          <span class="chip">${esc(sea)}</span><span class="chip">${month}월</span></div>
          ${line ? `<div class="small muted">실제 수심: 국립해양조사원 자연과학용 수심정보(150m 격자) · ${esc(st.under)}에서 ${({ W: '서쪽', E: '동쪽', S: '남쪽', N: '북쪽' })[line.dir]}으로 약 6km 단면 · 자료 ${esc(opts.depth.updated)}</div>`
          : `<div class="notice w small">📏 <b>실제 수심 자료 준비 중</b> — 공공데이터포털 「국립해양조사원 자연과학용 수심정보 조회」(무료) 활용신청 후 받은 인증키를 PC의 <code>%AppData%\\SunsangHelper\\depth-key.txt</code>에 넣으면 매일 작업에서 실제 바닥 모양을 그립니다. 그전에는 바닥 깊이 숫자를 그리지 않습니다.</div>`}</div>
        <div class="grid2"><div class="box"><canvas id="sea-under-cv" height="380" aria-label="바다 속 단면"></canvas>
          <div class="small dim">물고기 위치는 ${month}월에 이 바다에서 잘 보이는 층(도감 기준) — 실제와 다를 수 있어요.</div></div>
          <div class="box" id="sea-under-info"><b>오늘 이 바다</b><div id="sea-sst" class="small muted">${net ? '수온 불러오는 중…' : '수온: 이 화면에서는 외부 예보를 부르지 않습니다.'}</div>
            <div class="small">👀 물 맑기(참고): 약 ${cl[0]}~${cl[1]}m ${sea === '서해' ? '— 서해는 뻘물이라 흐린 편(형광·진한 색 미끼가 잘 보임)' : ''}</div>
            ${line ? `<div class="small">📏 가장 깊은 곳 <b>${line.max}m</b> (단면 ${line.prof.length ? line.prof[line.prof.length - 1][0] : 0}km)</div>` : ''}
            <div><b class="small">층별로 사는 고기 (${month}월)</b>${['sur', 'mid', 'rock', 'bot'].map(L => { const f = live.filter(s => s.layer === L); return f.length ? `<div class="small"><span class="chip">${D.LAYER[L][0]}</span> ${f.map(s => s.emo + ' ' + esc(s.name)).join(', ')}</div>` : ''; }).join('')}</div>
            <div class="small muted">채비·봉돌 호수는 「낚시점·선상 → 오늘의 채비」에서 어종별로 볼 수 있어요.</div>
            <div class="bar"><button class="btn" data-go-dex>🐚 도감에서 자세히</button></div></div></div>`;
      el.querySelector('#sea-under').onchange = e => { st.under = e.target.value; render(); };
      el.querySelector('[data-go-dex]').onclick = () => go('dex', { sea: sk, season: true });
      // 수온(무료 Open-Meteo, angler.js)
      const R = P.regions[st.under];
      if (net && window.AnglerKit && AnglerKit.seaTemp && (R || line)) {
        const la = R ? R[2] : line.lat, lo = R ? R[3] : line.lon;
        AnglerKit.seaTemp(la, lo).then(t => { const x = el.querySelector('#sea-sst'); if (!x) return; const v = t && t.t; const a = typeof v === 'number' ? AnglerKit.tempAdvice(v) : null; x.innerHTML = a ? `🌡 바다 수온 약 <b>${v.toFixed(1)}℃</b> (${esc(a.label)})${a.best.length ? ' — 잘 맞는 어종: ' + esc(a.best.join(', ')) : ''}${t.km ? ` <span class="dim">(${t.km}km 앞바다 값)</span>` : ''}` : '수온 정보를 받지 못했습니다.'; }).catch(() => { const x = el.querySelector('#sea-sst'); if (x) x.textContent = '수온 정보를 받지 못했습니다.'; });
      } else if (net) { const x = el.querySelector('#sea-sst'); if (x) x.textContent = '이 곳은 수온 위치 정보가 없습니다.'; }
      // 단면 그림(물결·햇빛·물고기 헤엄)
      const cv = el.querySelector('#sea-under-cv'), dpr = Math.min(2, window.devicePixelRatio || 1);
      const fishes = live.filter(s => s.layer !== 'flat').slice(0, 18).map((s, i) => ({ s, x: Math.random(), v: (.02 + Math.random() * .03) * (Math.random() < .5 ? -1 : 1), y: Math.random(), ph: Math.random() * 6 }));
      const bubbles = Array.from({ length: 24 }, () => ({ x: Math.random(), y: Math.random(), r: 1 + Math.random() * 2.5 }));
      let raf = 0, t0 = performance.now(), on = true;
      function floorAt(fx) { // 0~1 → 화면 깊이 비율(실제 자료 있을 때만)
        if (!line || !line.prof.length) return null; const km = fx * line.prof[line.prof.length - 1][0]; let a = line.prof[0], b = a;
        for (const p of line.prof) { if (p[0] <= km) a = p; if (p[0] >= km) { b = p; break; } } const f = b[0] === a[0] ? 0 : (km - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * f; }
      function frame(now) {
        if (!on) return; const t = (now - t0) / 1000;
        const w = cv.clientWidth || 600, h = 380; cv.width = w * dpr; cv.height = h * dpr; cv.style.height = h + 'px'; const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
        const top = 46, maxD = line ? Math.max(10, line.max * 1.08) : 40, Yd = d => top + d / maxD * (h - top - 26);
        g.fillStyle = '#9FD8F0'; g.fillRect(0, 0, w, top);
        g.fillStyle = '#FFE08A'; g.beginPath(); g.arc(w - 50, 22, 12, 0, 7); g.fill();
        const water = g.createLinearGradient(0, top, 0, h); const deep = sea === '서해' ? ['#3E7D7A', '#2B4F44'] : sea === '동해' ? ['#1E78B4', '#0A2148'] : sea === '제주' ? ['#22A3C7', '#0B2F55'] : ['#2A8DB0', '#0C2B45'];
        water.addColorStop(0, deep[0]); water.addColorStop(1, deep[1]); g.fillStyle = water;
        g.beginPath(); g.moveTo(0, top); for (let x = 0; x <= w; x += 8) g.lineTo(x, top + Math.sin(x / 26 + t * 2) * 3); g.lineTo(w, h); g.lineTo(0, h); g.closePath(); g.fill();
        // 햇살
        g.globalAlpha = .08; g.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { const x = (i * w / 5 + t * 12) % (w + 80) - 40; g.beginPath(); g.moveTo(x, top); g.lineTo(x + 30, top); g.lineTo(x + 90, h * .75); g.lineTo(x + 40, h * .75); g.fill(); } g.globalAlpha = 1;
        // 층 표시
        g.font = '11px sans-serif'; g.fillStyle = 'rgba(255,255,255,.55)'; g.textAlign = 'left';
        const layY = { sur: .1, mid: .42, rock: .7, bot: .86 };
        g.setLineDash([4, 6]); g.strokeStyle = 'rgba(255,255,255,.18)';
        [['표층', .2], ['중층', .55], ['바닥 가까이', .8]].forEach(([n, f]) => { const y = top + f * (h - top - 26); g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); g.fillText(n, 6, y - 4); });
        g.setLineDash([]);
        // 바닥
        if (line) {
          g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 4) { const d = floorAt(x / w); g.lineTo(x, Yd(d == null ? maxD : d)); } g.lineTo(w, h); g.closePath();
          const sand = g.createLinearGradient(0, h * .5, 0, h); sand.addColorStop(0, sea === '서해' ? '#6B5A45' : '#8C7A58'); sand.addColorStop(1, '#3D3326'); g.fillStyle = sand; g.fill();
          g.fillStyle = '#E6EAEE'; g.textAlign = 'right'; [.25, .5, .75, 1].forEach(f => { const d = maxD * f; g.fillText(Math.round(d) + 'm', w - 6, Yd(d) - 2); });
          g.textAlign = 'left'; g.fillText('← 항구·섬 쪽', 6, h - 8); g.textAlign = 'right'; g.fillText('먼 바다 →', w - 6, h - 8);
        } else {
          g.strokeStyle = 'rgba(245,196,107,.7)'; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(0, h - 30); g.lineTo(w, h - 30); g.stroke(); g.setLineDash([]);
          g.fillStyle = '#F5C46B'; g.textAlign = 'center'; g.fillText('바닥 모양: 실제 수심 자료 연결 후 표시', w / 2, h - 12);
        }
        // 해초·바위(암초층 고기가 있을 때)
        g.strokeStyle = '#3FAF6A'; g.lineWidth = 3; for (let i = 0; i < 7; i++) { const x = (i + .5) * w / 7, by = line ? Yd(floorAt(x / w) || maxD) : h - 30; g.beginPath(); g.moveTo(x, by); g.quadraticCurveTo(x + Math.sin(t + i) * 8, by - 18, x + Math.sin(t * 1.3 + i) * 5, by - 34); g.stroke(); } g.lineWidth = 1;
        // 거품
        g.fillStyle = 'rgba(255,255,255,.35)'; bubbles.forEach(b => { b.y -= .002; if (b.y < 0) { b.y = 1; b.x = Math.random(); } g.beginPath(); g.arc(b.x * w, top + b.y * (h - top), b.r, 0, 7); g.fill(); });
        // 물고기
        g.textAlign = 'center'; g.textBaseline = 'middle';
        fishes.forEach(f => { f.x += f.v / 60; if (f.x < -.05) f.x = 1.05; if (f.x > 1.05) f.x = -.05;
          let fy = top + (layY[f.s.layer] + (f.y - .5) * .12) * (h - top - 26) + Math.sin(t * 2 + f.ph) * 4;
          if (line && f.s.layer === 'bot') { const d = floorAt(f.x); if (d != null) fy = Yd(d) - 12; }
          g.save(); g.translate(f.x * w, fy); if (f.v > 0) g.scale(-1, 1); g.font = '20px sans-serif'; g.fillText(f.s.emo, 0, 0); g.restore();
          g.font = '10px sans-serif'; g.fillStyle = 'rgba(255,255,255,.8)'; g.fillText(f.s.name.replace(/\(.*\)/, ''), f.x * w, fy + 15); });
        g.textBaseline = 'alphabetic';
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
      stop = () => { on = false; cancelAnimationFrame(raf); };
    }

    /* ───────── 🐚 바다 생물 도감 ───────── */
    function dexView(el) {
      const got = dex();
      const list = D.species.filter(s => (!st.kind || s.kind === st.kind) && (!st.sea || s.seas.includes(st.sea)) && (!st.season || s.months.includes(month)) && (!st.q || s.name.includes(st.q)));
      const n = D.species.filter(s => got[s.name]).length;
      el.innerHTML = `<div class="box"><div class="bar">
          <input type="search" id="sea-q" placeholder="이름 찾기 (예: 꽃게)" value="${esc(st.q)}" aria-label="이름 찾기" style="flex:1 1 160px">
          <select id="sea-kind" aria-label="종류"><option value="">모든 종류</option>${Object.entries(D.KIND).map(([k, v]) => `<option value="${k}" ${k === st.kind ? 'selected' : ''}>${v}</option>`).join('')}</select>
          <select id="sea-sea" aria-label="바다"><option value="">모든 바다</option>${[['서', '서해'], ['남', '남해'], ['동', '동해'], ['제', '제주']].map(([k, v]) => `<option value="${k}" ${k === st.sea ? 'selected' : ''}>${v}</option>`).join('')}</select>
          <button class="btn" id="sea-season" aria-pressed="${st.season}">🗓 ${month}월 제철만</button></div>
        <div class="small muted">도장 ${n} / ${D.species.length} — 「봤어요·잡았어요」를 누르거나 🎮 바다 속 탐험 게임에서 사진을 찍으면 도장이 찍혀요.</div></div>
        <div class="cards">${list.map(s => `<button class="card ${got[s.name] ? 'got' : ''}" data-sp="${s.id}"><div><span style="font-size:22px">${s.emo}</span> <b>${esc(s.name)}</b> ${got[s.name] ? '<span class="chip">✔ 도장</span>' : ''}</div>
          <div class="small muted">${esc(D.KIND[s.kind])} · ${esc(D.LAYER[s.layer][0])} ${esc(s.depth)}m · 제철 ${s.months.slice(0, 4).join('·')}${s.months.length > 4 ? '…' : ''}월</div>
          ${s.ban || s.size ? `<div class="small warn">⚖ ${s.ban ? '금어기 ' + esc(s.ban) : ''}${s.ban && s.size ? ' · ' : ''}${s.size ? '체장 ' + esc(s.size) : ''}</div>` : ''}
          ${s.caution ? `<div class="small ${/⚠/.test(s.caution) ? 'bad' : 'muted'}">${esc(s.caution)}</div>` : ''}</button>`).join('') || '<div class="muted">조건에 맞는 생물이 없습니다.</div>'}</div>
        <div class="box"><b class="small">⚖ 금어기·금지 체장은 참고용입니다</b><div class="small muted">2025년 공개 자료 기준이며 지역·해마다 바뀝니다(「✓확인」은 해수부·지자체 자료로 다시 확인한 것). 낚시 전 꼭 공식 자료를 보세요.</div><div class="bar">${D.LAW.map(x => link(x[1], x[0])).join('')}</div></div>`;
      const q = el.querySelector('#sea-q'); const upd = () => { st.q = q.value.trim(); const c = q.selectionStart; render(); const nq = root.querySelector('#sea-q'); nq.focus(); try { nq.setSelectionRange(c, c); } catch (e) {} };
      q.addEventListener('input', e => { if (!e.isComposing) upd(); }); q.addEventListener('compositionend', upd);
      el.querySelector('#sea-kind').onchange = e => { st.kind = e.target.value; render(); };
      el.querySelector('#sea-sea').onchange = e => { st.sea = e.target.value; render(); };
      el.querySelector('#sea-season').onclick = () => { st.season = !st.season; render(); };
      el.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => detail(el, D.species.find(s => s.id === b.dataset.sp)));
    }
    function detail(el, s) {
      const got = dex();
      const box = document.createElement('div'); box.className = 'box'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', s.name);
      box.innerHTML = `<div class="bar"><span style="font-size:34px">${s.emo}</span><div><b style="font-size:17px">${esc(s.name)}</b><div class="small muted">${esc(D.KIND[s.kind])} · ${['서', '남', '동', '제'].filter(k => s.seas.includes(k)).map(k => ({ 서: '서해', 남: '남해', 동: '동해', 제: '제주' })[k]).join('·')}</div></div></div>
        <table><tr><th>제철</th><td>${s.months.join('·')}월 ${s.months.includes(month) ? '<span class="chip">지금 제철</span>' : ''}</td></tr>
          <tr><th>사는 곳</th><td>${esc(D.LAYER[s.layer][0])} — ${esc(D.LAYER[s.layer][1])}, 수심 약 ${esc(s.depth)}m</td></tr>
          <tr><th>잡는 법</th><td>${esc(s.how)}</td></tr><tr><th>먹는 법</th><td>${esc(s.cook)}</td></tr>
          ${s.caution ? `<tr><th>주의</th><td class="${/⚠/.test(s.caution) ? 'bad' : ''}">${esc(s.caution)}</td></tr>` : ''}
          <tr><th>금어기</th><td>${esc(s.ban || '자료 없음 — 공식 표 확인')} ${s.checked ? '<span class="chip">✓확인</span>' : ''}</td></tr>
          <tr><th>금지 체장</th><td>${esc(s.size || '자료 없음 — 공식 표 확인')}</td></tr></table>
        <div class="bar"><button class="btn primary" id="sea-stamp">${got[s.name] ? '✔ 도장 찍힘 (누르면 지우기)' : '👀 봤어요·잡았어요 도장'}</button><button class="btn" id="sea-close">닫기</button></div>`;
      el.prepend(box); box.scrollIntoView({ block: 'nearest' });
      box.querySelector('#sea-close').onclick = () => box.remove();
      box.querySelector('#sea-stamp').onclick = () => { const g = dex(); if (g[s.name]) delete g[s.name]; else g[s.name] = Date.now(); lsSet('sea.dex', g); render(); };
    }

    /* ───────── 🦀 갯벌·조개잡이 ───────── */
    function mudView(el) {
      el.innerHTML = `<div class="box"><b>🦀 갯벌 체험 전에 꼭</b><ul style="margin:0;padding-left:18px">${D.MUD_TIPS.map(t => `<li class="small ${/⚠/.test(t) ? 'warn' : ''}">${esc(t)}</li>`).join('')}</ul>
          <div class="small muted">체험 요금·예약은 마을에 직접 문의하세요(이 앱은 예약·결제를 하지 않습니다).</div></div>
        <div class="cards">${D.mud.map(m => `<div class="card" style="cursor:default"><b>${esc(m.name)}</b><div class="small muted">${esc(m.city)} · ${esc(m.addr)}</div>
          <div class="small">🐚 ${esc(m.catch)}</div><div class="small">${esc(m.note)}</div>
          <div class="small" data-low="${esc(m.region)}">${net ? '🌊 오늘 물 빠지는 시각 계산 중…' : ''}</div>
          <div class="bar">${link('https://place.map.kakao.com/' + m.kakao, '📍 카카오맵')}${link(`https://map.kakao.com/?q=${encodeURIComponent(m.name)}&target=car`, '🚗 길찾기')}</div></div>`).join('')}</div>
        <div class="small dim">물 빠지는 시각은 Open-Meteo 해수면 높이 예보(기준 지역 바다, 1시간 간격)로 계산한 참고값입니다. 마을 안내·국립해양조사원 물때표를 함께 보세요.</div>`;
      if (!net) return;
      const regs = [...new Set(D.mud.map(m => m.region))];
      regs.forEach(async rg => {
        const R = P.regions[rg]; if (!R) return;
        let txt = '🌊 물때 예보를 받지 못했습니다.';
        try {
          const j = await (await fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${R[2]}&longitude=${R[3]}&hourly=sea_level_height_msl&timezone=Asia%2FSeoul&forecast_days=2`)).json();
          const tt = j.hourly.time, h = j.hourly.sea_level_height_msl, lows = [];
          for (let i = 1; i < h.length - 1; i++) if (h[i] != null && h[i] <= h[i - 1] && h[i] < h[i + 1]) lows.push(i);
          const now = Date.now(), up = lows.filter(i => new Date(tt[i]).getTime() > now - 2 * 3600e3).slice(0, 2);
          const fmt = i => { const d = new Date(tt[i]); return `${d.getDate() === new Date().getDate() ? '오늘' : '내일'} ${d.getHours()}시경`; };
          const day = lows.filter(i => { const hr = new Date(tt[i]).getHours(); return hr >= 7 && hr <= 17 && new Date(tt[i]).getTime() > now; })[0];
          if (up.length) txt = `🌊 물 빠지는 시각(간조): ${up.map(fmt).join(', ')}${day != null ? ` · 낮 체험 추천 <b>${fmt(day)} 앞뒤 2시간</b>` : ''}`;
        } catch (e) {}
        el.querySelectorAll(`[data-low="${CSS_ESC(rg)}"]`).forEach(x => x.innerHTML = txt);
      });
    }
    const CSS_ESC = s => (window.CSS && CSS.escape ? CSS.escape(s) : s.replace(/["\\]/g, '\\$&'));

    /* ───────── ⛴ 섬 여행 미리가보기 코스 ───────── */
    function courseView(el) {
      el.innerHTML = `<div class="box"><b>⛴ 출조 + 섬 1박 코스</b><div class="small muted">여객선 시간·요금·결항은 공식 사이트에서 확인하세요(앱은 예매하지 않습니다). 먼 섬은 바람에 배가 안 뜰 수 있어 하루 여유를 두세요.</div><div class="bar">${link(D.FERRY[1], '⛴ ' + D.FERRY[0])}</div></div>
        <div class="cards">${D.COURSE.map((c, i) => { const has = T.find(x => x.id === c.island && x.routes.length); const nm = (ISLES.find(x => x[0] === c.island) || [])[1] || '';
          return `<div class="card" style="cursor:default"><b>${esc(c.name)}</b>
          <ol style="margin:2px 0;padding-left:18px">${c.days.map(d => `<li class="small">${esc(d)}</li>`).join('')}</ol>
          <div class="small">🎣 ${esc(c.fish)}</div><div class="small">🛏 ${esc(c.stay)}</div><div class="small warn">💡 ${esc(c.tip)}</div>
          <div class="bar"><button class="btn" data-isle="${c.island}">🏝 섬길 미리 걷기${has ? '' : '(준비 중)'}</button><button class="btn" data-under="${esc(nm)}">🌊 바다 속</button>${link(kakao(nm + ' 여객선터미널'), '📍 배 타는 곳')}${link(kakao(nm + ' 민박'), '🛏 숙소 찾기')}</div></div>`; }).join('')}</div>`;
      el.querySelectorAll('[data-isle]').forEach(b => b.onclick = () => go('trail', { isle: b.dataset.isle, route: 0 }));
      el.querySelectorAll('[data-under]').forEach(b => b.onclick = () => go('under', { under: b.dataset.under }));
    }

    /* ───────── 🧜 인어 바다지기 「물결이」 네 컷 만화 ───────── */
    function mermaid(x, y, s, mood) {
      // 직접 그린 인어: 청록 꼬리, 산호색 머리, 조개 머리핀
      return `<g transform="translate(${x},${y}) scale(${s})">
        <path d="M0 10 C -14 40 -6 70 14 86 L 2 100 L 22 92 L 34 104 L 30 84 C 40 64 34 34 20 12 Z" fill="#2BB5A8" stroke="#137A72" stroke-width="2"/>
        <path d="M2 40 Q 18 46 30 40 M4 56 Q 18 62 32 56 M8 72 Q 20 78 32 72" stroke="#7FE3D6" stroke-width="2" fill="none"/>
        <ellipse cx="14" cy="4" rx="13" ry="12" fill="#FFD9B8"/>
        <rect x="3" y="12" width="22" height="8" rx="4" fill="#FF8FA3"/>
        <path d="M-2 0 C -6 -22 34 -22 30 2 C 34 18 34 30 28 40 C 24 24 26 10 22 -4 C 14 -8 6 -8 4 -2 C 2 12 -2 24 -6 34 C -10 22 -6 10 -2 0 Z" fill="#FF7A59"/>
        <path d="M20 -12 l5 -4 l5 4 l-5 3 z" fill="#FFE08A"/>
        <circle cx="9" cy="3" r="1.8" fill="#1D232A"/><circle cx="19" cy="3" r="1.8" fill="#1D232A"/>
        <path d="${mood === 'worry' ? 'M9 11 Q 14 7 19 11' : 'M9 9 Q 14 14 19 9'}" stroke="#1D232A" stroke-width="1.6" fill="none"/>
        <path d="M24 20 Q 40 ${mood === 'wave' ? '0' : '24'} 44 ${mood === 'wave' ? '-6' : '30'}" stroke="#FFD9B8" stroke-width="5" stroke-linecap="round" fill="none"/></g>`;
    }
    function angler(x, y, s) {
      return `<g transform="translate(${x},${y}) scale(${s})"><circle cx="0" cy="0" r="11" fill="#FFD9B8"/><path d="M-12 -4 Q 0 -18 12 -4 Z" fill="#334"/><rect x="-14" y="10" width="28" height="34" rx="6" fill="#FF8A1E"/><rect x="-10" y="14" width="20" height="18" rx="3" fill="#FFB65C"/><circle cx="-4" cy="0" r="1.6" fill="#1D232A"/><circle cx="4" cy="0" r="1.6" fill="#1D232A"/><path d="M-4 5 Q 0 8 4 5" stroke="#1D232A" fill="none"/><path d="M14 18 L 44 -26" stroke="#8B6B3E" stroke-width="3"/><path d="M44 -26 Q 50 10 52 30" stroke="#ccc" stroke-width="1" fill="none"/></g>`;
    }
    function panel(key) {
      const sea = (c1, c2) => `<defs><linearGradient id="g${key}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="200" height="130" fill="url(#g${key})"/>`;
      const waves = `<path d="M0 70 Q 25 62 50 70 T 100 70 T 150 70 T 200 70 V130 H0Z" fill="#1F7FA6"/><path d="M0 80 Q 25 74 50 80 T 100 80 T 150 80 T 200 80 V130 H0Z" fill="#16618A"/>`;
      const boat = `<path d="M60 66 H150 L138 82 H72 Z" fill="#F4F1E8" stroke="#334" stroke-width="2"/><rect x="96" y="44" width="26" height="22" fill="#E7E2D3" stroke="#334" stroke-width="2"/><rect x="101" y="49" width="8" height="7" fill="#9FD8F0"/>`;
      const P = {
        boat: sea('#BFE7F5', '#7CC6E6') + waves + boat + mermaid(18, 72, .5, 'wave'),
        angler: sea('#BFE7F5', '#7CC6E6') + waves + boat + angler(118, 22, .8),
        wave: sea('#8FB8C8', '#5E8EA6') + `<path d="M0 90 C 40 20 80 10 120 40 C 90 40 80 70 110 90 V130 H0Z" fill="#1F7FA6" stroke="#fff" stroke-width="3"/>` + boat.replace('M60 66', 'M70 76').replace('x="96" y="44"', 'x="106" y="54"').replace('x="101" y="49"', 'x="111" y="59"') + `<text x="150" y="40" font-size="26" font-weight="900" fill="#fff" stroke="#16618A" stroke-width="1">철썩!</text>`,
        ok: sea('#FFE9B8', '#FFC9A8') + `<circle cx="160" cy="30" r="16" fill="#FFF3B0"/>` + mermaid(70, 26, .9, 'happy') + `<text x="150" y="110" font-size="30">👍</text>`,
        flat: sea('#D9E8EE', '#C9DCE3') + `<path d="M0 80 Q 100 66 200 80 V130 H0Z" fill="#7A6A55"/><circle cx="40" cy="100" r="3" fill="#EEE"/><circle cx="120" cy="96" r="3" fill="#EEE"/><circle cx="160" cy="108" r="3" fill="#EEE"/>` + mermaid(150, 30, .55, 'wave'),
        tide: sea('#D9E8EE', '#B5D3DF') + `<path d="M0 86 Q 100 70 200 86 V130 H0Z" fill="#7A6A55"/><path d="M200 60 Q 140 70 120 86 Q 150 96 200 98Z" fill="#2E9BC2" opacity=".85"/><text x="120" y="56" font-size="22">⏰➡</text>` + angler(46, 50, .7),
        fish: sea('#BFE7F5', '#7CC6E6') + waves + angler(60, 26, .8) + `<text x="120" y="70" font-size="24">🐟</text>`,
        mermaid: sea('#9ED6EA', '#3E8FB8') + mermaid(80, 20, .9, 'happy') + `<text x="20" y="60" font-size="20">💬</text>`,
        release: sea('#3E9CC2', '#1A5A86') + `<text x="80" y="80" font-size="34">🐟</text><text x="60" y="40" font-size="14" fill="#fff">퐁당~</text><circle cx="120" cy="50" r="5" fill="none" stroke="#fff"/><circle cx="132" cy="36" r="3" fill="none" stroke="#fff"/>`,
        trash: sea('#9ED6EA', '#3E8FB8') + mermaid(70, 18, .9, 'worry') + `<path d="M40 40 C 120 120, 140 0, 180 90" stroke="#ddd" stroke-width="1.5" fill="none"/><text x="150" y="40" font-size="20">😵</text>`,
        clean: sea('#BFE7F5', '#7CC6E6') + waves + angler(60, 24, .8) + `<text x="110" y="62" font-size="22">🗑️♻️</text>`,
        night: sea('#1B2440', '#2B3A66') + `<circle cx="160" cy="28" r="12" fill="#FFF3B0"/><text x="30" y="40" font-size="12" fill="#fff">✦  ✦   ✦</text>` + angler(60, 50, .7) + `<text x="100" y="60" font-size="18">💤</text>`,
        sun: sea('#FFB27A', '#7CC6E6') + `<circle cx="100" cy="70" r="26" fill="#FFE08A"/>` + waves + boat.replace(/M60 66/, 'M20 66').replace('x="96"', 'x="56"').replace('x="101"', 'x="61"'),
      };
      return `<svg viewBox="0 0 200 130" role="img" aria-hidden="true" style="width:100%;display:block">${P[key] || P.mermaid}</svg>`;
    }
    function comicView(el) {
      const C = D.COMIC, i = ((st.comic % C.length) + C.length) % C.length, c = C[i];
      el.innerHTML = `<div class="box"><div class="bar"><b style="font-size:16px">🧜 바다지기 물결이 #${i + 1} 「${esc(c[0])}」</b></div>
          <div class="comic">${c[1].map(([k, t], j) => `<figure>${panel(k)}<figcaption><b>${j + 1}</b> ${esc(t)}</figcaption></figure>`).join('')}</div>
          <div class="notice small">💡 ${esc(c[2])}</div>
          <div class="bar"><button class="btn" id="sea-prev">◀ 이전 화</button><span class="small muted">${i + 1} / ${C.length}</span><button class="btn" id="sea-next">다음 화 ▶</button><button class="btn" id="sea-share">📋 이 화 글로 복사</button></div>
          <div class="small dim">그림은 이 앱에서 직접 그린 캐릭터입니다(다른 작품 캐릭터 아님). 새 화는 매일 업데이트에서 추가돼요.</div></div>`;
      el.querySelector('#sea-prev').onclick = () => { st.comic = i - 1; render(); };
      el.querySelector('#sea-next').onclick = () => { st.comic = i + 1; render(); };
      el.querySelector('#sea-share').onclick = async () => { const txt = `🧜 바다지기 물결이 「${c[0]}」\n` + c[1].map((p, j) => `${j + 1}. ${p[1]}`).join('\n') + `\n💡 ${c[2]}\n— 출조 관제 우주 프로 https://kimcheol-ops.github.io/sunsang-mobile/`;
        try { await navigator.clipboard.writeText(txt); el.querySelector('#sea-share').textContent = '✔ 복사했어요'; } catch (e) { prompt('아래 글을 복사하세요', txt); } };
    }

    if (opts.inPC) root.addEventListener('click', e => { const a = e.target.closest('a[href^="https://"]'); if (a) { e.preventDefault(); try { window.chrome.webview.postMessage({ type: 'open', url: a.href }); } catch (x) {} } });
    render();
    return { open: (tab, patch) => go(tab, patch), refresh: render };
  }
  window.SeaApp = { mount };
})();
