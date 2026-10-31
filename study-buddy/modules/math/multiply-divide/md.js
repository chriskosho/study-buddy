/* Multi-Digit Multiplication and Long Division: tools. Problems and the step helpers come from gen.js (MDGEN). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const G = window.MDGEN, esc = SB.esc, fmt = G.fmt;
  const many = (fn, n = 10) => SBT.many(fn, n);

  /* ===================== Study guide ===================== */
  const MAXA = 99999, MAXB = 9999;
  function readNum(raw, which) {
    const s = String(raw).replace(/[,\s]/g, '');
    if (!s) throw new Error('Type two whole numbers, like 428 and 36.');
    if (/^-/.test(s)) throw new Error('Use whole numbers, not negative numbers.');
    if (/[.]/.test(s)) throw new Error('Use whole numbers only (no decimal point).');
    if (!/^\d+$/.test(s)) throw new Error(`Use digits only in the ${which} number, like 428.`);
    return Number(s);
  }
  function mulHTML(a, b) {
    const ps = G.partials(a, b), prod = a * b, w = String(prod).length + 2, row = (t, pre = '') => pre + t.padStart(w - pre.length);
    const lines = [row(String(a)), row(String(b), '×'), '─'.repeat(w), ...ps.map(p => row(String(p.value))), ...(ps.length > 1 ? ['─'.repeat(w), row(String(prod))] : [])];
    const list = ps.length ? ps.map(p => `<li>${esc(fmt(a))} × ${esc(fmt(p.part))} = ${esc(fmt(p.value))} (${esc(G.NAMES[10 ** (String(p.part).length - 1)] || 'place')})</li>`).join('') + (ps.length > 1 ? `<li>Add: ${esc(ps.map(p => fmt(p.value)).join(' + '))} = <b>${esc(fmt(prod))}</b></li>` : '') : '<li>Anything times 0 is 0.</li>';
    const area = G.parts(a).length <= 4 && G.parts(b).length <= 3 && a && b ? `<h3>Area model</h3>${G.areaSVG(a, b)}<p class="hint">Add every box to get ${esc(fmt(prod))}.</p>` : '';
    return `<h3>Multiply: ${esc(fmt(a))} × ${esc(fmt(b))} = ${esc(fmt(prod))}</h3><div class="mdgrid"><div><div class="mdscroll"><pre class="mdcalc" aria-label="The standard method, ${esc(a + ' times ' + b)}">${esc(lines.join('\n'))}</pre></div><ul class="mdlines">${list}</ul></div><div>${area}</div></div>`;
  }
  function divHTML(a, b) {
    if (b === 0) return '<h3>Divide</h3><p class="ooerr">You cannot divide by zero.</p>';
    const L = G.longDiv(a, b);
    if (!L.steps.length) return `<h3>Divide: ${esc(fmt(a))} ÷ ${esc(fmt(b))}</h3><p>${esc(fmt(b))} is bigger than ${esc(fmt(a))}, so it goes in 0 times. <b>${esc(fmt(a))} ÷ ${esc(fmt(b))} = 0 R ${esc(fmt(a))}</b></p>`;
    const items = L.steps.map((st, k) => `<li><span class="st">${esc(fmt(b))} into ${esc(fmt(st.cur))}: ${st.qd} time${st.qd === 1 ? '' : 's'}</span><span class="nt">${k === 0 ? `Start with the first digits that ${esc(fmt(b))} fits into: ${esc(fmt(st.cur))}. ` : `Bring down ${st.bring} to make ${esc(fmt(st.cur))}. `}${st.qd === 0 ? `${esc(fmt(b))} does not fit, so write 0.` : `${st.qd} × ${esc(fmt(b))} = ${esc(fmt(st.prod))}. ${esc(fmt(st.cur))} − ${esc(fmt(st.prod))} = ${esc(fmt(st.rem))}.`}</span></li>`).join('');
    const ans = `${fmt(L.q)}${L.r ? ' R ' + fmt(L.r) : ''}`;
    return `<h3>Divide: ${esc(fmt(a))} ÷ ${esc(fmt(b))} = ${esc(ans)}</h3><ol class="mdsteps">${items}<li class="last"><span class="st">${esc(ans)}</span><span class="nt">Check: ${esc(fmt(L.q))} × ${esc(fmt(b))}${L.r ? ' + ' + esc(fmt(L.r)) : ''} = ${esc(fmt(a))}.</span></li></ol>`;
  }
  const guide = {
    init(ctx) {
      const P = ctx.panel;
      P.innerHTML = `<h2>Study guide</h2><p class="lead">Type two whole numbers. See them multiplied and divided, one step at a time.</p>
        <form class="mdform" autocomplete="off"><input class="textin" value="428" aria-label="First number" inputmode="numeric"><span class="mdsign" aria-hidden="true">× and ÷</span><input class="textin" value="36" aria-label="Second number" inputmode="numeric"><button class="btn small" type="submit">Show steps</button></form>
        <div class="mderr" role="status"></div><div class="mdout" aria-live="polite"></div>
        <div class="ladder">
          <div class="rung"><h3><span class="no">1</span>Divide</h3><p>How many times does the divisor fit into the first digits?</p></div>
          <div class="rung"><h3><span class="no">2</span>Multiply</h3><p>Multiply that digit by the divisor.</p></div>
          <div class="rung"><h3><span class="no">3</span>Subtract</h3><p>Subtract to see what is left.</p></div>
          <div class="rung"><h3><span class="no">4</span>Bring down</h3><p>Bring down the next digit and repeat.</p></div>
        </div>
        <div class="rules">
          <div class="rule"><h3>Multiply row by row</h3><p><b>47 × 36</b>: 47 × 6 = 282. Then 47 × 30 = 1,410 (the 0 holds the ones place). Add: 282 + 1,410 = <b>1,692</b>.</p></div>
          <div class="rule"><h3>The area model</h3><p>Split each number by place value: 47 = 40 + 7 and 36 = 30 + 6. Fill each box (40 × 30 = 1,200, 7 × 30 = 210, 40 × 6 = 240, 7 × 6 = 42) and add: <b>1,692</b>.</p></div>
          <div class="rule"><h3>Check a division</h3><p>Multiply the answer by the divisor, then add the remainder. <b>411 R 1</b> for 1,234 ÷ 3: 411 × 3 + 1 = 1,234.</p></div>
          <div class="rule"><h3>The remainder</h3><p>The remainder is always smaller than the divisor. If it is not, the divisor fits one more time.</p></div>
          <div class="rule"><h3>Estimate to check</h3><p>For 1,764 ÷ 42, think 42 is about 40. 176 ÷ 40 is about 4, so the first digit of the answer is near 4.</p></div>
          <div class="rule"><h3>What the leftover means</h3><p>Sometimes round up (buses for 158 students), sometimes drop it (full boxes), and sometimes the leftover is the answer.</p></div>
        </div>`;
      const show = () => {
        const err = $('.mderr', P), out = $('.mdout', P), v = [...P.querySelectorAll('.mdform .textin')].map(i => i.value);
        try {
          const a = readNum(v[0], 'first'), b = readNum(v[1], 'second');
          if (a > MAXA || b > MAXB) throw new Error(`Use numbers up to ${fmt(MAXA)} for the first and ${fmt(MAXB)} for the second.`);
          out.innerHTML = mulHTML(a, b) + divHTML(a, b); err.textContent = '';
        } catch (e) { out.innerHTML = ''; err.textContent = e.message; }
      };
      $('.mdform', P).onsubmit = e => { e.preventDefault(); show(); };
      show();
    }
  };

  /* ===================== Tools built on the shared builders ===================== */
  const remember = (fn, n = 10) => () => { const l = many(fn, n); window.__mdList = l; return l; };   // the test reads the current round from here
  const numTool = (title, lead, fn) => ({ init(ctx) { SBT.answer(ctx, { title, lead, kind: 'number', rounds: 10, build: remember(fn) }); } });
  const textTool = (title, lead, fn) => ({ init(ctx) { SBT.answer(ctx, { title, lead, kind: 'text', rounds: 10, build: remember(fn) }); } });
  const mcTool = (title, lead, fn) => ({ init(ctx) { SBT.quiz(ctx, { title, lead, rounds: 10, build: remember(fn) }); } });
  const areamodel = mcTool('Area model', 'Break each number into place-value parts, then use the boxes.', G.areaQ);
  const multiply = numTool('Multiply by 2-digit numbers', 'Multiply by each digit and add the rows. Commas are optional.', G.multiplyQ);
  const bigmult = numTool('Bigger products', 'Take your time: one row for each digit. Commas are optional.', G.bigmultQ);
  const div1 = textTool('Divide by 1-digit numbers', 'Write any remainder like 12 R 3. If there is no remainder, just write the number.', G.div1Q);
  const div2 = textTool('Divide by 2-digit numbers', 'Estimate each digit of the answer. Write any remainder like 42 R 5.', G.div2Q);
  const remainders = mcTool('Remainders', 'Decide what the leftover means for the question.', G.remaindersQ);
  const words = numTool('Word problems', 'Decide what to do, then work it out. Commas are optional.', G.wordsQ);

  /* ---- Quiz (Random 10 or One of each) and Flashcards: one list of question types serves both, so every type has a card ---- */
  const mcNum = f => () => { const q = f(); return { q: q.q, a: fmt(q.a), wrong: q.wrong.map(fmt), why: q.why, say: q.say, chk: q.chk }; };
  const mcTxt = f => () => { const q = f(); return { q: `${q.q} (${q.show && / R /.test(q.show) ? 'write the quotient and the remainder' : 'write the quotient; add R and the remainder only if there is one'})`, a: q.show, wrong: q.wrong, why: q.why, say: q.say }; };
  const TYPES = [
    { gen: () => G.areaQ('part'), cards: [["How does an area model work?", "Split each number by place value, like 47 = 40 + 7. Multiply each pair of parts to fill the boxes, then add all the boxes."], ["What is 40 × 30?", "1,200. Multiply the front digits, 4 × 3 = 12, then add the two zeros."]] },
    { gen: () => G.areaQ('total'), cards: [["How do you get the product from an area model?", "Add every box. For 47 × 36: 1,200 + 210 + 240 + 42 = 1,692."]] },
    { gen: mcNum(G.multiplyQ), cards: [["What are the steps to multiply 47 × 36?", "47 × 6 = 282. Then 47 × 30 = 1,410 (put a 0 in the ones place first). Add: 282 + 1,410 = 1,692."], ["Why do you write a 0 in the second row?", "The second row multiplies by the tens digit, so it is really × 30. The 0 holds the ones place."]] },
    { gen: mcNum(G.bigmultQ), cards: [["How do you multiply 428 × 36?", "428 × 6 = 2,568. 428 × 30 = 12,840. Add: 2,568 + 12,840 = 15,408."], ["How many rows does a 3-digit by 3-digit multiplication have?", "One row for each nonzero digit of the second number (three for 135), with the zeros in place. 214 × 135: 214 × 5 = 1,070; 214 × 30 = 6,420; 214 × 100 = 21,400. Add: 28,890."]] },
    { gen: mcTxt(G.div1Q), cards: [["What are the four steps of long division?", "Divide, multiply, subtract, bring down. Then repeat with the next digit."], ["How do you check a division answer?", "Multiply the answer by the divisor, then add the remainder. 1,234 ÷ 3 = 411 R 1, and 411 × 3 + 1 = 1,234."]] },
    { gen: mcTxt(G.div2Q), cards: [["How do you divide by a 2-digit number?", "Use the same four steps. Estimate each digit by rounding the divisor: for 1,764 ÷ 42, think 176 ÷ 40 is about 4. 4 × 42 = 168, 176 − 168 = 8, bring down 4, and 84 ÷ 42 = 2. The answer is 42."], ["Why can the remainder never be as big as the divisor?", "If it were, the divisor would fit one more time. A remainder is always smaller than the divisor."]] },
    { gen: () => G.remaindersQ('left'), cards: [["What is a remainder?", "What is left over after making equal groups. 25 ÷ 4 = 6 R 1: six full groups with 1 left over."]] },
    { gen: () => G.remaindersQ('up'), cards: [["When do you round the answer up?", "When the leftovers still need a group. 158 students with 40 on each bus: 158 ÷ 40 = 3 R 38, so 4 buses are needed."]] },
    { gen: () => G.remaindersQ('drop'), cards: [["When do you drop the remainder?", "When only full groups count. 187 pencils in boxes of 12 is 15 R 7, so there are 15 full boxes."]] },
    { gen: mcNum(G.wordsQ), cards: [["How do you decide which operation to use?", "Equal groups and you want the total: multiply. A total split into equal groups: divide. Then reread the question to see what any leftover means."]] }
  ];
  const cards = { init(ctx) { SBT.flashcards(ctx, { lead: 'Tap the card to flip it. These are the rules and facts the questions use.', build: () => SBT.shuffle(TYPES.flatMap(t => t.cards)).map(([q, a]) => ({
    front: `<div class="tag">Rule or fact</div><div class="defline">${esc(q)}</div>`, back: `<div class="tag">Answer</div><div class="defline">${esc(a)}</div>${ctx.sayButton(q + ' ' + a, 'Hear it')}`, say: q })) }); } };
  const quiz = { init(ctx) { SBT.quiz(ctx, { title: 'Quiz', lead: 'One question of each kind about multiplying and dividing big numbers. Random 10 mixes them up; One of each asks every kind once.', rounds: 10, fullLabel: 'One of each', full: () => TYPES.map(t => t.gen()), build: () => many(() => TYPES[Math.floor(Math.random() * TYPES.length)].gen()) }); } };

  SBM.start({ module: 'multiply-divide', defaults: {}, tools: { guide, cards, areamodel, multiply, bigmult, div1, div2, remainders, words, quiz } });
})();
