/* Telling Time and Elapsed Time (3rd grade): clock pictures and problem generators. Every problem is made fresh, with its answer, a hint, and an
   explanation. Times are whole minutes since midnight (0 to 1439); a 12-hour label is made only when a time is shown. An interval never crosses
   noon or midnight, so a.m. and p.m. never change inside a problem.
   Runs in the browser, and in Node for the generator check (_dev/tests/gen_check_time.mjs). */
(function (root) {
  'use strict';
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pad = n => String(n).padStart(2, '0');
  const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = { 20: 'twenty', 30: 'thirty', 40: 'forty', 50: 'fifty' };
  const numWord = n => n < 20 ? WORDS[n] : (n % 10 ? TENS[n - n % 10] + '-' + WORDS[n % 10] : TENS[n]);
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

  /* ---------- times ---------- */
  const h12 = abs => (Math.floor(abs / 60) % 12) || 12;
  const mins = abs => abs % 60;
  const suffix = abs => abs < 720 ? 'a.m.' : 'p.m.';
  const clockText = abs => `${h12(abs)}:${pad(mins(abs))}`;         // 4:35
  const fullText = abs => `${clockText(abs)} ${suffix(abs)}`;        // 4:35 p.m.
  const nextHour = h => h % 12 + 1;
  function timeWords(h, m) {   // "twenty-five minutes to five"
    if (m === 0) return `${numWord(h)} o'clock`;
    if (m === 15) return `quarter past ${numWord(h)}`;
    if (m === 30) return `half past ${numWord(h)}`;
    if (m === 45) return `quarter to ${numWord(nextHour(h))}`;
    const mw = n => `${numWord(n)} minute${n === 1 ? '' : 's'}`;
    return m < 30 ? `${mw(m)} past ${numWord(h)}` : `${mw(60 - m)} to ${numWord(nextHour(h))}`;
  }
  function sayTime(h, m) {     // how you say 4:35
    if (m === 0) return `${numWord(h)} o'clock`;
    return m < 10 ? `${numWord(h)} oh ${numWord(m)}` : `${numWord(h)} ${numWord(m)}`;
  }
  function durText(d) {        // 85 -> "1 hour 25 minutes"
    const H = Math.floor(d / 60), M = d % 60;
    if (!H) return plural(M, 'minute');
    return M ? `${plural(H, 'hour')} ${plural(M, 'minute')}` : plural(H, 'hour');
  }
  function parseTime(s) {      // 4:35, 4.35, 4 35, 435, 4 -> { h, m }
    const t = String(s).trim().toLowerCase().replace(/\s*(a\.?m\.?|p\.?m\.?)$/, '');
    let m = t.match(/^(\d{1,2})\s*[:. ]\s*(\d{2})$/) || t.match(/^(\d{1,2})(\d{2})$/), h, mi;
    if (m) { h = +m[1]; mi = +m[2]; } else if ((m = t.match(/^(\d{1,2})$/))) { h = +m[1]; mi = 0; } else throw new Error('Type a time like 4:35. The hour is 1 to 12 and the minutes are 00 to 59.');
    if (h < 1 || h > 12 || mi > 59) throw new Error('Type a time like 4:35. The hour is 1 to 12 and the minutes are 00 to 59.');
    return { h, m: mi };
  }

  /* ---------- the clock picture ---------- */
  const f2 = x => Math.round(x * 100) / 100;
  const tip = (deg, len) => { const a = deg * Math.PI / 180; return [f2(100 + len * Math.sin(a)), f2(100 - len * Math.cos(a))]; };
  /* hour hand is at (h mod 12) x 30 + minutes x 0.5 degrees; minute hand at minutes x 6 degrees. Both are drawn as lines from the middle. */
  function clockSVG(h, m, label) {
    const ha = (h % 12) * 30 + m * 0.5, ma = m * 6, [hx, hy] = tip(ha, 50), [mx, my] = tip(ma, 74);
    let ticks = '', nums = '';
    for (let i = 0; i < 60; i++) { const a = i * 6, big = i % 5 === 0, [x1, y1] = tip(a, big ? 83 : 87), [x2, y2] = tip(a, 93); ticks += `<line class="${big ? 'tick tick5' : 'tick'}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`; }
    for (let n = 1; n <= 12; n++) { const [x, y] = tip(n * 30, 67); nums += `<text class="num" x="${x}" y="${y}">${n}</text>`; }
    return `<svg class="tmclk" viewBox="0 0 200 200" role="img" aria-label="${label || 'An analog clock. Read the hands.'}"><circle class="face" cx="100" cy="100" r="96"/>${ticks}${nums}<line class="hh" x1="100" y1="100" x2="${hx}" y2="${hy}"/><line class="mh" x1="100" y1="100" x2="${mx}" y2="${my}"/><circle class="pin" cx="100" cy="100" r="5"/></svg>`;
  }
  /* a number line from a start time to an end time with an arc for the time that passes */
  function lineSVG(s, e) {
    return `<svg class="tmline" viewBox="0 0 420 110" role="img" aria-label="A number line from ${fullText(s)} to ${fullText(e)}. The time that passes is the question."><line class="nl" x1="30" y1="62" x2="390" y2="62"/><line class="nl" x1="30" y1="50" x2="30" y2="74"/><line class="nl" x1="390" y1="50" x2="390" y2="74"/><path class="arc" d="M30 54 Q210 -8 390 54"/><text class="nlq" x="210" y="30">?</text><text class="nlt nls" x="30" y="98">${fullText(s)}</text><text class="nlt nle" x="390" y="98">${fullText(e)}</text></svg>`;
  }

  /* ---------- explanations ---------- */
  function readWhy(h, m) {
    const base = Math.floor(m / 5), extra = m % 5, pointed = base || 12;
    const hourPart = m === 0 ? `The short hand is the hour hand. It points right at the ${h}, so the hour is ${h}.` : m >= 45 ? `The short hand is the hour hand. It is almost at the ${nextHour(h)} but has not reached it, so the hour is still ${h}.` : m < 15 ? `The short hand is the hour hand. It is just past the ${h}, so the hour is ${h}.` : `The short hand is the hour hand. It is between the ${h} and the ${nextHour(h)}, so the hour is ${h}.`;
    const minPart = m === 0 ? 'The long hand is the minute hand. It points to the 12, which is 0 minutes.' : extra === 0 ? `The long hand is the minute hand. It points to the ${pointed}. Count by fives: ${base} × 5 = ${m} minutes.` : base === 0 ? `The long hand is the minute hand. It is ${plural(extra, 'small mark')} past the 12, so it shows ${m} ${m === 1 ? 'minute' : 'minutes'}.` : `The long hand is the minute hand. It is ${plural(extra, 'small mark')} past the ${pointed}. Count by fives: ${base} × 5 = ${base * 5}, plus ${extra} more = ${m} minutes.`;
    return `${hourPart} ${minPart} The time is ${h}:${pad(m)}.`;
  }
  const HINT_READ = 'The short hand tells the hour. The long hand tells the minutes: count by fives around the clock, then add the small marks.';
  function jumpsText(s, e) {   // count up from s to e: to the next hour, whole hours, then the rest
    const parts = [], total = e - s; let cur = s;
    const toNext = (60 - mins(cur)) % 60;
    if (toNext && cur + toNext <= e) { parts.push(`${clockText(cur)} to ${clockText(cur + toNext)} is ${plural(toNext, 'minute')}`); cur += toNext; }
    const hrs = Math.floor((e - cur) / 60);
    if (hrs) { parts.push(`${clockText(cur)} to ${clockText(cur + hrs * 60)} is ${plural(hrs, 'hour')}`); cur += hrs * 60; }
    if (e - cur) parts.push(`${clockText(cur)} to ${clockText(e)} is ${plural(e - cur, 'minute')}`);
    return parts.join('. ');
  }
  function jumpsWhy(s, e, result) {   // the jumps, with the hour-to-minute fact stated first when whole hours are in them
    const j = jumpsText(s, e);
    return `${j}. ${/ is \d+ hours?(\.|$)/.test(j) ? '1 hour = 60 minutes. ' : ''}Add the jumps: ${result}.`;
  }
  function addWhy(s, d, back) {   // adding or going back d minutes from s, hours first
    const H = Math.floor(d / 60), M = d % 60, sign = back ? -1 : 1, out = []; let cur = s;
    if (H) { out.push(`${back ? 'Go back' : 'Add'} ${plural(H, 'hour')}: ${clockText(cur)} → ${clockText(cur + sign * H * 60)}.`); cur += sign * H * 60; }
    if (M) {
      const cm = mins(cur);
      if (!back && cm + M <= 60 && cm + M < 60) out.push(`Add ${plural(M, 'minute')}: ${clockText(cur)} → ${clockText(cur + M)}.`);
      else if (!back) { const toH = 60 - cm; out.push(`${clockText(cur)} plus ${plural(toH, 'minute')} is ${clockText(cur + toH)}${M - toH ? `, and ${plural(M - toH, 'more minute')} is ${clockText(cur + M)}` : ''}.`); }
      else if (cm === 0 || cm - M >= 0) out.push(`Go back ${plural(M, 'minute')}: ${clockText(cur)} → ${clockText(cur - M)}.`);
      else { out.push(`${clockText(cur)} back ${plural(cm, 'minute')} is ${clockText(cur - cm)}, and ${plural(M - cm, 'more minute')} back is ${clockText(cur - M)}.`); }
    }
    return out.join(' ');
  }

  /* ---------- read the clock (type the time) ---------- */
  function wrongTimes(h, m, count) {   // clocks a student could pick by mixing up the hands or the hour
    const c = [];
    if (m % 5 === 0) { const h2 = (m / 5) || 12, m2 = (h % 12) * 5; c.push([h2, m2]); }
    c.push([nextHour(h), m], [((h + 10) % 12) + 1, m], [h, (60 - m) % 60], [h, (m + 5) % 60], [h, (m + 55) % 60], [h, (m + 10) % 60], [nextHour(nextHour(h)), m]);
    const seen = new Set([`${h}:${m}`]), out = [];
    for (const [a, b] of shuffle(c)) { const k = `${a}:${b}`; if (!seen.has(k)) { seen.add(k); out.push([a, b]); } }
    return out.slice(0, count);
  }
  function readQ() {
    const h = rnd(1, 12), m = Math.random() < 0.65 ? 5 * rnd(0, 11) : rnd(0, 59), t = `${h}:${pad(m)}`;
    const a = m === 0 ? [t, `${h} o'clock`] : [t];
    return { q: `What time does the clock show? Type it like 4:35.${clockSVG(h, m)}`, plain: 'What time does the clock show?', a, show: t, wrong: wrongTimes(h, m, 3).map(([x, y]) => `${x}:${pad(y)}`), why: readWhy(h, m), hint: HINT_READ, say: 'What time does the clock show?', t: { h, m } };
  }

  /* ---------- which clock? (pick) ---------- */
  function pickQ() {
    const h = rnd(1, 12), m = pick([5 * rnd(0, 11), 5 * rnd(0, 11), 5 * rnd(0, 11), rnd(0, 59)]), t = `${h}:${pad(m)}`;
    const others = wrongTimes(h, m, 3); if (others.length < 3) return pickQ();
    const letters = ['A', 'B', 'C', 'D'], right = rnd(0, 3), times = []; let o = 0;
    for (let i = 0; i < 4; i++) times.push(i === right ? [h, m] : others[o++]);
    const grid = `<div class="tmpick">${times.map(([x, y], i) => `<figure><figcaption>${letters[i]}</figcaption>${clockSVG(x, y, 'Clock ' + letters[i])}</figure>`).join('')}</div>`;
    const wrongNote = others.map(([x, y]) => `${x}:${pad(y)}`);
    const why = `${readWhy(h, m).replace(/ The time is .*$/, '')} So clock ${letters[right]} shows ${t}. The others show ${times.filter((_, i) => i !== right).map(([x, y]) => `${x}:${pad(y)}`).join(', ')}.`;
    return { q: `Which clock shows ${t}?`, html: grid, a: letters[right], wrong: letters.filter((_, i) => i !== right), why, say: `Which clock shows ${sayTime(h, m)}?`, times: times.map(([x, y]) => `${x}:${pad(y)}`), wrongNote };
  }

  /* ---------- a.m. or p.m. ---------- */
  const EVENTS = [
    { t: 'Eli eats breakfast.', lo: 360, hi: 570, day: 'in the morning' }, { t: 'Eli gets on the school bus.', lo: 390, hi: 510, day: 'in the morning' },
    { t: 'Eli wakes up for school.', lo: 360, hi: 450, day: 'in the morning' }, { t: 'School starts.', lo: 465, hi: 540, day: 'in the morning' },
    { t: 'Eli eats a morning snack.', lo: 570, hi: 630, day: 'in the morning' }, { t: 'Eli eats lunch.', lo: 690, hi: 780, day: 'around the middle of the day' },
    { t: 'Eli gets home from school.', lo: 870, hi: 990, day: 'in the afternoon' }, { t: 'Eli goes to soccer practice after school.', lo: 930, hi: 1080, day: 'in the afternoon' },
    { t: 'Eli eats dinner.', lo: 1020, hi: 1170, day: 'in the evening' }, { t: 'Eli watches a family movie after dinner.', lo: 1110, hi: 1260, day: 'in the evening' },
    { t: 'Eli goes to bed.', lo: 1170, hi: 1290, day: 'at night' }, { t: 'Eli brushes his teeth before bed.', lo: 1170, hi: 1290, day: 'at night' }
  ];
  function ampmQ() {
    const ev = pick(EVENTS), right = 5 * rnd(ev.lo / 5, ev.hi / 5), wrong = [];
    const opp = (right + 720) % 1440; wrong.push(opp);   // the same clock time in the other half of the day, plus times near it: never sensible for the event
    for (const k of shuffle([-60, -30, 30, 60])) { const w = (opp + k + 1440) % 1440; if (wrong.length < 3 && !wrong.includes(w) && fullText(w) !== fullText(right)) wrong.push(w); }
    const a = fullText(right);
    const period = right < 720 ? 'a.m. is from midnight to noon' : 'p.m. is from noon to midnight';
    return { q: `Which time makes the most sense? ${ev.t}`, a, wrong: wrong.map(fullText), why: `${ev.t.replace(/\.$/, '')} ${ev.day}, so ${a} fits. Remember: ${period}.`, say: `Which time makes the most sense? ${ev.t}`, ev: ev.t };
  }

  /* ---------- elapsed time ---------- */
  function span(durMin, durMax) {   // a start and an end inside the same a.m. or p.m. period
    const d = 5 * rnd(durMin / 5, durMax / 5), pm = Math.random() < 0.5, base = pm ? 720 : 0, lo = base + (pm ? 0 : 60), hi = base + 720 - d - 5;
    const s = 5 * rnd(Math.ceil(lo / 5), Math.floor(hi / 5));
    return { s, e: s + d, d };
  }
  function minuteWrongs(d) {
    const c = [d + 5, d - 5, d + 10, d - 10, d + 15, d - 15, d + 60, d - 60, d + 20, d - 20, d + 30, d - 30];
    const out = []; for (const x of shuffle(c)) if (x >= 5 && x !== d && !out.includes(x)) out.push(x);
    return out.slice(0, 3);
  }
  function elapsedQ() {
    const { s, e, d } = span(10, 170), small = d < 60;
    const why = jumpsWhy(s, e, `${d} minutes`).replace(/\.\./g, '.');
    return { q: `How many minutes pass from ${fullText(s)} to ${fullText(e)}?${lineSVG(s, e)}`, plain: `How many minutes pass from ${fullText(s)} to ${fullText(e)}?`, a: d, show: `${d} minutes`, wrong: minuteWrongs(d).map(x => `${x} minutes`), why: small && mins(s) + d <= 60 && Math.floor(s / 60) === Math.floor(e / 60) ? `Both times are in the ${clockText(s).split(':')[0]} o'clock hour. ${mins(e)} − ${mins(s)} = ${d} minutes.` : why, hint: 'Count up from the start time: first to the next hour, then whole hours, then to the end time.', say: `How many minutes pass from ${fullText(s)} to ${fullText(e)}?`, s, e };
  }
  function hmWrongs(d) {   // other hours-and-minutes amounts a student could land on
    const out = [], set = new Set([durText(d)]);
    for (const k of shuffle([60, -60, 10, -10, 20, -20, 30, -30, 5, -5, 15, -15])) { const x = d + k, t = durText(x); if (x >= 65 && !set.has(t)) { set.add(t); out.push(t); } }
    return out.slice(0, 3);
  }
  function hmQ() {   // how much time in hours and minutes
    const d = 5 * rnd(13, 47); if (d % 60 === 0) return hmQ();
    const { s, e } = span(d, d), right = durText(d);
    return { q: `How much time passes from ${fullText(s)} to ${fullText(e)}?`, html: lineSVG(s, e), a: right, wrong: hmWrongs(d), why: jumpsWhy(s, e, right), say: `How much time passes from ${fullText(s)} to ${fullText(e)}?`, s, e };
  }

  /* ---------- what time will it be? (type the time) ---------- */
  function laterQ() {
    const back = Math.random() < 0.35, form = pick(['m', 'm', 'h', 'hm']);
    const d = form === 'm' ? 5 * rnd(2, 11) : form === 'h' ? 60 * rnd(1, 3) : 60 * rnd(1, 2) + 5 * rnd(1, 11);
    const pm = Math.random() < 0.5, base = pm ? 720 : 0;
    const lo = base + (back ? d + 60 : 60), hi = base + 720 - (back ? 5 : d + 5), s = 5 * rnd(Math.ceil(lo / 5), Math.floor(hi / 5)), r = back ? s - d : s + d;
    const wrongs = [], seen = new Set([r]);
    for (const w of shuffle([r + 10, r - 10, r + 60, r - 60, r + 20, r - 20, back ? s + d : s - d, r + 5, r - 5, r + 30, r - 30])) if (!seen.has(w) && w > base + 59 && w < base + 720 && clockText(w) !== clockText(r)) { seen.add(w); wrongs.push(w); }
    const txt = `It is ${fullText(s)} What time ${back ? 'was it' : 'will it be'} ${back ? `${durText(d)} ago` : `in ${durText(d)}`}? Type it like 4:35.`;
    return { q: txt, plain: txt, a: [clockText(r)], show: clockText(r), wrong: wrongs.slice(0, 3).map(clockText), why: `${addWhy(s, d, back)} The time is ${clockText(r)} ${suffix(r)}.`, hint: `${back ? 'Go back' : 'Add'} the hours first, then the minutes. If the minutes pass the hour, go to the hour and use the rest.`, say: `It is ${fullText(s)} What time ${back ? 'was it' : 'will it be'} ${back ? `${durText(d)} ago` : `in ${durText(d)}`}?`, s, d, back };
  }

  /* ---------- word problems (multiple choice) ---------- */
  /* each activity has a window for its start time (minutes after midnight), so nothing starts in the small hours */
  const ACTS = [{ n: 'soccer practice', lo: 900, hi: 1140 }, { n: 'the movie', lo: 720, hi: 1200 }, { n: 'the piano lesson', lo: 900, hi: 1140 }, { n: 'recess', lo: 600, hi: 780 },
    { n: 'the school play', lo: 600, hi: 1140 }, { n: 'art class', lo: 540, hi: 1020 }, { n: 'the swim lesson', lo: 540, hi: 1080 }, { n: 'the family bike ride', lo: 480, hi: 1080 }, { n: 'the library visit', lo: 600, hi: 1080 }];
  function actSpan(act, dMin, dMax) {   // start inside the activity's window; start and end in the same a.m. or p.m. period
    for (let t = 0; t < 500; t++) {
      const d = 5 * rnd(dMin / 5, dMax / 5), st = 5 * rnd(Math.ceil(act.lo / 5), Math.floor(act.hi / 5));
      if ((st < 720) === (st + d < 720) && st + d < 1440) return { s: st, e: st + d, d };
    }
    throw new Error('no actSpan');
  }
  function timeOpts(r, lo, hi, back, s, d) {
    const out = [], seen = new Set([r]);
    for (const w of shuffle([r + 10, r - 10, r + 60, r - 60, r + 20, r - 20, r + 5, r - 5, r + 30, r - 30, back ? s + d : s - d])) if (!seen.has(w) && w > lo && w < hi && clockText(w) !== clockText(r)) { seen.add(w); out.push(w); }
    return out.slice(0, 3);
  }
  function wordsQ() {
    const actO = pick(ACTS), act = actO.n, kind = pick(['mins', 'end', 'start', 'hm']), Act = cap(act);
    if (kind === 'mins') {
      const { s, e, d } = actSpan(actO, 15, 120);
      return { q: `${Act} starts at ${fullText(s)} and ends at ${fullText(e)} How many minutes does it last?`, a: `${d} minutes`, wrong: minuteWrongs(d).map(x => `${x} minutes`), why: jumpsWhy(s, e, `${d} minutes`), say: `${Act} starts at ${fullText(s)} and ends at ${fullText(e)} How many minutes does it last?`, k: 'mins', s, e };
    }
    if (kind === 'hm') {
      const d = 5 * rnd(13, 47); if (d % 60 === 0) return wordsQ();
      const { s, e } = actSpan(actO, d, d), right = durText(d);
      return { q: `${Act} starts at ${fullText(s)} and ends at ${fullText(e)} How long does it last?`, a: right, wrong: hmWrongs(d), why: jumpsWhy(s, e, right), say: `${Act} starts at ${fullText(s)} and ends at ${fullText(e)} How long does it last?`, k: 'hm', s, e };
    }
    const back = kind === 'start', d = pick([5 * rnd(3, 11), 60 + 5 * rnd(1, 11), 120 + 5 * rnd(0, 6)]);
    const sp = actSpan(actO, d, d), known = back ? sp.e : sp.s, r = back ? sp.s : sp.e, base = r < 720 ? 0 : 720;
    const opts = timeOpts(r, Math.max(base + 59, 359), base + 720, back, known, d);
    if (opts.length < 3) return wordsQ();
    const q = back ? `${Act} ends at ${fullText(known)} and lasts ${durText(d)}. What time did it start?` : `${Act} starts at ${fullText(known)} and lasts ${durText(d)}. What time does it end?`;
    return { q, a: fullText(r), wrong: opts.map(fullText), why: `${addWhy(known, d, back)} It ${back ? 'started' : 'ends'} at ${fullText(r)}.`, say: q, k: kind, s: known, d };
  }

  const TIMEGEN = { readQ, pickQ, ampmQ, elapsedQ, hmQ, laterQ, wordsQ, clockSVG, lineSVG, timeWords, sayTime, durText, parseTime, readWhy, clockText, fullText, EVENTS, HINT_READ };
  if (typeof module !== 'undefined') module.exports = TIMEGEN; else root.TIMEGEN = TIMEGEN;
})(typeof window !== 'undefined' ? window : globalThis);
