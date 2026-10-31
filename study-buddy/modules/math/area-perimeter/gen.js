/* Area and Perimeter (3rd grade): pictures and problem generators. Every problem is made fresh, with its answer, a hint, and an explanation.
   Sides are whole numbers up to 12. Pictures are inline SVG that carries its own data (data-* attributes), so the generator check can read
   a picture back and solve it again without trusting this file. Runs in the browser, and in Node for the check (_dev/tests/gen_check_areaperim.mjs). */
(function (root) {
  'use strict';
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fmt = n => n.toLocaleString('en-US');
  const sq = n => n === 1 ? 'square unit' : 'square units', un = n => n === 1 ? 'unit' : 'units';

  /* ---------- pictures ---------- */
  const svg = (w, h, label, attrs, body) => `<svg class="apf" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}" ${attrs}>${body}</svg>`;
  const txt = (x, y, s, cls = 'lb') => `<text class="${cls}" x="${Math.round(x)}" y="${Math.round(y)}">${s}</text>`;

  /* a grid of unit squares; cells is a list of [row, col] that are shaded (null = the whole rectangle) */
  function gridPic(wc, hc, cells) {
    const c = Math.min(36, Math.floor(340 / wc), Math.floor(210 / hc)), M = 14, all = cells || Array.from({ length: wc * hc }, (_, i) => [Math.floor(i / wc), i % wc]);
    const on = new Set(all.map(p => p.join(',')));
    let body = '';
    for (let r = 0; r < hc; r++) for (let k = 0; k < wc; k++) body += `<rect class="cell ${on.has(r + ',' + k) ? 'on' : 'off'}" x="${M + k * c}" y="${M + r * c}" width="${c}" height="${c}"/>`;
    return svg(wc * c + 2 * M, hc * c + 2 * M, `A grid of unit squares, ${wc} wide and ${hc} tall. ${on.size} squares are shaded.`, `data-kind="grid" data-w="${wc}" data-h="${hc}" data-cells="${all.map(p => p.join(',')).join(';')}"`, body);
  }
  /* a rectangle with labels on its sides (a label can be '' for none or '?' for the one to find); info goes in a line underneath */
  function rectPic(w, h, lab, info) {
    const u = Math.min(30, Math.floor(300 / w), Math.floor(160 / h)), X = 44, Y = 30, RW = w * u, RH = h * u, extra = info ? 30 : 0;
    const L = Object.assign({ top: '', right: '', bottom: '', left: '' }, lab);
    let body = `<rect class="shape" x="${X}" y="${Y}" width="${RW}" height="${RH}"/>`;
    if (L.top !== '') body += txt(X + RW / 2, Y - 9, L.top);
    if (L.bottom !== '') body += txt(X + RW / 2, Y + RH + 23, L.bottom);
    if (L.left !== '') body += txt(X - 18, Y + RH / 2 + 6, L.left);
    if (L.right !== '') body += txt(X + RW + 20, Y + RH / 2 + 6, L.right);
    if (info) body += txt(X + RW / 2, Y + RH + 52, info, 'lb info');
    const said = ['top', 'right', 'bottom', 'left'].filter(k => L[k] !== '').map(k => `${k} ${L[k]}`).join(', ');
    return svg(X + RW + 40, Y + RH + 36 + extra, `A rectangle. Side labels: ${said || 'none'}.${info ? ' ' + info + '.' : ''}`, `data-kind="rect" data-w="${w}" data-h="${h}" data-lab="${L.top}|${L.right}|${L.bottom}|${L.left}"`, body);
  }
  /* a triangle, four-sided, or five-sided shape with a label on every side (not drawn to scale); a '?' marks the side to find */
  const TEMPLATES = { 3: [[150, 24], [272, 168], [28, 168]], 4: [[44, 30], [256, 52], [276, 164], [28, 172]], 5: [[150, 18], [274, 84], [230, 176], [70, 176], [26, 84]] };
  function polyPic(sides, info) {
    const V = TEMPLATES[sides.length], n = V.length, cx = V.reduce((s, p) => s + p[0], 0) / n, cy = V.reduce((s, p) => s + p[1], 0) / n;
    let body = `<polygon class="shape" points="${V.map(p => p.join(',')).join(' ')}"/>`;
    sides.forEach((s, i) => {
      const a = V[i], b = V[(i + 1) % n], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = mx - cx, dy = my - cy, d = Math.hypot(dx, dy) || 1;
      body += txt(mx + dx / d * 20, my + dy / d * 20 + 6, s);
    });
    if (info) body += txt(150, 214, info, 'lb info');
    return svg(300, info ? 226 : 196, `A shape with ${n} sides, not drawn to scale. Side lengths in order: ${sides.join(', ')}.${info ? ' ' + info + '.' : ''}`, `data-kind="poly" data-sides="${sides.join(',')}"`, body);
  }
  /* an L-shape made of two rectangles, every side labelled: the outline goes (0,0) (w2,0) (w2,h2) (W,h2) (W,H) (0,H) */
  function lPic(W, H, w2, h1) {
    const h2 = H - h1, u = Math.min(26, Math.floor(300 / W), Math.floor(190 / H)), X = 40, Y = 30, P = [[0, 0], [w2, 0], [w2, h2], [W, h2], [W, H], [0, H]];
    const px = p => `${X + p[0] * u},${Y + p[1] * u}`;
    let body = `<polygon class="shape" points="${P.map(px).join(' ')}"/>`;
    body += txt(X + w2 * u / 2, Y - 9, w2) + txt(X + w2 * u + 16, Y + h2 * u / 2 + 6, h2) + txt(X + (w2 + W) * u / 2, Y + h2 * u - 9, W - w2) + txt(X + W * u + 18, Y + (h2 + H) * u / 2 + 6, h1) + txt(X + W * u / 2, Y + H * u + 23, W) + txt(X - 18, Y + H * u / 2 + 6, H);
    return svg(X + W * u + 40, Y + H * u + 36, `An L-shaped figure made of two rectangles. Sides in order around it: ${w2}, ${h2}, ${W - w2}, ${h1}, ${W}, ${H}.`, `data-kind="L" data-pts="${P.map(p => p.join(',')).join(' ')}"`, body);
  }
  /* two rectangles side by side, A and B, each labelled with its length (top) and width (left) */
  function twoPic(a, b) {   // a and b are [length, width]
    const u = Math.min(24, Math.floor(280 / (a[0] + b[0])), Math.floor(150 / Math.max(a[1], b[1]))), Y = 40, X1 = 40, X2 = X1 + a[0] * u + 64;
    let body = '';
    [[a, X1, 'A'], [b, X2, 'B']].forEach(([d, x, name]) => {
      body += `<rect class="shape" x="${x}" y="${Y}" width="${d[0] * u}" height="${d[1] * u}"/>` + txt(x + d[0] * u / 2, Y - 22, 'Rectangle ' + name, 'lb nm') + txt(x + d[0] * u / 2, Y - 6, d[0]) + txt(x - 16, Y + d[1] * u / 2 + 6, d[1]);
    });
    return svg(X2 + b[0] * u + 24, Y + Math.max(a[1], b[1]) * u + 16, `Rectangle A is ${a[0]} by ${a[1]}. Rectangle B is ${b[0]} by ${b[1]}.`, `data-kind="two" data-a="${a.join(',')}" data-b="${b.join(',')}"`, body);
  }

  /* ---------- helpers for the problems ---------- */
  /* three or more different wrong numbers (never the answer, never below 1), from the believable mistakes first */
  function wrongNums(ans, tries) {
    const out = [];
    [...tries, ans + 1, ans - 1, ans + 2, ans - 2, ans + 10, ans + 3, ans - 3, ans * 2].forEach(x => { if (Number.isInteger(x) && x >= 1 && x !== ans && !out.includes(x)) out.push(x); });
    return out.slice(0, 3);
  }
  /* a problem: text (the words), pic (an SVG or ''), a (the number), unit (a word like 'square units'), wrong (numbers), why, hint, say */
  function prob(o) {
    const show = `${fmt(o.a)} ${o.unitFor ? o.unitFor(o.a) : o.unit}`;
    return Object.assign({ show, wrongShow: wrongNums(o.a, o.tries || []).map(n => `${fmt(n)} ${o.wrongUnit ? (o.unitFor ? o.unitFor(n) : o.wrongUnit) : (o.unitFor ? o.unitFor(n) : o.unit)}`) }, o);
  }
  const AREA = n => sq(n), PERIM = n => un(n);

  /* ---------- count the squares ---------- */
  function polyomino(n) {   // a connected shape of n squares in a 6 x 5 grid
    for (let t = 0; t < 200; t++) {
      const cells = [[rnd(0, 4), rnd(0, 5)]], has = (r, c) => cells.some(p => p[0] === r && p[1] === c);
      while (cells.length < n) {
        const [r, c] = pick(cells), [dr, dc] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]), nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < 5 && nc >= 0 && nc < 6 && !has(nr, nc)) cells.push([nr, nc]);
      }
      const rows = new Set(cells.map(p => p[0])).size, cols = new Set(cells.map(p => p[1])).size;
      if (rows >= 3 && cols >= 3) return cells;
    }
    return [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0], [2, 1]];
  }
  const boundary = cells => { const s = new Set(cells.map(p => p.join(','))); let e = 0; cells.forEach(([r, c]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { if (!s.has((r + a) + ',' + (c + b))) e++; })); return e; };
  function countQ(form) {
    form = form || pick(['rect', 'shape']);
    if (form === 'rect') {
      const w = rnd(2, 9), h = rnd(2, 6), a = w * h;
      return prob({ k: 'count-rect', text: 'Each square is 1 square unit. What is the area of the shaded rectangle?', pic: gridPic(w, h, null), a, unitFor: AREA, tries: [2 * (w + h), w + h, a + w, a - h],
        why: `Count the squares: ${h} rows of ${w} squares is ${w} × ${h} = ${a}. The area is ${a} square units.`, hint: 'Count the squares in one row, then count the rows. Or multiply.', say: `Each square is 1 square unit. What is the area of the shaded rectangle? It is ${w} squares wide and ${h} squares tall.` });
    }
    const n = rnd(6, 15), cells = polyomino(n), b = boundary(cells);
    return prob({ k: 'count-shape', text: 'Each square is 1 square unit. What is the area of the shaded shape?', pic: gridPic(6, 5, cells), a: n, unitFor: AREA, tries: [b, n + 1, n - 1],
      why: `Count every shaded square, once each. There are ${n}. The area is ${n} square units.`, hint: 'Count the shaded squares one at a time. Do not count the empty ones.', say: `Each square is 1 square unit. What is the area of the shaded shape? It has ${n} shaded squares.` });
  }

  /* ---------- area of rectangles ---------- */
  const ROOMS = [['floor', 'A rectangular floor'], ['poster', 'A rectangular poster'], ['rug', 'A rectangular rug'], ['garden', 'A rectangular garden bed']];
  function areaQ(form) {
    form = form || pick(['labels', 'words', 'rows']);
    const w = rnd(2, 12), h = rnd(2, 9), a = w * h;
    if (form === 'labels') {
      return prob({ k: 'area-labels', text: 'What is the area of this rectangle?', pic: rectPic(w, h, { top: w, left: h }), a, unitFor: AREA, tries: [2 * (w + h), w + h, a + w, a - h],
        why: `Area = length × width = ${w} × ${h} = ${a}. The area is ${a} square units.`, hint: 'Multiply the length by the width.', say: `What is the area of this rectangle? It is ${w} long and ${h} wide.` });
    }
    if (form === 'rows') {
      const r = rnd(2, 9), c = rnd(3, 10), t = r * c;
      return prob({ k: 'area-rows', text: `Square tiles that are each 1 square unit cover a rectangle in ${r} rows with ${c} tiles in each row. What is the area?`, pic: '', a: t, unitFor: AREA, tries: [r + c, 2 * (r + c), t + c, t - r],
        why: `${r} rows of ${c} tiles: ${r} × ${c} = ${t}. The area is ${t} square units.`, hint: 'Rows times tiles in each row.', say: `Square tiles that are each 1 square unit cover a rectangle in ${r} rows with ${c} tiles in each row. What is the area?` });
    }
    return prob({ k: 'area-words', text: `A rectangle is ${w} units long and ${h} units wide. What is its area?`, pic: '', a, unitFor: AREA, tries: [2 * (w + h), w + h, a + w, a - h],
      why: `Area = length × width = ${w} × ${h} = ${a}. The area is ${a} square units.`, hint: 'Multiply the length by the width.', say: `A rectangle is ${w} units long and ${h} units wide. What is its area?` });
  }

  /* ---------- perimeter ---------- */
  function polySides(n) {   // side lengths for a triangle, quadrilateral, or pentagon (a triangle needs the two small sides to add up to more than the biggest)
    for (let t = 0; t < 100; t++) {
      const s = Array.from({ length: n }, () => rnd(n === 5 ? 2 : 3, n === 5 ? 9 : 12)), m = Math.max(...s), tot = s.reduce((x, y) => x + y, 0);
      if (tot - m > m) return s;
    }
    return n === 3 ? [5, 6, 7] : n === 4 ? [5, 6, 7, 8] : [4, 5, 6, 5, 4];
  }
  function perimQ(form) {
    form = form || pick(['rect', 'rect4', 'poly', 'poly', 'L', 'square']);
    if (form === 'rect') {
      const w = rnd(3, 12), h = rnd(2, 9), p = 2 * (w + h);
      return prob({ k: 'perim-rect', text: 'What is the perimeter of this rectangle?', pic: rectPic(w, h, { top: w, left: h }), a: p, unitFor: PERIM, tries: [w + h, w * h, w + h + w, p - h],
        why: `A rectangle has two sides of ${w} and two sides of ${h}. ${w} + ${h} + ${w} + ${h} = ${p}. The perimeter is ${p} units.`, hint: 'The opposite sides are equal. Add all four sides.', say: `What is the perimeter of this rectangle? Two sides are ${w} long and two sides are ${h} long.` });
    }
    if (form === 'rect4') {
      const w = rnd(3, 12), h = rnd(2, 9), p = 2 * (w + h);
      return prob({ k: 'perim-rect4', text: 'What is the perimeter of this rectangle?', pic: rectPic(w, h, { top: w, right: h, bottom: w, left: h }), a: p, unitFor: PERIM, tries: [w + h, w * h, p - h, p - w],
        why: `Add all four sides: ${w} + ${h} + ${w} + ${h} = ${p}. The perimeter is ${p} units.`, hint: 'Perimeter is the distance around. Add all four sides.', say: `What is the perimeter of this rectangle? The sides are ${w}, ${h}, ${w}, and ${h}.` });
    }
    if (form === 'poly') {
      const n = pick([3, 4, 5]), s = polySides(n), p = s.reduce((x, y) => x + y, 0), name = { 3: 'triangle', 4: 'four-sided shape', 5: 'five-sided shape' }[n];
      return prob({ k: 'perim-poly', text: `This ${name} is not drawn to scale. What is its perimeter?`, pic: polyPic(s), a: p, unitFor: PERIM, tries: [p - s[0], p - Math.max(...s), s[0] + s[1], p + s[0]],
        why: `Add every side: ${s.join(' + ')} = ${p}. The perimeter is ${p} units.`, hint: 'Add all of the sides. Check that you used every one.', say: `What is the perimeter of this ${name}? Its sides are ${s.join(', ')}.` });
    }
    if (form === 'L') {
      const W = rnd(5, 12), H = rnd(5, 10), w2 = rnd(2, W - 2), h1 = rnd(2, H - 2), s = [w2, H - h1, W - w2, h1, W, H], p = s.reduce((x, y) => x + y, 0);
      return prob({ k: 'perim-L', text: 'What is the perimeter of this shape?', pic: lPic(W, H, w2, h1), a: p, unitFor: PERIM, tries: [2 * (W + H) - 2, p - W, W + H, W * H],
        why: `Add all six sides: ${s.join(' + ')} = ${p}. The perimeter is ${p} units.`, hint: 'Go all the way around the shape and add every side.', say: `What is the perimeter of this shape? The sides are ${s.join(', ')}.` });
    }
    const s = rnd(2, 12), p = 4 * s;
    return prob({ k: 'perim-square', text: `A square has sides that are each ${s} units long. What is its perimeter?`, pic: '', a: p, unitFor: PERIM, tries: [s * s, 2 * s, 3 * s, s + 4],
      why: `A square has 4 equal sides: ${s} + ${s} + ${s} + ${s} = ${p}, or 4 × ${s} = ${p}. The perimeter is ${p} units.`, hint: 'A square has four equal sides.', say: `A square has sides that are each ${s} units long. What is its perimeter?` });
  }

  /* ---------- missing sides ---------- */
  function missingQ(form) {
    form = form || pick(['area', 'area', 'perim', 'perim', 'tri']);
    if (form === 'area') {
      const t = rnd(2, 12), s = rnd(2, 9), a = t * s, flip = Math.random() < 0.5;
      return prob({ k: 'missing-area', text: `The area of this rectangle is ${a} square units. One side is ${s} units. How long is the side marked ?`, pic: rectPic(flip ? t : s, flip ? s : t, flip ? { top: '?', left: s } : { top: s, left: '?' }, `Area = ${a} square units`), a: t, unitFor: PERIM, tries: [a - s, a + s, s * s, t + 1],
        why: `Area = length × width, so ${s} × ? = ${a}. ${a} ÷ ${s} = ${t}. The side is ${t} units.`, hint: `Think: ${s} times what number makes ${a}? Divide.`, say: `The area of this rectangle is ${a} square units. One side is ${s} units. How long is the other side?` });
    }
    if (form === 'perim') {
      const t = rnd(2, 10), s = rnd(2, 10), p = 2 * (s + t);
      return prob({ k: 'missing-perim', text: `The perimeter of this rectangle is ${p} units. One side is ${s} units. How long is the side marked ?`, pic: rectPic(Math.max(s, t), Math.min(s, t), s >= t ? { top: s, left: '?' } : { top: '?', left: s }, `Perimeter = ${p} units`), a: t, unitFor: PERIM, tries: [p - s, p / 2, p - 2 * s, s + t + 1],
        why: `The two equal sides of ${s} use ${s} + ${s} = ${2 * s}. ${p} − ${2 * s} = ${p - 2 * s} is left for the other two sides, so each is ${p - 2 * s} ÷ 2 = ${t}. The side is ${t} units.`, hint: 'Half of the perimeter is length + width. Subtract the side you know.', say: `The perimeter of this rectangle is ${p} units. One side is ${s} units. How long is the other side?` });
    }
    const sides = polySides(3), idx = rnd(0, 2), p = sides.reduce((x, y) => x + y, 0), ans = sides[idx], shown = sides.map((x, i) => i === idx ? '?' : x), known = sides.filter((x, i) => i !== idx);
    return prob({ k: 'missing-tri', text: `The perimeter of this triangle is ${p} units. How long is the side marked ?`, pic: polyPic(shown, `Perimeter = ${p} units`), a: ans, unitFor: PERIM, tries: [p - known[0], known[0] + known[1], p - ans - 1, p],
      why: `The two known sides add up to ${known[0]} + ${known[1]} = ${known[0] + known[1]}. ${p} − ${known[0] + known[1]} = ${ans}. The side is ${ans} units.`, hint: 'Add the sides you know. Then subtract that from the perimeter.', say: `The perimeter of this triangle is ${p} units. Two sides are ${known[0]} and ${known[1]}. How long is the third side?` });
  }

  /* ---------- same perimeter, different area (and the other way round) ---------- */
  const dims = d => `${d[0]} units by ${d[1]} units`;
  const AREAS = { 12: [[2, 6], [3, 4], [1, 12]], 16: [[2, 8], [4, 4]], 18: [[2, 9], [3, 6]], 20: [[2, 10], [4, 5]], 24: [[2, 12], [3, 8], [4, 6]], 30: [[3, 10], [5, 6]], 36: [[3, 12], [4, 9], [6, 6]], 48: [[4, 12], [6, 8]] };
  function compareQ(form) {
    form = form || pick(['sameP', 'sameA', 'pickP', 'pickA']);
    const out = (right, wrongs, text, pic, why, hint, say, extra) => Object.assign({ k: 'compare-' + form, text, pic, a: 0, show: right, wrongShow: wrongs, why, hint, say, textAnswer: true }, extra || {});
    if (form === 'sameP') {
      const P = pick([12, 14, 16, 18, 20, 22, 24]), half = P / 2, opts = []; for (let a = 1; a < half / 1; a++) { const b = half - a; if (a <= b && b <= 12) opts.push([b, a]); }
      const [A, B] = shuffle(opts).slice(0, 2), areaA = A[0] * A[1], areaB = B[0] * B[1];
      const right = areaA > areaB ? 'Rectangle A' : 'Rectangle B';
      return out(right, ['Rectangle ' + (right === 'Rectangle A' ? 'B' : 'A'), 'They have the same area'], `Rectangle A is ${dims(A)}. Rectangle B is ${dims(B)}. They have the same perimeter, ${P} units. Which has the greater area?`, twoPic(A, B),
        `Rectangle A: ${A[0]} × ${A[1]} = ${areaA} square units. Rectangle B: ${B[0]} × ${B[1]} = ${areaB} square units. ${right} has the greater area. Rectangles with the same perimeter can have different areas; the one closer to a square holds more.`, 'Find the area of each rectangle by multiplying. Then compare.', `Rectangle A is ${dims(A)}. Rectangle B is ${dims(B)}. They have the same perimeter. Which has the greater area?`, { pair: [A, B] });
    }
    if (form === 'sameA') {
      const area = pick(Object.keys(AREAS).map(Number));
      const set = shuffle(AREAS[area].filter(d => d[0] * d[1] === area)).slice(0, 2), A = set[0], B = set[1], pA = 2 * (A[0] + A[1]), pB = 2 * (B[0] + B[1]);
      const right = pA > pB ? 'Rectangle A' : 'Rectangle B';
      return out(right, ['Rectangle ' + (right === 'Rectangle A' ? 'B' : 'A'), 'They have the same perimeter'], `Rectangle A is ${dims(A)}. Rectangle B is ${dims(B)}. They have the same area, ${area} square units. Which has the greater perimeter?`, twoPic(A, B),
        `Rectangle A: ${A[0]} + ${A[1]} + ${A[0]} + ${A[1]} = ${pA} units. Rectangle B: ${B[0]} + ${B[1]} + ${B[0]} + ${B[1]} = ${pB} units. ${right} has the greater perimeter. The long, thin rectangle has more distance around.`, 'Find the perimeter of each rectangle. Then compare.', `Rectangle A is ${dims(A)}. Rectangle B is ${dims(B)}. They have the same area. Which has the greater perimeter?`, { pair: [A, B] });
    }
    const wantP = form === 'pickP', seen = new Set(), opts = [];
    const target = wantP ? pick([12, 14, 16, 18, 20, 22, 24, 28]) : pick(Object.keys(AREAS).map(Number)), right = wantP ? (() => { const a = rnd(2, Math.min(9, target / 2 - 2)); return [target / 2 - a, a]; })() : pick(AREAS[target]);
    const measure = d => wantP ? 2 * (d[0] + d[1]) : d[0] * d[1];
    seen.add(measure(right));
    for (let t = 0; t < 200 && opts.length < 3; t++) { const d = [rnd(3, 12), rnd(2, 9)], m = measure(d); if (!seen.has(m) && m !== target) { seen.add(m); opts.push(d); } }
    const s = d => `${d[0]} units by ${d[1]} units`;
    return out(s(right), opts.map(s), wantP ? `Which rectangle has a perimeter of ${target} units?` : `Which rectangle has an area of ${target} square units?`, '',
      wantP ? `${right[0]} + ${right[1]} + ${right[0]} + ${right[1]} = ${target}. A rectangle ${s(right)} has a perimeter of ${target} units.` : `${right[0]} × ${right[1]} = ${target}. A rectangle ${s(right)} has an area of ${target} square units.`,
      wantP ? 'Add all four sides of each rectangle, or double length plus width.' : 'Multiply the two sides of each rectangle.', wantP ? `Which rectangle has a perimeter of ${target} units?` : `Which rectangle has an area of ${target} square units?`, { target, choices: [right, ...opts] });
  }

  /* ---------- shapes made of rectangles ---------- */
  function compositeQ(form) {
    form = form || pick(['L', 'L', 'two']);
    if (form === 'L') {
      const W = rnd(4, 12), H = rnd(4, 10), w2 = rnd(1, W - 1), h1 = rnd(1, H - 1), h2 = H - h1, a = W * h1 + w2 * h2;
      return prob({ k: 'composite-L', text: 'This shape is made of two rectangles. What is its area?', pic: lPic(W, H, w2, h1), a, unitFor: AREA, tries: [W * H, 2 * (W + H), W * h1, w2 * h2, W * H - (W - w2) * h1],
        why: `Split the shape into two rectangles. The bottom one is ${W} × ${h1} = ${W * h1}. The top one is ${w2} × ${h2} = ${w2 * h2}. Add: ${W * h1} + ${w2 * h2} = ${a}. The area is ${a} square units.`, hint: 'Split the shape into two rectangles. Find each area. Then add.', say: `This shape is made of two rectangles. What is its area? The sides around it are ${w2}, ${h2}, ${W - w2}, ${h1}, ${W}, ${H}.` });
    }
    const a1 = [rnd(2, 9), rnd(2, 6)], a2 = [rnd(2, 8), rnd(2, 6)], t1 = a1[0] * a1[1], t2 = a2[0] * a2[1], a = t1 + t2;
    return prob({ k: 'composite-two', text: `A shape is made of two rectangles that do not overlap. One is ${a1[0]} units by ${a1[1]} units. The other is ${a2[0]} units by ${a2[1]} units. What is the total area?`, pic: '', a, unitFor: AREA, tries: [a1[0] * a2[0] * a1[1] * a2[1] > 400 ? t1 : Math.abs(t1 - t2) + 0, a1[0] + a1[1] + a2[0] + a2[1], t1, t2],
      why: `The first rectangle: ${a1[0]} × ${a1[1]} = ${t1}. The second: ${a2[0]} × ${a2[1]} = ${t2}. Add: ${t1} + ${t2} = ${a}. The total area is ${a} square units.`, hint: 'Find the area of each rectangle, then add them.', say: `A shape is made of two rectangles that do not overlap. One is ${a1[0]} by ${a1[1]}. The other is ${a2[0]} by ${a2[1]}. What is the total area?` });
  }

  /* ---------- word problems ---------- */
  const NAMES = ['Mia', 'Ben', 'Ana', 'Leo', 'Zoe', 'Sam', 'Ivy', 'Max'];
  const WORDS = [
    () => { const l = rnd(4, 12), w = rnd(3, 9), p = 2 * (l + w); return { k: 'w-fence', text: `A rectangular garden is ${l} meters long and ${w} meters wide. How many meters of fence go around it?`, a: p, unitFor: n => n === 1 ? 'meter' : 'meters', tries: [l * w, l + w, p - w], why: `Fence goes around the edge, so find the perimeter: ${l} + ${w} + ${l} + ${w} = ${p}. ${p} meters of fence.`, hint: 'Fence goes around the garden. That is the perimeter.' }; },
    () => { const l = rnd(4, 12), w = rnd(3, 9), a = l * w; return { k: 'w-carpet', text: `A rectangular room is ${l} feet long and ${w} feet wide. How many square feet of carpet cover the floor?`, a, unitFor: n => n === 1 ? 'square foot' : 'square feet', tries: [2 * (l + w), l + w, a + l], why: `Carpet covers the floor, so find the area: ${l} × ${w} = ${a}. ${a} square feet.`, hint: 'Carpet covers the whole floor. That is the area.' }; },
    () => { const l = rnd(5, 12), w = rnd(3, 8), a = l * w; return { k: 'w-poster', text: `A poster is ${l} inches long and ${w} inches wide. What is its area in square inches?`, a, unitFor: n => n === 1 ? 'square inch' : 'square inches', tries: [2 * (l + w), l + w, a - w], why: `Area = length × width = ${l} × ${w} = ${a}. ${a} square inches.`, hint: 'Multiply the length by the width.' }; },
    () => { const nm = pick(NAMES), l = rnd(5, 12), w = rnd(3, 9), p = 2 * (l + w); return { k: 'w-ribbon', text: `${nm} glues ribbon around the edge of a rectangular card that is ${l} centimeters long and ${w} centimeters wide. How many centimeters of ribbon does ${nm} need?`, a: p, unitFor: n => n === 1 ? 'centimeter' : 'centimeters', tries: [l * w, l + w, p - l], why: `Ribbon goes around the edge, so find the perimeter: ${l} + ${w} + ${l} + ${w} = ${p}. ${p} centimeters of ribbon.`, hint: 'Ribbon around the edge is the perimeter.' }; },
    () => { const r = rnd(3, 9), c = rnd(4, 10), t = r * c; return { k: 'w-tiles', text: `A floor needs ${r} rows of square tiles with ${c} tiles in each row. How many tiles are needed?`, a: t, unitFor: n => n === 1 ? 'tile' : 'tiles', tries: [r + c, 2 * (r + c), t + c], why: `${r} rows of ${c}: ${r} × ${c} = ${t}. ${t} tiles.`, hint: 'Rows times tiles in each row.' }; },
    () => { const w = rnd(3, 9), l = rnd(4, 12), a = l * w; return { k: 'w-rug', text: `A rectangular rug has an area of ${a} square feet. It is ${w} feet wide. How many feet long is it?`, a: l, unitFor: n => n === 1 ? 'foot' : 'feet', tries: [a - w, a + w, w * w], why: `Area = length × width, so ? × ${w} = ${a}. ${a} ÷ ${w} = ${l}. The rug is ${l} feet long.`, hint: `What number times ${w} makes ${a}? Divide.` }; },
    () => { const s = rnd(3, 10), t = rnd(3, 10), p = 2 * (s + t); return { k: 'w-pen', text: `A fence around a rectangular pen is ${p} meters long in all. One side of the pen is ${s} meters. How long is the side next to it?`, a: t, unitFor: n => n === 1 ? 'meter' : 'meters', tries: [p - s, p / 2, p - 2 * s], why: `Half of the fence is length + width: ${p} ÷ 2 = ${p / 2}. ${p / 2} − ${s} = ${t}. The side next to it is ${t} meters.`, hint: 'Half of the perimeter is one length plus one width.' }; },
    () => { const s = rnd(3, 11), perim = Math.random() < 0.5; return perim ? { k: 'w-patio-p', text: `A square patio has sides of ${s} feet. How many feet of edging go around it?`, a: 4 * s, unitFor: n => n === 1 ? 'foot' : 'feet', tries: [s * s, 2 * s, 3 * s], why: `A square has 4 equal sides: 4 × ${s} = ${4 * s}. ${4 * s} feet of edging.`, hint: 'Edging goes around. A square has four equal sides.' } : { k: 'w-patio-a', text: `A square patio has sides of ${s} feet. How many square feet is the patio?`, a: s * s, unitFor: n => n === 1 ? 'square foot' : 'square feet', tries: [4 * s, 2 * s, s + s + 1], why: `Area = ${s} × ${s} = ${s * s}. ${s * s} square feet.`, hint: 'Multiply the side by itself.' }; },
    () => { const [n1, n2] = shuffle(NAMES), A = [rnd(4, 10), rnd(3, 7)], B = [rnd(4, 10), rnd(3, 7)], aa = A[0] * A[1], bb = B[0] * B[1]; if (aa === bb) return null; const big = aa > bb; return { k: 'w-compare', text: `${n1}'s garden is ${A[0]} meters by ${A[1]} meters. ${n2}'s garden is ${B[0]} meters by ${B[1]} meters. How many more square meters does the bigger garden have than the smaller one?`, a: Math.abs(aa - bb), unitFor: n => n === 1 ? 'square meter' : 'square meters', tries: [aa + bb, Math.abs(2 * (A[0] + A[1]) - 2 * (B[0] + B[1])) || 1, big ? aa : bb], why: `${n1}'s garden: ${A[0]} × ${A[1]} = ${aa}. ${n2}'s garden: ${B[0]} × ${B[1]} = ${bb}. The difference is ${Math.abs(aa - bb)}. ${Math.abs(aa - bb)} square meters more.`, hint: 'Find each area, then subtract the smaller from the bigger.' }; },
    () => { const a1 = [rnd(3, 9), rnd(2, 5)], a2 = [rnd(2, 7), rnd(2, 5)], t = a1[0] * a1[1] + a2[0] * a2[1]; return { k: 'w-banner', text: `A banner is made of two rectangles that do not overlap. One is ${a1[0]} feet by ${a1[1]} feet. The other is ${a2[0]} feet by ${a2[1]} feet. What is the total area of the banner in square feet?`, a: t, unitFor: n => n === 1 ? 'square foot' : 'square feet', tries: [a1[0] * a1[1], a2[0] * a2[1], a1[0] + a1[1] + a2[0] + a2[1]], why: `First: ${a1[0]} × ${a1[1]} = ${a1[0] * a1[1]}. Second: ${a2[0]} × ${a2[1]} = ${a2[0] * a2[1]}. Add: ${t}. ${t} square feet.`, hint: 'Find the area of each rectangle, then add.' }; }
  ];
  function wordsQ() {
    for (let t = 0; t < 50; t++) {
      const w = pick(WORDS)(); if (!w) continue;
      return prob(Object.assign({ pic: '', say: w.text }, w));
    }
    return wordsQ();
  }

  const APGEN = { gridPic, rectPic, polyPic, lPic, twoPic, countQ, areaQ, perimQ, missingQ, compareQ, compositeQ, wordsQ, fmt, sq, un };
  if (typeof module !== 'undefined') module.exports = APGEN; else root.APGEN = APGEN;
})(typeof window !== 'undefined' ? window : globalThis);
