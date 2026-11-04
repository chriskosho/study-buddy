/* Checks the Multiplication Tables to 15 generators: makes thousands of problems and re-solves each one from its
   question text. Run: node study-buddy/_dev/tests/gen_check_tables15.mjs   (repeat a failure: SEED=<n> node ...) */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const SEED = Number(process.env.SEED) || (Date.now() % 1e9);
Math.random = (a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(SEED);
const G = require('../../modules/math/tables-15/gen.js');
const N = 20000; let fails = 0, teens = 0, total = 0;
const bad = (t, q, m) => { if (fails++ < 15) console.log('FAIL', t, '|', q.q || q.text, '|', m, '| a =', q.a, q.wrong || ''); };
const nums = s => (s.match(/\d+/g) || []).map(Number);
const opts = (t, q) => {
  if (q.a === undefined || q.a === '' || !q.wrong || q.wrong.length < 3) return bad(t, q, 'needs an answer and 3 wrong options'), false;
  if (q.wrong.map(String).includes(String(q.a))) return bad(t, q, 'answer is also a wrong option'), false;
  if (new Set(q.wrong.map(String)).size !== q.wrong.length) return bad(t, q, 'duplicate wrong options'), false;
  if (t !== 'speed' && (!q.why || !q.hint)) bad(t, q, 'missing why or hint');
  if (t !== 'speed' && q.why && !q.why.includes(String(q.a)) && !t.startsWith('apart-first') && !t.startsWith('apart-second')) bad(t, q, 'explanation does not state the answer');
  return true;
};
const range = (t, q, ...xs) => xs.forEach(x => { if (x < 2 || x > 15) bad(t, q, 'out of range ' + x); });
const evalFact = e => { const m = e.match(/^(\d+) ([×÷]) (\d+) = (\d+)$/); if (!m) return null; const [x, y, z] = [+m[1], +m[3], +m[4]]; return m[2] === '×' ? x * y === z : y !== 0 && x / y === z; };
for (let i = 0; i < N; i++) {
  let q = G.timesQ(), m;
  if (opts('times', q) && (m = q.q.match(/^(\d+) × (\d+) = \?$/))) { if (+m[1] * +m[2] !== q.a) bad('times', q, 'wrong product'); range('times', q, +m[1], +m[2]); total++; if (+m[1] > 10 || +m[2] > 10) teens++; } else bad('times', q, 'unparsed');
  q = G.divideQ();
  if (opts('divide', q) && (m = q.q.match(/^(\d+) ÷ (\d+) = \?$/))) { if (+m[1] % +m[2] || +m[1] / +m[2] !== q.a) bad('divide', q, 'wrong quotient'); range('divide', q, +m[2], q.a); } else bad('divide', q, 'unparsed');
  q = G.missingQ();
  if (opts('missing', q)) {
    const t = q.q.replace('Find the missing number: ', ''), ok = v => evalFact(t.replace('?', v));
    if (ok(q.a) !== true) bad('missing', q, 'answer does not make it true');
    for (const w of q.wrong) if (ok(w) === true) bad('missing', q, 'a wrong option also makes it true: ' + w);
  }
  q = G.apartQ();
  if (q.a !== undefined && opts('apart', q)) {
    if ((m = q.q.match(/^(\d+) × (\d+) = \((\d+) × 10\) \+ \((\d+) × (\d+)\) = (\d+) \+ \?$/))) {         // two numbers over 10
      const [a, b, a2, a3, r, n] = m.slice(1).map(Number);
      if (a !== a2 || a3 !== a || r !== b - 10 || n !== a * 10 || q.a !== a * r || n + q.a !== a * b) bad('apart-both', q, 'wrong step');
    } else if ((m = q.q.match(/^(\d+) × (\d+) = \(10 × (\d+)\) \+ \((\d+) × (\d+)\) = (.+)$/))) {
      const [l, s, s2, r, s3] = m.slice(1, 6).map(Number), tail = m[6], p = l * s;
      if (s !== s2 || s !== s3 || r !== l - 10 || s > 9 || s < 2) bad('apart', q, 'bad split');
      let t2;
      if ((t2 = tail.match(/^\? \+ (\d+)$/))) { if (q.a !== 10 * s || q.a + +t2[1] !== p || +t2[1] !== r * s) bad('apart-first', q, 'wrong step'); }
      else if ((t2 = tail.match(/^(\d+) \+ \?$/))) { if (q.a !== r * s || +t2[1] + q.a !== p || +t2[1] !== 10 * s) bad('apart-second', q, 'wrong step'); }
      else if ((t2 = tail.match(/^(\d+) \+ (\d+) = \?$/))) { if (q.a !== p || +t2[1] + +t2[2] !== p) bad('apart-total', q, 'wrong total'); }
      else bad('apart', q, 'unparsed tail');
    } else bad('apart', q, 'unparsed');
  }
  q = G.wordsQ();
  if (opts('words', q)) {
    const n = nums(q.q.replace(/\s+/g, ' ')); let want;
    if (['w-groups', 'w-rows', 'w-times'].includes(q.k)) want = n[0] * n[1]; else if (['w-share', 'w-howmany'].includes(q.k)) want = n[0] / n[1]; else bad('words', q, 'unknown kind ' + q.k);
    if (want !== q.a) bad('words ' + q.k, q, 'expected ' + want);
    if (['w-share', 'w-howmany'].includes(q.k) && n[0] % n[1]) bad('words', q, 'leftover');
  }
  const s = G.speedQ(); let sm;
  if (opts('speed', s)) { if ((sm = s.text.match(/^(\d+) × (\d+)$/))) { if (+sm[1] * +sm[2] !== s.a) bad('speed', s, 'wrong product'); } else if ((sm = s.text.match(/^(\d+) ÷ (\d+)$/))) { if (+sm[1] / +sm[2] !== s.a) bad('speed', s, 'wrong quotient'); } else bad('speed', s, 'unparsed'); }
}
if (teens / total < 0.75) { fails++; console.log('FAIL too few facts over 10:', (teens / total).toFixed(2)); }
for (let a = 2; a <= 15; a++) for (let b = 2; b <= 15; b++) { const st = G.strategy(a, b), p = a * b; if (!st.why.includes(String(p))) { fails++; console.log('FAIL strategy', a, b, st.why); } }
console.log(fails ? `${fails} FAILED (SEED=${SEED})` : 'ALL PASSED'); process.exit(fails ? 1 : 0);
