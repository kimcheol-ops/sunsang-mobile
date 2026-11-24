/* 🚀 우주 바다 올림픽 — 2026-11-24 사용자 요청
 *  「내가 그린 그림으로 게임 · 우주 바다 어종·괴물·우주 종족 캐릭터 · 우주 경주 차·바이크·스노보드 · 우주 올림픽 · 센서(5D) · 2D/3D 얼굴(사진 바로 찍기)」
 *  SpaceGames.extra(onReward) → 게임 메뉴 항목 4개. 끝나면 onReward({ game, score, coins })
 *  ① 🧬 우주 종족 만들기 — 바다 친구 100가지·내 그림 전시관 그림·내 얼굴 + 헬멧·더듬이·눈·촉수·날개·뿔 → 내 캐릭터(모든 게임에 등장)
 *  ② 🙂 얼굴 우주인 — 카메라로 바로 찍어(또는 사진 고르기) 2D 의상(우주인·인어·문어 괴물·선장) 입히고 3D로 돌려 보기
 *  ③ 🏁 우주 경주 — 🏎 우주 고속도로 · 🏍 토성 고리 바이크 · 🏂 혜성 설원 스노보드. 키보드·터치·폰 기울기(센서)로 조종
 *  ④ 🏅 우주 올림픽 — 별빛 달리기(번갈아 누르기·폰 흔들기) · 블랙홀 던지기 · 무중력 균형(기울기)
 *  · 5D 감각: 소리(직접 합성) · 진동 · 기울기·흔들기 센서. 사진·캐릭터는 이 기기에만 저장(어디에도 올리지 않음). 결제·광고 없음.
 *  · 장르만 빌렸고 이름·캐릭터·그림은 모두 이 앱 고유(코드로 그림).
 */
