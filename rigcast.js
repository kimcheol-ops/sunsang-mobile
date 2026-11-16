/* RigCast — 📅 주간 채비 예보 (해상 지도 · PC/휴대폰 공용)
 *  RigCast.attach(el, { map }) → { setRegion(name, lat, lon) }
 *  · 수온·파고: Open-Meteo 해양(무키) · 바람: Open-Meteo 예보(무키) · 물때·조류세기: 음력 계산(PC 물때 탭과 같은 식)
 *  · 어종 추천 = 제철 + 잘 무는 수온(AnglerKit.WATER) − 금어기(AnglerKit.LEGAL) + 해역 + 조류세기
 *  · 봉돌 호수 = 어종·해역 범위 안에서 조류세기·파고로 계산, 원줄은 「오늘의 채비」 표와 같은 스펙(상표 없음)
 *  · 주말·공휴일은 강조. 모두 '예측'이며 같은 배에서는 선장님이 정한 봉돌을 따릅니다.
 */
(function () {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const AK = window.AnglerKit || {};
  // 어종별 채비(places.js 「오늘의 채비」 표와 같은 값) — lead: 해역별 [가벼움, 무거움], u: 단위, line: 원줄·목줄, how: 채비 이름, seas: 주로 하는 해역
  const RIG = {
    쭈꾸미: { how: '쭈꾸미 에깅(애자)', lead: { 서해: [8, 20], 남해: [10, 20], 동해: [10, 20], 제주: [10, 20] }, line: 'PE 0.8~1호 + 쇼크리더 3~4호', tide: 'weak' },
    갑오징어: { how: '갑오징어 단차', lead: { 서해: [10, 25], 남해: [12, 25], 동해: [12, 25], 제주: [12, 25] }, line: 'PE 0.8~1호 + 리더 3~4호', tide: 'weak' },
    문어: { how: '문어 애자·에기', lead: { 서해: [20, 40], 남해: [20, 40], 동해: [30, 60], 제주: [30, 50] }, line: 'PE 2~3호', tide: 'weak' },
    낙지: { how: '낙지 봉돌', lead: { 서해: [8, 20], 남해: [10, 20], 동해: [10, 20], 제주: [10, 20] }, line: 'PE 0.8~1.5호', tide: 'weak' },
    우럭: { how: '카드·편대 생미끼', lead: { 서해: [40, 80], 남해: [40, 80], 동해: [60, 100], 제주: [60, 100] }, line: 'PE 3~4호, 목줄 4~5호', tide: 'mid' },
    광어: { how: '다운샷', lead: { 서해: [20, 40], 남해: [20, 40], 동해: [30, 50], 제주: [30, 50] }, line: 'PE 1~1.5호, 목줄 4~5호', tide: 'mid' },
    참돔: { how: '타이라바', u: 'g', lead: { 서해: [60, 100], 남해: [60, 120], 동해: [80, 120], 제주: [80, 150] }, line: 'PE 0.8~1호, 리더 4~5호', tide: 'mid' },
    갈치: { how: '야간 갈치 가지채비', lead: { 서해: [40, 60], 남해: [40, 80], 동해: [50, 80], 제주: [60, 100] }, line: 'PE 4~5호', tide: 'mid', seas: ['남해', '제주', '동해'] },
    한치: { how: '이카메탈', lead: { 서해: [15, 25], 남해: [15, 25], 동해: [15, 25], 제주: [15, 30] }, line: 'PE 0.6~0.8호', tide: 'weak', seas: ['동해', '남해', '제주'] },
    무늬오징어: { how: '팁런 에깅', u: 'g', lead: { 서해: [25, 35], 남해: [30, 40], 동해: [30, 40], 제주: [30, 45] }, line: 'PE 0.6~0.8호, 리더 2~2.5호', tide: 'mid', seas: ['남해', '제주', '동해'] },
    방어: { how: '선상 지깅', u: 'g', lead: { 서해: [120, 200], 남해: [120, 200], 동해: [150, 250], 제주: [150, 300] }, line: 'PE 3~4호, 리더 10~12호', tide: 'strong', seas: ['제주', '동해', '남해'] },
    감성돔: { how: '찌낚시', u: '호(찌)', lead: { 서해: [0.8, 2], 남해: [0.5, 1.5], 동해: [0.8, 2], 제주: [0.5, 1.5] }, line: '원줄 2.5~3호, 목줄 1.5~2호', tide: 'mid' }
  };
  const SEASON = AK.SEASON || {}, WATER = AK.WATER || {}, LEGAL = AK.LEGAL || [];
  // 공휴일(대체공휴일 포함) — 달력과 다르면 고쳐 주세요
  const HOLI = { '2026-01-01': '신정', '2026-02-16': '설날', '2026-02-17': '설날', '2026-02-18': '설날', '2026-03-01': '삼일절', '2026-03-02': '대체공휴일', '2026-05-05': '어린이날', '2026-05-24': '부처님오신날', '2026-05-25': '대체공휴일',
    '2026-06-03': '지방선거', '2026-06-06': '현충일', '2026-08-15': '광복절', '2026-08-17': '대체공휴일', '2026-09-24': '추석', '2026-09-25': '추석', '2026-09-26': '추석', '2026-10-03': '개천절', '2026-10-05': '대체공휴일', '2026-10-09': '한글날', '2026-12-25': '성탄절',
    '2027-01-01': '신정', '2027-02-06': '설날', '2027-02-07': '설날', '2027-02-08': '설날', '2027-02-09': '대체공휴일', '2027-03-01': '삼일절', '2027-05-05': '어린이날', '2027-05-13': '부처님오신날', '2027-06-06': '현충일', '2027-08-15': '광복절', '2027-08-16': '대체공휴일',
    '2027-09-14': '추석', '2027-09-15': '추석', '2027-09-16': '추석', '2027-10-03': '개천절', '2027-10-04': '대체공휴일', '2027-10-09': '한글날', '2027-10-11': '대체공휴일', '2027-12-25': '성탄절', '2027-12-27': '대체공휴일' };
  const DOW = ['일', '월', '화', '수', '목', '금', '토'];
  const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const seaOf = (lat, lon) => lat < 33.9 ? '제주' : ((lat >= 35.45 && lon >= 128.9) || (lat >= 35.9 && lon >= 128.3)) ? '동해' : (lon < 126.95 && lat > 34.75) || lat > 36.2 && lon < 127.2 ? '서해' : '남해';
  // 음력 날짜(한국 시간 기준): 삭(합삭) 시각을 Meeus 식으로 계산 → 삭이 든 날이 1일 (중국 달력은 UTC+8이라 하루 어긋나는 달이 있음)
  function newMoon(k) {
    const T = k / 1236.85, r = Math.PI / 180, E = 1 - 0.002516 * T - 0.0000074 * T * T;
    const M = (2.5534 + 29.1053567 * k - 0.0000014 * T * T) * r, Mp = (201.5643 + 385.81693528 * k + 0.0107582 * T * T) * r, F = (160.7108 + 390.67050284 * k - 0.0016118 * T * T) * r, Om = (124.7746 - 1.56375588 * k + 0.0020672 * T * T) * r;
    let J = 2451550.09766 + 29.530588861 * k + 0.00015437 * T * T - 0.00000015 * T * T * T;
    J += -0.40720 * Math.sin(Mp) + 0.17241 * E * Math.sin(M) + 0.01608 * Math.sin(2 * Mp) + 0.01039 * Math.sin(2 * F) + 0.00739 * E * Math.sin(Mp - M) - 0.00514 * E * Math.sin(Mp + M) + 0.00208 * E * E * Math.sin(2 * M)
      - 0.00111 * Math.sin(Mp - 2 * F) - 0.00057 * Math.sin(Mp + 2 * F) + 0.00056 * E * Math.sin(2 * Mp + M) - 0.00042 * Math.sin(3 * Mp) + 0.00042 * E * Math.sin(M + 2 * F) + 0.00038 * E * Math.sin(M - 2 * F) - 0.00024 * E * Math.sin(2 * Mp - M) - 0.00017 * Math.sin(Om);
    return (J - 2440587.5) * 864e5 - 69e3;   // TT→UTC 약 69초
  }
  const kstDay = ms => Math.floor((ms + 9 * 3600e3) / 864e5);
  function lunarDay(d) { const today = kstDay(d.getTime()); let k = Math.floor((d.getTime() / 864e5 / 365.25 + 1970 - 2000) * 12.3685) + 1;
    while (kstDay(newMoon(k)) > today) k--; return today - kstDay(newMoon(k)) + 1; }
  // PC LunarTide.Mul · StrengthPercent 와 같은 식
  function tideOf(d, sea) { const day = lunarDay(d), first = sea === '서해' ? 10 : 9, idx = (((day - first) % 15) + 15) % 15 + 1;
    return { idx, name: idx === 14 ? '조금' : idx === 15 ? '무시' : idx + '물', s: Math.round(30 + 70 * (0.5 + 0.5 * Math.cos(2 * Math.PI * (day - 17.5) / 14.765294))), method: sea === '서해' ? '7물때식' : '8물때식' }; }
  const strengthWord = s => s >= 85 ? ['아주 셈', '#FF6B5E'] : s >= 65 ? ['셈', '#FFB547'] : s >= 45 ? ['보통', '#5FD38A'] : ['약함', '#6FB6FF'];
  const tempColor = t => t == null ? '#8A96A3' : t < 10 ? '#6FB6FF' : t < 15 ? '#5ED3E0' : t < 20 ? '#5FD38A' : t < 25 ? '#FFB547' : '#FF6B5E';
  const tempWord = t => t == null ? '' : t < 10 ? '차가움' : t < 15 ? '선선함' : t < 20 ? '알맞음' : t < 25 ? '따뜻함' : '뜨거움';
  function closed(sp, d) { const md = (d.getMonth() + 1) * 100 + d.getDate(); const L = LEGAL.find(x => x.sp === sp || x.alias === sp); if (!L || !L.closed) return null; const [a, b] = L.closed; return (a <= b ? md >= a && md <= b : md >= a || md <= b) ? L : null; }
  function leadFor(sp, sea, s, wave) { const r = RIG[sp], [a, b] = r.lead[sea] || r.lead['남해'], u = r.u || '호';
    let k = Math.max(0, Math.min(1, (s - 30) / 70)); if (wave >= 1.0) k = Math.min(1, k + 0.15);
    const step = u === '호' ? (b >= 30 ? 5 : b >= 12 ? 2 : 1) : u === 'g' ? 10 : 0.5, v = a + (b - a) * k;
    return { v: Math.min(b, Math.max(a, +(Math.round(v / step) * step).toFixed(1))), u: u === '호(찌)' ? '호 찌' : u, r: [a, b] }; }
  // 어종 점수: 제철 40 · 수온 40 · 조류 10 · 해역(주로 안 하는 해역 −30) · 금어기는 제외
  function pick(d, sea, sst, s, wave) {
    const m = d.getMonth() + 1;
    return Object.keys(RIG).map(sp => {
      const r = RIG[sp], ss = SEASON[sp] || [], w = WATER[sp]; let p = 0, why = [];
      if (ss.includes(m)) { p += 40; why.push('제철'); } else if (ss.includes(m === 1 ? 12 : m - 1) || ss.includes(m === 12 ? 1 : m + 1)) { p += 15; why.push('제철 앞뒤'); }
      if (w && sst != null) { if (sst >= w[0] && sst <= w[1]) { p += 40 + Math.max(0, 5 - Math.abs(sst - (w[0] + w[1]) / 2) / ((w[1] - w[0]) / 2) * 5); /* 범위 가운데일수록 조금 더 */ why.push(`수온 맞음(${w[0]}~${w[1]}℃)`); } else if (sst >= w[0] - 2 && sst <= w[1] + 2) { p += 15; why.push(`수온 경계(${w[0]}~${w[1]}℃)`); } else why.push(`수온 벗어남(${w[0]}~${w[1]}℃)`); }
      const tw = r.tide === 'weak' ? s < 60 : r.tide === 'strong' ? s >= 65 : s >= 45 && s < 90; if (tw) { p += 10; why.push(r.tide === 'weak' ? '물살 약해 좋음' : '물살 알맞음'); }
      if (r.seas && !r.seas.includes(sea)) { p -= 30; why.push(`${sea}에서는 드묾`); }
      const cl = closed(sp, d);
      return { sp, p: cl ? -99 : p, why, closed: cl, lead: leadFor(sp, sea, s, wave || 0), line: r.line, how: r.how };
    }).sort((a, b) => b.p - a.p);
  }
  const wt = l => l.u === '호 찌' ? `찌 ${l.v}호` : l.u === 'g' ? `무게 ${l.v}g` : `봉돌 ${l.v}${l.u}`;   // 표시: 봉돌 12호 · 무게 80g · 찌 1.5호
  function verdict(wave, wind) { if (wave == null && wind == null) return ['예보 없음', '#8A96A3']; if ((wave || 0) >= 2 || (wind || 0) >= 12) return ['출조 위험', '#FF6B5E']; if ((wave || 0) >= 1.2 || (wind || 0) >= 9) return ['주의', '#FFB547']; return ['좋음', '#5FD38A']; }

  async function fetchWeek(lat, lon) {
    const q = `latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&timezone=Asia%2FSeoul&forecast_days=7`;
    const get = url => { const ac = window.AbortController ? new AbortController() : null, tm = setTimeout(() => ac && ac.abort(), 8000);   // 한쪽이 멈춰도 나머지는 보이게 8초 제한
      return fetch(url, ac ? { signal: ac.signal } : undefined).then(r => r.ok ? r.json() : null).catch(() => null).finally(() => clearTimeout(tm)); };
    const [ma, fc] = await Promise.all([get(`https://marine-api.open-meteo.com/v1/marine?${q}&hourly=wave_height,sea_surface_temperature&current=sea_surface_temperature,wave_height`),
      get(`https://api.open-meteo.com/v1/forecast?${q}&hourly=wind_speed_10m&wind_speed_unit=ms`)]);
    const days = {};
    const add = (j, key, field) => { if (!j || !j.hourly || !j.hourly[key]) return; j.hourly.time.forEach((t, i) => { const h = +t.slice(11, 13), v = j.hourly[key][i]; if (v == null || h < 5 || h > 17) return; const o = days[t.slice(0, 10)] = days[t.slice(0, 10)] || {}; (o[field] = o[field] || []).push(v); }); };
    add(ma, 'wave_height', 'wave'); add(ma, 'sea_surface_temperature', 'sst'); add(fc, 'wind_speed_10m', 'wind');
    const out = {}; for (const [k, o] of Object.entries(days)) out[k] = { wave: o.wave ? Math.max(...o.wave) : null, sst: o.sst ? o.sst.reduce((a, b) => a + b, 0) / o.sst.length : null, wind: o.wind ? Math.max(...o.wind) : null };
    return { days: out, now: ma && ma.current ? { sst: ma.current.sea_surface_temperature, wave: ma.current.wave_height } : null, ok: !!ma, wind: !!fc };
  }

  function attach(el, opts) {
    opts = opts || {};
    const st = { name: '', lat: null, lon: null, data: null, open: true, loading: false, err: '' };
    try { const s = JSON.parse(localStorage.getItem('rigcast.region') || 'null'); if (s && s.lat) Object.assign(st, { name: s.name, lat: s.lat, lon: s.lon }); } catch (e) {}
    const rows = () => { const out = [], t0 = new Date(); t0.setHours(12, 0, 0, 0); const sea = st.sea || seaOf(st.lat, st.lon);
      for (let i = 0; i < 7; i++) { const d = new Date(t0.getTime() + i * 864e5), k = ymd(d), w = (st.data && st.data.days[k]) || {}, td = tideOf(d, sea), dow = d.getDay(), holi = HOLI[k], rest = dow === 0 || dow === 6 || !!holi;
        out.push({ d, k, dow, holi, rest, td, sst: w.sst, wave: w.wave, wind: w.wind, sea, picks: pick(d, sea, w.sst != null ? w.sst : (st.data && st.data.now && st.data.now.sst), td.s, w.wave) }); }
      return out; };
    function render() {
      if (st.lat == null) { el.innerHTML = `<h2>📅 수온 · 물때 · 주간 채비 예보</h2><div class="small muted">지역을 고르면(운전 개요 기준 지역) 수온·물때와 7일 채비 예보가 나와요.</div>${opts.map ? '<button data-rc-center class="primary" style="margin-top:6px">📍 지도 가운데로 예보 보기</button>' : ''}`; bind(); return; }
      const R = rows(), t = R[0], now = st.data && st.data.now, sstNow = now && now.sst != null ? now.sst : t.sst, [sw, sc] = strengthWord(t.td.s);
      const restDays = R.filter(r => r.rest), bestRest = restDays.filter(r => verdict(r.wave, r.wind)[0] !== '출조 위험').sort((a, b) => (a.wave || 0) - (b.wave || 0))[0];
      const pk = r => r.picks.filter(x => x.p > 0).slice(0, 3);
      el.innerHTML = `<h2>📅 ${esc(st.name || '지도 가운데')} · 수온 · 물때 · 주간 채비</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:4px 0">
          <div class="card" style="margin:0;border-color:${tempColor(sstNow)}66"><div class="small muted">🌡 바다 수온</div><div style="font:800 24px ui-monospace,monospace;color:${tempColor(sstNow)}">${sstNow != null ? sstNow.toFixed(1) + '℃' : (st.loading ? '받는 중' : '—')}</div><div class="small" style="color:${tempColor(sstNow)}">${tempWord(sstNow)}</div></div>
          <div class="card" style="margin:0;border-color:${sc}66"><div class="small muted">🌊 오늘 물때 <span class="muted">(${t.td.method})</span></div><div style="font:800 24px inherit;color:${sc}">${esc(t.td.name)}</div><div class="small" style="color:${sc};font-weight:700">조류 ${t.td.s}% ${sw}</div><div style="height:5px;background:#2C343D;border-radius:3px;margin-top:2px"><div style="height:5px;width:${t.td.s}%;background:${sc};border-radius:3px"></div></div></div>
        </div>
        <div class="small">파고 ${now && now.wave != null ? now.wave.toFixed(1) + 'm' : t.wave != null ? t.wave.toFixed(1) + 'm' : '—'} · 해역 ${esc(t.sea)} ${st.err ? `<span style="color:#FFB547">· ${esc(st.err)}</span>` : ''}</div>
        ${bestRest ? `<div class="card" style="margin:6px 0;border-color:#F5C46B;background:#F5C46B14"><b>🎉 이번 쉬는 날 추천: ${bestRest.d.getMonth() + 1}/${bestRest.d.getDate()}(${DOW[bestRest.dow]})${bestRest.holi ? ' ' + esc(bestRest.holi) : ''}</b><br><span class="small">${esc(bestRest.td.name)} · 조류 ${bestRest.td.s}% · 수온 ${bestRest.sst != null ? bestRest.sst.toFixed(1) + '℃' : '—'} · 파고 ${bestRest.wave != null ? bestRest.wave.toFixed(1) + 'm' : '—'}<br>${pk(bestRest).map(x => `<b>${esc(x.sp)}</b> ${wt(x.lead)}`).join(' · ') || '추천 어종 없음'}</span></div>` : ''}
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin:4px 0"><button data-rc-toggle>${st.open ? '▲ 주간 표 접기' : '▼ 주간 채비 예보 표'}</button><button data-rc-big>🔍 크게 보기</button>${opts.map ? '<button data-rc-center>📍 지도 가운데</button>' : ''}</div>
        ${st.open ? `<div style="overflow-x:auto"><table class="rc" style="width:100%;border-collapse:collapse;font-size:12px">
          <thead><tr><th>날짜</th><th>물때</th><th>수온·파고</th><th>추천 채비</th></tr></thead><tbody>${R.map(r => { const [vw, vc] = verdict(r.wave, r.wind), [w2, c2] = strengthWord(r.td.s);
            return `<tr style="${r.rest ? 'background:#F5C46B1F;' : ''}border-top:1px solid #2C343D"><td style="white-space:nowrap;${r.rest ? 'color:#F5C46B;font-weight:800' : ''}">${r.d.getMonth() + 1}/${r.d.getDate()}(${DOW[r.dow]})${r.holi ? `<br><span style="font-size:10.5px">${esc(r.holi)}</span>` : r.rest ? '<br><span style="font-size:10.5px">주말</span>' : ''}</td>
              <td><b style="color:${c2}">${esc(r.td.name)}</b><br><span style="color:${c2}">${r.td.s}% ${w2}</span></td>
              <td><b style="color:${tempColor(r.sst)}">${r.sst != null ? r.sst.toFixed(1) + '℃' : '—'}</b><br>${r.wave != null ? r.wave.toFixed(1) + 'm' : '—'} <span style="color:${vc}">${vw}</span></td>
              <td>${vw === '출조 위험' ? '<span style="color:#FF6B5E">쉬어 가요</span>' : pk(r).map(x => `${esc(x.sp)} <b>${wt(x.lead)}</b>`).join('<br>') || '—'}</td></tr>`; }).join('')}</tbody></table></div>
          <div class="small muted" style="margin-top:4px">봉돌은 물살(조류세기)·파고로 계산한 예측이에요. 같은 배에서는 <b>선장님이 정한 호수</b>를 따르세요. 원줄은 「크게 보기」에서.</div>` : ''}`;
      bind();
    }
    function big() {
      const R = rows(); let ov = document.getElementById('rc-overlay'); if (!ov) { ov = document.createElement('div'); ov.id = 'rc-overlay'; document.body.appendChild(ov); }
      ov.style.cssText = 'position:fixed;inset:0;z-index:5000;background:#0E1217F2;color:#E3E9EF;overflow:auto;padding:16px;font:13px system-ui,"Malgun Gothic",sans-serif';
      ov.innerHTML = `<div style="max-width:1200px;margin:0 auto"><div style="display:flex;align-items:center;gap:8px"><h2 style="margin:0">📅 ${esc(st.name || '지도 가운데')} 주간 채비 예보 <span style="font-size:12px;opacity:.7">해역 ${esc(R[0].sea)} · ${esc(R[0].td.method)}</span></h2><button data-rc-close style="margin-left:auto">✕ 닫기</button></div>
        <div style="font-size:12px;opacity:.8;margin:4px 0 10px">수온·파고: Open-Meteo 해양 · 바람: Open-Meteo 예보 · 물때: 음력 계산. 추천 = 제철 + 잘 무는 수온 + 물살 + 해역(금어기 제외). 모두 예측값이에요.</div>
        ${R.map(r => { const [vw, vc] = verdict(r.wave, r.wind), [w2, c2] = strengthWord(r.td.s), list = r.picks.filter(x => x.p > 0 || x.closed).slice(0, 6);
          return `<div style="border:1px solid ${r.rest ? '#F5C46B' : '#2C343D'};${r.rest ? 'background:#F5C46B12;' : ''}border-radius:10px;padding:10px 12px;margin-bottom:8px">
            <div style="display:flex;flex-wrap:wrap;gap:14px;align-items:baseline"><b style="font-size:17px;${r.rest ? 'color:#F5C46B' : ''}">${r.d.getMonth() + 1}/${r.d.getDate()}(${DOW[r.dow]}) ${r.holi ? '🎉 ' + esc(r.holi) : r.rest ? '🎉 주말' : ''}</b>
              <span>🌊 <b style="font-size:16px;color:${c2}">${esc(r.td.name)}</b> <b style="color:${c2}">조류 ${r.td.s}% ${w2}</b></span>
              <span>🌡 <b style="font-size:16px;color:${tempColor(r.sst)}">${r.sst != null ? r.sst.toFixed(1) + '℃' : '—'}</b> ${tempWord(r.sst)}</span>
              <span>파고 <b>${r.wave != null ? r.wave.toFixed(1) + 'm' : '—'}</b> · 바람 <b>${r.wind != null ? r.wind.toFixed(0) + 'm/s' : '—'}</b> · <b style="color:${vc}">${vw}</b></span></div>
            <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;margin-top:6px;font-size:12.5px"><thead><tr style="opacity:.75;text-align:left"><th>어종</th><th>채비</th><th>봉돌·무게(예측)</th><th>범위</th><th>원줄·목줄</th><th>까닭</th></tr></thead><tbody>
              ${list.map(x => `<tr style="border-top:1px solid #2C343D;${x.closed ? 'opacity:.55' : ''}"><td><b>${esc(x.sp)}</b></td><td>${esc(x.how)}</td><td>${x.closed ? '<span style="color:#FF6B5E">금어기</span>' : `<b style="font-size:15px;color:#F5C46B">${wt(x.lead)}</b>`}</td><td>${x.lead.r[0]}~${x.lead.r[1]}${esc(x.lead.u)}</td><td>${esc(x.line)}</td><td style="font-size:11.5px;opacity:.85">${esc(x.closed ? '금어기 ' + (x.closed.note || '') : x.why.join(' · '))}</td></tr>`).join('') || '<tr><td colspan="6">추천할 어종이 없어요</td></tr>'}</tbody></table></div></div>`; }).join('')}
        <div style="font-size:12px;opacity:.8">💡 물살이 셀수록(사리 쪽) 봉돌을 무겁게, 약할수록(조금 쪽) 가볍게. 파고가 1m를 넘으면 한 단계 무겁게 계산했어요. 원줄은 범위의 가는 쪽이 물살을 덜 받아요. 공휴일 표는 달력과 다를 수 있어요.</div></div>`;
      ov.querySelector('[data-rc-close]').onclick = () => ov.remove();
    }
    function bind() {
      const q = s => el.querySelector(s);
      if (q('[data-rc-toggle]')) q('[data-rc-toggle]').onclick = () => { st.open = !st.open; render(); };
      if (q('[data-rc-big]')) q('[data-rc-big]').onclick = big;
      el.querySelectorAll('[data-rc-center]').forEach(b => b.onclick = () => { const c = opts.map.getCenter(); api.setRegion('', c.lat, c.lng); });
    }
    async function load() {
      st.loading = true; st.err = ''; render();
      try { st.data = await fetchWeek(st.lat, st.lon); if (!st.data.ok) st.err = '해양 예보를 받지 못했어요(물때·채비는 계산값)'; else if (!st.data.wind) st.err = '바람 예보를 받지 못했어요(파고로만 판단)'; } catch (e) { st.err = '예보를 받지 못했어요'; }
      st.loading = false; render();
    }
    const api = {
      setRegion(name, lat, lon, sea) { if (lat == null || lon == null) return; Object.assign(st, { name: name || '', lat: +lat, lon: +lon, sea: ['서해', '남해', '동해', '제주'].includes(sea) ? sea : '', data: null }); try { localStorage.setItem('rigcast.region', JSON.stringify({ name: st.name, lat: st.lat, lon: st.lon })); } catch (e) {} load(); },
      rows, tideOf, pick, leadFor, seaOf
    };
    if (st.lat != null) load(); else render();
    return api;
  }
  window.RigCast = { attach, tideOf, pick, leadFor, seaOf, HOLI, RIG };
})();
