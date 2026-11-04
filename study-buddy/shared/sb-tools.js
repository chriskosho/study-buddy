/* Study Buddy shared tools: ready-made activities that any module can fill with its own content.
   Each builder takes the ctx that SBM.start passes to a tool's init(ctx), plus content and options.

     SBT.flashcards(ctx, { lead, modes: [{ id, label }], build(modeId) -> [{ front, back, say }] })
         front/back are HTML; say is spoken when the card shows (only if Read aloud is on).
         Result: cards known on the first try out of the deck size.
         Optional onSection(sectionId) is called when a section opens (to remember it).
         Optional sections: { list: [{ id, label, group?, noStep? }], start?: id, noun?: 'section' } adds a section menu with
         Previous and Next buttons; build(modeId, sectionId) then returns that section's cards. group puts the entry under a menu heading.

     SBT.sort(ctx, { lead, sets: [{ id, label, buckets: [{ id, name, html? }], items: [{ text, b }] (or make() returning items, called each round), perBucket? }],
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

  /* ---------------- Notepad button (called the Scratch pad until November 2026) ----------------
     Every question tool (type the answer, multiple choice, sort, order, explain) can show a "Notepad" button.
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
  /* One Notepad button lives in the module's settings row (next to Sound, Read aloud and Reset), so it takes no room from the question.
     A tool calls addPad(ctx, getQuestionText) after it draws; the shell calls padTab(toolId) when a tool is shown, which hides the
     button on tools that have no pad (study guides, flashcards). */
  const PADS = {};
  function addPad(ctx, getQ) {
    if (!padOn(ctx)) return;
    const id = ctx.tool && ctx.tool.id; PADS[id] = getQ;
    let b = document.getElementById('sbPad');
    if (!b) {
      const host = document.querySelector('.settings'); if (!host) return;
      b = document.createElement('button'); b.type = 'button'; b.id = 'sbPad'; b.className = 'iconbtn padbtn'; b.setAttribute('aria-label', 'Open the notepad'); b.innerHTML = PAD_ICON + '<span>Notepad</span>';
      b.onclick = () => { const q = PADS[b._cur] ? PADS[b._cur]() : ''; loadPad().then(() => SBPad.open({ question: q, source: b._mod || '', opener: b }), () => SB.toast('The notepad could not load. Check the connection and try again.')); };
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
    const K = keep(ctx), SIG = sigOf('cards', opt, modes.map(m => m.id).join(',') + '|' + (SEC ? SEC.list.map(e => e.id).join(',') : ''));
    const keyOf = c => hashStr(c.front + '|' + c.back);
    /* one deck in progress for each card type and section, kept as the hashes of the cards left; switching back picks it up again */
    let decks = {};
    const dkey = () => FC.mode + '|' + (FC.sec || '');
    const saveDeck = () => { if (FC.queue.length) decks[dkey()] = { q: FC.queue.map(keyOf), m: [...FC.missed].map(keyOf), total: FC.total }; else delete decks[dkey()]; K.save({ v: RV, sig: SIG, mode: FC.mode, sec: FC.sec, decks }); };
    const secMenu = () => { if (!SEC) return ''; const groups = []; SEC.list.forEach(e => { const g = e.group || ''; let o = groups.find(x => x.g === g); if (!o) groups.push(o = { g, items: [] }); o.items.push(e); });
      const optHtml = e => `<option value="${esc(e.id)}"${e.id === FC.sec ? ' selected' : ''}>${esc(e.label)}</option>`;
      return `<div class="secnav"><button class="btn ghost" data-a="prevsec" aria-label="Previous ${noun}">&lsaquo;</button><select class="secsel" aria-label="Jump to a ${noun}">${groups.map(o => o.g ? `<optgroup label="${esc(o.g)}">${o.items.map(optHtml).join('')}</optgroup>` : o.items.map(optHtml).join('')).join('')}</select><button class="btn ghost" data-a="nextsec" aria-label="Next ${noun}">&rsaquo;</button></div>`; };
    P.innerHTML = `<h2>${esc(opt.title || 'Flashcards')}</h2><p class="lead">${esc(opt.lead || 'Tap the card to flip it. Be honest: did you know it? Cards you miss come back again.')}<span class="swipe-tip"> Swipe right if you knew it, left if you are still learning.</span></p>
      <div class="deckbar">${secMenu()}${modes.length > 1 ? `<div class="seg" role="group" aria-label="Card type">${modes.map((m, i) => `<button data-m="${esc(m.id)}" aria-pressed="${i === 0}">${esc(m.label)}</button>`).join('')}</div>` : ''}
        <div class="bar" aria-hidden="true"><i></i></div><span class="hint count"></span><button class="btn ghost undo" data-a="undo" disabled>Undo</button><button class="btn ghost undo" data-a="restartdeck">Start over</button></div>
      <div class="cardzone"><div class="cardstage"><div class="fcard" role="button" tabindex="0" aria-describedby="sbFlipTip"><span class="sr-only" id="sbFlipTip">Press to flip the card.</span><div class="face front" aria-live="polite"></div><div class="face back" aria-hidden="true" aria-live="polite"></div></div></div></div>
      <div class="row center cardbtns"><button class="btn warn" data-a="again">Still learning</button><button class="btn ghost" data-a="skip">Skip</button><button class="btn good" data-a="knew">I knew it</button></div>`;
    const card = $('.fcard', P), F = $('.front', P), B = $('.back', P);
    const flip = on => { FC.flipped = on; card.classList.toggle('flip', on); F.setAttribute('aria-hidden', String(on)); B.setAttribute('aria-hidden', String(!on)); };
    const bar = () => { const done = FC.total - FC.queue.length; $('.bar i', P).style.width = (FC.total ? done / FC.total * 100 : 0) + '%'; $('.count', P).textContent = done + ' of ' + FC.total + ' done'; $('[data-a="undo"]', P).disabled = !FC.hist.length; };
    const secIdx = () => SEC.list.findIndex(e => e.id === FC.sec);
    const secStep = d => { for (let i = secIdx() + d; i >= 0 && i < SEC.list.length; i += d) if (!SEC.list[i].noStep) return i; return -1; };   // entries with noStep (like "All") are in the menu but skipped by the arrows
    function syncSec() { if (!SEC) return; $('.secsel', P).value = FC.sec; $('[data-a="prevsec"]', P).disabled = secStep(-1) < 0; $('[data-a="nextsec"]', P).disabled = secStep(1) < 0; }
    const deckBusy = () => !!FC.cur && (FC.total - FC.queue.length > 0 || FC.missed.size > 0 || FC.hist.length > 0);
    const askDeck = (go, text, cancel) => deckBusy() ? SB.confirm({ title: 'Start over?', text: text || 'This starts the deck again.', ok: 'Start over' }, go, cancel) : go();
    function build(fresh) {
      FC.busy = false; FC.hist = [];
      const d = !fresh && decks[dkey()], deck = opt.build(FC.mode, FC.sec), byKey = d ? new Map(deck.map(c => [keyOf(c), c])) : null;
      if (d && Array.isArray(d.q) && d.q.length && d.q.every(k => byKey.has(k))) { FC.queue = d.q.map(k => byKey.get(k)); FC.missed = new Set((d.m || []).map(k => byKey.get(k)).filter(Boolean)); FC.total = Math.max(d.total || 0, FC.queue.length); }
      else { FC.missed = new Set(); FC.queue = deck; FC.total = FC.queue.length; }   // a deck made fresh each time (random cards) just starts again
      syncSec(); if (SEC && opt.onSection) opt.onSection(FC.sec); next();
    }
    function next() {
      SB.stopSpeech(); flip(false);
      if (!FC.queue.length) {
        const nm = FC.missed.size;
        F.innerHTML = `<div class="tag">Deck complete</div><div class="big">Great work!</div><div class="small">You went through all ${FC.total} cards.${SEC ? ' Use the arrows to open the next ' + noun + ', or go again.' : ''}</div>
          <div class="row center deckagain"><button type="button" class="btn ghost small" data-a="again-all">Go again</button>${nm ? `<button type="button" class="btn small" data-a="again-missed">Just the ${nm === 1 ? 'one' : nm} I missed</button>` : ''}</div>`;
        B.innerHTML = ''; FC.cur = null; ctx.sfx.win(); bar(); saveDeck();
        const hadFocus = document.activeElement === card;
        card.removeAttribute('role'); card.tabIndex = -1; card.removeAttribute('aria-describedby');   // the finished card holds real buttons, so it is no longer one big button itself
        if (hadFocus) $('[data-a="again-all"]', F).focus();
        $('[data-a="again-all"]', F).onclick = e => { e.stopPropagation(); build(true); };
        const am = $('[data-a="again-missed"]', F); if (am) am.onclick = e => { e.stopPropagation(); const cards = [...FC.missed]; FC.missed = new Set(); FC.hist = []; FC.queue = shuffle(cards); FC.total = FC.queue.length; next(); };
        return;
      }
      const c = FC.cur = FC.queue[0];
      card.setAttribute('role', 'button'); card.tabIndex = 0; card.setAttribute('aria-describedby', 'sbFlipTip');
      F.innerHTML = c.front; B.innerHTML = c.back; if (c.say) ctx.say(c.say); bar(); saveDeck();
    }
    const afterUnflip = fn => { if (FC.busy) return; if (!FC.flipped) return fn(); FC.busy = true; flip(false); setTimeout(() => { FC.busy = false; fn(); }, FLIP_MS); };
    const doFlip = () => { if (!FC.cur || FC.busy) return; flip(!FC.flipped); SB.stopSpeech(); };
    card.addEventListener('click', doFlip);
    card.addEventListener('keydown', e => { if (e.target !== card) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doFlip(); } });   // keys on the buttons inside a finished card work as usual
    const zone = $('.cardzone', P);
    const snap = () => { FC.hist.push({ q: FC.queue.slice(), m: new Set(FC.missed) }); if (FC.hist.length > 300) FC.hist.shift(); };
    const undo = () => { if (FC.busy || !FC.hist.length) return; afterUnflip(() => { const h = FC.hist.pop(); FC.queue = h.q; FC.missed = h.m; next(); SB.cardToast(zone, 'Undone'); }); };
    $('[data-a="knew"]', P).onclick = () => { if (!FC.cur) return build(true); afterUnflip(() => { snap(); FC.queue.shift(); ctx.sfx.good(); next(); SB.cardToast(zone, 'Knew it', undo); }); };
    $('[data-a="again"]', P).onclick = () => { if (!FC.cur) return build(true); afterUnflip(() => { snap(); const c = FC.queue.shift(); FC.missed.add(c); FC.queue.splice(Math.min(FC.queue.length, 3 + Math.floor(Math.random() * 3)), 0, c); ctx.sfx.bad(); next(); SB.cardToast(zone, 'Still learning', undo); }); };
    $('[data-a="skip"]', P).onclick = () => { if (!FC.cur) return build(true); afterUnflip(() => { snap(); FC.queue.push(FC.queue.shift()); next(); SB.cardToast(zone, 'Skipped', undo); }); };
    $('[data-a="undo"]', P).onclick = undo;
    const onKey = e => { if (!card.isConnected) return document.removeEventListener('keydown', onKey); if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !/^(INPUT|SELECT|TEXTAREA)$/.test((e.target || {}).tagName || '') && P.offsetParent) { e.preventDefault(); undo(); } };
    document.addEventListener('keydown', onKey);
    if (SEC) {
      const go = i => { if (FC.busy || i < 0) return; FC.sec = SEC.list[i].id; build(); };   // each section keeps its own deck in progress
      $('.secsel', P).onchange = e => { FC.sec = e.target.value; build(); };
      $('[data-a="prevsec"]', P).onclick = () => go(secStep(-1));
      $('[data-a="nextsec"]', P).onclick = () => go(secStep(1));
    }
    SB.swipeCard($('.cardstage', P), card, { onRight: () => $('[data-a="knew"]', P).click(), onLeft: () => $('[data-a="again"]', P).click() });
    $$('.seg button', P).forEach(b => b.onclick = () => { if (FC.mode === b.dataset.m) return; FC.mode = b.dataset.m; $$('.seg button', P).forEach(x => x.setAttribute('aria-pressed', x === b)); build(); });   // each card type keeps its own deck
    $('[data-a="restartdeck"]', P).onclick = () => { if (FC.busy) return; askDeck(() => afterUnflip(() => build(true)), 'This puts every card back in the deck.'); };
    /* pick up where it was left: the same card type and section, and the deck in progress for each */
    const sv = K.load();
    if (sv && sv.v === RV && sv.sig === SIG && sv.decks && typeof sv.decks === 'object') {
      decks = sv.decks;
      if (modes.some(m => m.id === sv.mode)) { FC.mode = sv.mode; $$('.seg button', P).forEach(x => x.setAttribute('aria-pressed', x.dataset.m === FC.mode)); }
      if (SEC && SEC.list.some(e => e.id === sv.sec)) FC.sec = sv.sec;
    }
    build();
  }

  /* ---------------- Sort it ---------------- */
  function sort(ctx, opt) {
    const P = ctx.panel, sets = opt.sets, K = keep(ctx), SIG = sigOf('sort', opt, sets.map(s => s.id).join(','));
    const S = { set: sets[0], sel: null, items: [], miss: 0, credited: [], hist: [], done: false };
    P.classList.add('sbt-sort');
    const right = opt.right || ((it, b) => 'Yes! That goes with ' + b.name + '.');
    const wrong = opt.wrong || (() => 'Not quite. Try another group.');
    P.innerHTML = `<h2>${esc(opt.title || 'Sort it')}</h2><p class="lead">${esc(opt.lead || 'Drag each one into its group, or tap it and then tap a group.')}</p>
      <div class="scorebar"><div class="stat"><b class="placed">0</b><span>Sorted</span></div><div class="stat"><b class="miss">0</b><span>Misses</span></div>
        ${sets.length > 1 ? `<div class="seg" role="group" aria-label="What to sort">${sets.map((s, i) => `<button data-s="${esc(s.id)}" aria-pressed="${i === 0}">${esc(s.label)}</button>`).join('')}</div>` : ''}</div>
      <div class="tray sortTray"></div><p class="msg">Pick one to begin.</p>
      <div class="buckets"></div>
      <div class="row" style="margin-top:14px"><button class="btn ghost" data-a="undo" disabled>Undo</button><button class="btn warn" data-a="restart">Start over</button></div>`;
    const msg = $('.msg', P), tray = $('.sortTray', P), bucketsEl = $('.buckets', P), undoB = $('[data-a="undo"]', P);
    addPad(ctx, () => plainText(opt.title || 'Sort it') + '. ' + plainText(opt.lead || 'Drag each one into its group.'));
    const bucketOf = id => S.set.buckets.find(b => b.id === id);
    const placed = () => S.items.filter(it => it.at).length;
    const save = () => { if (!S.done) K.save({ v: RV, sig: SIG, set: S.set.id, items: S.items, miss: S.miss, credited: S.credited, hist: S.hist }); };
    const score = () => { $('.placed', P).textContent = placed() + '/' + S.items.length; $('.miss', P).textContent = S.miss; undoB.disabled = !S.hist.length || S.done; };
    const syncSeg = () => $$('.seg button', P).forEach(x => x.setAttribute('aria-pressed', x.dataset.s === S.set.id));
    function select(chip) {
      S.sel = S.sel === chip ? null : chip;
      $$('.chip', tray).forEach(c => { c.classList.toggle('sel', c === S.sel); c.setAttribute('aria-pressed', String(c === S.sel)); });
      $$('.bucket', P).forEach(b => b.classList.toggle('ready', !!S.sel));
      if (S.sel) { setMsg(msg, 'Now tap the group for "' + S.sel.textContent + '".'); ctx.say(S.sel.textContent); }
    }
    function tryPlace(chip, bid) {
      if (!chip) return;
      const k = +chip.dataset.k, item = S.items[k], b = bucketOf(bid);
      if (item.b === bid) {
        item.at = bid; S.hist.push(k); S.sel = null;
        if (!S.credited.includes(k)) { S.credited.push(k); ctx.credit(); }       // putting a sorted one back and sorting it again gives no extra credit
        ctx.sfx.good(); setMsg(msg, right(item, b), 'good');
        draw();
        if (placed() === S.items.length && !S.done) {
          S.done = true; K.clear(); ctx.result(Math.max(0, S.items.length - S.miss), S.items.length); ctx.sfx.win();
          score(); setMsg(msg, S.miss === 0 ? 'Perfect! All ' + S.items.length + ' sorted with no misses.' : 'Done! All ' + S.items.length + ' sorted with ' + S.miss + ' miss' + (S.miss === 1 ? '' : 'es') + '.', 'good');
        } else save();
      } else {
        if (!S.credited.includes(k)) { S.miss++; ctx.slip(); } ctx.sfx.bad(); score(); save();   // a retry after Undo costs nothing
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
    function buckets() {
      const set = S.set;
      bucketsEl.style.gridTemplateColumns = `repeat(${set.buckets.length},minmax(0,1fr))`;
      bucketsEl.innerHTML = set.buckets.map(b => `<div class="bucket" data-b="${esc(b.id)}" role="button" tabindex="0" aria-label="${esc(b.name)} group">${b.html || `<span class="bname">${esc(b.name)}</span>`}<div class="got"></div></div>`).join('');
      $$('.bucket', P).forEach(bk => {
        bk.addEventListener('click', () => { if (S.sel) tryPlace(S.sel, bk.dataset.b); });
        bk.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && S.sel) { e.preventDefault(); tryPlace(S.sel, bk.dataset.b); } });
      });
    }
    /* draw the tray and the groups from S.items (each item: text, b, at = the group it was sorted into) */
    function draw() {
      $$('.bucket .got', P).forEach(g => g.innerHTML = '');
      S.hist.forEach(k => { const it = S.items[k]; if (!it.at) return; const got = $(`.bucket[data-b="${CSS.escape(it.at)}"] .got`, P); if (!got || got.querySelector(`[data-k="${k}"]`)) return; const b = bucketOf(it.at), s = document.createElement('span'); if (b && b.style) s.style.cssText = b.style; s.textContent = it.text; s.dataset.k = k; got.appendChild(s); });
      S.items.forEach((it, k) => { if (!it.at || $(`.bucket .got [data-k="${k}"]`, P)) return; const got = $(`.bucket[data-b="${CSS.escape(it.at)}"] .got`, P); if (!got) return; const s = document.createElement('span'); s.textContent = it.text; s.dataset.k = k; got.appendChild(s); });
      tray.innerHTML = '';
      S.items.forEach((it, k) => {
        if (it.at) return;
        const c = document.createElement('button'); c.className = 'chip'; c.type = 'button'; c.textContent = it.text; c.dataset.b = it.b; c.dataset.k = k;
        c.addEventListener('pointerdown', e => pointerDown(e, c));
        c.setAttribute('aria-pressed', 'false');
        c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(c); } });
        c.addEventListener('click', e => { if (e.detail === 0 && e.pointerType !== 'mouse') select(c); });   // screen readers and switch access send only a click (detail 0); pointer taps are handled above
        tray.appendChild(c);
      });
      $$('.bucket', P).forEach(x => x.classList.remove('ready'));
      score();
    }
    function round() {
      const set = S.set; S.sel = null; S.miss = 0; S.credited = []; S.hist = []; S.done = false;
      const pool = set.make ? set.make() : set.items;   // make(): a fresh set of items every time it starts
      S.items = shuffle(set.buckets.flatMap(b => { const mine = shuffle(pool.filter(it => it.b === b.id)); return set.perBucket ? mine.slice(0, set.perBucket) : mine; })).map(it => ({ text: it.text, b: it.b, at: null }));
      buckets(); draw(); setMsg(msg, 'Pick one to begin.'); save();
    }
    undoB.onclick = () => {                                       // put the last sorted one back in the tray (its credit stays; sorting it again gives none)
      if (!S.hist.length || S.done) return; const k = S.hist.pop(); S.items[k].at = null; S.sel = null;
      draw(); save(); setMsg(msg, '"' + S.items[k].text + '" is back in the pile. Sort it again.');
    };
    const any = () => !S.done && (S.hist.length > 0 || S.miss > 0);
    $$('.seg button', P).forEach(b => b.onclick = () => { const ns = sets.find(s => s.id === b.dataset.s); if (ns === S.set) return; askRestart(() => { S.set = ns; syncSeg(); round(); }, any()); });
    $('[data-a="restart"]', P).onclick = () => askRestart(round, any());
    const s = K.load(), ss = s && s.v === RV && s.sig === SIG && sets.find(x => x.id === s.set);
    if (ss && Array.isArray(s.items) && s.items.length && s.items.some(it => !it.at)) {
      S.set = ss; S.items = s.items; S.miss = s.miss || 0; S.credited = s.credited || []; S.hist = s.hist || []; syncSeg(); buckets(); draw(); setMsg(msg, 'Pick one to keep going.');
    } else round();
  }

  /* ---------------- Saved rounds, Back and Start over (owner's request, November 2026) ----------------
     Every question tool keeps its round in ctx.round (sb-module.js), saved after each answer, so switching tools, leaving the module, or the
     app reloading never loses an answer. A finished round is cleared, so the next visit starts a new one.
     Back goes to the previous question as a practice try: the first answer's point (or miss) stays, and the retry gives no credit.
     Start over (asks first once something is answered) clears the round and starts a new one. */
  const RV = 1;
  const keep = ctx => ctx.round && ctx.round.save ? ctx.round : { load() { return null; }, save() {}, clear() {} };
  const sigOf = (kind, opt, extra) => kind + '|' + (opt.title || '') + '|' + (extra == null ? '' : extra) + (opt.key ? '|' + opt.key : '');   // opt.key: anything else that changes the questions (a module switch)
  const roundBtns = canBack => `<span class="rbtns"><button type="button" class="btn ghost small" data-a="back"${canBack ? '' : ' disabled'}>Back</button><button type="button" class="btn ghost small" data-a="restart">Start over</button></span>`;
  function askRestart(go, any) {
    if (!any) return go();
    SB.confirm({ title: 'Start over?', text: 'This clears your answers in this round and starts a new one. Rounds you already finished keep their scores.', ok: 'Start over' }, go);
  }
  const practiceNote = ok => `<b>Practice try.</b> Your first answer (${ok ? 'right' : 'not right'}) is the one that counts. Try it again, or go on.`;
  const hashStr = s => { let h = 5381; s = String(s); for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) + s.length.toString(36); };

  /* ---------------- Multiple-choice quiz ---------------- */
  function quiz(ctx, opt) {
    const P = ctx.panel, n = opt.rounds || 10, K = keep(ctx), SIG = sigOf('quiz', opt, n);
    const Q = { qs: [], i: 0, rec: [], ord: [], mode: 'random', done: false };
    const score = () => Q.rec.filter(r => r && r.ok).length;
    const save = () => { if (!Q.done) K.save({ v: RV, sig: SIG, mode: Q.mode, qs: Q.qs, i: Q.i, rec: Q.rec, ord: Q.ord }); };
    /* opt.full() returns every question; when it is given, the quiz has a Random sample / Full switch (Full counts for mastery) */
    function start() {
      Q.qs = Q.mode === 'full' && opt.full ? shuffle(opt.full()) : (opt.keepOrder ? opt.build() : shuffle(opt.build())).slice(0, n);
      Q.i = 0; Q.rec = []; Q.ord = []; Q.done = false; save(); show();
    }
    const head = t => headWith(t, modeBar());
    function modeBar() {
      if (!opt.full) return '';
      const nf = opt.full().length;
      return `<div class="seg qmodes" role="group" aria-label="Quiz version"><button type="button" data-m="random" aria-pressed="${Q.mode === 'random'}">Random ${n}</button><button type="button" data-m="full" aria-pressed="${Q.mode === 'full'}">${esc(opt.fullLabel || 'Full')} (${nf})</button></div>`;
    }
    function wireModes() {
      $$('.qmodes button', P).forEach(b => b.onclick = () => { if (Q.mode === b.dataset.m) return; const m = b.dataset.m; askRestart(() => { Q.mode = m; start(); }, !Q.done && Q.rec.some(Boolean)); });
    }
    function show() {
      if (Q.i >= Q.qs.length) {
        const sc = score();
        if (!Q.done) { Q.done = true; K.clear(); ctx.result(sc, Q.qs.length, Q.mode); ctx.sfx.win(); }
        const missed = Q.rec.map((r, k) => r && !r.ok ? Q.qs[k] : null).filter(Boolean).map(q => ({ q: q.q, a: q.a, say: q.audio ? '' : (q.say || q.q), audio: q.audio || '' }));
        P.innerHTML = `${head(opt.title || 'Quiz')}<div class="result">${starsHTML(sc, Q.qs.length)}<p class="prompt">${sc} out of ${Q.qs.length}</p><p class="lead">${sc / Q.qs.length >= 0.9 ? 'Amazing! You really know this.' : sc / Q.qs.length >= 0.7 ? 'Great job. A little more practice and you will have it.' : 'Good start. Try the flashcards, then come back.'}</p>${reviewHTML(ctx, missed)}<button class="btn" data-a="again">Play again</button></div>`;
        wireModes(); $('[data-a="again"]', P).onclick = start; const ag = $('[data-a="again"]', P); if (P.dataset.sbFocus) ag.focus({ preventScroll: true }); return;
      }
      const q = Q.qs[Q.i], first = Q.rec[Q.i];
      if (!Q.ord[Q.i]) { Q.ord[Q.i] = shuffle([q.a, ...shuffle(q.wrong).slice(0, 3)]); save(); }
      const opts = Q.ord[Q.i]; let answered = false;
      P.innerHTML = `${head(opt.title || 'Quiz')}<p class="lead">${esc(opt.lead || 'Pick the best answer.')}</p>
        <div class="roundbar"><div class="bar" aria-hidden="true"><i style="width:${Q.i / Q.qs.length * 100}%"></i></div><span class="hint">Question ${Q.i + 1} of ${Q.qs.length} &middot; Score ${score()}</span>${roundBtns(Q.i > 0)}</div>
        <div class="qwrap"><div class="row qrow"><p class="qtext">${q.qh || esc(q.q)}</p>${ctx.sayButton(q.say || q.q, q.audio ? 'Hear the sound' : 'Hear the question', q.audio || '')}</div>${q.html || ''}
        <div class="opts">${opts.map((o, k) => `<button class="opt" data-v="${esc(o)}"><span class="optkey" aria-hidden="true">${k + 1}</span>${esc(o)}</button>`).join('')}</div>
        <p class="explain" aria-live="polite">${first ? practiceNote(first.ok) : ''}</p><div class="row center">${opt.skip && !first ? '<button class="btn ghost" data-a="skip">Skip, review later</button>' : ''}<button class="btn" data-a="next"${first ? '' : ' hidden'}>${Q.i === Q.qs.length - 1 ? 'See results' : 'Next question'}</button></div></div>`;
      wireModes();
      addPad(ctx, () => q.qh ? plainText(q.qh) : q.q);
      { const f = $('.opt', P); if (f && P.offsetParent && P.contains(document.activeElement) === false && (document.activeElement === document.body || !document.activeElement || P.dataset.sbFocus)) f.focus({ preventScroll: true }); P.dataset.sbFocus = '1'; }   // keyboard users stay in the quiz
      $$('.opt', P).forEach(b => b.onclick = () => {
        if (answered) return; answered = true;
        const skb = $('[data-a="skip"]', P); if (skb) skb.hidden = true;
        const ok = b.dataset.v === q.a;
        $$('.opt', P).forEach(x => { x.disabled = true; if (x.dataset.v === q.a) x.classList.add('right'); });
        if (!ok) b.classList.add('wrong');
        if (first) { ok ? ctx.sfx.good() : ctx.sfx.bad(); }                       // a practice try: no point, no credit, no streak change
        else {
          Q.rec[Q.i] = { ok, v: b.dataset.v }; save();
          if (ok) { ctx.credit(); ctx.sfx.good(); } else { ctx.slip(); ctx.sfx.bad(); if (ctx.miss) ctx.miss(plainText(String(q.q)) + ' (answer: ' + plainText(String(q.a)) + ')'); }
          if (opt.onAnswer) opt.onAnswer(q, ok);
          $('.roundbar .hint', P).innerHTML = `Question ${Q.i + 1} of ${Q.qs.length} &middot; Score ${score()}`;
        }
        $('.explain', P).innerHTML = (ok ? '<b style="color:var(--good-ink)">Correct!</b> ' : '<b style="color:var(--bad-ink)">Not quite.</b> ') + esc(q.why || ('The answer is: ' + q.a + '.')) + (first ? ' <span class="hint">(Practice: your first answer counts.)</span>' : '');
        const nx = $('[data-a="next"]', P); nx.hidden = false; nx.focus();
      });
      const sk = $('[data-a="skip"]', P);
      if (sk) sk.onclick = () => {                              // not sure? show the answer, mark it for review, and move on (no point, no streak change)
        if (answered) return; answered = true; sk.hidden = true;
        $$('.opt', P).forEach(x => { x.disabled = true; if (x.dataset.v === q.a) x.classList.add('right'); });
        Q.rec[Q.i] = { ok: false, skip: true }; save();
        if (opt.onAnswer) opt.onAnswer(q, false);
        $('.explain', P).innerHTML = '<b>Marked for review.</b> ' + esc(q.why || ('The answer is: ' + q.a + '.'));
        const nx = $('[data-a="next"]', P); nx.hidden = false; nx.focus();
      };
      $('[data-a="next"]', P).onclick = () => { Q.i++; save(); show(); };
      $('[data-a="back"]', P).onclick = () => { if (Q.i > 0) { Q.i--; save(); show(); } };
      $('[data-a="restart"]', P).onclick = () => askRestart(start, Q.rec.some(Boolean));
      if (!q.audio) ctx.say(q.say || q.q);
    }
    /* number keys 1 to 4 pick a choice (when the quiz is on screen and you are not typing somewhere) */
    const onKey = e => {
      if (!P.isConnected) return document.removeEventListener('keydown', onKey);
      if (!P.offsetParent || e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || '') || document.querySelector('.sb-ov') || (e.target && e.target.closest && e.target.closest('.sbp'))) return;   // not while working in the notepad
      const k = +e.key; if (!(k >= 1 && k <= 9)) return; const b = $$('.opt', P)[k - 1]; if (b && !b.disabled) { e.preventDefault(); b.click(); }
    };
    document.addEventListener('keydown', onKey);
    const s = K.load();
    if (s && s.v === RV && s.sig === SIG && Array.isArray(s.qs) && s.qs.length && s.i >= 0 && s.i < s.qs.length && (s.mode !== 'full' || opt.full)) {
      Object.assign(Q, { qs: s.qs, i: s.i, rec: Array.isArray(s.rec) ? s.rec : [], ord: Array.isArray(s.ord) ? s.ord : [], mode: s.mode || 'random', done: false }); show();
    } else start();
  }

  /* a tool heading; when the tool has a Full version the Random / Full switch sits on the same row, so the page stays short */
  const headWith = (title, bar) => bar ? `<div class="qhead"><h2>${esc(title)}</h2>${bar}</div>` : `<h2>${esc(title)}</h2>`;

  /* one flashcard for each question of a Full quiz (question on the front, answer on the back), so everything the Full quiz asks has a card */
  function quizCards(ctx, items) {
    return shuffle(items.slice()).map(q => ({
      front: `<div class="tag">Quiz question</div><div class="defline">${q.qh || esc(q.q)}</div>${q.html || ''}`,
      back: `<div class="tag">Answer</div><div class="defline">${esc(q.a)}</div>${q.why ? `<div class="exl">${esc(q.why)}</div>` : ''}${ctx.sayButton((q.say || plainText(String(q.qh || q.q))) + '. ' + q.a, 'Hear it')}`,
      say: q.say || plainText(String(q.qh || q.q)) }));
  }

  /* ---------------- Type the answer ---------------- */
  const gcdI = (a, b) => b ? gcdI(b, a % b) : Math.abs(a);
  /* "3/4", "1 3/4" or "2" -> { n, d } (improper); mixed numbers also carry w, fn, fd. null when it is not a fraction */
  const VULGAR = { '½': ' 1/2', '⅓': ' 1/3', '⅔': ' 2/3', '¼': ' 1/4', '¾': ' 3/4', '⅕': ' 1/5', '⅖': ' 2/5', '⅗': ' 3/5', '⅘': ' 4/5', '⅙': ' 1/6', '⅚': ' 5/6', '⅛': ' 1/8', '⅜': ' 3/8', '⅝': ' 5/8', '⅞': ' 7/8' };
  /* what a student might type around a number: a unit word ("3/4 cup", "1,728 cubic feet"), "1-3/4", "1 and 3/4", ½, thousands commas */
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

  /* Stacked fraction entry: a small box for the whole number, then a top box over a bar over a bottom box.
     .fbox.value reads like "1 3/4", "3/4" or "2" (or "3/" while the bottom is missing), so the judge and the calculators can use it as text. */
  const fracBox = (label, v = '') => { const t = String(v).trim(), m = t.match(/^(?:(\d+) )?(\d+)\/(\d+)$/), L = esc(label), w = m ? m[1] || '' : /^\d+$/.test(t) ? t : '', n = m ? m[2] : '', d = m ? m[3] : '';
    const box = (cls, aria, val) => `<input class="${cls}" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="${cls === 'fx-w' ? 7 : 5}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${L}, ${aria}" value="${val}">`;
    return `<span class="fbox" role="group" aria-label="${L}">${box('fx-w', 'whole number (leave empty if there is none)', w)}<span class="fstack">${box('fx-n', 'top number', n)}<span class="fline" aria-hidden="true"></span>${box('fx-d', 'bottom number', d)}</span></span>`; };
  function wireFrac(root) {
    $$('.fbox', root).forEach(el => {
      const [w, n, d] = ['.fx-w', '.fx-n', '.fx-d'].map(k => $(k, el));
      Object.defineProperty(el, 'value', { configurable: true,
        get: () => { const a = w.value.trim(), b = n.value.trim(), c = d.value.trim(); return !b && !c ? a : (a ? a + ' ' : '') + b + '/' + c; },
        set: v => { const t = String(v).trim(); let m; w.value = n.value = d.value = '';
          if ((m = t.match(/^(?:(\d+) )?(\d+)\/(\d+)$/))) { w.value = m[1] || ''; n.value = m[2]; d.value = m[3]; } else if ((m = t.match(/^(\d+)$/))) w.value = m[1]; } });
      const fit = i => { i.style.width = i.value.length > 3 ? `calc(${i.value.length}ch + 40px)` : ''; };   // long numbers (volumes) get a wider box
      el.addEventListener('input', e => { if (e.target.matches('input')) { e.target.value = e.target.value.replace(/\D/g, ''); fit(e.target); } });
      [w, n, d].forEach(fit);
    });
  }
  /* fractions written in plain text ("3/4", "1 3/4") drawn the traditional way, with the line between top and bottom */
  const stackText = t => esc(String(t)).replace(/(?:(\d+) )?(\d+)\/(\d+)/g, (m, w, n, d) => { const f = `<span class="frac"><span class="fn">${n}</span><span class="fd">${d}</span></span>`; return w ? `<span class="mixed" data-s="${w} ${n}/${d}"><b>${w}</b>${f}</span>` : f.replace('class="frac"', `class="frac" data-s="${n}/${d}"`); });   // data-s keeps the plain text (for tests and copying)
  const fracHTML = f => f.w != null && f.fn ? `<span class="mixed"><b>${f.w}</b><span class="frac"><span class="fn">${f.fn}</span><span class="fd">${f.fd}</span></span></span>`
    : f.d === 1 ? `<b>${f.n}</b>` : f.dec ? `<b>${(f.n / f.d)}</b>` : `<span class="frac"><span class="fn">${f.n}</span><span class="fd">${f.d}</span></span>`;
  /* the explanation after a miss comes one step at a time ("Show the next step"); after a right answer it shows whole */
  function steps(el, text, missed, fr) {
    const E = fr ? stackText : esc;
    const parts = String(text).replace(/([.!?]+["')]?)\s+/g, '$1\u0000').split('\u0000').map(x => x.trim()).filter(Boolean);   // a step ends at . ! or ? and a space, so 3.45 stays whole
    if (!missed || parts.length < 3) { el.innerHTML = E(text); return; }
    let k = 1; const draw = () => { el.innerHTML = E(parts.slice(0, k).join(' ').trim()) + (k < parts.length ? ' <button type="button" class="btn ghost small stepbtn">Show the next step</button>' : '');
      const b = el.querySelector('.stepbtn'); if (b) b.onclick = () => { k++; draw(); const nb = el.querySelector('.stepbtn'); (nb || el).focus && (nb ? nb.focus() : null); }; };
    draw();
  }
  /* the questions missed in a round, folded away under the result so the screen still fits */
  function reviewHTML(ctx, missed) {
    if (!missed.length) return '';
    return `<details class="review"><summary>See the ${missed.length === 1 ? 'one' : missed.length} to practice</summary><ul>${missed.map(m => `<li>${m.pic ? `<img src="${m.pic}" alt="Your notepad work" class="revpic">` : ''}<span class="revq">${esc(m.q)}</span><span class="reva">Answer: <b>${m.fr ? stackText(m.a) : esc(m.a)}</b></span>${m.audio ? ctx.sayButton(String(m.a), 'Hear the sound again', m.audio) : m.say ? ctx.sayButton(m.say + '. The answer is ' + m.a + '.', 'Hear it') : ''}</li>`).join('')}</ul></details>`;
  }
  function answer(ctx, opt) {
    const P = ctx.panel, n = opt.rounds || 10, kind = opt.kind || 'text', K = keep(ctx), SIG = sigOf('answer', opt, n + '|' + kind);
    const R = { list: [], i: 0, rec: [], tb: {}, tries: 0, hinted: false, mode: 'random', done: false };   // tb: wrong tries and hints for each question, by number
    const pics = {};                                             // notepad pictures for the review list (kept for this visit only)
    /* opt.full() returns every question (for math, one of each type): adds a Random / Full switch; Full counts for mastery */
    const modeBar = () => opt.full ? `<div class="seg qmodes" role="group" aria-label="Quiz version"><button type="button" data-m="random" aria-pressed="${R.mode === 'random'}">Random ${n}</button><button type="button" data-m="full" aria-pressed="${R.mode === 'full'}">${esc(opt.fullLabel || 'Full')} (${opt.full().length})</button></div>` : '';
    const head = t => headWith(t, modeBar());
    const anyDone = () => R.rec.some((r, k) => r && !(R.list[k] || {}).practice);
    const wireModes = () => $$('.qmodes button', P).forEach(b => b.onclick = () => { if (R.mode === b.dataset.m) return; const m = b.dataset.m; askRestart(() => { R.mode = m; start(); }, !R.done && anyDone()); });
    const real = () => R.list.filter(x => !x.practice), numNow = () => R.list.slice(0, R.i + 1).filter(x => !x.practice).length;   // practice questions (Try a similar one) do not count
    const score = () => R.rec.filter((r, k) => r && r.pt && !(R.list[k] || {}).practice).length;
    const check = (item, v) => judge(item, v, kind, opt);
    const shown = item => item.show || (kind === 'fraction' ? String(item.a) : kind === 'number' ? Number(item.a).toLocaleString('en-US', { maximumFractionDigits: 10 }) : [].concat(item.a)[0]);
    const save = () => { if (!R.done) K.save({ v: RV, sig: SIG, mode: R.mode, list: R.list, i: R.i, rec: R.rec, tb: R.tb }); };
    function start() { R.list = R.mode === 'full' && opt.full ? shuffle(opt.full()) : opt.build().slice(0, n); R.i = 0; R.rec = []; R.tb = {}; R.done = false; R.tries = 0; R.hinted = false; save(); show(); }
    function show() {
      if (R.i >= R.list.length) {
        const total = real().length, sc = score();
        if (!R.done) { R.done = true; K.clear(); ctx.result(sc, total, R.mode); ctx.sfx.win(); }
        const missed = R.list.map((item, k) => { const r = R.rec[k]; return r && r.missed && !item.practice ? { q: plainText(item.q), a: shown(item), say: item.say || '', pic: pics[k] || null, fr: kind === 'fraction' } : null; }).filter(Boolean);
        P.innerHTML = `${head(opt.title || 'Type the answer')}<div class="result">${starsHTML(sc, total)}<p class="prompt">${sc} out of ${total}</p><p class="lead">${sc / total >= 0.8 ? 'Excellent work!' : 'Good practice. Read the explanations, then try another round.'}</p>${reviewHTML(ctx, missed)}<button class="btn" data-a="again">Play again</button></div>`;
        wireModes(); $('[data-a="again"]', P).onclick = start; const ag = $('[data-a="again"]', P); if (P.dataset.sbFocus) ag.focus({ preventScroll: true }); return;
      }
      const item = R.list[R.i], first = R.rec[R.i], retry = !!first, free = item.practice || retry, tot = real().length;
      const tb = !retry && R.tb[R.i]; R.tries = tb ? tb.tries || 0 : 0; R.hinted = tb ? !!tb.hinted : false;   // a wrong try or a hint is remembered, even after Back or leaving
      P.innerHTML = `${head(opt.title || 'Type the answer')}<p class="lead">${esc(opt.lead || 'Type your answer, then press Check.')}</p>
        <div class="roundbar"><div class="bar" aria-hidden="true"><i style="width:${R.i / R.list.length * 100}%"></i></div><span class="hint">${item.practice ? 'Practice: a similar one, no score' : `Question ${numNow()} of ${tot} &middot; Score ${score()}`}</span>${roundBtns(R.i > 0)}</div>
        <div class="row qrow"><p class="qtext">${item.q}</p>${item.say ? ctx.sayButton(item.say, 'Hear it') : ''}</div>
        <form class="spellrow" autocomplete="off"><span class="spellbox">${kind === 'fraction' ? fracBox('Your answer') : `<input aria-label="Your answer" placeholder="Answer" ${kind === 'number' ? 'inputmode="decimal"' : 'autocapitalize="off" autocorrect="off"'} spellcheck="false">`}<button class="btn" type="submit">Check</button></span></form>
        <div class="err" role="alert"></div><p class="explain why"></p>
        <div class="row center">${item.hint ? '<button type="button" class="btn ghost" data-a="hint">Hint</button>' : ''}${opt.skip && !free ? '<button type="button" class="btn ghost" data-a="skip">Skip, review later</button>' : ''}${kind !== 'text' && !item.practice && !retry ? '<button type="button" class="btn ghost" data-a="similar" hidden>Try a similar one</button>' : ''}<button type="button" class="btn" data-a="next"${retry ? '' : ' hidden'}>${R.i === R.list.length - 1 ? 'See results' : 'Next'}</button></div>`;
      wireModes();
      addPad(ctx, () => plainText(item.q));
      const fb = kind === 'fraction' ? $('.fbox', P) : null; if (fb) wireFrac(P);
      const inp = fb ? { get value() { return fb.value; }, set value(x) { fb.value = x; }, classList: fb.classList, focus() { $(item.form === 'mixed' ? '.fx-w' : '.fx-n', fb).focus(); }, set disabled(x) { $$('input', fb).forEach(i => { i.disabled = x; }); }, set oninput(f) { fb.addEventListener('input', f); } } : $('input', P);
      const setErr = t => { if (fr) err.innerHTML = stackText(t); else err.textContent = t; }, fr = kind === 'fraction';
      const err = $('.err', P), why = $('.why', P), next = $('[data-a="next"]', P), hb = $('[data-a="hint"]', P);
      if (retry && !item.practice) { err.style.color = 'var(--ink2)'; err.innerHTML = practiceNote(!!first.pt); }
      else if (R.hinted && item.hint) { err.style.color = 'var(--ink2)'; setErr(item.hint); }
      else if (R.tries > 0) setErr('Not quite. Try again.');
      inp.focus();
      const sk = $('[data-a="skip"]', P);
      const sim = $('[data-a="similar"]', P);
      const done = (pt, missed) => {
        inp.disabled = true; $('form button', P).disabled = true; if (hb) hb.hidden = true; if (sk) sk.hidden = true; next.hidden = false; next.focus();
        if (item.why) steps(why, item.why, missed, fr);
        if (!free) {
          R.rec[R.i] = { pt: !!pt, missed: !!missed };
          if (missed) {
            try { pics[R.i] = window.SBPad && SBPad.thumbnail ? SBPad.thumbnail() : null; } catch (e) {}   // "show my work": what was on the notepad
            if (ctx.miss) ctx.miss(plainText(item.q) + ' (answer: ' + plainText(String(shown(item))) + ')');
            if (sim) sim.hidden = false;
          }
          save();
          if (opt.onAnswer) opt.onAnswer(item, !!pt);
          $('.roundbar .hint', P).innerHTML = `Question ${numNow()} of ${tot} &middot; Score ${score()}`;
        } else if (item.practice && !first) { R.rec[R.i] = { p: 1 }; save(); }
      };
      if (sim) sim.onclick = () => {                            // a fresh problem of the same kind, for practice (no score, no credit)
        const fresh = opt.build().find(x => plainText(x.q) !== plainText(item.q)); if (!fresh) return;
        R.list.splice(R.i + 1, 0, Object.assign({}, fresh, { practice: true })); R.rec.splice(R.i + 1, 0, null); const t2 = {}; Object.keys(R.tb).forEach(k => { t2[+k > R.i ? +k + 1 : k] = R.tb[k]; }); R.tb = t2; R.i++; save(); show();
      };
      inp.oninput = () => { inp.classList.remove('bad'); setErr(''); };
      if (hb) hb.onclick = () => { R.hinted = true; if (!free) { R.tb[R.i] = { tries: R.tries, hinted: true }; save(); } err.style.color = 'var(--ink2)'; setErr(item.hint); inp.focus(); };
      $('form', P).onsubmit = e => {
        e.preventDefault();
        const v = inp.value.trim();
        if (fr && !!$('.fx-n', fb).value.trim() !== !!$('.fx-d', fb).value.trim()) { inp.classList.add('bad'); err.style.color = ''; setErr('Fill in both the top number and the bottom number of the fraction.'); return; }
        if (!v) { inp.classList.add('bad'); err.style.color = ''; setErr(fr ? 'Fill in the boxes first.' : 'Type an answer first.'); return; }
        let r = check(item, v), unitNote = '';
        if (r === 'bad' && kind !== 'text') { const su = stripUnit(v); if (su.unit) { r = check(item, su.v); if (r !== 'bad') unitNote = ' (No units needed next time, just the number.)'; } }
        if (r === 'bad') { inp.classList.add('bad'); err.style.color = ''; setErr(kind === 'fraction' ? 'Check the boxes. The bottom number cannot be 0.' : 'Type a number, like 4,000 or 2.5.'); return; }
        const nudge = { decimal: 'That is the right amount! Now write it as a fraction or a mixed number, like 2 1/2.', unreduced: 'That is the right amount, but not in simplest form. Reduce it and try again.', whole: 'That is the right amount! Write it as a whole number.', wantMixed: 'That is the right amount! Now write it as a mixed number, like 1 3/4.', wantImproper: 'That is the right amount! Now write it as an improper fraction, like 7/4.' }[r];
        if (nudge) { inp.classList.add('bad'); err.style.color = ''; setErr(nudge); return; }
        if (r === 'case') { inp.classList.add('bad'); err.style.color = ''; setErr('Almost! Check the capital and small letters, then try again.'); return; }
        if (r === 'ok' || r === 'close') {
          const pt = !R.hinted && R.tries === 0 && !free;
          if (!free) ctx.credit(); ctx.sfx.good(); err.style.color = 'var(--good-ink)';
          setErr((r === 'close' ? 'Close enough! It is spelled ' + shown(item) + '.' : 'Correct! ' + shown(item) + '.') + unitNote + (R.hinted && !free ? ' (Hint used, so no point.)' : '') + (retry && !item.practice ? ' (Practice: your first answer counts.)' : ''));
          done(pt, !pt && (R.hinted || R.tries > 0));
        } else {
          R.tries++; if (!free) { ctx.slip(); R.tb[R.i] = { tries: R.tries, hinted: R.hinted }; save(); } ctx.sfx.bad(); inp.classList.add('bad'); err.style.color = '';
          if (R.tries >= 2) { setErr('The answer is ' + shown(item) + '.'); done(false, true); }
          else setErr('Not quite. Try again.');
        }
      };
      if (sk) sk.onclick = () => {                              // not sure? show the answer, mark it for review, and move on (no point, no streak change)
        err.style.color = 'var(--ink2)'; setErr('Marked for review. The answer is ' + shown(item) + '.'); done(false, true);
      };
      next.onclick = () => { R.i++; save(); show(); };
      $('[data-a="back"]', P).onclick = () => { if (R.i > 0) { R.i--; save(); show(); } };
      $('[data-a="restart"]', P).onclick = () => askRestart(start, anyDone());
      if (item.say) ctx.say(item.say);
    }
    const s = K.load();
    if (s && s.v === RV && s.sig === SIG && Array.isArray(s.list) && s.list.length && s.i >= 0 && s.i < s.list.length && (s.mode !== 'full' || opt.full)) {
      Object.assign(R, { list: s.list, i: s.i, rec: Array.isArray(s.rec) ? s.rec : [], tb: s.tb && typeof s.tb === 'object' ? s.tb : {}, mode: s.mode || 'random', done: false }); show();
    } else start();
  }

  /* ---------------- Put in order ---------------- */
  function order(ctx, opt) {
    const P = ctx.panel, sets = opt.sets, K = keep(ctx), SIG = sigOf('order', opt, sets.map(s => s.id).join(','));
    const O = { set: sets[0], items: [], answer: [], checked: false, hist: [] };
    P.innerHTML = `<h2>${esc(opt.title || 'Put in order')}</h2><p class="lead">${esc(opt.lead || 'Drag the cards into the right order, or use the arrows. Then press Check.')}</p>
      ${sets.length > 1 ? `<div class="seg" role="group" aria-label="What to order">${sets.map((s, i) => `<button data-s="${esc(s.id)}" aria-pressed="${i === 0}">${esc(s.label)}</button>`).join('')}</div>` : ''}
      <ol class="olist"></ol><p class="msg"></p>
      <div class="row"><button class="btn" data-a="check">Check order</button><button class="btn ghost" data-a="undo" disabled>Undo</button><button class="btn ghost" data-a="new">Start over</button></div>`;
    const list = $('.olist', P), msg = $('.msg', P), undoB = $('[data-a="undo"]', P);
    addPad(ctx, () => plainText(opt.title || 'Put in order') + '. ' + plainText(opt.lead || 'Put the cards in the right order.'));
    const save = () => K.save({ v: RV, sig: SIG, set: O.set.id, items: O.items, answer: O.answer, checked: O.checked });
    const snap = () => { O.hist.push(O.items.slice()); if (O.hist.length > 200) O.hist.shift(); undoB.disabled = false; };
    const syncSeg = () => $$('.seg button', P).forEach(x => x.setAttribute('aria-pressed', x.dataset.s === O.set.id));
    function round() {
      const s = O.set, pool = s.items.map((it, k) => ({ ...it, k }));
      let chosen = pool;
      if (s.pick && pool.length > s.pick) { const idx = shuffle(pool.map((_, k) => k)).slice(0, s.pick).sort((a, b) => a - b); chosen = idx.map(k => pool[k]); }
      let sh; do { sh = shuffle(chosen); } while (sh.length > 1 && sh.every((x, i) => x === chosen[i]));
      O.items = sh; O.answer = chosen.map(x => x.k); O.checked = false; O.perfect = false; O.hist = []; undoB.disabled = true; render(); setMsg(msg, s.hint || '');
      $('[data-a="check"]', P).textContent = 'Check order'; save();
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
    function move(a, b) { if (b < 0 || b >= O.items.length) return; snap(); const [x] = O.items.splice(a, 1); O.items.splice(b, 0, x); render(); save(); const dir = b > a ? '1' : '-1'; let btn = $(`.oitem[data-i="${b}"] [data-mv="${dir}"]`, list); if (!btn || btn.disabled) btn = $(`.oitem[data-i="${b}"] [data-mv]:not(:disabled)`, list); if (btn) btn.focus(); }
    function drag(e, li) {
      if (e.target.closest('button') || (e.button !== undefined && e.button > 0)) return;
      const sy = e.clientY; let moved = false, from = +li.dataset.i, before = O.items.slice();
      try { li.setPointerCapture(e.pointerId); } catch (er) {}
      const mv = ev => {
        if (!moved && Math.abs(ev.clientY - sy) > 6) { moved = true; li.classList.add('dragging'); }
        if (!moved) return;
        const others = $$('.oitem', list).filter(x => x !== li);
        let to = others.findIndex(x => { const r = x.getBoundingClientRect(); return ev.clientY < r.top + r.height / 2; });
        if (to === -1) to = others.length;
        if (to !== from) { const [x] = O.items.splice(from, 1); O.items.splice(to, 0, x); from = to; const ref = others[to] || null; list.insertBefore(li, ref); }
      };
      const up = () => {
        li.removeEventListener('pointermove', mv); li.removeEventListener('pointerup', up); li.removeEventListener('pointercancel', up); li.classList.remove('dragging');
        if (moved) { if (before.some((x, i) => x !== O.items[i])) { O.hist.push(before); undoB.disabled = false; } render(); save(); }
      };
      li.addEventListener('pointermove', mv); li.addEventListener('pointerup', up); li.addEventListener('pointercancel', up);
    }
    $('[data-a="check"]', P).onclick = () => {
      const marks = O.items.map((it, i) => it.k === O.answer[i]), right = marks.filter(Boolean).length;
      if (!O.checked) { O.checked = true; save(); ctx.result(right, O.items.length); if (right === O.items.length) { ctx.credit(); ctx.sfx.win(); } else { ctx.slip(); ctx.sfx.bad(); } }
      render(marks); O.perfect = right === O.items.length; if (O.perfect) K.clear();
      if (right === O.items.length) setMsg(msg, 'Perfect order!', 'good');
      else setMsg(msg, right + ' of ' + O.items.length + ' are in the right place. Move the red ones, then check again. Your score counts your first check.', 'bad');
      $('[data-a="check"]', P).textContent = 'Check again';
    };
    undoB.onclick = () => { if (!O.hist.length) return; O.items = O.hist.pop(); undoB.disabled = !O.hist.length; render(); save(); };
    const moved = () => (O.hist.length > 0 || O.checked) && !O.perfect;   // nothing to lose once the order is perfect
    $('[data-a="new"]', P).onclick = () => askRestart(round, moved());
    $$('.seg button', P).forEach(b => b.onclick = () => { const ns = sets.find(s => s.id === b.dataset.s); if (ns === O.set) return; askRestart(() => { O.set = ns; syncSeg(); round(); }, moved()); });
    const s = K.load(), ss = s && s.v === RV && s.sig === SIG && sets.find(x => x.id === s.set);
    if (ss && Array.isArray(s.items) && s.items.length && Array.isArray(s.answer)) {
      O.set = ss; O.items = s.items; O.answer = s.answer; O.checked = !!s.checked; syncSeg(); render(); setMsg(msg, ss.hint || '');
      if (O.checked) $('[data-a="check"]', P).textContent = 'Check again';
    } else round();
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
    const P = ctx.panel, items = opt.items, n = opt.rounds || items.length, K = keep(ctx), SIG = sigOf('explain', opt, n + '|' + items.length);
    const X = { list: [], i: 0, rec: [], drafts: [], done: false };
    const score = () => X.rec.filter(r => r && r.perfect).length;
    const save = () => { if (!X.done) K.save({ v: RV, sig: SIG, list: X.list, i: X.i, rec: X.rec, drafts: X.drafts }); };
    function start() { X.list = (opt.keepFirst ? [items[0], ...shuffle(items.slice(1))] : shuffle(items)).slice(0, n); X.i = 0; X.rec = []; X.drafts = []; X.done = false; save(); show(); }
    function show() {
      if (X.i >= X.list.length) {
        const sc = score();
        if (!X.done) { X.done = true; K.clear(); ctx.result(sc, X.list.length); ctx.sfx.win(); }
        P.innerHTML = `<h2>${esc(opt.title || 'Explain it')}</h2><div class="result">${starsHTML(sc, X.list.length)}<p class="prompt">${sc} out of ${X.list.length} complete</p><p class="lead">${sc / X.list.length >= 0.8 ? 'Insane work. You can explain it all in your own words.' : 'Explaining is the hardest part. Read the model answers, then try again.'}</p><button class="btn" data-a="again">Play again</button></div>`;
        $('[data-a="again"]', P).onclick = start; const ag = $('[data-a="again"]', P); if (P.dataset.sbFocus) ag.focus({ preventScroll: true }); return;
      }
      const ex = X.list[X.i], first = X.rec[X.i];
      P.innerHTML = `<h2>${esc(opt.title || 'Explain it')}</h2><p class="lead">${esc(opt.lead || 'Answer in complete sentences, then check your answer.')}</p>
        <div class="roundbar"><div class="bar" aria-hidden="true"><i style="width:${X.i / X.list.length * 100}%"></i></div><span class="hint">Question ${X.i + 1} of ${X.list.length} &middot; Complete ${score()}</span>${roundBtns(X.i > 0)}</div>
        <div class="xgrid"><div>
          <div class="row qrow left"><p class="qline">${esc(ex.q)}</p>${ctx.sayButton(ex.q, 'Hear the question')}</div>
          <textarea class="answer" rows="5" aria-label="Your answer" placeholder="Write your answer here."></textarea>
          <div class="row"><button class="btn" data-a="check">${first ? 'Check again' : 'Check my answer'}</button><button class="btn" data-a="next"${first ? '' : ' hidden'}>${X.i === X.list.length - 1 ? 'See results' : 'Next question'}</button></div>
        </div><div class="feedback"${first ? '' : ' hidden'}>${first ? `<p class="msg">${practiceNote(first.perfect)}</p>` : ''}</div></div>`;
      addPad(ctx, () => ex.q);
      const ta = $('.answer', P), fb = $('.feedback', P), check = $('[data-a="check"]', P), next = $('[data-a="next"]', P);
      ta.value = X.drafts[X.i] || '';
      let tmr = null;
      ta.oninput = () => { X.drafts[X.i] = ta.value; clearTimeout(tmr); tmr = setTimeout(save, 400); };   // the answer being written is kept too
      ta.focus();
      check.onclick = () => {
        if (ta.value.trim().split(/\s+/).length < 3) { fb.hidden = false; fb.innerHTML = '<p class="msg bad">Write a little more first.</p>'; return; }
        const g = gradeExplain(ta.value, ex);
        X.drafts[X.i] = ta.value;
        if (!X.rec[X.i]) { X.rec[X.i] = { perfect: g.perfect }; if (g.perfect) { ctx.credit(); ctx.sfx.good(); } else { ctx.slip(); ctx.sfx.bad(); } $('.roundbar .hint', P).innerHTML = `Question ${X.i + 1} of ${X.list.length} &middot; Complete ${score()}`; }
        save();
        fb.hidden = false;
        fb.innerHTML = `<div class="eyebrow">Did your answer include</div>
          <ul class="checks">${g.ideas.map(i => `<li class="${i.ok ? 'ok' : 'no'}">${i.ok ? CHECK : CROSS}<span>${esc(i.label)}</span></li>`).join('')}
          <li class="${g.complete ? 'ok' : 'no'}">${g.complete ? CHECK : CROSS}<span>Complete sentences (capital letter, end mark)</span></li></ul>
          <p class="msg ${g.perfect ? 'good' : 'bad'}">${g.perfect ? 'Great answer!' : 'Add what is missing, then check again. Your score counts your first check.'}</p>
          <div class="model"><div class="eyebrow">${ex.teacher ? 'Answer from the study guide' : 'A good answer'}</div><p>${esc(ex.model)}</p>${ctx.sayButton(ex.model, 'Hear the answer')}</div>`;
        check.textContent = 'Check again'; next.hidden = false;
      };
      next.onclick = () => { clearTimeout(tmr); X.i++; save(); show(); };
      $('[data-a="back"]', P).onclick = () => { clearTimeout(tmr); if (X.i > 0) { X.i--; save(); show(); } };
      $('[data-a="restart"]', P).onclick = () => askRestart(start, X.rec.some(Boolean) || X.drafts.some(d => d && d.trim()));
      ctx.say(ex.q);
    }
    const s = K.load();
    if (s && s.v === RV && s.sig === SIG && Array.isArray(s.list) && s.list.length && s.i >= 0 && s.i < s.list.length) {
      Object.assign(X, { list: s.list, i: s.i, rec: Array.isArray(s.rec) ? s.rec : [], drafts: Array.isArray(s.drafts) ? s.drafts : [], done: false }); show();
    } else start();
  }

  /* n different questions for a round (the same problem should not come up twice): many(makeOne, 10) */
  /* 3/4 x 8 and 8 x 3/4 are the same question for this purpose (a sum or product with only that one operation) */
  const twinKey = q => { const c = String(q.chk || ''); if (!c) return ''; for (const op of ['*', '+']) { const parts = c.split(op); if (parts.length > 1 && !/[-:*+]/.test(parts.join(''))) return op + parts.map(x => x.trim()).sort().join(op) + '|' + (q.form || '') + '|' + (q.a || ''); } return ''; };
  const many = (fn, n = 10) => { const out = [], seen = new Set(); for (let i = 0; out.length < n && i < 400; i++) { const q = fn(), k = (q.q || '') + '|' + (q.html || '') + '|' + (q.qh || ''), t = twinKey(q); if (!seen.has(k) && !(t && seen.has(t))) { seen.add(k); if (t) seen.add(t); out.push(q); } } return out; };
  /* for a module's own tools: the same saved round, Back and Start over pieces the shared tools use */
  const saved = (ctx, sig) => { const K = keep(ctx); return { load() { const o = K.load(); return o && o.v === RV && o.sig === sig ? o : null; }, save(o) { K.save(Object.assign({ v: RV, sig }, o)); }, clear() { K.clear(); } }; };
  window.SBT = { saved, roundBtns, askRestart, practiceNote, fracBox, wireFrac, stackText, loadPad, padTab, judge, stripUnit, many, flashcards, quizCards, sort, quiz, answer, order, explain, gradeExplain, shuffle, starsHTML, setMsg };
})();
