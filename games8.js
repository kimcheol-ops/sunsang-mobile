/* 🧭 아라의 바다 고향 10경 — 지역 특화·지역 홍보 낚시 10편 (2D → 10D 순차 해금, 웹툰·소설 스토리, 휴대폰 기능 활용)
 * 필요: three.js r128, games7.js(Space 엔진), phone.js(PhoneKit, 없어도 동작). 선택: today-data.js(지역 행사)·places-data.js(낚시점·선상) — 있으면 홍보 카드에 실제 자료를 보여 줌
 *
 * 차원 단계(조작 규칙이 하나씩 더해짐) + 휴대폰 기능
 *  2D 보령  측면 시점 · 📷 AR(카메라 화면이 배경)          3D 군산  🌐 파노라마 하늘 · 📳 흔들어 챔질
 *  4D 여수  ⏱ 밤낮(밤 갈치) · 🔊 밤바다 소리              4D 통영  🌊 물때(들물·날물엔 참돔, 정조엔 노래미)
 *  5D 제주  📱 기울여 에깅 · 📳 흔들어 챔질              6D 울진  ⏪ 되감기 · 물때
 *  7D 포항  🌗 평행세계(1930↔2046) · 📷 밝은 곳/어두운 곳 비추면 세계 전환
 *  8D 강릉  🧭 중력 — 휴대폰을 기울인 실제 중력 방향이 바닷속 '아래'
 *  9D 부산  🌀 웜홀 · 🕳 블랙홀(광안리 불꽃이 연 우주 바다)    10D 완도  💗 심상 — 마음이 고요해야 기억이 다가옴 · ✍ 마음 편지(글·🎤 말·📷 글자 읽기)
 *  어디서나: 🧹 주변 정리 인증(📷 사진 → AI 사물 인식), 진동·소리
 * SeaHome.extra(onReward, ctx) → 게임 메뉴 항목 1개. ctx: { store } — 진행은 store.get().seahome = { best:{}, letters:[], clean:{day} }
 */
