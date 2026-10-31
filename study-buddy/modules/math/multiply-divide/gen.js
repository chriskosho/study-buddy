/* Multi-Digit Multiplication and Long Division: problem generators and the step helpers for the study guide.
   Everything is whole-number arithmetic (all values stay far below 2^53), so there are no rounding surprises.
   Typed problems come back as { q, a, show?, why, hint, say, wrong } where wrong is a list of believable mistakes: the typed tools ignore it,
   and the Quiz uses it to show the same problem as multiple choice. Runs in the browser, and in Node for _dev/tests/gen_check_muldiv.mjs. */
(function (root) {
  'use strict';
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fmt = n => Number(n).toLocaleString('en-US');
  const sum = a => a.reduce((x, y) => x + y, 0);
  /* 47 -> [40, 7]; 1,205 -> [1000, 200, 5] (the parts of a number, by place value, ones first when reversed) */
  const parts = n => { const s = String(n), out = []; for (let i = 0; i < s.length; i++) { const d = +s[i]; if (d) out.push(d * 10 ** (s.length - 1 - i)); } return out; };
  const NAMES = { 1: 'ones', 10: 'tens', 100: 'hundreds', 1000: 'thousands', 10000: 'ten thousands' };
  /* a number with this many digits, none of them zero (or with zeros allowed inside when zeros is true) */
  const num = (len, zeros) => { let s = String(rnd(1, 9)); for (let i = 1; i < len; i++) s += String(zeros && i < len - 1 && Math.random() < 0.18 ? 0 : rnd(1, 9)); return Number(s); };
  const pickN = (cands, answer, count, fill) => {   // the first `count` different, positive candidates that are not the answer; fill with near misses if needed
    const out = [];
    shuffle(cands).forEach(c => { if (Number.isInteger(c) && c > 0 && c !== answer && !out.includes(c)) out.push(c); });
    for (let k = 1; out.length < count && k < 200; k++) { const c = answer + (fill ? fill(k) : k * 10) * (k % 2 ? 1 : -1); if (c > 0 && c !== answer && !out.includes(c)) out.push(c); }
    return out.slice(0, count);
  };

  /* ---------- multiplication ---------- */
  /* the partial products of a x b, ones digit first: [{ part: 6, value: 282 }, { part: 30, value: 1410 }] */
  const partials = (a, b) => parts(b).reverse().map(p => ({ part: p, value: a * p }));
  function whyMul(a, b) {
    const ps = partials(a, b);
    if (!ps.length) return `Anything times 0 is 0.`;
    const lines = ps.map(p => `${fmt(a)} × ${fmt(p.part)} = ${fmt(p.value)}`).join('; ');
    const zeroNote = ps.some(p => p.part >= 10) ? ' (a 0 holds the ones place in each row after the first)' : '';
    return `Multiply by each part of ${fmt(b)}: ${lines}${zeroNote}. Add the partial products: ${ps.map(p => fmt(p.value)).join(' + ')} = ${fmt(a * b)}.`;
  }
  const HINT_MUL = 'Multiply by the ones digit, then by the tens digit (put a 0 in the ones place first), and so on. Then add the rows.';
  function wrongProducts(a, b, ans) {
    const ps = partials(a, b), digs = String(b).split('').reverse().map(Number);
    const noShift = sum(digs.map(d => a * d));   // forgot the zero that holds the place
    const cands = [noShift, ...ps.map(p => p.value), ans + 10, ans - 10, ans + 100, ans - 100, ans + 1000, ans - 1000, ans + a, ans - a, a * b + (ps.length > 1 ? ps[ps.length - 1].value : 0)];
    return pickN(cands, ans, 3, k => 10 * k);
  }
  function mulItem(a, b) {
    const ans = a * b;
    return { q: `${fmt(a)} × ${fmt(b)} = ?`, a: ans, why: whyMul(a, b), hint: HINT_MUL, say: `${a} times ${b}`, wrong: wrongProducts(a, b, ans), chk: `${a} * ${b}` };
  }
  const multiplyQ = () => { let a, b; do { a = num(2); b = num(2); } while (a % 10 === 0 || b % 10 === 0 || a === b); return mulItem(a, b); };
  function bigmultQ() {
    const t = pick(['32', '32', '42', '33']);   // digits in each factor: 3x2, 4x2, 3x3
    let a, b; do { a = num(+t[0], true); b = num(+t[1], t === '33'); } while (a === b);
    return mulItem(a, b);
  }

  /* ---------- area model ---------- */
  const esc = s => String(s);
  function areaSVG(a, b, hide) {
    const ap = parts(a), bp = parts(b), cw = 104, ch = 62, lx = 62, ty = 36, W = lx + ap.length * cw + 8, H = ty + bp.length * ch + 8;
    const label = `Area model for ${a} times ${b}. Columns: ${ap.join(', ')}. Rows: ${bp.join(', ')}.` + (hide ? ` The shaded box is the row ${bp[hide[0]]} and the column ${ap[hide[1]]}.` : ` The boxes are ${bp.map(r => ap.map(c => `${r} times ${c} is ${r * c}`).join(', ')).join('; ')}.`);
    let s = `<svg class="mdarea" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}" data-a="${a}" data-b="${b}"${hide ? ` data-hide="${hide[0]},${hide[1]}"` : ''}>`;
    ap.forEach((c, i) => { s += `<text class="mdh" x="${lx + i * cw + cw / 2}" y="${ty - 12}" text-anchor="middle">${fmt(c)}</text>`; });
    bp.forEach((r, j) => { s += `<text class="mdh" x="${lx - 10}" y="${ty + j * ch + ch / 2 + 6}" text-anchor="end">${fmt(r)}</text>`; });
    bp.forEach((r, j) => ap.forEach((c, i) => {
      const hid = hide && hide[0] === j && hide[1] === i;
      s += `<rect class="mdc${hid ? ' mdq' : ''}" x="${lx + i * cw}" y="${ty + j * ch}" width="${cw}" height="${ch}" rx="6"/><text class="mdv" x="${lx + i * cw + cw / 2}" y="${ty + j * ch + ch / 2 + 8}" text-anchor="middle">${hid ? '?' : fmt(r * c)}</text>`;
    }));
    return s + '</svg>';
  }
  const lead = n => Number(String(n)[0]), zeros = n => String(n).length - 1;
  function whyPart(x, y, v) {   // 40 x 30: multiply the front digits, then add the zeros
    const z = zeros(x) + zeros(y);
    return z ? `The shaded box is ${fmt(x)} × ${fmt(y)}. Multiply the front digits: ${lead(x)} × ${lead(y)} = ${lead(x) * lead(y)}. Then add ${z} zero${z > 1 ? 's' : ''}: ${fmt(v)}.` : `The shaded box is ${x} × ${y} = ${v}.`;
  }
  function areaQ(force) {
    const type = force || pick(['part', 'part', 'total']);
    const a = num(Math.random() < 0.3 ? 3 : 2), b = num(2), ap = parts(a), bp = parts(b), ans = a * b;
    if (type === 'part') {
      const r = rnd(0, bp.length - 1), c = rnd(0, ap.length - 1), v = bp[r] * ap[c];
      const digitsOnly = (bp[r] / (10 ** (String(bp[r]).length - 1))) * (ap[c] / (10 ** (String(ap[c]).length - 1)));   // forgot the zeros: 4 x 3 for 40 x 30
      const others = []; bp.forEach((x, j) => ap.forEach((y, i) => { if (j !== r || i !== c) others.push(x * y); }));
      const wrong = pickN([digitsOnly, v * 10, v / 10, ...others, bp[r] + ap[c]], v, 3, k => 10 * k);
      return { q: `Area model for ${fmt(a)} × ${fmt(b)}. What number goes in the shaded box?`, html: areaSVG(a, b, [r, c]), a: fmt(v), wrong: wrong.map(fmt), why: whyPart(bp[r], ap[c], v), say: `Area model for ${a} times ${b}. What number goes in the shaded box?`, hint: 'Multiply the front digits, then add the zeros.', meta: { a, b, r, c } };
    }
    const cells = []; bp.forEach(x => ap.forEach(y => cells.push(x * y)));
    const small = Math.min(...cells), big = Math.max(...cells);
    const wrong = pickN([ans - small, ans - big, ans + 10, ans - 10, ans + 100, ans - 100, sum(cells) - cells[1] + cells[1] * 10], ans, 3, k => 10 * k);
    return { q: `Add the boxes of the area model to find ${fmt(a)} × ${fmt(b)}.`, html: areaSVG(a, b), a: fmt(ans), wrong: wrong.map(fmt), why: `Add all the boxes: ${cells.map(fmt).join(' + ')} = ${fmt(ans)}. So ${fmt(a)} × ${fmt(b)} = ${fmt(ans)}.`, say: `Add the boxes of the area model to find ${a} times ${b}.`, hint: 'Add every box. Do not leave one out.', meta: { a, b } };
  }

  /* ---------- long division ---------- */
  /* longDiv(1764, 42): { q: 42, r: 0, steps: [{ cur: 176, qd: 4, prod: 168, rem: 8, bring: null }, { cur: 84, qd: 2, prod: 84, rem: 0, bring: 4, from: 8 }] } */
  function longDiv(n, d) {
    const s = String(n); let i = 0, cur = 0;
    while (i < s.length && cur < d) { cur = cur * 10 + +s[i]; i++; }
    if (cur < d) return { q: 0, r: n, steps: [] };
    const steps = []; let q = '', rem = 0;
    const one = (c, bring, from) => { const qd = Math.floor(c / d), prod = qd * d; rem = c - prod; q += qd; steps.push({ cur: c, qd, prod, rem, bring, from }); };
    one(cur, null, null);
    while (i < s.length) { const dg = +s[i++], from = rem; one(rem * 10 + dg, dg, from); }
    return { q: Number(q), r: rem, steps };
  }
  function whyDiv(n, d) {
    const L = longDiv(n, d);
    if (!L.steps.length) return `${fmt(d)} is bigger than ${fmt(n)}, so it goes in 0 times. ${fmt(n)} ÷ ${fmt(d)} = 0 R ${fmt(n)}.`;
    const lines = L.steps.map((st, k) => {
      const lead = k === 0 ? `${fmt(d)} into ${fmt(st.cur)}` : `Bring down ${st.bring} to make ${fmt(st.cur)}; ${fmt(d)} into ${fmt(st.cur)}`;
      return st.qd === 0 ? `${lead}: 0 times, so write 0.` : `${lead}: ${st.qd} × ${fmt(d)} = ${fmt(st.prod)}, ${fmt(st.cur)} − ${fmt(st.prod)} = ${fmt(st.rem)}.`;
    });
    return `${lines.join(' ')} So ${fmt(n)} ÷ ${fmt(d)} = ${fmt(L.q)}${L.r ? ' R ' + L.r : ''}. Check: ${fmt(L.q)} × ${fmt(d)}${L.r ? ' + ' + L.r : ''} = ${fmt(n)}.`;
  }
  const qr = (q, r) => r ? `${fmt(q)} R ${r}` : fmt(q);
  function wrongQuotients(q, r, d) {
    const noZero = Number(String(q).replace('0', '')) || q + 10;
    const cands = r
      ? [[q, 0], [q, r + 1], [q + 1, r], [q - 1, r], [q, d - r], [noZero, r], [q, d + r]]
      : [[q + 1, 0], [q - 1, 0], [q, 1], [noZero !== q ? noZero : q + 10, 0], [q * 10, 0], [q + 10, 0]];
    const seen = new Set([qr(q, r)]), out = [];
    shuffle(cands).forEach(([x, y]) => { const t = qr(x, y); if (x > 0 && !seen.has(t)) { seen.add(t); out.push(t); } });
    for (let k = 2; out.length < 3; k++) { const t = qr(q + k, r); if (!seen.has(t)) { seen.add(t); out.push(t); } }
    return out.slice(0, 3);
  }
  const HINT_DIV = 'Divide, multiply, subtract, bring down the next digit, and repeat. The remainder must be smaller than the divisor.';
  function divItem(n, d, q, r) {
    const show = qr(q, r);
    return { q: `${fmt(n)} ÷ ${fmt(d)} = ?`, a: r ? [show] : [show, `${show} R 0`], show, why: whyDiv(n, d), hint: HINT_DIV, say: `${n} divided by ${d}`, wrong: wrongQuotients(q, r, d), meta: { n, d } };
  }
  function div1Q() {
    for (;;) {
      const d = rnd(2, 9), r = Math.random() < 0.55 ? rnd(1, d - 1) : 0, q = rnd(60, Math.min(1400, Math.floor(9999 / d) - 1)), n = q * d + r;
      if (n >= 100 && n <= 9999) return divItem(n, d, q, r);
    }
  }
  function div2Q() {
    for (;;) {
      const d = rnd(11, 79), r = Math.random() < 0.5 ? rnd(1, d - 1) : 0, q = rnd(12, Math.min(300, Math.floor(9999 / d) - 1)), n = q * d + r;
      if (n >= 400 && n <= 9999) return divItem(n, d, q, r);
    }
  }

  /* ---------- remainders: what does the leftover mean? ---------- */
  const BUILD = {
    left: [(n, d) => `${fmt(n)} pencils are packed into boxes of ${d}. How many pencils are left over?`, (n, d) => `A teacher has ${fmt(n)} stickers to share equally among ${d} students. How many stickers are left over?`, (n, d) => `${fmt(n)} cards are dealt into piles of ${d}. How many cards are left over after the full piles?`],
    up: [(n, d) => `${fmt(n)} students are going on a field trip. Each bus holds ${d} students. How many buses are needed?`, (n, d) => `${fmt(n)} eggs must be packed into cartons that hold ${d} eggs each. How many cartons are needed to hold all of the eggs?`, (n, d) => `A school needs seats for ${fmt(n)} guests. Each table seats ${d}. How many tables are needed?`],
    drop: [(n, d) => `A baker packs ${fmt(n)} cookies into boxes of ${d}. How many full boxes can she make?`, (n, d) => `Ribbon pieces ${d} inches long are cut from a ribbon ${fmt(n)} inches long. How many whole pieces can be cut?`, (n, d) => `${fmt(n)} photos fill albums that hold ${d} photos each. How many albums are completely full?`]
  };
  function remaindersQ(force) {
    const kind = force || pick(['left', 'up', 'drop']), d = pick([4, 5, 6, 8, 9, 12, 15, 24, 25, 36, 40, 48]), r = rnd(1, d - 1), q = rnd(3, 60), n = q * d + r;
    const text = pick(BUILD[kind])(n, d);
    const ans = kind === 'left' ? r : kind === 'up' ? q + 1 : q;
    const cands = kind === 'left' ? [q, q + 1, d - r, r + 1, r - 1] : kind === 'up' ? [q, r, q + 2, q - 1, d - r] : [q + 1, r, q - 1, q + 2, d - r];
    const wrong = pickN(cands, ans, 3, k => k);
    const sp = `${fmt(n)} ÷ ${d} = ${fmt(q)} R ${r}: ${fmt(q)} full groups with ${r} left over.`;
    const why = kind === 'left' ? `${sp} The question asks for the leftover, so the answer is the remainder, ${r}.`
      : kind === 'up' ? `${sp} The ${r} left over still need a place, so you need one more: ${fmt(q)} + 1 = ${fmt(q + 1)}.`
      : `${sp} Only full groups count, so drop the ${r} left over. The answer is ${fmt(q)}.`;
    const hint = kind === 'left' ? 'Divide. The leftover is the remainder.' : kind === 'up' ? 'Divide. If anything is left over, it still needs one more.' : 'Divide. Only the full groups count, so ignore the remainder.';
    const chk = kind === 'left' ? `rem(${n}, ${d})` : kind === 'up' ? `ceil(${n}, ${d})` : `floor(${n}, ${d})`;
    return { q: text, a: fmt(ans), wrong: wrong.map(fmt), why, hint, say: text, chk, meta: { kind, n, d } };
  }

  /* ---------- word problems (type the number) ---------- */
  const WORD = [
    () => { const r = rnd(12, 48), s = rnd(12, 60); return mw(`A theater has ${r} rows with ${s} seats in each row. How many seats are there?`, r, s, 'Equal rows: multiply the rows by the seats in each row.'); },
    () => { const a = num(3), b = rnd(12, 36); return mw(`A bakery makes ${fmt(a)} muffins every day. How many muffins does it make in ${b} days?`, a, b, 'The same amount every day: multiply.'); },
    () => { const q = rnd(12, 70), d = rnd(12, 36), n = q * d; const t = `${fmt(n)} stickers are shared equally among ${d} students. How many stickers does each student get?`; return { q: t, a: q, why: whyDiv(n, d), hint: 'Sharing equally: divide.', say: t, wrong: pickN([q + 1, q - 1, n - d, d, q * 10], q, 3), chk: `${n} / ${d}` }; },
    () => { const d = rnd(12, 45), r = rnd(1, d - 1), q = rnd(3, 40), n = q * d + r, t = `${fmt(n)} students are going on a field trip. Each bus holds ${d} students. How many buses are needed?`; return { q: t, a: q + 1, why: `${fmt(n)} ÷ ${d} = ${q} R ${r}. The ${r} left over still need a bus, so ${q} + 1 = ${q + 1} buses.`, hint: 'Divide. If anyone is left over, they still need a bus.', say: t, wrong: pickN([q, r, q + 2, d - r], q + 1, 3), chk: `ceil(${n}, ${d})` }; },
    () => { const d = pick([12, 15, 18, 24, 36]), r = rnd(1, d - 1), q = rnd(5, 60), n = q * d + r, t = `A baker has ${fmt(n)} cookies and packs them in boxes of ${d}. How many full boxes can she make?`; return { q: t, a: q, why: `${fmt(n)} ÷ ${d} = ${q} R ${r}. Only full boxes count, so the answer is ${q}.`, hint: 'Divide. Only full boxes count, so ignore the remainder.', say: t, wrong: pickN([q + 1, r, q - 1, q + 2], q, 3), chk: `floor(${n}, ${d})` }; },
    () => { const a = rnd(12, 30), b = pick([12, 18, 24, 36]), p = a * b, c = rnd(50, Math.floor(p / 2)), t = `A school buys ${a} boxes with ${b} pencils in each box. It hands out ${c} pencils. How many pencils are left?`; return { q: t, a: p - c, why: `First find how many pencils: ${a} × ${b} = ${fmt(p)}. Then subtract the ones handed out: ${fmt(p)} − ${fmt(c)} = ${fmt(p - c)}.`, hint: 'Two steps: multiply to find the total, then subtract.', say: t, wrong: pickN([p + c, p, a + b - c > 0 ? a + b - c : p + 1, p - c + 10], p - c, 3), chk: `${a} * ${b} - ${c}` }; },
    () => { const d = pick([6, 8, 12, 15]), r = rnd(1, d - 1), q = rnd(10, 60), n = q * d + r, price = rnd(3, 9), t = `A farm packs ${fmt(n)} eggs into cartons of ${d}. Each full carton sells for $${price}. How many dollars does the farm get for the full cartons?`; return { q: t, a: q * price, why: `${fmt(n)} ÷ ${d} = ${q} R ${r}, so there are ${q} full cartons. ${q} × ${price} = ${fmt(q * price)} dollars.`, hint: 'Two steps: divide to find the full cartons, then multiply by the price.', say: t, wrong: pickN([(q + 1) * price, q + price, n * price, q * price + r], q * price, 3), chk: `floor(${n}, ${d}) * ${price}` }; }
  ];
  function mw(text, a, b, hint) { const ans = a * b; return { q: text, a: ans, why: whyMul(a, b), hint, say: text, wrong: wrongProducts(a, b, ans), chk: `${a} * ${b}` }; }
  const wordsQ = () => pick(WORD)();

  const MDGEN = { fmt, parts, partials, longDiv, whyDiv, whyMul, areaSVG, areaQ, multiplyQ, bigmultQ, div1Q, div2Q, remaindersQ, wordsQ, qr, NAMES };
  if (typeof module !== 'undefined') module.exports = MDGEN; else root.MDGEN = MDGEN;
})(typeof window !== 'undefined' ? window : globalThis);
