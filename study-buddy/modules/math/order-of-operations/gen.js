/* Order of Operations: expression tools and problem generators (5th grade: + - x / with parentheses, brackets, and braces; no exponents).
   An expression is a list of tokens: whole numbers and the strings + − × ÷ ( ) [ ] { }.
   stepper: one step = one operation (innermost grouping symbol first, then × and ÷ left to right, then + and − left to right).
   Every number along the way is a whole number of 1 or more, so there are no fractions or negatives to explain.
   Runs in the browser, and in Node for the generator check (_dev/tests/math_gen_check.mjs). */
(function (root) {
  'use strict';
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const OPEN = '([{', CLOSE = ')]}', OPS = '+−×÷', PAIR = { ')': '(', ']': '[', '}': '{' };
  const isNum = t => typeof t === 'number';
  const SYMBOL_NAME = { '(': 'parentheses', '[': 'brackets', '{': 'braces' };
  const fmtN = n => n.toLocaleString('en-US');

  /* ---------- text to tokens (the helper in the study guide) ---------- */
  function parse(str) {
    const s = String(str).replace(/[–—-]/g, '−').replace(/[*]/g, '×').replace(/[\/:]/g, '÷').replace(/(\d|\)|\]|\}|\s)\s*[xX]\s*(?=\d|\(|\[|\{)/g, '$1×').replace(/,/g, '');
    const out = []; let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/\d/.test(c)) { let j = i; while (j < s.length && /\d/.test(s[j])) j++; if (s[j] === '.') throw new Error('Use whole numbers only.'); out.push(Number(s.slice(i, j))); i = j; continue; }
      if (OPS.includes(c) || OPEN.includes(c) || CLOSE.includes(c)) { out.push(c); i++; continue; }
      throw new Error(`I do not know what "${c}" means. Use numbers, + − × ÷, and ( ) [ ] { }.`);
    }
    if (!out.length) throw new Error('Type an expression, like 12 + 6 × 3.');
    const stack = []; let wantOperand = true;
    for (let k = 0; k < out.length; k++) {
      const t = out[k];
      if (wantOperand) {
        if (isNum(t)) { wantOperand = false; if (OPEN.includes(out[k + 1])) throw new Error('Put × between a number and a grouping symbol, like 2 × (3 + 4).'); }
        else if (OPEN.includes(t)) stack.push(t);
        else throw new Error('Something is missing next to the ' + t + '. Each sign needs a number on both sides.');
      } else {
        if (OPS.includes(t)) wantOperand = true;
        else if (CLOSE.includes(t)) { if (stack.pop() !== PAIR[t]) throw new Error('The grouping symbols do not match up. Every ( needs a ), every [ needs a ], and every { needs a }.'); if (OPEN.includes(out[k + 1]) || isNum(out[k + 1])) throw new Error('Put a sign between a grouping symbol and the next number, like (3 + 4) × 2.'); }
        else throw new Error('Put a sign (+ − × ÷) between the numbers.');
      }
    }
    if (wantOperand) throw new Error('The expression ends too soon. It needs a number after the last sign.');
    if (stack.length) throw new Error('A grouping symbol is not closed. Every ( needs a ), every [ needs a ], and every { needs a }.');
    return out;
  }

  /* ---------- tokens to text ---------- */
  function render(tokens) {
    let s = '';
    tokens.forEach((t, i) => { const prev = tokens[i - 1]; if (i > 0 && !OPEN.includes(prev) && !CLOSE.includes(t)) s += ' '; s += isNum(t) ? fmtN(t) : t; });
    return s;
  }
  const SAY = { '+': 'plus', '−': 'minus', '×': 'times', '÷': 'divided by', '(': 'open parenthesis', ')': 'close parenthesis', '[': 'open bracket', ']': 'close bracket', '{': 'open brace', '}': 'close brace' };
  const sayTokens = tokens => tokens.map(t => isNum(t) ? String(t) : SAY[t]).join(' ');

  /* ---------- the stepper ---------- */
  function compute(a, op, b) {
    if (op === '+') return a + b;
    if (op === '−') { if (a - b < 1) throw new Error('That subtraction would go to zero or below.'); return a - b; }
    if (op === '×') return a * b;
    if (b === 0 || a % b) throw new Error('That division does not come out even.');
    return a / b;
  }
  function collapse(t) {   // a grouping symbol around a single number goes away
    for (let p = 0; p + 2 < t.length; p++) if (OPEN.includes(t[p]) && isNum(t[p + 1]) && CLOSE.includes(t[p + 2])) { t = t.slice(0, p).concat([t[p + 1]], t.slice(p + 3)); p = -1; }
    return t;
  }
  /* the next operation to do: returns the index of its left number, or -1 if only one number is left */
  function nextIndex(t) {
    let lo = 0, hi = t.length, c = t.findIndex(x => CLOSE.includes(x));
    if (c >= 0) { let o = c - 1; while (!OPEN.includes(t[o])) o--; lo = o + 1; hi = c; }
    for (let i = lo; i < hi; i++) if (t[i] === '×' || t[i] === '÷') return i - 1;
    for (let i = lo; i < hi; i++) if (t[i] === '+' || t[i] === '−') return i - 1;
    return -1;
  }
  /* replace the operation at index i (number, sign, number) with its answer */
  function applyAt(t, i) { const r = compute(t[i], t[i + 1], t[i + 2]); return collapse(t.slice(0, i).concat([r], t.slice(i + 3))); }
  /* every state from the start to one number: [{ tokens, did: { a, op, b, r, group } }] (did describes the step that made this state) */
  function chain(t0) {
    const states = [{ tokens: collapse(t0), did: null }];
    for (let guard = 0; guard < 40; guard++) {
      const t = states[states.length - 1].tokens, i = nextIndex(t);
      if (i < 0) break;
      const c = t.findIndex(x => CLOSE.includes(x)), group = c >= 0 ? SYMBOL_NAME[t[(() => { let o = c - 1; while (!OPEN.includes(t[o])) o--; return o; })()]] : null;
      states.push({ tokens: applyAt(t, i), did: { a: t[i], op: t[i + 1], b: t[i + 2], r: compute(t[i], t[i + 1], t[i + 2]), group, i } });
    }
    return states;
  }
  const value = t => { const s = chain(t); const f = s[s.length - 1].tokens; if (f.length !== 1) throw new Error('not finished'); return f[0]; };
  const tryValue = t => { try { return value(t); } catch (e) { return null; } };
  const stepText = d => `${fmtN(d.a)} ${d.op} ${fmtN(d.b)} = ${fmtN(d.r)}`;
  /* the same sequence with every grouping symbol removed (what you get if you ignore them) and the plain left-to-right answer */
  const flat = t => t.filter(x => !OPEN.includes(x) && !CLOSE.includes(x));
  function leftToRight(t) { const f = flat(t); let v = f[0]; for (let i = 1; i < f.length; i += 2) { const o = f[i], b = f[i + 1]; v = o === '+' ? v + b : o === '−' ? v - b : o === '×' ? v * b : v / b; } return v; }

  /* ---------- building expressions ---------- */
  function wrap(nums, ops, groups) {   // groups: [[i, j], ...]; the symbol comes from how deeply groups are nested inside each other
    const inside = (g, h) => g !== h && h[0] >= g[0] && h[1] <= g[1];
    const level = g => { const inner = groups.filter(h => inside(g, h)); return inner.length ? 1 + Math.max(...inner.map(level)) : 0; };
    const out = [];
    nums.forEach((n, p) => {
      groups.filter(g => g[0] === p).sort((a, b) => (b[1] - b[0]) - (a[1] - a[0])).forEach(g => out.push(OPEN[level(g)]));
      out.push(n);
      groups.filter(g => g[1] === p).sort((a, b) => (a[1] - a[0]) - (b[1] - b[0])).forEach(g => out.push(CLOSE[level(g)]));
      if (p < nums.length - 1) out.push(ops[p]);
    });
    return out;
  }
  function spansFor(kind, k) {
    const all = [];
    for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) all.push([i, j]);
    const notWhole = g => !(g[0] === 0 && g[1] === k - 1);
    const proper = (g, h) => g !== h && h[0] >= g[0] && h[1] <= g[1] && (h[0] > g[0] || h[1] < g[1]);
    let opts = [];
    if (kind === 'plain') return [[]];
    if (kind === 'one') all.filter(notWhole).forEach(g => opts.push([g]));
    if (kind === 'sibling') all.forEach(g => all.forEach(h => { if (g[1] < h[0] - 0 && h[0] > g[1]) opts.push([g, h]); }));
    if (kind === 'two') all.filter(notWhole).forEach(g => all.forEach(h => { if (proper(g, h)) opts.push([g, h]); }));
    if (kind === 'three') all.filter(notWhole).forEach(g => all.forEach(h => all.forEach(m => { if (proper(g, h) && proper(h, m)) opts.push([g, h, m]); })));
    return opts;
  }
  const KS = { plain: [3, 4], one: [3, 4], sibling: [4, 5], two: [4, 5], three: [5, 6] };
  /* a random expression of this kind that works out with whole numbers all the way, and where the order matters */
  function make(kind, opt = {}) {
    for (let tries = 0; tries < 800; tries++) {
      const k = opt.k || pick(KS[kind]), spans = spansFor(kind, k);
      if (!spans.length) continue;
      const groups = pick(spans), ops = [], nums = [];
      for (let i = 0; i < k - 1; i++) ops.push(pick(['+', '+', '−', '−', '×', '×', '÷']));
      for (let i = 0; i < k; i++) nums.push(pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 12]));
      if (kind === 'plain' && !(ops.some(o => '×÷'.includes(o)) && ops.some(o => '+−'.includes(o)))) continue;
      if (kind !== 'plain' && !ops.some(o => '×÷'.includes(o)) && Math.random() < 0.8) continue;
      const t = wrap(nums, ops, groups);
      let ch; try { ch = chain(t); } catch (e) { continue; }
      const fin = ch[ch.length - 1].tokens;
      if (fin.length !== 1 || fin[0] > 200 || fin[0] < 1) continue;
      if (ch.some(s => s.tokens.some(x => isNum(x) && x > 400))) continue;
      if (kind === 'plain') { if (leftToRight(t) === fin[0]) continue; }
      else { const ungrouped = tryValue(flat(t)); if (ungrouped === fin[0]) continue; }
      if (opt.minSteps && ch.length - 1 < opt.minSteps) continue;
      return { tokens: t, ops, nums, groups, value: fin[0], chain: ch };
    }
    throw new Error('no expression for ' + kind);
  }

  /* ---------- explanations ---------- */
  const chainText = ch => ch.map(s => render(s.tokens)).join(' → ');
  const GROUP_HINT = 'Grouping symbols first (innermost first), then × and ÷ left to right, then + and − left to right.';
  function whyValue(e) {
    const lead = [];
    if (e.groups.length) lead.push('Work inside the grouping symbols first, innermost first.');
    const mdFirst = e.chain.some((st, i) => i > 0 && '×÷'.includes(st.did.op) && (() => { const t = e.chain[i - 1].tokens, c = t.findIndex(x => CLOSE.includes(x)); let lo = 0, hi = t.length; if (c >= 0) { let o = c - 1; while (!OPEN.includes(t[o])) o--; lo = o + 1; hi = c; } return t.slice(lo, hi).some(x => x === '+' || x === '−'); })());
    if (mdFirst) lead.push('× and ÷ come before + and −.');
    return `${lead.join(' ')} ${chainText(e.chain)}. The answer is ${fmtN(e.value)}.`.trim();
  }
  function whyFirst(e) {
    const d = e.chain[1].did, t = e.tokens;
    if (d.group) {
      let alone = 0; for (let p = 0; p < t.length; p++) if (OPEN.includes(t[p])) { let q = p + 1; while (q < t.length && !OPEN.includes(t[q]) && !CLOSE.includes(t[q])) q++; if (CLOSE.includes(t[q])) alone++; }
      return `Inside the ${d.group}, ${d.a} ${d.op} ${d.b} comes first. Grouping symbols are done first, and the innermost one before the outer ones.${alone > 1 ? ' Two groups sit side by side, so either could go first; we start with the one on the left.' : ''}`;
    }
    const hasMD = flat(t).some(x => x === '×' || x === '÷'), hasAS = flat(t).some(x => x === '+' || x === '−');
    if ('×÷'.includes(d.op) && hasAS) return `× and ÷ come before + and −. Reading from the left, ${d.a} ${d.op} ${d.b} is the first × or ÷, so it comes first.`;
    return `Only ${'×÷'.includes(d.op) ? '× and ÷' : '+ and −'} are left, and they are done left to right. ${d.a} ${d.op} ${d.b} is the first one.`;
  }

  /* ---------- the problem kinds ---------- */
  const exHTML = t => `<span class="ex">${SB.esc ? SB.esc(render(t)) : render(t)}</span>`;
  const KINDS = { plain: 'No grouping symbols', one: 'Parentheses', sibling: 'Parentheses', two: 'Brackets and parentheses', three: 'Braces, brackets, and parentheses' };
  /* wrong answers a student could get by using the wrong order (used when a typed problem is shown as multiple choice) */
  function wrongNumbers(t, v) {
    const f = flat(t), cand = [];
    const seq = (order) => { let a = f.slice(); for (const group of order) { for (let i = 1; i < a.length;) { if (group.includes(a[i])) { let r; try { r = compute(a[i - 1], a[i], a[i + 1]); } catch (e) { r = null; } if (r === null) return null; a = a.slice(0, i - 1).concat([r], a.slice(i + 2)); } else i += 2; } } return a[0]; };
    cand.push(leftToRight(t), tryValue(flat(t)), seq(['+−', '×÷']));
    [1, -1, 2, -2, 10, -10, 3].forEach(d => cand.push(v + d));
    const out = []; cand.forEach(x => { if (Number.isInteger(x) && x >= 1 && x !== v && !out.includes(x)) out.push(x); });
    return out.slice(0, 3);
  }
  function valueQ(kind) {
    const e = make(kind === 'parens' ? pick(['one', 'one', 'sibling']) : kind === 'nested' ? 'two' : kind === 'braces' ? 'three' : 'plain');
    return { q: `Work it out: ${exHTML(e.tokens)}`, plain: `Work it out: ${render(e.tokens)}`, a: e.value, wrong: wrongNumbers(e.tokens, e.value), why: whyValue(e), hint: GROUP_HINT, say: `Work it out: ${sayTokens(e.tokens)}`, expr: render(e.tokens) };
  }
  const plainQ = () => valueQ('plain'), parensQ = () => valueQ('parens'), nestedQ = () => valueQ('nested'), bracesQ = () => valueQ('braces');

  /* the operations that cannot be done yet: doing one first would change the answer */
  function wrongSteps(t, v) {
    const out = [];
    for (let i = 0; i + 2 < t.length; i++) {
      if (!isNum(t[i]) || !OPS.includes(t[i + 1]) || !isNum(t[i + 2])) continue;
      if (i === nextIndex(t)) continue;
      let nt; try { nt = applyAt(t, i); } catch (e) { continue; }
      const nv = tryValue(nt);
      if (nv === null || nv === v) continue;
      out.push({ i, tokens: nt, pair: `${fmtN(t[i])} ${t[i + 1]} ${fmtN(t[i + 2])}` });
    }
    return out;
  }
  function firstQ() {
    for (let tries = 0; tries < 400; tries++) {
      const e = make(pick(['plain', 'plain', 'one', 'two']), { k: pick([4, 4, 5]) }), t = e.tokens, i = nextIndex(t), d = e.chain[1].did;
      const right = `${fmtN(d.a)} ${d.op} ${fmtN(d.b)}`, wr = wrongSteps(t, e.value).filter(w => w.pair !== right);
      const legal = new Set([right]);   // the same words may appear twice in the expression; a pair that is a legal first step anywhere is never a wrong option
      for (let j = 0; j + 2 < t.length; j++) if (isNum(t[j]) && OPS.includes(t[j + 1]) && isNum(t[j + 2]) && !wr.some(w => w.i === j)) legal.add(`${fmtN(t[j])} ${t[j + 1]} ${fmtN(t[j + 2])}`);
      const wrong = [...new Set(wr.map(w => w.pair))].filter(x => !legal.has(x));
      if (wrong.length < 2) continue;
      return { q: `Which part do you work out first in ${render(t)}?`, qh: `Which part do you work out first in ${exHTML(t)}?`, a: right, wrong: shuffle(wrong).slice(0, 3), why: whyFirst(e), say: `Which part do you work out first in ${sayTokens(t)}?` };
    }
    throw new Error('no firstQ');
  }
  function nextQ() {
    for (let tries = 0; tries < 400; tries++) {
      const e = make(pick(['plain', 'one', 'two', 'sibling']), { k: pick([4, 4, 5]) }), t = e.tokens, d = e.chain[1].did;
      const right = render(e.chain[1].tokens), wr = wrongSteps(t, e.value).map(w => render(w.tokens)).filter(s => s !== right);
      const wrong = [...new Set(wr)];
      if (wrong.length < 2) continue;
      return { q: `Do only the first step of ${render(t)}. What is left?`, qh: `Do only the first step of ${exHTML(t)}. What is left?`, a: right, wrong: shuffle(wrong).slice(0, 3), why: `${whyFirst(e)} ${stepText(d)}, so ${right} is left.`, say: `Do only the first step of ${sayTokens(t)}. What is left?` };
    }
    throw new Error('no nextQ');
  }
  /* add one pair of parentheses to make it true */
  function fitQ() {
    for (let tries = 0; tries < 600; tries++) {
      const k = 4, nums = Array.from({ length: k }, () => pick([2, 3, 4, 5, 6, 8, 9, 10])), ops = Array.from({ length: k - 1 }, () => pick(['+', '−', '×', '×', '÷']));
      if (!ops.some(o => '×÷'.includes(o)) || !ops.some(o => '+−'.includes(o))) continue;
      const plain = wrap(nums, ops, []), pv = tryValue(plain);
      const opts = [];
      for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) { if (i === 0 && j === k - 1) continue; const t = wrap(nums, ops, [[i, j]]), v = tryValue(t); if (v !== null && v <= 400) opts.push({ t, v, s: render(t) }); }
      if (opts.length < 4) continue;
      const byV = {}; opts.forEach(o => { byV[o.v] = (byV[o.v] || 0) + 1; });
      const ok = shuffle(opts.filter(o => byV[o.v] === 1 && o.v !== pv && o.v <= 200));
      if (!ok.length) continue;
      const right = ok[0], wrong = opts.filter(o => o !== right).map(o => o.s);
      if (new Set(wrong).size < 3 || wrong.includes(right.s)) continue;
      const ch = chain(right.t);
      return { q: `Where do the parentheses go to make this true: ${render(plain)} = ${fmtN(right.v)}?`, qh: `Where do the parentheses go to make this true: ${exHTML(plain)} = ${fmtN(right.v)}?`, a: right.s, wrong: shuffle(wrong).slice(0, 3), why: `${chainText(ch)}. Without the parentheses, ${render(plain)} is ${pv === null ? 'not a whole number' : fmtN(pv)}.`, say: `Where do the parentheses go to make this true: ${sayTokens(plain)} equals ${right.v}?` };
    }
    throw new Error('no fitQ');
  }

  /* ---------- words and expressions ---------- */
  /* each phrase has the expression it means and expressions that look close but mean something else */
  const PHRASES = [
    { w: (A, B, C) => `Add ${A} and ${B}, then multiply by ${C}.`, e: (A, B, C) => `(${A} + ${B}) × ${C}`, bad: (A, B, C) => [`${A} + ${B} × ${C}`, `${A} × ${C} + ${B}`, `${A} × (${B} + ${C})`, `(${A} × ${B}) + ${C}`] },
    { w: (A, B, C) => `Subtract ${B} from ${A}, then divide by ${C}.`, e: (A, B, C) => `(${A} − ${B}) ÷ ${C}`, bad: (A, B, C) => [`${A} − ${B} ÷ ${C}`, `${A} ÷ (${B} − ${C})`, `(${A} ÷ ${C}) − ${B}`, `${A} − (${B} ÷ ${C})`] },
    { w: (A, B, C) => `Multiply ${A} by ${B}, then add ${C}.`, e: (A, B, C) => `${A} × ${B} + ${C}`, bad: (A, B, C) => [`${A} × (${B} + ${C})`, `(${A} + ${B}) × ${C}`, `${A} + ${B} × ${C}`, `(${A} + ${C}) × ${B}`] },
    { w: (A, B, C) => `Divide ${A} by ${B}, then subtract ${C}.`, e: (A, B, C) => `${A} ÷ ${B} − ${C}`, bad: (A, B, C) => [`${A} ÷ (${B} − ${C})`, `(${A} − ${C}) ÷ ${B}`, `${A} − ${B} ÷ ${C}`, `${A} − ${C} ÷ ${B}`] },
    { w: (A, B, C) => `${C} times the sum of ${A} and ${B}.`, e: (A, B, C) => `${C} × (${A} + ${B})`, bad: (A, B, C) => [`${C} × ${A} + ${B}`, `${C} + ${A} × ${B}`, `(${C} × ${A}) + ${B}`, `${C} × ${A} × ${B}`] },
    { w: (A, B, C) => `The difference of ${A} and ${B}, multiplied by ${C}.`, e: (A, B, C) => `(${A} − ${B}) × ${C}`, bad: (A, B, C) => [`${A} − ${B} × ${C}`, `${A} × (${B} − ${C})`, `(${A} × ${C}) − ${B}`, `${A} − ${C} × ${B}`] },
    { w: (A, B, C) => `Subtract the product of ${A} and ${B} from ${C}.`, e: (A, B, C) => `${C} − ${A} × ${B}`, bad: (A, B, C) => [`(${C} − ${A}) × ${B}`, `${A} × ${B} − ${C}`, `${A} × (${B} − ${C})`, `${C} − ${A} + ${B}`] },
    { w: (A, B, C) => `Add ${A} to the quotient of ${B} and ${C}.`, e: (A, B, C) => `${A} + ${B} ÷ ${C}`, bad: (A, B, C) => [`(${A} + ${B}) ÷ ${C}`, `${A} ÷ ${B} + ${C}`, `${A} ÷ (${B} + ${C})`, `${B} ÷ ${C} − ${A}`] }
  ];
  const evalStr = s => { try { return value(parse(s)); } catch (e) { return null; } };
  function phraseSet() {
    for (let tries = 0; tries < 400; tries++) {
      const ph = pick(PHRASES), A = rnd(4, 20), B = rnd(2, 12), C = rnd(2, 12);
      const e = ph.e(A, B, C), v = evalStr(e);
      if (v === null || A === B || B === C || A === C) continue;
      return { ph, A, B, C, e, v };
    }
    throw new Error('no phrase');
  }
  function writeQ() {   // words -> expression
    for (let tries = 0; tries < 400; tries++) {
      const { ph, A, B, C, e, v } = phraseSet();
      const wrong = [...new Set(ph.bad(A, B, C))].filter(s => evalStr(s) !== v);
      if (wrong.length < 3) continue;
      const steps = chainText(chain(parse(e)));
      return { q: `Which expression matches these words? ${ph.w(A, B, C)}`, a: e, wrong: shuffle(wrong).slice(0, 3), why: `${ph.w(A, B, C)} The parentheses (or the order of the signs) show what happens first: ${steps}.`, say: `Which expression matches these words? ${ph.w(A, B, C)}` };
    }
    throw new Error('no writeQ');
  }
  function readQ() {   // expression -> words
    for (let tries = 0; tries < 400; tries++) {
      const { ph, A, B, C, e, v } = phraseSet();
      const wrong = PHRASES.filter(p => p !== ph).map(p => ({ w: p.w(A, B, C), v: evalStr(p.e(A, B, C)) })).filter(p => p.v !== v).map(p => p.w);
      if (wrong.length < 3) continue;
      return { q: `Which words match ${e}?`, qh: `Which words match ${exHTML(parse(e))}?`, a: ph.w(A, B, C), wrong: shuffle(wrong).slice(0, 3), why: `${e}: ${chainText(chain(parse(e)))}. In words: ${ph.w(A, B, C)}`, say: `Which words match ${sayTokens(parse(e))}?` };
    }
    throw new Error('no readQ');
  }
  const NTH = { 2: 'half', 3: 'one third', 4: 'one fourth', 5: 'one fifth', 6: 'one sixth' };
  function interpretQ() {   // compare without working it out
    let A, B; do { A = rnd(100, 30000); B = rnd(100, 30000); } while (A === B);
    const n = rnd(2, 6), times = Math.random() < 0.6, sum = Math.random() < 0.5;
    const inner = sum ? `${fmtN(A)} + ${fmtN(B)}` : `${fmtN(Math.max(A, B))} − ${fmtN(Math.min(A, B))}`, label = `the ${sum ? 'sum' : 'difference'} ${inner}`;
    const expr = times ? `${n} × (${inner})` : `(${inner}) ÷ ${n}`;
    const size = n === 2 ? 'half as large' : `${NTH[n]} as large`;
    const rightText = times ? `${n} times as large as ${label}` : `${size} as ${label}`;
    const wrongs = times ? [`${n} more than ${label}`, `${size} as ${label}`, `The same size as ${label}`] : [`${n} times as large as ${label}`, `${n} less than ${label}`, `The same size as ${label}`];
    return { q: `Without working it out, how does ${expr} compare to ${label}?`, qh: `Without working it out, how does <span class="ex">${SB.esc ? SB.esc(expr) : expr}</span> compare to ${label.replace(inner, `<span class="ex">${SB.esc ? SB.esc(inner) : inner}</span>`)}?`, a: rightText, wrong: shuffle(wrongs), why: `${times ? `Multiplying ${label} by ${n}` : `Dividing ${label} by ${n}`} makes ${times ? `a number ${n} times as large` : `a number ${size}`}. You can tell from the signs, without adding or subtracting at all.`, say: `Without working it out, how does ${expr} compare to ${label}?` };
  }

  const ORDERGEN = { parse, render, sayTokens, chain, value, nextIndex, applyAt, make, wrap, flat, leftToRight, plainQ, parensQ, nestedQ, bracesQ, firstQ, nextQ, fitQ, writeQ, readQ, interpretQ, stepText, chainText, fmtN, GROUP_HINT, PHRASES, KINDS };
  if (typeof module !== 'undefined') module.exports = ORDERGEN; else root.ORDERGEN = ORDERGEN;
})(typeof window !== 'undefined' ? window : globalThis);
