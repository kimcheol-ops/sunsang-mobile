/* FishId — 🔎 생김새로 이름 찾기 (바다 생물 도감 안)
 *  FishId.view(box, D, onPick)  D = SEA_DATA, onPick(species)
 *  · 질문에 답하면 점수로 좁혀 가장 비슷한 생물 5개를 보여 줌(사진 인공지능·유료 API 없음)
 *  · 생김새 표(TR)는 손으로 정리한 것 — 비슷한 종이 많으니 「후보」로만 보고 도감·공식 자료로 확인
 */
(function () {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // 생김새 꼬리표: 몸 shape(flat 납작·누움 / long 길쭉 / tall 옆으로 넓적 / stout 통통·머리 큼 / round 둥긂), 색 color, 무늬 mark, 특징 feat, 크기 size(small·mid·big)
  const TR = {
    '감성돔': 'tall gray mid scale', '참돔': 'tall red blue-dot mid big', '돌돔': 'tall black stripe mid teeth', '넙치(광어)': 'flat brown spot big eyes-left', '조피볼락(우럭)': 'stout brown spot mid spine-soft',
    '볼락': 'stout brown small big-eye', '쥐노래미(놀래미)': 'long brown spot mid', '농어': 'long silver mid big black-dot', '고등어': 'long blue stripe-wave mid', '갈치': 'ribbon silver long big teeth',
    '삼치': 'long silver blue-dot big teeth', '방어': 'long blue yellow big', '부시리': 'long blue yellow big', '전갱이': 'long silver small scute', '학꽁치': 'long silver small beak',
    '도다리(문치가자미)': 'flat brown spot mid eyes-right', '노래미': 'long brown spot small', '쥐치': 'tall gray small horn small-mouth', '벵에돔': 'tall black mid', '용치놀래기': 'long red green small colorful',
    '숭어': 'long silver gray mid big', '참가자미': 'flat brown mid eyes-right', '대구': 'stout gray big chin-barbel', '임연수어': 'long yellow stripe mid', '복어': 'stout spot small puff spine',
    '쏨뱅이': 'stout red brown small spine', '쑤기미': 'stout brown black small spine ugly', '노랑가오리': 'flat yellow brown big tail-spine', '망둥어(문절망둑)': 'long brown small big-head', '짱뚱어': 'long brown spot small big-eye jump',
    '참조기': 'long yellow small', '주꾸미': 'arms8 small round', '갑오징어': 'arms10 wide shell-in', '참문어': 'arms8 big round', '대문어(피문어)': 'arms8 big red round',
    '낙지': 'arms8 long-arm mid', '무늬오징어': 'arms10 wide fin-full', '한치(창오징어)': 'arms10 long-body', '살오징어': 'arms10 long-body', '꽃게': 'crab swim-leg spike-side',
    '민꽃게(돌게)': 'crab swim-leg small', '칠게': 'crab small square', '농게': 'crab small big-claw red', '대게': 'crab long-leg big', '대하': 'shrimp big',
    '닭새우(가시발새우)': 'shrimp spiky red', '바지락': 'two small pattern', '백합(생합)': 'two round smooth mid', '동죽': 'two round small', '맛조개': 'two long-shell',
    '굴': 'two rough rock-stick', '홍합(담치)': 'two black long-shell rock-stick', '키조개': 'two big triangle', '전복': 'one flat-shell holes', '소라': 'one spiky-shell big',
    '고둥(보말)': 'one small round', '가리비': 'two fan', '성게': 'spiky round', '불가사리': 'star', '해파리': 'jelly',
    '해삼': 'cucumber', '바다거북': 'turtle big'
  };
  const Q = [
    { k: 'kind', q: '어떤 생물인가요?', a: [['fish', '🐟 물고기'], ['squid', '🐙 문어·오징어'], ['crab', '🦀 게·새우'], ['shell', '🐚 조개·고둥'], ['etc', '⭐ 그 밖(성게·불가사리 등)']] },
    { k: 'shape', q: '몸 모양은?', when: 'fish', a: [['flat', '납작하게 누움(눈이 한쪽)'], ['long', '길쭉함'], ['tall', '옆으로 넓적(달걀 모양)'], ['stout', '통통·머리가 큼'], ['ribbon', '칼처럼 아주 길고 얇음']] },
    { k: 'color', q: '가장 눈에 띄는 색은?', when: 'fish', a: [['red', '붉은색'], ['silver', '은색'], ['blue', '등이 푸름'], ['black', '검은색'], ['brown', '갈색·얼룩'], ['gray', '회색'], ['yellow', '노란색']] },
    { k: 'mark', q: '무늬는?', when: 'fish', a: [['stripe', '굵은 줄무늬'], ['stripe-wave', '물결 무늬'], ['spot', '점·얼룩'], ['blue-dot', '파란·검은 작은 점'], ['none', '거의 없음']] },
    { k: 'feat', q: '특별한 점이 있나요?', when: 'fish', a: [['beak', '입이 새 부리처럼 뾰족'], ['teeth', '이빨이 날카로움'], ['spine', '등가시가 억셈(찔리면 아픔)'], ['puff', '배가 부풀어 오름'], ['tail-spine', '꼬리가 길고 가시'], ['big-eye', '눈이 아주 큼'], ['none', '잘 모르겠음']] },
    { k: 'size', q: '크기는(머리~꼬리)?', when: 'fish', a: [['small', '20cm보다 작음'], ['mid', '20~50cm'], ['big', '50cm보다 큼']] },
    { k: 'arms', q: '다리는?', when: 'squid', a: [['arms8', '8개(둥근 머리)'], ['arms10', '10개(지느러미 있는 몸)']] },
    { k: 'sbody', q: '몸 크기·모양은?', when: 'squid', a: [['small', '손바닥만큼 작음'], ['big', '아주 큼'], ['long-arm', '다리가 가늘고 아주 김'], ['wide', '몸이 넓적·두툼'], ['long-body', '몸이 길쭉']] },
    { k: 'crab', q: '어떻게 생겼나요?', when: 'crab', a: [['swim-leg', '뒷다리가 노처럼 납작'], ['square', '작고 네모남'], ['big-claw', '집게 하나가 아주 큼'], ['long-leg', '다리가 아주 김'], ['shrimp', '새우 모양'], ['spiky', '가시가 많음']] },
    { k: 'shell', q: '껍데기는?', when: 'shell', a: [['two', '두 장(조개)'], ['one', '한 장·돌돌 말림(고둥·전복)']] },
    { k: 'sform', q: '모양은?', when: 'shell', a: [['round', '둥긂'], ['long-shell', '길쭉함'], ['fan', '부채 모양 줄'], ['rough', '울퉁불퉁·바위에 붙음'], ['holes', '구멍이 줄지어 있음'], ['spiky-shell', '뿔·가시'], ['big', '아주 큼']] },
    { k: 'etc', q: '어떻게 생겼나요?', when: 'etc', a: [['spiky', '밤송이처럼 가시'], ['star', '별 모양'], ['jelly', '투명·흐물흐물'], ['cucumber', '오이처럼 길쭉·물렁'], ['turtle', '등딱지가 있음']] }
  ];
  function score(D, ans) {
    return D.species.filter(s => !ans.kind || s.kind === ans.kind).map(s => {
      const tags = (TR[s.name] || '').split(' '); let p = 0, n = 0;
      for (const [k, v] of Object.entries(ans)) { if (k === 'kind' || v === 'none') continue; n++; if (tags.includes(v)) p += 3; else if (k === 'size' && tags.includes('big') && v === 'mid') p += 1; }
      if (ans.where && s.layer === ans.where) p += 1;
      return { s, p, n };
    }).sort((a, b) => b.p - a.p || a.s.name.localeCompare(b.s.name));
  }
  function view(box, D, onPick) {
    const ans = {};
    function draw() {
      const qs = Q.filter(q => q.k === 'kind' || q.when === ans.kind), next = qs.find(q => !(q.k in ans));
      const rows = score(D, ans), top = rows.slice(0, 5), best = top[0], answered = Object.keys(ans).length;
      box.innerHTML = `<div class="bar"><b>🔎 생김새로 이름 찾기</b><button class="btn" data-x style="margin-left:auto">닫기</button></div>
        <div class="small muted">질문에 답할수록 후보가 좁혀져요. 비슷한 종이 많으니 결과는 「후보」예요 — 도감과 공식 자료로 꼭 확인하세요.</div>
        ${answered ? `<div class="bar">${Object.entries(ans).map(([k, v]) => { const q = Q.find(x => x.k === k), a = q && q.a.find(x => x[0] === v); return `<button class="chip" data-un="${k}" title="다시 고르기">${esc(a ? a[1] : v)} ✕</button>`; }).join('')}</div>` : ''}
        ${next ? `<div style="margin:6px 0"><b>${esc(next.q)}</b><div class="bar">${next.a.map(([v, l]) => `<button class="btn" data-a="${next.k}" data-v="${v}">${esc(l)}</button>`).join('')}${next.k !== 'kind' ? `<button class="btn" data-a="${next.k}" data-v="none">건너뛰기</button>` : ''}</div></div>` : '<div class="small" style="margin:6px 0">질문을 다 했어요.</div>'}
        ${answered > 1 ? `<div><b class="small">가장 비슷한 후보</b><div class="cards">${top.map((r, i) => `<button class="card" data-pick="${r.s.id}"><div><span style="font-size:22px">${r.s.emo}</span> <b>${esc(r.s.name)}</b> ${i === 0 && r.p > 0 ? '<span class="chip">가장 비슷</span>' : ''}</div>
            <div class="small muted">맞은 특징 ${Math.round(r.p / 3)}/${r.n}</div>${r.s.ban || r.s.size ? `<div class="small warn">⚖ ${r.s.ban ? '금어기 ' + esc(r.s.ban) : ''}${r.s.ban && r.s.size ? ' · ' : ''}${r.s.size ? '체장 ' + esc(r.s.size) : ''}</div>` : ''}${r.s.caution && /⚠/.test(r.s.caution) ? `<div class="small bad">${esc(r.s.caution)}</div>` : ''}</button>`).join('')}</div>
          ${best && /⚠|독/.test(best.s.caution || '') ? '<div class="small bad">⚠ 독이 있을 수 있는 후보예요. 맨손으로 만지지 마세요.</div>' : ''}
          ${best && best.s.size ? `<div class="small warn">📏 「${esc(best.s.name)}」이라면 ${esc(best.s.size)}는 놓아 주세요.</div>` : ''}</div>` : ''}`;
      box.querySelector('[data-x]').onclick = () => box.remove();
      box.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { if (b.dataset.a === 'kind') for (const k of Object.keys(ans)) delete ans[k]; ans[b.dataset.a] = b.dataset.v; draw(); });
      box.querySelectorAll('[data-un]').forEach(b => b.onclick = () => { if (b.dataset.un === 'kind') for (const k of Object.keys(ans)) delete ans[k]; else delete ans[b.dataset.un]; draw(); });
      box.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => onPick(D.species.find(s => s.id === b.dataset.pick)));
    }
    draw();
  }
  window.FishId = { view, TR, Q, score };
})();
