/* Speed and Accuracy Tests (Typing): Speed test, Accuracy test, and Your own text.
   Text and scoring come from shared/sb-typing-gen.js (SBTG); the typing box, keyboard, and the settings and letter stats shared with
   Learn the Keys come from shared/sb-typing.js (SBTY). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = SB.esc, G = window.SBTG;
  window.SB_NO_SLASH_SEARCH = true;   // "/" is a key to type here
  const NEEDS = SBTY.needsKeyboard();
  const pct = x => Math.floor(x * 100 + 1e-9) + '%';   // rounded down, so 100% means no mistakes
  const r1 = x => Math.round(x);
  const clock = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const LEVELS = [{ id: 'easy', label: 'Easy' }, { id: 'medium', label: 'Medium' }, { id: 'hard', label: 'Hard' }, { id: 'insane', label: 'Insane' }];
  const LEVEL_TEXT = { easy: 'common words', medium: 'sentences', hard: 'sentences with numbers', insane: 'paragraphs, no Backspace' };
  const NOTE = NEEDS ? '<p class="note">Typing needs a keyboard. Connect one to this phone or tablet, or tap the words to use the on-screen keyboard.</p>' : '';
  const seg = (name, list, label) => `<div class="seg" role="group" aria-label="${esc(label)}">${list.map(o => `<button type="button" data-${name}="${o.id}">${esc(o.label)}</button>`).join('')}</div>`;
  const tile = (label, value, note) => `<div><span>${esc(label)}</span><b>${value}</b>${note ? `<small>${esc(note)}</small>` : ''}</div>`;

  /* the speed chart: one line, words a minute in each 5 seconds, with a hover readout and a table for screen readers */
  function chart(host, buckets, step) {
    const W = 600, H = 170, L = 38, R = 10, T = 10, B = 26;
    const top = Math.max(10, Math.ceil(Math.max(...buckets) / 10) * 10);
    const x = i => L + (buckets.length === 1 ? (W - L - R) / 2 : i * (W - L - R) / (buckets.length - 1)), y = v => T + (H - T - B) * (1 - v / top);
    const ticks = [0, top / 2, top];
    const lbl = i => clock((i + 1) * step);
    const every = Math.ceil(buckets.length / 6);
    host.innerHTML = `<h3>Words a minute during the test</h3>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Speed during the test, from ${r1(Math.min(...buckets))} to ${r1(Math.max(...buckets))} words a minute">
        ${ticks.map(t => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/><text class="ax" x="${L - 6}" y="${y(t) + 4}" text-anchor="end">${t}</text>`).join('')}
        ${buckets.map((b, i) => i % every === 0 || i === buckets.length - 1 ? `<text class="ax" x="${x(i)}" y="${H - 6}" text-anchor="${i === buckets.length - 1 && buckets.length > 1 ? 'end' : i === 0 && buckets.length > 1 ? 'start' : 'middle'}">${lbl(i)}</text>` : '').join('')}
        <path class="ln" d="${buckets.map((b, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(b).toFixed(1)).join(' ')}"/>
        <line class="cross" x1="0" x2="0" y1="${T}" y2="${H - B}" visibility="hidden"/>
        <circle class="dot" r="5" cx="0" cy="0" visibility="hidden"/>
        ${buckets.map((b, i) => { const w = (W - L - R) / Math.max(1, buckets.length - 1); return `<rect class="hit" data-i="${i}" x="${x(i) - w / 2}" y="${T}" width="${w}" height="${H - T - B}"/>`; }).join('')}
      </svg>
      <div class="ttip" hidden></div>
      <table class="sr"><caption>Words a minute in each ${step / 1000} seconds</caption><tr><th>Time</th><th>Words a minute</th></tr>${buckets.map((b, i) => `<tr><td>${lbl(i)}</td><td>${r1(b)}</td></tr>`).join('')}</table>`;
    const svg = $('svg', host), tip = $('.ttip', host), cross = $('.cross', svg), dot = $('.dot', svg);
    const show = i => {
      const px = x(i), py = y(buckets[i]), box = svg.getBoundingClientRect(), k = box.width / W;
      cross.setAttribute('x1', px); cross.setAttribute('x2', px); cross.setAttribute('visibility', 'visible');
      dot.setAttribute('cx', px); dot.setAttribute('cy', py); dot.setAttribute('visibility', 'visible');
      tip.hidden = false; tip.textContent = `${clock(i * step)} to ${lbl(i)}: ${r1(buckets[i])} words a minute`;
      tip.style.left = Math.min(Math.max(px * k + 10, 90), box.width - 80) + 'px'; tip.style.top = (py * k + 34) + 'px';
    };
    const hide = () => { tip.hidden = true; cross.setAttribute('visibility', 'hidden'); dot.setAttribute('visibility', 'hidden'); };
    svg.addEventListener('pointermove', e => { const r = e.target.closest('rect.hit'); if (r) show(Number(r.dataset.i)); });
    svg.addEventListener('pointerleave', hide);
  }

  /* shared page parts for the two tests */
  function frame(P, opts) {
    P.innerHTML = `${NOTE}
      <div class="tbar"><div class="row">${opts.left}</div><div class="row">${opts.right || ''}</div></div>
      <div class="tline"></div>
      <div class="ttype"></div>
      <p class="msg tmsg" role="status" tabindex="-1"></p>
      <div class="tres" hidden></div>
      <div class="tkb"></div>`;
    const kbHost = $('.tkb', P);
    return { line: $('.tline', P), msg: $('.tmsg', P), res: $('.tres', P), box: $('.ttype', P), kbHost };
  }
  function keyboardFor(kbHost, typer, rows) {
    kbHost.innerHTML = '';
    const kb = SBTY.keyboard(kbHost, { rows, zones: true, onTap: k => { typer.active(); typer.type(k); } });
    kbHost.hidden = !SBTY.shared().showKb;
    return kb;
  }

  /* ===================== Speed test ===================== */
  const LENS = [{ id: '30', label: '30 seconds' }, { id: '60', label: '1 minute' }, { id: '180', label: '3 minutes' }, { id: '300', label: '5 minutes' }];
  const speed = {
    init(ctx) {
      const P = ctx.panel, st = ctx.state;
      st.speed = Object.assign({ len: '60', level: 'medium', best: {}, history: [] }, st.speed || {});
      const S = st.speed;
      const ui = frame(P, { left: seg('len', LENS, 'Test length') + seg('lvl', LEVELS, 'Level'), right: '<span class="pill tclock" aria-live="off" title="Time left"></span>' });
      let keys = [], t0 = 0, timer = null, seed = 0, over = false, kb = null;
      const ms = () => Number(S.len) * 1000, insane = () => S.level === 'insane';
      const topts = {
        onStart: () => { t0 = performance.now(); timer = setInterval(tick, 200); },
        onKey: info => {
          if (info.key !== 'Backspace') keys.push({ t: performance.now() - t0, good: info.good, ch: info.want });
          if (kb) { kb.only('next', SBTY.keysFor(info.next)); if (!info.good && info.key !== 'Backspace') kb.flash(info.key, false); }
        },
        onDone: () => finish(true)
      };
      const typer = SBTY.typer($('.ttype', P), topts);
      speed._typer = typer;
      const clockEl = $('.tclock', P);
      function tick() { const left = ms() - (performance.now() - t0); clockEl.textContent = clock(left); if (left <= 0) finish(false); }
      function paintLine() {
        const b = S.best[S.len + ':' + S.level];
        ui.line.innerHTML = `<span>${esc(LEVELS.find(l => l.id === S.level).label)}: ${esc(LEVEL_TEXT[S.level])}. The clock starts with your first key.</span>
          <span>${b ? `Best for this test: <b>${r1(b.wpm)} words a minute</b>, ${pct(b.acc)}` : 'No tests at this length and level yet'}</span>`;
        P.querySelectorAll('[data-len]').forEach(x => x.setAttribute('aria-pressed', x.dataset.len === S.len));
        P.querySelectorAll('[data-lvl]').forEach(x => x.setAttribute('aria-pressed', x.dataset.lvl === S.level));
      }
      function start(sameText) {
        clearInterval(timer); timer = null; over = false; keys = []; t0 = 0;
        if (!sameText) seed = Math.floor(Math.random() * 1e9);
        const need = Math.max(400, Math.ceil(Number(S.len) / 60 * 5 * 130));   // enough text for 130 words a minute
        topts.wait = insane() ? false : SBTY.shared().wait; topts.noBack = insane();
        typer.reset(G.testText(S.level, need, G.seeded(seed)));
        typer.active();
        ui.res.hidden = true; ui.box.hidden = false;
        kb = keyboardFor(ui.kbHost, typer, S.level === 'easy' ? 'letters' : 'full');
        kb.only('next', SBTY.keysFor(typer.next()));
        clockEl.textContent = clock(ms());
        ui.msg.className = 'msg tmsg'; ui.msg.textContent = insane() ? 'Insane: wrong keys move on and Backspace does nothing.' : 'Type as fast as you can while staying accurate.';
        paintLine();
      }
      function finish(textDone) {
        if (over) return; over = true;
        clearInterval(timer); timer = null;
        const used = textDone ? Math.min(ms(), performance.now() - t0) : ms();
        typer.stop();
        const snap = typer.snapshot();
        const sc = G.timedScore(keys, used), buckets = G.speedBuckets(keys, used), cons = G.consistency(buckets);
        clockEl.textContent = '0:00';
        SBTY.addStats(snap.chars);
        const key = S.len + ':' + S.level, b = S.best[key];
        if (!b || sc.wpm > b.wpm) S.best[key] = { wpm: Math.round(sc.wpm * 10) / 10, acc: Math.round(sc.acc * 1000) / 1000 };
        S.history = (S.history || []).concat([{ at: Date.now(), len: Number(S.len), level: S.level, wpm: Math.round(sc.wpm * 10) / 10, raw: Math.round(sc.raw * 10) / 10, acc: Math.round(sc.acc * 1000) / 1000, cons: Math.round(cons * 100) / 100 }]).slice(-30);
        ctx.save();
        const counts = Number(S.len) >= 60 && sc.acc >= 0.9;   // what counts for mastery: a test of 1 minute or more at 90% or better
        ctx.result(counts ? r1(sc.wpm) : 0, null);
        if (counts) ctx.credit();
        ui.msg.className = 'msg tmsg good';
        ui.msg.textContent = `Time! ${r1(sc.wpm)} words a minute with ${pct(sc.acc)} right.` + (counts ? '' : Number(S.len) < 60 ? ' Tests of 1 minute or more count toward mastery.' : ' Aim for 90% right so the test counts.');
        ui.kbHost.hidden = true; ui.box.hidden = true; ui.res.hidden = false;
        ui.res.innerHTML = `<div><div class="ttiles">
            ${tile('Speed', r1(sc.wpm), 'words a minute, right keys only')}
            ${tile('Raw speed', r1(sc.raw), 'every key, mistakes too')}
            ${tile('Accuracy', pct(sc.acc), (keys.length - keys.filter(k => k.good).length) + ' wrong keys')}
            ${tile('Steadiness', r1(cons * 100) + '%', 'how even your speed was')}
          </div>
          <div class="tbtns"><button class="btn" type="button" data-x="again">Try again</button><button class="btn ghost" type="button" data-x="same">Same text again</button></div></div>
          <div class="tchart"></div>`;
        chart($('.tchart', ui.res), buckets, 5000);
        $('[data-x="again"]', ui.res).onclick = () => start(false);
        $('[data-x="same"]', ui.res).onclick = () => start(true);
        ui.msg.focus({ preventScroll: true });   // not the Try again button: a space typed after time is up must not start a new test
        paintLine();
      }
      P.querySelectorAll('[data-len]').forEach(x => x.onclick = () => { S.len = x.dataset.len; ctx.save(); x.blur(); start(false); });
      P.querySelectorAll('[data-lvl]').forEach(x => x.onclick = () => { S.level = x.dataset.lvl; ctx.save(); x.blur(); start(false); });
      speed._leave = () => { if (typer.started() && !over) { clearInterval(timer); start(true); } };   // leaving the tab mid-test starts it over
      speed._enter = () => { if (!typer.started() || over) { if (!over) start(true); } typer.active(); };
      start(false);
    },
    leave() { if (speed._leave) speed._leave(); },
    enter() { if (speed._enter) speed._enter(); }
  };

  /* ===================== Accuracy test ===================== */
  const accuracy = {
    init(ctx) {
      const P = ctx.panel, st = ctx.state;
      st.acc = Object.assign({ level: 'medium', best: {} }, st.acc || {});
      const A = st.acc;
      const ui = frame(P, { left: seg('lvl', LEVELS, 'Level') });
      let kb = null, over = false, stoppedAt = -1;
      const insane = () => A.level === 'insane';
      const topts = {
        wait: true,
        onKey: info => {
          if (kb) { kb.only('next', SBTY.keysFor(info.next)); if (!info.good && info.key !== 'Backspace') kb.flash(info.key, false); }
          if (insane() && !info.good && info.key !== 'Backspace' && !over) { stoppedAt = typer.pos(); typer.stop(); done(null); }
        },
        onDone: r => done(r)
      };
      const typer = SBTY.typer($('.ttype', P), topts);
      accuracy._typer = typer;
      function paintLine() {
        const b = A.best[A.level];
        ui.line.innerHTML = `<span>${esc(LEVELS.find(l => l.id === A.level).label)}: ${insane() ? 'a paragraph, and the first mistake ends the test' : esc(LEVEL_TEXT[A.level]) + '. A wrong key has to be fixed.'} Take your time: only mistakes count.</span>
          <span>${b ? `Best: <b>${b.score}%</b>` : 'No tests at this level yet'}</span>`;
        P.querySelectorAll('[data-lvl]').forEach(x => x.setAttribute('aria-pressed', x.dataset.lvl === A.level));
      }
      function start() {
        over = false; stoppedAt = -1;
        const text = A.level === 'easy' ? G.commonWords(Math.random, 300, 20) : A.level === 'insane' ? G.testText('insane', 1) : G.testText(A.level, 150);
        typer.reset(text); typer.active();
        ui.res.hidden = true; ui.box.hidden = false;
        kb = keyboardFor(ui.kbHost, typer, A.level === 'easy' ? 'letters' : 'full');
        kb.only('next', SBTY.keysFor(typer.next()));
        ui.msg.className = 'msg tmsg'; ui.msg.textContent = 'Start typing when you are ready.';
        paintLine();
      }
      function done(r) {
        if (over) return; over = true;
        const snap = typer.snapshot(), total = snap.text.length;
        let score, line;
        if (r) {
          score = Math.floor(r.acc * 100 + 1e-9);
          line = `${score}% right with ${r.wrong} ${r.wrong === 1 ? 'mistake' : 'mistakes'}, at ${r1(r.wpm)} words a minute.`;
        } else {
          score = Math.floor(stoppedAt / total * 100);
          line = `Stopped at the first mistake after ${stoppedAt} of ${total} characters (${score}% of the paragraph).`;
        }
        SBTY.addStats(snap.chars);
        const b = A.best[A.level]; if (!b || score > b.score) A.best[A.level] = { score };
        ctx.save();
        ctx.result(score, 100);
        if (score >= 95) ctx.credit();
        if (score === 100) ctx.sfx.win();
        const missed = [...new Set(snap.chars.filter(c => !c.ok && c.ch !== ' ').map(c => c.ch))];
        ui.msg.className = 'msg tmsg' + (score >= 97 ? ' good' : '');
        ui.msg.innerHTML = esc(line) + (score === 100 ? ' Perfect!' : '') + (missed.length ? ` Keys to practice: <b>${missed.map(esc).join(' ')}</b>` : '');
        ui.kbHost.hidden = true; ui.res.hidden = false;   // the text stays, so the mistakes can be seen
        ui.res.innerHTML = `<div class="tbtns" style="margin-top:0"><button class="btn" type="button" data-x="again">Try again</button></div>`;
        $('[data-x="again"]', ui.res).onclick = start; ui.msg.focus({ preventScroll: true });
        paintLine();
      }
      P.querySelectorAll('[data-lvl]').forEach(x => x.onclick = () => { A.level = x.dataset.lvl; ctx.save(); x.blur(); start(); });
      accuracy._enter = () => { if (!typer.started() && !over) start(); typer.active(); };
      start();
    },
    enter() { if (accuracy._enter) accuracy._enter(); }
  };

  /* ===================== Your own text ===================== */
  const custom = {
    init(ctx) {
      const P = ctx.panel, st = ctx.state;
      P.innerHTML = `${NOTE}<h2>Your own text</h2>
        <p class="lead">Paste or type something to practice, like spelling words or a paragraph from homework. Practice only.</p>
        <div class="tpaste"><textarea aria-label="Text to practice" maxlength="4000" placeholder="Paste text here"></textarea>
          <div class="terr" role="status"></div>
          <div class="row"><button class="btn" type="button" data-x="use">Practice this text</button></div></div>
        <div class="tdo" hidden><div class="ttype"></div><p class="msg tmsg" role="status" tabindex="-1"></p>
          <div class="row"><button class="btn" type="button" data-x="again">Type it again</button><button class="btn ghost" type="button" data-x="new">Use different text</button></div></div>`;
      const ta = $('textarea', P), err = $('.terr', P), paste = $('.tpaste', P), dobox = $('.tdo', P), msg = $('.tmsg', P);
      ta.value = st.custom || '';
      const typer = SBTY.typer($('.ttype', P), {
        wait: SBTY.shared().wait,
        onDone: r => {
          SBTY.addStats(r.chars);
          msg.className = 'msg tmsg good';
          msg.textContent = `Done: ${r1(r.wpm)} words a minute with ${pct(r.acc)} right.`;
          msg.focus({ preventScroll: true });
        }
      });
      custom._typer = typer; typer.stop();
      function go() {
        const t = G.cleanText(ta.value);
        if (t.length < 10) { err.textContent = 'Type or paste at least a few words first.'; return; }
        err.textContent = ''; st.custom = t; ctx.save();
        paste.hidden = true; dobox.hidden = false;
        typer.reset(t); typer.active();
        msg.className = 'msg tmsg'; msg.textContent = 'Start typing when you are ready.';
        document.activeElement.blur();
      }
      $('[data-x="use"]', P).onclick = go;
      $('[data-x="again"]', P).onclick = e => { typer.reset(st.custom); typer.active(); e.currentTarget.blur(); msg.className = 'msg tmsg'; msg.textContent = 'Start typing when you are ready.'; };
      $('[data-x="new"]', P).onclick = () => { typer.stop(); dobox.hidden = true; paste.hidden = false; ta.focus(); };
      custom._enter = () => { if (!dobox.hidden) typer.active(); };
    },
    enter() { if (custom._enter) custom._enter(); }
  };

  SBM.start({ module: 'typing-tests', defaults: {}, tools: { speed, accuracy, custom } });
})();
