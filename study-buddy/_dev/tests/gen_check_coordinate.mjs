/* Checks The Coordinate Plane generators: makes thousands of problems and re-solves each one from the picture (the SVG circles and labels) and the question text.
   Run: node study-buddy/_dev/tests/gen_check_coordinate.mjs     (repeat a failure: SEED=<n> node ...)  Prints ALL PASSED and exits 0, else exits 1. */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const SEED = Number(process.env.SEED) || (Date.now() % 1e9);
Math.random = (a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(SEED);
const G = require('../../modules/math/coordinate-plane/gen.js');
const N = 4000; let fails = 0;
const bad = (t, q, m) => { if (fails++ < 15) console.log('FAIL', t, '|', String(q.q || q.text).slice(0, 110), '|', m, '| a =', JSON.stringify(q.a), q.wrong || '', 'SEED', SEED); };
const strip = s => String(s).replace(/<svg[\s\S]*<\/svg>/, '');
const svgOf = q => (q.html || q.q.match(/<svg[\s\S]*<\/svg>/)?.[0] || '');
const pairs = s => [...s.matchAll(/\((\d+), (\d+)\)/g)].map(m => [+m[1], +m[2]]);
/* every circle and label in the picture, as grid points (the picture is 440 wide with a 34 margin) */
function drawn(svg) {
  const max = +svg.match(/data-max="(\d+)"/)[1], st = (440 - 68) / max, out = [];
  for (const m of svg.matchAll(/<circle class="pt[^"]*" cx="([\d.]+)" cy="([\d.]+)"|<text class="plbl"[^>]*>([^<]*)</g)) {
    if (m[3] !== undefined) { if (out.length) out[out.length - 1].l = m[3]; } else out.push({ x: Math.round((+m[1] - 34) / st), y: Math.round((406 - +m[2]) / st), l: '' });
  }
  return { max, pts: out, segs: [...svg.matchAll(/<line class="seg"/g)].length, polys: [...svg.matchAll(/<polygon class="poly"/g)].length };
}
const txt = (t, p) => `(${p[0]}, ${p[1]})`;
const common = (t, q, form, needWrong = 3, noPic = false) => {
  if (!q.why || !q.hint || !q.say) bad(t, q, 'missing why, hint, or say');
  if (form === 'mc') {
    if (!q.a || q.wrong.length < needWrong) return bad(t, q, `needs an answer and ${needWrong} wrong options`);
    if (q.wrong.includes(q.a)) bad(t, q, 'answer is also a wrong option');
    if (new Set(q.wrong).size !== q.wrong.length) bad(t, q, 'duplicate wrong options');
    if (q.wrong.some(w => /-/.test(w))) bad(t, q, 'negative number in an option');
  } else if (form === 'num') { if (typeof q.a !== 'number' || !Number.isInteger(q.a) || q.a < 1 || String(q.a) !== q.show) bad(t, q, 'bad number answer'); }
  else if (!Array.isArray(q.a) || q.a[0] !== q.show) bad(t, q, 'bad text answer');
  const svg = svgOf(q); if (!noPic && (!svg || !svg.includes('<svg'))) bad(t, q, 'no picture');
  if (/#fff\b|white/i.test(svg)) bad(t, q, 'literal white in the picture');
};
const asPair = s => { const m = String(s).match(/^\((\d+), (\d+)\)$/); return m ? [+m[1], +m[2]] : null; };
const inGrid = (t, q, d) => { for (const p of d.pts) if (p.x < 0 || p.y < 0 || p.x > d.max || p.y > d.max) bad(t, q, 'point outside the grid'); };
const same = (a, b) => a[0] === b[0] && a[1] === b[1];

for (const form of ['mc', 'text']) for (let i = 0; i < N; i++) {
  { const q = G.readQ(form); common('read', q, form); const d = drawn(svgOf(q)); inGrid('read', q, d);
    if (d.pts.length !== 1) bad('read', q, 'needs exactly one point'); else { const want = txt(0, [d.pts[0].x, d.pts[0].y]); if ((form === 'mc' ? q.a : q.show) !== want) bad('read', q, 'wrong coordinates, picture says ' + want); if (d.pts[0].x === d.pts[0].y) bad('read', q, 'x equals y'); }
    if (form === 'mc') for (const w of q.wrong) { const p = asPair(w); if (!p || p[0] > 10 || p[1] > 10) bad('read', q, 'wrong option off the grid ' + w); } }
  { const q = G.cornerQ(form); common('corner', q, form); const d = drawn(svgOf(q)), t = strip(q.q), P = pairs(t);
    if (P.length !== 3 || d.pts.length !== 3) bad('corner', q, 'needs three corners'); else {
      P.forEach((p, k) => { if (!same(p, [d.pts[k].x, d.pts[k].y]) || d.pts[k].l !== 'ABC'[k]) bad('corner', q, 'picture does not match the text'); });
      const once = v => { const c = v.filter(x => v.filter(y => y === x).length === 1); return c.length === 1 ? c[0] : NaN; };
      const D = [once(P.map(p => p[0])), once(P.map(p => p[1]))], want = txt(0, D);
      if (isNaN(D[0]) || isNaN(D[1])) bad('corner', q, 'the three corners do not make a rectangle'); else {
        if ((form === 'mc' ? q.a : q.show) !== want) bad('corner', q, 'wrong D, expected ' + want);
        if (D[0] > 10 || D[1] > 10) bad('corner', q, 'D off the grid');
        const w = Math.max(...P.map(p => p[0])) - Math.min(...P.map(p => p[0])), h = Math.max(...P.map(p => p[1])) - Math.min(...P.map(p => p[1]));
        if (/square/.test(t) !== (w === h)) bad('corner', q, 'square or rectangle word is wrong'); if (w < 2 || h < 2) bad('corner', q, 'shape too thin'); } }
    if (form === 'mc') for (const w of q.wrong) { const p = asPair(w); if (!p || p[0] > 10 || p[1] > 10) bad('corner', q, 'wrong option off the grid ' + w); } }
  { const q = G.perimQ(form === 'mc' ? 'mc' : 'num'); common('perim', q, form === 'mc' ? 'mc' : 'num'); const d = drawn(svgOf(q)), P = pairs(strip(q.q));
    if (P.length !== 4 || d.polys !== 1) bad('perim', q, 'needs four corners and a shape'); else {
      P.forEach(p => { if (!d.pts.some(c => same(p, [c.x, c.y]))) bad('perim', q, 'corner not in the picture'); });
      const xs = [...new Set(P.map(p => p[0]))], ys = [...new Set(P.map(p => p[1]))];
      if (xs.length !== 2 || ys.length !== 2) bad('perim', q, 'not a rectangle'); else {
        const w = Math.abs(xs[0] - xs[1]), h = Math.abs(ys[0] - ys[1]), want = 2 * (w + h);
        if ((form === 'mc' ? +q.a !== want : (+q.show !== want || q.a !== want))) bad('perim', q, 'wrong perimeter, expected ' + want);
        if (/square/.test(q.q) !== (w === h)) bad('perim', q, 'square or rectangle word is wrong');
        if (form === 'mc') for (const w2 of q.wrong) if (+w2 < 1) bad('perim', q, 'bad option ' + w2); } } }
  { const q = G.distQ(form === 'mc' ? 'mc' : 'num'); common('dist', q, form === 'mc' ? 'mc' : 'num'); const d = drawn(svgOf(q)), P = pairs(strip(q.q));
    if (P.length !== 2 || d.pts.length !== 2 || d.segs !== 1) bad('dist', q, 'needs two points and a line'); else {
      P.forEach((p, k) => { if (!same(p, [d.pts[k].x, d.pts[k].y]) || d.pts[k].l !== 'AB'[k]) bad('dist', q, 'picture does not match the text'); });
      const [A, B] = P; if (A[0] !== B[0] && A[1] !== B[1]) bad('dist', q, 'not on one line'); const want = Math.abs(A[0] - B[0]) + Math.abs(A[1] - B[1]);
      if (want < 2) bad('dist', q, 'too close'); if ((form === 'mc' ? +q.a !== want : (+q.show !== want || q.a !== want))) bad('dist', q, 'wrong distance, expected ' + want);
      if (form === 'mc' && q.wrong.some(w => +w === want || +w < 1)) bad('dist', q, 'bad option'); } }
  { const q = G.coordOfQ(form); common('coordOf', q, form); const d = drawn(svgOf(q)), name = q.q.match(/of the (\w+)\?/)[1], p = d.pts.find(c => c.l === name);
    inGrid('coordOf', q, d); if (!p) bad('coordOf', q, 'place not drawn'); else if ((form === 'mc' ? q.a : q.show) !== txt(0, [p.x, p.y])) bad('coordOf', q, 'wrong coordinates'); }
  { const q = G.endQ(form); common('end', q, form); const d = drawn(svgOf(q)), m = q.q.match(/Start at the (\w+) \((\d+), (\d+)\)\. Go (.*)\. What are/);
    if (!m) bad('end', q, 'cannot read the question'); else {
      const at = d.pts.find(c => c.l === m[1]); if (!at || at.x !== +m[2] || at.y !== +m[3]) bad('end', q, 'start place is not where the text says');
      let x = +m[2], y = +m[3]; for (const [, n, dir] of m[4].matchAll(/(\d+) (?:units?|blocks?) (right|left|up|down)/g)) { if (dir === 'right') x += +n; if (dir === 'left') x -= +n; if (dir === 'up') y += +n; if (dir === 'down') y -= +n; }
      if (x < 0 || y < 0 || x > 10 || y > 10) bad('end', q, 'ends off the grid'); if ((form === 'mc' ? q.a : q.show) !== txt(0, [x, y])) bad('end', q, 'wrong end, expected ' + txt(0, [x, y])); } }
  { const q = G.blocksQ(form === 'mc' ? 'mc' : 'num'); common('blocks', q, form === 'mc' ? 'mc' : 'num'); const d = drawn(svgOf(q)), m = q.q.match(/from the (\w+) \((\d+), (\d+)\) to the (\w+) \((\d+), (\d+)\)/);
    if (!m) bad('blocks', q, 'cannot read the question'); else {
      const A = d.pts.find(c => c.l === m[1]), B = d.pts.find(c => c.l === m[4]);
      if (!A || !B || !same([A.x, A.y], [+m[2], +m[3]]) || !same([B.x, B.y], [+m[5], +m[6]])) bad('blocks', q, 'picture does not match the text');
      const dx = Math.abs(+m[2] - +m[5]), dy = Math.abs(+m[3] - +m[6]); if (dx && dy) bad('blocks', q, 'not on one line'); const want = dx + dy;
      if (want < 2 || (form === 'mc' ? +q.a !== want : (+q.show !== want || q.a !== want))) bad('blocks', q, 'wrong blocks, expected ' + want); } }
  { const q = G.patNextQ(form); common('patNext', q, form); const d = drawn(svgOf(q)), t = strip(q.q);
    const m = t.match(/Rule A: start at (\d+), add (\d+)\. Rule B: start at (\d+), add (\d+)\./); const P = pairs(t.replace(/^.*?first ordered pairs/, ''));
    if (!m || P.length !== 4) bad('patNext', q, 'cannot read the question'); else {
      const [a0, a, b0, b] = m.slice(1).map(Number), want = [a0 + 4 * a, b0 + 4 * b];
      P.forEach((p, n) => { if (!same(p, [a0 + n * a, b0 + n * b])) bad('patNext', q, 'a shown pair breaks the rule'); if (!same(p, [d.pts[n]?.x, d.pts[n]?.y])) bad('patNext', q, 'picture does not match'); });
      if (want[0] > 20 || want[1] > 20) bad('patNext', q, 'next pair beyond 20'); if (d.max < Math.max(...want) || ![10, 12, 20].includes(d.max)) bad('patNext', q, 'axis too small for the answer');
      if ((form === 'mc' ? q.a : q.show) !== txt(0, want)) bad('patNext', q, 'wrong next pair, expected ' + txt(0, want));
      if (a0 !== 0 || (b0 !== 0 && b !== a) ) { /* additive rule: starts differ by c, same step */ } if (b0 === 0 && b % a !== 0) bad('patNext', q, 'B is not a multiple of A'); } }
  if (form === 'mc') {
    { const q = G.pickQ(); common('pick', q, 'mc'); const d = drawn(q.html), m = q.q.match(/\((\d+), (\d+)\)/); inGrid('pick', q, d);
      if (d.pts.length !== 4) bad('pick', q, 'needs four points'); else { const hits = d.pts.filter(c => c.x === +m[1] && c.y === +m[2]);
        if (hits.length !== 1 || q.a !== 'Point ' + hits[0].l) bad('pick', q, 'wrong point'); if (!d.pts.some(c => c.x === +m[2] && c.y === +m[1])) bad('pick', q, 'no swapped-coordinates distractor');
        if (new Set(d.pts.map(c => c.x + ',' + c.y)).size !== 4) bad('pick', q, 'two points on top of each other'); if (new Set(d.pts.map(c => c.l)).size !== 4) bad('pick', q, 'labels repeat'); } }
    { const q = G.axisQ(); common('axis', q, 'mc', 3, true); const t = q.q, A = String(q.a);
      if (/y-axis\?/.test(t)) { const p = asPair(A); if (!p || p[0] !== 0 || p[1] < 1) bad('axis', q, 'answer not on the y-axis'); q.wrong.forEach(w => { const r = asPair(w); if (r && r[0] === 0) bad('axis', q, 'an option is also on the y-axis ' + w); }); }
      else if (/x-axis\?/.test(t)) { const p = asPair(A); if (!p || p[1] !== 0 || p[0] < 1) bad('axis', q, 'answer not on the x-axis'); q.wrong.forEach(w => { const r = asPair(w); if (r && r[1] === 0) bad('axis', q, 'an option is also on the x-axis ' + w); }); }
      else if (/^Which ordered pair names the origin/.test(t)) { if (A !== '(0, 0)') bad('axis', q, 'origin is (0, 0)'); }
      else if (/how do you get to/.test(t)) { const [x, y] = pairs(t)[0]; if (A !== `Right ${x}, then up ${y}`) bad('axis', q, 'wrong directions'); }
      else if (/how far to go right/.test(t)) { const [x, y] = pairs(t)[0]; if (A !== String(x) || q.wrong.includes(String(x))) bad('axis', q, 'x tells how far right'); if (!q.wrong.includes(String(y))) bad('axis', q, 'y should be a distractor'); }
      else bad('axis', q, 'unknown variant'); }
    { const q = G.patRelQ(); common('patRel', q, 'mc', 3, true); const t = q.q, m = t.match(/Rule A: start at (\d+), add (\d+)\. Rule B: start at (\d+), add (\d+)\./), P = pairs(t.replace(/^.*?ordered pairs/, ''));
      if (!m || P.length !== 3) bad('patRel', q, 'cannot read the question'); else {
        const holds = s => { let k; if ((k = s.match(/^(\d+) times as large as/))) return P.every(([A, B]) => B === +k[1] * A); if ((k = s.match(/^(\d+) more than/))) return P.every(([A, B]) => B === A + +k[1]); if ((k = s.match(/^(\d+) less than/))) return P.every(([A, B]) => B === A - +k[1]); if (/^the same as/.test(s)) return P.every(([A, B]) => B === A); return null; };
        if (holds(q.a) !== true) bad('patRel', q, 'the answer is not true for every pair'); for (const w of q.wrong) if (holds(w) !== false) bad('patRel', q, 'an option is true or unreadable: ' + w); } }
    { const q = G.placeAtQ(); common('placeAt', q, 'mc'); const d = drawn(q.html), m = q.q.match(/at \((\d+), (\d+)\)/), p = d.pts.find(c => c.x === +m[1] && c.y === +m[2]);
      inGrid('placeAt', q, d); if (!p || p.l !== q.a) bad('placeAt', q, 'wrong place'); if (new Set(d.pts.map(c => c.x + ',' + c.y)).size !== d.pts.length) bad('placeAt', q, 'places overlap'); if (!q.wrong.every(w => d.pts.some(c => c.l === w))) bad('placeAt', q, 'an option is not on the map'); }
    { const q = G.movesQ(); common('moves', q, 'mc'); const d = drawn(q.html), m = q.q.match(/Start at the (\w+) \((\d+), (\d+)\)\. Go (.*)\. Which place/);
      if (!m) bad('moves', q, 'cannot read the question'); else { let x = +m[2], y = +m[3]; for (const [, n, dir] of m[4].matchAll(/(\d+) (?:units?|blocks?) (right|left|up|down)/g)) { if (dir === 'right') x += +n; if (dir === 'left') x -= +n; if (dir === 'up') y += +n; if (dir === 'down') y -= +n; }
        const at = d.pts.find(c => c.x === x && c.y === y), st = d.pts.find(c => c.l === m[1]); if (!st || st.x !== +m[2] || st.y !== +m[3]) bad('moves', q, 'start is not where the text says'); if (!at || at.l !== q.a) bad('moves', q, 'wrong place reached'); } }
  }
}
for (let i = 0; i < 400; i++) {
  const T = G.plotTargets(10), keys = new Set(T.map(t => t.x + ',' + t.y));
  if (T.length !== 10 || keys.size !== 10) bad('plotTargets', { q: 'targets' }, 'needs 10 different targets');
  for (const t of T) { const m = t.text.match(/\((\d+), (\d+)\)/); if (!m || +m[1] !== t.x || +m[2] !== t.y || t.x > 10 || t.y > 10 || t.x < 0 || t.y < 0 || (!t.x && !t.y)) bad('plotTargets', t, 'target does not match its text or is off the grid'); if (!t.why || !t.hint || !t.say) bad('plotTargets', t, 'missing why, hint, or say'); }
  const U = G.patternTargets(10);
  if (U.length < 5 || new Set(U.map(t => t.text)).size !== U.length) bad('patternTargets', { q: 'targets' }, 'needs several different patterns, got ' + U.length);
  for (const t of U) { const m = t.text.match(/Rule A: start at (\d+), add (\d+)\. Rule B: start at (\d+), add (\d+)\./); const [a0, a, b0, b] = m.slice(1).map(Number), P = pairs(t.text.replace(/^.*?first ordered pairs/, ''));
    if (P.length !== 4 || P.some((p, n) => !same(p, [a0 + n * a, b0 + n * b]))) bad('patternTargets', t, 'a shown pair breaks the rule');
    if (t.x !== a0 + 4 * a || t.y !== b0 + 4 * b || t.x > 12 || t.y > 12 || t.max !== 12) bad('patternTargets', t, 'wrong target ' + t.x + ',' + t.y); if (!t.why || !t.hint || !t.say) bad('patternTargets', t, 'missing why, hint, or say'); }
}
// the picture itself: labels and the tap helper's grid
for (const max of [10, 12, 20]) { const g = G.geom(max); if (Math.abs(g.st * max - 372) > 1e-9) { console.log('FAIL geometry', max); fails++; } }
if (G.axisMax(10) !== 10 || G.axisMax(11) !== 12 || G.axisMax(13) !== 20) { console.log('FAIL axisMax'); fails++; }
if (fails) { console.log(fails + ' FAILURES. Repeat with SEED=' + SEED); process.exit(1); }
console.log('ALL PASSED (seed ' + SEED + ')');
