/* Marketing Cloud Engagement Developer: tools. Content is in data.js (window.SFMC).
   Study guide: the exam facts, then a tab per exam section (the guide's objectives and short notes with their sources).
   Flashcards: key terms by section. Sort it: four sorting sets.
   Practice: questions from one section (or all, or the ones missed), answered one at a time with the reason shown.
   Mock exam: 60 questions picked in the exam's section weights (dm 9, pl 21, api 13, dmg 13, sec 4), 105 minutes, 38 right (63%) to pass.
   Some questions have more than one right answer ("Choose 2"); they count only when every right choice and nothing else is picked.
   Choices are shown in a random order that is kept with the exam, so a resumed exam looks the same. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { shuffle } = SBT;
  const esc = SB.esc;
  const { EXAM, SECTIONS, GUIDE, CARDS, SORTS, SOURCES, Q } = window.SFMC;
  const SEC = Object.fromEntries(SECTIONS.map(s => [s.id, s]));
  const QBY = Object.fromEntries(Q.map(q => [q.id, q]));
  const L = 'ABCDE';
  const hook = (k, v) => { (window.__sfmcTest = window.__sfmcTest || {})[k] = v; return v; };   // lets the test read and pin the exam
  const need = q => q.a.length;
  const isRight = (q, ans) => Array.isArray(ans) && ans.length === q.a.length && q.a.every(i => ans.includes(i));
  const codeHtml = q => q.code ? `<pre class="scode"><code>${esc(q.code)}</code></pre>` : '';
  const srcHtml = k => SOURCES[k] ? `<a href="${esc(SOURCES[k][1])}" target="_blank" rel="noopener">${esc(SOURCES[k][0])}</a>` : '';
  const spoken = (q, perm) => q.q + (q.code ? ' (There is a code sample on the screen.)' : '') + ' ' + perm.map((ci, i) => L[i] + '. ' + q.c[ci] + '.').join(' ');
  const mmss = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const validAns = (a, q) => Array.isArray(a) && a.every(i => Number.isInteger(i) && i >= 0 && i < q.c.length) ? a : null;
  const validPerm = (p, q) => Array.isArray(p) && p.length === q.c.length && q.c.every((_, i) => p.includes(i)) ? p : shuffle(q.c.map((_, i) => i));

  /* ===================== Study guide ===================== */
  const guide = {
    init(ctx) {
      const P = ctx.panel;
      const TABS = [{ id: 'exam', title: 'The exam' }, ...SECTIONS.map(s => ({ id: s.id, title: s.name + ' (' + s.pct + '%)' }))];
      P.innerHTML = `<h2>Study guide</h2><p class="lead">Salesforce Certified Marketing Cloud Engagement Developer. The objectives are from Salesforce’s exam guide; the notes are short summaries with links to their sources.</p>
        <div class="seg gtabs" role="group" aria-label="Exam section">${TABS.map((t, i) => `<button type="button" data-g="${t.id}" aria-pressed="${i === 0}">${esc(t.title)}</button>`).join('')}</div><div class="gbody"></div>`;
      const body = $('.gbody', P);
      function show(id) {
        if (id === 'exam') {
          body.innerHTML = `<div class="gcols"><div><h3>The exam</h3><ul class="ideas">
              <li>${EXAM.questions} multiple-choice or multiple-select questions, plus up to ${EXAM.unscored} unscored ones.</li>
              <li>${EXAM.minutes} minutes.</li><li>Passing score: ${EXAM.passPct}% (${EXAM.pass} of ${EXAM.questions}).</li>
              <li>Multiple-select questions say how many to choose. You need every right choice.</li></ul>
              <p class="hint">Source: ${srcHtml('guide')}. Check the guide for the current fee and rules before you book.</p></div>
            <div><h3>The sections</h3><table class="ttable"><thead><tr><th scope="col">Section</th><th scope="col">Weight</th><th scope="col">Questions in the mock exam</th></tr></thead>
              <tbody>${SECTIONS.map(s => `<tr><th scope="row">${esc(s.name)}</th><td>${s.pct}%</td><td>${s.n}</td></tr>`).join('')}</tbody></table>
              <p class="hint">Every practice question in this module is original. None are copied from the real exam.</p></div></div>`;
          return;
        }
        const s = SEC[id], blocks = GUIDE[id];
        const subs = [{ k: 'obj', t: 'Objectives' }].concat(blocks.map((g, i) => ({ k: String(i), t: g.h })));
        body.innerHTML = `<h3>${esc(s.name)} <span class="sw">${s.pct}% of the exam</span></h3>
          <div class="seg stabs" role="group" aria-label="Topic">${subs.map((x, i) => `<button type="button" data-t="${x.k}" aria-pressed="${i === 0}">${esc(x.t)}</button>`).join('')}</div><div class="sbody"></div>`;
        const sb = $('.sbody', body);
        const part = k => {
          if (k === 'obj') { sb.innerHTML = `<div class="sobj"><div class="eyebrow">Objectives from the exam guide</div><ul class="ideas">${s.obj.map(o => `<li>${esc(o)}</li>`).join('')}</ul></div><p class="hint">Source: ${srcHtml('guide')}. Use the buttons above to read the notes for each topic.</p>`; return; }
          const g = blocks[+k];
          sb.innerHTML = `<section class="sblock"><h4>${esc(g.h)}</h4><ul class="ideas">${g.pts.map(p => `<li>${esc(p)}</li>`).join('')}</ul>${ctx.sayButton(g.h + '. ' + g.pts.join(' '), 'Hear these notes')}
            <p class="ssrc">Sources: ${g.src.map(srcHtml).join(' \u00b7 ')}</p></section>`;
        };
        $$('.stabs button', body).forEach(b => b.onclick = () => { $$('.stabs button', body).forEach(x => x.setAttribute('aria-pressed', x === b)); part(b.dataset.t); });
        part('obj');
      }
      $$('.gtabs button', P).forEach(b => b.onclick = () => { $$('.gtabs button', P).forEach(x => x.setAttribute('aria-pressed', x === b)); show(b.dataset.g); });
      show('exam');
    }
  };

  /* ===================== Flashcards (practice only) ===================== */
  const cards = {
    init(ctx) {
      const st = ctx.state;
      const list = [{ id: 'all', label: 'All sections (' + CARDS.length + ' cards)', noStep: true }].concat(SECTIONS.map(s => ({ id: s.id, label: s.name + ' (' + CARDS.filter(c => c[0] === s.id).length + ')' })));
      const card = ([s, f, b]) => ({
        front: `<div class="tag">${esc(SEC[s].name)}</div><div class="big sfront">${esc(f)}</div>`,
        back: `<div class="tag">${esc(f)}</div><div class="defline">${esc(b)}</div>${ctx.sayButton(f + '. ' + b, 'Hear it')}`,
        say: f
      });
      SBT.flashcards(ctx, {
        lead: 'Say the meaning before you flip the card. Cards you miss come back again. Practice only.',
        modes: [{ id: 'order', label: 'In order' }, { id: 'shuffle', label: 'Shuffled' }],
        sections: { list, start: list.some(x => x.id === st.cardSec) ? st.cardSec : 'all' },
        onSection: id => { st.cardSec = id; ctx.save(); },
        build: (mode, sec) => { const cs = CARDS.filter(c => sec === 'all' || c[0] === sec); return (mode === 'shuffle' ? shuffle(cs) : cs).map(card); }
      });
    }
  };

  /* ===================== Sort it ===================== */
  const sort = {
    init(ctx) {
      SBT.sort(ctx, {
        lead: 'Drag each card into the right group, or tap it and then tap a group.',
        sets: SORTS.map(s => ({ id: s.id, label: s.label, buckets: s.buckets.map(([id, name]) => ({ id, name })), items: s.items.map(([text, b]) => ({ text, b })) })),
        right: (it, b) => 'Yes! ' + b.name + '.'
      });
    }
  };

  /* ===================== The question runner (Practice and Mock exam) ===================== */
  /* R = { kind: 'practice'|'exam', ids, perm, ans, sel, i, mode: 'now'|'end', timed, start, done, confirm, quit, score } */
  function runner(ctx, P, opt) {
    const st = ctx.state;
    let R = null, timer = null;
    const QS = () => R.ids.map(id => QBY[id]);
    const total = () => R.ids.length;
    const scoreOf = () => QS().reduce((n, q, i) => n + (isRight(q, R.ans[i]) ? 1 : 0), 0);
    const left = () => R.start + EXAM.minutes * 60000 - Date.now();
    const keep = () => { opt.keep(R && !R.done ? { ids: R.ids, perm: R.perm, ans: R.ans, i: R.i, mode: R.mode, timed: R.timed, start: R.start } : null); };

    function begin(ids, mode, timed, saved) {
      const qs = ids.map(id => QBY[id]);
      R = { kind: opt.kind, ids, mode, timed: !!timed, start: saved && saved.start ? saved.start : Date.now(),
        perm: qs.map((q, i) => validPerm(saved && saved.perm && saved.perm[i], q)),
        ans: qs.map((q, i) => saved && saved.ans ? validAns(saved.ans[i], q) : null),
        sel: [], i: saved ? Math.min(ids.length - 1, Math.max(0, saved.i | 0)) : 0, done: false, confirm: false, quit: false };
      hook(opt.kind, () => R);
      clearInterval(timer);
      if (R.timed) timer = setInterval(tick, 1000);
      if (R.timed && left() <= 0) return finish(true);
      draw();
    }
    function tick() {
      if (!R || R.done || !R.timed) { clearInterval(timer); return; }
      const t = $('.stimer', P); if (t) { t.textContent = mmss(left()) + ' left'; t.classList.toggle('low', left() < 5 * 60000); }
      if (left() <= 0) { clearInterval(timer); finish(true); }
    }

    function draw() {
      SB.stopSpeech(); keep();
      if (R.confirm) return confirmScreen();
      const q = QS()[R.i], perm = R.perm[R.i], mine = R.ans[R.i], now = R.mode === 'now', locked = now && mine != null, multi = need(q) > 1;
      const picked = locked ? mine : now ? R.sel : (mine || []);
      const opts = perm.map((ci, k) => {
        let cls = '';
        if (locked) { if (q.a.includes(ci)) cls = ' right'; else if (mine.includes(ci)) cls = ' wrong'; }
        else if (picked.includes(ci)) cls = ' pick';
        const pressed = locked ? '' : ` aria-pressed="${picked.includes(ci)}"`;
        return `<button class="opt hopt${cls}${multi ? ' multi' : ''}" data-ci="${ci}"${locked ? ' disabled' : ''}${pressed}><span class="ol">${L[k]}</span><span class="ot">${esc(q.c[ci])}</span></button>`;
      }).join('');
      const last = R.i === total() - 1;
      const right = scoreOf();
      const grid = now ? '' : `<div class="hgrid" role="group" aria-label="Jump to a question">${R.ids.map((_, j) =>
        `<button data-j="${j}" class="${R.ans[j] && R.ans[j].length ? 'done' : ''}${j === R.i ? ' cur' : ''}" aria-label="Question ${j + 1}${R.ans[j] && R.ans[j].length ? ', answered' : ''}"${j === R.i ? ' aria-current="true"' : ''}>${j + 1}</button>`).join('')}</div>`;
      const checkBtn = now && multi && !locked ? `<button class="btn" data-a="check"${R.sel.length === need(q) ? '' : ' disabled'}>Check</button>` : '';
      P.innerHTML = `<div class="roundbar"><div class="bar" aria-hidden="true"><i style="width:${(R.i + (locked ? 1 : 0)) / total() * 100}%"></i></div>
          <span class="hint">Question ${R.i + 1} of ${total()}${now ? ' · Right ' + right : ''}</span>${R.timed ? `<span class="stimer" role="timer">${mmss(left())} left</span>` : ''}</div>
        <div class="hqwrap">
          <p class="hgl">${esc(SEC[q.s].name)}${multi ? ' · <b>Choose ' + need(q) + '</b>' : ''}</p>
          <div class="row hqrow"><p class="hqt" tabindex="-1" id="hqt">${esc(q.q)}</p>${ctx.sayButton(spoken(q, perm), 'Hear the question and choices')}</div>
          ${codeHtml(q)}
          <div class="hopts">${opts}</div>
          <div class="hreveal" aria-live="polite">${locked ? revealHtml(q, mine) : ''}</div>
        </div>
        <div class="row hnav">
          <button class="btn ghost" data-a="quit">${R.quit ? (R.kind === 'exam' ? 'Really stop the exam?' : 'Really stop?') : (R.kind === 'exam' ? 'Stop exam' : 'Stop')}</button>
          <span class="grow"></span>
          <button class="btn ghost" data-a="back"${R.i === 0 ? ' disabled' : ''}>Back</button>
          ${checkBtn}
          <button class="btn" data-a="next"${now && !locked ? ' hidden' : ''}>${last ? (now ? 'See results' : 'Finish exam') : 'Next question'}</button>
        </div>${grid}`;
      $$('.hopt', P).forEach(b => b.onclick = () => choose(+b.dataset.ci));
      $$('[data-j]', P).forEach(b => b.onclick = () => { R.i = +b.dataset.j; R.sel = []; draw(); });
      $('[data-a="next"]', P).onclick = () => { if (last) return now ? finish() : finishCheck(); R.i++; R.sel = []; R.quit = false; draw(); };
      const ck = $('[data-a="check"]', P); if (ck) ck.onclick = () => commit(R.sel.slice());
      const bk = $('[data-a="back"]', P); if (bk) bk.onclick = () => { R.i--; R.sel = []; draw(); };
      $('[data-a="quit"]', P).onclick = () => { if (R.quit) { clearInterval(timer); R = null; opt.keep(null); return opt.setup(); } R.quit = true; draw(); };
      const t = $('#hqt', P); if (t) t.focus({ preventScroll: true });
      if (!locked) ctx.say(spoken(q, perm));
    }

    function revealHtml(q, mine) {
      const ok = isRight(q, mine);
      const want = R.perm[R.i].map((ci, k) => q.a.includes(ci) ? L[k] + '. ' + q.c[ci] : null).filter(Boolean);
      return `<p class="hv">${ok ? '<b class="ok">Correct!</b>' : '<b class="no">Not quite.</b> The answer ' + (want.length > 1 ? 'is all of these: ' : 'is ') + '<b>' + want.map(esc).join('; ') + '</b>'}</p><p class="hx">${esc(q.x)}</p><p class="ssrc">Source: ${srcHtml(q.src)}</p>`;
    }

    function commit(ans) {
      const q = QS()[R.i];
      if (R.ans[R.i] != null) return;
      R.ans[R.i] = ans.sort((a, b) => a - b); R.sel = [];
      if (isRight(q, R.ans[R.i])) { ctx.credit(); ctx.sfx.good(); } else { ctx.slip(); ctx.sfx.bad(); }
      draw();
      const nx = $('[data-a="next"]', P); if (nx) nx.focus({ preventScroll: true });
    }
    function choose(ci) {
      const q = QS()[R.i], multi = need(q) > 1;
      if (R.mode === 'now') {
        if (R.ans[R.i] != null) return;
        if (!multi) return commit([ci]);
        R.sel = R.sel.includes(ci) ? R.sel.filter(x => x !== ci) : R.sel.concat(ci).slice(-need(q));   // keep at most the number asked for
        draw(); return;
      }
      if (!multi) R.ans[R.i] = [ci];
      else { const cur = R.ans[R.i] || []; const nx = cur.includes(ci) ? cur.filter(x => x !== ci) : cur.concat(ci).slice(-need(q)); R.ans[R.i] = nx.length ? nx.sort((a, b) => a - b) : null; }
      draw();
    }

    function finishCheck() {
      const open = R.ans.map((a, i) => a && a.length === need(QS()[i]) ? -1 : i).filter(i => i >= 0);
      if (!open.length) return finish();
      R.confirm = true; draw();
    }
    function confirmScreen() {
      const open = R.ans.map((a, i) => a && a.length === need(QS()[i]) ? -1 : i).filter(i => i >= 0);
      P.innerHTML = `<h2>Before you finish</h2>
        <p class="lead">${open.length === 1 ? 'Question ' + (open[0] + 1) + ' is' : open.length + ' questions are'} not fully answered: ${open.map(j => j + 1).join(', ')}. They count as wrong.</p>
        <div class="hgrid">${open.map(j => `<button data-j="${j}" aria-label="Go to question ${j + 1}">${j + 1}</button>`).join('')}</div>
        <div class="row center hbtns"><button class="btn" data-a="goback">Go back to the questions</button><button class="btn warn" data-a="anyway">Finish anyway</button></div>`;
      $$('[data-j]', P).forEach(b => b.onclick = () => { R.confirm = false; R.i = +b.dataset.j; draw(); });
      $('[data-a="goback"]', P).onclick = () => { R.confirm = false; R.i = open[0]; draw(); };
      $('[data-a="anyway"]', P).onclick = () => { R.confirm = false; finish(); };
    }
    function finish(timeUp) {
      clearInterval(timer);
      R.done = true; R.confirm = false; R.timeUp = !!timeUp;
      if (R.mode === 'end') QS().forEach((q, i) => { if (R.ans[i] == null) return; if (isRight(q, R.ans[i])) ctx.credit(); else ctx.slip(); });
      R.score = scoreOf(); keep();
      const ms = new Set(st.missed || []); QS().forEach((q, i) => { if (isRight(q, R.ans[i])) ms.delete(q.id); else ms.add(q.id); });
      st.missed = [...ms].filter(id => QBY[id]).slice(-200);
      opt.finished(R);
      ctx.save();
      results();
    }

    function results() {
      const qs = QS(), score = R.score, n = total(), exam = R.kind === 'exam', pass = exam && score >= EXAM.pass;
      const missed = qs.map((q, i) => i).filter(i => !isRight(qs[i], R.ans[i]));
      const rows = SECTIONS.map(s => {
        const idx = qs.map((q, i) => i).filter(i => qs[i].s === s.id); if (!idx.length) return '';
        const r = idx.filter(i => isRight(qs[i], R.ans[i])).length;
        return `<div class="hrow"><span class="hn">${esc(s.name)}</span><span class="hbar" aria-hidden="true"><i style="width:${r / idx.length * 100}%"></i></span><span class="hc">${r} of ${idx.length}</span><button class="btn ghost hprac" data-prac="${s.id}">Practice</button></div>`;
      }).join('');
      const verdict = exam ? (pass ? 'You passed!' : 'Not yet') : 'Practice done';
      const line = exam ? (pass ? `You got at least ${EXAM.pass} right (${EXAM.passPct}%), the passing score.` : `You needed ${EXAM.pass} right (${EXAM.passPct}%) to pass. Look over the ones you missed, practice those sections, then try a new exam.`)
        : `${Math.round(score / n * 100)}% right.`;
      P.innerHTML = `<h2>${exam ? 'Mock exam results' : 'Practice results'}</h2>
        <div class="hresult ${exam ? (pass ? 'pass' : 'fail') : ''}"><p class="hverdict">${verdict}</p><p class="hscore">${score} out of ${n}</p>
          ${R.timeUp ? '<p class="lead"><b>Time ran out.</b> Unanswered questions count as wrong.</p>' : ''}<p class="lead">${line}</p></div>
        <div class="hsubs">${rows}</div>
        <div class="row center hbtns"><button class="btn" data-a="all">Review all answers</button>${missed.length ? `<button class="btn warn" data-a="missed">Review the ${missed.length} missed</button>` : ''}<button class="btn ghost" data-a="again">${exam ? 'New exam' : 'Practice again'}</button></div>
        <div class="hreview" tabindex="-1"></div>`;
      const open = f => { const box = $('.hreview', P); box.innerHTML = reviewHtml(f); box.scrollIntoView({ block: 'start', behavior: 'smooth' }); box.focus({ preventScroll: true }); };
      $('[data-a="all"]', P).onclick = () => open('all');
      const m = $('[data-a="missed"]', P); if (m) m.onclick = () => open('missed');
      $('[data-a="again"]', P).onclick = () => { R = null; opt.setup(); };
      $$('[data-prac]', P).forEach(b => b.onclick = () => { st.pracSec = b.dataset.prac; ctx.save(); location.href = location.pathname + '?tool=quiz'; });
    }
    function reviewHtml(filter) {
      const qs = QS();
      const items = qs.map((q, i) => ({ q, i, mine: R.ans[i] })).filter(x => filter === 'all' || !isRight(x.q, x.mine));
      return `<h3>${filter === 'all' ? 'All ' + total() + ' answers' : items.length + ' missed'}</h3>` + items.map(({ q, i, mine }) => {
        const stt = !mine || !mine.length ? 'skipped' : isRight(q, mine) ? 'right' : 'missed';
        const label = { right: 'Right', missed: 'Missed', skipped: 'Not answered' }[stt];
        return `<article class="hrev ${stt}"><header><b>Question ${i + 1}</b><span class="hint">${esc(SEC[q.s].name)}</span><span class="hbadge ${stt}">${label}</span></header>
          <p class="hqt small">${esc(q.q)}${need(q) > 1 ? ' (Choose ' + need(q) + '.)' : ''}</p>${codeHtml(q)}
          <div class="hch">${R.perm[i].map((ci, k) => { const rt = q.a.includes(ci), me = mine && mine.includes(ci);
            return `<div class="${rt ? 'rt' : ''}${me ? ' mine' : ''}"><b>${L[k]}.</b> <span>${esc(q.c[ci])}</span>${rt ? ' <em>Correct answer</em>' : ''}${me && !rt ? ' <em>Your answer</em>' : ''}</div>`; }).join('')}</div>
          <p class="hx">${esc(q.x)}</p><p class="ssrc">Source: ${srcHtml(q.src)}</p></article>`;
      }).join('');
    }

    /* keyboard: A to E (or 1 to 5) choose, N or the right arrow goes on, the left arrow goes back */
    P.addEventListener('keydown', e => {
      if (!R || R.done || R.confirm || e.ctrlKey || e.metaKey || e.altKey || e.target.matches('input,textarea,select')) return;
      const k = e.key.toLowerCase(), idx = k.length === 1 ? ('abcde'.indexOf(k) >= 0 ? 'abcde'.indexOf(k) : '12345'.indexOf(k)) : -1;
      if (idx >= 0) { const b = $$('.hopt', P)[idx]; if (b && !b.disabled) { e.preventDefault(); b.click(); } }
      else if (k === 'n' || k === 'arrowright') { const nx = $('[data-a="next"]', P); if (nx && !nx.hidden) { e.preventDefault(); nx.click(); } }
      else if (k === 'arrowleft') { const bk = $('[data-a="back"]', P); if (bk && !bk.disabled) { e.preventDefault(); bk.click(); } }
    });
    return { begin, results: saved => { R = saved; results(); }, stop: () => clearInterval(timer), get: () => R };
  }

  /* ===================== Practice ===================== */
  const quiz = {
    init(ctx) {
      const P = ctx.panel, st = ctx.state;
      const run = runner(ctx, P, { kind: 'practice', keep: () => {}, setup, finished: R => ctx.result(R.score, R.ids.length) });
      function setup() {
        SB.stopSpeech();
        const missed = (st.missed || []).filter(id => QBY[id]);
        const opts = [['all', 'Every section (' + Q.length + ')']].concat(SECTIONS.map(s => [s.id, s.name + ' (' + Q.filter(q => q.s === s.id).length + ')']), missed.length ? [['missed', 'Questions you missed (' + missed.length + ')']] : []);
        const sec = opts.some(o => o[0] === st.pracSec) ? st.pracSec : 'all';
        P.innerHTML = `<h2>Practice</h2><p class="lead">Answer one question at a time and see why right away. Practice by section, then take the Mock exam.</p>
          <div class="row hpick"><label class="hlab" for="sp-sec">Questions from</label><select id="sp-sec" class="hsel">${opts.map(([v, t]) => `<option value="${v}"${v === sec ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></div>
          <div class="hset"><span class="hlab" id="sp-nlab">How many</span><div class="seg" role="group" aria-labelledby="sp-nlab"><button data-n="10" aria-pressed="${st.pracN !== 'all'}">10 at random</button><button data-n="all" aria-pressed="${st.pracN === 'all'}">All of them</button></div></div>
          <div class="row center"><button class="btn" data-a="start">Start practice</button></div>`;
        $('#sp-sec', P).onchange = e => { st.pracSec = e.target.value; ctx.save(); };
        $$('[data-n]', P).forEach(b => b.onclick = () => { st.pracN = b.dataset.n; ctx.save(); $$('[data-n]', P).forEach(x => x.setAttribute('aria-pressed', x === b)); });
        $('[data-a="start"]', P).onclick = () => {
          const v = $('#sp-sec', P).value; st.pracSec = v; ctx.save();
          const pool = Q.filter(q => v === 'all' || (v === 'missed' ? missed.includes(q.id) : q.s === v)).map(q => q.id);
          const ids = st.pracN === 'all' ? shuffle(pool) : shuffle(pool).slice(0, 10);
          run.begin(ids, 'now', false);
        };
      }
      setup();
    },
    leave() { SB.stopSpeech(); }
  };

  /* ===================== Mock exam ===================== */
  const exam = {
    init(ctx) {
      const P = ctx.panel, st = ctx.state;
      if (st.reveal !== 'end') st.reveal = 'now';
      if (st.timed !== false) st.timed = true;
      const run = runner(ctx, P, { kind: 'exam', setup,
        keep: v => { st.examNow = v; ctx.save(); },
        finished: R => { st.examLast = { ids: R.ids, perm: R.perm, ans: R.ans, mode: R.mode, score: R.score, timeUp: R.timeUp }; ctx.result(R.score, R.ids.length); if (R.score >= EXAM.pass) ctx.sfx.win(); } });
      const pick = () => {
        const force = (window.__sfmcTest || {}).force;                                       // the test can pin the exam's questions
        if (Array.isArray(force) && force.length) return force.slice();
        return shuffle(SECTIONS.flatMap(s => shuffle(Q.filter(q => q.s === s.id)).slice(0, s.n).map(q => q.id)));
      };
      function setup() {
        SB.stopSpeech();
        const NOTE = { now: 'You see right away whether you were right, with the reason, then go on.', end: 'Answer everything, change any answer you like, then check it all at the end, like the real exam.' };
        P.innerHTML = `<h2>Mock exam</h2>
          <p class="lead">${EXAM.questions} questions in the real exam’s section weights. You need ${EXAM.pass} right (${EXAM.passPct}%) to pass. Questions marked “Choose 2” count only when both right choices are picked.</p>
          <div class="hset"><span class="hlab" id="srevlab">Show the answer</span><div class="seg" role="group" aria-labelledby="srevlab"><button data-r="now" aria-pressed="${st.reveal === 'now'}">After each question</button><button data-r="end" aria-pressed="${st.reveal === 'end'}">At the end</button></div></div>
          <div class="hset"><span class="hlab" id="stimlab">Timer</span><div class="seg" role="group" aria-labelledby="stimlab"><button data-t="on" aria-pressed="${st.timed}">${EXAM.minutes} minutes</button><button data-t="off" aria-pressed="${!st.timed}">No timer</button></div></div>
          <p class="hint hnote" aria-live="polite">${NOTE[st.reveal]}</p>
          <div class="row center"><button class="btn" data-a="start">Start the exam</button></div>`;
        $$('[data-r]', P).forEach(b => b.onclick = () => { st.reveal = b.dataset.r; ctx.save(); $$('[data-r]', P).forEach(x => x.setAttribute('aria-pressed', x === b)); $('.hnote', P).textContent = NOTE[st.reveal]; });
        $$('[data-t]', P).forEach(b => b.onclick = () => { st.timed = b.dataset.t === 'on'; ctx.save(); $$('[data-t]', P).forEach(x => x.setAttribute('aria-pressed', x === b)); });
        $('[data-a="start"]', P).onclick = () => run.begin(pick(), st.reveal, st.timed);
        const ok = v => v && Array.isArray(v.ids) && v.ids.length && v.ids.every(id => QBY[id]) && Array.isArray(v.ans);
        const lx = st.examLast;
        if (ok(lx)) {
          $('.row.center', P).insertAdjacentHTML('beforeend', '<button class="btn ghost" data-a="last">See your last results</button>');
          $('[data-a="last"]', P).onclick = () => {
            const qs = lx.ids.map(id => QBY[id]);
            const R = { kind: 'exam', ids: lx.ids, perm: qs.map((q, i) => validPerm(lx.perm && lx.perm[i], q)), ans: qs.map((q, i) => validAns(lx.ans[i], q)), mode: lx.mode, done: true, timeUp: !!lx.timeUp, i: 0 };
            R.score = qs.reduce((n, q, i) => n + (isRight(q, R.ans[i]) ? 1 : 0), 0);
            run.results(R);
          };
        }
        const sv = st.examNow;                                                                 // an exam left unfinished: offer to carry on
        if (ok(sv)) {
          const n = sv.ans.filter(a => a && a.length).length;
          $('.row.center', P).insertAdjacentHTML('afterbegin', `<button class="btn good" data-a="resume">Carry on with your exam (${n} of ${sv.ids.length} answered)</button>`);
          const s = $('[data-a="start"]', P); s.textContent = 'Start a new exam'; s.classList.add('ghost');
          $('[data-a="resume"]', P).onclick = () => run.begin(sv.ids, sv.mode === 'end' ? 'end' : 'now', sv.timed, sv);
        }
      }
      setup();
      this._run = run;
    },
    leave() { SB.stopSpeech(); }
  };

  SBM.start({ module: 'sfmc-developer', defaults: { reveal: 'now', timed: true }, tools: { guide, cards, sort, quiz, exam } });
})();
