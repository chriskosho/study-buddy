/* Checks the Telling Time and Elapsed Time generators: makes thousands of problems and re-solves each one from its question text
   (and, for clocks, from the hand angles read back out of the SVG), a different method from the generator.
   Run: node study-buddy/_dev/tests/gen_check_time.mjs     Repeat a failure: SEED=<n> node ... */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const SEED = Number(process.env.SEED) || (Date.now() % 1e9);
Math.random = (a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(SEED);
const G = require('../../modules/math/time/gen.js');
const N = 3000; let fails = 0;
const bad = (t, q, m) => { if (fails++ < 15) console.log('FAIL', t, '|', String(q.q).replace(/<svg[\s\S]*?<\/svg>/g, '[svg]'), '|', m, '| a =', q.a, q.wrong || ''); };

/* ---- read a clock back out of its SVG: angles of the two hands, measured from 12 going clockwise ---- */
const ang = (x, y) => { const d = Math.atan2(x - 100, 100 - y) * 180 / Math.PI; return (d + 360) % 360; };
function readClock(svg) {
  const hh = svg.match(/<line class="hh" x1="100" y1="100" x2="([-\d.]+)" y2="([-\d.]+)"\/>/), mh = svg.match(/<line class="mh" x1="100" y1="100" x2="([-\d.]+)" y2="([-\d.]+)"\/>/);
  if (!hh || !mh) return null;
  const hA = ang(+hh[1], +hh[2]), mA = ang(+mh[1], +mh[2]), minute = Math.round(mA / 6) % 60;
  if (Math.abs(((mA - minute * 6 + 540) % 360) - 180) > 0.6) return { err: 'minute hand is not on a minute mark' };
  let hour = Math.round((hA - minute * 0.5) / 30) % 12; if (hour === 0) hour = 12;
  const want = (hour % 12) * 30 + minute * 0.5;
  if (Math.abs(((hA - want + 540) % 360) - 180) > 0.6) return { err: `hour hand at ${hA.toFixed(1)} but should be ${want} for ${hour}:${minute}` };
  return { h: hour, m: minute };
}
const svgs = html => html.match(/<svg class="tmclk"[\s\S]*?<\/svg>/g) || [];
const furniture = (t, q, svg) => {   // 12 numbers, 60 ticks (12 thick), a neutral label, no literal white
  if ((svg.match(/class="num"/g) || []).length !== 12) bad(t, q, 'clock needs 12 numbers');
  if ((svg.match(/class="tick/g) || []).length !== 60 || (svg.match(/tick5/g) || []).length !== 12) bad(t, q, 'clock needs 60 ticks, 12 thick');
  if (/#fff|white/i.test(svg)) bad(t, q, 'literal white in clock');
};
/* ---- parsing times and spans from text ---- */
const T = '(\\d{1,2}):(\\d{2}) (a\\.m\\.|p\\.m\\.)';
const toAbs = (h, m, ap) => ((+h % 12) + (ap === 'p.m.' ? 12 : 0)) * 60 + +m;
const absOf = s => { const m = s.match(new RegExp('^' + T + '$')); return m ? toAbs(m[1], m[2], m[3]) : null; };
const ct = abs => `${(Math.floor(abs / 60) % 12) || 12}:${String(abs % 60).padStart(2, '0')}`;
const dur = s => { const h = s.match(/(\d+) hours?/), m = s.match(/(\d+) minutes?/); return (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0); };
const dtext = d => { const H = Math.floor(d / 60), M = d % 60; const p = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`; return !H ? p(M, 'minute') : M ? `${p(H, 'hour')} ${p(M, 'minute')}` : p(H, 'hour'); };
const period = abs => abs < 720 ? 0 : 1;
const mcOk = (t, q) => {
  if (!q.a || !q.wrong || q.wrong.length < 3) return bad(t, q, 'needs an answer and 3 wrong options');
  if (q.wrong.includes(q.a)) bad(t, q, 'answer is also a wrong option');
  if (new Set(q.wrong).size !== q.wrong.length) bad(t, q, 'duplicate wrong options');
};
const textOk = (t, q) => {
  if (!q.why || /undefined|NaN|Infinity/.test(q.why + q.q)) bad(t, q, 'missing or odd why');
  if (/\b(\d+) minutes\b/.test(q.why) === false && !/[0-9]/.test(q.why)) bad(t, q, 'explanation has no numbers');
};
const typedOk = (t, q) => {
  if (!q.hint) bad(t, q, 'missing hint');
  if (!q.wrong || q.wrong.length < 3) bad(t, q, 'needs 3 wrong options for the Quiz');
  else { if (q.wrong.includes(q.show)) bad(t, q, 'a wrong option equals the answer'); if (new Set(q.wrong).size !== q.wrong.length) bad(t, q, 'duplicate wrong options'); }
};

for (let i = 0; i < N; i++) {
  /* ---- read the clock ---- */
  let q = G.readQ(); textOk('read', q); typedOk('read', q);
  let ss = svgs(q.q); if (ss.length !== 1) bad('read', q, 'one clock expected'); else {
    furniture('read', q, ss[0]); const c = readClock(ss[0]);
    if (!c || c.err) bad('read', q, c ? c.err : 'cannot read hands');
    else {
      const want = `${c.h}:${String(c.m).padStart(2, '0')}`;
      if (q.a[0] !== want || q.show !== want) bad('read', q, `clock shows ${want}`);
      if (c.m === 0 && !q.a.includes(`${c.h} o'clock`)) bad('read', q, 'o\'clock form missing');
      if (/aria-label="[^"]*\d:\d\d/.test(ss[0])) bad('read', q, 'clock label gives the time away');
      /* typed forms all reduce to the same letters and digits */
      const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const f of [want, want.replace(':', ' '), want.replace(':', '')]) if (!q.a.some(x => norm(x) === norm(f))) bad('read', q, `${f} would not be accepted`);
      for (const w of q.wrong) if (q.a.some(x => norm(x) === norm(w))) bad('read', q, 'a wrong option is also accepted');
    }
  }

  /* ---- pick the clock ---- */
  q = G.pickQ(); mcOk('pick', q); textOk('pick', q);
  const pm = q.q.match(/^Which clock shows (\d{1,2}):(\d{2})\?$/);
  ss = svgs(q.html || '');
  if (!pm || ss.length !== 4) bad('pick', q, 'expected a time and four clocks'); else {
    const target = `${pm[1]}:${pm[2]}`, shown = ss.map(s => { furniture('pick', q, s); const c = readClock(s); return c && !c.err ? `${c.h}:${String(c.m).padStart(2, '0')}` : 'x'; });
    const hits = shown.map((s, k) => s === target ? 'ABCD'[k] : '').join('');
    if (hits.length !== 1) bad('pick', q, `${hits.length} clocks show ${target}: ${shown}`); else if (hits !== q.a) bad('pick', q, `answer should be ${hits}`);
    if (new Set(shown).size !== 4) bad('pick', q, 'two clocks show the same time');
    if (shown.includes('x')) bad('pick', q, 'unreadable clock');
    if (!['A', 'B', 'C', 'D'].every(l => q.q.includes(l) || (q.html || '').includes('>' + l + '<'))) bad('pick', q, 'clocks are not lettered');
    if (!q.a || q.wrong.sort().join('') !== 'ABCD'.replace(q.a, '')) bad('pick', q, 'wrong options should be the other letters');
  }

  /* ---- a.m. or p.m. ---- */
  q = G.ampmQ(); mcOk('ampm', q); textOk('ampm', q);
  const ev = G.EVENTS.find(e => q.q.endsWith(e.t));
  if (!ev) bad('ampm', q, 'unknown event'); else {
    const r = absOf(q.a); if (r === null || r < ev.lo || r > ev.hi) bad('ampm', q, 'answer is not in the sensible window');
    for (const w of q.wrong) { const x = absOf(w); if (x === null) { bad('ampm', q, 'unparseable ' + w); continue; } const dist = Math.min(...[0, 1440, -1440].map(o => x < ev.lo + o ? ev.lo + o - x : x > ev.hi + o ? x - ev.hi - o : 0)); if (dist < 300) bad('ampm', q, `${w} could also fit "${ev.t}"`); }
  }

  /* ---- elapsed time in minutes ---- */
  q = G.elapsedQ(); textOk('elapsed', q); typedOk('elapsed', q);
  let m = String(q.q).match(new RegExp(`^How many minutes pass from ${T} to ${T}\\?`));
  if (!m) bad('elapsed', q, 'form'); else {
    const s = toAbs(m[1], m[2], m[3]), e = toAbs(m[4], m[5], m[6]), d = e - s;
    if (d <= 0 || period(s) !== period(e)) bad('elapsed', q, 'crosses noon or midnight');
    if (q.a !== d) bad('elapsed', q, `answer should be ${d}`);
    if (q.show !== `${d} minutes`) bad('elapsed', q, 'show text');
    for (const w of q.wrong) { const x = parseInt(w); if (x === d || x <= 0) bad('elapsed', q, 'bad wrong option ' + w); }
    if (!q.q.includes(`from ${m[1]}:${m[2]} ${m[3]} to ${m[4]}:${m[5]} ${m[6]}`)) bad('elapsed', q, 'form');
    if (!String(q.q).includes('class="tmline"')) bad('elapsed', q, 'number line missing');
    if (!q.why.includes(`${d} minutes`)) bad('elapsed', q, 'explanation does not give the answer');
  }

  /* ---- hours and minutes ---- */
  q = G.hmQ(); mcOk('hm', q); textOk('hm', q);
  m = q.q.match(new RegExp(`^How much time passes from ${T} to ${T}\\?$`));
  if (!m) bad('hm', q, 'form'); else {
    const s = toAbs(m[1], m[2], m[3]), e = toAbs(m[4], m[5], m[6]), d = e - s;
    if (d <= 0 || period(s) !== period(e)) bad('hm', q, 'crosses noon or midnight');
    if (q.a !== dtext(d)) bad('hm', q, `answer should be ${dtext(d)}`);
    if (d < 60 || d % 60 === 0) bad('hm', q, 'should be hours and minutes');
    for (const w of q.wrong) if (dur(w) === d || dur(w) <= 0) bad('hm', q, 'bad wrong option ' + w);
    if (!q.why.includes(q.a)) bad('hm', q, 'explanation does not give the answer');
  }

  /* ---- what time will it be ---- */
  q = G.laterQ(); textOk('later', q); typedOk('later', q);
  m = q.q.match(new RegExp(`^It is ${T} What time (will it be|was it) (?:in )?(.+?)(?: ago)?\\? Type it like 4:35\\.$`));
  if (!m) bad('later', q, 'form'); else {
    const s = toAbs(m[1], m[2], m[3]), d = dur(m[5]), back = m[4] === 'was it', r = back ? s - d : s + d;
    if (m[5] !== dtext(d)) bad('later', q, 'duration text');
    if (r < 60 || r >= 720 + (period(s) ? 720 : 0) || period(r) !== period(s)) bad('later', q, 'crosses noon or midnight');
    if (q.a[0] !== ct(r) || q.show !== ct(r)) bad('later', q, `answer should be ${ct(r)}`);
    if (/^12:/.test(ct(r))) bad('later', q, '12 o\'clock answer is ambiguous');
    for (const w of q.wrong) if (w === ct(r) || /^12:/.test(w)) bad('later', q, 'bad wrong option ' + w);
    if (!q.why.includes(ct(r))) bad('later', q, 'explanation does not give the answer');
  }

  /* ---- word problems ---- */
  q = G.wordsQ(); mcOk('words', q); textOk('words', q);
  const [A] = [String(q.q)];
  if ((m = A.match(new RegExp(`^(.+?) starts at ${T} and ends at ${T} How many minutes does it last\\?$`)))) {
    const s = toAbs(m[2], m[3], m[4]), e = toAbs(m[5], m[6], m[7]), d = e - s;
    if (d <= 0 || period(s) !== period(e)) bad('words', q, 'crosses noon or midnight'); if (q.a !== `${d} minutes`) bad('words', q, `answer should be ${d} minutes`);
    for (const w of q.wrong) if (parseInt(w) === d) bad('words', q, 'wrong option equals answer');
  } else if ((m = A.match(new RegExp(`^(.+?) starts at ${T} and ends at ${T} How long does it last\\?$`)))) {
    const s = toAbs(m[2], m[3], m[4]), e = toAbs(m[5], m[6], m[7]), d = e - s;
    if (d <= 0 || period(s) !== period(e)) bad('words', q, 'crosses noon or midnight'); if (q.a !== dtext(d)) bad('words', q, `answer should be ${dtext(d)}`);
    for (const w of q.wrong) if (dur(w) === d) bad('words', q, 'wrong option equals answer');
  } else if ((m = A.match(new RegExp(`^(.+?) starts at ${T} and lasts (.+)\\. What time does it end\\?$`)))) {
    const s = toAbs(m[2], m[3], m[4]), d = dur(m[5]), r = s + d;
    if (period(r) !== period(s) || r >= 1440) bad('words', q, 'crosses noon or midnight'); if (m[5] !== dtext(d)) bad('words', q, 'duration text');
    const want = `${ct(r)} ${r < 720 ? 'a.m.' : 'p.m.'}`; if (q.a !== want) bad('words', q, `answer should be ${want}`);
    for (const w of q.wrong) if (absOf(w) === r || period(absOf(w)) !== period(r)) bad('words', q, 'bad wrong option ' + w);
  } else if ((m = A.match(new RegExp(`^(.+?) ends at ${T} and lasts (.+)\\. What time did it start\\?$`)))) {
    const e = toAbs(m[2], m[3], m[4]), d = dur(m[5]), r = e - d;
    if (period(r) !== period(e) || r < 0) bad('words', q, 'crosses noon or midnight');
    const want = `${ct(r)} ${r < 720 ? 'a.m.' : 'p.m.'}`; if (q.a !== want) bad('words', q, `answer should be ${want}`);
    for (const w of q.wrong) if (absOf(w) === r || period(absOf(w)) !== period(r)) bad('words', q, 'bad wrong option ' + w);
  } else bad('words', q, 'unexpected question form');
}

