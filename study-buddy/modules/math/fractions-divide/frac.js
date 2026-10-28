/* Division of Fractions (Dimensions Math 5, chapter 6): tools. Problems come from gen.js (DIVGEN). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const G = window.DIVGEN, L = window.FRACLIB, esc = SB.esc, many = SBT.many, F = L.F;

  const guide = {
    init(ctx) {
      const P = ctx.panel, f = (n, d) => L.html({ n, d }, 'improper');
      P.innerHTML = `<h2>Study guide</h2><p class="lead">Type two numbers (fractions like 3/4, mixed numbers like 2 1/3, or whole numbers) to see every step of the quotient.</p>
        <form class="fgform" autocomplete="off"><input class="textin" value="3/4" aria-label="Number to divide" inputmode="text"><span aria-hidden="true">&divide;</span><input class="textin" value="2" aria-label="Divide by" inputmode="text"><button class="btn small" type="submit">Show the steps</button></form>
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
        const [a, b] = [...P.querySelectorAll('.fgform .textin')].map(i => parse(i.value)), out = $('.fgout', P);
        if (!a || !b || a.v.d > 24 || b.v.d > 24 || a.v.n > 500 || b.v.n > 500) { out.textContent = 'Use fractions like 3/4, mixed numbers like 2 1/3, or whole numbers. (Keep denominators to 24 or less.)'; return; }
        if (b.v.n === 0) { out.textContent = 'You cannot divide by zero.'; return; }
        out.innerHTML = `<p>${L.html(a.v, a.shown === 'mixed' ? 'mixed' : 'improper')} &divide; ${L.html(b.v, b.shown === 'mixed' ? 'mixed' : 'improper')} = <b>${L.html(L.div(a.v, b.v))}</b></p><p>${esc(G.whyDiv(a.v, b.v, a.shown, b.shown))}</p>`;
      };
      $('.fgform', P).onsubmit = e => { e.preventDefault(); show(); };
      show();
    }
  };

  const fa = (title, lead, fn) => ({ init(ctx) { SBT.answer(ctx, { title, lead, kind: 'fraction', rounds: 10, build: () => many(fn) }); } });
  const FORM = ' Type fractions like 3/4 and mixed numbers like 1 3/4.';
  const share = { init(ctx) { SBT.quiz(ctx, { title: 'Share a unit fraction', lead: 'The shaded part is cut into equal pieces. Pick the fraction of the whole bar for one piece.', rounds: 10, build: () => many(G.shareQ) }); } };
  const fracwhole = fa('Fractions divided by whole numbers', 'Share a fraction equally. Simplest form.' + FORM, G.fracByWholeQ);
  const fit = { init(ctx) { SBT.quiz(ctx, { title: 'How many fit?', lead: 'Each whole is cut into equal parts. How many parts are there in all?', rounds: 10, build: () => many(G.modelQ) }); } };
  const wholefrac = fa('Whole numbers divided by fractions', 'Unit fractions and other fractions. Simplest form.' + FORM, G.wholeByFracQ);
  const words = fa('Word problems', 'Sharing equally, and how many fit.' + FORM, G.wordsQ);
  const review = fa('Mixed review', 'Mixed numbers, fractions by fractions, and missing numbers.' + FORM, G.reviewQ);

  SBM.start({ module: 'fractions-divide', defaults: {}, tools: { guide, share, fracwhole, fit, wholefrac, words, review } });
})();
