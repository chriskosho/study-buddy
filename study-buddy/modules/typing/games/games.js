/* Typing Games (Typing): Word Sprint, Falling Words, and Ghost Race. Calm games: no mascots, no flashing, no sounds while playing.
   They are practice (registry kind 'study'): no credit or mastery, but each keeps the student's best score.
   Words come from shared/sb-typing-gen.js (SBTG.gameWords); keys from shared/sb-typing.js (SBTY.take). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = SB.esc, G = window.SBTG, X = window.SBTX || { sentences: [] };
  window.SB_NO_SLASH_SEARCH = true;
  const NEEDS = SBTY.needsKeyboard();
  const NOTE = NEEDS ? '<p class="note">This game needs a keyboard. Connect one to this phone or tablet.</p>' : '';
  const NOTE_GHOST = NEEDS ? '<p class="note">Ghost Race works best with a keyboard. You can also tap the text to use the on-screen keyboard.</p>' : '';
  const r1 = x => Math.round(x);
  const clock = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const LEVELS = [{ id: 'easy', label: 'Easy' }, { id: 'medium', label: 'Medium' }, { id: 'hard', label: 'Hard' }];
  const LEVEL_TEXT = { easy: 'short words', medium: 'common words', hard: 'longer words, some with capitals' };
  const seg = (name, list, label) => `<div class="seg" role="group" aria-label="${esc(label)}">${list.map(o => `<button type="button" data-${name}="${o.id}">${esc(o.label)}</button>`).join('')}</div>`;
  /* the device's reduce-motion setting, read once and kept up to date (not every animation frame) */
  let REDUCE = false;
  try { const mq = matchMedia('(prefers-reduced-motion: reduce)'); REDUCE = mq.matches; mq.addEventListener('change', e => { REDUCE = e.matches; }); } catch (e) {}
  const reduceMotion = () => REDUCE;
  /* a capital where the small letter is wanted, or the other way round: Caps Lock or Shift */
  const caseOnly = (k, want) => k !== want && k.length === 1 && want && k.toLowerCase() === want.toLowerCase();
  const CAPS_MSG = k => /[A-Z]/.test(k) ? 'That was a capital letter. Is Caps Lock or Shift on?' : 'This letter is a capital: hold Shift.';
  /* switching to another browser tab or app: each game decides what to do (one listener for the page, so Reset does not add more) */
  const TOOLS = [];
  document.addEventListener('visibilitychange', () => { if (document.hidden) TOOLS.forEach(t => t._hide && t._hide()); });
  const visible = P => !P.hidden && P.offsetParent !== null;
  /* letters: the word with the typed part marked */
  const lettersHTML = (w, n, miss, bad) => [...w].map((c, i) => `<span class="${i < n ? (bad && bad.has(i) ? 'bad' : 'ok') : i === n ? 'cur' + (miss ? ' miss' : '') : 'todo'}">${esc(c)}</span>`).join('');

  /* ===================== Word Sprint ===================== */
  const SPRINT_MS = 60000;
  const sprint = {
    init(ctx) {
      const P = ctx.panel, st = ctx.state;
      st.sprint = Object.assign({ level: 'easy', best: {} }, st.sprint || {});
      const S = st.sprint;
      P.innerHTML = `${NOTE}
        <div class="gbar"><div class="row">${seg('lvl', LEVELS, 'Level')}</div>
          <div class="row"><span class="pill gpill" id="wsScore" title="Words typed">0 words</span><span class="pill gpill" id="wsClock" title="Time left">1:00</span></div></div>
        <div class="gline"></div>
        <div class="ws-stage" aria-live="off"><div class="ws-word"></div><div class="ws-next"></div></div>
        <p class="msg gmsg" role="status" tabindex="-1"></p>`;
      const wordEl = $('.ws-word', P), nextEl = $('.ws-next', P), msg = $('.gmsg', P), stage = $('.ws-stage', P);
      let words = [], wi = 0, n = 0, miss = false, bad = new Set(), score = 0, chars = 0, t0 = 0, timer = null, over = false, playing = false;
      const wait = () => SBTY.shared().wait;
      function paintLine() {
        const b = S.best[S.level];
        $('.gline', P).innerHTML = `<span>${esc(LEVELS.find(l => l.id === S.level).label)}: ${esc(LEVEL_TEXT[S.level])}. Type each word as fast as you can. You have 1 minute, and the clock starts with your first key.</span><span>${b ? `Best: <b>${b} words</b>` : 'No best yet'}</span>`;
        P.querySelectorAll('[data-lvl]').forEach(x => x.setAttribute('aria-pressed', x.dataset.lvl === S.level));
      }
      function paint() {
        const w = words[wi] || '';
        wordEl.innerHTML = lettersHTML(w, n, miss, bad);
        nextEl.textContent = words.slice(wi + 1, wi + 4).join('   ');
        $('#wsScore', P).textContent = score + (score === 1 ? ' word' : ' words');
      }
      function start() {
        clearInterval(timer); timer = null; over = false; playing = false; t0 = 0;
        words = G.gameWords(S.level, 200); wi = 0; n = 0; miss = false; bad = new Set(); score = 0; chars = 0;
        stage.hidden = false; const o = $('.gover', P); if (o) o.remove();
        $('#wsClock', P).textContent = clock(SPRINT_MS);
        msg.textContent = note || 'Start typing when you are ready. No space needed between words.'; note = '';
        paint(); paintLine(); SBTY.take(handler);
      }
      function tick() { const left = SPRINT_MS - (performance.now() - t0); $('#wsClock', P).textContent = clock(left); if (left <= 0) end(); }
      function type(k) {
        if (over) return;
        if (k === ' ') return;                                     // words come one at a time, so a space is not needed (and not a mistake)
        if (performance.now() - t0 >= SPRINT_MS && playing) { end(); return; }
        const w = words[wi];
        if (caseOnly(k, w[n])) { msg.textContent = CAPS_MSG(k); return; }
        if (!playing) { playing = true; t0 = performance.now(); timer = setInterval(tick, 200); msg.textContent = ''; }
        if (k === w[n]) { n++; miss = false; chars++; msg.textContent = ''; }
        else if (wait()) miss = true;
        else { bad.add(n); n++; miss = false; }                      // Fix mistakes off: the wrong letter is skipped and shown in red
        if (n >= w.length) {
          if (!bad.size) score++;                                  // a word with a skipped letter does not count
          wi++; n = 0; bad = new Set();
        }
        paint();
      }
      function end() {
        if (over) return; over = true; playing = false;
        clearInterval(timer); timer = null;
        $('#wsClock', P).textContent = '0:00';
        const prev = S.best[S.level] || 0, best = Math.max(prev, score);
        S.best[S.level] = best; ctx.save();
        stage.hidden = true;
        msg.textContent = '';
        const box = document.createElement('div'); box.className = 'gover';
        box.innerHTML = `<h2>${score} ${score === 1 ? 'word' : 'words'} in 1 minute</h2>
          <p class="lead">${score > prev && prev ? 'A new best! ' : ''}Your best on ${esc(LEVELS.find(l => l.id === S.level).label)} is ${best}.</p>
          <div class="row"><button class="btn" type="button" data-x="again">Play again</button></div>`;
        msg.before(box);
        $('[data-x="again"]', box).onclick = start;
        msg.focus({ preventScroll: true });   // not the button: a key typed just after time is up must not start a new game
        paintLine();
      }
      const handler = { live: () => visible(P) && !over, type: k => type(k), back() {} };
      stage.addEventListener('click', () => SBTY.take(handler));
      P.querySelectorAll('[data-lvl]').forEach(x => x.onclick = () => { S.level = x.dataset.lvl; ctx.save(); x.blur(); start(); });
      SBTY.toView(stage);
      sprint._leave = () => { if (playing && !over) start(); };           // leaving the tab mid-game starts it over
      sprint._enter = () => SBTY.take(handler);
      let note = '';
      sprint._hide = () => { if (visible(P) && playing && !over) { note = 'We started over because you left the game.'; start(); } };
      start();
    },
    leave() { if (sprint._leave) sprint._leave(); },
    enter() { if (sprint._enter) sprint._enter(); }
  };

  /* ===================== Falling Words ===================== */
  /* every: ms between new words at the start (never below min); speed: px a second at the start (never above max times it) */
  const FALL = { easy: { every: 2800, min: 1800, speed: 26, max: 1.3 }, medium: { every: 2200, min: 1300, speed: 36, max: 1.6 }, hard: { every: 1700, min: 1000, speed: 46, max: 2 } };
  const LIVES = 3;
  const falling = {
    init(ctx) {
      const P = ctx.panel, st = ctx.state;
      st.fall = Object.assign({ level: 'easy', best: {} }, st.fall || {});
      const F = st.fall;
      P.innerHTML = `${NOTE}
        <div class="gbar"><div class="row">${seg('lvl', LEVELS, 'Level')}</div>
          <div class="row"><span class="pill" title="Words that may reach the bottom">Misses left <span class="fw-lives" aria-label="Misses left"></span></span><span class="pill gpill" id="fwScore">0 words</span></div></div>
        <div class="gline"></div>
        <div class="fw-area" aria-label="Falling words"><div class="fw-floor"></div><div class="fw-cover"></div></div>
        <p class="msg gmsg" role="status" tabindex="-1"></p>`;
      const area = $('.fw-area', P), cover = $('.fw-cover', P), msg = $('.gmsg', P);
      let active = [], target = null, typed = 0, score = 0, lives = LIVES, cleared = 0, last = 0, nextSpawn = 0, raf = 0, running = false, over = false, pool = [], stepAcc = 0;
      const steps = () => reduceMotion();
      function paintLine() {
        const b = F.best[F.level];
        $('.gline', P).innerHTML = `<span>${esc(LEVELS.find(l => l.id === F.level).label)}: ${esc(LEVEL_TEXT[F.level])}. Type a word to clear it before it reaches the bottom. Three words may reach the bottom.</span><span>${b ? `Best: <b>${b} words</b>` : 'No best yet'}</span>`;
        P.querySelectorAll('[data-lvl]').forEach(x => x.setAttribute('aria-pressed', x.dataset.lvl === F.level));
      }
      function paintHud() {
        $('.fw-lives', P).innerHTML = Array.from({ length: LIVES }, (x, i) => `<i class="${i < lives ? 'on' : ''}"></i>`).join('');
        $('.fw-lives', P).setAttribute('aria-label', lives + ' misses left');
        $('#fwScore', P).textContent = score + (score === 1 ? ' word' : ' words');
      }
      function showCover(html) { cover.hidden = false; cover.innerHTML = `<div>${html}</div>`; }
      function reset() {
        stop(); active.forEach(a => a.el.remove()); active = []; target = null; typed = 0; score = 0; lives = LIVES; cleared = 0; over = false;
        pool = G.gameWords(F.level, 300);
        paintHud(); paintLine();
        showCover(`<h2>Falling Words</h2><p class="lead">Words fall from the top. Type one to clear it.</p><button class="btn" type="button" data-x="go">Start</button>`);
        $('[data-x="go"]', cover).onclick = go;
        msg.textContent = '';
      }
      function go() {
        cover.hidden = true; running = true; last = performance.now(); nextSpawn = last; stepAcc = 0;
        SBTY.take(handler); area.focus && document.activeElement && document.activeElement.blur();
        raf = requestAnimationFrame(frame);
        msg.textContent = '';
      }
      function stop() { running = false; cancelAnimationFrame(raf); }
      function pause() {
        if (!running) return; stop();
        showCover(`<h2>Paused</h2><button class="btn" type="button" data-x="go">Keep going</button>`);
        $('[data-x="go"]', cover).onclick = () => { go(); };
        $('[data-x="go"]', cover).focus({ preventScroll: true });   // Enter or Space keeps going
      }
      function spawn() {
        /* a new word never starts with the same letter as a word already falling, so the first key always picks one word */
        const used = new Set(active.map(a => a.word[0].toLowerCase()));
        let w = pool.shift() || G.gameWords(F.level, 1)[0], t = 0;
        while (used.has(w[0].toLowerCase()) && t++ < 20) { pool.push(w); w = pool.shift(); }
        if (used.has(w[0].toLowerCase())) return;
        const el = document.createElement('div'); el.className = 'fw-word'; el.innerHTML = lettersHTML(w, 0).replace(/ cur/g, ' todo');
        area.appendChild(el);
        /* side by side lanes: a new word goes in a lane where no word is still near the top, so words do not cover each other */
        const lanes = Math.max(2, Math.floor((area.clientWidth - 8) / 170)), laneW = (area.clientWidth - 8) / lanes;
        const busy = new Set(active.filter(a => a.y < a.h * 2.5).map(a => a.lane));
        const free = [...Array(lanes).keys()].filter(i => !busy.has(i));
        if (!free.length) { el.remove(); pool.unshift(w); return; }
        const lane = free[Math.floor(Math.random() * free.length)];
        el.style.left = Math.min(4 + lane * laneW + Math.random() * Math.max(0, laneW - el.offsetWidth), area.clientWidth - el.offsetWidth - 4) + 'px';
        active.push({ word: w, el, y: -el.offsetHeight, h: el.offsetHeight, lane });
      }
      function paintWord(a) { a.el.innerHTML = [...a.word].map((c, i) => `<span class="${a === target && i < typed ? 'ok' : 'todo'}">${esc(c)}</span>`).join(''); a.el.classList.toggle('target', a === target); }
      function frame(now) {
        if (!running) return;
        const dt = Math.min(250, now - last); last = now;
        const lv = FALL[F.level], speed = lv.speed * Math.min(lv.max, 1 + cleared * 0.03), every = Math.max(lv.min, lv.every * Math.pow(0.97, cleared));
        if (now >= nextSpawn) { spawn(); nextSpawn = now + every; }
        let move = speed * dt / 1000;
        if (steps()) { stepAcc += move; move = 0; if (stepAcc >= 24) { move = stepAcc; stepAcc = 0; } }   // reduce motion: words step down instead of gliding
        const floor = area.clientHeight - 8;
        for (const a of active.slice()) {
          a.y += move; a.el.style.transform = `translateY(${a.y}px)`;
          if (a.y + a.h >= floor) missed(a);
          if (!running) break;                                      // the game just ended
        }
        if (running) raf = requestAnimationFrame(frame);
      }
      function remove(a) { a.el.remove(); active = active.filter(x => x !== a); if (target === a) { target = null; typed = 0; } }
      function missed(a) {
        remove(a); lives--; paintHud();
        msg.textContent = `Missed "${a.word}".`;
        if (lives <= 0) { lives = 0; end(); }
      }
      function type(k) {
        if (!running) return;
        if (!target) {
          target = active.filter(a => a.word[0] === k).sort((a, b) => b.y - a.y)[0] || null;   // the lowest word that starts with this key
          typed = 0;
          if (!target) { if (active.some(a => caseOnly(k, a.word[0]))) msg.textContent = CAPS_MSG(k); return; }
        }
        if (caseOnly(k, target.word[typed])) { msg.textContent = CAPS_MSG(k); return; }
        if (target.word[typed] === k) {
          typed++;
          if (typed >= target.word.length) { const done = target; remove(done); score++; cleared++; paintHud(); msg.textContent = ''; return; }
          paintWord(target);
        }
      }
      function back() { if (target && typed > 0) { typed--; const t = target; if (!typed) { target = null; paintWord(t); } else paintWord(t); } }
      function end() {
        stop(); over = true;
        active.forEach(a => a.el.remove()); active = []; target = null;
        const prev = F.best[F.level] || 0, best = Math.max(prev, score);
        F.best[F.level] = best; ctx.save();
        showCover(`<h2>${score} ${score === 1 ? 'word' : 'words'} cleared</h2><p class="lead">${score > prev && prev ? 'A new best! ' : ''}Your best on ${esc(LEVELS.find(l => l.id === F.level).label)} is ${best}.</p><button class="btn" type="button" data-x="again">Play again</button>`);
        $('[data-x="again"]', cover).onclick = () => { reset(); go(); };
        msg.textContent = 'Game over.'; msg.focus({ preventScroll: true });
        paintLine();
      }
      const handler = { live: () => visible(P) && running, type: k => type(k), back };
      area.addEventListener('click', () => { if (running) SBTY.take(handler); });
      P.querySelectorAll('[data-lvl]').forEach(x => x.onclick = () => { F.level = x.dataset.lvl; ctx.save(); x.blur(); reset(); });
      SBTY.toView(area);
      falling._leave = pause;
      falling._enter = () => SBTY.take(handler);
      falling._hide = pause;
      falling._test = { spawn, active: () => active, state: () => ({ score, lives, running, over }) };
      reset();
    },
    leave() { if (falling._leave) falling._leave(); },
    enter() { if (falling._enter) falling._enter(); }
  };

  /* ===================== Ghost Race ===================== */
  const GHOST = [{ id: 'best', label: 'Your best' }, { id: '10', label: '10' }, { id: '15', label: '15' }, { id: '20', label: '20' }, { id: '30', label: '30' }, { id: '40', label: '40' }];
  const ghost = {
    init(ctx) {
      const P = ctx.panel, st = ctx.state;
      st.ghost = Object.assign({ speed: 'best', best: 0, wins: 0 }, st.ghost || {});
      const R = st.ghost;
      P.innerHTML = `${NOTE_GHOST}
        <div class="gbar"><div class="row"><b>Ghost speed</b>${seg('gs', GHOST, 'Ghost speed in words a minute')}</div></div>
        <div class="gline"></div>
        <div class="gr-track" aria-hidden="true">
          <span>You</span><div class="gr-bar gr-you"><i></i></div><span class="gr-yp">0%</span>
          <span><span class="gr-key"></span>Ghost</span><div class="gr-bar gr-ghost"><i></i></div><span class="gr-gp">0%</span>
        </div>
        <div class="grtype"></div>
        <p class="msg gmsg" role="status" tabindex="-1"></p>
        <div class="grdone" hidden></div>`;
      const msg = $('.gmsg', P), done = $('.grdone', P);
      let t0 = 0, raf = 0, racing = false, over = false;
      const ghostWpm = () => R.speed === 'best' ? (R.best ? Math.round(R.best) : SBTY.shared().target) : Number(R.speed);
      const topts = {
        onStart: () => { t0 = performance.now(); racing = true; raf = requestAnimationFrame(frame); },
        onKey: () => paintBars(),
        onDone: r => finish(r)
      };
      const typer = SBTY.typer($('.grtype', P), topts);
      ghost._typer = typer;
      let text = '';
      function gpos() { return racing || over ? Math.min(text.length, (performance.now() - t0) / 1000 * ghostWpm() * 5 / 60) : 0; }
      let shown = '';
      function paintBars() {
        const you = Math.floor(typer.pos() / text.length * 100), gp = Math.floor(gpos() / text.length * 100), key = you + ':' + gp;
        if (key === shown) return; shown = key;                    // only when a whole percent changes, so a slow computer is not redrawing every frame
        $('.gr-you i', P).style.width = you + '%'; $('.gr-yp', P).textContent = you + '%';
        $('.gr-ghost i', P).style.width = gp + '%'; $('.gr-gp', P).textContent = gp + '%';
      }
      function frame() {
        if (!racing) return;
        const g = gpos();
        typer.ghost(g >= text.length ? -1 : Math.floor(g));
        paintBars();
        raf = requestAnimationFrame(frame);
      }
      function paintLine() {
        $('.gline', P).innerHTML = `<span>Race the ghost through three sentences. The ghost types at <b>${ghostWpm()} words a minute</b>${R.speed === 'best' ? (R.best ? ' (your best race)' : ' (your target speed, until you finish a race)') : ''} and starts with your first key. Its place in the text has an orange line.</span><span>${R.best ? `Your best race: <b>${r1(R.best)} words a minute</b>` : ''}${R.wins ? ` Races won: ${R.wins}` : ''}</span>`;
        P.querySelectorAll('[data-gs]').forEach(x => x.setAttribute('aria-pressed', x.dataset.gs === R.speed));
      }
      function start() {
        cancelAnimationFrame(raf); racing = false; over = false; t0 = 0;
        text = G.pickText(X.sentences, 3);
        topts.wait = SBTY.shared().wait;
        typer.reset(text); typer.active(); typer.ghost(0);
        done.hidden = true; $('.grtype', P).hidden = false; shown = '';
        msg.textContent = note || 'Start typing when you are ready.'; note = '';
        paintBars(); paintLine();
      }
      function finish(r) {
        racing = false; over = true; cancelAnimationFrame(raf);
        const yourMs = performance.now() - t0, ghostMs = text.length / (ghostWpm() * 5 / 60) * 1000, won = yourMs <= ghostMs, tie = Math.abs(yourMs - ghostMs) < 50;
        typer.ghost(-1);
        const wpm = text.length / 5 / (yourMs / 60000);
        const newBest = wpm > R.best && r.acc >= 0.9 && wpm <= 150;   // over 150 words a minute is not real typing (pasted or predicted text)
        if (newBest) R.best = Math.round(wpm * 10) / 10;
        if (won) R.wins = (R.wins || 0) + 1;
        ctx.save();
        paintBars();
        const gap = Math.abs(ghostMs - yourMs) / 1000;
        msg.textContent = '';
        done.hidden = false; $('.grtype', P).hidden = true;   // the result takes the text's place, so it fits the screen
        done.innerHTML = `<div class="gover"><h2>${tie ? 'You tied with the ghost' : `${won ? 'You beat the ghost' : 'The ghost won'} by ${gap.toFixed(1)} seconds`}</h2>
          <p class="lead">You typed ${r1(wpm)} words a minute with ${Math.floor(r.acc * 100 + 1e-9)}% right.${newBest ? ' That is your best race, so the ghost will race at this speed next time on "Your best".' : r.acc < 0.9 ? ' Races at 90% right or better can become your best.' : ''}</p>
          <div class="row"><button class="btn" type="button" data-x="again">Race again</button></div></div>`;
        $('[data-x="again"]', done).onclick = start;
        msg.focus({ preventScroll: true });
        paintLine();
      }
      P.querySelectorAll('[data-gs]').forEach(x => x.onclick = () => { R.speed = x.dataset.gs; ctx.save(); x.blur(); start(); });
      ghost._leave = () => { if (racing) start(); };
      ghost._enter = () => typer.active();
      let note = '';
      ghost._hide = () => { if (racing && visible(P)) { note = 'We started over because you left the race.'; start(); } };
      start();
    },
    leave() { if (ghost._leave) ghost._leave(); },
    enter() { if (ghost._enter) ghost._enter(); }
  };

  TOOLS.push(sprint, falling, ghost);
  SBM.start({ module: 'typing-games', defaults: {}, tools: { sprint, falling, ghost } });
})();
