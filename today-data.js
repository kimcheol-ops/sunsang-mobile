/* 오늘의 바다 소식 — 하루치 콘텐츠 데이터 (daily-sea-content 스킬이 매일 이 파일만 새로 씁니다)
 * 규칙: 행사 사진은 한국관광공사 TourAPI 이미지만(출처 표기), 조과 사진은 앱 사용자·선장이 올린 것만.
 *       확인되지 않은 항목은 sample:true 로 표시하고 화면에 '예시'로 보입니다.
 */
window.TODAY_DATA = {
  date: '2026-11-23',
  collectedAt: '2026-11-23 23:20',
  scoreDay: '2026-11-23',
  // 출조 지수(PC 새벽 4시 계산 · 기상청 단기예보, 모바일과 같은 공식) — 지역명: [지수, 등급, 최적 시간]
  scores: { 서귀포: [99, '양호', '06:00–11:59'], 창원: [90, '양호', '05:00–10:59'], 여수: [89, '양호', '05:00–10:59'], 통영: [88, '양호', '05:00–10:59'], 남해: [88, '양호', '05:00–10:59'], 포항: [86, '양호', '15:00–16:59'], 부산: [86, '양호', '05:00–10:59'], 거제: [86, '양호', '05:00–10:59'], 강릉: [83, '양호', '12:00–16:59'], 목포: [81, '양호', '15:00–16:59'], 무안: [75, '양호', '14:00–16:59'], 인천: [69, '보통', '14:00–16:59'], 서천: [66, '보통', '04:00–04:59'], 보령: [66, '보통', '—'], 군산: [40, '주의', '—'], 태안: [40, '주의', '—'] },

  // 조과: 오늘 올라온 것이 없으면 이번 주(7일)를 보여 줍니다. source: 휴대폰 수첩 / 선장 등록 / 조황 수첩 / 사용자 직접
  // 공개 조황 요약(⑤-2): 공개 글에서 어디·어종·마릿수·봉돌만 요약 + 출처 링크. 못 찾으면 비워 둠(지어내지 않음)
  reportsAt: '2026-11-23 검색 — 날짜·마릿수를 함께 확인할 수 있는 공개 글 없음(목록 링크만)',
  reports: [],
  // 조황 글 목록(링크만 — 내용 복사 안 함). 마릿수는 글을 열어 확인
  reportLinks: [
    { title: '더피싱 선상 조황 게시판 — 무창포·신진도·연안부두·영흥도 11월 쭈꾸미·갑오징어 글', url: 'https://thefishing.kr/gallery/ship.php', region: '서해' },
    { title: '조황센터 — 물때와 조황 검색', url: 'https://us-in.io/fishing-result', region: '전국' },
    { title: '바낙 점주조황 — 사천·삼천포 갑오징어 글', url: 'https://banak.co.kr/board/board.jsp', region: '남해' },
  ],

  catches: [
    // 실제 기록(사용자 직접 알림 2026-11-23): 주말 군산 비응항 선상 — 날씨 때문에 점심 전 귀항, 0마리. 영상 제목 조황과 비교용
    { day: '2026-11-22', region: '군산', port: '비응항', sp: '선상낚시', size: '날씨로 점심 전 귀항', count: '0마리 (주말 출조)', source: '사용자 직접', real: true },
    { day: '2026-11-05', region: '여수', port: '국동항', sp: '갑오징어', size: '최대 28cm', count: '1인 12수', source: '선장 등록', sample: true },
    { day: '2026-11-04', region: '보령', port: '오천항', sp: '쭈꾸미', size: '', count: '1인 60수', source: '휴대폰 수첩', sample: true },
    { day: '2026-11-03', region: '통영', port: '도남항', sp: '참돔', size: '52cm', count: '배 전체 9수', source: '선장 등록', sample: true },
    { day: '2026-11-02', region: '제주시', port: '도두항', sp: '무늬오징어', size: '1.2kg', count: '1인 4수', boat: '', source: '조황 수첩', sample: true },
    { day: '2026-10-31', region: '포항', port: '구룡포항', sp: '방어', size: '78cm', count: '배 전체 21수', boat: '', source: '휴대폰 수첩', sample: true },
  ],

  // 🛒 낚시 신제품·이벤트 (제조사·수입사 공식 페이지에서 확인된 것만, 링크·한 줄 요약만 — 광고비 받지 않음)
  //   { kind: '신제품'|'이벤트'|'기획전', title, who, when, note, url, checked: 'YYYY-MM-DD' }
  gearAt: '2026-11-23 검색',
  gear: [
    { kind: '신제품', title: '2026년 11월 신제품 — 토너먼트 ISO LBD(스피닝 릴), 레오브리츠 500J(전동 릴), 크리스티아 와카사기 CRS II', who: '다이와 코리아', when: '2026-11', note: '공식 신제품 목록(희망소비자가 표기). 6~11월 에깅·선상·쇼어 제품이 월별로 정리돼 있어요.', url: 'https://www.daiwa.com/kr/product/newproductlist', checked: '2026-11-23' },
    { kind: '신제품', title: '2026 가을·겨울 신제품 특설 페이지(일본) — 선상 지깅 릴 등', who: '시마노', when: '2026 AW', note: '일본 발표 자료라 국내 출시·가격은 수입사에서 확인하세요.', url: 'https://fish.shimano.com/ja-JP/product/new_product/2026aw.html', checked: '2026-11-23' },
    { kind: '이벤트', title: '대회·이벤트 공지 게시판', who: '다이와 코리아', when: '상시', note: '공식 이벤트·대회 공지(11월 새 기획전은 아직 없음).', url: 'https://www.daiwa.com/kr/competition_event', checked: '2026-11-23' },
  ],
  gearNote: '국내 중소 제조사(조구사·로드 공방 등)의 11월 신제품·이벤트는 아직 공식 글로 확인된 것이 없어요. 낚시점·제조사가 직접 알려 주면 확인 후 올립니다.',

  // 선상·낚시 대회 (주최 측 공지·지자체 보도자료로 확인된 것만, 없으면 빈 배열)
  //   { title, region, where, start: "YYYY-MM-DD", end: "YYYY-MM-DD", apply: ["접수 시작", "접수 마감"], note, img } — 기간·접수 기간을 꼭 넣음
  tournaments: [],
  tournamentNote: '이번 주 확인된 국내 선상낚시 대회가 없습니다. 주최 측·선장님이 등록하면 지역별로 함께 홍보됩니다.',

  // 지역 행사 (한국관광공사 TourAPI · 2026-11-23~29 이번 주 진행·시작 + 다가오는 바닷가 행사)
  events: [
    { id: '4111479', title: '제3회 추도 섬 영화제', addr: '경남 통영시 산양읍 추도', start: '2026-11-27', end: '2026-11-29', lat: 34.7562, lon: 128.2955, tel: '051-790-9433', img: 'https://tong.visitkorea.or.kr/cms/resource/10/4163310_image2_1.png', tags: ['바다', '가족', '힐링'] },
    { id: '2853386', title: '2026 단단단페스티벌', addr: '강원 강릉시 단오장길 1 (노암동)', start: '2026-11-26', end: '2026-11-28', lat: 37.7482, lon: 128.8950, tel: '033-641-1593', img: 'https://tong.visitkorea.or.kr/cms/resource/82/4124982_image2_1.jpg', tags: ['가족', '교육'] },
    { id: '2048902', title: '해운대 빛축제', addr: '부산 해운대구 구남로·해운대해수욕장 일원', start: '2026-11-28', end: '2027-01-10', lat: 35.1592, lon: 129.1615, tel: '051-749-4062', img: 'https://tong.visitkorea.or.kr/cms/resource/41/4155841_image2_1.jpg', tags: ['바다', '가족', '야간'] },
    { id: '3437916', title: '크리스마스 빌리지 부산 2026', addr: '부산 해운대구 수영강변대로 120 (우동)', start: '2026-11-26', end: '2026-12-25', lat: 35.1710, lon: 129.1270, tel: '070-4680-1718', img: 'https://tong.visitkorea.or.kr/cms/resource/49/4130849_image2_1.png', tags: ['가족', '야간'] },
    { id: '3396705', title: '울산문화박람회', addr: '울산 울주군 삼남읍 울산역로 255', start: '2026-11-26', end: '2026-11-29', lat: 35.5556, lon: 129.1317, tel: '052-255-1946', img: 'https://tong.visitkorea.or.kr/cms/resource/24/4144124_image2_1.jpg', tags: ['교육', '가족'] },
    { id: '3578130', title: '울산 크리스마스 마켓', addr: '울산 남구 대공원로 94 (옥동)', start: '2026-11-27', end: '2026-12-26', lat: 35.5317, lon: 129.2935, tel: '052-271-8701', img: 'https://tong.visitkorea.or.kr/cms/resource/40/4153340_image2_1.jpg', tags: ['먹거리', '가족', '야간'] },
    { id: '3492276', title: '2026 문화가 있는 날 (인천)', addr: '인천 제물포구 송현동', start: '2026-04-01', end: '2026-11-29', lat: 37.4763, lon: 126.6326, tel: '032-575-2526', img: 'https://tong.visitkorea.or.kr/cms/resource/82/4055582_image2_1.png', tags: ['가족', '교육'] },
    { id: '4067214', title: '2026 섬 방문의 해 (여수)', addr: '여수시 선어시장길 6 (중앙동)', start: '2026-03-01', end: '2026-12-31', lat: 34.7396, lon: 127.7364, tel: '070-4337-5058', img: 'https://tong.visitkorea.or.kr/cms/resource/13/4067313_image2_1.jpg', tags: ['바다', '교육', '힐링'] },
    { id: '2786391', title: '광안리 M 드론 × 레이저쇼', addr: '부산 수영구 광안해변로 219', start: '2026-01-01', end: '2026-12-31', lat: 35.1538, lon: 129.1185, tel: '051-610-6518', img: 'https://tong.visitkorea.or.kr/cms/resource/97/4163097_image2_1.jpg', tags: ['바다', '가족', '야간'] },
    { id: '1032770', title: '부산국제매직페스티벌', addr: '부산 해운대구 수영강변대로 120', start: '2026-06-28', end: '2026-12-26', lat: 35.1710, lon: 129.1271, tel: '051-626-7002', img: 'https://tong.visitkorea.or.kr/cms/resource/20/4064420_image2_1.jpg', tags: ['가족'] },
    { id: '3432658', title: '함평 겨울빛축제', addr: '함평군 함평읍 곤재로 27 함평엑스포공원', start: '2026-12-18', end: '2026-12-31', lat: 35.0562, lon: 126.5199, tel: '061-320-2247', img: 'https://tong.visitkorea.or.kr/cms/resource/51/4159151_image2_1.jpg', tags: ['가족', '야간', '힐링'], upcoming: true },
    { id: 'up-hwacheon', title: '얼음나라화천 산천어축제', addr: '강원 화천군 화천읍 산천어길 137', start: '2027-01-09', end: '2027-01-31', lat: 38.1126, lon: 127.7099, tel: '1688-3005', img: 'https://tong.visitkorea.or.kr/cms/resource/46/4071246_image2_1.jpg', tags: ['낚시', '가족', '교육'], upcoming: true },
  ],

  // 오늘의 편집 제안 (Claude가 조과·지수·행사를 엮어 고른 코스)
  picks: [
    { title: '통영 새벽 출조 + 추도 섬 영화제(주말)', region: '통영', event: '4111479', why: '통영 지수 88, 새벽 5~11시가 좋습니다. 이번 주말(11/27~29) 산양읍 추도에서 섬 영화제가 열려 가족과 섬 나들이까지 할 수 있어요. 배 시간은 미리 확인하세요.' },
    { title: '부산 출조 + 해운대 빛축제 개막', region: '부산', event: '2048902', why: '부산 지수 86. 오전에 귀항한 뒤 토요일(11/28) 개막하는 해운대 빛축제, 수영강변 크리스마스 빌리지까지 저녁 코스로 좋습니다.' },
    { title: '강릉 낮 출조 + 단단단페스티벌', region: '강릉', event: '2853386', why: '강릉 지수 83, 낮 12~17시가 좋습니다. 11/26~28 단오장 일대 페스티벌이 있어 낚시 안 하는 가족도 함께 갈 수 있어요.' },
    { title: '군산·태안 바다 쉬는 날 → 여수 섬 나들이', region: '여수', event: '4067214', why: '군산·태안 지수 40(주의)로 서해 중부는 쉬는 게 좋습니다. 여수는 89로 좋고 「섬 방문의 해」 섬 여행과 엮을 수 있어요.' },
  ],
};