/* ---- words for times and parsing ---- */
const wantWords = { '4:00': "four o'clock", '4:15': 'quarter past four', '4:30': 'half past four', '4:45': 'quarter to five', '4:35': 'twenty-five minutes to five', '12:50': 'ten minutes to one', '9:05': 'five minutes past nine', '11:55': 'five minutes to twelve', '6:21': 'twenty-one minutes past six', '6:59': 'one minute to seven' };
for (const [t, w] of Object.entries(wantWords)) { const [h, mm] = t.split(':').map(Number); if (G.timeWords(h, mm) !== w) { fails++; console.log('FAIL words for', t, G.timeWords(h, mm), '!=', w); } }
for (const [s, h, mm] of [['4:35', 4, 35], ['435', 4, 35], ['4 35', 4, 35], ['12:05', 12, 5], ['1205', 12, 5], ['9', 9, 0]]) { const r = G.parseTime(s); if (r.h !== h || r.m !== mm) { fails++; console.log('FAIL parse', s, r); } }
for (const s of ['13:00', '4:60', '', 'abc', '0:30']) { let threw = false; try { G.parseTime(s); } catch { threw = true; } if (!threw) { fails++; console.log('FAIL parse should reject', s); } }
console.log(fails ? `${fails} FAILED (SEED=${SEED})` : 'ALL PASSED');
process.exit(fails ? 1 : 0);
