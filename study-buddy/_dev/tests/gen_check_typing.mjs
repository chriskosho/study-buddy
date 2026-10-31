/* Checks the typing logic (shared/sb-typing-gen.js) without a browser.
   node _dev/tests/gen_check_typing.mjs   (SEED=<n> repeats a run) */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const require = createRequire(import.meta.url);
const SITE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const W = require(join(SITE, 'shared/sb-typing-words.js'));
const G = require(join(SITE, 'shared/sb-typing-gen.js'));
const X = require(join(SITE, 'shared/sb-typing-text.js'));

const SEED = Number(process.env.SEED) || (Date.now() % 1e9);
const rand = G.seeded(SEED);
let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; if (fails < 25) console.log('FAIL', msg); } };

/* ---- the course order ---- */
ok(G.ORDER.length === 26 && new Set(G.ORDER).size === 26 && G.ORDER.every(c => /^[a-z]$/.test(c)), 'ORDER is the 26 letters once each');
ok(G.ORDER.slice(0, G.START).join('') === 'asdfjkl', 'the course starts on the home row');

/* ---- the word list ---- */
ok(W.words.length > 3000, 'word list has over 3000 words');
ok(new Set(W.words).size === W.words.length, 'no repeated words');
W.words.forEach(w => { ok(/^[a-z]{1,10}$/.test(w), 'word is lowercase letters, 10 or fewer: ' + w); ok(!G.blocked(w), 'word is not blocked: ' + w); });
ok(W.words.filter(w => w.length === 1).every(w => w === 'a' || w === 'i'), 'only a and i are one letter');
ok(G.blocked('kill') && G.blocked('xxkillxx', true) && !G.blocked('skill'), 'blocklist works on whole and hidden words');
/* made-up words a reviewer found reading as unkind (October 2026) stay blocked */
['gook', 'chink', 'slag', 'tard', 'hetard', 'whor', 'whory', 'hore', 'fuq', 'fukfany', 'kak', 'poos', 'bum', 'gregazz', 'jew', 'subjews', 'isis', 'nigi', 'curnig', 'ded', 'kild', 'kil', 'retars']
  .forEach(w => ok(G.blocked(w, true), 'made-up word is blocked: ' + w));

/* ---- lessons ---- */
let lessons = 0;
for (let n = G.START; n <= 26; n++) {
  const open = G.ORDER.slice(0, n), set = new Set(open);
  const pool = G.realPool(open);
  ok(pool.every(w => [...w].every(c => set.has(c))), 'real pool only uses open letters, stage ' + n);
  open.forEach(focus => {
    let thin = 0;
    for (let t = 0; t < 25; t++) {
      const ws = G.lessonWords({ allowed: open, focus, rand, n: 12 }); lessons++;
      ok(ws.length === 12, 'a lesson has 12 words');
      ws.forEach((w, i) => {
        ok(typeof w === 'string' && w.length >= 2 && w.length <= 10, `word length 2 to 10: "${w}"`);
        ok([...w].every(c => set.has(c)), `only open letters (stage ${n}): "${w}"`);
        ok(!G.blocked(w, !G.WORDS.includes(w)), `no unkind word: "${w}"`);
        ok(!ws.slice(Math.max(0, i - 4), i).includes(w), `no repeat within four words: "${w}"`);
        ok(!/(.)\1\1/.test(w), `no letter three times in a row: "${w}"`);
      });
      const text = ws.join(''), count = text.split(focus).length - 1;
      if (count < 3) thin++;
    }
    ok(thin === 0, `focus letter ${focus} appears 3+ times in every lesson (stage ${n}), thin=${thin}`);
  });
}
/* real words show up once enough letters are open */
{
  const open = G.ORDER.slice(0, 16); let real = 0, all = 0;
  for (let t = 0; t < 200; t++) G.lessonWords({ allowed: open, focus: 'o', rand }).forEach(w => { all++; if (G.WORDS.includes(w)) real++; });
  ok(real / all > 0.5, 'more than half the words are real at 16 letters: ' + (real / all).toFixed(2));
}
/* the same seed gives the same lesson */
{
  const a = G.lessonWords({ allowed: G.ORDER.slice(0, 11), focus: 'i', rand: G.seeded(42) }).join(' ');
  const b = G.lessonWords({ allowed: G.ORDER.slice(0, 11), focus: 'i', rand: G.seeded(42) }).join(' ');
  ok(a === b, 'seeded lessons repeat');
}

