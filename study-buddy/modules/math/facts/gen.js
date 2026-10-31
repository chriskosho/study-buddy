/* Multiplication and Division Facts (3rd grade): problem generators. Facts are 0 to 10 times 0 to 10 and the matching division facts
   (no remainders). Every problem is made fresh with its answer, a hint, and an explanation. Whole numbers only.
   Runs in the browser, and in Node for the generator check (_dev/tests/gen_check_facts.mjs). */
(function (root) {
  'use strict';
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  /* three wrong numbers: the likely slips first (candidates), then numbers close to the answer */
  function wrongNums(ans, cands, n = 3) {
    const out = [];
    [...cands, ans + 1, ans - 1, ans + 2, ans - 2, ans + 10, ans - 10, ans * 2].forEach(x => { if (Number.isInteger(x) && x >= 0 && x !== ans && !out.includes(x)) out.push(x); });
    return out.slice(0, n);
  }
  const NAMES = ['Mia', 'Leo', 'Ava', 'Sam', 'Noah', 'Zoe', 'Kai', 'Ruby'];

  /* ---------- the strategy for a multiplication fact ---------- */
  function strategy(a, b) {
    const p = a * b, s = Math.min(a, b), l = Math.max(a, b);
    if (a === 0 || b === 0) return { why: `Any number times 0 is 0. ${a} × ${b} = 0.`, hint: 'Zero groups, or zero in each group, is nothing.' };
    if (a === 1 || b === 1) return { why: `Any number times 1 is that number. ${a} × ${b} = ${p}.`, hint: 'One group of a number is just that number.' };
    if (s === 10) return { why: `Times 10: put a 0 after the other number. ${l} × 10 = ${p}.`, hint: 'Write the other number, then put a 0 after it.' };
    if (s === 2) return { why: `Two groups of ${l} is a double: ${l} + ${l} = ${p}.`, hint: 'Double the other number.' };
    if (s === 5) return { why: `Count by 5s, ${l} times: ${Array.from({ length: l }, (_, i) => 5 * (i + 1)).join(', ')}. So ${a} × ${b} = ${p}.`, hint: 'Count by 5s.' };
    if (s === 9) return { why: `Ten ${l}s is ${10 * l}. Take away one ${l}: ${10 * l} − ${l} = ${p}.`, hint: 'Do the times 10 fact, then take away one group.' };
    if (s === 3) return { why: `Two ${l}s is ${2 * l}. Add one more ${l}: ${2 * l} + ${l} = ${p}.`, hint: 'Use the double, then add one more group.' };
    if (s === 4) return { why: `Double ${l} is ${2 * l}. Double that: ${2 * l} + ${2 * l} = ${p}.`, hint: 'Double, then double again.' };
    return { why: `Break ${s} into 5 and ${s - 5}. 5 × ${l} = ${5 * l} and ${s - 5} × ${l} = ${(s - 5) * l}. ${5 * l} + ${(s - 5) * l} = ${p}.`, hint: 'Use the times 5 fact, then add the rest.' };
  }

  /* ---------- multiplication facts (type the answer) ---------- */
  function timesQ() {
    let a, b;
    do { a = rnd(0, 10); b = rnd(0, 10); } while ((a <= 1 || b <= 1) && Math.random() < 0.7);
    const p = a * b, st = strategy(a, b);
    return { q: `${a} × ${b} = ?`, a: p, wrong: wrongNums(p, [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, a + b]), why: st.why, hint: st.hint, say: `${a} times ${b}` };
  }

  /* ---------- division facts (type the answer) ---------- */
  function divideQ() {
    let d, q;
    do { d = rnd(1, 10); q = rnd(0, 10); } while ((d === 1 || q === 0) && Math.random() < 0.8);
    const n = d * q;
    const why = q === 0 ? `0 shared into ${d} ${d === 1 ? 'group' : 'groups'} is 0 each. Check: ${d} × 0 = 0, so ${n} ÷ ${d} = 0.`
      : d === 1 ? `Dividing by 1 leaves the number the same. ${n} ÷ 1 = ${n}.` : `Think of the multiplication fact: ${d} × ${q} = ${n}. So ${n} ÷ ${d} = ${q}.`;
    return { q: `${n} ÷ ${d} = ?`, a: q, wrong: wrongNums(q, [q + 1, q - 1, d, n - d, q + 2]), why, hint: `What number times ${d} makes ${n}?`, say: `${n} divided by ${d}` };
  }

  /* ---------- missing numbers (type the answer) ---------- */
  function missingQ() {
    const a = rnd(2, 10), b = rnd(2, 10), p = a * b, form = pick(['f1', 'f2', 'f3', 'f4']);
    if (form === 'f1') return { q: `Find the missing number: ${a} × ? = ${p}`, a: b, wrong: wrongNums(b, [a, b + 1, b - 1]), why: `${a} × ? = ${p} means ${p} ÷ ${a}. ${p} ÷ ${a} = ${b}. Check: ${a} × ${b} = ${p}.`, hint: `Think ${p} ÷ ${a}.`, say: `${a} times what number equals ${p}?` };
    if (form === 'f2') return { q: `Find the missing number: ? × ${b} = ${p}`, a: a, wrong: wrongNums(a, [b, a + 1, a - 1]), why: `? × ${b} = ${p} means ${p} ÷ ${b}. ${p} ÷ ${b} = ${a}. Check: ${a} × ${b} = ${p}.`, hint: `Think ${p} ÷ ${b}.`, say: `What number times ${b} equals ${p}?` };
    if (form === 'f3') return { q: `Find the missing number: ${p} ÷ ? = ${b}`, a: a, wrong: wrongNums(a, [b, p, a + 1]), why: `${p} ÷ ? = ${b} means ? × ${b} = ${p}. ${a} × ${b} = ${p}, so the missing number is ${a}.`, hint: `What number times ${b} makes ${p}?`, say: `${p} divided by what number equals ${b}?` };
    return { q: `Find the missing number: ? ÷ ${a} = ${b}`, a: p, wrong: wrongNums(p, [p + a, p - a, a + b, p + b]), why: `? ÷ ${a} = ${b} means ${b} × ${a} = ?. ${b} × ${a} = ${p}, so the missing number is ${p}.`, hint: `Multiply the answer ${b} by ${a}.`, say: `What number divided by ${a} equals ${b}?` };
  }

  /* ---------- fact families (multiple choice) ---------- */
  const isFamily = t => { const s = [...t].sort((x, y) => x - y); return s[0] * s[1] === s[2]; };
  function familyFactQ() {
    for (let tries = 0; tries < 200; tries++) {
      const a = rnd(2, 9), b = rnd(2, 9), p = a * b;
      const good = [`${a} × ${b} = ${p}`, `${b} × ${a} = ${p}`, `${p} ÷ ${a} = ${b}`, `${p} ÷ ${b} = ${a}`];
      const bad = [[`${a} + ${b} = ${p}`, a + b === p], [`${p} × ${a} = ${b}`, p * a === b], [`${a} ÷ ${p} = ${b}`, a / p === b], [`${b} − ${a} = ${p}`, b - a === p],
        [`${p} − ${a} = ${b}`, p - a === b], [`${a} × ${p} = ${b}`, a * p === b], [`${p} ÷ ${a} = ${a}`, p / a === a], [`${p} + ${b} = ${a}`, p + b === a]].filter(x => !x[1]).map(x => x[0]);
      const wrong = [...new Set(bad)].filter(x => !good.includes(x));
      if (wrong.length < 3) continue;
      const right = pick(good);
      return { q: `Which fact belongs to the fact family of ${a}, ${b}, and ${p}?`, a: right, wrong: shuffle(wrong).slice(0, 3), why: `A fact family uses the same three numbers: ${a} × ${b} = ${p}, ${b} × ${a} = ${p}, ${p} ÷ ${a} = ${b}, and ${p} ÷ ${b} = ${a}. ${right} is one of them.`, hint: `The two small numbers multiply to make ${p}. The big number is the product, or the number you divide.`, say: `Which fact belongs to the fact family of ${a}, ${b}, and ${p}?` };
    }
    throw new Error('no familyFactQ');
  }
  function familyTrioQ() {
    for (let tries = 0; tries < 200; tries++) {
      const a = rnd(2, 9), b = rnd(2, 9), p = a * b, fmt = t => `${t[0]}, ${t[1]}, ${t[2]}`;
      const right = fmt([a, b, p]), seen = new Set([right]), wrong = [];
      for (const t of shuffle([[a, b, p + 1], [a, b, p - 1], [a, b, p + a], [a, b, p - b], [a, b + 1, p], [a + 1, b, p], [a, b, a + b], [a, b - 1, p], [a - 1, b, p]])) {
        if (t.some(x => x < 1) || isFamily(t) || seen.has(fmt(t))) continue;
        seen.add(fmt(t)); wrong.push(fmt(t));
      }
      if (wrong.length < 3) continue;
      return { q: `Which three numbers make a fact family?`, a: right, wrong: wrong.slice(0, 3), why: `${a} × ${b} = ${p}, so ${a}, ${b}, and ${p} make a fact family. In the others, the two small numbers do not multiply to make the big one.`, hint: 'Multiply the two small numbers. Do you get the big one?', say: 'Which three numbers make a fact family?' };
    }
    throw new Error('no familyTrioQ');
  }
  function familyCompleteQ() {
    for (let tries = 0; tries < 200; tries++) {
      const a = rnd(2, 9), b = rnd(2, 9), p = a * b;
      if (a === b) continue;
      const wrong = wrongNums(b, [a, p, b + 1, b - 1]);
      return { q: `Complete the fact family: ${a} × ${b} = ${p}, ${b} × ${a} = ${p}, ${p} ÷ ${a} = ${b}, ${p} ÷ ? = ${a}`, a: String(b), wrong: wrong.map(String), why: `${p} ÷ ? = ${a} uses the same three numbers. ${p} ÷ ${b} = ${a}, so the missing number is ${b}.`, hint: `Which of the three numbers has not been used as the divisor yet?`, say: `Complete the fact family: ${a} times ${b} equals ${p}. ${p} divided by ${a} equals ${b}. ${p} divided by what number equals ${a}?` };
    }
    throw new Error('no familyCompleteQ');
  }
  const familiesQ = () => pick([familyFactQ, familyTrioQ, familyCompleteQ])();

  /* ---------- patterns in the table (multiple choice) ---------- */
  function patternQ(form) {
    form = form || pick(['nines', 'fives', 'odd']);
    if (form === 'nines') {
      const right = 9 * rnd(2, 10), pool = [];
      for (let n = 11; n <= 98; n++) if (n % 9 !== 0) pool.push(n);
      const wrong = shuffle(pool).slice(0, 3).map(String);
      return { q: 'Which number is in the 9 times table?', a: String(right), wrong, why: `The digits of every answer in the 9 times table add up to 9: ${String(right).split('').join(' + ')} = ${String(right).split('').reduce((x, y) => x + +y, 0)}. The others do not. (Or count by 9s: 9, 18, 27, 36, 45, 54, 63, 72, 81, 90.)`, hint: 'Add the digits of each number. What do the digits of a 9s answer add up to?', say: 'Which number is in the 9 times table?' };
    }
    if (form === 'fives') {
      const right = 5 * rnd(2, 20), pool = [];
      for (let n = 11; n <= 99; n++) if (n % 5 !== 0) pool.push(n);
      return { q: 'Which number is in the 5 times table?', a: String(right), wrong: shuffle(pool).slice(0, 3).map(String), why: `Every answer in the 5 times table ends in 0 or 5. ${right} ends in ${right % 10}.`, hint: 'Look at the last digit.', say: 'Which number is in the 5 times table?' };
    }
    const odds = [], evens = [];
    for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) (a % 2 && b % 2 ? odds : evens).push([a, b]);
    const o = pick(odds), ev = shuffle(evens).slice(0, 3), f = x => `${x[0]} × ${x[1]}`;
    return { q: 'Which product is an odd number?', a: f(o), wrong: ev.map(f), why: `An odd number times an odd number is odd: ${o[0]} × ${o[1]} = ${o[0] * o[1]}. If either number is even, the product is even.`, hint: 'The product is odd only when both numbers are odd.', say: 'Which product is an odd number?' };
  }

  /* ---------- word problems (type the answer) ---------- */
  const THINGS = ['crayons', 'stickers', 'marbles', 'pencils', 'cookies', 'apples', 'shells', 'beads'];
  const HOLDERS = [{ pl: 'boxes', sg: 'box' }, { pl: 'bags', sg: 'bag' }, { pl: 'jars', sg: 'jar' }, { pl: 'plates', sg: 'plate' }, { pl: 'bowls', sg: 'bowl' }, { pl: 'baskets', sg: 'basket' }];
  function wordsQ() {
    const kind = pick(['groups', 'share', 'howmany', 'rows', 'times']), a = rnd(2, 10), b = rnd(2, 10), p = a * b, nm = pick(NAMES), th = pick(THINGS), h = pick(HOLDERS);
    if (kind === 'groups') return { k: 'w-groups', q: `There are ${a} ${h.pl} with ${b} ${th} in each ${h.sg}. How many ${th} are there in all?`, a: p, wrong: wrongNums(p, [a + b, p + a, p - b]), why: `${a} equal groups of ${b} is ${a} × ${b} = ${p}. There are ${p} ${th}.`, hint: 'Equal groups: multiply the number of groups by the number in each group.', say: `There are ${a} ${h.pl} with ${b} ${th} in each ${h.sg}. How many ${th} are there in all?` };
    if (kind === 'share') return { k: 'w-share', q: `${nm} shares ${p} ${th} equally among ${a} friends. How many ${th} does each friend get?`, a: b, wrong: wrongNums(b, [a, b + 1, p - a]), why: `Sharing equally is dividing: ${p} ÷ ${a} = ${b}. Check: ${a} × ${b} = ${p}. Each friend gets ${b}.`, hint: `Divide ${p} by ${a}.`, say: `${nm} shares ${p} ${th} equally among ${a} friends. How many ${th} does each friend get?` };
    if (kind === 'howmany') return { k: 'w-howmany', q: `${nm} has ${p} ${th} and puts ${a} in each ${h.sg}. How many ${h.pl} does ${nm} fill?`, a: b, wrong: wrongNums(b, [a, b + 1, p - a]), why: `How many groups of ${a} fit in ${p}? ${p} ÷ ${a} = ${b}. Check: ${b} × ${a} = ${p}. ${nm} fills ${b} ${h.pl}.`, hint: `Divide ${p} by ${a}.`, say: `${nm} has ${p} ${th} and puts ${a} in each ${h.sg}. How many ${h.pl} does ${nm} fill?` };
    if (kind === 'rows') { const r = rnd(2, 9), c = rnd(2, 9); return { k: 'w-rows', q: `A garden has ${r} rows with ${c} plants in each row. How many plants are in the garden?`, a: r * c, wrong: wrongNums(r * c, [r + c, r * c + c, r * c - r]), why: `${r} rows of ${c} is ${r} × ${c} = ${r * c}. The garden has ${r * c} plants.`, hint: 'Multiply the number of rows by the number in each row.', say: `A garden has ${r} rows with ${c} plants in each row. How many plants are in the garden?` }; }
    const base = rnd(2, 9), m = rnd(2, 9);
    return { k: 'w-times', q: `${nm} has ${base} ${th}. A friend has ${m} times as many. How many ${th} does the friend have?`, a: base * m, wrong: wrongNums(base * m, [base + m, base * m + base, base * m - m]), why: `${m} times as many means ${m} × ${base} = ${base * m}. The friend has ${base * m} ${th}.`, hint: `Multiply ${base} by ${m}.`, say: `${nm} has ${base} ${th}. A friend has ${m} times as many. How many ${th} does the friend have?` };
  }

  /* ---------- arrays (picture, type the answer) ---------- */
  function arraySVG(r, c) {
    const g = 30, w = c * g, h = r * g;
    let dots = '';
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) dots += `<circle cx="${j * g + g / 2}" cy="${i * g + g / 2}" r="10" class="adot"/>`;
    return `<svg class="farr" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="An array of dots: ${r} rows with ${c} dots in each row" data-r="${r}" data-c="${c}">${dots}</svg>`;
  }
  function arrayQ() {
    const r = rnd(2, 8), c = rnd(2, 8), p = r * c;
    return { k: 'array', q: 'How many dots are in this array?', html: arraySVG(r, c), a: p, wrong: wrongNums(p, [r + c, p + c, p - r, p + r]), why: `The array has ${r} rows with ${c} dots in each row. ${r} × ${c} = ${p} dots.`, hint: 'Count the dots in one row, then multiply by the number of rows.', say: 'How many dots are in this array?', r, c };
  }

  /* ---------- the speed round: mixed multiplication and division, facts 2 to 10 ---------- */
  function speedQ() {
    const a = rnd(2, 10), b = rnd(2, 10), p = a * b;
    if (Math.random() < 0.5) return { text: `${a} × ${b}`, a: p, wrong: wrongNums(p, [a * (b + 1), (a + 1) * b, a * (b - 1), a + b]) };
    return { text: `${p} ÷ ${a}`, a: b, wrong: wrongNums(b, [b + 1, b - 1, a, b + 2]) };
  }

  const FACTSGEN = { rnd, pick, shuffle, wrongNums, strategy, timesQ, divideQ, missingQ, familyFactQ, familyTrioQ, familyCompleteQ, familiesQ, patternQ, wordsQ, arrayQ, arraySVG, speedQ, isFamily };
  if (typeof module !== 'undefined') module.exports = FACTSGEN; else root.FACTSGEN = FACTSGEN;
})(typeof window !== 'undefined' ? window : globalThis);
