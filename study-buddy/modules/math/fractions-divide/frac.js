/* Division of Fractions (Dimensions Math 5, chapter 6): tools. Problems come from gen.js (DIVGEN). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const G = window.DIVGEN, L = window.FRACLIB, esc = SB.esc, shuffle = SBT.shuffle, many = SBT.many, F = L.F;

  const guide = {
    init(ctx) {
      const P = ctx.panel, f = (n, d) => L.html({ n, d }, 'improper');
      P.innerHTML = `<h2>Study guide</h2><p class="lead">Fill in two numbers (fractions, mixed numbers, or whole numbers) to see every step of the quotient. A whole number goes in the small box on the left; the top and bottom go above and below the line.</p>
        <form class="fgform" autocomplete="off">${SBT.fracBox('Number to divide', '3/4')}<span aria-hidden="true">&divide;</span>${SBT.fracBox('Divide by', '2')}<button class="btn small" type="submit">Show the steps</button></form>
        <div class="fgout" aria-live="polite"></div>
        <div class="rules">
          <div class="rule"><h3>A unit fraction shared equally</h3><p>${f(1, 3)} &divide; 2: share one third into 2 equal pieces. Each piece is ${f(1, 6)} of the whole.</p>${G.bar(3, 2)}<p>Multiply the bottom: ${f(1, 3)} &divide; 2 = ${f(1, 3)} &times; ${f(1, 2)} = <b>${f(1, 6)}</b>.</p></div>
          <div class="rule"><h3>A fraction divided by a whole number</h3><p>${f(3, 4)} &divide; 2: share 3 fourths into 2 equal groups: cut each fourth in half to make eighths, and each group gets 3 eighths. ${f(3, 4)} &divide; 2 = ${f(3, 4)} &times; ${f(1, 2)} = <b>${f(3, 8)}</b>.</p></div>
          <div class="rule"><h3>A whole number divided by a unit fraction</h3><p>4 &divide; ${f(1, 3)}: how many thirds are in 4? There are 3 in each whole, so 4 &times; 3 = <b>12</b>.</p></div>
          <div class="rule"><h3>Divide by a fraction</h3><p>Multiply by the <b>reciprocal</b> (swap the top and bottom). 3 &divide; ${f(3, 4)} = 3 &times; ${f(4, 3)} = ${f(12, 3)} = <b>4</b>.</p><p>Check by multiplying back: 4 &times; ${f(3, 4)} = 3.</p></div>
          <div class="rule"><h3>Fraction divided by fraction</h3><p>${f(2, 3)} &divide; ${f(4, 5)} = ${f(2, 3)} &times; ${f(5, 4)} = ${f(10, 12)} = <b>${f(5, 6)}</b>.</p></div>
          <div class="rule"><h3>Mixed numbers</h3><p>Change to improper fractions first. ${L.html(F(5, 2))} &divide; 3 = ${f(5, 2)} &times; ${f(1, 3)} = <b>${f(5, 6)}</b>.</p></div>
        </div>`;
      const parse = raw => {
        const t = raw.trim().replace(/\s+/g, ' '); let m;
        if ((m = t.match(/^(\d+) (\d+) ?\/ ?(\d+)$/))) return +m[3] && +m[2] < +m[3] ? { v: F(+m[1] * +m[3] + +m[2], +m[3]), shown: 'mixed' } : null;
        if ((m = t.match(/^(\d+) ?\/ ?(\d+)$/))) return +m[2] ? { v: F(+m[1], +m[2]), shown: 'i' } : null;
        if ((m = t.match(/^(\d+)$/))) return { v: F(+m[1], 1), shown: 'i' };
        return null;
      };
      const show = () => {
        const [a, b] = [...P.querySelectorAll('.fgform .fbox')].map(i => parse(i.value)), out = $('.fgout', P);
        if (!a || !b || a.v.d > 24 || b.v.d > 24 || a.v.n > 500 || b.v.n > 500) { out.textContent = 'Check the boxes. A fraction needs both a top and a bottom number, and the bottom cannot be 0. (Keep denominators to 24 or less.)'; return; }
        if (b.v.n === 0) { out.textContent = 'You cannot divide by zero.'; return; }
        out.innerHTML = `<p>${L.html(a.v, a.shown === 'mixed' ? 'mixed' : 'improper')} &divide; ${L.html(b.v, b.shown === 'mixed' ? 'mixed' : 'improper')} = <b>${L.html(L.div(a.v, b.v))}</b></p><p>${SBT.stackText(G.whyDiv(a.v, b.v, a.shown, b.shown))}</p>`;
      };
      SBT.wireFrac(P);
      $('.fgform', P).onsubmit = e => { e.preventDefault(); show(); };
      show();
    }
  };

  const fa = (title, lead, fn) => ({ init(ctx) { SBT.answer(ctx, { title, lead, kind: 'fraction', rounds: 10, build: () => many(fn) }); } });
  const FORM = ' Whole number in the small box, fraction top and bottom in the others.';
  const share = { init(ctx) { SBT.quiz(ctx, { title: 'Share a unit fraction', lead: 'The shaded part is cut into equal pieces. Pick the fraction of the whole bar for one piece.', rounds: 10, build: () => many(G.shareQ) }); } };
  const fracwhole = fa('Fractions divided by whole numbers', 'Share a fraction equally. Simplest form.' + FORM, G.fracByWholeQ);
  const fit = { init(ctx) { SBT.quiz(ctx, { title: 'How many fit?', lead: 'Each whole is cut into equal parts. How many parts are there in all?', rounds: 10, build: () => many(G.modelQ) }); } };
  const wholefrac = fa('Whole numbers divided by fractions', 'Unit fractions and other fractions. Simplest form.' + FORM, G.wholeByFracQ);
  const words = fa('Word problems', 'Sharing equally, and how many fit.' + FORM, G.wordsQ);
  const review = fa('Mixed review', 'Mixed numbers, fractions by fractions, and missing numbers.' + FORM, G.reviewQ);

  /* ---- Quiz (Random 10 or One of each) and Flashcards: one list of problem types serves both, so every type has a card ---- */
  const TYPES = [
    { name: "Fractions divided by whole numbers", gen: G.fracByWholeQ, cards: [["How do you divide a fraction by a whole number?", "Share it equally: multiply the bottom number by the whole number. 1/2 ÷ 3 = 1/6."]] },
    { name: "Whole numbers divided by fractions", gen: G.wholeByFracQ, cards: [["How do you divide a whole number by a unit fraction?", "Multiply the whole number by the bottom number. 3 ÷ 1/4 = 3 × 4 = 12."]] },
    { name: "Word problems", gen: G.wordsQ, cards: [["How do you decide how to divide in a word problem?", "Sharing equally means divide by the number of shares. How many fit means divide by the size of each part."]] }
  ];
  const cards = { init(ctx) { SBT.flashcards(ctx, { lead: 'Tap the card to flip it. These are the rules and facts the problems use.', build: () => shuffle(TYPES.flatMap(t => t.cards)).map(([q, a]) => ({
    front: `<div class="tag">Rule or fact</div><div class="defline">${esc(q)}</div>`, back: `<div class="tag">Answer</div><div class="defline">${esc(a)}</div>${ctx.sayButton(q + ' ' + a, 'Hear it')}`, say: q })) }); } };
  const quiz = { init(ctx) { SBT.answer(ctx, { title: 'Quiz', lead: 'One problem from each kind in this module. Random 10 mixes them up; One of each asks every kind once.' + FORM, kind: 'fraction', rounds: 10, fullLabel: 'One of each', full: () => TYPES.map(t => t.gen()), build: () => many(() => TYPES[Math.floor(Math.random() * TYPES.length)].gen()) }); } };

  SBM.start({ module: 'fractions-divide', defaults: {}, tools: { guide, cards, share, fracwhole, fit, wholefrac, words, review, quiz } });
})();
