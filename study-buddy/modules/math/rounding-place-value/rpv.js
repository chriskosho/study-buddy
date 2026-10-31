/* Rounding and Place Value to 1,000: tools. Problems and pictures come from gen.js (RPVGEN). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const G = window.RPVGEN, esc = SB.esc, fmt = G.fmt;
  const many = (fn, n = 10) => SBT.many(fn, n);

  /* ===================== Study guide ===================== */
  const guide = {
    init(ctx) {
      const P = ctx.panel;
      P.innerHTML = `<h2>Study guide</h2><p class="lead">Type a number to see its places, then slide a number to see how it rounds.</p>
        <div class="rcols"><div>
          <form class="rform rf1" autocomplete="off"><input class="textin" inputmode="numeric" value="538" aria-label="A number from 0 to 1,000"><button class="btn small" type="submit">Show</button></form>
          <div class="rerr rerr1" role="status"></div>
          <table class="rchart"><thead><tr><th>hundreds</th><th>tens</th><th>ones</th></tr></thead><tbody><tr class="dg"></tr><tr class="vl"></tr></tbody></table>
          <p class="rsays rs1" aria-live="polite"></p>
        </div><div>
          <form class="rform rf2" autocomplete="off"><input class="textin" inputmode="numeric" value="47" aria-label="A number to round"><select aria-label="Round to the nearest"><option value="10">nearest 10</option><option value="100">nearest 100</option></select></form>
          <div class="rform"><input type="range" min="0" max="1000" value="47" aria-label="Slide to pick a number to round"></div>
          <div class="rerr rerr2" role="status"></div>
          <div class="rpic"></div><p class="rsays rs2" aria-live="polite"></p>
        </div></div>
        <div class="rules">
          <div class="rule"><h3>Places</h3><p>In 538 there are <b>5 hundreds</b>, <b>3 tens</b>, and <b>8 ones</b>. The value of the 3 is 30. Expanded form: 500 + 30 + 8.</p></div>
          <div class="rule"><h3>Comparing</h3><p>Start with the hundreds. If they match, compare the tens, then the ones. The open side of &lt; or &gt; faces the bigger number: 436 &lt; 463.</p></div>
          <div class="rule"><h3>Rounding</h3><p>Find the two nearest tens (or hundreds) and the halfway mark. Past halfway, round up. Before it, round down. <b>Exactly halfway rounds up</b>: 45 rounds to 50.</p></div>
          <div class="rule"><h3>Estimating</h3><p>Round each number first, then add or subtract. 348 + 215 is about 300 + 200 = 500. An estimate is close, not exact.</p></div>
          <div class="rule"><h3>Adding</h3><p>Add the ones, then the tens, then the hundreds. If a place has 10 or more, regroup: carry 1 to the next place.</p></div>
          <div class="rule"><h3>Subtracting</h3><p>If the top digit is smaller, regroup: take 1 from the next place on the left and add 10 to this place.</p></div>
        </div>`;
      const f1 = $('.rf1', P), f2 = $('.rf2', P), rng = $('input[type=range]', P);
      const show1 = () => {
        const err = $('.rerr1', P);
        try {
          const c = G.chart(f1.querySelector('input').value); err.textContent = '';
          $('.dg', P).innerHTML = c.thousand ? '<td colspan="3">1,000</td>' : `<td>${c.h}</td><td>${c.t}</td><td>${c.o}</td>`;
          $('.vl', P).innerHTML = c.thousand ? '<td colspan="3">10 hundreds</td>' : `<td>${c.h * 100}</td><td>${c.t * 10}</td><td>${c.o}</td>`;
          $('.rs1', P).innerHTML = `<b>${esc(c.expanded)}</b><br>${esc(c.words)}`;
        } catch (e) { err.textContent = e.message; }
      };
      const show2 = () => {
        const err = $('.rerr2', P), raw = f2.querySelector('input').value.replace(/[,\s]/g, ''), step = Number(f2.querySelector('select').value);
        if (!/^\d+$/.test(raw) || Number(raw) > 1000) { err.textContent = 'Type a whole number from 0 to 1,000.'; return; }
        err.textContent = ''; const n = Number(raw); rng.value = n;
        $('.rpic', P).innerHTML = `<div class="rlwrap">${G.roundLine(n, step)}</div>`; $('.rs2', P).textContent = G.roundNote(n, step);
      };
      f1.onsubmit = e => { e.preventDefault(); show1(); };
      f2.onsubmit = e => { e.preventDefault(); show2(); };
      f2.querySelector('input').oninput = show2; f2.querySelector('select').onchange = show2;
      rng.oninput = () => { f2.querySelector('input').value = rng.value; show2(); };
      show1(); show2();
    }
  };

  /* ===================== Tools built on the shared builders ===================== */
  const answerItem = f => () => { const x = f(); return { q: esc(x.q) + (x.html || ''), a: x.a, why: x.why, hint: x.hint, say: x.say }; };
  const answerTool = (title, lead, f) => ({ init(ctx) { SBT.answer(ctx, { title, lead, kind: 'number', rounds: 10, build: () => many(answerItem(f)) }); } });
  const quizTool = (title, lead, f) => ({ init(ctx) { SBT.quiz(ctx, { title, lead, rounds: 10, build: () => many(f) }); } });
  const mixOf = (...fs) => () => pickOne(fs)();
  const pickOne = a => a[Math.floor(Math.random() * a.length)];

  const place = quizTool('Place value', 'Pick the best answer.', mixOf(G.placeValueQ, G.placeDigitQ, G.placeExpandedQ, G.placeWordQ));
  const compare = quizTool('Compare and order', 'Compare from the hundreds first.', mixOf(G.compareSymQ, G.compareSymQ, G.compareOrderQ));
  const round10 = answerTool('Round to the nearest 10', 'Look at the ones digit. Exactly halfway rounds up. Commas are optional.', G.round10Q);
  const round100 = answerTool('Round to the nearest 100', 'Look at the tens digit. Exactly halfway rounds up. Commas are optional.', G.round100Q);
  const estimate = quizTool('Estimate sums and differences', 'Round first, then add or subtract.', G.estimatePickQ);
  const addsub = answerTool('Add and subtract within 1,000', 'Add or subtract. Regroup when you need to. Commas are optional.', mixOf(G.addQ, G.subQ));
  const words = answerTool('Word problems', 'Decide what to do, then work it out. Commas are optional.', G.wordsQ);

  /* ---- Quiz (Random 10 or One of each) and Flashcards: one list of question types serves both, so every type has a card ---- */
  const toMC = f => () => { const x = f(); return { q: x.q, html: x.html, a: fmt(x.a), wrong: x.wrong.map(fmt), why: x.why, say: x.say }; };
  const TYPES = [
    { gen: G.placeValueQ, cards: [["What is the value of a digit?", "The digit times its place. In 538, the 3 is in the tens place, so its value is 30."], ["What are the places in a 3-digit number?", "Hundreds, tens, and ones, from left to right. 538 has 5 hundreds, 3 tens, and 8 ones."]] },
    { gen: G.placeDigitQ, cards: [["What comes after 999?", "1,000, one thousand. It is 10 hundreds."]] },
    { gen: G.placeExpandedQ, cards: [["What is expanded form?", "A number written as the value of each digit added up. 538 = 500 + 30 + 8. A zero place is left out: 407 = 400 + 7."]] },
    { gen: G.placeWordQ, cards: [["How do you write a number in words?", "Say the hundreds, then the tens and ones. 538 is five hundred thirty-eight. Numbers like 38 get a hyphen: thirty-eight."]] },
    { gen: G.compareSymQ, cards: [["What do < and > mean?", "The open side faces the bigger number. 436 < 463 and 463 > 436. The = sign means the same amount."]] },
    { gen: G.compareOrderQ, cards: [["How do you compare 3-digit numbers?", "Start with the hundreds. If they match, compare the tens, then the ones. The first place that is different decides."]] },
    { gen: toMC(G.round10Q), cards: [["How do you round to the nearest 10?", "Look at the ones digit. 4 or less: keep the tens digit and make the ones 0. 5 or more: add 1 to the tens digit and make the ones 0."], ["What does 45 round to, to the nearest 10?", "50. A number exactly halfway rounds up."]] },
    { gen: toMC(G.round100Q), cards: [["How do you round to the nearest 100?", "Look at the tens digit. 4 or less: keep the hundreds digit. 5 or more: add 1 to the hundreds digit. Then the tens and ones become 0."], ["What does 962 round to, to the nearest 100?", "1,000. The tens digit is 6, so round up, and 9 hundreds plus 1 more hundred is 10 hundreds."]] },
    { gen: G.estimateSumQ, cards: [["How do you estimate a sum?", "Round each number first, then add the rounded numbers. 348 + 215 is about 300 + 200 = 500. About means close, not exact."]] },
    { gen: G.estimateDiffQ, cards: [["How do you estimate a difference?", "Round each number first, then subtract. 774 − 296 is about 800 − 300 = 500."]] },
    { gen: toMC(G.addQ), cards: [["How do you add 3-digit numbers?", "Add the ones, then the tens, then the hundreds. If a place has 10 or more, write the ones and carry the tens. 276 + 158 = 434."]] },
    { gen: toMC(G.subQ), cards: [["How do you subtract with regrouping?", "If the top digit is smaller, take 1 from the next place on the left and add 10 to this place. 432 − 187: 12 − 7 = 5, 12 − 8 = 4, 3 − 1 = 2, so 245."]] },
    { gen: toMC(G.wordsQ), cards: [["How can you check an answer?", "Ask if it makes sense, and estimate with rounding. Adding and subtracting undo each other, so you can check 276 + 158 = 434 by working 434 − 158."]] }
  ];
  const cards = { init(ctx) { SBT.flashcards(ctx, { lead: 'Tap the card to flip it. These are the rules and facts the questions use.', build: () => SBT.shuffle(TYPES.flatMap(t => t.cards)).map(([q, a]) => ({
    front: `<div class="tag">Rule or fact</div><div class="defline">${esc(q)}</div>`, back: `<div class="tag">Answer</div><div class="defline">${esc(a)}</div>${ctx.sayButton(q + ' ' + a, 'Hear it')}`, say: q })) }); } };
  const quiz = { init(ctx) { SBT.quiz(ctx, { title: 'Quiz', lead: 'One question of each kind about place value and rounding. Random 10 mixes them up; One of each asks every kind once.', rounds: 10, fullLabel: 'One of each', full: () => TYPES.map(t => t.gen()), build: () => many(() => TYPES[Math.floor(Math.random() * TYPES.length)].gen()) }); } };

  SBM.start({ module: 'rounding-place-value', defaults: {}, tools: { guide, cards, place, compare, round10, round100, estimate, addsub, words, quiz } });
})();
