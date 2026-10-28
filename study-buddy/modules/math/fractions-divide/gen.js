/* Division of Fractions (Dimensions Math 5, chapter 6): problem generators, whole-number arithmetic only (shared/sb-fractions.js).
   Each problem is {q, a, form, why, hint, say, chk}; chk is "a/b:c/d", meaning a/b divided by c/d, solved again by the generator check. */
(function (root) {
  'use strict';
  const L0 = root.FRACLIB || require('../../../shared/sb-fractions.js');
  const { rnd, pick, shuffle, gcd, F, mul, div, txt, html, say, build, unit, proper, mixedNum, ans, finish } = L0;
  const chkOf = (a, b) => `${a.n}/${a.d}:${b.n}/${b.d}`;
  const whole = n => F(n, 1);
  const WHO = ['Mia', 'Leo', 'Priya', 'Sam', 'Zoe', 'Omar', 'Nina', 'Ben', 'Lucia', 'Theo'];

  /* the steps of a quotient a ÷ b: multiply by the reciprocal, cancel, simplify */
  function whyDiv(a, b, ma, mb) {
    const A = txt(a, 'improper'), B = txt(b, 'improper'), N = a.n * b.d, D = a.d * b.n;
    const recip = b.n === 1 ? String(b.d) : `${b.d}/${b.n}`, conv = [[a, ma], [b, mb]].filter(x => x[1] === 'mixed' && x[0].d > 1 && x[0].n > x[0].d).map(x => `${txt(x[0], 'mixed')} = ${txt(x[0], 'improper')}`).join(', '), lead = (conv ? conv + '. ' : '') + `Dividing by ${B} is the same as multiplying by its reciprocal, ${recip}. `;
    if (D === 1) return lead + `${A} \u00d7 ${recip} = ${N}.`;
    return lead + `${A} \u00d7 ${recip} = ${N}/${D}.` + finish(N, D).text;
  }
  /* a division question from a ÷ b */
  function divQ(a, b, hint, lead = '', ma = 'improper', mb = 'improper') {
    const qq = build([{ v: a, mode: ma }, { op: '/' }, { v: b, mode: mb }, ' = ?']), p = div(a, b);
    return { q: lead + qq.h + ' <span class="hint-i">Write it in simplest form.</span>', say: lead + qq.s, ...ans(p), chk: chkOf(a, b), hint, why: whyDiv(a, b, ma, mb) };
  }

  /* a bar cut into equal parts, to show a unit fraction shared among n, or n copies of a unit fraction in a whole */
  function bar(unitD, shareN) {   // 1/unitD of a bar, shared into shareN equal pieces
    const W = 240, H = 40, T = unitD * shareN; let s = `<svg class="dbar" viewBox="0 0 ${W + 2} ${H + 2}" role="img" aria-label="A bar cut into ${unitD} equal parts. One part is shared into ${shareN} equal pieces.">`;
    s += `<rect x="1" y="1" width="${W / unitD}" height="${H}" fill="var(--teal)" opacity=".5"/>`;
    for (let i = 1; i < unitD; i++) s += `<line x1="${1 + W / unitD * i}" y1="1" x2="${1 + W / unitD * i}" y2="${H + 1}" stroke="var(--navy)" stroke-width="2"/>`;
    for (let i = 0; i < unitD; i++) for (let j = 1; j < shareN; j++) s += `<line x1="${1 + W / T * (i * shareN + j)}" y1="1" x2="${1 + W / T * (i * shareN + j)}" y2="${H + 1}" stroke="var(--coral)" stroke-width="${i === 0 ? 2.5 : 1.2}" stroke-dasharray="4 3"/>`;
    return s + `<rect x="1" y="1" width="${W}" height="${H}" fill="none" stroke="var(--navy)" stroke-width="2.5"/></svg>`;
  }

  /* Lessons 1-3: a unit fraction or a fraction divided by a whole number */
  function fracByWholeQ() {
    const r = Math.random(), n = pick([2, 3, 4, 5, 6, 8]);
    const a = r < 0.45 ? F(1, pick([2, 3, 4, 5, 6])) : proper(pick([3, 4, 5, 6, 8, 9, 10]));
    return divQ(a, whole(n), 'Dividing by a whole number makes each part smaller. Multiply the bottom by it, then simplify.');
  }
  /* Lessons 4-6: a whole number divided by a unit fraction or a fraction */
  function wholeByFracQ() {
    const w = rnd(2, 9);
    if (Math.random() < 0.55) { const b = F(1, pick([2, 3, 4, 5, 6, 8])); return divQ(whole(w), b, 'How many of these fit into the whole number?'); }
    const b = proper(pick([3, 4, 5, 6, 8])); return divQ(whole(rnd(2, 9)), b, 'Multiply by the reciprocal: swap the top and the bottom of the fraction you divide by.');
  }
  /* "how many fit" model questions, Lessons 4 and 8: pick the quotient from a picture of a whole number of bars */
  function modelQ() {
    const w = rnd(2, 5), d = pick([2, 3, 4, 5, 6]), b = F(1, d), p = mul(whole(w), F(d, 1)), good = txt(p);
    const qq = build(['Use the model. What is ', { v: whole(w) }, { op: '/' }, { v: b, mode: 'improper' }, '?']);
    let svg = `<svg class="dbar2" viewBox="0 0 ${w * 62 + 2} 50" role="img" aria-label="${w} bars, each cut into ${d} equal parts.">`;
    for (let i = 0; i < w; i++) { svg += `<rect x="${1 + i * 62}" y="1" width="58" height="46" fill="var(--surface)" stroke="var(--navy)" stroke-width="2.5"/>`; for (let j = 1; j < d; j++) svg += `<line x1="${1 + i * 62 + 58 / d * j}" y1="1" x2="${1 + i * 62 + 58 / d * j}" y2="47" stroke="var(--navy)" stroke-width="1.5"/>`; }
    svg += '</svg>';
    const cand = [w + d, w * d + 1, Math.max(1, w * d - 1), w * d + d, Math.max(1, w * d - d), w * d * 2, w * d + w].map(String), w3 = [];
    shuffle(cand).forEach(c => { if (w3.length < 3 && c !== good && !w3.includes(c) && +c > 0) w3.push(c); });
    return { q: qq.t, qh: qq.h, say: qq.s, html: `<div class="fareawrap">${svg}<p class="hint-i">${w} whole${w === 1 ? '' : 's'}, each cut into ${d} equal parts. How many parts of size ${txt(b, 'improper')} are there altogether?</p></div>`, a: good, wrong: w3, chk: chkOf(whole(w), b), hint: 'Count the parts in one whole, then in all the wholes.', why: `Each whole has ${d} parts of size ${txt(b, 'improper')}, so ${w} wholes have ${w} × ${d} = ${w * d} parts. So ${w} ÷ ${txt(b, 'improper')} = ${w * d}.` };
  }
  /* a unit fraction shared among n: the pieces get smaller (Lesson 1 models) */
  function shareQ() {
    const d = pick([2, 3, 4, 5]), n = pick([2, 3, 4, 5]), a = F(1, d), p = div(a, whole(n)), good = txt(p);
    const qq = build(['Use the model. What is ', { v: a, mode: 'improper' }, { op: '/' }, { v: whole(n) }, '?']);
    const cand = [F(1, d + n), F(1, d * n + 1), F(1, Math.max(2, d * n - 1)), F(n, d * n + 1), F(1, d), F(1, n), F(2, d * n)].filter(x => x.n < x.d).map(x => txt(x)), w3 = [];
    shuffle(cand).forEach(c => { if (w3.length < 3 && c !== good && !w3.includes(c)) w3.push(c); });
    for (let i = 2; w3.length < 3; i++) { const c = txt(F(1, d * n + i)); if (c !== good && !w3.includes(c)) w3.push(c); }
    return { q: qq.t, qh: qq.h, say: qq.s, html: `<div class="fareawrap">${bar(d, n)}<p class="hint-i">The bar is cut into ${d} equal parts. One part (shaded) is shared into ${n} equal pieces. The dashed lines cut every part the same way, so you can count the pieces in the whole bar. Each shaded piece is what fraction of the whole bar?</p></div>`, a: good, wrong: w3, chk: chkOf(a, whole(n)), hint: 'Count the pieces in the whole bar.', why: `The whole bar has ${d} × ${n} = ${d * n} equal pieces, so each piece is ${txt(p)} of the bar. ${txt(a)} ÷ ${n} = ${txt(p)}.` };
  }

  /* Lessons 3 and 5/7: word problems */
  function wordsQ() {
    const who = shuffle(WHO), k = rnd(0, 4), out = (pieces, a, b, hint, lead) => { const qq = build(pieces), p = div(a, b); return { q: qq.h + ' <span class="hint-i">Write it in simplest form.</span>', say: qq.s, ...ans(p), chk: chkOf(a, b), hint, why: lead + whyDiv(a, b) }; };
    if (k === 0) { const a = proper(pick([2, 3, 4, 5, 6])), n = pick([2, 3, 4, 5]), v = whole(n); return out([`${who[0]} has `, { v: a, mode: 'improper' }, ` of a pizza left and shares it equally among `, { v }, ` friends. What fraction of the whole pizza does each friend get?`], a, v, 'Sharing equally means divide.', 'Sharing equally means divide: ' + a.n + '/' + a.d + ' ÷ ' + n + '. '); }
    if (k === 1) { const w = rnd(2, 8), b = F(1, pick([2, 3, 4, 6])), v = whole(w); return out([`${who[1]} has `, { v }, ` yards of ribbon. Each bow needs `, { v: b, mode: 'improper' }, ` of a yard. How many bows can ${who[1]} make?`], v, b, 'How many pieces of that size fit into the whole length?', 'How many pieces fit means divide: ' + w + ' ÷ ' + b.n + '/' + b.d + '. '); }
    if (k === 2) { const a = proper(pick([3, 4, 5, 6])), n = pick([2, 3, 4]), v = whole(n); return out([`A pan has `, { v: a, mode: 'improper' }, ` of a pound of cheese. It is cut into `, { v }, ` equal pieces. How many pounds is each piece?`], a, v, 'Cutting into equal pieces means divide.', 'Equal pieces means divide: ' + a.n + '/' + a.d + ' ÷ ' + n + '. '); }
    if (k === 3) { const w = rnd(2, 6), b = F(1, pick([2, 3, 4, 5, 6])), v = whole(w); return out([`A bag holds `, { v }, ` pounds of rice. ${who[3]} fills small jars with `, { v: b, mode: 'improper' }, ` of a pound each. How many jars can be filled?`], v, b, 'How many jars of that size fit into the bag?', 'How many fit means divide: ' + w + ' ÷ ' + b.n + '/' + b.d + '. '); }
    const a = mixedNum(pick([2, 3, 4]), 3), b = proper(pick([3, 4, 5])); if (div(a, b).d !== 1) return wordsQ();   // a whole number of pieces
    return out([`${who[4]} has `, { v: a }, ` yards of string. Each piece is `, { v: b, mode: 'improper' }, ` of a yard. How many pieces can ${who[4]} cut?`], a, b, 'How many pieces of that size fit into the length you have?', 'How many fit means divide: ' + txt(a, 'improper') + ' \u00f7 ' + b.n + '/' + b.d + '. ');
  }

  /* the toughest: missing numbers, and mixed numbers divided by whole numbers or fractions */
  function reviewQ() {
    const k = rnd(0, 3);
    if (k === 0) { const a = mixedNum(pick([2, 3, 4, 5]), 4), n = pick([2, 3, 4, 5, 6]); return divQ(a, whole(n), 'Change the mixed number to an improper fraction, then divide.', '', 'mixed'); }
    if (k === 1) { const a = proper(pick([3, 4, 5, 6])), b = proper(pick([3, 4, 5, 6, 8])); let bb = b; while (L0.eq(a, bb)) bb = proper(pick([3, 4, 5, 6, 8])); return divQ(a, bb, 'Multiply by the reciprocal of the fraction you divide by.'); }
    if (k === 2) {   // a missing divisor-or-factor: w ÷ ? = q  (answer is a unit fraction)
      const d = pick([2, 3, 4, 5, 6]), w = rnd(2, 8), q = w * d, qq = build([{ v: whole(w) }, { op: '/' }, '? = ', { v: whole(q) }]);
      return { q: qq.h.replace('? =', '<b>?</b> =') + ' <span class="hint-i">What is the missing number? Simplest form.</span>', say: qq.s.replace('divided by ? =', 'divided by what equals'), ...ans(F(1, d)), chk: chkOf(whole(w), F(1, d)), hint: 'How many of the missing number fit into the first number?', why: `${w} ÷ ? = ${q} means ${q} pieces fit into ${w}, so each piece is ${w}/${q} = 1/${d}. Check: ${w} ÷ 1/${d} = ${w} × ${d} = ${q}.` };
    }
    const a = whole(rnd(2, 9)), b = mixedNum(pick([2, 3, 4]), 2); return divQ(a, b, 'Change the mixed number to an improper fraction, then multiply by its reciprocal.', '', 'improper', 'mixed');
  }

  const DIVGEN = { whyDiv, fracByWholeQ, wholeByFracQ, modelQ, shareQ, wordsQ, reviewQ, bar };
  if (typeof module !== 'undefined') module.exports = DIVGEN; else root.DIVGEN = DIVGEN;
})(typeof window !== 'undefined' ? window : globalThis);
