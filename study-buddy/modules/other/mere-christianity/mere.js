/* Mere Christianity, Book 1: tools. Content is in data.js (a study guide in the app's own words; no passages from the book). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { shuffle } = SBT;
  const esc = SB.esc;
  const TERMS = CHAPTERS.flatMap(c => c.terms.map(([t, d]) => ({ t, d, c })));

  const NOTE = `<p class="hint">This guide is written in the app’s own words. It is a guide to Lewis’s argument, not a replacement for his book. Chapter numbers follow the usual editions; if yours differ, match them by title.</p>`;
  const tabs = (id, aria) => `<div class="seg gtabs" role="group" aria-label="${aria}">${CHAPTERS.map((c, i) => `<button type="button" data-g="${c.id}" aria-pressed="${i === 0}">${c.n}. ${esc(c.title)}</button>`).join('')}</div>`;

  /* ===================== Study guide ===================== */
  const guide = {
    init(ctx) {
      const P = ctx.panel;
      P.innerHTML = `<h2>Study guide</h2><p class="lead">${esc(BOOK.title)}, by ${esc(BOOK.author)}. ${esc(BOOK.part)}.</p>${tabs('guide', 'Chapter')}<div class="gbody"></div>${NOTE}`;
      const body = $('.gbody', P);
      function show(id) {
        const c = CHAPTERS.find(x => x.id === id);
        body.innerHTML = `<h3>Chapter ${c.n}: ${esc(c.title)}</h3>
          <div class="gcols"><div class="gsum"><div class="model"><div class="eyebrow">Summary</div><p>${esc(c.summary)}</p>${ctx.sayButton(c.summary, 'Hear the summary')}</div></div>
          <div class="gidea"><h4>Main ideas</h4><ul class="ideas">${c.ideas.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>
          <div class="gterm"><h4>Key terms</h4><table class="ttable"><tbody>${c.terms.map(([t, d]) => `<tr><th scope="row">${esc(t)}</th><td>${esc(d)}</td><td class="s">${ctx.sayButton(t + '. ' + d, 'Hear ' + t)}</td></tr>`).join('')}</tbody></table></div></div>`;
      }
      $$('.gtabs button', P).forEach(b => b.onclick = () => { $$('.gtabs button', P).forEach(x => x.setAttribute('aria-pressed', x === b)); show(b.dataset.g); });
      show(CHAPTERS[0].id);
    }
  };

  /* ===================== Think it through (not scored) ===================== */
  const think = {
    init(ctx) {
      const P = ctx.panel;
      P.innerHTML = `<h2>Think it through</h2><p class="lead">Questions to talk over or write about. Try one first, then open a starting point. Nothing here is scored.</p>${tabs('think', 'Chapter')}<div class="gbody"></div>`;
      const body = $('.gbody', P);
      function show(id) {
        const c = CHAPTERS.find(x => x.id === id);
        body.innerHTML = `<h3>Chapter ${c.n}: ${esc(c.title)}</h3><ol class="qs">${c.think.map(([q, s]) => `<li><p class="q">${esc(q)} ${ctx.sayButton(q, 'Hear the question')}</p><details class="start"><summary>A starting point</summary><span>${esc(s)}</span></details></li>`).join('')}</ol>`;
      }
      $$('.gtabs button', P).forEach(b => b.onclick = () => { $$('.gtabs button', P).forEach(x => x.setAttribute('aria-pressed', x === b)); show(b.dataset.g); });
      show(CHAPTERS[0].id);
    }
  };

  /* ===================== Flashcards ===================== */
  const cards = {
    init(ctx) {
      SBT.flashcards(ctx, {
        modes: [{ id: 'terms', label: 'Key terms' }, { id: 'meaning', label: 'What is the term?' }, { id: 'chapters', label: 'Chapters' }, { id: 'quizq', label: 'Every quiz question' }],
        build(mode) {
          if (mode === 'quizq') return SBT.quizCards(ctx, QUIZ);
          if (mode === 'meaning') return shuffle(TERMS).map(({ t, d }) => ({
            front: `<div class="tag">Which term is this?</div><div class="defline">${esc(d)}</div>`,
            back: `<div class="tag">Answer</div><div class="big">${esc(t)}</div>${ctx.sayButton(t + '. ' + d, 'Hear it')}`, say: d }));
          if (mode === 'chapters') return shuffle(CHAPTERS).map(c => ({
            front: `<div class="tag">Book 1, chapter ${c.n}</div><div class="big">${esc(c.title)}</div>`,
            back: `<div class="tag">Main ideas</div><div class="defline">${c.ideas.map(esc).join(' ')}</div>${ctx.sayButton(c.ideas.join(' '), 'Hear it')}`,
            say: 'What are the main ideas of ' + c.title + '?' }));
          return shuffle(TERMS).map(({ t, d }) => ({
            front: `<div class="tag">What does this mean?</div><div class="big">${esc(t)}</div>`,
            back: `<div class="tag">Meaning</div><div class="defline">${esc(d)}</div>${ctx.sayButton(t + '. ' + d, 'Hear it')}`, say: 'What does ' + t + ' mean?' }));
        }
      });
    }
  };

  /* ===================== Quiz ===================== */
  const quiz = { init(ctx) { SBT.quiz(ctx, { rounds: 10, lead: 'Pick the best answer.', full: () => QUIZ, build: () => shuffle(QUIZ).slice(0, 10) }); } };

  /* ===================== Sort it: which chapter? ===================== */
  const sort = {
    init(ctx) {
      SBT.sort(ctx, {
        sets: [{ id: 'chapter', label: 'Which chapter?', buckets: CHAPTERS.map(c => ({ id: c.id, name: c.n + '. ' + c.title })), items: SORT_ITEMS.map(([text, b]) => ({ text, b })) }],
        right: (it, b) => 'Yes! That idea is from chapter ' + b.name + '.'
      });
    }
  };

  /* ===================== Put in order ===================== */
  const order = {
    init(ctx) {
      SBT.order(ctx, {
        title: 'Put in order',
        lead: 'Drag the cards into the right order, or use the arrows. Then press Check.',
        sets: ORDERS.map(o => ({ id: o.id, label: o.label, hint: o.hint, items: o.items.map(text => ({ text })) }))
      });
    }
  };

  /* ===================== Explain it ===================== */
  const explain = { init(ctx) { SBT.explain(ctx, { items: EXPLAIN, keepFirst: true }); } };

  SBM.start({ module: 'mere-christianity', defaults: {}, tools: { guide, think, cards, quiz, sort, order, explain } });
})();
