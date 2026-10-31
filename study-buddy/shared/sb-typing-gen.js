/* Study Buddy typing: the logic behind the typing tools, with no page code, so Node can check it too
   (_dev/tests/gen_check_typing.mjs). Loaded after shared/sb-typing-words.js.

     SBTG.ORDER                      the letters in the order the adaptive course unlocks them (home row first)
     SBTG.START                      how many letters are open at the start (a s d f j k l)
     SBTG.lessonWords(opts)          words for one lesson round, using only open letters, leaning on the focus letter
     SBTG.pseudoWord(allowed, rand, focus)   a made-up word that looks like English (for when too few real words fit)
     SBTG.blocked(word, partial)     true for unkind words (hashed, so no bad words are written in the site)
     SBTG.addRound(stats, chars)     add a finished round's keystrokes to the per-key stats (the last 30 per key are kept)
     SBTG.keyStat(stats, k)          { n, acc, ms, wpm } for one key
     SBTG.ready(stats, k, target)    the key is fast and accurate enough (10+ samples, 95%+, target speed)
     SBTG.focusKey(open, stats, target)      the weakest open letter, which the lesson practices most
     SBTG.canUnlock(open, stats, target)     every open letter is ready, so the next one can open
     SBTG.roundScore(r)              { wpm, acc } for a finished round

   Drills (Typing Drills module), each returns the text to type:
     SBTG.rowDrill(row, rand)        'home' | 'top' | 'bottom' | 'number': key groups and real words from that row
     SBTG.capitalsDrill(rand)        common words, most with a capital first letter (Shift)
     SBTG.punctDrill(rand)           words with , . ? ! ; : ' " - ( ), contractions, and hyphenated words
     SBTG.commonWords(rand, size)    words from the 100, 300, or 1,000 most common words for kids (SBTX.common)
     SBTG.weakDrill(stats, open, target, rand)   words that lean on the student's three weakest letters
     SBTG.pickText(list, n, rand)    n different items from a list (sentences, paragraphs), joined with spaces
     SBTG.stars(r, goal)             1 star for finishing, 2 for the accuracy goal, 3 for accuracy and speed

   Speed: WPM counts 5 characters as a word. A key's speed is the time from the key before it. */
