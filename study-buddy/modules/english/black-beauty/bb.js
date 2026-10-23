/* Black Beauty: tools. Content is in data.js. Every tool except the study guide uses the shared builders in sb-tools.js. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { shuffle } = SBT;
  const esc = SB.esc;
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  /* ===================== Study guide ===================== */
  const SECTIONS = [
    { id: 'book', label: 'The book' },
    { id: 'horses', label: 'Horses' },
    { id: 'people', label: 'People' },
    { id: 'homes', label: 'Beauty\'s homes' },
    { id: 'ideas', label: 'Big ideas' },
    { id: 'words', label: 'Words to know' }
  ];
  const guide = {
    init(ctx) {
      const P = ctx.panel;
      P.innerHTML = `<h2>Study guide</h2><p class="lead">The characters, places, and big ideas of Black Beauty by Anna Sewell.</p>
        <div class="seg gtabs" role="group" aria-label="Study guide section">${SECTIONS.map((g, i) => `<button data-g="${g.id}" aria-pressed="${i === 0}">${esc(g.label)}</button>`).join('')}</div>
        <div class="gbody"></div>`;
      const body = $('.gbody', P);
      const table = (rows, cls = '') => `<table class="ttable ${cls}"><tbody>${rows.map(([t, d]) => `<tr><th scope="row">${esc(t)}</th><td>${esc(d)}</td><td class="s">${ctx.sayButton(t + '. ' + d, 'Hear ' + t)}</td></tr>`).join('')}</tbody></table>`;
      const half = rows => { const k = Math.ceil(rows.length / 2); return `<div class="gcols"><div>${table(rows.slice(0, k))}</div><div>${table(rows.slice(k))}</div></div>`; };
      function show(id) {
        if (id === 'book') body.innerHTML = table(BOOK);
        else if (id === 'horses') body.innerHTML = half(HORSES);
        else if (id === 'people') body.innerHTML = half(PEOPLE);
        else if (id === 'ideas') body.innerHTML = half(IDEAS);
        else if (id === 'words') body.innerHTML = half(WORDS);
        else body.innerHTML = `<ol class="homes">${HOMES.map((h, i) => `<li><span class="hnum">${i + 1}</span><div><div class="hhead"><b>${esc(h.place)}</b><span class="hpart">${esc(h.part)}</span>${h.name ? `<span class="hname">Called ${esc(h.name)}</span>` : ''}</div><p>${esc(h.what)}</p></div></li>`).join('')}</ol>`;
      }
      $$('.gtabs button', P).forEach(b => b.onclick = () => { $$('.gtabs button', P).forEach(x => x.setAttribute('aria-pressed', x === b)); show(b.dataset.g); });
      show(SECTIONS[0].id);
    }
  };

  /* ===================== Flashcards ===================== */
  const cards = {
    init(ctx) {
      const deck = (list, ask) => shuffle(list).map(([t, d]) => ({
        front: `<div class="tag">${esc(ask)}</div><div class="big">${esc(t)}</div>`,
        back: `<div class="tag">Answer</div><div class="defline">${esc(d)}</div>${ctx.sayButton(t + '. ' + d, 'Hear it')}`,
        say: ask.replace('this', t) }));
      SBT.flashcards(ctx, {
        modes: [{ id: 'chars', label: 'Characters' }, { id: 'homes', label: 'Homes' }, { id: 'words', label: 'Words to know' }],
        build(mode) {
          if (mode === 'words') return deck(WORDS, 'What does this mean?');
          if (mode === 'homes') return shuffle(HOMES).map(h => ({
            front: `<div class="tag">What happens to Beauty here?</div><div class="big">${esc(h.place)}</div>`,
            back: `<div class="tag">${esc(h.part)}${h.name ? ' &middot; Called ' + esc(h.name) : ''}</div><div class="defline">${esc(h.what)}</div>${ctx.sayButton(h.place + '. ' + h.what, 'Hear it')}`,
            say: 'What happens to Beauty at ' + h.place + '?' }));
          return deck([...HORSES, ...PEOPLE], 'Who is this?');
        }
      });
    }
  };

  /* ===================== Quiz ===================== */
  const quiz = { init(ctx) { SBT.quiz(ctx, { rounds: 10, lead: 'Pick the best answer.', build: () => QUIZ }); } };

  /* ===================== Sort it ===================== */
  const sort = {
    init(ctx) {
      SBT.sort(ctx, {
        sets: SORTS.map(s => ({ id: s.id, label: s.label, perBucket: s.perBucket, buckets: s.buckets.map(b => ({ id: slug(b), name: b })), items: s.items.map(([text, b]) => ({ text, b: slug(b) })) })),
        right: (it, b) => 'Yes! ' + it.text + ' goes with ' + b.name + '.'
      });
    }
  };

  /* ===================== Put in order ===================== */
  const order = {
    init(ctx) {
      const part = n => EVENTS.slice(n[0], n[1]);
      SBT.order(ctx, {
        lead: 'Put the events in the order they happen in the book. Drag the cards, or use the arrows. Then press Check.',
        sets: [
          { id: 'start', label: 'Beginning', items: part([0, 9]), pick: 6 },
          { id: 'end', label: 'End', items: part([8, EVENTS.length]), pick: 6 },
          { id: 'all', label: 'Whole book', items: EVENTS, pick: 7 }
        ]
      });
    }
  };

  /* ===================== Explain it ===================== */
  const explain = { init(ctx) { SBT.explain(ctx, { items: EXPLAIN, rounds: 5 }); } };

  SBM.start({ module: 'black-beauty', defaults: {}, tools: { guide, cards, quiz, sort, order, explain } });
})();
