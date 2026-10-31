/* Decimal Operations: problem generators and the study-guide helper (5th grade: + - x / with decimals, estimating, word problems).
   A decimal is { n, p }: the whole number n written with p decimal places (4.70 is { n: 470, p: 2 }). Every calculation is done on whole
   numbers, so there are no floating-point surprises. Division problems are built from the answer, so every quotient ends within a few places.
   Runs in the browser, and in Node for the generator check (_dev/tests/gen_check_decimal.mjs). */
(function (root) {
  'use strict';
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const P10 = k => 10 ** k;
  const commas = w => w.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  /* write a decimal; trim = drop zeros at the end (4.70 -> 4.7) */
  function dstr(n, p, trim) {
    const s = String(n).padStart(p + 1, '0'); let w = s.slice(0, s.length - p), d = s.slice(s.length - p);
    if (trim) d = d.replace(/0+$/, '');
    return commas(w) + (d ? '.' + d : '');
  }
  const D = (n, p) => ({ n, p });
  const show = (x, trim = true) => dstr(x.n, x.p, trim);
  const toNum = x => parseFloat(dstr(x.n, x.p, false).replace(/,/g, ''));     // only to hand to the answer checker, which compares with a tolerance
  const scaleTo = (x, p) => x.n * P10(p - x.p);                                 // x written with p places (p >= x.p)
  const key = x => (BigInt(x.n) * 10n ** BigInt(12 - x.p)).toString();           // same key for equal values
  const sameVal = (x, y) => key(x) === key(y);
  const add = (a, b) => { const p = Math.max(a.p, b.p); return D(scaleTo(a, p) + scaleTo(b, p), p); };
  const sub = (a, b) => { const p = Math.max(a.p, b.p); return D(scaleTo(a, p) - scaleTo(b, p), p); };
  const mul = (a, b) => D(a.n * b.n, a.p + b.p);
  const lt = (a, b) => { const p = Math.max(a.p, b.p); return scaleTo(a, p) < scaleTo(b, p); };
  /* a random decimal with exactly p places (the last one is not zero), whole part from lo to hi */
  function rd(p, lo, hi) {
    for (let i = 0; i < 100; i++) {
      let frac = 0; for (let k = 0; k < p; k++) frac = frac * 10 + (k === p - 1 ? rnd(1, 9) : rnd(0, 9));
      const x = D(rnd(lo, hi) * P10(p) + frac, p); if (x.n > 0) return x;
    }
    return D(P10(p) + 1, p);
  }
  const sayD = x => { const s = dstr(x.n, x.p, true).replace(/,/g, ''), [w, f] = s.split('.'); return w + (f ? ' point ' + f.split('').join(' ') : ''); };
  const SAY = { '+': 'plus', '−': 'minus', '×': 'times', '÷': 'divided by' };

  /* ---------- wrong answers: what you get when the point lands in the wrong place, or a digit slips ---------- */
  function wrongSet(ans, seeds) {
    const cand = [...seeds];
    cand.push(D(ans.n, ans.p + 1), D(ans.n, Math.max(0, ans.p - 1)), D(ans.n * 10, ans.p), D(ans.n + 1, ans.p), D(Math.max(1, ans.n - 1), ans.p), D(ans.n + 10, ans.p), D(Math.max(1, ans.n - 10), ans.p), D(ans.n + 100, ans.p), D(ans.n, ans.p + 2));
    const out = [], seen = new Set([key(ans)]);
    for (const c of cand) { if (!c || !(c.n > 0)) continue; const k = key(c); if (seen.has(k)) continue; seen.add(k); out.push(c); if (out.length === 3) break; }
    return out;
  }
  const strs = list => list.map(x => show(x));
  /* the pieces every typed problem hands back */
  function problem(q, ans, seeds, why, hint, say, extra) {
    return Object.assign({ q, a: toNum(ans), show: show(ans), wrong: strs(wrongSet(ans, seeds)), why, hint, say }, extra || {});
  }
  const endNote = (x) => { const full = show(x, false), t = show(x); return full === t ? full : `${full}, which is ${t}`; };
  const HINT_ADD = 'Line up the decimal points. Write zeros so both numbers have the same number of places.';

  /* ---------- add ---------- */
  function pickPlaces() { const pa = rnd(1, 3); let pb = rnd(0, 3); if (pb === pa && Math.random() < 0.7) pb = (pa % 3) + 1; return [pa, pb]; }
  function addQ() {
    const [pa, pb] = pickPlaces(), a = rd(pa, 0, pa === 3 ? 20 : 99), b = pb ? rd(pb, 0, 99) : D(rnd(2, 40), 0);
    const ans = add(a, b), P = ans.p, A = D(scaleTo(a, P), P), B = D(scaleTo(b, P), P);
    const slip = D(a.n + b.n, Math.max(a.p, b.p));   // added the digits without lining up the points
    return problem(`${show(a)} + ${show(b)} = ?`, ans, [slip], `Line up the decimal points: ${show(A, false)} + ${show(B, false)}. Add as with whole numbers and bring the point straight down: ${endNote(ans)}.`, HINT_ADD, `${sayD(a)} plus ${sayD(b)}`, { kind: 'add' });
  }
  /* ---------- subtract ---------- */
  function subQ() {
    for (let t = 0; t < 200; t++) {
      const [pa, pb] = pickPlaces(), a = Math.random() < 0.25 ? D(rnd(3, 60), 0) : rd(pa, 1, 99), b = pb ? rd(pb, 0, 60) : D(rnd(1, 30), 0);
      if (!lt(b, a)) continue;
      const ans = sub(a, b), P = Math.max(a.p, b.p); if (ans.n < 1) continue;
      const A = D(scaleTo(a, P), P), B = D(scaleTo(b, P), P);
      const slip = D(Math.abs(a.n - b.n), Math.max(a.p, b.p));   // took the digits away without lining up the points
      return problem(`${show(a)} − ${show(b)} = ?`, ans, [slip], `Line up the decimal points and add zeros: ${show(A, false)} − ${show(B, false)}. Subtract as with whole numbers (regroup when you need to) and bring the point straight down: ${endNote(ans)}.`, 'Line up the decimal points. Write zeros so both numbers have the same number of places. Regroup if you need to.', `${sayD(a)} minus ${sayD(b)}`, { kind: 'sub' });
    }
    throw new Error('no subQ');
  }
  /* ---------- multiply ---------- */
  function mulWholeQ() {
    const dp = rnd(1, 2), a = rd(dp, 0, dp === 1 ? 30 : 9), w = pick([2, 3, 4, 5, 6, 7, 8, 9, 12]), left = Math.random() < 0.3, ans = mul(a, D(w, 0));
    const q = left ? `${w} × ${show(a)} = ?` : `${show(a)} × ${w} = ?`;
    return problem(q, ans, [D(ans.n, 0), D(ans.n, a.p + 1)], `Ignore the decimal point: ${commas(String(a.n))} × ${w} = ${commas(String(a.n * w))}. ${show(a)} has ${a.p} decimal place${a.p === 1 ? '' : 's'}, so the answer does too: ${endNote(ans)}.`, 'Ignore the decimal point and multiply. Then give the answer as many decimal places as the decimal had.', left ? `${w} times ${sayD(a)}` : `${sayD(a)} times ${w}`, { kind: 'mulw' });
  }
  function mulDecQ() {
    for (let t = 0; t < 100; t++) {
      const pa = rnd(1, 2), pb = rnd(1, 2); if (pa + pb > 3) continue;
      const a = rd(pa, 0, 9), b = rd(pb, 0, 9), ans = mul(a, b);
      return problem(`${show(a)} × ${show(b)} = ?`, ans, [D(ans.n, Math.max(a.p, b.p)), D(ans.n, a.p + b.p - 1), D(ans.n, a.p + b.p + 1)], `Ignore the decimal points: ${commas(String(a.n))} × ${commas(String(b.n))} = ${commas(String(a.n * b.n))}. The factors have ${a.p} + ${b.p} = ${a.p + b.p} decimal places in all, so the product has ${a.p + b.p}: ${endNote(ans)}.`, 'Ignore the decimal points and multiply. Count the decimal places in both numbers and add them. The product has that many.', `${sayD(a)} times ${sayD(b)}`, { kind: 'mulD' });
    }
    throw new Error('no mulDecQ');
  }
  /* ---------- divide (built from the answer, so it always comes out even) ---------- */
  function divWholeQ() {
    for (let t = 0; t < 200; t++) {
      const qp = rnd(1, 2), q = rd(qp, 0, qp === 1 ? 20 : 9), d = pick([2, 3, 4, 5, 6, 7, 8, 9, 12]), dividend = mul(q, D(d, 0));
      if (dividend.n % P10(dividend.p) === 0) continue;      // the dividend should have a decimal part
      return problem(`${show(dividend)} ÷ ${d} = ?`, q, [D(q.n, q.p + 1), D(q.n, Math.max(0, q.p - 1))], `Divide as with whole numbers, and put the point in the answer straight above the point in ${show(dividend)}: ${show(dividend)} ÷ ${d} = ${endNote(q)}. Check: ${show(q)} × ${d} = ${show(dividend)}.`, 'Divide as usual. Put the decimal point in the answer straight above the decimal point in the dividend.', `${sayD(dividend)} divided by ${d}`, { kind: 'divw' });
    }
    throw new Error('no divWholeQ');
  }
  /* the dividend and divisor after moving both points so the divisor is whole */
  function moved(a, b) { const k = b.p; return { dividend: D(a.n * P10(Math.max(0, k - a.p)), Math.max(0, a.p - k)), divisor: b.n, k }; }
  function divDecQ(forceWhole) {
    for (let t = 0; t < 400; t++) {
      const whole = forceWhole != null ? forceWhole : Math.random() < 0.4, bp = rnd(1, 2), b = rd(bp, 0, bp === 1 ? 9 : 0), qp = rnd(0, 2), q = qp ? rd(qp, 0, 12) : D(rnd(2, 30), 0);
      const dividend = mul(q, b); if (dividend.p > 2 || dividend.n > 60000) continue;
      const isWhole = dividend.n % P10(dividend.p) === 0;
      if (whole !== isWhole) continue;
      if (b.n === P10(b.p)) continue;      // not 1
      const mv = moved(dividend, b), d = whole ? D(dividend.n / P10(dividend.p), 0) : dividend;
      const movedText = `${show(mv.dividend)} ÷ ${commas(String(mv.divisor))}`;
      return problem(`${show(d)} ÷ ${show(b)} = ?`, q, [D(q.n, q.p + 1), D(q.n, Math.max(0, q.p - 1)), D(q.n * 10, q.p)], `Make the divisor a whole number by moving both decimal points ${mv.k} place${mv.k === 1 ? '' : 's'} to the right (add zeros if you need to): ${show(d)} ÷ ${show(b)} becomes ${movedText}. Then divide: ${movedText} = ${endNote(q)}.`, 'Move the decimal point in the divisor to the right until it is a whole number. Move the point in the dividend the same number of places. Then divide.', `${sayD(d)} divided by ${sayD(b)}`, { kind: whole ? 'divwd' : 'divdd' });
    }
    throw new Error('no divDecQ');
  }

  /* ---------- estimate ---------- */
  const rnd0 = x => Math.floor(x.n / P10(x.p) + (x.n % P10(x.p) * 2 >= P10(x.p) ? 1 : 0));   // nearest whole number, half up
  function estimateQ() {
    for (let t = 0; t < 500; t++) {
      const op = pick(['+', '−', '×', '÷']);
      let a, b, exact;   // exact is { num, den }: the true value as a fraction
      if (op === '÷') {
        const rb = rnd(2, 9), ra = rb * rnd(2, 9), jit = () => (rnd(0, 1) ? 1 : -1) * rnd(3, 46);
        a = D(ra * 100 + jit(), 2); b = D(rb * 100 + jit(), 2); a = a.n % 100 === 0 ? D(a.n + 7, 2) : a; b = b.n % 100 === 0 ? D(b.n + 7, 2) : b;
        exact = { num: a.n * P10(b.p), den: b.n * P10(a.p) };
      } else {
        const pa = rnd(1, 2), pb = rnd(1, 2), big = op === '×' ? 9 : 99;
        a = rd(pa, 1, big); b = rd(pb, 1, big); if (op === '−') { if (!lt(b, a)) { const x = a; a = b; b = x; } }
        if ((op === '×') && rnd0(a) * rnd0(b) > 120) continue;
        const P = Math.max(a.p, b.p);
        exact = op === '+' ? { num: scaleTo(a, P) + scaleTo(b, P), den: P10(P) } : op === '−' ? { num: scaleTo(a, P) - scaleTo(b, P), den: P10(P) } : { num: a.n * b.n, den: P10(a.p + b.p) };
      }
      const ra = rnd0(a), rb2 = rnd0(b);
      if (ra < 1 || rb2 < 1 || (a.n % P10(a.p) * 2 === P10(a.p)) || (b.n % P10(b.p) * 2 === P10(b.p))) continue;   // no halves: the rounding must be clear
      const est = op === '+' ? ra + rb2 : op === '−' ? ra - rb2 : op === '×' ? ra * rb2 : (ra % rb2 ? NaN : ra / rb2);
      if (!(est >= 2) || est > 400) continue;
      const lowhi = (f, c) => op === '+' ? f(a) + f(b) : op === '−' ? f(a) - f(b) : op === '×' ? f(a) * f(b) : NaN;
      const fl = x => Math.floor(x.n / P10(x.p)), ce = x => Math.ceil(x.n / P10(x.p));
      const dist = w => Math.abs(w * exact.den - exact.num);   // distance from the true value, times the denominator
      const cands = [est * 10, op === '÷' ? est + rnd(2, 4) : lowhi(fl), op === '÷' ? est * 2 : lowhi(ce), est + rnd(5, 12), est * 10 + rnd(1, 9) * 10, est > 12 ? est - rnd(4, 9) : est + rnd(2, 6), Math.max(2, Math.round(est / 10) || 2)];
      const wrong = []; for (const w of cands) if (Number.isInteger(w) && w >= 1 && w !== est && !wrong.includes(w) && dist(w) > dist(est)) wrong.push(w);
      if (wrong.length < 3) continue;
      const verb = { '+': 'add', '−': 'subtract', '×': 'multiply', '÷': 'divide' }[op];
      const text = `${show(a)} ${op} ${show(b)}`;
      return { q: `Which is the best estimate of ${text}?`, a: String(est), wrong: shuffle(wrong).slice(0, 3).map(String), why: `Round each number to the nearest whole number: ${show(a)} rounds to ${ra} and ${show(b)} rounds to ${rb2}. Then ${verb}: ${ra} ${op} ${rb2} = ${est}.`, hint: 'Round each number to the nearest whole number first.', say: `Which is the best estimate of ${sayD(a)} ${SAY[op]} ${sayD(b)}?`, kind: 'est' };
    }
    throw new Error('no estimateQ');
  }

  /* ---------- word problems ---------- */
  const NAMES = ['Maya', 'Leo', 'Ana', 'Ben', 'Sam', 'Jo', 'Ravi', 'Zoe', 'Kai', 'Nora'];
  const money = (cents, trim) => '$' + dstr(cents, 2, false);
  const WORDS = [
    () => { const nm = pick(NAMES), a = rd(2, 1, 12), b = rd(2, 1, 9), s = add(a, b);
      return { k: 'w-add', q: `${nm} buys a notebook for $${show(a, false)} and a pen for $${show(b, false)}. How much does ${nm} spend in all? (in dollars)`, ans: s, why: `Add the prices: ${show(a, false)} + ${show(b, false)} = ${show(s, false)}. ${nm} spends $${show(s, false)}.`, hint: 'Add the two prices. Line up the decimal points.', seeds: [D(a.n + b.n, 1)] }; },
    () => { const nm = pick(NAMES), bill = pick([10, 20, 50]), c = rd(2, 1, bill / 2 - 1), ch = sub(D(bill, 0), c);
      return { k: 'w-change', q: `${nm} pays with a $${bill} bill for something that costs $${show(c, false)}. How much change does ${nm} get? (in dollars)`, ans: ch, why: `Subtract the cost from what ${nm} paid: ${bill}.00 − ${show(c, false)} = ${show(ch, false)}. The change is $${show(ch, false)}.`, hint: `Subtract the cost from ${bill}. Write ${bill} as ${bill}.00 so the points line up.`, seeds: [D(Math.abs(bill * 10 - c.n), 2)] }; },
    () => { const nm = pick(NAMES), pr = rd(2, 1, 4), n = rnd(3, 9), ans = mul(pr, D(n, 0)), item = pick(['grapes', 'apples', 'cheese', 'rice']);
      return { k: 'w-mulw', q: `One pound of ${item} costs $${show(pr, false)}. ${nm} buys ${n} pounds. How much does ${nm} pay? (in dollars)`, ans, why: `Multiply the price by the pounds: ${show(pr, false)} × ${n} = ${show(ans, false)}. ${nm} pays $${show(ans, false)}.`, hint: 'Multiply the price by the number of pounds.', seeds: [D(ans.n, 1), D(ans.n, 3)] }; },
    () => { for (let t = 0; t < 50; t++) { const nm = pick(NAMES), pa = rnd(1, 2), a = rd(pa, 0, 3), b = rd(1, 0, 4), ans = mul(a, b); if (ans.p > 3) continue;
      return { k: 'w-muld', q: `A recipe needs ${show(a)} cups of flour for one batch. ${nm} makes ${show(b)} batches. How many cups of flour does ${nm} need?`, ans, why: `Multiply: ${show(a)} × ${show(b)}. Ignoring the points, ${a.n} × ${b.n} = ${a.n * b.n}. The factors have ${a.p + b.p} decimal places in all: ${endNote(ans)} cups.`, hint: 'Multiply the cups per batch by the number of batches. Count the decimal places in both numbers.', seeds: [D(ans.n, Math.max(a.p, b.p))] }; } throw new Error('w-muld'); },
    () => { for (let t = 0; t < 100; t++) { const nm = pick(NAMES), n = pick([2, 3, 4, 5, 6, 8]), q = rd(rnd(1, 2), 0, 6), len = mul(q, D(n, 0)); if (len.n % P10(len.p) === 0) continue;
      return { k: 'w-divw', q: `A rope is ${show(len)} meters long. ${nm} cuts it into ${n} equal pieces. How long is each piece? (in meters)`, ans: q, why: `Divide the length by the number of pieces: ${show(len)} ÷ ${n} = ${endNote(q)}. Each piece is ${show(q)} meters.`, hint: 'Divide the length by the number of pieces. Put the point in the answer straight above the point in the length.', seeds: [D(q.n, q.p + 1)] }; } throw new Error('w-divw'); },
    () => { const n = pick([3, 4, 5, 6, 8]), q = rd(2, 1, 9), tot = mul(q, D(n, 0)), nm = pick(['friends', 'cousins', 'teammates']);
      return { k: 'w-split', q: `${n} ${nm} share a $${show(tot, false)} bill equally. How much does each person pay? (in dollars)`, ans: q, why: `Divide the bill by the number of people: ${show(tot, false)} ÷ ${n} = ${show(q, false)}. Each person pays $${show(q, false)}.`, hint: 'Divide the bill by the number of people.', seeds: [D(q.n, 1), D(q.n, 3)] }; },
    () => { for (let t = 0; t < 200; t++) { const dv = pick([D(5, 1), D(25, 2), D(2, 1), D(4, 1), D(75, 2), D(8, 1), D(15, 1), D(125, 2)]), W = rnd(3, 30);
      if ((W * P10(dv.p) * 1000) % dv.n) continue; const qn = (W * P10(dv.p) * 1000) / dv.n, q = D(qn, 3); if (qn % 1000) continue;   /* whole cups only, so there is one right answer */ const ans = qn % 1000 === 0 ? D(qn / 1000, 0) : (qn % 100 === 0 ? D(qn / 100, 1) : (qn % 10 === 0 ? D(qn / 10, 2) : q)); if (ans.n > 500) continue;
      const mv = moved(D(W, 0), dv);
      return { k: 'w-divd', q: `A jug holds ${W} liters of juice. How many ${show(dv)}-liter cups can be filled from it?`, ans, why: `Divide ${W} by ${show(dv)}. Move both points ${mv.k} place${mv.k === 1 ? '' : 's'} to the right: ${W} ÷ ${show(dv)} becomes ${commas(String(W * P10(mv.k)))} ÷ ${mv.divisor}, and ${commas(String(W * P10(mv.k)))} ÷ ${mv.divisor} = ${endNote(ans)}. So ${show(ans)} cups can be filled.`, hint: 'Divide the liters in the jug by the liters in one cup. Make the divisor a whole number first.', seeds: [D(ans.n, ans.p + 1), D(ans.n * 10, ans.p)] }; } throw new Error('w-divd'); },
    () => { for (let t = 0; t < 100; t++) { const a = rd(2, 10, 14), b = rd(1, 9, 13); if (!lt(b, a)) continue; const diff = sub(a, b), [n1, n2] = shuffle(['Ana', 'Ben', 'Kai', 'Zoe', 'Leo']);
      return { k: 'w-diff', q: `${n1} ran the race in ${show(a)} seconds. ${n2} ran it in ${show(b)} seconds. How many seconds faster was ${n2}?`, ans: diff, why: `Subtract the two times: ${show(a, false)} − ${show(D(scaleTo(b, 2), 2), false)} = ${show(diff, false)}. ${n2} was ${show(diff)} seconds faster.`, hint: 'Subtract the smaller time from the larger time. Write zeros so the points line up.', seeds: [D(Math.abs(a.n - b.n), 2)] }; } throw new Error('w-diff'); },
    () => { const nm = pick(NAMES), n = rnd(2, 5), pr = rd(2, 1, 4), pen = rd(2, 0, 3), prod = mul(pr, D(n, 0)), tot = add(prod, pen);
      return { k: 'w-two', q: `${nm} buys ${n} notebooks at $${show(pr, false)} each and a pen for $${show(pen, false)}. How much does ${nm} spend in all? (in dollars)`, ans: tot, why: `First find the cost of the notebooks: ${n} × ${show(pr, false)} = ${show(prod, false)}. Then add the pen: ${show(prod, false)} + ${show(pen, false)} = ${show(tot, false)}. ${nm} spends $${show(tot, false)}.`, hint: 'Two steps. Multiply to find the cost of the notebooks, then add the pen.', seeds: [D(prod.n + pen.n, 2), D(pr.n * n + pen.n, 3)] }; },
    () => { const a = rd(1, 1, 9), b = rd(2, 0, 9), c = rd(1, 1, 9), tot = add(add(a, b), c), nm = pick(NAMES);
      return { k: 'w-add3', q: `${nm} walks ${show(a)} km on Monday, ${show(b)} km on Tuesday, and ${show(c)} km on Wednesday. How many kilometers is that in all?`, ans: tot, why: `Add the three distances, lining up the decimal points: ${show(a, false)} + ${show(D(scaleTo(b, 2), 2), false)} + ${show(D(scaleTo(c, 2), 2), false)} = ${show(tot, false)}.`, hint: 'Add all three distances. Write zeros so the decimal points line up.', seeds: [D(a.n + b.n + c.n, 2)] }; }
  ];
  function wordsQ() {
    const w = pick(WORDS)(), ans = w.ans;
    return Object.assign(problem(w.q, ans, w.seeds, w.why, w.hint, w.q.replace(/\$(\d)/g, '$1 dollars'), { kind: w.k }));
  }

  /* ---------- review: missing numbers, three steps, bigger decimals ---------- */
  function missingQ() {
    for (let t = 0; t < 200; t++) {
      const type = pick(['addL', 'addR', 'subL', 'subR', 'mulL', 'mulR', 'divL', 'divR']);
      let x, text, why, seeds = [];
      if (type === 'addL' || type === 'addR') { const b = rd(rnd(1, 2), 0, 9), a = rd(rnd(1, 2), 0, 9), s = add(a, b); x = a; text = type === 'addL' ? `? + ${show(b)} = ${show(s)}` : `${show(b)} + ? = ${show(s)}`; why = `Use the opposite operation: ${show(s)} − ${show(b)} = ${endNote(x)}. Check: ${show(x)} + ${show(b)} = ${show(s)}.`; seeds = [add(s, b)]; }
      else if (type === 'subL') { const b = rd(rnd(1, 2), 0, 9), d = rd(rnd(1, 2), 0, 9), tot = add(b, d); x = tot; text = `? − ${show(b)} = ${show(d)}`; why = `Use the opposite operation: ${show(d)} + ${show(b)} = ${endNote(x)}. Check: ${show(x)} − ${show(b)} = ${show(d)}.`; seeds = [sub(lt(d, b) ? b : d, lt(d, b) ? d : b)].filter(z => z.n > 0); }
      else if (type === 'subR') { const a = rd(rnd(1, 2), 1, 12), d = rd(rnd(1, 2), 0, 9), b = add(a, D(0, 0)); const tot = add(a, d); x = d; text = `${show(tot)} − ? = ${show(a)}`; why = `Use the opposite operation: ${show(tot)} − ${show(a)} = ${endNote(x)}. Check: ${show(tot)} − ${show(x)} = ${show(a)}.`; seeds = [add(tot, a)]; }
      else if (type === 'mulL' || type === 'mulR') { const a = rd(rnd(1, 2), 0, 9), f = pick([D(2, 0), D(4, 0), D(5, 0), D(8, 0), D(3, 1), D(4, 1), D(5, 1), D(25, 2), D(12, 1), D(15, 1)]); if (a.p + f.p > 3) continue; const prod = mul(a, f); x = a; text = type === 'mulL' ? `? × ${show(f)} = ${show(prod)}` : `${show(f)} × ? = ${show(prod)}`; why = `Use the opposite operation: ${show(prod)} ÷ ${show(f)} = ${endNote(x)}. Check: ${show(x)} × ${show(f)} = ${show(prod)}.`; seeds = [mul(prod, f)]; }
      else if (type === 'divL') { const q = rd(rnd(1, 2), 0, 9), d = pick([D(2, 0), D(4, 0), D(5, 0), D(6, 0), D(2, 1), D(5, 1), D(4, 1), D(25, 2)]), dividend = mul(q, d); if (dividend.p > 3) continue; x = dividend; text = `? ÷ ${show(d)} = ${show(q)}`; why = `Use the opposite operation: ${show(q)} × ${show(d)} = ${endNote(x)}. Check: ${show(x)} ÷ ${show(d)} = ${show(q)}.`; seeds = [D(q.n, q.p)]; }
      else { const q = rd(rnd(1, 2), 0, 9), d = pick([D(2, 0), D(4, 0), D(5, 0), D(6, 0), D(2, 1), D(5, 1), D(4, 1)]), dividend = mul(q, d); if (dividend.p > 2) continue; x = d; text = `${show(dividend)} ÷ ? = ${show(q)}`; why = `Use the opposite operation: ${show(dividend)} ÷ ${show(q)} = ${endNote(x)}. Check: ${show(dividend)} ÷ ${show(x)} = ${show(q)}.`; seeds = [mul(q, dividend)]; }
      if (!(x.n > 0) || x.n > 100000) continue;
      return problem(text, x, seeds, why, 'Use the opposite operation to find the missing number.', text.replace('?', 'what number').replace(/[+−×÷]/g, c => SAY[c]).replace(/(\d+)\.(\d+)/g, (m, w, f) => w + ' point ' + f.split('').join(' ')).replace('=', 'equals'), { kind: 'miss' });
    }
    throw new Error('no missingQ');
  }
  function threeStepQ() {
    for (let t = 0; t < 300; t++) {
      const form = pick(['(a+b)×w', 'a×w+b', '(a−b)÷w', 'a×w−b', 'a+b×w']);
      const a = rd(rnd(1, 2), 1, 12), b = rd(rnd(1, 2), 0, 9), w = pick([2, 3, 4, 5, 6, 8]);
      let text, ans, why, seeds = [], steps;
      if (form === '(a+b)×w') { const s = add(a, b); ans = mul(s, D(w, 0)); text = `(${show(a)} + ${show(b)}) × ${w}`; steps = [`${show(a)} + ${show(b)} = ${show(s)}`, `${show(s)} × ${w} = ${endNote(ans)}`]; seeds = [add(mul(b, D(w, 0)), a)]; }
      else if (form === 'a×w+b') { const m = mul(a, D(w, 0)); ans = add(m, b); text = `${show(a)} × ${w} + ${show(b)}`; steps = [`${show(a)} × ${w} = ${show(m)}`, `${show(m)} + ${show(b)} = ${endNote(ans)}`]; seeds = [mul(add(a, b), D(w, 0))]; }
      else if (form === '(a−b)÷w') { const q = rd(rnd(1, 2), 1, 8), diff = mul(q, D(w, 0)), A = add(diff, b); ans = q; text = `(${show(A)} − ${show(b)}) ÷ ${w}`; steps = [`${show(A)} − ${show(b)} = ${show(diff)}`, `${show(diff)} ÷ ${w} = ${endNote(q)}`]; if (diff.n % P10(diff.p) === 0 && false) continue; }
      else if (form === 'a×w−b') { const m = mul(a, D(w, 0)); if (!lt(b, m)) continue; ans = sub(m, b); text = `${show(a)} × ${w} − ${show(b)}`; steps = [`${show(a)} × ${w} = ${show(m)}`, `${show(m)} − ${show(b)} = ${endNote(ans)}`]; seeds = [mul(sub(lt(b, a) ? a : b, lt(b, a) ? b : a), D(w, 0))].filter(z => z.n > 0); }
      else { const m = mul(b.n ? b : D(1, 0), D(w, 0)); ans = add(a, m); text = `${show(a)} + ${show(b.n ? b : D(1, 0))} × ${w}`; steps = [`${show(b.n ? b : D(1, 0))} × ${w} = ${show(m)}`, `${show(a)} + ${show(m)} = ${endNote(ans)}`]; seeds = [mul(add(a, b.n ? b : D(1, 0)), D(w, 0))]; }
      if (!(ans.n > 0) || ans.n > 100000 || ans.p > 3) continue;
      const lead = form === '(a+b)×w' || form === '(a−b)÷w' ? 'Do the parentheses first.' : 'Multiply before you add or subtract.';
      return problem(`Work it out: ${text}`, ans, seeds, `${lead} ${steps.join('. Then ')}.`, 'Work in order: grouping symbols first, then × and ÷, then + and −.', `Work it out: ${text.replace(/[+−×÷]/g, c => SAY[c]).replace(/[()]/g, c => c === '(' ? 'open parenthesis ' : ' close parenthesis').replace(/(\d+)\.(\d+)/g, (m, w2, f) => w2 + ' point ' + f.split('').join(' '))}`, { kind: 'three' });
    }
    throw new Error('no threeStepQ');
  }
  function bigQ() {
    const type = pick(['add', 'sub', 'mul']);
    if (type === 'add') { const a = rd(3, 10, 999), b = rd(rnd(1, 2), 10, 999), ans = add(a, b), P = ans.p; return problem(`${show(a)} + ${show(b)} = ?`, ans, [D(a.n + b.n, Math.max(a.p, b.p))], `Line up the decimal points: ${show(D(scaleTo(a, P), P), false)} + ${show(D(scaleTo(b, P), P), false)} = ${endNote(ans)}.`, HINT_ADD, `${sayD(a)} plus ${sayD(b)}`, { kind: 'big' }); }
    if (type === 'sub') { for (;;) { const a = rd(rnd(2, 3), 100, 999), b = rd(rnd(1, 3), 10, 99); if (!lt(b, a)) continue; const ans = sub(a, b), P = ans.p; return problem(`${show(a)} − ${show(b)} = ?`, ans, [D(Math.abs(a.n - b.n), Math.max(a.p, b.p))], `Line up the decimal points and add zeros: ${show(D(scaleTo(a, P), P), false)} − ${show(D(scaleTo(b, P), P), false)} = ${endNote(ans)}.`, 'Line up the decimal points. Write zeros so both numbers have the same number of places. Regroup if you need to.', `${sayD(a)} minus ${sayD(b)}`, { kind: 'big' }); } }
    const a = rd(1, 10, 99), w = rnd(11, 59), left = Math.random() < 0.5, ans = mul(a, D(w, 0));
    return problem(left ? `${w} × ${show(a)} = ?` : `${show(a)} × ${w} = ?`, ans, [D(ans.n, 0), D(ans.n, 2)], `Ignore the decimal point: ${a.n} × ${w} = ${commas(String(a.n * w))}. ${show(a)} has 1 decimal place, so the answer does too: ${endNote(ans)}.`, 'Ignore the decimal point and multiply. Then give the answer as many decimal places as the decimal had.', `${sayD(a)} times ${w}`, { kind: 'big' });
  }

  /* ---------- the study-guide helper: type two decimals and pick an operation ---------- */
  function parseDec(text, label) {
    let s = String(text == null ? '' : text).trim().replace(/,/g, '');
    if (!s) throw new Error(`Type a number in the ${label} box.`);
    if (/^-/.test(s)) throw new Error('Use positive numbers for now.');
    if (!/^\d*\.?\d*$/.test(s) || !/\d/.test(s)) throw new Error(`The ${label} box needs a decimal like 12.5, with only digits and one decimal point.`);
    let [w = '', f = ''] = s.split('.'); if (w.length > 6 || f.length > 4) throw new Error('Use up to 6 digits before the decimal point and 4 after.');
    f = f.replace(/0+$/, ''); w = w.replace(/^0+(?=\d)/, '') || '0';
    return D(Number(w + f), f.length);
  }
  function helper(aText, bText, op) {
    const a = parseDec(aText, 'first'), b = parseDec(bText, 'second'), rows = [];
    if (op === '+' || op === '−') {
      const P = Math.max(a.p, b.p), A = D(scaleTo(a, P), P), B = D(scaleTo(b, P), P);
      if (op === '−' && lt(a, b)) throw new Error('The first number must be at least as big as the second. Negative numbers come later.');
      const r = op === '+' ? add(a, b) : sub(a, b), sa = show(A, false), sb = show(B, false), sr = show(r, false), w = Math.max(sa.length, sb.length, sr.length) + 2;
      rows.push(a.p === b.p ? `Line up the decimal points: ${sa} and ${sb}.` : `Line up the decimal points, and write zeros so both numbers have ${P} decimal place${P === 1 ? '' : 's'}: ${sa} and ${sb}.`);
      rows.push({ col: [sa.padStart(w), (op + ' ' + sb).padStart(w), '-'.repeat(w), sr.padStart(w)].join('\n') });
      rows.push(`${op === '+' ? 'Add' : 'Subtract'} as if they were whole numbers: ${commas(String(A.n))} ${op} ${commas(String(B.n))} = ${commas(String(r.n))}.`);
      rows.push(`Bring the decimal point straight down: ${endNote(r)}.`);
      return { rows, answer: show(r), n: r.n, p: r.p };
    }
    if (op === '×') {
      const r = mul(a, b);
      rows.push(`Ignore the decimal points and multiply: ${commas(String(a.n))} × ${commas(String(b.n))} = ${commas(String(r.n))}.`);
      rows.push(`Count the decimal places in both numbers: ${a.p} + ${b.p} = ${r.p}.`);
      rows.push(r.p ? `Start at the right end of ${commas(String(r.n))} and move the point ${r.p} place${r.p === 1 ? '' : 's'} to the left${String(r.n).length <= r.p ? ' (write zeros in front if you run out of digits)' : ''}: ${endNote(r)}.` : `No decimal places, so the answer is ${show(r)}.`);
      return { rows, answer: show(r), n: r.n, p: r.p };
    }
    if (b.n === 0) throw new Error('You cannot divide by zero.');
    const mv = moved(a, b);
    let t = -1; for (let i = 0; i <= 4; i++) if ((mv.dividend.n * P10(i)) % mv.divisor === 0) { t = i; break; }
    if (t < 0) throw new Error('That one does not come out evenly in a few decimal places. Try numbers that divide evenly, like 4.8 ÷ 0.6.');
    const q = D((mv.dividend.n * P10(t)) / mv.divisor, mv.dividend.p + t);
    rows.push(mv.k ? `Make the divisor a whole number: move the point ${mv.k} place${mv.k === 1 ? '' : 's'} to the right in both numbers (add zeros if you need to). ${show(a)} ÷ ${show(b)} becomes ${show(mv.dividend)} ÷ ${commas(String(mv.divisor))}.` : `The divisor ${show(b)} is already a whole number, so the points stay where they are.`);
    rows.push(`Divide as with whole numbers, and put the point in the answer straight above the point in the dividend${t ? ` (add zeros after the last digit of the dividend to keep going)` : ''}: ${show(mv.dividend)} ÷ ${commas(String(mv.divisor))} = ${endNote(q)}.`);
    rows.push(`Check by multiplying: ${show(q)} × ${show(b)} = ${show(mul(q, b))}.`);
    return { rows, answer: show(q), n: q.n, p: q.p };
  }

  const KIND_FOR_TOOL = { add: addQ, subtract: subQ };
  const DECGEN = { dstr, parseDec, helper, addQ, subQ, mulWholeQ, mulDecQ, divWholeQ, divDecQ, estimateQ, wordsQ, missingQ, threeStepQ, bigQ, WORDS };
  if (typeof module !== 'undefined') module.exports = DECGEN; else root.DECGEN = DECGEN;
})(typeof window !== 'undefined' ? window : globalThis);
