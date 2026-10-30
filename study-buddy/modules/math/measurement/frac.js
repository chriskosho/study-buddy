/* Measurement and Area (Dimensions Math 5, chapter 7): tools. Problems come from gen.js (MEAGEN). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const G = window.MEAGEN, L = window.FRACLIB, esc = SB.esc, shuffle = SBT.shuffle, many = SBT.many, F = L.F;

  const guide = {
    init(ctx) {
      const P = ctx.panel, f = (n, d) => L.html({ n, d }, 'improper');
      P.innerHTML = `<h2>Study guide</h2><p class="lead">Choose a shape, fill in its measurements (a whole number goes in the small box on the left; the top and bottom of a fraction go above and below the line), and see the area worked out.</p>
        <form class="fgform" autocomplete="off"><select class="gshape" aria-label="Shape"><option value="rect">Rectangle (length, width)</option><option value="tri">Triangle (base, height)</option><option value="trap">Trapezoid (two bases, height)</option></select>
          ${SBT.fracBox('First measurement', '3')}${SBT.fracBox('Second measurement', '2 1/2')}${SBT.fracBox('Height', '4')}<button class="btn small" type="submit">Show the steps</button></form>
        <div class="fgout" aria-live="polite"></div>
        <div class="rules">
          <div class="rule"><h3>Changing units</h3><p>Going to a <b>smaller</b> unit, you need more of them: multiply. ${f(3, 4)} foot &times; 12 = <b>9 inches</b>.</p><p>Going to a <b>bigger</b> unit, you need fewer: divide. 90 minutes &divide; 60 = <b>${L.html(F(3, 2))} hours</b>.</p></div>
          <div class="rule"><h3>Rectangle</h3><p>Area = length &times; width.</p>${G.rectFig(F(1, 2), F(1, 3))}<p>${f(1, 2)} &times; ${f(1, 3)} = <b>${f(1, 6)}</b> square unit.</p></div>
          <div class="rule"><h3>Area model with mixed numbers</h3><p>${L.html(F(5, 2))} &times; ${L.html(F(7, 3))} = (2 + ${f(1, 2)}) &times; (2 + ${f(1, 3)}). Add four small rectangles: 4 + ${f(2, 3)} + 1 + ${f(1, 6)} = <b>${L.html(F(35, 6))}</b>.</p></div>
          <div class="rule"><h3>Triangle</h3><p>Area = ${f(1, 2)} &times; base &times; height. The height makes a square corner with the base, even if it falls outside an obtuse triangle.</p><p>Base 8, height 5: ${f(1, 2)} &times; 8 &times; 5 = <b>20</b>.</p></div>
          <div class="rule"><h3>Trapezoid</h3><p>Area = ${f(1, 2)} &times; (base 1 + base 2) &times; height.</p><p>Bases 4 and 10, height 6: ${f(1, 2)} &times; 14 &times; 6 = <b>42</b>.</p></div>
          <div class="rule"><h3>Composite figures</h3><p>Split the figure into rectangles and triangles, or take a missing part away from a bigger rectangle. Find each area, then add or subtract.</p></div>
        </div>`;
      const parse = raw => {
        const t = raw.trim().replace(/\s+/g, ' '); let m;
        if ((m = t.match(/^(\d+) (\d+) ?\/ ?(\d+)$/))) return +m[3] && +m[2] < +m[3] ? F(+m[1] * +m[3] + +m[2], +m[3]) : null;
        if ((m = t.match(/^(\d+) ?\/ ?(\d+)$/))) return +m[2] ? F(+m[1], +m[2]) : null;
        if ((m = t.match(/^(\d+)$/))) return F(+m[1], 1);
        return null;
      };
      const shape = () => $('.gshape', P).value, ins = () => [...P.querySelectorAll('.fgform .fbox')];
      const sync = () => { const s = shape(), x = ins(); x[2].style.display = s === 'rect' ? 'none' : ''; x[0].setAttribute('aria-label', s === 'rect' ? 'Length' : s === 'tri' ? 'Base' : 'Base 1'); x[1].setAttribute('aria-label', s === 'rect' ? 'Width' : s === 'tri' ? 'Height' : 'Base 2'); };
      const show = () => {
        sync(); const s = shape(), v = ins().map(i => parse(i.value)), out = $('.fgout', P), need = s === 'rect' ? 2 : s === 'tri' ? 2 : 3, vs = v.slice(0, need);
        if (vs.some(x => !x || x.d > 24 || x.n > 500)) { out.textContent = 'Check the boxes. A fraction needs both a top and a bottom number, and the bottom cannot be 0. (Keep denominators to 24 or less.)'; return; }
        const half = F(1, 2), sh = x => x.d > 1 && x.n > x.d ? 'mixed' : 'i'; let area, text;
        if (s === 'rect') { area = L.mul(vs[0], vs[1]); text = 'Area = length × width. ' + G.whyMul([{ v: vs[0], shown: sh(vs[0]) }, { v: vs[1], shown: sh(vs[1]) }]); }
        else if (s === 'tri') { area = L.mul(L.mul(half, vs[0]), vs[1]); text = 'Area = 1/2 × base × height. ' + G.whyMul([{ v: half, shown: 'i' }, { v: vs[0], shown: sh(vs[0]) }, { v: vs[1], shown: sh(vs[1]) }]); }
        else { const sum = L.add(vs[0], vs[1]); area = L.mul(L.mul(sum, half), vs[2]); text = `Area = 1/2 × (base 1 + base 2) × height. The bases add to ${L.txt(vs[0])} + ${L.txt(vs[1])} = ${L.txt(sum)}. ` + G.whyMul([{ v: sum, shown: sh(sum) }, { v: half, shown: 'i' }, { v: vs[2], shown: sh(vs[2]) }]); }
        out.innerHTML = `<p>Area = <b>${L.html(area)}</b> square units</p><p>${SBT.stackText(text)}</p>`;
      };
      SBT.wireFrac(P);
      $('.fgform', P).onsubmit = e => { e.preventDefault(); show(); };
      $('.gshape', P).onchange = show;
      show();
    }
  };

  const fa = (title, lead, fn) => ({ init(ctx) { SBT.answer(ctx, { title, lead, kind: 'fraction', rounds: 10, build: () => many(fn) }); } });
  const FORM = ' Whole number in the small box, fraction top and bottom in the others. No units.';
  const units = fa('Convert customary units', 'Feet, yards, pounds and gallons, with fractions.' + FORM, G.customaryQ);
  const time = fa('Convert units of time', 'Hours, minutes, seconds, days, weeks and years.' + FORM, G.timeQ);
  const rect = fa('Area of a rectangle', 'Sides can be fractions or mixed numbers.' + FORM, G.rectQ);
  const triangle = fa('Area of a triangle', 'Acute, right and obtuse triangles.' + FORM, () => G.triQ(false));
  const trapezoid = fa('Area of a trapezoid', 'Two parallel bases and a height.' + FORM, () => G.trapQ(false));
  const composite = fa('Composite figures', 'Add or subtract areas. Corners are right angles.' + FORM, G.compositeQ);
  const review = fa('Mixed review', 'Fractions in triangles and trapezoids, two-step conversions, and composite figures.' + FORM, G.reviewQ);

  /* ---- Quiz (Random 10 or One of each) and Flashcards: one list of problem types serves both, so every type has a card ---- */
  const TYPES = [
    { name: "Convert customary units", gen: G.customaryQ, cards: [["When you change to a smaller unit, do you multiply or divide?", "Multiply. You need more of the smaller unit. 3/4 foot × 12 = 9 inches."], ["When you change to a bigger unit, do you multiply or divide?", "Divide. You need fewer of the bigger unit. 90 minutes ÷ 60 = 1 1/2 hours."], ["Customary units to know", "1 foot = 12 inches. 1 yard = 3 feet = 36 inches. 1 pound = 16 ounces. 1 gallon = 4 quarts = 16 cups. 1 quart = 2 pints. 1 pint = 2 cups."]] },
    { name: "Convert units of time", gen: G.timeQ, cards: [["Units of time to know", "1 hour = 60 minutes. 1 minute = 60 seconds. 1 day = 24 hours. 1 week = 7 days. 1 year = 12 months."]] },
    { name: "Area of a rectangle", gen: G.rectQ, cards: [["How do you find the area of a rectangle?", "Area = length × width. The sides can be fractions or mixed numbers."]] },
    { name: "Area of a triangle", gen: () => G.triQ(false), cards: [["How do you find the area of a triangle?", "Area = 1/2 × base × height. The height makes a square corner with the base, even if it falls outside an obtuse triangle."]] },
    { name: "Area of a trapezoid", gen: () => G.trapQ(false), cards: [["How do you find the area of a trapezoid?", "Area = 1/2 × (base 1 + base 2) × height. The two bases are the parallel sides."]] },
    { name: "Composite figures", gen: G.compositeQ, cards: [["How do you find the area of a composite figure?", "Split it into rectangles and triangles, or take a missing part away from a bigger rectangle. Find each area, then add or subtract."]] }
  ];
  const cards = { init(ctx) { SBT.flashcards(ctx, { lead: 'Tap the card to flip it. These are the rules and facts the problems use.', build: () => shuffle(TYPES.flatMap(t => t.cards)).map(([q, a]) => ({
    front: `<div class="tag">Rule or fact</div><div class="defline">${esc(q)}</div>`, back: `<div class="tag">Answer</div><div class="defline">${esc(a)}</div>${ctx.sayButton(q + ' ' + a, 'Hear it')}`, say: q })) }); } };
  const quiz = { init(ctx) { SBT.answer(ctx, { title: 'Quiz', lead: 'Mixed problems.' + FORM, kind: 'fraction', rounds: 10, fullLabel: 'One of each', full: () => TYPES.map(t => t.gen()), build: () => many(() => TYPES[Math.floor(Math.random() * TYPES.length)].gen()) }); } };

  SBM.start({ module: 'measurement', defaults: {}, tools: { guide, cards, units, time, rect, triangle, trapezoid, composite, review, quiz } });
})();
