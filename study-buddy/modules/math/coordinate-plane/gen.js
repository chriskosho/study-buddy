/* The Coordinate Plane: pictures and problem generators (5th grade, first quadrant only).
   plane() draws the grid as SVG (x first along the bottom, then y up the side). Every generator returns one problem in the form the tool wants:
     'mc'   -> { q, html, a, wrong: [..], why, hint, say }     (SBT.quiz: html is the picture)
     'num'  -> { q (with the picture), a: number, show, why, hint, say }      (SBT.answer kind 'number')
     'text' -> { q (with the picture), a: ['(3, 7)'], show, why, hint, say }  (SBT.answer kind 'text'; punctuation and spaces do not matter)
   Runs in the browser, and in Node for the generator check (_dev/tests/gen_check_coordinate.mjs). */
(function (root) {
  'use strict';
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pair = (x, y) => `(${x}, ${y})`;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const inR = (v, max) => v >= 0 && v <= max;

  /* ---------- the picture ---------- */
  const W = 440, M = 34;                                   // the viewBox is W x W; M is the margin for the numbers
  const geom = max => ({ W, M, max, st: (W - 2 * M) / max });
  const axisMax = need => need <= 10 ? 10 : need <= 12 ? 12 : 20;
  function plane(o = {}) {
    const max = o.max || 10, g = geom(max), every = max > 12 ? 2 : 1;
    const X = x => +(M + x * g.st).toFixed(2), Y = y => +(W - M - y * g.st).toFixed(2);
    let s = `<svg class="cpl" viewBox="0 0 ${W} ${W}" data-max="${max}" role="img" aria-label="${esc(o.label || 'A coordinate grid')}" focusable="false">`;
    s += `<rect class="bg" x="${M}" y="${M}" width="${W - 2 * M}" height="${W - 2 * M}"/>`;
    for (let i = 0; i <= max; i++) {
      if (i > 0) s += `<line class="gl" x1="${X(i)}" y1="${Y(0)}" x2="${X(i)}" y2="${Y(max)}"/><line class="gl" x1="${X(0)}" y1="${Y(i)}" x2="${X(max)}" y2="${Y(i)}"/>`;
      if (i % every === 0) s += `<text class="tk" x="${X(i)}" y="${Y(0) + 19}" text-anchor="middle">${i}</text>` + (i > 0 ? `<text class="tk" x="${X(0) - 8}" y="${Y(i) + 5}" text-anchor="end">${i}</text>` : '');
    }
    s += `<line class="ax" x1="${X(0)}" y1="${Y(0)}" x2="${X(max)}" y2="${Y(0)}"/><line class="ax" x1="${X(0)}" y1="${Y(0)}" x2="${X(0)}" y2="${Y(max)}"/>`;
    s += `<text class="axn" x="${X(max) + 14}" y="${Y(0) + 6}" text-anchor="middle">x</text><text class="axn" x="${X(0)}" y="${Y(max) - 11}" text-anchor="middle">y</text>`;
    (o.polys || []).forEach(p => { s += `<polygon class="poly" points="${p.map(([x, y]) => X(x) + ',' + Y(y)).join(' ')}"/>`; });
    (o.segs || []).forEach(([x1, y1, x2, y2]) => { s += `<line class="seg" x1="${X(x1)}" y1="${Y(y1)}" x2="${X(x2)}" y2="${Y(y2)}"/>`; });
    (o.pts || []).forEach(p => {
      s += `<circle class="pt${p.cls ? ' ' + p.cls : ''}" cx="${X(p.x)}" cy="${Y(p.y)}" r="8"/>`;
      if (p.l) { const left = p.x > max * 0.62; s += `<text class="plbl" x="${X(p.x) + (left ? -12 : 12)}" y="${Y(p.y) + (p.y > max - 1 ? 18 : -10)}" text-anchor="${left ? 'end' : 'start'}">${esc(p.l)}</text>`; }
    });
    return s + '</svg>';
  }
  /* a tap or click at (clientX, clientY) on a plane -> the nearest grid point, or null when it is outside the grid */
  function hit(svg, clientX, clientY) {
    const r = svg.getBoundingClientRect(), max = +svg.dataset.max, g = geom(max), k = W / r.width;
    const px = (clientX - r.left) * k, py = (clientY - r.top) * k, x = Math.round((px - M) / g.st), y = Math.round((W - M - py) / g.st);
    if (x < 0 || y < 0 || x > max || y > max) return null;
    return { x, y };
  }

  /* ---------- helpers for problems ---------- */
  const pickWrong = (a, cands, n = 3) => { const out = []; for (const c of shuffle(cands)) { if (c !== a && !out.includes(c)) out.push(c); if (out.length === n) break; } return out; };
  function fin(form, s) {
    if (form === 'mc') return { q: s.text, html: s.svg || '', a: s.show, wrong: [...new Set(s.wrong)].filter(w => w !== s.show), why: s.why, hint: s.hint, say: s.say || s.text };
    const a = form === 'num' ? s.num : [s.show];
    return { q: s.text + (s.svg || ''), a, show: s.show, why: s.why, hint: s.hint, say: s.say || s.text };
  }
  const nearPairs = (x, y, max) => [pair(y, x), pair(x + 1, y), pair(x - 1, y), pair(x, y + 1), pair(x, y - 1), pair(x + 1, y + 1), pair(x - 1, y - 1), pair(x + 1, y - 1), pair(x - 1, y + 1), pair(x + 2, y), pair(x - 2, y), pair(x, y + 2), pair(x, y - 2)].filter(p => { const [a, b] = p.match(/\d+/g).map(Number); return inR(a, max) && inR(b, max) && !/-/.test(p); });
  const pairs11 = p => (p.match(/\d+/g) || []).every(n => +n <= 10);
  const nums = (d, extra = []) => [d + 1, d - 1, d + 2, d - 2, ...extra].filter(v => v >= 1 && v !== d).map(String);

  /* ---------- read the point ---------- */
  function readQ(form) {
    let x, y; do { x = rnd(0, 10); y = rnd(0, 10); } while (x === y);
    const a = pair(x, y), where = x === 0 ? ' Its x-coordinate is 0, so it sits on the y-axis.' : y === 0 ? ' Its y-coordinate is 0, so it sits on the x-axis.' : '';
    return fin(form, { text: 'What are the coordinates of point P?', svg: plane({ pts: [{ x, y, l: 'P', cls: 'hi' }], label: 'A coordinate grid with one point, P' }), show: a, wrong: pickWrong(a, nearPairs(x, y, 10)),
      why: `Start at the origin (0, 0). Go right ${x}, then up ${y}. So P is at ${a}. The x-coordinate (right) always comes first.${where}`, hint: 'Count along the bottom first (that is x), then count up (that is y).' });
  }
  /* ---------- which point is at (x, y)? ---------- */
  function pickQ() {
    let x, y; do { x = rnd(0, 10); y = rnd(0, 10); } while (x === y);
    const used = [[x, y], [y, x]];
    while (used.length < 4) { const p = [rnd(0, 10), rnd(0, 10)]; if (!used.some(u => u[0] === p[0] && u[1] === p[1])) used.push(p); }
    const L = ['A', 'B', 'C', 'D'], at = shuffle(used).map((p, i) => ({ x: p[0], y: p[1], l: L[i] }));
    const right = at.find(p => p.x === x && p.y === y), swap = at.find(p => p.x === y && p.y === x), a = `Point ${right.l}`;
    return { q: `Which point is at ${pair(x, y)}?`, html: plane({ pts: at, label: 'A coordinate grid with four labeled points, A, B, C, and D' }), a, wrong: at.filter(p => p !== right).map(p => `Point ${p.l}`),
      why: `Go right ${x}, then up ${y}. Point ${right.l} is there. Point ${swap.l} is at ${pair(y, x)}: its x and y are swapped.`, hint: 'Go right first (x), then up (y). Do not swap them.', say: `Which point is at ${pair(x, y)}?` };
  }
  /* ---------- vocabulary: axes, origin, coordinates ---------- */
  function axisQ() { const r = axisQ0(); r.say = r.say || r.q; return r; }
  function axisQ0() {
    const v = rnd(0, 4), k = rnd(1, 10), m = rnd(1, 10), n = rnd(1, 10);
    if (v === 0) { const a = pair(0, k); return { q: 'Which ordered pair is on the y-axis?', a, wrong: pickWrong(a, [pair(k, 0), pair(m, n), pair(n, m), pair(k, k), pair(m + (m < 10 ? 1 : -1), n)]), why: `On the y-axis you have not moved right at all, so the x-coordinate is 0. ${a} is on it.`, hint: 'The y-axis is the up-and-down line. How far right is every point on it?' }; }
    if (v === 1) { const a = pair(k, 0); return { q: 'Which ordered pair is on the x-axis?', a, wrong: pickWrong(a, [pair(0, k), pair(m, n), pair(n, m), pair(k, k), pair(m, n + (n < 10 ? 1 : -1))]), why: `On the x-axis you have not moved up at all, so the y-coordinate is 0. ${a} is on it.`, hint: 'The x-axis is the flat line along the bottom. How far up is every point on it?' }; }
    if (v === 2) { return { q: 'Which ordered pair names the origin?', a: '(0, 0)', wrong: ['(0, 1)', '(1, 0)', '(1, 1)', '(0, 10)'], why: 'The origin is where the axes meet. You have gone right 0 and up 0, so it is (0, 0).', hint: 'The origin is the starting point of every trip on the grid.' }; }
    if (v === 3) { const x = rnd(1, 10); let y; do { y = rnd(1, 10); } while (y === x); const a = `Right ${x}, then up ${y}`; return { q: `Starting at the origin, how do you get to ${pair(x, y)}?`, a, wrong: [`Right ${y}, then up ${x}`, `Up ${x}, then right ${y}`, `Right ${x + y}`, `Up ${x + y}`], why: `The first number is how far to go right (x) and the second is how far to go up (y). For ${pair(x, y)}: right ${x}, then up ${y}.`, hint: 'The first number goes right. The second number goes up.' }; }
    let x = rnd(1, 10), y; do { y = rnd(1, 10); } while (y === x);
    const other = pickWrong(String(x), [y + 1, x + 1, x - 1, y - 1, x + 2, 10].filter(n => n >= 1 && n !== x && n !== y).map(String));
    return { q: `In the ordered pair ${pair(x, y)}, which number tells you how far to go right?`, a: String(x), wrong: [String(y), ...other.slice(0, 2)], why: `The first number is the x-coordinate, and x tells how far to go right. In ${pair(x, y)} that is ${x}.`, hint: 'x comes first and goes right. y comes second and goes up.' };
  }

  /* ---------- distances on a line ---------- */
  function distQ(form) {
    const horiz = Math.random() < 0.5, fixed = rnd(0, 10), p = rnd(0, 8), q = rnd(p + 2, 10), swap = Math.random() < 0.5;
    const lo = horiz ? [p, fixed] : [fixed, p], hi = horiz ? [q, fixed] : [fixed, q], A = swap ? hi : lo, B = swap ? lo : hi, d = q - p;
    const text = `How far apart are A ${pair(...A)} and B ${pair(...B)}?`;
    const svg = plane({ pts: [{ x: A[0], y: A[1], l: 'A', cls: 'hi' }, { x: B[0], y: B[1], l: 'B', cls: 'hi' }], segs: [[...A, ...B]], label: 'A coordinate grid with two points, A and B, joined by a line' });
    const same = horiz ? 'y' : 'x', other = horiz ? 'x' : 'y';
    return fin(form, { text, svg, num: d, show: String(d), wrong: nums(d, [p + q]).slice(0, 5), say: text,
      why: `Both points have ${same} = ${fixed}, so they are on the same ${horiz ? 'horizontal' : 'vertical'} line. Subtract the ${other}-coordinates: ${q} − ${p} = ${d}.`, hint: 'Find the coordinate that matches in both points. Then count, or subtract, the other coordinate.' });
  }

  /* ---------- shapes on the grid ---------- */
  function rectSpec() {
    const square = Math.random() < 0.4, w = rnd(2, 6); let h = square ? w : rnd(2, 6); if (!square && h === w) h = w === 6 ? 3 : w + 1;
    const x1 = rnd(0, 10 - w), y1 = rnd(0, 10 - h);
    return { square, w, h, x1, y1, x2: x1 + w, y2: y1 + h, V: [[x1, y1], [x1 + w, y1], [x1 + w, y1 + h], [x1, y1 + h]] };
  }
  function cornerQ(form) {
    const r = rectSpec(), i = rnd(0, 3), miss = r.V[i], seen = [1, 2, 3].map(k => r.V[(i + k) % 4]), shape = r.square ? 'square' : 'rectangle';
    const a = pair(...miss), [A, B, C] = seen, shareX = A[0] === miss[0] ? 'A' : 'C', shareY = shareX === 'A' ? 'C' : 'A';
    const text = `Three corners of a ${shape} are A ${pair(...A)}, B ${pair(...B)}, and C ${pair(...C)}. What are the coordinates of the fourth corner, D?`;
    const svg = plane({ pts: seen.map((p, k) => ({ x: p[0], y: p[1], l: 'ABC'[k], cls: 'hi' })), segs: [[...A, ...B], [...B, ...C]], label: `A coordinate grid with three corners, A, B, and C, of a ${shape}` });
    const wrongs = [pair(miss[1], miss[0]), pair(miss[0] + 1, miss[1]), pair(miss[0], miss[1] + 1), pair(miss[0] - 1, miss[1]), pair(miss[0], miss[1] - 1), pair(B[0], B[1] + 1)].filter(p => !/-/.test(p) && p !== a && pairs11(p));
    return fin(form, { text, svg, show: a, wrong: pickWrong(a, wrongs), say: text,
      why: `In this problem the sides of the ${shape} line up with the axes, so D has the same x as ${shareX} (${miss[0]}) and the same y as ${shareY} (${miss[1]}). D is ${a}.`, hint: 'Opposite sides are straight across from each other. Which corner has the same x? Which has the same y?' });
  }
  function perimQ(form) {
    const r = rectSpec(), P = 2 * (r.w + r.h), shape = r.square ? 'square' : 'rectangle';
    const text = `A ${shape} has corners ${r.V.map(v => pair(...v)).join(', ').replace(/, (\([^)]*\))$/, ', and $1')}. What is its perimeter?`;
    const svg = plane({ pts: r.V.map(v => ({ x: v[0], y: v[1], cls: 'hi' })), polys: [r.V], label: `A coordinate grid with a ${shape}` });
    return fin(form, { text, svg, num: P, show: String(P), wrong: [r.w * r.h, r.w + r.h, r.w + r.h + r.w, P + 2, P - 2, 2 * r.w].filter(v => v !== P && v > 0).map(String), say: text,
      why: `The width is ${r.x2} − ${r.x1} = ${r.w} and the height is ${r.y2} − ${r.y1} = ${r.h}. The perimeter is ${r.w} + ${r.h} + ${r.w} + ${r.h} = ${P}.`, hint: 'Find the width and the height first, then add all four sides.' });
  }

  /* ---------- patterns ---------- */
  function makePattern(limit) {
    for (let t = 0; t < 400; t++) {
      const times = Math.random() < 0.5, a = rnd(1, times ? 4 : 3), k = rnd(2, 3), c = rnd(1, 4);
      const A0 = 0, B0 = times ? 0 : c, bAdd = times ? a * k : a;
      const P = n => [A0 + n * a, B0 + n * bAdd];
      if (P(4)[0] > limit || P(4)[1] > limit) continue;
      if (times && bAdd === a) continue;
      return { times, a, k, c, bAdd, B0, P, rules: `Rule A: start at 0, add ${a}. Rule B: start at ${B0}, add ${bAdd}.` };
    }
    throw new Error('no pattern');
  }
  function patNextQ(form, limit = 20) {
    const p = makePattern(limit), shown = [0, 1, 2, 3].map(p.P), next = p.P(4), a = pair(...next), max = axisMax(Math.max(next[0], next[1]));
    const text = `${p.rules} The first ordered pairs (A, B) are ${shown.map(v => pair(...v)).join(', ').replace(/, (\([^)]*\))$/, ', and $1')}. What is the next ordered pair?`;
    const svg = plane({ max, pts: shown.map(v => ({ x: v[0], y: v[1], cls: 'hi' })), label: 'A coordinate grid with the first four ordered pairs of a pattern' });
    return fin(form, { text, svg, show: a, wrong: pickWrong(a, [pair(next[1], next[0]), pair(next[0], next[1] + p.a), pair(next[0] + p.a, next[1]), pair(next[0] + p.a, next[1] + p.bAdd), pair(next[0], next[1] - 1), pair(shown[3][0] + 1, shown[3][1] + 1)].filter(s => !/-/.test(s))), say: text,
      why: `Rule A adds ${p.a} each time: ${shown[3][0]} + ${p.a} = ${next[0]}. Rule B adds ${p.bAdd} each time: ${shown[3][1]} + ${p.bAdd} = ${next[1]}. The next ordered pair is ${a}.`, hint: 'Add the rule’s number to the last A number, and to the last B number.' });
  }
  const STATEMENTS = [
    ...[2, 3, 4, 5].map(v => ({ t: `${v} times as large as`, f: (A, B) => B === v * A })),
    ...[1, 2, 3, 4, 5, 6].map(v => ({ t: `${v} more than`, f: (A, B) => B === A + v })),
    { t: 'the same as', f: (A, B) => B === A }, ...[1, 2, 3].map(v => ({ t: `${v} less than`, f: (A, B) => B === A - v }))
  ];
  function patRelQ() {
    const p = makePattern(20), pairs = [1, 2, 3].map(p.P), right = STATEMENTS.find(s => s.t === (p.times ? `${p.k} times as large as` : `${p.c} more than`)), a = `${right.t} the A number`;
    const falseOnes = STATEMENTS.filter(s => !pairs.every(([A, B]) => s.f(A, B)) && s !== right).map(s => `${s.t} the A number`);
    const text = `${p.rules} Look at the ordered pairs ${pairs.map(v => pair(...v)).join(', ').replace(/, (\([^)]*\))$/, ', and $1')}. Each B number is ___ the A number next to it.`;
    return { q: text, a, wrong: shuffle(falseOnes).slice(0, 3), why: p.times ? `Rule B adds ${p.bAdd}, which is ${p.k} times the ${p.a} that Rule A adds, and both start at 0. So each B number is ${p.k} times as large as its A number (like ${pair(...pairs[0])}).` : `Both rules add ${p.a}, but Rule B starts ${p.c} higher. So each B number is ${p.c} more than its A number (like ${pair(...pairs[0])}).`, hint: 'Compare each B number with the A number beside it. Is it bigger by adding, or by multiplying?', say: text };
  }

  /* ---------- maps and word problems ---------- */
  const PLACES = ['School', 'Library', 'Park', 'Store', 'Pool', 'Farm', 'Bakery', 'Zoo', 'Lake', 'Bank'];
  function makeMap(opt = {}) {
    for (let t = 0; t < 300; t++) {
      const names = shuffle(PLACES).slice(0, 4), xs = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, 4), ys = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, 4);
      const pts = names.map((n, i) => ({ n, x: xs[i], y: ys[i] }));
      if (opt.line) { const horiz = Math.random() < 0.5; if (horiz) pts[1].y = pts[0].y; else pts[1].x = pts[0].x; if (pts[1].x === pts[0].x && pts[1].y === pts[0].y) continue; if (Math.abs(pts[1].x - pts[0].x) + Math.abs(pts[1].y - pts[0].y) < 2) continue; if (pts.some((p, i) => pts.some((q, j) => j > i && p.x === q.x && p.y === q.y))) continue; }
      return pts;
    }
    throw new Error('no map');
  }
  const mapSvg = (pts, extra = []) => plane({ pts: pts.map(p => ({ x: p.x, y: p.y, l: p.n, cls: 'hi' })).concat(extra), label: 'A grid map of a town with ' + pts.map(p => p.n).join(', ') });
  function placeAtQ() {
    const pts = makeMap(), t = pts[0], a = t.n;
    return { q: `Which place is at ${pair(t.x, t.y)}?`, html: mapSvg(shuffle(pts)), a, wrong: pts.slice(1).map(p => p.n), why: `Go right ${t.x}, then up ${t.y}. The ${t.n} is there.`, hint: 'Go right first (x), then up (y).', say: `Which place is at ${pair(t.x, t.y)}?` };
  }
  const movesText = (from, dx, dy) => [dx ? `${Math.abs(dx)} block${Math.abs(dx) === 1 ? '' : 's'} ${dx > 0 ? 'right' : 'left'}` : '', dy ? `${Math.abs(dy)} block${Math.abs(dy) === 1 ? '' : 's'} ${dy > 0 ? 'up' : 'down'}` : ''].filter(Boolean).join(' and ');
  function movesQ() {   // which place do you reach?
    const pts = makeMap(), A = pts[0], B = pts[1], dx = B.x - A.x, dy = B.y - A.y;
    return { q: `Start at the ${A.n} ${pair(A.x, A.y)}. Go ${movesText(A, dx, dy)}. Which place do you reach?`, html: mapSvg(shuffle(pts)), a: B.n, wrong: pts.filter(p => p !== B).map(p => p.n),
      why: `${dx ? `${dx > 0 ? 'Right' : 'Left'} changes x: ${A.x} ${dx > 0 ? '+' : '−'} ${Math.abs(dx)} = ${B.x}. ` : ''}${dy ? `${dy > 0 ? 'Up' : 'Down'} changes y: ${A.y} ${dy > 0 ? '+' : '−'} ${Math.abs(dy)} = ${B.y}. ` : ''}That is ${pair(B.x, B.y)}, the ${B.n}.`, hint: 'Change x for left and right moves. Change y for up and down moves.', say: `Start at the ${A.n}. Go ${movesText(A, dx, dy)}. Which place do you reach?` };
  }
  function coordOfQ(form) {
    const pts = makeMap(), t = pts[0], a = pair(t.x, t.y);
    return fin(form, { text: `What are the coordinates of the ${t.n}?`, svg: mapSvg(shuffle(pts)), show: a, wrong: pickWrong(a, nearPairs(t.x, t.y, 10)), why: `Count right ${t.x} and up ${t.y}. The ${t.n} is at ${a}.`, hint: 'Count along the bottom first, then up.' });
  }
  function endQ(form) {   // where do you end up? (typed pair)
    const pts = makeMap(), A = pts[0]; let dx, dy;
    do { dx = rnd(-6, 6); dy = rnd(-6, 6); } while (dx === 0 || dy === 0 || !inR(A.x + dx, 10) || !inR(A.y + dy, 10));
    const a = pair(A.x + dx, A.y + dy), text = `Start at the ${A.n} ${pair(A.x, A.y)}. Go ${movesText(A, dx, dy)}. What are the coordinates of where you end up?`;
    return fin(form, { text, svg: mapSvg(shuffle(pts)), show: a, wrong: pickWrong(a, nearPairs(A.x + dx, A.y + dy, 10)), say: text, why: `Right and left change x; up and down change y. ${A.x} ${dx >= 0 ? '+' : '−'} ${Math.abs(dx)} = ${A.x + dx}, and ${A.y} ${dy >= 0 ? '+' : '−'} ${Math.abs(dy)} = ${A.y + dy}. You end up at ${a}.`, hint: 'Left or right changes x. Up or down changes y.' });
  }
  function blocksQ(form) {
    const pts = makeMap({ line: true }), A = pts[0], B = pts[1], d = Math.abs(A.x - B.x) + Math.abs(A.y - B.y), horiz = A.y === B.y, p = Math.min(horiz ? A.x : A.y, horiz ? B.x : B.y), q = Math.max(horiz ? A.x : A.y, horiz ? B.x : B.y);
    const text = `How many blocks is it from the ${A.n} ${pair(A.x, A.y)} to the ${B.n} ${pair(B.x, B.y)}? Each grid square is one block.`;
    return fin(form, { text, svg: mapSvg(shuffle(pts)), num: d, show: String(d), wrong: nums(d, [p + q]), say: text,
      why: `Both places have ${horiz ? 'y' : 'x'} = ${horiz ? A.y : A.x}, so they are on one straight line. Subtract the ${horiz ? 'x' : 'y'}-coordinates: ${q} − ${p} = ${d} blocks.`, hint: 'Find the coordinate that matches. Subtract the other one.' });
  }

  /* ---------- what the plot tool asks for ---------- */
  function plotTargets(n = 10) {
    const out = [], seen = new Set();
    while (out.length < n) {
      const x = rnd(0, 10), y = rnd(0, 10), k = x + ',' + y;
      if (seen.has(k) || (x === 0 && y === 0) || (x !== 0 && y !== 0 && Math.random() < 0.12 && out.length > 2 && false)) continue;
      if (x === y && Math.random() < 0.6) continue;
      seen.add(k);
      out.push({ x, y, max: 10, pts: [], text: `Tap the point ${pair(x, y)}.`, say: `Tap the point ${pair(x, y)}.`, why: `Go right ${x}, then up ${y}.${x === 0 ? ' The x-coordinate is 0, so the point is on the y-axis.' : y === 0 ? ' The y-coordinate is 0, so the point is on the x-axis.' : ''}`, hint: 'Go right first (x), then up (y).' });
    }
    return out;
  }
  function patternTargets(n = 10) {
    const out = [], seen = new Set();
    for (let t = 0; out.length < n && t < 200; t++) {
      const p = makePattern(12), next = p.P(4), key = p.rules; if (seen.has(key)) continue; seen.add(key);
      const shown = [0, 1, 2, 3].map(p.P);
      out.push({ x: next[0], y: next[1], max: 12, pts: shown.map(v => ({ x: v[0], y: v[1], cls: 'hi' })), text: `${p.rules} The first ordered pairs (A, B) are ${shown.map(v => pair(...v)).join(', ').replace(/, (\([^)]*\))$/, ', and $1')}. Tap the next ordered pair.`,
        say: `${p.rules} Tap the next ordered pair.`, why: `Rule A adds ${p.a}: ${shown[3][0]} + ${p.a} = ${next[0]}. Rule B adds ${p.bAdd}: ${shown[3][1]} + ${p.bAdd} = ${next[1]}. The next pair is ${pair(...next)}.`, hint: 'Add the rule’s number to the last A number (x) and to the last B number (y).' });
    }
    return out;
  }

  const COORDGEN = { plane, hit, geom, axisMax, pair, readQ, pickQ, axisQ, distQ, cornerQ, perimQ, patNextQ, patRelQ, placeAtQ, movesQ, coordOfQ, endQ, blocksQ, plotTargets, patternTargets, makePattern, STATEMENTS, PLACES, W, M };
  if (typeof module !== 'undefined') module.exports = COORDGEN; else root.COORDGEN = COORDGEN;
})(typeof window !== 'undefined' ? window : globalThis);
