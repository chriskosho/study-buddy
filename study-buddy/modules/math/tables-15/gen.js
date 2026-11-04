/* Multiplication Tables to 15: problem generators. Facts are 2 to 15 times 2 to 15 and the matching division facts (no remainders).
   Every problem is made fresh with its answer, a hint, and an explanation that breaks the big number into 10 and the rest.
   Runs in the browser, and in Node for the generator check (_dev/tests/gen_check_tables15.mjs). */
(function (root) {
  'use strict';
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function wrongNums(ans, cands, n = 3) {
    const out = [];
    [...cands, ans + 1, ans - 1, ans + 2, ans - 2, ans + 10, ans - 10, ans + 20, ans - 20, ans * 2].forEach(x => { if (Number.isInteger(x) && x >= 0 && x !== ans && !out.includes(x)) out.push(x); });
    return out.slice(0, n);
  }
  const NAMES = ['Mia', 'Leo', 'Ava', 'Sam', 'Noah', 'Zoe', 'Kai', 'Ruby'];
  /* a pair of factors from 2 to 15, most of the time with at least one factor of 11 or more (the new part of the table) */
  function pair() {
    let a, b;
    do { a = rnd(2, 15); b = rnd(2, 15); } while (a < 11 && b < 11 && Math.random() < 0.8);
    return [a, b];
  }

  /* ---------- the strategy for a multiplication fact ---------- */
  function strategy(a, b) {
    const p = a * b, s = Math.min(a, b), l = Math.max(a, b);
    if (l > 10) {
      const r = l - 10;
      if (s === 10) return { why: `Times 10: put a 0 after the other number. ${l} × 10 = ${p}.`, hint: 'Write the other number, then put a 0 after it.' };
      return { why: `Break ${l} into 10 and ${r}. 10 × ${s} = ${10 * s} and ${r} × ${s} = ${r * s}. ${10 * s} + ${r * s} = ${p}.`, hint: `Break ${l} into 10 and ${r}. Do each part, then add.` };
    }
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
    const [a, b] = pair(), p = a * b, st = strategy(a, b);
    return { q: `${a} × ${b} = ?`, a: p, wrong: wrongNums(p, [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, a + b]), why: st.why, hint: st.hint, say: `${a} times ${b}` };
  }

  /* ---------- break it apart (type the missing step) ---------- */
  function apartQ() {
    const form = pick(['first', 'second', 'total', 'both']);
    if (form === 'both') {
      const a = rnd(11, 15), b = rnd(11, 15), r = b - 10, p = a * b;
      return { q: `${a} × ${b} = (${a} × 10) + (${a} × ${r}) = ${a * 10} + ?`, a: a * r, wrong: wrongNums(a * r, [a + r, a * 10, p]), why: `${a} × ${r} = ${a * r}. Then ${a * 10} + ${a * r} = ${p}.`, hint: `Multiply ${a} × ${r}.`, say: `${a} times ${b}, break it apart` };
    }
    const l = rnd(11, 15), s = rnd(2, 9), r = l - 10, p = l * s;
    const head = `${l} × ${s} = (10 × ${s}) + (${r} × ${s})`;
    if (form === 'first') return { q: `${head} = ? + ${r * s}`, a: 10 * s, wrong: wrongNums(10 * s, [s * r, 10 + s, p]), why: `10 × ${s} = ${10 * s}. Then ${10 * s} + ${r * s} = ${p}.`, hint: `What is 10 × ${s}? Put a 0 after ${s}.`, say: `${l} times ${s}, break it apart` };
    if (form === 'second') return { q: `${head} = ${10 * s} + ?`, a: r * s, wrong: wrongNums(r * s, [r + s, 10 * s, p]), why: `${r} × ${s} = ${r * s}. Then ${10 * s} + ${r * s} = ${p}.`, hint: `Multiply ${r} × ${s}.`, say: `${l} times ${s}, break it apart` };
    return { q: `${head} = ${10 * s} + ${r * s} = ?`, a: p, wrong: wrongNums(p, [10 * s, r * s, p + 10]), why: `${10 * s} + ${r * s} = ${p}. So ${l} × ${s} = ${p}.`, hint: `Add ${10 * s} + ${r * s}.`, say: `${l} times ${s}, break it apart` };
  }

  /* ---------- division facts (type the answer) ---------- */
  function divideQ() {
    const [d, q] = pair(), n = d * q;
    let why;
    if (q > 10) why = `Think of the multiplication fact: ${d} × ${q} = ${n}. Or count tens: ${d} × 10 = ${10 * d}, and ${n} − ${10 * d} = ${n - 10 * d}. ${n - 10 * d} ÷ ${d} = ${q - 10}. 10 + ${q - 10} = ${q}.`;
    else if (d > 10) why = `Think of the multiplication fact: ${d} × ${q} = ${n}. Break ${d} into 10 and ${d - 10}: 10 × ${q} = ${10 * q} and ${d - 10} × ${q} = ${(d - 10) * q}. ${10 * q} + ${(d - 10) * q} = ${n}. So ${n} ÷ ${d} = ${q}.`;
    else why = `Think of the multiplication fact: ${d} × ${q} = ${n}. So ${n} ÷ ${d} = ${q}.`;
    return { q: `${n} ÷ ${d} = ?`, a: q, wrong: wrongNums(q, [q + 1, q - 1, d, q + 2, q - 2]), why, hint: `What number times ${d} makes ${n}?`, say: `${n} divided by ${d}` };
  }

  /* ---------- missing numbers (type the answer) ---------- */
  function missingQ() {
    const [a, b] = pair(), p = a * b, form = pick(['f1', 'f2', 'f3', 'f4']);
    if (form === 'f1') return { q: `Find the missing number: ${a} × ? = ${p}`, a: b, wrong: wrongNums(b, [a, b + 1, b - 1]), why: `${a} × ? = ${p} means ${p} ÷ ${a}. ${p} ÷ ${a} = ${b}. Check: ${a} × ${b} = ${p}.`, hint: `Divide ${p} by ${a}.`, say: `${a} times what makes ${p}` };
    if (form === 'f2') return { q: `Find the missing number: ? × ${b} = ${p}`, a: a, wrong: wrongNums(a, [b, a + 1, a - 1]), why: `? × ${b} = ${p} means ${p} ÷ ${b}. ${p} ÷ ${b} = ${a}. Check: ${a} × ${b} = ${p}.`, hint: `Divide ${p} by ${b}.`, say: `what times ${b} makes ${p}` };
    if (form === 'f3') return { q: `Find the missing number: ${p} ÷ ? = ${b}`, a: a, wrong: wrongNums(a, [b, a + 1, a - 1]), why: `${p} ÷ ? = ${b} means ? × ${b} = ${p}. ${a} × ${b} = ${p}, so the missing number is ${a}.`, hint: `What number times ${b} makes ${p}?`, say: `${p} divided by what makes ${b}` };
    return { q: `Find the missing number: ? ÷ ${a} = ${b}`, a: p, wrong: wrongNums(p, [p + a, p - a, a + b, p + b]), why: `? ÷ ${a} = ${b} means ${b} × ${a} = ?. ${b} × ${a} = ${p}, so the missing number is ${p}.`, hint: `Multiply ${b} × ${a}.`, say: `what divided by ${a} makes ${b}` };
  }

  /* ---------- word problems (type the answer) ---------- */
  const THINGS = ['crayons', 'stickers', 'marbles', 'pencils', 'cookies', 'apples', 'shells', 'beads'];
  const HOLDERS = [{ pl: 'boxes', sg: 'box' }, { pl: 'bags', sg: 'bag' }, { pl: 'jars', sg: 'jar' }, { pl: 'plates', sg: 'plate' }, { pl: 'bowls', sg: 'bowl' }, { pl: 'baskets', sg: 'basket' }];
  function wordsQ() {
    const kind = pick(['groups', 'share', 'howmany', 'rows', 'times']), [a, b] = pair(), p = a * b, nm = pick(NAMES), th = pick(THINGS), h = pick(HOLDERS);
    if (kind === 'groups') return { k: 'w-groups', q: `There are ${a} ${h.pl} with ${b} ${th} in each ${h.sg}. How many ${th} are there in all?`, a: p, wrong: wrongNums(p, [a + b, p + a, p - b]), why: `${a} equal groups of ${b}: ${a} × ${b} = ${p}.`, hint: 'Equal groups: multiply the number of groups by the number in each.' };
    if (kind === 'share') return { k: 'w-share', q: `${nm} shares ${p} ${th} equally among ${a} friends. How many ${th} does each friend get?`, a: b, wrong: wrongNums(b, [a, b + 1, p - a]), why: `Sharing equally is dividing: ${p} ÷ ${a} = ${b}.`, hint: 'Sharing equally means divide.' };
    if (kind === 'howmany') return { k: 'w-howmany', q: `${nm} has ${p} ${th} and puts ${a} in each ${h.sg}. How many ${h.pl} does ${nm} fill?`, a: b, wrong: wrongNums(b, [a, b + 1, p - a]), why: `How many groups of ${a} fit in ${p}? ${p} ÷ ${a} = ${b}.`, hint: 'How many groups? Divide.' };
    if (kind === 'rows') return { k: 'w-rows', q: `A garden has ${a} rows with ${b} plants in each row. How many plants are in the garden?`, a: p, wrong: wrongNums(p, [a + b, p + b, p - a]), why: `${a} rows of ${b}: ${a} × ${b} = ${p}.`, hint: 'Rows and columns: multiply.' };
    const base = rnd(11, 15), m = rnd(2, 9);
    return { k: 'w-times', q: `${nm} has ${base} ${th}. A friend has ${m} times as many. How many ${th} does the friend have?`, a: base * m, wrong: wrongNums(base * m, [base + m, base * m + base, base * m - m]), why: `${m} times as many is ${m} × ${base} = ${base * m}.`, hint: '"Times as many" means multiply.' };
  }

  /* ---------- the speed round: mixed multiplication and division facts, 2 to 15 ---------- */
  function speedQ() {
    const [a, b] = pair(), p = a * b;
    if (Math.random() < 0.5) return { text: `${a} × ${b}`, a: p, wrong: wrongNums(p, [a * (b + 1), (a + 1) * b, a * (b - 1), a + b]) };
    return { text: `${p} ÷ ${a}`, a: b, wrong: wrongNums(b, [b + 1, b - 1, a, b + 2]) };
  }

  /* ---------- the table picture for the study guide: 10 + the rest ---------- */
  function splitHTML(a, b) {
    const l = Math.max(a, b), s = Math.min(a, b), r = l - 10;
    if (l <= 10) return '';
    return `<div class="split" role="img" aria-label="${l} groups of ${s} split into 10 groups of ${s} and ${r} groups of ${s}"><div class="sp10" style="flex:10"><b>10 × ${s}</b><span>${10 * s}</span></div><div class="spr" style="flex:${r}"><b>${r} × ${s}</b><span>${r * s}</span></div></div>`;
  }

  const T15GEN = { rnd, pick, shuffle, wrongNums, pair, strategy, timesQ, apartQ, divideQ, missingQ, wordsQ, speedQ, splitHTML };
  if (typeof module !== 'undefined') module.exports = T15GEN; else root.T15GEN = T15GEN;
})(typeof window !== 'undefined' ? window : globalThis);
