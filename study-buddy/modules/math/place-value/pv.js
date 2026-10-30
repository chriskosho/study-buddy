/* Place Value and Zeros: tools. Problems come from gen.js (MATHGEN). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const G = window.MATHGEN, esc = SB.esc;
  const many = (fn, n = 10) => SBT.many(fn, n);   // the shared one: no question twice in a round
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

  /* ---- Quiz (Random 10 or One of each) and Flashcards: one list of question types serves both, so every type has a card ---- */
  const TYPES = [
    { gen: () => G.placeValueQ('value'), cards: [["What is the value of a digit in a number?", "The digit times its place. In 4,382, the 3 is in the hundreds place, so its value is 300."], ["Place names to know", "Left of the decimal point: ones, tens, hundreds, thousands, ten thousands, hundred thousands, millions. Right of it: tenths, hundredths, thousandths."]] },
    { gen: () => G.placeValueQ('place'), cards: [["How do you tell which place a digit is in?", "Count from the decimal point. The first place left of it is ones, then tens, hundreds. The first place right of it is tenths, then hundredths, thousandths."]] },
    { gen: () => G.placeValueQ('digit'), cards: [["How is each place related to its neighbors?", "Each place is 10 times the place to its right and 1/10 of the place to its left."]] },
    { gen: () => G.placeValueQ('build'), cards: [["What does a 0 do in a number?", "It holds a place that has nothing in it. 3,050 has 3 thousands, 0 hundreds, 5 tens and 0 ones."]] },
    { gen: () => G.decimalQ('compare'), cards: [["How do you compare two decimals?", "Line up the decimal points and compare from the left, place by place. More digits does not mean a bigger number: 0.5 is greater than 0.45."]] },
    { gen: () => G.decimalQ('round'), cards: [["How do you round a decimal?", "Look at the digit just to the right of the place you are rounding to. If it is 5 or more, round up. If it is 4 or less, keep the digit."]] },
    { gen: () => G.decimalQ('count'), cards: [["How do you count decimal places?", "Count the digits after the decimal point. 3.407 has 3 decimal places."]] },
    { gen: () => G.decimalQ('build'), cards: [["How do you read or write a decimal in words?", "Say the whole number, say \"and\" for the point, then read the digits after it and say the name of the last place. 0.25 is twenty-five hundredths."]] },
    { gen: () => G.decimalQ('same'), cards: [["Does adding a zero at the end of a decimal change its value?", "No. 0.5 and 0.50 are the same amount."]] }
  ];
  const EXTRA_CARDS = [["How do you multiply with zeros?", "Multiply the front digits, then add all the zeros. 30 × 400: 3 × 4 = 12, then add 3 zeros: 12,000."], ["How do you divide with zeros?", "Cross out the same number of zeros from both numbers, then divide. 4,500 ÷ 90 becomes 450 ÷ 9 = 50."], ["How do you multiply or divide by a power of ten?", "Move the decimal point one place for each zero: to the right to multiply, to the left to divide. 3.4 × 100 = 340."]];
  const cards = { init(ctx) { SBT.flashcards(ctx, { lead: 'Tap the card to flip it. These are the rules and facts the questions use.', build: () => SBT.shuffle([...TYPES.flatMap(t => t.cards), ...EXTRA_CARDS]).map(([q, a]) => ({
    front: `<div class="tag">Rule or fact</div><div class="defline">${esc(q)}</div>`, back: `<div class="tag">Answer</div><div class="defline">${esc(a)}</div>${ctx.sayButton(q + ' ' + a, 'Hear it')}`, say: q })) }); } };
  const quiz = { init(ctx) { SBT.quiz(ctx, { title: 'Quiz', lead: 'One question of each kind about place value and decimals. Random 10 mixes them up; One of each asks every kind once.', rounds: 10, fullLabel: 'One of each', full: () => TYPES.map(t => t.gen()), build: () => many(() => TYPES[Math.floor(Math.random() * TYPES.length)].gen()) }); } };

  SBM.start({ module: 'place-value', defaults: {}, tools: { guide, cards, place, decimals, multiply, divide, powers, quiz } });
})();
