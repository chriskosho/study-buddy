/* Volume of Solid Figures (Dimensions Math 5, chapter 8): problem generators with labeled SVG figures.
   Each problem: { q (HTML with figure), a, form, why, hint, say, chk, dims }. `dims` holds the figure's measurements so
   _dev/tests/math_gen_check.mjs can recompute the volume with its own formulas. Whole numbers, exact arithmetic. */
(function (root) {
  'use strict';
  const L0 = root.FRACLIB || require('../../../shared/sb-fractions.js');
  const { rnd, pick, shuffle, F, txt, ans, finish } = L0;
  const simplest = ' <span class="hint-i">Write it in simplest form.</span>';
  const num = n => ({ a: String(n), form: 'any' });

  /* ---------- figures ---------- */
  const lab = (x, y, t, a = 'middle') => `<text x="${x}" y="${y}" text-anchor="${a}" font-size="13" font-weight="700" fill="var(--ink)">${t}</text>`;
  const NAVY = 'var(--navy)', TEAL = 'var(--teal)';
  /* an oblique box with unit-cube grid lines. labels: { l, w, h } texts (strings) or null; title is an optional heading */
  function prism(l, w, h, o = {}) {
    const c = Math.min(150 / (l + 0.5 * w), 100 / (h + 0.5 * w), 30), dx = 0.5 * c * w, dy = 0.5 * c * w, x0 = 44, y0 = 16 + dy, W = l * c, H = h * c;
    const poly = (pts, op) => `<polygon points="${pts.map(p => p.join(',')).join(' ')}" fill="${TEAL}" fill-opacity="${op}" stroke="${NAVY}" stroke-width="2.5" stroke-linejoin="round"/>`;
    let s = poly([[x0, y0], [x0 + W, y0], [x0 + W + dx, y0 - dy], [x0 + dx, y0 - dy]], .15) + poly([[x0 + W, y0], [x0 + W + dx, y0 - dy], [x0 + W + dx, y0 - dy + H], [x0 + W, y0 + H]], .4) + poly([[x0, y0], [x0 + W, y0], [x0 + W, y0 + H], [x0, y0 + H]], .25);
    if (o.grid) {
      const g = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${NAVY}" stroke-width="1"/>`;
      for (let i = 1; i < l; i++) s += g(x0 + i * c, y0, x0 + i * c, y0 + H) + g(x0 + i * c, y0, x0 + i * c + dx, y0 - dy);
      for (let j = 1; j < h; j++) s += g(x0, y0 + j * c, x0 + W, y0 + j * c) + g(x0 + W, y0 + j * c, x0 + W + dx, y0 + j * c - dy);
      for (let k = 1; k < w; k++) s += g(x0 + .5 * c * k, y0 - .5 * c * k, x0 + W + .5 * c * k, y0 - .5 * c * k) + g(x0 + W + .5 * c * k, y0 - .5 * c * k, x0 + W + .5 * c * k, y0 - .5 * c * k + H);
    }
    const L = o.labels; if (L) s += lab(x0 + W / 2, y0 + H + 16, L.l) + lab(x0 - 6, y0 + H / 2 + 4, L.h, 'end') + lab(x0 + W + dx / 2 + 8, y0 + H - dy / 2 + 14, L.w, 'start');
    if (o.title) s += lab(x0 + W / 2, 12, o.title);
    const vw = Math.round(x0 + W + dx + 40), vh = Math.round(y0 + H + 24);
    return `<svg class="vfig${o.big ? ' big' : ''}" data-l="${l}" data-w="${w}" data-h="${h}" viewBox="0 0 ${vw} ${vh}" role="img" aria-label="${o.alt || `A box ${l} cubes long, ${w} wide and ${h} tall`}">${s}</svg>`;
  }
  const wrap = (...figs) => `<span class="vfigwrap">${figs.join('')}<span class="fignote">Not drawn to scale.</span></span>`;
  const wrapTrue = fig => `<span class="vfigwrap">${fig}</span>`;
  const UN = pick => pick(['cm', 'in', 'ft']);
  const UW = { cm: 'centimeters', in: 'inches', ft: 'feet', m: 'meters' };
  const cubic = u => `cubic ${UW[u]}`;

  /* Lesson 1: count unit cubes in a box (a grid shows the cubes) */
  function cubesQ() {
    const l = rnd(2, 6), w = rnd(2, 4), h = rnd(2, 4), v = l * w * h;
    return { q: wrapTrue(prism(l, w, h, { grid: true, big: true })) + 'Every small cube is 1 cubic unit. How many cubes make up the box?', say: 'A box is made of small cubes, one cubic unit each. How many cubes make up the box?', ...num(v), chk: `${v}/1`,
      hint: 'Count the cubes in one layer, then multiply by the number of layers.', why: `Count along the edges: ${l} cubes long, ${w} wide and ${h} tall. One layer has ${l} × ${w} = ${l * w} cubes. There are ${h} layers: ${l * w} × ${h} = ${v} cubes.`, dims: { kind: 'box', l, w, h } };
  }

  /* Lessons 2-3: an irregular figure made of stacks of cubes, shown from above */
  function stacksQ() {
    const R = rnd(2, 3), C = rnd(3, 4); let cells; do { cells = Array.from({ length: R }, () => Array.from({ length: C }, () => rnd(0, 4))); } while (cells.flat().filter(x => x > 0).length < 4);
    const cs = 40, W = C * cs + 2, H = R * cs + 2; let s = '';
    cells.forEach((row, i) => row.forEach((n, j) => { s += `<rect x="${1 + j * cs}" y="${1 + i * cs}" width="${cs}" height="${cs}" fill="${TEAL}" fill-opacity="${n ? .15 + n * .1 : 0}" stroke="${NAVY}" stroke-width="2"/>` + lab(1 + j * cs + cs / 2, 1 + i * cs + cs / 2 + 5, String(n)); }));
    const fig = `<svg class="vfig" data-cells="${cells.map(r => r.join(',')).join(';')}" viewBox="0 0 ${W} ${H}" role="img" aria-label="A top view of stacks of cubes. The numbers are the stack heights: ${cells.map(r => r.join(' ')).join('; ')}.">${s}</svg>`;
    const v = cells.flat().reduce((a, b) => a + b, 0);
    return { q: `<span class="vfigwrap">${fig}<span class="fignote">Top view</span></span>The figure is built from 1-unit cubes. Each number is how many cubes are stacked in that square. What is its volume in cubic units?`, say: 'A figure is built from unit cubes. The top view shows how many cubes are stacked on each square. What is its volume in cubic units?', ...num(v), chk: `${v}/1`,
      hint: 'Each cube is 1 cubic unit, so add up the cubes in every stack.', why: `Add the number of cubes in every stack: ${cells.flat().filter(x => x > 0).join(' + ')} = ${v}. Each cube is 1 cubic unit, so the volume is ${v} cubic units.`, dims: { kind: 'stacks', cells } };
  }

  /* Lesson 4: apply the formula, or find a missing edge */
  function formulaQ() {
    const u = UN(pick), k = rnd(0, 3);
    if (k === 0) { const s = rnd(2, 12), v = s ** 3, f = prism(s, s, s, { labels: { l: `${s} ${u}`, h: `${s} ${u}`, w: `${s} ${u}` } });
      return { q: wrap(f) + `What is the volume of the cube in ${cubic(u)}?`, say: `A cube has edges of ${s} ${UW[u]}. What is its volume in ${cubic(u)}?`, ...num(v), chk: `${v}/1`, hint: 'Volume = edge × edge × edge.', why: `Volume of a cube = edge × edge × edge = ${s} × ${s} × ${s}. ${s} × ${s} = ${s * s}, and ${s * s} × ${s} = ${v}. The volume is ${v} ${cubic(u)}.`, dims: { kind: 'box', l: s, w: s, h: s } }; }
    if (k === 1 || k === 2) { const l = rnd(3, 15), w = rnd(2, 12), h = rnd(2, 10), v = l * w * h;
      return { q: wrap(prism(l, w, h, { labels: { l: `${l} ${u}`, h: `${h} ${u}`, w: `${w} ${u}` } })) + `What is the volume of the box in ${cubic(u)}?`, say: `A box is ${l} ${UW[u]} long, ${w} wide and ${h} tall. What is its volume in ${cubic(u)}?`, ...num(v), chk: `${v}/1`, hint: 'Volume = length × width × height.',
        why: `Volume = length × width × height = ${l} × ${w} × ${h}. ${l} × ${w} = ${l * w}, and ${l * w} × ${h} = ${v}. The volume is ${v} ${cubic(u)}.`, dims: { kind: 'box', l, w, h } }; }
    const l = rnd(3, 12), w = rnd(2, 10), h = rnd(2, 9), v = l * w * h, which = pick(['l', 'w', 'h']), dim = { l, w, h }, labels = { l: `${l} ${u}`, h: `${h} ${u}`, w: `${w} ${u}` }; labels[which] = '?';
    const known = ['l', 'w', 'h'].filter(x => x !== which).map(x => dim[x]), prodKnown = known[0] * known[1], name = { l: 'length', w: 'width', h: 'height' }[which];
    return { q: wrap(prism(l, w, h, { labels })) + `The volume of the box is ${v} ${cubic(u)}. What is the ${name} in ${UW[u]}?`, say: `A box has a volume of ${v} ${cubic(u)}. The other two edges are ${known[0]} and ${known[1]} ${UW[u]}. What is the missing edge in ${UW[u]}?`, ...num(dim[which]), chk: `${dim[which]}/1`,
      hint: 'Multiply the two edges you know, then ask what you multiply that by to get the volume.', why: `Volume = length × width × height. The two known edges give ${known[0]} × ${known[1]} = ${prodKnown}. So ${prodKnown} × ? = ${v}, and ? = ${v} ÷ ${prodKnown} = ${dim[which]} ${UW[u]}.`, dims: { kind: 'missing', v, known, missing: dim[which] } };
  }

  /* Lesson 5: word problems */
  const WHO = ['Mia', 'Leo', 'Priya', 'Sam', 'Zoe', 'Omar'];
  function wordsQ() {
    const k = rnd(0, 4), w6 = shuffle(WHO);
    if (k === 0) { const l = rnd(4, 12), w = rnd(3, 8), h = rnd(3, 8), v = l * w * h;
      return { q: `${w6[0]} packs 1-centimeter cubes into a box that is ${l} cm long, ${w} cm wide and ${h} cm tall. How many cubes fill the box?`, say: `A box is ${l} centimeters long, ${w} wide and ${h} tall. How many 1-centimeter cubes fill it?`, ...num(v), chk: `${v}/1`, hint: 'The number of 1-centimeter cubes is the volume in cubic centimeters.', why: `The volume is ${l} × ${w} × ${h} = ${v} cubic centimeters. Each cube is 1 cubic centimeter, so ${v} cubes fill the box.`, dims: { kind: 'box', l, w, h } }; }
    if (k === 1) { const l = pick([20, 25, 30, 40, 50, 60]), w = pick([10, 15, 20, 25, 30]), h = pick([20, 25, 30]), d = rnd(Math.ceil(h / 2), h - 5), v = l * w * d;
      return { q: `A fish tank is ${l} cm long, ${w} cm wide and ${h} cm tall. It holds water up to a height of ${d} cm. What is the volume of the water in cubic centimeters?`, say: `A fish tank is ${l} centimeters long, ${w} wide and ${h} tall. The water is ${d} centimeters deep. What is the volume of the water in cubic centimeters?`, ...num(v), chk: `${v}/1`, hint: 'Use the height of the water, not the height of the tank.', why: `The water fills a box ${l} by ${w} by ${d}. Volume = ${l} × ${w} × ${d} = ${v} cubic centimeters. (The tank's height of ${h} cm is not needed.)`, dims: { kind: 'box', l, w, h: d } }; }
    if (k === 2) { const s = rnd(2, 9), n = rnd(2, 5), v = s ** 3 * n;
      return { q: `${w6[2]} stacks ${n} cubes. Each cube has edges of ${s} inches. What is the total volume of the cubes in cubic inches?`, say: `${n} cubes each have edges of ${s} inches. What is their total volume in cubic inches?`, ...num(v), chk: `${v}/1`, hint: 'Find the volume of one cube first.', why: `One cube: ${s} × ${s} × ${s} = ${s ** 3} cubic inches. ${n} cubes: ${n} × ${s ** 3} = ${v} cubic inches.`, dims: { kind: 'cubes', s, n } }; }
    if (k === 3) { const l = rnd(8, 20), w = rnd(6, 12), vol = l * w * rnd(3, 6), h = vol / (l * w);
      return { q: `A swimming pool has a base ${l} feet long and ${w} feet wide. It holds ${vol} cubic feet of water when full. How deep is the pool in feet?`, say: `A swimming pool base is ${l} feet by ${w} feet and it holds ${vol} cubic feet of water when full. How deep is it in feet?`, ...num(h), chk: `${h}/1`, hint: 'Find the area of the base first.', why: `The base area is ${l} × ${w} = ${l * w} square feet. Volume = base area × depth, so ${l * w} × ? = ${vol}, and ? = ${vol} ÷ ${l * w} = ${h} feet.`, dims: { kind: 'missing', v: vol, known: [l, w], missing: h } }; }
    const l = rnd(3, 9), w = rnd(2, 6), h = rnd(2, 6), c = rnd(2, 3), v = l * w * h * c;
    return { q: `${w6[4]} fills ${c} identical boxes with sand. Each box is ${l} cm long, ${w} cm wide and ${h} cm tall. What is the total volume of sand in cubic centimeters?`, say: `${c} identical boxes are each ${l} by ${w} by ${h} centimeters. What is the total volume in cubic centimeters?`, ...num(v), chk: `${v}/1`, hint: 'Find the volume of one box, then use all the boxes.', why: `One box: ${l} × ${w} × ${h} = ${l * w * h} cubic centimeters. ${c} boxes: ${c} × ${l * w * h} = ${v} cubic centimeters.`, dims: { kind: 'boxes', l, w, h, c } };
  }

  /* Lesson 6: compare volumes (how many more cubic units does the bigger one hold?) */
  function compareQ() {
    const u = UN(pick); let A, B, vA, vB;
    do { A = { l: rnd(2, 10), w: rnd(2, 8), h: rnd(2, 8) }; B = { l: rnd(2, 10), w: rnd(2, 8), h: rnd(2, 8) }; vA = A.l * A.w * A.h; vB = B.l * B.w * B.h; } while (vA === vB || Math.abs(vA - vB) < 6);
    const big = vA > vB ? 'A' : 'B', d = Math.abs(vA - vB), lb = P => ({ l: `${P.l} ${u}`, h: `${P.h} ${u}`, w: `${P.w} ${u}` });
    return { q: wrap(prism(A.l, A.w, A.h, { labels: lb(A), title: 'Box A', alt: `Box A is ${A.l} by ${A.w} by ${A.h} ${UW[u]}` }), prism(B.l, B.w, B.h, { labels: lb(B), title: 'Box B', alt: `Box B is ${B.l} by ${B.w} by ${B.h} ${UW[u]}` })) + `How many more ${cubic(u)} does the bigger box hold than the smaller box?`, say: `Box A is ${A.l} by ${A.w} by ${A.h} ${UW[u]}. Box B is ${B.l} by ${B.w} by ${B.h} ${UW[u]}. How many more ${cubic(u)} does the bigger box hold?`, ...num(d), chk: `${d}/1`,
      hint: 'Find the volume of each box, then subtract.', why: `Box A: ${A.l} × ${A.w} × ${A.h} = ${vA}. Box B: ${B.l} × ${B.w} × ${B.h} = ${vB}. Box ${big} is bigger: ${Math.max(vA, vB)} − ${Math.min(vA, vB)} = ${d} ${cubic(u)}.`, dims: { kind: 'compare', A, B } };
  }

  /* Lesson 7: compound figures: two boxes joined, or a box with a piece cut out */
  function compoundQ() {
    const u = UN(pick), lb = P => ({ l: `${P.l} ${u}`, h: `${P.h} ${u}`, w: `${P.w} ${u}` }), cut = Math.random() < 0.45;
    if (!cut) { const A = { l: rnd(3, 9), w: rnd(2, 6), h: rnd(2, 6) }, B = { l: rnd(2, 6), w: rnd(2, 6), h: rnd(2, 5) }, vA = A.l * A.w * A.h, vB = B.l * B.w * B.h;
      return { q: wrap(prism(A.l, A.w, A.h, { labels: lb(A), title: 'Part A' }), prism(B.l, B.w, B.h, { labels: lb(B), title: 'Part B' })) + `Part B is attached to the side of Part A. What is the total volume in ${cubic(u)}?`, say: `A solid is made of two boxes. Part A is ${A.l} by ${A.w} by ${A.h} ${UW[u]}. Part B is ${B.l} by ${B.w} by ${B.h} ${UW[u]}. What is the total volume in ${cubic(u)}?`, ...num(vA + vB), chk: `${vA + vB}/1`,
        hint: 'Find the volume of each part and add them.', why: `Part A: ${A.l} × ${A.w} × ${A.h} = ${vA}. Part B: ${B.l} × ${B.w} × ${B.h} = ${vB}. Add: ${vA} + ${vB} = ${vA + vB} ${cubic(u)}.`, dims: { kind: 'join', A, B } }; }
    const A = { l: rnd(6, 12), w: rnd(4, 8), h: rnd(4, 8) }, B = { l: rnd(2, A.l - 2), w: rnd(2, A.w - 1), h: rnd(2, A.h - 1) }, vA = A.l * A.w * A.h, vB = B.l * B.w * B.h;
    return { q: wrap(prism(A.l, A.w, A.h, { labels: lb(A), title: 'Whole box' }), prism(B.l, B.w, B.h, { labels: lb(B), title: 'Piece cut out' })) + `The piece is removed from one corner of the whole box. What volume is left, in ${cubic(u)}?`, say: `A whole box is ${A.l} by ${A.w} by ${A.h} ${UW[u]}. A piece ${B.l} by ${B.w} by ${B.h} is cut out. What is the volume left in ${cubic(u)}?`, ...num(vA - vB), chk: `${vA - vB}/1`,
      hint: 'Find the volume of the whole box and of the piece, then subtract.', why: `Whole box: ${A.l} × ${A.w} × ${A.h} = ${vA}. Piece: ${B.l} × ${B.w} × ${B.h} = ${vB}. Subtract: ${vA} − ${vB} = ${vA - vB} ${cubic(u)}.`, dims: { kind: 'cut', A, B } };
  }

  /* Lesson 8: volume and capacity (1 mL = 1 cubic centimeter, 1 L = 1000 cubic centimeters) */
  function capacityQ() {
    const k = rnd(0, 3);
    const boxIn = () => { let l, w, h; do { l = pick([10, 20, 25, 30, 40, 50]); w = pick([10, 20, 25, 30, 40]); h = rnd(10, 40); } while ((l * w * h) % 500 !== 0 || l * w * h > 40000); return { l, w, h }; };
    if (k === 0) { const l = rnd(10, 30), w = rnd(10, 20), h = rnd(10, 20), v = l * w * h;
      return { q: wrap(prism(l, w, h, { labels: { l: `${l} cm`, h: `${h} cm`, w: `${w} cm` } })) + 'How many milliliters does the full container hold? (1 mL = 1 cm³)', say: `A container is ${l} centimeters long, ${w} wide and ${h} tall. How many milliliters of water does it hold? One milliliter is one cubic centimeter.`, ...num(v), chk: `${v}/1`, hint: 'Find the volume in cubic centimeters. 1 cubic centimeter holds 1 milliliter.', why: `Volume = ${l} × ${w} × ${h} = ${v} cubic centimeters. 1 cubic centimeter = 1 milliliter, so the tank holds ${v} milliliters.`, dims: { kind: 'capml', l, w, h } }; }
    if (k === 1) { const { l, w, h } = boxIn(), v = l * w * h, p = F(v, 1000);
      return { q: wrap(prism(l, w, h, { labels: { l: `${l} cm`, h: `${h} cm`, w: `${w} cm` } })) + 'How many liters does the full container hold? (1 L = 1,000 cm³, simplest form)', say: `A container is ${l} centimeters long, ${w} wide and ${h} tall. How many liters of water does it hold? One liter is 1,000 cubic centimeters.`, ...ans(p), chk: `${v}/1000`, hint: 'Find the volume in cubic centimeters, then divide by 1,000 to get liters.', why: `Volume = ${l} × ${w} × ${h} = ${v} cubic centimeters. 1 liter = 1,000 cubic centimeters, so ${v} ÷ 1,000 = ${v}/1000.` + finish(v, 1000).text, dims: { kind: 'capl', l, w, h } }; }
    if (k === 2) { const L = rnd(2, 12), mL = L * 1000, l = pick([10, 20, 25, 50]), w = pick([10, 20, 40]); const base = l * w; if (mL % base !== 0 || mL / base < 5 || mL / base > 60) return capacityQ(); const h = mL / base;
      return { q: `A tank holds ${L} liters of water when it is full. Its base is ${l} cm by ${w} cm. How tall is the tank in centimeters? (1 L = 1,000 cm³)`, say: `A tank holds ${L} liters when full. Its base is ${l} centimeters by ${w}. How tall is the tank in centimeters? One liter is 1,000 cubic centimeters.`, ...num(h), chk: `${h}/1`, hint: 'Change liters to cubic centimeters first.', why: `${L} liters = ${L} × 1,000 = ${mL} cubic centimeters. The base area is ${l} × ${w} = ${base} square centimeters. ${base} × ? = ${mL}, so ? = ${mL} ÷ ${base} = ${h} centimeters.`, dims: { kind: 'capmissing', L, l, w, h } }; }
    if (Math.random() < 0.35) { const L = pick([2, 3, 4, 5, 6]), half = Math.random() < 0.5, v = F(2 * L + (half ? 1 : 0), 2), mL = L * 1000 + (half ? 500 : 0);
      return { q: `A water jug holds ${half ? L + ' 1/2' : L} liters. How many milliliters is that?`, say: `A water jug holds ${half ? L + ' and a half' : L} liters. How many milliliters is that?`, ...num(mL), chk: `${v.n}/${v.d}*1000/1`, hint: '1 liter = 1,000 milliliters. Going to a smaller unit, multiply.', why: `1 liter = 1,000 milliliters, so multiply by 1,000: ${half ? `${L} 1/2 × 1,000 = ${L * 1000} + 500` : `${L} × 1,000`} = ${mL} milliliters.`, dims: { kind: 'l2ml', v, mL } }; }
    const mL = pick([250, 500, 750, 1000, 1500, 2000, 2500, 3000, 3500, 4000]), p = F(mL, 1000);
    return { q: `A bottle holds ${mL} milliliters of juice. How many liters is that? (simplest form)`, say: `A bottle holds ${mL} milliliters. How many liters is that?`, ...ans(p), chk: `${mL}/1000`, hint: '1 liter = 1,000 milliliters. Going to a bigger unit, divide.', why: `1 liter = 1,000 milliliters, so ${mL} ÷ 1,000 = ${mL}/1000.` + finish(mL, 1000).text, dims: { kind: 'ml2l', mL } };
  }

  function reviewQ() { return pick([compoundQ, compoundQ, compareQ, capacityQ, wordsQ, formulaQ])(); }

  const VOLGEN = { cubesQ, stacksQ, formulaQ, wordsQ, compareQ, compoundQ, capacityQ, reviewQ, prism };
  if (typeof module !== 'undefined') module.exports = VOLGEN; else root.VOLGEN = VOLGEN;
})(typeof window !== 'undefined' ? window : globalThis);
