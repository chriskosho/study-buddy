/* Ham Radio Technician: tools. Content is in data.js (the official 2026-2030 Technician pool, 409 questions).
   Flashcards: one topic group at a time, with a menu and arrows to jump between sections.
   Mock exam: 35 questions, one random question from each of the 35 groups, 26 right to pass.
   The answer choices always stay in the official order (some choices say "All these choices are correct"). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { shuffle } = SBT;
  const esc = SB.esc;
  const { SUBS, GROUPS, Q } = window.HAM;
  const SUB = Object.fromEntries(SUBS.map(s => [s.id, s]));
  const GRP = Object.fromEntries(GROUPS.map(g => [g.id, g]));
  const L = 'ABCD', PASS = 26, TOTAL = GROUPS.length;
  const FIGSIZE = { 1: [600, 470], 2: [1000, 460], 3: [560, 625] };
  const hook = (k, v) => { (window.__hamTest = window.__hamTest || {})[k] = v; return v; };   // a hook so the test can read the exam

  const fig = q => q.f ? `<figure class="hfig"><img src="fig-t${q.f}.png" width="${FIGSIZE[q.f][0]}" height="${FIGSIZE[q.f][1]}" alt="Figure T-${q.f}, a circuit diagram with numbered parts"></figure>` : '';
  const spoken = q => q.q + ' ' + q.c.map((c, i) => L[i] + '. ' + c + '.').join(' ');
  const gLabel = g => g.id + ' · ' + g.label;
  const ruleLine = q => q.r ? `<p class="hrule">FCC rule: ${esc(q.r)}</p>` : '';

  /* ===================== Flashcards (practice only) ===================== */
  const cards = {
    init(ctx) {
      const say = q => ctx.sayButton(L[q.a] + '. ' + q.c[q.a] + '. ' + q.x, 'Hear the answer');
      const card = q => ({
        front: `<div class="tag">${esc(gLabel(GRP[q.g]))}</div><div class="hq">${esc(q.q)}</div>${fig(q)}
          <div class="hch">${q.c.map((c, i) => `<div><b>${L[i]}.</b> <span>${esc(c)}</span></div>`).join('')}</div>`,
        back: `<div class="tag">Answer</div><div class="hans"><b>${L[q.a]}.</b> ${esc(q.c[q.a])}</div><p class="hx">${esc(q.x)}</p>${ruleLine(q)}${say(q)}`,
        say: spoken(q)
      });
      const st = ctx.state, missed = (st.missed || []).filter(id => Q.some(q => q.id === id));
      const sections = [{ id: 'all', label: 'All sections (' + Q.length + ' cards)', noStep: true }].concat(missed.length ? [{ id: 'missed', label: 'Missed on mock exams (' + missed.length + ')', noStep: true }] : []).concat(GROUPS.map(g => ({
        id: g.id, label: gLabel(g) + ' (' + Q.filter(q => q.g === g.id).length + ')', group: g.sub + ' ' + SUB[g.sub].name
      })));
      SBT.flashcards(ctx, {
        lead: 'Read the question, think of your answer, then tap the card to flip it. Cards you miss come back again. Use the menu or the arrows to jump to another section.',
        modes: [{ id: 'order', label: 'In order' }, { id: 'shuffle', label: 'Shuffled' }],
        sections: { list: sections, start: sections.some(x => x.id === st.cardSec) ? st.cardSec : GROUPS[0].id },
        onSection: id => { st.cardSec = id; ctx.save(); },                         // opens at the same section next time
        build: (mode, sec) => {
          const qs = sec === 'all' ? Q : sec === 'missed' ? Q.filter(q => missed.includes(q.id)) : Q.filter(q => q.g === sec);
          return (mode === 'shuffle' ? shuffle(qs) : qs).map(card);
        }
      });
    }
  };

  /* ===================== Mock exam ===================== */
  const exam = {
    init(ctx) {
      const P = ctx.panel, st = ctx.state;
      if (st.reveal !== 'end') st.reveal = 'now';
      let E = null;
      hook('exam', () => E);
      const pickExam = () => GROUPS.map(g => {
        const force = ((window.__hamTest || {}).force || []).map(id => Q.find(q => q.id === id)).find(q => q && q.g === g.id);   // the test can pin questions
        if (force) return force;
        const a = Q.filter(q => q.g === g.id); return a[Math.floor(Math.random() * a.length)];
      });

      /* ---- start screen ---- */
      function setup() {
        SB.stopSpeech(); E = null;
        const NOTE = {
          now: 'You find out right away whether you were right, with a short explanation, then go on to the next question.',
          end: 'Answer all 35, go back and change any answer you like, then check everything together at the end.'
        };
        P.innerHTML = `<h2>Mock exam</h2>
          <p class="lead">${TOTAL} questions picked at random, one from each of the ${TOTAL} topic groups, the way the real Technician test is built. You need ${PASS} right (74%) to pass.</p>
          <div class="hset"><span class="hlab" id="hrevlab">Show the answer</span>
            <div class="seg" role="group" aria-labelledby="hrevlab"><button data-r="now" aria-pressed="${st.reveal === 'now'}">After each question</button><button data-r="end" aria-pressed="${st.reveal === 'end'}">At the end</button></div></div>
          <p class="hint hnote" aria-live="polite">${NOTE[st.reveal]}</p>
          <div class="row center"><button class="btn" data-a="start">Start the exam</button></div>`;
        $$('[data-r]', P).forEach(b => b.onclick = () => {
          st.reveal = b.dataset.r; ctx.save();
          $$('[data-r]', P).forEach(x => x.setAttribute('aria-pressed', x === b));
          $('.hnote', P).textContent = NOTE[st.reveal];
        });
        $('[data-a="start"]', P).onclick = () => { E = { qs: pickExam(), ans: Array(TOTAL).fill(null), i: 0, mode: st.reveal, done: false, confirm: false, quit: false }; draw(); };
        const lx = st.examLast, lq = lx && Array.isArray(lx.ids) ? lx.ids.map(id => Q.find(q => q.id === id)) : null;
        if (lq && lq.length === TOTAL && lq.every(Boolean) && Array.isArray(lx.ans)) {
          $('.row.center', P).insertAdjacentHTML('beforeend', '<button class="btn ghost" data-a="last">See your last results</button>');
          $('[data-a="last"]', P).onclick = () => {
            const ans = lx.ans.slice(0, TOTAL).map(a => (a === 0 || a === 1 || a === 2 || a === 3) ? a : null);
            E = { qs: lq, ans, i: 0, mode: lx.mode === 'end' ? 'end' : 'now', done: true, confirm: false, quit: false, score: ans.reduce((n, a, i) => n + (a === lq[i].a ? 1 : 0), 0) };
            results();
          };
        }
        const sv = st.examNow, qs = sv && Array.isArray(sv.ids) ? sv.ids.map(id => Q.find(q => q.id === id)) : null;   // an exam left unfinished (page closed): offer to carry on
        if (qs && qs.length === TOTAL && qs.every(Boolean) && Array.isArray(sv.ans)) {
          const n = sv.ans.filter(a => a != null).length;
          $('.row.center', P).insertAdjacentHTML('afterbegin', `<button class="btn good" data-a="resume">Carry on with your exam (${n} of ${TOTAL} answered)</button>`);
          $('[data-a="start"]', P).textContent = 'Start a new exam'; $('[data-a="start"]', P).classList.add('ghost');
          $('[data-a="resume"]', P).onclick = () => { E = { qs, ans: sv.ans.slice(0, TOTAL).map(a => (a === 0 || a === 1 || a === 2 || a === 3) ? a : null), i: Math.min(TOTAL - 1, Math.max(0, sv.i | 0)), mode: sv.mode === 'end' ? 'end' : 'now', done: false, confirm: false, quit: false }; draw(); };
        }
      }
      const keep = () => { st.examNow = E && !E.done ? { ids: E.qs.map(q => q.id), ans: E.ans, i: E.i, mode: E.mode } : null; ctx.save(); };

      /* ---- one question ---- */
      function draw() {
        SB.stopSpeech(); keep();
        if (E.confirm) return confirmScreen();
        const q = E.qs[E.i], g = GRP[q.g], mine = E.ans[E.i], now = E.mode === 'now', locked = now && mine != null;
        const opts = q.c.map((c, i) => {
          let cls = '', extra = '';
          if (locked) { if (i === q.a) cls = ' right'; else if (i === mine) cls = ' wrong'; }
          else if (!now && i === mine) { cls = ' pick'; extra = ' aria-pressed="true"'; }
          else if (!now) extra = ' aria-pressed="false"';
          return `<button class="opt hopt${cls}" data-i="${i}"${locked ? ' disabled' : ''}${extra}><span class="ol">${L[i]}</span><span class="ot">${esc(c)}</span></button>`;
        }).join('');
        const last = E.i === TOTAL - 1;
        const right = E.ans.reduce((n, a, i) => n + (a === E.qs[i].a ? 1 : 0), 0);
        const grid = now ? '' : `<div class="hgrid" role="group" aria-label="Jump to a question">${E.qs.map((_, j) =>
          `<button data-j="${j}" class="${E.ans[j] != null ? 'done' : ''}${j === E.i ? ' cur' : ''}" aria-label="Question ${j + 1}${E.ans[j] != null ? ', answered' : ''}"${j === E.i ? ' aria-current="true"' : ''}>${j + 1}</button>`).join('')}</div>`;
        P.innerHTML = `<div class="roundbar"><div class="bar" aria-hidden="true"><i style="width:${(E.i + (locked ? 1 : 0)) / TOTAL * 100}%"></i></div>
            <span class="hint">Question ${E.i + 1} of ${TOTAL}${now ? ' · Right ' + right : ''}</span></div>
          <div class="hqwrap">
            <p class="hgl">${esc(gLabel(g))}</p>
            <div class="row hqrow"><p class="hqt" tabindex="-1" id="hqt">${esc(q.q)}</p>${ctx.sayButton(spoken(q), 'Hear the question and choices')}</div>
            ${fig(q)}
            <div class="hopts">${opts}</div>
            <div class="hreveal" aria-live="polite">${locked ? revealHtml(q, mine) : ''}</div>
          </div>
          <div class="row hnav">
            <button class="btn ghost" data-a="quit">${E.quit ? 'Really stop the exam?' : 'Stop exam'}</button>
            <span class="grow"></span>
            ${now ? '' : `<button class="btn ghost" data-a="back"${E.i === 0 ? ' disabled' : ''}>Back</button>`}
            <button class="btn" data-a="next"${now && !locked ? ' hidden' : ''}>${last ? (now ? 'See results' : 'Finish exam') : 'Next question'}</button>
          </div>${grid}`;
        $$('.hopt', P).forEach(b => b.onclick = () => choose(+b.dataset.i));
        $$('[data-j]', P).forEach(b => b.onclick = () => { E.i = +b.dataset.j; draw(); });
        $('[data-a="next"]', P).onclick = () => { if (last) return now ? finish() : finishCheck(); E.i++; E.quit = false; draw(); };
        const bk = $('[data-a="back"]', P); if (bk) bk.onclick = () => { E.i--; draw(); };
        $('[data-a="quit"]', P).onclick = () => { if (E.quit) { E = null; keep(); return setup(); } E.quit = true; draw(); };
        const t = $('#hqt', P); if (t) t.focus({ preventScroll: true });
        if (!locked) ctx.say(spoken(q));
      }

      function revealHtml(q, mine) {
        const ok = mine === q.a;
        return `<p class="hv">${ok ? '<b class="ok">Correct!</b>' : '<b class="no">Not quite.</b> The answer is <b>' + L[q.a] + '. ' + esc(q.c[q.a]) + '</b>'}</p><p class="hx">${esc(q.x)}</p>${ruleLine(q)}`;
      }

      function choose(i) {
        const q = E.qs[E.i];
        if (E.mode === 'now') {
          if (E.ans[E.i] != null) return;
          E.ans[E.i] = i;
          if (i === q.a) { ctx.credit(); ctx.sfx.good(); } else { ctx.slip(); ctx.sfx.bad(); }
          draw();
          const nx = $('[data-a="next"]', P); if (nx) nx.focus({ preventScroll: true });
        } else {
          E.ans[E.i] = i; draw();
          const nx = $('[data-a="next"]', P); if (nx) nx.focus({ preventScroll: true });
        }
      }

      /* ---- finishing ---- */
      function finishCheck() {
        const open = E.ans.map((a, i) => a == null ? i : -1).filter(i => i >= 0);
        if (!open.length) return finish();
        E.confirm = true; draw();
      }
      function confirmScreen() {
        const open = E.ans.map((a, i) => a == null ? i : -1).filter(i => i >= 0);
        P.innerHTML = `<h2>Before you finish</h2>
          <p class="lead">You have not answered ${open.length === 1 ? 'question ' + (open[0] + 1) : open.length + ' questions: ' + open.map(j => j + 1).join(', ')}. Unanswered questions count as wrong.</p>
          <div class="hgrid">${open.map(j => `<button data-j="${j}" aria-label="Go to question ${j + 1}">${j + 1}</button>`).join('')}</div>
          <div class="row center hbtns"><button class="btn" data-a="goback">Go back to the questions</button><button class="btn warn" data-a="anyway">Finish anyway</button></div>`;
        $$('[data-j]', P).forEach(b => b.onclick = () => { E.confirm = false; E.i = +b.dataset.j; draw(); });
        $('[data-a="goback"]', P).onclick = () => { E.confirm = false; E.i = E.ans.findIndex(a => a == null); draw(); };
        $('[data-a="anyway"]', P).onclick = () => { E.confirm = false; finish(); };
      }
      function finish() {
        E.done = true;
        if (E.mode === 'end') E.qs.forEach((q, i) => { if (E.ans[i] == null) return; if (E.ans[i] === q.a) ctx.credit(); else ctx.slip(); });
        const score = E.ans.reduce((n, a, i) => n + (a === E.qs[i].a ? 1 : 0), 0);
        E.score = score; keep();
        const ms = new Set(st.missed || []); E.qs.forEach((q, i) => { if (E.ans[i] === q.a) ms.delete(q.id); else ms.add(q.id); });   // missed questions become a flashcard section
        st.missed = [...ms].slice(-150);
        st.examLast = { ids: E.qs.map(q => q.id), ans: E.ans.slice(), mode: E.mode, score };   // kept, so the results can be opened again after practicing a topic
        ctx.save();
        ctx.result(score, TOTAL);
        if (score >= PASS) ctx.sfx.win();
        results();
      }

      /* ---- results and review ---- */
      function results() {
        const score = E.score, pass = score >= PASS;
        const missed = E.qs.map((q, i) => i).filter(i => E.ans[i] !== E.qs[i].a);
        const rows = SUBS.map(s => {
          const idx = E.qs.map((q, i) => i).filter(i => E.qs[i].g.slice(0, 2) === s.id);
          const r = idx.filter(i => E.ans[i] === E.qs[i].a).length;
          return `<div class="hrow"><span class="hn">${esc(s.id)} ${esc(s.name)}</span><span class="hbar" aria-hidden="true"><i style="width:${idx.length ? r / idx.length * 100 : 0}%"></i></span><span class="hc">${r} of ${idx.length}</span>${r < idx.length ? `<button class="btn ghost small hprac" data-prac="${esc(s.id)}" aria-label="Practice ${esc(s.id)} ${esc(s.name)} with flashcards">Practice</button>` : ''}</div>`;
        }).join('');
        P.innerHTML = `<h2>Mock exam results</h2>
          <div class="hresult ${pass ? 'pass' : 'fail'}"><p class="hverdict">${pass ? 'You passed!' : 'Not yet'}</p><p class="hscore">${score} out of ${TOTAL}</p>
            <p class="lead">${pass ? 'You got at least ' + PASS + ' right (74%), which is the passing mark.' : 'You needed ' + PASS + ' right (74%) to pass. Look over the ones you missed, then try a new exam.'}</p></div>
          <div class="hsubs">${rows}</div>
          <div class="row center hbtns"><button class="btn" data-a="all">Review all answers</button>${missed.length ? `<button class="btn warn" data-a="missed">Review the ${missed.length} missed</button>` : ''}<button class="btn ghost" data-a="again">New exam</button></div>
          <div class="hreview" tabindex="-1"></div>`;
        const open = f => { const box = $('.hreview', P); box.innerHTML = reviewHtml(f); box.scrollIntoView({ block: 'start', behavior: 'smooth' }); box.focus({ preventScroll: true }); };
        $('[data-a="all"]', P).onclick = () => open('all');
        const m = $('[data-a="missed"]', P); if (m) m.onclick = () => open('missed');
        $('[data-a="again"]', P).onclick = setup;
        $$('[data-prac]', P).forEach(b => b.onclick = () => {   // open the flashcards at the first group of that topic
          const g = GROUPS.find(x => x.sub === b.dataset.prac); if (!g) return; st.cardSec = g.id; ctx.save();
          location.href = location.pathname + '?tool=cards';
        });
      }
      function reviewHtml(filter) {
        const items = E.qs.map((q, i) => ({ q, i, mine: E.ans[i] })).filter(x => filter === 'all' || x.mine !== x.q.a);
        return `<h3>${filter === 'all' ? 'All ' + TOTAL + ' answers' : items.length + ' missed'}</h3>` + items.map(({ q, i, mine }) => {
          const st = mine == null ? 'skipped' : mine === q.a ? 'right' : 'missed';
          const label = { right: 'Right', missed: 'Missed', skipped: 'Not answered' }[st];
          return `<article class="hrev ${st}"><header><b>Question ${i + 1}</b><span class="hint">${esc(gLabel(GRP[q.g]))}</span><span class="hbadge ${st}">${label}</span></header>
            <p class="hqt small">${esc(q.q)}</p>${fig(q)}
            <div class="hch">${q.c.map((c, j) => `<div class="${j === q.a ? 'rt' : ''}${j === mine ? ' mine' : ''}"><b>${L[j]}.</b> <span>${esc(c)}</span>${j === q.a ? ' <em>Correct answer</em>' : ''}${j === mine && j !== q.a ? ' <em>Your answer</em>' : ''}</div>`).join('')}</div>
            <p class="hx">${esc(q.x)}</p>${ruleLine(q)}</article>`;
        }).join('');
      }

      /* ---- keyboard: A to D (or 1 to 4) choose, N or the right arrow goes on, the left arrow goes back ---- */
      P.addEventListener('keydown', e => {
        if (!E || E.done || E.confirm || e.ctrlKey || e.metaKey || e.altKey || e.target.matches('input,textarea,select')) return;
        const k = e.key.toLowerCase(), idx = 'abcd'.indexOf(k) >= 0 && k.length === 1 ? 'abcd'.indexOf(k) : '1234'.indexOf(k);
        if (k.length === 1 && idx >= 0) { const b = $$('.hopt', P)[idx]; if (b && !b.disabled) { e.preventDefault(); b.click(); } }
        else if (k === 'n' || k === 'arrowright') { const nx = $('[data-a="next"]', P); if (nx && !nx.hidden) { e.preventDefault(); nx.click(); } }
        else if (k === 'arrowleft') { const bk = $('[data-a="back"]', P); if (bk && !bk.disabled) { e.preventDefault(); bk.click(); } }
      });
      setup();
    },
    leave() { SB.stopSpeech(); }
  };

  /* ===================== Quiz (practice by topic group) ===================== */
  /* Random 10, or Full: every question in the chosen group. Practice only; the Mock exam is the scored test. */
  const quizItem = q => ({ q: q.q, a: q.c[q.a], wrong: q.c.filter((_, i) => i !== q.a), why: q.x || ('The answer is: ' + q.c[q.a] + '.'), html: fig(q) });
  const quiz = {
    init(ctx) {
      const P = ctx.panel, st = ctx.state;
      P.innerHTML = `<div class="row hpick"><label class="hint" for="hq-grp">Questions from</label><select id="hq-grp" class="hsel"><option value="all">Every group (random)</option>${GROUPS.map(g => `<option value="${g.id}">${esc(gLabel(g))} (${Q.filter(q => q.g === g.id).length})</option>`).join('')}</select></div><div class="hq-body"></div>`;
      const sel = $('#hq-grp', P), body = $('.hq-body', P), sub = Object.create(ctx, { panel: { value: body } });
      function go() {
        const gid = sel.value; st.quizGroup = gid; ctx.save();
        const pool = gid === 'all' ? Q : Q.filter(q => q.g === gid);
        body.innerHTML = '';
        SBT.quiz(sub, { title: 'Quiz', lead: 'Pick the best answer. Practice only: the Mock exam is the scored test.', rounds: 10, fullLabel: 'Full', full: gid === 'all' ? null : () => pool.map(quizItem), build: () => SBT.shuffle(pool).slice(0, 10).map(quizItem) });
      }
      sel.value = GROUPS.some(g => g.id === st.quizGroup) ? st.quizGroup : 'all';
      sel.onchange = go; go();
    }
  };

  SBM.start({ module: 'ham-technician', defaults: { reveal: 'now' }, tools: { cards, quiz, exam } });
})();
