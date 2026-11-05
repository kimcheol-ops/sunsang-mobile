/* 선상낚시 미니게임 7종 + 10종 게임 메뉴 — SunsangHelper PC 앱과 휴대폰 '바다 조황 수첩' 공용
 *
 * GameHub.mount(container, { entries, onReward }) : 게임 카드 메뉴 → 고른 게임을 아래에 띄움
 * GameHub.extra(onReward)                           : 이 파일의 게임 7종 목록(entries에 이어 붙임)
 * 각 게임은 끝나면 onReward({ game, score, coins }) 를 부릅니다(코인 저장은 호스트가 함).
 * 3D 탐험은 three.js(r128)가 먼저 로드돼 있어야 합니다(없으면 안내만 표시).
 */
(function () {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const SP = {   // 이름 → 색·이모지·점수·금어기(월일)
    '쭈꾸미': ['#E3A21A', '🐙', 10, [511, 831]], '갑오징어': ['#B05CC4', '🦑', 25, null], '우럭': ['#3C7FC0', '🐟', 30, null],
    '광어': ['#1D8A5B', '🐠', 45, null], '참돔': ['#E2572B', '🐡', 55, null], '갈치': ['#AEB9BF', '🗡️', 35, null],
    '문어': ['#C97A2F', '🐙', 60, [516, 630]], '무늬오징어': ['#6C5FD0', '🦑', 40, null], '한치': ['#1AA3A8', '🦑', 20, null],
  };
  const closedNow = (n, d = new Date()) => { const c = SP[n][3]; if (!c) return false; const x = (d.getMonth() + 1) * 100 + d.getDate(); return x >= c[0] && x <= c[1]; };
  const BTN = 'min-height:46px;border:0;border-radius:12px;font:700 15px inherit;cursor:pointer;touch-action:manipulation';
  const PRIMARY = BTN + ';background:#E2572B;color:#fff';
  const SOFT = BTN + ';background:#2A4650;color:#E3EEF0';
  function shell(container, title) {
    container.innerHTML = `<div style="display:grid;gap:10px"><div data-body></div><div data-res style="display:none;padding:10px 12px;border-radius:10px;background:var(--sea-soft,#1F3A50);font-size:14.5px;line-height:1.6"></div></div>`;
    return { body: container.querySelector('[data-body]'), res: container.querySelector('[data-res]') };
  }
  function finish(sh, onReward, game, score, extra, data) {
    const coins = Math.max(0, Math.floor(score / 10));
    sh.res.style.display = 'block';
    sh.res.innerHTML = `<b style="font-size:18px">${score}점</b> · 🪙 +${coins}${extra ? '<br>' + extra : ''}`;
    sfx(score > 0 ? 'win' : 'miss');
    if (onReward) try { onReward(Object.assign({ game, score, coins }, data || {})); } catch (e) {}
  }

  // ═════════ 효과음(WebAudio, 끄기 가능 — 처음 소리는 버튼을 누른 뒤에만 남) ═════════
  let actx = null, muted = false;
  try { muted = localStorage.getItem('sfx.muted') === '1'; } catch (e) {}
  function sfx(kind) {
    if (muted) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const notes = { hit: [660, 880], catch: [523, 659, 784], win: [523, 659, 784, 1047], miss: [220, 165], bite: [990], level: [523, 784, 1047, 1319] }[kind] || [440];
      notes.forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * .09;
        o.type = kind === 'miss' ? 'sawtooth' : 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.12, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .16);
        o.connect(g).connect(actx.destination); o.start(t); o.stop(t + .18);
      });
    } catch (e) {}
  }

  // ═════════ 성장: 레벨·칭호 · 오늘의 도전 · 어종 도감 · 게임별 최고/주간 기록 ═════════
  const LEVELS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000, 5000, 6200, 7600, 9200, 11000, 13000, 15500, 18500, 22000];
  const TITLES = ['갯바위 초보', '선상 입문', '채비 견습', '물때 읽는 꾼', '쿨러 채우는 꾼', '손맛 장인', '어탐 고수', '베테랑 꾼', '명품 꾼', '바다 사냥꾼',
                  '물길 박사', '어군 추적자', '대물 헌터', '항해 달인', '바다 선장', '명예 선장', '전설의 꾼', '바다의 전설', '해신', '용왕'];
  const GOAL = { fish: 150, dress: 80, rig: 80, sea3d: 200, cast: 200, memory: 120, reaction: 250, dodge: 350, order: 120, sonar: 120 };
  const GNAME = { fish: '한 수 더!', dress: '낚시꾼 코디', rig: '채비 맞추기', sea3d: '바다 3D 탐험', cast: '캐스팅 과녁', memory: '어종 짝맞추기', reaction: '입질 반응속도', dodge: '항해 피하기', order: '낚시 순서 맞추기', sonar: '어탐 찾기' };
  const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  function isoWeek(d = new Date()) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return `${t.getUTCFullYear()}-W${String(Math.ceil(((t - y0) / 86400000 + 1) / 7)).padStart(2, '0')}`;
  }
  function levelOf(xp) {
    let i = 0; while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1]) i++;
    const next = LEVELS[i + 1];
    return { lv: i + 1, title: TITLES[i], xp, cur: LEVELS[i], next: next ?? null, pct: next ? Math.round((xp - LEVELS[i]) / (next - LEVELS[i]) * 100) : 100 };
  }
  // 날짜로 정해지는 오늘의 도전 3개(모든 사람이 같음)
  function challenges(d = new Date()) {
    const ids = Object.keys(GOAL), seed = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate(), out = [];
    for (let k = 0; out.length < 3; k++) { const id = ids[(seed * 7 + k * 3) % ids.length]; if (!out.includes(id)) out.push(id); }
    return out.map(id => ({ id, name: GNAME[id], goal: GOAL[id] }));
  }
  /** 게임 결과 한 건을 기록에 반영 → { st, events[], bonus } (순수 함수: 저장은 호스트) */
  function apply(st, r, now = new Date()) {
    st = JSON.parse(JSON.stringify(st || {}));
    st.xp = st.xp || 0; st.bests = st.bests || {}; st.dex = st.dex || {}; st.plays = st.plays || {};
    const events = [], before = levelOf(st.xp).lv, today = ymd(now), wk = isoWeek(now);
    st.xp += Math.max(5, Math.round(r.score || 0));
    st.plays[r.game] = (st.plays[r.game] || 0) + 1;
    if ((r.score || 0) > (st.bests[r.game] || 0)) { if (st.bests[r.game]) events.push(`🏅 ${GNAME[r.game] || r.game} 최고 기록 경신! ${r.score}점`); st.bests[r.game] = r.score; }
    if (st.week !== wk) { st.week = wk; st.weekBests = {}; }
    st.weekBests = st.weekBests || {};
    st.weekBests[r.game] = Math.max(st.weekBests[r.game] || 0, r.score || 0);
    (r.catches || []).forEach(c => {
      if (!SP[c.sp]) return;
      const e = st.dex[c.sp] || { n: 0, max: 0 }, first = !e.n;
      e.n += c.n || 1; if (c.len && c.len > e.max) e.max = c.len; st.dex[c.sp] = e;
      if (first) events.push(`📖 도감 등록: ${SP[c.sp][1]} ${c.sp}`);
    });
    // 스토리 '바다 마을 연대기' 자원: 식(잡은 고기)·의(채비·코디·순서 게임)·주(나머지 게임) · 방생 · 월별 어종
    const sto = st.story = st.story || {};
    sto.res = sto.res || { food: 0, cloth: 0, mat: 0 };
    const caught = (r.catches || []).reduce((a, c) => a + (c.n || 1), 0);
    sto.res.food += caught * 3;
    if (['rig', 'dress', 'order'].includes(r.game)) sto.res.cloth += Math.round((r.score || 0) / 10);
    else if (r.game !== 'fish' && r.game !== 'sea3d') sto.res.mat += Math.round((r.score || 0) / 10);
    sto.released = (sto.released || 0) + (r.released || 0);
    const mk = today.slice(0, 7);
    sto.month = sto.month || {}; sto.month[mk] = sto.month[mk] || {};
    (r.catches || []).forEach(c => { if (SP[c.sp]) sto.month[mk][c.sp] = (sto.month[mk][c.sp] || 0) + (c.n || 1); });
    sto.month[mk]['@' + r.game] = Math.max(sto.month[mk]['@' + r.game] || 0, r.score || 0);
    let bonus = 0;
    if (st.chDay !== today) { st.chDay = today; st.chDone = []; }
    const ch = challenges(now), hit = ch.find(c => c.id === r.game && (r.score || 0) >= c.goal && !st.chDone.includes(c.id));
    if (hit) {
      st.chDone.push(hit.id); bonus += 10; events.push(`🎯 오늘의 도전 달성: ${hit.name} (${st.chDone.length}/3) 🪙+10`);
      if (st.chDone.length === 3) {
        const y = new Date(now); y.setDate(y.getDate() - 1);
        st.chStreak = st.chLast === ymd(y) ? (st.chStreak || 0) + 1 : 1; st.chLast = today;
        bonus += 40 + Math.min(6, st.chStreak - 1) * 10;
        events.push(`🔥 오늘의 도전 모두 완료! 연속 ${st.chStreak}일 · 🪙+${40 + Math.min(6, st.chStreak - 1) * 10}`);
      }
    }
    // 계절 이벤트 점수(이번 이벤트 대상 어종·게임이면 추가)
    const ev = seasonEvent(now);
    if (st.event?.id !== ev.id) st.event = { id: ev.id, pts: 0, claimed: [] };
    const evPts = (r.catches || []).reduce((a, c) => a + (ev.species.includes(c.sp) ? (c.n || 1) * 10 : 0), 0) + (ev.games.includes(r.game) ? Math.round((r.score || 0) / 5) : 0);
    if (evPts) { st.event.pts += evPts; events.push(`${ev.ic} ${ev.name} +${evPts}점 (누적 ${st.event.pts})`); }
    const after = levelOf(st.xp);
    if (after.lv > before) { bonus += after.lv * 5; events.push(`⬆ 레벨 ${after.lv} 「${after.title}」 달성! 🪙+${after.lv * 5}`); }
    // 업적
    st.ach = st.ach || [];
    ACH.forEach(a => { if (!st.ach.includes(a.id) && a.ok(st)) { st.ach.push(a.id); bonus += a.coins; events.push(`🏆 업적 달성: ${a.name} 🪙+${a.coins}`); } });
    return { st, events, bonus, levelUp: after.lv > before };
  }

  // ═════════ 계절 이벤트(실제 달력에 맞춰 바뀜) ═════════
  const EVENTS = [
    { id: 'autumn', months: [9, 10, 11], ic: '🍂', name: '가을 쭈꾸미·갑오징어 축제', species: ['쭈꾸미', '갑오징어'], games: ['rig'], desc: '쭈꾸미·갑오징어를 잡거나 채비 맞추기로 축제 점수' },
    { id: 'winter', months: [12, 1, 2], ic: '❄️', name: '겨울 채비 정비 주간', species: ['우럭'], games: ['rig', 'order', 'dress'], desc: '채비·순서·코디 게임과 겨울 우럭으로 점수' },
    { id: 'spring', months: [3, 4, 5], ic: '🌸', name: '봄 바다 대청소', species: ['갑오징어', '참돔'], games: ['sonar', 'dodge'], desc: '어탐·항해로 바다를 살피고 봄 어종으로 점수' },
    { id: 'summer', months: [6, 7, 8], ic: '🌙', name: '여름밤 갈치·한치 축제', species: ['갈치', '한치'], games: ['sea3d', 'reaction'], desc: '야간 어종과 3D 탐험·반응속도로 점수' },
  ];
  const EV_TIERS = [{ pts: 100, coins: 30 }, { pts: 300, coins: 60 }, { pts: 600, coins: 100, item: 'hat:crown' }];
  function seasonEvent(d = new Date()) { const m = d.getMonth() + 1, e = EVENTS.find(x => x.months.includes(m)); return Object.assign({}, e, { id: `${e.id}-${m >= 12 ? d.getFullYear() + 1 : d.getFullYear()}` }); }

  // ═════════ 업적 30종 ═════════
  const B = (st, k) => (st.bests || {})[k] || 0, P = (st, k) => (st.plays || {})[k] || 0;
  const totalPlays = st => Object.values(st.plays || {}).reduce((a, b) => a + b, 0);
  const caughtAll = st => Object.values(st.dex || {}).reduce((a, e) => a + e.n, 0);
  const ACH = [
    { id: 'first-play', ic: '🎮', name: '첫 출항', desc: '아무 게임이나 한 판', coins: 10, ok: st => totalPlays(st) >= 1 },
    { id: 'plays-50', ic: '⛵', name: '단골 선객', desc: '게임 50판', coins: 50, ok: st => totalPlays(st) >= 50 },
    { id: 'plays-200', ic: '🚢', name: '바다 사나이', desc: '게임 200판', coins: 150, ok: st => totalPlays(st) >= 200 },
    { id: 'all-games', ic: '🧭', name: '만능 꾼', desc: '모든 게임을 한 번씩(신작 포함)', coins: 80, ok: st => Object.keys(GOAL).every(k => P(st, k) > 0) },
    { id: 'fish-200', ic: '🎣', name: '한 수의 달인', desc: '한 수 더! 200점', coins: 30, ok: st => B(st, 'fish') >= 200 },
    { id: 'fish-400', ic: '🐟', name: '쿨러 가득', desc: '한 수 더! 400점', coins: 80, ok: st => B(st, 'fish') >= 400 },
    { id: 'sea3d-300', ic: '🌊', name: '3D 선장', desc: '바다 3D 탐험 300점', coins: 50, ok: st => B(st, 'sea3d') >= 300 },
    { id: 'sea3d-600', ic: '✨', name: '대물 사냥꾼', desc: '바다 3D 탐험 600점', coins: 120, ok: st => B(st, 'sea3d') >= 600 },
    { id: 'dress-100', ic: '👕', name: '완벽한 출조 복장', desc: '코디 미션 100점', coins: 40, ok: st => B(st, 'dress') >= 100 },
    { id: 'rig-150', ic: '🧩', name: '채비 박사', desc: '채비 맞추기 150점', coins: 40, ok: st => B(st, 'rig') >= 150 },
    { id: 'cast-300', ic: '🎯', name: '명사수', desc: '캐스팅 과녁 300점', coins: 40, ok: st => B(st, 'cast') >= 300 },
    { id: 'memory-170', ic: '🃏', name: '기억력 왕', desc: '짝맞추기 170점', coins: 40, ok: st => B(st, 'memory') >= 170 },
    { id: 'reaction-400', ic: '⚡', name: '번개 챔질', desc: '입질 반응속도 400점', coins: 40, ok: st => B(st, 'reaction') >= 400 },
    { id: 'dodge-600', ic: '⛵', name: '노련한 항해사', desc: '항해 피하기 600점', coins: 40, ok: st => B(st, 'dodge') >= 600 },
    { id: 'order-150', ic: '📋', name: '정석대로', desc: '낚시 순서 150점', coins: 40, ok: st => B(st, 'order') >= 150 },
    { id: 'sonar-170', ic: '📡', name: '어탐의 신', desc: '어탐 찾기 170점', coins: 40, ok: st => B(st, 'sonar') >= 170 },
    { id: 'dex-5', ic: '📖', name: '도감 수집가', desc: '도감 5종', coins: 40, ok: st => Object.keys(st.dex || {}).length >= 5 },
    { id: 'dex-9', ic: '📚', name: '바다 백과사전', desc: '도감 9종 완성', coins: 150, ok: st => Object.keys(st.dex || {}).length >= 9 },
    { id: 'catch-100', ic: '🧊', name: '백 마리', desc: '모든 게임에서 100마리', coins: 60, ok: st => caughtAll(st) >= 100 },
    { id: 'big-octo', ic: '🐙', name: '왕문어', desc: '도감 문어 2kg 이상', coins: 50, ok: st => ((st.dex || {})['문어'] || {}).max >= 2000 },
    { id: 'big-bream', ic: '🐡', name: '70 참돔', desc: '도감 참돔 70cm 이상', coins: 50, ok: st => ((st.dex || {})['참돔'] || {}).max >= 70 },
    { id: 'release-10', ic: '🤲', name: '바다 지킴이', desc: '금어기·금지체장 10마리 방생', coins: 60, ok: st => ((st.story || {}).released || 0) >= 10 },
    { id: 'level-5', ic: '⬆', name: '손맛 장인', desc: '레벨 6', coins: 50, ok: st => levelOf(st.xp || 0).lv >= 6 },
    { id: 'level-10', ic: '🏅', name: '바다 사냥꾼', desc: '레벨 10', coins: 120, ok: st => levelOf(st.xp || 0).lv >= 10 },
    { id: 'challenge-3', ic: '🎯', name: '도전자', desc: '오늘의 도전 3개를 하루에', coins: 30, ok: st => (st.chStreak || 0) >= 1 },
    { id: 'challenge-7', ic: '🔥', name: '불꽃 연속', desc: '오늘의 도전 7일 연속', coins: 150, ok: st => (st.chStreak || 0) >= 7 },
    { id: 'attend-7', ic: '📅', name: '개근상', desc: '출석 7일 연속', coins: 70, ok: st => ((st.att || {}).streak || 0) >= 7 },
    { id: 'story-3', ic: '🏝', name: '마을의 희망', desc: '스토리 3장 완료', coins: 60, ok: st => ((st.story || {}).chapter || 0) >= 3 || ((st.story || {}).year || 2045) > 2045 },
    { id: 'story-end', ic: '🌅', name: '새벽항의 전설', desc: '스토리 엔딩', coins: 200, ok: st => ((st.story || {}).chapter || 0) >= 6 || ((st.story || {}).year || 2045) > 2045 },
    { id: 'event-600', ic: '👑', name: '축제왕', desc: '계절 이벤트 600점', coins: 100, ok: st => ((st.event || {}).pts || 0) >= 600 },
  ];

  // ═════════ 출석 보상(7일 주기, 하루 빠지면 처음부터) ═════════
  const ATT = [10, 15, 20, 25, 30, 40, 80];
  function attendance(st, now = new Date()) {
    const a = st.att || {}, today = ymd(now), y = new Date(now); y.setDate(y.getDate() - 1);
    if (a.last === today) return { claimed: true, day: ((a.streak - 1) % 7) + 1, streak: a.streak };
    const streak = a.last === ymd(y) ? (a.streak || 0) + 1 : 1;
    return { claimed: false, day: ((streak - 1) % 7) + 1, streak, coins: ATT[(streak - 1) % 7] };
  }

  // ═════════ 기기 간 이어하기: 진행 코드(기록 + 코인·옷장) ═════════
  function exportCode(progress, wallet) {
    const json = JSON.stringify({ v: 1, at: new Date().toISOString(), p: progress || {}, w: wallet || {} });
    return 'SSH1-' + btoa(unescape(encodeURIComponent(json)));
  }
  function importCode(code) {
    const s = String(code || '').trim();
    if (!s.startsWith('SSH1-')) throw new Error('출조관제 진행 코드가 아닙니다 (SSH1-로 시작해야 합니다)');
    const o = JSON.parse(decodeURIComponent(escape(atob(s.slice(5)))));
    if (!o || o.v !== 1 || typeof o.p !== 'object') throw new Error('코드가 손상되었습니다');
    return o;
  }

  // ═════════ 1. 캐스팅 과녁: 방향 → 힘 두 번 눌러 채비를 표적 원에 ═════════
  function castTarget(container, onReward) {
    const sh = shell(container);
    sh.body.innerHTML = `<canvas style="width:100%;aspect-ratio:1/1;border-radius:12px;display:block;background:#0E3B47;touch-action:none"></canvas>
      <button type="button" style="${PRIMARY};width:100%;margin-top:8px">▶ 시작 (8번 던지기)</button>`;
    const cv = sh.body.querySelector('canvas'), b = sh.body.querySelector('button'), ctx = cv.getContext('2d');
    let W = 0, phase = 'ready', ang = 0, pow = 0, t = 0, n = 0, score = 0, target = null, wind = 0, shot = null, raf = 0, alive = true;
    const size = () => { const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); W = r.width; cv.width = W * d; cv.height = W * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    function newTarget() { target = { x: rnd(.2, .8) * W, y: rnd(.12, .5) * W, r: W * .09 }; wind = rnd(-1, 1); shot = null; phase = 'aim'; b.textContent = '방향 정하기'; }
    function frame(ts) {
      if (!alive) return; t = ts / 1000;
      if (phase === 'aim') ang = Math.sin(t * 2.2) * .9;
      if (phase === 'power') pow = (Math.sin(t * 3.1) + 1) / 2;
      ctx.fillStyle = '#0E3B47'; ctx.fillRect(0, 0, W, W);
      for (let i = 0; i < 12; i++) { ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.beginPath(); ctx.arc(W / 2, W * 1.1, W * (.2 + i * .1) + Math.sin(t + i) * 3, Math.PI, 2 * Math.PI); ctx.stroke(); }
      if (target) [[1, '#FFFFFF33'], [.66, '#F5C46B66'], [.33, '#E2572BAA']].forEach(([k, c]) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(target.x, target.y, target.r * k, 0, 7); ctx.fill(); });
      ctx.fillStyle = '#F4F1E8'; ctx.beginPath(); ctx.ellipse(W / 2, W * .93, W * .09, W * .05, 0, 0, 7); ctx.fill();
      if (phase === 'aim' || phase === 'power') { ctx.strokeStyle = '#FFCF3A'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(W / 2, W * .9); ctx.lineTo(W / 2 + Math.sin(ang) * W * .35, W * .9 - Math.cos(ang) * W * .35); ctx.stroke(); }
      if (phase === 'power') { ctx.fillStyle = '#0008'; ctx.fillRect(W * .9, W * .2, 14, W * .6); ctx.fillStyle = pow > .85 ? '#FF5A4A' : '#4BD08A'; ctx.fillRect(W * .9, W * .8 - W * .6 * pow, 14, W * .6 * pow); }
      if (shot) { ctx.fillStyle = '#FFCF3A'; ctx.beginPath(); ctx.arc(shot.x, shot.y, 6, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`던지기 ${Math.min(n + 1, 8)}/8 · 점수 ${score}`, 10, 22);
      if (target) ctx.fillText(`바람 ${wind > 0 ? '→' : '←'} ${Math.abs(wind * 5).toFixed(1)}m/s`, W - 130, 22);
      raf = requestAnimationFrame(frame);
    }
    b.onclick = () => {
      if (phase === 'ready' || phase === 'over') { n = 0; score = 0; sh.res.style.display = 'none'; newTarget(); return; }
      if (phase === 'aim') { phase = 'power'; b.textContent = '힘 정하기'; return; }
      if (phase === 'power') {
        const dist = W * (.15 + pow * .8) * (pow > .85 ? 1.15 : 1);
        shot = { x: W / 2 + Math.sin(ang) * dist + wind * W * .08, y: W * .9 - Math.cos(ang) * dist };
        const d = Math.hypot(shot.x - target.x, shot.y - target.y) / target.r;
        const p = d <= .33 ? 50 : d <= .66 ? 30 : d <= 1 ? 10 : 0;
        score += p; n++; phase = 'shot'; b.textContent = p ? `+${p}!` : '빗나감'; sfx(p ? 'hit' : 'miss');
        setTimeout(() => { if (n >= 8) { phase = 'over'; b.textContent = '↻ 다시 하기'; finish(sh, onReward, 'cast', score, '바람을 읽고 과녁 중심을 노리세요. 힘 막대가 빨간색이면 너무 멀리 날아갑니다.'); } else newTarget(); }, 900);
      }
    };
    const ro = new ResizeObserver(size); ro.observe(cv); size(); raf = requestAnimationFrame(frame);
    return { destroy() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); } };
  }

  // ═════════ 2. 어종 카드 짝맞추기 ═════════
  function memory(container, onReward) {
    const sh = shell(container);
    const names = Object.keys(SP).slice(0, 8);
    let cards, open = [], done = 0, moves = 0, t0 = 0, lock = false;
    function start() {
      cards = names.concat(names).map(n => [Math.random(), n]).sort((a, b) => a[0] - b[0]).map(x => ({ n: x[1], up: false, ok: false }));
      open = []; done = 0; moves = 0; t0 = Date.now(); lock = false; sh.res.style.display = 'none'; draw();
    }
    function draw() {
      sh.body.innerHTML = `<div style="display:flex;justify-content:space-between;font-weight:700;margin-bottom:6px"><span>뒤집기 ${moves}</span><span>${done}/8 쌍</span></div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">${cards.map((c, i) => `<button type="button" data-i="${i}" style="aspect-ratio:3/4;border-radius:10px;border:0;cursor:pointer;font:600 12px inherit;color:#fff;background:${c.up || c.ok ? SP[c.n][0] : '#2A4650'};opacity:${c.ok ? .55 : 1}">${c.up || c.ok ? `<span style="font-size:26px;display:block">${SP[c.n][1]}</span>${esc(c.n)}` : '🌊'}</button>`).join('')}</div>`;
      sh.body.querySelectorAll('[data-i]').forEach(b => b.onclick = () => flip(+b.dataset.i));
    }
    function flip(i) {
      const c = cards[i]; if (lock || c.up || c.ok) return;
      c.up = true; open.push(i); draw();
      if (open.length < 2) return;
      moves++; lock = true;
      const [a, b] = open.map(k => cards[k]);
      setTimeout(() => {
        if (a.n === b.n) { a.ok = b.ok = true; done++; } a.up = b.up = false; open = []; lock = false; draw();
        if (done === 8) { const sec = Math.round((Date.now() - t0) / 1000); finish(sh, onReward, 'memory', Math.max(10, 200 - moves * 5 - sec), `${moves}번 뒤집기 · ${sec}초`); }
      }, a.n === b.n ? 250 : 750);
    }
    sh.body.innerHTML = `<button type="button" style="${PRIMARY};width:100%">▶ 시작 (어종 8쌍)</button>`;
    sh.body.querySelector('button').onclick = start;
    return { destroy() {} };
  }

  // ═════════ 3. 입질 반응속도: 진짜 입질에만 빠르게 ═════════
  function reaction(container, onReward) {
    const sh = shell(container);
    sh.body.innerHTML = `<div data-stage style="position:relative;height:240px;border-radius:12px;background:linear-gradient(#BFE3EA 0 30%,#2D8FA3 30%,#0B3540);overflow:hidden;cursor:pointer;touch-action:manipulation">
        <div data-rod style="position:absolute;left:20%;top:10%;width:60%;height:4px;background:#5A3A1A;transform-origin:0 50%;transform:rotate(8deg);border-radius:2px"></div>
        <div data-tip style="position:absolute;right:18%;top:0;width:2px;height:60%;background:#eee;transform-origin:50% 0"></div>
        <div data-msg style="position:absolute;inset:auto 0 12px 0;text-align:center;color:#fff;font:700 18px inherit;text-shadow:0 1px 3px #000">시작을 누르세요</div></div>
      <button type="button" data-go style="${PRIMARY};width:100%;margin-top:8px">▶ 시작 (10번)</button>`;
    const stage = sh.body.querySelector('[data-stage]'), rod = sh.body.querySelector('[data-rod]'), msg = sh.body.querySelector('[data-msg]'), go = sh.body.querySelector('[data-go]');
    let round = 0, state = 'idle', tBite = 0, timers = [], score = 0, times = [], falses = 0;
    const later = (f, ms) => timers.push(setTimeout(f, ms));
    const twitch = (deg, ms) => { rod.style.transition = `transform ${ms}ms`; rod.style.transform = `rotate(${deg}deg)`; later(() => rod.style.transform = 'rotate(8deg)', ms); };
    function next() {
      if (round >= 10) { state = 'over'; go.style.display = ''; go.textContent = '↻ 다시 하기'; const avg = times.length ? Math.round(times.reduce((a, b) => a + b) / times.length) : 0;
        finish(sh, onReward, 'reaction', score, `평균 반응 ${avg}ms · 헛챔질 ${falses}번`); return; }
      state = 'wait'; msg.textContent = `${round + 1}/10 · 초릿대를 보세요`;
      const fakes = Math.floor(rnd(0, 3));
      for (let k = 0; k < fakes; k++) later(() => { if (state === 'wait') twitch(10.5, 180); }, rnd(400, 2200));   // 파도에 살짝 흔들림(가짜)
      later(() => { if (state !== 'wait') return; state = 'bite'; tBite = performance.now(); twitch(22, 120); later(() => twitch(20, 120), 160); msg.textContent = '❗';
        later(() => { if (state === 'bite') { state = 'gap'; msg.textContent = '놓쳤습니다'; round++; later(next, 800); } }, 650); }, rnd(1500, 3800));
    }
    stage.onpointerdown = () => {
      if (state === 'bite') { const ms = Math.round(performance.now() - tBite); times.push(ms); sfx('catch'); score += Math.max(0, Math.round((650 - ms) / 6)); state = 'gap'; msg.textContent = `챔질! ${ms}ms`; round++; later(next, 800); }
      else if (state === 'wait') { falses++; score = Math.max(0, score - 10); msg.textContent = '헛챔질 −10 (파도였어요)'; sfx('miss'); }
    };
    go.onclick = () => { timers.forEach(clearTimeout); timers = []; round = 0; score = 0; times = []; falses = 0; sh.res.style.display = 'none'; go.style.display = 'none'; next(); };
    return { destroy() { timers.forEach(clearTimeout); } };
  }

  // ═════════ 4. 항해 피하기: 부표·암초·그물을 피해 어군으로 ═════════
  function dodge(container, onReward) {
    const sh = shell(container);
    sh.body.innerHTML = `<canvas style="width:100%;aspect-ratio:3/4;border-radius:12px;display:block;background:#145E6E;touch-action:none"></canvas>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:8px"><button type="button" data-l style="${SOFT}">◀ 왼쪽</button><button type="button" data-s style="${PRIMARY}">▶ 출항</button><button type="button" data-r style="${SOFT}">오른쪽 ▶</button></div>`;
    const cv = sh.body.querySelector('canvas'), ctx = cv.getContext('2d');
    let W = 0, H = 0, lane = 1, obs = [], speed = 0, dist = 0, schools = 0, lives = 3, run = false, last = 0, spawnT = 0, raf = 0, alive = true, hitT = 0;
    const size = () => { const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); W = r.width; H = W * 4 / 3; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    const lx = l => W * (l + .5) / 3;
    const KINDS = [['부표', '#F5C46B', -1], ['암초', '#6B5B4B', -1], ['그물', '#C9D1D9', -1], ['어군', '#4BD08A', 1]];
    function frame(ts) {
      if (!alive) return;
      const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts;
      if (run) {
        speed = Math.min(2.4, speed + dt * .04); dist += dt * speed * 10; spawnT -= dt; hitT -= dt;
        if (spawnT <= 0) { spawnT = rnd(.45, .9) / speed; const k = Math.random() < .25 ? KINDS[3] : pick(KINDS.slice(0, 3)); obs.push({ lane: Math.floor(rnd(0, 3)), y: -30, k }); }
        obs.forEach(o => o.y += dt * H * .45 * speed);
        obs = obs.filter(o => {
          if (o.y > H * .78 && o.y < H * .9 && o.lane === lane) {
            if (o.k[2] > 0) { schools++; return false; }
            if (hitT <= 0) { lives--; hitT = 1; if (lives <= 0) { run = false; const sc = Math.round(dist) + schools * 15; finish(sh, onReward, 'dodge', sc, `항해 ${Math.round(dist)}m · 어군 ${schools}곳 발견`); sh.body.querySelector('[data-s]').textContent = '↻ 다시'; } }
            return false;
          }
          return o.y < H + 40;
        });
      }
      ctx.fillStyle = '#145E6E'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 14; i++) { const y = ((dist * 8 + i * 60) % (H + 60)) - 30; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y + 8); ctx.stroke(); }
      obs.forEach(o => { ctx.fillStyle = o.k[1]; const x = lx(o.lane);
        if (o.k[0] === '어군') { for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(x + Math.cos(i * 1.3) * 14, o.y + Math.sin(i * 1.7) * 8, 7, 3, 0, 0, 7); ctx.fill(); } }
        else if (o.k[0] === '그물') { ctx.strokeStyle = o.k[1]; ctx.lineWidth = 1; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x - 26, o.y + i * 6); ctx.lineTo(x + 26, o.y + i * 6); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + i * 10, o.y - 12); ctx.lineTo(x + i * 10, o.y + 12); ctx.stroke(); } }
        else { ctx.beginPath(); ctx.arc(x, o.y, o.k[0] === '암초' ? 20 : 12, 0, 7); ctx.fill(); }
        ctx.fillStyle = '#fff'; ctx.font = '11px sans-serif'; ctx.fillText(o.k[0], x - 12, o.y - 18); });
      const bx = lx(lane), by = H * .84;
      ctx.globalAlpha = hitT > 0 && Math.floor(hitT * 10) % 2 ? .4 : 1;
      ctx.fillStyle = '#F4F1E8'; ctx.beginPath(); ctx.moveTo(bx, by - 26); ctx.lineTo(bx + 16, by + 18); ctx.lineTo(bx - 16, by + 18); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#E2572B'; ctx.fillRect(bx - 7, by - 2, 14, 10); ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.fillText(`${'❤'.repeat(Math.max(0, lives))}  ${Math.round(dist)}m  어군 ${schools}`, 10, 22);
      raf = requestAnimationFrame(frame);
    }
    const move = d => { if (run) lane = Math.max(0, Math.min(2, lane + d)); };
    sh.body.querySelector('[data-l]').onclick = () => move(-1);
    sh.body.querySelector('[data-r]').onclick = () => move(1);
    sh.body.querySelector('[data-s]').onclick = e => { lane = 1; obs = []; speed = 1; dist = 0; schools = 0; lives = 3; run = true; e.target.textContent = '항해 중'; sh.res.style.display = 'none'; };
    cv.onpointerdown = e => { const r = cv.getBoundingClientRect(); move(e.clientX - r.left < r.width / 2 ? -1 : 1); };
    const kd = e => { if (e.key === 'ArrowLeft') { move(-1); e.preventDefault(); } if (e.key === 'ArrowRight') { move(1); e.preventDefault(); } };
    document.addEventListener('keydown', kd);
    const ro = new ResizeObserver(size); ro.observe(cv); size(); raf = requestAnimationFrame(frame);
    return { destroy() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); document.removeEventListener('keydown', kd); } };
  }

  // ═════════ 5. 낚시 순서 맞추기 (어종별 방법 단계) ═════════
  const STEPS = {
    '쭈꾸미': ['에기를 바닥까지 내린다', '줄을 감아 팽팽하게 한다', '20~30cm 들었다 내리고 3~5초 기다린다', '묵직하면 가볍게 챔질', '일정한 속도로 감아 올린다'],
    '참돔(타이라바)': ['타이라바를 바닥까지 내린다', '닿는 즉시 감기 시작', '초당 1~2바퀴 일정하게 감는다', "'톡톡' 입질에도 멈추지 않는다", '무게가 실리면 챔질'],
    '광어(다운샷)': ['봉돌과 바늘 사이를 30~50cm로 묶는다', '바닥을 찍고 웜을 흔든다', '입질 후 1~2초 기다린다', '무게가 실리면 챔질', '뜰채로 떠 올린다'],
    '우럭': ['신호에 맞춰 채비를 내린다', '바닥에 닿으면 1~2바퀴 감는다', '주기적으로 바닥을 다시 찍는다', '무게가 실리면 들며 감는다', "'올리세요' 신호에 걷는다"],
    '문어': ['봉돌로 바닥을 찍는다', '바닥에서 떨어지지 않게 끈다', '무거워지면 세게 들어 바닥에서 뗀다', '쉬지 않고 빠르게 감는다', '올리자마자 망에 넣는다'],
  };
  function order(container, onReward) {
    const sh = shell(container);
    let keys, r = 0, score = 0, cur, picked, t0 = 0;
    function start() { keys = Object.keys(STEPS).sort(() => Math.random() - .5).slice(0, 3); r = 0; score = 0; sh.res.style.display = 'none'; round(); }
    function round() {
      cur = keys[r]; picked = []; t0 = Date.now();
      const shuffled = STEPS[cur].map((s, i) => [Math.random(), s, i]).sort((a, b) => a[0] - b[0]);
      sh.body.innerHTML = `<div style="font-weight:700;margin-bottom:6px">${r + 1}/3 · <span style="font-size:17px">${esc(cur)}</span> — 순서대로 누르세요</div>
        <div data-list style="display:grid;gap:6px">${shuffled.map(([, s, i]) => `<button type="button" data-i="${i}" style="text-align:left;min-height:46px;border:1px solid var(--line,#3E4852);border-radius:10px;background:var(--chart,#2A3139);color:inherit;font:15px inherit;padding:8px 12px;cursor:pointer">${esc(s)}</button>`).join('')}</div>`;
      sh.body.querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
        const i = +b.dataset.i;
        if (i === picked.length) { picked.push(i); b.disabled = true; b.style.borderColor = '#4BD08A'; b.innerHTML = `<b>${picked.length}.</b> ` + b.innerHTML;
          if (picked.length === 5) { score += Math.max(20, 60 - Math.round((Date.now() - t0) / 1000)); r++; setTimeout(() => r < 3 ? round() : end(), 700); } }
        else { score = Math.max(0, score - 5); b.style.borderColor = '#FF5A4A'; setTimeout(() => b.style.borderColor = '', 400); }
      });
    }
    function end() { sh.body.innerHTML = `<button type="button" style="${PRIMARY};width:100%">↻ 다시 하기</button>`; sh.body.querySelector('button').onclick = start; finish(sh, onReward, 'order', score, '빠르고 정확할수록 높은 점수 · 틀리면 −5'); }
    sh.body.innerHTML = `<button type="button" style="${PRIMARY};width:100%">▶ 시작 (3어종)</button>`;
    sh.body.querySelector('button').onclick = start;
    return { destroy() {} };
  }

  // ═════════ 6. 어탐 찾기: 핑을 쏘아 숫자(주변 어군 수)로 어군 위치 추리 ═════════
  function sonar(container, onReward) {
    const sh = shell(container);
    const N = 8, FISH = 10;
    let grid, pings, found;
    function start() {
      grid = Array.from({ length: N * N }, () => ({ fish: false, open: false, mark: false }));
      let k = 0; while (k < FISH) { const c = grid[Math.floor(Math.random() * N * N)]; if (!c.fish) { c.fish = true; k++; } }
      pings = 24; found = 0; sh.res.style.display = 'none'; draw();
    }
    const near = i => { const x = i % N, y = Math.floor(i / N); let c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if ((dx || dy) && X >= 0 && Y >= 0 && X < N && Y < N && grid[Y * N + X].fish) c++; } return c; };
    function draw() {
      sh.body.innerHTML = `<div style="display:flex;justify-content:space-between;font-weight:700;margin-bottom:6px"><span>📡 남은 핑 ${pings}</span><span>🐟 어군 ${found}/${FISH}</span></div>
        <div style="display:grid;grid-template-columns:repeat(${N},1fr);gap:3px;background:#06222A;padding:6px;border-radius:12px">${grid.map((c, i) => {
          const bg = c.open ? (c.fish ? '#4BD08A' : '#0E4452') : '#13343D';
          const txt = c.open ? (c.fish ? '🐟' : (near(i) || '')) : '';
          const col = ['#fff', '#8CC8F2', '#6FD3A4', '#F5C46B', '#FF8A8D'][Math.min(4, near(i))];
          return `<button type="button" data-i="${i}" style="aspect-ratio:1;border:0;border-radius:4px;background:${bg};color:${col};font:700 15px monospace;cursor:pointer">${txt}</button>`; }).join('')}</div>
        <div style="font-size:12.5px;opacity:.8;margin-top:6px">칸을 누르면 핑 1개를 써서 그 자리를 탐지합니다. 숫자는 둘레 8칸에 있는 어군 수입니다.</div>`;
      sh.body.querySelectorAll('[data-i]').forEach(b => b.onclick = () => ping(+b.dataset.i));
    }
    function ping(i) {
      const c = grid[i]; if (c.open || pings <= 0) return;
      c.open = true; pings--; if (c.fish) found++;
      draw();
      if (found === FISH || pings === 0) { grid.forEach(g => { if (g.fish) g.open = true; }); draw(); finish(sh, onReward, 'sonar', found * 15 + pings * 5, `어군 ${found}곳 발견 · 남은 핑 ${pings}`);
        const b = document.createElement('button'); b.type = 'button'; b.style.cssText = PRIMARY + ';width:100%;margin-top:8px'; b.textContent = '↻ 다시 하기'; b.onclick = start; sh.body.append(b); }
    }
    sh.body.innerHTML = `<button type="button" style="${PRIMARY};width:100%">▶ 시작 (핑 24개로 어군 10곳 찾기)</button>`;
    sh.body.querySelector('button').onclick = start;
    return { destroy() {} };
  }

  // ═════════ 7. 바다 3D 탐험(실험): 실제 바다 위치에서 내 캐릭터가 배를 몰며 어종별 마릿수 세기 ═════════
  const PLACES = [
    { name: '보령 앞바다', lat: 36.40, lon: 126.40, sea: '서해', land: 'east' },
    { name: '군산 고군산군도', lat: 35.82, lon: 126.40, sea: '서해', land: 'east' },
    { name: '목포·신안', lat: 34.78, lon: 126.20, sea: '서해', land: 'east' },
    { name: '여수 앞바다', lat: 34.62, lon: 127.75, sea: '남해', land: 'north' },
    { name: '통영·거제', lat: 34.78, lon: 128.50, sea: '남해', land: 'north' },
    { name: '포항 구룡포', lat: 35.99, lon: 129.60, sea: '동해', land: 'west' },
    { name: '강릉·주문진', lat: 37.90, lon: 128.90, sea: '동해', land: 'west' },
    { name: '제주 도두', lat: 33.55, lon: 126.45, sea: '제주', land: 'island' },
  ];
  const SEA_SP = { '서해': ['쭈꾸미', '갑오징어', '우럭', '광어'], '남해': ['참돔', '갈치', '문어', '무늬오징어'], '동해': ['문어', '한치', '우럭'], '제주': ['무늬오징어', '한치', '참돔', '갈치'] };
  function sea3d(container, onReward, opts) {
    const sh = shell(container);
    if (!window.THREE) { sh.body.innerHTML = '<div style="padding:12px">3D 엔진(three.js)을 불러오지 못했습니다. 인터넷 연결을 확인하세요.</div>'; return { destroy() {} }; }
    sh.body.innerHTML = `<div style="font-weight:700;margin-bottom:6px">바다 위치를 고르세요 <span style="font-weight:400;opacity:.75;font-size:12.5px">— 해역마다 나오는 어종이 다릅니다</span></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px">${PLACES.map((p, i) => `<button type="button" data-p="${i}" style="${SOFT};text-align:left;padding:8px 10px;min-height:56px">${esc(p.name)}<br><span style="font-weight:400;font-size:11.5px;opacity:.8">${p.sea} · ${p.lat.toFixed(2)}N ${p.lon.toFixed(2)}E</span></button>`).join('')}</div>`;
    let game = null;
    sh.body.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { game = run(PLACES[+b.dataset.p]); });
    function run(place) {
      const THREE = window.THREE;
      sh.res.style.display = 'none';
      sh.body.innerHTML = `<div data-wrap style="position:relative;border-radius:12px;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none">
          <div data-gl style="width:100%;aspect-ratio:4/5"></div>
          <div data-hud style="position:absolute;left:8px;top:8px;right:118px;color:#fff;font:700 13px sans-serif;text-shadow:0 1px 3px #000;display:grid;gap:4px"></div>
          <canvas data-mini width="200" height="200" style="position:absolute;right:8px;top:8px;width:100px;height:100px;border-radius:8px;background:#0B3540cc;border:1px solid #fff4"></canvas>
          <div data-msg style="position:absolute;left:0;right:0;top:42%;text-align:center;color:#fff;font:800 20px sans-serif;text-shadow:0 2px 6px #000;pointer-events:none"></div>
          <div data-bar style="position:absolute;left:10%;right:10%;bottom:14px;height:18px;border-radius:9px;background:#0009;display:none;overflow:hidden">
            <div data-zone style="position:absolute;top:0;bottom:0;background:#4BD08A99"></div><div data-mark style="position:absolute;top:0;bottom:0;width:4px;background:#fff"></div></div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px">
          <button type="button" data-k="left" style="${SOFT}">⟲ 왼쪽</button><button type="button" data-k="up" style="${SOFT}">▲ 전진</button>
          <button type="button" data-k="right" style="${SOFT}">⟳ 오른쪽</button><button type="button" data-cast style="${PRIMARY}">🎣 던지기</button></div>
        <div style="font-size:12px;opacity:.75;margin-top:4px">PC: 방향키/WASD로 배 몰기 · Space 던지기·챔질. 물보라가 이는 곳이 어군입니다. 120초 동안 어종별로 최대한 많이!</div>`;
      const q = s => sh.body.querySelector(s);
      const holder = q('[data-gl]'), hud = q('[data-hud]'), msgEl = q('[data-msg]'), bar = q('[data-bar]'), zone = q('[data-zone]'), mark = q('[data-mark]'), mini = q('[data-mini]').getContext('2d');
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
      holder.appendChild(renderer.domElement); renderer.domElement.style.display = 'block'; renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
      const scene = new THREE.Scene();
      // 날씨: 낚시꾼 코디의 '오늘의 출조 조건'과 같은 날씨(맑음·흐림·비·바람 강함)
      const weather = window.AnglerDress ? AnglerDress.mission(new Date()).weather : '맑음';
      const sky = { '맑음': '#9FD3E0', '흐림': '#A9B4BA', '비': '#7F8C93', '바람 강함': '#B8CCD3' }[weather] || '#9FD3E0';
      const waveAmp = weather === '바람 강함' ? 1.7 : weather === '비' ? 1.2 : 1;
      scene.background = new THREE.Color(sky); scene.fog = new THREE.Fog(sky, weather === '비' ? 60 : weather === '흐림' ? 90 : 120, weather === '비' ? 220 : 330);
      const camera = new THREE.PerspectiveCamera(55, 4 / 5, .5, 600);
      scene.add(new THREE.HemisphereLight('#ffffff', '#224455', .65));
      const sun = new THREE.DirectionalLight('#fff4dd', .8); sun.position.set(60, 100, 40); scene.add(sun);
      // 바다(정점 파도)
      const seaGeo = new THREE.PlaneGeometry(600, 600, 60, 60); seaGeo.rotateX(-Math.PI / 2);
      const seaMesh = new THREE.Mesh(seaGeo, new THREE.MeshLambertMaterial({ color: '#17667A', flatShading: true }));
      scene.add(seaMesh);
      const basePos = seaGeo.attributes.position.array.slice();
      // 육지·섬: 해역 방향(서해=동쪽 육지, 동해=서쪽, 남해=북쪽, 제주=가운데 섬 둘레 바다)
      const landMat = new THREE.MeshLambertMaterial({ color: '#5E8C4A', flatShading: true }), rockMat = new THREE.MeshLambertMaterial({ color: '#8A8170', flatShading: true });
      const addHill = (x, z, r, h, mat) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), mat || landMat); m.position.set(x, h / 2 - 1, z); scene.add(m); return m; };
      const side = { east: [1, 0], west: [-1, 0], north: [0, -1] }[place.land];
      if (side) for (let i = -8; i <= 8; i++) { const along = i * 24; addHill(side[0] ? side[0] * rnd(150, 175) : along, side[1] ? side[1] * rnd(150, 175) : along, rnd(18, 30), rnd(14, 34)); }
      else for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; addHill(Math.cos(a) * 60 - 0, Math.sin(a) * 40 - 120, rnd(16, 26), rnd(10, 30)); }
      for (let i = 0; i < 8; i++) addHill(rnd(-120, 120), rnd(-120, 120), rnd(3, 7), rnd(3, 8), rockMat);   // 작은 섬·여
      // 배 + 내 캐릭터(코디 색 반영)
      const o = Object.assign({ top: 'tee', vest: 'auto', hat: 'cap', bottom: 'jeans' }, opts && opts.outfit);
      const col = (slot, id, d) => (window.AnglerDress && AnglerDress.ITEMS[slot].find(x => x.id === id) || {}).color || d;
      const boat = new THREE.Group();
      const hull = new THREE.Mesh(new THREE.BoxGeometry(5, 1.4, 11), new THREE.MeshLambertMaterial({ color: '#F4F1E8' })); hull.position.y = .5; boat.add(hull);
      const bow = new THREE.Mesh(new THREE.ConeGeometry(2.5, 4, 4), new THREE.MeshLambertMaterial({ color: '#F4F1E8' })); bow.rotation.x = -Math.PI / 2; bow.rotation.y = Math.PI / 4; bow.position.set(0, .5, -7.4); bow.scale.set(1, 1, .5); boat.add(bow);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(5.1, .3, 11.1), new THREE.MeshLambertMaterial({ color: '#C8462A' })); stripe.position.y = .2; boat.add(stripe);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.2, 3.2), new THREE.MeshLambertMaterial({ color: '#E8E3D6' })); cabin.position.set(0, 2.2, 1.8); boat.add(cabin);
      const person = new THREE.Group();
      const legs = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, 1.4, 8), new THREE.MeshLambertMaterial({ color: col('bottom', o.bottom, '#3B5B8C') })); legs.position.y = 1.9; person.add(legs);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(.6, .55, 1.4, 8), new THREE.MeshLambertMaterial({ color: col('top', o.top, '#E6EAEE') })); body.position.y = 3.2; person.add(body);
      if (o.vest !== 'none') { const v = new THREE.Mesh(new THREE.CylinderGeometry(.68, .62, 1, 8), new THREE.MeshLambertMaterial({ color: col('vest', o.vest, '#E2572B') })); v.position.y = 3.3; person.add(v); }
      const head = new THREE.Mesh(new THREE.SphereGeometry(.5, 12, 10), new THREE.MeshLambertMaterial({ color: '#F1C8A0' })); head.position.y = 4.35; person.add(head);
      if (o.hat !== 'none') { const h = new THREE.Mesh(new THREE.CylinderGeometry(.42, .55, .4, 10), new THREE.MeshLambertMaterial({ color: col('hat', o.hat, '#2E5F86') })); h.position.y = 4.8; person.add(h); }
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(.04, .07, 6, 5), new THREE.MeshLambertMaterial({ color: '#5A3A1A' })); rod.position.set(.9, 4.6, -1.6); rod.rotation.x = -.9; person.add(rod);
      person.position.set(0, 1, -2.4); boat.add(person); scene.add(boat);
      // 찌·줄
      const bobber = new THREE.Mesh(new THREE.SphereGeometry(.35, 8, 8), new THREE.MeshLambertMaterial({ color: '#FFCF3A' })); bobber.visible = false; scene.add(bobber);
      const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: '#ffffff' })); line.visible = false; scene.add(line);
      // 어군(물보라 고리 + 이름표)
      const sps = SEA_SP[place.sea];
      function label(text, color) {
        const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
        x.fillStyle = '#0B3540cc'; x.fillRect(0, 8, 256, 48); x.fillStyle = color; x.fillRect(0, 8, 10, 48);
        x.fillStyle = '#fff'; x.font = 'bold 30px sans-serif'; x.fillText(text, 22, 44);
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false })); s.scale.set(10, 2.5, 1); return s;
      }
      const shoals = [];
      function spawnShoal(sp, forceBig) {
        let x, z; do { x = rnd(-130, 130); z = rnd(-130, 130); } while (Math.hypot(x - boat.position.x, z - boat.position.z) < 35 || (side && (side[0] * x > 110 || side[1] * z > 110)) || (!side && Math.hypot(x, (z + 120) * 1.4) < 75));
        const big = forceBig || Math.random() < .15;   // 황금 '대물' 어군: 점수 3배, 챔질 구간 좁음, 2마리만
        const g = new THREE.Group(); g.position.set(x, 0, z);
        const ring = new THREE.Mesh(new THREE.RingGeometry(big ? 4 : 3, big ? 5.6 : 4.2, 24), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .6, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = .3; g.add(ring);
        for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(big ? .8 : .5, 6, 5), new THREE.MeshLambertMaterial({ color: big ? '#FFD34D' : SP[sp][0], emissive: big ? '#5A4300' : '#000000' })); f.scale.set(1.6, .6, .7); f.userData.a = i; g.add(f); }
        const tag = label(`${big ? '✨대물 ' : SP[sp][1] + ' '}${sp}`, big ? '#FFD34D' : SP[sp][0]); tag.position.y = 6; g.add(tag);
        scene.add(g); shoals.push({ sp, g, ring, big, left: big ? 2 : Math.floor(rnd(3, 6)) });
      }
      // 비: 떨어지는 빗줄기 입자
      let rain = null;
      if (weather === '비') {
        const n = 900, pos = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { pos[i * 3] = rnd(-60, 60); pos[i * 3 + 1] = rnd(0, 40); pos[i * 3 + 2] = rnd(-60, 60); }
        const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        rain = new THREE.Points(rg, new THREE.PointsMaterial({ color: '#DDE8EE', size: .35, transparent: true, opacity: .7 })); scene.add(rain);
      }
      for (let i = 0; i < 7; i++) spawnShoal(sps[i % sps.length]);
      // 상태
      const keys = {}, count = {}; sps.forEach(s => count[s] = 0);
      let heading = 0, vel = 0, time = 120, state = 'sail', biteT = 0, markX = 0, markV = 1, zoneA = .4, zoneB = .6, target = null, score = 0, released = 0, last = 0, raf = 0, alive = true, msgT = 0, combo = 0, bigs = 0;
      const say = (t, s) => { msgEl.textContent = t; msgT = s || 1.6; };
      function resize() { const w = holder.clientWidth, h = w * 5 / 4; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
      const ro = new ResizeObserver(resize); ro.observe(holder); resize();
      function nearShoal() { let best = null, bd = 1e9; shoals.forEach(s => { const d = Math.hypot(s.g.position.x - boat.position.x, s.g.position.z - boat.position.z); if (d < bd) { bd = d; best = s; } }); return bd < 24 ? best : null; }
      function cast() {
        if (state === 'over') return;
        if (state === 'bite') { // 챔질 타이밍: 표시가 초록 구간 안이면 성공
          bar.style.display = 'none';
          if (markX >= zoneA && markX <= zoneB) land(); else { combo = 0; sfx('miss'); say('놓쳤다! 초록 구간에서 누르세요', 1.4); reel(); }
          return;
        }
        if (state !== 'sail') return;
        if (Math.abs(vel) > 2) { say('배를 멈추고 던지세요', 1.2); return; }
        const s = nearShoal(); if (!s) { say('어군(물보라) 가까이 가세요', 1.2); return; }
        target = s; state = 'wait'; vel = 0;
        bobber.visible = line.visible = true;
        bobber.position.set((s.g.position.x + boat.position.x) / 2 + rnd(-2, 2), .3, (s.g.position.z + boat.position.z) / 2 + rnd(-2, 2));
        say('찌를 보세요…', 1); biteT = rnd(1, 2.6);
      }
      function land() {
        const sp = target.sp;
        sfx('catch');
        if (closedNow(sp)) { released++; score += 15; combo = 0; say(`${SP[sp][1]} ${sp} — 금어기라 방생 +15`, 1.8); }
        else {
          combo++; count[sp]++; if (target.big) bigs++;
          const p = Math.round(SP[sp][2] * (target.big ? 3 : 1) * (1 + Math.min(5, combo - 1) * .1));
          score += p; say(`${target.big ? '✨대물 ' : SP[sp][1] + ' '}${sp}! +${p}${combo > 1 ? ` · 연속 ${combo}` : ''}`, 1.5);
        }
        target.left--;
        if (target.left <= 0) { scene.remove(target.g); shoals.splice(shoals.indexOf(target), 1); spawnShoal(pick(sps)); say('어군이 흩어졌습니다 — 다른 곳으로!', 1.6); }
        reel();
      }
      function reel() { state = 'sail'; bobber.visible = line.visible = false; target = null; }
      const kd = e => {
        const k = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down' }[e.key];
        if (k) { keys[k] = true; e.preventDefault(); } if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) cast(); }
      };
      const ku = e => { const k = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down' }[e.key]; if (k) keys[k] = false; };
      document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
      sh.body.querySelectorAll('[data-k]').forEach(b => {
        const k = b.dataset.k;
        b.addEventListener('pointerdown', e => { e.preventDefault(); keys[k] = true; });
        ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => b.addEventListener(t, () => keys[k] = false));
      });
      q('[data-cast]').onclick = cast;
      function drawHud() {
        hud.innerHTML = `<div>⏱ ${Math.ceil(time)}초 · 점수 ${score}${combo > 1 ? ` · 🔥${combo}연속` : ''} · 📍 ${esc(place.name)} · ${{ '맑음': '☀️', '흐림': '☁️', '비': '🌧️', '바람 강함': '💨' }[weather] || ''}${esc(weather)}</div>` +
          `<div style="display:flex;flex-wrap:wrap;gap:4px">${sps.map(s => `<span style="background:${SP[s][0]}cc;padding:2px 7px;border-radius:10px">${SP[s][1]} ${s} ${count[s]}</span>`).join('')}${released ? `<span style="background:#0008;padding:2px 7px;border-radius:10px">🌊 방생 ${released}</span>` : ''}</div>`;
        mini.clearRect(0, 0, 200, 200); mini.fillStyle = '#0B3540'; mini.fillRect(0, 0, 200, 200);
        const M = v => 100 + v / 150 * 95;
        mini.fillStyle = '#5E8C4A';
        if (side) { if (side[0]) mini.fillRect(side[0] > 0 ? M(140) : 0, 0, side[0] > 0 ? 200 - M(140) : M(-140), 200); else mini.fillRect(0, 0, 200, M(-140)); }
        else { mini.beginPath(); mini.ellipse(M(0), M(-120), 50, 34, 0, 0, 7); mini.fill(); }
        shoals.forEach(s => { mini.fillStyle = SP[s.sp][0]; mini.beginPath(); mini.arc(M(s.g.position.x), M(s.g.position.z), 7, 0, 7); mini.fill(); });
        mini.save(); mini.translate(M(boat.position.x), M(boat.position.z)); mini.rotate(-heading); mini.fillStyle = '#fff';
        mini.beginPath(); mini.moveTo(0, -10); mini.lineTo(6, 8); mini.lineTo(-6, 8); mini.closePath(); mini.fill(); mini.restore();
      }
      function frame(ts) {
        if (!alive) return;
        const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts, tt = ts / 1000;
        // 파도
        const p = seaGeo.attributes.position.array;
        for (let i = 0; i < p.length; i += 3) p[i + 1] = (Math.sin(basePos[i] * .05 + tt * 1.3) * .6 + Math.cos(basePos[i + 2] * .06 + tt) * .5) * waveAmp;
        if (rain) { const rp = rain.geometry.attributes.position.array; for (let i = 1; i < rp.length; i += 3) { rp[i] -= dt * 45; if (rp[i] < 0) rp[i] = 40; } rain.geometry.attributes.position.needsUpdate = true; rain.position.set(boat.position.x, 0, boat.position.z); }
        seaGeo.attributes.position.needsUpdate = true;
        if (state !== 'over') {
          time -= dt;
          if (time <= 0) { time = 0; state = 'over'; bar.style.display = 'none';
            const total = Object.values(count).reduce((a, b) => a + b, 0);
            finish(sh, onReward, 'sea3d', score, `📍 ${esc(place.name)} (${place.lat.toFixed(2)}N ${place.lon.toFixed(2)}E) · ${esc(weather)} · 총 ${total}마리${bigs ? ` (✨대물 ${bigs})` : ''}<br>` + sps.map(s => `${SP[s][1]} ${s} ${count[s]}마리`).join(' · ') + (released ? ` · 방생 ${released}` : ''),
                   { catches: sps.filter(s => count[s] > 0).map(s => ({ sp: s, n: count[s] })), released });
            const again = document.createElement('button'); again.type = 'button'; again.style.cssText = PRIMARY + ';width:100%;margin-top:8px'; again.textContent = '↻ 다른 바다로'; again.onclick = () => { destroy(); sea3dRestart(); }; sh.body.append(again);
          }
        }
        if (state === 'sail') {
          if (keys.left) heading += dt * 1.6; if (keys.right) heading -= dt * 1.6;
          vel += ((keys.up ? 16 : 0) - (keys.down ? 8 : 0)) * dt; vel *= Math.pow(.55, dt); vel = Math.max(-6, Math.min(18, vel));
        } else vel *= Math.pow(.2, dt);
        boat.position.x -= Math.sin(heading) * vel * dt; boat.position.z -= Math.cos(heading) * vel * dt;
        boat.position.x = Math.max(-140, Math.min(140, boat.position.x)); boat.position.z = Math.max(-140, Math.min(140, boat.position.z));
        if (side && side[0] * boat.position.x > 120) boat.position.x = side[0] * 120;
        if (side && side[1] * boat.position.z > 120) boat.position.z = side[1] * 120;
        boat.rotation.y = heading; boat.position.y = Math.sin(tt * 1.6) * .25; boat.rotation.z = Math.sin(tt * 1.2) * .04;
        const inRange = state === 'sail' ? nearShoal() : null;
        if (inRange && Math.abs(vel) <= 2 && msgT <= 0) msgEl.textContent = '🎣 던질 수 있어요';
        else if (msgT <= 0 && msgEl.textContent === '🎣 던질 수 있어요') msgEl.textContent = '';
        shoals.forEach(s => { s.ring.scale.setScalar(1 + (tt * .8 % 1) * .8); s.ring.material.opacity = .6 * (1 - tt * .8 % 1);
          s.ring.material.color.set(s === inRange ? '#4BD08A' : '#ffffff');
          s.g.children.forEach(f => { if (f.userData.a != null) { const a = f.userData.a + tt * .9; f.position.set(Math.cos(a) * 2.2, .2 + Math.sin(a * 2) * .2, Math.sin(a) * 2.2); f.rotation.y = -a; } }); });
        if (state === 'wait') { biteT -= dt; bobber.position.y = .3 + Math.sin(tt * 3) * .1;
          if (biteT <= 0) { state = 'bite'; sfx('bite'); bobber.position.y = -.4; markX = 0; markV = 1; const w = (.26 - Math.min(.12, SP[target.sp][2] / 500)) * (target.big ? .6 : 1); zoneA = rnd(.15, .85 - w); zoneB = zoneA + w; bar.style.display = 'block'; zone.style.left = zoneA * 100 + '%'; zone.style.width = (zoneB - zoneA) * 100 + '%'; say('입질! 초록에서 챔질', 1); } }
        if (state === 'bite') { markX += markV * dt * 1.25; if (markX > 1 || markX < 0) { markV *= -1; markX = Math.max(0, Math.min(1, markX)); } mark.style.left = markX * 100 + '%'; bobber.position.y = -.4 + Math.sin(tt * 18) * .15; }
        if (line.visible) { const tip = new THREE.Vector3(.9, 6.8, -5).applyMatrix4(boat.matrixWorld); line.geometry.setFromPoints([tip, bobber.position]); }
        // 카메라: 배 뒤 위에서 따라감
        const cx = boat.position.x + Math.sin(heading) * 34, cz = boat.position.z + Math.cos(heading) * 34;
        camera.position.lerp(new THREE.Vector3(cx, 20, cz), Math.min(1, dt * 3));
        camera.lookAt(boat.position.x - Math.sin(heading) * 14, 1, boat.position.z - Math.cos(heading) * 14);   // 배 앞쪽 바다가 더 보이게
        if (msgT > 0) { msgT -= dt; if (msgT <= 0) msgEl.textContent = ''; }
        drawHud(); renderer.render(scene, camera);
        raf = requestAnimationFrame(frame);
      }
      var tt = 0; raf = requestAnimationFrame(frame);
      if (window.__SEA3D_TEST__) window.__SEA3D_TEST__ = { boat, shoals, count };   // 자동 시험용(평소에는 꺼져 있음)
      function destroy() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); renderer.dispose(); }
      return { destroy };
    }
    function sea3dRestart() { const g = sea3d(container, onReward, opts); game = g; }
    return { destroy() { if (game && game.destroy) game.destroy(); } };
  }

  // ═════════ 게임 메뉴(10종) ═════════
  function extra(onReward, opts) {
    return [
      { id: 'sea3d', ic: '🌊', name: '바다 3D 탐험', desc: '실제 바다 위치에서 내 캐릭터로 배를 몰며 어종별 마릿수 세기 (실험)', mount: el => sea3d(el, onReward, opts && opts()) },
      { id: 'cast', ic: '🎯', name: '캐스팅 과녁', desc: '바람을 읽고 방향·힘으로 표적 한가운데', mount: el => castTarget(el, onReward) },
      { id: 'memory', ic: '🃏', name: '어종 짝맞추기', desc: '어종 카드 8쌍을 적게 뒤집어 맞추기', mount: el => memory(el, onReward) },
      { id: 'reaction', ic: '⚡', name: '입질 반응속도', desc: '파도 흔들림은 참고, 진짜 입질에만 챔질', mount: el => reaction(el, onReward) },
      { id: 'dodge', ic: '⛵', name: '항해 피하기', desc: '부표·암초·그물을 피해 어군을 찾아 항해', mount: el => dodge(el, onReward) },
      { id: 'order', ic: '📋', name: '낚시 순서 맞추기', desc: '어종별 낚시 방법을 순서대로', mount: el => order(el, onReward) },
      { id: 'sonar', ic: '📡', name: '어탐 찾기', desc: '핑 숫자로 어군 위치를 추리하는 어군탐지기 퍼즐', mount: el => sonar(el, onReward) },
    ];
  }
  /** cfg: { entries, start, store: { get() → 기록, set(기록) → Promise }, onBonus(coins) → Promise } */
  function hub(container, cfg) {
    const entries = cfg.entries.slice(), store = cfg.store || { get: () => ({}), set: () => Promise.resolve() };
    let api = null;
    // 스토리 모드(story.js가 로드돼 있으면 맨 앞에): 퀘스트의 '하러 가기'는 해당 게임을 엶
    if (window.Story) entries.unshift({ id: 'story', ic: '🏝', name: '바다 마을 연대기 2045', desc: '스토리 모드 · 의식주로 항구 마을을 되살리고 바다를 지키기 · 열두 달 낚시 달력',
      mount: el => Story.mount(el, { store, open: id => api && api.open(id), onBonus: n => cfg.onBonus ? cfg.onBonus(n) : Promise.resolve() }) });
    container.innerHTML = `<div style="display:grid;gap:10px">
      <div data-head style="display:grid;gap:8px;padding:12px;border-radius:12px;background:var(--sea-soft,#1F3A50)"></div>
      <div data-toast style="display:none;padding:8px 12px;border-radius:10px;background:#E2572B;color:#fff;font-weight:700;line-height:1.5"></div>
      <div data-dex style="display:none"></div>
      <div data-menu style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px"></div>
      <div data-stage style="display:grid;gap:8px"></div></div>`;
    const q = s => container.querySelector(s);
    const menu = q('[data-menu]'), stage = q('[data-stage]'), head = q('[data-head]'), toast = q('[data-toast]'), dexEl = q('[data-dex]');
    let cur = null, inst = null, toastT = 0, panel = null;   // panel: dex · ach · sync
    const small = `${SOFT};min-height:34px;padding:0 10px;font-size:13px`;
    function drawHead() {
      const st = store.get() || {}, L = levelOf(st.xp || 0), today = ymd(new Date());
      const done = st.chDay === today ? (st.chDone || []) : [], dexN = Object.keys(st.dex || {}).length;
      const att = attendance(st), ev = seasonEvent(), evSt = st.event && st.event.id === ev.id ? st.event : { pts: 0, claimed: [] };
      head.innerHTML = `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <b style="font-size:16px">Lv.${L.lv} ${esc(L.title)}</b>
          <span style="font-size:12.5px;opacity:.8">${L.xp} XP${L.next ? ` / 다음 ${L.next}` : ' · 최고 레벨'}</span>
          <span style="margin-left:auto;display:flex;gap:6px;flex-wrap:wrap">
            <button type="button" data-p="dex" style="${small}">📖 도감 ${dexN}/9</button>
            <button type="button" data-p="ach" style="${small}">🏆 업적 ${(st.ach || []).length}/${ACH.length}</button>
            <button type="button" data-p="sync" style="${small}" aria-label="진행 관리">⚙</button>
            <button type="button" data-mute style="${small}" aria-label="효과음 켜기/끄기">${muted ? '🔇' : '🔊'}</button></span></div>
        <div style="height:8px;border-radius:4px;background:#0003;overflow:hidden"><i style="display:block;height:100%;width:${L.pct}%;background:#E2572B"></i></div>
        ${att.claimed ? `<div style="font-size:12.5px;opacity:.85">📅 출석 ${att.streak}일째 · 오늘 보상 받음 (7일째 🪙80)</div>`
          : `<button type="button" data-att style="border:0;border-radius:12px;padding:10px;font:800 14px inherit;cursor:pointer;background:#FFD34D;color:#3A2A00">📅 출석 체크 — ${att.day}일째 보상 🪙${att.coins} 받기 ${'●'.repeat(att.day)}${'○'.repeat(7 - att.day)}</button>`}
        <div style="display:grid;gap:4px;padding:8px 10px;border-radius:10px;background:#0002">
          <div style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap"><b style="font-size:13.5px">${ev.ic} ${esc(ev.name)}</b><span style="font-size:11.5px;opacity:.8">${esc(ev.desc)}</span><b style="margin-left:auto;font-size:13px">${evSt.pts}점</b></div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">${EV_TIERS.map((t, i) => { const got = (evSt.claimed || []).includes(i), can = !got && evSt.pts >= t.pts;
            return `<button type="button" data-tier="${i}" ${can ? '' : 'disabled'} style="border:0;border-radius:999px;padding:4px 10px;font:600 12px inherit;cursor:${can ? 'pointer' : 'default'};background:${got ? '#4BD08A' : can ? '#E2572B' : '#0003'};color:${got ? '#06222A' : can ? '#fff' : 'inherit'}">${got ? '✓ ' : ''}${t.pts}점 🪙${t.coins}${t.item ? ' + 👑 축제 왕관' : ''}</button>`; }).join('')}</div></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><b style="font-size:13px">🎯 오늘의 도전</b>${st.chStreak && st.chLast ? `<span style="font-size:12px;opacity:.8">🔥 연속 ${st.chStreak}일</span>` : ''}
          ${challenges().map(c => `<button type="button" data-ch="${c.id}" style="border:0;border-radius:999px;padding:5px 10px;cursor:pointer;font:600 12.5px inherit;background:${done.includes(c.id) ? '#4BD08A' : '#0003'};color:${done.includes(c.id) ? '#06222A' : 'inherit'}">${done.includes(c.id) ? '✓ ' : ''}${esc(c.name)} ${c.goal}점</button>`).join('')}
          <span style="font-size:11.5px;opacity:.75">3개 모두 🪙+40 이상</span></div>`;
      q('[data-mute]').onclick = () => { muted = !muted; try { localStorage.setItem('sfx.muted', muted ? '1' : '0'); } catch (e) {} if (!muted) sfx('hit'); drawHead(); };
      head.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { panel = panel === b.dataset.p ? null : b.dataset.p; drawDex(); });
      head.querySelectorAll('[data-ch]').forEach(b => b.onclick = () => open(b.dataset.ch));
      const ab = q('[data-att]');
      if (ab) ab.onclick = async () => {
        const s2 = store.get() || {}, a = attendance(s2); if (a.claimed) return;
        s2.att = { last: today, streak: a.streak }; s2.ach = s2.ach || [];
        const newA = ACH.filter(x => !s2.ach.includes(x.id) && x.ok(s2));   // 출석 업적 등
        newA.forEach(x => s2.ach.push(x.id));
        await store.set(s2);
        if (cfg.onBonus) await cfg.onBonus(a.coins + newA.reduce((t, x) => t + x.coins, 0));
        sfx('win'); showToast([`📅 출석 ${a.streak}일째 — 🪙+${a.coins}`, ...newA.map(x => `🏆 업적 달성: ${x.name} 🪙+${x.coins}`)]); drawHead();
      };
      head.querySelectorAll('[data-tier]').forEach(b => b.onclick = async () => {
        const s2 = store.get() || {}, i = +b.dataset.tier, t = EV_TIERS[i];
        if (!s2.event || s2.event.id !== ev.id || s2.event.pts < t.pts || s2.event.claimed.includes(i)) return;
        s2.event.claimed.push(i); await store.set(s2);
        if (cfg.onBonus) await cfg.onBonus(t.coins);
        if (t.item && cfg.onUnlock) await cfg.onUnlock(t.item);
        sfx('level'); showToast([`${ev.ic} 이벤트 보상 🪙+${t.coins}${t.item ? ' · 👑 축제 왕관 획득! (낚시꾼 코디 → 모자)' : ''}`]); drawHead();
      });
    }
    function drawDex() {
      dexEl.style.display = panel ? 'block' : 'none';
      if (panel === 'ach') return drawAch();
      if (panel === 'sync') return drawSync();
      if (panel !== 'dex') return;
      const dex = (store.get() || {}).dex || {};
      dexEl.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:6px">${Object.keys(SP).map(n => {
        const e = dex[n];
        return `<div style="border-radius:10px;padding:8px;text-align:center;background:${e ? SP[n][0] + '33' : '#0002'};border:1px solid ${e ? SP[n][0] : 'var(--line,#3E4852)'}">
          <div style="font-size:26px;${e ? '' : 'filter:grayscale(1) brightness(.4)'}">${SP[n][1]}</div><b style="font-size:12.5px">${e ? esc(n) : '???'}</b>
          <div style="font-size:11px;opacity:.8">${e ? `${e.n}마리${e.max ? ` · 최대 ${e.max}${n === '문어' ? 'g' : 'cm'}` : ''}` : '「한 수 더!」·3D 탐험에서 잡기'}</div></div>`; }).join('')}</div>`;
    }
    function drawAch() {
      const got = (store.get() || {}).ach || [];
      dexEl.innerHTML = `<div style="font-size:12.5px;opacity:.8;margin-bottom:6px">업적 ${got.length}/${ACH.length} · 달성하면 코인이 바로 들어옵니다</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px">${ACH.map(a => { const ok = got.includes(a.id);
          return `<div style="display:grid;grid-template-columns:34px 1fr;gap:6px;align-items:center;padding:8px;border-radius:10px;background:${ok ? '#FFD34D22' : '#0002'};border:1px solid ${ok ? '#FFD34D' : 'var(--line,#3E4852)'}">
            <span style="font-size:22px;${ok ? '' : 'filter:grayscale(1);opacity:.5'}">${a.ic}</span><span><b style="font-size:12.5px">${esc(a.name)}</b><br><span style="font-size:11px;opacity:.8">${esc(a.desc)} · 🪙${a.coins}</span></span></div>`; }).join('')}</div>`;
    }
    function drawSync() {
      dexEl.innerHTML = `<div style="display:grid;gap:8px;padding:12px;border-radius:12px;background:var(--surface,#1E242B);border:1px solid var(--line,#3E4852)">
        <b>🔄 기기 간 이어하기</b>
        <div style="font-size:12.5px;opacity:.85">PC·휴대폰 앱·바다 조황 수첩 사이에 레벨·도감·업적·스토리·코인·옷장을 옮깁니다. 이 기기에서 「진행 코드 만들기」 → 복사 → 다른 기기에서 붙여넣고 「불러오기」.</div>
        <button type="button" data-exp style="${small}">📤 진행 코드 만들기</button>
        <textarea data-code rows="3" style="width:100%;font:11px monospace;border-radius:8px;padding:6px;background:#0003;color:inherit;border:1px solid var(--line,#3E4852)" placeholder="SSH1-로 시작하는 코드를 붙여넣으세요"></textarea>
        <label style="font-size:12.5px;display:flex;gap:6px;align-items:center"><input type="checkbox" data-agree> 이 기기의 진행을 코드 내용으로 바꿉니다</label>
        <button type="button" data-imp style="${small};background:#E2572B;color:#fff">📥 불러오기</button>
        <div data-msg style="font-size:12.5px"></div></div>`;
      const box = dexEl.querySelector('[data-code]'), msg = dexEl.querySelector('[data-msg]');
      dexEl.querySelector('[data-exp]').onclick = async () => {
        box.value = exportCode(store.get() || {}, cfg.wallet ? cfg.wallet.get() : {}); box.select();
        try { await navigator.clipboard.writeText(box.value); msg.textContent = '복사했습니다. 다른 기기에 붙여넣으세요.'; } catch (e) { msg.textContent = '코드를 길게 눌러 전체 선택 후 복사하세요.'; }
      };
      dexEl.querySelector('[data-imp]').onclick = async () => {
        if (!dexEl.querySelector('[data-agree]').checked) { msg.textContent = '바꾸기에 동의하는 칸을 먼저 체크하세요.'; return; }
        try {
          const o = importCode(box.value);
          await store.set(o.p);
          if (cfg.wallet && o.w) await cfg.wallet.set(o.w);
          msg.textContent = `불러왔습니다 (${(o.at || '').slice(0, 10)} 기록). Lv.${levelOf(o.p.xp || 0).lv}`; sfx('win'); drawHead(); draw();
        } catch (e) { msg.textContent = '불러오지 못했습니다: ' + e.message; }
      };
    }
    function showToast(lines) {
      if (!lines.length) return;
      toast.innerHTML = lines.map(esc).join('<br>'); toast.style.display = 'block';
      clearTimeout(toastT); toastT = setTimeout(() => toast.style.display = 'none', 6000);
    }
    /** 게임 결과 기록: 레벨·최고·주간·도감·도전 반영 → 저장 → 보너스 코인 */
    async function record(r) {
      const res = apply(store.get() || {}, r);
      await store.set(res.st);
      if (res.bonus && cfg.onBonus) await cfg.onBonus(res.bonus);
      if (res.levelUp) sfx('level');
      showToast(res.events); drawHead(); draw(); drawDex();
      return res;
    }
    function open(id) {
      if (inst && inst.destroy) try { inst.destroy(); } catch (e) {}
      const e = entries.find(x => x.id === id); if (!e) return;
      cur = id; draw();
      stage.innerHTML = `<div style="display:flex;align-items:baseline;gap:8px"><b style="font-size:17px">${e.ic} ${esc(e.name)}</b><span style="font-size:12.5px;opacity:.75">${esc(e.desc)}</span></div><div data-g></div>`;
      inst = e.mount(stage.querySelector('[data-g]')) || null;
      if (cfg.onOpen) cfg.onOpen(id);
      stage.scrollIntoView && stage.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    function draw() {
      const st = store.get() || {}, bests = st.bests || {}, chs = challenges().map(c => c.id), off = entries[0] && entries[0].id === 'story' ? 0 : 1;
      const sto = st.story || {};
      menu.innerHTML = entries.map((e, i) => e.id === 'story'
        ? `<button type="button" data-id="story" style="grid-column:1/-1;text-align:left;border:0;border-radius:16px;padding:14px 16px;cursor:pointer;color:#4A2E16;font:13px inherit;background:linear-gradient(120deg,#FFD7A8,#FFF1DC 55%,#BFE3EA);box-shadow:0 4px 0 #E2572B55;${cur === 'story' ? 'outline:3px solid #E2572B;' : ''}">
            <span style="font-size:30px;float:right">🏝🌅</span><b style="font-size:17px">📖 스토리 모드 · 바다 마을 연대기 ${sto.year || 2045}</b><br>
            <span style="font-size:12.5px">${esc(e.desc)}</span><br><b style="font-size:12.5px">${(() => { const n = window.Story ? Story.chaptersFor(sto.year).length : 6, part = ((sto.year || 2045) - 2045) % 2 ? '2부' : '1부';
              return (sto.chapter || 0) >= n ? '🎉 엔딩 달성 — 다음 해로' : `${part} · ${(sto.chapter || 0) + 1}장 / ${n}장`; })()} · 건물 ${(sto.built || []).length}/${window.Story ? Object.keys(Story.BUILD).length : 7}</b></button>`
        : `<button type="button" data-id="${e.id}" style="text-align:left;border:2px solid ${e.id === cur ? '#E2572B' : 'var(--line,#3E4852)'};border-radius:12px;padding:10px;background:var(--surface,#1E242B);color:inherit;font:13px inherit;cursor:pointer;min-height:76px">
        <span style="font-size:22px">${e.ic}</span> <b>${i + off}. ${esc(e.name)}</b>${e.id === 'sea3d' || e.is3d ? ' <span style="font-size:10.5px;background:#E2572B;color:#fff;border-radius:6px;padding:1px 5px">3D</span>' : ''}${e.isNew ? ' <span style="font-size:10.5px;background:#6C5FD0;color:#fff;border-radius:6px;padding:1px 5px">NEW</span>' : ''}${chs.includes(e.id) ? ' <span style="font-size:10.5px;background:#4BD08A;color:#06222A;border-radius:6px;padding:1px 5px">도전</span>' : ''}<br><span style="font-size:11.5px;opacity:.75">${esc(e.desc)}</span>
        ${bests[e.id] ? `<br><span style="font-size:11.5px;font-weight:700">🏅 최고 ${bests[e.id]}점</span>` : ''}</button>`).join('');
      menu.querySelectorAll('[data-id]').forEach(b => b.onclick = () => open(b.dataset.id));
    }
    drawHead(); draw();
    api = { open, record, refresh() { drawHead(); draw(); drawDex(); } };
    if (cfg.start) open(cfg.start);
    return api;
  }

  window.GameHub = { mount: hub, extra, PLACES, levelOf, challenges, apply, isoWeek, GNAME, GOAL, sfx, ACH, seasonEvent, attendance, exportCode, importCode };
})();
