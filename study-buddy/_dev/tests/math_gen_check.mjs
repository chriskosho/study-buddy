/* Checks the Place Value and Zeros generators: makes thousands of problems and re-solves each one from its
   question text with exact BigInt math. Run: node study-buddy/_dev/tests/math_gen_check.mjs */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
/* Seeded random numbers, so a failure can be repeated exactly:  SEED=12345 node study-buddy/_dev/tests/math_gen_check.mjs */
const SEED = Number(process.env.SEED) || (Date.now() % 1e9);
Math.random = (a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(SEED);
const G = require('../../modules/math/place-value/gen.js');
const N = 20000; let fails = 0;
const bad = (t, q, m) => { if (fails++ < 15) console.log('FAIL', t, '|', q.q, '|', m, '| a =', q.a, q.wrong || ''); };
const unc = s => s.replace(/,/g, '');
// exact decimal: value * 10^12 as BigInt
const big = s => { s = unc(String(s)); const neg = s.startsWith('-'); if (neg) s = s.slice(1); const [w, d = ''] = s.split('.'); return (neg ? -1n : 1n) * BigInt(w + d.padEnd(12, '0').slice(0, 12)); };
const mcOk = (t, q) => {
  const need = /^Which is greater/.test(q.q) ? 2 : 3;   // comparisons offer A, B, or equal
  if (!q.a || q.wrong.length < need) return bad(t, q, `needs an answer and ${need} wrong options`);
  if (q.wrong.includes(q.a)) return bad(t, q, 'answer is also a wrong option');
  if (new Set(q.wrong).size !== q.wrong.length) return bad(t, q, 'duplicate wrong options');
};
for (let i = 0; i < N; i++) {
  const q = G.placeValueQ(); mcOk('place', q);
  let m;
  if ((m = q.q.match(/^What is the value of the (\d) in ([\d,.]+)\?$/))) {
    const [d, num] = [m[1], unc(m[2])], [w, dec = ''] = num.split('.'); const idx = (w + dec).indexOf(d);
    const exp = idx < w.length ? w.length - 1 - idx : -(idx - w.length + 1);
    const want = exp >= 0 ? BigInt(d) * 10n ** BigInt(exp) * 10n ** 12n : BigInt(d) * 10n ** BigInt(12 + exp);
    if (big(q.a) !== want) bad('place-value', q, 'wrong value');
    if ((w + dec).split(d).length !== 2) bad('place-value', q, 'digit appears more than once');
  } else if ((m = q.q.match(/^In ([\d,.]+), which place is the (\d) in\?$/))) {
    const num = unc(m[1]), d = m[2], [w, dec = ''] = num.split('.'), idx = (w + dec).indexOf(d);
    const exp = idx < w.length ? w.length - 1 - idx : -(idx - w.length + 1);
    if (G.PLACES.find(p => p.exp === exp).name !== q.a) bad('place-name', q, 'wrong place');
  } else if ((m = q.q.match(/^Which digit is in the (.+) place in ([\d,.]+)\?$/))) {
    const exp = G.PLACES.find(p => p.name === m[1]).exp, num = unc(m[2]), [w, dec = ''] = num.split('.');
    const got = exp >= 0 ? w[w.length - 1 - exp] : dec[-exp - 1];
    if (got !== q.a) bad('place-digit', q, 'wrong digit');
  } else if ((m = q.q.match(/^Which number is (.+)\?$/))) {
    let total = 0n; for (const part of m[1].split(', ')) { const [d, ...name] = part.split(' '); total += BigInt(d) * 10n ** BigInt(G.PLACES.find(p => p.name === name.join(' ') || p.name === name.join(' ') + 's').exp); }
    if (BigInt(unc(q.a)) !== total) bad('place-build', q, 'wrong number');
  } else bad('place', q, 'unknown question');
}
for (let i = 0; i < N; i++) {
  const q = G.decimalQ(); mcOk('decimal', q); let m;
  if ((m = q.q.match(/^Which is greater: ([\d.]+) or ([\d.]+)\?$/))) {
    const A = big(m[1]), B = big(m[2]), want = A > B ? m[1] : B > A ? m[2] : 'They are equal';
    if (q.a !== want) bad('compare', q, 'wrong comparison');
  } else if ((m = q.q.match(/^Round ([\d.]+) to the nearest (tenth|hundredth)\.$/))) {
    const p = m[2] === 'tenth' ? 1 : 2, v = big(m[1]), unit = 10n ** BigInt(12 - p), r = (v + unit / 2n) / unit * unit;
    if (big(q.a) !== r) bad('round', q, 'wrong rounding');
    if (q.a.split('.')[1].length !== p) bad('round', q, 'wrong number of places');
    if (q.wrong.some(w => big(w) === r)) bad('round', q, 'a wrong option equals the answer');
  } else if ((m = q.q.match(/^How many decimal places does ([\d.]+) have\?$/))) {
    if (String(m[1].split('.')[1].length) !== q.a) bad('count', q, 'wrong count');
  } else if ((m = q.q.match(/^Which decimal is (\d) tenths?, (\d) hundredths?(?:, and (\d) thousandths?)?\?$/))) {
    const want = BigInt(m[1]) * 10n ** 11n + BigInt(m[2]) * 10n ** 10n + (m[3] ? BigInt(m[3]) * 10n ** 9n : 0n);
    if (big(q.a) !== want) bad('build-dec', q, 'wrong decimal');
    if (q.wrong.some(w => big(w) === want)) bad('build-dec', q, 'a wrong option equals the answer');
  } else if ((m = q.q.match(/^Which number is the same as ([\d.]+)\?$/))) {
    if (big(q.a) !== big(m[1])) bad('same', q, 'not equal'); if (q.wrong.some(w => big(w) === big(m[1]))) bad('same', q, 'wrong option equal');
  } else bad('decimal', q, 'unknown question');
}
const arith = (name, fn, op) => { for (let i = 0; i < N; i++) {
  const q = fn(); const m = q.q.match(/^([\d,.]+) ([×÷]) ([\d,.]+) = \?$/); if (!m) { bad(name, q, 'unknown'); continue; }
  const a = big(m[1]), b = big(m[3]), S = 10n ** 12n;
  let want; if (m[2] === '×') want = a * b / S; else { if ((a * S) % b !== 0n) { bad(name, q, 'not exact'); continue; } want = a * S / b; }
  if (big(q.a) !== want) bad(name, q, 'wrong answer');
  if (q.show && big(q.show) !== want) bad(name, q, 'shown answer differs');
  if (!q.why.includes(G.fmtStr(String(q.show ? unc(q.show) : q.a)))) bad(name, q, 'explanation does not state the answer');
  if (name === 'divide' && !Number.isInteger(q.a)) bad(name, q, 'not a whole number');
}};
arith('multiply', () => G.multiplyQ(false)); arith('multiply-hard', () => G.multiplyQ(true)); arith('divide', G.divideQ); arith('powers', G.powersQ);

/* ---------- Add and Subtract Fractions (fractions-add-sub/gen.js): solved again with separate exact arithmetic ---------- */
const FG = require('../../modules/math/fractions-add-sub/gen.js');
const gcdn = (a, b) => b ? gcdn(b, a % b) : a;
const fr = (n, d) => { if (d === 0) throw new Error('zero denominator'); const g = gcdn(Math.abs(n), d) || 1; return [n / g, d / g]; };
const fadd = (x, y) => fr(x[0] * y[1] + y[0] * x[1], x[1] * y[1]), fsub = (x, y) => fr(x[0] * y[1] - y[0] * x[1], x[1] * y[1]);
const key = x => x[0] + '/' + x[1];
const parseAns = t => { let m; if ((m = t.match(/^(\d+) (\d+)\/(\d+)$/))) return { v: fr(+m[1] * +m[3] + +m[2], +m[3]), mixed: true, fn: +m[2], fd: +m[3] }; if ((m = t.match(/^(\d+)\/(\d+)$/))) return { v: fr(+m[1], +m[2]), mixed: false, n: +m[1], d: +m[2] }; if ((m = t.match(/^(\d+)$/))) return { v: [+m[1], 1], mixed: false, whole: true }; return null; };
/* the numbers shown in a question, in order: <span class="frac" data-n data-d>, <span class="mixed" data-w>..frac, <span class="num" data-w> */
const shownNums = h => { const out = []; const re = /<span class="mixed" data-w="(\d+)"><b>\d+<\/b><span class="frac" data-n="(\d+)" data-d="(\d+)">|<span class="frac" data-n="(\d+)" data-d="(\d+)">|<span class="num" data-w="(\d+)">/g; let m;
  while ((m = re.exec(h))) out.push(m[1] ? fadd([+m[1], 1], fr(+m[2], +m[3])) : m[4] ? fr(+m[4], +m[5]) : [+m[6], 1]); return out; };
const chkTerms = c => { const t = []; const re = /([+-]?)(\d+)\/(\d+)/g; let m; while ((m = re.exec(c))) t.push({ s: m[1] === '-' ? -1 : 1, v: fr(+m[2], +m[3]) }); return t; };
const chkValue = c => { const ts = chkTerms(c); let tot = [0, 1]; ts.forEach((t, i) => { tot = (i === 0 || t.s === 1) ? fadd(tot, t.v) : fsub(tot, t.v); }); return tot; };
const fracCheck = (name, fn, n = N) => { for (let i = 0; i < n; i++) {
  const q = fn(); if (!q) { bad(name, { q: '(none)' }, 'no problem'); continue; }
  const QH = q.qh || q.q;   // the question as shown
  const plain = QH.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  if (/undefined|NaN/.test(q.why + plain) || /(^|[^\d])0\/\d| 0 \d+\/\d|\+ 0 =|\u2212 0 =/.test(q.why)) bad(name, q, 'odd text in the explanation: ' + q.why.slice(0, 120));
  if (/(^| )1 (sandwiches|pizzas|pies|liters of|yards of|loaves)/.test(plain)) bad(name, q, 'singular and plural: ' + plain.slice(0, 100));
  { /* a number followed by a unit: one (or less) takes the singular, more than one takes the plural */
    const tok = QH.replace(/<span class="mixed" data-w="(\d+)"><b>\d+<\/b><span class="frac" data-n="(\d+)" data-d="(\d+)">.*?<\/span><\/span><\/span>|<span class="frac" data-n="(\d+)" data-d="(\d+)">.*?<\/span><\/span>|<span class="num" data-w="(\d+)">\d+<\/span>/g,
      (m0, w, n1, d1, n2, d2, w2) => w ? `<<${+w * +d1 + +n1}/${d1}>>` : n2 ? `<<${n2}/${d2}>>` : `<<${w2}/1>>`);
    for (const m3 of tok.matchAll(/<<(\d+)\/(\d+)>> (mile|miles|yard|yards|cup|cups|foot|feet|pound|pounds|hour|hours)\b/g)) {
      const one = +m3[1] <= +m3[2], sing = /^(mile|yard|cup|foot|pound|hour)$/.test(m3[3]);
      if (one !== sing) bad(name, q, `unit agreement: ${m3[1]}/${m3[2]} ${m3[3]}`);
    }
  }
  { const m2 = q.why.match(/common denominator of (\d+) and (\d+) /); if (m2 && m2[1] === m2[2]) bad(name, q, 'common denominator of the same number'); }
  const a = parseAns(q.a); if (!a) { bad(name, q, 'answer is not written as a fraction, mixed number or whole number'); continue; }
  if (name !== 'models' && !['any', 'mixed', 'improper'].includes(q.form)) bad(name, q, 'no answer form');
  const want = chkValue(q.chk), missingDivisor = name === 'division' && / = \d+ ÷ \?/.test(q.q.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
  if (!missingDivisor && key(a.v) !== key(want)) bad(name, q, `wrong answer, expected ${key(want)}`);
  if (a.mixed ? (a.fn >= a.fd || gcdn(a.fn, a.fd) !== 1) : (!a.whole && gcdn(a.n, a.d) !== 1)) bad(name, q, 'answer is not in simplest form');
  if (q.form === 'mixed' && !a.mixed && !a.whole) bad(name, q, 'wanted a mixed number'); if (q.form === 'improper' && a.mixed) bad(name, q, 'wanted an improper fraction');
  if (!q.why || !q.why.includes(q.a.includes(' ') ? q.a : q.a) && !q.why.includes(q.a.replace(/ /g, ' '))) bad(name, q, 'explanation does not state the answer');
  if (name !== 'division') {                        // the numbers in the question are the numbers in the check, and the operators match
    const shown = shownNums(QH).map(key).sort().join(','), used = chkTerms(q.chk).map(t => key(t.v)).sort().join(',');
    const ops = (q.q.replace(/<[^>]+>/g, ' ').match(/[+−]/g) || []).join(''), cops = (q.chk.replace(/^-/, '').match(/[+-]/g) || []).join('').replace(/-/g, '−');   // operators between terms (a leading minus sign is not one)
    if (!/^Use the models/.test(q.q) && shown !== used && !/\?/.test(q.q.replace(/<[^>]+>/g, ''))) bad(name, q, `numbers shown (${shown}) differ from numbers solved (${used})`);   // (this check used to be dead: /^(x|)/ always matches)
    const plainQ = q.q.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '), missingNum = /\?\s*[−+=]|[−+]\s*\?/.test(plainQ);   // ? − 3 = 2 is solved with the other operation
    if (name !== 'words' && name !== 'models' && !missingNum && ops && cops && ops !== cops) bad(name, q, `operators shown (${ops}) differ from the check (${cops})`);
    if (/\?/.test(q.q.replace(/<[^>]+>/g, '')) && name !== 'review' && name !== 'models' && name !== 'words' && shown !== used) bad(name, q, `numbers shown (${shown}) differ from numbers solved (${used})`);
    if (name === 'words' && shown !== used) bad(name, q, `numbers shown (${shown}) differ from numbers solved (${used})`);
  }
  if (name === 'division') {                         // a ÷ b, a fraction as a division, or a sharing story
    const t = q.q.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '); let m;
    if ((m = t.match(/^(\d+) ÷ (\d+) (is the same|\.|Write)/)) || (m = t.match(/^Write (\d+) ÷ (\d+) as/))) { if (key(fr(+m[1], +m[2])) !== key(want)) bad(name, q, 'division answer'); if (m[1] === m[2]) bad(name, q, 'a number divided by itself'); }
    else if ((m = shownNums(q.q)).length === 1 && /= (\d+) ÷ \?/.test(t)) { const k = +t.match(/= (\d+) ÷ \?/)[1]; if (key(fr(k, +q.a)) !== key(m[0])) bad(name, q, 'missing divisor'); }
    else if ((m = t.match(/^(\d+) .* shared equally among (\d+) /))) { if (key(fr(+m[1], +m[2])) !== key(want)) bad(name, q, 'sharing answer'); }
    else bad(name, q, 'unknown division question');
  }
  if (name === 'models') {
    const xs = shownNums(QH), op = QH.includes(' − ') ? '-' : '+', w = op === '+' ? fadd(xs[0], xs[1]) : fsub(xs[0], xs[1]);
    if (key(w) !== key(parseAns(q.a).v)) bad(name, q, 'model answer differs from the question');
    if (xs[0][1] === xs[1][1]) bad(name, q, 'same denominators'); if (op === '-' && xs[0][0] * xs[1][1] <= xs[1][0] * xs[0][1]) bad(name, q, 'subtraction goes negative');
    if (!q.wrong || q.wrong.length !== 3 || new Set([q.a, ...q.wrong].map(x => { const p = parseAns(x); return p ? key(p.v) : x; })).size !== 4) bad(name, q, 'needs 3 wrong options with different values');
    q.wrong.forEach(w2 => { const p = parseAns(w2); if (!p || key(p.v) === key(parseAns(q.a).v)) bad(name, q, 'a wrong option is right or unreadable: ' + w2); });
    if (!q.html || !q.html.includes('fbar')) bad(name, q, 'no bars'); if (/</.test(q.q)) bad(name, q, 'plain question has markup');
  }
  if (name === 'mixedsub-rename' ) { const p = shownNums(q.q); }
}};
fracCheck('division', FG.divisionQ); fracCheck('models', FG.modelQ); fracCheck('improper', FG.improperQ); fracCheck('unlike', FG.unlikeQ);
fracCheck('mixedadd', FG.mixedAddQ); fracCheck('mixedsub', () => FG.mixedSubQ(Math.random() < 0.5)); fracCheck('words', FG.wordsQ); fracCheck('review', FG.reviewQ);
/* mixedSubQ(true) always needs renaming and mixedSubQ(false) never does */
const needsRename = q => { const [x, y] = shownNums(q.q); const px = [x[0] % x[1], x[1]], py = [y[0] % y[1], y[1]]; return px[0] * py[1] < py[0] * px[1]; };
for (let i = 0; i < 4000; i++) { const t = FG.mixedSubQ(true), f = FG.mixedSubQ(false); if (!needsRename(t)) bad('mixedsub', t, 'should need renaming'); if (needsRename(f)) bad('mixedsub', f, 'should not need renaming'); }

/* ---------- Multiplication of Fractions (fractions-multiply/gen.js): solved again; "chk" is a product of fractions ---------- */
const MG = require('../../modules/math/fractions-multiply/gen.js');
const fmul = (x, y) => fr(x[0] * y[0], x[1] * y[1]);
const chkProd = c => c.split('*').map(t => { const m = t.match(/^(\d+)\/(\d+)$/); if (!m) throw new Error('bad chk ' + c); return fr(+m[1], +m[2]); }).reduce(fmul, [1, 1]);
const mulCheck = (name, fn, o = {}) => { for (let i = 0; i < N; i++) {
  const q = fn(); if (!q) { bad(name, { q: '(none)' }, 'no problem'); continue; }
  const QH = q.qh || q.q, plain = QH.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  if (/undefined|NaN|Infinity/.test(q.why + plain) || /(^|[^\d])0\/\d| 0 \d+\/\d/.test(q.why)) bad(name, q, 'odd text: ' + q.why.slice(0, 120));
  if (!q.why || !q.hint) bad(name, q, 'missing explanation or hint');
  const a = parseAns(q.a); if (!a) { bad(name, q, 'unreadable answer ' + q.a); continue; }
  if (a.mixed ? (a.fn >= a.fd || gcdn(a.fn, a.fd) !== 1) : (!a.whole && gcdn(a.n, a.d) !== 1)) bad(name, q, 'answer not in simplest form');
  if (!o.noForm && !['any', 'mixed', 'improper'].includes(q.form)) bad(name, q, 'no answer form');
  if (q.form === 'mixed' && !a.mixed && !a.whole) bad(name, q, 'wanted a mixed number'); if (q.form === 'improper' && a.mixed) bad(name, q, 'wanted an improper fraction');
  const want = chkProd(q.chk);
  if (!o.recip && key(a.v) !== key(want)) bad(name, q, `wrong answer, expected ${key(want)}`);
  if (o.recip && key(a.v) !== key(want)) bad(name, q, `reciprocal answer ${q.a} vs ${key(want)}`);
  if (!q.why.includes(q.a) && !(a.whole && q.why.includes(q.a))) bad(name, q, 'explanation does not state the answer ' + q.a);
  if (o.shown) { const shown = shownNums(QH).map(key).sort().join(','), used = q.chk.split('*').map(t => key(chkProd(t))).sort().join(','); if (shown !== used) bad(name, q, `shown (${shown}) differs from solved (${used})`); }
  for (const m3 of QH.matchAll(/(\d+) (yards|yard|cups|cup|miles|mile|pounds|pound|feet|foot)\b/g)) { /* plain integers only */ }
  { const tok = QH.replace(/<span class="mixed" data-w="(\d+)"><b>\d+<\/b><span class="frac" data-n="(\d+)" data-d="(\d+)">.*?<\/span><\/span><\/span>|<span class="frac" data-n="(\d+)" data-d="(\d+)">.*?<\/span><\/span>|<span class="num" data-w="(\d+)">\d+<\/span>/g,
      (m0, w, n1, d1, n2, d2, w2) => w ? `<<${+w * +d1 + +n1}/${d1}>>` : n2 ? `<<${n2}/${d2}>>` : `<<${w2}/1>>`);
    for (const m3 of tok.matchAll(/<<(\d+)\/(\d+)>> (mile|miles|yard|yards|cup|cups|foot|feet|pound|pounds|acre|acres|day|days)\b/g)) {
      const one = +m3[1] <= +m3[2], sing = /^(mile|yard|cup|foot|pound|acre|day)$/.test(m3[3]); if (one !== sing) bad(name, q, `unit agreement: ${m3[1]}/${m3[2]} ${m3[3]}`); } }
  if (name === 'mul-models') {
    const xs = shownNums(QH); if (key(fmul(xs[0], xs[1])) !== key(a.v)) bad(name, q, 'model answer differs');
    if (!q.wrong || q.wrong.length !== 3 || new Set([q.a, ...q.wrong].map(x => { const p = parseAns(x); return p ? key(p.v) : x; })).size !== 4) bad(name, q, 'needs 3 wrong options with different values');
    q.wrong.forEach(w2 => { const p = parseAns(w2); if (!p || key(p.v) === key(a.v)) bad(name, q, 'a wrong option is right or unreadable: ' + w2); });
    if (!q.html || !q.html.includes('farea')) bad(name, q, 'no picture');
  }
}};
mulCheck('mul-whole', MG.wholeMulQ, { shown: true }); mulCheck('mul-fractionof', MG.fractionOfQ, { shown: true }); mulCheck('mul-fraction', MG.fractionMulQ, { shown: true });
mulCheck('mul-models', MG.modelQ, { shown: true, noForm: true }); mulCheck('mul-mixed', MG.mixedMulQ, { shown: true }); mulCheck('mul-recip', MG.reciprocalQ, { recip: true });
mulCheck('mul-words', MG.wordsQ, { shown: true }); mulCheck('mul-review', MG.reviewQ);
for (let i = 0; i < 3000; i++) { const s = MG.scaleSet(), seen = new Set();
  if (s.items.length < 7) bad('mul-scale', s, 'too few items'); ['less', 'equal', 'more'].forEach(b => { if (!s.items.some(x => x.b === b)) bad('mul-scale', s, 'no ' + b); });
  s.items.forEach(it => { const m = it.text.match(/^(\d+) × (?:(\d+) )?(\d+)\/(\d+)$|^(\d+) × (\d+)$/); let v; if (m && m[3]) v = fr((+m[2] || 0) * +m[4] + +m[3], +m[4]); else if (m) v = [+m[6], 1]; else return bad('mul-scale', it, 'unreadable');
    const c = v[0] * 1 < v[1] ? 'less' : v[0] === v[1] ? 'equal' : 'more'; if (c !== it.b) bad('mul-scale', it, 'wrong bucket ' + c); if (seen.has(it.text)) bad('mul-scale', it, 'duplicate'); seen.add(it.text); }); }

/* ---------- Division of Fractions (fractions-divide/gen.js): solved again; chk is "a/b:c/d" meaning a/b divided by c/d ---------- */
const DG = require('../../modules/math/fractions-divide/gen.js');
const chkDiv = c => { const [x, y] = c.split(':').map(t => { const m = t.match(/^(\d+)\/(\d+)$/); if (!m) throw new Error('bad chk ' + c); return fr(+m[1], +m[2]); }); if (y[0] === 0) throw new Error('divide by zero'); return fr(x[0] * y[1], x[1] * y[0]); };
const divCheck = (name, fn, o = {}) => { for (let i = 0; i < N; i++) {
  const q = fn(); if (!q) { bad(name, { q: '(none)' }, 'no problem'); continue; }
  const QH = q.qh || q.q, plain = QH.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  if (/undefined|NaN|Infinity/.test(q.why + plain) || /(^|[^\d])0\/\d| \/1\b|\d+\/1\./.test(q.why)) bad(name, q, 'odd text: ' + q.why.slice(0, 120));
  if (!q.why || !q.hint) bad(name, q, 'missing explanation or hint');
  const a = parseAns(q.a); if (!a) { bad(name, q, 'unreadable answer ' + q.a); continue; }
  if (a.mixed ? (a.fn >= a.fd || gcdn(a.fn, a.fd) !== 1) : (!a.whole && gcdn(a.n, a.d) !== 1)) bad(name, q, 'answer not in simplest form');
  if (!o.noForm && !['any', 'mixed', 'improper'].includes(q.form)) bad(name, q, 'no answer form');
  const miss = /\?/.test(plain.replace(/Use the model.*/, '')) && o.missing && /<b>\?<\/b>/.test(QH);
  if (miss) { const xs = shownNums(QH); if (xs.length !== 2 || key(chkDiv(`${xs[0][0]}/${xs[0][1]}:${a.v[0]}/${a.v[1]}`)) !== key(xs[1])) bad(name, q, 'missing divisor does not give the shown quotient'); }
  else { const want = chkDiv(q.chk); if (key(a.v) !== key(want)) bad(name, q, `wrong answer, expected ${key(want)}`); }
  if (!q.why.includes(q.a)) bad(name, q, 'explanation does not state the answer ' + q.a);
  if (o.shown) { const shown = shownNums(QH).map(key).sort().join(','), used = q.chk.split(':').map(t => key(chkDiv(t + ':1/1'))).sort().join(','); if (shown !== used && !o.missing) bad(name, q, `shown (${shown}) differs from solved (${used})`); }
  if (o.quiz) { if (!q.wrong || q.wrong.length !== 3 || new Set([q.a, ...q.wrong].map(x => { const p = parseAns(x); return p ? key(p.v) : x; })).size !== 4) bad(name, q, 'needs 3 wrong options with different values'); q.wrong.forEach(w2 => { const p = parseAns(w2); if (!p || key(p.v) === key(a.v)) bad(name, q, 'a wrong option is right: ' + w2); }); if (!q.html || !/dbar/.test(q.html)) bad(name, q, 'no picture'); if (/</.test(q.q)) bad(name, q, 'plain question has markup'); }
}};
divCheck('div-share', DG.shareQ, { shown: true, noForm: true, quiz: true }); divCheck('div-fit', DG.modelQ, { shown: true, noForm: true, quiz: true });
divCheck('div-fracwhole', DG.fracByWholeQ, { shown: true }); divCheck('div-wholefrac', DG.wholeByFracQ, { shown: true });
divCheck('div-words', DG.wordsQ, { shown: true }); divCheck('div-review', DG.reviewQ, { missing: true });

/* ---------- Measurement and Area (measurement/gen.js): the area is recomputed from the figure's own measurements ---------- */
const MEA = require('../../modules/math/measurement/gen.js');
const tstr = v => { const w = Math.floor(v[0] / v[1]), r = v[0] - w * v[1]; return r === 0 ? String(w) : w ? `${w} ${r}/${v[1]}` : `${r}/${v[1]}`; };
const meaArea = d => { const m = (...xs) => xs.reduce(fmul, [1, 1]), f = x => fr(x.n, x.d), H = [1, 2];
  switch (d.kind) {
    case 'conv': return d.up ? fr(f(d.from)[0], f(d.from)[1] * d.f) : fmul(f(d.from), [d.f, 1]);
    case 'rect': return m(f(d.a), f(d.b));
    case 'tri': return m(H, f(d.b), f(d.h));
    case 'trap': return m(fadd(f(d.a), f(d.b)), H, f(d.h));
    case 'L': return [d.W * d.H - (d.W - d.a) * (d.H - d.b), 1];
    case 'frame': return [d.W * d.H - d.w * d.h, 1];
    case 'house': return fadd([d.w * d.h, 1], fr(d.w * d.t, 2)); } };
const meaCheck = (name, fn) => { for (let i = 0; i < N; i++) {
  const q = fn(); if (!q || !q.dims) { bad(name, q || { q: '(none)' }, 'no problem or no dims'); continue; }
  const plain = q.q.replace(/<svg.*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  if (/undefined|NaN|Infinity/.test(q.why + plain + q.q) || /(^|[^\d])0\/\d/.test(q.why)) bad(name, q, 'odd text');
  if (!q.hint || !q.why) bad(name, q, 'missing hint or explanation');
  const a = parseAns(q.a); if (!a) { bad(name, q, 'unreadable answer ' + q.a); continue; }
  if (a.mixed ? (a.fn >= a.fd || gcdn(a.fn, a.fd) !== 1) : (!a.whole && gcdn(a.n, a.d) !== 1)) bad(name, q, 'not in simplest form');
  const want = meaArea(q.dims); if (key(a.v) !== key(want)) bad(name, q, `wrong answer, expected ${key(want)}`);
  if (key(chkProd(q.chk)) !== key(want)) bad(name, q, 'chk differs from the area ' + q.chk);
  if (!q.why.includes(q.a)) bad(name, q, 'explanation does not state the answer ' + q.a);
  const svgText = (q.q.match(/<text[^>]*>(.*?)<\/text>/g) || []).map(t => t.replace(/<[^>]+>/g, '')).join('|'), d = q.dims;
  const want2 = d.kind === 'rect' ? [d.a, d.b] : d.kind === 'tri' ? [d.b, d.h] : d.kind === 'trap' ? [d.a, d.b, d.h] : [];
  want2.forEach(v => { if (!svgText.split('|').includes(tstr(fr(v.n, v.d)))) bad(name, q, `figure does not show ${tstr(fr(v.n, v.d))} (shows ${svgText})`); });
  if (d.kind === 'L' && ['W','H','a','b'].some(k => !svgText.split('|').includes(String(d[k])))) bad(name, q, 'L figure labels');
  if (d.kind === 'L' && !(d.a < d.W && d.b < d.H)) bad(name, q, 'L is not an L');
  if (d.kind === 'frame' && !(d.w < d.W - 1 && d.h < d.H - 1)) bad(name, q, 'frame cut-out too big');
  if (d.kind === 'trap' && L0cmp(d)) bad(name, q, 'trapezoid bases not ordered');
  if (/\d+ 1 (inches|feet|yards|pounds|gallons|quarts|pints|cups|minutes|hours|days|weeks|years|months)\b/.test(plain)) bad(name, q, 'unit agreement');
  if (/(^| )1 (inches|feet|yards|pounds|ounces|gallons|quarts|pints|cups|minutes|seconds|hours|days|weeks|years|months) =/.test(plain)) bad(name, q, 'plural with 1: ' + plain.slice(0, 60));
}};
const L0cmp = d => d.a.n * d.b.d >= d.b.n * d.a.d;
meaCheck('mea-units', MEA.customaryQ); meaCheck('mea-time', MEA.timeQ); meaCheck('mea-rect', MEA.rectQ); meaCheck('mea-tri', () => MEA.triQ(Math.random() < 0.5));
meaCheck('mea-trap', () => MEA.trapQ(Math.random() < 0.5)); meaCheck('mea-composite', MEA.compositeQ); meaCheck('mea-review', MEA.reviewQ);

/* ---------- Volume of Solid Figures (volume/gen.js): the answer is recomputed from the figure's own measurements ---------- */
const VG = require('../../modules/math/volume/gen.js');
const volOf = d => { const b = x => x.l * x.w * x.h; switch (d.kind) {
  case 'box': return [b(d), 1]; case 'stacks': return [d.cells.flat().reduce((x, y) => x + y, 0), 1]; case 'missing': return [d.v / (d.known[0] * d.known[1]) === d.missing ? d.missing : -1, 1];
  case 'boxes': return [b(d) * d.c, 1]; case 'cubes': return [d.s ** 3 * d.n, 1]; case 'compare': return [Math.abs(b(d.A) - b(d.B)), 1]; case 'join': return [b(d.A) + b(d.B), 1]; case 'cut': return [b(d.A) - b(d.B), 1];
  case 'capml': return [b(d), 1]; case 'capl': return fr(b(d), 1000); case 'capmissing': return d.L * 1000 === d.l * d.w * d.h ? [d.h, 1] : [-1, 1]; case 'ml2l': return fr(d.mL, 1000); case 'l2ml': return [d.mL, 1]; } return [-1, 1]; };
const volCheck = (name, fn) => { for (let i = 0; i < N; i++) {
  const q = fn(); if (!q || !q.dims) { bad(name, q || { q: '(none)' }, 'no problem or no dims'); continue; }
  const plain = q.q.replace(/<svg.*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  if (/undefined|NaN|Infinity/.test(q.why + plain + q.q)) bad(name, q, 'odd text');
  if (!q.hint || !q.why) bad(name, q, 'missing hint or explanation');
  const a = parseAns(q.a); if (!a) { bad(name, q, 'unreadable answer ' + q.a); continue; }
  if (a.mixed ? (a.fn >= a.fd || gcdn(a.fn, a.fd) !== 1) : (!a.whole && gcdn(a.n, a.d) !== 1)) bad(name, q, 'not in simplest form');
  const want = volOf(q.dims); if (key(a.v) !== key(want)) bad(name, q, `wrong answer, expected ${key(want)}`);
  if (key(chkProd(q.chk)) !== key(want)) bad(name, q, 'chk differs: ' + q.chk);
  if (!q.why.includes(q.a)) bad(name, q, 'explanation does not state the answer ' + q.a);
  const d = q.dims, labels = (q.q.match(/<text[^>]*>(.*?)<\/text>/g) || []).map(t => t.replace(/<[^>]+>/g, '')), figNums = labels.map(t => parseInt(t)).filter(n => !isNaN(n));
  const boxes = { box: [d], join: [d.A, d.B], cut: [d.A, d.B], compare: [d.A, d.B] }[d.kind] || [];
  boxes.forEach(bx => { [bx.l, bx.w, bx.h].forEach(n => { const k = figNums.indexOf(n); if (k < 0 && d.kind !== 'box') bad(name, q, 'figure does not show ' + n); else if (k >= 0) figNums.splice(k, 1); }); });
  const svgs = [...q.q.matchAll(/<svg class="vfig(?: big)?" data-l="(\d+)" data-w="(\d+)" data-h="(\d+)"/g)].map(m => ({ l: +m[1], w: +m[2], h: +m[3] }));
  if (d.kind === 'box' && /data-l/.test(q.q)) { const s0 = svgs[0]; if (!s0 || s0.l !== d.l || s0.w !== d.w || s0.h !== d.h) bad(name, q, 'figure data differs from dims'); }
  if (['join', 'cut', 'compare'].includes(d.kind) && (svgs.length !== 2 || svgs[0].l !== d.A.l || svgs[1].l !== d.B.l || svgs[0].h !== d.A.h || svgs[1].w !== d.B.w)) bad(name, q, 'two-figure data differs');
  if (d.kind === 'cut' && !(d.B.l < d.A.l && d.B.w < d.A.w && d.B.h < d.A.h)) bad(name, q, 'cut-out does not fit');
  if (d.kind === 'stacks') { const m = q.q.match(/data-cells="([^"]*)"/); if (!m || m[1] !== d.cells.map(r => r.join(',')).join(';')) bad(name, q, 'stack figure differs'); }
}};
volCheck('vol-cubes', VG.cubesQ); volCheck('vol-stacks', VG.stacksQ); volCheck('vol-formula', VG.formulaQ); volCheck('vol-words', VG.wordsQ);
volCheck('vol-compare', VG.compareQ); volCheck('vol-compound', VG.compoundQ); volCheck('vol-capacity', VG.capacityQ); volCheck('vol-review', VG.reviewQ);
/* Every typed answer, typed back into the site's own answer checker in the form the question asks for, must be accepted. */
{
  const vm = require('node:vm'), fs = require('node:fs'), path = require('node:path');
  const box = { window: {}, document: { querySelector: () => null }, SB: { esc: s => String(s) }, console };
  box.window.SB = box.SB; vm.createContext(box);
  vm.runInContext(fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), '../../shared/sb-tools.js'), 'utf8'), box);
  const J = box.window.SBT.judge;
  const kinds = [['frac', [FG.divisionQ, FG.improperQ, FG.unlikeQ, FG.mixedAddQ, () => FG.mixedSubQ(Math.random() < 0.5), FG.wordsQ, FG.reviewQ]],
    ['mul', [MG.wholeMulQ, MG.fractionOfQ, MG.mixedMulQ, MG.wordsQ, MG.reviewQ]], ['div', [DG.fracByWholeQ, DG.wholeByFracQ, DG.wordsQ, DG.reviewQ]],
    ['mea', [MEA.customaryQ, MEA.timeQ, MEA.rectQ, MEA.compositeQ, MEA.reviewQ]], ['vol', [VG.cubesQ, VG.stacksQ, VG.formulaQ, VG.wordsQ, VG.compareQ, VG.compoundQ, VG.capacityQ, VG.reviewQ]]];
  for (const [k, fns] of kinds) for (const fn of fns) for (let i = 0; i < 2000; i++) { const q = fn(); if (q.wrong) continue; const r = J({ a: q.a, form: q.form || 'any' }, q.a, 'fraction'); if (r !== 'ok') bad(k + '-judge', q, `the site's checker says "${r}" to its own answer`); }
}
if (fails) console.log(`Repeat this exact run with SEED=${SEED}.`);
console.log(fails ? `${fails} problems failed` : `ALL PASSED (${N} of each kind: place value, decimals, multiply, multiply-hard, divide, powers, the eight fraction problem kinds, the nine multiplication kinds, the six division kinds, the seven measurement kinds, and the eight volume kinds)`);
process.exit(fails ? 1 : 0);