(function (root) {
  'use strict';
  const W = (root.SBTW || (typeof require === 'function' ? require('./sb-typing-words.js') : null)) || { words: [], block: [] };
  /* the practice text (common words for kids, sentences) is only loaded by pages that need it */
  const textData = () => root.SBTX || (typeof require === 'function' ? (() => { try { return require('./sb-typing-text.js'); } catch (e) { return null; } })() : null) || {};

  const ORDER = 'asdfjklgheiruty onwmcbvxpqz'.replace(/ /g, '').split('');
  const START = 7;
  const WINDOW = 30, MIN_SAMPLES = 10, READY_ACC = 0.95, SLOW_MS = 3000;

  /* ---------- the blocklist: 32-bit FNV-1a hashes of words that must never appear ---------- */
  const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; };
  const BLOCK = new Set(W.block);
  /* a real word is checked as a whole; a made-up word is also checked for any unkind word hiding inside it */
  function blocked(w, partial) {
    if (BLOCK.has(fnv(w))) return true;
    if (!partial) return false;
    for (let i = 0; i < w.length; i++) for (let j = i + 3; j <= Math.min(w.length, i + 8); j++) if (BLOCK.has(fnv(w.slice(i, j)))) return true;
    return false;
  }

  const WORDS = W.words.filter(w => /^[a-z]+$/.test(w) && w.length > 1 && !blocked(w));

  /* ---------- letter model for made-up words: which letter follows two letters, from the word list ---------- */
  const TRI = new Map();
  WORDS.forEach((w, i) => {
    const wt = i < 1000 ? 3 : i < 3000 ? 2 : 1, s = '^^' + w + '$';
    for (let k = 2; k < s.length; k++) { const key = s.slice(k - 2, k), m = TRI.get(key) || new Map(); m.set(s[k], (m.get(s[k]) || 0) + wt); TRI.set(key, m); }
  });
  const pick = (pairs, rand) => { let t = 0; pairs.forEach(p => t += p[1]); let x = rand() * t; for (const p of pairs) { if ((x -= p[1]) < 0) return p[0]; } return pairs[pairs.length - 1][0]; };

  function rawPseudo(allowed, rand) {
    const len = 3 + Math.floor(rand() * 4);   // aim for 3 to 6 letters
    let s = '^^', out = '';
    while (out.length < 8) {
      const m = TRI.get(s.slice(-2)) || new Map(), pairs = [];
      allowed.forEach(c => pairs.push([c, (m.get(c) || 0) + 0.02]));
      if (out.length >= 2) pairs.push(['$', (m.get('$') || 0) * (out.length >= len ? 4 : 0.3) + (out.length >= len ? 1 : 0)]);
      const c = pick(pairs, rand); if (c === '$') break;
      out += c; s += c;
      if (out.length >= len + 1) break;
    }
    return out;
  }
  /* letters three times in a row ("fff") are not word-like */
  const triple = w => /(.)\1\1/.test(w);
  /* doubles English rarely has ("kk", "jj"), and words with no vowel when vowels are open, are not word-like either */
  const odd = (w, a) => /(kk|jj|hh|vv|ww|xx|qq|yy|ii|aa|uu|q[^u]|q$)/.test(w) || (a.some(c => 'aeiouy'.includes(c)) && !/[aeiouy]/.test(w));
  function pseudoWord(allowed, rand, focus) {
    const a = [...allowed], vowels = a.filter(c => 'aeiouy'.includes(c));
    for (let tries = 0; tries < 80; tries++) {
      const w = rawPseudo(a, rand);
      if (w.length < 2 || triple(w) || odd(w, a) || blocked(w, true)) continue;
      if (focus && !w.includes(focus)) continue;
      return w;
    }
    /* the letter model rarely makes this letter (j, k, q...): build a short word around it, with a vowel next to it */
    for (let tries = 0; tries < 80; tries++) {
      const n = 3 + Math.floor(rand() * 2), at = Math.floor(rand() * n);
      let w = '';
      for (let i = 0; i < n; i++) {
        if (focus && i === at) w += focus;
        else if (vowels.length && (i === at - 1 || i === at + 1) && !vowels.includes(focus)) w += vowels[Math.floor(rand() * vowels.length)];
        else w += a[Math.floor(rand() * a.length)];
      }
      if (!triple(w) && !/(.)\1/.test(w.slice(0, 2)) && !blocked(w, true)) return w;
    }
    return (focus || a[0]) + (vowels[0] || a[0]);
  }

  /* real words that only use open letters, most common first */
  const poolCache = new Map();
  function realPool(allowed) {
    const k = [...allowed].sort().join('');
    if (!poolCache.has(k)) { const set = new Set(allowed); poolCache.set(k, WORDS.filter(w => [...w].every(c => set.has(c)))); }
    return poolCache.get(k);
  }

  /* one lesson round: n words. More than half of them use the focus letter. Real words when enough fit, made-up ones otherwise.
     The same word never shows twice within four words. */
  function lessonWords(opts) {
    const rand = opts.rand || Math.random, n = opts.n || 12, focus = opts.focus || null;
    const allowed = [...new Set(opts.allowed)];
    const pool = realPool(allowed), fpool = focus ? pool.filter(w => w.includes(focus)) : pool;
    const share = opts.realShare != null ? opts.realShare : pool.length >= 60 ? 0.75 : pool.length >= 25 ? 0.55 : pool.length >= 10 ? 0.35 : 0.15;
    const out = [];
    for (let i = 0; i < n; i++) {
      const wantFocus = focus && rand() < 0.55;
      let w = null;
      for (let tries = 0; tries < 12 && !w; tries++) {
        let c;
        const src = wantFocus ? fpool : pool;
        const sh = wantFocus && fpool.length < 8 ? share * fpool.length / 8 : share;   // few real words with this letter: mostly made-up ones
        if (src.length && rand() < sh) c = src[Math.floor(Math.pow(rand(), 1.6) * src.length)];   // lean toward common words
        else c = pseudoWord(allowed, rand, wantFocus ? focus : null);
        if (out.slice(-4).includes(c)) continue;
        w = c;
      }
      out.push(w || pseudoWord(allowed, rand, null));
    }
    return out;
  }

  /* ---------- per-key stats ---------- */
  /* chars: [{ ch, ok, ms }] from a finished round; ok = typed right the first time, ms = time since the key before it (0 if not known, as for the first key of a round).
     Spaces are not counted: the thumb's space bar is not part of the course. */
  function addRound(stats, chars) {
    chars.forEach(c => {
      if (!/^[a-z]$/.test(c.ch)) return;
      const s = stats[c.ch] || (stats[c.ch] = []);
      s.push([c.ok && c.ms > 0 ? Math.round(Math.min(c.ms, SLOW_MS)) : 0, c.ok ? 1 : 0]);   // a long pause counts as 3 seconds: slow, so a letter is not ready too soon
      if (s.length > WINDOW) s.splice(0, s.length - WINDOW);
    });
    return stats;
  }
  function keyStat(stats, k) {
    const s = Array.isArray(stats[k]) ? stats[k] : [];
    const n = s.length, hits = s.filter(x => x[1]).length, timed = s.filter(x => x[1] && x[0] > 0);
    const ms = timed.length ? timed.reduce((a, x) => a + x[0], 0) / timed.length : 0;
    return { n, acc: n ? hits / n : 0, ms, wpm: ms ? 12000 / ms : 0 };
  }
  const ready = (stats, k, target) => { const s = keyStat(stats, k); return s.n >= MIN_SAMPLES && s.acc >= READY_ACC && s.wpm >= target; };
  /* how close a key is to ready, from 0 to 1 */
  function confidence(stats, k, target) {
    const s = keyStat(stats, k); if (!s.n) return 0;
    const c = Math.min(1, s.acc / READY_ACC, s.wpm / target);
    return Math.min(1, s.n / MIN_SAMPLES) * c;
  }
  /* the weakest open letter; when two are equally weak, the newer one */
  function focusKey(open, stats, target) {
    let best = null, bc = 2;
    open.forEach(k => { const c = confidence(stats, k, target); if (c <= bc) { bc = c; best = k; } });
    return best;
  }
  const canUnlock = (open, stats, target) => open.length < ORDER.length && open.every(k => ready(stats, k, target));

  /* r: { correct (characters right at the end), elapsed (ms), presses, wrong } */
  function roundScore(r) {
    const min = r.elapsed / 60000;
    return { wpm: min > 0 ? (r.correct / 5) / min : 0, acc: r.presses ? (r.presses - r.wrong) / r.presses : 1 };
  }


  /* ---------- drills ---------- */
  const ROWS = { home: 'asdfghjkl', top: 'qwertyuiop', bottom: 'zxcvbnm', number: '1234567890' };
  const any = (a, rand) => a[Math.floor(rand() * a.length)];
  /* a small group of keys from one row, like "fjf" or "dkls", that never spells something unkind */
  function keyGroup(letters, rand) {
    for (let t = 0; t < 40; t++) {
      const n = 3 + Math.floor(rand() * 3), a = any(letters, rand), b = any(letters, rand);
      let g = '';
      const style = rand();
      if (style < 0.35) for (let i = 0; i < n; i++) g += i % 2 ? b : a;   // fjfj
      else for (let i = 0; i < n; i++) g += any(letters, rand);          // mixed
      if (!/(.)\1\1/.test(g) && !blocked(g, true)) return g;
    }
    return letters.slice(0, 3);
  }
  function noRepeat(fn, n) {
    const out = [];
    for (let i = 0; i < n; i++) { let w = fn(i), t = 0; while (out.slice(-3).includes(w) && t++ < 10) w = fn(i); out.push(w); }
    return out;
  }
  function rowDrill(row, rand = Math.random, n = 20) {
    if (row === 'number') return numberDrill(rand, n);
    const letters = ROWS[row].split(''), real = realPool(letters).filter(w => w.length >= 2);
    const items = noRepeat(() => {
      if (real.length >= 5 && rand() < 0.45) return real[Math.floor(Math.pow(rand(), 1.4) * real.length)];
      let g = keyGroup(letters, rand);
      if (row === 'home' && rand() < 0.12) g += ';';                    // the home row's pinky key
      if (row === 'bottom' && rand() < 0.25) g += rand() < 0.6 ? ',' : '.';
      return g;
    }, n);
    return items.join(' ');
  }
  /* numbers: short and long numbers, years, and pairs with a hyphen; every digit shows up at least once */
  function numberDrill(rand = Math.random, n = 18) {
    for (let t = 0; t < 20; t++) {
      const items = noRepeat(() => {
        const r = rand();
        if (r < 0.3) return String(Math.floor(rand() * 90) + 10);
        if (r < 0.55) return String(Math.floor(rand() * 900) + 100);
        if (r < 0.7) return String(1900 + Math.floor(rand() * 130));
        if (r < 0.85) return (Math.floor(rand() * 9) + 1) + '-' + (Math.floor(rand() * 9) + 1);
        return String(Math.floor(rand() * 9000) + 1000);
      }, n);
      const text = items.join(' ');
      if ([...'0123456789'].every(d => text.includes(d))) return text;
    }
    return '1234567890';
  }
  /* common words for kids (sight-word order); the frequency list is the fallback on pages without the practice text */
  const KIDS = () => { const c = textData().common; return Array.isArray(c) && c.length ? c.filter(w => !blocked(w)) : WORDS.slice(0, 1000); };
  const COMMON = () => KIDS().filter(w => w.length >= 3 && w.length <= 8);
  function capitalsDrill(rand = Math.random, n = 16) {
    const pool = COMMON();
    return noRepeat(() => { const w = pool[Math.floor(Math.pow(rand(), 1.3) * pool.length)]; return rand() < 0.65 ? w[0].toUpperCase() + w.slice(1) : w; }, n).join(' ');
  }
  const CONTRACTIONS = ["it's", "don't", "can't", "I'm", "you're", "we're", "they're", "isn't", "let's", "that's", "what's", "here's", "didn't", "won't", "I'll", "we'll", "she's", "he's", "aren't", "wasn't"];
  const HYPHENS = ['x-ray', 'ice-cold', 'left-handed', 'right-handed', 'T-shirt', 're-read', 'pop-up', 'high-five', 'merry-go-round', 'forty-two', 'twenty-one', 'well-known', 'sign-up', 'drop-off'];
  function punctDrill(rand = Math.random, n = 14) {
    const pool = COMMON();
    return noRepeat(() => {
      const r = rand(), w = pool[Math.floor(Math.pow(rand(), 1.3) * pool.length)];
      if (r < 0.2) return any(CONTRACTIONS, rand);
      if (r < 0.3) return any(HYPHENS, rand);
      if (r < 0.37) return '"' + w + '"';
      if (r < 0.42) return '(' + w + ')';
      return w + any([',', ',', '.', '.', '?', '!', ';', ':'], rand);
    }, n).join(' ');
  }
  function commonWords(rand = Math.random, size = 300, n = 25) {
    const pool = KIDS().slice(0, size);
    return noRepeat(() => pool[Math.floor(rand() * pool.length)], n).map(w => w === 'i' ? 'I' : w).join(' ');   // the word "I" is always a capital
  }
  /* the three weakest letters: most missed first, then slowest. Only letters typed at least 10 times count (so a letter typed
     twice is not called weak), unless fewer than three have that many. */
  function weakLetters(stats, open, target, k = 3) {
    let cand = open.filter(c => keyStat(stats, c).n >= MIN_SAMPLES);
    if (cand.length < k) cand = open.filter(c => keyStat(stats, c).n > 0);
    const acc = c => Math.round(keyStat(stats, c).acc * 100);   // whole percents, so speed decides between near-equal accuracy
    return cand.sort((a, b) => acc(a) - acc(b) || keyStat(stats, a).wpm - keyStat(stats, b).wpm).slice(0, k);
  }
  function weakDrill(stats, open, target, rand = Math.random, n = 16) {
    const weak = weakLetters(stats, open, target);
    if (!weak.length) return '';
    const out = [];
    for (let i = 0; i < n; i++) {
      let w = '', t = 0;
      do { w = lessonWords({ allowed: open, focus: weak[i % weak.length], n: 1, rand })[0]; } while ((out.slice(-4).includes(w) || !w.includes(weak[i % weak.length])) && t++ < 12);
      out.push(w);
    }
    return out.join(' ');
  }
  function pickText(list, n, rand = Math.random) {
    const idx = [...list.keys()];
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    return idx.slice(0, Math.min(n, list.length)).map(i => list[i]).join(' ');
  }
  /* goal: { acc, wpm } */
  function stars(r, goal) {
    let s = 1;
    if (r.acc >= goal.acc) { s = 2; if (r.wpm >= goal.wpm) s = 3; }
    return s;
  }

  /* a small seeded random, for repeatable tests */
  function seeded(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  const api = { ORDER, START, WINDOW, MIN_SAMPLES, READY_ACC, SLOW_MS, WORDS, fnv, blocked, pseudoWord, realPool, lessonWords, addRound, keyStat, ready, confidence, focusKey, canUnlock, roundScore, seeded,
    ROWS, rowDrill, numberDrill, capitalsDrill, punctDrill, commonWords, weakLetters, weakDrill, pickText, stars, CONTRACTIONS, HYPHENS };
  root.SBTG = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
