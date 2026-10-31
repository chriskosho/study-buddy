/* Study Buddy typing: the page parts every typing tool shares. Needs sb-core.js; the styles are in sb-typing.css.

     SBTY.keyboard(host, { rows: 'full'|'letters', zones: true, onTap(k) })
         Draws a US QWERTY keyboard (SVG) in host. tapAll: Shift, Enter and the other wide keys can be tapped too. Returns { el, set(k, cls, on), only(cls, keys), dimExcept(keys), clear(cls), flash(k, good), heat(map) }.
         Key ids are the characters they type ('a', ';', ' ' for the space bar). zones: color each key by the finger that presses it.
     SBTY.typer(host, { text, wait, noBack, onStart(), onKey(info), onDone(result) })
         Shows the text and takes keystrokes for it. wait: a wrong key does not move on (the default). noBack: Backspace does nothing (Insane).
         Returns { reset(text), active(), stop(), pos(), next() } and calls onDone({ chars, correct, presses, wrong, elapsed, wpm, acc }).
     SBTY.keysFor(ch)     the keys for a character, with the other hand's Shift for capitals and symbols like ?
     SBTY.finger(k)        { hand: 'left'|'right'|'thumb', finger: 'pinky'|'ring'|'middle'|'pointer'|'thumb', name: 'left pointer finger' }
     SBTY.needsKeyboard()  true on a phone or tablet with no mouse (the tools show a notice there)

   Keys are read from the whole page while a typing tool is on screen, so the student never has to click into a box first.
   Phones and tablets with only an on-screen keyboard use a hidden text box instead (tap the text to open the keyboard). */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- the keyboard ---------- */
  /* [label, id, width] in key units; the id is what the key types */
  const ROWS = [
    [['`', '`'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6'], ['7', '7'], ['8', '8'], ['9', '9'], ['0', '0'], ['-', '-'], ['=', '='], ['Backspace', 'Backspace', 2]],
    [['Tab', 'Tab', 1.5], ['Q', 'q'], ['W', 'w'], ['E', 'e'], ['R', 'r'], ['T', 't'], ['Y', 'y'], ['U', 'u'], ['I', 'i'], ['O', 'o'], ['P', 'p'], ['[', '['], [']', ']'], ['\\', '\\', 1.5]],
    [['Caps', 'CapsLock', 1.75], ['A', 'a'], ['S', 's'], ['D', 'd'], ['F', 'f'], ['G', 'g'], ['H', 'h'], ['J', 'j'], ['K', 'k'], ['L', 'l'], [';', ';'], ["'", "'"], ['Enter', 'Enter', 2.25]],
    [['Shift', 'ShiftLeft', 2.25], ['Z', 'z'], ['X', 'x'], ['C', 'c'], ['V', 'v'], ['B', 'b'], ['N', 'n'], ['M', 'm'], [',', ','], ['.', '.'], ['/', '/'], ['Shift', 'ShiftRight', 2.75]],
    [['', ' ', 6.25, 3.75]]
  ];
  const ZONE = {};
  [['`1qaz', 'lp'], ['2wsx', 'lr'], ['3edc', 'lm'], ['45rtfgvb', 'li'], ['67yuhjnm', 'ri'], ['8ik,', 'rm'], ['9ol.', 'rr'], ["0-=p[]\\;'/", 'rp']].forEach(([ks, z]) => [...ks].forEach(k => ZONE[k] = z));
  Object.assign(ZONE, { Tab: 'lp', CapsLock: 'lp', ShiftLeft: 'lp', Backspace: 'rp', Enter: 'rp', ShiftRight: 'rp', ' ': 'th' });
  const FNAME = { lp: ['left', 'pinky'], lr: ['left', 'ring'], lm: ['left', 'middle'], li: ['left', 'pointer'], ri: ['right', 'pointer'], rm: ['right', 'middle'], rr: ['right', 'ring'], rp: ['right', 'pinky'], th: ['thumb', 'thumb'] };
  function finger(k) {
    const z = ZONE[String(k).toLowerCase()] || ZONE[k]; if (!z) return null;
    const [hand, f] = FNAME[z];
    return { zone: z, hand, finger: f, name: hand === 'thumb' ? 'either thumb' : hand + ' ' + f + ' finger' };
  }
  const SHIFTED = { '~': '`', '!': '1', '@': '2', '#': '3', $: '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0', _: '-', '+': '=', '{': '[', '}': ']', '|': '\\', ':': ';', '"': "'", '<': ',', '>': '.', '?': '/' };
  /* the key a character is typed on (A and a are the same key) */
  const keyOf = ch => ch === ' ' ? ' ' : String(ch).length > 1 ? String(ch) : SHIFTED[ch] || String(ch).toLowerCase();   // named keys (ShiftLeft) pass through
  /* the keys pressed for a character: a capital or a shifted symbol also uses the Shift key on the other hand */
  function keysFor(ch) {
    if (ch == null) return [];
    const k = keyOf(ch), shift = /[A-Z]/.test(ch) || SHIFTED[ch];
    if (!shift) return [k];
    const z = ZONE[k] || '';
    return [k, z[0] === 'l' ? 'ShiftRight' : 'ShiftLeft'];
  }

  function keyboard(host, opts = {}) {
    const rows = opts.rows === 'letters' ? ROWS.slice(1) : ROWS, U = 100, G = 8;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${15 * U} ${rows.length * U}`);
    svg.setAttribute('class', 'sbkb' + (opts.zones ? ' zones' : '') + (opts.rows === 'letters' ? ' big' : ''));
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Keyboard');
    const keys = {};
    rows.forEach((row, ri) => {
      let x = 0;
      row.forEach(([label, id, w = 1, off = 0]) => {
        x += off * U;
        const g = document.createElementNS(NS, 'g'), wpx = w * U;
        g.setAttribute('class', 'k z-' + (ZONE[id] || 'none') + (id.length > 1 ? ' mod' : ''));
        g.dataset.k = id;
        g.innerHTML = `<rect x="${x + G / 2}" y="${ri * U + G / 2}" width="${wpx - G}" height="${U - G}" rx="14"/>` +
          (label ? `<text x="${x + (id.length > 1 ? 18 : wpx / 2)}" y="${ri * U + U / 2}" class="${id.length > 1 ? 'lbl s' : 'lbl'}">${esc(label)}</text>` : '') +
          (id === 'f' || id === 'j' ? `<line x1="${x + wpx / 2 - 14}" x2="${x + wpx / 2 + 14}" y1="${ri * U + U - 22}" y2="${ri * U + U - 22}" class="bump"/>` : '');
        svg.appendChild(g); keys[id] = g;
        x += wpx;
      });
    });
    if (opts.onTap) svg.addEventListener('pointerdown', e => { const g = e.target.closest('g.k'); if (g && (g.dataset.k.length === 1 || opts.tapAll)) { e.preventDefault(); opts.onTap(g.dataset.k); } });
    host.appendChild(svg);
    const get = k => keys[k] || keys[keyOf(k)];
    return {
      el: svg,
      set(k, cls, on = true) { const g = get(k); if (g) g.classList.toggle(cls, on); },
      only(cls, list) { const want = new Set((list || []).map(keyOf)); Object.keys(keys).forEach(k => keys[k].classList.toggle(cls, want.has(k))); },
      /* dim every key except these (and the space bar), to show which keys are in play */
      dimExcept(list) { const want = new Set((list || []).map(keyOf)); want.add(' '); Object.keys(keys).forEach(k => keys[k].classList.toggle('off', !want.has(k))); },
      clear(cls) { Object.values(keys).forEach(g => g.classList.remove(cls)); },
      flash(k, good) { const g = get(k); if (!g) return; const c = good ? 'hit' : 'miss'; g.classList.remove('hit', 'miss'); void g.getBBox; g.classList.add(c); clearTimeout(g._t); g._t = setTimeout(() => g.classList.remove(c), 260); },
      /* heat: { key: 0..4 } colors keys from weak (0) to strong (4); keys not listed are plain */
      heat(map) { Object.keys(keys).forEach(k => { for (let i = 0; i < 5; i++) keys[k].classList.remove('h' + i); if (map && map[k] != null) keys[k].classList.add('h' + map[k]); }); },
      keys
    };
  }

  /* ---------- devices ---------- */
  function needsKeyboard() {
    try { return matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches; } catch (e) { return false; }
  }

  /* ---------- reading keys ----------
     One listener for the page; the tool on screen gets the keys. A key is ignored when a dialog is open, when the student is
     typing in another box (search, settings), or with Ctrl, Alt or the Windows/Command key (so browser shortcuts still work). */
  let current = null;
  function handlerFor(t) { current = t; }
  const busy = e => document.querySelector('.sb-ov') || (e.target && e.target.closest && e.target.closest('input,textarea,select,[contenteditable]') && !e.target.classList.contains('sbty-in'));
  document.addEventListener('keydown', e => {
    if (!current || !current.live()) return;
    if (e.ctrlKey || e.metaKey || e.altKey || busy(e)) return;
    if (e.key === 'Unidentified' || e.key === 'Process' || e.keyCode === 229) return;   // an on-screen keyboard: the hidden box's input event handles it
    /* a tool can ask for the named keys too (the Keyboard map shows their finger); Tab still moves between buttons */
    const named = { Shift: e.code === 'ShiftRight' ? 'ShiftRight' : 'ShiftLeft', Enter: 'Enter', CapsLock: 'CapsLock', Backspace: 'Backspace', Tab: 'Tab' }[e.key];
    if (named && current.named) { if (named !== 'Tab' && named !== 'Enter') e.preventDefault(); current.named(named); return; }
    if (e.key === 'Backspace') { e.preventDefault(); current.back(); return; }
    if (e.key.length !== 1) return;                       // Shift, Tab, arrows, Escape: not typing
    e.preventDefault();                                    // stops the space bar scrolling the page or pressing a button
    if (e.repeat) return;                                  // a key held down types once
    current.type(e.key, e.getModifierState && e.getModifierState('CapsLock'));
  }, true);

  /* ---------- the text and the keystrokes ---------- */
  function typer(host, opts = {}) {
    host.classList.add('sbty');
    host.innerHTML = `<div class="sbty-text" aria-hidden="true"></div><div class="sbty-caps" hidden>Caps Lock is on. Press Caps Lock to turn it off.</div>
      <input class="sbty-in" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Type the text here" enterkeyhint="next">
      <div class="sbty-sr" aria-live="polite"></div>`;
    const box = host.querySelector('.sbty-text'), inp = host.querySelector('.sbty-in'), caps = host.querySelector('.sbty-caps'), sr = host.querySelector('.sbty-sr');
    let spans = [], text = '', marks = [], pos = 0, t0 = 0, tLast = 0, presses = 0, wrong = 0, elapsed = 0, chars = [], stopped = false, missedHere = false;

    function render() {
      /* each word sits in a no-wrap group, so lines only break at spaces */
      let h = '', inWord = false;
      [...text].forEach((c, i) => {
        if (c === ' ') { if (inWord) { h += '</span>'; inWord = false; } h += `<span class="c sp" data-i="${i}"><i>&middot;</i></span><wbr>`; }
        else { if (!inWord) { h += '<span class="w">'; inWord = true; } h += `<span class="c" data-i="${i}">${esc(c)}</span>`; }
      });
      box.innerHTML = h + (inWord ? '</span>' : '');
      spans = [...box.querySelectorAll('.c')];
      paint();
    }
    function paint() {
      for (let i = 0; i < spans.length; i++) {
        const m = marks[i], s = spans[i];
        s.className = 'c' + (text[i] === ' ' ? ' sp' : '') + (i < pos ? (m === 'ok' ? ' ok' : ' bad') : i === pos ? ' cur' + (missedHere ? ' miss' : '') : '');
      }
      const cur = spans[pos]; if (cur && cur.offsetTop > box.clientHeight * 0.55 + box.scrollTop) box.scrollTop = cur.offsetTop - box.clientHeight * 0.3;
    }
    function reset(t) {
      text = String(t); seen = ''; inp.value = ''; marks = []; pos = 0; t0 = 0; tLast = 0; presses = 0; wrong = 0; elapsed = 0; chars = []; stopped = false; missedHere = false;
      box.scrollTop = 0; render();
    }
    /* the gap between two keys counts at most 3 seconds, so a break in the middle does not spoil the speed */
    function tick(now) { if (tLast) elapsed += Math.min(now - tLast, 3000); tLast = now; }
    function type(k, capsOn) {
      if (stopped || pos >= text.length) return;
      /* a capital where the small letter is wanted (Caps Lock or Shift is on) is not counted: the student is told why instead */
      if (/^[A-Z]$/.test(k) && k.toLowerCase() === text[pos]) {
        caps.textContent = capsOn ? 'Caps Lock is on. Press Caps Lock to turn it off.' : 'That was a capital letter. Let go of Shift.';
        caps.hidden = false; return;
      }
      caps.hidden = true;
      const now = performance.now();
      if (!t0) { t0 = now; tLast = now; if (opts.onStart) opts.onStart(); }
      const prev = tLast; tick(now);
      presses++;
      const want = text[pos], good = k === want;
      if (good) {
        chars.push({ ch: want, ok: !missedHere && marks[pos] !== 'bad', ms: pos === 0 ? 0 : now - prev });   // a letter fixed after Backspace still counts as a mistake
        if (marks[pos] == null) marks[pos] = 'ok';
        pos++; missedHere = false;
      } else {
        wrong++;
        if (!missedHere) { marks[pos] = 'bad'; }
        if (opts.wait === false) { chars.push({ ch: want, ok: false, ms: 0 }); pos++; missedHere = false; }
        else missedHere = true;
      }
      paint();
      if (opts.onKey) opts.onKey({ key: k, want, good, pos, next: text[pos] });
      if (pos >= text.length) finish();
    }
    /* Backspace only matters when wrong keys move on (wait is off): it steps back so the letter can be fixed */
    function back() {
      if (stopped || opts.wait !== false || opts.noBack || pos === 0) return;
      pos--; chars.pop(); if (marks[pos] === 'ok') marks[pos] = null; paint();
      if (opts.onKey) opts.onKey({ key: 'Backspace', pos, next: text[pos] });
    }
    function finish() {
      stopped = true;
      const correct = marks.filter(m => m === 'ok').length;
      const r = { chars, correct, presses, wrong, elapsed, text };
      Object.assign(r, (window.SBTG ? SBTG.roundScore(r) : { wpm: 0, acc: 0 }));
      sr.textContent = 'Done. ' + Math.round(r.wpm) + ' words a minute, ' + Math.round(r.acc * 100) + ' percent right.';
      if (opts.onDone) opts.onDone(r);
    }

    /* on-screen keyboards send "input" events instead of keys */
    /* on-screen keyboards send "input" events instead of keys. Some build up a whole word in the box as you type, so only the
       letters added since last time are typed, and a shorter box means Backspace. The box is emptied after each space. */
    let seen = '';
    inp.addEventListener('input', () => {
      const v = inp.value;
      if (current === api && api.live()) {
        if (v.startsWith(seen)) [...v.slice(seen.length)].forEach(ch => type(ch, false));
        else if (seen.startsWith(v)) for (let i = v.length; i < seen.length; i++) back();
        else { let i = 0; while (i < v.length && v[i] === seen[i]) i++; for (let j = i; j < seen.length; j++) back(); [...v.slice(i)].forEach(ch => type(ch, false)); }   // a word was swapped
      }
      seen = v;
      if (/\s$/.test(v) || v.length > 30) { inp.value = ''; seen = ''; }
    });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') e.preventDefault(); });
    host.addEventListener('click', () => { if (needsKeyboard()) inp.focus({ preventScroll: true }); handlerFor(api); });

    const api = {
      reset, type, back,
      live: () => !stopped && host.isConnected && host.offsetParent !== null && (!opts.live || opts.live()),
      active() { handlerFor(api); },
      stop() { stopped = true; if (current === api) current = null; },
      pos: () => pos, next: () => text[pos], started: () => !!t0
    };
    reset(opts.text || '');
    handlerFor(api);
    return api;
  }

  window.SBTY = { keyboard, typer, finger, keyOf, keysFor, needsKeyboard, ZONE, take: handlerFor };
})();
