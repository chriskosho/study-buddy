/* Phonograms: tools. Content is in data.js (the 72 phonograms sheet plus its 4 extras).
   Two speaker buttons: Sounds (SOUNDSAY respellings in data.js, a best try) and Words (the example words). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { shuffle } = SBT;
  const esc = SB.esc;
  const CORE = PH.filter(p => !p.extra), MULTI = CORE.filter(p => p.p.length > 1);
  const pick = (a, n) => shuffle(a.slice()).slice(0, n);
  const byP = Object.fromEntries(CORE.map(p => [p.p, p]));
  const words = p => p.ex.join(', ');
  /* two speakers: the sounds (a best try) and the example words */
  const clipUrl = p => 'audio/p' + String(p.n).padStart(2, '0') + '.mp3';   // recorded sounds made with eSpeak NG
  const pair = (ctx, p) => `<span class="spkpair"><span class="spkb">${ctx.sayButton(soundSay(p), 'Say the sounds of ' + p.p, clipUrl(p))}<span class="spkcap">Sounds</span></span><span class="spkb">${ctx.sayButton(words(p), 'Say the words: ' + words(p))}<span class="spkcap">Words</span></span></span>`;
  const exHtml = p => p.ex.map(w => hiWord(w, p.p)).join(', ');
  const mask = (w, p) => { const i = w.indexOf(p); return i < 0 ? w : w.slice(0, i) + '___' + w.slice(i + p.length); };
  const hook = (k, v) => { (window.__phTest = window.__phTest || {})[k] = v; return v; };   // a hook so the test can read the questions

  /* ===================== Study guide ===================== */
  const GROUPS = [
    { id: 'a', label: '1–26', sub: 'Single letters and qu', f: p => p.n <= 26 },
    { id: 'b', label: '27–52', sub: 'Teams and endings', f: p => p.n >= 27 && p.n <= 52 },
    { id: 'c', label: '53–72', sub: 'More patterns', f: p => p.n >= 53 && p.n <= 72 },
    { id: 'x', label: 'Extra 73–76', sub: 'Less common', f: p => p.extra },
    { id: 'k', label: 'Sound key', sub: '', f: null }
  ];
  const guide = {
    init(ctx) {
      const P = ctx.panel;
      P.innerHTML = `<h2>Study guide</h2><p class="lead">The 72 phonograms (English spelling patterns), with their sounds and example words. Press Sounds to hear the sounds (the device voice does its best, so some may sound a little off), or Words to hear the example words.</p>
        <div class="seg gtabs" role="group" aria-label="Phonogram group">${GROUPS.map((g, i) => `<button data-g="${g.id}" aria-pressed="${i === 0}">${esc(g.label)}</button>`).join('')}</div><div class="gbody"></div>`;
      const body = $('.gbody', P);
      const row = p => `<div class="phrow"><span class="pn">${p.n}</span><span class="pl" aria-label="Phonogram ${esc(p.p)}">${esc(p.p)}</span>
        <div><span class="ps">${esc(p.s)}</span>${p.note ? `<span class="pnote">${esc(p.note)}</span>` : ''}<span class="pex">${exHtml(p)}</span></div>${pair(ctx, p)}</div>`;
      function show(id) {
        const g = GROUPS.find(x => x.id === id);
        if (!g.f) { body.innerHTML = `<div class="keybox"><b>How to read the sounds</b><ul>${KEY.map(k => `<li>${esc(k)}</li>`).join('')}</ul></div>`; return; }
        body.innerHTML = (g.id === 'x' ? `<p class="gnote">${esc(EXTRA_NOTE)}</p>` : '') + `<div class="phlist">${PH.filter(g.f).map(row).join('')}</div>`;
      }
      $$('.gtabs button', P).forEach(b => b.onclick = () => { $$('.gtabs button', P).forEach(x => x.setAttribute('aria-pressed', x === b)); show(b.dataset.g); });
      show('a');
    }
  };

  /* ===================== Flashcards (practice only) ===================== */
  const cards = {
    init(ctx) {
      const say = p => pair(ctx, p);
      const D = {
        p2s: p => ({ front: `<div class="tag">Phonogram ${p.n}</div><div class="big ph">${esc(p.p)}</div><div class="small">What sounds does it make?</div>`,
          back: `<div class="tag">Sounds</div><div class="snd">${esc(p.s)}</div>${p.note ? `<div class="note">${esc(p.note)}</div>` : ''}<div class="exl">${exHtml(p)}</div>${say(p)}` }),
        s2p: p => ({ front: `<div class="tag">Sounds</div><div class="snd">${esc(p.s)}</div>${p.note ? `<div class="note">${esc(p.note)}</div>` : ''}<div class="small">Which phonogram is it?</div>${ctx.sayButton(soundSay(p), 'Say the sounds', clipUrl(p))}`,
          back: `<div class="tag">Phonogram ${p.n}</div><div class="big ph">${esc(p.p)}</div><div class="exl">${exHtml(p)}</div>${say(p)}` }),
        rules: p => ({ front: `<div class="tag">Phonogram ${p.n}</div><div class="big ph">${esc(p.p)}</div><div class="small">What is the rule or note?</div>`,
          back: `<div class="tag">Rule</div><div class="defline">${esc(p.note)}</div><div class="exl">${esc(p.s)} as in ${exHtml(p)}</div>${say(p)}` })
      };
      SBT.flashcards(ctx, {
        lead: 'Tap the card to flip it. Say the sounds before you flip. Cards you miss come back again.',
        modes: [{ id: 'p2s', label: 'Letters to sounds' }, { id: 's2p', label: 'Sounds to letters' }, { id: 'rules', label: 'Rules and notes' }, { id: 'extra', label: 'Extra 73–76' }],
        build: mode => mode === 'extra' ? shuffle(PH.filter(p => p.extra)).map(D.p2s)
          : mode === 'rules' ? shuffle(PH.filter(p => p.note)).map(D.rules) : shuffle(CORE).map(D[mode])
      });
    }
  };

  /* ===================== Quiz (multiple choice) ===================== */
  function whichPhonogram() {
    const p = pick(MULTI, 1)[0], w = p.ex[0];
    const wrong = pick(MULTI.filter(o => o.p !== p.p && !w.includes(o.p) && o.s !== p.s), 3).map(o => o.p);
    return { q: `Which phonogram spells ${p.s} in “${w}”?`, a: p.p, wrong, why: `[${p.p}] says ${p.s}${p.note ? ', ' + p.note : ''}.` };
  }
  function whichSounds() {
    const p = pick(CORE, 1)[0], w = p.ex[0];
    const wrong = pick([...new Set(CORE.filter(o => o.s !== p.s).map(o => o.s))], 3);
    return { q: `What sounds does [${p.p}] make, as in “${w}”?`, a: p.s, wrong, why: `[${p.p}] says ${p.s}.` };
  }
  function endOfWord() {
    const e = pick(ENDPAIRS, 1)[0], toks = e.sound.split(' ');
    const other = pick(MULTI.filter(o => !ENDPAIRS.some(x => x.use === o.p || x.not === o.p) && !o.s.split(' ').some(t => toks.includes(t))), 2).map(o => o.p);   // never another real spelling of that sound
    return { q: `Which spelling of ${e.sound} do we use at the END of an English word, like “${e.word}”?`, a: e.use, wrong: [e.not, ...other], why: `[${e.use}] is used at the end of English words. [${e.not}] is not, because English words do not end with ${e.not.slice(-1).toUpperCase()}.` };
  }
  const RULEQ = [
    { q: 'Which phonogram is the 2-letter /k/ used only after a single vowel that says /a/ /e/ /i/ /o/ /u/?', a: 'ck', wrong: ['ch', 'kn', 'qu'], why: 'Like pack, peck, pick, lock, luck.' },
    { q: 'Which phonogram is the 3-letter /ch/ used after a single vowel, like “hatch”?', a: 'tch', wrong: ['ch', 'sh', 'dge'] },
    { q: 'Which phonogram is the 3-letter /j/ used only after a single vowel, like “badge”?', a: 'dge', wrong: ['tch', 'gu', 'gn'] },
    { q: 'Which 2-letter /n/ is used only at the beginning of a base word, like “know”?', a: 'kn', wrong: ['gn', 'ng', 'wr'], why: '[gn] is used both at the beginning and the end of a base word, like gnaw and sign.' },
    { q: 'Which 2-letter /r/ is at the beginning of “wrong”?', a: 'wr', wrong: ['kn', 'er', 'ar'] },
    { q: 'Which phonogram is the 4-letter /A/ in “weight”?', a: 'eigh', wrong: ['igh', 'ough', 'ear'] },
    { q: 'Which phonogram is the 3-letter /I/ in “fight”?', a: 'igh', wrong: ['eigh', 'ough', 'ie'] },
    { q: 'Which 2-letter /g/ is always followed by a vowel, like “guess”?', a: 'gu', wrong: ['gn', 'ng', 'qu'] },
    { q: 'Which phonogram says /sh/ and is the tall-letter /sh/ in “nation”?', a: 'ti', wrong: ['ci', 'si', 'ch'], why: '[ti], [si], and [ci] say /sh/ at the beginning of syllables after the first one.' },
    { q: 'Which phonogram is the past tense ending that says /ed/ /d/ /t/?', a: 'ed', wrong: ['er', 'ee', 'ea'] },
    { q: 'Which phonogram always says /E/ (E, double E)?', a: 'ee', wrong: ['ea', 'ie', 'ei'] },
    { q: 'Which phonogram has the sounds /O/ /oo/ /uff/ /off/ /aw/ /ow/, as in “though” and “through”?', a: 'ough', wrong: ['ou', 'ow', 'oo'] }
  ];
  const quiz = {
    init(ctx) {
      SBT.quiz(ctx, {
        rounds: 10, lead: 'Pick the best answer. You can skip one you do not know.', skip: true,
        build: () => hook('quiz', [...SBT.many(whichPhonogram, 3), ...SBT.many(whichSounds, 3), ...SBT.many(endOfWord, 3), ...pick(RULEQ, 6)])   // no question twice in a round
      });
    }
  };

  /* ===================== Sort it ===================== */
  const slug = s => s.replace(/[^a-z0-9]+/gi, '-');
  const mk = (id, label, buckets, perBucket) => ({ id, label, perBucket, buckets: buckets.map(([name, list]) => ({ id: slug(name), name, list })) });
  const SETS = [
    mk('end', 'End of a word', [['Used at the end of English words', ENDPAIRS.map(e => e.use)], ['NOT used at the end of English words', ENDPAIRS.map(e => e.not)]], 4),
    mk('sound', 'Same sound', [['Says /A/', ['ay', 'ai', 'eigh']], ['Says /oo/', ['ui', 'ew', 'eu']], ['Says /er/', ['er', 'ur', 'ir', 'wor', 'ear']], ['Says /sh/', ['sh', 'ti', 'si', 'ci']]], 3),
    mk('spell', 'Odd spellings', [['Says /n/', ['kn', 'gn', 'pn']], ['Says /r/', ['wr', 'rh']], ['Says /f/', ['ph']], ['3-letter, after a short vowel', ['tch', 'dge']]], 2)
  ];
  const sort = {
    init(ctx) {
      SBT.sort(ctx, {
        lead: 'Drag each phonogram into its group, or tap it and then tap a group.',
        sets: SETS.map(s => ({ id: s.id, label: s.label, perBucket: s.perBucket, buckets: s.buckets.map(b => ({ id: b.id, name: b.name })), items: s.buckets.flatMap(b => b.list.map(t => ({ text: t, b: b.id }))) })),
        right: (it, b) => 'Yes! [' + it.text + '] goes with “' + b.name + '”.'
      });
    }
  };

  /* ===================== Type the phonogram ===================== */
  const answer = {
    init(ctx) {
      SBT.answer(ctx, {
        title: 'Type the phonogram', kind: 'text', skip: true, rounds: 10, typo: false,
        lead: 'Type the letters that spell the sounds in the blank, then press Check. Two tries, a hint, and a Skip button.',
        build: () => hook('type', pick(MULTI, 10).map(p => {
          const w = p.ex[0];
          return { q: `Which phonogram says ${esc(p.s)} in <b>${esc(mask(w, p.p)).replace('___', '<span class="blank">______</span>')}</b>?`, say: w, a: [p.p], hint: (p.note && !p.note.toLowerCase().includes(p.p)) ? p.note : ('It has ' + p.p.length + ' letters.')   /* a note that spells the answer would give it away */, why: `[${p.p}] says ${p.s}: ${w}.`, p: p.p };
        }))
      });
    }
  };

  /* ===================== Spell it (listen, then type) ===================== */
  /* words that sound like another word (no and know, wait and weight) are left out: hearing them, either spelling would be right */
  const SOUNDALIKE = new Set(['no', 'know', 'to', 'ate', 'blue', 'see', 'where', 'soul', 'for', 'hoe', 'wait', 'weight', 'great', 'pie', 'new', 'veil', 'sign', 'through', 'bough', 'bread', 'boy']);
  const WORDS = [...new Set(PH.flatMap(p => p.ex))].filter(w => !SOUNDALIKE.has(w));
  const spell = {
    init(ctx) {
      SBT.answer(ctx, {
        title: 'Spell it', kind: 'text', skip: true, rounds: 10, typo: false,
        lead: 'Listen to the word, then type how it is spelled. Press the speaker to hear it again.',
        build: () => hook('spell', pick(WORDS, 10).map(w => ({ q: 'Listen, then spell the word.', say: w, a: [w], noTypo: true, hint: 'It has ' + w.length + ' letters.' })))
      });
    }
  };

  /* ===================== Hear it, tap it (for children who are not reading yet) ===================== */
  const hear = {
    init(ctx) {
      SBT.quiz(ctx, {
        title: 'Hear it, tap it', rounds: 10, lead: 'Press the speaker to hear the sounds. Then tap the phonogram that makes them.',
        build: () => hook('hear', shuffle(PH.filter(p => p.n <= 72)).slice(0, 10).map(p => {
          const others = shuffle(PH.filter(x => x.n <= 72 && x.p !== p.p && x.s !== p.s && !soundTokens(x).some(t => soundTokens(p).length === 1 && soundTokens(x).length === 1 && t === soundTokens(p)[0])));   // never two that sound the same
          return { q: 'Which phonogram makes these sounds?', a: p.p, wrong: others.slice(0, 3).map(x => x.p), audio: clipUrl(p), say: soundSay(p), why: `[${p.p}] says ${p.s}, as in ${p.ex.slice(0, 2).join(' and ')}.` };
        }))
      });
    }
  };

  SBM.start({ module: 'phonograms', defaults: {}, tools: { guide, cards, quiz, sort, answer, spell, hear } });
})();
