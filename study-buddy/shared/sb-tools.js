/* Study Buddy shared tools: ready-made activities that any module can fill with its own content.
   Each builder takes the ctx that SBM.start passes to a tool's init(ctx), plus content and options.

     SBT.flashcards(ctx, { lead, modes: [{ id, label }], build(modeId) -> [{ front, back, say }] })
         front/back are HTML; say is spoken when the card shows (only if Read aloud is on).
         Result: cards known on the first try out of the deck size.

     SBT.sort(ctx, { lead, sets: [{ id, label, buckets: [{ id, name, html? }], items: [{ text, b }], perBucket? }],
                     right?(item, bucket), wrong?(item, bucket) })
         Drag (or tap, then tap) each item into its bucket. Result: items minus misses, out of items.

     SBT.quiz(ctx, { lead, rounds, build() -> [{ q, a, wrong: [..], why? }] })
         Multiple choice, one round of `rounds` questions. Result: right answers out of rounds.
         Optional onAnswer(question, right) is called after each question. Optional skip: true adds a "Skip, review later" button
         (shows the answer, no point, calls onAnswer(question, false)).

     SBT.answer(ctx, { lead, rounds, build() -> [{ q, a, show?, why?, hint?, say? }], kind: 'number'|'text', typo?, skip?, onAnswer? })
         Type the answer. q is HTML. a is a number (kind 'number') or a list of accepted strings. Two tries, a hint,
         and the explanation (why) after each question. Result: first-try answers without a hint, out of rounds.
         Optional onAnswer(item, scoredFirstTry) is called when each question ends. Optional skip: true adds a "Skip, review later" button
         (shows the answer, no point, calls onAnswer(item, false)).

     SBT.order(ctx, { lead, sets: [{ id, label, items: [{ text, sub? }], pick? }] })
         Put the items in order (drag, or the arrow buttons). items are listed in the right order.
         Result: items in the right place on the first check, out of items.

     SBT.explain(ctx, { items: [{ q, model, ideas: [{ label, all: [[words..]..] }], teacher? }], keepFirst? })
         Write an answer in complete sentences. Each idea is found when one word from every group appears.
         Result: questions answered with every idea and complete sentences on the first check.

   They use the shared classes in sb.css, so they look the same in every module. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = s => SB.esc(s);
  const setMsg = (el, text, kind = '') => { el.className = 'msg' + (kind ? ' ' + kind : ''); el.textContent = text; };
  const starsHTML = (s, n) => { const k = s / n >= 0.9 ? 3 : s / n >= 0.7 ? 2 : s / n >= 0.5 ? 1 : 0; return `<div class="stars">${[0, 1, 2].map(i => `<span class="${i < k ? '' : 'off'}">&#9733;</span>`).join('')}</div>`; };
  const FLIP_MS = 520;

  /* ---------------- Flashcards ---------------- */
  function flashcards(ctx, opt) {
    const P = ctx.panel, modes = opt.modes || [{ id: 'all', label: 'All' }];
    const FC = { mode: modes[0].id, queue: [], cur: null, missed: new Set(), total: 0, flipped: false, busy: false };
    P.innerHTML = `<h2>${esc(opt.title || 'Flashcards')}</h2><p class="lead">${esc(opt.lead || 'Tap the card to flip it. Be honest: did you know it? Cards you miss come back again.')}<span class="swipe-tip"> Swipe right if you knew it, left if you are still learning.</span></p>
      <div class="deckbar">${modes.length > 1 ? `<div class="seg" role="group" aria-label="Card type">${modes.map((m, i) => `<button data-m="${esc(m.id)}" aria-pressed="${i === 0}">${esc(m.label)}</button>`).join('')}</div>` : ''}
        <div class="bar" aria-hidden="true"><i></i></div><span class="hint count"></span></div>
      <div class="cardstage"><div class="fcard" role="button" tabindex="0" aria-label="Flashcard. Press to flip"><div class="face front"></div><div class="face back"></div></div></div>
      <div class="row center cardbtns"><button class="btn warn" data-a="again">Still learning</button><button class="btn ghost" data-a="skip">Skip</button><button class="btn good" data-a="knew">I knew it</button></div>`;
    const card = $('.fcard', P), F = $('.front', P), B = $('.back', P);
    const flip = on => { FC.flipped = on; card.classList.toggle('flip', on); };
    const bar = () => { const done = FC.total - FC.queue.length; $('.bar i', P).style.width = (FC.total ? done / FC.total * 100 : 0) + '%'; $('.count', P).textContent = done + ' of ' + FC.total + ' done'; };
    function build() { FC.missed = new Set(); FC.busy = false; FC.queue = opt.build(FC.mode); FC.total = FC.queue.length; next(); }
    function next() {
      SB.stopSpeech(); flip(false);
      if (!FC.queue.length) {
        F.innerHTML = `<div class="tag">Deck complete</div><div class="big">Great work!</div><div class="small">You went through all ${FC.total} cards. Press a button to go again.</div>`;
        B.innerHTML = ''; FC.cur = null; ctx.sfx.win(); bar(); return;
      }
      const c = FC.cur = FC.queue[0];
      F.innerHTML = c.front; B.innerHTML = c.back; if (c.say) ctx.say(c.say); bar();
    }
    const afterUnflip = fn => { if (FC.busy) return; if (!FC.flipped) return fn(); FC.busy = true; flip(false); setTimeout(() => { FC.busy = false; fn(); }, FLIP_MS); };
    const doFlip = () => { if (!FC.cur || FC.busy) return; flip(!FC.flipped); SB.stopSpeech(); };
    card.addEventListener('click', doFlip);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doFlip(); } });
    $('[data-a="knew"]', P).onclick = () => { if (!FC.cur) return build(); afterUnflip(() => { FC.queue.shift(); ctx.sfx.good(); next(); }); };
    $('[data-a="again"]', P).onclick = () => { if (!FC.cur) return build(); afterUnflip(() => { const c = FC.queue.shift(); FC.missed.add(c); FC.queue.splice(Math.min(FC.queue.length, 3 + Math.floor(Math.random() * 3)), 0, c); ctx.sfx.bad(); next(); }); };
    $('[data-a="skip"]', P).onclick = () => { if (!FC.cur) return build(); afterUnflip(() => { FC.queue.push(FC.queue.shift()); next(); }); };
    SB.swipeCard($('.cardstage', P), card, { onRight: () => $('[data-a="knew"]', P).click(), onLeft: () => $('[data-a="again"]', P).click() });
    $$('.seg button', P).forEach(b => b.onclick = () => { FC.mode = b.dataset.m; $$('.seg button', P).forEach(x => x.setAttribute('aria-pressed', x === b)); build(); });
    build();
  }

  /* ---------------- Sort it ---------------- */
  function sort(ctx, opt) {
    const P = ctx.panel, sets = opt.sets, S = { set: sets[0], sel: null, miss: 0, placed: 0, total: 0 };
    P.classList.add('sbt-sort');
    const right = opt.right || ((it, b) => 'Yes! That goes with ' + b.name + '.');
    const wrong = opt.wrong || (() => 'Not quite. Try another group.');
    P.innerHTML = `<h2>${esc(opt.title || 'Sort it')}</h2><p class="lead">${esc(opt.lead || 'Drag each one into its group, or tap it and then tap a group.')}</p>
      <div class="scorebar"><div class="stat"><b class="placed">0</b><span>Sorted</span></div><div class="stat"><b class="miss">0</b><span>Misses</span></div>
        ${sets.length > 1 ? `<div class="seg" role="group" aria-label="What to sort">${sets.map((s, i) => `<button data-s="${esc(s.id)}" aria-pressed="${i === 0}">${esc(s.label)}</button>`).join('')}</div>` : ''}</div>
      <div class="tray sortTray"></div><p class="msg">Pick one to begin.</p>
      <div class="buckets"></div>
      <div class="row" style="margin-top:14px"><button class="btn warn" data-a="restart">Start over</button></div>`;
    const msg = $('.msg', P), tray = $('.sortTray', P), bucketsEl = $('.buckets', P);
    const bucketOf = id => S.set.buckets.find(b => b.id === id);
    const score = () => { $('.placed', P).textContent = S.placed + '/' + S.total; $('.miss', P).textContent = S.miss; };
    function select(chip) {
      S.sel = S.sel === chip ? null : chip;
      $$('.chip', tray).forEach(c => c.classList.toggle('sel', c === S.sel));
      $$('.bucket', P).forEach(b => b.classList.toggle('ready', !!S.sel));
      if (S.sel) { setMsg(msg, 'Now tap the group for "' + S.sel.textContent + '".'); ctx.say(S.sel.textContent); }
    }
    function tryPlace(chip, bid) {
      if (!chip) return;
      const item = chip._item, b = bucketOf(bid);
      if (item.b === bid) {
        const got = $(`.bucket[data-b="${bid}"] .got`, P), s = document.createElement('span');
        if (b.style) s.style.cssText = b.style;
        s.textContent = item.text; got.appendChild(s);
        chip.remove(); S.sel = null; $$('.bucket', P).forEach(x => x.classList.remove('ready'));
        S.placed++; ctx.credit(); ctx.sfx.good(); setMsg(msg, right(item, b), 'good'); score();
        if (S.placed === S.total) {
          ctx.result(Math.max(0, S.total - S.miss), S.total); ctx.sfx.win();
          setMsg(msg, S.miss === 0 ? 'Perfect! All ' + S.total + ' sorted with no misses.' : 'Done! All ' + S.total + ' sorted with ' + S.miss + ' miss' + (S.miss === 1 ? '' : 'es') + '.', 'good');
        }
      } else {
        S.miss++; ctx.slip(); ctx.sfx.bad(); score();
        chip.classList.remove('shake'); void chip.offsetWidth; chip.classList.add('shake');
        setMsg(msg, wrong(item, b), 'bad');
      }
    }
    function pointerDown(e, chip) {
      if (e.button !== undefined && e.button > 0) return;
      const sx = e.clientX, sy = e.clientY; let ghost = null, moved = false;
      try { chip.setPointerCapture(e.pointerId); } catch (er) {}
      const over = (x, y) => { const t = document.elementFromPoint(x, y); return t && t.closest && t.closest('.bucket'); };
      const mv = ev => {
        if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) { moved = true; ghost = document.createElement('div'); ghost.className = 'ghostchip'; ghost.textContent = chip.textContent; document.body.appendChild(ghost); chip.style.opacity = .4; }
        if (ghost) { ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; const b = over(ev.clientX, ev.clientY); $$('.bucket', P).forEach(x => x.classList.toggle('over', x === b)); }
      };
      const up = ev => {
        chip.removeEventListener('pointermove', mv); chip.removeEventListener('pointerup', up); chip.removeEventListener('pointercancel', up);
        $$('.bucket', P).forEach(x => x.classList.remove('over')); chip.style.opacity = '';
        if (moved) { ghost.remove(); const b = over(ev.clientX, ev.clientY); if (b && ev.type === 'pointerup') tryPlace(chip, b.dataset.b); else setMsg(msg, 'Drop it right on a group.'); }
        else select(chip);
      };
      chip.addEventListener('pointermove', mv); chip.addEventListener('pointerup', up); chip.addEventListener('pointercancel', up);
    }
    function round() {
      const set = S.set; S.sel = null; S.miss = 0; S.placed = 0; tray.innerHTML = '';
      bucketsEl.style.gridTemplateColumns = `repeat(${set.buckets.length},minmax(0,1fr))`;
      bucketsEl.innerHTML = set.buckets.map(b => `<div class="bucket" data-b="${esc(b.id)}" role="button" tabindex="0" aria-label="${esc(b.name)} group">${b.html || `<span class="bname">${esc(b.name)}</span>`}<div class="got"></div></div>`).join('');
      $$('.bucket', P).forEach(bk => {
        bk.addEventListener('click', () => { if (S.sel) tryPlace(S.sel, bk.dataset.b); });
        bk.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && S.sel) { e.preventDefault(); tryPlace(S.sel, bk.dataset.b); } });
      });
      const items = shuffle(set.buckets.flatMap(b => { const mine = shuffle(set.items.filter(it => it.b === b.id)); return set.perBucket ? mine.slice(0, set.perBucket) : mine; }));
      S.total = items.length;
      items.forEach(it => {
        const c = document.createElement('button'); c.className = 'chip'; c.type = 'button'; c.textContent = it.text; c._item = it; c.dataset.b = it.b;
        c.addEventListener('pointerdown', e => pointerDown(e, c));
        c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(c); } });
        tray.appendChild(c);
      });
      setMsg(msg, 'Pick one to begin.'); score();
    }
    $$('.seg button', P).forEach(b => b.onclick = () => { S.set = sets.find(s => s.id === b.dataset.s); $$('.seg button', P).forEach(x => x.setAttribute('aria-pressed', x === b)); round(); });
    $('[data-a="restart"]', P).onclick = round;
    round();
  }

  /* ---------------- Multiple-choice quiz ---------------- */
  function quiz(ctx, opt) {
    const P = ctx.panel, n = opt.rounds || 10, Q = { qs: [], i: 0, score: 0, answered: false };
    function start() { Q.qs = (opt.keepOrder ? opt.build() : shuffle(opt.build())).slice(0, n); Q.i = 0; Q.score = 0; show(); }
    function show() {
      if (Q.i >= Q.qs.length) {
        ctx.result(Q.score, Q.qs.length); ctx.sfx.win();
        P.innerHTML = `<h2>${esc(opt.title || 'Quiz')}</h2><div class="result">${starsHTML(Q.score, Q.qs.length)}<p class="prompt">${Q.score} out of ${Q.qs.length}</p><p class="lead">${Q.score / Q.qs.length >= 0.9 ? 'Amazing! You really know this.' : Q.score / Q.qs.length >= 0.7 ? 'Great job. A little more practice and you will have it.' : 'Good start. Try the flashcards, then come back.'}</p><button class="btn" data-a="again">Play again</button></div>`;
        $('[data-a="again"]', P).onclick = start; return;
      }
      const q = Q.qs[Q.i], opts = shuffle([q.a, ...q.wrong.slice(0, 3)]); Q.answered = false;
      P.innerHTML = `<h2>${esc(opt.title || 'Quiz')}</h2><p class="lead">${esc(opt.lead || 'Pick the best answer.')}</p>
        <div class="roundbar"><div class="bar" aria-hidden="true"><i style="width:${Q.i / Q.qs.length * 100}%"></i></div><span class="hint">Question ${Q.i + 1} of ${Q.qs.length} &middot; Score ${Q.score}</span></div>
        <div class="qwrap"><div class="row qrow"><p class="qtext">${esc(q.q)}</p>${ctx.sayButton(q.q, 'Hear the question')}</div>
        <div class="opts">${opts.map(o => `<button class="opt" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>
        <p class="explain"></p><div class="row center">${opt.skip ? '<button class="btn ghost" data-a="skip">Skip, review later</button>' : ''}<button class="btn" data-a="next" hidden>${Q.i === Q.qs.length - 1 ? 'See results' : 'Next question'}</button></div></div>`;
      $$('.opt', P).forEach(b => b.onclick = () => {
        if (Q.answered) return; Q.answered = true;
        const skb = $('[data-a="skip"]', P); if (skb) skb.hidden = true;
        const ok = b.dataset.v === q.a;
        $$('.opt', P).forEach(x => { x.disabled = true; if (x.dataset.v === q.a) x.classList.add('right'); });
        if (ok) { Q.score++; ctx.credit(); ctx.sfx.good(); } else { b.classList.add('wrong'); ctx.slip(); ctx.sfx.bad(); }
        if (opt.onAnswer) opt.onAnswer(q, ok);
        $('.explain', P).innerHTML = (ok ? '<b style="color:var(--good)">Correct!</b> ' : '<b style="color:var(--bad)">Not quite.</b> ') + esc(q.why || ('The answer is: ' + q.a + '.'));
        const nx = $('[data-a="next"]', P); nx.hidden = false; nx.focus();
      });
      const sk = $('[data-a="skip"]', P);
      if (sk) sk.onclick = () => {                              // not sure? show the answer, mark it for review, and move on (no point, no streak change)
        if (Q.answered) return; Q.answered = true; sk.hidden = true;
        $$('.opt', P).forEach(x => { x.disabled = true; if (x.dataset.v === q.a) x.classList.add('right'); });
        if (opt.onAnswer) opt.onAnswer(q, false);
        $('.explain', P).innerHTML = '<b>Marked for review.</b> ' + esc(q.why || ('The answer is: ' + q.a + '.'));
        const nx = $('[data-a="next"]', P); nx.hidden = false; nx.focus();
      };
      $('[data-a="next"]', P).onclick = () => { Q.i++; show(); };
      ctx.say(q.q);
    }
    start();
  }

  /* ---------------- Type the answer ---------------- */
  const numNorm = s => String(s).replace(/[,\s]/g, '').replace(/^\+/, '').replace(/^\./, '0.').replace(/−/g, '-');
  const txtNorm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/^(the|a|an)\s+/, '').replace(/[^a-z0-9]/g, '');
  function editDist(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  function answer(ctx, opt) {
    const P = ctx.panel, n = opt.rounds || 10, kind = opt.kind || 'text', R = { list: [], i: 0, score: 0, tries: 0, hinted: false };
    const check = (item, v) => {
      if (kind === 'number') { const x = numNorm(v); if (!/^-?\d*\.?\d+$/.test(x)) return 'bad'; return Math.abs(parseFloat(x) - Number(item.a)) < 1e-9 ? 'ok' : 'no'; }
      const t = txtNorm(v), list = [].concat(item.a);
      if (opt.exactCase) { const tv = String(v).trim(); if (list.includes(tv)) return 'ok'; if (list.some(a => String(a).toLowerCase() === tv.toLowerCase())) return 'case'; return 'no'; }
      if (list.some(a => txtNorm(a) === t)) return 'ok';
      if (opt.typo && !item.noTypo && list.some(a => txtNorm(a).length >= 5 && editDist(txtNorm(a), t) <= 1)) return 'close';
      return 'no';
    };
    const shown = item => item.show || (kind === 'number' ? Number(item.a).toLocaleString('en-US', { maximumFractionDigits: 10 }) : [].concat(item.a)[0]);
    function start() { R.list = opt.build().slice(0, n); R.i = 0; R.score = 0; show(); }
    function show() {
      if (R.i >= R.list.length) {
        ctx.result(R.score, R.list.length); ctx.sfx.win();
        P.innerHTML = `<h2>${esc(opt.title || 'Type the answer')}</h2><div class="result">${starsHTML(R.score, R.list.length)}<p class="prompt">${R.score} out of ${R.list.length}</p><p class="lead">${R.score / R.list.length >= 0.8 ? 'Excellent work!' : 'Good practice. Read the explanations, then try another round.'}</p><button class="btn" data-a="again">Play again</button></div>`;
        $('[data-a="again"]', P).onclick = start; return;
      }
      const item = R.list[R.i]; R.tries = 0; R.hinted = false;
      P.innerHTML = `<h2>${esc(opt.title || 'Type the answer')}</h2><p class="lead">${esc(opt.lead || 'Type your answer, then press Check.')}</p>
        <div class="roundbar"><div class="bar" aria-hidden="true"><i style="width:${R.i / R.list.length * 100}%"></i></div><span class="hint">Question ${R.i + 1} of ${R.list.length} &middot; Score ${R.score}</span></div>
        <div class="row qrow"><p class="qtext">${item.q}</p>${item.say ? ctx.sayButton(item.say, 'Hear it') : ''}</div>
        <form class="spellrow" autocomplete="off"><input aria-label="Your answer" placeholder="Answer" ${kind === 'number' ? 'inputmode="decimal"' : 'autocapitalize="off"'} spellcheck="false"><button class="btn" type="submit">Check</button></form>
        <div class="err" role="alert"></div><p class="explain why"></p>
        <div class="row center">${item.hint ? '<button type="button" class="btn ghost" data-a="hint">Hint</button>' : ''}${opt.skip ? '<button type="button" class="btn ghost" data-a="skip">Skip, review later</button>' : ''}<button type="button" class="btn" data-a="next" hidden>${R.i === R.list.length - 1 ? 'See results' : 'Next'}</button></div>`;
      const inp = $('input', P), err = $('.err', P), why = $('.why', P), next = $('[data-a="next"]', P), hb = $('[data-a="hint"]', P);
      inp.focus();
      const sk = $('[data-a="skip"]', P);
      const done = pt => { inp.disabled = true; $('form button', P).disabled = true; if (hb) hb.hidden = true; if (sk) sk.hidden = true; next.hidden = false; next.focus(); if (item.why) why.textContent = item.why; if (opt.onAnswer) opt.onAnswer(item, !!pt); };
      inp.oninput = () => { inp.classList.remove('bad'); err.textContent = ''; };
      if (hb) hb.onclick = () => { R.hinted = true; err.style.color = 'var(--ink2)'; err.textContent = item.hint; inp.focus(); };
      $('form', P).onsubmit = e => {
        e.preventDefault();
        const v = inp.value.trim();
        if (!v) { inp.classList.add('bad'); err.style.color = ''; err.textContent = 'Type an answer first.'; return; }
        const r = check(item, v);
        if (r === 'bad') { inp.classList.add('bad'); err.style.color = ''; err.textContent = 'Type a number, like 4,000 or 2.5.'; return; }
        if (r === 'case') { inp.classList.add('bad'); err.style.color = ''; err.textContent = 'Almost! Check the capital and small letters, then try again.'; return; }
        if (r === 'ok' || r === 'close') {
          const pt = !R.hinted && R.tries === 0; if (pt) R.score++;
          ctx.credit(); ctx.sfx.good(); err.style.color = 'var(--good-ink)';
          err.textContent = (r === 'close' ? 'Close enough! It is spelled ' + shown(item) + '.' : 'Correct! ' + shown(item) + '.') + (R.hinted ? ' (Hint used, so no point.)' : '');
          done(pt);
        } else {
          R.tries++; ctx.slip(); ctx.sfx.bad(); inp.classList.add('bad'); err.style.color = '';
          if (R.tries >= 2) { err.textContent = 'The answer is ' + shown(item) + '.'; done(false); }
          else err.textContent = 'Not quite. Try again.';
        }
      };
      if (sk) sk.onclick = () => {                              // not sure? show the answer, mark it for review, and move on (no point, no streak change)
        err.style.color = 'var(--ink2)'; err.textContent = 'Marked for review. The answer is ' + shown(item) + '.'; done(false);
      };
      next.onclick = () => { R.i++; show(); };
      if (item.say) ctx.say(item.say);
    }
    start();
  }

  /* ---------------- Put in order ---------------- */
  function order(ctx, opt) {
    const P = ctx.panel, sets = opt.sets, O = { set: sets[0], items: [], checked: false };
    P.innerHTML = `<h2>${esc(opt.title || 'Put in order')}</h2><p class="lead">${esc(opt.lead || 'Drag the cards into the right order, or use the arrows. Then press Check.')}</p>
      ${sets.length > 1 ? `<div class="seg" role="group" aria-label="What to order">${sets.map((s, i) => `<button data-s="${esc(s.id)}" aria-pressed="${i === 0}">${esc(s.label)}</button>`).join('')}</div>` : ''}
      <ol class="olist"></ol><p class="msg"></p>
      <div class="row"><button class="btn" data-a="check">Check order</button><button class="btn ghost" data-a="new">New order</button></div>`;
    const list = $('.olist', P), msg = $('.msg', P);
    function round() {
      const s = O.set, pool = s.pick ? s.items.map((it, k) => ({ ...it, k })).filter((_, k, a) => true) : s.items.map((it, k) => ({ ...it, k }));
      let chosen = pool;
      if (s.pick && pool.length > s.pick) { const idx = shuffle(pool.map((_, k) => k)).slice(0, s.pick).sort((a, b) => a - b); chosen = idx.map(k => pool[k]); }
      let sh; do { sh = shuffle(chosen); } while (sh.length > 1 && sh.every((x, i) => x === chosen[i]));
      O.items = sh; O.answer = chosen.map(x => x.k); O.checked = false; render(); setMsg(msg, s.hint || '');
      $('[data-a="check"]', P).textContent = 'Check order';
    }
    function render(marks) {
      list.innerHTML = O.items.map((it, i) => `<li class="oitem${marks ? (marks[i] ? ' right' : ' wrong') : ''}" data-i="${i}">
        <span class="onum">${i + 1}</span><span class="otext"><b>${esc(it.text)}</b>${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</span>
        <span class="oarrows"><button type="button" data-mv="-1" aria-label="Move ${esc(it.text)} up" ${i === 0 ? 'disabled' : ''}>&#9650;</button><button type="button" data-mv="1" aria-label="Move ${esc(it.text)} down" ${i === O.items.length - 1 ? 'disabled' : ''}>&#9660;</button></span></li>`).join('');
      $$('.oitem', list).forEach(li => {
        li.querySelectorAll('[data-mv]').forEach(b => b.onclick = () => move(+li.dataset.i, +li.dataset.i + +b.dataset.mv));
        li.addEventListener('pointerdown', e => drag(e, li));
      });
    }
    function move(a, b) { if (b < 0 || b >= O.items.length) return; const [x] = O.items.splice(a, 1); O.items.splice(b, 0, x); render(); const dir = b > a ? '1' : '-1'; let btn = $(`.oitem[data-i="${b}"] [data-mv="${dir}"]`, list); if (!btn || btn.disabled) btn = $(`.oitem[data-i="${b}"] [data-mv]:not(:disabled)`, list); if (btn) btn.focus(); }
    function drag(e, li) {
      if (e.target.closest('button') || (e.button !== undefined && e.button > 0)) return;
      const sy = e.clientY; let moved = false, from = +li.dataset.i;
      try { li.setPointerCapture(e.pointerId); } catch (er) {}
      const mv = ev => {
        if (!moved && Math.abs(ev.clientY - sy) > 6) { moved = true; li.classList.add('dragging'); }
        if (!moved) return;
        const others = $$('.oitem', list).filter(x => x !== li);
        let to = others.findIndex(x => { const r = x.getBoundingClientRect(); return ev.clientY < r.top + r.height / 2; });
        if (to === -1) to = others.length;
        if (to !== from) { const [x] = O.items.splice(from, 1); O.items.splice(to, 0, x); from = to; const ref = others[to] || null; list.insertBefore(li, ref); }
      };
      const up = () => { li.removeEventListener('pointermove', mv); li.removeEventListener('pointerup', up); li.removeEventListener('pointercancel', up); li.classList.remove('dragging'); if (moved) render(); };
      li.addEventListener('pointermove', mv); li.addEventListener('pointerup', up); li.addEventListener('pointercancel', up);
    }
    $('[data-a="check"]', P).onclick = () => {
      const marks = O.items.map((it, i) => it.k === O.answer[i]), right = marks.filter(Boolean).length;
      if (!O.checked) { O.checked = true; ctx.result(right, O.items.length); if (right === O.items.length) { ctx.credit(); ctx.sfx.win(); } else { ctx.slip(); ctx.sfx.bad(); } }
      render(marks);
      if (right === O.items.length) setMsg(msg, 'Perfect order!', 'good');
      else setMsg(msg, right + ' of ' + O.items.length + ' are in the right place. Move the red ones, then check again. Your score counts your first check.', 'bad');
      $('[data-a="check"]', P).textContent = 'Check again';
    };
    $('[data-a="new"]', P).onclick = round;
    $$('.seg button', P).forEach(b => b.onclick = () => { O.set = sets.find(s => s.id === b.dataset.s); $$('.seg button', P).forEach(x => x.setAttribute('aria-pressed', x === b)); round(); });
    round();
  }

  /* ---------------- Explain it (written answers) ---------------- */
  const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const CROSS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  /* Lenient on purpose: curly quotes (phones type them) count as straight ones, a keyword can sit inside a longer word
     ("elect" finds "elected"), "B.C." does not end a sentence, and a sentence needs only 3 words. */
  const ABBR = /(?:\b(?:b\.c|a\.d|b\.c\.e|c\.e|mr|mrs|ms|dr|st|vs|etc)\.)$/i;
  function splitSentences(text) {
    const raw = text.split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(Boolean), out = [];
    // "In 753 B.C. Rome began." stays one sentence: a short piece after a date abbreviation joins the one before it
    raw.forEach(piece => { const prev = out[out.length - 1]; if (prev && ABBR.test(prev) && (/^[a-z]/.test(piece) || piece.split(/\s+/).length < 3)) out[out.length - 1] = prev + ' ' + piece; else out.push(piece); });
    return out;
  }
  function gradeExplain(text, ex) {
    text = String(text).replace(/[\u2018\u2019\u02bc]/g, "'").replace(/[\u201c\u201d]/g, '"');
    const t = ' ' + text.toLowerCase().replace(/\s+/g, ' ') + ' ';
    const ideas = ex.ideas.map(idea => ({ label: idea.label, ok: idea.all.every(group => group.some(k => t.includes(k))) }));
    const sentences = splitSentences(text);
    const complete = sentences.length > 0 && sentences.every(s => /^[A-Z0-9"']/.test(s) && /[.!?]["']?$/.test(s) && s.split(/\s+/).length >= 3);
    return { ideas, complete, perfect: complete && ideas.every(i => i.ok) };
  }
  function explain(ctx, opt) {
    const P = ctx.panel, X = { list: [], i: 0, score: 0, checked: false }, items = opt.items, n = opt.rounds || items.length;
    function start() { X.list = (opt.keepFirst ? [items[0], ...shuffle(items.slice(1))] : shuffle(items)).slice(0, n); X.i = 0; X.score = 0; show(); }
    function show() {
      if (X.i >= X.list.length) {
        ctx.result(X.score, X.list.length); ctx.sfx.win();
        P.innerHTML = `<h2>${esc(opt.title || 'Explain it')}</h2><div class="result">${starsHTML(X.score, X.list.length)}<p class="prompt">${X.score} out of ${X.list.length} complete</p><p class="lead">${X.score / X.list.length >= 0.8 ? 'Insane work. You can explain it all in your own words.' : 'Explaining is the hardest part. Read the model answers, then try again.'}</p><button class="btn" data-a="again">Play again</button></div>`;
        $('[data-a="again"]', P).onclick = start; return;
      }
      const ex = X.list[X.i]; X.checked = false;
      P.innerHTML = `<h2>${esc(opt.title || 'Explain it')}</h2><p class="lead">${esc(opt.lead || 'Answer in complete sentences, then check your answer.')}</p>
        <div class="roundbar"><div class="bar" aria-hidden="true"><i style="width:${X.i / X.list.length * 100}%"></i></div><span class="hint">Question ${X.i + 1} of ${X.list.length} &middot; Complete ${X.score}</span></div>
        <div class="xgrid"><div>
          <div class="row qrow left"><p class="qline">${esc(ex.q)}</p>${ctx.sayButton(ex.q, 'Hear the question')}</div>
          <textarea class="answer" rows="5" aria-label="Your answer" placeholder="Write your answer here."></textarea>
          <div class="row"><button class="btn" data-a="check">Check my answer</button><button class="btn" data-a="next" hidden>${X.i === X.list.length - 1 ? 'See results' : 'Next question'}</button></div>
        </div><div class="feedback" hidden></div></div>`;
      const ta = $('.answer', P), fb = $('.feedback', P), check = $('[data-a="check"]', P), next = $('[data-a="next"]', P);
      ta.focus();
      check.onclick = () => {
        if (ta.value.trim().split(/\s+/).length < 3) { fb.hidden = false; fb.innerHTML = '<p class="msg bad">Write a little more first.</p>'; return; }
        const g = gradeExplain(ta.value, ex);
        if (!X.checked) { X.checked = true; if (g.perfect) { X.score++; ctx.credit(); ctx.sfx.good(); } else { ctx.slip(); ctx.sfx.bad(); } }
        fb.hidden = false;
        fb.innerHTML = `<div class="eyebrow">Did your answer include</div>
          <ul class="checks">${g.ideas.map(i => `<li class="${i.ok ? 'ok' : 'no'}">${i.ok ? CHECK : CROSS}<span>${esc(i.label)}</span></li>`).join('')}
          <li class="${g.complete ? 'ok' : 'no'}">${g.complete ? CHECK : CROSS}<span>Complete sentences (capital letter, end mark)</span></li></ul>
          <p class="msg ${g.perfect ? 'good' : 'bad'}">${g.perfect ? 'Great answer!' : 'Add what is missing, then check again. Your score counts your first check.'}</p>
          <div class="model"><div class="eyebrow">${ex.teacher ? 'Answer from the study guide' : 'A good answer'}</div><p>${esc(ex.model)}</p>${ctx.sayButton(ex.model, 'Hear the answer')}</div>`;
        check.textContent = 'Check again'; next.hidden = false;
      };
      next.onclick = () => { X.i++; show(); };
      ctx.say(ex.q);
    }
    start();
  }

  window.SBT = { flashcards, sort, quiz, answer, order, explain, gradeExplain, shuffle, starsHTML, setMsg };
})();