/* ---- per-key stats and unlocking ---- */
{
  const st = {};
  const row = (ch, ok, ms) => ({ ch, ok, ms });
  G.addRound(st, [row('a', true, 0), row(' ', true, 300), ...Array.from({ length: 12 }, () => row('a', true, 400))]);
  let s = G.keyStat(st, 'a');
  ok(s.n === 13 && s.acc === 1, 'samples counted, space ignored');
  ok(Math.abs(s.wpm - 30) < 1e-9, '400 ms a key is 30 WPM: ' + s.wpm);
  ok(G.ready(st, 'a', 25) && !G.ready(st, 'a', 35), 'ready at 25, not at 35');
  G.addRound(st, Array.from({ length: 40 }, (x, i) => row('a', i % 10 !== 0, 300)));
  s = G.keyStat(st, 'a');
  ok(s.n === G.WINDOW, 'only the last 30 are kept');
  ok(s.acc < 0.95 && !G.ready(st, 'a', 10), 'mistakes stop a key being ready: ' + s.acc);
  G.addRound(st, [row('s', true, 5000)]);
  ok(G.keyStat(st, 's').ms === 3000 && G.keyStat(st, 's').n === 1, 'a pause over 3 seconds counts as 3 seconds');
  const slow = {}; G.addRound(slow, [...Array.from({ length: 9 }, () => row('d', true, 4000)), row('d', true, 600)]);
  ok(!G.ready(slow, 'd', 15), 'slow hunt-and-peck presses do not make a letter ready: ' + G.keyStat(slow, 'd').wpm.toFixed(1));

  const st2 = {}, open = G.ORDER.slice(0, G.START);
  ok(!G.canUnlock(open, st2, 15), 'nothing opens with no practice');
  open.forEach(k => G.addRound(st2, Array.from({ length: 12 }, () => row(k, true, 500))));   // 24 WPM
  ok(G.canUnlock(open, st2, 15), 'opens when every letter is ready');
  ok(!G.canUnlock(open, st2, 30), 'does not open below the target');
  G.addRound(st2, Array.from({ length: 6 }, () => row('j', false, 0)));
  ok(!G.canUnlock(open, st2, 15), 'one weak letter holds the next one back');
  ok(G.focusKey(open, st2, 15) === 'j', 'the weak letter is the focus');
  const st3 = {}; open.forEach(k => G.addRound(st3, Array.from({ length: 12 }, () => row(k, true, 500))));
  ok(G.focusKey(G.ORDER.slice(0, 8), st3, 15) === 'g', 'a new letter is the focus');
  ok(!G.canUnlock(G.ORDER, Object.fromEntries(G.ORDER.map(k => [k, Array.from({ length: 12 }, () => [300, 1])])), 15), 'nothing after the last letter');
}

/* ---- round scores ---- */
{
  const r = G.roundScore({ correct: 50, elapsed: 60000, presses: 55, wrong: 5 });
  ok(Math.abs(r.wpm - 10) < 1e-9, '50 characters in a minute is 10 WPM');
  ok(Math.abs(r.acc - 50 / 55) < 1e-9, 'accuracy is right presses over all presses');
  ok(G.roundScore({ correct: 0, elapsed: 0, presses: 0, wrong: 0 }).acc === 1, 'empty round is safe');
}


