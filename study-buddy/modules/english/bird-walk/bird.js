/* A Bird, came down the Walk: the memorizing tools. The poem lives in data.js; the page shell comes from shared/sb-module.js. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = SB.esc;
  const S = POEM.stanzas, LINES = S.flat();
  const isMarked = (si, li) => POEM.marked.some(m => m[0] === si && m[1] === li);
  const speak = l => l.replace(/ -/g, '').trim();                       // the dashes are for the eye, not the voice
  const stanzaSpeech = si => S[si].map(speak).join('\n');
  const WORD = /^([^A-Za-z]*)([A-Za-z']+)([^A-Za-z]*)$/;
  const parts = t => { const m = t.match(WORD); return m ? { pre: m[1], core: m[2], post: m[3] } : null; };
  const norm = s => s.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
  function dist(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  const lettersOf = l => l.split(' ').map(t => { const p = parts(t); return p ? p.pre + p.core[0] + p.post : t; }).join(' ');
  const lineHTML = (l, mark) => mark ? `<mark class="hl">${esc(l)}</mark>` : esc(l);
  const stanzaOpts = (first) => (first || '') + S.map((_, i) => `<option value="${i}">Stanza ${i + 1}</option>`).join('');
  function setMsg(el, text, kind = '') { el.className = 'msg' + (kind ? ' ' + kind : ''); el.textContent = text; }
  const starsHTML = (s, n) => { const k = s / n >= 0.9 ? 3 : s / n >= 0.7 ? 2 : s / n >= 0.5 ? 1 : 0; return `<div class="stars">${[0, 1, 2].map(i => `<span class="${i < k ? '' : 'off'}">&#9733;</span>`).join('')}</div>`; };

  /* ===================== Read and listen ===================== */
  const read = {
    init(ctx) {
      const whole = POEM.title + ', by ' + POEM.author + '.\n' + S.map((_, i) => stanzaSpeech(i)).join('\n');
      ctx.panel.innerHTML = `<h2>Read and listen</h2>
        <p class="byline">&ldquo;${esc(POEM.title)}&rdquo; (${esc(POEM.number)}) by ${esc(POEM.author)}</p>
        <p class="lead">Read the poem a stanza at a time. Say each stanza out loud, then hear it.</p>
        <div class="row">${ctx.sayButton(whole, 'Hear the whole poem')}<span>Hear the whole poem</span></div>
        <div class="poem">${S.map((st, si) => `<div class="stz"><div class="top"><span>Stanza ${si + 1}</span>${ctx.sayButton(stanzaSpeech(si), 'Hear stanza ' + (si + 1))}</div>
          ${st.map((l, li) => `<p>${lineHTML(l, isMarked(si, li))}</p>`).join('')}</div>`).join('')}</div>
        <p class="note">The shaded lines are the ones highlighted on your printed copy.</p>`;
    }
  };

  /* ===================== Flashcards (shared tool) ===================== */
  const cards = {
    init(ctx) {
      SBT.flashcards(ctx, {
        modes: [{ id: 'next', label: 'What comes next?' }, { id: 'last', label: 'Last word' }],
        sections: { list: [{ id: 'all', label: 'Whole poem' }, ...S.map((_, i) => ({ id: 's' + i, label: 'Stanza ' + (i + 1) }))], start: 'all', noun: 'part' },
        build(mode, sec) {
          const from = sec === 'all' ? 0 : +sec.slice(1) * 4, to = sec === 'all' ? LINES.length : from + 4;
          const out = [];
          for (let i = from; i < to; i++) {
            const l = LINES[i];
            if (mode === 'next') {
              if (i === to - 1) continue;
              out.push({ front: `<div class="tag">What line comes next?</div><div class="big">${esc(l)}</div>`,
                back: `<div class="tag">Next line</div><div class="big">${esc(LINES[i + 1])}</div>${ctx.sayButton(speak(LINES[i + 1]), 'Hear it')}`, say: 'What line comes next? ' + speak(l) });
            } else {
              const tk = l.split(' '); let k = tk.length - 1; while (k > 0 && !parts(tk[k])) k--;
              const p = parts(tk[k]), shown = tk.map((t, j) => j === k ? esc(p.pre) + '_____' + esc(p.post) : esc(t)).join(' ');
              const full = tk.map((t, j) => j === k ? esc(p.pre) + `<mark class="hl">${esc(p.core)}</mark>` + esc(p.post) : esc(t)).join(' ');
              out.push({ front: `<div class="tag">What is the last word?</div><div class="big">${shown}</div>`,
                back: `<div class="tag">The line</div><div class="big">${full}</div>${ctx.sayButton(speak(l), 'Hear it')}`, say: 'What is the last word? ' + speak(l).replace(/\S+$/, '') });
            }
          }
          return out;
        }
      });
    }
  };

  /* ===================== Fill the blanks ===================== */
  const LEVELS = [{ id: 'few', label: 'A few blanks' }, { id: 'half', label: 'Half the words' }, { id: 'most', label: 'Almost every word' }];
  const blanks = {
    init(ctx) {
      const P = ctx.panel;
      P.innerHTML = `<h2>Fill the blanks</h2><p class="lead">Tap a blank, then tap the word that belongs there. Press Check when every blank is full.</p>
        <div class="stzsel"><label for="bstz">Stanza</label><select id="bstz" class="secsel">${stanzaOpts('<option value="r">Any stanza</option>')}</select></div>
        <div class="seg" role="group" aria-label="How many blanks">${LEVELS.map((l, i) => `<button data-l="${l.id}" aria-pressed="${i === 0}">${l.label}</button>`).join('')}</div>
        <div class="lines"></div><div class="chips"></div><p class="msg"></p>
        <div class="row"><button class="btn" data-a="check" disabled>Check</button><button class="btn ghost" data-a="again" hidden>Try again</button><button class="btn ghost" data-a="new">New round</button><span class="hear"></span></div>`;
      const linesEl = $('.lines', P), chipsEl = $('.chips', P), msg = $('.msg', P), check = $('[data-a="check"]', P), again = $('[data-a="again"]', P);
      let level = 'few', B;
      function pick(si) {
        const bl = [];
        S[si].forEach((l, li) => {
          const tk = l.split(' '), words = tk.map((t, ti) => ({ ti, p: parts(t) })).filter(x => x.p);
          let chosen;
          if (level === 'few') { const c = words.slice(1).filter(x => x.p.core.length >= 4); const pool = c.length ? c : words.slice(1); chosen = [pool[Math.floor(Math.random() * pool.length)]]; }
          else if (level === 'half') chosen = words.filter((_, k) => k % 2 === 1);
          else chosen = words.slice(1);
          chosen.forEach(x => bl.push({ li, ti: x.ti, core: x.p.core, chip: null }));
        });
        return bl;
      }
      function newRound() {
        const sv = $('#bstz', P).value, si = sv === 'r' ? Math.floor(Math.random() * S.length) : +sv;
        const bl = pick(si);
        B = { si, bl, chips: shuffle(bl.map((b, k) => ({ id: k, core: b.core, used: false }))), sel: null, checked: false, scored: false };
        $('.hear', P).innerHTML = ctx.sayButton(stanzaSpeech(si), 'Hear stanza ' + (si + 1));
        again.hidden = true; setMsg(msg, 'Stanza ' + (si + 1) + '.'); render();
      }
      function render(marks) {
        linesEl.innerHTML = S[B.si].map((l, li) => `<div class="ln">${l.split(' ').map((t, ti) => {
          const k = B.bl.findIndex(b => b.li === li && b.ti === ti);
          if (k < 0) return esc(t);
          const p = parts(t), b = B.bl[k], cls = ['blank', b.chip ? 'filled' : '', B.sel === k ? 'on' : '', marks ? (marks[k] ? 'right' : 'wrong') : ''].join(' ');
          return esc(p.pre) + `<button type="button" class="${cls}" data-b="${k}" aria-label="Blank ${k + 1}${b.chip ? ', ' + esc(b.chip.core) : ', empty'}">${b.chip ? esc(b.chip.core) : '&nbsp;'}</button>` + (marks && !marks[k] ? `<span class="fix">${esc(b.core)}</span>` : '') + esc(p.post);
        }).join(' ')}</div>`).join('');
        chipsEl.innerHTML = B.chips.map(c => `<button type="button" class="chip${c.used ? ' used' : ''}" data-c="${c.id}" ${c.used || B.checked ? 'disabled' : ''}>${esc(c.core)}</button>`).join('');
        check.disabled = B.checked || !B.bl.every(b => b.chip);
        $$('.blank', linesEl).forEach(el => el.onclick = () => { if (B.checked) return; const k = +el.dataset.b, b = B.bl[k]; if (b.chip) { b.chip.used = false; b.chip = null; } B.sel = k; render(); });
        $$('.chip', chipsEl).forEach(el => el.onclick = () => {
          const c = B.chips.find(x => x.id === +el.dataset.c); if (!c || c.used) return;
          let k = B.sel !== null && !B.bl[B.sel].chip ? B.sel : B.bl.findIndex(b => !b.chip); if (k < 0) return;
          B.bl[k].chip = c; c.used = true; B.sel = B.bl.findIndex(b => !b.chip); if (B.sel < 0) B.sel = null; render();
          const nx = $('.chip:not(.used):not(:disabled)', chipsEl) || check; nx.focus();
        });
      }
      check.onclick = () => {
        const marks = B.bl.map(b => b.chip.core.toLowerCase() === b.core.toLowerCase()), right = marks.filter(Boolean).length;
        B.checked = true;
        if (!B.scored) { B.scored = true; ctx.result(right, B.bl.length); if (right === B.bl.length) { ctx.credit(); ctx.sfx.win(); } else { ctx.slip(); ctx.sfx.bad(); } }
        render(marks); again.hidden = false;
        setMsg(msg, right === B.bl.length ? 'Every word is right!' : right + ' of ' + B.bl.length + ' are right. The right words are in red. Your score counts your first check.', right === B.bl.length ? 'good' : 'bad');
      };
      again.onclick = () => { B.bl.forEach(b => b.chip = null); B.chips.forEach(c => c.used = false); B.sel = null; B.checked = false; again.hidden = true; setMsg(msg, 'Practice again. This try does not change your score.'); render(); };
      $('[data-a="new"]', P).onclick = newRound;
      $('#bstz', P).onchange = newRound;
      $$('.seg button', P).forEach(b => b.onclick = () => { level = b.dataset.l; $$('.seg button', P).forEach(x => x.setAttribute('aria-pressed', x === b)); newRound(); });
      newRound();
    }
  };

  /* ===================== First letters (practice only) ===================== */
  const HINTS = [{ id: 'letters', label: 'First letters' }, { id: 'word', label: 'First word only' }, { id: 'none', label: 'Nothing' }];
  const letters = {
    init(ctx) {
      const P = ctx.panel;
      P.innerHTML = `<h2>First letters</h2><p class="lead">Say each line out loud, then tap it to check. Practice only.</p>
        <div class="stzsel"><label for="lstz">Stanza</label><select id="lstz" class="secsel">${stanzaOpts()}</select><span class="hear"></span></div>
        <div class="seg" role="group" aria-label="How much to show">${HINTS.map((l, i) => `<button data-h="${l.id}" aria-pressed="${i === 0}">${l.label}</button>`).join('')}</div>
        <div class="lines"></div>
        <div class="row"><button class="btn ghost" data-a="all">Show all</button><button class="btn ghost" data-a="hide">Hide all</button><button class="btn" data-a="next">Next stanza</button></div>`;
      const linesEl = $('.lines', P), sel = $('#lstz', P);
      let hint = 'letters', open = new Set();
      function hintText(l, li) {
        if (hint === 'letters') return lettersOf(l);
        if (hint === 'word') return l.split(' ')[0] + ' ...';
        return 'Line ' + (li + 1);
      }
      function render() {
        const si = +sel.value;
        $('.hear', P).innerHTML = ctx.sayButton(stanzaSpeech(si), 'Hear stanza ' + (si + 1));
        linesEl.innerHTML = S[si].map((l, li) => `<button type="button" class="ln${open.has(li) ? ' open' : ''}" data-i="${li}" aria-expanded="${open.has(li)}">${open.has(li) ? lineHTML(l, isMarked(si, li)) : `<span class="hint">${esc(hintText(l, li))}</span>`}</button>`).join('');
        $$('.ln', linesEl).forEach(b => b.onclick = () => { const i = +b.dataset.i; open.has(i) ? open.delete(i) : open.add(i); render(); const nb = $(`.ln[data-i="${i}"]`, linesEl); if (nb) nb.focus(); });
      }
      sel.onchange = () => { open = new Set(); render(); };
      $$('.seg button', P).forEach(b => b.onclick = () => { hint = b.dataset.h; open = new Set(); $$('.seg button', P).forEach(x => x.setAttribute('aria-pressed', x === b)); render(); });
      $('[data-a="all"]', P).onclick = () => { open = new Set([0, 1, 2, 3]); render(); };
      $('[data-a="hide"]', P).onclick = () => { open = new Set(); render(); };
      $('[data-a="next"]', P).onclick = () => { sel.value = String((+sel.value + 1) % S.length); open = new Set(); render(); };
      render();
    }
  };

  /* ===================== Put the lines in order (shared tool) ===================== */
  const order = {
    init(ctx) {
      SBT.order(ctx, {
        title: 'Put the lines in order',
        lead: 'Drag the lines into the order the poem says them, or use the arrows. Then press Check.',
        sets: [...S.map((st, i) => ({ id: 's' + i, label: 'Stanza ' + (i + 1), items: st.map(text => ({ text })) })),
          { id: 'stz', label: 'The five stanzas', hint: 'Each card is the first line of a stanza. Put the stanzas in order.', items: S.map(st => ({ text: st[0] })) },
          { id: 'mix', label: 'Six lines from anywhere', pick: 6, hint: 'Six lines from across the poem. Put them in the order they come.', items: LINES.map(text => ({ text })) }]
      });
    }
  };

  /* ===================== Type it from memory ===================== */
  function typer(ctx, mode) {
    const P = ctx.panel, recite = mode === 'recite';
    let T;
    function start() { T = { order: recite ? [0, 1, 2, 3, 4] : shuffle([0, 1, 2, 3, 4]), i: 0, right: 0, total: 0, hinted: false, checked: false }; show(); }
    function show() {
      if (T.i >= S.length) return finish();
      const si = T.order[T.i], st = S[si], first = recite ? 0 : 1;
      T.hinted = false; T.checked = false;
      P.innerHTML = `<h2>${recite ? 'Say the whole poem' : 'Type it from memory'}</h2>
        <p class="lead">${recite ? 'Type each stanza of the poem, one line at a time. Nothing is shown but the stanza number.' : 'The first line of a stanza is shown. Type the other three lines.'} Capital letters and dashes do not matter.</p>
        <p class="prog">${recite ? 'Stanza ' + (si + 1) + ' of 5' : 'Stanza ' + (T.i + 1) + ' of 5 in this round (it is stanza ' + (si + 1) + ' of the poem)'}</p>
        ${recite ? '' : `<div class="given row">${esc(st[0])} ${ctx.sayButton(speak(st[0]), 'Hear the first line')}</div>`}
        <div class="tin">${st.slice(first).map((l, k) => `<div class="li"><input type="text" data-k="${k + first}" aria-label="Line ${k + first + 1} of stanza ${si + 1}" autocomplete="off" autocapitalize="sentences" spellcheck="false"><span class="hl2" hidden></span><span class="ans" hidden></span></div>`).join('')}</div>
        <p class="msg"></p>
        <div class="row"><button class="btn" data-a="check">Check</button><button class="btn ghost" data-a="hint">Hint</button><button class="btn" data-a="next" hidden>${T.i === S.length - 1 ? 'See my score' : 'Next stanza'}</button></div>`;
      const inputs = $$('.tin input', P), msg = $('.msg', P), check = $('[data-a="check"]', P), nextB = $('[data-a="next"]', P), hintB = $('[data-a="hint"]', P);
      inputs.forEach((inp, n) => inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); if (T.checked) return; n < inputs.length - 1 ? inputs[n + 1].focus() : check.click(); } });
      hintB.onclick = () => {
        T.hinted = true; hintB.disabled = true;
        $$('.tin .li', P).forEach(li => { const h = $('.hl2', li); h.hidden = false; h.textContent = lettersOf(st[+$('input', li).dataset.k]); });
        setMsg(msg, 'A hint was used, so this stanza does not count toward your score.');
      };
      check.onclick = () => {
        if (T.checked) return; T.checked = true;
        let right = 0;
        inputs.forEach(inp => {
          const k = +inp.dataset.k, want = norm(st[k]), got = norm(inp.value), exact = got === want;
          const ok = exact || (got.length > 0 && dist(got, want) <= 2);
          inp.disabled = true; inp.classList.add(ok ? 'right' : 'wrong');
          const ans = $('.ans', inp.parentNode);
          if (!ok || !exact) { ans.hidden = false; ans.textContent = (ok ? 'Right! Check the spelling: ' : 'It is: ') + st[k]; if (ok) ans.style.color = 'var(--ink2)'; }
          if (ok) right++;
        });
        const all = right === inputs.length;
        if (!T.hinted) { T.right += right; }
        T.total += inputs.length;
        if (all && !T.hinted) { ctx.credit(); ctx.sfx.win(); } else { ctx.slip(); ctx.sfx.bad(); }
        setMsg(msg, all ? (T.hinted ? 'Every line is right, but the hint means it does not count.' : 'Every line is right!') : right + ' of ' + inputs.length + ' lines are right. The right lines are in red.', all ? 'good' : 'bad');
        check.hidden = true; hintB.hidden = true; nextB.hidden = false; nextB.focus();
      };
      nextB.onclick = () => { T.i++; show(); };
      inputs[0].focus();
    }
    function finish() {
      ctx.result(T.right, T.total);
      P.innerHTML = `<h2>${recite ? 'Say the whole poem' : 'Type it from memory'}</h2>${starsHTML(T.right, T.total)}
        <p class="lead"><b>${T.right} of ${T.total}</b> lines right on the first try, without a hint.</p>
        <div class="row"><button class="btn" data-a="again">Play again</button></div>`;
      $('[data-a="again"]', P).onclick = start;
    }
    start();
  }
  const type = { init(ctx) { typer(ctx, 'type'); } };
  const recite = { init(ctx) { typer(ctx, 'recite'); } };

  SBM.start({ module: 'bird-walk', defaults: {}, tools: { read, cards, blanks, letters, order, type, recite } });
})();
