/* Volume of Solid Figures (Dimensions Math 5, chapter 8): tools. Problems come from gen.js (VOLGEN). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const G = window.VOLGEN, L = window.FRACLIB, esc = SB.esc, many = SBT.many, F = L.F;

  const guide = {
    init(ctx) {
      const P = ctx.panel;
      P.innerHTML = `<h2>Study guide</h2><p class="lead">Type the length, width and height of a box (whole numbers) to see its volume and how much it holds.</p>
        <form class="fgform" autocomplete="off"><input class="textin" value="5" aria-label="Length" inputmode="numeric"><input class="textin" value="4" aria-label="Width" inputmode="numeric"><input class="textin" value="3" aria-label="Height" inputmode="numeric"><button class="btn small" type="submit">Show the steps</button></form>
        <div class="fgout" aria-live="polite"></div>
        <div class="rules">
          <div class="rule"><h3>Counting unit cubes</h3><p>Volume is how many 1-unit cubes fill a solid. Count one layer, then multiply by the number of layers.</p>${G.prism(4, 3, 2, { grid: true })}<p>4 &times; 3 = 12 in a layer, 2 layers: <b>24 cubes</b>.</p></div>
          <div class="rule"><h3>The formula</h3><p>Volume = length &times; width &times; height. A box 6 by 4 by 5: 6 &times; 4 = 24, and 24 &times; 5 = <b>120 cubic units</b>.</p><p>A cube has three equal edges: 3 &times; 3 &times; 3 = <b>27</b>.</p></div>
          <div class="rule"><h3>Base area</h3><p>Volume = area of the base &times; height. The base of a 6 by 4 by 5 box is 6 &times; 4 = 24 square units, and 24 &times; 5 = <b>120</b>. In a drawing: length is the front edge, width is the side edge, height is the upright edge.</p></div>
          <div class="rule"><h3>A missing edge</h3><p>Volume 120, length 6, width 4: 6 &times; 4 = 24, and 24 &times; ? = 120, so ? = 120 &divide; 24 = <b>5</b>.</p></div>
          <div class="rule"><h3>Compound figures</h3><p>Split the solid into boxes and add their volumes. If a piece is cut out, subtract it from the whole box.</p></div>
          <div class="rule"><h3>Volume and capacity</h3><p>1 cubic centimeter holds <b>1 milliliter</b>. 1 liter = 1,000 milliliters = 1,000 cubic centimeters.</p><p>A box 10 by 10 by 10 cm is 1,000 cubic centimeters, so it holds <b>1 liter</b>.</p></div>
          <div class="rule"><h3>Units</h3><p>Volume is measured in <b>cubic units</b>, like cubic centimeters (cm&sup3;). Area uses square units. Length uses plain units.</p></div>
        </div>`;
      const show = () => {
        const v = [...P.querySelectorAll('.fgform .textin')].map(i => i.value.trim()), out = $('.fgout', P);
        if (v.some(x => !/^\d+$/.test(x) || +x < 1 || +x > 200)) { out.textContent = 'Use whole numbers from 1 to 200.'; return; }
        const [l, w, h] = v.map(Number), base = l * w, vol = base * h, c = L.F(vol, 1000);
        const fmt = n => n.toLocaleString('en-US'), unit = (n, a, b) => n === 1 ? a : b;
        out.innerHTML = `<p>Volume = <b>${fmt(vol)}</b> cubic ${unit(vol, 'unit', 'units')}</p><p>${esc(`Volume = length × width × height = ${l} × ${w} × ${h}. ${l} × ${w} = ${fmt(base)}, and ${fmt(base)} × ${h} = ${fmt(vol)}.`)}</p><p>${esc(`If the units are centimeters, the box holds ${fmt(vol)} ${unit(vol, 'milliliter', 'milliliters')} (${vol >= 1000 ? 'that is ' + L.txt(c) + (vol === 1000 ? ' liter' : ' liters') : 'less than 1 liter'}).`)}</p>`;
      };
      $('.fgform', P).onsubmit = e => { e.preventDefault(); show(); };
      show();
    }
  };

  const fa = (title, lead, fn) => ({ init(ctx) { SBT.answer(ctx, { title, lead, kind: 'fraction', rounds: 10, build: () => many(fn) }); } });
  const FORM = ' Whole number in the small box, fraction top and bottom in the others. No units.';
  const cubes = fa('Count the cubes', 'Count a layer, then multiply by the layers.' + FORM, G.cubesQ);
  const stacks = fa('Stacks of cubes', 'Add the cubes in every stack.' + FORM, G.stacksQ);
  const formula = fa('Use the formula', 'Volume of boxes and cubes, and finding a missing edge.' + FORM, G.formulaQ);
  const capacity = fa('Volume and capacity', 'Milliliters, liters and cubic centimeters. Fractions and mixed numbers are fine.' + FORM, G.capacityQ);
  const words = fa('Word problems', 'Boxes, tanks, and sand.' + FORM, G.wordsQ);
  const compare = fa('Compare volumes', 'How much more does the bigger box hold?' + FORM, G.compareQ);
  const compound = fa('Compound figures', 'Add two boxes, or take a piece away.' + FORM, G.compoundQ);
  const review = fa('Mixed review', 'A bit of everything.' + FORM, G.reviewQ);

  SBM.start({ module: 'volume', defaults: {}, tools: { guide, cubes, stacks, formula, capacity, words, compare, compound, review } });
})();
