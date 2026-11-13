/* Greek and Latin Roots: the five tools. Content is in data.js; the page shell comes from shared/sb-module.js.
   Memorizing is the goal, so every answer in Quiz and Type the answer is remembered per root:
   - a root is MASTERED when at least 80% of its last 5 tries were right the first time (and it has had at least 3 tries)
   - a root that was missed comes back first in the next round
   The module page shows "Roots mastered X of 26" (Set 1: the first 18 roots; Set 2: Roots Study Sheet #17-24, 8 roots). */
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

  /* ---------- Set 2: the sheet's derivatives and blanks ---------- */
  const DBY = Object.fromEntries(DERIVS.map(d => [d.w, d]));
  const SET2 = [...new Set(DERIVS.map(d => d.root))];
  const lvOf = id => LEVELS.find(l => l.id === id) || {};
  const isWords = lv => lv === 'insane' || !!lvOf(lv).words;
  const NEARD = [['component', 'community', 'collaborate'], ['prologue', 'preamble', 'predict']];     // near-identical meanings never appear together
  const tooNear = (a, b) => NEARD.some(g => g.includes(a) && g.includes(b));
  const reEsc = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const blankOut = (d, i) => d.def.replace(new RegExp('\\b' + reEsc(d.blanks[i][0]) + '\\b'), '___');
  const FILLS = [];                                              // every blank on the sheet, one question each
  DERIVS.forEach(d => {
    if (d.word) FILLS.push({ d, ans: [d.w], text: '___ - ' + d.def });
    d.blanks.forEach((b, i) => FILLS.push({ d, ans: b, text: d.w + ' - ' + blankOut(d, i) }));
  });
  const defQuiz = d => {
    const wrong = shuffle(DERIVS.filter(x => x.root !== d.root && !tooNear(x.w, d.w))).filter((x, i, a) => a.findIndex(y => y.root === x.root) === i).slice(0, 3).map(x => x.def);
    return { root: d.root, q: `The word ${d.w} comes from the root ${d.root}, which means ${BY[d.root].meaning}. What does ${d.w} mean?`, a: d.def, wrong,
      why: `${d.w} = ${d.def}. ${d.root} means ${BY[d.root].meaning}.` };
  };
  const wordQuiz = d => {
    const wrong = shuffle(DERIVS.filter(x => x.root !== d.root && !tooNear(x.w, d.w))).filter((x, i, a) => a.findIndex(y => y.root === x.root) === i).slice(0, 3).map(x => x.w);
    return { root: d.root, q: `Which word fits the blank? ___ - ${d.def}`, a: d.w, wrong, why: `${d.w} comes from ${d.root} (${BY[d.root].meaning}): ${d.def}.` };
  };
  const derivType = f => {
    const d = f.d, r = BY[d.root], first = f.ans[0], word = first === d.w;
    return { root: d.root, q: `Fill in the blank from the sheet: <b>${esc(f.text)}</b>`, say: 'Fill in the blank from the sheet: ' + f.text.replace(/___/g, 'blank'),
      a: f.ans, noTypo: first.length <= 4, show: first,
      hint: word ? `It comes from the root ${d.root}, which means ${r.meaning}. It starts with "${first[0]}".` : `It starts with "${first[0]}". The word ${d.w} comes from the root ${d.root}.`,
      why: `${d.w} comes from ${d.root} (${r.meaning}): ${d.def}.` };
  };
  function derivRound(n, make) {                                 // one question per root, roots that need work first, then more until n
    const o = order(SET2), out = [];
    for (let k = 0; out.length < n; k++) o.forEach(id => { if (out.length < n) out.push(make(id)); });
    return out;
  }
  const pickD = id => { const l = DERIVS.filter(d => d.root === id); return l[Math.floor(Math.random() * l.length)]; };
  const wordsBuild = (lv, kind) => lv === 'insane' ? twoWords(8).map(kind === 'quiz' ? twoQuiz : twoType)
    : kind === 'quiz' ? derivRound(8, id => (Math.random() < 0.5 ? defQuiz : wordQuiz)(pickD(id)))
    : derivRound(8, id => { const l = FILLS.filter(f => f.d.root === id); return derivType(l[Math.floor(Math.random() * l.length)]); });

  /* ---------- the set and level pickers above Quiz and Type the answer ---------- */
  function leveled(ctx, key, run) {
    const P = ctx.panel, setOf = lv => lvOf(lv).set || 1;
    P.innerHTML = `<div class="seg rl-sets" role="group" aria-label="Set">${SETS.map(t => `<button type="button" data-s="${t.id}" aria-pressed="false">${esc(t.label)}<small>${esc(t.sub)}</small></button>`).join('')}</div>
      <div class="seg rl-levels" role="group" aria-label="Level"></div>
      <p class="rl-note"></p><div class="rl-body"></div>`;
    const body = $('.rl-body', P), noteEl = $('.rl-note', P), levelsEl = $('.rl-levels', P);
    const sub = Object.create(ctx, { panel: { value: body }, result: { value: () => ctx.result(masteredCount(), ROOTS.length) } });   // the tool's score is how many roots are mastered
    function go(lv) {
      S().level[key] = lv; ctx.save();
      const set = setOf(lv);
      levelsEl.innerHTML = LEVELS.filter(l => setOf(l.id) === set).map(l => `<button type="button" data-l="${l.id}" aria-pressed="${l.id === lv}">${esc(l.label)}<small>${esc(l.sub)}</small></button>`).join('');
      $$('button', levelsEl).forEach(b => b.onclick = () => go(b.dataset.l));
      $$('.rl-sets button', P).forEach(b => b.setAttribute('aria-pressed', +b.dataset.s === set));
      const ids = POOL(lv).map(r => r.id), m = ids.filter(mastered).length;
      if (isWords(lv)) { noteEl.dataset.words = '1'; noteEl.textContent = lv === 'insane' ? 'Words built from two roots. You show what the root means to work out the word.' : 'The words and blanks from your study sheet. Each one comes from a root on the sheet.'; }
      else { delete noteEl.dataset.words; noteEl.textContent = `Roots mastered at this level: ${m} of ${ids.length}.`; }
      body.innerHTML = ''; run(ctx.round ? Object.create(sub, { round: { value: ctx.round.sub(lv) } }) : sub, lv);   // each level keeps its own round in progress
    }
    $$('.rl-sets button', P).forEach(b => b.onclick = () => go(LEVELS.find(l => setOf(l.id) === +b.dataset.s).id));
    go(LEVELS.some(l => l.id === S().level[key]) ? S().level[key] : 'easy');
    return go;
  }
  const onAnswer = ctx => (q, right) => { record(q.root, right); const n = $('.rl-note', ctx.panel.parentNode); if (n && !n.dataset.words) { const lv = $('.rl-levels [aria-pressed="true"]', ctx.panel.parentNode).dataset.l, ids = POOL(lv).map(r => r.id); n.textContent = `Roots mastered at this level: ${ids.filter(mastered).length} of ${ids.length}.`; } };


  /* ===================== Study guide ===================== */
  const guide = {
    init(ctx) {
      current = ctx; ensurePill(); paintPill();
      const P = ctx.panel;
      const lab = l => ({ id: l.id, label: l.label + ': ' + l.sub });
      const TABS = [...LEVELS.filter(l => !l.set && l.id !== 'insane').map(lab), { id: 'insane', label: 'Insane: Two-root words' }, ...LEVELS.filter(l => l.set === 2 && !l.words).map(lab), { id: 'lang', label: 'Greek or Latin' }];
      P.innerHTML = `<h2>Study guide</h2><p class="lead">All ${ROOTS.length} roots in one place: the first 18, then the ${SET2.length} roots on Study Sheet #17 to 24. Read them out loud, then try the Quiz.</p>
        <div class="seg gtabs" role="group" aria-label="Study guide section">${TABS.map((t, i) => `<button data-g="${t.id}" aria-pressed="${i === 0}">${esc(t.label)}</button>`).join('')}</div>
        <div class="gbody"></div>`;
      const body = $('.gbody', P);
      const rootRow = r => `<tr><th scope="row"><span class="rl-parts">${esc(r.root)}</span><small>${esc(r.lang)}</small></th><td data-label="Meaning"><b>${esc(r.meaning)}</b></td><td data-label="Words">${esc(r.words.join(', '))}</td><td>${esc(r.use)}${r.contrast ? `<div class="rl-contrast">${esc(r.contrast)}</div>` : ''}</td><td class="s">${ctx.sayButton(r.root + ' means ' + r.meaning + '. Words: ' + r.words.join(', ') + '.', 'Hear ' + r.root)}</td></tr>`;
      const table = list => `<div class="tablewrap"><table class="ttable rl-guide"><thead><tr><th scope="col">Root</th><th scope="col">Meaning</th><th scope="col">Words</th><th scope="col">How the words are used</th><th scope="col"><span class="sr-only">Hear it</span></th></tr></thead><tbody>${list.map(rootRow).join('')}</tbody></table></div>`;
      const sheetRow = r => `<tr><th scope="row"><span class="rl-parts">${esc(r.root)}</span>${r.also ? `<small>/ ${esc(r.also)}</small>` : ''}<small>${esc(r.lang)} \u00b7 #${r.no}</small></th><td data-label="Meaning"><b>${esc(r.meaning)}</b></td><td data-label="Derivatives">${DERIVS.filter(d => d.root === r.id).map(d => `<div class="rl-deriv"><b>${esc(d.w)}</b> - ${esc(d.def)}</div>`).join('')}</td><td>${esc(r.use)}</td><td class="s">${ctx.sayButton(r.root + ' means ' + r.meaning + '. ' + DERIVS.filter(d => d.root === r.id).map(d => d.w + ': ' + d.def).join('. ') + '.', 'Hear ' + r.root)}</td></tr>`;
      const sheetTable = list => `<div class="tablewrap"><table class="ttable rl-guide"><thead><tr><th scope="col">Root</th><th scope="col">Meaning</th><th scope="col">Derivatives, as on your sheet</th><th scope="col">How the words are used</th><th scope="col"><span class="sr-only">Hear it</span></th></tr></thead><tbody>${list.map(sheetRow).join('')}</tbody></table></div>`;
      function show(id) {
        if (lvOf(id).set === 2) {
          body.innerHTML = `<p class="hint">From Roots Study Sheet #17 to 24 (${id === 's2a' ? 'page 1' : 'page 2'}). The meanings and the derivative definitions are the sheet\u2019s words.</p>` + sheetTable(POOL(id));
        } else if (id === 'insane') {
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
      const derivCard = d => ({
        front: `<div class="tag">Sheet word</div><div class="big">${esc(d.w)}</div><div class="small">from <span class="rl-parts">${esc(d.root)}</span> <span class="rl-gloss">("${esc(BY[d.root].meaning)}")</span></div>`,
        back: `<div class="tag">Meaning</div><div class="defline">${esc(d.def)}</div><div class="exl">${esc(d.root)} means ${esc(BY[d.root].meaning)}.</div>${ctx.sayButton(d.w + ' means ' + d.def, 'Hear it')}`,
        say: 'What does ' + d.w + ' mean?' });
      SBT.flashcards(ctx, {
        lead: 'Tap the card to flip it. Say what the root means before you flip. Cards you miss come back again.',
        modes: [{ id: 'all', label: 'All ' + ROOTS.length + ' roots' }, ...LEVELS.filter(l => !l.set && l.id !== 'insane').map(l => ({ id: l.id, label: l.label })), { id: 'insane', label: 'Insane' }, ...LEVELS.filter(l => l.set === 2).map(l => ({ id: l.id, label: l.label }))],
        build(mode) {
          if (mode === 'insane') return shuffle(TWO).map(twoCard);
          if (mode === 's2w') return shuffle(DERIVS).map(derivCard);
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
        lead: 'Drag each root (or word) into the group that matches, or tap it and then tap a group.',
        sets: SORTS.map(s => ({ id: s.id, label: s.label, buckets: s.buckets.map(([id, name]) => ({ id: slug(id), name })),
          items: s.items === 'language' ? ROOTS.filter(r => !r.set).map(r => ({ text: r.root, b: slug(r.lang) }))
            : s.items === 'derivs' ? DERIVS.filter(d => s.buckets.some(([id]) => id === d.root)).map(d => ({ text: d.w, b: slug(d.root) }))
            : s.items.map(([text, b]) => ({ text, b: slug(b) })) })),
        right: (it, b) => DBY[it.text] ? `Yes! ${it.text} comes from ${b.name}, which means ${BY[b.name].meaning}: ${DBY[it.text].def}.` : `Yes! ${it.text} means ${BY[it.text].meaning}. It goes with ${b.name}.`,
        wrong: it => DBY[it.text] ? `Not quite. ${it.text} means "${DBY[it.text].def}". Which root does it come from? Try another group.` : `Not quite. ${it.text} means ${BY[it.text].meaning}. Try another group.`
      });
    }
  };

  /* ===================== Quiz (the main memorizing tool) ===================== */
  const quiz = {
    init(ctx) {
      current = ctx; ensurePill(); paintPill();
      leveled(ctx, 'quiz', (c, lv) => SBT.quiz(c, {
        title: 'Quiz', lead: lv === 'insane' ? 'Pick what the whole word means.' : isWords(lv) ? 'Pick what the word means, or the word that fits the blank.' : 'Pick the best meaning.', rounds: isWords(lv) ? 8 : 10,
        onAnswer: onAnswer(c), keepOrder: true, skip: true,
        full: () => lv === 'insane' ? TWO.map(twoQuiz) : isWords(lv) ? DERIVS.flatMap(d => [defQuiz(d), wordQuiz(d)]) : POOL(lv).map(r => rootQuiz({ id: r.id, pass: 0 })),
        build: () => isWords(lv) ? wordsBuild(lv, 'quiz') : plan(POOL(lv).map(r => r.id), 10).map(rootQuiz)
      }));
    }
  };

  /* ===================== Type the answer ===================== */
  const answer = {
    init(ctx) {
      current = ctx; ensurePill(); paintPill();
      leveled(ctx, 'answer', (c, lv) => SBT.answer(c, {
        title: 'Type the answer', kind: 'text', typo: true, rounds: isWords(lv) ? 8 : 10,
        lead: lv === 'insane' ? 'Type the missing word. It is the meaning of the root.' : isWords(lv) ? 'Type the missing word from your study sheet, then press Check. You get two tries.' : 'Type what the root means, then press Check. You get two tries.',
        onAnswer: onAnswer(c), keepOrder: true, skip: true,
        build: () => isWords(lv) ? wordsBuild(lv, 'type') : plan(POOL(lv).map(r => r.id), 10).map(rootType)
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
