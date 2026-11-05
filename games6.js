/* 친환경 바다 사랑 3D 게임 5종 + 낚시점 장비 시스템 (SunsangHelper PC · 휴대폰 웹 · 모바일 앱 공용)
 *  - 🛥️ 선상낚시 3D 「새벽 출항」  - 🪨 갯바위 낚시 3D  - 🧰 낚시 장비 공방 3D  - 🤿 바다 정화 다이버 3D  - 🌿 바다숲 가꾸기 3D
 *  4D = 3D + 시간 흐름(새벽→한낮·밀물·계절)·날씨·입질 진동, 5D = 4D + 휴대폰 기울이기 조작(자이로). 진동·기울이기는 지원 기기에서만.
 *  낚시점 장비(낚싯대·릴·줄·바늘/에기·봉돌)는 코인으로 사서 장착하면 선상·갯바위 게임의 입질·줄 터짐·점수에 반영됩니다.
 *  Games3D.extra(onReward, ctx) — ctx: { store: {get,set}(게임 기록), wallet: {get,set}(코인) }. three.js r128 필요.
 */
(function () {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rnd = (a, b) => a + Math.random() * (b - a), ri = n => Math.floor(Math.random() * n), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sfx = k => window.GameHub && GameHub.sfx && GameHub.sfx(k);
  const BTN = 'min-height:46px;border:0;border-radius:12px;font:700 15px inherit;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none';
  const PRIMARY = BTN + ';background:#E2572B;color:#fff', SOFT = BTN + ';background:#2A4650;color:#E3EEF0', GREEN = BTN + ';background:#1D8A5B;color:#fff';

  // ═════════ 4D·5D 효과 ═════════
  const opt = { fx4: true, fx5: false };
  try { Object.assign(opt, JSON.parse(localStorage.getItem('g6.fx') || '{}')); } catch (e) {}
  const saveOpt = () => { try { localStorage.setItem('g6.fx', JSON.stringify(opt)); } catch (e) {} };
  const vib = p => { if (opt.fx4 && navigator.vibrate) try { navigator.vibrate(p); } catch (e) {} };
  const tilt = { x: 0, y: 0, ok: false };
  let tiltOn = false;
  async function enableTilt() {
    if (tiltOn) return tilt.ok;
    try { if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') { if (await DeviceOrientationEvent.requestPermission() !== 'granted') return false; } } catch (e) { return false; }
    window.addEventListener('deviceorientation', e => { if (e.gamma == null) return; tilt.ok = true; tilt.x = clamp(e.gamma / 25, -1, 1); tilt.y = clamp((e.beta - 45) / 25, -1, 1); });
    tiltOn = true; return true;
  }
  function fxBar(onChange) {
    const d = document.createElement('div');
    d.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:12.5px;margin-bottom:6px';
    const draw = () => {
      d.innerHTML = `<button type="button" data-f4 style="border:0;border-radius:999px;padding:5px 10px;cursor:pointer;font:700 12px inherit;background:${opt.fx4 ? '#6C5FD0' : '#0003'};color:#fff">4D ${opt.fx4 ? '켜짐' : '꺼짐'} · 시간·날씨·진동</button>
        <button type="button" data-f5 style="border:0;border-radius:999px;padding:5px 10px;cursor:pointer;font:700 12px inherit;background:${opt.fx5 ? '#E2572B' : '#0003'};color:#fff">5D ${opt.fx5 ? '켜짐' : '꺼짐'} · 기울여 조작</button>
        <span style="opacity:.7">${opt.fx5 && !tilt.ok ? '휴대폰을 기울여 보세요(지원 기기만)' : ''}</span>`;
      d.querySelector('[data-f4]').onclick = () => { opt.fx4 = !opt.fx4; saveOpt(); vib(40); draw(); onChange && onChange(); };
      d.querySelector('[data-f5]').onclick = async () => { opt.fx5 = !opt.fx5; if (opt.fx5) await enableTilt(); saveOpt(); draw(); onChange && onChange(); };
    };
    draw(); return d;
  }

  // ═════════ 공용 3D 도구 ═════════
  function stage3d(holder, aspect) {
    const THREE = window.THREE;
    const r = new THREE.WebGLRenderer({ antialias: true });
    r.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    holder.appendChild(r.domElement); r.domElement.style.cssText = 'display:block;width:100%;height:100%;border-radius:12px;touch-action:none';
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(55, aspect, .1, 900);
    const hemi = new THREE.HemisphereLight('#ffffff', '#224455', .7), sun = new THREE.DirectionalLight('#fff4dd', .8);
    sun.position.set(40, 80, 30); scene.add(hemi, sun);
    const resize = () => { const w = holder.clientWidth || 300, h = w / aspect; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    const ro = new ResizeObserver(resize); ro.observe(holder); resize();
    return { THREE, r, scene, cam, hemi, sun, dispose() { ro.disconnect(); r.dispose(); r.domElement.remove(); } };
  }
  function sea(THREE, scene, color, size, seg) {
    const geo = new THREE.PlaneGeometry(size, size, seg, seg); geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color, flatShading: true, transparent: true, opacity: .95 }));
    scene.add(mesh); const base = geo.attributes.position.array.slice();
    return { mesh, update(t, amp) { const p = geo.attributes.position.array; for (let i = 0; i < p.length; i += 3) p[i + 1] = (Math.sin(base[i] * .06 + t * 1.3) * .5 + Math.cos(base[i + 2] * .07 + t) * .4) * amp; geo.attributes.position.needsUpdate = true; } };
  }
  function fishMesh(THREE, color, s) {
    const g = new THREE.Group(), m = new THREE.MeshLambertMaterial({ color });
    const body = new THREE.Mesh(new THREE.SphereGeometry(.5 * s, 10, 8), m); body.scale.set(1.8, .8, .6); g.add(body);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(.4 * s, .7 * s, 4), m); tail.rotation.z = Math.PI / 2; tail.position.x = -1.1 * s; g.add(tail);
    return g;
  }
  function label(THREE, text, color) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
    x.fillStyle = '#0B3540cc'; x.fillRect(0, 8, 256, 48); x.fillStyle = color; x.fillRect(0, 8, 10, 48); x.fillStyle = '#fff'; x.font = 'bold 28px sans-serif'; x.fillText(text, 20, 43);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false })); s.scale.set(8, 2, 1); return s;
  }
  // 시각(시)에 따른 하늘색·밝기(4D 시간 흐름)
  function skyAt(h) {
    const stops = [[4, '#1B2A4A', .25], [6, '#F6A97A', .55], [8, '#9FD3E0', .8], [12, '#8CCBE8', .95], [17, '#F2B27A', .7], [19, '#3A2E5A', .35]];
    let a = stops[0], b = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) if (h >= stops[i][0] && h <= stops[i + 1][0]) { a = stops[i]; b = stops[i + 1]; break; }
    const k = b[0] === a[0] ? 0 : (h - a[0]) / (b[0] - a[0]);
    const lerp = (c1, c2) => { const p = s => [1, 3, 5].map(i => parseInt(s.substr(i, 2), 16)), x = p(c1), y = p(c2); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
    return { color: lerp(a[1], b[1]), light: a[2] + (b[2] - a[2]) * k };
  }
  function shell(container) {
    container.innerHTML = `<div style="display:grid;gap:8px"><div data-body></div><div data-res style="display:none;padding:10px 12px;border-radius:10px;background:var(--sea-soft,#1F3A50);font-size:14.5px;line-height:1.6"></div></div>`;
    return { body: container.querySelector('[data-body]'), res: container.querySelector('[data-res]') };
  }
  function finish(sh, onReward, game, score, extra, data) {
    score = Math.max(0, Math.round(score)); const coins = Math.floor(score / 10);
    sh.res.style.display = 'block'; sh.res.innerHTML = `<b style="font-size:18px">${score}점</b> · 🪙 +${coins}${extra ? '<br>' + extra : ''}`;
    sfx(score > 0 ? 'win' : 'miss'); vib([60, 40, 120]);
    if (onReward) try { onReward(Object.assign({ game, score, coins }, data || {})); } catch (e) {}
  }
  const no3d = sh => { sh.body.innerHTML = '<div style="padding:12px">3D 엔진(three.js)을 불러오지 못했습니다. 인터넷 연결을 확인하세요.</div>'; return { destroy() {} }; };
  const hud = () => `position:absolute;left:8px;right:8px;top:8px;color:#fff;font:700 13px sans-serif;text-shadow:0 1px 3px #000;display:grid;gap:4px;pointer-events:none`;

  // ═════════ 낚시점 장비 ═════════
  const TACKLE = {
    rod: { name: '낚싯대', items: [
      { id: 'rod-light', name: '라이트 선상대 1.8m', price: 0, power: 1, for: ['쭈꾸미', '갑오징어', '한치', '무늬오징어'] },
      { id: 'rod-mid', name: '타이라바·다운샷대 2.1m', price: 60, power: 2, for: ['참돔', '광어'] },
      { id: 'rod-heavy', name: '우럭·갈치 선상대 2.7m', price: 120, power: 3, for: ['우럭', '갈치', '문어'] },
      { id: 'rod-iso', name: '갯바위 찌낚싯대 5.3m', price: 80, power: 2, for: ['감성돔', '벵에돔', '볼락'] }] },
    reel: { name: '릴', items: [
      { id: 'reel-s', name: '소형 베이트릴', price: 0, drag: 1 }, { id: 'reel-m', name: '중형 베이트릴', price: 70, drag: 2 },
      { id: 'reel-spin', name: '스피닝릴 2500번', price: 60, drag: 2 }, { id: 'reel-e', name: '전동릴', price: 200, drag: 3 }] },
    line: { name: '줄', items: [
      { id: 'pe08', name: '합사 0.8호', price: 0, str: 1 }, { id: 'pe15', name: '합사 1.5호', price: 30, str: 2 },
      { id: 'pe3', name: '합사 3호', price: 60, str: 3 }, { id: 'ny3', name: '나일론 원줄 3호', price: 20, str: 2 }] },
    hook: { name: '바늘·에기', items: [
      { id: 'egi', name: '쭈꾸미·갑오징어 에기', price: 0, for: ['쭈꾸미', '갑오징어'] }, { id: 'egi-big', name: '문어 에기 3.5호', price: 40, for: ['문어'] },
      { id: 'tai', name: '타이라바 80g', price: 40, for: ['참돔'] }, { id: 'worm', name: '다운샷 웜', price: 30, for: ['광어'] },
      { id: 'card', name: '카드채비 + 미끼', price: 20, for: ['우럭', '갈치'] }, { id: 'ika', name: '이카메탈', price: 40, for: ['한치', '무늬오징어'] },
      { id: 'float', name: '찌 + 갯바위 바늘', price: 30, for: ['감성돔', '벵에돔', '볼락'] }] },
    sinker: { name: '봉돌', items: [
      { id: 'lead', name: '납 봉돌', price: 0, eco: false }, { id: 'tin', name: '친환경 주석 봉돌', price: 30, eco: true },
      { id: 'tungsten', name: '친환경 텅스텐 봉돌', price: 50, eco: true }] },
  };
  const DEFAULT_GEAR = { rod: 'rod-light', reel: 'reel-s', line: 'pe08', hook: 'egi', sinker: 'lead' };
  const item = (cat, id) => TACKLE[cat].items.find(x => x.id === id) || TACKLE[cat].items[0];
  function gearOf(ctx) { const t = ((ctx.store.get() || {}).tackle) || {}; return { owned: t.owned || Object.values(DEFAULT_GEAR), equip: Object.assign({}, DEFAULT_GEAR, t.equip || {}) }; }
  async function saveGear(ctx, g) { const st = ctx.store.get() || {}; st.tackle = { owned: g.owned, equip: g.equip }; await ctx.store.set(st); }
  /** 장비 궁합: 입질 배율 · 줄 터짐 확률 · 점수 배율 · 안내 */
  function compat(equip, sp, power) {
    const rod = item('rod', equip.rod), reel = item('reel', equip.reel), line = item('line', equip.line), hook = item('hook', equip.hook), sk = item('sinker', equip.sinker);
    const rodOk = rod.for.includes(sp), hookOk = hook.for.includes(sp);
    const bite = (hookOk ? 1 : .25) * (rodOk ? 1 : .7);
    const brk = clamp(.05 + Math.max(0, power - line.str) * .3 + Math.max(0, power - reel.drag) * .15, 0, .8);
    const mult = (rodOk ? 1 : .8) * (hookOk ? 1 : .8) * (sk.eco ? 1.2 : 1);
    const tips = [!hookOk && `${sp}에는 「${TACKLE.hook.items.find(h => h.for.includes(sp))?.name || '맞는 채비'}」`, !rodOk && `낚싯대 「${TACKLE.rod.items.find(h => h.for.includes(sp))?.name}」 추천`,
      line.str < power && `줄이 약해요(${line.name})`, !sk.eco && '친환경 봉돌을 쓰면 점수 +20%·바다 납 오염 줄이기'].filter(Boolean);
    return { bite, brk, mult, eco: sk.eco, tips };
  }
  function shopPanel(el, ctx, onChange) {
    const draw = () => {
      const g = gearOf(ctx), coins = (ctx.wallet.get() || {}).coins ?? 50;
      el.innerHTML = `<div style="display:grid;gap:8px;padding:10px;border-radius:12px;background:var(--surface,#1E242B);border:1px solid var(--line,#3E4852)">
        <div style="display:flex;justify-content:space-between"><b>🏪 낚시점 · 장비 장착</b><b>🪙 ${coins}</b></div>
        ${Object.entries(TACKLE).map(([cat, c]) => `<div><div style="font-size:12.5px;opacity:.8;margin-bottom:4px">${c.name}</div><div style="display:flex;gap:6px;flex-wrap:wrap">${c.items.map(it => {
          const own = g.owned.includes(it.id), on = g.equip[cat] === it.id;
          return `<button type="button" data-c="${cat}" data-i="${it.id}" style="border:1px solid ${on ? '#E2572B' : 'var(--line,#3E4852)'};border-radius:10px;padding:6px 9px;background:${on ? '#E2572B33' : '#0002'};color:inherit;font:12.5px inherit;cursor:pointer">${it.eco ? '🌱 ' : ''}${esc(it.name)}<br><b style="font-size:11.5px">${on ? '장착 중' : own ? '장착하기' : '🪙 ' + it.price}</b></button>`; }).join('')}</div></div>`).join('')}
        <div data-m style="font-size:12.5px"></div></div>`;
      el.querySelectorAll('[data-i]').forEach(b => b.onclick = async () => {
        const g2 = gearOf(ctx), cat = b.dataset.c, it = item(cat, b.dataset.i), w = ctx.wallet.get() || {}, c2 = w.coins ?? 50;
        if (!g2.owned.includes(it.id)) { if (c2 < it.price) { el.querySelector('[data-m]').textContent = `코인이 ${it.price - c2}개 모자랍니다`; return; } await ctx.wallet.set({ coins: c2 - it.price }); g2.owned.push(it.id); sfx('catch'); }
        g2.equip[cat] = it.id; await saveGear(ctx, g2); draw(); onChange && onChange();
      });
    };
    draw();
  }

  // 공용: 버티기 대결(누르고 있으면 감기, 장력이 넘치면 줄 터짐)
  function fightStep(f, dt, hold, brk) {
    // 한 마리 대결이 5~12초 안에 끝나도록 맞춘 값
    if (hold) { f.T += (.2 + f.power * .14) * dt; f.dist -= (11 - f.power * 1.5) * (1 - f.T * .4) * dt; } else f.T -= 1.0 * dt;
    if (Math.random() < dt * (.3 + f.power * .3)) { f.T += rnd(.04, .1) * f.power; f.dist += f.power * .5; }
    f.T = Math.max(0, f.T); f.slack = f.T < .05 ? f.slack + dt : 0;
    if (f.T >= 1) return Math.random() < Math.max(.35, brk * 2) ? 'break' : (f.T = .7, 'hold');
    if (f.slack > 2.4) return 'slip';
    return f.dist <= 0 ? 'land' : 'fight';
  }
  function holdButton(btn, onDown, onUp) {
    btn.addEventListener('pointerdown', e => { e.preventDefault(); onDown(); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => btn.addEventListener(t, onUp));
  }
  const SEASON_SP = { 1: ['우럭'], 2: ['우럭'], 3: ['우럭', '갑오징어'], 4: ['갑오징어', '광어', '우럭'], 5: ['참돔', '광어', '갑오징어'], 6: ['한치', '참돔'], 7: ['갈치', '한치', '문어'], 8: ['갈치', '한치', '문어'], 9: ['쭈꾸미', '갑오징어', '갈치'], 10: ['쭈꾸미', '갑오징어', '광어', '참돔'], 11: ['쭈꾸미', '갑오징어', '무늬오징어', '광어'], 12: ['우럭', '무늬오징어'] };
  const SP6 = { '쭈꾸미': ['#E3A21A', 1, 10, [30, 40]], '갑오징어': ['#B05CC4', 1, 25, [28, 40]], '우럭': ['#3C7FC0', 2, 30, [25, 40]], '광어': ['#1D8A5B', 2, 45, [33, 40]], '참돔': ['#E2572B', 3, 55, [18, 36]],
    '갈치': ['#AEB9BF', 2, 35, [10, 26]], '문어': ['#C97A2F', 3, 60, [34, 40]], '무늬오징어': ['#6C5FD0', 2, 40, [15, 30]], '한치': ['#1AA3A8', 1, 20, [8, 22]], '감성돔': ['#9AA5B1', 2, 60, [0, 0]], '벵에돔': ['#2F4F6F', 2, 50, [0, 0]], '볼락': ['#8B5A2B', 1, 25, [0, 0]] };
  const closedNow = sp => { const d = new Date(), md = (d.getMonth() + 1) * 100 + d.getDate(); return (sp === '쭈꾸미' && md >= 511 && md <= 831) || (sp === '문어' && md >= 516 && md <= 630); };

  // ═════════ 1. 선상낚시 3D 「새벽 출항」 ═════════
  function boat3d(container, onReward, ctx) {
    const sh = shell(container); if (!window.THREE) return no3d(sh);
    let game = null;
    function lobby() {
      const month = new Date().getMonth() + 1, list = SEASON_SP[month];
      sh.res.style.display = 'none';
      sh.body.innerHTML = `<div data-fx></div><div style="font-weight:700;margin-bottom:6px">🎯 오늘의 대상어 (${month}월 제철)</div><div data-sp style="display:flex;gap:6px;flex-wrap:wrap"></div><div data-tip style="font-size:12.5px;margin:6px 0"></div><div data-shop></div>
        <button type="button" data-go style="${PRIMARY};width:100%;margin-top:8px">🛥️ 출항 (05:00 → 13:00, 90초)</button>`;
      sh.body.querySelector('[data-fx]').append(fxBar());
      let target = list[0];
      const tip = () => { const c = compat(gearOf(ctx).equip, target, SP6[target][1]); sh.body.querySelector('[data-tip]').innerHTML = c.tips.length ? '⚠ ' + c.tips.map(esc).join(' · ') : '✅ 장비 궁합 완벽! 친환경 봉돌 보너스 +20%'; };
      const sp = () => { sh.body.querySelector('[data-sp]').innerHTML = list.map(s => `<button type="button" data-s="${s}" style="border:0;border-radius:999px;padding:7px 12px;cursor:pointer;font:700 13px inherit;background:${s === target ? SP6[s][0] : '#0003'};color:#fff">${esc(s)}</button>`).join('');
        sh.body.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { target = b.dataset.s; sp(); tip(); }); };
      sp(); tip(); shopPanel(sh.body.querySelector('[data-shop]'), ctx, tip);
      sh.body.querySelector('[data-go]').onclick = () => { game = play(target); };
    }
    function play(target) {
      sh.body.innerHTML = `<div style="position:relative"><div data-gl style="width:100%;aspect-ratio:4/5"></div><div data-hud style="${hud()}"></div>
          <canvas data-sonar width="120" height="240" style="position:absolute;right:8px;bottom:8px;width:60px;height:120px;border-radius:8px;background:#06222Acc;border:1px solid #fff4"></canvas>
          <div data-msg style="position:absolute;left:0;right:70px;top:45%;text-align:center;color:#fff;font:800 20px sans-serif;text-shadow:0 2px 6px #000;pointer-events:none"></div>
          <div data-bar style="position:absolute;left:10%;right:80px;bottom:14px;height:14px;border-radius:7px;background:#0009;display:none;overflow:hidden"><i style="display:block;height:100%;width:0;background:#4BD08A"></i></div></div>
        <div style="display:grid;grid-template-columns:1fr 2fr;gap:8px;margin-top:8px"><button type="button" data-up style="${SOFT}">⤒ 올리기</button><button type="button" data-main style="${PRIMARY}">▼ 내리기 (누르기)</button></div>`;
      const q = s => sh.body.querySelector(s), S = stage3d(q('[data-gl]'), 4 / 5), { THREE, scene, cam } = S;
      const water = sea(THREE, scene, '#17667A', 500, 50);
      scene.fog = new THREE.Fog('#9FD3E0', 120, 420);
      // 배 갑판(1인칭: 선미에서 뱃머리 쪽)
      // 갑판은 카메라 앞쪽 뱃머리까지만, 선실은 카메라 뒤(화면 밖)에 둠
      const deck = new THREE.Mesh(new THREE.BoxGeometry(6, .5, 9), new THREE.MeshLambertMaterial({ color: '#8C6A4A' })); deck.position.set(0, .6, 2); scene.add(deck);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(6.4, .7, .25), new THREE.MeshLambertMaterial({ color: '#C8462A' })); rail.position.set(0, 1.1, -2.4); scene.add(rail);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 3.4), new THREE.MeshLambertMaterial({ color: '#F4F1E8' })); cabin.position.set(0, 2.6, 15); scene.add(cabin);
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(.03, .06, 5, 5), new THREE.MeshLambertMaterial({ color: '#5A3A1A' })); rod.position.set(1.2, 2.6, -2); rod.rotation.x = -1.0; scene.add(rod);
      const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]); const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: '#ffffff' })); scene.add(line);
      for (let i = 0; i < 6; i++) { const isl = new THREE.Mesh(new THREE.ConeGeometry(rnd(10, 22), rnd(8, 20), 6), new THREE.MeshLambertMaterial({ color: '#5E8C4A', flatShading: true })); isl.position.set(rnd(-200, 200), 2, rnd(-300, -160)); scene.add(isl); }
      const gulls = []; for (let i = 0; i < 4; i++) { const gm = new THREE.Mesh(new THREE.ConeGeometry(.4, 1.6, 3), new THREE.MeshBasicMaterial({ color: '#fff' })); gm.rotation.z = Math.PI / 2; scene.add(gm); gulls.push({ m: gm, a: rnd(0, 6), r: rnd(15, 30), h: rnd(10, 16) }); }
      cam.position.set(0, 4.2, 9); cam.lookAt(0, 1.5, -20);
      const pool = SEASON_SP[new Date().getMonth() + 1];
      const fishes = Array.from({ length: 8 }, () => { const sp = Math.random() < .55 ? target : pool[ri(pool.length)]; const z = SP6[sp][3]; return { sp, d: rnd(z[0], z[1]) }; });
      const eq = gearOf(ctx).equip, son = q('[data-sonar]').getContext('2d');
      let t = 0, depth = 0, holdMain = false, holdUp = false, state = 'drop', still = 0, biteT = 0, fish = null, f = null, score = 0, count = {}, released = 0, last = 0, raf = 0, alive = true, msgT = 0, breaks = 0;
      const say = (m, s) => { q('[data-msg]').textContent = m; msgT = s || 1.4; };
      holdButton(q('[data-main]'), () => { if (state === 'bite') { state = 'fight'; const c = compat(eq, fish.sp, SP6[fish.sp][1]); f = { T: .2, dist: depth, power: SP6[fish.sp][1], slack: 0, brk: c.brk }; q('[data-main]').textContent = '⟳ 감기 (누르기)'; q('[data-bar]').style.display = 'block'; vib(80); say('걸었다!', .8); return; } holdMain = true; }, () => holdMain = false);
      holdButton(q('[data-up]'), () => holdUp = true, () => holdUp = false);
      function end() {
        alive = false; S.dispose();
        const total = Object.values(count).reduce((a, b) => a + b, 0);
        finish(sh, onReward, 'boat3d', score, `대상어 ${esc(target)} · 총 ${total}마리 (${Object.entries(count).map(([k, v]) => `${k} ${v}`).join(', ') || '없음'})${released ? ` · 방생 ${released}` : ''}${breaks ? ` · 줄 터짐 ${breaks}` : ''}`,
          { catches: Object.entries(count).map(([sp, n]) => ({ sp, n })), released });
        const b = document.createElement('button'); b.type = 'button'; b.style.cssText = PRIMARY + ';width:100%;margin-top:8px'; b.textContent = '↻ 다시 출항'; b.onclick = lobby; sh.body.append(b);
      }
      function frame(ts) {
        if (!alive) return;
        const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts; t += dt;
        const hour = 5 + t / 90 * 8, sky = skyAt(opt.fx4 ? hour : 9);   // 4D: 05시 → 13시
        scene.background = new THREE.Color(sky.color); scene.fog.color.set(sky.color); S.hemi.intensity = sky.light; S.sun.intensity = sky.light;
        water.update(t, opt.fx4 ? 1 + Math.sin(t / 15) * .4 : 1);
        gulls.forEach(gl => { gl.a += dt * .4; gl.m.position.set(Math.cos(gl.a) * gl.r, gl.h + Math.sin(t * 3 + gl.a) * .5, -30 + Math.sin(gl.a) * gl.r); });
        const roll = Math.sin(t * 1.1) * .03 + (opt.fx5 && tilt.ok ? tilt.x * .05 : 0); cam.rotation.z = roll; cam.position.y = 4.2 + Math.sin(t * 1.3) * .15;
        if (state === 'drop' || state === 'wait') {
          if (holdMain || (opt.fx5 && tilt.ok && tilt.y > .5)) depth = Math.min(40, depth + 9 * dt);
          if (holdUp || (opt.fx5 && tilt.ok && tilt.y < -.5)) depth = Math.max(0, depth - 7 * dt);
          still = holdMain || holdUp ? 0 : still + dt; state = depth > 0 ? 'wait' : 'drop';
          if (state === 'wait' && still > 1) { const near = fishes.filter(x => Math.abs(x.d - depth) < 4);
            if (near.length) { const cand = near[ri(near.length)], c = compat(eq, cand.sp, SP6[cand.sp][1]);
              if (Math.random() < dt * (.5 + still * .2) * c.bite) { fish = cand; state = 'bite'; biteT = .8; vib([60, 30, 60]); sfx('bite'); q('[data-main]').textContent = '❗ 챔질!'; say('입질!', .8); } } }
        } else if (state === 'bite') { biteT -= dt; if (biteT <= 0) { state = 'wait'; still = 0; q('[data-main]').textContent = '▼ 내리기 (누르기)'; say('놓쳤다…'); } }
        else if (state === 'fight') {
          const r = fightStep(f, dt, holdMain, f.brk); depth = Math.max(0, f.dist);
          q('[data-bar] i').style.width = Math.min(100, f.T * 100) + '%'; q('[data-bar] i').style.background = f.T > .8 ? '#FF5A4A' : f.T > .55 ? '#FFB020' : '#4BD08A';
          if (f.T > .8) vib(15);
          if (r !== 'fight' && r !== 'hold') {
            q('[data-bar]').style.display = 'none'; q('[data-main]').textContent = '▼ 내리기 (누르기)';
            if (r === 'land') { const sp = fish.sp, c = compat(eq, sp, SP6[sp][1]);
              if (closedNow(sp)) { released++; score += 20; say(`${sp} — 금어기라 방생 +20`, 1.8); }
              else { count[sp] = (count[sp] || 0) + 1; const p = Math.round(SP6[sp][2] * c.mult * (sp === target ? 1.3 : 1)); score += p; say(`${sp} +${p}${c.eco ? ' 🌱' : ''}`, 1.5); sfx('catch'); vib([40, 30, 40, 30, 120]); }
              fishes.splice(fishes.indexOf(fish), 1); const z = SP6[target][3]; fishes.push({ sp: Math.random() < .55 ? target : pool[ri(pool.length)], d: rnd(z[0], z[1]) }); }
            else { if (r === 'break') breaks++; say(r === 'break' ? '💥 줄이 터졌다! (줄·릴 장비를 올려 보세요)' : '줄이 늘어져 빠졌다', 1.8); sfx('miss'); }
            state = 'wait'; depth = 0; still = 0; fish = null;
          }
        }
        const tip = new THREE.Vector3(1.2 + Math.sin(t) * .02, 4.6 + (state === 'bite' ? Math.sin(t * 40) * .15 : 0), -4.2);
        lineGeo.setFromPoints([tip, new THREE.Vector3(1.2, -depth * .2, -6 - depth * .1)]);
        son.fillStyle = '#06222A'; son.fillRect(0, 0, 120, 240);
        son.fillStyle = '#ffffff22'; for (let dd = 10; dd < 40; dd += 10) son.fillRect(0, dd * 6, 120, 1);
        fishes.forEach(x => { son.fillStyle = SP6[x.sp][0]; son.fillRect(20 + (x.d * 37 % 70), x.d * 6, 14, 5); });
        son.fillStyle = '#FFCF3A'; son.fillRect(0, depth * 6, 120, 3); son.fillStyle = '#fff'; son.font = '18px sans-serif'; son.fillText(depth.toFixed(0) + 'm', 4, 22);
        q('[data-hud]').innerHTML = `<div>⏱ ${Math.max(0, 90 - t).toFixed(0)}초 · 🕔 ${String(Math.floor(hour)).padStart(2, '0')}:${String(Math.floor(hour % 1 * 60)).padStart(2, '0')} · 점수 ${score}</div><div>🎯 ${esc(target)} · ${Object.entries(count).map(([k, v]) => `${k} ${v}`).join(' · ') || '아직 0마리'}</div>`;
        if (msgT > 0) { msgT -= dt; if (msgT <= 0) q('[data-msg]').textContent = ''; }
        S.r.render(scene, cam);
        if (t >= 90 && state !== 'fight') return end();
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
      return { destroy() { alive = false; cancelAnimationFrame(raf); S.dispose(); } };
    }
    lobby();
    return { destroy() { if (game) game.destroy(); } };
  }

  // ═════════ 2. 갯바위 낚시 3D: 찌낚시 · 파도 · 밀물 안전 철수 · 쓰레기 줍기 ═════════
  function rock3d(container, onReward, ctx) {
    const sh = shell(container); if (!window.THREE) return no3d(sh);
    let game = null;
    function lobby() {
      sh.res.style.display = 'none';
      sh.body.innerHTML = `<div data-fx></div><div style="font-size:13.5px;line-height:1.6;margin-bottom:6px">🪨 갯바위에 서서 바다를 눌러 찌를 던지세요. 찌가 쑥 잠기면 챔질! 떠다니는 쓰레기는 눌러서 주워요.<br>⚠ <b>밀물</b>이 차오르면 고립되기 전에 「안전 철수」를 눌러야 합니다.</div><div data-tip style="font-size:12.5px;margin-bottom:6px"></div><div data-shop></div>
        <button type="button" data-go style="${PRIMARY};width:100%;margin-top:8px">🪨 갯바위 진입 (120초)</button>`;
      sh.body.querySelector('[data-fx]').append(fxBar());
      const tip = () => { const c = compat(gearOf(ctx).equip, '감성돔', 2); sh.body.querySelector('[data-tip]').innerHTML = c.tips.length ? '⚠ ' + c.tips.map(esc).join(' · ') : '✅ 갯바위 장비 완벽!'; };
      tip(); shopPanel(sh.body.querySelector('[data-shop]'), ctx, tip);
      sh.body.querySelector('[data-go]').onclick = () => { game = play(); };
    }
    function play() {
      sh.body.innerHTML = `<div style="position:relative"><div data-gl style="width:100%;aspect-ratio:4/5"></div><div data-hud style="${hud()}"></div>
          <div data-msg style="position:absolute;left:0;right:0;top:42%;text-align:center;color:#fff;font:800 20px sans-serif;text-shadow:0 2px 6px #000;pointer-events:none"></div>
          <div data-bar style="position:absolute;left:10%;right:10%;bottom:14px;height:14px;border-radius:7px;background:#0009;display:none;overflow:hidden"><i style="display:block;height:100%;width:0"></i></div></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><button type="button" data-main style="${PRIMARY}">⟳ 감기 / 챔질</button><button type="button" data-run style="${GREEN}">🏃 안전 철수</button></div>`;
      const q = s => sh.body.querySelector(s), S = stage3d(q('[data-gl]'), 4 / 5), { THREE, scene, cam, r } = S;
      scene.background = new THREE.Color('#9FD3E0'); scene.fog = new THREE.Fog('#9FD3E0', 80, 300);
      const water = sea(THREE, scene, '#1E7487', 400, 60);
      const rockMat = new THREE.MeshLambertMaterial({ color: '#6E6458', flatShading: true });
      for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(rnd(2, 5), 0), rockMat); m.position.set(rnd(-14, 14), rnd(-1, 1.5), rnd(4, 14)); m.rotation.set(rnd(0, 3), rnd(0, 3), 0); scene.add(m); }
      for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(rnd(3, 7), 0), rockMat); m.position.set(rnd(-60, 60), 0, rnd(-90, -40)); scene.add(m); }
      cam.position.set(0, 6, 12); cam.lookAt(0, 0, -30);
      // 파도 물보라 입자
      const N = 300, sp = new Float32Array(N * 3), vel = []; for (let i = 0; i < N; i++) { sp[i * 3 + 1] = -50; vel.push(new THREE.Vector3()); }
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
      const spray = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: .4, transparent: true, opacity: .85 })); scene.add(spray);
      let sprayI = 0; const splash = (x, z) => { for (let k = 0; k < 40; k++) { const i = (sprayI++ % N); sp[i * 3] = x + rnd(-2, 2); sp[i * 3 + 1] = 0; sp[i * 3 + 2] = z + rnd(-1, 1); vel[i].set(rnd(-2, 2), rnd(6, 12), rnd(-3, 1)); } vib(20); };
      const float = new THREE.Group(); const fb = new THREE.Mesh(new THREE.SphereGeometry(.35, 10, 8), new THREE.MeshLambertMaterial({ color: '#FF5A2B' })); const ft = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .9, 6), new THREE.MeshLambertMaterial({ color: '#FFE27A' })); ft.position.y = .6; float.add(fb, ft); float.visible = false; scene.add(float);
      const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]); scene.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: '#fff' })));
      const trash = []; const TR = [['#F2F2F2', 'bag'], ['#7FC8E8', 'bottle'], ['#E8C547', 'can']];
      function addTrash() { const k = TR[ri(3)], m = k[1] === 'bottle' ? new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, 1.2, 8), new THREE.MeshLambertMaterial({ color: k[0], transparent: true, opacity: .8 })) : new THREE.Mesh(new THREE.BoxGeometry(1.2, .2, 1), new THREE.MeshLambertMaterial({ color: k[0] }));
        m.position.set(rnd(-25, 25), .3, rnd(-60, -15)); m.rotation.z = Math.PI / 2 * (k[1] === 'bottle'); scene.add(m); trash.push({ m, v: rnd(-1, 1) }); }
      for (let i = 0; i < 5; i++) addTrash();
      const eq = gearOf(ctx).equip, ray = new THREE.Raycaster(), mv = new THREE.Vector2();
      if (window.__G6_TEST__) window.__G6_TEST__ = { cam, water, ray, THREE };   // 자동 시험용(평소에는 꺼져 있음)
      const ROCK_SP = [['감성돔', .35], ['벵에돔', .3], ['볼락', .25], ['참돔', .1]];
      let t = 0, tide = 0, state = 'idle', biteIn = 0, biteT = 0, fish = null, f = null, hold = false, score = 0, eco = 0, count = {}, last = 0, raf = 0, alive = true, msgT = 0, warned = false, waveT = 2;
      const say = (m, s) => { q('[data-msg]').textContent = m; msgT = s || 1.4; };
      r.domElement.addEventListener('pointerdown', e => {
        const b = r.domElement.getBoundingClientRect(); mv.set((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1); ray.setFromCamera(mv, cam);
        const hitT = ray.intersectObjects(trash.map(x => x.m))[0];
        if (hitT) { const k = trash.findIndex(x => x.m === hitT.object); scene.remove(trash[k].m); trash.splice(k, 1); eco++; score += 15; sfx('hit'); say('🧹 쓰레기 수거 +15', 1); setTimeout(addTrash, 4000); return; }
        if (state !== 'idle' && state !== 'wait') return;
        const hit = ray.intersectObject(water.mesh)[0]; if (!hit || hit.point.z > 0) return;
        float.position.set(hit.point.x, .2, hit.point.z); float.visible = true; state = 'wait'; biteIn = rnd(2, 5); sfx('hit'); say('찌를 보세요…', 1);
      });
      holdButton(q('[data-main]'), () => {
        if (state === 'bite') { state = 'fight'; const c = compat(eq, fish, SP6[fish][1]); f = { T: .2, dist: 12, power: SP6[fish][1], slack: 0, brk: c.brk }; q('[data-bar]').style.display = 'block'; vib(80); say('걸었다!', .8); }
        hold = true; }, () => hold = false);
      q('[data-run]').onclick = () => end(true);
      function end(safe) {
        if (!alive) return; alive = false; S.dispose();
        const total = Object.values(count).reduce((a, b) => a + b, 0);
        if (!safe) score = Math.round(score / 2);
        finish(sh, onReward, 'rock3d', score + (safe ? 50 : 0), `${safe ? '✅ 안전 철수 +50' : '⛔ 밀물에 고립! 점수 절반 — 갯바위는 물때를 꼭 확인하세요'} · ${total}마리 (${Object.entries(count).map(([k, v]) => `${k} ${v}`).join(', ') || '없음'}) · 쓰레기 ${eco}개 수거`,
          { catches: Object.entries(count).filter(([k]) => ['참돔'].includes(k)).map(([sp, n]) => ({ sp, n })) });
        const b = document.createElement('button'); b.type = 'button'; b.style.cssText = PRIMARY + ';width:100%;margin-top:8px'; b.textContent = '↻ 다시 진입'; b.onclick = lobby; sh.body.append(b);
      }
      function frame(ts) {
        if (!alive) return;
        const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts; t += dt;
        tide = opt.fx4 ? t / 120 : Math.min(.7, t / 170);   // 4D: 밀물이 차오름
        water.mesh.position.y = tide * 3.2; water.update(t, 1.2 + tide);
        waveT -= dt; if (waveT <= 0) { waveT = rnd(2, 4) * (1.2 - tide * .5); splash(rnd(-10, 10), 4); }
        for (let i = 0; i < N; i++) { if (sp[i * 3 + 1] < -10) continue; vel[i].y -= 18 * dt; sp[i * 3] += vel[i].x * dt; sp[i * 3 + 1] += vel[i].y * dt; sp[i * 3 + 2] += vel[i].z * dt; if (sp[i * 3 + 1] < water.mesh.position.y - .5) sp[i * 3 + 1] = -50; }
        sg.attributes.position.needsUpdate = true;
        trash.forEach(x => { x.m.position.x += x.v * dt; x.m.position.y = water.mesh.position.y + .3 + Math.sin(t * 2 + x.v) * .1; });
        if (opt.fx5 && tilt.ok) { cam.position.x = tilt.x * 4; cam.lookAt(tilt.x * 6, 0, -30); }
        cam.position.y = 6 + tide * 1.5;
        if (tide > .75 && !warned) { warned = true; say('⚠ 물이 차오릅니다! 안전 철수하세요', 2.5); vib([200, 100, 200]); sfx('miss'); }
        if (tide >= 1) return end(false);
        if (state === 'wait') { float.position.y = water.mesh.position.y + .2 + Math.sin(t * 2) * .08; biteIn -= dt;
          if (biteIn <= 0) { let rr = Math.random(), sp0 = '볼락'; for (const [n, w] of ROCK_SP) { rr -= w; if (rr <= 0) { sp0 = n; break; } }
            const c = compat(eq, sp0, SP6[sp0][1]); if (Math.random() < c.bite) { fish = sp0; state = 'bite'; biteT = .9; float.position.y -= .6; vib([60, 30, 60]); sfx('bite'); say('찌가 잠겼다! 챔질!', .9); }
            else { biteIn = rnd(2, 4); if (c.bite < 1) say('🐟 찌만 툭툭… 갯바위 장비(찌낚싯대·찌 바늘)면 입질이 잘 와요', 1.6); } } }
        else if (state === 'bite') { biteT -= dt; if (biteT <= 0) { state = 'wait'; biteIn = rnd(2, 4); say('놓쳤다…'); } }
        else if (state === 'fight') {
          const res = fightStep(f, dt, hold, f.brk); q('[data-bar] i').style.width = Math.min(100, f.T * 100) + '%'; q('[data-bar] i').style.background = f.T > .8 ? '#FF5A4A' : '#4BD08A';
          float.position.lerp(new THREE.Vector3(0, water.mesh.position.y, -4), dt * .3);
          if (res !== 'fight' && res !== 'hold') { q('[data-bar]').style.display = 'none'; float.visible = false; state = 'idle';
            if (res === 'land') { count[fish] = (count[fish] || 0) + 1; const c = compat(eq, fish, SP6[fish][1]), p = Math.round(SP6[fish][2] * c.mult); score += p; say(`${fish} +${p}${c.eco ? ' 🌱' : ''}`, 1.5); sfx('catch'); vib([40, 30, 120]); }
            else { say(res === 'break' ? '💥 줄이 터졌다!' : '빠졌다…', 1.5); sfx('miss'); } } }
        if (float.visible) lineGeo.setFromPoints([new THREE.Vector3(1.5, 7, 8), float.position.clone().add(new THREE.Vector3(0, .9, 0))]);
        q('[data-hud]').innerHTML = `<div>⏱ ${Math.max(0, 120 - t).toFixed(0)}초 · 점수 ${score} · 🧹 ${eco}</div><div>🌊 밀물 ${Math.round(tide * 100)}% ${tide > .75 ? '⚠ 철수!' : ''} · ${Object.entries(count).map(([k, v]) => `${k} ${v}`).join(' · ') || '찌를 던지세요'}</div>`;
        if (msgT > 0) { msgT -= dt; if (msgT <= 0) q('[data-msg]').textContent = ''; }
        S.r.render(scene, cam);
        if (t >= 120) return end(true);
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
      return { destroy() { alive = false; cancelAnimationFrame(raf); S.dispose(); } };
    }
    lobby();
    return { destroy() { if (game) game.destroy(); } };
  }

  // ═════════ 3. 낚시 장비 공방 3D: 손님 주문대로 채비 조립 ═════════
  const ORDERS = [
    { who: '보령 손님', want: '쭈꾸미 선상', ans: { rod: 'rod-light', reel: 'reel-s', line: 'pe08', hook: 'egi' } },
    { who: '여수 손님', want: '참돔 타이라바', ans: { rod: 'rod-mid', reel: 'reel-m', line: 'pe15', hook: 'tai' } },
    { who: '군산 손님', want: '광어 다운샷', ans: { rod: 'rod-mid', reel: 'reel-m', line: 'pe15', hook: 'worm' } },
    { who: '목포 손님', want: '우럭 선상(깊은 곳)', ans: { rod: 'rod-heavy', reel: 'reel-e', line: 'pe3', hook: 'card' } },
    { who: '통영 손님', want: '갈치 야간', ans: { rod: 'rod-heavy', reel: 'reel-e', line: 'pe3', hook: 'card' } },
    { who: '포항 손님', want: '문어 에기', ans: { rod: 'rod-heavy', reel: 'reel-m', line: 'pe3', hook: 'egi-big' } },
    { who: '제주 손님', want: '한치 이카메탈', ans: { rod: 'rod-light', reel: 'reel-s', line: 'pe08', hook: 'ika' } },
    { who: '거제 손님', want: '감성돔 갯바위 찌낚시', ans: { rod: 'rod-iso', reel: 'reel-spin', line: 'ny3', hook: 'float' } },
  ];
  function tackle3d(container, onReward) {
    const sh = shell(container); if (!window.THREE) return no3d(sh);
    let S = null, raf = 0, alive = false, timer = 0;
    function start() {
      sh.res.style.display = 'none';
      sh.body.innerHTML = `<div style="position:relative"><div data-gl style="width:100%;aspect-ratio:16/10"></div><div data-hud style="${hud()}"></div></div>
        <div data-order style="padding:10px;border-radius:12px;background:linear-gradient(135deg,#FFF4E2,#FFE3C7);color:#4A2E16;margin-top:8px"></div><div data-pick style="display:grid;gap:6px;margin-top:6px"></div>
        <button type="button" data-ok style="${PRIMARY};width:100%;margin-top:8px">🧰 조립 완료 · 손님께 드리기</button>`;
      const q = s => sh.body.querySelector(s);
      S = stage3d(q('[data-gl]'), 16 / 10); const { THREE, scene, cam } = S;
      scene.background = new THREE.Color('#2A3A44');
      const table = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, .5, 40), new THREE.MeshLambertMaterial({ color: '#8C5A2B' })); table.position.y = -1; scene.add(table);
      const rig = new THREE.Group(); scene.add(rig); cam.position.set(0, 4, 11); cam.lookAt(0, 1, 0);
      const order = ORDERS.slice().sort(() => Math.random() - .5);
      let oi = 0, pick = {}, score = 0, right = 0, eco = 0, t = 90, last = 0, feedUntil = 0;
      function build() {
        while (rig.children.length) rig.remove(rig.children[0]);
        const rod = pick.rod ? item('rod', pick.rod) : null, reel = pick.reel ? item('reel', pick.reel) : null, line = pick.line ? item('line', pick.line) : null, hook = pick.hook ? item('hook', pick.hook) : null, sk = pick.sinker ? item('sinker', pick.sinker) : null;
        const L = rod ? { 'rod-light': 5, 'rod-mid': 6, 'rod-heavy': 7.5, 'rod-iso': 9 }[rod.id] : 0;
        if (rod) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.06, .16, L, 8), new THREE.MeshLambertMaterial({ color: '#3A2A1A' })); m.rotation.z = 1.2; m.position.set(0, 1.2, 0); rig.add(m); }
        if (reel) { const s = .5 + reel.drag * .2, m = new THREE.Mesh(reel.id === 'reel-spin' ? new THREE.CylinderGeometry(s * .7, s * .7, s, 16) : new THREE.BoxGeometry(s * 1.4, s, s), new THREE.MeshLambertMaterial({ color: reel.id === 'reel-e' ? '#C8462A' : '#9AA5B1' })); m.position.set(1.4, .55, 0); rig.add(m); }
        if (line) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.015 * line.str + .01, .015 * line.str + .01, 4, 4), new THREE.MeshBasicMaterial({ color: line.id === 'ny3' ? '#F5F5F5' : '#E2C04A' })); m.position.set(-L * .46 || -2, .5, 0); rig.add(m); }
        if (hook) { const m = hook.id.startsWith('egi') || hook.id === 'ika' ? new THREE.Mesh(new THREE.ConeGeometry(.35, 1.4, 6), new THREE.MeshLambertMaterial({ color: '#FF8A3D' })) : hook.id === 'tai' ? new THREE.Mesh(new THREE.SphereGeometry(.45, 12, 10), new THREE.MeshLambertMaterial({ color: '#E2572B' })) : new THREE.Mesh(new THREE.TorusGeometry(.3, .06, 8, 16, 4.5), new THREE.MeshLambertMaterial({ color: '#C9D1D9' }));
          m.position.set(-L * .46 || -2, -1.6, 0); rig.add(m); }
        if (sk) { const m = new THREE.Mesh(new THREE.SphereGeometry(.3, 10, 8), new THREE.MeshLambertMaterial({ color: sk.eco ? '#D9B44A' : '#555B60', emissive: sk.eco ? '#3A2A00' : '#000' })); m.position.set(-L * .46 || -2, -.9, 0); rig.add(m); }
      }
      function drawOrder() {
        const o = order[oi % order.length];
        q('[data-order]').innerHTML = `<b style="font-size:16px">🧑 ${esc(o.who)}: "${esc(o.want)} 채비 부탁해요!"</b><div style="font-size:12.5px;margin-top:4px">낚싯대·릴·줄·바늘(에기)을 골라 주세요. 🌱 친환경 봉돌을 고르면 보너스!</div>`;
        q('[data-pick]').innerHTML = Object.entries(TACKLE).map(([cat, c]) => `<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><b style="font-size:12.5px;min-width:58px">${c.name}</b>${c.items.map(it =>
          `<button type="button" data-c="${cat}" data-i="${it.id}" style="border:1px solid ${pick[cat] === it.id ? '#E2572B' : 'var(--line,#3E4852)'};border-radius:10px;padding:5px 8px;background:${pick[cat] === it.id ? '#E2572B33' : '#0002'};color:inherit;font:12px inherit;cursor:pointer">${it.eco ? '🌱 ' : ''}${esc(it.name)}</button>`).join('')}</div>`).join('');
        q('[data-pick]').querySelectorAll('[data-i]').forEach(b => b.onclick = () => { pick[b.dataset.c] = b.dataset.i; sfx('hit'); build(); drawOrder(); });
      }
      q('[data-ok]').onclick = () => {
        const o = order[oi % order.length]; let pts = 0, ok = 0;
        Object.entries(o.ans).forEach(([k, v]) => { if (pick[k] === v) { ok++; pts += 15; } });
        if (pick.sinker && item('sinker', pick.sinker).eco) { pts += 15; eco++; }
        if (ok === 4) { pts += 20; right++; sfx('level'); vib([40, 30, 40]); } else sfx('miss');
        score += pts;
        q('[data-hud]').innerHTML = `<div>${ok === 4 ? '✅ 완벽한 채비!' : `⚠ ${4 - ok}개가 달라요 — 정답: ${Object.entries(o.ans).map(([k, v]) => item(k, v).name).join(' · ')}`} +${pts}</div>`;
        feedUntil = performance.now() + 2200;   // 피드백을 잠시 보여 준 뒤 시간·점수 표시로 돌아감
        oi++; pick = {}; setTimeout(() => { build(); drawOrder(); }, 900);
      };
      clearInterval(timer);
      timer = setInterval(() => { t -= 1; if (t <= 0) { clearInterval(timer); alive = false; cancelAnimationFrame(raf); S.dispose(); S = null;
        finish(sh, onReward, 'tackle3d', score, `완벽한 채비 ${right}건 · 친환경 봉돌 ${eco}번 선택`);
        const b = document.createElement('button'); b.type = 'button'; b.style.cssText = PRIMARY + ';width:100%;margin-top:8px'; b.textContent = '↻ 다시 열기'; b.onclick = start; sh.body.append(b); } }, 1000);
      alive = true;
      const frame = ts => { if (!alive) return; const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts; rig.rotation.y += dt * .6; table.rotation.y += dt * .6;
        const hh = q('[data-hud]'); if (hh && ts > feedUntil) hh.innerHTML = `<div>⏱ ${t}초 · 점수 ${score} · 손님 ${oi + 1}번째</div>`;
        S.r.render(scene, cam); raf = requestAnimationFrame(frame); };
      build(); drawOrder(); raf = requestAnimationFrame(frame);
    }
    const b = document.createElement('button'); b.type = 'button'; b.style.cssText = PRIMARY + ';width:100%'; b.textContent = '▶ 공방 열기 (90초)'; b.onclick = start; sh.body.append(b);
    return { destroy() { alive = false; clearInterval(timer); cancelAnimationFrame(raf); if (S) S.dispose(); } };
  }

  // ═════════ 4. 바다 정화 다이버 3D: 쓰레기 줍기 · 폐그물 끊기 · 바다거북 구조 · 산소 ═════════
  function diver3d(container, onReward) {
    const sh = shell(container); if (!window.THREE) return no3d(sh);
    let game = null;
    function start() {
      sh.res.style.display = 'none';
      sh.body.innerHTML = `<div data-fx></div><div style="position:relative"><div data-gl style="width:100%;aspect-ratio:4/5"></div><div data-hud style="${hud()}"></div>
          <div data-msg style="position:absolute;left:0;right:0;top:42%;text-align:center;color:#fff;font:800 20px sans-serif;text-shadow:0 2px 6px #000;pointer-events:none"></div></div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px"><button type="button" data-k="l" style="${SOFT}">◀</button><button type="button" data-k="u" style="${SOFT}">▲</button><button type="button" data-k="d" style="${SOFT}">▼</button><button type="button" data-k="r" style="${SOFT}">▶</button></div>
        <button type="button" data-cut style="${PRIMARY};width:100%;margin-top:6px">✂ 폐그물 끊기 (가까이서 누르고 있기)</button>
        <div style="font-size:12.5px;opacity:.8;margin-top:4px">앞으로 헤엄치며 쓰레기에 닿으면 자동 수거. 폐그물에 걸린 바다거북은 그물을 끊어 구조! 🫧 공기방울 고리로 산소 보충. (PC: 방향키 · Space)</div>`;
      sh.body.querySelector('[data-fx]').append(fxBar());
      const q = s => sh.body.querySelector(s), S = stage3d(q('[data-gl]'), 4 / 5), { THREE, scene, cam } = S;
      scene.background = new THREE.Color('#0B3A52'); scene.fog = new THREE.Fog('#0B3A52', 10, 90);
      const bed = new THREE.Mesh(new THREE.PlaneGeometry(200, 2000, 20, 200), new THREE.MeshLambertMaterial({ color: '#C2B280', flatShading: true })); bed.rotation.x = -Math.PI / 2; bed.position.y = -12; scene.add(bed);
      for (let i = 0; i < 6; i++) { const ray = new THREE.Mesh(new THREE.ConeGeometry(4, 40, 12, 1, true), new THREE.MeshBasicMaterial({ color: '#BFE9FF', transparent: true, opacity: .06, side: THREE.DoubleSide })); ray.position.set(rnd(-20, 20), 8, -i * 30); scene.add(ray); }
      const objs = [];
      const MAT = { bag: new THREE.MeshLambertMaterial({ color: '#F2F2F2', transparent: true, opacity: .85, side: THREE.DoubleSide }), bottle: new THREE.MeshLambertMaterial({ color: '#7FC8E8', transparent: true, opacity: .8 }),
        net: new THREE.MeshBasicMaterial({ color: '#C9D1D9', wireframe: true }), shell: new THREE.MeshLambertMaterial({ color: '#2F7D4A' }), ring: new THREE.MeshBasicMaterial({ color: '#BFF3FF', transparent: true, opacity: .7 }), rock: new THREE.MeshLambertMaterial({ color: '#5B6B6E', flatShading: true }) };
      let zHead = -20;
      function spawn() {
        const z = zHead - rnd(6, 14); zHead = z; const x = rnd(-8, 8), y = rnd(-8, 4), k = Math.random();
        let o;
        if (k < .35) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4, 3, 3), MAT.bag); m.position.set(x, y, z); o = { type: 'bag', m }; }
        else if (k < .6) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, 1.3, 8), MAT.bottle); m.rotation.z = 1.2; m.position.set(x, y, z); o = { type: 'bottle', m }; }
        else if (k < .8) { const g = new THREE.Group(); const net = new THREE.Mesh(new THREE.PlaneGeometry(6, 4, 8, 6), MAT.net); g.add(net); let turtle = null;
          if (Math.random() < .6) { turtle = new THREE.Group(); const sh2 = new THREE.Mesh(new THREE.SphereGeometry(.9, 12, 8), MAT.shell); sh2.scale.set(1.3, .5, 1); const hd = new THREE.Mesh(new THREE.SphereGeometry(.35, 8, 6), new THREE.MeshLambertMaterial({ color: '#8BBF7A' })); hd.position.set(1.3, 0, 0); turtle.add(sh2, hd); turtle.position.z = -.3; g.add(turtle); }
          g.position.set(x * .6, y, z); o = { type: 'net', m: g, hp: 1.2, turtle }; }
        else if (k < .9) { const m = new THREE.Mesh(new THREE.TorusGeometry(1.2, .15, 8, 24), MAT.ring); m.position.set(x, y, z); o = { type: 'ring', m }; }
        else { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(rnd(1.5, 3), 0), MAT.rock); m.position.set(x, -10 + rnd(0, 3), z); o = { type: 'rock', m }; }
        scene.add(o.m); objs.push(o);
      }
      for (let i = 0; i < 18; i++) spawn();
      const fishSchool = []; for (let i = 0; i < 20; i++) { const f = fishMesh(THREE, ['#FFCF3A', '#7FE0E0', '#FF8A5C'][i % 3], .5); f.position.set(rnd(-15, 15), rnd(-8, 6), rnd(-60, -10)); scene.add(f); fishSchool.push(f); }
      const keys = {}; let cut = false;
      sh.body.querySelectorAll('[data-k]').forEach(b => holdButton(b, () => keys[b.dataset.k] = true, () => keys[b.dataset.k] = false));
      holdButton(q('[data-cut]'), () => cut = true, () => cut = false);
      const kd = e => { const k = { ArrowLeft: 'l', ArrowRight: 'r', ArrowUp: 'u', ArrowDown: 'd' }[e.key]; if (k) { keys[k] = true; e.preventDefault(); } if (e.code === 'Space') { cut = true; e.preventDefault(); } };
      const ku = e => { const k = { ArrowLeft: 'l', ArrowRight: 'r', ArrowUp: 'u', ArrowDown: 'd' }[e.key]; if (k) keys[k] = false; if (e.code === 'Space') cut = false; };
      document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
      let t = 0, o2 = 100, score = 0, trashN = 0, nets = 0, turtles = 0, last = 0, raf = 0, alive = true, msgT = 0, px = 0, py = 0, pz = 0;
      const say = (m, s) => { q('[data-msg]').textContent = m; msgT = s || 1.3; };
      function end() {
        alive = false; S.dispose(); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku);
        finish(sh, onReward, 'diver3d', score, `${o2 <= 0 ? '🫧 산소가 떨어져 상승' : '⏱ 다이빙 완료'} · 쓰레기 ${trashN} · 폐그물 ${nets} · 🐢 바다거북 구조 ${turtles}`);
        const b = document.createElement('button'); b.type = 'button'; b.style.cssText = PRIMARY + ';width:100%;margin-top:8px'; b.textContent = '↻ 다시 잠수'; b.onclick = start; sh.body.append(b);
      }
      function frame(ts) {
        if (!alive) return;
        const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts; t += dt;
        const sx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0) + (opt.fx5 && tilt.ok ? tilt.x : 0), sy = (keys.u ? 1 : 0) - (keys.d ? 1 : 0) - (opt.fx5 && tilt.ok ? tilt.y : 0);
        px = clamp(px + sx * 7 * dt, -9, 9); py = clamp(py + sy * 6 * dt, -9, 5); pz -= (6 + t / 30) * dt;
        cam.position.set(px, py + Math.sin(t * 1.5) * .15, pz); cam.rotation.set(sy * .08, -sx * .1, sx * .05);
        o2 -= dt * (opt.fx4 ? 1.1 : .9);
        fishSchool.forEach((f, i) => { f.position.x += Math.sin(t + i) * dt * 2; if (f.position.z > pz + 5) f.position.z = pz - rnd(40, 70); f.rotation.y = Math.PI / 2 + Math.sin(t + i) * .3; });
        for (let i = objs.length - 1; i >= 0; i--) {
          const o = objs[i], d = o.m.position.distanceTo(cam.position);
          if (o.type === 'bag') o.m.rotation.x += dt; if (o.type === 'ring') o.m.rotation.y += dt * 2;
          if (o.type === 'net' && d < 6) { if (cut) { o.hp -= dt; vib(10); if (o.hp <= 0) { nets++; score += 30; if (o.turtle) { turtles++; score += 80; say('🐢 바다거북 구조! +110', 1.8); sfx('level'); vib([80, 40, 160]); } else { say('✂ 폐그물 제거 +30', 1.2); sfx('catch'); } scene.remove(o.m); objs.splice(i, 1); continue; } }
            else if (d < 3) { o2 -= dt * 6; if (msgT <= 0) say('그물에 걸렸어요! ✂ 끊기', 1); } }
          if ((o.type === 'bag' || o.type === 'bottle') && d < 2.2) { trashN++; score += 15; sfx('hit'); scene.remove(o.m); objs.splice(i, 1); continue; }
          if (o.type === 'ring' && d < 2.2) { o2 = Math.min(100, o2 + 25); sfx('catch'); say('🫧 산소 +25', .9); scene.remove(o.m); objs.splice(i, 1); continue; }
          if (o.m.position.z > pz + 6) { scene.remove(o.m); objs.splice(i, 1); }
        }
        while (objs.length < 18) spawn();
        q('[data-hud]').innerHTML = `<div>⏱ ${Math.max(0, 90 - t).toFixed(0)}초 · 점수 ${score} · 수심 ${Math.round(12 - py)}m</div><div style="display:flex;gap:6px;align-items:center">🫧 산소 <span style="display:inline-block;width:110px;height:8px;border-radius:4px;background:#0006;overflow:hidden"><i style="display:block;height:100%;width:${Math.max(0, o2)}%;background:${o2 < 30 ? '#FF5A4A' : '#7FE0E0'}"></i></span> · 🧹${trashN} ✂${nets} 🐢${turtles}</div>`;
        if (o2 < 25 && Math.floor(t * 2) % 4 === 0) vib(20);
        if (msgT > 0) { msgT -= dt; if (msgT <= 0) q('[data-msg]').textContent = ''; }
        S.r.render(scene, cam);
        if (t >= 90 || o2 <= 0) return end();
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
      game = { destroy() { alive = false; cancelAnimationFrame(raf); S.dispose(); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); } };
    }
    const b = document.createElement('button'); b.type = 'button'; b.style.cssText = PRIMARY + ';width:100%'; b.textContent = '🤿 잠수 시작 (90초)'; b.onclick = start; sh.body.append(b);
    return { destroy() { if (game) game.destroy(); } };
  }

  // ═════════ 5. 바다숲 가꾸기 3D: 해초 심기 · 계절 타임랩스 · 성게 관리 · 물고기 귀환 ═════════
  function kelp3d(container, onReward) {
    const sh = shell(container); if (!window.THREE) return no3d(sh);
    let game = null;
    function start() {
      sh.res.style.display = 'none';
      sh.body.innerHTML = `<div data-fx></div><div style="position:relative"><div data-gl style="width:100%;aspect-ratio:1/1"></div><div data-hud style="${hud()}"></div>
          <div data-msg style="position:absolute;left:0;right:0;bottom:12px;text-align:center;color:#fff;font:800 17px sans-serif;text-shadow:0 2px 6px #000;pointer-events:none"></div></div>
        <div style="font-size:12.5px;opacity:.8;margin-top:4px">바닥 칸을 눌러 🌱 해초를 심으세요(씨앗 1개). 계절이 흐르며 해초가 자라고 물고기가 돌아옵니다. 해초를 갉아먹는 🟣 성게는 눌러서 옮겨 주세요. 2년(8계절) 동안 바다숲을 키워요.</div>`;
      sh.body.querySelector('[data-fx]').append(fxBar());
      const q = s => sh.body.querySelector(s), S = stage3d(q('[data-gl]'), 1), { THREE, scene, cam, r } = S;
      scene.fog = new THREE.Fog('#0E5468', 30, 90);
      const N = 6, tiles = [], ray = new THREE.Raycaster(), mv = new THREE.Vector2();
      const sand = new THREE.MeshLambertMaterial({ color: '#C9B98C' });
      for (let i = 0; i < N * N; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(3.6, .4, 3.6), sand); m.position.set((i % N - (N - 1) / 2) * 4, -.2, (Math.floor(i / N) - (N - 1) / 2) * 4); m.userData.i = i; scene.add(m); tiles.push({ m, kelp: null, g: 0, urchin: null }); }
      cam.position.set(0, 20, 22); cam.lookAt(0, 0, 0);
      const fishes = [];
      const SEAS = [['봄', '#1E7A8C'], ['여름', '#1A8FA0'], ['가을', '#2A6E7C'], ['겨울', '#20506A']];
      let t = 0, seeds = 12, score = 0, removed = 0, last = 0, raf = 0, alive = true, msgT = 0, seasonI = -1, ang = 0;
      const say = (m, s) => { q('[data-msg]').textContent = m; msgT = s || 1.5; };
      function kelpMesh() { const g = new THREE.Group(); for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.08, .14, 1, 5), new THREE.MeshLambertMaterial({ color: k % 2 ? '#2F8F4E' : '#5DAE5B' })); b.position.set(rnd(-.8, .8), .5, rnd(-.8, .8)); b.userData.ph = rnd(0, 6); g.add(b); } return g; }
      r.domElement.addEventListener('pointerdown', e => {
        const b = r.domElement.getBoundingClientRect(); mv.set((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1); ray.setFromCamera(mv, cam);
        const urch = tiles.filter(x => x.urchin).map(x => x.urchin), hu = ray.intersectObjects(urch, true)[0];
        if (hu) { const tl = tiles.find(x => x.urchin && (x.urchin === hu.object || x.urchin === hu.object.parent)); if (tl) { scene.remove(tl.urchin); tl.urchin = null; removed++; score += 5; sfx('hit'); say('🟣 성게 옮김 +5', .9); } return; }
        const hit = ray.intersectObjects(tiles.map(x => x.m))[0]; if (!hit) return;
        const tl = tiles[hit.object.userData.i]; if (tl.kelp) return;
        if (seeds <= 0) { say('씨앗이 없어요 — 계절이 바뀌면 숲 크기만큼 씨앗을 얻어요', 1.6); return; }
        seeds--; tl.kelp = kelpMesh(); tl.kelp.position.copy(tl.m.position); tl.kelp.position.y = .1; tl.g = .3; tl.kelp.scale.set(1, tl.g, 1); scene.add(tl.kelp); sfx('catch'); vib(20);
      });
      function end() {
        alive = false; S.dispose();
        const alive2 = tiles.filter(x => x.kelp).length, fishN = fishes.length;
        finish(sh, onReward, 'kelp3d', score + alive2 * 10 + fishN * 5, `🌿 바다숲 ${alive2}/${N * N}칸 · 🐟 돌아온 물고기 ${fishN}마리 · 🟣 성게 ${removed}마리 옮김`);
        const b = document.createElement('button'); b.type = 'button'; b.style.cssText = PRIMARY + ';width:100%;margin-top:8px'; b.textContent = '↻ 새 바다숲'; b.onclick = start; sh.body.append(b);
      }
      function frame(ts) {
        if (!alive) return;
        const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts; t += dt;
        const si = Math.floor(t / 15);   // 4D 타임랩스: 15초 = 한 계절
        if (si !== seasonI) { seasonI = si; if (si >= 8) return end();
          const forest = tiles.filter(x => x.kelp).length, gain = 2 + Math.floor(forest / 2); if (si > 0) { seeds += gain; say(`${SEAS[si % 4][0]}이 왔어요 · 씨앗 +${gain}`, 2); } }
        const sc = SEAS[si % 4]; scene.background = new THREE.Color(opt.fx4 ? sc[1] : '#1E7A8C'); scene.fog.color.set(opt.fx4 ? sc[1] : '#1E7A8C');
        const grow = (si % 4 === 3 ? .02 : si % 4 === 1 ? .09 : .06) * (opt.fx4 ? 1 : .8);
        tiles.forEach(x => { if (!x.kelp) return;
          x.g = Math.min(4, x.g + grow * dt * (x.urchin ? -3 : 1));
          if (x.g <= .05) { scene.remove(x.kelp); x.kelp = null; if (x.urchin) { scene.remove(x.urchin); x.urchin = null; } return; }
          x.kelp.scale.y = x.g; x.kelp.children.forEach(b => b.rotation.z = Math.sin(t * 1.2 + b.userData.ph) * .15);
          if (!x.urchin && Math.random() < dt * .02 * (1 + t / 60)) { const u = new THREE.Mesh(new THREE.IcosahedronGeometry(.45, 0), new THREE.MeshLambertMaterial({ color: '#6A2C8C', flatShading: true })); u.position.copy(x.m.position); u.position.y = .4; u.position.x += .9; scene.add(u); x.urchin = u; } });
        const want = Math.floor(tiles.reduce((a, x) => a + (x.kelp ? x.g : 0), 0) * 1.2);
        while (fishes.length < want && fishes.length < 60) { const f = fishMesh(THREE, ['#FFCF3A', '#FF8A5C', '#7FE0E0', '#E8A0FF'][fishes.length % 4], .35); f.userData = { a: rnd(0, 6), r: rnd(3, 12), h: rnd(1.5, 6), s: rnd(.4, 1) }; scene.add(f); fishes.push(f); if (fishes.length % 5 === 0) sfx('hit'); }
        while (fishes.length > want + 3) scene.remove(fishes.pop());
        fishes.forEach(f => { const u = f.userData; u.a += dt * u.s; f.position.set(Math.cos(u.a) * u.r, u.h + Math.sin(t + u.a) * .3, Math.sin(u.a) * u.r); f.rotation.y = -u.a; });
        ang += dt * (opt.fx5 && tilt.ok ? tilt.x * .8 : .08); cam.position.set(Math.sin(ang) * 28, 20, Math.cos(ang) * 28); cam.lookAt(0, 0, 0);
        q('[data-hud]').innerHTML = `<div>${opt.fx4 ? '🗓 ' + (Math.floor(si / 4) + 1) + '년차 ' + sc[0] : '🗓 ' + (si + 1) + '번째 계절'} · ⏱ 다음 계절 ${Math.ceil(15 - t % 15)}초</div><div>🌱 씨앗 ${seeds} · 🌿 숲 ${tiles.filter(x => x.kelp).length}칸 · 🐟 ${fishes.length}마리 · 점수 ${score}</div>`;
        if (msgT > 0) { msgT -= dt; if (msgT <= 0) q('[data-msg]').textContent = ''; }
        S.r.render(scene, cam);
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
      game = { destroy() { alive = false; cancelAnimationFrame(raf); S.dispose(); } };
    }
    const b = document.createElement('button'); b.type = 'button'; b.style.cssText = PRIMARY + ';width:100%'; b.textContent = '🌿 바다숲 가꾸기 시작 (2년 · 120초)'; b.onclick = start; sh.body.append(b);
    return { destroy() { if (game) game.destroy(); } };
  }

  const LIST = [
    { id: 'boat3d', ic: '🛥️', name: '선상낚시 3D 「새벽 출항」', desc: '[4D·5D] 장비 궁합·어탐·새벽→한낮 시간 흐름·입질 진동', goal: 150, mount: boat3d, ctx: true },
    { id: 'rock3d', ic: '🪨', name: '갯바위 낚시 3D', desc: '[4D·5D] 찌낚시·파도 물보라·밀물 안전 철수·쓰레기 줍기', goal: 150, mount: rock3d, ctx: true },
    { id: 'tackle3d', ic: '🧰', name: '낚시 장비 공방 3D', desc: '[3D] 손님 주문대로 낚싯대·릴·줄·에기 조립 · 친환경 봉돌 보너스', goal: 200, mount: tackle3d },
    { id: 'diver3d', ic: '🤿', name: '바다 정화 다이버 3D', desc: '[4D·5D] 쓰레기 수거·폐그물 끊기·바다거북 구조·산소 관리', goal: 250, mount: diver3d },
    { id: 'kelp3d', ic: '🌿', name: '바다숲 가꾸기 3D', desc: '[4D 타임랩스] 해초 심기·계절이 흐르며 물고기 귀환·성게 관리', goal: 300, mount: kelp3d },
  ];
  if (window.GameHub) LIST.forEach(g => { if (GameHub.GNAME) GameHub.GNAME[g.id] = g.name; if (GameHub.GOAL) GameHub.GOAL[g.id] = g.goal; });
  window.Games3D = { LIST, TACKLE, compat, extra: (onReward, ctx) => LIST.map(g => ({ id: g.id, ic: g.ic, name: g.name, desc: g.desc, isNew: true, is3d: true, mount: el => g.mount(el, onReward, ctx) })) };
})();
