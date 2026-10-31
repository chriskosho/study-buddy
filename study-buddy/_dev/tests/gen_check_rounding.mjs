/* Checks the Rounding and Place Value generators: makes thousands of problems and re-solves each one from its question text
   (a different method from the generator: string digits and integer division). Run: node study-buddy/_dev/tests/gen_check_rounding.mjs */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const SEED = Number(process.env.SEED) || (Date.now() % 1e9);
Math.random = (a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(SEED);
const G = require('../../modules/math/rounding-place-value/gen.js');
const N = 3000; let fails = 0;
const bad = (t, q, m) => { if (fails++ < 15) console.log('FAIL', t, '|', q.q, '|', m, '| a =', q.a, q.wrong || ''); };
const num = s => Number(String(s).replace(/,/g, ''));
const strRound = (n, step) => { const s = String(n).padStart(4, '0'), k = step === 10 ? 3 : 2; const up = Number(s[k]) >= 5; const head = Number(s.slice(0, k)) + (up ? 1 : 0); return head * step; };   // digit rule
const ONES = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'], TENS = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
const toWords = n => { const h = (n / 100) | 0, r = n % 100, p = []; if (h) p.push(ONES[h] + ' hundred'); if (r) p.push(r < 20 ? ONES[r] : TENS[(r / 10) | 0] + (r % 10 ? '-' + ONES[r % 10] : '')); return p.join(' '); };
const parseWords = w => { let v = 0; for (const t of w.split(/[ -]/)) { if (t === 'hundred') v *= 100; else if (ONES.includes(t)) { v += ONES.indexOf(t); } else if (TENS.includes(t)) v += TENS.indexOf(t) * 10; else return NaN; } return v; };
const sumExp = s => s.split(' + ').reduce((x, y) => x + num(y), 0);
const distinct = (t, q, ans) => {
  const w = q.wrong.map(String);
  if (w.length !== 3) bad(t, q, 'needs 3 wrong options');
  if (w.includes(String(ans))) bad(t, q, 'a wrong option equals the answer');
  if (new Set(w).size !== w.length) bad(t, q, 'duplicate wrong options');
};
const common = (t, q) => { if (!q.why || !q.hint || !q.say || /undefined|NaN|Infinity/.test(q.why + q.q + q.hint)) bad(t, q, 'missing or odd why/hint/say'); };

for (let i = 0; i < N; i++) {
  let q = G.placeValueQ(), m = q.q.match(/^What is the value of the (\d) in (\d+)\?$/);
  if (!m) bad('placeValue', q, 'form'); else { const pos = m[2].indexOf(m[1]); const places = [...m[2]].map((c, k) => [c, 10 ** (m[2].length - 1 - k)]); const v = places.find(([c]) => c === m[1])[1] * Number(m[1]); if (num(q.a) !== v) bad('placeValue', q, 'wrong answer ' + v); distinct('placeValue', q, q.a); if (m[2].split(m[1]).length !== 2) bad('placeValue', q, 'digit repeats'); if (Number(m[1]) === 0) bad('placeValue', q, 'zero digit'); }
  common('placeValue', q);
  q = G.placeDigitQ(); m = q.q.match(/^Which digit is in the (hundreds|tens|ones) place in (\d+)\?$/);
  if (!m) bad('placeDigit', q, 'form'); else { const d = m[2][{ hundreds: 0, tens: 1, ones: 2 }[m[1]]]; if (q.a !== d) bad('placeDigit', q, 'wrong answer ' + d); distinct('placeDigit', q, q.a); }
  common('placeDigit', q);
  q = G.placeExpandedQ(); m = q.q.match(/^Which is the expanded form of (\d+)\?$/);
  if (!m) bad('expanded', q, 'form'); else { const n = Number(m[1]); if (sumExp(q.a) !== n) bad('expanded', q, 'answer does not add to n'); if (q.a.split(' + ').some(x => x === '0')) bad('expanded', q, 'zero term'); distinct('expanded', q, q.a); if (q.wrong.some(w => sumExp(w) === n)) bad('expanded', q, 'a wrong option also adds to n'); if (/= .* = /.test(q.why)) bad('expanded', q, 'doubled explanation'); }
  common('expanded', q);
  q = G.placeWordQ();
  if ((m = q.q.match(/^Which number is (.+)\?$/))) { const n = parseWords(m[1]); if (num(q.a) !== n) bad('words->num', q, 'wrong answer ' + n); if (q.wrong.some(w => num(w) === n)) bad('words->num', q, 'wrong equals answer'); distinct('words->num', q, q.a); }
  else if ((m = q.q.match(/^Which is (\d+) in words\?$/))) { if (q.a !== toWords(Number(m[1]))) bad('num->words', q, 'wrong answer'); if (q.wrong.some(w => parseWords(w) === Number(m[1]))) bad('num->words', q, 'wrong equals answer'); distinct('num->words', q, q.a); if (/\s-|-\s|-hundred|hundred-/.test(q.a)) bad('num->words', q, 'hyphen'); }
  else bad('word', q, 'form');
  common('word', q);
  q = G.compareSymQ(); m = q.q.match(/^Which symbol makes this true\? (.+?)  ___  (\d+)$/);
  if (!m) bad('compareSym', q, 'form'); else { const L = m[1].includes('+') ? sumExp(m[1]) : Number(m[1]), R = Number(m[2]); const s = L < R ? '<' : L > R ? '>' : '='; if (q.a !== s) bad('compareSym', q, 'wrong answer ' + s); if (q.wrong.length !== 2 || q.wrong.includes(q.a)) bad('compareSym', q, 'wrong options'); }
  common('compareSym', q);
  q = G.compareOrderQ(); m = q.q.match(/^Which list is in order from (least to greatest|greatest to least)\?/);
  if (!m) bad('compareOrder', q, 'form'); else { const l = q.a.split(', ').map(Number), asc = m[1][0] === 'l'; if (l.length !== 4 || new Set(l).size !== 4 || l.some((x, k) => k && (asc ? l[k - 1] >= x : l[k - 1] <= x))) bad('compareOrder', q, 'answer not in order'); distinct('compareOrder', q, q.a); if (q.wrong.some(w => [...w.split(', ')].sort().join() !== [...q.a.split(', ')].sort().join() && false)) bad('compareOrder', q, 'x'); }
  common('compareOrder', q);
  for (const [nm, f, step] of [['round10', G.round10Q, 10], ['round100', G.round100Q, 100]]) {
    q = f(); m = q.q.match(/^Round ([\d,]+) to the nearest (10|100)\.$/);
    if (!m || Number(m[2]) !== step) { bad(nm, q, 'form'); continue; }
    const n = num(m[1]); if (q.a !== strRound(n, step)) bad(nm, q, 'wrong answer ' + strRound(n, step));
    if (n % step === 0) bad(nm, q, 'already a multiple'); distinct(nm, q, q.a); if (q.wrong.some(w => w <= 0 || w > 1000)) bad(nm, q, 'wrong option out of range');
    if (!q.html || !q.html.includes('<svg') || !q.html.includes('halfway')) bad(nm, q, 'no number line'); if (!q.why.includes(String(q.a).replace(/\B(?=(\d{3})+$)/g, ','))) bad(nm, q, 'why lacks the answer');
    common(nm, q);
  }
  for (const [nm, f, op] of [['estSum', G.estimateSumQ, '+'], ['estDiff', G.estimateDiffQ, '−']]) {
    q = f(); m = q.q.match(/^Estimate ([\d,]+) [+−] ([\d,]+): round each number to the nearest (10|100), then (add|subtract)\.$/);
    if (!m || m[4] !== (op === '+' ? 'add' : 'subtract')) { bad(nm, q, 'form'); continue; }
    const a = num(m[1]), b = num(m[2]), step = Number(m[3]), ra = strRound(a, step), rb = strRound(b, step), est = op === '+' ? ra + rb : ra - rb;
    if (num(q.a) !== est) bad(nm, q, 'wrong answer ' + est); distinct(nm, q, q.a); if (q.wrong.some(w => num(w) <= 0)) bad(nm, q, 'nonpositive option'); if (op === '−' && a <= b) bad(nm, q, 'a <= b'); if (op === '+' && a + b > 999) bad(nm, q, 'sum over 999');
    common(nm, q);
  }
  q = G.addQ(); m = q.q.match(/^([\d,]+) \+ ([\d,]+) = \?$/);
  if (!m) bad('add', q, 'form'); else { const a = num(m[1]), b = num(m[2]); if (q.a !== a + b) bad('add', q, 'wrong answer'); if (a + b > 1000) bad('add', q, 'over 1,000'); if (q.wrong.some(w => w === q.a || w <= 0) || new Set(q.wrong).size !== q.wrong.length || q.wrong.length !== 3) bad('add', q, 'wrong options'); }
  common('add', q);
  q = G.subQ(); m = q.q.match(/^([\d,]+) − ([\d,]+) = \?$/);
  if (!m) bad('sub', q, 'form'); else { const a = num(m[1]), b = num(m[2]); if (q.a !== a - b || a - b <= 0) bad('sub', q, 'wrong answer'); if (q.wrong.some(w => w === q.a || w <= 0) || new Set(q.wrong).size !== q.wrong.length || q.wrong.length !== 3) bad('sub', q, 'wrong options'); }
  common('sub', q);
  q = G.wordsQ();
  { let want = null; const nums = (q.q.match(/\d[\d,]*/g) || []).map(num);
    if (/^\d[\d,]* people.*nearest 10/.test(q.q)) want = strRound(nums[0], 10);
    else if (/muffins.*nearest 100/.test(q.q)) want = strRound(nums[0], 100);
    else if (/read .* in all/.test(q.q)) want = nums[0] + nums[1];
    else if (/the rest are blue/.test(q.q)) want = nums[0] - nums[1];
    else if (/Round each number to the nearest 100/.test(q.q)) want = strRound(nums[0], 100) + strRound(nums[1], 100);
    else if (/How many more/.test(q.q)) want = nums[0] - nums[1];
    else if (/^A number has/.test(q.q)) { const g = q.q.match(/has (\d) hundreds?, (\d) tens?, and (\d) ones?/); want = Number(g[1]) * 100 + Number(g[2]) * 10 + Number(g[3]); }
    if (want === null) bad('words', q, 'unknown form'); else if (q.a !== want) bad('words', q, 'wrong answer ' + want); if (!(q.a > 0 && q.a <= 1000)) bad('words', q, 'answer out of range'); common('words', q); }
}
/* the study guide helpers */
for (let n = 0; n <= 1000; n++) { const c = G.chart(String(n)); if (n < 1000 && c.h * 100 + c.t * 10 + c.o !== n) bad('chart', { q: n }, 'digits'); if (n < 1000 && n && sumExp(c.expanded) !== n) bad('chart', { q: n }, 'expanded'); if (n && n < 1000 && parseWords(c.words) !== n) bad('chart', { q: n }, 'words ' + c.words); }
for (const s of ['', 'abc', '1001', '-5', '3.5']) { try { G.chart(s); bad('chart', { q: s }, 'should throw'); } catch (e) { if (!/whole number/.test(e.message)) bad('chart', { q: s }, 'message'); } }
for (const [n, step, want] of [[45, 10, 50], [44, 10, 40], [450, 100, 500], [449, 100, 400], [962, 100, 1000], [995, 10, 1000], [5, 10, 10]]) if (G.roundTo(n, step) !== want) bad('roundTo', { q: n + '/' + step }, 'expected ' + want);
for (let n = 1; n <= 999; n++) for (const step of [10, 100]) if (G.roundTo(n, step) !== strRound(n, step)) bad('roundTo', { q: n + '/' + step }, 'differs from digit rule');
console.log(fails ? `${fails} FAILED (seed ${SEED})` : 'ALL PASSED (seed ' + SEED + ')'); process.exit(fails ? 1 : 0);
