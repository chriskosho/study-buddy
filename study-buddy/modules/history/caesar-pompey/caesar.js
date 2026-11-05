/* Julius Caesar and Pompey: tools. Content is in data.js. Flashcards, Quiz, Sort it, Put in order, Fill it in and Explain it use the shared builders in sb-tools.js. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { shuffle } = SBT;
  const esc = SB.esc;
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  /* ===================== Study guide ===================== */
  const guide = {
    init(ctx) {
      const P = ctx.panel;
      P.innerHTML = `<h2>Study guide</h2><p class="lead">Your class notes on Julius Caesar and Pompey, page by page. Press Historians say to read more.</p>
        <div class="seg gtabs" role="group" aria-label="Notes page">${PAGES.map((g, i) => `<button type="button" data-g="${g.id}" aria-pressed="${i === 0}">${esc(g.label)}</button>`).join('')}</div>
        <div class="gbody"></div>`;
      const body = $('.gbody', P);
      const sayNote = k => { const n = SAY[k]; return n ? `<details class="histsay"><summary>Historians say</summary><span>${esc(n.text)} <a href="${WIKI}${n.page}" target="_blank" rel="noopener">Source: Wikipedia, ${esc(n.label)}</a></span></details>` : ''; };
      function show(id) {
        const g = PAGES.find(x => x.id === id);
        body.innerHTML = `<h3>${esc(g.label)}</h3>
          <table class="ttable notes"><tbody>${g.rows.map(([t, d]) => `<tr><th scope="row">${esc(t)}</th><td>${esc(d)}${sayNote(t)}</td><td class="s">${ctx.sayButton(t + '. ' + d, 'Hear ' + t)}</td></tr>`).join('')}</tbody></table>
          <div class="model"><div class="eyebrow">Summary</div><p>${esc(g.summary)}</p>${ctx.sayButton(g.summary, 'Hear the summary')}</div>`;
      }
      $$('.gtabs button', P).forEach(b => b.onclick = () => { $$('.gtabs button', P).forEach(x => x.setAttribute('aria-pressed', x === b)); show(b.dataset.g); });
      show(PAGES[0].id);
    }
  };

  /* ===================== Flashcards ===================== */
  const cards = {
    init(ctx) {
      SBT.flashcards(ctx, {
        modes: [{ id: 'terms', label: 'Notes' }, { id: 'who', label: 'Who or what is it?' }, { id: 'summary', label: 'Summaries' }, { id: 'quizq', label: 'Every quiz question' }],
        build(mode) {
          if (mode === 'quizq') return SBT.quizCards(ctx, QUIZ);
          if (mode === 'who') return shuffle(CARDS).map(([t, d]) => ({
            front: `<div class="tag">What is this about?</div><div class="defline">${esc(d)}</div>`,
            back: `<div class="tag">Answer</div><div class="big">${esc(t)}</div>${ctx.sayButton(t + '. ' + d, 'Hear it')}`,
            say: d }));
          if (mode === 'summary') return shuffle(PAGES).map(p => ({
            front: `<div class="tag">Say the summary</div><div class="big">${esc(p.label)}</div>`,
            back: `<div class="tag">Summary</div><div class="defline">${esc(p.summary)}</div>${ctx.sayButton(p.summary, 'Hear it')}`,
            say: 'Say the summary of ' + p.label + '.' }));
          return shuffle(CARDS).map(([t, d]) => ({
            front: `<div class="tag">What do your notes say?</div><div class="big">${esc(t)}</div>`,
            back: `<div class="tag">Answer</div><div class="defline">${esc(d)}</div>${ctx.sayButton(t + '. ' + d, 'Hear it')}`,
            say: 'What do your notes say about ' + t + '?' }));
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
        title: 'Fill it in', lead: 'Type the missing word from your notes.', kind: 'text', typo: true, rounds: 10,
        build: () => shuffle(BLANKS).slice(0, 10).map(([s, a]) => ({
          q: esc(s).replace('___', '<span class="blank">______</span>'),
          a, hint: 'It starts with "' + a[0][0].toUpperCase() + '" and has ' + a[0].length + ' letters.',
          why: s.replace('___', a[0]), say: s.replace('___', 'blank') }))
      });
    }
  };

  /* ===================== Explain it ===================== */
  const explain = { init(ctx) { SBT.explain(ctx, { items: EXPLAIN, keepFirst: true }); } };

  SBM.start({ module: 'caesar-pompey', defaults: {}, tools: { guide, cards, quiz, sort, order, blanks, explain } });
})();
