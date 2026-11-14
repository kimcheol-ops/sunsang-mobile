/* ArtApp — 🎨 바다 생물 그리기 (따라 그리기 · 색칠 놀이 · 예술 붓 · 내 그림 전시관)
 *  ArtApp.view(el, ctx)  ctx = { setStop(fn), download?(blob, filename) }
 *  · 그림·붓 효과·화풍 바꾸기는 모두 이 코드가 직접 그림(인공지능·유료 서비스 없음)
 *  · 완성작은 이 기기 IndexedDB 'sea-art'에만 저장, 원하면 파일로 내려받기
 */
(function () {
  'use strict';
  const CSS = `
  .art .stage { position: relative; width: 100%; max-width: 520px; aspect-ratio: 1 / 1; margin: 0 auto; border-radius: 10px; overflow: hidden; background: #F6F0E2; box-shadow: 0 2px 14px rgba(0,0,0,.4); touch-action: none; }
  .art .stage > * { position: absolute; inset: 0; width: 100%; height: 100%; }
  .art .stage canvas { background: transparent; border-radius: 0; }
  .art .picks { display: grid; grid-template-columns: repeat(auto-fill, minmax(78px, 1fr)); gap: 6px; }
  .art .pick { background: #F6F0E2; border: 2px solid transparent; border-radius: 10px; padding: 4px; cursor: pointer; display: grid; justify-items: center; color: #2A2A2A; font: 600 11.5px inherit; }
  .art .pick[aria-pressed="true"] { border-color: var(--s-acc); }
  .art .pick svg { width: 58px; height: 58px; }
  .art .pick .st { font-size: 10px; color: #A07A20; min-height: 13px; }
  .art .pal { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; }
  .art .sw { width: 28px; height: 28px; border-radius: 50%; border: 2px solid rgba(255,255,255,.25); cursor: pointer; padding: 0; }
  .art .sw[aria-pressed="true"] { outline: 3px solid var(--s-acc); outline-offset: 1px; }
  .art input[type=color] { width: 34px; height: 30px; padding: 0; border: 0; background: none; }
  .art .gal { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
  .art .frame { background: linear-gradient(135deg, #8A6A2E, #E9C979 40%, #8A6A2E 60%, #D9B45E); padding: 8px; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,.5); cursor: pointer; border: 0; }
  .art .frame img { display: block; width: 100%; aspect-ratio: 1 / 1; object-fit: cover; background: #fff; box-shadow: inset 0 0 0 4px #F4EEDC; }
  .art .cap { text-align: center; font-size: 12px; margin-top: 4px; color: var(--s-muted); }
  .art .modal { position: fixed; inset: 0; z-index: 60; background: rgba(0,0,0,.75); display: grid; place-items: center; padding: 14px; }
  .art .modal > div { width: min(560px, 100%); max-height: 100%; overflow: auto; background: #1A1F26; border: 1px solid #3A4450; border-radius: 12px; padding: 12px; display: grid; gap: 8px; }
  .art .modal img { width: 100%; border-radius: 6px; }
  .art .stars { font-size: 26px; letter-spacing: 3px; }
  .art .tools { display: flex; flex-wrap: wrap; gap: 5px; }`;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const coal = e => { const a = e.getCoalescedEvents ? e.getCoalescedEvents() : []; return a.length ? a : [e]; };

  /* ── 바다 생물 밑그림(200×200). parts: [이름, 모양, 실제에 가까운 색] — 색칠 칸이자 따라 그리기 단계, lines: 무늬 선 ── */
  const CR = [
    { id: 'dom', name: '감성돔', dex: '감성돔', parts: [
      ['꼬리', 'M150 97 L188 64 C179 86 179 112 188 134 Z', '#5E6873'],
      ['등지느러미', 'M66 68 C84 38 122 42 138 72 Z', '#4A535C'],
      ['배지느러미', 'M84 132 L98 156 L110 134 Z', '#6E7883'],
      ['몸통', 'M28 100 C52 54 126 50 156 98 C126 146 52 146 28 100 Z', '#A9B3BC'],
      ['눈', 'M56 92 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 Z', '#1C1C1C']],
      lines: ['M84 74 C95 92 95 110 84 128', 'M30 100 L42 104', 'M100 62 L100 138', 'M118 66 L118 132', 'M72 102 C100 108 130 104 150 98'] },
    { id: 'octo', name: '문어', dex: '참문어', parts: [
      ['다리', 'M62 100 C40 130 28 160 44 176 C54 160 60 140 74 120 C70 150 70 176 86 186 C92 166 90 140 92 122 C100 150 106 176 118 184 C122 162 112 140 108 122 C124 146 140 166 158 170 C156 150 146 128 138 100 Z', '#C9573F'],
      ['머리', 'M60 98 C54 36 146 36 140 98 C140 118 60 118 60 98 Z', '#E0704F'],
      ['왼눈', 'M76 86 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 Z', '#FFFFFF'],
      ['오른눈', 'M106 86 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 Z', '#FFFFFF']],
      lines: ['M86 86 a2 2 0 1 0 0.1 0', 'M116 86 a2 2 0 1 0 0.1 0', 'M88 104 C96 110 104 110 112 104', 'M50 150 a3 3 0 1 0 0.1 0', 'M80 160 a3 3 0 1 0 0.1 0', 'M112 160 a3 3 0 1 0 0.1 0', 'M140 150 a3 3 0 1 0 0.1 0', 'M86 56 C92 50 100 48 108 50'] },
    { id: 'crab', name: '꽃게', dex: '꽃게', parts: [
      ['왼집게', 'M56 94 C30 82 22 56 40 44 C48 60 58 62 62 54 C72 70 70 86 64 96 Z', '#3F73B0'],
      ['오른집게', 'M144 94 C170 82 178 56 160 44 C152 60 142 62 138 54 C128 70 130 86 136 96 Z', '#3F73B0'],
      ['등딱지', 'M28 112 C40 76 160 76 172 112 C160 120 150 140 100 142 C50 140 40 120 28 112 Z', '#6A7B5A'],
      ['왼눈', 'M80 62 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 Z', '#1C1C1C'],
      ['오른눈', 'M108 62 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 Z', '#1C1C1C']],
      lines: ['M86 68 L90 84', 'M114 68 L110 84', 'M56 128 L32 142 L22 160', 'M66 136 L48 154 L44 174', 'M134 136 L152 154 L156 174', 'M144 128 L168 142 L178 160', 'M70 104 C86 96 114 96 130 104', 'M100 96 L100 132'] },
    { id: 'clam', name: '조개', dex: '바지락', parts: [
      ['껍데기', 'M100 166 C40 160 24 110 44 74 C64 44 136 44 156 74 C176 110 160 160 100 166 Z', '#E2C49C'],
      ['돌쩌귀', 'M78 164 L122 164 L112 182 L88 182 Z', '#A9805A']],
      lines: ['M100 168 L52 92', 'M100 168 L72 60', 'M100 168 L100 50', 'M100 168 L128 60', 'M100 168 L148 92', 'M60 120 C80 112 120 112 140 120', 'M70 90 C88 82 112 82 130 90'] },
    { id: 'jelly', name: '해파리', dex: '해파리', parts: [
      ['갓', 'M44 100 C44 38 156 38 156 100 C142 92 128 108 115 98 C102 110 92 92 80 102 C68 92 58 108 44 100 Z', '#C7A6EE'],
      ['속무늬', 'M70 80 C76 58 124 58 130 80 C114 86 86 86 70 80 Z', '#F2B3D4']],
      lines: ['M64 102 C54 126 76 140 62 172', 'M88 104 C80 130 98 146 86 182', 'M112 104 C120 130 102 148 114 184', 'M136 102 C146 126 124 140 138 170', 'M100 100 C96 124 106 140 100 160'] },
    { id: 'star', name: '불가사리', dex: '불가사리', parts: [
      ['몸', 'M100 28 L119 78 L172 81 L131 115 L145 166 L100 137 L55 166 L69 115 L28 81 L81 78 Z', '#EE8A4C']],
      lines: ['M100 50 a3 3 0 1 0 0.1 0', 'M100 70 a3 3 0 1 0 0.1 0', 'M150 88 a3 3 0 1 0 0.1 0', 'M128 96 a3 3 0 1 0 0.1 0', 'M134 150 a3 3 0 1 0 0.1 0', 'M120 128 a3 3 0 1 0 0.1 0', 'M66 150 a3 3 0 1 0 0.1 0', 'M80 128 a3 3 0 1 0 0.1 0', 'M50 88 a3 3 0 1 0 0.1 0', 'M72 96 a3 3 0 1 0 0.1 0', 'M100 100 a6 6 0 1 0 0.1 0'] },
    { id: 'puffer', name: '복어', dex: '복어', parts: [
      ['꼬리', 'M156 104 L186 82 L184 126 Z', '#C9A23E'],
      ['몸통', 'M38 104 C38 56 162 56 162 104 C162 152 38 152 38 104 Z', '#E5C25A'],
      ['배', 'M48 120 C70 150 130 150 152 120 C130 136 70 136 48 120 Z', '#F7EDCB'],
      ['지느러미', 'M108 104 C120 94 132 98 134 108 C126 114 116 114 108 104 Z', '#C9A23E'],
      ['눈', 'M64 88 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 Z', '#FFFFFF']],
      lines: ['M74 88 a4 4 0 1 0 0.1 0', 'M40 108 C44 112 48 112 52 108', 'M60 60 L56 50', 'M84 54 L84 42', 'M110 54 L112 42', 'M136 62 L142 52', 'M48 74 L38 68', 'M96 76 a3 3 0 1 0 0.1 0', 'M120 80 a3 3 0 1 0 0.1 0', 'M100 98 a3 3 0 1 0 0.1 0'] },
    { id: 'whale', name: '고래', dex: '', parts: [
      ['꼬리', 'M150 100 C164 88 176 74 194 66 C190 82 186 94 176 104 C186 112 190 124 194 138 C178 130 164 120 150 118 Z', '#355F8C'],
      ['몸통', 'M22 110 C28 68 110 60 154 92 C168 104 168 120 150 134 C110 154 36 150 22 110 Z', '#3E6E9E'],
      ['배', 'M34 124 C70 150 120 150 148 132 C120 142 70 142 34 124 Z', '#CFE1EF'],
      ['지느러미', 'M80 134 L68 162 L102 140 Z', '#2E5478']],
      lines: ['M56 104 a3 3 0 1 0 0.1 0', 'M24 112 C34 118 44 118 54 114', 'M60 70 C54 54 48 50 42 44', 'M60 70 C62 54 66 50 72 42', 'M60 70 L60 48', 'M60 136 L120 138', 'M66 142 L114 144'] },
    { id: 'turtle', name: '바다거북', dex: '바다거북', parts: [
      ['앞지느러미', 'M70 116 L36 150 C52 152 72 140 88 124 Z', '#8DB26C'],
      ['뒷지느러미', 'M128 120 L150 146 C142 132 140 126 140 118 Z', '#8DB26C'],
      ['머리', 'M150 98 C164 82 192 88 190 104 C188 118 166 118 152 112 Z', '#9DBF7A'],
      ['등딱지', 'M42 110 C42 58 158 58 158 110 C158 126 42 126 42 110 Z', '#5E8A4E']],
      lines: ['M80 80 L100 70 L120 80 L120 100 L100 108 L80 100 Z', 'M80 80 L62 76', 'M120 80 L138 76', 'M80 100 L58 108', 'M120 100 L142 108', 'M100 108 L100 120', 'M100 70 L100 62', 'M174 98 a3 3 0 1 0 0.1 0'] },
    { id: 'mermaid', name: '인어 물결이', dex: '', parts: [
      ['머리카락', 'M84 52 C80 22 126 22 120 52 C126 70 132 88 122 98 C120 76 112 62 104 60 C96 62 88 76 86 98 C76 88 80 70 84 52 Z', '#3FA7B8'],
      ['얼굴', 'M88 50 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 Z', '#F2C9A8'],
      ['몸', 'M92 66 C88 80 88 96 92 106 L114 106 C118 96 118 80 112 66 Z', '#F2C9A8'],
      ['조개 옷', 'M90 80 C95 74 102 80 102 84 C106 78 114 76 116 82 L114 90 L92 90 Z', '#F4A6B8'],
      ['꼬리', 'M92 106 C86 136 96 156 112 170 C118 156 122 130 114 106 Z', '#3FC1A5'],
      ['꼬리지느러미', 'M112 168 C100 175 88 188 84 194 C100 192 112 186 118 178 C126 186 140 192 152 192 C144 182 132 172 118 166 Z', '#2FA58C']],
      lines: ['M97 48 a2 2 0 1 0 0.1 0', 'M108 48 a2 2 0 1 0 0.1 0', 'M98 56 C101 59 104 59 107 56', 'M96 120 C100 124 106 124 110 120', 'M98 136 C102 140 108 140 112 136', 'M102 152 C106 156 110 156 114 152', 'M92 72 C80 84 76 96 80 104', 'M114 72 C126 84 130 94 126 104'] }
  ];
  const svgOf = (c, fills, opts = {}) => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${opts.bg || ''}${c.parts.map((p, i) => `<path d="${p[1]}" fill="${fills ? fills[i] || '#FFFFFF' : p[2]}" stroke="#2A2A2A" stroke-width="${opts.sw || 2.2}" stroke-linejoin="round" data-part="${i}"${opts.click ? ' style="cursor:pointer"' : ''}/>`).join('')}${c.lines.map(d => `<path d="${d}" fill="none" stroke="#2A2A2A" stroke-width="${(opts.sw || 2.2) * 0.8}" stroke-linecap="round" pointer-events="none"/>`).join('')}</svg>`;
  const BGS = {
    paper: ['🧻 종이', '<rect width="200" height="200" fill="#F6F0E2"/>'],
    sea: ['🌊 바다', '<defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FD3E8"/><stop offset="1" stop-color="#1F6C8A"/></linearGradient></defs><rect width="200" height="200" fill="url(#ag)"/><g fill="none" stroke="#fff" stroke-opacity=".5"><circle cx="30" cy="40" r="5"/><circle cx="40" cy="25" r="3"/><circle cx="170" cy="150" r="6"/><circle cx="180" cy="130" r="3"/></g><path d="M0 188 C40 178 70 196 110 186 C150 176 170 192 200 184 L200 200 L0 200 Z" fill="#E8D3A0"/>'],
    sunset: ['🌅 노을', '<defs><linearGradient id="as" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB37A"/><stop offset=".6" stop-color="#F27A7A"/><stop offset="1" stop-color="#5A4A8A"/></linearGradient></defs><rect width="200" height="200" fill="url(#as)"/><circle cx="160" cy="44" r="18" fill="#FFE3A3" opacity=".8"/>'],
    night: ['🌙 밤바다', '<rect width="200" height="200" fill="#0E1A33"/><g fill="#fff"><circle cx="20" cy="20" r="1"/><circle cx="60" cy="34" r="1.3"/><circle cx="150" cy="18" r="1"/><circle cx="180" cy="60" r="1.2"/><circle cx="110" cy="12" r="0.9"/></g><circle cx="170" cy="30" r="12" fill="#FFF3C4"/>']
  };

  // ── 내 그림 전시관(IndexedDB, 없으면 이 화면에서만) ──
  const mem = [];
  function idb() { return new Promise((res, rej) => { try { const r = indexedDB.open('sea-art', 1); r.onupgradeneeded = () => r.result.createObjectStore('works', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } }); }
  async function galList() { try { const db = await idb(); return await new Promise((res, rej) => { const q = db.transaction('works').objectStore('works').getAll(); q.onsuccess = () => res(q.result.sort((a, b) => b.at - a.at)); q.onerror = () => rej(q.error); }); } catch (e) { return mem.slice().sort((a, b) => b.at - a.at); } }
  async function galPut(w) { try { const db = await idb(); await new Promise((res, rej) => { const t = db.transaction('works', 'readwrite'); t.objectStore('works').put(w); t.oncomplete = res; t.onerror = () => rej(t.error); }); return true; } catch (e) { const i = mem.findIndex(x => x.id === w.id); if (i >= 0) mem[i] = w; else mem.push(w); return false; } }
  async function galDel(id) { try { const db = await idb(); await new Promise((res, rej) => { const t = db.transaction('works', 'readwrite'); t.objectStore('works').delete(id); t.oncomplete = res; t.onerror = () => rej(t.error); }); } catch (e) { const i = mem.findIndex(x => x.id === id); if (i >= 0) mem.splice(i, 1); } }
  const toBlob = cv => new Promise(res => cv.toBlob(b => res(b), 'image/png'));
  function svgToCanvas(svg, size) { return new Promise((res, rej) => { const img = new Image(); img.onload = () => { const cv = document.createElement('canvas'); cv.width = cv.height = size; cv.getContext('2d').drawImage(img, 0, 0, size, size); res(cv); }; img.onerror = rej; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }); }

  /* ── 화풍 바꾸기(모두 직접 계산) ── */
  function gray(d) { const n = d.length / 4, L = new Float32Array(n); for (let i = 0; i < n; i++) L[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]; return L; }
  function blur(L, w, h, r) { const t = new Float32Array(L.length), o = new Float32Array(L.length), k = r * 2 + 1;
    for (let y = 0; y < h; y++) { let s = 0; for (let x = -r; x <= r; x++) s += L[y * w + Math.min(w - 1, Math.max(0, x))]; for (let x = 0; x < w; x++) { t[y * w + x] = s / k; s += L[y * w + Math.min(w - 1, x + r + 1)] - L[y * w + Math.max(0, x - r)]; } }
    for (let x = 0; x < w; x++) { let s = 0; for (let y = -r; y <= r; y++) s += t[Math.min(h - 1, Math.max(0, y)) * w + x]; for (let y = 0; y < h; y++) { o[y * w + x] = s / k; s += t[Math.min(h - 1, y + r + 1) * w + x] - t[Math.max(0, y - r) * w + x]; } }
    return o; }
  function sobel(L, w, h) { const gx = new Float32Array(L.length), gy = new Float32Array(L.length);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x, a = L[i - w - 1], b = L[i - w], c = L[i - w + 1], d = L[i - 1], f = L[i + 1], g = L[i + w - 1], hh = L[i + w], k = L[i + w + 1];
      gx[i] = (c + 2 * f + k) - (a + 2 * d + g); gy[i] = (g + 2 * hh + k) - (a + 2 * b + c); } return [gx, gy]; }
  function seal(g, S, text) { g.save(); g.globalAlpha = 0.85; g.fillStyle = '#B8322A'; const s = S * 0.075, x = S - s - S * 0.04, y = S - s - S * 0.04; g.fillRect(x, y, s, s); g.fillStyle = '#F6E6D0'; g.font = `bold ${s * 0.36}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text.slice(0, 2), x + s / 2, y + s * 0.32); g.fillText(text.slice(2, 4), x + s / 2, y + s * 0.7); g.restore(); }
  const STYLES = {
    ink: ['🖌 수묵화', (src) => { const S = src.width, g0 = src.getContext('2d'), d = g0.getImageData(0, 0, S, S).data; let L = blur(gray(d), S, S, 2); const [gx, gy] = sobel(L, S, S);
      const out = document.createElement('canvas'); out.width = out.height = S; const g = out.getContext('2d'), im = g.createImageData(S, S), o = im.data;
      for (let i = 0; i < L.length; i++) { const e = Math.min(1, Math.hypot(gx[i], gy[i]) / 260); let v = Math.min(1, Math.max(0, L[i] / 255)); v = Math.round(v * 5) / 5 * 0.6 + v * 0.4; v = Math.max(0, v - e * 0.55); const n = (Math.random() - 0.5) * 0.04;
        o[i * 4] = 24 + (244 - 24) * (v + n); o[i * 4 + 1] = 24 + (236 - 24) * (v + n); o[i * 4 + 2] = 30 + (220 - 30) * (v + n); o[i * 4 + 3] = 255; }
      g.putImageData(im, 0, 0); seal(g, S, '바다물결'); return out; }],
    dots: ['🔵 점묘', (src) => { const S = src.width, d = src.getContext('2d').getImageData(0, 0, S, S).data, out = document.createElement('canvas'); out.width = out.height = S; const g = out.getContext('2d');
      g.fillStyle = '#FBF6EA'; g.fillRect(0, 0, S, S); const st = Math.max(4, Math.round(S / 120)), pts = [];
      for (let y = 0; y < S; y += st) for (let x = 0; x < S; x += st) pts.push([x + Math.random() * st, y + Math.random() * st]);
      for (let pass = 0; pass < 2; pass++) { pts.sort(() => Math.random() - 0.5); pts.forEach(([x, y]) => { const i = (Math.min(S - 1, y | 0) * S + Math.min(S - 1, x | 0)) * 4, j = () => (Math.random() - 0.5) * 34;
        g.fillStyle = `rgb(${d[i] + j()},${d[i + 1] + j()},${d[i + 2] + j()})`; g.beginPath(); g.arc(x, y, st * (0.42 + Math.random() * 0.22) * (pass ? 0.75 : 1), 0, 7); g.fill(); }); }
      return out; }],
    print: ['🪵 판화', (src) => { const S = src.width, g0 = src.getContext('2d'), d = g0.getImageData(0, 0, S, S).data, L = blur(gray(d), S, S, 1), [gx, gy] = sobel(L, S, S);
      const out = document.createElement('canvas'); out.width = out.height = S; const g = out.getContext('2d'), im = g.createImageData(S, S), o = im.data, q = v => Math.round(v / 255 * 3) / 3 * 255;
      for (let i = 0; i < L.length; i++) { const e = Math.hypot(gx[i], gy[i]) > 150, grain = ((i % S) + Math.floor(i / S) * 0.35) % 9 < 1 ? 0.88 : 1;
        if (e) { o[i * 4] = 28; o[i * 4 + 1] = 22; o[i * 4 + 2] = 20; } else { o[i * 4] = q(d[i * 4]) * grain * 0.95 + 10; o[i * 4 + 1] = q(d[i * 4 + 1]) * grain * 0.92 + 8; o[i * 4 + 2] = q(d[i * 4 + 2]) * grain * 0.85 + 6; } o[i * 4 + 3] = 255; }
      g.putImageData(im, 0, 0); return out; }],
    oil: ['🎨 유화', (src) => { const S = src.width, d = src.getContext('2d').getImageData(0, 0, S, S).data, L = blur(gray(d), S, S, 3), [gx, gy] = sobel(L, S, S);
      const out = document.createElement('canvas'); out.width = out.height = S; const g = out.getContext('2d'); g.drawImage(src, 0, 0); g.lineCap = 'round';
      const st = Math.max(3, Math.round(S / 160)), pts = []; for (let y = 0; y < S; y += st) for (let x = 0; x < S; x += st) pts.push([x + Math.random() * st, y + Math.random() * st]); pts.sort(() => Math.random() - 0.5);
      const len = st * 3.2; pts.forEach(([x, y]) => { const ix = Math.min(S - 1, x | 0), iy = Math.min(S - 1, y | 0), i = iy * S + ix, a = Math.atan2(gy[i], gx[i]) + Math.PI / 2 + (Math.random() - 0.5) * 0.3, dx = Math.cos(a) * len / 2, dy = Math.sin(a) * len / 2;
        g.strokeStyle = `rgb(${d[i * 4]},${d[i * 4 + 1]},${d[i * 4 + 2]})`; g.lineWidth = st * 1.6; g.beginPath(); g.moveTo(x - dx, y - dy); g.lineTo(x + dx, y + dy); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,.10)'; g.lineWidth = st * 0.5; g.beginPath(); g.moveTo(x - dx, y - dy - st * 0.3); g.lineTo(x + dx, y + dy - st * 0.3); g.stroke(); });
      return out; }]
  };

  function view(el, ctx) {
    if (!document.getElementById('art-css')) { const st = document.createElement('style'); st.id = 'art-css'; st.textContent = CSS; document.head.appendChild(st); }
    el.classList.add('art');
    const ui = Object.assign({ mode: 'trace', cr: 'dom', bg: 'paper', brush: 'water', color: '#1F6C8A', size: 18, guide: '' }, lsGet('art.ui', {}));
    let cleanup = () => {};
    ctx.setStop(() => cleanup());
    const saveUi = () => lsSet('art.ui', ui);
    const say = t => { const n = el.querySelector('#art-say'); if (n) n.innerHTML = t; };
    async function download(blob, name) {
      if (ctx.download) return ctx.download(blob, name);
      const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
    }
    async function keep(cv, title, kind) {
      const blob = await toBlob(cv); if (!blob) { say('그림을 저장하지 못했어요.'); return; }
      const ok = await galPut({ id: 'w' + Date.now(), at: Date.now(), title, kind, blob });
      say(ok ? `🖼 「${esc(title)}」을 내 그림 전시관에 걸었어요.` : '🖼 전시관에 걸었어요(이 기기는 저장소를 쓸 수 없어 화면을 닫으면 사라져요 — 내려받기를 권해요).');
    }

    function render() {
      cleanup(); cleanup = () => {}; saveUi();
      el.innerHTML = `<div class="tabs" role="tablist">${[['trace', '✏ 따라 그리기'], ['color', '🖍 색칠 놀이'], ['paint', '🖌 예술 붓'], ['studio', '🎬 그림 스튜디오'], ['gal', '🖼 내 그림 전시관']].map(([k, l]) => `<button class="tab" role="tab" data-m="${k}" aria-selected="${ui.mode === k}">${l}</button>`).join('')}</div><div id="art-body"></div>`;
      el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { ui.mode = b.dataset.m; render(); });
      const body = el.querySelector('#art-body');
      if (ui.mode === 'studio') { if (window.ArtStudio) ArtStudio.view(body, { setStop: f => { cleanup = f; }, download, keep }); else body.innerHTML = '<div class="box muted">스튜디오 파일(studio.js)을 불러오지 못했습니다.</div>'; return; }
      ({ trace: traceView, color: colorView, paint: paintView, gal: galView })[ui.mode](body);
    }
    function picker(cb) {
      const best = lsGet('art.trace', {});
      return `<div class="picks">${CR.map(c => `<button class="pick" data-cr="${c.id}" aria-pressed="${c.id === ui.cr}">${svgOf(c, null, { sw: 3 })}<span>${esc(c.name)}</span><span class="st">${best[c.id] ? '★'.repeat(best[c.id].stars) : ''}</span></button>`).join('')}</div>`;
    }
    function bindPicker(body, cb) { body.querySelectorAll('[data-cr]').forEach(b => b.onclick = () => { ui.cr = b.dataset.cr; saveUi(); cb(); }); }

    /* ✏ 따라 그리기 */
    function traceView(body) {
      const c = CR.find(x => x.id === ui.cr) || CR[0];
      const steps = [...c.parts.map(p => ({ name: p[0], d: p[1] })), ...c.lines.filter(d => !/ a[1-5] /.test(d)).map((d, i) => ({ name: '무늬 ' + (i + 1), d }))];
      let k = 0, strokes = steps.map(() => []), scores = [];
      body.innerHTML = `<div class="box">${picker()}</div>
        <div class="grid2"><div class="box"><div class="stage" id="tr-stage"><svg id="tr-guide" viewBox="0 0 200 200"></svg><canvas id="tr-cv"></canvas></div></div>
        <div class="box"><b id="tr-title"></b><div class="say" id="art-say" aria-live="polite"></div>
          <div class="prog" style="height:8px;border-radius:9px;background:var(--s-well);overflow:hidden"><i id="tr-bar" style="display:block;height:100%;background:#6FD3A4;width:0"></i></div>
          <div class="bar"><button class="btn" data-clr>↺ 이 단계 다시</button><button class="btn primary" data-next>다음 단계 ▶</button></div>
          <div class="small muted">회색 점선을 손가락(마우스)으로 따라 그려요. 선 위를 많이, 정확하게 지날수록 점수가 높아요.</div></div></div>`;
      bindPicker(body, () => render());
      const svg = body.querySelector('#tr-guide'), cv = body.querySelector('#tr-cv'), g = cv.getContext('2d');
      function size() { const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.max(10, r.width * dpr); cv.height = Math.max(10, r.height * dpr); paint(); }
      function guide() {
        svg.innerHTML = steps.map((s, i) => `<path d="${s.d}" fill="none" stroke="${i < k ? 'rgba(42,42,42,.18)' : i === k ? '#8A93A0' : 'none'}" stroke-width="${i === k ? 3.4 : 2}" stroke-dasharray="${i === k ? '5 5' : ''}" stroke-linecap="round" stroke-linejoin="round" data-i="${i}"/>`).join('');
        body.querySelector('#tr-title').textContent = k < steps.length ? `${c.name} — ${k + 1}/${steps.length} 단계: ${steps[k].name}` : `${c.name} 완성!`;
        body.querySelector('#tr-bar').style.width = (k / steps.length * 100) + '%';
      }
      function paint() {
        const W = cv.width; g.clearRect(0, 0, W, W); g.lineCap = g.lineJoin = 'round';
        strokes.forEach((arr, i) => arr.forEach(line => { g.strokeStyle = i === k ? '#1F4E79' : '#2A2A2A'; g.lineWidth = W / 200 * 3; g.beginPath(); line.forEach((p, j) => j ? g.lineTo(p[0] * W / 200, p[1] * W / 200) : g.moveTo(p[0] * W / 200, p[1] * W / 200)); g.stroke(); }));
      }
      function score(i) {
        const path = svg.querySelector(`[data-i="${i}"]`), pts = strokes[i].flat(); if (!path || !pts.length) return 0;
        const len = path.getTotalLength(), N = 60, M = 160, guideP = [], dense = [];
        for (let j = 0; j <= N; j++) { const q = path.getPointAtLength(len * j / N); guideP.push([q.x, q.y]); }
        for (let j = 0; j <= M; j++) { const q = path.getPointAtLength(len * j / M); dense.push([q.x, q.y]); }
        const near = (a, set, tol) => set.some(b => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 <= tol * tol);
        const cov = guideP.filter(p => near(p, pts, 9)).length / guideP.length;
        const sub = pts.filter((_, j) => j % 2 === 0), prec = sub.filter(p => near(p, dense, 12)).length / Math.max(1, sub.length);
        return Math.round(100 * (0.6 * cov + 0.4 * prec));
      }
      let drawing = null;
      const P = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 200, (e.clientY - r.top) / r.height * 200]; };
      cv.onpointerdown = e => { if (k >= steps.length) return; cv.setPointerCapture(e.pointerId); drawing = [P(e)]; strokes[k].push(drawing); paint(); };
      cv.onpointermove = e => { if (!drawing) return; coal(e).forEach(ev => drawing.push(P(ev))); paint(); };
      cv.onpointerup = cv.onpointercancel = () => { if (drawing) { drawing = null; const s = score(k); say(`이 단계 점수 <b>${s}</b>점 ${s >= 85 ? '👏 훌륭해요!' : s >= 60 ? '👍 좋아요' : '— 점선을 더 따라가 볼까요?'}`); } };
      body.querySelector('[data-clr]').onclick = () => { if (k < steps.length) { strokes[k] = []; paint(); say('다시 그려 보세요.'); } };
      body.querySelector('[data-next]').onclick = () => {
        if (k >= steps.length) return;
        if (!strokes[k].length) { say('먼저 점선을 따라 그려 주세요.'); return; }
        scores[k] = score(k); k++; guide(); paint();
        if (k >= steps.length) finish();
        else say(`${k}단계 ${scores[k - 1]}점! 다음은 <b>${esc(steps[k].name)}</b>`);
      };
      function finish() {
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length), stars = avg >= 85 ? 3 : avg >= 65 ? 2 : avg >= 40 ? 1 : 0;
        const best = lsGet('art.trace', {}); if (!best[c.id] || best[c.id].score < avg) { best[c.id] = { score: avg, stars, at: Date.now() }; lsSet('art.trace', best); }
        let stamp = '';
        if (stars && c.dex) { const d = lsGet('sea.dex', {}); if (!d[c.dex]) { d[c.dex] = Date.now(); lsSet('sea.dex', d); stamp = ` · 📗 도감에 「${esc(c.dex)}」 도장!`; } }
        svg.innerHTML = '';
        say(`<div class="stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>평균 <b>${avg}</b>점${stamp}
          <div class="bar" style="margin-top:6px"><button class="btn primary" data-keep>🖼 전시관에 걸기</button><button class="btn" data-tocolor>🖍 색칠하러 가기</button><button class="btn" data-again>✏ 다시 그리기</button></div>`);
        body.querySelector('[data-keep]').onclick = async () => { const out = document.createElement('canvas'); out.width = out.height = 800; const o = out.getContext('2d'); o.fillStyle = '#F6F0E2'; o.fillRect(0, 0, 800, 800); o.drawImage(cv, 0, 0, 800, 800); await keep(out, `${c.name} 따라 그리기 ${'★'.repeat(stars)}`, 'trace'); };
        body.querySelector('[data-tocolor]').onclick = () => { ui.mode = 'color'; render(); };
        body.querySelector('[data-again]').onclick = () => render();
      }
      guide(); say(`<b>${esc(steps[0].name)}</b>부터 점선을 따라 그려요 ✏`);
      const ro = new ResizeObserver(size); ro.observe(cv); size(); cleanup = () => ro.disconnect();
    }

    /* 🖍 색칠 놀이 */
    function colorView(body) {
      const c = CR.find(x => x.id === ui.cr) || CR[0], key = 'art.fill.' + c.id;
      let fills = lsGet(key, null) || c.parts.map(() => '#FFFFFF');
      const PAL = ['#FFFFFF', '#F6F0E2', '#E2C49C', '#A9805A', '#1C1C1C', '#5E6873', '#A9B3BC', '#3E6E9E', '#1F6C8A', '#7FD6E8', '#3FC1A5', '#2FA58C', '#5E8A4E', '#9DBF7A', '#E5C25A', '#EE8A4C', '#E0704F', '#C9573F', '#F4A6B8', '#C7A6EE', '#6B4BA0', '#FFE27A'];
      body.innerHTML = `<div class="box">${picker()}</div>
        <div class="grid2"><div class="box"><div class="stage" id="co-stage"></div></div>
        <div class="box"><b>${esc(c.name)} 색칠하기</b><div class="small muted">색을 고르고 그림의 칸을 누르면 칠해져요.</div>
          <div class="pal" role="group" aria-label="색">${PAL.map(p => `<button class="sw" style="background:${p}" data-c="${p}" aria-label="${p}" aria-pressed="${p === ui.color}"></button>`).join('')}<input type="color" id="co-any" value="${ui.color}" aria-label="다른 색"></div>
          <div class="bar"><label class="small">배경 <select id="co-bg">${Object.entries(BGS).map(([k, v]) => `<option value="${k}" ${k === ui.bg ? 'selected' : ''}>${v[0]}</option>`).join('')}</select></label></div>
          <div class="bar" style="align-items:center"><span class="small muted">실제 색 힌트</span><div style="width:64px;height:64px;background:#F6F0E2;border-radius:8px">${svgOf(c, null, { sw: 3 })}</div></div>
          <div class="bar"><button class="btn" data-real>🎯 실제 색으로 채우기</button><button class="btn" data-wipe>🧽 모두 지우기</button><button class="btn primary" data-keep>🖼 전시관에 걸기</button></div>
          <div class="say" id="art-say" aria-live="polite"></div></div></div>`;
      bindPicker(body, () => render());
      const stage = body.querySelector('#co-stage');
      const draw = () => { stage.innerHTML = svgOf(c, fills, { click: 1, bg: BGS[ui.bg][1] }); stage.querySelectorAll('[data-part]').forEach(p => p.onclick = () => { fills[+p.dataset.part] = ui.color; lsSet(key, fills); draw(); if (fills.every(f => f !== '#FFFFFF')) say('🎉 다 칠했어요! 전시관에 걸어 볼까요?'); }); };
      const pick = col => { ui.color = col; saveUi(); body.querySelectorAll('[data-c]').forEach(b => b.setAttribute('aria-pressed', b.dataset.c === col)); };
      body.querySelectorAll('[data-c]').forEach(b => b.onclick = () => pick(b.dataset.c));
      body.querySelector('#co-any').oninput = e => pick(e.target.value);
      body.querySelector('#co-bg').onchange = e => { ui.bg = e.target.value; saveUi(); draw(); };
      body.querySelector('[data-real]').onclick = () => { fills = c.parts.map(p => p[2]); lsSet(key, fills); draw(); say('실제 몸 색에 가깝게 칠했어요. 나만의 색으로 바꿔 봐도 좋아요!'); };
      body.querySelector('[data-wipe]').onclick = () => { fills = c.parts.map(() => '#FFFFFF'); lsSet(key, fills); draw(); };
      body.querySelector('[data-keep]').onclick = async () => { try { const cv = await svgToCanvas(svgOf(c, fills, { bg: BGS[ui.bg][1] }), 800); await keep(cv, `${c.name} 색칠`, 'color'); } catch (e) { say('그림을 만들지 못했어요.'); } };
      draw();
    }

    /* 🖌 예술 붓 */
    function paintView(body) {
      const S = 900;
      const BR = [['water', '💧 수채화'], ['ink', '🖌 먹 붓'], ['crayon', '🖍 크레용'], ['glow', '✨ 반짝이 물결'], ['bubble', '🫧 물방울'], ['pen', '✒ 펜'], ['eraser', '🧽 지우개']];
      const PAL = ['#0B2545', '#1F6C8A', '#4FB3C8', '#9EE6F0', '#2FA58C', '#5E8A4E', '#E8D3A0', '#F6F0E2', '#EE8A4C', '#E0704F', '#B8322A', '#F4A6B8', '#C7A6EE', '#6B4BA0', '#FFE27A', '#1C1C1C'];
      body.innerHTML = `<div class="grid2"><div class="box"><div class="stage" id="pa-stage"><canvas id="pa-bg"></canvas><canvas id="pa-cv"></canvas><div id="pa-guide" style="pointer-events:none;opacity:.22"></div></div></div>
        <div class="box">
          <div class="tools" role="group" aria-label="붓">${BR.map(([k, l]) => `<button class="btn" data-br="${k}" aria-pressed="${k === ui.brush}">${l}</button>`).join('')}</div>
          <div class="pal" role="group" aria-label="색">${PAL.map(p => `<button class="sw" style="background:${p}" data-c="${p}" aria-label="${p}" aria-pressed="${p === ui.color}"></button>`).join('')}<input type="color" id="pa-any" value="${ui.color}" aria-label="다른 색"></div>
          <label class="small">붓 크기 <input type="range" id="pa-size" min="2" max="70" value="${ui.size}" style="width:100%"></label>
          <div class="bar"><label class="small">바탕 <select id="pa-bgsel"><option value="paper">🧻 한지</option><option value="white">⬜ 흰 종이</option><option value="sea">🌊 바다</option><option value="night">🌙 밤바다</option></select></label>
            <label class="small">밑그림 <select id="pa-gsel"><option value="">없음</option>${CR.map(c => `<option value="${c.id}" ${c.id === ui.guide ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label></div>
          <div class="bar"><button class="btn" data-undo>↶ 되돌리기</button><button class="btn" data-clear>🗑 새 종이</button><button class="btn primary" data-keep>🖼 전시관에 걸기</button></div>
          <b class="small">🎨 화풍 바꾸기 <span class="muted">(그림을 명화 느낌으로)</span></b>
          <div class="tools">${Object.entries(STYLES).map(([k, v]) => `<button class="btn" data-sty="${k}">${v[0]}</button>`).join('')}</div>
          <div class="say small" id="art-say" aria-live="polite">밑그림을 깔고 수채화 붓으로 겹겹이 칠해 보세요. 겹칠수록 진해져요.</div></div></div>`;
      const bg = body.querySelector('#pa-bg'), cv = body.querySelector('#pa-cv'), gd = body.querySelector('#pa-guide');
      bg.width = bg.height = cv.width = cv.height = S;
      const g = cv.getContext('2d'), gb = bg.getContext('2d'), undo = [];
      const savedBg = lsGet('art.paint.bg', 'paper'); body.querySelector('#pa-bgsel').value = savedBg;
      function paper(kind) {
        gb.globalCompositeOperation = 'source-over';
        if (kind === 'sea') { const gr = gb.createLinearGradient(0, 0, 0, S); gr.addColorStop(0, '#A8E0EE'); gr.addColorStop(1, '#2A7FA0'); gb.fillStyle = gr; gb.fillRect(0, 0, S, S); }
        else if (kind === 'night') { gb.fillStyle = '#0E1A33'; gb.fillRect(0, 0, S, S); for (let i = 0; i < 160; i++) { gb.fillStyle = `rgba(255,255,255,${Math.random() * 0.8})`; gb.fillRect(Math.random() * S, Math.random() * S * 0.6, 2, 2); } }
        else { gb.fillStyle = kind === 'white' ? '#FFFFFF' : '#F4ECDA'; gb.fillRect(0, 0, S, S); }
        if (kind === 'paper' || kind === 'white') { // 종이 결(섬유)
          for (let i = 0; i < 2600; i++) { gb.strokeStyle = `rgba(120,95,60,${Math.random() * 0.05})`; gb.lineWidth = Math.random() * 1.2; const x = Math.random() * S, y = Math.random() * S, a = Math.random() * 6.28, l = 4 + Math.random() * 16; gb.beginPath(); gb.moveTo(x, y); gb.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); gb.stroke(); } }
        lsSet('art.paint.bg', kind);
      }
      paper(savedBg);
      // 그리던 그림 이어서(이 기기에만)
      try { const last = localStorage.getItem('art.paint.wip'); if (last) { const im = new Image(); im.onload = () => g.drawImage(im, 0, 0, S, S); im.src = last; } } catch (e) {}
      const wip = () => { try { localStorage.setItem('art.paint.wip', cv.toDataURL('image/png')); } catch (e) {} };
      const showGuide = () => { const c = CR.find(x => x.id === ui.guide); gd.innerHTML = c ? svgOf(c, c.parts.map(() => 'none'), { sw: 1.6 }) : ''; };
      showGuide();
      const rgb = hex => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
      let last = null, hue = 0, dist = 0;
      const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * S, (e.clientY - r.top) / r.height * S, e.pressure && e.pointerType === 'pen' ? e.pressure : 0.6, e.timeStamp]; };
      function stamp(x, y, pr, sp) {
        const sz = ui.size * (S / 520), [R, G, B] = rgb(ui.color);
        if (ui.brush === 'water') { const r = sz * (0.75 + Math.random() * 0.5), gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${R},${G},${B},0.035)`); gr.addColorStop(0.78, `rgba(${R},${G},${B},0.075)`); gr.addColorStop(1, `rgba(${R},${G},${B},0)`); g.globalCompositeOperation = 'multiply'; g.fillStyle = gr; g.beginPath(); g.arc(x + (Math.random() - 0.5) * sz * 0.2, y + (Math.random() - 0.5) * sz * 0.2, r, 0, 7); g.fill(); g.globalCompositeOperation = 'source-over'; }
        else if (ui.brush === 'crayon') { g.fillStyle = `rgba(${R},${G},${B},0.55)`; const n = Math.ceil(sz * 1.2); for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, rr = Math.random() * sz * 0.5, px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; if (((px * 7 + py * 3) | 0) % 5 === 0) continue; g.fillRect(px, py, 1.6, 1.6); } }
        else if (ui.brush === 'bubble') { if (Math.random() < 0.35) { const r = sz * (0.2 + Math.random() * 0.6); g.strokeStyle = `rgba(${R},${G},${B},0.8)`; g.lineWidth = Math.max(1, r * 0.12); g.beginPath(); g.arc(x + (Math.random() - 0.5) * sz, y + (Math.random() - 0.5) * sz, r, 0, 7); g.stroke(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(x - r * 0.35, y - r * 0.35, r * 0.18, 0, 7); g.fill(); } }
      }
      function seg(a, b) {
        const sz = ui.size * (S / 520), dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy), dt = Math.max(1, b[3] - a[3]), sp = d / dt;
        g.lineCap = g.lineJoin = 'round';
        if (ui.brush === 'pen') { g.strokeStyle = ui.color; g.lineWidth = sz * 0.35 * (0.6 + b[2]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); return; }
        if (ui.brush === 'eraser') { g.globalCompositeOperation = 'destination-out'; g.lineWidth = sz; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.globalCompositeOperation = 'source-over'; return; }
        if (ui.brush === 'ink') { // 빠르면 가늘고 갈라지는 마른 붓, 느리면 굵고 번짐
          const w = sz * Math.max(0.18, Math.min(1.25, 1.3 - sp * 0.35)), [R, G, B] = rgb(ui.color), nx = -dy / (d || 1), ny = dx / (d || 1), bristles = 9;
          for (let i = 0; i < bristles; i++) { if (Math.random() < Math.min(0.55, sp * 0.12)) continue; const off = (i / (bristles - 1) - 0.5) * w; g.strokeStyle = `rgba(${R},${G},${B},${0.35 + Math.random() * 0.3})`; g.lineWidth = w / bristles * 1.8; g.beginPath(); g.moveTo(a[0] + nx * off, a[1] + ny * off); g.lineTo(b[0] + nx * off, b[1] + ny * off); g.stroke(); }
          if (sp < 0.3 && Math.random() < 0.3) { const r = w * (0.6 + Math.random()), gr = g.createRadialGradient(b[0], b[1], 0, b[0], b[1], r); gr.addColorStop(0, `rgba(${R},${G},${B},0.08)`); gr.addColorStop(1, `rgba(${R},${G},${B},0)`); g.fillStyle = gr; g.beginPath(); g.arc(b[0], b[1], r, 0, 7); g.fill(); }
          return; }
        if (ui.brush === 'glow') { hue = (hue + d * 0.35) % 360; g.globalCompositeOperation = 'lighter'; g.shadowColor = `hsl(${hue},95%,65%)`; g.shadowBlur = sz * 0.8; g.strokeStyle = `hsla(${hue},95%,70%,.85)`; g.lineWidth = sz * 0.3; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.shadowBlur = 0;
          dist += d; if (dist > sz * 1.5) { dist = 0; const sx = b[0] + (Math.random() - 0.5) * sz * 1.5, sy = b[1] + (Math.random() - 0.5) * sz * 1.5, r = sz * (0.15 + Math.random() * 0.25); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(sx, sy - r); g.quadraticCurveTo(sx, sy, sx + r, sy); g.quadraticCurveTo(sx, sy, sx, sy + r); g.quadraticCurveTo(sx, sy, sx - r, sy); g.quadraticCurveTo(sx, sy, sx, sy - r); g.fill(); }
          g.globalCompositeOperation = 'source-over'; return; }
        const stepLen = Math.max(1.5, sz * (ui.brush === 'water' ? 0.18 : 0.3)), n = Math.max(1, Math.ceil(d / stepLen));
        for (let i = 1; i <= n; i++) stamp(a[0] + dx * i / n, a[1] + dy * i / n, b[2], sp);
      }
      cv.onpointerdown = e => { cv.setPointerCapture(e.pointerId); try { undo.push(g.getImageData(0, 0, S, S)); if (undo.length > 8) undo.shift(); } catch (x) {} last = pos(e); seg(last, [last[0] + 0.1, last[1] + 0.1, last[2], last[3] + 16]); };
      cv.onpointermove = e => { if (!last) return; coal(e).forEach(ev => { const p = pos(ev); seg(last, p); last = p; }); };
      cv.onpointerup = cv.onpointercancel = () => { if (last) { last = null; wip(); } };
      body.querySelectorAll('[data-br]').forEach(b => b.onclick = () => { ui.brush = b.dataset.br; saveUi(); body.querySelectorAll('[data-br]').forEach(x => x.setAttribute('aria-pressed', x === b)); });
      const pick = col => { ui.color = col; saveUi(); body.querySelectorAll('[data-c]').forEach(b => b.setAttribute('aria-pressed', b.dataset.c === col)); };
      body.querySelectorAll('[data-c]').forEach(b => b.onclick = () => pick(b.dataset.c));
      body.querySelector('#pa-any').oninput = e => pick(e.target.value);
      body.querySelector('#pa-size').oninput = e => { ui.size = +e.target.value; saveUi(); };
      body.querySelector('#pa-bgsel').onchange = e => paper(e.target.value);
      body.querySelector('#pa-gsel').onchange = e => { ui.guide = e.target.value; saveUi(); showGuide(); };
      body.querySelector('[data-undo]').onclick = () => { const im = undo.pop(); if (im) { g.putImageData(im, 0, 0); wip(); } else say('더 되돌릴 게 없어요.'); };
      body.querySelector('[data-clear]').onclick = () => { if (!confirm('지금 그림을 지우고 새 종이로 시작할까요? (전시관에 건 그림은 남아요)')) return; try { undo.push(g.getImageData(0, 0, S, S)); } catch (x) {} g.clearRect(0, 0, S, S); wip(); };
      const merged = () => { const m = document.createElement('canvas'); m.width = m.height = S; const o = m.getContext('2d'); o.drawImage(bg, 0, 0); o.drawImage(cv, 0, 0); return m; };
      body.querySelector('[data-keep]').onclick = () => keep(merged(), '바다 그림 ' + new Date().toLocaleDateString('ko-KR'), 'paint');
      body.querySelectorAll('[data-sty]').forEach(b => b.onclick = () => {
        say('🎨 화풍을 입히는 중…');
        setTimeout(() => {
          const sty = STYLES[b.dataset.sty], src = merged(), small = document.createElement('canvas'); small.width = small.height = 600; small.getContext('2d').drawImage(src, 0, 0, 600, 600);
          const out = sty[1](small), url = out.toDataURL('image/png');
          const m = document.createElement('div'); m.className = 'modal';
          m.innerHTML = `<div role="dialog" aria-label="화풍 바꾸기"><b>${sty[0]} 느낌</b><img src="${url}" alt="${esc(sty[0])} 느낌으로 바꾼 그림"><div class="bar"><button class="btn primary" data-k>🖼 전시관에 걸기</button><button class="btn" data-over>🖌 이 그림 위에 덧그리기</button><button class="btn" data-x>닫기</button></div></div>`;
          el.appendChild(m);
          m.querySelector('[data-x]').onclick = () => m.remove();
          m.querySelector('[data-k]').onclick = async () => { await keep(out, `${sty[0].slice(2).trim()} · 바다 그림`, 'style'); m.remove(); };
          m.querySelector('[data-over]').onclick = () => { try { undo.push(g.getImageData(0, 0, S, S)); } catch (x) {} gb.drawImage(out, 0, 0, S, S); g.clearRect(0, 0, S, S); wip(); m.remove(); say('화풍을 바탕에 깔았어요. 그 위에 더 그려 보세요 (바탕을 바꾸면 사라져요).'); };
          say('');
        }, 30);
      });
    }

    /* 🖼 내 그림 전시관 */
    async function galView(body) {
      body.innerHTML = `<div class="box"><b>🖼 내 그림 전시관</b><div class="small muted">완성한 그림은 <b>이 기기에만</b> 걸려요. 휴대폰을 바꾸거나 저장 공간을 비우면 사라지니, 아끼는 그림은 내려받아 두세요.</div><div class="say" id="art-say" aria-live="polite"></div></div><div class="gal" id="gal"></div>`;
      const list = await galList(), gal = body.querySelector('#gal'), urls = [];
      cleanup = () => urls.forEach(u => URL.revokeObjectURL(u));
      if (!list.length) { gal.innerHTML = '<div class="box small muted">아직 걸린 그림이 없어요. 따라 그리기·색칠 놀이·예술 붓에서 「전시관에 걸기」를 눌러 보세요.</div>'; return; }
      gal.innerHTML = list.map((w, i) => { const u = URL.createObjectURL(w.blob); urls.push(u); return `<div><button class="frame" data-w="${i}" aria-label="${esc(w.title)} 크게 보기"><img src="${u}" alt="${esc(w.title)}"></button><div class="cap">${esc(w.title)}<br><span class="dim">${new Date(w.at).toLocaleDateString('ko-KR')}</span></div></div>`; }).join('');
      gal.querySelectorAll('[data-w]').forEach(b => b.onclick = () => {
        const w = list[+b.dataset.w], u = urls[+b.dataset.w], m = document.createElement('div'); m.className = 'modal';
        m.innerHTML = `<div role="dialog" aria-label="그림 보기"><img src="${u}" alt="${esc(w.title)}"><input id="gw-t" value="${esc(w.title)}" maxlength="30" aria-label="제목"><div class="bar"><button class="btn" data-ren>제목 고치기</button><button class="btn primary" data-dl>⬇ 내려받기</button><button class="btn" data-del>🗑 지우기</button><button class="btn" data-x>닫기</button></div></div>`;
        el.appendChild(m);
        m.querySelector('[data-x]').onclick = () => m.remove();
        m.querySelector('[data-ren]').onclick = async () => { w.title = m.querySelector('#gw-t').value.trim().slice(0, 30) || w.title; await galPut(w); m.remove(); render(); };
        m.querySelector('[data-dl]').onclick = async () => { try { await download(w.blob, `sea-art-${new Date(w.at).toISOString().slice(0, 10)}.png`); } catch (e) {} };
        m.querySelector('[data-del]').onclick = async () => { if (!confirm(`「${w.title}」을 전시관에서 지울까요? 되돌릴 수 없어요.`)) return; await galDel(w.id); m.remove(); render(); };
      });
    }

    render();
  }

  window.ArtApp = { view, CR, svgOf, galPut, galList, toBlob };
})();
