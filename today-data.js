/* 오늘의 바다 소식 — 하루치 콘텐츠 데이터 (daily-sea-content 스킬이 매일 이 파일만 새로 씁니다)
 * 규칙: 행사 사진은 한국관광공사 TourAPI 이미지만(출처 표기), 조과 사진은 앱 사용자·선장이 올린 것만.
 *       확인되지 않은 항목은 sample:true 로 표시하고 화면에 '예시'로 보입니다.
 */
window.TODAY_DATA = {
  date: '2026-11-06',
  collectedAt: '2026-11-06 16:10',
  scoreDay: '2026-11-07',
  // 출조 지수(Open-Meteo, PC·모바일과 같은 공식) — 지역명: [지수, 등급, 최적 시간]
  scores: { 여수: [85, '양호', '11:00–16:59'], 통영: [76, '양호', '15:00'], 강릉: [69, '보통', '15:00'], 제주시: [66, '보통', '14:00'], 목포: [65, '보통', '04:00'], 포항: [60, '보통', '—'], 보령: [59, '보통', '—'], 군산: [25, '주의', '—'] },

  // 조과: 오늘 올라온 것이 없으면 이번 주(7일)를 보여 줍니다. source: 휴대폰 수첩 / 선장 등록 / 조황 수첩
  catches: [
    { day: '2026-11-05', region: '여수', port: '국동항', sp: '갑오징어', size: '최대 28cm', count: '1인 12수', source: '선장 등록', sample: true },
    { day: '2026-11-04', region: '보령', port: '오천항', sp: '쭈꾸미', size: '', count: '1인 60수', source: '휴대폰 수첩', sample: true },
    { day: '2026-11-03', region: '통영', port: '도남항', sp: '참돔', size: '52cm', count: '배 전체 9수', source: '선장 등록', sample: true },
    { day: '2026-11-02', region: '제주시', port: '도두항', sp: '무늬오징어', size: '1.2kg', count: '1인 4수', boat: '', source: '조황 수첩', sample: true },
    { day: '2026-11-01', region: '군산', port: '비응항', sp: '우럭', size: '41cm', count: '1인 15수', source: '선장 등록', sample: true },
    { day: '2026-10-31', region: '포항', port: '구룡포항', sp: '방어', size: '78cm', count: '배 전체 21수', boat: '', source: '휴대폰 수첩', sample: true },
  ],

  // 선상·낚시 대회 (주최 측 공지·지자체 보도자료로 확인된 것만, 없으면 빈 배열)
  tournaments: [],
  tournamentNote: '이번 주 확인된 국내 선상낚시 대회가 없습니다. 주최 측·선장님이 등록하면 지역별로 함께 홍보됩니다.',

  // 지역 행사 (한국관광공사 TourAPI, 2026-11-02~08 진행·시작 + 다가오는 바닷가 행사)
  events: [
    { id: '3563389', title: '죽변항 수산물축제', addr: '경북 울진군 죽변면 죽변항길 150', start: '2026-11-06', end: '2026-11-08', lat: 37.0571, lon: 129.4250, tel: '054-789-5485', img: 'https://tong.visitkorea.or.kr/cms/resource/26/4131426_image2_1.jpg', tags: ['바다', '먹거리', '가족'] },
    { id: '3400809', title: '어부장터X포트빌리지 통영', addr: '경남 통영시 도남동 650-3', start: '2026-11-06', end: '2026-11-08', lat: 34.8256, lon: 128.4338, tel: '070-4680-1718', img: 'https://tong.visitkorea.or.kr/cms/resource/15/4107915_image2_1.JPG', tags: ['바다', '먹거리', '가족'] },
    { id: '4116779', title: '국가유산 미디어아트 여수 진남관', addr: '여수시 동문로 11 진남관·이순신광장', start: '2026-10-09', end: '2026-11-08', lat: 34.7413, lon: 127.7366, tel: '070-8064-0807', img: 'https://tong.visitkorea.or.kr/cms/resource/84/4116784_image2_1.jpg', tags: ['교육', '역사', '야간'] },
    { id: '3401306', title: '김포 해병대 문화축제 in 대명항', addr: '경기 김포시 대곶면 대명항1로 110-36', start: '2026-11-07', end: '2026-11-07', lat: 37.6400, lon: 126.5395, tel: '031-980-5110', img: 'https://tong.visitkorea.or.kr/cms/resource/71/4131171_image2_1.jpg', tags: ['바다', '교육', '가족'] },
    { id: '235076', title: '부산불꽃축제', addr: '부산 수영구 광안해변로 219', start: '2026-11-07', end: '2026-11-07', lat: 35.1538, lon: 129.1185, tel: '051-713-5000', img: 'https://tong.visitkorea.or.kr/cms/resource/92/4107992_image2_1.jpg', tags: ['가족', '야간'] },
    { id: '638576', title: '대한민국 국향대전', addr: '함평군 함평읍 곤재로 27', start: '2026-10-23', end: '2026-11-08', lat: 35.0562, lon: 126.5199, tel: '061-320-2247', img: 'https://tong.visitkorea.or.kr/cms/resource/06/4114406_image2_1.JPG', tags: ['힐링', '가족'] },
    { id: '637693', title: '마산가고파국화축제', addr: '창원시 마산합포구 월남동1가', start: '2026-10-31', end: '2026-11-08', lat: 35.1867, lon: 128.5639, tel: '055-225-2341', img: 'https://tong.visitkorea.or.kr/cms/resource/54/4114954_image2_1.jpg', tags: ['힐링', '가족'] },
    { id: '4127761', title: '마산야외도서관 [오롯이 마도로]', addr: '창원시 마산합포구 용마산길 12', start: '2026-11-07', end: '2026-11-08', lat: 35.2133, lon: 128.5848, tel: '055-240-4522', img: 'https://tong.visitkorea.or.kr/cms/resource/68/4127768_image2_1.png', tags: ['교육', '힐링'] },
    { id: '1118296', title: '당진국화전시회', addr: '당진시 합덕읍 덕평로 379-9', start: '2026-10-30', end: '2026-11-08', lat: 36.7933, lon: 126.7843, tel: '041-360-6332', img: 'https://tong.visitkorea.or.kr/cms/resource/47/4130047_image2_1.jpg', tags: ['힐링'] },
    { id: '3555835', title: '안산사이언스밸리(ASV) 과학축제', addr: '안산시 상록구 한양대학로 55', start: '2026-11-07', end: '2026-11-08', lat: 37.3002, lon: 126.8377, tel: '02-780-6881', img: 'https://tong.visitkorea.or.kr/cms/resource/13/4133513_image2_1.jpg', tags: ['교육', '가족'] },
    { id: '2786391', title: '광안리 M 드론 라이트쇼', addr: '부산 수영구 광안해변로 219', start: '2026-01-01', end: '2026-12-31', lat: 35.1538, lon: 129.1185, tel: '051-610-6518', img: 'https://tong.visitkorea.or.kr/cms/resource/12/3518612_image2_1.jpeg', tags: ['가족', '야간'] },
    { id: '2997830', title: '제주 반려동물 문화산업 한마당', addr: '제주시 서광로2길 24 한라체육관', start: '2026-11-06', end: '2026-11-08', lat: 33.4951, lon: 126.5188, tel: '064-711-1002', img: 'https://tong.visitkorea.or.kr/cms/resource/13/4132213_image2_1.jpg', tags: ['가족'] },
    { id: 'up-muan', title: '무안 YD 페스티벌', addr: '무안군 삼향읍 남악중앙공원', start: '2026-11-20', end: '2026-11-22', lat: 34.8111, lon: 126.4628, tel: '061-450-5474', img: 'https://tong.visitkorea.or.kr/cms/resource/08/4131308_image2_1.JPG', tags: ['가족'], upcoming: true },
    { id: 'up-hwacheon', title: '얼음나라화천 산천어축제', addr: '강원 화천군 화천읍 산천어길 137', start: '2027-01-09', end: '2027-01-31', lat: 38.1126, lon: 127.7099, tel: '1688-3005', img: 'https://tong.visitkorea.or.kr/cms/resource/46/4071246_image2_1.jpg', tags: ['낚시', '가족', '교육'], upcoming: true },
  ],

  // 오늘의 편집 제안 (Claude가 조과·지수·행사를 엮어 고른 코스)
  picks: [
    { title: '여수 갑오징어 출조 + 진남관 미디어아트', region: '여수', event: '4116779', why: '토요일 지수 85(전국 최고). 오후에 귀항해서 저녁엔 이순신광장 야간 미디어아트. 아이와 함께라면 역사 공부도 됩니다.' },
    { title: '통영 참돔 + 어부장터 포트빌리지', region: '통영', event: '3400809', why: '지수 76. 도남항 바로 옆 장터라 귀항 뒤 걸어서 갈 수 있습니다. 어부가 직접 파는 수산물로 저녁 장보기.' },
    { title: '울진 죽변항 수산물축제 (출조 쉬는 날)', region: '포항', event: '3563389', why: '동해 파고가 높아 출조가 애매한 날, 가족과 항구 축제로 대신하기 좋은 코스입니다.' },
  ],
};
