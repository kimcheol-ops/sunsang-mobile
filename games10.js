/* 🤿 바다 속 탐험 — 잠수부가 갯벌→암초→해초숲→깊은 바다를 헤엄치며 바다 생물 사진을 찍어 도감을 채우는 게임
 * (PC · 휴대폰 앱 · 조황 수첩 공용, games3.js(GameHub) 뒤에 로드. sea-data.js(SEA_DATA)가 있으면 그 도감 생물을 씀)
 * SeaGames.extra(onReward) → 게임 메뉴 항목. 끝나면 onReward({ game, score, coins })
 * 사진 찍은 생물은 localStorage 'sea.dex'(섬·바다 속 화면 도감과 같은 곳)에 도장. 결제·뽑기·광고 없음.
 */
(function () {
  'use strict';
  const sfx = k => window.GameHub && GameHub.sfx && GameHub.sfx(k);
  const buzz = k => { try { window.PhoneKit && PhoneKit.buzz && PhoneKit.buzz(k); } catch (e) {} };
  const BTN = 'min-height:46px;border:0;border-radius:12px;font:700 15px inherit;cursor:pointer;touch-action:manipulation';
  const PRIMARY = BTN + ';background:#E2572B;color:#fff', SOFT = BTN + ';background:#2A4650;color:#E3EEF0';
  const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  // 구역: 이름, 바다 색 위/아래, 바닥 높이(화면 비율), 산소 줄어드는 빠르기, 사는 층
  const ZONES = [
    { n: '갯벌·얕은 바다', c: ['#7FC6C2', '#4E9C8F'], floor: .62, o2: .5, layers: ['flat'] },
    { n: '암초·갯바위', c: ['#3FA3C4', '#1F6F8E'], floor: .74, o2: .8, layers: ['rock'] },
    { n: '해초숲·중층', c: ['#2A86B0', '#145378'], floor: .84, o2: 1.1, layers: ['mid', 'sur'] },
    { n: '깊은 바다', c: ['#164E7A', '#06182E'], floor: .93, o2: 1.6, layers: ['bot'] },
  ];
  const FALLBACK = [['🦀', '칠게', 'flat'], ['🐚', '바지락', 'flat'], ['🐟', '망둥어(문절망둑)', 'flat'], ['🦀', '민꽃게(돌게)', 'rock'], ['🐟', '조피볼락(우럭)', 'rock'], ['🐟', '감성돔', 'rock'], ['🦑', '참문어', 'rock'], ['🐟', '고등어', 'sur'], ['🐟', '부시리', 'sur'], ['🦑', '한치(창오징어)', 'mid'], ['🐟', '갈치', 'mid'], ['🐟', '넙치(광어)', 'bot'], ['🦀', '꽃게', 'bot'], ['🦑', '갑오징어', 'bot'], ['🐟', '대구', 'bot']];
  function pool() {
    const S = window.SEA_DATA && SEA_DATA.species;
    const list = S ? S.filter(s => s.kind !== 'etc' || s.name === '불가사리' || s.name === '해삼').map(s => [s.emo, s.name, s.layer]) : FALLBACK;
    return ZONES.map(z => list.filter(x => z.layers.includes(x[2])));
  }

  function dive(container, onReward) {
    let alive = true, raf = 0, ro = null;
    container.innerHTML = `<div style="display:grid;gap:8px"><div data-body></div><div data-res style="display:none;padding:10px 12px;border-radius:10px;background:var(--sea-soft,#1F3A50);font-size:14.5px;line-height:1.6"></div></div>`;
    const body = container.querySelector('[data-body]'), res = container.querySelector('[data-res]');
    function intro() {
      const got = LS.get('sea.dex', {}), n = Object.keys(got).length;
      res.style.display = 'none';
      body.innerHTML = `<div style="display:grid;gap:8px;line-height:1.6">
        <div style="font-size:15px">🧜 <b>물결이</b>: 안녕! 나는 바다지기 인어 물결이야. 바다 속 친구들 사진을 찍어서 도감을 채워 줄래?</div>
        <div style="font-size:13px;opacity:.85">· 화면을 누른 채 움직이면 잠수부가 따라가요(PC는 방향키·WASD).<br>· 생물 가까이에서 <b>📸 찍기</b>(스페이스) — 처음 찍는 생물은 큰 점수!<br>· 깊이 갈수록 산소가 빨리 줄어요. 위로 올라가 수면에 닿으면 산소가 차요.<br>· 🪼 해파리와 ⚠ 가시 있는 고기는 피하고, 🗑 바다 쓰레기는 주우면 점수.<br>· 지금까지 도장 <b>${n}</b>개</div>
        <button type="button" data-go style="${PRIMARY}">🤿 잠수 시작</button></div>`;
      body.querySelector('[data-go]').onclick = play;
    }
    function play() {
      res.style.display = 'none';
      body.innerHTML = `<div style="display:flex;justify-content:space-between;gap:6px;font-weight:700;font-size:13.5px;flex-wrap:wrap"><span data-sc>📸 0점</span><span data-zn></span><span data-o2></span></div>
        <canvas style="width:100%;aspect-ratio:4/3;border-radius:14px;display:block;touch-action:none;background:#145378"></canvas>
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:8px"><button type="button" data-shot style="${PRIMARY}">📸 찍기</button><button type="button" data-up style="${SOFT}">⬆ 귀환</button></div>
        <div data-say style="font-size:13px;min-height:20px;opacity:.9"></div>`;
      const cv = body.querySelector('canvas'), g = cv.getContext('2d'), scEl = body.querySelector('[data-sc]'), znEl = body.querySelector('[data-zn]'), o2El = body.querySelector('[data-o2]'), sayEl = body.querySelector('[data-say]');
      let W = 0, H = 0; const size = () => { const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); W = r.width || 480; H = W * .75; cv.width = W * d; cv.height = H * d; g.setTransform(d, 0, 0, d, 0, 0); };
      ro = new ResizeObserver(size); ro.observe(cv); size();
      const P = pool(), WORLD = 4; // 화면 4장 너비
      const dex = LS.get('sea.dex', {}), shotNow = {};
      const me = { x: .3, y: .12, vx: 0, vy: 0, face: 1 }; let camX = 0, o2 = 100, score = 0, t = 0, over = false, flash = 0, sayT = 0, hurt = 0, trash = 0, newOnes = 0;
      const mobs = [], items = [];
      ZONES.forEach((z, zi) => {
        const L = P[zi]; for (let i = 0; i < 9; i++) { const sp = L.length ? L[Math.floor(Math.random() * L.length)] : ['🐟', '물고기', 'mid'];
          const bottom = sp[2] === 'flat' || sp[2] === 'bot' || /게|조개|바지락|백합|동죽|맛조개|고둥|소라|전복|성게|해삼|불가사리/.test(sp[1]);
          mobs.push({ emo: sp[0], name: sp[1], x: zi + Math.random(), y: bottom ? z.floor - .04 : .2 + Math.random() * (z.floor - .3), vx: bottom ? (Math.random() - .5) * .01 : (Math.random() < .5 ? -1 : 1) * (.02 + Math.random() * .03), bottom, ph: Math.random() * 6, danger: /쏨뱅이|쑤기미|노랑가오리/.test(sp[1]) }); }
        for (let i = 0; i < 2 + zi; i++) mobs.push({ emo: '🪼', name: '해파리', x: zi + Math.random(), y: .25 + Math.random() * .4, vx: 0, jelly: true, ph: Math.random() * 6 });
        for (let i = 0; i < 3; i++) items.push({ x: zi + Math.random(), y: z.floor - .03, k: ['🥤', '🧴', '🎣', '🛍'][Math.floor(Math.random() * 4)] });
      });
      const floorAt = x => { const zi = Math.max(0, Math.min(3, Math.floor(x))), f = x - zi, a = ZONES[zi].floor, b = ZONES[Math.min(3, zi + 1)].floor; return a + (b - a) * Math.max(0, f - .7) / .3; };
      const say = (s, sec = 2.4) => { sayEl.textContent = s; sayT = sec; };
      say('🧜 물결이: 오른쪽으로 갈수록 깊어져! 산소 잘 보고~');
      // 조작
      let ptr = null; const keys = {};
      cv.addEventListener('pointerdown', e => { ptr = e; cv.setPointerCapture(e.pointerId); });
      cv.addEventListener('pointermove', e => { if (ptr) ptr = e; });
      const upP = () => { ptr = null; }; cv.addEventListener('pointerup', upP); cv.addEventListener('pointercancel', upP);
      const kd = e => { if (!alive) return; const k = e.key.toLowerCase(); if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'a', 'd', 'w', 's', ' '].includes(k)) { e.preventDefault(); if (k === ' ') shoot(); else keys[k] = true; } };
      const ku = e => { keys[e.key.toLowerCase()] = false; };
      window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
      function shoot() {
        if (over) return; flash = .25; sfx('tap');
        let best = null, bd = 1e9; const mx = me.x * W, my = me.y * H;
        mobs.forEach(m => { if (m.jelly) return; const d = Math.hypot((m.x - me.x) * W, (m.y - me.y) * H); if (d < bd) { bd = d; best = m; } });
        if (best && bd < W * .16) {
          const first = !dex[best.name], again = shotNow[best.name];
          const pts = first ? 50 : again ? 3 : 10; score += pts; shotNow[best.name] = (shotNow[best.name] || 0) + 1;
          if (first) { dex[best.name] = Date.now(); LS.set('sea.dex', Object.assign(LS.get('sea.dex', {}), { [best.name]: Date.now() })); newOnes++; buzz('ok'); sfx('win'); say(`✨ 새 도장! ${best.emo} ${best.name} +${pts}`); }
          else say(`📸 ${best.emo} ${best.name} +${pts}${again ? ' (같은 친구는 점수가 적어요)' : ''}`, 1.6);
          best.flee = 1.2;
        } else say('📸 너무 멀어요 — 더 가까이!', 1.2);
      }
      body.querySelector('[data-shot]').onclick = shoot;
      body.querySelector('[data-up]').onclick = () => end('⬆ 무사히 귀환!');
      function end(why) {
        if (over) return; over = true;
        const ob = score > 0 ? Math.round(o2 / 2) : 0, bonus = ob + trash * 5;
        const total = score + bonus, coins = Math.floor(total / 10);
        res.style.display = 'block';
        res.innerHTML = `<b style="font-size:18px">${total}점</b> · 🪙 +${coins}<br>${why} — 사진 ${score}점 · 새 도장 ${newOnes}개 · 쓰레기 ${trash}개(+${trash * 5}) · 남은 산소 보너스 +${ob}${score > 0 ? "" : "(사진을 찍어야 받아요)"}<br><span style="opacity:.8">🧜 물결이: 도감은 「섬 · 바다 속 → 바다 생물 도감」에서 볼 수 있어!</span>`;
        sfx(total > 0 ? 'win' : 'miss'); if (onReward) try { onReward({ game: 'seadive', score: total, coins }); } catch (e) {}
        const b = document.createElement('button'); b.type = 'button'; b.style.cssText = PRIMARY + ';width:100%'; b.textContent = '🤿 다시 잠수'; b.onclick = () => { cleanup(); play(); }; body.append(b);
      }
      let last = performance.now();
      function frame(now) {
        if (!alive) return; const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
        if (!over) {
          // 움직임
          let ax = 0, ay = 0;
          if (ptr) { const r = cv.getBoundingClientRect(); const tx = (ptr.clientX - r.left) / W, ty = (ptr.clientY - r.top) / H; ax = (tx + camX / W - me.x) * 3; ay = (ty - me.y) * 3; }
          if (keys.arrowleft || keys.a) ax = -1; if (keys.arrowright || keys.d) ax = 1; if (keys.arrowup || keys.w) ay = -1; if (keys.arrowdown || keys.s) ay = 1;
          const sp = .32; me.vx += (Math.max(-1, Math.min(1, ax)) * sp - me.vx) * dt * 4; me.vy += (Math.max(-1, Math.min(1, ay)) * sp * 1.3 - me.vy) * dt * 4;
          me.x = Math.max(.03, Math.min(WORLD - .03, me.x + me.vx * dt)); me.y = Math.max(.08, Math.min(floorAt(me.x) - .05, me.y + me.vy * dt));
          if (Math.abs(me.vx) > .02) me.face = me.vx > 0 ? 1 : -1;
          const zi = Math.max(0, Math.min(3, Math.floor(me.x))), z = ZONES[zi];
          // 산소: 수면(맨 위)이면 차고, 깊을수록 빨리 줆
          if (me.y < .11) { if (o2 < 100) { o2 = Math.min(100, o2 + dt * 40); if (o2 > 99) say('🫧 숨 가득!', 1); } }
          else o2 -= dt * (2.2 * z.o2 * (.6 + me.y));
          if (o2 < 25 && sayT <= 0) say('⚠ 산소가 부족해요! 위로 올라가세요', 1.5);
          if (o2 <= 0) { o2 = 0; end('🧜 산소가 다 떨어져 물결이가 구해 줬어요'); }
          if (t > 180) end('⏱ 3분 잠수 끝!');
          znEl.textContent = `📍 ${z.n}`; o2El.textContent = `🫧 산소 ${Math.round(o2)}%`; o2El.style.color = o2 < 25 ? '#FF8A8D' : '';
          scEl.textContent = `📸 ${score}점 · ✨${newOnes}`;
          // 생물
          mobs.forEach(m => {
            if (m.flee > 0) { m.flee -= dt; m.x += Math.sign(m.x - me.x || 1) * dt * .12; }
            else if (m.jelly) m.y += Math.sin(t + m.ph) * dt * .03;
            else { m.x += m.vx * dt; const zl = Math.floor(m.x0 == null ? (m.x0 = Math.floor(m.x)) : m.x0); if (m.x < zl || m.x > zl + 1) m.vx *= -1; }
            const d = Math.hypot((m.x - me.x) * W, (m.y - me.y) * H);
            if ((m.jelly || m.danger) && d < W * .05 && hurt <= 0) { hurt = 1.2; o2 -= m.jelly ? 12 : 8; buzz('bad'); sfx('miss'); say(m.jelly ? '🪼 해파리에 쏘였어요! 산소 -12' : `⚠ ${m.name} 가시! 산소 -8 (도감: 가시에 독)`); }
          });
          items.forEach(it => { if (!it.got && Math.hypot((it.x - me.x) * W, (it.y - me.y) * H) < W * .05) { it.got = 1; trash++; sfx('coin'); say(`🗑 바다 쓰레기 주움 +5 (물결이: 고마워!)`, 1.4); } });
          if (hurt > 0) hurt -= dt; if (sayT > 0) sayT -= dt; if (flash > 0) flash -= dt;
        }
        camX += ((me.x * W - W * .45) - camX) * .12; camX = Math.max(0, Math.min((WORLD - 1) * W, camX));
        // 그리기
        const zf = camX / W, zi0 = Math.floor(zf), zi1 = Math.min(3, zi0 + 1), f = zf - zi0;
        const mix = (a, b) => { const p = s => [1, 3, 5].map(i => parseInt(s.substr(i, 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * f)).join(',')})`; };
        const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, mix(ZONES[zi0].c[0], ZONES[zi1].c[0])); gr.addColorStop(1, mix(ZONES[zi0].c[1], ZONES[zi1].c[1]));
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
        // 수면
        g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(0, H * .08); for (let x = 0; x <= W; x += 10) g.lineTo(x, H * .08 + Math.sin((x + camX) / 24 + t * 2) * 3); g.lineTo(W, 0); g.lineTo(0, 0); g.fill();
        // 햇살(얕은 곳)
        g.globalAlpha = Math.max(0, .12 - zf * .04); g.fillStyle = '#fff'; for (let i = 0; i < 4; i++) { const x = ((i * W / 3 - camX * .3 + t * 10) % (W + 100)) - 50; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 30, 0); g.lineTo(x + 100, H); g.lineTo(x + 60, H); g.fill(); } g.globalAlpha = 1;
        // 바닥
        g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 6) g.lineTo(x, floorAt((x + camX) / W) * H); g.lineTo(W, H); g.closePath();
        g.fillStyle = zf < 1 ? '#7A6A55' : zf < 2 ? '#5C5A52' : '#3A3B3A'; g.fill();
        // 해초·바위
        for (let i = 0; i < WORLD * 6; i++) { const wx = i / 6 + .05, sx = wx * W - camX; if (sx < -30 || sx > W + 30) continue; const by = floorAt(wx) * H;
          if (wx > 1 && wx < 2) { g.fillStyle = '#4A4F55'; g.beginPath(); g.ellipse(sx, by, 22, 12, 0, Math.PI, 0); g.fill(); }
          else if (wx >= 2 && wx < 3) { g.strokeStyle = '#3FAF6A'; g.lineWidth = 4; g.beginPath(); g.moveTo(sx, by); g.quadraticCurveTo(sx + Math.sin(t + i) * 12, by - 40, sx + Math.sin(t * 1.3 + i) * 8, by - 70); g.stroke(); }
          else if (wx >= 3) { g.fillStyle = 'rgba(160,220,255,.12)'; g.beginPath(); g.arc(sx, by - 30 - Math.sin(t + i) * 10, 2, 0, 7); g.fill(); } }
        // 깊은 바다는 어둡게(손전등)
        if (zf > 2.3) { const a = Math.min(.6, (zf - 2.3) * .7); const lx = me.x * W - camX, ly = me.y * H; const rg = g.createRadialGradient(lx, ly, 20, lx, ly, W * .35); rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, `rgba(0,5,15,${a})`); g.fillStyle = rg; g.fillRect(0, 0, W, H); }
        g.textAlign = 'center'; g.textBaseline = 'middle';
        items.forEach(it => { if (it.got) return; const sx = it.x * W - camX; if (sx > -20 && sx < W + 20) { g.font = `${W * .045}px sans-serif`; g.fillText(it.k, sx, it.y * H); } });
        mobs.forEach(m => { const sx = m.x * W - camX; if (sx < -30 || sx > W + 30) return; const sy = m.y * H + (m.bottom ? 0 : Math.sin(t * 2 + m.ph) * 4);
          g.save(); g.translate(sx, sy); if (!m.jelly && m.vx > 0) g.scale(-1, 1); g.font = `${W * (m.jelly ? .05 : .06)}px sans-serif`; g.fillText(m.emo, 0, 0); g.restore();
          if (Math.hypot((m.x - me.x) * W, (m.y - me.y) * H) < W * .16 && !m.jelly) { g.font = `${Math.max(10, W * .026)}px sans-serif`; g.fillStyle = dex[m.name] ? 'rgba(255,255,255,.8)' : '#FFE08A'; g.fillText((dex[m.name] ? '' : '✨') + m.name.replace(/\(.*\)/, '') + (m.danger ? ' ⚠' : ''), sx, sy - W * .045); } });
        // 잠수부
        const px = me.x * W - camX, py = me.y * H;
        if (!(hurt > 0 && Math.floor(t * 10) % 2)) { g.save(); g.translate(px, py); g.scale(-me.face, 1); g.font = `${W * .075}px sans-serif`; g.fillText('🤿', 0, 0); g.restore(); }
        g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(px + me.face * 10, py - 14 - (t * 30 % 30), 2.5, 0, 7); g.fill();
        // 물결이(안내) — 처음 구역 위쪽에 둥실
        const mx = .55 * W - camX; if (mx > -40 && mx < W + 40) { g.font = `${W * .07}px sans-serif`; g.fillText('🧜', mx, H * .2 + Math.sin(t * 1.5) * 6); }
        // 깊이 표시
        g.textAlign = 'left'; g.font = '12px sans-serif'; g.fillStyle = 'rgba(255,255,255,.85)'; g.fillText(`수심 약 ${Math.round(me.y * (5 + me.x * 12))}m`, 8, H - 10);
        if (flash > 0) { g.fillStyle = `rgba(255,255,255,${flash * 2})`; g.fillRect(0, 0, W, H); }
        raf = requestAnimationFrame(frame);
      }
      function cleanup() { cancelAnimationFrame(raf); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); if (ro) ro.disconnect(); }
      container._seaCleanup = cleanup;
      raf = requestAnimationFrame(frame);
    }
    intro();
    // 메뉴로 나가면 멈춤
    const mo = new MutationObserver(() => { if (!container.isConnected || !container.contains(body)) { alive = false; container._seaCleanup && container._seaCleanup(); mo.disconnect(); } });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  const LIST = [{ id: 'seadive', ic: '🤿', name: '바다 속 탐험', desc: '[탐험·수집] 갯벌→암초→해초숲→깊은 바다 · 사진으로 도감 채우기 · 인어 물결이와 함께', goal: 300, mount: dive }];
  if (window.GameHub) LIST.forEach(g => { if (GameHub.GNAME) GameHub.GNAME[g.id] = g.name; if (GameHub.GOAL) GameHub.GOAL[g.id] = g.goal; });
  window.SeaGames = { LIST, extra: onReward => LIST.map(g => ({ id: g.id, ic: g.ic, name: g.name, desc: g.desc, isNew: true, mount: el => g.mount(el, onReward) })) };
})();
