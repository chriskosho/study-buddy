/* Rounding and Place Value to 1,000 (3rd grade): problem generators and the pictures. Every problem is made fresh with its answer,
   a hint, and an explanation. Whole numbers only. A number exactly halfway rounds up (45 to 50, 450 to 500).
   Runs in the browser, and in Node for the generator check (_dev/tests/gen_check_rounding.mjs). */
(function (root) {
  'use strict';
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = s => (typeof SB !== 'undefined' && SB.esc) ? SB.esc(s) : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const fmt = n => n.toLocaleString('en-US');
  const uniq = a => [...new Set(a)];

  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  function words(n) {
    if (n === 1000) return 'one thousand';
    const h = Math.floor(n / 100), r = n % 100, out = [];
    if (h) out.push(ONES[h] + ' hundred');
    if (r) out.push(r < 20 ? ONES[r] : TENS[Math.floor(r / 10)] + (r % 10 ? '-' + ONES[r % 10] : ''));
    return out.join(' ') || 'zero';
  }
  const roundTo = (n, s) => Math.floor((n + s / 2) / s) * s;   // half rounds up
  const digits = n => [Math.floor(n / 100) % 10, Math.floor(n / 10) % 10, n % 10];
  const expForm = n => { const [h, t, o] = digits(n); return [h && h * 100, t && t * 10, o].filter(x => x).join(' + ') || '0'; };
  const sumOf = s => s.split(' + ').reduce((x, y) => x + Number(y), 0);
  const PLACE = ['hundreds', 'tens', 'ones'];

  /* ---------- pictures ---------- */
  /* number line between the two nearest multiples of `step`, with the halfway mark and the number */
  function roundLine(n, step) {
    const lo = n % step === 0 ? n : Math.floor(n / step) * step, hi = lo + step, mid = lo + step / 2;
    const px = v => 70 + (v - lo) / step * 460;
    const down = n % step < step / 2, up = n % step >= step / 2 && n % step !== 0;
    return `<svg class="rl" viewBox="0 0 600 140" role="img" aria-label="A number line from ${lo} to ${hi}. The halfway mark is ${mid}. The number ${n} is ${n === lo ? 'at' : n < mid ? 'before' : n === mid ? 'at' : 'after'} the halfway mark."><line class="ln" x1="50" y1="76" x2="550" y2="76"/>` +
      [lo, mid, hi].map(v => `<line class="tk${v === mid ? ' mid' : ''}" x1="${px(v)}" y1="${v === mid ? 66 : 60}" x2="${px(v)}" y2="${v === mid ? 86 : 92}"/>`).join('') +
      `<text class="end" x="${px(lo)}" y="122" text-anchor="middle">${fmt(lo)}</text><text class="end" x="${px(hi)}" y="122" text-anchor="middle">${fmt(hi)}</text>` +
      `<text class="half" x="${px(mid)}" y="116" text-anchor="middle">halfway</text><text class="half" x="${px(mid)}" y="134" text-anchor="middle">${fmt(mid)}</text>` +
      `<circle class="pt" cx="${px(n)}" cy="76" r="10"/><text class="num" x="${px(n)}" y="46" text-anchor="middle">${fmt(n)}</text></svg>`;
  }
  const wrapSvg = svg => `<div class="rlwrap">${svg}</div>`;

  /* ---------- place value ---------- */
  function threeDistinct() {   // a 3-digit number whose digits are all different
    for (;;) { const n = rnd(102, 987), d = digits(n); if (new Set(d).size === 3) return n; }
  }
  function placeValueQ() {   // value of one digit
    const n = threeDistinct(), d = digits(n), i = pick([0, 1, 2].filter(k => d[k] !== 0)), v = d[i] * 10 ** (2 - i);
    const wrong = uniq([d[i], d[i] * 10, d[i] * 100, d[(i + 1) % 3] * 10 ** (2 - (i + 1) % 3)].filter(x => x !== v && x > 0)).slice(0, 3);
    if (wrong.length < 3) return placeValueQ();
    return { q: `What is the value of the ${d[i]} in ${n}?`, a: fmt(v), wrong: wrong.map(fmt), why: `The ${d[i]} is in the ${PLACE[i]} place, so its value is ${fmt(v)}.`, hint: 'Which place is the digit in? Hundreds, tens, or ones?', say: `What is the value of the ${d[i]} in ${n}?` };
  }
  function placeDigitQ() {   // which digit is in a place
    const n = threeDistinct(), d = digits(n), i = rnd(0, 2), other = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(x => !d.includes(x));
    const wrong = [...d.filter((_, k) => k !== i), pick(other)];
    return { q: `Which digit is in the ${PLACE[i]} place in ${n}?`, a: String(d[i]), wrong: shuffle(wrong).map(String), why: `${n} has ${d[0]} hundreds, ${d[1]} tens, and ${d[2]} ones. The digit in the ${PLACE[i]} place is ${d[i]}.`, hint: 'Hundreds are on the left, then tens, then ones.', say: `Which digit is in the ${PLACE[i]} place in ${n}?` };
  }
  function placeExpandedQ() {
    for (let tries = 0; tries < 200; tries++) {
      const n = rnd(101, 999), [h, t, o] = digits(n); if ([h, t, o].filter(Boolean).length < 2) continue;
      const cand = [[h, o, t], [t, h, o], [o, t, h]].map(([a, b, c]) => expForm(a * 100 + b * 10 + c)), plain = [h, t, o].filter(Boolean).join(' + '),
        shift = [h && h * 10, t && t * 10, o].filter(x => x).join(' + ');
      const wrong = uniq([...cand, plain, shift].filter(s => sumOf(s) !== n));
      if (wrong.length < 3) continue;
      return { q: `Which is the expanded form of ${n}?`, a: expForm(n), wrong: shuffle(wrong).slice(0, 3), why: `${n} has ${h} hundred${h === 1 ? '' : 's'}, ${t} ten${t === 1 ? '' : 's'}, and ${o} one${o === 1 ? '' : 's'}, so ${n} = ${expForm(n)}.${[t, o].includes(0) ? ' A zero place adds nothing, so it is left out.' : ''}`, hint: 'Write each digit with its place value, then add.', say: `Which is the expanded form of ${n}?` };
    }
    throw new Error('no expanded');
  }
  function placeWordQ() {   // numerals <-> words
    for (let tries = 0; tries < 200; tries++) {
      const n = rnd(101, 999), [h, t, o] = digits(n), near = uniq([h * 100 + o * 10 + t, t * 100 + h * 10 + o, h * 100 + (t === 9 ? 1 : t + 1) * 10 + o, (h === 9 ? 1 : h + 1) * 100 + t * 10 + o, h * 100 + t * 10 + (o === 9 ? 1 : o + 1)]).filter(x => x !== n && x > 100 && x < 1000);
      if (near.length < 3) continue;
      const w = shuffle(near).slice(0, 3);
      if (Math.random() < 0.5) return { q: `Which number is ${words(n)}?`, a: fmt(n), wrong: w.map(fmt), why: `${words(n)} means ${h} hundred${h === 1 ? '' : 's'}${t || o ? `, ${t ? `${t} ten${t === 1 ? '' : 's'}` : ''}${t && o ? ' and ' : ''}${o ? `${o} one${o === 1 ? '' : 's'}` : ''}` : ''}: ${n}.`, hint: 'Say the hundreds first, then the tens and ones.', say: `Which number is ${words(n)}?` };
      return { q: `Which is ${n} in words?`, a: words(n), wrong: w.map(words), why: `${n} is ${h} hundred${h === 1 ? '' : 's'}, then ${t * 10 + o}: ${words(n)}.`, hint: 'Say the hundreds first, then the tens and ones.', say: `Which is ${n} in words?` };
    }
    throw new Error('no word');
  }

  /* ---------- compare ---------- */
  function compareSymQ() {
    const eq = Math.random() < 0.15;
    let a, b, left = null;
    if (eq) { a = rnd(101, 999); b = a; left = expForm(a).includes('+') ? expForm(a) : String(a); }
    else { for (;;) { a = rnd(100, 999); b = Math.random() < 0.5 ? a + pick([-1, 1, -10, 10, -11, 11, -100, 100]) : rnd(100, 999); if (b >= 100 && b <= 999 && a !== b) break; } }
    const sym = a < b ? '<' : a > b ? '>' : '=', text = `${left || a}  ___  ${b}`;
    const why = eq ? `${left} = ${a}, so it is the same as ${b}. Use =.` : `Compare from the left. ${digits(a)[0] !== digits(b)[0] ? `${a} has ${digits(a)[0]} hundreds and ${b} has ${digits(b)[0]}.` : digits(a)[1] !== digits(b)[1] ? `The hundreds match. ${a} has ${digits(a)[1]} tens and ${b} has ${digits(b)[1]}.` : `The hundreds and tens match. ${a} has ${digits(a)[2]} ones and ${b} has ${digits(b)[2]}.`} So ${a} ${sym} ${b}.`;
    return { q: `Which symbol makes this true? ${text}`, a: sym, wrong: ['<', '>', '='].filter(x => x !== sym), why, hint: 'Compare the hundreds first. If they match, compare the tens, then the ones.', say: `Which symbol makes this true? ${eq ? left : a} blank ${b}` };
  }
  function compareOrderQ() {
    for (let tries = 0; tries < 200; tries++) {
      const base = rnd(1, 8) * 100, nums = uniq(Array.from({ length: 4 }, () => Math.random() < 0.6 ? base + rnd(0, 99) : rnd(100, 999)));
      if (nums.length < 4) continue;
      const asc = Math.random() < 0.5, sorted = [...nums].sort((x, y) => asc ? x - y : y - x), right = sorted.join(', ');
      const opts = new Set([[...sorted].reverse().join(', ')]);
      for (let k = 0; k < 30 && opts.size < 3; k++) { const p = shuffle(nums).join(', '); if (p !== right) opts.add(p); }
      const wrong = [...opts].filter(s => s !== right);
      if (wrong.length < 3) continue;
      return { q: `Which list is in order from ${asc ? 'least to greatest' : 'greatest to least'}? Pick the right list.`, a: right, wrong: shuffle(wrong).slice(0, 3), why: `Compare the hundreds first, then the tens, then the ones. From ${asc ? 'least to greatest' : 'greatest to least'}: ${right}.`, hint: 'Find the number with the fewest (or most) hundreds first.', say: `Which list is in order from ${asc ? 'least to greatest' : 'greatest to least'}?` };
    }
    throw new Error('no order');
  }

  /* ---------- rounding ---------- */
  function roundWhy(n, step) {
    const lo = Math.floor(n / step) * step, hi = lo + step, r = roundTo(n, step), name = step === 10 ? 'tens' : 'hundreds', keep = step === 10 ? n % 10 : Math.floor((n % 100) / 10), unit = step === 10 ? 'ones' : 'tens';
    const rule = step === 10 ? (n % 10 === 5 ? 'The ones digit is 5, exactly halfway, and halfway rounds up.' : n % 10 > 5 ? `The ones digit is ${keep}, which is 5 or more, so round up.` : `The ones digit is ${keep}, which is less than 5, so round down.`)
      : (n % 100 === 50 ? 'The tens digit is 5 and the ones digit is 0: exactly halfway, and halfway rounds up.' : keep >= 5 ? `The tens digit is ${keep}, which is 5 or more, so round up.` : `The tens digit is ${keep}, which is less than 5, so round down.`);
    return `${fmt(n)} is between ${fmt(lo)} and ${fmt(hi)}. The halfway mark is ${fmt(lo + step / 2)}. ${rule} ${fmt(n)} rounds to ${fmt(r)}.`;
  }
  function roundQ(step) {
    for (let tries = 0; tries < 400; tries++) {
      const half = Math.random() < 0.15, n = half ? rnd(1, 99) * step + step / 2 - (step === 100 ? 0 : 0) : rnd(step === 10 ? 11 : 101, 999);
      const nn = half ? (step === 10 ? rnd(1, 99) * 10 + 5 : rnd(1, 9) * 100 + 50) : n;
      if (nn % step === 0 || nn > 999) continue;
      const lo = Math.floor(nn / step) * step, hi = lo + step, r = roundTo(nn, step), other = r === lo ? hi : lo;
      const wrong = uniq([other, step === 10 ? roundTo(nn, 100) : roundTo(nn, 10), r === hi ? hi + step : Math.max(lo - step, 0), nn].filter(x => x !== r && x > 0 && x <= 1000)).slice(0, 3);
      if (wrong.length < 3) continue;
      return { q: `Round ${fmt(nn)} to the nearest ${step}.`, html: wrapSvg(roundLine(nn, step)), a: r, wrong, why: roundWhy(nn, step), hint: `Which two ${step === 10 ? 'tens' : 'hundreds'} is it between? Is it before or after the halfway mark?`, say: `Round ${nn} to the nearest ${step}.` };
    }
    throw new Error('no round');
  }
  const round10Q = () => roundQ(10), round100Q = () => roundQ(100);

  /* ---------- estimate ---------- */
  function estimateQ(op) {   // op: '+' or '−'
    for (let tries = 0; tries < 400; tries++) {
      const step = pick([10, 100]);
      let a = rnd(101, 899), b = rnd(51, 799);
      if (op === '+' && a + b > 999) continue;
      if (op === '−') { if (a <= b) [a, b] = [b, a]; if (a - b < 60) continue; }
      if (a % step === 0 || b % step === 0 || a % step === step / 2 || b % step === step / 2) continue;
      const ra = roundTo(a, step), rb = roundTo(b, step), est = op === '+' ? ra + rb : ra - rb, exact = op === '+' ? a + b : a - b;
      if (est <= 0 || est > 1000 || est === exact) continue;
      const down = x => Math.floor(x / step) * step, up = x => Math.ceil(x / step) * step, other = step === 10 ? 100 : 10;
      const cand = uniq([exact, op === '+' ? down(a) + down(b) : down(a) - down(b), op === '+' ? up(a) + up(b) : up(a) - up(b), op === '+' ? roundTo(a, other) + roundTo(b, other) : roundTo(a, other) - roundTo(b, other), est + step, est - step].filter(x => x !== est && x > 0 && x <= 1000));
      if (cand.length < 3) continue;
      const ws = shuffle(cand).slice(0, 3);
      return { q: `Estimate ${fmt(a)} ${op} ${fmt(b)}: round each number to the nearest ${step}, then ${op === '+' ? 'add' : 'subtract'}.`, a: fmt(est), wrong: ws.map(fmt), why: `${fmt(a)} rounds to ${fmt(ra)} and ${fmt(b)} rounds to ${fmt(rb)}. ${fmt(ra)} ${op} ${fmt(rb)} = ${fmt(est)}. The exact answer is ${fmt(exact)}, so the estimate is close.`, hint: `Round both numbers to the nearest ${step} first. Then ${op === '+' ? 'add' : 'subtract'} the rounded numbers.`, say: `Estimate ${a} ${op === '+' ? 'plus' : 'minus'} ${b}. Round each number to the nearest ${step}, then ${op === '+' ? 'add' : 'subtract'}.` };
    }
    throw new Error('no estimate');
  }
  const estimateSumQ = () => estimateQ('+'), estimateDiffQ = () => estimateQ('−');
  const estimatePickQ = () => (Math.random() < 0.5 ? estimateSumQ : estimateDiffQ)();

  /* ---------- add and subtract within 1,000 ---------- */
  const noCarry = (a, b) => { const x = digits(a), y = digits(b); return x.map((d, i) => (d + y[i]) % 10).reduce((s, d) => s * 10 + d, 0); };
  const noBorrow = (a, b) => { const x = digits(a), y = digits(b); return x.map((d, i) => Math.abs(d - y[i])).reduce((s, d) => s * 10 + d, 0); };
  function addQ() {
    for (let tries = 0; tries < 300; tries++) {
      const regroup = Math.random() < 0.6, a = rnd(120, 899), b = rnd(11, 999 - a), [x, y] = [digits(a), digits(b)], carries = x.some((d, i) => d + y[i] >= 10);
      if (carries !== regroup || a + b > 1000) continue;
      const r = a + b, wrong = uniq([noCarry(a, b), r + 10, r - 10, r + 100, r - 100].filter(v => v !== r && v > 0));
      if (wrong.length < 3) continue;
      return { q: `${fmt(a)} + ${fmt(b)} = ?`, a: r, wrong: shuffle(wrong).slice(0, 3), why: `Add the ones, then the tens, then the hundreds${regroup ? ', and regroup when a place has 10 or more' : ''}. ${fmt(a)} + ${fmt(b)} = ${fmt(r)}.`, hint: 'Start with the ones. If a place adds up to 10 or more, carry to the next place.', say: `${a} plus ${b}` };
    }
    throw new Error('no add');
  }
  function subQ() {
    for (let tries = 0; tries < 300; tries++) {
      const regroup = Math.random() < 0.6, a = rnd(200, 999), b = rnd(11, a - 10), [x, y] = [digits(a), digits(b)], borrows = x.some((d, i) => d < y[i]);
      if (borrows !== regroup) continue;
      const r = a - b, wrong = uniq([noBorrow(a, b), r + 10, r - 10, r + 100, r - 100].filter(v => v !== r && v > 0));
      if (wrong.length < 3) continue;
      return { q: `${fmt(a)} − ${fmt(b)} = ?`, a: r, wrong: shuffle(wrong).slice(0, 3), why: `Subtract the ones, then the tens, then the hundreds${regroup ? ', and regroup (take 1 from the next place to the left) when the top digit is smaller' : ''}. ${fmt(a)} − ${fmt(b)} = ${fmt(r)}.`, hint: 'Start with the ones. If the top digit is smaller, regroup from the next place.', say: `${a} minus ${b}` };
    }
    throw new Error('no sub');
  }

  /* ---------- word problems (typed) ---------- */
  const NAMES = ['Mia', 'Noah', 'Ava', 'Eli', 'Zoe', 'Leo', 'Ivy', 'Sam'];
  const wordsQ = (() => {
    const T = [
      () => { const n = rnd(111, 989); if (n % 10 === 0) return null; const r = roundTo(n, 10); return { q: `${fmt(n)} people came to the school fair. To the nearest 10, about how many people came?`, a: r, why: roundWhy(n, 10), hint: 'Look at the ones digit: 5 or more rounds up.', say: `${n} people came to the school fair. To the nearest 10, about how many people came?` }; },
      () => { const n = rnd(120, 989); if (n % 100 === 0) return null; const r = roundTo(n, 100); return { q: `A bakery sold ${fmt(n)} muffins in a month. To the nearest 100, about how many muffins is that?`, a: r, why: roundWhy(n, 100), hint: 'Look at the tens digit: 5 or more rounds up.', say: `A bakery sold ${n} muffins in a month. To the nearest 100, about how many muffins is that?` }; },
      () => { const nm = pick(NAMES), a = rnd(120, 599), b = rnd(120, 999 - a); return { q: `${nm} read ${fmt(a)} pages in March and ${fmt(b)} pages in April. How many pages did ${nm} read in all?`, a: a + b, why: `In all means add: ${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}.`, hint: 'In all means add.', say: `${nm} read ${a} pages in March and ${b} pages in April. How many pages in all?` }; },
      () => { const a = rnd(300, 999), b = rnd(60, a - 40); return { q: `A box holds ${fmt(a)} beads. ${fmt(b)} are red and the rest are blue. How many beads are blue?`, a: a - b, why: `The rest means subtract: ${fmt(a)} − ${fmt(b)} = ${fmt(a - b)} blue beads.`, hint: 'The rest means subtract the red from the total.', say: `A box holds ${a} beads. ${b} are red and the rest are blue. How many are blue?` }; },
      () => { const a = rnd(101, 449), b = rnd(101, 449); if (a % 100 === 0 || b % 100 === 0 || a % 100 === 50 || b % 100 === 50) return null; const e = roundTo(a, 100) + roundTo(b, 100); return { q: `One truck carries ${fmt(a)} boxes and another carries ${fmt(b)} boxes. Round each number to the nearest 100, then add to estimate how many boxes in all.`, a: e, why: `${fmt(a)} rounds to ${fmt(roundTo(a, 100))} and ${fmt(b)} rounds to ${fmt(roundTo(b, 100))}. ${fmt(roundTo(a, 100))} + ${fmt(roundTo(b, 100))} = ${fmt(e)}.`, hint: 'Round each number first. Then add.', say: `One truck carries ${a} boxes and another carries ${b} boxes. Round each number to the nearest 100, then add to estimate.` }; },
      () => { const nm = pick(NAMES), a = rnd(300, 999), b = rnd(100, a - 50); return { q: `${nm} has ${fmt(a)} stickers. ${nm}'s friend has ${fmt(b)} stickers. How many more stickers does ${nm} have?`, a: a - b, why: `How many more means subtract: ${fmt(a)} − ${fmt(b)} = ${fmt(a - b)}.`, hint: 'How many more means subtract the smaller number from the larger.', say: `${nm} has ${a} stickers. The friend has ${b}. How many more does ${nm} have?` }; },
      () => { const h = rnd(1, 9), t = rnd(0, 9), o = rnd(0, 9); if (!t && !o) return null; const n = h * 100 + t * 10 + o; return { q: `A number has ${h} hundred${h === 1 ? '' : 's'}, ${t} ten${t === 1 ? '' : 's'}, and ${o} one${o === 1 ? '' : 's'}. What is the number?`, a: n, why: `${h * 100} + ${t * 10} + ${o} = ${n}.`, hint: 'Hundreds go on the left, then tens, then ones. A zero holds an empty place.', say: `A number has ${h} hundreds, ${t} tens, and ${o} ones. What is the number?` }; }
    ];
    return () => { for (let i = 0; i < 100; i++) { const r = pick(T)(); if (r) return r; } throw new Error('no word problem'); };
  })();

  /* ---------- study guide helpers ---------- */
  function chart(raw) {   // returns { h, t, o, expanded, words }
    const s = String(raw).replace(/[,\s]/g, '');
    if (!/^\d+$/.test(s)) throw new Error('Type a whole number from 0 to 1,000.');
    const n = Number(s); if (n > 1000) throw new Error('Type a whole number from 0 to 1,000.');
    const [h, t, o] = digits(n);
    return { n, h, t, o, thousand: n === 1000, expanded: n === 1000 ? '1,000' : expForm(n), words: words(n) };
  }
  function roundNote(n, step) {
    const r = roundTo(n, step), lo = Math.floor(n / step) * step;
    if (n % step === 0) return `${fmt(n)} is already a multiple of ${step}, so it stays ${fmt(n)}.`;
    return `${fmt(n)} is between ${fmt(lo)} and ${fmt(lo + step)}. Halfway is ${fmt(lo + step / 2)}. ${fmt(n)} is ${n % step === step / 2 ? 'exactly at' : n % step > step / 2 ? 'past' : 'before'} halfway, so round ${r > n ? 'up' : 'down'} to ${fmt(r)}.`;
  }

  const RPVGEN = { words, roundTo, digits, expForm, fmt, roundLine, placeValueQ, placeDigitQ, placeExpandedQ, placeWordQ, compareSymQ, compareOrderQ, round10Q, round100Q, estimateSumQ, estimateDiffQ, estimatePickQ, addQ, subQ, wordsQ, chart, roundNote };
  if (typeof module !== 'undefined') module.exports = RPVGEN; else root.RPVGEN = RPVGEN;
})(typeof window !== 'undefined' ? window : globalThis);
