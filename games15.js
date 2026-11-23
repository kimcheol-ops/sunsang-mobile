/* 🔥 인기 장르 게임 2종 — 허락 3번(게임 매일) 2026-11-23 사용자 요청 「핫한 게임 더 추가」
 * (PC · 휴대폰 앱 · 조황 수첩 공용, games3.js(GameHub) 뒤에 로드)
 * HotGames.extra(onReward) → 게임 메뉴 항목. 끝나면 onReward({ game, score, coins })
 * ① 🐟 물고기 합치기 — 떨어뜨린 같은 물고기 둘이 닿으면 더 큰 물고기로(멸치 → … → 고래상어). 상자 위 선을 넘으면 끝
 * ② 🧱 바다 블록 퍼즐 — 8×8 판에 조각 3개를 놓아 가로·세로 한 줄을 채우면 사라짐. 놓을 곳이 없으면 끝
 * 기록은 이 기기 localStorage에만. 결제·광고 없음, 실제 업체·제품 이름 없음. 그림은 모두 코드로 그림.
 */
(function () {
  'use strict';
  const sfx = k => window.GameHub && GameHub.sfx && GameHub.sfx(k);
  const buzz = k => { try { window.PhoneKit && PhoneKit.buzz && PhoneKit.buzz(k); } catch (e) {} };
  const BTN = 'min-height:46px;border:0;border-radius:12px;font:700 15px inherit;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none';
  const PRIMARY = BTN + ';background:#E2572B;color:#fff', SOFT = BTN + ';background:#2A4650;color:#E3EEF0';
  const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const CARD = 'padding:10px 12px;border-radius:12px;background:var(--sea-soft,#1F3A50);line-height:1.55';
  const FONT = "'Noto Sans KR','Malgun Gothic','Apple SD Gothic Neo',sans-serif";

  function finish(box, html, again, onReward, rec) {
    box.style.display = 'block';
    box.innerHTML = html + `<div style="display:grid;margin-top:8px"><button type="button" data-again style="${PRIMARY}">↻ 다시 하기</button></div>`;
    box.querySelector('[data-again]').onclick = again;
    sfx('win'); if (onReward && rec) try { onReward(rec); } catch (e) {}
  }
  function fitCanvas(cv, W, H) {   // 화면 폭에 맞추고 선명하게(기기 픽셀 비율)
    const dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = W * dpr; cv.height = H * dpr;
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); return g;
  }
  function toLocal(cv, e, W, H) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }

  /* ── ① 🐟 물고기 합치기 ── */
  const FISH = [   // [이름, 반지름, 몸 색, 무늬 색, 점수]
    ['멸치', 13, '#BFD8E6', '#7FA6BE', 1], ['전갱이', 17, '#9EC3D6', '#5E8BA6', 3], ['고등어', 22, '#5FA3C7', '#1F4E79', 6], ['볼락', 27, '#C98A5A', '#7A4A2A', 10],
    ['우럭', 33, '#7A6E62', '#3E362E', 15], ['광어', 39, '#B79A6E', '#6A5232', 21], ['참돔', 46, '#F08A8A', '#C24A5A', 28], ['방어', 54, '#8FB8D8', '#E8C24A', 36],
    ['다랑어', 63, '#4E6E9E', '#22344E', 45], ['고래상어', 74, '#4A7FA0', '#E6F2F8', 60]];
  function drawFish(g, x, y, lv, rot, wob) {
    const [, r, body, mark] = FISH[lv];
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(2, r * .9, r * .8, r * .18, 0, 0, 7); g.fill();
    g.fillStyle = body; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
    g.fillStyle = mark;   // 꼬리
    g.beginPath(); g.moveTo(r * .78, 0); g.lineTo(r * 1.08, -r * .38 + (wob || 0)); g.lineTo(r * 1.08, r * .38 + (wob || 0)); g.closePath(); g.fill();
    if (lv === 9) { g.fillStyle = mark; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(-r * .5 + (i % 3) * r * .4, -r * .4 + Math.floor(i / 3) * r * .38, r * .07, 0, 7); g.fill(); } }
    else { g.strokeStyle = mark; g.lineWidth = Math.max(1.5, r * .08); g.beginPath(); g.arc(-r * .1, 0, r * .62, -1.1, 1.1); g.stroke(); }
    g.fillStyle = '#fff'; g.beginPath(); g.arc(-r * .48, -r * .18, r * .2, 0, 7); g.fill();
    g.fillStyle = '#123'; g.beginPath(); g.arc(-r * .52, -r * .18, r * .1, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, r - 1, 3.6, 4.6); g.stroke();
    g.restore();
  }
  function mergeGame(container, onReward) {
    const W = 360, H = 580, TOP = 122, best0 = LS.get('game.merge', 0);
    container.innerHTML = `<div style="display:grid;gap:8px;max-width:420px;margin:0 auto">
      <div style="${CARD};font-size:14px">🐟 <b>물고기 합치기</b> — 위에서 물고기를 떨어뜨려요. <b>같은 물고기 둘이 닿으면</b> 한 단계 큰 물고기가 돼요. 상자가 넘치면(빨간 선 위로 쌓이면) 끝!
        <div style="font-size:12.5px;opacity:.8;margin-top:4px">${FISH.map(f => f[0]).join(' → ')}</div></div>
      <canvas data-cv style="width:100%;aspect-ratio:${W}/${H};border-radius:14px;touch-action:none;display:block;background:#0B2A3A"></canvas>
      <div data-res style="display:none;${CARD}"></div></div>`;
    const cv = container.querySelector('[data-cv]'), res = container.querySelector('[data-res]'), g = fitCanvas(cv, W, H);
    let balls, cur, next, aimX, score, maxLv, over, overT, dropLock, raf = 0, last = 0, pops;
    const newLv = () => Math.floor(Math.random() * Math.min(5, Math.max(3, maxLv)));
    function start() { balls = []; pops = []; score = 0; maxLv = 0; over = false; overT = 0; dropLock = 0; cur = newLv(); next = newLv(); aimX = W / 2; res.style.display = 'none'; last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }
    function drop() {
      if (over || dropLock > 0) return; const r = FISH[cur][1];
      balls.push({ x: Math.max(14 + r, Math.min(W - 14 - r, aimX)), y: TOP - 40, vx: 0, vy: 0, lv: cur, rot: 0, age: 0 });
      cur = next; next = newLv(); dropLock = .45; sfx('tap'); buzz('tap');
    }
    function step(dt) {
      dropLock -= dt;
      for (const b of balls) { b.vy += 900 * dt; b.vx *= .995; b.x += b.vx * dt; b.y += b.vy * dt; b.age += dt; b.rot += b.vx * dt / FISH[b.lv][1] * .5; }
      for (let it = 0; it < 4; it++) {
        for (const b of balls) { const r = FISH[b.lv][1];   // 벽·바닥
          if (b.x < 14 + r) { b.x = 14 + r; b.vx = Math.abs(b.vx) * .3; } if (b.x > W - 14 - r) { b.x = W - 14 - r; b.vx = -Math.abs(b.vx) * .3; }
          if (b.y > H - 14 - r) { b.y = H - 14 - r; b.vy = -Math.abs(b.vy) * .15; b.vx *= .9; } }
        for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) {
          const a = balls[i], c = balls[j]; if (!a || !c || a.dead || c.dead) continue;
          const ra = FISH[a.lv][1], rc = FISH[c.lv][1], dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy) || .01, ov = ra + rc - d;
          if (ov <= 0) continue;
          if (a.lv === c.lv && a.lv < FISH.length - 1) {   // 합치기
            a.dead = c.dead = true; const lv = a.lv + 1; maxLv = Math.max(maxLv, lv); score += FISH[lv][4];
            balls.push({ x: (a.x + c.x) / 2, y: (a.y + c.y) / 2, vx: (a.vx + c.vx) / 2, vy: -60, lv, rot: 0, age: 1 });
            pops.push({ x: (a.x + c.x) / 2, y: (a.y + c.y) / 2, t: 0, txt: `+${FISH[lv][4]} ${FISH[lv][0]}` }); sfx('coin'); buzz(lv >= 6 ? 'win' : 'tap');
            continue;
          }
          const nx = dx / d, ny = dy / d, ma = ra * ra, mc = rc * rc, s = ma + mc;
          a.x -= nx * ov * mc / s; a.y -= ny * ov * mc / s; c.x += nx * ov * ma / s; c.y += ny * ov * ma / s;
          const rv = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny; if (rv < 0) { const imp = -1.2 * rv / s; a.vx -= imp * mc * nx; a.vy -= imp * mc * ny; c.vx += imp * ma * nx; c.vy += imp * ma * ny; }
        }
        balls = balls.filter(b => !b.dead);
      }
      const high = balls.some(b => b.age > 1.5 && b.y - FISH[b.lv][1] < TOP);   // 떨어진 지 1.5초 넘은 물고기가 선 위에 1.6초 머물면 끝
      overT = high ? overT + dt : 0;
      if (overT > 1.6 && !over) end();
      pops.forEach(p => p.t += dt); pops = pops.filter(p => p.t < 1);
    }
    function draw(t) {
      const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#0E3A52'); sky.addColorStop(1, '#06202E'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(14, TOP - 6, W - 28, H - TOP - 8);
      g.strokeStyle = 'rgba(180,230,255,.35)'; g.lineWidth = 3; g.strokeRect(12, TOP - 8, W - 24, H - TOP - 4);
      g.strokeStyle = overT > 0 ? '#FF5A5A' : 'rgba(255,120,120,.55)'; g.setLineDash([8, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(14, TOP); g.lineTo(W - 14, TOP); g.stroke(); g.setLineDash([]);
      for (let i = 0; i < 10; i++) { const bx = (i * 47 + t * .02 * (1 + i % 3)) % W, by = H - ((t * .05 * (1 + i % 4) + i * 83) % H); g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1; g.beginPath(); g.arc(bx, by, 2 + i % 4, 0, 7); g.stroke(); }
      balls.forEach(b => drawFish(g, b.x, b.y, b.lv, b.rot, Math.sin(t / 200 + b.x) * 2));
      if (!over) { const r = FISH[cur][1], x = Math.max(14 + r, Math.min(W - 14 - r, aimX));
        g.strokeStyle = 'rgba(255,255,255,.25)'; g.setLineDash([3, 6]); g.beginPath(); g.moveTo(x, TOP - 40 + r); g.lineTo(x, H - 14); g.stroke(); g.setLineDash([]);
        g.globalAlpha = dropLock > 0 ? .5 : 1; drawFish(g, x, TOP - 40, cur, 0, Math.sin(t / 150) * 2); g.globalAlpha = 1; }
      g.fillStyle = '#fff'; g.font = `900 20px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(`점수 ${score}`, 16, 22);
      g.font = `700 13px ${FONT}`; g.fillStyle = '#BFE8FF'; g.fillText(`최고 ${Math.max(best0, score)} · 가장 큰 물고기: ${FISH[maxLv][0]}`, 16, 44);
      g.textAlign = 'right'; g.fillText('다음', W - 52, 22); g.save(); g.translate(W - 26, 26); g.scale(16 / FISH[next][1], 16 / FISH[next][1]); drawFish(g, 0, 0, next, 0, 0); g.restore();
      pops.forEach(p => { g.globalAlpha = 1 - p.t; g.fillStyle = '#FFE27A'; g.font = `900 16px ${FONT}`; g.textAlign = 'center'; g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,.6)'; g.strokeText(p.txt, p.x, p.y - p.t * 40); g.fillText(p.txt, p.x, p.y - p.t * 40); g.globalAlpha = 1; });
    }
    function loop(now) {
      if (!cv.isConnected) return;
      const dt = Math.min(.033, (now - last) / 1000); last = now;
      if (!over) step(dt); draw(now); raf = requestAnimationFrame(loop);
    }
    function end() {
      over = true; const best = Math.max(best0, score), coins = Math.min(60, Math.round(score / 60)); LS.set('game.merge', best);
      finish(res, `<b style="font-size:16px">🐟 상자가 가득 찼어요!</b><br>점수 <b>${score}</b> · 가장 큰 물고기 <b>${FISH[maxLv][0]}</b> · 최고 ${best}<br>🪙 코인 +${coins}`, start, onReward, { game: 'merge', score, coins });
    }
    let down = false;
    cv.addEventListener('pointerdown', e => { down = true; aimX = toLocal(cv, e, W, H).x; try { cv.setPointerCapture(e.pointerId); } catch (x) {} });
    cv.addEventListener('pointermove', e => { aimX = toLocal(cv, e, W, H).x; });
    cv.addEventListener('pointerup', e => { if (!down) return; down = false; aimX = toLocal(cv, e, W, H).x; drop(); });
    cv._s = () => ({ balls: balls.length, score, maxLv, over });   // 시험용
    cv._pile = () => { for (let i = 0; i < 16; i++) balls.push({ x: 50 + (i % 4) * 85, y: H - 60 - Math.floor(i / 4) * 110, vx: 0, vy: 0, lv: 6 + (i % 2) + (Math.floor(i / 4) % 2) * 2 > 9 ? 9 : 6 + (i % 2) + (Math.floor(i / 4) % 2) * 2, rot: 0, age: 2 }); };   // 시험용: 가득 채우기
    start();
  }

  /* ── ② 🧱 바다 블록 퍼즐 ── */
  const SHAPES = [[[0, 0]], [[0, 0], [1, 0]], [[0, 0], [0, 1]], [[0, 0], [1, 0], [2, 0]], [[0, 0], [0, 1], [0, 2]], [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[0, 0], [1, 0], [2, 0], [3, 0]], [[0, 0], [0, 1], [0, 2], [0, 3]], [[0, 0], [0, 1], [1, 1]], [[1, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [1, 1]], [[0, 0], [1, 0], [0, 1]],
    [[0, 0], [1, 0], [2, 0], [1, 1]], [[0, 0], [0, 1], [0, 2], [1, 2]], [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]], [[0, 0], [1, 0], [2, 0], [0, 1], [0, 2]], [[1, 0], [0, 1], [1, 1], [2, 1]]];
  const BCOL = ['#4FC3D9', '#F08A5D', '#6FD3A4', '#F5C46B', '#B38CF2', '#FF8A8D', '#8CC8F2'];
  function blockGame(container, onReward) {
    const N = 8, best0 = LS.get('game.block', 0);
    container.innerHTML = `<div style="display:grid;gap:8px;max-width:420px;margin:0 auto">
      <div style="${CARD};font-size:14px">🧱 <b>바다 블록 퍼즐</b> — 아래 조각을 <b>눌러 고른 뒤</b> 판의 칸을 누르면 놓여요(끌어다 놓아도 돼요). 가로·세로 한 줄을 채우면 파도에 쓸려 사라져요. 조각을 놓을 곳이 없으면 끝!</div>
      <div style="display:flex;justify-content:space-between;font:700 15px inherit"><span data-sc>점수 0</span><span data-best style="opacity:.8">최고 ${best0}</span></div>
      <div data-board style="display:grid;grid-template-columns:repeat(${N},1fr);gap:3px;padding:6px;border-radius:12px;background:#0B2A3A;touch-action:none;user-select:none;-webkit-user-select:none"></div>
      <div data-tray style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;touch-action:none"></div>
      <div data-msg style="font-size:13px;opacity:.85;min-height:18px"></div>
      <div data-res style="display:none;${CARD}"></div></div>`;
    const $ = s => container.querySelector(s), boardEl = $('[data-board]'), trayEl = $('[data-tray]'), res = $('[data-res]'), msg = $('[data-msg]');
    let grid, tray, sel, score, combo, over;
    const cells = []; for (let i = 0; i < N * N; i++) { const d = document.createElement('div'); d.style.cssText = 'aspect-ratio:1;border-radius:5px;background:#173E52;transition:background .12s,transform .12s'; d.dataset.i = i; boardEl.appendChild(d); cells.push(d); }
    const fits = (sh, x, y) => sh.every(([dx, dy]) => { const X = x + dx, Y = y + dy; return X >= 0 && Y >= 0 && X < N && Y < N && grid[Y * N + X] == null; });
    const anyFit = sh => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (fits(sh, x, y)) return true; return false; };
    function deal() { tray = [0, 1, 2].map(() => ({ sh: SHAPES[Math.floor(Math.random() * SHAPES.length)], col: BCOL[Math.floor(Math.random() * BCOL.length)] })); }
    function start() { grid = Array(N * N).fill(null); score = 0; combo = 0; over = false; sel = -1; res.style.display = 'none'; msg.textContent = ''; deal(); paint(); }
    function paint(ghost) {
      cells.forEach((d, i) => { const c = grid[i]; d.style.background = c || '#173E52'; d.style.boxShadow = c ? 'inset 0 -3px 0 rgba(0,0,0,.25), inset 0 2px 0 rgba(255,255,255,.25)' : 'none'; d.style.transform = ''; });
      if (ghost) ghost.forEach(i => { cells[i].style.background = grid[i] ? cells[i].style.background : 'rgba(255,255,255,.28)'; });
      $('[data-sc]').textContent = `점수 ${score}${combo > 1 ? ` · 🌊 콤보 ×${combo}` : ''}`;
      trayEl.innerHTML = tray.map((p, k) => { if (!p) return '<div></div>'; const w = Math.max(...p.sh.map(c => c[0])) + 1, h = Math.max(...p.sh.map(c => c[1])) + 1, can = anyFit(p.sh);
        return `<button type="button" data-k="${k}" style="${SOFT};min-height:86px;display:grid;place-items:center;padding:6px;${k === sel ? 'outline:3px solid #FFE27A;' : ''}${can ? '' : 'opacity:.35;'}"><div style="display:grid;grid-template-columns:repeat(${w},14px);grid-template-rows:repeat(${h},14px);gap:2px">${p.sh.map(([x, y]) => `<i style="grid-column:${x + 1};grid-row:${y + 1};background:${p.col};border-radius:3px;display:block"></i>`).join('')}</div></button>`; }).join('');
      trayEl.querySelectorAll('[data-k]').forEach(b => { b.onclick = () => { if (justDragged) return; sel = sel === +b.dataset.k ? -1 : +b.dataset.k; sfx('tap'); msg.textContent = sel >= 0 ? '판에서 놓을 칸(조각의 왼쪽 위)을 눌러요.' : ''; paint(); };
        b.onpointerdown = e => { dragK = +b.dataset.k; drag0 = { x: e.clientX, y: e.clientY }; dragMoved = false; }; });
    }
    function cellAt(e) { const el = document.elementFromPoint(e.clientX, e.clientY); return el && el.dataset && el.dataset.i != null && boardEl.contains(el) ? +el.dataset.i : -1; }
    function place(k, i) {
      const p = tray[k]; if (!p || over) return false; const x = i % N, y = Math.floor(i / N);
      if (!fits(p.sh, x, y)) { msg.textContent = '거기는 자리가 없어요.'; buzz('bad'); return false; }
      p.sh.forEach(([dx, dy]) => grid[(y + dy) * N + x + dx] = p.col); score += p.sh.length; tray[k] = null; sel = -1; sfx('tap');
      const rows = [], cols = []; for (let r = 0; r < N; r++) { if (grid.slice(r * N, r * N + N).every(Boolean)) rows.push(r); } for (let c = 0; c < N; c++) { let f = true; for (let r = 0; r < N; r++) if (!grid[r * N + c]) f = false; if (f) cols.push(c); }
      const lines = rows.length + cols.length;
      if (lines) { combo++; const gain = lines * 10 * lines * combo; score += gain; rows.forEach(r => { for (let c = 0; c < N; c++) grid[r * N + c] = null; }); cols.forEach(c => { for (let r = 0; r < N; r++) grid[r * N + c] = null; });
        msg.textContent = `🌊 ${lines}줄 쓸려 갔어요! +${gain}${combo > 1 ? ` (콤보 ×${combo})` : ''}`; sfx('coin'); buzz('win'); } else { combo = 0; msg.textContent = ''; }
      if (tray.every(t => !t)) deal();
      paint();
      if (!tray.some(t => t && anyFit(t.sh))) end();
      return true;
    }
    function end() {
      over = true; const best = Math.max(best0, score), coins = Math.min(60, Math.round(score / 40)); LS.set('game.block', best); $('[data-best]').textContent = `최고 ${best}`;
      finish(res, `<b style="font-size:16px">🧱 더 놓을 곳이 없어요!</b><br>점수 <b>${score}</b> · 최고 ${best}<br>🪙 코인 +${coins}`, start, onReward, { game: 'block', score, coins });
    }
    let dragK = -1, drag0 = null, dragMoved = false, lastGhost = -2, justDragged = false;
    boardEl.addEventListener('click', e => { const i = cellAt(e); if (i >= 0 && sel >= 0) place(sel, i); });
    function ghostAt(k, e) { if (k < 0 || !tray[k]) return; const i = cellAt(e); if (i === lastGhost) return; lastGhost = i; if (i < 0) { paint(); return; } const x = i % N, y = Math.floor(i / N), sh = tray[k].sh;
      paint(fits(sh, x, y) ? sh.map(([dx, dy]) => (y + dy) * N + x + dx) : null); }
    boardEl.addEventListener('pointermove', e => { if (dragK < 0) ghostAt(sel, e); });   // 마우스: 고른 조각 미리 보기
    document.addEventListener('pointermove', function mv(e) { if (!container.isConnected) { document.removeEventListener('pointermove', mv); return; }   // 끌어다 놓기
      if (dragK < 0 || !drag0) return; if (!dragMoved && Math.hypot(e.clientX - drag0.x, e.clientY - drag0.y) > 10) { dragMoved = true; sel = dragK; } if (dragMoved) ghostAt(dragK, e); });
    document.addEventListener('pointerup', function up(e) { if (!container.isConnected) { document.removeEventListener('pointerup', up); return; } if (dragK < 0) return; const k = dragK, moved = dragMoved || (drag0 && Math.hypot(e.clientX - drag0.x, e.clientY - drag0.y) > 10); dragK = -1; drag0 = null; dragMoved = false; lastGhost = -2;
      if (!moved) return; justDragged = true; setTimeout(() => justDragged = false, 50); const i = cellAt(e); if (i >= 0) place(k, i); else paint(); });
    boardEl._s = () => ({ score, over, filled: grid.filter(Boolean).length, tray: tray.map(t => t && t.sh.length) });   // 시험용
    boardEl._place = place;
    start();
  }

  const LIST = [
    { id: 'merge', ic: '🐟', name: '물고기 합치기', desc: '같은 물고기 둘을 붙여 더 큰 물고기로! 고래상어까지', mount: mergeGame },
    { id: 'block', ic: '🧱', name: '바다 블록 퍼즐', desc: '조각을 놓아 한 줄을 채우면 파도에 쓸려 사라져요', mount: blockGame },
  ];
  window.HotGames = { LIST, extra: onReward => LIST.map(x => ({ id: x.id, ic: x.ic, name: x.name, desc: x.desc, isNew: true, mount: el => x.mount(el, onReward) })) };
})();
