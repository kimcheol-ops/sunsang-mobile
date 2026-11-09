/* AnglerKit — 낚시 앱들에서 흔한 '현장 도구'를 키 없이 계산합니다 (PC·모바일·조황 수첩 공용).
 *  · 솔루나(Solunar) 피딩 타임: 달이 머리 위·발밑을 지날 때(메이저 2시간), 달이 뜨고 질 때(마이너 1시간)
 *    해·달 위치는 공개된 천문 근사식(SunCalc, BSD)과 같은 방식 — 분 단위 오차가 있을 수 있습니다.
 *  · 시간대별 입질 지수: 날씨(풍속·파고) × 솔루나 × 물살 × 해 뜰 녘·질 녘 × 어종 습성 → 0~100 '추정' 지수
 *  · 위험 알림: 풍속·돌풍·파고 기준 3단계(풍랑주의보 기준 = 풍속 14m/s·파고 3m를 '위험'으로)
 *  · 금지체장·금어기 확인(수산자원관리법 시행령 별표 기준을 옮긴 표 — 지역·연도별 예외가 있어 법령 확인 필요)
 *  · 조과 일지 통계(어종·미끼·물때·시간대), 두 지점 거리·방위
 */
(function (root) {
  'use strict';
  const PI = Math.PI, rad = PI / 180, dayMs = 86400000, J1970 = 2440588, J2000 = 2451545, e = rad * 23.4397;
  const toDays = d => d.valueOf() / dayMs - 0.5 + J1970 - J2000;
  const ra_ = (l, b) => Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l));
  const dec_ = (l, b) => Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
  const alt_ = (H, phi, dec) => Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  const sidereal = (d, lw) => rad * (280.16 + 360.9856235 * d) - lw;
  function sunCoords(d) {
    const M = rad * (357.5291 + 0.98560028 * d);
    const L = M + rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + rad * 102.9372 + PI;
    return { dec: dec_(L, 0), ra: ra_(L, 0) };
  }
  function moonCoords(d) {
    const L = rad * (218.316 + 13.176396 * d), M = rad * (134.963 + 13.064993 * d), F = rad * (93.272 + 13.229350 * d);
    const l = L + rad * 6.289 * Math.sin(M), b = rad * 5.128 * Math.sin(F), dist = 385001 - 20905 * Math.cos(M);
    return { ra: ra_(l, b), dec: dec_(l, b), dist };
  }
  function altitude(kind, date, lat, lon) {
    const d = toDays(date), lw = rad * -lon, phi = rad * lat, c = kind === 'sun' ? sunCoords(d) : moonCoords(d);
    return alt_(sidereal(d, lw) - c.ra, phi, c.dec) / rad;
  }
  function moonPhase(date) {
    const d = toDays(date), s = sunCoords(d), m = moonCoords(d), sd = 149598000;
    const phi = Math.acos(Math.sin(s.dec) * Math.sin(m.dec) + Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra));
    const inc = Math.atan2(sd * Math.sin(phi), m.dist - sd * Math.cos(phi));
    const ang = Math.atan2(Math.cos(s.dec) * Math.sin(s.ra - m.ra), Math.sin(s.dec) * Math.cos(m.dec) - Math.cos(s.dec) * Math.sin(m.dec) * Math.cos(s.ra - m.ra));
    const phase = 0.5 + 0.5 * inc * (ang < 0 ? -1 : 1) / PI;   // 0 그믐(삭) → .5 보름 → 1
    const fraction = (1 + Math.cos(inc)) / 2;
    const name = phase < .03 || phase > .97 ? '삭(그믐)' : phase < .22 ? '초승달' : phase < .28 ? '상현' : phase < .47 ? '차오르는 달' : phase < .53 ? '보름' : phase < .72 ? '기우는 달' : phase < .78 ? '하현' : '그믐달';
    const icon = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'][Math.round(phase * 8) % 8];
    return { phase, fraction, name, icon };
  }

  // 하루(현지 0시~24시)를 5분 간격으로 훑어 뜨고 지는 시각·남중·발밑을 찾습니다.
  function solunar(date, lat, lon) {
    const d0 = new Date(date); d0.setHours(0, 0, 0, 0);
    const step = 5 * 60000, N = 24 * 12;
    const sun = [], moon = [];
    for (let i = 0; i <= N; i++) { const t = new Date(d0.valueOf() + i * step); sun.push(altitude('sun', t, lat, lon)); moon.push(altitude('moon', t, lat, lon)); }
    const at = i => new Date(d0.valueOf() + i * step);
    const cross = (arr, h0) => { const up = [], down = [];
      for (let i = 1; i <= N; i++) { const a = arr[i - 1] - h0, b = arr[i] - h0;
        if (a < 0 && b >= 0) up.push(at(i - 1 + a / (a - b))); else if (a >= 0 && b < 0) down.push(at(i - 1 + a / (a - b))); }
      return { rise: up[0] || null, set: down[0] || null }; };
    const ext = (arr, sign) => { const out = [];
      for (let i = 1; i < N; i++) if (sign * (arr[i] - arr[i - 1]) > 0 && sign * (arr[i] - arr[i + 1]) >= 0) out.push(at(i));
      return out; };
    const s = cross(sun, -0.833), m = cross(moon, 0.133);
    const transit = ext(moon, 1), under = ext(moon, -1);
    const H = 3600000, win = (t, half, kind, label) => ({ kind, label, center: t, from: new Date(t - half), to: new Date(+t + half) });
    const periods = [
      ...transit.map(t => win(t, H, 'major', '달 남중')), ...under.map(t => win(t, H, 'major', '달 발밑')),
      ...(m.rise ? [win(m.rise, H / 2, 'minor', '월출')] : []), ...(m.set ? [win(m.set, H / 2, 'minor', '월몰')] : []),
    ].sort((a, b) => a.center - b.center);
    const ph = moonPhase(new Date(d0.valueOf() + 12 * H));
    // 하루 등급: 삭·보름에 가까울수록, 메이저가 해 뜰 녘·질 녘과 겹칠수록 높음 (솔루나 표의 관례)
    const nearSyzygy = 1 - Math.min(Math.abs(ph.phase - .5), Math.min(ph.phase, 1 - ph.phase)) / .25;   // 1=삭/보름, 0=반달
    const twi = [s.rise, s.set].filter(Boolean);
    const overlap = periods.some(p => p.kind === 'major' && twi.some(t => Math.abs(p.center - t) <= 1.5 * H));
    const rating = Math.max(1, Math.min(4, Math.round(1 + 2 * Math.max(0, nearSyzygy) + (overlap ? 1 : 0))));
    return { date: d0, sunrise: s.rise, sunset: s.set, moonrise: m.rise, moonset: m.set, transit, under, periods, moon: ph, rating, overlap };
  }

  // 어종 습성: 밤 낚시(집어등) 어종, 해 뜰 녘·질 녘에 강한 어종
  const HABIT = { 갈치: 'night', 한치: 'night', 무늬오징어: 'dusk', 쭈꾸미: 'day', 갑오징어: 'day', 우럭: 'any', 광어: 'day', 참돔: 'dusk', 문어: 'day', 감성돔: 'dusk', 농어: 'dusk', 볼락: 'night', 방어: 'dusk' };
  // hours: [{t:Date, hr, wind, wave, gust?}] (그날 것), sol: solunar(), tideStrength: 0~100
  function biteTimeline(hours, sol, tideStrength, species) {
    const habit = HABIT[species] || 'any', H = 3600000;
    const twi = [sol.sunrise, sol.sunset].filter(Boolean);
    const tide = tideStrength == null ? .8 : species === '쭈꾸미' || species === '갑오징어' ? 1 - Math.max(0, tideStrength - 55) / 90 : .7 + .3 * Math.min(1, tideStrength / 70);
    return hours.map(h => {
      const mid = +h.t + H / 2;
      let sl = .35;
      sol.periods.forEach(p => { const dist = Math.abs(mid - p.center) / H, w = p.kind === 'major' ? 1 : .7, reach = p.kind === 'major' ? 1.6 : 1;
        sl = Math.max(sl, .35 + .65 * w * Math.max(0, 1 - dist / reach)); });
      const tw = twi.length ? Math.max(0, 1 - Math.min(...twi.map(t => Math.abs(mid - t) / H)) / 1.5) : 0;
      const dark = sol.sunrise && sol.sunset ? mid < +sol.sunrise || mid > +sol.sunset : false;
      const hab = habit === 'night' ? (dark ? 1 : .35 + .5 * tw) : habit === 'dusk' ? .6 + .4 * tw : habit === 'day' ? (dark ? .3 : .8 + .2 * tw) : .75 + .25 * tw;
      const wx = Math.max(0, 1 - Math.max(0, (h.wind ?? 4) - 5) * .12 - Math.max(0, (h.wave ?? .6) - 1) * .35);
      const v = Math.round(100 * Math.max(0, Math.min(1, (.45 * sl + .2 * tide + .35 * hab) * (.25 + .75 * wx))));
      return { hr: h.hr, t: h.t, v, sl: Math.round(sl * 100), wx: Math.round(wx * 100), dark };
    });
  }

  // 위험 단계: 0 안전 · 1 주의 · 2 경고 · 3 위험(풍랑주의보 수준)
  function hazardLevel(h) {
    const w = h.wind ?? 0, g = h.gust ?? w * 1.4, v = h.wave ?? 0;
    return w >= 14 || g >= 20 || v >= 3 ? 3 : w >= 10 || g >= 15 || v >= 2 ? 2 : w >= 7 || g >= 11 || v >= 1.5 ? 1 : 0;
  }
  const HZ = ['안전', '주의', '경고', '위험'];
  function hazards(hours, from = new Date(), span = 24) {
    const end = +from + span * 3600000, list = hours.filter(h => +h.t >= +from - 3600000 && +h.t <= end).map(h => ({ ...h, lv: hazardLevel(h) }));
    const worst = list.reduce((a, h) => h.lv > a.lv ? h : a, { lv: 0 });
    const runs = []; let cur = null;
    list.forEach(h => { if (h.lv >= 1) { if (cur && cur.lv === h.lv) cur.to = h; else runs.push(cur = { lv: h.lv, from: h, to: h }); } else cur = null; });
    const why = h => [h.wind >= 7 ? `풍속 ${h.wind.toFixed(1)}m/s` : '', (h.gust ?? 0) >= 11 ? `돌풍 ${h.gust.toFixed(0)}m/s` : '', (h.wave ?? 0) >= 1.5 ? `파고 ${h.wave.toFixed(1)}m` : ''].filter(Boolean).join(' · ');
    return { lv: worst.lv, label: HZ[worst.lv], worst: worst.t ? worst : null, why: worst.t ? why(worst) : '', runs: runs.slice(0, 4).map(r => ({ lv: r.lv, label: HZ[r.lv], from: r.from.t, to: r.to.t, why: why(r.from) })) };
  }

  // 금지체장(cm, 문어는 g)·금어기(월일 MMDD). 출처: 수산자원관리법 시행령 별표 — 지역·업종별 예외가 있어 법령 확인 필요
  const LEGAL = [
    { sp: '감성돔', min: 25, closed: [501, 531] }, { sp: '참돔', min: 24 }, { sp: '돌돔', min: 24 }, { sp: '광어', alias: '넙치', min: 21 },
    { sp: '우럭', alias: '조피볼락', min: 23 }, { sp: '놀래미', alias: '쥐노래미', min: 20, closed: [1101, 1231], note: '금어기는 강원·경북 제외 지역' }, { sp: '농어', min: 30 },
    { sp: '볼락', min: 15 }, { sp: '갈치', min: 18, unit: 'cm(항문장)', closed: [701, 731], note: '금어기는 근해채낚기 등 예외' }, { sp: '고등어', min: 21 },
    { sp: '말쥐치', min: 18 }, { sp: '붕장어', min: 35 }, { sp: '참조기', min: 15 }, { sp: '살오징어', min: 15, unit: 'cm(외투장)', closed: [401, 531] },
    { sp: '쭈꾸미', alias: '주꾸미', min: 0, closed: [511, 831] }, { sp: '문어', alias: '대문어', min: 600, unit: 'g', closed: [516, 630], note: '금어기는 시·도별로 달리 정할 수 있음' },
    { sp: '갑오징어', min: 0 }, { sp: '참홍어', min: 42, unit: 'cm(체반폭)', closed: [601, 715] }, { sp: '한치', min: 0 }, { sp: '무늬오징어', min: 0 }, { sp: '방어', min: 0 },
  ];
  const md = d => (d.getMonth() + 1) * 100 + d.getDate();
  const fmtMD = n => `${Math.floor(n / 100)}/${n % 100}`;
  function legalCheck(sp, size, date = new Date()) {
    const r = LEGAL.find(x => x.sp === sp || x.alias === sp);
    if (!r) return { known: false, ok: true, msg: '표에 없는 어종 — 해양수산부 고시를 확인하세요' };
    const c = md(date), closed = r.closed && (r.closed[0] <= r.closed[1] ? c >= r.closed[0] && c <= r.closed[1] : c >= r.closed[0] || c <= r.closed[1]);
    const unit = r.unit || 'cm', small = r.min > 0 && size != null && size !== '' && +size < r.min;
    const msg = closed ? `🚫 금어기(${fmtMD(r.closed[0])}~${fmtMD(r.closed[1])}) — 방생하세요` : small ? `🚫 금지체장 ${r.min}${unit} 미만 — 방생하세요` : r.min ? `✅ 금지체장 ${r.min}${unit} 이상` : '✅ 금지체장 없음';
    return { known: true, ok: !closed && !small, closed, small, min: r.min, unit, msg: msg + (r.note ? ` (${r.note})` : ''), rule: r };
  }

  // 제철(월)·금어기(기간) — 화면마다 같은 문구로: "🔥 쭈꾸미 제철(9~11월) · 11월 말까지", "🚫 문어 금어기 5/16~6/30 · 12일 남음", "⏳ 감성돔 금어기 D-9(5/1~5/31)"
  const SEASON = { 쭈꾸미: [9, 10, 11], 갑오징어: [4, 5, 9, 10, 11], 우럭: [3, 4, 5, 6, 9, 10, 11, 12], 광어: [4, 5, 9, 10, 11], 참돔: [5, 6, 9, 10, 11], 갈치: [7, 8, 9, 10, 11],
    문어: [7, 8, 9, 10, 11], 무늬오징어: [9, 10, 11, 12], 한치: [6, 7, 8], 감성돔: [3, 4, 10, 11, 12], 방어: [11, 12, 1, 2], 도루묵: [11, 12], 볼락: [12, 1, 2, 3], 농어: [6, 7, 8, 9] };
  // 월 묶음: [3,4,5,6,9,10,11,12] → [[3,6],[9,12]] (12→1 넘어가는 철도 하나로)
  function monthRuns(ms) { const s = [...new Set(ms)].sort((a, b) => a - b); if (!s.length) return []; const runs = []; let a = s[0], p = s[0];
    for (const m of s.slice(1)) { if (m === p + 1) p = m; else { runs.push([a, p]); a = p = m; } } runs.push([a, p]);
    if (runs.length > 1 && runs[0][0] === 1 && runs[runs.length - 1][1] === 12) { const first = runs.shift(); runs[runs.length - 1][1] = first[1]; } return runs; }
  const runText = r => r[0] === r[1] ? `${r[0]}월` : `${r[0]}~${r[1]}월`;
  const inRun = (r, m) => r[0] <= r[1] ? m >= r[0] && m <= r[1] : m >= r[0] || m <= r[1];
  const dayNum = (y, mmdd) => Math.round(Date.UTC(y, Math.floor(mmdd / 100) - 1, mmdd % 100) / 864e5);
  function seasons(date = new Date(), soonDays = 30) {
    const m = date.getMonth() + 1, y = date.getFullYear(), t = Math.round(Date.UTC(y, date.getMonth(), date.getDate()) / 864e5), out = [];
    const species = [...new Set(Object.keys(SEASON).concat(LEGAL.filter(r => r.closed).map(r => r.sp)))];
    for (const sp of species) {
      const r = LEGAL.find(x => x.sp === sp), runs = monthRuns(SEASON[sp] || []);
      if (r && r.closed) { const [a, b] = r.closed; let s = dayNum(y, a), e = dayNum(a > b ? y + 1 : y, b);
        if (a > b && t <= dayNum(y, b)) { s = dayNum(y - 1, a); e = dayNum(y, b); }   // 해를 넘기는 금어기(예: 12/1~2/28)
        if (t >= s && t <= e) { out.push({ sp, kind: 'closed', cls: 'bad', text: `🚫 ${sp} 금어기 ${fmtMD(a)}~${fmtMD(b)} · ${e - t === 0 ? '오늘까지' : (e - t) + '일 남음'}`, note: r.note || '' }); continue; }
        let until = s - t; if (until < 0) until += 365;
        if (until > 0 && until <= soonDays) out.push({ sp, kind: 'soon', cls: 'warn', text: `⏳ ${sp} 금어기 D-${until} (${fmtMD(a)}~${fmtMD(b)})`, note: r.note || '' }); }
      const cur = runs.find(x => inRun(x, m));
      if (cur) out.push({ sp, kind: 'peak', cls: 'ok', text: `🔥 ${sp} 제철(${runs.map(runText).join('·')}) · ${cur[1]}월 말까지` });
    }
    const order = { closed: 0, soon: 1, peak: 2 }; return out.sort((a, b) => order[a.kind] - order[b.kind]);
  }

  // ── 바다 수온: 어종별 잘 무는 수온(대략, 참고용) · 지금 위치 수온 받아오기(Open-Meteo 해양, 키 불필요) ──
  const WATER = { 쭈꾸미: [15, 24], 갑오징어: [14, 22], 우럭: [10, 20], 광어: [12, 22], 참돔: [15, 24], 갈치: [16, 25], 문어: [12, 22], 무늬오징어: [17, 26], 한치: [18, 26],
    감성돔: [12, 20], 농어: [14, 24], 볼락: [10, 18], 방어: [12, 20], 고등어: [14, 22], 도루묵: [2, 10] };
  function tempAdvice(t) {
    if (t == null || isNaN(t)) return null;
    const level = t < 8 ? ['매우 차가움', '#7AB8FF'] : t < 13 ? ['차가움', '#8CC8F2'] : t < 20 ? ['적당', '#6FD3A4'] : t < 25 ? ['따뜻함', '#F5C46B'] : ['높음', '#FF8A8D'];
    const fish = Object.entries(WATER).map(([sp, [a, b]]) => ({ sp, a, b, mid: (a + b) / 2, ok: t >= a && t <= b })).filter(f => f.ok).sort((x, y) => Math.abs(t - x.mid) - Math.abs(t - y.mid));
    return { t, label: level[0], color: level[1], fish: fish.map(f => f.sp), best: fish.slice(0, 4).map(f => f.sp) };
  }
  // 지점 수온: 해양 모델은 육지에서 값이 없으므로, 없으면 주변 바다 쪽(8방향 약 9·18km)을 찾아봄
  async function seaTemp(lat, lon) {
    const get = async (la, lo) => { const r = await fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${la.toFixed(4)}&longitude=${lo.toFixed(4)}&current=sea_surface_temperature&hourly=sea_surface_temperature&forecast_days=2&timezone=Asia%2FSeoul`).then(x => x.json());
      const t = r.current && r.current.sea_surface_temperature; const hs = (r.hourly && r.hourly.sea_surface_temperature || []).filter(v => v != null);
      return t == null && !hs.length ? null : { t: t ?? hs[0], min: hs.length ? Math.min(...hs) : null, max: hs.length ? Math.max(...hs) : null, time: r.current && r.current.time }; };
    let v = await get(lat, lon); if (v) return Object.assign(v, { lat, lon, km: 0 });
    for (const d of [.08, .16]) for (const [dy, dx] of [[0, -1], [-1, 0], [0, 1], [1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]]) {
      const la = lat + dy * d, lo = lon + dx * d / Math.cos(lat * rad); v = await get(la, lo).catch(() => null);
      if (v) return Object.assign(v, { lat: la, lon: lo, km: Math.round(distance({ lat, lon }, { lat: la, lon: lo }).km) });
    }
    return null;
  }

  // 조과 일지 통계
  function logStats(entries) {
    const by = (key, f = x => x[key]) => { const m = {}; entries.forEach(x => { const k = f(x); if (!k) return; const o = m[k] = m[k] || { k, n: 0, max: 0 };
      o.n += +x.count || 1; o.max = Math.max(o.max, +x.len || 0); }); return Object.values(m).sort((a, b) => b.n - a.n); };
    return {
      total: entries.reduce((a, x) => a + (+x.count || 1), 0), trips: new Set(entries.map(x => (x.at || '').slice(0, 10))).size,
      species: by('sp'), bait: by('bait'), mul: by('mul', x => (x.mul || '').split(' ')[0]),
      hour: by('hour', x => x.at ? `${String(new Date(x.at).getHours()).padStart(2, '0')}시` : ''),
      best: entries.filter(x => +x.len).sort((a, b) => b.len - a.len)[0] || null,
    };
  }

  // 두 지점 거리(km)·방위(°, 북=0)
  function distance(a, b) {
    const R = 6371, dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
    const km = 2 * R * Math.asin(Math.sqrt(h));
    const y = Math.sin(dLon) * Math.cos(b.lat * rad), x = Math.cos(a.lat * rad) * Math.sin(b.lat * rad) - Math.sin(a.lat * rad) * Math.cos(b.lat * rad) * Math.cos(dLon);
    const brg = (Math.atan2(y, x) / rad + 360) % 360;
    return { km, nm: km / 1.852, brg, dir: ['북', '북동', '동', '남동', '남', '남서', '서', '북서'][Math.round(brg / 45) % 8] };
  }
  const hm = t => t ? `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}` : '—';
  const dirName = deg => deg == null ? '' : ['북', '북북동', '북동', '동북동', '동', '동남동', '남동', '남남동', '남', '남남서', '남서', '서남서', '서', '서북서', '북서', '북북서'][Math.round(deg / 22.5) % 16];

  root.AnglerKit = { WATER, tempAdvice, seaTemp, seasons, SEASON, monthRuns, solunar, moonPhase, altitude, biteTimeline, hazards, hazardLevel, HZ, legalCheck, LEGAL, logStats, distance, hm, dirName, HABIT };
})(typeof window !== 'undefined' ? window : globalThis);
