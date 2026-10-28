/* Black Beauty (study guide version): tools. Content is in data.js, taken from the teacher's study guide. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { shuffle } = SBT;
  const esc = SB.esc;
  const chLabel = c => 'Ch. ' + c;

  /* ===================== Study guide ===================== */
  const HLSET = new Set(HL.map(([c, q]) => c + '|' + q));
  const isHL = (c, q) => HLSET.has(c + '|' + q);
  const guide = {
    init(ctx) {
      const P = ctx.panel, st = ctx.state;
      const total = HL.length + HL_TALK.length;
      P.innerHTML = `<h2>Study guide</h2><p class="lead">The class questions for Black Beauty, chapter by chapter, with the guide's answers. Your teacher highlighted some of them in yellow, so those show first.</p>
        <div class="gbar"><div class="seg" role="group" aria-label="Which questions to show"><button data-f="1">Highlighted <small>${total}</small></button><button data-f="0">All questions</button></div>
        <span class="hlkey"><i aria-hidden="true"></i> Highlighted by the teacher</span></div>
        <div class="seg gtabs" role="group" aria-label="Part of the book">${PARTS.map((g, i) => `<button data-g="${g.id}" aria-pressed="${i === 0}">${esc(g.label)} <small>${esc(g.range)}</small></button>`).join('')}</div>
        <p class="gnote">${esc(MISSING)}</p><div class="chlist"></div>`;
      const body = $('.chlist', P); let part = 1;
      const focus = () => st.hlOnly !== false;                      // starts on the highlighted questions only; each student keeps their own choice
      const card = (ch, only) => {
        const rows = ch.qa.filter(([q]) => !only || isHL(ch.c, q)), talk = ch.talk && (!only || HL_TALK.includes(ch.c));
        if (!rows.length && !talk) return '';
        return `<section class="chcard"><h3>${esc(chLabel(ch.c))}${ch.k ? '<span class="chtag cp">Checkpoint</span>' : ''}${ch.hw ? '<span class="chtag">Homework</span>' : ''}</h3>
        ${rows.map(([q, a]) => { const h = isHL(ch.c, q); return `<div class="bq${h ? ' hl' : ''}"><div class="t"><b>${esc(q)}</b><span>${esc(a)}</span>${h && !only ? '<em class="hltag">Highlighted</em>' : ''}</div>${ctx.sayButton(q + ' ' + a, 'Hear question and answer')}</div>`; }).join('')}
        ${talk ? `<p class="talk${HL_TALK.includes(ch.c) ? ' hl' : ''}">${esc(ch.talk)}${HL_TALK.includes(ch.c) && !only ? ' <em class="hltag">Highlighted</em>' : ''}</p>` : ''}</section>`;
      };
      function show() {
        const only = focus(), html = CH.filter(c => c.part === part).map(c => card(c, only)).join('');
        $$('.gbar [data-f]', P).forEach(b => b.setAttribute('aria-pressed', (b.dataset.f === '1') === only));
        body.innerHTML = html || '<p class="gnote">No questions in this part were highlighted. Choose All questions to see them.</p>';
      }
      $$('.gbar [data-f]', P).forEach(b => b.onclick = () => { st.hlOnly = b.dataset.f === '1'; ctx.save(); show(); });
      $$('.gtabs button', P).forEach(b => b.onclick = () => { $$('.gtabs button', P).forEach(x => x.setAttribute('aria-pressed', x === b)); part = +b.dataset.g; show(); });
      show();
    }
  };

  /* ===================== Flashcards (practice only) ===================== */
  const cards = {
    init(ctx) {
      SBT.flashcards(ctx, {
        lead: 'Tap the card to flip it. Say the answer before you flip. Cards you miss come back again.',
        modes: PARTS.map(p => ({ id: String(p.id), label: p.label + ', ' + p.range })),
        build: mode => shuffle(CH.filter(c => c.part === +mode).flatMap(c => c.qa.map(([q, a]) => ({
          front: `<div class="tag">${esc(chLabel(c.c))}</div><div class="big sm">${esc(q)}</div>`,
          back: `<div class="tag">Answer</div><div class="defline">${esc(a)}</div>${ctx.sayButton(q + ' ' + a, 'Hear it')}`,
          say: q }))))
      });
    }
  };

  /* ===================== Quiz ===================== */
  const quiz = { init(ctx) { SBT.quiz(ctx, { rounds: 10, lead: 'Pick the best answer. You can skip one you do not know.', skip: true, build: () => QUIZ }); } };

  /* ===================== Type the answer ===================== */
  const answer = {
    init(ctx) {
      SBT.answer(ctx, {
        title: 'Type the answer', kind: 'text', typo: true, skip: true, rounds: 10,
        lead: 'Type the answer from the study guide, then press Check. Two tries, and you can skip one for review.',
        build: () => shuffle(TYPE).map(t => ({ q: esc(t.q).replace(/_{3,}/g, '<span class="blank">______</span>'), say: t.q.replace(/_{3,}/g, 'blank'), a: t.a, noTypo: t.noTypo }))
      });
    }
  };

  /* ===================== Put in order ===================== */
  const order = {
    init(ctx) {
      const part = r => EVENTS.slice(r[0], r[1]);
      SBT.order(ctx, {
        lead: 'Put the events in the order they happen in the book. Drag the cards, or use the arrows. Then press Check.',
        sets: [
          { id: 'p1', label: 'Part 1', items: part([0, 10]), pick: 6 },     // Part 1 is chapters 1 to 21; Earlshall Park (chapter 22) starts Part 2
          { id: 'p2', label: 'Parts 2 and 3', items: part([10, 20]), pick: 6 },
          { id: 'end', label: 'The end', items: part([18, EVENTS.length]), pick: 6 },
          { id: 'all', label: 'Whole book', items: EVENTS, pick: 7 }
        ]
      });
    }
  };

  /* ===================== Explain it ===================== */
  const explain = { init(ctx) { SBT.explain(ctx, { items: EXPLAIN, rounds: 5 }); } };

  window.__bbTest = { HL, HL_TALK, CH, QUIZ, TYPE, EXPLAIN, EVENTS };                    // a hook so the test can check every item
  SBM.start({ module: 'black-beauty-guide', defaults: {}, tools: { guide, cards, quiz, answer, order, explain } });
})();
