/* Checks the Decimal Operations generators: makes thousands of problems and re-solves each one from its question text with exact
   BigInt arithmetic (a different method from the generator). Run: node study-buddy/_dev/tests/gen_check_decimal.mjs */
import { createRequire } from 'node:module';
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm';
const require = createRequire(import.meta.url);
const SEED = Number(process.env.SEED) || (Date.now() % 1e9);
Math.random = (a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(SEED);
const G = require('../../modules/math/decimal-operations/gen.js');
const N = 3000; let fails = 0;
const bad = (t, q, m) => { if (fails++ < 15) console.log('FAIL', t, '|', q.q, '|', m, '| a =', q.show ?? q.a, q.wrong || ''); };
/* exact decimals as fractions of 10^12 (BigInt) */
const S = 10n ** 12n;
const big = s => { s = String(s).replace(/[,$]/g, ''); const [w, d = ''] = s.split('.'); if (d.length > 12) throw new Error('too long'); return BigInt(w + d.padEnd(12, '0')); };
const isDecText = s => /^\d{1,3}(,\d{3})*(\.\d+)?$|^\d+(\.\d+)?$/.test(s);
const eq = (x, y) => x === y;
const mulB = (x, y) => x * y / S, divExact = (x, y) => { if (y === 0n || (x * S) % y) return null; return x * S / y; };
const notWrong = (t, q, ans) => {
  if (!q.wrong || q.wrong.length < 3) return bad(t, q, 'needs 3 wrong options');
  const vals = q.wrong.map(big);
  if (vals.some(v => v === ans)) bad(t, q, 'a wrong option equals the answer');
  if (new Set(vals.map(String)).size !== vals.length) bad(t, q, 'duplicate wrong options');
  if (vals.some(v => v <= 0n)) bad(t, q, 'a wrong option is not positive');
};
const common = (t, q) => {
  if (!q.why || !q.hint || /undefined|NaN|Infinity/.test(q.why + q.q)) bad(t, q, 'missing or odd why/hint');
  if (!q.why.includes(q.show.replace(/\..*/, '')) ) bad(t, q, 'explanation does not mention the answer');
};
const NUM = '(\\d[\\d,]*(?:\\.\\d+)?)';
function binary(name, fn, opChar, solve, extra) {
  for (let i = 0; i < N; i++) {
    const q = fn(); const m = q.q.match(new RegExp(`^${NUM} ${opChar} ${NUM} = \\?$`));
    if (!m) { bad(name, q, 'unexpected question form'); continue; }
    const a = big(m[1]), b = big(m[2]), want = solve(a, b);
    if (want === null || want <= 0n) { bad(name, q, 'not solvable exactly'); continue; }
    if (big(q.show) !== want) bad(name, q, 'wrong answer; expected ' + want);
    if (Math.abs(Number(q.a) - Number(want) / 1e12) > 1e-9) bad(name, q, 'numeric answer differs from the shown answer');
    notWrong(name, q, want); common(name, q);
    if (extra) extra(q, a, b, want);
  }
}
binary('add', G.addQ, '\\+', (a, b) => a + b);
binary('sub', G.subQ, '−', (a, b) => a > b ? a - b : null);
binary('mul-whole', G.mulWholeQ, '×', (a, b) => mulB(a, b), (q, a, b) => { if (!(a % S === 0n || b % S === 0n)) bad('mul-whole', q, 'neither factor is a whole number'); });
binary('mul-dec', G.mulDecQ, '×', (a, b) => mulB(a, b), (q, a, b) => { if (a % S === 0n || b % S === 0n) bad('mul-dec', q, 'a factor is whole'); });
binary('div-whole', G.divWholeQ, '÷', (a, b) => divExact(a, b), (q, a, b) => { if (b % S !== 0n || a % S === 0n) bad('div-whole', q, 'should be decimal ÷ whole'); });
for (const [want, nm] of [[true, 'div-whole-by-dec'], [false, 'div-dec-by-dec']]) {
  for (let i = 0; i < N; i++) {
    const q = G.divDecQ(want), m = q.q.match(new RegExp(`^${NUM} ÷ ${NUM} = \\?$`)); if (!m) { bad(nm, q, 'form'); continue; }
    const a = big(m[1]), b = big(m[2]), r = divExact(a, b);
    if (r === null || big(q.show) !== r) bad(nm, q, 'wrong answer'); else { notWrong(nm, q, r); common(nm, q); }
    if (b % S === 0n) bad(nm, q, 'divisor should be a decimal'); if ((a % S === 0n) !== want) bad(nm, q, 'dividend whole-ness wrong');
    const places = s => (s.split('.')[1] || '').length; if (places(m[1]) > 2 || places(m[2]) > 2) bad(nm, q, 'too many places');
  }
}
/* estimates: re-round with a different method (string based), and the right option is closest to the true value */
const roundStr = s => { s = s.replace(/,/g, ''); const [w, d = '0'] = s.split('.'); return Number(w) + (d[0] >= '5' ? 1 : 0); };
for (let i = 0; i < N; i++) {
  const q = G.estimateQ(), m = q.q.match(new RegExp(`^Which is the best estimate of ${NUM} ([+−×÷]) ${NUM}\\?$`));
  if (!m) { bad('estimate', q, 'form'); continue; }
  const ra = roundStr(m[1]), rb = roundStr(m[3]), est = { '+': ra + rb, '−': ra - rb, '×': ra * rb, '÷': ra / rb }[m[2]];
  if (String(est) !== q.a) bad('estimate', q, 'right option should be ' + est);
  const A = big(m[1]), B = big(m[3]), exact = { '+': A + B, '−': A - B, '×': mulB(A, B), '÷': divExact(A * 1000n, B) === null ? A * S / B : divExact(A, B) ?? A * S / B }[m[2]];
  const d = x => { const v = BigInt(x) * S - exact; return v < 0n ? -v : v; };
  if (q.wrong.some(w => d(w) <= d(q.a))) bad('estimate', q, 'a wrong option is as close as the right one');
  if (new Set([q.a, ...q.wrong]).size !== 4) bad('estimate', q, 'duplicate options');
  if (!/^\d+$/.test(q.a) || q.wrong.some(w => !/^\d+$/.test(w))) bad('estimate', q, 'options are not whole numbers');
}
/* missing numbers */
for (let i = 0; i < N; i++) {
  const q = G.missingQ(), t = q.q; let m, x = null;
  const nb = s => big(s);
  if ((m = t.match(new RegExp(`^\\? \\+ ${NUM} = ${NUM}$`))) || (m = t.match(new RegExp(`^${NUM} \\+ \\? = ${NUM}$`)))) { const [b, s] = [nb(m[1]), nb(m[2])]; x = s - b; if (/^\?/.test(t) === false) x = s - b; }
  else if ((m = t.match(new RegExp(`^\\? − ${NUM} = ${NUM}$`)))) x = nb(m[1]) + nb(m[2]);
  else if ((m = t.match(new RegExp(`^${NUM} − \\? = ${NUM}$`)))) x = nb(m[1]) - nb(m[2]);
  else if ((m = t.match(new RegExp(`^\\? × ${NUM} = ${NUM}$`))) || (m = t.match(new RegExp(`^${NUM} × \\? = ${NUM}$`)))) x = divExact(nb(m[2]), nb(m[1]));
  else if ((m = t.match(new RegExp(`^\\? ÷ ${NUM} = ${NUM}$`)))) x = mulB(nb(m[1]), nb(m[2]));
  else if ((m = t.match(new RegExp(`^${NUM} ÷ \\? = ${NUM}$`)))) x = divExact(nb(m[1]), nb(m[2]));
  else { bad('missing', q, 'form'); continue; }
  if (x === null || x <= 0n || big(q.show) !== x) bad('missing', q, 'wrong missing number; expected ' + x); else { notWrong('missing', q, x); common('missing', q); }
}
/* three steps and bigger decimals: an independent recursive-descent evaluator on exact decimals */
const evalD = text => { const t = text.replace(/,/g, '').match(/\d+(?:\.\d+)?|[+−×÷()]/g); let i = 0;
  const atom = () => { const x = t[i++]; if (x === '(') { const v = expr(); i++; return v; } return big(x); };
  const term = () => { let v = atom(); while (t[i] === '×' || t[i] === '÷') { const o = t[i++], b = atom(); v = o === '×' ? mulB(v, b) : divExact(v, b); if (v === null) throw new Error('inexact'); } return v; };
  const expr = () => { let v = term(); while (t[i] === '+' || t[i] === '−') { const o = t[i++], b = term(); v = o === '+' ? v + b : v - b; if (v <= 0n) throw new Error('low'); } return v; };
  const r = expr(); if (i !== t.length) throw new Error('left over'); return r; };
for (let i = 0; i < N; i++) { const q = G.threeStepQ(), e = q.q.replace('Work it out: ', ''); let w; try { w = evalD(e); } catch (er) { bad('three', q, 'cannot evaluate: ' + er.message); continue; }
  if (big(q.show) !== w) bad('three', q, 'wrong answer; expected ' + w); else { notWrong('three', q, w); common('three', q); } }
for (let i = 0; i < N; i++) { const q = G.bigQ(), m = q.q.match(new RegExp(`^${NUM} ([+−×]) ${NUM} = \\?$`)); if (!m) { bad('big', q, 'form'); continue; }
  const a = big(m[1]), b = big(m[3]), w = m[2] === '+' ? a + b : m[2] === '−' ? a - b : mulB(a, b);
  if (w <= 0n || big(q.show) !== w) bad('big', q, 'wrong answer'); else { notWrong('big', q, w); common('big', q); } }
/* word problems: every template re-solved by hand from the numbers in its text */
const nums = s => (s.replace(/,/g, '').match(/\d+(?:\.\d+)?/g) || []);
const seen = new Set();
for (let i = 0; i < N * 3; i++) {
  const q = G.wordsQ(), k = q.kind, x = nums(q.q), v = x.map(big); seen.add(k);
  const w = { 'w-add': () => v[0] + v[1], 'w-change': () => v[0] - v[1], 'w-mulw': () => mulB(v[0], v[1]), 'w-muld': () => mulB(v[0], v[1]), 'w-divw': () => divExact(v[0], v[1]),
    'w-split': () => divExact(v[1], v[0]), 'w-divd': () => divExact(v[0], v[1]), 'w-diff': () => v[0] - v[1], 'w-two': () => mulB(v[0], v[1]) + v[2], 'w-add3': () => v[0] + v[1] + v[2] }[k];
  if (!w) { bad('words', q, 'unknown kind ' + k); continue; }
  const want = w();
  if (want === null || want <= 0n || big(q.show) !== want) bad('words ' + k, q, 'wrong answer; expected ' + want); else { notWrong('words ' + k, q, want); common('words ' + k, q); }
}
if (seen.size < 10) { console.log('FAIL words: only saw', [...seen]); fails++; }
/* the guide helper agrees with the exact arithmetic, and says something kind for bad input */
const rndDec = () => { const p = Math.floor(Math.random() * 4); return (Math.floor(Math.random() * 90000) + 1) / 10 ** p; };
const fmtD = (v, p) => (v).toFixed(p);
for (let i = 0; i < N; i++) {
  const pa = Math.floor(Math.random() * 4), pb = Math.floor(Math.random() * 4);
  const a = fmtD(Math.floor(Math.random() * 99999) / 10 ** pa + 0.00001 * 0, pa), b = fmtD(Math.floor(Math.random() * 999 + 1) / 10 ** pb, pb), op = '+−×÷'[i % 4];
  let r; try { r = G.helper(a, b, op); } catch (e) { if (!e.message) bad('helper', { q: `${a} ${op} ${b}` }, 'error without a message'); continue; }
  const A = big(a), B = big(b), want = op === '+' ? A + B : op === '−' ? A - B : op === '×' ? mulB(A, B) : divExact(A, B);
  if (want === null || big(r.answer) !== want) bad('helper', { q: `${a} ${op} ${b}`, show: r.answer }, 'wrong answer; expected ' + want);
  if (!r.rows.length || !r.rows.some(x => typeof x === 'string' && x.includes(r.answer.replace(/,/g, '').length ? r.answer : ''))) bad('helper', { q: `${a} ${op} ${b}` }, 'steps do not show the answer');
}
for (const [a, b, op, frag] of [['', '1', '+', 'Type a number'], ['1', 'x', '+', 'needs a decimal'], ['-3', '1', '+', 'positive'], ['2', '5', '−', 'at least as big'], ['1', '0', '÷', 'divide by zero'], ['1', '3', '÷', 'evenly'], ['1.2.3', '1', '+', 'needs a decimal'], ['1234567', '1', '+', 'up to 6 digits']]) {
  try { G.helper(a, b, op); bad('helper-errors', { q: `${a} ${op} ${b}` }, 'should have been refused'); } catch (e) { if (!e.message.includes(frag)) bad('helper-errors', { q: `${a} ${op} ${b}` }, 'message was: ' + e.message); }
}
/* typed answers, written with commas or trailing zeros, are accepted by the site's own answer checker */
{
  const box = { window: {}, document: { querySelector: () => null }, SB: { esc: s => String(s) }, console }; box.window.SB = box.SB; vm.createContext(box);
  vm.runInContext(fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), '../../shared/sb-tools.js'), 'utf8'), box);
  const J = box.window.SBT.judge;
  for (const fn of [G.addQ, G.subQ, G.mulWholeQ, G.mulDecQ, G.divWholeQ, () => G.divDecQ(), G.wordsQ, G.missingQ, G.threeStepQ, G.bigQ]) for (let i = 0; i < 400; i++) {
    const q = fn(), plain = q.show.replace(/,/g, ''), padded = plain.includes('.') ? plain + '0' : plain + '.0';
    for (const typed of [q.show, plain, padded]) if (J({ a: q.a }, typed, 'number') !== 'ok') bad('judge', q, `"${typed}" was not accepted`);
    if (J({ a: q.a }, q.wrong[0], 'number') === 'ok') bad('judge', q, 'a wrong option was accepted');
  }
}
if (fails) console.log(`Repeat this exact run with SEED=${SEED}.`);
console.log(fails ? `${fails} problems failed` : `ALL PASSED (${N} of each Decimal Operations kind: add, subtract, multiply, divide, estimate, missing, three steps, bigger, word problems, helper)`);
process.exit(fails ? 1 : 0);
