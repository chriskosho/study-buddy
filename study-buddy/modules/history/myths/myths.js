/* Greek and Roman Myths: tools. Content is in data.js. Flashcards, Quiz, Sort it, Put in order, Fill it in and Explain it use the shared builders in sb-tools.js. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { shuffle } = SBT;
  const esc = SB.esc;
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  /* ===================== Study guide ===================== */
  const PER = 8;   // questions per page, so every page fits one screen
  const guide = {
    init(ctx) {
      const P = ctx.panel;
      P.innerHTML = `<h2>Study guide</h2><p class="lead">Your teacher's study guide, story by story. Questions with no answer on the sheet are for talking over.</p>
        <div class="seg gtabs" role="group" aria-label="Story">${STORIES.map((s, i) => `<button type="button" data-g="${s.id}" aria-pressed="${i === 0}">${esc(s.label)}</button>`).join('')}</div>
        <div class="seg gsub" role="group" aria-label="Part"></div>
        <div class="gbody"></div>`;
      const body = $('.gbody', P), sub = $('.gsub', P);
      let cur = STORIES[0].id, part = 0;   // part: 0..n-1 = question pages, n = Talk it over
      const item = ([q, a]) => `<div class="item${a ? '' : ' open'}"><div class="t"><b>${esc(q)}</b><span>${a ? esc(a) : 'Talk it over: no answer on the sheet.'}</span></div>${ctx.sayButton(q + (a ? ' ' + a : ''), 'Hear it')}</div>`;
      const pages = s => Math.ceil(s.qa.length / PER);
      function show() {
        const s = STORIES.find(x => x.id === cur), n = pages(s), talk = part >= n;
        sub.innerHTML = Array.from({ length: n }, (_, i) => `<button type="button" data-p="${i}" aria-pressed="${part === i}">${n > 1 ? 'Questions ' + (i + 1) + ' of ' + n : 'Questions'}</button>`).join('') + `<button type="button" data-p="${n}" aria-pressed="${talk}">Talk it over</button>`;
        $$('button', sub).forEach(b => b.onclick = () => { part = +b.dataset.p; show(); });
        const rows = talk ? s.talk : s.qa.slice(part * PER, part * PER + PER);
        const notes = [];
        if (!talk && s.main && s.id !== 'damocles' && part === 0) notes.push(s.main);
        if (!talk && s.note && s.id !== 'damocles' && part === n - 1) notes.push(s.note);
        if (talk && s.id === 'damocles') notes.push(s.note, s.main);
        body.innerHTML = `<h3>${esc(s.label)}</h3><div class="qa">${rows.map(item).join('')}</div>${notes.map(t => `<div class="gnote">${esc(t)}</div>`).join('')}`;
      }
      $$('.gtabs button', P).forEach(b => b.onclick = () => { $$('.gtabs button', P).forEach(x => x.setAttribute('aria-pressed', x === b)); cur = b.dataset.g; part = 0; show(); });
      show();
    }
  };

  /* ===================== Flashcards ===================== */
  const cards = {
    init(ctx) {
      SBT.flashcards(ctx, {
        modes: [{ id: 'qa', label: 'Questions' }, { id: 'which', label: 'Which story?' }, { id: 'quizq', label: 'Every quiz question' }],
        build(mode) {
          if (mode === 'quizq') return SBT.quizCards(ctx, QUIZ);
          if (mode === 'which') return shuffle(CARDS).map(c => ({
            front: `<div class="tag">Which story is this from?</div><div class="defline">${esc(c.q)}</div>`,
            back: `<div class="tag">Story</div><div class="big">${esc(c.story)}</div><div class="defline">${esc(c.a)}</div>${ctx.sayButton(c.q + ' ' + c.a, 'Hear it')}`,
            say: c.q }));
          return shuffle(CARDS).map(c => ({
            front: `<div class="tag">${esc(c.story)}</div><div class="defline">${esc(c.q)}</div>`,
            back: `<div class="tag">Answer</div><div class="defline">${esc(c.a)}</div>${ctx.sayButton(c.q + ' ' + c.a, 'Hear it')}`,
            say: c.q }));
        }
      });
    }
  };

  /* ===================== Quiz ===================== */
  const quiz = { init(ctx) { SBT.quiz(ctx, { rounds: 10, lead: 'Pick the best answer.', full: () => QUIZ, build: () => shuffle(QUIZ).slice(0, 10) }); } };

  /* ===================== Sort it ===================== */
  const sort = {
    init(ctx) {
      SBT.sort(ctx, {
        sets: SORTS.map(s => ({ id: s.id, label: s.label, buckets: s.buckets.map(b => ({ id: slug(b), name: b })), items: s.items.map(([text, b]) => ({ text, b: slug(b) })) })),
        right: (it, b) => 'Yes! "' + it.text + '" goes with ' + b.name + '.'
      });
    }
  };

  /* ===================== Put in order ===================== */
  const order = {
    init(ctx) {
      SBT.order(ctx, {
        title: 'Put in order',
        lead: 'Drag the steps into the order they happened, or use the arrows. Then press Check.',
        sets: ORDERS.map(o => ({ id: o.id, label: o.label, hint: o.hint, items: o.items.map(text => ({ text })) }))
      });
    }
  };

  /* ===================== Fill it in ===================== */
  const blanks = {
    init(ctx) {
      SBT.answer(ctx, {
        title: 'Fill it in', lead: 'Type the missing word from your study guide.', kind: 'text', typo: true, rounds: 10,
        build: () => shuffle(BLANKS).slice(0, 10).map(([s, a]) => ({
          q: esc(s).replace('___', '<span class="blank">______</span>'),
          a, hint: 'It starts with "' + a[0][0].toUpperCase() + '" and has ' + a[0].length + ' letters.',
          why: s.replace('___', a[0]), say: s.replace('___', 'blank') }))
      });
    }
  };

  /* ===================== Explain it ===================== */
  const explain = { init(ctx) { SBT.explain(ctx, { items: EXPLAIN, keepFirst: true }); } };

  SBM.start({ module: 'myths', defaults: {}, tools: { guide, cards, quiz, sort, order, blanks, explain } });
})();
