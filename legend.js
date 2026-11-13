/* 📜 옛이야기 원정 (v5.6) — LegendApp
 *  · 📜 옛이야기 카드: 나라·지역별 전설을 지도 위 카드로 읽고 「이야기 조각」 받기
 *  · 🧜 물결이 세계 여행: 조각을 모으면 연재가 한 화씩 열림
 *  · 🧩 조각·현실 원정: 위치(누를 때 한 번만, 이 기기에만 기록) · 내가 고른 관심사로 오늘의 퀘스트 · 친구·가족 초대 코드
 *  개인정보: 위치 좌표는 저장하지 않고 '도장 받은 이야기 id·날짜'만 localStorage 'legend.v1'에 남김.
 *           다른 앱 사용 기록·웹사이트 기록·연락처는 읽지 않음(웹 앱은 읽을 수도 없음). 초대 코드엔 별명·점수만 들어감.
 */
window.LegendApp = (function () {
  const CSS = `
  .lg { display: grid; gap: 10px; --lg-panel: #141A2A; --lg-line: #2A3550; --lg-acc: #C9A0FF; --lg-muted: #9AA5B1; }
  .lg .tabs { display: flex; gap: 6px; flex-wrap: wrap; }
  .lg .tab { border: 1px solid var(--lg-line); background: var(--lg-panel); color: var(--lg-muted); border-radius: 8px; padding: 6px 11px; font: 700 13px/1.3 inherit; font-family: inherit; cursor: pointer; }
  .lg .tab[aria-selected="true"] { background: #6B4FC8; border-color: #6B4FC8; color: #fff; }
  .lg .box { background: var(--lg-panel); border: 1px solid var(--lg-line); border-radius: 10px; padding: 10px 12px; display: grid; gap: 7px; min-width: 0; }
  .lg .row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  .lg .chip { border: 1px solid var(--lg-line); background: #0E1322; color: inherit; border-radius: 999px; padding: 4px 10px; font-size: 12.5px; cursor: pointer; font-family: inherit; }
  .lg .chip[aria-pressed="true"] { background: #3B2E6E; border-color: var(--lg-acc); color: #fff; }
  .lg .btn { border: 1px solid var(--lg-line); background: #1B2338; color: inherit; border-radius: 8px; padding: 6px 11px; font-size: 13px; cursor: pointer; font-family: inherit; text-decoration: none; display: inline-block; }
  .lg .btn.pri { background: #6B4FC8; border-color: #6B4FC8; color: #fff; font-weight: 700; }
  .lg .btn:disabled { opacity: .5; cursor: default; }
  .lg .muted { color: var(--lg-muted); } .lg .small { font-size: 12px; }
  .lg .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 8px; }
  .lg .lc { text-align: left; border: 1px solid var(--lg-line); background: #10172A; color: inherit; border-radius: 10px; padding: 8px 10px; cursor: pointer; font-family: inherit; display: grid; gap: 2px; }
  .lg .lc.on { border-color: var(--lg-acc); }
  .lg .lc b { font-size: 13.5px; }
  .lg .story { line-height: 1.65; }
  .lg .moral { color: #FFD27A; } .lg .seaN { color: #7FD6E8; }
  .lg .bar { height: 10px; background: #0B1020; border-radius: 99px; overflow: hidden; border: 1px solid var(--lg-line); }
  .lg .bar i { display: block; height: 100%; background: linear-gradient(90deg, #6B4FC8, #C9A0FF); }
  .lg .ep { display: grid; gap: 6px; }
  .lg .bub { display: grid; grid-template-columns: 74px 1fr; gap: 8px; align-items: start; }
  .lg .bub b { color: var(--lg-acc); font-size: 12.5px; }
  .lg .bub span { background: #1B2338; border-radius: 10px; padding: 6px 9px; }
  .lg .bub.mul b { color: #7FD6E8; }
  .lg table { border-collapse: collapse; width: 100%; } .lg td, .lg th { border-bottom: 1px solid var(--lg-line); padding: 4px 6px; text-align: left; font-size: 12.5px; }
  .lg input[type=text] { background: #0B1020; border: 1px solid var(--lg-line); color: inherit; border-radius: 8px; padding: 6px 8px; font-family: inherit; font-size: 13px; min-width: 0; width: 100%; box-sizing: border-box; }
  .lg .code { font-family: Consolas, monospace; font-size: 11.5px; word-break: break-all; background: #0B1020; padding: 6px 8px; border-radius: 8px; }
  .lg .q { display: grid; grid-template-columns: 26px 1fr; gap: 8px; align-items: start; padding: 6px 0; border-bottom: 1px dashed var(--lg-line); }
  .lg .q:last-child { border-bottom: 0; }
  .lg .done { color: #7AD7A0; }
  @media (max-width: 420px) { .lg .bub { grid-template-columns: 1fr; gap: 2px; } }`;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const dayKey = d => { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  function hav(a, b) { const R = 6371000, p = Math.PI / 180, dl = (b[0] - a[0]) * p, dn = (b[1] - a[1]) * p; const h = Math.sin(dl / 2) ** 2 + Math.cos(a[0] * p) * Math.cos(b[0] * p) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }
  function rng(seed) { let x = 0; for (const ch of String(seed)) x = (x * 31 + ch.charCodeAt(0)) >>> 0; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
  const D = () => window.LEGENDS || { REG: {}, L: [], SERIES: [], need: n => (n - 1) * 3 };
  const byId = id => D().L.find(x => x.id === id);
  const NATION = { KOR: '대한민국', JPN: '일본', CHN: '중국', TWN: '타이완', VNM: '베트남', THA: '타이', PHL: '필리핀', IDN: '인도네시아', IND: '인도', DNK: '덴마크', GBR: '영국', NOR: '노르웨이', GRC: '그리스', DEU: '독일', FRA: '프랑스', NLD: '네덜란드', ITA: '이탈리아', IRL: '아일랜드', ISL: '아이슬란드', CHL: '칠레', BRA: '브라질', CAN: '캐나다', USA: '미국', PER: '페루', MEX: '멕시코', NZL: '뉴질랜드', AUS: '오스트레일리아', ARE: '아랍에미리트', EGY: '이집트', ZAF: '남아프리카공화국', KEN: '케냐', MAR: '모로코', MYS: '말레이시아', KHM: '캄보디아', MNG: '몽골', RUS: '러시아', ESP: '스페인', TUR: '튀르키예', CHE: '스위스', AUT: '오스트리아', CZE: '체코', HRV: '크로아티아', PRT: '포르투갈', FIN: '핀란드' };
  const TOPICS = [['sea', '🎣 바다·낚시'], ['hist', '🏯 역사'], ['myth', '🐉 신화·전설'], ['food', '🍜 음식'], ['walk', '🚶 걷기'], ['fam', '👨‍👩‍👧 가족 나들이']];
  const FIELD_M = 3000; // 현장 도장 반경

  function load() { return Object.assign({ read: {}, visits: {}, likes: { reg: [], top: [] }, quests: {}, nick: '', friends: [] }, lsGet('legend.v1', {})); }
  function save(s) { lsSet('legend.v1', s); }
  function walkKm() { const w = lsGet('walk.v1', {}); return { total: (+w.total || 0) / 1000, today: ((w.log || {})[dayKey()] || 0) / 1000 }; }
  function score(s) {
    s = s || load(); const read = Object.keys(s.read).length, visit = Object.keys(s.visits).length;
    const quest = Object.values(s.quests).reduce((a, q) => a + Object.keys(q || {}).length, 0), walk = Math.floor(walkKm().total / 2);
    const frag = read + visit * 3 + quest + walk, eps = D().SERIES.filter(e => frag >= D().need(e.n)).length;
    return { read, visit, quest, walk, frag, eps };
  }
  function markRead(id) { const s = load(); if (!s.read[id]) { s.read[id] = dayKey(); save(s); return true; } return false; }
  function stamp(id) { const s = load(); if (!s.visits[id]) { s.visits[id] = dayKey(); save(s); return true; } return false; }
  function css() { if (!document.getElementById('lg-css')) { const st = document.createElement('style'); st.id = 'lg-css'; st.textContent = CSS; document.head.appendChild(st); } }
  const kakao = (q, lat, lon) => 'https://map.kakao.com/link/map/' + encodeURIComponent(q) + ',' + lat + ',' + lon;
  const gmap = (lat, lon) => 'https://www.google.com/maps/search/?api=1&query=' + lat + ',' + lon;

  // 지도 카드(관제도 옆 칸·카드 목록에서 같이 씀)
  function cardHTML(l, opt) {
    if (!l) return '';
    const s = load(), got = !!s.read[l.id], vis = !!s.visits[l.id];
    return `<div class="lgcard" data-lg="${esc(l.id)}"><h3 style="margin:0">${esc(l.emo)} ${esc(l.t)}</h3>
      <div class="small muted">${esc(NATION[l.a3] || l.a3)} · ${esc(l.place)} · ${esc(l.k)}</div>
      <div class="story">${esc(l.s)}</div>
      <div class="moral">💡 ${esc(l.m)}</div>${l.sea ? `<div class="seaN small">🌊 ${esc(l.sea)}</div>` : ''}
      <div class="row" style="margin-top:4px"><button class="btn pri" data-lg-read="${esc(l.id)}" ${got ? 'disabled' : ''}>${got ? '✔ 이야기 조각 받음' : '🧩 다 읽었어요 — 조각 받기'}</button>
        <a class="btn" href="${esc(l.a3 === 'KOR' ? kakao(l.place, l.lat, l.lon) : gmap(l.lat, l.lon))}" target="_blank" rel="noopener">🗺 지도</a>${vis ? '<span class="chip" aria-pressed="true">🏅 현장 도장</span>' : ''}</div>
      ${opt && opt.note === false ? '' : '<div class="small muted">옛이야기를 쉬운 말로 짧게 다시 쓴 줄거리예요. 지역마다 조금씩 다르게 전해져요.</div>'}</div>`;
  }
  function bindCard(root, after) {
    root.querySelectorAll('[data-lg-read]').forEach(b => b.onclick = () => { if (markRead(b.dataset.lgRead)) { b.textContent = '✔ 이야기 조각 받음 (+1)'; b.disabled = true; if (after) after(); } });
  }
  const forIsle = name => D().L.filter(l => l.isle === name);
  const forA3 = a3 => D().L.filter(l => l.a3 === a3);

  /* ═════ 전체 화면(섬·바다 속 탭) ═════ */
  function view(el, ctx) {
    css(); ctx = ctx || {};
    const ui = Object.assign({ tab: 'cards', reg: '', q: '', open: '' }, lsGet('legend.ui', {}));
    let geoReq = 0; let near = null; let msg = '';
    if (ctx.setStop) ctx.setStop(() => { geoReq++; });
    el.classList.add('lg');
    if (ctx.inPC) el.addEventListener('click', e => { const a = e.target.closest('a[href^="https://"]'); if (a) { e.preventDefault(); e.stopPropagation(); try { window.chrome.webview.postMessage({ type: 'open', url: a.href }); } catch (x) {} } });
    function render() {
      lsSet('legend.ui', { tab: ui.tab, reg: ui.reg, open: ui.open });
      const sc = score();
      el.innerHTML = `<div class="box"><div class="row" style="justify-content:space-between"><b>📜 옛이야기 원정</b><span class="small">🧩 이야기 조각 <b>${sc.frag}</b>개 · 연재 ${sc.eps}/${D().SERIES.length}화 열림</span></div>
        <div class="small muted">세계 바다와 마을의 옛이야기를 모으는 게임이에요. 읽고, 걷고, 실제로 가 보면 조각이 모여 「물결이 세계 여행」이 한 화씩 열려요.</div>
        <div class="tabs" role="tablist">${[['cards', '📜 옛이야기 카드'], ['series', '🧜 물결이 세계 여행'], ['quest', '🧩 조각·현실 원정']].map(([k, l]) => `<button class="tab" role="tab" data-t="${k}" aria-selected="${ui.tab === k}">${l}</button>`).join('')}</div></div><div id="lg-body"></div>`;
      el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { ui.tab = b.dataset.t; render(); });
      ({ cards: cardsView, series: seriesView, quest: questView })[ui.tab](el.querySelector('#lg-body'));
    }
    function cardsView(b) {
      const s = load(), R = D().REG, q = ui.q.trim();
      const list = D().L.filter(l => (!ui.reg || l.reg === ui.reg) && (!q || (l.t + l.place + (NATION[l.a3] || '')).includes(q)));
      const op = byId(ui.open);
      b.innerHTML = `<div class="box"><div class="row"><button class="chip" data-r="" aria-pressed="${!ui.reg}">전체 ${D().L.length}</button>${Object.keys(R).map(k => `<button class="chip" data-r="${k}" aria-pressed="${ui.reg === k}">${R[k]} ${D().L.filter(l => l.reg === k).length}</button>`).join('')}</div>
        <input type="text" id="lg-q" placeholder="이야기·장소·나라 찾기 (예: 제주, 거북, 그리스)" value="${esc(ui.q)}" aria-label="옛이야기 찾기">
        <div class="small muted">읽은 이야기 ${Object.keys(s.read).length}/${D().L.length} · 🌏 「지구·세계 관제도」에서도 📜 빛기둥을 누르면 같은 이야기가 나와요.</div></div>
        ${op ? `<div class="box" id="lg-open">${cardHTML(op)}<div class="row">${fieldBtn(op)}</div></div>` : ''}
        <div class="grid">${list.map(l => `<button class="lc ${ui.open === l.id ? 'on' : ''}" data-o="${esc(l.id)}"><b>${esc(l.emo)} ${esc(l.t)}</b><span class="small muted">${esc(NATION[l.a3] || l.a3)} · ${esc(l.place)}</span><span class="small">${s.read[l.id] ? '<span class="done">✔ 조각 받음</span>' : '🧩 아직 안 읽음'}${s.visits[l.id] ? ' · 🏅 현장' : ''}</span></button>`).join('') || '<div class="muted">찾는 이야기가 없어요.</div>'}</div>`;
      b.querySelectorAll('[data-r]').forEach(x => x.onclick = () => { ui.reg = x.dataset.r; render(); });
      const inp = b.querySelector('#lg-q'); inp.oninput = () => { ui.q = inp.value; clearTimeout(inp._t); inp._t = setTimeout(() => { const pos = inp.selectionStart; render(); const n = el.querySelector('#lg-q'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} } }, 250); };
      b.querySelectorAll('[data-o]').forEach(x => x.onclick = () => { ui.open = ui.open === x.dataset.o ? '' : x.dataset.o; render(); const o = el.querySelector('#lg-open'); if (o) o.scrollIntoView({ block: 'nearest' }); });
      bindCard(b, render); bindField(b);
    }
    function fieldBtn(l) { return load().visits[l.id] ? '' : `<button class="btn" data-field="${esc(l.id)}">📍 이 장소에 와 있어요 — 현장 도장 확인</button><span class="small muted">${FIELD_M / 1000}km 안이면 도장(+3)</span>`; }
    function bindField(b) {
      b.querySelectorAll('[data-field]').forEach(x => x.onclick = () => { const l = byId(x.dataset.field); x.disabled = true; x.textContent = '📍 위치 확인 중…'; locate(pos => { const d = hav(pos, [l.lat, l.lon]); if (d <= FIELD_M) { stamp(l.id); msg = `🏅 「${l.t}」 현장 도장을 받았어요! (+3)`; } else msg = `지금 위치에서 약 ${(d / 1000).toFixed(1)}km 떨어져 있어요. ${FIELD_M / 1000}km 안에서 다시 눌러 주세요.`; render(); alertMsg(); }, err => { msg = err; render(); alertMsg(); }); });
    }
    function alertMsg() { if (!msg) return; const box = document.createElement('div'); box.className = 'box'; box.setAttribute('role', 'status'); box.textContent = msg; const body = el.querySelector('#lg-body'); body.insertBefore(box, body.firstChild); msg = ''; }
    function locate(ok, bad) {
      if (!navigator.geolocation) { bad('이 기기·브라우저는 위치 확인을 지원하지 않아요.'); return; }
      const my = ++geoReq;
      navigator.geolocation.getCurrentPosition(p => { if (my === geoReq) ok([p.coords.latitude, p.coords.longitude]); },
        e => { if (my === geoReq) bad(e.code === 1 ? '위치 사용을 허락하지 않으셨어요. 허락하지 않아도 다른 놀이는 모두 할 수 있어요.' : '위치를 찾지 못했어요. 바깥에서 다시 시도해 주세요.'); },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 });
    }
    function seriesView(b) {
      const sc = score(), S = D().SERIES, next = S.find(e => sc.frag < D().need(e.n));
      b.innerHTML = `<div class="box"><b>🧜 물결이 세계 여행</b><div class="small">인어 물결이가 세계 옛이야기 속으로 들어가 주인공들을 만나요. 이야기 조각 3개마다 한 화가 열려요.</div>
        <div class="bar" aria-label="연재 진행"><i style="width:${Math.round(sc.eps / S.length * 100)}%"></i></div>
        <div class="small">${next ? `다음 ${next.n}화까지 조각 <b>${D().need(next.n) - sc.frag}</b>개 남았어요.` : '🎉 모든 화를 열었어요!'}</div></div>
        ${S.map(e => { const open = sc.frag >= D().need(e.n), l = byId(e.lid); return `<div class="box ep"><div class="row" style="justify-content:space-between"><b>${e.n}화 · ${esc(e.t)}</b><span class="small muted">${l ? esc(l.emo + ' ' + l.t) : ''}</span></div>
          ${open ? e.p.map(([w, t]) => `<div class="bub ${w === '물결이' ? 'mul' : ''}"><b>${w === '물결이' ? '🧜 ' : ''}${esc(w)}</b><span>${esc(t)}</span></div>`).join('') + `<div class="small seaN">📝 물결이의 바다 수첩 — ${esc(e.note)}</div>${l ? `<div class="row"><button class="btn" data-goto-l="${esc(l.id)}">📜 원래 이야기 읽기</button></div>` : ''}`
            : `<div class="muted small">🔒 이야기 조각 ${D().need(e.n)}개가 모이면 열려요.</div>`}</div>`; }).join('')}`;
      b.querySelectorAll('[data-goto-l]').forEach(x => x.onclick = () => { ui.tab = 'cards'; ui.open = x.dataset.gotoL; ui.reg = ''; ui.q = ''; render(); });
    }

    /* 🧩 조각·현실 원정 */
    function quests(s) {
      const today = dayKey(), r = rng('lg' + today), L = D().L, likes = s.likes || { reg: [], top: [] };
      const pick = arr => arr[Math.floor(r() * arr.length)];
      const pool = L.filter(l => !likes.reg.length || likes.reg.includes(l.reg));
      const unread = pool.filter(l => !s.read[l.id]); const rl = pick(unread.length ? unread : pool.length ? pool : L);
      const qz = pick(L), others = Object.keys(NATION).filter(a => a !== qz.a3 && forA3(a).length); const ch = [qz.a3, pick(others), pick(others)].filter((v, i, a) => a.indexOf(v) === i);
      while (ch.length < 3) { const o = pick(Object.keys(NATION)); if (!ch.includes(o)) ch.push(o); }
      const opts = ch.map(v => [r(), v]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
      const all = [
        { id: 'read', top: 'myth', ic: '📜', t: `「${rl.t}」 읽고 조각 받기`, done: s.read[rl.id] === today, act: `<button class="btn" data-goto-l="${esc(rl.id)}">읽으러 가기</button>` },
        { id: 'quiz', top: 'myth', ic: '❓', t: `퀴즈: 「${qz.t}」는 어느 나라 이야기일까요?`, quiz: { ans: qz.a3, opts } },
        { id: 'walk', top: 'walk', ic: '🚶', t: '오늘 2km 걷기 (「섬길·우주 원정」에서 걸으면 자동 확인)', done: walkKm().today >= 2, prog: `${walkKm().today.toFixed(1)} / 2km` },
        { id: 'fam', top: 'fam', ic: '👨‍👩‍👧', t: `가족이나 친구에게 「${rl.t}」 이야기 들려주기`, manual: '들려줬어요' },
        { id: 'visit', top: 'sea', ic: '📍', t: '가까운 옛이야기 장소 찾아보기 (아래 「현실 원정」)', done: Object.values(s.visits).includes(today) || !!(s.quests[today] || {}).visit }
      ];
      const P = window.GLOBE_PLACES, SD = window.SEA_DATA;
      if (P && P.C) { const foods = []; Object.keys(P.C).forEach(a => P.C[a].p.forEach(p => { if (p[0] === 'food') foods.push([a, p]); })); if (foods.length) { const f = pick(foods); all.push({ id: 'food', top: 'food', ic: '🍜', t: `${P.C[f[0]].flag} ${NATION[f[0]] || f[0]}의 대표 음식 알아보기`, reveal: `${f[1][1]} — ${f[1][4]}` }); } }
      if (SD && SD.species) { const m = new Date().getMonth() + 1, ss = SD.species.filter(x => x.months.includes(m)); if (ss.length) { const f = pick(ss); all.push({ id: 'fish', top: 'sea', ic: '🐟', t: '이번 달 제철 바다 생물 하나 알아보기', reveal: `${f.emo} ${f.name} — ${f.how}. 맛: ${f.cook}${f.size ? ` · 금지 체장 ${f.size}` : ''}` }); } }
      const liked = all.filter(q => likes.top.includes(q.top)), rest = all.filter(q => !likes.top.includes(q.top));
      const sh = a => a.map(x => [r(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
      const out = sh(liked).concat(sh(rest)).slice(0, 3);
      out.forEach(q => { if ((s.quests[today] || {})[q.id]) q.done = true; });
      return out;
    }
    function questDone(id) { const s = load(), t = dayKey(); s.quests[t] = s.quests[t] || {}; if (!s.quests[t][id]) { s.quests[t][id] = 1; const keys = Object.keys(s.quests).sort(); while (keys.length > 60) delete s.quests[keys.shift()]; save(s); return true; } return false; }
    function questView(b) {
      const s = load(), sc = score(), today = dayKey(), qs = quests(s);
      qs.forEach(q => { if (q.done && !(s.quests[today] || {})[q.id] && !q.quiz && !q.manual && !q.reveal) questDone(q.id); });
      const s2 = load(), sc2 = score(s2), code = myCode(s2, sc2);
      const fr = (s2.friends || []).slice().map(f => Object.assign({}, f));
      const board = [{ n: (s2.nick || '나') + ' (나)', f: sc2.frag, r: sc2.read, v: sc2.visit, e: sc2.eps, me: true }].concat(fr).sort((a, c) => c.f - a.f);
      const fam = fr.filter(f => f.fam); const famSum = fam.reduce((a, f) => a + f.f, sc2.frag);
      b.innerHTML = `<div class="box"><b>🧩 내 이야기 조각 ${sc2.frag}개</b>
          <table><tr><td>📜 읽은 이야기</td><td>${sc2.read}편 × 1</td></tr><tr><td>🏅 현장 도장</td><td>${sc2.visit}곳 × 3</td></tr><tr><td>📅 오늘의 퀘스트</td><td>${sc2.quest}개 × 1</td></tr><tr><td>🚶 걸은 거리</td><td>${(walkKm().total).toFixed(1)}km → ${sc2.walk}개 (2km마다 1)</td></tr></table></div>
        <div class="box"><b>📅 오늘의 맞춤 퀘스트</b><div class="small muted">아래 「내 관심사」로 고른 것에 맞춰 매일 3개가 바뀌어요.</div>
          ${qs.map(q => { const dn = q.done || !!(s2.quests[today] || {})[q.id]; return `<div class="q"><span>${q.ic}</span><div><div>${esc(q.t)} ${dn ? '<b class="done">✔ 완료 +1</b>' : ''}</div>
            ${dn ? (q.reveal ? `<div class="small">${esc(q.reveal)}</div>` : '') : q.quiz ? `<div class="row">${q.quiz.opts.map(a => `<button class="btn" data-qz="${a}" data-ans="${q.quiz.ans}">${esc(NATION[a] || a)}</button>`).join('')}</div>`
              : q.reveal ? `<div class="row"><button class="btn" data-rv="${q.id}">알아보기</button></div>` : q.manual ? `<div class="row"><button class="btn" data-mn="${q.id}">✔ ${esc(q.manual)}</button></div>` : `<div class="row">${q.act || ''}${q.prog ? `<span class="small muted">${q.prog}</span>` : ''}</div>`}</div></div>`; }).join('')}</div>
        <div class="box"><b>📍 현실 원정 — 내 주변 옛이야기</b>
          <div class="small">버튼을 누를 때만 위치를 <b>한 번</b> 확인해 가까운 옛이야기·섬을 찾아요. 위치 좌표는 저장하지도, 어디로 보내지도 않아요. 도장 받은 이야기 이름만 이 기기에 남아요.</div>
          <div class="row"><button class="btn pri" id="lg-near">📍 지금 위치로 가까운 이야기 찾기</button></div>
          ${near ? `<table>${near.map(n => `<tr><td>${esc(n.ic)} ${esc(n.name)}</td><td>${n.d < 1000 ? Math.round(n.d) + 'm' : (n.d / 1000).toFixed(n.d < 10000 ? 1 : 0) + 'km'}</td><td>${n.l ? (s2.visits[n.l.id] ? '🏅 도장' : n.d <= FIELD_M ? `<button class="btn pri" data-stamp="${esc(n.l.id)}">도장 받기 +3</button>` : '') : ''}</td></tr>`).join('')}</table>` : ''}
          <div class="small muted">다른 앱 사용 기록·방문한 웹사이트·연락처는 읽지 않아요. 웹 앱은 휴대폰이 막아 두어 읽을 수도 없어요.</div></div>
        <div class="box"><b>❤ 내 관심사 (직접 고르기)</b><div class="small muted">고른 것은 이 기기에만 저장되고, 퀘스트·이야기 추천에만 써요.</div>
          <div class="row">${Object.keys(D().REG).map(k => `<button class="chip" data-lk-reg="${k}" aria-pressed="${s2.likes.reg.includes(k)}">${D().REG[k]}</button>`).join('')}</div>
          <div class="row">${TOPICS.map(([k, l]) => `<button class="chip" data-lk-top="${k}" aria-pressed="${s2.likes.top.includes(k)}">${l}</button>`).join('')}</div></div>
        <div class="box"><b>👨‍👩‍👧 친구·가족과 겨루기 (초대 코드)</b>
          <div class="small">서로 코드를 주고받은 사람끼리만 조각 수를 비교해요. 코드에는 <b>별명과 점수만</b> 들어 있고, 위치·연락처는 들어가지 않아요. 서버에 저장하지 않아요.</div>
          <div class="row"><input type="text" id="lg-nick" maxlength="10" placeholder="내 별명 (선택, 10자)" value="${esc(s2.nick)}" style="max-width:220px" aria-label="내 별명"></div>
          <div class="code" id="lg-code">${esc(code)}</div>
          <div class="row"><button class="btn pri" id="lg-share">📤 내 코드 보내기·복사</button><span class="small muted" id="lg-cmsg"></span></div>
          <div class="row"><input type="text" id="lg-fcode" placeholder="받은 코드 붙여넣기 (LG1.로 시작)" aria-label="받은 초대 코드"><label class="small"><input type="checkbox" id="lg-fam"> 가족</label><button class="btn" id="lg-add">추가</button></div>
          <table><tr><th>순위</th><th>별명</th><th>🧩 조각</th><th>📜</th><th>🏅</th><th></th></tr>${board.map((f, i) => `<tr${f.me ? ' style="color:#C9A0FF"' : ''}><td>${i + 1}</td><td>${f.fam ? '👪 ' : ''}${esc(f.n)}</td><td>${f.f}</td><td>${f.r}</td><td>${f.v}</td><td>${f.me ? '' : `<button class="btn" data-del="${esc(f.k)}" aria-label="${esc(f.n)} 지우기">✕</button>`}</td></tr>`).join('')}</table>
          ${fam.length ? `<div class="small">👪 우리 가족 팀 합계: <b>${famSum}</b>개 (나 + 가족 ${fam.length}명)</div>` : ''}
          <div class="small muted">친구 점수는 받은 코드 시점 기준이에요. 새 코드를 다시 붙여넣으면 바뀌어요.</div></div>`;
      b.querySelectorAll('[data-goto-l]').forEach(x => x.onclick = () => { ui.tab = 'cards'; ui.open = x.dataset.gotoL; ui.reg = ''; ui.q = ''; render(); });
      b.querySelectorAll('[data-qz]').forEach(x => x.onclick = () => { if (x.dataset.qz === x.dataset.ans) { questDone('quiz'); msg = '⭕ 정답! 조각 +1'; render(); alertMsg(); } else { x.disabled = true; x.textContent += ' ✕'; } });
      b.querySelectorAll('[data-rv]').forEach(x => x.onclick = () => { questDone(x.dataset.rv); render(); });
      b.querySelectorAll('[data-mn]').forEach(x => x.onclick = () => { questDone(x.dataset.mn); render(); });
      b.querySelector('#lg-near').onclick = e => { e.target.disabled = true; e.target.textContent = '📍 위치 확인 중…'; locate(pos => {
        const P = window.GLOBE_PLACES, isl = P ? (P.ISLAND_FALLBACK || []).concat(P.ISLE_MORE || []).map(x => ({ ic: '🏝', name: x[0], lat: x[1], lon: x[2] })) : [];
        near = D().L.map(l => ({ ic: l.emo, name: l.t, lat: l.lat, lon: l.lon, l })).concat(isl).map(n => Object.assign(n, { d: hav(pos, [n.lat, n.lon]) })).sort((a, c) => a.d - c.d).slice(0, 8);
        const t = dayKey(), s3 = load(); s3.quests[t] = s3.quests[t] || {}; if (!s3.quests[t].visit) { s3.quests[t].visit = 1; save(s3); }
        render(); }, err => { msg = err; render(); alertMsg(); }); };
      b.querySelectorAll('[data-stamp]').forEach(x => x.onclick = () => { stamp(x.dataset.stamp); msg = '🏅 현장 도장을 받았어요! (+3)'; render(); alertMsg(); });
      b.querySelectorAll('[data-lk-reg]').forEach(x => x.onclick = () => { const s3 = load(), k = x.dataset.lkReg; s3.likes.reg = s3.likes.reg.includes(k) ? s3.likes.reg.filter(v => v !== k) : s3.likes.reg.concat(k); save(s3); render(); });
      b.querySelectorAll('[data-lk-top]').forEach(x => x.onclick = () => { const s3 = load(), k = x.dataset.lkTop; s3.likes.top = s3.likes.top.includes(k) ? s3.likes.top.filter(v => v !== k) : s3.likes.top.concat(k); save(s3); render(); });
      const nk = b.querySelector('#lg-nick'); nk.onchange = () => { const s3 = load(); s3.nick = nk.value.replace(/[<>"'&\u0000-\u001f]/g, '').slice(0, 10); save(s3); render(); };
      b.querySelector('#lg-share').onclick = async () => { const c = myCode(load(), score()), m = b.querySelector('#lg-cmsg'), text = `📜 옛이야기 원정 — 내 초대 코드예요. 「조각·현실 원정」에 붙여넣어 주세요.\n${c}`;
        try { if (navigator.share) { await navigator.share({ text }); m.textContent = '보냈어요.'; return; } } catch (e) { if (e && e.name === 'AbortError') return; }
        try { await navigator.clipboard.writeText(c); m.textContent = '코드를 복사했어요. 메신저에 붙여넣어 보내 주세요.'; } catch (e) { m.textContent = '복사가 안 돼요. 위 코드를 길게 눌러 복사해 주세요.'; } };
      b.querySelector('#lg-add').onclick = () => { const f = readCode(b.querySelector('#lg-fcode').value); if (!f) { msg = '코드 모양이 맞지 않아요. LG1. 로 시작하는 코드 전체를 붙여넣어 주세요.'; render(); alertMsg(); return; }
        f.fam = b.querySelector('#lg-fam').checked; const s3 = load(); s3.friends = (s3.friends || []).filter(x => x.k !== f.k); s3.friends.unshift(f); s3.friends = s3.friends.slice(0, 20); save(s3); msg = `「${f.n}」님을 추가했어요.`; render(); alertMsg(); };
      b.querySelectorAll('[data-del]').forEach(x => x.onclick = () => { const s3 = load(); s3.friends = (s3.friends || []).filter(f => f.k !== x.dataset.del); save(s3); render(); });
    }
    render();
  }
  // 초대 코드: LG1.<base64(JSON)> — 별명·점수·고유 표시(무작위)만
  function myId(s) { if (!s.uid) { s.uid = Math.random().toString(36).slice(2, 10); save(s); } return s.uid; }
  function myCode(s, sc) { const o = { k: myId(s), n: s.nick || '이야기꾼', f: sc.frag, r: sc.read, v: sc.visit, e: sc.eps, d: dayKey() }; try { return 'LG1.' + btoa(unescape(encodeURIComponent(JSON.stringify(o)))); } catch (e) { return ''; } }
  function readCode(txt) {
    const m = String(txt || '').trim().match(/LG1\.([A-Za-z0-9+/=]{8,600})/); if (!m) return null;
    try { const o = JSON.parse(decodeURIComponent(escape(atob(m[1])))); const num = v => Math.max(0, Math.min(99999, Math.floor(+v || 0)));
      if (!o || typeof o !== 'object' || typeof o.k !== 'string') return null;
      if (o.k === load().uid) return null;
      return { k: o.k.replace(/[^a-z0-9]/gi, '').slice(0, 12), n: String(o.n || '친구').replace(/[<>"'&\u0000-\u001f]/g, '').slice(0, 10) || '친구', f: num(o.f), r: num(o.r), v: num(o.v), e: num(o.e), d: String(o.d || '').slice(0, 10) };
    } catch (e) { return null; }
  }
  return { view, cardHTML, bindCard, markRead, stamp, score, forIsle, forA3, css, readCode };
})();
