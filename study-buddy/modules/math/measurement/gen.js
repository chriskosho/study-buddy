/* Measurement (Dimensions Math 5, chapter 7): unit conversions with fractions, time, and area of rectangles, triangles, trapezoids and composite figures.
   Problems come with a figure (SVG, in q), the answer, a worked explanation, `chk` (a product of fractions the check solves again) and `dims`
   (the figure's measurements, so the check can recompute the area with its own formula). Whole-number arithmetic only (shared/sb-fractions.js). */
(function (root) {
  'use strict';
  const L0 = root.FRACLIB || require('../../../shared/sb-fractions.js');
  const { rnd, pick, shuffle, gcd, F, mul, add, sub, txt, html, say, build, unit, proper, mixedNum, ans, finish } = L0;
  const whole = n => F(n, 1);
  const HALF = F(1, 2);
  const chkOf = vs => vs.map(v => v.n + '/' + v.d).join('*');
  const T = v => txt(v, 'mixed');   // as written on a figure: 3 1/2

  /* ---------- explanation of a product (shared wording with chapter 5) ---------- */
  function whyMul(fs) {
    const conv = [];
    fs.forEach(f => { if (f.shown === 'mixed' && f.v.d > 1 && f.v.n > f.v.d) conv.push(`${txt(f.v)} = ${txt(f.v, 'improper')}`); });
    const tops = fs.map(f => f.v.n), bots = fs.map(f => f.v.d), N = tops.reduce((a, b) => a * b, 1), D = bots.reduce((a, b) => a * b, 1);
    if (D === 1) return (conv.length ? conv.join(', ') + '. ' : '') + `${tops.join(' × ')} = ${N}.`;
    return (conv.length ? conv.join(', ') + '. ' : '') + `Multiply the numerators: ${tops.join(' × ')} = ${N}. Multiply the denominators: ${bots.join(' × ')} = ${D}. So the product is ${N}/${D}.` + finish(N, D).text;
  }
  const shownOf = v => v.d > 1 && v.n > v.d ? 'mixed' : 'i';
  const simplest = ' <span class="hint-i">Write it in simplest form.</span>';

  /* ---------- figures ---------- */
  const lab = (x, y, t, a = 'middle') => `<text x="${x}" y="${y}" text-anchor="${a}" font-size="13" font-weight="700" fill="var(--ink)">${t}</text>`;
  const svg = (w, h, body, label) => `<svg class="mfig" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">${body}</svg>`;
  const S = 'stroke="var(--navy)" stroke-width="2.5" stroke-linejoin="round"', FILL = 'fill="var(--teal)" fill-opacity=".25"', DASH = 'stroke="var(--coral)" stroke-width="2" stroke-dasharray="5 4"';
  const art = n => [8, 11, 18].includes(n) ? 'An' : 'A';
  const wrap = s => `<span class="mfigwrap">${s}<span class="fignote">Not drawn to scale.</span></span>`;

  function rectFig(a, b) {   // width a, length b
    const body = `<rect x="54" y="14" width="140" height="80" ${FILL} ${S}/>` + lab(124, 112, T(a)) + lab(48, 58, T(b), 'end');
    return svg(230, 124, body, `A rectangle, ${T(a)} wide and ${T(b)} tall.`);
  }
  function triFig(kind, b, h) {
    const x0 = 52, x1 = 190, y0 = 98, top = 20; let apex = kind === 'right' ? x0 : kind === 'obtuse' ? x1 + 36 : 120, body, hx = apex;
    const pts = `${x0},${y0} ${x1},${y0} ${apex},${top}`;
    body = `<polygon points="${pts}" ${FILL} ${S}/>`;
    if (kind !== 'right') body += `<line x1="${hx}" y1="${top}" x2="${hx}" y2="${y0}" ${DASH}/>`;
    if (kind === 'obtuse') body += `<line x1="${x1}" y1="${y0}" x2="${hx}" y2="${y0}" ${DASH}/>`;
    if (kind === 'right') body += `<rect x="${x0}" y="${y0 - 10}" width="10" height="10" fill="none" stroke="var(--navy)" stroke-width="1.5"/>`;
    if (kind === 'acute') body += `<rect x="${hx}" y="${y0 - 10}" width="10" height="10" fill="none" stroke="var(--navy)" stroke-width="1.5" transform="translate(-10 0)"/>`;
    body += lab((x0 + x1) / 2, 116, T(b)) + lab(kind === 'right' ? x0 - 6 : hx + 6, (top + y0) / 2 + 4, T(h), kind === 'right' ? 'end' : 'start');
    return svg(300, 124, body, `${kind === 'obtuse' ? 'An obtuse' : kind === 'acute' ? 'An acute' : 'A right'} triangle with base ${T(b)} and height ${T(h)}.`);
  }
  function trapFig(a, b, h) {   // a = top base, b = bottom base
    const body = `<polygon points="20,98 190,98 150,22 60,22" ${FILL} ${S}/><line x1="150" y1="22" x2="150" y2="98" ${DASH}/>` + lab(105, 14, T(a)) + lab(105, 116, T(b)) + lab(144, 64, T(h), 'end');
    return svg(220, 124, body, `A trapezoid with bases ${T(a)} and ${T(b)} and height ${T(h)}.`);
  }
  function lFig(W, H, a, b) {   // bottom W, left H, top a, right b
    const sc = Math.min(160 / W, 84 / H), w = W * sc, h = H * sc, aa = a * sc, bb = b * sc, x = 34, y = 14;
    const pts = `${x},${y} ${x + aa},${y} ${x + aa},${y + h - bb} ${x + w},${y + h - bb} ${x + w},${y + h} ${x},${y + h}`;
    const body = `<polygon points="${pts}" ${FILL} ${S}/>` + lab(x + aa / 2, y - 3, String(a)) + lab(x + w / 2, y + h + 16, String(W)) + lab(x - 6, y + h / 2 + 4, String(H), 'end') + lab(x + w + 6, y + h - bb / 2 + 4, String(b), 'start');
    return svg(240, 130, body, `An L-shaped figure. Left side ${H}, bottom ${W}, top ${a}, right side ${b}.`);
  }
  function frameFig(W, H, w, h) {   // outer W×H, inner w×h (centered)
    const sc = Math.min(150 / W, 70 / H), ow = W * sc, oh = H * sc, iw = w * sc, ih = h * sc, x = 40, y = 14, ix = x + (ow - iw) / 2, iy = y + (oh - ih) / 2;
    const body = `<rect x="${x}" y="${y}" width="${ow}" height="${oh}" ${FILL} ${S}/><rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="var(--surface)" ${S}/>` +
      lab(x + ow / 2, y + oh + 16, W + ' (outside)') + lab(x - 6, y + oh / 2 + 4, String(H), 'end') + lab(x + ow / 2, y + oh + 33, `cut out ${w} by ${h}`);
    return svg(250, 150, body, `A rectangle ${W} by ${H} with a ${w} by ${h} rectangle cut out of the middle.`);
  }
  function houseFig(w, h, t) {   // not drawn to scale: the roof and the walls are kept big enough to label
    const ww = 130, tt = Math.min(44, Math.max(28, 84 * t / (h + t))), hh = 88 - tt, x = 50, y = 12;
    const body = `<polygon points="${x},${y + tt} ${x + ww / 2},${y} ${x + ww},${y + tt} ${x + ww},${y + tt + hh} ${x},${y + tt + hh}" ${FILL} ${S}/><line x1="${x}" y1="${y + tt}" x2="${x + ww}" y2="${y + tt}" stroke="var(--navy)" stroke-width="1.5"/><line x1="${x + ww / 2}" y1="${y}" x2="${x + ww / 2}" y2="${y + tt}" ${DASH}/>` +
      lab(x + ww / 2, y + tt + hh + 16, String(w)) + lab(x - 6, y + tt + hh / 2 + 4, String(h), 'end') + lab(x + ww / 2 + 8, y + tt / 2 + 6, String(t), 'start');
    return svg(240, 136, body, `A rectangle ${w} wide and ${h} tall with a triangle of height ${t} on top.`);
  }

  /* ---------- unit conversions with fractions (Lessons 1 and 2) ---------- */
  const CUSTOMARY = [['foot', 'feet', 'inch', 'inches', 12], ['yard', 'yards', 'foot', 'feet', 3], ['yard', 'yards', 'inch', 'inches', 36], ['pound', 'pounds', 'ounce', 'ounces', 16], ['gallon', 'gallons', 'quart', 'quarts', 4], ['quart', 'quarts', 'pint', 'pints', 2], ['pint', 'pints', 'cup', 'cups', 2], ['gallon', 'gallons', 'cup', 'cups', 16]];
  const TIME = [['hour', 'hours', 'minute', 'minutes', 60], ['minute', 'minutes', 'second', 'seconds', 60], ['day', 'days', 'hour', 'hours', 24], ['week', 'weeks', 'day', 'days', 7], ['year', 'years', 'month', 'months', 12]];
  const divisors = f => [2, 3, 4, 5, 6, 8, 10].filter(d => f % d === 0);
  function convertQ(table) {
    const [bs, bp, ss, sp, f] = pick(table), big = Math.random() < 0.55, name = (v, s, p) => unit(v, s, p);
    if (big) {                                        // bigger unit to smaller unit: multiply (the amount is a fraction or a mixed number)
      const ds = divisors(f), d = ds.length ? pick(ds) : 1, r = Math.random(), v = d === 1 || r < 0.15 ? whole(rnd(2, 9)) : r < 0.6 ? proper(d) : mixedNum(d, 4), p = mul(v, whole(f));
      const qq = build([{ v, mode: 'mixed' }, ` ${name(v, bs, bp)} = ? ${sp}`]);
      return { q: qq.h + simplest, say: qq.s.replace(/\?/, 'how many') , ...ans(p), chk: chkOf([v, whole(f)]), hint: `1 ${bs} = ${f} ${sp}. Going to a smaller unit, you need more of them: multiply.`,
        why: `1 ${bs} = ${f} ${sp}. Going to a smaller unit, multiply by ${f}. ${whyMul([{ v, shown: shownOf(v) }, { v: whole(f), shown: 'i' }])} So ${txt(v)} ${name(v, bs, bp)} = ${txt(p)} ${name(p, ss, sp)}.`, dims: { kind: 'conv', from: v, f, up: false } };
    }
    const ds2 = divisors(f).length ? divisors(f) : [f], dd = pick(ds2), jj = rnd(1, dd - 1 || 1), n = Math.random() < 0.15 ? f * rnd(2, 4) : rnd(0, 3) * f + Math.max(1, jj) * (f / dd);
    const p = F(n, f), sw = n === 1 ? ss : sp, qq = build([{ v: whole(n) }, ` ${sw} = ? ${bp}`]);
    return { q: qq.h + simplest, say: qq.s.replace(/\?/, 'how many'), ...ans(p), chk: chkOf([whole(n), F(1, f)]), hint: `1 ${bs} = ${f} ${sp}. Going to a bigger unit, you need fewer of them: divide.`,
      why: `1 ${bs} = ${f} ${sp}. Going to a bigger unit, divide by ${f}. ${n} \u00f7 ${f} = ${n}/${f}.` + finish(n, f).text + ` So ${n} ${sw} = ${txt(p)} ${name(p, bs, bp)}.`, dims: { kind: 'conv', from: whole(n), f, up: true } };
  }
  const customaryQ = () => convertQ(CUSTOMARY), timeQ = () => convertQ(TIME);

  /* ---------- area of a rectangle with fractions and mixed numbers (Lessons 3 to 6) ---------- */
  const UNITS = [['centimeters', 'centimeter', 'cm'], ['inches', 'inch', 'in'], ['feet', 'foot', 'ft'], ['meters', 'meter', 'm']];
  function rectQ() {
    const r = Math.random(); let a, b;
    if (r < 0.35) { a = proper(pick([2, 3, 4, 5, 6])); b = proper(pick([2, 3, 4, 5, 6, 8])); }
    else if (r < 0.6) { a = mixedNum(pick([2, 3, 4]), 4); b = whole(rnd(2, 6)); }
    else if (r < 0.8) { a = mixedNum(pick([2, 3, 4]), 3); b = proper(pick([2, 3, 4, 5])); }
    else { a = mixedNum(pick([2, 3, 4]), 3); b = mixedNum(pick([2, 3, 4, 5]), 3); }
    const u = pick(UNITS), p = mul(a, b), parts = [];
    let why;
    if (a.d > 1 && a.n > a.d && b.d > 1 && b.n > b.d) {   // an area model with two mixed numbers: four small rectangles
      const wa = Math.floor(a.n / a.d), wb = Math.floor(b.n / b.d), fa = F(a.n % a.d, a.d), fb = F(b.n % b.d, b.d), ps = [whole(wa * wb), mul(whole(wa), fb), mul(fa, whole(wb)), mul(fa, fb)];
      const total = ps.reduce((x, y) => add(x, y));
      why = `Split each side into a whole number and a fraction: ${txt(a)} = ${wa} + ${txt(fa)} and ${txt(b)} = ${wb} + ${txt(fb)}. The area is the sum of four small rectangles: ${wa} × ${wb} = ${wa * wb}, ${wa} × ${txt(fb)} = ${txt(ps[1])}, ${txt(fa)} × ${wb} = ${txt(ps[2])}, and ${txt(fa)} × ${txt(fb)} = ${txt(ps[3])}. Add them: ${txt(total)}. (You can also change both to improper fractions and multiply: ${txt(p)}.)`;
    } else why = 'Area of a rectangle = length × width. ' + whyMul([{ v: a, shown: shownOf(a) }, { v: b, shown: shownOf(b) }]);
    return { q: wrap(rectFig(a, b)) + `What is the area of the rectangle in square ${u[0]}?` + simplest, say: `What is the area of a rectangle that is ${say(a, 'mixed')} ${u[0]} wide and ${say(b, 'mixed')} ${u[0]} tall, in square ${u[0]}?`, ...ans(p), chk: chkOf([a, b]), hint: (a.n > a.d && a.d > 1) || (b.n > b.d && b.d > 1) ? 'Area = length × width. Change mixed numbers to improper fractions first.' : 'Area = length × width.', why, dims: { kind: 'rect', a, b } };
  }

  /* ---------- triangles (Lesson 7) ---------- */
  function triQ(allowFrac = false) {
    const kind = pick(['acute', 'right', 'obtuse']), u = pick(UNITS);
    const fracSide = allowFrac && Math.random() < 0.6, dim = () => whole(rnd(3, 16)), fr1 = () => mixedNum(pick([2, 4]), 6), evenW = () => whole(2 * rnd(2, 8));
    let b = fracSide ? fr1() : dim(), h = fracSide ? evenW() : dim(); if (fracSide && Math.random() < 0.5) [b, h] = [h, b]; if (b.d === 1 && h.d === 1 && Math.random() < 0.7) { if (b.n % 2 && h.n % 2) h = whole(h.n + 1 > 16 ? h.n - 1 : h.n + 1); }
    const p = mul(mul(HALF, b), h);
    return { q: wrap(triFig(kind, b, h)) + `What is the area of the triangle in square ${u[0]}?` + simplest, say: `What is the area of a triangle with base ${say(b, 'mixed')} ${u[0]} and height ${say(h, 'mixed')} ${u[0]}, in square ${u[0]}?`, ...ans(p), chk: chkOf([HALF, b, h]),
      hint: 'The height makes a square corner with the base. The area is half of base × height.',
      why: `Area of a triangle = 1/2 × base × height.${kind === 'obtuse' ? ' The height is the dashed line, even though it falls outside the triangle.' : ''} ${b.d === 1 && h.d === 1 ? `${b.n} × ${h.n} = ${b.n * h.n}, and half of ${b.n * h.n} is ${txt(p)}.` : whyMul([{ v: HALF, shown: 'i' }, { v: b, shown: shownOf(b) }, { v: h, shown: shownOf(h) }])}`, dims: { kind: 'tri', b, h } };
  }

  /* ---------- trapezoids (Lesson 8) ---------- */
  function trapQ(allowFrac = false) {
    const u = pick(UNITS), dim = () => allowFrac && Math.random() < 0.4 ? mixedNum(2, 6) : whole(rnd(2, 14));
    let a, b; do { a = dim(); b = dim(); } while (!(L0.cmp(a, b) < 0));
    const h = whole(rnd(2, 10)), sum = add(a, b), p = mul(mul(sum, HALF), h);
    return { q: wrap(trapFig(a, b, h)) + `What is the area of the trapezoid in square ${u[0]}?` + simplest, say: `What is the area of a trapezoid with bases ${say(a, 'mixed')} and ${say(b, 'mixed')} ${u[0]} and height ${say(h, 'mixed')} ${u[0]}, in square ${u[0]}?`, ...ans(p), chk: chkOf([sum, HALF, h]),
      hint: 'Add the two parallel sides, take half of that, then multiply by the height.',
      why: `Area of a trapezoid = 1/2 × (base 1 + base 2) × height. The bases add to ${txt(a)} + ${txt(b)} = ${txt(sum)}. ${a.d === 1 && b.d === 1 && h.d === 1 ? `${sum.n} × ${h.n} = ${sum.n * h.n}, and half of ${sum.n * h.n} is ${txt(p)}.` : whyMul([{ v: sum, shown: shownOf(sum) }, { v: HALF, shown: 'i' }, { v: h, shown: shownOf(h) }])}`, dims: { kind: 'trap', a, b, h } };
  }

  /* ---------- composite figures (Lessons 9 and 10) ---------- */
  function compositeQ() {
    const kind = pick(['L', 'frame', 'house']), u = pick(UNITS);
    if (kind === 'L') {
      const W = rnd(6, 14), H = rnd(5, 11), a = rnd(2, W - 2), b = rnd(2, H - 2), p = W * H - (W - a) * (H - b);
      return { q: wrap(lFig(W, H, a, b)) + `What is the area of the figure in square ${u[0]}? (All corners are right angles.)`, say: `An L-shaped figure has a left side of ${H}, a bottom of ${W}, a top of ${a} and a right side of ${b}. All corners are right angles. What is its area in square ${u[0]}?`, a: String(p), form: 'any', chk: `${p}/1`,
        hint: 'Find the area of the big rectangle, then take away the corner that is missing.',
        why: `Think of the big ${W} by ${H} rectangle: ${W} × ${H} = ${W * H}. The top is ${a} and the bottom is ${W}, so the missing corner is ${W} − ${a} = ${W - a} wide. The right side is ${b} and the left side is ${H}, so it is ${H} − ${b} = ${H - b} tall: ${W - a} × ${H - b} = ${(W - a) * (H - b)}. Subtract: ${W * H} − ${(W - a) * (H - b)} = ${p}.`, dims: { kind: 'L', W, H, a, b } };
    }
    if (kind === 'frame') {
      const W = rnd(8, 16), H = rnd(6, 12), w = rnd(2, W - 3), h = rnd(2, H - 3), p = W * H - w * h;
      return { q: wrap(frameFig(W, H, w, h)) + `${art(W)} ${W} by ${H} rectangle has ${art(w).toLowerCase()} ${w} by ${h} rectangle cut out of its middle. What is the area of the shaded part in square ${u[0]}?`, say: `A rectangle ${W} by ${H} has a rectangle ${w} by ${h} cut out of the middle. What is the area of what is left, in square ${u[0]}?`, a: String(p), form: 'any', chk: `${p}/1`,
        hint: 'Area of the whole rectangle minus the area of the part that is cut out.',
        why: `The whole rectangle: ${W} × ${H} = ${W * H}. The part cut out: ${w} × ${h} = ${w * h}. Subtract: ${W * H} − ${w * h} = ${p}.`, dims: { kind: 'frame', W, H, w, h } };
    }
    const w = pick([4, 6, 8, 10, 12]), h = rnd(3, 9), t = rnd(2, 8), p = F(w * h * 2 + w * t, 2);
    return { q: wrap(houseFig(w, h, t)) + `What is the area of the figure in square ${u[0]}? (A rectangle with a triangle on top. The triangle's base is the top of the rectangle.)` + simplest, say: `A rectangle ${w} wide and ${h} tall has a triangle of height ${t} on top. What is the area in square ${u[0]}?`, ...ans(p), chk: `${p.n}/${p.d}`,
      hint: 'Find the area of the rectangle and the area of the triangle, then add them.',
      why: `The rectangle: ${w} × ${h} = ${w * h}. The triangle has base ${w} and height ${t}: 1/2 × ${w} × ${t} = ${w * t / 2}. Add: ${w * h} + ${w * t / 2} = ${txt(p)}.`, dims: { kind: 'house', w, h, t } };
  }

  /* ---------- review: two steps and fractions everywhere ---------- */
  function reviewQ() {
    const k = rnd(0, 3);
    if (k === 0) return triQ(true);
    if (k === 1) return trapQ(true);
    if (k === 2) {   // convert, then multiply: a mixed number of yards or feet to inches
      const [bs, bp, ss, sp, f] = pick([CUSTOMARY[1], CUSTOMARY[0], CUSTOMARY[2]]), v = mixedNum(pick(divisors(f).filter(x => x <= 4)), 4), p = mul(v, whole(f));
      const qq = build([`A board is `, { v, mode: 'mixed' }, ` ${unit(v, bs, bp)} long. How many ${sp} is that?`]);
      return { q: qq.h + simplest, say: qq.s, ...ans(p), chk: chkOf([v, whole(f)]), hint: `1 ${bs} = ${f} ${sp}.`, why: `1 ${bs} = ${f} ${sp}. ${whyMul([{ v, shown: shownOf(v) }, { v: whole(f), shown: 'i' }])}`, dims: { kind: 'conv', from: v, f, up: false } };
    }
    return compositeQ();
  }

  const MEAGEN = { rectFig, whyMul, customaryQ, timeQ, rectQ, triQ, trapQ, compositeQ, reviewQ };
  if (typeof module !== 'undefined') module.exports = MEAGEN; else root.MEAGEN = MEAGEN;
})(typeof window !== 'undefined' ? window : globalThis);
