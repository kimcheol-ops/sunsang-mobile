/* 낚시꾼 코디 · 채비 맞추기 — SunsangHelper PC 앱과 휴대폰 '바다 조황 수첩'이 함께 쓰는 게임 2종
 *
 * AnglerDress.mount(container, { today, wallet: { get() → {coins, owned[], outfit{}}, set(state) → Promise }, onScore(res) })
 *   오늘의 출조 조건(계절·날씨·어종·시간)에 맞게 옷·구명조끼·신발·악세사리·낚싯대를 골라 '코디 미션' 점수를 받습니다.
 *   안전(구명조끼)이 빠지면 0점. 아이템은 코인으로 삽니다(코인은 낚시 게임·채비 맞추기에서 얻음).
 * AnglerDress.avatar(outfit, px) → 아바타 SVG 문자열(순위표 등에 작게 표시)
 * RigMatch.mount(container, { onEnd(res) }) — 어종별 채비·요령 60초 맞히기
 */
(function () {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ── 아이템: 값은 따뜻함(warm)·방수(water)·안전(safety)·미끄럼 방지(grip)·햇빛 차단(sun)·야간(night) ──
  const ITEMS = {
    hat: [
      { id: 'none', name: '없음', price: 0 },
      { id: 'cap', name: '낚시 캡', price: 0, color: '#2E5F86', sun: 1 },
      { id: 'bucket', name: '버킷햇', price: 30, color: '#C9B48A', sun: 2 },
      { id: 'beanie', name: '방한 비니', price: 30, color: '#8B2E3B', warm: 1 },
      { id: 'crown', name: '축제 왕관', price: 0, color: '#FFD34D', sun: 1, event: true },   // 계절 이벤트 600점 보상(구입 불가)
    ],
    top: [
      { id: 'tee', name: '반팔 티', price: 0, color: '#E6EAEE' },
      { id: 'fleece', name: '플리스', price: 40, color: '#3E6B4F', warm: 2 },
      { id: 'rain', name: '우의 상의', price: 50, color: '#F2C230', warm: 1, water: 2 },
      { id: 'padding', name: '방한 패딩', price: 70, color: '#22313F', warm: 3, water: 1 },
    ],
    vest: [
      { id: 'none', name: '없음', price: 0 },
      { id: 'auto', name: '팽창식 구명조끼', price: 0, color: '#E2572B', safety: 2 },
      { id: 'foam', name: '고체식 구명조끼', price: 20, color: '#FF7A1A', safety: 2, warm: 1 },
    ],
    bottom: [
      { id: 'jeans', name: '청바지', price: 0, color: '#3B5B8C' },
      { id: 'rainpants', name: '우의 하의(멜빵)', price: 40, color: '#F2C230', water: 2 },
      { id: 'warm', name: '방한 방수 바지', price: 40, color: '#2A2F36', warm: 1, water: 1 },
    ],
    shoes: [
      { id: 'sneakers', name: '운동화', price: 0, color: '#DDDDDD' },
      { id: 'deck', name: '데크화', price: 40, color: '#1D3B4F', grip: 2 },
      { id: 'boots', name: '낚시 장화', price: 50, color: '#2F5D3A', grip: 2, water: 1 },
    ],
    acc: [
      { id: 'glasses', name: '편광안경', price: 30, sun: 2 },
      { id: 'gaiter', name: '넥게이터', price: 20, sun: 1, warm: 1 },
      { id: 'gloves', name: '낚시 장갑', price: 20, grip: 1 },
      { id: 'lamp', name: '헤드랜턴', price: 30, night: 1 },
    ],
    prop: [
      { id: 'egi', name: '에기 선상대', price: 0 },
      { id: 'downshot', name: '광어 다운샷대', price: 40 },
      { id: 'tai', name: '타이라바대', price: 40 },
      { id: 'electric', name: '전동릴 선상대', price: 80 },
    ],
  };
  const SLOTS = [['hat', '모자'], ['top', '상의'], ['vest', '구명조끼'], ['bottom', '하의'], ['shoes', '신발'], ['acc', '악세사리'], ['prop', '낚싯대']];
  const FREE = ['hat:none', 'hat:cap', 'top:tee', 'vest:none', 'vest:auto', 'bottom:jeans', 'shoes:sneakers', 'prop:egi'];
  const DEFAULT = { hat: 'cap', top: 'tee', vest: 'auto', bottom: 'jeans', shoes: 'sneakers', acc: [], prop: 'egi' };
  const item = (slot, id) => ITEMS[slot].find(x => x.id === id) || ITEMS[slot][0];
  const ROD = { '쭈꾸미': 'egi', '갑오징어': 'egi', '문어': 'egi', '무늬오징어': 'egi', '한치': 'egi', '광어': 'downshot', '참돔': 'tai', '우럭': 'electric', '갈치': 'electric' };
  const INK = ['쭈꾸미', '갑오징어', '무늬오징어', '한치'];
  const PEAK = { '쭈꾸미': [9, 10, 11], '갑오징어': [4, 5, 9, 10, 11], '우럭': [3, 4, 5, 6, 9, 10, 11, 12], '광어': [4, 5, 9, 10, 11], '참돔': [5, 6, 9, 10, 11], '갈치': [7, 8, 9, 10, 11], '문어': [7, 8, 9, 10, 11], '무늬오징어': [9, 10, 11, 12], '한치': [6, 7, 8] };

  // 날짜로 정해지는 오늘의 출조 조건(모든 사람이 같은 미션)
  function mission(d) {
    const seed = d.getFullYear() * 400 + (d.getMonth() + 1) * 31 + d.getDate();
    const r = k => { const x = Math.sin(seed * 9301 + k * 49297) * 233280; return x - Math.floor(x); };
    const m = d.getMonth() + 1;
    const cold = [12, 1, 2].includes(m) ? 3 : [3, 4, 10, 11].includes(m) ? 2 : [5, 9].includes(m) ? 1 : 0;
    const weather = ['맑음', '맑음', '흐림', '비', '바람 강함'][Math.floor(r(1) * 5)];
    const cands = Object.keys(PEAK).filter(s => PEAK[s].includes(m));
    const species = (cands.length ? cands : Object.keys(PEAK))[Math.floor(r(2) * (cands.length || 9))];
    const night = species === '갈치' || species === '한치';
    return { cold, weather, species, night, temp: ['한여름 더위', '선선함', '쌀쌀함', '한겨울 추위'][cold] };
  }

  function evaluate(o, ms) {
    const parts = [item('hat', o.hat), item('top', o.top), item('vest', o.vest), item('bottom', o.bottom), item('shoes', o.shoes), item('prop', o.prop), ...(o.acc || []).map(a => item('acc', a))];
    const sum = k => parts.reduce((a, p) => a + (p[k] || 0), 0);
    const lines = []; let score = 0;
    const safety = item('vest', o.vest).safety || 0;
    if (!safety) return { score: 0, lines: ['🚫 구명조끼가 없습니다 — 승선 중 착용은 필수라 0점입니다.'], grade: '승선 불가' };
    score += 30; lines.push('✅ 구명조끼 착용 +30');
    const warm = sum('warm'), need = ms.cold + (ms.night ? 1 : 0);
    if (ms.cold === 0 && warm >= 3) { score += 5; lines.push('🥵 한여름에 너무 덥게 입었습니다 +5 (얇게 입고 햇빛을 막으세요)'); }
    else if (warm >= need) { score += 20; lines.push(`✅ 보온 충분 (${warm}/${need}) +20`); }
    else { const p = Math.round(20 * warm / Math.max(1, need)); score += p; lines.push(`🥶 ${ms.temp}${ms.night ? '·야간' : ''}에 보온이 부족합니다 (${warm}/${need}) +${p}`); }
    const wb =(item('bottom', o.bottom).water || 0) + (item('top', o.top).water || 0) + (item('shoes', o.shoes).water || 0);
    const wNeed = ms.weather === '비' ? 4 : INK.includes(ms.species) ? 2 : 0;
    if (wNeed === 0) { score += 15; lines.push('✅ 방수는 크게 필요 없는 날 +15'); }
    else if (wb >= wNeed) { score += 15; lines.push(`✅ ${ms.weather === '비' ? '비' : ms.species + ' 먹물'} 대비 방수 +15`); }
    else { const p = Math.round(15 * wb / wNeed); score += p; lines.push(`💧 ${ms.weather === '비' ? '비가 옵니다' : ms.species + ' 먹물이 튑니다'} — 우의 상·하의를 권합니다 +${p}`); }
    const grip = sum('grip'), gNeed = ms.weather === '비' || ms.weather === '바람 강함' ? 3 : 2;
    if (grip >= gNeed) { score += 15; lines.push('✅ 젖은 갑판에서도 미끄럽지 않음 +15'); }
    else { const p = Math.round(15 * grip / gNeed); score += p; lines.push(`⚠ 미끄럼 방지 부족 (${grip}/${gNeed}) — 데크화·장화·장갑 +${p}`); }
    if (ms.night) {
      if ((o.acc || []).includes('lamp')) { score += 10; lines.push('✅ 야간 출조 헤드랜턴 +10'); } else lines.push('🔦 야간 출조인데 헤드랜턴이 없습니다 +0');
    } else {
      const sun = sum('sun'), sNeed = ms.weather === '맑음' ? 3 : 1;
      if (sun >= sNeed) { score += 10; lines.push('✅ 햇빛·반사광 차단 +10'); } else { const p = Math.round(10 * sun / sNeed); score += p; lines.push(`😎 ${ms.weather === '맑음' ? '맑은 날 반사광' : '햇빛'} 대비가 부족합니다 — 모자·편광안경 +${p}`); }
    }
    if (o.prop === ROD[ms.species]) { score += 10; lines.push(`✅ ${ms.species}에 맞는 ${item('prop', o.prop).name} +10`); }
    else lines.push(`🎣 ${ms.species}에는 ${item('prop', ROD[ms.species]).name}이 어울립니다 +0`);
    // 스타일 보너스: 같은 색 계열 맞춤(우의 세트 등)
    const tc = item('top', o.top).color, bc = item('bottom', o.bottom).color;
    if (tc && tc === bc) { score += 5; lines.push('✨ 상·하의 세트 코디 +5'); }
    score = Math.min(100, score);
    return { score, lines, grade: score >= 90 ? '베테랑 선장' : score >= 75 ? '든든한 꾼' : score >= 55 ? '초보 탈출' : '준비 부족' };
  }

  // ── 아바타(SVG): 낚시꾼 한 명, 고른 옷이 층층이 그려짐 ──
  function avatar(o, px) {
    o = Object.assign({}, DEFAULT, o || {});
    const top = item('top', o.top), bot = item('bottom', o.bottom), sh = item('shoes', o.shoes), hat = item('hat', o.hat), vest = item('vest', o.vest);
    const acc = new Set(o.acc || []), skin = '#F1C8A0';
    const rod = { egi: '#8C5A2B', downshot: '#2C4A6B', tai: '#B03A2E', electric: '#222' }[o.prop] || '#8C5A2B';
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160" width="${px || 120}" height="${(px || 120) * 4 / 3}" role="img" aria-label="낚시꾼 아바타">`;
    s += `<line x1="96" y1="96" x2="116" y2="10" stroke="${rod}" stroke-width="3" stroke-linecap="round"/><line x1="116" y1="10" x2="116" y2="60" stroke="#ddd" stroke-width=".8"/>`;
    if (o.prop === 'electric') s += `<rect x="92" y="88" width="12" height="9" rx="2" fill="#555"/>`;
    // 다리·신발
    s += `<rect x="42" y="98" width="15" height="42" rx="5" fill="${bot.color}"/><rect x="63" y="98" width="15" height="42" rx="5" fill="${bot.color}"/>`;
    if (o.bottom === 'rainpants') s += `<rect x="45" y="62" width="4" height="40" fill="${bot.color}"/><rect x="71" y="62" width="4" height="40" fill="${bot.color}"/>`;
    const shoeH = o.shoes === 'boots' ? 18 : 9;
    s += `<rect x="38" y="${149 - shoeH}" width="21" height="${shoeH + 4}" rx="4" fill="${sh.color}"/><rect x="61" y="${149 - shoeH}" width="21" height="${shoeH + 4}" rx="4" fill="${sh.color}"/>`;
    if (sh.grip) s += `<rect x="38" y="151" width="21" height="2" fill="#111"/><rect x="61" y="151" width="21" height="2" fill="#111"/>`;
    // 몸·팔
    s += `<rect x="36" y="56" width="48" height="48" rx="12" fill="${top.color}"/>`;
    s += `<rect x="24" y="60" width="13" height="36" rx="6" fill="${top.color}"/><rect x="83" y="60" width="13" height="36" rx="6" fill="${top.color}"/>`;
    if (o.top === 'padding') s += `<line x1="38" y1="70" x2="82" y2="70" stroke="#3A4B5C" stroke-width="2"/><line x1="38" y1="84" x2="82" y2="84" stroke="#3A4B5C" stroke-width="2"/>`;
    if (o.top === 'rain') s += `<path d="M44 56 Q60 46 76 56" fill="none" stroke="#C99A10" stroke-width="3"/>`;
    // 구명조끼
    if (o.vest === 'foam') s += `<rect x="38" y="58" width="44" height="40" rx="8" fill="${vest.color}"/><line x1="60" y1="58" x2="60" y2="98" stroke="#222" stroke-width="2"/><rect x="40" y="86" width="40" height="4" fill="#222"/>`;
    if (o.vest === 'auto') s += `<path d="M42 58 L52 58 L56 92 L48 92 Z" fill="${vest.color}"/><path d="M78 58 L68 58 L64 92 L72 92 Z" fill="${vest.color}"/><rect x="40" y="90" width="40" height="5" rx="2" fill="#333"/>`;
    // 손·장갑
    const hand = acc.has('gloves') ? '#3B3F45' : skin;
    s += `<circle cx="30" cy="98" r="6" fill="${hand}"/><circle cx="90" cy="98" r="6" fill="${hand}"/>`;
    // 머리
    s += `<circle cx="60" cy="38" r="17" fill="${skin}"/>`;
    s += acc.has('glasses') ? `<rect x="47" y="34" width="11" height="7" rx="2" fill="#1E2A33"/><rect x="62" y="34" width="11" height="7" rx="2" fill="#1E2A33"/><line x1="58" y1="37" x2="62" y2="37" stroke="#1E2A33" stroke-width="1.5"/>`
      : `<circle cx="53" cy="37" r="2" fill="#333"/><circle cx="67" cy="37" r="2" fill="#333"/>`;
    s += acc.has('gaiter') ? `<rect x="46" y="44" width="28" height="12" rx="5" fill="#4E6E7E"/>` : `<path d="M54 46 Q60 50 66 46" fill="none" stroke="#9A5A3A" stroke-width="1.6" stroke-linecap="round"/>`;
    // 모자
    if (o.hat === 'cap') s += `<path d="M43 30 Q60 12 77 30 Z" fill="${hat.color}"/><rect x="40" y="28" width="30" height="5" rx="2" fill="${hat.color}"/>`;
    if (o.hat === 'bucket') s += `<path d="M46 28 Q60 12 74 28 Z" fill="${hat.color}"/><ellipse cx="60" cy="29" rx="23" ry="5" fill="${hat.color}"/>`;
    if (o.hat === 'beanie') s += `<path d="M43 33 Q60 6 77 33 Z" fill="${hat.color}"/><rect x="43" y="29" width="34" height="6" rx="3" fill="#6E2430"/><circle cx="60" cy="12" r="4" fill="#6E2430"/>`;
    if (o.hat === 'crown') s += `<path d="M44 30 L46 14 L53 23 L60 10 L67 23 L74 14 L76 30 Z" fill="${hat.color}" stroke="#B8860B" stroke-width="1.2"/><circle cx="60" cy="20" r="2.4" fill="#E2572B"/><circle cx="51" cy="25" r="1.8" fill="#3C7FC0"/><circle cx="69" cy="25" r="1.8" fill="#1D8A5B"/>`;
    if (acc.has('lamp')) s +=`<rect x="42" y="27" width="36" height="3" fill="#222"/><circle cx="60" cy="27" r="4" fill="#FFF3A0" stroke="#222"/>`;
    return s + '</svg>';
  }

  function mountDress(container, opts) {
    const today = opts.today || new Date(), ms = mission(today), wallet = opts.wallet;
    let st = wallet.get(), sel = 'top';
    st = { coins: st.coins ?? 50, owned: st.owned && st.owned.length ? st.owned : FREE.slice(), outfit: Object.assign({}, DEFAULT, st.outfit || {}) };
    container.innerHTML = `
      <div style="display:grid;gap:10px">
        <div style="padding:10px 12px;border-radius:10px;background:var(--sea-soft,#1F3A50)">
          <b>오늘의 코디 미션</b> · ${esc(ms.temp)} · ${esc(ms.weather)} · <b>${esc(ms.species)}</b> ${ms.night ? '야간' : '새벽'} 출조
          <div style="font-size:12.5px;opacity:.8;margin-top:2px">안전·보온·방수·미끄럼·햇빛(야간은 랜턴)·낚싯대를 오늘 조건에 맞게 고르세요.</div>
        </div>
        <div style="display:grid;grid-template-columns:minmax(120px,160px) 1fr;gap:12px;align-items:start">
          <div style="display:grid;gap:6px;justify-items:center">
            <div data-av style="background:linear-gradient(#BFE3EA,#E8F4F6);border-radius:12px;padding:6px;width:100%;display:grid;place-items:center"></div>
            <div style="font-weight:700">🪙 <span data-coins></span> 코인</div>
          </div>
          <div style="display:grid;gap:8px;min-width:0">
            <div data-slots style="display:flex;flex-wrap:wrap;gap:4px"></div>
            <div data-items style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:6px"></div>
          </div>
        </div>
        <button type="button" data-go style="min-height:50px;border:0;border-radius:12px;background:#E2572B;color:#fff;font:700 16px inherit;cursor:pointer">👕 이 코디로 출조하기 (채점)</button>
        <div data-res style="display:none;padding:10px 12px;border-radius:10px;background:var(--sea-soft,#1F3A50);font-size:14px;line-height:1.6"></div>
      </div>`;
    const q = s => container.querySelector(s);
    const btn = 'border:1px solid var(--line,#3E4852);border-radius:999px;padding:6px 12px;background:var(--chart,#2A3139);color:inherit;font:500 13.5px inherit;cursor:pointer';
    function save() { return wallet.set({ coins: st.coins, owned: st.owned, outfit: st.outfit }); }
    function draw() {
      q('[data-av]').innerHTML = avatar(st.outfit, 130);
      q('[data-coins]').textContent = st.coins;
      q('[data-slots]').innerHTML = SLOTS.map(([k, n]) => `<button type="button" data-slot="${k}" style="${btn};${k === sel ? 'background:#2E5F86;color:#fff;border-color:#2E5F86' : ''}">${n}</button>`).join('');
      q('[data-items]').innerHTML = ITEMS[sel].map(it => {
        const key = sel + ':' + it.id, own = st.owned.includes(key);
        const on = sel === 'acc' ? (st.outfit.acc || []).includes(it.id) : st.outfit[sel] === it.id;
        const stats = ['warm:보온', 'water:방수', 'safety:안전', 'grip:미끄럼방지', 'sun:햇빛', 'night:야간'].map(x => x.split(':')).filter(([k]) => it[k]).map(([k, n]) => `${n}${'●'.repeat(it[k])}`).join(' ');
        return `<button type="button" data-item="${it.id}" style="text-align:left;border:2px solid ${on ? '#E2572B' : 'var(--line,#3E4852)'};border-radius:10px;padding:8px;background:var(--surface,#1E242B);color:inherit;font:13px inherit;cursor:pointer;min-height:58px">
          <b>${esc(it.name)}</b>${it.color ? ` <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${it.color};vertical-align:-1px"></span>` : ''}<br>
          <span style="font-size:11.5px;opacity:.75">${stats || '&nbsp;'}</span><br>
          <span style="font-size:12px;font-weight:700">${own ? (on ? '착용 중' : '보유') : it.event ? '🎉 이벤트 보상' : '🪙 ' + it.price}</span></button>`;
      }).join('');
      container.querySelectorAll('[data-slot]').forEach(b => b.onclick = () => { sel = b.dataset.slot; draw(); });
      container.querySelectorAll('[data-item]').forEach(b => b.onclick = () => pick(b.dataset.item));
    }
    function pick(id) {
      const it = item(sel, id), key = sel + ':' + id;
      if (!st.owned.includes(key)) {
        if (it.event) { flash(`${it.name}은(는) 계절 이벤트 600점 보상으로만 얻을 수 있습니다`); return; }
        if (st.coins < it.price) { flash(`코인이 ${it.price - st.coins}개 모자랍니다 — 「한 수 더!」나 「채비 맞추기」로 모아 보세요`); return; }
        st.coins -= it.price; st.owned.push(key); flash(`${it.name} 구입! 🪙 −${it.price}`);
      }
      if (sel === 'acc') { const a = new Set(st.outfit.acc || []); a.has(id) ? a.delete(id) : a.add(id); st.outfit.acc = [...a]; }
      else st.outfit[sel] = id;
      draw(); save();
    }
    function flash(t) { const r = q('[data-res]'); r.style.display = 'block'; r.textContent = t; }
    q('[data-go]').onclick = () => {
      const res = evaluate(st.outfit, ms);
      const r = q('[data-res]'); r.style.display = 'block';
      r.innerHTML = `<b style="font-size:18px">${res.score}점 · ${esc(res.grade)}</b><br>` + res.lines.map(esc).join('<br>');
      if (opts.onScore) opts.onScore({ score: res.score, grade: res.grade, mission: ms, outfit: st.outfit, earn: () => st, add: n => { st.coins += n; draw(); return save(); } });
    };
    draw();
  }

  // ── 채비 맞추기: 60초 동안 어종별 채비·요령 문제 ──
  const RIG = [
    ['쭈꾸미', '에기 크기는?', '1.8~2.5호', ['3.5호 이상 대형', '이카메탈 25호']],
    ['쭈꾸미', '원줄(합사)은?', 'PE 0.8~1호', ['PE 4호', '나일론 10호']],
    ['쭈꾸미', '입질 기다리는 방법은?', '살짝 들었다 내리고 3~5초 멈춤', ['쉬지 않고 빠르게 감기', '바닥에 계속 끌기']],
    ['갑오징어', '에기는?', '2.5~3호 슬림형', ['1.5호 소형', '타이라바 100g']],
    ['갑오징어', '감아올릴 때 요령은?', '일정한 속도로 감기', ['중간에 멈췄다 감기', '최대한 빠르게 당기기']],
    ['문어', '에기는?', '3.5호 이상 대형 2개', ['1.8호 소형 1개', '웜 4인치']],
    ['문어', '무거워지면?', '세게 들어 바닥에서 떼고 쉬지 않고 감기', ['5초 기다리기', '줄을 풀어 주기']],
    ['참돔', '채비는?', '타이라바 60~150g', ['쭈꾸미 에기', '카드채비']],
    ['참돔', "'톡톡' 입질이 오면?", '같은 속도로 계속 감기', ['감기를 멈춘다', '바로 크게 챔질']],
    ['광어', '채비는?', '다운샷 봉돌 + 웜', ['이카메탈', '타이라바']],
    ['광어', '입질이 오면?', '1~2초 기다려 무게가 실리면 챔질', ['바로 챔질', '줄을 놓는다']],
    ['우럭', '바닥에 닿으면?', '바로 1~2바퀴 감아 밑걸림 피하기', ['바닥에 그대로 두기', '줄을 더 풀기']],
    ['우럭', '봉돌은?', '40~120호(선장 지정)', ['5호', '봉돌 없이']],
    ['갈치', '미끼는?', '꽁치살', ['웜', '옥수수']],
    ['갈치', '잡았을 때 주의는?', '이빨 — 집게·장갑 사용', ['독가시', '먹물']],
    ['한치', '채비는?', '이카메탈(봉돌형 에기) 10~25호', ['타이라바', '다운샷']],
    ['한치', '주로 언제 하나요?', '여름 밤(집어등)', ['한겨울 낮', '봄 새벽만']],
    ['무늬오징어', '선상 방식은?', '팁런 — 초릿대로 입질 보기', ['카드채비', '찌낚시']],
  ];
  function mountRig(container, opts) {
    let qs = [], i = 0, score = 0, right = 0, streak = 0, t = 60, timer = 0, lock = false;
    container.innerHTML = `<div style="display:grid;gap:10px">
      <div style="display:flex;justify-content:space-between;font-weight:700"><span data-t>⏱ 60초</span><span data-s>점수 0</span></div>
      <div data-q style="min-height:64px;font-size:17px;line-height:1.45"></div><div data-o style="display:grid;gap:8px"></div>
      <button type="button" data-start style="min-height:50px;border:0;border-radius:12px;background:#E2572B;color:#fff;font:700 16px inherit;cursor:pointer">▶ 채비 맞추기 시작 (60초)</button>
      <div data-r style="display:none;padding:10px 12px;border-radius:10px;background:var(--sea-soft,#1F3A50)"></div></div>`;
    const q = s => container.querySelector(s);
    function show() {
      const [sp, ask, ans, wrong] = RIG[qs[i % qs.length]];
      const opts2 = [ans, ...wrong].map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
      q('[data-q]').innerHTML = `<b>${esc(sp)}</b> — ${esc(ask)}`;
      q('[data-o]').innerHTML = opts2.map(o => `<button type="button" data-v="${esc(o)}" style="text-align:left;min-height:46px;border:1px solid var(--line,#3E4852);border-radius:10px;background:var(--chart,#2A3139);color:inherit;font:15px inherit;padding:8px 12px;cursor:pointer">${esc(o)}</button>`).join('');
      container.querySelectorAll('[data-v]').forEach(b => b.onclick = () => {
        if (lock) return; lock = true;
        const ok = b.dataset.v === ans;
        if (ok) { right++; streak++; score += 10 + Math.min(5, streak - 1) * 2; } else { streak = 0; score = Math.max(0, score - 3); }
        b.style.borderColor = ok ? '#4BD08A' : '#FF5A4A';
        q('[data-s]').textContent = `점수 ${score}${streak > 1 ? ` · 연속 ${streak}` : ''}`;
        setTimeout(() => { lock = false; i++; if (t > 0) show(); }, ok ? 350 : 900);
      });
    }
    function end() {
      clearInterval(timer); q('[data-o]').innerHTML = ''; q('[data-q]').textContent = '';
      const r = q('[data-r]'); r.style.display = 'block';
      r.innerHTML = `<b>${score}점</b> · 맞힌 문제 ${right}개 · 🪙 +${right * 2} 코인`;
      q('[data-start]').style.display = ''; q('[data-start]').textContent = '↻ 다시 하기';
      if (opts.onEnd) opts.onEnd({ score, right, coins: right * 2 });
    }
    q('[data-start]').onclick = () => {
      qs = RIG.map((_, k) => [Math.random(), k]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
      i = 0; score = 0; right = 0; streak = 0; t = 60; lock = false;
      q('[data-r]').style.display = 'none'; q('[data-start]').style.display = 'none'; q('[data-s]').textContent = '점수 0';
      show(); clearInterval(timer);
      timer = setInterval(() => { t--; q('[data-t]').textContent = `⏱ ${t}초`; if (t <= 0) end(); }, 1000);
    };
    return { destroy() { clearInterval(timer); container.innerHTML = ''; } };
  }

  /** 이벤트 보상 등으로 아이템 하나를 옷장에 넣은 새 owned 목록(처음이면 기본 아이템 포함) */
  const unlock = (owned, key) => { const o = owned && owned.length ? owned.slice() : FREE.slice(); if (!o.includes(key)) o.push(key); return o; };
  window.AnglerDress = { mount: mountDress, avatar, mission, evaluate, ITEMS, DEFAULT, FREE, unlock };
  window.RigMatch = { mount: mountRig, QUESTIONS: RIG };
})();
