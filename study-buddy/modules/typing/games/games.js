/* Typing Games (Typing): Word Sprint, Falling Words, and Ghost Race. Calm games: no mascots, no flashing, no sounds while playing.
   They are practice (registry kind 'study'): no credit or mastery, but each keeps the student's best score.
   Words come from shared/sb-typing-gen.js (SBTG.gameWords); keys from shared/sb-typing.js (SBTY.take). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = SB.esc, G = window.SBTG, X = window.SBTX || { sentences: [] };
  window.SB_NO_SLASH_SEARCH = true;
  const NEEDS = SBTY.needsKeyboard();
  const NOTE = NEEDS ? '<p class="note">These games need a keyboard. Connect one to this phone or tablet.</p>' : '';
  const r1 = x => Math.round(x);
  const clock = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const LEVELS = [{ id: 'easy', label: 'Easy' }, { id: 'medium', label: 'Medium' }, { id: 'hard', label: 'Hard' }];
  const LEVEL_TEXT = { easy: 'short words', medium: 'common words', hard: 'longer words, some with capitals' };
  const seg = (name, list, label) => `<div class="seg" role="group" aria-label="${esc(label)}">${list.map(o => `<button type="button" data-${name}="${o.id}">${esc(o.label)}</button>`).join('')}</div>`;
  const reduceMotion = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  const visible = P => !P.hidden && P.offsetParent !== null;
  /* letters: the word with the typed part marked */
  const lettersHTML = (w, n, miss) => [...w].map((c, i) => `<span class="${i < n ? 'ok' : i === n ? 'cur' + (miss ? ' miss' : '') : 'todo'}">${esc(c)}</span>`).join('');

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
      let words = [], wi = 0, n = 0, miss = false, score = 0, chars = 0, t0 = 0, timer = null, over = false, playing = false;
      const wait = () => SBTY.shared().wait;
      function paintLine() {
        const b = S.best[S.level];
        $('.gline', P).innerHTML = `<span>${esc(LEVELS.find(l => l.id === S.level).label)}: ${esc(LEVEL_TEXT[S.level])}. Type each word as fast as you can. You have 1 minute, and the clock starts with your first key.</span><span>${b ? `Best: <b>${b} words</b>` : 'No best yet'}</span>`;
        P.querySelectorAll('[data-lvl]').forEach(x => x.setAttribute('aria-pressed', x.dataset.lvl === S.level));
      }
      function paint() {
        const w = words[wi] || '';
        wordEl.innerHTML = lettersHTML(w, n, miss);
        nextEl.textContent = words.slice(wi + 1, wi + 4).join('   ');
        $('#wsScore', P).textContent = score + (score === 1 ? ' word' : ' words');
      }
      function start() {
        clearInterval(timer); timer = null; over = false; playing = false; t0 = 0;
        words = G.gameWords(S.level, 200); wi = 0; n = 0; miss = false; score = 0; chars = 0;
        stage.hidden = false; const o = $('.gover', P); if (o) o.remove();
        $('#wsClock', P).textContent = clock(SPRINT_MS);
        msg.textContent = 'Start typing when you are ready.';
        paint(); paintLine(); SBTY.take(handler);
      }
      function tick() { const left = SPRINT_MS - (performance.now() - t0); $('#wsClock', P).textContent = clock(left); if (left <= 0) end(); }
      function type(k) {
        if (over) return;
        if (performance.now() - t0 >= SPRINT_MS && playing) { end(); return; }
        if (!playing) { playing = true; t0 = performance.now(); timer = setInterval(tick, 200); }
        const w = words[wi];
        if (k === w[n]) {
          n++; miss = false; chars++;
          if (n >= w.length) { score++; chars++; wi++; n = 0; }   // the word is done (the space between words counts as a character)
        } else if (wait()) miss = true;
        else { n++; miss = false; if (n >= w.length) { wi++; n = 0; } }   // Fix mistakes off: the wrong letter is skipped, and the word does not count
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
          <p class="lead">${score > prev && prev ? 'A new best! ' : ''}That is about ${r1(chars / 5)} words a minute. Your best on ${esc(LEVELS.find(l => l.id === S.level).label)} is ${best}.</p>
          <div class="row"><button class="btn" type="button" data-x="again">Play again</button></div>`;
        msg.before(box);
        $('[data-x="again"]', box).onclick = start;
        msg.focus({ preventScroll: true });   // not the button: a key typed just after time is up must not start a new game
        paintLine();
      }
      const handler = { live: () => visible(P) && !over, type: k => type(k), back() {} };
      stage.addEventListener('click', () => SBTY.take(handler));
      P.querySelectorAll('[data-lvl]').forEach(x => x.onclick = () => { S.level = x.dataset.lvl; ctx.save(); x.blur(); start(); });
      sprint._leave = () => { if (playing && !over) start(); };           // leaving the tab mid-game starts it over
      sprint._enter = () => SBTY.take(handler);
      document.addEventListener('visibilitychange', () => { if (document.hidden && visible(P) && playing && !over) start(); });
      start();
    },
    leave() { if (sprint._leave) sprint._leave(); },
    enter() { if (sprint._enter) sprint._enter(); }
  };

  /* ===================== Falling Words ===================== */
  const FALL = { easy: { every: 2800, speed: 26 }, medium: { every: 2200, speed: 36 }, hard: { every: 1700, speed: 46 } };
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
        const lv = FALL[F.level], speed = lv.speed * Math.min(2.2, 1 + cleared * 0.03), every = Math.max(900, lv.every * Math.pow(0.97, cleared));
        if (now >= nextSpawn) { spawn(); nextSpawn = now + every; }
        let move = speed * dt / 1000;
        if (steps()) { stepAcc += move; move = 0; if (stepAcc >= 24) { move = stepAcc; stepAcc = 0; } }   // reduce motion: words step down instead of gliding
        const floor = area.clientHeight - 8;
        for (const a of active.slice()) {
          a.y += move; a.el.style.transform = `translateY(${a.y}px)`;
          if (a.y + a.h >= floor) missed(a);
        }
        if (running) raf = requestAnimationFrame(frame);
      }
      function remove(a) { a.el.remove(); active = active.filter(x => x !== a); if (target === a) { target = null; typed = 0; } }
      function missed(a) {
        remove(a); lives--; paintHud();
        msg.textContent = `Missed "${a.word}".`;
        if (lives <= 0) end();
      }
      function type(k) {
        if (!running) return;
        if (!target) {
          target = active.filter(a => a.word[0] === k).sort((a, b) => b.y - a.y)[0] || null;   // the lowest word that starts with this key
          typed = 0;
          if (!target) return;
        }
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
      falling._leave = pause;
      falling._enter = () => SBTY.take(handler);
      document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
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
      P.innerHTML = `${NOTE}
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
      function paintBars() {
        const you = typer.pos() / text.length, gp = gpos() / text.length;
        $('.gr-you i', P).style.width = (you * 100) + '%'; $('.gr-yp', P).textContent = Math.floor(you * 100) + '%';
        $('.gr-ghost i', P).style.width = (gp * 100) + '%'; $('.gr-gp', P).textContent = Math.floor(gp * 100) + '%';
      }
      function frame() {
        if (!racing) return;
        const g = gpos();
        typer.ghost(g >= text.length ? -1 : Math.floor(g));
        paintBars();
        raf = requestAnimationFrame(frame);
      }
      function paintLine() {
        $('.gline', P).innerHTML = `<span>Race the ghost through three sentences. The ghost types at <b>${ghostWpm()} words a minute</b>${R.speed === 'best' ? (R.best ? ' (your best race)' : ' (your target speed, until you finish a race)') : ''} and starts with your first key. Its place in the text has an orange line.</span><span>${R.best ? `Your best race: <b>${r1(R.best)} words a minute</b>` : ''}</span>`;
        P.querySelectorAll('[data-gs]').forEach(x => x.setAttribute('aria-pressed', x.dataset.gs === R.speed));
      }
      function start() {
        cancelAnimationFrame(raf); racing = false; over = false; t0 = 0;
        text = G.pickText(X.sentences, 3);
        topts.wait = SBTY.shared().wait;
        typer.reset(text); typer.active(); typer.ghost(0);
        done.hidden = true; $('.grtype', P).hidden = false;
        msg.textContent = 'Start typing when you are ready.';
        paintBars(); paintLine();
      }
      function finish(r) {
        racing = false; over = true; cancelAnimationFrame(raf);
        const yourMs = performance.now() - t0, ghostMs = text.length / (ghostWpm() * 5 / 60) * 1000, won = yourMs <= ghostMs;
        typer.ghost(-1);
        const wpm = text.length / 5 / (yourMs / 60000);
        const newBest = wpm > R.best && r.acc >= 0.9;
        if (newBest) R.best = Math.round(wpm * 10) / 10;
        if (won) R.wins = (R.wins || 0) + 1;
        ctx.save();
        paintBars();
        const gap = Math.abs(ghostMs - yourMs) / 1000;
        msg.textContent = '';
        done.hidden = false;
        done.innerHTML = `<div class="gover"><h2>${won ? 'You beat the ghost' : 'The ghost won'} by ${gap.toFixed(1)} seconds</h2>
          <p class="lead">You typed ${r1(wpm)} words a minute with ${Math.floor(r.acc * 100 + 1e-9)}% right.${newBest ? ' That is your best race, so the ghost will race at this speed next time on "Your best".' : r.acc < 0.9 ? ' Races at 90% right or better can become your best.' : ''}</p>
          <div class="row"><button class="btn" type="button" data-x="again">Race again</button></div></div>`;
        $('[data-x="again"]', done).onclick = start;
        msg.focus({ preventScroll: true });
        paintLine();
      }
      P.querySelectorAll('[data-gs]').forEach(x => x.onclick = () => { R.speed = x.dataset.gs; ctx.save(); x.blur(); start(); });
      ghost._leave = () => { if (racing) start(); };
      ghost._enter = () => typer.active();
      document.addEventListener('visibilitychange', () => { if (document.hidden && racing && visible(P)) start(); });
      start();
    },
    leave() { if (ghost._leave) ghost._leave(); },
    enter() { if (ghost._enter) ghost._enter(); }
  };

  SBM.start({ module: 'typing-games', defaults: {}, tools: { sprint, falling, ghost } });
})();
