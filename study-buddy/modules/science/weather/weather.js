/* Weather: tools. Content is in data.js, drawings in art.js. Flashcards, Quiz, Sort it, and Explain it use the shared builders in sb-tools.js. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { shuffle } = SBT;
  const esc = SB.esc;
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const row = (ctx, t, d) => `<tr><th scope="row">${esc(t)}</th><td>${esc(d)}</td><td class="s">${ctx.sayButton(t + '. ' + d, 'Hear ' + t)}</td></tr>`;

  /* ===================== Study guide ===================== */
  const guide = {
    init(ctx) {
      const P = ctx.panel;
      const tabs = [...GUIDE.map(g => ({ id: g.id, label: g.label })), { id: 'kinds', label: 'Kinds of weather' }, { id: 'test', label: 'From the practice test' }];
      P.innerHTML = `<h2>Study guide</h2><p class="lead">Everything from the Unit 3 notes and the practice test.</p>
        <div class="seg gtabs" role="group" aria-label="Study guide section">${tabs.map((t, i) => `<button data-g="${t.id}" aria-pressed="${i === 0}">${esc(t.label)}</button>`).join('')}</div><div class="gbody"></div>`;
      const body = $('.gbody', P);
      function show(id) {
        const g = GUIDE.find(x => x.id === id);
        if (g) body.innerHTML = `<div class="gwrap"><div class="gart">${ART[g.art]}</div><div><h3>${esc(g.label)}</h3><table class="ttable"><tbody>${g.rows.map(([t, d]) => row(ctx, t, d)).join('')}</tbody></table></div></div>`;
        else if (id === 'kinds') body.innerHTML = `<h3>Kinds of weather</h3><p class="note">The six kinds of weather from your flip-book. Tap one to hear it.</p><div class="kinds">${KINDS.map(k => `<button class="kind" data-k="${esc(k)}">${kindSVG(k)}<b>${esc(k)}</b></button>`).join('')}</div>`;
        else body.innerHTML = `<h3>From the practice test</h3><p class="note">These facts come from the Unit 3 practice test questions. They are not in your notes.</p><div class="facts">${TEST_FACTS.map(([t, d]) => `<div class="fact"><b>${esc(t)}</b><span>${esc(d)}</span>${ctx.sayButton(t + '. ' + d, 'Hear ' + t)}</div>`).join('')}</div>`;
        $$('.kind', body).forEach(b => b.onclick = () => ctx.say(b.dataset.k));
      }
      $$('.gtabs button', P).forEach(b => b.onclick = () => { $$('.gtabs button', P).forEach(x => x.setAttribute('aria-pressed', x === b)); show(b.dataset.g); });
      show(tabs[0].id);
    }
  };

  /* ===================== Flashcards ===================== */
  const cards = {
    init(ctx) {
      SBT.flashcards(ctx, {
        modes: [{ id: 'terms', label: 'Vocabulary' }, { id: 'kinds', label: 'Kinds of weather' }],
        build(mode) {
          if (mode === 'kinds') return shuffle(KINDS).map(k => ({
            front: `<div class="tag">What kind of weather is this?</div><div class="kindface">${kindSVG(k)}</div>`,
            back: `<div class="tag">Answer</div><div class="big">${esc(k)}</div>${ctx.sayButton(k, 'Hear it')}`, say: 'What kind of weather is this?' }));
          return shuffle(CARDS).map(([t, d]) => ({
            front: `<div class="tag">What does this mean?</div><div class="big">${esc(t)}</div>`,
            back: `<div class="tag">Answer</div><div class="defline">${esc(d)}</div>${ctx.sayButton(t + '. ' + d, 'Hear it')}`, say: 'What does ' + t + ' mean?' }));
        }
      });
    }
  };

  /* ===================== Quiz ===================== */
  const kindQuestions = () => KINDS.map(k => ({ q: 'What kind of weather is this?', a: k, wrong: shuffle(KINDS.filter(x => x !== k)).slice(0, 3), html: `<div class="qpic">${kindSVG(k)}</div>` }));
  const quiz = { init(ctx) { SBT.quiz(ctx, { rounds: 10, lead: 'Pick the best answer.', full: () => [...QUIZ, ...kindQuestions()], build: () => [...shuffle(QUIZ).slice(0, 8), ...shuffle(kindQuestions()).slice(0, 2)] }); } };

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

  /* ===================== Label the diagram (a quiz on the two practice-test diagrams) ===================== */
  const label = {
    init(ctx) {
      const build = () => [
        ...EARTH.map(([k, name]) => ({ q: 'Which letter shows the ' + (/^[A-Z]/.test(name) ? name : name) + '?', say: 'Which letter shows the ' + name + '?', a: k, wrong: EARTH.map(x => x[0]).filter(x => x !== k), html: `<div class="qpic wide">${earthLetters()}</div>` })),
        ...CYCLE.map(([k, name]) => ({ q: 'Which letter shows ' + name + '?', say: 'Which letter shows ' + name + '?', a: k, wrong: CYCLE.map(x => x[0]).filter(x => x !== k), html: `<div class="qpic wide">${cycleLetters()}</div>` }))
      ];
      SBT.quiz(ctx, { title: 'Label the diagram', rounds: 8, lead: 'Look at the diagram, then pick the letter.', build });
    }
  };

  /* ===================== Read the graph ===================== */
  const graph = {
    init(ctx) {
      const make = () => {
        let t; do { t = Array.from({ length: 7 }, () => 29 + Math.floor(Math.random() * 11)); } while (new Set(t).size < 7);
        const days = [1, 2, 3, 4, 5, 6, 7], hi = t.indexOf(Math.max(...t)) + 1, lo = t.indexOf(Math.min(...t)) + 1;
        const html = `<div class="qpic wide">${graphSVG(t)}</div>`, others = d => shuffle(days.filter(x => x !== d)).slice(0, 3).map(x => 'Day ' + x);
        const pick = shuffle([
          { q: 'On what day was the temperature highest?', a: 'Day ' + hi, wrong: others(hi) },
          { q: 'On what day was the temperature lowest?', a: 'Day ' + lo, wrong: others(lo) },
          (() => { const d = 1 + Math.floor(Math.random() * 7); return { q: 'What was the temperature on day ' + d + '?', a: t[d - 1] + ' degrees', wrong: shuffle([t[d - 1] - 2, t[d - 1] - 1, t[d - 1] + 1, t[d - 1] + 2]).slice(0, 3).map(x => x + ' degrees') }; })()
        ])[0];
        return { ...pick, say: pick.q, html };
      };
      SBT.quiz(ctx, { title: 'Read the graph', rounds: 6, lead: 'Look at the line graph, then choose the best answer.', keepOrder: true, build: () => Array.from({ length: 6 }, make) });
    }
  };

  /* ===================== Explain it ===================== */
  const explain = { init(ctx) { SBT.explain(ctx, { items: EXPLAIN, rounds: 5, keepFirst: true }); } };

  SBM.start({ module: 'weather', defaults: {}, tools: { guide, cards, quiz, type, sort, label, graph, explain } });
})();
