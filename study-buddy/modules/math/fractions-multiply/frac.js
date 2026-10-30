/* Multiplication of Fractions (Dimensions Math 5, chapter 5): tools. Problems come from gen.js (MULGEN). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const G = window.MULGEN, L = window.FRACLIB, esc = SB.esc, many = SBT.many, F = L.F;

  /* ===================== Study guide ===================== */
  const guide = {
    init(ctx) {
      const P = ctx.panel, f = (n, d) => L.html({ n, d }, 'improper');
      P.innerHTML = `<h2>Study guide</h2><p class="lead">Fill in two numbers (fractions, mixed numbers, or whole numbers) to see every step of the product. A whole number goes in the small box on the left; the top and bottom go above and below the line.</p>
        <form class="fgform" autocomplete="off">${SBT.fracBox('First number', '2/3')}<span aria-hidden="true">&times;</span>${SBT.fracBox('Second number', '3/4')}<button class="btn small" type="submit">Show the steps</button></form>
        <div class="fgout" aria-live="polite"></div>
        <div class="rules">
          <div class="rule"><h3>A fraction times a whole number</h3><p>${f(3, 4)} &times; 5 means 5 groups of ${f(3, 4)}. Multiply the top by 5 and keep the bottom: ${f(15, 4)} = <b>${L.html(F(15, 4))}</b>.</p><p>A fraction <b>of</b> a number means multiply. ${f(2, 3)} of 12: 12 &divide; 3 = 4, and 2 &times; 4 = <b>8</b>.</p></div>
          <div class="rule"><h3>Fraction times fraction</h3><p>Multiply the tops, then multiply the bottoms. ${f(2, 3)} &times; ${f(3, 5)} = ${f(6, 15)} = <b>${f(2, 5)}</b>.</p><p>Unit fractions: ${f(1, 2)} &times; ${f(1, 3)} = ${f(1, 6)}. Half of a third is a sixth.</p><p>Cancel first to keep numbers small: ${f(2, 3)} &times; ${f(3, 5)}, the 3 on top and the 3 on the bottom cancel.</p></div>
          <div class="rule"><h3>The area model</h3><p>Cut a square into columns for one fraction and rows for the other. The overlap is the product.</p>${G.area(F(2, 3), F(3, 4))}<p>${f(2, 3)} &times; ${f(3, 4)} = ${f(6, 12)} = <b>${f(1, 2)}</b>.</p></div>
          <div class="rule"><h3>Mixed numbers</h3><p>Change each mixed number to an improper fraction, then multiply.</p><p>${L.html(F(7, 3))} &times; ${f(3, 4)}: ${L.html(F(7, 3))} = ${f(7, 3)}, so ${f(7, 3)} &times; ${f(3, 4)} = ${f(21, 12)} = <b>${L.html(F(7, 4))}</b>.</p></div>
          <div class="rule"><h3>Bigger or smaller?</h3><p>Times a fraction <b>less than 1</b> the product is smaller than the number. Times <b>1</b> (like ${f(5, 5)}) it stays the same. Times a number <b>more than 1</b> it gets bigger.</p></div>
          <div class="rule"><h3>Reciprocals</h3><p>The <b>reciprocal</b> swaps the top and the bottom. The reciprocal of ${f(3, 5)} is ${f(5, 3)}. The reciprocal of 4 is ${f(1, 4)}.</p><p>A number times its reciprocal is always <b>1</b>: ${f(3, 5)} &times; ${f(5, 3)} = ${f(15, 15)} = 1.</p></div>
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
        const res = L.mul(a.v, b.v), area = a.shown === 'i' && b.shown === 'i' && a.v.n < a.v.d && b.v.n < b.v.d && a.v.n && b.v.n && a.v.d <= 8 && b.v.d <= 8;
        out.innerHTML = `<p>${L.html(a.v, a.shown === 'mixed' ? 'mixed' : 'improper')} &times; ${L.html(b.v, b.shown === 'mixed' ? 'mixed' : 'improper')} = <b>${L.html(res)}</b></p><p>${SBT.stackText(G.whyMul([a, b]))}</p>${area ? G.area(a.v, b.v) : ''}`;
      };
      SBT.wireFrac(P);
      $('.fgform', P).onsubmit = e => { e.preventDefault(); show(); };
      show();
    }
  };

  const fa = (title, lead, fn) => ({ init(ctx) { SBT.answer(ctx, { title, lead, kind: 'fraction', rounds: 10, build: () => many(fn) }); } });
  const FORM = ' Whole number in the small box, fraction top and bottom in the others.';
  const whole = fa('Fractions times whole numbers', 'Multiply a fraction by a whole number, in either order. Simplest form.' + FORM, G.wholeMulQ);
  const fractionof = fa('Fraction of a number', 'A fraction of a number means multiply.' + FORM, G.fractionOfQ);
  const models = { init(ctx) { SBT.quiz(ctx, { title: 'Use the area model', lead: 'The orange columns and green rows overlap. Pick the product.', rounds: 10, build: () => many(G.modelQ) }); } };
  const fraction = fa('Multiply fractions', 'Unit fractions, two fractions, or three factors. Simplest form.' + FORM, G.fractionMulQ);
  const scale = { init(ctx) {
    SBT.sort(ctx, { title: 'Bigger, smaller or the same?', lead: 'Without finding the product, sort each by whether it is less than, equal to, or more than the first number.',
      sets: [{ id: 'scale', label: 'Compare', buckets: [{ id: 'less', name: 'Less than the number' }, { id: 'equal', name: 'Equal to the number' }, { id: 'more', name: 'More than the number' }], items: [], make: () => G.scaleSet().items }],
      right: (it, b) => 'Yes! ' + it.text + ' is ' + b.name.toLowerCase() + '.' });
  } };
  const recip = fa('Reciprocals', 'Swap the top and the bottom.' + FORM, G.reciprocalQ);
  const mixed = fa('Multiply mixed numbers', 'Change to improper fractions, multiply, then simplify.' + FORM, G.mixedMulQ);
  const words = fa('Word problems', 'Recipes, gardens, and parts of parts.' + FORM, G.wordsQ);
  const review = fa('Mixed review', 'Three or more factors, missing factors, and parentheses.' + FORM, G.reviewQ);

  SBM.start({ module: 'fractions-multiply', defaults: {}, tools: { guide, whole, fractionof, models, fraction, scale, recip, mixed, words, review } });
})();
