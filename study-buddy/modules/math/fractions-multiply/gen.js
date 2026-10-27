/* Multiplication of Fractions (Dimensions Math 5, chapter 5): problem generators.
   Every problem is made fresh with its answer and a worked explanation, using whole-number arithmetic only
   (shared/sb-fractions.js). Runs in the browser, and in Node for the generator check (_dev/tests/math_gen_check.mjs).
   Each problem carries `chk`, a plain expression the check solves again on its own, and `form` (how the typed answer must be written). */
(function (root) {
  'use strict';
  const L0 = root.FRACLIB || require('../../../shared/sb-fractions.js');
  const { rnd, pick, shuffle, gcd, F, raw, mul, cmp, eq, parts, txt, html, say, build, unit, proper, mixedNum, ans, finish } = L0;

  /* the steps of a product: convert, multiply the tops, multiply the bottoms, simplify. fs: [{ v, shown }] with v reduced */
  function whyMul(fs) {
    const conv = [];
    fs.forEach(f => { if (f.v.d === 1 && fs.length > 1 && !fs.every(g => g.v.d === 1)) conv.push(`${f.v.n} = ${f.v.n}/1`); else if (f.shown === 'mixed' && f.v.d > 1 && f.v.n > f.v.d) conv.push(`${txt(f.v)} = ${txt(f.v, 'improper')}`); });
    const tops = fs.map(f => f.v.n), bots = fs.map(f => f.v.d), N = tops.reduce((a, b) => a * b, 1), D = bots.reduce((a, b) => a * b, 1);
    return (conv.length ? conv.join(', ') + '. ' : '') + `Multiply the numerators: ${tops.join(' × ')} = ${N}. Multiply the denominators: ${bots.join(' × ')} = ${D}. So the product is ${N}/${D}.` + finish(N, D).text;
  }
  const prod = vs => vs.reduce((a, v) => mul(a, v), F(1));
  const chkOf = vs => vs.map(v => v.n + '/' + v.d).join('*');
  /* a product question from pieces */
  function mulQ(vs, shown, lead, hint, simplest = true) {
    const pieces = [];
    vs.forEach((v, i) => { if (i) pieces.push({ op: '*' }); pieces.push({ v, mode: shown[i] === 'mixed' ? 'mixed' : 'improper' }); });
    pieces.push(' = ?'); const qq = build(pieces), p = prod(vs);
    return { q: (lead || '') + qq.h + (simplest ? ' <span class="hint-i">Write it in simplest form.</span>' : ''), say: (lead || '') + qq.s, ...ans(p), chk: chkOf(vs), hint, why: whyMul(vs.map((v, i) => ({ v, shown: shown[i] }))) };
  }
  const whole = (a, b) => F(rnd(a, b), 1);

  /* Lessons 1 and 2: a fraction times a whole number (either order) */
  function wholeMulQ() {
    const f = proper(pick([2, 3, 4, 5, 6, 8, 10])), n = pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 12]), w = F(n, 1), first = Math.random() < 0.5;
    const q = first ? mulQ([f, w], ['i', 'i'], '', 'Write the whole number as a fraction over 1, then multiply the tops and the bottoms.') : mulQ([w, f], ['i', 'i'], '', 'Write the whole number as a fraction over 1, then multiply the tops and the bottoms.');
    const p = mul(f, w);
    q.why = `${f.n}/${f.d} × ${n} means ${n} groups of ${f.n}/${f.d}. Multiply the numerator by the whole number: ${f.n} × ${n} = ${f.n * n}, and keep the denominator ${f.d}: ${f.n * n}/${f.d}.` + finish(f.n * n, f.d).text;
    if (!(f.n * n)) q.why = '';
    return q;
  }

  /* Lesson 2: a fraction of a number, and word problems */
  const THINGS = [['students in a class', 'students'], ['stickers', 'stickers'], ['marbles in a bag', 'marbles'], ['books on a shelf', 'books'], ['cards in a deck', 'cards'], ['balloons', 'balloons']];
  function fractionOfQ() {
    const f = proper(pick([2, 3, 4, 5, 6, 8, 10])), k = rnd(0, 3);
    if (k <= 1) {                                       // a fraction of a number that divides evenly (Fractions of a number I)
      const n = f.d * rnd(2, 8), p = mul(f, F(n, 1));
      const q0 = build(['What is ', { v: f, mode: 'improper' }, ' of ', { v: F(n, 1) }, '?']);
      return { q: q0.h, say: q0.s, ...ans(p), chk: `${f.n}/${f.d}*${n}/1`, hint: `Divide ${n} into ${f.d} equal parts. Then take ${f.n} of the parts.`,
        why: `${n} ÷ ${f.d} = ${n / f.d}, so one ${f.d === 2 ? 'half' : 'part'} is ${n / f.d}. ${f.n} × ${n / f.d} = ${f.n * n / f.d}.` };
    }
    if (k === 2) {                                      // word problem, answer a whole number
      const t = pick(THINGS), n = f.d * rnd(2, 6), p = mul(f, F(n, 1)), pieces = [`There are `, { v: F(n, 1) }, ` ${t[0]}. `, { v: f, mode: 'improper' }, ` of them are red. How many are red?`], qq = build(pieces);
      return { q: qq.h, say: qq.s, ...ans(p), chk: `${n}/1*${f.n}/${f.d}`, hint: 'Draw a bar model with equal parts. How many are in one part?', why: `One part is ${n} ÷ ${f.d} = ${n / f.d}. ${f.n} parts is ${f.n} × ${n / f.d} = ${p.n}.` };
    }
    let n; do n = rnd(3, 11); while (n % f.d === 0);   // a fraction of a number that does not divide evenly (Fractions of a number II)
    const p = mul(f, F(n, 1)), item = pick(['dough', 'rope', 'soil', 'paint']), U = unit(p, 'pound', 'pounds');
    const qq = build([`${pick(['Mia', 'Leo', 'Priya', 'Sam'])} has `, { v: F(n, 1) }, ` ${n === 1 ? 'pound' : 'pounds'} of ${item} and uses `, { v: f, mode: 'improper' }, ` of it. How many pounds does ${pick(['she', 'he'])} use?`]);
    return { q: qq.h.replace(/ does (she|he) use\?/, ' is used?') + ' <span class="hint-i">Write it in simplest form.</span>', say: qq.s, ...ans(p), chk: `${n}/1*${f.n}/${f.d}`, hint: 'A fraction of a number means multiply.', why: whyMul([{ v: F(n, 1), shown: 'i' }, { v: f, shown: 'i' }]) };
  }

  /* Lessons 5, 6, 7: fraction times fraction (unit fractions first); sometimes three factors */
  function fractionMulQ() {
    const r = Math.random();
    if (r < 0.2) {                                      // unit fraction times unit fraction
      const a = F(1, pick([2, 3, 4, 5, 6])), b = F(1, pick([2, 3, 4, 5, 6, 8]));
      const q = mulQ([a, b], ['i', 'i'], '', 'Multiply the tops (1 × 1) and the bottoms.'); return q;
    }
    if (r < 0.3) {                                      // a unit fraction times a non-unit fraction
      const a = F(1, pick([2, 3, 4, 5])), b = proper(pick([3, 4, 5, 6, 7, 8])); return Math.random() < 0.5 ? mulQ([a, b], ['i', 'i'], '', 'Multiply the tops and the bottoms.') : mulQ([b, a], ['i', 'i'], '', 'Multiply the tops and the bottoms.');
    }
    if (r < 0.45) {                                     // three factors: fractions and whole numbers
      let vs, p; do { vs = [proper(pick([2, 3, 4, 5, 6, 8])), proper(pick([3, 4, 5, 6, 8, 9])), Math.random() < 0.5 ? proper(pick([2, 3, 4, 5, 6])) : whole(2, 9)]; p = prod(vs); } while (p.d > 60);
      return mulQ(shuffle(vs), ['i', 'i', 'i'], '', 'Multiply all the tops, then all the bottoms. Cancel common factors to keep the numbers small.');
    }
    let a, b; do { a = proper(pick([2, 3, 4, 5, 6, 7, 8, 9, 10])); b = proper(pick([2, 3, 4, 5, 6, 7, 8, 9, 10])); } while (a.n * b.n === 1);
    return mulQ([a, b], ['i', 'i'], '', 'Multiply the numerators, then the denominators. Then write the answer in simplest form.');
  }

  /* picture: a unit square with columns for the first fraction and rows for the second; the overlap is the product */
  function area(x, y) {
    const W = 240, H = 150, cw = W / x.d, rh = H / y.d; let s = `<svg class="farea" viewBox="0 0 ${W + 2} ${H + 2}" role="img" aria-label="A square split into ${x.d} columns and ${y.d} rows. ${x.n} columns and ${y.n} rows are shaded.">`;
    s += `<rect x="1" y="1" width="${W}" height="${H}" fill="var(--surface)"/>`;
    s += `<rect x="1" y="1" width="${cw * x.n}" height="${H}" fill="var(--coral)" opacity=".5"/>`;
    s += `<rect x="1" y="1" width="${W}" height="${rh * y.n}" fill="var(--teal)" opacity=".5"/>`;
    for (let i = 1; i < x.d; i++) s += `<line x1="${1 + cw * i}" y1="1" x2="${1 + cw * i}" y2="${H + 1}" stroke="var(--navy)" stroke-width="1.5"/>`;
    for (let j = 1; j < y.d; j++) s += `<line x1="1" y1="${1 + rh * j}" x2="${W + 1}" y2="${1 + rh * j}" stroke="var(--navy)" stroke-width="1.5"/>`;
    return s + `<rect x="1" y="1" width="${W}" height="${H}" fill="none" stroke="var(--navy)" stroke-width="2.5"/></svg>`;
  }
  function modelQ() {
    let x, y; do { x = proper(pick([2, 3, 4, 5, 6])); y = proper(pick([2, 3, 4, 5, 6])); } while (x.d === y.d && x.n === y.n && Math.random() < 0.7);
    const p = mul(x, y), good = txt(p), qq = build(['Use the model. What is ', { v: x, mode: 'improper' }, { op: '*' }, { v: y, mode: 'improper' }, '?']);
    const cand = [raw(x.n + y.n, x.d + y.d), raw(x.n * y.n, x.d + y.d), raw(x.n * y.n + 1, x.d * y.d), raw(Math.max(1, x.n * y.n - 1), x.d * y.d), raw(x.n, x.d * y.d), raw(y.n, x.d * y.d)];
    const w3 = []; shuffle(cand).forEach(c => { const t = txt(F(c.n, c.d)); if (w3.length < 3 && c.n > 0 && c.n * p.d !== p.n * c.d && !w3.includes(t) && t !== good) w3.push(t); });
    for (let i = 2; w3.length < 3; i++) { const c = F(p.n + i, p.d * 2); const t = txt(c); if (!w3.includes(t) && t !== good && !eq(c, p)) w3.push(t); }
    return { q: qq.t, qh: qq.h, say: qq.s, html: `<div class="fareawrap">${area(x, y)}<p class="hint-i">The square is cut into ${x.d} columns and ${y.d} rows. ${x.n} column${x.n === 1 ? ' is' : 's are'} shaded orange (${txt(x, 'improper')}) and ${y.n} row${y.n === 1 ? ' is' : 's are'} shaded green (${txt(y, 'improper')}). Where they overlap is the product.</p></div>`,
      a: good, wrong: w3, chk: chkOf([x, y]), why: `The square has ${x.d} × ${y.d} = ${x.d * y.d} equal parts. The overlap has ${x.n} × ${y.n} = ${x.n * y.n} of them, so ${x.n}/${x.d} × ${y.n}/${y.d} = ${x.n * y.n}/${x.d * y.d}.` + finish(x.n * y.n, x.d * y.d).text, hint: 'Count the parts in the whole square, then the parts where the colors overlap.' };
  }

  /* Lesson 8: multiplying mixed numbers (by a whole number, a fraction, or a mixed number) */
  function mixedMulQ() {
    const r = Math.random(), d = pick([2, 3, 4, 5, 6, 8]);
    let vs, shown;
    if (r < 0.3) { vs = [mixedNum(d, 5), whole(2, 8)]; shown = ['mixed', 'i']; }
    else if (r < 0.65) { vs = [mixedNum(d, 5), proper(pick([2, 3, 4, 5, 6]))]; shown = ['mixed', 'i']; }
    else { vs = [mixedNum(d, 4), mixedNum(pick([2, 3, 4, 5]), 3)]; shown = ['mixed', 'mixed']; }
    if (Math.random() < 0.4) { vs.reverse(); shown.reverse(); }
    const p = prod(vs); if (p.n / p.d > 60) return mixedMulQ();
    return mulQ(vs, shown, '', 'Change each mixed number to an improper fraction first.');
  }

  /* Lesson 10: reciprocals */
  function reciprocalQ() {
    const k = rnd(0, 5), d = pick([2, 3, 4, 5, 6, 7, 8, 9]);
    if (k === 0 || k === 1) {                           // the reciprocal of a fraction (improper answer is fine)
      const f = Math.random() < 0.7 ? proper(d) : F(rnd(d + 1, d * 3), d); const v = F(f.n, f.d);
      return { q: `What is the reciprocal of ${html(v, 'improper')}?`, say: `What is the reciprocal of ${say(v, 'improper')}?`, ...ans(F(v.d, v.n), 'improper'), chk: `${v.d}/${v.n}`, hint: 'The reciprocal swaps the top and the bottom.', why: `Swap the numerator and the denominator: the reciprocal of ${v.n}/${v.d} is ${v.d}/${v.n}.` + (v.n === 1 ? ` That is the whole number ${v.d}.` : '') };
    }
    if (k === 2) { const n = rnd(2, 12); return { q: `What is the reciprocal of ${n}?`, say: `What is the reciprocal of ${n}?`, ...ans(F(1, n), 'improper'), chk: `1/${n}`, hint: 'Write the whole number as a fraction over 1, then swap.', why: `${n} = ${n}/1. Swap the top and bottom: the reciprocal of ${n} is 1/${n}.` }; }
    if (k === 3) { const v = mixedNum(d, 4), p = parts(v); return { q: `What is the reciprocal of ${html(v, 'mixed')}? <span class="hint-i">Write it as a fraction.</span>`, say: `What is the reciprocal of ${say(v, 'mixed')}?`, ...ans(F(v.d, v.n), 'improper'), chk: `${v.d}/${v.n}`, hint: 'Change the mixed number to an improper fraction, then swap.', why: `${txt(v)} = ${txt(v, 'improper')}. Swap the top and bottom: the reciprocal is ${v.d}/${v.n}.` }; }
    if (k === 4) { const f = proper(d); const qq = build([{ v: f, mode: 'improper' }, { op: '*' }, '? = 1']); return { q: qq.h.replace('? =', '<b>?</b> =') + ' <span class="hint-i">What is the missing number? Write it as a fraction.</span>', say: qq.s.replace('times ? = 1', 'times what equals 1'), ...ans(F(f.d, f.n), 'improper'), chk: `${f.d}/${f.n}`, hint: 'Which number multiplies with it to make 1? That is the reciprocal.', why: `A number times its reciprocal is 1, so the missing number is the reciprocal of ${f.n}/${f.d}: ${f.d}/${f.n}.` }; }
    const f = F(rnd(1, d - 1) + d, d); const g = F(f.d, f.n); const qq = build([{ v: f, mode: 'improper' }, { op: '*' }, { v: g, mode: 'improper' }, ' = ?']);
    return { q: qq.h, say: qq.s, ...ans(F(1, 1)), chk: `${f.n}/${f.d}*${g.n}/${g.d}`, hint: 'These two numbers are reciprocals of each other.', why: `${f.n}/${f.d} × ${g.n}/${g.d} = ${f.n * g.n}/${f.d * g.d} = 1. A number times its reciprocal is always 1.` };
  }

  /* Lessons 3 and 9: word problems */
  const WHO = ['Mia', 'Leo', 'Priya', 'Sam', 'Zoe', 'Omar', 'Nina', 'Ben', 'Lucia', 'Theo'];
  const WHINT = 'Draw a bar model: how many equal parts, and how many do you take?';
  function wordsQ() {
    const kind = rnd(0, 5), who = shuffle(WHO), U = (v, a, b) => ' ' + unit(v, a, b);
    const out = (pieces, vs, shown, extra = '') => { const qq = build(pieces), p = prod(vs); return { q: qq.h + extra + ' <span class="hint-i">Write it in simplest form.</span>', say: qq.s, ...ans(p), chk: chkOf(vs), hint: WHINT, why: whyMul(vs.map((v, i) => ({ v, shown: shown[i] }))) }; };
    if (kind === 0) {                                   // a fraction of a whole number of things
      const f = proper(pick([3, 4, 5, 6, 8])), n = rnd(3, 11), w = F(n, 1);
      return out([`${who[0]} has `, { v: w }, ` yards of ribbon. ${who[0]} uses `, { v: f, mode: 'improper' }, ` of the ribbon for a bow. How many yards of ribbon does ${who[0]} use?`], [w, f], ['i', 'i']);
    }
    if (kind === 1) {                                   // a fraction of a fraction
      const a = proper(pick([2, 3, 4, 5, 6])), b = proper(pick([2, 3, 4, 5, 6, 8]));
      return out([`There was `, { v: a, mode: 'improper' }, ` of a pizza left. ${who[1]} ate `, { v: b, mode: 'improper' }, ` of the leftover pizza. What fraction of the whole pizza did ${who[1]} eat?`], [a, b], ['i', 'i']);
    }
    if (kind === 2) {                                   // groups of a mixed number
      const m = mixedNum(pick([2, 3, 4]), 3), n = rnd(2, 6), w = F(n, 1);
      return out([`${who[2]} walks `, { v: m }, U(m, 'mile', 'miles') + ` every day. How many miles does ${who[2]} walk in `, { v: w }, ` days?`], [m, w], ['mixed', 'i']);
    }
    if (kind === 3) {                                   // recipes: part of a recipe
      const m = mixedNum(pick([2, 3, 4, 8]), 3), f = proper(pick([2, 3, 4]));
      return out([`A recipe uses `, { v: m }, U(m, 'cup', 'cups') + ` of flour. ${who[3]} makes `, { v: f, mode: 'improper' }, ` of the recipe. How many cups of flour does ${who[3]} need?`], [m, f], ['mixed', 'i']);
    }
    if (kind === 4) {                                   // a mixed number times a mixed number (area of a rectangle)
      const a = mixedNum(pick([2, 3, 4]), 3), b = mixedNum(pick([2, 3, 5]), 3);
      return out([`A rectangular garden is `, { v: a }, U(a, 'foot', 'feet') + ` wide and `, { v: b }, U(b, 'foot', 'feet') + ` long. What is its area in square feet?`], [a, b], ['mixed', 'mixed']);
    }
    const f = proper(pick([3, 4, 5, 6])), g = proper(pick([2, 3, 4, 5])), n = rnd(2, 4) * f.d, w = F(n, 1);   // two steps: a fraction of a fraction of a number
    return out([`A farm has `, { v: w }, ` acres. `, { v: f, mode: 'improper' }, ` of the farm is planted with corn, and `, { v: g, mode: 'improper' }, ` of the corn field has tall corn. How many acres have tall corn?`], [w, f, g], ['i', 'i', 'i']);
  }

  /* the toughest: three or more factors with mixed numbers, a missing factor, and a mix of operations */
  function reviewQ() {
    const k = rnd(0, 3), d = pick([2, 3, 4, 5, 6, 8]);
    if (k === 0) {                                      // three or more mixed numbers, fractions and wholes
      let vs, p; do { vs = [mixedNum(pick([2, 3, 4]), 3), proper(pick([2, 3, 4, 5, 6])), Math.random() < 0.5 ? mixedNum(pick([2, 3]), 2) : whole(2, 6)]; p = prod(vs); } while (p.n / p.d > 80 || p.d > 40);
      const shown = vs.map(v => v.d > 1 && v.n > v.d ? 'mixed' : 'i'); return mulQ(vs, shown, '', 'Change mixed numbers to improper fractions. Cancel common factors before you multiply.');
    }
    if (k === 1) {                                      // a missing factor: a × ? = product
      const a = proper(pick([3, 4, 5, 6, 8])), b = proper(pick([3, 4, 5, 6, 7, 8])), p = mul(a, b), qq = build([{ v: a, mode: 'improper' }, { op: '*' }, '? = ', { v: p, mode: 'improper' }]);
      return { q: qq.h.replace('? =', '<b>?</b> =') + ' <span class="hint-i">What is the missing number? Simplest form.</span>', say: qq.s.replace('times ? =', 'times what equals'), ...ans(b), chk: `${b.n}/${b.d}`, hint: 'Divide the product by the factor you know. Dividing by a fraction means multiplying by its reciprocal.', why: `The missing factor is ${txt(p, 'improper')} ÷ ${txt(a, 'improper')}. Multiply by the reciprocal: ${txt(p, 'improper')} × ${a.d}/${a.n} = ${p.n * a.d}/${p.d * a.n}` + (gcd(p.n * a.d, p.d * a.n) > 1 ? ` = ${txt(b, 'improper')}` : '') + '.' };
    }
    if (k === 2) {                                      // add or subtract, then multiply (order of operations with parentheses)
      const a = proper(pick([3, 4, 6])), b = proper(pick([2, 3, 4, 6])), c = proper(pick([2, 3, 4, 5])), add = Math.random() < 0.6;
      const inner = add ? L0.add(a, b) : (cmp(a, b) > 0 ? L0.sub(a, b) : null); if (!inner || inner.n === 0) return reviewQ();
      const [x, y] = add || cmp(a, b) > 0 ? [a, b] : [b, a], p = mul(inner, c), qq = build(['(', { v: x, mode: 'improper' }, { op: add ? '+' : '-' }, { v: y, mode: 'improper' }, ') ', { op: '*' }, ' ', { v: c, mode: 'improper' }, ' = ?']);
      return { q: qq.h.replace('( ', '(').replace(' )', ')') + ' <span class="hint-i">Do the parentheses first. Simplest form.</span>', say: qq.s, ...ans(p), chk: `${chkOf([inner])}*${c.n}/${c.d}`, hint: 'Work inside the parentheses first.',
        why: `Parentheses first: ${txt(x, 'improper')} ${add ? '+' : '−'} ${txt(y, 'improper')} = ${txt(inner, 'improper')}. Then multiply: ${whyMul([{ v: inner, shown: 'i' }, { v: c, shown: 'i' }])}` };
    }
    const m = mixedNum(d, 6);                // a mixed number times a whole number, with bigger numbers
    const vs = [m, F(rnd(2, 12), 1)], p = prod(vs); if (p.n / p.d > 150) return reviewQ();
    return mulQ(vs, ['mixed', 'i'], '', 'Change the mixed number to an improper fraction first.');
  }

  /* a "bigger, smaller or the same" sort made fresh each time: the same number times many different numbers */
  function scaleSet() {
    const n = pick([4, 6, 8, 9, 10, 12, 15, 16, 20, 24]), items = [], seen = new Set();
    const add = (v, b) => { const k = txt(v); if (seen.has(k) || (b === 'more' && v.n <= v.d) || (b === 'less' && v.n >= v.d)) return false; seen.add(k); items.push({ text: `${n} × ${txt(v)}`, b }); return true; };
    add(F(1, 1), 'equal'); let sames = 0; while (sames < 1) { const d = rnd(3, 8); const c = F(d, d); sames++; items.push({ text: `${n} × ${d}/${d}`, b: 'equal' }); }
    let g = 0; while (items.filter(i => i.b === 'less').length < 3 && g++ < 200) add(proper(pick([2, 3, 4, 5, 6, 8, 10])), 'less');
    g = 0; while (items.filter(i => i.b === 'more').length < 3 && g++ < 200) { const d = pick([2, 3, 4, 5]); add(F(rnd(d + 1, d * 3), d), 'more'); }
    return { n, items: shuffle(items) };
  }

  const MULGEN = { whyMul, wholeMulQ, fractionOfQ, fractionMulQ, modelQ, mixedMulQ, reciprocalQ, wordsQ, reviewQ, scaleSet, area, prod };
  if (typeof module !== 'undefined') module.exports = MULGEN; else root.MULGEN = MULGEN;
})(typeof window !== 'undefined' ? window : globalThis);
