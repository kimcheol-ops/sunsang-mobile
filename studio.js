/* ArtStudio — 🎬 그림 스튜디오 (바다 그리기 안의 탭)
 *  ArtStudio.view(el, ctx)  ctx = { setStop(fn), download(blob, name), keep(canvas, title, kind) }
 *  모드: 🧒 어린이 · 📚 교육 · 🧑‍🎨 전문가 · 💬 웹툰
 *  도구: 캔버스 · 사진·카메라 · 조명 · 3D · 4D 움직임 · 5D 감각 · AR 카메라 · 타임랩스 · 웹툰
 *  · 모든 그림·효과는 이 코드가 직접 계산합니다(인공지능·유료 서비스 없음).
 *  · 카메라·마이크·움직임 센서는 단추를 누를 때만 켜고, 화면을 나가면 끕니다.
 *  · 사진·영상·그림은 이 기기에만 있습니다(서버로 올리지 않음). 저장은 전시관(IndexedDB) 또는 내려받기.
 */
(function () {
  'use strict';
  const CSS = `
  .stu .modes, .stu .tools { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 6px; }
  .stu .chip { border: 1px solid #3A4450; background: #1A1F26; color: inherit; border-radius: 16px; padding: 5px 10px; font: inherit; font-size: 13px; cursor: pointer; }
  .stu .chip[aria-pressed="true"] { background: var(--s-acc, #3FB4E0); color: #08131C; border-color: transparent; font-weight: 700; }
  .stu .wrap { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 10px; }
  @media (max-width: 760px) { .stu .wrap { grid-template-columns: 1fr; } }
  .stu .cvbox { position: relative; width: 100%; max-width: 640px; aspect-ratio: 1 / 1; margin: 0 auto; border-radius: 10px; overflow: hidden; background: #F6F0E2; touch-action: none; box-shadow: 0 2px 14px rgba(0,0,0,.4); }
  .stu .cvbox.tall { aspect-ratio: 9 / 16; max-width: 380px; }
  .stu .cvbox.dark { background: #06121C; }
  .stu .cvbox > canvas, .stu .cvbox > video, .stu .cvbox > div.three { position: absolute; inset: 0; width: 100%; height: 100%; }
  .stu .cvbox > video { object-fit: cover; }
  .stu .side { display: grid; gap: 8px; align-content: start; }
  .stu .row { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; }
  .stu .sw { width: 26px; height: 26px; border-radius: 50%; border: 2px solid rgba(255,255,255,.25); cursor: pointer; padding: 0; }
  .stu .sw[aria-pressed="true"] { outline: 3px solid var(--s-acc, #3FB4E0); outline-offset: 1px; }
  .stu .bt { border: 1px solid #3A4450; background: #222A33; color: inherit; border-radius: 8px; padding: 6px 9px; font: inherit; font-size: 13px; cursor: pointer; }
  .stu .bt[aria-pressed="true"] { background: #2F5A70; border-color: var(--s-acc, #3FB4E0); }
  .stu .bt.pri { background: var(--s-acc, #3FB4E0); color: #08131C; font-weight: 700; border-color: transparent; }
  .stu .lay { display: grid; gap: 3px; }
  .stu .lay > div { display: grid; grid-template-columns: 22px 1fr 60px 22px; gap: 4px; align-items: center; padding: 3px 5px; border-radius: 6px; background: #1A1F26; font-size: 12px; cursor: pointer; }
  .stu .lay > div.on { outline: 2px solid var(--s-acc, #3FB4E0); }
  .stu .lay input[type=range] { width: 60px; }
  .stu .tip { font-size: 12px; color: var(--s-muted, #9AA4AE); line-height: 1.5; }
  .stu .lesson { background: #14202A; border-radius: 8px; padding: 8px; font-size: 13px; line-height: 1.55; }
  .stu .lesson ol { margin: 4px 0 0 18px; padding: 0; }
  .stu .lesson li.done { color: #7EE787; }
  .stu .stk { font-size: 24px; background: none; border: 1px solid transparent; border-radius: 8px; cursor: pointer; padding: 2px 4px; }
  .stu .stk[aria-pressed="true"] { border-color: var(--s-acc, #3FB4E0); background: #1F2A33; }
  .stu.kid .bt, .stu.kid .chip { font-size: 16px; padding: 9px 13px; border-radius: 14px; }
  .stu.kid .sw { width: 38px; height: 38px; }
  .stu .toon { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; align-content: start; background: #ECECEC; padding: 10px; border-radius: 10px; }
  .stu .panel { position: relative; width: 100%; max-width: 520px; background: #fff; border: 3px solid #111; touch-action: none; }
  .stu .panel.on { outline: 4px solid var(--s-acc, #3FB4E0); }
  .stu .panel canvas { display: block; width: 100%; height: 100%; }
  .stu .bub { position: absolute; transform: translate(-50%, -50%); background: #fff; border: 2.5px solid #111; border-radius: 50%; padding: 10px 14px; color: #111; font: 700 14px/1.3 inherit; text-align: center; max-width: 60%; cursor: move; user-select: none; touch-action: none; }
  .stu .bub.think { border-style: dashed; }
  .stu .bub.shout { border-radius: 4px; clip-path: polygon(0 20%, 10% 0, 30% 12%, 50% 0, 70% 12%, 90% 0, 100% 20%, 92% 50%, 100% 80%, 90% 100%, 70% 88%, 50% 100%, 30% 88%, 10% 100%, 0 80%, 8% 50%); padding: 18px 22px; background: #FFF6A8; }
  .stu .bub.box { border-radius: 4px; background: #FFFBE8; }
  .stu .meter { height: 8px; border-radius: 9px; background: #1A1F26; overflow: hidden; }
  .stu .meter > i { display: block; height: 100%; width: 0; background: #6FD3A4; }
  .stu video.out { width: 100%; max-width: 380px; border-radius: 8px; display: block; margin: 6px auto 0; }`;

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const coal = e => { const a = e.getCoalescedEvents ? e.getCoalescedEvents() : []; return a.length ? a : [e]; };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const cap = (el, e) => { try { el.setPointerCapture(e.pointerId); } catch (x) {} };
  const S = 1024;                                   // 그림 크기(정사각형)

  const MODES = [['kid', '🧒 어린이'], ['edu', '📚 교육'], ['pro', '🧑‍🎨 전문가'], ['toon', '💬 웹툰']];
  const TOOLS = [['canvas', '🖌 캔버스'], ['photo', '📷 사진·카메라'], ['light', '💡 조명'], ['d3', '🧊 3D'], ['d4', '⏱ 4D 움직임'], ['d5', '📳 5D 감각'], ['ar', '🕶 AR 카메라'], ['lapse', '🎞 타임랩스'], ['toon', '💬 웹툰']];
  const PAL = ['#1C1C1C', '#FFFFFF', '#E0504F', '#F29A38', '#F5D547', '#6FC36A', '#2E9E8F', '#3FB4E0', '#1F6C8A', '#3F4FB0', '#8E5CC9', '#E879A8', '#8A5A3A', '#A9B3BC'];
  const KIDPAL = ['#1C1C1C', '#E0504F', '#F29A38', '#F5D547', '#6FC36A', '#3FB4E0', '#3F4FB0', '#E879A8', '#8A5A3A', '#FFFFFF'];
  const STICK = ['🐟', '🐠', '🐡', '🦈', '🐙', '🦑', '🦀', '🦞', '🐚', '🐳', '🐬', '🪸', '🌊', '⭐', '🫧', '⛵', '🎣', '🏝', '☀️', '🌙'];
  const BRUSH = {
    pen: '✒ 펜', marker: '🖍 마커', water: '💧 수채', spray: '🎨 스프레이', crayon: '🖍 크레용', glow: '✨ 빛 붓', eraser: '🧽 지우개', stamp: '⭐ 스티커', pick: '💉 색 뽑기'
  };
  const KIDBRUSH = ['crayon', 'marker', 'glow', 'stamp', 'eraser'];

  /* ───────── 그림 문서(탭을 옮겨도 유지) ───────── */
  const doc = { layers: [], active: 1, log: [], bgLog: null };
  function newDoc() {
    const bg = mk(S), g = bg.getContext('2d'); g.fillStyle = '#F6F0E2'; g.fillRect(0, 0, S, S);
    doc.layers = [{ name: '배경', cv: bg, vis: true, op: 1 }, { name: '그림 1', cv: mk(S), vis: true, op: 1 }];
    doc.active = 1; doc.log = []; doc.bgLog = bg.toDataURL('image/jpeg', 0.7);
  }
  newDoc();
  function flatten(opts = {}) {
    const out = mk(opts.size || S), g = out.getContext('2d'), k = (opts.size || S) / S;
    doc.layers.forEach((L, i) => { if (!L.vis || (opts.noBg && i === 0)) return; g.globalAlpha = L.op; g.drawImage(L.cv, 0, 0, S * k, S * k); });
    g.globalAlpha = 1; return out;
  }
  function hasDrawing() {
    const f = flatten({ noBg: true, size: 64 }), d = f.getContext('2d').getImageData(0, 0, 64, 64).data;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 10) return true; return false;
  }

  /* ───────── 붓: 한 구간(a→b)을 그림. 다시 그리기(타임랩스)도 같은 함수 ───────── */
  function seg(g, br, color, size, a, b, mirror) {
    const pts = mirror ? [[a, b], [[S - a[0], a[1], a[2]], [S - b[0], b[1], b[2]]]] : [[a, b]];
    pts.forEach(([p, q]) => one(g, br, color, size, p, q));
  }
  function one(g, br, color, size, a, b) {
    const pr = (a[2] == null ? 0.5 : a[2]), w = Math.max(1, size * (0.35 + pr * 1.3));
    g.save(); g.lineCap = g.lineJoin = 'round';
    if (br === 'eraser') { g.globalCompositeOperation = 'destination-out'; g.strokeStyle = '#000'; g.lineWidth = w * 1.4; line(g, a, b); }
    else if (br === 'pen') { g.strokeStyle = color; g.lineWidth = w * 0.6; line(g, a, b); }
    else if (br === 'marker') { g.globalAlpha = 0.35; g.strokeStyle = color; g.lineWidth = w * 1.5; line(g, a, b); }
    else if (br === 'water') {
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, d / (w * 0.25));
      for (let i = 0; i <= n; i++) { const x = a[0] + (b[0] - a[0]) * i / n, y = a[1] + (b[1] - a[1]) * i / n, r = w * 1.3, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, hexA(color, 0.10)); gr.addColorStop(1, hexA(color, 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    } else if (br === 'spray') {
      g.fillStyle = color; const n = Math.round(w * 1.5);
      for (let i = 0; i < n; i++) { const t = Math.random(), x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, r = Math.random() * w * 1.6, an = Math.random() * 6.283; g.fillRect(x + Math.cos(an) * r, y + Math.sin(an) * r, 1.6, 1.6); }
    } else if (br === 'crayon') {
      g.fillStyle = color; const d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, d / 2);
      for (let i = 0; i <= n; i++) { const x = a[0] + (b[0] - a[0]) * i / n, y = a[1] + (b[1] - a[1]) * i / n; for (let k = 0; k < w / 1.5; k++) { if (Math.random() < 0.35) continue; g.globalAlpha = 0.5 + Math.random() * 0.5; g.fillRect(x + (Math.random() - 0.5) * w, y + (Math.random() - 0.5) * w, 2, 2); } }
    } else if (br === 'glow') {
      g.globalCompositeOperation = 'lighter'; g.shadowColor = color; g.shadowBlur = w * 1.2; g.strokeStyle = hexA(color, 0.8); g.lineWidth = w * 0.5; line(g, a, b);
      g.shadowBlur = 0; g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = Math.max(1, w * 0.15); line(g, a, b);
    }
    g.restore();
  }
  function stamp(g, e, x, y, size, mirror) {
    g.save(); g.font = `${size * 3}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(e, x, y); if (mirror) { g.translate(S - x, y); g.scale(-1, 1); g.fillText(e, 0, 0); } g.restore();
  }
  const line = (g, a, b) => { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); };
  function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
  function replay(g, item) {
    if (item.t === 'stamp') return stamp(g, item.e, item.x, item.y, item.s, item.m);
    for (let i = 1; i < item.pts.length; i++) seg(g, item.t, item.c, item.s, item.pts[i - 1], item.pts[i], item.m);
    if (item.pts.length === 1) seg(g, item.t, item.c, item.s, item.pts[0], item.pts[0], item.m);
  }

  /* ───────── 소리(어린이 칭찬)·진동 ───────── */
  let AC = null;
  function chime(kind) {
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const t = AC.currentTime;
      const notes = kind === 'big' ? [523, 659, 784, 1046] : [659, 880];
      notes.forEach((f, i) => { const o = AC.createOscillator(), v = AC.createGain(); o.type = 'triangle'; o.frequency.value = f; v.gain.setValueAtTime(0.0001, t + i * 0.09); v.gain.exponentialRampToValueAtTime(0.18, t + i * 0.09 + 0.02); v.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.3); o.connect(v).connect(AC.destination); o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.32); });
    } catch (e) {}
  }
  const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

  /* ───────── 영상 녹화(MediaRecorder) ───────── */
  function recMime() {
    if (!window.MediaRecorder) return null;
    return ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'].find(m => { try { return MediaRecorder.isTypeSupported(m); } catch (e) { return false; } }) || '';
  }
  function record(cv, ms, onTick) {
    return new Promise((res, rej) => {
      const mime = recMime(); if (mime == null || !cv.captureStream) return rej(new Error('이 브라우저는 화면 녹화를 지원하지 않아요(크롬·엣지·삼성 인터넷 권장).'));
      const st = cv.captureStream(30), r = new MediaRecorder(st, mime ? { mimeType: mime, videoBitsPerSecond: 4e6 } : undefined), parts = [];
      r.ondataavailable = e => e.data.size && parts.push(e.data);
      r.onstop = () => { st.getTracks().forEach(t => t.stop()); res(new Blob(parts, { type: (mime || 'video/webm').split(';')[0] })); };
      r.start(250); const t0 = performance.now();
      (function tk() { const k = (performance.now() - t0) / ms; if (onTick) onTick(Math.min(1, k)); if (k >= 1) { r.stop(); return; } requestAnimationFrame(tk); })();
    });
  }
  const extOf = b => /mp4/.test(b.type) ? 'mp4' : 'webm';

  /* ───────── 카메라 ───────── */
  async function camOpen(facing) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('이 기기·브라우저는 카메라를 쓸 수 없어요(https 주소에서 열어 주세요).');
    return navigator.mediaDevices.getUserMedia({ video: { facingMode: facing || 'environment', width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false });
  }
  const camStop = s => { try { s && s.getTracks().forEach(t => t.stop()); } catch (e) {} };
  async function torch(stream, on) {
    const tr = stream && stream.getVideoTracks()[0]; if (!tr) return false;
    const cap = tr.getCapabilities ? tr.getCapabilities() : {}; if (!cap.torch) return false;
    try { await tr.applyConstraints({ advanced: [{ torch: !!on }] }); return true; } catch (e) { return false; }
  }

  /* ───────── 3D 라이브러리(필요할 때만 불러옴) ───────── */
  function needThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'; s.onload = () => res(window.THREE); s.onerror = () => rej(new Error('3D 파일을 불러오지 못했어요(인터넷 연결 확인).')); document.head.appendChild(s); });
  }

  /* ───────── 사진 필터 ───────── */
  function gray(d) { const n = d.length / 4, o = new Float32Array(n); for (let i = 0; i < n; i++) o[i] = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114; return o; }
  function sobelMag(L, W, H) { const o = new Float32Array(W * H); for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x, gx = L[i - W + 1] + 2 * L[i + 1] + L[i + W + 1] - L[i - W - 1] - 2 * L[i - 1] - L[i + W - 1], gy = L[i + W - 1] + 2 * L[i + W] + L[i + W + 1] - L[i - W - 1] - 2 * L[i - W] - L[i - W + 1]; o[i] = Math.hypot(gx, gy); } return o; }
  function boxBlur(cv, r) { const o = mk(cv.width, cv.height), g = o.getContext('2d'); g.filter = `blur(${r}px)`; g.drawImage(cv, 0, 0); g.filter = 'none'; return o; }
  const FILTERS = {
    none: ['원본', c => c],
    sketch: ['✏ 연필 스케치', c => { const W = c.width, H = c.height, id = c.getContext('2d').getImageData(0, 0, W, H), L = gray(id.data), E = sobelMag(L, W, H), o = mk(W, H), g = o.getContext('2d'), od = g.createImageData(W, H); for (let i = 0; i < W * H; i++) { const v = clamp(255 - E[i] * 0.9, 0, 255) * 0.85 + L[i] * 0.15; od.data[i * 4] = od.data[i * 4 + 1] = od.data[i * 4 + 2] = v; od.data[i * 4 + 3] = 255; } g.putImageData(od, 0, 0); return o; }],
    cartoon: ['💥 만화', c => { const W = c.width, H = c.height, b = boxBlur(c, 2), id = b.getContext('2d').getImageData(0, 0, W, H), d = id.data, E = sobelMag(gray(c.getContext('2d').getImageData(0, 0, W, H).data), W, H); for (let i = 0; i < W * H; i++) { for (let k = 0; k < 3; k++) d[i * 4 + k] = Math.round(d[i * 4 + k] / 51) * 51; if (E[i] > 110) d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 20; } const o = mk(W, H); o.getContext('2d').putImageData(id, 0, 0); return o; }],
    water: ['💧 수채화', c => { const W = c.width, H = c.height, b = boxBlur(c, 5), id = b.getContext('2d').getImageData(0, 0, W, H), d = id.data; for (let i = 0; i < W * H; i++) { const n = (Math.random() - 0.5) * 14; for (let k = 0; k < 3; k++) d[i * 4 + k] = clamp(Math.round(d[i * 4 + k] / 36) * 36 * 0.85 + 255 * 0.15 + n, 0, 255); } const o = mk(W, H), g = o.getContext('2d'); g.putImageData(id, 0, 0); g.globalAlpha = 0.25; g.drawImage(FILTERS.sketch[1](c), 0, 0); return o; }],
    mono: ['⚫ 흑백', c => { const o = mk(c.width, c.height), g = o.getContext('2d'); g.filter = 'grayscale(1) contrast(1.15)'; g.drawImage(c, 0, 0); return o; }],
    trace: ['🖊 밑그림 선만', c => { const W = c.width, H = c.height, E = sobelMag(gray(c.getContext('2d').getImageData(0, 0, W, H).data), W, H), o = mk(W, H), g = o.getContext('2d'), od = g.createImageData(W, H); for (let i = 0; i < W * H; i++) { const v = E[i] > 70 ? 120 : 255; od.data[i * 4] = od.data[i * 4 + 1] = od.data[i * 4 + 2] = v; od.data[i * 4 + 3] = 255; } g.putImageData(od, 0, 0); return o; }]
  };
  function fitSquare(src, w, h) { const o = mk(S), g = o.getContext('2d'), k = Math.max(S / w, S / h); g.fillStyle = '#fff'; g.fillRect(0, 0, S, S); g.drawImage(src, (S - w * k) / 2, (S - h * k) / 2, w * k, h * k); return o; }

  /* ───────── 교육 수업 ───────── */
  const LESSONS = [
    { id: 'body', name: '물고기 몸 구조', guide: 'creature', steps: ['몸통: 앞이 둥글고 뒤가 좁은 레몬 모양을 그려요.', '꼬리: 몸통 끝에 V자나 부채꼴 꼬리를 붙여요.', '지느러미: 등·배·가슴지느러미를 얇게 붙여요(물속에서 방향을 잡는 곳).', '눈과 아가미: 눈은 머리 앞쪽, 아가미 선은 눈 뒤에 반달 모양.', '무늬·비늘: 줄무늬나 작은 반원 비늘을 겹쳐 그려요.'] },
    { id: 'shade', name: '명암 3단계', guide: 'sphere', steps: ['빛이 오는 쪽(왼쪽 위 화살표)을 정해요.', '밝은 면: 빛 쪽은 가장 연한 색으로 칠해요.', '중간 면: 가운데는 원래 색.', '그림자 면: 빛 반대쪽은 같은 색에 남색을 조금 섞어 진하게.', '바닥 그림자: 물체 아래 바닥에 타원 그림자를 놓으면 떠 있지 않아요.'] },
    { id: 'persp', name: '원근: 멀고 가까움', guide: 'persp', steps: ['수평선(가로 점선)을 그어요. 바다와 하늘이 만나는 곳.', '소실점(가운데 점)으로 모이는 선을 따라 배·방파제를 그려요.', '가까운 물고기는 크게, 먼 물고기는 작게.', '먼 곳은 흐리고 파랗게, 가까운 곳은 진하고 또렷하게(공기 원근).'] },
    { id: 'temp', name: '색의 온도', guide: 'none', palette: 'temp', steps: ['따뜻한 색(빨강·주황·노랑)은 가까이·햇빛 느낌.', '차가운 색(파랑·남색·청록)은 멀리·물속 느낌.', '노을 바다: 하늘은 따뜻하게, 바다는 차갑게 칠해 보세요.', '보색(주황↔파랑)을 나란히 두면 서로 더 또렷해져요.'] },
    { id: 'under', name: '물속 표현', guide: 'under', steps: ['위는 밝은 청록, 아래로 갈수록 진한 남색(수채 붓 추천).', '빛줄기: 위에서 비스듬히 내려오는 연한 줄을 빛 붓으로.', '물방울: 작은 동그라미 + 왼쪽 위에 흰 점.', '바닥: 모래·바위·해초는 흐리게, 물고기는 또렷하게.'] }
  ];
  const TEMP_PAL = ['#E0504F', '#F27A3A', '#F29A38', '#F5C547', '#F5D547', '#3FB4E0', '#2E9E8F', '#1F6C8A', '#3F4FB0', '#22305E'];

  /* ═════════════════════════ 화면 ═════════════════════════ */
  function view(el, ctx) {
    if (!document.getElementById('stu-css')) { const st = document.createElement('style'); st.id = 'stu-css'; st.textContent = CSS; document.head.appendChild(st); }
    const ui = Object.assign({ mode: 'kid', tool: 'canvas', brush: 'crayon', color: '#3FB4E0', size: 14, mirror: false, sticker: '🐟', lesson: 'body', step: 0, cr: 'dom' }, lsGet('stu.ui', {}));
    let stopNow = () => {};
    const stopAll = () => { try { stopNow(); } catch (e) {} stopNow = () => {}; };
    ctx.setStop(stopAll);
    const save = () => lsSet('stu.ui', ui);
    const keep = (cv, title, kind) => ctx.keep(cv, title, kind || 'studio');
    async function dl(blob, name) { try { await ctx.download(blob, name); } catch (e) {} }
    const day = () => new Date().toISOString().slice(0, 10);

    function render() {
      stopAll(); save();
      el.classList.add('stu'); el.classList.toggle('kid', ui.mode === 'kid');
      el.innerHTML = `<div class="modes" role="group" aria-label="사용자 모드">${MODES.map(([k, l]) => `<button class="chip" data-mode="${k}" aria-pressed="${ui.mode === k}">${l}</button>`).join('')}</div>
        <div class="tools" role="tablist">${TOOLS.map(([k, l]) => `<button class="chip" role="tab" data-tool="${k}" aria-pressed="${ui.tool === k}">${l}</button>`).join('')}</div>
        <div id="stu-body"></div><div class="tip" id="stu-say" aria-live="polite" style="margin-top:6px"></div>`;
      el.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => {
        ui.mode = b.dataset.mode;
        if (ui.mode === 'toon') ui.tool = 'toon';
        else if (ui.tool === 'toon') ui.tool = 'canvas';
        if (ui.mode === 'kid' && !KIDBRUSH.includes(ui.brush)) ui.brush = 'crayon';
        render();
      });
      el.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => { ui.tool = b.dataset.tool; render(); });
      const body = el.querySelector('#stu-body');
      ({ canvas: canvasView, photo: photoView, light: lightView, d3: d3View, d4: d4View, d5: d5View, ar: arView, lapse: lapseView, toon: toonView })[ui.tool](body);
    }
    const say = t => { const n = el.querySelector('#stu-say'); if (n) n.innerHTML = t; };

    /* ───────── 🖌 캔버스(모든 모드 공통 엔진) ───────── */
    function canvasView(body) {
      const kid = ui.mode === 'kid', pro = ui.mode === 'pro', edu = ui.mode === 'edu';
      const lesson = LESSONS.find(l => l.id === ui.lesson) || LESSONS[0];
      const pal = kid ? KIDPAL : (edu && lesson.palette === 'temp') ? TEMP_PAL : PAL;
      const brushes = kid ? KIDBRUSH : Object.keys(BRUSH);
      if (!brushes.includes(ui.brush)) ui.brush = brushes[0];
      body.innerHTML = `<div class="wrap"><div><div class="cvbox" id="cv-box"><canvas id="cv"></canvas></div>
          <div class="row" style="justify-content:center;margin-top:6px">
            <button class="bt" data-undo>↶ 되돌리기</button>${pro ? '<button class="bt" data-redo>↷ 다시</button>' : ''}
            <button class="bt" data-mirror aria-pressed="${ui.mirror}">🪞 거울</button>
            ${pro ? '<button class="bt" data-zin>＋</button><button class="bt" data-zout>－</button><button class="bt" data-zfit>맞춤</button>' : ''}
            <button class="bt" data-clear>🗑 새 그림</button></div></div>
        <div class="side">
          ${edu ? lessonBox(lesson) : ''}
          <div class="row">${brushes.map(k => `<button class="bt" data-br="${k}" aria-pressed="${ui.brush === k}">${BRUSH[k]}</button>`).join('')}</div>
          ${ui.brush === 'stamp' ? `<div class="row">${STICK.map(s => `<button class="stk" data-stk="${s}" aria-pressed="${ui.sticker === s}">${s}</button>`).join('')}</div>` : ''}
          <div class="row">${pal.map(c => `<button class="sw" data-c="${c}" style="background:${c}" aria-label="색 ${c}" aria-pressed="${ui.color === c}"></button>`).join('')}${kid ? '' : `<input type="color" id="cv-col" value="${ui.color}" aria-label="색 고르기">`}</div>
          <label class="row">굵기 <input type="range" id="cv-size" min="2" max="${kid ? 40 : 80}" value="${ui.size}"> <span id="cv-sz">${ui.size}</span></label>
          ${pro ? `<div><b style="font-size:13px">레이어</b> <button class="bt" data-ladd>＋</button> <button class="bt" data-ldel>－</button> <button class="bt" data-lup>▲</button> <button class="bt" data-ldn>▼</button><div class="lay" id="cv-lay"></div></div>
            <div class="tip">필압: 펜·S펜·애플펜슬의 누르는 힘을 굵기에 씁니다. 두 손가락(또는 휠)으로 확대·이동.</div>` : ''}
          <div class="row"><button class="bt pri" data-keep>🖼 전시관에 걸기</button><button class="bt" data-png>⬇ PNG</button>${pro ? '<button class="bt" data-tpng>⬇ 투명 PNG</button>' : ''}</div>
          ${kid ? '<div class="tip">🪞 거울을 켜면 한쪽만 그려도 양쪽이 똑같이 그려져요. ⭐ 스티커로 바다 친구를 붙여 보세요!</div>' : ''}
        </div></div>`;
      const box = body.querySelector('#cv-box'), cv = body.querySelector('#cv'), g = cv.getContext('2d');
      let view = { z: 1, x: 0, y: 0 }, guideImg = null;
      const undo = [], redo = [], LIM = pro ? 40 : 15;
      function size() { const r = box.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.max(10, r.width * dpr); cv.height = Math.max(10, r.height * dpr); draw(); }
      function draw() {
        const W = cv.width, k = W / S * view.z; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#2A2F36'; g.fillRect(0, 0, W, cv.height);
        g.setTransform(k, 0, 0, k, view.x * W, view.y * W);
        doc.layers.forEach(L => { if (!L.vis) return; g.globalAlpha = L.op; g.drawImage(L.cv, 0, 0); }); g.globalAlpha = 1;
        if (guideImg) { g.globalAlpha = 0.55; g.drawImage(guideImg, 0, 0, S, S); g.globalAlpha = 1; }
        if (ui.mirror) { g.strokeStyle = 'rgba(63,180,224,.5)'; g.setLineDash([12, 10]); g.lineWidth = 3 / view.z; g.beginPath(); g.moveTo(S / 2, 0); g.lineTo(S / 2, S); g.stroke(); g.setLineDash([]); }
        g.setTransform(1, 0, 0, 1, 0, 0);
      }
      const toDoc = e => { const r = cv.getBoundingClientRect(), W = r.width, k = W / S * view.z; return [((e.clientX - r.left) - view.x * W) / k, ((e.clientY - r.top) - view.y * W) / k, e.pointerType === 'pen' || (pro && e.pressure && e.pressure !== 0.5) ? e.pressure : 0.5]; };
      function snap() { const L = doc.layers[doc.active]; undo.push({ i: doc.active, img: L.cv.getContext('2d').getImageData(0, 0, S, S), log: doc.log.length }); if (undo.length > LIM) undo.shift(); redo.length = 0; }
      function restore(from, to) { const u = from.pop(); if (!u) return; const L = doc.layers[u.i]; if (!L) return; to.push({ i: u.i, img: L.cv.getContext('2d').getImageData(0, 0, S, S), log: doc.log.length, logged: doc.log.slice(u.log) }); L.cv.getContext('2d').putImageData(u.img, 0, 0); if (from === undo) doc.log.length = u.log; else if (u.logged) doc.log.push(...u.logged); draw(); }
      const ptrs = new Map(); let cur = null, pinch = null, strokes = 0;
      cv.onpointerdown = e => {
        cap(cv, e); ptrs.set(e.pointerId, [e.clientX, e.clientY]);
        if (ptrs.size === 2 && pro) { cur = null; const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: view.z, x: view.x, y: view.y, cx: (a[0] + b[0]) / 2, cy: (a[1] + b[1]) / 2 }; return; }
        if (ptrs.size > 1) return;
        const p = toDoc(e), L = doc.layers[doc.active];
        if (!L.vis) { say('보이지 않는 레이어에는 그릴 수 없어요(👁을 켜 주세요).'); return; }
        if (ui.brush === 'pick') { const f = flatten(), d = f.getContext('2d').getImageData(clamp(p[0] | 0, 0, S - 1), clamp(p[1] | 0, 0, S - 1), 1, 1).data; ui.color = '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join(''); ui.brush = 'pen'; render(); return; }
        snap();
        if (ui.brush === 'stamp') { stamp(L.cv.getContext('2d'), ui.sticker, p[0], p[1], ui.size, ui.mirror); doc.log.push({ t: 'stamp', e: ui.sticker, x: p[0], y: p[1], s: ui.size, m: ui.mirror }); draw(); if (kid) chime(); buzz(8); return; }
        cur = { t: ui.brush, c: ui.color, s: ui.size, m: ui.mirror, l: doc.active, pts: [p] };
        seg(L.cv.getContext('2d'), cur.t, cur.c, cur.s, p, p, cur.m); draw();
      };
      cv.onpointermove = e => {
        if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, [e.clientX, e.clientY]);
        if (pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()], r = cv.getBoundingClientRect(), d = Math.hypot(a[0] - b[0], a[1] - b[1]), z = clamp(pinch.z * d / pinch.d, 0.5, 6), cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2; const px = (pinch.cx - r.left) / r.width, py = (pinch.cy - r.top) / r.width; view.z = z; view.x = px - (px - pinch.x) * z / pinch.z + (cx - pinch.cx) / r.width; view.y = py - (py - pinch.y) * z / pinch.z + (cy - pinch.cy) / r.width; draw(); return; }
        if (!cur) return; const L = doc.layers[cur.l].cv.getContext('2d');
        coal(e).forEach(ev => { const p = toDoc(ev), q = cur.pts[cur.pts.length - 1]; if (Math.hypot(p[0] - q[0], p[1] - q[1]) < 1.5) return; seg(L, cur.t, cur.c, cur.s, q, p, cur.m); cur.pts.push(p.map(v => Math.round(v * 10) / 10)); });
        draw();
      };
      const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (!cur) return; doc.log.push(cur); cur = null; strokes++; if (kid && strokes % 6 === 0) { chime(); say(['멋져요! 🌟', '바다 친구가 좋아해요 🐠', '색이 예뻐요 🎨', '조금만 더! 거의 다 됐어요 ✨'][strokes / 6 % 4 | 0]); } if (edu) eduCheck(); };
      cv.onpointerup = cv.onpointercancel = up;
      cv.onwheel = e => { if (!pro) return; e.preventDefault(); const r = cv.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.width, z = clamp(view.z * (e.deltaY < 0 ? 1.15 : 1 / 1.15), 0.5, 6); view.x = px - (px - view.x) * z / view.z; view.y = py - (py - view.y) * z / view.z; view.z = z; draw(); };
      const q = s => body.querySelector(s), on = (s, f) => { const n = q(s); if (n) n.onclick = f; };
      on('[data-undo]', () => restore(undo, redo)); on('[data-redo]', () => restore(redo, undo));
      on('[data-mirror]', () => { ui.mirror = !ui.mirror; q('[data-mirror]').setAttribute('aria-pressed', ui.mirror); save(); draw(); });
      on('[data-zin]', () => { view.z = clamp(view.z * 1.25, 0.5, 6); draw(); }); on('[data-zout]', () => { view.z = clamp(view.z / 1.25, 0.5, 6); draw(); }); on('[data-zfit]', () => { view = { z: 1, x: 0, y: 0 }; draw(); });
      on('[data-clear]', () => { if (doc.log.length && !confirm('지금 그림을 지우고 새로 시작할까요? (전시관에 건 그림은 남아요)')) return; newDoc(); render(); });
      body.querySelectorAll('[data-br]').forEach(b => b.onclick = () => { ui.brush = b.dataset.br; render(); });
      body.querySelectorAll('[data-stk]').forEach(b => b.onclick = () => { ui.sticker = b.dataset.stk; body.querySelectorAll('[data-stk]').forEach(x => x.setAttribute('aria-pressed', x === b)); save(); });
      body.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { ui.color = b.dataset.c; if (ui.brush === 'eraser' || ui.brush === 'pick') ui.brush = kid ? 'crayon' : 'pen'; render(); });
      const col = q('#cv-col'); if (col) col.oninput = () => { ui.color = col.value; save(); };
      q('#cv-size').oninput = e => { ui.size = +e.target.value; q('#cv-sz').textContent = ui.size; save(); };
      on('[data-keep]', async () => { await keep(flatten(), kid ? '내가 그린 바다' : '스튜디오 그림'); if (kid) chime('big'); say('🖼 전시관에 걸었어요.'); });
      on('[data-png]', async () => { const b = await new Promise(r => flatten().toBlob(r, 'image/png')); dl(b, `studio-${day()}.png`); });
      on('[data-tpng]', async () => { const b = await new Promise(r => flatten({ noBg: true }).toBlob(r, 'image/png')); dl(b, `studio-transparent-${day()}.png`); });
      // 레이어
      function layers() {
        const host = q('#cv-lay'); if (!host) return;
        host.innerHTML = doc.layers.map((L, i) => ({ L, i })).reverse().map(({ L, i }) => `<div class="${i === doc.active ? 'on' : ''}" data-li="${i}"><button class="bt" data-vis="${i}" style="padding:0 2px" aria-label="보이기">${L.vis ? '👁' : '—'}</button><span>${esc(L.name)}</span><input type="range" min="0" max="100" value="${Math.round(L.op * 100)}" data-op="${i}" aria-label="불투명도"><span>${Math.round(L.op * 100)}</span></div>`).join('');
        host.querySelectorAll('[data-li]').forEach(d => d.onclick = e => { if (e.target.closest('[data-vis],[data-op]')) return; doc.active = +d.dataset.li; layers(); });
        host.querySelectorAll('[data-vis]').forEach(b => b.onclick = () => { const L = doc.layers[+b.dataset.vis]; L.vis = !L.vis; layers(); draw(); });
        host.querySelectorAll('[data-op]').forEach(r => r.oninput = () => { doc.layers[+r.dataset.op].op = r.value / 100; r.nextElementSibling.textContent = r.value; draw(); });
      }
      on('[data-ladd]', () => { if (doc.layers.length >= 8) { say('레이어는 8장까지예요.'); return; } doc.layers.splice(doc.active + 1, 0, { name: '그림 ' + doc.layers.length, cv: mk(S), vis: true, op: 1 }); doc.active++; layers(); });
      on('[data-ldel]', () => { if (doc.active === 0 || doc.layers.length <= 2) { say('배경과 마지막 그림 레이어는 지울 수 없어요.'); return; } doc.layers.splice(doc.active, 1); doc.active = Math.max(1, doc.active - 1); undo.length = redo.length = 0; layers(); draw(); });
      on('[data-lup]', () => { const i = doc.active; if (i < 1 || i >= doc.layers.length - 1) return; [doc.layers[i], doc.layers[i + 1]] = [doc.layers[i + 1], doc.layers[i]]; doc.active++; undo.length = redo.length = 0; layers(); draw(); });
      on('[data-ldn]', () => { const i = doc.active; if (i <= 1) return; [doc.layers[i], doc.layers[i - 1]] = [doc.layers[i - 1], doc.layers[i]]; doc.active--; undo.length = redo.length = 0; layers(); draw(); });
      layers();
      // 교육 수업
      function eduCheck() { const lb = q('#edu-steps'); if (!lb) return; }
      if (edu) {
        q('#edu-pick').onchange = e => { ui.lesson = e.target.value; ui.step = 0; render(); };
        on('[data-next]', () => { ui.step = Math.min(lesson.steps.length, ui.step + 1); save(); if (ui.step >= lesson.steps.length) { chime('big'); say(`🎓 「${esc(lesson.name)}」 수업을 마쳤어요! 전시관에 걸어 두세요.`); } render(); });
        on('[data-prev]', () => { ui.step = Math.max(0, ui.step - 1); render(); });
        const crs = q('#edu-cr'); if (crs) crs.onchange = e => { ui.cr = e.target.value; render(); };
        makeGuide(lesson).then(img => { guideImg = img; draw(); });
      }
      const ro = new ResizeObserver(size); ro.observe(box); size();
      stopNow = () => ro.disconnect();
    }
    function lessonBox(lesson) {
      const CR = (window.ArtApp && ArtApp.CR) || [];
      return `<div class="lesson"><div class="row"><b>📚 수업</b><select id="edu-pick">${LESSONS.map(l => `<option value="${l.id}"${l.id === lesson.id ? ' selected' : ''}>${esc(l.name)}</option>`).join('')}</select></div>
        ${lesson.guide === 'creature' && CR.length ? `<div class="row" style="margin-top:4px">본보기 <select id="edu-cr">${CR.map(c => `<option value="${c.id}"${c.id === ui.cr ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>` : ''}
        <ol id="edu-steps">${lesson.steps.map((s, i) => `<li class="${i < ui.step ? 'done' : ''}"${i === ui.step ? ' style="font-weight:700"' : ''}>${esc(s)}</li>`).join('')}</ol>
        <div class="row" style="margin-top:6px"><button class="bt" data-prev>◀</button><button class="bt pri" data-next>${ui.step >= lesson.steps.length ? '다 했어요 ✓' : '이 단계 했어요 ▶'}</button><span class="tip">${Math.min(ui.step, lesson.steps.length)}/${lesson.steps.length}</span></div>
        <div class="tip">흐린 안내선은 화면에만 보이고 그림에는 들어가지 않아요.</div></div>`;
    }
    function makeGuide(lesson) {
      return new Promise(res => {
        let svg = '';
        if (lesson.guide === 'creature' && window.ArtApp) {
          const c = ArtApp.CR.find(x => x.id === ui.cr) || ArtApp.CR[0];
          const host = document.createElement('div'); host.style.cssText = 'position:absolute;left:-9999px;width:200px;height:200px'; host.innerHTML = ArtApp.svgOf(c, c.parts.map(() => 'none')); document.body.appendChild(host);
          const labels = [...host.querySelectorAll('path[data-part]')].map((p, i) => { const b = p.getBBox(); return `<text x="${b.x + b.width / 2}" y="${b.y + b.height / 2}" font-size="9" text-anchor="middle" fill="#C0392B" font-weight="700">${esc(c.parts[i][0])}</text>`; }).join('');
          host.remove();
          svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><g fill="none" stroke="#5A6470" stroke-width="1.4" stroke-dasharray="4 3">${c.parts.map(p => `<path d="${p[1]}"/>`).join('')}${c.lines.map(d => `<path d="${d}"/>`).join('')}</g>${labels}</svg>`;
        } else if (lesson.guide === 'sphere') {
          svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><marker id="a" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#E0A020"/></marker></defs><line x1="18" y1="18" x2="62" y2="62" stroke="#E0A020" stroke-width="3" marker-end="url(#a)"/><text x="14" y="14" font-size="10" fill="#E0A020">☀ 빛</text><circle cx="105" cy="100" r="50" fill="none" stroke="#5A6470" stroke-dasharray="4 3"/><path d="M75 75 A40 40 0 0 1 120 62" fill="none" stroke="#ccc" stroke-width="2"/><text x="78" y="78" font-size="8" fill="#888">밝은 면</text><text x="125" y="128" font-size="8" fill="#555">그림자 면</text><ellipse cx="118" cy="160" rx="44" ry="8" fill="none" stroke="#5A6470" stroke-dasharray="3 3"/><text x="96" y="176" font-size="8" fill="#555">바닥 그림자</text></svg>`;
        } else if (lesson.guide === 'persp') {
          svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><line x1="0" y1="80" x2="200" y2="80" stroke="#3F7FB0" stroke-dasharray="5 4"/><text x="4" y="76" font-size="8" fill="#3F7FB0">수평선</text><circle cx="100" cy="80" r="2.5" fill="#C0392B"/><text x="104" y="76" font-size="8" fill="#C0392B">소실점</text>${[-60, -20, 20, 60, 140, 260, -160].map(x => `<line x1="100" y1="80" x2="${x}" y2="200" stroke="#5A6470" stroke-width=".8" stroke-dasharray="3 3"/>`).join('')}</svg>`;
        } else if (lesson.guide === 'under') {
          svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="u" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FE0E8" stop-opacity=".5"/><stop offset="1" stop-color="#0D2A55" stop-opacity=".5"/></linearGradient></defs><rect width="200" height="200" fill="url(#u)"/>${[30, 70, 120, 160].map(x => `<path d="M${x} 0 L${x - 30} 200 L${x - 18} 200 L${x + 10} 0 Z" fill="#fff" opacity=".12"/>`).join('')}<text x="6" y="12" font-size="8" fill="#08313A">밝게</text><text x="6" y="194" font-size="8" fill="#fff">진하게</text></svg>`;
        }
        if (!svg) return res(null);
        const img = new Image(); img.onload = () => res(img); img.onerror = () => res(null); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      });
    }

    /* ───────── 📷 사진·카메라 ───────── */
    function photoView(body) {
      let src = null, stream = null, torchOn = false;
      body.innerHTML = `<div class="wrap"><div><div class="cvbox" id="ph-box"><canvas id="ph-cv"></canvas><video id="ph-vid" playsinline muted style="display:none"></video></div></div>
        <div class="side">
          <div class="row"><label class="bt pri">🖼 사진 고르기<input type="file" accept="image/*" id="ph-file" hidden></label><button class="bt" data-cam>📷 카메라 켜기</button></div>
          <div class="row" id="ph-camrow" style="display:none"><button class="bt pri" data-shot>⚪ 찰칵</button><button class="bt" data-flip>🔄 앞·뒤</button><button class="bt" data-torch>🔦 손전등</button><button class="bt" data-camoff>끄기</button></div>
          <div><b style="font-size:13px">바꾸기</b><div class="row">${Object.entries(FILTERS).map(([k, v]) => `<button class="bt" data-f="${k}">${v[0]}</button>`).join('')}</div></div>
          <label class="row">밑그림 진하기 <input type="range" id="ph-op" min="10" max="100" value="${Math.round(doc.layers[0].op * 100)}"></label>
          <div class="row"><button class="bt pri" data-use>🖌 밑그림으로 쓰고 그리기</button></div>
          <div class="row"><button class="bt" data-keep>🖼 전시관에 걸기</button><button class="bt" data-dl>⬇ 내려받기</button></div>
          <div class="tip">사진은 이 기기 안에서만 바뀌고, 어디에도 올라가지 않아요. 카메라는 「카메라 켜기」를 누를 때만 켜지고 이 화면을 나가면 꺼져요. 손전등은 안드로이드 크롬처럼 지원하는 폰에서만 켜져요.</div>
        </div></div>`;
      const box = body.querySelector('#ph-box'), cv = body.querySelector('#ph-cv'), vid = body.querySelector('#ph-vid'), g = cv.getContext('2d');
      let out = null, facing = 'environment';
      const q = s => body.querySelector(s);
      function size() { const r = box.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.max(10, r.width * dpr); cv.height = cv.width; paint(); }
      function paint() { g.fillStyle = '#F6F0E2'; g.fillRect(0, 0, cv.width, cv.height); const c = out || src || doc.layers[0].cv; g.drawImage(c, 0, 0, cv.width, cv.height); if (!src && !out) { g.fillStyle = '#7A6A50'; g.font = `${cv.width / 22}px sans-serif`; g.textAlign = 'center'; g.fillText('사진을 고르거나 카메라로 찍어 보세요', cv.width / 2, cv.height / 2); } }
      q('#ph-file').onchange = e => { const f = e.target.files[0]; if (!f) return; const img = new Image(); img.onload = () => { src = fitSquare(img, img.naturalWidth, img.naturalHeight); out = null; URL.revokeObjectURL(img.src); paint(); say('사진을 불러왔어요. 「바꾸기」로 그림처럼 만들 수 있어요.'); }; img.src = URL.createObjectURL(f); };
      async function camOn() {
        camStop(stream);
        try { stream = await camOpen(facing); } catch (e) { say('카메라를 켜지 못했어요: ' + esc(e.message || e.name)); return; }
        vid.srcObject = stream; vid.style.display = ''; await vid.play().catch(() => {}); q('#ph-camrow').style.display = '';
      }
      q('[data-cam]').onclick = camOn;
      q('[data-flip]').onclick = () => { facing = facing === 'environment' ? 'user' : 'environment'; camOn(); };
      q('[data-torch]').onclick = async () => { torchOn = !torchOn; const ok = await torch(stream, torchOn); if (!ok) { torchOn = false; say('이 폰·브라우저는 손전등 조절을 지원하지 않아요. 대신 「💡 조명」 탭의 가상 조명을 써 보세요.'); } q('[data-torch]').setAttribute('aria-pressed', torchOn); };
      const camOff = () => { camStop(stream); stream = null; vid.style.display = 'none'; q('#ph-camrow').style.display = 'none'; };
      q('[data-camoff]').onclick = camOff;
      q('[data-shot]').onclick = () => { if (!vid.videoWidth) return; const c = mk(vid.videoWidth, vid.videoHeight); c.getContext('2d').drawImage(vid, 0, 0); src = fitSquare(c, c.width, c.height); out = null; buzz(30); camOff(); paint(); say('찰칵! 「바꾸기」나 「밑그림으로 쓰고 그리기」를 눌러 보세요.'); };
      body.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { if (!src) { say('먼저 사진을 고르거나 찍어 주세요.'); return; } say('바꾸는 중…'); setTimeout(() => { const small = mk(512), sg = small.getContext('2d'); sg.drawImage(src, 0, 0, 512, 512); const r = FILTERS[b.dataset.f][1](small), big = mk(S); big.getContext('2d').drawImage(r, 0, 0, S, S); out = b.dataset.f === 'none' ? null : big; paint(); say(FILTERS[b.dataset.f][0] + ' 완료'); }, 30); });
      q('#ph-op').oninput = e => { doc.layers[0].op = e.target.value / 100; };
      q('[data-use]').onclick = () => { const c = out || src; if (!c) { say('먼저 사진을 고르거나 찍어 주세요.'); return; } const bg = doc.layers[0].cv.getContext('2d'); bg.fillStyle = '#fff'; bg.fillRect(0, 0, S, S); bg.drawImage(c, 0, 0, S, S); doc.bgLog = doc.layers[0].cv.toDataURL('image/jpeg', 0.7); if (doc.layers[0].op > 0.7) doc.layers[0].op = 0.6; ui.tool = 'canvas'; render(); };
      q('[data-keep]').onclick = () => { const c = out || src; if (c) keep(c, '사진 그림', 'photo'); };
      q('[data-dl]').onclick = async () => { const c = out || src; if (!c) return; const b = await new Promise(r => c.toBlob(r, 'image/png')); dl(b, `photo-art-${day()}.png`); };
      const ro = new ResizeObserver(size); ro.observe(box); size();
      stopNow = () => { ro.disconnect(); camStop(stream); };
    }

    /* ───────── 💡 조명 ───────── */
    function lightView(body) {
      const LIGHTS = { sun: ['☀ 햇빛', [255, 236, 200], 0.35], moon: ['🌙 달빛', [170, 195, 255], 0.18], sea: ['🌊 물속 빛', [120, 230, 240], 0.25], torch: ['🔦 손전등', [255, 245, 220], 0.08], sunset: ['🌅 노을', [255, 150, 90], 0.3] };
      const st = Object.assign({ kind: 'sun', lx: 0.25, ly: 0.2, power: 1, height: 1 }, lsGet('stu.light', {}));
      body.innerHTML = `<div class="wrap"><div><div class="cvbox dark" id="li-box"><canvas id="li-cv"></canvas></div><div class="tip" style="text-align:center">그림 위를 눌러 끌면 빛이 움직여요.</div></div>
        <div class="side"><div class="row">${Object.entries(LIGHTS).map(([k, v]) => `<button class="bt" data-k="${k}" aria-pressed="${st.kind === k}">${v[0]}</button>`).join('')}</div>
          <label class="row">밝기 <input type="range" id="li-p" min="20" max="200" value="${st.power * 100}"></label>
          <label class="row">입체감 <input type="range" id="li-h" min="0" max="300" value="${st.height * 100}"></label>
          <div class="row"><button class="bt pri" data-bake>🖌 캔버스에 굽기</button><button class="bt" data-keep>🖼 전시관에 걸기</button><button class="bt" data-dl>⬇ PNG</button></div>
          <div class="tip">그림의 밝고 어두운 곳을 높낮이로 바꿔, 빛이 비치는 방향에 따라 그림자를 계산해요(노멀맵 조명). 「굽기」는 결과를 새 레이어로 넣고 원래 레이어는 숨겨 둬요.</div></div></div>`;
      const box = body.querySelector('#li-box'), cv = body.querySelector('#li-cv'), g = cv.getContext('2d'), R = 512;
      const base = mk(R); base.getContext('2d').drawImage(flatten(), 0, 0, R, R);
      const bd = base.getContext('2d').getImageData(0, 0, R, R).data, H = gray(boxBlur(base, 1.5).getContext('2d').getImageData(0, 0, R, R).data);
      const out = mk(R), og = out.getContext('2d'), od = og.createImageData(R, R);
      let t0 = performance.now(), raf = 0;
      function shade(time) {
        const L = LIGHTS[st.kind], col = L[1], amb = L[2], lx = st.lx * R, ly = st.ly * R, lz = R * 0.35, hk = st.height * 2.2, P = st.power;
        for (let y = 1; y < R - 1; y++) for (let x = 1; x < R - 1; x++) {
          const i = y * R + x, nx = (H[i - 1] - H[i + 1]) * hk / 255, ny = (H[i - R] - H[i + R]) * hk / 255, nl = Math.hypot(nx, ny, 1);
          let dx = lx - x, dy = ly - y, dz = lz; const dl = Math.hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
          let dif = Math.max(0, (nx * dx + ny * dy + dz) / nl);
          let fall = 1; if (st.kind === 'torch') { const r = Math.hypot(lx - x, ly - y) / (R * 0.32); fall = Math.max(0, 1 - r * r); } else fall = 1 / (1 + (dl / R) * (dl / R) * 0.8);
          let caus = 0; if (st.kind === 'sea') caus = Math.max(0, Math.sin(x * 0.07 + time * 1.7) * Math.sin(y * 0.05 - time * 1.3) + Math.sin((x + y) * 0.045 + time)) * 0.18;
          const spec = Math.pow(Math.max(0, dif), 24) * 0.35;
          for (let k = 0; k < 3; k++) od.data[i * 4 + k] = clamp(bd[i * 4 + k] * (amb + (dif * fall + caus) * P * col[k] / 255) + spec * 255 * P * fall, 0, 255);
          od.data[i * 4 + 3] = 255;
        }
        og.putImageData(od, 0, 0); g.drawImage(out, 0, 0, cv.width, cv.height);
        g.fillStyle = `rgb(${L[1].join(',')})`; g.beginPath(); g.arc(st.lx * cv.width, st.ly * cv.height, cv.width * 0.015, 0, 6.283); g.fill();
      }
      function size() { const r = box.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.max(10, r.width * dpr); cv.height = cv.width; shade(0); }
      let dirty = true;
      function loop(t) { if (st.kind === 'sea' || dirty) { shade((t - t0) / 1000); dirty = false; } raf = requestAnimationFrame(loop); }
      const setL = e => { const r = cv.getBoundingClientRect(); st.lx = clamp((e.clientX - r.left) / r.width, 0, 1); st.ly = clamp((e.clientY - r.top) / r.height, 0, 1); dirty = true; };
      let dn = false; cv.onpointerdown = e => { dn = true; cap(cv, e); setL(e); }; cv.onpointermove = e => dn && setL(e); cv.onpointerup = cv.onpointercancel = () => { dn = false; lsSet('stu.light', st); };
      body.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { st.kind = b.dataset.k; body.querySelectorAll('[data-k]').forEach(x => x.setAttribute('aria-pressed', x === b)); dirty = true; lsSet('stu.light', st); });
      body.querySelector('#li-p').oninput = e => { st.power = e.target.value / 100; dirty = true; };
      body.querySelector('#li-h').oninput = e => { st.height = e.target.value / 100; dirty = true; };
      const big = () => { const c = mk(S); c.getContext('2d').drawImage(out, 0, 0, S, S); return c; };
      body.querySelector('[data-bake]').onclick = () => { doc.layers.forEach((L, i) => { if (i > 0) L.vis = false; }); doc.layers.push({ name: '조명 ' + LIGHTS[st.kind][0], cv: big(), vis: true, op: 1 }); doc.active = doc.layers.length - 1; say('조명 결과를 새 레이어로 넣었어요(전문가 모드에서 레이어를 볼 수 있어요).'); ui.tool = 'canvas'; render(); };
      body.querySelector('[data-keep]').onclick = () => keep(big(), '조명 그림 ' + LIGHTS[st.kind][0], 'light');
      body.querySelector('[data-dl]').onclick = async () => { const b = await new Promise(r => big().toBlob(r, 'image/png')); dl(b, `light-${day()}.png`); };
      const ro = new ResizeObserver(size); ro.observe(box); size(); raf = requestAnimationFrame(loop);
      stopNow = () => { ro.disconnect(); cancelAnimationFrame(raf); };
    }

    /* 그림 레이어만(배경 빼고) 잘라 쓰기 — 3D·4D·AR 공용. 그림이 없으면 바다 친구 본보기를 그려 씀 */
    function subject(R) {
      const c = mk(R), g = c.getContext('2d');
      if (hasDrawing()) { g.drawImage(flatten({ noBg: true }), 0, 0, R, R); return { cv: c, sample: false }; }
      const cr = window.ArtApp && (ArtApp.CR.find(x => x.id === ui.cr) || ArtApp.CR[0]);
      if (cr) { const k = R / 200; g.scale(k, k); g.lineWidth = 2.2; g.strokeStyle = '#2A2A2A'; g.lineJoin = 'round'; cr.parts.forEach(p => { const P = new Path2D(p[1]); g.fillStyle = p[2]; g.fill(P); g.stroke(P); }); cr.lines.forEach(d => g.stroke(new Path2D(d))); }
      return { cv: c, sample: true };
    }

    /* ───────── 🧊 3D ───────── */
    function d3View(body) {
      const st = { mode: 'puff', depth: 0, auto: true };
      body.innerHTML = `<div class="wrap"><div><div class="cvbox dark" id="t3-box"><div class="three" id="t3"></div></div></div>
        <div class="side"><div class="row"><button class="bt" data-m="puff" aria-pressed="true">🐡 그림 부풀리기</button><button class="bt" data-m="air">🌀 3D 공간 붓</button></div>
          <div id="t3-opt"></div>
          <div class="row"><button class="bt" data-auto aria-pressed="true">🔄 자동 회전</button><button class="bt" data-snap>📸 사진</button><button class="bt" data-spin>🎥 빙글 영상 4초</button></div>
          <div class="meter"><i id="t3-bar"></i></div>
          <div class="tip" id="t3-tip">캔버스에 그린 그림(배경 빼고)을 통통한 입체로 만들어요. 손가락으로 끌면 돌아가요.</div></div></div>`;
      const host = body.querySelector('#t3'), q = s => body.querySelector(s);
      let alive = true, renderer, scene, cam, group, raf = 0, rotX = 0.2, rotY = -0.5, drawing = null, airPts = [], preview = null;
      needThree().then(THREE => {
        if (!alive) return;
        renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); host.appendChild(renderer.domElement);
        scene = new THREE.Scene(); scene.background = new THREE.Color(0x06121C); scene.fog = new THREE.Fog(0x06121C, 6, 14);
        cam = new THREE.PerspectiveCamera(40, 1, 0.1, 50); cam.position.set(0, 0, 4.2);
        scene.add(new THREE.AmbientLight(0x88aacc, 0.55)); const dl1 = new THREE.DirectionalLight(0xffffff, 0.9); dl1.position.set(2, 3, 4); scene.add(dl1); const dl2 = new THREE.DirectionalLight(0x3fb4e0, 0.5); dl2.position.set(-3, -1, -2); scene.add(dl2);
        group = new THREE.Group(); scene.add(group);
        const size = () => { const r = host.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%'; cam.aspect = r.width / Math.max(1, r.height); cam.updateProjectionMatrix(); };
        const ro = new ResizeObserver(size); ro.observe(host); size();
        function clear() { while (group.children.length) { const m = group.children.pop(); m.geometry && m.geometry.dispose(); if (m.material) { m.material.map && m.material.map.dispose(); m.material.dispose(); } } }
        function puff() {
          clear(); const N = 128, sub = subject(N * 2), small = mk(N), sg = small.getContext('2d'); sg.drawImage(sub.cv, 0, 0, N, N);
          const a = sg.getImageData(0, 0, N, N).data, D = new Float32Array(N * N);
          for (let i = 0; i < N * N; i++) D[i] = a[i * 4 + 3] > 20 ? 1e9 : 0;
          for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (!D[i]) continue; D[i] = Math.min(D[i], (x ? D[i - 1] : 0) + 1, (y ? D[i - N] : 0) + 1, (x && y ? D[i - N - 1] : 0) + 1.414, (y && x < N - 1 ? D[i - N + 1] : 0) + 1.414); }
          for (let y = N - 1; y >= 0; y--) for (let x = N - 1; x >= 0; x--) { const i = y * N + x; if (!D[i]) continue; D[i] = Math.min(D[i], (x < N - 1 ? D[i + 1] : 0) + 1, (y < N - 1 ? D[i + N] : 0) + 1, (x < N - 1 && y < N - 1 ? D[i + N + 1] : 0) + 1.414, (y < N - 1 && x ? D[i + N - 1] : 0) + 1.414); }
          let mx = 1; for (let i = 0; i < N * N; i++) if (D[i] < 1e8) mx = Math.max(mx, D[i]);
          const tex = new THREE.CanvasTexture(sub.cv);
          [1, -1].forEach(side => {
            const geo = new THREE.PlaneGeometry(2.4, 2.4, N - 1, N - 1), pos = geo.attributes.position;
            for (let i = 0; i < pos.count; i++) { const x = i % N, y = (i / N) | 0, d = D[y * N + x]; pos.setZ(i, d < 1e8 ? Math.sqrt(d / mx) * 0.42 * side : 0); }
            geo.computeVertexNormals();
            const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.3, side: side > 0 ? THREE.FrontSide : THREE.BackSide, roughness: 0.55, metalness: 0.05 });
            group.add(new THREE.Mesh(geo, mat));
          });
          q('#t3-tip').textContent = sub.sample ? '캔버스에 그린 그림이 없어 본보기 바다 친구를 부풀렸어요. 🖌 캔버스에서 그리고 다시 와 보세요.' : '내 그림을 통통한 입체로 만들었어요. 손가락으로 끌어 돌려 보세요.';
        }
        function air() {
          clear(); const grid = new THREE.GridHelper(4, 16, 0x2a6a8a, 0x173040); grid.position.y = -1.3; group.add(grid);
          q('#t3-tip').innerHTML = '「그리기」를 켜고 화면에 그으면 지금 깊이(슬라이더)에 3D 선이 생겨요. 「돌려 보기」로 바꿔 돌려 보면 입체로 보여요.';
        }
        function airAdd(pts, color, rad) {
          if (pts.length < 2) return;
          const curve = new THREE.CatmullRomCurve3(pts), geo = new THREE.TubeGeometry(curve, Math.min(400, pts.length * 3), rad, 8, false);
          group.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.25, roughness: 0.4 })));
        }
        const opt = () => {
          q('#t3-opt').innerHTML = st.mode === 'puff' ? '<button class="bt" data-re>🔁 캔버스 그림 다시 불러오기</button>'
            : `<div class="row"><button class="bt" data-draw aria-pressed="${!!drawing}">✏ 그리기</button><button class="bt" data-look aria-pressed="${!drawing}">👀 돌려 보기</button><button class="bt" data-aclr>🗑</button></div><label class="row">깊이 <input type="range" id="t3-d" min="-100" max="100" value="${st.depth}"></label><div class="row">${PAL.slice(2, 12).map(c => `<button class="sw" data-c="${c}" style="background:${c}" aria-pressed="${ui.color === c}"></button>`).join('')}</div>`;
          const on = (s, f) => { const n = q(s); if (n) n.onclick = f; };
          on('[data-re]', puff);
          on('[data-draw]', () => { drawing = {}; st.auto = false; q('[data-auto]').setAttribute('aria-pressed', false); opt(); });
          on('[data-look]', () => { drawing = null; opt(); });
          on('[data-aclr]', air);
          const d = q('#t3-d'); if (d) d.oninput = e => { st.depth = +e.target.value; };
          body.querySelectorAll('#t3-opt [data-c]').forEach(b => b.onclick = () => { ui.color = b.dataset.c; save(); opt(); });
        };
        body.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { st.mode = b.dataset.m; body.querySelectorAll('[data-m]').forEach(x => x.setAttribute('aria-pressed', x === b)); drawing = null; rotX = 0.2; rotY = st.mode === 'puff' ? -0.5 : 0; (st.mode === 'puff' ? puff : air)(); opt(); });
        q('[data-auto]').onclick = () => { st.auto = !st.auto; q('[data-auto]').setAttribute('aria-pressed', st.auto); };
        // 끌기: 돌리기 또는 3D 선 그리기
        const cvx = renderer.domElement; cvx.style.touchAction = 'none'; let last = null;
        const ray = new THREE.Raycaster(), plane = new THREE.Plane();
        function hit(e) {
          const r = cvx.getBoundingClientRect(), v = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
          ray.setFromCamera(v, cam); const z = st.depth / 100 * 1.4; plane.set(new THREE.Vector3(0, 0, 1), -z);
          const p = new THREE.Vector3(); if (!ray.ray.intersectPlane(plane, p)) return null; return group.worldToLocal(p);
        }
        cvx.onpointerdown = e => { cap(cvx, e); last = [e.clientX, e.clientY]; if (drawing && st.mode === 'air') { airPts = []; const p = hit(e); if (p) airPts.push(p); } };
        cvx.onpointermove = e => {
          if (!last) return;
          if (drawing && st.mode === 'air') {
            const p = hit(e); if (!p) return; if (airPts.length && airPts[airPts.length - 1].distanceTo(p) < 0.02) return; airPts.push(p);
            if (preview) { group.remove(preview); preview.geometry.dispose(); } preview = new THREE.Line(new THREE.BufferGeometry().setFromPoints(airPts), new THREE.LineBasicMaterial({ color: ui.color })); group.add(preview); return;
          }
          rotY += (e.clientX - last[0]) * 0.01; rotX = clamp(rotX + (e.clientY - last[1]) * 0.01, -1.4, 1.4); last = [e.clientX, e.clientY]; st.auto = false; q('[data-auto]').setAttribute('aria-pressed', false);
        };
        cvx.onpointerup = cvx.onpointercancel = () => { last = null; if (drawing && airPts.length > 1) { if (preview) { group.remove(preview); preview.geometry.dispose(); preview = null; } airAdd(airPts, ui.color, ui.size / 900 + 0.01); buzz(10); } airPts = []; };
        function loop() { if (st.auto) rotY += 0.008; group.rotation.set(rotX, rotY, 0); renderer.render(scene, cam); raf = requestAnimationFrame(loop); }
        q('[data-snap]').onclick = () => { renderer.render(scene, cam); const c = mk(renderer.domElement.width, renderer.domElement.height); c.getContext('2d').drawImage(renderer.domElement, 0, 0); keep(c, st.mode === 'puff' ? '3D 부풀린 그림' : '3D 공간 그림', '3d'); };
        q('[data-spin]').onclick = async () => { const keepAuto = st.auto; st.auto = true; try { const b = await record(renderer.domElement, 4000, k => { q('#t3-bar').style.width = (k * 100) + '%'; }); dl(b, `3d-spin-${day()}.${extOf(b)}`); say('🎥 빙글 영상을 저장했어요.'); } catch (e) { say(esc(e.message)); } st.auto = keepAuto; };
        puff(); opt(); loop();
        stopNow = () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); clear(); renderer.dispose(); };
      }).catch(e => { q('#t3-tip').textContent = e.message; });
      stopNow = () => { alive = false; };
    }

    /* ───────── ⏱ 4D 움직임 ───────── */
    function d4View(body) {
      const st = Object.assign({ mode: 'swim', speed: 1, wave: 1, bg: 'sea', fps: 8 }, lsGet('stu.4d', {}));
      body.innerHTML = `<div class="wrap"><div><div class="cvbox dark" id="a4-box"><canvas id="a4"></canvas></div></div>
        <div class="side"><div class="row"><button class="bt" data-m="swim" aria-pressed="${st.mode === 'swim'}">🐟 헤엄치는 그림</button><button class="bt" data-m="flip" aria-pressed="${st.mode === 'flip'}">📒 플립북</button></div>
          <div id="a4-opt"></div><div class="meter"><i id="a4-bar"></i></div>
          <div class="row"><button class="bt pri" data-rec>🎥 영상 저장(5초)</button></div>
          <div class="tip" id="a4-tip"></div></div></div>`;
      const box = body.querySelector('#a4-box'), cv = body.querySelector('#a4'), g = cv.getContext('2d'), q = s => body.querySelector(s);
      let raf = 0, t0 = performance.now(), sub = subject(512), bubbles = [];
      const frames = [mk(512)]; let fi = 0, playing = false, fdraw = null;
      function size() { const r = box.getBoundingClientRect(); cv.width = 720; cv.height = Math.round(720 * r.height / Math.max(1, r.width)); }
      function sea(t) {
        if (st.bg === 'sea') { const gr = g.createLinearGradient(0, 0, 0, cv.height); gr.addColorStop(0, '#2C8CB0'); gr.addColorStop(1, '#06223F'); g.fillStyle = gr; g.fillRect(0, 0, cv.width, cv.height); g.fillStyle = 'rgba(255,255,255,.07)'; for (let i = 0; i < 5; i++) { const x = (i * 170 + t * 20) % (cv.width + 200) - 100; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 60, 0); g.lineTo(x - 80, cv.height); g.lineTo(x - 140, cv.height); g.fill(); } g.fillStyle = '#C9B48A'; g.beginPath(); g.moveTo(0, cv.height); for (let x = 0; x <= cv.width; x += 40) g.lineTo(x, cv.height - 30 - Math.sin(x * 0.02) * 12); g.lineTo(cv.width, cv.height); g.fill(); }
        else { g.fillStyle = '#F6F0E2'; g.fillRect(0, 0, cv.width, cv.height); }
      }
      function swim(t) {
        sea(t); const W = cv.width, sz = W * 0.55, sp = st.speed, k = 512 / sz, period = 9 / sp, ph = (t % period) / period, dir = Math.floor(t / period) % 2 ? -1 : 1;
        const x = dir > 0 ? -sz * 0.6 + ph * (W + sz * 1.2) : W + sz * 0.6 - ph * (W + sz * 1.2), y = cv.height * 0.45 + Math.sin(t * 1.3) * 30;
        g.save(); g.translate(x, y); g.scale(dir, 1);
        const strip = 6; for (let sx = 0; sx < sz; sx += strip) { const u = sx / sz, amp = st.wave * 14 * Math.pow(1 - u, 1.6), dy = Math.sin(t * 6 * sp - u * 5) * amp; g.drawImage(sub.cv, sx * k, 0, strip * k + 1, 512, sx - sz / 2, -sz / 2 + dy, strip + 0.6, sz); }
        g.restore();
        if (Math.random() < 0.15) bubbles.push({ x: x + dir * sz * 0.4, y, r: 3 + Math.random() * 6, v: 40 + Math.random() * 40 });
        g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; bubbles = bubbles.filter(b => (b.y -= b.v / 60) > -10); bubbles.forEach(b => { g.beginPath(); g.arc(b.x + Math.sin(b.y * 0.05) * 6, b.y, b.r, 0, 6.283); g.stroke(); });
      }
      function flip() {
        g.fillStyle = '#FBF8F0'; g.fillRect(0, 0, cv.width, cv.height); const s = Math.min(cv.width, cv.height), ox = (cv.width - s) / 2, oy = (cv.height - s) / 2;
        if (playing) { g.drawImage(frames[fi], ox, oy, s, s); }
        else { if (fi > 0) { g.globalAlpha = 0.22; g.drawImage(frames[fi - 1], ox, oy, s, s); g.globalAlpha = 1; } g.drawImage(frames[fi], ox, oy, s, s); }
        g.fillStyle = '#556'; g.font = '22px sans-serif'; g.fillText(`${fi + 1} / ${frames.length}`, 14, 30);
      }
      let lastF = 0;
      function loop(now) {
        const t = (now - t0) / 1000;
        if (st.mode === 'swim') swim(t);
        else { if (playing && now - lastF > 1000 / st.fps) { fi = (fi + 1) % frames.length; lastF = now; } flip(); }
        raf = requestAnimationFrame(loop);
      }
      function opt() {
        if (st.mode === 'swim') {
          q('#a4-opt').innerHTML = `<label class="row">속도 <input type="range" id="a4-s" min="30" max="300" value="${st.speed * 100}"></label><label class="row">꼬리 흔들기 <input type="range" id="a4-w" min="0" max="300" value="${st.wave * 100}"></label><div class="row"><button class="bt" data-bg="sea" aria-pressed="${st.bg === 'sea'}">🌊 바다</button><button class="bt" data-bg="paper" aria-pressed="${st.bg === 'paper'}">📄 종이</button><button class="bt" data-re>🔁 캔버스 그림 다시</button></div>`;
          q('#a4-tip').textContent = sub.sample ? '캔버스에 그림이 없어 본보기 물고기가 헤엄쳐요. 🖌 캔버스에서 옆모습 물고기(머리가 왼쪽)를 그려 보세요.' : '내 그림이 꼬리를 흔들며 헤엄쳐요. 머리가 왼쪽인 옆모습 그림이 가장 자연스러워요.';
          q('#a4-s').oninput = e => { st.speed = e.target.value / 100; lsSet('stu.4d', st); };
          q('#a4-w').oninput = e => { st.wave = e.target.value / 100; lsSet('stu.4d', st); };
          body.querySelectorAll('[data-bg]').forEach(b => b.onclick = () => { st.bg = b.dataset.bg; lsSet('stu.4d', st); opt(); });
          q('[data-re]').onclick = () => { sub = subject(512); opt(); };
        } else {
          q('#a4-opt').innerHTML = `<div class="row"><button class="bt" data-fp>◀</button><button class="bt" data-fn>▶</button><button class="bt" data-fadd>＋ 장 추가</button><button class="bt" data-fcopy>⧉ 복사해 추가</button><button class="bt" data-fdel>－</button></div><div class="row"><button class="bt pri" data-play>${playing ? '⏸ 멈춤' : '▶ 재생'}</button><label class="row">빠르기 <input type="range" id="a4-f" min="2" max="24" value="${st.fps}"></label></div><div class="row">${PAL.slice(0, 10).map(c => `<button class="sw" data-c="${c}" style="background:${c}" aria-pressed="${ui.color === c}"></button>`).join('')}<button class="bt" data-er aria-pressed="${ui.brush === 'eraser'}">🧽</button></div>`;
          q('#a4-tip').textContent = '한 장씩 조금씩 바꿔 그리면 움직이는 그림이 돼요. 앞 장이 흐리게 비쳐 보여요(어니언 스킨). 최대 24장.';
          const on = (s, f) => q(s).onclick = f;
          on('[data-fp]', () => { playing = false; fi = Math.max(0, fi - 1); opt(); });
          on('[data-fn]', () => { playing = false; fi = Math.min(frames.length - 1, fi + 1); opt(); });
          on('[data-fadd]', () => { if (frames.length >= 24) return; frames.splice(fi + 1, 0, mk(512)); fi++; opt(); });
          on('[data-fcopy]', () => { if (frames.length >= 24) return; const c = mk(512); c.getContext('2d').drawImage(frames[fi], 0, 0); frames.splice(fi + 1, 0, c); fi++; opt(); });
          on('[data-fdel]', () => { if (frames.length <= 1) { frames[0] = mk(512); return; } frames.splice(fi, 1); fi = Math.min(fi, frames.length - 1); opt(); });
          on('[data-play]', () => { playing = !playing; opt(); });
          q('#a4-f').oninput = e => { st.fps = +e.target.value; lsSet('stu.4d', st); };
          body.querySelectorAll('#a4-opt [data-c]').forEach(b => b.onclick = () => { ui.color = b.dataset.c; if (ui.brush === 'eraser') ui.brush = 'pen'; save(); opt(); });
          on('[data-er]', () => { ui.brush = ui.brush === 'eraser' ? 'pen' : 'eraser'; save(); opt(); });
        }
      }
      const fpt = e => { const r = cv.getBoundingClientRect(), s = Math.min(r.width, r.height), ox = (r.width - s) / 2, oy = (r.height - s) / 2; return [(e.clientX - r.left - ox) / s * 512, (e.clientY - r.top - oy) / s * 512, 0.5]; };
      cv.onpointerdown = e => { if (st.mode !== 'flip' || playing) return; cap(cv, e); fdraw = fpt(e); seg(frames[fi].getContext('2d'), ui.brush === 'eraser' ? 'eraser' : 'pen', ui.color, Math.max(4, ui.size / 2), fdraw, fdraw); };
      cv.onpointermove = e => { if (!fdraw) return; const p = fpt(e); seg(frames[fi].getContext('2d'), ui.brush === 'eraser' ? 'eraser' : 'pen', ui.color, Math.max(4, ui.size / 2), fdraw, p); fdraw = p; };
      cv.onpointerup = cv.onpointercancel = () => { fdraw = null; };
      body.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { st.mode = b.dataset.m; lsSet('stu.4d', st); body.querySelectorAll('[data-m]').forEach(x => x.setAttribute('aria-pressed', x === b)); playing = false; opt(); });
      q('[data-rec]').onclick = async () => { if (st.mode === 'flip') { playing = true; opt(); } try { const b = await record(cv, 5000, k => { q('#a4-bar').style.width = (k * 100) + '%'; }); dl(b, `moving-art-${day()}.${extOf(b)}`); say('🎥 움직이는 그림 영상을 저장했어요. 쇼츠·SNS에 직접 올릴 수 있어요.'); } catch (e) { say(esc(e.message)); } };
      const ro = new ResizeObserver(size); ro.observe(box); size(); opt(); raf = requestAnimationFrame(loop);
      stopNow = () => { ro.disconnect(); cancelAnimationFrame(raf); };
    }

    /* ───────── 📳 5D 감각 ───────── */
    function d5View(body) {
      body.innerHTML = `<div class="wrap"><div><div class="cvbox" id="s5-box"><canvas id="s5"></canvas></div></div>
        <div class="side"><div class="row"><button class="bt pri" data-sense>📳 움직임 센서 켜기</button><button class="bt" data-mic>🎤 소리 붓 켜기</button></div>
          <div class="tip" id="s5-state">센서 꺼짐</div>
          <div class="row">${PAL.slice(2, 12).map(c => `<button class="sw" data-c="${c}" style="background:${c}" aria-pressed="${ui.color === c}"></button>`).join('')}</div>
          <label class="row">기울기(PC용) ↔ <input type="range" id="s5-gx" min="-100" max="100" value="0"></label><label class="row">↕ <input type="range" id="s5-gy" min="-100" max="100" value="60"></label>
          <div class="row"><button class="bt" data-shake>💥 흔들기 흉내</button><button class="bt" data-clr>🗑 지우기</button></div>
          <div class="row"><button class="bt pri" data-keep>🖼 전시관에 걸기</button><button class="bt" data-dl>⬇ PNG</button></div>
          <div class="tip">• 그리면 물감 방울이 생기고, 폰을 <b>기울이면</b> 그쪽으로 흘러내려요.<br>• 폰을 <b>흔들면</b> 물방울이 터지고 진동이 와요.<br>• 소리 붓: 소리가 크면 붓이 굵어지고 반짝여요(마이크 소리는 저장하지 않아요).<br>• 센서는 단추를 눌러야 켜지고, 이 화면을 나가면 꺼져요.</div></div></div>`;
      const box = body.querySelector('#s5-box'), cv = body.querySelector('#s5'), g = cv.getContext('2d'), q = s => body.querySelector(s);
      const art = mk(S), ag = art.getContext('2d'); ag.fillStyle = '#FBF8F0'; ag.fillRect(0, 0, S, S);
      let gx = 0, gy = 0.6, drops = [], pop = [], raf = 0, mic = null, vol = 0, last = null, lastShake = 0;
      function size() { const r = box.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.max(10, r.width * dpr); cv.height = cv.width; }
      function onOri(e) { if (e.gamma == null) return; gx = clamp(e.gamma / 45, -1, 1); gy = clamp(e.beta / 45, -1, 1); q('#s5-state').textContent = `기울기 좌우 ${e.gamma.toFixed(0)}° · 앞뒤 ${e.beta.toFixed(0)}°` + (mic ? ` · 소리 ${Math.round(vol * 100)}` : ''); }
      function onMot(e) { const a = e.accelerationIncludingGravity || e.acceleration; if (!a) return; const m = Math.hypot(a.x || 0, a.y || 0, a.z || 0); if (m > 22 && performance.now() - lastShake > 500) { lastShake = performance.now(); shake(); } }
      function shake() { buzz([30, 40, 30]); for (let i = 0; i < 40; i++) pop.push({ x: Math.random() * S, y: Math.random() * S, r: 0, R: 10 + Math.random() * 40, c: PAL[2 + (Math.random() * 10 | 0)] }); drops.forEach(d => { d.vx += (Math.random() - 0.5) * 8; d.vy += (Math.random() - 0.5) * 8; }); }
      q('[data-sense]').onclick = async () => {
        try { if (window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission) { const r = await DeviceOrientationEvent.requestPermission(); if (r !== 'granted') { q('#s5-state').textContent = '센서 허락이 필요해요(설정에서 바꿀 수 있어요).'; return; } } if (window.DeviceMotionEvent && DeviceMotionEvent.requestPermission) await DeviceMotionEvent.requestPermission().catch(() => {}); } catch (e) {}
        window.addEventListener('deviceorientation', onOri); window.addEventListener('devicemotion', onMot); q('#s5-state').textContent = '센서 켜짐 — 폰을 기울이거나 흔들어 보세요. (PC는 아래 슬라이더로)'; q('[data-sense]').setAttribute('aria-pressed', true);
      };
      q('[data-mic]').onclick = async () => {
        if (mic) { camStop(mic.s); try { mic.ac.close(); } catch (e) {} mic = null; vol = 0; q('[data-mic]').setAttribute('aria-pressed', false); return; }
        try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }), ac = new (window.AudioContext || window.webkitAudioContext)(), an = ac.createAnalyser(); an.fftSize = 512; ac.createMediaStreamSource(s).connect(an); mic = { s, ac, an, buf: new Uint8Array(an.fftSize) }; q('[data-mic]').setAttribute('aria-pressed', true); }
        catch (e) { q('#s5-state').textContent = '마이크를 켜지 못했어요: ' + (e.message || e.name); }
      };
      q('#s5-gx').oninput = e => { gx = e.target.value / 100; }; q('#s5-gy').oninput = e => { gy = e.target.value / 100; };
      q('[data-shake]').onclick = shake;
      q('[data-clr]').onclick = () => { ag.fillStyle = '#FBF8F0'; ag.fillRect(0, 0, S, S); drops = []; };
      body.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { ui.color = b.dataset.c; save(); body.querySelectorAll('[data-c]').forEach(x => x.setAttribute('aria-pressed', x === b)); });
      const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * S, (e.clientY - r.top) / r.height * S]; };
      cv.onpointerdown = e => { cap(cv, e); last = pt(e); };
      cv.onpointermove = e => {
        if (!last) return; const p = pt(e), w = 6 + vol * 60;
        ag.strokeStyle = ui.color; ag.lineWidth = w; ag.lineCap = 'round'; ag.beginPath(); ag.moveTo(last[0], last[1]); ag.lineTo(p[0], p[1]); ag.stroke();
        if (vol > 0.25) { ag.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 4; i++) ag.fillRect(p[0] + (Math.random() - 0.5) * w * 2, p[1] + (Math.random() - 0.5) * w * 2, 3, 3); }
        if (Math.random() < 0.35 && drops.length < 400) drops.push({ x: p[0], y: p[1], vx: 0, vy: 0, r: 3 + Math.random() * 4 + vol * 6, c: ui.color, life: 220 + Math.random() * 200 });
        if (Math.random() < 0.2) buzz(4); last = p;
      };
      cv.onpointerup = cv.onpointercancel = () => { last = null; };
      function loop() {
        if (mic) { mic.an.getByteTimeDomainData(mic.buf); let s = 0; for (const v of mic.buf) s += (v - 128) * (v - 128); vol = clamp(Math.sqrt(s / mic.buf.length) / 40, 0, 1); }
        drops = drops.filter(d => d.life-- > 0 && d.x > -20 && d.x < S + 20 && d.y > -20 && d.y < S + 20);
        drops.forEach(d => { d.vx = d.vx * 0.96 + gx * 0.35; d.vy = d.vy * 0.96 + gy * 0.35; const nx = d.x + d.vx, ny = d.y + d.vy; ag.strokeStyle = hexA(d.c, 0.5); ag.lineWidth = d.r; ag.lineCap = 'round'; ag.beginPath(); ag.moveTo(d.x, d.y); ag.lineTo(nx, ny); ag.stroke(); d.x = nx; d.y = ny; d.r *= 0.997; });
        g.drawImage(art, 0, 0, cv.width, cv.height); const k = cv.width / S;
        pop = pop.filter(p => (p.r += 2) < p.R); pop.forEach(p => { g.strokeStyle = hexA(p.c, 1 - p.r / p.R); g.lineWidth = 3; g.beginPath(); g.arc(p.x * k, p.y * k, p.r * k * 2, 0, 6.283); g.stroke(); });
        g.fillStyle = 'rgba(30,40,60,.5)'; g.beginPath(); g.arc(cv.width - 30, 30, 18, 0, 6.283); g.fill(); g.fillStyle = '#3FB4E0'; g.beginPath(); g.arc(cv.width - 30 + gx * 14, 30 + gy * 14, 6, 0, 6.283); g.fill();
        raf = requestAnimationFrame(loop);
      }
      q('[data-keep]').onclick = () => keep(art, '감각 그림(기울기·흔들기)', '5d');
      q('[data-dl]').onclick = async () => { const b = await new Promise(r => art.toBlob(r, 'image/png')); dl(b, `sense-art-${day()}.png`); };
      const ro = new ResizeObserver(size); ro.observe(box); size(); raf = requestAnimationFrame(loop);
      stopNow = () => { ro.disconnect(); cancelAnimationFrame(raf); window.removeEventListener('deviceorientation', onOri); window.removeEventListener('devicemotion', onMot); if (mic) { camStop(mic.s); try { mic.ac.close(); } catch (e) {} } };
    }

    /* ───────── 🕶 AR 카메라 ───────── */
    function arView(body) {
      body.innerHTML = `<div class="wrap"><div><div class="cvbox tall dark" id="ar-box"><video id="ar-vid" playsinline muted></video><canvas id="ar-cv"></canvas></div></div>
        <div class="side"><div class="row"><button class="bt pri" data-on>📷 AR 카메라 켜기</button><button class="bt" data-flip>🔄 앞·뒤</button><button class="bt" data-torch>🔦 손전등</button></div>
          <div class="row"><button class="bt" data-tool="fish" aria-pressed="true">🐟 내 그림 놓기</button><button class="bt" data-tool="stk">⭐ 스티커 놓기</button><button class="bt" data-tool="pen">✨ 빛 붓으로 쓰기</button><button class="bt" data-tool="move">✋ 옮기기</button></div>
          <div class="row" id="ar-stk">${STICK.slice(0, 12).map(s => `<button class="stk" data-stk="${s}" aria-pressed="${ui.sticker === s}">${s}</button>`).join('')}</div>
          <div class="row">${['#FFFFFF', '#F5D547', '#3FB4E0', '#E879A8', '#6FC36A', '#F29A38'].map(c => `<button class="sw" data-c="${c}" style="background:${c}" aria-pressed="${ui.color === c}"></button>`).join('')}</div>
          <label class="row">크기 <input type="range" id="ar-sz" min="20" max="200" value="80"></label>
          <div class="row"><button class="bt" data-undo>↶</button><button class="bt" data-clr>🗑</button><button class="bt pri" data-shot>📸 찍기</button><button class="bt" data-rec>🎥 5초 영상</button></div><div class="meter"><i id="ar-bar"></i></div>
          <div class="tip">카메라 화면 위에 내 그림·스티커·빛 글씨를 놓고 함께 찍어요. 놓은 물고기는 살랑살랑 헤엄쳐요. (화면 위에 겹치는 방식이라 폰을 움직이면 그림도 화면에 그대로 있어요.) 카메라 영상은 저장하기 전까지 어디에도 남지 않아요.</div></div></div>`;
      const box = body.querySelector('#ar-box'), vid = body.querySelector('#ar-vid'), cv = body.querySelector('#ar-cv'), g = cv.getContext('2d'), q = s => body.querySelector(s);
      let stream = null, facing = 'environment', torchOn = false, tool = 'fish', items = [], raf = 0, scale = 0.8, cur = null, drag = null;
      const fish = subject(256).cv;
      function size() { const r = box.getBoundingClientRect(); cv.width = 720; cv.height = Math.round(720 * r.height / Math.max(1, r.width)); }
      async function on() { camStop(stream); try { stream = await camOpen(facing); vid.srcObject = stream; await vid.play().catch(() => {}); q('[data-on]').setAttribute('aria-pressed', true); } catch (e) { say('카메라를 켜지 못했어요: ' + esc(e.message || e.name) + ' — 카메라 없이도 그림을 놓아 볼 수 있어요.'); } }
      q('[data-on]').onclick = on;
      q('[data-flip]').onclick = () => { facing = facing === 'environment' ? 'user' : 'environment'; on(); };
      q('[data-torch]').onclick = async () => { torchOn = !torchOn; if (!(await torch(stream, torchOn))) { torchOn = false; say('이 폰·브라우저는 손전등 조절을 지원하지 않아요.'); } q('[data-torch]').setAttribute('aria-pressed', torchOn); };
      body.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => { tool = b.dataset.tool; body.querySelectorAll('[data-tool]').forEach(x => x.setAttribute('aria-pressed', x === b)); });
      body.querySelectorAll('[data-stk]').forEach(b => b.onclick = () => { ui.sticker = b.dataset.stk; save(); body.querySelectorAll('[data-stk]').forEach(x => x.setAttribute('aria-pressed', x === b)); tool = 'stk'; body.querySelectorAll('[data-tool]').forEach(x => x.setAttribute('aria-pressed', x.dataset.tool === 'stk')); });
      body.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { ui.color = b.dataset.c; save(); body.querySelectorAll('[data-c]').forEach(x => x.setAttribute('aria-pressed', x === b)); });
      q('#ar-sz').oninput = e => { scale = e.target.value / 100; };
      q('[data-undo]').onclick = () => items.pop(); q('[data-clr]').onclick = () => { items = []; };
      const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * cv.width, (e.clientY - r.top) / r.height * cv.height]; };
      cv.onpointerdown = e => {
        cap(cv, e); const p = pt(e);
        if (tool === 'move') { drag = [...items].reverse().find(it => it.k !== 'pen' && Math.hypot(it.x - p[0], it.y - p[1]) < it.s * 0.6); if (drag) drag.off = [drag.x - p[0], drag.y - p[1]]; return; }
        if (tool === 'pen') { cur = { k: 'pen', c: ui.color, pts: [p] }; items.push(cur); return; }
        items.push({ k: tool, e: ui.sticker, x: p[0], y: p[1], s: 160 * scale, ph: Math.random() * 6, dir: Math.random() < 0.5 ? 1 : -1 }); buzz(12);
      };
      cv.onpointermove = e => { const p = pt(e); if (drag) { drag.x = p[0] + drag.off[0]; drag.y = p[1] + drag.off[1]; } else if (cur) cur.pts.push(p); };
      cv.onpointerup = cv.onpointercancel = () => { cur = null; drag = null; };
      function paintItems(G, t, sx, sy) {
        items.forEach(it => {
          if (it.k === 'pen') { G.save(); G.lineCap = G.lineJoin = 'round'; G.shadowColor = it.c; G.shadowBlur = 18 * sx; G.strokeStyle = it.c; G.lineWidth = 8 * sx; G.beginPath(); it.pts.forEach((p, i) => i ? G.lineTo(p[0] * sx, p[1] * sy) : G.moveTo(p[0] * sx, p[1] * sy)); G.stroke(); G.shadowBlur = 0; G.strokeStyle = '#fff'; G.lineWidth = 2.5 * sx; G.stroke(); G.restore(); return; }
          const bob = Math.sin(t * 2 + it.ph) * 8, x = (it.x + (it.k === 'fish' ? Math.sin(t * 0.7 + it.ph) * 20 * it.dir : 0)) * sx, y = (it.y + bob) * sy, s = it.s * sx;
          G.save(); G.translate(x, y);
          if (it.k === 'fish') { G.scale(it.dir * (1 + Math.sin(t * 6 + it.ph) * 0.03), 1); G.shadowColor = 'rgba(0,0,0,.35)'; G.shadowBlur = 12; G.drawImage(fish, -s / 2, -s / 2, s, s); }
          else { G.font = `${s * 0.8}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`; G.textAlign = 'center'; G.textBaseline = 'middle'; G.fillText(it.e, 0, 0); }
          G.restore();
        });
      }
      function loop(now) { const t = now / 1000; g.clearRect(0, 0, cv.width, cv.height); if (!stream) { g.fillStyle = 'rgba(255,255,255,.5)'; g.font = '26px sans-serif'; g.textAlign = 'center'; g.fillText('📷 AR 카메라 켜기를 눌러 주세요', cv.width / 2, 60); g.textAlign = 'start'; } paintItems(g, t, 1, 1); raf = requestAnimationFrame(loop); }
      function composite(t) {
        const W = cv.width, H = cv.height, c = mk(W, H), G = c.getContext('2d'); G.fillStyle = '#06121C'; G.fillRect(0, 0, W, H);
        if (stream && vid.videoWidth) { const k = Math.max(W / vid.videoWidth, H / vid.videoHeight), w = vid.videoWidth * k, h = vid.videoHeight * k; G.drawImage(vid, (W - w) / 2, (H - h) / 2, w, h); }
        paintItems(G, t, 1, 1); return c;
      }
      q('[data-shot]').onclick = () => { buzz(30); keep(composite(performance.now() / 1000), 'AR 사진', 'ar'); };
      q('[data-rec]').onclick = async () => {
        const rc = mk(cv.width, cv.height), rg = rc.getContext('2d'); let on2 = true; (function f() { if (!on2) return; rg.drawImage(composite(performance.now() / 1000), 0, 0); requestAnimationFrame(f); })();
        try { const b = await record(rc, 5000, k => { q('#ar-bar').style.width = (k * 100) + '%'; }); dl(b, `ar-${day()}.${extOf(b)}`); say('🎥 AR 영상을 저장했어요.'); } catch (e) { say(esc(e.message)); } on2 = false;
      };
      const ro = new ResizeObserver(size); ro.observe(box); size(); raf = requestAnimationFrame(loop);
      stopNow = () => { ro.disconnect(); cancelAnimationFrame(raf); camStop(stream); };
    }

    /* ───────── 🎞 타임랩스 ───────── */
    function lapseView(body) {
      const n = doc.log.length;
      body.innerHTML = `<div class="wrap"><div><div class="cvbox tall dark" id="tl-box"><canvas id="tl"></canvas></div></div>
        <div class="side"><div class="tip">🖌 캔버스에서 그린 순서(${n}번의 붓질)를 세로 영상으로 다시 그려요. 쇼츠·릴스 크기(9:16).</div>
          <label class="row">제목 <input id="tl-title" value="${esc(lsGet('stu.lapseTitle', '바다 그림 타임랩스'))}" maxlength="30" style="flex:1"></label>
          <label class="row">길이 <select id="tl-len"><option value="8">8초</option><option value="15" selected>15초</option><option value="30">30초</option></select></label>
          <div class="row"><button class="bt" data-prev>▶ 미리 보기</button><button class="bt pri" data-rec>🎥 영상 저장</button></div><div class="meter"><i id="tl-bar"></i></div>
          <video class="out" id="tl-out" controls playsinline style="display:none"></video>
          <div class="tip">마지막에 완성 그림이 1.5초 보여요. 영상은 이 기기에만 저장되고, 올리기는 직접 하세요.</div></div></div>`;
      const cv = body.querySelector('#tl'), g = cv.getContext('2d'), q = s => body.querySelector(s); cv.width = 720; cv.height = 1280;
      const art = mk(S), ag = art.getContext('2d'); let bgImg = null, raf = 0;
      if (doc.bgLog) { bgImg = new Image(); bgImg.src = doc.bgLog; }
      const total = doc.log.reduce((s, it) => s + (it.pts ? it.pts.length : 1), 0);
      function frame(k, title) {
        const W = 720, H = 1280; g.fillStyle = '#10202C'; g.fillRect(0, 0, W, H);
        g.fillStyle = '#fff'; g.font = 'bold 44px sans-serif'; g.textAlign = 'center'; g.fillText(title, W / 2, 150);
        g.font = '26px sans-serif'; g.fillStyle = '#9FD8EE'; g.fillText(k >= 1 ? '완성! 🎨' : `그리는 중… ${Math.round(k * 100)}%`, W / 2, 200);
        const s = 640, ox = 40, oy = 300; g.fillStyle = '#F6F0E2'; g.fillRect(ox, oy, s, s); if (bgImg && bgImg.complete) { g.globalAlpha = doc.layers[0].op; g.drawImage(bgImg, ox, oy, s, s); g.globalAlpha = 1; } g.drawImage(art, ox, oy, s, s);
        g.fillStyle = '#3FB4E0'; g.fillRect(ox, oy + s + 30, s * Math.min(1, k), 10); g.font = '22px sans-serif'; g.fillStyle = '#6E8899'; g.fillText('출조 관제 우주 프로 · 바다 그리기', W / 2, H - 80); g.textAlign = 'start';
      }
      function play(ms, onEnd, onTick) {
        ag.clearRect(0, 0, S, S); let li = 0, pi = 0, done = 0; const t0 = performance.now(), title = q('#tl-title').value || '바다 그림';
        lsSet('stu.lapseTitle', title);
        (function tk() {
          const k = (performance.now() - t0) / ms, want = Math.min(total, Math.floor(total * Math.min(1, k / 0.88)));
          while (done < want && li < doc.log.length) { const it = doc.log[li]; if (it.t === 'stamp') { stamp(ag, it.e, it.x, it.y, it.s, it.m); li++; done++; continue; } if (pi === 0) seg(ag, it.t, it.c, it.s, it.pts[0], it.pts[0], it.m); else seg(ag, it.t, it.c, it.s, it.pts[pi - 1], it.pts[pi], it.m); pi++; done++; if (pi >= it.pts.length) { li++; pi = 0; } }
          frame(Math.min(1, k / 0.88), title); if (onTick) onTick(Math.min(1, k));
          if (k >= 1) { onEnd && onEnd(); return; } raf = requestAnimationFrame(tk);
        })();
      }
      frame(0, q('#tl-title').value);
      q('[data-prev]').onclick = () => { if (!n) { say('먼저 🖌 캔버스에서 그림을 그려 주세요.'); return; } cancelAnimationFrame(raf); play(+q('#tl-len').value * 1000); };
      q('[data-rec]').onclick = async () => {
        if (!n) { say('먼저 🖌 캔버스에서 그림을 그려 주세요.'); return; }
        cancelAnimationFrame(raf); const ms = +q('#tl-len').value * 1000;
        try { const p = record(cv, ms + 300, k => { q('#tl-bar').style.width = (k * 100) + '%'; }); play(ms); const b = await p; const v = q('#tl-out'); v.src = URL.createObjectURL(b); v.style.display = ''; dl(b, `timelapse-${day()}.${extOf(b)}`); say('🎞 타임랩스 영상을 저장했어요.'); } catch (e) { say(esc(e.message)); }
      };
      stopNow = () => cancelAnimationFrame(raf);
    }

    /* ───────── 💬 웹툰 ───────── */
    const toon = { panels: null, sel: 0 };
    function toonView(body) {
      if (!toon.panels) toonLayout(3);
      body.innerHTML = `<div class="wrap"><div class="toon" id="tn"></div>
        <div class="side"><div class="row"><b style="font-size:13px">칸 나누기</b><button class="bt" data-lay="1">1칸</button><button class="bt" data-lay="2">2칸</button><button class="bt" data-lay="3">3칸</button><button class="bt" data-lay="4">4칸(가로 2)</button><button class="bt" data-padd>＋ 칸</button></div>
          <div class="row">${['pen', 'marker', 'water', 'eraser'].map(k => `<button class="bt" data-br="${k}" aria-pressed="${ui.brush === k}">${BRUSH[k]}</button>`).join('')}</div>
          <div class="row">${PAL.map(c => `<button class="sw" data-c="${c}" style="background:${c}" aria-pressed="${ui.color === c}"></button>`).join('')}</div>
          <label class="row">굵기 <input type="range" id="tn-sz" min="2" max="40" value="${Math.min(40, ui.size)}"></label>
          <div><b style="font-size:13px">말풍선</b><div class="row"><input id="tn-txt" placeholder="대사 입력" maxlength="60" style="flex:1"></div><div class="row"><button class="bt" data-bub="say">💬 말</button><button class="bt" data-bub="think">💭 생각</button><button class="bt" data-bub="shout">💥 외침</button><button class="bt" data-bub="box">📝 해설</button></div></div>
          <div><b style="font-size:13px">효과</b><div class="row"><button class="bt" data-fx="focus">🎯 집중선</button><button class="bt" data-fx="speed">💨 속도선</button><button class="bt" data-fx="spark">✨ 반짝</button><button class="bt" data-fx="tone">▒ 스크린톤</button><button class="bt" data-fx="paste">🖌 캔버스 그림 넣기</button></div></div>
          <div class="row"><button class="bt" data-pclr>🧽 이 칸 지우기</button><button class="bt pri" data-exp>⬇ 세로 웹툰 PNG</button><button class="bt" data-keep>🖼 전시관</button></div>
          <div class="tip">칸을 눌러 고른 뒤 그려요. 말풍선은 끌어서 옮기고, 두 번 누르면 지워져요. 웹툰은 이 화면에서만 기억해요(앱을 닫기 전에 PNG로 저장하세요).</div></div></div>`;
      const host = body.querySelector('#tn'), q = s => body.querySelector(s);
      function draw() {
        host.innerHTML = toon.panels.map((p, i) => `<div class="panel${i === toon.sel ? ' on' : ''}" data-p="${i}" style="aspect-ratio:${p.w}/${p.h};${p.half ? 'width:calc(50% - 5px);max-width:255px' : ''}"><canvas width="${p.w}" height="${p.h}"></canvas>${p.bubs.map((b, j) => `<div class="bub ${b.k === 'say' ? '' : b.k}" data-b="${j}" style="left:${b.x * 100}%;top:${b.y * 100}%">${esc(b.t)}</div>`).join('')}</div>`).join('');
        // 4칸 레이아웃: 가로 두 칸을 한 줄에
        host.querySelectorAll('.panel').forEach((el2, i) => {
          const p = toon.panels[i], c = el2.querySelector('canvas'); c.getContext('2d').drawImage(p.cv, 0, 0);
          el2.onpointerdown = e => { if (e.target.closest('.bub')) return; if (toon.sel !== i) { toon.sel = i; draw(); return; } cap(c, e); const r = c.getBoundingClientRect(), pt = ev => [(ev.clientX - r.left) / r.width * p.w, (ev.clientY - r.top) / r.height * p.h, 0.5]; let last = pt(e); const G = p.cv.getContext('2d'), cg = c.getContext('2d');
            seg(G, ui.brush, ui.color, ui.size, last, last); cg.clearRect(0, 0, p.w, p.h); cg.drawImage(p.cv, 0, 0);
            c.onpointermove = ev => { coal(ev).forEach(x => { const q2 = pt(x); seg(G, ui.brush, ui.color, ui.size, last, q2); last = q2; }); cg.clearRect(0, 0, p.w, p.h); cg.drawImage(p.cv, 0, 0); };
            c.onpointerup = c.onpointercancel = () => { c.onpointermove = null; }; };
          el2.querySelectorAll('.bub').forEach(bn => {
            const b = p.bubs[+bn.dataset.b];
            bn.onpointerdown = e => { e.stopPropagation(); cap(bn, e); const r = el2.getBoundingClientRect(); bn.onpointermove = ev => { b.x = clamp((ev.clientX - r.left) / r.width, 0.05, 0.95); b.y = clamp((ev.clientY - r.top) / r.height, 0.05, 0.95); bn.style.left = b.x * 100 + '%'; bn.style.top = b.y * 100 + '%'; }; bn.onpointerup = () => { bn.onpointermove = null; }; };
            bn.ondblclick = () => { p.bubs.splice(+bn.dataset.b, 1); draw(); };
          });
        });
      }
      body.querySelectorAll('[data-lay]').forEach(b => b.onclick = () => { if (toon.panels.some(p => p.dirty) && !confirm('칸을 다시 나누면 지금 웹툰이 지워져요. 계속할까요?')) return; toonLayout(+b.dataset.lay); draw(); });
      q('[data-padd]').onclick = () => { if (toon.panels.length >= 10) return; toon.panels.push(panel(800, 600)); toon.sel = toon.panels.length - 1; draw(); };
      body.querySelectorAll('[data-br]').forEach(b => b.onclick = () => { ui.brush = b.dataset.br; save(); body.querySelectorAll('[data-br]').forEach(x => x.setAttribute('aria-pressed', x === b)); });
      body.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { ui.color = b.dataset.c; if (ui.brush === 'eraser') ui.brush = 'pen'; save(); body.querySelectorAll('[data-c]').forEach(x => x.setAttribute('aria-pressed', x === b)); });
      q('#tn-sz').oninput = e => { ui.size = +e.target.value; save(); };
      body.querySelectorAll('[data-bub]').forEach(b => b.onclick = () => { const t = q('#tn-txt').value.trim() || ({ say: '안녕!', think: '오늘은 잡힐까…', shout: '왔다!!', box: '그날 아침, 항구에서' })[b.dataset.bub]; const p = toon.panels[toon.sel]; p.bubs.push({ k: b.dataset.bub, t, x: 0.5, y: 0.22 }); p.dirty = true; q('#tn-txt').value = ''; draw(); });
      body.querySelectorAll('[data-fx]').forEach(b => b.onclick = () => { const p = toon.panels[toon.sel], G = p.cv.getContext('2d'), W = p.w, H = p.h; p.dirty = true; G.save();
        if (b.dataset.fx === 'focus') { G.fillStyle = '#111'; for (let i = 0; i < 90; i++) { const a = Math.random() * 6.283, r0 = Math.min(W, H) * (0.28 + Math.random() * 0.12), r1 = Math.hypot(W, H), w = 0.004 + Math.random() * 0.01; G.beginPath(); G.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0); G.lineTo(W / 2 + Math.cos(a - w) * r1, H / 2 + Math.sin(a - w) * r1); G.lineTo(W / 2 + Math.cos(a + w) * r1, H / 2 + Math.sin(a + w) * r1); G.fill(); } }
        else if (b.dataset.fx === 'speed') { G.strokeStyle = '#111'; for (let i = 0; i < 40; i++) { const y = Math.random() * H, x = Math.random() * W * 0.5; G.lineWidth = 1 + Math.random() * 3; G.beginPath(); G.moveTo(x, y); G.lineTo(x + W * (0.3 + Math.random() * 0.5), y); G.stroke(); } }
        else if (b.dataset.fx === 'spark') { G.fillStyle = '#F5C547'; G.strokeStyle = '#111'; G.lineWidth = 2; for (let i = 0; i < 8; i++) { const x = Math.random() * W, y = Math.random() * H, r = 10 + Math.random() * 22; G.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, rr = k % 2 ? r * 0.35 : r; G.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } G.closePath(); G.fill(); G.stroke(); } }
        else if (b.dataset.fx === 'tone') { G.globalCompositeOperation = 'destination-over'; G.fillStyle = '#999'; for (let y = 0; y < H; y += 8) for (let x = (y / 8 % 2) * 4; x < W; x += 8) { G.beginPath(); G.arc(x, y, 1.6, 0, 6.283); G.fill(); } }
        else if (b.dataset.fx === 'paste') { const f = flatten({ noBg: !hasDrawing() ? false : true }), s = Math.min(W, H) * 0.9; G.drawImage(f, (W - s) / 2, (H - s) / 2, s, s); }
        G.restore(); draw(); });
      q('[data-pclr]').onclick = () => { const p = toon.panels[toon.sel]; p.cv = blank(p.w, p.h); p.bubs = []; draw(); };
      function exportCv() {
        const W = 800, gap = 40, rows = []; for (let i = 0; i < toon.panels.length; i++) { const p = toon.panels[i]; if (p.half && toon.panels[i + 1] && toon.panels[i + 1].half) { rows.push([p, toon.panels[i + 1]]); i++; } else rows.push([p]); }
        const hs = rows.map(r => r.length === 2 ? (W - gap) / 2 * r[0].h / r[0].w : W * r[0].h / r[0].w), H = hs.reduce((a, b) => a + b + gap, gap);
        const c = mk(W + gap * 2, H), G = c.getContext('2d'); G.fillStyle = '#fff'; G.fillRect(0, 0, c.width, H); let y = gap;
        rows.forEach((r, ri) => { const h = hs[ri]; r.forEach((p, k) => { const w = r.length === 2 ? (W - gap) / 2 : W, x = gap + k * (w + gap); G.drawImage(p.cv, x, y, w, h); G.lineWidth = 5; G.strokeStyle = '#111'; G.strokeRect(x, y, w, h); p.bubs.forEach(b => bubble(G, b, x + b.x * w, y + b.y * h, w)); }); y += h + gap; });
        return c;
      }
      q('[data-exp]').onclick = async () => { const b = await new Promise(r => exportCv().toBlob(r, 'image/png')); dl(b, `webtoon-${day()}.png`); say('💬 세로 웹툰 PNG를 저장했어요.'); };
      q('[data-keep]').onclick = () => keep(exportCv(), '내 웹툰', 'toon');
      draw();
    }
    function blank(w, h) { const c = mk(w, h), G = c.getContext('2d'); G.fillStyle = '#fff'; G.fillRect(0, 0, w, h); return c; }
    function panel(w, h, half) { return { w, h, half: !!half, cv: blank(w, h), bubs: [], dirty: false }; }
    function toonLayout(n) { toon.sel = 0; toon.panels = n === 1 ? [panel(800, 1000)] : n === 2 ? [panel(800, 560), panel(800, 700)] : n === 3 ? [panel(800, 450), panel(800, 600), panel(800, 450)] : [panel(800, 450), panel(390, 450, true), panel(390, 450, true), panel(800, 500)]; }
    function bubble(G, b, x, y, pw) {
      G.save(); G.font = `bold ${Math.round(pw / 26)}px sans-serif`; const lines = wrap(G, b.t, pw * 0.5), lh = pw / 22, tw = Math.max(...lines.map(l => G.measureText(l).width)), bw = tw + pw * 0.08, bh = lines.length * lh + pw * 0.06;
      G.lineWidth = 3; G.strokeStyle = '#111'; G.fillStyle = b.k === 'shout' ? '#FFF6A8' : b.k === 'box' ? '#FFFBE8' : '#fff';
      if (b.k === 'box') { G.fillRect(x - bw / 2, y - bh / 2, bw, bh); G.strokeRect(x - bw / 2, y - bh / 2, bw, bh); }
      else if (b.k === 'shout') { G.beginPath(); for (let i = 0; i < 20; i++) { const a = i / 20 * 6.283, r = i % 2 ? 0.82 : 1.12; G.lineTo(x + Math.cos(a) * bw / 2 * r * 1.1, y + Math.sin(a) * bh / 2 * r * 1.2); } G.closePath(); G.fill(); G.stroke(); }
      else { if (b.k === 'think') G.setLineDash([8, 6]); G.beginPath(); G.ellipse(x, y, bw / 2 * 1.15, bh / 2 * 1.2, 0, 0, 6.283); G.fill(); G.stroke(); G.setLineDash([]); if (b.k === 'say') { G.beginPath(); G.moveTo(x - bw * 0.1, y + bh / 2 * 1.1); G.lineTo(x - bw * 0.25, y + bh / 2 * 1.7); G.lineTo(x + bw * 0.05, y + bh / 2 * 1.15); G.fill(); G.stroke(); } }
      G.fillStyle = '#111'; G.textAlign = 'center'; G.textBaseline = 'middle'; lines.forEach((l, i) => G.fillText(l, x, y - (lines.length - 1) * lh / 2 + i * lh)); G.restore();
    }
    function wrap(G, t, maxW) { const out = []; let line = ''; for (const ch of t) { if (G.measureText(line + ch).width > maxW && line) { out.push(line); line = ch; } else line += ch; } if (line) out.push(line); return out; }

    render();
  }

  window.ArtStudio = { view };
})();
