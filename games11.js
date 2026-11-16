/* 🎓 낚시법 도장 깨기 — 낚시 방법 8가지를 손으로 익히는 게임(허락 3번: 여러 낚시 방법을 배우는 게임)
 * (PC · 휴대폰 앱 · 조황 수첩 공용, games3.js(GameHub) 뒤에 로드. phone.js(PhoneKit)가 있으면 진동)
 * MethodGames.extra(onReward) → 게임 메뉴 항목. 끝나면 onReward({ game, score, coins })
 * 낚시법마다 내리기·감기·고패질·챔질 요령이 다름. 통과하면 도장 + 가상 장비(실제 상표·제품 이름 없음).
 * 진행 상황은 이 기기 localStorage 'game.methods'에만 저장. 결제·뽑기·광고 없음.
 */
(function () {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sfx = k => window.GameHub && GameHub.sfx && GameHub.sfx(k);
  const buzz = k => { try { window.PhoneKit && PhoneKit.buzz && PhoneKit.buzz(k); } catch (e) {} };
  const BTN = 'min-height:50px;border:0;border-radius:12px;font:700 15px inherit;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none';
  const PRIMARY = BTN + ';background:#E2572B;color:#fff', SOFT = BTN + ';background:#2A4650;color:#E3EEF0';
  const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const KEY = 'game.methods';
  const inR = (v, a, b) => v >= a && v <= b;

  /* 낚시법 표 — B 바닥 수심(m), fall 가라앉는 빠르기, reel 감는 빠르기(m/s), jerk 「툭」 한 번에 올라가는 높이
   * bite(s) 1초당 입질 확률, hook 챔질 방법(now 바로 / wait 기다렸다가 / reel 계속 감기 / slow 기다렸다 천천히 감기)
   * hint(s) 지금 할 일 안내, item 통과 보상(가상 장비) */
  const M = [
    { id: 'egi', ic: '🐙', name: '쭈꾸미 에기', sp: '쭈꾸미', fish: '🐙', lure: '🦐', B: 20, fall: 6, reel: 6, jerk: 1, time: 45, need: 3,
      how: ['손을 떼면 봉돌이 바닥까지 내려가요.', '바닥에서 「툭」을 2~4초마다 — 이걸 <b>고패질</b>이라고 해요.', '툭 한 뒤 바닥에 잠깐 가만히 두면 쭈꾸미가 올라타요.', '❗ 무게가 느껴지면 <b>바로</b> 챔질!'],
      bite: s => s.onBottom && s.acts > 0 && inR(s.since, .8, 4) ? .5 : s.onBottom && s.since > 6 ? .04 : 0,
      hook: { t: 'now', win: 1.1 },
      hint: s => !s.onBottom ? '⬇ 바닥까지 내리는 중… 손을 떼고 기다려요' : s.acts === 0 || s.since > 4 ? '👉 「툭」! 고패질할 때예요' : '… 가만히, 올라타길 기다려요',
      tip: '쭈꾸미는 바닥에 붙어 살아요. 봉돌이 바닥을 「툭툭」 치게 하고, 너무 오래 가만히 두면 덜 물어요.', item: '🧤 고패질 장갑(가상)' },
    { id: 'tai', ic: '🔴', name: '참돔 타이라바', sp: '참돔', fish: '🐟', lure: '🔴', B: 40, fall: 8, reel: 2.2, jerk: .5, time: 50, need: 3,
      how: ['바닥까지 내린 뒤 「감기」를 <b>누르고 있어요</b> — 일정한 빠르기로.', '바닥에서 15m 위까지 감고, 다시 바닥까지 내려요.', '❗ 입질이 와도 <b>챔질하지 말고</b> 그대로 계속 감기!', '감기를 멈추거나 챔질하면 빠져요.'],
      bite: s => s.reeling && s.tReel > 1 && inR(s.above, 1, 15) ? .35 : 0,
      hook: { t: 'reel', need: 1.6 },
      hint: s => s.above > 15 ? '⬇ 너무 올라왔어요. 손을 떼고 다시 바닥까지' : !s.reeling && !s.onBottom ? '⬇ 내리는 중…' : !s.reeling ? '⬆ 바닥 도착! 「감기」를 누르고 있어요' : '⬆ 좋아요, 같은 빠르기로 계속 감기',
      tip: '타이라바는 「등속 감기」가 전부예요. 참돔이 툭툭 쪼아도 챔질하지 말고 묵직해질 때까지 그대로 감아요.', item: '🎚 등속 감기 핸들(가상)' },
    { id: 'down', ic: '🫓', name: '광어 다운샷', sp: '넙치(광어)', fish: '🐟', lure: '🪱', B: 30, fall: 7, reel: 5, jerk: .6, time: 50, need: 3,
      how: ['봉돌을 바닥에 닿게 두고, 웜을 「툭」 살짝 흔들어요.', '흔든 뒤 <b>2~8초 기다리기</b> — 광어는 천천히 따라와요.', '❗ 입질이 와도 <b>바로 챔질하면 안 돼요</b>. 하나·둘 세고(1.5초 뒤) 챔질!', '4초가 넘으면 미끼만 먹고 가요.'],
      bite: s => s.onBottom && s.acts > 0 && inR(s.since, 2, 8) ? .35 : 0,
      hook: { t: 'wait', lo: 1.5, hi: 4 },
      hint: s => !s.onBottom ? '⬇ 바닥까지 내리는 중…' : s.acts === 0 || s.since > 8 ? '👉 「툭」 살짝 흔들어 주세요' : '… 기다려요(광어는 천천히)',
      tip: '「광어는 기다렸다 챔질」. 광어는 미끼를 물고 고쳐 무는 시간이 있어서 너무 빨리 채면 빠져요.', item: '⏱ 기다림 시계(가상)' },
    { id: 'card', ic: '🪨', name: '우럭 카드채비', sp: '조피볼락(우럭)', fish: '🐟', lure: '🎏', B: 35, fall: 9, reel: 4, jerk: .8, time: 50, need: 3, snag: 2.5, rock: true,
      how: ['봉돌이 바닥에 「쿵」 닿으면 <b>바로 조금 감아서</b> 1~2m 띄워요.', '우럭은 바닥 바로 위에 모여 있어요.', '바닥에 오래 두면 바위에 걸려요(밑걸림 — 채비를 다시 묶느라 시간이 가요).', '❗ 입질이 오면 <b>바로</b> 챔질!'],
      bite: s => inR(s.above, .5, 2.5) ? .45 : 0,
      hook: { t: 'now', win: 1.3 },
      hint: s => s.onBottom ? '⚠ 바닥이에요! 조금 감아 띄우세요' : s.above > 2.5 && s.above < 6 ? '⬇ 조금만 내려요(바닥 1~2m 위)' : s.above >= 6 ? '⬇ 내리는 중…' : '✓ 좋은 높이! 이대로 기다려요',
      tip: '우럭 낚시의 핵심은 「바닥 찍고 띄우기」. 바위 지형이라 바닥에 오래 두면 걸려요.', item: '🪝 밑걸림 방지 봉돌끈(가상)' },
    { id: 'galchi', ic: '🗡', name: '갈치 층 맞추기', sp: '갈치', fish: '🐟', lure: '🐟', B: 70, fall: 9, reel: 5, jerk: 1.2, time: 50, need: 3, layer: true,
      how: ['어탐(물고기 탐지기)에 보이는 <b>노란 층</b>까지 내려요. 층은 가끔 바뀌어요.', '층 안에서 「툭」 천천히 들어 올리고 0.5~3초 쉬어요.', '❗ 입질이 오면 바로 채지 말고 <b>잠깐(0.8초)</b> 기다렸다 챔질 — 갈치는 미끼를 끊어 먹어요.', '층을 벗어나면 입질이 없어요.'],
      bite: s => inR(s.d, s.ly, s.ly + 8) && s.acts > 0 && inR(s.since, .5, 3) ? .45 : 0,
      hook: { t: 'wait', lo: .8, hi: 3 },
      hint: s => s.d < s.ly ? '⬇ 노란 층까지 내려요' : s.d > s.ly + 8 ? '⬆ 층보다 깊어요. 조금 감아요' : s.acts === 0 || s.since > 3 ? '👉 층 안이에요! 「툭」 천천히' : '… 쉬는 중',
      tip: '갈치는 물속 「층」을 맞추는 게 반이에요. 선장님이 알려 주는 수심(어탐 층)을 꼭 들어요.', item: '📡 층 찾기 어탐 화면(가상)' },
    { id: 'float', ic: '🎈', name: '감성돔 찌낚시', sp: '감성돔', fish: '🐟', lure: '🎈', B: 8, time: 50, need: 3, float: true,
      how: ['먼저 <b>찌 밑 수심</b>을 골라요. 바닥(8m)보다 조금 위가 좋아요.', '찌가 「톡톡」 흔들리는 건 잔챙이·건드림 — 참아요.', '❗ 찌가 <b>완전히 물속으로 잠기면</b> 그때 챔질!', '수심이 바닥보다 깊으면 바늘이 바닥에 걸려요.'],
      tip: '찌낚시는 「수심 맞추기」와 「찌 보기」. 찌가 스르륵 끝까지 잠길 때 챔질해야 감성돔이 걸려요.', item: '🎈 수심 맞춤 찌(가상)' },
    { id: 'nakji', ic: '🦑', name: '낙지 봉돌', sp: '낙지', fish: '🐙', lure: '🦀', B: 12, fall: 5, reel: 1.5, jerk: .3, time: 50, need: 3,
      how: ['봉돌을 바닥에 두고 「툭」으로 살살 <b>끌어요</b>(봉돌이 바닥을 기어가요).', '끈 뒤 가만히 두면 낙지가 덮쳐요.', '❗ 「묵직」 무게가 실리면 <b>1초 기다렸다가</b> 「감기」를 누르고 천천히 감아요(2초).', '챔질처럼 확 당기거나 너무 빨리 감으면 낙지가 떨어져요.'],
      bite: s => s.onBottom && !s.reeling && s.acts > 0 && inR(s.since, 1, 6) ? .32 : 0,
      hook: { t: 'slow', lo: 1, need: 2, hi: 4.5 },
      hint: s => !s.onBottom ? '⬇ 바닥까지 내리는 중…' : s.acts === 0 || s.since > 6 ? '👉 「툭」 살살 끌어 주세요' : '… 가만히, 덮치길 기다려요',
      tip: '낙지는 확 채면 다리를 놓아 버려요. 무게가 실리면 잠깐 기다렸다가 같은 빠르기로 천천히 감아요.', item: '🦀 칠게 미끼통(가상)' },
    { id: 'aori', ic: '🦑', name: '무늬오징어 에깅', sp: '무늬오징어', fish: '🦑', lure: '🦐', B: 15, fall: 2.2, reel: 6, jerk: 1.6, time: 50, need: 3,
      how: ['에기를 바닥 가까이 내린 뒤 「툭툭」 <b>2번 이상</b> 빠르게 쳐 올려요(샤크리).', '그다음 <b>손을 떼고</b> 에기가 천천히 가라앉게 둬요(폴링).', '무늬오징어는 <b>가라앉을 때</b> 안아요.', '❗ 입질이 오면 <b>바로</b> 챔질!'],
      bite: s => s.falling && s.jerks >= 2 && inR(s.since, .3, 4) ? .55 : 0,
      hook: { t: 'now', win: 1 },
      hint: s => s.reeling ? '손을 떼야 에기가 가라앉아요' : s.jerks < 2 && s.since > .8 ? '👉 「툭툭」 두 번 이상 쳐 올려요' : s.falling ? '… 가라앉는 중(폴링) — 여기서 안아요' : '👉 「툭툭」 쳐 올려요',
      tip: '에깅은 「쳐 올리기 → 가라앉히기」의 반복. 입질은 대부분 가라앉을 때 와요.', item: '🦑 폴링 에기 상자(가상)' }
  ];

  function shell(container) {
    container.innerHTML = `<div style="display:grid;gap:10px;max-width:520px;margin:0 auto"><div data-body></div><div data-res style="display:none;padding:10px 12px;border-radius:10px;background:var(--sea-soft,#1F3A50);font-size:14.5px;line-height:1.6"></div></div>`;
    return { body: container.querySelector('[data-body]'), res: container.querySelector('[data-res]') };
  }

  function game(container, onReward) {
    const sh = shell(container); let stop = () => {};
    function menu() {
      stop(); sh.res.style.display = 'none';
      const st = LS.get(KEY, {}), done = M.filter(m => st[m.id] && st[m.id].done).length;
      sh.body.innerHTML = `<div style="line-height:1.6"><b style="font-size:16px">🎓 낚시법 도장 깨기</b> · 도장 <b>${done}/${M.length}</b>${done === M.length ? ' 🏅 <b>만능 낚시 박사!</b>' : ''}
        <div style="font-size:13px;opacity:.85">낚시법마다 내리기·감기·챔질 요령이 달라요. 제한 시간 안에 3마리를 잡으면 도장과 가상 장비를 받아요.</div></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:8px">${M.map(m => { const r = st[m.id] || {}; return `<button type="button" data-m="${m.id}" style="${SOFT};text-align:left;padding:10px;min-height:76px;touch-action:manipulation">
          <span style="font-size:20px">${m.ic}</span> <b>${esc(m.name)}</b>${r.done ? ' <span style="color:#4BD08A">✔ 도장</span>' : ''}<br><span style="font-size:11.5px;opacity:.75">${esc(m.sp)}${r.best ? ' · 최고 ' + r.best + '마리' : ''}</span></button>`; }).join('')}</div>
        ${done ? `<div style="font-size:12.5px;margin-top:8px;opacity:.85">받은 장비: ${M.filter(m => st[m.id] && st[m.id].done).map(m => esc(m.item)).join(' · ')}</div>` : ''}`;
      sh.body.querySelectorAll('[data-m]').forEach(b => b.onclick = () => lesson(M.find(m => m.id === b.dataset.m)));
    }
    function lesson(m) {
      stop(); sh.res.style.display = 'none';
      sh.body.innerHTML = `<div style="display:grid;gap:8px;line-height:1.6"><b style="font-size:16px">${m.ic} ${esc(m.name)} <span style="font-size:12px;opacity:.75">(${esc(m.sp)})</span></b>
        <ol style="margin:0;padding-left:20px;font-size:14px">${m.how.map(h => `<li>${h}</li>`).join('')}</ol>
        <div style="font-size:12.5px;opacity:.85">${m.float ? '조작: 찌 수심 고르기 · 🎣 챔질(스페이스)' : '조작: ⬆ 감기는 <b>누르고 있기</b>(↑·W 키) · 🎣 「툭·챔질」(스페이스). 손을 떼면 가라앉아요.'} · ${m.time}초 안에 ${m.need}마리</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button type="button" data-back style="${SOFT};touch-action:manipulation">← 목록</button><button type="button" data-go style="${PRIMARY};touch-action:manipulation">🎣 시작</button></div></div>`;
      sh.body.querySelector('[data-back]').onclick = menu; sh.body.querySelector('[data-go]').onclick = () => run(m);
    }
    function result(m, n) {
      const st = LS.get(KEY, {}), r = st[m.id] || {}, pass = n >= m.need, first = pass && !r.done;
      st[m.id] = { done: r.done || pass, best: Math.max(r.best || 0, n) }; LS.set(KEY, st);
      const all = M.every(x => st[x.id] && st[x.id].done), score = n * 30 + (pass ? 60 : 0) + (first ? 60 : 0), coins = Math.floor(score / 10);
      sh.res.style.display = 'block';
      sh.res.innerHTML = `<b style="font-size:18px">${pass ? '🎉 통과!' : '아쉬워요'}</b> ${m.fish} ${n}/${m.need}마리 · <b>${score}점</b> · 🪙 +${coins}
        ${first ? `<br>🏅 도장 획득 · 장비 <b>${esc(m.item)}</b>` : ''}${first && all ? '<br>🎓 8가지 낚시법 모두 통과 — <b>만능 낚시 박사</b>!' : ''}
        <br><span style="font-size:13px">💡 ${esc(m.tip)}</span>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><button type="button" data-again style="${PRIMARY};touch-action:manipulation">↻ 다시</button><button type="button" data-list style="${SOFT};touch-action:manipulation">다른 낚시법</button></div>`;
      sh.res.querySelector('[data-again]').onclick = () => run(m); sh.res.querySelector('[data-list]').onclick = menu;
      sfx(pass ? 'win' : 'miss'); if (onReward) try { onReward({ game: 'methods', score, coins }); } catch (e) {}
    }

    function run(m) {
      stop(); sh.res.style.display = 'none';
      sh.body.innerHTML = `<div style="display:flex;justify-content:space-between;font-weight:700"><span data-t></span><span>${m.ic} ${esc(m.name)}</span><span data-c></span></div>
        <canvas style="width:100%;aspect-ratio:1/1;max-width:min(100%,62vh);margin:0 auto;border-radius:14px;display:block;touch-action:none;background:#0B3B5A" aria-label="${esc(m.name)} 게임 화면"></canvas>
        <div data-msg style="min-height:42px;font-size:14px;line-height:1.45;margin:6px 0"></div>
        ${m.float ? `<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:6px"><span style="font-size:13px">찌 밑 수심</span>${[3, 6, 9].map(v => `<button type="button" data-dep="${v}" style="${SOFT};min-height:40px;padding:0 14px;touch-action:manipulation">${v}m</button>`).join('')}</div>
          <button type="button" data-act style="${PRIMARY};width:100%">🎣 챔질</button>`
        : `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button type="button" data-reel style="${SOFT}">⬆ 감기(누르고 있기)</button><button type="button" data-act style="${PRIMARY}">🎣 툭 · 챔질</button></div>`}`;
      const cv = sh.body.querySelector('canvas'), g = cv.getContext('2d'), q = s => sh.body.querySelector(s);
      let W = 0, H = 0; const size = () => { const r = cv.getBoundingClientRect(), k = Math.min(2, devicePixelRatio || 1); W = r.width || 320; H = W; cv.width = W * k; cv.height = H * k; g.setTransform(k, 0, 0, k, 0, 0); };
      const ro = window.ResizeObserver ? new ResizeObserver(size) : null; if (ro) ro.observe(cv); size();
      const s = { d: 0, B: m.B, reeling: false, tReel: 0, since: 99, acts: 0, actT: [], onBottom: false, onBotT: 0, falling: false, above: m.B, jerks: 0, ly: 25, lyT: 0,
        bite: null, cool: 0, snag: 0, time: m.time, n: 0, now: 0, pops: [], msg: '', msgT: 0, dep: 0, fl: null, flT: 1.5, recast: 0 };
      let hold = false, alive = true, raf = 0, last = 0;
      const fishes = Array.from({ length: 5 }, (_, i) => ({ x: Math.random(), v: (Math.random() < .5 ? -1 : 1) * (.03 + Math.random() * .05), o: Math.random() }));
      const say = (t, sec) => { s.msg = t; s.msgT = sec || 1.8; };
      function catchIt() { s.n++; s.bite = null; s.fl = null; s.cool = 1.2; s.pops.push({ t: 1.2 }); say(`🎉 ${m.sp} 잡았다! (${s.n}/${m.need})`, 1.6); sfx('win'); buzz('win'); if (!m.float) { s.d = 0; s.acts = 0; s.jerks = 0; } if (s.n >= m.need) s.time = Math.min(s.time, .8); }
      function miss(t) { s.bite = null; s.fl = null; s.cool = 1; say('😢 ' + t, 2.2); sfx('miss'); buzz('miss'); }
      function act() {
        if (s.time <= 0) return;
        if (m.float) {
          if (s.recast > 0 || !s.dep) return;
          const f = s.fl; if (f && f.real && f.p >= 1) catchIt(); else if (f) { miss(f.real ? '너무 일러요 — 찌가 끝까지 잠길 때 챔질!' : '잔챙이 건드림이었어요. 참아야 해요'); } else say('아직 입질이 없어요. 찌를 지켜봐요', 1.2);
          return;
        }
        if (s.snag > 0) return;
        const b = s.bite;
        if (b) {
          const h = m.hook;
          if (h.t === 'now') return b.t <= h.win ? catchIt() : miss('늦었어요');
          if (h.t === 'wait') return b.t < h.lo ? miss('너무 빨라요 — 조금 기다렸다 챔질!') : catchIt();
          if (h.t === 'reel') return miss('챔질하면 빠져요 — 그대로 감기만!');
          if (h.t === 'slow') return miss('확 당기면 낙지가 떨어져요 — 천천히 감기!');
        }
        s.d = Math.max(0, s.d - m.jerk); s.since = 0; s.acts++; s.actT.push(s.now); sfx('hit');
      }
      function step(dt) {
        s.now += dt; s.time -= dt; s.msgT -= dt; s.pops.forEach(p => p.t -= dt); s.pops = s.pops.filter(p => p.t > 0);
        fishes.forEach(f => { f.x += f.v * dt; if (f.x < 0 || f.x > 1) f.v *= -1; });
        if (s.time <= 0) return;
        if (s.cool > 0) s.cool -= dt;
        if (m.float) {
          if (s.recast > 0) { s.recast -= dt; return; }
          if (!s.dep) return;
          if (s.fl) { const f = s.fl; f.t += dt; if (f.real) { f.p = Math.min(1, f.t / 1.1); if (f.t > 2.7) miss('찌가 다시 올라왔어요 — 물고기가 미끼만 먹고 갔어요'); } else if (f.t > .45) s.fl = null; return; }
          if (s.cool > 0) return;
          const rate = s.dep === 6 ? .5 : s.dep === 3 ? .14 : 0;
          if (s.dep === 9 && s.msgT <= 0) say('⚠ 바늘이 바닥에 걸려 찌가 안 움직여요. 수심을 바닥(8m)보다 얕게!', 2.5);
          if (Math.random() < rate * dt) { s.fl = { t: 0, p: 0, real: Math.random() < (s.dep === 6 ? .45 : .25) }; if (s.fl.real) buzz('hit'); }
          return;
        }
        if (s.snag > 0) { s.snag -= dt; if (s.snag <= 0) say('채비를 다시 묶었어요. 내려요!', 1.4); return; }
        if (m.layer) { s.lyT += dt; if (s.lyT > 14) { s.lyT = 0; s.ly = 15 + Math.floor(Math.random() * 40); say(`📡 어탐: 갈치 층이 ${s.ly}~${s.ly + 8}m로 바뀌었어요`, 2.2); } }
        s.reeling = hold;
        if (hold) { s.d = Math.max(0, s.d - m.reel * dt); s.tReel += dt; } else { s.tReel = 0; s.d = Math.min(s.B, s.d + m.fall * dt); }
        s.onBottom = s.d >= s.B - .05; s.onBotT = s.onBottom ? s.onBotT + dt : 0; s.since += dt; s.above = s.B - s.d; s.falling = !hold && !s.onBottom;
        s.actT = s.actT.filter(t => s.now - t < 5); s.jerks = s.actT.length;
        if (m.snag && s.onBotT > m.snag) { s.snag = 4; s.bite = null; s.d = 0; s.onBotT = 0; say('🪨 밑걸림! 바닥에 너무 오래 뒀어요. 채비 다시 묶는 중(4초)…', 3); sfx('miss'); buzz('miss'); return; }
        const b = s.bite, h = m.hook;
        if (b) {
          b.t += dt;
          if (h.t === 'now' && b.t > h.win) miss('늦었어요 — 입질 오면 바로 챔질!');
          else if (h.t === 'wait' && b.t > h.hi) miss('너무 오래 기다렸어요 — 미끼만 먹고 갔어요');
          else if (h.t === 'reel') { if (hold) { b.r = (b.r || 0) + dt; if (b.r >= h.need) catchIt(); } else if (b.t > .35) miss('감기를 멈추면 빠져요 — 끝까지 계속 감기!'); }
          else if (h.t === 'slow') { if (hold) { if (b.t < h.lo) miss('너무 빨리 감았어요 — 1초 기다렸다가!'); else { b.r = (b.r || 0) + dt; if (b.r >= h.need) catchIt(); } } else if (b.t > h.hi) miss('너무 오래 기다렸어요 — 낙지가 도망갔어요'); }
        } else if (s.cool <= 0 && Math.random() < m.bite(s) * dt) { s.bite = { t: 0 }; buzz('hit'); sfx('hit'); }
      }
      function draw() {
        const top = H * .17, bot = H * .9, Y = d => top + (d / s.B) * (bot - top), t = s.now;
        const sky = g.createLinearGradient(0, 0, 0, top); sky.addColorStop(0, '#FDB97A'); sky.addColorStop(1, '#F6E2B5'); g.fillStyle = sky; g.fillRect(0, 0, W, top);
        const sea = g.createLinearGradient(0, top, 0, H); sea.addColorStop(0, '#2B8CB3'); sea.addColorStop(1, '#06233A'); g.fillStyle = sea; g.fillRect(0, top, W, H - top);
        g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(0, top); for (let x = 0; x <= W; x += 8) g.lineTo(x, top + Math.sin(x / 22 + t * 2) * 2); g.lineTo(W, top + 4); g.lineTo(0, top + 4); g.fill();
        if (m.layer) { g.fillStyle = 'rgba(255,214,77,.22)'; g.fillRect(0, Y(s.ly), W, Y(s.ly + 8) - Y(s.ly)); g.fillStyle = '#FFE27A'; g.font = '700 11px sans-serif'; g.textAlign = 'left'; g.fillText('📡 어탐 반응 층', 6, Y(s.ly) + 13); }
        // 바닥
        g.fillStyle = m.rock ? '#3E3A36' : '#BFA77A'; g.beginPath(); g.moveTo(0, bot); for (let x = 0; x <= W; x += 14) g.lineTo(x, bot + (m.rock ? ((x * 7) % 23) - 10 : Math.sin(x / 30) * 3)); g.lineTo(W, H); g.lineTo(0, H); g.fill();
        // 눈금
        g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '11px sans-serif'; g.textAlign = 'right';
        for (let k = 0; k <= 4; k++) { const dd = Math.round(s.B * k / 4); g.fillText(dd + 'm', W - 4, Y(dd) + (k === 0 ? 12 : -2)); }
        // 물고기 그림자
        const fz = m.float ? 6 : m.layer ? s.ly + 4 : m.id === 'card' ? s.B - 1.5 : m.id === 'tai' ? s.B - 6 : s.B - .8;
        g.font = '18px system-ui, "Segoe UI Emoji"'; g.textAlign = 'center'; g.globalAlpha = .45;
        fishes.forEach((f, i) => g.fillText(m.fish, f.x * W * .8 + W * .05, Y(Math.min(s.B - .3, fz + (i - 2) * (m.float ? .5 : s.B * .02))) + Math.sin(t + f.o * 6) * 3));
        g.globalAlpha = 1;
        // 배와 낚싯대
        const bx = W * .22; g.fillStyle = '#E8EEF2'; g.beginPath(); g.moveTo(bx - 60, top - 16); g.lineTo(bx + 50, top - 16); g.lineTo(bx + 34, top + 6); g.lineTo(bx - 50, top + 6); g.fill(); g.fillStyle = '#C0392B'; g.fillRect(bx - 50, top - 4, 84, 4);
        g.fillStyle = '#FFF'; g.fillRect(bx - 30, top - 38, 34, 22); g.fillStyle = '#7FB8D8'; g.fillRect(bx - 26, top - 34, 12, 9);
        const shake = (s.bite || (s.fl && s.fl.real)) ? Math.sin(t * 40) * 5 : 0, tipX = W * .6, tipY = top - H * .08 + shake;
        g.strokeStyle = '#333'; g.lineWidth = 3; g.beginPath(); g.moveTo(bx + 20, top - 12); g.lineTo(tipX, tipY); g.stroke();
        if (m.float) {
          const fy = top + (s.fl ? (s.fl.real ? s.fl.p * 26 : Math.sin(s.fl.t * 30) * 4) : Math.sin(t * 2) * 1.5), hookY = s.dep ? Y(Math.min(s.B, s.dep)) : top;
          g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1; g.beginPath(); g.moveTo(tipX, tipY); g.lineTo(tipX, fy); g.moveTo(tipX, fy); g.lineTo(tipX, hookY); g.stroke();
          if (s.dep && s.recast <= 0) { g.fillStyle = '#FF5A3C'; g.beginPath(); g.ellipse(tipX, fy - 6, 5, 11, 0, 0, 7); g.fill(); g.fillStyle = '#FFF'; g.fillRect(tipX - 5, fy - 2, 10, 3); g.fillStyle = '#FFE27A'; g.font = '14px sans-serif'; g.fillText('🪝', tipX + 2, hookY + 4); }
        } else {
          const ly = Y(s.d), lx = tipX + (s.bite ? Math.sin(t * 30) * 3 : 0);
          g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1; g.beginPath(); g.moveTo(tipX, tipY); g.lineTo(lx, ly); g.stroke();
          g.font = '20px system-ui, "Segoe UI Emoji"'; g.textAlign = 'center'; g.fillText(s.snag > 0 ? '💥' : m.lure, lx, ly + 7);
          if (s.bite) { g.fillStyle = '#FFE27A'; g.font = '800 22px sans-serif'; g.fillText('❗', lx + 22, ly - 6); }
        }
        if (m.float && s.fl && s.fl.real) { g.fillStyle = '#FFE27A'; g.font = '800 18px sans-serif'; g.textAlign = 'center'; g.fillText(s.fl.p >= 1 ? '❗ 지금!' : '스르륵…', tipX, top - 30); }
        s.pops.forEach(p => { g.globalAlpha = Math.min(1, p.t); g.font = `${40 + (1.2 - p.t) * 30}px system-ui, "Segoe UI Emoji"`; g.textAlign = 'center'; g.fillText(m.fish, W / 2, H * .45 - (1.2 - p.t) * 60); g.globalAlpha = 1; });
        q('[data-t]').textContent = `⏱ ${Math.max(0, Math.ceil(s.time))}초`; q('[data-c]').textContent = `${m.fish} ${s.n}/${m.need}`;
        const tip = s.bite && !m.float ? ({ now: '❗ 입질! 바로 챔질!', wait: '❗ 입질! 조금만 기다렸다가 챔질…', reel: '❗ 입질! 챔질 말고 계속 감기!', slow: '❗ 묵직… 1초 기다렸다가 천천히 감기' })[m.hook.t]
          : m.float && s.fl && s.fl.real && s.recast <= 0 ? (s.fl.p >= 1 ? '❗ 완전히 잠겼어요 — 챔질!' : '찌가 스르륵 잠기는 중… 아직!')
          : s.msgT > 0 ? s.msg : m.float ? (!s.dep ? '👉 먼저 찌 밑 수심을 골라요(바닥 8m)' : s.recast > 0 ? '던지는 중…' : s.fl && s.fl.real ? (s.fl.p >= 1 ? '❗ 완전히 잠겼어요 — 챔질!' : '찌가 스르륵 잠기는 중… 아직!') : s.fl ? '톡톡… 건드림이에요. 참아요' : `찌를 지켜봐요 (찌 밑 ${s.dep}m)`)
          : s.snag > 0 ? '🪨 채비 다시 묶는 중…' : s.bite ? ({ now: '❗ 입질! 바로 챔질!', wait: '❗ 입질! 조금만 기다렸다가 챔질…', reel: '❗ 입질! 챔질 말고 계속 감기!', slow: '❗ 묵직… 1초 기다렸다가 천천히 감기' })[m.hook.t] : m.hint(s);
        q('[data-msg]').textContent = tip;
      }
      function frame(ts) {
        if (!alive) return; if (!cv.isConnected) { cleanup(); return; }
        const dt = Math.min(1 / 20, (ts - (last || ts)) / 1000); last = ts; step(dt); draw();
        if (s.time <= 0) { cleanup(); result(m, s.n); return; }
        raf = requestAnimationFrame(frame);
      }
      const reel = q('[data-reel]');
      if (reel) {
        const on = e => { e.preventDefault(); hold = true; reel.style.background = '#3F6E7C'; }, off = () => { hold = false; reel.style.background = '#2A4650'; };
        reel.addEventListener('pointerdown', on); ['pointerup', 'pointerleave', 'pointercancel'].forEach(k => reel.addEventListener(k, off)); reel.addEventListener('contextmenu', e => e.preventDefault());
      }
      q('[data-act]').addEventListener('pointerdown', e => { e.preventDefault(); act(); });
      sh.body.querySelectorAll('[data-dep]').forEach(b => b.onclick = () => { s.dep = +b.dataset.dep; s.recast = 1.2; s.fl = null; sh.body.querySelectorAll('[data-dep]').forEach(x => x.style.background = x === b ? '#3F6E7C' : '#2A4650'); });
      const kd = e => { if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); if (!e.repeat) act(); } else if (e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); hold = true; } };
      const ku = e => { if (e.code === 'ArrowUp' || e.code === 'KeyW') hold = false; };
      document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
      function cleanup() { alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); }
      stop = cleanup;
      raf = requestAnimationFrame(frame);
    }
    menu();
  }

  const LIST = [{ id: 'methods', ic: '🎓', name: '낚시법 도장 깨기', desc: '[배우는 게임] 쭈꾸미 에기·참돔 타이라바·광어 다운샷·우럭 카드채비·갈치 층·감성돔 찌·낙지 봉돌·무늬오징어 에깅 — 요령대로 잡고 도장 8개', goal: 200, mount: game }];
  if (window.GameHub) LIST.forEach(x => { if (GameHub.GNAME) GameHub.GNAME[x.id] = x.name; if (GameHub.GOAL) GameHub.GOAL[x.id] = x.goal; });
  window.MethodGames = { M, LIST, extra: onReward => LIST.map(x => ({ id: x.id, ic: x.ic, name: x.name, desc: x.desc, isNew: true, mount: el => x.mount(el, onReward) })) };
})();
