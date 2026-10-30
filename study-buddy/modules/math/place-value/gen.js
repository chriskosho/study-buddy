/* Place Value and Zeros: problem generators. Every problem is made fresh, with its answer and an explanation.
   Numbers are built from whole-number parts or strings, so there are no floating-point surprises
   (0.1 + 0.2 style). Runs in the browser, and in Node for the generator check (_dev/tests/math_gen_check.mjs). */
(function (root) {
  'use strict';
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fmt = n => typeof n === 'string' ? fmtStr(n) : n.toLocaleString('en-US', { maximumFractionDigits: 10 });
  /* format a decimal string with commas in the whole part: "1234567.05" -> "1,234,567.05" */
  function fmtStr(s) { const neg = s[0] === '-'; if (neg) s = s.slice(1); const [w, d] = s.split('.'); return (neg ? '-' : '') + w.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (d ? '.' + d : ''); }

  const PLACES = [
    { name: 'millions', exp: 6 }, { name: 'hundred thousands', exp: 5 }, { name: 'ten thousands', exp: 4 }, { name: 'thousands', exp: 3 },
    { name: 'hundreds', exp: 2 }, { name: 'tens', exp: 1 }, { name: 'ones', exp: 0 },
    { name: 'tenths', exp: -1 }, { name: 'hundredths', exp: -2 }, { name: 'thousandths', exp: -3 }
  ];
  const placeValue = (digit, exp) => exp >= 0 ? String(digit * 10 ** exp) : (digit === 0 ? '0' : '0.' + '0'.repeat(-exp - 1) + digit);

  /* a number as digits: whole digits (most significant first) and decimal digits, every digit different */
  function makeNumber(wholeLen, decLen) {
    const digits = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, wholeLen + decLen);
    if (digits[0] === 0) { const k = digits.findIndex(d => d !== 0); [digits[0], digits[k]] = [digits[k], digits[0]]; }
    const whole = digits.slice(0, wholeLen), dec = digits.slice(wholeLen);
    const str = whole.join('') + (decLen ? '.' + dec.join('') : '');
    const cells = [...whole.map((d, i) => ({ d, exp: wholeLen - 1 - i })), ...dec.map((d, i) => ({ d, exp: -1 - i }))];
    return { str, cells };
  }
  const placeName = exp => PLACES.find(p => p.exp === exp).name;
  const placeOf = (d, name) => d === 1 ? name.replace(/s$/, '') : name;   // 1 thousand, 3 thousands

  /* ---------- Place value (multiple choice) ---------- */
  function placeValueQ(forceType) {
    const type = forceType || pick(['value', 'value', 'place', 'digit', 'build']);
    const useDec = Math.random() < 0.35, n = makeNumber(rnd(4, 7), useDec ? rnd(1, 3) : 0);
    const cells = n.cells.filter(c => c.d !== 0);
    if (type === 'value') {
      const c = pick(cells), right = placeValue(c.d, c.exp);
      const wrong = shuffle(PLACES.filter(p => p.exp !== c.exp && Math.abs(p.exp - c.exp) <= 3).map(p => placeValue(c.d, p.exp))).slice(0, 3);
      return { q: `What is the value of the ${c.d} in ${fmtStr(n.str)}?`, a: fmtStr(right), wrong: wrong.map(fmtStr), why: `The ${c.d} is in the ${placeName(c.exp)} place, so its value is ${fmtStr(right)}.` };
    }
    if (type === 'place') {
      const c = pick(cells), right = placeName(c.exp);
      const wrong = shuffle(PLACES.filter(p => p.exp !== c.exp && Math.abs(p.exp - c.exp) <= 3).map(p => p.name)).slice(0, 3);
      return { q: `In ${fmtStr(n.str)}, which place is the ${c.d} in?`, a: right, wrong, why: `The ${c.d} is in the ${right} place.` };
    }
    if (type === 'digit') {
      const c = pick(n.cells), right = String(c.d);
      const wrong = shuffle(n.cells.filter(x => x.d !== c.d).map(x => String(x.d))).slice(0, 3);
      return { q: `Which digit is in the ${placeName(c.exp)} place in ${fmtStr(n.str)}?`, a: right, wrong, why: `In ${fmtStr(n.str)}, the ${placeName(c.exp)} digit is ${right}.` };
    }
    /* build: "4 thousands, 3 hundreds, 0 tens, 5 ones" */
    const len = rnd(3, 5), ds = Array.from({ length: len }, (_, i) => i === 0 ? rnd(1, 9) : rnd(0, 9));
    if (!ds.slice(1).includes(0)) ds[rnd(1, len - 1)] = 0;
    const parts = ds.map((d, i) => `${d} ${placeOf(d, placeName(len - 1 - i))}`).join(', ');
    const right = ds.join(''), swap = s => { const a = s.split(''); const i = rnd(0, a.length - 2); [a[i], a[i + 1]] = [a[i + 1], a[i]]; return a.join(''); };
    const wrongSet = new Set([ds.filter(d => d !== 0).join(''), swap(right), right + '0', ds.slice().reverse().join('')].filter(x => x !== right && x[0] !== '0'));
    while (wrongSet.size < 3) { const r = String(rnd(10 ** (len - 1), 10 ** len - 1)); if (r !== right) wrongSet.add(r); }
    return { q: `Which number is ${parts}?`, a: fmtStr(right), wrong: [...wrongSet].slice(0, 3).map(fmtStr), why: `Put each digit in its place: ${fmtStr(right)}. A 0 holds a place that has nothing in it.` };
  }

  /* ---------- Decimals (multiple choice) ---------- */
  const decStr = (int, places) => { const s = String(int).padStart(places + 1, '0'); return places ? s.slice(0, -places) + '.' + s.slice(-places) : s; };
  const cmpKey = x => { const [w, d = ''] = String(x).split('.'); return (+w) + '.' + d.replace(/0+$/, ''); };   // same key for equal values
  const cmp = (a, b) => { const [aw, ad = ''] = a.split('.'), [bw, bd = ''] = b.split('.'); if (+aw !== +bw) return +aw - +bw; const L = Math.max(ad.length, bd.length); return +(ad.padEnd(L, '0')) - +(bd.padEnd(L, '0')); };
  function roundStr(s, places) {           // round a positive decimal string, half up, keeping trailing zeros
    const [w, d = ''] = s.split('.'), digits = (w + d.padEnd(places + 1, '0')), keep = w.length + places;
    let n = BigInt(digits.slice(0, keep)); if (+digits[keep] >= 5) n += 1n;
    return decStr(n.toString(), places);
  }
  function decimalQ(forceType) {
    const type = forceType || pick(['compare', 'compare', 'round', 'count', 'build', 'same']);
    if (type === 'compare') {
      const w = rnd(0, 9), a1 = rnd(1, 9), b2 = rnd(10, 99);    // e.g. 0.5 vs 0.45: more digits is not more
      let A = `${w}.${a1}`, B = `${w}.${b2}`;
      if (Math.random() < 0.5) [A, B] = [B, A];
      const c = cmp(A, B), right = c > 0 ? A : c < 0 ? B : 'They are equal';
      return { q: `Which is greater: ${A} or ${B}?`, a: right, wrong: [A, B, 'They are equal'].filter(x => x !== right), why: c === 0 ? `${A} and ${B} are the same amount.` : `Line up the decimal points and compare place by place: ${right} is greater.${right.length < (right === A ? B : A).length ? ' More digits does not mean a bigger number.' : ''}` };
    }
    if (type === 'round') {
      const places = rnd(1, 2), int = rnd(1000, 99999), s = decStr(int, 4).replace(/^0+(?=\d)/, '');
      const right = roundStr(s, places), name = places === 1 ? 'tenth' : 'hundredth';
      const unit = BigInt(right.replace('.', ''));
      /* wrong choices must differ from the answer in value (7.5 and 7.50 are the same number) */
      const cands = [decStr((unit - 1n).toString(), places), decStr((unit + 1n).toString(), places), roundStr(s, places === 1 ? 2 : 1), s.slice(0, s.indexOf('.') + places + 2), decStr((unit + 10n).toString(), places)];
      const seen = new Set([cmpKey(right)]), wrong = [];
      for (const c of cands) { const k = cmpKey(c); if (!seen.has(k) && !c.startsWith('-')) { seen.add(k); wrong.push(c); } if (wrong.length === 3) break; }
      return { q: `Round ${s} to the nearest ${name}.`, a: right, wrong, why: `Look at the digit to the right of the ${name}s place. If it is 5 or more, round up. ${s} rounds to ${right}.` };
    }
    if (type === 'count') {
      const places = rnd(1, 4), s = decStr(rnd(10 ** places, 10 ** (places + 2) - 1), places).replace(/0$/, '1');
      return { q: `How many decimal places does ${s} have?`, a: String(places), wrong: ['1', '2', '3', '4', '5'].filter(x => x !== String(places)).slice(0, 3), why: `Count the digits after the decimal point: ${s} has ${places}.` };
    }
    if (type === 'build') {
      const t = rnd(1, 9); let h = rnd(0, 9); while (h === t) h = rnd(0, 9);
      const th = Math.random() < 0.5 ? rnd(1, 9) : null, tail = th !== null ? String(th) : '';
      const right = '0.' + t + h + tail, words = `${t} ${placeOf(t, 'tenths')}, ${h} ${placeOf(h, 'hundredths')}${th !== null ? `, and ${th} ${placeOf(th, 'thousandths')}` : ''}`;
      const cands = ['0.' + h + t + tail, t + '.' + h + tail, '0.0' + t + h + tail, String(t) + h + tail + '.0'];
      const seen = new Set([cmpKey(right)]), wrong = [];
      for (const c of cands) { const k = cmpKey(c); if (!seen.has(k)) { seen.add(k); wrong.push(c); } if (wrong.length === 3) break; }
      return { q: `Which decimal is ${words}?`, a: right, wrong, why: `Tenths come first after the decimal point, then hundredths${th !== null ? ', then thousandths' : ''}: ${right}.` };
    }
    const d = rnd(1, 9), base = `0.${d}`;
    return { q: `Which number is the same as ${base}0?`, a: base, wrong: [`0.0${d}`, `${d}.0`, `${d}0`], why: `Zeros at the end of a decimal do not change its value: ${base}0 = ${base}.` };
  }

  /* ---------- Multiply with zeros (type the answer) ---------- */
  const zeros = n => { let z = 0; while (n % 10 === 0 && n > 0) { n /= 10; z++; } return z; };
  function multiplyQ(hard = false) {
    const d1 = hard && Math.random() < 0.4 ? rnd(11, 15) : rnd(2, 9), d2 = rnd(2, 9);
    let z1 = rnd(0, 3), z2 = rnd(1, 3); if (z1 + z2 > 6) z1 = 6 - z2;
    const a = d1 * 10 ** z1, b = d2 * 10 ** z2, prod = a * b, front = d1 * d2, total = z1 + z2;
    const extra = zeros(front);
    let why = `${d1} × ${d2} = ${front}. Count the zeros in ${fmt(a)} and ${fmt(b)}: ${z1} + ${z2} = ${total}. Write ${front} with ${total} more zero${total === 1 ? '' : 's'}: ${fmt(prod)}.`;
    if (extra) why += ` The 0 in ${front} is part of the answer too, so ${fmt(prod)} has ${total + extra} zeros in all.`;
    return { q: `${fmt(a)} × ${fmt(b)} = ?`, a: prod, why, hint: 'Multiply the front digits first. Then count the zeros and put them on the end.', say: `${fmt(a)} times ${fmt(b)}` };
  }

  /* ---------- Divide with zeros (type the answer) ---------- */
  function divideQ() {
    const e = rnd(2, 9), m = rnd(1, 3), q = pick([2, 3, 4, 5, 6, 7, 8, 9, 11, 12]), k = rnd(0, 3);
    const divisor = e * 10 ** m, quotient = q * 10 ** k, dividend = divisor * quotient;
    const left = dividend / 10 ** m;
    const why = `Cross out the same number of zeros from both numbers. ${fmt(divisor)} has ${m} zero${m === 1 ? '' : 's'}, so take ${m} zero${m === 1 ? '' : 's'} off ${fmt(dividend)} too. Now it is ${fmt(left)} ÷ ${e} = ${fmt(quotient)}.`;
    return { q: `${fmt(dividend)} ÷ ${fmt(divisor)} = ?`, a: quotient, why, hint: 'Cross out the same number of zeros from both numbers first.', say: `${fmt(dividend)} divided by ${fmt(divisor)}` };
  }

  /* ---------- Decimals and powers of ten (type the answer) ---------- */
  function shiftStr(s, places) {           // move the decimal point right (places > 0) or left (places < 0)
    let [w, d = ''] = s.split('.'); let digits = w + d, point = w.length + places;
    if (point <= 0) { digits = '0'.repeat(1 - point) + digits; point = 1; }
    if (point > digits.length) digits = digits.padEnd(point, '0');
    let W = digits.slice(0, point).replace(/^0+(?=\d)/, ''), D = digits.slice(point).replace(/0+$/, '');
    return D ? `${W}.${D}` : W;
  }
  function powersQ() {
    const mult = Math.random() < 0.5, p = rnd(1, 3), power = 10 ** p, places = rnd(1, 3);
    let s = decStr(rnd(10 ** places + 1, 10 ** (places + 2) - 1), places).replace(/^0+(?=\d)/, '');
    if (!mult && Math.random() < 0.5) s = String(rnd(2, 999));
    s = s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    const ans = shiftStr(s, mult ? p : -p);
    const why = `${mult ? 'Multiplying' : 'Dividing'} by ${fmt(power)} moves the decimal point ${p} place${p === 1 ? '' : 's'} to the ${mult ? 'right' : 'left'} (one place for each zero). Fill any empty places with 0. ${fmtStr(s)} ${mult ? '×' : '÷'} ${fmt(power)} = ${fmtStr(ans)}.`;
    return { q: `${fmtStr(s)} ${mult ? '×' : '÷'} ${fmt(power)} = ?`, a: parseFloat(ans), show: fmtStr(ans), why, hint: `Count the zeros in ${fmt(power)}. Move the decimal point that many places to the ${mult ? 'right' : 'left'}.`, say: `${fmtStr(s)} ${mult ? 'times' : 'divided by'} ${fmt(power)}` };
  }

  const MATHGEN = { PLACES, placeValue, makeNumber, placeValueQ, decimalQ, multiplyQ, divideQ, powersQ, shiftStr, roundStr, fmt, fmtStr, cmp };
  if (typeof module !== 'undefined') module.exports = MATHGEN; else root.MATHGEN = MATHGEN;
})(typeof window !== 'undefined' ? window : globalThis);
