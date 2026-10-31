/* Checks the Area and Perimeter generators: makes thousands of problems and re-solves each one on its own, reading the numbers back from
   the picture (its data and its drawn labels) and from the question text. Wrong options must really be wrong.
   Run: node study-buddy/_dev/tests/gen_check_areaperim.mjs     (repeat a failure: SEED=<n> node ...)  Prints ALL PASSED and exits 0, else exits 1. */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const SEED = Number(process.env.SEED) || (Date.now() % 1e9);
Math.random = (a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(SEED);
const G = require('../../modules/math/area-perimeter/gen.js');
const N = 3000; let fails = 0;
const bad = (q, m) => { if (fails++ < 15) console.log('FAIL', q.k, '|', String(q.text).slice(0, 100), '|', m, '| show =', q.show, '| wrong =', q.wrongShow, 'SEED', SEED); };
const nums = s => (String(s).match(/\d+/g) || []).map(Number);
const svgOf = q => q.pic || '';
const attr = (svg, n) => (svg.match(new RegExp(`data-${n}="([^"]*)"`)) || [])[1];
const labels = svg => [...svg.matchAll(/<text class="lb(?: [a-z]+)?"[^>]*>([^<]*)</g)].map(m => m[1]);
const shoelace = P => Math.abs(P.reduce((s, p, i) => { const n = P[(i + 1) % P.length]; return s + p[0] * n[1] - n[0] * p[1]; }, 0)) / 2;
const edges = P => P.map((p, i) => { const n = P[(i + 1) % P.length]; return Math.abs(p[0] - n[0]) + Math.abs(p[1] - n[1]); });
const sum = a => a.reduce((x, y) => x + y, 0);
const pts = s => s.split(' ').map(p => p.split(',').map(Number));
const area = d => d[0] * d[1], perim = d => 2 * (d[0] + d[1]);

/* the answer worked out again, from the picture and the words */
function solve(q) {
  const svg = svgOf(q), t = q.text, n = nums(t), kind = attr(svg, 'kind');
  switch (q.k) {
    case 'count-rect': case 'count-shape': {
      const cells = attr(svg, 'cells').split(';'); if (new Set(cells).size !== cells.length) bad(q, 'cells repeat');
      const on = (svg.match(/class="cell on"/g) || []).length; if (on !== cells.length) bad(q, 'drawn shaded squares differ from the data');
      const W = +attr(svg, 'w'), H = +attr(svg, 'h'); if ((svg.match(/<rect class="cell/g) || []).length !== W * H) bad(q, 'grid size wrong');
      if (cells.some(c => { const [r, k] = c.split(',').map(Number); return r < 0 || k < 0 || r >= H || k >= W; })) bad(q, 'shaded square outside the grid');
      if (q.k === 'count-rect' && cells.length !== W * H) bad(q, 'rectangle is not all shaded');
      return cells.length;
    }
    case 'area-labels': { const [a, b] = labels(svg).map(Number); if (a !== +attr(svg, 'w') || b !== +attr(svg, 'h')) bad(q, 'labels differ from the drawn size'); return a * b; }
    case 'area-words': return n[0] * n[1];
    case 'area-rows': return n[1] * n[2];
    case 'perim-rect': { const [a, b] = labels(svg).map(Number); if (a !== +attr(svg, 'w') || b !== +attr(svg, 'h')) bad(q, 'labels differ from the drawn size'); return 2 * (a + b); }
    case 'perim-rect4': { const L = attr(svg, 'lab').split('|').map(Number); if (labels(svg).map(Number).sort().join() !== [...L].sort().join()) bad(q, 'drawn labels differ from the data'); if (L.length !== 4 || L[0] !== L[2] || L[1] !== L[3]) bad(q, 'opposite sides unequal'); if (L[0] !== +attr(svg, 'w') || L[1] !== +attr(svg, 'h')) bad(q, 'labels differ from the drawn size'); return sum(L); }
    case 'perim-poly': { const s = attr(svg, 'sides').split(',').map(Number); if (labels(svg).join() !== s.join()) bad(q, 'labels differ from the data'); if (sum(s) - Math.max(...s) <= Math.max(...s) && s.length === 3) bad(q, 'impossible triangle'); if (s.length < 3 || s.some(x => x < 1 || x > 12)) bad(q, 'bad side'); return sum(s); }
    case 'perim-L': { const P = pts(attr(svg, 'pts')), e = edges(P); if (labels(svg).map(Number).join() !== e.join()) bad(q, 'labels differ from the edges'); return sum(e); }
    case 'perim-square': return 4 * n[0];
    case 'missing-area': { const a = n[0], s = n[1]; if (a % s) bad(q, 'inexact'); const L = labels(svg); if (!L.includes('?') || !L.includes(String(s))) bad(q, 'picture labels wrong'); if (!/Area = \d+ square units/.test(L.join(' ') + svg)) bad(q, 'picture lacks the area'); const w = +attr(svg, 'w'), h = +attr(svg, 'h'); const known = +L.find(x => x !== '?' && !/[a-z]/i.test(x)); if (!(w === s && h === a / s || w === a / s && h === s)) bad(q, 'drawn size disagrees'); return a / s; }
    case 'missing-perim': { const p = n[0], s = n[1], L = labels(svg); if (!L.includes('?') || !L.includes(String(s))) bad(q, 'picture labels wrong'); if (p % 2 || p / 2 - s < 1) bad(q, 'impossible'); return p / 2 - s; }
    case 'missing-tri': { const p = n[0], s = attr(svg, 'sides').split(','); if (s.filter(x => x === '?').length !== 1) bad(q, 'needs one ?'); const known = s.filter(x => x !== '?').map(Number), a = p - sum(known); if (known.length !== 2 || a < 1 || a >= sum(known) || a <= Math.abs(known[0] - known[1])) bad(q, 'impossible triangle'); return a; }
    case 'composite-L': { const P = pts(attr(svg, 'pts')), e = edges(P); if (labels(svg).map(Number).join() !== e.join()) bad(q, 'labels differ from the edges'); return shoelace(P); }
    case 'composite-two': return n[0] * n[1] + n[2] * n[3];
    case 'w-fence': case 'w-ribbon': return 2 * (n[0] + n[1]);
    case 'w-carpet': case 'w-poster': return n[0] * n[1];
    case 'w-tiles': return n[0] * n[1];
    case 'w-rug': { if (n[0] % n[1]) bad(q, 'inexact'); return n[0] / n[1]; }
    case 'w-pen': return n[0] / 2 - n[1];
    case 'w-patio-p': return 4 * n[0];
    case 'w-patio-a': return n[0] * n[0];
    case 'w-compare': return Math.abs(n[0] * n[1] - n[2] * n[3]);
    case 'w-banner': return n[0] * n[1] + n[2] * n[3];
  }
  bad(q, 'unknown kind ' + q.k); return -1;
}
const AREA_KINDS = /^(count|area|composite|w-(carpet|poster|compare|banner|patio-a))/, COUNT_NOUN = /^(w-(tiles))/;
function common(q) {
  if (!q.why || !q.hint || !q.say) return bad(q, 'missing why, hint, or say');
  if (/#fff\b|white/i.test(q.pic)) bad(q, 'literal white in the picture');
  if (/\?\s*$/.test(q.text) === false) bad(q, 'question does not end with a question mark');
  if (q.pic && !/aria-label="[^"]+"/.test(q.pic)) bad(q, 'picture has no description');
}
for (let i = 0; i < N; i++) {
  /* number answers (typed tools) */
  for (const [name, fn] of [['count', G.countQ], ['area', G.areaQ], ['perim', G.perimQ], ['missing', G.missingQ], ['composite', G.compositeQ], ['words', G.wordsQ]]) {
    const q = fn(); common(q);
    if (!Number.isInteger(q.a) || q.a < 1) { bad(q, 'bad answer'); continue; }
    const want = solve(q); if (want !== q.a) bad(q, `re-solved ${want}, generator says ${q.a}`);
    const num = s => Number(String(s).replace(/,/g, '').match(/^\d+/)[0]);
    if (num(q.show) !== q.a) bad(q, 'show differs from the answer');
    if (q.wrongShow.length !== 3 || new Set(q.wrongShow).size !== 3) bad(q, 'needs three different wrong options');
    if (q.wrongShow.some(w => num(w) === q.a || num(w) < 1)) bad(q, 'a wrong option is right or below 1');
    /* the unit: area is square units, a length is units, and wrong options carry the same unit word as the answer */
    const word = s => s.replace(/^[\d,]+ /, '');
    if (q.wrongShow.some(w => word(w).replace(/s$|es$/, '').replace(/^square /, '').replace(/ft$/, 'foot') !== word(q.show).replace(/s$|es$/, '').replace(/^square /, ''))) {
      if (!q.wrongShow.every(w => /^square/.test(word(w)) === /^square/.test(word(q.show)))) bad(q, 'unit kind differs in a wrong option');
    }
    if (q.k.startsWith('w-') === false) {
      const sq = /square/.test(q.show), isArea = /^(count|area|composite)/.test(q.k) && q.k !== 'area-words' ? true : /^(count|area|composite)/.test(q.k);
      if (sq !== isArea) bad(q, 'unit wrong: ' + q.show);
    } else if (AREA_KINDS.test(q.k) !== /square/.test(q.show)) bad(q, 'word problem unit wrong: ' + q.show);
    if (!q.why.includes(String(q.a))) bad(q, 'why does not state the answer');
    if (!q.why.includes(word(q.show).replace(/^square (unit|foot|feet|inch|inches|meter|meters)$/, '$&')) && !/tile/.test(q.show)) bad(q, 'why does not state the unit');
    if (/^(area|count|composite)/.test(q.k) && !q.why.includes('square')) bad(q, 'area why lacks square units');
    if (/^perim/.test(q.k) && /square units/.test(q.why)) bad(q, 'perimeter why says square units');
  }
  /* multiple choice: comparing rectangles */
  for (const form of ['sameP', 'sameA', 'pickP', 'pickA']) {
    const q = G.compareQ(form); common(q);
    if (new Set([q.show, ...q.wrongShow]).size !== 1 + q.wrongShow.length || q.wrongShow.length < 2) { bad(q, 'options must be different (and at least 3 in all)'); continue; }
    if (form === 'sameP' || form === 'sameA') {
      const svg = svgOf(q), A = attr(svg, 'a').split(',').map(Number), B = attr(svg, 'b').split(',').map(Number), n = nums(q.text);
      if (n.slice(0, 4).join() !== [...A, ...B].join()) bad(q, 'text and picture differ');
      const m = form === 'sameP' ? perim : area, other = form === 'sameP' ? area : perim;
      if (m(A) !== m(B) || m(A) !== n[4]) bad(q, 'the rectangles do not match in what the text says is the same');
      if (other(A) === other(B)) { bad(q, 'tie: two right answers'); continue; }
      const right = other(A) > other(B) ? 'Rectangle A' : 'Rectangle B';
      if (q.show !== right) bad(q, `right answer should be ${right}`);
      if (q.wrongShow.includes(right)) bad(q, 'right answer also listed as wrong');
      if (!q.wrongShow.includes('They have the same ' + (form === 'sameP' ? 'area' : 'perimeter'))) bad(q, 'missing the tie option');
      if (!/square units/.test(q.text) === (form === 'sameA')) bad(q, 'unit wording');
    } else {
      const t = nums(q.text)[0], m = form === 'pickP' ? perim : area, d = s => nums(s);
      if (m(d(q.show)) !== t) bad(q, 'right option does not match the target');
      q.wrongShow.forEach(w => { if (m(d(w)) === t) bad(q, 'a wrong option also matches the target: ' + w); });
      if (q.choices.some(c => c[0] < 1 || c[1] < 1 || c[0] > 12 || c[1] > 12)) bad(q, 'side out of range');
    }
  }
}
console.log(fails ? `${fails} FAILED (seed ${SEED})` : 'ALL PASSED');
process.exit(fails ? 1 : 0);
