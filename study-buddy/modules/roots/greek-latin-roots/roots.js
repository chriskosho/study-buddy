/* Greek and Latin Roots: the five tools. Content is in data.js; the page shell comes from shared/sb-module.js.
   Memorizing is the goal, so every answer in Quiz and Type the answer is remembered per root:
   - a root is MASTERED when at least 80% of its last 5 tries were right the first time (and it has had at least 3 tries)
   - a root that was missed comes back first in the next round
   The module page shows "Roots mastered X of 18". */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { shuffle } = SBT;
  const esc = SB.esc;
  const BY = Object.fromEntries(ROOTS.map(r => [r.id, r]));
  const POOL = lv => ROOTS.filter(r => r.level === lv);
  const MIN_TRIES = 3, WINDOW = 5, NEED = 0.8;

  /* ---------- what the child has mastered (saved in the module state) ---------- */
  let current = null;                                        // the ctx of the tool that is open, for the saved state
  const S = () => { const s = current.state; if (!s.roots) s.roots = {}; if (!s.missed) s.missed = []; if (!s.level) s.level = {}; return s; };
  const hist = id => S().roots[id] || [];
  const mastered = id => { const h = hist(id).slice(-WINDOW); return h.length >= MIN_TRIES && h.reduce((a, b) => a + b, 0) / h.length >= NEED; };
  const masteredCount = () => ROOTS.filter(r => mastered(r.id)).length;
  function paintPill() {
    const el = $('#rlPill'); if (!el) return;
    el.innerHTML = `<b>Roots mastered ${masteredCount()} of ${ROOTS.length}</b>`;
    el.title = 'A root is mastered when you get it right at least 80% of the time over your last 5 tries (at least 3 tries) in Quiz and Type the answer.';
  }
  function ensurePill() {
    if ($('#rlPill')) return;
    const row = $('header.top .row'); if (!row) return;
    const p = document.createElement('div'); p.className = 'pill'; p.id = 'rlPill'; row.insertBefore(p, row.firstChild);
  }
  function record(rootId, right) {
    const s = S(), h = s.roots[rootId] = (s.roots[rootId] || []).concat(right ? 1 : 0).slice(-20);
    const i = s.missed.indexOf(rootId);
    if (i >= 0) s.missed.splice(i, 1);
    if (!right) s.missed.push(rootId);
    current.save(); paintPill();
  }
  const note = (id) => { const r = BY[id]; return r.contrast ? `<div class="rl-contrast">${esc(r.contrast)}</div>` : ''; };

  /* a round asks missed roots first, then ones not yet mastered, then the rest; every root in the level is asked before any repeats */
  function order(ids) {
    const s = S(), miss = s.missed.filter(id => ids.includes(id));
    const rest = ids.filter(id => !miss.includes(id));
    return [...miss, ...shuffle(rest.filter(id => !mastered(id))), ...shuffle(rest.filter(id => mastered(id)))];
  }
  const plan = (ids, n) => { const o = order(ids), out = []; for (let i = 0; out.length < n; i++) out.push({ id: o[i % o.length], pass: Math.floor(i / o.length) }); return out; };

  /* ---------- questions about a root ---------- */
  const tokens = m => m.toLowerCase().split(/[^a-z]+/).filter(w => w && !['or', 'of'].includes(w));
  const NEAR = ['amphi', 'ambi', 'circum', 'kyklos'];          // meanings too close to tell apart, so they never appear together
  function wrongMeanings(r) {
    const mine = tokens(r.meaning), seen = new Set([r.meaning]), out = [];
    shuffle(ROOTS).forEach(x => { if (!seen.has(x.meaning) && !tokens(x.meaning).some(t => mine.includes(t)) && !(NEAR.includes(r.id) && NEAR.includes(x.id))) { seen.add(x.meaning); out.push(x.meaning); } });
    return out.slice(0, 3);
  }
  const wordFor = r => r.words[Math.floor(Math.random() * r.words.length)];
  const lastTime = {};
  function variant(r, pass) {                                   // 0 = plain, 1 = with a word, 2 = ambi/amphi language question
    if (pass >= 1 && r.contrast) return 2;
    if (pass >= 1) return lastTime[r.id] === 1 ? 0 : 1;
    return Math.random() < 0.5 ? 0 : 1;
  }
  const why = r => `${r.root} (${r.lang}) means ${r.meaning}. Words: ${r.words.join(', ')}.` + (r.contrast ? ' ' + r.contrast : '');

  function rootQuiz(item) {
    const r = BY[item.id], v = variant(r, item.pass); lastTime[r.id] = v;
    if (v === 2) {
      const greek = r.lang === 'Greek';
      return { root: r.id, q: `Two roots mean "both": ambi and amphi. Which one is the ${greek ? 'Greek' : 'Latin'} root?`, a: r.id, wrong: [r.id === 'ambi' ? 'amphi' : 'ambi'],
        why: `${r.root} is the ${r.lang} root. ${r.contrast}` };
    }
    return { root: r.id, q: v === 1 ? `The word "${wordFor(r)}" is built from the root ${r.root}. What does ${r.root} mean?` : `What does the root ${r.root} mean?`,
      a: r.meaning, wrong: wrongMeanings(r), why: why(r) };
  }
  function twoQuiz(w) {
    const wrong = shuffle(TWO.filter(x => x.root !== w.root && x.def !== w.def)).filter((x, i, a) => a.findIndex(y => y.root === x.root) === i).slice(0, 3).map(x => x.def);
    return { root: w.root, q: `The word ${w.w} is built from ${w.root} + ${w.other[0]} ("${w.other[1]}"). What does ${w.w} mean?`, a: w.def, wrong,
      why: `${w.w} = ${w.root} (${BY[w.root].meaning}) + ${w.other[0]} ("${w.other[1]}"): ${w.def}.${w.note ? ' ' + w.note : ''}` };
  }
  const hint1 = (r, w) => `It starts with "${r.meaning[0]}". Think of the word "${w}".`;
  function rootType(item) {
    const r = BY[item.id]; let v = variant(r, item.pass); if (v === 2) v = 1; lastTime[r.id] = v;
    const w = wordFor(r), either = r.either ? ' It can mean more than one thing. Type one meaning.' : '';
    return { root: r.id, q: (v === 1 ? `The word <b>${esc(w)}</b> is built from the root <b>${esc(r.root)}</b>. What does <b>${esc(r.root)}</b> mean?` : `What does the root <b>${esc(r.root)}</b> mean?`) + either,
      say: v === 1 ? `The word ${w} is built from the root ${r.root}. What does ${r.root} mean?` : `What does the root ${r.root} mean?`,
      a: r.accept, noTypo: r.noTypo, show: r.meaning, hint: hint1(r, w), why: why(r) };
  }
  function twoType(w) {
    const r = BY[w.root];
    return { root: w.root, q: `<b>${esc(w.w)}</b> is built from <b>${esc(w.root)}</b> + <b>${esc(w.other[0])}</b> ("${esc(w.other[1])}"). Fill in the blank with what <b>${esc(w.root)}</b> means: <b>${esc(w.blank)}</b>`,
      say: `${w.w} is built from ${w.root} plus ${w.other[0]}, meaning ${w.other[1]}. Fill in the blank with what ${w.root} means: ${w.blank.replace('___', 'blank')}`,
      a: w.ans, noTypo: r.noTypo, show: r.meaning, hint: `It starts with "${w.ans[0][0]}". What does ${w.root} mean?`,
      why: `${w.w} = ${w.root} (${r.meaning}) + ${w.other[0]} ("${w.other[1]}"): ${w.def}.${w.note ? ' ' + w.note : ''}` };
  }
  function twoWords(n) {                                        // words whose root needs the most work come first, one word per root before repeats
    const o = order([...new Set(TWO.map(w => w.root))]), seen = {}, out = [];
    o.forEach(id => { const ws = shuffle(TWO.filter(w => w.root === id)); seen[id] = ws; });
    for (let k = 0; out.length < n && k < 3; k++) o.forEach(id => { if (out.length < n && seen[id][k]) out.push(seen[id][k]); });
    return out;
  }

  /* ---------- the level picker above Quiz and Type the answer ---------- */
  function leveled(ctx, key, run) {
    const P = ctx.panel;
    P.innerHTML = `<div class="seg rl-levels" role="group" aria-label="Level">${LEVELS.map(l => `<button type="button" data-l="${l.id}" aria-pressed="false">${l.label}<small>${esc(l.sub)}</small></button>`).join('')}</div>
      <p class="rl-note"></p><div class="rl-body"></div>`;
    const body = $('.rl-body', P), noteEl = $('.rl-note', P);
    const sub = Object.create(ctx, { panel: { value: body }, result: { value: () => ctx.result(masteredCount(), ROOTS.length) } });   // the tool's score is how many roots are mastered
    function go(lv) {
      S().level[key] = lv; ctx.save();
      $$('.rl-levels button', P).forEach(b => b.setAttribute('aria-pressed', b.dataset.l === lv));
      const ids = POOL(lv).map(r => r.id), m = ids.filter(mastered).length;
      noteEl.textContent = lv === 'insane' ? 'Words built from two roots. You show what the root means to work out the word.' : `Roots mastered at this level: ${m} of ${ids.length}.`;
      body.innerHTML = ''; run(sub, lv);
    }
    $$('.rl-levels button', P).forEach(b => b.onclick = () => go(b.dataset.l));
    go(LEVELS.some(l => l.id === S().level[key]) ? S().level[key] : 'easy');
    return go;
  }
  const onAnswer = ctx => (q, right) => { record(q.root, right); const n = $('.rl-note', ctx.panel.parentNode); if (n && !/Words built/.test(n.textContent)) { const lv = $('.rl-levels [aria-pressed="true"]', ctx.panel.parentNode).dataset.l, ids = POOL(lv).map(r => r.id); n.textContent = `Roots mastered at this level: ${ids.filter(mastered).length} of ${ids.length}.`; } };


  /* ===================== Study guide ===================== */
  const guide = {
    init(ctx) {
      current = ctx; ensurePill(); paintPill();
      const P = ctx.panel;
      const TABS = [...LEVELS.filter(l => l.id !== 'insane').map(l => ({ id: l.id, label: l.label + ': ' + l.sub })), { id: 'insane', label: 'Insane: Two-root words' }, { id: 'lang', label: 'Greek or Latin' }];
      P.innerHTML = `<h2>Study guide</h2><p class="lead">All 18 roots in one place. Read them out loud, then try the Quiz.</p>
        <div class="seg gtabs" role="group" aria-label="Study guide section">${TABS.map((t, i) => `<button data-g="${t.id}" aria-pressed="${i === 0}">${esc(t.label)}</button>`).join('')}</div>
        <div class="gbody"></div>`;
      const body = $('.gbody', P);
      const rootRow = r => `<tr><th scope="row"><span class="rl-parts">${esc(r.root)}</span><small>${esc(r.lang)}</small></th><td data-label="Meaning"><b>${esc(r.meaning)}</b></td><td data-label="Words">${esc(r.words.join(', '))}</td><td>${esc(r.use)}${r.contrast ? `<div class="rl-contrast">${esc(r.contrast)}</div>` : ''}</td><td class="s">${ctx.sayButton(r.root + ' means ' + r.meaning + '. Words: ' + r.words.join(', ') + '.', 'Hear ' + r.root)}</td></tr>`;
      const table = list => `<div class="tablewrap"><table class="ttable rl-guide"><thead><tr><th scope="col">Root</th><th scope="col">Meaning</th><th scope="col">Words</th><th scope="col">How the words are used</th><th scope="col"><span class="sr-only">Hear it</span></th></tr></thead><tbody>${list.map(rootRow).join('')}</tbody></table></div>`;
      function show(id) {
        if (id === 'insane') {
          body.innerHTML = `<p class="hint">Words built from two roots. One part is a root you memorize. The other part is explained here.</p>
            <div class="tablewrap"><table class="ttable rl-guide"><thead><tr><th scope="col">Word</th><th scope="col">Built from</th><th scope="col">What it means</th><th scope="col"><span class="sr-only">Hear it</span></th></tr></thead><tbody>${TWO.map(w => `<tr><th scope="row"><span class="rl-parts">${esc(w.w)}</span></th><td>${esc(w.root)} (${esc(BY[w.root].meaning)}) + ${esc(w.other[0])} (${esc(w.other[1])})</td><td>${esc(w.def)}${w.note ? `<div class="rl-contrast">${esc(w.note)}</div>` : ''}</td><td class="s">${ctx.sayButton(w.w + ' is built from ' + w.root + ' plus ' + w.other[0] + '. ' + w.def + '.', 'Hear ' + w.w)}</td></tr>`).join('')}</tbody></table></div>`;
        } else if (id === 'lang') {
          const by = l => ROOTS.filter(r => r.lang === l);
          body.innerHTML = `<p class="hint">Greek roots often have letters like ph, y, k, and ch. Latin roots often end in -us, -is, or -um.</p><div class="gcols">${['Greek', 'Latin'].map(l => `<div><h3>${l} roots</h3><ul class="rl-list">${by(l).map(r => `<li><b>${esc(r.root)}</b> means ${esc(r.meaning)}</li>`).join('')}</ul></div>`).join('')}</div>`;
        } else body.innerHTML = table(POOL(id));
      }
      $$('.gtabs button', P).forEach(b => b.onclick = () => { $$('.gtabs button', P).forEach(x => x.setAttribute('aria-pressed', x === b)); show(b.dataset.g); });
      show('easy');
    }
  };

  /* ===================== Flashcards (practice only) ===================== */
  const cards = {
    init(ctx) {
      current = ctx; ensurePill(); paintPill();
      const rootCard = r => ({
        front: `<div class="tag">${esc(r.lang)} root</div><div class="big">${esc(r.root)}</div><div class="small">What does it mean?</div>`,
        back: `<div class="tag">Meaning</div><div class="defline">${esc(r.meaning)}</div><div class="exl">Words: ${esc(r.words.join(', '))}</div><div class="exl">${esc(r.use)}</div>${note(r.id)}${ctx.sayButton(r.root + ' means ' + r.meaning + '. ' + r.use, 'Hear it')}`,
        say: 'What does ' + r.root + ' mean?' });
      const twoCard = w => ({
        front: `<div class="tag">Two-root word</div><div class="big">${esc(w.w)}</div><div class="small"><span class="rl-parts">${esc(w.root)}</span> + ${esc(w.other[0])} <span class="rl-gloss">("${esc(w.other[1])}")</span></div>`,
        back: `<div class="tag">Meaning</div><div class="defline">${esc(w.def)}</div><div class="exl">${esc(w.root)} means ${esc(BY[w.root].meaning)}.</div>${ctx.sayButton(w.w + ' means ' + w.def, 'Hear it')}`,
        say: 'What does ' + w.w + ' mean?' });
      SBT.flashcards(ctx, {
        lead: 'Tap the card to flip it. Say what the root means before you flip. Cards you miss come back again.',
        modes: [{ id: 'all', label: 'All ' + ROOTS.length + ' roots' }, ...LEVELS.filter(l => l.id !== 'insane').map(l => ({ id: l.id, label: l.label + ': ' + l.sub })), { id: 'insane', label: 'Insane: Two-root words' }],
        build(mode) {
          if (mode === 'insane') return shuffle(TWO).map(twoCard);
          return shuffle(mode === 'all' ? ROOTS : POOL(mode)).map(rootCard);
        }
      });
    }
  };

  /* ===================== Sort it ===================== */
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const sort = {
    init(ctx) {
      current = ctx; ensurePill(); paintPill();
      SBT.sort(ctx, {
        lead: 'Drag each root into the group that matches its meaning, or tap it and then tap a group.',
        sets: SORTS.map(s => ({ id: s.id, label: s.label, buckets: s.buckets.map(([id, name]) => ({ id: slug(id), name })),
          items: s.items === 'language' ? ROOTS.map(r => ({ text: r.root, b: slug(r.lang) })) : s.items.map(([text, b]) => ({ text, b: slug(b) })) })),
        right: (it, b) => `Yes! ${it.text} means ${BY[it.text].meaning}. It goes with ${b.name}.`,
        wrong: it => `Not quite. ${it.text} means ${BY[it.text].meaning}. Try another group.`
      });
    }
  };

  /* ===================== Quiz (the main memorizing tool) ===================== */
  const quiz = {
    init(ctx) {
      current = ctx; ensurePill(); paintPill();
      leveled(ctx, 'quiz', (c, lv) => SBT.quiz(c, {
        title: 'Quiz', lead: lv === 'insane' ? 'Pick what the whole word means.' : 'Pick the best meaning.', rounds: lv === 'insane' ? 8 : 10,
        onAnswer: onAnswer(c), keepOrder: true, skip: true,
        full: () => lv === 'insane' ? TWO.map(twoQuiz) : POOL(lv).map(r => rootQuiz({ id: r.id, pass: 0 })),
        build: () => lv === 'insane' ? twoWords(8).map(twoQuiz) : plan(POOL(lv).map(r => r.id), 10).map(rootQuiz)
      }));
    }
  };

  /* ===================== Type the answer ===================== */
  const answer = {
    init(ctx) {
      current = ctx; ensurePill(); paintPill();
      leveled(ctx, 'answer', (c, lv) => SBT.answer(c, {
        title: 'Type the answer', kind: 'text', typo: true, rounds: lv === 'insane' ? 8 : 10,
        lead: lv === 'insane' ? 'Type the missing word. It is the meaning of the root.' : 'Type what the root means, then press Check. You get two tries.',
        onAnswer: onAnswer(c), keepOrder: true, skip: true,
        build: () => lv === 'insane' ? twoWords(8).map(twoType) : plan(POOL(lv).map(r => r.id), 10).map(rootType)
      }));
    }
  };

  /* ===================== Explain it ===================== */
  const EXPLAIN = ROOTS.map(r => ({
    q: `Write a complete sentence that uses one of these words: ${r.words.join(', ')}. They all come from the root ${r.root}, which means ${r.meaning}.`,
    model: r.eg + ' (' + r.root + ' means ' + r.meaning + ')',
    ideas: [{ label: `Uses a word from ${r.root}: ${r.words.join(', ')}`, all: [r.stems] }]
  }));
  const explain = { init(ctx) { current = ctx; ensurePill(); paintPill(); SBT.explain(ctx, { items: EXPLAIN, rounds: 5, lead: 'Use a word from the root in a complete sentence. Start with a capital letter and end with a period.' }); } };

  SBM.start({ module: 'greek-latin-roots', defaults: { roots: {}, missed: [], level: {} }, tools: { guide, cards, sort, quiz, answer, explain } });
})();
