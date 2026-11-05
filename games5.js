/* 인기 장르 신작 5종 — 바다 머지 · 바다 쓰레기 서바이버 · 어종 3매치 · 수산시장 타이쿤 · 아이스박스 쌓기
 * (SunsangHelper PC · 휴대폰 웹 · 모바일 앱 공용, games3.js 뒤에 로드)
 * MoreGames.extra(onReward) → GameHub 메뉴 항목 5개. 끝나면 onReward({ game, score, coins })
 */
(function () {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rnd = (a, b) => a + Math.random() * (b - a), ri = n => Math.floor(Math.random() * n);
  const sfx = k => window.GameHub && GameHub.sfx && GameHub.sfx(k);
  const BTN = 'min-height:46px;border:0;border-radius:12px;font:700 15px inherit;cursor:pointer;touch-action:manipulation';
  const PRIMARY = BTN + ';background:#E2572B;color:#fff', SOFT = BTN + ';background:#2A4650;color:#E3EEF0';
  function shell(container) {
    container.innerHTML = `<div style="display:grid;gap:10px"><div data-body></div><div data-res style="display:none;padding:10px 12px;border-radius:10px;background:var(--sea-soft,#1F3A50);font-size:14.5px;line-height:1.6"></div></div>`;
    return { body: container.querySelector('[data-body]'), res: container.querySelector('[data-res]') };
  }
  function finish(sh, onReward, game, score, extra) {
    score = Math.max(0, Math.round(score));
    const coins = Math.floor(score / 10);
    sh.res.style.display = 'block';
    sh.res.innerHTML = `<b style="font-size:18px">${score}점</b> · 🪙 +${coins}${extra ? '<br>' + extra : ''}`;
    sfx(score > 0 ? 'win' : 'miss');
    if (onReward) try { onReward({ game, score, coins }); } catch (e) {}
  }
  function startBtn(sh, label, fn) {
    const b = document.createElement('button'); b.type = 'button'; b.style.cssText = PRIMARY + ';width:100%'; b.textContent = label; b.onclick = fn;
    sh.body.innerHTML = ''; sh.body.append(b);
  }

  // ═════════ 1. 바다 머지: 같은 단계 둘을 합쳐 다음 단계로, 진주를 만들자 ═════════
  const TIERS = [['🐚', '조개'], ['🦪', '굴'], ['🦐', '새우'], ['🦀', '꽃게'], ['🐟', '우럭'], ['🐠', '참돔'], ['🐙', '문어'], ['🦈', '상어'], ['💎', '진주']];
  function merge(container, onReward) {
    const sh = shell(container), N = 5;
    let grid, sel, nets, score, best;
    function start() { grid = Array(N * N).fill(-1); sel = -1; nets = 60; score = 0; best = 0; for (let i = 0; i < 4; i++) drop(); sh.res.style.display = 'none'; draw(); }
    function drop() { const e = grid.map((v, i) => v < 0 ? i : -1).filter(i => i >= 0); if (!e.length) return false; grid[e[ri(e.length)]] = Math.random() < .8 ? 0 : 1; return true; }
    function canMove() { if (nets > 0 && grid.includes(-1)) return true; const c = {}; grid.forEach(v => { if (v >= 0 && v < TIERS.length - 1) c[v] = (c[v] || 0) + 1; }); return Object.values(c).some(n => n >= 2); }
    function draw() {
      sh.body.innerHTML = `<div style="display:flex;justify-content:space-between;font-weight:700;margin-bottom:6px"><span>🕸 그물 ${nets}</span><span>점수 ${score}</span><span>최고 ${TIERS[best][0]}</span></div>
        <div style="display:grid;grid-template-columns:repeat(${N},1fr);gap:6px;padding:8px;border-radius:14px;background:linear-gradient(#1E6E80,#0E3B47)">${grid.map((v, i) =>
          `<button type="button" data-i="${i}" style="aspect-ratio:1;border:0;border-radius:12px;cursor:pointer;font-size:clamp(22px,7vw,34px);background:${i === sel ? '#FFD34D' : v < 0 ? '#ffffff14' : '#ffffff2e'};box-shadow:${v >= 0 ? 'inset 0 -3px 0 #0003' : 'none'}">${v >= 0 ? TIERS[v][0] : ''}</button>`).join('')}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><button type="button" data-net style="${PRIMARY}" ${nets > 0 ? '' : 'disabled'}>🕸 그물 던지기</button><button type="button" data-end style="${SOFT}">끝내기</button></div>
        <div style="font-size:12.5px;opacity:.8;margin-top:4px">같은 것 둘을 차례로 누르면 합쳐집니다: ${TIERS.map(t => t[0]).join('→')}</div>`;
      sh.body.querySelectorAll('[data-i]').forEach(b => b.onclick = () => tap(+b.dataset.i));
      sh.body.querySelector('[data-net]').onclick = () => { if (nets <= 0) return; if (!drop()) { sfx('miss'); return; } nets--; sfx('hit'); check(); draw(); };
      sh.body.querySelector('[data-end]').onclick = end;
    }
    function tap(i) {
      if (grid[i] < 0) { sel = -1; draw(); return; }
      if (sel < 0 || sel === i) { sel = sel === i ? -1 : i; draw(); return; }
      if (grid[sel] === grid[i] && grid[i] < TIERS.length - 1) {
        const t = grid[i] + 1; grid[i] = t; grid[sel] = -1; sel = -1;
        score += Math.pow(2, t) * 5; best = Math.max(best, t); sfx(t >= 6 ? 'level' : 'catch'); check(); draw();
      } else { sel = i; draw(); }
    }
    function check() { if (!canMove()) setTimeout(end, 300); }
    function end() { const b = TIERS[best]; finish(sh, onReward, 'merge', score, `최고 단계 ${b[0]} ${b[1]}`); startBtn(sh, '↻ 다시 하기', start); }
    startBtn(sh, '▶ 시작 (그물 60번)', start);
    return { destroy() {} };
  }

  // ═════════ 2. 바다 쓰레기 서바이버: 자동 수거 · 레벨업마다 강화 3중 1 ═════════
  function survivor(container, onReward) {
    const sh = shell(container);
    let raf = 0, alive = true, ro = null;
    function start() {
      sh.res.style.display = 'none';
      sh.body.innerHTML = `<div style="position:relative"><canvas style="width:100%;aspect-ratio:1/1;border-radius:12px;display:block;background:#0E4452;touch-action:none"></canvas>
        <div data-up style="display:none;position:absolute;inset:0;background:#000B;border-radius:12px;padding:14px;align-content:center;gap:8px"></div></div>
        <div style="font-size:12.5px;opacity:.8;margin-top:4px">화면을 누르고 있는 쪽으로 배가 움직입니다(PC는 방향키·WASD도). 갈고리는 자동으로 가장 가까운 쓰레기를 수거해요. 120초 버티기!</div>`;
      const cv = sh.body.querySelector('canvas'), ctx = cv.getContext('2d'), up = sh.body.querySelector('[data-up]');
      let W = 0; const size = () => { const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); W = r.width; cv.width = W * d; cv.height = W * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
      ro = new ResizeObserver(size); ro.observe(cv); size();
      const P = { x: .5, y: .5, hp: 100, max: 100, speed: .28, fire: .9, hooks: 1, pierce: 0, magnet: .08, regen: 0, dmg: 1 };
      let foes = [], shots = [], gems = [], t = 0, cool = 0, spawn = 0, xp = 0, need = 5, lv = 1, kills = 0, paused = false, last = 0, over = false;
      const keys = {}, ptr = { on: false, x: .5, y: .5 };
      const kd = e => { keys[e.key.toLowerCase()] = true; if (e.key.startsWith('Arrow')) e.preventDefault(); }, ku = e => keys[e.key.toLowerCase()] = false;
      document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
      const pos = e => { const r = cv.getBoundingClientRect(); ptr.x = (e.clientX - r.left) / r.width; ptr.y = (e.clientY - r.top) / r.height; };
      cv.onpointerdown = e => { ptr.on = true; pos(e); }; cv.onpointermove = e => { if (ptr.on) pos(e); }; cv.onpointerup = cv.onpointerleave = () => ptr.on = false;
      const KINDS = [['🛍️', '비닐', 1, .10, 6], ['🥤', '페트병', 2, .09, 8], ['🕸️', '폐그물', 4, .06, 14], ['🪼', '오염 해파리', 3, .13, 10]];
      const UPG = [
        ['⚡', '갈고리 속도 +25%', () => P.fire *= .75], ['🪝', '갈고리 +1개', () => P.hooks++], ['🚤', '배 속도 +15%', () => P.speed *= 1.15],
        ['🧲', '조개 자석 범위 +50%', () => P.magnet *= 1.5], ['❤️', '최대 체력 +30·회복', () => { P.max += 30; P.hp = P.max; }], ['🌿', '초당 체력 회복 +1', () => P.regen += 1],
        ['💥', '수거력 +1', () => P.dmg++], ['➰', '관통 +1', () => P.pierce++],
      ];
      function levelUp() {
        paused = true; sfx('level');
        const opts = UPG.slice().sort(() => Math.random() - .5).slice(0, 3);
        up.style.display = 'grid';
        up.innerHTML = `<b style="color:#fff;font-size:17px;text-align:center">레벨 ${lv}! 강화 하나를 고르세요</b>` + opts.map((o, i) => `<button type="button" data-o="${i}" style="${PRIMARY};font-size:16px">${o[0]} ${esc(o[1])}</button>`).join('');
        up.querySelectorAll('[data-o]').forEach(b => b.onclick = () => { opts[+b.dataset.o][2](); up.style.display = 'none'; paused = false; last = 0; });
      }
      function frame(ts) {
        if (!alive) return;
        const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts;
        if (!paused && !over) {
          t += dt;
          let dx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0), dy = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
          if (ptr.on) { dx = ptr.x - P.x; dy = ptr.y - P.y; }
          const l = Math.hypot(dx, dy); if (l > .01) { P.x += dx / l * P.speed * dt * Math.min(1, l * 8); P.y += dy / l * P.speed * dt * Math.min(1, l * 8); }
          P.x = Math.max(.04, Math.min(.96, P.x)); P.y = Math.max(.04, Math.min(.96, P.y));
          P.hp = Math.min(P.max, P.hp + P.regen * dt);
          spawn -= dt; const rate = Math.max(.18, .9 - t / 160);
          while (spawn <= 0) { spawn += rate; const k = KINDS[t > 40 ? ri(4) : ri(2)], a = rnd(0, 6.283); foes.push({ x: .5 + Math.cos(a) * .75, y: .5 + Math.sin(a) * .75, k, hp: k[2] * (1 + t / 90), sp: k[3] * (1 + t / 200) }); }
          foes.forEach(f => { const a = Math.atan2(P.y - f.y, P.x - f.x); f.x += Math.cos(a) * f.sp * dt; f.y += Math.sin(a) * f.sp * dt;
            if (Math.hypot(f.x - P.x, f.y - P.y) < .045) { P.hp -= f.k[4] * dt * 3; } });
          cool -= dt;
          if (cool <= 0 && foes.length) { cool = P.fire;
            const near = foes.slice().sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y)).slice(0, P.hooks);
            near.forEach(f => { const a = Math.atan2(f.y - P.y, f.x - P.x); shots.push({ x: P.x, y: P.y, vx: Math.cos(a) * .9, vy: Math.sin(a) * .9, life: .8, pierce: P.pierce }); }); }
          shots.forEach(s => { s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
            foes.forEach(f => { if (s.life > 0 && f.hp > 0 && Math.hypot(f.x - s.x, f.y - s.y) < .035) { f.hp -= P.dmg; if (s.pierce-- <= 0) s.life = 0; if (f.hp <= 0) { kills++; gems.push({ x: f.x, y: f.y }); } } }); });
          shots = shots.filter(s => s.life > 0); foes = foes.filter(f => f.hp > 0);
          gems = gems.filter(g => { const d = Math.hypot(g.x - P.x, g.y - P.y); if (d < P.magnet) { g.x += (P.x - g.x) * dt * 8; g.y += (P.y - g.y) * dt * 8; } if (d < .03) { xp++; return false; } return true; });
          if (xp >= need) { xp -= need; lv++; need = Math.round(need * 1.4); levelUp(); }
          if (P.hp <= 0 || t >= 120) { over = true; const sc = kills * 2 + Math.round(t) * 2 + lv * 20 + (t >= 120 ? 100 : 0);
            finish(sh, onReward, 'survivor', sc, `${t >= 120 ? '🏆 120초 생존!' : '⛔ 배가 멈췄습니다'} · 수거 ${kills}개 · 레벨 ${lv}`);
            const b = document.createElement('button'); b.type = 'button'; b.style.cssText = PRIMARY + ';width:100%;margin-top:8px'; b.textContent = '↻ 다시 출항'; b.onclick = () => { cleanup(); start(); }; sh.body.append(b); }
        }
        ctx.fillStyle = '#0E4452'; ctx.fillRect(0, 0, W, W);
        ctx.strokeStyle = '#ffffff10'; for (let i = 0; i < 8; i++) { const y = ((t * 20 + i * W / 8) % W); ctx.beginPath(); ctx.moveTo(0, y); ctx.quadraticCurveTo(W / 2, y + 8, W, y); ctx.stroke(); }
        gems.forEach(g => { ctx.font = `${W * .03}px sans-serif`; ctx.fillText('🐚', g.x * W - W * .015, g.y * W + W * .01); });
        ctx.font = `${W * .05}px sans-serif`; foes.forEach(f => ctx.fillText(f.k[0], f.x * W - W * .025, f.y * W + W * .018));
        ctx.fillStyle = '#FFD34D'; shots.forEach(s => { ctx.beginPath(); ctx.arc(s.x * W, s.y * W, W * .008, 0, 7); ctx.fill(); });
        ctx.save(); ctx.translate(P.x * W, P.y * W); ctx.fillStyle = '#F4F1E8'; ctx.beginPath(); ctx.moveTo(0, -W * .035); ctx.lineTo(W * .022, W * .03); ctx.lineTo(-W * .022, W * .03); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#1D8A5B'; ctx.fillRect(-W * .01, -W * .005, W * .02, W * .018); ctx.restore();
        ctx.fillStyle = '#0008'; ctx.fillRect(8, 8, W - 16, 44);
        ctx.fillStyle = '#FF8A8D'; ctx.fillRect(14, 14, (W - 28) * Math.max(0, P.hp) / P.max, 8);
        ctx.fillStyle = '#8CC8F2'; ctx.fillRect(14, 26, (W - 28) * xp / need, 6);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.fillText(`⏱ ${Math.max(0, 120 - t).toFixed(0)}초 · Lv.${lv} · 수거 ${kills}`, 14, 48);
        raf = requestAnimationFrame(frame);
      }
      function cleanup() { cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); if (ro) ro.disconnect(); }
      alive = true; raf = requestAnimationFrame(frame);
      survivor._cleanup = cleanup;
    }
    startBtn(sh, '▶ 출항 (120초 생존)', start);
    return { destroy() { alive = false; if (survivor._cleanup) survivor._cleanup(); } };
  }

  // ═════════ 3. 어종 3매치: 이웃 둘을 바꿔 같은 어종 3개 이상 ═════════
  const M3 = ['🐙', '🦑', '🐟', '🐠', '🐡', '🦀'];
  function match3(container, onReward) {
    const sh = shell(container), N = 7;
    let b, sel, moves, score, combo, busy;
    function start() { do { b = Array.from({ length: N * N }, () => ri(M3.length)); } while (findMatches().size); sel = -1; moves = 25; score = 0; busy = false; sh.res.style.display = 'none'; draw(); }
    function findMatches() {
      const m = new Set();
      for (let y = 0; y < N; y++) for (let x = 0; x < N - 2; x++) { const i = y * N + x, v = b[i]; if (v >= 0 && b[i + 1] === v && b[i + 2] === v) { let k = x; while (k < N && b[y * N + k] === v) m.add(y * N + k++); } }
      for (let x = 0; x < N; x++) for (let y = 0; y < N - 2; y++) { const i = y * N + x, v = b[i]; if (v >= 0 && b[i + N] === v && b[i + 2 * N] === v) { let k = y; while (k < N && b[k * N + x] === v) m.add(k++ * N + x); } }
      return m;
    }
    function draw(flash) {
      sh.body.innerHTML = `<div style="display:flex;justify-content:space-between;font-weight:700;margin-bottom:6px"><span>남은 이동 ${moves}</span><span>점수 ${score}</span></div>
        <div style="display:grid;grid-template-columns:repeat(${N},1fr);gap:4px;padding:6px;border-radius:14px;background:linear-gradient(#2D8FA3,#0B3540)">${b.map((v, i) =>
          `<button type="button" data-i="${i}" style="aspect-ratio:1;border:0;border-radius:10px;cursor:pointer;font-size:clamp(18px,5.6vw,28px);background:${i === sel ? '#FFD34D' : flash && flash.has(i) ? '#ffffffaa' : '#ffffff22'};transition:background .15s">${v >= 0 ? M3[v] : ''}</button>`).join('')}</div>
        <div style="font-size:12.5px;opacity:.8;margin-top:4px">이웃한 두 칸을 차례로 누르면 자리를 바꿉니다. 4개 이상·연쇄는 보너스!</div>`;
      sh.body.querySelectorAll('[data-i]').forEach(x => x.onclick = () => tap(+x.dataset.i));
    }
    const wait = ms => new Promise(r => setTimeout(r, ms));
    async function tap(i) {
      if (busy) return;
      if (sel < 0) { sel = i; draw(); return; }
      const a = sel; sel = -1;
      const adj = Math.abs(a - i) === N || (Math.abs(a - i) === 1 && Math.floor(a / N) === Math.floor(i / N));
      if (!adj) { sel = i; draw(); return; }
      [b[a], b[i]] = [b[i], b[a]];
      if (!findMatches().size) { [b[a], b[i]] = [b[i], b[a]]; sfx('miss'); draw(); return; }
      busy = true; moves--; combo = 0;
      let m;
      while ((m = findMatches()).size) {
        combo++; draw(m); await wait(220);
        score += m.size * 10 * combo + (m.size >= 4 ? 30 : 0) + (m.size >= 5 ? 60 : 0); sfx(combo > 1 ? 'level' : 'catch');
        m.forEach(k => b[k] = -1);
        for (let x = 0; x < N; x++) { const col = []; for (let y = N - 1; y >= 0; y--) if (b[y * N + x] >= 0) col.push(b[y * N + x]); for (let y = N - 1, k = 0; y >= 0; y--, k++) b[y * N + x] = k < col.length ? col[k] : ri(M3.length); }
        draw(); await wait(160);
      }
      busy = false; draw();
      if (moves <= 0) { finish(sh, onReward, 'match3', score, '25번 이동 끝!'); const btn = document.createElement('button'); btn.type = 'button'; btn.style.cssText = PRIMARY + ';width:100%;margin-top:8px'; btn.textContent = '↻ 다시 하기'; btn.onclick = start; sh.body.append(btn); busy = true; }
    }
    startBtn(sh, '▶ 시작 (25번 이동)', start);
    return { destroy() {} };
  }

  // ═════════ 4. 수산시장 타이쿤: 90초 동안 팔고·키우고·고용하기 ═════════
  function tycoon(container, onReward) {
    const sh = shell(container);
    let timer = 0;
    function start() {
      sh.res.style.display = 'none';
      const S = { money: 0, earned: 0, stock: 0, cap: 10, supply: 1.2, price: 10, staff: 0, ads: 0, t: 90, queue: 0, lv: { tank: 0, boat: 0, staff: 0, sign: 0, ads: 0 } };
      const UP = [
        ['tank', '🧊 수조 확장', '재고 +10', l => 40 * (l + 1) ** 1.6, () => S.cap += 10],
        ['boat', '🚤 어선 계약', '입고 +1/초', l => 60 * (l + 1) ** 1.7, () => S.supply += 1],
        ['staff', '🧑‍🍳 직원 고용', '자동 판매 +1/초', l => 80 * (l + 1) ** 1.8, () => S.staff += 1],
        ['sign', '🪧 간판 교체', '가격 +40%', l => 70 * (l + 1) ** 1.9, () => S.price = Math.round(S.price * 1.4)],
        ['ads', '📣 홍보', '손님 +50%', l => 50 * (l + 1) ** 1.7, () => S.ads += 1],
      ];
      function sell(n) { const k = Math.min(n, S.stock, Math.floor(S.queue)); if (k <= 0) return 0; S.stock -= k; S.queue -= k; S.money += k * S.price; S.earned += k * S.price; return k; }
      function draw() {
        sh.body.innerHTML = `<div style="display:grid;gap:8px;padding:12px;border-radius:14px;background:linear-gradient(135deg,#FFF4E2,#FFE3C7);color:#4A2E16">
            <div style="display:flex;justify-content:space-between;font-weight:800"><span>⏱ ${Math.ceil(S.t)}초</span><span>💰 ${S.money.toLocaleString()}원</span><span>누적 ${S.earned.toLocaleString()}</span></div>
            <div style="display:flex;gap:10px;align-items:center;font-size:13px"><span>🐟 재고 ${Math.floor(S.stock)}/${S.cap}</span><span>🧍 손님 ${Math.floor(S.queue)}명</span><span>가격 ${S.price}원</span><span>직원 ${S.staff}</span></div>
            <div style="height:8px;border-radius:4px;background:#0001;overflow:hidden"><i style="display:block;height:100%;width:${S.stock / S.cap * 100}%;background:#2D8FA3"></i></div>
            <button type="button" data-sell style="${PRIMARY};font-size:18px;min-height:64px">🐟 팔기! (누를 때마다 손님에게 1마리)</button></div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px">${UP.map(([k, n, d, cost]) => { const c = Math.round(cost(S.lv[k])), can = S.money >= c;
            return `<button type="button" data-up="${k}" ${can ? '' : 'disabled'} style="text-align:left;border:1px solid var(--line,#3E4852);border-radius:12px;padding:8px;background:${can ? 'var(--surface,#1E242B)' : '#0002'};color:inherit;font:13px inherit;cursor:${can ? 'pointer' : 'default'};opacity:${can ? 1 : .6}">
              <b>${n}</b> Lv.${S.lv[k]}<br><span style="font-size:11.5px;opacity:.8">${d}</span><br><b>💰 ${c.toLocaleString()}</b></button>`; }).join('')}</div>`;
        sh.body.querySelector('[data-sell]').onclick = () => { if (sell(1)) sfx('hit'); draw(); };
        sh.body.querySelectorAll('[data-up]').forEach(btn => btn.onclick = () => { const u = UP.find(x => x[0] === btn.dataset.up), c = Math.round(u[3](S.lv[u[0]])); if (S.money < c) return; S.money -= c; S.lv[u[0]]++; u[4](); sfx('catch'); draw(); });
      }
      let acc = 0;
      clearInterval(timer);
      timer = setInterval(() => {
        const dt = .25; S.t -= dt; acc += dt;
        S.stock = Math.min(S.cap, S.stock + S.supply * dt);
        S.queue = Math.min(30, S.queue + (0.8 + S.ads * .4) * (1 + S.lv.sign * .1) * dt);
        S.staffAcc = (S.staffAcc || 0) + S.staff * dt;   // 직원은 초당 staff마리씩, 한 마리 단위로 판매
        while (S.staffAcc >= 1) { S.staffAcc--; if (!sell(1)) break; }
        if (acc >= .5) { acc = 0; draw(); }
        if (S.t <= 0) { clearInterval(timer); finish(sh, onReward, 'tycoon', S.earned / 10, `90초 매출 ${S.earned.toLocaleString()}원 · 직원 ${S.staff}명 · 간판 Lv.${S.lv.sign}`);
          const b = document.createElement('button'); b.type = 'button'; b.style.cssText = PRIMARY + ';width:100%;margin-top:8px'; b.textContent = '↻ 새 가게 열기'; b.onclick = start; sh.body.append(b); }
      }, 250);
      draw();
    }
    startBtn(sh, '▶ 가게 열기 (90초)', start);
    return { destroy() { clearInterval(timer); } };
  }

  // ═════════ 5. 아이스박스 쌓기: 움직이는 상자를 정확히 멈춰 높이 쌓기 ═════════
  function stack(container, onReward) {
    const sh = shell(container);
    let raf = 0, alive = true, ro = null;
    function start() {
      sh.res.style.display = 'none';
      sh.body.innerHTML = `<canvas style="width:100%;aspect-ratio:3/4;border-radius:12px;display:block;background:#BFE3EA;touch-action:none;cursor:pointer"></canvas>
        <div style="font-size:12.5px;opacity:.8;margin-top:4px">화면을 누르면(또는 Space) 움직이는 아이스박스가 멈춥니다. 삐져나온 부분은 잘려요. 딱 맞추면 퍼펙트!</div>`;
      const cv = sh.body.querySelector('canvas'), ctx = cv.getContext('2d');
      let W = 0, H = 0; const size = () => { const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); W = r.width; H = W * 4 / 3; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
      ro = new ResizeObserver(size); ro.observe(cv); size();
      const FISH = ['🐙', '🦑', '🐟', '🐠', '🐡', '🦀', '🦐'];
      const BH = () => H * .06;
      let boxes = [{ x: .25, w: .5, f: '🐟', c: '#E6F2F4' }], cur = null, dir = 1, speed = .45, score = 0, perfect = 0, over = false, camY = 0, last = 0, chips = [];
      const COLORS = ['#E6F2F4', '#FFE3C7', '#DCEEF1', '#FFF4D6', '#E8E1F5', '#DFF5E6'];
      function next() { const top = boxes[boxes.length - 1]; cur = { x: dir > 0 ? -top.w : 1, w: top.w, f: FISH[ri(FISH.length)], c: COLORS[boxes.length % COLORS.length] }; }
      next();
      function drop() {
        if (over) return;
        const top = boxes[boxes.length - 1], l = Math.max(cur.x, top.x), r = Math.min(cur.x + cur.w, top.x + top.w), ov = r - l;
        if (ov <= 0) { over = true; sfx('miss'); end(); return; }
        if (Math.abs(cur.x - top.x) < .012) { cur.x = top.x; perfect++; score += 25; sfx('level'); if (perfect % 3 === 0) cur.w = Math.min(.6, cur.w + .04); boxes.push({ x: cur.x, w: cur.w, f: cur.f, c: cur.c, p: true }); }
        else { chips.push({ x: cur.x < top.x ? cur.x : r, w: cur.w - ov, y: boxes.length, vy: 0, c: cur.c }); boxes.push({ x: l, w: ov, f: cur.f, c: cur.c }); score += 10; perfect = 0; sfx('hit'); }
        speed = Math.min(1.2, speed + .025); dir = -dir; next();
      }
      cv.onpointerdown = drop;
      const kd = e => { if (e.code === 'Space') { e.preventDefault(); drop(); } }; document.addEventListener('keydown', kd);
      function end() { finish(sh, onReward, 'stack', score, `${boxes.length - 1}층 쌓기`);
        const b = document.createElement('button'); b.type = 'button'; b.style.cssText = PRIMARY + ';width:100%;margin-top:8px'; b.textContent = '↻ 다시 쌓기'; b.onclick = () => { cleanup(); start(); }; sh.body.append(b); }
      function frame(ts) {
        if (!alive) return;
        const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts;
        if (!over) { cur.x += dir * speed * dt; if (cur.x > 1) dir = -1; if (cur.x + cur.w < 0) dir = 1; }
        const target = Math.max(0, (boxes.length - 7) * BH()); camY += (target - camY) * Math.min(1, dt * 5);
        const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#FFD7A8'); g.addColorStop(1, '#BFE3EA'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        const yOf = i => H - (i + 1) * BH() - H * .08 + camY;
        ctx.fillStyle = '#2D8FA3'; ctx.fillRect(0, H * .92 + camY, W, H);   // 바다
        const drawBox = (bx, i, c) => { const y = yOf(i); ctx.fillStyle = c; ctx.fillRect(bx.x * W, y, bx.w * W, BH() - 2); ctx.strokeStyle = '#5B7E86'; ctx.strokeRect(bx.x * W + .5, y + .5, bx.w * W - 1, BH() - 3);
          ctx.font = `${BH() * .6}px sans-serif`; if (bx.w * W > BH()) ctx.fillText(bx.f, bx.x * W + bx.w * W / 2 - BH() * .3, y + BH() * .68); if (bx.p) { ctx.fillStyle = '#FFD34D'; ctx.fillRect(bx.x * W, y, bx.w * W, 3); } };
        boxes.forEach((bx, i) => drawBox(bx, i, bx.c));
        chips.forEach(c => { c.vy += dt * 2; c.y -= c.vy * dt * 10; ctx.globalAlpha = .7; ctx.fillStyle = c.c; ctx.fillRect(c.x * W, yOf(c.y), c.w * W, BH() - 2); ctx.globalAlpha = 1; });
        chips = chips.filter(c => yOf(c.y) < H + 50);
        if (!over) drawBox(cur, boxes.length, cur.c);
        ctx.fillStyle = '#4A2E16'; ctx.font = 'bold 16px sans-serif'; ctx.fillText(`${boxes.length - 1}층 · ${score}점${perfect > 1 ? ` · 퍼펙트 ${perfect}연속` : ''}`, 12, 26);
        raf = requestAnimationFrame(frame);
      }
      function cleanup() { cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); if (ro) ro.disconnect(); }
      stack._cleanup = cleanup; alive = true; raf = requestAnimationFrame(frame);
    }
    startBtn(sh, '▶ 쌓기 시작', start);
    return { destroy() { alive = false; if (stack._cleanup) stack._cleanup(); } };
  }

  const LIST = [
    { id: 'merge', ic: '🐚', name: '바다 머지', desc: '[머지] 같은 것 둘을 합쳐 조개 → 진주까지', goal: 300, mount: merge },
    { id: 'survivor', ic: '🛥️', name: '바다 쓰레기 서바이버', desc: '[서바이버] 자동 수거 · 레벨업마다 강화 3중 1 · 120초 생존', goal: 300, mount: survivor },
    { id: 'match3', ic: '🐠', name: '어종 3매치', desc: '[퍼즐] 같은 어종 3개 이상 맞추기 · 연쇄 보너스', goal: 400, mount: match3 },
    { id: 'tycoon', ic: '🏪', name: '수산시장 타이쿤', desc: '[타이쿤] 90초 동안 팔고·키우고·직원 고용', goal: 300, mount: tycoon },
    { id: 'stack', ic: '🧊', name: '아이스박스 쌓기', desc: '[쌓기] 움직이는 상자를 정확히 멈춰 높이', goal: 200, mount: stack },
  ];
  // 오늘의 도전·업적·게임별 순위에 등록
  if (window.GameHub) LIST.forEach(g => { if (GameHub.GNAME) GameHub.GNAME[g.id] = g.name; if (GameHub.GOAL) GameHub.GOAL[g.id] = g.goal; });
  window.MoreGames = { LIST, extra: onReward => LIST.map(g => ({ id: g.id, ic: g.ic, name: g.name, desc: g.desc, isNew: true, mount: el => g.mount(el, onReward) })) };
})();
