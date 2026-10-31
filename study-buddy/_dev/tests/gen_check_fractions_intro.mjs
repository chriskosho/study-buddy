/* Checks the Fractions (3rd grade) generators: makes thousands of problems and re-solves each one from the picture data (the data-* on each SVG) and the question text,
   then checks that every wrong option is really wrong (different in value, never a second right answer).
   Run: node study-buddy/_dev/tests/gen_check_fractions_intro.mjs     (repeat a failure: SEED=<n> node ...)  Prints ALL PASSED and exits 0, else exits 1. */
import { createRequire } from 'node:module';
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm';
const require = createRequire(import.meta.url);
const SEED = Number(process.env.SEED) || (Date.now() % 1e9);
Math.random = (a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(SEED);
const G = require('../../modules/math/fractions-intro/gen.js');
const N = 3000; let fails = 0;
const bad = (t, q, m) => { if (fails++ < 15) console.log('FAIL', t, '|', String(q.q).slice(0, 120), '|', m, '| a =', JSON.stringify(q.a), q.wrong || '', 'SEED', SEED); };
const PARTS = { halves: 2, thirds: 3, fourths: 4, fifths: 5, sixths: 6, eighths: 8, tenths: 10, twelfths: 12 };
const parse = s => { const m = String(s).match(/^(\d+)\/(\d+)$/); return m ? { n: +m[1], d: +m[2] } : null; };
const eq = (a, b) => a.n * b.d === b.n * a.d;
const gcd = (a, b) => b ? gcd(b, a % b) : a;
const rows = svg => [...svg.matchAll(/data-rows="([^"]*)"/g)].flatMap(m => m[1].split(';').map(r => r.split(':').map(Number)));
const cnt = (svg, cls) => [...svg.matchAll(new RegExp(`<(?:rect|path|circle) class="${cls}"`, 'g'))].length;
const common = (t, q, mc = true) => {
  if (!q.why || !q.hint || !q.say) bad(t, q, 'missing why, hint, or say');
  if (typeof q.a !== 'string' || !q.a) bad(t, q, 'needs a string answer');
  if (!Array.isArray(q.wrong) || q.wrong.length < 2) bad(t, q, 'needs at least 2 wrong options');
  if (q.wrong.includes(q.a)) bad(t, q, 'answer is also a wrong option');
  if (new Set(q.wrong).size !== q.wrong.length) bad(t, q, 'duplicate wrong options');
  const svg = q.html || '';
  if (svg) {
    if (/#fff|white|#000/i.test(svg)) bad(t, q, 'literal color in the picture');
    if (!/role="img"/.test(svg) || !/aria-label="[^"]{8,}"/.test(svg)) bad(t, q, 'picture lacks role or label');
    if (!/viewBox=/.test(svg)) bad(t, q, 'picture lacks a viewBox');
  }
  if (/[<>]/.test(q.q)) bad(t, q, 'question text should be plain text');
};
/* fraction MC: the right option and every wrong option are fractions, all different in value */
const fracOpts = (t, q) => {
  const A = parse(q.a); if (!A) return bad(t, q, 'answer is not a fraction');
  if (q.wrong.length < 3) bad(t, q, 'needs 3 wrong options');
  for (const w of q.wrong) { const W = parse(w); if (!W) bad(t, q, 'wrong option is not a fraction ' + w); else if (eq(A, W)) bad(t, q, 'wrong option equals the answer in value ' + w); else if (W.d < 1 || W.n < 1) bad(t, q, 'silly option ' + w); }
  return A;
};
const typedOK = (t, q, want) => { if (q.typed !== want || q.a !== String(want) || !Number.isInteger(want) || want < 1) bad(t, q, 'wrong typed answer, expected ' + want); if (q.wrong.includes(q.a) || q.wrong.some(w => +w === want)) bad(t, q, 'typed wrong equals answer'); };

for (let i = 0; i < N; i++) {
  /* name the fraction, from the picture */
  for (const shape of ['bars', 'circle', 'set']) {
    const q = G.nameQ(shape); common('name', q); const A = fracOpts('name', q), svg = q.html; if (!A) continue;
    let d, on;
    if (shape === 'bars') { const r = rows(svg); if (r.length !== 1) { bad('name', q, 'one bar expected'); continue; } [d, on] = r[0]; if (cnt(svg, 'fc') + cnt(svg, 'fc on') !== d) { /* class "fc on" counted separately */ } }
    else if (shape === 'circle') { d = +svg.match(/data-d="(\d+)"/)[1]; on = +svg.match(/data-on="(\d+)"/)[1]; }
    else { d = +svg.match(/data-total="(\d+)"/)[1]; on = +svg.match(/data-on="(\d+)"/)[1]; }
    const drawn = cnt(svg, 'fc on'), all = drawn + cnt(svg, 'fc');
    if (all !== d || drawn !== on) bad('name', q, `picture says ${drawn}/${all} but data says ${on}/${d}`);
    const want = /NOT shaded/.test(q.q) ? { n: d - on, d } : { n: on, d };
    if (!eq(A, want) || A.d !== d) bad('name', q, `expected ${want.n}/${want.d}`);
    if (on < 1 || on >= d) bad('name', q, 'shaded count out of range');
    if (!q.wrong.every(w => parse(w).n <= 24)) bad('name', q, 'silly wrong option');
  }
  { const q = G.unitQ(); common('unit', q); const A = fracOpts('unit', q); if (A) { const d = +q.q.match(/into (\d+) equal/)[1], r = q.html.match(/data-rows="(\d+):1"/), c = q.html.match(/data-d="(\d+)" data-on="1"/); if (A.n !== 1 || A.d !== d) bad('unit', q, 'expected 1/' + d); if (!((r && +r[1] === d) || (c && +c[1] === d))) bad('unit', q, 'picture does not match the text'); } }
  /* number line */
  { const q = G.nlReadQ(); common('nlread', q); const A = fracOpts('nlread', q), svg = q.html; if (A) {
      const max = +svg.match(/data-max="(\d+)"/)[1], d = +svg.match(/data-d="(\d+)"/)[1], m = [...svg.matchAll(/data-marks="([^"]*)"/g)][0][1].split(',').map(x => +x.split(':')[0]);
      const cy = [...svg.matchAll(/<circle class="pt" cx="([\d.]+)"/g)].map(x => +x[1]), x0 = 28, U = (452 - x0) / max, drawnN = Math.round((cy[0] - x0) / U * d);
      if (m.length !== 1 || cy.length !== 1 || drawnN !== m[0]) bad('nlread', q, 'point drawn at ' + drawnN + '/' + d);
      if (!eq(A, { n: drawnN, d }) || A.d !== d) bad('nlread', q, `expected ${drawnN}/${d}`);
      if (drawnN % d === 0 || drawnN >= max * d) bad('nlread', q, 'point is on a whole number or off the line');
      const ticks = [...svg.matchAll(/<line class="tk"/g)].length; if (ticks !== max * d + 1) bad('nlread', q, 'wrong tick count ' + ticks);
    } }
  { const q = G.nlPlaceQ(); common('nlplace', q); const svg = q.html, T = parse(q.q.match(/(\d+\/\d+)/)[1]), d = +svg.match(/data-d="(\d+)"/)[1], max = +svg.match(/data-max="(\d+)"/)[1];
    const marks = svg.match(/data-marks="([^"]*)"/)[1].split(',').map(x => { const [n, l] = x.split(':'); return { n: +n, l }; });
    const xs = [...svg.matchAll(/<circle class="pt" cx="([\d.]+)"/g)].map(x => Math.round((+x[1] - 28) / ((452 - 28) / max) * d));
    const lbl = [...svg.matchAll(/<text class="pl"[^>]*>([^<]*)</g)].map(x => x[1]);
    if (marks.length !== 4 || xs.length !== 4 || lbl.join('') !== 'ABCD') { bad('nlplace', q, 'needs four labeled points'); continue; }
    xs.forEach((x, k) => { if (x !== marks[k].n) bad('nlplace', q, 'drawn point differs from data'); });
    if (T.d !== d) bad('nlplace', q, 'question fraction has a different denominator than the line');
    const hits = lbl.filter((_, k) => eq({ n: xs[k], d }, T)); if (hits.length !== 1 || hits[0] !== q.a) bad('nlplace', q, 'the right point is ' + hits);
    if (q.wrong.length !== 3 || [q.a, ...q.wrong].sort().join('') !== 'ABCD') bad('nlplace', q, 'options should be A B C D'); }
  /* wholes and fractions */
  { const q = G.fracToWholeQ(); common('f2w', q); const F = parse(q.q.match(/(\d+\/\d+)/)[1]); if (F.n % F.d) bad('f2w', q, 'not a whole'); typedOK('f2w', q, F.n / F.d); if (F.n / F.d > 4) bad('f2w', q, 'too many wholes'); }
  { const q = G.wholeToFracQ(); common('w2f', q); const m = q.q.match(/^(\d+) = \?\/(\d+)\./); typedOK('w2f', q, +m[1] * +m[2]); }
  { const q = G.howManyQ(); common('howmany', q); const m = q.q.match(/How many (\w+) make (\d+) whole/), d = PARTS[m[1]], k = +m[2], r = rows(q.html);
    if (!d) { bad('howmany', q, 'unknown part name'); continue; } typedOK('howmany', q, k * d);
    if (r.length !== k || r.some(x => x[0] !== d || x[1] !== d)) bad('howmany', q, 'picture does not show ' + k + ' full bars of ' + d); }
  /* equivalent */
  { const q = G.equivNumQ(); common('equivnum', q); const m = q.q.match(/^(\d+)\/(\d+) = \?\/(\d+)\./), n = +m[1], d = +m[2], e = +m[3], r = rows(q.html);
    if ((n * e) % d) { bad('equivnum', q, 'not a whole number of parts'); continue; } typedOK('equivnum', q, n * e / d);
    if (r.length !== 2 || r[0][0] !== d || r[0][1] !== n || r[1][0] !== e) bad('equivnum', q, 'picture does not match'); if (e > 12 || e % d || e === d) bad('equivnum', q, 'bad denominators'); }
  { const q = G.equivPickQ(); common('equivpick', q); const T = parse(q.q.match(/(\d+\/\d+)/)[1]), A = fracOpts('equivpick', q), r = rows(q.html);
    if (A) { if (!(eq(A, T) && A.d !== T.d)) bad('equivpick', q, 'answer is not equivalent'); if (q.wrong.some(w => eq(parse(w), T))) bad('equivpick', q, 'wrong option is equivalent');
      if (r.length !== 2 || r[0][0] !== T.d || r[0][1] !== T.n || r[1][0] !== A.d || r[1][1] !== A.n) bad('equivpick', q, 'picture does not match'); } }
  /* compare */
  for (const [t, f] of [['cmpden', G.cmpDenQ], ['cmpnum', G.cmpNumQ], ['cmpeq', G.cmpEqQ]]) {
    const q = f(); common(t, q); const m = q.q.match(/^Compare (\d+\/\d+) and (\d+\/\d+)\./), A = parse(m[1]), B = parse(m[2]), r = rows(q.html);
    const sym = A.n * B.d < B.n * A.d ? '<' : A.n * B.d > B.n * A.d ? '>' : '=';
    if (q.a !== `${m[1]} ${sym} ${m[2]}`) bad(t, q, 'expected ' + sym);
    if (q.wrong.length !== 2 || new Set([q.a, ...q.wrong]).size !== 3 || [q.a, ...q.wrong].some(o => !new RegExp(`^${m[1]} [<>=] ${m[2]}$`).test(o))) bad(t, q, 'options should be the three symbols');
    if (r.length !== 2 || r[0][0] !== A.d || r[0][1] !== A.n || r[1][0] !== B.d || r[1][1] !== B.n) bad(t, q, 'picture does not match the text');
    if (t === 'cmpden' && (A.d !== B.d || A.n === B.n)) bad(t, q, 'denominators should match and tops differ');
    if (t === 'cmpnum' && (A.n !== B.n || A.d === B.d)) bad(t, q, 'tops should match and bottoms differ');
    if (t === 'cmpeq' && sym !== '=') bad(t, q, 'should be equal');
  }
  /* word problems, solved from the text */
  { const q = G.wordsQ(); common('words', q); let want = null, m;
    if ((m = q.q.match(/cuts a (\w+) into (\d+) equal slices and eats (\d+) of them\. What fraction of the \w+ (did \w+ eat|is left)\?/))) { const d = +m[2], n = +m[3]; want = m[4].startsWith('did') ? { n, d } : { n: d - n, d }; }
    else if ((m = q.q.match(/^A \w+ is cut into (\d+) equal pieces\. What fraction of the \w+ is 1 piece\?/))) want = { n: 1, d: +m[1] };
    else if ((m = q.q.match(/^A bag has (\d+) \w+\. (\d+) of them are \w+\./))) want = { n: +m[2], d: +m[1] };
    else if ((m = q.q.match(/eats all (\d+) equal slices/))) want = { n: +m[1], d: +m[1] };
    else if ((m = q.q.match(/^(\w+) \w+ (\d+\/\d+) .*?\. (\w+) \w+ (\d+\/\d+) .*?\. Who /))) {
      const A = parse(m[2]), B = parse(m[4]); if (eq(A, B)) bad('words', q, 'the two fractions are equal');
      const win = A.n * B.d > B.n * A.d ? m[1] : m[3], lose = win === m[1] ? m[3] : m[1];
      if (q.a !== win) bad('words', q, 'winner should be ' + win); if (!q.wrong.includes(lose) || !q.wrong.includes('They are equal') || q.wrong.length !== 2) bad('words', q, 'options wrong'); if (m[1] === m[3]) bad('words', q, 'same name twice'); continue;
    } else { bad('words', q, 'unknown template'); continue; }
    const A = fracOpts('words', q); if (A && !eq(A, want)) bad('words', q, `expected ${want.n}/${want.d}`);
    if (A && (q.q.match(/equal (slices|pieces)/) ) && A.d !== want.d) bad('words', q, 'denominator should be ' + want.d);
  }
}
/* the question kinds the Quiz and the typed tools use are made in a fair mix */
{ const seen = new Set(); for (let i = 0; i < 600; i++) seen.add(G.wordsQ().q.replace(/\d+/g, '#').replace(/\b[A-Z][a-z]+\b/g, 'X').split(' ').slice(2, 6).join(' ')); if (seen.size < 5) { console.log('FAIL words: low variety', seen.size); fails++; } }
/* typed answers are accepted by the site's own answer checker (and a wrong option never is) */
{
  const box = { window: {}, document: { querySelector: () => null }, SB: { esc: s => String(s) }, console }; box.window.SB = box.SB; vm.createContext(box);
  vm.runInContext(fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), '../../shared/sb-tools.js'), 'utf8'), box);
  const J = box.window.SBT.judge;
  for (const fn of [G.fracToWholeQ, G.wholeToFracQ, G.howManyQ, G.equivNumQ]) for (let i = 0; i < 400; i++) {
    const q = fn(); if (J({ a: q.typed }, q.a, 'number') !== 'ok') bad('judge', q, 'right answer not accepted');
    if (q.wrong.some(w => J({ a: q.typed }, w, 'number') === 'ok')) bad('judge', q, 'a wrong option was accepted');
  }
}
if (fails) console.log(`Repeat this exact run with SEED=${SEED}.`);
console.log(fails ? `${fails} problems failed` : `ALL PASSED (${N} of each Fractions kind: name bars/circle/set, unit, number line read and place, wholes, equivalent, compare, word problems)`);
process.exit(fails ? 1 : 0);
