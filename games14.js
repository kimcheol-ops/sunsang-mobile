/* 🗺 바다 나들이 게임 2종 — 허락 3번(게임·이야기 매일) 2026-11-19
 * (PC · 휴대폰 앱 · 조황 수첩 공용, games3.js(GameHub) 뒤에 로드)
 * TripGames.extra(onReward) → 게임 메뉴 항목. 끝나면 onReward({ game, score, coins })
 * ① 🗺 출조+나들이 하루 계획 — 오늘의 바다 소식(today-data.js)의 실제 출조 지수·지역 행사로 코스 짜기(1판은 오늘 실제 자료, 2·3판은 연습용 가상의 날)
 * ② ⚓ 출항 전 안전 점검 — 챙길 것·할 일 / 하면 안 되는 것 빠르게 고르기, 틀리면 이유 설명
 * 기록은 이 기기 localStorage에만. 결제·광고 없음, 실제 업체·제품 이름 없음.
 */
(function () {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sfx = k => window.GameHub && GameHub.sfx && GameHub.sfx(k);
  const buzz = k => { try { window.PhoneKit && PhoneKit.buzz && PhoneKit.buzz(k); } catch (e) {} };
  const BTN = 'min-height:48px;border:0;border-radius:12px;font:700 15px inherit;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none';
  const PRIMARY = BTN + ';background:#E2572B;color:#fff', SOFT = BTN + ';background:#2A4650;color:#E3EEF0', OK = BTN + ';background:#2E7D5B;color:#fff', BAD = BTN + ';background:#A33A3A;color:#fff';
  const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)], clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const CARD = 'padding:10px 12px;border-radius:12px;background:var(--sea-soft,#1F3A50);line-height:1.55';
  const km = (a, b, c, d) => { const R = 6371, r = x => x * Math.PI / 180, x = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };

  function shell(container) {
    container.innerHTML = `<div style="display:grid;gap:10px;max-width:560px;margin:0 auto"><div data-body></div><div data-res style="display:none;${CARD};font-size:14.5px"></div></div>`;
    return { body: container.querySelector('[data-body]'), res: container.querySelector('[data-res]') };
  }
  function endBox(sh, html, again, onReward, rec) {
    sh.res.style.display = 'block';
    sh.res.innerHTML = html + `<div style="display:grid;gap:8px;margin-top:8px"><button type="button" data-again style="${PRIMARY}">↻ 다시 하기</button></div>`;
    sh.res.querySelector('[data-again]').onclick = again;
    sfx('win'); if (onReward && rec) try { onReward(rec); } catch (e) {}
  }

  /* ───────────── 🗺 출조+나들이 하루 계획 ───────────── */
  // 바닷가 지역 좌표(오늘의 바다 소식 화면의 항구 목록과 같은 값 일부)
  const PORT = { 인천: [37.45, 126.60], 태안: [36.75, 126.15], 보령: [36.33, 126.55], 군산: [35.98, 126.62], 목포: [34.79, 126.38], 무안: [34.99, 126.42], 진도: [34.47, 126.26], 완도: [34.31, 126.75], 고흥: [34.60, 127.28], 여수: [34.74, 127.74], 남해: [34.84, 127.89], 사천: [35.00, 128.06], 통영: [34.85, 128.43], 거제: [34.88, 128.62], 창원: [35.20, 128.57], 부산: [35.10, 129.04], 울산: [35.50, 129.38], 포항: [36.03, 129.37], 울진: [36.99, 129.40], 강릉: [37.75, 128.90], 속초: [38.20, 128.59], 제주시: [33.51, 126.52], 서귀포: [33.25, 126.56], 고성: [34.97, 128.32], 순천: [34.95, 127.49], 광양: [34.94, 127.70], 보성: [34.77, 127.08], 하동: [35.07, 127.75] };
  const ASK = [
    { t: '👨‍👩‍👧 아이와 함께 — 오전 낚시, 저녁엔 가족 행사', want: ['가족', '야간'] },
    { t: '🍽 낚시 끝나고 바닷가 먹거리 장터 들르기', want: ['먹거리', '바다'] },
    { t: '📚 배우는 하루 — 박물관·과학·역사 행사와 함께', want: ['교육'] },
    { t: '🌿 낚시 뒤 산책·꽃·바닷길 힐링', want: ['힐링', '바다'] },
  ];
  const FAKE_EV = [
    ['항구 수산물 장터', ['바다', '먹거리', '가족']], ['바닷가 불꽃놀이', ['가족', '야간']], ['해양 과학 체험관 특별전', ['교육', '가족']], ['바닷길 걷기 행사', ['힐링', '바다']],
    ['어촌 갯벌 체험', ['바다', '교육', '가족']], ['등대 야간 개방', ['야간', '힐링']], ['수군 역사 재현 마당', ['교육']], ['해변 국화 전시', ['힐링']],
  ];
  const timeOf = b => { const m = /(\d\d):\d\d/.exec(b || ''); return m ? +m[1] : null; };
  function realDay() {
    const T = window.TODAY_DATA; if (!T || !T.scores) return null;
    const today = new Date().toISOString().slice(0, 10);
    const regs = Object.entries(T.scores).filter(([n]) => PORT[n]).map(([n, v]) => ({ n, s: v[0], g: v[1], best: timeOf(v[2]) }));
    const evs = (T.events || []).filter(e => e.end >= today && e.lat).map(e => ({ t: e.title, lat: e.lat, lon: e.lon, tags: e.tags || [] }));
    return regs.length >= 4 && evs.length >= 3 ? { real: true, label: `오늘(${T.date}) 실제 출조 지수·행사`, regs, evs } : null;
  }
  function fakeDay() {
    const names = shuffle(Object.keys(PORT)).slice(0, 7);
    const regs = names.map(n => { const s = Math.round(clamp(rnd(15, 102), 5, 100)); return { n, s, g: s >= 75 ? '양호' : s >= 50 ? '보통' : '주의', best: s >= 50 ? pick([4, 5, 6, 8, 9, 11, 14]) : null }; });
    const evs = names.slice(0, 6).map((n, i) => { const f = FAKE_EV[(i + Math.floor(rnd(0, 8))) % FAKE_EV.length]; return { t: `${n} ${f[0]}`, lat: PORT[n][0] + rnd(-0.08, 0.08), lon: PORT[n][1] + rnd(-0.08, 0.08), tags: f[1] }; });
    return { real: false, label: '연습용 가상의 날(지수·행사는 지어낸 값)', regs, evs };
  }
  function planGame(container, onReward) {
    const sh = shell(container);
    let total = 0, round = 0, notes = [], day = null, ask = null, pickR = null, pickH = null;
    const ROUNDS = 3;
    function intro() {
      sh.res.style.display = 'none'; total = 0; round = 0; notes = [];
      const best = LS.get('game.plan', 0);
      sh.body.innerHTML = `<div style="${CARD}"><b style="font-size:16px">🗺 출조+나들이 하루 계획</b>${best ? ` · 최고 <b>${best}점</b>` : ''}
        <ul style="margin:6px 0 0;padding-left:20px;font-size:13.5px"><li>가족의 부탁을 듣고 <b>① 출조할 바다 → ② 출항 시간 → ③ 들를 행사</b>를 골라요.</li>
        <li>출조 지수가 높고 <b>주의</b>가 아닌 곳, 가장 좋은 시간대, 가깝고 부탁에 맞는 행사일수록 점수가 커요.</li>
        <li>1판은 <b>오늘의 바다 소식의 실제 지수·행사</b>, 2·3판은 연습용 가상의 날이에요.</li>
        <li>실제 출항 전에는 꼭 기상청 특보와 해경 통제를 확인하세요.</li></ul></div>
        <button type="button" data-go style="${PRIMARY};width:100%;margin-top:8px">🗺 계획 시작</button>`;
      sh.body.querySelector('[data-go]').onclick = next;
    }
    function head(step) {
      return `<div style="${CARD}"><div style="font-size:12px;opacity:.8">${round}/${ROUNDS}판 · ${esc(day.label)} · 점수 ${total}</div><b>${esc(ask.t)}</b><div style="font-size:13px;margin-top:2px">${step}</div></div>`;
    }
    function next() {
      round++; if (round > ROUNDS) return finish();
      day = (round === 1 && realDay()) || fakeDay(); ask = pick(ASK); pickR = pickH = null;
      stepRegion();
    }
    function stepRegion() {
      const opts = shuffle(day.regs).slice(0, 4);
      if (!opts.some(r => r.g === '주의') && day.regs.some(r => r.g === '주의')) opts[3] = day.regs.find(r => r.g === '주의');
      const col = g => g === '양호' ? '#2E7D5B' : g === '보통' ? '#9A7B1C' : '#A33A3A';
      sh.body.innerHTML = head('① 어느 바다로 출조할까요?') + `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${shuffle(opts).map(r =>
        `<button type="button" data-r="${esc(r.n)}" style="${SOFT};display:grid;gap:2px;padding:8px"><span style="font-size:16px">${esc(r.n)}</span><span style="font-size:13px"><b style="color:#fff;background:${col(r.g)};border-radius:6px;padding:0 6px">${r.s}</b> ${esc(r.g)}</span></button>`).join('')}</div>`;
      sh.body.onclick = e => {
        const b = e.target.closest('[data-r]'); if (!b) return; sh.body.onclick = null;
        pickR = day.regs.find(r => r.n === b.dataset.r);
        const top = Math.max(...opts.map(r => r.s));
        let p = Math.round(pickR.s * 0.5);
        if (pickR.g === '주의') { p = -20; notes.push(`${pickR.n}: 지수 ${pickR.s} 「주의」 — 바람·파도가 센 날은 출조를 쉬는 게 안전해요.`); buzz('bad'); sfx('lose'); }
        else if (pickR.s === top) { p += 10; sfx('ok'); } else sfx('ok');
        total += p; stepTime();
      };
    }
    function stepTime() {
      if (pickR.g === '주의' || pickR.best == null) { // 출조 쉬는 날: 바로 행사로
        sh.body.innerHTML = head(`⚠ ${esc(pickR.n)}은 오늘 바다가 좋지 않아요. 출조는 쉬고 나들이만 해요.`) + `<button type="button" data-n style="${PRIMARY};width:100%">③ 행사 고르기 →</button>`;
        sh.body.querySelector('[data-n]').onclick = stepEvent; return;
      }
      const good = pickR.best, opts = shuffle([good, ...shuffle([4, 6, 8, 10, 12, 14, 16].filter(h => Math.abs(h - good) >= 3)).slice(0, 2)]);
      sh.body.innerHTML = head(`② ${esc(pickR.n)} 출항 시간은? <span style="opacity:.8">(지수 ${pickR.s})</span>`) + `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${opts.map(h => `<button type="button" data-h="${h}" style="${SOFT}">${String(h).padStart(2, '0')}:00</button>`).join('')}</div>
        <div style="font-size:12.5px;opacity:.85">힌트: 바람이 약하고 파도가 낮은 시간대가 「가장 좋은 시간」이에요.</div>`;
      sh.body.onclick = e => {
        const b = e.target.closest('[data-h]'); if (!b) return; sh.body.onclick = null;
        pickH = +b.dataset.h;
        if (pickH === good) { total += 25; sfx('ok'); } else { total += 5; notes.push(`${pickR.n}: 가장 좋은 시간은 ${String(good).padStart(2, '0')}시쯤이었어요(바람·파도가 가장 약한 때).`); buzz('bad'); }
        stepEvent();
      };
    }
    function stepEvent() {
      const at = PORT[pickR.n];
      const withD = day.evs.map(e => ({ ...e, d: km(at[0], at[1], e.lat, e.lon), m: e.tags.filter(t => ask.want.includes(t)).length }));
      const near = withD.slice().sort((a, b) => a.d - b.d);
      const opts = shuffle([near[0], ...shuffle(near.slice(1)).slice(0, 2)]);
      sh.body.innerHTML = head(`③ ${esc(pickR.n)}에서 귀항한 뒤 들를 행사는?`) + `<div style="display:grid;gap:8px">${opts.map((e, i) =>
        `<button type="button" data-e="${i}" style="${SOFT};text-align:left;padding:8px 12px;display:grid;gap:2px"><span>${esc(e.t)}</span><span style="font-size:12.5px;opacity:.85">📍 ${pickR.n}에서 약 ${Math.round(e.d)}km · ${e.tags.map(t => '#' + esc(t)).join(' ')}</span></button>`).join('')}</div>`;
      sh.body.onclick = ev => {
        const b = ev.target.closest('[data-e]'); if (!b) return; sh.body.onclick = null;
        const e = opts[+b.dataset.e];
        let p = e.d < 40 ? 25 : e.d < 100 ? 12 : 0; p += e.m * 8;
        if (e.d >= 100) notes.push(`${e.t}: ${pickR.n}에서 ${Math.round(e.d)}km — 새벽 출조 뒤엔 가까운 행사가 덜 피곤해요.`);
        if (!e.m) notes.push(`「${ask.t.replace(/^\S+\s/, '')}」 부탁엔 ${ask.want.map(t => '#' + t).join('·')} 행사가 더 잘 맞아요.`);
        total += p; sfx(p >= 30 ? 'win' : 'ok');
        sh.body.innerHTML = head(`이번 판 +${p + 0}점(행사) · 누적 ${total}점`) + `<button type="button" data-n style="${PRIMARY};width:100%">${round < ROUNDS ? '다음 판 →' : '결과 보기'}</button>`;
        sh.body.querySelector('[data-n]').onclick = next;
      };
    }
    function finish() {
      const score = Math.max(0, total), best = LS.get('game.plan', 0); if (score > best) LS.set('game.plan', score);
      const coins = Math.round(score / 20);
      sh.body.innerHTML = '';
      endBox(sh, `<b style="font-size:16px">🗺 하루 계획 완성 — ${score}점</b>${score > best ? ' · 🏆 새 최고!' : ''} · 🪙 +${coins}
        ${notes.length ? `<ul style="font-size:13px;margin:6px 0;padding-left:20px">${notes.slice(0, 5).map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : '<br><span style="font-size:13px">👍 완벽한 코스예요! 실제 오늘의 추천 코스는 「오늘의 바다 소식」에서 볼 수 있어요.</span>'}`,
        intro, onReward, { game: 'tripplan', score, coins });
    }
    intro();
    return { destroy: () => { sh.body.onclick = null; } };
  }

  /* ───────────── ⚓ 출항 전 안전 점검 ───────────── */
  const SAFE = [
    ['구명조끼를 입고 끈까지 채우기', 1, '배 위에서는 언제나 구명조끼 착용이 기본이에요.'],
    ['출항 전 기상특보·해경 통제 확인', 1, '특보가 있으면 배가 나가지 않아요. 미리 확인하면 헛걸음도 막아요.'],
    ['신분증 챙기기(승선 명부 확인)', 1, '낚시어선은 승선 명부를 쓰고 신분증으로 확인해요.'],
    ['가족에게 출조 항구·귀항 시간 알리기', 1, '무슨 일이 생기면 가족이 빨리 알 수 있어요.'],
    ['멀미약은 출항 30분~1시간 전에', 1, '배를 탄 뒤 먹으면 늦어요. 미리 먹어야 효과가 있어요.'],
    ['쓰레기 봉투 챙겨서 되가져오기', 1, '바다에 남긴 줄·봉지는 바다 생물에게 위험해요.'],
    ['미끄럽지 않은 신발 신기', 1, '젖은 갑판은 아주 미끄러워요.'],
    ['방한복·여벌 옷 챙기기', 1, '바다 위는 육지보다 훨씬 춥고 바람이 세요.'],
    ['선장님 안전 안내 끝까지 듣기', 1, '구명뗏목·소화기 위치와 비상시 행동을 알려 줘요.'],
    ['쓴 바늘은 바늘 통에 넣기', 1, '바닥에 굴러다니는 바늘은 다른 사람을 다치게 해요.'],
    ['휴대폰은 방수팩에, 끈으로 묶기', 1, '비상 연락 수단을 지켜요.'],
    ['금지체장보다 작은 고기는 바로 방생', 1, '어린 물고기를 살려 보내야 내년에도 잡을 수 있어요.'],
    ['캐스팅 전에 뒤에 사람이 없는지 보기', 1, '바늘이 뒤 사람에게 걸리는 사고가 잦아요.'],
    ['술 마시고 배 타기', 0, '음주 후 승선은 넘어짐·바다 빠짐 사고 위험이 매우 커요.'],
    ['구명조끼 벗고 뱃전에 걸터앉기', 0, '파도 한 번에 바다로 빠질 수 있어요.'],
    ['배가 달릴 때 일어나서 돌아다니기', 0, '배가 달릴 땐 자리에 앉아 손잡이를 잡아요.'],
    ['다 쓴 채비·봉지를 바다에 버리기', 0, '버려진 줄과 봉지가 바다 생물을 해쳐요. 되가져와요.'],
    ['특보가 있어도 몰래 출항하기', 0, '특보 중 출항은 법으로 금지되고 매우 위험해요.'],
    ['쓴 바늘을 갑판 바닥에 두기', 0, '밟거나 걸려서 다칠 수 있어요. 바늘 통에!'],
    ['작은 물고기도 전부 가져가기', 0, '금지체장보다 작은 고기는 방생해야 해요(법으로 정해져 있어요).'],
    ['슬리퍼 신고 배 타기', 0, '젖은 갑판에서 미끄러지기 쉬워요.'],
    ['선장님 말 없이 마음대로 자리 바꾸기', 0, '자리는 배의 균형과 안전 때문에 정해져 있어요.'],
    ['밤에 혼자 뱃머리 끝에 가기', 0, '어두운 밤 뱃머리는 미끄럽고 흔들림이 가장 커요.'],
    ['구명조끼 끈을 풀어 두기', 0, '물에 빠지면 조끼가 벗겨져요. 끈과 버클을 꼭 채워요.'],
  ];
  function safeGame(container, onReward) {
    const sh = shell(container);
    let deck = [], cur = null, score = 0, combo = 0, hearts = 3, left = 40, tick = null, lock = false, miss = [], keyH = null;
    function stop() { if (tick) clearInterval(tick); tick = null; if (keyH) document.removeEventListener('keydown', keyH); keyH = null; }
    function intro() {
      stop(); sh.res.style.display = 'none';
      const best = LS.get('game.safe', 0);
      sh.body.innerHTML = `<div style="${CARD}"><b style="font-size:16px">⚓ 출항 전 안전 점검</b>${best ? ` · 최고 <b>${best}점</b>` : ''}
        <ul style="margin:6px 0 0;padding-left:20px;font-size:13.5px"><li>나오는 행동이 <b>✅ 해야 할 일</b>인지 <b>⛔ 하면 안 되는 일</b>인지 골라요.</li>
        <li>연속으로 맞히면 점수가 더 커져요. 40초 · 하트 3개</li><li>PC는 ←(해야 할 일) →(안 되는 일) 키도 돼요.</li></ul></div>
        <button type="button" data-go style="${PRIMARY};width:100%;margin-top:8px">⚓ 점검 시작</button>`;
      sh.body.querySelector('[data-go]').onclick = start;
    }
    function start() {
      deck = shuffle(SAFE); score = 0; combo = 0; hearts = 3; left = 40; miss = []; lock = false;
      sh.body.innerHTML = `<div style="${CARD};display:flex;justify-content:space-between;font-size:13.5px"><span data-hud></span><span data-t></span></div>
        <div data-card style="${CARD};min-height:96px;display:grid;place-items:center;text-align:center;font:700 18px inherit;transition:background .2s"></div>
        <div data-why style="min-height:40px;font-size:13px;text-align:center"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button type="button" data-a="1" style="${OK}">✅ 해야 할 일</button><button type="button" data-a="0" style="${BAD}">⛔ 하면 안 돼요</button></div>`;
      sh.body.onclick = e => { const b = e.target.closest('[data-a]'); if (b) answer(+b.dataset.a); };
      keyH = e => { if (e.key === 'ArrowLeft' || e.key === 'a') answer(1); else if (e.key === 'ArrowRight' || e.key === 'd') answer(0); };
      document.addEventListener('keydown', keyH);
      tick = setInterval(() => { left--; hud(); if (left <= 0) finish(); }, 1000);
      draw();
    }
    function hud() { const h = sh.body.querySelector('[data-hud]'), t = sh.body.querySelector('[data-t]'); if (h) h.textContent = `점수 ${score} · 연속 ${combo} · ${'❤'.repeat(hearts)}${'🤍'.repeat(3 - hearts)}`; if (t) t.textContent = `⏱ ${left}초`; }
    function draw() {
      if (!deck.length) deck = shuffle(SAFE);
      cur = deck.pop(); lock = false;
      const c = sh.body.querySelector('[data-card]'); if (!c) return;
      c.style.background = 'var(--sea-soft,#1F3A50)'; c.textContent = cur[0]; hud();
    }
    function answer(a) {
      if (lock || !cur) return; lock = true;
      const c = sh.body.querySelector('[data-card]'), w = sh.body.querySelector('[data-why]');
      if (a === cur[1]) { combo++; score += 10 + Math.min(combo, 10) * 2; c.style.background = '#2E7D5B'; w.textContent = '✔ ' + cur[2]; sfx('ok'); setTimeout(draw, 650); }
      else { combo = 0; hearts--; c.style.background = '#A33A3A'; w.textContent = '✖ ' + cur[2]; miss.push(cur); sfx('lose'); buzz('bad'); if (hearts <= 0) return setTimeout(finish, 900); setTimeout(draw, 1500); }
      hud();
    }
    function finish() {
      if (!tick && !keyH) return; stop(); sh.body.onclick = null;
      const best = LS.get('game.safe', 0); if (score > best) LS.set('game.safe', score);
      const coins = Math.round(score / 25);
      sh.body.innerHTML = '';
      endBox(sh, `<b style="font-size:16px">⚓ 안전 점검 ${score}점</b>${score > best ? ' · 🏆 새 최고!' : ''} · 🪙 +${coins}
        ${miss.length ? `<div style="font-size:13px;margin-top:6px">다시 볼 것</div><ul style="font-size:13px;margin:4px 0;padding-left:20px">${miss.map(m => `<li><b>${esc(m[0])}</b> → ${m[1] ? '해야 할 일' : '하면 안 돼요'} · ${esc(m[2])}</li>`).join('')}</ul>` : '<br><span style="font-size:13px">👍 하나도 안 틀렸어요! 안전한 출조 되세요.</span>'}`,
        intro, onReward, { game: 'safecheck', score, coins });
    }
    intro();
    return { destroy: stop };
  }

  const LIST = [
    { id: 'tripplan', ic: '🗺', name: '출조+나들이 하루 계획', desc: '오늘 실제 출조 지수·지역 행사로 바다 → 출항 시간 → 행사 코스 짜기', goal: 200, mount: planGame },
    { id: 'safecheck', ic: '⚓', name: '출항 전 안전 점검', desc: '해야 할 일 / 하면 안 되는 일 빠르게 고르기 · 틀리면 이유 설명', goal: 250, mount: safeGame },
  ];
  if (window.GameHub) LIST.forEach(x => { if (GameHub.GNAME) GameHub.GNAME[x.id] = x.name; if (GameHub.GOAL) GameHub.GOAL[x.id] = x.goal; });
  window.TripGames = { LIST, SAFE, extra: onReward => LIST.map(x => ({ id: x.id, ic: x.ic, name: x.name, desc: x.desc, isNew: true, mount: el => x.mount(el, onReward) })) };
})();
