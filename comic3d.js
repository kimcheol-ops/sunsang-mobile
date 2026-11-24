/* Comic3D — 🧜 바다지기 물결이 입체 만화 (2026-11-24 사용자 요청: 고급스럽게 · 2D→3D→4D→5D · 스크롤·확대/축소·마우스 따라 움직임)
 *  Comic3D.view(el, { comic: [제목, [[장면, 대사]×4], 한 줄 교훈], idx, total, onNav(d), share() })
 *  · 장면 하나 = 여섯 겹(하늘·먼 풍경·바다·인물·앞 파도·효과). 겹마다 깊이(d)가 달라 움직임 차이로 입체감이 생김
 *  · 2D 웹툰: 스크롤하면 겹이 다른 속도로 움직임  · 3D 입체: 마우스·손가락·폰 기울기를 따라 장면이 기울고 겹이 앞뒤로 벌어짐
 *  · 4D 움직임: 파도·물방울·인물·카메라가 시간에 따라 움직임  · 5D 감각: 4D + 소리(직접 합성) · 진동 · 빛 번쩍임 · 폰 기울기
 *  · 컷을 누르면 크게 보기: 휠/두 손가락 확대·축소, 끌어서 옮기기, 두 번 눌러 원래대로
 *  · 그림·소리 모두 이 코드가 직접 만듦(외부 이미지·유료 서비스 없음). 캐릭터는 이 앱 고유 캐릭터.
 */
