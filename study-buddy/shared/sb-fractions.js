/* Study Buddy fraction library: exact fraction arithmetic and the writing of fractions as plain text, HTML (stacked, with
   data-n / data-d so tests can read the numbers back) and speech. Used by the fraction modules' problem generators
   (the gen.js of each fraction module under modules/math). A fraction is {n, d} (n over d, improper); F() always reduces, raw() keeps what was written.
   Runs in the browser (window.FRACLIB) and in Node for the generator checks. */
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
  /* a question built from pieces: strings, {op}, and {v, mode} numbers. Returns the HTML, the spoken text, and the plain text */
  function build(pieces) {
    let h = '', s = '', t = '';
    pieces.forEach(p => {
      if (typeof p === 'string') { h += p; s += p; t += p; }
      else if (p.op) { h += ' ' + OPH[p.op] + ' '; s += { '+': ' plus ', '-': ' minus ', '*': ' times ', '/': ' divided by ' }[p.op]; t += ' ' + OPH[p.op] + ' '; }
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

  const mul = (x, y) => F(x.n * y.n, x.d * y.d);
  const div = (x, y) => F(x.n * y.d, x.d * y.n);
  const FRACLIB = { rnd, pick, shuffle, gcd, lcm, F, raw, add, sub, mul, div, cmp, eq, NAMES, parts, txt, fracH, html, say, build, unit, DENS, denPair, proper, unlikePair, mixedNum, ans, eqText, cdText, finish, convList };
  if (typeof module !== 'undefined') module.exports = FRACLIB; else root.FRACLIB = FRACLIB;
})(typeof window !== 'undefined' ? window : globalThis);
