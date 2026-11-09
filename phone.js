/* PhoneKit — 게임에서 휴대폰 기능을 최대한 쓰기 위한 공용 모듈 (PC·휴대폰 웹앱·조황 수첩 공용, 안 되는 기능은 조용히 꺼짐)
 *  진동      PhoneKit.buzz('bite'|'hook'|'catch'|'break'|'wave')       — navigator.vibrate (안드로이드 크롬; 아이폰 사파리는 미지원)
 *  소리      PhoneKit.sound.start('sea'|'night'|'space'|'heart'), .reel(on), .splash(), .stop()  — Web Audio로 직접 만든 소리(파일 없음)
 *  기울기    PhoneKit.tilt {x,y,ok}                                     — DeviceOrientation
 *  충격·흔들기 PhoneKit.onShake(fn) / PhoneKit.gravity {x,y,ok}         — DeviceMotion(가속도·중력)
 *  카메라    PhoneKit.camera.start(videoEl) / .stop() / .frame() / .look() — getUserMedia(뒤 카메라), 밝기·바다색 분석
 *  파노라마  PhoneKit.pano.capture(onProgress) → canvas                 — 한 바퀴 돌며 세로 띠를 이어 붙여 360° 배경
 *  AI 인식   PhoneKit.ai.detect(imgOrVideo) → [{class, score}]          — TensorFlow.js COCO-SSD(병·컵·가방 등 80종), 처음 쓸 때만 내려받음
 *  글자      PhoneKit.text.listen() (음성→글자) · PhoneKit.text.read(image) (사진 속 글자, Tesseract.js 한·영)
 *  PhoneKit.can() → 이 기기에서 되는 기능 목록
 */
