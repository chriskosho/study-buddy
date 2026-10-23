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
console.log(fails ? `${fails} problems failed` : `ALL PASSED (${N} of each kind: place value, decimals, multiply, multiply-hard, divide, powers)`);
process.exit(fails ? 1 : 0);
