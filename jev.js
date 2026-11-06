/* JevKit — 게임 속 'AI 판단'을 TypeSafe Jev로 (PC 프로그램에서만 실제 호출, 그 밖에는 기본 규칙으로 판단)
 *  Jev는 글을 쓰지 않고 정해진 질문에 답하는 판단 모델입니다:  noul(예/아니요 확률) · choice(후보 중 선택+확률) · score(점수)
 *  JevKit.ask(state, questions, fallback) → Promise<{ source:'jev'|'rules', answers, ms, error? }>
 *    state: 판단할 상황(문자열·객체), questions: { 이름: { type, instructions, criteria } }  (Jev API 형식 그대로)
 *    fallback(state, questions) → answers  — 키가 없거나 실패하면 이 기본 규칙 결과를 씀(같은 모양)
 *  키는 PC 설정에만 저장되고 이 화면에는 '설정됨'만 전달됩니다. 휴대폰 앱·조황 수첩은 키를 둘 곳이 없어 항상 기본 규칙.
 */
(function () {
  'use strict';
  const inPC = !!(window.chrome && window.chrome.webview);
  const st = { pc: inPC, hasKey: false, keyLen: 0, calls: 0, limit: 0, jev: 0, rules: 0, msSum: 0, lastError: '' };
  const waits = new Map(); let seq = 0; const subs = new Set();
  const notify = () => subs.forEach(fn => { try { fn(st); } catch (e) {} });
  function post(m) { try { window.chrome.webview.postMessage(m); return true; } catch (e) { return false; } }
  function useRules(state, questions, fallback, why) {
    st.rules++; if (why) st.lastError = why; notify();
    let answers = {}; try { answers = fallback ? fallback(state, questions) || {} : {}; } catch (e) {}
    return { source: 'rules', answers, ms: 0, error: why || '' };
  }
  async function ask(state, questions, fallback) {
    if (!inPC || !st.hasKey) return useRules(state, questions, fallback, inPC ? '' : '');
    const id = 'j' + (++seq) + Date.now().toString(36);
    const p = new Promise(res => { waits.set(id, res); setTimeout(() => { if (waits.has(id)) { waits.delete(id); res({ ok: false, error: '응답 시간 초과' }); } }, 20000); });
    post({ type: 'jev', id, state, questions });
    const r = await p;
    if (!r.ok) return useRules(state, questions, fallback, r.error || 'Jev 실패');
    st.jev++; st.msSum += r.ms || 0; st.lastError = ''; notify();
    return { source: 'jev', answers: r.answers || {}, ms: r.ms || 0 };
  }
  // 결과 읽기 도우미: choice → {pick, p}, noul → 확률, score → 점수
  const pick = (a, name) => { const x = a && a[name]; if (!x) return null; if (x.type === 'choice' || x.choice) return { pick: x.choice, p: x.confidence ?? (x.probabilities ? x.probabilities[x.choice] : null), probs: x.probabilities || null }; return null; };
  const yes = (a, name) => { const x = a && a[name]; return x && typeof x.noul === 'number' ? x.noul : null; };
  const score = (a, name) => { const x = a && a[name]; return x && typeof x.score === 'number' ? x.score : null; };
  // 출처 배지: "🤖 Jev 판단 · 확신 82% · 140ms" / "📏 기본 규칙"
  function badge(res, conf) {
    if (res.source === 'jev') return `<span style="display:inline-block;background:#2E1F6A;color:#E6DCFF;border-radius:8px;padding:1px 8px;font-size:11.5px">🤖 Jev 판단${conf != null ? ` · 확신 ${Math.round(conf * 100)}%` : ''}${res.ms ? ` · ${res.ms}ms` : ''}</span>`;
    return `<span style="display:inline-block;background:#1E2A34;color:#C9D6E2;border-radius:8px;padding:1px 8px;font-size:11.5px" title="${res.error ? String(res.error).replace(/"/g, '') : ''}">📏 기본 규칙 판단${res.error ? ' (Jev 실패 → 대체)' : inPC ? ' (Jev 키 없음)' : ''}</span>`;
  }
  // 설정 카드(게임 화면): PC에서만 키 입력. 키는 화면에 다시 보여 주지 않음
  function panel(el) {
    const draw = () => {
      el.innerHTML = `<div style="display:grid;gap:6px;font-size:12.5px">
        <b>🤖 AI 판단 — TypeSafe Jev</b>
        <div style="opacity:.85">게임 속 할아버지 코치의 조언 고르기, 마음 편지 읽기 같은 '판단'을 Jev가 합니다. 키가 없으면 기본 규칙으로 판단해요.</div>
        ${inPC ? `<div>상태: ${st.hasKey ? `<b style="color:#6FD3A4">키 설정됨(${st.keyLen}자)</b>` : '<b style="color:#F5C46B">키 없음</b>'} · Jev ${st.jev}회 · 기본 규칙 ${st.rules}회${st.jev ? ` · 평균 ${Math.round(st.msSum / st.jev)}ms` : ''}${st.lastError ? ` · <span style="color:#FF8A8D">${st.lastError.replace(/</g, '&lt;')}</span>` : ''}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap"><input type="password" data-jk placeholder="TypeSafe API 키 (console.typesafe.ai/keys)" style="flex:1;min-width:200px;min-height:30px;border-radius:6px;border:1px solid #3E4852;background:#11151A;color:#E6EAEE;padding:0 8px" autocomplete="off">
            <button type="button" data-js style="min-height:30px">저장</button>${st.hasKey ? '<button type="button" data-jd style="min-height:30px">키 지우기</button><button type="button" data-jt style="min-height:30px">한국어 판단 시험</button>' : ''}</div>
          <div data-jtr style="opacity:.9"></div>
          <div style="opacity:.7">비용: 입력 100만 토큰당 $0.042(한 번 판단 약 0.03원). 프로그램 한 번 실행에 최대 ${st.limit || 300}회로 제한.</div>`
        : '<div style="opacity:.8">휴대폰·웹에서는 키를 안전하게 둘 곳이 없어 기본 규칙으로 판단합니다. Jev 판단은 PC 프로그램 「게임 · 이벤트」 탭에서 쓸 수 있어요.</div>'}</div>`;
      const inp = el.querySelector('[data-jk]');
      if (el.querySelector('[data-js]')) el.querySelector('[data-js]').onclick = () => { if (inp.value.trim()) post({ type: 'jevKey', key: inp.value.trim() }); inp.value = ''; };
      if (el.querySelector('[data-jd]')) el.querySelector('[data-jd]').onclick = () => post({ type: 'jevKey', key: '' });
      if (el.querySelector('[data-jt]')) el.querySelector('[data-jt]').onclick = async () => {
        const out = el.querySelector('[data-jtr]'); out.textContent = 'Jev에 한국어 문장 판단을 보내는 중…';
        const r = await ask('할아버지, 오늘 같이 낚시해 줘서 정말 고마워요. 다음에도 꼭 같이 가요!', { tone: { type: 'choice', instructions: '이 편지에 담긴 가장 큰 마음은 무엇인가요?', criteria: { thanks: '고마움', miss: '그리움', sorry: '미안함', promise: '다짐·약속' } } }, () => ({ tone: { type: 'choice', choice: 'thanks', confidence: null } }));
        const c = pick(r.answers, 'tone'); out.innerHTML = `${badge(r, c && c.p)} → <b>${c ? { thanks: '고마움', miss: '그리움', sorry: '미안함', promise: '다짐·약속' }[c.pick] || c.pick : '?'}</b>${c && c.probs ? ` <span style="opacity:.7">(${Object.entries(c.probs).map(([k, v]) => `${k} ${Math.round(v * 100)}%`).join(' · ')})</span>` : ''} — 정답은 '고마움'`;
      };
    };
    draw(); subs.add(draw); return () => subs.delete(draw);
  }
  window.JevKit = {
    ask, pick, yes, score, badge, panel, get state() { return st; },
    reply(id, r) { const w = waits.get(id); if (w) { waits.delete(id); w(r || { ok: false }); } },
    status(s) { Object.assign(st, s || {}); notify(); },
    onChange(fn) { subs.add(fn); return () => subs.delete(fn); },
  };
})();