(function () {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let opt = { vib: true, sound: true }; try { Object.assign(opt, JSON.parse(localStorage.getItem('phonekit.opt') || '{}')); } catch (e) {}
  const saveOpt = () => { try { localStorage.setItem('phonekit.opt', JSON.stringify(opt)); } catch (e) {} };

  // ── 진동 패턴 ──
  const PAT = { bite: [40, 40, 40], hook: [120], catch: [40, 30, 40, 30, 200], break: [300, 60, 300], wave: [15], tick: [8], level: [60, 40, 60, 40, 160] };
  function buzz(k) { if (!opt.vib || !navigator.vibrate) return; if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;  /* 첫 터치 전에는 브라우저가 막으므로 건너뜀 */ try { navigator.vibrate(Array.isArray(k) ? k : PAT[k] || [30]); } catch (e) {} }

  // ── 소리: 파도(걸러 낸 잡음) · 갈매기/밤 벌레 · 우주 웅웅 · 심장 박동 · 릴 딸깍 ──
  let ac = null, master = null, amb = [], reelT = null;
  const ctx = () => { if (!ac) { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = .5; master.connect(ac.destination); } if (ac.state === 'suspended') ac.resume(); return ac; };
  function noise(sec) { const a = ctx(), b = a.createBuffer(1, a.sampleRate * sec, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
  function tone(f, dur, type, vol, when) { const a = ctx(), o = a.createOscillator(), g = a.createGain(); o.type = type || 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, a.currentTime + (when || 0)); g.gain.linearRampToValueAtTime(vol || .2, a.currentTime + (when || 0) + .01); g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + (when || 0) + dur); o.connect(g); g.connect(master); o.start(a.currentTime + (when || 0)); o.stop(a.currentTime + (when || 0) + dur + .05); }
  const sound = {
    start(kind) {
      if (!opt.sound) return; this.stop(); const a = ctx();
      if (kind === 'sea' || kind === 'night') {   // 파도: 잡음 → 저역 필터, 느린 LFO로 밀려왔다 빠짐
        const src = a.createBufferSource(); src.buffer = noise(4); src.loop = true; const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
        const g = a.createGain(); g.gain.value = .18; const lfo = a.createOscillator(), lg = a.createGain(); lfo.frequency.value = .12; lg.gain.value = .12; lfo.connect(lg); lg.connect(g.gain);
        src.connect(f); f.connect(g); g.connect(master); src.start(); lfo.start(); amb.push(src, lfo);
        const bird = () => { if (!amb.length) return; if (kind === 'sea') { tone(1800 + Math.random() * 600, .18, 'triangle', .04); tone(1500, .2, 'triangle', .03, .18); } else tone(4200, .05, 'square', .015); amb.t = setTimeout(bird, 2500 + Math.random() * 5000); }; bird();
      } else if (kind === 'space') { [55, 82.5].forEach(fq => { const o = a.createOscillator(), g = a.createGain(); o.type = 'sawtooth'; o.frequency.value = fq; const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 220; g.gain.value = .05; o.connect(f); f.connect(g); g.connect(master); o.start(); amb.push(o); }); }
      else if (kind === 'heart') { const beat = () => { if (!amb.length) return; tone(60, .18, 'sine', .35); tone(52, .2, 'sine', .25, .22); amb.t = setTimeout(beat, 1100); }; amb.push({ stop() {} }); beat();
        const o = a.createOscillator(), g = a.createGain(); o.frequency.value = 220; o.type = 'sine'; g.gain.value = .02; o.connect(g); g.connect(master); o.start(); amb.push(o); }
    },
    stop() { amb.forEach(n => { try { n.stop(); } catch (e) {} }); clearTimeout(amb.t); amb = []; this.reel(false); },
    reel(on) { clearInterval(reelT); reelT = null; if (on && opt.sound) reelT = setInterval(() => tone(1400 + Math.random() * 200, .025, 'square', .05), 70); },
    splash() { if (!opt.sound) return; const a = ctx(), s = a.createBufferSource(); s.buffer = noise(.6); const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; const g = a.createGain(); g.gain.setValueAtTime(.4, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .6); s.connect(f); f.connect(g); g.connect(master); s.start(); },
    chime() { if (!opt.sound) return; [660, 880, 1320].forEach((f, i) => tone(f, .35, 'sine', .15, i * .09)); },
  };

  // ── 센서: 기울기 · 중력 · 흔들기(충격) ──
  const tilt = { x: 0, y: 0, ok: false }, gravity = { x: 0, y: -1, ok: false }, shakers = new Set();
  let sensorsOn = false, lastShake = 0;
  async function sensors() {
    if (sensorsOn) return tilt.ok || gravity.ok;
    try { for (const E of [window.DeviceOrientationEvent, window.DeviceMotionEvent]) if (E && typeof E.requestPermission === 'function' && await E.requestPermission() !== 'granted') return false; } catch (e) { return false; }
    addEventListener('deviceorientation', e => { if (e.gamma == null) return; tilt.ok = true; tilt.x = clamp(e.gamma / 25, -1, 1); tilt.y = clamp((e.beta - 45) / 25, -1, 1); tilt.alpha = e.alpha; });
    addEventListener('devicemotion', e => {
      const g = e.accelerationIncludingGravity; if (g && g.x != null) { gravity.ok = true; const n = Math.hypot(g.x, g.y) || 1; gravity.x = clamp(-g.x / n, -1, 1); gravity.y = clamp(-g.y / n, -1, 1); }   // 화면 기준 '아래' 방향
      const a = e.acceleration; const mag = a && a.x != null ? Math.hypot(a.x, a.y, a.z) : g ? Math.abs(Math.hypot(g.x, g.y, g.z) - 9.8) : 0;
      if (mag > 14 && Date.now() - lastShake > 700) { lastShake = Date.now(); shakers.forEach(fn => { try { fn(mag); } catch (x) {} }); }
    });
    sensorsOn = true; return true;
  }
  const onShake = fn => { shakers.add(fn); return () => shakers.delete(fn); };

  // ── 카메라 ──
  const camera = {
    stream: null, video: null,
    async start(video) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('이 브라우저는 카메라를 지원하지 않습니다');
      if (!this.stream) this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false });
      this.video = video || this.video || document.createElement('video'); this.video.srcObject = this.stream; this.video.muted = true; this.video.playsInline = true; await this.video.play(); return this.video;
    },
    stop() { if (this.stream) this.stream.getTracks().forEach(t => t.stop()); this.stream = null; if (this.video) this.video.srcObject = null; },
    on() { return !!this.stream; },
    frame(w) { const v = this.video; if (!v || !v.videoWidth) return null; const c = document.createElement('canvas'), k = (w || 320) / v.videoWidth; c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k); c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); return c; },
    // 주변 분석(가벼운 '눈'): 밝기 · 파란 바다/하늘 비율 · 초록 비율 → 게임 환경
    look() { const c = this.frame(64); if (!c) return null; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let L = 0, blue = 0, green = 0, n = d.length / 4;
      for (let i = 0; i < d.length; i += 4) { const r = d[i], g = d[i + 1], b = d[i + 2]; L += (r * .3 + g * .59 + b * .11); if (b > r + 15 && b > g - 5) blue++; if (g > r + 10 && g > b) green++; }
      return { light: L / n / 255, blue: blue / n, green: green / n }; },
  };
  // 파노라마: 휴대폰을 들고 한 바퀴 돌면(나침반 alpha) 30°마다 가운데 세로 띠를 찍어 이어 붙임. 센서가 없으면 1초마다 찍음
  const pano = {
    canvas: null,
    async capture(onProgress, slots) {
      slots = slots || 12; if (!camera.on()) throw new Error('카메라를 먼저 켜 주세요'); await sensors();
      const W = 1536, H = 512, out = document.createElement('canvas'); out.width = W; out.height = H; const g = out.getContext('2d'), sw = W / slots, got = new Set();
      g.fillStyle = '#0B2A3A'; g.fillRect(0, 0, W, H);
      return new Promise(res => { const t0 = Date.now();
        const tick = () => { const v = camera.video; if (v && v.videoWidth) { const slot = tilt.alpha != null && tilt.ok ? Math.floor(((360 - tilt.alpha) % 360) / (360 / slots)) : Math.floor((Date.now() - t0) / 900) % slots;
            if (!got.has(slot)) { const srcW = v.videoWidth * .34, srcH = v.videoHeight; g.drawImage(v, (v.videoWidth - srcW) / 2, 0, srcW, srcH, slot * sw, 0, sw + 1, H); got.add(slot); buzz('tick'); onProgress && onProgress(got.size, slots); } }
          if (got.size >= slots || Date.now() - t0 > 40000) { this.canvas = out; res(out); } else requestAnimationFrame(tick); };
        tick(); });
    },
  };
  // AI: COCO-SSD(사물 80종). 쓰레기로 볼 만한 것: 병·컵·그릇·가방·우산·캔 비슷한 것
  const TRASH = { bottle: '병', cup: '컵', bowl: '그릇', handbag: '봉지·가방', backpack: '가방', 'wine glass': '유리잔', fork: '포크', spoon: '숟가락', knife: '칼', umbrella: '우산', 'sports ball': '공', banana: '음식물', book: '종이' };
  const load = src => new Promise((res, rej) => { if (document.querySelector(`script[src="${src}"]`)) return res(); const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('불러오기 실패')); document.head.appendChild(s); });
  let cocoP = null;
  const ai = {
    TRASH,
    async detect(img) {
      if (!cocoP) cocoP = (async () => { await load('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js'); await load('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js'); return window.cocoSsd.load({ base: 'lite_mobilenet_v2' }); })();
      const model = await cocoP; const r = await model.detect(img); return r.map(o => ({ class: o.class, score: o.score, ko: TRASH[o.class] || null }));
    },
  };
  // 글자: 음성 인식(말→글자) · 사진 속 글자 읽기(Tesseract.js, 처음만 내려받음)
  let tessP = null;
  const text = {
    canListen: () => !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    listen() { return new Promise((res, rej) => { const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return rej(new Error('이 브라우저는 음성 입력을 지원하지 않습니다'));
      const r = new SR(); r.lang = 'ko-KR'; r.interimResults = false; r.maxAlternatives = 1; r.onresult = e => res(e.results[0][0].transcript); r.onerror = e => rej(new Error(e.error || '음성 인식 실패')); r.start(); }); },
    async read(img) { if (!tessP) tessP = load('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.0/dist/tesseract.min.js'); await tessP; const r = await window.Tesseract.recognize(img, 'kor+eng'); return (r.data.text || '').replace(/\s+/g, ' ').trim(); },
  };
  const can = () => ({
    vibrate: !!navigator.vibrate, sound: !!(window.AudioContext || window.webkitAudioContext), tilt: 'DeviceOrientationEvent' in window, motion: 'DeviceMotionEvent' in window,
    camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia), voice: text.canListen(), touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  });
  window.PhoneKit = { opt, setOpt(k, v) { opt[k] = v; saveOpt(); if (k === 'sound' && !v) sound.stop(); }, buzz, sound, tilt, gravity, sensors, onShake, camera, pano, ai, text, can };
})();
