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
  const OPH = { '+': '+', '-': '−' };
  /* a question built from pieces: strings, {op}, and {v, mode} numbers. Returns the HTML, the spoken text, and the plain text */
  function build(pieces) {
    let h = '', s = '', t = '';
    pieces.forEach(p => {
      if (typeof p === 'string') { h += p; s += p; t += p; }
      else if (p.op) { h += ' ' + OPH[p.op] + ' '; s += { '+': ' plus ', '-': ' minus ' }[p.op]; t += ' ' + OPH[p.op] + ' '; }
      else { h += html(p.v, p.mode); s += say(p.v, p.mode); t += txt(p.v, p.mode); }
    });
    return { h, s, t };
  }
  const unit = (v, one, many) => v.n <= v.d ? one : many;     // 1/2 mile, 1 mile, 1 1/2 miles

  /* ---------- picking fractions ---------- */
  const DENS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12];
  function denPair(maxL) { for (;;) { const a = pick(DENS), b = pick(DENS); if (a !== b && lcm(a, b) <= maxL) return [a, b]; } }
  const proper = d => { for (;;) { const n = rnd(1, d - 1); if (gcd(n, d) === 1) return raw(n, d); } };       // in lowest terms
  const unlikePair = maxL => { const [a, b] = denPair(maxL); return [proper(a), proper(b)]; };
  /* a mixed number: whole part 1 to maxW and a fraction in lowest terms */
  const mixedNum = (d, maxW = 6) => { const f = proper(d), w = rnd(1, maxW); return F(w * f.d + f.n, f.d); };

  /* how a typed answer is judged (see SBT.answer, kind 'fraction') */
  const ans = (v, form = 'any') => ({ a: txt(v, form === 'improper' ? 'improper' : 'mixed'), form });

  /* ---------- explanations ---------- */
  const eqText = (v, L) => txt(raw(v.n * (L / v.d), L), 'improper');
  const cdText = dens => { const u = [...new Set(dens)].sort((a, b) => a - b); if (u.length === 1) return `The denominators are the same (${u[0]}).`; return `The common denominator of ${u.slice(0, -1).join(', ')} and ${u[u.length - 1]} is ${u.reduce(lcm)}.`; };
  /* "6/8 = 3/4 in simplest form", "7/4 = 1 3/4", "4/4 = 1": a result n/d put in simplest form, with the steps */
  function finish(nn, dd) {
    const v = F(nn, dd), bits = [];
    if (v.d === 1) return { v, text: dd === 1 ? '' : ` ${nn}/${dd} = ${v.n}.` };
    if (gcd(nn, dd) > 1) bits.push(nn + '/' + dd + ' = ' + txt(raw(v.n, v.d), 'improper') + ' in simplest form');
    if (v.n > v.d) bits.push((bits.length ? txt(raw(v.n, v.d), 'improper') : nn + '/' + dd) + ' = ' + txt(v));
    return { v, text: bits.length ? ' ' + bits.join('. ') + '.' : '' };
  }
  const convList = (list, L) => { const seen = new Set(); return list.filter(v => v.d !== L && !seen.has(txt(v, 'improper')) && seen.add(txt(v, 'improper'))).map(v => `${txt(v, 'improper')} = ${eqText(v, L)}`).join(', '); };
  /* x op y, where x and y are fractions or mixed numbers ({n, d} improper; `mixed`: they were shown as mixed numbers) */
  function whyTwo(op, x, y, mixed) {
    const sign = op === '+' ? '+' : '−', word = op === '+' ? 'Add' : 'Subtract';
    if (x.d === 1 && y.d === 1) return `${x.n} ${sign} ${y.n} = ${op === '+' ? x.n + y.n : x.n - y.n}.`;
    if (op === '+' && (x.d === 1 || y.d === 1)) { const f = x.d === 1 ? y : x, w = x.d === 1 ? x : y, pf = parts(f); return `Add the whole numbers and keep the fraction: ${pf.w} + ${w.n} = ${pf.w + w.n}, and ${pf.n}/${pf.d} stays. The answer is ${txt(add(x, y))}.`; }
    if (op === '-' && y.d === 1) { const px = parts(x); return `Subtract the whole numbers and keep the fraction: ${px.w} − ${y.n} = ${px.w - y.n}, and ${px.n}/${px.d} stays. The answer is ${txt(sub(x, y))}.`; }
    if (op === '-' && x.d === 1) {
      const py = parts(y), D = py.d, nn = D - py.n, rest = x.n - 1 - py.w;
      return `There is nothing to subtract the fraction from, so rename 1 whole of ${x.n}: 1 whole = ${D}/${D}, so ${x.n} = ${x.n - 1} ${D}/${D}. ${py.w ? `Subtract the whole numbers: ${x.n - 1} − ${py.w} = ${rest}.` : `The whole number is now ${x.n - 1}.`} Subtract the fractions: ${D}/${D} − ${py.n}/${D} = ${nn}/${D}.` + finish(nn, D).text + ` The answer is ${txt(sub(x, y))}.`;
    }
    if (!mixed) {
      if (x.d === y.d) { const r = op === '+' ? x.n + y.n : x.n - y.n; return `The denominators are the same, so ${word.toLowerCase()} the numerators: ${x.n} ${sign} ${y.n} = ${r}, so ${r}/${x.d}.` + finish(r, x.d).text; }
      const L = lcm(x.d, y.d), a = x.n * (L / x.d), b = y.n * (L / y.d), r = op === '+' ? a + b : a - b;
      return `${cdText([x.d, y.d])} ${convList([x, y], L)}. ${a}/${L} ${sign} ${b}/${L} = ${r}/${L}.` + finish(r, L).text;
    }
    const px = parts(x), py = parts(y), L = lcm(px.d, py.d), a = px.n * (L / px.d), b = py.n * (L / py.d);
    const mconv = [[x, px, a], [y, py, b]].filter(t => t[1].d !== L).map(t => `${txt(raw(t[0].n, t[0].d))} = ${t[1].w ? t[1].w + ' ' : ''}${t[2]}/${L}`).join(' and ');
    let s = cdText([px.d, py.d]) + (mconv ? ` ${mconv}. ` : ' ');
    if (op === '+') {
      const fr = a + b, W = px.w + py.w;
      s += (px.w && py.w ? `Add the whole numbers: ${px.w} + ${py.w} = ${W}.` : `The whole number stays ${W}.`) + ` Add the fractions: ${a}/${L} + ${b}/${L} = ${fr}/${L}.`;
      const f = finish(fr, L); s += f.text;
      const tot = F(W * L + fr, L); s += f.v.d === 1 ? ` ${W} + ${f.v.n} = ${tot.n}.` : f.v.n > f.v.d || W ? ` ${W} + ${txt(f.v)} = ${txt(tot)}.` : '';
      return s;
    }
    if (a >= b) {
      const W = px.w - py.w, fr = a - b;
      s += (py.w ? `Subtract the whole numbers: ${px.w} − ${py.w} = ${W}.` : `The whole number stays ${W}.`) + ` Subtract the fractions: ${a}/${L} − ${b}/${L} = ${fr ? fr + '/' + L : 0}.`;
      if (fr) s += finish(fr, L).text;
      return s + ` The answer is ${txt(F(W * L + fr, L))}.`;
    }
    const W = px.w - 1, top = a + L, fr = top - b, WW = W - py.w;
    s += `${a}/${L} is less than ${b}/${L}, so rename 1 whole of ${px.w}: 1 whole = ${L}/${L}, and ${a}/${L} + ${L}/${L} = ${top}/${L}, so ${px.w} ${a}/${L} = ${W ? W + ' ' : ''}${top}/${L}. ${py.w ? `Subtract the whole numbers: ${W} − ${py.w} = ${WW}.` : (W ? `The whole number is now ${W}.` : '')} Subtract the fractions: ${top}/${L} − ${b}/${L} = ${fr}/${L}.`;
    if (fr) s += finish(fr, L).text;
    return s + ` The answer is ${txt(F(WW * L + fr, L))}.`;
  }
  /* three mixed numbers (or fractions): add the wholes, then the fractions, in any order */
  function whyThree(x, y, z) {
    const ps = [x, y, z].map(parts), L = ps.map(p => p.d).reduce(lcm), W = ps.reduce((s, p) => s + p.w, 0), tops = ps.map(p => p.n * (L / p.d)), S = tops.reduce((s, t) => s + t, 0);
    const conv = convList(ps.map(p => raw(p.n, p.d)), L), f = finish(S, L), tot = add(add(x, y), z);
    return `You can add in any order, so add the whole numbers and the fractions separately. Whole numbers: ${ps.map(p => p.w).join(' + ')} = ${W}. ${cdText(ps.map(p => p.d))}${conv ? ' ' + conv + '.' : ''} Fractions: ${tops.map(t => t + '/' + L).join(' + ')} = ${S}/${L}.` + f.text + ` Put them together: ${W} + ${txt(f.v)} = ${txt(tot)}.`;
  }

  /* ---------- the problem makers ---------- */
  /* Lesson 1: fractions and division */
  function divisionQ() {
    const k = rnd(0, 5);
    if (k <= 1) {                                     // a ÷ b written as a fraction
      const b = rnd(3, 9); let a; do a = rnd(1, b - 1); while (a === b);
      const v = F(a, b);
      return { q: `${a} ÷ ${b} is the same as which fraction? <span class="hint-i">Write it in simplest form.</span>`, say: `${a} divided by ${b}. Write it as a fraction in simplest form.`, ...ans(v, 'improper'), chk: `${a}/${b}`, hint: 'A fraction bar means divide. The number being shared goes on top.',
        why: `${a} ÷ ${b} = ${a}/${b}.` + (gcd(a, b) > 1 ? ` ${a}/${b} = ${txt(v)} in simplest form.` : '') };
    }
    if (k === 2) {                                    // a ÷ b with a > b, as a mixed number
      let b = rnd(2, 9), a; do a = rnd(b + 1, b * 5); while (a % b === 0);
      const v = F(a, b), w = Math.floor(a / b), rem = a - w * b, g = gcd(rem, b);
      return { q: `Write ${a} ÷ ${b} as a mixed number in simplest form.`, say: `Write ${a} divided by ${b} as a mixed number in simplest form.`, ...ans(v, 'mixed'), chk: `${a}/${b}`, hint: `How many whole groups of ${b} are in ${a}? What is left over is the fraction.`,
        why: `${a} ÷ ${b} = ${a}/${b}. ${a} ÷ ${b} = ${w} with ${rem} left over, so ${a}/${b} = ${w} ${rem}/${b}` + (g > 1 ? `. ${rem}/${b} = ${rem / g}/${b / g} in simplest form, so the answer is ${txt(v)}.` : '.') };
    }
    if (k === 3) {                                    // a fraction as a division: what number is divided
      let b, a, v; do { b = rnd(3, 9); a = rnd(1, b - 1); v = F(a, b); } while (gcd(a, b) > 1);
      return { q: `${html(v, 'improper')} = ${a} ÷ ?`, say: `${say(v, 'improper')} equals ${a} divided by what number?`, a: String(b), form: 'any', chk: `${a}/${b}`, hint: 'Write the fraction as a division sentence.', why: `${a}/${b} means ${a} ÷ ${b}, so the missing number is ${b}.`, show: String(b) };
    }
    /* word problems: things shared equally */
    const things = pick([['pizzas', 'pizza'], ['sandwiches', 'sandwich'], ['pies', 'pie'], ['loaves of bread', 'loaf of bread'], ['liters of juice', 'liter of juice'], ['yards of ribbon', 'yard of ribbon']]);
    const people = pick(['friends', 'children', 'cousins', 'neighbors']);
    const kk = rnd(3, 8); let n; if (k === 4) { n = rnd(1, kk - 1); } else { do n = rnd(kk + 1, kk * 3); while (n % kk === 0); }
    const v = F(n, kk), mode = n < kk ? 'improper' : 'mixed', noun = n === 1 ? things[1] : things[0], isare = n === 1 ? 'is' : 'are';
    return { q: `${n} ${noun} ${isare} shared equally among ${kk} ${people}. How much does each one get? Write it as a ${n < kk ? 'fraction' : 'mixed number'} in simplest form.`, say: `${n} ${noun} ${isare} shared equally among ${kk} ${people}. How much does each one get?`, ...ans(v, mode), chk: `${n}/${kk}`, hint: `Divide ${n} by ${kk}. A fraction bar means divide.`,
      why: `Each one gets ${n} ÷ ${kk} = ${n}/${kk}` + (n > kk || gcd(n, kk) > 1 ? ` = ${txt(v)}` : '') + '.' };
  }

  /* picture of a bar: d equal parts, n shaded, with dashed lines at every L-th part (the common denominator) */
  function bar(n, d, L, color) {
    const W = 240, H = 26; let s = `<svg class="fbar" viewBox="0 0 ${W + 2} ${H + 2}" role="img" aria-label="${n} of ${d} equal parts shaded"><rect x="1" y="1" width="${W}" height="${H}" fill="var(--surface)" stroke="var(--navy)" stroke-width="2"/>`;
    s += `<rect x="1" y="1" width="${W * n / d}" height="${H}" fill="${color}" opacity=".85"/>`;
    for (let i = 1; i < d; i++) s += `<line x1="${1 + W * i / d}" y1="1" x2="${1 + W * i / d}" y2="${H + 1}" stroke="var(--navy)" stroke-width="2"/>`;
    if (L) for (let i = 1; i < L; i++) if ((i * d) % L !== 0) s += `<line x1="${1 + W * i / L}" y1="1" x2="${1 + W * i / L}" y2="${H + 1}" stroke="var(--navy)" stroke-width="1" stroke-dasharray="3 3" opacity=".55"/>`;
    return s + '</svg>';
  }
  const bars = (x, y) => { const L = lcm(x.d, y.d); return `<div class="fbars"><div><span class="fbl">${html(x, 'improper')}</span>${bar(x.n, x.d, L, 'var(--coral)')}</div><div><span class="fbl">${html(y, 'improper')}</span>${bar(y.n, y.d, L, 'var(--teal)')}</div></div>`; };

  /* Lessons 2 and 3 with models: a quiz with pictures */
  function modelQ() {
    let x, y, op = Math.random() < 0.55 ? '+' : '-';
    for (;;) { [x, y] = unlikePair(12); if (op === '-' && cmp(x, y) < 0) [x, y] = [y, x]; if (cmp(x, y) !== 0) break; }
    const r = op === '+' ? add(x, y) : sub(x, y), L = lcm(x.d, y.d);
    const qq = build(['Use the models. What is ', { v: x, mode: 'improper' }, { op }, { v: y, mode: 'improper' }, '?']);
    const good = txt(r), rl = r.n * (L / r.d), cand = [];            // rl: the answer counted in L-ths
    cand.push(raw(op === '+' ? x.n + y.n : Math.abs(x.n - y.n), op === '+' ? x.d + y.d : Math.max(x.d, y.d)));   // the common mistake: add the tops and the bottoms
    [1, -1, 2, -2].forEach(k => cand.push(raw(rl + k, L)));
    cand.push(raw(x.n + y.n, L)); cand.push(raw(Math.abs(x.n - y.n), Math.min(x.d, y.d)));
    const w3 = [], okc = c => c.n > 0 && c.d > 0 && c.n * r.d !== r.n * c.d && !w3.includes(txt(F(c.n, c.d), 'mixed'));
    shuffle(cand).forEach(c => { if (w3.length < 3 && okc(c)) w3.push(c.d === x.d + y.d ? txt(c, 'improper') : txt(F(c.n, c.d))); });   // the add-tops-and-bottoms mistake stays as written, like 4/16
    for (let i = 3; w3.length < 3; i++) { const c = raw(rl + i, L); if (okc(c)) w3.push(txt(F(c.n, c.d))); }
    return { q: qq.t, qh: qq.h, say: qq.s, html: bars(x, y), a: good, wrong: w3, chk: `${x.n}/${x.d}${op}${y.n}/${y.d}`,
      why: whyTwo(op, x, y, false), hint: 'The dashed lines cut both bars into pieces of the same size.' };
  }

  /* Lesson 4: improper fractions and mixed numbers */
  function improperQ() {
    const k = rnd(0, 3), d = pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 12]);
    if (k === 0) {                                    // improper -> mixed (in lowest terms already)
      let v; do v = raw(rnd(d + 1, d * 5), d); while (v.n % d === 0 || gcd(v.n % d, d) > 1);
      return { q: `Write ${html(v, 'improper')} as a mixed number.`, say: `Write ${say(v, 'improper')} as a mixed number.`, ...ans(F(v.n, v.d), 'mixed'), chk: `${v.n}/${v.d}`, hint: `How many whole groups of ${d} are in ${v.n}? Whatever is left over is the fraction.`,
        why: `${v.n} ÷ ${d} = ${Math.floor(v.n / d)} with ${v.n % d} left over, so ${v.n}/${d} = ${txt(v)}.` };
    }
    if (k === 1) {                                    // mixed -> improper
      const w = rnd(1, 6), f = proper(d), v = F(w * d + f.n, d);
      return { q: `Write ${html(v, 'mixed')} as an improper fraction.`, say: `Write ${say(v, 'mixed')} as an improper fraction.`, ...ans(v, 'improper'), chk: `${v.n}/${v.d}`, hint: 'Multiply the whole number by the denominator, then add the numerator.',
        why: `${w} × ${d} = ${w * d}, and ${w * d} + ${f.n} = ${w * d + f.n}. So ${w} ${f.n}/${d} = ${w * d + f.n}/${d}.` };
    }
    /* reducible improper fraction to a reduced mixed number */
    let m, n, w, r; for (;;) { m = pick([2, 3, 4, 5]); const base = proper(pick([3, 4, 5, 6, 7])); n = base.n * m; const dd = base.d * m; if (dd > 24) continue; w = rnd(1, 4); r = raw(w * dd + n, dd); if (gcd(n, dd) > 1 && n < dd) break; }
    const v = F(r.n, r.d), g = gcd(n, r.d);
    return { q: `Write ${html(r, 'improper')} as a mixed number in simplest form.`, say: `Write ${say(r, 'improper')} as a mixed number in simplest form.`, ...ans(v, 'mixed'), chk: `${r.n}/${r.d}`, hint: 'Find the whole number first, then reduce the fraction that is left.',
      why: `${r.n} ÷ ${r.d} = ${w} with ${n} left over, so ${r.n}/${r.d} = ${w} ${n}/${r.d}. Divide the top and bottom of ${n}/${r.d} by ${g}: ${n / g}/${r.d / g}. The answer is ${txt(v)}.` };
  }

  /* Lessons 2, 3 and 4 (practice): add and subtract fractions with unlike denominators */
  function unlikeQ() {
    if (Math.random() < 0.28) {                       // three fractions, added
      let a, b, c, v; do { const [d1, d2] = denPair(12); a = proper(d1); b = proper(d2); c = proper(pick([d1, d2])); v = add(add(a, b), c); } while (v.n > v.d * 3);
      const L = lcm(lcm(a.d, b.d), c.d), tops = [a, b, c].map(f => f.n * (L / f.d)), S = tops.reduce((s, t) => s + t, 0);
      const qq = build([{ v: a, mode: 'improper' }, { op: '+' }, { v: b, mode: 'improper' }, { op: '+' }, { v: c, mode: 'improper' }, ' = ?']);
      const conv = convList([a, b, c], L);
      return { q: qq.h + ' <span class="hint-i">Write it in simplest form.</span>', say: qq.s, ...ans(v), chk: `${a.n}/${a.d}+${b.n}/${b.d}+${c.n}/${c.d}`, hint: 'Find one common denominator for all the fractions.',
        why: `${cdText([a.d, b.d, c.d])}${conv ? ' ' + conv + '.' : ''} ${tops.map(t => t + '/' + L).join(' + ')} = ${S}/${L}.` + finish(S, L).text };
    }
    const op = Math.random() < 0.5 ? '+' : '-'; let x, y;
    for (;;) { [x, y] = unlikePair(24); if (op === '-' && cmp(x, y) < 0) [x, y] = [y, x]; if (cmp(x, y) !== 0) break; }
    const v = op === '+' ? add(x, y) : sub(x, y);
    const qq = build([{ v: x, mode: 'improper' }, { op }, { v: y, mode: 'improper' }, ' = ?']);
    return { q: qq.h + ' <span class="hint-i">Write it in simplest form.</span>', say: qq.s, ...ans(v), chk: `${x.n}/${x.d}${op}${y.n}/${y.d}`, hint: 'Find a common denominator: a number that both denominators go into.', why: whyTwo(op, x, y, false) };
  }

  /* Lessons 5 and 6: add mixed numbers */
  function mixedAddQ() {
    const r = Math.random();
    if (r < 0.28) {                                    // three numbers, added in any order
      const [d1, d2] = denPair(12); const x = mixedNum(d1, 4), y = mixedNum(d2, 4), z = mixedNum(pick([d1, d2]), 4);
      const v = add(add(x, y), z), qq = build([{ v: x }, { op: '+' }, { v: y }, { op: '+' }, { v: z }, ' = ?']);
      return { q: qq.h + ' <span class="hint-i">Write it in simplest form.</span>', say: qq.s, ...ans(v), chk: `${x.n}/${x.d}+${y.n}/${y.d}+${z.n}/${z.d}`, hint: 'You can add in any order. Add the whole numbers, then the fractions. Look for fractions that make a whole.', why: whyThree(x, y, z) };
    }
    if (r < 0.43) {                                    // a mixed number and a plain fraction or a whole number
      const [d1, d2] = denPair(24), x = mixedNum(d1, 6), whole = Math.random() < 0.3, y = whole ? F(rnd(1, 5), 1) : proper(d2);
      const [p, q2] = Math.random() < 0.5 ? [x, y] : [y, x], v = add(x, y), qq = build([{ v: p }, { op: '+' }, { v: q2 }, ' = ?']);
      return { q: qq.h + ' <span class="hint-i">Write it in simplest form.</span>', say: qq.s, ...ans(v), chk: `${p.n}/${p.d}+${q2.n}/${q2.d}`, hint: 'Add the whole numbers and the fractions separately. If the fractions make 1 or more, regroup.',
        why: whyTwo('+', p, q2, true) };
    }
    let x, y; do { const [d1, d2] = denPair(24); x = mixedNum(d1, 5); y = mixedNum(d2, 5); } while (parts(x).n === 0 || parts(y).n === 0);
    const v = add(x, y), qq = build([{ v: x }, { op: '+' }, { v: y }, ' = ?']);
    return { q: qq.h + ' <span class="hint-i">Write it in simplest form.</span>', say: qq.s, ...ans(v), chk: `${x.n}/${x.d}+${y.n}/${y.d}`, hint: 'Add the whole numbers and the fractions separately. If the fractions make 1 or more, regroup.', why: whyTwo('+', x, y, true) };
  }

  /* Lessons 7 and 8: subtract mixed numbers, without and then with renaming. rename: true = always renames, false = never, undefined = either */
  function mixedSubQ(rename) {
    for (let tries = 0; tries < 800; tries++) {
      const t = Math.random(), [d1, d2] = denPair(24);
      let x, y, needs;
      if (t < 0.2 && rename !== false) { x = F(rnd(2, 9), 1); y = Math.random() < 0.5 ? proper(d2) : mixedNum(d2, Math.max(1, x.n - 2)); }   // a whole number minus a fraction or mixed number
      else if (t < 0.38) { x = mixedNum(d1, 6); y = proper(d2); }                                                                           // a mixed number minus a fraction
      else { x = mixedNum(d1, 6); y = mixedNum(d2, 5); }
      if (cmp(x, y) <= 0) continue;
      const px = parts(x), py = parts(y), L = lcm(px.d, py.d), a = px.n * (L / px.d), b = py.n * (L / py.d);
      needs = a < b;                                   // the first fraction is too small, so rename (a whole number has a fraction part of 0)
      if (rename === true && !needs) continue; if (rename === false && needs) continue;
      if (x.d !== 1 && px.n === 0) continue;
      const v = sub(x, y); if (v.n === 0) continue;
      const qq = build([{ v: x }, { op: '-' }, { v: y }, ' = ?']);
      return { q: qq.h + ' <span class="hint-i">Write it in simplest form.</span>', say: qq.s, ...ans(v), chk: `${x.n}/${x.d}-${y.n}/${y.d}`, hint: 'Make the denominators match. Then check: is the first fraction big enough to subtract from?', why: whyTwo('-', x, y, true) };
    }
  }

  /* Lesson 4 and 9 word problems */
  const WHO = ['Mia', 'Leo', 'Priya', 'Sam', 'Zoe', 'Omar', 'Nina', 'Ben', 'Lucia', 'Theo'];
  const HINT = 'Is something being put together, or taken away? A bar model can help.';
  function wordsQ() {
    const kind = rnd(0, 5), who = shuffle(WHO), mixedForms = Math.random() < 0.6;
    const mk = (maxW = 4) => { const [d1, d2] = denPair(24); return [mixedForms ? mixedNum(d1, maxW) : proper(d1), mixedForms ? mixedNum(d2, maxW) : proper(d2)]; };
    let x, y; const out = (pieces, v, why, chk) => { const qq = build(pieces); return { q: qq.h + ' <span class="hint-i">Write it in simplest form.</span>', say: qq.s, ...ans(v), why, hint: HINT, chk }; };
    const U = (v, one, many) => ' ' + unit(v, one, many);
    if (kind === 0) {                                  // total distance
      [x, y] = mk(); const v = add(x, y);
      return out([`${who[0]} walked `, { v: x }, U(x, 'mile', 'miles') + ` on Saturday and `, { v: y }, U(y, 'mile', 'miles') + ` on Sunday. How many miles did ${who[0]} walk in all?`], v, whyTwo('+', x, y, mixedForms), `${x.n}/${x.d}+${y.n}/${y.d}`);
    }
    if (kind === 1) {                                  // ribbon left over
      do { [x, y] = mk(); if (cmp(x, y) < 0) [x, y] = [y, x]; } while (eq(x, y));
      const v = sub(x, y);
      return out([`${who[1]} had a ribbon `, { v: x }, U(x, ' yard', ' yards').trim() ? U(x, 'yard', 'yards') + ` long. ${who[1]} cut off ` : '', { v: y }, U(y, 'yard', 'yards') + ` for a gift. How many yards of ribbon are left?`], v, whyTwo('-', x, y, mixedForms), `${x.n}/${x.d}-${y.n}/${y.d}`);
    }
    if (kind === 2) {                                  // trail mix
      const [d1, d2] = denPair(24); x = mixedForms ? mixedNum(d1, 2) : proper(d1); y = mixedForms ? mixedNum(d2, 2) : proper(d2); const v = add(x, y);
      return out([`A trail mix uses `, { v: x }, U(x, 'cup', 'cups') + ` of nuts and `, { v: y }, U(y, 'cup', 'cups') + ` of raisins. How many cups of trail mix does it make?`], v, whyTwo('+', x, y, mixedForms), `${x.n}/${x.d}+${y.n}/${y.d}`);
    }
    if (kind === 3) {                                  // how much taller
      do { [x, y] = mk(); if (cmp(x, y) < 0) [x, y] = [y, x]; } while (eq(x, y));
      const v = sub(x, y);
      return out([`${who[2]}'s bean plant is `, { v: x }, U(x, 'foot', 'feet') + ` tall. ${who[3]}'s plant is `, { v: y }, U(y, 'foot', 'feet') + ` tall. How many feet taller is ${who[2]}'s plant?`], v, whyTwo('-', x, y, mixedForms), `${x.n}/${x.d}-${y.n}/${y.d}`);
    }
    if (kind === 4) {                                  // two steps: add two, then take away a third
      const [d1, d2] = denPair(12); const a = mixedNum(d1, 3), b = mixedNum(d2, 3), s = add(a, b); let c = mixedNum(pick([d1, d2]), 2); if (cmp(s, c) <= 0) c = F(1, 2);
      const v = sub(s, c);
      return out([`${who[4]} bought `, { v: a }, U(a, 'pound', 'pounds') + ` of apples and `, { v: b }, U(b, 'pound', 'pounds') + ` of pears. ${who[4]} gave `, { v: c }, U(c, 'pound', 'pounds') + ` away. How many pounds does ${who[4]} have left?`], v,
        `Step 1, how many pounds in all: ${whyTwo('+', a, b, true)} Step 2, take some away: ${txt(s)} − ${txt(c)}. ${whyTwo('-', s, c, true)}`, `${a.n}/${a.d}+${b.n}/${b.d}-${c.n}/${c.d}`);
    }
    do { [x, y] = mk(); } while (eq(x, y));            // how many more hours
    const big = cmp(x, y) > 0 ? x : y, small = big === x ? y : x, v = sub(big, small);
    return out([`${who[5]} swam `, { v: big }, U(big, 'hour', 'hours') + ` this week and ${who[6]} swam `, { v: small }, U(small, 'hour', 'hours') + `. How many more hours did ${who[5]} swim?`], v, whyTwo('-', big, small, mixedForms), `${big.n}/${big.d}-${small.n}/${small.d}`);
  }

  /* the toughest: missing numbers, three-term mixes, whole numbers minus mixed numbers, bigger mixed numbers */
  function reviewQ() {
    const k = rnd(0, 4);
    if (k === 0) {                                     // a + ? = total
      let a, t; do { const [d1, d2] = denPair(24); a = mixedNum(d1, 3); t = add(a, mixedNum(d2, 3)); } while (cmp(t, a) <= 0);
      const v = sub(t, a), qq = build([{ v: a }, { op: '+' }, ' ? = ', { v: t }]);
      return { q: qq.h.replace(' ? =', ' <b>?</b> =') + ' <span class="hint-i">What is the missing number? Simplest form.</span>', say: qq.s.replace(/plus\s+\?\s*=\s*/, 'plus what equals '), ...ans(v), chk: `${t.n}/${t.d}-${a.n}/${a.d}`, hint: 'To find a missing addend, subtract the part you know from the total.',
        why: `The missing number is the total minus the part you know: ${txt(t)} − ${txt(a)}. ` + whyTwo('-', t, a, true) };
    }
    if (k === 1) {                                     // ? - y = r
      const [d1, d2] = denPair(24), r = mixedNum(d1, 3), y = mixedNum(d2, 3), x = add(r, y), qq = build(['? ', { op: '-' }, { v: y }, ' = ', { v: r }]);
      return { q: qq.h.replace(/^\? /, '<b>?</b> ') + ' <span class="hint-i">What is the missing number? Simplest form.</span>', say: qq.s.replace(/^\?\s+minus/, 'what minus'), ...ans(x), chk: `${r.n}/${r.d}+${y.n}/${y.d}`, hint: 'To find a missing starting number, add the part taken away to what is left.',
        why: `Undo the subtraction by adding: ${txt(r)} + ${txt(y)}. ` + whyTwo('+', r, y, true) };
    }
    if (k === 2) {                                     // three terms: a + b - c, left to right
      let a, b, c, v, s; for (;;) { const [d1, d2] = denPair(12); a = proper(d1); b = proper(d2); c = proper(pick([d1, d2])); s = add(a, b); v = sub(s, c); if (v.n > 0 && !eq(c, a) && !eq(c, b)) break; }
      const qq = build([{ v: a, mode: 'improper' }, { op: '+' }, { v: b, mode: 'improper' }, { op: '-' }, { v: c, mode: 'improper' }, ' = ?']);
      return { q: qq.h + ' <span class="hint-i">Simplest form.</span>', say: qq.s, ...ans(v), chk: `${a.n}/${a.d}+${b.n}/${b.d}-${c.n}/${c.d}`, hint: 'Work from left to right: add first, then subtract.',
        why: `Work from left to right. First: ${whyTwo('+', a, b, false)} Then subtract ${txt(c, 'improper')}` + (s.n > s.d ? `. ${txt(s)} = ${txt(s, 'improper')}` : '') + `: ${whyTwo('-', s, c, false)}` };
    }
    if (k === 3) return mixedSubQ(true);                // renaming, including whole numbers minus fractions
    const [d1, d2] = denPair(24); const x = mixedNum(d1, 9), y = mixedNum(d2, 9);   // a pair of mixed numbers with bigger whole parts
    if (Math.random() < 0.5 || cmp(x, y) === 0) { const v = add(x, y), qq = build([{ v: x }, { op: '+' }, { v: y }, ' = ?']); return { q: qq.h + ' <span class="hint-i">Simplest form.</span>', say: qq.s, ...ans(v), chk: `${x.n}/${x.d}+${y.n}/${y.d}`, hint: 'Add the whole numbers, add the fractions, then regroup if needed.', why: whyTwo('+', x, y, true) }; }
    const [bg, sm] = cmp(x, y) > 0 ? [x, y] : [y, x], v = sub(bg, sm), qq = build([{ v: bg }, { op: '-' }, { v: sm }, ' = ?']);
    return { q: qq.h + ' <span class="hint-i">Simplest form.</span>', say: qq.s, ...ans(v), chk: `${bg.n}/${bg.d}-${sm.n}/${sm.d}`, hint: 'Make the denominators match. Then check: is the first fraction big enough to subtract from?', why: whyTwo('-', bg, sm, true) };
  }

  const FRACGEN = { F, raw, add, sub, cmp, gcd, lcm, parts, txt, html, say, whyTwo, bar, bars, divisionQ, modelQ, improperQ, unlikeQ, mixedAddQ, mixedSubQ, wordsQ, reviewQ };
  if (typeof module !== 'undefined') module.exports = FRACGEN; else root.FRACGEN = FRACGEN;
})(typeof window !== 'undefined' ? window : globalThis);
