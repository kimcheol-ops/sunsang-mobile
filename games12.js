/* 🎮 놀이 게임 4종 — 사용자 요청(2026-11-17 「핸드폰 방향 지시 게임·텃밭 온실·바다 양식장·배 운전」)
 * (PC · 휴대폰 앱 · 조황 수첩 공용, games3.js(GameHub) 뒤에 로드. phone.js(PhoneKit)가 있으면 진동)
 * PlayGames.extra(onReward) → 게임 메뉴 항목. 끝나면 onReward({ game, score, coins })
 * 🧭 선장님 방향 지시 · 🌱 나의 텃밭 온실 · 🐟 우리 바다 양식장 · 🚤 선장 되기(배 운전)
 * 진행 상황은 이 기기 localStorage에만 저장. 결제·뽑기·광고 없음. 실제 업체·제품 이름 없음.
 */
(function () {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sfx = k => window.GameHub && GameHub.sfx && GameHub.sfx(k);
  const buzz = k => { try { window.PhoneKit && PhoneKit.buzz && PhoneKit.buzz(k); } catch (e) {} };
  const BTN = 'min-height:48px;border:0;border-radius:12px;font:700 15px inherit;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none';
  const PRIMARY = BTN + ';background:#E2572B;color:#fff', SOFT = BTN + ';background:#2A4650;color:#E3EEF0', OK = BTN + ';background:#2E7D5B;color:#fff';
  const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)], clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const CARD = 'padding:10px 12px;border-radius:12px;background:var(--sea-soft,#1F3A50);line-height:1.55';

  function shell(container) {
    container.innerHTML = `<div style="display:grid;gap:10px;max-width:560px;margin:0 auto"><div data-body></div><div data-res style="display:none;${CARD};font-size:14.5px"></div></div>`;
    return { body: container.querySelector('[data-body]'), res: container.querySelector('[data-res]') };
  }
  // 정사각 캔버스 + 크기 맞춤
  function square(cv) {
    const g = cv.getContext('2d'), o = { g, W: 320, H: 320 };
    const size = () => { const r = cv.getBoundingClientRect(), k = Math.min(2, devicePixelRatio || 1); o.W = r.width || 320; o.H = o.W; cv.width = o.W * k; cv.height = o.H * k; g.setTransform(k, 0, 0, k, 0, 0); };
    o.ro = window.ResizeObserver ? new ResizeObserver(size) : null; if (o.ro) o.ro.observe(cv); size();
    return o;
  }
  function endBox(sh, html, again, onReward, rec) {
    sh.res.style.display = 'block';
    sh.res.innerHTML = html + `<div style="display:grid;grid-template-columns:1fr;gap:8px;margin-top:8px"><button type="button" data-again style="${PRIMARY}">↻ 다시 하기</button></div>`;
    sh.res.querySelector('[data-again]').onclick = again;
    if (onReward && rec) try { onReward(rec); } catch (e) {}
  }

  /* ───────────── 🧭 선장님 방향 지시 ─────────────
   * 「📢 선장님:」 지시만 따르기(옆 사람 말은 무시). 화살표·뱃말(좌현·우현·선수·선미)·「반대로!」·「물고기 쪽!」
   * 휴대폰은 밀기(스와이프)나 십자 버튼, PC는 방향키·WASD */
  const DIR = { up: { a: '⬆', dx: 0, dy: -1, w: '선수(앞)', s: '앞으로' }, down: { a: '⬇', dx: 0, dy: 1, w: '선미(뒤)', s: '뒤로' }, left: { a: '⬅', dx: -1, dy: 0, w: '좌현(왼쪽)', s: '왼쪽' }, right: { a: '➡', dx: 1, dy: 0, w: '우현(오른쪽)', s: '오른쪽' } };
  const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' }, DK = Object.keys(DIR);
  function dirGame(container, onReward) {
    const sh = shell(container); let stop = () => {};
    function intro() {
      stop(); sh.res.style.display = 'none';
      const best = LS.get('game.dir', 0);
      sh.body.innerHTML = `<div style="${CARD}"><b style="font-size:16px">🧭 선장님 방향 지시</b>${best ? ` · 최고 <b>${best}점</b>` : ''}
        <ul style="margin:6px 0 0;padding-left:20px;font-size:13.5px"><li><b>📢 선장님:</b> 이 붙은 지시만 따라요. 옆 사람 말(회색)은 <b>가만히</b>!</li>
        <li>화살표 → 그 방향, <b>좌현·우현·선수·선미</b> → 배의 왼쪽·오른쪽·앞·뒤</li><li><span style="color:#FF8A7A">빨간 「반대로!」</span> → 반대 방향, <b>「물고기 쪽!」</b> → 물고기가 있는 쪽</li>
        <li>휴대폰은 화면을 밀거나 십자 버튼, PC는 방향키·WASD. 45초 · 하트 3개</li></ul></div>
        <button type="button" data-go style="${PRIMARY};width:100%;margin-top:8px">🧭 시작</button>`;
      sh.body.querySelector('[data-go]').onclick = run;
    }
    function run() {
      stop(); sh.res.style.display = 'none';
      sh.body.innerHTML = `<div style="display:flex;justify-content:space-between;font-weight:700"><span data-t></span><span data-sc></span><span data-h></span></div>
        <canvas style="width:100%;aspect-ratio:1/1;max-width:min(100%,52vh);margin:4px auto;border-radius:14px;display:block;touch-action:none;background:#0B3B5A" aria-label="방향 지시 게임 화면"></canvas>
        <div style="display:grid;grid-template-columns:repeat(3,64px);grid-template-rows:repeat(3,52px);gap:6px;justify-content:center">
          <span></span><button type="button" data-d="up" style="${SOFT}">⬆</button><span></span><button type="button" data-d="left" style="${SOFT}">⬅</button><span style="display:grid;place-items:center;font-size:22px">🚤</span><button type="button" data-d="right" style="${SOFT}">➡</button><span></span><button type="button" data-d="down" style="${SOFT}">⬇</button><span></span></div>`;
      const cv = sh.body.querySelector('canvas'), C = square(cv), g = C.g, q = s => sh.body.querySelector(s);
      const s = { time: 45, score: 0, combo: 0, life: 3, cmd: null, gap: .6, bx: 0, by: 0, msg: '', msgT: 0, ok: 0, n: 0, now: 0 };
      let alive = true, raf = 0, last = 0;
      function newCmd() {
        const p = 1 - s.time / 45, d = pick(DK), r = Math.random(), limit = clamp(2.3 - p * 1.4, .95, 2.3);
        let c;
        if (p > .2 && r < .16) { const fd = pick(DK); c = { want: null, text: `🙋 옆 사람: 「${DIR[fd].s}!」`, arrow: DIR[fd].a, col: '#8CA0AC' }; }
        else if (p > .45 && r < .36) c = { want: OPP[d], text: '📢 선장님: 반대로!', arrow: DIR[d].a, col: '#FF6B5B' };
        else if (p > .3 && r < .55) c = { want: d, text: '📢 선장님: 물고기 쪽!', fish: d, col: '#FFE27A' };
        else if (p > .12 && r < .78) c = { want: d, text: `📢 선장님: ${DIR[d].w}!`, col: '#FFFFFF' };
        else c = { want: d, text: '📢 선장님:', arrow: DIR[d].a, col: '#FFFFFF' };
        c.t = 0; c.limit = limit; s.cmd = c; s.n++;
      }
      const say = (t, sec) => { s.msg = t; s.msgT = sec || 1; };
      function input(d) {
        const c = s.cmd; if (!alive || !c || s.time <= 0) return;
        if (c.want === null) { s.life--; s.combo = 0; say('😢 선장님 지시가 아니었어요!'); sfx('miss'); buzz('miss'); }
        else if (d === c.want) { s.combo++; s.ok++; const pts = 10 + Math.min(20, s.combo * 2) + Math.round((1 - c.t / c.limit) * 10); s.score += pts; say(`+${pts}${s.combo >= 5 ? ' 🔥' + s.combo : ''}`, .6); s.bx = DIR[d].dx * 40; s.by = DIR[d].dy * 40; sfx('hit'); }
        else { s.life--; s.combo = 0; say(`😢 ${DIR[c.want].a} 이었어요`); sfx('miss'); buzz('miss'); }
        s.cmd = null; s.gap = .35;
      }
      function step(dt) {
        s.now += dt; s.time -= dt; s.msgT -= dt; s.bx *= .86; s.by *= .86;
        if (s.cmd) { s.cmd.t += dt; if (s.cmd.t > s.cmd.limit) { if (s.cmd.want === null) { s.score += 8; s.ok++; say('👍 잘 참았어요 +8', .8); } else { s.life--; s.combo = 0; say('⏱ 늦었어요!'); sfx('miss'); buzz('miss'); } s.cmd = null; s.gap = .35; } }
        else { s.gap -= dt; if (s.gap <= 0) newCmd(); }
      }
      function draw() {
        const W = C.W, H = C.H, c = s.cmd;
        cv.dataset.cmd = c ? (c.want || 'none') : '';   // 화면 읽기·시험용(지금 지시)
        g.fillStyle = '#0B4D72'; g.fillRect(0, 0, W, H);
        g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 2;
        for (let i = 0; i < 7; i++) { const y = ((i * 60 + s.now * 30) % (H + 60)) - 30; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= W; x += 20) g.lineTo(x, y + Math.sin(x / 30 + i) * 4); g.stroke(); }
        // 배(위에서 본 모습)
        const cx = W / 2 + s.bx, cy = H * .62 + s.by;
        g.fillStyle = '#F2F5F7'; g.beginPath(); g.moveTo(cx, cy - 46); g.quadraticCurveTo(cx + 26, cy - 10, cx + 22, cy + 38); g.lineTo(cx - 22, cy + 38); g.quadraticCurveTo(cx - 26, cy - 10, cx, cy - 46); g.fill();
        g.fillStyle = '#C0392B'; g.fillRect(cx - 22, cy + 30, 44, 8); g.fillStyle = '#7FB8D8'; g.fillRect(cx - 12, cy - 8, 24, 18);
        g.fillStyle = 'rgba(255,255,255,.65)'; g.font = '700 11px sans-serif'; g.textAlign = 'center';
        g.fillText('선수', cx, cy - 52); g.fillText('선미', cx, cy + 54); g.textAlign = 'right'; g.fillText('좌현', cx - 30, cy + 4); g.textAlign = 'left'; g.fillText('우현', cx + 30, cy + 4);
        if (c) {
          g.textAlign = 'center'; g.fillStyle = c.col; g.font = `800 ${Math.round(W * .06)}px sans-serif`; g.fillText(c.text, W / 2, H * .12);
          if (c.arrow) { g.font = `${Math.round(W * .2)}px system-ui, "Segoe UI Emoji"`; g.globalAlpha = c.want === null ? .5 : 1; g.fillText(c.arrow, W / 2, H * .36); g.globalAlpha = 1; }
          if (c.fish) { const f = DIR[c.fish]; g.font = `${Math.round(W * .11)}px system-ui, "Segoe UI Emoji"`; g.fillText('🐟', W / 2 + f.dx * W * .36, H * .62 + f.dy * H * .3 + 10); }
          g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(W * .1, H * .16, W * .8, 6); g.fillStyle = c.want === null ? '#8CA0AC' : '#FFE27A'; g.fillRect(W * .1, H * .16, W * .8 * (1 - c.t / c.limit), 6);
        }
        if (s.msgT > 0) { g.fillStyle = '#FFE27A'; g.font = '800 18px sans-serif'; g.textAlign = 'center'; g.fillText(s.msg, W / 2, H * .94); }
        q('[data-t]').textContent = `⏱ ${Math.max(0, Math.ceil(s.time))}초`; q('[data-sc]').textContent = `${s.score}점`; q('[data-h]').textContent = '❤'.repeat(Math.max(0, s.life)) + '🤍'.repeat(3 - Math.max(0, s.life));
      }
      function frame(ts) {
        if (!alive) return; if (!cv.isConnected) { cleanup(); return; }
        const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts; step(dt); draw();
        if (s.time <= 0 || s.life <= 0) { cleanup(); finish(); return; }
        raf = requestAnimationFrame(frame);
      }
      function finish() {
        const best = LS.get('game.dir', 0), nb = s.score > best; if (nb) LS.set('game.dir', s.score);
        const coins = Math.floor(s.score / 40);
        endBox(sh, `<b style="font-size:18px">${s.life > 0 ? '⏱ 끝!' : '💔 하트를 다 썼어요'}</b> <b>${s.score}점</b>${nb ? ' 🏅 최고 기록!' : ''} · 맞힌 지시 ${s.ok}/${s.n} · 🪙 +${coins}
          <br><span style="font-size:13px">💡 배에서 <b>좌현</b>은 앞을 볼 때 왼쪽, <b>우현</b>은 오른쪽, <b>선수</b>는 앞, <b>선미</b>는 뒤예요. 선상에서는 선장님 안내 방송을 잘 듣는 게 안전의 시작이에요.</span>`, run, onReward, { game: 'dirgame', score: s.score, coins });
        sfx('win');
      }
      let sx = 0, sy = 0, sd = false;
      cv.addEventListener('pointerdown', e => { e.preventDefault(); sd = true; sx = e.clientX; sy = e.clientY; });
      cv.addEventListener('pointerup', e => { if (!sd) return; sd = false; const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 26) return; input(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); });
      sh.body.querySelectorAll('[data-d]').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); input(b.dataset.d); }));
      const KM = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
      const kd = e => { if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; const d = KM[e.code]; if (d) { e.preventDefault(); if (!e.repeat) input(d); } };
      document.addEventListener('keydown', kd);
      function cleanup() { alive = false; cancelAnimationFrame(raf); if (C.ro) C.ro.disconnect(); document.removeEventListener('keydown', kd); }
      stop = cleanup; raf = requestAnimationFrame(frame);
    }
    intro();
    return { destroy: () => stop() };
  }

  /* ───────────── 🌱 나의 텃밭 온실 ─────────────
   * 먹고 싶은 밥상을 고르고, 맞는 작물을 심어 키우기. 게임 속 하루 = 실제 약 1주(4일마다 한 달).
   * 바깥 기온은 실제 달(현재 달에서 시작)의 대략 평균. 온실을 닫으면 +10℃(비는 막음), 더운 날엔 열어서 환기. */
  const CROP = {
    lettuce: { n: '상추', ic: '🥬', d: 4, t: [10, 25] }, perilla: { n: '깻잎', ic: '🌿', d: 4, t: [18, 30] }, pepper: { n: '고추', ic: '🌶', d: 7, t: [18, 30] },
    tomato: { n: '방울토마토', ic: '🍅', d: 7, t: [18, 30] }, cucumber: { n: '오이', ic: '🥒', d: 5, t: [18, 30] }, straw: { n: '딸기', ic: '🍓', d: 7, t: [12, 25] },
    potato: { n: '감자', ic: '🥔', d: 6, t: [10, 23] }, carrot: { n: '당근', ic: '🥕', d: 6, t: [12, 25] }, sweet: { n: '고구마', ic: '🍠', d: 7, t: [20, 32] },
    corn: { n: '옥수수', ic: '🌽', d: 7, t: [18, 32] }, eggplant: { n: '가지', ic: '🍆', d: 6, t: [20, 30] }, garlic: { n: '마늘', ic: '🧄', d: 6, t: [5, 20] },
  };
  const MEAL = [
    { id: 'ssam', n: '🐟 회 쌈 한 상(오늘 잡은 생선과)', need: { lettuce: 2, perilla: 2, pepper: 1, garlic: 1 } },
    { id: 'salad', n: '🥗 토마토 샐러드', need: { tomato: 2, cucumber: 1, lettuce: 1 } },
    { id: 'curry', n: '🍛 카레라이스', need: { potato: 2, carrot: 2 } },
    { id: 'snack', n: '🍠 군고구마·찐옥수수 간식', need: { sweet: 2, corn: 2 } },
    { id: 'berry', n: '🍓 딸기 디저트', need: { straw: 3 } },
    { id: 'fry', n: '🍆 가지·고추 볶음', need: { eggplant: 2, pepper: 2 } },
    { id: 'maeun', n: '🍲 우럭 매운탕 채소', need: { garlic: 2, pepper: 2, potato: 1 } },
  ];
  const OUT = [-2, 1, 7, 13, 18, 23, 26, 27, 22, 15, 8, 1];   // 대략 월평균 기온(중부)
  function gardenGame(container, onReward) {
    const sh = shell(container), KEY = 'game.garden';
    const fresh = () => ({ day: 1, m: new Date().getMonth(), gh: false, plots: Array.from({ length: 6 }, () => null), basket: {}, goal: null, done: [], w: null, log: '먹고 싶은 밥상을 골라요.' });
    let st = LS.get(KEY, null); if (!st || !Array.isArray(st.plots)) st = fresh();
    let sel = -1;
    const save = () => LS.set(KEY, st);
    function weather() {
      const m = st.m, hot = OUT[m] >= 24, cold = OUT[m] <= 5, r = Math.random();
      if (hot && r < .25) return { n: '🔥 폭염', adj: 5, rain: 0, dry: 38 };
      if (cold && r < .25) return { n: '🥶 한파', adj: -6, rain: 0, dry: 18 };
      if (r < .55) return { n: '☀ 맑음', adj: 1, rain: 0, dry: 28 };
      if (r < .78) return { n: '☁ 흐림', adj: -1, rain: 0, dry: 20 };
      return { n: cold ? '🌨 눈' : '🌧 비', adj: -2, rain: 45, dry: 10 };
    }
    if (!st.w) st.w = weather();
    const inside = () => OUT[st.m] + st.w.adj + (st.gh ? 10 : 0);
    function fit(c, T) { const [a, b] = CROP[c].t; return T >= a && T <= b ? 2 : T >= a - 4 && T <= b + 4 ? 1 : 0; }
    function nextDay() {
      const T = inside(), notes = [];
      st.plots.forEach((p, i) => {
        if (!p || p.dead) return;
        if (!st.gh) p.wt = Math.min(100, p.wt + st.w.rain);
        p.wt = Math.max(0, p.wt - st.w.dry - (T > 30 ? 10 : 0));
        const f = fit(p.c, T); let bad = 0;
        if (f === 0) { bad++; notes.push(`${CROP[p.c].ic} ${T < CROP[p.c].t[0] ? '추워요' : '너무 더워요'}`); }
        if (p.wt < 15) { bad++; notes.push(`${CROP[p.c].ic} 목말라요`); }
        if (p.wt > 95) { p.wet = (p.wet || 0) + 1; if (p.wet >= 2) { bad++; notes.push(`${CROP[p.c].ic} 물이 너무 많아 뿌리가 숨을 못 쉬어요`); } } else p.wet = 0;
        if (p.bug) { bad++; notes.push(`${CROP[p.c].ic} 벌레가 갉아 먹었어요`); }
        if (bad) { p.hp -= bad; if (p.hp <= 0) { p.dead = true; notes.push(`🥀 ${CROP[p.c].n} 시들었어요`); } }
        else if (p.g < CROP[p.c].d) p.g += f === 2 && p.wt >= 30 ? 1 : .5;
        p.bug = !p.dead && p.g < CROP[p.c].d && Math.random() < .14;
      });
      st.day++; if (st.day % 4 === 1) st.m = (st.m + 1) % 12;
      st.w = weather();
      st.log = notes.length ? notes.slice(0, 4).join(' · ') : '🌱 모두 잘 자랐어요.';
      if (st.gh && OUT[st.m] + st.w.adj + 10 > 32) st.log += ' · 🌡 온실이 너무 더워요 — 열어서 환기!';
      if (!st.gh && OUT[st.m] + st.w.adj < 8) st.log += ' · ❄ 바깥이 추워요 — 온실을 닫아요';
      save(); draw(); sfx('hit');
    }
    function draw() {
      const T = inside(), goal = MEAL.find(x => x.id === st.goal);
      if (!goal) {
        sh.body.innerHTML = `<div style="${CARD}"><b style="font-size:16px">🌱 나의 텃밭 온실</b> · 완성한 밥상 ${st.done.length}/${MEAL.length}<div style="font-size:13px;opacity:.85">먹고 싶은 밥상을 고르면 필요한 작물이 나와요. 작물마다 좋아하는 온도·물이 달라요. 지금은 <b>${st.m + 1}월</b>(바깥 약 ${OUT[st.m]}℃)부터 시작해요.</div></div>
          <div style="display:grid;gap:6px;margin-top:8px">${MEAL.map(x => `<button type="button" data-meal="${x.id}" style="${SOFT};text-align:left;padding:8px 12px">${esc(x.n)}${st.done.includes(x.id) ? ' <span style="color:#4BD08A">✔</span>' : ''}<br><span style="font-size:12px;opacity:.8">${Object.entries(x.need).map(([k, v]) => CROP[k].ic + CROP[k].n + '×' + v).join(' ')}</span></button>`).join('')}</div>`;
        sh.body.querySelectorAll('[data-meal]').forEach(b => b.onclick = () => { st.goal = b.dataset.meal; st.basket = {}; save(); draw(); });
        return;
      }
      const have = Object.entries(goal.need).map(([k, v]) => `${CROP[k].ic}${Math.min(v, st.basket[k] || 0)}/${v}`).join(' ');
      const p = sel >= 0 ? st.plots[sel] : null;
      sh.body.innerHTML = `<div style="${CARD};font-size:13.5px"><b>${st.m + 1}월 · ${st.day}일째</b> · ${st.w.n} · 바깥 ${OUT[st.m] + st.w.adj}℃ → 밭 <b style="color:${T > 32 || T < 8 ? '#FF8A7A' : '#4BD08A'}">${T}℃</b>
          <br>🎯 ${esc(goal.n)} : ${have}</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px;padding:8px;border-radius:14px;background:${st.gh ? 'linear-gradient(#CFE8F3,#A9D3C2)' : '#6B4F2E'}">${st.plots.map((q, i) => {
          const c = q && CROP[q.c], ripe = q && !q.dead && q.g >= c.d;
          return `<button type="button" data-p="${i}" style="${BTN};min-height:86px;background:${i === sel ? '#E2572B' : '#4A3520'};color:#fff;font-size:12px;padding:4px">
            ${!q ? '<span style="font-size:22px">🟫</span><br>빈 밭' : q.dead ? '<span style="font-size:22px">🥀</span><br>시듦' : `<span style="font-size:${ripe ? 28 : 14 + q.g / c.d * 10}px">${ripe ? c.ic : '🌱'}</span>${q.bug ? '🐛' : ''}<br>${esc(c.n)} ${ripe ? '✔' : Math.floor(q.g / c.d * 100) + '%'}<br>💧${Math.round(q.wt)} ❤${q.hp}`}</button>`; }).join('')}</div>
        <div style="font-size:13px;margin:6px 0;min-height:20px">${esc(st.log)}</div>
        <div data-act style="display:grid;gap:6px"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:6px">
          <button type="button" data-gh style="${SOFT}">${st.gh ? '🏠 온실 열기' : '🏠 온실 닫기'}</button><button type="button" data-water style="${SOFT}">💧 모두 물</button><button type="button" data-next style="${PRIMARY}">☀ 하루 지나기</button></div>
        <button type="button" data-reset style="${SOFT};width:100%;margin-top:6px;min-height:38px;font-size:12.5px">🍽 다른 밥상 고르기</button>`;
      const act = sh.body.querySelector('[data-act]');
      if (sel >= 0 && (!p || p.dead)) {
        act.innerHTML = `<div style="font-size:12.5px">심을 작물(지금 밭 ${T}℃) — 🟢 딱 좋아요 · 🟡 조금 안 맞아요 · 🔴 안 맞아요</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:6px">${Object.entries(CROP).map(([k, c]) => `<button type="button" data-seed="${k}" style="${SOFT};min-height:44px;font-size:12.5px;padding:2px">${['🔴', '🟡', '🟢'][fit(k, T)]} ${c.ic}${esc(c.n)}<br><span style="opacity:.7">${c.t[0]}~${c.t[1]}℃</span></button>`).join('')}</div>`;
        act.querySelectorAll('[data-seed]').forEach(b => b.onclick = () => { st.plots[sel] = { c: b.dataset.seed, g: 0, wt: 60, hp: 3, bug: false }; st.log = `🌱 ${CROP[b.dataset.seed].n} 심었어요. 물이 30~90일 때 잘 커요.`; save(); draw(); });
      } else if (p) {
        const c = CROP[p.c], ripe = p.g >= c.d;
        act.innerHTML = `<div style="display:grid;grid-template-columns:repeat(${ripe ? 2 : 3},1fr);gap:6px">${ripe ? `<button type="button" data-h style="${OK}">🧺 수확</button>` : `<button type="button" data-w style="${SOFT}">💧 물 주기</button><button type="button" data-b style="${SOFT}" ${p.bug ? '' : 'disabled'}>🐛 벌레 잡기</button>`}<button type="button" data-x style="${SOFT}">🗑 뽑기</button></div>
          <div style="font-size:12px;opacity:.8">${esc(c.n)}: ${c.t[0]}~${c.t[1]}℃에서 잘 자라요 · 다 크려면 ${c.d}일</div>`;
        const on = (s, f) => { const b = act.querySelector(s); if (b) b.onclick = f; };
        on('[data-w]', () => { p.wt = Math.min(100, p.wt + 35); st.log = `💧 ${c.n}에 물을 줬어요(${Math.round(p.wt)})${p.wt > 95 ? ' — 너무 많으면 뿌리가 썩어요' : ''}`; save(); draw(); });
        on('[data-b]', () => { p.bug = false; st.log = '🐛 벌레를 손으로 잡았어요(농약 없이!)'; save(); draw(); sfx('hit'); });
        on('[data-x]', () => { st.plots[sel] = null; save(); draw(); });
        on('[data-h]', harvest);
      }
      sh.body.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { sel = +b.dataset.p === sel ? -1 : +b.dataset.p; draw(); });
      sh.body.querySelector('[data-gh]').onclick = () => { st.gh = !st.gh; st.log = st.gh ? '🏠 온실을 닫았어요(+10℃, 비는 안 들어와요 — 물은 직접 줘야 해요)' : '🏠 온실을 열었어요(환기, 비가 들어와요)'; save(); draw(); };
      sh.body.querySelector('[data-water]').onclick = () => { st.plots.forEach(q => { if (q && !q.dead && q.wt < 60) q.wt = Math.min(100, q.wt + 35); }); st.log = '💧 마른 밭에만 물을 줬어요'; save(); draw(); };
      sh.body.querySelector('[data-next]').onclick = nextDay;
      sh.body.querySelector('[data-reset]').onclick = () => { st.goal = null; sel = -1; save(); draw(); };
    }
    function harvest() {
      const p = st.plots[sel], c = CROP[p.c]; st.basket[p.c] = (st.basket[p.c] || 0) + (p.hp >= 3 ? 2 : 1); st.plots[sel] = null; sel = -1;
      st.log = `🧺 ${c.n} 수확! ${p.hp >= 3 ? '(튼튼해서 2개)' : ''}`; sfx('win'); buzz('win');
      const goal = MEAL.find(x => x.id === st.goal);
      if (goal && Object.entries(goal.need).every(([k, v]) => (st.basket[k] || 0) >= v)) {
        const first = !st.done.includes(goal.id); if (first) st.done.push(goal.id);
        const score = 100 + (first ? 100 : 0) + Math.max(0, 60 - st.day), coins = Math.floor(score / 10);
        st.goal = null; st.basket = {}; save(); draw();
        endBox(sh, `<b style="font-size:18px">🍽 ${esc(goal.n)} 완성!</b> <b>${score}점</b> · 🪙 +${coins}${first ? ' · 🏅 새 밥상' : ''}<br><span style="font-size:13px">💡 작물마다 좋아하는 온도가 달라요. 겨울엔 온실을 닫고, 여름 한낮엔 열어서 환기해요. 물은 「겉흙이 마르면 듬뿍」이 기본이에요.</span>`,
          () => { sh.res.style.display = 'none'; draw(); }, onReward, { game: 'garden', score, coins });
        return;
      }
      save(); draw();
    }
    draw();
    return { destroy() {} };
  }

  /* ───────────── 🐟 우리 바다 양식장 ─────────────
   * 바다(서해·남해·동해·제주)를 고르고, 그 바다 수온에 맞는 어종을 키우기. 한 턴 = 1주, 4주마다 한 달.
   * 수온은 해역별 대략 월평균(실제 값과 다를 수 있음). 고수온·적조·태풍 예보가 오면 미리 대비. */
  const SEA = {
    west: { n: '서해', t: [5, 4, 6, 9, 13, 18, 22, 25, 23, 19, 14, 9] }, south: { n: '남해', t: [13, 12, 13, 15, 18, 21, 24, 26, 24, 21, 18, 15] },
    east: { n: '동해', t: [11, 10, 11, 13, 16, 19, 22, 24, 22, 19, 16, 13] }, jeju: { n: '제주', t: [15, 14, 15, 16, 19, 22, 26, 27, 26, 23, 20, 17] },
  };
  const SP = {
    flat: { n: '넙치(광어)', ic: '🐟', t: [13, 25], w: 10, p: 40, feed: true }, rock: { n: '조피볼락(우럭)', ic: '🐟', t: [10, 22], w: 10, p: 35, feed: true },
    bream: { n: '참돔', ic: '🐠', t: [16, 28], w: 12, p: 45, feed: true }, abalone: { n: '전복', ic: '🐚', t: [12, 24], w: 12, p: 50, feed: true, kelp: true },
    oyster: { n: '굴', ic: '🦪', t: [8, 25], w: 8, p: 25 }, laver: { n: '김', ic: '🌿', t: [5, 15], w: 5, p: 20 },
    wakame: { n: '미역', ic: '🌱', t: [5, 16], w: 6, p: 20 }, salmon: { n: '연어', ic: '🍣', t: [8, 17], w: 10, p: 55, feed: true },
    squirt: { n: '멍게', ic: '🔴', t: [5, 20], w: 8, p: 30 },
  };
  function farmGame(container, onReward) {
    const sh = shell(container), KEY = 'game.farm';
    let st = LS.get(KEY, null);
    const save = () => LS.set(KEY, st);
    const temp = () => SEA[st.sea].t[st.m] + (st.dt || 0);
    function choose() {
      sh.res.style.display = 'none';
      sh.body.innerHTML = `<div style="${CARD}"><b style="font-size:16px">🐟 우리 바다 양식장</b>${st && st.total ? ` · 지금까지 수확 ${st.total}번` : ''}
        <div style="font-size:13px;opacity:.85">바다마다 수온이 달라서 잘 크는 어종이 달라요. 바다를 고르고 칸 3개에 어종을 넣어 키워요. 한 턴은 1주예요.</div></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px">${Object.entries(SEA).map(([k, s]) => `<button type="button" data-sea="${k}" style="${SOFT};text-align:left;padding:8px">🌊 <b>${s.n}</b><br><span style="font-size:11.5px;opacity:.8">겨울 ${Math.min(...s.t)}℃ · 여름 ${Math.max(...s.t)}℃</span></button>`).join('')}</div>`;
      sh.body.querySelectorAll('[data-sea]').forEach(b => b.onclick = () => { st = { sea: b.dataset.sea, m: new Date().getMonth(), wk: 0, pens: [null, null, null], money: 300, total: (st && st.total) || 0, fore: null, ev: null, prep: {}, log: '칸을 눌러 어종을 넣어요.', dt: 0 }; save(); draw(); });
    }
    function forecast() {
      const T = temp(), m = st.m, r = Math.random();
      if (T >= 25 && r < .45) return { k: 'hot', n: '🌡 고수온 주의보', fix: 'oxy', fixN: '🫧 산소 공급·먹이 줄이기' };
      if (st.sea !== 'east' && m >= 6 && m <= 8 && r < .25) return { k: 'red', n: '🟥 적조(붉은 물) 예보', fix: 'clay', fixN: '🟫 황토 뿌리기' };
      if (m >= 6 && m <= 8 && r < .2) return { k: 'storm', n: '🌀 태풍 예보', fix: 'rope', fixN: '⚓ 가두리·줄 단단히 묶기' };
      if (T <= 6 && r < .35) return { k: 'cold', n: '🥶 저수온 주의보', fix: 'deep', fixN: '⬇ 가두리를 깊게(따뜻한 물)' };
      return null;
    }
    function week() {
      const T = temp(), notes = [], ev = st.fore;
      st.pens.forEach(p => {
        if (!p || p.dead) return;
        const s = SP[p.sp], [a, b] = s.t, ok = T >= a && T <= b, near = T >= a - 3 && T <= b + 3;
        let g = ok ? 100 / s.w : near ? 50 / s.w : 0;
        if (s.feed) { if (p.fd === 0) g *= .4; if (p.fd === 2) { g *= 1.3; if (T > b - 1) { p.hp -= 10; notes.push(`${s.ic} 더운 물에 먹이를 많이 줘서 물이 탁해졌어요`); } } st.money -= [0, 8, 15][p.fd]; }
        if (!near) { p.hp -= 18; notes.push(`${s.ic} ${T < a ? '물이 너무 차가워요' : '물이 너무 따뜻해요'}(${T}℃)`); } else if (!ok) p.hp -= 4;
        if (ev && !st.prep[ev.k]) { const dmg = { hot: 20, red: 30, storm: 25, cold: 15 }[ev.k]; if (!(ev.k === 'red' && !s.feed && s.p <= 25)) { p.hp -= dmg; notes.push(`${s.ic} ${ev.n.slice(2)} 피해 −${dmg}`); } }
        p.size = Math.min(100, p.size + g * (p.hp > 50 ? 1 : .6));
        if (p.hp <= 0) { p.dead = true; notes.push(`💀 ${s.n} 칸을 잃었어요`); }
      });
      if (ev && st.prep[ev.k]) notes.unshift(`✅ ${ev.n.slice(2)} — 미리 대비해서 피해가 없었어요!`);
      st.wk++; if (st.wk % 4 === 0) st.m = (st.m + 1) % 12; st.dt = Math.round(rnd(-1.5, 1.5));
      st.fore = forecast(); st.prep = {};
      st.log = notes.length ? notes.slice(0, 4).join(' · ') : '🌊 평온한 한 주였어요.';
      save(); draw(); sfx('hit');
    }
    function draw() {
      if (!st || !st.sea) return choose();
      const T = temp(), sel = st.sel;
      sh.body.innerHTML = `<div style="${CARD};font-size:13.5px"><b>🌊 ${SEA[st.sea].n} · ${st.m + 1}월 ${st.wk % 4 + 1}주</b> · 수온 <b style="color:#FFE27A">${T}℃</b> · 🪙 양식장 돈 ${st.money}
          ${st.fore ? `<br><b style="color:#FF8A7A">📢 다음 주 예보: ${st.fore.n}</b> → ${st.prep[st.fore.k] ? '✅ 대비 완료' : `<button type="button" data-prep style="${OK};min-height:34px;font-size:13px;padding:0 10px">${st.fore.fixN} (🪙20)</button>`}` : '<br>📢 다음 주 특별한 예보 없음'}</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px;padding:8px;border-radius:14px;background:linear-gradient(#1C6E96,#0B3350)">${st.pens.map((p, i) => { const s = p && SP[p.sp];
          return `<button type="button" data-pen="${i}" style="${BTN};min-height:96px;background:${i === sel ? '#E2572B' : 'rgba(255,255,255,.12)'};color:#fff;font-size:12px;padding:4px;border:2px dashed rgba(255,255,255,.35)">${!p ? '➕<br>빈 가두리' : p.dead ? '💀<br>' + esc(s.n) : `<span style="font-size:${14 + p.size / 8}px">${s.ic}</span><br>${esc(s.n)}<br>크기 ${Math.floor(p.size)}% ❤${p.hp}${s.feed ? '<br>먹이 ' + ['안 줌', '보통', '많이'][p.fd] : ''}`}</button>`; }).join('')}</div>
        <div style="font-size:13px;margin:6px 0;min-height:20px">${esc(st.log)}</div><div data-act></div>
        <div style="display:grid;grid-template-columns:1fr 2fr;gap:6px;margin-top:6px"><button type="button" data-sea2 style="${SOFT};font-size:13px">🌊 바다 바꾸기</button><button type="button" data-next style="${PRIMARY}">⏭ 한 주 지나기</button></div>`;
      const act = sh.body.querySelector('[data-act]'), p = sel != null ? st.pens[sel] : null;
      if (sel != null && (!p || p.dead)) {
        act.innerHTML = `<div style="font-size:12.5px">넣을 어종 (지금 ${T}℃ · 🟢 잘 맞음 🟡 조금 🔴 안 맞음 · 새끼 값 🪙30)</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:6px">${Object.entries(SP).map(([k, s]) => { const f = T >= s.t[0] && T <= s.t[1] ? 2 : T >= s.t[0] - 3 && T <= s.t[1] + 3 ? 1 : 0;
          return `<button type="button" data-sp="${k}" style="${SOFT};min-height:44px;font-size:12px;padding:2px">${['🔴', '🟡', '🟢'][f]} ${s.ic}${esc(s.n)}<br><span style="opacity:.7">${s.t[0]}~${s.t[1]}℃ · ${s.w}주</span></button>`; }).join('')}</div>`;
        act.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => { if (st.money < 30) { st.log = '🪙 돈이 모자라요. 다 큰 걸 먼저 수확해요.'; return draw(); } st.money -= 30; st.pens[sel] = { sp: b.dataset.sp, size: 5, hp: 100, fd: 1 }; st.log = `${SP[b.dataset.sp].ic} ${SP[b.dataset.sp].n} 새끼를 넣었어요.${SP[b.dataset.sp].feed ? '' : ' (먹이 없이 바닷물 속 영양분으로 커요)'}`; st.sel = null; save(); draw(); });
      } else if (p) {
        const s = SP[p.sp], ripe = p.size >= 100;
        act.innerHTML = `<div style="display:grid;grid-template-columns:repeat(${s.feed && !ripe ? 4 : 2},1fr);gap:6px">${ripe ? `<button type="button" data-harv style="${OK}">🧺 수확·출하</button>` : s.feed ? [0, 1, 2].map(v => `<button type="button" data-fd="${v}" style="${p.fd === v ? OK : SOFT};font-size:13px">${['🚫 안 줌', '🍚 보통', '🍚🍚 많이'][v]}</button>`).join('') : ''}<button type="button" data-clean style="${SOFT};font-size:13px">🧹 그물 청소 🪙10</button></div>
          <div style="font-size:12px;opacity:.8">${esc(s.n)}: ${s.t[0]}~${s.t[1]}℃에서 잘 커요${s.kelp ? ' · 먹이는 미역·다시마' : ''} · 다 크면 🪙${s.p * 2}쯤</div>`;
        act.querySelectorAll('[data-fd]').forEach(b => b.onclick = () => { p.fd = +b.dataset.fd; save(); draw(); });
        const cl = act.querySelector('[data-clean]'); if (cl) cl.onclick = () => { if (st.money < 10) return; st.money -= 10; p.hp = Math.min(100, p.hp + 15); st.log = '🧹 그물을 청소해 물이 잘 통해요(❤+15)'; save(); draw(); };
        const hv = act.querySelector('[data-harv]'); if (hv) hv.onclick = () => {
          const got = Math.round(s.p * 2 * p.hp / 100); st.money += got; st.total = (st.total || 0) + 1; st.pens[sel] = null; st.sel = null; save(); draw(); sfx('win'); buzz('win');
          const score = got + 20, coins = Math.floor(score / 10);
          endBox(sh, `<b style="font-size:18px">🧺 ${esc(s.n)} 출하!</b> 🪙${got} (건강 ${p.hp}%) · <b>${score}점</b> · 게임 코인 +${coins}<br><span style="font-size:13px">💡 ${s.feed ? '물이 따뜻할 때 먹이를 많이 주면 남은 먹이가 썩어 물이 나빠져요. 고수온 때는 먹이를 줄이는 게 기본이에요.' : '굴·김·미역·멍게는 먹이를 주지 않아도 바닷물 속 영양분으로 자라요. 그래서 바다가 깨끗해야 해요.'}</span>`,
            () => { sh.res.style.display = 'none'; draw(); }, onReward, { game: 'seafarm', score, coins });
        };
      }
      sh.body.querySelectorAll('[data-pen]').forEach(b => b.onclick = () => { st.sel = st.sel === +b.dataset.pen ? null : +b.dataset.pen; draw(); });
      const pr = sh.body.querySelector('[data-prep]'); if (pr) pr.onclick = () => { if (st.money < 20) { st.log = '🪙 돈이 모자라요'; return draw(); } st.money -= 20; st.prep[st.fore.k] = true; st.log = `✅ ${st.fore.fixN} 완료`; save(); draw(); };
      sh.body.querySelector('[data-next]').onclick = week;
      sh.body.querySelector('[data-sea2]').onclick = () => { if (confirm('바다를 바꾸면 지금 가두리는 비워져요. 바꿀까요?')) choose(); };
    }
    draw();
    return { destroy() {} };
  }

  /* ───────────── 🚤 선장 되기(배 운전) ─────────────
   * 항구 출항(항 안 5노트 이하) → 항로 부표 사이 통과(나갈 때 빨간 부표가 왼쪽 — 우리나라 방식) → 포인트에서 멈추기 → 귀항·접안.
   * 키(◀▶)는 누르고 있기, 엔진(▲▼)은 한 번씩 눌러 단계 조절. 바람·물살에 배가 밀려요. */
  function boatGame(container, onReward) {
    const sh = shell(container); let stop = () => {};
    const WW = 600, WH = 1500, HARBOR = 1300;
    const GATES = [{ x: 300, y: 1180 }, { x: 380, y: 1000 }, { x: 250, y: 810 }, { x: 340, y: 620 }], GW = 120;
    const ROCKS = [{ x: 110, y: 1060, r: 34 }, { x: 520, y: 880, r: 38 }, { x: 120, y: 690, r: 30 }, { x: 500, y: 560, r: 34 }, { x: 160, y: 420, r: 26 }, { x: 470, y: 300, r: 30 }];
    const POINT = { x: 300, y: 250, r: 48 }, SLOT = { x: 262, y: 1405, w: 76, h: 80 };
    function intro() {
      stop(); sh.res.style.display = 'none';
      const best = LS.get('game.boat', 0);
      sh.body.innerHTML = `<div style="${CARD}"><b style="font-size:16px">🚤 선장 되기 · 출항에서 접안까지</b>${best ? ` · 최고 <b>${best}점</b>` : ''}
        <ol style="margin:6px 0 0;padding-left:20px;font-size:13.5px"><li>항구 안에서는 <b>5노트 이하</b>로 천천히 나가요.</li><li>항로 부표 <b>빨강·초록 사이</b>를 차례로 지나요. 바다로 나갈 때 <b style="color:#FF6B5B">빨간 부표는 왼쪽</b>(돌아올 땐 오른쪽 — 우리나라 방식).</li>
        <li>★ 낚시 포인트 안에서 <b>거의 멈추면</b>(1노트 이하 2초) 도착!</li><li>항구로 돌아와 처음 칸에 <b>천천히</b> 대면(접안) 끝. 바위·다른 배에 부딪히면 선체 ❤가 줄어요.</li></ol>
        <div style="font-size:12.5px;opacity:.85;margin-top:4px">조작: ◀ ▶ 키(누르고 있기) · ▲ 엔진 올리기 · ▼ 엔진 내리기/후진 — PC는 방향키·WASD</div></div>
        <button type="button" data-go style="${PRIMARY};width:100%;margin-top:8px">⚓ 출항</button>`;
      sh.body.querySelector('[data-go]').onclick = run;
    }
    function run() {
      stop(); sh.res.style.display = 'none';
      sh.body.innerHTML = `<div style="display:flex;justify-content:space-between;font-weight:700;font-size:14px"><span data-t></span><span data-spd></span><span data-hp></span></div>
        <canvas style="width:100%;aspect-ratio:1/1;max-width:min(100%,52vh);margin:4px auto;border-radius:14px;display:block;touch-action:none;background:#0B4D72" aria-label="배 운전 화면"></canvas>
        <div data-msg style="min-height:40px;font-size:14px;line-height:1.4;text-align:center"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px"><button type="button" data-k="l" style="${SOFT};touch-action:none">◀ 키</button><button type="button" data-e="-1" style="${SOFT}">▼ 엔진</button><button type="button" data-e="1" style="${PRIMARY}">▲ 엔진</button><button type="button" data-k="r" style="${SOFT};touch-action:none">키 ▶</button></div>`;
      const cv = sh.body.querySelector('canvas'), C = square(cv), g = C.g, q = s => sh.body.querySelector(s);
      const others = [{ x: 100, y: 900, v: 45 }, { x: 480, y: 460, v: -40 }];
      const s = { x: 300, y: 1445, h: -Math.PI / 2, v: 0, eng: 0, rud: 0, hp: 100, t: 0, phase: 0, gate: 0, stopT: 0, dockT: 0, hitCd: 0, pen: 0, msg: '', msgT: 0, wind: 0, gatesOk: 0, back: 0 };
      let alive = true, raf = 0, last = 0, keyL = false, keyR = false;
      const say = (t, sec) => { s.msg = t; s.msgT = sec || 2; };
      const ENG = ['⏪ 후진', '⏸ 정지', '① 미속', '② 저속', '③ 중속', '④ 전속'];
      function cross(ax, ay, bx, by, cx, cy, dx, dy) { const d = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx); if (!d) return false; const u = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / d, w = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / d; return u >= 0 && u <= 1 && w >= 0 && w <= 1; }
      function hit(why) { if (s.hitCd > 0) return; s.hp -= 15; s.hitCd = 1; s.v = -s.v * .3; s.eng = 1; say(`💥 ${why}! 선체 −15 · 엔진을 정지했어요`, 2.2); sfx('miss'); buzz('miss'); }
      function step(dt) {
        s.t += dt; s.msgT -= dt; s.hitCd -= dt; s.wind = Math.sin(s.t / 9) * 14;
        const target = (s.eng - 1) * 28; s.v += clamp(target - s.v, -30 * dt, 22 * dt);
        const rud = (keyR ? 1 : 0) - (keyL ? 1 : 0); s.h += rud * 1.5 * dt * clamp(Math.abs(s.v) / 35, .15, 1) * Math.sign(s.v || 1);
        const px = s.x, py = s.y, drift = s.y < HARBOR ? 1 : .25;
        s.x += Math.cos(s.h) * s.v * dt + s.wind * drift * dt; s.y += Math.sin(s.h) * s.v * dt;
        others.forEach(o => { o.x += o.v * dt; if (o.x < 60 || o.x > WW - 60) o.v *= -1; if (Math.hypot(o.x - s.x, o.y - s.y) < 34) hit('다른 배와 부딪혔어요'); });
        // 테두리·방파제
        if (s.x < 14 || s.x > WW - 14 || s.y < 14 || s.y > WH - 10) { s.x = clamp(s.x, 14, WW - 14); s.y = clamp(s.y, 14, WH - 10); hit('육지에 닿았어요'); }
        if (s.y > HARBOR - 12 && s.y < HARBOR + 26 && (s.x < 240 || s.x > 360)) { s.x = px; s.y = py; hit('방파제에 부딪혔어요'); }
        ROCKS.forEach(r => { const d = Math.hypot(r.x - s.x, r.y - s.y); if (d < r.r + 12) { s.x = r.x + (s.x - r.x) / d * (r.r + 13); s.y = r.y + (s.y - r.y) / d * (r.r + 13); hit('암초에 부딪혔어요'); } });
        const kn = Math.abs(s.v) / 10;
        if (s.y > HARBOR && kn > 5.2) { s.pen += dt * 10; if (s.msgT <= 0) say('⚠ 항구 안 속도 제한 5노트! 엔진을 낮춰요', 1.5); }
        // 미션
        if (s.phase === 0 && s.y < HARBOR - 20) { s.phase = 1; say('✅ 출항! 이제 항로 부표 사이로 — 빨간 부표를 왼쪽에 두고', 2.5); sfx('hit'); }
        if (s.phase === 1) {
          const G = GATES[s.gate];
          if (cross(px, py, s.x, s.y, G.x - GW / 2, G.y, G.x + GW / 2, G.y) && py > s.y) { s.gate++; s.gatesOk++; say(`✅ 부표 ${s.gate}/${GATES.length} 통과`, 1.4); sfx('hit'); if (s.gate >= GATES.length) { s.phase = 2; say('✅ 항로 끝! ★ 포인트로 가서 거의 멈춰요(1노트 이하)', 2.5); } }
          else if (s.y < G.y - 20) { s.gate++; s.pen += 40; say(`⚠ 부표 ${s.gate} 바깥으로 지나갔어요(−40). 항로를 지켜요`, 2); if (s.gate >= GATES.length) s.phase = 2; }
          GATES.forEach(G2 => [G2.x - GW / 2, G2.x + GW / 2].forEach(bx => { if (Math.hypot(bx - s.x, G2.y - s.y) < 16) hit('부표에 부딪혔어요'); }));
        }
        if (s.phase === 2) { if (Math.hypot(POINT.x - s.x, POINT.y - s.y) < POINT.r && kn <= 1) { s.stopT += dt; if (s.stopT > 2) { s.phase = 3; say('🎣 포인트 도착! 낚시 준비 끝 — 이제 항구로 돌아가요(빨간 부표는 오른쪽)', 3); sfx('win'); buzz('win'); } } else s.stopT = 0; }
        if (s.phase === 3 && s.y > HARBOR + 30) { s.phase = 4; say('⚓ 항구 안! 처음 칸에 천천히 대요(5노트 이하)', 2.5); }
        if (s.phase === 4) {
          const inSlot = s.x > SLOT.x && s.x < SLOT.x + SLOT.w && s.y > SLOT.y && s.y < SLOT.y + SLOT.h;
          if (inSlot && kn <= 1.2) { s.dockT += dt; if (s.dockT > 1.5) { s.phase = 5; } } else s.dockT = 0;
          if (inSlot && kn > 3 && s.hitCd <= 0) hit('접안이 너무 빨라요(쿵!)');
        }
      }
      function draw() {
        const W = C.W, H = C.H, sc = W / 340, camX = clamp(s.x - 170, 0, WW - 340), camY = clamp(s.y - 200, 0, WH - 340);
        g.save(); g.fillStyle = '#0B5E86'; g.fillRect(0, 0, W, H); g.scale(sc, sc); g.translate(-camX, -camY);
        g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 2; for (let y = Math.floor(camY / 40) * 40; y < camY + 360; y += 40) { g.beginPath(); for (let x = camX; x < camX + 360; x += 20) g.lineTo(x, y + Math.sin(x / 25 + s.t) * 3); g.stroke(); }
        // 항구
        g.fillStyle = '#2E86A8'; g.fillRect(0, HARBOR, WW, WH - HARBOR); g.fillStyle = '#8A8F96'; g.fillRect(0, HARBOR, 240, 24); g.fillRect(360, HARBOR, 240, 24); g.fillStyle = '#C9A26B'; g.fillRect(0, WH - 12, WW, 12);
        g.fillStyle = '#FFE27A'; g.font = '700 11px sans-serif'; g.textAlign = 'center'; g.fillText('항구 안 5노트 이하', 300, HARBOR + 46);
        g.strokeStyle = s.phase === 4 ? '#FFE27A' : 'rgba(255,255,255,.6)'; g.setLineDash([6, 4]); g.lineWidth = 2; g.strokeRect(SLOT.x, SLOT.y, SLOT.w, SLOT.h); g.setLineDash([]); g.fillStyle = '#FFF'; g.fillText('접안 칸', SLOT.x + SLOT.w / 2, SLOT.y + SLOT.h - 6);
        [120, 480].forEach(x => { g.fillStyle = '#DDE3E8'; g.fillRect(x - 14, 1400, 28, 60); });
        // 부표
        GATES.forEach((G, i) => { const next = s.phase === 1 && i === s.gate; g.fillStyle = '#E53935'; g.beginPath(); g.arc(G.x - GW / 2, G.y, 9, 0, 7); g.fill(); g.fillStyle = '#2E9E4F'; g.beginPath(); g.arc(G.x + GW / 2, G.y, 9, 0, 7); g.fill();
          if (next) { g.strokeStyle = '#FFE27A'; g.setLineDash([5, 5]); g.beginPath(); g.moveTo(G.x - GW / 2 + 10, G.y); g.lineTo(G.x + GW / 2 - 10, G.y); g.stroke(); g.setLineDash([]); } g.fillStyle = '#FFF'; g.fillText(String(i + 1), G.x, G.y + 4); });
        ROCKS.forEach(r => { g.fillStyle = '#4A4038'; g.beginPath(); g.arc(r.x, r.y, r.r, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(r.x, r.y, r.r + 5, 0, 7); g.stroke(); });
        g.strokeStyle = s.phase === 2 ? '#FFE27A' : 'rgba(255,226,122,.45)'; g.lineWidth = 3; g.beginPath(); g.arc(POINT.x, POINT.y, POINT.r, 0, 7); g.stroke(); g.font = '22px system-ui, "Segoe UI Emoji"'; g.fillText('★', POINT.x, POINT.y + 8); g.font = '700 11px sans-serif'; g.fillStyle = '#FFE27A'; g.fillText('낚시 포인트', POINT.x, POINT.y - POINT.r - 6);
        others.forEach(o => { g.save(); g.translate(o.x, o.y); g.rotate(o.v > 0 ? 0 : Math.PI); g.fillStyle = '#F4C542'; g.beginPath(); g.moveTo(18, 0); g.lineTo(-14, -9); g.lineTo(-14, 9); g.fill(); g.restore(); });
        // 내 배
        g.save(); g.translate(s.x, s.y); g.rotate(s.h);
        if (Math.abs(s.v) > 8) { g.strokeStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.moveTo(-14, -6); g.lineTo(-30, -14); g.moveTo(-14, 6); g.lineTo(-30, 14); g.stroke(); }
        g.fillStyle = '#FFFFFF'; g.beginPath(); g.moveTo(20, 0); g.quadraticCurveTo(8, -10, -14, -9); g.lineTo(-14, 9); g.quadraticCurveTo(8, 10, 20, 0); g.fill(); g.fillStyle = '#C0392B'; g.fillRect(-14, -9, 4, 18); g.fillStyle = '#7FB8D8'; g.fillRect(-4, -5, 10, 10);
        g.restore(); g.restore();
        // 바람·다음 목표 화살표
        g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(6, 6, 108, 22); g.fillStyle = '#FFF'; g.font = '700 12px sans-serif'; g.textAlign = 'left'; g.fillText(`🌬 바람 ${s.wind > 0 ? '→' : '←'} ${Math.abs(s.wind / 4).toFixed(1)}m/s`, 10, 21);
        const tgt = s.phase === 0 ? { x: 300, y: HARBOR - 30 } : s.phase === 1 ? GATES[s.gate] : s.phase === 2 ? POINT : s.phase === 3 ? { x: 300, y: HARBOR + 40 } : { x: SLOT.x + SLOT.w / 2, y: SLOT.y + SLOT.h / 2 };
        if (tgt) { const a = Math.atan2(tgt.y - s.y, tgt.x - s.x), cx = W - 30, cy = 30; g.save(); g.translate(cx, cy); g.rotate(a); g.fillStyle = '#FFE27A'; g.beginPath(); g.moveTo(14, 0); g.lineTo(-8, -8); g.lineTo(-4, 0); g.lineTo(-8, 8); g.fill(); g.restore(); }
        const kn = Math.abs(s.v) / 10;
        q('[data-t]').textContent = `⏱ ${Math.floor(s.t)}초`; q('[data-spd]').textContent = `${kn.toFixed(1)}노트 · ${ENG[s.eng]}`; q('[data-hp]').textContent = `선체 ❤${Math.max(0, s.hp)}`;
        q('[data-msg]').textContent = s.msgT > 0 ? s.msg : ['⬆ 천천히 항구 밖으로(5노트 이하)', `⬆ 부표 ${s.gate + 1}번: 빨강(왼쪽)·초록(오른쪽) 사이로`, '★ 포인트 원 안에서 엔진 정지 → 1노트 이하로', '⬇ 항구로 돌아가요(빨간 부표는 오른쪽)', '⚓ 접안 칸에 천천히(1노트 이하로 1.5초)', ''][s.phase];
      }
      function frame(ts) {
        if (!alive) return; if (!cv.isConnected) { cleanup(); return; }
        const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts; step(dt); draw();
        if (s.phase === 5 || s.hp <= 0 || s.t > 240) { cleanup(); finish(); return; }
        raf = requestAnimationFrame(frame);
      }
      function finish() {
        const ok = s.phase === 5, score = ok ? Math.max(0, Math.round(300 + s.hp * 4 + Math.max(0, 200 - s.t) * 2 + s.gatesOk * 25 - s.pen)) : Math.round(s.phase * 40);
        const best = LS.get('game.boat', 0), nb = score > best; if (nb) LS.set('game.boat', score);
        const coins = Math.floor(score / 20);
        endBox(sh, `<b style="font-size:18px">${ok ? '⚓ 접안 성공!' : s.hp <= 0 ? '💥 배가 많이 상했어요' : '⏱ 시간이 다 됐어요'}</b> <b>${score}점</b>${nb ? ' 🏅 최고 기록' : ''} · ${Math.floor(s.t)}초 · 선체 ${Math.max(0, s.hp)} · 항로 ${s.gatesOk}/${GATES.length} · 🪙 +${coins}
          <br><span style="font-size:13px">💡 우리나라는 <b>바다에서 항구로 들어올 때 빨간 부표가 오른쪽</b>(나갈 땐 왼쪽)이에요. 배는 브레이크가 없어서 멈추려면 미리 엔진을 줄여야 해요. 실제 배 운전은 면허가 필요해요.</span>`, run, onReward, { game: 'boatdrive', score, coins });
        sfx(ok ? 'win' : 'miss');
      }
      const hold = (b, set) => { b.addEventListener('pointerdown', e => { e.preventDefault(); set(true); }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(k => b.addEventListener(k, () => set(false))); b.addEventListener('contextmenu', e => e.preventDefault()); };
      hold(q('[data-k="l"]'), v => keyL = v); hold(q('[data-k="r"]'), v => keyR = v);
      const eng = d => { s.eng = clamp(s.eng + d, 0, 5); sfx('hit'); };
      sh.body.querySelectorAll('[data-e]').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); eng(+b.dataset.e); }));
      const kd = e => { if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; const c = e.code; if (/Arrow|Key[WASD]/.test(c)) e.preventDefault();
        if (c === 'ArrowLeft' || c === 'KeyA') keyL = true; if (c === 'ArrowRight' || c === 'KeyD') keyR = true; if (!e.repeat && (c === 'ArrowUp' || c === 'KeyW')) eng(1); if (!e.repeat && (c === 'ArrowDown' || c === 'KeyS')) eng(-1); };
      const ku = e => { if (e.code === 'ArrowLeft' || e.code === 'KeyA') keyL = false; if (e.code === 'ArrowRight' || e.code === 'KeyD') keyR = false; };
      document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
      function cleanup() { alive = false; cancelAnimationFrame(raf); if (C.ro) C.ro.disconnect(); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); }
      stop = cleanup; raf = requestAnimationFrame(frame);
    }
    intro();
    return { destroy: () => stop() };
  }

  const LIST = [
    { id: 'dirgame', ic: '🧭', name: '선장님 방향 지시', desc: '[휴대폰 밀기] 선장님 지시만 따라 배를 움직여요 · 좌현·우현·선수·선미 · 반대로!', goal: 300, mount: dirGame },
    { id: 'garden', ic: '🌱', name: '나의 텃밭 온실', desc: '먹고 싶은 밥상을 고르고 작물을 키워요 · 계절·온실·물·벌레', goal: 200, mount: gardenGame },
    { id: 'seafarm', ic: '🐟', name: '우리 바다 양식장', desc: '서해·남해·동해·제주 수온에 맞는 어종 키우기 · 고수온·적조·태풍 대비', goal: 100, mount: farmGame },
    { id: 'boatdrive', ic: '🚤', name: '선장 되기(배 운전)', desc: '출항 → 항로 부표 → 포인트 → 귀항·접안 · 바람에 밀려요', goal: 700, mount: boatGame },
  ];
  if (window.GameHub) LIST.forEach(x => { if (GameHub.GNAME) GameHub.GNAME[x.id] = x.name; if (GameHub.GOAL) GameHub.GOAL[x.id] = x.goal; });
  window.PlayGames = { LIST, extra: onReward => LIST.map(x => ({ id: x.id, ic: x.ic, name: x.name, desc: x.desc, isNew: true, mount: el => x.mount(el, onReward) })) };
})();
