/* Typing Drills (Typing): Rows, Capitals and punctuation, Common words, Sentences, Paragraphs, and Weak keys.
   Text comes from shared/sb-typing-gen.js (SBTG) and shared/sb-typing-text.js (SBTX); the typing box and keyboard from shared/sb-typing.js.
   The student's target speed, "Fix mistakes", keyboard switch, and per-letter stats are shared with Learn the Keys
   (saved under the learn-keys module key), so practice here also counts there. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = SB.esc, G = window.SBTG, X = window.SBTX || { sentences: [], numbers: [], paragraphs: [] };
  window.SB_NO_SLASH_SEARCH = true;   // "/" is a key to type here
  const NEEDS = SBTY.needsKeyboard();
  const pct = x => Math.floor(x * 100 + 1e-9) + '%';   // rounded down, so 100% means no mistakes at all
  const wpmTxt = x => Math.round(x) + ' words a minute';
  const GOAL_ACC = { easy: 0.90, medium: 0.93, hard: 0.95, insane: 0.97 };

  /* ---------- settings and stats shared with Learn the Keys ---------- */
  const LK = () => SB.moduleKey('learn-keys');
  const readLK = () => { try { return JSON.parse(localStorage.getItem(LK()) || '{}') || {}; } catch (e) { return {}; } };
  function shared() { const s = readLK(); return { target: Number(s.target) || 15, wait: s.wait !== false, showKb: s.showKb !== false, stats: s.stats && typeof s.stats === 'object' ? s.stats : {}, unlocked: Number(s.unlocked) || G.START }; }
  function saveShared(fn) { const s = readLK(); fn(s); try { localStorage.setItem(LK(), JSON.stringify(s)); } catch (e) {} }

  /* letters the student knows: the ones open in Learn the Keys, plus any typed at least 10 times in drills */
  function knownLetters(sh) {
    const open = new Set(G.ORDER.slice(0, Math.min(26, Math.max(G.START, sh.unlocked))));
    G.ORDER.forEach(k => { if (G.keyStat(sh.stats, k).n >= 10) open.add(k); });
    return G.ORDER.filter(k => open.has(k));
  }

  /* ---------- one drill tool ---------- */
  function drill(cfg) {
    const tool = {
      init(ctx) {
        const P = ctx.panel, st = ctx.state, tier = ctx.tool.difficulty || 'medium', insane = tier === 'insane';
        st.opt = st.opt || {}; st.best = st.best || {};
        const opt = () => (cfg.options && cfg.options.some(o => o.id === st.opt[cfg.id])) ? st.opt[cfg.id] : (cfg.options ? cfg.options[0].id : '');
        P.innerHTML = `
          ${NEEDS ? '<p class="note">Typing needs a keyboard. Connect one to this phone or tablet, or tap the words to use the on-screen keyboard.</p>' : ''}
          <div class="dbar">
            ${cfg.options ? `<div class="seg" role="group" aria-label="${esc(cfg.optLabel || 'Which drill')}">${cfg.options.map(o => `<button type="button" data-o="${o.id}">${esc(o.label)}</button>`).join('')}</div>` : `<h2 style="margin:0">${esc(ctx.tool.name)}</h2>`}
            <div class="row">
              ${insane ? '' : '<button class="iconbtn" data-x="wait" title="When it is on, a wrong key has to be fixed before you go on"></button>'}
              <button class="iconbtn" data-x="kb"></button>
            </div>
          </div>
          <div class="dgoal"></div>
          <div class="dtype"></div>
          <p class="msg dmsg" role="status"></p>
          <div class="dkb"></div>`;
        const msg = $('.dmsg', P), kbHost = $('.dkb', P), goalEl = $('.dgoal', P);
        let kb = null, kbRows = '';
        const topts = {
          wait: insane ? false : shared().wait, noBack: insane,
          onKey: info => { if (kb) kb.only('next', SBTY.keysFor(info.next)); if (kb && !info.good && info.key !== 'Backspace') kb.flash(info.key, false); },
          onDone: done
        };
        const typer = SBTY.typer($('.dtype', P), topts);
        tool._typer = typer;

        function goal() { return { acc: GOAL_ACC[tier], wpm: shared().target }; }
        function paintGoal() {
          const g = goal(), b = st.best[cfg.id + ':' + opt()];
          goalEl.innerHTML = `<span>Goal: <b>${pct(g.acc)} right</b> and <b>${g.wpm} words a minute</b></span>
            <label>Target speed <select data-x="target" title="Words a minute">${[10, 15, 20, 25, 30, 35, 40, 50].map(v => `<option value="${v}"${v === g.wpm ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
            ${insane ? '<span>No Backspace here: mistakes stay.</span>' : ''}
            ${cfg.note ? cfg.note(shared()) : ''}
            <span>${b ? `Best: ${b.stars} ${b.stars === 1 ? 'star' : 'stars'}, ${wpmTxt(b.wpm)}, ${pct(b.acc)}` : 'No rounds yet'}</span>`;
          $('[data-x="target"]', goalEl).onchange = e => { const v = Number(e.target.value); saveShared(s => { s.target = v; }); e.target.blur(); typer.active(); paintGoal(); };
        }
        function paintOpts() {
          P.querySelectorAll('[data-o]').forEach(b => b.setAttribute('aria-pressed', b.dataset.o === opt()));
          const sh = shared(), w = $('[data-x="wait"]', P), k = $('[data-x="kb"]', P);
          if (w) { w.textContent = 'Fix mistakes: ' + (sh.wait ? 'on' : 'off'); w.setAttribute('aria-pressed', sh.wait); }
          k.textContent = 'Keyboard: ' + (sh.showKb ? 'on' : 'off'); k.setAttribute('aria-pressed', sh.showKb);
          kbHost.hidden = !sh.showKb;
        }
        function buildKb() {
          const rows = cfg.rows ? cfg.rows(opt()) : 'letters';
          if (kb && rows === kbRows) return;
          kbHost.innerHTML = ''; kbRows = rows;
          kb = SBTY.keyboard(kbHost, { rows, zones: true, onTap: k => { typer.active(); typer.type(k); } });
        }
        function newRound() {
          buildKb();
          const text = cfg.gen(opt(), shared());
          kb.dimExcept(cfg.keys ? cfg.keys(opt()) : null);
          if (!cfg.keys) kb.clear('off');
          if (!text) { typer.reset(''); typer.stop(); msg.innerHTML = cfg.empty || ''; return; }
          typer.reset(text); typer.active();
          kb.only('next', SBTY.keysFor(typer.next()));
        }
        function done(r) {
          const g = goal(), stars = G.stars(r, g), key = cfg.id + ':' + opt();
          saveShared(s => { s.stats = G.addRound(s.stats && typeof s.stats === 'object' ? s.stats : {}, r.chars.map(c => ({ ch: c.ch, ok: c.ok, ms: c.ms }))); });
          const b = st.best[key];
          if (!b || stars > b.stars || (stars === b.stars && r.wpm > b.wpm)) st.best[key] = { stars, wpm: Math.round(r.wpm * 10) / 10, acc: Math.round(r.acc * 1000) / 1000 };
          ctx.save();
          ctx.result(stars, 3);
          if (stars >= 2) ctx.credit();
          if (stars === 3) ctx.sfx.win();
          const missed = [...new Set(r.chars.filter(c => !c.ok && c.ch !== ' ').map(c => c.ch))].slice(0, 8);
          msg.className = 'msg dmsg' + (stars === 3 ? ' good' : '');
          msg.innerHTML = `<span class="stars" aria-hidden="true">${[0, 1, 2].map(i => `<span class="${i < stars ? '' : 'off'}">&#9733;</span>`).join('')}</span>` +
            `${stars} ${stars === 1 ? 'star' : 'stars'}: <b>${wpmTxt(r.wpm)}</b>, <b>${pct(r.acc)}</b> right.` +
            (stars === 3 ? ' You reached the goal!' : stars === 2 ? ' Accuracy goal reached. Now try a little faster.' : ' Slow down and aim for fewer mistakes.') +
            (missed.length ? ` Keys to practice: <b>${missed.map(esc).join(' ')}</b>` : '');
          paintGoal();
          newRound();
        }

        P.querySelectorAll('[data-o]').forEach(b => b.onclick = () => { st.opt[cfg.id] = b.dataset.o; ctx.save(); paintOpts(); paintGoal(); msg.textContent = ''; newRound(); b.blur(); });
        const w = $('[data-x="wait"]', P);
        if (w) w.onclick = () => { saveShared(s => { s.wait = s.wait === false; }); topts.wait = shared().wait; paintOpts(); newRound(); w.blur(); };
        $('[data-x="kb"]', P).onclick = e => { saveShared(s => { s.showKb = s.showKb === false; }); paintOpts(); e.currentTarget.blur(); };
        paintOpts(); paintGoal();
        msg.textContent = cfg.lead || 'Start typing when you are ready.';
        newRound();
        tool._refresh = () => { topts.wait = insane ? false : shared().wait; paintOpts(); paintGoal(); };
      },
      enter() { if (tool._refresh) tool._refresh(); if (tool._typer) tool._typer.active(); }
    };
    return tool;
  }

  const ROWKEYS = { home: 'asdfghjkl;', top: 'qwertyuiop', bottom: 'zxcvbnm,.', number: '1234567890-' };
  const tools = {
    rows: drill({
      id: 'rows', optLabel: 'Which row',
      options: [{ id: 'home', label: 'Home row' }, { id: 'top', label: 'Top row' }, { id: 'bottom', label: 'Bottom row' }, { id: 'number', label: 'Number row' }],
      lead: 'Keep your fingers on the home row and reach for each key.',
      gen: o => G.rowDrill(o), keys: o => ROWKEYS[o].split(''), rows: o => o === 'number' ? 'full' : 'letters'
    }),
    marks: drill({
      id: 'marks', optLabel: 'Capitals or punctuation',
      options: [{ id: 'caps', label: 'Capitals' }, { id: 'punct', label: 'Punctuation' }],
      lead: 'For a capital, hold Shift with the other hand. The keyboard lights up both keys.',
      gen: o => o === 'caps' ? G.capitalsDrill() : G.punctDrill(), rows: () => 'full'
    }),
    words: drill({
      id: 'words', optLabel: 'How many words to pick from',
      options: [{ id: '100', label: 'Top 100' }, { id: '300', label: 'Top 300' }, { id: '1000', label: 'Top 1,000' }],
      lead: 'These are some of the most common words in English.',
      gen: o => G.commonWords(Math.random, Number(o))
    }),
    sentences: drill({
      id: 'sentences', optLabel: 'Which sentences',
      options: [{ id: 'plain', label: 'Sentences' }, { id: 'num', label: 'With numbers' }],
      lead: 'Capitals, commas, and periods count, just like letters.',
      gen: o => G.pickText(o === 'num' ? X.numbers : X.sentences, 3), rows: o => o === 'num' ? 'full' : 'letters'
    }),
    paragraphs: drill({
      id: 'paragraphs',
      lead: 'A whole paragraph, with no Backspace. Mistakes stay, so take your time.',
      gen: () => G.pickText(X.paragraphs, 1), rows: () => 'full'
    }),
    weak: drill({
      id: 'weak',
      lead: 'Words that use the letters you type slowest or miss most.',
      empty: 'Weak keys needs some typing first. Do a few rounds in <a href="../learn-keys/index.html?tool=lesson">Learn the Keys</a> or the other drills, then come back.',
      gen: (o, sh) => G.weakDrill(sh.stats, knownLetters(sh), sh.target),
      note: sh => { const w = G.weakLetters(sh.stats, knownLetters(sh), sh.target); return w.length ? `<span>Practicing: <b>${w.map(esc).join(' ')}</b></span>` : ''; }
    })
  };

  SBM.start({ module: 'typing-drills', defaults: { opt: {}, best: {} }, tools });
})();
