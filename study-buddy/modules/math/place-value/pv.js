/* Place Value and Zeros: tools. Problems come from gen.js (MATHGEN). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const G = window.MATHGEN, esc = SB.esc;
  const many = (fn, n = 10) => Array.from({ length: n }, fn);
  const COLS = G.PLACES;      // millions ... thousandths

  /* ===================== Study guide ===================== */
  const guide = {
    init(ctx) {
      const P = ctx.panel;
      P.innerHTML = `<h2>Study guide</h2><p class="lead">Type a number to see each digit in its place.</p>
        <form class="pvform" autocomplete="off"><input class="textin" inputmode="decimal" value="4,382,915.627" aria-label="A number for the place value chart"><button class="btn small" type="submit">Show</button><span class="hint pverr" role="alert"></span></form>
        <div class="tablewrap"><table class="pvchart"><thead><tr>${COLS.map(c => `<th class="${c.exp < 0 ? 'dec' : ''}${c.exp === 0 ? ' ones' : ''}">${c.name}</th>`).join('')}</tr></thead><tbody><tr class="digits"></tr><tr class="vals"></tr></tbody></table></div>
        <div class="rules">
          <div class="rule"><h3>Decimal places</h3><p>The digits after the decimal point are <b>tenths</b>, <b>hundredths</b>, and <b>thousandths</b>. A zero at the end does not change the value: 0.50 = 0.5. More digits does not mean bigger: 0.5 is greater than 0.45.</p></div>
          <div class="rule"><h3>Multiply with zeros</h3><p><b>9,000 × 6,000</b>: multiply the front digits, 9 × 6 = 54. Count the zeros: 3 + 3 = 6. Put them on the end: <b>54,000,000</b>.</p><p class="hint">Watch out: 5,000 × 4 = 20,000. The 0 in 20 counts too.</p></div>
          <div class="rule"><h3>Divide with zeros</h3><p><b>1,200,000 ÷ 3,000</b>: cross out the same number of zeros from both. 3,000 has 3 zeros, so take 3 off each: 1,200 ÷ 3 = <b>400</b>.</p></div>
          <div class="rule"><h3>Times or divided by 10, 100, 1,000</h3><p>Move the decimal point one place for each zero: right to multiply, left to divide. <b>3.45 × 100 = 345</b>, <b>72 ÷ 1,000 = 0.072</b>.</p></div>
        </div>`;
      const show = raw => {
        const s = raw.replace(/[,\s]/g, ''), err = $('.pverr', P);
        if (!/^\d{1,7}(\.\d{0,3})?$/.test(s)) { err.textContent = 'Use up to 7 digits before the decimal point and 3 after.'; return; }
        err.textContent = '';
        const [w, d = ''] = s.split('.'), get = exp => exp >= 0 ? (w.length - 1 - exp >= 0 ? w[w.length - 1 - exp] : '') : (d[-exp - 1] ?? '');
        $('.digits', P).innerHTML = COLS.map(c => { const g = get(c.exp); return `<td class="${c.exp < 0 ? 'dec' : ''}${c.exp === 0 ? ' ones' : ''}">${g}</td>`; }).join('');
        $('.vals', P).innerHTML = COLS.map(c => { const g = get(c.exp); return `<td class="${c.exp < 0 ? 'dec' : ''}${c.exp === 0 ? ' ones' : ''}">${g && g !== '0' ? G.fmtStr(G.placeValue(+g, c.exp)) : ''}</td>`; }).join('');
      };
      $('.pvform', P).onsubmit = e => { e.preventDefault(); show($('.pvform input', P).value); };
      show('4382915.627');
    }
  };

  /* ===================== Tools built on the shared builders ===================== */
  const place = { init(ctx) { SBT.quiz(ctx, { title: 'Place value', lead: 'Pick the best answer.', rounds: 10, build: () => many(G.placeValueQ) }); } };
  const decimals = { init(ctx) { SBT.quiz(ctx, { title: 'Decimal places', lead: 'Compare, round, and read decimals.', rounds: 10, build: () => many(G.decimalQ) }); } };
  const multiply = { init(ctx) { SBT.answer(ctx, { title: 'Multiply with zeros', lead: 'Multiply the front digits, then add the zeros. Commas are optional.', kind: 'number', rounds: 10, build: () => many(() => G.multiplyQ(Math.random() < 0.3)) }); } };
  const divide = { init(ctx) { SBT.answer(ctx, { title: 'Divide with zeros', lead: 'Cross out the same number of zeros from both numbers, then divide.', kind: 'number', rounds: 10, build: () => many(G.divideQ) }); } };
  const powers = { init(ctx) { SBT.answer(ctx, { title: 'Decimals and powers of ten', lead: 'Move the decimal point one place for each zero.', kind: 'number', rounds: 10, build: () => many(G.powersQ) }); } };

  SBM.start({ module: 'place-value', defaults: {}, tools: { guide, place, decimals, multiply, divide, powers } });
})();
