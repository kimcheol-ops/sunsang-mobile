/* 🚀 은하 낚시 원정대 2145 — 우주·행성·혜성 배경 미래 낚시 10편 (3D → 9D 순차 해금, 웹툰·소설 스토리)
 * SunsangHelper PC · 휴대폰 웹 · 모바일 앱 공용. three.js r128 필요. games6.js(4D·5D 효과) 뒤에 로드하면 진동·기울이기 설정을 함께 씀.
 *
 * 차원 단계(실제 고차원이 아니라 '조작 규칙'이 하나씩 더해지는 게임 설계):
 *  3D 우주 공간 · 4D 시간 흐름(공전 주기·분출) · 5D 기울이기 조작 · 6D 시간 되감기 · 7D 평행세계 전환 · 8D 중력 방향 조작 · 9D 웜홀(공간 접기)
 * Space.extra(onReward, ctx) → 게임 메뉴 항목 1개(원정대). ctx: { store }  — 진행은 store.get().space = { best: { ep: 점수 } }
 */
(function () {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rnd = (a, b) => a + Math.random() * (b - a), ri = n => Math.floor(Math.random() * n), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sfx = k => window.GameHub && GameHub.sfx && GameHub.sfx(k);
  let fxOpt = { fx4: true, fx5: false }; try { Object.assign(fxOpt, JSON.parse(localStorage.getItem('g6.fx') || '{}')); } catch (e) {}
  const vib = p => { if (fxOpt.fx4 && navigator.vibrate) try { navigator.vibrate(p); } catch (e) {} };
  const tilt = { x: 0, y: 0, ok: false }; let tiltOn = false;
  async function enableTilt() {
    if (tiltOn) return; try { if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function' && await DeviceOrientationEvent.requestPermission() !== 'granted') return; } catch (e) { return; }
    window.addEventListener('deviceorientation', e => { if (e.gamma == null) return; tilt.ok = true; tilt.x = clamp(e.gamma / 25, -1, 1); tilt.y = clamp((e.beta - 45) / 25, -1, 1); }); tiltOn = true;
  }
  const BTN = 'min-height:44px;border:0;border-radius:12px;font:700 14px inherit;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none';
  const PRIMARY = BTN + ';background:#7A5CFF;color:#fff', SOFT = BTN + ';background:#2A2F4A;color:#E3E8FF', HOT = BTN + ';background:#FF6B4A;color:#fff';

  // ═════════ 등장인물 ═════════
  const CAST = {
    누리: { ic: '👩‍🚀', color: '#7A5CFF', role: '새벽호 선장 · 바다의 증손녀' },
    하나: { ic: '👩‍🔬', color: '#2EC4B6', role: '우주생물학자 · 하린의 후손' },
    등대9: { ic: '🤖', color: '#FFB547', role: '새벽호 AI' },
    별이: { ic: '🧑‍🚀', color: '#4AA8FF', role: '견습 항해사' },
    검은그물: { ic: '🏴‍☠️', color: '#E5484D', role: '불법 남획선 선장' },
  };
  // ═════════ 10편: 세계 · 외계 어종 · 차원 규칙 · 웹툰 컷 · 소설 ═════════
  // 어종: [이름, 색, 힘(1~3), 점수, 보호종?, 활동(any|night|plume), 세계층(A|B|*)]
  const EP = [
    { id: 1, dim: '3D', title: '고요의 바다로', world: '달 · 크레이터 인공 호수', sky: '#05060F', fluid: '#2B3550', planet: ['#BFC3CC', 14, [-40, 22, -90]], goal: 150,
      fish: [['크레이터 메기', '#9AA5B1', 1, 20], ['월광 해파리', '#CFE3FF', 1, 15, true], ['레골리스 은어', '#E6E8EE', 2, 35]],
      rules: [], intro: '지구의 바다가 되살아난 지 100년. 바다의 증손녀 누리는 우주 낚싯배 새벽호의 선장이 됐다.',
      toon: [['누리', '할머니의 할머니가 살린 바다… 이제 우리 차례야.', '#0B1030', '🌍'], ['등대9', '첫 목적지, 달 뒷면 크레이터 호수. 중력 1/6, 낚싯줄이 천천히 가라앉습니다.', '#1A1F3A', '🌕'],
             ['별이', '선장님! 호수 위에 빛나는 해파리가 떠 있어요!', '#232946', '🪼'], ['하나', '저건 보호종이야. 잡으면 꼭 놓아줘. 우주 바다도 지구 바다처럼 지켜야 해.', '#2A2F55', '🛡️']],
      sfxText: '슈우우웅—' },
    { id: 2, dim: '3D', title: '얼음 밑의 등불', world: '유로파 · 얼음 지각 아래 바다', sky: '#020814', fluid: '#0D3C5C', planet: ['#D9C7A3', 18, [36, 18, -100]], goal: 200,
      fish: [['얼음 등불고기', '#7FF7FF', 1, 25], ['유로파 장어', '#3FA7D6', 2, 40], ['크릴 성단', '#FFB3C7', 1, 10, true]],
      rules: [], intro: '목성의 달 유로파. 두꺼운 얼음 아래에 지구보다 많은 물이 출렁인다.',
      toon: [['등대9', '얼음 두께 18km. 시추 완료. 아래는 완전한 어둠입니다.', '#05101F', '🧊'], ['누리', '…저 빛, 보여?', '#071A30', '✨'],
             ['하나', '스스로 빛을 내는 물고기야! 생명이 있어!', '#0A2440', '🐟'], ['별이', '우주 쓰레기도 떠 있네요. 위성 파편… 주워 가요!', '#0E2D4D', '🛰️']],
      sfxText: '쩌저적—' },
    { id: 3, dim: '4D', title: '하늘로 솟는 바다', world: '엔켈라두스 · 남극 간헐천', sky: '#060A18', fluid: '#9FE4F2', planet: ['#E3D4A8', 26, [-30, 20, -110], true], goal: 220,
      fish: [['간헐천 날치', '#BDF2FF', 1, 25, false, 'plume'], ['분수 고래(새끼)', '#5F8FD9', 3, 90, true, 'plume'], ['얼음 크라켄', '#8C7BFF', 2, 45]],
      rules: ['time'], intro: '토성의 달 엔켈라두스는 얼음 틈으로 바닷물을 우주로 뿜는다.',
      toon: [['등대9', '4D 시간 차원 개방. 간헐천은 12초마다 분출합니다.', '#0A1024', '⏱️'], ['누리', '분출하는 순간에만 날치가 올라온다는 거지?', '#101836', '⛲'],
             ['별이', '타이밍이 전부네요!', '#16204A', '💦'], ['하나', '새끼 고래가 섞여 있으면 꼭 놓아줘. 엄마가 기다려.', '#1C285A', '🐋']],
      sfxText: '푸화아악—!' },
    { id: 4, dim: '4D', title: '메탄비 내리는 호수', world: '타이탄 · 크라켄 메탄 바다', sky: '#2A1606', fluid: '#5A3A12', planet: ['#E8B04A', 30, [40, 26, -120], true], goal: 240,
      fish: [['메탄 가오리', '#C98A3A', 2, 40, false, 'night'], ['안개 오징어', '#FFB45A', 1, 25, false, 'any'], ['탄화수소 거북', '#7A5A2A', 3, 80, true, 'night']],
      rules: ['time'], intro: '두꺼운 주황 안개, 영하 180도. 타이탄의 호수는 물 대신 메탄이 흐른다.',
      toon: [['하나', '타이탄의 하루는 지구 16일. 4D로 압축해서 보여 줄게.', '#2A1606', '🌗'], ['누리', '가오리는 밤에만 움직인다고?', '#3A200A', '🌙'],
             ['검은그물', '흐흐… 이 호수는 우리가 싹쓸이한다!', '#4A1A0A', '🏴‍☠️'], ['누리', '남획은 안 돼. 우리가 먼저 지킨다!', '#5A2A0A', '⚓']],
      sfxText: '추적… 추적…' },
    { id: 5, dim: '5D', title: '고리 사이의 은빛', world: '토성 · 고리 얼음 조각 지대', sky: '#04040C', fluid: null, planet: ['#E6C98A', 40, [0, -6, -140], true], goal: 260,
      fish: [['고리 은갈치', '#E8EEF8', 2, 40], ['얼음 해마', '#A8E6FF', 1, 25, true], ['고리 상어', '#8A97B5', 3, 70]],
      rules: ['time', 'tilt'], intro: '토성의 고리는 수십억 개 얼음 조각의 강. 그 사이로 은빛 물고기가 흐른다.',
      toon: [['등대9', '5D 조작 개방: 기기를 기울여 루어를 몰 수 있습니다(손가락도 가능).', '#06061A', '📱'], ['별이', '얼음 조각에 부딪히면 줄이 상해요!', '#0A0A26', '🧊'],
             ['누리', '흐름을 읽어. 고리는 강이야.', '#0E0E32', '🪐'], ['하나', '얼음 해마는 고리에서만 사는 보호종이야.', '#12123E', '🌊']],
      sfxText: '사아아—' },
    { id: 6, dim: '6D', title: '시간을 거슬러', world: '혜성 C/2145 · 이온 꼬리', sky: '#030312', fluid: null, planet: ['#9FE7FF', 6, [-10, 4, -60]], goal: 280, comet: true,
      fish: [['꼬리 혜성어', '#7FE3FF', 2, 45], ['먼지 플랑크톤 떼', '#C9F2FF', 1, 15, true], ['시간 잉어', '#FFD84A', 3, 90]],
      rules: ['time', 'tilt', 'rewind'], intro: '76년에 한 번 지나가는 혜성. 그 꼬리에는 시간을 먹고 사는 잉어가 산다.',
      toon: [['하나', '혜성 꼬리는 시간이 휘어 있어. 6D — 되감기가 가능해!', '#04041A', '⏪'], ['누리', '줄이 터져도 3초 전으로 돌릴 수 있다고?', '#080828', '🎣'],
             ['등대9', '되감기는 3번. 아껴 쓰십시오.', '#0C0C36', '🔋'], ['별이', '시간 잉어… 황금빛이에요!', '#101044', '✨']],
      sfxText: '휘리릭— 똑, 딱.' },
    { id: 7, dim: '7D', title: '거울 속의 바다', world: '쌍둥이 행성 · 평행세계', sky: '#08040E', fluid: '#2A1F4A', planet: ['#B58CFF', 20, [-36, 20, -100]], goal: 300, parallel: true,
      fish: [['거울 도미', '#FF8AD8', 2, 45, false, 'any', 'A'], ['그림자 문어', '#5A3FA0', 3, 75, false, 'any', 'B'], ['쌍둥이 해파리', '#E0CCFF', 1, 20, true, 'any', '*']],
      rules: ['time', 'tilt', 'rewind', 'parallel'], intro: '똑같이 생긴 두 행성은 사실 하나의 바다를 나눠 가진 평행세계다.',
      toon: [['등대9', '7D 개방: 🌗 버튼으로 평행세계를 오갈 수 있습니다.', '#0A0414', '🌗'], ['별이', 'A 세계엔 도미, B 세계엔 문어가 있어요!', '#140A24', '🐙'],
             ['검은그물', '두 세계 다 털어 주마!', '#200A20', '🏴‍☠️'], ['누리', '세계를 넘나들어도 규칙은 하나. 필요한 만큼만.', '#2A1430', '⚖️']],
      sfxText: '지이잉— 번쩍!' },
    { id: 8, dim: '8D', title: '중력이 뒤집힌 날', world: '그래비아 · 중력 역전 행성', sky: '#0A0A04', fluid: '#3A4A1A', planet: ['#C8E66A', 22, [34, -18, -100]], goal: 320, gravity: true,
      fish: [['벽 넙치', '#9ABF4A', 2, 45], ['반중력 복어', '#FFE45A', 1, 30, true], ['천장 아귀', '#5A6A2A', 3, 80]],
      rules: ['time', 'tilt', 'rewind', 'parallel', 'gravity'], intro: '그래비아의 바다는 중력이 수시로 방향을 바꾼다. 물고기는 벽에, 천장에 붙어 산다.',
      toon: [['하나', '8D: 중력 방향을 직접 바꿀 수 있어! ⬇⬅⬆➡', '#14140A', '🧭'], ['누리', '루어가 "아래"로 떨어지는 방향을 내가 정한다…', '#20200C', '🎣'],
             ['별이', '천장에 아귀가 매달려 있어요!', '#2A2A10', '🐡'], ['등대9', '반중력 복어는 보호종입니다. 놓아주십시오.', '#343414', '🛡️']],
      sfxText: '쿠구구궁— 뒤집혀!' },
    { id: 9, dim: '9D', title: '접힌 공간의 성운', world: '오리온 웜홀 성운', sky: '#100418', fluid: null, planet: ['#FF7AD9', 10, [0, 24, -120]], goal: 340, wormhole: true, nebula: true,
      fish: [['차원 뱀장어', '#B07AFF', 2, 50], ['성운 해파리', '#FF9AE8', 1, 25, true], ['웜홀 청새치', '#4AE0FF', 3, 95]],
      rules: ['time', 'tilt', 'rewind', 'parallel', 'gravity', 'wormhole'], intro: '공간이 접혀 두 지점이 붙어 있는 성운. 루어가 웜홀에 들어가면 반대편에서 나온다.',
      toon: [['등대9', '9D 개방: 🌀 웜홀이 공간을 잇습니다.', '#14061E', '🌀'], ['별이', '이쪽으로 던지면… 저쪽에서 나와요!', '#1E0A2A', '✨'],
             ['검은그물', '…너희, 왜 잡은 걸 다시 놓아주는 거지?', '#280A28', '🏴‍☠️'], ['누리', '바다는 빌려 쓰는 거니까. 다음 사람도 낚을 수 있게.', '#320E36', '🌱']],
      sfxText: '우우웅— 접힌다…' },
    { id: 10, dim: '9D', title: '마지막 바다', world: '블랙홀 · 사건의 지평선', sky: '#000000', fluid: null, planet: ['#FFB547', 16, [0, 4, -90]], goal: 380, blackhole: true, wormhole: true, parallel: true, gravity: true,
      fish: [['빛 삼키는 아귀', '#FF8A3D', 2, 55], ['지평선 해마', '#FFE0A8', 1, 30, true], ['리바이어던(전설)', '#FFD24A', 3, 200, false, 'any', '*']],
      rules: ['time', 'tilt', 'rewind', 'parallel', 'gravity', 'wormhole'], intro: '모든 차원이 하나로 모이는 곳. 전설의 리바이어던이 빛의 고리를 맴돈다.',
      toon: [['검은그물', '…내 배가 블랙홀에 끌려간다! 도와줘!', '#000000', '🆘'], ['누리', '그물 대신 손을 잡아. 다 같이 돌아가자.', '#0A0600', '🤝'],
             ['하나', '리바이어던이다… 전설은 진짜였어.', '#140C00', '🐉'], ['등대9', '전 차원 개방. 선장님, 마지막 바다입니다.', '#1E1400', '🌌']],
      sfxText: '………쿵.' },
  ];
  const OUTRO = [['누리', '리바이어던을 놓아주자, 블랙홀의 빛 고리가 잠시 바다처럼 출렁였다.', '#1E1400', '🌊'], ['검은그물', '…나도 이제 그물을 접겠다. 필요한 만큼만.', '#141020', '🕊️'],
                 ['하나', '우주 어디에도 바다가 있어. 그리고 어디서나 규칙은 같아.', '#0A1430', '🌍'], ['별이', '선장님, 다음 항해는요?', '#060A20', '🚀']];
  const EP_RULE_TEXT = { time: '⏱ 4D 시간', tilt: '📱 5D 기울이기', rewind: '⏪ 6D 되감기', parallel: '🌗 7D 평행세계', gravity: '🧭 8D 중력', wormhole: '🌀 9D 웜홀' };

  // ═════════ 웹툰(세로 컷) · 소설 ═════════
  function toonHtml(ep, panels, title) {
    return `<div style="display:grid;gap:10px;padding:10px;border-radius:16px;background:#0B0B18">
      <div style="text-align:center;color:#E3E8FF"><div style="font-size:12px;opacity:.7">은하 낚시 원정대 2145 · ${ep.id ? ep.id + '화 · ' + ep.dim : '에필로그'}</div><b style="font-size:19px">${esc(title)}</b></div>
      ${panels.map(([who, text, bg, art], i) => { const c = CAST[who] || CAST.누리, left = i % 2 === 0;
        return `<div style="position:relative;min-height:170px;border:3px solid #111;border-radius:6px;overflow:hidden;background:radial-gradient(circle at ${left ? '75%' : '25%'} 30%,#ffffff18,transparent 40%),linear-gradient(160deg,${bg},#000);box-shadow:4px 4px 0 #000">
          ${Array.from({ length: 18 }, (_, k) => `<i style="position:absolute;left:${(k * 37 + i * 13) % 100}%;top:${(k * 53 + i * 29) % 100}%;width:2px;height:2px;border-radius:50%;background:#fff;opacity:${.3 + (k % 3) * .2}"></i>`).join('')}
          <div style="position:absolute;${left ? 'right' : 'left'}:10px;bottom:6px;font-size:64px;filter:drop-shadow(0 4px 6px #0008)">${art}</div>
          <div style="position:absolute;${left ? 'left' : 'right'}:8px;bottom:8px;font-size:42px">${c.ic}</div>
          <div style="position:absolute;${left ? 'left' : 'right'}:58px;top:12px;max-width:68%;background:#fff;color:#111;border-radius:16px;padding:8px 11px;font:600 13.5px/1.45 inherit;border:2px solid #111;box-shadow:2px 2px 0 #111">
            <b style="color:${c.color}">${esc(who)}</b><br>${esc(text)}</div>
          ${i === 1 && ep.sfxText ? `<div style="position:absolute;${left ? 'right' : 'left'}:12px;top:${left ? 10 : 100}px;font:900 22px inherit;color:#FFE45A;-webkit-text-stroke:1px #000;transform:rotate(-8deg)">${esc(ep.sfxText)}</div>` : ''}
        </div>`; }).join('')}</div>`;
  }
  function novelHtml(ep) {
    const lines = ep.toon.map(([who, text]) => `<p style="margin:0 0 8px">${who === '누리' ? '' : esc(who) + '이(가) 말했다. '}“${esc(text)}”</p>`).join('');
    return `<div style="padding:14px;border-radius:14px;background:#14142A;color:#E3E8FF;font:15px/1.8 'Noto Serif KR','Batang',serif"><b style="font-size:17px">${ep.id}화. ${esc(ep.title)}</b><p style="margin:8px 0">${esc(ep.intro)}</p>${lines}
      <p style="margin:0;opacity:.8">— 무대: ${esc(ep.world)} · 열린 차원: ${ep.dim}${ep.rules.length ? ' (' + ep.rules.map(r => EP_RULE_TEXT[r]).join(', ') + ')' : ''}</p></div>`;
  }

  // ═════════ 우주 낚시 엔진 ═════════
  function play(sh, ep, onDone) {
    const THREE = window.THREE;
    const R = new Set(ep.rules);
    sh.body.innerHTML = `<div style="position:relative;border-radius:12px;overflow:hidden"><div data-gl style="width:100%;aspect-ratio:4/5"></div>
        <div data-hud style="position:absolute;left:8px;right:8px;top:8px;color:#fff;font:700 13px sans-serif;text-shadow:0 1px 3px #000;display:grid;gap:3px;pointer-events:none"></div>
        <div data-msg style="position:absolute;left:0;right:0;top:44%;text-align:center;color:#fff;font:800 19px sans-serif;text-shadow:0 2px 6px #000;pointer-events:none"></div>
        <div data-bar style="position:absolute;left:10%;right:10%;bottom:12px;height:14px;border-radius:7px;background:#0009;display:none;overflow:hidden"><i style="display:block;height:100%;width:0"></i></div></div>
      <div data-ctl style="display:grid;grid-template-columns:repeat(auto-fit,minmax(78px,1fr));gap:6px;margin-top:8px"></div>
      <div style="font-size:12px;opacity:.75;margin-top:4px">화면을 끌어 루어(빛나는 구슬)를 물고기 곁에 두고 가만히 기다리면 입질 → 「🎣 챔질·감기」를 누르고 있어 끌어올리기(빨간 장력이면 손 떼기). 🛰 쓰레기에 루어를 대면 수거, 🛡 보호종은 놓아주면 보너스.</div>`;
    const q = s => sh.body.querySelector(s), holder = q('[data-gl]');
    const r = new THREE.WebGLRenderer({ antialias: true }); r.setPixelRatio(Math.min(2, devicePixelRatio || 1)); holder.appendChild(r.domElement); r.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(55, .8, .1, 1000);
    const resize = () => { const w = holder.clientWidth || 300, h = w / .8; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    const ro = new ResizeObserver(resize); ro.observe(holder); resize();
    scene.background = new THREE.Color(ep.sky); cam.position.set(0, 4, 24); cam.lookAt(0, -1, 0);
    scene.add(new THREE.HemisphereLight('#cfd8ff', '#101020', .8)); const key = new THREE.DirectionalLight('#ffffff', .7); key.position.set(10, 20, 15); scene.add(key);
    // 별
    const sn = 1400, sp = new Float32Array(sn * 3); for (let i = 0; i < sn; i++) { const v = new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize().multiplyScalar(rnd(200, 400)); sp.set([v.x, v.y, v.z], i * 3); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 1.2 })));
    // 행성·고리·성운·블랙홀·혜성
    const [pc, prad, ppos, ring] = ep.planet;
    const planet = new THREE.Mesh(new THREE.SphereGeometry(prad, 32, 24), new THREE.MeshLambertMaterial({ color: pc, emissive: ep.blackhole ? '#000' : '#111' })); planet.position.set(...ppos); scene.add(planet);
    if (ring) { const rg = new THREE.Mesh(new THREE.RingGeometry(prad * 1.3, prad * 2.1, 64), new THREE.MeshBasicMaterial({ color: '#E8D9B0', side: THREE.DoubleSide, transparent: true, opacity: .55 })); rg.position.copy(planet.position); rg.rotation.x = 1.25; scene.add(rg); }
    if (ep.blackhole) { planet.material.color.set('#000'); const disk = new THREE.Mesh(new THREE.RingGeometry(prad * 1.2, prad * 2.6, 96), new THREE.MeshBasicMaterial({ color: '#FFB547', side: THREE.DoubleSide, transparent: true, opacity: .85 })); disk.position.copy(planet.position); disk.rotation.x = 1.35; scene.add(disk); planet.userData.disk = disk; }
    if (ep.nebula) for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(120, 80), new THREE.MeshBasicMaterial({ color: ['#FF7AD9', '#7A5CFF', '#4AE0FF'][i % 3], transparent: true, opacity: .07, depthWrite: false })); m.position.set(rnd(-80, 80), rnd(-30, 40), -160 - i * 10); m.rotation.z = rnd(0, 3); scene.add(m); }
    let tail = null; if (ep.comet) { const n = 600, tp = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const k = Math.random(); tp.set([ppos[0] + k * 90 + rnd(-3, 3) * k * 4, ppos[1] + rnd(-2, 2) * k * 4, ppos[2] + rnd(-2, 2)], i * 3); }
      const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(tp, 3)); tail = new THREE.Points(tg, new THREE.PointsMaterial({ color: '#9FE7FF', size: 1.4, transparent: true, opacity: .6 })); scene.add(tail); }
    // 낚시터(액체면 또는 열린 공간)
    let fluid = null; if (ep.fluid) { fluid = new THREE.Mesh(new THREE.BoxGeometry(34, 18, 14), new THREE.MeshLambertMaterial({ color: ep.fluid, transparent: true, opacity: .35 })); fluid.position.set(0, -2, 0); scene.add(fluid); }
    const geyser = R.has('time') && ep.id === 3 ? new THREE.Mesh(new THREE.CylinderGeometry(.6, 2.4, 22, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#E6FBFF', transparent: true, opacity: 0, side: THREE.DoubleSide })) : null;
    if (geyser) { geyser.position.set(4, 2, 0); scene.add(geyser); }
    // 웜홀 2개
    const portals = []; if (ep.wormhole) [[-11, 3, 0, '#B07AFF'], [11, -6, 0, '#4AE0FF']].forEach(([x, y, z, c]) => { const m = new THREE.Mesh(new THREE.TorusGeometry(1.8, .25, 12, 40), new THREE.MeshBasicMaterial({ color: c })); m.position.set(x, y, z); scene.add(m); portals.push(m); });
    // 우주선·줄·루어
    const ship = new THREE.Group(); const hull = new THREE.Mesh(new THREE.ConeGeometry(1.4, 4, 6), new THREE.MeshLambertMaterial({ color: '#E3E8FF' })); hull.rotation.z = Math.PI / 2; ship.add(hull);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(1, 2, .2), new THREE.MeshLambertMaterial({ color: '#7A5CFF' })); fin.position.x = 1.4; ship.add(fin); ship.position.set(0, 12, 0); scene.add(ship);
    const lure = new THREE.Mesh(new THREE.SphereGeometry(.45, 16, 12), new THREE.MeshBasicMaterial({ color: '#FFE45A' })); scene.add(lure);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(.9, 16, 12), new THREE.MeshBasicMaterial({ color: '#FFE45A', transparent: true, opacity: .25 })); lure.add(glow);
    const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]); scene.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: '#cfd8ff' })));
    // 외계 물고기
    function alienFish(color, s) { const g = new THREE.Group(), m = new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: .35, transparent: true, opacity: 1 });
      const b = new THREE.Mesh(new THREE.SphereGeometry(.5 * s, 12, 10), m); b.scale.set(1.8, .8, .6); g.add(b);
      const t = new THREE.Mesh(new THREE.ConeGeometry(.45 * s, .8 * s, 4), m); t.rotation.z = Math.PI / 2; t.position.x = -1.1 * s; g.add(t);
      const fin2 = new THREE.Mesh(new THREE.ConeGeometry(.25 * s, .6 * s, 3), m); fin2.position.y = .5 * s; g.add(fin2); g.userData.mat = m; return g; }
    const B = { x: 14, y: 8, z: 4 };
    const fishes = [];
    function spawnFish(def, near) {
      const [name, color, power, pts, prot, act, layer] = def, s = .6 + power * .3, m = alienFish(color, s);
      const p = near ? near.clone().add(new THREE.Vector3(rnd(-2, 2), rnd(-1, 3), rnd(-1, 1))) : new THREE.Vector3(rnd(-B.x, B.x), rnd(-B.y, B.y * .6), rnd(-B.z, B.z));
      m.position.copy(p); scene.add(m);
      if (prot) { const tag = new THREE.Mesh(new THREE.TorusGeometry(.5 * s, .05, 6, 20), new THREE.MeshBasicMaterial({ color: '#4BD08A' })); tag.position.y = .9 * s; tag.rotation.x = Math.PI / 2; m.add(tag); }
      fishes.push({ def, name, power, pts, prot: !!prot, act: act || 'any', layer: layer || '*', m, v: new THREE.Vector3(rnd(-1, 1), rnd(-.3, .3), rnd(-.3, .3)).normalize().multiplyScalar(rnd(1, 2.5)), life: near ? 6 : 1e9 });
    }
    ep.fish.forEach(d => { for (let i = 0; i < (d[5] === 'plume' ? 0 : 3); i++) spawnFish(d); });
    if (ep.blackhole) spawnFish(ep.fish[2]);
    const junk = []; function spawnJunk() { const m = new THREE.Mesh(new THREE.BoxGeometry(rnd(.6, 1.4), rnd(.3, .8), rnd(.4, 1)), new THREE.MeshLambertMaterial({ color: '#8A8F9A' })); m.position.set(rnd(-B.x, B.x), rnd(-B.y, B.y * .6), rnd(-2, 2)); scene.add(m); junk.push(m); }
    for (let i = 0; i < 4; i++) spawnJunk();
    // 상태
    const st = { t: 0, score: 0, caught: {}, released: 0, junk: 0, breaks: 0, world: 'A', grav: new THREE.Vector3(0, -1, 0), rewinds: R.has('rewind') ? 3 : 0, energy: 100 };
    let state = 'roam', still = 0, fish = null, f = null, hold = false, biteT = 0, last = 0, raf = 0, alive = true, msgT = 0, portalCd = 0;
    const target = new THREE.Vector3(0, 0, 0), lpos = new THREE.Vector3(0, 0, 0); lure.position.copy(lpos);
    const say = (m, s) => { q('[data-msg]').textContent = m; msgT = s || 1.4; };
    const snaps = [];   // 6D 되감기: 0.5초마다 상태 기록
    // 입력: 끌어서 루어 이동(평면 z=0 위로 투영)
    const ray = new THREE.Raycaster(), mv = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit = new THREE.Vector3();
    let dragging = false;
    const toPlane = e => { const b = r.domElement.getBoundingClientRect(); mv.set((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1); ray.setFromCamera(mv, cam); if (ray.ray.intersectPlane(plane, hit)) target.set(clamp(hit.x, -B.x, B.x), clamp(hit.y, -B.y, B.y), 0); };
    r.domElement.addEventListener('pointerdown', e => { dragging = true; toPlane(e); });
    r.domElement.addEventListener('pointermove', e => { if (dragging) toPlane(e); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => r.domElement.addEventListener(t, () => dragging = false));
    // 조작 버튼
    const ctl = q('[data-ctl]');
    const btn = (label, style, id) => `<button type="button" data-b="${id}" style="${style}">${label}</button>`;
    ctl.innerHTML = btn('🎣 챔질·감기', HOT, 'reel') + (R.has('rewind') ? btn(`⏪ 되감기 ${st.rewinds}`, SOFT, 'rewind') : '') + (R.has('parallel') ? btn('🌗 세계 전환', SOFT, 'world') : '') +
      (R.has('gravity') ? btn('⬇', SOFT, 'g-d') + btn('⬅', SOFT, 'g-l') + btn('⬆', SOFT, 'g-u') + btn('➡', SOFT, 'g-r') : '') + (R.has('tilt') && !tiltOn ? btn('📱 기울이기 켜기', SOFT, 'tilt') : '');
    const B_ = id => ctl.querySelector(`[data-b="${id}"]`);
    const reelBtn = B_('reel');
    reelBtn.addEventListener('pointerdown', e => { e.preventDefault(); if (state === 'bite') { state = 'fight'; f = { T: .2, dist: lure.position.distanceTo(ship.position), power: fish.power, slack: 0 }; q('[data-bar]').style.display = 'block'; vib(80); say(`걸었다! ${fish.name}`, 1); } hold = true; });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => reelBtn.addEventListener(t, () => hold = false));
    if (B_('rewind')) B_('rewind').onclick = () => rewind();
    if (B_('world')) B_('world').onclick = () => { if (st.energy < 15) { say('에너지 부족 — 잠시 기다리세요', 1); return; } st.energy -= 15; st.world = st.world === 'A' ? 'B' : 'A'; sfx('level'); vib(40); say(`🌗 ${st.world} 세계`, 1); };
    [['g-d', 0, -1], ['g-l', -1, 0], ['g-u', 0, 1], ['g-r', 1, 0]].forEach(([id, x, y]) => { if (B_(id)) B_(id).onclick = () => { st.grav.set(x, y, 0); sfx('hit'); vib(30); say(`🧭 중력 ${{ 'g-d': '아래', 'g-l': '왼쪽', 'g-u': '위', 'g-r': '오른쪽' }[id]}`, .9); }; });
    if (B_('tilt')) B_('tilt').onclick = async () => { await enableTilt(); fxOpt.fx5 = true; try { localStorage.setItem('g6.fx', JSON.stringify(fxOpt)); } catch (e) {} B_('tilt').textContent = tilt.ok ? '📱 켜짐' : '📱 기울여 보세요'; };
    function rewind() {
      if (st.rewinds <= 0) { say('되감기를 다 썼습니다', 1); return; }
      const s = snaps[Math.max(0, snaps.length - 6)]; if (!s) return;
      st.rewinds--; B_('rewind').textContent = `⏪ 되감기 ${st.rewinds}`;
      lpos.copy(s.l); target.copy(s.l); s.fish.forEach((p, i) => { if (fishes[i]) fishes[i].m.position.copy(p); });
      if (s.fight && s.fishIdx >= 0 && fishes[s.fishIdx]) { fish = fishes[s.fishIdx]; f = Object.assign({}, s.fight); state = 'fight'; q('[data-bar]').style.display = 'block'; } else { state = 'roam'; fish = null; f = null; q('[data-bar]').style.display = 'none'; }
      sfx('level'); vib([30, 30, 30]); say('⏪ 3초 전으로!', 1.2);
    }
    function phaseOk(fd) {
      if (!R.has('time') || fd.act === 'any') return true;
      if (fd.act === 'night') return Math.sin(st.t / 15 * Math.PI) < 0;
      if (fd.act === 'plume') return true;
      return true;
    }
    const visible = fd => !R.has('parallel') || fd.layer === '*' || fd.layer === st.world;
    function land() {
      const fd = fish; q('[data-bar]').style.display = 'none';
      if (fd.prot) { st.released++; st.score += 30; say(`🛡 ${fd.name} — 보호종 방생 +30`, 1.8); sfx('level'); }
      else { st.caught[fd.name] = (st.caught[fd.name] || 0) + 1; st.score += fd.pts; say(`${fd.name} +${fd.pts}`, 1.4); sfx('catch'); vib([40, 30, 120]); }
      scene.remove(fd.m); fishes.splice(fishes.indexOf(fd), 1);
      if (fd.act !== 'plume' && fd.life > 1e8) spawnFish(fd.def);
      state = 'roam'; fish = null; f = null;
    }
    function end() {
      alive = false; cancelAnimationFrame(raf); ro.disconnect(); r.dispose(); r.domElement.remove();
      onDone({ score: Math.round(st.score), caught: st.caught, released: st.released, junk: st.junk, breaks: st.breaks });
    }
    function frame(ts) {
      if (!alive) return;
      const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts; st.t += dt;
      // 4D 시간: 공전 주기(밤낮)·간헐천
      const night = R.has('time') && Math.sin(st.t / 15 * Math.PI) < 0;
      if (R.has('time')) scene.background.set(night ? '#000006' : ep.sky);
      planet.rotation.y += dt * .05; if (planet.userData.disk) planet.userData.disk.rotation.z += dt * .4;
      if (tail) tail.rotation.y = Math.sin(st.t * .2) * .05;
      if (geyser) { const cyc = st.t % 12, on = cyc > 9; geyser.material.opacity = on ? .45 : Math.max(0, geyser.material.opacity - dt);
        if (on && cyc - dt <= 9) { ep.fish.filter(d => d[5] === 'plume').forEach(d => { for (let i = 0; i < (d[4] ? 1 : 4); i++) spawnFish(d, geyser.position); }); say('⛲ 간헐천 분출! 날치가 솟아올라요', 1.5); vib([100, 50, 100]); sfx('bite'); } }
      if (R.has('parallel')) { st.energy = Math.min(100, st.energy + dt * 6); scene.background.set(st.world === 'A' ? ep.sky : '#020812'); }
      // 루어 이동: 손가락 목표 + 5D 기울이기 + 8D 중력 + 9D 웜홀
      if (R.has('tilt') && fxOpt.fx5 && tilt.ok && !dragging) target.add(new THREE.Vector3(tilt.x * 12 * dt, -tilt.y * 10 * dt, 0)).clamp(new THREE.Vector3(-B.x, -B.y, 0), new THREE.Vector3(B.x, B.y, 0));
      if (R.has('gravity') && state !== 'fight' && !dragging) target.addScaledVector(st.grav, 2.2 * dt).clamp(new THREE.Vector3(-B.x, -B.y, 0), new THREE.Vector3(B.x, B.y, 0));
      const before = lpos.clone();
      if (state !== 'fight') lpos.lerp(target, Math.min(1, dt * (ep.id === 1 ? 2 : 4)));
      portalCd -= dt;
      if (portals.length === 2 && portalCd <= 0) portals.forEach((p, i) => { if (lpos.distanceTo(p.position) < 1.6) { const o = portals[1 - i].position; lpos.set(o.x + (o.x < 0 ? 2.5 : -2.5), o.y, 0); target.copy(lpos); portalCd = 1.2; sfx('level'); vib(60); say('🌀 웜홀 통과!', 1); } });
      portals.forEach((p, i) => { p.rotation.z += dt * (i ? -1.5 : 1.5); p.rotation.y = Math.sin(st.t) * .3; });
      const moving = lpos.distanceTo(before) > .02; still = moving ? 0 : still + dt;
      lure.position.copy(lpos); glow.material.opacity = .2 + Math.sin(st.t * 4) * .08;
      // 물고기: 떠돌기 + 루어 근처로 모이기(중력 방향 '바닥'에 모임)
      for (let i = fishes.length - 1; i >= 0; i--) {
        const fd = fishes[i], m = fd.m;
        if (fd === fish && state === 'fight') { m.position.lerp(lpos, .3); continue; }
        fd.life -= dt; if (fd.life <= 0) { scene.remove(m); fishes.splice(i, 1); continue; }
        const vis = visible(fd); m.visible = true; m.userData.mat.opacity = vis ? 1 : .15; m.userData.mat.transparent = true;
        if (R.has('gravity')) fd.v.addScaledVector(st.grav, dt * .6);
        if (fd.act === 'plume') fd.v.y += dt * (fd.life > 4 ? 3 : -2);
        m.position.addScaledVector(fd.v, dt);
        ['x', 'y', 'z'].forEach(k => { if (Math.abs(m.position[k]) > B[k]) { fd.v[k] *= -1; m.position[k] = clamp(m.position[k], -B[k], B[k]); } });
        if (Math.random() < dt * .3) fd.v.applyAxisAngle(new THREE.Vector3(0, 0, 1), rnd(-.8, .8));
        m.rotation.y = fd.v.x < 0 ? Math.PI : 0; m.rotation.z = Math.sin(st.t * 3 + i) * .15;
        if (vis && phaseOk(fd) && state === 'roam' && m.position.distanceTo(lpos) < 2.6) {
          fd.v.lerp(lpos.clone().sub(m.position).normalize().multiplyScalar(1.2), dt);
          if (still > .8 && Math.random() < dt * (.45 + still * .15)) { fish = fd; state = 'bite'; biteT = .9; reelBtn.textContent = '❗ 챔질!'; vib([60, 30, 60]); sfx('bite'); say('입질!', .8); }
        }
      }
      if (state === 'bite') { biteT -= dt; lure.position.y += Math.sin(st.t * 40) * .05; if (biteT <= 0) { state = 'roam'; fish = null; reelBtn.textContent = '🎣 챔질·감기'; say('놓쳤다…'); } }
      else if (state === 'fight') {
        reelBtn.textContent = '🎣 감기(누르고 있기)';
        if (hold) { f.T += (.2 + f.power * .14) * dt; f.dist -= (11 - f.power * 1.5) * (1 - f.T * .4) * dt; } else f.T -= dt;
        if (Math.random() < dt * (.3 + f.power * .3)) { f.T += rnd(.04, .1) * f.power; f.dist += f.power * .5; }
        f.T = Math.max(0, f.T); f.slack = f.T < .05 ? f.slack + dt : 0;
        f.idle = hold ? 0 : (f.idle || 0) + dt; if (f.idle > 3.5) f.slack = 9;   // 3.5초 넘게 안 감으면 놓침
        lpos.lerp(ship.position.clone().add(new THREE.Vector3(0, -f.dist * .6, 0)), dt * 2); lure.position.copy(lpos);
        const bi = q('[data-bar] i'); bi.style.width = Math.min(100, f.T * 100) + '%'; bi.style.background = f.T > .8 ? '#FF5A4A' : f.T > .55 ? '#FFB020' : '#4BD08A';
        if (f.T > .8) vib(12);
        if (f.T >= 1) { st.breaks++; q('[data-bar]').style.display = 'none'; state = 'roam'; fish = null; reelBtn.textContent = '🎣 챔질·감기'; sfx('miss'); say(st.rewinds > 0 ? '💥 줄이 터졌다! ⏪ 되감기로 살릴 수 있어요' : '💥 줄이 터졌다!', 2); }
        else if (f.slack > 2.4) { q('[data-bar]').style.display = 'none'; state = 'roam'; fish = null; reelBtn.textContent = '🎣 챔질·감기'; say('빠졌다…'); }
        else if (f.dist <= .5) { land(); reelBtn.textContent = '🎣 챔질·감기'; }
      }
      // 쓰레기 수거
      for (let i = junk.length - 1; i >= 0; i--) { const j = junk[i]; j.rotation.x += dt; j.rotation.y += dt * .7; if (j.position.distanceTo(lpos) < 1.4 && state !== 'fight') { scene.remove(j); junk.splice(i, 1); st.junk++; st.score += 10; sfx('hit'); say('🛰 우주 쓰레기 수거 +10', 1); setTimeout(() => alive && spawnJunk(), 5000); } }
      // 6D 스냅샷
      if (R.has('rewind') && Math.floor(st.t * 2) !== Math.floor((st.t - dt) * 2)) { snaps.push({ l: lpos.clone(), fish: fishes.map(x => x.m.position.clone()), fight: f ? Object.assign({}, f) : null, fishIdx: fish ? fishes.indexOf(fish) : -1 }); if (snaps.length > 12) snaps.shift(); }
      lineGeo.setFromPoints([ship.position.clone().add(new THREE.Vector3(-1.6, -.3, 0)), lure.position]);
      ship.position.y = 12 + Math.sin(st.t) * .3;
      cam.position.x = Math.sin(st.t * .15) * 2; cam.lookAt(0, -1, 0);
      const caughtN = Object.values(st.caught).reduce((a, b) => a + b, 0);
      q('[data-hud]').innerHTML = `<div>⏱ ${Math.max(0, 90 - st.t).toFixed(0)}초 · 점수 ${Math.round(st.score)} / 목표 ${ep.goal}${R.has('time') ? (ep.id === 3 ? ` · ⛲ ${Math.max(0, 9 - st.t % 12).toFixed(0)}초 뒤 분출` : night ? ' · 🌙 밤' : ' · ☀ 낮') : ''}</div>
        <div>🎣 ${caughtN}마리 · 🛡 방생 ${st.released} · 🛰 ${st.junk}${R.has('parallel') ? ` · 🌗 ${st.world} 세계 ⚡${Math.round(st.energy)}` : ''}${R.has('rewind') ? ` · ⏪ ${st.rewinds}` : ''}</div>`;
      if (msgT > 0) { msgT -= dt; if (msgT <= 0) q('[data-msg]').textContent = ''; }
      r.render(scene, cam);
      if ((st.t >= 90 && state !== 'fight') || st.t >= 96) return end();   // 시간이 끝나면 진행 중인 대결만 6초 더
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    if (window.__SPACE_TEST__) window.__SPACE_TEST__ = { st, fishes, target, get state() { return state; } };   // 자동 시험용(평소에는 꺼져 있음)
    return { destroy() { if (alive) { alive = false; cancelAnimationFrame(raf); ro.disconnect(); r.dispose(); r.domElement.remove(); } } };
  }

  // ═════════ 원정대: 은하 지도(순차 해금) → 웹툰/소설 → 출항 → 결과 ═════════
  function campaign(container, onReward, ctx) {
    container.innerHTML = '<div data-root style="display:grid;gap:10px"></div>';
    const root = container.querySelector('[data-root]');
    let game = null, mode = 'toon';
    const prog = () => ((ctx.store.get() || {}).space) || { best: {} };
    async function saveBest(id, score) { const st = ctx.store.get() || {}; st.space = st.space || { best: {} }; st.space.best[id] = Math.max(st.space.best[id] || 0, score); await ctx.store.set(st); }
    const unlocked = id => id === 1 || (prog().best[id - 1] || 0) >= EP[id - 2].goal;
    function map() {
      const p = prog(), clearedN = EP.filter(e => (p.best[e.id] || 0) >= e.goal).length;
      root.innerHTML = `<div style="padding:12px;border-radius:16px;background:radial-gradient(circle at 70% 20%,#2A1F5A,#05060F 70%);color:#E3E8FF">
          <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px"><b style="font-size:18px">🚀 은하 낚시 원정대 2145</b><span style="font-size:12.5px">클리어 ${clearedN}/10 · 차원 ${clearedN >= 9 ? '9D' : ['3D', '3D', '4D', '4D', '5D', '6D', '7D', '8D', '9D', '9D'][clearedN]}</span></div>
          <div style="font-size:12.5px;opacity:.8;margin:4px 0 10px">지구의 바다를 살린 새벽항의 후손들이 우주의 바다로 떠난다. 한 화를 목표 점수 이상으로 깨면 다음 화와 새 차원이 열려요.</div>
          <svg viewBox="0 0 400 120" style="width:100%;display:block"><path d="M20 90 C 80 20, 120 110, 180 60 S 280 10, 380 50" fill="none" stroke="#7A5CFF55" stroke-width="3" stroke-dasharray="6 6"/>
            ${EP.map((e, i) => { const x = 20 + i * 40, y = [90, 55, 70, 80, 55, 35, 30, 35, 45, 50][i], u = unlocked(e.id), c = (p.best[e.id] || 0) >= e.goal;
              return `<g><circle cx="${x}" cy="${y}" r="${c ? 9 : 7}" fill="${c ? '#FFD24A' : u ? '#7A5CFF' : '#333'}" stroke="#fff" stroke-width="${u ? 1.5 : .5}"/><text x="${x}" y="${y + 4}" font-size="8" text-anchor="middle" fill="${c ? '#000' : '#fff'}">${e.id}</text></g>`; }).join('')}</svg></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px">${EP.map(e => { const u = unlocked(e.id), b = p.best[e.id] || 0, c = b >= e.goal;
          return `<button type="button" data-ep="${e.id}" ${u ? '' : 'disabled'} style="text-align:left;border:2px solid ${c ? '#FFD24A' : u ? '#7A5CFF' : '#333'};border-radius:14px;padding:10px;background:${u ? 'linear-gradient(160deg,#16163A,#0B0B18)' : '#0B0B1080'};color:#E3E8FF;font:13px inherit;cursor:${u ? 'pointer' : 'not-allowed'};opacity:${u ? 1 : .5}">
            <span style="font-size:11px;background:#7A5CFF;border-radius:6px;padding:1px 6px">${e.dim}</span> <b>${e.id}화 ${esc(e.title)}</b><br><span style="font-size:11.5px;opacity:.8">${esc(e.world)}</span><br>
            <span style="font-size:11.5px">${u ? (c ? `⭐ 클리어 · 최고 ${b}점` : b ? `최고 ${b} / 목표 ${e.goal}` : `목표 ${e.goal}점`) : '🔒 앞 화를 깨면 열림'}</span></button>`; }).join('')}</div>
        ${clearedN >= 10 ? `<button type="button" data-outro style="${PRIMARY};width:100%">🌌 에필로그 보기</button>` : ''}`;
      root.querySelectorAll('[data-ep]').forEach(b => b.onclick = () => story(EP[+b.dataset.ep - 1]));
      const o = root.querySelector('[data-outro]'); if (o) o.onclick = () => { root.innerHTML = toonHtml({ id: 0, dim: '' }, OUTRO, '에필로그 · 다음 항해') + `<button type="button" data-back style="${SOFT};width:100%">◀ 은하 지도</button>`; root.querySelector('[data-back]').onclick = map; };
    }
    function story(ep) {
      root.innerHTML = `<div style="display:flex;gap:6px"><button type="button" data-m="toon" style="${mode === 'toon' ? PRIMARY : SOFT};flex:1">🖼 웹툰</button><button type="button" data-m="novel" style="${mode === 'novel' ? PRIMARY : SOFT};flex:1">📖 소설</button><button type="button" data-back style="${SOFT}">◀ 지도</button></div>
        <div data-story>${mode === 'toon' ? toonHtml(ep, ep.toon, ep.title) : novelHtml(ep)}</div>
        <div style="padding:10px;border-radius:12px;background:#16163A;color:#E3E8FF;font-size:13px">🎯 목표 ${ep.goal}점 · 열린 차원: <b>${ep.dim}</b>${ep.rules.length ? ' — ' + ep.rules.map(r => EP_RULE_TEXT[r]).join(' · ') : ' — 기본 3D'}<br>어종: ${ep.fish.map(f => `${f[4] ? '🛡' : '🐟'}${esc(f[0])}`).join(' · ')}</div>
        <button type="button" data-go style="${HOT};width:100%;min-height:52px;font-size:16px">🚀 ${ep.id}화 출항</button>`;
      root.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; story(ep); });
      root.querySelector('[data-back]').onclick = map;
      root.querySelector('[data-go]').onclick = () => {
        if (!window.THREE) { root.innerHTML = '<div style="padding:12px">3D 엔진(three.js)을 불러오지 못했습니다.</div>'; return; }
        const sh = { body: document.createElement('div') }; root.innerHTML = ''; root.append(sh.body);
        game = play(sh, ep, async res => {
          const first = (prog().best[ep.id] || 0) < ep.goal && res.score >= ep.goal;
          await saveBest(ep.id, res.score);
          const bonus = first ? ep.id * 30 : 0, coins = Math.floor(res.score / 10) + bonus;
          sfx(res.score >= ep.goal ? 'level' : 'miss'); vib([60, 40, 160]);
          root.innerHTML = `<div style="padding:14px;border-radius:16px;background:linear-gradient(160deg,#1E1650,#05060F);color:#E3E8FF;display:grid;gap:6px">
              <b style="font-size:20px">${res.score >= ep.goal ? '⭐ 클리어!' : '목표에 조금 모자라요'} — ${res.score}점 / ${ep.goal}</b>
              <div>🎣 ${Object.entries(res.caught).map(([k, v]) => `${esc(k)} ${v}`).join(' · ') || '잡은 물고기 없음'}</div>
              <div>🛡 보호종 방생 ${res.released} · 🛰 쓰레기 ${res.junk}${res.breaks ? ` · 💥 줄 터짐 ${res.breaks}` : ''}</div>
              <div>🪙 +${coins}${first ? ` (첫 클리어 보너스 ${bonus})` : ''}${first && ep.id < 10 ? ` · 🔓 ${ep.id + 1}화 「${esc(EP[ep.id].title)}」 · ${EP[ep.id].dim} 열림!` : ''}${first && ep.id === 10 ? ' · 🌌 에필로그 열림!' : ''}</div></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button type="button" data-re style="${SOFT}">↻ 다시 도전</button><button type="button" data-map style="${PRIMARY}">🗺 은하 지도</button></div>`;
          root.querySelector('[data-re]').onclick = () => story(ep); root.querySelector('[data-map]').onclick = map;
          if (onReward) try { onReward({ game: 'space' + ep.id, score: res.score, coins, released: res.released }); } catch (e) {}
        });
      };
    }
    map();
    return { destroy() { if (game) game.destroy(); } };
  }

  EP.forEach(e => { if (window.GameHub && GameHub.GNAME) GameHub.GNAME['space' + e.id] = `우주 ${e.id}화 ${e.title}`; });
  window.Space = { EP, extra: (onReward, ctx) => [{ id: 'space', ic: '🚀', name: '은하 낚시 원정대 2145', desc: '[3D→9D 10편] 달·유로파·타이탄·토성 고리·혜성·블랙홀 미래 낚시 · 웹툰/소설 스토리', isNew: true, is3d: true, mount: el => campaign(el, onReward, ctx) }] };
})();
