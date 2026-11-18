/* 🎬 홍보 쇼츠 만들기 — 브라우저에서 무료로 만드는 15~30초 세로 영상
   canvas + MediaRecorder → webm(또는 mp4). 사진은 기기 안에서만 쓰고 어디에도 올리지 않음.
   배경음은 WebAudio로 앱이 직접 만든 소리(저작권 걱정 없음). 자동 업로드 없음 — 사용자가 직접 올림. */
(function () {
  'use strict';
  const LS = 'promo.v1';
  const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const TPL = {
    catch: { ic: '🐟', name: '조과 자랑', title: '오늘의 조과!', lines: ['쭈꾸미 38마리', '바닥 찍고 콩콩, 스테이가 정답', '다음 물때에 또 가요!'], foot: '작은 고기는 돌려보냈어요 🙂' },
    ship: { ic: '⛴', name: '우리 배 홍보', title: '○○호 선상낚시', lines: ['초보도 환영 · 채비 대여', '따뜻한 선실 · 깨끗한 화장실', '주말 쭈꾸미 · 갑오징어 출조'], foot: '예약·문의는 우리 배로 연락 주세요' },
    shop: { ic: '🏪', name: '낚시점 홍보', title: '○○낚시', lines: ['새벽 4시에 문 열어요', '오늘의 채비 · 미끼 준비 완료', '넓은 주차장'], foot: '출조 전에 들러 주세요' },
    good: { ic: '💙', name: '낚시는 좋은 것', title: '낚시는 좋은 것', lines: ['바다를 보며 쉬어 가는 하루', '구명조끼는 배에 오를 때부터', '쓰레기는 모두 가져와요'], foot: '깨끗한 바다, 즐거운 낚시' },
    gear: { ic: '🎣', name: '채비 소개', title: '내가 쓰는 채비', lines: ['봉돌 15호 + 에기 2단', '단차 30cm면 덜 엉켜요', '초보에게 추천!'], foot: '내 경험이에요 · 물때마다 달라요' }
  };
  const THEME = [
    { name: '바다', bg: ['#0B3B5A', '#1F6C8A', '#0A2A3A'], acc: '#FFE27A', card: 'rgba(255,255,255,.93)', ink: '#123' },
    { name: '노을', bg: ['#3A1C4A', '#C2554A', '#F2A65A'], acc: '#FFF1B8', card: 'rgba(255,248,236,.94)', ink: '#4A1E2A' },
    { name: '새벽', bg: ['#0E1A33', '#2B4C7E', '#8FB8DE'], acc: '#FFD27A', card: 'rgba(240,246,255,.94)', ink: '#13254A' },
    { name: '초록 섬', bg: ['#0F3A2E', '#2E7D5B', '#A8D5BA'], acc: '#FFFFFF', card: 'rgba(240,255,246,.94)', ink: '#103A2A' }
  ];
  const CSS = `
  .promo .pgrid { display: grid; grid-template-columns: minmax(0,1fr); gap: 8px; }
  .promo label.f { display: grid; gap: 2px; font-size: 12px; color: var(--f-muted, #93A8B0); }
  .promo input[type=text], .promo select { width: 100%; min-height: 32px; border-radius: 7px; border: 1px solid var(--f-line, #29404C); background: #0F1A21; color: var(--f-fg, #E6EEF0); font: inherit; padding: 0 8px; }
  .promo .tpls { display: flex; gap: 5px; flex-wrap: wrap; }
  .promo .tpls button[aria-pressed="true"], .promo .ths button[aria-pressed="true"] { background: #2B5F86; border-color: #5AA0D0; }
  .promo .ths { display: flex; gap: 5px; flex-wrap: wrap; }
  .promo .ths i { display: inline-block; width: 14px; height: 14px; border-radius: 50%; }
  .promo .thumbs { display: flex; gap: 5px; flex-wrap: wrap; }
  .promo .thumbs span { position: relative; } .promo .thumbs img { width: 48px; height: 48px; object-fit: cover; border-radius: 6px; display: block; }
  .promo .thumbs button { position: absolute; top: -6px; right: -6px; width: 20px; height: 20px; border-radius: 50%; border: 0; background: #B8322A; color: #fff; font-size: 11px; cursor: pointer; padding: 0; }
  .promo .stage { display: grid; justify-items: center; gap: 6px; }
  .promo .stage canvas { width: min(100%, 270px); aspect-ratio: 9 / 16; border-radius: 14px; background: #000; display: block; box-shadow: 0 4px 18px rgba(0,0,0,.5); }
  .promo .chk { display: flex; gap: 5px; align-items: center; font-size: 12px; }
  `;

  function mount(el, ctx) {
    ctx = ctx || {};
    if (!document.getElementById('promo-css')) { const s = document.createElement('style'); s.id = 'promo-css'; s.textContent = CSS; document.head.appendChild(s); }
    el.classList.add('promo');
    const W = 360, H = 640;
    const S = Object.assign({ tpl: 'catch', title: TPL.catch.title, lines: TPL.catch.lines.slice(), foot: TPL.catch.foot, dur: 15, theme: 0, music: true, tag: true }, lsGet(LS, {}));
    if (!TPL[S.tpl]) S.tpl = 'catch';
    S.lines = (S.lines || []).concat(['', '', '']).slice(0, 3);
    const save = () => lsSet(LS, S);
    const photos = []; // {img, url}
    let cv, g, raf = 0, playing = false, rec = null, audio = null, lastBlob = null;

    el.innerHTML = `<h3>🎬 홍보 쇼츠 만들기 <span>15~30초 세로 영상 · 무료</span></h3>
      <div class="pgrid">
        <div class="tpls" data-tpls>${Object.entries(TPL).map(([k, t]) => `<button class="btn" data-tpl="${k}">${t.ic} ${esc(t.name)}</button>`).join('')}</div>
        <label class="f">제목<input type="text" maxlength="24" data-k="title"></label>
        <label class="f">장면 문구 1<input type="text" maxlength="30" data-line="0"></label>
        <label class="f">장면 문구 2<input type="text" maxlength="30" data-line="1"></label>
        <label class="f">장면 문구 3<input type="text" maxlength="30" data-line="2"></label>
        <label class="f">마지막 문구<input type="text" maxlength="30" data-k="foot"></label>
        <div class="row"><label class="btn">📷 내 사진 넣기(최대 4장)<input type="file" accept="image/*" multiple hidden data-file></label><span class="small muted">사진은 이 기기 안에서만 써요.</span></div>
        <div class="thumbs" data-thumbs></div>
        <div class="row"><span class="small muted">색</span><div class="ths" data-ths>${THEME.map((t, i) => `<button class="btn" data-th="${i}"><i style="background:linear-gradient(${t.bg.join(',')})"></i>${t.name}</button>`).join('')}</div></div>
        <div class="row"><label class="f" style="width:auto">길이<select data-k="dur"><option value="15">15초</option><option value="20">20초</option><option value="30">30초</option></select></label>
          <label class="chk"><input type="checkbox" data-k="music"> 배경음(앱이 만든 소리)</label>
          <label class="chk"><input type="checkbox" data-k="tag"> 앱 이름 표시</label></div>
        <div class="small warn" data-warn hidden></div>
        <div class="stage"><canvas width="${W * 2}" height="${H * 2}" aria-label="홍보 쇼츠 미리보기"></canvas>
          <div class="row"><button class="btn pri" data-play>▶ 미리보기</button><button class="btn" data-rec>🎞 영상 파일로 저장</button><button class="btn" data-share hidden>📤 공유하기</button></div>
          <div class="small muted" data-msg>저장한 영상은 휴대폰에 남아요. SNS에는 직접 올려 주세요(자동으로 올리지 않아요).</div></div>
        <div class="small muted">※ 남의 사진·상표·음악은 허락받은 것만 쓰세요. 전화번호·주소는 꼭 필요할 때만 넣어요. 조과 사진에 금지체장보다 작은 고기가 보이지 않게 해 주세요.</div>
      </div>`;
    const q = s => el.querySelector(s);
    cv = q('canvas'); g = cv.getContext('2d'); g.setTransform(2, 0, 0, 2, 0, 0);

    function fill() {
      q('[data-k=title]').value = S.title; q('[data-k=foot]').value = S.foot;
      el.querySelectorAll('[data-line]').forEach(i => { i.value = S.lines[+i.dataset.line] || ''; });
      q('[data-k=dur]').value = String(S.dur); q('[data-k=music]').checked = !!S.music; q('[data-k=tag]').checked = !!S.tag;
      el.querySelectorAll('[data-tpl]').forEach(b => b.setAttribute('aria-pressed', b.dataset.tpl === S.tpl));
      el.querySelectorAll('[data-th]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.th === S.theme));
      warn();
    }
    function warn() {
      const all = [S.title, S.foot].concat(S.lines).join(' '), w = q('[data-warn]'), msgs = [];
      if (/01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}|\d{2,3}-\d{3,4}-\d{4}/.test(all)) msgs.push('📞 전화번호가 들어 있어요. 누구나 보는 영상에 올려도 괜찮은지 확인하세요.');
      if (/\d{2,6}-\d{2,6}-\d{2,8}/.test(all) && /계좌|입금|은행/.test(all)) msgs.push('💳 계좌 번호는 영상에 넣지 마세요.');
      w.hidden = !msgs.length; w.textContent = msgs.join(' ');
    }
    el.addEventListener('input', e => {
      const t = e.target;
      if (t.dataset.k === 'title' || t.dataset.k === 'foot') S[t.dataset.k] = t.value;
      else if (t.dataset.line != null) S.lines[+t.dataset.line] = t.value;
      else if (t.dataset.k === 'dur') S.dur = +t.value || 15;
      else if (t.dataset.k === 'music' || t.dataset.k === 'tag') S[t.dataset.k] = t.checked;
      else return;
      save(); warn(); if (!playing) draw(1.2);
    });
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || !el.contains(b)) return;
      if (b.dataset.tpl) { const t = TPL[b.dataset.tpl]; S.tpl = b.dataset.tpl; S.title = t.title; S.lines = t.lines.slice(); S.foot = t.foot; save(); fill(); if (!playing) draw(1.2); }
      else if (b.dataset.th != null) { S.theme = +b.dataset.th; save(); fill(); if (!playing) draw(1.2); }
      else if (b.dataset.rm != null) { const p = photos.splice(+b.dataset.rm, 1)[0]; if (p) URL.revokeObjectURL(p.url); thumbs(); if (!playing) draw(1.2); }
      else if (b.hasAttribute('data-play')) play();
      else if (b.hasAttribute('data-rec')) record();
      else if (b.hasAttribute('data-share')) share();
    });
    q('[data-file]').addEventListener('change', e => {
      const files = Array.from(e.target.files || []).filter(f => /^image\//.test(f.type)).slice(0, 4 - photos.length);
      files.forEach(f => { const url = URL.createObjectURL(f), img = new Image(); img.onload = () => { photos.push({ img, url }); thumbs(); if (!playing) draw(3); }; img.onerror = () => URL.revokeObjectURL(url); img.src = url; });
      e.target.value = '';
    });
    function thumbs() { q('[data-thumbs]').innerHTML = photos.map((p, i) => `<span><img src="${p.url}" alt="넣은 사진 ${i + 1}"><button data-rm="${i}" aria-label="사진 빼기">✕</button></span>`).join(''); }

    /* ── 그리기 ── */
    function wrap(s, maxW) { const words = String(s).split(' '), lines = []; let line = ''; words.forEach(w => { const tl = line ? line + ' ' + w : w; if (g.measureText(tl).width > maxW && line) { lines.push(line); line = w; } else line = tl; }); if (line) lines.push(line); return lines; }
    function text(s, y, size, col, bold, alpha, stroke) {
      if (!s) return 0; g.save(); g.globalAlpha = alpha == null ? 1 : alpha;
      g.font = `${bold ? 800 : 600} ${size}px 'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const ls = wrap(s, W - 48);
      ls.forEach((l, i) => { const yy = y + i * size * 1.28; if (stroke !== false) { g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = Math.max(3, size / 5); g.lineJoin = 'round'; g.strokeText(l, W / 2, yy); } g.fillStyle = col || '#fff'; g.fillText(l, W / 2, yy); });
      g.restore(); return ls.length * size * 1.28;
    }
    function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
    function bg(tt, th) {
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, th.bg[0]); gr.addColorStop(.55, th.bg[1]); gr.addColorStop(1, th.bg[2]); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 16; i++) { const bx = (i * 61 + tt * 18 * (1 + i % 3)) % W, by = H - ((tt * 36 * (1 + i % 4) + i * 89) % H); g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 1.4; g.beginPath(); g.arc(bx, by, 2.5 + i % 5, 0, 7); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,.1)'; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(0, 500 + k * 28); for (let x = 0; x <= W; x += 10) g.lineTo(x, 500 + k * 28 + Math.sin(x / 32 + tt * 2 + k) * 8); g.lineTo(W, H); g.lineTo(0, H); g.fill(); }
    }
    function fish(x, y, s, col, tt) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = col; g.beginPath(); g.ellipse(0, 0, 26, 12, 0, 0, 7); g.fill(); const w = Math.sin(tt * 8) * 5; g.beginPath(); g.moveTo(-22, 0); g.lineTo(-40, -12 + w); g.lineTo(-40, 12 + w); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(14, -3, 3.2, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(15, -3, 1.6, 0, 7); g.fill(); g.restore(); }
    function photo(p, k, i) {
      const img = p.img, z = 1.04 + k * .12, iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height; if (!iw || !ih) return;
      const sc = Math.max(W / iw, H / ih) * z, dw = iw * sc, dh = ih * sc, dir = i % 2 ? 1 : -1;
      g.drawImage(img, (W - dw) / 2 + dir * (k - .5) * (dw - W) * .4, (H - dh) / 2 + (k - .5) * (dh - H) * .3, dw, dh);
      const sh = g.createLinearGradient(0, H * .45, 0, H); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.75)'); g.fillStyle = sh; g.fillRect(0, 0, W, H);
    }
    function plan() {
      const lines = S.lines.map(s => (s || '').trim()).filter(Boolean), n = Math.max(1, lines.length || photos.length), intro = 2.5, outro = 3, mid = (S.dur - intro - outro) / n;
      return { lines, n, intro, outro, mid };
    }
    function draw(tt) {
      const th = THEME[S.theme] || THEME[0], t = TPL[S.tpl], P = plan(), end = S.dur - P.outro;
      bg(tt, th);
      if (tt < P.intro) {
        const k = Math.min(1, tt / .7), bounce = 1 + Math.sin(Math.min(1, tt / .9) * Math.PI) * .15;
        if (photos[0]) { g.globalAlpha = .45; photo(photos[0], tt / S.dur, 0); g.globalAlpha = 1; g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, W, H); }
        g.save(); g.translate(W / 2, 220); g.scale(bounce * k, bounce * k); g.font = "90px 'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t.ic, 0, 0); g.restore();
        text(S.title || t.title, 330, 34, th.acc, true, k);
        text(t.name, 390 + (1 - k) * 20, 16, '#fff', false, k * .85);
      } else if (tt < end) {
        const i = Math.min(P.n - 1, Math.floor((tt - P.intro) / P.mid)), k = ((tt - P.intro) - i * P.mid) / P.mid, a = Math.min(1, k * 4, (1 - k) * 6);
        if (photos.length) photo(photos[i % photos.length], k, i);
        else for (let f = 0; f < 5; f++) fish(((f * 97 + tt * (30 + f * 9)) % (W + 120)) - 60, 150 + f * 75 + Math.sin(tt * 2 + f) * 10, .8 + (f % 3) * .25, ['#FFB45A', '#7FD6E8', '#F48FB1', '#A5D66F', '#FFE27A'][f], tt + f);
        const line = P.lines[i] || '';
        if (line) { g.save(); g.globalAlpha = a; g.font = "800 26px 'Malgun Gothic',sans-serif"; const n = wrap(line, W - 48).length, h = n * 26 * 1.28 + 30, y = photos.length ? H - 150 - h / 2 : H / 2 - 40; g.fillStyle = photos.length ? 'rgba(0,0,0,.35)' : th.card; rr(18, y - h / 2 + (1 - a) * 16, W - 36, h, 18); g.fill(); g.restore();
          text(line, (photos.length ? H - 150 : H / 2 - 40) - (n - 1) * 26 * .64 + (1 - a) * 16, 26, photos.length ? '#fff' : th.ink, true, a, !!photos.length); }
        g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(0, 0, W, 46); text(`${t.ic} ${S.title || t.title}`, 23, 16, '#fff', true, 1, false);
        g.fillStyle = 'rgba(255,255,255,.85)'; g.font = "700 12px sans-serif"; g.textAlign = 'right'; g.fillText(`${i + 1} / ${P.n}`, W - 12, 62);
      } else {
        const k = Math.min(1, (tt - end) / .6);
        if (photos.length) { g.globalAlpha = .35; photo(photos[photos.length - 1], 1, 1); g.globalAlpha = 1; }
        g.save(); g.globalAlpha = k; g.fillStyle = th.card; rr(24, 210, W - 48, 170, 20); g.fill(); g.restore();
        text(S.title || t.title, 250, 22, th.ink, true, k, false);
        text(S.foot || '', 310, 20, th.ink, true, k, false);
        if (S.tag) text('출조 관제 우주 프로로 만들었어요', 470, 13, '#EAF6FF', false, k * .9);
        fish(W / 2 + Math.sin(tt * 2) * 60, 560, 1, th.acc, tt);
      }
      g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, H - 4, W, 4); g.fillStyle = th.acc; g.fillRect(0, H - 4, W * Math.min(1, tt / S.dur), 4);
    }

    /* ── 배경음: 앱이 직접 만드는 5음계 멜로디 ── */
    function startMusic(dur, toRec) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC || !S.music) return null;
      const ac = new AC(), out = ac.createGain(); out.gain.value = .18;
      const dest = toRec && ac.createMediaStreamDestination ? ac.createMediaStreamDestination() : null;
      out.connect(ac.destination); if (dest) out.connect(dest);
      const scale = [0, 2, 4, 7, 9, 12, 14, 16], base = [220, 196, 247, 262][S.theme] || 220, beat = .3, t0 = ac.currentTime + .05;
      let seed = (S.title || 'x').split('').reduce((a, c) => a + c.charCodeAt(0), 7);
      const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      for (let i = 0; i * beat < dur - .3; i++) {
        const tt = t0 + i * beat, bar = Math.floor(i / 8);
        if (i % 2 === 0 || rnd() > .55) { const o = ac.createOscillator(), e = ac.createGain(); o.type = 'triangle'; o.frequency.value = base * Math.pow(2, scale[Math.floor(rnd() * scale.length)] / 12); e.gain.setValueAtTime(0, tt); e.gain.linearRampToValueAtTime(.5, tt + .02); e.gain.exponentialRampToValueAtTime(.001, tt + beat * 1.6); o.connect(e); e.connect(out); o.start(tt); o.stop(tt + beat * 1.7); }
        if (i % 4 === 0) { const o = ac.createOscillator(), e = ac.createGain(); o.type = 'sine'; o.frequency.value = base / 2 * Math.pow(2, [0, 5, 7, 3][bar % 4] / 12); e.gain.setValueAtTime(.0001, tt); e.gain.linearRampToValueAtTime(.45, tt + .05); e.gain.exponentialRampToValueAtTime(.001, tt + beat * 3.8); o.connect(e); e.connect(out); o.start(tt); o.stop(tt + beat * 4); }
      }
      out.gain.setValueAtTime(.18, t0 + dur - 1); out.gain.linearRampToValueAtTime(0, t0 + dur - .1);
      return { ac, dest, stop() { try { ac.close(); } catch (e) {} } };
    }

    function play(onEnd, music) {
      cancelAnimationFrame(raf); if (audio) { audio.stop(); audio = null; }
      audio = music || startMusic(S.dur, false); playing = true; const t0 = performance.now();
      const loop = now => { const tt = (now - t0) / 1000; if (tt >= S.dur || !el.isConnected) { playing = false; draw(S.dur - .01); if (audio) { const a = audio; audio = null; setTimeout(() => a.stop(), 300); } if (onEnd) onEnd(); return; } draw(tt); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    }
    async function save2(blob, name) {
      if (ctx.download) return ctx.download(blob, name);
      const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 8000);
    }
    function record() {
      const msg = q('[data-msg]');
      if (!cv.captureStream || typeof MediaRecorder === 'undefined') { msg.textContent = '이 기기·브라우저는 영상 저장을 지원하지 않아요. 미리보기를 화면 녹화로 저장해 주세요.'; return; }
      if (rec) return;
      const music = startMusic(S.dur, true), stream = cv.captureStream(30);
      if (music && music.dest) music.dest.stream.getAudioTracks().forEach(tr => stream.addTrack(tr));
      const hasA = stream.getAudioTracks().length > 0;
      const type = (hasA ? ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'] : ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']).find(t => MediaRecorder.isTypeSupported(t)) || '';
      const chunks = [];
      try { rec = new MediaRecorder(stream, type ? { mimeType: type, videoBitsPerSecond: 4e6 } : undefined); } catch (e) { if (music) music.stop(); msg.textContent = '영상 녹화를 시작하지 못했어요.'; return; }
      rec.ondataavailable = e => e.data.size && chunks.push(e.data);
      rec.onstop = async () => {
        const blob = new Blob(chunks, { type: rec.mimeType || 'video/webm' }), ext = /mp4/.test(blob.type) ? 'mp4' : 'webm', d = new Date(), name = `promo-shorts-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}.${ext}`;
        rec = null; lastBlob = { blob, name }; stream.getTracks().forEach(tr => tr.stop());
        try { await save2(blob, name); msg.textContent = `🎞 ${name} (${(blob.size / 1048576).toFixed(1)}MB) 저장을 시작했어요. SNS에는 직접 올려 주세요.`; } catch (e) { msg.textContent = '저장이 취소됐어요.'; }
        const sb = q('[data-share]'); try { sb.hidden = !(navigator.canShare && navigator.canShare({ files: [new File([blob], name, { type: blob.type })] })); } catch (e) { sb.hidden = true; }
      };
      msg.textContent = `⏺ 녹화 중… ${S.dur}초 동안 이 화면을 그대로 두세요.`;
      rec.start(500); play(() => setTimeout(() => rec && rec.state !== 'inactive' && rec.stop(), 250), music);
    }
    async function share() {
      if (!lastBlob) return; const msg = q('[data-msg]');
      try { await navigator.share({ files: [new File([lastBlob.blob], lastBlob.name, { type: lastBlob.blob.type })], title: S.title || '' }); msg.textContent = '📤 공유 창을 열었어요.'; } catch (e) { msg.textContent = '공유를 취소했어요.'; }
    }

    fill(); draw(1.2);
    return { stop() { cancelAnimationFrame(raf); if (audio) audio.stop(); if (rec && rec.state !== 'inactive') rec.stop(); photos.forEach(p => URL.revokeObjectURL(p.url)); }, _state: S, _draw: draw };
  }

  window.PromoMaker = { mount, TPL, THEME };
})();
