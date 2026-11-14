/* FunBoard — 운전 개요 하단 「오늘의 바다 놀이터」 (PC 오늘의 바다 소식 · 휴대폰 관제 화면 · 조황 수첩 공용)
 *  FunBoard.mount(root, { sea: SEA_DATA, today: TODAY_DATA, story: window.Story, region: {name,lat,lon}, net, crowd?: async () => [{sp,n,day,uid}], download?(blob,name), open?(kind), inPC })
 *  → { setRegion(name, lat, lon) }
 *  조황 대신: ① 어종별 입질 예보(계산값) ② 공개 조황 요약(today-data.js reports, 출처 링크) ③ 내 주변 낚시인 조황 ④ 제철·금어기 달력
 *  예능·만화: ⑤ 물결이 15초 쇼츠 ⑥ 오늘의 낚시 운세·퀴즈·밸런스 게임 ⑦ 만화·연재 미리보기 ⑧ 우주 낚시 연재 웹툰
 *  기록(퀴즈·밸런스 선택)은 이 기기 localStorage 'fun.v1'에만
 */
(function () {
  'use strict';
  const CSS = `
  .fun { --f-panel:#14202A; --f-line:#29404C; --f-fg:#E6EEF0; --f-muted:#93A8B0; --f-acc:#7FD6E8; --f-ok:#6FD3A4; --f-warn:#F5C46B; --f-bad:#FF8A8D;
    color: var(--f-fg); display: grid; gap: 10px; font-size: 13.5px; line-height: 1.55; margin-top: 12px; }
  .fun * { box-sizing: border-box; }
  .fun h2.fh { margin: 4px 0 0; font-size: 16px; display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; }
  .fun h2.fh small { color: var(--f-muted); font-weight: 400; font-size: 12px; }
  .fun .fgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 10px; align-items: start; }
  .fun .fc { background: var(--f-panel); border: 1px solid var(--f-line); border-radius: 12px; padding: 10px 12px; display: grid; gap: 7px; min-width: 0; }
  .fun .fc h3 { margin: 0; font-size: 14.5px; display: flex; justify-content: space-between; gap: 6px; align-items: baseline; }
  .fun .fc h3 span { font-weight: 400; font-size: 11.5px; color: var(--f-muted); }
  .fun .muted { color: var(--f-muted); } .fun .small { font-size: 12px; } .fun .ok { color: var(--f-ok); } .fun .warn { color: var(--f-warn); } .fun .bad { color: var(--f-bad); }
  .fun .btn { display: inline-flex; align-items: center; gap: 4px; min-height: 30px; border-radius: 7px; border: 1px solid var(--f-line); background: #1D2D38; color: var(--f-fg); font: 600 12.5px inherit; padding: 0 10px; cursor: pointer; text-decoration: none; }
  .fun .btn.pri { background: #1F6C80; border-color: #2A87A0; }
  .fun .row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  .fun .sp { display: grid; grid-template-columns: 26px 1fr auto; gap: 6px; align-items: center; padding: 3px 0; border-bottom: 1px dashed #24363F; }
  .fun .sp:last-child { border-bottom: 0; }
  .fun .stars { color: #FFD27A; letter-spacing: 1px; white-space: nowrap; }
  .fun .why { font-size: 11.5px; color: var(--f-muted); }
  .fun .chip { display: inline-block; border: 1px solid var(--f-line); border-radius: 999px; padding: 1px 8px; font-size: 11.5px; background: #0F1A21; }
  .fun .chip.ok { border-color: #2F7A5A; color: var(--f-ok); } .fun .chip.warn { border-color: #8A6A2A; color: var(--f-warn); } .fun .chip.bad { border-color: #8A3A3D; color: var(--f-bad); }
  .fun .cal { display: grid; grid-template-columns: 74px repeat(12, 1fr); gap: 2px; font-size: 11px; align-items: center; }
  .fun .cal i { display: block; height: 12px; border-radius: 3px; background: #1A2A33; }
  .fun .cal i.on { background: #2F9A7A; } .fun .cal i.ban { background: #9A3A3D; } .fun .cal i.now { outline: 2px solid #FFD27A; outline-offset: -1px; }
  .fun .short { display: grid; justify-items: center; gap: 6px; }
  .fun .short canvas { width: min(100%, 270px); aspect-ratio: 9 / 16; border-radius: 14px; background: #000; display: block; box-shadow: 0 4px 18px rgba(0,0,0,.5); }
  .fun .quiz button.opt { text-align: left; width: 100%; }
  .fun .quiz button.opt.right { border-color: var(--f-ok); color: var(--f-ok); } .fun .quiz button.opt.wrong { border-color: var(--f-bad); color: var(--f-bad); }
  .fun .vs { display: grid; grid-template-columns: 1fr auto 1fr; gap: 6px; align-items: center; }
  .fun .vs button { min-height: 56px; font-size: 15px; }
  .fun .vs button[aria-pressed="true"] { background: #2B5F86; border-color: #5AA0D0; }
  .fun .bar2 { height: 8px; border-radius: 4px; background: #23343E; overflow: hidden; } .fun .bar2 i { display: block; height: 100%; background: #4FB3C8; }
  .fun .toon { display: grid; gap: 0; max-height: 640px; overflow-y: auto; border-radius: 10px; border: 1px solid var(--f-line); background: #070B14; }
  .fun .toon figure { margin: 0; } .fun .toon svg { display: block; width: 100%; height: auto; }
  .fun .toon figcaption { padding: 8px 12px 14px; font-size: 13.5px; color: #EAF0FF; background: #070B14; }
  .fun .toon figcaption b { color: #FFD27A; }
  .fun .prev { display: grid; grid-template-columns: 92px 1fr; gap: 10px; align-items: center; }
  .fun .prev svg { width: 92px; height: 92px; border-radius: 10px; }`;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const pad = n => String(n).padStart(2, '0');
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  function rng(seed) { let a = 0; for (const c of String(seed)) a = (a * 31 + c.charCodeAt(0)) | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const pick = (r, a) => a[Math.floor(r() * a.length)];

  // ── ⑥ 퀴즈 · 밸런스 게임 · 운세 재료 ──
  const QUIZ = [
    ['선상낚시에서 구명조끼는 언제 입어야 할까요?', ['배에 오를 때부터 내릴 때까지', '파도가 높을 때만', '수영을 못하는 사람만'], 0, '구명조끼는 배에 오르는 순간부터 내릴 때까지 입어요. 사고는 예고 없이 와요.'],
    ['밀물·썰물 차이가 가장 큰 물때는?', ['사리(대조)', '조금(소조)', '무쉬'], 0, '보름·그믐 무렵의 사리 때 물의 높낮이 차가 가장 커요.'],
    ['복어를 낚았다면?', ['놓아주거나 전문가에게 손질을 맡긴다', '집에서 바로 구워 먹는다', '회로 먹는다'], 0, '복어는 독이 있어 전문 자격이 있는 요리사만 손질해요.'],
    ['쭈꾸미 낚시에 주로 쓰는 미끼는?', ['에기(새우 모양 가짜 미끼)', '지렁이', '떡밥'], 0, '쭈꾸미·갑오징어는 에기나 애자에 잘 반응해요.'],
    ['풍랑주의보 기준 풍속은 대략?', ['초속 14m 이상', '초속 5m 이상', '초속 30m 이상'], 0, '해상 풍속 14m/s 이상이 3시간 넘게 예상되면 풍랑주의보가 나와요.'],
    ['금어기란?', ['물고기가 알을 낳는 시기 등에 잡지 못하게 정한 기간', '낚시터가 쉬는 날', '날씨가 나빠 배가 안 뜨는 날'], 0, '자원 보호를 위해 법으로 정한 기간이에요. 어기면 과태료가 있어요.'],
    ['갈치는 주로 언제 잘 잡힐까요?', ['밤', '한낮', '해 뜨기 직전 5분만'], 0, '갈치는 밤에 불빛(집어등)을 켜고 낚는 대표 어종이에요.'],
    ['낚싯줄·봉돌 쓰레기는 어떻게?', ['모두 챙겨 와서 버린다', '바다에 버려도 녹는다', '갯바위 틈에 숨긴다'], 0, '버려진 낚싯줄은 바다 생물을 휘감아 다치게 해요.'],
    ['멀미를 줄이는 방법이 아닌 것은?', ['배 안 선실에서 휴대폰 보기', '출항 30분 전 멀미약', '먼 수평선 바라보기'], 0, '좁은 선실에서 화면을 보면 멀미가 심해져요.'],
    ['물고기를 놓아줄 때 좋은 방법은?', ['젖은 손으로 살살 잡고 빨리 놓아준다', '마른 수건으로 꽉 잡는다', '갑판에 오래 둔다'], 0, '마른 손은 물고기 피부 점액을 벗겨 상처를 내요.'],
    ['수온이 낮은 겨울에 잘 무는 어종은?', ['볼락·도루묵', '한치·갈치', '무늬오징어'], 0, '볼락·도루묵은 찬물에서도 활발해요.'],
    ['선상에서 채비를 던질 때 가장 먼저 할 일은?', ['뒤와 옆에 사람이 없는지 보기', '최대한 세게 던지기', '눈 감고 던지기'], 0, '바늘에 사람이 다치는 사고가 생각보다 많아요.'],
    ['갯벌에서 가장 위험한 것은?', ['물이 들어오는 시간을 놓치는 것', '조개가 너무 많은 것', '모래가 고운 것'], 0, '물이 차오르는 속도는 사람 걸음보다 빠를 수 있어요.'],
    ['낚시어선을 탈 때 꼭 챙길 것은?', ['신분증(승선 명부 확인)', '여권', '운전 면허 시험지'], 0, '낚시어선은 승선 명부를 작성하고 신분증으로 확인해요.'],
    ['조과 사진을 올릴 때 지켜 주면 좋은 것은?', ['다른 사람 얼굴은 허락받기', '배 이름 크게 홍보', '정확한 비밀 포인트 공개'], 0, '함께 탄 사람의 얼굴·개인정보는 허락받고 올려요.']
  ];
  const VS = [['🐟 광어', '🐟 우럭'], ['🦑 쭈꾸미', '🦑 갑오징어'], ['🌅 새벽 출항', '🌇 오후 출항'], ['🍣 회', '🍲 매운탕'], ['🚤 선상낚시', '🪨 갯바위낚시'], ['🎣 손맛', '🍽 입맛'], ['🦀 꽃게탕', '🐙 문어숙회'], ['⛵ 남해', '🌊 동해'], ['🐠 많이 잡기', '🐋 큰 거 한 마리'], ['☕ 믹스커피', '🍜 컵라면']];
  const LUCK_COLOR = ['빨간', '주황', '노란', '연두', '파란', '보라', '분홍', '흰', '은색', '금색'];
  const LUCK_RIG = ['가벼운 봉돌', '한 호수 무거운 봉돌', '야광 에기', '빨간 바늘', '긴 목줄', '짧은 목줄', '새 미끼로 자주 교체', '천천히 고패질'];
  const LUCK_SAY = ['오늘은 첫 입질을 놓쳐도 두 번째가 진짜예요.', '배 앞쪽이 행운의 자리예요.', '옆 사람에게 채비를 빌려주면 복이 돌아와요.', '조급하면 놓쳐요. 커피 한 잔 여유를!', '작은 물고기는 돌려보내면 큰 행운이 와요.', '쓰레기 하나 줍기가 오늘의 행운 열쇠예요.', '물때가 바뀌는 시간에 집중하세요.', '사진은 놓아주기 전에 빨리 한 장!'];

  // ── ⑧ 우주 낚시 연재 웹툰 「별빛 낚시단」 — 매주 월요일 한 화씩 열림(첫 화 2026-11-09) ──
  const TOON_START = '2026-11-09';
  const TOON = [
    { t: '1화 · 달에서 낚싯대를 펴다', p: [
      ['moon', 'rocket', '별이: 착륙 완료! 여기가 달 「고요의 바다」 둘레길이구나.'],
      ['moon', 'duo', '물결이: (헬멧 속 물방울 수조 안에서) 우와, 하늘에 지구가 떠 있어!'],
      ['moon', 'cast', '별이: 크레이터 연못에 첫 캐스팅! 중력이 1/6이라 채비가 둥실둥실…'],
      ['moon', 'fish', '물결이: 입질이다! 은빛으로 반짝이는 「달빛 은빛고기」!'],
      ['earth', 'duo', '별이: 지구에서 3km 걸으면 여기 3km를 걸은 거래. 다음 주엔 화성이야!']] },
    { t: '2화 · 화성의 붉은 바람', p: [
      ['mars', 'rocket', '별이: 붉은 협곡 기지 도착. 먼지가 장난 아닌데?'],
      ['mars', 'storm', '물결이: 먼지 회오리다! 쉼터로 피해!'],
      ['mars', 'duo', '별이: 바다에서도 바람이 세면 출항을 미루지. 여기서도 마찬가지야.'],
      ['mars', 'fish', '물결이: 얼음 동굴 호수에서 「화성 얼음송어」를 낚았어!'],
      ['mars', 'sunset', '별이: 화성의 노을은 파랗대. 오늘은 여기까지!']] },
    { t: '3화 · 유로파 얼음 아래', p: [
      ['ice', 'rocket', '물결이: 발밑이 전부 얼음이야… 아래에 바다가 있대!'],
      ['ice', 'cast', '별이: 얼음 구멍 낚시! 구멍 주변은 미끄러우니 천천히.'],
      ['ice', 'fish', '물결이: 빛나는 「빛 비늘고기」야. 너무 예쁘다… 사진만 찍고 놓아주자.'],
      ['ice', 'duo', '별이: 작은 친구는 돌려보내기. 우주에서도 지키는 규칙!'],
      ['jupiter', 'duo', '물결이: 하늘 가득 목성이야. 다음은 토성 고리!']] },
    { t: '4화 · 토성 고리의 징검다리', p: [
      ['saturn', 'rocket', '별이: 고리 정거장! 머리 위로 고리가 활처럼 휘었어.'],
      ['saturn', 'cast', '물결이: 메탄 호수 낚시터. 안개가 짙으니 서로 줄을 확인하자.'],
      ['saturn', 'fish', '별이: 히트! 「메탄 호수 장어」다, 힘이 엄청나!'],
      ['saturn', 'duo', '물결이: 쓰레기는 우주선에 다시 싣고 가자. 고리를 깨끗하게!'],
      ['earth', 'duo', '별이: 다음 화는 해왕성… 하프 마라톤 거리야. 우리 같이 걸을래?']] }
  ];
  function toonPanel(bg, act) {
    const BG = { moon: ['#05060F', '#1B1E33', '#9A9CA6'], earth: ['#02061A', '#0B1E4A', '#3E6E9E'], mars: ['#2A0E08', '#6A2A14', '#C8643A'], ice: ['#020814', '#0F2A44', '#CFE6F2'], jupiter: ['#0A0610', '#2A1A12', '#B07A4A'], saturn: ['#1A1206', '#4A3416', '#C89A52'] }[bg] || ['#000', '#112', '#888'];
    const r = rng(bg + act); let stars = ''; for (let i = 0; i < 40; i++) stars += `<circle cx="${(r() * 400).toFixed(0)}" cy="${(r() * 150).toFixed(0)}" r="${(r() * 1.4 + .3).toFixed(1)}" fill="#fff" opacity="${(r() * .7 + .3).toFixed(2)}"/>`;
    const sky = bg === 'moon' ? '<circle cx="320" cy="55" r="26" fill="#3E7AC8"/><path d="M305 48 q8 -10 18 -2 q6 8 -4 14 q-10 4 -14 -12z" fill="#5FAA5A"/>'
      : bg === 'earth' ? '<circle cx="200" cy="300" r="190" fill="#2E6AAE"/><path d="M90 200 q40 -30 80 -6 q30 18 -10 40 q-50 10 -70 -34z M250 170 q40 -10 60 20 q-20 30 -60 10z" fill="#5FAA5A"/><circle cx="200" cy="300" r="196" fill="none" stroke="#8CD0FF" stroke-width="6" opacity=".5"/>'
      : bg === 'jupiter' ? '<circle cx="300" cy="80" r="70" fill="#C9955E"/><path d="M232 60h136M230 80h140M234 100h132" stroke="#8A5A32" stroke-width="7" opacity=".6"/><ellipse cx="320" cy="96" rx="14" ry="8" fill="#A0442A"/>'
      : bg === 'saturn' ? '<ellipse cx="300" cy="60" rx="80" ry="16" fill="none" stroke="#F2D9A0" stroke-width="5" transform="rotate(-12 300 60)"/><circle cx="300" cy="60" r="32" fill="#E0B870"/>'
      : bg === 'mars' ? '<circle cx="330" cy="40" r="10" fill="#FFE6C0" opacity=".8"/>' : bg === 'ice' ? '<circle cx="330" cy="50" r="40" fill="#D9A070" opacity=".9"/>' : '';
    const ground = bg === 'earth' ? '' : `<path d="M0 190 Q100 170 200 186 T400 180 V260 H0Z" fill="${BG[2]}"/><path d="M0 214 Q120 200 260 214 T400 210 V260 H0Z" fill="#000" opacity=".18"/>`
      + (bg === 'moon' ? '<ellipse cx="90" cy="222" rx="30" ry="7" fill="#000" opacity=".25"/><ellipse cx="300" cy="232" rx="44" ry="9" fill="#2A4A7A" opacity=".8"/>' : '')
      + (bg === 'ice' ? '<path d="M40 210l60 10 40-14 70 18M220 200l50 20 90-8" stroke="#8A4A3A" stroke-width="2" fill="none" opacity=".6"/><ellipse cx="290" cy="226" rx="30" ry="7" fill="#123A5A"/>' : '')
      + (bg === 'saturn' ? '<ellipse cx="290" cy="228" rx="50" ry="9" fill="#3A2A12" opacity=".8"/>' : '');
    const astro = (x, y) => `<g transform="translate(${x} ${y})"><rect x="-13" y="-6" width="26" height="34" rx="9" fill="#F2F4F8"/><circle cx="0" cy="-18" r="15" fill="#F2F4F8"/><circle cx="2" cy="-18" r="10" fill="#1E3A6A"/><circle cx="6" cy="-22" r="3" fill="#8CC8FF"/><rect x="-11" y="26" width="9" height="14" rx="3" fill="#D8DCE4"/><rect x="2" y="26" width="9" height="14" rx="3" fill="#D8DCE4"/><rect x="-18" y="0" width="7" height="18" rx="3" fill="#D8DCE4"/><text x="-5" y="12" font-size="9" fill="#C0392B">★</text></g>`;
    const merm = (x, y) => `<g transform="translate(${x} ${y})"><circle cx="0" cy="-6" r="24" fill="#BFE8FF" opacity=".35" stroke="#E8F8FF" stroke-width="2"/><path d="M-9 -12 q0 -16 9 -16 q9 0 9 16 q2 10 -2 16 q-1 -12 -7 -14 q-6 2 -7 14 q-4 -6 -2 -16z" fill="#3FA7B8"/><circle cx="0" cy="-10" r="7" fill="#F2C9A8"/><circle cx="-2.5" cy="-11" r="1" fill="#222"/><circle cx="2.5" cy="-11" r="1" fill="#222"/><path d="M-5 -2 q5 -2 10 0 l-1 10 h-8z" fill="#F4A6B8"/><path d="M-4 8 q-4 12 4 22 q6 -10 2 -22z" fill="#3FC1A5"/><path d="M0 28 l-9 6 q8 2 9 -2 q2 4 10 2z" fill="#2FA58C"/></g>`;
    const rod = '<path d="M150 150 L250 70" stroke="#8A6A3A" stroke-width="3"/><path d="M250 70 Q275 140 290 220" stroke="#E8F0FF" stroke-width="1" fill="none"/>';
    const actSvg = {
      rocket: `<g transform="translate(70 120)"><path d="M0 60 L10 0 L20 60z" fill="#E8ECF2"/><path d="M10 -20 L22 10 H-2z" fill="#E74C3C"/><rect x="2" y="8" width="16" height="44" rx="6" fill="#F2F4F8"/><circle cx="10" cy="24" r="5" fill="#5AB0FF"/><path d="M2 52 l-8 14 h8z M18 52 l8 14 h-8z" fill="#E74C3C"/></g>${astro(200, 168)}${merm(270, 150)}`,
      duo: `${astro(150, 168)}${merm(240, 150)}`,
      cast: `${astro(140, 168)}${rod}${merm(70, 140)}`,
      fish: `${astro(140, 168)}${rod}<g transform="translate(286 200) rotate(-20)"><ellipse cx="0" cy="0" rx="22" ry="11" fill="#E8F4FF"/><path d="M20 0 l14 -10 v20z" fill="#BFDFFF"/><circle cx="-12" cy="-3" r="2.5" fill="#123"/></g><g fill="#FFE27A">${[0, 1, 2, 3, 4].map(i => `<path d="M${270 + i * 12} ${168 - i * 6} l2 -6 2 6 6 2 -6 2 -2 6 -2 -6 -6 -2z"/>`).join('')}</g>${merm(70, 140)}`,
      storm: `<g fill="none" stroke="#E8A070" stroke-width="5" opacity=".75"><path d="M260 190 q-40 -20 0 -40 q40 -20 0 -40 q-30 -16 0 -34"/><path d="M290 190 q-30 -16 0 -32 q30 -16 0 -30"/></g>${astro(120, 168)}${merm(60, 140)}`,
      sunset: `<circle cx="200" cy="170" r="30" fill="#8FD0FF" opacity=".8"/>${astro(110, 168)}${merm(300, 150)}`
    }[act] || '';
    return `<svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="tg-${bg}-${act}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BG[0]}"/><stop offset="1" stop-color="${BG[1]}"/></linearGradient></defs><rect width="400" height="260" fill="url(#tg-${bg}-${act})"/>${stars}${sky}${ground}${actSvg}</svg>`;
  }
  // 물결이 만화 미리보기 그림(작은 칸)
  const miniMerm = '<svg viewBox="0 0 92 92" xmlns="http://www.w3.org/2000/svg"><rect width="92" height="92" fill="#0E3A4E"/><path d="M0 70 q23 -8 46 0 t46 0 v22 H0z" fill="#1F6C8A"/><g transform="translate(46 44) scale(1.5)"><path d="M-9 -12 q0 -16 9 -16 q9 0 9 16 q2 10 -2 16 q-1 -12 -7 -14 q-6 2 -7 14 q-4 -6 -2 -16z" fill="#3FA7B8"/><circle cx="0" cy="-10" r="7" fill="#F2C9A8"/><circle cx="-2.5" cy="-11" r="1" fill="#222"/><circle cx="2.5" cy="-11" r="1" fill="#222"/><path d="M-5 -2 q5 -2 10 0 l-1 10 h-8z" fill="#F4A6B8"/><path d="M-4 8 q-4 12 4 22 q6 -10 2 -22z" fill="#3FC1A5"/></g></svg>';
  const miniTown = '<svg viewBox="0 0 92 92" xmlns="http://www.w3.org/2000/svg"><rect width="92" height="92" fill="#1A2E4A"/><circle cx="70" cy="20" r="9" fill="#FFE6A0"/><path d="M0 62 h92 v30 H0z" fill="#1F6C8A"/><g fill="#E8D3A0"><rect x="10" y="44" width="16" height="18"/><rect x="32" y="38" width="20" height="24"/><rect x="58" y="46" width="14" height="16"/></g><g fill="#B8322A"><path d="M8 44 l10 -9 10 9z"/><path d="M30 38 l12 -11 12 11z"/><path d="M56 46 l9 -8 9 8z"/></g><path d="M20 74 l14 0 -4 6 h-8z" fill="#fff"/></svg>';

  function mount(root, ctx) {
    if (!document.getElementById('fun-css')) { const s = document.createElement('style'); s.id = 'fun-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.classList.add('fun');
    const SD = ctx.sea || { species: [], COMIC: [] }, TD = ctx.today || {}, AK = window.AnglerKit;
    let region = ctx.region || { name: '여수', lat: 34.74, lon: 127.74 }, wx = null, wxFor = '';
    const S = Object.assign({ quiz: {}, vs: {}, toon: 0 }, lsGet('fun.v1', {}));
    const save = () => lsSet('fun.v1', S);
    const today = dayKey(), R = rng(today);
    if (ctx.inPC) root.addEventListener('click', e => { const a = e.target.closest('a[href^="https://"]'); if (a) { e.preventDefault(); try { window.chrome.webview.postMessage({ type: 'open', url: a.href }); } catch (x) {} } });

    root.innerHTML = `<h2 class="fh">🎡 오늘의 바다 놀이터 <small>조황 대신 쓸 수 있는 예보·달력 + 쇼츠·운세·만화</small></h2>
      <div class="fgrid">
        <div class="fc" id="f-tide" style="grid-column:1/-1"></div>
        <div class="fc" id="f-bite"></div><div class="fc" id="f-cal"></div><div class="fc" id="f-rep"></div><div class="fc" id="f-crowd"></div>
        <div class="fc" id="f-short"></div><div class="fc" id="f-luck"></div><div class="fc" id="f-prev"></div><div class="fc" id="f-toon"></div>
      </div>`;
    const $ = id => root.querySelector('#' + id);

    /* ① 어종별 입질 예보 */
    function tideInfo(d) { if (!AK) return { k: .5, name: '' }; const ph = AK.moonPhase(d).phase, k = (1 + Math.cos(4 * Math.PI * ph)) / 2; return { k, name: k > .75 ? '사리 무렵(물살 셈)' : k < .25 ? '조금 무렵(물살 약함)' : '중간 물때', icon: AK.moonPhase(d).icon }; }
    async function loadWx() {
      const key = region.name; if (!ctx.net || wxFor === key) return; wxFor = key; wx = null;
      try {
        const [t, f] = await Promise.all([AK ? AK.seaTemp(region.lat, region.lon).catch(() => null) : null,
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${region.lat}&longitude=${region.lon}&hourly=wind_speed_10m&wind_speed_unit=ms&forecast_days=1&timezone=Asia%2FSeoul`).then(r => r.json()).catch(() => null)]);
        let wave = null; try { const m = await fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${(t && t.lat) || region.lat}&longitude=${(t && t.lon) || region.lon}&hourly=wave_height&forecast_days=1&timezone=Asia%2FSeoul`).then(r => r.json()); wave = Math.max(...(m.hourly.wave_height || []).filter(v => v != null).slice(6, 18)); if (!isFinite(wave)) wave = null; } catch (e) {}
        const ws = f && f.hourly ? f.hourly.wind_speed_10m.slice(6, 18).filter(v => v != null) : [];
        wx = { sst: t ? t.t : null, wind: ws.length ? Math.max(...ws) : null, wave };
      } catch (e) { wx = {}; }
      if (key === region.name) { bite(); short.prep(); }
    }
    function forecast() {
      const now = new Date(), m = now.getMonth() + 1, tide = tideInfo(now), WATER = (AK && AK.WATER) || {}, out = [];
      const season = AK ? AK.seasons(now, 0) : [];
      Object.entries(WATER).forEach(([sp, [a, b]]) => {
        const closed = season.find(x => x.sp === sp && x.kind === 'closed'); const peak = season.find(x => x.sp === sp && x.kind === 'peak');
        let s = peak ? 1 : .45, why = [peak ? '제철' : '제철 아님'];
        if (wx && wx.sst != null) { const t = wx.sst, fit = t >= a && t <= b ? 1 : Math.max(0, 1 - Math.min(Math.abs(t - a), Math.abs(t - b)) / 4); s *= .4 + .6 * fit; why.push(fit >= 1 ? `수온 ${t.toFixed(1)}℃ 알맞음` : `수온 ${t.toFixed(1)}℃ (${a}~${b}℃가 좋음)`); }
        const strong = ['참돔', '감성돔', '농어', '방어'].includes(sp), soft = ['쭈꾸미', '갑오징어', '문어', '낙지', '우럭', '광어'].includes(sp);
        s *= strong ? .75 + .35 * tide.k : soft ? 1.05 - .3 * tide.k : 1; why.push(strong ? (tide.k > .5 ? '물살 센 날 유리' : '물살 약해 조금 불리') : soft ? (tide.k < .5 ? '물살 약해 유리' : '물살 세 조금 불리') : '');
        if (wx && wx.wind != null && wx.wind >= 10) { s *= .6; why.push(`바람 ${wx.wind.toFixed(0)}m/s 강함`); }
        if (wx && wx.wave != null && wx.wave >= 2) { s *= .6; why.push(`파고 ${wx.wave.toFixed(1)}m 높음`); }
        if (closed) { s = 0; why = ['금어기']; }
        out.push({ sp, s: Math.min(1, s), why: why.filter(Boolean), closed: !!closed });
      });
      return { list: out.sort((x, y) => y.s - x.s), tide };
    }
    function stars(s) { const n = Math.max(0, Math.min(5, Math.round(s * 5))); return '★'.repeat(n) + '☆'.repeat(5 - n); }
    function bite() {
      const f = forecast(), top = f.list.slice(0, 7);
      $('f-bite').innerHTML = `<h3>🎯 어종별 입질 예보 <span>📍 ${esc(region.name)} · ${esc(f.tide.icon || '')} ${esc(f.tide.name)}</span></h3>
        ${top.map(x => `<div class="sp"><span>${x.closed ? '🚫' : '🐟'}</span><div><b>${esc(x.sp)}</b><div class="why">${esc(x.why.join(' · '))}</div></div><span class="stars ${x.closed ? 'bad' : ''}">${x.closed ? '금어기' : stars(x.s)}</span></div>`).join('')}
        <div class="small muted">${wx && wx.sst != null ? `오늘 수온 ${wx.sst.toFixed(1)}℃${wx.wind != null ? ` · 낮 최대 바람 ${wx.wind.toFixed(0)}m/s` : ''}${wx.wave != null ? ` · 파고 ${wx.wave.toFixed(1)}m` : ''} (Open-Meteo) · ` : ctx.net ? '수온·바람 받는 중… · ' : '이 화면에선 수온·바람 없이 제철·물때로만 계산 · '}<b>실제 조과가 아닌 계산 예보</b>예요.</div>`;
    }

    /* ② 공개 조황 요약 카드 */
    function reports() {
      const rows = (TD.reports || []).slice().sort((a, b) => String(b.day).localeCompare(String(a.day)));
      const by = {}; rows.forEach(r => (by[r.sp] = by[r.sp] || []).push(r));
      const q = encodeURIComponent(region.name + ' 선상 조황');
      $('f-rep').innerHTML = `<h3>📰 공개 조황 요약 <span>${esc(TD.reportsAt || '')}</span></h3>
        ${rows.length ? Object.entries(by).map(([sp, rs]) => `<div><b>🐟 ${esc(sp)}</b>${rs.slice(0, 3).map(r => `<div class="small">${esc(String(r.day).slice(5))} · ${esc(r.region)} ${esc(r.port || '')} · ${esc(r.count || '')}${r.sinker ? ' · 봉돌 ' + esc(r.sinker) : ''} <a href="${esc(r.url)}" target="_blank" rel="noopener">출처</a></div>`).join('')}</div>`).join('')
          : `<div class="small">이번 주에 찾은 공개 조황 글이 아직 없어요. 매일 아침 공개된 글을 찾아 <b>어디·어종·마릿수·봉돌</b>만 짧게 요약해 출처와 함께 올려요.</div>`}
        <div class="row"><a class="btn" href="https://search.naver.com/search.naver?query=${q}" target="_blank" rel="noopener">🔎 네이버에서 ${esc(region.name)} 조황</a><a class="btn" href="https://search.daum.net/search?q=${q}" target="_blank" rel="noopener">🔎 다음에서</a></div>
        <div class="small muted">글·사진은 복사하지 않고 요약과 링크만 보여 줘요.</div>`;
    }

    /* ③ 내 주변 낚시인 조황 */
    async function crowd() {
      const el = $('f-crowd');
      if (!ctx.crowd) { el.innerHTML = `<h3>📍 낚시인 조황 <span>조황 수첩 사용자</span></h3><div class="small">조황 수첩에 사람들이 남긴 조황(5km 칸·날짜·어종·마릿수)을 어종별로 모아 보여 줘요. 이 화면에서는 볼 수 없어 수첩에서 확인해 주세요.</div><div class="row"><a class="btn pri" href="https://claude.ai/artifact/NrW6xWoMdhdBcQ3Fhgo4Zz" target="_blank" rel="noopener">📒 조황 수첩 열기</a></div>`; return; }
      el.innerHTML = '<h3>📍 낚시인 조황 <span>최근 7일</span></h3><div class="small muted">불러오는 중…</div>';
      try {
        const rows = await ctx.crowd(), since = dayKey(new Date(Date.now() - 6 * 864e5)), recent = rows.filter(r => r.day >= since);
        const by = {}; recent.forEach(r => { const b = by[r.sp] = by[r.sp] || { n: 0, who: new Set(), last: '' }; b.n += +r.n || 0; b.who.add(r.uid); if (r.day > b.last) b.last = r.day; });
        const list = Object.entries(by).filter(([, b]) => b.who.size >= 3).sort((a, b) => b[1].n - a[1].n);   // 조황 수첩 규칙과 같이 서로 다른 3명 이상 기록한 어종만
        el.innerHTML = `<h3>📍 낚시인 조황 <span>최근 7일 · 조황 수첩</span></h3>${list.length ? list.slice(0, 8).map(([sp, b]) => `<div class="sp"><span>🎣</span><div><b>${esc(sp)}</b><div class="why">${b.who.size}명이 기록 · 마지막 ${esc(b.last.slice(5))}</div></div><span><b>${b.n}</b>마리</span></div>`).join('') : '<div class="small">최근 7일 동안 3명 이상 기록한 어종이 아직 없어요. 수첩의 「조황 남기기」로 기록을 남겨 주세요!</div>'}<div class="small muted">사용자가 직접 남긴 기록이에요. 개인이 드러나지 않게 서로 다른 3명 이상 기록한 어종만 보여요.</div>`;
      } catch (e) { el.innerHTML = '<h3>📍 낚시인 조황</h3><div class="small">기록을 불러오지 못했어요.</div>'; }
    }

    /* ④ 제철·금어기 달력 */
    function cal() {
      const m = new Date().getMonth() + 1, list = AK ? AK.seasons(new Date(), 30) : [];
      const SE = (AK && AK.SEASON) || {}, LG = (AK && AK.LEGAL) || [], sps = Object.keys(SE).slice(0, 9);
      const banMonths = sp => { const r = LG.find(x => x.sp === sp && x.closed); if (!r) return []; const [a, b] = r.closed, ma = Math.floor(a / 100) || +String(a).slice(0, -2), mb = Math.floor(b / 100) || +String(b).slice(0, -2), out = []; for (let k = ma; ; k = k % 12 + 1) { out.push(k); if (k === mb || out.length > 12) break; } return out; };
      $('f-cal').innerHTML = `<h3>📅 제철·금어기 달력 <span>${m}월</span></h3>
        <div class="row">${list.slice(0, 8).map(x => `<span class="chip ${x.cls}">${esc(x.text)}</span>`).join('') || '<span class="small muted">자료 없음</span>'}</div>
        <div class="cal" aria-label="어종별 달력"><span></span>${Array.from({ length: 12 }, (_, i) => `<span class="muted" style="text-align:center">${i + 1}</span>`).join('')}
          ${sps.map(sp => { const bans = banMonths(sp); return `<span>${esc(sp)}</span>${Array.from({ length: 12 }, (_, i) => `<i class="${bans.includes(i + 1) ? 'ban' : SE[sp].includes(i + 1) ? 'on' : ''} ${i + 1 === m ? 'now' : ''}" title="${esc(sp)} ${i + 1}월"></i>`).join('')}`; }).join('')}</div>
        <div class="small muted"><span class="ok">■</span> 제철 <span class="bad">■</span> 금어기(대략 달 단위) · 노란 테두리 = 이번 달 · 정확한 날짜는 해양수산부 고시 확인</div>`;
    }

    /* ⑤ 물결이 15초 쇼츠 */
    const short = (() => {
      let cv, g, raf = 0, t0 = 0, playing = false, data = null, rec = null;
      const W = 360, H = 640, DUR = 15;
      function prep() {
        const f = forecast(), td = tideInfo(new Date()), mp = AK ? AK.moonPhase(new Date()) : { icon: '🌙', name: '' };
        data = { region: region.name, date: new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }), moon: mp.icon + ' ' + mp.name, tide: td.name, wx, top: f.list.filter(x => !x.closed).slice(0, 3), safe: pick(rng(today + 'safe'), ['구명조끼는 배에 오를 때부터!', '바람 10m/s가 넘으면 출항을 미뤄요.', '쓰레기는 모두 챙겨 와요.', '작은 물고기는 돌려보내요.', '물때를 꼭 확인해요.']) };
        if (cv && !playing) frame(0);
      }
      function el() {
        $('f-short').innerHTML = `<h3>🎬 물결이 15초 쇼츠 <span>오늘의 바다 브리핑</span></h3><div class="short"><canvas width="${W * 2}" height="${H * 2}" aria-label="물결이 쇼츠 화면"></canvas>
          <div class="row"><button class="btn pri" data-play>▶ 재생</button><button class="btn" data-rec>🎞 영상 파일로 저장</button></div><div class="small muted" data-msg>코드로 그린 애니메이션이에요. 저장하면 15초 영상(webm)이 만들어져 SNS에 올릴 수 있어요.</div></div>`;
        cv = $('f-short').querySelector('canvas'); g = cv.getContext('2d'); g.setTransform(2, 0, 0, 2, 0, 0);
        $('f-short').querySelector('[data-play]').onclick = () => play();
        $('f-short').querySelector('[data-rec]').onclick = record;
        prep(); frame(0);
      }
      function mermaid(x, y, s, tt) {
        g.save(); g.translate(x, y); g.scale(s, s); g.rotate(Math.sin(tt * 2) * .05);
        g.fillStyle = '#3FA7B8'; g.beginPath(); g.moveTo(-26, -20); g.quadraticCurveTo(-30, -70, 0, -72); g.quadraticCurveTo(30, -70, 26, -20); g.quadraticCurveTo(34, 20, 22, 30); g.quadraticCurveTo(14, -10, 0, -14); g.quadraticCurveTo(-14, -10, -22, 30); g.quadraticCurveTo(-34, 20, -26, -20); g.fill();
        g.fillStyle = '#F2C9A8'; g.beginPath(); g.arc(0, -36, 22, 0, 7); g.fill(); g.fillRect(-14, -16, 28, 40);
        g.fillStyle = '#222'; const blink = (tt % 3) < .12 ? .3 : 1; g.beginPath(); g.ellipse(-8, -38, 2.6, 3.2 * blink, 0, 0, 7); g.ellipse(8, -38, 2.6, 3.2 * blink, 0, 0, 7); g.fill();
        g.strokeStyle = '#B5543A'; g.lineWidth = 2; g.beginPath(); g.arc(0, -30, 7, .2, Math.PI - .2); g.stroke();
        g.fillStyle = '#F4A6B8'; g.beginPath(); g.ellipse(-7, 0, 8, 6, 0, 0, 7); g.ellipse(7, 0, 8, 6, 0, 0, 7); g.fill();
        g.fillStyle = '#3FC1A5'; g.beginPath(); g.moveTo(-14, 22); g.quadraticCurveTo(-18, 70, 6 + Math.sin(tt * 3) * 6, 104); g.quadraticCurveTo(22, 70, 14, 22); g.fill();
        g.fillStyle = '#2FA58C'; g.save(); g.translate(6 + Math.sin(tt * 3) * 6, 104); g.rotate(Math.sin(tt * 3) * .3); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-26, 6, -34, 22); g.quadraticCurveTo(-10, 18, 0, 8); g.quadraticCurveTo(10, 18, 34, 22); g.quadraticCurveTo(26, 6, 0, 0); g.fill(); g.restore();
        g.strokeStyle = '#F2C9A8'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(14, -10); g.lineTo(32, -26 + Math.sin(tt * 6) * 8); g.stroke();
        g.restore();
      }
      function text(s, y, size, col, bold) { g.fillStyle = col || '#fff'; g.font = `${bold ? 800 : 600} ${size}px 'Malgun Gothic','Apple SD Gothic Neo',sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; const words = String(s).split(' '); let line = '', lines = []; words.forEach(w => { const tl = line ? line + ' ' + w : w; if (g.measureText(tl).width > W - 40 && line) { lines.push(line); line = w; } else line = tl; }); lines.push(line); lines.forEach((l, i) => { g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 5; g.strokeText(l, W / 2, y + i * size * 1.25); g.fillText(l, W / 2, y + i * size * 1.25); }); }
      function bubble(y, h) { g.fillStyle = 'rgba(255,255,255,.93)'; const x = 22, w = W - 44, r = 18; g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.fill(); }
      function frame(tt) {
        if (!data) return; const D = data;
        const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#0B3B5A'); sky.addColorStop(.55, '#1F6C8A'); sky.addColorStop(1, '#0A2A3A'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
        for (let i = 0; i < 18; i++) { const bx = (i * 53 + tt * 20 * (1 + i % 3)) % W, by = H - ((tt * 40 * (1 + i % 4) + i * 97) % H); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.5; g.beginPath(); g.arc(bx, by, 3 + i % 5, 0, 7); g.stroke(); }
        g.fillStyle = 'rgba(255,255,255,.12)'; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(0, 470 + k * 30); for (let x = 0; x <= W; x += 10) g.lineTo(x, 470 + k * 30 + Math.sin(x / 30 + tt * 2 + k) * 8); g.lineTo(W, H); g.lineTo(0, H); g.fill(); }
        g.fillStyle = '#E8D3A0'; g.beginPath(); g.moveTo(0, 600); g.quadraticCurveTo(W / 2, 580, W, 604); g.lineTo(W, H); g.lineTo(0, H); g.fill();
        const sc = tt < 2.5 ? 0 : tt < 5 ? 1 : tt < 8.5 ? 2 : tt < 12.5 ? 3 : 4, enter = Math.min(1, tt / .8);
        mermaid(W / 2 + (sc === 3 ? -100 : 0), 420 + (1 - enter) * 200 + Math.sin(tt * 2) * 6, sc === 3 ? .9 : 1.25, tt);
        g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, W, 54); text(`🌊 ${D.region} · ${D.date}`, 27, 17, '#fff', true);
        if (sc === 0) { text('안녕! 바다지기 물결이야', 120, 26, '#FFE27A', true); text('오늘의 바다를 15초로 알려 줄게', 170, 18); }
        if (sc === 1) { bubble(90, 150); text(D.moon, 130, 26, '#123', true); text(D.tide || '', 180, 19, '#1F4E79', true); text('달 모양으로 보는 오늘 물때', 214, 14, '#466'); }
        if (sc === 2) { bubble(80, 190); const w = D.wx || {}; text('오늘 바다 날씨', 112, 20, '#123', true); text(w.sst != null ? `수온 ${w.sst.toFixed(1)}℃` : '수온 정보 없음', 150, 22, '#0B6E8A', true); text(w.wind != null ? `바람 ${w.wind.toFixed(0)}m/s${w.wind >= 10 ? ' ⚠' : ''}` : '바람 정보 없음', 186, 19, w.wind >= 10 ? '#B8322A' : '#1F4E79', true); text(w.wave != null ? `파고 ${w.wave.toFixed(1)}m` : '', 220, 18, '#1F4E79', true); }
        if (sc === 3) { text('입질 예보 TOP 3', 100, 24, '#FFE27A', true); D.top.forEach((x, i) => { const yy = 160 + i * 70, k = Math.min(1, Math.max(0, (tt - 8.5 - i * .5) / .5)); g.globalAlpha = k; g.fillStyle = 'rgba(255,255,255,.92)'; g.fillRect(150, yy - 26, 190, 54); g.globalAlpha = 1; if (k > 0) { g.fillStyle = '#123'; g.font = "800 20px 'Malgun Gothic',sans-serif"; g.textAlign = 'left'; g.fillText(`${i + 1}. ${x.sp}`, 162, yy - 4); g.fillStyle = '#D9A21A'; g.font = '16px sans-serif'; g.fillText(stars(x.s), 162, yy + 16); } }); }
        if (sc === 4) { bubble(100, 120); text('물결이의 안전 한마디', 132, 16, '#466', true); text(D.safe, 172, 20, '#B8322A', true); text('출조 관제 우주 프로', 300, 15, '#BFE8FF'); text('※ 예보는 계산값이에요', 326, 12, '#BFE8FF'); }
        g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, H - 4, W, 4); g.fillStyle = '#FFE27A'; g.fillRect(0, H - 4, W * Math.min(1, tt / DUR), 4);
      }
      function play(onEnd) {
        cancelAnimationFrame(raf); playing = true; t0 = performance.now();
        const loop = now => { const tt = (now - t0) / 1000; if (tt >= DUR || !root.isConnected) { playing = false; frame(DUR - .01); if (onEnd) onEnd(); return; } frame(tt); raf = requestAnimationFrame(loop); };
        raf = requestAnimationFrame(loop);
      }
      async function record() {
        const msg = $('f-short').querySelector('[data-msg]');
        if (!cv.captureStream || typeof MediaRecorder === 'undefined') { msg.textContent = '이 기기·브라우저는 영상 저장을 지원하지 않아요(화면 녹화를 이용해 주세요).'; return; }
        if (rec) return;
        const type = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'].find(t => MediaRecorder.isTypeSupported(t)) || '';
        const chunks = []; rec = new MediaRecorder(cv.captureStream(30), type ? { mimeType: type } : undefined);
        rec.ondataavailable = e => e.data.size && chunks.push(e.data);
        rec.onstop = async () => { const blob = new Blob(chunks, { type: rec.mimeType || 'video/webm' }), ext = /mp4/.test(blob.type) ? 'mp4' : 'webm', name = `mulgyeol-shorts-${today}.${ext}`; rec = null;
          try { if (ctx.download) await ctx.download(blob, name); else { const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000); } msg.textContent = `🎞 ${name} 저장을 시작했어요.`; } catch (e) { msg.textContent = '저장이 취소됐어요.'; } };
        msg.textContent = '⏺ 녹화 중… 15초 동안 화면을 그대로 두세요.'; rec.start(); play(() => setTimeout(() => rec && rec.stop(), 200));
      }
      return { el, prep, stop() { cancelAnimationFrame(raf); } };
    })();

    /* ⑥ 운세 · 퀴즈 · 밸런스 */
    function luck() {
      const sps = Object.keys((AK && AK.WATER) || { 우럭: 1, 광어: 1 }), r = rng(today + 'luck');
      const L = { sp: pick(r, sps), col: pick(r, LUCK_COLOR), rig: pick(r, LUCK_RIG), hr: 5 + Math.floor(r() * 13), say: pick(r, LUCK_SAY), score: 60 + Math.floor(r() * 41) };
      const qi = Math.floor(rng(today + 'q')() * QUIZ.length), Q = QUIZ[qi], order = [0, 1, 2].sort(() => rng(today + 'o')() - .5), done = S.quiz[today];
      const vi = Math.floor(rng(today + 'v')() * VS.length), V = VS[vi], my = S.vs[today];
      const r2 = rng(today + 'pct'), pa = 30 + Math.floor(r2() * 41);
      $('f-luck').innerHTML = `<h3>🔮 오늘의 낚시 운세 <span>재미로 보는 운세예요</span></h3>
        <div class="row"><span class="chip">🐟 행운 어종 <b>${esc(L.sp)}</b></span><span class="chip">🎨 ${esc(L.col)} 채비</span><span class="chip">🪝 ${esc(L.rig)}</span><span class="chip">⏰ ${L.hr}시 무렵</span></div>
        <div>⭐ 낚시 운 <b>${L.score}점</b> — ${esc(L.say)}</div>
        <div class="quiz"><b>❓ 오늘의 퀴즈</b><div>${esc(Q[0])}</div>${order.map(i => `<button class="btn opt ${done != null ? (i === Q[2] ? 'right' : i === done ? 'wrong' : '') : ''}" data-q="${i}" ${done != null ? 'disabled' : ''}>${esc(Q[1][i])}</button>`).join('')}
          ${done != null ? `<div class="small ${done === Q[2] ? 'ok' : 'warn'}">${done === Q[2] ? '⭕ 정답!' : '❌ 아쉬워요.'} ${esc(Q[3])}</div>` : ''}</div>
        <div><b>⚖ 오늘의 밸런스 게임</b><div class="vs"><button class="btn" data-v="0" aria-pressed="${my === 0}">${esc(V[0])}</button><b>VS</b><button class="btn" data-v="1" aria-pressed="${my === 1}">${esc(V[1])}</button></div>
          ${my != null ? `<div class="small">내 선택: <b>${esc(V[my])}</b> · 낚시인들의 상상 투표 <span class="muted">(예시 비율)</span></div><div class="bar2"><i style="width:${pa}%"></i></div><div class="small muted">${esc(V[0])} ${pa}% · ${esc(V[1])} ${100 - pa}%</div>` : '<div class="small muted">하나를 골라 보세요!</div>'}</div>`;
      $('f-luck').querySelectorAll('[data-q]').forEach(b => b.onclick = () => { S.quiz[today] = +b.dataset.q; save(); luck(); });
      $('f-luck').querySelectorAll('[data-v]').forEach(b => b.onclick = () => { S.vs[today] = +b.dataset.v; save(); luck(); });
    }

    /* ⑦ 만화 · 연재 미리보기 */
    function prev() {
      const C = SD.COMIC || [], ep = C.length ? C[(Math.floor(Date.now() / 864e5)) % C.length] : null, idx = ep ? C.indexOf(ep) : -1;
      const St = ctx.story || window.Story, chs = St ? St.chaptersFor(2045) : [], sv = lsGet('fish.story', null);
      const ch = chs.length ? chs[Math.min(((sv && sv.story && sv.story.chapter) || 0), chs.length - 1)] : null;
      $('f-prev').innerHTML = `<h3>📚 만화·연재 미리보기 <span>매일 한 편씩</span></h3>
        ${ep ? `<div class="prev">${miniMerm}<div><b>🧜 바다지기 물결이 ${idx + 1}화 「${esc(ep[0])}」</b><div class="small">${esc(ep[1][0][1])}</div><div class="row" style="margin-top:4px">${ctx.open ? '<button class="btn pri" data-open="comic">이어 보기 ▶</button>' : '<span class="small muted">「섬 · 바다 속 → 바다지기 만화」에서 이어 보기</span>'}</div></div></div>` : ''}
        ${ch ? `<div class="prev">${miniTown}<div><b>🏝 바다 마을 연대기 2045 — ${esc(ch.title)}</b><div class="small">${esc(ch.talk[0][0])}: ${esc(ch.talk[0][1].slice(0, 60))}…</div><div class="row" style="margin-top:4px">${ctx.open ? '<button class="btn" data-open="story">게임에서 이어 하기 ▶</button>' : '<span class="small muted">게임 → 바다 마을 연대기에서 이어 하기</span>'}</div></div></div>` : ''}`;
      $('f-prev').querySelectorAll('[data-open]').forEach(b => b.onclick = () => ctx.open(b.dataset.open));
    }

    /* ⑧ 우주 낚시 연재 웹툰 */
    function toon() {
      const weeks = Math.floor((Date.now() - new Date(TOON_START + 'T00:00:00').getTime()) / (7 * 864e5)), open = Math.max(1, Math.min(TOON.length, weeks + 1));
      if (S.toon >= open) S.toon = open - 1;
      const ep = TOON[S.toon];
      $('f-toon').innerHTML = `<h3>🚀 별빛 낚시단 <span>우주 낚시 연재 웹툰 · 매주 월요일</span></h3>
        <div class="row">${TOON.slice(0, open).map((e, i) => `<button class="btn ${i === S.toon ? 'pri' : ''}" data-ep="${i}">${i + 1}화</button>`).join('')}${open < TOON.length ? `<span class="small muted">${open + 1}화는 다음 주 월요일 공개</span>` : ''}</div>
        <b>${esc(ep.t)}</b>
        <div class="toon" tabindex="0" aria-label="웹툰 ${esc(ep.t)}">${ep.p.map(([bg, act, line]) => { const i = line.indexOf(':'); return `<figure>${toonPanel(bg, act)}<figcaption>${i > 0 ? `<b>${esc(line.slice(0, i))}</b>${esc(line.slice(i))}` : esc(line)}</figcaption></figure>`; }).join('')}
          <figure><figcaption style="text-align:center;padding:18px"><b>— ${S.toon + 1}화 끝 —</b><br><span class="small">🚶 「섬 · 바다 속 → 섬길·우주 원정」에서 걸은 만큼 같은 행성 둘레길을 갈 수 있어요.</span></figcaption></figure></div>`;
      $('f-toon').querySelectorAll('[data-ep]').forEach(b => b.onclick = () => { S.toon = +b.dataset.ep; save(); toon(); });
    }

    /* ⓪ 📡 공식 물때·해·달 (공공데이터포털 — tools\bake-public-data.ps1이 매일 만듦) */
    function tide() {
      const el = $('f-tide'), P = window.PUBLIC_DATA;
      if (!P || !P.stations) { el.innerHTML = '<h3>📡 공식 물때·해·달 <span>공공데이터</span></h3><div class="small muted">공식 자료 파일(public-data.js)이 아직 없어요. 매일 아침 작업이 만들어요.</div>'; return; }
      let code = P.regions[region.name];
      const has = c => P.stations[c] && (P.stations[c].series || []).length > 4;
      if (!has(code)) { // 지역 관측소 자료가 없으면 가장 가까운(자료 있는) 관측소
        const ref = P.stations[code] || region; let best = 1e9, alt = null; Object.entries(P.stations).forEach(([c, s]) => { if (!has(c)) return; const d = (s.lat - ref.lat) ** 2 + (s.lon - ref.lon) ** 2; if (d < best) { best = d; alt = c; } }); if (alt) code = alt; }
      const s = P.stations[code] || {}, ser = (s.series || []).filter(x => x[0]), rs = (P.riseset[region.name] || Object.values(P.riseset).find(x => x.code === code) || { days: [] }).days;
      const hm = t => t && t.length >= 4 ? t.slice(0, 2) + ':' + t.slice(2, 4) : '—';
      let svg = '<div class="small muted">예측 조위 자료가 없어요.</div>';
      if (ser.length > 4) {
        const W = 640, H = 150, vals = ser.map(x => x[1]), mn = Math.min(...vals), mx = Math.max(...vals), t0 = new Date(ser[0][0].replace(' ', 'T') + ':00+09:00').getTime(), t1 = new Date(ser[ser.length - 1][0].replace(' ', 'T') + ':00+09:00').getTime();
        const X = t => 30 + (t - t0) / (t1 - t0) * (W - 40), Y = v => 12 + (mx - v) / ((mx - mn) || 1) * (H - 40), tt = x => new Date(x.replace(' ', 'T') + ':00+09:00').getTime();
        const line = ser.map(x => `${X(tt(x[0])).toFixed(1)},${Y(x[1]).toFixed(1)}`).join(' '), now = Date.now();
        const obs = (s.obs && s.obs.list || []).map(x => `<circle cx="${X(tt(x[0])).toFixed(1)}" cy="${Y(x[1]).toFixed(1)}" r="2.6" fill="#FFD27A"/>`).join('');
        const days = [0, 1, 2].map(d => { const t = t0 + d * 864e5; return t <= t1 ? `<line x1="${X(t)}" x2="${X(t)}" y1="8" y2="${H - 24}" stroke="#2A3550"/><text x="${X(t) + 3}" y="${H - 10}" fill="#9AA5B1" font-size="11">${new Date(t).getMonth() + 1}/${new Date(t).getDate()}</text>` : ''; }).join('');
        // 만조·간조 표시(이웃보다 높거나 낮은 점)
        const ext = ser.map((x, i) => i > 0 && i < ser.length - 1 && ((x[1] >= ser[i - 1][1] && x[1] > ser[i + 1][1]) || (x[1] <= ser[i - 1][1] && x[1] < ser[i + 1][1])) ? `<text x="${X(tt(x[0]))}" y="${Y(x[1]) + (x[1] >= ser[i - 1][1] ? -5 : 13)}" fill="#C9D4E0" font-size="10" text-anchor="middle">${x[0].slice(11, 16)}</text>` : '').join('');
        svg = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block" role="img" aria-label="${esc(s.name)} 예측 조위 곡선"><rect x="30" y="8" width="${W - 40}" height="${H - 32}" fill="#0B1A2E" rx="6"/>${days}
          <polyline points="${line}" fill="none" stroke="#5CC0DC" stroke-width="2.2"/>${obs}${ext}${now > t0 && now < t1 ? `<line x1="${X(now)}" x2="${X(now)}" y1="8" y2="${H - 24}" stroke="#FF8A8D" stroke-dasharray="3 3"/><text x="${X(now) + 3}" y="20" fill="#FF8A8D" font-size="10">지금</text>` : ''}
          <text x="2" y="${Y(mx) + 4}" fill="#9AA5B1" font-size="10">${Math.round(mx)}</text><text x="2" y="${Y(mn) + 4}" fill="#9AA5B1" font-size="10">${Math.round(mn)}</text></svg>`;
      }
      // 실측 vs 예측: 같은 시각의 예측 조위(시계열)와 비교 — 실측 자료의 예측 칸은 비어 있을 때가 있음
      let o = null, diff = null; const dv = s.dev;
      if (s.obs && s.obs.list) { for (let i = s.obs.list.length - 1; i >= 0 && !o; i--) { const x = s.obs.list[i], p = ser.find(y => y[0].slice(0, 16) === String(x[0]).slice(0, 16)); if (p && x[1]) { o = { real: x[1], at: String(x[0]) }; diff = Math.round(x[1] - p[1]); } } }
      el.innerHTML = `<h3>📡 공식 물때·해·달 <span>📍 ${esc(region.name)} · ${esc(s.name || '')} 관측소 · ${esc(P.updated)} 받음</span></h3>
        ${svg}<div class="small muted">파란 선: 국립해양조사원 예측 조위(cm, 1시간 간격) · 노란 점: 오늘 실제 관측 · 숫자: 만조·간조 시각</div>
        <div class="row" style="gap:12px">${o ? `<div>🌊 실측 <b>${Math.round(o.real)}cm</b> (${esc(o.at.slice(11, 16))}) · 예보보다 <b style="color:${Math.abs(diff) >= 15 ? '#FFD27A' : '#7AD7A0'}">${diff > 0 ? '+' : ''}${diff}cm</b>${Math.abs(diff) >= 15 ? ' — 바람·기압 영향으로 물이 예보와 달라요' : ''}</div>` : ''}
          ${dv ? `<div>⏱ 최근 고·저조 ${dv.n}회: 예보보다 평균 <b>${Math.abs(dv.tm)}분 ${dv.tm > 0 ? '늦게' : dv.tm < 0 ? '일찍' : '같게'}</b>, 높이 <b>${dv.ht > 0 ? '+' : ''}${dv.ht}cm</b> <span class="small muted">(${esc(String(dv.from).slice(0, 10))}~${esc(String(dv.to).slice(5, 10))} 편차계산표)</span></div>` : ''}</div>
        ${rs.length ? `<table class="small" style="width:100%;border-collapse:collapse"><tr><th style="text-align:left">날짜</th><th>🌅 시민박명</th><th>☀ 일출</th><th>🌇 일몰</th><th>🌆 박명 끝</th><th>🌙 월출</th><th>🌑 월몰</th></tr>${rs.map(d => `<tr><td>${d.d.slice(4, 6)}/${d.d.slice(6)}</td><td>${hm(d.cm)}</td><td>${hm(d.sr)}</td><td>${hm(d.ss)}</td><td>${hm(d.ce)}</td><td>${hm(d.mr)}</td><td>${hm(d.ms)}</td></tr>`).join('')}</table><div class="small muted">시민박명: 해 뜨기 전·진 뒤 불 없이 볼 수 있을 만큼 밝은 때 — 출항·철수 시각 참고</div>` : ''}
        <div class="small muted">출처: 국립해양조사원 조석예보·조위관측소 실측·편차계산표, 한국천문연구원 출몰시각 (공공데이터포털, 공공누리 제1유형). 항해용 아님.</div>`;
    }

    tide(); bite(); cal(); reports(); crowd(); short.el(); luck(); prev(); toon(); loadWx();
    return { setRegion(name, lat, lon) { if (!name || name === region.name) return; region = { name, lat, lon }; tide(); bite(); reports(); short.prep(); loadWx(); } };
  }
  window.FunBoard = { mount, QUIZ, TOON };
})();
