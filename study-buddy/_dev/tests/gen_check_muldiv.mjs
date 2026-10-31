/* Checks the Multi-Digit Multiplication and Long Division generators: makes thousands of problems and re-solves each one with exact BigInt
   math (independent of gen.js: the area model is read back from the picture's own data and labels, the word problems from their `chk` formula,
   and the long division from a plain divmod). Wrong options must really be wrong. Run: node study-buddy/_dev/tests/gen_check_muldiv.mjs */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const SEED = Number(process.env.SEED) || (Date.now() % 1e9);
Math.random = (a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(SEED);
const G = require('../../modules/math/multiply-divide/gen.js');
const N = 4000; let fails = 0;
const bad = (t, q, m) => { if (fails++ < 15) console.log('FAIL', t, '|', q.q, '|', m, '| a =', q.a, '| wrong =', q.wrong); };
const un = s => BigInt(String(s).replace(/,/g, ''));
const fmt = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const numsIn = s => (String(s).match(/\d[\d,]*/g) || []).map(un);
const mcOk = (t, q) => {
  if (!q.wrong || q.wrong.length < 3) return bad(t, q, 'needs 3 wrong options');
  if (q.wrong.map(String).includes(String(q.show ?? q.a))) bad(t, q, 'answer is also a wrong option');
  if (new Set(q.wrong.map(String)).size !== q.wrong.length) bad(t, q, 'duplicate wrong options');
  if (!q.why || !q.hint || /undefined|NaN|Infinity/.test(q.why + q.q + q.hint)) bad(t, q, 'missing or odd hint/explanation');
};
/* a tiny exact evaluator for the word problems' chk formulas: numbers, + - *, / (must be exact), floor(a, b), ceil(a, b), rem(a, b) */
function evalChk(s) {
  const t = s.match(/\d+|floor|ceil|rem|[+\-*\/(),]/g); let i = 0;
  const expr = () => { let v = term(); while (t[i] === '+' || t[i] === '-') { const o = t[i++], b = term(); v = o === '+' ? v + b : v - b; } return v; };
  const term = () => { let v = atom(); while (t[i] === '*' || t[i] === '/') { const o = t[i++], b = atom(); if (o === '/') { if (v % b) throw new Error('inexact'); v /= b; } else v *= b; } return v; };
  const atom = () => { const x = t[i++]; if (x === '(') { const v = expr(); i++; return v; }
    if (x === 'floor' || x === 'ceil' || x === 'rem') { i++; const a = expr(); i++; const b = expr(); i++; return x === 'floor' ? a / b : x === 'rem' ? a % b : (a + b - 1n) / b; }
    return BigInt(x); };
  const r = expr(); if (i !== t.length) throw new Error('leftover'); return r;
}
const nk = q => q.replace(/<[^>]+>/g, '');
for (const [name, fn, digits] of [['multiply', G.multiplyQ, [2, 2]], ['bigmult', G.bigmultQ, null]]) for (let i = 0; i < N; i++) {
  const q = fn(), [a, b] = numsIn(q.q); mcOk(name, q);
  if (BigInt(q.a) !== a * b) bad(name, q, `wrong product, expected ${a * b}`);
  if (digits && (String(a).length !== digits[0] || String(b).length !== digits[1])) bad(name, q, 'wrong size of factors');
  if (!digits && !(String(a).length >= 3 && String(b).length >= 2 && String(a).length + String(b).length >= 5)) bad(name, q, 'not a bigger product');
  if (q.wrong.some(w => BigInt(w) === a * b)) bad(name, q, 'a wrong option equals the product');
  const sumLine = q.why.match(/Add the partial products: (.*) = ([\d,]+)\.$/);   // the explanation's partial products must add to the product
  if (!sumLine || sumLine[1].split(' + ').map(un).reduce((x, y) => x + y, 0n) !== a * b || un(sumLine[2]) !== a * b) bad(name, q, 'partial products in the explanation do not add up');
}
for (let i = 0; i < N; i++) {   // area model, both kinds
  const q = G.areaQ(); mcOk('area', q);
  const m = q.html.match(/data-a="(\d+)" data-b="(\d+)"(?: data-hide="(\d),(\d)")?/), a = BigInt(m[1]), b = BigInt(m[2]);
  const nameNums = numsIn(q.q); if (!nameNums.includes(a) || !nameNums.includes(b)) bad('area', q, 'question and picture disagree');
  const parts = n => String(n).split('').map((d, k, arr) => BigInt(d) * 10n ** BigInt(arr.length - 1 - k)).filter(x => x > 0n);
  const ap = parts(a), bp = parts(b);
  const heads = [...q.html.matchAll(/class="mdh"[^>]*>([\d,]+)</g)].map(x => un(x[1]));
  if (heads.join() !== [...ap, ...bp].join()) bad('area', q, 'picture headings are not the place-value parts');
  const cells = [...q.html.matchAll(/class="mdv"[^>]*>([^<]*)</g)].map(x => x[1]);
  if (cells.length !== ap.length * bp.length) bad('area', q, 'wrong number of boxes');
  cells.forEach((c, k) => { const r = Math.floor(k / ap.length), col = k % ap.length; if (c !== '?' && un(c) !== bp[r] * ap[col]) bad('area', q, 'a box shows the wrong product'); });
  if (m[3] !== undefined) {   // 'part': the answer is the shaded box
    const r = +m[3], c = +m[4]; if (un(q.a) !== bp[r] * ap[c]) bad('area', q, 'wrong shaded box value'); if (cells.filter(x => x === '?').length !== 1 || cells[r * ap.length + c] !== '?') bad('area', q, 'shaded box is not the hidden one');
    if (q.wrong.some(w => un(w) === bp[r] * ap[c])) bad('area', q, 'a wrong option equals the box value');
  } else {   // 'total': the answer is the sum of the boxes, which is the product
    if (un(q.a) !== a * b || cells.map(un).reduce((x, y) => x + y, 0n) !== a * b) bad('area', q, 'boxes do not add to the product');
  }
}
for (const [name, fn, dlo, dhi] of [['div1', G.div1Q, 2, 9], ['div2', G.div2Q, 11, 79]]) for (let i = 0; i < N; i++) {
  const q = fn(), [n, d] = numsIn(q.q); mcOk(name, q);
  const Q = n / d, R = n % d, want = R ? `${fmt(Q)} R ${R}` : fmt(Q);
  if (q.show !== want) bad(name, q, 'wrong quotient/remainder, expected ' + want);
  if (!q.a.includes(want) || (R === 0n) !== q.a.includes(`${want} R 0`)) bad(name, q, 'accepted answers are wrong');
  if (d < BigInt(dlo) || d > BigInt(dhi)) bad(name, q, 'divisor out of range');
  if (R >= d) bad(name, q, 'remainder not smaller than divisor');
  const end = q.why.match(/So ([\d,]+) ÷ ([\d,]+) = ([\d,]+)(?: R (\d+))?\. Check: ([\d,]+) × ([\d,]+)(?: \+ (\d+))? = ([\d,]+)\.$/);
  if (!end || un(end[1]) !== n || un(end[2]) !== d || un(end[3]) !== Q || BigInt(end[4] || 0) !== R || un(end[5]) * un(end[6]) + BigInt(end[7] || 0) !== n) bad(name, q, 'explanation summary or check line is wrong');
  // every step in the explanation must be correct arithmetic, and the quotient digits spell the answer
  let digitsOut = '';
  for (const s of q.why.matchAll(/(\d[\d,]*) into (\d[\d,]*): (?:(\d) × (\d[\d,]*) = (\d[\d,]*), (\d[\d,]*) − (\d[\d,]*) = (\d[\d,]*)|0 times)/g)) {
    if (un(s[1]) !== d) bad(name, q, 'a step uses the wrong divisor'); const cur = un(s[2]);
    if (s[3] === undefined) { if (cur >= d) bad(name, q, 'said 0 times but it fits'); digitsOut += '0'; continue; }
    const qd = BigInt(s[3]); if (qd !== cur / d || un(s[5]) !== qd * d || un(s[8]) !== cur - qd * d || un(s[8]) >= d) bad(name, q, 'a step is wrong: ' + s[0]); digitsOut += s[3];
  }
  if (BigInt(digitsOut || 0) !== Q) bad(name, q, 'step digits do not spell the quotient ' + digitsOut);
  for (const w of q.wrong) { const m = w.match(/^([\d,]+)(?: R (\d+))?$/); if (!m) bad(name, q, 'odd wrong option ' + w); else if (un(m[1]) === Q && BigInt(m[2] || 0) === R) bad(name, q, 'a wrong option equals the answer'); }
}
for (let i = 0; i < N; i++) {   // remainders
  const q = G.remaindersQ(); mcOk('remainders', q);
  const [n, d] = [BigInt(q.meta.n), BigInt(q.meta.d)], nums = numsIn(q.q);
  if (!nums.includes(n) || !nums.includes(d)) bad('remainders', q, 'question does not use its numbers');
  const want = q.meta.kind === 'left' ? n % d : q.meta.kind === 'up' ? (n + d - 1n) / d : n / d;
  if (un(q.a) !== want || evalChk(q.chk) !== want) bad('remainders', q, `wrong answer for ${q.meta.kind}, expected ${want}`);
  if (n % d === 0n) bad('remainders', q, 'no remainder, so the three answers would not differ');
  if (q.wrong.some(w => un(w) === want)) bad('remainders', q, 'a wrong option equals the answer');
  const w = { left: /left over/, up: /(needed|need)/, drop: /(full|whole|completely)/ }[q.meta.kind]; if (!w.test(q.q)) bad('remainders', q, 'question wording does not match its kind');
}
for (let i = 0; i < N * 2; i++) {   // word problems
  const q = G.wordsQ(); mcOk('words', q);
  const want = evalChk(q.chk); if (BigInt(q.a) !== want) bad('words', q, `wrong answer, expected ${want}`);
  const inText = new Set(numsIn(nk(q.q)).map(String)); evalChk(q.chk);
  for (const x of q.chk.match(/\d+/g)) if (!inText.has(x) && !q.chk.includes('floor') && !q.chk.includes('ceil')) bad('words', q, 'a number in the formula is not in the question: ' + x);
  if (q.wrong.some(w => BigInt(w) === want)) bad('words', q, 'a wrong option equals the answer');
  if (!q.why.includes(fmt(want)) && !q.why.includes(String(want))) bad('words', q, 'explanation does not state the answer');
}
if (fails) console.log(`Repeat this exact run with SEED=${SEED}.`);
console.log(fails ? `${fails} problems failed` : `ALL PASSED (${N} of each kind: multiply, bigger products, area model, divide by 1-digit, divide by 2-digit, remainders, and ${N * 2} word problems)`);
process.exit(fails ? 1 : 0);
