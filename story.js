/* 바다 마을 연대기 2045 — 스토리 모드 (SunsangHelper PC · 휴대폰 웹 · 모바일 앱 공용)
 *
 * 2045년, 수온 상승과 해양 쓰레기로 사람들이 떠난 항구 '새벽항'. 할머니의 낡은 낚싯배를 물려받은 내가
 * 마을 사람들과 함께 식(먹거리)·의(입을 것)·주(살 곳)를 다시 세우고 바다를 되살리는 이야기.
 * 10종 미니게임이 퀘스트가 되고, 게임 결과가 마을 자원으로 쌓입니다(GameHub.apply가 st.story에 반영).
 * 해마다 열두 달 '낚시 달력' 성취가 있고, 6장 엔딩 뒤에는 다음 해(2046년~)로 이어집니다.
 *
 * Story.mount(container, { store, open(gameId), onBonus(coins) → Promise, outfit() })
 */
(function () {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const NPC = {
    순자: { ic: '👵', color: '#E2572B', role: '해녀 할머니' },
    박선장: { ic: '👨‍✈️', color: '#2E5F86', role: '은퇴한 선장' },
    하린: { ic: '👩‍🔬', color: '#1D8A5B', role: '해양연구원' },
    바다: { ic: '🧒', color: '#E3A21A', role: '마을 아이' },
    등대: { ic: '🤖', color: '#6C5FD0', role: '항만 AI' },
    나: { ic: '🎣', color: '#3C7FC0', role: '새 선장' },
  };
  // 건물: 비용(식·의·주) · 효과(바다 건강도·인구)
  const BUILD = {
    dock:     { name: '선착장 수리', ic: '⚓', cost: [0, 0, 20], health: 0, pop: 4, desc: '배를 댈 곳이 생겼습니다' },
    cleaner:  { name: '바다 정화선', ic: '🛥️', cost: [10, 0, 40], health: 15, pop: 2, desc: '떠다니는 쓰레기를 거둡니다' },
    store:    { name: '수산물 창고·식당', ic: '🏪', cost: [60, 0, 30], health: 0, pop: 8, desc: '잡은 고기로 마을 식탁을 채웁니다' },
    workshop: { name: '그물 재활용 공방', ic: '🧵', cost: [20, 40, 20], health: 8, pop: 5, desc: '버려진 그물로 옷과 장비를 짓습니다' },
    farm:     { name: '해초 양식장', ic: '🌿', cost: [30, 10, 50], health: 12, pop: 6, desc: '탄소를 품는 바다 숲' },
    lighthouse: { name: '태양광 등대', ic: '🗼', cost: [20, 20, 80], health: 5, pop: 6, desc: '밤바다를 지키는 깨끗한 불빛' },
    festival: { name: '새벽항 축제 광장', ic: '🏮', cost: [80, 40, 60], health: 5, pop: 15, desc: '사람들이 돌아옵니다' },
    // 2년차(2046~)
    seawall:  { name: '태풍 방파제', ic: '🧱', cost: [20, 20, 120], health: 3, pop: 6, desc: '거센 파도에서 마을을 지킵니다', y2: true },
    hatchery: { name: '어린 물고기 방류장', ic: '🐣', cost: [80, 20, 60], health: 15, pop: 6, desc: '치어를 길러 바다에 돌려보냅니다', y2: true },
    buoy:     { name: '해양 관측 부표', ic: '🛟', cost: [30, 40, 80], health: 8, pop: 4, desc: '수온·염분을 실시간으로 잽니다', y2: true },
    school:   { name: '바다 학교', ic: '🏫', cost: [60, 60, 80], health: 5, pop: 12, desc: '아이들이 바다를 배웁니다', y2: true },
    museum:   { name: '바다 박물관', ic: '🏛️', cost: [100, 80, 120], health: 5, pop: 18, desc: '새벽항의 이야기를 남깁니다', y2: true },
  };
  const g = (st, k) => (st.bests || {})[k] || 0;
  const dexN = st => Object.keys(st.dex || {}).length;
  const built = (st, k) => ((st.story || {}).built || []).includes(k);
  // 장(章): 대화 → 퀘스트(조건 함수) → 보상·해금
  const CHAPTERS = [
    { title: '1장 · 돌아온 항구', season: '가을, 쭈꾸미 철',
      talk: [['순자', '왔구나. 네 할머니 배는 아직 물에 뜬다. 바다는 예전 같지 않지만… 그래도 쭈꾸미는 돌아왔단다.'],
             ['박선장', '배에 오르기 전에 구명조끼부터. 바다는 기다려 주지 않아.'],
             ['바다', '선장님! 저 쭈꾸미 처음 봐요! 많이 잡아 주세요!']],
      quests: [{ t: '「한 수 더!」 한 판 하기', game: 'fish', ok: st => g(st, 'fish') > 0 },
               { t: '「낚시꾼 코디」 60점 이상 (구명조끼 필수)', game: 'dress', ok: st => g(st, 'dress') >= 60 },
               { t: '선착장 수리하기 (마을 탭)', build: 'dock', ok: st => built(st, 'dock') }],
      reward: 30 },
    { title: '2장 · 바다가 아프다', season: '늦가을',
      talk: [['하린', '수온이 10년 사이 2도 올랐어요. 플라스틱 조각이 어군을 흩트리고요.'],
             ['등대', '분석 완료. 금어기와 금지체장을 지키면 3년 안에 어군 회복률 40% 예상.'],
             ['순자', '작은 건 놓아주거라. 그래야 내년에도 바다가 우리를 먹여 살리지.']],
      quests: [{ t: '「어탐 찾기」 100점 이상', game: 'sonar', ok: st => g(st, 'sonar') >= 100 },
               { t: '금어기·금지체장 고기 3마리 방생 (한 수 더!·3D)', game: 'fish', ok: st => ((st.story || {}).released || 0) >= 3 },
               { t: '바다 정화선 띄우기', build: 'cleaner', ok: st => built(st, 'cleaner') }],
      reward: 40 },
    { title: '3장 · 식탁을 채우자 (식)', season: '겨울 준비',
      talk: [['바다', '할머니가 그러는데 겨울엔 생선이 귀하대요…'],
             ['박선장', '남해로 나가 보자. 참돔, 갈치… 바다 3D 탐험에서 어군을 쫓아.'],
             ['순자', '창고를 짓고 식당을 열면 떠난 사람들도 냄새 맡고 돌아올 거다.']],
      quests: [{ t: '「바다 3D 탐험」 150점 이상', game: 'sea3d', ok: st => g(st, 'sea3d') >= 150 },
               { t: '어종 도감 4종 이상', game: 'fish', ok: st => dexN(st) >= 4 },
               { t: '수산물 창고·식당 짓기', build: 'store', ok: st => built(st, 'store') }],
      reward: 50 },
    { title: '4장 · 바다를 입다 (의)', season: '한겨울',
      talk: [['하린', '바다에 버려진 폐그물이 1년에 4만 톤이래요. 이걸 실로 바꿀 수 있어요.'],
             ['등대', '재활용 섬유 방수율 92%. 우의·장갑 제작 가능.'],
             ['나', '채비부터 제대로 알아야 장비도 만들 수 있겠지.']],
      quests: [{ t: '「채비 맞추기」 80점 이상', game: 'rig', ok: st => g(st, 'rig') >= 80 },
               { t: '「낚시꾼 코디」 85점 이상', game: 'dress', ok: st => g(st, 'dress') >= 85 },
               { t: '그물 재활용 공방 짓기', build: 'workshop', ok: st => built(st, 'workshop') }],
      reward: 50 },
    { title: '5장 · 파도 위의 집 (주)', season: '봄',
      talk: [['박선장', '등대가 꺼진 지 10년이야. 밤바다가 무서워 아무도 안 나가.'],
             ['하린', '해초 숲은 바다의 집이에요. 물고기도, 탄소도 깃들죠.'],
             ['바다', '저도 도울래요! 부표 피해서 배 몰기는 자신 있어요!']],
      quests: [{ t: '「캐스팅 과녁」 200점 이상', game: 'cast', ok: st => g(st, 'cast') >= 200 },
               { t: '「항해 피하기」 300점 이상', game: 'dodge', ok: st => g(st, 'dodge') >= 300 },
               { t: '해초 양식장 · 태양광 등대 짓기', build: 'lighthouse', ok: st => built(st, 'farm') && built(st, 'lighthouse') }],
      reward: 60 },
    { title: '6장 · 축제의 밤', season: '여름 밤, 갈치 철',
      talk: [['순자', '불빛이 바다를 비추니 갈치가 은빛으로 춤추는구나.'],
             ['등대', '마을 인구 회복률 300%. 바다 건강도 기준치 도달.'],
             ['바다', '선장님, 내년에도 같이 바다 나가요! 약속!']],
      quests: [{ t: '오늘의 게임 도전 3개 모두 완료 (하루)', ok: st => (st.chStreak || 0) >= 1 },
               { t: '어종 도감 7종 이상', game: 'sea3d', ok: st => dexN(st) >= 7 },
               { t: '새벽항 축제 광장 열기', build: 'festival', ok: st => built(st, 'festival') }],
      reward: 100 },
  ];
  // 2년차(2046): 더 넓은 바다로 — 출석·계절 이벤트·업적·낚시 달력과 이어짐
  const st2 = st => st.story || {};
  const CHAPTERS2 = [
    { title: '1장 · 태풍이 지나간 뒤', season: '늦여름, 태풍 철',
      talk: [['박선장', '어젯밤 태풍에 선착장 말뚝이 셋이나 부러졌어. 이번엔 방파제를 쌓아야 해.'],
             ['등대', '태풍 경로 분석 중… 매일 바다를 살피는 습관이 가장 좋은 대비입니다.'],
             ['바다', '선장님, 저 매일 아침 바다 보러 올게요!']],
      quests: [{ t: '출석 3일 연속', ok: st => ((st.att || {}).streak || 0) >= 3 },
               { t: '「항해 피하기」 400점 이상', game: 'dodge', ok: st => g(st, 'dodge') >= 400 },
               { t: '태풍 방파제 쌓기', build: 'seawall', ok: st => built(st, 'seawall') }],
      reward: 60 },
    { title: '2장 · 어린 물고기 방류', season: '가을',
      talk: [['하린', '작년에 놓아준 치어가 자라서 돌아왔어요! 표지를 단 참돔이 잡혔대요.'],
             ['순자', '바다는 받은 만큼 돌려주는 법이지.'],
             ['등대', '방생 누적 15마리 이상이면 어군 회복 속도 1.4배 예상.']],
      quests: [{ t: '방생 누적 15마리', game: 'fish', ok: st => (st2(st).released || 0) >= 15 },
               { t: '「어종 짝맞추기」 150점 이상', game: 'memory', ok: st => g(st, 'memory') >= 150 },
               { t: '어린 물고기 방류장 짓기', build: 'hatchery', ok: st => built(st, 'hatchery') }],
      reward: 70 },
    { title: '3장 · 심해에서 온 신호', season: '초겨울',
      talk: [['등대', '수심 40m 아래에서 큰 어군 신호. 정체를 알 수 없습니다.'],
             ['박선장', '어탐을 제대로 볼 줄 알아야 해. 숫자를 읽어.'],
             ['하린', '관측 부표를 띄우면 바닷속이 훨씬 잘 보일 거예요.']],
      quests: [{ t: '「어탐 찾기」 160점 이상', game: 'sonar', ok: st => g(st, 'sonar') >= 160 },
               { t: '「바다 3D 탐험」 400점 이상', game: 'sea3d', ok: st => g(st, 'sea3d') >= 400 },
               { t: '해양 관측 부표 띄우기', build: 'buoy', ok: st => built(st, 'buoy') }],
      reward: 80 },
    { title: '4장 · 바다 학교', season: '겨울방학',
      talk: [['바다', '친구들이 낚시를 배우고 싶대요! 선장님이 선생님 해 주세요!'],
             ['순자', '가르치려면 먼저 많이 해 봐야지. 업적이 곧 경험이란다.'],
             ['나', '채비부터 차근차근 알려 줄게.']],
      quests: [{ t: '업적 10개 달성', ok: st => (st.ach || []).length >= 10 },
               { t: '「채비 맞추기」 120점 이상', game: 'rig', ok: st => g(st, 'rig') >= 120 },
               { t: '바다 학교 열기', build: 'school', ok: st => built(st, 'school') }],
      reward: 80 },
    { title: '5장 · 계절 축제 준비', season: '봄',
      talk: [['하린', '이번 계절 축제엔 이웃 마을 사람들도 온대요.'],
             ['박선장', '철 따라 고기를 아는 게 진짜 꾼이지. 달력을 채워 봐.'],
             ['등대', '도감 완성률 100% 도달 시 축제 특별 전시 가능.']],
      quests: [{ t: '계절 이벤트 300점', ok: st => ((st.event || {}).pts || 0) >= 300 },
               { t: '올해 낚시 달력 2개월 달성', ok: st => MONTHS.filter(mo => monthDone(st, new Date().getFullYear(), mo)).length >= 2 },
               { t: '어종 도감 9종 완성', game: 'sea3d', ok: st => dexN(st) >= 9 }],
      reward: 100 },
    { title: '6장 · 바다의 약속', season: '여름, 두 번째 축제',
      talk: [['순자', '네 할머니가 봤으면 얼마나 좋아했을까. 새벽항이 다시 살아났구나.'],
             ['바다', '저도 커서 선장 될래요. 바다 박물관에 제 이름도 남길 거예요!'],
             ['등대', '2년간의 기록을 박물관에 보관합니다. 다음 세대에게.']],
      quests: [{ t: '레벨 10 달성', ok: st => window.GameHub && GameHub.levelOf(st.xp || 0).lv >= 10 },
               { t: '오늘의 도전 3일 연속 완료', ok: st => (st.chStreak || 0) >= 3 },
               { t: '바다 박물관 짓기', build: 'museum', ok: st => built(st, 'museum') }],
      reward: 150 },
  ];
  /** 해마다 번갈아: 2045·2047… 1부, 2046·2048… 2부 */
  const chaptersFor = year => ((year || 2045) - 2045) % 2 === 0 ? CHAPTERS : CHAPTERS2;

  // 연간 낚시 달력: 실제 제철에 맞춘 달별 성취(그 달에 게임에서 잡은 마릿수·점수)
  const MONTHS = [
    { m: 1, ic: '🧰', t: '채비 정비의 달', need: { '@rig': 90 }, d: '채비 맞추기 90점' },
    { m: 2, ic: '🦺', t: '안전 출조의 달', need: { '@dress': 90 }, d: '코디 미션 90점' },
    { m: 3, ic: '🐟', t: '우럭 시즌 개막', need: { '우럭': 5 }, d: '우럭 5마리' },
    { m: 4, ic: '🦑', t: '봄 갑오징어', need: { '갑오징어': 3 }, d: '갑오징어 3마리' },
    { m: 5, ic: '🐡', t: '참돔 타이라바', need: { '참돔': 2 }, d: '참돔 2마리' },
    { m: 6, ic: '🌙', t: '한치 야간 출조', need: { '한치': 5 }, d: '한치 5마리' },
    { m: 7, ic: '🗡️', t: '갈치 시즌', need: { '갈치': 5 }, d: '갈치 5마리' },
    { m: 8, ic: '🐙', t: '문어의 계절', need: { '문어': 2 }, d: '문어 2마리' },
    { m: 9, ic: '🐙', t: '쭈꾸미 개막', need: { '쭈꾸미': 10 }, d: '쭈꾸미 10마리' },
    { m: 10, ic: '🐠', t: '광어 다운샷', need: { '광어': 3 }, d: '광어 3마리' },
    { m: 11, ic: '🦑', t: '무늬오징어 팁런', need: { '무늬오징어': 3 }, d: '무늬오징어 3마리' },
    { m: 12, ic: '🏆', t: '한 해 결산', need: { '@sea3d': 200 }, d: '3D 탐험 200점' },
  ];
  function monthDone(st, year, mo) {
    const rec = ((st.story || {}).month || {})[`${year}-${String(mo.m).padStart(2, '0')}`] || {};
    return Object.entries(mo.need).every(([k, v]) => (rec[k] || 0) >= v);
  }
  function progressOf(rec, need) { const [k, v] = Object.entries(need)[0]; return Math.min(v, rec[k] || 0) + '/' + v; }
  function village(st) {
    const s = st.story || {}, b = s.built || [];
    const health = Math.min(100, 30 + (s.released || 0) * 2 + b.reduce((a, k) => a + (BUILD[k] ? BUILD[k].health : 0), 0) + (s.year ? (s.year - 2045) * 5 : 0));
    const pop = 12 + b.reduce((a, k) => a + (BUILD[k] ? BUILD[k].pop : 0), 0);
    return { health, pop };
  }

  // ── 마을 그림(SVG): 지은 건물이 나타나고, 바다 건강도에 따라 물빛과 쓰레기가 바뀜 ──
  function scene(st) {
    const s = st.story || {}, b = new Set(s.built || []), { health } = village(st);
    const sea = health >= 80 ? ['#3FB7C9', '#0F6A7A'] : health >= 55 ? ['#4C9BA8', '#1E5560'] : ['#6F8A86', '#3A4A44'];
    const trash = Math.max(0, Math.round((80 - health) / 8));
    let svg = `<svg viewBox="0 0 400 220" role="img" aria-label="새벽항 마을" style="width:100%;display:block;border-radius:14px">
      <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD7A8"/><stop offset="1" stop-color="#F8EFE0"/></linearGradient>
      <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sea[0]}"/><stop offset="1" stop-color="${sea[1]}"/></linearGradient></defs>
      <rect width="400" height="220" fill="url(#sky)"/><circle cx="330" cy="46" r="22" fill="#FFB25B" opacity=".9"/>
      <path d="M0 120 Q60 70 120 105 T240 95 T400 110 V140 H0Z" fill="#7FAF7A"/><path d="M0 128 Q90 100 170 122 T400 120 V145 H0Z" fill="#5E8C4A"/>
      <rect y="140" width="400" height="80" fill="url(#sea)"/>
      ${[0, 1, 2].map(i => `<path d="M${-20 + i * 30} ${160 + i * 18} q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2"><animateTransform attributeName="transform" type="translate" values="0 0;40 0;0 0" dur="${6 + i * 2}s" repeatCount="indefinite"/></path>`).join('')}
      <g fill="#E8E1D2" stroke="#8C7A62" stroke-width="1"><rect x="40" y="108" width="26" height="22"/><path d="M38 108 L53 96 L68 108Z" fill="#C8462A"/><rect x="74" y="112" width="22" height="18"/><path d="M72 112 L85 102 L98 112Z" fill="#2E5F86"/></g>`;
    if (b.has('dock')) svg += `<g><rect x="120" y="138" width="70" height="6" fill="#8C5A2B"/>${[124, 140, 156, 172, 186].map(x => `<rect x="${x}" y="138" width="3" height="20" fill="#5A3A1A"/>`).join('')}
      <path d="M150 152 L190 152 L184 162 L156 162Z" fill="#F4F1E8"/><rect x="163" y="144" width="12" height="8" fill="#E8E3D6"/><line x1="182" y1="152" x2="196" y2="132" stroke="#333"/></g>`;
    if (b.has('store')) svg += `<g><rect x="104" y="104" width="40" height="26" fill="#F4E3C3" stroke="#8C7A62"/><path d="M100 104 L124 90 L148 104Z" fill="#E2572B"/><text x="124" y="122" font-size="9" text-anchor="middle" fill="#5A3A1A">식당</text></g>`;
    if (b.has('workshop')) svg += `<g><rect x="200" y="102" width="34" height="24" fill="#DCE8E0" stroke="#5E7A6A"/><path d="M196 102 L217 90 L238 102Z" fill="#1D8A5B"/><text x="217" y="119" font-size="9" text-anchor="middle" fill="#234">공방</text></g>`;
    if (b.has('lighthouse')) svg += `<g><path d="M352 136 L360 76 L372 76 L380 136Z" fill="#fff" stroke="#999"/><rect x="356" y="96" width="20" height="8" fill="#E2572B"/><rect x="358" y="66" width="16" height="12" fill="#FFE27A"/><rect x="354" y="70" width="24" height="3" fill="#3A6F96"/>
      <path d="M366 70 L300 50 L300 90Z" fill="#FFF3A0" opacity=".35"><animate attributeName="opacity" values=".1;.45;.1" dur="3s" repeatCount="indefinite"/></path></g>`;
    if (b.has('farm')) svg += `<g>${[0, 1, 2, 3, 4].map(i => `<path d="M${250 + i * 14} 212 q-4 -16 0 -30 q4 -12 0 -22" fill="none" stroke="#2F8F4E" stroke-width="3"><animate attributeName="d" values="M${250 + i * 14} 212 q-4 -16 0 -30 q4 -12 0 -22;M${250 + i * 14} 212 q4 -16 0 -30 q-4 -12 0 -22;M${250 + i * 14} 212 q-4 -16 0 -30 q4 -12 0 -22" dur="${3 + i % 2}s" repeatCount="indefinite"/></path>`).join('')}</g>`;
    if (b.has('cleaner')) svg += `<g><path d="M40 170 L92 170 L84 182 L48 182Z" fill="#E6F2F4"/><rect x="58" y="160" width="16" height="10" fill="#1D8A5B"/><text x="66" y="194" font-size="8" text-anchor="middle" fill="#fff">정화선</text>
      <animateTransform attributeName="transform" type="translate" values="0 0;24 2;0 0" dur="8s" repeatCount="indefinite"/></g>`;
    if (b.has('festival')) svg += `<g>${[0, 1, 2, 3, 4, 5, 6].map(i => `<circle cx="${30 + i * 22}" cy="${88 + (i % 2) * 4}" r="5" fill="#FF7A1A"><animate attributeName="opacity" values=".5;1;.5" dur="${1.5 + i * .2}s" repeatCount="indefinite"/></circle>`).join('')}<path d="M24 86 Q100 98 176 86" fill="none" stroke="#5A3A1A"/></g>`;
    // 2년차 건물
    if (b.has('seawall')) svg += `<path d="M0 142 L120 142 L120 148 L0 148Z" fill="#9AA5A8"/><path d="M200 142 L400 142 L400 148 L200 148Z" fill="#9AA5A8"/>${[10, 40, 70, 100, 220, 260, 300, 340].map(x => `<rect x="${x}" y="138" width="14" height="6" fill="#B9C2C4"/>`).join('')}`;
    if (b.has('hatchery')) svg += `<g>${[0, 1, 2].map(i => `<rect x="${250 + i * 18}" y="118" width="14" height="10" rx="3" fill="#5FC4D6" stroke="#2E7F8E"/>`).join('')}<text x="275" y="114" font-size="8" text-anchor="middle" fill="#234">방류장</text></g>`;
    if (b.has('buoy')) svg += `<g><circle cx="320" cy="176" r="6" fill="#FFCF3A" stroke="#C99A10"/><line x1="320" y1="170" x2="320" y2="156" stroke="#333"/><circle cx="320" cy="155" r="2" fill="#E2572B"><animate attributeName="opacity" values="1;.2;1" dur="1.4s" repeatCount="indefinite"/></circle>
      <animateTransform attributeName="transform" type="translate" values="0 0;0 3;0 0" dur="3s" repeatCount="indefinite"/></g>`;
    if (b.has('school')) svg += `<g><rect x="150" y="98" width="38" height="26" fill="#FFF4D6" stroke="#8C7A62"/><path d="M146 98 L169 86 L192 98Z" fill="#3C7FC0"/><line x1="188" y1="86" x2="188" y2="72" stroke="#5A3A1A"/><path d="M188 72 L200 76 L188 80Z" fill="#E2572B"/><text x="169" y="115" font-size="8" text-anchor="middle" fill="#234">학교</text></g>`;
    if (b.has('museum')) svg += `<g><rect x="300" y="110" width="40" height="18" fill="#EDE6D6" stroke="#8C7A62"/><path d="M298 110 Q320 88 342 110Z" fill="#C9B48A" stroke="#8C7A62"/>${[304, 314, 324, 334].map(x => `<rect x="${x}" y="112" width="3" height="16" fill="#C9B48A"/>`).join('')}</g>`;
    for (let i = 0; i < trash; i++) { const x = 30 + (i * 53) % 340, y = 168 + (i * 17) % 40; svg += `<g opacity=".8"><rect x="${x}" y="${y}" width="8" height="4" fill="#C9C9C9" transform="rotate(${i * 23} ${x} ${y})"/><circle cx="${x + 12}" cy="${y + 3}" r="2" fill="#E2B04A"/></g>`; }
    if (health >= 70) svg += [0, 1, 2].map(i => `<path d="M${60 + i * 110} 200 q6 -5 12 0 q-6 5 -12 0Z" fill="#FFCF3A"><animateTransform attributeName="transform" type="translate" values="0 0;30 -4;60 0" dur="${7 + i}s" repeatCount="indefinite"/></path>`).join('');
    return svg + '</svg>';
  }

  function mount(container, opts) {
    const store = opts.store, ui = { tab: 'story', talkI: 0 };
    container.innerHTML = `<div data-story style="display:grid;gap:10px;font-family:inherit">
      <div data-hud style="display:grid;gap:6px;padding:10px 12px;border-radius:14px;background:linear-gradient(135deg,#FFF4E2,#FFE3C7);color:#4A2E16"></div>
      <div data-scene></div>
      <div data-tabs style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px"></div>
      <div data-panel></div></div>`;
    const q = s => container.querySelector(s);
    const pill = 'border:0;border-radius:12px;padding:10px;font:700 14px inherit;cursor:pointer;min-height:44px';
    const S = () => { const st = store.get() || {}; st.story = st.story || {}; const s = st.story; s.res = s.res || { food: 0, cloth: 0, mat: 0 }; s.built = s.built || []; s.chapter = s.chapter || 0; s.year = s.year || 2045; return st; };
    const save = st => store.set(st);
    function bar(label, v, max, color) { return `<div style="display:grid;grid-template-columns:62px 1fr 42px;gap:6px;align-items:center;font-size:12.5px"><b>${label}</b><div style="height:8px;border-radius:4px;background:#0001"><i style="display:block;height:100%;width:${Math.min(100, v / max * 100)}%;background:${color};border-radius:4px"></i></div><span style="text-align:right;font-variant-numeric:tabular-nums">${v}</span></div>`; }
    function draw() {
      const st = S(), s = st.story, v = village(st), CH = chaptersFor(s.year), ch = CH[Math.min(s.chapter, CH.length - 1)];
      q('[data-hud]').innerHTML = `<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap">
          <b style="font-size:17px">🏝 새벽항 · ${s.year}년</b><span style="font-size:12.5px">${s.chapter >= CH.length ? '🎉 엔딩 — 다음 해로' : `${CH === CHAPTERS2 ? '2부 · ' : ''}${esc(ch.title)} · ${esc(ch.season)}`}</span></div>
        ${bar('🐟 식', s.res.food, 200, '#E2572B')}${bar('🧵 의', s.res.cloth, 150, '#6C5FD0')}${bar('🪵 주', s.res.mat, 250, '#8C5A2B')}
        ${bar('🌊 바다', v.health, 100, v.health >= 70 ? '#1D8A5B' : v.health >= 50 ? '#E3A21A' : '#9AA5B1')}<div style="font-size:12.5px">👥 마을 사람 ${v.pop}명 · 방생 ${s.released || 0}마리</div>`;
      q('[data-scene]').innerHTML = scene(st);
      q('[data-tabs]').innerHTML = [['story', '📖 이야기'], ['village', '🏘 마을 짓기'], ['year', '📅 낚시 달력']].map(([k, n]) =>
        `<button type="button" data-t="${k}" style="${pill};background:${ui.tab === k ? '#E2572B' : 'var(--chart,#2A3139)'};color:${ui.tab === k ? '#fff' : 'inherit'}">${n}</button>`).join('');
      container.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { ui.tab = b.dataset.t; draw(); });
      ({ story: panelStory, village: panelVillage, year: panelYear })[ui.tab](st);
    }
    function dialog(name, text, last) {
      const n = NPC[name] || NPC.나;
      return `<div style="display:grid;grid-template-columns:56px 1fr;gap:10px;align-items:start;padding:12px;border-radius:16px;background:#FFFBF4;color:#3A2A1A;border:2px solid ${n.color};box-shadow:0 4px 0 ${n.color}33">
        <div style="width:56px;height:56px;border-radius:50%;background:${n.color}22;display:grid;place-items:center;font-size:30px">${n.ic}</div>
        <div><b style="color:${n.color}">${esc(name)}</b> <span style="font-size:11.5px;opacity:.7">${esc(n.role)}</span><div data-type style="margin-top:4px;font-size:15px;line-height:1.55;min-height:46px"></div>
        <div style="text-align:right;margin-top:6px"><button type="button" data-next style="${pill};min-height:36px;padding:4px 14px;background:${n.color};color:#fff">${last ? '퀘스트 보기 ▶' : '다음 ▶'}</button></div></div></div>`;
    }
    let typeT = 0;
    function typewrite(el, text) { clearInterval(typeT); let i = 0; el.textContent = ''; typeT = setInterval(() => { el.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(typeT); }, 22); }
    function panelStory(st) {
      const s = st.story, p = q('[data-panel]'), CH = chaptersFor(s.year);
      if (s.chapter >= CH.length) {
        const v = village(st);
        p.innerHTML = dialog('등대', `${s.year}년 새벽항 복원 완료. 바다 건강도 ${v.health}, 마을 사람 ${v.pop}명. 새해가 밝으면 바다는 다시 새로운 이야기를 들려줄 겁니다.`, true) +
          `<button type="button" data-ny style="${pill};width:100%;margin-top:8px;background:#E2572B;color:#fff">🌅 ${s.year + 1}년으로 (2회차: 건물·자원 유지, 이야기 다시)</button>`;
        typewrite(p.querySelector('[data-type]'), p.querySelector('[data-type]') ? `${s.year}년 새벽항 복원 완료. 바다 건강도 ${v.health}, 마을 사람 ${v.pop}명. 새해가 밝으면 바다는 다시 새로운 이야기를 들려줄 겁니다.` : '');
        p.querySelector('[data-next]').style.display = 'none';
        p.querySelector('[data-ny]').onclick = async () => { const st2 = S(); st2.story.year++; st2.story.chapter = 0; st2.story.talked = false; await save(st2); ui.talkI = 0; draw(); };
        return;
      }
      const ch = CH[s.chapter];
      if (!s.talked) {
        const [who, text] = ch.talk[ui.talkI];
        p.innerHTML = `<div style="font:800 15px inherit;margin:2px 0 8px">${esc(ch.title)}</div>` + dialog(who, text, ui.talkI === ch.talk.length - 1);
        typewrite(p.querySelector('[data-type]'), text);
        p.querySelector('[data-next]').onclick = async () => {
          if (ui.talkI < ch.talk.length - 1) { ui.talkI++; draw(); return; }
          const st2 = S(); st2.story.talked = true; await save(st2); ui.talkI = 0; draw();
        };
        return;
      }
      const okAll = ch.quests.every(x => x.ok(st));
      p.innerHTML = `<div style="display:grid;gap:8px"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:15px">${esc(ch.title)} — 퀘스트</b>
          <button type="button" data-replay style="border:0;background:none;color:inherit;text-decoration:underline;cursor:pointer;font-size:12.5px">대화 다시 보기</button></div>
        ${ch.quests.map((x, i) => { const ok = x.ok(st); return `<div style="display:grid;grid-template-columns:28px 1fr auto;gap:8px;align-items:center;padding:10px;border-radius:12px;background:${ok ? '#1D8A5B22' : 'var(--chart,#2A3139)'};border:1px solid ${ok ? '#1D8A5B' : 'var(--line,#3E4852)'}">
          <span style="font-size:20px">${ok ? '✅' : '⬜'}</span><span>${esc(x.t)}</span>
          ${ok ? '' : x.build ? `<button type="button" data-goto="village" style="${pill};min-height:34px;padding:4px 10px;background:#8C5A2B;color:#fff">짓기</button>`
                  : x.game ? `<button type="button" data-play="${x.game}" style="${pill};min-height:34px;padding:4px 10px;background:#2E5F86;color:#fff">하러 가기</button>` : ''}</div>`; }).join('')}
        <button type="button" data-clear ${okAll ? '' : 'disabled'} style="${pill};background:${okAll ? '#E2572B' : '#5557'};color:#fff">${okAll ? `🎉 장 완료 — 🪙+${ch.reward} 받고 다음 장으로` : '퀘스트를 모두 마치면 다음 장이 열립니다'}</button></div>`;
      p.querySelector('[data-replay]').onclick = async () => { const st2 = S(); st2.story.talked = false; await save(st2); ui.talkI = 0; draw(); };
      p.querySelectorAll('[data-play]').forEach(b => b.onclick = () => opts.open && opts.open(b.dataset.play));
      p.querySelectorAll('[data-goto]').forEach(b => b.onclick = () => { ui.tab = 'village'; draw(); });
      const c = p.querySelector('[data-clear]');
      if (okAll) c.onclick = async () => {
        const st2 = S(); st2.story.chapter++; st2.story.talked = false; await save(st2);
        if (opts.onBonus) await opts.onBonus(ch.reward);
        if (window.GameHub && GameHub.sfx) GameHub.sfx('level');
        draw();
      };
    }
    function panelVillage(st) {
      const s = st.story, p = q('[data-panel]'), r = s.res;
      p.innerHTML = `<div style="font-size:12.5px;opacity:.8;margin-bottom:6px">🐟 식은 잡은 고기(한 수 더!·3D), 🧵 의는 채비·코디·순서 게임, 🪵 주는 나머지 게임 점수로 모입니다.</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px">${Object.entries(BUILD).filter(([k, b]) => !b.y2 || s.year >= 2046 || s.built.includes(k)).map(([k, b]) => {
          const has = s.built.includes(k), can = !has && r.food >= b.cost[0] && r.cloth >= b.cost[1] && r.mat >= b.cost[2];
          return `<div style="padding:10px;border-radius:14px;background:${has ? '#1D8A5B22' : 'var(--surface,#1E242B)'};border:1px solid ${has ? '#1D8A5B' : 'var(--line,#3E4852)'};display:grid;gap:4px">
            <div style="font-size:26px">${b.ic}</div><b>${esc(b.name)}</b><span style="font-size:12px;opacity:.8">${esc(b.desc)}</span>
            <span style="font-size:12px">${has ? '✅ 완공' : `🐟${b.cost[0]} 🧵${b.cost[1]} 🪵${b.cost[2]}`}${b.health ? ` · 🌊+${b.health}` : ''} · 👥+${b.pop}</span>
            ${has ? '' : `<button type="button" data-b="${k}" ${can ? '' : 'disabled'} style="${pill};min-height:36px;background:${can ? '#8C5A2B' : '#5557'};color:#fff">${can ? '🔨 짓기' : '자원 부족'}</button>`}</div>`; }).join('')}</div>`;
      p.querySelectorAll('[data-b]').forEach(btn => btn.onclick = async () => {
        const st2 = S(), b = BUILD[btn.dataset.b], rr = st2.story.res;
        if (rr.food < b.cost[0] || rr.cloth < b.cost[1] || rr.mat < b.cost[2]) return;
        rr.food -= b.cost[0]; rr.cloth -= b.cost[1]; rr.mat -= b.cost[2]; st2.story.built.push(btn.dataset.b);
        await save(st2); if (window.GameHub && GameHub.sfx) GameHub.sfx('win'); draw();
      });
    }
    function panelYear(st) {
      const s = st.story, p = q('[data-panel]'), now = new Date(), y = now.getFullYear();
      const doneN = MONTHS.filter(mo => monthDone(st, y, mo)).length;
      p.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px"><b style="font-size:15px">📅 ${y}년 낚시 달력</b><span style="font-size:12.5px">${doneN}/12 달성 · 10개 이상이면 🏆 올해의 꾼</span></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:6px">${MONTHS.map(mo => {
          const done = monthDone(st, y, mo), cur = mo.m === now.getMonth() + 1, past = mo.m < now.getMonth() + 1;
          const rec = ((s.month || {})[`${y}-${String(mo.m).padStart(2, '0')}`]) || {};
          const claimed = (s.claimed || []).includes(`${y}-${mo.m}`);
          return `<div style="padding:8px;border-radius:12px;text-align:center;background:${done ? '#1D8A5B33' : cur ? '#E2572B22' : 'var(--chart,#2A3139)'};border:2px solid ${cur ? '#E2572B' : done ? '#1D8A5B' : 'transparent'};opacity:${past && !done ? .55 : 1}">
            <div style="font-size:11.5px;font-weight:700">${mo.m}월${cur ? ' · 이번 달' : ''}</div><div style="font-size:24px">${done ? mo.ic : cur ? mo.ic : '🔒'}</div>
            <div style="font-size:12px;font-weight:700">${esc(mo.t)}</div><div style="font-size:11px;opacity:.8">${esc(mo.d)}${cur ? ' · ' + progressOf(rec, mo.need) : ''}</div>
            ${done && !claimed ? `<button type="button" data-claim="${mo.m}" style="${pill};min-height:30px;padding:2px 8px;margin-top:4px;background:#E2572B;color:#fff;font-size:12px">🪙+30 받기</button>` : done ? '<div style="font-size:11px">✅ 받음</div>' : ''}</div>`; }).join('')}</div>
        <div style="font-size:12px;opacity:.75;margin-top:6px">달마다 실제 제철 어종이 목표입니다. 그 달에 「한 수 더!」·「바다 3D 탐험」에서 잡은 마릿수로 셉니다.${doneN >= 10 ? ' 🏆 올해의 꾼 달성!' : ''}</div>`;
      p.querySelectorAll('[data-claim]').forEach(b => b.onclick = async () => {
        const st2 = S(); st2.story.claimed = st2.story.claimed || []; const key = `${y}-${b.dataset.claim}`;
        if (st2.story.claimed.includes(key)) return; st2.story.claimed.push(key); await save(st2);
        if (opts.onBonus) await opts.onBonus(30); draw();
      });
    }
    draw();
    return { refresh: draw, destroy() { clearInterval(typeT); } };
  }

  window.Story = { mount, CHAPTERS, CHAPTERS2, chaptersFor, BUILD, MONTHS, village, monthDone };
})();