(function () {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  let U = 0; const uid = p => p + (++U);

  const CSS = `
  .c3 { --ink: #0E1A24; display: grid; gap: 12px; }
  .c3 .head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 12px; }
  .c3 .ttl { font: 800 20px/1.25 'Noto Serif KR', 'Nanum Myeongjo', serif; letter-spacing: -.3px; background: linear-gradient(90deg, #FFE7B0, #9FE7F5); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .c3 .ep { font-size: 12px; letter-spacing: 2px; color: #8FB8C8; text-transform: uppercase; }
  .c3 .modes { display: inline-flex; padding: 3px; border-radius: 999px; background: rgba(255,255,255,.06); box-shadow: inset 0 0 0 1px rgba(255,255,255,.08); flex-wrap: wrap; }
  .c3 .modes button { border: 0; background: transparent; color: #CFE3EA; font: 700 13px inherit; padding: 8px 13px; border-radius: 999px; cursor: pointer; min-height: 36px; }
  .c3 .modes button[aria-pressed="true"] { background: linear-gradient(135deg, #F7D58A, #F0A36B); color: #2A1608; box-shadow: 0 4px 14px rgba(240,163,107,.35); }
  .c3 .hint { font-size: 12.5px; color: #9DB6C0; line-height: 1.5; }
  .c3 .strip { display: grid; gap: 14px; }
  .c3 .pan { position: relative; aspect-ratio: 400 / 260; border-radius: 18px; overflow: hidden; background: #0B1822; cursor: zoom-in;
    box-shadow: 0 18px 40px -18px rgba(0,0,0,.8), 0 0 0 1px rgba(255,255,255,.07); transform-style: preserve-3d; transition: transform .25s ease-out, box-shadow .3s; touch-action: pan-y; }
  .c3 .pan .ly { position: absolute; inset: -7%; width: 114%; height: 114%; pointer-events: none; will-change: transform;
    transform: translate3d(calc(var(--mx,0) * var(--d) * -16px), calc(var(--my,0) * var(--d) * -11px + var(--sy,0) * var(--d) * 26px), calc(var(--z3,0) * var(--d) * 46px)) scale(calc(1 + var(--d) * .035)); }
  .c3 .pan .ly svg { width: 100%; height: 100%; display: block; }
  .c3 .pan .gloss { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(circle at calc(50% + var(--mx,0) * 40%) calc(40% + var(--my,0) * 40%), rgba(255,255,255,.16), transparent 45%); mix-blend-mode: soft-light; }
  .c3 .pan .vig { position: absolute; inset: 0; pointer-events: none; box-shadow: inset 0 0 60px rgba(0,10,20,.55); border-radius: inherit; }
  .c3 .pan .no { position: absolute; left: 12px; top: 10px; font: 800 13px 'Noto Serif KR', serif; color: rgba(255,255,255,.9); text-shadow: 0 1px 6px rgba(0,0,0,.6); letter-spacing: 1px; }
  .c3 .bub { position: absolute; left: 4%; right: 4%; bottom: 4%; display: grid; grid-template-columns: auto 1fr; gap: 8px; align-items: start; padding: 9px 12px; border-radius: 14px;
    background: rgba(250,248,242,.93); color: #1A232B; box-shadow: 0 8px 24px rgba(0,0,0,.35); font-size: 14px; line-height: 1.45; backdrop-filter: blur(6px); transform: translateZ(60px); }
  .c3 .bub .who { font: 800 11.5px inherit; padding: 3px 8px; border-radius: 999px; color: #fff; white-space: nowrap; }
  .c3 .bub .who.m { background: linear-gradient(135deg, #1FA89A, #2B7FC2); } .c3 .bub .who.a { background: linear-gradient(135deg, #F08A2E, #D9572B); }
  .c3 .bub.nar { background: rgba(14,26,36,.82); color: #F4E9CF; font-style: italic; grid-template-columns: 1fr; }
  .c3 .moral { padding: 12px 14px; border-radius: 14px; background: linear-gradient(120deg, rgba(31,168,154,.18), rgba(247,213,138,.14)); box-shadow: inset 0 0 0 1px rgba(255,255,255,.08); font-size: 14px; }
  .c3 .nav { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .c3 .nav button { min-height: 38px; padding: 0 14px; border-radius: 12px; border: 1px solid #34505E; background: #15262F; color: inherit; font: inherit; cursor: pointer; }
  /* 3D: 장면 카드가 기울고 겹이 앞뒤로 벌어짐 */
  .c3.m3 .pan, .c3.m4 .pan, .c3.m5 .pan { transform: perspective(900px) rotateY(calc(var(--mx,0) * 7deg)) rotateX(calc(var(--my,0) * -6deg)); --z3: 1; }
  .c3.m3 .pan:hover, .c3.m4 .pan:hover, .c3.m5 .pan:hover { box-shadow: 0 28px 60px -20px rgba(0,0,0,.9), 0 0 0 1px rgba(255,255,255,.12); }
  /* 4D: 시간에 따라 움직임 */
  .c3 .wv { animation: none; } .c3 .bob, .c3 .bb, .c3 .tw, .c3 .kb, .c3 .sw, .c3 .fl { animation: none; }
  .c3.m4 .wv, .c3.m5 .wv { animation: c3wave var(--t, 7s) linear infinite; }
  .c3.m4 .bob, .c3.m5 .bob { animation: c3bob 3.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
  .c3.m4 .bb, .c3.m5 .bb { animation: c3bub 4.5s ease-in infinite; transform-box: fill-box; }
  .c3.m4 .tw, .c3.m5 .tw { animation: c3tw 2.4s ease-in-out infinite; }
  .c3.m4 .sw, .c3.m5 .sw { animation: c3sw 5s ease-in-out infinite; transform-box: fill-box; transform-origin: bottom center; }
  .c3.m4 .fl, .c3.m5 .fl { animation: c3fl 6s linear infinite; transform-box: fill-box; }
  .c3.m4 .pan .cam, .c3.m5 .pan .cam { position: absolute; inset: 0; animation: c3kb 14s ease-in-out infinite alternate; }
  .c3 .pan .cam { position: absolute; inset: 0; transform-style: preserve-3d; }
  @keyframes c3wave { from { transform: translateX(0); } to { transform: translateX(-400px); } }
  @keyframes c3bob { 0%,100% { transform: translateY(0) rotate(-1.5deg); } 50% { transform: translateY(-5px) rotate(1.5deg); } }
  @keyframes c3bub { 0% { transform: translateY(0); opacity: 0; } 15% { opacity: .9; } 100% { transform: translateY(-140px); opacity: 0; } }
  @keyframes c3tw { 0%,100% { opacity: .25; } 50% { opacity: 1; } }
  @keyframes c3sw { 0%,100% { transform: skewX(-6deg); } 50% { transform: skewX(6deg); } }
  @keyframes c3fl { from { transform: translateX(0); } to { transform: translateX(-60px); } }
  @keyframes c3kb { from { transform: scale(1) translate(0,0); } to { transform: scale(1.07) translate(-1.5%, -1%); } }
  .c3 .flash { position: absolute; inset: 0; background: #fff; opacity: 0; pointer-events: none; }
  .c3 .flash.go { animation: c3flash .7s ease-out; } @keyframes c3flash { 0% { opacity: .85; } 100% { opacity: 0; } }
  /* 크게 보기 */
  .c3z { position: fixed; inset: 0; z-index: 80; background: radial-gradient(circle at 50% 30%, #12303E, #050B10 70%); display: grid; grid-template-rows: auto 1fr auto; touch-action: none; }
  .c3z .zt { display: flex; gap: 6px; align-items: center; padding: 10px 12px; color: #DDEBF0; font-size: 13px; flex-wrap: wrap; }
  .c3z .zt button, .c3z .zb button { min-width: 40px; min-height: 40px; border-radius: 12px; border: 1px solid #34505E; background: rgba(21,38,47,.9); color: #fff; font: inherit; font-size: 16px; cursor: pointer; }
  .c3z .zs { position: relative; overflow: hidden; display: grid; place-items: center; cursor: grab; }
  .c3z .zs.drag { cursor: grabbing; }
  .c3z .zw { width: min(96vw, 1100px); transform-origin: 0 0; }
  .c3z .zw .pan { cursor: inherit; touch-action: none; }
  .c3z .zb { display: flex; justify-content: center; gap: 8px; padding: 10px; }
  @media (prefers-reduced-motion: reduce) { .c3 .pan { transition: none; } }`;
  function css() { if (document.getElementById('c3-css')) return; const s = document.createElement('style'); s.id = 'c3-css'; s.textContent = CSS; document.head.appendChild(s);
    if (!document.getElementById('c3-font')) { const l = document.createElement('link'); l.id = 'c3-font'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@700;900&display=swap'; document.head.appendChild(l); } }

  /* ═════════ 그림 조각(400×260) ═════════ */
  const SV = (body, defs) => `<svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`;
  const lin = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map((c, i) => `<stop offset="${i / (stops.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  const rad = (id, c, a = 1) => `<radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity="${a}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
  const SKY = { day: ['#7CC4EA', '#BFE6F6', '#FFF4DC'], dusk: ['#2E3D78', '#C8708A', '#FFC98E'], night: ['#060B22', '#16224E', '#33407A'], storm: ['#3E5566', '#6F8896', '#A9BCC4'], dawn: ['#3A4F8A', '#E7967A', '#FFE0A6'], mud: ['#A8D4E6', '#DDEFF4', '#F8F0DC'] };
  function sky(kind) { const g = uid('sk'), h = uid('hz'), c = SKY[kind];
    const clouds = kind === 'night' ? '' : `<g opacity="${kind === 'storm' ? .55 : .8}" fill="${kind === 'storm' ? '#5E7380' : '#fff'}"><g class="fl"><ellipse cx="80" cy="46" rx="46" ry="11"/><ellipse cx="104" cy="38" rx="26" ry="12"/><ellipse cx="300" cy="30" rx="54" ry="10"/><ellipse cx="322" cy="22" rx="24" ry="10"/><ellipse cx="480" cy="44" rx="46" ry="11"/></g></g>`;
    const stars = kind === 'night' ? `<g fill="#fff">${Array.from({ length: 34 }, (_, i) => `<circle class="${i % 3 ? '' : 'tw'}" style="animation-delay:${(i % 7) * .3}s" cx="${(i * 97) % 400}" cy="${(i * 53) % 120}" r="${i % 5 ? .8 : 1.5}" opacity="${.5 + (i % 4) * .15}"/>`).join('')}</g>` : '';
    return SV(`<rect width="400" height="260" fill="url(#${g})"/><rect y="70" width="400" height="90" fill="url(#${h})"/>${stars}${clouds}`, lin(g, c) + `<linearGradient id="${h}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c[2]}" stop-opacity="0"/><stop offset=".8" stop-color="${c[2]}" stop-opacity=".7"/><stop offset="1" stop-color="${c[2]}" stop-opacity="0"/></linearGradient>`); }
  function far(kind, opt = {}) { const s = uid('su'), isl = kind === 'night' ? '#141C3C' : kind === 'dusk' || kind === 'dawn' ? '#5A4A78' : kind === 'storm' ? '#4E6270' : '#7FA7BC';
    const sun = opt.sun ? `<circle cx="${opt.sun[0]}" cy="${opt.sun[1]}" r="${opt.sun[2] * 3}" fill="url(#${s})"/><circle class="${opt.pulse ? 'tw' : ''}" cx="${opt.sun[0]}" cy="${opt.sun[1]}" r="${opt.sun[2]}" fill="${opt.sunC || '#FFF1C2'}"/>` : '';
    const moon = kind === 'night' ? `<circle cx="318" cy="52" r="40" fill="url(#${s})"/><circle cx="318" cy="52" r="15" fill="#FFF6D2"/><circle cx="324" cy="48" r="13" fill="#16224E" opacity=".35"/>` : '';
    const birds = opt.birds ? `<g fill="none" stroke="${kind === 'night' ? '#C9D4F0' : '#2A3A48'}" stroke-width="1.6" stroke-linecap="round" class="fl"><path d="M250 64 q6 -6 12 0 q6 -6 12 0"/><path d="M282 78 q4 -4 8 0 q4 -4 8 0"/><path d="M226 84 q4 -4 8 0 q4 -4 8 0"/></g>` : '';
    return SV(`${sun}${moon}<path d="M-10 132 C30 108 62 112 92 124 C120 104 160 100 196 126 L214 132 Z" fill="${isl}" opacity=".85"/><path d="M250 132 C276 118 300 114 330 122 C350 112 380 114 410 128 L410 132 Z" fill="${isl}" opacity=".7"/>${opt.lighthouse ? `<g transform="translate(76 92)"><path d="M0 22 L3 0 L9 0 L12 22 Z" fill="#F4F1E8"/><rect x="2" y="7" width="8" height="4" fill="#D9572B"/><path d="M1 0 L6 -6 L11 0 Z" fill="#2A4650"/><path d="M10 -2 L60 -16 L60 10 Z" fill="#FFF3B0" opacity=".35" class="tw"/></g>` : ''}${birds}`, rad(s, opt.sunC || (kind === 'night' ? '#FFF6D2' : '#FFF1C2'), .55)); }
  function seaBack(kind, opt = {}) { const g = uid('sb'), r = uid('rf'), c = kind === 'night' ? ['#1A2A5A', '#0A1430'] : kind === 'storm' ? ['#3E6272', '#1E3644'] : kind === 'dusk' || kind === 'dawn' ? ['#7A6A9A', '#283A6A'] : ['#3FA6CC', '#14577E'];
    const refl = opt.refl ? Array.from({ length: 12 }, (_, i) => `<ellipse class="tw" style="animation-delay:${i * .21}s" cx="${opt.refl + Math.sin(i * 1.7) * 6}" cy="${136 + i * 9}" rx="${26 - i * 1.6}" ry="1.6" fill="#FFF1C2" opacity="${(.75 - i * .045).toFixed(2)}"/>`).join('') : '';
    const glints = Array.from({ length: 22 }, (_, i) => `<path class="${i % 2 ? 'tw' : ''}" style="animation-delay:${i * .17}s" d="M${(i * 71) % 400} ${140 + (i * 37) % 110} h${8 + i % 4 * 5}" stroke="#fff" stroke-opacity=".35" stroke-width="1.2" stroke-linecap="round"/>`).join('');
    return SV(`<rect y="130" width="400" height="130" fill="url(#${g})"/>${refl}${glints}<g class="wv" style="--t:11s"><path d="M0 140 Q25 135 50 140 T100 140 T150 140 T200 140 T250 140 T300 140 T350 140 T400 140 T450 140 T500 140 T550 140 T600 140 T650 140 T700 140 T750 140 T800 140 V150 H0 Z" fill="#fff" opacity=".12"/></g>`,
      lin(g, c) + `<linearGradient id="${r}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF1C2"/><stop offset="1" stop-color="#FFF1C2" stop-opacity="0"/></linearGradient>`); }
  function waveFront(col, y = 214, amp = 10, t = 7) { const g = uid('wf'); let d = `M0 ${y}`; for (let x = 0; x < 800; x += 50) d += ` Q${x + 25} ${y - amp} ${x + 50} ${y}`;
    let f = `M0 ${y + 2}`; for (let x = 0; x < 800; x += 50) f += ` Q${x + 25} ${y - amp + 3} ${x + 50} ${y + 2}`;
    return SV(`<g class="wv" style="--t:${t}s"><path d="${d} V260 H0 Z" fill="url(#${g})"/><path d="${f}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2"/></g>`, lin(g, col)); }
  const under = () => { const g = uid('uw'), r = uid('ry');
    return SV(`<rect width="400" height="260" fill="url(#${g})"/><g opacity=".5">${[40, 120, 210, 300].map((x, i) => `<path class="tw" style="animation-delay:${i * .6}s" d="M${x} -10 L${x + 40} -10 L${x + 110} 270 L${x + 40} 270 Z" fill="url(#${r})"/>`).join('')}</g>`,
      lin(g, ['#55C2E4', '#1F7EAE', '#0B3C66']) + `<linearGradient id="${r}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`); };
  const seabed = (murky) => { const g = uid('bd');
    return SV(`<path d="M0 214 C60 200 120 222 200 210 C280 198 330 220 400 206 V260 H0 Z" fill="url(#${g})"/><g fill="#2E8A5A" class="sw"><path d="M40 214 C30 180 50 160 38 130 C56 158 50 186 54 214 Z"/><path d="M58 214 C56 190 70 170 64 150 C76 172 72 194 70 214 Z" fill="#3FA56A"/></g><g class="sw" style="animation-delay:-2s"><path d="M340 210 C332 176 352 156 342 126 C360 154 354 182 356 210 Z" fill="#3FA56A"/></g><path d="M300 212 l6 -14 l6 14 Z M260 214 a6 4 0 1 0 12 0 Z" fill="#F4A6B8"/>${murky ? '<rect width="400" height="260" fill="#4A5A3A" opacity=".25"/>' : ''}`, lin(g, ['#D8C08A', '#8A7450'])); };
  const bubbles = (n = 10, x0 = 60, x1 = 340) => SV(`<g fill="none" stroke="#fff" stroke-opacity=".75">${Array.from({ length: n }, (_, i) => `<circle class="bb" style="animation-delay:${(i * .43) % 4.5}s" cx="${x0 + ((i * 89) % (x1 - x0))}" cy="${170 + (i * 29) % 70}" r="${2 + i % 4}"/>`).join('')}</g>`);
  const mud = () => { const g = uid('md'), w = uid('mw');
    return SV(`<rect y="128" width="400" height="132" fill="url(#${g})"/><path d="M0 170 C80 160 120 186 210 176 C290 166 330 182 400 172 L400 180 C330 190 290 174 210 184 C120 194 80 168 0 178 Z" fill="url(#${w})" opacity=".8"/><g fill="#F6F0E2">${[[60, 210], [150, 230], [250, 214], [320, 236], [110, 196]].map(([x, y]) => `<path d="M${x} ${y} a7 5 0 1 0 14 0 Z" stroke="#B8A07A" stroke-width=".8"/>`).join('')}</g><g fill="#5E4A36" opacity=".5">${Array.from({ length: 16 }, (_, i) => `<circle cx="${(i * 61) % 400}" cy="${190 + (i * 23) % 60}" r="1.4"/>`).join('')}</g>`,
      lin(g, ['#A89070', '#7A6248']) + lin(w, ['#BFE6F6', '#7CC4EA'], 1, 0)); };
  function boat(x, y, s, opt = {}) { const h = uid('hl'), w = uid('wn');
    return `<g class="${opt.still ? '' : 'bob'}"><g transform="translate(${x} ${y}) scale(${s}) rotate(${opt.tilt || 0} 60 40)">
      <defs>${lin(h, ['#FFFFFF', '#D9DEE3'])}${lin(w, opt.night ? ['#FFE9A0', '#F5B84A'] : ['#CFEFFF', '#7FC4E8'])}</defs>
      <path d="M-4 44 L128 44 L116 66 C80 72 30 72 8 66 Z" fill="url(#${h})" stroke="#2A3A48" stroke-width="1.6"/><path d="M0 52 L124 52 L120 58 L4 58 Z" fill="#D9572B"/>
      <rect x="44" y="14" width="44" height="30" rx="4" fill="#F4F6F8" stroke="#2A3A48" stroke-width="1.6"/><rect x="50" y="20" width="14" height="10" rx="2" fill="url(#${w})"/><rect x="68" y="20" width="14" height="10" rx="2" fill="url(#${w})"/>
      <path d="M40 14 L92 14 L88 8 L44 8 Z" fill="#1F5C7A"/><path d="M66 8 V-18" stroke="#2A3A48" stroke-width="1.6"/><path d="M66 -18 L84 -12 L66 -6 Z" fill="#F7C548"/><circle cx="66" cy="-20" r="2" fill="#FF5A4A" class="tw"/>
      <path d="M100 44 L118 6" stroke="#5A4630" stroke-width="2"/><path d="M118 6 Q126 40 128 70" stroke="#E8EEF2" stroke-width=".8" fill="none"/>
      ${opt.night ? `<circle cx="66" cy="28" r="40" fill="#FFE9A0" opacity=".08"/>` : ''}</g></g>`; }
  function mermaid(x, y, s, mood = 'happy', opt = {}) { const t = uid('tl'), hr = uid('hr'), sk = uid('sk'), ir = uid('ir'), sh = uid('sh');
    const mouth = mood === 'worry' ? 'M38 33 Q43 29 48 33' : mood === 'wow' ? 'M41 31 a2.6 3 0 1 0 5.2 0 a2.6 3 0 1 0 -5.2 0' : 'M37 30 Q43 36 49 30';
    const arm = mood === 'wave' ? 'M56 48 Q70 32 74 18' : mood === 'thumb' ? 'M56 50 Q70 46 76 38' : 'M56 50 Q64 62 60 72';
    return `<g class="${opt.still ? '' : 'bob'}"><g transform="translate(${x} ${y}) scale(${s})"><defs>${lin(t, ['#5FE0CF', '#1FA89A', '#0E6E86'])}${lin(hr, ['#FF9A6A', '#F2575A'])}${lin(sk, ['#FFE6D2', '#F7C9A8'])}${lin(ir, ['#5FD3E8', '#1F6C9A'])}${lin(sh, ['#FFC1D0', '#F27A9A'])}</defs>
      <path d="M22 4 C6 14 8 50 16 74 C10 56 14 30 24 16 Z M64 4 C80 16 80 50 72 76 C78 54 72 28 62 16 Z" fill="url(#${hr})"/>
      <path d="M30 60 C18 84 20 112 36 132 C42 140 40 148 30 158 C46 158 56 150 58 140 C62 150 74 158 88 156 C76 146 68 134 64 122 C72 100 68 76 56 60 Z" fill="url(#${t})"/>
      <g fill="none" stroke="#B8FFF4" stroke-opacity=".55" stroke-width="1.3"><path d="M32 78 q6 5 12 0 q6 5 12 0"/><path d="M30 92 q6 5 12 0 q6 5 12 0"/><path d="M34 106 q6 5 12 0 q6 5 12 0"/><path d="M40 120 q5 4 10 0"/></g>
      <path d="M32 42 C30 50 30 58 32 64 L56 64 C58 58 58 50 54 42 Z" fill="url(#${sk})"/>
      <path d="M32 50 C34 44 42 44 43 50 C44 44 52 44 54 50 L52 56 L34 56 Z" fill="url(#${sh})"/>
      <path d="${arm}" stroke="#F7C9A8" stroke-width="6" stroke-linecap="round" fill="none"/>${mood === 'thumb' ? '<circle cx="77" cy="36" r="4" fill="#F7C9A8"/><path d="M77 32 v-6" stroke="#F7C9A8" stroke-width="3.5" stroke-linecap="round"/>' : ''}
      <path d="M32 46 Q24 58 28 70" stroke="#F7C9A8" stroke-width="6" stroke-linecap="round" fill="none"/>
      <ellipse cx="43" cy="24" rx="17" ry="18" fill="url(#${sk})"/>
      <path d="M24 22 C20 -4 66 -6 62 22 C58 12 50 8 44 12 C38 6 30 10 24 22 Z" fill="url(#${hr})"/>
      <path d="M58 6 l4 -5 l5 3 l-2 6 l-6 1 Z" fill="#FFE08A" stroke="#E0A93A" stroke-width=".6"/>
      <ellipse cx="36" cy="24" rx="4.2" ry="${mood === 'worry' ? 4 : 5}" fill="#fff"/><ellipse cx="50" cy="24" rx="4.2" ry="${mood === 'worry' ? 4 : 5}" fill="#fff"/>
      <circle cx="36.5" cy="25" r="3" fill="url(#${ir})"/><circle cx="50.5" cy="25" r="3" fill="url(#${ir})"/><circle cx="37.6" cy="23.6" r="1.1" fill="#fff"/><circle cx="51.6" cy="23.6" r="1.1" fill="#fff"/>
      ${mood === 'worry' ? '<path d="M31 17 l8 2 M55 17 l-8 2" stroke="#8A3A2A" stroke-width="1.3" stroke-linecap="round"/>' : ''}
      <ellipse cx="31" cy="31" rx="3.4" ry="1.8" fill="#FF8FA3" opacity=".55"/><ellipse cx="55" cy="31" rx="3.4" ry="1.8" fill="#FF8FA3" opacity=".55"/>
      <path d="${mouth}" stroke="#8A3A2A" stroke-width="1.6" fill="${mood === 'wow' ? '#8A3A2A' : 'none'}" stroke-linecap="round"/></g></g>`; }
  function angler(x, y, s, opt = {}) { const v = uid('vs'), sk = uid('sk');
    return `<g class="${opt.still ? '' : 'bob'}"><g transform="translate(${x} ${y}) scale(${s})"><defs>${lin(v, ['#FFA23A', '#E2572B'])}${lin(sk, ['#FFE6D2', '#F2C2A0'])}</defs>
      <path d="M14 70 L12 104 L22 104 L24 76 Z M30 76 L32 104 L42 104 L40 70 Z" fill="#26364A"/><path d="M10 104 h14 v5 h-16 Z M30 104 h14 l2 5 h-16 Z" fill="#1A232B"/>
      <path d="M8 38 C8 30 46 30 46 38 L44 74 L10 74 Z" fill="url(#${v})" stroke="#9E3A1A" stroke-width="1"/><path d="M10 56 H44 M10 62 H44" stroke="#F4F6F8" stroke-width="2.4"/><path d="M27 34 V74" stroke="#9E3A1A" stroke-width="1"/>
      <ellipse cx="27" cy="20" rx="14" ry="15" fill="url(#${sk})"/><path d="M12 16 C12 2 42 2 42 16 Z" fill="#1F5C7A"/><path d="M40 15 L54 18 L40 19 Z" fill="#1F5C7A"/>
      ${opt.sleepy ? '<path d="M19 21 q3 2 6 0 M29 21 q3 2 6 0" stroke="#1A232B" stroke-width="1.4" fill="none"/>' : '<circle cx="22" cy="21" r="1.8" fill="#1A232B"/><circle cx="32" cy="21" r="1.8" fill="#1A232B"/>'}
      <path d="${opt.sleepy ? 'M24 28 h6' : 'M22 27 Q27 31 32 27'}" stroke="#8A3A2A" stroke-width="1.4" fill="none" stroke-linecap="round"/><ellipse cx="18" cy="25" rx="2.4" ry="1.3" fill="#FF8FA3" opacity=".5"/><ellipse cx="36" cy="25" rx="2.4" ry="1.3" fill="#FF8FA3" opacity=".5"/>
      <path d="M44 42 Q54 50 58 44" stroke="#F2C2A0" stroke-width="6" stroke-linecap="round" fill="none"/>
      ${opt.fish ? `<g transform="translate(56 34)"><path d="M0 8 C6 -2 24 -2 30 8 C24 18 6 18 0 8 Z" fill="#9FB8C8" stroke="#2A3A48" stroke-width="1"/><path d="M30 8 L40 0 L40 16 Z" fill="#7F98A8"/><circle cx="7" cy="6" r="1.6" fill="#1A232B"/></g>` : opt.bag ? `<g transform="translate(52 40)"><path d="M0 4 L22 4 L26 40 L-4 40 Z" fill="#3FA56A"/><path d="M6 4 Q11 -6 16 4" stroke="#2E7D5B" stroke-width="2" fill="none"/><text x="5" y="28" font-size="14" fill="#fff">♻</text></g>` : `<path d="M58 44 L96 -14" stroke="#6E5230" stroke-width="2.4"/><path d="M96 -14 Q104 40 106 80" stroke="#E8EEF2" stroke-width=".8" fill="none"/>`}
      <path d="M10 42 Q0 54 6 66" stroke="#F2C2A0" stroke-width="6" stroke-linecap="round" fill="none"/></g></g>`; }
  const fish = (x, y, s, c = '#F2A23A', flip) => `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})"><path d="M0 0 C8 -12 30 -12 38 0 C30 12 8 12 0 0 Z" fill="${c}" stroke="#2A3A48" stroke-width=".8"/><path d="M38 0 L50 -9 L50 9 Z" fill="${c}" opacity=".85"/><circle cx="9" cy="-2" r="2" fill="#fff"/><circle cx="9" cy="-2" r="1" fill="#1A232B"/><path d="M16 -8 Q20 0 16 8" stroke="#fff" stroke-opacity=".5" fill="none"/></g>`;
  const fxText = (t, x, y, sz, col = '#fff', st = '#16618A') => SV(`<text x="${x}" y="${y}" font-size="${sz}" font-weight="900" font-family="'Noto Serif KR',serif" fill="${col}" stroke="${st}" stroke-width="2.5" paint-order="stroke" class="tw">${esc(t)}</text>`);
  const sparkle = (pts) => SV(`<g fill="#FFF3B0">${pts.map(([x, y, r], i) => `<path class="tw" style="animation-delay:${i * .3}s" d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z"/>`).join('')}</g>`);
  const L = (d, svg) => ({ d, svg });
  const pier = (x0, y, x1, c = '#7A5A3A') => `<path d="M${x0} ${y} H${x1} V${y + 9} H${x0} Z" fill="${c}"/><path d="M${x0} ${y + 2} H${x1}" stroke="#fff" stroke-opacity=".15"/>${Array.from({ length: Math.ceil((x1 - x0) / 40) }, (_, i) => `<rect x="${x0 + 10 + i * 40}" y="${y + 9}" width="6" height="60" fill="${c}" opacity=".85"/>`).join('')}`;

  /* 장면마다 여섯 겹: [하늘 .05, 먼 풍경 .2, 바다 .4, 인물 .7, 앞 파도 1, 효과 1.25] — sfx: 5D 소리 */
  const SCENES = {
    boat: () => ({ sfx: 'sea', l: [L(.05, sky('day')), L(.2, far('day', { sun: [330, 54, 12], birds: 1, lighthouse: 1 })), L(.4, seaBack('day', { refl: 330 })), L(.7, SV(boat(170, 92, 1.25) + mermaid(40, 120, .62, 'wave'))), L(1, waveFront(['#2E9BC8', '#0E5A86'], 206, 9)), L(1.25, bubbles(5, 40, 120))] }),
    angler: () => ({ sfx: 'sea', l: [L(.05, sky('day')), L(.2, far('day', { sun: [70, 50, 11] })), L(.4, seaBack('day', { refl: 70 })), L(.7, SV(boat(84, 118, 1.6, { still: 1 }) + angler(80, 76, 1.02))), L(1, waveFront(['#2E9BC8', '#0E5A86'], 222, 8)), L(1.25, SV(''))] }),
    wave: () => ({ sfx: 'crash', buzz: [80, 40, 120], flash: 1, l: [L(.05, sky('storm')), L(.2, far('storm')), L(.4, seaBack('storm')), L(.7, SV(boat(200, 100, 1.2, { tilt: -14 }))), L(1, SV(`<g class="bob"><path d="M-20 260 L-20 150 C20 50 120 10 186 60 C140 62 118 100 158 138 C120 152 80 176 64 260 Z" fill="#1F6C8A"/><path d="M-20 150 C20 50 120 10 186 60 C150 52 126 76 128 104" fill="none" stroke="#E8F8FF" stroke-width="5" stroke-linecap="round"/><g fill="#fff">${Array.from({ length: 14 }, (_, i) => `<circle class="tw" style="animation-delay:${i * .1}s" cx="${120 + (i * 23) % 120}" cy="${30 + (i * 17) % 80}" r="${1.5 + i % 3}"/>`).join('')}</g></g>`)), L(1.25, fxText('철썩!', 238, 74, 46, '#fff', '#0E4A6E'))] }),
    ok: () => ({ sfx: 'chime', l: [L(.05, sky('dusk')), L(.2, far('dusk', { sun: [300, 118, 26], sunC: '#FFD08A' })), L(.4, seaBack('dusk', { refl: 300 })), L(.7, SV(mermaid(130, 30, 1.25, 'thumb'))), L(1, waveFront(['#5A4A8A', '#1E2A5A'], 228, 7, 9)), L(1.25, sparkle([[90, 60, 7], [300, 40, 6], [250, 96, 5], [110, 150, 5], [330, 160, 4]]))] }),
    flat: () => ({ sfx: 'shore', l: [L(.05, sky('mud')), L(.2, far('day', { sun: [80, 46, 10], birds: 1 })), L(.4, mud()), L(.7, SV(`<path d="M290 200 C300 170 360 166 380 196 Z" fill="#6E6A60"/>` + mermaid(304, 102, .62, 'wave'))), L(1, SV('')), L(1.25, SV(''))] }),
    tide: () => ({ sfx: 'shore', l: [L(.05, sky('mud')), L(.2, far('day', { sun: [70, 46, 10] })), L(.4, mud()), L(.7, SV(angler(60, 112, .95))), L(1, SV(`<g class="fl" style="animation-duration:3s"><path d="M410 170 C340 166 300 190 250 196 C290 214 340 222 410 226 Z" fill="#3FA6CC" opacity=".85"/><path d="M410 172 C340 168 300 192 252 196" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/></g>`)), L(1.25, SV(`<g transform="translate(200 50)"><circle r="22" fill="#fff" stroke="#2A3A48" stroke-width="2.5"/><path d="M0 0 V-14 M0 0 L10 6" stroke="#D9572B" stroke-width="2.5" stroke-linecap="round"/><path d="M30 0 h34 l-8 -7 M64 0 l-8 7" stroke="#D9572B" stroke-width="4" fill="none" stroke-linecap="round" class="tw"/></g>`))] }),
    fish: () => ({ sfx: 'splash', l: [L(.05, sky('day')), L(.2, far('day', { sun: [330, 50, 11], birds: 1 })), L(.4, seaBack('day', { refl: 330 })), L(.7, SV(pier(40, 186, 260) + angler(130, 62, 1.12, { fish: 1 }))), L(1, waveFront(['#2E9BC8', '#0E5A86'], 226, 7)), L(1.25, sparkle([[225, 86, 6], [262, 70, 4]]))] }),
    mermaid: () => ({ sfx: 'bubble', l: [L(.05, under()), L(.2, SV(fish(60, 60, .6, '#7FD3E8') + fish(320, 90, .5, '#F4A6B8', 1))), L(.4, seabed()), L(.7, SV(mermaid(150, 30, 1.2, 'happy'))), L(1, SV('')), L(1.25, bubbles(12))] }),
    release: () => ({ sfx: 'bubble', l: [L(.05, under()), L(.2, SV('')), L(.4, seabed()), L(.7, SV(`<g class="fl" style="animation-duration:4s">${fish(220, 120, 1.3, '#F2A23A')}</g>`)), L(1, SV('')), L(1.25, SV(bubbles(10, 180, 320).replace(/^<svg[^>]*>|<\/svg>$/g, '') + `<text x="90" y="70" font-size="26" font-weight="900" font-family="'Noto Serif KR',serif" fill="#fff" class="tw">퐁당~</text>`))] }),
    trash: () => ({ sfx: 'murk', buzz: [40], l: [L(.05, under()), L(.2, SV(`<path d="M300 40 C320 30 340 50 330 70 C350 80 330 100 310 90 C290 100 280 70 300 40 Z" fill="#EEF2F4" opacity=".55" class="fl"/>`)), L(.4, seabed(true)), L(.7, SV(mermaid(130, 30, 1.15, 'worry'))), L(1, SV(`<path d="M80 60 C200 260 220 40 300 220 C260 120 200 200 150 150 C120 120 110 190 180 200" stroke="#E8E8E0" stroke-width="1.6" fill="none"/><path d="M178 196 l8 6 l-6 6" stroke="#9AA4AA" stroke-width="2" fill="none"/>`)), L(1.25, bubbles(6))] }),
    clean: () => ({ sfx: 'chime', l: [L(.05, sky('day')), L(.2, far('day', { sun: [330, 50, 11], birds: 1 })), L(.4, SV(`<rect y="130" width="400" height="60" fill="#3FA6CC"/><path d="M0 170 C100 160 300 176 400 166 V260 H0 Z" fill="#F1DDAE"/><path d="M0 170 C100 160 300 176 400 166" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>`)), L(.7, SV(angler(140, 80, 1.1, { bag: 1 }))), L(1, SV('')), L(1.25, sparkle([[230, 100, 7], [100, 70, 5], [300, 140, 5]]))] }),
    night: () => ({ sfx: 'night', l: [L(.05, sky('night')), L(.2, far('night', { lighthouse: 1 })), L(.4, seaBack('night', { refl: 318 })), L(.7, SV(boat(200, 116, 1.1, { night: 1, still: 1 }) + pier(-10, 212, 190, '#3A3048') + `<path d="M150 212 V170" stroke="#3A3048" stroke-width="3"/><circle cx="150" cy="166" r="26" fill="#FFE9A0" opacity=".18" class="tw"/><circle cx="150" cy="166" r="5" fill="#FFE9A0"/>` + angler(70, 106, .95, { sleepy: 1, still: 1 }))), L(1, waveFront(['#1A2A5A', '#060B22'], 232, 6, 10)), L(1.25, fxText('z z z', 120, 100, 22, '#C9D4F0', '#16224E'))] }),
    sun: () => ({ sfx: 'sea', l: [L(.05, sky('dawn')), L(.2, far('dawn', { sun: [200, 130, 30], sunC: '#FFE08A', pulse: 1, birds: 1 })), L(.4, seaBack('dawn', { refl: 200 })), L(.7, SV(boat(60, 104, 1, {}))), L(1, waveFront(['#4A4A8A', '#1A2450'], 226, 7)), L(1.25, SV(''))] })
  };
  function panelHtml(key, text, j) {
    const sc = (SCENES[key] || SCENES.mermaid)(), m = /^([^:：]{1,6})[:：]\s*(.*)$/.exec(text), nar = /^\(.*\)$/.test(text.trim());
    const who = m ? m[1] : '', body = m ? m[2] : text, cls = who.includes('물결') ? 'm' : 'a';
    return `<div class="pan" data-j="${j}" data-key="${esc(key)}" tabindex="0" role="button" aria-label="${j + 1}컷 크게 보기: ${esc(text)}"><div class="cam">${sc.l.map(l => `<div class="ly" style="--d:${l.d}">${l.svg}</div>`).join('')}</div>
      <div class="gloss"></div><div class="vig"></div><div class="flash"></div><span class="no">${j + 1}</span>
      <div class="bub ${nar ? 'nar' : ''}">${nar ? `<span>${esc(text.replace(/^\(|\)$/g, ''))}</span>` : `${who ? `<span class="who ${cls}">${esc(who)}</span>` : ''}<span>${esc(body)}</span>`}</div></div>`;
  }

  /* ═════════ 5D 소리(직접 합성) ═════════ */
  let AC = null, amb = null;
  const ac = () => { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (AC && AC.state === 'suspended') AC.resume(); return AC; };
  function noise(sec) { const a = ac(), n = a.sampleRate * sec, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); let l = 0; for (let i = 0; i < n; i++) { l = (l + 0.04 * (Math.random() * 2 - 1)) / 1.04; d[i] = l * 3; } return b; }
  function ambient(on) {
    if (!on) { if (amb) { try { amb.g.gain.setTargetAtTime(0, AC.currentTime, .3); const x = amb; setTimeout(() => { try { x.s.stop(); x.o.stop(); } catch (e) {} }, 900); } catch (e) {} amb = null; } return; }
    const a = ac(); if (!a || amb) return; const s = a.createBufferSource(); s.buffer = noise(4); s.loop = true; const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700; const g = a.createGain(); g.gain.value = 0;
    const o = a.createOscillator(), og = a.createGain(); o.frequency.value = .13; og.gain.value = .12; o.connect(og); og.connect(g.gain); s.connect(f); f.connect(g); g.connect(a.destination); s.start(); o.start(); g.gain.setTargetAtTime(.2, a.currentTime, .8); amb = { s, o, g };
  }
  function cue(kind) { const a = ac(); if (!a) return; const t = a.currentTime;
    const burst = (dur, freq, vol, q = 1) => { const s = a.createBufferSource(); s.buffer = noise(dur); const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; const g = a.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); s.connect(f); f.connect(g); g.connect(a.destination); s.start(t); };
    const tone = (fr, at, dur, vol = .08, type = 'sine') => { const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(fr, t + at); g.gain.setValueAtTime(0, t + at); g.gain.linearRampToValueAtTime(vol, t + at + .02); g.gain.exponentialRampToValueAtTime(.001, t + at + dur); o.connect(g); g.connect(a.destination); o.start(t + at); o.stop(t + at + dur + .05); };
    if (kind === 'crash') { burst(1.6, 500, .9, .6); burst(.9, 1800, .4, .8); }
    else if (kind === 'chime') { [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * .12, 1.1, .06, 'triangle')); }
    else if (kind === 'bubble' || kind === 'splash') { for (let i = 0; i < 6; i++) { const o = a.createOscillator(), g = a.createGain(), at = t + i * .13; o.frequency.setValueAtTime(300 + i * 60, at); o.frequency.exponentialRampToValueAtTime(900 + i * 80, at + .08); g.gain.setValueAtTime(.06, at); g.gain.exponentialRampToValueAtTime(.001, at + .1); o.connect(g); g.connect(a.destination); o.start(at); o.stop(at + .12); } if (kind === 'splash') burst(.5, 1200, .3); }
    else if (kind === 'shore') burst(1.4, 900, .25, .5);
    else if (kind === 'night') { tone(523, 0, 1.4, .04); tone(659, .4, 1.4, .035); }
    else if (kind === 'murk') { tone(110, 0, 1, .07, 'sawtooth'); tone(104, .1, 1, .05, 'sawtooth'); }
    else burst(1, 600, .2, .7);
  }

  /* ═════════ 화면 ═════════ */
  const MODES = [['2', '2D 웹툰', '스크롤을 내리면 하늘·섬·바다·인물이 서로 다른 속도로 움직여 깊이가 느껴져요.'], ['3', '3D 입체', '마우스(손가락)를 움직이면 장면이 기울고 겹이 앞뒤로 벌어져요. 폰은 기울여도 돼요.'], ['4', '4D 움직임', '파도·물방울·인물·카메라가 시간에 따라 살아 움직여요.'], ['5', '5D 감각', '4D에 파도 소리·효과음·진동·빛을 더해요. 소리가 나요 🔊']];
  function view(el, o) {
    css();
    let mode = lsGet('comic3d.mode', '3'), stop = [];
    const c = o.comic;
    el.innerHTML = `<div class="c3 m${mode}"><div class="head"><span class="ep">EPISODE ${o.idx + 1} / ${o.total}</span><span class="ttl">🧜 바다지기 물결이 「${esc(c[0])}」</span></div>
      <div class="modes" role="group" aria-label="보기 방식">${MODES.map(([k, l]) => `<button type="button" data-mode="${k}" aria-pressed="${k === mode}">${l}</button>`).join('')}</div>
      <div class="hint" data-hint></div>
      <div class="strip">${c[1].map(([k, t], j) => panelHtml(k, t, j)).join('')}</div>
      <div class="moral">💡 ${esc(c[2])}</div>
      <div class="nav"><button type="button" data-prev>◀ 이전 화</button><button type="button" data-next>다음 화 ▶</button><button type="button" data-zoom>🔍 크게 보기</button><button type="button" data-share>📋 글로 복사</button></div>
      <div class="hint">그림·소리는 이 앱이 직접 그리고 만든 고유 캐릭터입니다. 컷을 누르면 크게 보며 휠·두 손가락으로 확대·축소할 수 있어요.</div></div>`;
    const root = el.querySelector('.c3'), pans = [...root.querySelectorAll('.strip .pan')];
    const hint = () => { root.querySelector('[data-hint]').textContent = MODES.find(m => m[0] === mode)[2]; };
    function setMode(m) { mode = m; lsSet('comic3d.mode', m); root.className = `c3 m${m}`; root.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === m)); hint();
      if (m !== '3' && m !== '4' && m !== '5') pans.forEach(p => { p.style.setProperty('--mx', 0); p.style.setProperty('--my', 0); });
      ambient(m === '5'); if (m === '5') { askTilt(); seen.clear(); onScroll(); } }
    root.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => setMode(b.dataset.mode));
    // 마우스·손가락 → 기울기(3D 이상)
    const tiltOK = () => mode !== '2';
    pans.forEach(p => {
      p.addEventListener('pointermove', e => { if (!tiltOK() || e.pointerType === 'touch') return; const r = p.getBoundingClientRect(); p.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 2 - 1).toFixed(3)); p.style.setProperty('--my', ((e.clientY - r.top) / r.height * 2 - 1).toFixed(3)); });
      p.addEventListener('pointerleave', () => { p.style.setProperty('--mx', 0); p.style.setProperty('--my', 0); });
      p.addEventListener('click', () => zoom(+p.dataset.j)); p.addEventListener('keydown', e => { if (e.key === 'Enter') zoom(+p.dataset.j); });
    });
    // 스크롤 → 겹마다 다른 속도(모든 모드), 5D는 화면에 들어온 컷의 소리·진동
    const seen = new Set();
    function onScroll() { const vh = window.innerHeight || 800;
      pans.forEach(p => { const r = p.getBoundingClientRect(), k = ((r.top + r.height / 2) - vh / 2) / vh; p.style.setProperty('--sy', Math.max(-1.2, Math.min(1.2, k)).toFixed(3));
        if (mode === '5' && r.top < vh * .6 && r.bottom > vh * .4 && !seen.has(p)) { seen.add(p); fire(p); } }); }
    function fire(p) { const sc = (SCENES[p.dataset.key] || SCENES.mermaid)(); cue(sc.sfx); if (sc.buzz && navigator.vibrate) { try { navigator.vibrate(sc.buzz); } catch (e) {} }
      if (sc.flash) { const f = p.querySelector('.flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); } }
    window.addEventListener('scroll', onScroll, { passive: true, capture: true }); stop.push(() => window.removeEventListener('scroll', onScroll, { capture: true }));
    // 폰 기울기(3D 이상)
    let tiltOn = false;
    function onTilt(e) { if (!tiltOK() || e.gamma == null) return; const mx = Math.max(-1, Math.min(1, e.gamma / 25)), my = Math.max(-1, Math.min(1, (e.beta - 45) / 25)); pans.forEach(p => { p.style.setProperty('--mx', mx.toFixed(3)); p.style.setProperty('--my', my.toFixed(3)); }); }
    function askTilt() { if (tiltOn || !window.DeviceOrientationEvent) return; const go = () => { tiltOn = true; window.addEventListener('deviceorientation', onTilt); stop.push(() => window.removeEventListener('deviceorientation', onTilt)); };
      if (typeof DeviceOrientationEvent.requestPermission === 'function') DeviceOrientationEvent.requestPermission().then(s => { if (s === 'granted') go(); }).catch(() => {}); else go(); }
    if (mode !== '2' && matchMedia('(pointer:coarse)').matches) askTilt();
    root.querySelector('[data-prev]').onclick = () => o.onNav(-1);
    root.querySelector('[data-next]').onclick = () => o.onNav(1);
    root.querySelector('[data-zoom]').onclick = () => zoom(0);
    root.querySelector('[data-share]').onclick = e => o.share && o.share(e.currentTarget);
    hint(); onScroll(); if (mode === '5') ambient(true);

    /* 🔍 크게 보기: 휠·두 손가락 확대/축소, 끌어서 옮기기, 두 번 눌러 원래대로 */
    function zoom(j) {
      const z = document.createElement('div'); z.className = `c3z`; let k = j, sc = 1, tx = 0, ty = 0;
      z.innerHTML = `<div class="zt"><b data-zh></b><span style="flex:1"></span><button data-zo aria-label="축소">－</button><span data-zp style="min-width:48px;text-align:center"></span><button data-zi aria-label="확대">＋</button><button data-zr aria-label="원래대로">⟲</button><button data-zx aria-label="닫기">✕</button></div>
        <div class="zs"><div class="c3 m${mode} zw"></div></div><div class="zb"><button data-zp1 aria-label="이전 컷">◀</button><button data-zn aria-label="다음 컷">▶</button></div>`;
      document.body.appendChild(z);
      const st = z.querySelector('.zs'), w = z.querySelector('.zw');
      const apply = () => { w.style.transform = `translate(${tx}px, ${ty}px) scale(${sc})`; z.querySelector('[data-zp]').textContent = Math.round(sc * 100) + '%'; };
      const center = () => { const sr = st.getBoundingClientRect(), wr = w.offsetWidth, hr = w.offsetHeight; tx = (sr.width - wr * sc) / 2; ty = (sr.height - hr * sc) / 2; apply(); };
      function show() { k = (k + 4) % 4; const [key, t] = c[1][k]; w.innerHTML = panelHtml(key, t, k); z.querySelector('[data-zh]').textContent = `${k + 1}/4 컷 · ${MODES.find(m => m[0] === mode)[1]}`; sc = 1; requestAnimationFrame(center);
        const p = w.querySelector('.pan'); p.addEventListener('pointermove', e => { if (!tiltOK() || drag) return; const r = p.getBoundingClientRect(); p.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 2 - 1).toFixed(3)); p.style.setProperty('--my', ((e.clientY - r.top) / r.height * 2 - 1).toFixed(3)); });
        if (mode === '5') fire(p); }
      const zoomAt = (f, cx, cy) => { const sr = st.getBoundingClientRect(), x = cx - sr.left, y = cy - sr.top, n = Math.max(.5, Math.min(5, sc * f)); tx = x - (x - tx) * n / sc; ty = y - (y - ty) * n / sc; sc = n; apply(); };
      st.addEventListener('wheel', e => { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * .0015), e.clientX, e.clientY); }, { passive: false });
      const pts = new Map(); let drag = null, pinch = null;
      st.addEventListener('pointerdown', e => { try { st.setPointerCapture(e.pointerId); } catch (x) {} pts.set(e.pointerId, [e.clientX, e.clientY]);
        if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s: sc }; drag = null; } else { drag = [e.clientX - tx, e.clientY - ty]; st.classList.add('drag'); } });
      st.addEventListener('pointermove', e => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
        if (pinch && pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); zoomAt(pinch.s * d / pinch.d / sc, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
        else if (drag) { tx = e.clientX - drag[0]; ty = e.clientY - drag[1]; apply(); } });
      const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (!pts.size) { drag = null; st.classList.remove('drag'); } };
      st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up);
      st.addEventListener('dblclick', () => { sc = 1; center(); });
      const close = () => { z.remove(); document.removeEventListener('keydown', key); };
      const key = e => { if (e.key === 'Escape') close(); else if (e.key === 'ArrowRight') { k++; show(); } else if (e.key === 'ArrowLeft') { k--; show(); } else if (e.key === '+' || e.key === '=') zoomAt(1.25, innerWidth / 2, innerHeight / 2); else if (e.key === '-') zoomAt(.8, innerWidth / 2, innerHeight / 2); };
      document.addEventListener('keydown', key);
      z.querySelector('[data-zx]').onclick = close; z.querySelector('[data-zr]').onclick = () => { sc = 1; center(); };
      z.querySelector('[data-zi]').onclick = () => { const r = st.getBoundingClientRect(); zoomAt(1.3, r.left + r.width / 2, r.top + r.height / 2); };
      z.querySelector('[data-zo]').onclick = () => { const r = st.getBoundingClientRect(); zoomAt(1 / 1.3, r.left + r.width / 2, r.top + r.height / 2); };
      z.querySelector('[data-zp1]').onclick = () => { k--; show(); }; z.querySelector('[data-zn]').onclick = () => { k++; show(); };
      stop.push(close); show();
    }
    return () => { stop.forEach(f => { try { f(); } catch (e) {} }); stop = []; ambient(false); };
  }
  window.Comic3D = { view, SCENES: Object.keys(SCENES) };
})();
