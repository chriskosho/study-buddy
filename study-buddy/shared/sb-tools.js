/* Study Buddy shared tools: ready-made activities that any module can fill with its own content.
   Each builder takes the ctx that SBM.start passes to a tool's init(ctx), plus content and options.

     SBT.flashcards(ctx, { lead, modes: [{ id, label }], build(modeId) -> [{ front, back, say }] })
         front/back are HTML; say is spoken when the card shows (only if Read aloud is on).
         Result: cards known on the first try out of the deck size.
         Optional onSection(sectionId) is called when a section opens (to remember it).
         Optional sections: { list: [{ id, label, group?, noStep? }], start?: id, noun?: 'section' } adds a section menu with
         Previous and Next buttons; build(modeId, sectionId) then returns that section's cards. group puts the entry under a menu heading.

     SBT.sort(ctx, { lead, sets: [{ id, label, buckets: [{ id, name, html? }], items: [{ text, b }], perBucket? }],
                     right?(item, bucket), wrong?(item, bucket) })
         Drag (or tap, then tap) each item into its bucket. Result: items minus misses, out of items.

     SBT.quiz(ctx, { lead, rounds, build() -> [{ q, a, wrong: [..], why?, html? }] })   (html: extra markup shown under the question, e.g. a picture;
         qh: the question as HTML instead of plain text, e.g. stacked fractions, with say as the text to read aloud)
         Multiple choice, one round of `rounds` questions. Result: right answers out of rounds.
         Optional onAnswer(question, right) is called after each question. Optional skip: true adds a "Skip, review later" button
         (shows the answer, no point, calls onAnswer(question, false)).

     SBT.answer(ctx, { lead, rounds, build() -> [{ q, a, show?, why?, hint?, say? }], kind: 'number'|'text'|'fraction', typo?, skip?, onAnswer? })
         Type the answer. q is HTML. a is a number (kind 'number') or a list of accepted strings.
         kind 'fraction': a is the answer written like "3/4", "1 3/4" or "2", and the typed answer is judged by its value. Each item has
         form: 'any' (7/4 or 1 3/4), 'mixed' (must be a mixed number) or 'improper' (must be n/d). The right value that is not in
         simplest form (or not in the asked form) gets a nudge and does not use up a try. Two tries, a hint,
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
  const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const CROSS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const FLIP_MS = 520;

  /* ---------------- Scratch pad button ----------------
     Every question tool (type the answer, multiple choice, sort, order, explain) can show a "Scratch pad" button.
     It is on for the Math subject only for now: registry.js has  scratchpad: { subjects: ['math'] }  and a module can say
     scratchpad: true or false to override. To turn it on for another subject later, add its id there. */
  const PAD_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3" width="12.5" height="18" rx="2"/><path d="M7 8h5.5M7 12h3"/><path d="M18.2 8.3l2.6 2.6-6.6 6.6-3.3.7.7-3.3z"/></svg>';
  const padOn = ctx => { const m = ctx.mod || {}, c = (window.SB_REGISTRY || {}).scratchpad || {}; return m.scratchpad != null ? !!m.scratchpad : (c.subjects || []).includes(m.subject); };
  const plainText = html => {
    const d = document.createElement('div'); d.innerHTML = String(html || ''); const figs = [...d.querySelectorAll('svg[role="img"][aria-label]')].map(x => x.getAttribute('aria-label').replace(/[.\s]+$/, ''));   /* a picture's description goes last: it tells two questions with the same words apart */
    d.querySelectorAll('svg,.fignote,button').forEach(x => x.remove());
    d.querySelectorAll('.mixed').forEach(m => { const f = m.querySelector('.frac'); m.replaceWith(' ' + (m.dataset.w || '') + (f ? ' ' + f.dataset.n + '/' + f.dataset.d : '') + ' '); });
    d.querySelectorAll('.frac').forEach(f => f.replaceWith(' ' + f.dataset.n + '/' + f.dataset.d + ' '));
    return ((d.textContent || '') + figs.map(f => ' (' + f + ')').join('')).replace(/\s+/g, ' ').trim();
  };
  let padLoading = null;
  function loadPad() {
    if (window.SBPad) return Promise.resolve();
    if (!padLoading) padLoading = new Promise((res, rej) => { const s = document.createElement('script'); s.src = SB.BASE + 'shared/sb-scratchpad.js'; s.onload = () => res(); s.onerror = () => { padLoading = null; rej(); }; document.head.appendChild(s); });
    return padLoading;
  }
  /* One Scratch pad button lives in the module's settings row (next to Sound, Read aloud and Reset), so it takes no room from the question.
     A tool calls addPad(ctx, getQuestionText) after it draws; the shell calls padTab(toolId) when a tool is shown, which hides the
     button on tools that have no pad (study guides, flashcards). */
  const PADS = {};
  function addPad(ctx, getQ) {
    if (!padOn(ctx)) return;
    const id = ctx.tool && ctx.tool.id; PADS[id] = getQ;
    let b = document.getElementById('sbPad');
    if (!b) {
      const host = document.querySelector('.settings'); if (!host) return;
      b = document.createElement('button'); b.type = 'button'; b.id = 'sbPad'; b.className = 'iconbtn padbtn'; b.setAttribute('aria-label', 'Open the scratch pad'); b.innerHTML = PAD_ICON + '<span>Scratch pad</span>';
      b.onclick = () => { const q = PADS[b._cur] ? PADS[b._cur]() : ''; loadPad().then(() => SBPad.open({ question: q, source: b._mod || '', opener: b }), () => SB.toast('The scratch pad could not load. Check the connection and try again.')); };
      host.insertBefore(b, host.firstChild);
    }
    b._cur = id; b._mod = (ctx.mod || {}).title || ''; b.hidden = false;
    if (window.SBPad && SBPad.isOpen()) SBPad.setQuestion(getQ());
  }
  function padTab(id) {
    const b = document.getElementById('sbPad'); if (!b) return;
    b._cur = id; b.hidden = !PADS[id];
    if (PADS[id] && window.SBPad && SBPad.isOpen()) SBPad.setQuestion(PADS[id]());
  }

  /* ---------------- Flashcards ---------------- */
  function flashcards(ctx, opt) {
    const P = ctx.panel, modes = opt.modes || [{ id: 'all', label: 'All' }];
    const SEC = opt.sections, noun = (SEC && SEC.noun) || 'section';
    const FC = { mode: modes[0].id, sec: SEC ? (SEC.start || SEC.list[0].id) : null, queue: [], cur: null, missed: new Set(), total: 0, flipped: false, busy: false, hist: [] };
    const secMenu = () => { if (!SEC) return ''; const groups = []; SEC.list.forEach(e => { const g = e.group || ''; let o = groups.find(x => x.g === g); if (!o) groups.push(o = { g, items: [] }); o.items.push(e); });
      const optHtml = e => `<option value="${esc(e.id)}"${e.id === FC.sec ? ' selected' : ''}>${esc(e.label)}</option>`;
      return `<div class="secnav"><button class="btn ghost" data-a="prevsec" aria-label="Previous ${noun}">&lsaquo;</button><select class="secsel" aria-label="Jump to a ${noun}">${groups.map(o => o.g ? `<optgroup label="${esc(o.g)}">${o.items.map(optHtml).join('')}</optgroup>` : o.items.map(optHtml).join('')).join('')}</select><button class="btn ghost" data-a="nextsec" aria-label="Next ${noun}">&rsaquo;</button></div>`; };
    P.innerHTML = `<h2>${esc(opt.title || 'Flashcards')}</h2><p class="lead">${esc(opt.lead || 'Tap the card to flip it. Be honest: did you know it? Cards you miss come back again.')}<span class="swipe-tip"> Swipe right if you knew it, left if you are still learning.</span></p>
      <div class="deckbar">${secMenu()}${modes.length > 1 ? `<div class="seg" role="group" aria-label="Card type">${modes.map((m, i) => `<button data-m="${esc(m.id)}" aria-pressed="${i === 0}">${esc(m.label)}</button>`).join('')}</div>` : ''}
        <div class="bar" aria-hidden="true"><i></i></div><span class="hint count"></span><button class="btn ghost undo" data-a="undo" disabled>Undo</button></div>
      <div class="cardzone"><div class="cardstage"><div class="fcard" role="button" tabindex="0" aria-describedby="sbFlipTip"><span class="sr-only" id="sbFlipTip">Press to flip the card.</span><div class="face front" aria-live="polite"></div><div class="face back" aria-hidden="true" aria-live="polite"></div></div></div></div>
      <div class="row center cardbtns"><button class="btn warn" data-a="again">Still learning</button><button class="btn ghost" data-a="skip">Skip</button><button class="btn good" data-a="knew">I knew it</button></div>`;
    const card = $('.fcard', P), F = $('.front', P), B = $('.back', P);
    const flip = on => { FC.flipped = on; card.classList.toggle('flip', on); F.setAttribute('aria-hidden', String(on)); B.setAttribute('aria-hidden', String(!on)); };
    const bar = () => { const done = FC.total - FC.queue.length; $('.bar i', P).style.width = (FC.total ? done / FC.total * 100 : 0) + '%'; $('.count', P).textContent = done + ' of ' + FC.total + ' done'; $('[data-a="undo"]', P).disabled = !FC.hist.length; };
    const secIdx = () => SEC.list.findIndex(e => e.id === FC.sec);
    const secStep = d => { for (let i = secIdx() + d; i >= 0 && i < SEC.list.length; i += d) if (!SEC.list[i].noStep) return i; return -1; };   // entries with noStep (like "All") are in the menu but skipped by the arrows
    function syncSec() { if (!SEC) return; $('.secsel', P).value = FC.sec; $('[data-a="prevsec"]', P).disabled = secStep(-1) < 0; $('[data-a="nextsec"]', P).disabled = secStep(1) < 0; }
    function build() { FC.missed = new Set(); FC.busy = false; FC.hist = []; FC.queue = opt.build(FC.mode, FC.sec); FC.total = FC.queue.length; syncSec(); if (SEC && opt.onSection) opt.onSection(FC.sec); next(); }
    function next() {
      SB.stopSpeech(); flip(false);
      if (!FC.queue.length) {
        const nm = FC.missed.size;
        F.innerHTML = `<div class="tag">Deck complete</div><div class="big">Great work!</div><div class="small">You went through all ${FC.total} cards.${SEC ? ' Use the arrows to open the next ' + noun + ', or go again.' : ''}</div>
          <div class="row center deckagain"><button type="button" class="btn ghost small" data-a="again-all">Go again</button>${nm ? `<button type="button" class="btn small" data-a="again-missed">Just the ${nm === 1 ? 'one' : nm} I missed</button>` : ''}</div>`;
        B.innerHTML = ''; FC.cur = null; ctx.sfx.win(); bar();
        const hadFocus = document.activeElement === card;
        card.removeAttribute('role'); card.tabIndex = -1; card.removeAttribute('aria-describedby');   // the finished card holds real buttons, so it is no longer one big button itself
        if (hadFocus) $('[data-a="again-all"]', F).focus();
        $('[data-a="again-all"]', F).onclick = e => { e.stopPropagation(); build(); };
        const am = $('[data-a="again-missed"]', F); if (am) am.onclick = e => { e.stopPropagation(); const cards = [...FC.missed]; FC.missed = new Set(); FC.hist = []; FC.queue = shuffle(cards); FC.total = FC.queue.length; next(); };
        return;
      }
      const c = FC.cur = FC.queue[0];
      card.setAttribute('role', 'button'); card.tabIndex = 0; card.setAttribute('aria-describedby', 'sbFlipTip');
      F.innerHTML = c.front; B.innerHTML = c.back; if (c.say) ctx.say(c.say); bar();
    }
    const afterUnflip = fn => { if (FC.busy) return; if (!FC.flipped) return fn(); FC.busy = true; flip(false); setTimeout(() => { FC.busy = false; fn(); }, FLIP_MS); };
    const doFlip = () => { if (!FC.cur || FC.busy) return; flip(!FC.flipped); SB.stopSpeech(); };
    card.addEventListener('click', doFlip);
    card.addEventListener('keydown', e => { if (e.target !== card) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doFlip(); } });   // keys on the buttons inside a finished card work as usual
    const zone = $('.cardzone', P);
    const snap = () => { FC.hist.push({ q: FC.queue.slice(), m: new Set(FC.missed) }); if (FC.hist.length > 300) FC.hist.shift(); };
    const undo = () => { if (FC.busy || !FC.hist.length) return; afterUnflip(() => { const h = FC.hist.pop(); FC.queue = h.q; FC.missed = h.m; next(); SB.cardToast(zone, 'Undone'); }); };
    $('[data-a="knew"]', P).onclick = () => { if (!FC.cur) return build(); afterUnflip(() => { snap(); FC.queue.shift(); ctx.sfx.good(); next(); SB.cardToast(zone, 'Knew it', undo); }); };
    $('[data-a="again"]', P).onclick = () => { if (!FC.cur) return build(); afterUnflip(() => { snap(); const c = FC.queue.shift(); FC.missed.add(c); FC.queue.splice(Math.min(FC.queue.length, 3 + Math.floor(Math.random() * 3)), 0, c); ctx.sfx.bad(); next(); SB.cardToast(zone, 'Still learning', undo); }); };
    $('[data-a="skip"]', P).onclick = () => { if (!FC.cur) return build(); afterUnflip(() => { snap(); FC.queue.push(FC.queue.shift()); next(); SB.cardToast(zone, 'Skipped', undo); }); };
    $('[data-a="undo"]', P).onclick = undo;
    const onKey = e => { if (!card.isConnected) return document.removeEventListener('keydown', onKey); if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !/^(INPUT|SELECT|TEXTAREA)$/.test((e.target || {}).tagName || '') && P.offsetParent) { e.preventDefault(); undo(); } };
    document.addEventListener('keydown', onKey);
    if (SEC) {
      const go = i => { if (FC.busy || i < 0) return; FC.sec = SEC.list[i].id; build(); };
      $('.secsel', P).onchange = e => { FC.sec = e.target.value; build(); };
      $('[data-a="prevsec"]', P).onclick = () => go(secStep(-1));
      $('[data-a="nextsec"]', P).onclick = () => go(secStep(1));
    }
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
    addPad(ctx, () => plainText(opt.title || 'Sort it') + '. ' + plainText(opt.lead || 'Drag each one into its group.'));
    const bucketOf = id => S.set.buckets.find(b => b.id === id);
    const score = () => { $('.placed', P).textContent = S.placed + '/' + S.total; $('.miss', P).textContent = S.miss; };
    function select(chip) {
      S.sel = S.sel === chip ? null : chip;
      $$('.chip', tray).forEach(c => { c.classList.toggle('sel', c === S.sel); c.setAttribute('aria-pressed', String(c === S.sel)); });
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
        chip.remove(); S.sel = null; $$('.chip', tray).forEach(c => { c.classList.remove('sel'); c.setAttribute('aria-pressed', 'false'); }); $$('.bucket', P).forEach(x => x.classList.remove('ready'));
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
        c.setAttribute('aria-pressed', 'false');
        c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(c); } });
        c.addEventListener('click', e => { if (e.detail === 0 && e.pointerType !== 'mouse') select(c); });   // screen readers and switch access send only a click (detail 0); pointer taps are handled above
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
    const P = ctx.panel, n = opt.rounds || 10, Q = { qs: [], i: 0, score: 0, answered: false, missed: [] };
    function start() { Q.qs = (opt.keepOrder ? opt.build() : shuffle(opt.build())).slice(0, n); Q.i = 0; Q.score = 0; Q.missed = []; show(); }
    function show() {
      if (Q.i >= Q.qs.length) {
        ctx.result(Q.score, Q.qs.length); ctx.sfx.win();
        P.innerHTML = `<h2>${esc(opt.title || 'Quiz')}</h2><div class="result">${starsHTML(Q.score, Q.qs.length)}<p class="prompt">${Q.score} out of ${Q.qs.length}</p><p class="lead">${Q.score / Q.qs.length >= 0.9 ? 'Amazing! You really know this.' : Q.score / Q.qs.length >= 0.7 ? 'Great job. A little more practice and you will have it.' : 'Good start. Try the flashcards, then come back.'}</p>${reviewHTML(ctx, Q.missed)}<button class="btn" data-a="again">Play again</button></div>`;
        $('[data-a="again"]', P).onclick = start; const ag = $('[data-a="again"]', P); if (P.dataset.sbFocus) ag.focus({ preventScroll: true }); return;
      }
      const q = Q.qs[Q.i], opts = shuffle([q.a, ...shuffle(q.wrong).slice(0, 3)]); Q.answered = false;
      P.innerHTML = `<h2>${esc(opt.title || 'Quiz')}</h2><p class="lead">${esc(opt.lead || 'Pick the best answer.')}</p>
        <div class="roundbar"><div class="bar" aria-hidden="true"><i style="width:${Q.i / Q.qs.length * 100}%"></i></div><span class="hint">Question ${Q.i + 1} of ${Q.qs.length} &middot; Score ${Q.score}</span></div>
        <div class="qwrap"><div class="row qrow"><p class="qtext">${q.qh || esc(q.q)}</p>${ctx.sayButton(q.say || q.q, q.audio ? 'Hear the sound' : 'Hear the question', q.audio || '')}</div>${q.html || ''}
        <div class="opts">${opts.map((o, k) => `<button class="opt" data-v="${esc(o)}"><span class="optkey" aria-hidden="true">${k + 1}</span>${esc(o)}</button>`).join('')}</div>
        <p class="explain" aria-live="polite"></p><div class="row center">${opt.skip ? '<button class="btn ghost" data-a="skip">Skip, review later</button>' : ''}<button class="btn" data-a="next" hidden>${Q.i === Q.qs.length - 1 ? 'See results' : 'Next question'}</button></div></div>`;
      addPad(ctx, () => q.qh ? plainText(q.qh) : q.q);
      { const f = $('.opt', P); if (f && P.offsetParent && P.contains(document.activeElement) === false && (document.activeElement === document.body || !document.activeElement || P.dataset.sbFocus)) f.focus({ preventScroll: true }); P.dataset.sbFocus = '1'; }   // keyboard users stay in the quiz
      $$('.opt', P).forEach(b => b.onclick = () => {
        if (Q.answered) return; Q.answered = true;
        const skb = $('[data-a="skip"]', P); if (skb) skb.hidden = true;
        const ok = b.dataset.v === q.a;
        $$('.opt', P).forEach(x => { x.disabled = true; if (x.dataset.v === q.a) x.classList.add('right'); });
        if (ok) { Q.score++; ctx.credit(); ctx.sfx.good(); } else { b.classList.add('wrong'); ctx.slip(); ctx.sfx.bad(); Q.missed.push({ q: q.q, a: q.a, say: q.audio ? '' : (q.say || q.q), audio: q.audio || '' }); if (ctx.miss) ctx.miss(plainText(String(q.q)) + ' (answer: ' + plainText(String(q.a)) + ')'); }
        if (opt.onAnswer) opt.onAnswer(q, ok);
        $('.explain', P).innerHTML = (ok ? '<b style="color:var(--good-ink)">Correct!</b> ' : '<b style="color:var(--bad-ink)">Not quite.</b> ') + esc(q.why || ('The answer is: ' + q.a + '.'));
        const nx = $('[data-a="next"]', P); nx.hidden = false; nx.focus();
      });
      const sk = $('[data-a="skip"]', P);
      if (sk) sk.onclick = () => {                              // not sure? show the answer, mark it for review, and move on (no point, no streak change)
        if (Q.answered) return; Q.answered = true; sk.hidden = true;
        $$('.opt', P).forEach(x => { x.disabled = true; if (x.dataset.v === q.a) x.classList.add('right'); });
        if (opt.onAnswer) opt.onAnswer(q, false); Q.missed.push({ q: q.q, a: q.a, say: q.audio ? '' : (q.say || q.q), audio: q.audio || '' });
        $('.explain', P).innerHTML = '<b>Marked for review.</b> ' + esc(q.why || ('The answer is: ' + q.a + '.'));
        const nx = $('[data-a="next"]', P); nx.hidden = false; nx.focus();
      };
      $('[data-a="next"]', P).onclick = () => { Q.i++; show(); };
      if (!q.audio) ctx.say(q.say || q.q);
    }
    /* number keys 1 to 4 pick a choice (when the quiz is on screen and you are not typing somewhere) */
    const onKey = e => {
      if (!P.isConnected) return document.removeEventListener('keydown', onKey);
      if (!P.offsetParent || e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || '') || document.querySelector('.sb-ov') || (e.target && e.target.closest && e.target.closest('.sbp'))) return;   // not while working in the scratch pad
      const k = +e.key; if (!(k >= 1 && k <= 9)) return; const b = $$('.opt', P)[k - 1]; if (b && !b.disabled) { e.preventDefault(); b.click(); }
    };
    document.addEventListener('keydown', onKey);
    start();
  }

  /* ---------------- Type the answer ---------------- */
  const gcdI = (a, b) => b ? gcdI(b, a % b) : Math.abs(a);
  /* "3/4", "1 3/4" or "2" -> { n, d } (improper); mixed numbers also carry w, fn, fd. null when it is not a fraction */
  const VULGAR = { '½': ' 1/2', '⅓': ' 1/3', '⅔': ' 2/3', '¼': ' 1/4', '¾': ' 3/4', '⅕': ' 1/5', '⅖': ' 2/5', '⅗': ' 3/5', '⅘': ' 4/5', '⅙': ' 1/6', '⅚': ' 5/6', '⅛': ' 1/8', '⅜': ' 3/8', '⅝': ' 5/8', '⅞': ' 7/8' };
  /* what a child might type around a number: a unit word ("3/4 cup", "1,728 cubic feet"), "1-3/4", "1 and 3/4", ½, thousands commas */
  const stripUnit = v => { const t = String(v).trim(), m = t.match(/^(.*\d)\s*([a-z][a-z .]*)$/i); return m && !/^(and)$/i.test(m[2].trim()) ? { v: m[1].trim(), unit: true } : { v: t, unit: false }; };
  const fracPrep = v => String(v).trim().replace(/\u2212/g, '-').replace(/[\u2044\u2215]/g, '/').replace(/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, c => VULGAR[c])
    .replace(/^(\d+)\s*(?:-|and|\+)\s*(\d+\s*\/\s*\d+)$/i, '$1 $2').replace(/(\d),(?=\d{3}(?!\d))/g, '$1').replace(/^(\d{1,3})(?: (\d{3}))+$/, m => m.replace(/ /g, '')).replace(/\s+/g, ' ').trim();
  const parseFrac = v => {
    const t = fracPrep(v); let m;
    if ((m = t.match(/^(\d+) (\d+) ?\/ ?(\d+)$/))) { const w = +m[1], fn = +m[2], fd = +m[3]; return fd ? { n: w * fd + fn, d: fd, w, fn, fd } : null; }
    if ((m = t.match(/^(\d+) ?\/ ?(\d+)$/))) return +m[2] ? { n: +m[1], d: +m[2] } : null;
    if ((m = t.match(/^(\d+)$/))) return { n: +m[1], d: 1 };
    if ((m = t.match(/^(\d*)\.(\d{1,6})$/))) { const d = Math.pow(10, m[2].length); return { n: (+m[1] || 0) * d + +m[2], d, dec: true }; }   // a decimal: judged by value, then nudged
    return null;
  };
  const numNorm = s => String(s).replace(/[,\s]/g, '').replace(/^\+/, '').replace(/^\./, '0.').replace(/−/g, '-');
  const txtNorm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/^(the|a|an)\s+/, '').replace(/[^a-z0-9]/g, '');
  function editDist(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  /* the answer judge, on its own so it can be tested: 'ok', 'close', 'no', 'bad' (not an answer), or a nudge name */
  function judge(item, v, kind, opt = {}) {
    if (kind === 'fraction') {
      const x = parseFrac(v); if (!x) return 'bad'; const t = parseFrac(item.a);
      if (x.n * t.d !== t.n * x.d) return 'no';
      if (x.dec && t.d !== 1) return 'decimal';                                     // 2.5 for 2 1/2: the right amount, asked as a fraction
      const form = item.form || 'any', mixedTyped = x.w !== null && x.w !== undefined;
      if (x.d !== 1 && !mixedTyped && x.n % x.d === 0 && t.d === 1) return 'whole';   // 4/2 for 2
      if (mixedTyped ? (x.fn >= x.fd || gcdI(x.fn, x.fd) > 1) : (x.d !== 1 && gcdI(x.n, x.d) > 1)) return 'unreduced';
      if (form === 'mixed' && !mixedTyped && x.d !== 1 && x.n > x.d) return 'wantMixed';
      if (form === 'improper' && mixedTyped) return 'wantImproper';
      return 'ok';
    }
    if (kind === 'number') { const x = numNorm(v); if (!/^-?\d*\.?\d+$/.test(x)) return 'bad'; return Math.abs(parseFloat(x) - Number(item.a)) < 1e-9 ? 'ok' : 'no'; }

    const t = txtNorm(v), list = [].concat(item.a);
    if (opt.exactCase) { const tv = String(v).trim(); if (list.includes(tv)) return 'ok'; if (list.some(a => String(a).toLowerCase() === tv.toLowerCase())) return 'case'; return 'no'; }
    if (list.some(a => txtNorm(a) === t)) return 'ok';
    if (opt.typo && !item.noTypo && list.some(a => txtNorm(a).length >= 5 && editDist(txtNorm(a), t) <= 1)) return 'close';
    return 'no';
  }

  const COARSE = () => !!(window.matchMedia && matchMedia('(pointer:coarse)').matches);
  const KEYPAD = `<div class="keypad" role="group" aria-label="Number keys">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', ' ', '/'].map(k => `<button type="button" data-k="${k}" aria-label="${k === ' ' ? 'space' : k === '/' ? 'fraction bar' : k}">${k === ' ' ? 'space' : k}</button>`).join('')}<button type="button" data-k="back" aria-label="Delete">&larr;</button></div>`;
  const fracHTML = f => f.w != null && f.fn ? `<span class="mixed"><b>${f.w}</b><span class="frac"><span class="fn">${f.fn}</span><span class="fd">${f.fd}</span></span></span>`
    : f.d === 1 ? `<b>${f.n}</b>` : f.dec ? `<b>${(f.n / f.d)}</b>` : `<span class="frac"><span class="fn">${f.n}</span><span class="fd">${f.d}</span></span>`;
  /* the explanation after a miss comes one step at a time ("Show the next step"); after a right answer it shows whole */
  function steps(el, text, missed) {
    const parts = String(text).replace(/([.!?]+["')]?)\s+/g, '$1\u0000').split('\u0000').map(x => x.trim()).filter(Boolean);   // a step ends at . ! or ? and a space, so 3.45 stays whole
    if (!missed || parts.length < 3) { el.textContent = text; return; }
    let k = 1; const draw = () => { el.innerHTML = esc(parts.slice(0, k).join(' ').trim()) + (k < parts.length ? ' <button type="button" class="btn ghost small stepbtn">Show the next step</button>' : '');
      const b = el.querySelector('.stepbtn'); if (b) b.onclick = () => { k++; draw(); const nb = el.querySelector('.stepbtn'); (nb || el).focus && (nb ? nb.focus() : null); }; };
    draw();
  }
  /* the questions missed in a round, folded away under the result so the screen still fits */
  function reviewHTML(ctx, missed) {
    if (!missed.length) return '';
    return `<details class="review"><summary>See the ${missed.length === 1 ? 'one' : missed.length} to practice</summary><ul>${missed.map(m => `<li>${m.pic ? `<img src="${m.pic}" alt="Your scratch pad work" class="revpic">` : ''}<span class="revq">${esc(m.q)}</span><span class="reva">Answer: <b>${esc(m.a)}</b></span>${m.audio ? ctx.sayButton(String(m.a), 'Hear the sound again', m.audio) : m.say ? ctx.sayButton(m.say + '. The answer is ' + m.a + '.', 'Hear it') : ''}</li>`).join('')}</ul></details>`;
  }
  function answer(ctx, opt) {
    const P = ctx.panel, n = opt.rounds || 10, kind = opt.kind || 'text', R = { list: [], i: 0, score: 0, tries: 0, hinted: false, missed: [] };
    const real = () => R.list.filter(x => !x.practice), numNow = () => R.list.slice(0, R.i + 1).filter(x => !x.practice).length;   // practice questions (Try a similar one) do not count
    const check = (item, v) => judge(item, v, kind, opt);
    const shown = item => item.show || (kind === 'fraction' ? String(item.a) : kind === 'number' ? Number(item.a).toLocaleString('en-US', { maximumFractionDigits: 10 }) : [].concat(item.a)[0]);
    function start() { R.list = opt.build().slice(0, n); R.i = 0; R.score = 0; R.missed = []; show(); }
    function show() {
      if (R.i >= R.list.length) {
        const total = real().length;
        ctx.result(R.score, total); ctx.sfx.win();
        P.innerHTML = `<h2>${esc(opt.title || 'Type the answer')}</h2><div class="result">${starsHTML(R.score, total)}<p class="prompt">${R.score} out of ${total}</p><p class="lead">${R.score / total >= 0.8 ? 'Excellent work!' : 'Good practice. Read the explanations, then try another round.'}</p>${reviewHTML(ctx, R.missed)}<button class="btn" data-a="again">Play again</button></div>`;
        $('[data-a="again"]', P).onclick = start; const ag = $('[data-a="again"]', P); if (P.dataset.sbFocus) ag.focus({ preventScroll: true }); return;
      }
      const item = R.list[R.i]; R.tries = 0; R.hinted = false; const tot = real().length;
      P.innerHTML = `<h2>${esc(opt.title || 'Type the answer')}</h2><p class="lead">${esc(opt.lead || 'Type your answer, then press Check.')}</p>
        <div class="roundbar"><div class="bar" aria-hidden="true"><i style="width:${R.i / R.list.length * 100}%"></i></div><span class="hint">${item.practice ? 'Practice: a similar one, no score' : `Question ${numNow()} of ${tot} &middot; Score ${R.score}`}</span></div>
        <div class="row qrow"><p class="qtext">${item.q}</p>${item.say ? ctx.sayButton(item.say, 'Hear it') : ''}</div>
        <form class="spellrow" autocomplete="off"><span class="spellbox"><input aria-label="Your answer" placeholder="${kind === 'fraction' ? 'Like 3/4 or 1 3/4' : 'Answer'}" ${kind === 'number' ? 'inputmode="decimal"' : 'autocapitalize="off" autocorrect="off"'}${kind === 'fraction' ? ' size="14"' : ''} spellcheck="false"><button class="btn" type="submit">Check</button>${kind === 'fraction' ? '<span class="typed" aria-live="polite"></span>' : ''}</span></form>
        ${kind === 'fraction' && COARSE() ? KEYPAD : ''}
        <div class="err" role="alert"></div><p class="explain why"></p>
        <div class="row center">${item.hint ? '<button type="button" class="btn ghost" data-a="hint">Hint</button>' : ''}${opt.skip ? '<button type="button" class="btn ghost" data-a="skip">Skip, review later</button>' : ''}${kind !== 'text' && !item.practice ? '<button type="button" class="btn ghost" data-a="similar" hidden>Try a similar one</button>' : ''}<button type="button" class="btn" data-a="next" hidden>${R.i === R.list.length - 1 ? 'See results' : 'Next'}</button></div>`;
      addPad(ctx, () => plainText(item.q));
      const inp = $('input', P), err = $('.err', P), why = $('.why', P), next = $('[data-a="next"]', P), hb = $('[data-a="hint"]', P);
      inp.focus();
      const sk = $('[data-a="skip"]', P);
      const sim = $('[data-a="similar"]', P);
      const done = (pt, missed) => {
        inp.disabled = true; $('form button', P).disabled = true; if (hb) hb.hidden = true; if (sk) sk.hidden = true; next.hidden = false; next.focus();
        if (item.why) steps(why, item.why, missed);
        if (missed && !item.practice) {
          let pic = null; try { pic = window.SBPad && SBPad.thumbnail ? SBPad.thumbnail() : null; } catch (e) {}   // "show my work": what was on the scratch pad
          R.missed.push({ q: plainText(item.q), a: shown(item), say: item.say || '', pic });
          if (ctx.miss) ctx.miss(plainText(item.q) + ' (answer: ' + plainText(String(shown(item))) + ')');
          if (sim) sim.hidden = false;
        }
        if (opt.onAnswer && !item.practice) opt.onAnswer(item, !!pt);
      };
      if (sim) sim.onclick = () => {                            // a fresh problem of the same kind, for practice (no score, no credit)
        const fresh = opt.build().find(x => plainText(x.q) !== plainText(item.q)); if (!fresh) return;
        R.list.splice(R.i + 1, 0, Object.assign({}, fresh, { practice: true })); R.i++; show();
      };
      const typed = $('.typed', P);
      if (typed) inp.addEventListener('input', () => { const f = parseFrac(stripUnit(inp.value).v); typed.innerHTML = inp.value.trim() && f ? 'You typed ' + fracHTML(f) : ''; });
      $$('[data-k]', P).forEach(b => b.onclick = () => { const k = b.dataset.k, st0 = inp.selectionStart ?? inp.value.length, en = inp.selectionEnd ?? st0;
        if (k === 'back') { const a = st0 === en ? Math.max(0, st0 - 1) : st0; inp.value = inp.value.slice(0, a) + inp.value.slice(en); inp.setSelectionRange(a, a); }
        else { inp.value = inp.value.slice(0, st0) + k + inp.value.slice(en); inp.setSelectionRange(st0 + 1, st0 + 1); }
        inp.dispatchEvent(new Event('input')); });
      inp.oninput = () => { inp.classList.remove('bad'); err.textContent = ''; };
      if (hb) hb.onclick = () => { R.hinted = true; err.style.color = 'var(--ink2)'; err.textContent = item.hint; inp.focus(); };
      $('form', P).onsubmit = e => {
        e.preventDefault();
        const v = inp.value.trim();
        if (!v) { inp.classList.add('bad'); err.style.color = ''; err.textContent = 'Type an answer first.'; return; }
        let r = check(item, v), unitNote = '';
        if (r === 'bad' && kind !== 'text') { const su = stripUnit(v); if (su.unit) { r = check(item, su.v); if (r !== 'bad') unitNote = ' (No units needed next time, just the number.)'; } }
        if (r === 'bad') { inp.classList.add('bad'); err.style.color = ''; err.textContent = kind === 'fraction' ? 'Type a fraction like 3/4, a mixed number like 1 3/4, or a whole number like 1,200.' : 'Type a number, like 4,000 or 2.5.'; return; }
        const nudge = { decimal: 'That is the right amount! Now write it as a fraction or a mixed number, like 2 1/2.', unreduced: 'That is the right amount, but not in simplest form. Reduce it and try again.', whole: 'That is the right amount! Write it as a whole number.', wantMixed: 'That is the right amount! Now write it as a mixed number, like 1 3/4.', wantImproper: 'That is the right amount! Now write it as an improper fraction, like 7/4.' }[r];
        if (nudge) { inp.classList.add('bad'); err.style.color = ''; err.textContent = nudge; return; }
        if (r === 'case') { inp.classList.add('bad'); err.style.color = ''; err.textContent = 'Almost! Check the capital and small letters, then try again.'; return; }
        if (r === 'ok' || r === 'close') {
          const pt = !R.hinted && R.tries === 0 && !item.practice; if (pt) R.score++;
          if (!item.practice) ctx.credit(); ctx.sfx.good(); err.style.color = 'var(--good-ink)';
          err.textContent = (r === 'close' ? 'Close enough! It is spelled ' + shown(item) + '.' : 'Correct! ' + shown(item) + '.') + unitNote + (R.hinted ? ' (Hint used, so no point.)' : '');
          done(pt, !pt && (R.hinted || R.tries > 0));
        } else {
          R.tries++; if (!item.practice) ctx.slip(); ctx.sfx.bad(); inp.classList.add('bad'); err.style.color = '';
          if (R.tries >= 2) { err.textContent = 'The answer is ' + shown(item) + '.'; done(false, true); }
          else err.textContent = 'Not quite. Try again.';
        }
      };
      if (sk) sk.onclick = () => {                              // not sure? show the answer, mark it for review, and move on (no point, no streak change)
        err.style.color = 'var(--ink2)'; err.textContent = 'Marked for review. The answer is ' + shown(item) + '.'; done(false, true);
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
    addPad(ctx, () => plainText(opt.title || 'Put in order') + '. ' + plainText(opt.lead || 'Put the cards in the right order.'));
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
        <span class="onum">${i + 1}</span>${marks ? `<span class="omark" aria-hidden="true">${marks[i] ? CHECK : CROSS}</span><span class="sr-only">${marks[i] ? 'In the right place.' : 'Not in the right place.'}</span>` : ''}<span class="otext"><b>${esc(it.text)}</b>${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</span>
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
  /* Lenient on purpose: curly quotes (phones type them) count as straight ones, a keyword can sit inside a longer word
     ("elect" finds "elected"), "B.C." does not end a sentence, and a sentence needs only 3 words. */
  const ABBR = /(?:\b(?:b\.c|a\.d|b\.c\.e|c\.e|mr|mrs|ms|dr|st|vs|etc)\.)$/i;
  function splitSentences(text) {
    const raw = text.replace(/([.!?])\s+/g, '$1\u0000').split('\u0000').map(x => x.trim()).filter(Boolean), out = [];   // no lookbehind: Safari before 16.4 cannot read it, and the whole file would fail
    // "In 753 B.C. Rome began." stays one sentence: a short piece after a date abbreviation joins the one before it
    raw.forEach(piece => { const prev = out[out.length - 1]; if (prev && ABBR.test(prev) && (/^[a-z]/.test(piece) || piece.split(/\s+/).length < 3)) out[out.length - 1] = prev + ' ' + piece; else out.push(piece); });
    return out;
  }
  function gradeExplain(text, ex) {
    text = String(text).replace(/[\u2018\u2019\u02bc]/g, "'").replace(/[\u201c\u201d]/g, '"');
    const t = ' ' + text.toLowerCase().replace(/\s+/g, ' ') + ' ';
    const kw = k => String(k).toLowerCase().replace(/[\u2018\u2019\u02bc]/g, "'").replace(/[\u201c\u201d]/g, '"');
    const has = k => { k = kw(k); if (k.length > 4 || !/^[a-z]/.test(k)) return t.includes(k); let i = t.indexOf(k); while (i >= 0) { if (!/[a-z0-9]/.test(t[i - 1] || ' ')) return true; i = t.indexOf(k, i + 1); } return false; };   // "no." should not match "piano."
    const ideas = ex.ideas.map(idea => ({ label: idea.label, ok: idea.all.every(group => group.some(has)) }));
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
        $('[data-a="again"]', P).onclick = start; const ag = $('[data-a="again"]', P); if (P.dataset.sbFocus) ag.focus({ preventScroll: true }); return;
      }
      const ex = X.list[X.i]; X.checked = false;
      P.innerHTML = `<h2>${esc(opt.title || 'Explain it')}</h2><p class="lead">${esc(opt.lead || 'Answer in complete sentences, then check your answer.')}</p>
        <div class="roundbar"><div class="bar" aria-hidden="true"><i style="width:${X.i / X.list.length * 100}%"></i></div><span class="hint">Question ${X.i + 1} of ${X.list.length} &middot; Complete ${X.score}</span></div>
        <div class="xgrid"><div>
          <div class="row qrow left"><p class="qline">${esc(ex.q)}</p>${ctx.sayButton(ex.q, 'Hear the question')}</div>
          <textarea class="answer" rows="5" aria-label="Your answer" placeholder="Write your answer here."></textarea>
          <div class="row"><button class="btn" data-a="check">Check my answer</button><button class="btn" data-a="next" hidden>${X.i === X.list.length - 1 ? 'See results' : 'Next question'}</button></div>
        </div><div class="feedback" hidden></div></div>`;
      addPad(ctx, () => ex.q);
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

  /* n different questions for a round (the same problem should not come up twice): many(makeOne, 10) */
  /* 3/4 x 8 and 8 x 3/4 are the same question for this purpose (a sum or product with only that one operation) */
  const twinKey = q => { const c = String(q.chk || ''); if (!c) return ''; for (const op of ['*', '+']) { const parts = c.split(op); if (parts.length > 1 && !/[-:*+]/.test(parts.join(''))) return op + parts.map(x => x.trim()).sort().join(op) + '|' + (q.form || '') + '|' + (q.a || ''); } return ''; };
  const many = (fn, n = 10) => { const out = [], seen = new Set(); for (let i = 0; out.length < n && i < 400; i++) { const q = fn(), k = (q.q || '') + '|' + (q.html || '') + '|' + (q.qh || ''), t = twinKey(q); if (!seen.has(k) && !(t && seen.has(t))) { seen.add(k); if (t) seen.add(t); out.push(q); } } return out; };
  window.SBT = { loadPad, padTab, judge, stripUnit, many, flashcards, sort, quiz, answer, order, explain, gradeExplain, shuffle, starsHTML, setMsg };
})();
