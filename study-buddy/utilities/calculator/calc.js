/* Calculator utility. Follows the order of operations (parentheses first, then × and ÷, then + and −).
   No eval: expressions are parsed with a small shunting-yard parser. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = SB.esc;
  const kid = SB.requireProfile(); if (!kid) return;
  const KEY = SB.moduleKey('calculator');
  let hist = []; try { hist = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) {}
  const saveHist = () => { try { localStorage.setItem(KEY, JSON.stringify(hist.slice(0, 12))); } catch (e) {} };

  /* ---------- math ---------- */
  const OPS = { '+': [1, (a, b) => a + b], '−': [1, (a, b) => a - b], '×': [2, (a, b) => a * b], '÷': [2, (a, b) => { if (b === 0) throw new Error('Can’t divide by 0'); return a / b; }] };
  function tokens(s) {
    const out = []; let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/[0-9.]/.test(c)) { let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++; const t = s.slice(i, j); if ((t.match(/\./g) || []).length > 1) throw new Error('Check your decimal points'); out.push(+t); i = j; continue; }
      if ('+−×÷()'.includes(c)) {
        const prev = out[out.length - 1];
        if (c === '−' && (prev === undefined || (typeof prev === 'string' && prev !== ')'))) { out.push('neg'); i++; continue; }   // a minus sign at the start or after an operator
        out.push(c); i++; continue;
      }
      i++;
    }
    return out;
  }
  function evaluate(s) {
    const out = [], st = [];
    for (const t of tokens(s)) {
      if (typeof t === 'number') out.push(t);
      else if (t === 'neg') st.push(t);
      else if (t === '(') st.push(t);
      else if (t === ')') { while (st.length && st[st.length - 1] !== '(') out.push(st.pop()); if (!st.length) throw new Error('Extra )'); st.pop(); if (st[st.length - 1] === 'neg') out.push(st.pop()); }
      else { while (st.length && st[st.length - 1] !== '(' && (st[st.length - 1] === 'neg' || OPS[st[st.length - 1]][0] >= OPS[t][0])) out.push(st.pop()); st.push(t); }
    }
    while (st.length) { const o = st.pop(); if (o === '(') throw new Error('Missing )'); out.push(o); }
    const v = [];
    for (const t of out) {
      if (typeof t === 'number') v.push(t);
      else if (t === 'neg') { if (!v.length) throw new Error('Not finished'); v.push(-v.pop()); }
      else { if (v.length < 2) throw new Error('Not finished'); const b = v.pop(), a = v.pop(); v.push(OPS[t][1](a, b)); }
    }
    if (v.length !== 1 || !isFinite(v[0])) throw new Error('Not finished');
    const r = +v[0].toPrecision(15);
    if (Math.abs(r) >= 1e15) throw new Error('Too big');
    if (r !== 0 && Math.abs(r) < 1e-6) throw new Error('Too small to show');
    return r;
  }
  /* answers are kept between 1e-6 and 1e15, so JavaScript never writes them with an exponent */
  const fmt = n => { const [i, d] = String(n).split('.'); return i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (d !== undefined ? '.' + d : ''); };
  /* for a plain "a ÷ b" with whole numbers, also show the remainder, like long division */
  function remainder(expr, value) {
    const m = expr.match(/^(\d+)÷(\d+)$/); if (!m || Number.isInteger(value)) return '';
    const a = +m[1], b = +m[2]; if (!b) return '';
    return `${Math.floor(a / b)} R ${a % b}`;
  }

  /* ---------- page ---------- */
  const hub = SB.BASE + 'index.html';
  document.title = 'Calculator · Study Buddy';
  $('#app').innerHTML = `
    <header class="top"><h1><span>Calculator</span></h1></header>
    <section class="panel calcwrap">
      <div class="calc" role="application" aria-label="Calculator">
        <div class="screen" aria-live="polite"><div class="expr" id="expr">&nbsp;</div><div class="result" id="result">0</div><div class="rem" id="rem"></div></div>
        <div class="keys">
          ${['AC', '⌫', '(', ')', '7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', '±', '0', '.', '+'].map(k => `<button class="key ${'÷×−+'.includes(k) ? 'op' : /[0-9.]/.test(k) ? 'num' : 'fn'}" data-k="${k}" aria-label="${({ '⌫': 'Backspace', '÷': 'Divide', '×': 'Times', '−': 'Minus', '+': 'Plus', '±': 'Make negative', AC: 'Clear all' })[k] || k}">${k}</button>`).join('')}
          <button class="key eq" data-k="=" aria-label="Equals">=</button>
        </div>
      </div>
      <div class="hist"><div class="row between"><h3>History</h3><button class="btn ghost small" id="clearHist">Clear</button></div><p class="hint">Tap a line to use its answer.</p><ol id="hist"></ol></div>
    </section>
    <p class="hint calc-tip">Works with the keyboard too: numbers, + − * /, parentheses, Enter, and Backspace. Follows the order of operations.</p>`;
  window.SB_NO_SLASH_SEARCH = true;   // / means divide here, so it does not open the search box
  SB.shell({ utility: 'Calculator' });

  let expr = '', justDone = false;
  const exprEl = $('#expr'), resEl = $('#result'), remEl = $('#rem');
  function paint(final) {
    exprEl.textContent = expr || ' ';
    remEl.textContent = '';
    if (!expr) { resEl.textContent = '0'; resEl.classList.remove('err', 'preview'); return; }
    try {
      const v = evaluate(expr); resEl.textContent = fmt(v); resEl.classList.remove('err'); resEl.classList.toggle('preview', !final);
      const r = remainder(expr, v); if (r) remEl.textContent = r;
      return v;
    } catch (e) { resEl.textContent = final ? e.message : resEl.textContent; resEl.classList.toggle('err', !!final); return null; }
  }
  function renderHist() {
    $('#hist').innerHTML = hist.map((h, i) => `<li><button data-i="${i}"><span>${esc(h.e)} =</span><b>${esc(fmt(h.v))}</b></button></li>`).join('') || '<li class="hint">Nothing yet.</li>';
    $$('#hist button').forEach(b => b.onclick = e => { if (e.detail) b.blur(); expr = String(hist[+b.dataset.i].v).replace('-', '−'); justDone = false; paint(); });
  }
  function press(k) {
    if (k === 'AC') { expr = ''; justDone = false; return paint(); }
    if (k === '⌫') { expr = expr.slice(0, -1); justDone = false; return paint(); }
    if (k === '=') {
      if (!expr) return;
      const v = paint(true);
      if (v !== null && v !== undefined) { hist.unshift({ e: expr, v }); hist = hist.slice(0, 12); saveHist(); renderHist(); justDone = true; SB.sfx.good(); }
      else SB.sfx.bad();
      return;
    }
    if (k === '±') {     // make the last number negative (or positive again)
      const m = expr.match(/(−?)(\d*\.?\d+)$/);
      if (m) { const start = expr.length - m[0].length, before = expr.slice(0, start); const isNeg = m[1] && (start === 0 || /[+−×÷(]$/.test(before)); expr = before + (isNeg ? m[2] : '−' + m[2]); }
      return paint();
    }
    if (justDone) { justDone = false; if (/[0-9.(]/.test(k)) expr = ''; else { const last = hist[0]; expr = last ? String(last.v).replace('-', '−') : expr; } }
    if ('+×÷'.includes(k) && /[+−×÷]$/.test(expr)) expr = expr.slice(0, -1);   // swap one operator for another
    if (k === '.') { const last = expr.split(/[+−×÷()]/).pop(); if (last.includes('.')) return; if (!last) k = '0.'; }
    expr += k; paint();
  }
  $$('.key').forEach(b => b.onclick = e => { press(b.dataset.k); if (e.detail) b.blur(); });   // a mouse or touch tap hands the keyboard back to the calculator
  document.addEventListener('keydown', e => {
    if (e.target.closest('input,textarea,select,.sbmenu,.sbsearch') || document.querySelector('.sb-ov') || ((e.key === 'Enter' || e.key === ' ') && e.target.closest('button,a')) || e.ctrlKey || e.metaKey || e.altKey) return;
    const map = { '*': '×', 'x': '×', 'X': '×', '/': '÷', '-': '−', '+': '+', 'Enter': '=', '=': '=', 'Backspace': '⌫', 'Escape': 'AC', 'Delete': 'AC', '(': '(', ')': ')', '.': '.' };
    const k = /^[0-9]$/.test(e.key) ? e.key : map[e.key];
    if (!k) return; e.preventDefault(); press(k);
    const b = $(`.key[data-k="${k}"]`); if (b) { b.classList.add('down'); setTimeout(() => b.classList.remove('down'), 120); }
  });
  $('#clearHist').onclick = () => { hist = []; saveHist(); renderHist(); };
  renderHist(); paint();
  window.__calc = { evaluate };   // for tests
})();
