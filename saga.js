/* 🧜 물결이 모험 (시즌 1 「꺼진 등대」 1~5화 · 시즌 2 「첫 출조 대작전」 6화~ 매일 한 화) — 만화 한 화를 보고 → 그 화 게임을 깨면 → 다음 화가 열리는 연재 (2026-11-26)
 * PC 「섬 · 바다 속」 탭 · 휴대폰 앱 · 바다 조황 수첩 공용. 그림은 comic3d.js(이 앱 고유 캐릭터), 게임은 코드로 그림.
 * 기록(진행·별)은 이 기기 브라우저에만 저장. 외부 서비스·결제 없음.
 * 쓰는 법: Saga.view(el) → 멈춤 함수 반환
 */
(function () {
  'use strict';
  const KEY = 'saga.s1';
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // [제목, [칸: [그림 키, 말]]×4, 한 줄 교훈, 게임 id, 게임 이름, 게임 설명]
  const EP = [
    ['등대가 꺼진 밤', [
      ['night', '바로: 물결아! 등대 불이 꺼졌어. 고깃배들이 항구를 못 찾고 있어!'],
      ['mermaid', '물결이: 등대지기 할아버지가 편찮으셔서 그래. 오늘 밤은 우리가 배들을 안내하자!'],
      ['boat', '물결이: 어두운 밤엔 부표 두 개 사이가 안전한 길이야. 바위 쪽으론 절대 가지 마.'],
      ['ok', '물결이: 천천히, 불빛을 따라서! 그리고 내일은 등대를 고치러 가자.']],
      '밤바다는 부표 사이 안전한 길로, 천천히 다녀요.', 'buoy', '🚤 밤바다 길 안내', '부표 두 개 사이로 배를 몰아 10개 문을 지나요. 바위는 피하세요. (← → 키 · 화면을 누른 채 좌우로)'],
    ['그물에 걸린 바다거북', [
      ['trash', '물결이: 큰일이야! 등대 가는 길에 바다거북이 버려진 그물에 걸렸어!'],
      ['angler', '바로: 제가 건질게요! 그런데 물고기 친구들은 다치지 않게 조심조심…'],
      ['clean', '바로: 그물·끊어진 줄·비닐·캔까지 다 건졌어요! 배에 싣고 가서 버릴게요.'],
      ['ok', '물결이: 거북이가 고맙대! 쓰레기를 되가져가면 바다 친구들이 살아.']],
      '쓰레기·끊어진 줄은 바다에 버리지 않고 꼭 되가져가요.', 'clean', '🤿 바다 청소 잠수', '40초 안에 쓰레기 15개를 눌러 건져요. 물고기·거북이는 누르지 마세요!'],
    ['너울이 몰려온다', [
      ['boat', '바로: 와, 바다가 잔잔하다~ 등대 섬까지 금방이겠어요!'],
      ['wave', '(갑자기 저 멀리서 큰 너울이 철썩!)'],
      ['mermaid', '물결이: 모두 구명조끼! 배 가운데로 와서 낮은 자세로 손잡이를 꽉 잡아!'],
      ['ok', '물결이: 휴, 다 같이 무사해! 구명조끼는 너울이 오기 전에 입는 거야.']],
      '배에서는 늘 구명조끼, 너울이 오면 배 가운데에서 낮은 자세로.', 'swell', '🌊 너울 버티기', '먼저 승객 5명에게 구명조끼를 입히고(누르기), 너울이 표시 칸에 닿을 때 「꽉 잡기!」를 눌러요.'],
    ['물때의 문', [
      ['flat', '물결이: 등대 부품은 저 작은 섬에 있대. 물이 빠지면 바닷길이 열려!'],
      ['tide', '바로: 그런데 물이 다시 들어오면 섬에 갇히겠어요…'],
      ['mermaid', '물결이: 그래서 물때를 봐야 해. 물이 낮은 시간 안에 갔다가 돌아오자.'],
      ['ok', '물결이: 부품 찾았다! 물이 차오르기 전에 넉넉하게 돌아왔어.']],
      '바닷길·갯벌은 물때를 확인하고, 물이 들기 전에 넉넉히 돌아와요.', 'tide', '⏰ 물때 퍼즐', '물 높이 그래프를 보고 출발 시각을 골라요. 가고·찾고·오는 2시간 30분 동안 물이 선 아래여야 해요. (낮 시간만)'],
    ['다시 켜진 불빛', [
      ['night', '바로: 부품을 끼웠어요! 그런데 불빛 신호 순서를 맞춰야 켜진대요.'],
      ['mermaid', '물결이: 등대마다 깜빡이는 방식이 달라. 배들은 그걸 보고 어느 등대인지 알아.'],
      ['sun', '(등대가 다시 반짝! 고깃배들이 줄지어 항구로 돌아온다)'],
      ['ok', '물결이: 해냈다! 바다에서 위급할 땐 해양경찰 122. 시즌 1 끝, 또 만나!']],
      '바다에서 위급하면 해양경찰 122, 육지는 119.', 'lamp', '💡 등대 불빛 기억하기', '등대 불빛이 켜지는 순서를 기억해서 똑같이 눌러요. 6개까지 맞히면 등대가 켜져요.'],
    // ── 시즌 2 「첫 출조 대작전」 (2026-11-27~, 매일 한 화) ──
    ['출조 전날 밤', [
      ['angler', '새봄: 바로 형! 나 내일 처음으로 배낚시 가! 뭘 챙겨야 해?'],
      ['mermaid', '물결이: 먼저 바다 날씨랑 주의보부터 확인! 주의보가 뜨면 배가 못 나가거나 미뤄져.'],
      ['boat', '바로: 구명조끼, 신분증, 물, 모자, 미끄럽지 않은 신발! 배에 탈 때 승선 명부를 쓰고 신분증을 확인하거든.'],
      ['ok', '물결이: 쓰레기봉투도 꼭! 바닷바람은 차가우니 겉옷도 하나 더 챙기자.']],
      '출조 전날엔 바다 날씨·주의보 확인, 구명조끼·신분증·물·쓰레기봉투 챙기기.', 'pack', '🎒 출조 가방 싸기', '30초 안에 바다에 꼭 필요한 물건 8개를 눌러 가방에 넣어요. 위험하거나 바다에 맞지 않는 물건은 넣지 마세요! 마지막엔 날씨 문제가 나와요.'],
    ['배에 오르는 순서', [
      ['boat', '새봄: 와, 배다! 얼른 올라타서 제일 좋은 자리 잡을래!'],
      ['mermaid', '물결이: 잠깐! 배에 오를 때도 순서가 있어. 먼저 승선 명부를 쓰고 신분증을 보여 드려.'],
      ['angler', '바로: 구명조끼를 입고, 선장님 안전 안내를 끝까지 들어. 배 위에서는 뛰지 말고 손잡이를 잡고 걸어.'],
      ['ok', '물결이: 낚싯바늘은 통에 넣어 두고, 뱃전에는 걸터앉지 않기! 이제 출발~']],
      '배에 오를 땐 명부·신분증 → 구명조끼 → 안전 안내 순서, 배 위에선 뛰지 않기.', 'board', '⛴ 승선 순서 맞히기', '배에 오르는 순서대로 카드를 눌러요(틀리면 하트가 줄어요). 다음엔 배 위 그림 카드 중 위험한 행동 4개를 찾아요.'],
  ];
  // 시즌 표: [시즌 이름, 시작 화(0부터), 끝(미포함), 배지 그림, 배지 이름, 완주 문구]
  const SEASONS = [
    ['꺼진 등대', 0, 5, '🏅⚓', '등대 지킴이', '밤바다 부표 · 쓰레기 되가져가기 · 구명조끼 · 물때 · 122 신고 — 다섯 가지 바다 약속을 모두 배웠어요.'],
    ['첫 출조 대작전', 5, 10, '🎒⭐', '첫 출조 박사', '초보 새봄이와 함께 첫 배낚시를 준비부터 귀항까지 무사히 마쳤어요.'],
  ];
  const seasonOf = i => Math.max(0, SEASONS.findIndex(s => i >= s[1] && i < s[2]));

  /* ---------- 공용: 소리 ---------- */
  let AC = null;
  function beep(f, d, type, vol) { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(); o.type = type || 'sine'; o.frequency.value = f; g.gain.value = vol || .08; g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + (d || .15)); o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime + (d || .15)); } catch (e) {} }
  const good = () => { beep(660, .12); setTimeout(() => beep(880, .14), 90); };
  const bad = () => beep(160, .25, 'sawtooth', .06);

  function css() {
    if (document.getElementById('saga-css')) return;
    const s = document.createElement('style'); s.id = 'saga-css';
    s.textContent = `
    .saga{display:grid;gap:10px;color:#E6EAEE}
    .saga .sbox{background:#1E242B;border:1px solid #343C45;border-radius:12px;padding:10px 12px;display:grid;gap:8px}
    .saga .smap{display:flex;align-items:center;gap:4px;flex-wrap:wrap}
    .saga .node{border:2px solid #3A4652;background:#11151A;color:#9AA5B1;border-radius:999px;min-width:44px;height:44px;padding:0 10px;font:800 13px/1 inherit;cursor:pointer;display:grid;place-items:center}
    .saga .node[data-st=open]{border-color:#7FD6E8;color:#7FD6E8}
    .saga .node[data-st=done]{border-color:#6FD3A4;background:#173428;color:#C8F5DE}
    .saga .node[aria-current=true]{box-shadow:0 0 0 3px #F5C46B}
    .saga .node[disabled]{opacity:.5;cursor:not-allowed}
    .saga .line{flex:0 0 14px;height:3px;background:#3A4652;border-radius:2px}
    .saga .sttl{font-weight:900;font-size:16px}
    .saga .muted{color:#9AA5B1;font-size:12.5px}
    .saga .sbtn{border:1px solid #2F7F95;background:#1F6C80;color:#fff;border-radius:9px;padding:9px 14px;font:800 14px inherit;cursor:pointer}
    .saga .sbtn.ghost{background:transparent;color:#7FD6E8}
    .saga .sbtn:disabled{opacity:.45;cursor:not-allowed}
    .saga .gwrap{position:relative;border-radius:12px;overflow:hidden;background:#0A1424;touch-action:none;user-select:none;-webkit-user-select:none}
    .saga canvas{display:block;width:100%}
    .saga .hud{display:flex;gap:10px;flex-wrap:wrap;font-weight:800;font-size:13px}
    .saga .msg{position:absolute;inset:0;display:grid;place-items:center;text-align:center;background:rgba(6,12,24,.72);padding:16px;gap:8px;align-content:center}
    .saga .msg b{font-size:20px}
    .saga .stars{font-size:26px;letter-spacing:4px}
    .saga .pax{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;padding:12px}
    .saga .pax button{font-size:34px;width:62px;height:62px;border-radius:14px;border:2px solid #3A4652;background:#11151A;cursor:pointer}
    .saga .pax button[data-on=true]{border-color:#F5C46B;background:#3A2E12}
    .saga .lamps{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:12px;max-width:360px;margin:0 auto}
    .saga .lamps button{height:84px;border-radius:16px;border:3px solid #2A3440;cursor:pointer;font:800 15px inherit;color:#0B1220;opacity:.38;transition:opacity .08s,transform .08s}
    .saga .lamps button.on{opacity:1;transform:scale(1.04);box-shadow:0 0 26px currentColor}
    .saga .quiz{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
    .saga input[type=range]{width:100%}
    .saga .toast{background:#3A2E12;border:1px solid #F5C46B;color:#FFE7B0;border-radius:9px;padding:8px 10px;font-weight:700}
    .saga .badge{font-size:44px;text-align:center}
    .saga .stabs{display:flex;gap:6px;flex-wrap:wrap}
    .saga .stabs button{border:1px solid #3A4652;background:#11151A;color:#9AA5B1;border-radius:999px;padding:6px 12px;font:800 13px inherit;cursor:pointer}
    .saga .stabs button[aria-pressed=true]{border-color:#F5C46B;color:#FFE7B0;background:#3A2E12}
    .saga .node[data-st=soon]{border-style:dashed;opacity:.45;cursor:default}
    .saga .pack{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:10px 4px}
    .saga .pack button{border:2px solid #3A4652;background:#11151A;color:#E6EAEE;border-radius:12px;padding:8px 2px;cursor:pointer;display:grid;gap:2px;justify-items:center;min-height:74px}
    .saga .pack button span{font-size:30px;line-height:1}
    .saga .pack button small{font-size:11px;line-height:1.2;word-break:keep-all}
    .saga .pack button[data-in=true]{border-color:#6FD3A4;background:#173428;opacity:.55}
    .saga .pack button[data-no=true]{border-color:#FF8A8D;background:#3A1416}
    .saga .steps{display:grid;gap:8px;padding:10px 4px}
    .saga .steps button{display:flex;align-items:center;gap:10px;border:2px solid #3A4652;background:#11151A;color:#E6EAEE;border-radius:12px;padding:10px 12px;font:800 14px inherit;cursor:pointer;text-align:left}
    .saga .steps button span{font-size:24px}
    .saga .steps button[data-ok=true]{border-color:#6FD3A4;background:#173428;opacity:.5}
    .saga ol.done{margin:0;padding-left:22px;color:#C8F5DE;font-weight:700;font-size:13px}
    @media (max-width:420px){.saga .pack{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media (max-width:420px){.saga .node{min-width:38px;height:38px}.saga .line{flex-basis:8px}}`;
    document.head.appendChild(s);
  }

  /* ---------- 게임 틀: 캔버스 + 끝 화면 ---------- */
  function stage(el, h) {
    el.innerHTML = `<div class="hud" data-hud></div><div class="gwrap"><canvas></canvas><div data-ov></div></div>`;
    const cv = el.querySelector('canvas'), ctx = cv.getContext('2d'), wrap = el.querySelector('.gwrap');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = () => { const w = Math.max(280, wrap.clientWidth || 360); cv.width = w * dpr; cv.height = h * dpr; cv.style.height = h + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return w; };
    return { cv, ctx, wrap, size, hud: html => { el.querySelector('[data-hud]').innerHTML = html; }, ov: html => { el.querySelector('[data-ov]').innerHTML = html ? `<div class="msg">${html}</div>` : ''; return el.querySelector('[data-ov]'); } };
  }
  const starTxt = n => '★'.repeat(n) + '☆'.repeat(3 - n);

  /* 1) 밤바다 길 안내 */
  function gBuoy(el, done) {
    const S = stage(el, 340); let W = S.size(), raf = 0, on = true, keys = {}, tx = null;
    let bx = W / 2, gates = [], rocks = [], passed = 0, lives = 3, t = 0, last = 0, flash = 0, spawn = 0, over = false;
    const GOAL = 10, BY = 340 - 54;
    const kd = e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { keys[e.key] = 1; e.preventDefault(); } };
    const ku = e => { keys[e.key] = 0; };
    addEventListener('keydown', kd); addEventListener('keyup', ku);
    const pt = e => { const r = S.cv.getBoundingClientRect(); tx = e.clientX - r.left; };
    S.cv.addEventListener('pointerdown', e => { pt(e); try { S.cv.setPointerCapture(e.pointerId); } catch (x) {} });
    S.cv.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') pt(e); });
    S.cv.addEventListener('pointerup', () => { tx = null; });
    function addGate() { const gap = Math.max(110, 150 - passed * 3), m = gap / 2 + 26, gx = m + Math.random() * (W - 2 * m); gates.push({ x: gx, y: -20, gap, done: false });
      if (Math.random() < .7) { let rx; do { rx = 24 + Math.random() * (W - 48); } while (Math.abs(rx - gx) < gap / 2 + 26); rocks.push({ x: rx, y: -90, hit: false }); } }
    function loop(ts) { if (!on) return; const dt = Math.min(.05, last ? (ts - last) / 1000 : 0); last = ts; t += dt;
      if (!over) {
        const sp = 90 + passed * 6;
        if (keys.ArrowLeft) bx -= 260 * dt; if (keys.ArrowRight) bx += 260 * dt;
        if (tx != null) bx += Math.max(-300 * dt, Math.min(300 * dt, tx - bx));
        bx = Math.max(18, Math.min(W - 18, bx));
        spawn -= dt; if (spawn <= 0 && gates.filter(g => !g.done).length < 2 && passed + gates.filter(g => !g.done).length < GOAL) { addGate(); spawn = 2.4 - Math.min(1, passed * .08); }
        gates.forEach(g => { g.y += sp * dt; if (!g.done && g.y >= BY) { g.done = true; if (Math.abs(bx - g.x) < g.gap / 2 - 12) { passed++; good(); } else { lives--; flash = .4; bad(); } } });
        rocks.forEach(r => { r.y += sp * dt; if (!r.hit && Math.hypot(r.x - bx, r.y - BY) < 26) { r.hit = true; lives--; flash = .4; bad(); } });
        gates = gates.filter(g => g.y < 380); rocks = rocks.filter(r => r.y < 380);
        if (lives <= 0) { over = true; end(false); } else if (passed >= GOAL) { over = true; end(true); }
      }
      draw(); flash = Math.max(0, flash - dt); raf = requestAnimationFrame(loop); }
    function draw() { const c = S.ctx, H = 340; const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#050B1E'); g.addColorStop(1, '#0B2440'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 30; i++) { c.fillRect((i * 97) % W, (i * 53 + t * 20) % H, 1.5, 1.5); }
      c.strokeStyle = 'rgba(120,180,230,.18)'; c.lineWidth = 1; for (let y = (t * 60) % 26; y < H; y += 26) { c.beginPath(); for (let x = 0; x <= W; x += 20) c.lineTo(x, y + Math.sin(x / 30 + t * 2) * 3); c.stroke(); }
      const buoy = (x, y, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(x - 9, y + 10); c.lineTo(x, y - 14); c.lineTo(x + 9, y + 10); c.closePath(); c.fill(); c.fillStyle = col; c.globalAlpha = .25 + .2 * Math.sin(t * 6); c.beginPath(); c.arc(x, y - 16, 12, 0, 7); c.fill(); c.globalAlpha = 1; c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y - 16, 3, 0, 7); c.fill(); };
      gates.forEach(gt => { if (gt.done) c.globalAlpha = .35; buoy(gt.x - gt.gap / 2, gt.y, '#FF5A5A'); buoy(gt.x + gt.gap / 2, gt.y, '#3BD67A'); c.setLineDash([4, 6]); c.strokeStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.moveTo(gt.x - gt.gap / 2 + 10, gt.y); c.lineTo(gt.x + gt.gap / 2 - 10, gt.y); c.stroke(); c.setLineDash([]); c.globalAlpha = 1; });
      rocks.forEach(r => { c.fillStyle = '#4A4F5A'; c.beginPath(); c.ellipse(r.x, r.y, 20, 13, 0, 0, 7); c.fill(); c.fillStyle = '#6A707C'; c.beginPath(); c.ellipse(r.x - 5, r.y - 4, 8, 5, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(r.x, r.y + 6, 26, 6, 0, 0, 7); c.stroke(); });
      const cone = c.createRadialGradient(bx, BY - 10, 4, bx, BY - 80, 120); cone.addColorStop(0, 'rgba(255,240,170,.35)'); cone.addColorStop(1, 'rgba(255,240,170,0)'); c.fillStyle = cone; c.beginPath(); c.moveTo(bx, BY - 10); c.lineTo(bx - 70, BY - 170); c.lineTo(bx + 70, BY - 170); c.fill();
      c.fillStyle = '#F2F5F8'; c.beginPath(); c.moveTo(bx, BY - 22); c.quadraticCurveTo(bx + 16, BY, bx + 13, BY + 18); c.lineTo(bx - 13, BY + 18); c.quadraticCurveTo(bx - 16, BY, bx, BY - 22); c.fill(); c.fillStyle = '#E25B3A'; c.fillRect(bx - 7, BY - 2, 14, 10); c.fillStyle = '#FFE9A0'; c.beginPath(); c.arc(bx, BY - 16, 3, 0, 7); c.fill();
      if (flash > 0) { c.fillStyle = `rgba(255,60,60,${flash})`; c.fillRect(0, 0, W, H); }
      S.hud(`<span>🚩 문 ${passed} / ${GOAL}</span><span>❤️ ${'♥'.repeat(Math.max(0, lives))}</span>`); }
    function end(win) { setTimeout(() => done(win ? lives : 0, win ? '배들이 모두 부표 사이로 무사히 지나갔어요!' : '바위에 너무 가까웠어요. 부표 두 개 사이 가운데로!'), 300); }
    raf = requestAnimationFrame(loop);
    const ro = () => { W = S.size(); }; addEventListener('resize', ro);
    return () => { on = false; cancelAnimationFrame(raf); removeEventListener('keydown', kd); removeEventListener('keyup', ku); removeEventListener('resize', ro); };
  }

  /* 2) 바다 청소 잠수 */
  function gClean(el, done) {
    const S = stage(el, 340); let W = S.size(), raf = 0, on = true, last = 0, left = 40, got = 0, miss = 0, items = [], spawn = 0, pops = [], over = false;
    const GOAL = 15, TRASH = ['🥫', '🧴', '🛍️', '🪢', '🥤'], LIFE = ['🐟', '🐠', '🐢', '🦀', '🐡'];
    function add() { const bad = Math.random() < .35; items.push({ e: bad ? LIFE[Math.random() * 5 | 0] : TRASH[Math.random() * 5 | 0], life: bad, x: Math.random() < .5 ? -20 : W + 20, y: 50 + Math.random() * 250, vx: 0, vy: -8 - Math.random() * 10, ph: Math.random() * 6 }); const it = items[items.length - 1]; it.vx = (it.x < 0 ? 1 : -1) * (40 + Math.random() * 50); }
    S.cv.addEventListener('pointerdown', e => { if (over) return; const r = S.cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; let hit = null, bd = 30;
      items.forEach(it => { const d = Math.hypot(it.x - x, it.y - y); if (d < bd) { bd = d; hit = it; } });
      if (!hit) return; items = items.filter(i => i !== hit);
      if (hit.life) { miss++; left = Math.max(0, left - 3); bad(); pops.push({ x: hit.x, y: hit.y, t: 1, s: '앗! 친구예요 -3초' }); items.push(Object.assign(hit, { x: hit.x })); }
      else { got++; good(); pops.push({ x: hit.x, y: hit.y, t: 1, s: '+1' }); } });
    function loop(ts) { if (!on) return; const dt = Math.min(.05, last ? (ts - last) / 1000 : 0); last = ts;
      if (!over) { left -= dt; spawn -= dt; if (spawn <= 0 && items.length < 9) { add(); spawn = .55; }
        items.forEach(it => { it.x += it.vx * dt; it.y += it.vy * dt + Math.sin((it.ph += dt * 2)) * .4; if (it.y < 30) it.vy = Math.abs(it.vy); if (it.y > 320) it.vy = -Math.abs(it.vy); });
        items = items.filter(it => it.x > -40 && it.x < W + 40);
        if (got >= GOAL) { over = true; setTimeout(() => done(miss === 0 ? 3 : miss <= 2 ? 2 : 1, `쓰레기 ${got}개를 건졌어요! 바다거북이 자유롭게 헤엄쳐요.`), 300); }
        else if (left <= 0) { over = true; setTimeout(() => done(0, `시간이 끝났어요. ${got}개 건짐 — 15개가 목표예요.`), 300); } }
      const c = S.ctx, H = 340, g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1B7FB0'); g.addColorStop(1, '#0A3150'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(i * W / 4 + Math.sin(ts / 900 + i) * 20, 0); c.lineTo(i * W / 4 + 60, 0); c.lineTo(i * W / 4 - 40, H); c.lineTo(i * W / 4 - 90, H); c.fill(); }
      c.fillStyle = '#C9B488'; c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 30) c.lineTo(x, H - 14 - Math.sin(x / 50) * 6); c.lineTo(W, H); c.fill();
      c.font = '30px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      items.forEach(it => { c.save(); c.translate(it.x, it.y); if (it.vx < 0 && it.life) c.scale(-1, 1); c.fillText(it.e, 0, 0); c.restore(); });
      c.font = '800 15px sans-serif'; pops.forEach(p => { c.globalAlpha = p.t; c.fillStyle = p.s === '+1' ? '#B9F5D5' : '#FFC2C4'; c.fillText(p.s, p.x, p.y - (1 - p.t) * 30); p.t -= dt * 1.4; }); c.globalAlpha = 1; pops = pops.filter(p => p.t > 0);
      S.hud(`<span>🗑 건진 쓰레기 ${got} / ${GOAL}</span><span>⏱ ${Math.ceil(Math.max(0, left))}초</span><span>🐢 실수 ${miss}</span>`);
      raf = requestAnimationFrame(loop); }
    raf = requestAnimationFrame(loop); const ro = () => { W = S.size(); }; addEventListener('resize', ro);
    return () => { on = false; cancelAnimationFrame(raf); removeEventListener('resize', ro); };
  }

  /* 3) 너울 버티기: 구명조끼 → 타이밍 */
  function gSwell(el, done) {
    let on = true, raf = 0, timers = [];
    el.innerHTML = `<div class="hud" data-hud></div><div class="sbox" style="background:#0E2236"><div style="text-align:center;font-weight:800">⏱ <span data-t>10</span>초 안에 모두 구명조끼를 입혀요!</div><div class="pax">${[0, 1, 2, 3, 4].map(i => `<button type="button" data-p="${i}" aria-label="승객 ${i + 1}">🧑</button>`).join('')}</div></div>`;
    let worn = 0, tl = 10;
    el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { if (b.dataset.on === 'true') return; b.dataset.on = 'true'; b.textContent = '🦺'; worn++; good(); if (worn === 5) { clearInterval(iv); timers.push(setTimeout(phase2, 500)); } });
    const iv = setInterval(() => { tl--; const s = el.querySelector('[data-t]'); if (s) s.textContent = tl; if (tl <= 0) { clearInterval(iv); if (worn < 5) done(0, '구명조끼를 다 입히지 못했어요. 너울은 기다려 주지 않아요!'); } }, 1000);
    timers.push(() => clearInterval(iv));
    function phase2() { if (!on) return;
      el.innerHTML = `<div class="hud" data-hud></div><div class="gwrap"><canvas></canvas></div><div style="display:flex;justify-content:center;padding-top:8px"><button type="button" class="sbtn" data-hold style="font-size:18px;padding:14px 30px">✊ 꽉 잡기! (스페이스)</button></div>`;
      const cv = el.querySelector('canvas'), c = cv.getContext('2d'), wrap = el.querySelector('.gwrap'), dpr = Math.min(2, devicePixelRatio || 1), H = 220;
      let W = 360; const size = () => { W = Math.max(280, wrap.clientWidth || 360); cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px'; c.setTransform(dpr, 0, 0, dpr, 0, 0); }; size();
      const TOTAL = 8, ZX = 70; let waves = [], sent = 0, okN = 0, res = 0, next = .8, last = 0, msg = '', mt = 0, shake = 0, over = false;
      function hold() { if (over) return; const w = waves.find(w => !w.done && Math.abs(w.x - ZX) < 60); if (!w) { msg = '아직이에요!'; mt = .7; beep(220, .1); return; }
        w.done = true; res++; if (Math.abs(w.x - ZX) < 26) { okN++; msg = '좋아요! 꽉 잡았어요'; good(); } else { msg = '조금 어긋났어요'; shake = .5; bad(); } mt = .8; }
      el.querySelector('[data-hold]').onclick = hold;
      const kd = e => { if (e.code === 'Space') { e.preventDefault(); hold(); } }; addEventListener('keydown', kd); timers.push(() => removeEventListener('keydown', kd));
      function loop(ts) { if (!on) return; const dt = Math.min(.05, last ? (ts - last) / 1000 : 0); last = ts;
        if (!over) { next -= dt; if (next <= 0 && sent < TOTAL) { waves.push({ x: W + 30, done: false, v: 150 + Math.random() * 40 }); sent++; next = 1 + Math.random() * .8; }
          waves.forEach(w => { w.x -= w.v * dt; if (!w.done && w.x < ZX - 40) { w.done = true; res++; msg = '놓쳤어요! 휘청~'; mt = .8; shake = .6; bad(); } });
          waves = waves.filter(w => w.x > -60);
          if (res >= TOTAL) { over = true; const st = okN >= 8 ? 3 : okN >= 7 ? 2 : okN >= 6 ? 1 : 0; setTimeout(() => done(st, st ? `너울 ${okN}/8번을 잘 버텼어요. 모두 무사해요!` : `너울 ${okN}/8번 — 6번 이상 버텨야 해요.`), 400); } }
        const sx = shake > 0 ? Math.sin(ts / 20) * 6 * shake : 0; shake = Math.max(0, shake - dt); mt = Math.max(0, mt - dt);
        c.save(); c.translate(sx, 0); const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5C6E86'); g.addColorStop(1, '#1D3A56'); c.fillStyle = g; c.fillRect(-10, 0, W + 20, H);
        c.fillStyle = 'rgba(245,196,107,.25)'; c.fillRect(ZX - 26, 40, 52, 150); c.strokeStyle = '#F5C46B'; c.lineWidth = 2; c.strokeRect(ZX - 26, 40, 52, 150);
        c.fillStyle = '#F2F5F8'; c.beginPath(); c.moveTo(ZX - 30, 150); c.lineTo(ZX + 34, 150); c.lineTo(ZX + 24, 170); c.lineTo(ZX - 22, 170); c.fill(); c.font = '20px "Segoe UI Emoji",sans-serif'; c.textAlign = 'center'; c.fillText('🦺', ZX, 140);
        waves.forEach(w => { if (w.done) c.globalAlpha = .3; c.fillStyle = '#2C86B8'; c.beginPath(); c.moveTo(w.x - 40, 190); c.quadraticCurveTo(w.x - 10, 70, w.x + 30, 90); c.quadraticCurveTo(w.x + 5, 110, w.x + 40, 190); c.fill(); c.strokeStyle = '#E8F8FF'; c.lineWidth = 4; c.beginPath(); c.moveTo(w.x - 22, 120); c.quadraticCurveTo(w.x, 76, w.x + 30, 90); c.stroke(); c.globalAlpha = 1; });
        c.fillStyle = '#18476A'; c.fillRect(-10, 186, W + 20, 40);
        if (mt > 0) { c.font = '800 18px sans-serif'; c.fillStyle = '#fff'; c.fillText(msg, W / 2, 30); }
        c.restore();
        const hud = el.querySelector('[data-hud]'); if (hud) hud.innerHTML = `<span>🌊 너울 ${res} / ${TOTAL}</span><span>✊ 잘 버팀 ${okN}</span><span class="muted">노란 칸에 닿을 때 누르기</span>`;
        raf = requestAnimationFrame(loop); }
      raf = requestAnimationFrame(loop); addEventListener('resize', size); timers.push(() => removeEventListener('resize', size)); }
    return () => { on = false; cancelAnimationFrame(raf); timers.forEach(t => typeof t === 'function' ? t() : clearTimeout(t)); };
  }

  /* 4) 물때 퍼즐: 물 높이 곡선(약 12시간 25분 주기 — 하루 두 번 들고 남, 연습용 모형) */
  function gTide(el, done) {
    // 간조(가장 낮은 때)가 낮 9~14시쯤 오도록 → 날마다 답이 2시간 넘게 있음
    const ROUNDS = [9.3, 13, 11].map(low => low + Math.random() * 1.2 - 6.21), TRIP = 2.5, LINE = 35, D0 = 6, D1 = 18;
    let r = 0, fails = 0, on = true, raf = 0;
    const hAt = (t, ph) => 50 + 45 * Math.cos(2 * Math.PI * (t - ph) / 12.42);
    const fmt = t => { const h = Math.floor(t), m = Math.round((t - h) * 60); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; };
    function round() {
      const ph = ROUNDS[r];
      el.innerHTML = `<div class="hud"><span>🗓 ${r + 1} / 3번째 날</span><span>❌ 실패 ${fails}</span></div>
        <div class="gwrap"><canvas></canvas></div>
        <div class="sbox"><div>출발 시각: <b data-st></b> → 돌아오는 시각: <b data-en></b></div>
        <input type="range" min="${D0 * 4}" max="${(D1 - TRIP) * 4}" step="1" value="${D0 * 4}" aria-label="출발 시각">
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="sbtn" data-go>🚶 이 시각에 출발</button><span class="muted">파란 선 = 물 높이 · 빨간 점선 = 이보다 낮아야 바닷길이 열려요 · 회색 = 밤(출발 안 함)</span></div></div>`;
      const cv = el.querySelector('canvas'), c = cv.getContext('2d'), wrap = el.querySelector('.gwrap'), dpr = Math.min(2, devicePixelRatio || 1), H = 220, rng = el.querySelector('input');
      let W = 360; const size = () => { W = Math.max(280, wrap.clientWidth || 360); cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px'; c.setTransform(dpr, 0, 0, dpr, 0, 0); draw(); };
      const X = t => 30 + (W - 40) * t / 24, Y = h => H - 24 - (H - 44) * h / 100;
      let anim = null;
      function draw() { const s = rng.value / 4; c.fillStyle = '#0D1B2C'; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(X(0), 0, X(D0) - X(0), H); c.fillRect(X(D1), 0, X(24) - X(D1), H);
        c.fillStyle = 'rgba(245,196,107,.18)'; c.fillRect(X(s), 10, X(s + TRIP) - X(s), H - 34);
        c.strokeStyle = '#FF7B7B'; c.setLineDash([5, 5]); c.beginPath(); c.moveTo(X(0), Y(LINE)); c.lineTo(X(24), Y(LINE)); c.stroke(); c.setLineDash([]);
        c.strokeStyle = '#4FC3F7'; c.lineWidth = 3; c.beginPath(); for (let t = 0; t <= 24; t += .1) c.lineTo(X(t), Y(hAt(t, ph))); c.stroke(); c.lineWidth = 1;
        c.fillStyle = '#9AA5B1'; c.font = '11px sans-serif'; c.textAlign = 'center'; for (let t = 0; t <= 24; t += 3) c.fillText(t + '시', X(t), H - 8);
        if (anim) { const t = anim.t, hx = X(t), hy = Y(hAt(t, ph)); c.fillStyle = hAt(t, ph) < LINE ? '#6FD3A4' : '#FF8A8D'; c.beginPath(); c.arc(hx, hy, 7, 0, 7); c.fill(); c.font = '18px "Segoe UI Emoji",sans-serif'; c.fillText('🚶', hx, hy - 14); }
        el.querySelector('[data-st]').textContent = fmt(s); el.querySelector('[data-en]').textContent = fmt(s + TRIP); }
      rng.oninput = draw; size(); addEventListener('resize', size);
      el.querySelector('[data-go]').onclick = () => { if (anim) return; const s = rng.value / 4; let okAll = true, minH = 99; for (let t = s; t <= s + TRIP + 1e-6; t += .05) { const h = hAt(t, ph); if (h >= LINE) okAll = false; } rng.disabled = true;
        anim = { t: s }; let t0 = null;
        const step = now => { if (!on) return; if (t0 == null) t0 = now; anim.t = Math.min(s + TRIP, s + (now - t0) / 1000 * 1.4); draw(); if (anim.t < s + TRIP && !(hAt(anim.t, ph) >= LINE && !okAll && anim.t > s)) { raf = requestAnimationFrame(step); return; }
          removeEventListener('resize', size);
          if (okAll) { good(); r++; if (r >= 3) done(Math.max(1, 3 - fails), `3일 모두 물때에 맞춰 다녀왔어요! 등대 부품을 찾았어요.`); else { const b = el.querySelector('[data-go]'); b.textContent = '✔ 무사히 돌아왔어요! 다음 날 ▶'; b.onclick = round; } }
          else { bad(); fails++; const b = el.querySelector('[data-go]'); b.textContent = '🌊 물이 차올랐어요! 다시 고르기'; b.onclick = round; } };
        raf = requestAnimationFrame(step); };
      stopR = () => removeEventListener('resize', size);
    }
    let stopR = () => {};
    round();
    return () => { on = false; cancelAnimationFrame(raf); stopR(); };
  }

  /* 5) 등대 불빛 기억하기 + 122 퀴즈 */
  function gLamp(el, done) {
    const L = [['빨강', '#FF5A5A', 392], ['초록', '#3BD67A', 494], ['노랑', '#FFD34E', 587], ['하양', '#F4F7FA', 659]];
    let seq = [], inp = 0, lives = 3, busy = true, on = true, timers = [];
    el.innerHTML = `<div class="hud" data-hud></div><div class="sbox" style="background:#081426"><div style="text-align:center;font-weight:800" data-say>불빛을 잘 보세요…</div><div class="lamps">${L.map(([n, c], i) => `<button type="button" data-l="${i}" style="background:${c};color:${c}"><span style="color:#0B1220">${n}</span></button>`).join('')}</div></div>`;
    const hud = () => { el.querySelector('[data-hud]').innerHTML = `<span>💡 ${seq.length} / 6 개</span><span>❤️ ${'♥'.repeat(lives)}</span>`; };
    const say = s => { el.querySelector('[data-say]').textContent = s; };
    const btn = i => el.querySelector(`[data-l="${i}"]`);
    function flash(i, d) { const b = btn(i); if (!b) return; b.classList.add('on'); beep(L[i][2], d / 1000, 'triangle', .1); timers.push(setTimeout(() => b.classList.remove('on'), d)); }
    function play() { busy = true; inp = 0; say('불빛을 잘 보세요…'); hud(); seq.forEach((v, k) => timers.push(setTimeout(() => flash(v, 420), 600 + k * 650))); timers.push(setTimeout(() => { busy = false; say('이제 같은 순서로 눌러요!'); }, 600 + seq.length * 650)); }
    function grow() { seq.push(Math.random() * 4 | 0); play(); }
    el.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { if (busy || !on) return; const i = +b.dataset.l; flash(i, 220);
      if (i !== seq[inp]) { lives--; bad(); hud(); if (lives <= 0) { busy = true; timers.push(setTimeout(() => done(0, '불빛 순서가 헷갈렸어요. 천천히 다시 해 봐요!'), 500)); return; } say('앗, 순서가 달라요! 다시 보여 줄게요'); busy = true; timers.push(setTimeout(play, 900)); return; }
      inp++; if (inp === seq.length) { busy = true; if (seq.length >= 6) { good(); timers.push(setTimeout(quiz, 700)); } else { say('좋아요!'); timers.push(setTimeout(grow, 800)); } } });
    function quiz() { if (!on) return; el.innerHTML = `<div class="sbox" style="text-align:center"><div class="badge">💡✨</div><b>등대가 켜졌어요! 마지막 문제</b><div>바다에서 사람이 물에 빠졌을 때 해양경찰에 신고하는 번호는?</div><div class="quiz">${['119', '122', '112', '114'].map(n => `<button type="button" class="sbtn ghost" data-q="${n}">${n}</button>`).join('')}</div><div class="muted" data-qm></div></div>`;
      el.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { if (b.dataset.q === '122') { good(); done(lives, '정답! 바다 사고는 122(해양경찰), 육지 화재·응급은 119예요.'); } else { bad(); el.querySelector('[data-qm]').textContent = b.dataset.q === '119' ? '119도 도와주지만, 바다에서는 해양경찰 122가 가장 빨라요. 다시 골라 보세요.' : '다시 골라 보세요. (112는 경찰, 114는 안내)'; } }); }
    seq = [Math.random() * 4 | 0, Math.random() * 4 | 0]; grow();
    return () => { on = false; timers.forEach(clearTimeout); };
  }

  /* 6) 출조 가방 싸기 + 날씨 문제 (시즌 2 · 6화) */
  function gPack(el, done) {
    const NEED = [['🦺', '구명조끼'], ['🪪', '신분증'], ['💧', '마실 물'], ['🧢', '모자'], ['👟', '미끄럽지 않은 신발'], ['🛍️', '쓰레기봉투'], ['🧥', '여벌 겉옷'], ['🧤', '장갑']];
    const NO = [['🩴', '슬리퍼', '젖은 갑판에서 미끄러져요!'], ['🍾', '유리병', '깨지면 다쳐요. 바다에 떨어지면 쓰레기가 돼요.'], ['🎈', '풍선', '바람에 날아가 바다 쓰레기가 돼요.'], ['👠', '굽 높은 신발', '흔들리는 배에서 넘어지기 쉬워요.']];
    const cards = NEED.map(x => ({ e: x[0], n: x[1], ok: true })).concat(NO.map(x => ({ e: x[0], n: x[1], ok: false, why: x[2] })));
    for (let i = cards.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [cards[i], cards[j]] = [cards[j], cards[i]]; }
    let on = true, left = 30, got = 0, miss = 0, over = false, timers = [];
    el.innerHTML = `<div class="hud" data-hud></div><div class="sbox" style="background:#0E2236"><div style="text-align:center;font-weight:800" data-say>바다에 꼭 필요한 물건만 눌러 가방에 넣어요!</div>
      <div class="pack">${cards.map((c, k) => `<button type="button" data-c="${k}" aria-label="${esc(c.n)}"><span>${c.e}</span><small>${esc(c.n)}</small></button>`).join('')}</div>
      <div style="text-align:center;font-size:28px" data-bag aria-label="가방">🎒</div></div>`;
    const hud = () => { const h = el.querySelector('[data-hud]'); if (h) h.innerHTML = `<span>🎒 챙긴 물건 ${got} / ${NEED.length}</span><span>⏱ ${Math.max(0, Math.ceil(left))}초</span><span>❌ 실수 ${miss}</span>`; };
    const say = s => { const d = el.querySelector('[data-say]'); if (d) d.textContent = s; };
    hud();
    el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { if (over || !on || b.disabled) return; const c = cards[+b.dataset.c];
      if (c.ok) { b.disabled = true; b.dataset.in = 'true'; got++; good(); el.querySelector('[data-bag]').textContent = '🎒 ' + cards.filter((x, k) => x.ok && el.querySelector(`[data-c="${k}"]`).dataset.in).map(x => x.e).join(''); say(`좋아요! ${c.n} 챙겼어요.`);
        if (got === NEED.length) { over = true; clearInterval(iv); timers.push(setTimeout(quiz, 600)); } }
      else { miss++; left = Math.max(0, left - 3); bad(); b.dataset.no = 'true'; say(`앗! ${c.n}: ${c.why} (-3초)`); }
      hud(); });
    const iv = setInterval(() => { if (!on || over) return; left -= 1; hud(); if (left <= 0) { over = true; clearInterval(iv); done(0, `시간이 끝났어요. ${got}개 챙김 — 꼭 필요한 물건 8개를 모두 넣어야 해요.`); } }, 1000);
    timers.push(() => clearInterval(iv));
    function quiz() { if (!on) return;
      el.innerHTML = `<div class="sbox" style="text-align:center"><div class="badge">🎒✨</div><b>가방 완성! 마지막 문제</b><div>출조 전날 밤, 바다에 풍랑주의보가 떴어요. 어떻게 할까요?</div>
        <div class="quiz">${[['a', '그래도 새벽에 몰래 나간다'], ['b', '선장님 안내를 듣고 출조를 미룬다'], ['c', '구명조끼만 입으면 괜찮다']].map(([k, t]) => `<button type="button" class="sbtn ghost" data-q="${k}">${t}</button>`).join('')}</div><div class="muted" data-qm></div></div>`;
      el.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { if (b.dataset.q === 'b') { good(); done(miss === 0 ? 3 : miss <= 1 ? 2 : 1, `정답! 주의보가 뜨면 바다는 쉬어 가요. 가방 ${NEED.length}개 완벽 · 실수 ${miss}번.`); }
        else { bad(); el.querySelector('[data-qm]').textContent = b.dataset.q === 'c' ? '구명조끼는 꼭 입지만, 큰 바람·높은 파도 날엔 그것만으로 안전하지 않아요. 다시 골라 보세요.' : '주의보 날 몰래 나가는 건 아주 위험해요. 다시 골라 보세요.'; } }); }
    return () => { on = false; timers.forEach(t => typeof t === 'function' ? t() : clearTimeout(t)); };
  }

  /* 7) 승선 순서 맞히기 → 위험한 행동 찾기 (시즌 2 · 7화) */
  function gBoard(el, done) {
    const STEPS = [['📝', '승선 명부 쓰기'], ['🪪', '신분증 보여 드리기'], ['🦺', '구명조끼 입기'], ['📢', '선장님 안전 안내 듣기'], ['🪑', '정해진 자리에 앉기']];
    const ACTS = [['🏃', '갑판에서 뛰어다니기', true, '젖은 갑판에서 미끄러져 넘어지거나 바다에 빠질 수 있어요.'], ['🦵', '뱃전에 걸터앉기', true, '배가 흔들리면 바다로 떨어질 수 있어요.'], ['🎣', '바늘 단 채 낚싯대 휘두르기', true, '옆 사람이 바늘에 다칠 수 있어요.'], ['🦺', '더워서 구명조끼 벗기', true, '구명조끼는 배 위에서 내내 입어요.'],
      ['✊', '손잡이 잡고 걷기', false], ['🧰', '바늘은 통에 넣어 두기', false], ['🗑️', '쓰레기는 봉투에 모으기', false], ['🙋', '멀미 나면 선장님께 말하기', false]];
    let on = true, lives = 3, miss = 0, timers = [];
    const shuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
    function phase1() {
      let next = 0; const order = shuf(STEPS.map((s, k) => k));
      el.innerHTML = `<div class="hud" data-hud></div><div class="sbox" style="background:#0E2236"><div style="text-align:center;font-weight:800" data-say>배에 오르는 순서대로 눌러요! (1번부터)</div>
        <div class="steps">${order.map(k => `<button type="button" data-s="${k}"><span>${STEPS[k][0]}</span>${esc(STEPS[k][1])}</button>`).join('')}</div><ol class="done" data-list></ol></div>`;
      const hud = () => { el.querySelector('[data-hud]').innerHTML = `<span>⛴ 순서 ${next} / ${STEPS.length}</span><span>❤️ ${'♥'.repeat(Math.max(0, lives))}</span>`; };
      const say = s => { el.querySelector('[data-say]').textContent = s; };
      hud();
      el.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { if (!on || b.disabled || lives <= 0) return; const k = +b.dataset.s;
        if (k === next) { b.disabled = true; b.dataset.ok = 'true'; next++; good(); el.querySelector('[data-list]').insertAdjacentHTML('beforeend', `<li>${STEPS[k][0]} ${esc(STEPS[k][1])}</li>`); say(next < STEPS.length ? `좋아요! 다음은?` : '배에 잘 올랐어요!'); hud();
          if (next === STEPS.length) timers.push(setTimeout(phase2, 700)); }
        else { lives--; miss++; bad(); hud(); say(`앗, 아직이에요! 「${STEPS[next][1]}」를 먼저 해야 해요.`);
          if (lives <= 0) timers.push(setTimeout(() => done(0, '순서가 헷갈렸어요. 명부·신분증 → 구명조끼 → 안전 안내 → 자리 순서예요!'), 600)); } });
    }
    function phase2() { if (!on) return;
      const cards = shuf(ACTS); let found = 0; const NEED = ACTS.filter(a => a[2]).length;
      el.innerHTML = `<div class="hud" data-hud></div><div class="sbox" style="background:#0E2236"><div style="text-align:center;font-weight:800" data-say>배 위에서 위험한 행동 ${NEED}개를 찾아 눌러요!</div>
        <div class="pack">${cards.map((c, k) => `<button type="button" data-a="${k}" aria-label="${esc(c[1])}"><span>${c[0]}</span><small>${esc(c[1])}</small></button>`).join('')}</div></div>`;
      const hud = () => { el.querySelector('[data-hud]').innerHTML = `<span>⚠️ 찾은 위험 ${found} / ${NEED}</span><span>❤️ ${'♥'.repeat(Math.max(0, lives))}</span>`; };
      const say = s => { el.querySelector('[data-say]').textContent = s; };
      hud();
      el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { if (!on || b.disabled || lives <= 0) return; const c = cards[+b.dataset.a]; b.disabled = true;
        if (c[2]) { found++; b.dataset.no = 'true'; good(); say(`맞아요! ${c[3]}`); hud();
          if (found === NEED) timers.push(setTimeout(() => done(miss === 0 ? 3 : miss <= 1 ? 2 : 1, `안전하게 출발했어요! 순서·위험 찾기 실수 ${miss}번.`), 700)); }
        else { lives--; miss++; b.dataset.in = 'true'; bad(); hud(); say(`「${c[1]}」는 안전한 행동이에요!`);
          if (lives <= 0) timers.push(setTimeout(() => done(0, '안전한 행동을 위험하다고 골랐어요. 다시 찾아봐요!'), 600)); } });
    }
    phase1();
    return () => { on = false; timers.forEach(clearTimeout); };
  }

  const GAMES = { buoy: gBuoy, clean: gClean, swell: gSwell, tide: gTide, lamp: gLamp, pack: gPack, board: gBoard };

  /* ---------- 화면 ---------- */
  function view(el, opts) {
    css(); opts = opts || {};
    const P = Object.assign({ at: 0, stars: {} }, lsGet(KEY, {}));
    const save = () => lsSet(KEY, P);
    const unlocked = i => i === 0 || (P.stars[i - 1] || 0) > 0;
    let stops = [];
    const stopAll = () => { stops.forEach(f => { try { f(); } catch (e) {} }); stops = []; };
    function render(scrollGame) {
      stopAll();
      const i = Math.max(0, Math.min(EP.length - 1, P.at)), e = EP[i], si = seasonOf(i), S = SEASONS[si];
      const sDone = s => { for (let k = s[1]; k < s[2]; k++) if (k >= EP.length || !((P.stars[k] || 0) > 0)) return false; return true; };
      const sStars = s => { let n = 0; for (let k = s[1]; k < s[2]; k++) n += P.stars[k] || 0; return n; };
      const allDone = sDone(S), total = sStars(S), maxStars = (S[2] - S[1]) * 3;
      const slots = []; for (let k = S[1]; k < S[2]; k++) slots.push(k);
      el.innerHTML = `<div class="saga">
        <div class="sbox">${SEASONS.length > 1 ? `<div class="stabs">${SEASONS.map((s, k) => `<button type="button" data-season="${k}" aria-pressed="${k === si}">시즌 ${k + 1}${sDone(s) ? ' ' + s[3] : ''}</button>`).join('')}</div>` : ''}
          <div class="sttl">🗺 물결이 모험 시즌 ${si + 1} 「${esc(S[0])}」</div>
          <div class="muted">만화 한 화를 보고 → 그 화 게임을 깨면 → 다음 화가 열려요. 모은 별 ⭐ ${total} / ${maxStars}${allDone ? ` · ${S[3]} ${esc(S[4])}` : ''}${S[2] > EP.length ? ` · ${EP.length - S[1]}화 공개 — 매일 한 화씩 이어져요` : ''}</div>
          <div class="smap">${slots.map((k, n) => { const x = EP[k]; const line = n ? '<span class="line"></span>' : '';
            if (!x) return `${line}<button type="button" class="node" data-st="soon" disabled title="곧 공개 — 매일 한 화씩">📅</button>`;
            return `${line}<button type="button" class="node" data-ep="${k}" data-st="${(P.stars[k] || 0) > 0 ? 'done' : unlocked(k) ? 'open' : 'lock'}" aria-current="${k === i}" ${unlocked(k) ? '' : 'disabled'} title="${esc(x[0])}">${unlocked(k) ? (k + 1) + ((P.stars[k] || 0) ? ' ' + '★'.repeat(P.stars[k]) : '') : '🔒'}</button>`; }).join('')}</div></div>
        <div data-comic></div>
        <div class="sbox" data-gamebox><div class="sttl">${e[4]} <span class="muted">— ${i + 1}화 게임</span></div><div class="muted">${esc(e[5])}</div>
          ${(P.stars[i] || 0) ? `<div>지난 기록 <span class="stars" style="font-size:18px">${starTxt(P.stars[i])}</span></div>` : ''}
          <div data-game><button type="button" class="sbtn" data-start>▶ 게임 시작</button></div></div>
        ${allDone ? `<div class="sbox" style="text-align:center"><div class="badge">${S[3]}</div><b>시즌 ${si + 1} 완주! 「${esc(S[4])}」 배지</b><div class="muted">${esc(S[5])} ${si + 1 < SEASONS.length ? `위의 「시즌 ${si + 2}」 버튼으로 다음 이야기를 이어 보세요.` : '다음 시즌은 매일 업데이트에서 이어집니다.'}</div></div>` : ''}
        <div class="muted">그림·이야기·게임은 이 앱이 직접 만든 고유 캐릭터예요. 기록은 이 기기에만 저장돼요. 물때 퍼즐의 그래프는 연습용 모형이에요 — 실제 바닷길은 「물때」 탭과 현지 안내를 확인하세요.</div>
      </div>`;
      el.querySelectorAll('[data-ep]').forEach(b => b.onclick = () => { const k = +b.dataset.ep; if (!unlocked(k)) return; P.at = k; save(); render(); });
      el.querySelectorAll('[data-season]').forEach(b => b.onclick = () => { const s = SEASONS[+b.dataset.season]; if (s[1] >= EP.length) return;
        if (!unlocked(s[1])) { toast(`시즌 ${+b.dataset.season + 1} 「${s[0]}」 — 앞 시즌 마지막 화 게임을 깨면 열려요.`); return; }
        let k = s[1]; while (k + 1 < Math.min(s[2], EP.length) && (P.stars[k] || 0) > 0) k++; P.at = k; save(); render(); });
      const cbox = el.querySelector('[data-comic]');
      const comic = [e[0], e[1], e[2]];
      if (window.Comic3D) {
        const shareTxt = () => `🧜 물결이 모험 시즌${si + 1} ${i + 1}화 「${e[0]}」\n` + e[1].map((p, j) => `${j + 1}. ${p[1]}`).join('\n') + `\n💡 ${e[2]}\n— 출조 관제 우주 프로 https://kimcheol-ops.github.io/sunsang-mobile/`;
        stops.push(Comic3D.view(cbox, { comic, idx: i, total: EP.length, onNav: d => { const k = i + d; if (k < 0 || k >= EP.length) return; if (!unlocked(k)) { toast('이 화 게임을 깨면 다음 화가 열려요! 아래 「게임 시작」을 눌러 보세요.'); el.querySelector('[data-gamebox]').scrollIntoView({ block: 'center', behavior: 'smooth' }); return; } P.at = k; save(); render(); },
          share: async b => { try { await navigator.clipboard.writeText(shareTxt()); b.textContent = '✔ 복사했어요'; } catch (x) { prompt('아래 글을 복사하세요', shareTxt()); } } }) || (() => {}));
      } else cbox.innerHTML = `<div class="sbox"><b>${i + 1}화 「${esc(e[0])}」</b>${e[1].map((p, j) => `<div>${j + 1}. ${esc(p[1])}</div>`).join('')}<div>💡 ${esc(e[2])}</div></div>`;
      function toast(s) { let t = el.querySelector('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; el.querySelector('[data-gamebox]').prepend(t); } t.textContent = s; }
      const gbox = el.querySelector('[data-game]');
      const start = () => { stopAll2(); const fn = GAMES[e[3]];
        const g = fn(gbox, (stars, msg) => {
          if (stars > 0) { P.stars[i] = Math.max(P.stars[i] || 0, stars); save(); }
          const nextOpen = stars > 0 && i + 1 < EP.length;
          const ov = document.createElement('div'); ov.className = 'sbox'; ov.style.textAlign = 'center';
          ov.innerHTML = `<b style="font-size:18px">${stars > 0 ? '🎉 성공!' : '😅 아쉬워요'}</b><div class="stars">${starTxt(stars)}</div><div>${esc(msg)}</div>
            <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button type="button" class="sbtn ghost" data-again>↻ 다시 하기</button>${nextOpen ? `<button type="button" class="sbtn" data-next>📖 ${i + 2}화 보러 가기 ▶</button>` : ''}${stars > 0 && i + 1 === S[2] ? `<button type="button" class="sbtn" data-fin>${S[3]} 완주 배지 보기</button>` : ''}</div>${stars > 0 && i + 1 === EP.length && i + 1 < S[2] ? '<div class="muted">🆕 다음 화는 매일 업데이트에서 하루에 한 화씩 공개돼요. 내일 또 만나요!</div>' : ''}`;
          gbox.innerHTML = ''; gbox.appendChild(ov); stopAll2();
          ov.querySelector('[data-again]').onclick = start;
          const n = ov.querySelector('[data-next]'); if (n) n.onclick = () => { P.at = i + 1; save(); render(); el.scrollIntoView({ block: 'start' }); };
          const f = ov.querySelector('[data-fin]'); if (f) f.onclick = () => render();
        });
        gstop = g || (() => {}); };
      let gstop = () => {}; const stopAll2 = () => { try { gstop(); } catch (x) {} gstop = () => {}; };
      stops.push(() => stopAll2());
      el.querySelector('[data-start]').onclick = start;
      if (scrollGame) el.querySelector('[data-gamebox]').scrollIntoView({ block: 'center' });
    }
    render();
    if (opts.setStop) opts.setStop(stopAll);
    return stopAll;
  }

  window.Saga = { view, EP, SEASONS, GAMES: Object.keys(GAMES) };
})();
