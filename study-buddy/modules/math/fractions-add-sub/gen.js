/* Adding and Subtracting Fractions (Dimensions Math 5, chapter 4): problem generators.
   Every problem is made fresh with its answer and a worked explanation. All arithmetic is on whole numbers
   (a fraction is {n, d} with n over d), so there are no rounding surprises. Runs in the browser, and in Node for the
   generator check (_dev/tests/math_gen_check.mjs). Each problem also carries `chk`, a plain expression the check
   solves again on its own, and `form` (how the typed answer must be written). */
(function (root) {
  'use strict';
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
  const lcm = (a, b) => a / gcd(a, b) * b;
  const F = (n, d = 1) => { const g = gcd(n, d) || 1; return { n: n / g, d: d / g }; };      // always reduced
  const raw = (n, d) => ({ n, d });                                                          // keep as written (not reduced)
  const add = (x, y) => F(x.n * y.d + y.n * x.d, x.d * y.d);
  const sub = (x, y) => F(x.n * y.d - y.n * x.d, x.d * y.d);
  const cmp = (x, y) => x.n * y.d - y.n * x.d;
  const eq = (x, y) => cmp(x, y) === 0;
  const NAMES = { 2: ['half', 'halves'], 3: ['third', 'thirds'], 4: ['fourth', 'fourths'], 5: ['fifth', 'fifths'], 6: ['sixth', 'sixths'], 7: ['seventh', 'sevenths'], 8: ['eighth', 'eighths'], 9: ['ninth', 'ninths'], 10: ['tenth', 'tenths'], 11: ['eleventh', 'elevenths'], 12: ['twelfth', 'twelfths'] };

  /* ---------- writing numbers: plain text, HTML, and speech ---------- */
  const parts = v => ({ w: Math.floor(v.n / v.d), n: v.n % v.d, d: v.d });
  /* mode 'mixed' (default): 1 3/4 ; 'improper': 7/4 */
  function txt(v, mode = 'mixed') {
    if (v.d === 1) return String(v.n);
    if (mode === 'improper') return v.n + '/' + v.d;
    const p = parts(v); return p.w ? (p.n ? p.w + ' ' + p.n + '/' + p.d : String(p.w)) : p.n + '/' + p.d;
  }
  const fracH = (n, d) => `<span class="frac" data-n="${n}" data-d="${d}"><span class="fn">${n}</span><span class="fd">${d}</span></span>`;
  function html(v, mode = 'mixed') {
    if (v.d === 1) return `<span class="num" data-w="${v.n}">${v.n}</span>`;
    if (mode === 'improper') return fracH(v.n, v.d);
    const p = parts(v);
    return p.w ? (p.n ? `<span class="mixed" data-w="${p.w}"><b>${p.w}</b>${fracH(p.n, p.d)}</span>` : `<span class="num" data-w="${p.w}">${p.w}</span>`) : fracH(p.n, p.d);
  }
  function say(v, mode = 'mixed') {
    const one = (n, d) => { const nm = NAMES[d]; return nm ? n + ' ' + nm[n === 1 ? 0 : 1] : n + ' over ' + d; };
    if (v.d === 1) return String(v.n);
    if (mode === 'improper') return one(v.n, v.d);
    const p = parts(v); return p.w ? (p.n ? p.w + ' and ' + one(p.n, p.d) : String(p.w)) : one(p.n, p.d);
  }
  const OPH = { '+': '+', '-': '−', '*': '×', '/': '÷' };
  /* a question built from pieces: strings, and {v, mode} numbers. Returns the HTML, the spoken text, and the plain text */
  function build(pieces) {
    let h = '', s = '', t = '';
    pieces.forEach(p => {
      if (typeof p === 'string') { h += p; s += p; t += p; }
      else if (p.op) { h += ' ' + OPH[p.op] + ' '; s += { '+': ' plus ', '-': ' minus ' }[p.op]; t += ' ' + OPH[p.op] + ' '; }
      else { h += html(p.v, p.mode); s += say(p.v, p.mode); t += txt(p.v, p.mode); }
    });
    return { h, s, t };
  }

  /* ---------- picking fractions ---------- */
  const DENS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12];
  function denPair(maxL) {
    for (;;) { const a = pick(DENS), b = pick(DENS); if (a !== b && lcm(a, b) <= maxL) return [a, b]; }
  }
  const proper = d => { for (;;) { const n = rnd(1, d - 1); if (gcd(n, d) === 1) return raw(n, d); } };       // in lowest terms
  const unlikePair = maxL => { const [a, b] = denPair(maxL); return [proper(a), proper(b)]; };

  /* ---------- the checking contract: how a typed answer is judged (see SBT.answer, kind 'fraction') ---------- */
  const ans = (v, form = 'any') => ({ a: txt(v, form === 'improper' ? 'improper' : 'mixed'), form });

  /* ---------- explanations ---------- */
  const eqText = (v, L) => txt(raw(v.n * (L / v.d), L), 'improper');
  function finish(nn, dd) {                // a result n/d written in simplest form, with the steps
    const v = F(nn, dd), bits = [];
    if (gcd(nn, dd) > 1) bits.push(nn + '/' + dd + ' = ' + txt(raw(v.n, v.d), 'improper') + ' in simplest form');
    if (v.d > 1 && v.n > v.d) bits.push((bits.length ? txt(raw(v.n, v.d), 'improper') : nn + '/' + dd) + ' = ' + txt(v));
    return { v, text: bits.length ? ' ' + bits.join('. ') + '.' : '' };
  }
  /* x op y, where x and y are fractions or mixed numbers ({n, d} improper; mixed: true if they were shown as mixed numbers) */
  function whyTwo(op, x, y, mixed) {
    const sign = op === '+' ? '+' : '−', word = op === '+' ? 'Add' : 'Subtract';
    if (!mixed) {
      if (x.d === y.d) { const r = op === '+' ? x.n + y.n : x.n - y.n; return `The denominators are the same, so ${word.toLowerCase()} the numerators: ${x.n} ${sign} ${y.n} = ${r}, so ${r}/${x.d}.` + finish(r, x.d).text; }
      const L = lcm(x.d, y.d), a = x.n * (L / x.d), b = y.n * (L / y.d), r = op === '+' ? a + b : a - b;
      const conv = [x, y].filter(v => v.d !== L).map(v => `${txt(v, 'improper')} = ${eqText(v, L)}`).join(' and ');
      return `The common denominator of ${x.d} and ${y.d} is ${L}. ${conv}. ${a}/${L} ${sign} ${b}/${L} = ${r}/${L}.` + finish(r, L).text;
    }
    const px = parts(x), py = parts(y), L = lcm(px.d, py.d), a = px.n * (L / px.d), b = py.n * (L / py.d);
    const mconv = [[x, px, a], [y, py, b]].filter(t => t[1].d !== L).map(t => `${txt(raw(t[0].n, t[0].d))} = ${t[1].w} ${t[2]}/${L}`).join(' and ');
    let s = `The common denominator of ${px.d} and ${py.d} is ${L}` + (mconv ? `: ${mconv}. ` : '. ');
    if (op === '+') {
      const fr = a + b, W = px.w + py.w;
      s += `Add the whole numbers: ${px.w} + ${py.w} = ${W}. Add the fractions: ${a}/${L} + ${b}/${L} = ${fr}/${L}.`;
      const f = finish(fr, L); s += f.text;
      const tot = F(W * L + fr, L); s += ` ${W} + ${txt(f.v)} = ${txt(tot)}.`.replace(/^ (\d+) \+ 0 =/, ' $1 =');
      return s;
    }
    if (a >= b) {
      const W = px.w - py.w, fr = a - b;
      s += `Subtract the whole numbers: ${px.w} − ${py.w} = ${W}. Subtract the fractions: ${a}/${L} − ${b}/${L} = ${fr}/${L}.`;
      if (fr) s += finish(fr, L).text;
      return s + ` The answer is ${txt(F(W * L + fr, L))}.`;
    }
    const W = px.w - 1, top = a + L, fr = top - b, WW = W - py.w;
    s += `${a}/${L} is less than ${b}/${L}, so rename 1 whole of ${px.w}: ${px.w} ${a}/${L} = ${W} ${top}/${L}. Subtract the whole numbers: ${W} − ${py.w} = ${WW}. Subtract the fractions: ${top}/${L} − ${b}/${L} = ${fr}/${L}.`;
    if (fr) s += finish(fr, L).text;
    return s + ` The answer is ${txt(F(WW * L + fr, L))}.`;
  }

  /* ---------- the problem makers ---------- */
  /* Lesson 1: fractions and division */
  function divisionQ() {
    const k = rnd(0, 5);
    if (k <= 1) {                                     // a ÷ b written as a fraction
      const b = rnd(3, 9); let a; do a = rnd(1, b - 1); while (a === b);
      const q = build([`${a} ÷ ${b} = ?`]); const v = F(a, b);
      return { q: `${a} ÷ ${b} is the same as which fraction? <span class="hint-i">Write it in simplest form.</span>`, say: `${a} divided by ${b}. Write it as a fraction.`, ...ans(v, 'improper'), chk: `${a}/${b}`, hint: 'A fraction bar means divide. The number being shared is the top number.',
        why: `${a} ÷ ${b} = ${a}/${b}.` + (gcd(a, b) > 1 ? ` In simplest form that is ${txt(v)}.` : '') };
    }
    if (k === 2) {                                    // a ÷ b with a > b, as a mixed number
      let b = rnd(2, 9), a; do a = rnd(b + 1, b * 5); while (a % b === 0);
      const v = F(a, b), p = parts(v);
      return { q: `Write ${a} ÷ ${b} as a mixed number in simplest form.`, say: `Write ${a} divided by ${b} as a mixed number.`, ...ans(v, 'mixed'), chk: `${a}/${b}`, hint: `How many whole ${b}s fit into ${a}? What is left over is the fraction.`,
        why: `${a} ÷ ${b} = ${a}/${b}. ${b} goes into ${a} ${p.w} time${p.w === 1 ? '' : 's'} with ${a - p.w * b} left over, so the answer is ${txt(F(a, b))}` + (gcd(a - p.w * b, b) > 1 ? ' after writing the remainder fraction in simplest form.' : '.') };
    }
    if (k === 3) {                                    // fraction as a division: what number is divided
      const b = rnd(3, 9), a = rnd(1, b - 1), v = F(a, b);
      if (gcd(a, b) > 1) return divisionQ();
      return { q: `${html(v, 'improper')} = ${a} ÷ ?`, say: `${say(v, 'improper')} equals ${a} divided by what?`, a: String(b), form: 'any', chk: `${a}/${b}`, hint: 'The bottom number of a fraction is the number you divide by.', why: `${a}/${b} means ${a} ÷ ${b}, so the missing number is ${b}.`, show: String(b) };
    }
    /* word problems: things shared equally */
    const things = pick([['pizzas', 'pizza'], ['sandwiches', 'sandwich'], ['pies', 'pie'], ['loaves of bread', 'loaf of bread'], ['liters of juice', 'liter of juice'], ['yards of ribbon', 'yard of ribbon']]);
    const people = pick(['friends', 'children', 'cousins', 'neighbors']);
    let kk = rnd(3, 8), n; if (k === 4) { n = rnd(1, kk - 1); } else { do n = rnd(kk + 1, kk * 3); while (n % kk === 0); }
    const v = F(n, kk);
    const mode = n < kk ? 'improper' : 'mixed';
    return { q: `${n} ${things[0]} are shared equally among ${kk} ${people}. How much does each one get? Write it as a ${n < kk ? 'fraction' : 'mixed number'} in simplest form.`, say: `${n} ${things[0]} are shared equally among ${kk} ${people}. How much does each one get?`, ...ans(v, mode), chk: `${n}/${kk}`, hint: `Divide ${n} by ${kk}. A fraction bar means divide.`,
      why: `Each one gets ${n} \u00f7 ${kk} = ${n}/${kk}` + (n > kk || gcd(n, kk) > 1 ? ` = ${txt(v)}` : '') + '.' };
  }

  /* picture of a bar: d equal parts, n shaded, with dashed lines at every L-th part (the common denominator) */
  function bar(n, d, L, color) {
    const W = 240, H = 26; let s = `<svg class="fbar" viewBox="0 0 ${W + 2} ${H + 2}" role="img" aria-label="${n} of ${d} equal parts shaded"><rect x="1" y="1" width="${W}" height="${H}" fill="var(--surface)" stroke="var(--navy)" stroke-width="2"/>`;
    s += `<rect x="1" y="1" width="${W * n / d}" height="${H}" fill="${color}" opacity=".85"/>`;
    for (let i = 1; i < d; i++) s += `<line x1="${1 + W * i / d}" y1="1" x2="${1 + W * i / d}" y2="${H + 1}" stroke="var(--navy)" stroke-width="2"/>`;
    if (L) for (let i = 1; i < L; i++) if ((i * d) % L !== 0) s += `<line x1="${1 + W * i / L}" y1="1" x2="${1 + W * i / L}" y2="${H + 1}" stroke="var(--navy)" stroke-width="1" stroke-dasharray="3 3" opacity=".55"/>`;
    return s + '</svg>';
  }
  const bars = (x, y, op) => { const L = lcm(x.d, y.d); return `<div class="fbars"><div><span class="fbl">${html(x, 'improper')}</span>${bar(x.n, x.d, L, 'var(--coral)')}</div><div><span class="fbl">${html(y, 'improper')}</span>${bar(y.n, y.d, L, 'var(--teal)')}</div></div>`; };

  /* Lessons 2 and 3 with models: a quiz with pictures */
  function modelQ() {
    let x, y, op = Math.random() < 0.55 ? '+' : '-';
    for (;;) { [x, y] = unlikePair(12); if (op === '-' && cmp(x, y) < 0) [x, y] = [y, x]; if (cmp(x, y) !== 0) break; }
    const r = op === '+' ? add(x, y) : sub(x, y), L = lcm(x.d, y.d);
    const qq = build([op === '+' ? 'Use the models. What is ' : 'Use the models. What is ', { v: x, mode: 'improper' }, { op }, { v: y, mode: 'improper' }, '?']);
    const good = txt(r), rl = r.n * (L / r.d), cand = [];            // rl: the answer counted in L-ths
    cand.push(raw(op === '+' ? x.n + y.n : Math.abs(x.n - y.n), op === '+' ? x.d + y.d : Math.max(x.d, y.d)));   // the common mistake: add the tops and the bottoms
    [1, -1, 2, -2].forEach(k => cand.push(raw(rl + k, L)));
    cand.push(raw(x.n + y.n, L)); cand.push(raw(Math.abs(x.n - y.n), Math.min(x.d, y.d)));
    const w3 = [], okc = c => c.n > 0 && c.d > 0 && c.n * r.d !== r.n * c.d && !w3.includes(txt(F(c.n, c.d), 'mixed'));
    shuffle(cand).forEach(c => { if (w3.length < 3 && okc(c)) w3.push(c.d === x.d + y.d ? txt(c, 'improper') : txt(F(c.n, c.d))); });   // the add-tops-and-bottoms mistake stays as written, like 4/16
    for (let i = 3; w3.length < 3; i++) { const c = raw(rl + i, L); if (okc(c)) w3.push(txt(F(c.n, c.d))); }
    return { q: qq.t, qh: qq.h, say: qq.s, html: bars(x, y, op), a: good, wrong: w3, chk: `${x.n}/${x.d}${op}${y.n}/${y.d}`,
      why: whyTwo(op, x, y, false), hint: 'The dashed lines cut both bars into pieces of the same size.' };
  }

  /* Lesson 4: improper fractions and mixed numbers */
  function improperQ() {
    const k = rnd(0, 3), d = pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 12]);
    if (k === 0) {                                    // improper -> mixed (in lowest terms already)
      let v; do v = raw(rnd(d + 1, d * 5), d); while (v.n % d === 0 || gcd(v.n % d, d) > 1);
      return { q: `Write ${html(v, 'improper')} as a mixed number.`, say: `Write ${say(v, 'improper')} as a mixed number.`, ...ans(F(v.n, v.d), 'mixed'), chk: `${v.n}/${v.d}`, hint: `How many whole ${d}s fit in ${v.n}? Whatever is left over is the fraction.`,
        why: `${v.n} ÷ ${d} = ${Math.floor(v.n / d)} with ${v.n % d} left over, so ${v.n}/${d} = ${txt(v)}.` };
    }
    if (k === 1) {                                    // mixed -> improper
      const w = rnd(1, 6); const f = proper(d), v = F(w * d + f.n, d);
      return { q: `Write ${html(v, 'mixed')} as an improper fraction.`, say: `Write ${say(v, 'mixed')} as an improper fraction.`, ...ans(v, 'improper'), chk: `${v.n}/${v.d}`, hint: `Multiply the whole number by the denominator, then add the numerator.`,
        why: `${w} × ${d} = ${w * d}, and ${w * d} + ${f.n} = ${w * d + f.n}. So ${w} ${f.n}/${d} = ${w * d + f.n}/${d}.` };
    }
    /* reducible improper fraction to a reduced mixed number */
    let m, n, w, r; for (;;) { m = pick([2, 3, 4, 5]); const base = proper(pick([3, 4, 5, 6, 7])); n = base.n * m; const dd = base.d * m; if (dd > 24) continue; w = rnd(1, 4); r = raw(w * dd + n, dd); if (gcd(n, dd) > 1 && n < dd) break; }
    const v = F(r.n, r.d);
    return { q: `Write ${html(r, 'improper')} as a mixed number in simplest form.`, say: `Write ${say(r, 'improper')} as a mixed number in simplest form.`, ...ans(v, 'mixed'), chk: `${r.n}/${r.d}`, hint: 'Find the whole number first, then reduce the fraction that is left.',
      why: `${r.n} ÷ ${r.d} = ${w} with ${n} left over, so ${r.n}/${r.d} = ${w} ${n}/${r.d}. Divide the top and bottom of ${n}/${r.d} by ${gcd(n, r.d)}: ${txt(raw(n / gcd(n, r.d), r.d / gcd(n, r.d)), 'improper')}. The answer is ${txt(v)}.` };
  }

  /* Lessons 2, 3 and 4 (practice): add and subtract fractions with unlike denominators */
  function unlikeQ(threeOk = true) {
    const three = threeOk && Math.random() < 0.28;
    if (three) {
      let a, b, c; do { const [d1, d2] = denPair(12); a = proper(d1); b = proper(d2); c = proper(pick([d1, d2, lcm(d1, d2) <= 12 ? lcm(d1, d2) : d1].filter(d => d > 1))); } while (add(add(a, b), c).n > add(add(a, b), c).d * 3);
      const v = add(add(a, b), c), L = lcm(lcm(a.d, b.d), c.d);
      const qq = build([{ v: a, mode: 'improper' }, { op: '+' }, { v: b, mode: 'improper' }, { op: '+' }, { v: c, mode: 'improper' }, ' = ?']);
      const aa = a.n * (L / a.d), bb = b.n * (L / b.d), cc = c.n * (L / c.d);
      return { q: qq.h + ' <span class="hint-i">Write it in simplest form.</span>', say: qq.s, ...ans(v), chk: `${a.n}/${a.d}+${b.n}/${b.d}+${c.n}/${c.d}`, hint: 'Find one common denominator for all three fractions.',
        why: `The common denominator of ${a.d}, ${b.d} and ${c.d} is ${L}. ${[a, b, c].filter(v => v.d !== L).map(v => txt(v, 'improper') + ' = ' + eqText(v, L)).join(', ')}. ${aa}/${L} + ${bb}/${L} + ${cc}/${L} = ${aa + bb + cc}/${L}.` + finish(aa + bb + cc, L).text };
    }
    const op = Math.random() < 0.5 ? '+' : '-'; let x, y;
    for (;;) { [x, y] = unlikePair(24); if (op === '-' && cmp(x, y) < 0) [x, y] = [y, x]; if (cmp(x, y) !== 0) break; }
    const v = op === '+' ? add(x, y) : sub(x, y);
    const qq = build([{ v: x, mode: 'improper' }, { op }, { v: y, mode: 'improper' }, ' = ?']);
    return { q: qq.h + ' <span class="hint-i">Write it in simplest form.</span>', say: qq.s, ...ans(v), chk: `${x.n}/${x.d}${op}${y.n}/${y.d}`, hint: 'Find a common denominator: a number that both denominators go into.', why: whyTwo(op, x, y, false) };
  }

  /* make a mixed number: whole part 1 to maxW and a fraction in lowest terms */
  const mixedNum = (d, maxW = 6) => { const f = proper(d), w = rnd(1, maxW); return F(w * f.d + f.n, f.d); };

  /* Lessons 5 and 6: add mixed numbers */
  function mixedAddQ() {
    if (Math.random() < 0.3) {                       // three numbers: group the friendly ones first
      const [d1, d2] = denPair(12); const x = mixedNum(d1, 4), y = mixedNum(d2, 4), z = mixedNum(pick([d1, d2]), 4);
      const v = add(add(x, y), z);
      const qq = build([{ v: x }, { op: '+' }, { v: y }, { op: '+' }, { v: z }, ' = ?']);
      return { q: qq.h + ' <span class="hint-i">Write it in simplest form.</span>', say: qq.s, ...ans(v), chk: `${x.n}/${x.d}+${y.n}/${y.d}+${z.n}/${z.d}`, hint: 'You can add in any order. Add the whole numbers, then add the fractions.',
        why: `Add the whole numbers: ${parts(x).w} + ${parts(y).w} + ${parts(z).w} = ${parts(x).w + parts(y).w + parts(z).w}. Add the fractions: ${txt(raw(parts(x).n, parts(x).d), 'improper')} + ${txt(raw(parts(y).n, parts(y).d), 'improper')} + ${txt(raw(parts(z).n, parts(z).d), 'improper')} = ${txt(add(add(F(parts(x).n, parts(x).d), F(parts(y).n, parts(y).d)), F(parts(z).n, parts(z).d)), 'improper')}. Put them together: ${txt(v)}.` };
    }
    let x, y; do { const [d1, d2] = denPair(24); x = mixedNum(d1, 5); y = mixedNum(d2, 5); } while (parts(x).n === 0 || parts(y).n === 0);
    const v = add(x, y);
    const qq = build([{ v: x }, { op: '+' }, { v: y }, ' = ?']);
    return { q: qq.h + ' <span class="hint-i">Write it in simplest form.</span>', say: qq.s, ...ans(v), chk: `${x.n}/${x.d}+${y.n}/${y.d}`, hint: 'Add the whole numbers and the fractions separately. If the fractions make more than 1, regroup.', why: whyTwo('+', x, y, true) };
  }

  /* Lessons 7 and 8: subtract mixed numbers, without and then with renaming */
  function mixedSubQ(rename) {
    for (let tries = 0; tries < 400; tries++) {
      const [d1, d2] = denPair(24); const x = mixedNum(d1, 6), y = mixedNum(d2, 5);
      const px = parts(x), py = parts(y); if (!px.n || !py.n || cmp(x, y) <= 0) continue;
      const L = lcm(px.d, py.d), a = px.n * (L / px.d), b = py.n * (L / py.d);
      if (rename === true && a >= b) continue; if (rename === false && a < b) continue;
      const v = sub(x, y); if (v.n === 0) continue;
      const qq = build([{ v: x }, { op: '-' }, { v: y }, ' = ?']);
      return { q: qq.h + ' <span class="hint-i">Write it in simplest form.</span>', say: qq.s, ...ans(v), chk: `${x.n}/${x.d}-${y.n}/${y.d}`, hint: a < b ? 'The first fraction is smaller, so rename 1 whole from the whole number.' : 'Subtract the whole numbers and the fractions separately.', why: whyTwo('-', x, y, true) };
    }
  }

  /* Lesson 4 and 9 word problems */
  const WHO = ['Mia', 'Leo', 'Priya', 'Sam', 'Zoe', 'Omar', 'Nina', 'Ben', 'Lucia', 'Theo'];
  function wordsQ() {
    const kind = rnd(0, 5), who = shuffle(WHO), mixedForms = Math.random() < 0.6;
    const mk = () => { const [d1, d2] = denPair(24); return [mixedForms ? mixedNum(d1, 4) : proper(d1), mixedForms ? mixedNum(d2, 4) : proper(d2)]; };
    let x, y; const out = (pieces, v, why, hint, chk) => { const qq = build(pieces); return { q: qq.h + ' <span class="hint-i">Write it in simplest form.</span>', say: qq.s, ...ans(v), why, hint, chk }; };
    if (kind === 0) {                                  // total distance
      [x, y] = mk(); const v = add(x, y), u = mixedForms ? 'miles' : 'mile';
      return out([`${who[0]} walked `, { v: x }, ` miles on Saturday and `, { v: y }, ` miles on Sunday. How many miles did ${who[0]} walk in all?`], v, whyTwo('+', x, y, mixedForms), 'Walking in all means add.', `${x.n}/${x.d}+${y.n}/${y.d}`);
    }
    if (kind === 1) {                                  // ribbon left over
      do { [x, y] = mk(); } while (cmp(x, y) <= 0 && ([x, y] = [y, x]) && cmp(x, y) === 0);
      const v = sub(x, y);
      return out([`${who[1]} had a ribbon `, { v: x }, ` yards long. ${who[1]} cut off `, { v: y }, ` yards for a gift. How many yards of ribbon are left?`], v, whyTwo('-', x, y, mixedForms), 'Cut off means take away: subtract.', `${x.n}/${x.d}-${y.n}/${y.d}`);
    }
    if (kind === 2) {                                  // recipe
      [x, y] = mk(); const v = add(x, y), item = pick(['flour', 'sugar', 'oats', 'rice']);
      return out([`A recipe uses `, { v: x }, ` cups of ${item} for the dough and `, { v: y }, ` cups of ${item} for the topping. How many cups of ${item} does it use altogether?`], v, whyTwo('+', x, y, mixedForms), 'Altogether means add.', `${x.n}/${x.d}+${y.n}/${y.d}`);
    }
    if (kind === 3) {                                  // how much more
      do { [x, y] = mk(); } while (eq(x, y));
      if (cmp(x, y) < 0) [x, y] = [y, x]; const v = sub(x, y);
      return out([`${who[2]}'s bean plant is `, { v: x }, ` feet tall. ${who[3]}'s plant is `, { v: y }, ` feet tall. How many feet taller is ${who[2]}'s plant?`], v, whyTwo('-', x, y, mixedForms), 'How much taller means find the difference: subtract.', `${x.n}/${x.d}-${y.n}/${y.d}`);
    }
    if (kind === 4) {                                  // two steps: add two, then take away the third
      const [d1, d2] = denPair(12); const a = mixedNum(d1, 3), b = mixedNum(d2, 3), s = add(a, b); let c = mixedNum(pick([d1, d2]), 2); if (cmp(s, c) <= 0) c = F(1, 2);
      const v = sub(s, c);
      return out([`${who[4]} bought `, { v: a }, ` pounds of apples and `, { v: b }, ` pounds of pears. ${who[4]} gave `, { v: c }, ` pounds away. How many pounds does ${who[4]} have left?`], v,
        `First add: ${txt(a)} + ${txt(b)} = ${txt(s)} pounds. Then subtract: ${txt(s)} − ${txt(c)} = ${txt(v)} pounds.`, 'Two steps. First find how many pounds in all, then take some away.', `${a.n}/${a.d}+${b.n}/${b.d}-${c.n}/${c.d}`);
    }
    do { [x, y] = mk(); } while (eq(x, y));                // how much longer / shorter than a goal
    const big = cmp(x, y) > 0 ? x : y, small = big === x ? y : x, v = sub(big, small);
    return out([`${who[5]} swam `, { v: big }, ` hours this week and ${who[6]} swam `, { v: small }, ` hours. How many more hours did ${who[5]} swim?`], v, whyTwo('-', big, small, mixedForms), 'How many more means subtract the smaller from the larger.', `${big.n}/${big.d}-${small.n}/${small.d}`);
  }

  /* the toughest: missing numbers, three-term mixes, bigger mixed numbers */
  function reviewQ() {
    const k = rnd(0, 4);
    if (k === 0) {                                     // x + ? = total
      let a, t; do { const [d1, d2] = denPair(24); a = mixedNum(d1, 3); t = add(a, mixedNum(d2, 3)); } while (cmp(t, a) <= 0);
      const v = sub(t, a), qq = build([{ v: a }, { op: '+' }, ' ? = ', { v: t }]);
      return { q: qq.h.replace('? =', '<b>?</b> =') + ' <span class="hint-i">What is the missing number? Simplest form.</span>', say: qq.s.replace('plus  ? = ', 'plus what equals '), ...ans(v), chk: `${t.n}/${t.d}-${a.n}/${a.d}`, hint: 'To find a missing addend, subtract the part you know from the total.',
        why: `The missing number is the total minus the part: ${txt(t)} − ${txt(a)}. ` + whyTwo('-', t, a, true) };
    }
    if (k === 1) {                                     // ? - y = result
      let r, y; do { const [d1, d2] = denPair(24); r = mixedNum(d1, 3); y = mixedNum(d2, 3); } while (false);
      const x = add(r, y), qq = build(['? ', { op: '-' }, { v: y }, ' = ', { v: r }]);
      return { q: qq.h.replace(/^\? /, '<b>?</b> ') + ' <span class="hint-i">What is the missing number? Simplest form.</span>', say: qq.s.replace('? minus', 'what minus'), ...ans(x), chk: `${r.n}/${r.d}+${y.n}/${y.d}`, hint: 'To find a missing starting number, add the part taken away to what is left.',
        why: `Undo the subtraction by adding: ${txt(r)} + ${txt(y)}. ` + whyTwo('+', r, y, true) };
    }
    if (k === 2) {                                     // three terms mixed: a + b - c
      let a, b, c, v; for (;;) { const [d1, d2] = denPair(12); a = proper(d1); b = proper(d2); c = proper(pick([d1, d2])); v = sub(add(a, b), c); if (v.n > 0) break; }
      const qq = build([{ v: a, mode: 'improper' }, { op: '+' }, { v: b, mode: 'improper' }, { op: '-' }, { v: c, mode: 'improper' }, ' = ?']);
      const s = add(a, b);
      return { q: qq.h + ' <span class="hint-i">Simplest form.</span>', say: qq.s, ...ans(v), chk: `${a.n}/${a.d}+${b.n}/${b.d}-${c.n}/${c.d}`, hint: 'Work from left to right: add first, then subtract.',
        why: `Left to right. First: ${whyTwo('+', a, b, false)} Then: ${txt(s)} − ${txt(c, 'improper')}. ` + whyTwo('-', s, c, false) };
    }
    if (k === 3) return mixedSubQ(true);                // subtract with renaming, bigger numbers
    const [d1, d2] = denPair(24); const x = mixedNum(d1, 9), y = mixedNum(d2, 9);   // a pair of mixed numbers, either way
    if (Math.random() < 0.5 || cmp(x, y) === 0) { const v = add(x, y), qq = build([{ v: x }, { op: '+' }, { v: y }, ' = ?']); return { q: qq.h + ' <span class="hint-i">Simplest form.</span>', say: qq.s, ...ans(v), chk: `${x.n}/${x.d}+${y.n}/${y.d}`, hint: 'Add the whole numbers, add the fractions, then regroup if needed.', why: whyTwo('+', x, y, true) }; }
    const [bg, sm] = cmp(x, y) > 0 ? [x, y] : [y, x], v = sub(bg, sm), qq = build([{ v: bg }, { op: '-' }, { v: sm }, ' = ?']);
    return { q: qq.h + ' <span class="hint-i">Simplest form.</span>', say: qq.s, ...ans(v), chk: `${bg.n}/${bg.d}-${sm.n}/${sm.d}`, hint: 'If the first fraction is too small, rename 1 whole.', why: whyTwo('-', bg, sm, true) };
  }

  const FRACGEN = { F, add, sub, cmp, gcd, lcm, parts, txt, html, say, whyTwo, bar, bars, divisionQ, modelQ, improperQ, unlikeQ, mixedAddQ, mixedSubQ, wordsQ, reviewQ };
  if (typeof module !== 'undefined') module.exports = FRACGEN; else root.FRACGEN = FRACGEN;
})(typeof window !== 'undefined' ? window : globalThis);
