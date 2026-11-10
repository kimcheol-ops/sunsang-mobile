/* 요즘 유행 장르 신작 5종 — 물고기 떨구기(물리 합치기) · 채비 카드 원정(로그라이트 덱빌딩) · 선단 키우기(방치형) · 리듬 챔질 · 오늘의 물고기(매일 퍼즐)
 * (PC · 휴대폰 앱 · 조황 수첩 공용, games3.js(GameHub) 뒤에 로드. phone.js(PhoneKit)가 있으면 진동)
 * TrendGames.extra(onReward) → 게임 메뉴 항목 5개. 끝나면 onReward({ game, score, coins })
 * 결제·뽑기(가챠)·광고 없음. 진행 상황은 이 기기 localStorage에만 저장.
 */
(function () {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ri = n => Math.floor(Math.random() * n);
  const sfx = k => window.GameHub && GameHub.sfx && GameHub.sfx(k);
  const buzz = k => { try { window.PhoneKit && PhoneKit.buzz && PhoneKit.buzz(k); } catch (e) {} };
  const BTN = 'min-height:46px;border:0;border-radius:12px;font:700 15px inherit;cursor:pointer;touch-action:manipulation';
  const PRIMARY = BTN + ';background:#E2572B;color:#fff', SOFT = BTN + ';background:#2A4650;color:#E3EEF0';
  const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function shell(container) {
    container.innerHTML = `<div style="display:grid;gap:10px"><div data-body></div><div data-res style="display:none;padding:10px 12px;border-radius:10px;background:var(--sea-soft,#1F3A50);font-size:14.5px;line-height:1.6"></div></div>`;
    return { body: container.querySelector('[data-body]'), res: container.querySelector('[data-res]') };
  }
  function finish(sh, onReward, game, score, extra) {
    score = Math.max(0, Math.round(score)); const coins = Math.floor(score / 10);
    sh.res.style.display = 'block'; sh.res.innerHTML = `<b style="font-size:18px">${score}점</b> · 🪙 +${coins}${extra ? '<br>' + extra : ''}`;
    sfx(score > 0 ? 'win' : 'miss'); if (onReward) try { onReward({ game, score, coins }); } catch (e) {}
  }
  const again = (sh, label, fn) => { const b = document.createElement('button'); b.type = 'button'; b.style.cssText = PRIMARY + ';width:100%;margin-top:8px'; b.textContent = label; b.onclick = fn; sh.body.append(b); };

  // ═════════ 1. 물고기 떨구기: 같은 물고기가 닿으면 합쳐져 더 큰 물고기로(물리 합치기) ═════════
  const DROP = [['🦐', '새우'], ['🦀', '꽃게'], ['🐚', '소라'], ['🐟', '전어'], ['🐠', '볼락'], ['🦑', '갑오징어'], ['🐙', '문어'], ['🐡', '복어'], ['🐬', '상괭이'], ['🐋', '고래']];
  function dropMerge(container, onReward) {
    const sh = shell(container); let alive = true, raf = 0, ro = null;
    function start() {
      sh.res.style.display = 'none';
      sh.body.innerHTML = `<div style="display:flex;justify-content:space-between;font-weight:700"><span data-sc>점수 0</span><span data-nx>다음 🦐</span></div>
        <canvas style="width:100%;aspect-ratio:3/4;border-radius:14px;display:block;background:linear-gradient(#9FD8E6,#2A7C93);touch-action:none;cursor:pointer"></canvas>
        <div style="font-size:12.5px;opacity:.8">좌우로 움직여 놓을 자리를 고르고 손을 떼면 떨어집니다. 같은 물고기 둘이 닿으면 합쳐져요. 빨간 선 위로 넘쳐 쌓이면 끝!</div>`;
      const cv = sh.body.querySelector('canvas'), ctx = cv.getContext('2d'), scEl = sh.body.querySelector('[data-sc]'), nxEl = sh.body.querySelector('[data-nx]');
      let W = 0, H = 0; const size = () => { const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); W = r.width; H = W * 4 / 3; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
      ro = new ResizeObserver(size); ro.observe(cv); size();
      const R = t => W * (.045 + t * .021), LINE = () => H * .16;
      let balls = [], cur = ri(4), nxt = ri(4), aimX = .5, wait = 0, score = 0, over = false, overT = 0, best = 0, last = 0, pops = [];
      const setAim = e => { const r = cv.getBoundingClientRect(); aimX = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); };
      cv.onpointermove = setAim; cv.onpointerdown = e => { setAim(e); cv.setPointerCapture(e.pointerId); };
      cv.onpointerup = e => { setAim(e); if (over || wait > 0) return; const r = R(cur); balls.push({ x: Math.min(W - r, Math.max(r, aimX * W)), y: LINE() - r - 2, vx: 0, vy: 0, t: cur, age: 0 }); cur = nxt; nxt = ri(4); wait = .45; nxEl.textContent = '다음 ' + DROP[nxt][0]; sfx('hit'); };
      function step(dt) {
        const g = H * 1.6;
        for (const b of balls) { b.vy += g * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.age += dt; const r = R(b.t);
          if (b.x < r) { b.x = r; b.vx *= -.3; } if (b.x > W - r) { b.x = W - r; b.vx *= -.3; } if (b.y > H - r) { b.y = H - r; b.vy *= -.25; b.vx *= .96; } }
        for (let it = 0; it < 4; it++) for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) {
          const a = balls[i], b = balls[j]; if (a.dead || b.dead) continue; const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || .01, ov = R(a.t) + R(b.t) - d; if (ov <= 0) continue;
          if (a.t === b.t && a.t < DROP.length - 1) { a.dead = b.dead = true; const t = a.t + 1; balls.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, vx: 0, vy: -40, t, age: 1 }); score += (t + 1) * 10; best = Math.max(best, t); pops.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, t: .5 }); sfx(t >= 6 ? 'level' : 'hit'); buzz('hit'); continue; }
          const nx = dx / d, ny = dy / d, ma = R(a.t) ** 2, mb = R(b.t) ** 2, k = ov / (ma + mb);
          a.x -= nx * k * mb; a.y -= ny * k * mb; b.x += nx * k * ma; b.y += ny * k * ma;
          const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny; if (rv < 0) { const imp = -1.2 * rv / (1 / ma + 1 / mb); a.vx -= imp * nx / ma; a.vy -= imp * ny / ma; b.vx += imp * nx / mb; b.vy += imp * ny / mb; }
        }
        balls = balls.filter(b => !b.dead);
        const high = balls.some(b => b.age > 1.2 && b.y - R(b.t) < LINE() && Math.abs(b.vy) < 60);
        overT = high ? overT + dt : 0; if (overT > 1.5 && !over) { over = true; end(); }
        wait = Math.max(0, wait - dt); pops.forEach(p => p.t -= dt); pops = pops.filter(p => p.t > 0);
      }
      function draw() {
        ctx.clearRect(0, 0, W, H); ctx.strokeStyle = overT > 0 ? '#FF3B3B' : '#FF8A8D'; ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, LINE()); ctx.lineTo(W, LINE()); ctx.stroke(); ctx.setLineDash([]);
        if (!over && wait <= 0) { const r = R(cur), x = Math.min(W - r, Math.max(r, aimX * W)); ctx.globalAlpha = .35; ctx.fillStyle = '#fff'; ctx.fillRect(x - 1, LINE(), 2, H - LINE()); ctx.globalAlpha = 1; emoji(DROP[cur][0], x, LINE() - r - 2, r); }
        for (const b of balls) { const r = R(b.t); ctx.fillStyle = '#ffffff30'; ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, 7); ctx.fill(); emoji(DROP[b.t][0], b.x, b.y, r); }
        for (const p of pops) { ctx.strokeStyle = `rgba(255,255,255,${p.t * 2})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, (1 - p.t * 2) * W * .15 + 5, 0, 7); ctx.stroke(); }
        scEl.textContent = `점수 ${score} · 최고 ${DROP[best][0]}`;
      }
      function emoji(e, x, y, r) { ctx.font = `${r * 1.55}px system-ui, "Segoe UI Emoji"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e, x, y + r * .08); }
      function frame(ts) { if (!alive || !cv.isConnected) return cleanup(); const dt = Math.min(1 / 30, (ts - (last || ts)) / 1000); last = ts; if (!over) { step(dt / 2); step(dt / 2); } draw(); raf = requestAnimationFrame(frame); }
      function end() { finish(sh, onReward, 'dropmerge', score, `가장 큰 물고기 ${DROP[best][0]} ${DROP[best][1]}`); again(sh, '↻ 다시 떨구기', () => { cleanup(); alive = true; start(); }); }
      raf = requestAnimationFrame(frame);
    }
    function cleanup() { alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); }
    start();
  }

  // ═════════ 2. 채비 카드 원정: 채비 카드를 모아 덱을 만들고, 목표 점수를 넘겨 다음 어종으로(로그라이트) ═════════
  const CARDS = [
    { n: '봉돌 10호', t: '봉돌', c: 8 }, { n: '봉돌 20호', t: '봉돌', c: 12, fit: ['문어', '참돔'] }, { n: '봉돌 40호', t: '봉돌', c: 18, fit: ['우럭', '방어'] },
    { n: '에기 2.5호 주황', t: '에기', c: 15, fit: ['쭈꾸미', '갑오징어'] }, { n: '에기 3.0호 야광', t: '에기', c: 18, fit: ['갑오징어', '무늬오징어'] }, { n: '문어 애자', t: '에기', c: 20, fit: ['문어'] },
    { n: '생미끼 오징어살', t: '미끼', c: 14, fit: ['우럭', '광어'] }, { n: '웜 4인치', t: '미끼', c: 12, fit: ['광어'] }, { n: '타이라바 80g', t: '미끼', c: 22, fit: ['참돔'] }, { n: '메탈지그 200g', t: '미끼', c: 26, fit: ['방어'] },
    { n: '가지채비 2단', t: '채비', c: 6, m: 1 }, { n: '단차 채비', t: '채비', c: 6, m: 1, fit: ['갑오징어'] }, { n: '다운샷', t: '채비', c: 8, m: 1, fit: ['광어'] },
    { n: '기술: 고패질', t: '기술', c: 0, m: 2 }, { n: '기술: 스테이', t: '기술', c: 0, m: 2, fit: ['갑오징어', '문어'] }, { n: '기술: 빠른 챔질', t: '기술', c: 5, m: 1 }, { n: '물때 사리', t: '기술', c: 10, m: 1 },
  ];
  const STAGES = [['쭈꾸미', '🐙', 60], ['갑오징어', '🦑', 130], ['광어', '🐟', 230], ['문어', '🐙', 360], ['참돔', '🐠', 520], ['우럭', '🐟', 720], ['방어', '🐟', 1000]];
  function deckRun(container, onReward) {
    const sh = shell(container);
    let deck, stage, total, casts, discards, hand, pile, sel, roundScore, msg;
    const startDeck = () => [0, 0, 1, 3, 3, 6, 7, 10, 13, 15].map(i => Object.assign({ id: Math.random() }, CARDS[i]));
    function start() { deck = startDeck(); stage = 0; total = 0; sh.res.style.display = 'none'; round(); }
    function round() { casts = 3; discards = 2; roundScore = 0; pile = deck.slice().sort(() => Math.random() - .5); hand = []; sel = new Set(); msg = ''; drawUp(); render(); }
    function drawUp() { while (hand.length < 6 && pile.length) hand.push(pile.pop()); if (hand.length < 6 && !pile.length) { pile = deck.filter(c => !hand.includes(c)).sort(() => Math.random() - .5); while (hand.length < 6 && pile.length) hand.push(pile.pop()); } }
    function calc(cards) {
      const sp = STAGES[stage][0]; let chips = 0, mult = 1; const types = {}; const lines = [];
      cards.forEach(c => { chips += c.c; mult += c.m || 0; types[c.t] = (types[c.t] || 0) + 1; if (c.fit && c.fit.includes(sp)) { mult += 1; lines.push(`${c.n} ✓${sp}`); } });
      const kinds = Object.keys(types).length; if (kinds >= 3) { mult += 1; lines.push('채비 조합 3종 +1배'); } if (kinds >= 4) { mult += 1; lines.push('4종 +1배'); }
      Object.entries(types).forEach(([t, n]) => { if (n >= 2) { chips += n * 5; lines.push(`${t} ${n}장 +${n * 5}`); } });
      return { chips, mult, pts: chips * mult, lines };
    }
    function render() {
      const [sp, ic, goal] = STAGES[stage], picked = hand.filter(c => sel.has(c.id)), pv = calc(picked);
      sh.body.innerHTML = `<div style="padding:10px;border-radius:14px;background:linear-gradient(160deg,#163E55,#0A1E2C);color:#E3F2FF;display:grid;gap:8px">
        <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:17px">${ic} ${stage + 1}/${STAGES.length} ${sp}</b><span>목표 <b>${goal}</b> · 지금 <b style="color:#FFD34D">${roundScore}</b></span></div>
        <div style="height:8px;border-radius:4px;background:#ffffff22"><div style="height:100%;width:${Math.min(100, roundScore / goal * 100)}%;border-radius:4px;background:#FFD34D"></div></div>
        <div style="font-size:13px">🎣 남은 캐스팅 ${casts} · 🔁 버리기 ${discards} · 덱 ${deck.length}장 · 누적 ${total}점</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">${hand.map(c => { const on = sel.has(c.id), fit = c.fit && c.fit.includes(sp);
          return `<button type="button" data-c="${c.id}" style="min-height:84px;border-radius:12px;border:2px solid ${on ? '#FFD34D' : fit ? '#6FD3A4' : '#ffffff33'};background:${on ? '#4A3A10' : '#ffffff12'};color:#fff;font:600 13px inherit;cursor:pointer;padding:6px;transform:${on ? 'translateY(-4px)' : 'none'}">
            <div style="font-size:11px;opacity:.75">${esc(c.t)}</div><div>${esc(c.n)}</div><div style="font-size:12px;color:#9FE3C4">${c.c ? '+' + c.c : ''}${c.m ? ' ×+' + c.m : ''}</div>${fit ? '<div style="font-size:11px;color:#6FD3A4">✓ ' + sp + '에 잘 맞음</div>' : ''}</button>`; }).join('')}</div>
        <div style="font-size:13px;min-height:2.6em">${picked.length ? `선택 ${picked.length}/4 → <b>${pv.chips}</b> × <b>${pv.mult}</b> = <b style="color:#FFD34D">${pv.pts}점</b><br><span style="opacity:.8">${esc(pv.lines.join(' · '))}</span>` : '카드를 1~4장 골라 캐스팅하세요. 초록 테두리 = 지금 어종에 잘 맞는 채비(배수 +1).'}${msg ? `<br><b>${esc(msg)}</b>` : ''}</div>
        <div style="display:flex;gap:6px"><button type="button" data-play style="${PRIMARY};flex:2" ${picked.length ? '' : 'disabled'}>🎣 캐스팅</button><button type="button" data-disc style="${SOFT};flex:1" ${picked.length && discards ? '' : 'disabled'}>🔁 버리기</button></div></div>`;
      sh.body.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { const id = +b.dataset.c; if (sel.has(id)) sel.delete(id); else if (sel.size < 4) sel.add(id); sfx('tap'); render(); });
      sh.body.querySelector('[data-play]').onclick = play; sh.body.querySelector('[data-disc]').onclick = discard;
    }
    function discard() { hand = hand.filter(c => !sel.has(c.id)); sel.clear(); discards--; drawUp(); msg = ''; render(); }
    function play() {
      const picked = hand.filter(c => sel.has(c.id)), pv = calc(picked); roundScore += pv.pts; total += pv.pts; casts--; hand = hand.filter(c => !sel.has(c.id)); sel.clear(); drawUp(); sfx('hit'); buzz('hit');
      const goal = STAGES[stage][2];
      if (roundScore >= goal) { sfx('level'); stage++; if (stage >= STAGES.length) return finish(sh, onReward, 'deckrun', total, '🏆 모든 어종 완주!') || again(sh, '↻ 새 원정', start); return reward(); }
      if (casts <= 0) { finish(sh, onReward, 'deckrun', total, `${STAGES[stage][0]}에서 원정 끝 (${stage}종 성공)`); render(); sh.body.querySelectorAll('button').forEach(b => b.disabled = true); return again(sh, '↻ 새 원정', start); }
      msg = `+${pv.pts}점!`; render();
    }
    function reward() {   // 다음 어종 전에 새 카드 3장 중 1장(또는 1장 빼기)
      const opts = Array.from({ length: 3 }, () => CARDS[ri(CARDS.length)]), sp = STAGES[stage][0];
      sh.body.innerHTML = `<div style="padding:12px;border-radius:14px;background:#10283A;color:#E3F2FF;display:grid;gap:8px"><b>🎉 성공! 다음은 ${STAGES[stage][1]} ${sp} (목표 ${STAGES[stage][2]}) — 채비 카드 하나를 덱에 넣으세요</b>
        ${opts.map((c, i) => `<button type="button" data-pick="${i}" style="${SOFT};text-align:left;padding:8px 12px">${esc(c.t)} · <b>${esc(c.n)}</b> ${c.c ? '+' + c.c : ''}${c.m ? ' ×+' + c.m : ''}${c.fit ? ` <span style="color:#6FD3A4">(${c.fit.join('·')})</span>` : ''}</button>`).join('')}
        <button type="button" data-skip style="${SOFT}">덱에서 가장 약한 카드 1장 빼기</button></div>`;
      sh.body.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => { deck.push(Object.assign({ id: Math.random() }, opts[+b.dataset.pick])); round(); });
      sh.body.querySelector('[data-skip]').onclick = () => { deck.sort((a, b) => (a.c + (a.m || 0) * 10) - (b.c + (b.m || 0) * 10)); deck.shift(); round(); };
    }
    start();
  }

  // ═════════ 3. 선단 키우기: 배를 늘리면 꺼 둔 동안에도 물고기가 쌓임(방치형) ═════════
  const FLEET = [['🛶', '나룻배', 15, .2], ['🚤', '보트', 120, 1.5], ['⛵', '돛단배', 900, 9], ['🛥️', '낚시어선', 6000, 50], ['🚢', '선단 모선', 40000, 280], ['🛸', '우주 낚시선', 300000, 1800]];
  const fmt = n => n >= 1e9 ? (n / 1e9).toFixed(1) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e4 ? (n / 1e3).toFixed(1) + 'K' : n < 100 && n % 1 ? n.toFixed(1) : Math.floor(n).toLocaleString();
  function idleFleet(container, onReward) {
    const sh = shell(container), KEY = 'trend.idle';
    let s = LS.get(KEY, null) || { fish: 0, own: FLEET.map(() => 0), tap: 1, total: 0, last: Date.now(), paid: '' };
    const rate = () => FLEET.reduce((a, f, i) => a + f[3] * s.own[i], 0), cost = i => Math.ceil(FLEET[i][2] * 1.15 ** s.own[i]), tapCost = () => Math.ceil(50 * 2.2 ** (s.tap - 1));
    const away = Math.min(8 * 3600, (Date.now() - s.last) / 1000), offline = away > 60 ? rate() * away * .5 : 0;
    if (offline) { s.fish += offline; s.total += offline; }
    let timer = 0, note = offline ? `⏰ 자리를 비운 ${Math.round(away / 60)}분 동안 선단이 ${fmt(offline)}마리를 잡아 왔어요(절반 속도)` : '';
    function save() { s.last = Date.now(); LS.set(KEY, s); }
    function render() {
      const r = rate(), canPay = s.paid !== today() && s.total >= 100;
      sh.body.innerHTML = `<div style="padding:12px;border-radius:14px;background:linear-gradient(160deg,#0F4C5C,#082430);color:#E3F2FF;display:grid;gap:8px">
        <div style="text-align:center"><div style="font-size:13px;opacity:.8">잡은 물고기</div><div data-fish style="font:900 34px inherit;color:#FFD34D">${fmt(s.fish)}</div><div style="font-size:13px">초당 <b>${fmt(r)}</b>마리 · 누적 ${fmt(s.total)}</div></div>
        <button type="button" data-tap style="${PRIMARY};min-height:70px;font-size:20px">🎣 챔질! (+${s.tap})</button>
        ${FLEET.map((f, i) => `<button type="button" data-buy="${i}" style="${SOFT};display:flex;justify-content:space-between;align-items:center;padding:0 12px;opacity:${s.fish >= cost(i) ? 1 : .55}"><span>${f[0]} ${f[1]} <b>×${s.own[i]}</b> <span style="font-size:12px;opacity:.8">(초당 +${f[3]})</span></span><span>🐟 ${fmt(cost(i))}</span></button>`).join('')}
        <button type="button" data-up style="${SOFT};opacity:${s.fish >= tapCost() ? 1 : .55}">💪 챔질 힘 올리기 (+1) · 🐟 ${fmt(tapCost())}</button>
        <button type="button" data-pay style="${canPay ? PRIMARY : SOFT}" ${canPay ? '' : 'disabled'}>${s.paid === today() ? '✅ 오늘 정산 완료 — 내일 다시' : '🪙 오늘의 정산(하루 1번 · 누적 100마리부터)'}</button>
        <div style="font-size:12.5px;opacity:.85">${esc(note)}${note ? '<br>' : ''}앱을 꺼 둬도 최대 8시간까지 절반 속도로 잡아 옵니다. 진행은 이 기기에만 저장돼요.</div></div>`;
      sh.body.querySelector('[data-tap]').onclick = () => { s.fish += s.tap; s.total += s.tap; buzz('tap'); sfx('tap'); upd(); };
      sh.body.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { const i = +b.dataset.buy, c = cost(i); if (s.fish < c) return; s.fish -= c; s.own[i]++; sfx('level'); note = `${FLEET[i][0]} ${FLEET[i][1]} 출항!`; save(); render(); });
      sh.body.querySelector('[data-up]').onclick = () => { const c = tapCost(); if (s.fish < c) return; s.fish -= c; s.tap++; sfx('level'); save(); render(); };
      sh.body.querySelector('[data-pay]').onclick = () => { if (s.paid === today()) return; s.paid = today(); save(); const score = Math.round(Math.log10(Math.max(10, s.total)) * 60 + s.own.reduce((a, n, i) => a + n * (i + 1) * 4, 0)); finish(sh, onReward, 'idlefleet', score, `선단 ${s.own.reduce((a, b) => a + b, 0)}척 · 누적 ${fmt(s.total)}마리`); render(); };
    }
    function upd() { const el = sh.body.querySelector('[data-fish]'); if (el) el.textContent = fmt(s.fish); }
    let tick = 0;
    timer = setInterval(() => { if (!container.isConnected) { clearInterval(timer); save(); return; } const r = rate() / 5; s.fish += r; s.total += r; upd(); if (++tick % 25 === 0) { save(); render(); } }, 200);
    save(); render();
  }

  // ═════════ 4. 리듬 챔질: 내려오는 입질에 맞춰 3줄을 박자대로 톡! ═════════
  function rhythm(container, onReward) {
    const sh = shell(container); let raf = 0, alive = true, ac = null, ro = null;
    function start() {
      sh.res.style.display = 'none';
      sh.body.innerHTML = `<canvas style="width:100%;aspect-ratio:3/4;border-radius:14px;display:block;background:#071A26;touch-action:none"></canvas>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">${['◀ (J)', '▼ (K)', '▶ (L)'].map((l, i) => `<button type="button" data-l="${i}" style="${SOFT};min-height:64px;font-size:18px">${l}</button>`).join('')}</div>
        <div style="font-size:12.5px;opacity:.8">입질(🐟)이 아래 선에 닿을 때 그 줄 버튼을 누르세요. 퍼펙트가 이어지면 콤보 배수! 45초 한 곡.</div>`;
      const cv = sh.body.querySelector('canvas'), ctx = cv.getContext('2d');
      let W = 0, H = 0; const size = () => { const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); W = r.width; H = W * 4 / 3; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
      ro = new ResizeObserver(size); ro.observe(cv); size();
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; }
      const BPM = 104, beat = 60 / BPM, LEN = 45, FALL = 1.6, notes = [];
      for (let t = 2; t < LEN; t += beat / 2) { const b = Math.round(t / beat * 2); if (b % 2 === 0 || Math.random() < .25) { notes.push({ t, l: ri(3), hit: 0 }); if (b % 8 === 0 && Math.random() < .3) notes.push({ t, l: (notes[notes.length - 1].l + 1 + ri(2)) % 3, hit: 0 }); } }
      let t0 = performance.now() / 1000, score = 0, combo = 0, maxCombo = 0, perfect = 0, good = 0, miss = 0, flash = [0, 0, 0], label = '', labelT = 0, nextBeat = 0, ended = false;
      const now = () => performance.now() / 1000 - t0;
      function tone(f, d, v) { if (!ac) return; const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; o.type = 'triangle'; g.gain.setValueAtTime(v, ac.currentTime); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + d); o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + d); }
      function press(l) {
        const tn = now(); flash[l] = .15; let bestN = null, bd = 1;
        for (const n of notes) if (!n.hit && n.l === l) { const d = Math.abs(n.t - tn); if (d < bd) { bd = d; bestN = n; } }
        if (bestN && bd < .14) { bestN.hit = bd < .07 ? 2 : 1; combo++; maxCombo = Math.max(maxCombo, combo); const mul = 1 + Math.floor(combo / 10) * .5; score += Math.round((bd < .07 ? 100 : 50) * mul); bd < .07 ? perfect++ : good++; label = bd < .07 ? 'PERFECT!' : 'GOOD'; labelT = .5; tone([523, 659, 784][l], .12, .2); buzz('tap'); }
        else { combo = 0; label = '헛챔질'; labelT = .4; }
      }
      sh.body.querySelectorAll('[data-l]').forEach(b => b.onpointerdown = e => { e.preventDefault(); if (ac && ac.state === 'suspended') ac.resume(); press(+b.dataset.l); });
      const kd = e => { const l = { KeyJ: 0, ArrowLeft: 0, KeyK: 1, ArrowDown: 1, KeyL: 2, ArrowRight: 2 }[e.code]; if (l != null) { e.preventDefault(); press(l); } }; document.addEventListener('keydown', kd);
      function frame() {
        if (!alive || !cv.isConnected) { document.removeEventListener('keydown', kd); return cleanup(); }
        const tn = now(); while (nextBeat <= tn && nextBeat < LEN) { tone(nextBeat % (beat * 4) < .01 ? 110 : 165, .08, .12); nextBeat += beat; }
        for (const n of notes) if (!n.hit && tn - n.t > .14) { n.hit = -1; miss++; combo = 0; }
        ctx.clearRect(0, 0, W, H); const lw = W / 3, hitY = H * .86;
        for (let l = 0; l < 3; l++) { ctx.fillStyle = flash[l] > 0 ? '#2E6A85' : l % 2 ? '#0C2635' : '#0A2130'; ctx.fillRect(l * lw, 0, lw, H); flash[l] = Math.max(0, flash[l] - 1 / 60); }
        ctx.strokeStyle = '#FFD34D'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, hitY); ctx.lineTo(W, hitY); ctx.stroke();
        ctx.font = `${lw * .45}px system-ui, "Segoe UI Emoji"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (const n of notes) { if (n.hit) continue; const y = hitY - (n.t - tn) / FALL * hitY; if (y < -40 || y > H + 40) continue; ctx.fillText('🐟', n.l * lw + lw / 2, y); }
        ctx.fillStyle = '#fff'; ctx.font = '700 16px system-ui'; ctx.textAlign = 'left'; ctx.fillText(`점수 ${score}`, 10, 22); ctx.textAlign = 'right'; ctx.fillText(`콤보 ${combo}`, W - 10, 22);
        ctx.fillStyle = '#ffffff33'; ctx.fillRect(0, H - 4, W, 4); ctx.fillStyle = '#6FD3A4'; ctx.fillRect(0, H - 4, W * Math.min(1, tn / LEN), 4);
        if (labelT > 0) { labelT -= 1 / 60; ctx.globalAlpha = Math.min(1, labelT * 3); ctx.textAlign = 'center'; ctx.font = '900 28px system-ui'; ctx.fillStyle = label === '헛챔질' ? '#FF8A8D' : '#FFD34D'; ctx.fillText(label, W / 2, H * .45); ctx.globalAlpha = 1; }
        if (tn > LEN + 1 && !ended) { ended = true; document.removeEventListener('keydown', kd); finish(sh, onReward, 'rhythm', score / 10, `퍼펙트 ${perfect} · 굿 ${good} · 놓침 ${miss} · 최대 콤보 ${maxCombo}`); again(sh, '↻ 한 곡 더', () => { cleanup(); alive = true; start(); }); return; }
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
    }
    function cleanup() { alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); if (ac) { try { ac.close(); } catch (e) {} ac = null; } }
    start();
  }

  // ═════════ 5. 오늘의 물고기: 6번 안에 오늘의 정답 어종 맞히기(매일 같은 문제) ═════════
  // [이름, 대표 바다, 제철, 보통 크기(cm), 주로 낚는 법, 색]
  const FISH = [['쭈꾸미', '서해', '가을', 15, '선상', '갈색'], ['갑오징어', '서해', '가을', 25, '선상', '갈색'], ['문어', '동해', '여름', 60, '선상', '붉은색'], ['우럭', '서해', '봄', 35, '선상', '검은색'],
    ['광어', '서해', '봄', 50, '선상', '갈색'], ['참돔', '남해', '봄', 50, '선상', '붉은색'], ['감성돔', '남해', '겨울', 35, '갯바위', '은색'], ['농어', '서해', '여름', 60, '루어', '은색'], ['볼락', '남해', '겨울', 20, '방파제', '검은색'],
    ['갈치', '남해', '가을', 90, '선상', '은색'], ['한치', '제주', '여름', 25, '선상', '투명'], ['무늬오징어', '제주', '가을', 30, '루어', '투명'], ['방어', '제주', '겨울', 70, '선상', '은색'], ['고등어', '남해', '가을', 30, '방파제', '푸른색'],
    ['삼치', '남해', '가을', 60, '루어', '푸른색'], ['도다리', '남해', '봄', 30, '방파제', '갈색'], ['노래미', '동해', '겨울', 30, '방파제', '갈색'], ['가자미', '동해', '봄', 30, '선상', '갈색'], ['대구', '동해', '겨울', 70, '선상', '갈색'], ['전갱이', '남해', '여름', 25, '방파제', '은색']];
  const NEAR_SEA = { 서해: ['남해'], 남해: ['서해', '동해', '제주'], 동해: ['남해'], 제주: ['남해'] }, SEASONS = ['봄', '여름', '가을', '겨울'];
  function dailyFish(container, onReward) {
    const sh = shell(container), KEY = 'trend.daily', d = today();
    const hash = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
    let practice = false, ans, guesses, done;
    function setup(p) { practice = p; ans = practice ? FISH[ri(FISH.length)] : FISH[hash('sunsang-' + d) % FISH.length];
      const st = LS.get(KEY, {}); if (!practice && st.d === d) { guesses = st.g.map(n => FISH.find(f => f[0] === n)).filter(Boolean); done = st.done; } else { guesses = []; done = false; } render(); }
    function cmp(g) {
      const c = (ok, near) => ok ? '#2E8B57' : near ? '#B8860B' : '#3A4650';
      const sz = g[3] === ans[3] ? '=' : g[3] < ans[3] ? '⬆' : '⬇', szNear = Math.abs(g[3] - ans[3]) <= 10;
      const sIdx = SEASONS.indexOf(g[2]), aIdx = SEASONS.indexOf(ans[2]), sNear = Math.min((sIdx - aIdx + 4) % 4, (aIdx - sIdx + 4) % 4) === 1;
      return [[g[0], c(g[0] === ans[0])], [g[1], c(g[1] === ans[1], (NEAR_SEA[g[1]] || []).includes(ans[1]))], [g[2], c(g[2] === ans[2], sNear)], [g[3] + 'cm ' + sz, c(g[3] === ans[3], szNear)], [g[4], c(g[4] === ans[4])], [g[5], c(g[5] === ans[5])]];
    }
    function render() {
      const left = 6 - guesses.length, won = guesses.some(g => g[0] === ans[0]);
      sh.body.innerHTML = `<div style="padding:12px;border-radius:14px;background:#0E2433;color:#E3F2FF;display:grid;gap:8px">
        <div style="display:flex;justify-content:space-between"><b>${practice ? '🎯 연습 문제' : `📅 ${d} 오늘의 물고기`}</b><span>남은 기회 ${left}</span></div>
        <div style="display:grid;grid-template-columns:1.3fr repeat(5,1fr);gap:3px;font-size:11px;opacity:.75;text-align:center"><span>어종</span><span>바다</span><span>제철</span><span>크기</span><span>낚는 법</span><span>색</span></div>
        ${guesses.map(g => `<div style="display:grid;grid-template-columns:1.3fr repeat(5,1fr);gap:3px">${cmp(g).map(([t, bg]) => `<div style="background:${bg};border-radius:6px;padding:6px 2px;text-align:center;font:700 12px inherit">${esc(t)}</div>`).join('')}</div>`).join('')}
        ${done ? `<div style="text-align:center;font-size:16px">${won ? `🎉 정답 <b>${esc(ans[0])}</b>! ${guesses.length}번 만에` : `아쉬워요 — 정답: <b>${esc(ans[0])}</b>`}</div>
            <div style="display:flex;gap:6px">${practice ? '' : `<button type="button" data-share style="${SOFT};flex:1">📋 결과 복사(자랑하기)</button>`}<button type="button" data-prac style="${SOFT};flex:1">🎯 연습 문제</button></div>`
          : `<div style="display:flex;gap:6px"><select data-sel style="flex:1;min-height:46px;border-radius:10px;font:600 15px inherit">${FISH.filter(f => !guesses.includes(f)).map(f => `<option>${f[0]}</option>`).join('')}</select><button type="button" data-go style="${PRIMARY};padding:0 18px">맞히기</button></div>`}
        <div style="font-size:12px;opacity:.8">🟩 같음 · 🟨 가까움(이웃 바다·이웃 계절·크기 10cm 안) · ⬆⬇ 정답이 더 큼/작음. 매일 자정에 새 문제(모두 같은 문제)!</div></div>`;
      const go = sh.body.querySelector('[data-go]'); if (go) go.onclick = () => { const f = FISH.find(x => x[0] === sh.body.querySelector('[data-sel]').value); if (!f) return; guesses.push(f); sfx('tap');
        if (f[0] === ans[0] || guesses.length >= 6) { done = true; const win = f[0] === ans[0]; if (!practice) { LS.set(KEY, { d, g: guesses.map(x => x[0]), done }); finish(sh, onReward, 'dailyfish', win ? (7 - guesses.length) * 60 : 20, win ? '오늘 문제 정답!' : '내일 다시 도전!'); } else sfx(win ? 'win' : 'miss'); }
        else if (!practice) LS.set(KEY, { d, g: guesses.map(x => x[0]), done }); render(); };
      const sb = sh.body.querySelector('[data-share]'); if (sb) sb.onclick = async () => { const grid = guesses.map(g => cmp(g).slice(1).map(([, bg]) => bg === '#2E8B57' ? '🟩' : bg === '#B8860B' ? '🟨' : '⬛').join('')).join('\n');
        const txt = `🐟 오늘의 물고기 ${d} ${guesses.some(g => g[0] === ans[0]) ? guesses.length : 'X'}/6\n${grid}\n출조 관제 우주 프로`; try { await navigator.clipboard.writeText(txt); sb.textContent = '✅ 복사됨'; } catch (e) { prompt('복사하세요', txt); } };
      const pb = sh.body.querySelector('[data-prac]'); if (pb) pb.onclick = () => setup(true);
    }
    setup(false);
  }

  const LIST = [
    { id: 'dropmerge', ic: '🫧', name: '물고기 떨구기', desc: '[물리 합치기] 같은 물고기가 닿으면 더 큰 물고기로 — 새우에서 고래까지', goal: 400, mount: dropMerge },
    { id: 'deckrun', ic: '🃏', name: '채비 카드 원정', desc: '[로그라이트 덱빌딩] 채비 카드 조합으로 어종 7단계 돌파 · 매 판 새 카드', goal: 600, mount: deckRun },
    { id: 'idlefleet', ic: '🚢', name: '선단 키우기', desc: '[방치형] 꺼 둬도 잡아 오는 선단 · 하루 1번 정산', goal: 200, mount: idleFleet },
    { id: 'rhythm', ic: '🎵', name: '리듬 챔질', desc: '[리듬] 박자에 맞춰 3줄 챔질 · 콤보 배수 · 진동', goal: 300, mount: rhythm },
    { id: 'dailyfish', ic: '📅', name: '오늘의 물고기', desc: '[매일 퍼즐] 6번 안에 오늘의 어종 맞히기 · 결과 자랑하기', goal: 300, mount: dailyFish },
  ];
  if (window.GameHub) LIST.forEach(g => { if (GameHub.GNAME) GameHub.GNAME[g.id] = g.name; if (GameHub.GOAL) GameHub.GOAL[g.id] = g.goal; });
  window.TrendGames = { LIST, extra: onReward => LIST.map(g => ({ id: g.id, ic: g.ic, name: g.name, desc: g.desc, isNew: true, mount: el => g.mount(el, onReward) })) };
})();
