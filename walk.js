/* WalkApp — 🚶 섬길·우주 원정 (걷기 운동 게임)
 *  WalkApp.view(el, ctx)  ctx = { trails: SEA_TRAILS.islands, data: SEA_DATA, setStop(fn), rank?: { submit({nick,week,km}), list(week) }, inPC }
 *  · 어디서 걷든 걸은 거리만큼 실제 섬길(OpenStreetMap)이나 상상의 행성 둘레길을 나아감
 *  · 거리 세기: 직접 입력 · GPS(앱을 켜 둔 동안) · 흔들림 센서 만보기(앱을 켜 둔 동안)
 *  · 현장 걷기: 실제 섬에서 GPS로 길 위 내 위치와 현장 도장
 *  · 모든 기록은 이 기기 localStorage 'walk.v1'에만 저장. 위치·경로는 어디에도 올리지 않음
 *  · 주간 순위는 바다 조황 수첩에서만(별명·이번 주 거리만)
 */
(function () {
  'use strict';
  const CSS = `
  .walk { display: grid; gap: 10px; min-width: 0; }
  .walk > *, .walk .box, .walk .grid2 > * { min-width: 0; }
  .walk select { max-width: 100%; width: 100%; text-overflow: ellipsis; }
  .walk .prog { height: 10px; border-radius: 99px; background: var(--s-well); overflow: hidden; border: 1px solid var(--s-line); }
  .walk .prog > i { display: block; height: 100%; background: linear-gradient(90deg, #4FB3C8, #6FD3A4); }
  .walk .prog.gold > i { background: linear-gradient(90deg, #F5C46B, #FF9F5A); }
  .walk .week { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; align-items: end; height: 74px; }
  .walk .week div { display: grid; align-content: end; justify-items: center; gap: 2px; font-size: 11px; color: var(--s-muted); height: 100%; }
  .walk .week i { width: 70%; min-height: 2px; border-radius: 4px 4px 0 0; background: #2F7F93; display: block; }
  .walk .week .today i { background: #6FD3A4; }
  .walk .ach { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 6px; }
  .walk .ach div { border: 1px solid var(--s-line); border-radius: 8px; padding: 5px 8px; font-size: 12px; background: var(--s-well); color: var(--s-dim); }
  .walk .ach div.on { color: var(--s-fg); border-color: #6FD3A4; background: #17302A; }
  .walk .live { font-size: 22px; font-weight: 800; letter-spacing: .5px; }
  .walk .ev { background: linear-gradient(90deg, #2A1F4A, #1C2B4A); border: 1px solid #5B4BA0; }
  .walk .fishbox { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: grid; place-items: center; z-index: 50; padding: 16px; }
  .walk .fishbox > div { width: min(420px, 100%); background: #141A2A; border: 1px solid #4B5B8A; border-radius: 14px; padding: 14px; display: grid; gap: 10px; }
  .walk .meter { position: relative; height: 34px; border-radius: 8px; background: #0B1020; border: 1px solid #34406A; overflow: hidden; }
  .walk .meter .zone { position: absolute; top: 0; bottom: 0; background: rgba(111,211,164,.45); border-left: 2px solid #6FD3A4; border-right: 2px solid #6FD3A4; }
  .walk .meter .cur { position: absolute; top: -2px; bottom: -2px; width: 4px; background: #FFE27A; box-shadow: 0 0 8px #FFE27A; }
  .walk .rank td.me { color: #6FD3A4; font-weight: 700; }
  .walk textarea { width: 100%; min-height: 54px; background: var(--s-well); color: var(--s-fg); border: 1px solid var(--s-line); border-radius: 6px; font: 12px/1.4 monospace; padding: 6px; }`;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  function hav(a, b) { const R = 6371000, p = Math.PI / 180, dl = (b[0] - a[0]) * p, dn = (b[1] - a[1]) * p;
    const h = Math.sin(dl / 2) ** 2 + Math.cos(a[0] * p) * Math.cos(b[0] * p) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }
  function rng(seed) { let a = 0; for (const c of String(seed)) a = (a * 31 + c.charCodeAt(0)) | 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const pad2 = n => String(n).padStart(2, '0');
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  function weekInfo(d = new Date()) { // ISO 주(월요일 시작)
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), wd = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - wd);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)), n = Math.ceil(((t - y0) / 864e5 + 1) / 7);
    const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
    return { key: `${t.getUTCFullYear()}-W${pad2(n)}`, n, days: Array.from({ length: 7 }, (_, i) => dayKey(new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i))) };
  }
  const DAY_CAP = 80000; // 하루 80km 넘게는 세지 않음(잘못 누른 값 막기)
  const km = m => (m / 1000).toFixed(m < 10000 ? 2 : 1);

  /* ── 상상의 우주 둘레길 — 이름·이야기는 모두 지어낸 것(행성의 실제 특징을 조금 빌림) ── */
  const SPACE = [
    { id: 'moon', ic: '🌙', name: '달 「고요의 바다」 둘레길', km: 3, deco: 'crater', sky: ['#04050C', '#141726'], ground: ['#9A9CA6', '#55575F'], path: '#F4EFD8',
      tip: '달 중력은 지구의 1/6 — 상상 속에선 한 걸음에 깡충!',
      marks: [[0, '🚀', '착륙선 광장', '출발! 까만 하늘에 지구가 파랗게 떠 있어요.'], [0.6, '🌍', '지구돋이 언덕', '지평선 위로 지구가 떠오르는 언덕(상상).'], [1.3, '🎣', '크레이터 연못', '상상의 낚시터 — 달빛 은빛고기가 산대요.', 1], [2.1, '👣', '발자국 길', '바람이 없어 발자국이 오래 남는 길.'], [3, '🏁', '고요의 정거장', '완주! 달 도장을 찍었어요.']],
      fish: [['🐟', '달빛 은빛고기', 1], ['🌕', '보름달 복어', 2], ['🦐', '크레이터 새우', 1]] },
    { id: 'mars', ic: '🔴', name: '화성 「붉은 협곡」 둘레길', km: 8, deco: 'dune', sky: ['#2A0E08', '#5A2614'], ground: ['#C8643A', '#7A321C'], path: '#FFD9B8',
      tip: '화성의 하루는 지구보다 약 40분 길어요.',
      marks: [[0, '🛰', '붉은 기지', '산소 헬멧 점검 끝, 출발!'], [1.5, '🌪', '먼지 회오리 쉼터', '먼지 회오리를 피해 잠깐 쉬어 가요.'], [3.2, '🧊', '얼음 동굴 낚시터', '땅속 얼음 호수에서 낚시(상상).', 1], [5, '🏜', '협곡 전망대', '끝이 안 보이는 거대한 협곡.'], [6.5, '⛰', '큰 화산 그림자', '태양계에서 가장 큰 화산이 멀리 보여요.'], [8, '🏁', '노을 정거장', '화성의 노을은 파랗대요. 완주!']],
      fish: [['🐟', '화성 얼음송어', 1], ['🪼', '붉은 먼지 해파리', 2], ['🐡', '협곡 돌복어', 2]] },
    { id: 'europa', ic: '🧊', name: '유로파 「얼음 바다」 낚시길', km: 5, deco: 'crack', sky: ['#020814', '#0F2238'], ground: ['#CFE6F2', '#7FA7C2'], path: '#FFFFFF',
      tip: '목성의 달 유로파는 두꺼운 얼음 아래에 바다가 있을지도 몰라요.',
      marks: [[0, '🛸', '얼음 착륙장', '발밑이 미끌미끌 — 천천히!'], [1.2, '⛲', '얼음 분수', '얼음 틈에서 물기둥이 솟는 곳(상상).'], [2.5, '🎣', '얼음 구멍 낚시터', '얼음 아래 바다에서 빛나는 물고기가!', 1], [3.8, '🪐', '목성 전망대', '하늘을 가득 채운 줄무늬 목성.'], [5, '🏁', '얼음 바다 정거장', '완주! 얼음 도장을 찍었어요.']],
      fish: [['🐠', '빛 비늘고기', 1], ['🦀', '수정 얼음게', 2], ['🦑', '심해 등불오징어', 2]] },
    { id: 'titan', ic: '🪐', name: '토성 고리·타이탄 둘레길', km: 12, deco: 'lake', sky: ['#1A1206', '#4A3416'], ground: ['#C89A52', '#7A5A2A'], path: '#FFF2C8',
      tip: '토성의 달 타이탄에는 물 대신 메탄으로 된 호수가 있어요.',
      marks: [[0, '🚀', '고리 정거장', '머리 위로 토성 고리가 활처럼!'], [2.5, '💫', '고리 얼음 징검다리', '얼음 조각을 밟고 건너요(상상).'], [5, '🎣', '메탄 호수 낚시터', '주황 안개 속 호수 낚시.', 1], [7.5, '🌫', '주황 안개 숲', '안개가 짙어 천천히 걸어요.'], [10, '🎣', '고리 그림자 부두', '고리 그림자 아래 두 번째 낚시터.', 1], [12, '🏁', '타이탄 정거장', '완주! 고리 도장을 찍었어요.']],
      fish: [['🐍', '메탄 호수 장어', 2], ['🐟', '고리 얼음멸치', 1], ['🐋', '안개 고래', 3]] },
    { id: 'neptune', ic: '💎', name: '해왕성 「다이아몬드 비」 둘레길', km: 21.1, deco: 'band', sky: ['#020422', '#0B1E5A'], ground: ['#3A64C8', '#1A2E7A'], path: '#BFE8FF',
      tip: '해왕성 깊은 곳에서는 다이아몬드 비가 내릴 수도 있대요. 하프 마라톤 거리!',
      marks: [[0, '🛰', '파란 정거장', '하프 마라톤 거리, 천천히 꾸준히!'], [4, '💨', '초강풍 언덕', '태양계에서 가장 센 바람(상상 속 산책로).'], [8, '🎣', '구름 바다 낚시터', '푸른 구름 사이로 낚싯줄을!', 1], [12, '💎', '다이아몬드 비 광장', '반짝이는 비가 내리는 광장(상상).'], [16, '🎣', '어둔 소용돌이 부두', '거대한 소용돌이 옆 낚시터.', 1], [21.1, '🏁', '하프 완주 정거장', '21.1km 완주! 대단해요.']],
      fish: [['💎', '다이아 비늘돔', 3], ['🦈', '바람 상어', 3], ['🐟', '푸른 구름고기', 1]] },
    { id: 'galaxy', ic: '🌌', name: '은하수 「별빛 마라톤」 둘레길', km: 42.195, deco: 'nebula', sky: ['#05020F', '#1A0A33'], ground: ['#2A1650', '#0C0820'], path: '#FFE9FF',
      tip: '마라톤 거리 42.195km — 몇 주에 걸쳐 나눠 걸어도 돼요.',
      marks: [[0, '🚀', '은하 출발선', '별빛 마라톤 출발!'], [7, '⭐', '북극성 쉼터', '길 잃으면 북극성을 찾아요.'], [14, '🎣', '성운 연못', '분홍 성운 속 연못 낚시.', 1], [21, '🪐', '반환점 행성', '절반 왔어요!'], [28, '☄', '혜성 꼬리길', '얼음 먼지 꼬리를 따라 걸어요.'], [35, '🎣', '별똥 부두', '떨어지는 별똥 사이로 낚시.', 1], [42.195, '🏁', '은하 결승선', '마라톤 거리 완주! 전설의 원정대!']],
      fish: [['🐟', '별똥 참치', 2], ['🐋', '성운 고래', 3], ['🌠', '유성 날치', 2]] }
  ];
  // 이번 주 이벤트 행성(주마다 돌아가며) — 이번 주 안에 완주하면 이벤트 배지, 낚시터에 ★이벤트 물고기
  const EVENT_FISH = { moon: ['🐇', '★달토끼 금붕어'], mars: ['🔥', '★불꽃 협곡잉어'], europa: ['✨', '★오로라 해파리고기'], titan: ['👑', '★고리 왕장어'], neptune: ['💠', '★푸른 다이아 상어'], galaxy: ['🌈', '★은하 무지개고기'] };
  const ISNAME = { geumo: '금오도', cheongsan: '청산도', yokji: '욕지도', somaemul: '소매물도', bijin: '비진도', oeyeon: '외연도', geomun: '거문도', udo: '우도', gapa: '가파도', deokjeok: '덕적도', ulleung: '울릉도' };
  const POI = { view: ['🔭', '전망대'], wc: ['🚻', '화장실'], ferry: ['⛴', '선착장'], fish: ['🎣', '낚시 자리'], beach: ['🏖', '해변'], peak: ['⛰', '봉우리'], light: ['🗼', '등대'], camp: ['⛺', '야영장'], info: ['ℹ', '안내'] };

  function buildCourses(T) {
    const out = [];
    (T || []).forEach(is => (is.routes || []).forEach((r, ri) => {
      const pts = r.pts.map(p => [p[0], p[1]]), cum = [0];
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + hav(pts[i - 1], pts[i]));
      const total = cum[cum.length - 1]; if (total < 300) return;
      const marks = (is.pois || []).map(p => { let bi = 0, bd = 1e9; for (let i = 0; i < pts.length; i++) { const d = hav(pts[i], [p[2], p[3]]); if (d < bd) { bd = d; bi = i; } } return { at: cum[bi], d: bd, ic: (POI[p[0]] || ['📍'])[0], name: p[1] || (POI[p[0]] || ['', '장소'])[1], fish: p[0] === 'fish', ll: [p[2], p[3]] }; })
        .filter(p => p.d < 150).sort((a, b) => a.at - b.at);
      const dedup = []; marks.forEach(m => { if (!dedup.some(x => Math.abs(x.at - m.at) < 60 && x.ic === m.ic)) dedup.push(m); });
      dedup.push({ at: total, ic: '🏁', name: (r.to || '도착'), text: '완주! 섬길 도장을 찍었어요.' });
      out.push({ id: `i:${is.id}:${ri}`, kind: 'isle', isle: is.id, ic: '🏝', name: `${ISNAME[is.id] || is.name} · ${r.name}`, m: total, pts, cum, marks: dedup.slice(0, 40) });
    }));
    SPACE.forEach(s => out.push({ id: 's:' + s.id, kind: 'space', sp: s, ic: s.ic, name: s.name, m: s.km * 1000, marks: s.marks.map(x => ({ at: x[0] * 1000, ic: x[1], name: x[2], text: x[3], fish: !!x[4] })) }));
    return out;
  }

  const ACH = [
    ['first1', '👟 첫 1km', s => s.total >= 1000],
    ['day5', '🔥 하루 5km', s => maxDay(s) >= 5000],
    ['day10', '💪 하루 10km', s => maxDay(s) >= 10000],
    ['streak3', '📅 3일 연속 걷기', s => streak(s) >= 3],
    ['streak7', '🗓 7일 연속 걷기', s => streak(s) >= 7],
    ['streak30', '🏅 30일 연속 걷기', s => streak(s) >= 30],
    ['marathon', '🏃 누적 42.195km', s => s.total >= 42195],
    ['km100', '🌏 누적 100km', s => s.total >= 100000],
    ['isle1', '🏝 섬길 첫 완주', s => Object.keys(s.done).some(k => k[0] === 'i')],
    ['isle3', '⛴ 섬길 3곳 완주', s => new Set(Object.keys(s.done).filter(k => k[0] === 'i').map(k => k.split(':')[1])).size >= 3],
    ['moon', '🌙 달 둘레길 완주', s => !!s.done['s:moon']],
    ['space3', '🪐 행성 3곳 완주', s => Object.keys(s.done).filter(k => k[0] === 's').length >= 3],
    ['galaxy', '🌌 은하수 마라톤 완주', s => !!s.done['s:galaxy']],
    ['stamp10', '🔖 도장 10개', s => stampCount(s) >= 10],
    ['stamp30', '📒 도장 30개', s => stampCount(s) >= 30],
    ['fish1', '🎣 첫 이벤트 낚시', s => Object.keys(s.fish).length >= 1],
    ['fish10', '🐠 물고기 10종', s => Object.keys(s.fish).length >= 10],
    ['event', '🎖 이벤트 행성 완주', s => Object.keys(s.badges).length >= 1],
    ['field', '📍 현장 도장', s => Object.keys(s.stamps).some(k => k.startsWith('f:'))]
  ];
  const maxDay = s => Math.max(0, ...Object.values(s.log));
  const stampCount = s => Object.keys(s.stamps).length;
  function streak(s) { let n = 0; const d = new Date(); if (!((s.log[dayKey(d)] || 0) >= 1000)) d.setDate(d.getDate() - 1); while ((s.log[dayKey(d)] || 0) >= 1000) { n++; d.setDate(d.getDate() - 1); } return n; }

  function load() { return Object.assign({ cur: 's:moon', prog: {}, done: {}, log: {}, total: 0, stamps: {}, fish: {}, tickets: [], badges: {}, ach: {}, kg: 65, step: 70, goal: 5, nick: '', mode: 'virtual' }, lsGet('walk.v1', {})); }
  function save(s) { lsSet('walk.v1', s); }

  function view(el, ctx) {
    if (!document.getElementById('walk-css')) { const st = document.createElement('style'); st.id = 'walk-css'; st.textContent = CSS; document.head.appendChild(st); }
    el.classList.add('walk');
    const C = buildCourses(ctx.trails), S = load();
    if (!C.find(c => c.id === S.cur)) S.cur = 's:moon';
    const wk = weekInfo(), evSp = SPACE[wk.n % SPACE.length], evId = 's:' + evSp.id;
    let live = null, saveT = 0, me = null, msgs = [], raf = 0;
    const course = () => C.find(c => c.id === S.cur);
    function stopLive() { if (live) { try { live.stop(); } catch (e) {} live = null; } }
    ctx.setStop(() => { stopLive(); clearTimeout(raf); saveNow(); });
    function saveNow() { clearTimeout(saveT); saveT = 0; save(S); }
    function saveSoon() { if (!saveT) saveT = setTimeout(saveNow, 2500); }
    function note(t) { msgs.unshift(t); msgs = msgs.slice(0, 4); const n = el.querySelector('#wk-say'); if (n) n.innerHTML = msgs.map((m, i) => `<div class="${i ? 'small muted' : ''}">${m}</div>`).join(''); }

    // ── 거리 더하기(모든 방식 공통) ──
    function add(m, why) {
      const k = dayKey(), today = S.log[k] || 0;
      if (today >= DAY_CAP) { note('오늘은 80km를 넘어 더 세지 않아요. 푹 쉬세요!'); return; }
      m = Math.min(m, DAY_CAP - today);
      S.log[k] = today + m; S.total += m;
      const c = course(), before = S.prog[c.id] || 0, after = Math.min(c.m, before + m);
      S.prog[c.id] = after;
      c.marks.forEach((mk, i) => {
        if (mk.at > before && mk.at <= after || (before === 0 && mk.at === 0 && after > 0)) {
          const sk = c.id + ':' + i; if (!S.stamps[sk]) { S.stamps[sk] = Date.now(); note(`${mk.ic} <b>${esc(mk.name)}</b> 도착! 도장 쾅 🔖 ${mk.text ? esc(mk.text) : ''}`); }
          if (mk.fish) { S.tickets.push(c.id); note('🎣 낚시터에 닿아 <b>이벤트 낚시권</b>을 받았어요!'); }
        }
      });
      if (after >= c.m && !S.done[c.id]) {
        S.done[c.id] = Date.now(); note(`🏁 <b>${esc(c.name)}</b> 완주! 축하해요 🎉`);
        if (c.id === evId) { S.badges[wk.key] = c.id; note('🎖 이번 주 이벤트 행성을 완주해 <b>이벤트 배지</b>를 받았어요!'); }
      }
      checkAch(); saveSoon(); paintLive(why);
    }
    function checkAch() { ACH.forEach(([id, n, f]) => { if (!S.ach[id] && f(S)) { S.ach[id] = Date.now(); note(`🏆 업적 달성: <b>${esc(n)}</b>`); } }); }

    // ── 화면 ──
    function render() {
      clearTimeout(raf);
      const c = course(), today = S.log[dayKey()] || 0, goalM = S.goal * 1000;
      const wkM = wk.days.reduce((a, d) => a + (S.log[d] || 0), 0), wmax = Math.max(goalM, ...wk.days.map(d => S.log[d] || 0));
      const isleList = C.filter(x => x.kind === 'isle'), spaceList = C.filter(x => x.kind === 'space');
      const opt = x => `<option value="${x.id}" ${x.id === S.cur ? 'selected' : ''}>${S.done[x.id] ? '✅ ' : ''}${esc(x.ic + ' ' + x.name)} · ${km(x.m)}km</option>`;
      const p = S.prog[c.id] || 0;
      el.innerHTML = `
        <div class="box ev"><b>🎪 이번 주 이벤트 행성: ${evSp.ic} ${esc(evSp.name)}</b>
          <div class="small">이번 주(${wk.days[0].slice(5)}~${wk.days[6].slice(5)}) 안에 완주하면 🎖 이벤트 배지 · 낚시터에 <b>${esc(EVENT_FISH[evSp.id].join(' '))}</b> 등장</div>
          ${S.cur !== evId ? `<div><button class="btn" data-goev>이벤트 행성으로 떠나기</button></div>` : ''}</div>
        <div class="grid2"><div class="box">
          <div class="bar"><select id="wk-course" aria-label="원정 코스" style="flex:1 1 220px"><optgroup label="🌌 우주 둘레길(상상)">${spaceList.map(opt).join('')}</optgroup><optgroup label="🏝 실제 섬길(OpenStreetMap)">${isleList.map(opt).join('')}</optgroup></select></div>
          <canvas id="wk-map" height="300" aria-label="원정 지도"></canvas>
          <div class="prog ${S.done[c.id] ? 'gold' : ''}"><i id="wk-bar" style="width:${(p / c.m * 100).toFixed(1)}%"></i></div>
          <div class="small" id="wk-pos">${km(p)} / ${km(c.m)}km ${S.done[c.id] ? '· ✅ 완주' : `· 다음: ${nextMark(c, p)}`}</div>
          ${c.kind === 'space' ? `<div class="small muted">💡 ${esc(c.sp.tip)}</div>` : `<div class="small dim">길 © OpenStreetMap 기여자(ODbL)</div>`}
          <div class="say" id="wk-say" aria-live="polite">${msgs.length ? msgs.map((m, i) => `<div class="${i ? 'small muted' : ''}">${m}</div>`).join('') : '걸은 만큼 지도 위 원정대가 나아갑니다. 아래에서 거리를 세는 방법을 고르세요.'}</div>
          <div class="bar">${S.tickets.length ? `<button class="btn primary" data-fish>🎣 이벤트 낚시 (${S.tickets.length}장)</button>` : ''}${S.done[c.id] ? `<button class="btn" data-reset>이 코스 다시 걷기</button>` : ''}</div>
        </div>
        <div class="box">
          <b>오늘의 걷기</b>
          <div class="stat"><div><b id="wk-today">${km(today)}km</b><span class="small muted">오늘 / 목표 ${S.goal}km</span></div><div><b id="wk-steps">${Math.round(today / (S.step / 100)).toLocaleString()}</b><span class="small muted">걸음(추정)</span></div><div><b id="wk-kcal">${Math.round(today / 1000 * S.kg * 0.8)}</b><span class="small muted">kcal(추정)</span></div><div><b>${streak(S)}일</b><span class="small muted">연속</span></div></div>
          <div class="prog"><i id="wk-goal" style="width:${Math.min(100, today / goalM * 100).toFixed(1)}%"></i></div>
          <div class="week" aria-label="이번 주 걸은 거리">${wk.days.map((d, i) => `<div class="${d === dayKey() ? 'today' : ''}" title="${d} ${km(S.log[d] || 0)}km"><span>${(S.log[d] || 0) >= 1000 ? ((S.log[d] || 0) / 1000).toFixed(1) : ''}</span><i style="height:${Math.round((S.log[d] || 0) / wmax * 52)}px"></i>${'월화수목금토일'[i]}</div>`).join('')}</div>
          <div class="small muted">이번 주 ${km(wkM)}km · 누적 ${km(S.total)}km</div>
        </div></div>

        <div class="box"><b>거리 세기</b>
          <div class="bar" role="group" aria-label="세는 방법">
            <button class="btn ${live && live.kind === 'gps' ? 'primary' : ''}" data-live="gps">${live && live.kind === 'gps' ? '■ GPS 멈추기' : '🛰 GPS로 걷기'}</button>
            <button class="btn ${live && live.kind === 'step' ? 'primary' : ''}" data-live="step">${live && live.kind === 'step' ? '■ 만보기 멈추기' : '📳 흔들림 만보기'}</button>
          </div>
          <div id="wk-live" class="live" aria-live="polite">${live ? '' : ''}</div>
          <div class="bar"><label class="small muted">직접 입력</label>
            <input id="wk-in" inputmode="decimal" placeholder="예: 6500" style="width:110px" aria-label="걸음 수 또는 거리">
            <select id="wk-unit" aria-label="단위"><option value="step">걸음</option><option value="km">km</option></select>
            <button class="btn primary" data-addin>더하기</button></div>
          <div class="small muted">휴대폰 건강 앱에 나온 오늘 걸음 수를 옮겨 적으면 가장 정확해요. GPS·만보기는 <b>이 화면을 켜 둔 동안만</b> 셉니다(무료 웹 앱의 한계). 차·자전거처럼 빠른 이동은 세지 않아요.</div>
          ${c.kind === 'isle' ? `<div class="notice">📍 <b>현장 걷기</b>: 실제로 ${esc(ISNAME[c.isle] || '')}에 가서 GPS로 걸으면 지도에 내 위치(🔵)가 나오고, 전망대·등대 근처 50m 안에 들어가면 <b>현장 도장</b>을 받아요.</div>` : ''}
          <div class="notice w small">⚠ 걸을 때는 화면 대신 앞을 보세요. 몸이 불편하면 바로 쉬세요. 걸음·칼로리는 추정값이고 의료 정보가 아닙니다. 위치와 걸은 길은 이 휴대폰에만 저장하고 어디에도 올리지 않습니다.</div>
        </div>

        <div class="grid2"><div class="box"><b>🏆 업적 ${Object.keys(S.ach).length}/${ACH.length}</b>
            <div class="ach">${ACH.map(([id, n]) => `<div class="${S.ach[id] ? 'on' : ''}">${S.ach[id] ? '' : '🔒 '}${esc(n)}</div>`).join('')}</div>
            <b class="small">🎣 잡은 이벤트 물고기 ${Object.keys(S.fish).length}종</b>
            <div class="small">${Object.entries(S.fish).map(([n, v]) => `${esc(v.ic)} ${esc(n)} ×${v.n}`).join(' · ') || '<span class="dim">낚시터에 닿으면 낚시권을 받아요.</span>'}</div>
            <div class="small muted">🔖 도장 ${stampCount(S)}개 · 🎖 이벤트 배지 ${Object.keys(S.badges).length}개 · 완주 ${Object.keys(S.done).length}코스</div></div>
          <div class="box" id="wk-rank"></div></div>

        <details class="box"><summary><b>⚙ 내 설정</b> <span class="small muted">(이 휴대폰에만 저장)</span></summary>
          <div class="bar"><label class="small">몸무게 <input id="wk-kg" type="number" min="20" max="200" value="${S.kg}" style="width:72px">kg</label>
            <label class="small">걸음 폭 <input id="wk-step" type="number" min="30" max="120" value="${S.step}" style="width:72px">cm</label>
            <label class="small">하루 목표 <input id="wk-goalin" type="number" min="1" max="40" value="${S.goal}" style="width:64px">km</label>
            <button class="btn" data-saveset>저장</button></div>
          <div class="small muted">칼로리 추정 = 걸은 km × 몸무게 × 0.8 (걷기 평균값, 사람마다 다름)</div></details>`;

      el.querySelector('#wk-course').onchange = e => { stopLiveIfField(); S.cur = e.target.value; saveNow(); render(); };
      const ge = el.querySelector('[data-goev]'); if (ge) ge.onclick = () => { S.cur = evId; saveNow(); render(); };
      const fb = el.querySelector('[data-fish]'); if (fb) fb.onclick = fishing;
      const rb = el.querySelector('[data-reset]'); if (rb) rb.onclick = () => { if (!confirm('이 코스를 처음부터 다시 걸을까요? (완주 기록·도장은 남아요)')) return; S.prog[c.id] = 0; saveNow(); render(); };
      el.querySelectorAll('[data-live]').forEach(b => b.onclick = () => toggleLive(b.dataset.live));
      el.querySelector('[data-addin]').onclick = () => {
        const v = parseFloat(String(el.querySelector('#wk-in').value).replace(/,/g, '')), u = el.querySelector('#wk-unit').value;
        if (!(v > 0)) { note('숫자를 넣어 주세요.'); return; }
        const m = u === 'km' ? v * 1000 : v * S.step / 100;
        if (m > DAY_CAP) { note('한 번에 80km까지만 넣을 수 있어요.'); return; }
        add(m, 'manual'); saveNow(); note(`✍ ${u === 'km' ? v + 'km' : Math.round(v).toLocaleString() + '걸음(약 ' + km(m) + 'km)'}를 더했어요.`); render();
      };
      el.querySelector('[data-saveset]').onclick = () => {
        const kg = +el.querySelector('#wk-kg').value, sp = +el.querySelector('#wk-step').value, g = +el.querySelector('#wk-goalin').value;
        if (kg >= 20 && kg <= 200) S.kg = kg; if (sp >= 30 && sp <= 120) S.step = sp; if (g >= 1 && g <= 40) S.goal = g; saveNow(); render();
      };
      drawMap(); rankBox(el.querySelector('#wk-rank')); paintLive();
    }
    function stopLiveIfField() { /* 코스를 바꿔도 세기는 계속 */ }
    function nextMark(c, p) { const m = c.marks.find(x => x.at > p); return m ? `${m.ic} ${esc(m.name)}까지 ${km(m.at - p)}km` : '🏁 도착'; }

    function paintLive(why) {
      const c = course(), p = S.prog[c.id] || 0, today = S.log[dayKey()] || 0;
      const set = (id, v) => { const n = el.querySelector(id); if (n) n.textContent = v; };
      const bar = el.querySelector('#wk-bar'); if (bar) bar.style.width = (p / c.m * 100).toFixed(1) + '%';
      const g = el.querySelector('#wk-goal'); if (g) g.style.width = Math.min(100, today / (S.goal * 1000) * 100).toFixed(1) + '%';
      set('#wk-today', km(today) + 'km'); set('#wk-steps', Math.round(today / (S.step / 100)).toLocaleString()); set('#wk-kcal', String(Math.round(today / 1000 * S.kg * 0.8)));
      const pos = el.querySelector('#wk-pos'); if (pos) pos.innerHTML = `${km(p)} / ${km(c.m)}km ${S.done[c.id] ? '· ✅ 완주' : `· 다음: ${nextMark(c, p)}`}`;
      const lv = el.querySelector('#wk-live');
      if (lv) lv.innerHTML = live ? (live.kind === 'gps' ? `🛰 ${km(live.m)}km <span class="small muted">${esc(live.msg || '')}</span>` : `📳 ${live.steps.toLocaleString()}걸음 <span class="small muted">약 ${km(live.m)}km ${esc(live.msg || '')}</span>`) : '';
      if (why) drawMap();
      if (why && S.tickets.length && !el.querySelector('[data-fish]')) render();
    }

    // ── GPS · 만보기 ──
    async function toggleLive(kind) {
      const was = live && live.kind; stopLive();
      if (was === kind) { saveNow(); render(); return; }
      if (kind === 'gps') live = startGps(); else live = await startStep();
      render();
    }
    async function wake() { try { if (navigator.wakeLock) return await navigator.wakeLock.request('screen'); } catch (e) {} return null; }
    function startGps() {
      if (!navigator.geolocation) { note('이 기기에서는 GPS를 쓸 수 없어요. 직접 입력을 써 주세요.'); return null; }
      const L = { kind: 'gps', m: 0, msg: '위치 찾는 중…', last: null, lastT: 0, lock: null };
      wake().then(w => L.lock = w);
      L.id = navigator.geolocation.watchPosition(pos => {
        const c = pos.coords; me = [c.latitude, c.longitude];
        if (c.accuracy > 35) { L.msg = `정확도 낮음(±${Math.round(c.accuracy)}m) — 하늘이 트인 곳으로`; paintLive(); return; }
        L.msg = `±${Math.round(c.accuracy)}m`;
        if (L.last) {
          const d = hav(L.last, me), dt = (pos.timestamp - L.lastT) / 1000;
          if (d < 5) { paintLive(); return; }            // 제자리 흔들림은 무시
          if (dt > 0 && d / dt > 4.2) { L.msg = '너무 빨라요 — 차·자전거 이동은 세지 않아요'; L.last = me; L.lastT = pos.timestamp; paintLive(); return; }
          L.m += d; add(d, 'gps');
        }
        L.last = me; L.lastT = pos.timestamp; field(); paintLive('gps');
      }, err => { L.msg = err.code === 1 ? '위치 권한이 꺼져 있어요(설정에서 허용)' : '위치를 찾지 못했어요'; paintLive(); }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 });
      L.stop = () => { navigator.geolocation.clearWatch(L.id); try { L.lock && L.lock.release(); } catch (e) {} };
      note('🛰 GPS 걷기를 시작했어요. 화면을 켜 둔 채 주머니에 넣지 말고 손에 들거나 거치해 주세요.');
      return L;
    }
    async function startStep() {
      if (typeof DeviceMotionEvent === 'undefined') { note('이 기기에는 움직임 센서가 없어요. 직접 입력을 써 주세요.'); return null; }
      try { if (typeof DeviceMotionEvent.requestPermission === 'function' && (await DeviceMotionEvent.requestPermission()) !== 'granted') { note('움직임 센서 권한이 꺼져 있어요.'); return null; } } catch (e) { note('움직임 센서 권한을 받지 못했어요.'); return null; }
      const L = { kind: 'step', m: 0, steps: 0, msg: '', got: false, base: 9.8, up: false, lastStep: 0, lock: null };
      wake().then(w => L.lock = w);
      const h = e => {
        const a = e.accelerationIncludingGravity; if (!a || a.x == null) return; L.got = true;
        const mag = Math.hypot(a.x, a.y, a.z); L.base = L.base * 0.97 + mag * 0.03; const v = mag - L.base, now = performance.now();
        if (!L.up && v > 1.4 && now - L.lastStep > 300) { L.up = true; L.lastStep = now; L.steps++; const d = S.step / 100; L.m += d; add(d); if (L.steps % 10 === 0) paintLive(); }
        else if (L.up && v < 0.4) L.up = false;
      };
      window.addEventListener('devicemotion', h);
      setTimeout(() => { if (live === L && !L.got) { L.msg = '— 이 기기는 센서 값을 주지 않아요(PC 등)'; paintLive(); } }, 3000);
      L.stop = () => { window.removeEventListener('devicemotion', h); try { L.lock && L.lock.release(); } catch (e) {} };
      note('📳 만보기를 시작했어요. 휴대폰을 손에 들고 걸어 주세요.');
      return L;
    }
    // 현장 걷기: 실제 섬 코스에서 내 위치 근처 장소 도장
    function field() {
      const c = course(); if (!me || c.kind !== 'isle') return;
      c.marks.forEach((mk, i) => { if (mk.ll && hav(me, mk.ll) < 50) { const k = 'f:' + c.id + ':' + i; if (!S.stamps[k]) { S.stamps[k] = Date.now(); note(`📍 현장 도장! <b>${esc(mk.ic + ' ' + mk.name)}</b>에 직접 왔어요 🥇`); checkAch(); saveSoon(); } } });
    }

    // ── 지도 ──
    function drawMap() {
      const cv = el.querySelector('#wk-map'); if (!cv) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth || 600, h = +cv.getAttribute('height');
      cv.width = w * dpr; cv.height = h * dpr; cv.style.height = h + 'px';
      const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const c = course(), p = S.prog[c.id] || 0;
      if (c.kind === 'space') return drawSpace(g, w, h, c, p);
      let la0 = 1e9, la1 = -1e9, lo0 = 1e9, lo1 = -1e9; c.pts.forEach(q => { la0 = Math.min(la0, q[0]); la1 = Math.max(la1, q[0]); lo0 = Math.min(lo0, q[1]); lo1 = Math.max(lo1, q[1]); });
      const kx = Math.cos((la0 + la1) / 2 * Math.PI / 180), pd = 24, s = Math.min((w - pd * 2) / Math.max(1e-6, (lo1 - lo0) * kx), (h - pd * 2) / Math.max(1e-6, la1 - la0));
      const ox = (w - (lo1 - lo0) * kx * s) / 2, oy = (h - (la1 - la0) * s) / 2, X = lo => ox + (lo - lo0) * kx * s, Y = la => h - oy - (la - la0) * s;
      const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#0E2F3D'); bg.addColorStop(1, '#0A2230'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
      const line = (n) => { g.beginPath(); for (let i = 0; i <= n; i++) i ? g.lineTo(X(c.pts[i][1]), Y(c.pts[i][0])) : g.moveTo(X(c.pts[i][1]), Y(c.pts[i][0])); };
      g.lineJoin = g.lineCap = 'round'; g.strokeStyle = '#2C4A34'; g.lineWidth = 30; line(c.pts.length - 1); g.stroke(); g.strokeStyle = '#3B6346'; g.lineWidth = 16; g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3; g.setLineDash([5, 5]); g.stroke(); g.setLineDash([]);
      let i = 1; while (i < c.cum.length - 1 && c.cum[i] < p) i++;
      const f = c.cum[i] === c.cum[i - 1] ? 0 : Math.max(0, Math.min(1, (p - c.cum[i - 1]) / (c.cum[i] - c.cum[i - 1])));
      const cur = [c.pts[i - 1][0] + (c.pts[i][0] - c.pts[i - 1][0]) * f, c.pts[i - 1][1] + (c.pts[i][1] - c.pts[i - 1][1]) * f];
      g.strokeStyle = S.done[c.id] ? '#F5C46B' : '#FFFFFF'; g.lineWidth = 4.5; line(i - 1); g.lineTo(X(cur[1]), Y(cur[0])); g.stroke();
      g.font = '15px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      c.marks.forEach((mk, k) => { if (!mk.ll) return; g.globalAlpha = S.stamps[c.id + ':' + k] ? 1 : 0.55; g.fillText(mk.ic, X(mk.ll[1]), Y(mk.ll[0])); }); g.globalAlpha = 1;
      g.font = '22px sans-serif'; g.fillText('🚶', X(cur[1]), Y(cur[0]) - 12);
      if (me && me[0] > la0 - 0.01 && me[0] < la1 + 0.01 && me[1] > lo0 - 0.01 && me[1] < lo1 + 0.01) { g.fillStyle = '#3FA0FF'; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(X(me[1]), Y(me[0]), 7, 0, 7); g.fill(); g.stroke(); }
    }
    function drawSpace(g, w, h, c, p) {
      const sp = c.sp, R = rng(sp.id), t = performance.now() / 1000;
      const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, sp.sky[0]); sky.addColorStop(1, sp.sky[1]); g.fillStyle = sky; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 140; i++) { const x = R() * w, y = R() * h, r = R() * 1.3 + 0.2; g.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.5 + R()) + i)); g.fillStyle = '#fff'; g.fillRect(x, y, r, r); }
      g.globalAlpha = 1;
      // 행성 땅(큰 원판)
      const cx = w / 2, cy = h / 2 + 8, PR = Math.min(w * 0.46, h * 0.46);
      if (sp.deco === 'lake') { g.strokeStyle = 'rgba(255,230,170,.35)'; g.lineWidth = 9; g.beginPath(); g.ellipse(cx, cy, PR * 1.45, PR * 0.32, -0.25, 0, 7); g.stroke(); }
      const gr = g.createRadialGradient(cx - PR * 0.35, cy - PR * 0.4, PR * 0.1, cx, cy, PR); gr.addColorStop(0, sp.ground[0]); gr.addColorStop(1, sp.ground[1]);
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, PR, 0, 7); g.fill();
      g.save(); g.beginPath(); g.arc(cx, cy, PR, 0, 7); g.clip();
      const R2 = rng(sp.id + 'd');
      if (sp.deco === 'crater') for (let i = 0; i < 26; i++) { const x = cx + (R2() - 0.5) * PR * 2, y = cy + (R2() - 0.5) * PR * 2, r = 3 + R2() * PR * 0.12; g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1.2; g.beginPath(); g.arc(x - 1, y - 1, r, 3.4, 5.6); g.stroke(); }
      if (sp.deco === 'dune') { for (let i = 0; i < 18; i++) { const y = cy - PR + R2() * PR * 2, x = cx - PR + R2() * PR * 1.4; g.strokeStyle = 'rgba(60,15,5,.35)'; g.lineWidth = 2 + R2() * 3; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 30, y - 10, x + 60 + R2() * 40, y + 4); g.stroke(); } g.strokeStyle = 'rgba(40,8,0,.5)'; g.lineWidth = 6; g.beginPath(); g.moveTo(cx - PR, cy + PR * 0.2); g.bezierCurveTo(cx - PR * 0.3, cy - PR * 0.1, cx + PR * 0.2, cy + PR * 0.4, cx + PR, cy + PR * 0.1); g.stroke(); }
      if (sp.deco === 'crack') for (let i = 0; i < 22; i++) { let x = cx + (R2() - 0.5) * PR * 2, y = cy + (R2() - 0.5) * PR * 2; g.strokeStyle = i % 3 ? 'rgba(150,80,60,.5)' : 'rgba(90,60,120,.45)'; g.lineWidth = 1 + R2() * 1.5; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (R2() - 0.5) * 50; y += (R2() - 0.3) * 30; g.lineTo(x, y); } g.stroke(); }
      if (sp.deco === 'lake') for (let i = 0; i < 7; i++) { const x = cx + (R2() - 0.5) * PR * 1.5, y = cy + (R2() - 0.5) * PR * 1.5; g.fillStyle = 'rgba(40,25,10,.55)'; g.beginPath(); g.ellipse(x, y, 10 + R2() * 30, 6 + R2() * 14, R2() * 3, 0, 7); g.fill(); }
      if (sp.deco === 'band') for (let i = 0; i < 9; i++) { const y = cy - PR + (i + R2() * 0.5) * PR * 0.24; g.fillStyle = `rgba(${150 + R2() * 80},${200 + R2() * 55},255,.12)`; g.fillRect(cx - PR, y, PR * 2, 6 + R2() * 14); }
      if (sp.deco === 'nebula') for (let i = 0; i < 6; i++) { const x = cx + (R2() - 0.5) * PR * 1.6, y = cy + (R2() - 0.5) * PR * 1.6, r = PR * (0.3 + R2() * 0.4), n = g.createRadialGradient(x, y, 0, x, y, r); n.addColorStop(0, `hsla(${280 + R2() * 80},90%,65%,.35)`); n.addColorStop(1, 'hsla(300,90%,50%,0)'); g.fillStyle = n; g.fillRect(x - r, y - r, r * 2, r * 2); }
      const sh = g.createRadialGradient(cx - PR * 0.5, cy - PR * 0.5, PR * 0.3, cx, cy, PR * 1.05); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = sh; g.fillRect(cx - PR, cy - PR, PR * 2, PR * 2);
      g.restore();
      if (sp.deco === 'lake') { g.strokeStyle = 'rgba(255,230,170,.5)'; g.lineWidth = 9; g.beginPath(); g.ellipse(cx, cy, PR * 1.45, PR * 0.32, -0.25, 0.1, Math.PI - 0.1); g.stroke(); }
      // 둘레길(구불구불한 고리)
      const ph = R() * 6, ph2 = R() * 6, N = 260, loop = [];
      for (let i = 0; i <= N; i++) { const a = -Math.PI / 2 + i / N * Math.PI * 2, r = PR * 0.72 * (1 + 0.12 * Math.sin(3 * a + ph) + 0.06 * Math.sin(5 * a + ph2)); loop.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.86]); }
      const lc = [0]; for (let i = 1; i <= N; i++) lc.push(lc[i - 1] + Math.hypot(loop[i][0] - loop[i - 1][0], loop[i][1] - loop[i - 1][1]));
      const L = lc[N], ptAt = fr => { const d = fr * L; let i = 1; while (i < N && lc[i] < d) i++; const f = (d - lc[i - 1]) / Math.max(1e-6, lc[i] - lc[i - 1]); return [loop[i - 1][0] + (loop[i][0] - loop[i - 1][0]) * f, loop[i - 1][1] + (loop[i][1] - loop[i - 1][1]) * f, i]; };
      g.lineJoin = g.lineCap = 'round';
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 10; g.beginPath(); loop.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2.5; g.setLineDash([4, 6]); g.stroke(); g.setLineDash([]);
      const cur = ptAt(Math.min(1, p / c.m));
      g.shadowColor = sp.path; g.shadowBlur = 12; g.strokeStyle = S.done[c.id] ? '#F5C46B' : sp.path; g.lineWidth = 4.5; g.beginPath(); for (let i = 0; i < cur[2]; i++) i ? g.lineTo(loop[i][0], loop[i][1]) : g.moveTo(loop[i][0], loop[i][1]); g.lineTo(cur[0], cur[1]); g.stroke(); g.shadowBlur = 0;
      g.font = '17px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      c.marks.forEach((mk, k) => { const q = ptAt(Math.min(0.995, mk.at / c.m)); g.globalAlpha = S.stamps[c.id + ':' + k] ? 1 : 0.5; g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.arc(q[0], q[1], 12, 0, 7); g.fill(); g.fillText(mk.ic, q[0], q[1] + 1); });
      g.globalAlpha = 1; g.font = '24px sans-serif'; g.fillText('🧑‍🚀', cur[0], cur[1] - 16 + Math.sin(t * 3) * 2);
      g.font = '12px sans-serif'; g.fillStyle = 'rgba(255,255,255,.7)'; g.textAlign = 'left'; g.fillText('상상의 둘레길', 10, 14);
      if (S.prog[c.id] < c.m && !document.hidden && el.isConnected) raf = setTimeout(() => requestAnimationFrame(drawMap), 140); // 별 반짝임
    }

    // ── 🎣 이벤트 낚시: 움직이는 바늘이 초록 칸에 있을 때 '챔질' 3번 ──
    function fishing() {
      const cid = S.tickets[0], c = C.find(x => x.id === cid) || course();
      let pool;
      if (c.kind === 'space') { pool = c.sp.fish.map(f => ({ ic: f[0], n: f[1], hard: f[2] })); if (c.id === evId) pool.push({ ic: EVENT_FISH[c.sp.id][0], n: EVENT_FISH[c.sp.id][1], hard: 3, ev: 1 }); }
      else { const mo = new Date().getMonth() + 1; pool = ((ctx.data && ctx.data.species) || []).filter(s => s.kind === 'fish' && s.months.includes(mo)).slice(0, 8).map(s => ({ ic: s.emo, n: s.name, hard: 1 + (s.name.length % 3) })); if (!pool.length) pool = [{ ic: '🐟', n: '노래미', hard: 1 }]; }
      const fish = pool[Math.floor(Math.random() * pool.length)];
      const box = document.createElement('div'); box.className = 'fishbox';
      box.innerHTML = `<div role="dialog" aria-label="이벤트 낚시"><b>🎣 ${esc(c.ic + ' ' + c.name)} 낚시터</b>
        <div class="small muted">노란 바늘이 <b class="ok">초록 칸</b>에 들어왔을 때 챔질! 3번 성공하면 낚아요(3번 놓치면 도망).</div>
        <div class="meter"><div class="zone"></div><div class="cur"></div></div>
        <div class="say" aria-live="polite">입질을 기다리는 중… 🫧</div>
        <div class="bar"><button class="btn primary" data-hit style="flex:1;min-height:48px;font-size:16px">⚡ 챔질!</button><button class="btn" data-close>그만</button></div></div>`;
      el.appendChild(box);
      const zone = box.querySelector('.zone'), curEl = box.querySelector('.cur'), say = box.querySelector('.say');
      let hit = 0, miss = 0, x = 0, dir = 1, zx = 0, zw = 0, alive = true, last = performance.now();
      const speed = () => 0.55 + fish.hard * 0.28 + hit * 0.15;
      function newZone() { zw = Math.max(0.1, 0.26 - fish.hard * 0.04 - hit * 0.02); zx = 0.08 + Math.random() * (0.84 - zw); zone.style.left = zx * 100 + '%'; zone.style.width = zw * 100 + '%'; }
      newZone();
      (function loop(now) { if (!alive) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; x += dir * speed() * dt; if (x > 1) { x = 1; dir = -1; } if (x < 0) { x = 0; dir = 1; } curEl.style.left = `calc(${x * 100}% - 2px)`; requestAnimationFrame(loop); })(last);
      const close = () => { alive = false; box.remove(); render(); };
      box.querySelector('[data-close]').onclick = close;
      box.querySelector('[data-hit]').onclick = () => {
        if (x >= zx && x <= zx + zw) { hit++; say.textContent = ['', '좋아요! 한 번 더! 🎣', '거의 다 왔어요! 💪'][hit] || ''; try { navigator.vibrate && navigator.vibrate(40); } catch (e) {} }
        else { miss++; say.textContent = `앗, 빗나갔어요 (${miss}/3)`; }
        if (hit >= 3 || miss >= 3) {
          alive = false; S.tickets.shift();
          if (hit >= 3) { const v = S.fish[fish.n] || { ic: fish.ic, n: 0 }; v.n++; S.fish[fish.n] = v; say.innerHTML = `<b>${esc(fish.ic)} ${esc(fish.n)}</b>를 낚았어요! ${fish.ev ? '🎪 이벤트 물고기!' : ''} ${v.n === 1 ? '(새 물고기 📗)' : ''}`; checkAch(); }
          else say.textContent = '물고기가 도망갔어요… 다음 낚시터에서 다시! 🌊';
          saveNow();
          box.querySelector('[data-hit]').outerHTML = `<button class="btn primary" data-ok style="flex:1;min-height:48px">확인</button>`;
          box.querySelector('[data-ok]').onclick = close;
        } else newZone();
      };
    }

    // ── 주간 순위 ──
    function weekM() { return wk.days.reduce((a, d) => a + (S.log[d] || 0), 0); }
    function code() { const days = wk.days.map(d => Math.round(S.log[d] || 0)); return 'SW1.' + btoa(JSON.stringify({ w: wk.key, d: days })); }
    function readCode(t) {
      const s = String(t || '').trim(); if (!s.startsWith('SW1.')) throw new Error('기록 코드가 아니에요');
      const o = JSON.parse(atob(s.slice(4)));
      if (o.w !== wk.key) throw new Error('이번 주 기록 코드가 아니에요');
      if (!Array.isArray(o.d) || o.d.length !== 7 || o.d.some(v => !(v >= 0 && v <= DAY_CAP))) throw new Error('기록 코드 내용이 이상해요');
      return o.d;
    }
    function rankBox(box) {
      if (!box) return;
      if (!ctx.rank) {
        box.innerHTML = `<b>🏅 주간 걷기 순위</b>
          <div class="small">순위는 「바다 조황 수첩」에서 겨뤄요. 이 기록 코드를 복사해 수첩의 <b>🏝 섬·바다 → 🚶 섬길·우주 원정</b> 순위 칸에 붙여 넣으세요. 코드에는 <b>이번 주 날짜별 거리만</b> 들어 있어요(위치 없음).</div>
          <textarea readonly aria-label="기록 코드">${esc(code())}</textarea>
          <div class="bar"><button class="btn" data-copy>📋 코드 복사</button><a class="btn" href="https://claude.ai/artifact/NrW6xWoMdhdBcQ3Fhgo4Zz" target="_blank" rel="noopener">📒 조황 수첩 열기</a></div>`;
        box.querySelector('[data-copy]').onclick = async () => { const ta = box.querySelector('textarea'); try { await navigator.clipboard.writeText(ta.value); note('📋 기록 코드를 복사했어요.'); } catch (e) { ta.select(); try { document.execCommand('copy'); note('📋 복사했어요.'); } catch (x) { note('코드를 길게 눌러 복사해 주세요.'); } } };
        return;
      }
      box.innerHTML = `<b>🏅 이번 주 걷기 순위 <span class="small muted">${esc(wk.key)}</span></b>
        <div class="bar"><input id="wk-nick" maxlength="12" placeholder="별명(12자)" value="${esc(S.nick)}" style="width:130px" aria-label="별명"><button class="btn primary" data-up>내 기록 올리기 (${km(weekM())}km)</button></div>
        <details><summary class="small">📱 휴대폰 앱 기록 코드 붙여넣기</summary><textarea id="wk-code" placeholder="SW1. 로 시작하는 코드"></textarea><button class="btn" data-imp>가져오기</button></details>
        <div id="wk-list" class="small muted">순위 불러오는 중…</div>
        <div class="small dim">별명과 이번 주 거리만 올라가요(위치·경로 없음). 스스로 적은 기록이라 재미로 겨뤄요 · 하루 80km 넘는 값은 받지 않아요.</div>`;
      const nick = box.querySelector('#wk-nick');
      nick.addEventListener('input', e => { if (!e.isComposing) S.nick = nick.value.slice(0, 12); }); nick.addEventListener('compositionend', () => { S.nick = nick.value.slice(0, 12); });
      box.querySelector('[data-imp]').onclick = () => {
        try { const d = readCode(box.querySelector('#wk-code').value); let added = 0; wk.days.forEach((k, i) => { const cur = S.log[k] || 0; if (d[i] > cur) { S.total += d[i] - cur; added += d[i] - cur; S.log[k] = d[i]; } }); checkAch(); saveNow(); note(`📱 휴대폰 기록을 합쳤어요 (+${km(added)}km, 날짜별로 더 큰 값 사용).`); render(); }
        catch (e) { note('⚠ ' + esc(e.message)); }
      };
      box.querySelector('[data-up]').onclick = async () => {
        S.nick = nick.value.trim().slice(0, 12); saveNow();
        if (!S.nick) { note('별명을 적어 주세요.'); return; }
        try { await ctx.rank.submit({ nick: S.nick, week: wk.key, km: +(weekM() / 1000).toFixed(2) }); note('🏅 이번 주 기록을 올렸어요!'); list(); } catch (e) { note('기록을 올리지 못했어요(로그인·권한 확인).'); }
      };
      async function list() {
        const L = box.querySelector('#wk-list');
        try { const rows = await ctx.rank.list(wk.key); L.innerHTML = rows.length ? `<table class="rank">${rows.map((r, i) => `<tr><td class="${r.me ? 'me' : ''}">${['🥇', '🥈', '🥉'][i] || i + 1 + '.'} ${esc(r.nick)}${r.me ? ' (나)' : ''}</td><td class="${r.me ? 'me' : ''}">${(+r.km).toFixed(1)}km</td></tr>`).join('')}</table>` : '아직 이번 주 기록이 없어요. 첫 번째가 되어 보세요!'; }
        catch (e) { L.textContent = '순위를 불러오지 못했어요.'; }
      }
      list();
    }

    render();
  }

  window.WalkApp = { view, SPACE, weekInfo };
})();
