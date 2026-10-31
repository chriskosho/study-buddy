/* Decimal Operations: tools. Problems and the step-by-step helper come from gen.js (DECGEN). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const G = window.DECGEN, esc = SB.esc;
  const many = (fn, n = 10) => SBT.many(fn, n);

  /* ===================== Study guide ===================== */
  const guide = {
    init(ctx) {
      const P = ctx.panel;
      P.innerHTML = `<h2>Study guide</h2><p class="lead">Type two decimals, pick what to do with them, and see every step.</p>
        <form class="dform" autocomplete="off"><input class="textin" inputmode="decimal" value="4.8" aria-label="First number"><select aria-label="Operation"><option value="+">+ Add</option><option value="−">− Subtract</option><option value="×">× Multiply</option><option value="÷" selected>÷ Divide</option></select><input class="textin" inputmode="decimal" value="0.6" aria-label="Second number"><button class="btn small" type="submit">Show steps</button></form>
        <div class="derr" role="status"></div><div class="dout" aria-live="polite"></div>
        <div class="rules">
          <div class="rule"><h3>Add and subtract</h3><p>Line up the decimal points. Write zeros so both numbers have the same number of places. Then add or subtract as with whole numbers and bring the point straight down. <b>4.7 + 2.35</b>: 4.70 + 2.35 = <b>7.05</b>.</p></div>
          <div class="rule"><h3>Zeros at the end</h3><p>A zero at the end of a decimal does not change its value: 4.70 and 4.7 are the same. That is why you can add zeros to line things up. A whole number has a decimal point after its last digit: <b>7 = 7.00</b>.</p></div>
          <div class="rule"><h3>Multiply</h3><p>Ignore the points and multiply. Count the decimal places in both numbers and add them. The product has that many. <b>0.6 × 0.04</b>: 6 × 4 = 24, 1 + 2 = 3 places, so <b>0.024</b>.</p></div>
          <div class="rule"><h3>Divide by a whole number</h3><p>Divide as usual and put the point in the answer straight above the point in the dividend. <b>7.5 ÷ 5 = 1.5</b>.</p></div>
          <div class="rule"><h3>Divide by a decimal</h3><p>Move the point in the divisor to the right until it is a whole number, and move the point in the dividend the same number of places. <b>4.8 ÷ 0.6</b> becomes 48 ÷ 6 = <b>8</b>. Both numbers are multiplied by 10, so the answer stays the same.</p></div>
          <div class="rule"><h3>Estimate to check</h3><p>Round each number to the nearest whole number and work it out. <b>4.87 + 3.12</b> is about 5 + 3 = 8. If your answer is far from your estimate, check where you put the decimal point.</p></div>
        </div>`;
      const show = () => {
        const err = $('.derr', P), out = $('.dout', P), f = $('.dform', P);
        try { const r = G.helper(f.querySelectorAll('input')[0].value, f.querySelectorAll('input')[1].value, f.querySelector('select').value);
          out.innerHTML = `<ol class="dsteps">${r.rows.map(x => typeof x === 'string' ? `<li>${esc(x)}</li>` : `<li class="col"><pre aria-label="The numbers lined up in columns">${esc(x.col)}</pre></li>`).join('')}<li class="last"><b>Answer: ${esc(r.answer)}</b></li></ol>`; err.textContent = ''; }
        catch (e) { out.innerHTML = ''; err.textContent = e.message; }
      };
      $('.dform', P).onsubmit = e => { e.preventDefault(); show(); };
      show();
    }
  };

  /* ===================== Tools built on the shared builders ===================== */
  const KEEP = window.__decAnswers = {};   // test hook: the answers shown for each question text (the tests also work most answers out on their own)
  const answerTool = (title, lead, fn) => ({ init(ctx) { SBT.answer(ctx, { title, lead, kind: 'number', rounds: 10, build: () => many(fn).map(it => { KEEP[String(it.q).replace(/<[^>]+>/g, '')] = it.show; return it; }) }); } });
  const quizTool = (title, lead, fn) => ({ init(ctx) { SBT.quiz(ctx, { title, lead, rounds: 10, build: () => many(fn) }); } });
  const pickOf = (...fns) => () => fns[Math.floor(Math.random() * fns.length)]();
  const add = answerTool('Add decimals', 'Line up the decimal points. Commas and zeros at the end are optional.', G.addQ);
  const subtract = answerTool('Subtract decimals', 'Line up the decimal points, adding zeros when you need them.', G.subQ);
  const multiply = answerTool('Multiply decimals', 'Ignore the points, multiply, then count the decimal places.', pickOf(G.mulWholeQ, G.mulDecQ));
  const divide = answerTool('Divide decimals', 'Move the points so the divisor is a whole number, then divide.', pickOf(G.divWholeQ, () => G.divDecQ(), () => G.divDecQ()));
  const estimate = quizTool('Estimate', 'Round each number first, then pick the best estimate.', G.estimateQ);
  const words = answerTool('Word problems', 'Type just the number. Money is in dollars.', G.wordsQ);
  const review = answerTool('Mixed review', 'Missing numbers, more than one step, and bigger decimals.', pickOf(G.missingQ, G.threeStepQ, G.bigQ));

  /* ---- Quiz (Random 10 or One of each) and Flashcards: one list of question types serves both, so every type has a card ---- */
  const toMC = f => () => { const q = f(); return q.wrong && q.show != null ? { q: q.q, a: q.show, wrong: q.wrong, why: q.why, say: q.say } : q; };
  const TYPES = [
    { gen: toMC(G.addQ), cards: [["How do you add decimals?", "Line up the decimal points, write zeros so both numbers have the same number of places, add as with whole numbers, and bring the point straight down. 4.7 + 2.35: 4.70 + 2.35 = 7.05."], ["Does a zero at the end of a decimal change its value?", "No. 4.70 and 4.7 are the same amount, so you can add zeros to line things up."]] },
    { gen: toMC(G.subQ), cards: [["How do you subtract decimals?", "Line up the decimal points, add zeros so both numbers have the same number of places, and subtract as with whole numbers, regrouping when you need to. Bring the point straight down."], ["How do you subtract a decimal from a whole number?", "Write the whole number with a decimal point and zeros. 7 − 2.35: 7.00 − 2.35 = 4.65."]] },
    { gen: toMC(G.mulWholeQ), cards: [["How do you multiply a decimal by a whole number?", "Ignore the point and multiply. Then give the answer as many decimal places as the decimal had. 3.4 × 6: 34 × 6 = 204, one decimal place, so 20.4."]] },
    { gen: toMC(G.mulDecQ), cards: [["How do you multiply two decimals?", "Ignore the points and multiply. Count the decimal places in both numbers and add them. The product has that many. 0.6 × 0.04: 6 × 4 = 24, 1 + 2 = 3 places, so 0.024."], ["What if the product does not have enough digits for the decimal places?", "Write zeros in front. 0.3 × 0.2: 3 × 2 = 6, two places, so 0.06."]] },
    { gen: toMC(G.divWholeQ), cards: [["How do you divide a decimal by a whole number?", "Divide as usual and put the point in the answer straight above the point in the dividend. 7.5 ÷ 5 = 1.5."]] },
    { gen: toMC(() => G.divDecQ()), cards: [["How do you divide by a decimal?", "Move the point in the divisor to the right until it is a whole number, and move the point in the dividend the same number of places. 4.8 ÷ 0.6 becomes 48 ÷ 6 = 8."], ["Why can you move both points the same number of places?", "It is the same as multiplying both numbers by 10, or 100, and that does not change the answer to a division."]] },
    { gen: G.estimateQ, cards: [["How do you estimate with decimals?", "Round each number to the nearest whole number, then add, subtract, multiply, or divide. 4.87 + 3.12 is about 5 + 3 = 8."], ["How can an estimate catch a mistake?", "If your answer is far from the estimate, check where you put the decimal point."]] },
    { gen: toMC(G.wordsQ), cards: [["How do you solve a decimal word problem?", "Decide what the problem asks (add, subtract, multiply, or divide), solve it, and check that the answer makes sense. Money has two decimal places."]] },
    { gen: toMC(G.missingQ), cards: [["How do you find a missing number?", "Use the opposite operation. ? + 3.45 = 8.2 means 8.2 − 3.45 = 4.75. ? × 0.4 = 2.8 means 2.8 ÷ 0.4 = 7."]] },
    { gen: toMC(G.threeStepQ), cards: [["In what order do you work a problem with more than one step?", "Grouping symbols first, then × and ÷ left to right, then + and − left to right. (4.6 + 2.4) × 1.5 = 7 × 1.5 = 10.5."]] },
    { gen: toMC(G.bigQ), cards: [["Do the same rules work for bigger decimals?", "Yes. Line up the points for + and −, count the decimal places for ×, and move both points for ÷."]] }
  ];
  const cards = { init(ctx) { SBT.flashcards(ctx, { lead: 'Tap the card to flip it. These are the rules and facts the questions use.', build: () => SBT.shuffle(TYPES.flatMap(t => t.cards)).map(([q, a]) => ({
    front: `<div class="tag">Rule or fact</div><div class="defline">${esc(q)}</div>`, back: `<div class="tag">Answer</div><div class="defline">${esc(a)}</div>${ctx.sayButton(q + ' ' + a, 'Hear it')}`, say: q })) }); } };
  const quiz = { init(ctx) { SBT.quiz(ctx, { title: 'Quiz', lead: 'One question of each kind about decimal operations. Random 10 mixes them up; One of each asks every kind once.', rounds: 10, fullLabel: 'One of each', full: () => TYPES.map(t => t.gen()), build: () => many(() => TYPES[Math.floor(Math.random() * TYPES.length)].gen()) }); } };

  SBM.start({ module: 'decimal-operations', defaults: {}, tools: { guide, cards, add, subtract, multiply, divide, estimate, words, review, quiz } });
})();
