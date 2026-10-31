/* Fractions (3rd grade, CCSS 3.NF.1-3): picture builders and problem generators.
   Every problem is made fresh with its answer, an explanation (why) and a hint. Pictures are inline SVG whose data-* attributes say exactly
   what they show, so the generator check can read each picture back and re-solve the problem without trusting this file.
   A problem: { q, html (a picture, or ''), a (the right choice, as text), wrong: [...], why, hint, say, typed? (the number to type, for typed tools), show? }.
   Fractions are written n/d. Runs in the browser, and in Node for the generator check (_dev/tests/gen_check_fractions_intro.mjs). */
(function (root) {
  'use strict';
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const txt = (n, d) => `${n}/${d}`;
  const same = (a, b) => a.n * b.d === b.n * a.d;             // equal in value
  const NAMES = ['Mia', 'Ben', 'Ava', 'Leo', 'Zoe', 'Kai', 'Ana', 'Sam', 'Eli', 'Maya'];
  const PARTS = { 2: 'halves', 3: 'thirds', 4: 'fourths', 5: 'fifths', 6: 'sixths', 8: 'eighths', 10: 'tenths', 12: 'twelfths' };
  const PART1 = { 2: 'half', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth', 8: 'eighth', 10: 'tenth', 12: 'twelfth' };
  const WORD = n => ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][n] || String(n);
  const sayFrac = (n, d) => `${WORD(n)} ${n === 1 ? PART1[d] || 'over ' + d : PARTS[d] || 'over ' + d}`;

  /* ---------- pictures ---------- */
  const W = 456;
  const attr = o => Object.entries(o).map(([k, v]) => `${k}="${v}"`).join(' ');
  /* one or more bars, each cut into equal parts; rows: [{ d, on }] (first `on` parts shaded) */
  function bars(rows, label) {
    const h = rows.length * 62 + (rows.length - 1) * 6;
    const body = rows.map((r, k) => Array.from({ length: r.d }, (_, i) => `<rect class="fc${i < r.on ? ' on' : ''}" x="${(2 + i * W / r.d).toFixed(2)}" y="${2 + k * 68}" width="${(W / r.d).toFixed(2)}" height="58"/>`).join('')).join('');
    const say = label || (rows.length === 1 ? `A bar cut into ${rows[0].d} equal parts with ${rows[0].on} shaded.` : rows.map((r, k) => `Bar ${k + 1} is cut into ${r.d} equal parts${r.on ? ' with ' + r.on + ' shaded' : ''}.`).join(' '));
    return `<svg class="fp" ${attr({ role: 'img', 'aria-label': say, viewBox: `0 0 ${W + 4} ${h + 4}`, 'data-kind': 'bars', 'data-rows': rows.map(r => r.d + ':' + r.on).join(';') })}>${body}</svg>`;
  }
  /* a circle cut into d equal slices, the first `on` shaded */
  function circle(d, on) {
    const cx = 60, cy = 60, r = 54; let body = '';
    if (d === 1) body = `<circle class="fc${on ? ' on' : ''}" cx="${cx}" cy="${cy}" r="${r}"/>`;
    else for (let i = 0; i < d; i++) {
      const a1 = -Math.PI / 2 + i * 2 * Math.PI / d, a2 = -Math.PI / 2 + (i + 1) * 2 * Math.PI / d, p = (a) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
      body += `<path class="fc${i < on ? ' on' : ''}" d="M${cx} ${cy} L${p(a1)} A${r} ${r} 0 0 1 ${p(a2)} Z"/>`;
    }
    return `<svg class="fp" ${attr({ role: 'img', 'aria-label': `A circle cut into ${d} equal slices with ${on} shaded.`, viewBox: '0 0 120 120', 'data-kind': 'circle', 'data-d': d, 'data-on': on })}>${body}</svg>`;
  }
  /* a group of counters, the first `on` shaded */
  function counters(total, on) {
    const per = 6, rows = Math.ceil(total / per), w = Math.min(total, per) * 40 + 4;
    const body = Array.from({ length: total }, (_, i) => `<circle class="fc${i < on ? ' on' : ''}" cx="${22 + (i % per) * 40}" cy="${22 + Math.floor(i / per) * 40}" r="16"/>`).join('');
    return `<svg class="fp" ${attr({ role: 'img', 'aria-label': `A group of ${total} counters with ${on} shaded.`, viewBox: `0 0 ${w} ${rows * 40 + 4}`, 'data-kind': 'set', 'data-total': total, 'data-on': on })}>${body}</svg>`;
  }
  /* a number line from 0 to max with ticks every 1/d; marks: [{ n (how many 1/d from 0), label }] */
  function numberline(max, d, marks, label) {
    const x0 = 28, x1 = 452, U = (x1 - x0) / max; let body = `<line class="ax" x1="${x0}" y1="70" x2="${x1}" y2="70"/>`;
    for (let i = 0; i <= max * d; i++) { const x = (x0 + i * U / d).toFixed(2), whole = i % d === 0; body += `<line class="tk" x1="${x}" y1="${whole ? 54 : 60}" x2="${x}" y2="${whole ? 86 : 80}"/>`; if (whole) body += `<text x="${x}" y="108" text-anchor="middle">${i / d}</text>`; }
    marks.forEach(m => { const x = (x0 + m.n * U / d).toFixed(2); body += `<circle class="pt" cx="${x}" cy="70" r="9"/>${m.label ? `<text class="pl" x="${x}" y="38" text-anchor="middle">${m.label}</text>` : ''}`; });
    return `<svg class="fp" ${attr({ role: 'img', 'aria-label': label || `A number line from 0 to ${max}, cut into ${d} equal parts between whole numbers.`, viewBox: '0 0 480 116', 'data-kind': 'nl', 'data-max': max, 'data-d': d, 'data-marks': marks.map(m => m.n + ':' + (m.label || '')).join(',') })}>${body}</svg>`;
  }

  /* ---------- helpers for wrong options ---------- */
  /* choose up to k wrong fractions (as "n/d" text) that differ in value from the right one and from each other */
  function wrongFracs(right, cands, k = 3) {
    const out = [], seen = [right];
    for (const c of shuffle(cands)) {
      if (!c || c.n < 1 || c.d < 2 || c.n > 40) continue;
      if (seen.some(s => same(s, c))) continue;
      seen.push(c); out.push(txt(c.n, c.d));
      if (out.length === k) break;
    }
    return out;
  }
  const F = (n, d) => ({ n, d });
  const withPic = (p, pic) => Object.assign(p, { html: pic });

  /* ---------- name the fraction ---------- */
  function nameQ(force) {
    const shape = force || pick(['bars', 'bars', 'circle', 'set']);
    for (let t = 0; t < 200; t++) {
      const d = pick([3, 4, 5, 6, 8, 10, 12]), on = rnd(1, d - 1), notShaded = Math.random() < 0.2, ans = notShaded ? F(d - on, d) : F(on, d);
      const noun = shape === 'bars' ? 'bar' : shape === 'circle' ? 'circle' : 'group of counters', each = shape === 'set' ? 'counters' : 'parts';
      const pic = shape === 'bars' ? bars([{ d, on }]) : shape === 'circle' ? circle(d, on) : counters(d, on);
      const wrong = wrongFracs(ans, [F(ans.n + 1, d), F(ans.n - 1, d), F(on === ans.n ? d - on : on, d), F(ans.n, d + 1), F(ans.n, d - 1), F(ans.n + 2, d), F(d, ans.n)]);
      if (wrong.length < 3) continue;
      const what = notShaded ? 'NOT shaded' : 'shaded';
      return withPic({ q: `What fraction of the ${noun} is ${what}?`, a: txt(ans.n, ans.d), wrong, why: `The ${noun} is split into ${d} equal ${each}, so the denominator is ${d}. ${ans.n} of them ${shape === 'set' ? 'are' : 'are'} ${what}, so the numerator is ${ans.n}. The fraction is ${txt(ans.n, ans.d)}.`, hint: 'The bottom number is how many equal parts in all. The top number is how many parts you are talking about.', say: `What fraction of the ${noun} is ${what}?` }, pic);
    }
    throw new Error('no nameQ');
  }
  function unitQ() {
    for (let t = 0; t < 100; t++) {
      const d = pick([2, 3, 4, 5, 6, 8, 10]), shape = pick(['bars', 'circle']), pic = shape === 'bars' ? bars([{ d, on: 1 }]) : circle(d, 1);
      const wrong = wrongFracs(F(1, d), [F(1, d + 1), F(1, d - 1), F(d, 1), F(d - 1, d), F(2, d)].filter(f => f.d >= 2 || f.n >= 1));
      const extra = txt(d, 1);
      const all = [...new Set([...wrong, extra])].filter(x => x !== txt(1, d)).slice(0, 3);
      if (all.length < 3) continue;
      return withPic({ q: `The ${shape === 'bars' ? 'bar' : 'circle'} is cut into ${d} equal parts. What fraction is ONE part?`, a: txt(1, d), wrong: all, why: `${d} equal parts means the denominator is ${d}. One part has 1 on top, so it is ${txt(1, d)}. A fraction with 1 on top is a unit fraction.`, hint: 'One part is the top number. All the equal parts is the bottom number.', say: `The ${shape === 'bars' ? 'bar' : 'circle'} is cut into ${d} equal parts. What fraction is one part?` }, pic);
    }
    throw new Error('no unitQ');
  }

  /* ---------- number line ---------- */
  function lineSetup() {
    const max = pick([1, 1, 2]), d = max === 1 ? pick([2, 3, 4, 5, 6, 8, 10]) : pick([2, 3, 4, 6, 8]);
    return { max, d };
  }
  function nlReadQ() {
    for (let t = 0; t < 200; t++) {
      const { max, d } = lineSetup(), n = rnd(1, max * d - 1);
      if (n % d === 0) continue;
      const wrong = wrongFracs(F(n, d), [F(n + 1, d), F(n - 1, d), F(n, d + 1), F(n, d - 1), F(n + 2, d), F(d, n)]);
      if (wrong.length < 3) continue;
      return withPic({ q: 'What fraction does the point show?', a: txt(n, d), wrong, why: `Between 0 and 1 the line is cut into ${d} equal parts, so each step is ${txt(1, d)}. The point is ${n} steps from 0, so it is ${txt(n, d)}.`, hint: `Count the steps (the spaces) from 0, not the tick marks. Each step is 1/${d}.`, say: 'What fraction does the point show?' }, numberline(max, d, [{ n, label: '' }]));
    }
    throw new Error('no nlReadQ');
  }
  function nlPlaceQ() {
    for (let t = 0; t < 200; t++) {
      const { max, d } = lineSetup(), total = max * d - 1; if (total < 4) continue;
      const ns = shuffle(Array.from({ length: total }, (_, i) => i + 1).filter(i => i % d !== 0)); if (ns.length < 4) continue;
      const pts = ns.slice(0, 4), L = ['A', 'B', 'C', 'D'], right = rnd(0, 3), n = pts[right];
      return withPic({ q: `Which point shows ${txt(n, d)}?`, a: L[right], wrong: L.filter((_, i) => i !== right), why: `Each step on this line is ${txt(1, d)}. ${txt(n, d)} is ${n} steps from 0, so point ${L[right]} shows it.`, hint: `Count ${n} steps of 1/${d} from 0.`, say: `Which point shows ${sayFrac(n, d)}?`, order: L }, numberline(max, d, pts.map((p, i) => ({ n: p, label: L[i] }))));
    }
    throw new Error('no nlPlaceQ');
  }

  /* ---------- wholes as fractions (typed numbers) ---------- */
  const numWrongs = (a, extra = []) => { const out = []; [a + 1, a - 1, a + 2, a * 2, ...extra].forEach(x => { if (Number.isInteger(x) && x > 0 && x !== a && !out.includes(x)) out.push(x); }); return out.slice(0, 3).map(String); };
  function fracToWholeQ() {
    const d = pick([2, 3, 4, 5, 6, 8, 10, 12]), k = rnd(1, Math.min(4, Math.floor(24 / d))), n = k * d;
    return withPic({ q: `${txt(n, d)} equals how many wholes?`, a: String(k), typed: k, wrong: numWrongs(k, [d, n]), why: `${txt(d, d)} is 1 whole, because all ${d} parts make the whole. ${n} ÷ ${d} = ${k}, so ${txt(n, d)} = ${k} whole${k === 1 ? '' : 's'}.`, hint: `How many groups of ${d} are in ${n}?`, say: `${sayFrac(n, d)}, written ${n} over ${d}, equals how many wholes?` }, '');
  }
  function wholeToFracQ() {
    const d = pick([2, 3, 4, 5, 6, 8]), k = rnd(1, 4), n = k * d;
    return withPic({ q: `${k} = ?/${d}. What number goes in place of the ? (the top number)`, a: String(n), typed: n, wrong: numWrongs(n, [k, d, n + d]), why: `1 whole is ${txt(d, d)}, so ${k} wholes is ${k} × ${d} = ${n} ${PARTS[d]}. ${k} = ${txt(n, d)}.`, hint: `1 whole = ${d}/${d}. Multiply ${k} × ${d}.`, say: `${WORD(k)} equals what number over ${d}?` }, '');
  }
  function howManyQ() {
    const d = pick([2, 3, 4, 5, 6, 8, 10]), k = rnd(1, 3), n = k * d;
    return withPic({ q: `How many ${PARTS[d]} make ${k} whole${k === 1 ? '' : 's'}?`, a: String(n), typed: n, wrong: numWrongs(n, [k, d, n + d]), why: `It takes ${d} ${PARTS[d]} to make 1 whole. ${k} wholes is ${k} × ${d} = ${n} ${PARTS[d]}.`, hint: `How many ${PARTS[d]} make 1 whole?`, say: `How many ${PARTS[d]} make ${WORD(k)} whole${k === 1 ? '' : 's'}?` }, bars(Array.from({ length: k }, () => ({ d, on: d })), `${k} bar${k === 1 ? '' : 's'}, each cut into ${d} equal parts and all shaded.`));
  }

  /* ---------- equivalent fractions ---------- */
  function equivPair() {
    for (let t = 0; t < 100; t++) {
      const d = pick([2, 3, 4, 5, 6]), k = pick([2, 3, 4]), e = d * k; if (e > 12) continue;
      const n = rnd(1, d - 1); return { n, d, k, e, m: n * k };
    }
    return { n: 1, d: 2, k: 2, e: 4, m: 2 };
  }
  function equivNumQ() {
    const { n, d, k, e, m } = equivPair();
    return withPic({ q: `${txt(n, d)} = ?/${e}. What number goes in place of the ? (the top number)`, a: String(m), typed: m, wrong: numWrongs(m, [n + k, n, e - d]), why: `The ${d} parts became ${e} parts, so each part was cut into ${k}. The ${n} shaded part${n === 1 ? '' : 's'} became ${n} × ${k} = ${m}. ${txt(n, d)} = ${txt(m, e)}.`, hint: `Each part is cut into ${k} smaller parts. Multiply the top and the bottom by ${k}.`, say: `${sayFrac(n, d)} equals what number over ${e}?` }, bars([{ d, on: n }, { d: e, on: 0 }], `Two bars the same length. The top bar is cut into ${d} equal parts with ${n} shaded. The bottom bar is cut into ${e} equal parts.`));
  }
  function equivPickQ() {
    for (let t = 0; t < 200; t++) {
      const { n, d, k, e, m } = equivPair(), ans = F(m, e);
      const wrong = wrongFracs(ans, [F(n + k, d + k), F(m, d), F(n, e), F(m + 1, e), F(m - 1, e), F(d, e), F(n + 1, e)].map(f => f.n >= f.d + 3 ? F(0, 0) : f));
      if (wrong.length < 3 || wrong.some(x => same(F(...x.split('/').map(Number)), F(n, d)))) continue;
      return withPic({ q: `Which fraction is equal to ${txt(n, d)}?`, a: txt(m, e), wrong, why: `${txt(n, d)} = ${txt(n + '×' + k, d + '×' + k).replace(/\//, '/')} = ${txt(m, e)}. Multiplying the top and bottom by the same number gives the same amount. Adding to the top and bottom does not.`, hint: `Cut every part into ${k} equal pieces. What do the top and bottom become?`, say: `Which fraction is equal to ${sayFrac(n, d)}?` }, bars([{ d, on: n }, { d: e, on: m }], `Two bars the same length. The top bar is cut into ${d} equal parts with ${n} shaded. The bottom bar is cut into ${e} equal parts with ${m} shaded.`));
    }
    throw new Error('no equivPickQ');
  }

  /* ---------- compare ---------- */
  const SYM = ['<', '>', '='];
  const cmpOpts = (A, B, r) => SYM.map(s => `${A} ${s} ${B}`);
  const rel = (a, b) => { const l = a.n * b.d, r = b.n * a.d; return l < r ? '<' : l > r ? '>' : '='; };
  function cmpPick(a, b, why, hint, say, pic) {
    const A = txt(a.n, a.d), B = txt(b.n, b.d), r = rel(a, b);
    return withPic({ q: `Compare ${A} and ${B}. Which is true?`, a: `${A} ${r} ${B}`, wrong: SYM.filter(s => s !== r).map(s => `${A} ${s} ${B}`), why, hint, say }, pic);
  }
  function cmpDenQ() {
    for (let t = 0; t < 100; t++) {
      const d = pick([3, 4, 5, 6, 8, 10, 12]), n1 = rnd(1, d - 1), n2 = rnd(1, d - 1); if (n1 === n2) continue;
      const a = F(n1, d), b = F(n2, d), big = n1 > n2 ? n1 : n2, small = n1 > n2 ? n2 : n1;
      return cmpPick(a, b, `Both fractions have ${d} equal parts, so the pieces are the same size. ${big}/${d} has more pieces than ${small}/${d}, so ${big}/${d} is greater.`, 'The bottom numbers match, so just compare the top numbers.', `Compare ${sayFrac(n1, d)} and ${sayFrac(n2, d)}. Which is true?`, bars([{ d, on: n1 }, { d, on: n2 }], `Two bars of the same length. Each is cut into ${d} equal parts. The top has ${n1} shaded and the bottom has ${n2} shaded.`));
    }
    throw new Error('no cmpDenQ');
  }
  function cmpNumQ() {
    for (let t = 0; t < 100; t++) {
      const n = rnd(1, 4), d1 = pick([2, 3, 4, 5, 6, 8, 10, 12]), d2 = pick([2, 3, 4, 5, 6, 8, 10, 12]); if (d1 === d2 || n >= Math.min(d1, d2)) continue;
      const a = F(n, d1), b = F(n, d2), small = d1 > d2 ? d1 : d2, big = d1 > d2 ? d2 : d1;
      return cmpPick(a, b, `Both fractions have ${n} part${n === 1 ? '' : 's'}, but the parts are different sizes. The more parts a whole is cut into, the smaller each part is, so ${PARTS[small]} are smaller than ${PARTS[big]}. The fraction with the smaller denominator is greater.`, 'The top numbers match. Which pieces are bigger: pieces from a whole cut into more parts, or fewer parts?', `Compare ${sayFrac(n, d1)} and ${sayFrac(n, d2)}. Which is true?`, bars([{ d: d1, on: n }, { d: d2, on: n }], `Two bars of the same length. The top is cut into ${d1} equal parts with ${n} shaded. The bottom is cut into ${d2} equal parts with ${n} shaded.`));
    }
    throw new Error('no cmpNumQ');
  }
  function cmpEqQ() {
    const { n, d, k, e, m } = equivPair(), swap = Math.random() < 0.5, a = swap ? F(m, e) : F(n, d), b = swap ? F(n, d) : F(m, e);
    const rows = swap ? [{ d: e, on: m }, { d, on: n }] : [{ d, on: n }, { d: e, on: m }];
    return cmpPick(a, b, `The two bars are the same length and the same amount is shaded, so ${txt(n, d)} and ${txt(m, e)} are equal. ${txt(n, d)} × ${k}/${k} = ${txt(m, e)}.`, 'Look at how much of each bar is shaded. Is it the same amount?', `Compare ${sayFrac(a.n, a.d)} and ${sayFrac(b.n, b.d)}. Which is true?`, bars(rows, `Two bars of the same length. ${rows.map((r, i) => `Bar ${i + 1} is cut into ${r.d} equal parts with ${r.on} shaded.`).join(' ')}`));
  }

  /* ---------- word problems ---------- */
  function wordsQ() {
    const kinds = [
      () => { const d = pick([4, 6, 8, 10]), n = rnd(1, d - 1); if (2 * n === d) return null; const nm = pick(NAMES), food = pick(['pizza', 'pie', 'sandwich', 'cake']), ate = Math.random() < 0.5;
        const ans = ate ? F(n, d) : F(d - n, d); return { q: `${nm} cuts a ${food} into ${d} equal slices and eats ${n} of them. What fraction of the ${food} ${ate ? 'did ' + nm + ' eat' : 'is left'}?`, ans, wrong: [F(n, d), F(d - n, d), F(n, d - n), F(d, n)].filter(f => !same(f, ans)), why: `The ${food} has ${d} equal slices, so the denominator is ${d}. ${ate ? nm + ' ate ' + n : d - n + ' slices are left'}, so the fraction is ${txt(ans.n, ans.d)}.`, hint: 'Count all the equal slices for the bottom number. Count the slices you are asked about for the top number.', say: null }; },
      () => { const d = pick([3, 4, 5, 6, 8]), item = pick(['ribbon', 'rope', 'board', 'string']); return { q: `A ${item} is cut into ${d} equal pieces. What fraction of the ${item} is 1 piece?`, ans: F(1, d), wrong: [F(1, d + 1), F(1, d - 1), F(d, 1), F(d - 1, d)].filter(f => f.d > 1 || f.n > 1), why: `${d} equal pieces means the denominator is ${d}. One piece is ${txt(1, d)}.`, hint: 'One piece is 1 over the number of equal pieces.', say: null }; },
      () => { const total = pick([5, 6, 8, 10]), n = rnd(1, total - 1); if (2 * n === total) return null; const thing = pick([['marbles', 'red'], ['balloons', 'blue'], ['flowers', 'yellow'], ['crayons', 'green']]);
        return { q: `A bag has ${total} ${thing[0]}. ${n} of them are ${thing[1]}. What fraction of the ${thing[0]} are ${thing[1]}?`, ans: F(n, total), wrong: [F(total - n, total), F(n, total - n), F(total, n), F(n + 1, total)].filter(f => !same(f, F(n, total))), why: `There are ${total} ${thing[0]} in all, so the bottom number is ${total}. ${n} are ${thing[1]}, so the top number is ${n}: ${txt(n, total)}.`, hint: 'All of the things go on the bottom. The ones you are asked about go on top.', say: null }; },
      () => { const d = pick([2, 3, 4, 6, 8, 10]), nm = pick(NAMES), food = pick(['pizza', 'pie', 'cake']); return { q: `${nm} eats all ${d} equal slices of a ${food}. What fraction of the ${food} did ${nm} eat?`, ans: F(d, d), wrong: [F(1, d), F(d - 1, d), F(d, 1), F(1, 1)].filter(f => !same(f, F(d, d)) && f.d > 1), why: `${d} out of ${d} equal slices is ${txt(d, d)}, which is 1 whole ${food}.`, hint: 'All the slices is the same as the whole.', say: null, noFilter: true }; }
    ];
    const compare = () => {
      const same_den = Math.random() < 0.5, nm = pick(NAMES), nm2 = pick(NAMES.filter(x => x !== nm));
      let a, b, why, hint;
      if (same_den) { const d = pick([4, 6, 8, 10]); let n1 = rnd(1, d - 1), n2 = rnd(1, d - 1); if (n1 === n2) n2 = n1 === d - 1 ? n1 - 1 : n1 + 1; a = F(n1, d); b = F(n2, d); why = `The denominators match, so compare the tops: ${Math.max(n1, n2)} is more than ${Math.min(n1, n2)}.`; hint = 'The bottom numbers are the same. Compare the top numbers.'; }
      else { const n = pick([1, 2]), d1 = pick([3, 4, 5, 6, 8]), d2 = pick([3, 4, 5, 6, 8]); if (d1 === d2 || n >= Math.min(d1, d2)) return null; a = F(n, d1); b = F(n, d2); why = `The tops match, but ${PARTS[Math.max(d1, d2)]} are smaller than ${PARTS[Math.min(d1, d2)]}. The smaller denominator means bigger pieces, so ${txt(n, Math.min(d1, d2))} is more.`; hint = 'The top numbers are the same. Pieces get smaller when a whole is cut into more parts.'; }
      const unit = pick([['ate', 'of the same pizza', 'ate more'], ['walked', 'of a mile', 'walked farther'], ['drank', 'of a liter of juice', 'drank more']]);
      const winner = rel(a, b) === '>' ? nm : nm2;
      return { cmp: true, q: `${nm} ${unit[0]} ${txt(a.n, a.d)} ${unit[1]}. ${nm2} ${unit[0]} ${txt(b.n, b.d)} ${unit[1]}. Who ${unit[2]}?`, a: winner, wrong: [nm === winner ? nm2 : nm, 'They are equal'], why: `${why} So ${winner} ${unit[2]}.`, hint, say: null };
    };
    for (let t = 0; t < 200; t++) {
      const k = Math.random() < 0.3 ? compare() : pick(kinds)();
      if (!k) continue;
      if (k.cmp) return withPic({ q: k.q, a: k.a, wrong: k.wrong, why: k.why, hint: k.hint, say: k.q }, '');
      const wrong = wrongFracs(k.ans, k.wrong);
      if (wrong.length < 3 && !k.noFilter) continue;
      const w = k.noFilter ? [...new Set(k.wrong.map(f => txt(f.n, f.d)))].filter(x => x !== txt(k.ans.n, k.ans.d)).slice(0, 3) : wrong;
      if (w.length < 3) continue;
      return withPic({ q: k.q, a: txt(k.ans.n, k.ans.d), wrong: w, why: k.why, hint: k.hint, say: k.q.replace(/(\d+)\/(\d+)/g, (m, n, d) => sayFrac(+n, +d)) }, '');
    }
    throw new Error('no wordsQ');
  }

  const FRACGEN = { bars, circle, counters, numberline, nameQ, unitQ, nlReadQ, nlPlaceQ, fracToWholeQ, wholeToFracQ, howManyQ, equivNumQ, equivPickQ, cmpDenQ, cmpNumQ, cmpEqQ, wordsQ, txt, same, rel, PARTS, PART1, sayFrac, WORD };
  if (typeof module !== 'undefined') module.exports = FRACGEN; else root.FRACINTRO = FRACGEN;
})(typeof window !== 'undefined' ? window : globalThis);
