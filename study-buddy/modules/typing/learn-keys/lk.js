/* Learn the Keys (Typing): the adaptive Lesson, Key Hunt, the Keyboard map, and Key stats.
   The logic (word lists, per-key stats, when a letter opens) is in shared/sb-typing-gen.js (SBTG);
   the keyboard and the typing box are in shared/sb-typing.js (SBTY). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = SB.esc, G = window.SBTG, ORDER = G.ORDER, TOTAL = ORDER.length;
  window.SB_NO_SLASH_SEARCH = true;   // "/" is a key to type here, not the search shortcut
  const NEEDS = SBTY.needsKeyboard();
  const pct = x => Math.floor(x * 100 + 1e-9) + '%';   // rounded down, so 100% means no mistakes at all
  const wpmTxt = x => Math.round(x) + ' words a minute';
  const UP = k => k === ';' ? ';' : k.toUpperCase();
  const fingerOf = k => { const f = SBTY.finger(k); return f ? f.name : ''; };

  /* Typing Drills also writes the shared fields (stats, target speed, Fix mistakes, keyboard) into this module's saved state.
     Before changing and saving, pick up what it wrote, so a save here never erases drill practice. */
  const SHARED = ['stats', 'target', 'wait', 'showKb'];
  function sync(st) {
    try { const saved = JSON.parse(localStorage.getItem(SB.moduleKey('learn-keys')) || '{}') || {}; SHARED.forEach(k => { if (saved[k] !== undefined) st[k] = saved[k]; }); } catch (e) {}
    if (!st.stats || typeof st.stats !== 'object') st.stats = {};
  }
  /* a page brought back from the browser's back/forward cache reloads, so it shows the latest stats */
  addEventListener('pageshow', e => { if (e.persisted) location.reload(); });

  /* the student's typing settings and stats live in this module's saved state */
  function open(st) { return ORDER.slice(0, Math.max(G.START, Math.min(TOTAL, st.unlocked || G.START))); }
  function target(st) { return Number(st.target) || 15; }

  /* ===================== Lesson ===================== */
  const lesson = {
    init(ctx) {
      const P = ctx.panel, st = ctx.state;
      P.innerHTML = `
        ${NEEDS ? '<p class="note">Typing lessons need a keyboard. Connect one to this phone or tablet. You can also tap the words to use the on-screen keyboard, or tap the keys in the picture.</p>' : ''}
        <div class="lkbar">
          <div class="lkletters" aria-label="Letters in the course"></div>
          <div class="lkopts">
            <label>Target speed <select id="lkTarget" data-typing title="Words a minute">${[10, 15, 20, 25, 30, 35, 40, 50].map(v => `<option value="${v}">${v} words a minute</option>`).join('')}</select></label>
            <button class="iconbtn" id="lkWait" title="When it is on, a wrong key has to be fixed before you go on"></button>
            <button class="iconbtn" id="lkKb"></button>
          </div>
        </div>
        <div class="lkfocus" aria-live="polite"></div>
        <div id="lkType"></div>
        <p class="msg lkmsg" role="status"></p>
        <div class="lkkb"></div>`;
      const kbHost = $('.lkkb', P), kb = SBTY.keyboard(kbHost, { rows: 'letters', zones: true, onTap: k => { typer.active(); typer.type(k); } });
      $('#lkTarget', P).value = String(target(st));
      const msg = $('.lkmsg', P);
      const setMsg = (t, cls = '') => { msg.className = 'msg lkmsg' + (cls ? ' ' + cls : ''); msg.innerHTML = t; };
      const topts = {
        wait: st.wait !== false,
        onKey: info => { kb.only('next', info.next ? [info.next] : []); if (!info.good && info.key !== 'Backspace') kb.flash(info.key, false); },
        onDone: done
      };
      const typer = SBTY.typer($('#lkType', P), topts);
      lesson._typer = typer;

      function paintKeys() {
        const o = open(st), tg = target(st), f = G.focusKey(o, st.stats, tg);
        $('.lkletters', P).innerHTML = ORDER.map(k => {
          const on = o.includes(k), rd = on && G.ready(st.stats, k, tg);
          return `<span class="${on ? '' : 'off'}${rd ? ' ready' : ''}${k === f ? ' focus' : ''}" title="${on ? (rd ? 'Ready' : 'Practicing') : 'Opens later'}">${esc(k)}</span>`;
        }).join('');
        kb.dimExcept(o);
        ORDER.forEach(k => { kb.set(k, 'ready', o.includes(k) && G.ready(st.stats, k, tg)); kb.set(k, 'focus', k === f); });
        const s = G.keyStat(st.stats, f), sp = Math.min(1, s.wpm / tg);
        $('.lkfocus', P).innerHTML = `<span>Focus letter <span class="fk">${esc(f)}</span></span>
          <span>Speed <span class="lkmeter" aria-hidden="true"><i style="width:${Math.round(sp * 100)}%"></i></span> ${s.n ? Math.round(s.wpm) : 0} of ${tg} words a minute</span>
          <span>Accuracy ${s.n ? pct(s.acc) : '–'} (needs 95%)</span>
          <span>${o.length} of ${TOTAL} letters open</span>`;
        return f;
      }
      function paintOpts() {
        const w = $('#lkWait', P); w.textContent = 'Fix mistakes: ' + (st.wait !== false ? 'on' : 'off'); w.setAttribute('aria-pressed', st.wait !== false);
        const k = $('#lkKb', P); k.textContent = 'Keyboard: ' + (st.showKb !== false ? 'on' : 'off'); k.setAttribute('aria-pressed', st.showKb !== false);
        kbHost.hidden = st.showKb === false;
      }
      function newRound() {
        const f = paintKeys();
        const words = G.lessonWords({ allowed: open(st), focus: f, n: 12 });
        typer.reset(words.join(' '));
        kb.only('next', [typer.next()]);
      }
      function done(r) {
        sync(st);
        G.addRound(st.stats, r.chars);
        const wpm = Math.round(r.wpm * 10) / 10, acc = Math.round(r.acc * 1000) / 1000;
        st.rounds = (st.rounds || []).concat([{ at: Date.now(), wpm, acc }]).slice(-50);
        st.best = Math.max(st.best || 0, wpm);
        const o = open(st); let opened = null;
        if (G.canUnlock(o, st.stats, target(st))) { st.unlocked = o.length + 1; opened = ORDER[o.length]; }
        ctx.save();
        ctx.result(open(st).length, TOTAL);
        if (r.acc >= 0.9) ctx.credit();
        let t = `Round done: <b>${wpmTxt(r.wpm)}</b>, <b>${pct(r.acc)}</b> right.`;
        if (opened) { t += ` New letter: <b>${esc(opened)}</b>! Use your ${esc(fingerOf(opened))}.`; ctx.sfx.win(); ctx.toast('New letter: ' + opened); }
        else if (o.length === TOTAL && o.every(k => G.ready(st.stats, k, target(st)))) t += ' Every letter is ready. Try a faster target speed.';
        else if (r.acc < 0.9) t += ' Slow down a little: aim for fewer mistakes.';
        setMsg(t, opened ? 'good' : '');
        newRound();
      }

      $('#lkTarget', P).onchange = e => { sync(st); st.target = Number(e.target.value); ctx.save(); paintKeys(); e.target.blur(); typer.active(); };   // blur, so the next keys type instead of changing the menu
      $('#lkWait', P).onclick = e => { sync(st); st.wait = st.wait === false; topts.wait = st.wait; ctx.save(); paintOpts(); e.currentTarget.blur(); typer.active(); };   // takes effect from the next key; the round goes on
      $('#lkKb', P).onclick = e => { sync(st); st.showKb = st.showKb === false; ctx.save(); paintOpts(); e.currentTarget.blur(); typer.active(); };
      lesson._refresh = () => { sync(st); topts.wait = st.wait !== false; $('#lkTarget', P).value = String(target(st)); paintOpts(); if (!typer.started()) newRound(); else paintKeys(); };
      paintOpts();
      setMsg('Rest your fingers on the home row: <b>A S D F</b> and <b>J K L ;</b>. Then start typing.');
      newRound();
    },
    enter() { if (lesson._refresh) lesson._refresh(); if (lesson._typer) lesson._typer.active(); }
  };

  /* ===================== Key Hunt ===================== */
  const SETS = [
    { id: 'home', label: 'Home row', keys: 'asdfghjkl' },
    { id: 'top', label: 'Top row', keys: 'qwertyuiop' },
    { id: 'bottom', label: 'Bottom row', keys: 'zxcvbnm' },
    { id: 'all', label: 'All letters', keys: 'abcdefghijklmnopqrstuvwxyz' }
  ];
  const ROUND = 10;
  const hunt = {
    init(ctx) {
      const P = ctx.panel, st = ctx.state;
      st.hunt = Object.assign({ set: 'home', caps: true }, st.hunt || {});   // capitals by default: they match the letters printed on the keys
      P.classList.add('hunt');
      P.innerHTML = `
        <div class="hunthead">
          <div class="huntq" aria-live="polite"></div>
          <div class="row">
            <div class="seg" role="group" aria-label="Which keys">${SETS.map(s => `<button type="button" data-set="${s.id}">${s.label}</button>`).join('')}</div>
            <button class="iconbtn" id="khCaps" title="Show the letter as a capital, the way it looks on the keys"></button>
            <span class="pill" id="khRound"></span>
          </div>
        </div>
        <div class="khkb"></div>
        <p class="msg" role="status"></p>`;
      const msg = $('.msg', P), q = $('.huntq', P);
      const kb = SBTY.keyboard($('.khkb', P), { rows: 'letters', zones: true, onTap: k => press(k) });
      let list = [], i = 0, score = 0, firstTry = true, waiting = false, over = false, timer = null;
      const setMsg = (t, cls = '') => { msg.className = 'msg' + (cls ? ' ' + cls : ''); msg.textContent = t; };
      const show = k => st.hunt.caps ? k.toUpperCase() : k;

      function paintOpts() {
        P.querySelectorAll('[data-set]').forEach(b => b.setAttribute('aria-pressed', b.dataset.set === st.hunt.set));
        const c = $('#khCaps', P); c.textContent = 'Capitals: ' + (st.hunt.caps ? 'on' : 'off'); c.setAttribute('aria-pressed', !!st.hunt.caps);
      }
      function start() {
        clearTimeout(timer);
        const keys = (SETS.find(s => s.id === st.hunt.set) || SETS[0]).keys.split('');
        list = [];
        while (list.length < ROUND) { const k = keys[Math.floor(Math.random() * keys.length)]; if (k !== list[list.length - 1]) list.push(k); }
        i = 0; score = 0; over = false;
        kb.dimExcept(keys);
        $('.khkb', P).hidden = false;
        ask();
      }
      function ask() {
        const k = list[i]; firstTry = true; waiting = false;
        const said = 'the letter ' + k.toUpperCase();
        q.innerHTML = `<span>Find</span><span class="huntletter">${esc(show(k))}</span>${ctx.sayButton('Find ' + said, 'Hear the letter')}`;
        $('#khRound', P).textContent = `${i + 1} of ${ROUND}`;
        kb.clear('hint'); kb.clear('sel');
        setMsg('Press the key on your keyboard, or tap it.');
        ctx.say('Find ' + said);
      }
      function press(raw) {
        if (over || waiting || !list.length) return;
        const k = SBTY.keyOf(raw), want = list[i];
        if (!/^[a-z]$/.test(k)) return;   // only letters count; the space bar and other keys are ignored
        if (k === want) {
          kb.flash(k, true); ctx.sfx.good();
          if (firstTry) { score++; ctx.credit(); }
          setMsg(firstTry ? 'Yes! That is the letter ' + show(want) + '.' : 'There it is!', 'good');
          waiting = true;
          timer = setTimeout(advance, 700);
        } else {
          kb.flash(k, false); ctx.sfx.bad();
          if (firstTry) ctx.miss('Find ' + want);
          firstTry = false;
          kb.set(want, 'hint', true);
          setMsg(`That was the letter ${show(k)}. Look for ${show(want)}: use your ${fingerOf(want)}.`, 'bad');
        }
      }
      function advance() { timer = null; i++; if (i >= ROUND) finish(); else ask(); }
      function finish() {
        over = true; ctx.result(score, ROUND);
        if (score === ROUND) ctx.sfx.win();
        $('.khkb', P).hidden = true;
        $('#khRound', P).textContent = 'Done';
        q.innerHTML = '';
        setMsg('');
        const box = document.createElement('div'); box.className = 'huntdone';
        const stars = score >= 9 ? 3 : score >= 7 ? 2 : score >= 5 ? 1 : 0;
        box.innerHTML = `<div class="stars">${[0, 1, 2].map(n => `<span class="${n < stars ? '' : 'off'}">&#9733;</span>`).join('')}</div>
          <h2>${score} of ${ROUND} found on the first try</h2><p class="lead">${score >= 9 ? 'Great finding!' : 'Keep looking at the keys and try again.'}</p>
          <button class="btn" type="button" id="khAgain">Play again</button>`;
        msg.before(box);
        $('#khAgain', box).onclick = () => { box.remove(); start(); };
        $('#khAgain', box).focus();
      }
      P.querySelectorAll('[data-set]').forEach(b => b.onclick = () => { sync(st); st.hunt.set = b.dataset.set; ctx.save(); paintOpts(); const d = $('.huntdone', P); if (d) d.remove(); start(); });
      $('#khCaps', P).onclick = () => { sync(st); st.hunt.caps = !st.hunt.caps; ctx.save(); paintOpts(); if (!over && list.length) { const k = list[i]; $('.huntletter', P).textContent = show(k); } };
      hunt._h = { live: () => !P.hidden && P.offsetParent !== null, type: k => press(k), back() {} };
      /* leaving the tab pauses the round; coming back carries on where it was */
      hunt._leave = () => { if (timer) { clearTimeout(timer); timer = null; hunt._resume = true; } };
      hunt._enter = () => { SBTY.take(hunt._h); if (hunt._resume) { hunt._resume = false; advance(); } };
      paintOpts(); start();
      SBTY.take(hunt._h);
    },
    enter() { if (hunt._enter) hunt._enter(); },
    leave() { if (hunt._leave) hunt._leave(); }
  };

  /* ===================== Keyboard map ===================== */
  const map = {
    init(ctx) {
      const P = ctx.panel;
      P.innerHTML = `<h2>Keyboard map</h2>
        <p class="lead">Each color is one finger. Press any key, or tap one, to see which finger types it.</p>
        <div class="kmgrid">
          <div>
            <div class="kmkb"></div>
            <div class="kmlegend" aria-label="Colors">
              <span><i style="background:var(--fz-p)"></i>Pinky fingers</span><span><i style="background:var(--fz-r)"></i>Ring fingers</span>
              <span><i style="background:var(--fz-m)"></i>Middle fingers</span><span><i style="background:var(--fz-i)"></i>Pointer fingers</span>
              <span><i style="background:var(--fz-t)"></i>Thumbs (space bar)</span>
            </div>
          </div>
          <div>
            <div class="kmpress" aria-live="polite">Press a key to see its finger.</div>
            <h3>Getting ready to type</h3>
            <ul class="kmtips">
              <li>Sit up tall with your feet flat on the floor.</li>
              <li>Curve your fingers a little, and keep your wrists up, not resting on the desk.</li>
              <li>Rest your left fingers on <b>A S D F</b> and your right fingers on <b>J K L ;</b>. This is the <b>home row</b>.</li>
              <li>Feel the little bumps on <b>F</b> and <b>J</b>. Your pointer fingers go there, so you can find home without looking.</li>
              <li>Press the space bar with your thumb.</li>
              <li>After each key, move your finger back to the home row.</li>
              <li>Keep your eyes on the screen, not on your hands.</li>
              <li>Go for no mistakes first. Speed comes with practice.</li>
            </ul>
          </div>
        </div>`;
      const kb = SBTY.keyboard($('.kmkb', P), { rows: 'full', zones: true, tapAll: true, onTap: k => show(k) });
      const NAMES = { ' ': 'Space bar', ShiftLeft: 'Shift', ShiftRight: 'Shift', CapsLock: 'Caps Lock', Enter: 'Enter', Backspace: 'Backspace', Tab: 'Tab' };
      function show(raw) {
        const k = raw.length > 1 ? raw : SBTY.keyOf(raw), f = SBTY.finger(k); if (!f) return;
        kb.clear('sel'); kb.set(k, 'sel', true);
        $('.kmpress', P).innerHTML = `<b class="big">${esc(NAMES[k] || UP(k))}</b> ${esc(f.name.charAt(0).toUpperCase() + f.name.slice(1))}`;
      }
      map._h = { live: () => !P.hidden && P.offsetParent !== null, type: k => show(k), named: k => show(k), back() {} };
      SBTY.take(map._h);
    },
    enter() { if (map._h) SBTY.take(map._h); }
  };

  /* ===================== Key stats ===================== */
  const stats = {
    init(ctx) {
      const P = ctx.panel;
      let mode = 'speed';
      P.innerHTML = `<h2>Key stats</h2>
        <div class="ksum"></div>
        <div class="ksgrid">
          <div>
            <div class="row between" style="margin-bottom:6px"><b>How each letter is going</b>
              <div class="seg" role="group" aria-label="Color the keys by"><button type="button" data-m="speed">Speed</button><button type="button" data-m="acc">Accuracy</button></div></div>
            <div class="kskb"></div>
            <div class="kslegend" aria-hidden="true"><span id="ksLo"></span><i style="background:var(--heat0)"></i><i style="background:var(--heat1)"></i><i style="background:var(--heat2)"></i><i style="background:var(--heat3)"></i><i style="background:var(--heat4)"></i><span id="ksHi"></span></div>
          </div>
          <div><b>Open letters</b><p class="hint" style="margin:2px 0 6px">A letter is ready at 95% right and your target speed, with at least 10 tries.</p><div class="kskeys"></div></div>
        </div>`;
      const kb = SBTY.keyboard($('.kskb', P), { rows: 'letters' });
      function paint() {
        const st = ctx.state; sync(st); const o = open(st), tg = target(st), f = G.focusKey(o, st.stats || {}, tg), rs = st.rounds || [], last = rs.slice(-10);
        const avg = (a, k) => a.length ? a.reduce((s, x) => s + x[k], 0) / a.length : 0;
        $('.ksum', P).innerHTML = `<div><span>Letters open</span><b>${o.length} of ${TOTAL}</b></div>
          <div><span>Best round</span><b>${st.best ? wpmTxt(st.best) : '–'}</b></div>
          <div><span>Last ${last.length || 10} rounds</span><b>${last.length ? wpmTxt(avg(last, 'wpm')) + ', ' + pct(avg(last, 'acc')) : '–'}</b></div>
          <div><span>Target speed</span><b>${tg} words a minute</b></div>`;
        P.querySelectorAll('[data-m]').forEach(b => b.setAttribute('aria-pressed', b.dataset.m === mode));
        $('#ksLo', P).textContent = mode === 'speed' ? 'Slow' : 'Many mistakes'; $('#ksHi', P).textContent = mode === 'speed' ? 'Fast' : 'Few mistakes';
        const heat = {};
        o.forEach(k => {
          const s = G.keyStat(st.stats || {}, k); if (!s.n) return;
          if (mode === 'speed') { const r = s.wpm / tg; heat[k] = r < 0.5 ? 0 : r < 0.75 ? 1 : r < 1 ? 2 : r < 1.3 ? 3 : 4; }
          else heat[k] = s.acc < 0.85 ? 0 : s.acc < 0.9 ? 1 : s.acc < 0.95 ? 2 : s.acc < 0.98 ? 3 : 4;
        });
        kb.heat(heat);
        kb.dimExcept(o);
        $('.kskeys', P).innerHTML = o.map(k => {
          const s = G.keyStat(st.stats || {}, k), rd = G.ready(st.stats || {}, k, tg);
          return `<div class="${rd ? 'ready' : ''}${k === f ? ' focus' : ''}"><b>${esc(k)}</b>${rd ? 'Ready' : k === f ? 'Focus' : 'Practicing'}<br>${s.n ? Math.round(s.wpm) + ' a minute · ' + pct(s.acc) : 'Not typed yet'}</div>`;
        }).join('');
      }
      P.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; paint(); });
      stats._paint = paint; paint();
    },
    enter() { if (stats._paint) stats._paint(); }
  };

  SBM.start({
    module: 'learn-keys',
    defaults: { unlocked: G.START, stats: {}, target: 15, wait: true, showKb: true, rounds: [], best: 0, hunt: { set: 'home', caps: true } },
    tools: { lesson, hunt, map, stats }
  });
})();
