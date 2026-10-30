/* Newton and His Laws: tools. Content is in data.js. Flashcards, Quiz, Type the answer, Sort it, and Explain it use the shared builders in sb-tools.js. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { shuffle } = SBT;
  const esc = SB.esc;
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const sayNote = k => { const n = SAY[k]; return n ? `<details class="histsay"><summary>Historians say</summary><span>${esc(n.text)} <a href="${WIKI}${n.page}" target="_blank" rel="noopener">Source: Wikipedia, ${esc(n.label)}</a></span></details>` : ''; };
  const row = (ctx, [t, d, s]) => `<tr><th scope="row">${esc(t)}</th><td>${esc(d)}${s ? sayNote(t) : ''}</td><td class="s">${ctx.sayButton(t + '. ' + d, 'Hear ' + t)}</td></tr>`;

  /* ===================== Study guide ===================== */
  const guide = {
    init(ctx) {
      const P = ctx.panel;
      const tabs = [...GUIDE.map(g => ({ id: g.id, label: g.label })), { id: 'table', label: 'Table 5.1' }, { id: 'test', label: 'From the review and Quiz 2' }];
      P.innerHTML = `<h2>Study guide</h2><p class="lead">Lesson 5, in the words of your book.</p>
        <div class="seg gtabs" role="group" aria-label="Study guide section">${tabs.map((t, i) => `<button data-g="${t.id}" aria-pressed="${i === 0}">${esc(t.label)}</button>`).join('')}</div><div class="gbody"></div>`;
      const body = $('.gbody', P);
      function show(id) {
        const g = GUIDE.find(x => x.id === id);
        if (g) body.innerHTML = `<h3>${esc(g.label)}</h3><table class="ttable"><tbody>${g.rows.map(r => row(ctx, r)).join('')}</tbody></table>`;
        else if (id === 'table') body.innerHTML = `<h3>Table 5.1: Newton’s concept of scale, proportion, and quantity</h3><table class="ttable tbl"><thead><tr>${TABLE_HEAD.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${TABLE.map(r => `<tr><th scope="row">${esc(r[0])}</th>${r.slice(1).map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
        else body.innerHTML = `<h3>From the review and Quiz 2</h3><p class="note">These facts come from the review questions and Quiz 2. They are not in the lesson text, and the answer key was not on the pages, so the answers are worked out from the questions.</p><div class="facts">${TEST_FACTS.map(([t, d]) => `<div class="fact"><b>${esc(t)}</b><span>${esc(d)}</span>${ctx.sayButton(t + '. ' + d, 'Hear ' + t)}</div>`).join('')}</div>`;
      }
      $$('.gtabs button', P).forEach(b => b.onclick = () => { $$('.gtabs button', P).forEach(x => x.setAttribute('aria-pressed', x === b)); show(b.dataset.g); });
      show(tabs[0].id);
    }
  };

  /* ===================== Flashcards ===================== */
  const fullQ = () => QUIZ;
  const cards = {
    init(ctx) {
      SBT.flashcards(ctx, {
        modes: [{ id: 'terms', label: 'Vocabulary and laws' }, { id: 'table', label: 'Table 5.1' }, { id: 'facts', label: 'Review and Quiz 2 facts' }, { id: 'quizq', label: 'Every quiz question' }],
        build(mode) {
          if (mode === 'quizq') return SBT.quizCards(ctx, fullQ());
          if (mode === 'table') return shuffle(TABLE).flatMap(([c, how, inv, find]) => [
            { front: `<div class="tag">How did Newton use ${esc(c)}?</div><div class="big">${esc(c)}</div>`, back: `<div class="tag">Answer</div><div class="defline">${esc(how[0].toUpperCase() + how.slice(1))}.</div>${ctx.sayButton(c + '. ' + how, 'Hear it')}`, say: 'How did Newton use ' + c + '?' },
            { front: `<div class="tag">What did Newton find about ${esc(c)}?</div><div class="defline">${esc(inv[0].toUpperCase() + inv.slice(1))}.</div>`, back: `<div class="tag">Findings</div><div class="defline">${esc(find)}</div>${ctx.sayButton(find, 'Hear it')}`, say: 'What did Newton find about ' + c + '?' }]);
          if (mode === 'facts') return shuffle(TEST_FACTS).map(([t, d]) => ({
            front: `<div class="tag">Review or Quiz 2 fact</div><div class="big">${esc(t)}</div>`,
            back: `<div class="tag">Answer</div><div class="defline">${esc(d)}</div>${ctx.sayButton(t + '. ' + d, 'Hear it')}`, say: t }));
          return shuffle(CARDS).map(([t, d]) => ({
            front: `<div class="tag">What does this mean?</div><div class="big">${esc(t)}</div>`,
            back: `<div class="tag">Answer</div><div class="defline">${esc(d)}</div>${ctx.sayButton(t + '. ' + d, 'Hear it')}`, say: 'What does ' + t + ' mean?' }));
        }
      });
    }
  };

  /* ===================== Quiz ===================== */
  const quiz = { init(ctx) { SBT.quiz(ctx, { rounds: 10, lead: 'Pick the best answer.', full: fullQ, build: () => shuffle(QUIZ).slice(0, 10) }); } };

  /* ===================== Type the answer ===================== */
  const type = {
    init(ctx) {
      SBT.answer(ctx, { title: 'Type the answer', kind: 'text', typo: true, skip: true, rounds: 10,
        lead: 'Type the missing word, then press Check. Two tries, and you can skip one for review.',
        build: () => shuffle(TYPE).map(t => ({ q: esc(t.q).replace(/_{3,}/g, '<span class="blank">______</span>'), say: t.q.replace(/_{3,}/g, 'blank'), a: t.a, noTypo: t.noTypo })) });
    }
  };

  /* ===================== Sort it ===================== */
  const sort = {
    init(ctx) {
      SBT.sort(ctx, {
        sets: SORTS.map(s => ({ id: s.id, label: s.label, buckets: s.buckets.map(b => ({ id: slug(b), name: b })), items: s.items.map(([text, b]) => ({ text, b: slug(b) })) })),
        right: (it, b) => 'Yes! "' + it.text + '" goes with ' + b.name + '.'
      });
    }
  };

  /* ===================== Explain it ===================== */
  const explain = { init(ctx) { SBT.explain(ctx, { items: EXPLAIN, rounds: 5, keepFirst: true }); } };

  SBM.start({ module: 'newton-laws', defaults: {}, tools: { guide, lab: labTool, cards, quiz, type, sort, explain } });
})();
