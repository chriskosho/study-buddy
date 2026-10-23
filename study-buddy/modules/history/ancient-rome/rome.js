/* Ancient Rome: tools. Content is in data.js. Flashcards, Quiz and Sort it use the shared builders in sb-tools.js. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { shuffle, starsHTML, setMsg } = SBT;
  const esc = SB.esc;
  const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const CROSS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  /* ===================== Study guide ===================== */
  const guide = {
    init(ctx) {
      const P = ctx.panel;
      P.innerHTML = `<h2>Study guide</h2><p class="lead">Everything from the Ancient Rome Test 1 study guide.</p>
        <div class="seg gtabs" role="group" aria-label="Study guide section">${GUIDE.map((g, i) => `<button data-g="${g.id}" aria-pressed="${i === 0}">${esc(g.label)}</button>`).join('')}</div>
        <div class="gbody"></div>`;
      const body = $('.gbody', P);
      const rows = b => `<table class="ttable"><tbody>${b.rows.map(([t, d]) => `<tr><th scope="row">${esc(t)}</th><td>${esc(d)}</td><td class="s">${ctx.sayButton(t + '. ' + d, 'Hear ' + t)}</td></tr>`).join('')}</tbody></table>`;
      function show(id) {
        const g = GUIDE.find(x => x.id === id);
        if (g.table) {
          body.innerHTML = `<h3>Kinds of government</h3><p class="hint">Be able to explain each kind of government, when or if Rome had it, the good aspects, and the bad aspects.</p>
            <div class="tablewrap"><table class="ttable gov"><thead><tr><th>Kind</th><th>What and when</th><th>Good aspects</th><th>Bad aspects</th></tr></thead>
            <tbody>${GOVS.map(v => `<tr><th scope="row">${esc(v.name)}</th><td>${esc(v.what)}</td><td>${esc(v.good)}</td><td>${esc(v.bad)}</td></tr>`).join('')}</tbody></table></div>`;
        } else if (g.explain) {
          const e = EXPLAIN[0];
          body.innerHTML = `<h3>Be able to explain in complete sentences</h3><p class="qline">${esc(e.q)}</p>
            <div class="model"><div class="eyebrow">Answer from the study guide</div><p>${esc(e.model)}</p>${ctx.sayButton(e.model, 'Hear the answer')}</div>
            <p class="hint">Practice writing it yourself in the Explain it tool.</p>`;
        } else {
          body.innerHTML = `<div class="gcols">${g.blocks.map(b => b.gods
            ? `<div><h3>${esc(b.h)}</h3><p class="note">${esc(b.note)}</p><div class="gods">${GODS.map(x => `<div class="god"><b>${esc(x.name)}</b><span>${esc(x.attr)}</span></div>`).join('')}</div></div>`
            : `<div><h3>${esc(b.h)}</h3>${rows(b)}</div>`).join('')}</div>`;
        }
      }
      $$('.gtabs button', P).forEach(b => b.onclick = () => { $$('.gtabs button', P).forEach(x => x.setAttribute('aria-pressed', x === b)); show(b.dataset.g); });
      show(GUIDE[0].id);
    }
  };

  /* ===================== Flashcards ===================== */
  const cards = {
    init(ctx) {
      SBT.flashcards(ctx, {
        modes: [{ id: 'terms', label: 'Study guide terms' }, { id: 'gods', label: 'Gods and goddesses' }],
        build(mode) {
          if (mode === 'gods') return shuffle(GODS).map(g => ({
            front: `<div class="tag">Who is this Roman god?</div><div class="big">${esc(g.name)}</div>`,
            back: `<div class="tag">Answer</div><div class="defline">${esc(g.attr)}</div><div class="exl">Check this against your class chart.</div>${ctx.sayButton(g.name + '. ' + g.attr, 'Hear it')}`,
            say: 'Who is ' + g.name + '?' }));
          return shuffle(CARDS).map(([t, d]) => ({
            front: `<div class="tag">What does this mean?</div><div class="big">${esc(t)}</div>`,
            back: `<div class="tag">Answer</div><div class="defline">${esc(d)}</div>${ctx.sayButton(t + '. ' + d, 'Hear it')}`,
            say: 'What does ' + t + ' mean?' }));
        }
      });
    }
  };

  /* ===================== Quiz ===================== */
  const godQuestions = () => GODS.map(g => ({
    q: 'Which Roman god or goddess is this: ' + g.attr.charAt(0).toLowerCase() + g.attr.slice(1) + '?',
    a: g.name, wrong: shuffle(GODS.filter(x => x.name !== g.name)).slice(0, 3).map(x => x.name),
    why: g.name + ': ' + g.attr + '. (Check your class chart.)' }));
  const quiz = {
    init(ctx) {
      SBT.quiz(ctx, { rounds: 10, lead: 'Pick the best answer.', build: () => [...shuffle(QUIZ).slice(0, 8), ...shuffle(godQuestions()).slice(0, 2)] });
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

  /* ===================== Fill it in ===================== */
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/^(the|a|an)\s+/, '').replace(/[^a-z0-9]/g, '');
  function dist(a, b) {            // edit distance, for a one-letter slip
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  const ROUND = 10;
  const blanks = {
    init(ctx) {
      const P = ctx.panel, B = { list: [], i: 0, score: 0, tries: 0, hinted: false };
      function start() { B.list = shuffle(BLANKS).slice(0, ROUND); B.i = 0; B.score = 0; show(); }
      function show() {
        if (B.i >= B.list.length) {
          ctx.result(B.score, B.list.length); ctx.sfx.win();
          P.innerHTML = `<h2>Fill it in</h2><div class="result">${starsHTML(B.score, B.list.length)}<p class="prompt">${B.score} out of ${B.list.length}</p><p class="lead">${B.score >= 8 ? 'Excellent! You know your facts.' : 'Good practice. Try the flashcards, then come back.'}</p><button class="btn" data-a="again">Play again</button></div>`;
          $('[data-a="again"]', P).onclick = start; return;
        }
        const item = B.list[B.i], main = item.a[0]; B.tries = 0; B.hinted = false;
        const shown = esc(item.s).replace('___', '<span class="blank">______</span>');
        P.innerHTML = `<h2>Fill it in</h2><p class="lead">Type the missing word.</p>
          <div class="roundbar"><div class="bar" aria-hidden="true"><i style="width:${B.i / B.list.length * 100}%"></i></div><span class="hint">Question ${B.i + 1} of ${B.list.length} &middot; Score ${B.score}</span></div>
          <div class="row qrow"><p class="qtext fill">${shown}</p>${ctx.sayButton(item.s.replace('___', 'blank'), 'Hear it')}</div>
          <form class="spellrow" autocomplete="off"><input aria-label="Missing word" placeholder="Type the word" autocapitalize="off" spellcheck="false"><button class="btn" type="submit">Check</button></form>
          <div class="err" role="alert"></div>
          <div class="row center"><button type="button" class="btn ghost" data-a="hint">Hint</button><button type="button" class="btn" data-a="next" hidden>${B.i === B.list.length - 1 ? 'See results' : 'Next'}</button></div>`;
        const inp = $('input', P), err = $('.err', P), next = $('[data-a="next"]', P), hintBtn = $('[data-a="hint"]', P);
        inp.focus();
        const done = () => { inp.disabled = true; $('form button', P).disabled = true; hintBtn.hidden = true; next.hidden = false; next.focus(); };
        inp.oninput = () => { inp.classList.remove('bad'); err.textContent = ''; };
        hintBtn.onclick = () => { B.hinted = true; err.style.color = 'var(--ink2)'; err.textContent = 'Starts with "' + main[0] + '" and has ' + main.length + ' characters.'; inp.focus(); };
        $('form', P).onsubmit = e => {
          e.preventDefault();
          const v = inp.value.trim();
          if (!v) { inp.classList.add('bad'); err.style.color = ''; err.textContent = 'Type an answer first.'; return; }
          const n = norm(v), exact = item.a.some(a => norm(a) === n), close = !exact && item.a.some(a => norm(a).length >= 5 && dist(norm(a), n) <= 1);
          if (exact || close) {
            if (!B.hinted && B.tries === 0) B.score++;
            ctx.credit(); ctx.sfx.good(); err.style.color = 'var(--good)';
            err.textContent = (close ? 'Close enough! It is spelled ' + main + '.' : 'Correct!') + (B.hinted ? ' (Hint used, so no point.)' : '');
            ctx.say(item.s.replace('___', main)); done();
          } else {
            B.tries++; ctx.slip(); ctx.sfx.bad(); inp.classList.add('bad'); err.style.color = '';
            if (B.tries >= 2) { err.textContent = 'The answer is ' + main + '.'; done(); }
            else err.textContent = 'Not quite. Try again.';
          }
        };
        next.onclick = () => { B.i++; show(); };
        ctx.say(item.s.replace('___', 'blank'));
      }
      start();
    }
  };

  /* ===================== Explain it (shared tool) ===================== */
  const explain = { init(ctx) { SBT.explain(ctx, { items: EXPLAIN, keepFirst: true }); } };

  SBM.start({ module: 'ancient-rome', defaults: {}, tools: { guide, cards, quiz, sort, blanks, explain } });
})();
