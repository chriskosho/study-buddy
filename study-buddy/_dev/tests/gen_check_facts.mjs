/* Checks the Multiplication and Division Facts generators: makes thousands of problems and re-solves each one from its
   question text. Run: node study-buddy/_dev/tests/gen_check_facts.mjs   (repeat a failure: SEED=<n> node ...) */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const SEED = Number(process.env.SEED) || (Date.now() % 1e9);
Math.random = (a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(SEED);
const G = require('../../modules/math/facts/gen.js');
const N = 20000; let fails = 0;
const bad = (t, q, m) => { if (fails++ < 15) console.log('FAIL', t, '|', q.q || q.text, '|', m, '| a =', q.a, q.wrong || ''); };
const nums = s => (s.match(/\d+/g) || []).map(Number);
const opts = (t, q, need = 3) => {
  const speedItem = t === 'speed';
  if (q.a === undefined || q.a === '' || !q.wrong || q.wrong.length < need) return bad(t, q, `needs an answer and ${need} wrong options`), false;
  if (q.wrong.map(String).includes(String(q.a))) return bad(t, q, 'answer is also a wrong option'), false;
  if (new Set(q.wrong.map(String)).size !== q.wrong.length) return bad(t, q, 'duplicate wrong options'), false;
  if (!speedItem && (!q.why || !q.hint)) bad(t, q, 'missing why or hint');
  return true;
};
// independent: parse "a op b" style fact text and return whether it is true
const factTrue = s => { const m = s.match(/^(\d+) ([×÷+−]) (\d+) = (\d+)$/); if (!m) return null; const [x, o, y, z] = [m[1], m[3], m[4]].length && [+m[1], m[2], +m[3], +m[4]]; return o === '×' ? x * y === z : o === '÷' ? y !== 0 && x / y === z : o === '+' ? x + y === z : x - y === z; };
for (let i = 0; i < N; i++) {
  let q = G.timesQ(), m;
  if (opts('times', q) && (m = q.q.match(/^(\d+) × (\d+) = \?$/))) { if (+m[1] * +m[2] !== q.a) bad('times', q, 'wrong product'); if (+m[1] > 10 || +m[2] > 10) bad('times', q, 'out of range'); } else bad('times', q, 'unknown form');
  q = G.divideQ();
  if (opts('divide', q) && (m = q.q.match(/^(\d+) ÷ (\d+) = \?$/))) { if (+m[2] === 0 || +m[1] % +m[2] || +m[1] / +m[2] !== q.a) bad('divide', q, 'wrong quotient'); if (+m[2] > 10 || q.a > 10) bad('divide', q, 'out of range'); } else bad('divide', q, 'unknown form');
  q = G.missingQ();
  if (opts('missing', q)) {
    const t = q.q.replace('Find the missing number: ', ''); const ok = v => { const e = t.replace('?', v), p = e.match(/^(\d+) ([×÷]) (\d+) = (\d+)$/) || e.match(/^(\d+) ([×÷]) (\d+) = (\d+)$/); if (!p) return null; const [x, o, y, z] = [+p[1], p[2], +p[3], +p[4]]; return o === '×' ? x * y === z : y !== 0 && x / y === z; };
    if (ok(q.a) !== true) bad('missing', q, 'answer does not make it true');
    for (const w of q.wrong) if (ok(w) === true) bad('missing', q, 'a wrong option also makes it true: ' + w);
  }
  q = G.familyFactQ();
  if (opts('family-fact', q)) { if (factTrue(q.a) !== true) bad('family-fact', q, 'answer is false'); const ns = nums(q.q); if (!nums(q.a).every(n => ns.includes(n))) bad('family-fact', q, 'answer uses other numbers'); for (const w of q.wrong) if (factTrue(w) === true) bad('family-fact', q, 'wrong option is true: ' + w); }
  q = G.familyTrioQ();
  if (opts('family-trio', q)) { const f = s => G.isFamily(nums(s)); const ind = s => { const t = nums(s).sort((x, y) => x - y); return t.length === 3 && t[0] * t[1] === t[2]; }; if (!ind(q.a)) bad('family-trio', q, 'answer is not a family'); for (const w of q.wrong) if (ind(w)) bad('family-trio', q, 'wrong option is a family: ' + w); if (f(q.a) !== ind(q.a)) bad('family-trio', q, 'isFamily disagrees'); }
  q = G.familyCompleteQ();
  if (opts('family-complete', q)) { const [a, b, p] = nums(q.q); if (a * b !== p) bad('family-complete', q, 'bad family'); if (p / b !== a && String(q.a) !== String(b)) bad('family-complete', q, 'wrong missing divisor'); if (p % +q.a || p / +q.a !== a) bad('family-complete', q, 'answer does not make p ÷ ? = a'); for (const w of q.wrong) if (+w > 0 && p % +w === 0 && p / +w === a) bad('family-complete', q, 'wrong option also works: ' + w); }
  for (const form of ['nines', 'fives', 'odd']) {
    q = G.patternQ(form);
    if (!opts('pattern-' + form, q)) continue;
    if (form === 'nines') { const t = n => +n % 9 === 0 && +n > 0; if (!t(q.a)) bad('nines', q, 'answer not a multiple of 9'); for (const w of q.wrong) if (t(w)) bad('nines', q, 'wrong is a multiple of 9: ' + w); }
    if (form === 'fives') { const t = n => +n % 5 === 0; if (!t(q.a)) bad('fives', q, 'answer not a multiple of 5'); for (const w of q.wrong) if (t(w)) bad('fives', q, 'wrong is a multiple of 5: ' + w); }
    if (form === 'odd') { const t = s => { const [x, y] = nums(s); return (x * y) % 2 === 1; }; if (!t(q.a)) bad('odd', q, 'answer not odd'); for (const w of q.wrong) if (t(w)) bad('odd', q, 'wrong is odd: ' + w); }
  }
  q = G.wordsQ();
  if (opts('words', q)) {
    const n = nums(q.q.replace(/\s+/g, ' ')); let want;
    if (q.k === 'w-groups') want = n[0] * n[1]; else if (q.k === 'w-rows') want = n[0] * n[1]; else if (q.k === 'w-times') want = n[0] * n[1];
    else if (q.k === 'w-share') want = n[0] / n[1]; else if (q.k === 'w-howmany') want = n[0] / n[1]; else bad('words', q, 'unknown kind ' + q.k);
    if (want !== q.a) bad('words ' + q.k, q, 'expected ' + want);
    if (['w-share', 'w-howmany'].includes(q.k) && n[0] % n[1]) bad('words', q, 'leftover');
  }
  q = G.arrayQ();
  if (opts('array', q)) { const r = (q.html.match(/data-r="(\d+)"/) || [])[1], c = (q.html.match(/data-c="(\d+)"/) || [])[1], dots = (q.html.match(/class="adot"/g) || []).length; if (dots !== q.a || r * c !== q.a) bad('array', q, `dots ${dots}, ${r}x${c}`); if (/#fff|white/i.test(q.html)) bad('array', q, 'literal white'); }
  const s = G.speedQ(); let sm;
  if (opts('speed', s)) { if ((sm = s.text.match(/^(\d+) × (\d+)$/))) { if (+sm[1] * +sm[2] !== s.a) bad('speed', s, 'wrong product'); } else if ((sm = s.text.match(/^(\d+) ÷ (\d+)$/))) { if (+sm[1] / +sm[2] !== s.a || +sm[1] % +sm[2]) bad('speed', s, 'wrong quotient'); } else bad('speed', s, 'unknown form'); }
}
console.log(fails ? `${fails} FAILED (SEED=${SEED})` : 'ALL PASSED'); process.exit(fails ? 1 : 0);