(function () {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const PK = () => window.PhoneKit;
  const S = () => window.Space;
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const km = (a, b, c, d) => { const r = Math.PI / 180, h = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); };

  const SERIES = '아라의 바다 고향 10경 · 2046';
  const CAST = {
    아라: { ic: '👧', color: '#FF7A59', role: '열 살 낚시 꿈나무' },
    할아버지: { ic: '👴', color: '#4AA8FF', role: '은퇴한 선장 · 해수 할아버지' },
    엄마: { ic: '👩‍🔬', color: '#2EC4B6', role: '해양생물 연구원' },
    등대9: { ic: '🤖', color: '#FFB547', role: '미래에서 온 AI(은하 원정대 새벽호)' },
    멸치: { ic: '🐈', color: '#C9A27A', role: '배 고양이' },
  };
  // 어종: [이름, 색, 힘, 점수, 보호종?, 활동(any|night|flow|slack), 세계층(A|B|*), { size:[최소,최대], unit, min: 금지체장, msg }]
  const EP = [
    { id: 1, dim: '2D', title: '쭈꾸미 첫 손맛', region: '보령', port: '오천항', lat: 36.4385, lon: 126.5195, goal: 120,
      sky: '#8EC9EA', fluid: '#2C6E7E', surface: '#3E8FA3', planet: ['#FFF3B0', 6, [30, 30, -120]], deco: ['lighthouse', 'boats'], flat: true, ar: true, rules: [],
      fish: [['쭈꾸미', '#E3A21A', 1, 15, false, 'any', '*', { size: [8, 22] }], ['갑오징어', '#B05CC4', 2, 30, false, 'any', '*', { size: [15, 35] }], ['상괭이', '#9FB3BF', 2, 0, true, 'any', '*', {}]],
      phone: ['📷 AR — 카메라를 켜면 내 주변이 바다 배경', '📳 입질 진동', '🔊 파도·갈매기 소리'],
      promo: { food: '쭈꾸미 샤브샤브 · 키조개 구이 · 대하', sight: '오천항 충청수영성 · 대천해수욕장 · 보령 스카이바이크', family: '대천해수욕장 갯벌 체험, 충청수영성에서 조선 수군 이야기' },
      intro: '2046년 여름, 열 살 아라는 은퇴한 선장 해수 할아버지와 「바다 고향 10경」 도장 여행을 시작한다. 첫 항구는 쭈꾸미의 고향 보령 오천항.',
      toon: [['할아버지', '아라야, 낚싯대는 이렇게 가볍게 쥐는 거다. 쭈꾸미는 살짝 무게만 실려.', '#7FB8D8', '🎣'], ['아라', '할아버지, 화면 속 바다가 우리 집 거실이랑 겹쳐 보여요!', '#5FA0C8', '📷'],
             ['등대9', '2D 측면 시점과 AR 모드입니다. 카메라를 켜면 지금 있는 곳이 바다가 됩니다.', '#4A88B0', '🤖'], ['엄마', '상괭이는 서해의 작은 고래야. 만나면 꼭 놓아줘. 멸종위기종이거든.', '#3A7098', '🐬']], sfxText: '철썩—' },
    { id: 2, dim: '3D', title: '고군산 다리 아래 우럭', region: '군산', port: '비응항', lat: 35.94, lon: 126.528, goal: 160,
      sky: '#9FC6E0', fluid: '#2B5E6E', surface: '#3C7F90', planet: ['#FFF3B0', 6, [-30, 32, -120]], deco: ['bridge', 'island', 'boats'], pano: true, shake: true, rules: [],
      fish: [['우럭', '#3C7FC0', 2, 30, false, 'any', '*', { size: [15, 50], min: 23 }], ['광어', '#1D8A5B', 3, 45, false, 'any', '*', { size: [18, 70], min: 21 }], ['흰발농게', '#F2E6D0', 1, 0, true, 'any', '*', {}]],
      phone: ['🌐 파노라마 — 휴대폰을 들고 한 바퀴 돌면 내 주변이 3D 하늘이 됨', '📳 흔들어 챔질(충격 센서)', '📏 금지체장(우럭 23cm·광어 21cm) 미만은 자동 방생'],
      promo: { food: '군산 짬뽕 · 꽃게장 · 박대구이', sight: '고군산군도(선유도) · 새만금 방조제 · 근대문화유산 거리', family: '선유도 짚라인과 자전거, 근대역사박물관' },
      intro: '새만금 방조제를 따라 달려 도착한 고군산군도. 다리 아래 여밭에는 우럭이 숨어 있다.',
      toon: [['아라', '와, 바다 위에 다리가 섬과 섬을 이어요!', '#8AB8D6', '🌉'], ['할아버지', '우럭은 바닥 돌 틈에 산다. 23cm가 안 되면 돌려보내는 게 바다 법이야.', '#6A9EC0', '📏'],
             ['등대9', '3D 개방. 휴대폰을 흔들면 챔질이 됩니다. 주변을 한 바퀴 찍으면 하늘이 됩니다.', '#4E84AA', '📳'], ['멸치', '야옹! (흰발농게는 갯벌 보호종이라 먹으면 안 된다옹)', '#3A6E94', '🦀']], sfxText: '휘익— 덜컥!' },
    { id: 3, dim: '4D', title: '밤바다 은빛 갈치', region: '여수', port: '국동항', lat: 34.738, lon: 127.73, goal: 200,
      sky: '#4A6A8A', fluid: '#14304A', surface: '#1E4A6A', planet: ['#FFF7D6', 5, [26, 28, -110]], deco: ['lanterns', 'bridge', 'boats'], ambient: 'night', rules: ['time'],
      fish: [['갈치', '#DDE6EE', 2, 35, false, 'night', '*', { size: [12, 30], unit: 'cm(항문장)', min: 18 }], ['볼락', '#8A6A4A', 1, 20, false, 'night', '*', { size: [10, 28], min: 15 }], ['바다거북', '#5A8A5A', 3, 0, true, 'any', '*', {}]],
      phone: ['⏱ 4D 시간 — 밤이 되면 갈치가 떠오름', '🔊 밤바다 소리 · 풀벌레', '📳 입질·챔질 진동'],
      promo: { food: '갓김치 · 서대회 · 돌게장', sight: '이순신광장 · 진남관 · 돌산대교 야경 · 해상케이블카', family: '진남관·이순신광장에서 거북선 이야기, 밤엔 해양공원 산책' },
      intro: '노래로 유명한 여수 밤바다. 집어등이 켜지면 은빛 갈치가 수면 가까이 올라온다.',
      toon: [['할아버지', '갈치는 해가 지면 위로 올라온다. 밤을 기다리자.', '#3A5A7A', '🌆'], ['아라', '불빛이 바다에 비쳐서 꼭 축제 같아요!', '#2A4A6A', '🏮'],
             ['엄마', '진남관에선 미디어아트도 해. 낚시 끝나면 같이 가자.', '#1E3A5A', '🎆'], ['등대9', '4D 시간 차원. 낮과 밤이 15초마다 바뀝니다.', '#142C4A', '⏱']], sfxText: '반짝… 반짝…' },
    { id: 4, dim: '4D', title: '물때 타는 참돔', region: '통영', port: '도남항', lat: 34.826, lon: 128.434, goal: 220,
      sky: '#9CC8E6', fluid: '#24607A', surface: '#327A96', planet: ['#FFF3B0', 6, [0, 34, -120]], deco: ['island', 'boats'], rules: ['tide'],
      fish: [['참돔', '#E2572B', 3, 55, false, 'flow', '*', { size: [18, 75], min: 24 }], ['쥐노래미', '#7A6A3A', 1, 20, false, 'slack', '*', { size: [12, 40], min: 20 }], ['나팔고둥', '#E8C8A0', 1, 0, true, 'any', '*', {}]],
      phone: ['🌊 4D 물때 — 물살 셀 때는 참돔, 물 멈춘 정조엔 노래미', '📳 진동', '🔊 파도 소리'],
      promo: { food: '충무김밥 · 굴 · 꿀빵', sight: '동피랑 벽화마을 · 한려수도 케이블카 · 도남항', family: '케이블카로 한려수도 내려다보기, 어부장터에서 수산물 장보기' },
      intro: '한려수도의 섬들 사이, 물때를 타고 참돔이 올라온다. 타이라바를 천천히 감아라.',
      toon: [['할아버지', '참돔은 물이 흐를 때 먹이를 쫓는다. 물때를 봐야 해.', '#7AB0D0', '🌊'], ['아라', '정조 때는요?', '#5A98BC', '⏸'],
             ['엄마', '그땐 바닥의 노래미가 문단다. 나팔고둥은 보호종이니 조심!', '#4280A8', '🐚'], ['등대9', '물때 30초 주기 재현. 들물·날물에 집중하십시오.', '#2E6894', '⏱']], sfxText: '쏴아아—' },
    { id: 5, dim: '5D', title: '제주 무늬오징어 에깅', region: '제주시', port: '도두항', lat: 33.509, lon: 126.47, goal: 240,
      sky: '#86C2E8', fluid: '#1C6C8C', surface: '#2A86A6', planet: ['#FFF3B0', 6, [-24, 30, -110]], deco: ['island', 'lighthouse'], shake: true, rules: ['time', 'tilt'],
      fish: [['무늬오징어', '#6C5FD0', 2, 45, false, 'any', '*', { size: [300, 2200], unit: 'g' }], ['한치', '#1AA3A8', 1, 25, false, 'night', '*', { size: [12, 30] }], ['남방큰돌고래', '#7FA3B8', 3, 0, true, 'any', '*', {}]],
      phone: ['📱 5D 기울이기 — 휴대폰을 기울여 에기를 춤추게', '📳 흔들어 챔질', '⏱ 밤엔 한치'],
      promo: { food: '고기국수 · 갈치조림 · 한치물회', sight: '도두봉 · 무지개 해안도로 · 이호테우 말등대', family: '무지개 해안도로 산책, 이호테우 해변 말 모양 등대' },
      intro: '현무암 해안의 도두항. 에기를 툭툭 튕기면 무늬오징어가 따라온다.',
      toon: [['아라', '에기를 휴대폰처럼 흔드는 거예요?', '#7AB6E0', '🦑'], ['할아버지', '기울이고, 멈추고, 기다려. 오징어는 멈출 때 안는다.', '#5A9ECC', '⏸'],
             ['엄마', '남방큰돌고래는 제주 바다의 보물이야. 가까이 와도 놓아줘.', '#4286B8', '🐬'], ['등대9', '5D 개방. 기울이기와 흔들기가 연결되었습니다.', '#2E6EA4', '📱']], sfxText: '툭, 툭— 스윽' },
    { id: 6, dim: '6D', title: '죽변항, 시간을 감는 낚싯줄', region: '울진', port: '죽변항', lat: 37.057, lon: 129.425, goal: 260,
      sky: '#8CB8DA', fluid: '#1E5272', surface: '#2C6C8E', planet: ['#FFF3B0', 6, [20, 32, -110]], deco: ['lighthouse', 'boats'], rules: ['tide', 'tilt', 'rewind'],
      fish: [['방어', '#4A90A8', 3, 60, false, 'flow', '*', { size: [40, 95] }], ['참가자미', '#A8946A', 1, 20, false, 'slack', '*', { size: [15, 40] }], ['암컷 대게', '#E07A4A', 2, 0, true, 'any', '*', {}]],
      phone: ['⏪ 6D 되감기 — 줄이 터져도 3초 전으로(3번)', '🌊 물때 · 📱 기울이기', '📳 진동'],
      promo: { food: '울진 대게 · 물회 · 곰치국', sight: '죽변등대 · 해안스카이레일 · 성류굴', family: '죽변 해안스카이레일, 성류굴 동굴 탐험' },
      intro: '대게의 고향 울진 죽변항. 거센 동해 물살에 방어가 줄을 끊고 달아난다.',
      toon: [['아라', '할아버지, 줄이 또 터졌어요…', '#7AA6CA', '💥'], ['등대9', '6D 개방. 시간을 3초 되감을 수 있습니다. 세 번만.', '#5A8EB6', '⏪'],
             ['할아버지', '암컷 대게는 알을 품어서 잡으면 안 돼. 법으로도 금지야.', '#4276A2', '🦀'], ['엄마', '이번 주말 죽변항 수산물축제도 있대!', '#2E5E8E', '🎪']], sfxText: '팅—! …휘리릭' },
    { id: 7, dim: '7D', title: '구룡포 1930 · 2046', region: '포항', port: '구룡포항', lat: 35.99, lon: 129.556, goal: 280,
      sky: '#9AB4CC', fluid: '#244E68', surface: '#336680', planet: ['#FFF3B0', 6, [-20, 30, -110]], deco: ['lighthouse', 'boats'], lightWorld: true, rules: ['tide', 'tilt', 'rewind', 'parallel'],
      fish: [['방어(2046)', '#4A90A8', 3, 55, false, 'any', 'A', { size: [40, 95] }], ['청어 떼(1930)', '#8AA6BF', 1, 25, false, 'any', 'B', { size: [20, 35] }], ['문어', '#C97A2F', 3, 60, false, 'any', '*', { size: [300, 3000], unit: 'g', min: 600 }], ['귀신고래(1930)', '#6A7A8A', 3, 0, true, 'any', 'B', {}]],
      phone: ['🌗 7D 평행세계 — 📷 카메라를 밝은 곳에 비추면 2046년, 어두운 곳은 1930년 바다', '📏 문어 600g 미만 방생', '⏪ 되감기'],
      promo: { food: '과메기 · 대게 · 모리국수', sight: '구룡포 근대역사문화거리 · 호미곶 상생의 손 · 해맞이광장', family: '호미곶에서 해맞이, 근대역사거리에서 옛 어촌 이야기' },
      intro: '청어가 넘치던 1930년의 구룡포와 2046년의 구룡포. 두 바다가 한 화면에 겹친다.',
      toon: [['할아버지', '내 할아버지 때는 청어가 바다를 덮었단다. 과메기도 원래 청어였지.', '#8AA4BC', '🐟'], ['아라', '그때 바다도 볼 수 있어요?', '#6A8CA8', '🕰'],
             ['등대9', '7D 개방. 카메라를 어두운 곳에 비추면 1930년, 밝은 곳은 2046년입니다.', '#4E7494', '📷'], ['엄마', '귀신고래는 그때 너무 많이 잡혀서 사라졌어. 이번엔 꼭 지켜 주자.', '#3A5C80', '🐋']], sfxText: '지이잉— 시간이 겹친다' },
    { id: 8, dim: '8D', title: '주문진, 중력이 기울어진 바다', region: '강릉', port: '주문진항', lat: 37.893, lon: 128.83, goal: 300,
      sky: '#8AB0D4', fluid: '#1C4A6E', surface: '#2A6288', planet: ['#FFF3B0', 6, [24, 30, -110]], deco: ['lighthouse', 'boats'], realGravity: true, rules: ['tide', 'tilt', 'rewind', 'parallel', 'gravity'],
      fish: [['도루묵', '#C8B88A', 1, 25, false, 'any', '*', { size: [12, 26] }], ['임연수어', '#6A8A6A', 2, 40, false, 'any', '*', { size: [20, 45] }], ['명태', '#B8C0C8', 2, 0, true, 'any', '*', {}]],
      phone: ['🧭 8D 중력 — 휴대폰을 기울인 실제 중력이 바닷속 아래(PC는 ⬇⬅⬆➡ 버튼)', '📱 기울이기 · ⏪ 되감기 · 🌗 세계 전환', '🛡 명태는 연중 포획 금지(사라진 국민 생선)'],
      promo: { food: '도루묵찌개 · 장치찜 · 오징어순대', sight: '주문진 수산시장 · 영진해변 · 소돌 아들바위 · 주문진 등대', family: '소돌 아들바위 공원, 주문진 수산시장 구경' },
      intro: '겨울 동해의 주문진. 등대9가 시험하는 중력 장치 때문에 바닷속 \'아래\'가 휴대폰을 따라 기울어진다.',
      toon: [['등대9', '8D 개방. 휴대폰을 기울이면 바닷속 중력 방향이 바뀝니다.', '#7A9EC4', '🧭'], ['아라', '도루묵이 옆으로 굴러가요! 하하!', '#5A86B0', '🐟'],
             ['할아버지', '명태는 너무 많이 잡아서 이 바다에서 사라졌지. 지금은 잡으면 안 된다.', '#426E9C', '🛡'], ['엄마', '그래서 명태 살리기 연구를 하고 있어. 놓아주면 바다가 고마워할 거야.', '#2E5688', '🔬']], sfxText: '쿠구궁— 기울어진다!' },
    { id: 9, dim: '9D', title: '광안리 불꽃이 연 블랙홀', region: '부산', port: '광안리', lat: 35.1538, lon: 129.1185, goal: 330,
      sky: '#0A0E24', fluid: '#141A3A', surface: '#1A2448', planet: ['#FFB547', 12, [0, 26, -110]], blackhole: true, deco: ['bridge', 'fireworks'], ambient: 'space', wormhole: true, gravity: true, parallel: true,
      rules: ['tide', 'tilt', 'rewind', 'parallel', 'gravity', 'wormhole'],
      fish: [['고등어', '#3A6AA0', 2, 40, false, 'any', '*', { size: [20, 42], min: 21 }], ['별빛 갈치', '#FFE6A8', 2, 60, false, 'any', 'A', { size: [20, 40] }], ['블랙홀 아귀', '#FF8A3D', 3, 90, false, 'any', 'B', { size: [40, 100] }], ['바다거북', '#5A8A5A', 3, 0, true, 'any', '*', {}]],
      phone: ['🌀 9D 웜홀 · 🕳 블랙홀', '🔊 우주 웅웅 소리', '📳 진동 · 🧭 중력 · 🌗 세계'],
      promo: { food: '돼지국밥 · 밀면 · 씨앗호떡 · 고등어', sight: '광안대교 · 광안리 드론 라이트쇼 · 민락 수변공원', family: '광안리 드론 라이트쇼(토요일 밤), 부산불꽃축제' },
      intro: '부산불꽃축제의 밤. 광안대교 위로 터진 불꽃 사이에 웜홀이 열리고, 그 너머로 블랙홀 바다가 보인다.',
      toon: [['아라', '불꽃 사이에… 소용돌이가 있어요!', '#141A3A', '🎆'], ['등대9', '9D 웜홀. 제가 온 미래와 이어졌습니다. 블랙홀 바다로 갑니다.', '#0E1430', '🌀'],
             ['할아버지', '어디로 가든 규칙은 하나야. 필요한 만큼만.', '#080E26', '⚓'], ['아라', '할아버지, 무서워요… 손 잡아 주세요.', '#04081C', '🤝']], sfxText: '퍼엉! 우우웅—' },
    { id: 10, dim: '10D', title: '내 마음의 바다', region: '완도', port: '청산도', lat: 34.18, lon: 126.86, goal: 180,
      sky: '#2A2448', fluid: '#3A6A8A', surface: '#4A7A9A', planet: ['#FFE6F0', 8, [0, 30, -110]], deco: ['aurora', 'island'], ambient: 'heart', rules: ['heart'],
      fish: [['첫 손맛', '#FFD24A', 1, 40, false, 'any', '*', { msg: '처음 낚싯대를 잡던 날, 할아버지 손이 내 손을 감쌌다.' }],
             ['엄마의 김밥', '#7AD7A0', 1, 40, false, 'any', '*', { msg: '배 위에서 먹던 김밥은 바닷바람까지 맛있었다.' }],
             ['아빠의 등', '#7AB8FF', 2, 50, false, 'any', '*', { msg: '멀미하던 날, 아빠 등에 기대 파도를 세었다.' }],
             ['못 한 말', '#FFB3C7', 2, 60, false, 'any', '*', { msg: '"고마워요" — 오늘은 꼭 말해야지.' }],
             ['그리운 사람', '#E6D6FF', 3, 0, true, 'any', '*', {}]],
      phone: ['💗 10D 심상 — 루어를 가만히 두고 천천히 숨 쉬면 마음 게이지가 차오르고 기억이 다가옴', '🔊 심장 박동 소리', '✍ 끝나면 마음 편지(글자·🎤 말·📷 손편지 사진 읽기)'],
      promo: { food: '전복 · 김 · 매생이', sight: '청산도 슬로길 · 장보고 유적 · 완도타워', family: '청산도 슬로길 걷기(유채꽃 길), 장보고 기념관' },
      intro: '여행의 마지막 날, 느리게 걷는 섬 청산도. 할아버지가 말했다. "마지막 낚시는 바다가 아니라 네 마음에서 하는 거다."',
      toon: [['할아버지', '여기선 서두르면 아무것도 안 문다. 숨을 천천히 쉬어 보렴.', '#2A2448', '🌙'], ['아라', '…물고기가 아니라, 기억이 헤엄쳐요.', '#3A2E5A', '💭'],
             ['엄마', '그리운 사람은 놓아줘도 사라지지 않아. 마음에 남아 있으니까.', '#4A386A', '💗'], ['등대9', '10D 심상 차원. 이 바다는 아라의 마음입니다.', '#5A427A', '✨']], sfxText: '두근… 두근…' },
  ];
  const OUTRO = [['아라', '10경 도장을 다 모았어요! 할아버지, 내년에도 같이 가요.', '#2A2448', '📒'], ['할아버지', '그래. 그땐 네가 선장이고, 내가 손님이다.', '#1E3A5A', '⚓'],
                 ['엄마', '우리가 놓아준 고래랑 거북이도 어딘가에서 잘 살고 있을 거야.', '#14305A', '🐋'], ['등대9', '기록 완료. 「바다 고향 10경」은 미래에도 남아 있습니다.', '#0A1E40', '🌏']];

  // ── 지역 홍보 카드: 오늘의 바다 소식(today-data.js)·낚시점(places-data.js)이 있으면 실제 자료 ──
  function promoHtml(ep) {
    const T = window.TODAY_DATA, P = window.PLACES_DATA, now = today();
    const evs = T ? (T.events || []).filter(e => e.end >= now && km(ep.lat, ep.lon, e.lat, e.lon) < 45).slice(0, 3) : [];
    const shops = P ? P.shops.filter(s => s.region === ep.region).length : 0, boats = P ? P.boats.filter(b => b.region === ep.region && !b.sample).length : 0;
    const sc = T && T.scores && T.scores[ep.region];
    return `<div style="padding:12px;border-radius:14px;background:linear-gradient(160deg,#10324A,#0A1A2A);color:#E3F2FF;display:grid;gap:6px;font-size:13px">
      <b style="font-size:15px">📍 ${esc(ep.region)} · ${esc(ep.port)} 여행 카드</b>
      <div>🍽 <b>먹거리</b> ${esc(ep.promo.food)}</div><div>📸 <b>볼거리</b> ${esc(ep.promo.sight)}</div><div>👨‍👩‍👧 <b>가족·교육</b> ${esc(ep.promo.family)}</div>
      ${evs.length ? `<div>🎪 <b>지금 열리는 행사</b> ${evs.map(e => `${esc(e.title)}(${+e.start.slice(5, 7)}/${+e.start.slice(8, 10)}~${+e.end.slice(5, 7)}/${+e.end.slice(8, 10)})`).join(' · ')}</div>` : ''}
      ${shops || boats ? `<div>🏪 <b>실제 출조 준비</b> 낚시점 ${shops}곳 · 낚싯배 업체 ${boats}곳 — 「낚시점·선상」 메뉴에서 승선 위치·주차·화장실 확인</div>` : ''}
      ${sc ? `<div>🌊 <b>출조 지수</b> ${sc[0]}점 ${esc(sc[1])} (${esc(T.scoreDay || '')})</div>` : ''}</div>`;
  }

  // ── 휴대폰 기능 준비(편마다 필요한 것만) ──
  function phonePanel(ep) {
    const k = PK(), can = k ? k.can() : {};
    const rows = [];
    if (ep.ar || ep.pano || ep.lightWorld) rows.push(`<button type="button" data-ph="cam" style="${S().style.SOFT}">📷 카메라 ${k && k.camera.on() ? '켜짐 ✓' : '켜기'}</button>`);
    if (ep.pano) rows.push(`<button type="button" data-ph="pano" style="${S().style.SOFT}">🌐 파노라마 찍기${k && k.pano.canvas ? ' ✓' : ''}</button>`);
    if (ep.shake || ep.realGravity || ep.rules.includes('tilt')) rows.push(`<button type="button" data-ph="sensor" style="${S().style.SOFT}">📳 센서(기울기·흔들기) 켜기</button>`);
    rows.push(`<button type="button" data-ph="sound" style="${S().style.SOFT}">🔊 소리 ${k && k.opt.sound ? '켬' : '끔'}</button><button type="button" data-ph="vib" style="${S().style.SOFT}">📳 진동 ${k && k.opt.vib ? '켬' : '끔'}</button>`);
    return `<div style="padding:10px;border-radius:12px;background:#121A30;color:#E3E8FF;display:grid;gap:8px;font-size:12.5px">
      <b>📱 이 편에서 쓰는 휴대폰 기능</b><div>${ep.phone.map(esc).join('<br>')}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:6px">${rows.join('')}</div>
      <div data-phmsg style="opacity:.8">${k ? `이 기기: ${[can.vibrate && '진동', can.sound && '소리', can.tilt && '기울기', can.motion && '흔들기·중력', can.camera && '카메라', can.voice && '음성 입력'].filter(Boolean).join(' · ') || '기본 기능'}` : ''}</div></div>`;
  }
  function bindPhone(root, ep, rerender) {
    const k = PK(), msg = t => { const m = root.querySelector('[data-phmsg]'); if (m) m.textContent = t; };
    root.querySelectorAll('[data-ph]').forEach(b => b.onclick = async () => {
      if (!k) { msg('PhoneKit을 불러오지 못했습니다'); return; }
      const w = b.dataset.ph;
      try {
        if (w === 'cam') { if (k.camera.on()) k.camera.stop(); else { msg('카메라 권한을 허용해 주세요…'); await k.camera.start(); } rerender(); }
        if (w === 'pano') { if (!k.camera.on()) { msg('카메라 권한을 허용해 주세요…'); await k.camera.start(); }
          const prev = document.createElement('div'); prev.style.cssText = 'position:fixed;inset:auto 8px 8px 8px;z-index:50;background:#000C;color:#fff;border-radius:12px;padding:10px;font:13px sans-serif'; prev.textContent = '휴대폰을 들고 제자리에서 천천히 한 바퀴 돌아 주세요 (0/12)'; document.body.appendChild(prev);
          await k.pano.capture((n, all) => { prev.textContent = `천천히 돌아 주세요 (${n}/${all})`; }); prev.remove(); k.sound.chime(); rerender(); }
        if (w === 'sensor') { const ok = await k.sensors(); msg(ok ? '센서를 켰습니다. 기울이고 흔들어 보세요.' : '센서 권한이 없거나 이 기기에 센서가 없습니다(PC는 버튼·마우스로 합니다).'); }
        if (w === 'sound') { k.setOpt('sound', !k.opt.sound); rerender(); }
        if (w === 'vib') { k.setOpt('vib', !k.opt.vib); if (k.opt.vib) k.buzz('level'); rerender(); }
      } catch (e) { msg((w === 'cam' || w === 'pano' ? '카메라를 쓸 수 없습니다: ' : '') + (e.message || e)); }
    });
  }

  // ── 🧹 주변 정리 인증: 사진 → AI 사물 인식(병·컵·봉지 등) → 하루 한 번 보상 ──
  function cleanupHtml() {
    return `<div style="padding:12px;border-radius:14px;background:#0F2A22;color:#DFF7EA;display:grid;gap:8px;font-size:13px">
      <b style="font-size:15px">🧹 주변 정리 인증 <span style="font-weight:400;font-size:12px">— 바다 가는 길, 내 주변부터</span></b>
      <div>주운 쓰레기(병·컵·봉지 등)를 모아 사진을 찍으면 AI가 무엇이 있는지 찾아 줍니다. 하루 한 번 🪙 30.</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><label style="${S().style.PRIMARY};display:inline-flex;align-items:center;padding:0 14px">📷 사진 찍기·고르기<input type="file" accept="image/*" capture="environment" data-clean hidden></label></div>
      <div data-cleanres style="font-size:12.5px;opacity:.9"></div></div>`;
  }
  function bindCleanup(root, ctx, onReward) {
    const inp = root.querySelector('[data-clean]'); if (!inp) return;
    inp.onchange = async e => {
      const f = e.target.files[0], out = root.querySelector('[data-cleanres]'); if (!f) return;
      const img = new Image(); img.src = URL.createObjectURL(f); await img.decode().catch(() => {});
      out.innerHTML = `<img src="${img.src}" alt="정리 인증 사진" style="max-width:160px;border-radius:8px;display:block;margin-bottom:6px">AI가 사진을 보는 중… (처음 한 번은 모델을 내려받아 조금 걸립니다)`;
      try {
        const found = await PK().ai.detect(img), trash = found.filter(o => o.ko && o.score > .4);
        const st = ctx.store.get() || {}, sh = st.seahome = st.seahome || { best: {} }, already = sh.clean && sh.clean.day === today();
        if (trash.length) {
          if (!already) { sh.clean = { day: today(), items: trash.map(t => t.ko) }; await ctx.store.set(st); if (onReward) onReward({ game: 'seaclean', score: 30 * trash.length, coins: 30 }); PK().sound.chime(); PK().buzz('level'); }
          out.insertAdjacentHTML('beforeend', `<br>✅ 찾은 것: <b>${[...new Set(trash.map(t => t.ko))].join(', ')}</b> (${trash.length}개)${already ? ' · 오늘 보상은 이미 받았어요' : ' · 🪙 +30, 고마워요!'}`);
        } else out.insertAdjacentHTML('beforeend', `<br>쓰레기로 보이는 물건을 찾지 못했어요${found.length ? ` (보인 것: ${found.slice(0, 3).map(o => o.class).join(', ')})` : ''}. 모은 쓰레기가 잘 보이게 다시 찍어 주세요.`);
      } catch (x) { out.insertAdjacentHTML('beforeend', '<br>이 화면에서는 AI 인식을 쓸 수 없습니다(인터넷 연결 또는 화면 제한). 휴대폰 앱이나 PC에서 해 주세요.'); }
    };
  }

  // ── ✍ 마음 편지(10D 뒤): 글자 · 🎤 말로 쓰기 · 📷 손편지 사진 글자 읽기 ──
  function letterHtml(memories) {
    return `<div style="padding:12px;border-radius:14px;background:#2A1E3A;color:#F6E8FF;display:grid;gap:8px">
      <b style="font-size:15px">✍ 마음 편지 — 오늘 떠오른 사람에게</b>
      ${memories && memories.length ? `<div style="font-size:12.5px;opacity:.85">낚아 올린 기억: ${memories.map(esc).join(' / ')}</div>` : ''}
      <textarea data-letter rows="4" maxlength="400" placeholder="예: 할아버지, 낚싯대 잡는 법 알려 줘서 고마워요." style="width:100%;box-sizing:border-box;border-radius:10px;border:1px solid #6A4A8A;background:#1A1226;color:#fff;padding:8px;font:14px inherit"></textarea>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" data-voice style="${S().style.SOFT}">🎤 말로 쓰기</button>
        <label style="${S().style.SOFT};display:inline-flex;align-items:center;padding:0 12px">📷 손편지 사진 읽기<input type="file" accept="image/*" capture="environment" data-ocr hidden></label>
        <button type="button" data-send style="${S().style.PRIMARY}">🍾 편지병 띄우기</button></div>
      <div data-lmsg style="font-size:12.5px;opacity:.85"></div><div data-letters style="display:grid;gap:4px;font-size:12.5px"></div></div>`;
  }
  function bindLetter(root, ctx) {
    const ta = root.querySelector('[data-letter]'); if (!ta) return;
    const msg = t => root.querySelector('[data-lmsg]').textContent = t;
    const list = () => { const L = ((ctx.store.get() || {}).seahome || {}).letters || []; root.querySelector('[data-letters]').innerHTML = L.slice(-5).reverse().map(l => `<div style="background:#1A1226;border-radius:8px;padding:6px 8px">🍾 ${esc(l.t)} <span style="opacity:.6">${esc(l.d)}</span></div>`).join(''); };
    list();
    root.querySelector('[data-voice]').onclick = async () => { try { msg('🎤 말씀하세요…'); const t = await PK().text.listen(); ta.value = (ta.value + ' ' + t).trim(); msg('받아 적었습니다.'); } catch (e) { msg('음성 입력을 쓸 수 없습니다: ' + e.message); } };
    root.querySelector('[data-ocr]').onchange = async e => { const f = e.target.files[0]; if (!f) return; msg('📷 사진 속 글자를 읽는 중… (처음 한 번은 조금 걸립니다)');
      try { const t = await PK().text.read(f); ta.value = (ta.value + ' ' + t).trim().slice(0, 400); msg(t ? '읽은 글자를 넣었습니다. 틀린 곳은 고쳐 주세요.' : '글자를 찾지 못했습니다. 밝은 곳에서 크게 찍어 주세요.'); } catch (x) { msg('이 화면에서는 글자 읽기를 쓸 수 없습니다.'); } };
    root.querySelector('[data-send]').onclick = async () => { const t = ta.value.trim(); if (!t) { msg('편지를 먼저 써 주세요'); return; }
      const st = ctx.store.get() || {}, sh = st.seahome = st.seahome || { best: {} }; sh.letters = (sh.letters || []).concat({ t: t.slice(0, 400), d: today() }).slice(-20); await ctx.store.set(st);
      ta.value = ''; if (PK()) { PK().sound.splash(); PK().buzz('wave'); } msg('🍾 편지병을 바다에 띄웠습니다. (이 기기에만 저장 — 직접 전하면 더 좋아요)'); list(); };
  }

  // ── 캠페인: 지도 → 웹툰/소설 + 여행 카드 + 휴대폰 준비 → 출항 → 결과 ──
  function campaign(container, onReward, ctx) {
    container.innerHTML = '<div data-root style="display:grid;gap:10px"></div>';
    const root = container.querySelector('[data-root]'), st7 = S().style;
    let game = null, mode = 'toon';
    const prog = () => ((ctx.store.get() || {}).seahome) || { best: {} };
    async function saveBest(id, score) { const st = ctx.store.get() || {}; st.seahome = st.seahome || { best: {} }; st.seahome.best = st.seahome.best || {}; st.seahome.best[id] = Math.max(st.seahome.best[id] || 0, score); await ctx.store.set(st); }
    const unlocked = id => id === 1 || ((prog().best || {})[id - 1] || 0) >= EP[id - 2].goal;
    const opt = { series: SERIES, cast: CAST };
    function map() {
      const best = prog().best || {}, cleared = EP.filter(e => (best[e.id] || 0) >= e.goal).length;
      // 한반도 해안 도장 지도(대략 위치)
      const pos = ep => [20 + (ep.lon - 125.8) / (130 - 125.8) * 300, 12 + (38.4 - ep.lat) / (38.4 - 33) * 200];
      root.innerHTML = `<div style="padding:12px;border-radius:16px;background:radial-gradient(circle at 30% 20%,#1E4A6A,#08182A 70%);color:#E3F2FF">
          <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px"><b style="font-size:18px">🧭 아라의 바다 고향 10경</b><span style="font-size:12.5px">도장 ${cleared}/10 · 차원 ${EP[Math.min(9, cleared)].dim}</span></div>
          <div style="font-size:12.5px;opacity:.8;margin:4px 0 8px">실제 우리 바다 10곳을 돌며 도장을 모아요. 진짜 어종·금지체장·보호종, 지역 먹거리·볼거리, 그리고 휴대폰 진동·소리·센서·카메라를 함께 씁니다.</div>
          <svg viewBox="0 0 340 224" style="width:100%;max-width:420px;display:block;margin:0 auto" aria-label="바다 고향 도장 지도">
            <path d="M120 10 L170 8 L200 30 L235 60 L262 70 L270 110 L262 150 L240 170 L215 178 L190 182 L160 176 L135 172 L112 160 L104 132 L98 104 L92 80 L100 52 Z" fill="#2E5A44" opacity=".55"/>
            <ellipse cx="118" cy="214" rx="22" ry="8" fill="#2E5A44" opacity=".55"/>
            ${EP.map(e => { const [x, y] = pos(e), u = unlocked(e.id), c = (best[e.id] || 0) >= e.goal;
              return `<g><circle cx="${x}" cy="${y}" r="${c ? 9 : 7}" fill="${c ? '#FFD24A' : u ? '#FF7A59' : '#445'}" stroke="#fff" stroke-width="${u ? 1.5 : .5}"/><text x="${x}" y="${y + 3.5}" font-size="8" text-anchor="middle" fill="${c ? '#000' : '#fff'}">${e.id}</text>
                <text x="${x + 11}" y="${y + 3}" font-size="8" fill="#E3F2FF">${esc(e.region)}</text></g>`; }).join('')}</svg></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:8px">${EP.map(e => { const u = unlocked(e.id), b = best[e.id] || 0, c = b >= e.goal;
          return `<button type="button" data-ep="${e.id}" ${u ? '' : 'disabled'} style="text-align:left;border:2px solid ${c ? '#FFD24A' : u ? '#FF7A59' : '#333'};border-radius:14px;padding:10px;background:${u ? 'linear-gradient(160deg,#143A52,#0A1A2A)' : '#0A1A2A80'};color:#E3F2FF;font:13px inherit;cursor:${u ? 'pointer' : 'not-allowed'};opacity:${u ? 1 : .5}">
            <span style="font-size:11px;background:#FF7A59;border-radius:6px;padding:1px 6px">${e.dim}</span> <b>${e.id}경 ${esc(e.title)}</b><br><span style="font-size:11.5px;opacity:.85">📍 ${esc(e.region)} ${esc(e.port)}</span><br>
            <span style="font-size:11.5px">${u ? (c ? `⭐ 도장 · 최고 ${b}점` : b ? `최고 ${b} / 목표 ${e.goal}` : `목표 ${e.goal}점`) : '🔒 앞 경을 깨면 열림'}</span></button>`; }).join('')}</div>
        ${cleanupHtml()}
        ${cleared >= 10 ? `<button type="button" data-outro style="${st7.PRIMARY};width:100%">🌏 에필로그 보기</button>` : ''}`;
      root.querySelectorAll('[data-ep]').forEach(b => b.onclick = () => story(EP[+b.dataset.ep - 1]));
      bindCleanup(root, ctx, onReward);
      const o = root.querySelector('[data-outro]'); if (o) o.onclick = () => { root.innerHTML = S().toonHtml({ id: 0, dim: '' }, OUTRO, '에필로그 · 내년 여름', opt) + `<button type="button" data-back style="${st7.SOFT};width:100%">◀ 도장 지도</button>`; root.querySelector('[data-back]').onclick = map; };
    }
    function story(ep) {
      const play3 = ep.rules.length ? ep.rules.map(r => S().RULE_TEXT[r]).join(' · ') : ep.flat ? '2D 측면 시점' : '기본 3D';
      root.innerHTML = `<div style="display:flex;gap:6px"><button type="button" data-m="toon" style="${mode === 'toon' ? st7.PRIMARY : st7.SOFT};flex:1">🖼 웹툰</button><button type="button" data-m="novel" style="${mode === 'novel' ? st7.PRIMARY : st7.SOFT};flex:1">📖 소설</button><button type="button" data-back style="${st7.SOFT}">◀ 지도</button></div>
        <div>${mode === 'toon' ? S().toonHtml(ep, ep.toon, `${ep.id}경 ${ep.title}`, opt) : S().novelHtml(ep, '아라')}</div>
        ${promoHtml(ep)}${phonePanel(ep)}
        <div style="padding:10px;border-radius:12px;background:#143A52;color:#E3F2FF;font-size:13px">🎯 목표 ${ep.goal}점 · 차원 <b>${ep.dim}</b> — ${play3}<br>어종: ${ep.fish.map(f => `${f[4] ? '🛡' : '🐟'}${esc(f[0])}${f[7] && f[7].min ? `(${f[7].min}${f[7].unit === 'g' ? 'g' : 'cm'}↑)` : ''}`).join(' · ')}</div>
        <button type="button" data-go style="${st7.HOT};width:100%;min-height:52px;font-size:16px">⚓ ${ep.id}경 출조</button>`;
      root.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; story(ep); });
      root.querySelector('[data-back]').onclick = map;
      bindPhone(root, ep, () => story(ep));
      root.querySelector('[data-go]').onclick = async () => {
        if (!window.THREE) { root.innerHTML = '<div style="padding:12px">3D 엔진(three.js)을 불러오지 못했습니다.</div>'; return; }
        if (PK() && (ep.shake || ep.realGravity)) PK().sensors().catch(() => {});
        const sh = { body: document.createElement('div') }; root.innerHTML = ''; root.append(sh.body);
        const ep2 = Object.assign({ series: SERIES }, ep);
        game = S().play(sh, ep2, async res => {
          const first = ((prog().best || {})[ep.id] || 0) < ep.goal && res.score >= ep.goal;
          await saveBest(ep.id, res.score);
          const bonus = first ? ep.id * 30 : 0, coins = Math.floor(res.score / 10) + bonus;
          if (PK()) { PK().buzz(res.score >= ep.goal ? 'level' : 'break'); if (res.score >= ep.goal) PK().sound.chime(); }
          root.innerHTML = `<div style="padding:14px;border-radius:16px;background:linear-gradient(160deg,#16405A,#08182A);color:#E3F2FF;display:grid;gap:6px">
              <b style="font-size:20px">${res.score >= ep.goal ? `⭐ ${ep.region} 도장 획득!` : '목표에 조금 모자라요'} — ${res.score}점 / ${ep.goal}</b>
              <div>🎣 ${Object.entries(res.caught).map(([k, v]) => `${esc(k)} ${v}`).join(' · ') || '잡은 물고기 없음'}${res.best ? ` · 🏆 최대어 ${esc(res.best.name)} ${res.best.len}${esc(res.best.unit)}` : ''}</div>
              <div>🛡 방생 ${res.released} · 🧹 쓰레기 ${res.junk}${res.breaks ? ` · 💥 줄 터짐 ${res.breaks}` : ''}</div>
              <div>🪙 +${coins}${first ? ` (첫 도장 보너스 ${bonus})` : ''}${first && ep.id < 10 ? ` · 🔓 ${ep.id + 1}경 「${esc(EP[ep.id].title)}」 · ${EP[ep.id].dim} 열림!` : ''}${first && ep.id === 10 ? ' · 🌏 에필로그 열림!' : ''}</div></div>
            ${ep.rules.includes('heart') ? letterHtml(res.memories) : promoHtml(ep)}
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button type="button" data-re style="${st7.SOFT}">↻ 다시 출조</button><button type="button" data-map style="${st7.PRIMARY}">🗺 도장 지도</button></div>`;
          root.querySelector('[data-re]').onclick = () => story(ep); root.querySelector('[data-map]').onclick = map;
          bindLetter(root, ctx);
          if (onReward) try { onReward({ game: 'sea' + ep.id, score: res.score, coins, released: res.released }); } catch (e) {}
        });
      };
    }
    map();
    return { destroy() { if (game) game.destroy(); if (PK()) PK().sound.stop(); } };
  }

  EP.forEach(e => { if (window.GameHub && GameHub.GNAME) GameHub.GNAME['sea' + e.id] = `바다 고향 ${e.id}경 ${e.region}`; });
  if (window.GameHub && GameHub.GNAME) GameHub.GNAME.seaclean = '주변 정리 인증';
  window.SeaHome = { EP, extra: (onReward, ctx) => [{ id: 'seahome', ic: '🧭', name: '아라의 바다 고향 10경', desc: '[2D→10D 10편] 보령·군산·여수·통영·제주·울진·포항·강릉·부산·완도 — 진짜 어종·지역 홍보·휴대폰 카메라·센서·진동', isNew: true, is3d: true, mount: el => campaign(el, onReward, ctx) }] };
})();