/* ---- drills ---- */
{
  const ROWCH = { home: 'asdfghjkl; ', top: 'qwertyuiop ', bottom: 'zxcvbnm,. ', number: '1234567890- ' };
  const words = t => t.split(' ').filter(Boolean);
  for (let t = 0; t < 400; t++) {
    for (const row of Object.keys(ROWCH)) {
      const text = G.rowDrill(row, rand);
      ok([...text].every(c => ROWCH[row].includes(c)), `${row} row drill uses only that row: "${text}"`);
      ok(words(text).length === 20, `${row} row drill length`);
      words(text).forEach(w => ok(!G.blocked(w.replace(/[^a-z]/g, ''), !G.WORDS.includes(w.replace(/[^a-z]/g, ''))), `no unkind group in ${row}: "${w}"`));
      if (row === 'number') ok([...'0123456789'].every(d => text.includes(d)), 'number drill uses every digit: ' + text);
    }
    const caps = G.capitalsDrill(rand);
    ok(/[A-Z]/.test(caps) && words(caps).every(w => /^[A-Za-z]{3,8}$/.test(w) && X.common.includes(w.toLowerCase())), 'capitals drill is common kid words, some capitalized: ' + caps);
    const punct = G.punctDrill(rand);
    ok(/^[A-Za-z ,.?!;:'"()\-]+$/.test(punct), 'punctuation drill uses only letters and the taught marks: ' + punct);
    ok(/[,.?!;:'"()\-]/.test(punct), 'punctuation drill has punctuation');
    words(punct).forEach(w => { const bare = w.replace(/[^A-Za-z'\-]/g, ''); ok(G.CONTRACTIONS.includes(bare) || G.HYPHENS.includes(bare) || X.common.includes(bare.toLowerCase()), 'punctuation drill word is a common kid word: ' + w); });
    for (const size of [100, 300, 1000]) {
      const cw = words(G.commonWords(rand, size)).map(w => w === 'I' ? 'i' : w), top = new Set(X.common.slice(0, size));
      ok(cw.length === 25 && cw.every(w => top.has(w)), `common words come from the top ${size}`);
      ok(cw.every((w, i) => !cw.slice(Math.max(0, i - 3), i).includes(w)), 'common words do not repeat within three');
    }
  }
  /* weak keys */
  const st = {}, open = G.ORDER.slice(0, 14);
  open.forEach(k => G.addRound(st, Array.from({ length: 12 }, (x, i) => ({ ch: k, ok: k === 'e' ? i % 3 > 0 : true, ms: k === 'r' ? 1200 : k === 'u' ? 900 : 300 }))));
  const weak = G.weakLetters(st, open, 15);
  ok(weak.length === 3 && weak.includes('e') && weak.includes('r') && weak.includes('u'), 'weak letters are the missed and slow ones: ' + weak);
  for (let t = 0; t < 200; t++) {
    const w = words(G.weakDrill(st, open, 15, rand));
    ok(w.length === 16 && w.every(x => [...x].every(c => open.includes(c))), 'weak drill uses known letters only');
    ok(w.filter(x => weak.some(c => x.includes(c))).length >= 14, 'weak drill words carry the weak letters');
  }
  ok(G.weakDrill({}, open, 15, rand) === '', 'weak drill is empty with no typing yet');
  /* uneven practice: a letter typed only a few times is not called weak; the most missed letters are */
  {
    const u = {}, mk = (k, n, hits, ms) => G.addRound(u, Array.from({ length: n }, (x, i) => ({ ch: k, ok: i < hits, ms })));
    'asfjklgher'.split('').forEach(k => mk(k, 12, 12, 300));
    mk('d', 4, 4, 300); mk('i', 10, 6, 300); mk('o', 20, 13, 300);
    const wl = G.weakLetters(u, G.ORDER.slice(0, 16), 15);
    ok(wl[0] === 'i' && wl[1] === 'o' && !wl.includes('d'), 'weak letters ignore barely typed letters and rank the most missed first: ' + wl);
  }
  /* stars */
  ok(G.stars({ acc: 0.8, wpm: 30 }, { acc: 0.93, wpm: 15 }) === 1, '1 star below the accuracy goal');
  ok(G.stars({ acc: 0.95, wpm: 10 }, { acc: 0.93, wpm: 15 }) === 2, '2 stars with accuracy but not speed');
  ok(G.stars({ acc: 0.95, wpm: 15 }, { acc: 0.93, wpm: 15 }) === 3, '3 stars with both');
  ok(G.pickText(['a', 'b', 'c', 'd'], 3, rand).split(' ').length === 3 && new Set(G.pickText(['a', 'b', 'c', 'd'], 4, rand).split(' ')).size === 4, 'pickText gives different items');
}

/* ---- practice sentences and paragraphs ---- */
{
  ok(X.common.length >= 900 && new Set(X.common).size === X.common.length && X.common.every(w => /^[a-z]+$/.test(w) && !G.blocked(w)), 'common kid words: unique, lowercase, none blocked');
  ok(X.common.slice(0, 10).includes('the') && X.common.includes('a') && X.common.includes('i'), 'common kid words start with sight words and include a and I');
  const all = [...X.sentences, ...X.numbers, ...X.paragraphs];
  ok(X.sentences.length >= 200 && X.numbers.length >= 40 && X.paragraphs.length >= 30, `enough practice text (${X.sentences.length}, ${X.numbers.length}, ${X.paragraphs.length})`);
  ok(new Set(all).size === all.length, 'no repeated practice text');
  all.forEach(t => {
    ok(/^[\x20-\x7e]+$/.test(t), 'plain keyboard characters only: ' + t.slice(0, 40));
    ok(/^[A-Z"(]/.test(t) && /[.?!"')]$/.test(t), 'starts with a capital and ends with punctuation: ' + t.slice(0, 40));
    ok(!/\s{2,}/.test(t) && t === t.trim(), 'single spaces: ' + t.slice(0, 40));
    /* the reviewed science text may use a few words the made-up-word blocklist stops (a plant's shoot, a heart pumping blood, a penguin's fat) */
    const SCIENCE = new Set(['blood', 'shoot', 'fat']);
    t.toLowerCase().split(/[^a-z]+/).filter(Boolean).forEach(w => ok(SCIENCE.has(w) || !G.blocked(w), 'no blocked word in practice text: ' + w));
  });
  X.sentences.forEach(t => ok(!/\d/.test(t), 'plain sentences have no digits: ' + t));
  X.numbers.forEach(t => ok(/\d/.test(t), 'number sentences have digits: ' + t));
}

console.log(`typing: ${lessons} lessons checked, seed ${SEED}`);
if (fails) { console.log(fails + ' FAILED (SEED=' + SEED + ')'); process.exit(1); }
console.log('ALL PASSED');
