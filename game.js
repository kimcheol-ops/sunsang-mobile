/* 한 수 더! — 선상낚시 미니게임 (SunsangHelper PC 앱과 휴대폰 '바다 조황 수첩'이 함께 쓰는 엔진)
 *
 * 조작: 큰 버튼 하나 — 누르고 있으면 채비 내리기 → 입질이 오면 짧게 눌러 챔질 → 누르고 있으면 감기(장력 조절).
 *       작은 버튼 '감아 올리기'로 채비를 띄웁니다. 키보드는 Space(큰 버튼)·↑(감아 올리기).
 * 규칙: 실제 금어기·금지체장을 게임에 넣었습니다(게임용 기준, 실제 출조 전에는 법령 확인).
 *       금어기 어종이나 금지체장 미만을 방생하면 보너스, 보관하면 감점.
 *
 * FishingGame.mount(container, { today, onEnd(result), colors }) → { start(), destroy() }
 */
(function () {
  'use strict';
  // 수심(m) 범위, 몸길이(cm), 금지체장(cm, 0=없음), 금어기 [월*100+일 시작, 끝], 점수, 힘, 제철(월)
  const SPECIES = [
    { name: '쭈꾸미', color: '#E3A21A', zone: [30, 40], size: [8, 22], min: 0, closed: [511, 831], pts: 10, power: .25, peak: [9, 10, 11] },
    { name: '갑오징어', color: '#B05CC4', zone: [28, 40], size: [15, 35], min: 0, closed: null, pts: 25, power: .45, peak: [4, 5, 9, 10, 11] },
    { name: '우럭', color: '#3C7FC0', zone: [25, 40], size: [15, 50], min: 23, closed: null, pts: 30, power: .55, peak: [3, 4, 5, 6, 9, 10, 11, 12] },
    { name: '광어', color: '#1D8A5B', zone: [33, 40], size: [18, 70], min: 21, closed: null, pts: 45, power: .7, peak: [4, 5, 9, 10, 11] },
    { name: '참돔', color: '#E2572B', zone: [18, 36], size: [18, 75], min: 24, closed: null, pts: 55, power: .8, peak: [5, 6, 9, 10, 11] },
    { name: '갈치', color: '#AEB9BF', zone: [10, 26], size: [12, 30], min: 18, closed: null, pts: 35, power: .5, peak: [7, 8, 9, 10, 11], unit: '항문장' },
    { name: '문어', color: '#C97A2F', zone: [34, 40], size: [300, 2500], min: 600, closed: [516, 630], pts: 60, power: .9, peak: [7, 8, 9, 10, 11], unit: 'g' },
    { name: '한치', color: '#1AA3A8', zone: [8, 22], size: [12, 30], min: 0, closed: null, pts: 20, power: .35, peak: [6, 7, 8] },
  ];
  const MAX_DEPTH = 40, ROUND_SEC = 90;
  const md = d => (d.getMonth() + 1) * 100 + d.getDate();
  const inClosed = (sp, d) => !!sp.closed && (() => { const c = md(d), [a, b] = sp.closed; return a <= b ? c >= a && c <= b : c >= a || c <= b; })();
  const rand = (a, b) => a + Math.random() * (b - a);

  function mount(container, opts) {
    opts = opts || {};
    const today = opts.today || new Date();
    const C = Object.assign({ sky: '#BFE3EA', sea0: '#2D8FA3', sea1: '#0B3540', bed: '#5E5040', ink: '#10262E', hud: '#FFFFFF', line: '#F2F2F2', warn: '#FFB020', bad: '#FF5A4A', ok: '#4BD08A' }, opts.colors || {});

    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;gap:8px;user-select:none;-webkit-user-select:none;touch-action:none';
    const cv = document.createElement('canvas');
    cv.style.cssText = 'width:100%;max-width:100%;aspect-ratio:4/5;border-radius:12px;display:block;background:' + C.sea1;
    cv.setAttribute('aria-label', '낚시 게임 화면');
    const bar = document.createElement('div');
    bar.style.cssText = 'display:grid;grid-template-columns:1fr 2fr;gap:8px';
    const up = document.createElement('button'); up.type = 'button'; up.textContent = '⤒ 감아 올리기';
    const main = document.createElement('button'); main.type = 'button'; main.textContent = '▶ 시작';
    [up, main].forEach(b => b.style.cssText = 'min-height:58px;border-radius:12px;border:0;font:700 17px inherit;cursor:pointer;touch-action:none');
    up.style.background = '#2A4650'; up.style.color = '#E3EEF0';
    main.style.background = '#E2572B'; main.style.color = '#fff';
    bar.append(up, main); wrap.append(cv, bar); container.append(wrap);
    const ctx = cv.getContext('2d');

    let W = 0, H = 0, raf = 0, last = 0, alive = true;
    const g = { state: 'ready', time: ROUND_SEC, score: 0, depth: 0, still: 0, fish: [], target: null, biteT: 0, T: 0, slack: 0, landed: null,
                msg: '큰 버튼을 누르면 시작합니다', msgT: 99, holdMain: false, holdUp: false, log: [], released: 0, warnings: 0, combo: 0 };

    function size() {
      const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.max(280, r.width); H = W * 1.25;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const seaTop = () => H * .16, yOf = d => seaTop() + d / MAX_DEPTH * (H * .80);

    // 제철·금어기에 맞춘 어종 비중(금어기 어종도 나오지만 방생해야 함)
    function pickSpecies() {
      const m = today.getMonth() + 1;
      const w = SPECIES.map(s => s.peak.includes(m) ? 3 : 1);
      let r = Math.random() * w.reduce((a, b) => a + b, 0);
      for (let i = 0; i < SPECIES.length; i++) if ((r -= w[i]) <= 0) return SPECIES[i];
      return SPECIES[0];
    }
    function spawn() {
      const sp = pickSpecies();
      return { sp, x: rand(.05, .95), d: rand(sp.zone[0], sp.zone[1]), vx: rand(.03, .08) * (Math.random() < .5 ? -1 : 1), wob: rand(0, 6) };
    }
    function say(t, sec) { g.msg = t; g.msgT = sec || 2.2; }

    function start() {
      Object.assign(g, { state: 'idle', time: ROUND_SEC, score: 0, depth: 0, still: 0, target: null, T: 0, slack: 0, landed: null, log: [], released: 0, warnings: 0, combo: 0 });
      g.fish = Array.from({ length: 9 }, spawn);
      say('버튼을 누르고 있으면 채비가 내려갑니다', 3);
      hideLanded();
    }

    // 잡은 고기 판정 카드
    const card = document.createElement('div');
    card.style.cssText = 'display:none;grid-template-columns:1fr 1fr;gap:8px;padding:12px;border-radius:12px;background:#12262D;color:#E3EEF0';
    const cardText = document.createElement('div'); cardText.style.cssText = 'grid-column:1/-1;font-size:15px;line-height:1.5';
    const keep = document.createElement('button'), rel = document.createElement('button');
    keep.textContent = '🧊 보관'; rel.textContent = '🌊 방생';
    [keep, rel].forEach(b => { b.type = 'button'; b.style.cssText = 'min-height:48px;border-radius:10px;border:0;font:700 16px inherit;cursor:pointer;background:#2A4650;color:#E3EEF0'; });
    card.append(cardText, keep, rel); wrap.insertBefore(card, bar);
    function showLanded(f) {
      const sp = f.sp, closed = inClosed(sp, today), small = sp.min > 0 && f.len < sp.min;
      f.illegal = closed || small;
      const unit = sp.unit === 'g' ? 'g' : 'cm';
      cardText.innerHTML = `<b style="font-size:18px;color:${sp.color}">${sp.name}</b> ${f.len}${unit}${sp.unit === '항문장' ? ' (항문장)' : ''}<br>` +
        (closed ? `<span style="color:${C.warn}">지금은 금어기입니다 (${String(sp.closed[0]).replace(/(\d+)(\d\d)$/, '$1/$2')}~${String(sp.closed[1]).replace(/(\d+)(\d\d)$/, '$1/$2')})</span>`
          : small ? `<span style="color:${C.warn}">금지체장 ${sp.min}${unit} 미만입니다</span>` : '<span style="opacity:.8">보관해도 되는 크기입니다</span>');
      card.style.display = 'grid'; bar.style.display = 'none';
    }
    function hideLanded() { card.style.display = 'none'; bar.style.display = 'grid'; }
    function judge(kept) {
      const f = g.landed; if (!f) return;
      let p;
      if (f.illegal && kept) { p = -50; g.warnings++; g.combo = 0; say('⚠ 해경 단속! 금어기·금지체장 고기는 방생해야 합니다 −50', 2.8); }
      else if (f.illegal) { p = 30; g.released++; say('🌊 바다 지킴이 보너스 +30', 2); }
      else if (kept) { g.combo++; p = Math.round(f.sp.pts * (0.6 + f.ratio) * (1 + Math.min(4, g.combo - 1) * .1)); say(`${f.sp.name} +${p}${g.combo > 1 ? ` (연속 ${g.combo})` : ''}`, 2); }
      else { p = 5; g.released++; say('방생 +5', 1.6); }
      g.score += p; g.log.push({ sp: f.sp.name, len: f.len, kept, illegal: f.illegal, pts: p });
      g.landed = null; g.state = g.time > 0 ? 'idle' : 'over'; hideLanded();
      if (g.state === 'over') finish();
    }
    keep.onclick = () => judge(true); rel.onclick = () => judge(false);

    function finish() {
      g.state = 'over'; main.textContent = '↻ 다시 하기';
      const kept = g.log.filter(l => l.kept && !l.illegal);
      const res = { score: g.score, catches: g.log.length, kept: kept.length, released: g.released, warnings: g.warnings,
                    best: kept.sort((a, b) => b.pts - a.pts)[0] || null, log: g.log.slice() };
      say(`끝! ${g.score}점`, 99);
      if (opts.onEnd) try { opts.onEnd(res); } catch (e) {}
    }

    function step(dt) {
      if (g.msgT < 50) g.msgT -= dt;
      g.fish.forEach(f => { if (f === g.target) return; f.x += f.vx * dt; f.wob += dt * 3; if (f.x < .03 || f.x > .97) f.vx *= -1; });
      if (g.state === 'ready' || g.state === 'over' || g.state === 'landed') return;
      g.time -= dt;
      if (g.time <= 0 && g.state !== 'fight') { g.time = 0; finish(); return; }
      if (g.state === 'idle' || g.state === 'wait') {
        const moving = g.holdMain || g.holdUp;
        if (g.holdMain) g.depth = Math.min(MAX_DEPTH, g.depth + 9 * dt);
        if (g.holdUp) g.depth = Math.max(0, g.depth - 7 * dt);
        g.still = moving ? 0 : g.still + dt;
        if (g.depth >= MAX_DEPTH - .1 && g.holdMain && g.msgT < .2) say('바닥에 닿았습니다 — 살짝 띄워 기다리세요', 1.5);
        g.state = g.depth > 0 ? 'wait' : 'idle';
        // 채비 근처(±3m, 가로 가운데 근처)에 고기가 있고 1~3초 가만히 있으면 입질
        if (g.state === 'wait' && g.still > 1) {
          const near = g.fish.filter(f => Math.abs(f.d - g.depth) < 4 && Math.abs(f.x - .5) < .35);
          if (near.length && Math.random() < dt * (0.6 + g.still * .25)) {
            g.target = near[Math.floor(Math.random() * near.length)];
            g.state = 'bite'; g.biteT = .75; main.textContent = '❗ 챔질!'; say('입질! 지금 눌러 챔질', .9);
          }
        }
      } else if (g.state === 'bite') {
        g.biteT -= dt;
        if (g.biteT <= 0) { say('놓쳤습니다… 다시 기다려 보세요', 1.6); escape(); }
      } else if (g.state === 'fight') {
        const f = g.target, p = f.sp.power;
        if (g.holdMain) { g.T += (.28 + p * .32) * dt; g.depth = Math.max(0, g.depth - (9 - p * 3) * (1 - g.T * .5) * dt); }
        else g.T -= .9 * dt;
        if (Math.random() < dt * (0.4 + p)) { g.T += rand(.04, .12) * p * 2; g.depth = Math.min(MAX_DEPTH, g.depth + p * 1.5); }   // 고기가 차고 나감
        g.T = Math.max(0, g.T);
        g.slack = g.T < .06 ? g.slack + dt : 0;
        f.d = g.depth; f.x = .5 + Math.sin(performance.now() / 180) * .02;
        if (g.T >= 1) { say('💥 줄이 터졌습니다! 감기를 잠깐 멈춰 장력을 낮추세요', 2.4); g.T = 0; lose(); }
        else if (g.slack > 2.2) { say('줄이 늘어져 빠졌습니다 — 계속 감아 주세요', 2); lose(); }
        else if (g.depth <= 0) land();
      }
    }
    function escape() { if (g.target) { g.target.vx = (Math.random() < .5 ? -1 : 1) * .15; } g.target = null; g.state = 'wait'; g.still = 0; main.textContent = '▼ 내리기 (누르기)'; }
    function lose() {
      const i = g.fish.indexOf(g.target); if (i >= 0) g.fish[i] = spawn();
      g.target = null; g.state = g.time > 0 ? 'wait' : 'over'; g.combo = 0; g.T = 0; main.textContent = '▼ 내리기 (누르기)';
      if (g.state === 'over') finish();
    }
    function land() {
      const f = g.target, sp = f.sp, ratio = Math.random();
      const len = Math.round(sp.size[0] + (sp.size[1] - sp.size[0]) * Math.pow(ratio, 1.3));
      const i = g.fish.indexOf(f); if (i >= 0) g.fish[i] = spawn();
      g.landed = { sp, len, ratio }; g.target = null; g.T = 0; g.state = 'landed'; g.depth = 0;
      main.textContent = '▼ 내리기 (누르기)'; showLanded(g.landed);
    }

    function draw() {
      const st = seaTop();
      const sky = ctx.createLinearGradient(0, 0, 0, st); sky.addColorStop(0, C.sky); sky.addColorStop(1, '#E8F4F6');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, st);
      const sea = ctx.createLinearGradient(0, st, 0, H); sea.addColorStop(0, C.sea0); sea.addColorStop(1, C.sea1);
      ctx.fillStyle = sea; ctx.fillRect(0, st, W, H - st);
      // 바닥
      ctx.fillStyle = C.bed; ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 20) ctx.lineTo(x, yOf(MAX_DEPTH) + 6 + Math.sin(x / 37) * 5);
      ctx.lineTo(W, H); ctx.fill();
      // 수심 눈금
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = '11px monospace';
      for (let d = 10; d <= MAX_DEPTH; d += 10) { const y = yOf(d); ctx.fillRect(0, y, 8, 1); ctx.fillText(d + 'm', 10, y + 4); }
      // 배
      const bx = W / 2, t = performance.now() / 600;
      ctx.save(); ctx.translate(bx, st + Math.sin(t) * 2);
      ctx.fillStyle = '#F4F1E8'; ctx.beginPath(); ctx.moveTo(-70, -6); ctx.lineTo(70, -6); ctx.lineTo(52, 12); ctx.lineTo(-56, 12); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#C8462A'; ctx.fillRect(-56, 6, 108, 4);
      ctx.fillStyle = '#E8E3D6'; ctx.fillRect(-22, -26, 34, 20);
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(30, -6); ctx.lineTo(58, -46); ctx.stroke();
      ctx.restore();
      // 고기
      g.fish.forEach(f => {
        const x = f.x * W, y = yOf(f.d) + Math.sin(f.wob) * 3, s = 9 + f.sp.power * 8, dir = f.vx >= 0 ? 1 : -1;
        ctx.fillStyle = f.sp.color; ctx.globalAlpha = f === g.target ? 1 : .8;
        ctx.beginPath(); ctx.ellipse(x, y, s * 1.6, s * .7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x - dir * s * 1.4, y); ctx.lineTo(x - dir * s * 2.4, y - s * .7); ctx.lineTo(x - dir * s * 2.4, y + s * .7); ctx.fill();
        ctx.globalAlpha = 1;
        if (Math.abs(f.d - g.depth) < 6 && g.depth > 0) { ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = '11px sans-serif'; ctx.fillText(f.sp.name, x - 14, y - s - 4); }
      });
      // 줄·채비
      const tipX = bx + 58, tipY = st - 46, ry = yOf(g.depth);
      ctx.strokeStyle = g.state === 'fight' ? (g.T > .8 ? C.bad : g.T > .55 ? C.warn : C.line) : C.line;
      ctx.lineWidth = g.state === 'fight' ? 1.5 + g.T * 2 : 1.2;
      const jig = g.state === 'bite' ? Math.sin(performance.now() / 40) * 4 : 0;
      ctx.beginPath(); ctx.moveTo(tipX, tipY + jig); ctx.lineTo(W / 2, ry); ctx.stroke();
      ctx.fillStyle = '#FFCF3A'; ctx.beginPath(); ctx.arc(W / 2, ry, 5, 0, Math.PI * 2); ctx.fill();
      // HUD
      ctx.fillStyle = 'rgba(16,38,46,.72)'; ctx.fillRect(0, 0, W, 34);
      ctx.fillStyle = C.hud; ctx.font = 'bold 15px sans-serif';
      ctx.fillText(`⏱ ${Math.ceil(g.time)}초`, 10, 22);
      ctx.fillText(`점수 ${g.score}`, W / 2 - 34, 22);
      ctx.fillText(`${g.depth.toFixed(1)}m`, W - 64, 22);
      if (g.state === 'fight') {
        const bw = W - 40; ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(20, H - 34, bw, 14);
        ctx.fillStyle = g.T > .8 ? C.bad : g.T > .55 ? C.warn : C.ok; ctx.fillRect(20, H - 34, bw * Math.min(1, g.T), 14);
        ctx.fillStyle = C.hud; ctx.font = '12px sans-serif'; ctx.fillText('장력 — 빨간색 전에 감기를 멈추세요', 22, H - 40);
      }
      if (g.msgT > 0) {
        ctx.font = 'bold 16px sans-serif'; const tw = Math.min(W - 20, ctx.measureText(g.msg).width + 24);
        ctx.fillStyle = 'rgba(16,38,46,.85)'; ctx.fillRect((W - tw) / 2, H * .42, tw, 34);
        ctx.fillStyle = C.hud; ctx.textAlign = 'center'; ctx.fillText(g.msg, W / 2, H * .42 + 22, W - 30); ctx.textAlign = 'start';
      }
    }

    function frame(ts) {
      if (!alive) return;
      const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts;
      step(dt); draw();
      raf = requestAnimationFrame(frame);
    }

    // 입력: 큰 버튼(누르기/떼기), 감아 올리기, 키보드
    function mainDown(e) {
      e && e.preventDefault();
      if (g.state === 'ready' || g.state === 'over') { start(); main.textContent = '▼ 내리기 (누르기)'; return; }
      if (g.state === 'bite') { g.state = 'fight'; g.T = .2; g.slack = 0; main.textContent = '⟳ 감기 (누르기)'; say(`걸었다! ${g.target.sp.name}일까?`, 1.2); return; }
      g.holdMain = true;
    }
    function mainUp() { g.holdMain = false; }
    main.addEventListener('pointerdown', mainDown);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => main.addEventListener(t, mainUp));
    up.addEventListener('pointerdown', e => { e.preventDefault(); if (g.state === 'wait' || g.state === 'idle') g.holdUp = true; });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => up.addEventListener(t, () => g.holdUp = false));
    const kd = e => { if (e.repeat) return; if (e.code === 'Space') { mainDown(e); } else if (e.code === 'ArrowUp') { e.preventDefault(); if (g.state === 'wait') g.holdUp = true; } };
    const ku = e => { if (e.code === 'Space') mainUp(); else if (e.code === 'ArrowUp') g.holdUp = false; };
    wrap.tabIndex = 0; wrap.addEventListener('keydown', kd); wrap.addEventListener('keyup', ku);
    const ro = new ResizeObserver(size); ro.observe(cv);
    size(); g.fish = Array.from({ length: 9 }, spawn); raf = requestAnimationFrame(frame);

    return {
      start,
      /** 상태 읽기(화면 표시·시험용) */
      peek: () => ({ state: g.state, time: g.time, score: g.score, depth: g.depth, T: g.T, fish: g.fish.map(f => ({ name: f.sp.name, d: f.d, x: f.x })) }),
      destroy() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); container.innerHTML = ''; },
    };
  }

  window.FishingGame = { mount, SPECIES, inClosed };
})();
