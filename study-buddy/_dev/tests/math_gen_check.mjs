/* Checks the Place Value and Zeros generators: makes thousands of problems and re-solves each one from its
   question text with exact BigInt math. Run: node study-buddy/_dev/tests/math_gen_check.mjs */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
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
    const ops = (q.q.replace(/<[^>]+>/g, ' ').match(/[+−]/g) || []).join(''), cops = (q.chk.match(/[+-]/g) || []).filter((c, j) => j > 0 || q.chk[0] === '-').join('').replace(/-/g, '−');
    if (!/^(Use the models|)/.test(q.q) && shown !== used && !/\?/.test(q.q.replace(/<[^>]+>/g, ''))) bad(name, q, `numbers shown (${shown}) differ from numbers solved (${used})`);
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
    if (!q.wrong || q.wrong.length !== 3 || new Set([q.a, ...q.wrong]).size !== 4) bad(name, q, 'needs 3 different wrong options');
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
console.log(fails ? `${fails} problems failed` : `ALL PASSED (${N} of each kind: place value, decimals, multiply, multiply-hard, divide, powers, and the eight fraction problem kinds)`);
process.exit(fails ? 1 : 0);
