/* Study Buddy lesson builder: one module for one lesson of a book, made from a data object (LESSON in the module's data.js).
   SBL.start(LESSON) builds the tools the lesson has data for:
     guide (a tab for each section, then Vocabulary, then the Lab if the lesson has one), cards, quiz, sort, order, explain.
   The registry entry must list exactly the tools the data gives (a test checks this).
   LESSON = {
     id, title, source,                     // source: the line shown under the guide ("Wording follows ...")
     sections: [{ id, title, text: [paragraphs], key: [bullets], table: { title, head: [..], rows: [[..]] } }],
     vocab: [[term, meaning]],
     lab: { title, note, review: [bullets] },   // optional
     quiz: [{ q, a, wrong: [3], why }],
     sorts: [{ id, label, buckets: [{ id, name }], items: [[text, bucketId]] }],   // optional
     orders: [{ id, label, hint, items: [in the right order] }],                   // optional
     explain: [{ q, model, ideas }]                                                // optional; ideas as in SBT.explain
   } */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { shuffle } = SBT;
  const esc = SB.esc;

  function start(L) {
    const SECT = L.sections.map(s => ({ ...s, tab: s.title }));
    const TABS = SECT.map(s => ({ id: s.id, title: s.title, kind: 'section' }));
    TABS.push({ id: 'vocab', title: 'Vocabulary', kind: 'vocab' });
    if (L.lab) TABS.push({ id: 'lab', title: 'Lab', kind: 'lab' });
    const tabs = () => `<div class="seg gtabs" role="group" aria-label="Part of the lesson">${TABS.map((t, i) => `<button type="button" data-g="${esc(t.id)}" aria-pressed="${i === 0}">${esc(t.title)}</button>`).join('')}</div>`;
    const NOTE = `<p class="hint">${esc(L.source)}</p>`;
    const TERMS = L.vocab.map(([t, d]) => ({ t, d }));

    function sectionHTML(ctx, s) {
      const say = s.text.join(' ');
      const right = (s.key && s.key.length ? `<h4>Remember</h4><ul class="ideas">${s.key.map(k => `<li>${esc(k)}</li>`).join('')}</ul>` : '')
        + (s.table ? `<h4>${esc(s.table.title)}</h4><table class="ttable ctable"><thead><tr>${s.table.head.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${s.table.rows.map(r => `<tr><th scope="row">${esc(r[0])}</th>${r.slice(1).map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>` : '');
      return `<h3>${esc(s.title)}</h3><div class="gcols"><div class="gsum"><div class="model"><div class="eyebrow">In your book</div>${s.text.map(p => `<p>${esc(p)}</p>`).join('')}${ctx.sayButton(say, 'Hear this part')}</div></div><div class="gidea">${right}</div></div>`;
    }
    function vocabHTML(ctx) {
      return `<h3>Vocabulary</h3><table class="ttable"><tbody>${TERMS.map(({ t, d }) => `<tr><th scope="row">${esc(t)}</th><td>${esc(d)}</td><td class="s">${ctx.sayButton(t + '. ' + d, 'Hear ' + t)}</td></tr>`).join('')}</tbody></table>`;
    }
    function labHTML() {
      const lab = L.lab;
      return `<h3>Lab: ${esc(lab.title)}</h3><div class="gcols"><div class="gsum"><div class="model"><div class="eyebrow">Your book says</div><p>${esc(lab.note)}</p></div></div><div class="gidea"><h4>Ideas to review before the lab</h4><ul class="ideas">${lab.review.map(k => `<li>${esc(k)}</li>`).join('')}</ul></div></div>`;
    }

    const guide = {
      init(ctx) {
        const P = ctx.panel;
        P.innerHTML = `<h2>Study guide</h2><p class="lead">${esc(L.title)}.</p>${tabs()}<div class="gbody"></div>${NOTE}`;
        const body = $('.gbody', P);
        function show(id) {
          const t = TABS.find(x => x.id === id);
          body.innerHTML = t.kind === 'vocab' ? vocabHTML(ctx) : t.kind === 'lab' ? labHTML() : sectionHTML(ctx, SECT.find(s => s.id === id));
        }
        $$('.gtabs button', P).forEach(b => b.onclick = () => { $$('.gtabs button', P).forEach(x => x.setAttribute('aria-pressed', x === b)); show(b.dataset.g); });
        show(TABS[0].id);
      }
    };

    const cards = {
      init(ctx) {
        SBT.flashcards(ctx, {
          modes: [{ id: 'terms', label: 'Vocabulary' }, { id: 'meaning', label: 'What is the word?' }, { id: 'quizq', label: 'Every quiz question' }],
          build(mode) {
            if (mode === 'quizq') return SBT.quizCards(ctx, L.quiz);
            if (mode === 'meaning') return shuffle(TERMS).map(({ t, d }) => ({
              front: `<div class="tag">Which word is this?</div><div class="defline">${esc(d)}</div>`,
              back: `<div class="tag">Answer</div><div class="big">${esc(t)}</div>${ctx.sayButton(t + '. ' + d, 'Hear it')}`, say: d }));
            return shuffle(TERMS).map(({ t, d }) => ({
              front: `<div class="tag">What does this mean?</div><div class="big">${esc(t)}</div>`,
              back: `<div class="tag">Meaning</div><div class="defline">${esc(d)}</div>${ctx.sayButton(t + '. ' + d, 'Hear it')}`, say: 'What does ' + t + ' mean?' }));
          }
        });
      }
    };

    const n = Math.min(10, L.quiz.length);
    const quiz = { init(ctx) { SBT.quiz(ctx, { rounds: n, lead: 'Pick the best answer.', full: () => L.quiz, build: () => shuffle(L.quiz).slice(0, n) }); } };

    const sort = {
      init(ctx) {
        SBT.sort(ctx, {
          sets: L.sorts.map(s => ({ id: s.id, label: s.label, buckets: s.buckets, items: s.items.map(([text, b]) => ({ text, b })) })),
          right: (it, b) => 'Yes! ' + b.name + '.'
        });
      }
    };

    const order = {
      init(ctx) {
        SBT.order(ctx, {
          title: 'Put in order',
          lead: 'Drag the cards into the right order, or use the arrows. Then press Check.',
          sets: L.orders.map(o => ({ id: o.id, label: o.label, hint: o.hint, items: o.items.map(text => ({ text })) }))
        });
      }
    };

    const explain = { init(ctx) { SBT.explain(ctx, { items: L.explain, keepFirst: true }); } };

    const tools = { guide, cards, quiz };
    if (L.sorts && L.sorts.length) tools.sort = sort;
    if (L.orders && L.orders.length) tools.order = order;
    if (L.explain && L.explain.length) tools.explain = explain;
    SBM.start({ module: L.id, defaults: {}, tools });
  }
  window.SBL = { start };
})();
