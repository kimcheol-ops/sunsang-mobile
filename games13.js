/* 🚢 선상 하루 4종 — 사용자 요청(2026-11-17 「실제 선상낚시 행동(콩콩·스테이·챔질·에기 교체·단차·수심 체크 후 다시 내리기),
 *   잡은 고기 집에 가져가기 정리, 집에서 어종별 손질, 요리 게임」)
 * (PC · 휴대폰 앱 · 조황 수첩 공용, games3.js(GameHub) 뒤에 로드)
 * DayGames.extra(onReward) → 게임 메뉴 항목. 끝나면 onReward({ game, score, coins })
 * ① 🎣 실전 선상 요령 → ② 🧊 쿨러 정리(방생·피 빼기·얼음) → ③ 🔪 어종별 손질 → ④ 🍳 요리 — 앞 게임에서 잡은·챙긴 고기가 다음 게임으로 이어짐
 * 저장: localStorage 'game.day.catch'(잡은 것) · 'game.day.cooler'(가져온 것) · 'game.day.clean'(손질한 것). 결제·광고 없음, 상표 없음.
 * 금지체장·금어기는 도감(sea-data.js)과 같은 값. 실제 기준은 해양수산부 고시를 확인.
 */
(function () {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sfx = k => window.GameHub && GameHub.sfx && GameHub.sfx(k);
  const buzz = k => { try { window.PhoneKit && PhoneKit.buzz && PhoneKit.buzz(k); } catch (e) {} };
  const BTN = 'min-height:48px;border:0;border-radius:12px;font:700 15px inherit;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none';
  const PRIMARY = BTN + ';background:#E2572B;color:#fff', SOFT = BTN + ';background:#2A4650;color:#E3EEF0', OK = BTN + ';background:#2E7D5B;color:#fff';
  const CARD = 'padding:10px 12px;border-radius:12px;background:var(--sea-soft,#1F3A50);line-height:1.55';
  const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)], clamp = (v, a, b) => Math.max(a, Math.min(b, v)), inR = (v, a, b) => v >= a && v <= b;
  const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);

  // 어종 — min: 금지체장(cm, 이하 방생), closed: 금어기 [시작월,일,끝월,일]
  const FISH = {
    jju: { n: '쭈꾸미', ic: '🐙', ceph: true, len: [8, 20], min: 0, closed: [5, 11, 8, 31] },
    gap: { n: '갑오징어', ic: '🦑', ceph: true, len: [12, 28], min: 0 },
    flat: { n: '광어(넙치)', ic: '🐟', len: [28, 62], min: 35 },
    rock: { n: '우럭(조피볼락)', ic: '🐟', len: [17, 46], min: 23 },
    bream: { n: '참돔', ic: '🐠', len: [20, 60], min: 24 },
  };
  const isClosed = (f, d = new Date()) => { if (!f.closed) return false; const v = (d.getMonth() + 1) * 100 + d.getDate(), a = f.closed[0] * 100 + f.closed[1], b = f.closed[2] * 100 + f.closed[3]; return a <= b ? v >= a && v <= b : v >= a || v <= b; };
  const SAMPLE = () => [{ sp: 'rock', len: 21 }, { sp: 'rock', len: 33 }, { sp: 'flat', len: 31 }, { sp: 'flat', len: 47 }, { sp: 'jju', len: 15 }, { sp: 'jju', len: 12 }, { sp: 'gap', len: 19 }, { sp: 'bream', len: 38 }];

  function shell(container) {
    container.innerHTML = `<div style="display:grid;gap:10px;max-width:560px;margin:0 auto"><div data-body></div><div data-res style="display:none;${CARD};font-size:14.5px"></div></div>`;
    return { body: container.querySelector('[data-body]'), res: container.querySelector('[data-res]') };
  }
  const nextHint = n => `<div style="font-size:12.5px;opacity:.85;margin-top:6px">➡ 다음: 게임 메뉴의 <b>${n}</b>에서 이어서 해요.</div>`;

  /* ───────────── ① 🎣 실전 선상 요령 ─────────────
   * 게임 1초 ≈ 실제 30초(스테이 2~6초 ≈ 1~3분). 선장님 방송에 따라 물살·물색·빛·수심이 바뀜.
   * 할 일: 바닥 찍기 · 콩콩(바닥 톡톡) · 스테이(기다리기) · 챔질 · 감기(누르고 있기) · 다시 내리기(줄 각도·수심 체크) · 에기 색·단차·봉돌 교체 */
  const COLORS = ['🟤 내추럴(갈색·녹색)', '🟠 진한 색(주황·핑크)', '🟢 야광(밤·흐림)'];
  const DAN = ['짧게(10cm)', '보통(30cm)', '길게(50cm)'];
  const PRAC = {
    jju: { gear: 'egi', D: [16, 26], leads: [8, 10, 15, 20, 25, 30], k: .6, stay: [1, 4], hook: { t: 'now', win: 1.3 }, sig: '초릿대가 묵직~ (무게가 실려요)',
      tip: '쭈꾸미: 바닥 찍고 → 콩콩 2~3번 → 1~2분 스테이 → 묵직하면 바로 챔질 → 멈추지 말고 같은 속도로 감기.' },
    gap: { gear: 'egi', D: [18, 30], leads: [10, 15, 20, 25, 30], k: .6, stay: [2, 6], hook: { t: 'now', win: 1.5 }, sig: '초릿대가 살짝 무거워졌어요(스르륵)',
      tip: '갑오징어: 쭈꾸미보다 오래(2~3분) 스테이. 입질이 약해서 「살짝 무거워짐」에 챔질해요. 물살이 약하면 단차를 길게.' },
    flat: { gear: 'worm', D: [20, 40], leads: [15, 20, 30, 40, 50], k: .8, stay: [2, 8], hook: { t: 'wait', lo: 1, hi: 3.5 }, sig: '투둑… 투둑 (광어가 웜을 물었어요)',
      tip: '광어 다운샷: 콩콩 후 길게 기다리고, 입질이 와도 「하나·둘」 세고 챔질. 물살이 세면 봉돌을 무겁게.' },
    rock: { gear: 'bait', D: [30, 55], leads: [30, 40, 50, 60, 80], k: 1, lift: true, hook: { t: 'now', win: 1.3 }, sig: '투두둑! (우럭이 확 물었어요)',
      tip: '우럭: 바닥 찍고 바로 1~2m 띄우기. 수심이 바뀌면 다시 바닥 찍기. 바닥에 오래 두면 밑걸림. 미끼는 자주 새것으로.' },
  };
  function pracGame(container, onReward) {
    const sh = shell(container); let stop = () => {};
    function menu() {
      stop(); sh.res.style.display = 'none';
      const rec = LS.get('game.prac', {});
      sh.body.innerHTML = `<div style="${CARD}"><b style="font-size:16px">🎣 실전 선상 요령</b><div style="font-size:13px;opacity:.85">실제 배 위처럼 <b>바닥 찍기 → 콩콩 → 스테이 → 챔질 → 감기</b>를 하고, 선장님 방송에 맞춰 <b>에기 색·단차·봉돌</b>을 바꾸고 줄이 비스듬하면 <b>다시 내려요</b>. 게임 1초 ≈ 실제 30초.</div></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">${Object.keys(PRAC).map(k => `<button type="button" data-sp="${k}" style="${SOFT};text-align:left;padding:10px;min-height:70px"><span style="font-size:20px">${FISH[k].ic}</span> <b>${FISH[k].n}</b>${rec[k] ? `<br><span style="font-size:11.5px;opacity:.8">최고 ${rec[k]}마리</span>` : ''}${isClosed(FISH[k]) ? '<br><span style="font-size:11.5px;color:#FF8A7A">지금 금어기 — 연습만</span>' : ''}</button>`).join('')}</div>`;
      sh.body.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => run(b.dataset.sp));
    }
    function run(id) {
      stop(); sh.res.style.display = 'none';
      const P = PRAC[id], F = FISH[id], egi = P.gear === 'egi';
      const s = { time: 90, D: Math.round(rnd(...P.D)), cur: 2, water: 0, light: 0, col: 0, dan: 1, lead: P.leads[1], angle: 0, state: 'fall', fallT: 2, kong: 99, h: 0, botT: 0, bait: 100,
        bite: null, fake: null, reel: null, down: 0, mood: 1, boost: 0, evT: 8, move: null, catch: [], msg: '선장님: 「수심 ' + 0 + 'm, 채비 내리세요!」', score: 0, hold: false, hint: true, tangles: 0 };
      s.msg = `📢 선장님: 「수심 ${s.D}m, 채비 내리세요!」`;
      const needLead = () => Math.round((s.D * P.k * .5 + s.cur * 5 * P.k) / 5) * 5;
      sh.body.innerHTML = `<div style="display:flex;justify-content:space-between;font-weight:700"><span data-t></span><span>${F.ic} ${esc(F.n)}</span><span data-n></span></div>
        <div data-env style="${CARD};font-size:13px;margin-top:4px"></div>
        <div data-rod style="margin:6px 0;padding:10px;border-radius:12px;background:#0B3B5A;color:#fff;text-align:center;min-height:62px;font-size:15px;line-height:1.4"></div>
        <div data-msg style="font-size:13.5px;min-height:38px;line-height:1.4"></div>
        <div data-hintbox style="font-size:12.5px;min-height:18px;color:#FFE27A"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:4px">
          <button type="button" data-a="kong" style="${SOFT}">🔨 콩콩</button><button type="button" data-a="hook" style="${PRIMARY}">🎣 챔질</button><button type="button" data-a="reel" style="${SOFT};touch-action:none">⬆ 감기(누름)</button>
          <button type="button" data-a="bottom" style="${SOFT};font-size:13.5px">⬇ 바닥 찍기</button><button type="button" data-a="redrop" style="${SOFT};font-size:13.5px">↕ 올려 다시 내리기</button><button type="button" data-a="${P.lift ? 'lift' : 'dan'}" style="${SOFT};font-size:13.5px">${P.lift ? '⬆ 1~2m 띄우기' : '📏 단차 바꾸기'}</button>
          <button type="button" data-a="col" style="${SOFT};font-size:13.5px">${egi ? '🎨 에기 색' : P.gear === 'worm' ? '🎨 웜 색' : '🦑 미끼 교체'}</button><button type="button" data-a="lead" style="${SOFT};font-size:13.5px">⚖ 봉돌 바꾸기</button><button type="button" data-a="hintT" style="${SOFT};font-size:13px">💡 힌트 끄기</button></div>`;
      const q = x => sh.body.querySelector(x);
      const say = t => { s.msg = t; };
      const busy = () => s.down > 0 || s.state === 'fall' || s.reel;
      function setDown(sec, why) { s.down = sec; s.bite = null; s.fake = null; s.state = 'fall'; s.fallT = s.D / 14; s.angle = 0; s.kong = 99; s.h = 0; s.botT = 0; say(why); }
      function act(a) {
        if (s.time <= 0) return;
        if (a === 'hintT') { s.hint = !s.hint; q('[data-a="hintT"]').textContent = s.hint ? '💡 힌트 끄기' : '💡 힌트 켜기'; return; }
        if (a === 'redrop') { if (s.move) { s.move = null; s.down = 3; s.state = 'up'; say('✅ 채비를 올렸어요. 배가 이동해요…'); return; } setDown(1.2, '↕ 채비를 올렸다가 다시 내려요 — 줄이 곧게 서요'); sfx('hit'); return; }
        if (s.move && a !== 'reel') { say('⚠ 선장님이 채비를 올리라고 했어요! 「올려 다시 내리기」를 눌러요'); return; }
        if (a === 'col' || a === 'lead' || a === 'dan') {
          if (s.reel) return;
          if (a === 'col') { if (egi || P.gear === 'worm') s.col = (s.col + 1) % 3; else s.bait = 100; }
          if (a === 'dan') s.dan = (s.dan + 1) % 3;
          if (a === 'lead') { const i = P.leads.indexOf(s.lead); s.lead = P.leads[(i + 1) % P.leads.length]; }
          setDown(2.5, a === 'col' ? (egi || P.gear === 'worm' ? `🎨 감아 올려 ${COLORS[s.col]}로 바꿨어요` : '🦑 새 미끼로 바꿨어요(싱싱해야 잘 물어요)') : a === 'dan' ? `📏 단차를 ${DAN[s.dan]}로 묶었어요` : `⚖ 봉돌을 ${s.lead}호로 바꿨어요`); sfx('hit'); return;
        }
        if (a === 'bottom') { if (busy()) return; if (s.state === 'float') { s.state = 'bottom'; s.h = 0; s.botT = 0; say('⬇ 줄을 풀어 바닥을 다시 찍었어요(툭!)'); sfx('hit'); } else say('이미 바닥이에요'); return; }
        if (a === 'lift') { if (busy()) return; if (s.state === 'float' && s.h > 3) { say('너무 떠 있어요 — 먼저 바닥 찍기!'); return; } s.state = 'lift'; s.h = 1.5; s.botT = 0; say('⬆ 바닥에서 1.5m 띄웠어요 — 우럭이 있는 높이'); sfx('hit'); return; }
        if (a === 'kong') { if (busy()) return; if (s.bite) { s.bite = null; s.mood *= .8; say('😢 입질 중에 콩콩하면 놓쳐요'); return; } if (s.state === 'float') { say('바닥에 닿지 않았어요 — 바닥 찍기 먼저'); return; }
          s.kong = 0; s.fake = Math.random() < .5 ? { t: 0 } : null; sfx('hit'); return; }
        if (a === 'hook') {
          if (s.reel || s.down > 0) return;
          if (s.bite) { const h = P.hook, t = s.bite.t;
            if (h.t === 'now' ? t <= h.win : inR(t, h.lo, h.hi)) { s.bite = null; s.reel = { need: s.D / 12, got: 0, off: 0 }; say('🎣 걸었다! 「⬆ 감기」를 누르고 계속 감아요 — 멈추면 빠져요'); sfx('win'); buzz('hit'); }
            else { s.bite = null; s.mood *= .85; say(h.t === 'wait' ? '😢 너무 빨라요 — 하나·둘 세고 챔질!' : '😢 늦었어요'); sfx('miss'); }
            return; }
          if (s.fake) { s.fake = null; s.mood *= .85; say('😢 헛챔질! 그건 봉돌이 바닥에 닿은 「툭」이었어요'); sfx('miss'); return; }
          s.mood *= .92; say('😢 입질이 없는데 챔질했어요(고기가 놀라요)'); sfx('miss');
        }
      }
      function factors() {
        const f = [], c = { col: 1, dan: 1, lead: 1, angle: 1, rhythm: 1, place: 1, bait: 1 };
        const bestCol = s.light === 1 ? 2 : s.water === 1 ? 1 : 0;
        if (egi || P.gear === 'worm') { if (s.col !== bestCol) { c.col = .35; f.push(`🎨 ${s.light === 1 ? '어두워요 → 야광' : s.water === 1 ? '물이 탁해요 → 진한 색' : '물이 맑아요 → 내추럴 색'}`); } }
        else { c.bait = s.bait > 50 ? 1 : .3; if (s.bait <= 50) f.push('🦑 미끼가 상했어요 → 미끼 교체'); }
        if (!P.lift) { const bd = s.cur === 3 ? 0 : s.cur === 2 ? 1 : 2; if (s.dan !== bd) { c.dan = .5; f.push(`📏 물살 ${['', '약함', '보통', '셈'][s.cur]} → 단차 ${DAN[bd]}`); } }
        const need = needLead();
        if (s.lead < need) { c.lead = .7; f.push(`⚖ 봉돌이 가벼워요(지금 ${s.lead}호, ${need}호쯤 필요) → 줄이 빨리 비스듬해져요`); } else if (s.lead > need + 15) { c.lead = .75; f.push('⚖ 봉돌이 너무 무거워요(입질이 둔해요)'); }
        if (s.angle > 30) { c.angle = .35; f.push('↕ 줄이 비스듬해요 → 올려 다시 내리기'); }
        if (P.lift) { if (s.state === 'bottom') { c.place = .3; f.push('⬆ 바닥에 있어요 → 1~2m 띄우기(밑걸림 조심)'); } else if (s.state === 'float' || s.h > 3) { c.place = .1; f.push('⬇ 너무 떠 있어요 → 바닥 찍기'); } }
        else { if (s.state === 'float') { c.place = .1; f.push('⬇ 수심이 깊어져 바닥에 안 닿아요 → 바닥 찍기'); }
          const [a, b] = P.stay; if (s.kong > 50) { c.rhythm = .15; f.push('🔨 콩콩으로 바닥을 톡톡 두드려요'); } else if (s.kong < a) c.rhythm = .1; else if (s.kong > b + 3) { c.rhythm = .3; f.push('🔨 스테이가 너무 길어요 → 다시 콩콩'); } }
        return { c, f, v: Object.values(c).reduce((x, y) => x * y, 1) };
      }
      function event() {
        const r = Math.random();
        if (r < .2) { s.cur = clamp(s.cur + (s.cur === 3 ? -1 : s.cur === 1 ? 1 : Math.random() < .5 ? 1 : -1), 1, 3); say(`📢 선장님: 「물살이 ${['', '약해졌어요', '보통이에요', '세졌어요'][s.cur]}!」`); }
        else if (r < .35) { s.water = 1 - s.water; say(`📢 선장님: 「물색이 ${s.water ? '탁해졌어요' : '맑아졌어요'}」`); }
        else if (r < .48) { s.light = 1 - s.light; say(s.light ? '☁ 구름이 끼어 어두워졌어요' : '☀ 해가 났어요'); }
        else if (r < .68) { const nd = clamp(s.D + Math.round(rnd(-5, 6)), P.D[0], P.D[1] + 5), deeper = nd > s.D; s.D = nd;
          if (deeper && (s.state === 'bottom' || s.state === 'lift')) { s.state = 'float'; s.h = 4; } else if (!deeper && s.state === 'lift') { s.state = 'bottom'; s.h = 0; }
          say(`📢 선장님: 「수심 ${s.D}m ${deeper ? '깊어져요 — 줄 풀어 바닥 찍으세요' : '얕아져요 — 바닥 걸림 조심'}」`); }
        else if (r < .8) { s.move = { t: 0 }; say('📢 선장님: 「포인트 옮깁니다! 채비 올려 주세요!」'); buzz('hit'); }
        else { s.boost = 10; say('📢 선장님: 「물때 맞았어요, 지금 입질 시간!」'); }
      }
      function tick() {
        const dt = .1; if (!sh.body.isConnected) return cleanup();
        s.time -= dt; s.evT -= dt; if (s.boost > 0) s.boost -= dt;
        if (s.evT <= 0 && !s.reel) { s.evT = rnd(10, 16); event(); }
        if (s.move) { s.move.t += dt; if (s.move.t > 4) { s.move = null; s.tangles++; setDown(4, '😵 채비를 안 올려서 옆 사람과 줄이 엉켰어요(풀고 다시 내리는 중)'); sfx('miss'); buzz('miss'); } }
        if (s.down > 0) { s.down -= dt; if (s.down <= 0 && s.state === 'up') { s.state = 'fall'; s.fallT = s.D / 14; s.D = Math.round(rnd(...P.D)); say(`📢 선장님: 「도착! 수심 ${s.D}m, 내리세요」`); } }
        else if (s.state === 'fall') { s.fallT -= dt; if (s.fallT <= 0) { s.state = 'bottom'; s.kong = 99; s.botT = 0; say(P.lift ? '툭! 바닥 — 바로 1~2m 띄워요' : '툭! 바닥에 닿았어요 — 콩콩 해 봐요'); } }
        else if (s.reel) {
          const r = s.reel; if (s.hold) { r.got += dt; r.off = 0; } else { r.off += dt; if (r.off > .7) { s.reel = null; s.mood *= .9; say('😢 감다가 멈춰서 빠졌어요 — 끝까지 같은 속도로!'); sfx('miss'); buzz('miss'); } }
          if (s.reel && r.got >= r.need) { const len = Math.round(rnd(...F.len)); s.catch.push({ sp: id, len }); s.reel = null; s.score += 30 + len; say(`🎉 ${F.n} ${len}cm!`); sfx('win'); buzz('win'); setDown(1.5, `🎉 ${F.n} ${len}cm! 다시 내려요`); }
        } else {
          const need = needLead(); s.angle += dt * s.cur * 2.2 * Math.max(.6, need / s.lead);
          if (s.angle > 50) { s.tangles++; setDown(3, '😵 줄이 너무 비스듬해 옆 사람 줄과 엉켰어요 — 줄 각도를 보고 미리 다시 내려요'); sfx('miss'); }
          if (!P.gear || P.gear === 'bait') s.bait = Math.max(0, s.bait - dt * 1.6);
          s.kong += dt; if (s.state === 'bottom') s.botT += dt; else s.botT = 0;
          if (P.lift && s.botT > 3.5) { s.tangles++; setDown(3, '🪨 밑걸림! 바닥에 오래 둬서 채비가 바위에 걸렸어요(다시 묶는 중)'); sfx('miss'); }
          if (s.fake) { s.fake.t += dt; if (s.fake.t > .8) s.fake = null; }
          if (s.bite) { s.bite.t += dt; const h = P.hook; if (s.bite.t > (h.t === 'now' ? h.win + .3 : h.hi)) { s.bite = null; say('😢 입질을 놓쳤어요 — 미끼만 먹고 갔어요'); } }
          else if (!s.fake) { const f = factors(); if (Math.random() < .36 * f.v * s.mood * (s.boost > 0 ? 1.8 : 1) * dt) { s.bite = { t: 0 }; buzz('hit'); } }
          s.mood = Math.min(1, s.mood + dt * .02);
        }
        draw();
        if (s.time <= 0) { cleanup(); finish(); }
      }
      function draw() {
        const f = factors(), stayS = s.kong < 50 ? s.kong : 0;
        q('[data-t]').textContent = `⏱ ${Math.max(0, Math.ceil(s.time))}초`; q('[data-n]').textContent = `${F.ic} ${s.catch.length}마리`;
        q('[data-env]').innerHTML = `🌊 수심 <b>${s.D}m</b> · 물살 <b>${['', '약함', '보통', '셈'][s.cur]}</b> · 물색 ${s.water ? '탁함' : '맑음'} · ${s.light ? '☁ 어두움' : '☀ 밝음'}${s.boost > 0 ? ' · <b style="color:#FFE27A">입질 시간!</b>' : ''}
          <br>🧰 ${egi || P.gear === 'worm' ? COLORS[s.col] : '미끼 ' + Math.round(s.bait) + '%'}${P.lift ? '' : ' · 단차 ' + DAN[s.dan]} · 봉돌 <b>${s.lead}호</b>
          <br>↕ 줄 각도 <b style="color:${s.angle > 30 ? '#FF8A7A' : '#4BD08A'}">${Math.round(s.angle)}°</b> <span style="display:inline-block;width:90px;height:7px;background:#123;border-radius:4px;vertical-align:middle"><span style="display:block;height:7px;border-radius:4px;width:${Math.min(100, s.angle * 2)}%;background:${s.angle > 30 ? '#FF6B5B' : '#4BD08A'}"></span></span>
           · ${s.down > 0 ? '⏳ 작업 중' : { fall: '⬇ 내리는 중', bottom: '바닥 닿음', lift: `바닥 위 ${s.h}m`, float: '⚠ 바닥에 안 닿음', up: '⬆ 올리는 중' }[s.state]}${!P.lift && s.state === 'bottom' && stayS ? ` · 스테이 ${stayS.toFixed(1)}초(≈${Math.round(stayS * 30)}초)` : ''}`;
        const rod = q('[data-rod]');
        rod.innerHTML = s.reel ? `⬆ 감는 중… <b>${Math.min(100, Math.round(s.reel.got / s.reel.need * 100))}%</b><br><span style="font-size:13px">${s.hold ? '좋아요, 계속!' : '❗ 감기를 누르고 있어요!'}</span>`
          : s.bite ? `<b style="color:#FFE27A;font-size:18px">❗ ${esc(P.sig)}</b><br><span style="font-size:13px">〰〰⤵</span>`
          : s.fake ? '툭! <span style="font-size:13px">(봉돌이 바닥에 닿는 느낌)</span>'
          : s.move ? '<b style="color:#FF8A7A">⬆ 채비를 올려요!</b>' : '<span style="opacity:.6">— 초릿대 조용 —</span>';
        rod.style.background = s.bite ? '#7A3B12' : s.reel ? '#1E5A3A' : '#0B3B5A';
        q('[data-msg]').textContent = s.msg;
        q('[data-hintbox]').textContent = s.hint && !s.reel && !s.bite && s.down <= 0 && s.state !== 'fall' ? (f.f[0] ? '💡 ' + f.f[0] : '💡 채비 좋아요! 요령대로 기다려요') : '';
      }
      function finish() {
        const rec = LS.get('game.prac', {}), n = s.catch.length; if (n > (rec[id] || 0)) { rec[id] = n; LS.set('game.prac', rec); }
        const day = LS.get('game.day.catch', { list: [] }), today = new Date().toDateString(); if (day.date !== today) { day.date = today; day.list = []; }
        day.list = day.list.concat(s.catch).slice(-30); LS.set('game.day.catch', day);
        const score = s.score + n * 10 - s.tangles * 10, coins = Math.max(0, Math.floor(score / 12));
        sh.res.style.display = 'block';
        sh.res.innerHTML = `<b style="font-size:18px">⏱ 철수!</b> ${F.ic} ${n}마리${n ? ' (' + s.catch.map(c => c.len + 'cm').join(', ') + ')' : ''} · 줄 엉킴·밑걸림 ${s.tangles}번 · <b>${Math.max(0, score)}점</b> · 🪙 +${coins}
          <br><span style="font-size:13px">💡 ${esc(P.tip)}</span>${nextHint('🧊 쿨러 정리')}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><button type="button" data-again style="${PRIMARY}">↻ 다시</button><button type="button" data-list style="${SOFT}">← 어종 고르기</button></div>`;
        sh.res.querySelector('[data-again]').onclick = () => run(id); sh.res.querySelector('[data-list]').onclick = menu;
        sfx('win'); if (onReward) try { onReward({ game: 'shipday', score: Math.max(0, score), coins }); } catch (e) {}
      }
      sh.body.querySelectorAll('[data-a]').forEach(b => {
        if (b.dataset.a === 'reel') { b.addEventListener('pointerdown', e => { e.preventDefault(); s.hold = true; b.style.background = '#3F6E7C'; }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(k => b.addEventListener(k, () => { s.hold = false; b.style.background = '#2A4650'; })); b.addEventListener('contextmenu', e => e.preventDefault()); }
        else b.addEventListener('click', () => act(b.dataset.a));
      });
      const kd = e => { if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) act('hook'); } else if (e.code === 'KeyJ') { if (!e.repeat) act('kong'); } else if (e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); s.hold = true; } };
      const ku = e => { if (e.code === 'ArrowUp' || e.code === 'KeyW') s.hold = false; };
      document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
      const iv = setInterval(tick, 100);
      function cleanup() { clearInterval(iv); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); }
      stop = cleanup; draw();
    }
    menu();
    return { destroy: () => stop() };
  }

  /* ───────────── ② 🧊 쿨러 정리 — 집에 가져가기 ─────────────
   * 1) 금지체장·금어기 확인해 방생/보관 2) 어종별 보관 준비 순서 3) 쿨러·이동 퀴즈 → 신선도 */
  const PREP = {
    fish: ['아가미뚜껑 안쪽에 칼집을 내요', '바닷물 통에 머리부터 넣어 피를 빼요(5~10분)', '비닐에 하나씩 담아요', '쿨러 얼음 위에 눕혀요(신문지 한 장 깔고)'],
    ceph: ['바닷물을 조금 담은 비닐·통에 넣어요(민물 금지)', '공기를 빼고 단단히 묶어요', '쿨러 얼음 위에 올려요(얼음에 바로 닿지 않게)'],
  };
  const COOLQ = [
    { q: '쿨러 얼음은 어디에 넣을까요?', o: ['바닥에 깔고 위에도 조금 덮어요', '생선 위에만 올려요', '얼음 없이 뚜껑만 닫아요'], a: 0, why: '찬 공기는 아래로 내려가요. 바닥에 깔고 위에도 덮으면 고르게 차가워요.' },
    { q: '얼음이 녹아 물이 고이면?', o: ['그대로 둬요', '마개로 가끔 빼 줘요'], a: 1, why: '녹은 물에 생선이 잠기면 살이 물러지고 맛이 빠져요.' },
    { q: '생선과 얼음 사이는?', o: ['비닐·신문지로 감싸요', '얼음에 바로 닿게 해요'], a: 0, why: '얼음에 바로 닿으면 그 부분이 얼었다 녹으며 상해요.' },
    { q: '차로 갈 때 쿨러는?', o: ['햇빛 드는 뒷유리 쪽', '그늘진 곳, 뚜껑 꽉 닫기'], a: 1, why: '쿨러도 햇빛에 오래 두면 금방 데워져요. 자주 열지 않는 것도 중요해요.' },
    { q: '집에 도착하면?', o: ['바로 손질해 냉장고에', '내일까지 쿨러에 둬요'], a: 0, why: '도착하면 바로 손질하는 게 가장 맛있어요. 특히 내장은 빨리 빼야 해요.' },
  ];
  function coolerGame(container, onReward) {
    const sh = shell(container);
    const day = LS.get('game.day.catch', { list: [] }), mine = day.date === new Date().toDateString() && day.list.length;
    const list = (mine ? day.list : SAMPLE()).map(c => ({ ...c })), fresh = { v: 100 }; let score = 0, keep = [];
    function intro() {
      sh.res.style.display = 'none';
      sh.body.innerHTML = `<div style="${CARD}"><b style="font-size:16px">🧊 쿨러 정리 — 집에 가져가기</b><div style="font-size:13px;opacity:.85">${mine ? '오늘 실전 게임에서 잡은 고기예요.' : '오늘 잡은 고기가 없어서 선장님이 고른 연습용 조과예요.'} 법을 지키고, 집까지 싱싱하게!</div>
        <div style="font-size:22px;margin-top:6px">${list.map(c => FISH[c.sp].ic).join(' ')}</div></div><button type="button" data-go style="${PRIMARY};width:100%;margin-top:8px">🧊 정리 시작</button>`;
      sh.body.querySelector('[data-go]').onclick = () => stepA(0);
    }
    function stepA(i) {
      if (i >= list.length) return stepB(0);
      const c = list[i], f = FISH[c.sp], cl = isClosed(f), small = f.min && c.len <= f.min, must = cl || small;
      sh.body.innerHTML = `<div style="${CARD}"><b>1단계 · 보관할까, 방생할까?</b> (${i + 1}/${list.length})</div>
        <div style="text-align:center;margin:10px 0"><div style="font-size:48px">${f.ic}</div><b style="font-size:18px">${esc(f.n)} ${c.len}cm</b>
        <div style="font-size:12.5px;opacity:.85">📏 금지체장 ${f.min ? f.min + 'cm 이하' : '없음'} · 🚫 금어기 ${f.closed ? `${f.closed[0]}/${f.closed[1]}~${f.closed[2]}/${f.closed[3]}` : '없음'} · 오늘 ${new Date().getMonth() + 1}/${new Date().getDate()}</div></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button type="button" data-k style="${OK}">🧊 보관</button><button type="button" data-r style="${SOFT}">🤲 방생</button></div><div data-fb style="min-height:40px;font-size:13.5px;margin-top:6px"></div>`;
      const go = keepIt => {
        const fb = sh.body.querySelector('[data-fb]'); sh.body.querySelectorAll('button').forEach(b => b.disabled = true);
        if (keepIt && must) { score -= 30; fb.innerHTML = `🚨 ${cl ? '지금은 금어기' : `${f.min}cm 이하는 금지체장`}이에요! 가져가면 과태료를 낼 수 있어요. 바로 방생해요.`; sfx('miss'); buzz('miss'); }
        else if (!keepIt && !must) { score += 5; fb.innerHTML = '🤲 가져가도 되지만 방생했어요. 필요한 만큼만 — 좋은 마음이에요!'; }
        else { score += 20; fb.innerHTML = keepIt ? '✅ 기준에 맞아요. 보관!' : `✅ 잘했어요. ${cl ? '금어기' : '작은 고기'}는 빨리 물에 돌려보내요.`; sfx('hit'); }
        if (keepIt && !must) keep.push(c);
        setTimeout(() => stepA(i + 1), 1500);
      };
      sh.body.querySelector('[data-k]').onclick = () => go(true); sh.body.querySelector('[data-r]').onclick = () => go(false);
    }
    function stepB(gi) {
      const groups = [...new Set(keep.map(c => FISH[c.sp].ceph ? 'ceph' : 'fish'))];
      if (gi >= groups.length) return stepC(0);
      const g = groups[gi], steps = PREP[g]; let done = 0, err = 0;
      const draw = msg => {
        const rest = shuffle(steps.map((x, i) => i).filter(i => i >= done));
        sh.body.innerHTML = `<div style="${CARD}"><b>2단계 · ${g === 'fish' ? '🐟 생선' : '🐙 쭈꾸미·갑오징어'} 보관 준비 순서</b><div style="font-size:12.5px;opacity:.85">맞는 순서대로 눌러요</div></div>
          ${done ? `<ol style="font-size:13.5px;margin:6px 0;padding-left:20px">${steps.slice(0, done).map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}
          <div style="font-size:13.5px;min-height:22px;margin:4px 0">${esc(msg || '')}</div>
          <div style="display:grid;gap:6px">${rest.map(i => `<button type="button" data-s="${i}" style="${SOFT};text-align:left;padding:8px 12px;font-weight:600;font-size:14px">${esc(steps[i])}</button>`).join('')}</div>`;
        sh.body.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { if (+b.dataset.s === done) { done++; sfx('hit'); if (done >= steps.length) { score += Math.max(0, 30 - err * 10); fresh.v -= err * 4; draw('✅ 완료!'); setTimeout(() => stepB(gi + 1), 1100); } else draw('✓ 좋아요, 다음은?'); } else { err++; fresh.v -= 3; sfx('miss'); draw('😢 그 전에 할 일이 있어요'); } });
      };
      if (!keep.length) return stepC(0);
      draw();
    }
    function stepC(i) {
      if (i >= COOLQ.length) return end();
      const Q = COOLQ[i];
      sh.body.innerHTML = `<div style="${CARD}"><b>3단계 · 쿨러와 집까지</b> (${i + 1}/${COOLQ.length}) · 🧊 신선도 ${Math.max(0, fresh.v)}%</div>
        <div style="font-size:16px;font-weight:700;margin:10px 0">${esc(Q.q)}</div><div style="display:grid;gap:6px">${Q.o.map((o, k) => `<button type="button" data-o="${k}" style="${SOFT};text-align:left;padding:8px 12px">${esc(o)}</button>`).join('')}</div><div data-fb style="font-size:13.5px;min-height:40px;margin-top:6px"></div>`;
      sh.body.querySelectorAll('[data-o]').forEach(b => b.onclick = () => { const ok = +b.dataset.o === Q.a; sh.body.querySelectorAll('[data-o]').forEach(x => x.disabled = true);
        if (ok) { score += 15; sfx('hit'); } else { fresh.v -= 12; sfx('miss'); }
        sh.body.querySelector('[data-fb]').innerHTML = `${ok ? '✅' : '😢'} ${esc(Q.why)}`; setTimeout(() => stepC(i + 1), 1900); });
    }
    function end() {
      const fv = clamp(fresh.v, 10, 100); LS.set('game.day.cooler', { date: new Date().toDateString(), fresh: fv, list: keep });
      const total = Math.max(0, score + Math.round(fv / 2)), coins = Math.floor(total / 10);
      sh.body.innerHTML = '';
      sh.res.style.display = 'block';
      sh.res.innerHTML = `<b style="font-size:18px">🏠 집에 도착!</b> 가져온 고기 ${keep.length ? keep.map(c => FISH[c.sp].ic + c.len + 'cm').join(' ') : '없음'} · 🧊 신선도 <b>${fv}%</b> · <b>${total}점</b> · 🪙 +${coins}
        <br><span style="font-size:13px">💡 피를 빼고 얼음에 직접 닿지 않게, 녹은 물은 빼고 — 이 세 가지만 지켜도 비린내가 훨씬 줄어요.</span>${nextHint('🔪 어종별 손질')}
        <button type="button" data-again style="${PRIMARY};width:100%;margin-top:8px">↻ 다시</button>`;
      sh.res.querySelector('[data-again]').onclick = () => coolerGame(container, onReward);
      sfx('win'); if (onReward) try { onReward({ game: 'cooler', score: total, coins }); } catch (e) {}
    }
    intro();
    return { destroy() {} };
  }

  /* ───────────── ③ 🔪 어종별 손질 ─────────────
   * 순서대로 단계 누르기 + 문지르기(빠르게 여러 번 누르기). 틀린 보기에는 위험한 행동이 섞여 있어요. */
  const CLEAN = {
    flat: { steps: ['머리 뒤 아가미 쪽으로 칼을 넣어 머리를 잘라요', '배를 갈라 내장을 빼고 흐르는 물에 씻어요', '키친타월로 물기를 닦아요', '등 가운데 선을 따라 칼집 → 5장 뜨기(광어는 납작해서 위 2장·아래 2장·뼈)', { l: '꼬리 쪽부터 칼을 눕혀 껍질을 벗겨요', rub: 8 }, '결 반대로 얇게 썰어요'], tip: '광어는 몸이 납작해서 「5장 뜨기」를 해요. 껍질 벗길 때 칼은 눕히고 껍질을 당겨요.' },
    rock: { steps: ['목장갑을 껴요 — 등지느러미 가시가 날카로워요', { l: '비늘을 꼬리→머리 방향으로 긁어요', rub: 12 }, '아가미를 잘라 내요', '배를 갈라 내장과 검은 막을 빼요', '등뼈 아래 핏줄까지 흐르는 물에 씻어요', '매운탕은 토막, 회는 3장 뜨기'], tip: '우럭은 가시가 세서 꼭 장갑! 핏줄(검붉은 피)을 깨끗이 씻어야 비린내가 안 나요.' },
    bream: { steps: [{ l: '비늘을 꼬리→머리 방향으로 긁어요', rub: 14 }, '아가미·내장을 빼요', '흐르는 물에 씻고 물기를 닦아요', '3장 뜨기(위 살·아래 살·뼈)', '뱃살 가시를 얇게 저며 내요', '뼈와 머리는 맑은탕 국물용으로 챙겨요'], tip: '참돔은 비늘이 크고 단단해요. 비늘 칠 때 봉지 안에서 하면 덜 튀어요. 뼈·머리는 버리지 말고 국물로!' },
    jju: { steps: ['머리(몸통)를 뒤집어 내장·먹물주머니를 떼요', '눈을 잘라 내요', '다리 가운데 입(이빨)을 눌러 빼요', { l: '굵은 소금·밀가루로 바락바락 주물러요', rub: 15 }, '흐르는 물에 여러 번 헹궈요'], tip: '쭈꾸미는 밀가루·굵은소금으로 주물러야 빨판 속 개흙과 미끈거림이 빠져요. 먹물은 따로 모아 요리에 써도 돼요.' },
    gap: { steps: ['등 쪽 단단한 갑(뼈)을 눌러 빼요', '몸통 안 내장·먹물주머니를 터지지 않게 떼요', { l: '키친타월로 잡고 몸통 껍질을 벗겨요', rub: 10 }, '눈·입을 잘라 내요', '깨끗이 헹궈 물기를 닦아요'], tip: '갑오징어 먹물은 잘 터지고 옷에 묻으면 잘 안 지워져요. 비닐장갑·앞치마를 하고 천천히!' },
  };
  const BAD = ['칼날을 내 몸 쪽으로 당겨요', '민물에 오래(1시간) 담가 둬요', '내장은 내일 빼도 돼요', '맨손으로 가시를 꽉 잡아요'];
  function cleanGame(container, onReward) {
    const sh = shell(container);
    const cool = LS.get('game.day.cooler', null), mine = cool && cool.date === new Date().toDateString() && cool.list.length;
    const have = [...new Set((mine ? cool.list : SAMPLE()).map(c => c.sp))];
    const done = LS.get('game.day.clean', { list: [] }); if (done.date !== new Date().toDateString()) { done.date = new Date().toDateString(); done.list = []; }
    function menu() {
      sh.res.style.display = 'none';
      sh.body.innerHTML = `<div style="${CARD}"><b style="font-size:16px">🔪 어종별 손질</b><div style="font-size:13px;opacity:.85">${mine ? '쿨러에 가져온 고기예요.' : '가져온 고기가 없어서 연습용으로 다 있어요.'} 순서대로 누르고, 「문지르기」는 빠르게 여러 번 눌러요. 위험한 행동을 고르면 하트가 줄어요.</div></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">${have.map(k => `<button type="button" data-sp="${k}" style="${SOFT};text-align:left;padding:10px;min-height:64px"><span style="font-size:20px">${FISH[k].ic}</span> <b>${esc(FISH[k].n)}</b>${done.list.includes(k) ? ' <span style="color:#4BD08A">✔ 손질함</span>' : ''}</button>`).join('')}</div>`;
      sh.body.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => run(b.dataset.sp));
    }
    function run(id) {
      const C = CLEAN[id], F = FISH[id], steps = C.steps.map(x => typeof x === "string" ? { l: x } : { ...x }); let i = 0, hearts = 3, msg = '첫 단계는?', rubN = 0, alive = true;
      function draw() {
        if (!alive) return;
        const st = steps[i];
        if (st && st.rubbing) {
          sh.body.innerHTML = `<div style="${CARD}"><b>${F.ic} ${esc(F.n)} 손질</b> · ${i + 1}/${steps.length} · ${'❤'.repeat(hearts)}${'🤍'.repeat(3 - hearts)}</div>
            <div style="text-align:center;margin:10px 0"><div style="font-size:46px">${F.ic}${rubN % 2 ? '✨' : '💦'}</div><b>${esc(st.l)}</b><div style="margin:8px auto;width:80%;height:10px;background:#123;border-radius:5px"><div style="height:10px;border-radius:5px;background:#4BD08A;width:${rubN / st.rub * 100}%"></div></div></div>
            <button type="button" data-rub style="${PRIMARY};width:100%;min-height:72px;font-size:18px;touch-action:manipulation">👆 빠르게 눌러요! (${rubN}/${st.rub})</button>`;
          sh.body.querySelector('[data-rub]').addEventListener('pointerdown', e => { e.preventDefault(); rubN++; sfx('hit'); if (rubN >= st.rub) { st.rubbing = false; i++; msg = '✓ 깨끗해졌어요! 다음은?'; } draw(); });
          return;
        }
        if (i >= steps.length) return finish();
        const rest = shuffle(steps.map((x, k) => k).filter(k => k >= i)).map(k => ({ k, l: steps[k].l })), bad = pick(BAD);
        const opts = shuffle(rest.concat([{ k: -1, l: bad }]));
        sh.body.innerHTML = `<div style="${CARD}"><b>${F.ic} ${esc(F.n)} 손질</b> · ${i + 1}/${steps.length} · ${'❤'.repeat(hearts)}${'🤍'.repeat(3 - hearts)}</div>
          ${i ? `<ol style="font-size:13px;margin:6px 0;padding-left:20px;opacity:.9">${steps.slice(0, i).map(x => `<li>${esc(x.l)}</li>`).join('')}</ol>` : ''}
          <div style="font-size:13.5px;min-height:22px;margin:4px 0">${esc(msg)}</div>
          <div style="display:grid;gap:6px">${opts.map(o => `<button type="button" data-k="${o.k}" style="${SOFT};text-align:left;padding:8px 12px;font-weight:600;font-size:14px">${esc(o.l)}</button>`).join('')}</div>`;
        sh.body.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
          const k = +b.dataset.k;
          if (k === i) { sfx('hit'); if (steps[i].rub) { steps[i].rubbing = true; rubN = 0; } else { i++; msg = '✓ 좋아요, 다음은?'; } draw(); return; }
          hearts--; sfx('miss'); buzz('miss');
          msg = k === -1 ? `🚫 위험해요! 「${b.textContent}」는 하면 안 돼요.` : '😢 그 전에 할 일이 있어요.';
          if (hearts <= 0) { alive = false; finish(true); return; }
          draw();
        });
      }
      function finish(fail) {
        alive = false;
        if (!fail && !done.list.includes(id)) { done.list.push(id); LS.set('game.day.clean', done); }
        const score = fail ? 10 : 60 + hearts * 20, coins = Math.floor(score / 10);
        sh.body.innerHTML = '';
        sh.res.style.display = 'block';
        sh.res.innerHTML = `<b style="font-size:18px">${fail ? '😢 하트를 다 썼어요' : `🔪 ${esc(F.n)} 손질 끝!`}</b> <b>${score}점</b> · 🪙 +${coins}
          <ol style="font-size:13px;margin:6px 0;padding-left:20px">${steps.map(x => `<li>${esc(x.l)}</li>`).join('')}</ol><span style="font-size:13px">💡 ${esc(C.tip)}</span>${fail ? '' : nextHint('🍳 요리하기')}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><button type="button" data-again style="${PRIMARY}">↻ 다시</button><button type="button" data-list style="${SOFT}">← 다른 고기</button></div>`;
        sh.res.querySelector('[data-again]').onclick = () => { sh.res.style.display = 'none'; run(id); }; sh.res.querySelector('[data-list]').onclick = menu;
        sfx(fail ? 'miss' : 'win'); if (onReward) try { onReward({ game: 'fishclean', score, coins }); } catch (e) {}
      }
      sh.res.style.display = 'none'; draw();
    }
    menu();
    return { destroy() {} };
  }

  /* ───────────── ④ 🍳 요리하기 ─────────────
   * 단계마다: plain(누르기) · pick(재료 고르기) · time(익힘 막대가 초록 칸일 때 「지금!」) */
  const DISH = {
    jju: [
      { n: '🌶 쭈꾸미 볶음', s: [{ t: 'time', l: '끓는 물에 살짝 데쳐요', lo: .35, hi: .55, sp: 1, why: '30초쯤 — 오래 데치면 질겨져요' }, { t: 'pick', l: '양념장 재료를 골라요', o: ['고추장', '고춧가루', '간장', '설탕', '다진 마늘', '식초', '우유'], a: [0, 1, 2, 3, 4] }, { t: 'plain', l: '센 불에 양파·대파를 먼저 볶아요' }, { t: 'time', l: '쭈꾸미와 양념을 넣고 빠르게 볶아요', lo: .3, hi: .5, sp: 1.2, why: '1~2분만 — 오래 볶으면 물이 생기고 질겨요' }, { t: 'plain', l: '불을 끄고 참기름·깨를 뿌려요' }] },
      { n: '🍲 쭈꾸미 샤브샤브', s: [{ t: 'pick', l: '국물 재료를 골라요', o: ['무', '다시마', '대파', '초콜릿', '버섯'], a: [0, 1, 2, 4] }, { t: 'plain', l: '국물이 끓으면 채소를 넣어요' }, { t: 'time', l: '다리부터 넣었다가 꺼내요', lo: .2, hi: .4, sp: 1.4, why: '다리는 10초쯤 — 살짝만!' }, { t: 'time', l: '머리(몸통)는 조금 더 익혀요', lo: .55, hi: .8, sp: 1, why: '머리는 1~2분 더, 먹물이 익어 고소해요' }] },
    ],
    gap: [{ n: '🦑 갑오징어 숙회', s: [{ t: 'plain', l: '몸통에 비스듬히 칼집을 내요' }, { t: 'time', l: '끓는 물에 데쳐요', lo: .45, hi: .65, sp: .9, why: '1~2분 — 하얗게 말리면 꺼내요' }, { t: 'plain', l: '찬물(얼음물)에 바로 식혀요' }, { t: 'pick', l: '초장 재료를 골라요', o: ['고추장', '식초', '설탕', '다진 마늘', '케첩', '버터'], a: [0, 1, 2, 3] }] }],
    flat: [{ n: '🍣 광어회 한 접시', s: [{ t: 'plain', l: '손질한 살을 키친타월에 싸서 냉장고에 잠깐 둬요' }, { t: 'time', l: '얇고 고르게 썰어요(칼은 한 번에 당기기)', lo: .4, hi: .6, sp: 1.3, why: '톱질하듯 여러 번 밀면 살이 뭉개져요' }, { t: 'pick', l: '같이 낼 쌈 채소를 골라요', o: ['상추', '깻잎', '마늘', '고추', '사과잼'], a: [0, 1, 2, 3] }, { t: 'plain', l: '뼈·머리로 맑은 지리탕을 끓여요' }] }],
    rock: [
      { n: '🌶 우럭 매운탕', s: [{ t: 'pick', l: '국물 재료를 골라요', o: ['무', '다시마', '대파', '설탕 한 컵', '양파'], a: [0, 1, 2, 4] }, { t: 'plain', l: '국물이 끓으면 우럭 토막을 넣어요' }, { t: 'pick', l: '양념을 골라요', o: ['고춧가루', '다진 마늘', '국간장', '된장 조금', '마요네즈'], a: [0, 1, 2, 3] }, { t: 'time', l: '중불에 끓여요', lo: .5, hi: .75, sp: .8, why: '10~15분 — 너무 오래 끓이면 살이 부서져요' }, { t: 'plain', l: '불 끄기 직전에 쑥갓·미나리를 올려요' }] },
      { n: '🔥 우럭 소금구이', s: [{ t: 'plain', l: '몸통에 칼집을 2~3개 내요' }, { t: 'plain', l: '굵은 소금을 골고루 뿌려요' }, { t: 'time', l: '중불에 한쪽을 노릇하게 구워요', lo: .5, hi: .7, sp: .9, why: '자주 뒤집으면 살이 부서져요 — 한 번만!' }, { t: 'time', l: '뒤집어서 마저 구워요', lo: .45, hi: .65, sp: 1, why: '속까지 익었는지 젓가락으로 확인' }] },
    ],
    bream: [{ n: '🐠 참돔 맑은탕(지리)', s: [{ t: 'pick', l: '국물 재료를 골라요', o: ['무', '다시마', '두부', '고추장 한 컵', '대파'], a: [0, 1, 2, 4] }, { t: 'plain', l: '머리·뼈에 뜨거운 물을 끼얹어 비린내를 빼요' }, { t: 'time', l: '맑게 끓여요(거품은 걷기)', lo: .5, hi: .7, sp: .9, why: '센 불로 펄펄 끓이면 국물이 탁해져요' }, { t: 'plain', l: '소금으로 간하고 미나리를 올려요' }] }],
  };
  function cookGame(container, onReward) {
    const sh = shell(container); let stop = () => {};
    const cl = LS.get('game.day.clean', null), mine = cl && cl.date === new Date().toDateString() && cl.list.length;
    const have = mine ? cl.list : Object.keys(DISH);
    function menu() {
      stop(); sh.res.style.display = 'none';
      sh.body.innerHTML = `<div style="${CARD}"><b style="font-size:16px">🍳 요리하기</b><div style="font-size:13px;opacity:.85">${mine ? '오늘 손질한 고기로 요리해요.' : '손질한 고기가 없어서 연습용 재료가 다 있어요.'} 익힘 막대가 <b style="color:#4BD08A">초록 칸</b>일 때 「지금!」을 눌러요.</div></div>
        <div style="display:grid;gap:6px;margin-top:8px">${have.flatMap(k => DISH[k].map((d, j) => `<button type="button" data-d="${k}:${j}" style="${SOFT};text-align:left;padding:10px">${FISH[k].ic} <b>${esc(d.n)}</b></button>`)).join('')}</div>`;
      sh.body.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { const [k, j] = b.dataset.d.split(':'); run(k, +j); });
    }
    function run(k, j) {
      stop(); sh.res.style.display = 'none';
      const D = DISH[k][j]; let i = 0, taste = 0, max = 0, notes = [];
      const head = () => `<div style="${CARD}"><b>${esc(D.n)}</b> · ${i + 1}/${D.s.length} 단계</div>`;
      function next() {
        if (i >= D.s.length) return finish();
        const st = D.s[i];
        if (st.t === 'plain') {
          sh.body.innerHTML = head() + `<div style="text-align:center;font-size:40px;margin:10px 0">👩‍🍳</div><div style="font-weight:700;font-size:16px;text-align:center">${esc(st.l)}</div><button type="button" data-ok style="${PRIMARY};width:100%;margin-top:10px">✔ 했어요</button>`;
          sh.body.querySelector('[data-ok]').onclick = () => { taste += 10; max += 10; i++; sfx('hit'); next(); };
        } else if (st.t === 'pick') {
          const on = new Set();
          const draw = () => {
            sh.body.innerHTML = head() + `<div style="font-weight:700;font-size:16px;margin:8px 0">${esc(st.l)} <span style="font-size:12.5px;opacity:.8">(여러 개 — 다 고르면 확인)</span></div>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:6px">${st.o.map((o, n) => `<button type="button" data-o="${n}" style="${on.has(n) ? OK : SOFT};font-size:14px">${on.has(n) ? '✔ ' : ''}${esc(o)}</button>`).join('')}</div>
              <button type="button" data-ok style="${PRIMARY};width:100%;margin-top:8px">확인</button>`;
            sh.body.querySelectorAll('[data-o]').forEach(b => b.onclick = () => { const n = +b.dataset.o; on.has(n) ? on.delete(n) : on.add(n); draw(); });
            sh.body.querySelector('[data-ok]').onclick = () => {
              const right = st.a.filter(n => on.has(n)).length, wrong = [...on].filter(n => !st.a.includes(n));
              const pts = Math.max(0, right * 5 - wrong.length * 8); taste += pts; max += st.a.length * 5;
              if (wrong.length) notes.push(`${wrong.map(n => st.o[n]).join('·')}는 안 어울려요`);
              if (right < st.a.length) notes.push(`${st.a.filter(n => !on.has(n)).map(n => st.o[n]).join('·')}가 빠졌어요`);
              sfx(wrong.length ? 'miss' : 'hit'); i++; next();
            };
          };
          draw();
        } else {
          let v = 0, alive = true; const sp = st.sp || 1;
          sh.body.innerHTML = head() + `<div style="font-weight:700;font-size:16px;margin:8px 0">${esc(st.l)}</div><div style="font-size:12.5px;opacity:.85">${esc(st.why)}</div>
            <div style="position:relative;height:28px;border-radius:14px;background:#123;margin:14px 0;overflow:hidden"><div style="position:absolute;left:${st.lo * 100}%;width:${(st.hi - st.lo) * 100}%;top:0;bottom:0;background:#2E7D5B"></div><div data-bar style="position:absolute;left:0;top:0;bottom:0;width:4px;background:#FFE27A"></div>
            <span style="position:absolute;left:6px;top:5px;font-size:12px;opacity:.7">덜 익음</span><span style="position:absolute;right:6px;top:5px;font-size:12px;opacity:.7">너무 익음</span></div>
            <div style="text-align:center;font-size:36px" data-pot>🍳</div><button type="button" data-now style="${PRIMARY};width:100%;min-height:60px;font-size:18px">⏱ 지금!</button>`;
          const bar = sh.body.querySelector('[data-bar]'), pot = sh.body.querySelector('[data-pot]');
          const iv = setInterval(() => { if (!alive) return; if (!sh.body.isConnected) { clearInterval(iv); return; } v += .035 * sp * .5; bar.style.left = Math.min(100, v * 100) + '%'; pot.textContent = v < st.lo ? '🍳💨' : v <= st.hi ? '🍳✨' : '🍳🔥'; if (v >= 1) done(); }, 50);
          stop = () => { alive = false; clearInterval(iv); };
          const done = () => { if (!alive) return; alive = false; clearInterval(iv); const ok = inR(v, st.lo, st.hi), pts = ok ? 25 : Math.max(0, 25 - Math.round(Math.min(Math.abs(v - st.lo), Math.abs(v - st.hi)) * 120));
            taste += pts; max += 25; if (!ok) notes.push(`${st.l.replace(/요$/, '')} — ${v < st.lo ? '덜 익었어요' : '너무 익었어요'}(${st.why})`); sfx(ok ? 'win' : 'miss'); i++; setTimeout(next, 500); };
          sh.body.querySelector('[data-now]').addEventListener('pointerdown', e => { e.preventDefault(); done(); });
        }
      }
      function finish() {
        const pct = max ? taste / max : 0, star = pct >= .9 ? 3 : pct >= .65 ? 2 : 1, score = Math.round(pct * 150) + star * 20, coins = Math.floor(score / 10);
        const rec = LS.get('game.cook', {}); rec[D.n] = Math.max(rec[D.n] || 0, star); LS.set('game.cook', rec);
        sh.body.innerHTML = '';
        sh.res.style.display = 'block';
        sh.res.innerHTML = `<b style="font-size:18px">🍽 ${esc(D.n)} 완성!</b> 맛 ${'⭐'.repeat(star)}${'☆'.repeat(3 - star)} · <b>${score}점</b> · 🪙 +${coins}
          ${notes.length ? `<ul style="font-size:13px;margin:6px 0;padding-left:20px">${notes.slice(0, 4).map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : '<br><span style="font-size:13px">👍 완벽해요! 직접 잡고 손질한 고기라 더 맛있어요.</span>'}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><button type="button" data-again style="${PRIMARY}">↻ 다시</button><button type="button" data-list style="${SOFT}">← 다른 요리</button></div>`;
        sh.res.querySelector('[data-again]').onclick = () => run(k, j); sh.res.querySelector('[data-list]').onclick = menu;
        sfx('win'); if (onReward) try { onReward({ game: 'fishcook', score, coins }); } catch (e) {}
      }
      next();
    }
    menu();
    return { destroy: () => stop() };
  }

  const LIST = [
    { id: 'shipday', ic: '🎣', name: '실전 선상 요령', desc: '[선상 하루 ①] 바닥 찍기·콩콩·스테이·챔질 + 에기 색·단차·봉돌 교체, 줄 각도 보고 다시 내리기', goal: 200, mount: pracGame },
    { id: 'cooler', ic: '🧊', name: '쿨러 정리(집에 가져가기)', desc: '[선상 하루 ②] 금지체장·금어기 방생 · 피 빼기 · 얼음 넣는 법', goal: 150, mount: coolerGame },
    { id: 'fishclean', ic: '🔪', name: '어종별 손질', desc: '[선상 하루 ③] 광어 5장 뜨기·우럭·참돔·쭈꾸미·갑오징어 손질 순서', goal: 120, mount: cleanGame },
    { id: 'fishcook', ic: '🍳', name: '요리하기', desc: '[선상 하루 ④] 쭈꾸미 볶음·샤브샤브·갑오징어 숙회·광어회·우럭 매운탕·참돔 맑은탕', goal: 150, mount: cookGame },
  ];
  if (window.GameHub) LIST.forEach(x => { if (GameHub.GNAME) GameHub.GNAME[x.id] = x.name; if (GameHub.GOAL) GameHub.GOAL[x.id] = x.goal; });
  window.DayGames = { FISH, PRAC, LIST, extra: onReward => LIST.map(x => ({ id: x.id, ic: x.ic, name: x.name, desc: x.desc, isNew: true, mount: el => x.mount(el, onReward) })) };
})();
