/* ArtPlus — 🎨 바다 그리기 새 놀이 3종 (허락 3번 · 2026-11-23 사용자 요청 「그림 그리기 다양한 콘텐츠 더」)
 *  ArtPlus.view(el, mode, ctx)  mode: 'mandala' | 'pixel' | 'mission'   ctx = { setStop(fn), keep(canvas, title, kind), download(blob, name) }
 *  · 🌀 대칭 무늬 — 한 번 그으면 4·6·8·12방향으로 똑같이 그려지는 바다 만다라(거울 켜기·무지개 붓)
 *  · 👾 도트 그림 — 16×16 칸 채우기. 밑그림(물고기·오징어·배·등대·게·하트)을 번호 색칠로 따라 하거나 자유롭게
 *  · 🎯 오늘의 그림 미션 — 날짜마다 바뀌는 주제 + 3분 그리기(시간 끝나도 계속 그릴 수 있음)
 *  · 모두 이 코드가 직접 그림(인공지능·유료 서비스 없음). 완성작은 내 그림 전시관(이 기기)에 걸거나 내려받기.
 */
(function () {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const PAL = ['#0B2A3A', '#1F6C8A', '#4FC3D9', '#BFE8FF', '#FFFFFF', '#F5C46B', '#F08A5D', '#E2572B', '#FF8A8D', '#C24A5A', '#6FD3A4', '#2E7D5B', '#B38CF2', '#7A5230', '#E8D3A0', '#222222'];
  const CSS = `.ap { display: grid; gap: 8px; }
  .ap .row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .ap .sw { width: 30px; height: 30px; border-radius: 50%; border: 2px solid rgba(255,255,255,.25); cursor: pointer; padding: 0; }
  .ap .sw[aria-pressed="true"] { outline: 3px solid #FFE27A; outline-offset: 1px; }
  .ap .b { min-height: 38px; padding: 0 12px; border-radius: 10px; border: 1px solid #3A4A56; background: #1E2C36; color: inherit; font: inherit; font-size: 13.5px; cursor: pointer; }
  .ap .b[aria-pressed="true"] { background: #3FB4E0; color: #08131C; font-weight: 700; border-color: transparent; }
  .ap .b.pri { background: #E2572B; color: #fff; border-color: transparent; font-weight: 700; }
  .ap .stage { width: 100%; max-width: 520px; margin: 0 auto; aspect-ratio: 1; border-radius: 12px; overflow: hidden; background: #0B2A3A; touch-action: none; }
  .ap canvas { width: 100%; height: 100%; display: block; touch-action: none; }
  .ap .tip { font-size: 13px; opacity: .85; line-height: 1.5; }
  .ap .mis { padding: 10px 12px; border-radius: 12px; background: #1F3A50; line-height: 1.55; }
  .ap .mis b { font-size: 17px; }
  .ap [hidden] { display: none !important; }`;
  function css() { if (document.getElementById('artplus-css')) return; const s = document.createElement('style'); s.id = 'artplus-css'; s.textContent = CSS; document.head.appendChild(s); }
  const swatches = (cur) => PAL.map(c => `<button type="button" class="sw" data-c="${c}" style="background:${c}" aria-label="색 ${c}" aria-pressed="${c === cur}"></button>`).join('');
  function pos(cv, e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; }
  async function keepCanvas(ctx, cv, title, kind, say) { if (ctx.keep) { await ctx.keep(cv, title, kind); say('🖼 전시관에 걸었어요.'); } }
  function saveFile(ctx, cv, name) { cv.toBlob(b => { if (!b) return; if (ctx.download) ctx.download(b, name); else { const u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(u), 4000); } }, 'image/png'); }

  // 100가지 바다 친구 고르기(분류별 묶음)
  function friendSelect(ctx, attr, first) {
    const cats = window.ArtLib ? ArtLib.CATS : { sea: '바다' }, t = ctx.todayCR ? ctx.todayCR() : null;
    return `<select ${attr} aria-label="바다 친구 고르기" style="min-height:36px;border-radius:10px;max-width:190px">${first || ''}${t ? `<option value="${t.id}">⭐ 오늘의 친구: ${esc(t.name)}</option>` : ''}${Object.entries(cats).filter(([k]) => !['all', 'today'].includes(k)).map(([k, l]) => `<optgroup label="${esc(l)}">${ctx.CR.filter(c => c.cat === k).map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</optgroup>`).join('')}</select>`;
  }
  // 밑그림 SVG → N×N 도트(칸마다 가장 많은 색, 드문 색은 가까운 색으로 합침)
  async function rasterize(ctx, c, N) {
    const im = new Image(); await new Promise((res, rej) => { im.onload = res; im.onerror = rej; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ctx.svgOf(c, null, { sw: 0.01 })); });
    const K = 8, R = 400, cv = document.createElement('canvas'); cv.width = cv.height = R; const g = cv.getContext('2d'); g.drawImage(im, 0, 0, R, R); const d = g.getImageData(0, 0, R, R).data;
    let x0 = R, y0 = R, x1 = 0, y1 = 0; for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) if (d[(y * R + x) * 4 + 3] > 200) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const side = Math.max(x1 - x0, y1 - y0) * 1.06 + 2, bx = (x0 + x1) / 2 - side / 2, by = (y0 + y1) / 2 - side / 2;   // 그림이 칸을 꽉 채우도록
    const hex = p => '#' + [d[p], d[p + 1], d[p + 2]].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase(), out = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const cnt = {}; let empty = 0;
      for (let j = 1; j < K; j += 2) for (let i = 1; i < K; i += 2) { const sx = Math.floor(bx + (x * K + i) / (N * K) * side), sy = Math.floor(by + (y * K + j) / (N * K) * side);
        if (sx < 0 || sy < 0 || sx >= R || sy >= R) { empty++; continue; } const p = (sy * R + sx) * 4; if (d[p + 3] < 200) { empty++; continue; } const h = hex(p); cnt[h] = (cnt[h] || 0) + 1; }
      const best = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]; out.push(best && empty < 9 ? best[0] : null); }
    const freq = {}; out.forEach(h => h && (freq[h] = (freq[h] || 0) + 1));
    const keep = Object.entries(freq).sort((a, b) => b[1] - a[1]).filter((e, i) => i < 9 && e[1] >= 2).map(e => e[0]);
    const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), near = h => { const a = rgb(h); let bd = 1e9, bh = keep[0]; keep.forEach(k => { const b = rgb(k), dd = (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2; if (dd < bd) { bd = dd; bh = k; } }); return bh; };
    return out.map(h => h && (keep.includes(h) ? h : near(h)));
  }

  /* 🌀 대칭 무늬 */
  function mandala(el, ctx) {
    const S = 900; let n = 8, mirror = true, color = '#4FC3D9', size = 6, rainbow = false, hue = 190;
    el.innerHTML = `<div class="ap"><div class="tip">🌀 <b>대칭 무늬</b> — 한 번 그으면 여러 방향으로 똑같이 그려져 바다 만다라가 돼요. 가운데에서 바깥으로 그어 보세요!</div>
      <div class="row">${[4, 6, 8, 12].map(k => `<button type="button" class="b" data-n="${k}" aria-pressed="${k === n}">${k}방향</button>`).join('')}<button type="button" class="b" data-mir aria-pressed="true">🪞 거울</button><button type="button" class="b" data-rb aria-pressed="false">🌈 무지개 붓</button></div>
      <div class="row">${swatches(color)}</div>
      <div class="row"><label class="tip">굵기 <input type="range" data-size min="2" max="30" value="${size}"></label><button type="button" class="b" data-undo>↶ 되돌리기</button><button type="button" class="b" data-clear>🧽 새로</button></div>
      ${ctx.CR ? `<div class="row"><button type="button" class="b" data-stamp aria-pressed="false">🐟 바다 친구 도장</button>${friendSelect(ctx, 'data-sf')}<span class="tip">도장을 켜고 누르면 고른 친구가 둥글게 찍혀요.</span></div>` : ''}
      <div class="stage"><canvas width="${S}" height="${S}"></canvas></div>
      <div class="row"><button type="button" class="b pri" data-keep>🖼 전시관에 걸기</button><button type="button" class="b" data-save>⬇ 그림 파일</button><span class="tip" data-say></span></div></div>`;
    const cv = el.querySelector('canvas'), g = cv.getContext('2d'), say = t => el.querySelector('[data-say]').textContent = t, hist = [];
    function bg() { const gr = g.createRadialGradient(S / 2, S / 2, 20, S / 2, S / 2, S * .7); gr.addColorStop(0, '#13506A'); gr.addColorStop(1, '#06202E'); g.fillStyle = gr; g.fillRect(0, 0, S, S);
      g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 1; for (let i = 0; i < n; i++) { const a = i * Math.PI * 2 / n; g.beginPath(); g.moveTo(S / 2, S / 2); g.lineTo(S / 2 + Math.cos(a) * S, S / 2 + Math.sin(a) * S); g.stroke(); } }
    bg();
    function seg(a, b) {
      const c = rainbow ? `hsl(${hue = (hue + 3) % 360},85%,62%)` : color;
      g.strokeStyle = c; g.lineWidth = size; g.lineCap = 'round'; g.lineJoin = 'round';
      for (let i = 0; i < n; i++) { const ang = i * Math.PI * 2 / n;
        for (const m of mirror ? [1, -1] : [1]) { g.save(); g.translate(S / 2, S / 2); g.rotate(ang); g.scale(1, m); g.beginPath(); g.moveTo(a.x - S / 2, a.y - S / 2); g.lineTo(b.x - S / 2, b.y - S / 2); g.stroke(); g.restore(); } }
    }
    let last = null, stampOn = false, sImg = null;
    const sf = el.querySelector('[data-sf]');
    const loadStamp = () => { const c = ctx.CR && ctx.CR.find(x => x.id === sf.value); if (!c) return; const im = new Image(); im.onload = () => sImg = im; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ctx.svgOf(c, null, { sw: 3 })); };
    if (sf) { sf.onchange = loadStamp; loadStamp(); }
    function stampAt(p) { const dx = p.x - S / 2, dy = p.y - S / 2, s = size * 9 + 30;
      for (let i = 0; i < n; i++) { const ang = i * Math.PI * 2 / n; for (const m of mirror ? [1, -1] : [1]) { g.save(); g.translate(S / 2, S / 2); g.rotate(ang); g.scale(1, m); g.translate(dx, dy); g.rotate(Math.atan2(dy, dx) + Math.PI / 2); g.drawImage(sImg, -s / 2, -s / 2, s, s); g.restore(); } } }
    cv.addEventListener('pointerdown', e => { hist.push(g.getImageData(0, 0, S, S)); if (hist.length > 15) hist.shift();
      if (stampOn && sImg) { stampAt(pos(cv, e)); return; }
      last = pos(cv, e); seg(last, { x: last.x + .1, y: last.y }); try { cv.setPointerCapture(e.pointerId); } catch (x) {} });
    cv.addEventListener('pointermove', e => { if (!last) return; const p = pos(cv, e); seg(last, p); last = p; });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => cv.addEventListener(t, () => last = null));
    el.onclick = e => { const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.n) { n = +b.dataset.n; el.querySelectorAll('[data-n]').forEach(x => x.setAttribute('aria-pressed', +x.dataset.n === n)); say(`${n}방향으로 그려요.`); }
      else if (b.hasAttribute('data-mir')) { mirror = !mirror; b.setAttribute('aria-pressed', mirror); }
      else if (b.hasAttribute('data-rb')) { rainbow = !rainbow; b.setAttribute('aria-pressed', rainbow); }
      else if (b.hasAttribute('data-stamp')) { stampOn = !stampOn; b.setAttribute('aria-pressed', stampOn); say(stampOn ? '🐟 도장 켬 — 누르는 곳마다 찍혀요. 굵기로 크기를 바꿔요.' : '붓으로 돌아왔어요.'); }
      else if (b.dataset.c) { color = b.dataset.c; rainbow = false; el.querySelector('[data-rb]').setAttribute('aria-pressed', false); el.querySelectorAll('.sw').forEach(x => x.setAttribute('aria-pressed', x === b)); }
      else if (b.hasAttribute('data-undo')) { const h = hist.pop(); if (h) g.putImageData(h, 0, 0); }
      else if (b.hasAttribute('data-clear')) { hist.push(g.getImageData(0, 0, S, S)); bg(); }
      else if (b.hasAttribute('data-keep')) keepCanvas(ctx, cv, '대칭 바다 무늬', 'mandala', say);
      else if (b.hasAttribute('data-save')) saveFile(ctx, cv, `sea-mandala-${Date.now()}.png`);
    };
    el.querySelector('[data-size]').oninput = e => size = +e.target.value;
  }

  /* 👾 도트 그림 — 밑그림: 글자 한 칸 = 색 번호(0 = 빈칸) */
  const PIX = {
    fish: ['물고기', ['0000000000000000', '0000000000000000', '0000003333000000', '0000033333300000', '0300333333330000', '0330333333333000', '0333333333354300', '0333333333333330', '0333333333333330', '0330333333333300', '0300333333330000', '0000033333300000', '0000003333000000', '0000000000000000', '0000000000000000', '0000000000000000'], { 3: '#4FC3D9', 4: '#222222', 5: '#BFE8FF' }],
    squid: ['오징어', ['0000000880000000', '0000008888000000', '0000088888800000', '0000888888880000', '0008888888888000', '0008888888888000', '0008848888488000', '0008888888888000', '0000888888880000', '0000888888880000', '0008080880808000', '0080080880800800', '0080008008000800', '0800080000800080', '0000800000080000', '0000000000000000'], { 8: '#F08A5D', 4: '#222222' }],
    boat: ['낚싯배', ['0000000700000000', '0000000770000000', '0000000777000000', '0000000777700000', '0000000777770000', '0000000700000000', '0000000700000000', 'EEEEEEEEEEEEEEE0', '0EEEEEEEEEEEEE00', '00EEECEECEECEE00', '000EEEEEEEEEE000', '2222222222222222', '2322223222232222', '2222222222222222', '3222322223222232', '2222222222222222'], { 7: '#FFFFFF', E: '#E2572B', C: '#BFE8FF', 2: '#1F6C8A', 3: '#4FC3D9' }],
    light: ['등대', ['0000000660000000', '0000006666000000', '000000BBBB000000', '0000006666000000', '000000FFFF000000', '00000FFFFFF00000', '00000EEEEEE00000', '00000FFFFFF00000', '0000FFFFFFFF0000', '0000EEEEEEEE0000', '0000FFFFFFFF0000', '000FFFFFFFFFF000', '000EEEEEEEEEE000', '00DDDDDDDDDDDD00', '2222222222222222', '2222222222222222'], { 6: '#7A5230', B: '#F5C46B', F: '#FFFFFF', E: '#E2572B', D: '#7A7068', 2: '#1F6C8A' }],
    crab: ['꽃게', ['0000000000000000', '0880000000000880', '8888000000008888', '8808000000008088', '0880000000000880', '0008000440008000', '0000888888880000', '0008888888888000', '0088888888888800', '8088888888888808', '0808888888888080', '8008888888888008', '0080088888800800', '0800800000080080', '0000000000000000', '0000000000000000'], { 8: '#C24A5A', 4: '#222222' }],
    heart: ['하트', ['0000000000000000', '0000000000000000', '0099900009990000', '0999990099999000', '9999999999999900', '9999999999999900', '9999999999999900', '0999999999999000', '0099999999990000', '0009999999900000', '0000999999000000', '0000099990000000', '0000009900000000', '0000000000000000', '0000000000000000', '0000000000000000'], { 9: '#FF8A8D' }],
  };
  function pixel(el, ctx) {
    let N = 16, grid = Array(N * N).fill(null), color = '#4FC3D9', guide = null, nums = true, tool = 'pen', curLib = null;
    el.innerHTML = `<div class="ap"><div class="tip">👾 <b>도트 그림</b> — 칸을 눌러(끌어서) 색을 채워요. 밑그림을 고르면 칸에 <b>번호</b>가 나와 번호 색칠처럼 따라 할 수 있어요. 바다 친구 ${ctx.CR ? ctx.CR.length + '가지' : ''}는 20×20 칸으로 바뀌어요.</div>
      <div class="row"><button type="button" class="b" data-g="" aria-pressed="true">✏ 자유</button>${Object.entries(PIX).map(([k, v]) => `<button type="button" class="b" data-g="${k}" aria-pressed="false">${v[0]}</button>`).join('')}</div>
      ${ctx.CR ? `<div class="row">🐟 ${friendSelect(ctx, 'data-lib', '<option value="">바다 친구 밑그림 고르기</option>')}</div>` : ''}
      <div class="row" data-pal>${swatches(color)}</div>
      <div class="row"><button type="button" class="b" data-t="pen" aria-pressed="true">🖊 칠하기</button><button type="button" class="b" data-t="erase" aria-pressed="false">🧽 지우기</button><button type="button" class="b" data-t="fill" aria-pressed="false">🪣 같은 색 채우기</button><button type="button" class="b" data-num aria-pressed="true">🔢 번호</button><button type="button" class="b" data-clear>새로</button></div>
      <div class="stage" style="background:#0E1E28"><canvas width="640" height="640"></canvas></div>
      <div class="row"><button type="button" class="b pri" data-keep>🖼 전시관에 걸기</button><button type="button" class="b" data-save>⬇ 그림 파일</button><span class="tip" data-say></span></div></div>`;
    const cv = el.querySelector('canvas'), g = cv.getContext('2d'), say = t => el.querySelector('[data-say]').textContent = t;
    let C = 640 / N, gmap = {};   // 밑그림 색 → 번호
    function draw(forSave) {
      g.fillStyle = forSave ? '#0B2A3A' : '#0E1E28'; g.fillRect(0, 0, 640, 640);
      for (let i = 0; i < N * N; i++) { const x = (i % N) * C, y = Math.floor(i / N) * C;
        if (grid[i]) { g.fillStyle = grid[i]; g.fillRect(x, y, C + 0.5, C + 0.5); }
        else if (!forSave && guide && nums) { const want = guide[i]; if (want) { g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x, y, C, C); g.fillStyle = 'rgba(255,255,255,.75)'; g.font = `700 ${C * .45}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(gmap[want], x + C / 2, y + C / 2); } } }
      if (!forSave) { g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 1; for (let k = 0; k <= N; k++) { g.beginPath(); g.moveTo(k * C, 0); g.lineTo(k * C, 640); g.stroke(); g.beginPath(); g.moveTo(0, k * C); g.lineTo(640, k * C); g.stroke(); } }
    }
    function useGuide(arr, n, label) {
      N = n; C = 640 / N; grid = Array(N * N).fill(null); guide = arr; gmap = {};
      [...new Set(guide.filter(Boolean))].forEach((c, i) => gmap[c] = i + 1);
      el.querySelector('[data-pal]').innerHTML = Object.entries(gmap).map(([c, i]) => `<button type="button" class="sw" data-c="${c}" style="background:${c};color:${parseInt(c.slice(1, 3), 16) + parseInt(c.slice(3, 5), 16) + parseInt(c.slice(5, 7), 16) > 380 ? '#000' : '#fff'};font:800 12px sans-serif" aria-pressed="${i === 1}">${i}</button>`).join('') + swatches('');
      color = Object.keys(gmap)[0]; say(`「${label}」 — 번호와 같은 색으로 칸을 채워요.`); draw();
    }
    function setGuide(k) {
      curLib = null; const sel = el.querySelector('[data-lib]'); if (sel) sel.value = '';
      if (k) { const [, rows, cols] = PIX[k], arr = []; rows.forEach(r => [...r].forEach(ch => arr.push(ch === '0' ? null : cols[ch]))); useGuide(arr, 16, PIX[k][0]); return; }
      N = 16; C = 640 / N; grid = Array(N * N).fill(null); guide = null; gmap = {};
      el.querySelector('[data-pal]').innerHTML = swatches(color); say(''); draw();
    }
    const lib = el.querySelector('[data-lib]');
    if (lib) lib.onchange = async () => { const c = ctx.CR.find(x => x.id === lib.value); if (!c) return; el.querySelectorAll('[data-g]').forEach(x => x.setAttribute('aria-pressed', false)); say('밑그림을 칸으로 바꾸는 중…');
      try { const arr = await rasterize(ctx, c, 20); curLib = c; useGuide(arr, 20, c.name); } catch (e) { say('밑그림을 만들지 못했어요.'); } };
    function paintAt(e) { const p = pos(cv, e), i = Math.floor(p.y / C) * N + Math.floor(p.x / C); if (i < 0 || i >= N * N) return;
      if (tool === 'fill') { const from = grid[i], to = color; if (from === to) return; const st = [i], seen = new Set(); while (st.length) { const j = st.pop(); if (seen.has(j) || grid[j] !== from) continue; seen.add(j); grid[j] = to; const x = j % N; if (x > 0) st.push(j - 1); if (x < N - 1) st.push(j + 1); if (j >= N) st.push(j - N); if (j < N * (N - 1)) st.push(j + N); } }
      else grid[i] = tool === 'erase' ? null : color;
      draw(); if (guide) { const done = guide.every((c, j) => !c || grid[j] === c); if (done) { say('🎉 완성! 전시관에 걸어 보세요.'); if (curLib && ctx.markDone) ctx.markDone(curLib.id, 'p'); } } }
    let down = false;
    cv.addEventListener('pointerdown', e => { down = true; paintAt(e); try { cv.setPointerCapture(e.pointerId); } catch (x) {} });
    cv.addEventListener('pointermove', e => { if (down && tool !== 'fill') paintAt(e); });
    ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => down = false));
    el.onclick = e => { const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.g != null) { el.querySelectorAll('[data-g]').forEach(x => x.setAttribute('aria-pressed', x === b)); setGuide(b.dataset.g); }
      else if (b.dataset.c) { color = b.dataset.c; el.querySelectorAll('.sw').forEach(x => x.setAttribute('aria-pressed', x === b)); if (tool === 'erase') { tool = 'pen'; el.querySelectorAll('[data-t]').forEach(x => x.setAttribute('aria-pressed', x.dataset.t === 'pen')); } }
      else if (b.dataset.t) { tool = b.dataset.t; el.querySelectorAll('[data-t]').forEach(x => x.setAttribute('aria-pressed', x === b)); }
      else if (b.hasAttribute('data-num')) { nums = !nums; b.setAttribute('aria-pressed', nums); draw(); }
      else if (b.hasAttribute('data-clear')) { grid = Array(N * N).fill(null); draw(); }
      else if (b.hasAttribute('data-keep') || b.hasAttribute('data-save')) { draw(true); const out = document.createElement('canvas'); out.width = out.height = 640; out.getContext('2d').drawImage(cv, 0, 0); draw();
        if (b.hasAttribute('data-keep')) keepCanvas(ctx, out, curLib ? `도트 ${curLib.name}` : '도트 그림', 'pixel', say); else saveFile(ctx, out, `sea-pixel-${Date.now()}.png`); }
    };
    draw();
    cv._s = () => ({ filled: grid.filter(Boolean).length, guide: !!guide, N, need: guide ? guide.filter(Boolean).length : 0, want: guide });   // 시험용
  }

  /* 🎯 오늘의 그림 미션 */
  const MISSIONS = [['노을 지는 항구', '하늘은 주황·분홍, 바다는 보라색으로 칠해 봐요.'], ['내가 잡고 싶은 꿈의 물고기', '세상에 없는 무늬를 넣어도 좋아요!'], ['새벽 4시 출항하는 배', '배의 불빛과 별을 그려 봐요.'], ['바닷속 물결이의 집', '조개·산호·해초로 꾸며요.'],
    ['구명조끼를 입은 나', '안전한 낚시꾼의 모습을 멋지게!'], ['갈매기가 본 바다', '하늘 위에서 내려다본 섬과 배.'], ['비 오는 날의 방파제', '빗방울과 우비를 그려 봐요.'], ['가장 큰 오징어', '다리 10개를 잊지 마세요!'],
    ['깨끗한 바다 만들기', '쓰레기를 줍는 사람들과 웃는 물고기.'], ['등대의 밤', '빛줄기가 바다를 비춰요.'], ['우리 가족 낚시 여행', '누가 무엇을 잡았는지 그려요.'], ['겨울 바다', '눈 내리는 항구와 따뜻한 어묵 국물.'],
    ['물고기 기차', '작은 물고기부터 큰 물고기까지 줄지어!'], ['바다 위 우주선', '별빛 낚시단처럼 우주에서 낚시를!'], ['해파리 불꽃놀이', '반짝이는 해파리로 밤하늘을 채워요.']];
  function mission(el, ctx) {
    const d = new Date(), key = d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate(), [title, hint] = MISSIONS[key % MISSIONS.length];
    const fr = ctx.todayCR ? ctx.todayCR() : null, today = ctx.dayKey ? ctx.dayKey() : '';
    const stepsDone = () => { try { const m = JSON.parse(localStorage.getItem('art.mind') || '{}'); return (m.days || {})[today] || {}; } catch (e) { return {}; } };
    let color = '#222222', size = 8, left = 180, timer = 0, started = false, breathT = 0, memT = 0, memOn = false;
    const sd = stepsDone(), ck = k => sd[k] ? '✅' : '⬜';
    el.innerHTML = `<div class="ap">
      ${fr ? `<div class="mis" style="display:grid;grid-template-columns:72px 1fr;gap:10px;align-items:center"><div style="background:#F6F0E2;border-radius:12px">${ctx.svgOf(fr, null, { sw: 2.6 })}</div>
        <div>🌿 <b>오늘의 마음 쉼 10분</b> <span class="tip">(${d.getMonth() + 1}월 ${d.getDate()}일 · 오늘의 바다 친구 「${esc(fr.name)}」)</span>
        <div class="tip">천천히 숨 쉬고 → 따라 그리며 집중하고 → 기억해서 그려 보며 뇌를 깨워요. 순서대로 해도, 하나만 해도 좋아요.${ctx.streak && ctx.streak() ? ` · 🔥 ${ctx.streak()}일째` : ''}</div></div></div>
      <div class="row"><button type="button" class="b" data-breath>${ck('breath')} ① 🫧 1분 숨 고르기</button><button type="button" class="b" data-trace>${ck('trace')} ② ✏ 「${esc(fr.name)}」 따라 그리기</button><button type="button" class="b" data-color>🖍 색칠하기</button><button type="button" class="b" data-mem>${ck('memory')} ③ 🧠 기억 그리기</button></div>
      <div data-breathbox hidden style="display:grid;place-items:center;gap:6px;padding:14px;border-radius:14px;background:linear-gradient(#0E2A3C,#14485A)"><div data-ball style="width:70px;height:70px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#BFF3FF,#3FB4E0 60%,#1F6C8A);box-shadow:0 0 30px #3FB4E0;transition:transform 4s ease-in-out"></div><b data-btxt style="font-size:18px">준비</b><span class="tip" data-bleft></span><button type="button" class="b" data-bstop>그만하기</button></div>` : ''}
      <div class="mis">🎯 오늘의 그림 주제<br><b>「${esc(title)}」</b><br><span class="tip">${esc(hint)}</span></div>
      <div class="row"><button type="button" class="b pri" data-go>⏱ 3분 그리기 시작</button><span class="tip" data-time>시간 제한 없이 그려도 돼요.</span></div>
      <div class="row">${swatches(color)}</div>
      <div class="row"><label class="tip">굵기 <input type="range" data-size min="2" max="40" value="${size}"></label><button type="button" class="b" data-erase aria-pressed="false">🧽 지우개</button><button type="button" class="b" data-clear>새로</button><button type="button" class="b" data-peek hidden>👀 정답 겹쳐 보기</button></div>
      <div class="stage" style="background:#FBF6EA;position:relative"><canvas width="900" height="900"></canvas><div data-ov style="position:absolute;inset:0;pointer-events:none;display:none"></div><div data-memtxt style="position:absolute;left:0;right:0;top:8px;text-align:center;font-weight:800;color:#1F4E79;pointer-events:none"></div></div>
      <div class="row"><button type="button" class="b pri" data-keep>🖼 전시관에 걸기</button><button type="button" class="b" data-save>⬇ 그림 파일</button><span class="tip" data-say></span></div></div>`;
    const cv = el.querySelector('canvas'), g = cv.getContext('2d'), say = t => el.querySelector('[data-say]').textContent = t; let erase = false;
    const ov = el.querySelector('[data-ov]'), memTxt = el.querySelector('[data-memtxt]');
    const clear = () => { g.fillStyle = '#FBF6EA'; g.fillRect(0, 0, 900, 900); }; clear();
    let last = null;
    function line(a, b) { g.strokeStyle = erase ? '#FBF6EA' : color; g.lineWidth = erase ? size * 2 : size; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
    cv.addEventListener('pointerdown', e => { if (memOn && memT) return; last = pos(cv, e); line(last, { x: last.x + .1, y: last.y }); try { cv.setPointerCapture(e.pointerId); } catch (x) {} });
    cv.addEventListener('pointermove', e => { if (!last) return; const p = pos(cv, e); line(last, p); last = p; });
    ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => last = null));
    const tEl = el.querySelector('[data-time]');
    function tick() { if (!cv.isConnected) { clearInterval(timer); return; } left--; tEl.textContent = left > 0 ? `남은 시간 ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : '⏰ 시간 끝! 마무리하고 전시관에 걸어요(계속 그려도 돼요).'; if (left <= 0) clearInterval(timer); }
    // ① 숨 고르기: 4초 들이쉬기 · 2초 멈춤 · 6초 내쉬기 × 5번 = 1분
    function breath() { const box = el.querySelector('[data-breathbox]'), ball = el.querySelector('[data-ball]'), tx = el.querySelector('[data-btxt]'), lf = el.querySelector('[data-bleft]'); box.hidden = false; let t = 0;
      const PH = [['들이쉬기', 4, 1.9], ['잠깐 멈춤', 2, 1.9], ['내쉬기', 6, 1]];
      clearInterval(breathT);
      const step = () => { if (!cv.isConnected) { clearInterval(breathT); return; } const c = t % 12, ph = c < 4 ? PH[0] : c < 6 ? PH[1] : PH[2];
        if (c === 0 || c === 4 || c === 6) { ball.style.transitionDuration = ph[1] + 's'; ball.style.transform = `scale(${ph[2]})`; }
        tx.textContent = ph[0]; lf.textContent = `${Math.max(0, 60 - t)}초`; t++;
        if (t > 60) { clearInterval(breathT); tx.textContent = '잘했어요 🌿 마음이 한결 고요해졌어요'; lf.textContent = ''; ctx.markDay && ctx.markDay('breath'); el.querySelector('[data-breath]').textContent = '✅ ① 🫧 1분 숨 고르기'; } };
      step(); breathT = setInterval(step, 1000); }
    // ③ 기억 그리기: 10초 보고 → 가린 뒤 기억해서 그리기 → 정답 겹쳐 보기
    function memory() { if (!fr) return; clear(); memOn = true; ov.innerHTML = ctx.svgOf(fr, null, { sw: 2.4 }); ov.style.display = ''; ov.style.opacity = 1; let s = 10; clearInterval(memT);
      el.querySelector('[data-peek]').hidden = true; memTxt.textContent = `🧠 ${s}초 동안 잘 보고 기억해요`;
      memT = setInterval(() => { s--; if (!cv.isConnected) { clearInterval(memT); return; } if (s > 0) { memTxt.textContent = `🧠 ${s}초 동안 잘 보고 기억해요`; return; }
        clearInterval(memT); memT = 0; ov.style.display = 'none'; memTxt.textContent = '이제 기억나는 대로 그려 보세요 ✏'; el.querySelector('[data-peek]').hidden = false; }, 1000); }
    el.onclick = e => { const b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-go')) { if (started) return; started = true; left = 180; b.disabled = true; timer = setInterval(tick, 1000); tick(); }
      else if (b.hasAttribute('data-breath')) breath();
      else if (b.hasAttribute('data-bstop')) { clearInterval(breathT); el.querySelector('[data-breathbox]').hidden = true; }
      else if (b.hasAttribute('data-trace')) { ctx.markDay && ctx.markDay('trace'); ctx.go && ctx.go('trace', fr.id); }
      else if (b.hasAttribute('data-color')) ctx.go && ctx.go('color', fr.id);
      else if (b.hasAttribute('data-mem')) memory();
      else if (b.hasAttribute('data-peek')) { const on = ov.style.display === 'none'; ov.style.display = on ? '' : 'none'; ov.style.opacity = 0.45; memTxt.textContent = on ? '겹쳐 보니 어때요? 비슷하면 기억 힘 최고! 👏' : ''; if (on) { ctx.markDay && ctx.markDay('memory'); el.querySelector('[data-mem]').textContent = '✅ ③ 🧠 기억 그리기'; } }
      else if (b.dataset.c) { color = b.dataset.c; erase = false; el.querySelector('[data-erase]').setAttribute('aria-pressed', false); el.querySelectorAll('.sw').forEach(x => x.setAttribute('aria-pressed', x === b)); }
      else if (b.hasAttribute('data-erase')) { erase = !erase; b.setAttribute('aria-pressed', erase); }
      else if (b.hasAttribute('data-clear')) clear();
      else if (b.hasAttribute('data-keep')) keepCanvas(ctx, cv, memOn && fr ? `기억 그리기: ${fr.name}` : `미션: ${title}`, 'mission', say);
      else if (b.hasAttribute('data-save')) saveFile(ctx, cv, `sea-mission-${Date.now()}.png`);
    };
    el.querySelector('[data-size]').oninput = e => size = +e.target.value;
    if (ctx.setStop) ctx.setStop(() => { clearInterval(timer); clearInterval(breathT); clearInterval(memT); });
  }

  window.ArtPlus = { MODES: [['mandala', '🌀 대칭 무늬'], ['pixel', '👾 도트 그림'], ['mission', '🎯 오늘의 미션']], view(el, mode, ctx) { css(); ({ mandala, pixel, mission })[mode](el, ctx || {}); } };
})();
