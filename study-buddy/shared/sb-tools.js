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
        if (FC.cur) ctx.result(FC.total - FC.missed.size, FC.total);
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
    $('[data-a="knew"]', P).onclick = () => { if (!FC.cur) return build(); afterUnflip(() => { FC.queue.shift(); ctx.credit(); ctx.sfx.good(); next(); }); };
    $('[data-a="again"]', P).onclick = () => { if (!FC.cur) return build(); afterUnflip(() => { const c = FC.queue.shift(); FC.missed.add(c); FC.queue.splice(Math.min(FC.queue.length, 3 + Math.floor(Math.random() * 3)), 0, c); ctx.slip(); ctx.sfx.bad(); next(); }); };
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
    function start() { Q.qs = shuffle(opt.build()).slice(0, n); Q.i = 0; Q.score = 0; show(); }
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
        <p class="explain"></p><div class="row center"><button class="btn" data-a="next" hidden>${Q.i === Q.qs.length - 1 ? 'See results' : 'Next question'}</button></div></div>`;
      $$('.opt', P).forEach(b => b.onclick = () => {
        if (Q.answered) return; Q.answered = true;
        const ok = b.dataset.v === q.a;
        $$('.opt', P).forEach(x => { x.disabled = true; if (x.dataset.v === q.a) x.classList.add('right'); });
        if (ok) { Q.score++; ctx.credit(); ctx.sfx.good(); } else { b.classList.add('wrong'); ctx.slip(); ctx.sfx.bad(); }
        $('.explain', P).innerHTML = (ok ? '<b style="color:var(--good)">Correct!</b> ' : '<b style="color:var(--bad)">Not quite.</b> ') + esc(q.why || ('The answer is: ' + q.a + '.'));
        const nx = $('[data-a="next"]', P); nx.hidden = false; nx.focus();
      });
      $('[data-a="next"]', P).onclick = () => { Q.i++; show(); };
      ctx.say(q.q);
    }
    start();
  }

  window.SBT = { flashcards, sort, quiz, shuffle, starsHTML, setMsg };
})();