(function () {
  'use strict';
  const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } } };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const BTN = 'min-height:44px;border:0;border-radius:12px;font:700 14.5px inherit;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none;padding:0 12px';
  const PRI = BTN + ';background:linear-gradient(135deg,#7A5CFF,#E2572B);color:#fff', SOFT = BTN + ';background:#24344A;color:#E3EEF0';
  const CARD = 'padding:10px 12px;border-radius:14px;background:linear-gradient(135deg,#141C3C,#1F3A50);line-height:1.55;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)';
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; };
  const loadImg = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
  const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };

  /* ── 5D 소리(직접 합성) ── */
  let AC = null; const ac = () => { if (!AC) try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} if (AC && AC.state === 'suspended') AC.resume(); return AC; };
  function snd(kind) { const a = ac(); if (!a) return; const t = a.currentTime, o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination);
    const P = { star: ['triangle', 880, 1760, .12, .09], hit: ['sawtooth', 160, 60, .3, .12], go: ['square', 440, 880, .25, .06], win: ['triangle', 523, 1046, .5, .08], tick: ['sine', 660, 660, .05, .05], throw: ['sine', 300, 900, .4, .07] }[kind] || ['sine', 440, 440, .1, .05];
    o.type = P[0]; o.frequency.setValueAtTime(P[1], t); o.frequency.exponentialRampToValueAtTime(P[2], t + P[3]); g.gain.setValueAtTime(P[4], t); g.gain.exponentialRampToValueAtTime(.001, t + P[3] + .05); o.start(t); o.stop(t + P[3] + .1); }

  /* ── 센서: 기울기(좌우 -1~1, 앞뒤 -1~1) · 흔들기 ── */
  const sensor = { on: false, x: 0, y: 0, shake: 0, cb: null };
  function tiltOn(cb) { sensor.cb = cb || null; if (sensor.on) return Promise.resolve(true);
    const go = () => { sensor.on = true;
      window.addEventListener('deviceorientation', e => { if (e.gamma == null) return; sensor.x = Math.max(-1, Math.min(1, e.gamma / 30)); sensor.y = Math.max(-1, Math.min(1, (e.beta - 40) / 30)); });
      window.addEventListener('devicemotion', e => { const a = e.accelerationIncludingGravity || e.acceleration; if (!a || a.x == null) return; const m = Math.hypot(a.x, a.y, a.z); if (Math.abs(m - 9.8) > 6) { sensor.shake++; sensor.cb && sensor.cb('shake'); } });
      return true; };
    try { if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') return DeviceOrientationEvent.requestPermission().then(s => { if (s !== 'granted') return false; if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') DeviceMotionEvent.requestPermission().catch(() => {}); return go(); }).catch(() => false); } catch (e) {}
    return Promise.resolve(window.DeviceOrientationEvent ? go() : false); }

  /* ── 바다 친구 그림(ArtApp 100가지 또는 ArtLib 84가지) ── */
  const friends = () => (window.ArtApp && ArtApp.CR) || (window.ArtLib && ArtLib.items) || [];
  const svgOf = c => (window.ArtApp && ArtApp.svgOf) ? ArtApp.svgOf(c, null, { sw: 2.6 }) : `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${c.parts.map(p => `<path d="${p[1]}" fill="${p[2]}" stroke="#2A2A2A" stroke-width="2.6" stroke-linejoin="round"/>`).join('')}${c.lines.map(d => `<path d="${d}" fill="none" stroke="#2A2A2A" stroke-width="2" stroke-linecap="round"/>`).join('')}</svg>`;
  const svgUrl = c => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgOf(c));
  /* ── 내 그림 전시관(같은 기기 IndexedDB 'sea-art') ── */
  function myArt() { return new Promise(res => { try { const r = indexedDB.open('sea-art', 1); r.onupgradeneeded = () => r.result.createObjectStore('works', { keyPath: 'id' }); r.onerror = () => res([]);
    r.onsuccess = () => { try { const q = r.result.transaction('works').objectStore('works').getAll(); q.onsuccess = () => res(q.result.sort((a, b) => b.at - a.at).slice(0, 18)); q.onerror = () => res([]); } catch (e) { res([]); } }; } catch (e) { res([]); } }); }
  async function blobThumb(blob, S = 200) { const u = URL.createObjectURL(blob); try { const im = await loadImg(u), c = mk(S), g = c.getContext('2d'), k = Math.max(S / im.width, S / im.height); g.drawImage(im, (S - im.width * k) / 2, (S - im.height * k) / 2, im.width * k, im.height * k); return c.toDataURL('image/jpeg', .82); } finally { URL.revokeObjectURL(u); } }

  /* ═════════ 캐릭터 만들기(합성) ═════════ */
  const PARTS = [['helmet', '🫧 헬멧'], ['antenna', '📡 더듬이'], ['eyes', '👀 세 번째 눈'], ['tent', '🐙 촉수'], ['wings', '🪽 날개'], ['horns', '😈 뿔']];
  const AURA = ['#7A5CFF', '#3FC1E8', '#6FD3A4', '#F5C46B', '#FF6B8A', '#FFFFFF'];
  const PRESET = [['별빛 인어족', { helmet: 1, aura: '#3FC1E8' }], ['토성 갑각족', { horns: 1, antenna: 1, aura: '#F5C46B' }], ['혜성 두족류', { tent: 1, eyes: 1, aura: '#7A5CFF' }], ['블랙홀 괴물', { horns: 1, eyes: 1, tent: 1, aura: '#FF6B8A' }], ['은하 날개족', { wings: 1, antenna: 1, aura: '#6FD3A4' }]];
  async function compose(sp, S = 200) {
    const c = mk(S), g = c.getContext('2d'), k = S / 200, A = sp.aura || '#7A5CFF';
    const gr = g.createRadialGradient(100 * k, 100 * k, 10 * k, 100 * k, 100 * k, 98 * k); gr.addColorStop(0, A + 'AA'); gr.addColorStop(1, A + '00'); g.fillStyle = gr; g.fillRect(0, 0, S, S);
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (sp.wings) { g.fillStyle = A + 'CC'; g.strokeStyle = '#fff'; g.lineWidth = 2 * k; [[1], [-1]].forEach(([s]) => { g.beginPath(); g.moveTo(100 * k, 100 * k); g.quadraticCurveTo((100 + s * 96) * k, 20 * k, (100 + s * 92) * k, 110 * k); g.quadraticCurveTo((100 + s * 60) * k, 92 * k, 100 * k, 118 * k); g.fill(); g.stroke(); }); }
    if (sp.tent) { g.strokeStyle = A; g.lineWidth = 9 * k; for (let i = 0; i < 5; i++) { const x = (60 + i * 20) * k; g.beginPath(); g.moveTo(x, 140 * k); g.bezierCurveTo(x - 14 * k, 160 * k, x + 14 * k, 172 * k, x - 6 * k, 194 * k); g.stroke(); } }
    let im = null; try { im = await loadImg(sp.base === 'sea' ? svgUrl(friends().find(x => x.id === sp.ref) || friends()[0]) : sp.img); } catch (e) {}
    if (im) { if (sp.base === 'sea') g.drawImage(im, 22 * k, 22 * k, 156 * k, 156 * k);
      else { g.save(); g.beginPath(); g.arc(100 * k, 96 * k, 62 * k, 0, 7); g.clip(); g.drawImage(im, 38 * k, 34 * k, 124 * k, 124 * k); g.restore(); g.strokeStyle = '#fff'; g.lineWidth = 3 * k; g.beginPath(); g.arc(100 * k, 96 * k, 62 * k, 0, 7); g.stroke(); } }
    if (sp.horns) { g.fillStyle = '#E8D8B0'; g.strokeStyle = '#5A4630'; g.lineWidth = 2 * k; [[64, -1], [136, 1]].forEach(([x, s]) => { g.beginPath(); g.moveTo((x - 10) * k, 46 * k); g.quadraticCurveTo((x + s * 6) * k, 10 * k, (x + s * 22) * k, 8 * k); g.quadraticCurveTo((x + s * 8) * k, 26 * k, (x + 10) * k, 50 * k); g.closePath(); g.fill(); g.stroke(); }); }
    if (sp.antenna) { g.strokeStyle = '#2A2A3A'; g.lineWidth = 3 * k; [[82, 60], [118, 140]].forEach(([x, x2]) => { g.beginPath(); g.moveTo(x * k, 40 * k); g.quadraticCurveTo(x * k, 14 * k, x2 * k, 10 * k); g.stroke(); g.fillStyle = A; g.beginPath(); g.arc(x2 * k, 10 * k, 7 * k, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc((x2 - 2) * k, 8 * k, 2.4 * k, 0, 7); g.fill(); }); }
    if (sp.eyes) { g.fillStyle = '#fff'; g.strokeStyle = '#1A1A2A'; g.lineWidth = 2.5 * k; g.beginPath(); g.ellipse(100 * k, 44 * k, 13 * k, 10 * k, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = A; g.beginPath(); g.arc(100 * k, 45 * k, 6 * k, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(100 * k, 45 * k, 3 * k, 0, 7); g.fill(); }
    if (sp.helmet) { const hg = g.createRadialGradient(80 * k, 70 * k, 10 * k, 100 * k, 100 * k, 90 * k); hg.addColorStop(0, 'rgba(255,255,255,.28)'); hg.addColorStop(.7, 'rgba(160,220,255,.12)'); hg.addColorStop(1, 'rgba(160,220,255,.35)'); g.fillStyle = hg; g.beginPath(); g.arc(100 * k, 100 * k, 90 * k, 0, 7); g.fill(); g.strokeStyle = 'rgba(220,240,255,.9)'; g.lineWidth = 4 * k; g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 6 * k; g.beginPath(); g.arc(100 * k, 100 * k, 74 * k, 3.5, 4.3); g.stroke(); }
    return c;
  }
  const crew = () => LS.get('space.crew', []);
  const pickId = () => LS.get('space.pick', '');
  async function ensureCrew() { let cr = crew(); if (cr.length) return cr;
    const F = friends(), seeds = [['chamdom', '별빛 참돔족', { helmet: 1, aura: '#3FC1E8' }], ['octo', '혜성 문어족', { tent: 0, eyes: 1, antenna: 1, aura: '#7A5CFF' }], ['agui', '블랙홀 아귀 괴물', { horns: 1, eyes: 1, aura: '#FF6B8A' }]];
    for (const [ref, name, ex] of seeds) { if (!F.some(x => x.id === ref)) continue; const sp = Object.assign({ id: 'c' + ref, name, base: 'sea', ref }, ex); sp.thumb = (await compose(sp, 128)).toDataURL('image/png'); cr.push(sp); }
    LS.set('space.crew', cr); if (cr[0]) LS.set('space.pick', cr[0].id); return cr; }
  async function heroImg() { const cr = await ensureCrew(), h = cr.find(x => x.id === pickId()) || cr[0]; try { return { sp: h, im: await loadImg(h.thumb) }; } catch (e) { return { sp: h || { name: '우주인' }, im: null }; } }
  function crewBar(el, onPick) { const cr = crew(), cur = pickId();
    el.innerHTML = `<div style="display:flex;gap:6px;overflow:auto;padding:2px 0">${cr.map(c => `<button type="button" data-hero="${c.id}" title="${esc(c.name)}" style="flex:0 0 auto;width:64px;border-radius:12px;border:2px solid ${c.id === cur ? '#F5C46B' : 'transparent'};background:#0E1430;padding:2px;cursor:pointer;color:#DDE;font-size:10px"><img src="${c.thumb}" alt="" style="width:56px;height:56px;display:block">${esc(c.name.slice(0, 6))}</button>`).join('')}</div>`;
    el.querySelectorAll('[data-hero]').forEach(b => b.onclick = () => { LS.set('space.pick', b.dataset.hero); crewBar(el, onPick); onPick && onPick(); }); }

  /* ═════════ ① 🧬 우주 종족 만들기 ═════════ */
  function labGame(box, onReward) {
    const sp = { base: 'sea', ref: 'chamdom', aura: '#7A5CFF', name: '' }; let busy = false;
    box.innerHTML = `<div style="display:grid;gap:8px;grid-template-columns:minmax(0,1fr)">
      <div style="${CARD}">🧬 <b>우주 종족 연구소</b> — 바다 친구·<b>내가 그린 그림</b>·<b>내 얼굴</b>을 바탕으로 우주 종족을 만들어요. 만든 캐릭터는 우주 경주·올림픽에 나가요!</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:10px;align-items:start"><canvas data-pv width="400" height="400" style="width:100%;max-width:260px;margin:0 auto;aspect-ratio:1;border-radius:16px;background:radial-gradient(circle,#1C2A5A,#060B22)"></canvas>
        <div style="display:grid;gap:6px"><div style="display:flex;flex-wrap:wrap;gap:5px">${PRESET.map(([n], i) => `<button type="button" data-pre="${i}" style="${SOFT};min-height:36px;font-size:13px">${n}</button>`).join('')}</div>
          <div style="display:flex;flex-wrap:wrap;gap:5px">${PARTS.map(([k, l]) => `<button type="button" data-part="${k}" aria-pressed="false" style="${SOFT};min-height:36px;font-size:13px">${l}</button>`).join('')}</div>
          <div style="display:flex;gap:5px">${AURA.map(c => `<button type="button" data-aura="${c}" aria-label="빛 색" style="width:32px;height:32px;border-radius:50%;border:2px solid #fff3;background:${c};cursor:pointer"></button>`).join('')}</div></div></div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center"><b style="font-size:13px">바탕</b><select data-sea style="min-height:38px;border-radius:10px;max-width:170px">${friends().map(c => `<option value="${c.id}" ${c.id === sp.ref ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select><button type="button" data-art style="${SOFT}">🖼 내 그림에서</button><label style="${SOFT};display:inline-flex;align-items:center">🙂 얼굴 사진<input type="file" accept="image/*" capture="user" data-face hidden></label></div>
      <div data-arts style="display:none;gap:5px;flex-wrap:wrap"></div>
      <div style="display:flex;flex-wrap:wrap;gap:6px"><input data-name maxlength="12" placeholder="종족 이름 (예: 별빛 참돔족)" style="flex:1 1 160px;min-width:0;min-height:42px;border-radius:12px;border:1px solid #3A4A56;background:#0F1A22;color:inherit;padding:0 10px;font:inherit"><button type="button" data-save style="${PRI}">🚀 대원으로 등록</button></div>
      <div data-say style="font-size:13px;min-height:18px"></div><b style="font-size:13px">🛸 내 우주 대원 (눌러서 출전 대원 고르기)</b><div data-crew></div></div>`;
    const q = s => box.querySelector(s), cv = q('[data-pv]'), g = cv.getContext('2d'), say = t => q('[data-say]').innerHTML = t;
    async function draw() { if (busy) return; busy = true; try { const c = await compose(sp, 400); g.clearRect(0, 0, 400, 400); g.drawImage(c, 0, 0); } finally { busy = false; } }
    const syncParts = () => box.querySelectorAll('[data-part]').forEach(b => { const on = !!sp[b.dataset.part]; b.setAttribute('aria-pressed', on); b.style.background = on ? '#7A5CFF' : '#24344A'; });
    box.querySelectorAll('[data-pre]').forEach(b => b.onclick = () => { const [n, ex] = PRESET[+b.dataset.pre]; PARTS.forEach(([k]) => delete sp[k]); Object.assign(sp, ex); q('[data-name]').value = n; syncParts(); draw(); });
    box.querySelectorAll('[data-part]').forEach(b => b.onclick = () => { sp[b.dataset.part] = sp[b.dataset.part] ? 0 : 1; syncParts(); draw(); });
    box.querySelectorAll('[data-aura]').forEach(b => b.onclick = () => { sp.aura = b.dataset.aura; draw(); });
    q('[data-sea]').onchange = e => { sp.base = 'sea'; sp.ref = e.target.value; draw(); };
    q('[data-art]').onclick = async () => { const list = await myArt(), el = q('[data-arts]'); el.style.display = 'flex';
      if (!list.length) { el.innerHTML = '<span style="font-size:13px;opacity:.8">전시관에 그림이 아직 없어요. 「섬·바다 속 → 🎨 바다 그리기」에서 그리고 「전시관에 걸기」를 눌러 주세요.</span>'; return; }
      const urls = list.map(w => URL.createObjectURL(w.blob));
      el.innerHTML = list.map((w, i) => `<button type="button" data-w="${i}" style="width:60px;height:60px;padding:0;border:2px solid #3A4A56;border-radius:10px;overflow:hidden;cursor:pointer;background:#fff"><img src="${urls[i]}" alt="${esc(w.title)}" style="width:100%;height:100%;object-fit:cover"></button>`).join('');
      el.querySelectorAll('[data-w]').forEach(b => b.onclick = async () => { sp.base = 'img'; sp.img = await blobThumb(list[+b.dataset.w].blob); draw(); say(`🖼 「${esc(list[+b.dataset.w].title)}」을 바탕으로 썼어요.`); }); };
    q('[data-face]').onchange = async e => { const f = e.target.files[0]; if (!f) return; sp.base = 'img'; sp.img = await blobThumb(f); draw(); say('🙂 얼굴 사진은 이 기기에만 저장돼요.'); };
    q('[data-save]').onclick = async () => { const name = (q('[data-name]').value.trim() || '이름 없는 종족').slice(0, 12), c = await compose(sp, 128), item = Object.assign({}, sp, { id: 'c' + Date.now(), name, thumb: c.toDataURL('image/png') });
      if (item.img) item.img = item.img.slice(0, 60000);
      const cr = crew(); cr.unshift(item); while (cr.length > 12) cr.pop(); if (!LS.set('space.crew', cr)) { say('저장 공간이 부족해요. 오래된 대원을 지워 주세요.'); return; }
      LS.set('space.pick', item.id); crewBar(q('[data-crew]')); snd('win'); buzz(40); say(`🚀 「${esc(name)}」 대원 등록! 우주 경주·올림픽에 출전해요.`);
      try { onReward && onReward({ game: 'space-lab', score: 1, coins: 5 }); } catch (x) {} };
    ensureCrew().then(() => crewBar(q('[data-crew]'))); syncParts(); draw();
  }

  /* ═════════ ② 🙂 얼굴 우주인 (2D 의상 · 3D 돌려 보기) ═════════ */
  const SUITS = [['astro', '🧑‍🚀 우주인'], ['mermaid', '🧜 인어'], ['octo', '🐙 문어 괴물'], ['captain', '⚓ 선장']];
  function drawSuit(g, S, suit, face) { const k = S / 300; g.save(); g.scale(k, k);
    const bg = g.createLinearGradient(0, 0, 0, 300); bg.addColorStop(0, '#0B1230'); bg.addColorStop(1, '#2A1F5A'); g.fillStyle = bg; g.fillRect(0, 0, 300, 300);
    g.fillStyle = '#fff'; for (let i = 0; i < 40; i++) { g.globalAlpha = .3 + (i % 5) * .14; g.fillRect((i * 97) % 300, (i * 61) % 300, 2, 2); } g.globalAlpha = 1;
    const body = { astro: ['#E8ECF2', '#9AA6B4'], mermaid: ['#2BB5A8', '#137A72'], octo: ['#B04A8A', '#6A2A5A'], captain: ['#1F3A6A', '#0E1E3A'] }[suit];
    if (suit === 'octo') { g.strokeStyle = body[0]; g.lineWidth = 18; g.lineCap = 'round'; for (let i = 0; i < 6; i++) { const x = 70 + i * 32; g.beginPath(); g.moveTo(x, 200); g.bezierCurveTo(x - 30, 240, x + 30, 260, x - 10, 300); g.stroke(); } }
    g.fillStyle = body[0]; g.strokeStyle = body[1]; g.lineWidth = 4; g.beginPath();
    if (suit === 'mermaid') { g.moveTo(110, 200); g.quadraticCurveTo(90, 260, 150, 300); g.quadraticCurveTo(210, 260, 190, 200); }
    else { g.moveTo(70, 300); g.quadraticCurveTo(70, 200, 150, 196); g.quadraticCurveTo(230, 200, 230, 300); }
    g.closePath(); g.fill(); g.stroke();
    if (suit === 'astro') { g.fillStyle = '#E2572B'; g.fillRect(120, 230, 60, 26); g.fillStyle = '#3FC1E8'; g.fillRect(128, 236, 12, 12); g.fillStyle = '#F5C46B'; g.fillRect(146, 236, 12, 12); }
    if (suit === 'captain') { g.fillStyle = '#F5C46B'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(150, 230 + i * 20, 4, 0, 7); g.fill(); } }
    if (suit === 'mermaid') { g.fillStyle = '#F4A6B8'; g.beginPath(); g.ellipse(130, 214, 16, 11, 0, 0, 7); g.ellipse(170, 214, 16, 11, 0, 0, 7); g.fill(); }
    // 얼굴(원)
    g.save(); g.beginPath(); g.arc(150, 120, 74, 0, 7); g.clip(); if (face) g.drawImage(face, 76, 46, 148, 148); else { g.fillStyle = '#F2C9A8'; g.fillRect(70, 40, 160, 160); } g.restore();
    if (suit === 'astro') { const hg = g.createRadialGradient(120, 90, 10, 150, 120, 96); hg.addColorStop(0, 'rgba(255,255,255,.35)'); hg.addColorStop(.75, 'rgba(160,220,255,.08)'); hg.addColorStop(1, 'rgba(160,220,255,.4)'); g.fillStyle = hg; g.beginPath(); g.arc(150, 120, 92, 0, 7); g.fill(); g.strokeStyle = '#E8ECF2'; g.lineWidth = 10; g.stroke(); }
    if (suit === 'captain') { g.fillStyle = '#FFFFFF'; g.beginPath(); g.ellipse(150, 52, 84, 22, 0, 0, 7); g.fill(); g.fillStyle = '#1F3A6A'; g.fillRect(90, 50, 120, 12); g.fillStyle = '#F5C46B'; g.beginPath(); g.arc(150, 40, 9, 0, 7); g.fill(); }
    if (suit === 'mermaid') { g.fillStyle = '#FF7A59'; g.beginPath(); g.moveTo(70, 120); g.quadraticCurveTo(70, 30, 150, 34); g.quadraticCurveTo(230, 30, 230, 120); g.quadraticCurveTo(220, 60, 150, 50); g.quadraticCurveTo(80, 60, 70, 120); g.fill(); g.fillStyle = '#FFE08A'; g.beginPath(); g.arc(205, 62, 9, 0, 7); g.fill(); }
    if (suit === 'octo') { g.fillStyle = '#B04A8A'; g.beginPath(); g.ellipse(150, 44, 80, 34, 0, Math.PI, 0); g.fill(); g.fillStyle = '#fff'; [[118, 34], [182, 34]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 10, 0, 7); g.fill(); }); g.fillStyle = '#111'; [[118, 34], [182, 34]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 4.5, 0, 7); g.fill(); }); }
    if (suit === 'astro' || suit === 'octo') { g.strokeStyle = '#ccc'; g.lineWidth = 3; g.beginPath(); g.moveTo(210, 60); g.lineTo(236, 22); g.stroke(); g.fillStyle = '#FF5A4A'; g.beginPath(); g.arc(236, 20, 6, 0, 7); g.fill(); }
    g.restore(); }
  function faceGame(box, onReward) {
    let face = null, suit = 'astro', stream = null, spin = 0, raf = 0, auto = true, rx = 0, ry = 0;
    box.innerHTML = `<div style="display:grid;gap:8px;grid-template-columns:minmax(0,1fr)">
      <div style="${CARD}">🙂 <b>얼굴 우주인</b> — 카메라로 <b>바로 찍거나</b> 사진을 골라 우주 의상을 입혀요. 🧊 3D로 돌려 보고, 우주 대원으로 등록해 게임에 나가요. <span style="opacity:.8">사진은 이 기기 안에서만 쓰고 어디에도 올리지 않아요.</span></div>
      <div style="display:flex;flex-wrap:wrap;gap:6px"><button type="button" data-cam style="${PRI}">📷 카메라 켜기</button><button type="button" data-shot style="${PRI};display:none">⚪ 찰칵</button><label style="${SOFT};display:inline-flex;align-items:center">🖼 사진 고르기<input type="file" accept="image/*" data-file hidden></label></div>
      <div style="display:flex;flex-wrap:wrap;gap:5px">${SUITS.map(([k, l]) => `<button type="button" data-suit="${k}" style="${SOFT};min-height:36px">${l}</button>`).join('')}<button type="button" data-v="2" style="${SOFT};min-height:36px">🖼 2D</button><button type="button" data-v="3" style="${SOFT};min-height:36px">🧊 3D 돌리기</button></div>
      <div data-stage style="position:relative;width:min(100%,360px);aspect-ratio:1;margin:0 auto;perspective:800px">
        <video data-vid playsinline muted style="display:none;position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:50%;transform:scaleX(-1)"></video>
        <div data-card style="position:absolute;inset:0;transform-style:preserve-3d;transition:transform .08s"><canvas data-cv width="600" height="600" style="width:100%;height:100%;border-radius:20px;box-shadow:0 20px 40px rgba(0,0,0,.5);backface-visibility:hidden"></canvas>
          <div style="position:absolute;inset:0;border-radius:20px;background:linear-gradient(135deg,#2A1F5A,#0B1230);transform:rotateY(180deg);backface-visibility:hidden;display:grid;place-items:center;font:800 18px inherit;color:#F5C46B">🚀 출조 관제 우주 대원</div></div></div>
      <div style="display:flex;flex-wrap:wrap;gap:6px"><button type="button" data-crew style="${PRI}">🚀 우주 대원으로 등록</button><button type="button" data-keep style="${SOFT}">🖼 전시관에 걸기</button><button type="button" data-dl style="${SOFT}">⬇ 그림 파일</button></div><div data-say style="font-size:13px;min-height:18px"></div></div>`;
    const q = s => box.querySelector(s), cv = q('[data-cv]'), g = cv.getContext('2d'), vid = q('[data-vid]'), card = q('[data-card]'), say = t => q('[data-say]').innerHTML = t;
    const paint = () => drawSuit(g, 600, suit, face); paint();
    async function camOn() { try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 640 }, audio: false }); vid.srcObject = stream; vid.style.display = ''; card.style.opacity = .15; await vid.play(); q('[data-shot]').style.display = ''; say('얼굴을 동그라미 안에 맞추고 「찰칵」!'); }
      catch (e) { say('카메라를 켜지 못했어요. 「사진 고르기」로 해 보세요.'); } }
    const camOff = () => { if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; vid.style.display = 'none'; card.style.opacity = 1; q('[data-shot]').style.display = 'none'; };
    q('[data-cam]').onclick = camOn;
    q('[data-shot]').onclick = () => { const w = vid.videoWidth, h = vid.videoHeight, s = Math.min(w, h), c = mk(300), cg = c.getContext('2d'); cg.translate(300, 0); cg.scale(-1, 1); cg.drawImage(vid, (w - s) / 2, (h - s) / 2, s, s, 0, 0, 300, 300); face = c; camOff(); snd('star'); buzz(30); paint(); say('찰칵! 옷을 골라 입혀 보세요. 🧊 3D로 돌려 볼 수도 있어요.'); };
    q('[data-file]').onchange = async e => { const f = e.target.files[0]; if (!f) return; const u = await blobThumb(f, 300); face = await loadImg(u); paint(); say('사진을 넣었어요.'); };
    box.querySelectorAll('[data-suit]').forEach(b => b.onclick = () => { suit = b.dataset.suit; paint(); });
    function loop() { if (!box.isConnected) { camOff(); return; } if (auto) spin = (spin + 1.2) % 360; card.style.transform = `rotateY(${auto ? spin : ry}deg) rotateX(${rx}deg)`; raf = requestAnimationFrame(loop); }
    box.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { cancelAnimationFrame(raf); if (b.dataset.v === '3') { auto = true; tiltOn(); loop(); say('🧊 3D — 마우스를 올리거나 폰을 기울이면 따라 돌아요.'); } else { card.style.transform = ''; auto = false; } });
    q('[data-stage]').addEventListener('pointermove', e => { const r = e.currentTarget.getBoundingClientRect(); auto = false; ry = ((e.clientX - r.left) / r.width - .5) * 70; rx = -((e.clientY - r.top) / r.height - .5) * 40; });
    q('[data-stage]').addEventListener('pointerleave', () => { auto = true; });
    const iv = setInterval(() => { if (!box.isConnected) { clearInterval(iv); camOff(); return; } if (sensor.on && !auto) return; if (sensor.on && (Math.abs(sensor.x) > .05)) { auto = false; ry = sensor.x * 60; rx = -sensor.y * 30; } }, 60);
    q('[data-crew]').onclick = async () => { const c = mk(128); drawSuit(c.getContext('2d'), 128, suit, face); const item = { id: 'f' + Date.now(), name: (SUITS.find(s => s[0] === suit)[1].split(' ')[1] || '우주인') + ' 나', base: 'face', thumb: c.toDataURL('image/png') };
      const cr = crew(); cr.unshift(item); while (cr.length > 12) cr.pop(); if (!LS.set('space.crew', cr)) { say('저장 공간이 부족해요.'); return; } LS.set('space.pick', item.id); snd('win'); say('🚀 내 얼굴 대원 등록! 우주 경주·올림픽에 출전해요.'); try { onReward && onReward({ game: 'space-face', score: 1, coins: 5 }); } catch (x) {} };
    q('[data-keep]').onclick = () => cv.toBlob(async b => { if (window.ArtApp && ArtApp.galPut) { await ArtApp.galPut({ id: 'w' + Date.now(), at: Date.now(), title: '얼굴 우주인', kind: 'face', blob: b }); say('🖼 내 그림 전시관에 걸었어요.'); } else say('전시관은 「섬·바다 속」 화면에서 열 수 있어요. 「그림 파일」로 내려받아 주세요.'); }, 'image/png');
    q('[data-dl]').onclick = () => cv.toBlob(b => { const u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = `space-face-${Date.now()}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(u), 4000); }, 'image/png');
  }

  /* ═════════ ③ 🏁 우주 경주 (의사 3D 도로) ═════════ */
  const COURSES = { car: ['🏎 우주 고속도로', '#0B0F2E', '#2A1F5A', '#3A2E7A', '#4E3E9A', '#FF5AD8', '#7A5CFF'], bike: ['🏍 토성 고리 바이크', '#140E1E', '#4A3A2A', '#B8925A', '#D2AC6E', '#FFE08A', '#E8C24A'], board: ['🏂 혜성 설원 스노보드', '#0E2A4A', '#9FC8E8', '#E8F4FF', '#FFFFFF', '#3FC1E8', '#8CD6F2'] };
  function raceGame(box, onReward) {
    let veh = LS.get('space.veh', 'car');
    box.innerHTML = `<div style="display:grid;gap:8px;grid-template-columns:minmax(0,1fr)"><div style="${CARD}">🏁 <b>우주 경주</b> — 60초 동안 별을 모으고 소행성·우주 괴물을 피해요. ⬅➡ 키 · 화면 왼쪽/오른쪽 누르기 · <b>📱 폰 기울이기</b>로 조종!</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px">${Object.entries(COURSES).map(([k, v]) => `<button type="button" data-veh="${k}" style="${SOFT};min-height:38px;${k === veh ? 'background:#7A5CFF' : ''}">${v[0]}</button>`).join('')}<button type="button" data-tilt style="${SOFT};min-height:38px">📱 기울여 조종</button></div>
      <div data-crew></div>
      <canvas data-cv style="width:100%;max-width:420px;margin:0 auto;display:block;aspect-ratio:360/560;border-radius:16px;touch-action:none;background:#000"></canvas>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;max-width:420px;margin:0 auto;width:100%"><button type="button" data-l style="${SOFT};min-height:54px;font-size:22px">⬅</button><button type="button" data-go style="${PRI}">▶ 출발</button><button type="button" data-r style="${SOFT};min-height:54px;font-size:22px">➡</button></div>
      <div data-end style="display:none;${CARD}"></div></div>`;
    const q = s => box.querySelector(s), cv = q('[data-cv]'), W = 360, H = 560, dpr = Math.min(2, devicePixelRatio || 1); cv.width = W * dpr; cv.height = H * dpr; const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    let hero = null, run = null, keys = { l: 0, r: 0 }, useTilt = false, objIm = {};
    const loadHero = async () => { hero = await heroImg(); drawIdle(); };
    crewBar(q('[data-crew]'), loadHero); ensureCrew().then(() => { crewBar(q('[data-crew]'), loadHero); loadHero(); });
    // 우주 바다 생물 장애물·별(바다 친구 그림)
    ['agui', 'jelly', 'gomchi', 'seongge', 'shark'].forEach(id => { const c = friends().find(x => x.id === id); if (c) loadImg(svgUrl(c)).then(im => objIm[id] = im).catch(() => {}); });
    box.querySelectorAll('[data-veh]').forEach(b => b.onclick = () => { veh = b.dataset.veh; LS.set('space.veh', veh); box.querySelectorAll('[data-veh]').forEach(x => x.style.background = x === b ? '#7A5CFF' : '#24344A'); drawIdle(); });
    q('[data-tilt]').onclick = async () => { useTilt = await tiltOn(); q('[data-tilt]').textContent = useTilt ? '📱 기울기 켬' : '📱 이 기기는 기울기 없음'; };
    const hold = (el, k) => { el.onpointerdown = e => { e.preventDefault(); keys[k] = 1; }; el.onpointerup = el.onpointerleave = el.onpointercancel = () => keys[k] = 0; };
    hold(q('[data-l]'), 'l'); hold(q('[data-r]'), 'r');
    cv.onpointerdown = e => { const r = cv.getBoundingClientRect(); keys[(e.clientX - r.left) < r.width / 2 ? 'l' : 'r'] = 1; }; cv.onpointerup = cv.onpointerleave = cv.onpointercancel = () => keys.l = keys.r = 0;
    const kd = e => { if (!box.isConnected) { removeEventListener('keydown', kd); removeEventListener('keyup', ku); return; } if (e.key === 'ArrowLeft' || e.key === 'a') { keys.l = 1; e.preventDefault(); } if (e.key === 'ArrowRight' || e.key === 'd') { keys.r = 1; e.preventDefault(); } };
    const ku = e => { if (e.key === 'ArrowLeft' || e.key === 'a') keys.l = 0; if (e.key === 'ArrowRight' || e.key === 'd') keys.r = 0; };
    addEventListener('keydown', kd); addEventListener('keyup', ku);
    const HZ = 210;
    function scene(st) { const C = COURSES[veh], t = st.pos;
      const sk = g.createLinearGradient(0, 0, 0, HZ); sk.addColorStop(0, C[1]); sk.addColorStop(1, C[2]); g.fillStyle = sk; g.fillRect(0, 0, W, HZ);
      g.fillStyle = '#fff'; for (let i = 0; i < 50; i++) { g.globalAlpha = .3 + (i % 4) * .18; g.fillRect((i * 83 + st.bg * 0.2) % W, (i * 37) % (HZ - 20), 1.5, 1.5); } g.globalAlpha = 1;
      if (veh === 'bike') { g.save(); g.translate(W * .7 - st.bg * .05 % 40, 80); g.fillStyle = '#E8C24A'; g.beginPath(); g.arc(0, 0, 34, 0, 7); g.fill(); g.strokeStyle = '#F5E0A0'; g.lineWidth = 5; g.beginPath(); g.ellipse(0, 0, 66, 14, -.3, 0, 7); g.stroke(); g.restore(); }
      else if (veh === 'car') { g.fillStyle = '#7A5CFF'; g.beginPath(); g.arc(70, 90, 26, 0, 7); g.fill(); g.fillStyle = '#3FC1E8'; g.beginPath(); g.arc(80, 84, 8, 0, 7); g.fill(); }
      else { g.fillStyle = '#BFE8FF'; g.beginPath(); g.moveTo(0, HZ); g.lineTo(80, 120); g.lineTo(150, HZ); g.moveTo(140, HZ); g.lineTo(240, 100); g.lineTo(360, HZ); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(300, 60, 10, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(300, 60); g.lineTo(240, 30); g.stroke(); }
      // 도로(줄마다 원근)
      let dx = 0, x = W / 2;
      for (let y = H; y > HZ; y -= 3) { const p = (y - HZ) / (H - HZ), z = 1 / Math.max(.02, p), half = 30 + p * 170;
        x = W / 2 - st.px * half * .9 + st.curve(t + 6) * (1 - p) * (1 - p) * 150;
        const stripe = Math.floor((z * 6 + t * .35)) % 2;
        g.fillStyle = stripe ? C[3] : C[2]; g.fillRect(0, y - 3, W, 3);
        g.fillStyle = stripe ? C[4] : C[3]; g.fillRect(x - half, y - 3, half * 2, 3);
        g.fillStyle = stripe ? C[5] : C[6]; g.fillRect(x - half - half * .08, y - 3, half * .08, 3); g.fillRect(x + half, y - 3, half * .08, 3);
        if (stripe && veh !== 'board') { g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(x - half * .015, y - 3, half * .03, 3); }
        st.rows[y] = [x, half]; }
    }
    function proj(st, o) { const z = o.z - st.pos; if (z <= 0.5 || z > 60) return null; const p = Math.min(1, 1 / (z / 3.2)); const y = HZ + p * (H - HZ); const row = st.rows[Math.round(y / 3) * 3] || st.rows[Math.round(y / 3) * 3 + 1] || st.rows[Math.round(y / 3) * 3 - 1]; if (!row) return null; return { x: row[0] + o.lx * row[1] * .8, y, s: .25 + p * 1.4, p }; }
    function drawVehicle(x, y, tilt) { g.save(); g.translate(x, y); g.rotate(tilt * .18);
      if (veh === 'car') { g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(0, 18, 46, 9, 0, 0, 7); g.fill(); g.fillStyle = '#FF5AD8'; g.beginPath(); g.moveTo(-44, 12); g.lineTo(-36, -8); g.lineTo(36, -8); g.lineTo(44, 12); g.closePath(); g.fill(); g.fillStyle = '#7A5CFF'; g.fillRect(-46, 10, 92, 10); g.fillStyle = '#3FC1E8'; g.fillRect(-40, 18, 14, 5); g.fillRect(26, 18, 14, 5); g.fillStyle = '#FFE08A'; g.fillRect(-30, 12, 10, 4); g.fillRect(20, 12, 10, 4); }
      else if (veh === 'bike') { g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(0, 22, 24, 7, 0, 0, 7); g.fill(); g.fillStyle = '#E8C24A'; g.beginPath(); g.moveTo(-14, 16); g.lineTo(0, -6); g.lineTo(14, 16); g.closePath(); g.fill(); g.fillStyle = '#222'; g.fillRect(-6, 10, 12, 16); g.fillStyle = '#FF5A4A'; g.fillRect(-26, -4, 52, 5); }
      else { g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(0, 20, 44, 7, 0, 0, 7); g.fill(); g.fillStyle = '#FF5A4A'; g.beginPath(); g.ellipse(0, 14, 46, 8, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.fillRect(-30, 12, 60, 3); }
      if (hero && hero.im) g.drawImage(hero.im, -32, veh === 'car' ? -66 : -70, 64, 64);
      g.restore(); }
    function drawIdle() { const st = { pos: 0, bg: 0, px: 0, curve: () => 0, rows: {} }; scene(st); drawVehicle(W / 2, H - 70, 0);
      g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(30, 250, 300, 70); g.fillStyle = '#fff'; g.font = "800 20px 'Noto Sans KR',sans-serif"; g.textAlign = 'center'; g.fillText(COURSES[veh][0], W / 2, 280); g.font = "14px 'Noto Sans KR',sans-serif"; g.fillText(`${hero && hero.sp ? hero.sp.name : '내 대원'} 출전 · ▶ 출발을 눌러요`, W / 2, 306); }
    function start() { q('[data-end]').style.display = 'none'; ac(); snd('go');
      const objs = []; for (let i = 0; i < 70; i++) objs.push({ z: 14 + i * 7 + Math.random() * 4, lx: (Math.random() * 2 - 1) * .9, kind: Math.random() < .55 ? 'star' : ['agui', 'jelly', 'gomchi', 'seongge', 'shark', 'rock'][i % 6] });
      run = { pos: 0, bg: 0, px: 0, v: 0, speed: 8, t0: performance.now(), stars: 0, hits: 0, objs, rows: {}, curve: p => Math.sin(p * .045) * .9 + Math.sin(p * .013) * .6, last: performance.now(), slow: 0 };
      cancelAnimationFrame(run.raf); frame(); }
    function frame() { if (!box.isConnected || !run) return; const st = run, now = performance.now(), dt = Math.min(.05, (now - st.last) / 1000); st.last = now;
      const left = 60 - (now - st.t0) / 1000; if (left <= 0) return end();
      let steer = (keys.r - keys.l); if (useTilt && sensor.on) steer += sensor.x * 1.6;
      st.px = Math.max(-1.15, Math.min(1.15, st.px + steer * dt * 1.9 - st.curve(st.pos) * dt * .55));
      st.speed = Math.min(26, st.speed + dt * .35) * (st.slow > 0 ? .985 : 1); st.slow -= dt; st.pos += st.speed * dt; st.bg += st.curve(st.pos) * 20 * dt;
      g.clearRect(0, 0, W, H); scene(st);
      st.objs.filter(o => !o.gone).map(o => [o, proj(st, o)]).filter(a => a[1]).sort((a, b) => a[1].y - b[1].y).forEach(([o, pr]) => {
        const sz = 34 * pr.s; if (o.kind === 'star') { g.save(); g.translate(pr.x, pr.y - sz * .6); g.rotate(st.pos * .1); g.fillStyle = '#FFE08A'; g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? sz * .22 : sz * .5, a = i * Math.PI / 5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill(); g.restore(); }
        else if (o.kind === 'rock' || !objIm[o.kind]) { g.fillStyle = '#6A5A7A'; g.beginPath(); g.arc(pr.x, pr.y - sz * .4, sz * .45, 0, 7); g.fill(); g.fillStyle = '#4A3E5A'; g.beginPath(); g.arc(pr.x - sz * .12, pr.y - sz * .5, sz * .12, 0, 7); g.fill(); }
        else { g.save(); g.shadowColor = '#FF5AD8'; g.shadowBlur = 10; g.drawImage(objIm[o.kind], pr.x - sz * .7, pr.y - sz * 1.3, sz * 1.4, sz * 1.4); g.restore(); }
        if (pr.p > .93 && !o.gone) { const px = W / 2; if (Math.abs(pr.x - px) < 40) { o.gone = 1; if (o.kind === 'star') { st.stars++; snd('star'); } else { st.hits++; st.slow = 1.2; st.speed *= .6; snd('hit'); buzz([60, 30, 60]); } } } });
      drawVehicle(W / 2, H - 70, steer);
      g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 0, W, 34); g.fillStyle = '#fff'; g.font = "700 14px 'Noto Sans KR',sans-serif"; g.textAlign = 'left'; g.fillText(`⏱ ${left.toFixed(1)}  ⭐ ${st.stars}  💥 ${st.hits}`, 10, 22); g.textAlign = 'right'; g.fillText(`${Math.round(st.speed * 12)} km/s`, W - 10, 22);
      st.raf = requestAnimationFrame(frame); }
    function end() { const st = run; run = null; const dist = Math.round(st.pos * 10), score = st.stars * 50 + dist - st.hits * 30, coins = Math.max(1, Math.min(60, Math.round(score / 120))), key = 'space.race.' + veh, best = LS.get(key, 0);
      if (score > best) LS.set(key, score); snd('win'); buzz(80);
      const e = q('[data-end]'); e.style.display = 'block'; e.innerHTML = `🏁 <b>${COURSES[veh][0]} 완주!</b><br>⭐ 별 ${st.stars} · 거리 ${dist} · 💥 ${st.hits} → <b>${score}점</b> ${score > best ? '🎉 새 최고 기록!' : `(최고 ${best})`}<br>🪙 ${coins}코인`;
      try { onReward && onReward({ game: 'space-race', score, coins }); } catch (x) {} }
    q('[data-go]').onclick = start;
  }

  /* ═════════ ④ 🏅 우주 올림픽 ═════════ */
  function olympicGame(box, onReward) {
    box.innerHTML = `<div style="display:grid;gap:8px;grid-template-columns:minmax(0,1fr)"><div style="${CARD}">🏅 <b>우주 바다 올림픽</b> — 세 종목에 내 대원이 출전해요. <b>📱 폰을 흔들거나 기울이면</b> 센서로도 할 수 있어요.</div><div data-crew></div>
      <div style="display:flex;flex-wrap:wrap;gap:5px"><button type="button" data-ev="run" style="${PRI}">🏃 별빛 달리기</button><button type="button" data-ev="throw" style="${PRI}">🎯 블랙홀 던지기</button><button type="button" data-ev="bal" style="${PRI}">🧘 무중력 균형</button><button type="button" data-tilt style="${SOFT}">📱 센서 켜기</button></div>
      <canvas data-cv style="width:100%;max-width:440px;margin:0 auto;display:block;aspect-ratio:400/300;border-radius:16px;background:#060B22;touch-action:none"></canvas>
      <div data-ctl style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap"></div><div data-say style="${CARD}"></div><div data-medal style="font-size:14px"></div></div>`;
    const q = s => box.querySelector(s), cv = q('[data-cv]'), W = 400, H = 300, dpr = Math.min(2, devicePixelRatio || 1); cv.width = W * dpr; cv.height = H * dpr; const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const say = t => q('[data-say]').innerHTML = t, ctl = q('[data-ctl]');
    let hero = null, raf = 0; const loadHero = async () => { hero = await heroImg(); idle(); };
    ensureCrew().then(() => { crewBar(q('[data-crew]'), loadHero); loadHero(); });
    const medals = () => LS.get('space.olympic', {}), MED = s => s >= 3 ? '🥇' : s >= 2 ? '🥈' : s >= 1 ? '🥉' : '—';
    const showMedals = () => { const m = medals(); q('[data-medal]').innerHTML = `내 메달: 🏃 ${MED(m.run || 0)} · 🎯 ${MED(m.throw || 0)} · 🧘 ${MED(m.bal || 0)}`; };
    function award(ev, lv, score, msg) { const m = medals(); if ((m[ev] || 0) < lv) { m[ev] = lv; LS.set('space.olympic', m); } showMedals(); snd(lv ? 'win' : 'tick'); buzz(lv ? [50, 40, 90] : 30);
      say(`${msg}<br><b style="font-size:22px">${MED(lv)}</b> ${['아쉬워요, 다시 도전!', '동메달', '은메달', '금메달!'][lv]}`); try { onReward && onReward({ game: 'space-olympic', score, coins: [1, 5, 10, 18][lv] }); } catch (x) {} }
    function bg() { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#060B22'); gr.addColorStop(1, '#2A1F5A'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.fillStyle = '#fff'; for (let i = 0; i < 40; i++) { g.globalAlpha = .3 + (i % 4) * .15; g.fillRect((i * 97) % W, (i * 41) % H, 1.6, 1.6); } g.globalAlpha = 1; }
    const heroAt = (x, y, s = 60, rot = 0) => { g.save(); g.translate(x, y); g.rotate(rot); if (hero && hero.im) g.drawImage(hero.im, -s / 2, -s / 2, s, s); else { g.fillStyle = '#F5C46B'; g.beginPath(); g.arc(0, 0, s / 3, 0, 7); g.fill(); } g.restore(); };
    function idle() { cancelAnimationFrame(raf); bg(); heroAt(W / 2, 150, 110); g.fillStyle = '#fff'; g.font = "800 18px 'Noto Sans KR',sans-serif"; g.textAlign = 'center'; g.fillText(`${hero && hero.sp ? hero.sp.name : '내 대원'} 출전 준비!`, W / 2, 250); ctl.innerHTML = ''; showMedals(); say('종목을 골라요.'); }
    q('[data-tilt]').onclick = async () => { const ok = await tiltOn(() => { if (cur && cur.onShake) cur.onShake(); }); q('[data-tilt]').textContent = ok ? '📱 센서 켬' : '📱 센서 없음(버튼으로)'; };
    let cur = null;
    // 🏃 별빛 달리기: ◀▶ 번갈아 누르기 / 폰 흔들기 — 상대 2명(우주 바다 종족)과 100m
    function runEv() { cancelAnimationFrame(raf); let me = 0, rivals = [0, 0], last = '', t0 = 0, done = false; const sp = [.95 + Math.random() * .25, 1.05 + Math.random() * .25];
      const step = side => { if (done) return; if (!t0) t0 = performance.now(); if (side !== last) { me += 1.6; last = side; snd('tick'); } };
      cur = { onShake: () => { if (!t0) t0 = performance.now(); me += 1.4; } };
      ctl.innerHTML = `<button type="button" data-a style="${PRI};min-width:110px;min-height:60px">◀ 왼발</button><button type="button" data-b style="${PRI};min-width:110px;min-height:60px">오른발 ▶</button>`;
      ctl.querySelector('[data-a]').onpointerdown = () => step('a'); ctl.querySelector('[data-b]').onpointerdown = () => step('b');
      const kd = e => { if (!box.isConnected) return removeEventListener('keydown', kd); if (e.key === 'ArrowLeft' || e.key === 'a') step('a'); if (e.key === 'ArrowRight' || e.key === 'l') step('b'); }; addEventListener('keydown', kd);
      say('◀▶를 번갈아 빠르게! (키보드 ←→, 폰은 흔들어도 돼요)');
      const loop = () => { if (!box.isConnected) return; const t = t0 ? (performance.now() - t0) / 1000 : 0; if (t0) rivals = rivals.map((r, i) => Math.min(100, t * 8.4 * sp[i]));
        bg(); g.strokeStyle = 'rgba(255,255,255,.25)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(20, 110 + i * 60); g.lineTo(380, 110 + i * 60); g.stroke(); } g.fillStyle = '#FFE08A'; g.fillRect(372, 60, 6, 190);
        const xs = [me, ...rivals].map(v => 30 + Math.min(100, v) * 3.4); heroAt(xs[0], 85, 52, Math.sin(me) * .2);
        ['🐙', '🦈'].forEach((e, i) => { g.font = '36px sans-serif'; g.textAlign = 'center'; g.fillText(e, xs[i + 1], 158 + i * 60); });
        g.fillStyle = '#fff'; g.font = "700 14px 'Noto Sans KR',sans-serif"; g.textAlign = 'left'; g.fillText(`⏱ ${t.toFixed(2)}초 · ${Math.min(100, me).toFixed(0)}m`, 12, 24);
        if (me >= 100 && !done) { done = true; const place = 1 + rivals.filter(r => r >= 100).length; award('run', place === 1 ? (t < 9 ? 3 : 2) : place === 2 ? 1 : 0, Math.round(1000 / t), `🏃 ${t.toFixed(2)}초로 결승! ${place}등`); removeEventListener('keydown', kd); return; }
        raf = requestAnimationFrame(loop); }; loop(); }
    // 🎯 블랙홀 던지기: 힘 → 각도 타이밍, 낮은 중력으로 날아감
    function throwEv() { cancelAnimationFrame(raf); let phase = 'pow', pow = 0, ang = 0, t = 0, ball = null; cur = { onShake: () => press() };
      ctl.innerHTML = `<button type="button" data-p style="${PRI};min-width:200px;min-height:60px">✋ 멈춰!</button>`; ctl.querySelector('[data-p]').onpointerdown = () => press();
      say('① 힘 막대가 꽉 찰 때 「멈춰!」 ② 각도가 45° 근처일 때 「멈춰!」 (폰을 흔들어도 돼요)');
      cv._t = () => ({ phase, pow, ang, ball });   // 시험용
      function press() { if (phase === 'pow') { phase = 'ang'; snd('tick'); } else if (phase === 'ang') { phase = 'fly'; snd('throw'); buzz(40); const v = 6 + pow * 9; ball = { x: 50, y: 230, vx: Math.cos(ang) * v, vy: -Math.sin(ang) * v, d: 0 }; } }
      let lt = performance.now(); const loop = () => { if (!box.isConnected) return; const now = performance.now(), f = Math.min(3, (now - lt) / 16.7); lt = now; t += f / 60; bg();
        g.fillStyle = '#000'; g.beginPath(); g.arc(360, 70, 26, 0, 7); g.fill(); g.strokeStyle = '#FF5AD8'; g.lineWidth = 3; g.beginPath(); g.ellipse(360, 70, 44, 12, -.3, 0, 7); g.stroke();
        g.fillStyle = '#3A2E7A'; g.fillRect(0, 250, W, 50);
        if (phase === 'pow') pow = (Math.sin(t * 4) + 1) / 2; if (phase === 'ang') ang = (Math.sin(t * 3) + 1) / 2 * (Math.PI / 2);
        g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(20, 20, 160, 14); g.fillStyle = '#FFE08A'; g.fillRect(20, 20, 160 * pow, 14);
        g.strokeStyle = '#3FC1E8'; g.lineWidth = 4; g.beginPath(); g.moveTo(50, 230); g.lineTo(50 + Math.cos(ang) * 60, 230 - Math.sin(ang) * 60); g.stroke();
        heroAt(40, 215, 54);
        if (ball) { ball.x += ball.vx * .6 * f; ball.y += ball.vy * .6 * f; ball.vy += .09 * f; ball.d = (ball.x - 50) / 3;
          g.fillStyle = '#7A5CFF'; g.beginPath(); g.arc(ball.x % W, ball.y, 10, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = "700 14px 'Noto Sans KR',sans-serif"; g.fillText(`${ball.d.toFixed(1)}m`, 200, 24);
          if (ball.y > 250) { const d = ball.d; award('throw', d > 380 ? 3 : d > 300 ? 2 : d > 200 ? 1 : 0, Math.round(d * 10), `🎯 ${d.toFixed(1)}m 던졌어요! (힘 ${Math.round(pow * 100)}% · ${Math.round(ang * 180 / Math.PI)}°)`); ctl.innerHTML = ''; return; } }
        raf = requestAnimationFrame(loop); }; loop(); }
    // 🧘 무중력 균형: 바람에 밀리는 대원을 가운데 원 안에 15초 — 기울기·마우스·◀▶
    function balEv() { cancelAnimationFrame(raf); let x = W / 2, y = 150, vx = 0, vy = 0, inT = 0, T = 0, mx = null, my = null, kx = 0; cur = null;
      ctl.innerHTML = `<button type="button" data-l style="${SOFT};min-width:90px;min-height:54px">◀</button><button type="button" data-r style="${SOFT};min-width:90px;min-height:54px">▶</button>`;
      ctl.querySelector('[data-l]').onpointerdown = () => kx = -1; ctl.querySelector('[data-r]').onpointerdown = () => kx = 1; ctl.querySelectorAll('button').forEach(b => b.onpointerup = b.onpointerleave = () => kx = 0);
      cv.onpointermove = e => { const r = cv.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width * W; my = (e.clientY - r.top) / r.height * H; }; cv.onpointerleave = () => mx = my = null;
      say('우주 바람이 불어요! 가운데 빛나는 원 안에 머물러요. 📱 폰 기울이기 · 🖱 마우스 따라오기 · ◀▶');
      let last = performance.now();
      const loop = () => { if (!box.isConnected) return; const now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now; T += dt;
        const wind = Math.sin(T * 1.3) * 150 + Math.sin(T * 3.1) * 70, windY = Math.cos(T * 1.7) * 90;
        let ax = wind + kx * 160, ay = windY; if (sensor.on) { ax += sensor.x * 220; ay += sensor.y * 160; } if (mx != null) { ax += (mx - x) * 2.2; ay += (my - y) * 2.2; }
        vx = (vx + ax * dt) * .97; vy = (vy + ay * dt) * .97; x = Math.max(20, Math.min(W - 20, x + vx * dt)); y = Math.max(40, Math.min(H - 20, y + vy * dt));
        const inside = Math.hypot(x - W / 2, y - 150) < 46; if (inside) inT += dt;
        bg(); const pul = 46 + Math.sin(T * 4) * 3; g.strokeStyle = inside ? '#6FD3A4' : '#FF6B8A'; g.lineWidth = 4; g.beginPath(); g.arc(W / 2, 150, pul, 0, 7); g.stroke(); g.fillStyle = inside ? 'rgba(111,211,164,.15)' : 'rgba(255,107,138,.08)'; g.fill();
        g.strokeStyle = 'rgba(160,220,255,.35)'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { const yy = 40 + i * 45; g.beginPath(); g.moveTo((T * 120 * Math.sign(wind) + i * 70) % W, yy); g.lineTo((T * 120 * Math.sign(wind) + i * 70) % W + 30 * Math.sign(wind), yy); g.stroke(); }
        heroAt(x, y, 58, vx * .004);
        g.fillStyle = '#fff'; g.font = "700 14px 'Noto Sans KR',sans-serif"; g.textAlign = 'left'; g.fillText(`⏱ ${Math.max(0, 15 - T).toFixed(1)}초 · 균형 ${inT.toFixed(1)}초`, 12, 24);
        if (T >= 15) { cv.onpointermove = null; ctl.innerHTML = ''; award('bal', inT > 11 ? 3 : inT > 8 ? 2 : inT > 5 ? 1 : 0, Math.round(inT * 100), `🧘 15초 중 ${inT.toFixed(1)}초 균형!`); return; }
        raf = requestAnimationFrame(loop); }; loop(); }
    box.querySelectorAll('[data-ev]').forEach(b => b.onclick = () => { ac(); ({ run: runEv, throw: throwEv, bal: balEv })[b.dataset.ev](); });
  }

  const LIST = [
    { id: 'space-lab', ic: '🧬', name: '우주 종족 만들기', desc: '바다 친구·내 그림·내 얼굴로 우주 종족·괴물 캐릭터를!', mount: labGame },
    { id: 'space-face', ic: '🙂', name: '얼굴 우주인', desc: '카메라로 바로 찍어 2D 의상 입히고 3D로 돌려 보기', mount: faceGame },
    { id: 'space-race', ic: '🏁', name: '우주 경주', desc: '우주 고속도로·토성 고리 바이크·혜성 스노보드 — 기울여 조종', mount: raceGame },
    { id: 'space-olympic', ic: '🏅', name: '우주 바다 올림픽', desc: '달리기(흔들기)·블랙홀 던지기·무중력 균형(기울기)', mount: olympicGame }
  ];
  window.SpaceGames = { LIST, compose, extra: onReward => LIST.map(x => ({ id: x.id, ic: x.ic, name: x.name, desc: x.desc, isNew: true, mount: el => x.mount(el, onReward) })) };
})();
