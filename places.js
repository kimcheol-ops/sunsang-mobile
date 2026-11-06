/* PlacesApp — 낚시점 · 선상 정보 화면 (PC 탭 · 휴대폰 앱 · 바다 조황 수첩 공용)
 *  PlacesApp.mount(root, { data, store, map, inPC })
 *   data : window.PLACES_DATA (places-data.js)
 *   store: PlacesApp.localStore()  — 이 기기 저장(PC·휴대폰 앱). data.community(매일 반영된 공유 집계)를 함께 보여 줌
 *          PlacesApp.dbStore(db, uid, canWrite) — 바다 조황 수첩: places/<사용자> 문서에 내 하트·후기·정보 고침·등록, 모두의 것을 합쳐 보여 줌
 *   map  : Leaflet 지도 사용 여부(아티팩트는 외부 타일이 막혀 false)
 *  색은 root 요소의 --pl-* 변수로 바꿀 수 있습니다(없으면 PC 어두운 색).
 */
(function () {
  'use strict';
  const CSS = `
  .pl { --p-bg: var(--pl-bg, #15191E); --p-panel: var(--pl-panel, #1E242B); --p-well: var(--pl-well, #11151A); --p-line: var(--pl-line, #343C45); --p-fg: var(--pl-fg, #E6EAEE);
        --p-muted: var(--pl-muted, #9AA5B1); --p-dim: var(--pl-dim, #6E7A86); --p-accent: var(--pl-accent, #8CC8F2); --p-ok: var(--pl-ok, #6FD3A4); --p-warn: var(--pl-warn, #F5C46B);
        --p-bad: var(--pl-bad, #FF8A8D); --p-heart: var(--pl-heart, #FF6B8A); --p-selbg: var(--pl-selbg, #2E5F86); --p-selfg: var(--pl-selfg, #E6EAEE); --p-btn: var(--pl-btn, #2A3139);
        color: var(--p-fg); display: grid; gap: 10px; font-size: 13.5px; line-height: 1.5; }
  .pl * { box-sizing: border-box; }
  .pl .tabs, .pl .bar, .pl .icons { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  .pl .tab { border: 1px solid var(--p-line); background: var(--p-panel); color: var(--p-muted); border-radius: 8px; padding: 7px 14px; font: 700 13.5px inherit; cursor: pointer; }
  .pl .tab[aria-selected="true"], .pl .chip[aria-pressed="true"] { background: var(--p-selbg); border-color: var(--p-selbg); color: var(--p-selfg); }
  .pl input, .pl select { background: var(--p-well); color: var(--p-fg); border: 1px solid var(--p-line); border-radius: 6px; padding: 6px 9px; font: inherit; min-height: 34px; min-width: 0; }
  .pl input[type=search] { flex: 1 1 200px; }
  .pl .chip { border: 1px solid var(--p-line); background: var(--p-btn); color: var(--p-fg); border-radius: 999px; padding: 3px 11px; font: 600 12px inherit; cursor: pointer; }
  .pl .chip.s { cursor: default; background: var(--p-well); padding: 1px 8px; font-size: 11.5px; }
  .pl .btn { display: inline-flex; align-items: center; min-height: 32px; border-radius: 6px; border: 1px solid var(--p-line); background: var(--p-btn); color: var(--p-fg); font: 600 13px inherit; padding: 0 12px; cursor: pointer; text-decoration: none; }
  .pl .btn.primary { background: var(--p-selbg); border-color: var(--p-selbg); color: var(--p-selfg); }
  .pl .btn.heart[aria-pressed="true"] { border-color: var(--p-heart); color: var(--p-heart); }
  .pl .main { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 440px); gap: 10px; align-items: start; }
  .pl .list { display: grid; gap: 6px; }
  .pl .item { display: grid; grid-template-columns: 1fr auto; gap: 4px 10px; padding: 10px 12px; border-radius: 8px; background: var(--p-panel); border: 1px solid var(--p-line); cursor: pointer; text-align: left; color: inherit; font: inherit; width: 100%; }
  .pl .item:hover, .pl .item:focus-visible { border-color: var(--p-accent); outline: none; } .pl .item.sel { border-color: var(--p-accent); box-shadow: 0 0 0 1px var(--p-accent) inset; }
  .pl .item b { font-size: 14.5px; } .pl .muted { color: var(--p-muted); } .pl .dim { color: var(--p-dim); } .pl .small { font-size: 12px; }
  .pl .score { font: 800 13px Consolas, monospace; padding: 2px 7px; border-radius: 6px; background: var(--p-well); text-align: center; min-width: 46px; }
  .pl .score.hi { color: var(--p-ok); } .pl .score.mid { color: var(--p-warn); }
  .pl .icons { font-size: 12px; color: var(--p-muted); }
  .pl .cap { font: 800 20px Consolas, monospace; color: var(--p-accent); }
  .pl .panel { background: var(--p-panel); border: 1px solid var(--p-line); border-radius: 8px; padding: 12px; display: grid; gap: 10px; position: sticky; top: 8px; min-width: 0; }
  .pl .panel h2 { margin: 0; font-size: 17px; } .pl .panel h3 { margin: 4px 0 0; font-size: 13px; color: var(--p-muted); }
  .pl .kv { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; margin: 0; } .pl .kv dt { color: var(--p-muted); } .pl .kv dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
  .pl .checks { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 5px; }
  .pl .ck { background: var(--p-well); border-radius: 6px; padding: 5px 8px; display: flex; flex-wrap: wrap; gap: 4px 6px; align-items: center; font-size: 12.5px; }
  .pl .ck.yes { color: var(--p-ok); } .pl .ck.no { color: var(--p-bad); } .pl .ck.unk { color: var(--p-dim); }
  .pl .ck select { margin-left: auto; min-height: 26px; padding: 0 4px; font-size: 12px; }
  .pl .mapbox { height: 220px; border-radius: 8px; background: var(--p-well); }
  .pl .sample { background: var(--p-warn); color: #2A2412; border-radius: 4px; padding: 0 6px; font: 700 11px inherit; }
  .pl .notice { background: var(--p-well); border: 1px solid var(--p-line); border-radius: 6px; padding: 7px 10px; font-size: 12px; }
  .pl .rank { display: grid; grid-template-columns: 28px 1fr auto; gap: 8px; align-items: center; padding: 6px 8px; border-radius: 6px; background: var(--p-well); }
  .pl .rank .n { font: 800 15px Consolas, monospace; color: var(--p-warn); text-align: center; }
  .pl .grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 10px; }
  .pl .card { background: var(--p-panel); border: 1px solid var(--p-line); border-radius: 8px; padding: 12px; display: grid; gap: 8px; align-content: start; min-width: 0; }
  .pl .card h2 { margin: 0; font-size: 14px; }
  .pl .empty { border: 1px dashed var(--p-line); border-radius: 8px; padding: 12px; color: var(--p-muted); }
  .pl .form { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; } .pl .form label { display: grid; gap: 3px; font-size: 12px; color: var(--p-muted); } .pl .form .wide { grid-column: 1 / -1; }
  .pl .stars button { background: none; border: 0; font-size: 22px; color: var(--p-dim); cursor: pointer; padding: 0 1px; } .pl .stars button.on { color: var(--p-warn); }
  .pl .rev { background: var(--p-well); border-radius: 6px; padding: 6px 8px; font-size: 12.5px; }
  .pl .shared { color: var(--p-ok); font-weight: 700; }
  .pl table { width: 100%; border-collapse: collapse; font-size: 12.5px; } .pl th { color: var(--p-muted); text-align: left; } .pl td, .pl th { padding: 4px; border-bottom: 1px solid var(--p-line); }
  .pl .darkTiles { filter: invert(1) hue-rotate(180deg) brightness(.8) contrast(.9) saturate(.6); }
  @media (max-width: 860px) { .pl .main { grid-template-columns: 1fr; } .pl .panel { position: static; } }`;

  const RENT = [['rod', '🎣 낚싯대 대여'], ['reel', '🌀 릴 대여'], ['vest', '🦺 구명조끼 대여'], ['icebox', '🧊 아이스박스 대여'], ['rig', '🪝 채비 판매·묶음'], ['bait', '🦐 생미끼 판매'],
    ['ice', '❄ 얼음 판매'], ['repair', '🔧 릴·낚싯대 수리'], ['line', '🧵 원줄 감기'], ['parking', '🅿 주차'], ['toilet', '🚻 화장실'], ['lounge', '🛋 대기실·휴게'], ['booking', '📅 배 예약 대행'], ['open24', '🌙 새벽·24시 영업']];
  const AMEN = [
    ['편의', [['toilet', '🚻 화장실', ['수세식', '간이', '없음']], ['parking', '🅿 주차'], ['kids', '👧 어린이 승선']]],
    ['먹거리 (그냥 주는지)', [['water', '💧 물'], ['drink', '🥤 음료·커피'], ['snack', '🍪 간식·라면'], ['meal', '🍱 식사·도시락']]],
    ['조과 보관', [['bag', '🛍 고기 봉지·망'], ['icebox', '🧊 아이스박스'], ['ice', '❄ 얼음']]],
    ['낚시 도움', [['teach', '👨‍🏫 낚시 방법 설명'], ['rentRod', '🎣 낚싯대 대여'], ['rentReel', '🌀 릴 대여'], ['vest', '🦺 구명조끼'], ['seasick', '💊 멀미약']]],
  ];
  const SEATS = ['추첨', '선착순 승선', '예약 순', '선장 배정', '자유'];
  const SEAT_HELP = { 추첨: '출항 전 제비뽑기로 자리를 정합니다', '선착순 승선': '먼저 배에 오른 사람이 자리를 고릅니다', '예약 순': '먼저 예약한 순서대로 자리를 고릅니다', '선장 배정': '선장님이 경험·채비를 보고 자리를 정합니다', 자유: '정해진 자리 없이 돌아가며 낚시합니다' };
  const SPECIES = ['쭈꾸미', '갑오징어', '우럭', '광어', '참돔', '갈치', '문어', '한치', '무늬오징어', '방어', '감성돔', '농어', '볼락', '삼치', '대구'];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nowIso = () => new Date().toISOString();
  const AMEN_KEYS = AMEN.flatMap(g => g[1].map(a => a[0])), RENT_KEYS = RENT.map(r => r[0]);
  const OK_VALUES = new Set(['yes', 'no', 'unk', '수세식', '간이', '없음']);

  // ── 공유 문서(한 사람 몫) 정리: 화면에 쓰기 전에 모양을 확인합니다(공유 데이터는 믿지 않음) ──
  function cleanDoc(v) {
    const o = { hearts: {}, hits: {}, reviews: {}, edits: {}, added: [] }; if (!v || typeof v !== 'object') return o;
    for (const [id, ts] of Object.entries(v.hearts || {})) if (typeof ts === 'string') o.hearts[id] = ts;
    for (const [id, arr] of Object.entries(v.hits || {})) if (Array.isArray(arr)) o.hits[id] = arr.filter(t => typeof t === 'string').slice(-30);
    for (const [id, r] of Object.entries(v.reviews || {})) if (r && r.stars >= 1 && r.stars <= 5 && typeof r.ts === 'string') o.reviews[id] = { stars: Math.round(r.stars), text: String(r.text || '').slice(0, 120), ts: r.ts };
    for (const [id, e] of Object.entries(v.edits || {})) if (e && typeof e === 'object') {
      const c = { ts: typeof e.ts === 'string' ? e.ts : '' };
      for (const f of ['rent', 'amen']) if (e[f] && typeof e[f] === 'object') { c[f] = {}; for (const [k, val] of Object.entries(e[f])) if (OK_VALUES.has(val) && (RENT_KEYS.includes(k) || AMEN_KEYS.includes(k))) c[f][k] = val; }
      if (SEATS.includes(e.seat)) c.seat = e.seat; if (+e.capacity > 0 && +e.capacity < 100) c.capacity = Math.round(+e.capacity);
      o.edits[id] = c;
    }
    if (Array.isArray(v.added)) o.added = v.added.filter(a => a && typeof a.id === 'string' && ['shop', 'boat', 'event'].includes(a.kind) && typeof a.name === 'string').slice(0, 30)
      .map(a => ({ id: a.id, kind: a.kind, region: String(a.region || ''), name: a.name.slice(0, 40), addr: String(a.addr || '').slice(0, 80), phone: String(a.phone || '').slice(0, 20),
        species: Array.isArray(a.species) ? a.species.map(String).slice(0, 8) : [], note: String(a.note || '').slice(0, 120), channel: a.channel === '온라인' ? '온라인' : '오프라인', web: /^https:\/\//.test(a.web || '') ? String(a.web).slice(0, 120) : '',
        capacity: +a.capacity > 0 && +a.capacity < 100 ? Math.round(+a.capacity) : null, depart: String(a.depart || '').slice(0, 10), fee: String(a.fee || '').slice(0, 30), seat: SEATS.includes(a.seat) ? a.seat : '',
        when: String(a.when || '').slice(0, 10), where: String(a.where || '').slice(0, 40), ts: String(a.ts || '') }));
    return o;
  }
  // 여러 사람 문서 → 화면용 집계 { hearts:{id:[ts]}, hits:{id:[ts]}, reviews:{id:[{stars,text,ts,who}]}, edits:{id:{...최신 우선}}, added:[...] }
  function aggregate(docs, me) {
    const A = { hearts: {}, hits: {}, reviews: {}, edits: {}, added: [], mine: {}, people: docs.length };
    const editTs = {};
    for (const { uid, doc } of docs) {
      for (const [id, ts] of Object.entries(doc.hearts)) { (A.hearts[id] = A.hearts[id] || []).push(ts); if (uid === me) A.mine[id] = true; }
      for (const [id, arr] of Object.entries(doc.hits)) (A.hits[id] = A.hits[id] || []).push(...arr);
      for (const [id, r] of Object.entries(doc.reviews)) (A.reviews[id] = A.reviews[id] || []).push(Object.assign({ who: uid }, r));
      for (const [id, e] of Object.entries(doc.edits)) {   // 같은 칸을 여러 사람이 고쳤으면 가장 최근 것
        const cur = A.edits[id] = A.edits[id] || { rent: {}, amen: {} };
        for (const f of ['rent', 'amen']) for (const [k, v] of Object.entries(e[f] || {})) { const key = id + f + k; if (!editTs[key] || e.ts > editTs[key]) { editTs[key] = e.ts; cur[f][k] = v; } }
        for (const k of ['seat', 'capacity']) if (e[k] != null) { const key = id + k; if (!editTs[key] || e.ts > editTs[key]) { editTs[key] = e.ts; cur[k] = e[k]; } }
      }
      for (const a of doc.added) A.added.push(Object.assign({ by: uid }, a));
    }
    return A;
  }

  // ── 저장소 ① 이 기기(PC·휴대폰 앱): localStorage + places-data.js의 community(매일 반영된 공유 집계) ──
  function localStore(community) {
    const KEY = 'places.v1';
    let L; try { L = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { L = {}; }
    // 예전 형식(hearts:{id:[ts]}) 호환
    const mine = cleanDoc({ hearts: L.myHearts || Object.fromEntries(Object.entries(L.mine || {}).filter(([, on]) => on).map(([id]) => [id, ((L.hearts || {})[id] || []).slice(-1)[0] || nowIso()])),
      hits: L.hits, reviews: L.myReviews || Object.fromEntries(Object.entries(L.reviews || {}).map(([id, arr]) => [id, Array.isArray(arr) ? arr[arr.length - 1] : arr]).filter(([, r]) => r)),
      edits: L.myEdits || Object.fromEntries(Object.entries(L.edits || {}).map(([id, e]) => [id, Object.assign({ ts: nowIso() }, e)])), added: L.added });
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ myHearts: mine.hearts, hits: mine.hits, myReviews: mine.reviews, myEdits: mine.edits, added: mine.added })); } catch (e) {} };
    const C = community || {};
    const commDocs = () => { const out = []; // 공유 집계를 '사람 한 명 몫' 문서들처럼 펼쳐 합침
      const d = { uid: 'community', doc: cleanDoc({ edits: C.edits, added: C.added }) };
      d.doc.hearts = {}; out.push(d);
      return out; };
    let listener = () => {};
    const api = {
      shared: false, canWrite: true, label: '이 기기에 저장' + (C.updated ? ` · 공유 집계 ${C.updated} 반영` : ''),
      view() { const A = aggregate(commDocs().concat([{ uid: 'me', doc: mine }]), 'me');
        for (const [id, n] of Object.entries(C.hearts || {})) { A.hearts[id] = (A.hearts[id] || []).concat(Array.from({ length: Math.min(999, +n || 0) }, () => C.updatedIso || '2000-01-01')); }
        for (const [id, n] of Object.entries(C.hits || {})) { A.hits[id] = (A.hits[id] || []).concat(Array.from({ length: Math.min(9999, +n || 0) }, () => C.updatedIso || '2000-01-01')); }
        for (const [id, arr] of Object.entries(C.reviews || {})) if (Array.isArray(arr)) A.reviews[id] = (A.reviews[id] || []).concat(arr.filter(r => r && r.stars >= 1 && r.stars <= 5).map(r => ({ stars: Math.round(r.stars), text: String(r.text || '').slice(0, 120), ts: String(r.ts || ''), who: 'community' })));
        return A; },
      onChange(fn) { listener = fn; },
      async heart(id, on) { if (on) mine.hearts[id] = nowIso(); else delete mine.hearts[id]; save(); listener(); },
      async hit(id) { const h = mine.hits[id] = mine.hits[id] || []; const last = h[h.length - 1]; if (!last || Date.now() - new Date(last) > 3600000) { h.push(nowIso()); mine.hits[id] = h.slice(-30); save(); } },
      async review(id, stars, text) { mine.reviews[id] = { stars, text, ts: nowIso() }; save(); listener(); },
      async edit(id, patch) { const e = mine.edits[id] = mine.edits[id] || { rent: {}, amen: {} }; for (const f of ['rent', 'amen']) if (patch[f]) e[f] = Object.assign({}, e[f], patch[f]); if ('seat' in patch) e.seat = patch.seat; if ('capacity' in patch) e.capacity = patch.capacity; e.ts = nowIso(); save(); listener(); },
      async add(o) { mine.added.push(Object.assign({ ts: nowIso() }, o)); save(); listener(); },
      async remove(id) { mine.added = mine.added.filter(a => a.id !== id); save(); listener(); },
      myAdded: () => mine.added,
    };
    return api;
  }

  // ── 저장소 ② 공유(바다 조황 수첩): places/<사용자> 문서. 모두 읽고, 자기 문서만 씀 ──
  function dbStore(db, uid, canWrite) {
    let docs = [], mine = cleanDoc(null), listener = () => {}, ready = false, writing = Promise.resolve();
    db.collection('places').onSnapshot(snap => {
      docs = snap.docs.filter(d => d.exists).map(d => ({ uid: d.id, doc: cleanDoc(d.data()) }));
      const me = docs.find(d => d.uid === uid); if (me) mine = me.doc; ready = true; listener();
    }, () => { ready = true; listener(); });
    const write = () => { if (!canWrite || !uid) return Promise.resolve(false);   // 한 문서에 한 번에 한 번만 씀
      writing = writing.then(() => db.doc('places/' + uid).set(mine).then(() => true, () => false)); return writing; };
    return {
      shared: true, canWrite: !!(canWrite && uid), get label() { return ready ? `모두와 공유 · 참여 ${docs.length}명` : '공유 저장소 연결 중…'; },
      view() { const list = docs.filter(d => d.uid !== uid).concat([{ uid, doc: mine }]); return aggregate(list, uid); },
      onChange(fn) { listener = fn; },
      async heart(id, on) { if (on) mine.hearts[id] = nowIso(); else delete mine.hearts[id]; listener(); await write(); },
      async hit(id) { const h = mine.hits[id] = mine.hits[id] || []; const last = h[h.length - 1]; if (!last || Date.now() - new Date(last) > 3600000) { h.push(nowIso()); mine.hits[id] = h.slice(-30); await write(); } },
      async review(id, stars, text) { mine.reviews[id] = { stars, text, ts: nowIso() }; listener(); await write(); },
      async edit(id, patch) { const e = mine.edits[id] = mine.edits[id] || { rent: {}, amen: {} }; for (const f of ['rent', 'amen']) if (patch[f]) e[f] = Object.assign({}, e[f], patch[f]); if ('seat' in patch) e.seat = patch.seat; if ('capacity' in patch) e.capacity = patch.capacity; e.ts = nowIso(); listener(); await write(); },
      async add(o) { mine.added.push(Object.assign({ ts: nowIso() }, o)); mine.added = mine.added.slice(-30); listener(); await write(); },
      async remove(id) { mine.added = mine.added.filter(a => a.id !== id); listener(); await write(); },
      myAdded: () => mine.added,
    };
  }

  function mount(root, opts) {
    const D = opts.data, store = opts.store, useMap = opts.map !== false && !!window.L, inPC = !!opts.inPC;
    if (!document.getElementById('pl-css')) { const s = document.createElement('style'); s.id = 'pl-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.classList.add('pl');
    root.innerHTML = `<div class="tabs" role="tablist">
        <button class="tab" role="tab" data-tab="shop">🏪 낚시점</button><button class="tab" role="tab" data-tab="boat">🚤 선상 정보</button>
        <button class="tab" role="tab" data-tab="rank">🏆 랭킹 · 이벤트</button><button class="tab" role="tab" data-tab="add">＋ 등록 · 정보 고치기</button></div>
      <div data-r="filters" class="bar"></div><div data-r="view"></div><div class="dim small" data-r="foot"></div>`;
    const R = n => root.querySelector(`[data-r="${n}"]`);
    const $ = id => root.querySelector('#pl-' + id);
    let V = store.view();
    const st = { tab: 'shop', q: '', region: '전체', sea: '전체', sp: '전체', channel: '전체', sel: null, period: 'week', addKind: 'shop' };
    try { Object.assign(st, JSON.parse(localStorage.getItem('places.ui') || '{}'), { sel: null, q: '' }); } catch (e) {}
    const saveUi = () => { try { localStorage.setItem('places.ui', JSON.stringify({ tab: st.tab, region: st.region, sea: st.sea, period: st.period })); } catch (e) {} };

    const regionInfo = name => D.regions[name] || ['', '', 36, 127.5, ''];
    function all(kind) {
      const base = D[kind === 'shop' ? 'shops' : 'boats'];
      const added = V.added.filter(a => a.kind === kind).map(a => { const r = regionInfo(a.region);
        return Object.assign({ prov: r[0], sea: r[1], port: r[4], lat: r[2], lon: r[3], approx: true, src: '이용자 등록', rent: {}, amen: {} }, a); });
      return base.concat(added).map(x => { const e = V.edits[x.id]; if (!e) return x;
        return Object.assign({}, x, { rent: Object.assign({}, x.rent, e.rent), amen: Object.assign({}, x.amen, e.amen), edited: true },
          e.seat ? { seat: e.seat } : {}, e.capacity ? { capacity: e.capacity } : {}); });
    }
    const val = (x, k) => ((x.kind === 'shop' ? x.rent : x.amen) || {})[k] || 'unk';
    const isYes = v => v === 'yes' || v === '수세식' || v === '간이';
    const mark = v => isYes(v) ? '✅' : v === 'no' || v === '없음' ? '❌' : '❔';
    const cls = v => isYes(v) ? 'yes' : v === 'no' || v === '없음' ? 'no' : 'unk';
    function score(x) {   // 우수 점수(0~100) = 정보 충실도 40 + 후기 별점 40 + 하트 20
      const keys = x.kind === 'shop' ? RENT_KEYS : AMEN_KEYS;
      const filled = keys.filter(k => val(x, k) !== 'unk').length + (x.species && x.species.length ? 1 : 0) + (x.phone ? 1 : 0) + (x.kind === 'boat' ? (x.capacity ? 1 : 0) + (x.seat ? 1 : 0) : 0);
      const info = Math.round(40 * filled / (keys.length + (x.kind === 'boat' ? 4 : 2)));
      const rv = V.reviews[x.id] || [], avg = rv.length ? rv.reduce((a, r) => a + r.stars, 0) / rv.length : 0, hearts = (V.hearts[x.id] || []).length;
      return { total: info + Math.round(avg * 8) + Math.min(20, hearts * 4), info, avg, n: rv.length, hearts, hits: (V.hits[x.id] || []).length };
    }
    const scoreCls = s => s >= 60 ? 'hi' : s >= 30 ? 'mid' : '';
    const link = (url, label, extra = '') => `<a class="btn" href="${esc(url)}" target="_blank" rel="noopener" ${extra}>${label}</a>`;

    function filters() {
      if (st.tab === 'rank') { R('filters').innerHTML = ['day', 'week', 'month', 'year'].map(p => `<button class="chip" data-period="${p}" aria-pressed="${st.period === p}">${{ day: '오늘', week: '이번 주', month: '이번 달', year: '올해' }[p]}</button>`).join(''); return; }
      if (st.tab === 'add') { R('filters').innerHTML = ''; return; }
      R('filters').innerHTML = `<input type="search" id="pl-q" placeholder="${st.tab === 'shop' ? '낚시점 이름·주소·대여 품목' : '배 이름·항구·어종'} 검색" value="${esc(st.q)}" aria-label="검색">
        <select id="pl-region" aria-label="지역">${['전체', ...Object.keys(D.regions)].map(r => `<option ${r === st.region ? 'selected' : ''}>${r}</option>`).join('')}</select>
        ${['전체', '서해', '남해', '동해', '제주'].map(s => `<button class="chip" data-sea="${s}" aria-pressed="${st.sea === s}">${s}</button>`).join('')}
        <select id="pl-sp" aria-label="종목">${['전체', ...SPECIES].map(s => `<option value="${s}" ${s === st.sp ? 'selected' : ''}>${s === '전체' ? '모든 종목' : s}</option>`).join('')}</select>
        ${st.tab === 'shop' ? ['전체', '오프라인', '온라인'].map(c => `<button class="chip" data-ch="${c}" aria-pressed="${st.channel === c}">${c === '전체' ? '온·오프라인' : c}</button>`).join('') : ''}`;
      $('q').oninput = e => { st.q = e.target.value; body(); };
      $('region').onchange = e => { st.region = e.target.value; saveUi(); render(); };
      $('sp').onchange = e => { st.sp = e.target.value; render(); };
    }
    function filtered(kind) {
      const q = st.q.trim().toLowerCase();
      return all(kind).filter(x => (st.region === '전체' || x.region === st.region) && (st.sea === '전체' || x.sea === st.sea)
        && (st.sp === '전체' || (x.species || []).includes(st.sp)) && (kind !== 'shop' || st.channel === '전체' || (x.channel || '오프라인') === st.channel)
        && (!q || [x.name, x.addr, x.port, x.region, (x.species || []).join(' '), x.note, kind === 'shop' ? RENT.filter(r => isYes(val(x, r[0]))).map(r => r[1]).join(' ') : ''].join(' ').toLowerCase().includes(q)))
        .map(x => ({ x, s: score(x) })).sort((a, b) => (a.x.sample ? 1 : 0) - (b.x.sample ? 1 : 0) || b.s.total - a.s.total || a.x.region.localeCompare(b.x.region));
    }
    function itemHtml(x, s) {
      const rv = s.n ? ` · ★${s.avg.toFixed(1)}(${s.n})` : '';
      if (x.kind === 'shop') { const yes = RENT.filter(r => isYes(val(x, r[0]))).map(r => r[1].split(' ')[0]);
        return `<button class="item${st.sel === x.id ? ' sel' : ''}" data-id="${esc(x.id)}"><span><b>${esc(x.name)}</b> ${x.channel === '온라인' ? '<span class="chip s">온라인</span>' : ''}${x.edited ? ' <span class="chip s">정보 고침</span>' : ''}${x.src === '이용자 등록' ? ' <span class="chip s">이용자 등록</span>' : ''}</span>
          <span class="score ${scoreCls(s.total)}">${s.total}</span><span class="small muted">${esc(x.region)} · ${esc(x.addr)}</span><span class="small" style="color:var(--p-heart)">❤ ${s.hearts}</span>
          <span class="icons">${yes.length ? '대여·서비스 ' + yes.join(' ') : '대여 품목 미확인'}${rv}</span><span class="small dim">조회 ${s.hits}</span></button>`; }
      return `<button class="item${st.sel === x.id ? ' sel' : ''}" data-id="${esc(x.id)}"><span><b>${esc(x.name)}</b> ${x.sample ? '<span class="sample">예시</span>' : ''}${x.src === '이용자 등록' ? ' <span class="chip s">이용자 등록</span>' : ''}</span>
        <span style="text-align:right"><span class="cap">${x.capacity ? x.capacity + '명' : '정원 ?'}</span></span>
        <span class="small muted">${esc(x.region)} ${esc(x.port)} · ${esc((x.species || []).join('·') || '종목 미확인')} · 자리: ${esc(x.seat || '미확인')}</span><span class="score ${scoreCls(s.total)}">${s.total}</span>
        <span class="icons">${[['toilet', '🚻'], ['water', '💧'], ['snack', '🍪'], ['bag', '🛍'], ['teach', '👨‍🏫']].map(([k, i]) => i + mark(val(x, k))).join(' ')}${rv}</span><span class="small" style="color:var(--p-heart)">❤ ${s.hearts}</span></button>`;
    }
    function guideHtml(kind) {
      return (kind === 'shop'
        ? `<h2>🏪 전국 낚시점</h2><div class="muted">왼쪽에서 낚시점을 고르면 대여 품목·서비스, 후기, 길찾기가 나옵니다.</div>
           <div class="notice">우수 점수 = 정보 충실도 40 + 후기 별점 40 + 하트 20. 점주·이용자가 대여 품목을 채울수록 점수가 오릅니다.</div>
           <div class="small dim">기본 자료: 카카오맵 '낚시용품' 업체 ${D.shops.length}곳(${Object.keys(D.regions).length}개 지역, ${esc(D.collectedAt)} 수집). 전화번호·영업시간은 카카오맵 링크에서 확인하세요.</div>`
        : `<h2>🚤 선상 정보</h2><div class="muted">배를 고르면 <b>정원, 배 위치, 화장실, 간식·음료, 고기 봉지, 낚시 설명, 자리 정하는 방식</b>까지 한눈에 봅니다.</div>
           <div class="notice">‘예시’ 배는 칸이 다 채워지면 어떻게 보이는지 보여 주는 견본입니다. 실제 배의 편의 정보는 선장님·승선객이 채웁니다.</div>
           <div class="small dim">기본 자료: 카카오맵 '낚시' 업체 ${D.boats.filter(b => !b.sample).length}곳.</div>`)
        + `<div class="small ${store.shared ? 'shared' : 'dim'}">${store.shared ? '🌐 ' : '💾 '}${esc(store.label)}</div>`;
    }
    function detailHtml(x, s) {
      const mineH = !!V.mine[x.id], ro = !store.canWrite;
      const links = `<div class="bar"><button class="btn heart" id="pl-heart" aria-pressed="${mineH}" ${ro ? 'disabled' : ''}>❤ 하트 ${s.hearts}</button>
        ${x.kakao ? link(x.kakao, '카카오맵 · 전화번호') : ''}${link(`https://map.kakao.com/link/to/${encodeURIComponent(x.name)},${x.lat.toFixed(5)},${x.lon.toFixed(5)}`, '길찾기')}
        ${link(`https://search.naver.com/search.naver?query=${encodeURIComponent(x.name + ' ' + x.region)}`, '후기 검색')}${x.web ? link(x.web, '홈페이지') : ''}</div>`;
      const head = `<h2>${esc(x.name)} ${x.sample ? '<span class="sample">예시</span>' : ''}</h2>
        <div class="bar"><span class="score ${scoreCls(s.total)}">우수 점수 ${s.total}</span><span class="small muted">정보 ${s.info}/40 · 별점 ${s.n ? s.avg.toFixed(1) : '—'} · 조회 ${s.hits}</span></div>`;
      const rv = (V.reviews[x.id] || []).slice().sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 6);
      const review = `<h3>후기 ${store.shared ? '<span class="small shared">모두에게 보임</span>' : ''}</h3>${rv.map(r => `<div class="rev">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)} <span class="dim">${esc(r.ts.slice(0, 10))}</span>${r.text ? '<br>' + esc(r.text) : ''}</div>`).join('') || '<div class="small dim">아직 후기가 없습니다.</div>'}
        ${ro ? '<div class="small dim">보기 전용 — 후기·하트를 남기려면 참여 권한이 필요합니다.</div>' : `<div class="stars">${[1, 2, 3, 4, 5].map(n => `<button data-star="${n}" aria-label="별 ${n}개">★</button>`).join('')}</div>
        <div class="bar"><input id="pl-revText" placeholder="한 줄 후기 (예: 사장님이 채비 친절히 알려 줌)" maxlength="120" style="flex:1"><button class="btn primary" id="pl-revSave">후기 남기기</button></div>
        <div class="small dim">한 곳에 한 사람당 후기 하나(다시 쓰면 바뀜).</div>`}`;
      const sel = (k, label, v, opts) => ro ? '' : opts
        ? `<select data-edit="${k}" aria-label="${label}"><option value="unk">?</option>${opts.map(o => `<option ${v === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`
        : `<select data-edit="${k}" aria-label="${label}"><option value="unk">?</option><option value="yes" ${v === 'yes' ? 'selected' : ''}>${x.kind === 'shop' ? '가능' : '있음·무료'}</option><option value="no" ${v === 'no' ? 'selected' : ''}>${x.kind === 'shop' ? '없음' : '없음·지참'}</option></select>`;
      const miniMap = useMap ? `<div id="pl-mini" class="mapbox"></div>` : '';
      if (x.kind === 'shop') return head + `<dl class="kv"><dt>지역</dt><dd>${esc(x.prov)} ${esc(x.region)} (${esc(x.sea)})</dd><dt>주소</dt><dd>${esc(x.addr)}</dd><dt>구분</dt><dd>${esc(x.channel || '오프라인')}</dd>
          <dt>종목</dt><dd>${esc((x.species || []).join(', ')) || '<span class="dim">미확인</span>'}</dd><dt>연락처</dt><dd>${x.phone ? esc(x.phone) : '<span class="dim">카카오맵에서 확인</span>'}</dd></dl>${links}
        <h3>대여 · 서비스 <span class="dim small">(❔ 미확인 — 직접 확인하면 바꿔 주세요)</span></h3>
        <div class="checks">${RENT.map(([k, label]) => `<div class="ck ${cls(val(x, k))}">${mark(val(x, k))} ${label}${sel(k, label, val(x, k))}</div>`).join('')}</div>
        ${miniMap}${review}<div class="small dim">출처: ${esc(x.src || '직접 등록')} · 위치 ${x.approx ? '항구 기준 대략' : '등록 좌표'}</div>`;
      const amen = AMEN.map(([g, items]) => `<h3>${g}</h3><div class="checks">${items.map(([k, label, opts]) => { const v = val(x, k);
        return `<div class="ck ${cls(v)}">${mark(v)} ${label}${opts && isYes(v) ? ` <span class="small">(${esc(v)})</span>` : ''}${sel(k, label, v, opts)}</div>`; }).join('')}</div>`).join('');
      return head + `<dl class="kv"><dt>정원</dt><dd><span class="cap">${x.capacity ? x.capacity + '명' : '?'}</span> ${ro ? '' : `<input id="pl-cap" type="number" min="1" max="99" value="${x.capacity || ''}" placeholder="정원" style="width:80px" aria-label="정원 고치기">`}</dd>
          <dt>지역·항구</dt><dd>${esc(x.prov)} ${esc(x.region)} · ${esc(x.port)}</dd><dt>주소</dt><dd>${esc(x.addr)}</dd><dt>종목</dt><dd>${esc((x.species || []).join(', ')) || '<span class="dim">미확인</span>'}</dd>
          <dt>출항·선비</dt><dd>${esc(x.depart || '—')} · ${esc(x.fee || '—')}</dd><dt>연락처</dt><dd>${x.phone ? esc(x.phone) : '<span class="dim">카카오맵에서 확인</span>'}</dd></dl>
        <h3>⚓ 배 위치 (승선 장소)</h3>${miniMap}<div class="small dim">${x.approx ? '항구 기준 대략 위치입니다. 선장님이 승선 위치를 알려 주면 정확해집니다.' : `${x.lat.toFixed(5)}, ${x.lon.toFixed(5)}`}</div>${links}
        <h3>🪑 자리 정하는 방식</h3><div class="bar">${SEATS.map(s2 => `<button class="chip" data-seat="${s2}" aria-pressed="${x.seat === s2}" ${ro ? 'disabled' : ''}>${s2}</button>`).join('')}</div>
        <div class="small">${x.seat ? `<b>${esc(x.seat)}</b> — ${SEAT_HELP[x.seat]}${x.seatNote ? `<br>${esc(x.seatNote)}` : ''}` : '<span class="dim">미확인 — 승선해 보셨다면 골라 주세요.</span>'}</div>
        ${amen}${x.note ? `<div class="notice">${esc(x.note)}</div>` : ''}${review}`;
    }
    function bindDetail(x) {
      if (!x) return;
      if ($('heart')) $('heart').onclick = () => store.heart(x.id, !V.mine[x.id]);
      let stars = 0;
      root.querySelectorAll('[data-star]').forEach(b => b.onclick = () => { stars = +b.dataset.star; root.querySelectorAll('[data-star]').forEach(c => c.classList.toggle('on', +c.dataset.star <= stars)); });
      if ($('revSave')) $('revSave').onclick = () => { if (!stars) { $('revText').placeholder = '먼저 별점을 눌러 주세요'; return; } store.review(x.id, stars, $('revText').value.trim().slice(0, 120)); };
      const field = x.kind === 'shop' ? 'rent' : 'amen';
      root.querySelectorAll('[data-edit]').forEach(s => s.onchange = () => store.edit(x.id, { [field]: { [s.dataset.edit]: s.value } }));
      root.querySelectorAll('[data-seat]').forEach(b => b.onclick = () => store.edit(x.id, { seat: b.dataset.seat }));
      if ($('cap')) $('cap').onchange = e => store.edit(x.id, { capacity: Math.max(0, Math.min(99, Math.round(+e.target.value) || 0)) || null });
      if (useMap && $('mini')) { const m = L.map($('mini'), { zoomControl: false, attributionControl: false }).setView([x.lat, x.lon], x.approx ? 14 : 16);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { className: 'darkTiles' }).addTo(m); L.marker([x.lat, x.lon]).addTo(m); }
    }
    function listView(kind) {
      const rows = filtered(kind), sel = rows.find(r => r.x.id === st.sel) || null;
      R('view').innerHTML = `<div class="main"><div style="display:grid;gap:8px;min-width:0">
          <div class="small muted">${rows.length}곳 · 점수순${useMap ? ' · 지도는 항구 기준 대략 위치' : ''}</div>
          ${kind === 'shop' && st.channel !== '오프라인' ? `<div class="notice">🌐 온라인 판매처는 PC 「장비·용품」 탭의 제품 검색과 연결됩니다. 자주 쓰는 온라인몰은 ＋등록에서 '온라인'으로 추가하세요. ${link('https://search.shopping.naver.com/search/all?query=' + encodeURIComponent('바다낚시용품'), '네이버 쇼핑 판매처 보기')}</div>` : ''}
          ${useMap ? '<div id="pl-map" class="mapbox"></div>' : ''}
          <div class="list">${rows.map(({ x, s }) => itemHtml(x, s)).join('') || '<div class="empty">조건에 맞는 곳이 없습니다. 검색어나 지역을 바꿔 보세요.</div>'}</div></div>
        <div class="panel" id="pl-detail">${sel ? detailHtml(sel.x, sel.s) : guideHtml(kind)}</div></div>`;
      root.querySelectorAll('[data-id]').forEach(b => b.onclick = () => select(b.dataset.id));
      bindDetail(sel && sel.x);
      if (useMap && $('map')) { const map = L.map($('map')).setView([35.9, 127.8], 6);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, className: 'darkTiles', attribution: '© OpenStreetMap' }).addTo(map);
        const pts = rows.map(({ x, s }) => L.circleMarker([x.lat, x.lon], { radius: x.id === st.sel ? 9 : 6, color: '#0B1A1F', weight: 1.5, fillColor: x.kind === 'shop' ? '#8CC8F2' : '#F5C46B', fillOpacity: .95 })
          .bindTooltip(`${x.name} · ${s.total}`).on('click', () => select(x.id)).addTo(map));
        if (sel) map.setView([sel.x.lat, sel.x.lon], 13); else if (pts.length && st.region !== '전체') map.fitBounds(L.featureGroup(pts).getBounds().pad(.3)); }
    }
    function select(id) { st.sel = id; store.hit(id); body(); if (innerWidth < 860 && $('detail')) $('detail').scrollIntoView({ behavior: 'smooth' }); }

    function since(p) { const d = new Date(); d.setHours(0, 0, 0, 0); if (p === 'week') d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); if (p === 'month') d.setDate(1); if (p === 'year') d.setMonth(0, 1); return d; }
    function rankView() {
      const from = since(st.period), inP = ts => new Date(ts) >= from;
      const pts = x => { const h = (V.hearts[x.id] || []).filter(inP).length, v = (V.hits[x.id] || []).filter(inP).length, r = (V.reviews[x.id] || []).filter(o => inP(o.ts));
        return { h, v, r: r.length, avg: r.length ? r.reduce((a, o) => a + o.stars, 0) / r.length : 0, p: h * 5 + v + r.reduce((a, o) => a + o.stars, 0) * 2 }; };
      const top = kind => all(kind).filter(x => !x.sample).map(x => ({ x, ...pts(x) })).filter(o => o.p > 0).sort((a, b) => b.p - a.p).slice(0, 10);
      const pl = { day: '오늘', week: '이번 주', month: '이번 달', year: '올해' }[st.period];
      const list = (rows, what) => rows.length ? rows.map((o, i) => `<div class="rank"><span class="n">${i + 1}</span><span><b>${esc(o.x.name)}</b><br><span class="small muted">${esc(o.x.region)} · ❤${o.h} · 조회 ${o.v}${o.r ? ` · ★${o.avg.toFixed(1)}` : ''}</span></span><span class="score hi">${o.p}점</span></div>`).join('')
        : `<div class="empty">${pl} 기록이 아직 없습니다. ${what} 둘러보고 ❤하트·후기를 남기면 순위가 생깁니다.</div>`;
      const byRegion = Object.keys(D.regions).map(r => { const rows = all('shop').concat(all('boat')).filter(x => x.region === r && !x.sample).map(x => ({ x, ...pts(x) }));
        const hh = rows.slice().sort((a, b) => b.h - a.h)[0], hv = rows.slice().sort((a, b) => b.v - a.v)[0];
        return `<tr><td>${esc(r)}</td><td>${hh && hh.h ? `❤ ${esc(hh.x.name)} (${hh.h})` : '<span class="dim">—</span>'}</td><td>${hv && hv.v ? `🔥 ${esc(hv.x.name)} (${hv.v})` : '<span class="dim">—</span>'}</td></tr>`; }).join('');
      R('view').innerHTML = `<div class="small ${store.shared ? 'shared' : 'dim'}" style="margin-bottom:8px">${store.shared ? '🌐 ' : '💾 '}${esc(store.label)}</div><div class="grid2">
        <div class="card"><h2>🏆 ${pl} 최고의 낚시점</h2>${list(top('shop'), '낚시점을')}</div>
        <div class="card"><h2>🚤 ${pl} 최고의 선상</h2>${list(top('boat'), '선상 정보를')}</div>
        <div class="card" style="grid-column:1/-1"><h2>📍 지역별 하트 · 히트 1위 <span class="small muted">(${pl})</span></h2><div style="overflow-x:auto"><table><thead><tr><th>지역</th><th>하트 1위</th><th>히트(조회) 1위</th></tr></thead><tbody>${byRegion}</tbody></table></div></div>
        <div class="card"><h2>🎉 이달의 우수 낚시점 이벤트</h2><div class="small">매달 말일, 지역마다 <b>우수 점수</b>가 가장 높은 낚시점과 선상을 '이달의 우수점'으로 뽑아 「오늘의 바다 소식」에 홍보합니다.</div>
          <div class="notice">우수 점수 = 정보 충실도 40 + 후기 별점 40 + 하트 20<br>랭킹 점수 = 하트 5점 + 조회 1점 + 후기 별 하나당 2점</div></div>
        <div class="card"><h2>📝 점주 · 선장님께</h2><div class="small">대여 품목, 정원, 승선 위치, 화장실, 간식·음료, 자리 정하는 방식을 채우면 정보 충실도 점수(최대 40점)가 바로 오릅니다.</div></div></div>`;
    }
    function addView() {
      const k = st.addKind, regions = Object.keys(D.regions), mine = store.myAdded();
      R('view').innerHTML = `<div class="card">${store.canWrite ? '' : '<div class="notice">보기 전용입니다. 등록하려면 참여 권한이 필요합니다.</div>'}
        <div class="bar">${[['shop', '🏪 낚시점'], ['boat', '🚤 선상(배)'], ['event', '🏆 대회·이벤트']].map(([kk, l]) => `<button class="chip" data-kind="${kk}" aria-pressed="${k === kk}">${l}</button>`).join('')}</div>
        <form id="pl-form" class="form">
          <label>이름<input id="pl-fName" required maxlength="40" placeholder="${k === 'event' ? '예: 제1회 보령 쭈꾸미 선상대회' : k === 'boat' ? '예: OO호' : '예: OO낚시'}"></label>
          <label>지역<select id="pl-fRegion">${regions.map(r => `<option>${esc(r)}</option>`).join('')}</select></label>
          ${k === 'shop' ? `<label>구분<select id="pl-fCh"><option>오프라인</option><option>온라인</option></select></label><label>홈페이지(https)<input id="pl-fWeb" placeholder="https://"></label>` : ''}
          ${k === 'boat' ? `<label>정원(명)<input id="pl-fCap" type="number" min="1" max="99"></label><label>출항 시각<input id="pl-fDep" placeholder="05:30"></label><label>선비<input id="pl-fFee" placeholder="1인 9만원"></label>
            <label>자리 정하는 방식<select id="pl-fSeat"><option value="">미확인</option>${SEATS.map(s => `<option>${s}</option>`).join('')}</select></label>` : ''}
          ${k === 'event' ? `<label>날짜<input id="pl-fWhen" type="date"></label><label>장소<input id="pl-fWhere" placeholder="오천항"></label>` : ''}
          <label class="wide">주소<input id="pl-fAddr" maxlength="80"></label><label>연락처(업체 대표번호)<input id="pl-fPhone" maxlength="20"></label>
          <label>종목(쉼표로)<input id="pl-fSp" placeholder="쭈꾸미, 갑오징어"></label><label class="wide">메모<input id="pl-fNote" maxlength="120"></label>
          <div class="wide bar"><button class="btn primary" type="submit" ${store.canWrite ? '' : 'disabled'}>등록</button><span class="small muted" id="pl-msg">${store.shared ? '등록하면 조황 수첩을 쓰는 모두에게 보입니다.' : '이 기기에 저장됩니다.'} 대여·편의 항목은 등록 뒤 상세 화면에서 고르면 됩니다.</span></div>
        </form></div>
        <div class="card" style="margin-top:10px"><h2>내가 등록한 곳 (${mine.length})</h2>${mine.map(a => `<div class="rank"><span class="n">${{ shop: '🏪', boat: '🚤', event: '🏆' }[a.kind]}</span><span><b>${esc(a.name)}</b><br><span class="small muted">${esc(a.region)} · ${esc(a.addr || a.where || '')}${a.when ? ' · ' + esc(a.when) : ''}</span></span><button class="btn" data-del="${esc(a.id)}">삭제</button></div>`).join('') || '<div class="small dim">아직 없습니다.</div>'}
          <div class="small dim">대회·이벤트는 「오늘의 바다 소식」 대회 칸에 쓰일 수 있도록 매일 콘텐츠 작업 때 확인합니다.</div></div>`;
      root.querySelectorAll('[data-kind]').forEach(b => b.onclick = () => { st.addKind = b.dataset.kind; addView(); });
      root.querySelectorAll('[data-del]').forEach(b => b.onclick = () => store.remove(b.dataset.del));
      $('form').onsubmit = e => { e.preventDefault(); const g = id => ($(id) ? $(id).value.trim() : '');
        const o = { id: `${k}-u${Date.now().toString(36)}`, kind: k, region: g('fRegion'), name: g('fName'), addr: g('fAddr'), phone: g('fPhone'), species: g('fSp').split(/[,·\s]+/).filter(Boolean).slice(0, 8), note: g('fNote') };
        if (k === 'shop') Object.assign(o, { channel: g('fCh') || '오프라인', web: /^https:\/\//.test(g('fWeb')) ? g('fWeb') : '' });
        if (k === 'boat') Object.assign(o, { capacity: +g('fCap') || null, depart: g('fDep'), fee: g('fFee'), seat: g('fSeat') });
        if (k === 'event') Object.assign(o, { when: g('fWhen'), where: g('fWhere') });
        if (!o.name) return; store.add(o).then(() => { if (k !== 'event') { st.tab = k; st.sel = o.id; render(); } else if ($('msg')) $('msg').textContent = '등록했습니다.'; }); };
    }
    function body() { if (st.tab === 'shop' || st.tab === 'boat') listView(st.tab); else if (st.tab === 'rank') rankView(); else addView(); bindChips(); }
    function bindChips() {
      root.querySelectorAll('[data-sea]').forEach(b => b.onclick = () => { st.sea = b.dataset.sea; saveUi(); render(); });
      root.querySelectorAll('[data-ch]').forEach(b => b.onclick = () => { st.channel = b.dataset.ch; render(); });
      root.querySelectorAll('[data-period]').forEach(b => b.onclick = () => { st.period = b.dataset.period; saveUi(); render(); });
    }
    function render() {
      root.querySelectorAll('.tab').forEach(t => t.setAttribute('aria-selected', t.dataset.tab === st.tab));
      filters(); body();
      R('foot').textContent = `업체 기본 정보: 카카오맵${useMap ? ' · 지도: OpenStreetMap' : ''} · 하트·후기·정보 고침: ${store.label} · 실제 이용 전 업체에 확인하세요.`;
    }
    root.querySelectorAll('.tab').forEach(t => t.onclick = () => { st.tab = t.dataset.tab; st.sel = null; saveUi(); render(); });
    // PC(WebView2): 링크는 기본 브라우저로
    if (inPC) root.addEventListener('click', e => { const a = e.target.closest('a[href^="https://"]'); if (a) { e.preventDefault(); try { window.chrome.webview.postMessage({ type: 'open', url: a.href }); } catch (x) {} } });
    store.onChange(() => { V = store.view(); const ae = document.activeElement; if (ae && ae.id === 'pl-revText' && ae.value) return; body(); R('foot') && null; });
    const h = location.hash.slice(1); if (['shop', 'boat', 'rank', 'add'].includes(h)) st.tab = h;
    render();
    return { open(t) { st.tab = t === 'event' ? 'add' : t; if (t === 'event') st.addKind = 'event'; render(); }, refresh() { V = store.view(); render(); } };
  }

  window.PlacesApp = { mount, localStore, dbStore, aggregate, cleanDoc };
})();
